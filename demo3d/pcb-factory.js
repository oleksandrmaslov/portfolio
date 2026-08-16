/* ============================================================
   M.O. SYSTEM — ISKRA 3D · PCB FACTORY  (node 0x09)
   ------------------------------------------------------------
   Procedural boards the operator inspects. ONE source of truth
   per board — generateLayout(spec) — drives BOTH the 3D meshes
   (buildBoard) AND the silkscreen canvas (makeSilkTexture), so
   every ref designator sits beside its real component.

   Two Energy-for-Ukraine products (same PY32 family, you must
   read the silk to tell them apart):
     · CI-CLOP   round torch board · LED ring · PY32F002Ax5
     · VENOVISOR rect medic board  · IR array · PY32F003Ax5
   Four decoys to REJECT (wrong MCU family, but iconic shapes):
     · BLUEPILL  · BLACKPILL · ESP-WROOM · RP2040

   Per-instance variety (seed): soldermask colour, silkscreen
   wear, component jitter, LED counts, bench rotation — so the
   same product never looks quite the same twice.
   ============================================================ */
(function () {
  const P = window.IskraParts;
  const { COL } = P;

  /* soldermask options — {mask: css, edge: hex int (FR4 rim), silk: css, copper: css} */
  const MASKS = {
    green:  { mask: "#0c3a24", edge: 0x123a20, silk: "#e8eef0", copper: "#1d6b46" },
    blue:   { mask: "#0e2a52", edge: 0x14233f, silk: "#eaf1f8", copper: "#1c52a0" },
    black:  { mask: "#0c0f15", edge: 0x14181f, silk: "#dfe4ec", copper: "#2a3340" },
    red:    { mask: "#4a1018", edge: 0x3a1014, silk: "#f3e9ea", copper: "#8a2230" },
    purple: { mask: "#2c1448", edge: 0x231038, silk: "#efe9f6", copper: "#5a2e8e" },
    teal:   { mask: "#06302e", edge: 0x0e2c2a, silk: "#e6f1ef", copper: "#13615a" },
    matte:  { mask: "#10222e", edge: 0x142028, silk: "#e4ecef", copper: "#1d4a5c" },
    white:  { mask: "#cfd4d8", edge: 0x9aa0a6, silk: "#1a1f27", copper: "#9aa6ad" },
  };

  /* ---- blueprint helpers ---- */
  const comp = (type, x, z, ref, opts) => ({ type, x, z, ref: ref || "", rot: (opts && opts.rot) || 0, opts: opts || {} });
  const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];
  const jit = (rng, a) => (rng() * 2 - 1) * a;

  /* ============================================================
     BLUEPRINTS — each .build(rng, spec) returns a layout
     ============================================================ */
  const BP = {
    /* -------- CI-CLOP · round torch board -------- */
    "ci-clop": {
      name: "CI-CLOP", product: "ci-clop", family: "PY32", kind: "good",
      part: "PY32F002Ax5", enclosure: "torch",
      shape: "round", size: { r: 1.06 }, thickness: 0.085,
      masks: ["green", "black", "blue", "red", "teal", "purple"],
      build(rng) {
        const comps = [], texts = [], pads = [], traces = [], holes = [];
        const r = 1.06;
        const n = pick(rng, [8, 10, 12]);                 // LED ring count varies
        const ringR = 0.82, a0 = jit(rng, 0.4);
        for (let i = 0; i < n; i++) {
          const a = a0 + (i / n) * Math.PI * 2;
          const x = Math.cos(a) * ringR, z = Math.sin(a) * ringR;
          comps.push(comp("led", x, z, "D" + (i + 1), { rot: -a + Math.PI / 2, col: COL.white, on: false, ring: true, size: 0.085 }));
        }
        const mrot = pick(rng, [0, Math.PI / 2]);
        comps.push(comp("soic", jit(rng, 0.05), jit(rng, 0.05), "U1", { rot: mrot, len: 0.22, wid: 0.13, pins: 8 }));
        // decoupling caps around MCU
        for (let i = 0; i < 3; i++) comps.push(comp("passive", -0.18 + i * 0.16 + jit(rng, 0.02), 0.24 + jit(rng, 0.03), "C" + (i + 1), { w: 0.07, d: 0.04, col: COL.cap }));
        // tactile mode switch toward an edge
        const sa = Math.PI * (0.55 + jit(rng, 0.06));
        comps.push(comp("button", Math.cos(sa) * 0.46, Math.sin(sa) * 0.46, "SW1", { size: 0.17 }));
        // battery JST at edge
        const ja = Math.PI * (-0.5 + jit(rng, 0.05));
        comps.push(comp("jst", Math.cos(ja) * 0.7, Math.sin(ja) * 0.7, "J1", { pins: 2, rot: -ja + Math.PI / 2, col: COL.jstWhite }));
        // a regulator + cap cluster
        comps.push(comp("soic", -0.5, -0.2, "U2", { len: 0.13, wid: 0.1, pins: 6 }));
        // SWD pads (gold, in silk) near MCU
        const sx = -0.04, sz = -0.42;
        for (let i = 0; i < 4; i++) pads.push({ x: sx - 0.12 + i * 0.08, z: sz, r: 0.028, label: ["C", "D", "V", "G"][i] });
        texts.push({ x: sx, z: sz - 0.1, size: 0.05, text: "SWD", rot: 0 });
        // mounting holes
        for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2 + 0.5; holes.push({ x: Math.cos(a) * 0.95, z: Math.sin(a) * 0.95, r: 0.05 }); }
        // copper traces ring→center
        for (let i = 0; i < n; i += 2) { const a = a0 + (i / n) * Math.PI * 2; traces.push([[Math.cos(a) * ringR, Math.sin(a) * ringR], [Math.cos(a) * 0.3, Math.sin(a) * 0.3], [0.05, 0.05]]); }
        const rev = pick(rng, ["R1", "R1", "R2"]);
        return {
          comps, texts, pads, traces, holes,
          title: { x: 0.0, z: 0.5, rot: 0, name: "CI-CLOP", part: "PY32F002Ax5", sub: "EfU · TORCH", rev, align: "center" },
          marks: [{ x: -0.62, z: 0.66, size: 0.055, text: "◇ EfU" }],
        };
      },
    },

    /* -------- VENOVISOR · rect medic board -------- */
    "venovisor": {
      name: "VENOVISOR", product: "venovisor", family: "PY32", kind: "good",
      part: "PY32F003Ax5", enclosure: "wand",
      shape: "rect", size: { w: 2.3, d: 1.46 }, thickness: 0.085,
      masks: ["teal", "black", "blue", "green", "matte", "purple"],
      build(rng) {
        const comps = [], texts = [], pads = [], traces = [], holes = [];
        comps.push(comp("soic", -0.62 + jit(rng, 0.04), 0.12, "U1", { rot: pick(rng, [0, Math.PI / 2]), len: 0.22, wid: 0.13, pins: 8 }));
        // IR LED array 2x4 on the right
        let d = 1;
        const cols = 4, rows = 2;
        for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
          comps.push(comp("led", 0.14 + c * 0.26 + jit(rng, 0.012), -0.26 + r * 0.52 + jit(rng, 0.012), "D" + (d++), { col: COL.irLed, on: false, size: 0.082, bodyCol: 0x141821 }));
        }
        // vein sensor (clear dome) center-right
        comps.push(comp("dome", 0.62 + jit(rng, 0.03), 0.0, "U2", { r: 0.1, clear: true, emiCol: COL.irLed }));
        // USB-C front edge
        comps.push(comp("usbC", -0.2 + jit(rng, 0.05), 0.66, "J1", { rot: 0 }));
        // passives near MCU
        for (let i = 0; i < 4; i++) comps.push(comp("passive", -0.95 + (i % 2) * 0.12, -0.18 + Math.floor(i / 2) * 0.12, "C" + (i + 1), { w: 0.07, d: 0.04, col: i % 2 ? COL.capDark : COL.cap }));
        comps.push(comp("passive", -0.4, 0.42, "R1", { w: 0.06, d: 0.035, col: COL.res }));
        // SWD pads
        for (let i = 0; i < 4; i++) pads.push({ x: -1.0 + i * 0.08, z: 0.5, r: 0.028, label: ["C", "D", "V", "G"][i] });
        texts.push({ x: -0.86, z: 0.6, size: 0.05, text: "SWD" });
        texts.push({ x: 0.62, z: 0.42, size: 0.045, text: "VEIN" });
        // mount holes corners
        [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([sx, sz]) => holes.push({ x: sx * 1.02, z: sz * 0.6, r: 0.05 }));
        traces.push([[-0.62, 0.12], [0.0, 0.0], [0.62, 0.0]]);
        traces.push([[-0.62, 0.12], [-0.2, 0.5], [-0.2, 0.62]]);
        const rev = pick(rng, ["R1", "R2", "R2"]);
        return {
          comps, texts, pads, traces, holes,
          title: { x: -0.62, z: -0.5, rot: 0, name: "VENOVISOR", part: "PY32F003Ax5", sub: "EfU · VEIN", rev, align: "left" },
          marks: [{ x: 0.95, z: -0.58, size: 0.05, text: "◇ EfU" }],
        };
      },
    },

    /* -------- BLUEPILL · STM32 dev board -------- */
    "bluepill": {
      name: "BLUEPILL", product: null, family: "STM32", kind: "decoy",
      part: "STM32F103C8T6", enclosure: null,
      shape: "rect", size: { w: 2.15, d: 0.92 }, thickness: 0.08,
      masks: ["blue"],
      build(rng) {
        const comps = [], texts = [], pads = [], traces = [], holes = [];
        comps.push(comp("quad", 0.0, 0.0, "U1", { size: 0.36, pins: 12, rot: 0 }));
        // header rows along long edges
        comps.push(comp("header", 0.0, -0.4, "P1", { rows: 20, cols: 1, pitch: 0.092 }));
        comps.push(comp("header", 0.0, 0.4, "P2", { rows: 20, cols: 1, pitch: 0.092 }));
        comps.push(comp("usbMicro", -1.0, 0.0, "USB", {}));
        comps.push(comp("button", -0.78, 0.0, "RST", { size: 0.13 }));
        // boot jumpers
        comps.push(comp("header", 0.5, -0.05, "B0", { rows: 2, cols: 1, pitch: 0.07 }));
        comps.push(comp("header", 0.62, -0.05, "B1", { rows: 2, cols: 1, pitch: 0.07 }));
        comps.push(comp("can", 0.34, 0.18, "Y1", { w: 0.18, d: 0.1, h: 0.05 }));    // 8MHz
        comps.push(comp("can", -0.34, -0.16, "Y2", { w: 0.13, d: 0.06, h: 0.05 })); // 32k
        comps.push(comp("led", -0.5, 0.18, "PWR", { col: COL.redLed, on: true, emi: 0.7, size: 0.06 }));
        comps.push(comp("led", -0.5, -0.18, "PC13", { col: COL.green, on: false, size: 0.06 }));
        comps.push(comp("soic", 0.78, 0.16, "U2", { len: 0.16, wid: 0.12, pins: 4 })); // reg
        for (let i = 0; i < 4; i++) comps.push(comp("passive", -0.1 + i * 0.12, 0.16, "C" + (i + 1), { w: 0.06, d: 0.035, col: COL.cap }));
        // header pin labels
        const labL = ["B12", "B13", "B14", "B15", "A8", "A9", "A10", "A11", "A12", "A15"];
        for (let i = 0; i < 10; i++) texts.push({ x: -0.9 + i * 0.18, z: -0.3, size: 0.032, text: labL[i] });
        const labR = ["GND", "GND", "3V3", "RST", "B11", "B10", "B1", "B0", "A7", "A6"];
        for (let i = 0; i < 10; i++) texts.push({ x: -0.9 + i * 0.18, z: 0.3, size: 0.032, text: labR[i] });
        [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([sx, sz]) => holes.push({ x: sx * 1.0, z: sz * 0.36, r: 0.04 }));
        return {
          comps, texts, pads, traces, holes,
          title: { x: 0.0, z: 0.0, rot: 0, name: "", part: "STM32F103C8T6", sub: "", rev: "", hidden: true },
          marks: [{ x: 0.0, z: 0.2, size: 0.05, text: "STM32F103" }, { x: 0.0, z: -0.22, size: 0.038, text: "BLUEPILL" }],
        };
      },
    },

    /* -------- BLACKPILL · WeAct STM32F4 -------- */
    "blackpill": {
      name: "BLACKPILL", product: null, family: "STM32", kind: "decoy",
      part: "STM32F411CEU6", enclosure: null,
      shape: "rect", size: { w: 1.72, d: 0.74 }, thickness: 0.08,
      masks: ["black"],
      build(rng) {
        const comps = [], texts = [], pads = [], traces = [], holes = [];
        comps.push(comp("quad", 0.0, 0.0, "U1", { size: 0.34, pins: 12 }));
        comps.push(comp("header", 0.0, -0.31, "P1", { rows: 20, cols: 1, pitch: 0.073 }));
        comps.push(comp("header", 0.0, 0.31, "P2", { rows: 20, cols: 1, pitch: 0.073 }));
        comps.push(comp("usbC", -0.74, 0.0, "USB", {}));
        comps.push(comp("button", 0.5, 0.16, "KEY", { size: 0.12 }));
        comps.push(comp("button", 0.5, -0.16, "BOOT0", { size: 0.12 }));
        comps.push(comp("can", 0.28, 0.0, "Y1", { w: 0.16, d: 0.09, h: 0.05 }));
        comps.push(comp("soic", -0.3, 0.16, "U2", { len: 0.18, wid: 0.13, pins: 8 })); // SPI flash
        comps.push(comp("led", -0.5, 0.0, "C13", { col: COL.blue, on: true, emi: 0.5, size: 0.055 }));
        for (let i = 0; i < 3; i++) comps.push(comp("passive", -0.12 + i * 0.12, 0.16, "C" + (i + 1), { w: 0.06, d: 0.035, col: COL.capDark }));
        const lab = ["B12", "B13", "B14", "B15", "A8", "A9", "A10", "B3", "B4", "B5"];
        for (let i = 0; i < 10; i++) texts.push({ x: -0.7 + i * 0.15, z: -0.2, size: 0.03, text: lab[i] });
        [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([sx, sz]) => holes.push({ x: sx * 0.8, z: sz * 0.3, r: 0.035 }));
        return {
          comps, texts, pads, traces, holes,
          title: { x: 0.0, z: 0.0, hidden: true },
          marks: [{ x: 0.0, z: 0.18, size: 0.05, text: "STM32F411" }, { x: 0.0, z: -0.2, size: 0.036, text: "WeAct · BLACKPILL" }],
        };
      },
    },

    /* -------- ESP-WROOM · ESP32 dev board -------- */
    "esp-wroom": {
      name: "ESP-WROOM", product: null, family: "ESP32", kind: "decoy",
      part: "ESP32-WROOM-32", enclosure: null,
      shape: "rect", size: { w: 2.05, d: 1.08 }, thickness: 0.08,
      masks: ["black"],
      build(rng) {
        const comps = [], texts = [], pads = [], traces = [], holes = [];
        // the WROOM module up top with shield + antenna meander (drawn in silk above it)
        comps.push(comp("module", 0.0, -0.18, "U1", { w: 0.98, d: 0.6, h: 0.13, subCol: 0x10141b, shieldOff: 0.06 }));
        comps.push(comp("header", 0.0, -0.46, "P1", { rows: 15, cols: 1, pitch: 0.12 }));
        comps.push(comp("header", 0.0, 0.46, "P2", { rows: 15, cols: 1, pitch: 0.12 }));
        comps.push(comp("usbMicro", 0.0, 0.34, "USB", { rot: 0 }));
        comps.push(comp("button", -0.62, 0.34, "EN", { size: 0.12 }));
        comps.push(comp("button", 0.62, 0.34, "BOOT", { size: 0.12 }));
        comps.push(comp("soic", -0.34, 0.3, "U2", { len: 0.18, wid: 0.13, pins: 4 })); // AMS1117
        comps.push(comp("led", 0.34, 0.28, "D1", { col: COL.redLed, on: true, emi: 0.6, size: 0.055 }));
        comps.push(comp("elec", 0.5, 0.18, "C1", { r: 0.07, h: 0.16 }));
        const lab = ["3V3", "EN", "VP", "VN", "D34", "D35", "D32", "D33", "D25", "D26"];
        for (let i = 0; i < 10; i++) texts.push({ x: -0.84 + i * 0.18, z: -0.62, size: 0.03, text: lab[i] });
        [[-1, 1], [1, 1]].forEach(([sx, sz]) => holes.push({ x: sx * 0.92, z: sz * 0.4, r: 0.04 }));
        return {
          comps, texts, pads, traces, holes,
          // antenna meander zone (drawn in silk)
          meander: { x: 0.0, z: -0.66, w: 0.62, d: 0.18 },
          title: { x: 0.0, z: 0.06, hidden: true },
          marks: [{ x: 0.0, z: 0.06, size: 0.055, text: "ESP32" }, { x: 0.0, z: -0.02, size: 0.034, text: "WROOM-32" }],
        };
      },
    },

    /* -------- RP2040 · Pico-style board -------- */
    "rp2040": {
      name: "RP2040", product: null, family: "RP2040", kind: "decoy",
      part: "RP2-B2", enclosure: null,
      shape: "rect", size: { w: 2.1, d: 0.86 }, thickness: 0.08,
      masks: ["green"],
      build(rng) {
        const comps = [], texts = [], pads = [], traces = [], holes = [];
        comps.push(comp("quad", -0.1, 0.0, "U1", { size: 0.3, pins: 14, qfn: true }));
        comps.push(comp("soic", 0.24, 0.0, "U2", { len: 0.18, wid: 0.13, pins: 8 })); // flash
        comps.push(comp("usbMicro", -0.95, 0.0, "USB", {}));
        comps.push(comp("button", 0.62, 0.0, "BOOTSEL", { size: 0.13 }));
        comps.push(comp("led", 0.4, 0.22, "LED", { col: COL.green, on: true, emi: 0.6, size: 0.055 }));
        comps.push(comp("can", -0.4, 0.2, "Y1", { w: 0.12, d: 0.07, h: 0.045 }));
        for (let i = 0; i < 4; i++) comps.push(comp("passive", -0.3 + i * 0.12, -0.2, "C" + (i + 1), { w: 0.055, d: 0.032, col: COL.capDark }));
        // castellated gold pads along both long edges
        for (let i = 0; i < 20; i++) {
          pads.push({ x: -0.95 + i * 0.1, z: -0.38, r: 0.03, cast: true });
          pads.push({ x: -0.95 + i * 0.1, z: 0.38, r: 0.03, cast: true });
        }
        const labL = ["GP0", "GP1", "GND", "GP2", "GP3", "GP4", "GP5", "GND", "GP6", "GP7"];
        for (let i = 0; i < 10; i++) texts.push({ x: -0.86 + i * 0.18, z: -0.28, size: 0.03, text: labL[i] });
        return {
          comps, texts, pads, traces, holes,
          title: { x: -0.1, z: 0.0, hidden: true },
          marks: [{ x: -0.1, z: 0.0, size: 0.04, text: "RP2-B2" }, { x: 0.0, z: 0.3, size: 0.038, text: "RP2040 · DEV" }],
        };
      },
    },
  };

  /* ============================================================
     LAYOUT — built once per spec, memoised on spec._layout
     ============================================================ */
  function generateLayout(spec) {
    if (spec._layout) return spec._layout;
    const bp = BP[spec.bp];
    const rng = P.mulberry32(spec.seed);
    const layout = bp.build(rng, spec);
    layout.bp = bp;
    layout.maskKey = spec.mask || pick(rng, bp.masks);
    spec._layout = layout;
    return layout;
  }

  /* default spec for a blueprint (station overrides mask/seed/wear) */
  function makeSpec(bpId, opts = {}) {
    const bp = BP[bpId];
    const rng = P.mulberry32(opts.seed || ((Math.random() * 1e9) | 0));
    return Object.assign({
      bp: bpId, id: bpId + "_" + ((Math.random() * 1e6) | 0),
      name: bp.name, product: bp.product, family: bp.family, kind: bp.kind,
      silk: bp.part, part: bp.part, enclosure: bp.enclosure,
      seed: (opts.seed != null ? opts.seed : (Math.random() * 1e9) | 0),
      mask: opts.mask || pick(rng, bp.masks),
      wear: opts.wear != null ? opts.wear : 0.4,
      benchYaw: opts.benchYaw != null ? opts.benchYaw : (rng() * 2 - 1) * Math.PI,
    }, opts);
  }

  window.IskraPCB = {
    BP, MASKS, generateLayout, makeSpec,
    blueprintIds: Object.keys(BP),
    productIds: ["ci-clop", "venovisor"],
    decoyIds: ["bluepill", "blackpill", "esp-wroom", "rp2040"],
  };
})();
