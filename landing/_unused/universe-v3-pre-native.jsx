/* ============================================================
   M.O. SYSTEM — Universe v3
   Wrapping infinite space.
     · Drag to rotate the view (yaw + pitch).
     · Wheel to fly forward / backward along the look axis.
     · Tiles live in a torus-wrapped box around the camera —
       anything that drifts out of view wraps back in from the
       opposite side. The space feels infinite in every axis.

   v1 (sparse free-pan)   → landing/_unused/universe-v1-sparse.jsx
   v2 (Fibonacci sphere)  → landing/_unused/universe-v2-sphere.jsx
   ============================================================ */

const PROJECTS = [
  { addr: "0x01", kind: "wafer",  prim: "slab",   file: "Wafer.html",               name: "Wafer",                  sub: "36-key ultrathin split keyboard", year: "2025",   stack: "ZMK · KICAD · NRF52840", color: "#0d1018", model: "models/wafer.glb", modelFit: 5.0, modelPose: { x: 1.05, y: 0, z: 0 }, modelOffset: { x: 0, y: 0.85, z: 0 } },
  { addr: "0x02", kind: "kerfur", prim: "sphere", file: "Kerfur.html",              name: "Kerfur",                 sub: "Embedded pet · event bus",        year: "2025 —", stack: "C · ZEPHYR · LVGL · BLE", color: "#0e1118" },
  { addr: "0x03", kind: "accel",  prim: "torus",  file: "ZMK-PointAccel.html",      name: "ZMK PointAccel",         sub: "Open-source input processor",     year: "2025",   stack: "C · DEVICETREE · ZMK",   color: "#0d1119" },
  { addr: "0x04", kind: "torch",  prim: "cone",   file: "Tactical-Flashlight.html", name: "Tactical Flashlight",    sub: "For Energy for Ukraine",          year: "12/25",  stack: "C · ARM-M0 · KICAD",     color: "#0e1018", model: "models/tactical_flashlight.glb" },
  { addr: "0x05", kind: "node",   name: "ZMK upstream",           sub: "Voltage IIO merge · PMIC driver", year: "2025",   stack: "ZEPHYR · DT · I2C",      color: "#0d1018" },
  { addr: "0x06", kind: "node",   name: "Matterium",              sub: "Matter / Thread experiments",     year: "2024",   stack: "MATTER · OPENTHREAD",    color: "#0e1119" },
  { addr: "0x07", kind: "node",   name: "Catloading",             sub: "Loading screen · meow OS",        year: "2024",   stack: "JS · WEBGL · GLSL",      color: "#0d1018" },
  { addr: "0x08", kind: "node",   name: "view-elemental",         sub: "Periodic table viewer",           year: "2023",   stack: "REACT · D3 · CHEM",      color: "#0e1118" },
  { addr: "0x09", kind: "node",   name: "Wafer R1 → R3",          sub: "Revision history · KiCad",        year: "2024-5", stack: "KICAD · CHANGELOG",      color: "#0d1018" },
  { addr: "0x0A", kind: "node",   name: "Kerfur Beacons",         sub: "Peer-to-peer rotating IDs",       year: "2025",   stack: "BLE · CRYPTO · BEACON",  color: "#0e1018" },
  { addr: "0x0B", kind: "node",   name: "PMIC Driver",            sub: "NPM1300 register interface",      year: "2025",   stack: "C · I2C · ZEPHYR",       color: "#0d1119" },
  { addr: "0x0C", kind: "node",   name: "Streamlit Configurator", sub: "PointAccel devicetree emit",      year: "2025",   stack: "PYTHON · STREAMLIT",     color: "#0e1018" },
];

window.UNIVERSE_PROJECTS = PROJECTS;

// Kick the GLB preload as soon as we know the URLs — independent of Boot,
// which can be skipped via sessionStorage. We defer until the next tick so
// viewer3d.jsx has had a chance to define window.preloadModels.
setTimeout(() => {
  if (typeof window.preloadModels !== "function") return;
  const urls = PROJECTS.map(p => p.model).filter(Boolean);
  if (urls.length) window.preloadModels(urls);
}, 0);

/* ============================================================
   Per-tile canvas texture
   ============================================================ */
