/* ============================================================
   M.O. SYSTEM — POINTACCEL DEMO HUD  (React overlay)
   ------------------------------------------------------------
   <AccelDemoLayer active onClose tweaks /> — wafer HUD shell.
   Rail: presets, the real devicetree parameters as steppers
   (min/max factor, speed-threshold, speed-max, exponent,
   track-remainders), recenter, and EMIT DEVICETREE — a snippet
   overlay generated from the live params, copy-to-clipboard.
   ============================================================ */
const { useState: useAH, useEffect: useEAH, useRef: useRAH } = React;

function AccelStepper({ label, value, display, step, min, max, onChange }) {
  const bump = (d) => onChange(Math.max(min, Math.min(max, value + d * step)));
  return (
    <div className="hvd2-step">
      <span className="hvd2-step__k">{label}</span>
      <button className="hvd2-step__btn" onClick={() => bump(-1)}>−</button>
      <span className="hvd2-step__v">{display}</span>
      <button className="hvd2-step__btn" onClick={() => bump(1)}>+</button>
    </div>
  );
}

function AccelDtOverlay({ open, onClose }) {
  const [copied, setCopied] = useAH(false);
  const snippet = open ? window.AccelDemo.dtSnippet() : "";
  useEAH(() => { if (!open) setCopied(false); }, [open]);
  return (
    <div className={"hvd-kf-inspect " + (open ? "is-open" : "")} aria-hidden={!open}>
      <div className="hvd2-dt">
        <header className="hvd2-dt__head">
          <span>DEVICETREE · GENERATED FROM LIVE PARAMS</span>
          <button className="hvd-seg" onClick={onClose}>CLOSE</button>
        </header>
        <pre className="hvd2-dt__pre">{snippet}</pre>
        <button
          className={"hvd-seg hvd-seg--grow " + (copied ? "is-on" : "")}
          onClick={() => {
            navigator.clipboard && navigator.clipboard.writeText(snippet).then(() => setCopied(true));
            window.AccelDemo.emitFx();
          }}>
          <span className="hvd-seg__dot" />{copied ? "COPIED · PASTE INTO YOUR KEYMAP" : "COPY SNIPPET"}
        </button>
      </div>
    </div>
  );
}

