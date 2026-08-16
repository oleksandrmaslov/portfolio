/* ============================================================
   M.O. SYSTEM — Landing v3 · About node mini-PCB
   ------------------------------------------------------------
   A small printed-circuit board that floats on the ABOUT (0x00)
   node in the universe — same visual language as the full About
   board (window.MOBoard): matte black solder-mask, an exposed-
   copper hero trace, ENIG gold pads, white silkscreen. Clicking
   the node transitions into the full board scene, so the little
   board you see in the universe IS the board that comes closer.

   Exposes window.makeAboutPCBMesh(THREE) → THREE.Group sized so
   its longest edge ≈ 2 world units (matches the GLB overlays the
   universe loads for other nodes, so the existing model-overlay
   frame logic drives it unchanged).
   ============================================================ */
(function () {
  // hero trace polyline in texture space (normalised 0..1, x then y)
  const TRACE = [
    [0.04, 0.55], [0.16, 0.52], [0.28, 0.66], [0.40, 0.40],
    [0.54, 0.58], [0.66, 0.36], [0.78, 0.60], [0.90, 0.46], [0.97, 0.48],
  ];

  function smooth(ctx, pts) {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length - 1; i++) {
      const xc = (pts[i][0] + pts[i + 1][0]) / 2;
      const yc = (pts[i][1] + pts[i + 1][1]) / 2;
      ctx.quadraticCurveTo(pts[i][0], pts[i][1], xc, yc);
    }
    ctx.lineTo(pts[pts.length - 1][0], pts[pts.length - 1][1]);
  }

  function makeAboutPCBTexture(THREE) {
    const W = 1024, H = 384;
    const c = document.createElement("canvas");
    c.width = W; c.height = H;
    const x = c.getContext("2d");

    // solder mask — matte near-black with faint centre tone
    x.fillStyle = "#0a0c11"; x.fillRect(0, 0, W, H);
    const g = x.createRadialGradient(W * 0.5, H * 0.5, 0, W * 0.5, H * 0.5, W * 0.55);
    g.addColorStop(0, "rgba(26,32,46,0.5)"); g.addColorStop(1, "rgba(0,0,0,0)");
    x.fillStyle = g; x.fillRect(0, 0, W, H);

    // copper pour hatch
    x.strokeStyle = "rgba(40,52,70,0.12)"; x.lineWidth = 1;
    for (let i = -H; i < W; i += 14) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i + H, H); x.stroke(); }

    // ground-fill border ring
    x.strokeStyle = "rgba(120,150,190,0.12)"; x.lineWidth = 5;
    x.strokeRect(14, 14, W - 28, H - 28);

    const pts = TRACE.map(p => [p[0] * W, p[1] * H]);

    // faint tributary traces
    x.lineCap = "round"; x.lineJoin = "round";
    x.strokeStyle = "rgba(150,170,200,0.08)"; x.lineWidth = 4;
    for (let s = 1; s < pts.length - 1; s += 2) {
      x.beginPath(); x.moveTo(pts[s][0], pts[s][1]);
      x.lineTo(pts[s][0] + (s % 2 ? 60 : -60), pts[s][1] + (s % 3 - 1) * 90); x.stroke();
    }

    // HERO trace — exposed copper ribbon
    smooth(x, pts); x.strokeStyle = "#05060a"; x.lineWidth = 26; x.stroke();   // mask reveal margin
    const cop = x.createLinearGradient(0, 0, W, 0);
    cop.addColorStop(0, "#7a4a24"); cop.addColorStop(0.5, "#c98a4e"); cop.addColorStop(1, "#9a6232");
    smooth(x, pts); x.strokeStyle = cop; x.lineWidth = 17; x.stroke();
    smooth(x, pts); x.strokeStyle = "rgba(255,224,184,0.55)"; x.lineWidth = 4; x.stroke();

    // ENIG gold pads + vias at a few trace nodes
    const padAt = [1, 3, 5, 7];
    padAt.forEach((i) => {
      const [u, v] = pts[i];
      for (let k = 0; k < 6; k++) {
        const a = k / 6 * Math.PI * 2;
        const pu = u + Math.cos(a) * 26, pv = v + Math.sin(a) * 26;
        x.fillStyle = "#d9b35e"; x.beginPath(); x.ellipse(pu, pv, 7, 7, 0, 0, Math.PI * 2); x.fill();
        x.fillStyle = "#05060a"; x.beginPath(); x.ellipse(pu, pv, 2.4, 2.4, 0, 0, Math.PI * 2); x.fill();
      }
    });
    // scattered SMD pads + vias for density
    for (let i = 0; i < 70; i++) {
      const rx = 40 + Math.random() * (W - 80), ry = 40 + Math.random() * (H - 80);
      x.fillStyle = "#caa552"; x.fillRect(rx, ry, 6, 4); x.fillRect(rx + 12, ry, 6, 4);
    }
    for (let i = 0; i < 60; i++) {
      const rx = 40 + Math.random() * (W - 80), ry = 40 + Math.random() * (H - 80);
      x.fillStyle = "#b89048"; x.beginPath(); x.arc(rx, ry, 3, 0, Math.PI * 2); x.fill();
      x.fillStyle = "#06070b"; x.beginPath(); x.arc(rx, ry, 1.2, 0, Math.PI * 2); x.fill();
    }

    // silkscreen identity
    x.fillStyle = "#e6e8ee"; x.textBaseline = "top";
    x.font = "700 30px 'Geist Mono', monospace"; x.textAlign = "left";
    x.fillText("MASLOV / OLEKSANDR", 34, 30);
    x.fillStyle = "#9aa3b3"; x.font = "500 19px 'Geist Mono', monospace";
    x.fillText("ABOUT · NODE 0x00", 34, 66);
    x.fillStyle = "#5b6478"; x.textAlign = "right"; x.textBaseline = "bottom";
    x.font = "500 19px 'Geist Mono', monospace";
    x.fillText("// trace the net", W - 34, H - 30);
    x.textAlign = "left";
    x.fillText("REV A · MÜNCHEN 2026", 34, H - 30);

    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    tex.needsUpdate = true;
    return tex;
  }

  // A thin slab (3:1 like the real board) with the PCB texture on top.
  window.makeAboutPCBMesh = function (THREE) {
    const grp = new THREE.Group();
    const topTex = makeAboutPCBTexture(THREE);

    const Wd = 2.0, Th = 0.08, Dp = Wd * (384 / 1024); // 3:1 board
    const top  = new THREE.MeshBasicMaterial({ map: topTex, transparent: true, opacity: 1, depthWrite: true });
    const edge = new THREE.MeshBasicMaterial({ color: 0x0a1a14, transparent: true, opacity: 1, depthWrite: true });
    // BoxGeometry face order: +x,-x,+y,-y,+z,-z → index 2 is the top (+Y)
    const board = new THREE.Mesh(
      new THREE.BoxGeometry(Wd, Th, Dp),
      [edge, edge, top, edge, edge, edge]
    );
    grp.add(board);

    // a couple of tiny gold components for parallax life
    const gold = new THREE.MeshBasicMaterial({ color: 0xd9b35e, transparent: true, opacity: 1 });
    [[-0.5, 0.18], [0.55, -0.12]].forEach(([cx, cz]) => {
      const chip = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.08, 0.16), gold);
      chip.position.set(cx, Th / 2 + 0.04, cz);
      grp.add(chip);
    });

    // rest pose — tilt so the copper face angles toward the viewer; the
    // universe model-overlay loop adds a gentle yaw drift on top of this.
    grp.rotation.set(-1.02, 0.0, 0.08);
    return grp;
  };
})();
