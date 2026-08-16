/* ============================================================
   M.O. SYSTEM — Project data
   Keyed by address. Entries feed the shared project page core.
   ============================================================ */

const PROJECT_DATA = {
  /* =========================================================
     0x01 · WAFER
     ========================================================= */
  "0x01": {
    addr: "0x01",
    slug: "wafer",
    file: "Wafer v3.html",
    file2: "Wafer v3.html",
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
        body: "Wafer began with one hard constraint: make a split keyboard disappear into the desk without flattening the key feel. The first two revisions exposed where thinness became fragility; R3 turns those lessons into a 4–8 mm system with a rigid aluminium shell and a repeatable magnetic join." },
      { kind: "stub", h: "Hardware",
        body: "The schematic, PCB stack, key wells and enclosure were designed together rather than handed off between disciplines. An ISP1807 module supplies the nRF52840 radio, NPM1300 manages power, and the Sharp memory display keeps status visible at low power. The cases were milled as working prototypes so mechanical failures could feed directly into the next board revision." },
      { kind: "photo", src: "lab/ascii-photo/wafer-sample.jpg", caption: "boards + keys — working split prototype, top view" },
      { kind: "stub", h: "Firmware",
        body: "The keyboard runs a ZMK fork with a purpose-built NPM1300 path, direct battery-voltage reporting and display-aware sleep and wake states. The power work was not kept as a private workaround: the battery-voltage support was shaped for ZMK and merged upstream." },
      { kind: "stub", h: "What I'd do next",
        body: "R4 is less about adding features than deciding which ones earn their physical and power budget. Per-key light, a thinner stack and a dedicated wireless dongle are useful only if they preserve the quiet, flush object that made the project worth building." },
    ],
    links: [
      { kind: "GITHUB",  label: "Oleksandr Maslov · GitHub", href: "https://github.com/oleksandrmaslov" },
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
        body: "A digital pet is convincing only when its reactions feel situated rather than scheduled. Kerfur treats touch, movement, notifications, battery state and nearby peers as context for a changing internal state. The face is the output; the architecture underneath is the character." },
      { kind: "stub", h: "The event bus",
        body: "A central publish-and-subscribe bus is the nervous system. Events carry priority, time and an optional payload, so producers do not need to know which behaviours will respond. That keeps touch, motion, BLE, power and rendering independent, and prevents the firmware from collapsing into one giant switch statement." },
      { kind: "stub", h: "Emotion + behaviour",
        body: "Mood, energy, curiosity, affection, social interest and stress decay at different rates. The behaviour layer combines those values with the current event and context, then applies cooldowns before choosing a reaction. The same input can therefore land differently without becoming random or repetitive." },
      { kind: "photo", src: "landing/kerfur-cat.jpg", caption: "biological reference unit · expression study" },
      { kind: "stub", h: "Nearby Kerfur",
        body: "Kerfur scans and advertises rotating ephemeral BLE identities, estimates proximity from RSSI, and moves each peer through NONE, SEEN, NEAR, KNOWN, FRIEND and COOLDOWN states. Strangers provoke curiosity; familiar peers get a warmer response. The rotating identity is deliberate: a social toy should not become a tracker." },
    ],
    links: [
      { kind: "GITHUB",  label: "oleksandrmaslov/kerfur-zephyr-config", href: "https://github.com/oleksandrmaslov/kerfur-zephyr-config" },
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
        body: "ZMK pointing devices could scale movement, but they lacked a tunable velocity curve for separating precise motion from fast travel. PointAccel adds that missing processor as a reusable module, with behaviour informed by the acceleration systems people already know from desktop operating systems." },
      { kind: "stub", h: "The curve",
        body: "Linear and exponential modes map measured velocity to gain, while a sub-pixel accumulator preserves movement that would otherwise disappear during integer rounding. Slow gestures stay deliberate; a fast gesture can cross the display without forcing one aggressive multiplier onto every speed." },
      { kind: "stub", h: "Configurator",
        body: "The configurator turns curve choice, thresholds and gain into a live plot and emits a ready-to-paste Devicetree fragment. Presets provide a useful starting point, but the important part is making the firmware's parameters visible before a user rebuilds and flashes a keyboard." },
      { kind: "stub", h: "Upstreaming",
        body: "The processor is packaged outside the ZMK tree so it can evolve without blocking on a firmware release. Moving it upstream would mean aligning its bindings, naming and test surface with ZMK's input-processor conventions while keeping existing configurations stable." },
    ],
    links: [
      { kind: "GITHUB", label: "Oleksandr Maslov · GitHub", href: "https://github.com/oleksandrmaslov" },
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
        body: "This was a production constraint, not a laboratory exercise: a low-cost, sourceable PY32F002A had to deliver predictable controls for torches assembled by volunteers and used in the field. A cheap part only saves money when the firmware around it remains legible, testable and hard to misuse." },
      { kind: "stub", h: "Modes",
        body: "The tail switch moves through two light modes and SOS, retains the chosen brightness across power cycles, and reports low battery through addressable LEDs. State changes are intentionally sparse so the torch remains operable in darkness, with cold hands and no manual." },
      { kind: "stub", h: "Production",
        body: "The work extended beyond application code into the schematic and manufacturing package. BOM, Gerbers and panelisation decisions were prepared around the same cost and sourcing limits, then revised from prototype findings before the board was handed to production." },
    ],
    links: [
      { kind: "GITHUB",  label: "Oleksandr Maslov · GitHub", href: "https://github.com/oleksandrmaslov" },
      { kind: "PROJECT", label: "Energy for Ukraine", href: "https://energyforukraine.de/" },
    ],
    prev: "0x03",
    next: "0x06",
  },
};