function AccelDemoLayer({ active, onClose, tweaks }) {
  const stageRef = useRAH(null);
  const [phase, setPhase] = useAH("idle");
  const [bootLines, setBootLines] = useAH([]);
  const [tele, setTele] = useAH({ cps: 0, factor: 1, rawD: 0, outD: 0 });
  const [params, setParams] = useAH(null);
  const [preset, setPreset] = useAH("DEFAULT");
  const [dtOpen, setDtOpen] = useAH(false);
  const [lastAction, setLastAction] = useAH(null);
  const [soundOn, setSoundOn] = useAH(true);

  useEAH(() => {
    const D = window.AccelDemo;
    const offs = [
      ["phase", (p) => { setPhase(p); if (p === "intro") setBootLines([]); }],
      ["boot", (l) => setBootLines((b) => [...b, l])],
      ["tele", setTele],
      ["params", setParams],
      ["preset", setPreset],
      ["action", setLastAction],
      ["sound", setSoundOn],
    ].map(([ev, cb]) => [ev, D.on(ev, cb)]);
    return () => offs.forEach(([ev, cb]) => D.off(ev, cb));
  }, []);

  useEAH(() => {
    const D = window.AccelDemo;
    if (active) {
      setBootLines([]); setDtOpen(false); setLastAction(null);
      D.start({ mount: stageRef.current, direction: (tweaks && tweaks.direction) || "cinematic" });
      setSoundOn(D.state.soundOn);
      setParams(D.params);
    } else if (D.isActive()) {
      D.stop();
    }
  }, [active]);

  useEAH(() => {
    if (tweaks) {
      window.__demoTweaks = Object.assign(window.__demoTweaks || {}, tweaks);
      if (active && window.AccelDemo) window.AccelDemo.setSoundLevel(tweaks.soundLevel);
    }
  }, [tweaks, active]);

  const D = window.AccelDemo;
  const live = phase === "live";
  const intro = phase === "intro";
  const hudFull = !tweaks || tweaks.hud !== "minimal";
  const P = params;

  return (
    <div className={"hvd " + (active ? "hvd--active " : "") + ("hvd--" + phase)} aria-hidden={!active} data-screen-label="06 Demo">
      <div className="hvd__stage" ref={stageRef} />

      <span className="hvd__corner hvd__corner--tl" />
      <span className="hvd__corner hvd__corner--tr" />
      <span className="hvd__corner hvd__corner--bl" />
      <span className="hvd__corner hvd__corner--br" />

      <div className="hvd__hud">
        <div className="hvd__hudRow"><span className="hvd__hudK">MODE</span><span className="hvd__hudV is-live">● {intro ? "BOOT" : "DEMO"}</span></div>
        <div className="hvd__hudRow"><span className="hvd__hudK">NODE</span><span className="hvd__hudV">0X03 · POINTACCEL</span></div>
        <div className="hvd__hudRow"><span className="hvd__hudK">SPEED</span><span className="hvd__hudV">{String(tele.cps).padStart(4, "0")} CPS</span></div>
        <div className="hvd__hudRow"><span className="hvd__hudK">FACTOR</span><span className="hvd__hudV">×{tele.factor.toFixed(2)}</span></div>
      </div>

      <div className="hvd__title"><b>ZMK POINTACCEL</b> · LIVE DEMO · input_processor_accel.c</div>

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
              <div className="hvd__hudRow"><span className="hvd__hudK">IN</span><span className="hvd__hudV">{String(tele.rawD).padStart(4, " ")} counts</span></div>
              <div className="hvd__hudRow"><span className="hvd__hudK">OUT</span><span className="hvd__hudV">{String(tele.outD).padStart(4, " ")} counts</span></div>
              <div className="hvd__hudRow"><span className="hvd__hudK">LAST</span><span className="hvd__hudV">{lastAction || "—"}</span></div>
            </div>
          )}

          <aside className="hvd__rail">
            <header className="hvd__railHead">
              <span className="hvd__railDot" />
              <span>CONSOLE · 0X03</span>
            </header>

            <div className="hvd__railSec">
              <div className="hvd__railRow"><span className="hvd__railK">PRESET</span></div>
              <div className="hvd__segRow">
                {["LIGHT", "DEFAULT", "HEAVY", "FLAT"].map((p) => (
                  <button key={p} className={"hvd-seg " + (preset === p ? "is-on" : "")}
                          onClick={() => D.setPreset(p)}>{p}</button>
                ))}
              </div>
            </div>

            {P && (
              <div className="hvd__railSec">
                <div className="hvd__railRow"><span className="hvd__railK">CURVE · DT PROPS</span></div>
                <AccelStepper label="max-factor" value={P.maxFactor} display={"×" + (P.maxFactor / 1000).toFixed(1)}
                              step={250} min={1000} max={10000} onChange={(v) => D.setParam("maxFactor", v)} />
                <AccelStepper label="min-factor" value={P.minFactor} display={"×" + (P.minFactor / 1000).toFixed(1)}
                              step={100} min={200} max={1000} onChange={(v) => D.setParam("minFactor", v)} />
                <AccelStepper label="speed-threshold" value={P.speedThreshold} display={P.speedThreshold}
                              step={200} min={200} max={4000} onChange={(v) => D.setParam("speedThreshold", v)} />
                <AccelStepper label="speed-max" value={P.speedMax} display={P.speedMax}
                              step={500} min={2000} max={12000} onChange={(v) => D.setParam("speedMax", v)} />
                <AccelStepper label="accel-exponent" value={P.exponent} display={["", "LIN", "QUAD", "CUBE"][P.exponent] || P.exponent}
                              step={1} min={1} max={3} onChange={(v) => D.setParam("exponent", v)} />
              </div>
            )}

            {P && (
              <div className="hvd__railSec">
                <div className="hvd__segRow">
                  <button className={"hvd-seg hvd-seg--grow " + (P.trackRemainders ? "is-on" : "")}
                          onClick={() => D.setParam("trackRemainders", !P.trackRemainders)}>
                    <span className="hvd-seg__dot" />TRACK-REMAINDERS
                  </button>
                </div>
              </div>
            )}

            <div className="hvd__railSec">
              <div className="hvd__segRow">
                <button className="hvd-seg hvd-seg--grow" onClick={() => { setDtOpen(true); }}>
                  EMIT DEVICETREE
                </button>
              </div>
              <div className="hvd__segRow">
                <button className="hvd-seg hvd-seg--grow" onClick={() => D.recenter()}>RECENTER</button>
              </div>
            </div>
          </aside>

          <AccelDtOverlay open={dtOpen} onClose={() => setDtOpen(false)} />

          <div className="hvd__hint">MOVE YOUR CURSOR · FEEL THE CURVE&nbsp;&nbsp;SLOW · PRECISE&nbsp;&nbsp;FAST · ×{P ? (P.maxFactor / 1000).toFixed(1) : "3.5"}&nbsp;&nbsp;GHOST · RAW INPUT</div>
        </>
      )}
    </div>
  );
}

window.AccelDemoLayer = AccelDemoLayer;
