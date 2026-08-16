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

  function drawColor(W, H) {
    const c = document.createElement("canvas"); c.width = W; c.height = H;
    const x = c.getContext("2d");
    // solder mask — matte near-black with faint tonal variation
    x.fillStyle = "#0a0c11"; x.fillRect(0, 0, W, H);
    const g = x.createRadialGradient(W*0.5, H*0.5, 0, W*0.5, H*0.5, W*0.6);
    g.addColorStop(0, "rgba(26,32,46,0.5)"); g.addColorStop(1, "rgba(0,0,0,0)");
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    // copper pour hatch (very subtle, under mask)
    x.strokeStyle = "rgba(40,52,70,0.10)"; x.lineWidth = 1;
    for (let i = -H; i < W; i += 12) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i + H, H); x.stroke(); }
    // ground-fill border ring
    x.strokeStyle = "rgba(120,150,190,0.10)"; x.lineWidth = 6;
    x.strokeRect(18, 18, W - 36, H - 36);

    const traceUV = TRACE_PTS.map(p => uv(p[0], p[1], W, H));

    // ---- tributary traces (faint, under mask) ----
    x.lineCap = "round"; x.lineJoin = "round";
    x.strokeStyle = "rgba(150,170,200,0.07)"; x.lineWidth = 5;
    for (let s = 0; s < 7; s++) {
      const base = traceUV[1 + s];
      if (!base) continue;
      x.beginPath();
      x.moveTo(base[0], base[1]);
      x.lineTo(base[0] + (s % 2 ? 70 : -70), base[1] + (s % 3 - 1) * 110);
      x.stroke();
    }

    // ---- HERO trace — exposed copper ribbon ----
    smoothPath(x, traceUV);
    x.strokeStyle = "#05060a"; x.lineWidth = 30; x.stroke();           // mask reveal margin (dark)
    const cop = x.createLinearGradient(0, 0, W, 0);
    cop.addColorStop(0, "#7a4a24"); cop.addColorStop(0.5, "#c98a4e"); cop.addColorStop(1, "#9a6232");
    smoothPath(x, traceUV); x.strokeStyle = cop; x.lineWidth = 20; x.stroke();
    smoothPath(x, traceUV); x.strokeStyle = "rgba(255,224,184,0.55)"; x.lineWidth = 5; x.stroke();  // highlight

    // ---- pads / vias / silkscreen per stop ----
    x.textBaseline = "middle";
    STOPS.forEach((st) => {
      const [px, pz] = TRACE_PTS[st.p];
      const [u, v] = uv(px, pz, W, H);
      // ENIG gold pad cluster
      for (let i = 0; i < 6; i++) {
        const ang = i / 6 * Math.PI * 2;
        const pu = u + Math.cos(ang) * 34, pv = v + Math.sin(ang) * 34;
        x.fillStyle = "#d9b35e"; x.beginPath(); x.ellipse(pu, pv, 9, 9, 0, 0, Math.PI*2); x.fill();
        x.fillStyle = "#05060a"; x.beginPath(); x.ellipse(pu, pv, 3, 3, 0, 0, Math.PI*2); x.fill();
      }
      // fiducial + ref silkscreen
      x.fillStyle = "#e6e8ee"; x.font = "700 26px 'Geist Mono', monospace"; x.textAlign = "center";
      x.fillText(st.ref.split(" · ")[0], u, v - 58);
      x.fillStyle = "#9aa3b3"; x.font = "500 18px 'Geist Mono', monospace";
      x.fillText(st.ref.split(" · ")[1] || "", u, v + 62);
      // pin-1 marker
      x.fillStyle = "#e6e8ee"; x.beginPath(); x.arc(u - 40, v - 40, 4, 0, Math.PI*2); x.fill();
    });

    // scattered SMD pads for density
    for (let i = 0; i < 120; i++) {
      const rx = 60 + Math.random() * (W - 120), ry = 60 + Math.random() * (H - 120);
      x.fillStyle = "#caa552"; x.fillRect(rx, ry, 7 + Math.random()*6, 5);
      x.fillRect(rx + 16, ry, 7 + Math.random()*6, 5);
    }
    // random vias
    for (let i = 0; i < 90; i++) {
      const rx = 50 + Math.random()*(W-100), ry = 50 + Math.random()*(H-100);
      x.fillStyle = "#b89048"; x.beginPath(); x.arc(rx, ry, 4, 0, Math.PI*2); x.fill();
      x.fillStyle = "#06070b"; x.beginPath(); x.arc(rx, ry, 1.6, 0, Math.PI*2); x.fill();
    }

    // board silkscreen identity
    x.fillStyle = "#5b6478"; x.font = "600 30px 'Geist Mono', monospace"; x.textAlign = "left";
    x.fillText("MASLOV / OLEKSANDR", 44, 52);
    x.font = "500 20px 'Geist Mono', monospace";
    x.fillText("ABOUT · REV A · MÜNCHEN 2026", 44, H - 44);
    x.textAlign = "right";
    x.fillText("// trace the net", W - 44, H - 44);

    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8; tex.needsUpdate = true;
    return tex;
  }

  function drawSpec(W, H) {
    // R unused · G = roughness · B = metalness
    const c = document.createElement("canvas"); c.width = W; c.height = H;
    const x = c.getContext("2d");
    x.fillStyle = "rgb(0,180,0)"; x.fillRect(0, 0, W, H);     // mask: rough, non-metal
    const traceUV = TRACE_PTS.map(p => uv(p[0], p[1], W, H));
    x.lineCap = "round"; x.lineJoin = "round";
    // hero trace metallic + smooth
    smoothPath(x, traceUV); x.strokeStyle = "rgb(0,70,255)"; x.lineWidth = 20; x.stroke();
    // pads metallic
    STOPS.forEach((st) => {
      const [px, pz] = TRACE_PTS[st.p]; const [u, v] = uv(px, pz, W, H);
      for (let i = 0; i < 6; i++) { const a = i/6*Math.PI*2; x.fillStyle="rgb(0,60,255)"; x.beginPath(); x.ellipse(u+Math.cos(a)*34, v+Math.sin(a)*34, 9,9,0,0,Math.PI*2); x.fill(); }
    });
    for (let i = 0; i < 120; i++) { const rx=60+Math.random()*(W-120), ry=60+Math.random()*(H-120); x.fillStyle="rgb(0,70,235)"; x.fillRect(rx,ry,7,5); x.fillRect(rx+16,ry,7,5); }
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

  // tiny scatter parts for density
  function scatterParts(group) {
    const caps = mat(0x9a6a3a, 0.6, 0.45);
    const res  = mat(0x0c0e13, 0.1, 0.6);
    for (let i = 0; i < 60; i++) {
      const x = (Math.random()-0.5)*(BOARD_W-16), z = (Math.random()-0.5)*(BOARD_D-12);
      // keep clear of hero trace-ish center band sometimes; ok to overlap lightly
      const k = Math.random();
      let m;
      if (k < 0.5) { m = new THREE.Mesh(new THREE.BoxGeometry(1.2,0.8,2.2), res); }
      else if (k < 0.8) { m = new THREE.Mesh(new THREE.CapsuleGeometry(0.6,1.4,4,8), caps); m.rotation.z=Math.PI/2; }
      else { m = new THREE.Mesh(new THREE.BoxGeometry(1.6,1.0,1.6), mat(0xd9b35e,1,0.35)); }
      m.position.set(x, 0.5+TOP, z);
      m.rotation.y = Math.random()*Math.PI;
      group.add(m);
    }
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
    const boardMat = new THREE.MeshStandardMaterial({
      map: colorTex, metalnessMap: specTex, roughnessMap: specTex,
      metalness: 1.0, roughness: 1.0, envMapIntensity: 1.0,
    });
    const edgeMat = mat(0x0a1a14, 0.0, 0.8);
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
        // Wafer device stack that explodes above the MCU
        deviceGroup = new THREE.Group();
        deviceGroup.position.set(px, TOP + 3, pz);
        const layers = [
          { c: 0x14171f, h: 0.5, label: "case top" },
          { c: 0x0c0e13, h: 0.6, label: "switch plate" },
          { c: 0x1b6f5c, h: 0.4, label: "pcb" },
          { c: 0x14171f, h: 0.7, label: "base" },
        ];
        layers.forEach((L, i) => {
          const m = roundedBox(11, L.h, 7, 0.3, mat(L.c, i===2?0.2:0.3, i===2?0.5:0.55));
          m.userData.restY = i * 0.7;
          m.userData.spread = i;
          m.position.y = i * 0.7;
          deviceGroup.add(m);
        });
        // a few keycaps on top layer
        for (let i = 0; i < 3; i++) {
          const cap = roundedBox(1.6, 0.8, 1.6, 0.2, mat(0xe6e8ee, 0.1, 0.5));
          cap.userData.restY = 0.6; cap.userData.spread = 4 + i*0.0;
          cap.position.set((i-1)*2.2, 0.6, 0);
          deviceGroup.add(cap);
        }
        deviceGroup.visible = false;
        scene.add(deviceGroup);
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
        deviceGroup.visible = ex > 0.02;
        deviceGroup.children.forEach((m) => {
          const target = (m.userData.restY || 0) + m.userData.spread * ex * 2.4;
          m.position.y += (target - m.position.y) * 0.2;
          if (m.material) { m.material.transparent = true; m.material.opacity = Math.min(1, 0.3 + ex); }
        });
        deviceGroup.rotation.y += dt * 0.0004;
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
      colorTex.dispose(); specTex.dispose();
      starGeo2.dispose(); starField2.material.dispose();
      asmGeo2.dispose(); assembly2.material.dispose();
      try { mount.removeChild(renderer.domElement); } catch (_) {}
    }

    return { update, render, setSize, dispose, stops: STOPS, domElement: renderer.domElement };
  }

  window.MOBoard = { build, STOPS };
})();