/* =========================================================
   0x03 · ISKRA
   ========================================================= */
PROJECT_DATA["0x03"] = {
  addr: "0x03",
  slug: "iskra",
  file: "Iskra v3.html",
  file2: "Iskra v3.html",
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
      body: "The operators are volunteers, not firmware engineers. A written flashing guide would still expose toolchains, target selection and destructive commands at the exact moment repetition makes mistakes likely. Iskra turns that ritual into a constrained operator flow with one obvious action." },
    { kind: "stub", h: "Two-phase safety",
      body: "Phase one performs a scan without attaching, loading or writing. If the detected target does not match the selected product, E_TARGET_MISMATCH stops the run before flash can be touched. Only a validated board reaches phase two, where the image is written and verified section by section." },
    { kind: "photo", src: "assets/iskra/iskra-lockup-hex.png", caption: "Iskra · operator-station identity" },
    { kind: "stub", h: "Trust chain",
      body: "An Ed25519-signed catalog defines the allowed products and releases, and a SHA-256 preflight verifies the selected image. Batch lock pins product and version for a production lot. Every result enters a local SQLite history that can be exported as CSV for handoff and traceability." },
    { kind: "stub", h: "Packaging",
      body: "Firmware retrieval uses GitHub's device flow, with the token protected by Windows DPAPI. The installer bundles the flashing toolchain so a station does not depend on a volunteer's machine setup, while CLI parity keeps the same state machine available for diagnosis and automation." },
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
  file2: "Wafer Studio.html",
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
    { value: "1",   unit: "keypress per binding" },
    { value: "3",   unit: "desktop targets" },
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
   0x07 · SPLIT HID DISPLAY
   ========================================================= */
PROJECT_DATA["0x07"] = {
  addr: "0x07",
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
      body: "A split keyboard has two displays but only the central half can talk to the host. Community modules proved pieces of the path; this integration closes the loop so the peripheral is no longer a decorative battery screen and both halves can present one coherent host state." },
    { kind: "stub", h: "The relay, extended",
      body: "The original split output relay carried one motor-style value. The fork adds a channel, value and payload, then chunks long Raw HID reports with sequence, offset and total fields for reassembly on the peripheral. The relay can now invoke a logical output channel without pretending a physical output device exists." },
    { kind: "stub", h: "What both halves show",
      body: "The central half carries battery and charge state, Bluetooth profile, host time, layout, volume and active layer. The peripheral becomes the media surface for playback state, connectivity, artist and track title. Both renders are driven through the same local Raw HID event path rather than parallel special cases." },
    { kind: "stub", h: "The marquee",
      body: "The portrait canvas uses a fixed font line-height to keep its rotated baseline stable. Long text moves through a character window with deliberate pauses at both ends, and scrolling stops below the battery threshold unless the keyboard is charging." },
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
