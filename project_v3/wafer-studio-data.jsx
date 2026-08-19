/* ============================================================
   M.O. SYSTEM — NODE 0x06 · WAFER STUDIO — page data
   ------------------------------------------------------------
   Registers into window.PROJECT_DATA (project/data.jsx) so the
   v2/v3 page core, footer ring and links section read it like
   any other node. Content is grounded in the repository:
   github.com/oleksandrmaslov/wafer-studio (README · DESIGN.md ·
   UX.md · docs/wafer-interaction-model.md).
   ============================================================ */
window.PROJECT_DATA = window.PROJECT_DATA || {};
window.PROJECT_DATA["0x06"] = {
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
    { kind: "GITHUB",  label: "oleksandrmaslov/wafer-studio",  href: "https://github.com/oleksandrmaslov/wafer-studio" },
    { kind: "LIVE",    label: "open in your browser",          href: "https://oleksandrmaslov.github.io/wafer-studio/" },
    { kind: "DESKTOP", label: "download · macOS · Linux · Windows", href: "https://oleksandrmaslov.github.io/wafer-studio/download.html" },
    { kind: "UPSTREAM", label: "zmkfirmware/zmk-studio · protocol", href: "https://github.com/zmkfirmware/zmk-studio" },
  ],
  prev: "0x01",
  next: "0x08",
};
