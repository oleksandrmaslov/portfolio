/* ============================================================
   M.O. SYSTEM — PROJECT NODE HANDOFF
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
/* The original click path built a fresh WebGLRenderer, environment prefilter
   and GLB consumer. Measured cold on a laptop, that was 380ms to construct and
   ~1.2s to the first drawn frame. A single reusable handoff context is now
   primed behind the entry horizon and retargeted on card intent. The bounded
   hold remains load-bearing for an uncached/touch-selected model: rig.ready
   flips when the GLB enters the scene, but the first render that includes it
   still compiles its program. Waiting for two painted frames keeps that compile
   on the card instead of releasing a one-frame teleport into the flight. */
const NH_HOLD_MAX = 900;
const NH_SEAM_MAX = 1000;

function nhClearStale() {
  for (const k of ["mo_node_arrive", "mo_node_yaw", "mo_node_return", "mo_node_return_addr", "mo_node_return_target"]) sessionStorage.removeItem(k);
}

function nhHasPendingReturn() {
  try { return sessionStorage.getItem("mo_node_return") === "1"; }
  catch (_) { return false; }
}

function NodeHandoff() {
  const returningRef = useNHR(nhHasPendingReturn());
  const mountRef = useNHR(null);
  const [mode, setMode] = useNH(returningRef.current ? "return" : "idle"); // idle | forward | return
  const [hud, setHud] = useNH({ addr: "", name: "" });
  const [holding, setHolding] = useNH(false);   // rig mounted, travel not started yet
  const rigRef = useNHR(null);
  const rafRef = useNHR(0);
  const prepRafRef = useNHR(0);
  const prepTokenRef = useNHR(0);
  const prepRef = useNHR({ addr: "", promise: null });
  const hoverTimerRef = useNHR(0);
  const modeRef = useNHR(mode);
  modeRef.current = mode;

  const stopPrep = () => {
    prepTokenRef.current += 1;
    cancelAnimationFrame(prepRafRef.current);
    prepRafRef.current = 0;
  };

  /* Prime one reusable transition context after the Universe has painted its
     first frame. The old path built a WebGLRenderer + PMREM environment inside
     the click handler, so even a fully cached GLB could not draw without a
     large first-frame stall. Model payloads can now be swapped into this same
     context; hover prepares the exact project while the first field node is
     the loader-time default. */
  const prepareRig = (project) => {
    if (!project || returningRef.current || modeRef.current !== "idle") return null;
    const mount = mountRef.current;
    if (!mount || !window.makeNodeRig) return null;

    let rig = rigRef.current;
    if (!rig || typeof rig.setProject !== "function") {
      if (rig) { try { rig.dispose(); } catch (_) {} }
      while (mount.firstChild) mount.removeChild(mount.firstChild);
      rig = window.makeNodeRig(mount, { project, model: project.model, mode: "handoff", deferModel: true });
      rigRef.current = rig;
    }
    if (!rig) return null;

    const current = prepRef.current;
    if (current.addr === project.addr && current.promise) return current.promise;
    stopPrep();
    const token = prepTokenRef.current;
    const load = rig.getProjectAddr && rig.getProjectAddr() === project.addr
      ? Promise.resolve(rig.ready)
      : Promise.resolve(rig.setProject(project));
    const promise = load.then(() => new Promise((resolve) => {
      let painted = 0;
      const paint = () => {
        if (token !== prepTokenRef.current || modeRef.current !== "idle" || rigRef.current !== rig) {
          resolve(false);
          return;
        }
        rig.update(16);
        rig.render();
        if (rig.ready) painted += 1;
        if (painted >= 2) {
          try { window.dispatchEvent(new CustomEvent("mo:handoff-warm", { detail: { addr: project.addr } })); } catch (_) {}
          resolve(true);
          return;
        }
        prepRafRef.current = requestAnimationFrame(paint);
      };
      prepRafRef.current = requestAnimationFrame(paint);
    })).catch(() => false);
    prepRef.current = { addr: project.addr, promise };
    promise.then((ready) => {
      if (!ready && prepRef.current.promise === promise) prepRef.current = { addr: "", promise: null };
    });
    return promise;
  };

  /* The shared core clears persisted CSS/global exit state. This component
     also owns React and WebGL state, so reset that state when Back restores a
     landing snapshot captured after a project flight had already started. */
  useNHE(() => {
    const onRestore = () => {
      cancelAnimationFrame(rafRef.current);
      stopPrep();
      if (rigRef.current) {
        try { rigRef.current.dispose(); } catch (_) {}
        rigRef.current = null;
      }
      prepRef.current = { addr: "", promise: null };
      const mount = mountRef.current;
      if (mount) while (mount.firstChild) mount.removeChild(mount.firstChild);
      const wf = document.querySelector(".wf");
      if (wf) wf.classList.remove("wf--dissolve");
      returningRef.current = false;
      modeRef.current = "idle";
      setHolding(false);
      setHud({ addr: "", name: "" });
      setMode("idle");
    };
    window.addEventListener("mo:page-restored", onRestore);
    return () => window.removeEventListener("mo:page-restored", onRestore);
  }, []);

  useNHE(() => {
    if (returningRef.current) return;
    const firstProject = () => (window.MO_PROJECTS || []).find((project) => project.universe !== false && project.file);
    const prime = () => {
      const project = firstProject();
      if (project) prepareRig(project);
    };
    const onHover = (event) => {
      const addr = event && event.detail && event.detail.addr;
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = 0;
      if (!addr) return;
      const project = window.MO_PROJECT_BY_ADDR && window.MO_PROJECT_BY_ADDR[addr];
      if (!project || !project.file) return;
      // A short intent delay avoids recompiling as the pointer merely crosses
      // a card; a deliberate hover still prepares before the click.
      hoverTimerRef.current = setTimeout(() => prepareRig(project), 90);
    };
    window.addEventListener("mo:first-frame", prime, { once: true });
    window.addEventListener("mo:tileHover", onHover);
    if (window.__mo_firstFrameAt) prime();
    return () => {
      window.removeEventListener("mo:first-frame", prime);
      window.removeEventListener("mo:tileHover", onHover);
      clearTimeout(hoverTimerRef.current);
      stopPrep();
    };
  }, []);

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
    stopPrep();
    let rig = rigRef.current;
    if (rig && typeof rig.setProject === "function") {
      if (!rig.getProjectAddr || rig.getProjectAddr() !== project.addr) rig.setProject(project);
      prepRef.current = { addr: project.addr, promise: Promise.resolve(rig.ready) };
      return rig;
    }
    if (rig) { try { rig.dispose(); } catch (_) {} rigRef.current = null; }
    while (mount.firstChild) mount.removeChild(mount.firstChild);
    rig = window.makeNodeRig(mount, { project, model: project.model, mode: "handoff" });
    rigRef.current = rig;
    prepRef.current = { addr: project.addr, promise: Promise.resolve(rig && rig.ready) };
    return rig;
  };

  /* The inline transition has to be REMOVED once it has played. Board Flight
     drives `.universeBg` opacity per frame from the scroll and clears the
     transition once at its own mount — which happens long before any return
     from a project page — so a leftover 700ms ease here makes the board
     takeover lag the scroll by most of a second instead of tracking it. */
  const fadeUniverse = (toOpacity, ms) => {
    const uni = document.querySelector(".universeBg");
    if (!uni) return;
    if (uni.__moFadeT) clearTimeout(uni.__moFadeT);
    uni.style.transition = `opacity ${ms}ms cubic-bezier(0.16,1,0.3,1)`;
    uni.style.opacity = String(toOpacity);
    uni.__moFadeT = setTimeout(() => { uni.style.transition = ""; uni.__moFadeT = 0; }, ms + 60);
  };

  /* ---------- FORWARD: any card / tile → its project page ---------- */
  useNHE(() => {
    const onFly = (e) => {
      if (returningRef.current || mode !== "idle") return;
      const project = e && e.detail && e.detail.project;
      if (!project || !project.file) return;                       // RECORD FORMING — cards handle it
      const originRect = e.detail.originRect;
      const origin = e.detail.origin || "work";
      const hp = Object.assign({}, NH_DEFAULTS, (project.model && project.model.handoffPose) || {});
      sessionStorage.setItem("mo_node_return_origin", origin);
      const wfEl = document.querySelector(".wf");
      if (wfEl) wfEl.classList.remove("wf--dissolve");
      setHud({ addr: project.addr, name: project.name.toUpperCase() });
      setHolding(true);          // veil + mount stay transparent while we wait
      setMode("forward");
      document.body.classList.add("wf-flying");
      // NOTE: the universe is deliberately NOT faded yet. The card the reader
      // clicked has to stay on screen until the rig can draw, otherwise there
      // is nothing for the model to lift out of.

      requestAnimationFrame(() => {
        const rig = buildRig(project);
        const go = () => {
          const yaw = rig && rig.getYaw ? rig.getYaw() : 0;
          sessionStorage.setItem("mo_node_handoff", JSON.stringify({
            addr: project.addr, slug: project.slug, yaw,
            arrive: true, returnTarget: origin, timestamp: Date.now(),
          }));
          sessionStorage.setItem("mo_node_addr", project.addr);
          sessionStorage.setItem("mo_node_yaw", String(yaw));
          sessionStorage.setItem("mo_node_arrive", "1");
          sessionStorage.removeItem("mo_node_seam");

          let capture = Promise.resolve(null);
          try {
            if (rig && rig.captureFrameAsync) capture = Promise.resolve(rig.captureFrameAsync());
            else if (rig && rig.captureFrame) capture = Promise.resolve(rig.captureFrame());
          } catch (_) {}
          const timeout = new Promise((resolve) => setTimeout(() => resolve({ timedOut: true, seam: null }), NH_SEAM_MAX));
          Promise.race([capture.then((seam) => ({ timedOut: false, seam })), timeout]).then((result) => {
            let seam = result.seam;
            // Preserve the original seam contract on browsers whose async
            // canvas encoder is unavailable or stalls. This rare fallback is
            // the former synchronous path, so quality never degrades.
            if (!seam) {
              try { seam = rig && rig.captureFrame ? rig.captureFrame() : null; } catch (_) {}
            }
            try { if (seam) sessionStorage.setItem("mo_node_seam", seam); } catch (_) {}
            window.location.href = project.file;
          });
        };
        if (!rig) { setHolding(false); setTimeout(go, 200); return; }   // no rig: don't strand the hold

        const vw = window.innerWidth, vh = window.innerHeight;
        const REST = { fracX: hp.restX, scale: hp.scale, offY: hp.offsetY };

        /* A rect is only a usable origin if it still overlaps the viewport.
           A reel card scrolled out of the sticky stage, or a universe tile
           swung past the lens, yields coordinates far outside the screen, and
           startFromScreen would happily launch the model in from off-canvas. */
        const usableOrigin = !!originRect && originRect.w > 1 && originRect.h > 1 &&
          originRect.x + originRect.w > 0 && originRect.y + originRect.h > 0 &&
          originRect.x < vw && originRect.y < vh;

        const travels = !NH_REDUCED && usableOrigin;
        if (travels) {
          const cx = Math.max(0, Math.min(vw, originRect.x + originRect.w / 2));
          const cy = Math.max(0, Math.min(vh, originRect.y + originRect.h / 2));
          /* Size the rig so the model keeps the on-screen height it already had
             on the card. The rig frames its model to `rigFit` world units at
             scale 1 and its frustum is `frustumH` world units tall at the model
             plane, so a screen fraction f needs scale = f * frustumH / rigFit.
             The old constant (rect height / 0.54vh) had nothing to do with
             model size, which is why a mark tuned to read small on its card
             arrived in the flight at roughly twice the size. */
          const R = window.WAFER_RIG || { fov: 38, camZ: 5.4, modelFit: 4.0 };
          const frustumH = 2 * R.camZ * Math.tan((R.fov * Math.PI / 180) / 2);
          const rigFit = (project.model && project.model.rigFit) || R.modelFit || 4.0;
          /* Never start larger than the hero size the flight lands on. When the
             origin is the model's own box this rarely binds; when we fall back
             to the card quad it does, and it is what stops a small mark from
             arriving at full card height. */
          const startScale = Math.max(0.06, Math.min(REST.scale, (originRect.h / vh) * frustumH / rigFit));
          rig.startFromScreen(cx, cy, vw, vh, startScale);
          rig.setEaseRate(0.052);
        } else {
          rig.snapToLayout(REST.fracX, REST.scale, REST.offY);      // no travel, no spin
        }

        /* One clock for the whole flight: the render loop. Timers are throttled
           hard while a tab is occluded and the first build frames are heavy
           enough to starve them anyway, which is how the travel used to get
           its last frame and nothing else. Driving hold, travel and navigation
           off rAF keeps every phase in step with what is actually drawn. */
        const t0 = performance.now();
        let last = t0;
        let navigated = false;
        let released = false;
        let releasedAt = 0;
        const dur = NH_REDUCED ? 420 : hp.duration;
        const fire = () => { if (navigated) return; navigated = true; clearTimeout(failsafe); go(); };

        /* Release = the model is drawable at the card. Only now do we cover the
           universe and start the travel, so the reader sees the whole move
           instead of its final frame. */
        const release = (now) => {
          if (released) return;
          released = true;
          releasedAt = now;
          setHolding(false);
          fadeUniverse(0, 420);
          if (travels) rig.setLayout(REST.fracX, REST.scale, REST.offY);
        };

        // If rAF stops entirely (tab hidden mid-flight) still reach the page.
        const failsafe = setTimeout(fire, NH_HOLD_MAX + dur + 1200);

        let paintedFrames = 0;      // frames drawn with the model in the scene
        let travelFrames = 0;       // frames drawn since the travel began

        const loop = (now) => {
          const dt = now - last; last = now;
          if (!NH_REDUCED) rig.nudgeYaw(Math.min(50, dt) * hp.spinSpeed);
          rig.update(dt);
          rig.render();

          if (rig.ready) paintedFrames++;
          else if (released) paintedFrames++;          // proxy nodes never flip ready
          if (!released && (paintedFrames >= 2 || now - t0 >= NH_HOLD_MAX)) release(now);
          if (released) travelFrames++;

          /* Leave for the page on time, but never before the travel has had
             real frames to show. On a cold GPU the wall clock runs out while
             the first frames are still compiling, which is what made the model
             look like it teleported. The failsafe timer above is the backstop
             if frames stop arriving altogether. */
          if (released && now - releasedAt >= dur && travelFrames >= 10) { fire(); return; }
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
    if (!returningRef.current) return;
    sessionStorage.removeItem("mo_node_return");
    const addr = sessionStorage.getItem("mo_node_return_addr") || "";
    const returnTarget = sessionStorage.getItem("mo_node_return_target") || "work";
    sessionStorage.removeItem("mo_node_return_target");
    sessionStorage.removeItem("mo_node_return_addr");
    const project = window.MO_PROJECT_BY_ADDR && window.MO_PROJECT_BY_ADDR[addr];
    if (!project) {
      returningRef.current = false;
      nhClearStale();
      setMode("idle");
      return;
    }
    const hp = Object.assign({}, NH_DEFAULTS, (project.model && project.model.handoffPose) || {});
    setHud({ addr: project.addr, name: project.name.toUpperCase() });
    setHolding(false);
    setMode("return");
    fadeUniverse(0, 0);
    document.body.classList.add("wf-flying");

    requestAnimationFrame(() => {
      const rig = buildRig(project);
      if (!rig) {
        returningRef.current = false;
        fadeUniverse(1, 600);
        document.body.classList.remove("wf-flying");
        nhClearStale();
        setMode("idle");
        return;
      }
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
          returningRef.current = false;
          nhClearStale();
          sessionStorage.removeItem("mo_node_seam");
          setMode("idle");
        }, 760);
      };
      /* HOLD is a MINIMUM, not a schedule. The forward flight already waits for
         the model to paint before it releases; the return leg used to dissolve
         on a flat timer, so on a cold landing boot - which is exactly what a
         return is - a heavy GLB could still be decoding when the flight ended
         and the visitor saw the field come back with nothing flying home.
         models/wafer_demo.glb is 802 KB with 94k triangles and KTX2 textures,
         so it is the one that loses that race first. Hold until it has actually
         painted a couple of frames, capped so a failed load cannot strand the
         transition. */
      const t0 = performance.now();
      let painted = 0;
      const readyToDissolve = (now) => {
        const elapsed = now - t0;
        if (elapsed >= HOLD + NH_HOLD_MAX) return true;   // give up waiting
        return painted >= 2 && elapsed >= HOLD;
      };
      // rAF stops in a hidden tab; this guarantees the transition still ends.
      const dissolveTimer = setTimeout(dissolve, HOLD + NH_HOLD_MAX + 400);
      const loop = (now) => {
        const dt = now - last; last = now;
        if (!NH_REDUCED) rig.nudgeYaw(Math.min(50, dt) * hp.spinSpeed);
        rig.update(dt);
        rig.render();
        if (rig.ready) painted++;
        if (!dissolved && readyToDissolve(now)) { clearTimeout(dissolveTimer); dissolve(); }
        if (!dissolved) rafRef.current = requestAnimationFrame(loop);
        else rig.render();
      };
      rafRef.current = requestAnimationFrame(loop);
      void dissolveTimer;
    });
  }, []);

  useNHE(() => () => {
    cancelAnimationFrame(rafRef.current);
    stopPrep();
    clearTimeout(hoverTimerRef.current);
    if (rigRef.current) rigRef.current.dispose();
  }, []);

  return (
    <div className={"wf " + (mode !== "idle" ? "wf--on " : "") + (holding ? "wf--hold" : "")} aria-hidden="true">
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
