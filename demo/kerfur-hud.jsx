/* ============================================================
   M.O. SYSTEM — KERFUR DEMO HUD  (React overlay + stage layer)
   ------------------------------------------------------------
   <KerfurDemoLayer active onClose tweaks /> — wafer HUD shell:
   boot console during intro, telemetry left, CONSOLE rail right.
   Kerfur-specific rail: live emotion bars (the engine's actual
   variables), event injectors (notifications / charger / peer),
   and INSPECT FACE — a fullscreen 1-bit OLED view running the
   SAME face engine instance (pointer = look, click = tap,
   slow drag = petting).
   ============================================================ */
const { useState: useKH, useEffect: useEKH, useRef: useRKH } = React;

const KERFUR_VAR_ROWS = [
  ["mood", "MOOD"],
  ["affection", "AFFCT"],
  ["stress", "STRESS"],
  ["energy", "ENERGY"],
  ["sleepiness", "SLEEP"],
];

/* fullscreen OLED inspect view — blits the live face canvas big */
function KerfurInspect({ open }) {
  const cvsRef = useRKH(null);
  const petRef = useRKH({ acc: 0, lastFire: 0, down: false, lx: 0, ly: 0, stopT: 0 });

  useEKH(() => {
    if (!open) return;
    let raf;
    const blit = () => {
      const D = window.KerfurDemo;
      const src = D.face && D.face.canvas;
      const cvs = cvsRef.current;
      if (src && cvs) {
        const ctx = cvs.getContext("2d");
        ctx.imageSmoothingEnabled = false;
        ctx.clearRect(0, 0, 128, 64);
        ctx.drawImage(src, 0, 0);
      }
      raf = requestAnimationFrame(blit);
    };
    raf = requestAnimationFrame(blit);
    return () => cancelAnimationFrame(raf);
  }, [open]);

  const toLook = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width - 0.5) * 200,
      y: ((e.clientY - r.top) / r.height - 0.5) * 200,
    };
  };

  const onMove = (e) => {
    const D = window.KerfurDemo;
    const p = toLook(e);
    D.faceLook(Math.max(-100, Math.min(100, p.x)), Math.max(-100, Math.min(100, p.y)));
    const st = petRef.current;
    if (st.down) {
      const speed = Math.abs(e.clientX - st.lx) + Math.abs(e.clientY - st.ly);
      st.lx = e.clientX; st.ly = e.clientY;
      if (speed < 30) {
        st.acc += speed;
        D.facePet(true);
        clearTimeout(st.stopT);
        st.stopT = setTimeout(() => D.facePet(false), 380);
        if (st.acc > 300 && performance.now() - st.lastFire > 1500) {
          st.acc = 0; st.lastFire = performance.now();
          D.faceStroke();
        }
      }
    }
  };

  return (
    <div className={"hvd-kf-inspect " + (open ? "is-open" : "")} aria-hidden={!open}>
      <div className="hvd-kf-inspect__frame">
        <canvas
          ref={cvsRef} width="128" height="64" className="hvd-kf-inspect__cvs"
          onPointerDown={(e) => {
            const st = petRef.current;
            st.down = true; st.acc = 0; st.lx = e.clientX; st.ly = e.clientY;
            e.currentTarget.setPointerCapture?.(e.pointerId);
          }}
          onPointerUp={(e) => {
            const st = petRef.current;
            if (st.acc < 14) { const p = toLook(e); window.KerfurDemo.faceTap(p.x, p.y); }
            st.down = false;
            window.KerfurDemo.facePet(false);
          }}
          onPointerCancel={() => { petRef.current.down = false; window.KerfurDemo.facePet(false); }}
          onPointerMove={onMove}
        />
        <div className="hvd-kf-inspect__grid" aria-hidden="true" />
      </div>
      <div className="hvd-kf-inspect__cap">SSD1306 · 128×64 · 1-BIT · LIVE RECIPE COMPOSE&nbsp;&nbsp;·&nbsp;&nbsp;HOVER · LOOK&nbsp;&nbsp;TAP · POKE&nbsp;&nbsp;SLOW DRAG · PET</div>
    </div>
  );
}

