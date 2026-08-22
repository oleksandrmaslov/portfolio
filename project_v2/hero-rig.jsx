/* ============================================================
   M.O. SYSTEM — Wafer HERO RIG  (shared between Landing v6 + Wafer v2)
   ------------------------------------------------------------
   ONE renderer/scene/camera setup that draws the wafer GLB the
   SAME way on both pages, so a page navigation can be made to look
   like one continuous shot:

     · Landing v6 plays a FLIGHT: model rushes from far → the
       CANONICAL ARRIVAL POSE, freezes there, then navigates.
     · Wafer v2 boots, snaps the rig to that exact arrival pose on
       the same black bg (the seam), then EASES to the hero rest
       layout while the title resolves around it.

   The arrival pose (window.WAFER_RIG) is the contract — it MUST be
   identical on both sides, so it lives here and both import it.

   States the rig can be eased toward (set targets, update() eases):
     entry   1 = present · <1 pushes back + shrinks + spins (fly in/out)
     offX/Y  pivot world offset (hero layout: right / center / left)
     scale   overall size multiplier
     yaw/pit orbit rotation of the model (inspect drag)
     explode 0..1 parts separate along their out-vectors
   ============================================================ */
(function () {
  const SIGNAL = 0x00f0c8;

  /* ---- CANONICAL ARRIVAL POSE — the cross-page contract ---- */
  const RIG = {
    fov: 38,
    camZ: 5.4,            // camera distance from origin (z+)
    modelFit: 4.1,        // longest model edge in world units
    pose: { x: 1.02, y: 0.0, z: 0.0 },  // base rest orientation (keyboard face → cam)
    arriveYaw: -0.52,     // 3/4 hero angle at arrival
    arrivePitch: 0.16,
    handoffScale: 0.86,   // model size during the centered spin handoff
    bg: 0x04060d,         // identical to --void on both pages
  };
  window.WAFER_RIG = RIG;

  const lerp = (a, b, t) => a + (b - a) * t;
  const damp = (cur, tgt, rate, dt) => lerp(cur, tgt, 1 - Math.pow(1 - rate, dt / 16));

  window.makeWaferRig = function (mount, opts = {}) {
    const THREE = window.THREE;
    if (!THREE || !mount) return null;
    const modelUrl = opts.model || "models/wafer_demo.glb";

    /* per-page pose override (e.g. flashlight lies at a different angle,
       Kerfur faces the camera). Falls back to the wafer contract pose. */
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
    renderer.toneMappingExposure = 1.05;
    mount.appendChild(renderer.domElement);
    renderer.domElement.style.display = "block";

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(RIG.fov, w / h, 0.1, 100);
    camera.position.set(0, 0, RIG.camZ);
    camera.lookAt(0, 0, 0);

    /* environment for PBR reflections (optional addon) */
    let pmrem = null, envTarget = null, roomEnvironment = null;
    if (THREE.RoomEnvironment) {
      try {
        pmrem = new THREE.PMREMGenerator(renderer);
        roomEnvironment = new THREE.RoomEnvironment();
        envTarget = pmrem.fromScene(roomEnvironment, 0.04);
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

    /* lights — deep + signal rim (matches the demo viewer language) */
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const key = new THREE.DirectionalLight(0xffffff, 1.35);
    key.position.set(2.6, 3.4, 2.4); scene.add(key);
    const rim = new THREE.PointLight(SIGNAL, 1.7, 16); rim.position.set(-2.6, 1.4, -2.2); scene.add(rim);
    const fill = new THREE.PointLight(0x4a6b9c, 0.6, 16); fill.position.set(3.0, -2.4, 1.4); scene.add(fill);

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
      // Matcap (dark chrome + signal rim) — guaranteed-visible on the void bg
      // AND identical to the universe card look, so the flight reads continuous.
      // Procedural hero models (opts.matcap === false) keep their own materials.
      if (opts.matcap !== false && window.applyMatcapToModel) window.applyMatcapToModel(root, THREE);
      holder.add(root);
      // collect meshes for the exploded view
      const centre = new THREE.Vector3();
      const box = new THREE.Box3().setFromObject(root);
      box.getCenter(centre);
      root.traverse((o) => {
        if (!o.isMesh) return;
        const wp = new THREE.Vector3();
        o.getWorldPosition(wp);
        const dir = wp.clone().sub(centre);
        if (dir.lengthSq() < 1e-6) dir.set(0, 1, 0);   // single-mesh fallback: clean vertical lift
        dir.normalize();
        parts.push({ mesh: o, base: o.position.clone(), out: dir });
      });
      modelReady = true;
      if (opts.onReady) opts.onReady();
    }

    if (typeof opts.buildModel === "function") {
      // Procedural hero (no GLB yet). A descriptor can supply an update hook
      // that is driven by this rig, so it inherits the shared visibility gate.
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
    let offFracX = 0;          // layout offset expressed as fraction of half-width (resize-stable)
    let idleSpin = 0;          // subtle hero idle drift
    let idleEnabled = false;
    let easeRate = 0.16;       // base damping rate (slowed during the handoff travel)
    let yawRate = 0.22;        // yaw/pitch damping (slowed for a graceful arrival finish)

    function halfWidthAt(dist) {
      const vh = 2 * dist * Math.tan((RIG.fov * Math.PI / 180) / 2);
      return vh * 0.5 * (camera.aspect || (w / h));
    }
    function recomputeOffX() { tgt.offX = offFracX * halfWidthAt(tgt.dist); }

    /* ARRIVAL pose object — the seam contract (used to snap on entry) */
    function arrivalState() {
      return { entry: 1, offX: 0, offY: 0, scale: 1, yaw: RIG.arriveYaw, pitch: RIG.arrivePitch, explode: 0, dist: RIG.camZ };
    }

    /* HANDOFF pose — the Cartier-style seam: model CENTERED, large, fully
       present (entry 1). Both pages agree on this so the model never
       leaves the screen across the navigation; only its spin + rest slide
       differ per side. scale 0.86 reads as a confident hero turn. */
    const HANDOFF = { entry: 1, offX: 0, offY: 0, scale: RIG.handoffScale, pitch: RIG.arrivePitch, explode: 0, dist: RIG.camZ };

    function applyToScene() {
      const e = cur.entry;
      // entry pushes the model back + shrinks + adds an unwinding turn
      const entryScale = 0.12 + 0.88 * e;
      pivot.scale.setScalar(cur.scale * entryScale);
      pivot.position.set(cur.offX, cur.offY, (1 - e) * -7.0);
      spin.rotation.y = cur.yaw + (1 - e) * 1.25 + idleSpin;
      spin.rotation.x = cur.pitch;
      camera.position.z = cur.dist;
      // explode
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
      const R = easeRate;      // base ease rate (tunable for graceful handoff)
      cur.entry   = damp(cur.entry,   tgt.entry,   R, dt);
      cur.offX    = damp(cur.offX,    tgt.offX,    R, dt);
      cur.offY    = damp(cur.offY,    tgt.offY,    R, dt);
      cur.scale   = damp(cur.scale,   tgt.scale,   R, dt);
      cur.yaw     = damp(cur.yaw,     tgt.yaw,     yawRate, dt);
      cur.pitch   = damp(cur.pitch,   tgt.pitch,   yawRate, dt);
      cur.explode = damp(cur.explode, tgt.explode, 0.12, dt);
      cur.dist    = damp(cur.dist,    tgt.dist,    R, dt);
      if (idleEnabled) idleSpin += dt * 0.00004;   // very gentle hero drift
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

    /* ---- public controls ---- */
    const api = {
      el: renderer.domElement,
      get ready() { return modelReady; },
      render, update, setSize,
      setEaseRate(r) { easeRate = r; },
      setYawRate(r) { yawRate = r; },
      isAt(name) { return false; },
      snapArrival() { Object.assign(cur, arrivalState()); Object.assign(tgt, arrivalState()); offFracX = 0; applyToScene(); },

      /* ---- CARTIER-STYLE HANDOFF (model never leaves the screen) ---- */
      // Place the model AT a screen position (mount-local px) + size — used to
      // originate the handoff from the clicked card, so it eases card → page.
      startFromScreen(cx, cy, vw, vh, scale) {
        const halfH = RIG.camZ * Math.tan((RIG.fov * Math.PI / 180) / 2);
        const aspect = vw / vh;
        const halfW = halfH * aspect;
        const fracX = (cx - vw / 2) / (vw / 2);
        const fracY = -(cy - vh / 2) / (vh / 2);
        offFracX = fracX * (halfW / halfWidthAt(RIG.camZ));   // store as half-width fraction
        cur.entry = 1; cur.scale = scale; cur.explode = 0; cur.dist = RIG.camZ;
        cur.offX = fracX * halfW; cur.offY = fracY * halfH;
        cur.yaw = RIG.arriveYaw; cur.pitch = RIG.arrivePitch;
        Object.assign(tgt, cur);              // hold until we ease
        applyToScene();
      },
      // Landing: ease (from wherever cur is) to the CENTERED + large pose.
      easeToHandoff() {
        offFracX = 0;
        tgt.entry = 1; tgt.offX = 0; tgt.offY = 0;
        tgt.scale = RIG.handoffScale; tgt.pitch = RIG.arrivePitch; tgt.explode = 0; tgt.dist = RIG.camZ;
      },
      // Snap INSTANTLY to a rest layout (the cross-page seam). yaw lets us
      // land mid-turn so the spin visibly finishes into the rest.
      snapToLayout(fracX, scale = 1, offY = 0, yaw = RIG.arriveYaw) {
        offFracX = fracX;
        tgt.entry = 1; tgt.scale = scale; tgt.offY = offY; tgt.pitch = RIG.arrivePitch; tgt.explode = 0; tgt.dist = RIG.camZ; tgt.yaw = yaw;
        recomputeOffX();
        cur.entry = 1; cur.scale = scale; cur.offY = offY; cur.pitch = RIG.arrivePitch; cur.explode = 0; cur.dist = RIG.camZ; cur.yaw = yaw; cur.offX = tgt.offX;
        applyToScene();
      },
      // Present the model CENTERED + large IMMEDIATELY (no card origin).
      beginHandoff() {
        Object.assign(cur, HANDOFF, { yaw: RIG.arriveYaw });
        Object.assign(tgt, HANDOFF, { yaw: RIG.arriveYaw });
        offFracX = 0; applyToScene();
      },
      // Wafer boot: snap to the SAME centered pose (the seam), set a hair
      // before arrival yaw so the turn visibly continues into the rest.
      snapHandoff() {
        Object.assign(cur, HANDOFF, { yaw: RIG.arriveYaw - 0.85 });
        Object.assign(tgt, HANDOFF, { yaw: RIG.arriveYaw - 0.85 });
        offFracX = 0; applyToScene();
      },
      // Reverse: ease from wherever it rests back to the centered pose.
      toHandoff() {
        offFracX = 0;
        tgt.entry = 1; tgt.offX = 0; tgt.offY = 0;
        tgt.scale = RIG.handoffScale; tgt.pitch = RIG.arrivePitch; tgt.explode = 0;
        recomputeOffX();
      },
      // Constant-velocity spin (drives BOTH cur+tgt so it never decelerates
      // until we stop calling it) — used for the on-screen handoff turn.
      nudgeYaw(d) { cur.yaw += d; tgt.yaw += d; },
      get yaw() { return cur.yaw; },
      setYawTarget(y) { tgt.yaw = y; },
      get entry() { return cur.entry; },
      setEntry(v) { tgt.entry = v; },
      setIdle(on) { idleEnabled = on; },
      // hero rest layout: fracX in [-1,1] (fraction of half-width), scale mult
      setLayout(fracX, scale = 1, offY = 0) {
        offFracX = fracX; tgt.scale = scale; tgt.offY = offY; recomputeOffX();
      },
      // inspect: pull to centre, enlarge, allow orbit
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
        const THREE = window.THREE;
        const box = new THREE.Box3().setFromObject(pivot);
        const min = box.min, max = box.max;
        return {
          parts: parts.length,
          holderChildren: holder.children.length,
          pivotScale: pivot.scale.x.toFixed(3),
          pivotPos: [pivot.position.x.toFixed(2), pivot.position.y.toFixed(2), pivot.position.z.toFixed(2)],
          worldBoxMin: [min.x.toFixed(2), min.y.toFixed(2), min.z.toFixed(2)],
          worldBoxMax: [max.x.toFixed(2), max.y.toFixed(2), max.z.toFixed(2)],
          camPos: [camera.position.x, camera.position.y, camera.position.z.toFixed(2)],
          envOk: !!scene.environment,
        };
      },
    };
    return api;
  };
})();
