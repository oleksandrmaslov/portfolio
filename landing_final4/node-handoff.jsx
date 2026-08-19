/* ============================================================
   M.O. SYSTEM — GENERIC NODE HANDOFF (landing_final3/node-handoff.jsx)
   ------------------------------------------------------------
   Replaces the Wafer-only wafer-flight.jsx. Serves ANY node in
   window.MO_PROJECTS via one event:

     window.dispatchEvent(new CustomEvent("mo:nodeFlight", {
       detail: { project, originRect, origin }   // origin: work|universe|all-projects
     }));

   Choreography = the Wafer reference: model lifts out of the card,
   universe dims, model travels to the hero rest while turning
   ~270°, the last frame is stashed as a seam, the project page
   continues the same yaw. Per-project overrides come from
   projects-data.js (handoffPose). Nodes without a ready GLB fly
   the same trajectory as their node-shell proxy. Reduced motion →
   soft crossfade, no travel, no spin.

   Session protocol (generic — the old mo_wafer_* keys are gone):
     mo_node_handoff  JSON { addr, slug, yaw, arrive, returnTarget, timestamp }
     mo_node_addr / mo_node_arrive / mo_node_yaw   (flat mirrors)
     mo_node_seam     JPEG dataURL (stored separately — large)
     mo_node_return / mo_node_return_addr / mo_node_return_target
     mo_node_return_origin
   ============================================================ */
const { useState: useNH, useEffect: useNHE, useRef: useNHR } = React;

const NH_DEFAULTS = { duration: 1200, spinSpeed: 0.0039, scale: 0.92, restX: 0.46, offsetY: 0 };
const NH_REDUCED = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

function nhClearStale() {
  for (const k of ["mo_node_arrive", "mo_node_yaw", "mo_node_return", "mo_node_return_addr", "mo_node_return_target"]) sessionStorage.removeItem(k);
}

