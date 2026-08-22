/* ============================================================
   M.O. SYSTEM — TORCH DEMO MODEL (procedural barebone mock)
   ------------------------------------------------------------
   Parametric tactical flashlight built from primitives, laid
   along +X (beam fires toward +X): tail cap with SW1 (rubber
   boot), body tube with knurling + SW2 side switch + 4
   addressable indicator LEDs, 18650 cell inside, driver disc,
   head, bezel, emitter, lens — and a volumetric beam cone +
   spotlight that the controller drives (white / red, 0..1).

   window.makeTorchModel(THREE) →
     { group, swMeshes, setExplode, setExplodeOpts, setMode,
       pressSw, releaseSw, setHover, setBeam, setLeds,
       update, onPartLand, partCount }

   Swap-in path for the production GLB (docs/model-export.md):
   keep this API, replace the geometry construction only.
   ============================================================ */
(function () {
  const SIGNAL = 0x00f0c8;
  const clamp01 = (v) => Math.max(0, Math.min(1, v));
  const smooth = (t) => t * t * (3 - 2 * t);

  const BEAM_WHITE = 0xf2f5ff;
  const BEAM_RED = 0xff2a1e;

  window.makeTorchModel = function (THREE) {
    const group = new THREE.Group();

    /* ---------------- materials ---------------- */
    const matBody  = new THREE.MeshStandardMaterial({ color: 0x2a3242, metalness: 0.82, roughness: 0.32 });
    const matKnurl = new THREE.MeshStandardMaterial({ color: 0x1a2230, metalness: 0.78, roughness: 0.5 });
    const matHead  = new THREE.MeshStandardMaterial({ color: 0x303a4d, metalness: 0.85, roughness: 0.28 });
    const matBezel = new THREE.MeshStandardMaterial({ color: 0x3d4a63, metalness: 0.95, roughness: 0.22 });
    const matBoot  = new THREE.MeshStandardMaterial({ color: 0x12161f, metalness: 0.1,  roughness: 0.9 });
    const matCell  = new THREE.MeshStandardMaterial({ color: 0x2c3a55, metalness: 0.4,  roughness: 0.45 });
    const matDriver= new THREE.MeshStandardMaterial({ color: 0x141c28, metalness: 0.25, roughness: 0.55 });
    const matClip  = new THREE.MeshStandardMaterial({ color: 0x1c2330, metalness: 0.9,  roughness: 0.36 });
    const matLens  = new THREE.MeshPhysicalMaterial({ color: 0x9fb4c8, metalness: 0.1, roughness: 0.05, transparent: true, opacity: 0.22 });
    const matEmit  = new THREE.MeshBasicMaterial({ color: 0x232a36 });   // controller drives color/intensity

    const xrayOf = (tint) => new THREE.MeshStandardMaterial({
      color: tint, metalness: 0.2, roughness: 0.4, transparent: true,
      opacity: 0.13, depthWrite: false, emissive: SIGNAL, emissiveIntensity: 0.05,
    });
    const xrayMats = { body: xrayOf(0x1a2433), head: xrayOf(0x16202e), cell: xrayOf(0x2a3a55), misc: xrayOf(0x1c2736) };
    const wireMat = new THREE.MeshBasicMaterial({ color: SIGNAL, wireframe: true, transparent: true, opacity: 0.3, depthWrite: false });

    const cylX = (rTop, rBot, len, seg = 36, mat) => {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, len, seg), mat);
      m.rotation.z = -Math.PI / 2;             // axis → +X (top faces +X)
      return m;
    };

    const parts = [];        // { node, kind, base, out, lag, prevE, landed }
    const allMeshes = [];
    const keepBright = new Set();   // meshes that stay lit in xray/wire

    function addPart(node, kind, x, out, lag, xrayKey) {
      node.position.x = x;
      group.add(node);
      node.traverse((o) => { if (o.isMesh) { allMeshes.push(o); o.userData.xrayKey = xrayKey || "misc"; } });
      parts.push({ node, kind, base: node.position.clone(), out, lag, prevE: 1, landed: false });
      return node;
    }

    /* ---------------- tail cluster ---------------- */
    const tail = new THREE.Group();
    const tailCap = cylX(0.30, 0.30, 0.30, 36, matBody); tail.add(tailCap);
    const tailRing = new THREE.Mesh(new THREE.TorusGeometry(0.295, 0.018, 10, 40), matKnurl);
    tailRing.rotation.y = Math.PI / 2; tailRing.position.x = -0.1; tail.add(tailRing);
    /* SW1 — rubber boot on the tail face */
    const sw1 = cylX(0.13, 0.15, 0.085, 28, matBoot);
    sw1.position.x = -0.19; sw1.userData.sw = 1;
    tail.add(sw1);
    addPart(tail, "tail", -1.42, new THREE.Vector3(-1, 0, 0), 0.0, "body");

    /* ---------------- body tube ---------------- */
    const body = new THREE.Group();
    const tube = cylX(0.27, 0.27, 1.34, 40, matBody); body.add(tube);
    for (let i = 0; i < 3; i++) {
      const k = new THREE.Mesh(new THREE.TorusGeometry(0.272, 0.02, 10, 44), matKnurl);
      k.rotation.y = Math.PI / 2; k.position.x = -0.42 + i * 0.42; body.add(k);
    }
    /* SW2 — side switch (electronic) */
    const sw2Base = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.095, 0.05, 22), matBezel);
    sw2Base.position.set(-0.42, 0.27, 0); body.add(sw2Base);
    const sw2 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.045, 22), matBoot);
    sw2.position.set(-0.42, 0.305, 0); sw2.userData.sw = 2;
    body.add(sw2);
    /* 4 addressable indicator LEDs — a row behind SW2 */
    const ledMats = [], ledMeshes = [];
    for (let i = 0; i < 4; i++) {
      const lm = new THREE.MeshBasicMaterial({ color: 0x101622 });
      const led = new THREE.Mesh(new THREE.SphereGeometry(0.026, 12, 10), lm);
      led.position.set(-0.16 + i * 0.115, 0.272, 0.09);
      body.add(led); ledMats.push(lm); ledMeshes.push(led); keepBright.add(led);
    }
    /* pocket clip */
    const clip = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.025, 0.09), matClip);
    clip.position.set(-0.3, -0.305, 0); body.add(clip);
    addPart(body, "body", -0.28, new THREE.Vector3(0, -1, 0.15).normalize(), 0.25, "body");

    /* ---------------- 18650 cell (inside) ---------------- */
    const cell = new THREE.Group();
    const cellBody = cylX(0.165, 0.165, 1.05, 28, matCell); cell.add(cellBody);
    const cellTip = cylX(0.06, 0.06, 0.05, 16, matBezel); cellTip.position.x = 0.55; cell.add(cellTip);
    addPart(cell, "cell", -0.28, new THREE.Vector3(0, 1, -0.2).normalize(), 0.45, "cell");

    /* ---------------- driver disc ---------------- */
    const driver = new THREE.Group();
    const drv = cylX(0.21, 0.21, 0.06, 28, matDriver); driver.add(drv);
    const drvChip = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.09, 0.09), matBezel);
    drvChip.position.x = 0.04; driver.add(drvChip);
    addPart(driver, "driver", 0.46, new THREE.Vector3(0, 0.8, 0.6).normalize(), 0.6, "misc");

    /* ---------------- head + bezel + emitter + lens ---------------- */
    const head = new THREE.Group();
    const headCone = cylX(0.36, 0.28, 0.52, 40, matHead); head.add(headCone);
    const bezel = new THREE.Mesh(new THREE.TorusGeometry(0.345, 0.028, 12, 44), matBezel);
    bezel.rotation.y = Math.PI / 2; bezel.position.x = 0.26; head.add(bezel);
    const reflector = cylX(0.30, 0.20, 0.16, 36, matBezel); reflector.position.x = 0.16; head.add(reflector);
    const emitter = cylX(0.16, 0.16, 0.03, 24, matEmit); emitter.position.x = 0.245; head.add(emitter);
    keepBright.add(emitter);
    const lens = cylX(0.31, 0.31, 0.025, 36, matLens); lens.position.x = 0.27; head.add(lens);
    addPart(head, "head", 0.78, new THREE.Vector3(1, 0, 0), 0.85, "head");

    /* ---------------- beam (controller-driven) ---------------- */
    const beamGroup = new THREE.Group();
    const beamMat = new THREE.MeshBasicMaterial({
      color: BEAM_WHITE, transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
    });
    const beamLen = 3.6;
    const beamGeo = new THREE.CylinderGeometry(1.05, 0.27, beamLen, 36, 1, true);
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.rotation.z = -Math.PI / 2;
    beam.position.x = 1.05 + beamLen / 2;
    beamGroup.add(beam);
    /* hot core */
    const coreMat = new THREE.MeshBasicMaterial({
      color: BEAM_WHITE, transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const core = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.13, beamLen * 0.92, 24, 1, true), coreMat);
    core.rotation.z = -Math.PI / 2;
    core.position.x = 1.0 + beamLen * 0.46;
    beamGroup.add(core);
    group.add(beamGroup);
    const spot = new THREE.PointLight(BEAM_WHITE, 0, 14, 1.6);
    spot.position.set(1.3, 0, 0);
    group.add(spot);

    /* slight presentation tilt — reads dynamic, beam stays on-axis */
    group.rotation.z = 0.1;

    /* ---------------- explode ---------------- */
    let exOpts = { dist: 1, stagger: 0.65 };
    let onPartLandCb = null;
    function setExplode(t, now) {
      const T = clamp01(t);
      for (const p of parts) {
        const local = clamp01((T * (1 + exOpts.stagger) - p.lag * exOpts.stagger));
        const e = smooth(local);
        const d = e * 1.55 * exOpts.dist;
        p.node.position.set(
          p.base.x + p.out.x * d,
          p.base.y + p.out.y * d,
          p.base.z + p.out.z * d,
        );
        if (p.prevE > 0.035 && e <= 0.035 && !p.landed) {
          p.landed = true;
          if (onPartLandCb) onPartLandCb(p);
        }
        if (e > 0.2) p.landed = false;
        p.prevE = e;
      }
      beamGroup.visible = T < 0.12;            // beam only on an assembled torch
    }
    function setExplodeOpts(o) { exOpts = Object.assign(exOpts, o); }

    /* ---------------- view modes ---------------- */
    const origMat = new Map();
    allMeshes.forEach((m) => origMat.set(m, m.material));
    function setMode(mode) {
      allMeshes.forEach((m) => {
        if (keepBright.has(m)) return;          // LEDs + emitter always lit
        if (mode === "solid") m.material = origMat.get(m);
        else if (mode === "wire") m.material = wireMat;
        else if (mode === "xray") m.material = xrayMats[m.userData.xrayKey] || xrayMats.misc;
      });
      /* x-ray is the payoff: the cell + driver glow through the tube */
      if (mode === "xray") {
        cell.traverse((o) => { if (o.isMesh) o.material = origMat.get(o); });
        driver.traverse((o) => { if (o.isMesh) o.material = origMat.get(o); });
      }
    }

    /* ---------------- switches ---------------- */
    const swMeshes = [sw1, sw2];
    const swBase = { 1: sw1.position.x, 2: sw2.position.y };
    let hoverSw = null;
    function pressSw(i) {
      if (i === 1) sw1.position.x = swBase[1] + 0.035;
      else sw2.position.y = swBase[2] - 0.022;
    }
    function releaseSw(i) {
      if (i === 1) sw1.position.x = swBase[1];
      else sw2.position.y = swBase[2];
    }
    function setHover(m) { hoverSw = m; }

    /* ---------------- beam + LED control ---------------- */
    const beamState = { on: false, level: 0, color: "white", cur: 0 };
    function setBeam(on, level, color) {
      beamState.on = on;
      beamState.level = level;
      beamState.color = color;
    }
    function setLeds(colors) {
      /* colors: array of 4 hex | null (off) */
      for (let i = 0; i < 4; i++) {
        ledMats[i].color.setHex(colors && colors[i] != null ? colors[i] : 0x101622);
      }
    }

    /* ---------------- per-frame ---------------- */
    function update(dt, now) {
      /* eased beam */
      const tgt = beamState.on ? 0.12 + 0.88 * beamState.level : 0;
      beamState.cur += (tgt - beamState.cur) * Math.min(1, dt / 90);
      const c = beamState.color === "red" ? BEAM_RED : BEAM_WHITE;
      beamMat.color.setHex(c); coreMat.color.setHex(c); spot.color.setHex(c);
      matEmit.color.setHex(beamState.cur > 0.01 ? c : 0x232a36);
      const flick = 1 + Math.sin(now * 0.021) * 0.012;   // barely-alive driver ripple
      beamMat.opacity = 0.16 * beamState.cur * flick;
      coreMat.opacity = 0.30 * beamState.cur * flick;
      spot.intensity = 2.6 * beamState.cur;
      /* hover affordance on switches */
      sw1.material = hoverSw === sw1 ? matBezel : matBoot;
      sw2.material = hoverSw === sw2 ? matBezel : matBoot;
    }

    return {
      group, swMeshes,
      setExplode, setExplodeOpts, setMode,
      pressSw, releaseSw, setHover,
      setBeam, setLeds,
      update,
      set onPartLand(cb) { onPartLandCb = cb; },
      get partCount() { return parts.length; },
    };
  };
})();
