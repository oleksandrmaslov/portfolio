/* ============================================================
   M.O. SYSTEM — SHARED PROJECT-PAGE LIFECYCLE
   ------------------------------------------------------------
   Runtime ownership for the shared project-page template. Wafer
   deliberately keeps its bespoke lifecycle: its live keyboard demo has
   different renderer and interaction ownership.

   This source must execute before standard-page.jsx.
   ============================================================ */
(function installProjectPageLifecycle(global) {
  "use strict";

  /* "<- UNIVERSE": the chrome fades, the hero winds up and holds, and the
     landing docks it onto its card (window.moPageReturn, solid-hero-rig.jsx). */
  function leaveToUniverse(config) {
    if (document.body.classList.contains("hv-exit")) return;
    global.__hv_leaving = true;
    document.documentElement.style.setProperty("--hv-stage-op", "1");
    document.body.classList.add("hv-exit");
    wakeHeroRig();
    global.moPageReturn.leave(config.addr, global.__pageRig);
  }

  function wakeHeroRig() {
    global.dispatchEvent(new CustomEvent("mo:project-rig-wake"));
  }

  function useCursorEffect() {
    React.useEffect(() => {
      const sharedCursor = global.MOCursorDistortion;
      if (!sharedCursor || typeof sharedCursor.mountStandalone !== "function") return;
      const cursorFx = sharedCursor.mountStandalone({
        THREE: global.THREE,
        selector: "[data-mo-cursor-mirror]",
        zIndex: 20,
        dprCap: 1,
        disabledClasses: ["hv-exit", "hv-demoing", "mo-menu-open"],
      });
      return () => {
        if (cursorFx && typeof cursorFx.destroy === "function") cursorFx.destroy();
      };
    }, []);
  }

  function useHeroRigEffect(options) {
    const {
      config,
      project,
      stageRef,
      rigRef,
      demoRef,
      setReady,
      heroLayoutParams,
      applyHeroLayout,
      idleDrift = true,
      bridgeSeam = false,
    } = options;

    React.useEffect(() => {
      document.title = config.docTitle || (project.name + " — Maslov Oleksandr");
      const mount = stageRef.current;
      const hero = config.hero || {};
      const rig = global.makeWaferRig(mount, {
        model: hero.model || project.model,
        buildModel: hero.buildModel,
        pose: hero.pose,
        modelFit: hero.modelFit,
        keepMaterials: hero.keepMaterials,
      });
      rigRef.current = rig;
      global.__pageRig = rig;
      if (!rig) {
        setReady(true);
        return;
      }

      let disposed = false;
      let renderFrame = 0;
      let last = performance.now();
      const pendingFrames = new Set();
      const pendingTimers = new Set();

      const scheduleFrame = (callback) => {
        const id = requestAnimationFrame((now) => {
          pendingFrames.delete(id);
          if (!disposed) callback(now);
        });
        pendingFrames.add(id);
        return id;
      };
      const scheduleTimer = (callback, delay) => {
        const id = setTimeout(() => {
          pendingTimers.delete(id);
          if (!disposed) callback();
        }, delay);
        pendingTimers.add(id);
        return id;
      };

      const unboot = global.moPageReturn.boot(config.addr, rig);   // reads mo_node_arrive: before it goes
      const arrived = sessionStorage.getItem("mo_node_arrive") === "1"
                   && sessionStorage.getItem("mo_node_addr") === config.addr;
      sessionStorage.removeItem("mo_node_arrive");

      let arriving = arrived;   // held on the flight's last frame until the hero draws it
      const settleToRest = (yawTarget) => {
        arriving = false;
        if (global.__hv_leaving) return;   // the leave holds the hero; Back resets the flag first
        if (yawTarget != null && rig.setYawTarget) rig.setYawTarget(yawTarget);
        else rig.resetOrbit();
        applyHeroLayout(rig);
        if (idleDrift) rig.setIdle(true);
        setReady(true);
      };

      if (arrived) {
        // Boot ON the flight's last frame: its hand-over state (moArrival) in
        // this page's own layout, which is the one the flight landed on. Hold
        // it until the hero has drawn it, drop the seam, and let the rig carry
        // the flight's spring on. When it is back at rest the page settles:
        // the title enters (mo:hero-settled) and the signature beat plays.
        const a = global.moArrival();
        rig.arrive(a, heroLayoutParams());
        const settled = () => {
          settleToRest(a.yaw);
          global.dispatchEvent(new CustomEvent("mo:hero-settled", { detail: { addr: config.addr } }));
          rig.playBeat();
        };
        const dropSeam = () => {
          // The seam image and the live hero are the same frame, so the
          // bridge goes at once: a fade would only ghost the settle under it.
          const seam = document.getElementById("mo-seam");
          if (seam) seam.remove();
          sessionStorage.removeItem("mo_node_seam");
          rig.release(settled);
        };
        const waitReady = () => {
          if (rig.ready) scheduleFrame(() => scheduleFrame(dropSeam));
          else scheduleTimer(waitReady, 30);
        };
        waitReady();
      } else {
        if (bridgeSeam) {
          sessionStorage.removeItem("mo_node_seam");
          const seam = document.getElementById("mo-seam");
          if (seam) seam.remove();
        }
        sessionStorage.removeItem("mo_node_state");
        rig.beginHandoff();
        scheduleTimer(settleToRest, 460);
      }

      const shouldRender = () => !document.hidden && !document.body.classList.contains("mo-menu-open")
        && !document.body.classList.contains("hv-demoing") && (   // the hero is at opacity 0 under PLAY DEMO
        global.scrollY < global.innerHeight * 0.74
        || global.__hv_leaving   // the leave raises the stage at any scroll depth
      );
      const stopLoop = () => {
        if (renderFrame) cancelAnimationFrame(renderFrame);
        renderFrame = 0;
      };
      const loop = (now) => {
        renderFrame = 0;
        if (!shouldRender()) {
          last = now;
          return;
        }
        const dt = now - last;
        last = now;
        rig.update(dt);
        rig.render();
        renderFrame = requestAnimationFrame(loop);
      };
      const syncLoop = () => {
        if (disposed) return;
        if (!shouldRender()) {
          stopLoop();
          return;
        }
        if (renderFrame) return;
        // The page may have slept for minutes. Resume from a fresh clock so a
        // hidden/off-screen interval never arrives as one giant simulation dt.
        last = performance.now();
        renderFrame = requestAnimationFrame(loop);
      };
      syncLoop();

      const onResize = () => {
        if (!mount) return;
        rig.setSize(mount.clientWidth, mount.clientHeight);
        if (!demoRef.current && !global.__hv_leaving && !arriving) applyHeroLayout(rig);
        syncLoop();
      };
      global.addEventListener("resize", onResize);
      onResize();

      const onScroll = () => {
        if (!demoRef.current && !global.__hv_leaving) {
          const opacity = Math.max(0, 1 - global.scrollY / (global.innerHeight * 0.72));
          document.documentElement.style.setProperty("--hv-stage-op", opacity.toFixed(3));
        }
        syncLoop();
      };
      onScroll();
      global.addEventListener("scroll", onScroll, { passive: true });
      // Back/forward cache restores the page exactly as it left: wound up for
      // the leave, idle off. core.jsx has already cleared __hv_leaving.
      const onRestored = () => {
        if (!demoRef.current) settleToRest();
        onScroll();
      };
      document.addEventListener("visibilitychange", syncLoop);
      global.addEventListener("pageshow", syncLoop);
      global.addEventListener("mo:menu", syncLoop);
      global.addEventListener("mo:project-rig-wake", syncLoop);
      global.addEventListener("mo:page-restored", onRestored);

      return () => {
        disposed = true;
        stopLoop();
        pendingFrames.forEach(cancelAnimationFrame);
        pendingTimers.forEach(clearTimeout);
        pendingFrames.clear();
        pendingTimers.clear();
        global.removeEventListener("resize", onResize);
        global.removeEventListener("scroll", onScroll);
        document.removeEventListener("visibilitychange", syncLoop);
        global.removeEventListener("pageshow", syncLoop);
        global.removeEventListener("mo:menu", syncLoop);
        global.removeEventListener("mo:project-rig-wake", syncLoop);
        global.removeEventListener("mo:page-restored", onRestored);
        unboot();
        if (global.__pageRig === rig) global.__pageRig = null;
        rig.dispose();
      };
    }, []);
  }

  global.MOProjectPageLifecycle = {
    leaveToUniverse,
    wakeHeroRig,
    useCursorEffect,
    useHeroRigEffect,
  };
})(window);
