/* ============================================================
   M.O. SYSTEM — Project data
   Keyed by addr. Each entry feeds project/page.jsx.
   ============================================================ */

const PROJECT_DATA = {
  /* =========================================================
     0x01 · WAFER
     ========================================================= */
  "0x01": {
    addr: "0x01",
    slug: "wafer",
    file: "Wafer.html",
    file2: "Wafer v2.html",
    name: "Wafer",
    tagline: "36-key ultrathin split keyboard",
    overline: "EMBEDDED · HARDWARE · FIRMWARE",
    year: "2025",
    place: "Munich, DE",
    role: "Designer · firmware · hardware",
    stack: ["ZMK", "Zephyr", "KiCad", "nRF52840", "NPM1300", "Sharp memory"],
    primitive: "slab",                // small 3D object kind
    model: "models/wafer.glb",        // optimized GLB (~2 MB, meshopt)
    modelFit: 3.4,                    // longest-edge size in world units (bigger = bigger on card)
    modelPose: { x: 1.05, y: 0, z: 0 }, // rest pose — keyboard face toward the camera
    demoSize: { d: 200, w: 110, h: 14 }, // demo model dimensions (label values)
    metrics: [
      { value: "4–8", unit: "mm height" },
      { value: "36",  unit: "keys total" },
      { value: "R3",  unit: "revision" },
    ],
    intro:
      "Wafer is the third revision of a 36-key split keyboard that sits flush on the desk. " +
      "Aluminium case, magnetic mating, 4–8 mm build height. Custom PCB on ISP1807 (nRF52840) " +
      "with NPM1300 PMIC and a Sharp memory display. I designed the schematic, drew the boards, " +
      "milled the prototypes, and wrote the firmware on a ZMK fork — including the I2C driver " +
      "for the PMIC and direct battery-voltage readout, which I merged upstream into ZMK.",
    sections: [
      { kind: "stub", h: "Brief",
        body: "[ writing pending · 22-05 · the constraint set: thin, split, no compromise on key feel — and why R1 and R2 didn't get there yet ]" },
      { kind: "stub", h: "Hardware",
        body: "[ writing pending · 22-05 · schematic, stackup, key wells, magnetic mating, case milling, what broke twice before R3 settled ]" },
      { kind: "photo", caption: "case + boards — R3 prototype, top view" },
      { kind: "stub", h: "Firmware",
        body: "[ writing pending · 22-05 · the ZMK fork, the NPM1300 driver, the memory display path, sleep / wake states ]" },
      { kind: "photo", caption: "Sharp memory display · live status surface" },
      { kind: "stub", h: "What I'd do next",
        body: "[ writing pending · 22-05 · R4: per-key RGB? thinner stack? wireless dongle vs direct?" +
              " — open questions I haven't answered yet ]" },
    ],
    links: [
      { kind: "GITHUB",  label: "oleksandrmaslov/wafer",          href: "https://github.com/oleksandrmaslov" },
      { kind: "CASE PDF", label: "case-file · 8 pages · pending", href: "#" },
      { kind: "ZMK PR",  label: "battery-voltage · merged",       href: "#" },
    ],
    prev: "0x09",
    next: "0x02",
  },

  /* =========================================================
     0x02 · KERFUR
     ========================================================= */
  "0x02": {
    addr: "0x02",
    slug: "kerfur",
    file: "Kerfur.html",
    file2: "Kerfur v2.html",
    name: "Kerfur",
    tagline: "Embedded pet on nRF52840",
    overline: "EMBEDDED · ARCHITECTURE · BLE",
    year: "2025 —",
    place: "Munich, DE",
    role: "Solo · firmware · architecture",
    stack: ["C", "Zephyr", "LVGL", "BLE", "IMU"],
    primitive: "sphere",
    demoSize: { d: 38, w: 38, h: 38 },
    metrics: [
      { value: "10k+", unit: "lines of C" },
      { value: "ø38",  unit: "mm body" },
      { value: "0×",   unit: "god-loops" },
    ],
    intro:
      "Kerfur is a small embedded pet that behaves less like a gadget and more like a contextual " +
      "emotional companion — it interprets events emotionally instead of just displaying them. " +
      "Event-driven firmware in 10,000+ lines of C on a Zephyr / nRF52840 base, built around a " +
      "central event bus — the nervous system — rather than a god-loop. An emotion engine carries " +
      "decaying variables (mood, energy, curiosity, affection, social interest, stress); a behaviour " +
      "layer turns state-plus-event-plus-context into a reaction; an IMU reads motion; an OLED face " +
      "renders expressions through LVGL. BLE handles both phone notifications and a nearby-Kerfur " +
      "social module — rotating ephemeral IDs, an RSSI proximity estimate, and a peer state machine — " +
      "because the rule is: first Kerfur meet each other, then people meet each other.",
    sections: [
      { kind: "stub", h: "Brief",
        body: "[ writing pending · 22-05 · what 'pet' means in software terms — a contextual emotional companion, not a notification screen · why the architecture matters more than the cuteness · 'first Kerfur meet each other, then people meet each other' ]" },
      { kind: "stub", h: "The event bus",
        body: "[ writing pending · 22-05 · the nervous system · publish / subscribe with priority lanes, timestamps + optional payloads · every touch, motion, notification, battery and peer event becomes a message · why this beats a giant switch ]" },
      { kind: "photo", caption: "Kerfur v0 · face render · LVGL canvas" },
      { kind: "stub", h: "Emotion + behaviour",
        body: "[ writing pending · 22-05 · decaying emotional variables (mood / energy / curiosity / affection / social interest / stress) · a behaviour layer mapping state + event + context → reaction · cooldowns so it never repeats itself · context over raw event ]" },
      { kind: "photo", caption: "biological reference unit · subject KERFUR_v0" },
      { kind: "stub", h: "Nearby Kerfur",
        body: "[ writing pending · 22-05 · BLE scan + advertise with rotating ephemeral IDs · RSSI proximity · peer state machine NONE → SEEN → NEAR → KNOWN → FRIEND → COOLDOWN · curiosity toward strangers, a warm greeting for friends · privacy: never a tracker ]" },
    ],
    links: [
      { kind: "GITHUB",  label: "oleksandrmaslov/kerfur-zephyr-config", href: "https://github.com/oleksandrmaslov/kerfur-zephyr-config" },
      { kind: "CASE PDF", label: "case-file · 12 pages · pending", href: "#" },
    ],
    prev: "0x01",
    next: "0x03",
  },

  /* =========================================================
     0x03 · ZMK POINTING ACCELERATION
     ========================================================= */
  "0x03": {
    addr: "0x03",
    slug: "zmk-pointaccel",
    file: "ZMK-PointAccel.html",
    file2: "ZMK-PointAccel v2.html",
    name: "ZMK PointAccel",
    tagline: "Open-source input processor",
    overline: "OPEN SOURCE · INPUT · DEVICETREE",
    year: "2025",
    place: "Munich, DE",
    role: "Maintainer · open source",
    stack: ["C", "ZMK", "Devicetree", "Streamlit", "Python"],
    primitive: "torus",
    demoSize: { d: 64, w: 64, h: 18 },
    metrics: [
      { value: "★ 25", unit: "github stars" },
      { value: "2",    unit: "curve modes" },
      { value: "v0.3", unit: "release" },
    ],
    intro:
      "A public ZMK input processor for smooth, configurable pointer acceleration on " +
      "trackpads and pointing devices. Linear and exponential curves, velocity scaling, " +
      "precise slow / fast movement separation. Plus a Streamlit configurator that emits " +
      "ready-to-paste Devicetree snippets so users don't have to read the C to use it.",
    sections: [
      { kind: "stub", h: "Brief",
        body: "[ writing pending · 22-05 · why ZMK didn't have this · what makes 'good' acceleration · referring to macOS / X11 / libinput ]" },
      { kind: "stub", h: "The curve",
        body: "[ writing pending · 22-05 · linear vs exponential, velocity scaling, sub-pixel accumulator ]" },
      { kind: "photo", caption: "Streamlit configurator · curve preview · DT emit" },
      { kind: "stub", h: "Configurator",
        body: "[ writing pending · 22-05 · Streamlit form → devicetree string, copy-paste flow, presets ]" },
      { kind: "stub", h: "Upstreaming",
        body: "[ writing pending · 22-05 · how it lives outside the tree, what would need to change to merge ]" },
    ],
    links: [
      { kind: "GITHUB",     label: "oleksandrmaslov/zmk-pointing-accel", href: "https://github.com/oleksandrmaslov" },
      { kind: "STREAMLIT",  label: "configurator · live",                 href: "#" },
      { kind: "DOCS",       label: "usage · presets",                     href: "#" },
    ],
    prev: "0x02",
    next: "0x04",
  },

  /* =========================================================
     0x04 · TACTICAL FLASHLIGHT
     ========================================================= */
  "0x04": {
    addr: "0x04",
    slug: "tactical-flashlight",
    file: "Tactical-Flashlight.html",
    file2: "Tactical Flashlight v2.html",
    name: "Tactical Flashlight",
    tagline: "Volunteer firmware · For Energy for Ukraine",
    overline: "VOLUNTEER · FIRMWARE · SCHEMATIC",
    year: "12 / 2025",
    place: "Munich → Kyiv",
    role: "Volunteer · firmware · schematic",
    stack: ["C", "ARM Cortex-M0", "PY32F002A", "KiCad"],
    primitive: "cone",
    model: "models/tactical_flashlight.glb",
    demoSize: { d: 120, w: 28, h: 28 },
    metrics: [
      { value: "PY32", unit: "F002A · ARM-M0" },
      { value: "2",    unit: "light modes + SOS" },
      { value: "1",    unit: "schematic · prod-ready" },
    ],
    intro:
      "Volunteer firmware written in C for an ARM Cortex-M0 (PY32F002A) — two light modes " +
      "with saved brightness, SOS, and battery indication on addressable LEDs. I also drew " +
      "the schematic and prepared the prototype for production in China. The fund delivers " +
      "torches to frontline volunteers; my part was making one cheap MCU do exactly what " +
      "the soldiers in the field actually need it to do, in the dark, with cold hands.",
    sections: [
      { kind: "stub", h: "Brief",
        body: "[ writing pending · 22-05 · why PY32F002A · why volunteer firmware can't be 'fine' · cost / sourcing ]" },
      { kind: "stub", h: "Modes",
        body: "[ writing pending · 22-05 · brightness memory, SOS, low-batt indication, no-state-loss across power cycles ]" },
      { kind: "photo", caption: "PCB · rev 1 · ready for production" },
      { kind: "stub", h: "Production",
        body: "[ writing pending · 22-05 · BOM, gerbers, panelisation notes, what changed for manufacturing ]" },
      { kind: "photo", caption: "torches · post-assembly · in the field" },
    ],
    links: [
      { kind: "GITHUB",  label: "oleksandrmaslov/tac-light", href: "https://github.com/oleksandrmaslov" },
      { kind: "CASE PDF", label: "case-file · 6 pages · pending", href: "#" },
      { kind: "PROJECT", label: "Energy for Ukraine", href: "#" },
    ],
    prev: "0x03",
    next: "0x07",
  },
};

