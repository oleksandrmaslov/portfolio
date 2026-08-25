/* ============================================================
   M.O. SYSTEM — Project hero rig
   ------------------------------------------------------------
   THE project hero rig: every project route and the landing handoff
   run this one. It absorbed basic-hero-rig.jsx, which was a fork of
   this file differing only in its lighting, its matcap material pass
   and its pose/modelFit defaults — so four routes drew their hero
   dimmer and flatter than the rest for no stated reason. If a model
   needs different handling, give it an OPTION here; do not fork the
   rig again.
   Same renderer/scene/camera + the canonical arrival pose so the
   landing→page seam stays one continuous shot — but:

     · loads the production Wafer model (models/wafer_demo.glb), which
       ships its own PBR materials (anodized case/plate, nylon
       caps, green PCB, grey LCD, dark switches);
     · NO matcap — materials are kept (window.tuneRealMaterials)
       and only nudged to read on the void; material-less models
       (flashlight) get window.applySolidMaterials instead;
     · lighting is pushed a little harder so the near-black
       anodized metal is defined by the key + signal rim.

   Material route, in priority order:
     assignMaterial → a GLB that ships none of its own (the flashlight)
     keepMaterials  → a procedural hero that authored its own (Kerfur)
     default        → real GLB materials, tuned to read on the void
   ============================================================ */
