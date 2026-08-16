/* ============================================================
   M.O. SYSTEM — Universe v4 · "Trace the net"
   ------------------------------------------------------------
   A STABLE constellation (no infinite wrap) so the graph reads
   as a legible map for the story flight:

     · 0x00 ORIGIN  — the person, warm copper, at world centre
     · KYIV / MUNICH — biographical "anchor stars"
     · 12 project nodes on a golden-spiral shell

   Signal traces wire every node back to the origin and to its
   stack-siblings. Nodes carry vital signs (shipped = steady,
   WIP = heartbeat). The cursor is magnetic — nearby nodes lean
   toward it. Scroll drives a camera tour between waypoints.

   Props:
     mode         "intro" | "tour" | "free"
     tourProgress 0..1   (tour mode only — scroll-driven)
     direction    "trace" | "boot" | "field"
     onWaypoint   (idx, node) => void
     onActive     (node) => void
   ============================================================ */

const PROJECTS_V2 = (window.UNIVERSE_PROJECTS || [
  { addr: "0x01", file: "Wafer.html",               name: "Wafer",                  sub: "36-key ultrathin split keyboard", year: "2025",   stack: "ZMK · KICAD · NRF52840", live: false },
  { addr: "0x02", file: "Kerfur.html",              name: "Kerfur",                 sub: "Embedded pet · event bus",        year: "2025 —", stack: "C · ZEPHYR · LVGL · BLE", live: true },
  { addr: "0x03", file: "ZMK-PointAccel.html",      name: "ZMK PointAccel",         sub: "Open-source input processor",     year: "2025",   stack: "C · DEVICETREE · ZMK",   live: false },
  { addr: "0x04", file: "Tactical-Flashlight.html", name: "Tactical Flashlight",    sub: "For Energy for Ukraine",          year: "12/25",  stack: "C · ARM-M0 · KICAD",     live: false },
  { addr: "0x05", name: "ZMK upstream",           sub: "Voltage IIO merge · PMIC driver", year: "2025",   stack: "ZEPHYR · DT · I2C",      live: true  },
  { addr: "0x06", name: "Matterium",              sub: "Matter / Thread experiments",     year: "2024",   stack: "MATTER · OPENTHREAD",    live: false },
  { addr: "0x07", name: "Catloading",             sub: "Loading screen · meow OS",        year: "2024",   stack: "JS · WEBGL · GLSL",      live: false },
  { addr: "0x08", name: "view-elemental",         sub: "Periodic table viewer",           year: "2023",   stack: "REACT · D3 · CHEM",      live: false },
  { addr: "0x09", name: "Wafer R1 → R3",          sub: "Revision history · KiCad",        year: "2024-5", stack: "KICAD · CHANGELOG",      live: true  },
  { addr: "0x0A", name: "Kerfur Beacons",         sub: "Peer-to-peer rotating IDs",       year: "2025",   stack: "BLE · CRYPTO · BEACON",  live: true  },
  { addr: "0x0B", name: "PMIC Driver",            sub: "NPM1300 register interface",      year: "2025",   stack: "C · I2C · ZEPHYR",       live: false },
  { addr: "0x0C", name: "Streamlit Configurator", sub: "PointAccel devicetree emit",      year: "2025",   stack: "PYTHON · STREAMLIT",     live: false },
]).map(p => ({ ...p }));

/* WIP detection — a node is "live" if flagged, or its year is open-ended. */
PROJECTS_V2.forEach(p => { if (p.live === undefined) p.live = /—|\u2014/.test(p.year || ""); });

/* ------------------------------------------------------------
   Texture helpers — compact canvas cards for each node kind.
   ------------------------------------------------------------ */
function v2_card(p, THREE) {
  const c = document.createElement("canvas");
  c.width = 480; c.height = 600;
  const x = c.getContext("2d");
  x.fillStyle = "#0c0f17"; x.fillRect(0, 0, 480, 600);
  x.strokeStyle = "#232a3a"; x.lineWidth = 1.5; x.strokeRect(10, 10, 460, 580);

  // signal corners
  x.strokeStyle = "#00f0c8"; x.lineWidth = 1.5;
  const corner = (cx, cy, fx, fy) => { const l = 18; x.beginPath(); x.moveTo(cx, cy + fy*l); x.lineTo(cx, cy); x.lineTo(cx + fx*l, cy); x.stroke(); };
  corner(22, 22, 1, 1); corner(458, 22, -1, 1); corner(22, 578, 1, -1); corner(458, 578, -1, -1);

  // header
  x.fillStyle = "#5b6478"; x.font = "500 12px 'Geist Mono', monospace"; x.textBaseline = "top";
  x.textAlign = "left"; x.fillText("■ NODE " + p.addr, 38, 30);
  x.fillStyle = p.live ? "#00f0c8" : "#9aa3b3";
  x.textAlign = "right"; x.fillText(p.live ? "● LIVE" : "○ SHIPPED", 442, 30);
  x.fillStyle = "#5b6478"; x.textAlign = "left"; x.fillText((p.year || "").toUpperCase(), 38, 48);

  // dot grid
  x.fillStyle = "#1a2030";
  for (let yy = 90; yy < 360; yy += 20) for (let xx = 38; xx < 444; xx += 20) x.fillRect(xx, yy, 1, 1);

  // name
  x.fillStyle = "#e6e8ee"; x.font = "400 46px 'Geist', sans-serif"; x.textAlign = "left";
  const words = (p.name || "").split(" "); let line = "", ty = 400 - 0;
  const lines = [];
  for (const w of words) { const t = line ? line + " " + w : w; if (x.measureText(t).width > 400 && line) { lines.push(line); line = w; } else line = t; }
  if (line) lines.push(line);
  ty = 432 - (lines.length - 1) * 48;
  for (const ln of lines) { x.fillText(ln, 38, ty); ty += 50; }

  x.fillStyle = "#9aa3b3"; x.font = "400 17px 'Geist', sans-serif"; x.fillText(p.sub || "", 38, 520);
  x.fillStyle = "#5b6478"; x.font = "500 11px 'Geist Mono', monospace"; x.fillText(p.stack || "", 38, 556);
  if (p.file) { x.fillStyle = "#00f0c8"; x.textAlign = "right"; x.fillText("OPEN →", 442, 556); }

  const t = new THREE.CanvasTexture(c); t.anisotropy = 8; t.colorSpace = THREE.SRGBColorSpace; t.needsUpdate = true;
  return t;
}

