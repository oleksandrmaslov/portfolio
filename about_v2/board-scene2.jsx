/* ============================================================
   M.O. SYSTEM — About · PCB board scene
   ------------------------------------------------------------
   A real-feeling printed circuit board:
     · matte black solder-mask FR-4 slab
     · one EXPOSED-COPPER hero trace = the narrative spine
       (the camera follows it like a signal probe)
     · ENIG gold pads, vias, white silkscreen refs
     · procedural components at each chapter "stop"
     · the U1 MCU explodes into a Wafer device stack (A+B blend)
     · RoomEnvironment reflections + Bokeh depth-of-field

   window.MOBoard.build(mount) -> controller {
       update(t, mode, dt), render(), setSize(w,h), dispose(), stops
   }
   ============================================================ */
(function () {
  const BOARD_W = 120, BOARD_D = 40, BOARD_T = 1.4;
  const TOP = BOARD_T / 2;

  // narrative polyline across the board (x, z). Camera + hero trace share it.
  const TRACE_PTS = [
    [-64, -6], [-50, -6], [-38, 3], [-26, 8], [-12, 2],
    [2, -5], [14, 1], [28, 9], [40, 2], [52, -3], [64, -3],
  ];

  // chapter stops — index into TRACE_PTS, component kind, copy
  const STOPS = [
    { p: 1, kind: "usbc",    ref: "J1 · POWER IN", chapter: {
        n: "00", kicker: "POWER IN · KYIV", title: ["It starts with ", "power", "."],
        body: "Born in Kyiv, 21·07·2007. The kid who opened every device in the flat to find the board inside — and couldn't always get the case back on." } },
    { p: 3, kind: "crystal", ref: "Y1 · 16 MHz", chapter: {
        n: "01", kicker: "TIMING · KYIV → MÜNCHEN", title: ["Then a ", "crossing", "."],
        body: "February 2022. A backpack and a half-finished keyboard — the longest trace on this board. [WRITE: what you carried.]" } },
    { p: 5, kind: "mcu", ref: "U1 · nRF52840", explode: true, chapter: {
        n: "02", kicker: "THE BRAIN · HOW", title: ["Built from the ", "schematic up", "."],
        body: "Schematic, board, firmware, case — and the docs that ship with them. Open over closed. Primitives over frameworks. Field-repairable or unfinished." } },
    { p: 7, kind: "cat", ref: "U2 · KERFUR", chapter: {
        n: "03", kicker: "WHY · 0x02", title: ["The biological ", "reference unit", "."],
        body: "Kerfur is named after a tongue-out tabby who lives rent-free in my flat. I wanted something that felt alive — twitching-tail alive. The cat is the design brief." } },
    { p: 9, kind: "switch", ref: "SW1 · OUTPUT", live: true, chapter: {
        n: "04", kicker: "OUTPUT · NOW", title: ["Currently ", "building", "."],
        body: "Kerfur v0.4 · Wafer R3 · ZMK upstream. Open to an Ausbildung or junior role in embedded / firmware — Munich +200 km." } },
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

  /* ---- deterministic board layout (shared by color/spec/bump + 3D passives) ---- */
  function makeRng(seed) { let s = seed >>> 0; return () => { s = (s * 1103515245 + 12345) >>> 0; return s / 4294967296; }; }
  const LAYOUT = (() => {
    const R = makeRng(20260719);
    const clampB = (p) => { p[0] = Math.max(-BOARD_W/2+3, Math.min(BOARD_W/2-3, p[0])); p[1] = Math.max(-BOARD_D/2+2.5, Math.min(BOARD_D/2-2.5, p[1])); return p; };
    const foot = []; let rN = 1, cN = 1, guard = 0;
    while (foot.length < 120 && guard++ < 4000) {
      const x = -BOARD_W/2+6 + R()*(BOARD_W-12), z = -BOARD_D/2+4.5 + R()*(BOARD_D-9);
      let ok = true;
      for (const p of TRACE_PTS) { const dx = x-p[0], dz = z-p[1]; if (dx*dx+dz*dz < 30) { ok = false; break; } }
      if (ok) for (const f of foot) { const dx = x-f.x, dz = z-f.z; if (dx*dx+dz*dz < 8) { ok = false; break; } }
      if (!ok) continue;
      const k = R(), cap = k < 0.45;
      foot.push({ x, z, rot: R() < 0.5 ? 0 : 1, l: k < 0.8 ? 1.55 : 2.1, w: k < 0.8 ? 0.8 : 1.1, cap, ref: cap ? ("C"+cN++) : ("R"+rN++) });
    }
    const vias = []; for (let i = 0; i < 70; i++) vias.push({ x: -BOARD_W/2+4 + R()*(BOARD_W-8), z: -BOARD_D/2+3 + R()*(BOARD_D-6), tent: R() < 0.5 });
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
    return { foot, vias, stitch, tribs };
  })();
  // real footprint pad rects per stop — [cx, cz, w, d] board units (matches 0.85-scaled components)
  function stopPads(st) {
    const [sx, sz] = TRACE_PTS[st.p], pads = [];
    if (st.kind === "mcu") {
      for (let i = 0; i < 8; i++) { const o = (i - 3.5) * 0.89;
        pads.push([sx + o, sz + 4.5, 0.5, 1.3]); pads.push([sx + o, sz - 4.5, 0.5, 1.3]);
        pads.push([sx + 4.5, sz + o, 1.3, 0.5]); pads.push([sx - 4.5, sz + o, 1.3, 0.5]); }
      pads.push([sx, sz, 4.2, 4.2]);
    } else if (st.kind === "crystal") { pads.push([sx - 3.4, sz, 2.0, 2.4]); pads.push([sx + 3.4, sz, 2.0, 2.4]);
    } else if (st.kind === "usbc") {
      for (let i = 0; i < 8; i++) pads.push([sx - 2.1 + i*0.6, sz - 3.2, 0.34, 1.1]);
      [[-2.6,-2.6],[2.6,-2.6],[-2.6,2.2],[2.6,2.2]].forEach(m => pads.push([sx+m[0], sz+m[1], 0.9, 1.9]));
    } else if (st.kind === "cat") { for (let i = 0; i < 4; i++) { const o = (i-1.5)*1.27; pads.push([sx+o, sz+2.9, 0.7, 1.4]); pads.push([sx+o, sz-2.9, 0.7, 1.4]); }
    } else { [[-2.2,-2.2],[2.2,-2.2],[-2.2,2.2],[2.2,2.2]].forEach(m => pads.push([sx+m[0], sz+m[1], 1.5, 1.5])); }
    return pads;
  }
  const COURT = { mcu: [8.2, 8.2], crystal: [8.0, 3.2], usbc: [5.0, 6.2], cat: [6.2, 5.2], switch: [4.4, 4.4] };

  function drawColor(W, H) {
    const S = W / BOARD_W;                       // px per board unit
    const c = document.createElement("canvas"); c.width = W; c.height = H;
    const x = c.getContext("2d");
    // solder mask over copper pour — matte near-black, faint tonal variation
    x.fillStyle = "#0a0d12"; x.fillRect(0, 0, W, H);
    const g = x.createRadialGradient(W*0.42, H*0.4, 0, W*0.5, H*0.5, W*0.62);
    g.addColorStop(0, "rgba(24,30,42,0.55)"); g.addColorStop(1, "rgba(0,0,0,0)");
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    // copper pour cross-hatch under the mask
    x.strokeStyle = "rgba(56,72,96,0.09)"; x.lineWidth = 2;
    for (let i = -H; i < W; i += 10) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i+H, H); x.stroke(); x.beginPath(); x.moveTo(i+H, 0); x.lineTo(i, H); x.stroke(); }
    // pour keepout ring
    x.strokeStyle = "rgba(110,140,180,0.12)"; x.lineWidth = 0.16*S;
    x.strokeRect(0.55*S, 0.55*S, W - 1.1*S, H - 1.1*S);

    x.lineCap = "round"; x.lineJoin = "round";
    // tributary nets — 45°-routed, under mask (dark keepout + faint copper), ending in a via
    for (const pts of LAYOUT.tribs) {
      const p = pts.map(q => uv(q[0], q[1], W, H));
      x.beginPath(); x.moveTo(p[0][0], p[0][1]); for (let i = 1; i < p.length; i++) x.lineTo(p[i][0], p[i][1]);
      x.strokeStyle = "rgba(3,4,7,0.9)"; x.lineWidth = 0.34*S; x.stroke();
      x.beginPath(); x.moveTo(p[0][0], p[0][1]); for (let i = 1; i < p.length; i++) x.lineTo(p[i][0], p[i][1]);
      x.strokeStyle = "rgba(150,172,205,0.16)"; x.lineWidth = 0.2*S; x.stroke();
      const e = p[p.length-1];
      x.fillStyle = "#a88a46"; x.beginPath(); x.arc(e[0], e[1], 0.16*S, 0, Math.PI*2); x.fill();
      x.fillStyle = "#06070b"; x.beginPath(); x.arc(e[0], e[1], 0.07*S, 0, Math.PI*2); x.fill();
    }

    const traceUV = TRACE_PTS.map(p => uv(p[0], p[1], W, H));
    // HERO trace — exposed copper ribbon in a solder-mask keepout
    smoothPath(x, traceUV); x.strokeStyle = "#04050a"; x.lineWidth = 0.9*S; x.stroke();
    const cop = x.createLinearGradient(0, 0, W, 0);
    cop.addColorStop(0, "#7a4a24"); cop.addColorStop(0.5, "#c98a4e"); cop.addColorStop(1, "#9a6232");
    smoothPath(x, traceUV); x.strokeStyle = cop; x.lineWidth = 0.58*S; x.stroke();
    smoothPath(x, traceUV); x.strokeStyle = "rgba(255,224,184,0.5)"; x.lineWidth = 0.14*S; x.stroke();

    // ---- real footprints at stops — ENIG pads + silkscreen courtyards ----
    x.textBaseline = "middle";
    STOPS.forEach((st) => {
      const [sx, sz] = TRACE_PTS[st.p];
      const [u, v] = uv(sx, sz, W, H);
      for (const [px, pz, w, d] of stopPads(st)) {
        const [pu, pv] = uv(px, pz, W, H);
        const grd = x.createLinearGradient(pu, pv - d*S/2, pu, pv + d*S/2);
        grd.addColorStop(0, "#e8c477"); grd.addColorStop(0.5, "#cfa557"); grd.addColorStop(1, "#a97f38");
        x.fillStyle = grd;
        x.fillRect(pu - w*S/2, pv - d*S/2, w*S, d*S);
      }
      const ct = COURT[st.kind] || [5, 5];
      x.strokeStyle = "rgba(220,226,238,0.75)"; x.lineWidth = 0.09*S;
      x.strokeRect(u - ct[0]*S/2, v - ct[1]*S/2, ct[0]*S, ct[1]*S);
      x.fillStyle = "#dfe3ec"; x.beginPath(); x.arc(u - ct[0]*S/2 - 0.35*S, v - ct[1]*S/2 - 0.35*S, 0.14*S, 0, Math.PI*2); x.fill();
      x.font = `700 ${0.72*S}px 'Geist Mono', monospace`; x.textAlign = "center";
      x.fillText(st.ref.split(" · ")[0], u, v - ct[1]*S/2 - 1.0*S);
      x.fillStyle = "#98a1b3"; x.font = `500 ${0.5*S}px 'Geist Mono', monospace`;
      x.fillText(st.ref.split(" · ")[1] || "", u, v + ct[1]*S/2 + 0.9*S);
    });

    // passives — termination pads, silkscreen outline, ref des
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
    // vias — annular ring + drill; tented ones read as mask bumps; stitching rows along the edges
    for (const vd of LAYOUT.vias.concat(LAYOUT.stitch.map(s => ({ x: s[0], z: s[1], tent: true })))) {
      const [u, v] = uv(vd.x, vd.z, W, H);
      if (vd.tent) { x.fillStyle = "rgba(46,58,78,0.85)"; x.beginPath(); x.arc(u, v, 0.14*S, 0, Math.PI*2); x.fill(); x.fillStyle = "rgba(8,10,15,0.9)"; x.beginPath(); x.arc(u, v, 0.05*S, 0, Math.PI*2); x.fill(); }
      else { x.fillStyle = "#b08c46"; x.beginPath(); x.arc(u, v, 0.15*S, 0, Math.PI*2); x.fill(); x.fillStyle = "#05060a"; x.beginPath(); x.arc(u, v, 0.065*S, 0, Math.PI*2); x.fill(); }
    }
    // fiducials — bare copper dot in a round mask keepout
    [[-BOARD_W/2+4, -BOARD_D/2+3.4], [BOARD_W/2-4, BOARD_D/2-3.4], [BOARD_W/2-4, -BOARD_D/2+3.4]].forEach(fd => {
      const [u, v] = uv(fd[0], fd[1], W, H);
      x.fillStyle = "#05060a"; x.beginPath(); x.arc(u, v, 0.32*S, 0, Math.PI*2); x.fill();
      x.fillStyle = "#cfa557"; x.beginPath(); x.arc(u, v, 0.16*S, 0, Math.PI*2); x.fill();
    });

    // board silkscreen identity
    x.fillStyle = "#5b6478"; x.font = `600 ${0.88*S}px 'Geist Mono', monospace`; x.textAlign = "left";
    x.fillText("MASLOV / OLEKSANDR", 1.3*S, 1.55*S);
    x.font = `500 ${0.58*S}px 'Geist Mono', monospace`;
    x.fillText("ABOUT · REV A · MÜNCHEN 2026", 1.3*S, H - 1.3*S);
    x.textAlign = "right";
    x.fillText("// trace the net", W - 1.3*S, H - 1.3*S);
    x.fillText("E355094 94V-0", W - 1.3*S, 1.55*S);

    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8; tex.needsUpdate = true;
    return tex;
  }

  function drawSpec(W, H) {
    // R unused · G = roughness · B = metalness
    const S = W / BOARD_W;
    const c = document.createElement("canvas"); c.width = W; c.height = H;
    const x = c.getContext("2d");
    x.fillStyle = "rgb(0,165,0)"; x.fillRect(0, 0, W, H);     // mask: semi-matte
    x.lineCap = "round"; x.lineJoin = "round";
    x.strokeStyle = "rgb(0,140,25)"; x.lineWidth = 0.2*S;     // trib bumps: slightly smoother
    for (const pts of LAYOUT.tribs) { const p = pts.map(q => uv(q[0], q[1], W, H)); x.beginPath(); x.moveTo(p[0][0], p[0][1]); for (let i = 1; i < p.length; i++) x.lineTo(p[i][0], p[i][1]); x.stroke(); }
    const traceUV = TRACE_PTS.map(p => uv(p[0], p[1], W, H));
    smoothPath(x, traceUV); x.strokeStyle = "rgb(0,70,255)"; x.lineWidth = 0.58*S; x.stroke();
    STOPS.forEach((st) => { for (const [px, pz, w, d] of stopPads(st)) { const [u, v] = uv(px, pz, W, H); x.fillStyle = "rgb(0,60,255)"; x.fillRect(u - w*S/2, v - d*S/2, w*S, d*S); } });
    for (const f of LAYOUT.foot) {
      const [u, v] = uv(f.x, f.z, W, H); const l = f.l*S, w = f.w*S;
      x.save(); x.translate(u, v); if (f.rot) x.rotate(Math.PI/2);
      x.fillStyle = "rgb(0,55,245)"; x.fillRect(-l/2 - 0.18*S, -w/2, 0.36*S, w); x.fillRect(l/2 - 0.18*S, -w/2, 0.36*S, w);
      x.restore();
    }
    for (const vd of LAYOUT.vias) { if (vd.tent) continue; const [u, v] = uv(vd.x, vd.z, W, H); x.fillStyle = "rgb(0,60,255)"; x.beginPath(); x.arc(u, v, 0.15*S, 0, Math.PI*2); x.fill(); }
    const tex = new THREE.CanvasTexture(c); tex.needsUpdate = true; return tex;
  }

  function drawBump(W, H) {
    const S = W / BOARD_W;
    const c = document.createElement("canvas"); c.width = W; c.height = H;
    const x = c.getContext("2d");
    x.fillStyle = "#808080"; x.fillRect(0, 0, W, H);
    x.lineCap = "round"; x.lineJoin = "round";
    x.strokeStyle = "#8e8e8e"; x.lineWidth = 0.2*S;
    for (const pts of LAYOUT.tribs) { const p = pts.map(q => uv(q[0], q[1], W, H)); x.beginPath(); x.moveTo(p[0][0], p[0][1]); for (let i = 1; i < p.length; i++) x.lineTo(p[i][0], p[i][1]); x.stroke(); }
    const traceUV = TRACE_PTS.map(p => uv(p[0], p[1], W, H));
    smoothPath(x, traceUV); x.strokeStyle = "#6a6a6a"; x.lineWidth = 0.9*S; x.stroke();   // keepout dip
    smoothPath(x, traceUV); x.strokeStyle = "#b4b4b4"; x.lineWidth = 0.58*S; x.stroke();  // raised copper
    STOPS.forEach((st) => { for (const [px, pz, w, d] of stopPads(st)) { const [u, v] = uv(px, pz, W, H); x.fillStyle = "#a8a8a8"; x.fillRect(u - w*S/2, v - d*S/2, w*S, d*S); } });
    for (const f of LAYOUT.foot) { const [u, v] = uv(f.x, f.z, W, H); const l = f.l*S, w = f.w*S; x.save(); x.translate(u, v); if (f.rot) x.rotate(Math.PI/2); x.fillStyle = "#a8a8a8"; x.fillRect(-l/2 - 0.18*S, -w/2, 0.36*S, w); x.fillRect(l/2 - 0.18*S, -w/2, 0.36*S, w); x.restore(); }
    for (const vd of LAYOUT.vias) { const [u, v] = uv(vd.x, vd.z, W, H); x.fillStyle = "#9a9a9a"; x.beginPath(); x.arc(u, v, 0.15*S, 0, Math.PI*2); x.fill(); x.fillStyle = "#3a3a3a"; x.beginPath(); x.arc(u, v, 0.06*S, 0, Math.PI*2); x.fill(); }
    const tex = new THREE.CanvasTexture(c); tex.needsUpdate = true; return tex;
  }

  /* ---- procedural components ---- */
  function mat(color, metalness, roughness) {
    return new THREE.MeshStandardMaterial({ color, metalness, roughness, envMapIntensity: 1.1 });
  }
  function roundedBox(w, h, d, r, m) {
    // cheap rounded box via BoxGeometry (bevel implied by lighting); r reserved
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
    x.fillStyle = "#aab2c2"; x.beginPath(); x.arc(40, 46, 12, 0, Math.PI*2); x.fill();  // laser pin-1 dot
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
    return t;
  }
  function buildComponent(kind) {
    const grp = new THREE.Group();
    const black = mat(0x0c0e13, 0.1, 0.55);
    const epoxy = mat(0x161b22, 0.25, 0.5);
    const metal = mat(0xb9c0cc, 1.0, 0.28);
    const gold  = mat(0xd9b35e, 1.0, 0.32);
    if (kind === "usbc") {
      const shell = mat(0xc4ccd6, 1.0, 0.22);
      const body = roundedBox(5.5, 3.2, 7, 0.4, shell); body.position.y = 1.6 + TOP; grp.add(body);
      const slot = roundedBox(4.2, 1.6, 1, 0.2, mat(0x05060a,0.4,0.5)); slot.position.set(0,1.6+TOP, 3.6); grp.add(slot);
      const lip = roundedBox(5.2, 0.5, 0.6, 0.1, mat(0xd9b35e,1,0.3)); lip.position.set(0, 1.6+TOP, -3.4); grp.add(lip);
    } else if (kind === "crystal") {
      const can = new THREE.Mesh(new THREE.CapsuleGeometry(1.5, 6, 6, 16), metal);
      can.rotation.z = Math.PI/2; can.position.y = 1.5 + TOP; grp.add(can);
    } else if (kind === "mcu") {
      const body = roundedBox(9, 1.6, 9, 0.3, epoxy); body.position.y = 0.8 + TOP; grp.add(body);
      const mark = new THREE.Mesh(new THREE.PlaneGeometry(8.4, 8.4), new THREE.MeshStandardMaterial({ map: markingTex(["nRF52840", "QIAA-E0", "2426AB"]), metalness: 0.05, roughness: 0.5 }));
      mark.rotation.x = -Math.PI/2; mark.position.y = 1.62 + TOP; grp.add(mark);
      // pins
      const pinMat = gold;
      for (let s = 0; s < 4; s++) for (let i = 0; i < 8; i++) {
        const pin = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.25, 1.1), pinMat);
        const o = (i - 3.5) * 1.05;
        if (s===0) pin.position.set(o, 0.3+TOP, 5);
        if (s===1) pin.position.set(o, 0.3+TOP, -5);
        if (s===2) pin.position.set(5, 0.3+TOP, o), pin.rotation.y=Math.PI/2;
        if (s===3) pin.position.set(-5, 0.3+TOP, o), pin.rotation.y=Math.PI/2;
        grp.add(pin);
      }
      // pin-1 dot
      const dot = new THREE.Mesh(new THREE.CylinderGeometry(0.6,0.6,0.1,16), mat(0x9aa3b3,0.2,0.5));
      dot.position.set(-3, 1.62+TOP, -3); grp.add(dot);
    } else if (kind === "cat") {
      const body = roundedBox(7, 1.4, 6, 0.3, epoxy); body.position.y = 0.7+TOP; grp.add(body);
      // two little ears (silkscreen-as-geometry homage)
      [-1.6,1.6].forEach(ex => { const ear = new THREE.Mesh(new THREE.ConeGeometry(0.8,1.4,4), mat(0xd9b35e,1,0.35)); ear.position.set(ex, 1.6+TOP, -2.2); ear.rotation.y=Math.PI/4; grp.add(ear); });
    } else if (kind === "switch") {
      const housing = roundedBox(4.2, 2, 4.2, 0.2, mat(0x14171f,0.2,0.5)); housing.position.y=1+TOP; grp.add(housing);
      const stem = roundedBox(2.4, 1.4, 2.4, 0.2, mat(0xff5b3b,0.1,0.5)); stem.position.y=2.4+TOP; grp.add(stem);
    }
    return grp;
  }

  // real passives seated exactly on their texture footprints
  function scatterParts(group) {
    const capBody = mat(0xb08d5a, 0.1, 0.5);     // tan ceramic MLCC
    const capEnd  = mat(0xb7c0cf, 1.0, 0.3);     // solder terminations
    const resBody = mat(0x11141a, 0.05, 0.5);    // black chip resistor
    for (const f of LAYOUT.foot) {
      const g = new THREE.Group();
      const bl = f.l * 0.92, bw = f.w * 0.95, bh = f.cap ? f.w * 0.75 : 0.42;
      const body = new THREE.Mesh(new THREE.BoxGeometry(bl * 0.72, bh, bw), f.cap ? capBody : resBody);
      body.position.y = bh / 2;
      g.add(body);
      [-1, 1].forEach(s => {
        const end = new THREE.Mesh(new THREE.BoxGeometry(bl * 0.16, bh, bw), capEnd);
        end.position.set(s * bl * 0.43, bh / 2, 0);
        g.add(end);
      });
      g.position.set(f.x, TOP, f.z);
      if (f.rot) g.rotation.y = Math.PI / 2;
      group.add(g);
    }
  }

  /* ---- REAL Wafer exploded view (actual part GLBs, world-aligned) ---- */
  const WAFER_H = { key:1.06, case:0.60, display:0.40, switches:0.18, usbc:-0.36, plate:-0.82, antenna:-0.62, softoff:-0.54, pcb:-0.52, mcu:-0.42 };
  const waferParts = [], waferMats = [];
  function buildWaferReal(group) {
    const load = window.loadProjectModel;
    if (!load) { console.warn("[board2] loadProjectModel missing"); return; }
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
    const LITE = !!(opts && opts.lite);   // inline-on-landing: lighter so it never stalls the main thread
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

    // environment (reflections)
    try {
      const pmrem = new THREE.PMREMGenerator(renderer);
      const envScene = new THREE.RoomEnvironment();
      scene.environment = pmrem.fromScene(envScene, 0.04).texture;
    } catch (e) { console.warn("env failed", e); }

    const camera = new THREE.PerspectiveCamera(40, W / H, 0.5, 400);
    camera.position.set(0, 30, 40);
    camera.lookAt(0, 0, 0);

    // lights
    const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(-30, 50, 25); scene.add(key);
    const fill = new THREE.DirectionalLight(0x9ab4ff, 0.5); fill.position.set(30, 20, -20); scene.add(fill);
    const rim = new THREE.PointLight(0x00f0c8, 60, 120, 2); rim.position.set(0, 14, -10); scene.add(rim);
    scene.add(new THREE.AmbientLight(0xffffff, 0.25));

    // board
    const TW = LITE ? 2048 : 4096, TH = Math.round(TW * BOARD_D / BOARD_W);
    const colorTex = drawColor(TW, TH);
    const specTex = drawSpec(TW, TH);
    const bumpTex = drawBump(TW, TH);
    const boardMat = new THREE.MeshStandardMaterial({
      map: colorTex, metalnessMap: specTex, roughnessMap: specTex,
      bumpMap: bumpTex, bumpScale: 0.4,
      metalness: 1.0, roughness: 1.0, envMapIntensity: 1.0,
    });
    const edgeMat = mat(0x151009, 0.0, 0.85);   // FR-4 core edge
    const board = new THREE.Mesh(new THREE.BoxGeometry(BOARD_W, BOARD_T, BOARD_D), [edgeMat,edgeMat,boardMat,edgeMat,edgeMat,edgeMat]);
    // BoxGeometry material index 2 = +Y (top). good.
    scene.add(board);

    scatterParts(scene);

    // hero trace curve (3D) for camera + probe
    const curvePts = TRACE_PTS.map(p => new THREE.Vector3(p[0], TOP + 0.05, p[1]));
    const curve = new THREE.CatmullRomCurve3(curvePts, false, "catmullrom", 0.5);

    /* ──────────────────────────────────────────────────────────────
       SHARED VOID + EMERGENCE
       The board is not a separate scene — it's the universe's signal
       field resolved into a circuit. Two particle systems sell that:
         · starfield  — the same teal void the universe drifts through,
                        so the board floats in shared space (not a room).
         · assembly   — teal particles that fly IN from the field and
                        CONVERGE onto the hero trace + pads, then settle
                        (fade) as the board itself inks into being.
       Both are teal points on black — visually continuous with the
       universe's particles across the WebGL-context seam. Driven by
       `introMix` (1 = just arriving from the field → 0 = fully formed).
       ────────────────────────────────────────────────────────────── */
    // — starfield: large, slow, same signal cyan as the universe —
    const STAR_N = 380;
    const starGeo2 = new THREE.BufferGeometry();
    const starPos2 = new Float32Array(STAR_N * 3);
    for (let i = 0; i < STAR_N; i++) {
      // shell around the board, kept out of the immediate board volume
      const r = 80 + Math.random() * 260;
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      starPos2[i*3+0] = Math.sin(ph) * Math.cos(th) * r;
      starPos2[i*3+1] = Math.abs(Math.cos(ph) * r) * 0.5 + 8;   // bias above the slab
      starPos2[i*3+2] = Math.sin(ph) * Math.sin(th) * r;
    }
    starGeo2.setAttribute("position", new THREE.BufferAttribute(starPos2, 3));
    const starField2 = new THREE.Points(starGeo2, new THREE.PointsMaterial({
      color: 0x00f0c8, size: 0.9, sizeAttenuation: true,
      transparent: true, opacity: 0.5, depthWrite: false,
    }));
    scene.add(starField2);

    // — assembly cloud: particles that converge onto the circuit —
    const ASM_N = 620;
    const asmGeo2  = new THREE.BufferGeometry();
    const asmPos2  = new Float32Array(ASM_N * 3);   // rendered
    const asmTar2  = new Float32Array(ASM_N * 3);   // settled-on-board target
    const asmSca2  = new Float32Array(ASM_N * 3);   // far scatter origin (in the field)
    const _tp = new THREE.Vector3();
    for (let i = 0; i < ASM_N; i++) {
      // target: 70% strung along the hero trace, 30% clustered on stop pads
      if (Math.random() < 0.7) {
        curve.getPointAt(Math.random(), _tp);
        asmTar2[i*3+0] = _tp.x + (Math.random() - 0.5) * 5;
        asmTar2[i*3+1] = TOP + 0.4 + Math.random() * 2.2;
        asmTar2[i*3+2] = _tp.z + (Math.random() - 0.5) * 5;
      } else {
        const st = STOPS[(Math.random() * STOPS.length) | 0];
        const [px, pz] = TRACE_PTS[st.p];
        const a = Math.random() * Math.PI * 2, rr = Math.random() * 7;
        asmTar2[i*3+0] = px + Math.cos(a) * rr;
        asmTar2[i*3+1] = TOP + 0.5 + Math.random() * 2.5;
        asmTar2[i*3+2] = pz + Math.sin(a) * rr;
      }
      // scatter origin: far out in the field, biased up & toward the camera
      // so they appear to stream in from the universe we just left.
      asmSca2[i*3+0] = asmTar2[i*3+0] + (Math.random() - 0.5) * 180;
      asmSca2[i*3+1] = asmTar2[i*3+1] + 40 + Math.random() * 120;
      asmSca2[i*3+2] = asmTar2[i*3+2] + 30 + Math.random() * 160;
      // start rendered at scatter
      asmPos2[i*3+0] = asmSca2[i*3+0];
      asmPos2[i*3+1] = asmSca2[i*3+1];
      asmPos2[i*3+2] = asmSca2[i*3+2];
    }
    asmGeo2.setAttribute("position", new THREE.BufferAttribute(asmPos2, 3));
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
        // REAL Wafer — the actual keyboard, part by part, floating above U1
        deviceGroup = new THREE.Group();
        deviceGroup.position.set(px, TOP + 4.6, pz);
        deviceGroup.visible = false;
        scene.add(deviceGroup);
        buildWaferReal(deviceGroup);
      }
    });

    // Materials that "ink in" as the board forms (everything solid except the
    // particle clouds, which are Points and skipped by the isMesh test). The
    // device-explosion stack manages its own opacity near its stop — but that
    // happens long after the intro, so there's no conflict.
    const formMats = [];
    scene.traverse((o) => {
      if (o.isMesh && o.material) {
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        mats.forEach((m) => { if (!formMats.includes(m)) formMats.push(m); });
      }
    });
    let formMatsTransparent = false;

    // post-processing (DOF) — guarded; skipped entirely in LITE (it is the
    // single most expensive per-frame cost and what stalled the inline flight).
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

    // hero framing for the FOOTER beat — whole board, pulled back & above
    const HERO_POS = new THREE.Vector3(), HERO_LOOK = new THREE.Vector3();
    // NODE framing — the whole board seen as a small clean 3/4 "model" (the
    // state it sits in inside the About node-card before the window opens).
    // The morph dollies FROM this pose INTO the flight start as nodeMix 1→0.
    const NODE_POS = new THREE.Vector3(), NODE_LOOK = new THREE.Vector3();
    const tmpFinalPos = new THREE.Vector3(), tmpFinalLook = new THREE.Vector3();

    function update(t, mode, dt, footerMix, introMix, nodeMix) {
      t = Math.max(0, Math.min(1, t));
      footerMix = Math.max(0, Math.min(1, footerMix || 0));
      introMix = Math.max(0, Math.min(1, introMix || 0));
      nodeMix = Math.max(0, Math.min(1, nodeMix || 0));
      const ease = 1 - Math.pow(0.0015, dt / 1000);
      const nowMs = performance.now();

      // active stop index (nearest)
      let active = 0, best = 1e9;
      STOPS.forEach((s, i) => { const d = Math.abs(t - stopTForIndex(i)); if (d < best) { best = d; active = i; } });

      if (mode === "bench") {
        // inspect: board static, camera high & angled, target pans along curve
        curve.getPointAt(t, tmpLook);
        tmpPos.set(tmpLook.x + 6, 26, tmpLook.z + 26);
        camLook.copy(tmpLook);
      } else {
        // probe: fly above & alongside the trace, looking down-ahead so
        // components read as a passing landscape rather than head-on walls
        curve.getPointAt(t, tmpPos);
        curve.getTangentAt(t, tmpTan);
        tmpSide.copy(tmpTan).cross(UP).normalize();
        tmpPos.addScaledVector(tmpTan, -8).addScaledVector(tmpSide, 7);
        tmpPos.y += 12;                           // hover well above
        curve.getPointAt(Math.min(1, t + 0.05), tmpLook);
        tmpLook.y += 0.2;
        camLook.copy(tmpLook);
      }

      camPos.lerp(tmpPos, ease);
      curLook.lerp(camLook, ease);

      // Final camera = the smoothed probe pose, optionally blended toward the
      // hero footer pose using THROWAWAY vectors so the blend never feeds back
      // into camPos/curLook (that feedback caused the tremble).
      tmpFinalPos.copy(camPos);
      tmpFinalLook.copy(curLook);
      if (footerMix > 0) {
        const fe = footerMix < 0.5 ? 2*footerMix*footerMix : 1 - Math.pow(-2*footerMix+2, 2)/2;
        HERO_POS.set(-6 + Math.sin(nowMs * 0.00018) * 2, 50, 96);
        HERO_LOOK.set(0, -2, 2);
        tmpFinalPos.lerp(HERO_POS, fe);
        tmpFinalLook.lerp(HERO_LOOK, fe);
      }

      // ── INTRO/takeover establishing move: lift & pull the camera back as the
      //    board takes over (introMix 1 → 0 as you scroll the punch in). Scroll-
      //    driven via introMix, applied to throwaway vectors so it can't feed back. ──
      if (introMix > 0) {
        const ie = introMix < 0.5 ? 2*introMix*introMix : 1 - Math.pow(-2*introMix+2, 2)/2;
        tmpFinalPos.x -= 9 * ie;
        tmpFinalPos.y += 30 * ie;
        tmpFinalPos.z += 24 * ie;
      }

      camera.position.copy(tmpFinalPos);
      camera.lookAt(tmpFinalLook);

      // ── NODE framing: blend the whole camera toward a clean whole-board 3/4
      //    "model" pose. At nodeMix=1 the camera sits far back and above so the
      //    entire board reads as a small floating object in the card; as the
      //    window opens (nodeMix→0) it dollies smoothly into the flight pose. ──
      if (nodeMix > 0) {
        const ne = nodeMix < 0.5 ? 2*nodeMix*nodeMix : 1 - Math.pow(-2*nodeMix+2, 2)/2;
        const bob = Math.sin(nowMs * 0.0004) * 3;
        NODE_POS.set(38, 104 + bob, 150);
        NODE_LOOK.set(0, -4, 0);
        camera.position.lerpVectors(tmpFinalPos, NODE_POS, ne);
        tmpFinalLook.lerpVectors(curLook, NODE_LOOK, ne);
        camera.lookAt(tmpFinalLook);
      }
      // While the board floats as the node "model" (nodeMix high), hide the
      // scene's own starfield so the UNIVERSE reads cleanly behind it; fade it
      // back in as the board comes closer and takes over the screen.
      starField2.material.opacity = 0.5 * (1 - nodeMix);
      // Push fog back while the board is the far floating "model" so it isn't
      // darkened toward the fog colour (near-black); restore flight fog as it
      // comes closer. (Whole-board framing sits beyond the default far=150.)
      scene.fog.far = 150 + 260 * nodeMix;
      if (deviceGroup) {
        const dt2 = Math.abs(t - stopTForIndex(STOPS.findIndex(s => s.explode)));
        const ex = Math.max(0, 1 - dt2 * 9);    // 0..1 bubble around the stop
        deviceGroup.visible = ex > 0.02 && waferParts.length > 0;
        if (deviceGroup.visible) {
          const exs = ex < 0.5 ? 2*ex*ex : 1 - Math.pow(-2*ex+2, 2)/2;
          for (const w of waferParts) w.position.copy(w.userData.vec).multiplyScalar(exs);
          const op = Math.min(1, ex * 2.5);
          for (const m of waferMats) m.opacity = op;
          deviceGroup.rotation.y += dt * 0.0004;
        }
      }

      // ── EMERGENCE — the circuit resolves out of the signal field ──
      // Shared-void drift so the starfield reads like the universe we left.
      starField2.rotation.y += dt * 0.00002;
      const conv = 1 - introMix;                 // 0 = arriving from field → 1 = formed
      if (introMix > 0.001) {
        // particles stream in from the field and land on the trace/pads
        const ce = conv < 0.5 ? 2*conv*conv : 1 - Math.pow(-2*conv+2, 2)/2;
        const ap = assembly2.geometry.attributes.position.array;
        for (let i = 0; i < ASM_N * 3; i++) ap[i] = asmSca2[i] + (asmTar2[i] - asmSca2[i]) * ce;
        assembly2.geometry.attributes.position.needsUpdate = true;
        assembly2.material.opacity = Math.sin(Math.min(1, conv) * Math.PI) * 0.85;
        assembly2.material.size = 1.4 - conv * 0.5;
        // the board itself inks in as the particles land (solid by conv≈0.55)
        const fo = Math.min(1, conv / 0.55);
        const foe = fo < 0.5 ? 2*fo*fo : 1 - Math.pow(-2*fo+2, 2)/2;
        if (!formMatsTransparent) { formMats.forEach(m => { m.transparent = true; }); formMatsTransparent = true; }
        formMats.forEach(m => { m.opacity = foe; });
        starField2.material.opacity = 0.18 + conv * 0.32;
      } else if (formMatsTransparent) {
        // fully formed — restore opaque rendering and retire the cloud
        formMats.forEach(m => { m.opacity = 1; m.transparent = false; });
        assembly2.material.opacity = 0;
        starField2.material.opacity = 0.5;
        formMatsTransparent = false;
      }

      // DOF focus on the active stop / look point
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
      renderer.dispose();
      colorTex.dispose(); specTex.dispose(); bumpTex.dispose();
      starGeo2.dispose(); starField2.material.dispose();
      asmGeo2.dispose(); assembly2.material.dispose();
      try { mount.removeChild(renderer.domElement); } catch (_) {}
    }

    return { update, render, setSize, dispose, stops: STOPS, domElement: renderer.domElement };
  }

  window.MOBoard = { build, STOPS };
})();
