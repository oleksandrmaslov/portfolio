/* ============================================================
   M.O. SYSTEM — SHARED PROJECT-PAGE LIFECYCLE
   ------------------------------------------------------------
   Runtime ownership shared by the standard and handoff project-page
   compositions. Wafer deliberately keeps its bespoke lifecycle: its live
   keyboard demo has different renderer and interaction ownership.

   This source must execute before standard-page.jsx / handoff-page.jsx.
   ============================================================ */
(function installProjectPageLifecycle(global) {
  "use strict";

  function leaveToUniverse(config) {
    if (document.body.classList.contains("hv-exit")) return;
    global.__hv_leaving = true;
    document.documentElement.style.setProperty("--hv-stage-op", "1");
    const rig = global.__pageRig;
    if (rig) {
      rig.setIdle(false);
      rig.setExplode(0);
      rig.toHandoff();
      global.__hv_exitSpin = true;
    }
    document.body.classList.add("hv-exit");
    wakeHeroRig();

    // The landing continues the live page yaw during the reverse flight.
    try {
      if (rig && rig.yaw != null) sessionStorage.setItem("mo_node_yaw", String(rig.yaw));
    } catch (_) {}

    const returnTo = sessionStorage.getItem("mo_node_return_origin") || "work";
    sessionStorage.removeItem("mo_node_return_origin");
    sessionStorage.setItem("mo_node_return", "1");
    sessionStorage.setItem("mo_node_return_addr", config.addr);
    sessionStorage.setItem("mo_node_return_target", returnTo);
    const dest = returnTo === "universe" ? "./" : "./#work";
    setTimeout(() => { global.location.href = dest; }, 720);
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
        disabledClasses: ["hv-exit", "hv-demoing"],
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
        // Preserve both material routes. A procedural hero owns its authored
        // materials; a material-less GLB needs the explicit assignment route.
        assignMaterial: hero.assignMaterial,
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

      const arrived = sessionStorage.getItem("mo_node_arrive") === "1"
                   && sessionStorage.getItem("mo_node_addr") === config.addr;
      sessionStorage.removeItem("mo_node_arrive");

      const settleToRest = (yawTarget) => {
        if (yawTarget != null && rig.setYawTarget) rig.setYawTarget(yawTarget);
        else rig.resetOrbit();
        applyHeroLayout(rig);
        if (idleDrift) rig.setIdle(true);
        setReady(true);
      };

      if (arrived) {
        // Start at the angle painted by the landing flight, then continue
        // forward to the next hero-rest-equivalent angle.
        const rigGrade = global.WAFER_RIG;
        const seamYaw = parseFloat(sessionStorage.getItem("mo_node_yaw"));
        sessionStorage.removeItem("mo_node_yaw");
        let bootYaw;
        let restYaw;
        if (isFinite(seamYaw)) {
          bootYaw = seamYaw;
          restYaw = rigGrade.arriveYaw;
          while (restYaw < bootYaw + 0.25) restYaw += Math.PI * 2;
        } else {
          bootYaw = rigGrade.arriveYaw - 0.6;
          restYaw = rigGrade.arriveYaw;
        }
        const layout = heroLayoutParams();
        rig.snapToLayout(layout.fracX, layout.scale, layout.offY, bootYaw);
        if (rig.setYawRate) rig.setYawRate(0.045);
        setReady(true);
        scheduleFrame(() => scheduleFrame(() => settleToRest(restYaw)));
        scheduleTimer(() => { if (rig.setYawRate) rig.setYawRate(0.22); }, 1100);

        if (bridgeSeam) {
          const dropSeam = () => {
            const seam = document.getElementById("mo-seam");
            if (seam) {
              seam.style.opacity = "0";
              scheduleTimer(() => seam.remove(), 600);
            }
            sessionStorage.removeItem("mo_node_seam");
          };
          const waitReady = () => {
            if (rig.ready) scheduleFrame(() => scheduleFrame(dropSeam));
            else scheduleTimer(waitReady, 50);
          };
          waitReady();
        }
      } else {
        if (bridgeSeam) {
          sessionStorage.removeItem("mo_node_seam");
          const seam = document.getElementById("mo-seam");
          if (seam) seam.remove();
        }
        sessionStorage.removeItem("mo_node_yaw");
        rig.beginHandoff();
        scheduleTimer(settleToRest, 460);
      }

      const shouldRender = () => !document.hidden && (
        global.scrollY < global.innerHeight * 0.74
        || global.__hv_exitSpin
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
        if (global.__hv_exitSpin) rig.nudgeYaw(Math.min(50, dt) * 0.0019);
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
        if (!demoRef.current && !global.__hv_leaving) applyHeroLayout(rig);
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
      document.addEventListener("visibilitychange", syncLoop);
      global.addEventListener("pageshow", syncLoop);
      global.addEventListener("mo:project-rig-wake", syncLoop);

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
        global.removeEventListener("mo:project-rig-wake", syncLoop);
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
