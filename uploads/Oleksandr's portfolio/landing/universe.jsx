/* ============================================================
   M.O. SYSTEM — Universe v2
   WebGL project universe — Fibonacci-sphere layout.
   Drag orbits the camera · Wheel dollies in/out · Click flies to a tile
   Idle slowly drifts.

   v1 (sparse free-pan) lives in landing/_unused/universe-v1-sparse.jsx
   ============================================================ */

const PROJECTS = [
  { addr: "0x01", kind: "wafer",  name: "Wafer",                       sub: "36-key ultrathin split keyboard", year: "2025",   stack: "ZMK · KICAD · NRF52840", color: "#0d1018" },
  { addr: "0x02", kind: "kerfur", name: "Kerfur",                      sub: "Embedded pet · event bus",        year: "2025 —", stack: "C · ZEPHYR · LVGL · BLE", color: "#0e1118" },
  { addr: "0x03", kind: "accel",  name: "ZMK PointAccel",              sub: "Open-source input processor",     year: "2025",   stack: "C · DEVICETREE · ZMK",   color: "#0d1119" },
  { addr: "0x04", kind: "torch",  name: "Tactical Flashlight",         sub: "For Energy for Ukraine",          year: "12/25",  stack: "C · ARM-M0 · KICAD",     color: "#0e1018" },
  { addr: "0x05", kind: "node",   name: "ZMK upstream",                sub: "Voltage IIO merge · PMIC driver", year: "2025",   stack: "ZEPHYR · DT · I2C",      color: "#0d1018" },
  { addr: "0x06", kind: "node",   name: "Matterium",                   sub: "Matter / Thread experiments",     year: "2024",   stack: "MATTER · OPENTHREAD",    color: "#0e1119" },
  { addr: "0x07", kind: "node",   name: "Catloading",                  sub: "Loading screen · meow OS",        year: "2024",   stack: "JS · WEBGL · GLSL",      color: "#0d1018" },
  { addr: "0x08", kind: "node",   name: "view-elemental",              sub: "Periodic table viewer",           year: "2023",   stack: "REACT · D3 · CHEM",      color: "#0e1118" },
  { addr: "0x09", kind: "node",   name: "Wafer R1 → R3",               sub: "Revision history · KiCad",        year: "2024-5", stack: "KICAD · CHANGELOG",      color: "#0d1018" },
  { addr: "0x0A", kind: "node",   name: "Kerfur Beacons",              sub: "Peer-to-peer rotating IDs",       year: "2025",   stack: "BLE · CRYPTO · BEACON",  color: "#0e1018" },
  { addr: "0x0B", kind: "node",   name: "PMIC Driver",                 sub: "NPM1300 register interface",      year: "2025",   stack: "C · I2C · ZEPHYR",       color: "#0d1119" },
  { addr: "0x0C", kind: "node",   name: "Streamlit Configurator",      sub: "PointAccel devicetree emit",      year: "2025",   stack: "PYTHON · STREAMLIT",     color: "#0e1018" },
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
   Hover ASCII — sized exactly to projected tile bounds
   ============================================================ */
const ASCII_CHAR_W = 5.4;   // 9px Geist Mono — measured ratio
const ASCII_CHAR_H = 9.5;
const ASCII_RAMP   = " .·:-=+*#%@";

function AsciiTile({ project, screen }) {
  const { x, y, w, h } = screen;

  const cols = Math.max(14, Math.floor(w / ASCII_CHAR_W));
  const rows = Math.max(10, Math.floor(h / ASCII_CHAR_H));

  const content = React.useMemo(() => {
    const out = [];
    // top header
    const t1 = "■ " + project.addr;
    const t2 = project.year.toUpperCase();
    const headerSpace = Math.max(1, cols - t1.length - t2.length);
    out.push(t1 + " ".repeat(headerSpace) + t2);
    // divider
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
    const opn = "OPEN →";
    out.push(opn.slice(0, cols).padEnd(cols, " "));
    return out.slice(0, rows).join("\n");
  }, [cols, rows, project.addr, project.name, project.sub, project.year]);

  // Position by top-left so size + pos are independent
  return (
    <pre
      className="universe__ascii"
      style={{
        left:  Math.round(x),
        top:   Math.round(y),
        width: Math.round(w),
        height: Math.round(h),
      }}
    >
      {content}
    </pre>
  );
}

/* ============================================================
   Universe — Fibonacci sphere + orbit camera
   ============================================================ */
function Universe({ projects = PROJECTS, onActive }) {
  const mountRef = React.useRef(null);
  const overlayRef = React.useRef(null);
  const [hover, setHover] = React.useState(null);    // {project, screen:{x,y,w,h}}
  const [activeAddr, setActiveAddr] = React.useState(null);
  const [status, setStatus] = React.useState({ az: "0", el: "0", dist: "0", tile: "—" });

  const hoverProjectRef = React.useRef(null);

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
    scene.fog = new THREE.Fog(0x04060d, 14, 32);

    const camera = new THREE.PerspectiveCamera(45, w / h, 0.5, 200);
    scene.add(new THREE.AmbientLight(0xffffff, 1.0));

    /* ---------- sphere config ---------- */
    const SPHERE_R = 9.0;
    const DIST_MIN = 11;
    const DIST_MAX = 26;
    const TILE_W = 2.6;
    const TILE_H = 3.5;

    /* ---------- starfield (deep, slow) ---------- */
    const starGeo = new THREE.BufferGeometry();
    const SC = 1200;
    const positions = new Float32Array(SC * 3);
    for (let i = 0; i < SC; i++) {
      const r = 60 + Math.random() * 80;
      const t = Math.random() * Math.PI * 2;
      const p = Math.acos(2 * Math.random() - 1);
      positions[i*3+0] = r * Math.sin(p) * Math.cos(t);
      positions[i*3+1] = r * Math.cos(p);
      positions[i*3+2] = r * Math.sin(p) * Math.sin(t);
    }
    starGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({
      color: 0x5b6478, size: 0.05, sizeAttenuation: true, transparent: true, opacity: 0.7,
    }));
    scene.add(stars);

    const sigStarGeo = new THREE.BufferGeometry();
    const SS = 90;
    const sigPos = new Float32Array(SS * 3);
    for (let i = 0; i < SS; i++) {
      const r = 30 + Math.random() * 60;
      const t = Math.random() * Math.PI * 2;
      const p = Math.acos(2 * Math.random() - 1);
      sigPos[i*3+0] = r * Math.sin(p) * Math.cos(t);
      sigPos[i*3+1] = r * Math.cos(p);
      sigPos[i*3+2] = r * Math.sin(p) * Math.sin(t);
    }
    sigStarGeo.setAttribute("position", new THREE.BufferAttribute(sigPos, 3));
    const sigStars = new THREE.Points(sigStarGeo, new THREE.PointsMaterial({
      color: 0x00f0c8, size: 0.09, sizeAttenuation: true, transparent: true, opacity: 0.85,
    }));
    scene.add(sigStars);

    /* ---------- the universe — project tiles on Fibonacci sphere ---------- */
    const tilesGroup = new THREE.Group();
    scene.add(tilesGroup);

    const tiles = [];
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

      // Fibonacci sphere distribution
      const yN = 1 - (i / (N - 1)) * 2;          // [-1, 1]
      const rad = Math.sqrt(1 - yN * yN);
      const theta = i * goldenAngle;
      mesh.position.set(
        Math.cos(theta) * rad * SPHERE_R,
        yN * SPHERE_R,
        Math.sin(theta) * rad * SPHERE_R,
      );

      // tile faces outward (away from origin)
      mesh.lookAt(mesh.position.clone().multiplyScalar(2));

      mesh.userData = { project: p, texture: tex, baseTilt: (i * 13 % 100) / 100 - 0.5 };
      tilesGroup.add(mesh);
      tiles.push(mesh);
    });

    /* ---------- ambient secondary nodes — for density ---------- */
    // small glyph sprites (just signal dots + tiny ID labels rendered as canvas)
    const ambientGroup = new THREE.Group();
    scene.add(ambientGroup);

    const ambient = [];
    const AMB_N = 90;
    function makeAmbientTexture(label) {
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

    for (let i = 0; i < AMB_N; i++) {
      // Fibonacci sphere too, offset radius
      const yN = 1 - ((i + 0.5) / AMB_N) * 2;
      const rad = Math.sqrt(1 - yN * yN);
      const theta = i * goldenAngle + 0.5;
      // jitter radius — some closer to center, some further
      const rr = SPHERE_R * (0.55 + Math.random() * 0.95);
      const x = Math.cos(theta) * rad * rr;
      const y = yN * rr;
      const z = Math.sin(theta) * rad * rr;

      const id = "0x" + (0x10 + i).toString(16).toUpperCase().padStart(2, "0");
      const tex = makeAmbientTexture(id);
      const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0.55, depthWrite: false });
      const sp = new THREE.Sprite(mat);
      sp.position.set(x, y, z);
      sp.scale.set(1.2, 1.2, 1);
      sp.userData = { isAmbient: true, phase: Math.random() * Math.PI * 2 };
      ambientGroup.add(sp);
      ambient.push(sp);
    }

    /* ---------- camera orbit state ---------- */
    const orbit = { az: 0.6, el: 0.2, dist: 18 };
    const target = { az: 0.6, el: 0.2, dist: 18 };
    let driftActive = true;

    function applyCamera() {
      const ce = Math.cos(orbit.el), se = Math.sin(orbit.el);
      const ca = Math.cos(orbit.az), sa = Math.sin(orbit.az);
      camera.position.set(
        orbit.dist * ce * sa,
        orbit.dist * se,
        orbit.dist * ce * ca,
      );
      camera.lookAt(0, 0, 0);
    }
    applyCamera();

    /* ---------- input ---------- */
    let dragging = false, dragMoved = false;
    let lastX = 0, lastY = 0, downX = 0, downY = 0;
    let resumeTimer = 0;

    const stopDrift = () => {
      driftActive = false;
      clearTimeout(resumeTimer);
    };
    const resumeDrift = () => {
      clearTimeout(resumeTimer);
      resumeTimer = setTimeout(() => { driftActive = true; }, 2800);
    };

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
      resumeDrift();
    });
    mount.addEventListener("pointercancel", () => { dragging = false; mount.style.cursor = "grab"; resumeDrift(); });
    mount.addEventListener("pointerleave", () => {
      hoverProjectRef.current = null;
      setHover(null);
    });
    mount.addEventListener("pointermove", (e) => {
      if (dragging) {
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        lastX = e.clientX; lastY = e.clientY;
        if (Math.abs(e.clientX - downX) + Math.abs(e.clientY - downY) > 6) dragMoved = true;
        target.az -= dx * 0.005;
        target.el += dy * 0.005;
        target.el = Math.max(-1.2, Math.min(1.2, target.el));
        hoverProjectRef.current = null;
        setHover(null);
      } else {
        handleHover(e.clientX, e.clientY);
      }
    });

    mount.addEventListener("wheel", (e) => {
      e.preventDefault();
      target.dist *= 1 + e.deltaY * 0.0009;
      target.dist = Math.max(DIST_MIN, Math.min(DIST_MAX, target.dist));
      stopDrift(); resumeDrift();
    }, { passive: false });

    /* ---------- raycast / picking ---------- */
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
      let anyBehind = false;
      for (const c of corners) {
        v3.copy(c);
        mesh.localToWorld(v3);
        // skip if behind camera
        const camRel = v3.clone().sub(camera.position);
        const dot = camRel.dot(camera.getWorldDirection(new THREE.Vector3()));
        if (dot <= 0) { anyBehind = true; }
        v3.project(camera);
        const sx = ( v3.x * 0.5 + 0.5) * rect.width;
        const sy = (-v3.y * 0.5 + 0.5) * rect.height;
        if (sx < minX) minX = sx;
        if (sx > maxX) maxX = sx;
        if (sy < minY) minY = sy;
        if (sy > maxY) maxY = sy;
      }
      if (anyBehind) return null;
      return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
    }

    function handleHover(cx, cy) {
      const hit = pickAt(cx, cy);
      if (!hit) {
        if (hoverProjectRef.current) { hoverProjectRef.current = null; setHover(null); }
        return;
      }
      const m = hit.object;
      const screen = tileScreenBounds(m);
      if (!screen) return;
      const proj = m.userData.project;
      hoverProjectRef.current = m;
      setHover({ project: proj, screen });
    }

    function handleClick(cx, cy) {
      const hit = pickAt(cx, cy);
      if (!hit) return;
      const m = hit.object;
      const p = m.position.clone().normalize();
      // azimuth: angle in xz-plane; elevation: from xz-plane
      target.az = Math.atan2(p.x, p.z);
      target.el = Math.asin(p.y);
      target.dist = DIST_MIN + 1.5;
      setActiveAddr(m.userData.project.addr);
      if (onActive) onActive(m.userData.project);
      stopDrift(); resumeDrift();
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

    function frame(now) {
      const dt = Math.min(50, now - last); last = now;

      // idle drift — slow horizontal rotation + tiny elevation breath
      if (driftActive) {
        target.az += dt * 0.00006;
        target.el += Math.sin(now * 0.0003) * dt * 0.00004;
      }

      // ease toward target
      const k = 1 - Math.pow(0.001, dt / 1000);
      orbit.az   += (target.az   - orbit.az)   * k;
      orbit.el   += (target.el   - orbit.el)   * k;
      orbit.dist += (target.dist - orbit.dist) * k;
      applyCamera();

      // tile face-camera: rotate slightly so each tile leans toward viewer for legibility
      for (const m of tiles) {
        const out = m.position.clone().normalize();
        const tilt = m.userData.baseTilt;
        const target_q = new THREE.Quaternion();
        // base = lookAt(0,0,0) inverted (face outward), with slight wobble
        const ax = new THREE.Vector3(0, 1, 0);
        const wobble = Math.sin(now * 0.0006 + m.userData.baseTilt * 6) * 0.05;
        target_q.setFromUnitVectors(new THREE.Vector3(0, 0, 1), out);
        // apply wobble
        const wobQ = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), wobble + tilt * 0.05);
        target_q.multiply(wobQ);
        m.quaternion.slerp(target_q, 0.2);
      }

      // ambient pulse
      for (const sp of ambient) {
        const p = sp.userData.phase + now * 0.0008;
        sp.material.opacity = 0.35 + Math.sin(p) * 0.18;
      }

      // re-position hover overlay each frame so it tracks tile
      if (hoverProjectRef.current && overlayRef.current) {
        const m = hoverProjectRef.current;
        const screen = tileScreenBounds(m);
        if (screen) {
          const el = overlayRef.current;
          el.style.left = Math.round(screen.x) + "px";
          el.style.top  = Math.round(screen.y) + "px";
          el.style.width  = Math.round(screen.w) + "px";
          el.style.height = Math.round(screen.h) + "px";
        }
      }

      // gentle star rotation tied to camera az for parallax
      stars.rotation.y    = -orbit.az * 0.05;
      sigStars.rotation.y = -orbit.az * 0.10;

      // status (~3Hz)
      frameI++;
      if (frameI % 20 === 0) {
        setStatus({
          az:   ((orbit.az * 180 / Math.PI) % 360).toFixed(0).padStart(3, "0"),
          el:   (orbit.el * 180 / Math.PI).toFixed(0).padStart(2, "0"),
          dist: orbit.dist.toFixed(1),
          tile: hoverProjectRef.current?.userData?.project?.addr || activeAddr || "—",
        });
      }

      renderer.render(scene, camera);
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    mount.style.cursor = "grab";

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(resumeTimer);
      window.removeEventListener("resize", onResize);
      ro.disconnect();
      try { mount.removeChild(renderer.domElement); } catch (_) {}
      renderer.dispose();
      tiles.forEach(m => { m.geometry.dispose(); m.material.map?.dispose(); m.material.dispose(); });
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

      <div className="universe__hud universe__hud--bl">
        <div className="universe__hudRow"><span className="universe__hudKey">AZ</span><span className="universe__hudVal">{status.az}°</span></div>
        <div className="universe__hudRow"><span className="universe__hudKey">EL</span><span className="universe__hudVal">{status.el}°</span></div>
        <div className="universe__hudRow"><span className="universe__hudKey">R</span><span className="universe__hudVal">{status.dist}</span></div>
        <div className="universe__hudRow"><span className="universe__hudKey">FOCUS</span><span className="universe__hudVal">{status.tile}</span></div>
      </div>
      <div className="universe__hud universe__hud--br">
        <div className="universe__hudRow"><span className="universe__hudKey">DRAG</span><span className="universe__hudVal">ORBIT</span></div>
        <div className="universe__hudRow"><span className="universe__hudKey">WHEEL</span><span className="universe__hudVal">DOLLY</span></div>
        <div className="universe__hudRow"><span className="universe__hudKey">CLICK</span><span className="universe__hudVal">FOCUS</span></div>
        <div className="universe__hudRow"><span className="universe__hudKey">NODES</span><span className="universe__hudVal">{projects.length} / ∞</span></div>
      </div>
    </div>
  );
}

/* Render ASCII body string from project + screen size */
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

window.Universe = Universe;