function v2_anchor(label, sub, THREE) {
  const c = document.createElement("canvas");
  c.width = 320; c.height = 320;
  const x = c.getContext("2d"); x.clearRect(0, 0, 320, 320);
  // ring
  x.strokeStyle = "#c87340"; x.lineWidth = 2;
  x.beginPath(); x.arc(160, 160, 60, 0, Math.PI*2); x.stroke();
  x.globalAlpha = 0.4; x.beginPath(); x.arc(160, 160, 84, 0, Math.PI*2); x.stroke(); x.globalAlpha = 1;
  // star tick
  x.strokeStyle = "#e6e8ee"; x.lineWidth = 1.5;
  for (let i = 0; i < 4; i++) { const a = i*Math.PI/2; x.beginPath(); x.moveTo(160+Math.cos(a)*44, 160+Math.sin(a)*44); x.lineTo(160+Math.cos(a)*58, 160+Math.sin(a)*58); x.stroke(); }
  x.fillStyle = "#c87340"; x.beginPath(); x.arc(160, 160, 5, 0, Math.PI*2); x.fill();
  // label
  x.fillStyle = "#e6e8ee"; x.font = "500 30px 'Geist', sans-serif"; x.textAlign = "center"; x.textBaseline = "middle";
  x.fillText(label, 160, 158);
  x.fillStyle = "#9aa3b3"; x.font = "500 13px 'Geist Mono', monospace"; x.fillText(sub, 160, 196);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.needsUpdate = true;
  return t;
}

function v2_origin(THREE) {
  const c = document.createElement("canvas");
  c.width = 420; c.height = 420;
  const x = c.getContext("2d"); x.clearRect(0, 0, 420, 420);
  const cx = 210, cy = 210;
  // concentric rings
  for (let i = 0; i < 4; i++) {
    x.strokeStyle = "#c87340"; x.globalAlpha = 0.85 - i*0.18; x.lineWidth = 1.6;
    x.beginPath(); x.arc(cx, cy, 50 + i*26, 0, Math.PI*2); x.stroke();
  }
  x.globalAlpha = 1;
  // crosshair
  x.strokeStyle = "#e6e8ee"; x.lineWidth = 1.4;
  x.beginPath(); x.moveTo(cx-130, cy); x.lineTo(cx+130, cy); x.moveTo(cx, cy-130); x.lineTo(cx, cy+130); x.stroke();
  // core
  x.fillStyle = "#ff5b3b"; x.beginPath(); x.arc(cx, cy, 9, 0, Math.PI*2); x.fill();
  // labels
  x.fillStyle = "#e6e8ee"; x.font = "600 40px 'Geist', sans-serif"; x.textAlign = "center"; x.textBaseline = "middle";
  x.fillText("M.O.", cx, cy - 2);
  x.fillStyle = "#c87340"; x.font = "500 14px 'Geist Mono', monospace"; x.fillText("0x00 · ORIGIN", cx, cy + 34);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.needsUpdate = true;
  return t;
}

