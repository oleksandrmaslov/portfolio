/* ============================================================
   M.O. SYSTEM — WAFER DEMO BOARD (procedural barebone mock)
   ------------------------------------------------------------
   A parametric 36-key split keyboard built from primitives:
   per-half: case slab, PCB (+ emissive traces), plate, modules
   (MCU / battery / Sharp memory display / magnets) and 18 real
   keycap meshes — each pressable with spring return, each with
   a canvas-texture legend that re-draws per ZMK layer.

   Exposes window.makeWaferBoard(THREE) →
     { group, keys, keyMeshes, codeMap, setExplode, setLayer,
       setMode, press, release, setHover, startSweep, update,
       onPartLand, partCount }

   Swap-in path for the real exploded GLB later: keep this API,
   replace the geometry construction only.
   ============================================================ */
(function () {
  const SIGNAL = 0x00f0c8;
  const U = 0.24;                  // 1u key pitch (world units)
  const KEY_W = 0.205;             // cap footprint
  const KEY_H = 0.062;             // cap height
  const TRAVEL = 0.045;            // press travel
  const HALF_GAP = 1.92;           // half-centre to half-centre

  /* ---------------- keymap (3×5 + 3 thumbs per half) ------------- */
  const LEGENDS = {
    base: {
      L: [["Q","W","E","R","T"],["A","S","D","F","G"],["Z","X","C","V","B"]],
      R: [["Y","U","I","O","P"],["H","J","K","L",";"],["N","M",",",".","/"]],
      TL: ["⌘","NAV","␣"], TR: ["↵","SYM","⌫"],
    },
    nav: {
      L: [["1","2","3","4","5"],["⇥","⌥","⌃","⇧","·"],["`","~","[","]","·"]],
      R: [["6","7","8","9","0"],["←","↓","↑","→","↵"],["⌂","⇟","⇞","⇲","·"]],
      TL: ["⌘","NAV","␣"], TR: ["↵","SYM","⌫"],
    },
    sym: {
      L: [["!","@","#","$","%"],["·","_","+","=",":"],["<",">","{","}","~"]],
      R: [["^","&","*","(",")"],["'","\"",";","\\","|"],["°",",",".","?","/"]],
      TL: ["⌘","NAV","␣"], TR: ["↵","SYM","⌫"],
    },
  };
  const LAYER_NAMES = ["base", "nav", "sym"];

  /* physical key → matrix position */
  const CODE_ROWS = [
    ["KeyQ","KeyW","KeyE","KeyR","KeyT",  "KeyY","KeyU","KeyI","KeyO","KeyP"],
    ["KeyA","KeyS","KeyD","KeyF","KeyG",  "KeyH","KeyJ","KeyK","KeyL","Semicolon"],
    ["KeyZ","KeyX","KeyC","KeyV","KeyB",  "KeyN","KeyM","Comma","Period","Slash"],
  ];
  const CODE_THUMBS = {
    TL: ["MetaLeft", "AltLeft", "Space"],
    TR: ["Enter", "AltRight", "Backspace"],
  };

  const clamp01 = (v) => Math.max(0, Math.min(1, v));
  const smooth = (t) => t * t * (3 - 2 * t);

  window.makeWaferBoard = function (THREE) {
    const group = new THREE.Group();

    /* ---------------- materials ---------------- */
    const matCase  = new THREE.MeshStandardMaterial({ color: 0x12161f, metalness: 0.85, roughness: 0.34 });
    const matPlate = new THREE.MeshStandardMaterial({ color: 0x0d1118, metalness: 0.7,  roughness: 0.42 });
    const matPCB   = new THREE.MeshStandardMaterial({ color: 0x0a0f16, metalness: 0.25, roughness: 0.6 });
    const matModule= new THREE.MeshStandardMaterial({ color: 0x161b27, metalness: 0.5,  roughness: 0.45 });
    const matMagnet= new THREE.MeshStandardMaterial({ color: 0x2a3142, metalness: 0.95, roughness: 0.25 });
    const matTrace = new THREE.MeshBasicMaterial({ color: SIGNAL, transparent: true, opacity: 0.55 });
    const matScreen= new THREE.MeshBasicMaterial({ color: 0x06251f, transparent: true, opacity: 0.95 });

    const capBase = new THREE.MeshStandardMaterial({
      color: 0x171b26, metalness: 0.15, roughness: 0.52,
      emissive: SIGNAL, emissiveIntensity: 0,
    });

    /* x-ray variants (shared per kind) */
    const xrayOf = (tint) => new THREE.MeshStandardMaterial({
      color: tint, metalness: 0.2, roughness: 0.4, transparent: true,
      opacity: 0.13, depthWrite: false, emissive: SIGNAL, emissiveIntensity: 0.05,
    });
    const xrayMats = { case: xrayOf(0x1a2433), plate: xrayOf(0x16202e), pcb: xrayOf(0x0f1a24), cap: xrayOf(0x1c2736), module: xrayOf(0x223044) };
    const wireMat = new THREE.MeshBasicMaterial({ color: SIGNAL, wireframe: true, transparent: true, opacity: 0.3, depthWrite: false });
    let matcapMat = null;   // lazy — needs makeMatcapTexture

    const roundedBox = (w, h, d, r) => {
      if (THREE.RoundedBoxGeometry) return new THREE.RoundedBoxGeometry(w, h, d, 3, r);
      return new THREE.BoxGeometry(w, h, d);
    };

    /* geometry shared by all keycaps */
    const capGeo = roundedBox(KEY_W, KEY_H, KEY_W, 0.018);
    const legendGeo = new THREE.PlaneGeometry(0.15, 0.15);

    const parts = [];      // exploded-view records
    const keys = [];       // pressable key records
    const keyMeshes = [];  // raycast targets
    const allMeshes = [];  // for view modes
    const codeMap = {};    // e.code → key

    function reg(mesh, kind, solidMat) {
      mesh.userData.kind = kind;
      mesh.userData.solidMat = solidMat;
      allMeshes.push(mesh);
    }

    function addPart(obj, out, stagger, kind, outLen) {
      parts.push({
        obj, base: obj.position.clone(), out: out.clone().normalize(),
        stagger, kind, outLen: outLen != null ? outLen : 1,
        rotAxis: new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize(),
        rotAmt: (Math.random() - 0.5) * 0.22,
        baseQuat: obj.quaternion.clone(),
        t: 0, prevT: 0,
      });
      return parts[parts.length - 1];
    }

    /* ---------------- legend canvas ---------------- */
    function drawLegend(key, label, accent) {
      const c = key.canvas, x = key.ctx, SZ = 128;
      x.clearRect(0, 0, SZ, SZ);
      if (!label || label === "·") { key.tex.needsUpdate = true; return; }
      x.fillStyle = accent ? "#00f0c8" : "#e6e8ee";
      x.font = `600 ${label.length > 1 ? 40 : 64}px "Geist Mono", ui-monospace, monospace`;
      x.textAlign = "center"; x.textBaseline = "middle";
      x.fillText(label, SZ / 2, SZ / 2 + 4);
      key.tex.needsUpdate = true;
    }

    /* ---------------- build one half ---------------- */
    // column stagger (z, board plane: +z toward user)
    const STAG_L = [0.10, -0.04, -0.13, -0.08, 0.02];

    function buildHalf(side) {       // side: -1 left · +1 right
      const half = new THREE.Group();
      half.position.x = side * HALF_GAP * 0.5;
      half.rotation.y = -side * 0.07;
      group.add(half);
      // the whole half separates sideways at the START of the explode
      addPart(half, new THREE.Vector3(side, 0, 0.04), 0, "half", 0.62);

      const W = 5 * U + 0.14, D = 3 * U + 0.42;

      /* case */
      const caseM = new THREE.Mesh(roundedBox(W, 0.07, D + 0.1, 0.03), matCase);
      caseM.position.set(0, 0, 0.06);
      half.add(caseM); reg(caseM, "case", matCase);
      addPart(caseM, new THREE.Vector3(0, -1, 0), 0.08, "case", 0.55);

      /* PCB + traces */
      const pcb = new THREE.Group();
      pcb.position.y = 0.055;
      const pcbM = new THREE.Mesh(roundedBox(W - 0.06, 0.022, D + 0.02, 0.015), matPCB);
      pcbM.position.z = 0.06;
      pcb.add(pcbM); reg(pcbM, "pcb", matPCB);
      for (let i = 0; i < 4; i++) {
        const tr = new THREE.Mesh(new THREE.BoxGeometry(W - 0.3, 0.004, 0.008), matTrace);
        tr.position.set(0, 0.013, -0.22 + i * 0.17);
        tr.userData.kind = "trace";
        pcb.add(tr); allMeshes.push(tr);
      }
      half.add(pcb);
      addPart(pcb, new THREE.Vector3(0, -0.45, 0), 0.2, "pcb", 0.5);

      /* modules */
      if (side < 0) {
        const mcu = new THREE.Mesh(roundedBox(0.34, 0.035, 0.5, 0.012), matModule);
        mcu.position.set(side * -0.38 + (5 - 1) / 2 * U * side, 0.09, -0.42);
        // simpler: park near inner-top corner
        mcu.position.set(0.34 * -side, 0.09, -0.46);
        half.add(mcu); reg(mcu, "module", matModule);
        addPart(mcu, new THREE.Vector3(-0.2 * side, 0.5, -0.5), 0.3, "module", 0.55);

        const bat = new THREE.Mesh(roundedBox(0.55, 0.03, 0.36, 0.012), matModule);
        bat.position.set(-0.34 * -side * 0 - 0.3, 0.038, 0.62);
        half.add(bat); reg(bat, "module", matModule);
        addPart(bat, new THREE.Vector3(-0.3, -0.7, 0.4), 0.26, "module", 0.5);
      } else {
        const disp = new THREE.Group();
        disp.position.set(-0.34, 0.095, -0.46);
        const dBody = new THREE.Mesh(roundedBox(0.5, 0.035, 0.34, 0.012), matModule);
        disp.add(dBody); reg(dBody, "module", matModule);
        const dGlass = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.26), matScreen);
        dGlass.rotation.x = -Math.PI / 2; dGlass.position.y = 0.019;
        dGlass.userData.kind = "screen";
        disp.add(dGlass); allMeshes.push(dGlass);
        half.add(disp);
        addPart(disp, new THREE.Vector3(0.2, 0.55, -0.5), 0.3, "module", 0.55);

        const bat = new THREE.Mesh(roundedBox(0.55, 0.03, 0.36, 0.012), matModule);
        bat.position.set(0.3, 0.038, 0.62);
        half.add(bat); reg(bat, "module", matModule);
        addPart(bat, new THREE.Vector3(0.3, -0.7, 0.4), 0.26, "module", 0.5);
      }

      /* magnets on the inner edge */
      for (let i = 0; i < 3; i++) {
        const mag = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.05, 14), matMagnet);
        mag.rotation.z = Math.PI / 2;
        mag.position.set(-side * (W / 2 - 0.02), 0.0, -0.3 + i * 0.32);
        half.add(mag); reg(mag, "module", matMagnet);
        addPart(mag, new THREE.Vector3(-side, 0.15, 0), 0.34 + i * 0.03, "module", 0.4);
      }

      /* plate */
      const plate = new THREE.Mesh(roundedBox(W - 0.04, 0.018, D + 0.04, 0.012), matPlate);
      plate.position.set(0, 0.085, 0.05);
      half.add(plate); reg(plate, "plate", matPlate);
      addPart(plate, new THREE.Vector3(0, 0.55, 0), 0.42, "plate", 0.6);

      /* keycaps — 3×5 grid + 3 thumbs */
      const stag = side < 0 ? STAG_L : STAG_L.slice().reverse();
      const mkKey = (x, z, rotY, id, row, col, thumb) => {
        const kg = new THREE.Group();                 // explode target
        kg.position.set(x, 0.125, z);
        kg.rotation.y = rotY;
        const inner = new THREE.Group();              // press travel
        kg.add(inner);
        const mat = capBase.clone();
        const cap = new THREE.Mesh(capGeo, mat);
        inner.add(cap);

        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = 128;
        const tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        const lp = new THREE.Mesh(legendGeo, new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
        lp.rotation.x = -Math.PI / 2;
        lp.position.y = KEY_H / 2 + 0.002;
        lp.userData.kind = "legend";
        inner.add(lp); allMeshes.push(lp);

        half.add(kg);
        reg(cap, "cap", mat);
        cap.userData.isKey = true;

        const key = {
          id, row, col, thumb, side, group: kg, inner, cap, legendPlane: lp,
          canvas, ctx: canvas.getContext("2d"), tex,
          mat, p: 0, v: 0, down: false, flash: 0, hover: 0,
          worldX: half.position.x + x * Math.cos(rotY),
          label: "",
        };
        cap.userData.key = key;
        keys.push(key); keyMeshes.push(cap);

        // staggered ripple — keys explode last, rippling outward from board centre
        const distN = clamp01(Math.abs(key.worldX) / 2.2);
        const st = 0.52 + distN * 0.34 + Math.random() * 0.07;
        key.part = addPart(kg, new THREE.Vector3((Math.random() - 0.5) * 0.3, 1, (Math.random() - 0.5) * 0.3), st, "cap", 0.85 + Math.random() * 0.35);
        return key;
      };

      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 5; c++) {
          const x = (c - 2) * U;
          const z = (r - 1) * U + stag[c];
          const gCol = side < 0 ? c : c + 5;
          mkKey(x, z, 0, (side < 0 ? "L" : "R") + r + c, r, gCol, false);
        }
      }
      /* thumb arc — inner-bottom */
      for (let i = 0; i < 3; i++) {
        const x = -side * ((2 - i) * U * 1.04 - 0.5 * U);
        const z = 2.45 * U + Math.abs(1 - i) * 0.018 + 0.06 * i * 0;
        const rotY = -side * (i - 1) * 0.13;
        mkKey(x, z + (i === 2 ? 0.025 : 0), rotY, (side < 0 ? "TL" : "TR") + i, 3, i, true);
      }
    }

    buildHalf(-1);
    buildHalf(1);

    /* code → key wiring */
    keys.forEach((k) => {
      if (!k.thumb) {
        const code = CODE_ROWS[k.row][k.col];
        if (code) codeMap[code] = k;
      } else {
        const code = CODE_THUMBS[k.side < 0 ? "TL" : "TR"][k.col];
        if (code) codeMap[code] = k;
        if (code === "MetaLeft") codeMap["ControlLeft"] = k;
      }
    });

    /* ---------------- layers ---------------- */
    let layer = 0;
    function legendFor(k, li) {
      const L = LEGENDS[LAYER_NAMES[li]];
      if (k.thumb) return (k.side < 0 ? L.TL : L.TR)[k.col];
      return k.side < 0 ? L.L[k.row][k.col] : L.R[k.row][k.col - 5];
    }
    function setLayer(li) {
      layer = li;
      keys.forEach((k) => {
        const next = legendFor(k, li);
        const changed = next !== k.label;
        k.label = next;
        drawLegend(k, next, li !== 0 || k.thumb);
        if (changed && li !== 0) k.flash = Math.max(k.flash, 0.55);   // pulse remapped keys
        else if (changed) k.flash = Math.max(k.flash, 0.25);
      });
    }
    setLayer(0);

    /* ---------------- view modes ---------------- */
    let mode = "solid";
    function setMode(m) {
      mode = m;
      if (m === "matcap" && !matcapMat && window.makeMatcapTexture) {
        matcapMat = new THREE.MeshMatcapMaterial({ matcap: window.makeMatcapTexture(THREE) });
      }
      allMeshes.forEach((mesh) => {
        const kind = mesh.userData.kind;
        if (kind === "legend") { mesh.visible = m !== "wire"; return; }
        if (kind === "trace" || kind === "screen") { mesh.visible = m !== "wire"; return; }
        if (m === "solid") mesh.material = mesh.userData.solidMat;
        else if (m === "xray") mesh.material = xrayMats[kind] || xrayMats.module;
        else if (m === "wire") mesh.material = wireMat;
        else if (m === "matcap") mesh.material = matcapMat || mesh.userData.solidMat;
      });
    }

    /* ---------------- explode ---------------- */
    let explodeOpts = { dist: 1, stagger: 0.65 };
    let landCb = null;
    let lastE = 0, lastEt = 0;

    function setExplode(E, now) {
      const dE = Math.abs(E - lastE);
      lastE = E;
      for (const p of parts) {
        const st = p.stagger * explodeOpts.stagger;
        const span = Math.max(0.001, 1 - st);
        const t = smooth(clamp01((E - st) / span));
        p.prevT = p.t; p.t = t;
        const amt = t * p.outLen * 0.9 * explodeOpts.dist;
        p.obj.position.set(
          p.base.x + p.out.x * amt,
          p.base.y + p.out.y * amt,
          p.base.z + p.out.z * amt,
        );
        if (p.kind === "cap" || p.kind === "module") {
          const q = new THREE.Quaternion().setFromAxisAngle(p.rotAxis, t * p.rotAmt * explodeOpts.dist);
          p.obj.quaternion.copy(p.baseQuat).multiply(q);
        }
        // landing detection (assembling: t crosses below 0.025 with real motion)
        if (landCb && dE > 0.0004 && p.prevT > 0.025 && p.t <= 0.025) landCb(p);
      }
    }

    /* ---------------- sweep (signal wave across caps) ------------- */
    let sweepStart = -1, sweepDur = 900;
    function startSweep(dur) { sweepDur = dur || 900; sweepStart = performance.now(); }

    /* ---------------- per-frame ---------------- */
    function update(dtMs, now) {
      const dt = Math.min(0.05, dtMs / 1000);
      let sweepN = -1;
      if (sweepStart > 0) {
        sweepN = (now - sweepStart) / sweepDur;
        if (sweepN > 1.4) { sweepStart = -1; sweepN = -1; }
      }
      for (const k of keys) {
        /* spring */
        const target = k.down ? 1 : 0;
        const stiff = k.down ? 900 : 420;
        const dampC = k.down ? 38 : 17;          // under-damped return = spring bounce
        k.v += (target - k.p) * stiff * dt;
        k.v *= Math.exp(-dampC * dt);
        k.p += k.v * dt;
        if (Math.abs(k.p) < 0.0005 && Math.abs(k.v) < 0.001 && !k.down) { k.p = 0; k.v = 0; }
        k.inner.position.y = -Math.max(-0.18, Math.min(1.15, k.p)) * TRAVEL;

        /* emissive: press flash + hover + sweep wave */
        k.flash *= Math.exp(-5.5 * dt);
        k.hover += ((k.isHovered ? 1 : 0) - k.hover) * Math.min(1, dt * 14);
        let glow = k.flash * 0.9 + k.hover * 0.22 + k.p * 0.35;
        if (sweepN >= 0) {
          const xN = (k.worldX + 2.2) / 4.4;     // 0..1 left→right
          const d = sweepN * 1.25 - xN;
          glow += Math.exp(-(d * d) / 0.012) * 0.85;
        }
        if (k.mat.emissiveIntensity !== glow) {
          k.mat.emissiveIntensity = glow;
        }
      }
    }

    return {
      group, keys, keyMeshes, codeMap, parts,
      get partCount() { return parts.length; },
      get layer() { return layer; },
      get mode() { return mode; },
      legendFor, layerNames: LAYER_NAMES,
      setLayer, setMode, setExplode, startSweep, update,
      setExplodeOpts(o) { Object.assign(explodeOpts, o); },
      set onPartLand(cb) { landCb = cb; },
      press(k) { if (!k.down) { k.down = true; k.flash = Math.max(k.flash, 0.8); } },
      release(k) { k.down = false; },
      setHover(k) {
        for (const o of keys) o.isHovered = false;
        if (k) k.isHovered = true;
      },
    };
  };
})();
