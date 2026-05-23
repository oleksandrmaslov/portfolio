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
    modelPose: { x: -1.05, y: 0, z: 0 }, // rest pose — keyboard face toward the camera
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
    prev: "0x04",
    next: "0x02",
  },

  /* =========================================================
     0x02 · KERFUR
     ========================================================= */
  "0x02": {
    addr: "0x02",
    slug: "kerfur",
    file: "Kerfur.html",
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
      "Kerfur is a small embedded pet that lives on an nRF52840. Event-driven firmware in " +
      "10,000+ lines of C on the Nordic Connect SDK, structured around a central message-queue " +
      "event bus instead of a god-loop. A behaviour engine cycles through pet modes; an IMU " +
      "stack reads motion; an OLED face is rendered through LVGL; BLE peripheral supports " +
      "iOS ANCS + Android ANS; Kerfur-to-Kerfur peer beacons use rotating ephemeral IDs.",
    sections: [
      { kind: "stub", h: "Brief",
        body: "[ writing pending · 22-05 · what 'pet' means in software terms — and why the architecture matters more than the cuteness ]" },
      { kind: "stub", h: "The event bus",
        body: "[ writing pending · 22-05 · central message queue, subscriber model, priority lanes, why this beats a giant switch ]" },
      { kind: "photo", caption: "Kerfur v0 · face render · LVGL canvas" },
      { kind: "stub", h: "Behaviour engine",
        body: "[ writing pending · 22-05 · modes, transitions, randomness budget, IMU as input ]" },
      { kind: "photo", caption: "biological reference unit · subject KERFUR_v0" },
      { kind: "stub", h: "Beacons",
        body: "[ writing pending · 22-05 · BLE peer discovery with rotating ephemeral IDs · privacy notes ]" },
    ],
    links: [
      { kind: "GITHUB",  label: "oleksandrmaslov/kerfur",   href: "https://github.com/oleksandrmaslov" },
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
    next: "0x01",
  },
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
