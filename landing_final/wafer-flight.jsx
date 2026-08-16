/* ============================================================
   M.O. SYSTEM — Landing v6 · WAFER HANDOFF  (Cartier-style)
   ------------------------------------------------------------
   The model NEVER leaves the screen. Clicking the Wafer card:
     1. presents the wafer model CENTERED + large on the void
        (the universe field fades away behind it),
     2. eases through a smooth ~270° turn in place,
     3. navigates to Wafer v2.html, which snaps the SAME centered
        pose (identical bg) and finishes the turn as it slides to
        the right-hand hero rest.
   Reverse (return from Wafer): the model arrives back centered +
   spinning, then dissolves as the universe reel fades up at #work.
   One continuous shot in both directions — no fly-from-void, no
   shrink-into-void.
   ============================================================ */
const { useState: useWF, useEffect: useWFE, useRef: useWFR } = React;

const WF_DUR = 1200;        // on-screen travel + spin time before navigating
const WF_SPIN = 0.0039;     // rad per ms — ~270° of a single 360° handoff turn

function WaferHandoff() {
  const mountRef = useWFR(null);
  const [mode, setMode] = useWF("idle");   // idle | forward | return
  const rigRef = useWFR(null);
  const rafRef = useWFR(0);

  // route the Wafer node into the handoff; every other node keeps fade-nav
  useWFE(() => {
    window.__mo_open_project = (p, originRect) => {
      if (p && p.addr === "0x01") { window.dispatchEvent(new CustomEvent("mo:waferFlight", { detail: { p, originRect, origin: "universe" } })); return; }
      sessionStorage.setItem("mo_navigate_from_addr", p.addr);
      document.body.classList.add("landing-exit");
      setTimeout(() => { window.location.href = p.file; }, 380);
    };
    return () => { if (window.__mo_open_project) delete window.__mo_open_project; };
  }, []);

  const buildRig = () => {
    const mount = mountRef.current;
    if (!mount) return null;
    // Tear down anything left from a previous transition — otherwise a stale
    // canvas (frozen on its last frame) stacks behind the new one and you see
    // a ghost model. Single choke point so every entry path is clean.
    cancelAnimationFrame(rafRef.current);
    if (rigRef.current) { try { rigRef.current.dispose(); } catch (_) {} rigRef.current = null; }
    while (mount.firstChild) mount.removeChild(mount.firstChild);
    const rig = window.makeWaferRig(mount, { model: "models/wafer_demo.glb" });
    rigRef.current = rig;
    return rig;
  };

  const fadeUniverse = (toOpacity, ms) => {
    const uni = document.querySelector(".universeBg");
    if (uni) { uni.style.transition = `opacity ${ms}ms cubic-bezier(0.16,1,0.3,1)`; uni.style.opacity = String(toOpacity); }
  };

  /* ---------- FORWARD: card → Wafer v2 ---------- */
  useWFE(() => {
    const onFly = (e) => {
      if (mode !== "idle") return;
      const originRect = e && e.detail && e.detail.originRect;
      const origin = (e && e.detail && e.detail.origin) || "work";
      // remember where the user came from so the return lands there
      sessionStorage.setItem("mo_wafer_return_to", origin);
      // reset any leftover overlay state from a prior return-dissolve
      const wfEl = document.querySelector(".wf");
      if (wfEl) wfEl.classList.remove("wf--dissolve");
      setMode("forward");
      fadeUniverse(0, 620);
      document.body.classList.add("wf-flying");

      requestAnimationFrame(() => {
        const rig = buildRig();
        const go = () => {
          // Capture the final flight frame as a lightweight image and stash it,
          // so Wafer v2 can paint it instantly over its boot gap (the model
          // never visually disappears across the document swap).
          try {
            const c = rig && rig.el;
            if (c) {
              const tw = 1100, th = Math.round(tw * c.height / c.width);
              const tc = document.createElement("canvas"); tc.width = tw; tc.height = th;
              tc.getContext("2d").drawImage(c, 0, 0, tw, th);
              sessionStorage.setItem("mo_wafer_seam", tc.toDataURL("image/jpeg", 0.82));
            }
          } catch (_) {}
          sessionStorage.setItem("mo_wafer_yaw", String(rig.yaw));   // exact flight-end angle for a continuous turn
          sessionStorage.setItem("mo_wafer_arrive", "1");
          window.location.href = "Wafer v3.html";
        };
        if (!rig) { setTimeout(go, 200); return; }

        const vw = window.innerWidth, vh = window.innerHeight;
        // RIGHT-REST seam: model eases from the clicked card to exactly where
        // it will live on the Wafer page (right side), so the page swap needs
        // no further repositioning — it just continues the spin.
        const REST = { fracX: 0.46, scale: 0.92, offY: 0 };
        if (originRect && originRect.w) {
          const cx = originRect.x + originRect.w / 2;
          const cy = originRect.y + originRect.h / 2;
          const startScale = Math.max(0.12, Math.min(0.6, originRect.h / (0.54 * vh)));
          rig.startFromScreen(cx, cy, vw, vh, startScale);
          rig.setEaseRate(0.052);   // slow, graceful card → rest travel
          requestAnimationFrame(() => rig.setLayout(REST.fracX, REST.scale, REST.offY));
        } else {
          rig.snapToLayout(REST.fracX, REST.scale, REST.offY, window.WAFER_RIG.arriveYaw);
        }

        let last = performance.now();
        let navigated = false;
        const fire = () => { if (navigated) return; navigated = true; clearTimeout(navTimer); go(); };
        const navTimer = setTimeout(fire, WF_DUR);
        const loop = (now) => {
          const dt = now - last; last = now;
          rig.nudgeYaw(Math.min(50, dt) * WF_SPIN);   // constant graceful turn
          rig.update(dt);
          rig.render();
          if (!navigated) rafRef.current = requestAnimationFrame(loop);
        };
        rafRef.current = requestAnimationFrame(loop);
      });
    };
    window.addEventListener("mo:waferFlight", onFly);
    return () => { window.removeEventListener("mo:waferFlight", onFly); };
  }, [mode]);

  /* ---------- REVERSE: returning from Wafer v2 ---------- */
  useWFE(() => {
    if (sessionStorage.getItem("mo_wafer_return") !== "1") return;
    sessionStorage.removeItem("mo_wafer_return");
    const returnTarget = sessionStorage.getItem("mo_wafer_return_target") || "work";
    sessionStorage.removeItem("mo_wafer_return_target");
    setMode("return");
    // start with the universe hidden + the model centered, then dissolve in
    fadeUniverse(0, 0);
    document.body.classList.add("wf-flying");

    requestAnimationFrame(() => {
      const rig = buildRig();
      if (!rig) { fadeUniverse(1, 600); document.body.classList.remove("wf-flying"); setMode("idle"); return; }
      rig.snapHandoff();                    // same centered seam pose as the exit

      let last = performance.now();
      const HOLD = 620;                     // spin a beat, then dissolve into the reel
      let dissolved = false;
      const dissolve = () => {
        if (dissolved) return; dissolved = true;
        fadeUniverse(1, 700);               // universe reel fades up
        const el = document.querySelector(".wf");
        if (el) el.classList.add("wf--dissolve");   // model overlay fades out
        // land where the user came from: work reel (#work) or the title screen
        if (returnTarget === "work") {
          const work = document.getElementById("work");
          if (work) { const y = work.getBoundingClientRect().top + window.scrollY; window.scrollTo({ top: y, behavior: "auto" }); }
        } else {
          window.scrollTo({ top: 0, behavior: "auto" });   // universe title screen
        }
        setTimeout(() => {
          document.body.classList.remove("wf-flying");
          // dispose the return rig + clear its canvas so a later forward flight
          // starts from a clean mount (no ghost frame).
          cancelAnimationFrame(rafRef.current);
          if (rigRef.current) { try { rigRef.current.dispose(); } catch (_) {} rigRef.current = null; }
          const m = mountRef.current; if (m) { while (m.firstChild) m.removeChild(m.firstChild); }
          if (el) el.classList.remove("wf--dissolve");
          setMode("idle");
        }, 760);
      };
      const dissolveTimer = setTimeout(dissolve, HOLD);
      const loop = (now) => {
        const dt = now - last; last = now;
        rig.nudgeYaw(Math.min(50, dt) * WF_SPIN);
        rig.update(dt);
        rig.render();
        if (!dissolved) rafRef.current = requestAnimationFrame(loop);
        else { rig.render(); }
      };
      rafRef.current = requestAnimationFrame(loop);
      void dissolveTimer;
    });
  }, []);

  useWFE(() => () => {
    cancelAnimationFrame(rafRef.current);
    if (rigRef.current) rigRef.current.dispose();
  }, []);

  return (
    <div className={"wf " + (mode !== "idle" ? "wf--on" : "")} aria-hidden="true">
      <div className="wf__veil" />
      <div className="wf__mount" ref={mountRef} />
      <div className="wf__tag">
        <span className="wf__tagDot" />
        <span>{mode === "return" ? "RETURNING TO UNIVERSE" : "ENTERING NODE 0x01"}</span>
        <span className="wf__tagSep" />
        <span className="wf__tagName">WAFER</span>
      </div>
    </div>
  );
}

window.WaferHandoff = WaferHandoff;
window.WaferFlight = WaferHandoff;   // back-comat alias for app.jsx
