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
  /* Wind-up: the lift off the card (scale), the tilt toward the viewer and a
     counter-rotation AGAINST the coming turn, reached in WIND.ms and unwound
     by the travel. The page's leave winds up lift and tilt; the counter-turn
     needs the turn's direction, so the flight that knows it plays it. */
  const WIND = { ms: 140, lift: 0.03, pitch: 7 * DEG, counter: 8 * DEG };
  /* The travel's shape. arc: a bow off the chord, to its upper side, as a
     fraction of the chord. bank: the roll into the lateral screen speed, at
     most `bank`, ~76% of it at bankV half-widths per second, exactly 0 where
     the travel starts and lands (the ease's slope is 0 there). approach: the
     forward's size runs a little ahead of its position (toward the camera),
     capped so the size still only ever grows. */
  const PATH = { arc: 0.16, bank: 15 * DEG, bankV: 0.5, approach: 0.05 };
  const BEAT_MS = 600;
  /* The arrival beat: the one true thing a hero shows as it lands, as a
     level k (1 = the look as MOStudio.finish made it, 0 = dark). Existing
     values only (an emissive strength, an opacity, a colour), never a new
     program: Ci-Clop's LEDs and halos, the Venovisor's lenses and glow, the
     Wafer's two screens from blank glass. k null asks whether the look has a
     beat at all; one without gets the key-light sweep instead. The targets
     are found once per model and kept on it. */
  function beatOf(root, lk, k) {
    let b = root.userData.beat;
    if (b === undefined) {
      const set = [];
      const lerp = (obj, key, to, from = 0) => set.push((v) => { obj[key] = from + (to - from) * v; });
      root.traverse((o) => {
        for (const m of [].concat(o.material || [])) {
          if (!m) continue;
          if ((lk.finish === "ciclop" || lk.finish === "venovisor") && /^led-(red|white)$/.test(m.name)) lerp(m, "emissiveIntensity", m.emissiveIntensity);
          else if (/-halo$|^led-haze$/.test(o.name)) lerp(m.userData, "fade", 1);   // their onBeforeRender multiplies by it
          else if (o.name === "led-glow") lerp(m, "opacity", m.opacity);
          else if (lk.kind === "wafer" && /^wafer:screen_/.test(m.name)) {
            const c = m.color, ei = m.emissiveIntensity;
            set.push((v) => { c.setScalar(0.08 + 0.92 * v); m.emissiveIntensity = ei * v; });   // dark glass, then the panel's own pixels
          }
        }
      });
      b = root.userData.beat = set.length ? set : null;
    }
    if (!b || k == null) return !!b;
    for (const fn of b) fn(k);
    return true;
  }
  const reducedMotion = () => !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
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
      if (flight && !flight.dock) { flight.from.yaw = cur.yaw; solveFlight(); }   // the model came in after the travel began
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
    const F = window.moFlight;
    let flight = null;   // flyTo/dockTo + setFlight: { from, to, turnMin, m, amp, ... }
    let roll = 0;        // the bank (PATH.bank), set by setFlight only: 0 whenever no travel runs
    let settle = null;   // the arrival spring: { ms, aS, aY, run, skip, onBack }
    let beatMs = -1;     // playBeat: ms into the signature beat, -1 when idle
    let beatFrom = 1;    // the level the beat wakes from
    let beatShown = -1, beatRoot = null;   // the level last handed to the studio, and for which model
    let wind = null;     // windUp: { ms, s0, p0 } while the page's leave lifts the hero

    /* The turn lands exactly on the rest yaw (moFlight.turn), and the two
       channels that overshoot (scale, yaw) arrive with the spring's start
       velocity: their ease's end slope m is solved from the overshoot, so the
       travel and the settle are one curve. A move too small to carry the full
       overshoot carries a proportionally smaller one. */
    function solveFlight() {
      const f = flight, T = f.duration, K = F.SETTLE.SLOPE * T, M = 1.2, O = f.dock ? DOCK : OVERSHOOT;
      if (!f.dock) f.to.yaw = f.from.yaw + F.turn(f.from.yaw, RIG.arriveYaw, f.turnMin);   // the dock's is live (retarget)
      const dY = f.to.yaw - f.from.yaw, dS = f.to.scale - f.from.scale;
      f.m = { yaw: Math.min(M, O.yaw * K / Math.max(1e-6, Math.abs(dY))), scale: Math.min(M, O.scale * f.to.scale * K / Math.max(1e-6, Math.abs(dS))) };
      f.amp = { yaw: Math.sign(dY) * f.m.yaw * Math.abs(dY) / K, scale: Math.sign(dS) * f.m.scale * Math.abs(dS) / (K * f.to.scale) };
    }

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
      const k = settle ? F.settle(settle.ms) : 0;
      pivot.scale.setScalar(cur.scale * (1 + (settle ? settle.aS * k : 0)));
      pivot.position.set(cur.offX, cur.offY, 0);
      spin.rotation.y = cur.yaw + idleSpin + (settle ? settle.aY * k : 0);
      spin.rotation.x = cur.pitch;
      if (docking) pivot.quaternion.copy(dockQ);
      else pivot.quaternion.slerpQuaternions(Q_ID, matchQ, cur.match);
      if (roll) pivot.quaternion.premultiply(_qRoll.setFromAxisAngle(Z_AXIS, roll));   // the bank, about the view axis
      if (look) dress.set(look, cur.match, beatMs >= 0 && !hasBeat() ? beatMs / BEAT_MS : -1);
      if (modelRoot && (cur.beat !== beatShown || modelRoot !== beatRoot) && hasBeat()) { beatOf(modelRoot, look, cur.beat); beatShown = cur.beat; beatRoot = modelRoot; }
      camera.position.z = cur.dist;
      if (camera.fov !== cur.fov) { camera.fov = cur.fov; camera.updateProjectionMatrix(); }
    }
    const hasBeat = () => !!(modelRoot && look && beatOf(modelRoot, look, null));
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
      if (settle && settle.run) {
        if (settle.skip) settle.skip = false;   // the frame that landed is drawn at the landing itself
        else settle.ms += dt;
        if (settle.onBack && settle.ms >= F.SETTLE.BACK) { const cb = settle.onBack; settle.onBack = null; cb(); }
        if (settle.ms >= F.SETTLE.END) settle = null;
      }
      if (beatMs >= 0) {
        beatMs += dt;
        const k = Math.min(1, beatMs / BEAT_MS);
        cur.beat = tgt.beat = lerp(beatFrom, 1, k * k * (3 - 2 * k));
        if (k >= 1) beatMs = -1;
      }
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
      /* quat: the card model's camera-relative pose. With it the first frame
         is the card's model in pose and dress, held until setLayout. fov: the
         card camera's. Pose and span alone leave the field's wider lens out,
         and a deep pose (a Wafer seen end-on) then starts ~15% off its card;
         the rig takes that lens and eases back to its own on the travel.
         look: the dress to start in, 1 the field's (a card), 0 the hero's
         (the dock starts from a page). */
      startFromScreen(cx, cy, vw, vh, scale, quat = null, fov = RIG.fov, look = 1) {
        flight = null; settle = null; wind = null; docking = false; roll = 0;
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
        flight = null; settle = null; wind = null; docking = false; roll = 0;
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
      /* The handoff travel, ONE gesture. flyTo fixes both ends: from where
         the rig is now (the card) to a layout from moHeroLayout (the page's
         settled hero), with the showcase turn solved by moFlight.turn
         (turnMin degrees: the long way unless the short way turns that much).
         setFlight(p, ms) then puts every quantity on one eased progress: p = 1
         IS the layout, pose and lens, with no residual card tilt, no bow and
         no bank; ms is drawn time since the travel began and drives only the
         wind-up (a lift, a tilt toward the viewer and a counter-turn that
         peak at WIND.ms and unwind with the travel). At p = 1 the spring
         starts on its own and update() runs it; the page continues it
         (handoff/arrive). */
      flyTo(fracX, scale = 1, offY = 0, opts = {}) {
        docking = false;
        this.setLayout(fracX, scale, offY);
        tgt.pitch = RIG.arrivePitch; tgt.dist = RIG.camZ;
        flight = { from: { ...cur }, to: { ...tgt, beat: opts.beat === false ? cur.beat : 0 }, turnMin: opts.turnMin == null ? 180 : opts.turnMin, duration: opts.duration || 1300, windUp: opts.windUp !== false };
        // the approach: as much as the size can run ahead and still only grow
        flight.approach = Math.max(0, Math.min(PATH.approach, (1 - flight.from.scale / flight.to.scale) / 8));
        solveFlight();
      },
      setFlight(p, ms = 0) {
        if (!flight) return;
        const f = flight, t = Math.max(0, Math.min(1, p)), e = F.ease(t);
        for (const k in f.to) cur[k] = lerp(f.from[k], f.to[k], k === "yaw" || k === "scale" ? F.ease(t, f.m[k]) : e);
        // the arc: a bow off the chord to its upper side, 4e(1 - e), so 0 at both ends
        const dx = f.to.offX - f.from.offX, dy = f.to.offY - f.from.offY, side = dx >= 0 ? 1 : -1;
        const nx = -dy * side * PATH.arc, ny = dx * side * PATH.arc;
        cur.offX += nx * 4 * e * (1 - e); cur.offY += ny * 4 * e * (1 - e);
        // the bank: into the lateral screen speed (half-widths per second), from the ease's own slope
        const h = 1e-3, de = (F.ease(t + h) - F.ease(t - h)) / (Math.min(1, t + h) - Math.max(0, t - h));
        const vx = (dx + nx * 4 * (1 - 2 * e)) * de * 1000 / f.duration;
        roll = -PATH.bank * Math.tanh(vx / (RIG.camZ * Math.tan(cur.fov * DEG / 2) * (camera.aspect || w / h)) / PATH.bankV);
        // the approach: the size a little ahead of the position, back to 0 at the end (forward only)
        if (f.approach) cur.scale *= 1 + 4 * f.approach * e * (1 - e);
        // the wind-up: tilt and counter-turn peak at WIND.ms, unwound by the
        // travel; the lift rises slower (2.5x), into the travel's own growth,
        // so the size has one rise and never a step
        const wu = Math.sin(Math.PI / 2 * Math.min(1, ms / WIND.ms)) * (1 - e);
        if (f.windUp) { cur.scale *= 1 + WIND.lift * Math.sin(Math.PI / 2 * Math.min(1, ms / (WIND.ms * 2.5))) * (1 - e); cur.pitch += WIND.pitch * wu; }
        cur.yaw -= Math.sign(f.to.yaw - f.from.yaw) * WIND.counter * wu;
        if (f.dock) {
          dockQ.slerpQuaternions(f.R0, f.R1, e);
          if (t >= 1 && !f.landed) {
            f.landed = true;
            settle = { ms: 0, aS: f.amp.scale, aY: f.amp.yaw, run: true, skip: true, onBack: null };
          }
        } else if (t >= 1) {
          Object.assign(cur, f.to);
          settle = { ms: 0, aS: f.amp.scale, aY: f.amp.yaw, run: true, skip: true, onBack: null };
          flight = null;
        }
        if (t >= 1) roll = 0;
        Object.assign(tgt, cur);
        applyToScene();
      },
      get turn() { return flight ? flight.to.yaw - flight.from.yaw : null; },
      get settleMs() { return settle ? settle.ms : F.SETTLE.END; },
      /* The hand-over across the page swap: everything the page needs to
         continue this frame that its own layout cannot tell it. */
      handoff() {
        return { yaw: cur.yaw, ms: settle ? settle.ms : F.SETTLE.END, aS: settle ? settle.aS : 0, aY: settle ? settle.aY : 0, beat: cur.beat };
      },
      /* The page's side: boot on the flight's last frame (state from
         moArrival, layout from moHeroLayout) and hold it, spring paused,
         until release(onBack) — the page has drawn it and dropped the seam.
         onBack fires once, when the spring is back on its rest. */
      arrive(state, layout) {
        this.snapToLayout(layout.fracX, layout.scale, layout.offY, state.yaw);
        cur.beat = tgt.beat = state.beat == null ? 1 : state.beat;
        settle = state.ms < F.SETTLE.END ? { ms: state.ms, aS: state.aS || 0, aY: state.aY || 0, run: false, skip: false, onBack: null } : null;
        applyToScene();
      },
      release(onBack) {
        if (!settle || settle.ms >= F.SETTLE.BACK) { if (settle) settle.run = true; onBack(); return; }
        settle.run = true; settle.onBack = onBack;
      },
      /* The signature beat, one shot: the look's own (beatOf: LEDs,
         glow, screens) from wherever it was, or a key-light sweep for a look
         without one. Runs inside update(), so it sleeps with the loop. */
      playBeat() {
        if (reducedMotion()) { cur.beat = tgt.beat = 1; applyToScene(); return; }
        beatFrom = cur.beat;
        beatMs = 0;
      },
      resetOrbit() { tgt.yaw = RIG.arriveYaw; tgt.pitch = RIG.arrivePitch; },
      /* The seam: the frame just drawn, as a WebP with alpha (a JPEG
         flattened the transparent ground to #000, a black frame at every
         swap; a browser without WebP hands back PNG, which keeps alpha too).
         Call it in the same task as render(): without preserveDrawingBuffer
         the buffer is gone after the composite. */
      captureFrame(tw = 1100) {
        try {
          const cnv = renderer.domElement;
          if (!cnv || !cnv.width) return null;
          const tc = document.createElement("canvas");
          tc.width = tw; tc.height = Math.round(tw * cnv.height / cnv.width);
          tc.getContext("2d").drawImage(cnv, 0, 0, tc.width, tc.height);
          return tc.toDataURL("image/webp", 0.9);
        } catch (_) { return null; }
      },
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