function v2_ambient(label, THREE) {
  const c = document.createElement("canvas"); c.width = 128; c.height = 128;
  const x = c.getContext("2d"); x.clearRect(0, 0, 128, 128);
  x.strokeStyle = "#00f0c8"; x.lineWidth = 2; x.beginPath(); x.arc(20, 64, 3.5, 0, Math.PI*2); x.stroke();
  x.fillStyle = "#5b6478"; x.font = "500 15px 'Geist Mono', monospace"; x.textAlign = "left"; x.textBaseline = "middle";
  x.fillText(label, 30, 64);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

/* shared-stack adjacency between project nodes */
function v2_stackTokens(s) {
  return (s || "").toUpperCase().split(/[·\s]+/).map(t => t.trim()).filter(t => t.length > 1);
}

/* ============================================================
   Component
   ============================================================ */
function Universe2({ mode = "intro", tourProgress = 0, direction = "trace", onWaypoint, onActive }) {
  const mountRef   = React.useRef(null);
  const overlayRef = React.useRef(null);
  const [hover, setHover] = React.useState(null);
  const [status, setStatus] = React.useState({ node: "0x00", trace: "—", sig: "ORIGIN" });

  const modeRef  = React.useRef(mode);
  const progRef  = React.useRef(tourProgress);
  const dirRef   = React.useRef(direction);
  const hoverObjRef = React.useRef(null);
  const lastWPRef = React.useRef(-1);

  React.useEffect(() => { modeRef.current = mode; }, [mode]);
  React.useEffect(() => { progRef.current = tourProgress; }, [tourProgress]);
  React.useEffect(() => { dirRef.current = direction; }, [direction]);

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
    scene.fog = new THREE.Fog(0x04060d, 26, 64);
    const camera = new THREE.PerspectiveCamera(55, w / h, 0.3, 400);
    scene.add(new THREE.AmbientLight(0xffffff, 1.0));

    /* ---------- build the constellation ---------- */
    const nodes = [];      // { mesh, data, base:Vector3, grav:Vector3, kind }
    const byAddr = {};
    const SIGNAL = 0x00f0c8, COPPER = 0xc87340, BONE = 0xe6e8ee;

    function addNode(kind, data, tex, base, size) {
      const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 1, side: THREE.DoubleSide, depthWrite: false });
      const geo = new THREE.PlaneGeometry(size.x, size.y);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(base);
      const n = { mesh, data, base: base.clone(), grav: new THREE.Vector3(), kind,
        pulse: Math.random()*Math.PI*2, baseScale: 1 };
      mesh.userData = n;
      scene.add(mesh);
      nodes.push(n);
      if (data.addr) byAddr[data.addr] = n;
      return n;
    }

    // ORIGIN at centre
    const origin = addNode("origin", { addr: "0x00", name: "M.O.", sub: "origin", live: true },
      v2_origin(THREE), new THREE.Vector3(0, 0, 0), { x: 4.4, y: 4.4 });
    origin.baseScale = 1;

    // ANCHOR STARS — Kyiv (left/back) and Munich (right/front)
    const kyiv = addNode("anchor",
      { addr: "0xK", name: "Kyiv", sub: "50.45°N", anchor: "kyiv" },
      v2_anchor("KYIV", "50.45° N · ORIGIN", THREE),
      new THREE.Vector3(-13, 4.5, -9), { x: 3.4, y: 3.4 });
    const munich = addNode("anchor",
      { addr: "0xM", name: "Munich", sub: "48.13°N", anchor: "munich" },
      v2_anchor("MÜNCHEN", "48.13° N · NOW", THREE),
      new THREE.Vector3(13, -3.5, -6), { x: 3.4, y: 3.4 });

    // PROJECT NODES — golden-spiral shell around origin
    const golden = Math.PI * (3 - Math.sqrt(5));
    const NP = PROJECTS_V2.length;
    PROJECTS_V2.forEach((p, i) => {
      const yN = 1 - (i / Math.max(1, NP - 1)) * 2;       // 1..-1
      const radial = Math.sqrt(Math.max(0, 1 - yN*yN));
      const theta = i * golden;
      const R = 9 + (i % 3) * 1.6;
      const base = new THREE.Vector3(
        Math.cos(theta) * radial * R,
        yN * 6.5 + Math.sin(i*1.3) * 1.2,
        Math.sin(theta) * radial * R - 3,
      );
      const n = addNode("project", p, v2_card(p, THREE), base, { x: 2.7, y: 3.4 });
      n.baseScale = 0.92;
    });

    /* ---------- 3D model overlays for project nodes with GLBs ---------- */
    const modelHolders = [];
    PROJECTS_V2.forEach((p) => {
      if (!p.model || !window.loadProjectModel) return;
      const n = byAddr[p.addr]; if (!n) return;
      const holder = new THREE.Group(); holder.visible = false;
      holder.userData = { node: n, loaded: false };
      scene.add(holder); modelHolders.push(holder);
      window.loadProjectModel(p.model, THREE).then((root) => {
        window.fitModelToSize(root, THREE, p.modelFit || 2.4);
        window.applyMatcapToModel(root, THREE);
        if (p.modelPose) { root.rotation.x += p.modelPose.x||0; root.rotation.y += p.modelPose.y||0; root.rotation.z += p.modelPose.z||0; }
        holder.add(root); holder.visible = true; holder.userData.loaded = true;
      }).catch(() => {});
    });

    /* ---------- TRACES — origin spokes + stack siblings + the crossing ---------- */
    const traces = [];   // { a:node, b:node, mat, geo, line, weight, kind }
    function addTrace(a, b, kind, weight) {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(6), 3));
      const mat = new THREE.LineBasicMaterial({
        color: kind === "cross" ? COPPER : SIGNAL,
        transparent: true, opacity: kind === "cross" ? 0.5 : 0.16, depthWrite: false,
      });
      const line = new THREE.Line(geo, mat);
      scene.add(line);
      traces.push({ a, b, mat, geo, line, weight: weight || 0.16, kind, baseOp: mat.opacity });
    }
    // origin → every project (spokes)
    nodes.filter(n => n.kind === "project").forEach(n => addTrace(origin, n, "spoke", 0.13));
    // origin → anchors, and the crossing kyiv↔munich
    addTrace(origin, kyiv, "spoke", 0.18);
    addTrace(origin, munich, "spoke", 0.18);
    addTrace(kyiv, munich, "cross", 0.5);
    // stack siblings (dedup pairs, cap to keep it readable)
    const projNodes = nodes.filter(n => n.kind === "project");
    let linkCount = 0;
    for (let i = 0; i < projNodes.length && linkCount < 14; i++) {
      const ti = v2_stackTokens(projNodes[i].data.stack);
      for (let j = i + 1; j < projNodes.length && linkCount < 14; j++) {
        const tj = v2_stackTokens(projNodes[j].data.stack);
        const shared = ti.filter(t => tj.includes(t));
        if (shared.length >= 1) { addTrace(projNodes[i], projNodes[j], "sib", 0.07); linkCount++; }
      }
    }

    /* ---------- packets (sprites travelling along active traces) ---------- */
    const packetGeo = (() => {
      const c = document.createElement("canvas"); c.width = c.height = 32;
      const x = c.getContext("2d");
      const g = x.createRadialGradient(16,16,0,16,16,16);
      g.addColorStop(0,"#bafff2"); g.addColorStop(0.4,"#00f0c8"); g.addColorStop(1,"rgba(0,240,200,0)");
      x.fillStyle = g; x.beginPath(); x.arc(16,16,16,0,Math.PI*2); x.fill();
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
    })();
    const packets = [];
    const PACKET_POOL = 60;
    for (let i = 0; i < PACKET_POOL; i++) {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: packetGeo, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
      sp.scale.set(0.5, 0.5, 1); sp.visible = false;
      scene.add(sp);
      packets.push({ sp, trace: null, t: 0, speed: 0, alive: false });
    }
    function emitPacket(trace, speed) {
      const p = packets.find(p => !p.alive); if (!p) return;
      p.alive = true; p.trace = trace; p.t = 0; p.speed = speed || 0.6; p.sp.visible = true;
    }

    /* ---------- starfield ---------- */
    function makeStars(count, spread, color, size, op) {
      const g = new THREE.BufferGeometry();
      const pos = new Float32Array(count*3);
      for (let i = 0; i < count; i++) {
        pos[i*3]   = (Math.random()-0.5)*spread;
        pos[i*3+1] = (Math.random()-0.5)*spread*0.7;
        pos[i*3+2] = (Math.random()-0.5)*spread;
      }
      g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      const pts = new THREE.Points(g, new THREE.PointsMaterial({ color, size, sizeAttenuation: true, transparent: true, opacity: op }));
      scene.add(pts); return pts;
    }
    const stars  = makeStars(1200, 160, 0x5b6478, 0.10, 0.7);
    const sig    = makeStars(160, 120, 0x00f0c8, 0.14, 0.8);

    /* ---------- ambient micro-nodes (fixed, decorative density) ---------- */
    const ambient = [];
    for (let i = 0; i < 90; i++) {
      const id = "0x" + (0x10+i).toString(16).toUpperCase().padStart(2,"0");
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: v2_ambient(id, THREE), transparent: true, opacity: 0.4, depthWrite: false }));
      sp.position.set((Math.random()-0.5)*70, (Math.random()-0.5)*44, (Math.random()-0.5)*70 - 6);
      sp.scale.set(1.5, 1.5, 1);
      sp.userData = { phase: Math.random()*Math.PI*2 };
      scene.add(sp); ambient.push(sp);
    }

    /* ---------- particle field — visual storytelling (prominent in SWARM) ----------
       Drifts as a quiet nebula; in SWARM it converges into a shell around the
       active waypoint node (energy gathering at each beat), then disperses. */
    const PCOUNT = 4200;
    const pPos  = new Float32Array(PCOUNT * 3);
    const pHome = new Float32Array(PCOUNT * 3);
    const pOff  = new Float32Array(PCOUNT * 3);   // unit offset → swarm shell
    const pSeed = new Float32Array(PCOUNT);
    for (let i = 0; i < PCOUNT; i++) {
      const hx = (Math.random()-0.5)*66, hy = (Math.random()-0.5)*38, hz = (Math.random()-0.5)*66 - 4;
      pHome[i*3]=hx; pHome[i*3+1]=hy; pHome[i*3+2]=hz;
      pPos[i*3]=hx;  pPos[i*3+1]=hy;  pPos[i*3+2]=hz;
      let ux=Math.random()*2-1, uy=Math.random()*2-1, uz=Math.random()*2-1;
      const ln=Math.hypot(ux,uy,uz)||1; pOff[i*3]=ux/ln; pOff[i*3+1]=uy/ln; pOff[i*3+2]=uz/ln;
      pSeed[i]=Math.random();
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
    const pDot = (() => {
      const c = document.createElement("canvas"); c.width = c.height = 24;
      const x = c.getContext("2d");
      const g = x.createRadialGradient(12,12,0,12,12,12);
      g.addColorStop(0,"#d8fff7"); g.addColorStop(0.4,"#00f0c8"); g.addColorStop(1,"rgba(0,240,200,0)");
      x.fillStyle = g; x.beginPath(); x.arc(12,12,12,0,Math.PI*2); x.fill();
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
    })();
    const pMat = new THREE.PointsMaterial({ map: pDot, size: 0.17, sizeAttenuation: true, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
    const particles = new THREE.Points(pGeo, pMat);
    scene.add(particles);

    /* ---------- WAYPOINTS — camera viewpoints for the story flight ----------
       Each: focus node + a viewing offset (dir from node to camera) + dist. */
    const WAYPOINTS = [
      { addr: "0x00", off: new THREE.Vector3(0.15, 0.05, 1),  dist: 9.5,  label: "ORIGIN" },
      { addr: "0xK",  off: new THREE.Vector3(-0.3, 0.2, 1),   dist: 7.0,  label: "KYIV" },
      { addr: "0x00", off: new THREE.Vector3(0.9, 0.15, 0.4), dist: 16,   label: "CROSSING", look: "midKM" },
      { addr: "0xM",  off: new THREE.Vector3(0.35, 0.1, 1),   dist: 7.0,  label: "MUNICH" },
      { addr: "0x00", off: new THREE.Vector3(-0.5, 0.5, 0.9), dist: 19,   label: "METHOD" },
      { addr: "0x02", off: new THREE.Vector3(0.4, 0.15, 1),   dist: 6.2,  label: "KERFUR" },
      { addr: "0x00", off: new THREE.Vector3(0.2, -0.3, 1),   dist: 21,   label: "NOW", showLive: true },
    ];
    window.UNIVERSE2_WAYPOINTS = WAYPOINTS.length;

    function wpCamPos(wp, out) {
      const n = byAddr[wp.addr] || origin;
      const dir = wp.off.clone().normalize();
      out.copy(n.mesh.position).addScaledVector(dir, wp.dist);
      return out;
    }
    function wpLookAt(wp, out) {
      if (wp.look === "midKM") { out.copy(kyiv.mesh.position).add(munich.mesh.position).multiplyScalar(0.5); return out; }
      const n = byAddr[wp.addr] || origin;
      out.copy(n.mesh.position); return out;
    }

    /* ---------- camera state ---------- */
    const cam = { pos: new THREE.Vector3(0, 2, 34), yaw: 0, pitch: 0 };
    const camT = { pos: new THREE.Vector3(0, 0, 9.5), look: new THREE.Vector3(0,0,0) };
    // start: far pull-back looking at origin
    camT.pos.set(0, 1.5, 14); camT.look.set(0,0,0);

    function orientToward(lookPos) {
      const d = lookPos.clone().sub(cam.pos);
      const yaw = Math.atan2(d.x, d.z);
      const flat = Math.sqrt(d.x*d.x + d.z*d.z);
      const pitch = Math.atan2(d.y, flat);
      return { yaw, pitch };
    }
    function applyCam() {
      const q = new THREE.Quaternion();
      const qy = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0), cam.yaw);
      const qp = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0), cam.pitch);
      // camera looks down -Z; we want yaw about Y then pitch about X
      q.multiplyQuaternions(qy, qp);
      camera.quaternion.copy(q);
      camera.position.copy(cam.pos);
    }

    /* ---------- pointer ---------- */
    const ndc = new THREE.Vector2(-2, -2);
    const cursorScreen = { x: -9999, y: -9999, has: false };
    let dragging = false, dragMoved = false, lastX = 0, lastY = 0, downX = 0, downY = 0;
    const freeRot = { yaw: 0, pitch: 0 };  // free-mode orbit offset
    const freeRotT = { yaw: 0, pitch: 0 };
    let freeDist = 0;   // free-mode dolly offset

    mount.addEventListener("pointermove", (e) => {
      const rect = mount.getBoundingClientRect();
      cursorScreen.x = e.clientX - rect.left; cursorScreen.y = e.clientY - rect.top; cursorScreen.has = true;
      ndc.x = (cursorScreen.x / rect.width) * 2 - 1;
      ndc.y = -(cursorScreen.y / rect.height) * 2 + 1;
      if (dragging) {
        const dx = e.clientX - lastX, dy = e.clientY - lastY; lastX = e.clientX; lastY = e.clientY;
        if (Math.abs(e.clientX-downX)+Math.abs(e.clientY-downY) > 6) dragMoved = true;
        freeRotT.yaw   -= dx * 0.004;
        freeRotT.pitch -= dy * 0.004;
        freeRotT.pitch = Math.max(-0.9, Math.min(0.9, freeRotT.pitch));
        hoverObjRef.current = null; setHover(null);
      } else {
        handleHover();
      }
    });
    mount.addEventListener("pointerdown", (e) => {
      dragging = true; dragMoved = false; lastX = downX = e.clientX; lastY = downY = e.clientY;
      mount.style.cursor = "grabbing"; try { mount.setPointerCapture(e.pointerId); } catch(_){}
    });
    mount.addEventListener("pointerup", (e) => {
      if (!dragging) return; dragging = false; mount.style.cursor = "grab";
      try { mount.releasePointerCapture(e.pointerId); } catch(_){}
      if (!dragMoved) handleClick();
    });
    mount.addEventListener("pointerleave", () => { cursorScreen.has = false; ndc.set(-2,-2); hoverObjRef.current = null; setHover(null); });
    mount.addEventListener("wheel", (e) => {
      if (modeRef.current !== "free") return;
      e.preventDefault();
      freeDist += e.deltaY * 0.01; freeDist = Math.max(-6, Math.min(14, freeDist));
    }, { passive: false });

    const raycaster = new THREE.Raycaster();
    function pick() {
      raycaster.setFromCamera(ndc, camera);
      const hits = raycaster.intersectObjects(nodes.map(n => n.mesh), false);
      return hits[0] ? hits[0].object.userData : null;
    }
    function nodeScreenBounds(n) {
      const rect = mount.getBoundingClientRect();
      const hw = n.mesh.geometry.parameters.width/2 * n.mesh.scale.x;
      const hh = n.mesh.geometry.parameters.height/2 * n.mesh.scale.y;
      const corners = [[-hw,-hh],[hw,-hh],[-hw,hh],[hw,hh]];
      let minX=1e9,minY=1e9,maxX=-1e9,maxY=-1e9;
      const camDir = new THREE.Vector3(); camera.getWorldDirection(camDir);
      const v = new THREE.Vector3();
      for (const [cx,cy] of corners) {
        v.set(cx,cy,0); n.mesh.localToWorld(v);
        if (v.clone().sub(camera.position).dot(camDir) <= 0) return null;
        v.project(camera);
        const sx = (v.x*0.5+0.5)*rect.width, sy = (-v.y*0.5+0.5)*rect.height;
        minX=Math.min(minX,sx); maxX=Math.max(maxX,sx); minY=Math.min(minY,sy); maxY=Math.max(maxY,sy);
      }
      return { x:minX, y:minY, w:maxX-minX, h:maxY-minY };
    }
    function handleHover() {
      const n = pick();
      if (!n || n.kind === "origin") { if (hoverObjRef.current) { hoverObjRef.current = null; setHover(null); } return; }
      hoverObjRef.current = n;
      const screen = nodeScreenBounds(n);
      if (screen) setHover({ node: n, screen });
      window.MOSound && window.MOSound.hover && window.MOSound.hover();
    }
    function handleClick() {
      const n = pick(); if (!n) return;
      if (n.data.file) {
        window.MOSound && window.MOSound.open && window.MOSound.open();
        sessionStorage.setItem("mo_navigate_from_addr", n.data.addr);
        document.body.classList.add("landing-exit");
        setTimeout(() => { window.location.href = n.data.file; }, 380);
        return;
      }
      onActive && onActive(n.data);
      // fire packets out from clicked node
      traces.filter(t => t.a === n || t.b === n).forEach(t => emitPacket(t, 0.8));
      window.MOSound && window.MOSound.tick && window.MOSound.tick();
    }

    /* ---------- resize ---------- */
    const onResize = () => { const s = sz(); w=s.w; h=s.h; renderer.setSize(w,h); camera.aspect=w/h; camera.updateProjectionMatrix(); };
    window.addEventListener("resize", onResize);
    const ro = new ResizeObserver(onResize); ro.observe(mount);

    /* ---------- direction presets ---------- */
    function dirParams(d) {
      if (d === "boot")  return { camK: 0.10, fogNear: 20, fogFar: 52, packetRate: 0.9, traceBoost: 1.4, spin: 0.0035, pOp: 0.22, pSwarm: 0.25 };
      if (d === "field") return { camK: 0.045, fogNear: 30, fogFar: 80, packetRate: 0.25, traceBoost: 0.8, spin: 0.0012, pOp: 0.0, pSwarm: 0.0 };
      if (d === "swarm") return { camK: 0.05, fogNear: 28, fogFar: 72, packetRate: 0.6, traceBoost: 1.1, spin: 0.0020, pOp: 0.85, pSwarm: 1.0 };
      return                  { camK: 0.06, fogNear: 26, fogFar: 64, packetRate: 0.5, traceBoost: 1.0, spin: 0.0022, pOp: 0.0, pSwarm: 0.0 };
    }

    /* ---------- frame loop ---------- */
    const tmpV = new THREE.Vector3();
    const camRight = new THREE.Vector3(), camUp = new THREE.Vector3(), camDir = new THREE.Vector3();
    let raf, last = performance.now(), frameI = 0, packetTimer = 0;

    function frame(now) {
      const dt = Math.min(50, now - last); last = now;
      const mode = modeRef.current;
      const dir  = dirRef.current;
      const dp = dirParams(dir);
      scene.fog.near = dp.fogNear; scene.fog.far = dp.fogFar;

      /* ----- decide camera target ----- */
      if (mode === "tour") {
        const prog = Math.max(0, Math.min(1, progRef.current));
        const segs = WAYPOINTS.length - 1;
        const f = prog * segs;
        let i = Math.floor(f); if (i >= segs) i = segs - 1;
        const localT = f - i;
        const e = localT < 0.5 ? 4*localT*localT*localT : 1 - Math.pow(-2*localT+2,3)/2; // smootherstep-ish
        const pA = new THREE.Vector3(), pB = new THREE.Vector3(), lA = new THREE.Vector3(), lB = new THREE.Vector3();
        wpCamPos(WAYPOINTS[i], pA);   wpCamPos(WAYPOINTS[i+1], pB);
        wpLookAt(WAYPOINTS[i], lA);   wpLookAt(WAYPOINTS[i+1], lB);
        camT.pos.lerpVectors(pA, pB, e);
        camT.look.lerpVectors(lA, lB, e);
        // active waypoint = nearest stop
        const wpIdx = Math.round(f);
        if (wpIdx !== lastWPRef.current) {
          lastWPRef.current = wpIdx;
          onWaypoint && onWaypoint(wpIdx, WAYPOINTS[wpIdx]);
          // emit packets around the focus node on arrival
          const fn = byAddr[WAYPOINTS[wpIdx].addr];
          if (fn) traces.filter(t => t.a === fn || t.b === fn).forEach(t => emitPacket(t, 0.7));
          window.MOSound && window.MOSound.tick && window.MOSound.tick();
        }
      } else if (mode === "free") {
        // orbit around origin (or last focus) using free rotation
        const focus = origin.mesh.position;
        const baseDist = 16 + freeDist;
        freeRot.yaw   += (freeRotT.yaw   - freeRot.yaw)   * 0.08;
        freeRot.pitch += (freeRotT.pitch - freeRot.pitch) * 0.08;
        camT.pos.set(
          focus.x + Math.sin(freeRot.yaw) * Math.cos(freeRot.pitch) * baseDist,
          focus.y + Math.sin(freeRot.pitch) * baseDist + 1.5,
          focus.z + Math.cos(freeRot.yaw) * Math.cos(freeRot.pitch) * baseDist,
        );
        camT.look.copy(focus);
      } else {
        // intro — gentle orbit drift looking at origin
        const t = now * 0.0001;
        camT.pos.set(Math.sin(t) * 13, 1.5 + Math.sin(t*0.7)*1.5, Math.cos(t) * 13);
        camT.look.set(0, 0, 0);
      }

      /* ----- ease camera ----- */
      const k = 1 - Math.pow(1 - dp.camK, dt / 16);
      cam.pos.lerp(camT.pos, k);
      const target = orientToward(camT.look);
      // ease yaw with shortest-arc
      let dyaw = target.yaw - cam.yaw;
      while (dyaw > Math.PI) dyaw -= Math.PI*2; while (dyaw < -Math.PI) dyaw += Math.PI*2;
      cam.yaw += dyaw * k;
      cam.pitch += (target.pitch - cam.pitch) * k;
      applyCam();

      camera.getWorldDirection(camDir);
      camRight.set(1,0,0).applyQuaternion(camera.quaternion);
      camUp.set(0,1,0).applyQuaternion(camera.quaternion);

      const rect = mount.getBoundingClientRect();

      /* ----- nodes: gravity, vitals, orientation ----- */
      const hoverNode = hoverObjRef.current;
      for (const n of nodes) {
        // magnetic gravity — pull toward cursor in screen space (project node)
        let gx = 0, gy = 0, near = 0;
        if (cursorScreen.has && mode !== "tour") {
          tmpV.copy(n.mesh.position).project(camera);
          if (tmpV.z < 1) {
            const sx = (tmpV.x*0.5+0.5)*rect.width, sy = (-tmpV.y*0.5+0.5)*rect.height;
            const ddx = cursorScreen.x - sx, ddy = cursorScreen.y - sy;
            const d2 = Math.hypot(ddx, ddy);
            const R = 240;
            if (d2 < R) {
              near = 1 - d2 / R;
              const pull = near * near * 1.1;
              gx = (ddx / (d2 || 1)) * pull;
              gy = (ddy / (d2 || 1)) * pull;
            }
          }
        }
        // convert screen pull to world offset along camera right/up
        const targetGrav = camRight.clone().multiplyScalar(gx).add(camUp.clone().multiplyScalar(-gy));
        n.grav.lerp(targetGrav, 0.12);
        n.mesh.position.copy(n.base).add(n.grav);

        // billboard toward camera
        const m = new THREE.Matrix4().lookAt(camera.position, n.mesh.position, camera.up);
        n.mesh.quaternion.slerp(new THREE.Quaternion().setFromRotationMatrix(m), n.kind === "origin" ? 0.2 : 0.09);

        // vital signs — heartbeat for live, steady for shipped
        n.pulse += dt * 0.001 * (n.data.live ? 2.4 : 1.0);
        const beat = n.data.live ? (0.5 + 0.5*Math.pow(Math.max(0, Math.sin(n.pulse)), 6)) : (0.5 + 0.5*Math.sin(n.pulse));
        const vital = n.data.live ? 1 + beat*0.06 : 1 + beat*0.02;

        // focus scale on hover / magnetism
        const focused = hoverNode === n;
        const targetScale = n.baseScale * vital * (focused ? 1.16 : 1) * (1 + near*0.10);
        n.mesh.scale.lerp(new THREE.Vector3(targetScale, targetScale, 1), 0.12);

        // opacity by distance + dim non-focus slightly when hovering
        const dist = n.mesh.position.distanceTo(camera.position);
        let op = THREE.MathUtils.smoothstep(dist, 2, 7) * (1 - THREE.MathUtils.smoothstep(dist, 50, 80));
        if (n.kind === "origin") op = Math.max(op, 0.85);
        if (hoverNode && !focused && n.kind === "project") op *= 0.5;
        n.mesh.material.opacity = op;
      }

      /* ----- model overlays follow their node ----- */
      for (const holder of modelHolders) {
        if (!holder.userData.loaded) continue;
        const n = holder.userData.node;
        const fwd = camDir.clone().multiplyScalar(-1.2);
        holder.position.copy(n.mesh.position).add(fwd).add(camUp.clone().multiplyScalar(n.mesh.scale.y*0.4));
        holder.rotation.y += 0.004;
        const op = Math.min(0.95, n.mesh.material.opacity * 1.1);
        holder.visible = op > 0.03;
        holder.traverse(o => { if (o.isMesh && o.material) o.material.opacity = op; });
        const s = n.mesh.scale.x * 0.95;
        holder.scale.lerp(new THREE.Vector3(s,s,s), 0.1);
      }

      /* ----- traces ----- */
      const hov = hoverObjRef.current;
      for (const tr of traces) {
        const pa = tr.a.mesh.position, pb = tr.b.mesh.position;
        const arr = tr.geo.attributes.position.array;
        arr[0]=pa.x; arr[1]=pa.y; arr[2]=pa.z; arr[3]=pb.x; arr[4]=pb.y; arr[5]=pb.z;
        tr.geo.attributes.position.needsUpdate = true;
        const related = hov && (tr.a === hov || tr.b === hov);
        const focusWP = mode === "tour" && byAddr[WAYPOINTS[Math.max(0,lastWPRef.current)]?.addr];
        const wpRel = focusWP && (tr.a === focusWP || tr.b === focusWP);
        let targetOp = tr.baseOp * dp.traceBoost;
        if (related || wpRel) targetOp = Math.min(0.9, tr.baseOp * 4 + 0.3);
        tr.mat.opacity += (targetOp - tr.mat.opacity) * 0.1;
      }

      /* ----- emit ambient packets along the crossing + a random trace ----- */
      packetTimer += dt;
      const interval = 900 / dp.packetRate;
      if (packetTimer > interval) {
        packetTimer = 0;
        const cross = traces.find(t => t.kind === "cross");
        if (cross) emitPacket(cross, 0.5);
        if (Math.random() < dp.packetRate) emitPacket(traces[Math.floor(Math.random()*traces.length)], 0.5 + Math.random()*0.4);
      }
      /* ----- update packets ----- */
      for (const p of packets) {
        if (!p.alive) continue;
        p.t += p.speed * dt / 1000;
        if (p.t >= 1 || !p.trace) { p.alive = false; p.sp.visible = false; p.sp.material.opacity = 0; continue; }
        const pa = p.trace.a.mesh.position, pb = p.trace.b.mesh.position;
        p.sp.position.lerpVectors(pa, pb, p.t);
        p.sp.material.opacity = Math.sin(p.t * Math.PI) * 0.9;
        const sc = 0.4 + Math.sin(p.t*Math.PI)*0.4;
        p.sp.scale.set(sc, sc, 1);
      }

      /* ----- starfield slow spin ----- */
      stars.rotation.y += dp.spin * dt / 16 * 0.3;
      sig.rotation.y   -= dp.spin * dt / 16 * 0.5;

      /* ----- ambient pulse ----- */
      for (const sp of ambient) {
        const ph = sp.userData.phase + now * 0.0007;
        sp.material.opacity = (0.25 + Math.sin(ph)*0.15) * (mode === "tour" ? 0.5 : 1);
      }

      /* ----- particle field ----- */
      pMat.opacity += (dp.pOp - pMat.opacity) * 0.05;
      if (pMat.opacity > 0.01) {
        const swarm = dp.pSwarm;
        const fNode = mode === "tour" ? (byAddr[WAYPOINTS[Math.max(0, lastWPRef.current)]?.addr] || origin) : origin;
        const fx = fNode.mesh.position.x, fy = fNode.mesh.position.y, fz = fNode.mesh.position.z;
        const ang = now * 0.0002, cc = Math.cos(ang), ss = Math.sin(ang);
        const shell = 4.6;
        const rate = 1 - Math.pow(1 - 0.05, dt / 16);
        const arr = pGeo.attributes.position.array;
        for (let i = 0; i < PCOUNT; i++) {
          const i3 = i * 3;
          let tx, ty, tz;
          if (swarm > 0.01) {
            const ox = pOff[i3], oz = pOff[i3 + 2];
            const rx = ox * cc - oz * ss, rz = ox * ss + oz * cc;
            const rad = shell * (0.6 + pSeed[i] * 1.0);
            tx = pHome[i3]     * (1 - swarm) + (fx + rx * rad)            * swarm;
            ty = pHome[i3 + 1] * (1 - swarm) + (fy + pOff[i3 + 1] * rad*0.7) * swarm;
            tz = pHome[i3 + 2] * (1 - swarm) + (fz + rz * rad)            * swarm;
          } else { tx = pHome[i3]; ty = pHome[i3 + 1]; tz = pHome[i3 + 2]; }
          arr[i3]     += (tx - arr[i3])     * rate;
          arr[i3 + 1] += (ty - arr[i3 + 1]) * rate;
          arr[i3 + 2] += (tz - arr[i3 + 2]) * rate;
        }
        pGeo.attributes.position.needsUpdate = true;
      }

      /* ----- hover overlay tracking ----- */
      if (hoverObjRef.current && overlayRef.current) {
        const screen = nodeScreenBounds(hoverObjRef.current);
        const el = overlayRef.current;
        if (screen) { el.style.display=""; el.style.left=Math.round(screen.x)+"px"; el.style.top=Math.round(screen.y)+"px"; el.style.width=Math.round(screen.w)+"px"; el.style.height=Math.round(screen.h)+"px"; }
        else el.style.display = "none";
      }

      /* ----- status HUD ~3hz ----- */
      frameI++;
      if (frameI % 18 === 0) {
        const fa = mode === "tour" ? (WAYPOINTS[Math.max(0,lastWPRef.current)]?.addr || "0x00") : (hoverObjRef.current?.data.addr || "0x00");
        setStatus({
          node: fa,
          trace: hoverObjRef.current ? (traces.filter(t=>t.a===hoverObjRef.current||t.b===hoverObjRef.current).length + " LINKS") : (traces.length + " TRACES"),
          sig: mode === "tour" ? (WAYPOINTS[Math.max(0,lastWPRef.current)]?.label || "—") : (hoverObjRef.current?.data.live ? "● LIVE" : "ORIGIN"),
        });
      }

      renderer.render(scene, camera);
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    mount.style.cursor = "grab";

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize); ro.disconnect();
      try { mount.removeChild(renderer.domElement); } catch(_){}
      renderer.dispose();
      nodes.forEach(n => { n.mesh.geometry.dispose(); n.mesh.material.map?.dispose(); n.mesh.material.dispose(); });
      traces.forEach(t => { t.geo.dispose(); t.mat.dispose(); });
      packets.forEach(p => p.sp.material.dispose());
      ambient.forEach(s => { s.material.map?.dispose(); s.material.dispose(); });
      pGeo.dispose(); pMat.map?.dispose(); pMat.dispose();
      stars.geometry.dispose(); sig.geometry.dispose();
    };
  }, []);

  return (
    <div className="universe universe2" data-screen-label="Universe">
      <div className="universe__mount" ref={mountRef} />

      {hover && (
        <pre className="universe__ascii u2-ascii" ref={overlayRef}
          style={{ left: Math.round(hover.screen.x), top: Math.round(hover.screen.y), width: Math.round(hover.screen.w), height: Math.round(hover.screen.h) }}>
          {u2_ascii(hover.node)}
        </pre>
      )}

      <div className="u2-hud u2-hud--bl">
        <div className="u2-hudRow"><span className="u2-hudKey">FOCUS</span><span className="u2-hudVal">{status.node}</span></div>
        <div className="u2-hudRow"><span className="u2-hudKey">NET</span><span className="u2-hudVal">{status.trace}</span></div>
        <div className="u2-hudRow"><span className="u2-hudKey">SIG</span><span className="u2-hudVal">{status.sig}</span></div>
      </div>
    </div>
  );
}

