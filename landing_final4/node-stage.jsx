/* ============================================================
   M.O. SYSTEM — SHARED NODE MODEL STAGE (landing_final3/node-stage.jsx)
   ------------------------------------------------------------
   ONE renderer · one scene · one camera · one canvas · one loop —
   for every node card. The canvas floats over the ACTIVE card's
   [data-model-stage] rect (tracked per frame, so it rides the
   reel transform). On target change: crossfade old → new model,
   apply the node's individual cardPose, keep a slow idle turn +
   pointer parallax. Models lazy-load through the shared GLTF
   cache; neighbours preload; a generation token kills stale
   callbacks so fast scrubbing can never stack two models.

   <NodeModelStage eventName="mo:reelStop" resolveEl={fn} neighbors={fn} />
     eventName  — CustomEvent carrying { detail: { addr } }
     resolveEl  — (addr) => DOM element the canvas should cover
     neighbors  — (addr) => [addr,...] to preload (optional)
   ============================================================ */
(function () {
  const { useEffect: useNS, useRef: useNSR } = React;
  const REDUCED = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  function NodeModelStage({ eventName, resolveEl, neighbors, zIndex = 3 }) {
    const wrapRef = useNSR(null);
    useNS(() => {
      const THREE = window.THREE;
      const wrap = wrapRef.current;
      if (!wrap) return;
      let disposed = false, raf = 0, renderer = null, scene = null, camera = null;
      let curHolder = null, prevHolder = null;
      let curAddr = null, generation = 0;
      let lastW = 0, lastH = 0, visible = false, targetEl = null;
      let yaw = 0, par = { x: 0, y: 0, sx: 0, sy: 0 };
      const small = window.matchMedia && window.matchMedia("(max-width: 760px)").matches;
      const DPR = Math.min(window.devicePixelRatio || 1, small ? 1.0 : 1.5);

      const boot = () => {
        renderer = new THREE.WebGLRenderer({ antialias: !small, alpha: true, powerPreference: "high-performance", preserveDrawingBuffer: true });
        renderer.setPixelRatio(DPR);
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.12;
        renderer.domElement.setAttribute("aria-hidden", "true");
        wrap.appendChild(renderer.domElement);
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(36, 1, 0.1, 60);
        camera.position.set(0, 0, 5.0);
        try {
          const pm = new THREE.PMREMGenerator(renderer);
          scene.environment = pm.fromScene(new THREE.RoomEnvironment(), 0.06).texture;
        } catch (_) {}
        scene.add(new THREE.AmbientLight(0xffffff, 0.8));
        const key = new THREE.DirectionalLight(0xffffff, 2.0); key.position.set(2.4, 3.2, 2.6); scene.add(key);
        const rim = new THREE.PointLight(0x00f0c8, 2.2, 20); rim.position.set(-2.8, 1.4, -2.2); scene.add(rim);
      };

      const setMatsOpacity = (holder, op, done) => {
        holder.traverse((o) => {
          const mats = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : null;
          if (!mats) return;
          for (const m of mats) {
            const base = m.userData.__baseOp != null ? m.userData.__baseOp : 1;
            // once the fade lands, drop back to the material's own blending so
            // the GPU isn't alpha-sorting a whole model every frame
            m.transparent = done ? (base < 1) : true;
            m.opacity = done ? base : op * base;
            m.needsUpdate = false;
          }
        });
      };
      const rememberBaseOpacity = (holder) => {
        holder.traverse((o) => {
          const mats = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : null;
          if (!mats) return;
          for (const m of mats) { if (m.userData.__baseOp == null) m.userData.__baseOp = m.opacity != null ? m.opacity : 1; }
        });
      };
      const disposeHolder = (holder) => {
        if (!holder) return;
        scene.remove(holder);
        holder.traverse((o) => {
          const mats = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
          if (holder.userData.isProxy) {
            if (o.geometry) o.geometry.dispose();
            for (const m of mats) { if (m.map) m.map.dispose(); m.dispose(); }
          } else {
            for (const m of mats) m.dispose();   // materials were cloned per-holder
          }
        });
      };

      const show = (project) => {
        const gen = ++generation;
        const attach = (root, isProxy) => {
          if (disposed || gen !== generation) return;
          const holder = new THREE.Group();
          holder.userData.isProxy = !!isProxy;
          const cp = (project.model && project.model.cardPose) || {};
          window.fitModelToSize(root, THREE, (cp.fit || 2.4));
          if (!isProxy) {
            // clones share materials with the GLTF cache — clone before tuning
            root.traverse((o) => { if (o.isMesh && o.material) o.material = Array.isArray(o.material) ? o.material.map((m) => m.clone()) : o.material.clone(); });
            if (project.model.assignMaterial && window.applySolidMaterials) window.applySolidMaterials(root, THREE, project.model.assignMaterial);
            else if (window.tuneRealMaterials) window.tuneRealMaterials(root, THREE, { envMapIntensity: 2.0 });
          }
          const poseG = new THREE.Group();
          const pose = cp.pose || null;
          if (pose) poseG.rotation.set(pose.x || 0, pose.y || 0, pose.z || 0);
          poseG.add(root);
          holder.add(poseG);
          holder.rotation.y = cp.yaw || 0;
          holder.rotation.x = cp.pitch || 0;
          holder.position.y = cp.offsetY || 0;
          holder.scale.setScalar(cp.scale || 1);
          holder.userData.baseYaw = cp.yaw || 0;
          rememberBaseOpacity(holder);
          holder.userData.fade = 0;
          setMatsOpacity(holder, 0);
          if (prevHolder) disposeHolder(prevHolder);
          prevHolder = curHolder;
          if (prevHolder) prevHolder.userData.dying = true;
          curHolder = holder;
          scene.add(holder);
        };
        const m = project.model || {};
        if (m.ready && m.src && window.loadProjectModel) {
          window.loadProjectModel(m.src, THREE)
            .then((root) => attach(root, false))
            .catch(() => attach(window.makeNodeProxy(THREE, project), true));
        } else {
          attach(window.makeNodeProxy(THREE, project), true);
        }
        // preload neighbours only — never all 12 at once
        if (neighbors && window.loadProjectModel) {
          for (const na of (neighbors(project.addr) || [])) {
            const np = window.MO_PROJECT_BY_ADDR && window.MO_PROJECT_BY_ADDR[na];
            if (np && np.model && np.model.ready && np.model.src) window.loadProjectModel(np.model.src, THREE).catch(() => {});
          }
        }
      };

      const onEvent = (e) => {
        const addr = e && e.detail && e.detail.addr;
        if (!addr) { curAddr = null; return; }               // no card active — stage just fades with its target gone
        if (addr === curAddr) return;
        curAddr = addr;
        const p = window.MO_PROJECT_BY_ADDR && window.MO_PROJECT_BY_ADDR[addr];
        if (!p || !p.model || p.model.enabled === false) return;
        if (!renderer) boot();
        show(p);
      };
      window.addEventListener(eventName, onEvent);

      const onPointer = (e) => {
        par.x = (e.clientX / window.innerWidth - 0.5) * 2;
        par.y = (e.clientY / window.innerHeight - 0.5) * 2;
      };
      window.addEventListener("pointermove", onPointer, { passive: true });

      // pause when the stage's section is off-screen
      const io = new IntersectionObserver((en) => { visible = en[0].isIntersecting; }, { threshold: 0 });
      io.observe(wrap);

      let last = performance.now();
      let lastDraw = 0;
      const MIN_FRAME = small ? 33 : 0;             // phones: cap the second context at ~30fps
      const loop = (now) => {
        if (disposed) return;
        raf = requestAnimationFrame(loop);
        const dt = Math.min(50, now - last); last = now;
        if (!renderer || document.hidden || !visible) return;
        if (MIN_FRAME && now - lastDraw < MIN_FRAME) return;
        lastDraw = now;
        // follow the active card's model zone
        targetEl = curAddr && resolveEl ? resolveEl(curAddr) : null;
        if (!targetEl) { wrap.style.opacity = "0"; return; }
        const r = targetEl.getBoundingClientRect();
        const host = wrap.offsetParent ? wrap.offsetParent.getBoundingClientRect() : { left: 0, top: 0 };
        wrap.style.opacity = "1";
        wrap.style.transform = `translate(${(r.left - host.left).toFixed(1)}px, ${(r.top - host.top).toFixed(1)}px)`;
        const w = Math.max(2, Math.round(r.width)), h = Math.max(2, Math.round(r.height));
        if (Math.abs(w - lastW) > 1 || Math.abs(h - lastH) > 1) {
          lastW = w; lastH = h;
          wrap.style.width = w + "px"; wrap.style.height = h + "px";
          renderer.setSize(w, h);
          camera.aspect = w / h; camera.updateProjectionMatrix();
        }
        // idle motion — very slow turn + pointer parallax (off for reduced motion)
        if (!REDUCED) {
          yaw += dt * 0.00028;
          par.sx += (par.x - par.sx) * 0.04;
          par.sy += (par.y - par.sy) * 0.04;
        }
        const ease = 1 - Math.pow(0.002, dt / 1000);
        if (curHolder) {
          const f = curHolder.userData.fade || 0;
          if (f < 1) {
            const nf = Math.min(1, f + dt / 420);
            curHolder.userData.fade = nf;
            setMatsOpacity(curHolder, nf, nf >= 1);   // traverse only WHILE fading in
          }
          curHolder.rotation.y = (curHolder.userData.baseYaw || 0) + yaw + par.sx * 0.14;
          curHolder.rotation.x += (((curHolder.userData.baseYawX || 0) + par.sy * 0.08) - curHolder.rotation.x) * ease;
        }
        if (prevHolder) {
          prevHolder.userData.fade = (prevHolder.userData.fade != null ? prevHolder.userData.fade : 1) - dt / 300;
          if (prevHolder.userData.fade <= 0) { disposeHolder(prevHolder); prevHolder = null; }
          else { setMatsOpacity(prevHolder, Math.max(0, prevHolder.userData.fade)); prevHolder.rotation.y += dt * 0.0003; }
        }
        renderer.render(scene, camera);
      };
      raf = requestAnimationFrame(loop);

      return () => {
        disposed = true;
        cancelAnimationFrame(raf);
        io.disconnect();
        window.removeEventListener(eventName, onEvent);
        window.removeEventListener("pointermove", onPointer);
        if (renderer) { try { wrap.removeChild(renderer.domElement); } catch (_) {} renderer.dispose(); }
      };
    }, []);

    return <div className="nodeStage" ref={wrapRef} aria-hidden="true" style={{ zIndex }} />;
  }

  window.NodeModelStage = NodeModelStage;
})();
