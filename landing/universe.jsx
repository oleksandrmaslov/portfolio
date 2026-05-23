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
  { addr: "0x01", kind: "wafer",  prim: "slab",   file: "Wafer.html",               name: "Wafer",                  sub: "36-key ultrathin split keyboard", year: "2025",   stack: "ZMK · KICAD · NRF52840", color: "#0d1018" },
  { addr: "0x02", kind: "kerfur", prim: "sphere", file: "Kerfur.html",              name: "Kerfur",                 sub: "Embedded pet · event bus",        year: "2025 —", stack: "C · ZEPHYR · LVGL · BLE", color: "#0e1118" },
  { addr: "0x03", kind: "accel",  prim: "torus",  file: "ZMK-PointAccel.html",      name: "ZMK PointAccel",         sub: "Open-source input processor",     year: "2025",   stack: "C · DEVICETREE · ZMK",   color: "#0d1119" },
  { addr: "0x04", kind: "torch",  prim: "cone",   file: "Tactical-Flashlight.html", name: "Tactical Flashlight",    sub: "For Energy for Ukraine",          year: "12/25",  stack: "C · ARM-M0 · KICAD",     color: "#0e1018" },
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

  x.save();
  x.translate(270, 320);
  x.strokeStyle = "#00f0c8";
  x.fillStyle = "#00f0c8";
  x.lineWidth = 1.4;
  drawGraphic(x, p);
  x.restore();

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

      // ---- small wireframe primitive overlay: only on cards that map to a real project page
      if (p.prim && window.makePrimitiveMesh) {
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
      const dt = Math.min(50, now - last); last = now;
      const mode = modeRef.current;
      const focusAddrNow = focusRef.current;
      const isArranged = (mode === "grid" || mode === "ambient");

      // Detect mode change. Going from an arranged mode back to drift needs
      // a fresh scatter — otherwise the cards stay locked in 4×3 forever.
      if (mode !== prevMode) {
        if (mode === "drift" && (prevMode === "grid" || prevMode === "ambient")) {
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
          // (this is what makes grid/ambient → drift transitions glide rather
          // than snap). Clear once we're close so normal wrapping resumes.
          const dt2 = m.userData.driftTarget;
          if (dt2) {
            const rate = 0.04;
            m.position.lerp(dt2, 1 - Math.pow(1 - rate, dt / 16));
            if (m.position.distanceToSquared(dt2) < 0.09) {
              m.userData.driftTarget = null;
            }
          }
          wrapAroundCamera(m, BOX);
        }
      }
      for (const sp of ambient) wrapAroundCamera(sp, BOX);
      // stars wrap in a larger box for parallax illusion
      const SBOX = BOX.clone().multiplyScalar(stars.userData.wrapScale);
      const SgBOX = BOX.clone().multiplyScalar(sigStars.userData.wrapScale);
      wrapPointsAroundCamera(stars,    SBOX);
      wrapPointsAroundCamera(sigStars, SgBOX);

      /* small wireframe primitives — follow their parent tile + rotate */
      for (const wire of tileWires) {
        const parent = wire.userData.parentTile;
        if (!parent) continue;
        // Offset toward viewer slightly so they read above the card art
        const camDir = new THREE.Vector3();
        camera.getWorldDirection(camDir);
        const off = camDir.clone().multiplyScalar(-0.6);  // toward camera
        wire.position.set(
          parent.position.x + off.x,
          parent.position.y + parent.scale.y * 1.05 + off.y,   // a touch above
          parent.position.z + off.z,
        );
        // Continuous slow rotation
        if (wire.userData.prim === "cone") {
          wire.rotation.y += 0.012;
        } else {
          wire.rotation.y += 0.010;
          wire.rotation.x += 0.004;
        }
        // Match parent visibility
        const tileOp = parent.material.opacity;
        wire.material.opacity = Math.min(0.95, tileOp * 1.15);
        // Pop with focus
        const isFocused = focusAddrNow && wire.userData.addr === focusAddrNow;
        const targetScale = isFocused ? 0.42 : 0.28;
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
      tileWires.forEach(w => { w.geometry.dispose(); w.material.dispose(); });
      ambient.forEach(s => { s.material.map?.dispose(); s.material.dispose(); });
      starGeo.dispose(); sigStarGeo.dispose();
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
