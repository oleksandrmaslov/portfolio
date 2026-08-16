/* ============================================================
   M.O. SYSTEM — ISKRA 3D · BOARD BUILD  (node 0x09)
   ------------------------------------------------------------
   makeSilkTexture(spec) — high-res canvas: soldermask, copper
   pour + traces, gold pads, mounting holes, then a SILK layer
   (ref designators, pin labels, the product/part title block)
   eroded by `wear` so the small part number is only legible
   once the operator zooms in.

   buildBoard(spec) — the 3D PCB: substrate (disc / slab), the
   silk surface, and every component from the layout. LEDs/lenses
   collect into userData.glows so the bench can power them on
   during the assembly reward.
   ============================================================ */
(function () {
  const PCB = window.IskraPCB, P = window.IskraParts;
  const FACT = {
    soic: P.soic, quad: P.quad, passive: P.passive, led: P.led, dome: P.dome,
    button: P.button, header: P.header, usbC: P.usbC, usbMicro: P.usbMicro,
    can: P.can, elec: P.elec, jst: P.jst, module: P.module,
  };

  /* board-units → canvas px. board centre = canvas centre. z+ = down. */
  function projector(bw, bh, W, H) {
    return (x, z) => [W / 2 + x / bw * W, H / 2 + z / bh * H];
  }

  /* ---------------- silkscreen + mask canvas ---------------- */
  function makeSilkTexture(spec) {
    const L = PCB.generateLayout(spec);
    const bp = L.bp;
    const M = PCB.MASKS[L.maskKey] || PCB.MASKS.green;
    const round = bp.shape === "round";
    const bw = round ? bp.size.r * 2 : bp.size.w;
    const bh = round ? bp.size.r * 2 : bp.size.d;
    const LONG = 1600;
    const ppu = LONG / Math.max(bw, bh);
    const W = Math.round(bw * ppu), H = Math.round(bh * ppu);
    const wear = Math.max(0, Math.min(1, spec.wear != null ? spec.wear : 0.4));
    const cv = document.createElement("canvas");
    cv.width = W; cv.height = H;
    const ctx = cv.getContext("2d");
    const px = projector(bw, bh, W, H);
    const u = ppu; // px per board-unit
    const rng = P.mulberry32(spec.seed ^ 0x9e3779b9);

    /* --- soldermask base --- */
    ctx.fillStyle = M.mask;
    ctx.fillRect(0, 0, W, H);
    // subtle mask mottle / fiber
    for (let i = 0; i < 1400; i++) {
      ctx.fillStyle = `rgba(255,255,255,${rng() * 0.018})`;
      ctx.fillRect(rng() * W, rng() * H, 1.5, 1.5);
    }
    // soft vignette toward edge
    const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.2, W / 2, H / 2, Math.max(W, H) * 0.62);
    vg.addColorStop(0, "rgba(0,0,0,0)");
    vg.addColorStop(1, "rgba(0,0,0,0.28)");
    ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);

    /* --- copper pour hint + ground hatch --- */
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = M.copper;
    ctx.lineWidth = Math.max(1, u * 0.012);
    for (let gx = -bw / 2; gx < bw / 2; gx += 0.12) {
      const [x0, y0] = px(gx, -bh / 2), [x1, y1] = px(gx + bh, bh / 2);
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    }
    ctx.restore();

    /* --- routed traces --- */
    ctx.strokeStyle = M.copper;
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    (L.traces || []).forEach((tr) => {
      ctx.lineWidth = Math.max(2, (tr[tr.length - 1] && tr[tr.length - 1][2] ? 0.04 : 0.03) * u);
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      tr.forEach((pt, i) => { const [X, Y] = px(pt[0], pt[1]); i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); });
      ctx.stroke();
    });
    ctx.globalAlpha = 1;

    /* --- ESP antenna meander --- */
    if (L.meander) {
      const m = L.meander; const [cx, cy] = px(m.x, m.z);
      const ww = m.w * u, hh = m.d * u;
      ctx.strokeStyle = M.copper; ctx.lineWidth = Math.max(2, 0.02 * u);
      ctx.beginPath();
      const segs = 9;
      for (let i = 0; i <= segs; i++) {
        const xx = cx - ww / 2 + (ww / segs) * i;
        const yy = cy + (i % 2 ? hh / 2 : -hh / 2);
        i ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy);
        if (i < segs) ctx.lineTo(cx - ww / 2 + (ww / segs) * (i + 0.5), yy);
      }
      ctx.stroke();
    }

    /* --- gold pads (SWD / castellated) --- */
    (L.pads || []).forEach((pad) => {
      const [X, Y] = px(pad.x, pad.z);
      const r = pad.r * u;
      const g = ctx.createRadialGradient(X - r * 0.3, Y - r * 0.3, r * 0.1, X, Y, r);
      g.addColorStop(0, "#e9cf86"); g.addColorStop(1, "#9a7d34");
      ctx.fillStyle = g;
      if (pad.cast) { ctx.fillRect(X - r * 0.8, Y - r, r * 1.6, r * 2); }
      else { ctx.beginPath(); ctx.arc(X, Y, r, 0, 7); ctx.fill(); }
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.beginPath(); ctx.arc(X, Y, r * 0.34, 0, 7); ctx.fill();
    });

    /* --- mounting holes --- */
    (L.holes || []).forEach((h) => {
      const [X, Y] = px(h.x, h.z);
      const r = h.r * u;
      ctx.fillStyle = "#e7cf8a";
      ctx.beginPath(); ctx.arc(X, Y, r * 1.35, 0, 7); ctx.fill();
      ctx.fillStyle = "#05070b";
      ctx.beginPath(); ctx.arc(X, Y, r * 0.78, 0, 7); ctx.fill();
    });

    /* --- SILKSCREEN layer (the readable stuff, gets worn) --- */
    ctx.save();
    const silk = M.silk;
    ctx.fillStyle = silk; ctx.strokeStyle = silk;
    ctx.textAlign = "center"; ctx.textBaseline = "middle";

    // component outlines (boxes) so silk reads like a real board
    ctx.lineWidth = Math.max(1, 0.01 * u);
    ctx.globalAlpha = 0.62;
    (L.comps || []).forEach((c) => {
      if (["led", "passive"].includes(c.type) && rng() > 0.5) return;
      const f = footprintFor(c);
      if (!f) return;
      const [X, Y] = px(c.x, c.z);
      ctx.save(); ctx.translate(X, Y); ctx.rotate(c.rot || 0);
      ctx.strokeRect(-f.w * u / 2, -f.d * u / 2, f.w * u, f.d * u);
      ctx.restore();
    });
    ctx.globalAlpha = 1;

    // ref designators
    (L.comps || []).forEach((c) => {
      if (!c.ref) return;
      const [X, Y] = px(c.x, c.z);
      const f = footprintFor(c) || { d: 0.1 };
      const fs = Math.max(8, 0.05 * u);
      ctx.font = `${fs}px "DM Mono", ui-monospace, monospace`;
      ctx.globalAlpha = 0.85;
      ctx.fillText(c.ref, X, Y - (f.d * u / 2) - fs * 0.7);
    });

    // free silk labels + pin names
    (L.texts || []).forEach((t) => {
      const [X, Y] = px(t.x, t.z);
      const fs = Math.max(7, (t.size || 0.04) * u);
      ctx.font = `${fs}px "DM Mono", ui-monospace, monospace`;
      ctx.globalAlpha = 0.8;
      ctx.save(); ctx.translate(X, Y); if (t.rot) ctx.rotate(t.rot);
      ctx.fillText(t.text, 0, 0); ctx.restore();
    });

    // pad labels
    (L.pads || []).forEach((pad) => {
      if (!pad.label) return;
      const [X, Y] = px(pad.x, pad.z);
      const fs = Math.max(7, 0.034 * u);
      ctx.font = `${fs}px "DM Mono", ui-monospace, monospace`;
      ctx.globalAlpha = 0.75;
      ctx.fillText(pad.label, X, Y + pad.r * u + fs * 0.7);
    });

    // marks (logos / family hints on decoys)
    (L.marks || []).forEach((mk) => {
      const [X, Y] = px(mk.x, mk.z);
      const fs = Math.max(9, (mk.size || 0.05) * u);
      ctx.font = `700 ${fs}px "DM Mono", ui-monospace, monospace`;
      ctx.globalAlpha = 0.9;
      ctx.fillText(mk.text, X, Y);
    });

    // TITLE BLOCK — product name + the small PART NUMBER (the answer)
    const tb = L.title;
    if (tb && !tb.hidden) {
      const [X, Y] = px(tb.x, tb.z);
      ctx.textAlign = tb.align === "left" ? "left" : "center";
      const ax = tb.align === "left" ? X - 0 : X;
      // product name — biggish
      const nameFs = Math.max(12, 0.075 * u);
      ctx.font = `700 ${nameFs}px "Space Grotesk", "DM Mono", sans-serif`;
      ctx.globalAlpha = 0.95;
      ctx.fillText(tb.name, ax, Y);
      // PART NUMBER — small + tight: must zoom to read
      const pnFs = Math.max(8, 0.044 * u);
      ctx.font = `${pnFs}px "DM Mono", ui-monospace, monospace`;
      ctx.globalAlpha = 0.78;
      ctx.fillText(tb.part, ax, Y + nameFs * 0.92);
      // sub + rev
      const subFs = Math.max(7, 0.034 * u);
      ctx.font = `${subFs}px "DM Mono", ui-monospace, monospace`;
      ctx.globalAlpha = 0.62;
      ctx.fillText(`${tb.sub}   REV ${tb.rev}`, ax, Y + nameFs * 0.92 + pnFs * 0.95);
    }
    ctx.restore();

    /* --- WEAR — erode the silk so reading needs zoom/rotation --- */
    applyWear(ctx, W, H, wear, rng, px, L);

    /* --- silk edge ring / board outline highlight --- */
    ctx.globalAlpha = 1;

    const tex = { canvas: cv, W, H, bw, bh, ppu };
    return tex;
  }

  function footprintFor(c) {
    const o = c.opts || {};
    switch (c.type) {
      case "soic": return { w: (o.len || 0.2) + 0.05, d: (o.wid || 0.12) + 0.04 };
      case "quad": return { w: (o.size || 0.34) + 0.07, d: (o.size || 0.34) + 0.07 };
      case "passive": return { w: (o.w || 0.05) + 0.02, d: (o.d || 0.03) + 0.015 };
      case "led": return { w: (o.size || 0.07) + 0.02, d: (o.size || 0.07) + 0.02 };
      case "dome": return { w: (o.r || 0.09) * 2.3, d: (o.r || 0.09) * 2.3 };
      case "button": return { w: (o.size || 0.17) + 0.02, d: (o.size || 0.17) + 0.02 };
      case "header": return { w: (o.rows || 20) * (o.pitch || 0.085), d: (o.cols || 1) * (o.pitch || 0.085) + 0.02 };
      case "usbC": return { w: 0.32, d: 0.19 };
      case "usbMicro": return { w: 0.24, d: 0.16 };
      case "can": return { w: (o.w || 0.2) + 0.03, d: (o.d || 0.12) + 0.03 };
      case "elec": return { w: (o.r || 0.1) * 2.2, d: (o.r || 0.1) * 2.2 };
      case "jst": return { w: (o.pins || 2) * 0.07 + 0.07, d: 0.15 };
      case "module": return { w: (o.w || 0.7) + 0.04, d: (o.d || 0.5) + 0.04 };
      default: return null;
    }
  }

  /* erosion: scratches, scuff blobs, flux haze, ghost-out silk */
  function applyWear(ctx, W, H, wear, rng, px, L) {
    if (wear <= 0.001) return;
    // overall silk fade (knocks contrast down globally)
    ctx.save();
    ctx.globalCompositeOperation = "destination-out";
    // patchy erase blobs
    const blobs = Math.floor(40 + wear * 240);
    for (let i = 0; i < blobs; i++) {
      const r = (4 + rng() * 26) * (0.5 + wear);
      const a = (0.05 + rng() * 0.4) * wear;
      ctx.globalAlpha = a;
      ctx.beginPath(); ctx.arc(rng() * W, rng() * H, r, 0, 7); ctx.fill();
    }
    // thin scratches
    ctx.lineCap = "round";
    const scr = Math.floor(wear * 60);
    for (let i = 0; i < scr; i++) {
      ctx.globalAlpha = (0.15 + rng() * 0.5) * wear;
      ctx.lineWidth = 1 + rng() * 2.5;
      const x = rng() * W, y = rng() * H, ln = 10 + rng() * 90, ang = rng() * 7;
      ctx.beginPath(); ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(ang) * ln, y + Math.sin(ang) * ln); ctx.stroke();
    }
    ctx.restore();

    // flux / oxidation haze (additive warm grime)
    ctx.save();
    ctx.globalCompositeOperation = "source-over";
    const haze = Math.floor(wear * 90);
    for (let i = 0; i < haze; i++) {
      const r = 18 + rng() * 70;
      const x = rng() * W, y = rng() * H;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      const tint = rng() > 0.5 ? "180,150,90" : "120,90,60";
      g.addColorStop(0, `rgba(${tint},${0.04 * wear})`);
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
    }
    ctx.restore();
  }

  /* ---------------- 3D board ---------------- */
  function buildBoard(spec, THREE) {
    const L = PCB.generateLayout(spec);
    const bp = L.bp;
    const round = bp.shape === "round";
    const th = bp.thickness || 0.08;
    const M = PCB.MASKS[L.maskKey] || PCB.MASKS.green;

    const root = new THREE.Group();
    root.name = "board:" + spec.id;
    const glows = [];

    // silk texture
    const tex = makeSilkTexture(spec);
    const map = new THREE.CanvasTexture(tex.canvas);
    map.anisotropy = 8;
    map.colorSpace = THREE.SRGBColorSpace || undefined;
    map.needsUpdate = true;

    // edge (FR4) material
    const edgeMat = new THREE.MeshStandardMaterial({ color: M.edge, roughness: 0.85, metalness: 0.05 });
    const topMat = new THREE.MeshStandardMaterial({ map, roughness: 0.62, metalness: 0.12 });
    const botMat = new THREE.MeshStandardMaterial({ color: M.mask, roughness: 0.7, metalness: 0.1 });

    let substrate, bw, bh;
    if (round) {
      const r = bp.size.r;
      bw = bh = r * 2;
      const geo = new THREE.CylinderGeometry(r, r, th, 96);
      substrate = new THREE.Mesh(geo, [edgeMat, topMat, botMat]);
      // CylinderGeometry materials: [side, top, bottom]
    } else {
      bw = bp.size.w; bh = bp.size.d;
      const geo = new THREE.BoxGeometry(bw, th, bh);
      // Box face order: +x,-x,+y(top),-y(bottom),+z,-z
      substrate = new THREE.Mesh(geo, [edgeMat, edgeMat, topMat, botMat, edgeMat, edgeMat]);
      // round the look with a thin bevel rim
    }
    substrate.castShadow = true; substrate.receiveShadow = true;
    substrate.name = "substrate";
    root.add(substrate);

    // top surface y
    const topY = th / 2;

    // place components
    (L.comps || []).forEach((c) => {
      const f = FACT[c.type];
      if (!f) return;
      const g = f(THREE, c.opts || {});
      g.position.set(c.x, topY, c.z);
      g.rotation.y = c.rot || 0;
      g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
      // collect glows
      g.traverse((o) => { if (o.userData && o.userData.glow) glows.push(o.userData.glow); });
      if (g.userData.glow) glows.push(g.userData.glow);
      g.userData.ref = c.ref;
      root.add(g);
    });

    // normalize: centre already at origin; scale so longest side ~ target
    root.userData = {
      spec, layout: L, glows, bw, bh, round, thickness: th,
      radius: round ? bp.size.r : Math.hypot(bw, bh) / 2,
      map,
    };
    return root;
  }

  /* power LEDs on/off (assembly reward) — level 0..1 */
  function setGlow(board, level) {
    const glows = board.userData.glows || [];
    glows.forEach((g) => {
      g.mat.emissiveIntensity = (g.peak || 1.2) * level;
      g.mat.needsUpdate = true;
    });
  }

  window.IskraBoard = { buildBoard, makeSilkTexture, setGlow };
})();