/* =========================================================
   0x09 · ISKRA  (full-weight page · replaces the Wafer R1–R3
   card slot). Nav chained into the existing v2 ring so the
   footer works standalone before the universe cards are
   swapped over.
   ========================================================= */
PROJECT_DATA["0x09"] = {
  addr: "0x09",
  slug: "iskra",
  file: "Iskra v2.html",
  file2: "Iskra v2.html",
  name: "Iskra",
  tagline: "Volunteer flashing station · zero firmware knowledge needed",
  overline: "FLASHING STATION · FACTORY-SAFE · WPF",
  year: "05 / 2026",
  place: "Munich → Kyiv",
  role: "Tooling · C# · state machine",
  stack: ["C#", ".NET / WPF", "Black Magic Probe", "arm-none-eabi-gdb", "SQLite", "Ed25519"],
  primitive: "slab",
  model: "models/wafer.glb",
  demoSize: { d: 120, w: 28, h: 28 },
  metrics: [
    { value: "2-PHASE", unit: "scan → flash · safe-by-design" },
    { value: "Ed25519", unit: "signed catalog · SHA-256" },
    { value: "0",       unit: "commands typed by volunteers" },
  ],
  intro:
    "Iskra (Іскра — 'spark') is a Windows flashing station for Energy for Ukraine volunteers " +
    "who have never written a firmware command in their life. They pick their name, a batch, " +
    "and a product from a signed catalog, plug in the board, and press one big FLASH key. " +
    "Underneath, a two-phase state machine scans the target first — and bails safely before " +
    "touching flash if the wrong board is connected — then flashes and verifies, logging every " +
    "unit. It turns a GDB-and-Black-Magic-Probe ritual into something a volunteer can run a " +
    "hundred times a night without ever being able to brick a board.",
  sections: [
    { kind: "stub", h: "Why",
      body: "[ writing pending · the volunteer reality: no toolchain, no terminal, no room for a bricked board · why a GUI beats a wiki page ]" },
    { kind: "stub", h: "Two-phase safety",
      body: "[ writing pending · scan-only phase 1 (swdp_scan, no attach/load) · E_TARGET_MISMATCH bails before any write · phase 2 flash + compare-sections ]" },
    { kind: "photo", caption: "station · operator view · one FLASH key" },
    { kind: "stub", h: "Trust chain",
      body: "[ writing pending · Ed25519-signed catalog · SHA-256 preflight · batch lock pins product+version for a lot · SQLite history + CSV ]" },
    { kind: "stub", h: "Packaging",
      body: "[ writing pending · GitHub device-flow firmware fetch · DPAPI token storage · toolchain-bundling installer · CLI parity ]" },
    { kind: "photo", caption: "flashing line · Black Magic Probe · field assembly" },
  ],
  links: [
    { kind: "GITHUB",  label: "oleksandrmaslov/iskra", href: "https://github.com/oleksandrmaslov/iskra" },
    { kind: "INSTALLER", label: "Iskra setup · Windows · pending", href: "#" },
    { kind: "PROJECT", label: "Energy for Ukraine", href: "#" },
  ],
  prev: "0x08",
  next: "0x01",
};

