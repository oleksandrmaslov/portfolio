/* ============================================================
   M.O. SYSTEM — SINGLE SOURCE OF PROJECT DATA
   Plain JS (no bundler). Load BEFORE universe.jsx / work.jsx /
   node-handoff.jsx. Every node in the field lives here — cards,
   universe tiles, All Projects index and the handoff all read
   window.MO_PROJECTS.

   model:
     enabled  — the card reserves a 3D stage no matter what
     ready    — a real GLB exists at src
     src      — GLB path (null → procedural proxy "node-shell")
     cardPose / handoffPose / pagePose — per-model tuning; NEVER
     hardcode orientation or scale inside React components.
   ============================================================ */
(function () {
  const HANDOFF_DEFAULTS = { scale: 0.60, restX: 0.46, offsetY: 0, spinSpeed: 0.0039, duration: 1200 };
  const mdl = (over) => Object.assign({
    enabled: true, ready: false, src: null, format: "glb", proxy: "node-shell",
    cardPose: { scale: 1, yaw: 0, pitch: 0, offsetY: 0, fit: 2.4 },
    handoffPose: Object.assign({}, HANDOFF_DEFAULTS),
    pagePose: { scale: 0.88, restX: 0.46, offsetY: 0 },
  }, over || {});

  window.MO_PROJECTS = [
    {
      addr: "0x01", slug: "wafer", name: "Wafer",
      nodeClass: "OBJECT", state: "WORKING PROTOTYPE", featured: true,
      file: "Wafer v3.html",
      statement: "An ultrathin wireless split keyboard built as one complete portable product system.",
      short: "Ultrathin wireless split keyboard",
      tags: ["Hardware", "ZMK", "Zephyr", "Product Design"],
      model: mdl({
        ready: true, src: "models/wafer_demo.glb", proxy: null,
        rigPose: { x: -0.92, y: 0, z: 0 },
        cardPose: { scale: 1, yaw: 0, pitch: 0, offsetY: 0, fit: 2.9, pose: { x: -1.15, y: 0, z: 0 } },
        handoffPose: Object.assign({}, HANDOFF_DEFAULTS),
        pagePose: { scale: 0.92, restX: 0.46, offsetY: 0 },
      }),
    },
    {
      addr: "0x02", slug: "kerfur", name: "Kerfur",
      nodeClass: "BEHAVIORAL OBJECT", state: "ACTIVE DEVELOPMENT", featured: true,
      file: "Kerfur v2.html",
      statement: "A networked embedded companion inspired by Voices of the Void.",
      short: "Networked embedded companion",
      tags: ["Hardware", "Zephyr", "BLE", "Open Source"],
      model: mdl({}),
    },
    {
      addr: "0x03", slug: "iskra", name: "Iskra",
      nodeClass: "PRODUCTION SYSTEM", state: "ACTIVE", featured: true,
      file: "Iskra v3.html",
      statement: "A guided flashing environment for people who should never need a command line or toolchain.",
      short: "Guided flashing environment",
      tags: ["Firmware", "Desktop", "Volunteer", "Open Source"],
      model: mdl({
        ready: true, src: "models/iskra-mark.glb", proxy: null,
        rigPose: { x: -0.2, y: 0, z: 0 },
        cardPose: { scale: 1, yaw: 0.4, pitch: 0.12, offsetY: 0, fit: 1.05 },
      }),
    },
    {
      addr: "0x04", slug: "ci-clop", name: "Ci-Clop",
      nodeClass: "EMBEDDED HARDWARE", state: "WORKING PROTOTYPE", featured: true,
      file: "Tactical Flashlight v2.html",
      statement: "A tactical light interface designed for immediate control under stress.",
      short: "Tactical light interface",
      tags: ["Hardware", "Firmware", "Volunteer"],
      model: mdl({
        ready: true, src: "models/tactical_flashlight.glb", proxy: null,
        rigPose: { x: 0, y: 0, z: 1.5708 },
        cardPose: { scale: 1, yaw: 0.6, pitch: 0.1, offsetY: 0, fit: 1.25, pose: { x: 0, y: 0, z: 1.5708 } },
        assignMaterial: { color: 0x4b5a32, metalness: 0.28, roughness: 0.62 },
      }),
    },
    {
      addr: "0x05", slug: "venovisor", name: "Venovisor",
      nodeClass: "WEARABLE EXPERIMENT", state: "FORMING", featured: false,
      file: null,
      statement: "A compact wearable interface exploring low-power information at eye level.",
      short: "Wearable eye-level interface",
      tags: ["Hardware", "Volunteer", "Displays"],
      model: mdl({}),
    },
    {
      addr: "0x06", slug: "wafer-studio", name: "Wafer Studio",
      nodeClass: "PRODUCT SOFTWARE", state: "ACTIVE DEVELOPMENT", featured: true,
      file: "Wafer Studio.html",
      statement: "A visual ZMK configuration environment built around real keyboard editing.",
      short: "Visual ZMK configuration environment",
      tags: ["Software", "ZMK", "Tooling"],
      model: mdl({
        ready: true, src: "models/wafer-mark.glb", proxy: null,
        rigPose: { x: -0.2, y: 0, z: 0 },
        cardPose: { scale: 1, yaw: 0.35, pitch: 0.1, offsetY: 0, fit: 1.05 },
      }),
    },
    {
      addr: "0x07", slug: "zmk-split-hid", name: "ZMK Split HID Display",
      nodeClass: "FIRMWARE SYSTEM", state: "ACTIVE", featured: true,
      file: "Split HID Display v2.html",
      statement: "Host information synchronized across both halves of a wireless split keyboard.",
      short: "Split-synchronized host display",
      tags: ["ZMK", "Zephyr", "Displays"],
      model: mdl({
        ready: true, src: "models/keyboard-display.opt.glb", proxy: null,
        rigPose: { x: -0.08, y: -0.24, z: 0 },
        cardPose: { scale: 1, yaw: 0, pitch: 0, offsetY: 0, fit: 1.60, pose: { x: -0.08, y: -0.24, z: 0 } },
      }),
    },
    {
      addr: "0x08", slug: "zmk-pointaccel", name: "ZMK Pointing Acceleration",
      nodeClass: "OPEN-SOURCE MODULE", state: "ACTIVE", featured: false,
      file: "ZMK-PointAccel v2.html",
      statement: "Configurable acceleration curves for embedded pointing devices.",
      short: "Pointer acceleration module",
      tags: ["ZMK", "Zephyr", "Open Source"],
      model: mdl({
        ready: true, src: "models/zmk-mark.glb", proxy: null,
        rigPose: { x: -0.2, y: 0, z: 0 },
        cardPose: { scale: 1, yaw: 0.35, pitch: 0.1, offsetY: 0, fit: 1.05 },
      }),
    },
    {
      addr: "0x09", slug: "zmk-soft-off-plus", name: "ZMK Soft Off Plus",
      nodeClass: "FIRMWARE MODULE", state: "ACTIVE", featured: false,
      file: null,
      statement: "Reliable shutdown and wake behaviour for wireless split keyboards.",
      short: "Shutdown + wake firmware module",
      tags: ["ZMK", "Zephyr", "Power"],
      model: mdl({
        ready: true, src: "models/soft-off-keycap.opt.glb", proxy: null,
        rigPose: { x: -0.18, y: 0.38, z: 0 },
        cardPose: { scale: 1, yaw: 0, pitch: 0, offsetY: 0, fit: 1.35, pose: { x: -0.18, y: 0.38, z: 0 } },
      }),
    },
    {
      addr: "0x0A", slug: "sightseeing-inc", name: "Sightseeing.inc",
      nodeClass: "INTERFACE STUDY", state: "ARCHIVED", featured: false,
      file: null,
      statement: "An adaptive city exploration and route-building application.",
      short: "Adaptive city exploration app",
      tags: ["Design"],
      model: mdl({
        ready: true, src: "models/sightseeing-mark.glb", proxy: null,
        rigPose: { x: -0.2, y: 0, z: 0 },
        cardPose: { scale: 1, yaw: 0.35, pitch: 0.1, offsetY: 0, fit: 1.05 },
      }),
    },
    {
      addr: "0x0B", slug: "silent-depth", name: "Silent Depth",
      nodeClass: "VISUAL STUDY", state: "ARCHIVED", featured: false,
      file: null,
      statement: "A visual study of gaze, silence and invisible human connection.",
      short: "Study of gaze and silence",
      tags: ["Visual", "Study"],
      model: mdl({
        ready: true, src: "models/silent-depth-mark.glb", proxy: null,
        rigPose: { x: -0.2, y: 0, z: 0 },
        cardPose: { scale: 1, yaw: 0.35, pitch: 0.1, offsetY: 0, fit: 1.05 },
      }),
    },
    {
      addr: "0x0C", slug: "brionel-catalogue", name: "Brionel Product Catalogue",
      nodeClass: "CLIENT WORK", state: "ARCHIVED", featured: false,
      file: null,
      statement: "A scalable editorial system created for a catalogue of more than 70 products.",
      short: "Editorial system · 70+ products",
      tags: ["Design", "Editorial", "Client"],
      model: mdl({
        ready: true, src: "models/brionel-mark.glb", proxy: null,
        rigPose: { x: -0.2, y: 0, z: 0 },
        cardPose: { scale: 1, yaw: 0.35, pitch: 0.1, offsetY: 0, fit: 1.05 },
      }),
    },
  ];

  /* Selected nodes on the landing — order matters (reel order). */
  window.MO_FEATURED_ADDRS = ["0x01", "0x03", "0x04", "0x06"];

  window.MO_PROJECT_BY_ADDR = {};
  for (const p of window.MO_PROJECTS) window.MO_PROJECT_BY_ADDR[p.addr] = p;

  /* TODO(models): Venovisor and Kerfur have no GLB yet, so they render
     the "node-shell" proxy.
     To wire a future model: set ready: true + src: "models/<file>.glb". */
})();
