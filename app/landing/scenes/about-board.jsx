/* ============================================================
   M.O. SYSTEM — About · PCB board scene
   ------------------------------------------------------------
   Production board scene:
     · U1 is the ONLY chip — every other stop is now a realistic
       schematic-derived CLUSTER of small parts (LDO front-end,
       crystal + load caps, decoupling bank + RF pi-filter with a
       meandered 2.4 GHz antenna, LED driver, debounce)
     · richer part library: MLCC, chip R, tantalum, inductor,
       ferrite, SOT-23, SOT-223, LEDs, SMA diode, test points
     · escape routing off every MCU pin, per-cluster nets, edge
       bus lines, mounting holes, barcode, denser silkscreen
   window.MOBoard.build(mount) -> controller
   ============================================================ */
(function () {
  const BOARD_W = 120, BOARD_D = 40, BOARD_T = 1.4;
  const TOP = BOARD_T / 2;

  const TRACE_PTS = [
    [-64, -6], [-50, -6], [-38, 3], [-26, 8], [-12, 2],
    [2, -5], [14, 1], [28, 9], [40, 2], [52, -3], [64, -3],
  ];

  const STOPS = [
    { p: 1, kind: "usbc", ref: "J1 · POWER IN", chapter: {
        n: "00", kicker: "SOURCE · EARLY MAKING", title: ["Building came ", "first", "."],
        body: "I learned to solder at nine, spent years experimenting with Arduino, and assembled slot-car systems. Long before I knew the names of any profession, I already treated computers and electronics as materials for making." } },
    { p: 3, kind: "irq", ref: "IRQ · INTERRUPT", chapter: {
        n: "01", kicker: "INTERRUPT · KYIV → GERMANY", title: ["The environment ", "changed", "."],
        body: "In February 2022, Russia's full-scale invasion forced my mother and me to leave Ukraine and rebuild our lives more than 1,500 kilometres from home. I arrived in Germany without German and learned to navigate a new language, institutions and environment for both of us." } },
    { p: 5, kind: "boot", ref: "BL1 · ACCESS POINT", chapter: {
        n: "02", kicker: "ACCESS · DESIGN", title: ["Design became the ", "access point", "."],
        body: "In a new environment, design was the most accessible way to keep creating. It taught me to turn ideas into structure, hierarchy and interaction — and to begin with the person using the product." } },
    { p: 7, kind: "mcu", ref: "U1 · DEEPER LAYER", explode: true, chapter: {
        n: "03", kicker: "DEPTH · WAFER", title: ["One keyboard opened the ", "whole stack", "."],
        body: "After moving to Germany, I became fascinated by split keyboards. Building Wafer pushed me below the visible layer into mechanics, PCB design, component selection, Zephyr and ARM — until the idea became a working prototype and a complete product system." } },
    { p: 9, kind: "switch", ref: "SW1 · OUTPUT", live: true, chapter: {
        n: "04", kicker: "OUTPUT · NEXT", title: ["Every project starts with a ", "problem", "."],
        body: "Today I work across ZMK, Kerfur and Iskra, learning whatever each challenge requires. My direction is to deepen both engineering and business, continue my education, and turn Wafer from a working prototype into a real company." } },
  ];

  /* ---- canvas helpers ---- */
  function uv(x, z, W, H) { return [ (x + BOARD_W / 2) / BOARD_W * W, (z + BOARD_D / 2) / BOARD_D * H ]; }
  function smoothPath(ctx, pts) {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length - 1; i++) {
      const xc = (pts[i][0] + pts[i + 1][0]) / 2, yc = (pts[i][1] + pts[i + 1][1]) / 2;
      ctx.quadraticCurveTo(pts[i][0], pts[i][1], xc, yc);
    }
    ctx.lineTo(pts[pts.length - 1][0], pts[pts.length - 1][1]);
  }
  function poly(x, p) { x.beginPath(); x.moveTo(p[0][0], p[0][1]); for (let i = 1; i < p.length; i++) x.lineTo(p[i][0], p[i][1]); }

  /* ---- part library (board units ≈ mm) ---- */
  const P = {
    r:     { l: 2.0, w: 1.25, h: 0.55 },
    c:     { l: 2.0, w: 1.25, h: 0.95 },
    ctant: { l: 3.5, w: 2.8,  h: 1.9 },
    ind:   { l: 4.0, w: 4.0,  h: 2.0 },
    fb:    { l: 2.0, w: 1.25, h: 0.95 },
    led:   { l: 2.0, w: 1.25, h: 0.75 },
    diode: { l: 4.3, w: 2.6,  h: 1.1 },
    sot23: { l: 2.9, w: 1.5,  h: 1.05 },
    sot223:{ l: 6.4, w: 3.4,  h: 1.6 },
    tp:    { l: 1.2, w: 1.2,  h: 0 },
    xtal:  { l: 5.0, w: 3.2,  h: 1.0 },
  };
  const TWO_PAD = { r:1, c:1, fb:1, led:1, diode:1, ctant:1, ind:1 };
  function rr(cx, cz, dx, dz, w, d, rot) { return rot ? [cx + dz, cz + dx, d, w] : [cx + dx, cz + dz, w, d]; }
  function padsFor(k, cx, cz, rot) {
    const s = P[k], out = [];
    if (TWO_PAD[k]) { out.push(rr(cx, cz, -s.l*0.42, 0, s.l*0.28, s.w*1.12, rot), rr(cx, cz, s.l*0.42, 0, s.l*0.28, s.w*1.12, rot)); }
    else if (k === "sot23") { out.push(rr(cx,cz,-0.95,1.15,0.6,0.8,rot), rr(cx,cz,0.95,1.15,0.6,0.8,rot), rr(cx,cz,0,-1.15,0.6,0.8,rot)); }
    else if (k === "sot223") { for (let i=-1;i<=1;i++) out.push(rr(cx,cz,i*2.1,2.2,1.0,1.5,rot)); out.push(rr(cx,cz,0,-2.1,3.4,1.7,rot)); }
    else if (k === "tp") { out.push([cx, cz, 1.15, 1.15]); }
    else if (k === "xtal") { [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(m => out.push(rr(cx,cz,m[0]*1.9,m[1]*1.05,1.15,0.95,rot))); }
    return out;
  }

  /* ---- schematic clusters per stop (offsets from stop center) ---- */
  const CLUSTERS = {
    usbc: [
      { k:"sot23",  dx:-4.9, dz: 2.2, ref:"D2" },
      { k:"r",      dx:-4.7, dz:-1.2, rot:1, ref:"R1" },
      { k:"r",      dx:-3.2, dz:-1.2, rot:1, ref:"R2" },
      { k:"fb",     dx: 4.3, dz:-2.4, ref:"FB1" },
      { k:"sot223", dx: 8.4, dz:-0.8, ref:"U3" },
      { k:"c",      dx: 4.4, dz: 0.8, ref:"C1" },
      { k:"ctant",  dx: 8.6, dz: 3.6, ref:"C2" },
      { k:"tp",     dx:-4.8, dz: 4.4, ref:"TP1" },
    ],
    irq: [
      { k:"sot23",  dx:-4.6, dz: 2.4, ref:"D4" },
      { k:"diode",  dx: 4.5, dz:-2.8, ref:"D5" },
      { k:"r",  dx:-4.4, dz:-2.6, rot:1, ref:"R10" },
      { k:"r",  dx:-3.0, dz:-2.6, rot:1, ref:"R11" },
      { k:"r",  dx:-1.6, dz:-2.6, rot:1, ref:"R12" },
      { k:"tp", dx: 0.4, dz: 4.4, ref:"TP6" },
      { k:"tp", dx: 2.4, dz: 4.4, ref:"TP7" },
    ],
    mcu: [
      { k:"c",   dx:-3.0, dz: 7.0, ref:"C5" },
      { k:"c",   dx: 0,   dz: 7.0, ref:"C6" },
      { k:"c",   dx: 3.0, dz: 7.0, ref:"C7" },
      { k:"c",   dx:-3.0, dz:-7.0, ref:"C8" },
      { k:"c",   dx: 0,   dz:-7.0, ref:"C9" },
      { k:"ind", dx: 6.9, dz:-3.0, ref:"L1" },
      { k:"c",   dx: 6.7, dz:-0.2, rot:1, ref:"C10" },
      { k:"c",   dx: 6.7, dz: 1.6, rot:1, ref:"C11" },
      { k:"tp",  dx:-6.6, dz:-3.4, ref:"TP3" },
      { k:"tp",  dx:-6.6, dz:-1.4, ref:"TP4" },
    ],
    boot: [
      { k:"sot23", dx: 4.8, dz: 2.6, ref:"U4" },
      { k:"c",     dx: 4.6, dz:-1.8, rot:1, ref:"C13" },
      { k:"r",     dx:-4.5, dz:-3.2, ref:"R14" },
      { k:"r",     dx:-4.5, dz:-1.7, ref:"R15" },
      { k:"tp",    dx:-4.6, dz: 3.4, ref:"TP8" },
      { k:"tp",    dx:-2.7, dz: 3.4, ref:"TP9" },
    ],
    switch: [
      { k:"r",     dx:-3.7, dz: 0.6, rot:1, ref:"R8" },
      { k:"c",     dx: 3.7, dz: 0.6, rot:1, ref:"C12" },
      { k:"diode", dx: 0,   dz: 4.4, ref:"D3" },
      { k:"tp",    dx:-3.7, dz:-3.2, ref:"TP5" },
    ],
  };
  const CPARTS = [];
  STOPS.forEach(st => (CLUSTERS[st.kind] || []).forEach(c => {
    const [sx, sz] = TRACE_PTS[st.p];
    CPARTS.push({ k: c.k, x: sx + c.dx, z: sz + c.dz, rot: c.rot || 0, ref: c.ref });
  }));

  // antenna region (right of U1): meandered inverted-F on a mask keepout
  const MCU_XY = TRACE_PTS[STOPS.find(s => s.kind === "mcu").p];
  const ANT = { x0: MCU_XY[0] + 7.5, x1: MCU_XY[0] + 13.5, z0: MCU_XY[1] - 4.5, z1: MCU_XY[1] - 1.5 };
  const ANT_PTS = (() => {
    const zm = (ANT.z0 + ANT.z1) / 2, pts = [[MCU_XY[0] + 6.9, MCU_XY[1] - 3], [ANT.x0 + 0.5, zm]];
    let top = true;
    for (let x = ANT.x0 + 1.1; x <= ANT.x1 - 0.5; x += 0.95) {
      pts.push([x, top ? ANT.z1 - 0.4 : ANT.z0 + 0.4]);
      pts.push([x + 0.95, top ? ANT.z1 - 0.4 : ANT.z0 + 0.4]);
      top = !top;
    }
    return pts;
  })();

  /* ---- deterministic layout: passives, vias, nets, buses ---- */
  function makeRng(seed) { let s = seed >>> 0; return () => { s = (s * 1103515245 + 12345) >>> 0; return s / 4294967296; }; }
  const LAYOUT = (() => {
    const R = makeRng(20260719);
    const clampB = (p) => { p[0] = Math.max(-BOARD_W/2+3, Math.min(BOARD_W/2-3, p[0])); p[1] = Math.max(-BOARD_D/2+2.5, Math.min(BOARD_D/2-2.5, p[1])); return p; };
    const stopPts = STOPS.map(s => TRACE_PTS[s.p]);
    const inAnt = (x, z) => x > ANT.x0 - 2 && x < ANT.x1 + 1.5 && z > ANT.z0 - 1.5 && z < ANT.z1 + 1.5;
    const foot = []; let rN = 30, cN = 30, guard = 0;
    while (foot.length < 78 && guard++ < 5000) {
      const x = -BOARD_W/2+6 + R()*(BOARD_W-12), z = -BOARD_D/2+4.5 + R()*(BOARD_D-9);
      let ok = !inAnt(x, z);
      if (ok) for (const p of TRACE_PTS) { const dx = x-p[0], dz = z-p[1]; if (dx*dx+dz*dz < 30) { ok = false; break; } }
      if (ok) for (const p of stopPts) { const dx = x-p[0], dz = z-p[1]; if (dx*dx+dz*dz < 135) { ok = false; break; } }
      if (ok) for (const f of foot) { const dx = x-f.x, dz = z-f.z; if (dx*dx+dz*dz < 8) { ok = false; break; } }
      if (!ok) continue;
      const k = R(), cap = k < 0.45;
      foot.push({ x, z, rot: R() < 0.5 ? 0 : 1, l: k < 0.8 ? 1.55 : 2.1, w: k < 0.8 ? 0.8 : 1.1, cap, ref: cap ? ("C"+cN++) : ("R"+rN++) });
    }
    const vias = []; for (let i = 0; i < 52; i++) { const x = -BOARD_W/2+4 + R()*(BOARD_W-8), z = -BOARD_D/2+3 + R()*(BOARD_D-6); if (inAnt(x, z)) continue; vias.push({ x, z, tent: R() < 0.5 }); }
    const stitch = [];
    for (let x = -BOARD_W/2+2.6; x < BOARD_W/2-2.4; x += 3.4) { stitch.push([x, -BOARD_D/2+1.9]); stitch.push([x, BOARD_D/2-1.9]); }
    for (let z = -BOARD_D/2+1.9; z < BOARD_D/2-1.9; z += 3.4) { stitch.push([-BOARD_W/2+2.2, z]); stitch.push([BOARD_W/2-2.2, z]); }
    const tribs = [];
    STOPS.forEach((st) => {
      const [sx, sz] = TRACE_PTS[st.p];
      const n = 5 + ((R()*3) | 0);
      for (let k = 0; k < n; k++) {
        let a = Math.round(((k/n)*Math.PI*2 + R()) / (Math.PI/4)) * (Math.PI/4);
        let x = sx + Math.cos(a)*3.2, z = sz + Math.sin(a)*3.2;
        const pts = [clampB([x, z])];
        const segs = 2 + (R() < 0.6 ? 1 : 0);
        for (let s = 0; s < segs; s++) {
          const len = 2.5 + R()*7;
          x += Math.cos(a)*len; z += Math.sin(a)*len;
          pts.push(clampB([x, z]));
          a += (R() < 0.5 ? -1 : 1) * Math.PI/4;
        }
        tribs.push(pts);
      }
    });
    // cluster nets — short 45°-routed escapes off each 2-pad part, via-terminated
    const R2 = makeRng(777);
    const nets = [];
    for (const p of CPARTS) {
      const s = P[p.k];
      if (p.k === "tp") { const sg = R2() < 0.5 ? -1 : 1; nets.push({ pts: [[p.x, p.z], [p.x + sg*(1.3 + R2()*1.4), p.z]], via: true }); continue; }
      if (!TWO_PAD[p.k]) continue;
      const ax = p.rot ? [0, 1] : [1, 0];
      for (const sg of [-1, 1]) {
        if (R2() < 0.35) continue;
        let dx = ax[0]*sg, dz = ax[1]*sg;
        let x = p.x + dx*(s.l*0.42 + 0.35), z = p.z + dz*(s.l*0.42 + 0.35);
        const pts = [[x, z]];
        const l1 = 0.8 + R2()*1.5; x += dx*l1; z += dz*l1; pts.push([x, z]);
        if (R2() < 0.55) { const d = R2() < 0.5 ? -1 : 1; const bx = (dx - dz*d)*0.7071, bz = (dz + dx*d)*0.7071; const l2 = 0.8 + R2()*1.3; x += bx*l2; z += bz*l2; pts.push([x, z]); }
        nets.push({ pts, via: R2() < 0.8 });
      }
    }
    // MCU pin escape routing — every pin fans out, alternate pins via down
    const escapes = [];
    const [mx, mz] = MCU_XY;
    for (let i = 0; i < 8; i++) {
      const o = (i - 3.5) * 0.89;
      [[mx+o, mz+5.15, 0, 1], [mx+o, mz-5.15, 0, -1], [mx+5.15, mz+o, 1, 0], [mx-5.15, mz+o, -1, 0]].forEach(([px, pz, dx, dz], si) => {
        const len = 0.55 + ((i*7 + si*3) % 3) * 0.28;
        escapes.push({ pts: [[px, pz], [px + dx*len, pz + dz*len]], via: (i + si) % 2 === 0 });
      });
    }
    // edge buses — parallel routed groups along both long edges
    const buses = [];
    for (let b = 0; b < 4; b++) { const z = -16.1 - b*0.55; buses.push([[-54, z], [54, z]]); }
    for (let b = 0; b < 3; b++) { const z = 15.9 + b*0.55; buses.push([[-22, z], [50, z]]); }
    return { foot, vias, stitch, tribs, nets, escapes, buses };
  })();

  // pads for the stop's MAIN part
  function mainPads(st) {
    const [sx, sz] = TRACE_PTS[st.p], pads = [];
    if (st.kind === "mcu") {
      for (let i = 0; i < 8; i++) { const o = (i - 3.5) * 0.89;
        pads.push([sx + o, sz + 4.5, 0.5, 1.3]); pads.push([sx + o, sz - 4.5, 0.5, 1.3]);
        pads.push([sx + 4.5, sz + o, 1.3, 0.5]); pads.push([sx - 4.5, sz + o, 1.3, 0.5]); }
      pads.push([sx, sz, 4.2, 4.2]);
    } else if (st.kind === "irq") {
      padsFor("diode", sx, sz, 0).forEach(p => pads.push(p));
    } else if (st.kind === "boot") {
      for (let i = 0; i < 5; i++) { pads.push([sx - 3.2 + i*1.6, sz - 0.85, 0.9, 0.9]); pads.push([sx - 3.2 + i*1.6, sz + 0.85, 0.9, 0.9]); }
    } else if (st.kind === "usbc") {
      for (let i = 0; i < 8; i++) pads.push([sx - 2.1 + i*0.6, sz - 3.2, 0.34, 1.1]);
      [[-2.6,-2.6],[2.6,-2.6],[-2.6,2.2],[2.6,2.2]].forEach(m => pads.push([sx+m[0], sz+m[1], 0.9, 1.9]));
    } else if (st.kind === "switch") { [[-2.2,-2.2],[2.2,-2.2],[-2.2,2.2],[2.2,2.2]].forEach(m => pads.push([sx+m[0], sz+m[1], 1.5, 1.5])); }
    return pads;
  }
  const COURT = { mcu: [14.6, 15.6], irq: [10.2, 7.6], usbc: [12.4, 8.4], boot: [10.4, 6.6], switch: [9.4, 7.4] };

  /* ---- shared 2D geometry pass (color / spec / bump agree) ---- */
  function drawNetLines(x, S, W, H, style) {
    // style: {keep, copper, lwK, lwC, via, drill}
    const all = LAYOUT.nets.concat(LAYOUT.escapes);
    for (const n of all) {
      const p = n.pts.map(q => uv(q[0], q[1], W, H));
      if (style.keep) { poly(x, p); x.strokeStyle = style.keep; x.lineWidth = style.lwK*S; x.stroke(); }
      poly(x, p); x.strokeStyle = style.copper; x.lineWidth = style.lwC*S; x.stroke();
      if (n.via && style.via) {
        const e = p[p.length-1];
        x.fillStyle = style.via; x.beginPath(); x.arc(e[0], e[1], 0.13*S, 0, Math.PI*2); x.fill();
        if (style.drill) { x.fillStyle = style.drill; x.beginPath(); x.arc(e[0], e[1], 0.055*S, 0, Math.PI*2); x.fill(); }
      }
    }
    for (const b of LAYOUT.buses) {
      const p = b.map(q => uv(q[0], q[1], W, H));
      if (style.keep) { poly(x, p); x.strokeStyle = style.keep; x.lineWidth = (style.lwK*0.9)*S; x.stroke(); }
      poly(x, p); x.strokeStyle = style.copper; x.lineWidth = (style.lwC*0.9)*S; x.stroke();
      if (style.via) for (const e of [p[0], p[p.length-1]]) {
        x.fillStyle = style.via; x.beginPath(); x.arc(e[0], e[1], 0.13*S, 0, Math.PI*2); x.fill();
        if (style.drill) { x.fillStyle = style.drill; x.beginPath(); x.arc(e[0], e[1], 0.055*S, 0, Math.PI*2); x.fill(); }
      }
    }
  }
  function allPads(W, H) {
    const out = [];
    STOPS.forEach(st => { for (const p of mainPads(st)) out.push(p); });
    for (const p of CPARTS) for (const q of padsFor(p.k, p.x, p.z, p.rot)) out.push(q);
    return out;
  }
  const HOLES = [[-BOARD_W/2+3.2, -BOARD_D/2+3.2], [BOARD_W/2-3.2, -BOARD_D/2+3.2], [-BOARD_W/2+3.2, BOARD_D/2-3.2], [BOARD_W/2-3.2, BOARD_D/2-3.2]];

  function drawColor(W, H) {
    const S = W / BOARD_W;
    const c = document.createElement("canvas"); c.width = W; c.height = H;
    const x = c.getContext("2d");
    x.fillStyle = "#0a0d12"; x.fillRect(0, 0, W, H);
    const g = x.createRadialGradient(W*0.42, H*0.4, 0, W*0.5, H*0.5, W*0.62);
    g.addColorStop(0, "rgba(24,30,42,0.55)"); g.addColorStop(1, "rgba(0,0,0,0)");
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    x.strokeStyle = "rgba(56,72,96,0.09)"; x.lineWidth = 2;
    for (let i = -H; i < W; i += 10) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i+H, H); x.stroke(); x.beginPath(); x.moveTo(i+H, 0); x.lineTo(i, H); x.stroke(); }
    x.strokeStyle = "rgba(110,140,180,0.12)"; x.lineWidth = 0.16*S;
    x.strokeRect(0.55*S, 0.55*S, W - 1.1*S, H - 1.1*S);

    x.lineCap = "round"; x.lineJoin = "round";
    // tributary nets
    for (const pts of LAYOUT.tribs) {
      const p = pts.map(q => uv(q[0], q[1], W, H));
      poly(x, p); x.strokeStyle = "rgba(3,4,7,0.9)"; x.lineWidth = 0.34*S; x.stroke();
      poly(x, p); x.strokeStyle = "rgba(150,172,205,0.16)"; x.lineWidth = 0.2*S; x.stroke();
      const e = p[p.length-1];
      x.fillStyle = "#a88a46"; x.beginPath(); x.arc(e[0], e[1], 0.16*S, 0, Math.PI*2); x.fill();
      x.fillStyle = "#06070b"; x.beginPath(); x.arc(e[0], e[1], 0.07*S, 0, Math.PI*2); x.fill();
    }
    // cluster nets + MCU escapes + edge buses
    drawNetLines(x, S, W, H, { keep: "rgba(3,4,7,0.9)", copper: "rgba(150,172,205,0.2)", lwK: 0.26, lwC: 0.14, via: "#a88a46", drill: "#06070b" });

    const traceUV = TRACE_PTS.map(p => uv(p[0], p[1], W, H));
    smoothPath(x, traceUV); x.strokeStyle = "#04050a"; x.lineWidth = 0.9*S; x.stroke();
    const cop = x.createLinearGradient(0, 0, W, 0);
    cop.addColorStop(0, "#7a4a24"); cop.addColorStop(0.5, "#c98a4e"); cop.addColorStop(1, "#9a6232");
    smoothPath(x, traceUV); x.strokeStyle = cop; x.lineWidth = 0.58*S; x.stroke();
    smoothPath(x, traceUV); x.strokeStyle = "rgba(255,224,184,0.5)"; x.lineWidth = 0.14*S; x.stroke();

    // IRQ — the external interrupt marks the main trace: a hard jog + pulse
    // marker at the interrupt stop. The trace visibly deviates but CONTINUES.
    {
      const [ix, iz] = TRACE_PTS[STOPS.find(s => s.kind === "irq").p];
      const [iu, iv] = uv(ix, iz, W, H);
      // dark slash across the smooth trace — the break
      x.save();
      x.translate(iu, iv); x.rotate(-0.35);
      x.fillStyle = "#04050a"; x.fillRect(-0.5*S, -1.1*S, 1.0*S, 2.2*S);
      // zigzag copper jog bridging the break — the system keeps running
      x.strokeStyle = "#c98a4e"; x.lineWidth = 0.22*S; x.lineJoin = "miter";
      x.beginPath();
      x.moveTo(-1.4*S, 0);
      x.lineTo(-0.7*S, -0.75*S);
      x.lineTo(0, 0.75*S);
      x.lineTo(0.7*S, -0.75*S);
      x.lineTo(1.4*S, 0);
      x.stroke();
      x.strokeStyle = "rgba(255,224,184,0.55)"; x.lineWidth = 0.08*S; x.stroke();
      x.restore();
      // dashed pulse ring — the interrupt event marker
      x.setLineDash([0.4*S, 0.32*S]);
      x.strokeStyle = "rgba(220,226,238,0.6)"; x.lineWidth = 0.09*S;
      x.beginPath(); x.arc(iu, iv, 2.4*S, 0, Math.PI*2); x.stroke();
      x.setLineDash([]);
      x.fillStyle = "#dfe3ec"; x.font = `600 ${0.5*S}px 'Geist Mono', monospace`; x.textAlign = "center"; x.textBaseline = "middle";
      x.fillText("⚡ IRQ", iu + 3.3*S, iv - 2.2*S);
    }

    // ANTENNA — mask keepout + exposed-copper meander
    {
      const [au0, av0] = uv(ANT.x0 - 0.6, ANT.z0 - 0.6, W, H), [au1, av1] = uv(ANT.x1 + 0.6, ANT.z1 + 0.6, W, H);
      x.fillStyle = "#04050a"; x.fillRect(au0, av0, au1-au0, av1-av0);
      const ap = ANT_PTS.map(q => uv(q[0], q[1], W, H));
      poly(x, ap); x.strokeStyle = "#c98a4e"; x.lineWidth = 0.24*S; x.stroke();
      poly(x, ap); x.strokeStyle = "rgba(255,224,184,0.45)"; x.lineWidth = 0.08*S; x.stroke();
      x.setLineDash([0.35*S, 0.28*S]);
      x.strokeStyle = "rgba(220,226,238,0.7)"; x.lineWidth = 0.09*S;
      x.strokeRect(au0 - 0.25*S, av0 - 0.25*S, (au1-au0) + 0.5*S, (av1-av0) + 0.5*S);
      x.setLineDash([]);
      x.fillStyle = "#dfe3ec"; x.font = `600 ${0.55*S}px 'Geist Mono', monospace`; x.textAlign = "center"; x.textBaseline = "middle";
      x.fillText("ANT1 · 2.4 GHz · KEEPOUT", (au0+au1)/2, av0 - 0.75*S);
    }

    // ---- ENIG pads (stops + cluster parts) ----
    x.textBaseline = "middle";
    for (const [px, pz, w, d] of allPads(W, H)) {
      const [pu, pv] = uv(px, pz, W, H);
      const grd = x.createLinearGradient(pu, pv - d*S/2, pu, pv + d*S/2);
      grd.addColorStop(0, "#e8c477"); grd.addColorStop(0.5, "#cfa557"); grd.addColorStop(1, "#a97f38");
      x.fillStyle = grd;
      x.fillRect(pu - w*S/2, pv - d*S/2, w*S, d*S);
    }
    // stop courtyards + refs
    STOPS.forEach((st) => {
      const [sx, sz] = TRACE_PTS[st.p];
      const [u, v] = uv(sx, sz, W, H);
      const ct = COURT[st.kind] || [5, 5];
      x.setLineDash([0.4*S, 0.3*S]);
      x.strokeStyle = "rgba(220,226,238,0.55)"; x.lineWidth = 0.09*S;
      x.strokeRect(u - ct[0]*S/2, v - ct[1]*S/2, ct[0]*S, ct[1]*S);
      x.setLineDash([]);
      x.fillStyle = "#dfe3ec"; x.beginPath(); x.arc(u - ct[0]*S/2 - 0.35*S, v - ct[1]*S/2 - 0.35*S, 0.14*S, 0, Math.PI*2); x.fill();
      x.font = `700 ${0.72*S}px 'Geist Mono', monospace`; x.textAlign = "center";
      x.fillText(st.ref.split(" · ")[0], u, v - ct[1]*S/2 - 1.0*S);
      x.fillStyle = "#98a1b3"; x.font = `500 ${0.5*S}px 'Geist Mono', monospace`;
      x.fillText(st.ref.split(" · ")[1] || "", u, v + ct[1]*S/2 + 0.9*S);
      // zone silkscreen — one quiet line of story per stop
      const ZSILK = {
        usbc:   ["SOLDER · ARDUINO · SLOT CARS"],
        irq:    ["KYIV → GERMANY", "02 / 2022"],
        boot:   ["DESIGN · UX · INTERACTION"],
        mcu:    ["WAFER", "PCB · ZEPHYR · ARM", "WORKING PROTOTYPE"],
        switch: ["ZMK · KERFUR · ISKRA", "NEXT: WAFER COMPANY"],
      };
      (ZSILK[st.kind] || []).forEach((line, li) => {
        x.fillStyle = li === 0 ? "#8d96a8" : "#6b7488";
        x.font = `500 ${0.46*S}px 'Geist Mono', monospace`;
        x.fillText(line, u, v + ct[1]*S/2 + (1.75 + li * 0.72)*S);
      });
    });
    // cluster part silkscreen — outline, ref, polarity marks
    for (const p of CPARTS) {
      const s = P[p.k];
      const [u, v] = uv(p.x, p.z, W, H);
      const L = (p.rot ? s.w : s.l), D = (p.rot ? s.l : s.w);
      x.strokeStyle = "rgba(190,198,214,0.55)"; x.lineWidth = 0.07*S;
      if (p.k === "tp") { x.beginPath(); x.arc(u, v, 0.85*S, 0, Math.PI*2); x.stroke(); }
      else x.strokeRect(u - (L/2+0.28)*S, v - (D/2+0.24)*S, (L+0.56)*S, (D+0.48)*S);
      x.fillStyle = "#9aa3b5"; x.font = `500 ${0.44*S}px 'Geist Mono', monospace`; x.textAlign = "center";
      x.fillText(p.ref, u, v - (D/2 + 0.72)*S);
      if (p.k === "ctant") { x.fillStyle = "#dfe3ec"; x.font = `700 ${0.6*S}px 'Geist Mono', monospace`; x.fillText("+", u - (s.l/2 + 0.75)*S, v); }
      if (p.k === "diode" || p.k === "led") {
        x.strokeStyle = "rgba(220,226,238,0.8)"; x.lineWidth = 0.1*S;
        const bx = u - (L/2 + 0.42)*S;
        x.beginPath(); x.moveTo(bx, v - D*S/2); x.lineTo(bx, v + D*S/2); x.stroke();
      }
    }
    // passives
    for (const f of LAYOUT.foot) {
      const [u, v] = uv(f.x, f.z, W, H);
      const l = f.l*S, w = f.w*S, half = l/2;
      x.save(); x.translate(u, v); if (f.rot) x.rotate(Math.PI/2);
      x.fillStyle = "#c9a052";
      x.fillRect(-half - 0.18*S, -w/2, 0.36*S, w);
      x.fillRect(half - 0.18*S, -w/2, 0.36*S, w);
      x.fillStyle = "#b7c0cf";
      x.fillRect(-half - 0.18*S, -w/2, 0.14*S, w);
      x.fillRect(half + 0.04*S, -w/2, 0.14*S, w);
      x.strokeStyle = "rgba(190,198,214,0.5)"; x.lineWidth = 0.06*S;
      x.strokeRect(-half - 0.3*S, -w/2 - 0.22*S, l + 0.6*S, w + 0.44*S);
      x.restore();
      x.fillStyle = "#8d96a8"; x.font = `500 ${0.42*S}px 'Geist Mono', monospace`; x.textAlign = "center";
      x.fillText(f.ref, u, v - (f.rot ? l/2 : w/2) - 0.4*S);
    }
    // vias + stitching
    for (const vd of LAYOUT.vias.concat(LAYOUT.stitch.map(s => ({ x: s[0], z: s[1], tent: true })))) {
      const [u, v] = uv(vd.x, vd.z, W, H);
      if (vd.tent) { x.fillStyle = "rgba(46,58,78,0.85)"; x.beginPath(); x.arc(u, v, 0.14*S, 0, Math.PI*2); x.fill(); x.fillStyle = "rgba(8,10,15,0.9)"; x.beginPath(); x.arc(u, v, 0.05*S, 0, Math.PI*2); x.fill(); }
      else { x.fillStyle = "#b08c46"; x.beginPath(); x.arc(u, v, 0.15*S, 0, Math.PI*2); x.fill(); x.fillStyle = "#05060a"; x.beginPath(); x.arc(u, v, 0.065*S, 0, Math.PI*2); x.fill(); }
    }
    // mounting holes — plated ring + silkscreen keepout
    for (const h of HOLES) {
      const [u, v] = uv(h[0], h[1], W, H);
      x.fillStyle = "#b08c46"; x.beginPath(); x.arc(u, v, 0.52*S, 0, Math.PI*2); x.fill();
      x.fillStyle = "#020308"; x.beginPath(); x.arc(u, v, 0.34*S, 0, Math.PI*2); x.fill();
      x.strokeStyle = "rgba(220,226,238,0.5)"; x.lineWidth = 0.08*S;
      x.beginPath(); x.arc(u, v, 0.72*S, 0, Math.PI*2); x.stroke();
    }
    // fiducials
    [[-44, -15.6], [44, 15.6], [44, -15.6]].forEach(fd => {
      const [u, v] = uv(fd[0], fd[1], W, H);
      x.fillStyle = "#05060a"; x.beginPath(); x.arc(u, v, 0.32*S, 0, Math.PI*2); x.fill();
      x.fillStyle = "#cfa557"; x.beginPath(); x.arc(u, v, 0.16*S, 0, Math.PI*2); x.fill();
    });
    // system marking — the board declares what it is (quiet, mono, small)
    {
      const [u, v] = uv(-14, -14.6, W, H);
      x.fillStyle = "#6b7488"; x.font = `600 ${0.52*S}px 'Geist Mono', monospace`; x.textAlign = "left"; x.textBaseline = "middle";
      x.fillText("M.O. SYSTEM · NODE 0x00", u, v);
      x.fillStyle = "#565f72"; x.font = `500 ${0.46*S}px 'Geist Mono', monospace`;
      x.fillText("INTERNAL ARCHITECTURE · PROJECTION 01", u, v + 0.75*S);
      x.fillText("DISTRIBUTED SOURCE", u, v + 1.5*S);
    }
    // board silkscreen identity + fab block
    x.fillStyle = "#5b6478"; x.font = `600 ${0.88*S}px 'Geist Mono', monospace`; x.textAlign = "left"; x.textBaseline = "middle";
    x.fillText("M.O. SYSTEM · NODE 0x00", 1.3*S, 1.55*S);
    x.font = `500 ${0.58*S}px 'Geist Mono', monospace`;
    x.fillText("INTERNAL ARCHITECTURE · PROJECTION 01 · MÜNCHEN 2026", 1.3*S, H - 1.3*S);
    x.textAlign = "right";
    x.fillText("// follow the trace", W - 1.3*S, H - 1.3*S);
    x.fillText("E355094 94V-0", W - 1.3*S, 1.55*S);
    x.textAlign = "center";
    x.fillText("DISTRIBUTED SOURCE · RoHS · ⏚", W/2, H - 1.15*S);
    // barcode (fab lot)
    {
      const R = makeRng(99); let bx = W - 12.5*S; const by = 2.3*S;
      x.fillStyle = "#8d96a8";
      while (bx < W - 6.5*S) { const bw = (0.06 + R()*0.16)*S; x.fillRect(bx, by, bw, 1.1*S); bx += bw + (0.08 + R()*0.14)*S; }
    }

    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8; tex.needsUpdate = true;
    return tex;
  }

  function drawSpec(W, H) {
    // R unused · G = roughness · B = metalness
    const S = W / BOARD_W;
    const c = document.createElement("canvas"); c.width = W; c.height = H;
    const x = c.getContext("2d");
    x.fillStyle = "rgb(0,165,0)"; x.fillRect(0, 0, W, H);
    x.lineCap = "round"; x.lineJoin = "round";
    x.strokeStyle = "rgb(0,140,25)"; x.lineWidth = 0.2*S;
    for (const pts of LAYOUT.tribs) { poly(x, pts.map(q => uv(q[0], q[1], W, H))); x.stroke(); }
    drawNetLines(x, S, W, H, { keep: null, copper: "rgb(0,140,25)", lwK: 0, lwC: 0.14, via: "rgb(0,60,255)" });
    const traceUV = TRACE_PTS.map(p => uv(p[0], p[1], W, H));
    smoothPath(x, traceUV); x.strokeStyle = "rgb(0,70,255)"; x.lineWidth = 0.58*S; x.stroke();
    const ap = ANT_PTS.map(q => uv(q[0], q[1], W, H));
    poly(x, ap); x.strokeStyle = "rgb(0,70,255)"; x.lineWidth = 0.24*S; x.stroke();
    for (const [px, pz, w, d] of allPads(W, H)) { const [u, v] = uv(px, pz, W, H); x.fillStyle = "rgb(0,60,255)"; x.fillRect(u - w*S/2, v - d*S/2, w*S, d*S); }
    for (const f of LAYOUT.foot) {
      const [u, v] = uv(f.x, f.z, W, H); const l = f.l*S, w = f.w*S;
      x.save(); x.translate(u, v); if (f.rot) x.rotate(Math.PI/2);
      x.fillStyle = "rgb(0,55,245)"; x.fillRect(-l/2 - 0.18*S, -w/2, 0.36*S, w); x.fillRect(l/2 - 0.18*S, -w/2, 0.36*S, w);
      x.restore();
    }
    for (const vd of LAYOUT.vias) { if (vd.tent) continue; const [u, v] = uv(vd.x, vd.z, W, H); x.fillStyle = "rgb(0,60,255)"; x.beginPath(); x.arc(u, v, 0.15*S, 0, Math.PI*2); x.fill(); }
    for (const h of HOLES) { const [u, v] = uv(h[0], h[1], W, H); x.fillStyle = "rgb(0,60,255)"; x.beginPath(); x.arc(u, v, 0.52*S, 0, Math.PI*2); x.fill(); x.fillStyle = "rgb(0,200,0)"; x.beginPath(); x.arc(u, v, 0.34*S, 0, Math.PI*2); x.fill(); }
    const tex = new THREE.CanvasTexture(c); tex.needsUpdate = true; return tex;
  }

  function drawBump(W, H) {
    const S = W / BOARD_W;
    const c = document.createElement("canvas"); c.width = W; c.height = H;
    const x = c.getContext("2d");
    x.fillStyle = "#808080"; x.fillRect(0, 0, W, H);
    x.lineCap = "round"; x.lineJoin = "round";
    x.strokeStyle = "#8e8e8e"; x.lineWidth = 0.2*S;
    for (const pts of LAYOUT.tribs) { poly(x, pts.map(q => uv(q[0], q[1], W, H))); x.stroke(); }
    drawNetLines(x, S, W, H, { keep: null, copper: "#8c8c8c", lwK: 0, lwC: 0.14, via: "#9a9a9a", drill: "#3a3a3a" });
    const traceUV = TRACE_PTS.map(p => uv(p[0], p[1], W, H));
    smoothPath(x, traceUV); x.strokeStyle = "#6a6a6a"; x.lineWidth = 0.9*S; x.stroke();
    smoothPath(x, traceUV); x.strokeStyle = "#b4b4b4"; x.lineWidth = 0.58*S; x.stroke();
    const ap = ANT_PTS.map(q => uv(q[0], q[1], W, H));
    poly(x, ap); x.strokeStyle = "#b0b0b0"; x.lineWidth = 0.24*S; x.stroke();
    for (const [px, pz, w, d] of allPads(W, H)) { const [u, v] = uv(px, pz, W, H); x.fillStyle = "#a8a8a8"; x.fillRect(u - w*S/2, v - d*S/2, w*S, d*S); }
    for (const f of LAYOUT.foot) { const [u, v] = uv(f.x, f.z, W, H); const l = f.l*S, w = f.w*S; x.save(); x.translate(u, v); if (f.rot) x.rotate(Math.PI/2); x.fillStyle = "#a8a8a8"; x.fillRect(-l/2 - 0.18*S, -w/2, 0.36*S, w); x.fillRect(l/2 - 0.18*S, -w/2, 0.36*S, w); x.restore(); }
    for (const vd of LAYOUT.vias) { const [u, v] = uv(vd.x, vd.z, W, H); x.fillStyle = "#9a9a9a"; x.beginPath(); x.arc(u, v, 0.15*S, 0, Math.PI*2); x.fill(); x.fillStyle = "#3a3a3a"; x.beginPath(); x.arc(u, v, 0.06*S, 0, Math.PI*2); x.fill(); }
    for (const h of HOLES) { const [u, v] = uv(h[0], h[1], W, H); x.fillStyle = "#9e9e9e"; x.beginPath(); x.arc(u, v, 0.52*S, 0, Math.PI*2); x.fill(); x.fillStyle = "#101010"; x.beginPath(); x.arc(u, v, 0.34*S, 0, Math.PI*2); x.fill(); }
    const tex = new THREE.CanvasTexture(c); tex.needsUpdate = true; return tex;
  }

  /* ---- procedural components ---- */
  function mat(color, metalness, roughness) {
    return new THREE.MeshStandardMaterial({ color, metalness, roughness, envMapIntensity: 1.1 });
  }
  function roundedBox(w, h, d, r, m) {
    const g = new THREE.BoxGeometry(w, h, d);
    return new THREE.Mesh(g, m);
  }
  function markingTex(lines) {
    const c = document.createElement("canvas"); c.width = c.height = 256;
    const x = c.getContext("2d");
    x.fillStyle = "#141821"; x.fillRect(0, 0, 256, 256);
    x.strokeStyle = "#2a3140"; x.lineWidth = 3; x.strokeRect(10, 10, 236, 236);
    x.fillStyle = "#9aa2b2"; x.font = "600 30px 'Geist Mono', monospace"; x.textAlign = "left"; x.textBaseline = "middle";
    lines.forEach((L, i) => x.fillText(L, 44, 104 + i * 40));
    x.fillStyle = "#aab2c2"; x.beginPath(); x.arc(40, 46, 12, 0, Math.PI*2); x.fill();
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
    return t;
  }
  function buildComponent(kind) {
    const grp = new THREE.Group();
    const epoxy = mat(0x161b22, 0.25, 0.5);
    const metal = mat(0xb9c0cc, 1.0, 0.28);
    const gold  = mat(0xd9b35e, 1.0, 0.32);
    if (kind === "usbc") {
      const shell = mat(0xc4ccd6, 1.0, 0.22);
      const body = roundedBox(5.5, 3.2, 7, 0.4, shell); body.position.y = 1.6 + TOP; grp.add(body);
      const slot = roundedBox(4.2, 1.6, 1, 0.2, mat(0x05060a,0.4,0.5)); slot.position.set(0,1.6+TOP, 3.6); grp.add(slot);
      const tongue = roundedBox(3.4, 0.3, 0.8, 0.1, mat(0x0e1116,0.1,0.6)); tongue.position.set(0, 1.6+TOP, 3.25); grp.add(tongue);
      const lip = roundedBox(5.2, 0.5, 0.6, 0.1, gold); lip.position.set(0, 1.6+TOP, -3.4); grp.add(lip);
      [[-2.6,-2.6],[2.6,-2.6],[-2.6,2.2],[2.6,2.2]].forEach(m2 => { const leg = roundedBox(0.7, 0.3, 1.6, 0.1, metal); leg.position.set(m2[0], 0.15+TOP, m2[1]); grp.add(leg); });
    } else if (kind === "irq") {
      // interrupt zone — a prominent SMA protection diode carries the stop
      const body = roundedBox(4.3, 1.1, 2.6, 0.2, mat(0x0c0e13, 0.1, 0.5)); body.position.y = 0.55 + TOP; grp.add(body);
      const band = roundedBox(0.5, 1.14, 2.4, 0.05, mat(0xd8dbe2, 0.05, 0.55)); band.position.set(-1.1, 0.55 + TOP, 0); grp.add(band);
      [-1, 1].forEach(sg => { const e = roundedBox(0.6, 0.5, 2.2, 0.1, metal); e.position.set(sg*2.35, 0.25 + TOP, 0); grp.add(e); });
    } else if (kind === "boot") {
      // access point — 2×5 SWD/boot header, gold pins in a black shroud base
      const base = roundedBox(8.6, 1.3, 3.2, 0.15, mat(0x14171f, 0.2, 0.5)); base.position.y = 0.65 + TOP; grp.add(base);
      for (let i = 0; i < 5; i++) for (const sg of [-1, 1]) {
        const pin = roundedBox(0.42, 2.2, 0.42, 0.05, gold);
        pin.position.set(-3.2 + i*1.6, 1.35 + TOP, sg*0.85);
        grp.add(pin);
      }
      const key = roundedBox(0.7, 0.35, 0.7, 0.05, mat(0x2a3140, 0.2, 0.5)); key.position.set(-3.2, 1.35 + TOP, -1.85); grp.add(key);
    } else if (kind === "mcu") {
      const body = roundedBox(9, 1.6, 9, 0.3, epoxy); body.position.y = 0.8 + TOP; grp.add(body);
      const mark = new THREE.Mesh(new THREE.PlaneGeometry(8.4, 8.4), new THREE.MeshStandardMaterial({ map: markingTex(["nRF52840", "QIAA-E0", "2426AB"]), metalness: 0.05, roughness: 0.5 }));
      mark.rotation.x = -Math.PI/2; mark.position.y = 1.62 + TOP; grp.add(mark);
      for (let s = 0; s < 4; s++) for (let i = 0; i < 8; i++) {
        const pin = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.25, 1.1), gold);
        const o = (i - 3.5) * 1.05;
        if (s===0) pin.position.set(o, 0.3+TOP, 5);
        if (s===1) pin.position.set(o, 0.3+TOP, -5);
        if (s===2) pin.position.set(5, 0.3+TOP, o), pin.rotation.y=Math.PI/2;
        if (s===3) pin.position.set(-5, 0.3+TOP, o), pin.rotation.y=Math.PI/2;
        grp.add(pin);
      }
      const dot = new THREE.Mesh(new THREE.CylinderGeometry(0.6,0.6,0.1,16), mat(0x9aa3b3,0.2,0.5));
      dot.position.set(-3, 1.62+TOP, -3); grp.add(dot);
    } else if (kind === "switch") {
      const housing = roundedBox(4.2, 1.7, 4.2, 0.2, mat(0x14171f,0.2,0.5)); housing.position.y = 0.85+TOP; grp.add(housing);
      const plate = roundedBox(4.2, 0.16, 4.2, 0.1, metal); plate.position.y = 1.78+TOP; grp.add(plate);
      const btn = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.25, 0.75, 24), mat(0xff5b3b, 0.1, 0.45));
      btn.position.y = 2.2+TOP; grp.add(btn);
      [[-1.9,-1.9],[1.9,-1.9],[-1.9,1.9],[1.9,1.9]].forEach(m2 => { const leg = roundedBox(0.6, 0.25, 0.9, 0.1, metal); leg.position.set(m2[0], 0.13+TOP, m2[1]); grp.add(leg); });
    }
    return grp;
  }

  /* ---- cluster part 3D builders ---- */
  function buildPart(k) {
    const g = new THREE.Group();
    const s = P[k];
    const endMat = mat(0xb7c0cf, 1.0, 0.3);
    const box = (w, h, d, m) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
    const twoEnd = (bodyMat, bodyL) => {
      const body = box((bodyL || s.l*0.7), s.h, s.w, bodyMat); body.position.y = s.h/2; g.add(body);
      [-1, 1].forEach(sg => { const e = box(s.l*0.16, s.h, s.w, endMat); e.position.set(sg*s.l*0.42, s.h/2, 0); g.add(e); });
      return body;
    };
    if (k === "r") twoEnd(mat(0x11141a, 0.05, 0.5));
    else if (k === "c") twoEnd(mat(0xb08d5a, 0.1, 0.5));
    else if (k === "fb") twoEnd(mat(0x3a3f47, 0.2, 0.5));
    else if (k === "led") {
      twoEnd(mat(0xe8eaec, 0.05, 0.4));
      const dome = box(s.l*0.42, 0.28, s.w*0.7, new THREE.MeshStandardMaterial({ color: 0x073b33, emissive: 0x00f0c8, emissiveIntensity: 1.6, metalness: 0, roughness: 0.3 }));
      dome.position.y = s.h + 0.14; g.add(dome);
    }
    else if (k === "diode") {
      twoEnd(mat(0x0c0e13, 0.1, 0.5));
      const band = box(0.42, 0.03, s.w*0.9, mat(0xd8dbe2, 0, 0.6));
      band.position.set(-s.l*0.22, s.h + 0.015, 0); g.add(band);
    }
    else if (k === "ctant") {
      const body = box(s.l*0.78, s.h, s.w*0.92, mat(0xc0913c, 0.1, 0.5)); body.position.y = s.h/2; g.add(body);
      const stripe = box(0.5, 0.03, s.w*0.8, mat(0x3a2c14, 0, 0.6)); stripe.position.set(-s.l*0.26, s.h + 0.015, 0); g.add(stripe);
      [-1, 1].forEach(sg => { const e = box(s.l*0.14, 0.5, s.w*0.7, endMat); e.position.set(sg*s.l*0.44, 0.25, 0); g.add(e); });
    }
    else if (k === "ind") {
      const body = box(s.l*0.92, s.h, s.w*0.92, mat(0x23262c, 0.45, 0.42)); body.position.y = s.h/2; g.add(body);
      const top = box(s.l*0.6, 0.04, s.w*0.6, mat(0x30343c, 0.4, 0.4)); top.position.y = s.h + 0.02; g.add(top);
    }
    else if (k === "sot23") {
      const body = box(2.0, s.h, 1.4, mat(0x161b22, 0.25, 0.5)); body.position.y = 0.35 + s.h/2; g.add(body);
      [[-0.95, 1.0], [0.95, 1.0], [0, -1.0]].forEach(([px, pz]) => {
        const pin = box(0.45, 0.18, 0.75, endMat); pin.position.set(px, 0.09, pz); g.add(pin);
      });
    }
    else if (k === "sot223") {
      const body = box(4.4, s.h, 3.0, mat(0x161b22, 0.25, 0.5)); body.position.y = 0.3 + s.h/2; g.add(body);
      const tab = box(3.2, 0.22, 1.6, endMat); tab.position.set(0, 0.11, -2.0); g.add(tab);
      for (let i = -1; i <= 1; i++) { const pin = box(0.8, 0.18, 1.1, endMat); pin.position.set(i*2.1, 0.09, 2.0); g.add(pin); }
    }
    else if (k === "tp") {
      const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.08, 20), mat(0xd9b35e, 1.0, 0.3));
      pad.position.y = 0.04; g.add(pad);
    }
    else if (k === "xtal") {
      const can = box(4.4, s.h, 2.7, mat(0xb9c0cc, 1.0, 0.28)); can.position.y = s.h/2; g.add(can);
    }
    return g;
  }

  // passives + all cluster parts seated on their texture footprints
  function scatterParts(group) {
    const capBody = mat(0xb08d5a, 0.1, 0.5);
    const capEnd  = mat(0xb7c0cf, 1.0, 0.3);
    const resBody = mat(0x11141a, 0.05, 0.5);
    // The 78 decorative passives are static for the lifetime of the board.
    // Rendering each body + two end caps as separate Mesh objects cost 234 draw
    // calls. Batch identical box/material combinations into InstancedMeshes;
    // every instance keeps the exact authored transform and material response.
    const passiveBatches = new Map();
    const groupMatrix = new THREE.Matrix4();
    const localMatrix = new THREE.Matrix4();
    const worldMatrix = new THREE.Matrix4();
    const queuePassive = (role, w, h, d, material, localX) => {
      const key = `${role}:${w.toFixed(6)}:${h.toFixed(6)}:${d.toFixed(6)}`;
      let batch = passiveBatches.get(key);
      if (!batch) {
        batch = { geometry: new THREE.BoxGeometry(w, h, d), material, matrices: [] };
        passiveBatches.set(key, batch);
      }
      localMatrix.makeTranslation(localX, h / 2, 0);
      worldMatrix.multiplyMatrices(groupMatrix, localMatrix);
      batch.matrices.push(worldMatrix.clone());
    };
    for (const f of LAYOUT.foot) {
      const bl = f.l * 0.92, bw = f.w * 0.95, bh = f.cap ? f.w * 0.75 : 0.42;
      groupMatrix.makeRotationY(f.rot ? Math.PI / 2 : 0);
      groupMatrix.setPosition(f.x, TOP, f.z);
      queuePassive(f.cap ? "cap-body" : "res-body", bl * 0.72, bh, bw, f.cap ? capBody : resBody, 0);
      queuePassive("end", bl * 0.16, bh, bw, capEnd, -bl * 0.43);
      queuePassive("end", bl * 0.16, bh, bw, capEnd,  bl * 0.43);
    }
    for (const [key, batch] of passiveBatches) {
      const instances = new THREE.InstancedMesh(batch.geometry, batch.material, batch.matrices.length);
      batch.matrices.forEach((matrix, index) => instances.setMatrixAt(index, matrix));
      instances.instanceMatrix.setUsage(THREE.StaticDrawUsage);
      instances.instanceMatrix.needsUpdate = true;
      instances.name = `pcb-passives:${key}`;
      if (instances.computeBoundingSphere) instances.computeBoundingSphere();
      group.add(instances);
    }
    for (const p of CPARTS) {
      const g = buildPart(p.k);
      g.position.set(p.x, TOP, p.z);
      if (p.rot) g.rotation.y = Math.PI / 2;
      group.add(g);
    }
  }

  /* ---- REAL Wafer exploded view (actual part GLBs, world-aligned) ---- */
  const WAFER_H = { key:1.06, case:0.60, display:0.40, switches:0.18, usbc:-0.36, plate:-0.82, antenna:-0.62, softoff:-0.54, pcb:-0.52, mcu:-0.42 };
  const waferParts = [], waferMats = [];
  function buildWaferReal(group) {
    const load = window.loadProjectModel;
    if (!load) { console.warn("[board3] loadProjectModel missing"); return; }
    const files = ["case_L","case_R","plate_L","plate_R","pcb_L","pcb_R","usbc_L","usbc_R","switches_L","switches_R","mcu","display_L","display_R","antenna_L","antenna_R","softoff_L","softoff_R"];
    for (const s of ["L","R"]) { for (let r=0;r<3;r++) for (let c=0;c<5;c++) files.push(`key_${s}_r${r}c${c}`); for (let t=0;t<3;t++) files.push(`key_${s}_t${t}`); }
    Promise.all(files.map(f => load("models/wafer_parts/"+f+".glb", THREE).then(root=>({f,root})).catch(()=>null))).then(ok => {
      ok = ok.filter(Boolean);
      if (!ok.length) return;
      const holder = new THREE.Group();
      for (const {root} of ok) holder.add(root);
      const box = new THREE.Box3().setFromObject(holder);
      const size = new THREE.Vector3(); box.getSize(size);
      const centre = new THREE.Vector3(); box.getCenter(centre);
      const dims = [size.x, size.y, size.z];
      const upI = dims.indexOf(Math.min(...dims));
      let longI = dims.indexOf(Math.max(...dims)); if (longI === upI) longI = (upI+1)%3;
      const ax = i => new THREE.Vector3(i===0?1:0, i===1?1:0, i===2?1:0);
      const UPm = ax(upI), LONGm = ax(longI);
      let capMean = 0, capN = 0;
      for (const {f,root} of ok) { if (!f.startsWith("key_")) continue; const b=new THREE.Box3().setFromObject(root), c=new THREE.Vector3(); b.getCenter(c); capMean += c.sub(centre).dot(UPm); capN++; }
      if (capN && capMean < 0) UPm.multiplyScalar(-1);
      const base = dims[longI];
      for (const {f,root} of ok) {
        const kind = f.startsWith("key_") ? "key" : f.replace(/_[LR]$/,"");
        const b = new THREE.Box3().setFromObject(root), c = new THREE.Vector3(); b.getCenter(c);
        const rel = c.sub(centre);
        const horiz = rel.clone().addScaledVector(UPm, -rel.dot(UPm));
        const vec = new THREE.Vector3().addScaledVector(UPm, (WAFER_H[kind]||0)*base*0.35).addScaledVector(horiz, 0.4);
        const wrap = new THREE.Group(); wrap.add(root); wrap.userData.vec = vec; holder.add(wrap);
        waferParts.push(wrap);
        root.traverse(o => { if (o.isMesh && o.material) { const m = o.material = o.material.clone(); m.transparent = true; if ("envMapIntensity" in m) m.envMapIntensity = 1.2; waferMats.push(m); } });
      }
      holder.position.copy(centre).multiplyScalar(-1);
      const align = new THREE.Group(); align.add(holder);
      const q = new THREE.Quaternion().setFromUnitVectors(UPm.clone(), new THREE.Vector3(0,1,0));
      align.quaternion.copy(q);
      const lw = LONGm.clone().applyQuaternion(q);
      align.rotateOnWorldAxis(new THREE.Vector3(0,1,0), -Math.atan2(lw.z, lw.x));
      align.scale.setScalar(13 / Math.max(1e-3, base));
      group.add(align);
    });
  }

  function build(mount, opts) {
    const LITE = !!(opts && opts.lite);
    const THREE = window.THREE;
    if (!THREE) { console.warn("THREE missing"); return null; }
    const W = mount.clientWidth, H = mount.clientHeight;

    const renderer = new THREE.WebGLRenderer({ antialias: !LITE, alpha: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, LITE ? 1.25 : 2));
    renderer.setSize(W, H);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x04060d, 55, 150);

    let envTarget = null, pmrem = null, envScene = null;
    try {
      pmrem = new THREE.PMREMGenerator(renderer);
      envScene = new THREE.RoomEnvironment();
      envTarget = pmrem.fromScene(envScene, 0.04);
      scene.environment = envTarget.texture;
    } catch (e) { console.warn("env failed", e); }
    finally {
      if (envScene) {
        if (envScene.dispose) envScene.dispose();
        else envScene.traverse((object) => {
          if (object.geometry && object.geometry.dispose) object.geometry.dispose();
          const mats = object.material ? (Array.isArray(object.material) ? object.material : [object.material]) : [];
          mats.forEach((material) => material && material.dispose && material.dispose());
        });
      }
      if (pmrem) pmrem.dispose();
    }

    const camera = new THREE.PerspectiveCamera(40, W / H, 0.5, 400);
    camera.position.set(0, 30, 40);
    camera.lookAt(0, 0, 0);

    const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(-30, 50, 25); scene.add(key);
    const fill = new THREE.DirectionalLight(0x9ab4ff, 0.5); fill.position.set(30, 20, -20); scene.add(fill);
    const rim = new THREE.PointLight(0x00f0c8, 60, 120, 2); rim.position.set(0, 14, -10); scene.add(rim);
    scene.add(new THREE.AmbientLight(0xffffff, 0.25));

    // Preserve the close-up silkscreen at its authored resolution. The
    // non-color material maps can be smaller without softening PCB text.
    const colorW = LITE ? 2048 : 4096;
    const detailW = LITE ? 1024 : 4096;
    const colorTex = drawColor(colorW, Math.round(colorW * BOARD_D / BOARD_W));
    const specTex = drawSpec(detailW, Math.round(detailW * BOARD_D / BOARD_W));
    const bumpTex = drawBump(detailW, Math.round(detailW * BOARD_D / BOARD_W));
    const boardMat = new THREE.MeshStandardMaterial({
      map: colorTex, metalnessMap: specTex, roughnessMap: specTex,
      bumpMap: bumpTex, bumpScale: 0.4,
      metalness: 1.0, roughness: 1.0, envMapIntensity: 1.0,
    });
    const edgeMat = mat(0x151009, 0.0, 0.85);
    const board = new THREE.Mesh(new THREE.BoxGeometry(BOARD_W, BOARD_T, BOARD_D), [edgeMat,edgeMat,boardMat,edgeMat,edgeMat,edgeMat]);
    scene.add(board);

    scatterParts(scene);

    const curvePts = TRACE_PTS.map(p => new THREE.Vector3(p[0], TOP + 0.05, p[1]));
    const curve = new THREE.CatmullRomCurve3(curvePts, false, "catmullrom", 0.5);

    /* Shared void and emergence. */
    const STAR_N = 380;
    const starGeo2 = new THREE.BufferGeometry();
    const starPos2 = new Float32Array(STAR_N * 3);
    for (let i = 0; i < STAR_N; i++) {
      const r = 80 + Math.random() * 260;
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      starPos2[i*3+0] = Math.sin(ph) * Math.cos(th) * r;
      starPos2[i*3+1] = Math.abs(Math.cos(ph) * r) * 0.5 + 8;
      starPos2[i*3+2] = Math.sin(ph) * Math.sin(th) * r;
    }
    starGeo2.setAttribute("position", new THREE.BufferAttribute(starPos2, 3));
    const starField2 = new THREE.Points(starGeo2, new THREE.PointsMaterial({
      color: 0x00f0c8, size: 0.9, sizeAttenuation: true,
      transparent: true, opacity: 0.5, depthWrite: false,
    }));
    scene.add(starField2);

    const ASM_N = 620;
    const asmGeo2  = new THREE.BufferGeometry();
    const asmPos2  = new Float32Array(ASM_N * 3);
    const asmTar2  = new Float32Array(ASM_N * 3);
    const asmSca2  = new Float32Array(ASM_N * 3);
    const _tp = new THREE.Vector3();
    for (let i = 0; i < ASM_N; i++) {
      if (Math.random() < 0.7) {
        curve.getPointAt(Math.random(), _tp);
        asmTar2[i*3+0] = _tp.x + (Math.random() - 0.5) * 5;
        asmTar2[i*3+1] = TOP + 0.4 + Math.random() * 2.2;
        asmTar2[i*3+2] = _tp.z + (Math.random() - 0.5) * 5;
      } else {
        const st = STOPS[(Math.random() * STOPS.length) | 0];
        const [px, pz] = TRACE_PTS[st.p];
        const a = Math.random() * Math.PI * 2, rr2 = Math.random() * 7;
        asmTar2[i*3+0] = px + Math.cos(a) * rr2;
        asmTar2[i*3+1] = TOP + 0.5 + Math.random() * 2.5;
        asmTar2[i*3+2] = pz + Math.sin(a) * rr2;
      }
      asmSca2[i*3+0] = asmTar2[i*3+0] + (Math.random() - 0.5) * 180;
      asmSca2[i*3+1] = asmTar2[i*3+1] + 40 + Math.random() * 120;
      asmSca2[i*3+2] = asmTar2[i*3+2] + 30 + Math.random() * 160;
      asmPos2[i*3+0] = asmSca2[i*3+0];
      asmPos2[i*3+1] = asmSca2[i*3+1];
      asmPos2[i*3+2] = asmSca2[i*3+2];
    }
    asmGeo2.setAttribute("position", new THREE.BufferAttribute(asmPos2, 3).setUsage(THREE.DynamicDrawUsage));
    const assembly2 = new THREE.Points(asmGeo2, new THREE.PointsMaterial({
      color: 0x00f0c8, size: 1.1, sizeAttenuation: true,
      transparent: true, opacity: 0, depthWrite: false,
    }));
    scene.add(assembly2);

    // components at stops
    const stopObjs = [];
    let deviceGroup = null;
    STOPS.forEach((st) => {
      const [px, pz] = TRACE_PTS[st.p];
      const grp = buildComponent(st.kind);
      grp.scale.setScalar(0.85);
      grp.position.set(px, 0, pz);
      scene.add(grp);
      stopObjs.push({ st, grp, pos: new THREE.Vector3(px, TOP + 2, pz) });

      if (st.explode) {
        deviceGroup = new THREE.Group();
        deviceGroup.position.set(px, TOP + 4.6, pz);
        deviceGroup.visible = false;
        scene.add(deviceGroup);
        buildWaferReal(deviceGroup);
      }
    });

    const formMats = [];
    scene.traverse((o) => {
      if (o.isMesh && o.material) {
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        mats.forEach((m) => { if (!formMats.includes(m)) formMats.push(m); });
      }
    });
    let formMatsTransparent = false;

    let composer = null, bokeh = null;
    try {
      if (!LITE && THREE.EffectComposer && THREE.BokehPass && THREE.RenderPass) {
        composer = new THREE.EffectComposer(renderer);
        composer.addPass(new THREE.RenderPass(scene, camera));
        bokeh = new THREE.BokehPass(scene, camera, { focus: 30, aperture: 0.0009, maxblur: 0.006 });
        composer.addPass(bokeh);
        if (THREE.OutputPass) composer.addPass(new THREE.OutputPass());
      }
    } catch (e) { console.warn("composer failed", e); composer = null; }

    /* ---- controller ---- */
    const tmpPos = new THREE.Vector3(), tmpLook = new THREE.Vector3(), tmpTan = new THREE.Vector3(), tmpSide = new THREE.Vector3(), UP = new THREE.Vector3(0,1,0);
    const camPos = new THREE.Vector3().copy(camera.position);
    const camLook = new THREE.Vector3(0,0,0);
    let curLook = new THREE.Vector3(0,0,0);

    function stopTForIndex(i) { return STOPS[i].p / (TRACE_PTS.length - 1); }

    const HERO_POS = new THREE.Vector3(), HERO_LOOK = new THREE.Vector3();
    const NODE_POS = new THREE.Vector3(), NODE_LOOK = new THREE.Vector3();
    const tmpFinalPos = new THREE.Vector3(), tmpFinalLook = new THREE.Vector3();

    function update(t, mode, dt, footerMix, introMix, nodeMix) {
      t = Math.max(0, Math.min(1, t));
      footerMix = Math.max(0, Math.min(1, footerMix || 0));
      introMix = Math.max(0, Math.min(1, introMix || 0));
      nodeMix = Math.max(0, Math.min(1, nodeMix || 0));
      const ease = 1 - Math.pow(0.0015, dt / 1000);
      const nowMs = performance.now();

      let active = 0, best = 1e9;
      STOPS.forEach((s, i) => { const d = Math.abs(t - stopTForIndex(i)); if (d < best) { best = d; active = i; } });

      if (mode === "bench") {
        curve.getPointAt(t, tmpLook);
        tmpPos.set(tmpLook.x + 6, 26, tmpLook.z + 26);
        camLook.copy(tmpLook);
      } else {
        curve.getPointAt(t, tmpPos);
        curve.getTangentAt(t, tmpTan);
        tmpSide.copy(tmpTan).cross(UP).normalize();
        tmpPos.addScaledVector(tmpTan, -8).addScaledVector(tmpSide, 7);
        tmpPos.y += 12;
        curve.getPointAt(Math.min(1, t + 0.05), tmpLook);
        tmpLook.y += 0.2;
        camLook.copy(tmpLook);
      }

      camPos.lerp(tmpPos, ease);
      curLook.lerp(camLook, ease);

      tmpFinalPos.copy(camPos);
      tmpFinalLook.copy(curLook);
      if (footerMix > 0) {
        const fe = footerMix < 0.5 ? 2*footerMix*footerMix : 1 - Math.pow(-2*footerMix+2, 2)/2;
        HERO_POS.set(-6 + Math.sin(nowMs * 0.00018) * 2, 50, 96);
        HERO_LOOK.set(0, -2, 2);
        tmpFinalPos.lerp(HERO_POS, fe);
        tmpFinalLook.lerp(HERO_LOOK, fe);
      }

      if (introMix > 0) {
        const ie = introMix < 0.5 ? 2*introMix*introMix : 1 - Math.pow(-2*introMix+2, 2)/2;
        tmpFinalPos.x -= 9 * ie;
        tmpFinalPos.y += 30 * ie;
        tmpFinalPos.z += 24 * ie;
      }

      camera.position.copy(tmpFinalPos);
      camera.lookAt(tmpFinalLook);

      if (nodeMix > 0) {
        const ne = nodeMix < 0.5 ? 2*nodeMix*nodeMix : 1 - Math.pow(-2*nodeMix+2, 2)/2;
        const bob = Math.sin(nowMs * 0.0004) * 3;
        NODE_POS.set(38, 104 + bob, 150);
        NODE_LOOK.set(0, -4, 0);
        camera.position.lerpVectors(tmpFinalPos, NODE_POS, ne);
        tmpFinalLook.lerpVectors(curLook, NODE_LOOK, ne);
        camera.lookAt(tmpFinalLook);
      }
      starField2.material.opacity = 0.5 * (1 - nodeMix);
      scene.fog.far = 150 + 260 * nodeMix;
      if (deviceGroup) {
        const dt2 = Math.abs(t - stopTForIndex(STOPS.findIndex(s => s.explode)));
        const ex = Math.max(0, 1 - dt2 * 9);
        deviceGroup.visible = ex > 0.02 && waferParts.length > 0;
        if (deviceGroup.visible) {
          const exs = ex < 0.5 ? 2*ex*ex : 1 - Math.pow(-2*ex+2, 2)/2;
          for (const w of waferParts) w.position.copy(w.userData.vec).multiplyScalar(exs * 0.15);
          const op = Math.min(1, ex * 2.5);
          for (const m of waferMats) m.opacity = op;
          deviceGroup.rotation.y += dt * 0.0004;
        }
      }

      starField2.rotation.y += dt * 0.00002;
      const conv = 1 - introMix;
      if (introMix > 0.001) {
        const ce = conv < 0.5 ? 2*conv*conv : 1 - Math.pow(-2*conv+2, 2)/2;
        const ap = assembly2.geometry.attributes.position.array;
        for (let i = 0; i < ASM_N * 3; i++) ap[i] = asmSca2[i] + (asmTar2[i] - asmSca2[i]) * ce;
        assembly2.geometry.attributes.position.needsUpdate = true;
        assembly2.material.opacity = Math.sin(Math.min(1, conv) * Math.PI) * 0.85;
        assembly2.material.size = 1.4 - conv * 0.5;
        const fo = Math.min(1, conv / 0.55);
        const foe = fo < 0.5 ? 2*fo*fo : 1 - Math.pow(-2*fo+2, 2)/2;
        if (!formMatsTransparent) { formMats.forEach(m => { m.transparent = true; }); formMatsTransparent = true; }
        formMats.forEach(m => { m.opacity = foe; });
        starField2.material.opacity = 0.18 + conv * 0.32;
      } else if (formMatsTransparent) {
        formMats.forEach(m => { m.opacity = 1; m.transparent = false; });
        assembly2.material.opacity = 0;
        starField2.material.opacity = 0.5;
        formMatsTransparent = false;
      }

      if (bokeh) {
        const focusDist = camera.position.distanceTo(curLook);
        bokeh.uniforms.focus.value += (focusDist - bokeh.uniforms.focus.value) * 0.1;
      }
      rim.position.copy(curLook); rim.position.y += 8;

      return active;
    }

    function render() { if (composer) composer.render(); else renderer.render(scene, camera); }
    function setSize(w, h) {
      renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix();
      if (composer) composer.setSize(w, h);
    }
    function dispose() {
      if (bokeh && bokeh.dispose) bokeh.dispose();
      if (composer && composer.dispose) composer.dispose();
      const geometries = new Set();
      const materials = new Set();
      const textures = new Set([colorTex, specTex, bumpTex]);
      scene.traverse((object) => {
        if (object.geometry && object.geometry.dispose) geometries.add(object.geometry);
        const objectMaterials = object.material
          ? (Array.isArray(object.material) ? object.material : [object.material])
          : [];
        objectMaterials.forEach((material) => {
          if (!material || !material.dispose) return;
          materials.add(material);
          Object.keys(material).forEach((key) => {
            const value = material[key];
            if (value && value.isTexture && value.dispose) textures.add(value);
          });
        });
      });
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
      textures.forEach((texture) => texture && texture.dispose());
      if (envTarget) envTarget.dispose();
      if (renderer.renderLists) renderer.renderLists.dispose();
      renderer.dispose();
      if (renderer.forceContextLoss) renderer.forceContextLoss();
      try { mount.removeChild(renderer.domElement); } catch (_) {}
    }

    return { update, render, setSize, dispose, stops: STOPS, domElement: renderer.domElement };
  }

  window.MOBoard = { build, STOPS };
})();