/* =========================================================
   0x07 · M.O. SYSTEM  (full-weight meta page · replaces the
   Catloading card slot). The portfolio profiled as one of its
   own nodes — how it's built. Its PLAY DEMO is a link keycap:
   the portfolio itself.
   ========================================================= */
PROJECT_DATA["0x07"] = {
  addr: "0x07",
  slug: "mo-system",
  file: "M.O. System v2.html",
  file2: "M.O. System v2.html",
  name: "M.O. System",
  tagline: "The portfolio, profiled as one of its own devices",
  overline: "META · DESIGN SYSTEM · BUILD",
  year: "2026",
  place: "Munich",
  role: "Design · engineering · the whole rig",
  stack: ["HTML", "React", "three.js", "Web Audio", "Canvas", "CSS"],
  primitive: "slab",
  model: "models/wafer.glb",
  demoSize: { d: 120, w: 28, h: 28 },
  metrics: [
    { value: "12", unit: "nodes · one addressed grid" },
    { value: "4", unit: "bespoke live demos" },
    { value: "1", unit: "carrier field · shared sound" },
  ],
  intro:
    "This portfolio is itself a built thing — so here it is, profiled like any other node. " +
    "M.O. is a small operating system for case files: one addressed grid of projects, one design " +
    "language (void / bone / signal-cyan, mono micro-labels, hairline plates), one page template that " +
    "every project fills in, and one sound field that all the demos ride. Nothing here is a stock " +
    "component; every screen is the same handful of parts, recombined.",
  sections: [
    { kind: "stub", h: "One grid",
      body: "Every project is a node with a hex address (0x01–0x0C) on a single map. The landing universe, the card flight, the case-file pages and the footer ring all read from one data file keyed by that address — add an entry and a project simply exists everywhere at once." },
    { kind: "stub", h: "One template",
      body: "Each project page is the same core — hero rig on the right, story, ASCII photos, links, footer — driven entirely by a small per-project config. Wafer was the reference; everything after is that core plus a few dozen lines: which model, which demo, which tweaks." },
    { kind: "photo", caption: "the page template · one core, many configs" },
    { kind: "stub", h: "Bespoke demos, shared spine",
      body: "Each flagship gets its own playable demo — a firmware switch sim, a living face engine, a pointer-acceleration toy, a flashing-line game — but they all mount in the same demo shell and boot the same way. Real device logic is ported, not faked: the curves, state machines and error codes are the firmware's own." },
    { kind: "stub", h: "The Carrier Field",
      body: "All sound is one ambient field — a low just-intonation drone — with a per-node sideband, so every demo hums its own address while staying in tune with the rest. Each palette adds its character on top: hard clicks, soft chirps, glide grains, a spark." },
    { kind: "photo", caption: "the 0x00 carrier field · twelve sidebands" },
  ],
  links: [
    { kind: "LIVE",   label: "Open the portfolio", href: "Landing v11.html" },
    { kind: "SYSTEM", label: "Design System", href: "Design System.html" },
    { kind: "INDEX",  label: "All nodes", href: "Landing v11.html#work" },
  ],
  link: { label: "OPEN THE PORTFOLIO", href: "Landing v11.html", hint: "THIS PAGE · IS · A NODE", self: true },
  prev: "0x04",
  next: "0x08",
};

