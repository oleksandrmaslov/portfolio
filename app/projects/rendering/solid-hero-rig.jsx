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

  /* ---- THE HERO LAYOUT — one definition for the page and the flight ----
     Where a project's hero settles for this viewport: fracX (fraction of the
     half-width), scale, offY. The landing flight lands on exactly this, so it
     reads the same function the page does; a per-project override is the
     registry's model.heroLayout ({ mobile, tablet, desktop }, any subset). */
  const HERO_LAYOUT = {
    mobile:  { fracX: 0,    scale: 0.58, offY: 0.95 },   // phones: the model up top, the title below
    tablet:  { fracX: 0.18, scale: 0.74, offY: 0.18 },
    desktop: { fracX: 0.34, scale: 0.88, offY: 0 },      // model right, title left
  };
  window.moHeroLayout = function (addr, width = window.innerWidth) {
    const project = window.MO_PROJECT_BY_ADDR && window.MO_PROJECT_BY_ADDR[addr];
    const over = (project && project.model && project.model.heroLayout) || {};
    const key = width <= 700 ? "mobile" : width <= 1000 ? "tablet" : "desktop";
    return Object.assign({}, HERO_LAYOUT[key], over[key]);
  };

  /* ---- THE FLIGHT ENGINE — one definition for both directions ----
     Designed motion, not a tween to be simplified: one eased progress
     carries position (along an arc), size, lens, look, a bank and the turn;
     the turn is solved to land exactly; a closed-form spring carries the
     arrival's weight and crosses the page swap as state (ms, amplitudes), so
     the page continues the motion the landing started.
       clock(ms)            drawn-time progress: each frame counts at most
                            50 ms, so a stalled frame cannot teleport
       ease(t, m)           in-out power EASE_K: a fast middle (peak speed
                            EASE_K times the mean) and long soft ends; m > 0
                            bends its last stretch to end at slope m, which
                            hands velocity to the spring, and stays monotonic
       turn(from, to, min)  the signed yaw that lands exactly on `to`, the
                            LONG way round unless the short way already turns
                            `min` degrees: the showcase turn
       settle(ms)           the spring's offset, peak 1 at PEAK ms, back at
                            BACK ms, 0 from END ms
       SLOPE                settle's start velocity per ms (unit peak) */
  const TAU = Math.PI * 2, DEG = Math.PI / 180;
  const SETTLE = (() => {
    const BACK = 300, wd = Math.PI / BACK, zeta = 0.6;   // back on its rest at 300 ms; the next lobe is 9.5% of the first
    const sigma = wd * zeta / Math.sqrt(1 - zeta * zeta);
    const PEAK = Math.atan(wd / sigma) / wd;
    const F = Math.exp(-sigma * PEAK) * Math.sin(wd * PEAK);
    return { BACK, END: 2 * BACK, PEAK, SLOPE: wd / F, f: (ms) => (ms <= 0 || ms >= 2 * BACK ? 0 : Math.exp(-sigma * ms) * Math.sin(wd * ms) / F) };
  })();
  // Peak speed EASE_K times the mean, at mid-travel (cubic-bezier(.83,0,.17,1) is ~5): where the edge-on turn passes.
  const EASE_K = 3.5;
  const power = (t) => (t < 0.5 ? Math.pow(2 * t, EASE_K) / 2 : 1 - Math.pow(2 - 2 * t, EASE_K) / 2);
  window.moFlight = {
    clock(duration) {
      let ms = 0;
      return { tick(dt) { ms += Math.min(50, Math.max(0, dt)); return this.p; }, get p() { return Math.min(1, ms / duration); }, get ms() { return ms; } };
    },
    // P + m·(t − P)·t²: slope m at the end, 0 at the start, monotonic for m <= 1.2 (flight.test.cjs)
    ease(t, m = 0) { t = Math.max(0, Math.min(1, t)); const P = power(t); return P + m * (t - P) * t * t; },
    /* The short way when it already turns `min` degrees, otherwise the long
       way: 360 minus the short delta. min 180 (the forward) is always the
       long way, so the turn falls in [180, 360]; min 150 (the dock) in
       [150, 360]. Either way it lands exactly on `to`. */
    turn(from, to, min = 180) {
      let d = to - from; d -= TAU * Math.round(d / TAU);
      return Math.abs(d) >= min * DEG - 1e-9 ? d : d - (d < 0 ? -TAU : TAU);
    },
    settle: SETTLE.f,
    SETTLE,
  };
  // Arrival weight: the spring's peak, as a fraction of scale and in yaw.
  const OVERSHOOT = { scale: 0.01, yaw: 2 * DEG };
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

    /* The handoff starts AS the card's model: the card's camera-relative pose
       (the rig camera has no rotation, so that is a world pose) is split into
       a yaw (its twist about the spin axis, which the flight's turn carries
       on from) and a residual tilt on the pivot (matchQ). The tilt and the
       dress start as the field's, both weighted by cur.match, which the
       flight takes to 0. */
    const Q_ID = new THREE.Quaternion();
    const matchQ = new THREE.Quaternion();
    const _qInner = new THREE.Quaternion();
    const _qCard = new THREE.Quaternion();
    const X_AXIS = new THREE.Vector3(1, 0, 0), Z_AXIS = new THREE.Vector3(0, 0, 1);
    const _qRoll = new THREE.Quaternion();
    let matchFrom = null;   // [x, y, z, w] from the Universe; applied once the model is in
    let look = null;
    /* A camera-relative world pose Q = R · Rx(pitch) · Ry(yaw) · holder · root.
       yawFor: the yaw that leaves the residual R smallest, the twist about Y
       of Rx(-pitch)·Q·(holder·root)⁻¹ (exact, lab/port/tmp/reverse/spin.check.mjs).
       residualFor: R for a given yaw. Both directions split a pose this way. */
    const _qPitch = new THREE.Quaternion(), _eSpin = new THREE.Euler();
    function yawFor(q, pitch) {
      _qInner.copy(holder.quaternion).multiply(modelRoot.quaternion).invert();
      _qInner.premultiply(q).premultiply(_qPitch.setFromAxisAngle(X_AXIS, -pitch));
      return 2 * Math.atan2(_qInner.y, _qInner.w);
    }
    function residualFor(q, yaw, pitch, out) {
      _qInner.setFromEuler(_eSpin.set(pitch, yaw, 0)).multiply(holder.quaternion).multiply(modelRoot.quaternion).invert();
      return out.copy(q).multiply(_qInner);
    }
    /* The dock carries its residual tilt on its own quaternion (dockQ) so the
       light dress (cur.match) and the tilt can travel separately: it leaves
       the page in the hero's dress and lands in the field's. */
    const dockQ = new THREE.Quaternion();
    let docking = false;
    function applyMatch() {
      if (!matchFrom || !modelRoot) return;
      _qCard.fromArray(matchFrom);
      cur.yaw = tgt.yaw = yawFor(_qCard, cur.pitch);
      residualFor(_qCard, cur.yaw, cur.pitch, matchQ);
      if (docking) dockQ.copy(matchQ);
      matchFrom = null;
    }

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
      applyMatch();
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

    /* ---- eased state (cur) toward targets (tgt) ----
       beat is the signature level (beatOf): 1 is the look as finish()
       made it, 0 the dark state an arrival wakes from. */
    const cur = { offX: 0, offY: 0, scale: 1, yaw: RIG.arriveYaw, pitch: RIG.arrivePitch, dist: RIG.camZ, match: 0, fov: RIG.fov, beat: 1 };
    const tgt = { ...cur };
    let offFracX = 0;
    let idleSpin = 0;
    let idleEnabled = false;
    const EASE_RATE = 0.16, YAW_RATE = 0.22;

    function halfWidthAt(dist) {
      const vh = 2 * dist * Math.tan((RIG.fov * Math.PI / 180) / 2);
      return vh * 0.5 * (camera.aspect || (w / h));
    }
    function recomputeOffX() { tgt.offX = offFracX * halfWidthAt(tgt.dist); }

    const HANDOFF = { offX: 0, offY: 0, scale: RIG.handoffScale, pitch: RIG.arrivePitch, dist: RIG.camZ, match: 0, fov: RIG.fov };

    /* A screen centre (viewport px) at a lens, as this rig's offsets: the
       pure half of startFromScreen, which the dock's live target reuses. */
    function screenState(cx, cy, vw, vh, scale, fov) {
      const halfH = RIG.camZ * Math.tan((fov * Math.PI / 180) / 2), halfW = halfH * (vw / vh);
      return { offX: (cx - vw / 2) / (vw / 2) * halfW, offY: -(cy - vh / 2) / (vh / 2) * halfH, scale, halfW };
    }

    function applyToScene() {
      pivot.scale.setScalar(cur.scale);
      pivot.position.set(cur.offX, cur.offY, 0);
      spin.rotation.y = cur.yaw + idleSpin;
      spin.rotation.x = cur.pitch;
      if (docking) pivot.quaternion.copy(dockQ);
      else pivot.quaternion.slerpQuaternions(Q_ID, matchQ, cur.match);
      if (look) dress.set(look, cur.match, beatMs >= 0 && !hasBeat() ? beatMs / BEAT_MS : -1);
      camera.position.z = cur.dist;
      if (camera.fov !== cur.fov) { camera.fov = cur.fov; camera.updateProjectionMatrix(); }
    }
    applyToScene();

    function update(dt) {
      dt = Math.max(0, Math.min(50, dt));
      if (modelUpdate) {
        try { modelUpdate(performance.now(), dt); }
        catch (error) {
          console.warn("[wafer-rig] procedural model update failed", error);
          modelUpdate = null;
        }
      }
      cur.offX  = damp(cur.offX,  tgt.offX,  EASE_RATE, dt);
      cur.offY  = damp(cur.offY,  tgt.offY,  EASE_RATE, dt);
      cur.scale = damp(cur.scale, tgt.scale, EASE_RATE, dt);
      cur.yaw   = damp(cur.yaw,   tgt.yaw,   YAW_RATE, dt);
      cur.pitch = damp(cur.pitch, tgt.pitch, YAW_RATE, dt);
      cur.dist  = damp(cur.dist,  tgt.dist,  EASE_RATE, dt);
      cur.match = damp(cur.match, tgt.match, EASE_RATE, dt);
      cur.fov   = damp(cur.fov,   tgt.fov,   EASE_RATE, dt);
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
      /* quat: the card model's camera-relative pose. With it the first frame
         is the card's model in pose and dress, held until setLayout. fov: the
         card camera's. Pose and span alone leave the field's wider lens out,
         and a deep pose (a Wafer seen end-on) then starts ~15% off its card;
         the rig takes that lens and eases back to its own on the travel.
         look: the dress to start in, 1 the field's (a card), 0 the hero's
         (the dock starts from a page). */
      startFromScreen(cx, cy, vw, vh, scale, quat = null, fov = RIG.fov, look = 1) {
        const s = screenState(cx, cy, vw, vh, scale, fov);
        offFracX = s.offX / halfWidthAt(RIG.camZ);
        Object.assign(cur, { offX: s.offX, offY: s.offY, scale, dist: RIG.camZ, fov, yaw: RIG.arriveYaw, pitch: RIG.arrivePitch });
        cur.match = quat ? 1 : 0;
        cur.beat = 1;   // the card's look
        matchFrom = quat;
        Object.assign(tgt, cur);
        applyToScene();
        applyMatch();
        applyToScene();
      },
      snapToLayout(fracX, scale = 1, offY = 0, yaw = RIG.arriveYaw) {
        offFracX = fracX;
        tgt.scale = scale; tgt.offY = offY; tgt.pitch = RIG.arrivePitch; tgt.dist = RIG.camZ; tgt.yaw = yaw;
        recomputeOffX();
        cur.scale = scale; cur.offY = offY; cur.pitch = RIG.arrivePitch; cur.dist = RIG.camZ; cur.yaw = yaw; cur.offX = tgt.offX;
        cur.match = tgt.match = 0; cur.fov = tgt.fov = RIG.fov;
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
        offFracX = fracX; tgt.scale = scale; tgt.offY = offY; tgt.match = 0; tgt.fov = RIG.fov; recomputeOffX();
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
