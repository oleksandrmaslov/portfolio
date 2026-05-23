/* ============================================================
   M.O. SYSTEM — Universe
   Infinite WebGL project gallery — sparse 3D field.
   Drag to pan · Wheel to zoom · Click tile to focus · Idle drift.
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

/* ------------------------------------------------------------
   Per-tile canvas texture — drawn procedurally per project
   ------------------------------------------------------------ */
function makeTileTexture(p, THREE) {
  const c = document.createElement("canvas");
  c.width = 540; c.height = 720;
  const x = c.getContext("2d");

  // base
  x.fillStyle = p.color || "#0d1018";
  x.fillRect(0, 0, 540, 720);

  // inner panel
  x.strokeStyle = "#232a3a";
  x.lineWidth = 1.5;
  x.strokeRect(12, 12, 516, 696);

  // corner reticles
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

  // top labels
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

  // dot grid (Fibonacci spacing, faint)
  x.fillStyle = "#1a2030";
  for (let yy = 90; yy < 540; yy += 21) {
    for (let xx = 44; xx < 510; xx += 21) {
      x.fillRect(xx, yy, 1, 1);
    }
  }

  // project graphic — distinctive per-project
  x.save();
  x.translate(270, 320);
  x.strokeStyle = "#00f0c8";
  x.fillStyle = "#00f0c8";
  x.lineWidth = 1.4;
  drawGraphic(x, p);
  x.restore();

  // title (Geist big)
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

  // sub
  x.fillStyle = "#9aa3b3";
  x.font = "400 18px 'Geist', sans-serif";
  x.fillText(p.sub, 44, 640);

  // footer
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
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 5; col++) {
          const dx = (col - 2) * 26 - 32;
          const dy = (row - 1) * 26;
          x.fillRect(dx - 2, dy - 2, 4, 4);
          x.fillRect(-dx + 32 - 2, dy - 2, 4, 4);
        }
      }
      // thumb cluster dots
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
      // mouth
      x.beginPath();
      x.arc(0, 22, 14, 0, Math.PI, false);
      x.stroke();
      // signal arcs
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
      // exp curve
      x.beginPath();
      for (let i = 0; i <= 80; i++) {
        const t = i / 80;
        const xx = (t - 0.5) * 240;
        const yy = -Math.pow(t, 2.6) * 170 + 70;
        if (i === 0) x.moveTo(xx, yy);
        else x.lineTo(xx, yy);
      }
      x.stroke();
      // linear curve (dim)
      x.strokeStyle = "#1a2030";
      x.beginPath();
      x.moveTo(-120, 70); x.lineTo(120, -80);
      x.stroke();
      x.strokeStyle = "#00f0c8";
      // axes
      x.strokeStyle = "#1a2030";
      x.beginPath(); x.moveTo(-120, 70); x.lineTo(120, 70); x.stroke();
      x.beginPath(); x.moveTo(-120, 70); x.lineTo(-120, -100); x.stroke();
      // axis ticks
      x.fillStyle = "#5b6478";
      for (let i = 1; i <= 4; i++) {
        x.fillRect(-120 + i * 48 - 0.5, 70 - 3, 1, 6);
        x.fillRect(-120 - 3, 70 - i * 38 - 0.5, 6, 1);
      }
      x.fillStyle = "#00f0c8";
      break;
    }
    case "torch": {
      // beam triangle
      x.beginPath();
      x.moveTo(-50, 60);
      x.lineTo(50, 60);
      x.lineTo(110, -90);
      x.lineTo(-110, -90);
      x.closePath();
      x.stroke();
      // body
      x.beginPath();
      x.rect(-50, 60, 100, 70);
      x.stroke();
      // bulb
      x.beginPath(); x.arc(0, -10, 16, 0, Math.PI * 2); x.fill();
      // beam rays
      for (let i = -2; i <= 2; i++) {
        x.globalAlpha = 0.3;
        x.beginPath();
        x.moveTo(i * 16, -90);
        x.lineTo(i * 24, -150);
        x.stroke();
      }
      x.globalAlpha = 1;
      break;
    }
    default: {
      // generic node: nested crosses
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

/* ------------------------------------------------------------
   Hover ASCII overlay — shown over hovered tile
   ------------------------------------------------------------ */
function AsciiTile({ project, sx, sy, w, h }) {
  // produce ASCII content sized to tile
  const cols = Math.max(22, Math.round(w / 8.5));
  const rows = Math.max(28, Math.round(h / 14));

  const RAMP = " .·:-=+*#%@";

  const content = React.useMemo(() => {
    const out = [];
    out.push("┌" + "─".repeat(cols - 2) + "┐");
    const t1 = "│ NODE " + project.addr;
    const t2 = project.year.toUpperCase() + " │";
    out.push(t1 + " ".repeat(Math.max(1, cols - t1.length - t2.length + 1)) + t2);
    out.push("├" + "─".repeat(cols - 2) + "┤");

    // central ASCII field — sample a radial gradient + sin noise
    const innerR = rows - 7;
    for (let r = 0; r < innerR; r++) {
      let line = "│ ";
      for (let c = 0; c < cols - 4; c++) {
        const cx = (cols - 4) / 2;
        const cy = innerR / 2;
        const dx = (c - cx) / cx;
        const dy = (r - cy) / cy;
        const d = Math.sqrt(dx * dx * 0.5 + dy * dy);
        const n = Math.sin(c * 0.5 + r * 0.7 + project.addr.charCodeAt(2)) * 0.15;
        const v = Math.max(0, Math.min(1, 1 - d * 1.1 + n));
        const idx = Math.floor(v * (RAMP.length - 1));
        line += RAMP[idx];
      }
      out.push(line + " │");
    }
    out.push("├" + "─".repeat(cols - 2) + "┤");

    const name = project.name.toUpperCase();
    const sub  = project.sub;
    out.push("│ " + name.slice(0, cols - 4).padEnd(cols - 4, " ") + " │");
    out.push("│ " + sub.slice(0, cols - 4).padEnd(cols - 4, " ") + " │");
    out.push("│ " + ("OPEN →").padEnd(cols - 4, " ") + " │");
    out.push("└" + "─".repeat(cols - 2) + "┘");
    return out.join("\n");
  }, [cols, rows, project.addr, project.name, project.sub, project.year]);

  return (
    <pre
      className="universe__ascii"
      style={{
        left:  Math.round(sx - w / 2),
        top:   Math.round(sy - h / 2),
        width: Math.round(w),
        height: Math.round(h),
      }}
    >
      {content}
    </pre>
  );
}

/* ------------------------------------------------------------
   Universe — the main scene
   ------------------------------------------------------------ */
function Universe({ projects = PROJECTS, onActive }) {
  const mountRef = React.useRef(null);
  const [hover, setHover] = React.useState(null);  // {project, sx, sy, w, h}
  const [active, setActive] = React.useState(null);
  const [status, setStatus] = React.useState({ x: "0.0", y: "0.0", z: "0.0", tile: "—" });

  // mutable state for the loop (avoid re-creating effect)
  const stateRef = React.useRef({ hover: null });

  React.useEffect(() => {
    const THREE = window.THREE;
    if (!THREE) { console.warn("THREE not loaded"); return; }
    const mount = mountRef.current;
    if (!mount) return;

    const sz = () => ({ w: mount.clientWidth, h: mount.clientHeight });
    let { w, h } = sz();

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x04060d, 0.020);

    const camera = new THREE.PerspectiveCamera(48, w / h, 0.1, 200);
    camera.position.set(0, 0, 10);

    // soft lighting (tiles use unlit material, but a few accents help)
    scene.add(new THREE.AmbientLight(0xffffff, 1.0));

    /* ---------- starfield (deep parallax) ---------- */
    const starGeo = new THREE.BufferGeometry();
    const SC = 800;
    const positions = new Float32Array(SC * 3);
    for (let i = 0; i < SC; i++) {
      positions[i*3 + 0] = (Math.random() - 0.5) * 200;
      positions[i*3 + 1] = (Math.random() - 0.5) * 120;
      positions[i*3 + 2] = (Math.random() - 0.5) * 180;
    }
    starGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({
      color: 0x5b6478, size: 0.04, sizeAttenuation: true, transparent: true, opacity: 0.7,
    }));
    scene.add(stars);

    // brighter signal stars
    const sigStarGeo = new THREE.BufferGeometry();
    const SS = 60;
    const sigPos = new Float32Array(SS * 3);
    for (let i = 0; i < SS; i++) {
      sigPos[i*3 + 0] = (Math.random() - 0.5) * 160;
      sigPos[i*3 + 1] = (Math.random() - 0.5) * 100;
      sigPos[i*3 + 2] = (Math.random() - 0.5) * 160;
    }
    sigStarGeo.setAttribute("position", new THREE.BufferAttribute(sigPos, 3));
    const sigStars = new THREE.Points(sigStarGeo, new THREE.PointsMaterial({
      color: 0x00f0c8, size: 0.08, sizeAttenuation: true, transparent: true, opacity: 0.9,
    }));
    scene.add(sigStars);

    /* ---------- tile field ---------- */
    const WORLD = { x: 64, y: 40, z: 56 };

    const tilesGroup = new THREE.Group();
    scene.add(tilesGroup);

    // sparse layout — golden-angle distribution + Z stagger
    const PHI = 1.618033988749895;
    const tileW = 3.4, tileH = 4.6;
    const tiles = [];

    projects.forEach((p, i) => {
      const tex = makeTileTexture(p, THREE);
      const mat = new THREE.MeshBasicMaterial({
        map: tex, transparent: true, opacity: 0.95,
        side: THREE.DoubleSide, depthWrite: false,
      });
      const geo = new THREE.PlaneGeometry(tileW, tileH);
      const mesh = new THREE.Mesh(geo, mat);

      // base position via golden-angle phi spiral mapped to world bounds
      const theta = i * Math.PI * 2 / PHI;
      const radial = Math.sqrt(i / projects.length);
      const bx = Math.cos(theta) * radial * WORLD.x * 0.5;
      const by = Math.sin(theta) * radial * WORLD.y * 0.5;
      // z scatter (depth) — alternating + jitter
      const bz = ((i * 7919) % 1000 / 1000 - 0.5) * WORLD.z;

      // small tilt
      mesh.rotation.x = (((i * 13) % 100) / 100 - 0.5) * 0.18;
      mesh.rotation.y = (((i * 29) % 100) / 100 - 0.5) * 0.42;

      mesh.userData = { project: p, base: new THREE.Vector3(bx, by, bz), texture: tex, baseRot: { x: mesh.rotation.x, y: mesh.rotation.y } };
      tilesGroup.add(mesh);
      tiles.push(mesh);

      // address dot in front of tile
      const dotMat = new THREE.MeshBasicMaterial({ color: 0x00f0c8, transparent: true, opacity: 0.9 });
      const dotGeo = new THREE.SphereGeometry(0.05, 8, 8);
      const dot = new THREE.Mesh(dotGeo, dotMat);
      dot.userData = { isDot: true, parent: mesh, offset: new THREE.Vector3(-tileW/2 - 0.4, tileH/2 + 0.2, 0) };
      tilesGroup.add(dot);
      tiles._dots = tiles._dots || [];
      tiles._dots.push(dot);
    });

    /* ---------- offset (negative camera-in-world) ---------- */
    const offset = new THREE.Vector3(0, 0, 0);
    const targetOffset = new THREE.Vector3(0, 0, 0);
    let driftActive = true;
    let driftT = 0;
    let driftDelay = 0;

    function wrap(v, size) {
      return ((v % size) + size * 1.5) % size - size / 2;
    }

    function updateTilePositions() {
      for (const m of tiles) {
        const b = m.userData.base;
        m.position.set(
          wrap(b.x + offset.x, WORLD.x),
          wrap(b.y + offset.y, WORLD.y),
          wrap(b.z + offset.z, WORLD.z),
        );
        // fade by distance from camera
        const d = m.position.length();
        const fade = Math.max(0, Math.min(1, 1 - (d - 8) / 22));
        m.material.opacity = 0.08 + fade * 0.92;
      }
      for (const dot of (tiles._dots || [])) {
        const p = dot.userData.parent;
        const o = dot.userData.offset;
        dot.position.set(p.position.x + o.x, p.position.y + o.y, p.position.z + o.z);
      }
    }

    /* ---------- input ---------- */
    let dragging = false, dragMoved = false;
    let lastX = 0, lastY = 0;
    let downX = 0, downY = 0;

    const stopDrift = () => { driftActive = false; driftDelay = 0; };
    const resumeDrift = () => { setTimeout(() => { driftActive = true; }, 2400); };

    mount.addEventListener("pointerdown", (e) => {
      dragging = true; dragMoved = false;
      lastX = downX = e.clientX;
      lastY = downY = e.clientY;
      mount.style.cursor = "grabbing";
      stopDrift();
      mount.setPointerCapture(e.pointerId);
    });
    mount.addEventListener("pointerup", (e) => {
      if (!dragging) return;
      dragging = false;
      mount.style.cursor = "grab";
      mount.releasePointerCapture(e.pointerId);
      // treat as click if barely moved
      if (!dragMoved) handleClick(e.clientX, e.clientY);
      resumeDrift();
    });
    mount.addEventListener("pointercancel", () => { dragging = false; mount.style.cursor = "grab"; resumeDrift(); });
    mount.addEventListener("pointerleave", () => { setHover(null); stateRef.current.hover = null; });
    mount.addEventListener("pointermove", (e) => {
      if (dragging) {
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        lastX = e.clientX; lastY = e.clientY;
        if (Math.abs(e.clientX - downX) + Math.abs(e.clientY - downY) > 6) dragMoved = true;
        targetOffset.x += dx * 0.028;
        targetOffset.y -= dy * 0.028;
        setHover(null); stateRef.current.hover = null;
      } else {
        handleHover(e.clientX, e.clientY);
      }
    });

    mount.addEventListener("wheel", (e) => {
      e.preventDefault();
      targetOffset.z += e.deltaY * 0.04;
      stopDrift(); resumeDrift();
    }, { passive: false });

    /* ---------- raycast ---------- */
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

    function handleHover(cx, cy) {
      const hit = pickAt(cx, cy);
      if (!hit) {
        if (stateRef.current.hover) { setHover(null); stateRef.current.hover = null; }
        return;
      }
      const m = hit.object;
      // project tile center + corner to screen
      const center = new THREE.Vector3();
      m.getWorldPosition(center);
      center.project(camera);
      const corner = new THREE.Vector3(tileW / 2, tileH / 2, 0);
      m.localToWorld(corner);
      corner.project(camera);
      const rect = mount.getBoundingClientRect();
      const sx = ( center.x * 0.5 + 0.5) * rect.width;
      const sy = (-center.y * 0.5 + 0.5) * rect.height;
      const wW = Math.abs((corner.x - center.x) * rect.width)  * 2;
      const hH = Math.abs((corner.y - center.y) * rect.height) * 2;
      const next = { project: m.userData.project, sx, sy, w: wW, h: hH };
      setHover(next);
      stateRef.current.hover = next;
    }

    function handleClick(cx, cy) {
      const hit = pickAt(cx, cy);
      if (!hit) return;
      const m = hit.object;
      // Compute target so this tile lands at world (0, 0, 6).
      // We need offset such that wrap(b + offset, W) ≈ desired.
      const desired = new THREE.Vector3(0, 0, 6);
      const tx = desired.x - m.userData.base.x;
      const ty = desired.y - m.userData.base.y;
      const tz = desired.z - m.userData.base.z;
      // wrap target near current offset for smooth motion
      const nearest = (cur, t, size) => {
        let best = t;
        let bestD = Math.abs(t - cur);
        for (let k = -1; k <= 1; k++) {
          const cand = t + k * size;
          if (Math.abs(cand - cur) < bestD) { best = cand; bestD = Math.abs(cand - cur); }
        }
        return best;
      };
      targetOffset.x = nearest(offset.x, tx, WORLD.x);
      targetOffset.y = nearest(offset.y, ty, WORLD.y);
      targetOffset.z = nearest(offset.z, tz, WORLD.z);
      setActive(m.userData.project);
      stopDrift(); resumeDrift();
      if (onActive) onActive(m.userData.project);
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

      // idle drift — gentle Lissajous offset
      if (driftActive) {
        driftT += dt;
        const t = driftT * 0.00009;
        targetOffset.x += Math.sin(t * 1.10) * dt * 0.0007;
        targetOffset.y += Math.cos(t * 1.31) * dt * 0.0005;
        targetOffset.z += Math.sin(t * 0.62) * dt * 0.0009;
      }

      // ease toward target
      const k = 1 - Math.pow(0.001, dt / 1000);
      offset.x += (targetOffset.x - offset.x) * k;
      offset.y += (targetOffset.y - offset.y) * k;
      offset.z += (targetOffset.z - offset.z) * k;

      // tiles always face camera-ish, with a touch of bob
      for (const m of tiles) {
        const baseRot = m.userData.baseRot;
        m.rotation.x = baseRot.x + Math.sin(now * 0.00027 + m.userData.base.x) * 0.025;
        m.rotation.y = baseRot.y + Math.cos(now * 0.00029 + m.userData.base.y) * 0.03;
        m.rotation.z = Math.sin(now * 0.00018 + m.userData.base.z) * 0.012;
      }

      // stars parallax — drift relative to offset
      stars.rotation.y = offset.x * 0.001;
      stars.rotation.x = -offset.y * 0.001;
      sigStars.rotation.y = offset.x * 0.0015;
      sigStars.rotation.x = -offset.y * 0.0015;

      updateTilePositions();

      // re-project hover position each frame so ASCII overlay follows
      if (stateRef.current.hover) {
        const proj = stateRef.current.hover.project;
        const m = tiles.find(t => t.userData.project.addr === proj.addr);
        if (m) {
          const center = new THREE.Vector3();
          m.getWorldPosition(center);
          center.project(camera);
          const corner = new THREE.Vector3(tileW / 2, tileH / 2, 0);
          m.localToWorld(corner);
          corner.project(camera);
          const rect = mount.getBoundingClientRect();
          const sx = ( center.x * 0.5 + 0.5) * rect.width;
          const sy = (-center.y * 0.5 + 0.5) * rect.height;
          const wW = Math.abs((corner.x - center.x) * rect.width)  * 2;
          const hH = Math.abs((corner.y - center.y) * rect.height) * 2;
          // update without state spam — direct DOM tweak
          const el = mount.parentElement.querySelector(".universe__ascii");
          if (el) {
            el.style.left = Math.round(sx - wW / 2) + "px";
            el.style.top  = Math.round(sy - hH / 2) + "px";
            el.style.width  = Math.round(wW) + "px";
            el.style.height = Math.round(hH) + "px";
          }
        }
      }

      // status (~3Hz)
      frameI++;
      if (frameI % 20 === 0) {
        setStatus({
          x: offset.x.toFixed(1),
          y: offset.y.toFixed(1),
          z: offset.z.toFixed(1),
          tile: stateRef.current.hover?.project?.addr || (active?.addr || "—"),
        });
      }

      renderer.render(scene, camera);
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    mount.style.cursor = "grab";

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      ro.disconnect();
      try { mount.removeChild(renderer.domElement); } catch (e) {}
      renderer.dispose();
      tiles.forEach(m => { m.geometry.dispose(); m.material.map?.dispose(); m.material.dispose(); });
      starGeo.dispose(); sigStarGeo.dispose();
    };
  }, []);  // mount once

  return (
    <div className="universe" data-screen-label="01 Universe">
      <div className="universe__mount" ref={mountRef} />

      {hover && <AsciiTile project={hover.project} sx={hover.sx} sy={hover.sy} w={hover.w} h={hover.h} />}

      {/* corner reticles */}
      <div className="universe__reticle" aria-hidden="true">
        <span /><span /><span /><span />
      </div>

      {/* HUD — left */}
      <div className="universe__hud universe__hud--bl">
        <div className="universe__hudRow">
          <span className="universe__hudKey">POS</span>
          <span className="universe__hudVal">{status.x} · {status.y} · {status.z}</span>
        </div>
        <div className="universe__hudRow">
          <span className="universe__hudKey">FOCUS</span>
          <span className="universe__hudVal">{status.tile}</span>
        </div>
        <div className="universe__hudRow">
          <span className="universe__hudKey">TILES</span>
          <span className="universe__hudVal">{projects.length} / ∞</span>
        </div>
      </div>

      {/* HUD — right */}
      <div className="universe__hud universe__hud--br">
        <div className="universe__hudRow"><span className="universe__hudKey">DRAG</span><span className="universe__hudVal">PAN</span></div>
        <div className="universe__hudRow"><span className="universe__hudKey">WHEEL</span><span className="universe__hudVal">ZOOM</span></div>
        <div className="universe__hudRow"><span className="universe__hudKey">CLICK</span><span className="universe__hudVal">FOCUS</span></div>
        <div className="universe__hudRow"><span className="universe__hudKey">IDLE</span><span className="universe__hudVal">DRIFT</span></div>
      </div>
    </div>
  );
}

window.Universe = Universe;
window.AsciiTile = AsciiTile;