/* =========================================================
   0x08 · SPLIT HID DISPLAY  (full-weight page · link keycap,
   no bespoke demo). Renamed from the old "nice-view-elemental"
   working name to the shipped module name. Threaded into the
   by-address nav ring: 0x07 → 0x08 → 0x09.
   ========================================================= */
PROJECT_DATA["0x08"] = {
  addr: "0x08",
  slug: "zmk-split-hid-display",
  file: "Split HID Display v2.html",
  file2: "Split HID Display v2.html",
  name: "Split HID Display",
  tagline: "Live host state on both nice!view halves",
  overline: "OPEN SOURCE · ZMK MODULE · RAW HID",
  year: "2026",
  place: "Munich, DE",
  role: "Maintainer · integration · fork",
  stack: ["C", "ZMK", "Zephyr", "Raw HID", "Split BLE", "nice!view"],
  primitive: "slab",
  demoSize: { d: 36, w: 22, h: 4 },
  metrics: [
    { value: "5",      unit: "host payloads" },
    { value: "2",      unit: "halves · synced" },
    { value: "0xFF60", unit: "raw hid page" },
  ],
  intro:
    "Split HID Display is a packaged ZMK module that puts live host state on both halves of a split " +
    "keyboard with nice!view screens. The central half opens a Raw HID interface to the host, then " +
    "forwards each report — time, volume, layout, artist, title — across the ZMK split BLE link so the " +
    "peripheral renders the same state. It's an integration and fork of community work (nice-view-hid, " +
    "the split output relay, nice-view-elemental's battery icons), with the relay extended from a single " +
    "motor-style value into a small channel-addressed message pipe that chunks and reassembles anything " +
    "too large for one BLE attribute.",
  sections: [
    { kind: "stub", h: "Brief",
      body: "[ writing pending · the split keyboard's second half was a dead display · what nice-view-elemental started and what this fork needed beyond it · why both halves should show the same truth ]" },
    { kind: "stub", h: "The relay, extended",
      body: "[ writing pending · the split output relay used to carry one motor-style value · now relay_channel + value + payload[] · long Raw HID reports chunked with sequence / offset / total, reassembled on the peripheral · zmk_split_bt_invoke_output_channel without a physical output device ]" },
    { kind: "photo", caption: "central half · status · nice!view" },
    { kind: "stub", h: "What both halves show",
      body: "[ writing pending · central: battery + charge, profile dots, host time, layout label, volume, active layer · peripheral: play / offline, artist, track title · same local Raw HID event path raised on both ]" },
    { kind: "stub", h: "The marquee",
      body: "[ writing pending · a fixed font line-height copied into the rotated portrait canvas for a stable baseline · character-window scroll with start + end pauses · scrolling pauses below a battery threshold unless charging ]" },
    { kind: "photo", caption: "peripheral half · media · scrolling title" },
  ],
  links: [
    { kind: "GITHUB",   label: "oleksandrmaslov/zmk-split-hid-display", href: "https://github.com/oleksandrmaslov/zmk-split-hid-display" },
    { kind: "HOST APP", label: "zzeneg/qmk-hid-host · companion",       href: "https://github.com/zzeneg/qmk-hid-host" },
    { kind: "CREDITS",  label: "nice-view-hid · forked & extended",     href: "https://github.com/zzeneg/zmk-nice-view-hid" },
  ],
  link: { label: "VIEW ON GITHUB", href: "https://github.com/oleksandrmaslov/zmk-split-hid-display", hint: "ZMK MODULE · SOURCE" },
  prev: "0x07",
  next: "0x09",
};

window.PROJECT_DATA = PROJECT_DATA;

// Start the GLB preload as soon as data is registered, so by the time the
// page-entry FlyIn mounts, the model is (or is about to be) in cache.
// Deferred a tick so viewer3d.jsx's window.preloadModels is defined first.
setTimeout(() => {
  if (typeof window.preloadModels !== "function") return;
  const urls = Object.values(PROJECT_DATA).map(p => p && p.model).filter(Boolean);
  if (urls.length) window.preloadModels(urls);
}, 0);
