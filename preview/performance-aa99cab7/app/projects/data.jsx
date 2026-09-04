/* ============================================================
   M.O. SYSTEM — Project page data
   Keyed by addr. Each entry feeds the shipping project page cores.
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
    tagline: "36-key split built as one object",
    overline: "EMBEDDED · HARDWARE · FIRMWARE",
    year: "03 / 2025 →",
    place: "Munich, DE",
    role: "Product design · PCB · firmware · manufacturing",
    stack: ["ZMK", "Zephyr 4.1", "KiCad", "Ergogen", "Fusion 360", "ISP1807", "nPM1300"],
    primitive: "slab",
    model: "models/wafer_demo.glb",
    modelFit: 3.4,
    modelPose: { x: 1.05, y: 0, z: 0 },
    demoSize: { d: 200, w: 110, h: 14 },
    metrics: [
      { value: "4-8", unit: "mm enclosure" },
      { value: "36",  unit: "keys" },
      { value: "30+", unit: "case revisions" },
    ],
    intro:
      "Every wireless split I built before this one felt like a stack of parts: controller " +
      "board, battery, display, case, each solving its own problem and each adding height. " +
      "Wafer is the version where I stopped treating those as modules. The controller, " +
      "charging, power management and display all belong to one custom PCB, inside a machined " +
      "aluminium shell that runs 4 to 8 mm depending where you measure it.",
    sections: [
      { kind: "stub", h: "The sandwich was the problem",
        body: "Before Wafer I had built several splits, including a wireless low-profile Corne. " +
              "They taught me less about layout than about assembly: DIY boards get put together " +
              "vertically. A controller sits on a PCB, a battery beside it, a display bolted on " +
              "top, and sockets and clearances accumulate until the case exists mainly to hide " +
              "the pile. I traced my hand, drew a 36-key stagger, and found Ergogen, which turns " +
              "a layout description into KiCad output. The decision that mattered was not the " +
              "stagger. It was that Wafer would have no controller module: the MCU, charging, " +
              "power management and display would belong to the board itself." },
      { kind: "photo", src: "public/media/wafer/journal-ergogen-first.webp", ratio: "286 / 241",
        caption: "ergogen · first 36-key pass" },
      { kind: "photo", src: "public/media/wafer/journal-wafer-outline.webp", ratio: "683 / 490",
        caption: "wafer outline · the box everything else fits inside" },
      { kind: "stub", h: "Learning PCB design by rebuilding it",
        body: "I started from the Mikoto MCU schematic, added a nice!view display and the matrix, " +
              "and went straight to routing. That first board took almost three weeks and was " +
              "exactly what you make when you know just enough to be dangerous: six layers for a " +
              "circuit that did not need them, decoupling capacitors placed without much thought, " +
              "and an antenna footprint I picked because it looked right. So I rebuilt it. Then I " +
              "rebuilt it again. Those two rewrites taught me more than the first working " +
              "schematic did." },
      { kind: "photo", src: "public/media/wafer/journal-six-layer-mistake.webp", ratio: "1382 / 789",
        caption: "revision 1 · six layers · routing the circuit never needed" },
      { kind: "photo", src: "public/media/wafer/journal-first-layout.webp", ratio: "1103 / 753",
        caption: "first wafer layout · rebuilt twice after this" },
      { kind: "stub", h: "A module instead of a bare radio",
        body: "The goal changed from putting every component on the board to integrating only " +
              "what I could integrate well. RF was the clearest example: I dropped the bare " +
              "nRF52840 for an ISP1807, an 8 x 8 x 1 mm system-in-package with the antenna and " +
              "matching network already solved. To keep the BGA escape sane I defined a 13-pin " +
              "connector of my own rather than filling the board with via-in-pad. Integration " +
              "does not mean reinventing the radio. It means being deliberate about which " +
              "problems are worth owning." },
      { kind: "photo", src: "public/media/wafer/journal-bare-vs-sip.webp", tone: "light", ratio: "694 / 421",
        caption: "bare nRF52840 · against the ISP1807 SiP" },
      { kind: "photo", src: "public/media/wafer/journal-isp1807.webp", ratio: "1044 / 773",
        caption: "ISP1807 · nRF52840 + antenna · 8 × 8 × 1 mm" },
      { kind: "stub", h: "The power system kept changing because the product did",
        body: "The first architecture used a BQ24075 charger next to a MAX17048 fuel gauge, which " +
              "recreated the problem I was removing mechanically: more parts, more routing, more " +
              "separate responsibilities. Moving to a Nordic nPM1100 took conversion efficiency " +
              "from around 78 percent to around 92 percent, roughly a fifth more runtime from the " +
              "same cell, at the cost of dropping from 1.5 A charging to 400 mA. With a 250 mAh " +
              "battery that trade was easy. The third revision went to the nPM1300: dual bucks, " +
              "configurable load switches and a 32 to 800 mA charger set from devicetree." },
      { kind: "photo", src: "public/media/wafer/journal-classic-charger.webp", tone: "light", ratio: "925 / 873",
        caption: "BQ24075 + MAX17048 · charger and gauge as two parts" },
      { kind: "photo", src: "public/media/wafer/journal-npm1300.webp", ratio: "829 / 780",
        caption: "nPM1300 · charge · rails · telemetry · one I2C device" },
      { kind: "stub", h: "Firmware had to know the hardware",
        body: "Once power was a PMIC rather than a collection of circuits, ZMK configuration alone " +
              "stopped being enough, so I keep a fork on Zephyr 4.1. The piece I care about most " +
              "is battery reporting. Instead of a separate fuel gauge the firmware selects ADC " +
              "bank 0x05 on the nPM1300, triggers a VBAT measurement, waits a margin, reads the " +
              "result registers back over I2C, reconstructs millivolts and hands that to the LiPo " +
              "percentage curve ZMK already has. It lives in my fork. I have not upstreamed it." },
      { kind: "photo", src: "public/media/wafer/journal-vbat-driver.webp", ratio: "893 / 810",
        caption: "VBAT read · ADC bank 0x05 · into ZMK percentage" },
      { kind: "photo", src: "public/media/wafer/journal-schematic.webp", tone: "light", ratio: "1165 / 789",
        caption: "final schematic · ISP1807 · nPM1300 · 250 mAh · Tag-Connect SWD" },
      { kind: "stub", h: "Five hundred switches",
        body: "Ultra-thin switches are the whole premise, so sourcing became part of the design. " +
              "Buying PG1316S from Kailh directly at 500 pieces brought them to 0.42 dollars each " +
              "against about 0.75 at retail; keycaps landed at 0.08, the displays at roughly 10 " +
              "dollars, and ten N52 magnets cost 3. None of that is glamorous, but a keyboard " +
              "that is only affordable at one-off prices is a prototype, not a product, and I " +
              "wanted to know the difference before the case was finished." },
      { kind: "photo", src: "public/media/wafer/journal-switch-sourcing.webp", tone: "light", ratio: "1500 / 1127",
        caption: "PG1316S variants · compared before 500 pieces" },
      { kind: "stub", h: "Thinness is a stack budget",
        body: "The 4 mm target was never one clever mechanical trick. Ultra-thin switches set the " +
              "floor, the battery has to sit beside the electronics rather than under them, the " +
              "display housing eats more height than the flat board around it, and magnets, " +
              "wiring, reset access, switch travel and the aluminium wall all compete for the " +
              "same few millimetres. An early printed case proved the point by being wrong: I had " +
              "modelled the display from a reference that did not match the real part, so the " +
              "pocket came out smaller than the module. A component can fit in X and Y and still " +
              "fail the product in Z." },
      { kind: "photo", src: "public/media/wafer/journal-display-cutout-error.webp", ratio: "3 / 4",
        caption: "printed case · display pocket cut from the wrong reference" },
      { kind: "photo", src: "public/media/wafer/journal-thin-profile.webp", ratio: "728 / 471",
        caption: "section · 5 mm thin zone · 8 mm at the display" },
      { kind: "photo", src: "public/media/wafer/side-profile.webp", ratio: "3 / 4",
        caption: "R3 · side profile in hand" },
      { kind: "stub", h: "The case turned into a manufacturing project",
        body: "I printed more than thirty enclosure revisions before the first CNC order. Early " +
              "ones answered fit questions: does the display clear the PCB, where do the magnets " +
              "sit, can I still reach reset and soft-off. Later ones asked different questions. " +
              "Could a cutter reach that corner? How is the part held? Which wall is too thin " +
              "once tolerances are real instead of CAD-perfect? Fusion's CNC simulation answered " +
              "some of that before anyone cut metal, which is a cheap way to find out that your " +
              "geometry is unmachinable." },
      { kind: "photo", src: "public/media/wafer/journal-cnc-sim.webp", tone: "light", ratio: "1082 / 717",
        caption: "fusion · tooling and fixturing simulation" },
      { kind: "stub", h: "Where to put material back",
        body: "The first aluminium run showed me everything at once: tool wear, fixturing and " +
              "baseline shifts, tolerance stackup, and finishing steps like blasting and " +
              "anodising that move critical dimensions after the machining is done. That run was " +
              "an iteration, not a finished enclosure. The useful shift was giving up on removing " +
              "every last tenth of a millimetre and working out where to add material back so the " +
              "part could be made repeatably. That turned out to be a much more useful definition " +
              "of thin." },
      { kind: "photo", src: "public/media/wafer/journal-cnc-case-b.webp", ratio: "4 / 3",
        caption: "first CNC run · tolerance stackup visible" },
      { kind: "photo", src: "public/media/wafer/journal-cnc-case-a.webp", ratio: "3 / 4",
        caption: "top frame · bottom pocket · two machined halves" },
      { kind: "stub", h: "Fine pitch by hand",
        body: "The factory handled the charger section and the SMD passives as a PCBA order. The " +
              "PG1316S switches and the ISP1807 I soldered myself, which at that pitch is mostly " +
              "a question of alignment and patience. The antenna area got covers printed in " +
              "multiple materials with the logo in them, which is the kind of detail nobody asks " +
              "for and I enjoyed anyway." },
      { kind: "photo", src: "public/media/wafer/journal-hand-solder.webp", ratio: "3 / 4",
        caption: "hand-soldered · PG1316S and ISP1807" },
      { kind: "photo", src: "public/media/wafer/journal-bench.webp", ratio: "4 / 3",
        caption: "bring-up · bench" },
      { kind: "stub", h: "Where it stands",
        body: "Electronics and firmware work. The enclosure has been produced and iterated, and " +
              "the public repository carries the configuration, hardware files and build notes. " +
              "What is left is mechanical: tightening the design against what the first CNC run " +
              "taught me, so the published files describe something I would recommend somebody " +
              "else build. The honest status is not production complete. The device proves the " +
              "architecture; making the mechanical result repeatable is the rest of the work. I " +
              "started this because I wanted a thinner keyboard and kept going because I wanted " +
              "to know what makes DIY hardware feel finished." },
      { kind: "photo", src: "public/media/wafer/display-detail.webp", ratio: "3 / 4",
        caption: "memory-in-pixel · seated in the shell" },
      { kind: "photo", src: "public/media/wafer/magnets-steel.webp", tone: "light", ratio: "3 / 4",
        caption: "N52 magnets · mate the halves · hold to steel" },
    ],
    links: [
      { kind: "GITHUB", label: "oleksandrmaslov/wafer-zmk-config", href: "https://github.com/oleksandrmaslov/wafer-zmk-config" },
      { kind: "ZMK FORK", label: "zmk · core/move-to-zephyr-4-1", href: "https://github.com/oleksandrmaslov/zmk/tree/core/move-to-zephyr-4-1" },
      { kind: "JOURNAL", label: "Blueprint build log · 16 entries", href: "https://blueprint.hackclub.com/projects/2800" },
    ],
    prev: "0x0D",
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
    prev: "0x07",
    next: "0x09",
  },

  /* =========================================================
     0x04 · TACTICAL FLASHLIGHT
     ========================================================= */
  "0x04": {
    addr: "0x04",
    slug: "ci-clop",
    file: "Ci-Clop.html",
    name: "Ci-Clop",
    tagline: "Field light interface rebuilt around urgency",
    overline: "FIRMWARE · INTERACTION · PRODUCTION",
    year: "01 / 2026 →",
    place: "Munich → Kyiv",
    role: "Embedded firmware · interaction · production integration",
    stack: ["C", "ARM Cortex-M0", "PY32F002A", "Black Magic Probe", "GitHub Actions"],
    primitive: "cone",
    model: "models/ci-clop-mark.glb",
    demoSize: { d: 120, w: 28, h: 28 },
    metrics: [
      { value: "1→2", unit: "physical buttons" },
      { value: "3",   unit: "legacy brightness steps" },
      { value: "4",   unit: "gesture classes" },
    ],
    intro:
      "Our older field lights had one button and a three-step brightness carousel, so every " +
      "press advanced to the next state and off was just the position you eventually reached. " +
      "That is fine on a workbench and bad when somebody needs the light gone immediately. " +
      "Ci-Clop rebuilds the interaction around that moment: two controls with separate jobs, " +
      "direct shutoff, brightness the user sets and the device remembers, and an SOS mode.",
    sections: [
      { kind: "stub", h: "Off should not be a position in a carousel",
        body: "One button, three brightness stages, and off reached by pressing through the rest. " +
              "It was easy to build and easy to explain, and it worked because whoever held the " +
              "light knew which state it was in. Under pressure that assumption breaks: you " +
              "should not have to remember whether the next press means brighter, dimmer or " +
              "finally dark. The second physical control exists so shutoff can be its own action " +
              "instead of a position in a sequence. One extra button removes a surprising amount " +
              "of doubt." },
      { kind: "photo", src: "public/media/ci-clop/previous-light.webp", ratio: "16 / 9",
        caption: "previous generation · one button · three steps" },
      { kind: "stub", h: "Two buttons became an input language",
        body: "The firmware recognises single, double and triple presses and a long hold. The " +
              "point is not to hide as many features as possible behind gestures, but to match " +
              "how hard something is to trigger against how much it costs to trigger by accident. " +
              "A long hold suits brightness because the action is continuous. A triple press suits " +
              "SOS because nobody does it without meaning to. Common actions stay a single press." },
      { kind: "video", src: "public/media/ci-clop/bringup.mp4", ratio: "9 / 16",
        caption: "bench bring-up · 01 / 2026 · button and output" },
      { kind: "stub", h: "Brightness belongs to the user",
        body: "Instead of three fixed stages, a hold ramps the level and the firmware stores what " +
              "you chose, so the light comes back where you left it. It also signals when the " +
              "ramp reaches its minimum or maximum rather than letting you keep holding while " +
              "nothing changes. SOS and battery indication borrow the same outputs temporarily " +
              "without destroying the lighting state underneath, which is most of the work in a " +
              "device with no screen: several state machines competing for one LED, resolved " +
              "before the user notices." },
      { kind: "stub", h: "The firmware created a manufacturing problem",
        body: "Adding Black Magic Probe support fixed my workflow and exposed the next " +
              "bottleneck. Volunteers assembling these should not need to know about SWD, GDB, " +
              "target names or which ELF is current. Ci-Clop became one of the first products " +
              "wired into the Iskra release path, where private source builds an artifact an " +
              "approved station can flash without ever seeing that source. An early idea to make " +
              "the light double as a power bank was dropped after it caused more problems than it " +
              "solved; the product got better by doing less." },
      { kind: "photo", src: "public/media/ci-clop/board-bringup.webp", ratio: "2 / 1",
        caption: "board · bring-up hardware" },
    ],
    links: [
      { kind: "PROJECT", label: "Energy for Ukraine", href: "https://energyforukraine.de/" },
      { kind: "TOOLING", label: "Flashed through Iskra", href: "https://github.com/oleksandrmaslov/iskra" },
    ],
    prev: "0x03",
    next: "0x05",
  },
};