function makeTileTexture(p, THREE) {
  const c = document.createElement("canvas");
  c.width = 540; c.height = 720;
  const x = c.getContext("2d");

  x.fillStyle = p.color || "#0d1018";
  x.fillRect(0, 0, 540, 720);
  x.strokeStyle = "#232a3a";
  x.lineWidth = 1.5;
  x.strokeRect(12, 12, 516, 696);

  x.strokeStyle = "#00f0c8";
  x.lineWidth = 1.5;
  const drawCorner = (cx, cy, fx, fy) => {
    const len = 16;
    x.beginPath();
    x.moveTo(cx, cy + fy * len);
    x.lineTo(cx, cy);
    x.lineTo(cx + fx * len, cy);
    x.stroke();
  };
  drawCorner(24, 24, 1, 1);
  drawCorner(516, 24, -1, 1);
  drawCorner(24, 696, 1, -1);
  drawCorner(516, 696, -1, -1);

  x.fillStyle = "#5b6478";
  x.font = "500 11px 'Geist Mono', monospace";
  x.textBaseline = "top";
  x.textAlign = "left";
  x.fillText("■  NODE " + p.addr, 44, 30);
  x.fillStyle = "#9aa3b3";
  x.fillText(p.year.toUpperCase(), 44, 46);
  x.fillStyle = "#5b6478";
  x.textAlign = "right";
  x.fillText("MASLOV / OLEKSANDR", 496, 30);
  x.fillText("48.137° N  ·  11.575° E", 496, 46);
  x.textAlign = "left";

  x.fillStyle = "#1a2030";
  for (let yy = 90; yy < 540; yy += 21) {
    for (let xx = 44; xx < 510; xx += 21) {
      x.fillRect(xx, yy, 1, 1);
    }
  }

  // Skip the canvas wireframe graphic when a real 3D model overlays the card —
  // otherwise the green primitive shows through behind the GLB.
  if (!p.model) {
    x.save();
    x.translate(270, 320);
    x.strokeStyle = "#00f0c8";
    x.fillStyle = "#00f0c8";
    x.lineWidth = 1.4;
    drawGraphic(x, p);
    x.restore();
  }

  x.fillStyle = "#e6e8ee";
  x.font = "400 56px 'Geist', sans-serif";
  x.textAlign = "left";
  x.textBaseline = "top";
  const lines = wrapText(x, p.name, 460);
  let ty = 550 - (lines.length - 1) * 56;
  for (const line of lines) {
    x.fillText(line, 44, ty);
    ty += 58;
  }

  x.fillStyle = "#9aa3b3";
  x.font = "400 18px 'Geist', sans-serif";
  x.fillText(p.sub, 44, 640);

  x.fillStyle = "#5b6478";
  x.font = "500 11px 'Geist Mono', monospace";
  x.fillText(p.stack, 44, 678);
  x.fillStyle = "#00f0c8";
  x.textAlign = "right";
  x.fillText("OPEN  →", 496, 678);

  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 8;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function wrapText(ctx, text, maxW) {
  const words = text.split(" ");
  const out = [];
  let cur = "";
  for (const w of words) {
    const test = cur ? cur + " " + w : w;
    if (ctx.measureText(test).width > maxW && cur) { out.push(cur); cur = w; }
    else cur = test;
  }
  if (cur) out.push(cur);
  return out;
}

function drawGraphic(x, p) {
  switch (p.kind) {
    case "wafer": {
      const w = 280, h = 180, r = 22;
      x.beginPath();
      x.moveTo(-w/2 + r, -h/2);
      x.lineTo(w/2 - r, -h/2);
      x.arcTo(w/2, -h/2, w/2, -h/2 + r, r);
      x.lineTo(w/2, h/2 - r);
      x.arcTo(w/2, h/2, w/2 - r, h/2, r);
      x.lineTo(-w/2 + r, h/2);
      x.arcTo(-w/2, h/2, -w/2, h/2 - r, r);
      x.lineTo(-w/2, -h/2 + r);
      x.arcTo(-w/2, -h/2, -w/2 + r, -h/2, r);
      x.stroke();
      for (let row = 0; row < 3; row++) for (let col = 0; col < 5; col++) {
        const dx = (col - 2) * 26 - 32;
        const dy = (row - 1) * 26;
        x.fillRect(dx - 2, dy - 2, 4, 4);
        x.fillRect(-dx + 32 - 2, dy - 2, 4, 4);
      }
      for (let i = 0; i < 3; i++) {
        x.fillRect(-12 + i * 26 - 2, 50, 4, 4);
        x.fillRect(12 - i * 26 - 2 + 24, 50, 4, 4);
      }
      break;
    }
    case "kerfur": {
      x.beginPath(); x.arc(0, 0, 100, 0, Math.PI * 2); x.stroke();
      x.beginPath(); x.arc(-30, -8, 11, 0, Math.PI * 2); x.fill();
      x.beginPath(); x.arc( 30, -8, 11, 0, Math.PI * 2); x.fill();
      x.beginPath(); x.arc(0, 22, 14, 0, Math.PI, false); x.stroke();
      for (let i = 1; i <= 3; i++) {
        x.beginPath();
        x.arc(0, 0, 100 + i * 14, -0.4 - i * 0.05, 0.4 + i * 0.05);
        x.globalAlpha = 0.4 - i * 0.1;
        x.stroke();
      }
      x.globalAlpha = 1;
      break;
    }
    case "accel": {
      x.beginPath();
      for (let i = 0; i <= 80; i++) {
        const t = i / 80;
        const xx = (t - 0.5) * 240;
        const yy = -Math.pow(t, 2.6) * 170 + 70;
        if (i === 0) x.moveTo(xx, yy); else x.lineTo(xx, yy);
      }
      x.stroke();
      x.strokeStyle = "#1a2030";
      x.beginPath(); x.moveTo(-120, 70); x.lineTo(120, -80); x.stroke();
      x.beginPath(); x.moveTo(-120, 70); x.lineTo(120, 70); x.stroke();
      x.beginPath(); x.moveTo(-120, 70); x.lineTo(-120, -100); x.stroke();
      x.fillStyle = "#5b6478";
      for (let i = 1; i <= 4; i++) {
        x.fillRect(-120 + i * 48 - 0.5, 70 - 3, 1, 6);
        x.fillRect(-120 - 3, 70 - i * 38 - 0.5, 6, 1);
      }
      x.strokeStyle = "#00f0c8";
      x.fillStyle = "#00f0c8";
      break;
    }
    case "torch": {
      x.beginPath();
      x.moveTo(-50, 60); x.lineTo(50, 60);
      x.lineTo(110, -90); x.lineTo(-110, -90); x.closePath();
      x.stroke();
      x.beginPath(); x.rect(-50, 60, 100, 70); x.stroke();
      x.beginPath(); x.arc(0, -10, 16, 0, Math.PI * 2); x.fill();
      for (let i = -2; i <= 2; i++) {
        x.globalAlpha = 0.3;
        x.beginPath();
        x.moveTo(i * 16, -90); x.lineTo(i * 24, -150);
        x.stroke();
      }
      x.globalAlpha = 1;
      break;
    }
    default: {
      for (let i = 0; i < 4; i++) {
        const s = 30 + i * 30;
        x.globalAlpha = 1 - i * 0.22;
        x.strokeRect(-s, -s, s * 2, s * 2);
      }
      x.globalAlpha = 1;
      x.beginPath(); x.moveTo(-80, 0); x.lineTo(80, 0); x.stroke();
      x.beginPath(); x.moveTo(0, -80); x.lineTo(0, 80); x.stroke();
      x.fillRect(-3, -3, 6, 6);
    }
  }
}

/* ============================================================
   Ambient node — small canvas sprite
   ============================================================ */
function makeAmbientTexture(label, THREE) {
  const cc = document.createElement("canvas");
  cc.width = 128; cc.height = 128;
  const xc = cc.getContext("2d");
  xc.clearRect(0, 0, 128, 128);
  xc.strokeStyle = "#00f0c8";
  xc.lineWidth = 2;
  xc.beginPath(); xc.arc(64, 64, 4, 0, Math.PI * 2); xc.stroke();
  xc.fillStyle = "#5b6478";
  xc.font = "500 16px 'Geist Mono', monospace";
  xc.textAlign = "left";
  xc.textBaseline = "middle";
  xc.fillText(label, 76, 64);
  const t = new THREE.CanvasTexture(cc);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* ============================================================
   Hover ASCII helpers
   ============================================================ */
const ASCII_CHAR_W = 5.4;
const ASCII_CHAR_H = 9.5;
const ASCII_RAMP   = " .·:-=+*#%@";

function asciiBody(project, screen) {
  const cols = Math.max(14, Math.floor(screen.w / ASCII_CHAR_W));
  const rows = Math.max(10, Math.floor(screen.h / ASCII_CHAR_H));

  const out = [];
  const t1 = "■ " + project.addr;
  const t2 = project.year.toUpperCase();
  const headerSpace = Math.max(1, cols - t1.length - t2.length);
  out.push((t1 + " ".repeat(headerSpace) + t2).slice(0, cols));
  out.push("─".repeat(cols));

  const innerR = Math.max(2, rows - 6);
  const seed = project.addr.charCodeAt(2) + project.addr.charCodeAt(3);
  for (let r = 0; r < innerR; r++) {
    let line = "";
    for (let c = 0; c < cols; c++) {
      const cx = (cols - 1) / 2;
      const cy = (innerR - 1) / 2;
      const dx = (c - cx) / (cx || 1);
      const dy = (r - cy) / (cy || 1);
      const d = Math.sqrt(dx * dx * 0.5 + dy * dy);
      const n = Math.sin(c * 0.5 + r * 0.7 + seed) * 0.15;
      const v = Math.max(0, Math.min(1, 1 - d * 1.1 + n));
      const idx = Math.floor(v * (ASCII_RAMP.length - 1));
      line += ASCII_RAMP[idx];
    }
    out.push(line);
  }
  out.push("─".repeat(cols));
  out.push(project.name.toUpperCase().slice(0, cols).padEnd(cols, " "));
  out.push(project.sub.slice(0, cols).padEnd(cols, " "));
  out.push("OPEN →".padEnd(cols, " "));
  return out.slice(0, rows).join("\n");
}

/* ============================================================
   Universe v3 — wrapping infinite torus space
   ============================================================ */
function Universe({ projects = PROJECTS, onActive, mode = "drift", focusAddr = null }) {
  const mountRef   = React.useRef(null);
  const overlayRef = React.useRef(null);
  const [hover, setHover] = React.useState(null);
  const [activeAddr, setActiveAddr] = React.useState(null);
  const [status, setStatus] = React.useState({ yaw: "0", pit: "0", vel: "0", tile: "—" });

  const hoverObjRef = React.useRef(null);
  const modeRef     = React.useRef(mode);
  const focusRef    = React.useRef(focusAddr);
  React.useEffect(() => { modeRef.current = mode; }, [mode]);
  React.useEffect(() => { focusRef.current = focusAddr; }, [focusAddr]);

  React.useEffect(() => {
    const THREE = window.THREE;
    if (!THREE) { console.warn("THREE not loaded"); return; }
    const mount = mountRef.current;
    if (!mount) return;

    const sz = () => ({ w: mount.clientWidth, h: mount.clientHeight });
    let { w, h } = sz();

    /* ---------- renderer / scene / camera ---------- */
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x04060d, 22, 38);

    const camera = new THREE.PerspectiveCamera(58, w / h, 0.3, 200);
    scene.add(new THREE.AmbientLight(0xffffff, 1.0));

    /* ---------- world configuration ---------- */
    // Smaller box → denser cluster around the camera. Fog hides the wrap.
    const BOX = new THREE.Vector3(26, 18, 26);
    const TILE_W = 3.0;
    const TILE_H = 4.0;

    /* ---------- camera state ---------- */
    // camera sits at origin (-ish) and rotates via yaw/pitch
    const cam = {
      pos:   new THREE.Vector3(0, 0, 0),
      yaw:   0,
      pitch: 0,
      // exposed velocity (units/sec along look axis)
      vel:   0,
    };
    const camTarget = { yaw: 0, pitch: 0 };

    function updateCameraTransform() {
      // Compose orientation
      const q = new THREE.Quaternion();
      const qy = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), cam.yaw);
      const qp = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), cam.pitch);
      q.multiplyQuaternions(qy, qp);
      camera.quaternion.copy(q);
      camera.position.copy(cam.pos);
    }
    updateCameraTransform();

    /* ---------- starfield (parallax — also wraps) ---------- */
    const starGeo = new THREE.BufferGeometry();
    const SC = 1400;
    const sPos = new Float32Array(SC * 3);
    for (let i = 0; i < SC; i++) {
      sPos[i*3+0] = (Math.random() - 0.5) * BOX.x * 2;
      sPos[i*3+1] = (Math.random() - 0.5) * BOX.y * 2;
      sPos[i*3+2] = (Math.random() - 0.5) * BOX.z * 2;
    }
    starGeo.setAttribute("position", new THREE.BufferAttribute(sPos, 3));
    const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({
      color: 0x5b6478, size: 0.06, sizeAttenuation: true, transparent: true, opacity: 0.7,
    }));
    scene.add(stars);
    stars.userData = { wrapScale: 2.0 };  // larger box for stars

    const sigStarGeo = new THREE.BufferGeometry();
    const SS = 220;
    const sigPos = new Float32Array(SS * 3);
    for (let i = 0; i < SS; i++) {
      sigPos[i*3+0] = (Math.random() - 0.5) * BOX.x * 1.6;
      sigPos[i*3+1] = (Math.random() - 0.5) * BOX.y * 1.6;
      sigPos[i*3+2] = (Math.random() - 0.5) * BOX.z * 1.6;
    }
    sigStarGeo.setAttribute("position", new THREE.BufferAttribute(sigPos, 3));
    const sigStars = new THREE.Points(sigStarGeo, new THREE.PointsMaterial({
      color: 0x00f0c8, size: 0.1, sizeAttenuation: true, transparent: true, opacity: 0.85,
    }));
    scene.add(sigStars);
    sigStars.userData = { wrapScale: 1.6 };

    /* ---------- tiles (project cards) — placed via Fibonacci to start, then drift on wrap ---------- */
    const tilesGroup = new THREE.Group();
    scene.add(tilesGroup);

    const tiles = [];
    const tileWires = [];
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    const N = projects.length;
    projects.forEach((p, i) => {
      const tex = makeTileTexture(p, THREE);
      const mat = new THREE.MeshBasicMaterial({
        map: tex, transparent: true, opacity: 1.0,
        side: THREE.DoubleSide, depthWrite: false,
      });
      const geo = new THREE.PlaneGeometry(TILE_W, TILE_H);
      const mesh = new THREE.Mesh(geo, mat);

      // initial Fibonacci-spread positions inside BOX — closer in for density
      const yN = 1 - (i / Math.max(1, N - 1)) * 2;
      const radial = Math.sqrt(1 - yN * yN);
      const theta = i * goldenAngle;
      const r = 0.55 + 0.30 * ((i * 13 % 100) / 100);
      mesh.position.set(
        Math.cos(theta) * radial * BOX.x * r * 0.55,
        yN * BOX.y * r * 0.6,
        Math.sin(theta) * radial * BOX.z * r * 0.55,
      );

      mesh.userData = { project: p, texture: tex, kind: "tile", index: i,
        // each card gets a small persistent rotational offset for personality
        offsetYaw:   ((i * 37 % 100) / 100 - 0.5) * 0.5,   // ±15°
        offsetPitch: ((i * 53 % 100) / 100 - 0.5) * 0.3,   // ±9°
        offsetRoll:  ((i * 29 % 100) / 100 - 0.5) * 0.18,  // ±5°
        wobble: { p: (i * 17 % 100) / 100, a: (i * 23 % 100) / 100 } };
      tilesGroup.add(mesh);
      tiles.push(mesh);

      // ---- per-tile 3D overlay
      // Two paths:
      //   (a) project has a `model` URL → load the GLB, apply matcap, drop it in
      //   (b) otherwise → procedural wireframe primitive as before
      // Both paths register a single "wire" entry in tileWires so the existing
      // follow/rotate/visibility logic in the frame loop works unchanged.
      if (p.model && window.loadProjectModel) {
        // Reserve a placeholder Group right away so frame ordering doesn't blink.
        const holder = new THREE.Group();
        holder.userData = {
          parentTile: mesh,
          prim: p.prim || "model",
          addr: p.addr,
          isModel: true,
          loaded: false,
        };
        holder.visible = false;
        tilesGroup.add(holder);
        tileWires.push(holder);

        window.loadProjectModel(p.model, THREE).then((root) => {
          // Centre + scale so longest edge ~2 world units; outer scale.setScalar
          // then matches what the wireframe used to do (0.28 of that).
          // Fit so longest edge = 2 world units; the frame loop then sets the
          // outer holder scale (≈0.85 idle, 1.10 on focus) so the model reads
          // as the card's hero, not a small inset.
          window.fitModelToSize(root, THREE, p.modelFit || 2);
          window.applyMatcapToModel(root, THREE);
          // Per-project rest pose for the GLB (Spline exports keep their own
          // orientation; this lets us point the keyboard face at the camera
          // for wafer, etc., instead of relying on the source pose).
          if (p.modelPose) {
            root.rotation.x += p.modelPose.x || 0;
            root.rotation.y += p.modelPose.y || 0;
            root.rotation.z += p.modelPose.z || 0;
          }
          holder.add(root);
          holder.visible = true;
          holder.userData.loaded = true;
        }).catch((err) => {
          console.warn("[universe] model load failed for " + p.addr, err);
        });
      } else if (p.prim && window.makePrimitiveMesh) {
        const wire = window.makePrimitiveMesh(p.prim, THREE, {
          wireframe: true,
          color: 0x00f0c8,
          opacity: 0.85,
        });
        wire.scale.setScalar(0.28);                  // tiny — fits in the upper area of the card
        wire.userData.parentTile = mesh;
        wire.userData.prim = p.prim;
        wire.userData.addr = p.addr;
        // Cone sits horizontally — same as on the project page
        if (p.prim === "cone") wire.rotation.set(0, 0, Math.PI / 2);
        tilesGroup.add(wire);
        tileWires.push(wire);
      }
    });

    /* ---------- Arranged-mode target positions ----------
       grid     : 4×3 wall in front of camera (z=-16)
       ambient  : 12 tiles on a Fibonacci sphere shell — slow ambient rotation
       drift    : null (free) */
    const GRID_COLS = 4;
    const GRID_ROWS = 3;
    const GRID_SPACING_X = 5.4;
    const GRID_SPACING_Y = 4.3;
    const GRID_Z = -16;
    function targetForTile(mode, i, t) {
      if (mode === "dive") {
        // Everything clears far out — only node 0x00 (the hub) remains, centered.
        const yN = 1 - (i / Math.max(1, projects.length - 1)) * 2;
        const theta = i * goldenAngle;
        return new THREE.Vector3(Math.cos(theta) * 22, yN * 13, -26 + Math.sin(theta) * 6);
      }
      if (mode === "origin") {
        const concept = (window.__mo_origin && window.__mo_origin.concept) || "assembly";
        const m = tiles[i];
        const addr = m && m.userData.project.addr;
        const fIdx = /^0x0[1-4]$/i.test(addr || "") ? (parseInt(addr, 16) - 1) : -1;
        // ASSEMBLY: clear ALL nodes far out so the particle glyph reads clean.
        if (concept === "assembly") {
          const yN = 1 - (i / Math.max(1, projects.length - 1)) * 2;
          const theta = i * goldenAngle;
          return new THREE.Vector3(Math.cos(theta) * 19, yN * 11, -22 + Math.sin(theta) * 5);
        }
        // HUB: featured nodes ring the hub, the rest drift back.
        if (fIdx >= 0) {
          const ang = (fIdx / 4) * Math.PI * 2 - Math.PI / 2 + t * 0.00004;
          return new THREE.Vector3(
            ORIGIN_CENTER.x + Math.cos(ang) * ORIGIN_RING_R,
            ORIGIN_CENTER.y + Math.sin(ang) * ORIGIN_RING_R * 0.62,
            ORIGIN_CENTER.z + Math.sin(ang * 1.3) * 1.4,
          );
        }
        const yN = 1 - (i / Math.max(1, projects.length - 1)) * 2;
        const theta = i * goldenAngle;
        return new THREE.Vector3(Math.cos(theta) * 16, yN * 9, -18 + Math.sin(theta) * 4);
      }
      if (mode === "grid") {
        const col = i % GRID_COLS;
        const row = Math.floor(i / GRID_COLS);
        return new THREE.Vector3(
          (col - (GRID_COLS - 1) / 2) * GRID_SPACING_X,
          ((GRID_ROWS - 1) / 2 - row) * GRID_SPACING_Y,
          GRID_Z,
        );
      }
      if (mode === "ambient") {
        // slow Fibonacci sphere shell ~12u radius — drift around it
        const yN = 1 - (i / Math.max(1, projects.length - 1)) * 2;
        const radial = Math.sqrt(1 - yN * yN);
        const theta = i * goldenAngle + t * 0.00006;
        const R = 13;
        return new THREE.Vector3(
          Math.cos(theta) * radial * R,
          yN * R * 0.6,
          Math.sin(theta) * radial * R - 4,
        );
      }
      return null; // drift
    }

    /* ---------- ambient nodes — small "0x__" sprites scattered for density ---------- */
    const ambient = [];
    const ambientGroup = new THREE.Group();
    scene.add(ambientGroup);
    const AMB_N = 180;
    for (let i = 0; i < AMB_N; i++) {
      const id = "0x" + (0x10 + i).toString(16).toUpperCase().padStart(2, "0");
      const tex = makeAmbientTexture(id, THREE);
      const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0.55, depthWrite: false });
      const sp = new THREE.Sprite(mat);
      sp.position.set(
        (Math.random() - 0.5) * BOX.x,
        (Math.random() - 0.5) * BOX.y,
        (Math.random() - 0.5) * BOX.z,
      );
      // small square-ish icon — matches v2 feel
      sp.scale.set(1.3, 1.3, 1);
      sp.userData = { phase: Math.random() * Math.PI * 2, kind: "ambient" };
      ambientGroup.add(sp);
      ambient.push(sp);
    }

    /* ---------- ORIGIN hub — node 0x00 (the self) ----------
       A special, larger node that only matters in `origin` mode. Every
       project node radiates from it. This is the literal target of the
       later "dive into node 0x00" → About · Board transition. */
    const ORIGIN_CENTER = new THREE.Vector3(0, 0, -9);   // in front of a levelled camera
    const ORIGIN_RING_R = 6.2;                            // project nodes ring radius

    function makeOriginTexture() {
      const oc = document.createElement("canvas");
      oc.width = 256; oc.height = 256;
      const g = oc.getContext("2d");
      g.clearRect(0, 0, 256, 256);
      const cx = 128, cy = 128;
      // concentric rings
      g.strokeStyle = "#00f0c8";
      for (let i = 0; i < 3; i++) {
        g.globalAlpha = 0.9 - i * 0.28;
        g.lineWidth = 2 - i * 0.4;
        g.beginPath(); g.arc(cx, cy, 30 + i * 26, 0, Math.PI * 2); g.stroke();
      }
      g.globalAlpha = 1;
      // crosshair ticks
      g.strokeStyle = "#00f0c8"; g.lineWidth = 1.5;
      [[0,-1],[0,1],[-1,0],[1,0]].forEach(([dx,dy]) => {
        g.beginPath();
        g.moveTo(cx + dx * 84, cy + dy * 84);
        g.lineTo(cx + dx * 98, cy + dy * 98);
        g.stroke();
      });
      // core
      g.fillStyle = "#00f0c8";
      g.beginPath(); g.arc(cx, cy, 7, 0, Math.PI * 2); g.fill();
      g.fillStyle = "#04060d";
      g.beginPath(); g.arc(cx, cy, 3, 0, Math.PI * 2); g.fill();
      const t = new THREE.CanvasTexture(oc);
      t.colorSpace = THREE.SRGBColorSpace;
      return t;
    }

    const originGroup = new THREE.Group();
    scene.add(originGroup);
    originGroup.visible = false;

    const originHub = new THREE.Sprite(new THREE.SpriteMaterial({
      map: makeOriginTexture(), transparent: true, opacity: 0, depthWrite: false, depthTest: false,
    }));
    originHub.position.copy(ORIGIN_CENTER);
    originHub.scale.set(4.2, 4.2, 1);
    originGroup.add(originHub);

    // radiating links hub → each featured project node (0x01–0x04)
    const featuredTiles = tiles.filter(m => /^0x0[1-4]$/i.test(m.userData.project.addr));
    const originLinks = featuredTiles.map((tile) => {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(6), 3));
      const line = new THREE.Line(geo, new THREE.LineBasicMaterial({
        color: 0x00f0c8, transparent: true, opacity: 0, depthWrite: false, depthTest: false,
      }));
      line.userData = { tile };
      originGroup.add(line);
      return line;
    });

    /* ---------- ASSEMBLY cloud — particles that swarm to FORM "0x00" ----------
       Concept 01. A dedicated point cloud whose rest state is scattered through
       the box; in origin/assembly mode each point flies to a target sampled from
       a canvas-rendered "0x00" glyph, giving a 3D constellation of the self. */
    function sampleGlyphTargets(text, count) {
      const cw = 640, ch = 260;
      const gc = document.createElement("canvas");
      gc.width = cw; gc.height = ch;
      const gx = gc.getContext("2d");
      gx.fillStyle = "#000"; gx.fillRect(0, 0, cw, ch);
      gx.fillStyle = "#fff";
      gx.textAlign = "center"; gx.textBaseline = "middle";
      gx.font = "700 200px 'Geist Mono', monospace";
      gx.fillText(text, cw / 2, ch / 2 + 6);
      const data = gx.getImageData(0, 0, cw, ch).data;
      const hits = [];
      for (let y = 0; y < ch; y += 3) {
        for (let x = 0; x < cw; x += 3) {
          if (data[(y * cw + x) * 4] > 128) hits.push([x, y]);
        }
      }
      // map sampled pixels into world-space targets centred on ORIGIN_CENTER
      const SCALE = 0.026;
      const out = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        const [px, py] = hits.length ? hits[(i * 37) % hits.length] : [cw / 2, ch / 2];
        out[i*3+0] = ORIGIN_CENTER.x + (px - cw / 2) * SCALE;
        out[i*3+1] = ORIGIN_CENTER.y - (py - ch / 2) * SCALE;
        out[i*3+2] = ORIGIN_CENTER.z + (Math.sin(i * 12.9898) * 0.5) * 1.6; // gentle depth
      }
      return out;
    }

    const ASM_N = 900;
    const asmTargets = sampleGlyphTargets("0x00", ASM_N);
    const asmGeo = new THREE.BufferGeometry();
    const asmPos = new Float32Array(ASM_N * 3);
    for (let i = 0; i < ASM_N; i++) {
      // rest state: scattered through the box
      asmPos[i*3+0] = (Math.random() - 0.5) * BOX.x;
      asmPos[i*3+1] = (Math.random() - 0.5) * BOX.y;
      asmPos[i*3+2] = (Math.random() - 0.5) * BOX.z;
    }
    asmGeo.setAttribute("position", new THREE.BufferAttribute(asmPos, 3));
    const asmRest = asmPos.slice();   // scattered rest state, for scroll scrub
    const assemblyPts = new THREE.Points(asmGeo, new THREE.PointsMaterial({
      color: 0x00f0c8, size: 0.075, sizeAttenuation: true,
      transparent: true, opacity: 0, depthWrite: false,
    }));
    const assemblyGroup = new THREE.Group();
    assemblyGroup.add(assemblyPts);
    assemblyGroup.visible = false;
    scene.add(assemblyGroup);

    /* ---------- wrap helper — keep object within [-half, +half] BOX around camera ---------- */
    function wrapAroundCamera(obj, box) {
      const dx = obj.position.x - cam.pos.x;
      const dy = obj.position.y - cam.pos.y;
      const dz = obj.position.z - cam.pos.z;
      if (dx >  box.x / 2) obj.position.x -= box.x;
      if (dx < -box.x / 2) obj.position.x += box.x;
      if (dy >  box.y / 2) obj.position.y -= box.y;
      if (dy < -box.y / 2) obj.position.y += box.y;
      if (dz >  box.z / 2) obj.position.z -= box.z;
      if (dz < -box.z / 2) obj.position.z += box.z;
    }

    /* ---------- input ---------- */
    let dragging = false, dragMoved = false;
    let lastX = 0, lastY = 0, downX = 0, downY = 0;
    let idleTimer = 0;
    let driftActive = true;
    // Pointer-in-zone tracking — wheel only flies the camera when the cursor
    // is over the universe mount (not over UI). Updated by pointer enter/leave.
    let pointerInZone = false;
    const stopDrift = () => {
      driftActive = false;
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => { driftActive = true; }, 3200);
    };

    mount.addEventListener("pointerenter", () => { pointerInZone = true;  });
    mount.addEventListener("pointerleave", () => { pointerInZone = false; });

    mount.addEventListener("pointerdown", (e) => {
      dragging = true; dragMoved = false;
      lastX = downX = e.clientX; lastY = downY = e.clientY;
      mount.style.cursor = "grabbing";
      stopDrift();
      mount.setPointerCapture(e.pointerId);
    });
    mount.addEventListener("pointerup", (e) => {
      if (!dragging) return;
      dragging = false;
      mount.style.cursor = "grab";
      try { mount.releasePointerCapture(e.pointerId); } catch (_) {}
      if (!dragMoved) handleClick(e.clientX, e.clientY);
    });
    mount.addEventListener("pointercancel", () => { dragging = false; mount.style.cursor = "grab"; });
    mount.addEventListener("pointerleave", () => {
      hoverObjRef.current = null;
      setHover(null);
    });
    mount.addEventListener("pointermove", (e) => {
      if (dragging) {
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        lastX = e.clientX; lastY = e.clientY;
        if (Math.abs(e.clientX - downX) + Math.abs(e.clientY - downY) > 6) dragMoved = true;
        camTarget.yaw   -= dx * 0.0035;
        camTarget.pitch -= dy * 0.0035;
        camTarget.pitch = Math.max(-1.45, Math.min(1.45, camTarget.pitch));
        hoverObjRef.current = null;
        setHover(null);
      } else {
        handleHover(e.clientX, e.clientY);
      }
    });

    // Wheel: fly the camera only when the pointer is inside the universe zone
    // AND we're in drift mode (title/intro). Otherwise pass-through to page scroll.
    mount.addEventListener("wheel", (e) => {
      if (!pointerInZone) return;
      if (modeRef.current !== "drift") return;
      e.preventDefault();
      cam.vel += -e.deltaY * 0.025;
      cam.vel = Math.max(-22, Math.min(22, cam.vel));
      stopDrift();
    }, { passive: false });

    /* ---------- raycasting ---------- */
    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    function pickAt(clientX, clientY) {
      const rect = mount.getBoundingClientRect();
      ndc.x =  ((clientX - rect.left) / rect.width)  * 2 - 1;
      ndc.y = -((clientY - rect.top)  / rect.height) * 2 + 1;
      raycaster.setFromCamera(ndc, camera);
      const hits = raycaster.intersectObjects(tiles, false);
      return hits[0] || null;
    }

    /* ---------- screen-space tile bounds (tight) ---------- */
    const v3 = new THREE.Vector3();
    const camDirTmp = new THREE.Vector3();
    function tileScreenBounds(mesh) {
      const rect = mount.getBoundingClientRect();
      const hw = TILE_W / 2, hh = TILE_H / 2;
      const corners = [
        new THREE.Vector3(-hw, -hh, 0),
        new THREE.Vector3( hw, -hh, 0),
        new THREE.Vector3(-hw,  hh, 0),
        new THREE.Vector3( hw,  hh, 0),
      ];
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      camera.getWorldDirection(camDirTmp);
      for (const c of corners) {
        v3.copy(c);
        mesh.localToWorld(v3);
        // skip overlay if any corner is behind the camera
        const camRel = v3.clone().sub(camera.position);
        if (camRel.dot(camDirTmp) <= 0) return null;
        v3.project(camera);
        const sx = ( v3.x * 0.5 + 0.5) * rect.width;
        const sy = (-v3.y * 0.5 + 0.5) * rect.height;
        if (sx < minX) minX = sx;
        if (sx > maxX) maxX = sx;
        if (sy < minY) minY = sy;
        if (sy > maxY) maxY = sy;
      }
      return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
    }

    function handleHover(cx, cy) {
      const hit = pickAt(cx, cy);
      if (!hit) {
        if (hoverObjRef.current) { hoverObjRef.current = null; setHover(null); }
        return;
      }
      const m = hit.object;
      const screen = tileScreenBounds(m);
      if (!screen) return;
      hoverObjRef.current = m;
      setHover({ project: m.userData.project, screen });
    }

    function handleClick(cx, cy) {
      const hit = pickAt(cx, cy);
      if (!hit) return;
      const m = hit.object;
      const p = m.userData.project;

      // Aim the camera at the tile first so the screen composes around it.
      const rel = m.position.clone().sub(cam.pos);
      const yaw = Math.atan2(rel.x, -rel.z);
      const flat = Math.sqrt(rel.x * rel.x + rel.z * rel.z);
      const pitch = Math.atan2(rel.y, flat);
      camTarget.yaw   = nearestAngle(camTarget.yaw, yaw);
      camTarget.pitch = Math.max(-1.45, Math.min(1.45, pitch));

      // If this project has its own page, fly to it.
      if (p.file) {
        cam.vel = Math.max(cam.vel, 6);   // small forward dolly = "clicking into"
        navigateToProject(p);
        return;
      }

      cam.vel = Math.max(cam.vel, 0);
      setActiveAddr(p.addr);
      if (onActive) onActive(p);
      stopDrift();
    }

    function navigateToProject(p) {
      sessionStorage.setItem("mo_navigate_from_addr", p.addr);
      document.body.classList.add("landing-exit");
      setTimeout(() => { window.location.href = p.file; }, 380);
    }

    function nearestAngle(cur, t) {
      while (t - cur > Math.PI)  t -= Math.PI * 2;
      while (t - cur < -Math.PI) t += Math.PI * 2;
      return t;
    }

    /* ---------- resize ---------- */
    const onResize = () => {
      const s = sz(); w = s.w; h = s.h;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", onResize);
    const ro = new ResizeObserver(onResize);
    ro.observe(mount);

    /* ---------- loop ---------- */
    let raf;
    let last = performance.now();
    let frameI = 0;
    const FORWARD = new THREE.Vector3();

    let prevMode = mode;
    function scatterTiles() {
      // Pick a fresh random spot per tile (centred on camera) and store it as a
      // drift target. The tile keeps its current position; the drift-mode loop
      // lerps toward this target so leaving grid/ambient looks smooth either
      // direction, instead of snapping + fading in.
      for (const m of tiles) {
        const yN = 1 - (m.userData.index / Math.max(1, projects.length - 1)) * 2;
        const radial = Math.sqrt(1 - yN * yN);
        // jitter the theta each scatter so it doesn't always come back the same way
        const theta = m.userData.index * goldenAngle + (Math.random() - 0.5) * 1.5;
        const r = 0.55 + 0.30 * Math.random();
        m.userData.driftTarget = new THREE.Vector3(
          cam.pos.x + Math.cos(theta) * radial * BOX.x * r * 0.55,
          cam.pos.y + yN * BOX.y * r * 0.6 + (Math.random() - 0.5) * 4,
          cam.pos.z + Math.sin(theta) * radial * BOX.z * r * 0.55,
        );
      }
    }

    function frame(now) {
      // Paused while the inline board flight covers the viewport — saves the GPU
      // from rendering two WebGL scenes at once. dt is reset so resume won't jump.
      if (window.__mo_universe_pause) { last = now; raf = requestAnimationFrame(frame); return; }
      const dt = Math.min(50, now - last); last = now;
      const mode = modeRef.current;
      const focusAddrNow = focusRef.current;
      const isArranged = (mode === "grid" || mode === "ambient" || mode === "origin" || mode === "dive");

      // Detect mode change. Going from an arranged mode back to drift needs
      // a fresh scatter — otherwise the cards stay locked forever.
      if (mode !== prevMode) {
        if (mode === "drift" && (prevMode === "grid" || prevMode === "ambient" || prevMode === "origin" || prevMode === "dive")) {
          scatterTiles();
        }
        prevMode = mode;
      }

      /* idle drift — only in drift mode */
      if (driftActive && mode === "drift") {
        cam.vel += dt * 0.0008;     // tiny accel toward forward drift
        camTarget.yaw += dt * 0.00006;
        camTarget.pitch += Math.sin(now * 0.00022) * dt * 0.00003;
      }

      /* In arranged modes, ease camera back toward origin/level */
      if (isArranged) {
        cam.vel *= Math.pow(0.86, dt / 16);
        camTarget.yaw   *= Math.pow(0.92, dt / 16);
        camTarget.pitch *= Math.pow(0.92, dt / 16);
        // also pull cam.pos toward origin
        cam.pos.multiplyScalar(Math.pow(0.94, dt / 16));
      }

      /* damping on velocity */
      cam.vel *= Math.pow(0.92, dt / 16);
      // clamp tiny
      if (Math.abs(cam.vel) < 0.04) cam.vel = 0;

      /* ease camera angles */
      const k = 1 - Math.pow(0.001, dt / 1000);
      cam.yaw   += (camTarget.yaw   - cam.yaw)   * k;
      cam.pitch += (camTarget.pitch - cam.pitch) * k;
      cam.pitch = Math.max(-1.45, Math.min(1.45, cam.pitch));

      /* advance position along current look direction */
      updateCameraTransform();
      camera.getWorldDirection(FORWARD);
      cam.pos.addScaledVector(FORWARD, cam.vel * dt / 1000);

      // Re-apply position
      camera.position.copy(cam.pos);

      /* wrap drifting objects — only in free drift mode */
      if (mode === "drift") {
        for (const m of tiles) {
          // If a fresh drift target was queued on mode-change, ease toward it
          // and DO NOT wrap — grid/ambient positions sit outside the wrap box
          // (z = ±16 vs box half-depth 13), so wrapping here would teleport the
          // tile across the camera before the lerp could play. Skip the wrap
          // until we've landed inside the box, then resume normal wrapping.
          const dt2 = m.userData.driftTarget;
          if (dt2) {
            const rate = 0.025;          // matches forward grid → ambient feel
            m.position.lerp(dt2, 1 - Math.pow(1 - rate, dt / 16));
            if (m.position.distanceToSquared(dt2) < 0.09) {
              m.userData.driftTarget = null;
            }
          } else {
            wrapAroundCamera(m, BOX);
          }
        }
      }
      for (const sp of ambient) wrapAroundCamera(sp, BOX);
      // stars wrap in a larger box for parallax illusion
      const SBOX = BOX.clone().multiplyScalar(stars.userData.wrapScale);
      const SgBOX = BOX.clone().multiplyScalar(sigStars.userData.wrapScale);
      wrapPointsAroundCamera(stars,    SBOX);
      wrapPointsAroundCamera(sigStars, SgBOX);

      /* small per-tile overlays — wireframe primitives OR loaded GLBs.
         Both branches follow their parent tile, rotate, and fade with it.
         Models are centred on the card face and pushed further toward camera
         so they read as the hero element; wireframes sit small above the art. */
      for (const wire of tileWires) {
        const parent = wire.userData.parentTile;
        if (!parent) continue;
        const isModel = !!wire.userData.isModel;
        // Offset toward viewer — bigger for full models so they clear the card.
        const camDir = new THREE.Vector3();
        camera.getWorldDirection(camDir);
        const forwardDist = isModel ? 1.4 : 0.6;
        const off = camDir.clone().multiplyScalar(-forwardDist);
        // Card-local offset: models can be nudged to their visual centre;
        // wireframes stay just above the card art.
        const modelOffset = isModel ? (parent.userData.project.modelOffset || {}) : {};
        const localOffset = new THREE.Vector3(
          modelOffset.x || 0,
          isModel ? (modelOffset.y || 0) : parent.scale.y * 1.05,
          modelOffset.z || 0,
        ).applyQuaternion(parent.quaternion);
        wire.position.set(
          parent.position.x + off.x + localOffset.x,
          parent.position.y + off.y + localOffset.y,
          parent.position.z + off.z + localOffset.z,
        );
        // Continuous slow rotation. Loaded GLBs are the "hero" presentation —
        // they get a gentle yaw-only drift so the form stays readable and
        // mostly faces the camera. Wireframe primitives still tumble as
        // before (cheap, abstract, more decorative).
        if (isModel) {
          wire.rotation.y += 0.0025;
        } else if (wire.userData.prim === "cone") {
          wire.rotation.y += 0.012;
        } else {
          wire.rotation.y += 0.010;
          wire.rotation.x += 0.004;
        }
        // Match parent visibility
        const tileOp = parent.material.opacity;
        const overlayOp = Math.min(0.95, tileOp * 1.15);
        if (isModel) {
          // Loaded GLB — fade every matcap material in the subtree, and hide
          // the whole group below a threshold so we don't pay for invisible draws.
          if (wire.userData.loaded) {
            wire.visible = overlayOp > 0.02;
            wire.traverse((obj) => {
              if (obj.isMesh && obj.material) obj.material.opacity = overlayOp;
            });
          }
        } else {
          // Procedural wireframe primitive — single material
          wire.material.opacity = overlayOp;
        }
        // Pop with focus — models start much larger than wireframes.
        const isFocused = focusAddrNow && wire.userData.addr === focusAddrNow;
        const baseScale  = isModel ? 0.85 : 0.28;
        const focusScale = isModel ? 1.10 : 0.42;
        const targetScale = isFocused ? focusScale : baseScale;
        wire.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.10);
      }

      /* tiles: position-lerp to arranged targets, then orient */
      for (const m of tiles) {
        const target = targetForTile(mode, m.userData.index, now);
        if (target) {
          // ease toward target; rate depends on distance for snappy arrange
          const rate = mode === "grid" ? 0.055 : 0.025;
          m.position.lerp(target, 1 - Math.pow(1 - rate, dt / 16));
        }

        // For meshes (not cameras), Object3D.lookAt aligns local +Z to target.
        // PlaneGeometry's visible face IS the +Z face — so look AT the camera.
        const lookM = new THREE.Matrix4().lookAt(camera.position, m.position, camera.up);
        const baseQ = new THREE.Quaternion().setFromRotationMatrix(lookM);

        // Per-card constant offset so each tile floats at its own angle (suppressed in grid)
        const offFactor = mode === "grid" ? 0.15 : 1.0;
        const offQ = new THREE.Quaternion()
          .setFromEuler(new THREE.Euler(
            m.userData.offsetPitch * offFactor,
            m.userData.offsetYaw   * offFactor,
            (m.userData.offsetRoll + Math.sin(now * 0.0006 + m.userData.wobble.p * 6) * 0.04) * offFactor,
            "YXZ"
          ));
        baseQ.multiply(offQ);

        // SOFT slerp — cards re-orient slowly so they feel like floating objects
        m.quaternion.slerp(baseQ, mode === "grid" ? 0.12 : 0.06);

        // Band-pass visibility per mode
        const dist = m.position.distanceTo(camera.position);
        let nearIn, farOut;
        if (mode === "grid") {
          nearIn  = THREE.MathUtils.smoothstep(dist, 2.0, 6.0);
          farOut  = THREE.MathUtils.smoothstep(dist, 26, 40);
        } else if (mode === "ambient") {
          nearIn  = THREE.MathUtils.smoothstep(dist, 2.5, 6.0);
          farOut  = THREE.MathUtils.smoothstep(dist, 18, 28);
        } else {
          nearIn  = THREE.MathUtils.smoothstep(dist, 2.5, 6.0);
          farOut  = THREE.MathUtils.smoothstep(dist, 20, 32);
        }
        let opacity = nearIn * (1 - farOut);
        if (mode === "ambient") opacity *= 0.38;   // recede behind content
        if (mode === "grid"   ) opacity *= 0.92;   // slightly tame so HUD reads

        // Focus highlight — pop the matching tile
        const isFocused = focusAddrNow && m.userData.project.addr === focusAddrNow;
        if (isFocused) {
          opacity = Math.min(1, opacity * 1.6 + 0.25);
          const targetScale = 1.18;
          m.scale.lerp(new THREE.Vector3(targetScale, targetScale, 1), 0.14);
        } else {
          m.scale.lerp(new THREE.Vector3(1, 1, 1), 0.10);
        }
        m.material.opacity = opacity;
      }

      /* ambient pulse */
      for (const sp of ambient) {
        const phase = sp.userData.phase + now * 0.0008;
        const dist  = sp.position.distanceTo(camera.position);
        const nearIn = THREE.MathUtils.smoothstep(dist, 1.5, 5.0);
        const farOut = THREE.MathUtils.smoothstep(dist, 22, 32);
        const pulse  = 0.65 + Math.sin(phase) * 0.20;
        let aOp = pulse * nearIn * (1 - farOut);
        if (mode !== "drift") aOp *= 0.35;
        sp.material.opacity = aOp;
      }

      /* hover overlay tracking */
      if (hoverObjRef.current && overlayRef.current) {
        const m = hoverObjRef.current;
        const screen = tileScreenBounds(m);
        const el = overlayRef.current;
        if (screen) {
          el.style.display = "";
          el.style.left = Math.round(screen.x) + "px";
          el.style.top  = Math.round(screen.y) + "px";
          el.style.width  = Math.round(screen.w) + "px";
          el.style.height = Math.round(screen.h) + "px";
        } else {
          el.style.display = "none";
        }
      }

      /* ---------- ORIGIN mode visuals (concepts 01 ASSEMBLY / 02 HUB) ---------- */
      {
        const inOrigin = (mode === "origin");
        window.__mo_debug = { mode, inOrigin, camZ: +cam.pos.z.toFixed(2), yaw: +cam.yaw.toFixed(2) };
        const ob = window.__mo_origin || { p: 0, concept: "assembly" };
        const concept = ob.concept || "assembly";
        const op = Math.max(0, Math.min(1, ob.p || 0));
        const eP = op < 0.5 ? 2*op*op : 1 - Math.pow(-2*op+2, 2)/2;  // easeInOut

        // ---- HUB ----
        const showHub = inOrigin && concept === "hub";
        originGroup.visible = showHub;
        if (showHub) {
          const hubOp = 0.25 + eP * 0.75;
          originHub.material.opacity = hubOp;
          const pulse = 1 + Math.sin(now * 0.0025) * 0.04;
          originHub.scale.set(4.2 * pulse, 4.2 * pulse, 1);
          for (const link of originLinks) {
            const tile = link.userData.tile;
            const arr = link.geometry.attributes.position.array;
            arr[0] = ORIGIN_CENTER.x; arr[1] = ORIGIN_CENTER.y; arr[2] = ORIGIN_CENTER.z;
            arr[3] = tile.position.x; arr[4] = tile.position.y; arr[5] = tile.position.z;
            link.geometry.attributes.position.needsUpdate = true;
            link.material.opacity = eP * 0.45;
          }
        }

        // ---- ASSEMBLY ----
        const showAsm = inOrigin && concept === "assembly";
        assemblyGroup.visible = showAsm;
        if (showAsm) {
          assemblyGroup.position.set(0, 0, 0);
          const arr = assemblyPts.geometry.attributes.position.array;
          const C = ORIGIN_CENTER;
          const ang = now * 0.00018;           // gentle rotation of the formed glyph
          const ca = Math.cos(ang), sa = Math.sin(ang);
          const breathe = 1 + Math.sin(now * 0.0012) * 0.03;
          const k = 1 - Math.pow(0.001, dt / 1000);
          for (let i = 0; i < ASM_N; i++) {
            const j = i * 3;
            // target, rotated about C's vertical axis + breathing
            let dx = (asmTargets[j]   - C.x) * breathe;
            let dy = (asmTargets[j+1] - C.y) * breathe;
            let dz = (asmTargets[j+2] - C.z);
            const rx = dx * ca - dz * sa;
            const rz = dx * sa + dz * ca;
            const tX = C.x + rx, tY = C.y + dy, tZ = C.z + rz;
            // blend scattered rest → formed target by scroll
            const desX = asmRest[j]   + (tX - asmRest[j])   * eP;
            const desY = asmRest[j+1] + (tY - asmRest[j+1]) * eP;
            const desZ = asmRest[j+2] + (tZ - asmRest[j+2]) * eP;
            arr[j]   += (desX - arr[j])   * k;
            arr[j+1] += (desY - arr[j+1]) * k;
            arr[j+2] += (desZ - arr[j+2]) * k;
          }
          assemblyPts.geometry.attributes.position.needsUpdate = true;
          assemblyPts.material.opacity = 0.12 + eP * 0.8;
          assemblyPts.material.size = 0.06 + eP * 0.03;
        }

        // ---- DIVE (about gateway → board): node 0x00 as the dive target ----
        const inDive = (mode === "dive");
        if (inDive) {
          const db = window.__mo_dive || { p: 0, igniting: false };
          const dp  = Math.max(0, Math.min(1, db.p || 0));
          const eD  = dp < 0.5 ? 2*dp*dp : 1 - Math.pow(-2*dp+2, 2)/2;

          // ignition timer (set once when the dive fires)
          if (db.igniting && !db._t0) db._t0 = now;
          const igT = db._t0 ? Math.max(0, Math.min(1, (now - db._t0) / 720)) : 0;
          const igE = igT * igT;  // easeIn — accelerates into the board

          // render the formed "0x00" node (reuse the assembly cloud, fully formed)
          assemblyGroup.visible = true;
          const arr = assemblyPts.geometry.attributes.position.array;
          const C = ORIGIN_CENTER;
          const ang = now * 0.00024;
          const ca = Math.cos(ang), sa = Math.sin(ang);
          const breathe = 1 + Math.sin(now * 0.0013) * 0.03;
          const k = 1 - Math.pow(0.0006, dt / 1000);
          for (let i = 0; i < ASM_N; i++) {
            const j = i * 3;
            let dx = (asmTargets[j]   - C.x) * breathe;
            let dy = (asmTargets[j+1] - C.y) * breathe;
            let dz = (asmTargets[j+2] - C.z);
            const rx = dx * ca - dz * sa;
            const rz = dx * sa + dz * ca;
            // formed strength rises with scroll; never fully scatters in dive mode
            const form = 0.35 + eD * 0.65;
            const tX = C.x + rx * form, tY = C.y + dy * form, tZ = C.z + rz * form;
            const desX = asmRest[j]   + (tX - asmRest[j])   * form;
            const desY = asmRest[j+1] + (tY - asmRest[j+1]) * form;
            const desZ = asmRest[j+2] + (tZ - asmRest[j+2]) * form;
            arr[j]   += (desX - arr[j])   * k;
            arr[j+1] += (desY - arr[j+1]) * k;
            arr[j+2] += (desZ - arr[j+2]) * k;
          }
          assemblyPts.geometry.attributes.position.needsUpdate = true;
          assemblyPts.material.opacity = 0.16 + eD * 0.34 + igE * 0.4;
          assemblyPts.material.size = 0.06 + eD * 0.025 + igE * 0.5;

          // rush the node at the camera on ignition: bring group forward + scale up
          assemblyGroup.position.y = 1.5;                 // lift behind the headline (halo, not over body)
          assemblyGroup.position.z = igE * (Math.abs(C.z) + 6);
          const gs = 1 + igE * 4.5;
          assemblyGroup.scale.set(gs, gs, gs);
        } else if (window.__mo_dive && window.__mo_dive._t0) {
          // reset after leaving dive mode
          window.__mo_dive._t0 = 0; window.__mo_dive.igniting = false;
          assemblyGroup.position.set(0, 0, 0); assemblyGroup.scale.set(1, 1, 1);
        }
      }

      /* status ~ 3hz */
      frameI++;
      if (frameI % 18 === 0) {
        const yawDeg = ((cam.yaw * 180 / Math.PI) % 360 + 360) % 360;
        setStatus({
          yaw: yawDeg.toFixed(0).padStart(3, "0"),
          pit: (cam.pitch * 180 / Math.PI).toFixed(0),
          vel: cam.vel.toFixed(1),
          tile: hoverObjRef.current?.userData?.project?.addr || activeAddr || "—",
        });
      }

      renderer.render(scene, camera);
      raf = requestAnimationFrame(frame);
    }

    /* Wrap Points buffer attribute around camera (only modify entries that wrap) */
    function wrapPointsAroundCamera(points, box) {
      const attr = points.geometry.attributes.position;
      const arr  = attr.array;
      let dirty = false;
      for (let i = 0; i < arr.length; i += 3) {
        let dx = arr[i+0] - cam.pos.x;
        let dy = arr[i+1] - cam.pos.y;
        let dz = arr[i+2] - cam.pos.z;
        if (dx >  box.x / 2) { arr[i+0] -= box.x; dirty = true; }
        else if (dx < -box.x / 2) { arr[i+0] += box.x; dirty = true; }
        if (dy >  box.y / 2) { arr[i+1] -= box.y; dirty = true; }
        else if (dy < -box.y / 2) { arr[i+1] += box.y; dirty = true; }
        if (dz >  box.z / 2) { arr[i+2] -= box.z; dirty = true; }
        else if (dz < -box.z / 2) { arr[i+2] += box.z; dirty = true; }
      }
      if (dirty) attr.needsUpdate = true;
    }

    raf = requestAnimationFrame(frame);
    mount.style.cursor = "grab";

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(idleTimer);
      window.removeEventListener("resize", onResize);
      ro.disconnect();
      try { mount.removeChild(renderer.domElement); } catch (_) {}
      renderer.dispose();
      tiles.forEach(m => { m.geometry.dispose(); m.material.map?.dispose(); m.material.dispose(); });
      tileWires.forEach(w => {
        if (w.userData && w.userData.isModel) {
          w.traverse((obj) => {
            if (obj.isMesh) {
              obj.geometry?.dispose();
              obj.material?.dispose();
            }
          });
        } else {
          w.geometry?.dispose();
          w.material?.dispose();
        }
      });
      ambient.forEach(s => { s.material.map?.dispose(); s.material.dispose(); });
      starGeo.dispose(); sigStarGeo.dispose();
      asmGeo.dispose(); assemblyPts.material.dispose();
      originHub.material.map?.dispose(); originHub.material.dispose();
      originLinks.forEach(l => { l.geometry.dispose(); l.material.dispose(); });
    };
  }, []);

  return (
    <div className="universe" data-screen-label="01 Universe">
      <div className="universe__mount" ref={mountRef} />

      {hover && (
        <pre
          className="universe__ascii"
          ref={overlayRef}
          style={{
            left:   Math.round(hover.screen.x),
            top:    Math.round(hover.screen.y),
            width:  Math.round(hover.screen.w),
            height: Math.round(hover.screen.h),
          }}
        >
          {asciiBody(hover.project, hover.screen)}
        </pre>
      )}

      <div className="universe__reticle" aria-hidden="true">
        <span /><span /><span /><span />
      </div>

      {/* center crosshair removed per request */}

      <div className="universe__hud universe__hud--bl">
        <div className="universe__hudRow"><span className="universe__hudKey">YAW</span><span className="universe__hudVal">{status.yaw}°</span></div>
        <div className="universe__hudRow"><span className="universe__hudKey">PITCH</span><span className="universe__hudVal">{status.pit}°</span></div>
        <div className="universe__hudRow"><span className="universe__hudKey">VEL</span><span className="universe__hudVal">{status.vel}</span></div>
        <div className="universe__hudRow"><span className="universe__hudKey">FOCUS</span><span className="universe__hudVal">{status.tile}</span></div>
      </div>
      <div className="universe__hud universe__hud--br">
        <div className="universe__hudRow"><span className="universe__hudKey">DRAG</span><span className="universe__hudVal">ROTATE</span></div>
        <div className="universe__hudRow"><span className="universe__hudKey">WHEEL</span><span className="universe__hudVal">FLY</span></div>
        <div className="universe__hudRow"><span className="universe__hudKey">CLICK</span><span className="universe__hudVal">AIM</span></div>
        <div className="universe__hudRow"><span className="universe__hudKey">SPACE</span><span className="universe__hudVal">∞</span></div>
      </div>
    </div>
  );
}

window.Universe = Universe;
