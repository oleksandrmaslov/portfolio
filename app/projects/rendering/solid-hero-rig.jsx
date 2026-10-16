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
   landing→page seam stays one continuous shot. The handoff flight runs
   this same function, so the two change together.

   Material route, two-way (window.MOStudio, app/projects/rendering/studio.js):
     default        → the studio finish, chosen by model URL (LOOKS)
     keepMaterials  → a procedural hero or the node proxy (Kerfur): its
                      own materials, plus the Neutral hook and the
                      PROCEDURAL dress
   ============================================================ */
(function () {
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
    const initialModelUrl = opts.model || null;
    const initialPose = opts.pose || RIG.pose;

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
    /* Reaches only the proxy's lines and motes: model materials carry
       Neutral themselves and never meet the renderer's curve. */
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;
    mount.appendChild(renderer.domElement);
    renderer.domElement.style.display = "block";

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(RIG.fov, w / h, 0.1, 100);
    camera.position.set(0, 0, RIG.camZ);
    camera.lookAt(0, 0, 0);

    /* the studio room every model material reflects */
    let envTarget = null;
    try {
      envTarget = window.MOStudio.studioEnvironment(THREE, renderer, window.MOStudio.ROOM, 256);
      scene.environment = envTarget.texture;
    } catch (e) { console.warn("[wafer-rig] studio environment failed", e); }

    const dress = window.MOStudio.lights(THREE, scene);

    /* hierarchy: pivot (offset+scale+card match) → spin (orbit) → holder (base pose) → GLB */
    const pivot  = new THREE.Group();
    const spin   = new THREE.Group();
    const holder = new THREE.Group();
    holder.rotation.set(initialPose.x, initialPose.y, initialPose.z);
    spin.add(holder);
    pivot.add(spin);
    scene.add(pivot);

    let look = null;
    let modelReady = false;
    let modelUpdate = null;
    let modelRoot = null;
    let modelOwnsGeometry = false;
    let modelGeneration = 0;
    let ownedMaterials = new Set();

    function disposeOwnedMaterial(material, disposeTextures) {
      if (!material) return;
      if (disposeTextures) {
        for (const key of Object.keys(material)) {
          const value = material[key];
          if (value && value.isTexture && value.dispose) value.dispose();
        }
      }
      if (material.dispose) material.dispose();
    }

    function clearModel() {
      if (modelRoot) holder.remove(modelRoot);
      for (const material of ownedMaterials) disposeOwnedMaterial(material, modelOwnsGeometry);
      if (modelOwnsGeometry && modelRoot) {
        modelRoot.traverse((object) => {
          if (object.geometry && object.geometry.dispose) object.geometry.dispose();
        });
      }
      modelRoot = null;
      modelOwnsGeometry = false;
      ownedMaterials = new Set();
      modelReady = false;
      modelUpdate = null;
    }

    function ingest(root, config, generation) {
      if (!root || generation !== modelGeneration) return false;
      // The finish runs before the fit, while the root is still un-parented.
      // keepMaterials exists because a procedural body authored its own
      // materials and its builder's per-frame code holds those objects: it
      // gets the Neutral hook in place, never a replacement.
      let nextOwnedMaterials = new Set();
      if (config.keepMaterials) {
        const S = window.MOStudio, u = S.exposure(S.PROCEDURAL.ev);
        root.traverse((object) => {
          if (!object.isMesh && !object.isLine && !object.isPoints) return;
          const materials = [].concat(object.material || []);
          for (const material of materials) {
            if (!material) continue;
            if (object.isMesh) S.tone(material, u);
            if (config.ownsGeometry) nextOwnedMaterials.add(material);
          }
        });
        look = S.PROCEDURAL;
      } else {
        const done = window.MOStudio.finish(THREE, root, config.model, { tier: "rig" });
        look = done.look;
        nextOwnedMaterials = done.materials;
      }
      dress.set(look);
      window.fitModelToSize(root, THREE, config.modelFit || RIG.modelFit);
      modelRoot = root;
      modelOwnsGeometry = !!config.ownsGeometry;
      ownedMaterials = nextOwnedMaterials;
      holder.add(root);
      modelReady = true;
      if (config.onReady) config.onReady();
      return true;
    }

    /* Reuse one renderer/environment across project handoffs. Previously the
       click path constructed a fresh WebGL context and PMREM target before it
       could draw frame one. setModel swaps only the project payload; the
       camera, lights, environment and shader cache stay warm. */
    function setModel(next = {}) {
      const generation = ++modelGeneration;
      clearModel();
      const pose = next.pose || RIG.pose;
      holder.rotation.set(pose.x || 0, pose.y || 0, pose.z || 0);
      const config = {
        model: next.model || initialModelUrl,
        modelFit: next.modelFit || RIG.modelFit,
        keepMaterials: next.keepMaterials === true,
        buildModel: next.buildModel,
        onReady: next.onReady,
        ownsGeometry: typeof next.buildModel === "function",
      };

      if (typeof config.buildModel === "function") {
        // Procedural hero (no GLB yet). A builder may return a bare Object3D,
        // or a { group, update } descriptor whose update runs inside THIS
        // rig's loop, inheriting the shared visibility gate.
        try {
          const built = config.buildModel(THREE);
          if (built && built.group && built.group.isObject3D) {
            modelUpdate = typeof built.update === "function" ? built.update : null;
            return Promise.resolve(ingest(built.group, config, generation));
          }
          return Promise.resolve(ingest(built, config, generation));
        } catch (error) {
          console.warn("[wafer-rig] buildModel failed", error);
          return Promise.resolve(false);
        }
      }

      if (!window.loadProjectModel) return Promise.resolve(false);
      return window.loadProjectModel(config.model, THREE)
        .then((root) => ingest(root, config, generation))
        .catch((error) => {
          if (generation === modelGeneration) console.warn("[wafer-rig] model load failed", error);
          return false;
        });
    }

    if (!opts.deferModel) setModel({
      model: initialModelUrl,
      modelFit: opts.modelFit,
      pose: initialPose,
      keepMaterials: opts.keepMaterials,
      buildModel: opts.buildModel,
      onReady: opts.onReady,
    });

    /* ---- eased state (cur) toward targets (tgt) ---- */
    const cur = { offX: 0, offY: 0, scale: 1, yaw: RIG.arriveYaw, pitch: RIG.arrivePitch, dist: RIG.camZ };
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

    const HANDOFF = { offX: 0, offY: 0, scale: RIG.handoffScale, pitch: RIG.arrivePitch, dist: RIG.camZ };

    function applyToScene() {
      pivot.scale.setScalar(cur.scale);
      pivot.position.set(cur.offX, cur.offY, 0);
      spin.rotation.y = cur.yaw + idleSpin;
      spin.rotation.x = cur.pitch;
      camera.position.z = cur.dist;
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
      cur.offX  = damp(cur.offX,  tgt.offX,  R, dt);
      cur.offY  = damp(cur.offY,  tgt.offY,  R, dt);
      cur.scale = damp(cur.scale, tgt.scale, R, dt);
      cur.yaw   = damp(cur.yaw,   tgt.yaw,   yawRate, dt);
      cur.pitch = damp(cur.pitch, tgt.pitch, yawRate, dt);
      cur.dist  = damp(cur.dist,  tgt.dist,  R, dt);
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

    let menuMotion = null, menuEnv = null;
    /* ---- shared rig controls ---- */
    const api = {
      el: renderer.domElement,
      get ready() { return modelReady; },
      render, update, setSize, setModel,
      getMenuMotion() {
        if (!menuMotion) {
          menuEnv = window.MOStudio.studioEnvironment(THREE, renderer, window.MOStudio.MENU.room, 128);
          menuMotion = window.createMenuMotion(THREE, renderer, menuEnv.texture);
          const close = menuMotion.closeMenu;
          menuMotion.closeMenu = () => { close(); const size = sz(); setSize(size.w, size.h); };
        }
        return menuMotion;
      },
      setEaseRate(r) { easeRate = r; },
      setYawRate(r) { yawRate = r; },
      startFromScreen(cx, cy, vw, vh, scale) {
        const halfH = RIG.camZ * Math.tan((RIG.fov * Math.PI / 180) / 2);
        const aspect = vw / vh;
        const halfW = halfH * aspect;
        const fracX = (cx - vw / 2) / (vw / 2);
        const fracY = -(cy - vh / 2) / (vh / 2);
        offFracX = fracX * (halfW / halfWidthAt(RIG.camZ));
        cur.scale = scale; cur.dist = RIG.camZ;
        cur.offX = fracX * halfW; cur.offY = fracY * halfH;
        cur.yaw = RIG.arriveYaw; cur.pitch = RIG.arrivePitch;
        Object.assign(tgt, cur);
        applyToScene();
      },
      snapToLayout(fracX, scale = 1, offY = 0, yaw = RIG.arriveYaw) {
        offFracX = fracX;
        tgt.scale = scale; tgt.offY = offY; tgt.pitch = RIG.arrivePitch; tgt.dist = RIG.camZ; tgt.yaw = yaw;
        recomputeOffX();
        cur.scale = scale; cur.offY = offY; cur.pitch = RIG.arrivePitch; cur.dist = RIG.camZ; cur.yaw = yaw; cur.offX = tgt.offX;
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
        tgt.offX = 0; tgt.offY = 0;
        tgt.scale = RIG.handoffScale; tgt.pitch = RIG.arrivePitch;
        recomputeOffX();
      },
      nudgeYaw(d) { cur.yaw += d; tgt.yaw += d; },
      get yaw() { return cur.yaw; },
      setYawTarget(y) { tgt.yaw = y; },
      setIdle(on) { idleEnabled = on; },
      setLayout(fracX, scale = 1, offY = 0) {
        offFracX = fracX; tgt.scale = scale; tgt.offY = offY; recomputeOffX();
      },
      resetOrbit() { tgt.yaw = RIG.arriveYaw; tgt.pitch = RIG.arrivePitch; },
      dispose() {
        menuMotion?.dispose();
        modelGeneration++;
        clearModel();
        try { mount.removeChild(renderer.domElement); } catch (_) {}
        if (envTarget) envTarget.dispose();
        if (menuEnv) menuEnv.dispose();
        if (renderer.renderLists) renderer.renderLists.dispose();
        renderer.dispose();
        if (renderer.forceContextLoss) renderer.forceContextLoss();
      },
    };
    return api;
  };
})();