/* =========================================================
   0x03 · ISKRA
   Full project record threaded into the canonical by-address
   navigation ring.
   ========================================================= */
PROJECT_DATA["0x03"] = {
  addr: "0x03",
  slug: "iskra",
  file: "Iskra.html",
  name: "Iskra",
  tagline: "Factory flashing without the factory engineer",
  overline: "PRODUCTION SYSTEM · TOOLING · TRUST",
  year: "05 / 2026 →",
  place: "Munich → Kyiv",
  role: "Architecture · application · security model · tooling",
  stack: ["C#", ".NET / WPF", "Avalonia", "Black Magic Probe", "arm-none-eabi-gdb", "SQLite", "Ed25519"],
  primitive: "slab",
  model: "models/iskra-mark.glb",
  demoSize: { d: 120, w: 28, h: 28 },
  metrics: [
    { value: "3",   unit: "operator languages" },
    { value: "3",   unit: "trust repositories" },
    { value: "ARM", unit: "Cortex-M targets" },
  ],
  intro:
    "Iskra started as a way for volunteers to flash ARM Cortex-M boards without learning " +
    "GDB, and turned into the trust layer around that: signed firmware catalogs, pre-flight " +
    "checks, controlled binary distribution and a record of every attempt. Someone approved " +
    "to build a device can now do it without receiving the firmware source or my development " +
    "environment. That separation is the part I find interesting. Flashing stops being an " +
    "engineer\u2019s command and becomes a production operation with rules.",
  sections: [
    { kind: "stub", h: "The last step still needed me",
      body: "Energy for Ukraine could already share models, ship components and get volunteers " +
            "soldering. Programmable hardware left one dependency at the end: somebody had to " +
            "find the right firmware, know which MCU it belonged to, wire the probe, invoke the " +
            "ARM toolchain, and judge whether the flash had actually worked. That is a normal " +
            "development workflow and a poor manufacturing interface. Iskra began by making the " +
            "safe path something an operator could follow without first learning how I work." },
    { kind: "photo", src: "public/media/iskra/bench.webp", ratio: "3 / 4",
      caption: "ci-clop panel · tag-connect · iskra under test" },
    { kind: "stub", h: "The flash button is the least interesting part",
      body: "A flashing GUI demos easily. A trustworthy flashing transaction does not. Before " +
            "anything is written, the workflow has to answer whether the catalog is trusted, " +
            "whether the release is revoked, whether this operator may fetch the artifact, " +
            "whether its hash matches, whether the load map belongs to the connected target, " +
            "whether exactly one compatible probe is present, and whether GDB exists at all. Any " +
            "of those failing stops the operation instead of improvising around it, and the " +
            "result is recorded either way." },
    { kind: "photo", src: "public/media/iskra/station.webp", tone: "light", ratio: "434 / 313",
      caption: "avalonia build · probe missing · flash stays blocked" },
    { kind: "stub", h: "Manufacturing access is not source access",
      body: "I wanted to approve a person to build a device, which means handing them compiled " +
            "firmware and nothing else. GitHub has no permission for that: read access to " +
            "private releases is read access to the repository. So I moved the boundary into the " +
            "architecture. A public signed catalog points at a private repository holding only " +
            "compiled artifacts, while source, history and CI stay in a separate private " +
            "repository the operator never touches. Each person signs in as themselves, so " +
            "approval and revocation happen one person at a time." },
    { kind: "stub", h: "Fail closed, but say why",
      body: "GitHub returns 404 when you cannot see a private repository, which is right for " +
            "privacy and useless as an error message. Early on that collapsed into a generic " +
            "download failure telling the operator to check their network, when the real answer " +
            "was that their account had not been approved. The tool now separates no access, not " +
            "signed in, expired authorization, missing asset and genuine transport failure. A " +
            "volunteer can act on those without calling the person who wrote the tool." },
    { kind: "stub", h: "What is still open",
      body: "Iskra covers the software side of a controlled station. The debug probe is still a " +
            "cost and availability bottleneck for distributed manufacturing, so the next " +
            "experiment is a cheap ARM probe built from common development boards, ideally " +
            "provisioned by Iskra before it provisions anything else. The repository also keeps " +
            "its production gates visible: hardware-in-the-loop acceptance and the remaining " +
            "release checks are not done. I would rather say that than put a production-ready " +
            "badge on a manufacturing tool." },
    { kind: "video", src: "public/media/iskra/volunteer-build.mp4", ratio: "9 / 16",
      caption: "volunteer assembly · 05 / 2026 · why the firmware step had to scale" },
  ],
  links: [
    { kind: "GITHUB", label: "oleksandrmaslov/iskra", href: "https://github.com/oleksandrmaslov/iskra" },
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
    { kind: "photo", src: "public/media/wafer-studio/editor.webp", ratio: "1 / 1",
      caption: "the editor · the canvas is the product, chrome only frames it" },
    { kind: "stub", h: "Fewer decisions, not fewer features",
      body: "Alphas are read off the current layer and matched against QWERTY, Colemak, Colemak-DH, Dvorak and Workman — recognised, they permute to any of the others in one step, letters only. A layer copies as a single undo entry rather than forty-two. Painting a hold-tap across the home row wraps each key instead of replacing it, so every key keeps its own letter: home-row mods in eight clicks. Mirror is offered per key, and only when the board actually has an opposite one." },
    { kind: "stub", h: "One light, one law",
      body: "Surfaces carry no colour of their own. Colour appears only where an edge turns away from the light and splits it: distance decides brightness, bearing decides hue, steepness decides whether any colour appears at all. The whole application shares one light source and every dispersive edge paints its gradient in viewport space, so moving the light re-disperses the entire interface coherently. The accent is achromatic — what marks an element as primary is its position on the dispersion scale, not a brand hue." },
    { kind: "photo", src: "public/media/wafer-studio/mark.webp", ratio: "1200 / 630",
      caption: "the mark · dispersion at rest" },
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
  prev: "0x05",
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
  file: "Split HID Display.html",
  name: "Split HID Display",
  tagline: "Live host state on both nice!view halves",
  overline: "OPEN SOURCE · ZMK MODULE · RAW HID",
  year: "2026",
  place: "Munich, DE",
  role: "Maintainer · integration · fork",
  stack: ["C", "ZMK", "Zephyr", "Raw HID", "Split BLE", "nice!view"],
  primitive: "slab",
  model: "models/keyboard-display.opt.glb",
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

/* =========================================================
   0x05 · VENOVISOR
   ---------------------------------------------------------
   SCAFFOLD - copy pending. Every [ ... ] is a placeholder waiting
   on real material; nothing here is invented. The chrome fields
   (name, tagline, overline, stack) carry over from the shared
   registry in app/data/projects.js.
   ========================================================= */
PROJECT_DATA["0x05"] = {
  addr: "0x05",
  slug: "venovisor",
  file: "Venovisor.html",
  name: "Venovisor",
  tagline: "Firmware for a device that already had users",
  overline: "FIRMWARE SYSTEM · MEDICAL · FIELD",
  year: "06 / 2026 →",
  place: "Munich, DE",
  role: "Embedded firmware · device behaviour · production integration",
  stack: ["C", "PY32", "ARM Cortex-M0", "Iskra pipeline"],
  primitive: "slab",
  model: null,           // no GLB yet - the page draws the same node-shell proxy the universe shows
  demoSize: { d: 48, w: 32, h: 10 },
  metrics: [
    { value: "1", unit: "fielded device family" },
    { value: "3", unit: "production layers shared with Ci-Clop" },
  ],
  intro:
    "Venovisor existed before I joined it. Energy for Ukraine had already built the device, " +
    "delivered it, and medics in Ukraine were using it. My work starts at the next " +
    "generation: adapting the firmware to new hardware and behaviour, and moving the device " +
    "onto the same controlled production pipeline as Ci-Clop. The earlier hardware and " +
    "enclosure are not mine and I am not presenting them that way. What interests me is what " +
    "changes when the user already exists.",
  sections: [
    { kind: "stub", h: "This did not start on my desk",
      body: "Most embedded projects begin with a blank schematic. Mine began partway through a " +
            "product life. Energy for Ukraine had joined an existing Ukrainian venovisor effort " +
            "in 2024; the earlier prototype was judged too bulky, and the team built a more " +
            "compact version with USB-C charging and status indication. Those decisions are " +
            "project history, not my authorship. What matters for my work is what came after: " +
            "the devices were built, shipped and used, so the person on the other end of a " +
            "firmware change is not hypothetical." },
    { kind: "photo", src: "public/media/venovisor/delivered.webp", tone: "light", ratio: "3 / 4",
      caption: "previous generation · clinical use · 12 / 2025" },
    { kind: "stub", h: "Real users make small decisions heavier",
      body: "A confusing button gesture on a hobby project is an annoyance. An ambiguous state " +
            "transition on a tool used under pressure is a product fault. So the interesting " +
            "constraint is not a list of MCU features, it is adapting the next hardware " +
            "generation without losing the predictability a fielded device has already earned. " +
            "That is also why the page is scoped to firmware rather than claiming the whole " +
            "device: the question I can actually answer is how the next controller should behave " +
            "and how that behaviour stays identical across manufactured units." },
    { kind: "stub", h: "Reuse the platform, not the product",
      body: "The Venovisor firmware shares a technical lineage with Ci-Clop: button handling, " +
            "high-power output control, power management, persistent settings and the same " +
            "PY32-class environment. Reuse is only worth having if it leaves room for " +
            "product-specific behaviour. A medical device should not inherit a field light\u2019s " +
            "interaction model just because the code already exists. The shared layer is the " +
            "control architecture; the state model on top of it belongs to this product." },
    { kind: "video", src: "public/media/venovisor/printing.mp4", ratio: "16 / 9",
      caption: "production context · venovisor parts printing" },
    { kind: "stub", h: "Production is the shared layer",
      body: "The strongest thing Ci-Clop and Venovisor have in common is not their interface, it " +
            "is how they are released. Both build from private source into compiled artifacts " +
            "published to a shared distribution repository, referenced through a signed Iskra " +
            "catalog and flashed by an approved operator who never sees the source. By August " +
            "2026 the Venovisor firmware CI was wired into that path. The products stay " +
            "different; the manufacturing trust model does not have to." },
    { kind: "stub", h: "Where it stands",
      body: "This is active development on the next hardware generation, not a retrospective " +
            "claim over the original device. The firmware repository is separated and connected " +
            "to the Iskra publishing architecture, and the wider controller work is still " +
            "moving. The next milestone is not another screenshot. It is validating the new " +
            "behaviour against the manufacturing and medical-use context that already exists " +
            "around this device family." },
    { kind: "photo", src: "public/media/venovisor/in-use.webp", ratio: "9 / 16",
      caption: "previous generation · field medic kit" },
  ],
  links: [
    { kind: "PROJECT", label: "Energy for Ukraine", href: "https://energyforukraine.de/" },
    { kind: "TOOLING", label: "Released through Iskra", href: "https://github.com/oleksandrmaslov/iskra" },
  ],
  prev: "0x04",
  next: "0x06",
};

/* =========================================================
   0x09 · ZMK SOFT OFF PLUS
   ---------------------------------------------------------
   SCAFFOLD - copy pending. Every [ ... ] is a placeholder waiting
   on real material; nothing here is invented. The chrome fields
   (name, tagline, overline, stack) carry over from the shared
   registry in app/data/projects.js.
   ========================================================= */
PROJECT_DATA["0x09"] = {
  addr: "0x09",
  slug: "zmk-soft-off-plus",
  file: "ZMK Soft Off Plus.html",
  name: "ZMK Soft Off Plus",
  tagline: "Shutdown and wake firmware module",
  overline: "FIRMWARE MODULE · ZMK · POWER",
  year: "[ year ]",
  place: "[ place ]",
  role: "[ role ]",
  stack: ["ZMK", "Zephyr", "Power"],
  primitive: "slab",
  model: "models/soft-off-keycap.opt.glb",
  demoSize: { d: 18, w: 18, h: 9 },   // [ real dimensions pending ]
  metrics: [
    { value: "TBD", unit: "[ headline number ]" },
    { value: "TBD", unit: "[ scale or scope ]" },
    { value: "TBD", unit: "[ outcome ]" },
  ],
  intro:
    "[ writing pending · Reliable shutdown and wake behaviour for wireless split keyboards. · this paragraph wants the one-screen " +
    "version: what it is, who it was for, and the single decision that shaped it ]",
  sections: [
    { kind: "stub", h: "Why",
      body: "[ writing pending · the problem in one paragraph · what existed before and why it did not hold ]" },
    { kind: "stub", h: "How it works",
      body: "[ writing pending · the mechanism · the one design decision worth explaining ]" },
    { kind: "photo", caption: "[ photo pending · zmk-soft-off-plus ]" },
    { kind: "stub", h: "What it cost",
      body: "[ writing pending · the hard part · what was cut and why ]" },
    { kind: "stub", h: "Where it stands",
      body: "[ writing pending · current state · what would come next ]" },
    { kind: "photo", caption: "[ photo pending · zmk-soft-off-plus ]" },
  ],
  links: [],             // [ artifacts pending: repo, release, live URL, writeup ]
  prev: "0x08",
  next: "0x0A",
};

/* =========================================================
   0x0A · SIGHTSEEING.INC
   ---------------------------------------------------------
   SCAFFOLD - copy pending. Every [ ... ] is a placeholder waiting
   on real material; nothing here is invented. The chrome fields
   (name, tagline, overline, stack) carry over from the shared
   registry in app/data/projects.js.
   ========================================================= */
PROJECT_DATA["0x0A"] = {
  addr: "0x0A",
  slug: "sightseeing-inc",
  file: "Sightseeing.html",
  name: "Sightseeing.inc",
  tagline: "Adaptive city exploration app",
  overline: "INTERFACE STUDY · DESIGN",
  year: "[ year ]",
  place: "[ place ]",
  role: "[ role ]",
  stack: ["Design"],
  primitive: "slab",
  model: "models/sightseeing-mark.glb",
  demoSize: { d: 64, w: 64, h: 6 },   // [ real dimensions pending ]
  metrics: [
    { value: "TBD", unit: "[ headline number ]" },
    { value: "TBD", unit: "[ scale or scope ]" },
    { value: "TBD", unit: "[ outcome ]" },
  ],
  intro:
    "[ writing pending · An adaptive city exploration and route-building application. · this paragraph wants the one-screen " +
    "version: what it is, who it was for, and the single decision that shaped it ]",
  sections: [
    { kind: "stub", h: "Why",
      body: "[ writing pending · the problem in one paragraph · what existed before and why it did not hold ]" },
    { kind: "stub", h: "How it works",
      body: "[ writing pending · the mechanism · the one design decision worth explaining ]" },
    { kind: "photo", caption: "[ photo pending · sightseeing-inc ]" },
    { kind: "stub", h: "What it cost",
      body: "[ writing pending · the hard part · what was cut and why ]" },
    { kind: "stub", h: "Where it stands",
      body: "[ writing pending · current state · what would come next ]" },
    { kind: "photo", caption: "[ photo pending · sightseeing-inc ]" },
  ],
  links: [],             // [ artifacts pending: repo, release, live URL, writeup ]
  prev: "0x09",
  next: "0x0B",
};

/* =========================================================
   0x0B · SILENT DEPTH
   ---------------------------------------------------------
   SCAFFOLD - copy pending. Every [ ... ] is a placeholder waiting
   on real material; nothing here is invented. The chrome fields
   (name, tagline, overline, stack) carry over from the shared
   registry in app/data/projects.js.
   ========================================================= */
PROJECT_DATA["0x0B"] = {
  addr: "0x0B",
  slug: "silent-depth",
  file: "Silent Depth.html",
  name: "Silent Depth",
  tagline: "Study of gaze and silence",
  overline: "VISUAL STUDY · DESIGN",
  year: "[ year ]",
  place: "[ place ]",
  role: "[ role ]",
  stack: ["Visual", "Study"],
  primitive: "slab",
  model: "models/silent-depth-mark.glb",
  demoSize: { d: 64, w: 64, h: 6 },   // [ real dimensions pending ]
  metrics: [
    { value: "TBD", unit: "[ headline number ]" },
    { value: "TBD", unit: "[ scale or scope ]" },
    { value: "TBD", unit: "[ outcome ]" },
  ],
  intro:
    "[ writing pending · A visual study of gaze, silence and invisible human connection. · this paragraph wants the one-screen " +
    "version: what it is, who it was for, and the single decision that shaped it ]",
  sections: [
    { kind: "stub", h: "Why",
      body: "[ writing pending · the problem in one paragraph · what existed before and why it did not hold ]" },
    { kind: "stub", h: "How it works",
      body: "[ writing pending · the mechanism · the one design decision worth explaining ]" },
    { kind: "photo", caption: "[ photo pending · silent-depth ]" },
    { kind: "stub", h: "What it cost",
      body: "[ writing pending · the hard part · what was cut and why ]" },
    { kind: "stub", h: "Where it stands",
      body: "[ writing pending · current state · what would come next ]" },
    { kind: "photo", caption: "[ photo pending · silent-depth ]" },
  ],
  links: [],             // [ artifacts pending: repo, release, live URL, writeup ]
  prev: "0x0A",
  next: "0x0C",
};

/* =========================================================
   0x0C · BRIONEL PRODUCT CATALOGUE
   ---------------------------------------------------------
   SCAFFOLD - copy pending. Every [ ... ] is a placeholder waiting
   on real material; nothing here is invented. The chrome fields
   (name, tagline, overline, stack) carry over from the shared
   registry in app/data/projects.js.
   ========================================================= */
PROJECT_DATA["0x0C"] = {
  addr: "0x0C",
  slug: "brionel-catalogue",
  file: "Brionel Catalogue.html",
  name: "Brionel Product Catalogue",
  tagline: "Editorial system · 70+ products",
  overline: "CLIENT WORK · EDITORIAL · DESIGN",
  year: "[ year ]",
  place: "[ place ]",
  role: "[ role ]",
  stack: ["Design", "Editorial", "Client"],
  primitive: "slab",
  model: "models/brionel-mark.glb",
  demoSize: { d: 64, w: 64, h: 6 },   // [ real dimensions pending ]
  metrics: [
    { value: "TBD", unit: "[ headline number ]" },
    { value: "TBD", unit: "[ scale or scope ]" },
    { value: "TBD", unit: "[ outcome ]" },
  ],
  intro:
    "[ writing pending · A scalable editorial system created for a catalogue of more than 70 products. · this paragraph wants the one-screen " +
    "version: what it is, who it was for, and the single decision that shaped it ]",
  sections: [
    { kind: "stub", h: "Why",
      body: "[ writing pending · the problem in one paragraph · what existed before and why it did not hold ]" },
    { kind: "stub", h: "How it works",
      body: "[ writing pending · the mechanism · the one design decision worth explaining ]" },
    { kind: "photo", caption: "[ photo pending · brionel-catalogue ]" },
    { kind: "stub", h: "What it cost",
      body: "[ writing pending · the hard part · what was cut and why ]" },
    { kind: "stub", h: "Where it stands",
      body: "[ writing pending · current state · what would come next ]" },
    { kind: "photo", caption: "[ photo pending · brionel-catalogue ]" },
  ],
  links: [],             // [ artifacts pending: repo, release, live URL, writeup ]
  prev: "0x0B",
  next: "0x0D",
};

/* =========================================================
   0x0D · BULGARIA 2026
   ---------------------------------------------------------
   Written record with real figures. The seven photos are crops
   of two full-page captures of bulgaria2026.com plus one hero
   viewport shot; the full pages are the working sources under
   studies/media/bulgaria_2026/_source/, so a figure that needs
   different bounds is RE-CUT rather than re-shot.

   TONE is measured, not guessed. Mean luminance against the 140
   threshold: forum-hero 166, networking-hero 161, application
   142, generator 211 → light. programme 39, wheel 39, pricing 58
   are the ink sections (#0A1724) and must stay dark. Re-measure
   if a crop moves; the lens punches a hole through a light plate
   that is not marked.

   AUTHORSHIP — see CLAUDE.md. There is no conversion-uplift or
   revenue claim for this project, the Worker is not audited, the
   self-presentation tool is a deterministic text composer and
   not AI, and the prize wheel visualises a fund whose real draw
   happens live at the event. Do not soften those while editing.
   ========================================================= */
PROJECT_DATA["0x0D"] = {
  addr: "0x0D",
  slug: "bulgaria-2026",
  file: "Bulgaria 2026.html",
  name: "Bulgaria 2026",
  tagline: "One event, twelve ways in",
  overline: "PRODUCT WEB · EDITORIAL DESIGN · GROWTH INFRASTRUCTURE",
  year: "08 / 2026",
  place: "Remote → Bulgaria",
  role: "Product design · frontend · conversion architecture · CRM integration",
  stack: ["React", "Vite", "Cloudflare Workers", "Airtable", "GitHub Pages"],
  primitive: "slab",
  model: "models/bulgaria-mark.glb",
  metrics: [
    { value: "2",  unit: "conversion journeys" },
    { value: "12", unit: "partner entry points" },
    { value: "30", unit: "day attribution window" },
  ],
  intro:
    "Bulgaria 2026 began as an existing Lovable-generated event page and became the " +
    "infrastructure around a real international launch. The content was worth keeping. The " +
    "operational layer did not exist yet. It is now two linked conversion experiences under one " +
    "editorial system — a September forum and a business-networking morning — sharing " +
    "partner-aware referral links, first- and last-touch attribution, a native application flow, " +
    "a Cloudflare Worker that keeps the Airtable credentials off the client, and a Telegram " +
    "fallback for when the lead endpoint is not there. The website is the visible layer. The case " +
    "is the system underneath it.",
  sections: [
    { kind: "stub", h: "The first version already existed",
      body: "The project did not start with a blank file. A generated reference page already carried the " +
            "event, the people, the offer and the travel story, which makes the useful question harder " +
            "than it looks: what is actually worth rebuilding when a page already works? Not everything, " +
            "and not because I wanted to write it myself. The content could stay and the visual language " +
            "could be replaced, but the operational layer — attribution, forms, partner ownership, a " +
            "privacy boundary and a CRM path — had no architecture at all. That is the part I built. " +
            "Starting material is not the same thing as product architecture." },
    { kind: "photo", src: "public/media/bulgaria-2026/forum-hero.webp", ratio: "1500 / 1219", tone: "light",
      caption: "forum hero · sea glass · cobalt · duotone coast" },
    { kind: "stub", h: "One event, two products",
      body: "The site is two public experiences, not one page with a second tab. The forum page has to " +
            "explain a six-day business-and-travel context, the 12 September programme, the experts, and " +
            "the difference between a one-day ticket and a full hotel package. The 6 September " +
            "business-networking page behaves more like a lab: a short self-assessment, a " +
            "self-presentation composer, a three-hour programme and a prize-pool wheel. They share one " +
            "visual language and one lead pipeline and keep entirely different reasons to convert. Shared " +
            "infrastructure does not require identical experiences." },
    { kind: "photo", src: "public/media/bulgaria-2026/networking-hero.webp", ratio: "1500 / 844", tone: "light",
      caption: "networking hero · 6 september · besarabia, pomorie" },
    { kind: "stub", h: "Twelve partners, one source of truth",
      body: "Speakers and partners were promoting the event to their own audiences, and the obvious " +
            "answer — a landing page each — creates a maintenance problem on day one: every price change, " +
            "copy edit and form fix acquires twelve sources of truth. So the site keeps one canonical " +
            "page and makes the URL partner-aware instead. Twelve allow-listed slugs arrive as a ref " +
            "parameter, and the page validates the slug rather than accepting arbitrary referral text. " +
            "The event owner keeps one site; the partner keeps their attribution." },
    { kind: "stub", h: "First touch and last touch are different questions",
      body: "A referral click is easy to capture. What happens when the same person returns three days " +
            "later through somebody else’s link is the actual question. The browser record keeps both: " +
            "first and last referral, first and last campaign, first and last landing, timestamps and the " +
            "current path, over a thirty-day window. The latest valid referral takes the credit while the " +
            "first stays available as history, which is a more useful answer than overwriting a single " +
            "stored value. Only attribution is persisted — no name, no Telegram handle, no email, no " +
            "phone and no comment ever reaches browser storage — and persistence is consent-aware, so " +
            "blocked storage degrades to page-local attribution instead of pretending it succeeded. It is " +
            "deterministic first/last-touch attribution for allow-listed links, not identity resolution " +
            "across devices." },
    { kind: "stub", h: "The client reports the referral. The server decides whether to believe it.",
      body: "Anything in a browser can be edited, so the Worker does not accept the credited referral or " +
            "the partner name from the client. It rebuilds credit from the same allow-list — the " +
            "validated last referral, falling back to the validated first — and looks the partner name up " +
            "server-side. Editing a hidden field in devtools cannot assign somebody else’s lead to your " +
            "name. It is a small boundary and it sets the rule the rest of the pipeline follows: " +
            "attribution can start on the client, authority ends on the server." },
    { kind: "stub", h: "A static site still needs a backend boundary",
      body: "GitHub Pages is useful precisely because it is static, and it is the wrong place for an " +
            "Airtable token. The form posts to a Cloudflare Worker that checks origin, caps body size, " +
            "validates the JSON shape, reads the honeypot, runs the optional Turnstile path and " +
            "re-validates the referral before mapping allow-listed values into an explicit Airtable " +
            "record. The record is built from field IDs rather than column names, so renaming a column " +
            "does not silently break the write. These are the controls that exist; the repository is not " +
            "a third-party security audit and does not say otherwise." },
    { kind: "stub", h: "The failure path has to convert too",
      body: "Most forms are written as submit, then success. A real one survives a missing endpoint, a " +
            "dead network, a timeout, a non-2xx, a blocked popup and an unavailable CRM. When the lead " +
            "endpoint fails here, the visitor’s entered fields stay where they are and the site composes " +
            "a pre-filled Telegram message to the organiser; if the new window is blocked, the same " +
            "message is offered as an ordinary link. Two conversion paths, and the failing one still lets " +
            "the visitor finish the job." },
    { kind: "photo", src: "public/media/bulgaria-2026/application-form.webp", ratio: "1500 / 1039", tone: "light",
      caption: "application · short form · one screen" },
    { kind: "stub", h: "Interaction that does not overclaim",
      body: "The networking page turns its own subject into the interaction. A three-question score asks " +
            "what currently happens after an event rather than scoring a personality. The " +
            "self-presentation tool composes a first draft from four fields and calls it a draft — it is " +
            "a deterministic text composer, not an AI writing a brand position. The prize wheel " +
            "visualises which bonuses are in the fund and states plainly that the real draw happens live " +
            "at the event. Interaction should raise curiosity without lying about what the interaction " +
            "means. The wheel also reads prefers-reduced-motion and resolves without the spin, which is " +
            "the contract the rest of the site keeps: motion adds orientation, it never gates content." },
    { kind: "photo", src: "public/media/bulgaria-2026/networking-generator.webp", ratio: "1500 / 1370", tone: "light",
      caption: "self-presentation composer · four fields · draft out" },
    { kind: "photo", src: "public/media/bulgaria-2026/networking-wheel.webp", ratio: "1500 / 1086",
      caption: "prize pool · the wheel shows the fund" },
    { kind: "stub", h: "Black Sea Modernist Atlas",
      body: "The direction was to look like an event in a place rather than an event template. Five " +
            "colours — atlas ink, mineral paper, paper dim, cobalt and sea glass — with Sofia Sans " +
            "Condensed carrying display and Manrope carrying interface. Twelve-column grid, zero radius, " +
            "lines instead of drop shadows, documentary crops, asymmetric framing, and cobalt used " +
            "selectively rather than as a brand wash. It rules out card grids, glassmorphism, pill " +
            "interfaces and compulsory parallax. The goal was never minimalism; it was editorial " +
            "specificity. The same thinking set the content order: the programme sits above the speaker " +
            "roster, because somebody arriving cold needs to know what happens before they are shown who " +
            "is famous, and the two prices are presented as different things rather than tiers — " +
            "admission and a coffee break is not a small version of a multi-day package with a hotel." },
    { kind: "photo", src: "public/media/bulgaria-2026/forum-programme.webp", ratio: "1500 / 1464",
      caption: "12 september · programme above the speaker wall" },
    { kind: "photo", src: "public/media/bulgaria-2026/forum-pricing.webp", ratio: "1500 / 1039",
      caption: "event entry · travel package · 25 € · 700 €" },
  ],
  links: [
    { kind: "LIVE", label: "bulgaria2026.com", href: "https://bulgaria2026.com/" },
  ],
  prev: "0x0C",
  next: "0x01",
};

window.PROJECT_DATA = PROJECT_DATA;

// Warm only the current page's hero. Preloading every project here kept all
// parsed GLBs resident on every case-file page and was a large, invisible RAM
// cost. model-viewer.jsx announces when its shared loader is ready, so a slow
// external script fetch cannot make this warmup race and silently disappear.
function warmCurrentProjectModel() {
  if (typeof window.preloadModels !== "function") return;
  const config = window.PAGE_CONFIG || {};
  let project = PROJECT_DATA[config.addr];
  if (!project) {
    let pathname = window.location.pathname || "";
    try { pathname = decodeURIComponent(pathname); } catch (_) {}
    pathname = pathname.replace(/\\/g, "/");
    project = Object.values(PROJECT_DATA).find((candidate) =>
      candidate && candidate.file
        && (pathname === candidate.file || pathname.endsWith("/" + candidate.file))
    );
  }
  const hero = config.hero || {};
  const modelUrl = hero.model
    || (typeof hero.buildModel === "function" ? null : project && project.model);
  if (modelUrl) window.preloadModels([modelUrl]);
}

if (typeof window.preloadModels === "function") warmCurrentProjectModel();
else window.addEventListener("mo:model-loader-ready", warmCurrentProjectModel, { once: true });