(function () {
  const SIGNAL = 0x00f0c8;

   /* ---- CANONICAL ARRIVAL POSE — the cross-page contract ----
     Shared by the landing Wafer flight and project page so the seam
     lines up. Tuned for the production Z-up model. */
  const RIG = {
    fov: 38,
    camZ: 5.4,
    modelFit: 4.0,                       // longest model edge in world units
    pose: { x: -0.92, y: 0.0, z: 0.0 },  // tilt the Z-up deck to a 3/4 hero
    arriveYaw: -0.52,
    arrivePitch: 0.16,
    handoffScale: 0.86,
    bg: 0x04060d,
  };
  window.WAFER_RIG = RIG;

  const lerp = (a, b, t) => a + (b - a) * t;
  const damp = (cur, tgt, rate, dt) => lerp(cur, tgt, 1 - Math.pow(1 - rate, dt / 16));

  window.makeWaferRig = function (mount, opts = {}) {
    const THREE = window.THREE;
    if (!THREE || !mount) return null;
    const modelUrl = opts.model || "models/wafer_demo.glb";

    const POSE = opts.pose || RIG.pose;

    const sz = () => ({ w: mount.clientWidth || 1, h: mount.clientHeight || 1 });
    let { w, h } = sz();

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
      preserveDrawingBuffer: opts.preserveDrawingBuffer === true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;
    mount.appendChild(renderer.domElement);
    renderer.domElement.style.display = "block";

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(RIG.fov, w / h, 0.1, 100);
    camera.position.set(0, 0, RIG.camZ);
    camera.lookAt(0, 0, 0);

    /* environment for PBR reflections — the anodized metal lives off this */
    let pmrem = null, envTarget = null, roomEnvironment = null;
    if (THREE.RoomEnvironment) {
      try {
        pmrem = new THREE.PMREMGenerator(renderer);
        roomEnvironment = new THREE.RoomEnvironment();
        envTarget = pmrem.fromScene(roomEnvironment, 0.08);
        scene.environment = envTarget.texture;
      } catch (_) {}
      finally {
        if (roomEnvironment) {
          if (roomEnvironment.dispose) roomEnvironment.dispose();
          else roomEnvironment.traverse((object) => {
            if (object.geometry && object.geometry.dispose) object.geometry.dispose();
            const mats = object.material ? (Array.isArray(object.material) ? object.material : [object.material]) : [];
            mats.forEach((material) => material && material.dispose && material.dispose());
          });
        }
        if (pmrem) pmrem.dispose();
        pmrem = null;
      }
    }

    /* Lighting is tuned so the dark production materials read. */
    scene.add(new THREE.AmbientLight(0xffffff, 0.85));
    const key = new THREE.DirectionalLight(0xffffff, 2.3);
    key.position.set(2.6, 3.6, 2.6); scene.add(key);
    const rim = new THREE.PointLight(SIGNAL, 3.0, 18); rim.position.set(-2.8, 1.6, -2.4); scene.add(rim);
    const fill = new THREE.PointLight(0x6f8fc4, 1.0, 18); fill.position.set(3.2, -2.4, 1.6); scene.add(fill);
    const top = new THREE.DirectionalLight(0xbfd3ff, 0.9); top.position.set(-0.4, 4.0, -1.2); scene.add(top);

    /* hierarchy: pivot (offset+scale) → spin (orbit) → holder (base pose) → GLB */
    const pivot  = new THREE.Group();
    const spin   = new THREE.Group();
    const holder = new THREE.Group();
    holder.rotation.set(POSE.x, POSE.y, POSE.z);
    spin.add(holder);
    pivot.add(spin);
    scene.add(pivot);

    /* explode bookkeeping — per-mesh base local position + out vector */
    const parts = [];
    let modelReady = false;
    let modelUpdate = null;

    function ingest(root) {
      window.fitModelToSize(root, THREE, opts.modelFit || RIG.modelFit);
      // NO matcap. Three material paths, in priority order:
      //   assignMaterial  → material-less GLB gets one solid house material
      //   keepMaterials   → procedural hero authored its own; leave it alone
      //   default         → real GLB materials, nudged to read on the void
      // keepMaterials exists because tuneRealMaterials clones every material
      // and raises envMapIntensity. A procedural body was lit without an
      // environment, so that both washes it out and hands the builder's own
      // per-frame code a material object the scene no longer draws.
      if (opts.assignMaterial && window.applySolidMaterials) {
        window.applySolidMaterials(root, THREE, opts.assignMaterial);
      } else if (opts.keepMaterials !== true && window.tuneRealMaterials) {
        window.tuneRealMaterials(root, THREE, { envMapIntensity: 1.9 });
      }
      holder.add(root);
      // collect meshes for the exploded view (radial out-vectors)
      const centre = new THREE.Vector3();
      const box = new THREE.Box3().setFromObject(root);
      box.getCenter(centre);
      root.traverse((o) => {
        if (!o.isMesh) return;
        const wp = new THREE.Vector3();
        o.getWorldPosition(wp);
        const dir = wp.clone().sub(centre);
        if (dir.lengthSq() < 1e-6) dir.set(0, 1, 0);
        dir.normalize();
        parts.push({ mesh: o, base: o.position.clone(), out: dir });
      });
      modelReady = true;
      if (opts.onReady) opts.onReady();
    }

    if (typeof opts.buildModel === "function") {
      // Procedural hero (no GLB yet). A builder may return a bare Object3D, or
      // a { group, update } descriptor whose update runs inside THIS rig's
      // loop — so it inherits the shared visibility gate instead of holding a
      // second permanent RAF open for the lifetime of the page.
      try {
        const built = opts.buildModel(THREE);
        if (built && built.group && built.group.isObject3D) {
          modelUpdate = typeof built.update === "function" ? built.update : null;
          ingest(built.group);
        } else ingest(built);
      }
      catch (e) { console.warn("[wafer-rig] buildModel failed", e); }
    } else if (window.loadProjectModel) {
      window.loadProjectModel(modelUrl, THREE)
        .then(ingest)
        .catch((e) => { console.warn("[wafer-rig] model load failed", e); });
    }

    /* ---- eased state (cur) toward targets (tgt) ---- */
    const cur = { entry: 1, offX: 0, offY: 0, scale: 1, yaw: RIG.arriveYaw, pitch: RIG.arrivePitch, explode: 0, dist: RIG.camZ };
    const tgt = { ...cur };
    let offFracX = 0;
    let idleSpin = 0;
    let idleEnabled = false;
    let easeRate = 0.16;
    let yawRate = 0.22;

    function halfWidthAt(dist) {
      const vh = 2 * dist * Math.tan((RIG.fov * Math.PI / 180) / 2);
      return vh * 0.5 * (camera.aspect || (w / h));
    }
    function recomputeOffX() { tgt.offX = offFracX * halfWidthAt(tgt.dist); }

    function arrivalState() {
      return { entry: 1, offX: 0, offY: 0, scale: 1, yaw: RIG.arriveYaw, pitch: RIG.arrivePitch, explode: 0, dist: RIG.camZ };
    }

    const HANDOFF = { entry: 1, offX: 0, offY: 0, scale: RIG.handoffScale, pitch: RIG.arrivePitch, explode: 0, dist: RIG.camZ };

    function applyToScene() {
      const e = cur.entry;
      const entryScale = 0.12 + 0.88 * e;
      pivot.scale.setScalar(cur.scale * entryScale);
      pivot.position.set(cur.offX, cur.offY, (1 - e) * -7.0);
      spin.rotation.y = cur.yaw + (1 - e) * 1.25 + idleSpin;
      spin.rotation.x = cur.pitch;
      camera.position.z = cur.dist;
      if (parts.length) {
        const amt = cur.explode * (RIG.modelFit * 0.42);
        for (const p of parts) {
          p.mesh.position.set(
            p.base.x + p.out.x * amt,
            p.base.y + p.out.y * amt,
            p.base.z + p.out.z * amt,
          );
        }
      }
    }
    applyToScene();

    function update(dt) {
      dt = Math.min(50, dt);
      if (modelUpdate) {
        try { modelUpdate(performance.now(), dt); }
        catch (error) {
          console.warn("[wafer-rig] procedural model update failed", error);
          modelUpdate = null;
        }
      }
      const R = easeRate;
      cur.entry   = damp(cur.entry,   tgt.entry,   R, dt);
      cur.offX    = damp(cur.offX,    tgt.offX,    R, dt);
      cur.offY    = damp(cur.offY,    tgt.offY,    R, dt);
      cur.scale   = damp(cur.scale,   tgt.scale,   R, dt);
      cur.yaw     = damp(cur.yaw,     tgt.yaw,     yawRate, dt);
      cur.pitch   = damp(cur.pitch,   tgt.pitch,   yawRate, dt);
      cur.explode = damp(cur.explode, tgt.explode, 0.12, dt);
      cur.dist    = damp(cur.dist,    tgt.dist,    R, dt);
      if (idleEnabled) idleSpin += dt * 0.00004;
      applyToScene();
    }

    function render() { renderer.render(scene, camera); }

    function setSize(nw, nh) {
      w = nw; h = nh;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      recomputeOffX();
    }

    /* ---- shared rig controls ---- */
    const api = {
      el: renderer.domElement,
      get ready() { return modelReady; },
      render, update, setSize,
      setEaseRate(r) { easeRate = r; },
      setYawRate(r) { yawRate = r; },
      isAt() { return false; },
      snapArrival() { Object.assign(cur, arrivalState()); Object.assign(tgt, arrivalState()); offFracX = 0; applyToScene(); },
      startFromScreen(cx, cy, vw, vh, scale) {
        const halfH = RIG.camZ * Math.tan((RIG.fov * Math.PI / 180) / 2);
        const aspect = vw / vh;
        const halfW = halfH * aspect;
        const fracX = (cx - vw / 2) / (vw / 2);
        const fracY = -(cy - vh / 2) / (vh / 2);
        offFracX = fracX * (halfW / halfWidthAt(RIG.camZ));
        cur.entry = 1; cur.scale = scale; cur.explode = 0; cur.dist = RIG.camZ;
        cur.offX = fracX * halfW; cur.offY = fracY * halfH;
        cur.yaw = RIG.arriveYaw; cur.pitch = RIG.arrivePitch;
        Object.assign(tgt, cur);
        applyToScene();
      },
      easeToHandoff() {
        offFracX = 0;
        tgt.entry = 1; tgt.offX = 0; tgt.offY = 0;
        tgt.scale = RIG.handoffScale; tgt.pitch = RIG.arrivePitch; tgt.explode = 0; tgt.dist = RIG.camZ;
      },
      snapToLayout(fracX, scale = 1, offY = 0, yaw = RIG.arriveYaw) {
        offFracX = fracX;
        tgt.entry = 1; tgt.scale = scale; tgt.offY = offY; tgt.pitch = RIG.arrivePitch; tgt.explode = 0; tgt.dist = RIG.camZ; tgt.yaw = yaw;
        recomputeOffX();
        cur.entry = 1; cur.scale = scale; cur.offY = offY; cur.pitch = RIG.arrivePitch; cur.explode = 0; cur.dist = RIG.camZ; cur.yaw = yaw; cur.offX = tgt.offX;
        applyToScene();
      },
      beginHandoff() {
        Object.assign(cur, HANDOFF, { yaw: RIG.arriveYaw });
        Object.assign(tgt, HANDOFF, { yaw: RIG.arriveYaw });
        offFracX = 0; applyToScene();
      },
      snapHandoff() {
        Object.assign(cur, HANDOFF, { yaw: RIG.arriveYaw - 0.85 });
        Object.assign(tgt, HANDOFF, { yaw: RIG.arriveYaw - 0.85 });
        offFracX = 0; applyToScene();
      },
      toHandoff() {
        offFracX = 0;
        tgt.entry = 1; tgt.offX = 0; tgt.offY = 0;
        tgt.scale = RIG.handoffScale; tgt.pitch = RIG.arrivePitch; tgt.explode = 0;
        recomputeOffX();
      },
      nudgeYaw(d) { cur.yaw += d; tgt.yaw += d; },
      get yaw() { return cur.yaw; },
      setYawTarget(y) { tgt.yaw = y; },
      get entry() { return cur.entry; },
      setEntry(v) { tgt.entry = v; },
      setIdle(on) { idleEnabled = on; },
      setLayout(fracX, scale = 1, offY = 0) {
        offFracX = fracX; tgt.scale = scale; tgt.offY = offY; recomputeOffX();
      },
      setInspect(on) {
        if (on) { offFracX = 0; recomputeOffX(); tgt.offY = 0; tgt.scale = 1.12; tgt.dist = RIG.camZ * 0.94; idleEnabled = false; }
      },
      orbit(dx, dy) {
        tgt.yaw   += dx * 0.006;
        tgt.pitch += dy * 0.006;
        tgt.pitch  = Math.max(-1.2, Math.min(1.2, tgt.pitch));
      },
      resetOrbit() { tgt.yaw = RIG.arriveYaw; tgt.pitch = RIG.arrivePitch; },
      setExplode(v) { tgt.explode = Math.max(0, Math.min(1, v)); },
      get explode() { return tgt.explode; },
      dispose() {
        try { mount.removeChild(renderer.domElement); } catch (_) {}
        modelUpdate = null;
        if (envTarget) envTarget.dispose();
        if (renderer.renderLists) renderer.renderLists.dispose();
        renderer.dispose();
        if (renderer.forceContextLoss) renderer.forceContextLoss();
      },
      _debug() {
        const box = new THREE.Box3().setFromObject(pivot);
        return { parts: parts.length, ready: modelReady, envOk: !!scene.environment,
                 box: [box.min.toArray().map(n=>+n.toFixed(2)), box.max.toArray().map(n=>+n.toFixed(2))] };
      },
    };
    return api;
  };
})();
