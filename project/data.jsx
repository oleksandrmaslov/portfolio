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
    file: "Wafer v3.html",
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
    prev: "0x08",
    next: "0x02",
  },

  /* =========================================================
     0x02 · KERFUR
     ========================================================= */
  "0x02": {
    addr: "0x02",
    slug: "kerfur",
    file: "Kerfur v2.html",
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
     0x08 · ZMK POINTING ACCELERATION
     ========================================================= */
  "0x08": {
    addr: "0x08",
    slug: "zmk-pointaccel",
    file: "ZMK-PointAccel v2.html",
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
    prev: "0x07",
    next: "0x01",
  },

  /* =========================================================
     0x04 · TACTICAL FLASHLIGHT
     ========================================================= */
  "0x04": {
    addr: "0x04",
    slug: "tactical-flashlight",
    file: "Tactical Flashlight v2.html",
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
      { kind: "PROJECT", label: "Energy for Ukraine", href: "https://energyforukraine.de/" },
    ],
    prev: "0x03",
    next: "0x06",
  },
};

/* =========================================================
   0x09 · ISKRA  (full-weight page · replaces the Wafer R1–R3
   card slot). Nav chained into the existing v2 ring so the
   footer works standalone before the universe cards are
   swapped over.
   ========================================================= */
PROJECT_DATA["0x03"] = {
  addr: "0x03",
  slug: "iskra",
  file: "Iskra v3.html",
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
    { kind: "INSTALLER", label: "Iskra setup · Windows", href: "https://github.com/oleksandrmaslov/iskra/releases" },
    { kind: "PROJECT", label: "Energy for Ukraine", href: "https://energyforukraine.de/" },
  ],
  prev: "0x02",
  next: "0x04",
};

/* =========================================================
   0x06 · WAFER STUDIO
   ========================================================= */
PROJECT_DATA["0x06"] = {
  addr: "0x06",
  slug: "wafer-studio",
  file: "Wafer Studio.html",
  name: "Wafer Studio",
  tagline: "A keyboard configurator for ZMK Studio-enabled keyboards",
  overline: "PRODUCT SOFTWARE · ZMK · INTERACTION",
  year: "2026",
  place: "Munich, DE",
  role: "Design · front-end · desktop build",
  stack: ["TypeScript", "React", "Tauri", "ZMK Studio protocol", "Vite", "Rust"],
  primitive: "slab",
  model: "models/wafer-mark.glb",
  modelFit: 3.2,
  demoSize: { d: 0, w: 0, h: 0 },
  metrics: [
    { value: "168", unit: "bindings on a 42-key split" },
    { value: "1", unit: "keypress per binding" },
    { value: "3", unit: "desktop targets" },
  ],
  intro:
    "Setting up a 42-key split with four layers is 168 bindings. Through a conventional " +
    "configurator — click a key, read a list, find the action, click it — that is over two hours, " +
    "which is why people give up and hand-edit a .keymap file instead. Wafer Studio is built around " +
    "getting that number down. It speaks the standard ZMK Studio protocol and changes nothing on the " +
    "wire; what it changes is the number of decisions between you and a finished keyboard.",
  sections: [
    { kind: "stub", h: "Type through the board",
      body: "Select a key, then press the key you want it to become. It binds, advances to the next key in reading order, and waits — you set your base layer by typing your base layer. The application is running on a keyboard; hunting for A in a searchable list while your finger rests on A is the central absurdity of every configurator, and it is free to fix." },
    { kind: "photo", src: "public/zmk-mac.png", caption: "the editor · the canvas is the product, chrome only frames it" },
    { kind: "stub", h: "Fewer decisions, not fewer features",
      body: "Alphas are read off the current layer and matched against QWERTY, Colemak, Colemak-DH, Dvorak and Workman — recognised, they permute to any of the others in one step, letters only. A layer copies as a single undo entry rather than forty-two. Painting a hold-tap across the home row wraps each key instead of replacing it, so every key keeps its own letter: home-row mods in eight clicks. Mirror is offered per key, and only when the board actually has an opposite one." },
    { kind: "stub", h: "One light, one law",
      body: "Surfaces carry no colour of their own. Colour appears only where an edge turns away from the light and splits it: distance decides brightness, bearing decides hue, steepness decides whether any colour appears at all. The whole application shares one light source and every dispersive edge paints its gradient in viewport space, so moving the light re-disperses the entire interface coherently. The accent is achromatic — what marks an element as primary is its position on the dispersion scale, not a brand hue." },
    { kind: "photo", src: "public/og-card.png", caption: "the mark · dispersion at rest" },
    { kind: "stub", h: "The protocol boundary",
      body: "A ZMK Studio binding is one behavior id and two integers, with no field that can reference another binding — behaviour composition is impossible through the protocol, not merely unbuilt. Combos, macros, tap-dance, conditional layers, encoders, lighting and hold-tap timing are not exposed at all. Those need firmware work upstream in ZMK; any UI here would be a UI over nothing. Wafer Studio shows only what the connected keyboard reports it can do." },
    { kind: "stub", h: "Browser and desktop",
      body: "Over USB the web version does everything the desktop one does. Browsers expose Web Bluetooth on Linux only, which is the entire reason the Tauri desktop build exists — it ships .dmg, .deb and .msi from a tagged release. With no keyboard nearby, Explore demo keyboard opens the full editor against a deterministic fixture." },
  ],
  links: [
    { kind: "GITHUB", label: "oleksandrmaslov/wafer-studio", href: "https://github.com/oleksandrmaslov/wafer-studio" },
    { kind: "LIVE", label: "open in your browser", href: "https://oleksandrmaslov.github.io/wafer-studio/" },
    { kind: "DESKTOP", label: "download · macOS · Linux · Windows", href: "https://oleksandrmaslov.github.io/wafer-studio/download.html" },
    { kind: "UPSTREAM", label: "zmkfirmware/zmk-studio · protocol", href: "https://github.com/zmkfirmware/zmk-studio" },
  ],
  prev: "0x04",
  next: "0x07",
};

/* =========================================================
   0x07 · SPLIT HID DISPLAY  (full-weight page · link keycap,
   no bespoke demo). Renamed from the old "nice-view-elemental"
   working name to the shipped module name. Threaded into the
   by-address nav ring: 0x07 → 0x08 → 0x09.
   ========================================================= */
PROJECT_DATA["0x07"] = {
  addr: "0x07",
  slug: "zmk-split-hid-display",
  file: "Split HID Display v2.html",
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
  prev: "0x06",
  next: "0x08",
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