function NodeHandoff() {
  const mountRef = useNHR(null);
  const [mode, setMode] = useNH("idle");            // idle | forward | return
  const [hud, setHud] = useNH({ addr: "", name: "" });
  const rigRef = useNHR(null);
  const rafRef = useNHR(0);

  /* Universe tiles route through the SAME event — no per-address checks. */
  useNHE(() => {
    window.__mo_open_project = (p, originRect) => {
      const project = (window.MO_PROJECT_BY_ADDR && window.MO_PROJECT_BY_ADDR[p.addr]) || p.mo || p;
      window.dispatchEvent(new CustomEvent("mo:nodeFlight", { detail: { project, originRect, origin: "universe" } }));
    };
    return () => { if (window.__mo_open_project) delete window.__mo_open_project; };
  }, []);

  const buildRig = (project) => {
    const mount = mountRef.current;
    if (!mount || !window.makeNodeRig) return null;
    cancelAnimationFrame(rafRef.current);
    if (rigRef.current) { try { rigRef.current.dispose(); } catch (_) {} rigRef.current = null; }
    while (mount.firstChild) mount.removeChild(mount.firstChild);
    const rig = window.makeNodeRig(mount, { project, model: project.model, mode: "handoff" });
    rigRef.current = rig;
    return rig;
  };

  const fadeUniverse = (toOpacity, ms) => {
    const uni = document.querySelector(".universeBg");
    if (uni) { uni.style.transition = `opacity ${ms}ms cubic-bezier(0.16,1,0.3,1)`; uni.style.opacity = String(toOpacity); }
  };

  /* ---------- FORWARD: any card / tile → its project page ---------- */
  useNHE(() => {
    const onFly = (e) => {
      if (mode !== "idle") return;
      const project = e && e.detail && e.detail.project;
      if (!project || !project.file) return;                       // RECORD FORMING — cards handle it
      const originRect = e.detail.originRect;
      const origin = e.detail.origin || "work";
      const hp = Object.assign({}, NH_DEFAULTS, (project.model && project.model.handoffPose) || {});
      sessionStorage.setItem("mo_node_return_origin", origin);
      const wfEl = document.querySelector(".wf");
      if (wfEl) wfEl.classList.remove("wf--dissolve");
      setHud({ addr: project.addr, name: project.name.toUpperCase() });
      setMode("forward");
      fadeUniverse(0, 620);
      document.body.classList.add("wf-flying");

      requestAnimationFrame(() => {
        const rig = buildRig(project);
        const go = () => {
          try {
            const seam = rig && rig.captureFrame && rig.captureFrame();
            if (seam) sessionStorage.setItem("mo_node_seam", seam);
          } catch (_) {}
          const yaw = rig && rig.getYaw ? rig.getYaw() : 0;
          sessionStorage.setItem("mo_node_handoff", JSON.stringify({
            addr: project.addr, slug: project.slug, yaw,
            arrive: true, returnTarget: origin, timestamp: Date.now(),
          }));
          sessionStorage.setItem("mo_node_addr", project.addr);
          sessionStorage.setItem("mo_node_yaw", String(yaw));
          sessionStorage.setItem("mo_node_arrive", "1");
          window.location.href = project.file;
        };
        if (!rig) { setTimeout(go, 200); return; }

        const vw = window.innerWidth, vh = window.innerHeight;
        const REST = { fracX: hp.restX, scale: hp.scale, offY: hp.offsetY };
        if (NH_REDUCED) {
          rig.snapToLayout(REST.fracX, REST.scale, REST.offY);      // no travel, no spin
        } else if (originRect && originRect.w) {
          const cx = originRect.x + originRect.w / 2;
          const cy = originRect.y + originRect.h / 2;
          const startScale = Math.max(0.12, Math.min(0.6, originRect.h / (0.54 * vh)));
          rig.startFromScreen(cx, cy, vw, vh, startScale);
          rig.setEaseRate(0.052);
          requestAnimationFrame(() => rig.setLayout(REST.fracX, REST.scale, REST.offY));
        } else {
          rig.snapToLayout(REST.fracX, REST.scale, REST.offY);
        }

        let last = performance.now();
        let navigated = false;
        const dur = NH_REDUCED ? 420 : hp.duration;
        const fire = () => { if (navigated) return; navigated = true; clearTimeout(navTimer); go(); };
        const navTimer = setTimeout(fire, dur);
        const loop = (now) => {
          const dt = now - last; last = now;
          if (!NH_REDUCED) rig.nudgeYaw(Math.min(50, dt) * hp.spinSpeed);
          rig.update(dt);
          rig.render();
          if (!navigated) rafRef.current = requestAnimationFrame(loop);
        };
        rafRef.current = requestAnimationFrame(loop);
      });
    };
    window.addEventListener("mo:nodeFlight", onFly);
    return () => { window.removeEventListener("mo:nodeFlight", onFly); };
  }, [mode]);

  /* ---------- REVERSE: returning from a project page ---------- */
  useNHE(() => {
    if (sessionStorage.getItem("mo_node_return") !== "1") return;
    sessionStorage.removeItem("mo_node_return");
    const addr = sessionStorage.getItem("mo_node_return_addr") || "";
    const returnTarget = sessionStorage.getItem("mo_node_return_target") || "work";
    sessionStorage.removeItem("mo_node_return_target");
    sessionStorage.removeItem("mo_node_return_addr");
    const project = window.MO_PROJECT_BY_ADDR && window.MO_PROJECT_BY_ADDR[addr];
    if (!project) { nhClearStale(); return; }
    const hp = Object.assign({}, NH_DEFAULTS, (project.model && project.model.handoffPose) || {});
    setHud({ addr: project.addr, name: project.name.toUpperCase() });
    setMode("return");
    fadeUniverse(0, 0);
    document.body.classList.add("wf-flying");

    requestAnimationFrame(() => {
      const rig = buildRig(project);
      if (!rig) { fadeUniverse(1, 600); document.body.classList.remove("wf-flying"); setMode("idle"); return; }
      const seamYaw = parseFloat(sessionStorage.getItem("mo_node_yaw"));
      rig.snapHandoff();
      if (isFinite(seamYaw)) rig.setYaw(seamYaw);

      let last = performance.now();
      const HOLD = NH_REDUCED ? 240 : 620;
      let dissolved = false;
      const dissolve = () => {
        if (dissolved) return; dissolved = true;
        fadeUniverse(1, 700);
        const el = document.querySelector(".wf");
        if (el) el.classList.add("wf--dissolve");
        // land back where the user left from
        const featIdx = (window.MO_FEATURED_ADDRS || []).indexOf(project.addr);
        if (returnTarget === "work" && featIdx >= 0) {
          const work = document.getElementById("work");
          if (work) {
            // scroll to the exact reel stop of this card (mirror of work.jsx jumpToStop)
            const N = (window.MO_FEATURED_ADDRS || []).length;
            const STOPS = N + 2, PADS = 0.6, TOTAL_V = STOPS + PADS;
            const total = work.offsetHeight - window.innerHeight;
            const padN = PADS / TOTAL_V;
            const target = padN + ((featIdx + 1) / (STOPS - 1)) * (1 - 2 * padN);
            window.scrollTo({ top: work.offsetTop + target * total, behavior: "auto" });
          }
        } else if (returnTarget === "work") {
          const work = document.getElementById("work");
          if (work) window.scrollTo({ top: work.getBoundingClientRect().top + window.scrollY, behavior: "auto" });
        } else {
          window.scrollTo({ top: 0, behavior: "auto" });           // universe / field
        }
        setTimeout(() => {
          document.body.classList.remove("wf-flying");
          cancelAnimationFrame(rafRef.current);
          if (rigRef.current) { try { rigRef.current.dispose(); } catch (_) {} rigRef.current = null; }
          const m = mountRef.current; if (m) { while (m.firstChild) m.removeChild(m.firstChild); }
          if (el) el.classList.remove("wf--dissolve");
          nhClearStale();
          sessionStorage.removeItem("mo_node_seam");
          setMode("idle");
        }, 760);
      };
      const dissolveTimer = setTimeout(dissolve, HOLD);
      const loop = (now) => {
        const dt = now - last; last = now;
        if (!NH_REDUCED) rig.nudgeYaw(Math.min(50, dt) * hp.spinSpeed);
        rig.update(dt);
        rig.render();
        if (!dissolved) rafRef.current = requestAnimationFrame(loop);
        else rig.render();
      };
      rafRef.current = requestAnimationFrame(loop);
      void dissolveTimer;
    });
  }, []);

  useNHE(() => () => {
    cancelAnimationFrame(rafRef.current);
    if (rigRef.current) rigRef.current.dispose();
  }, []);

  return (
    <div className={"wf " + (mode !== "idle" ? "wf--on" : "")} aria-hidden="true">
      <div className="wf__veil"></div>
      <div className="wf__mount" ref={mountRef}></div>
      <div className="wf__tag">
        <span className="wf__tagDot" />
        <span>{mode === "return" ? "RETURNING TO FIELD" : "ENTERING NODE " + hud.addr}</span>
        <span className="wf__tagSep" />
        <span className="wf__tagName">{mode === "return" ? "NODE " + hud.addr + " · " + hud.name : hud.name}</span>
      </div>
    </div>
  );
}

window.NodeHandoff = NodeHandoff;
