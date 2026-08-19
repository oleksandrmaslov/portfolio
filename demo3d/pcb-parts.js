/* ============================================================
   M.O. SYSTEM — ISKRA 3D · PCB PARTS  (node 0x09)
   ------------------------------------------------------------
   Low-level kit the procedural board factory builds from:
     · mulberry32 seeded RNG  (deterministic per-board variety)
     · COL  — a small material palette (solder, gold, FR4, …)
     · mat()  — cached-ish MeshStandard factory
     · component meshes — every one returns a THREE.Object3D that
       SITS ON the y=0 plane and grows +Y, so the factory can drop
       it straight onto a board's top face. LEDs / lenses tag
       themselves userData.glow so the bench can power them on.

   Everything here is geometry; silkscreen (the readable text the
   operator hunts for) is drawn on canvas in pcb-factory.js.
   ============================================================ */
(function () {
  /* ---- seeded RNG — same seed ⇒ same board every deal ---- */
  function mulberry32(seed) {
    let a = (seed >>> 0) || 1;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ---- palette (hex ints for THREE) ---- */
  const COL = {
    gold:    0xc8a652,   // ENIG pads / header pins
    goldDim: 0x8a7030,
    tin:     0xb9c2cc,   // solder / lead frame
    tinDark: 0x6f7a86,
    chip:    0x14171c,   // IC body
    chipHi:  0x23272e,
    cap:     0xb98a4a,   // MLCC tan
    capDark: 0x3a4150,   // dark MLCC
    res:     0x0f1318,   // black resistor
    metal:   0xcfd6dd,   // connector shells / cans
    metalDk: 0x9aa3ad,
    white:   0xe8eaf0,
    plastic: 0x101319,   // connector plastic
    jstWhite:0xd7d2c4,
    jstNat:  0xc9b27a,
    red:     0xc02a1e,
    redLed:  0xff3b2e,
    irLed:   0xff5448,
    green:   0x2dd24a,
    blue:    0x2a8fff,
    amber:   0xffb02a,
    lens:    0xdfeaf2,
  };

  function mat(THREE, color, o = {}) {
    return new THREE.MeshStandardMaterial({
      color,
      metalness: o.metal != null ? o.metal : 0.35,
      roughness: o.rough != null ? o.rough : 0.55,
      emissive: o.emissive != null ? o.emissive : 0x000000,
      emissiveIntensity: o.emi != null ? o.emi : 1,
      transparent: !!o.transparent,
      opacity: o.opacity != null ? o.opacity : 1,
    });
  }
  const box = (THREE, w, h, d, m) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  const cyl = (THREE, rt, rb, h, m, seg) => new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg || 20), m);

  /* a comb of leads down one or all sides of a chip body */
  function pinComb(THREE, g, n, span, bodyH, axis, side, m, pinW, pinLen) {
    pinW = pinW || span / (n * 2.1);
    pinLen = pinLen || 0.022;
    const step = span / n;
    for (let i = 0; i < n; i++) {
      const p = box(THREE, axis === "x" ? pinW : pinLen, bodyH * 0.34, axis === "x" ? pinLen : pinW, m);
      const off = -span / 2 + step * (i + 0.5);
      const out = side * (span * 0 + 0); // placeholder
      if (axis === "x") p.position.set(off, bodyH * 0.17, side);
      else p.position.set(side, bodyH * 0.17, off);
      g.add(p);
    }
  }

  /* SOIC / SOP — small dual-row IC (the MCU). len along X. */
  function soic(THREE, o = {}) {
    const len = o.len || 0.2, wid = o.wid || 0.12, h = o.h || 0.05, pins = o.pins || 8;
    const g = new THREE.Group();
    const body = box(THREE, len, h, wid, mat(THREE, o.col || COL.chip, { metal: 0.25, rough: 0.62 }));
    body.position.y = h / 2 + 0.01;
    g.add(body);
    // pin1 dimple
    const dot = cyl(THREE, len * 0.05, len * 0.05, 0.004, mat(THREE, COL.chipHi, { rough: 0.8 }), 10);
    dot.position.set(-len / 2 + len * 0.16, h + 0.012, -wid / 2 + wid * 0.22);
    g.add(dot);
    const lead = mat(THREE, COL.tin, { metal: 0.85, rough: 0.32 });
    const per = pins / 2, step = len / per;
    for (let s = -1; s <= 1; s += 2) {
      for (let i = 0; i < per; i++) {
        const p = box(THREE, step * 0.5, h * 0.3, 0.03, lead);
        p.position.set(-len / 2 + step * (i + 0.5), h * 0.22 + 0.01, s * (wid / 2 + 0.012));
        g.add(p);
      }
    }
    g.userData.foot = { w: len + 0.06, d: wid + 0.05 };
    return g;
  }

  /* QFP / QFN — quad chip (decoy MCUs). square. */
  function quad(THREE, o = {}) {
    const s = o.size || 0.34, h = o.h || 0.055, pins = o.pins || 12, qfn = !!o.qfn;
    const g = new THREE.Group();
    const body = box(THREE, s, h, s, mat(THREE, o.col || COL.chip, { metal: 0.3, rough: 0.55 }));
    body.position.y = h / 2 + 0.01;
    g.add(body);
    const dot = cyl(THREE, s * 0.04, s * 0.04, 0.004, mat(THREE, COL.chipHi, { rough: 0.85 }), 10);
    dot.position.set(-s / 2 + s * 0.14, h + 0.012, -s / 2 + s * 0.14);
    g.add(dot);
    if (!qfn) {
      const lead = mat(THREE, COL.tin, { metal: 0.85, rough: 0.3 });
      const step = s / pins;
      for (let side = 0; side < 4; side++) {
        for (let i = 0; i < pins; i++) {
          const off = -s / 2 + step * (i + 0.5);
          const p = box(THREE, step * 0.5, h * 0.28, 0.026, lead);
          if (side === 0) p.position.set(off, h * 0.2 + 0.01, s / 2 + 0.012);
          else if (side === 1) p.position.set(off, h * 0.2 + 0.01, -s / 2 - 0.012), p.rotation.y = 0;
          else if (side === 2) { p.geometry = new THREE.BoxGeometry(0.026, h * 0.28, step * 0.5); p.position.set(s / 2 + 0.012, h * 0.2 + 0.01, off); }
          else { p.geometry = new THREE.BoxGeometry(0.026, h * 0.28, step * 0.5); p.position.set(-s / 2 - 0.012, h * 0.2 + 0.01, off); }
          g.add(p);
        }
      }
    }
    g.userData.foot = { w: s + 0.08, d: s + 0.08 };
    return g;
  }

  /* generic SMD passive — MLCC / resistor */
  function passive(THREE, o = {}) {
    const w = o.w || 0.05, d = o.d || 0.03, h = o.h || 0.022;
    const g = new THREE.Group();
    const b = box(THREE, w, h, d, mat(THREE, o.col || COL.cap, { metal: 0.15, rough: 0.7 }));
    b.position.y = h / 2 + 0.008;
    g.add(b);
    const term = mat(THREE, COL.tin, { metal: 0.8, rough: 0.35 });
    for (let s = -1; s <= 1; s += 2) {
      const t = box(THREE, w * 0.22, h * 0.9, d * 1.05, term);
      t.position.set(s * w * 0.42, h * 0.46 + 0.008, 0);
      g.add(t);
    }
    return g;
  }

  /* SMD LED — emissive, dimmable via userData.glow */
  function led(THREE, o = {}) {
    const s = o.size || 0.07;
    const g = new THREE.Group();
    const base = box(THREE, s, s * 0.34, s * 0.74, mat(THREE, o.bodyCol || COL.white, { rough: 0.5, metal: 0.05 }));
    base.position.y = s * 0.17 + 0.008;
    g.add(base);
    const onCol = o.col || COL.redLed;
    const lensMat = mat(THREE, onCol, {
      rough: 0.3, metal: 0,
      emissive: onCol, emi: o.on ? (o.emi || 1.4) : 0.0,
      transparent: true, opacity: 0.92,
    });
    const lens = box(THREE, s * 0.6, s * 0.3, s * 0.5, lensMat);
    lens.position.y = s * 0.34 + 0.012;
    g.add(lens);
    g.userData.glow = { mat: lensMat, on: o.col || COL.redLed, peak: o.emi || 1.4 };
    return g;
  }

  /* dome — sensor / photodiode / through-hole LED */
  function dome(THREE, o = {}) {
    const r = o.r || 0.09;
    const g = new THREE.Group();
    const base = cyl(THREE, r * 1.05, r * 1.12, r * 0.34, mat(THREE, o.baseCol || COL.plastic, { rough: 0.6 }), 20);
    base.position.y = r * 0.17 + 0.008;
    g.add(base);
    const domeMat = mat(THREE, o.col || 0x10141b, {
      rough: o.clear ? 0.12 : 0.4, metal: 0.1,
      transparent: true, opacity: o.clear ? 0.55 : 0.95,
      emissive: o.emiCol || 0x000000, emi: o.on ? (o.emi || 1.2) : 0,
    });
    const d = new THREE.Mesh(new THREE.SphereGeometry(r, 22, 16, 0, Math.PI * 2, 0, Math.PI / 2), domeMat);
    d.position.y = r * 0.34 + 0.008;
    g.add(d);
    if (o.emiCol) g.userData.glow = { mat: domeMat, on: o.emiCol, peak: o.emi || 1.2 };
    return g;
  }

  /* tactile button — base + round actuator */
  function button(THREE, o = {}) {
    const s = o.size || 0.17;
    const g = new THREE.Group();
    const base = box(THREE, s, s * 0.28, s, mat(THREE, o.col || 0x0c0f14, { rough: 0.6, metal: 0.2 }));
    base.position.y = s * 0.14 + 0.008;
    g.add(base);
    const cap = cyl(THREE, s * 0.3, s * 0.32, s * 0.2, mat(THREE, o.capCol || 0x2a2f38, { rough: 0.5, metal: 0.3 }), 18);
    cap.position.y = s * 0.36 + 0.008;
    g.add(cap);
    // metal frame corners hint
    return g;
  }

  /* pin header — black strip + gold pins (rows along X, cols along Z) */
  function header(THREE, o = {}) {
    const rows = o.rows || 20, cols = o.cols || 1, pitch = o.pitch || 0.085;
    const g = new THREE.Group();
    const lenX = rows * pitch, lenZ = cols * pitch;
    const strip = box(THREE, lenX, 0.05, lenZ, mat(THREE, 0x0a0d12, { rough: 0.7 }));
    strip.position.y = 0.025 + 0.008;
    g.add(strip);
    const pinMat = mat(THREE, COL.gold, { metal: 0.9, rough: 0.28 });
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const p = box(THREE, 0.022, 0.13, 0.022, pinMat);
      p.position.set(-lenX / 2 + pitch * (r + 0.5), 0.065 + 0.008, -lenZ / 2 + pitch * (c + 0.5));
      g.add(p);
    }
    g.userData.foot = { w: lenX, d: lenZ };
    return g;
  }

  /* USB-C / micro shell */
  function usbC(THREE, o = {}) {
    const g = new THREE.Group();
    const shell = box(THREE, 0.3, 0.085, 0.17, mat(THREE, COL.metal, { metal: 0.9, rough: 0.3 }));
    shell.position.y = 0.05;
    g.add(shell);
    const mouth = box(THREE, 0.22, 0.045, 0.03, mat(THREE, 0x05070b, { rough: 0.9 }));
    mouth.position.set(0, 0.05, 0.085);
    g.add(mouth);
    const tongue = box(THREE, 0.16, 0.012, 0.02, mat(THREE, 0x14171c, { rough: 0.6 }));
    tongue.position.set(0, 0.05, 0.088);
    g.add(tongue);
    return g;
  }
  function usbMicro(THREE) {
    const g = new THREE.Group();
    const shell = box(THREE, 0.22, 0.075, 0.14, mat(THREE, COL.metalDk, { metal: 0.85, rough: 0.34 }));
    shell.position.y = 0.045;
    g.add(shell);
    const mouth = box(THREE, 0.15, 0.03, 0.025, mat(THREE, 0x05070b, { rough: 0.9 }));
    mouth.position.set(0, 0.05, 0.07);
    g.add(mouth);
    return g;
  }

  /* metal can — crystal / shield */
  function can(THREE, o = {}) {
    const w = o.w || 0.2, d = o.d || 0.12, h = o.h || 0.06;
    const g = new THREE.Group();
    const m = mat(THREE, o.col || COL.metal, { metal: 0.92, rough: 0.26 });
    const b = box(THREE, w, h, d, m);
    b.position.y = h / 2 + 0.008;
    // rounded-ish via small chamfer plate
    g.add(b);
    g.userData.foot = { w: w + 0.03, d: d + 0.03 };
    return g;
  }

  /* electrolytic cap */
  function elec(THREE, o = {}) {
    const r = o.r || 0.1, h = o.h || 0.2;
    const g = new THREE.Group();
    const body = cyl(THREE, r, r, h, mat(THREE, o.col || 0x1a2030, { metal: 0.5, rough: 0.4 }), 22);
    body.position.y = h / 2 + 0.01;
    g.add(body);
    const top = cyl(THREE, r * 0.96, r * 0.96, 0.01, mat(THREE, COL.metalDk, { metal: 0.7, rough: 0.4 }), 22);
    top.position.y = h + 0.012;
    g.add(top);
    return g;
  }

  /* JST-style connector — plastic housing + pins */
  function jst(THREE, o = {}) {
    const pins = o.pins || 2, pitch = 0.07;
    const g = new THREE.Group();
    const w = pins * pitch + 0.05;
    const house = box(THREE, w, 0.1, 0.13, mat(THREE, o.col || COL.jstWhite, { rough: 0.6, metal: 0.05 }));
    house.position.y = 0.058;
    g.add(house);
    const wall = box(THREE, w, 0.06, 0.02, mat(THREE, o.col || COL.jstWhite, { rough: 0.6 }));
    wall.position.set(0, 0.085, -0.06);
    g.add(wall);
    return g;
  }

  /* sub-PCB module (ESP-WROOM body, sensor board) */
  function module(THREE, o = {}) {
    const w = o.w || 0.7, d = o.d || 0.5, h = o.h || 0.12;
    const g = new THREE.Group();
    const sub = box(THREE, w, h * 0.45, d, mat(THREE, o.subCol || 0x123018, { rough: 0.6, metal: 0.1 }));
    sub.position.y = h * 0.22 + 0.008;
    g.add(sub);
    if (o.shield !== false) {
      const sh = box(THREE, w * 0.9, h * 0.6, d * 0.82, mat(THREE, COL.metal, { metal: 0.9, rough: 0.32 }));
      sh.position.set(o.shieldOff || 0, h * 0.55 + 0.008, 0);
      g.add(sh);
    }
    g.userData.foot = { w: w + 0.04, d: d + 0.04 };
    return g;
  }

  window.IskraParts = {
    mulberry32, COL, mat, box, cyl,
    soic, quad, passive, led, dome, button, header, usbC, usbMicro, can, elec, jst, module,
  };
})();
