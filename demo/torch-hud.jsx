/* ============================================================
   M.O. SYSTEM — TORCH DEMO HUD  (React overlay + stage layer)
   ------------------------------------------------------------
   <TorchDemoLayer active onClose tweaks /> — mirrors the wafer
   production HUD shell: boot console during the intro;
   live telemetry left, CONSOLE rail right, morse line bottom-
   centre while SOS runs. The rail's SW1/SW2 caps drive the SAME
   firmware state machine as clicking the 3D switches.
   ============================================================ */
const { useState: useTH, useEffect: useETH, useRef: useRTH } = React;

const TORCH_SOS_GLYPHS = ["·", "·", "·", "—", "—", "—", "·", "·", "·"];

function TorchSwitchCap({ n, hint, onDown, onUp }) {
  const [down, setDown] = useTH(false);
  const fire = (d) => { setDown(d); (d ? onDown : onUp)(); };
  return (
    <button
      className={"hvd2-sw " + (down ? "is-down" : "")}
      onPointerDown={(e) => { e.preventDefault(); e.currentTarget.setPointerCapture?.(e.pointerId); fire(true); }}
      onPointerUp={() => fire(false)}
      onPointerCancel={() => fire(false)}
      onPointerLeave={() => { if (down) fire(false); }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <span className="hvd2-sw__k">SW{n} · [{n}]</span>
      <span className="hvd2-sw__hint">{hint}</span>
    </button>
  );
}

function TorchDemoLayer({ active, onClose, tweaks }) {
  const stageRef = useRTH(null);
  const [phase, setPhase] = useTH("idle");
  const [bootLines, setBootLines] = useTH([]);
  const [power, setPower] = useTH(false);
  const [color, setColor] = useTH("white");
  const [bright, setBright] = useTH(0.7);
  const [battery, setBattery] = useTH(1);
  const [sos, setSos] = useTH(null);
  const [battShow, setBattShow] = useTH(false);
  const [lastAction, setLastAction] = useTH(null);
  const [mode, setMode] = useTH("solid");
  const [turntable, setTurntable] = useTH(false);
  const [soundOn, setSoundOn] = useTH(true);

  useETH(() => {
    const D = window.TorchDemo;
    const offs = [
      ["phase", (p) => { setPhase(p); if (p === "intro") setBootLines([]); }],
      ["boot", (l) => setBootLines((b) => [...b, l])],
      ["power", setPower],
      ["color", setColor],
      ["bright", setBright],
      ["battery", setBattery],
      ["sos", setSos],
      ["battshow", setBattShow],
      ["action", setLastAction],
      ["mode", setMode],
      ["turntable", setTurntable],
      ["sound", setSoundOn],
    ].map(([ev, cb]) => [ev, D.on(ev, cb)]);
    return () => offs.forEach(([ev, cb]) => D.off(ev, cb));
  }, []);

  useETH(() => {
    const D = window.TorchDemo;
    if (active) {
      setBootLines([]); setPower(false); setColor("white"); setBright(0.7);
      setBattery(1); setSos(null); setBattShow(false); setLastAction(null);
      setMode("solid"); setTurntable(false);
      D.start({
        mount: stageRef.current,
        direction: (tweaks && tweaks.direction) || "cinematic",
      });
      setSoundOn(D.state.soundOn);
    } else if (D.isActive()) {
      D.stop();
    }
  }, [active]);

  useETH(() => {
    if (tweaks) {
      window.__demoTweaks = Object.assign(window.__demoTweaks || {}, tweaks);
      if (active && window.TorchDemo) window.TorchDemo.setSoundLevel(tweaks.soundLevel);
    }
  }, [tweaks, active]);

  const D = window.TorchDemo;
  const live = phase === "live";
  const intro = phase === "intro";
  const hudFull = !tweaks || tweaks.hud !== "minimal";

  const battPct = Math.round(battery * 100);
  const sosActive = !!sos;
  const sosIdx = sos && typeof sos.i === "number" ? sos.i : -1;
  /* map controller seq index (on/off steps) → glyph index (on steps only) */
  const glyphIdx = sosIdx >= 0 ? Math.floor(sosIdx / 2) % 9 : -1;

  const ledCol = battery > 0.4 ? "is-g" : "is-r";
  const ledN = Math.max(1, Math.ceil(battery * 4));

  return (
    <div className={"hvd " + (active ? "hvd--active " : "") + ("hvd--" + phase)} aria-hidden={!active} data-screen-label="06 Demo">
      <div className="hvd__stage" ref={stageRef} />

      <span className="hvd__corner hvd__corner--tl" />
      <span className="hvd__corner hvd__corner--tr" />
      <span className="hvd__corner hvd__corner--bl" />
      <span className="hvd__corner hvd__corner--br" />

      <div className="hvd__hud">
        <div className="hvd__hudRow"><span className="hvd__hudK">MODE</span><span className="hvd__hudV is-live">● {intro ? "BOOT" : "DEMO"}</span></div>
        <div className="hvd__hudRow"><span className="hvd__hudK">NODE</span><span className="hvd__hudV">0X04 · TORCH</span></div>
        <div className="hvd__hudRow"><span className="hvd__hudK">POWER</span><span className="hvd__hudV">{sosActive ? "SOS" : power ? "ON" : "OFF"}</span></div>
        <div className="hvd__hudRow"><span className="hvd__hudK">COLOR</span><span className="hvd__hudV">{color.toUpperCase()}</span></div>
      </div>

      <div className="hvd__title"><b>TACTICAL FLASHLIGHT</b> · LIVE DEMO · PY32 · ARM-M0</div>

      <div className="hvd__topRight">
        <button className={"hvd-btn hvd-btn--snd " + (soundOn ? "is-on" : "")}
                onClick={() => setSoundOn(D.toggleSound())}>
          <span className="hvd-eq" aria-hidden="true"><i /><i /><i /></span>
          <span>{soundOn ? "FIELD · ON" : "MUTED"}</span>
        </button>
        <button className="hvd__close" onClick={onClose}>
          <span>STOP</span>
          <span className="hvd__closeSep" />
          <span>[ESC]</span>
        </button>
      </div>

      {intro && (
        <div className="hvd__boot">
          {bootLines.map((l, i) => (
            <div key={i} className="hvd__bootLine"><span className="hvd__bootCaret">▸</span>{l}</div>
          ))}
          <button className="hvd-btn hvd__skip" onClick={() => D.skip()}>SKIP · [␣]</button>
        </div>
      )}

      {live && (
        <>
          {hudFull && (
            <div className="hvd__tele">
              <div className="hvd__hudRow"><span className="hvd__hudK">BRIGHT</span><span className="hvd__hudV">{String(Math.round(bright * 100)).padStart(3, "0")}%</span></div>
              <div className="hvd__hudRow"><span className="hvd__hudK">CELL</span><span className="hvd__hudV">{String(battPct).padStart(3, "0")}% · ×60 SIM</span></div>
              <div className="hvd__hudRow"><span className="hvd__hudK">LAST</span><span className="hvd__hudV">{lastAction || "—"}</span></div>
            </div>
          )}

          {/* SOS morse readout — rides the typing-line slot */}
          {sosActive && (
            <div className="hvd__type has-text">
              <span className="hvd__typeK">SOS</span>
              <span className="hvd2-morse">
                <span className="hvd2-morse__seq">
                  {TORCH_SOS_GLYPHS.map((g, i) => i === glyphIdx && sos.on
                    ? <b key={i}>{g}</b>
                    : <span key={i}>{g}</span>)}
                </span>
              </span>
            </div>
          )}

          <aside className="hvd__rail">
            <header className="hvd__railHead">
              <span className="hvd__railDot" />
              <span>CONSOLE · 0X04</span>
            </header>

            <div className="hvd__railSec">
              <div className="hvd__railRow"><span className="hvd__railK">SWITCHES</span></div>
              <div className="hvd2-swRow">
                <TorchSwitchCap n={1} hint="1× on · 2× color · hold ramp"
                                onDown={() => D.swDown(1)} onUp={() => D.swUp(1)} />
                <TorchSwitchCap n={2} hint="1× off · 3× SOS · hold batt"
                                onDown={() => D.swDown(2)} onUp={() => D.swUp(2)} />
              </div>
            </div>

            <div className="hvd__railSec">
              <div className="hvd__railRow">
                <span className="hvd__railK">BEAM</span>
                <span className="hvd__railV">{sosActive ? "SOS" : power ? Math.round(bright * 100) + "%" : "OFF"} · {color.toUpperCase()}</span>
              </div>
              <div className="hvd__segRow">
                <button className={"hvd-seg hvd-seg--white " + (color === "white" ? "is-on" : "")}
                        onClick={() => { if (color !== "white") { D.swDown(1); D.swUp(1); setTimeout(() => { D.swDown(1); D.swUp(1); }, 60); } }}>
                  <span className="hvd-seg__dot" />WHT
                </button>
                <button className={"hvd-seg hvd-seg--red " + (color === "red" ? "is-on" : "")}
                        onClick={() => { if (color !== "red") { D.swDown(1); D.swUp(1); setTimeout(() => { D.swDown(1); D.swUp(1); }, 60); } }}>
                  <span className="hvd-seg__dot" />RED
                </button>
              </div>
            </div>

            <div className="hvd__railSec">
              <div className="hvd__railRow">
                <span className="hvd__railK">CELL</span>
                <span className="hvd__railV">{battPct}%</span>
              </div>
              <div className="hvd2-batt">
                <div className="hvd2-batt__bar">
                  <div className={"hvd2-batt__fill " + (battery <= 0.4 ? "is-low" : "")} style={{ width: battPct + "%" }} />
                </div>
                <div className="hvd2-leds">
                  {[0, 1, 2, 3].map((i) => (
                    <span key={i} className={"hvd2-led " + ((battShow || battery < 0.05) && i < ledN ? ledCol : "")} />
                  ))}
                  <button className="hvd-seg hvd-seg--grow" onClick={() => D.recharge()}>SWAP CELL</button>
                </div>
              </div>
            </div>

            <div className="hvd__railSec">
              <div className="hvd__railRow"><span className="hvd__railK">VIEW</span></div>
              <div className="hvd__segRow">
                {[["solid", "SOLID"], ["xray", "X-RAY"], ["wire", "WIRE"]].map(([m, l]) => (
                  <button key={m} className={"hvd-seg " + (mode === m ? "is-on" : "")}
                          onClick={() => D.setMode(m)}>{l}</button>
                ))}
              </div>
            </div>

            <div className="hvd__railSec">
              <div className="hvd__segRow">
                <button className={"hvd-seg hvd-seg--grow " + (turntable ? "is-on" : "")}
                        onClick={() => D.setTurntable(!turntable)}>
                  <span className="hvd-seg__dot" />TURNTABLE
                </button>
              </div>
              <div className="hvd__segRow">
                <button className="hvd-seg hvd-seg--grow" onClick={() => D.resetView()}>RESET</button>
              </div>
            </div>
          </aside>

          <div className="hvd__hint">DRAG · ORBIT&nbsp;&nbsp;&nbsp;SCROLL · ZOOM&nbsp;&nbsp;&nbsp;CLICK THE SWITCHES · FIRMWARE PATTERNS&nbsp;&nbsp;&nbsp;KEYS [1] [2]</div>
        </>
      )}
    </div>
  );
}

window.TorchDemoLayer = TorchDemoLayer;
