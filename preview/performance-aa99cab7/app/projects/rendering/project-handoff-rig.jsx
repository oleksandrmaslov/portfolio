/* ============================================================
   M.O. SYSTEM — PROJECT HANDOFF RIG
   ------------------------------------------------------------
   window.makeNodeRig(mount, { project, model, mode }) — one rig
   for EVERY node. Wraps the proven Wafer hero rig (identical
   camera/pose contract, so the Wafer seam is unchanged) and adds:
     · per-project model config from app/data/projects.js (no
       orientation/scale hardcoded in components);
     · a procedural "node-shell" PROXY for nodes whose GLB isn't
       ready (model.ready === false) — honest, wireframe, address
       + carrier particle, no fake product shape;
     · getYaw / setYaw / captureFrame on top of the classic API
       (startFromScreen, setLayout, snapToLayout, setEaseRate,
        nudgeYaw, update, render, dispose).
   The Wafer page continues to use its dedicated solid-material rig.
   ============================================================ */
(function () {
  const SIGNAL = 0x00f0c8;

  /* ---- procedural proxy: the "node-shell" ----
     A thin line construction: wireframe bounding volume, inner
     axis cross, a small carrier particle, the node address. */
  window.makeNodeProxy = function (THREE, project) {
    const g = new THREE.Group();
    const line = (geo, op) => new THREE.LineSegments(
      new THREE.EdgesGeometry(geo, 1),
      new THREE.LineBasicMaterial({ color: SIGNAL, transparent: true, opacity: op, depthWrite: false })
    );
    const outer = line(new THREE.BoxGeometry(2.3, 1.55, 1.55), 0.6);
    g.add(outer);
    const inner = line(new THREE.OctahedronGeometry(0.62, 0), 0.4);
    g.add(inner);
    // axis cross
    const axGeo = new THREE.BufferGeometry();
    axGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array([
      -1.15, 0, 0, 1.15, 0, 0, 0, -0.78, 0, 0, 0.78, 0, 0, 0, -0.78, 0, 0, 0.78,
    ]), 3));
    g.add(new THREE.LineSegments(axGeo, new THREE.LineBasicMaterial({ color: 0x2a3a4a, transparent: true, opacity: 0.8, depthWrite: false })));
    // carrier particle — a small lit core
    const core = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.13, 0),
      new THREE.MeshStandardMaterial({ color: 0x073b33, emissive: SIGNAL, emissiveIntensity: 1.4, metalness: 0, roughness: 0.4, transparent: true })
    );
    g.add(core);
    // orbit motes
    const mote = new THREE.BufferGeometry();
    const mp = new Float32Array(8 * 3);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      mp[i*3] = Math.cos(a) * 0.92; mp[i*3+1] = Math.sin(a * 2) * 0.18; mp[i*3+2] = Math.sin(a) * 0.62;
    }
    mote.setAttribute("position", new THREE.BufferAttribute(mp, 3));
    g.add(new THREE.Points(mote, new THREE.PointsMaterial({ color: SIGNAL, size: 0.045, transparent: true, opacity: 0.75, depthWrite: false })));
    // address label
    const c = document.createElement("canvas"); c.width = 256; c.height = 96;
    const x = c.getContext("2d");
    x.clearRect(0, 0, 256, 96);
    x.fillStyle = "#7ef5df"; x.font = "600 34px 'Geist Mono', monospace"; x.textAlign = "center"; x.textBaseline = "middle";
    x.fillText("NODE " + ((project && project.addr) || "0x??"), 128, 30);
    x.fillStyle = "#5b6478"; x.font = "500 17px 'Geist Mono', monospace";
    x.fillText("MODEL SIGNAL PENDING", 128, 68);
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
    const tag = new THREE.Mesh(
      new THREE.PlaneGeometry(1.5, 0.56),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.95, depthWrite: false, side: THREE.DoubleSide })
    );
    tag.position.set(0, -1.06, 0);
    g.add(tag);
    g.userData.isProxy = true;
    return g;
  };

  /* ---- generic rig ---- */
  window.makeNodeRig = function (mount, opts = {}) {
    if (!window.makeWaferRig) { console.warn("[node-rig] makeWaferRig missing"); return null; }
    const project = opts.project || {};
    const model = opts.model || project.model || {};
    const base = {
      modelFit: model.rigFit || 4.0,
      pose: model.rigPose || { x: -0.35, y: 0, z: 0 },
      onReady: opts.onReady,
      preserveDrawingBuffer: true,
    };
    if (model.ready && model.src) {
      base.model = model.src;
      if (model.assignMaterial) base.assignMaterial = model.assignMaterial;
    } else {
      base.buildModel = (THREE) => window.makeNodeProxy(THREE, project);
    }
    const rig = window.makeWaferRig(mount, base);
    if (!rig) return null;
    rig.getYaw = () => rig.yaw;
    rig.setYaw = (y) => { rig.snapToLayout(0, 1, 0, y); };
    rig.captureFrame = (tw = 1100) => {
      try {
        const cnv = rig.el;
        if (!cnv || !cnv.width) return null;
        const th = Math.round(tw * cnv.height / cnv.width);
        const tc = document.createElement("canvas"); tc.width = tw; tc.height = th;
        tc.getContext("2d").drawImage(cnv, 0, 0, tw, th);
        return tc.toDataURL("image/jpeg", 0.82);
      } catch (_) { return null; }
    };
    return rig;
  };
})();