function KerfurDemoLayer({ active, onClose, tweaks }) {
  const stageRef = useRKH(null);
  const [phase, setPhase] = useKH("idle");
  const [bootLines, setBootLines] = useKH([]);
  const [expr, setExpr] = useKH("PET_EXPR_CALM");
  const [vars, setVars] = useKH({ mood: 60, affection: 40, stress: 15, energy: 70, sleepiness: 10 });
  const [battery, setBattery] = useKH(0.84);
  const [charging, setCharging] = useKH(false);
  const [peer, setPeer] = useKH(null);
  const [inspecting, setInspecting] = useKH(false);
  const [lastAction, setLastAction] = useKH(null);
  const [soundOn, setSoundOn] = useKH(true);

  useEKH(() => {
    const D = window.KerfurDemo;
    const offs = [
      ["phase", (p) => { setPhase(p); if (p === "intro") setBootLines([]); }],
      ["boot", (l) => setBootLines((b) => [...b, l])],
      ["expr", setExpr],
      ["vars", setVars],
      ["battery", setBattery],
      ["charging", setCharging],
      ["peer", setPeer],
      ["inspect", setInspecting],
      ["action", setLastAction],
      ["sound", setSoundOn],
    ].map(([ev, cb]) => [ev, D.on(ev, cb)]);
    return () => offs.forEach(([ev, cb]) => D.off(ev, cb));
  }, []);

  useEKH(() => {
    const D = window.KerfurDemo;
    if (active) {
      setBootLines([]); setExpr("PET_EXPR_CALM"); setPeer(null);
      setInspecting(false); setLastAction(null); setCharging(false);
      D.start({ mount: stageRef.current, direction: (tweaks && tweaks.direction) || "cinematic" });
      setSoundOn(D.state.soundOn);
    } else if (D.isActive()) {
      D.stop();
      D.inspect(false);
    }
  }, [active]);

  useEKH(() => {
    if (tweaks) {
      window.__demoTweaks = Object.assign(window.__demoTweaks || {}, tweaks);
      if (active && window.KerfurDemo) window.KerfurDemo.setSoundLevel(tweaks.soundLevel);
    }
  }, [tweaks, active]);

  const D = window.KerfurDemo;
  const live = phase === "live";
  const intro = phase === "intro";
  const hudFull = !tweaks || tweaks.hud !== "minimal";
  const battPct = Math.round(battery * 100);
  const peerLabel = { enter: "SCANNING", seen: "SEEN · ?", near: "NEAR · RSSI ↑", greet: "GREETING", friend: "FRIEND ♥" }[peer] || "—";

  return (
    <div className={"hvd " + (active ? "hvd--active " : "") + ("hvd--" + phase)} aria-hidden={!active} data-screen-label="06 Demo">
      <div className="hvd__stage" ref={stageRef} />

      <span className="hvd__corner hvd__corner--tl" />
      <span className="hvd__corner hvd__corner--tr" />
      <span className="hvd__corner hvd__corner--bl" />
      <span className="hvd__corner hvd__corner--br" />

      <div className="hvd__hud">
        <div className="hvd__hudRow"><span className="hvd__hudK">MODE</span><span className="hvd__hudV is-live">● {intro ? "BOOT" : "DEMO"}</span></div>
        <div className="hvd__hudRow"><span className="hvd__hudK">NODE</span><span className="hvd__hudV">0X02 · KERFUR</span></div>
        <div className="hvd__hudRow"><span className="hvd__hudK">FACE</span><span className="hvd__hudV">{expr.replace("PET_EXPR_", "")}</span></div>
        <div className="hvd__hudRow"><span className="hvd__hudK">PEER</span><span className="hvd__hudV">{peerLabel}</span></div>
      </div>

      <div className="hvd__title"><b>KERFUR</b> · LIVE DEMO · NRF52840 · ZEPHYR</div>

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
              <div className="hvd__hudRow"><span className="hvd__hudK">BATT</span><span className="hvd__hudV">{String(battPct).padStart(3, "0")}% {charging ? "· CHARGING" : ""}</span></div>
              <div className="hvd__hudRow"><span className="hvd__hudK">LAST</span><span className="hvd__hudV">{lastAction || "—"}</span></div>
            </div>
          )}

          <aside className="hvd__rail">
            <header className="hvd__railHead">
              <span className="hvd__railDot" />
              <span>CONSOLE · 0X02</span>
            </header>

            <div className="hvd__railSec">
              <div className="hvd__railRow"><span className="hvd__railK">EMOTION ENGINE</span></div>
              <div className="hvd2-vars">
                {KERFUR_VAR_ROWS.map(([k, label]) => (
                  <div key={k} className="hvd2-var">
                    <span className="hvd2-var__k">{label}</span>
                    <span className="hvd2-var__bar">
                      <span className={"hvd2-var__fill " + (k === "stress" ? "is-warn" : "")}
                            style={{ width: Math.round(vars[k] || 0) + "%" }} />
                    </span>
                    <span className="hvd2-var__v">{String(Math.round(vars[k] || 0)).padStart(2, "0")}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="hvd__railSec">
              <div className="hvd__railRow"><span className="hvd__railK">NOTIFY</span></div>
              <div className="hvd__segRow">
                <button className="hvd-seg" onClick={() => D.notify("normal")}>MSG</button>
                <button className="hvd-seg" onClick={() => D.notify("important")}>IMPORTANT</button>
                <button className="hvd-seg" onClick={() => D.notify("burst")}>BURST ×5</button>
              </div>
            </div>

            <div className="hvd__railSec">
              <div className="hvd__railRow">
                <span className="hvd__railK">POWER</span>
                <span className="hvd__railV">{battPct}%</span>
              </div>
              <div className="hvd__segRow">
                <button className={"hvd-seg hvd-seg--grow " + (charging ? "is-on" : "")}
                        onClick={() => D.setCharging(!charging)}>
                  <span className="hvd-seg__dot" />{charging ? "UNPLUG" : "PLUG CHARGER"}
                </button>
              </div>
            </div>

            <div className="hvd__railSec">
              <div className="hvd__railRow">
                <span className="hvd__railK">NEARBY</span>
                <span className="hvd__railV">{peerLabel}</span>
              </div>
              <div className="hvd__segRow">
                <button className={"hvd-seg hvd-seg--grow " + (peer ? "is-on" : "")} onClick={() => D.encounter()}>
                  <span className="hvd-seg__dot" />{peer ? "DISMISS PEER" : "PEER ENCOUNTER"}
                </button>
              </div>
            </div>

            <div className="hvd__railSec">
              <div className="hvd__segRow">
                <button className={"hvd-seg hvd-seg--grow " + (inspecting ? "is-on" : "")}
                        onClick={() => D.inspect(!inspecting)}>
                  <span className="hvd-seg__dot" />INSPECT FACE
                </button>
              </div>
              <div className="hvd__segRow">
                <button className="hvd-seg hvd-seg--grow" onClick={() => D.resetView()}>RESET VIEW</button>
              </div>
            </div>
          </aside>

          <KerfurInspect open={inspecting} />

          <div className="hvd__hint">TAP · LOOK&nbsp;&nbsp;2×TAP · HAPPY&nbsp;&nbsp;SLOW DRAG · PET&nbsp;&nbsp;FAST DRAG · SHAKE&nbsp;&nbsp;HOLD · PICK UP&nbsp;&nbsp;IGNORE · SLEEP</div>
        </>
      )}
    </div>
  );
}

window.KerfurDemoLayer = KerfurDemoLayer;
