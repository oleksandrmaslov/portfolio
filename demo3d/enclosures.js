/* ============================================================
   M.O. SYSTEM — ISKRA 3D · ENCLOSURES  (node 0x09)
   ------------------------------------------------------------
   The reward. After a correct FLASH the bare PCB closes up into
   its finished product. buildEnclosure(board) returns a group of
   shell parts in BOARD-UNITS (added to the same root as the
   board, so it inherits the stage fit-scale). Each part carries
   userData.assembly = { from:{pos,rot}, to:{pos,rot}, delay, dur }
   and starts parked at `from`; the stage tweens it to `to`.

     · CI-CLOP   round head PCB → tube torch · bezel · lens · tail
     · VENOVISOR rect PCB → handheld vein wand · shell · window · grip

   Also exposes extra .glows (beam cone / status) for power-on and
   a .showcaseTilt so the stage can present the finished unit.
   ============================================================ */
(function () {
  const P = window.IskraParts;
  const V = (THREE, x, y, z) => new THREE.Vector3(x, y, z);

  function rbox(THREE, w, h, d, r, mat) {
    const G = THREE.RoundedBoxGeometry
      ? new THREE.RoundedBoxGeometry(w, h, d, 4, Math.min(r, h / 2, w / 2, d / 2))
      : new THREE.BoxGeometry(w, h, d);
    return new THREE.Mesh(G, mat);
  }
  const std = (THREE, c, o = {}) => new THREE.MeshStandardMaterial({
    color: c, metalness: o.m != null ? o.m : 0.6, roughness: o.r != null ? o.r : 0.4,
    emissive: o.e || 0x000000, emissiveIntensity: o.ei != null ? o.ei : 1,
    transparent: !!o.t, opacity: o.o != null ? o.o : 1,
  });

  /* tag a mesh with its fly-in choreography */
  function chor(mesh, fromPos, toPos, opt = {}) {
    mesh.position.copy(toPos);
    mesh.userData.assembly = {
      fromPos: fromPos.clone(), toPos: toPos.clone(),
      fromRot: opt.fromRot || { x: mesh.rotation.x, y: mesh.rotation.y, z: mesh.rotation.z },
      toRot: opt.toRot || { x: mesh.rotation.x, y: mesh.rotation.y, z: mesh.rotation.z },
      delay: opt.delay || 0, dur: opt.dur || 0.7, spin: opt.spin || 0,
    };
    // park at start
    mesh.position.copy(fromPos);
    if (opt.fromRot) mesh.rotation.set(opt.fromRot.x, opt.fromRot.y, opt.fromRot.z);
    return mesh;
  }

  /* ---------------- CI-CLOP · tube torch ---------------- */
  function torch(THREE, board) {
    const ud = board.userData;
    const r = ud.radius || 1.06;
    const topY = (ud.thickness || 0.085) / 2;
    const g = new THREE.Group();
    g.name = "enc:torch";
    const glows = [];

    const alu = std(THREE, 0x2b3038, { m: 0.85, r: 0.32 });
    const aluDk = std(THREE, 0x191d23, { m: 0.8, r: 0.42 });
    const bezelMat = std(THREE, 0x3a4048, { m: 0.9, r: 0.26 });

    // BODY — open tube the head-PCB caps. Extends downward (-y).
    const bodyH = r * 1.9;
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(r * 1.02, r * 0.92, bodyH, 64, 1, true), alu);
    body.position.y = topY - bodyH / 2 - 0.02;
    chor(body, V(THREE, 0, topY - bodyH / 2 - 2.6, 0), body.position.clone(), { delay: 0.05, dur: 0.6 });
    g.add(body);

    // knurl rings
    for (let i = 0; i < 3; i++) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(r * 0.985, 0.025, 8, 60), aluDk);
      ring.rotation.x = Math.PI / 2;
      const y = topY - bodyH * (0.32 + i * 0.2);
      ring.position.y = y;
      chor(ring, V(THREE, 0, y - 2.6, 0), V(THREE, 0, y, 0), { delay: 0.05, dur: 0.6 });
      g.add(ring);
    }

    // TAIL CAP — bottom, comes from far below
    const tail = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.95, r * 0.8, r * 0.5, 48), aluDk);
    const tailY = topY - bodyH - r * 0.2;
    tail.position.y = tailY;
    chor(tail, V(THREE, 0, tailY - 3.4, 0), V(THREE, 0, tailY, 0), { delay: 0.18, dur: 0.6 });
    g.add(tail);
    // tail button
    const tb = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.34, r * 0.34, r * 0.16, 32), std(THREE, 0x0c0f14, { m: 0.5, r: 0.6 }));
    tb.position.y = tailY - r * 0.3;
    chor(tb, V(THREE, 0, tailY - 3.4, 0), tb.position.clone(), { delay: 0.22, dur: 0.6 });
    g.add(tb);

    // BEZEL — drops onto the top rim, ringing the LED crown
    const bezel = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.06, r * 1.02, r * 0.42, 64, 1, true), bezelMat);
    const bezY = topY + r * 0.12;
    bezel.position.y = bezY;
    chor(bezel, V(THREE, 0, bezY + 2.6, 0), V(THREE, 0, bezY, 0), { delay: 0.34, dur: 0.55 });
    g.add(bezel);
    // crenellated strike-bezel teeth
    const teeth = 10;
    for (let i = 0; i < teeth; i++) {
      const a = (i / teeth) * Math.PI * 2;
      const t = new THREE.Mesh(new THREE.BoxGeometry(r * 0.14, r * 0.16, r * 0.14), bezelMat);
      t.position.set(Math.cos(a) * r * 1.0, bezY + r * 0.28, Math.sin(a) * r * 1.0);
      chor(t, V(THREE, t.position.x, t.position.y + 2.8, t.position.z), t.position.clone(), { delay: 0.4, dur: 0.5 });
      g.add(t);
    }

    // LENS — clear disc above the LED ring, lets the crown glow out
    const lens = new THREE.Mesh(
      new THREE.CylinderGeometry(r * 0.9, r * 0.9, 0.05, 56),
      std(THREE, 0xdfeaf2, { m: 0.1, r: 0.08, t: true, o: 0.32 }));
    const lensY = topY + r * 0.26;
    lens.position.y = lensY;
    chor(lens, V(THREE, 0, lensY + 2.4, 0), V(THREE, 0, lensY, 0), { delay: 0.46, dur: 0.5 });
    g.add(lens);

    // BEAM — emissive cone + light, powered on at the end
    const beamMat = std(THREE, 0xbfe6ff, { m: 0, r: 1, e: 0xbfe6ff, ei: 0, t: true, o: 0.0 });
    const beam = new THREE.Mesh(new THREE.ConeGeometry(r * 1.5, r * 3.0, 40, 1, true), beamMat);
    beam.position.y = lensY + r * 1.5;
    beam.userData.assembly = { static: true };
    g.add(beam);
    glows.push({ mat: beamMat, on: 0xbfe6ff, peak: 0.7, beam: true });
    const beamLight = new THREE.PointLight(0xcdebff, 0, 6);
    beamLight.position.y = lensY + 0.6;
    g.add(beamLight);
    glows.push({ light: beamLight, peak: 2.2 });

    return { group: g, glows, showcaseTilt: { x: -0.5, y: 0.7 }, frameRadius: r * 1.5, lift: bodyH * 0.2 };
  }

  /* ---------------- VENOVISOR · handheld vein wand ---------------- */
  function wand(THREE, board) {
    const ud = board.userData;
    const bw = ud.bw || 2.3, bh = ud.bh || 1.46;
    const topY = (ud.thickness || 0.085) / 2;
    const g = new THREE.Group();
    g.name = "enc:wand";
    const glows = [];

    const shell = std(THREE, 0x20252d, { m: 0.4, r: 0.5 });
    const shellDk = std(THREE, 0x14181e, { m: 0.4, r: 0.55 });
    const accent = std(THREE, 0x2a8fff, { m: 0.5, r: 0.4, e: 0x10324f, ei: 0.4 });

    const W = bw + 0.22, D = bh + 0.22;

    // BOTTOM TRAY — rises up to cradle the board
    const tray = rbox(THREE, W, 0.34, D, 0.14, shellDk);
    const trayY = topY - 0.2;
    tray.position.y = trayY;
    chor(tray, V(THREE, 0, trayY - 2.6, 0), V(THREE, 0, trayY, 0), { delay: 0.05, dur: 0.6 });
    g.add(tray);

    // TOP COVER — a frame with a big window over the IR array + sensor
    const railT = 0.16, coverY = topY + 0.24, coverH = 0.3;
    const frameMat = shell;
    // build 4 rails as one group
    const cover = new THREE.Group();
    const long1 = rbox(THREE, W, coverH, railT, 0.06, frameMat); long1.position.set(0, 0, -D / 2 + railT / 2);
    const long2 = rbox(THREE, W, coverH, railT, 0.06, frameMat); long2.position.set(0, 0, D / 2 - railT / 2);
    const short1 = rbox(THREE, railT, coverH, D - railT * 1.6, 0.06, frameMat); short1.position.set(-W / 2 + railT / 2, 0, 0);
    const short2 = rbox(THREE, railT * 1.5, coverH, D - railT * 1.6, 0.06, frameMat); short2.position.set(W / 2 - railT * 0.75, 0, 0);
    cover.add(long1, long2, short1, short2);
    // accent strip on the front rail
    const strip = rbox(THREE, W * 0.7, 0.05, 0.05, 0.02, accent); strip.position.set(0, coverH / 2 - 0.02, -D / 2 + railT * 0.4);
    cover.add(strip);
    cover.position.y = coverY;
    cover.userData.assembly = {
      fromPos: V(THREE, 0, coverY + 2.4, 0), toPos: V(THREE, 0, coverY, 0),
      fromRot: { x: 0, y: 0, z: 0 }, toRot: { x: 0, y: 0, z: 0 }, delay: 0.3, dur: 0.6,
    };
    cover.position.copy(cover.userData.assembly.fromPos);
    g.add(cover);

    // sensor window glass (over the vein dome, right side)
    const glass = rbox(THREE, bw * 0.42, 0.04, bh * 0.7, 0.05, std(THREE, 0x0a1622, { m: 0.2, r: 0.1, t: true, o: 0.45, e: 0x0a2336, ei: 0.3 }));
    glass.position.set(bw * 0.18, coverY + coverH / 2 + 0.02, 0);
    chor(glass, V(THREE, bw * 0.18, coverY + 2.4, 0), glass.position.clone(), { delay: 0.42, dur: 0.5 });
    g.add(glass);
    glows.push({ mat: glass.material, on: 0xff5448, peak: 0.5 });

    // GRIP — extends from the left short edge, comes in from the side
    const gripL = bh * 1.5;
    const grip = rbox(THREE, 0.5, 0.42, gripL, 0.16, shellDk);
    grip.position.set(-W / 2 - 0.14, topY, 0);
    grip.rotation.z = 0;
    const gripTo = V(THREE, -W / 2 - 0.05, topY - 0.0, 0);
    grip.position.copy(gripTo);
    grip.userData.assembly = {
      fromPos: V(THREE, -W / 2 - 2.6, topY, 0), toPos: gripTo,
      fromRot: { x: 0, y: 0, z: 0 }, toRot: { x: 0, y: 0, z: 0 }, delay: 0.18, dur: 0.6,
    };
    grip.position.copy(grip.userData.assembly.fromPos);
    g.add(grip);
    // status LED on grip
    const statMat = std(THREE, 0x2dd24a, { m: 0.2, r: 0.3, e: 0x2dd24a, ei: 0 });
    const stat = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 12), statMat);
    stat.position.set(-W / 2 - 0.05, topY + 0.24, gripL * 0.3);
    stat.userData.assembly = { static: true };
    g.add(stat);
    glows.push({ mat: statMat, on: 0x2dd24a, peak: 1.6 });
    const fill = new THREE.PointLight(0xff6b5e, 0, 4);
    fill.position.set(bw * 0.18, coverY + 0.6, 0);
    g.add(fill);
    glows.push({ light: fill, peak: 1.2 });

    return { group: g, glows, showcaseTilt: { x: -0.35, y: 0.6 }, frameRadius: Math.max(W, gripL) * 0.7, lift: 0.2 };
  }

  function buildEnclosure(board, THREE) {
    const enc = board.userData.spec.enclosure;
    if (enc === "torch") return torch(THREE, board);
    if (enc === "wand") return wand(THREE, board);
    return torch(THREE, board);
  }

  window.IskraEnclosure = { buildEnclosure };
})();
