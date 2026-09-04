/* ============================================================
   M.O. SYSTEM — WAFER DEMO BOARD (production GLB parts)
   ------------------------------------------------------------
   Board loader for the 53 production exploded-part GLBs
   (models/wafer_parts/*.glb — meshopt+quantized, each carrying
   its real material) and reassembles them, including the two
   USB-C connectors (usbc_L/usbc_R), which explode as their own
   layer like every other part.

   Parts are world-aligned, so dropped into one parent they snap
   into the full keyboard. We then:
     · derive the UP (thin) + LONG (wide) axes from the assembled
       bbox, recenter + scale to the demo's framing, and rotate
       UP → world +Y so the deck lies flat for the orbit camera;
     · wrap each part for a layered teardown explode (caps lift,
       switches, plate, pcb, then case — halves splitting sideways);
     · wrap each of the 36 keycaps so it is individually pressable
       (spring travel) and carries a canvas-texture legend redrawn
       per ZMK layer (base / nav / sym).

   Exposes window.makeWaferBoard(THREE) → board API with async
   loading: board.ready + board.onReady(cb). Methods are
   safe to call before the parts finish loading.
   ============================================================ */
(function () {
  const SIGNAL = 0x00f0c8;
  const PARTS_DIR = "models/wafer_parts/";

  /* ---- the 53 part files ---- */
  const STRUCT_FILES = [
    "case_L", "case_R", "plate_L", "plate_R", "pcb_L", "pcb_R",
    "usbc_L", "usbc_R",
    "switches_L", "switches_R", "mcu", "display_L", "display_R",
    "antenna_L", "antenna_R", "softoff_L", "softoff_R",
  ];
  const KEY_FILES = [];
  for (const side of ["L", "R"]) {
    for (let r = 0; r < 3; r++) for (let c = 0; c < 5; c++) KEY_FILES.push(`key_${side}_r${r}c${c}`);
    for (let t = 0; t < 3; t++) KEY_FILES.push(`key_${side}_t${t}`);
  }
  const ALL_FILES = STRUCT_FILES.concat(KEY_FILES);

  /* ---- ZMK keymap (same legends as the procedural demo) ---- */
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

  const CODE_ROWS = [
    ["KeyQ","KeyW","KeyE","KeyR","KeyT",  "KeyY","KeyU","KeyI","KeyO","KeyP"],
    ["KeyA","KeyS","KeyD","KeyF","KeyG",  "KeyH","KeyJ","KeyK","KeyL","Semicolon"],
    ["KeyZ","KeyX","KeyC","KeyV","KeyB",  "KeyN","KeyM","Comma","Period","Slash"],
  ];
  const CODE_THUMBS = {
    TL: ["MetaLeft", "AltLeft", "Space"],
    TR: ["Enter", "AltRight", "Backspace"],
  };

  /* ---- per-kind teardown layout (signed UP factor · lateral · stagger) ---- */
  // Conventional teardown, top → bottom. `h` = explode height (× board width);
  // bbox centres mislead for the open case frame, so we rank by kind instead.
  // `stag` makes the TOP parts lead the explode (caps lift first, then the top
  // case shell, …) so nothing is overtaken / clipped on the way out.
  //
  // Within the LOWER split the rule flips: parts share the central column, so
  // the piece that travels DEEPEST must start FIRST — otherwise a shallower part
  // above it (e.g. the PCB) descends into a deeper part that hasn't moved yet.
  // Hence staggers increase with |h| downward: plate (deepest) leads, then
  // antenna · soft-off · pcb · mcu. This is what fixes the PCB↔bottom-plate clip.
  const LAYER = {
    key:      { h:  1.06, stag: 0.04 },   // keycaps (top)
    case:     { h:  0.60, stag: 0.20 },   // anodized top shell
    display:  { h:  0.40, stag: 0.26 },   // Sharp memory LCD
    switches: { h:  0.18, stag: 0.32 },
    usbc:     { h: -0.36, stag: 0.46 },   // edge USB-C connector — released early, drifts out to the side
    plate:    { h: -0.82, stag: 0.48 },   // bottom plate — deepest travel, so it LEADS the lower split
    antenna:  { h: -0.62, stag: 0.50 },
    softoff:  { h: -0.54, stag: 0.52 },
    pcb:      { h: -0.52, stag: 0.53 },
    mcu:      { h: -0.42, stag: 0.55 },   // shallowest of the lower split — seats/leaves last
  };

  const TARGET_FIT = 3.6;     // longest assembled edge, world units

  const clamp01 = (v) => Math.max(0, Math.min(1, v));
  const smooth = (t) => t * t * (3 - 2 * t);

  function parseKey(name) {
    const m = name.match(/^key_([LR])_(?:r(\d)c(\d)|t(\d))$/);
    if (!m) return null;
    const side = m[1] === "L" ? -1 : 1;
    if (m[4] != null) return { side, thumb: true, tcol: +m[4] };
    return { side, thumb: false, row: +m[2], col: +m[3] };
  }
  function kindOf(name) {
    if (name.startsWith("key_")) return "key";
    return name.replace(/_[LR]$/, "");
  }

  window.makeWaferBoard = function (THREE) {
    const group = new THREE.Group();
    const aligner = new THREE.Group();     // UP→+Y rotation + fit scale
    const recenter = new THREE.Group();    // shift model-centre to origin
    aligner.add(recenter);
    group.add(aligner);

    const UP = new THREE.Vector3(0, 0, 1);    // model up — refined after load
    const LONG = new THREE.Vector3(1, 0, 0);  // model long (half-split) axis
    const PLANE = new THREE.Vector3(0, 1, 0); // remaining in-plane axis

    const parts = [];      // { wrap, vec, stagger, kind, prevT, t }
    const keys = [];
    const keyMeshes = [];
    const allMeshes = [];  // { mesh, solidMat } for view modes
    const codeMap = {};

    let layer = 0, mode = "solid", base = 1, travel = 0.05, upHalf = 0.05;
    let explodeOpts = { dist: 1, stagger: 0.65 };
    let landCb = null;
    let lastE = 0;
    let sweepStart = -1, sweepDur = 900;
    let wireMat = null;
    let pendingExplode = 1;   // applied once geometry is in

    /* ---------- legend canvas ---------- */
    function drawLegend(key, label, accent) {
      const x = key.ctx, SZ = 128;
      x.clearRect(0, 0, SZ, SZ);
      if (!label || label === "·") { key.tex.needsUpdate = true; return; }
      x.fillStyle = accent ? "#00f0c8" : "#e6e8ee";
      x.font = `600 ${label.length > 1 ? 40 : 66}px "Geist Mono", ui-monospace, monospace`;
      x.textAlign = "center"; x.textBaseline = "middle";
      x.fillText(label, SZ / 2, SZ / 2 + 4);
      key.tex.needsUpdate = true;
    }
    function legendFor(key, li) {
      const L = LEGENDS[LAYER_NAMES[li]];
      if (key.thumb) return (key.side < 0 ? L.TL : L.TR)[key.tcol];
      if (key.side < 0) return L.L[key.row][key.col];      // left: col0 = outer = Q
      return L.R[key.row][4 - key.col];                    // right: col0 = outer → reversed
    }

    /* ---------- build (async) ---------- */
    function build() {
      const loader = window.loadProjectModel;
      if (!loader) { console.warn("[wafer-board] loadProjectModel missing"); return; }

      Promise.all(ALL_FILES.map((f) =>
        loader(PARTS_DIR + f + ".glb", THREE)
          .then((root) => ({ f, root }))
          .catch((e) => { console.warn("[wafer-board] part failed", f, e); return null; })
      )).then((loaded) => {
        const ok = loaded.filter(Boolean);
        if (!ok.length) { console.warn("[wafer-board] no parts loaded"); return; }

        // 1) drop every part into recenter (world-aligned → they assemble)
        for (const { root } of ok) recenter.add(root);

        // 2) assembled bbox in model space → axes, centre, scale
        const box = new THREE.Box3().setFromObject(recenter);
        const size = new THREE.Vector3(); box.getSize(size);
        const centre = new THREE.Vector3(); box.getCenter(centre);
        const dims = [size.x, size.y, size.z];
        let upI = dims.indexOf(Math.min(...dims));
        let longI = dims.indexOf(Math.max(...dims));
        if (longI === upI) longI = (upI + 1) % 3;
        const midI = 3 - upI - longI;
        const axis = (i) => new THREE.Vector3(i === 0 ? 1 : 0, i === 1 ? 1 : 0, i === 2 ? 1 : 0);
        UP.copy(axis(upI)); LONG.copy(axis(longI)); PLANE.copy(axis(midI));

        // sign UP so the caps sit on +UP (they should point up)
        let capMean = 0, capN = 0;
        for (const { f, root } of ok) {
          if (!f.startsWith("key_")) continue;
          const b = new THREE.Box3().setFromObject(root); const c = new THREE.Vector3(); b.getCenter(c);
          capMean += c.clone().sub(centre).dot(UP); capN++;
        }
        if (capN && capMean < 0) UP.multiplyScalar(-1);

        base = dims[longI];
        travel = base * 0.002;                       // very subtle key press (the press is also highlighted)
        upHalf = Math.max(1e-4, dims[upI] * 0.5);

        // recenter model-centre to origin
        recenter.position.copy(centre).multiplyScalar(-1);

        // aligner: rotate UP → world +Y, then spin LONG → world +X, then fit-scale
        const q = new THREE.Quaternion().setFromUnitVectors(UP.clone(), new THREE.Vector3(0, 1, 0));
        aligner.quaternion.copy(q);
        const longWorld = LONG.clone().applyQuaternion(q);
        const yawFix = Math.atan2(longWorld.z, longWorld.x);
        aligner.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), -yawFix);
        const s = TARGET_FIT / Math.max(1e-3, dims[longI]);
        aligner.scale.setScalar(s);

        // 3) wrap parts for explode; keys also get press + legend
        for (const { f, root } of ok) {
          const kind = kindOf(f);
          const partB = new THREE.Box3().setFromObject(root);
          const partC = new THREE.Vector3(); partB.getCenter(partC);
          const rel = partC.clone().sub(centre);
          const cfg = LAYER[kind] || { h: 0, stag: 0.3 };

          // EXPLODE — vertical by explicit per-kind layer height (conventional
          // teardown order), plus the part's REAL in-plane offset so the two
          // halves split apart and edge modules (mcu / display / antenna /
          // soft-off) drift outward. Vertical-dominant → parts slide straight
          // out without crossing the case walls.
          const vUp = rel.dot(UP);
          const horiz = rel.clone().addScaledVector(UP, -vUp);
          const vec = new THREE.Vector3();
          vec.addScaledVector(UP, cfg.h * base);
          vec.addScaledVector(horiz, 0.5);

          // wrap the part
          const wrap = new THREE.Group();
          recenter.add(wrap);

          if (kind === "key") {
            const meta = parseKey(f) || {};
            const inner = new THREE.Group();   // press travel
            wrap.add(inner);
            inner.add(root);

            // find the cap mesh + its centre/size (model space, == inner-local)
            let cap = null;
            root.traverse((o) => { if (o.isMesh && !cap) cap = o; });
            const capH = (partB.max.clone().sub(partB.min)).dot(UP) || base * 0.03;

            // per-cap material clone for emissive press/hover/sweep glow
            if (cap) {
              const sm = cap.material.clone();
              sm.emissive = new THREE.Color(SIGNAL); sm.emissiveIntensity = 0;
              if ("envMapIntensity" in sm) sm.envMapIntensity = 1.25;
              cap.material = sm;
              cap.userData.isKey = true;
              allMeshes.push({ mesh: cap, solidMat: sm });
            }

            // legend plane at cap top, facing UP
            const canvas = document.createElement("canvas");
            canvas.width = canvas.height = 128;
            const tex = new THREE.CanvasTexture(canvas);
            tex.colorSpace = THREE.SRGBColorSpace;
            const legSize = Math.max(partB.max.x - partB.min.x, partB.max.z - partB.min.z, partB.max.y - partB.min.y) * 0.72;
            const lp = new THREE.Mesh(
              new THREE.PlaneGeometry(legSize, legSize),
              new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false })
            );
            lp.quaternion.copy(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), UP));
            lp.position.copy(partC).addScaledVector(UP, capH * 0.5 + base * 0.004);
            lp.userData.legend = true;
            inner.add(lp);

            const key = {
              id: f, side: meta.side, thumb: !!meta.thumb,
              row: meta.row, col: meta.thumb ? meta.tcol : meta.col, tcol: meta.tcol,
              wrap, inner, cap, canvas, ctx: canvas.getContext("2d"), tex, legendPlane: lp,
              mat: cap ? cap.material : null,
              p: 0, v: 0, down: false, flash: 0, hover: 0, isHovered: false,
              upVec: UP.clone(), travel,
              label: "",
            };
            if (cap) cap.userData.key = key;
            keys.push(key);
            if (cap) keyMeshes.push(cap);

            // code wiring
            let code = null;
            if (meta.thumb) code = CODE_THUMBS[meta.side < 0 ? "TL" : "TR"][meta.tcol];
            else if (meta.side < 0) code = CODE_ROWS[meta.row][meta.col];
            else code = CODE_ROWS[meta.row][5 + (4 - meta.col)];
            if (code) codeMap[code] = key;
            if (code === "MetaLeft") codeMap["ControlLeft"] = key;

            // per-key stagger ripple (outer caps explode last)
            const distN = clamp01(Math.abs(rel.dot(LONG)) / (base * 0.5 + 1e-3));
            parts.push({ wrap, vec, stagger: cfg.stag + distN * 0.10 + Math.random() * 0.03, kind, prevT: 0, t: 0, key });
          } else {
            wrap.add(root);
            // clone structural materials so view-modes/tuning don't touch the cache
            root.traverse((o) => {
              if (!o.isMesh) return;
              const sm = o.material.clone();
              if ("envMapIntensity" in sm) sm.envMapIntensity = 1.3;
              o.material = sm;
              allMeshes.push({ mesh: o, solidMat: sm });
            });
            parts.push({ wrap, vec, stagger: cfg.stag, kind, prevT: 0, t: 0 });
          }
        }

        // initial legends + explode state
        applyLayer(0);
        board.ready = true;
        setExplode(pendingExplode, performance.now());
        if (board._onReady) board._onReady();
      });
    }

    /* ---------- layers ---------- */
    function applyLayer(li) {
      layer = li;
      for (const k of keys) {
        const next = legendFor(k, li);
        const changed = next !== k.label;
        k.label = next;
        drawLegend(k, next, li !== 0 || k.thumb);
        if (changed) k.flash = Math.max(k.flash, li !== 0 ? 0.55 : 0.25);
      }
    }

    /* ---------- view modes ---------- */
    function ensureWire() {
      if (!wireMat) wireMat = new THREE.MeshBasicMaterial({ color: SIGNAL, wireframe: true, transparent: true, opacity: 0.28, depthWrite: false });
      return wireMat;
    }
    function xrayFor(rec) {
      if (!rec.xrayMat) {
        const m = rec.solidMat.clone();
        m.transparent = true; m.opacity = 0.16; m.depthWrite = false;
        m.emissive = new THREE.Color(SIGNAL); m.emissiveIntensity = 0.05;
        rec.xrayMat = m;
      }
      return rec.xrayMat;
    }
    function applyMode(m) {
      mode = m;
      ensureWire();
      for (const rec of allMeshes) {
        if (m === "solid") rec.mesh.material = rec.solidMat;
        else if (m === "xray") rec.mesh.material = xrayFor(rec);
        else if (m === "wire") rec.mesh.material = wireMat;
        else rec.mesh.material = rec.solidMat;
      }
      for (const k of keys) if (k.legendPlane) k.legendPlane.visible = m !== "wire";
    }

    /* ---------- explode ---------- */
    function setExplode(E, now) {
      pendingExplode = E;
      if (!board.ready) return;
      const dE = Math.abs(E - lastE); lastE = E;
      for (const p of parts) {
        const st = p.stagger * explodeOpts.stagger;
        const span = Math.max(0.001, 1 - st);
        const t = smooth(clamp01((E - st) / span));
        p.prevT = p.t; p.t = t;
        const amt = t * explodeOpts.dist;
        p.wrap.position.set(p.vec.x * amt, p.vec.y * amt, p.vec.z * amt);
        if (landCb && dE > 0.0004 && p.prevT > 0.025 && p.t <= 0.025) landCb(p.kind);
      }
    }

    function startSweep(dur) { sweepDur = dur || 900; sweepStart = performance.now(); }

    /* ---------- per-frame ---------- */
    function update(dtMs, now) {
      if (!board.ready) return;
      const dt = Math.min(0.05, dtMs / 1000);
      let sweepN = -1;
      if (sweepStart > 0) {
        sweepN = (now - sweepStart) / sweepDur;
        if (sweepN > 1.4) { sweepStart = -1; sweepN = -1; }
      }
      for (const k of keys) {
        const target = k.down ? 1 : 0;
        const stiff = k.down ? 900 : 420;
        const dampC = k.down ? 38 : 17;
        k.v += (target - k.p) * stiff * dt;
        k.v *= Math.exp(-dampC * dt);
        k.p += k.v * dt;
        if (Math.abs(k.p) < 0.0005 && Math.abs(k.v) < 0.001 && !k.down) { k.p = 0; k.v = 0; }
        const press = -Math.max(-0.18, Math.min(1.15, k.p)) * k.travel;
        k.inner.position.copy(k.upVec).multiplyScalar(press);

        if (!k.mat) continue;
        k.flash *= Math.exp(-5.5 * dt);
        k.hover += ((k.isHovered ? 1 : 0) - k.hover) * Math.min(1, dt * 14);
        let glow = k.flash * 0.9 + k.hover * 0.22 + k.p * 0.35;
        if (sweepN >= 0) {
          const xN = 0.5 + (k.wrap.position.x); // approx phase by lateral pos
          const d = sweepN * 1.25 - clamp01(xN);
          glow += Math.exp(-(d * d) / 0.02) * 0.8;
        }
        k.mat.emissiveIntensity = glow;
      }
    }

    /* ---------- API (same shape as the procedural board) ---------- */
    const board = {
      group, keys, keyMeshes, codeMap, parts,
      ready: false,
      _onReady: null,
      set onReady(cb) { board._onReady = cb; if (board.ready && cb) cb(); },
      get partCount() { return parts.length; },
      get layer() { return layer; },
      get mode() { return mode; },
      legendFor, layerNames: LAYER_NAMES,
      setLayer(i) { if (board.ready) applyLayer(i); else layer = i; },
      setMode(m) { if (board.ready) applyMode(m); else mode = m; },
      setExplode, startSweep, update,
      setExplodeOpts(o) { Object.assign(explodeOpts, o); },
      set onPartLand(cb) { landCb = cb; },
      press(k) { if (k && !k.down) { k.down = true; k.flash = Math.max(k.flash, 0.8); } },
      release(k) { if (k) k.down = false; },
      setHover(k) { for (const o of keys) o.isHovered = false; if (k) k.isHovered = true; },
    };

    build();
    return board;
  };
})();