/* small ascii body for hover overlay (kept lean) */
function u2_ascii(n) {
  const cols = 22, rows = 12, RAMP = " .·:-=+*#%@";
  const out = [];
  const t1 = "■ " + (n.data.addr || ""); const t2 = (n.data.year || "").toUpperCase();
  out.push((t1 + " ".repeat(Math.max(1, cols - t1.length - t2.length)) + t2).slice(0, cols));
  out.push("─".repeat(cols));
  const inner = rows - 5;
  const seed = (n.data.addr || "0x").charCodeAt(2) || 5;
  for (let r = 0; r < inner; r++) {
    let ln = "";
    for (let c = 0; c < cols; c++) {
      const dx = (c-(cols-1)/2)/((cols-1)/2), dy = (r-(inner-1)/2)/((inner-1)/2);
      const d = Math.sqrt(dx*dx*0.5 + dy*dy);
      const nz = Math.sin(c*0.5+r*0.7+seed)*0.15;
      const v = Math.max(0, Math.min(1, 1 - d*1.1 + nz));
      ln += RAMP[Math.floor(v*(RAMP.length-1))];
    }
    out.push(ln);
  }
  out.push("─".repeat(cols));
  out.push((n.data.name||"").toUpperCase().slice(0,cols).padEnd(cols," "));
  out.push((n.data.file ? "OPEN →" : (n.data.sub||"")).slice(0,cols).padEnd(cols," "));
  return out.slice(0, rows).join("\n");
}

window.Universe2 = Universe2;
