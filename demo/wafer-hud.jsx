/* ============================================================
   M.O. SYSTEM — WAFER DEMO HUD  (React overlay + stage layer)
   ------------------------------------------------------------
   <WaferDemoLayer active onClose tweaks /> — always mounted:
     · .hvd__stage  fixed canvas mount (WaferDemo renders here)
     · boot console + SKIP during the intro
     · live: telemetry left, CONSOLE rail right (never covers the
       board — the camera look-target shifts the board left),
       typing line bottom-centre.
   Uses the shared mono micro K/V language, hairline plates,
   corner reticles, and signal accents.
   ============================================================ */
const { useState: useHD, useEffect: useEHD, useRef: useRHD } = React;

function WaferDemoLayer({ active, onClose, tweaks }) {
  const stageRef = useRHD(null);
  const [phase, setPhase] = useHD("idle");
  const [bootLines, setBootLines] = useHD([]);
  const [layer, setLayer] = useHD(0);
  const [mode, setMode] = useHD("solid");
  const [turntable, setTurntable] = useHD(false);
  const [explode, setExplode] = useHD(0);
  const [typed, setTyped] = useHD("");
  const [lastKey, setLastKey] = useHD(null);
  const [count, setCount] = useHD(0);
  const [soundOn, setSoundOn] = useHD(true);

  /* subscribe once */
  useEHD(() => {
    const D = window.WaferDemo;
    const offs = [
      ["phase", (p) => { setPhase(p); if (p === "intro") setBootLines([]); }],
      ["boot", (l) => setBootLines((b) => [...b, l])],
      ["layer", setLayer],
      ["mode", setMode],
      ["turntable", setTurntable],
      ["explode", setExplode],
      ["typed", setTyped],
      ["key", (k) => { setLastKey(k); setCount((c) => c + 1); }],
      ["sound", setSoundOn],
    ].map(([ev, cb]) => [ev, D.on(ev, cb)]);
    return () => offs.forEach(([ev, cb]) => D.off(ev, cb));
  }, []);

  /* start / stop on `active` flips */
  useEHD(() => {
    const D = window.WaferDemo;
    if (active) {
      setBootLines([]); setTyped(""); setCount(0); setLastKey(null);
      setExplode(0); setLayer(0); setMode("solid"); setTurntable(false);
      D.start({
        mount: stageRef.current,
        direction: (tweaks && tweaks.direction) || "cinematic",
      });
      setSoundOn(D.state.soundOn);
    } else if (D.isActive()) {
      D.stop();
    }
  }, [active]);

  /* live tweak pushes */
  useEHD(() => {
    if (tweaks) {
      window.__waferDemoTweaks = Object.assign(window.__waferDemoTweaks || {}, tweaks);
      if (active && window.WaferDemo) window.WaferDemo.setSoundLevel(tweaks.soundLevel);
    }
  }, [tweaks, active]);

  const D = window.WaferDemo;
  const live = phase === "live";
  const intro = phase === "intro";
  const hudFull = !tweaks || tweaks.hud !== "minimal";

  const matrixLabel = lastKey
    ? (lastKey.thumb ? `T·${lastKey.col}` : `R${lastKey.row}·C${lastKey.col}`) + (lastKey.side < 0 ? " · L" : " · R")
    : "—";

  return (
    <div className={"hvd " + (active ? "hvd--active " : "") + ("hvd--" + phase)} aria-hidden={!active} data-screen-label="06 Demo">
      {/* stage — the demo renderer mounts here */}
      <div className="hvd__stage" ref={stageRef} />

      {/* frame */}
      <span className="hvd__corner hvd__corner--tl" />
      <span className="hvd__corner hvd__corner--tr" />
      <span className="hvd__corner hvd__corner--bl" />
      <span className="hvd__corner hvd__corner--br" />

      {/* top-left · system readout */}
      <div className="hvd__hud">
        <div className="hvd__hudRow"><span className="hvd__hudK">MODE</span><span className="hvd__hudV is-live">● {intro ? "BOOT" : "DEMO"}</span></div>
        <div className="hvd__hudRow"><span className="hvd__hudK">NODE</span><span className="hvd__hudV">0X01 · WAFER</span></div>
        <div className="hvd__hudRow"><span className="hvd__hudK">VIEW</span><span className="hvd__hudV">{mode.toUpperCase()}</span></div>
        <div className="hvd__hudRow"><span className="hvd__hudK">LAYER</span><span className="hvd__hudV">{["BASE", "NAV", "SYM"][layer]}</span></div>
      </div>

      {/* top-centre title */}
      <div className="hvd__title"><b>WAFER</b> · LIVE DEMO · 36-KEY SPLIT</div>

      {/* top-right: sound + stop */}
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

      {/* intro boot console */}
      {intro && (
        <div className="hvd__boot">
          {bootLines.map((l, i) => (
            <div key={i} className="hvd__bootLine"><span className="hvd__bootCaret">▸</span>{l}</div>
          ))}
          <button className="hvd-btn hvd__skip" onClick={() => D.skip()}>SKIP · [␣]</button>
        </div>
      )}

      {/* live overlays */}
      {live && (
        <>
          {hudFull && (
            <div className="hvd__tele">
              <div className="hvd__hudRow"><span className="hvd__hudK">KEY</span><span className="hvd__hudV">{lastKey ? (lastKey.label === " " ? "␣" : lastKey.label) : "—"}</span></div>
              <div className="hvd__hudRow"><span className="hvd__hudK">MATRIX</span><span className="hvd__hudV">{matrixLabel}</span></div>
              <div className="hvd__hudRow"><span className="hvd__hudK">PRESSES</span><span className="hvd__hudV">{String(count).padStart(3, "0")}</span></div>
            </div>
          )}

          {hudFull && (
            <div className={"hvd__type " + (typed ? "has-text" : "")}>
              <span className="hvd__typeK">›</span>
              <span className="hvd__typeV">{typed || "type on your keyboard — or click the caps"}</span>
              <span className="hvd__typeCaret" />
            </div>
          )}

          {/* right-edge CONSOLE rail */}
          <aside className="hvd__rail">
            <header className="hvd__railHead">
              <span className="hvd__railDot" />
              <span>CONSOLE · 0X01</span>
            </header>

            <div className="hvd__railSec">
              <div className="hvd__railRow">
                <span className="hvd__railK">EXPLODE</span>
                <span className="hvd__railV">{String(Math.round(explode * 100)).padStart(3, "0")}%</span>
              </div>
              <input
                className="hvd__slider" type="range" min="0" max="100" step="1"
                value={Math.round(explode * 100)}
                onChange={(e) => { D.setExplode(e.target.value / 100); }}
                onPointerUp={(e) => e.target.blur()}
              />
            </div>

            <div className="hvd__railSec">
              <div className="hvd__railRow"><span className="hvd__railK">LAYER</span></div>
              <div className="hvd__segRow">
                {["BASE", "NAV", "SYM"].map((l, i) => (
                  <button key={l} className={"hvd-seg " + (layer === i ? "is-on" : "")}
                          onClick={() => D.setLayer(i)}>{l}</button>
                ))}
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

          <div className="hvd__hint">DRAG · ORBIT&nbsp;&nbsp;&nbsp;SCROLL · ZOOM&nbsp;&nbsp;&nbsp;CLICK CAPS · PRESS&nbsp;&nbsp;&nbsp;THUMB NAV/SYM · LAYERS</div>
        </>
      )}
    </div>
  );
}

window.WaferDemoLayer = WaferDemoLayer;
