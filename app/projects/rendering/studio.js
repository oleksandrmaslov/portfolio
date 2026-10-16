/* ============================================================
   M.O. SYSTEM — THE STUDIO: one look for every model
   ------------------------------------------------------------
   The site's only copy of the void studio room, the PBR Neutral
   curve, the preset table and its name table, the hardware
   finishes, the Wafer assembly, the per-model LOOKS, the rig
   dress, fit and merge. It is moved from the lab gallery
   (lab/materials.html), where a look is judged before it ships.

   Plain ES module with no import and nothing at the top level that
   touches window or document: the caller hands in THREE (r160).
   build.cjs inlines it into every bundle as window.MOStudio; the
   lab and node (studio.test.cjs) import the file itself.

   Tone lives in the material, never on a renderer: tone() puts
   Neutral inside each model material, so the hero, the handoff,
   the field, the menu, the board and the demo run one shader.

   Ownership: finish() returns the materials it made. A consumer
   disposes those and nothing else. Textures and geometry are the
   loader's or this module's (finish textures, palettes, merged
   geometry), shared by every clone on the page and never disposed.
   ============================================================ */

/* ---------------- tone: PBR Neutral, inside the material ---------------- */

export const TONE = Object.freeze({
  exposure: 1.0,
  toe: 1.0,   // PBR Neutral's black toe: 1 = spec, 0 = keep every bit of shadow detail
});

/* PBR Neutral (Khronos) with an adjustable toe. lab/studio.js keeps the JS
   copy and its inverse for the study; lab/studio.check.mjs holds the two to
   the same constants. */
const NEUTRAL_FN = /* glsl */ `
    vec3 neutral(vec3 c) {
      float x = min(c.r, min(c.g, c.b));
      c -= uToe * (x < 0.08 ? x - 6.25 * x * x : 0.04);
      float peak = max(c.r, max(c.g, c.b));
      if (peak < 0.76) return c;
      float d = 0.24, np = 1.0 - d * d / (peak + d - 0.76);
      c *= np / peak;
      return mix(c, vec3(np), 1.0 - 1.0 / (0.15 * (peak - np) + 1.0));
    }`;
export const NEUTRAL_GLSL = `
    uniform float uExposure, uToe;${NEUTRAL_FN}`;

const TOE = { value: TONE.toe };
const toned = new WeakSet();   // not userData: Material.copy() copies userData but not onBeforeCompile
export const exposure = (ev = 0) => ({ value: TONE.exposure * 2 ** ev });

/* The renderer never tone-maps a model: the Universe draws into a render
   target, where three turns tone mapping off and r160's OutputPass has no
   custom curve. So every model material carries Neutral itself, and the hero,
   the handoff, the field, the menu, the board and the demo all run the same
   shader. A uniform per look: one program serves every exposure. Apply it
   LAST (finish hooks assign onBeforeCompile). A clone loses it: call tone()
   again on any clone. */
export function tone(m, uExposure = exposure()) {
  if (!m || m.toneMapped === false || toned.has(m)) return m;
  toned.add(m);
  const key = m.customProgramCacheKey(), prev = m.onBeforeCompile;   // read BEFORE wrapping: the default key is onBeforeCompile.toString()
  m.onBeforeCompile = function (sh, renderer) {
    prev.call(this, sh, renderer);
    sh.uniforms.uExposure = uExposure;
    sh.uniforms.uToe = TOE;
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", "#include <common>" + NEUTRAL_GLSL)
      .replace("#include <tonemapping_fragment>", "gl_FragColor.rgb = max(neutral(gl_FragColor.rgb * uExposure), 0.0);");
  };
  m.customProgramCacheKey = () => key + "|neutral";
  m.needsUpdate = true;
  return m;
}

/* ---------------- the room ---------------- */

/* The void studio: the study's dark room lifted by its DARK_PAGE walls, floor
   and fill (lab/studio.js), so black parts have something to reflect. Linear
   radiance of the room's walls, floor and softboxes. */
export const ROOM = { wall: 0.05, floor: 0.1, top: 2.0, back: 7.0, key: 8.0, rimL: 16.0, rimR: 20.0, fill: 1.4, side: 3.0 };
export const FIELD_ROOM = { ...ROOM, fill: 4 };   // a card faces the lens: the low front strip lifts flat chrome and enamel
export const FIELD_AMBIENT = 1.0;                 // the field: fills the diffuse side, adds nothing to a reflection
/* The menu draws thumbnails through an orthographic front camera on near-black, with no card behind them: under the field's
   dress a flat face sees only the dark wall, so the Wafer went grey on black and the chrome W brown. It keeps the field's
   materials and curve and adds the rig's key and rim strengths (the old menu's directions, its signal-teal rim), lighter
   walls and floor for the metals, and a stop on the black Wafer. Tuned against HEAD in lab/port/compare/menu-contrast.png. */
export const MENU = { room: { ...FIELD_ROOM, wall: 0.3, floor: 0.4 }, ambient: FIELD_AMBIENT, key: 2.5, rim: 2.2, rimColor: 0x00f0c8, ev: { wafer: 1 } };

/* A procedural photo studio: a soft grey room, a white floor, a big softbox
   behind and above (top surfaces carry its graded reflection at a
   three-quarter view, while straight down they see a quiet ceiling and black
   stays black), a small overhead fill, a front-left key, two tall rim strips
   behind and a low front fill. Black anodized metal reads almost entirely
   through what it reflects, so this IS the lighting. The camera only orbits
   in pitch — the object turns under fixed lights, like a turntable shoot.
   `e` is a room (ROOM, FIELD_ROOM). */
export function studioRoom(THREE, e) {
  const env = new THREE.Scene();
  const lum = (v, side = THREE.DoubleSide) => new THREE.MeshBasicMaterial({ color: new THREE.Color(v, v, v), side });
  const room = new THREE.Mesh(new THREE.BoxGeometry(30, 16, 30), lum(e.wall, THREE.BackSide));
  room.position.y = 7;
  env.add(room);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), lum(e.floor));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.98;
  env.add(floor);
  const panel = (w, h, v, x, y, z) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), lum(v));
    m.position.set(x, y, z);
    m.lookAt(0, 0, 0);
    env.add(m);
  };
  panel(4, 4, e.top, 0, 9, 0);
  panel(12, 5, e.back, 0, 5, -9);
  panel(5, 7, e.key, -7, 4, 6);
  panel(1.2, 9, e.rimL, -9, 3, -6);
  panel(1.2, 9, e.rimR, 9, 3, -5);
  panel(14, 2.5, e.fill, 0, 1.5, 12);
  if (e.side) panel(7, 9, e.side, -11, 3, 2);
  return env;
}

/* Rendered once through a cube camera into a PMREM: no blur pass (sigma 0)
   and no depth buffer left on the result (fromScene keeps a 3 MB one). 256
   for a hero, 128 for the field, the board and the menu. The caller owns the
   returned target: use .texture, dispose() it with its renderer. */
export function studioEnvironment(THREE, renderer, e = ROOM, size = 256) {
  const room = studioRoom(THREE, e);
  const cube = new THREE.WebGLCubeRenderTarget(size, { type: THREE.HalfFloatType });   // radiance up to 20: never 8-bit
  new THREE.CubeCamera(0.1, 100, cube).update(renderer, room);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const target = pmrem.fromCubemap(cube.texture);
  pmrem.dispose(); cube.dispose();
  room.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
  return target;
}

/* ---------------- stages ---------------- */

/* What a preset does on a stage: env is the envMapIntensity of every preset,
   floor the least linear luma of a base colour (the void swallows black). */
export const HW_STAGE = { mat: { env: 1, floor: 0.02 } };      // hardware: the void room, black keeps a silhouette
/* A logo is colour first. The void room is bright by design, for black parts
   that read only through what they reflect: a saturated colour in it
   overexposes, and the tone curve walks it to pastel (Sightseeing's #2284f7
   came out #7daaf8). So a logo sees the room at 0.3, and its floor lifts any
   base colour under luma 0.04: without it Bulgaria's #0a1724 tile is the
   colour of the card behind it. Hue is kept; only the black is lifted. */
export const LOGO_STAGE = { mat: { env: 0.3, floor: 0.04 } };
const stageOf = (env) => ({ mat: { env, floor: 0.04 } });
/* ...but a metal is only what it reflects, so it gets its own room strength.
   The thin-film chrome is already near white at the room's own 1: more and
   it clips. The brushed pearl is a dull grey at 1 and reads as pearl at 1.8
   (Silent Depth; the Sightseeing handle). */
export const METALS = [
  { names: ["iridescent-chrome"], stage: stageOf(1) },
  { names: ["brushed-pearl", "handle-metal"], stage: stageOf(1.8) },
];
/* Venovisor body, the one source of truth (the GLB's own tpu-olive #7b774c is
   a stop darker and is replaced by this). Re-sampled from grey-card-balanced
   pixels of delivered.webp and in-use.webp: a flat, greyish olive-khaki. */
export const VENO_OLIVE = "#8a8560";

/* ---------------- presets ---------------- */

/* What each surface is made of. Every number is a physical statement:
   anodising is a dyed dielectric oxide (n 1.65), not bare metal; an
   enamel is paint under a lacquer; a PBT cap is dry. Where lab/wafer.js
   has the same surface (MAT.alu, MAT.nylon, PROP_MAT.enamel, its PCB and
   display glass) the numbers are the study's; the brushed pearl is its
   brushed stainless. Colours are sRGB hex, the way the study writes them. */
export const PRESETS = {
  anodisedBlack:  { color: "#1d1e21", roughness: 0.5, metalness: 0, ior: 1.65, grain: { scale: 4000, rough: 0.16 } },
  anodisedGreen:  { color: "#009b45", roughness: 0.42, metalness: 0, ior: 1.65, grain: { scale: 5000, rough: 0.12 } },   // Brionel and Ci-Clop's dye
  enamel:         { color: "#f0f0ec", roughness: 0.42, metalness: 0, ior: 1.5, clearcoat: 0.6, clearcoatRoughness: 0.18 },
  brushedPearl:   { color: "#c4c6c9", roughness: 0.34, metalness: 1, anisotropy: 0.6 },
  // thin film needs a base that is not a perfect mirror: on a pure white F0 the film's interference cancels and the colour vanishes
  chromeThinFilm: { color: "#9a9a9a", roughness: 0.15, metalness: 1, iridescence: 0.4, iridescenceIOR: 1.3, iridescenceThicknessRange: [120, 260] },
  pbtCap:         { color: "#141517", roughness: 0.42, metalness: 0, ior: 1.5, grain: { scale: 6000, rough: 0.2 } },   // the study's cap is 0.4; the grain here is roughness only (cell noise on position), not its triplanar normal map
  nylonCap:       { color: "#111112", roughness: 0.74, metalness: 0, ior: 1.53 },
  soldermask:     { color: "#0f1011", roughness: 0.45, metalness: 0, ior: 1.5, clearcoat: 0.5, clearcoatRoughness: 0.3 },
  mipGlass:       { color: "#babdb8", roughness: 0.4, metalness: 0, ior: 1.5, clearcoat: 1, clearcoatRoughness: 0.05 },
  matteBlack:     { color: "#111213", roughness: 0.62, metalness: 0, ior: 1.5 },
  emissiveLegend: { color: "#18191c", roughness: 0.5, metalness: 0, ior: 1.5, emissiveIntensity: 1 },
  tpuPrinted:     { roughness: 0.58, metalness: 0, ior: 1.5, layer: 0.0002, slope: 0.045 },   // no default colour: it is sampled from the photographs, per unit. Also the PLA print (pla-olive): same layer lines, the colour makes the difference
  lensClear:      { color: "#e6eae8", roughness: 0.1, metalness: 0, ior: 1.5, clearcoat: 1, clearcoatRoughness: 0.04 },   // a clear LED dome: a pale diffuser under a glassy skin, not a mirror and not a glow
};
// what the first argument of a factory is, when it is not a colour
const ARG = { soldermask: "map", emissiveLegend: "emissive" };
// what a sealed GLB's own material lends its preset (everything else about it is replaced); a lent colour brings the material's map along, so a gradient survives
const LENDS = { anodisedGreen: "color", enamel: "color", brushedPearl: "color", soldermask: "map", emissiveLegend: "emissive", tpuPrinted: "color" };

/* Sealed GLB material name -> preset. A table, never per-model numbers:
   the names already say what each surface is. `"*"` catches the rest. */
export const BY_NAME = {
  "anodised-green": "anodisedGreen",                       // brionel
  "enamel-yellow": "enamel", "enamel-blue": "enamel", "enamel-navy": "enamel",   // iskra, sightseeing
  "handle-metal": "brushedPearl", "brushed-pearl": "brushedPearl",               // sightseeing, silent depth
  "iridescent-chrome": "chromeThinFilm",                   // wafer studio
  "tile-navy": "enamel", "glyph-pearl": "enamel",          // bulgaria: lacquer, pearl
  "accent-blue": "emissiveLegend",
  "gradient-plate": "enamel", "white-relief": "enamel",    // zmk pointaccel
  "module-body": "matteBlack",                             // split hid display: matte bezel and board
  "lit-pixels": "mipGlass",                                // memory-in-pixel: reflective silver under glass, not emissive
  "keycap-charcoal": "pbtCap", "legend-lit": "emissiveLegend",   // soft off plus
  // the printed models: the Venovisor's TPU and the Ci-Clop's PLA take the sealed colour and get layer lines
  "tpu-olive": "tpuPrinted", "tpu-button": "tpuPrinted", "pla-olive": "tpuPrinted",
  "led-red": "emissiveLegend", "led-white": "emissiveLegend",    // the LED domes: the material's own emissive colour, the preset's strength
  "lens-clear": "lensClear",
};

const luma = (c) => 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;

/* The factories for one stage. presets(THREE, HW_STAGE).enamel("#fff"),
   .tpuPrinted(olive, { layer: 0.0002 }), .apply(root) for a loaded GLB.
   opts.grain === false builds a grained preset without its grain; an object
   overrides its numbers (a quantised mesh needs its own scale). */
export function presets(THREE, stage) {
  if (!stage || !stage.mat) throw new Error("studio: presets need an explicit stage (HW_STAGE, LOGO_STAGE)");
  const { env, floor } = stage.mat;

  function build(name, arg, opts = {}) {
    const spec = PRESETS[name];
    if (!spec) throw new Error(`studio: no preset "${name}"`);
    const { color: base, layer, slope, grain: gr, ...look } = spec;
    const kind = ARG[name] || "color";
    if (kind === "color" && arg == null && base === undefined) throw new Error(`studio: ${name} needs a colour`);
    const m = new THREE.MeshPhysicalMaterial({ ...look, envMapIntensity: env });
    const color = new THREE.Color(kind === "color" && arg != null ? arg : base);
    const map = opts.map || (kind === "map" ? arg : null);
    if (map) m.map = map;
    if (kind === "map" && map) color.setRGB(1, 1, 1);   // a mask that comes with its own artwork shows it as authored; the dark base is for a bare board
    if (kind === "emissive") {
      // the glow keeps its colour, the preset owns its strength: peak channel 1, the body a dark tint of it
      const e = new THREE.Color(arg != null ? arg : "#ffffff"), peak = Math.max(e.r, e.g, e.b, 1e-6);
      m.emissive = new THREE.Color().setRGB(e.r / peak, e.g / peak, e.b / peak);
      m.emissiveIntensity = look.emissiveIntensity;
      color.copy(m.emissive).multiplyScalar(0.15);
    } else if (luma(color) < floor) {
      const k = floor / Math.max(luma(color), 1e-5);   // pure black has no direction: lift it grey
      color.setRGB(Math.min(1, color.r * k || floor), Math.min(1, color.g * k || floor), Math.min(1, color.b * k || floor));
    }
    m.color = color;
    if (name === "tpuPrinted") printLines(THREE, m, { layer: opts.layer ?? layer, slope: opts.slope ?? slope, axis: opts.axis || [0, 0, 1] });
    if (gr && opts.grain !== false) grain(THREE, m, typeof opts.grain === "object" ? { ...gr, ...opts.grain } : gr);
    return m;
  }

  const out = {};
  for (const name of Object.keys(PRESETS)) out[name] = (arg, opts) => build(name, arg, opts);

  /* Swap a loaded GLB's materials for presets by name (table: BY_NAME, or your own).
     The sealed material is not disposed: loadProjectModel hands out root.clone(true),
     which SHARES materials with the cached root. A material the table does not name
     is left alone and reported. `[preset, arg]` entries pass an explicit argument:
     apply(root, { "*": ["anodisedGreen", 0x4b5a32] }) for a material-less GLB. */
  out.apply = (root, table = BY_NAME) => {
    const made = new Map(), unmapped = new Set();
    const swap = (src) => {
      const hit = table[src.name] ?? table["*"];
      if (hit == null) { unmapped.add(src.name); return src; }
      if (!made.has(src)) {
        const [name, arg, extra] = Array.isArray(hit) ? hit : [hit];   // extra: build options, e.g. { slope }
        const lent = LENDS[name], own = arg !== undefined ? arg : lent ? src[lent] : undefined;
        const m = build(name, own, { map: lent ? src.map : null, ...extra });
        m.name = src.name;
        made.set(src, m);
      }
      return made.get(src);
    };
    root.traverse((o) => {
      if (o.isMesh && o.material) o.material = Array.isArray(o.material) ? o.material.map(swap) : swap(o.material);
    });
    return { unmapped: [...unmapped] };
  };
  return out;
}

/* Printed layer lines: FDM stacks beads along the print axis, so the wall of
   a part is a ladder of shallow ridges and a top face (normal along the
   axis) shows none. Both fall out of one rule: tilt the normal along the
   slope of the axis across the surface, by a cosine of the layer phase.
   Bump only, in the fragment shader; nothing is added to the geometry.
   `layer` is in model units (the GLBs are in metres: 0.2 mm = 0.0002).
   `axis` is the part's local print axis; local Z, unless the exporter turned it.
   A merged model has lost its parts' frames, so it carries the height itself:
   the glTF attribute `_PRINTZ` (three's GLTFLoader names it `_printz`) is each
   vertex's height in metres along its ORIGINAL part's print axis, bed = 0. The
   phase reads it when the mesh being drawn has it and falls back to
   dot(position, axis) when it does not, so geometry without it is unchanged.
   The material finds out per draw (onBeforeRender), because one material can
   be shared by a merged mesh and a per-part one.
   Past about 2 px a layer the lines are below the pixel grid: they fade by
   fwidth instead of shimmering, so a card shows a clean satin and only a
   close hero shows the print. */
function printLines(THREE, m, { layer, slope, axis }) {
  let has = null, want = 0;   // want: what the mesh being drawn needs; has: the compiled uniform
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, {
      uLayer: { value: layer },
      uLayerSlope: { value: slope },
      uLayerAxis: { value: new THREE.Vector3(...axis).normalize() },
      uHasPrintZ: { value: want },
    });
    has = sh.uniforms.uHasPrintZ;
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", "#include <common>\nuniform vec3 uLayerAxis;\nvarying float vLayerPh;\nvarying vec3 vLayerUp;\nuniform float uLayer;\nuniform float uHasPrintZ;\nattribute float _printz;")
      .replace("#include <begin_vertex>", `#include <begin_vertex>
        vLayerPh = (uHasPrintZ > 0.5 ? _printz : dot(position, uLayerAxis)) / uLayer;
        vLayerUp = normalize(mat3(modelViewMatrix) * uLayerAxis);`);
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", "#include <common>\nuniform float uLayerSlope;\nvarying float vLayerPh;\nvarying vec3 vLayerUp;")
      .replace("#include <normal_fragment_maps>", `#include <normal_fragment_maps>
        {
          float lyr = floor(vLayerPh);
          float lineAmp = uLayerSlope * (0.7 + 0.6 * fract(sin(lyr * 12.9898) * 43758.5453)) * (1.0 - smoothstep(0.2, 0.5, fwidth(vLayerPh)));   // a bead is never quite its neighbour
          vec3 lineUp = normalize(vLayerUp);
          normal = normalize(normal - lineAmp * cos(6.2831853 * vLayerPh) * (lineUp - normal * dot(lineUp, normal)));
        }`);
  };
  m.onBeforeRender = (renderer, scene, camera, geometry) => {   // runs before the draw's program is bound, so the first frame is right too
    want = geometry && geometry.attributes && geometry.attributes._printz ? 1 : 0;
    if (has && has.value !== want) { has.value = want; m.uniformsNeedUpdate = true; }
  };
  m.customProgramCacheKey = () => "studio-printLines";
}

/* Fine surface grain (bead blast, PBT): roughness only, value noise on the
   part's local position, a cell about 0.2 mm. It fades by fwidth like the
   print lines, so a card is a clean satin and only a close hero shows it.
   Scale and strength are uniforms: every grained preset shares one program. */
function grain(THREE, m, { scale, rough }) {
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, { uGrainScale: { value: scale }, uGrainRough: { value: rough } });
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vGrainP;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvGrainP = position;");
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", `#include <common>
        uniform float uGrainScale, uGrainRough;
        varying vec3 vGrainP;
        float gh(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
        float gn(vec3 p) {
          vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
          return mix(mix(mix(gh(i), gh(i + vec3(1,0,0)), f.x), mix(gh(i + vec3(0,1,0)), gh(i + vec3(1,1,0)), f.x), f.y),
                     mix(mix(gh(i + vec3(0,0,1)), gh(i + vec3(1,0,1)), f.x), mix(gh(i + vec3(0,1,1)), gh(i + vec3(1,1,1)), f.x), f.y), f.z);
        }`)
      .replace("#include <roughnessmap_fragment>", `#include <roughnessmap_fragment>
        roughnessFactor = clamp(roughnessFactor + (gn(vGrainP * uGrainScale) - 0.5) * uGrainRough * (1.0 - smoothstep(0.4, 1.0, fwidth(vGrainP.x * uGrainScale))), 0.04, 1.0);`);
  };
  m.customProgramCacheKey = () => "studio-grain";
}

/* A per-object copy of a finished material (a key's own emissive, a fade): clone() drops onBeforeCompile and
   customProgramCacheKey, so a plain clone loses its grain and the Neutral curve. This keeps both, and the copy
   compiles to the same program. Not for a printed part: its layer lines track the drawn mesh per material. */
export function copy(m) {
  const c = m.clone();
  c.onBeforeCompile = m.onBeforeCompile;
  c.customProgramCacheKey = m.customProgramCacheKey;
  if (toned.has(m)) toned.add(c);
  return c;
}

/* ---------------- fit ---------------- */

const SKIP = /glow|halo|haze/;   // a finish's light, not the object: never sizes or frames a model

/* World box of everything with geometry but a finish's light. Each local box
   is carried into world space, as Box3.setFromObject does, so a merged model
   (vertices baked into root space) gets a tight box and the explosions' raw
   nodes keep their loose one. */
export function modelBox(THREE, root, box = new THREE.Box3()) {
  box.makeEmpty();
  root.updateWorldMatrix(true, true);
  const b = new THREE.Box3();
  root.traverse((o) => {
    if (!o.geometry || SKIP.test(o.name)) return;
    if (o.boundingBox !== undefined) { if (o.boundingBox === null) o.computeBoundingBox(); b.copy(o.boundingBox); }
    else { if (!o.geometry.boundingBox) o.geometry.computeBoundingBox(); b.copy(o.geometry.boundingBox); }
    box.union(b.applyMatrix4(o.matrixWorld));
  });
  return box;
}

/* fitModelToSize's contract, on modelBox: recentre on the box and scale the
   longest edge to `size`. Returns the box. */
export function fit(THREE, root, size) {
  const box = modelBox(THREE, root), s = new THREE.Vector3(), c = new THREE.Vector3();
  box.getSize(s); box.getCenter(c);
  const k = size / (Math.max(s.x, s.y, s.z) || 1);
  root.position.sub(c.multiplyScalar(k));
  root.scale.multiplyScalar(k);
  return box;
}

/* ---------------- the rig dress ---------------- */

/* A constant light set, so a hover swap in the handoff rig never recompiles:
   r160 counts a light at intensity 0. The room does the lighting; a logo gets
   an ambient fill (colour first), the Wafer an edge light from behind-left and
   one key in the site's own direction. */
export function lights(THREE, scene) {
  const ambient = new THREE.AmbientLight(0xffffff, 0);
  const rim = new THREE.DirectionalLight(0xdfe8ff, 0); rim.position.set(-3.2, 2.2, -3.0);
  const key = new THREE.DirectionalLight(0xffffff, 0); key.position.set(2.5, 3.4, 2.6);
  scene.add(ambient, rim, key);
  /* field 0..1 mixes toward the field's dress (FIELD_AMBIENT, no key, no rim): the handoff starts as the card it lifts off.
     sweep 0..1 is an arrival beat for a look with no beat of its own: the key crosses the model left to right and swells
     on the way, so the finish catches one glint. -1 is no sweep. */
  return { set(lk, field = 0, sweep = -1) {
    const k = 1 - field, on = sweep >= 0 && sweep <= 1;
    ambient.intensity = (lk.kind === "logo" ? 0.8 : 0) * k + FIELD_AMBIENT * field;
    rim.intensity = (lk.rim || 0) * k;
    key.intensity = (lk.key || 0) * k + (on ? SWEEP.key * Math.sin(Math.PI * sweep) : 0);
    key.position.set(on ? SWEEP.x0 + (SWEEP.x1 - SWEEP.x0) * sweep : 2.5, 3.4, 2.6);
  } };
}
const SWEEP = { key: 3.0, x0: -5.0, x1: 5.0 };


/* ---------------- merge: one draw per material on the static tiers ---------------- */

const MERGED = new WeakMap();   // first source geometry -> Map(material name -> merged geometry). Immutable, shared, never disposed.

/* Every mesh of one material becomes one float mesh in root space. root must
   be un-parented and at identity (finish runs before the fit). The geometry
   is memoised per page, so every clone of a model shares it. A material whose
   meshes disagree on their attributes is left as it is. */
export function merge(THREE, root) {
  root.updateMatrixWorld(true);
  const groups = new Map();
  root.traverse((o) => { if (o.isMesh && !o.isInstancedMesh && o.material && !Array.isArray(o.material)) (groups.get(o.material) || groups.set(o.material, []).get(o.material)).push(o); });
  for (const [material, meshes] of groups) {
    const layout = (g) => Object.keys(g.attributes).sort().join();
    if (meshes.some((m) => layout(m.geometry) !== layout(meshes[0].geometry))) continue;   // mixed layouts stay as they are
    const first = meshes[0].geometry, memo = MERGED.get(first) || MERGED.set(first, new Map()).get(first);
    let g = memo.get(material.name);
    if (!g) memo.set(material.name, (g = bake(THREE, meshes)));
    meshes.forEach((m) => m.removeFromParent());
    const out = new THREE.Mesh(g, material);
    out.name = material.name;
    root.add(out);
  }
}

/* Meshes into one float geometry in root space: positions by matrixWorld,
   normals by its normal matrix, every other attribute read component by
   component (a quantised attribute comes back denormalised; r160's
   interleaved attributes, which meshopt hands out, have getX..getW but no
   getComponent), the winding swapped where a matrix mirrors. */
const GET = ["getX", "getY", "getZ", "getW"];
function bake(THREE, meshes) {
  const names = Object.keys(meshes[0].geometry.attributes);
  const count = meshes.reduce((n, m) => n + m.geometry.attributes.position.count, 0);
  const tris = meshes.reduce((n, m) => n + (m.geometry.index ? m.geometry.index.count : m.geometry.attributes.position.count), 0);
  const data = Object.fromEntries(names.map((k) => [k, new Float32Array(count * meshes[0].geometry.attributes[k].itemSize)]));
  const index = count > 65535 ? new Uint32Array(tris) : new Uint16Array(tris);
  const v = new THREE.Vector3(), nm = new THREE.Matrix3();
  let base = 0, at = 0;
  for (const mesh of meshes) {
    const g = mesh.geometry, n = g.attributes.position.count, M = mesh.matrixWorld;
    nm.getNormalMatrix(M);
    for (const k of names) {
      const a = g.attributes[k], out = data[k], w = a.itemSize;
      for (let i = 0; i < n; i++) {
        if (k === "position") v.fromBufferAttribute(a, i).applyMatrix4(M).toArray(out, (base + i) * 3);
        else if (k === "normal") v.fromBufferAttribute(a, i).applyMatrix3(nm).normalize().toArray(out, (base + i) * 3);
        else for (let c = 0; c < w; c++) out[(base + i) * w + c] = a[GET[c]](i);
      }
    }
    const flip = M.determinant() < 0, src = g.index, m = src ? src.count : n;
    for (let i = 0; i < m; i++) {
      const j = flip && i % 3 ? (i % 3 === 1 ? i + 1 : i - 1) : i;   // keep the winding when a part is mirrored
      index[at + i] = base + (src ? src.getX(j) : j);
    }
    base += n; at += m;
  }
  const out = new THREE.BufferGeometry();
  for (const k of names) out.setAttribute(k, new THREE.BufferAttribute(data[k], meshes[0].geometry.attributes[k].itemSize));
  out.setIndex(new THREE.BufferAttribute(index, 1));
  out.computeBoundingBox();
  out.computeBoundingSphere();
  return out;
}

/* ---------------- the hardware finishes ---------------- */

const each = (root, fn) => root.traverse((o) => { if (o.isMesh && o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => fn(m, o)); });

const radial = (THREE, size, stops) => {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d"), r = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  stops.forEach(([t, a]) => r.addColorStop(t, `rgba(255,${40 + 60 * (1 - a) | 0},${30 + 40 * (1 - a) | 0},${a})`));
  g.fillStyle = r; g.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
};

/* Additive colour that leaves the canvas alpha alone: plain AdditiveBlending
   raises it, and an alpha canvas shows a square. */
const ADD = (THREE) => ({ transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendSrc: THREE.SrcAlphaFactor, blendDst: THREE.OneFactor, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor });

/* Venovisor: eight 5 mm diffused LEDs on a ring round the C. The lens domes wear led-red (emissive), and light leaves the back face
   (-Z) as a soft red cloud. Static and cheap: one plane carrying every halo and the patch of light on whatever the C is held to, one
   billboard of haze at the centre. No light object, nothing that casts a shadow. Both are additive and depth-tested, so the body
   hides them and the C's opening shows them. Everything is placed from the led-N nodes and the case's ledRing extras, which are the
   same for every clone: the placement and both textures are worked out once per page. */
let GLOW = null;
function venovisorGlow(THREE, root, tier) {
  if (!GLOW) {
    // the merged model has one node, "body", in the assembly frame; the per-part build (--parts) keeps "case" in its print frame. Either way the ring's centre is a point in that node's frame.
    const leds = [], caseNode = root.getObjectByName("body") || root.getObjectByName("case"), ring = caseNode.userData.ledRing;
    root.traverse((o) => { if (/^led-\d+$/.test(o.name)) leds.push(o); });
    root.updateMatrixWorld(true);
    const centre = caseNode.localToWorld(new THREE.Vector3(ring.centreM[0], ring.centreM[1], ring.centreM[2] ?? 0));
    const at = leds.map((l) => l.getWorldPosition(new THREE.Vector3()));
    const backZ = Math.min(...at.map((p) => p.z));   // the back face: LEDs sit on it, +Z of each node points out of it (-Z in the model)
    const S = ring.radiusM * 4.2, N = 256, c = document.createElement("canvas");
    c.width = c.height = N;
    const g = c.getContext("2d");
    g.fillStyle = "#000"; g.fillRect(0, 0, N, N);
    g.globalCompositeOperation = "lighter";
    const px = (x) => (0.5 - (x - centre.x) / S) * N, py = (y) => (0.5 - (y - centre.y) / S) * N;   // the plane faces -Z, so its u runs against model x
    const blob = (x, y, r, a, hot = false) => {
      const k = g.createRadialGradient(px(x), py(y), 0, px(x), py(y), (r / S) * N);
      // the photo's glow is a pink-white core with red falloff: a hot lens has a white-pink heart, the patch is red all through
      if (hot) { k.addColorStop(0, `rgba(255,225,220,${a})`); k.addColorStop(0.12, `rgba(255,120,100,${a * 0.85})`); }
      else k.addColorStop(0, `rgba(255,70,50,${a})`);
      k.addColorStop(hot ? 0.35 : 0.3, `rgba(255,24,14,${a * 0.4})`); k.addColorStop(1, "rgba(255,0,0,0)");
      g.fillStyle = k; g.fillRect(0, 0, N, N);
    };
    blob(centre.x, centre.y, ring.radiusM * 1.75, 0.2);
    blob(centre.x, centre.y, ring.radiusM * 0.9, 0.22, true);                         // the patch on the surface it is held to
    for (const p of at) blob(p.x, p.y, 0.0064, 0.95, true);                           // a halo round each lens
    const map = new THREE.CanvasTexture(c);
    map.colorSpace = THREE.SRGBColorSpace;
    GLOW = { S, centre, backZ, ring, planeGeometry: new THREE.PlaneGeometry(S, S).rotateY(Math.PI), map, hazeMap: radial(THREE, 128, [[0, 0.3], [0.4, 0.08], [1, 0]]) };
  }
  const { centre, backZ, ring } = GLOW, add = { ...ADD(THREE), side: THREE.FrontSide };   // the plane faces -Z: from the front it is culled, so the open C shows no glow behind it
  const plane = new THREE.Mesh(GLOW.planeGeometry, new THREE.MeshBasicMaterial({ map: GLOW.map, ...add }));
  plane.position.set(centre.x, centre.y, backZ - 0.0009);
  plane.name = "led-glow";
  const haze = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW.hazeMap, ...add }));   // a sprite always faces the lens: one pass, not two
  haze.scale.setScalar(ring.radiusM * 3.4);
  haze.position.set(centre.x, centre.y, backZ - 0.006);
  haze.name = "led-haze";
  // a sprite has no side: fade it out as the camera passes round to the front (the glow is on the back face), so it cannot show through the open C
  const nrm = new THREE.Vector3(), toCam = new THREE.Vector3();
  haze.onBeforeRender = (r, s, cam) => {
    plane.getWorldDirection(nrm); haze.getWorldPosition(toCam); toCam.subVectors(cam.position, toCam).normalize();
    haze.material.opacity = Math.min(1, Math.max(0, nrm.dot(toCam) * 4)) * (haze.material.userData.fade ?? 1);
  };
  root.add(plane, haze);
  if (tier === "field") haze.visible = false;   // a card shows the halos and the patch; the billboard is a hero's refinement
}

/* Soft Off: the legend is lit from under the cap, so light reaches the PBT around each stroke and falls off into it. The cap's own
   shader reads a blurred top-down silhouette of the legend (drawn once per page, from the legend mesh) as extra emission. */
let BLEED = null;
function softOffBleed(THREE, root, capMats) {
  if (!BLEED) {
    const legend = [];
    root.traverse((o) => { if (o.isMesh && o.material && o.material.name === "legend-lit") legend.push(o); });
    if (!legend.length) return;
    const box = new THREE.Box3();
    legend.forEach((m) => { m.geometry.computeBoundingBox(); box.union(m.geometry.boundingBox); });
    const size = box.getSize(new THREE.Vector3()), mid = box.getCenter(new THREE.Vector3());
    const N = 256, pad = 1.5, w = Math.max(size.x, size.y) * pad;
    const mk = () => { const k = document.createElement("canvas"); k.width = k.height = N; return k; };
    const sil = mk(), c = mk(), s = sil.getContext("2d"), g = c.getContext("2d");
    s.fillStyle = "#000"; s.fillRect(0, 0, N, N);
    s.fillStyle = "#fff";
    for (const m of legend) {
      const p = m.geometry.attributes.position, idx = m.geometry.index, T = idx ? idx.count : p.count;
      const at = (i) => { const j = idx ? idx.getX(i) : i; return [(0.5 + (p.getX(j) - mid.x) / w) * N, (0.5 - (p.getY(j) - mid.y) / w) * N]; };
      for (let i = 0; i < T; i += 3) { const a = at(i), b = at(i + 1), d = at(i + 2); s.beginPath(); s.moveTo(...a); s.lineTo(...b); s.lineTo(...d); s.closePath(); s.fill(); }
    }
    // the lit stroke itself, softened a little; the same silhouette spread wide is the falloff into the cap
    g.fillStyle = "#000"; g.fillRect(0, 0, N, N);
    g.filter = `blur(${N * 0.03}px)`; g.drawImage(sil, 0, 0);
    g.globalCompositeOperation = "lighter";
    g.filter = `blur(${N * 0.008}px)`; g.drawImage(sil, 0, 0);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.NoColorSpace;
    BLEED = { tex, canvas: c, box: new THREE.Vector3(mid.x, mid.y, w), tint: legend[0].material.emissive.clone() };
  }
  const u = { uBleed: { value: BLEED.tex }, uBleedBox: { value: BLEED.box }, uBleedTint: { value: BLEED.tint } };
  for (const m of capMats) {
    m.userData.bleed = { tex: BLEED.tex, canvas: BLEED.canvas, box: BLEED.box.toArray() };   // a handle for the gallery's checks
    m.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, u);
      sh.vertexShader = sh.vertexShader
        .replace("#include <common>", "#include <common>\nvarying vec3 vBleedP;\nvarying float vBleedUp;")
        .replace("#include <begin_vertex>", "#include <begin_vertex>\nvBleedP = position;\nvBleedUp = objectNormal.z;");
      sh.fragmentShader = sh.fragmentShader
        .replace("#include <common>", "#include <common>\nvarying vec3 vBleedP;\nvarying float vBleedUp;\nuniform sampler2D uBleed;\nuniform vec3 uBleedBox;\nuniform vec3 uBleedTint;")
        .replace("#include <emissivemap_fragment>", `#include <emissivemap_fragment>
          {
            vec2 bl = vec2(0.5 + (vBleedP.x - uBleedBox.x) / uBleedBox.z, 0.5 + (vBleedP.y - uBleedBox.y) / uBleedBox.z);   // the canvas texture is flipped in y: v 1 is its top row
            totalEmissiveRadiance += uBleedTint * texture2D(uBleed, bl).r * smoothstep(0.4, 0.9, vBleedUp);   // the cap's top face only: the walls are not over the legend
          }`);
    };
    m.customProgramCacheKey = () => "studio-softoff-bleed";
    m.needsUpdate = true;
  }
}

/* Ci-Clop: two 5 mm LED domes in the front holes, red and white (nodes led-red / led-white at the apexes, +Z out). led = off | subtle | on.
   The dome is emissive; the halo is one additive sprite per LED, faded out as the camera leaves the front so it cannot show through the body. No light, no shadow. */
export const LED_MODES = { off: { e: 0, a: 0, s: 0 }, subtle: { e: 2.2, a: 0.9, s: 7 }, on: { e: 3.2, a: 1, s: 12 } };   // e matches the Venovisor lens (2.2): a lit LED blooms, it does not merely tint
const HALO = {};   // tint -> texture, once per page
function ciclopLeds(THREE, root, mode) {
  const L = LED_MODES[mode] || LED_MODES.subtle;
  each(root, (m) => { if (m.name === "led-red" || m.name === "led-white") { m.emissiveIntensity = L.e * (m.name === "led-red" ? 2.2 : 1); m.toneMapped = false; } });   // the dome IS the light: untonemapped so it clips to its colour; red carries ~1/5 of white's luminance, so it gets more
  if (!L.a) return;
  const tint = { "led-red": [255, 22, 12], "led-white": [200, 225, 255] };   // a saturated red and a cool white read apart through the bloom; a warm white melted into the olive
  for (const name of Object.keys(tint)) {
    const node = root.getObjectByName(name);
    if (!node) continue;
    if (!HALO[name]) {
      const c = document.createElement("canvas"); c.width = c.height = 64;
      const g = c.getContext("2d"), k = g.createRadialGradient(32, 32, 0, 32, 32, 32), [r, gg, b] = tint[name];
      k.addColorStop(0, `rgba(${r},${gg},${b},0.35)`); k.addColorStop(0.14, `rgba(${r},${gg},${b},0.6)`); k.addColorStop(0.22, `rgba(${r},${gg},${b},0.45)`); k.addColorStop(0.45, `rgba(${r},${gg},${b},0.18)`); k.addColorStop(0.75, `rgba(${r},${gg},${b},0.05)`); k.addColorStop(1, `rgba(${r},${gg},${b},0)`);   // dim over the dome, brightest at its rim, falling to nothing at the edge: the glow surrounds the LED instead of covering it
      g.fillStyle = "#000"; g.fillRect(0, 0, 64, 64);   // opaque black under the glow, as venovisorGlow does: additive black adds nothing, where a transparent edge left a faint square
      g.globalCompositeOperation = "lighter"; g.fillStyle = k; g.fillRect(0, 0, 64, 64);
      HALO[name] = new THREE.CanvasTexture(c); HALO[name].colorSpace = THREE.SRGBColorSpace;
    }
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: HALO[name], ...ADD(THREE), depthTest: false, opacity: L.a }));
    halo.scale.setScalar(0.005 * L.s);   // the dome is 5 mm across
    halo.position.set(0, 0, 0.0002);     // on the dome itself, so the light reads as the LED and not a disc floating in front of it
    halo.name = name + "-halo";
    const nrm = new THREE.Vector3(), to = new THREE.Vector3();
    halo.onBeforeRender = (r2, s, cam) => {
      node.getWorldDirection(nrm); halo.getWorldPosition(to); to.subVectors(cam.position, to).normalize();
      const f = Math.max(0, nrm.dot(to)); halo.material.opacity = L.a * (name === "led-red" ? 1.5 : 1) * f * f * (halo.material.userData.fade ?? 1);   // falls off quickly at an angle: a flat sprite seen sideways would read as a sticker
    };
    node.add(halo);
  }
}

/* A sealed or lab GLB: presets by material name, then the finish its look names. Returns the names no table knows. */
function finishGlb(THREE, root, lk, tier) {
  const base = lk.kind === "logo" ? LOGO_STAGE : HW_STAGE;
  const P = presets(THREE, lk.env ? { mat: { ...base.mat, env: lk.env } } : base);
  switch (lk.finish) {
    case "venovisor": {
      // sampled from public/media/venovisor/{delivered,in-use}.webp, white-balanced against the paper and the grey surfaces (see lab/tools/venovisor-build.mjs)
      const { unmapped } = P.apply(root, {
        "tpu-olive": ["tpuPrinted", VENO_OLIVE], "tpu-button": ["tpuPrinted", "#b09070"], "led-red": ["emissiveLegend", "#ff2a1c"],
      });
      each(root, (m) => { if (m.name === "led-red") m.emissiveIntensity = 2.2; });   // an LED, not a legend: the effect owns its strength (the lens core is meant to walk toward pink-white)
      venovisorGlow(THREE, root, tier);
      return unmapped;
    }
    case "ciclop": {
      const { unmapped } = P.apply(root, { "pla-olive": ["tpuPrinted", "#6f765a", { slope: 0.11 }], "lens-clear": ["lensClear"], "led-red": ["emissiveLegend", "#ff2a1c"], "led-white": ["emissiveLegend", "#e8f0ff"] });
      ciclopLeds(THREE, root, lk.led);
      return unmapped;
    }
    case "softoff": {
      const { unmapped } = P.apply(root);
      const caps = [];
      each(root, (m) => { if (m.name === "keycap-charcoal") caps.push(m); });
      softOffBleed(THREE, root, caps);
      return unmapped;
    }
    default: {
      if (lk.kind !== "logo") return P.apply(root, lk.table).unmapped;
      const all = lk.table || BY_NAME, metal = new Set(METALS.flatMap((m) => m.names));
      const only = (want) => Object.fromEntries(Object.entries(all).filter(([k]) => (k === "*" ? want === "rest" : want === "rest" ? !metal.has(k) : want.includes(k))));
      P.apply(root, only("rest"));
      for (const m of METALS) presets(THREE, m.stage).apply(root, only(m.names));
      const names = new Set();
      each(root, (m) => names.add(m.name));
      return [...names].filter((n) => !(n in all) && !("*" in all));   // a name neither table knows
    }
  }
}

/* ---------------- the Wafer ---------------- */

/* models/wafer.glb is built by tools/wafer/build.mjs from models/wafer_parts/: one node per part, named like the files, the keys
   sharing one mesh, normals creased offline, the palettes as node extras and the two MIP panels as lid nodes over their displays.
   What each part IS:
     case        black anodised aluminium     anodisedBlack
     caps        blank PBT                    pbtCap
     plate/pods  dyed SLS nylon               nylonCap
     switches    milky POM + stainless        the palette in its extras
     display     module PCB, glass, MIP       the palette, under glass
     screen      the two panels, drawn once   mipGlass carrying its own pixels
     usb-c, mcu  steel / gold by CAD colour   brushedPearl */
const PART = /^(case|plate|pcb|usbc|switches|display|antenna|softoff|screen)_[LR]$|^mcu$|^key_[LR]_(r[0-2]c[0-4]|t[0-2])$/;
const kindOf = (name) => (name.startsWith("key_") ? "key" : name.replace(/_[LR]$/, ""));

/* A part that indexes a 4-texel-per-entry strip (the CAD appearances) gets a strip that says what each entry is made of. The two
   strips are per part and shared by every clone on the page. */
const PALETTES = new Map();
function paletteMaterial(THREE, name, entries, look = {}) {
  if (!PALETTES.has(name)) {
    const n = entries.length, col = new Uint8Array(n * 4), rm = new Uint8Array(n * 4);
    entries.forEach(([hex, rough, metal], i) => {
      const v = parseInt(hex.slice(1), 16);
      col.set([(v >> 16) & 255, (v >> 8) & 255, v & 255, 255], i * 4);
      rm.set([0, Math.round(rough * 255), Math.round(metal * 255), 255], i * 4);
    });
    const map = new THREE.DataTexture(col, n, 1);
    map.colorSpace = THREE.SRGBColorSpace;
    map.needsUpdate = true;
    const rmMap = new THREE.DataTexture(rm, n, 1);
    rmMap.needsUpdate = true;
    PALETTES.set(name, { map, rmMap });
  }
  const { map, rmMap } = PALETTES.get(name);
  return new THREE.MeshPhysicalMaterial({ map, roughnessMap: rmMap, metalnessMap: rmMap, roughness: 1, metalness: 1, ...look });
}

/* The nice!view panel: reflective, 1-bit, drawn once offline. It carries its own pixels (#A3A3A3 on, #0C0C0C off), so the
   preset's tint would grey them twice; on the void the room alone leaves it a dark glass, so the lit pixels carry a little of
   their own. */
function panel(P, tex) {
  tex.anisotropy = 16;
  const m = P.mipGlass(undefined, { map: tex });
  m.color.setRGB(1, 1, 1);
  m.emissive.setRGB(1, 1, 1); m.emissiveMap = tex; m.emissiveIntensity = 0.45;
  return m;
}

/* The PCB artwork, for the two explosions only: the closed product shows a bare board. Decoded offline from the parts' KTX2 maps,
   so the site needs no transcoder. Loaded once per page; a failed fetch is a bare board, never an error. */
let PCB = null;
export function pcbMaps(THREE) {
  const load = (side) => new Promise((resolve) => new THREE.TextureLoader().load(`models/wafer-pcb-${side}.webp`, (tex) => {
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.flipY = false;                                          // glTF's UV convention: v 0 is the image's top row
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;               // the parts' own sampler
    resolve(tex);
  }, undefined, () => resolve(null)));
  return PCB || (PCB = Promise.all([load("L"), load("R")]).then(([pcb_L, pcb_R]) => ({ pcb_L, pcb_R })));
}

/* One material per look per call. tier "parts" keeps the 53 nodes for the explosions; every other tier merges by material. */
function wafer(THREE, root, tier, pcb) {
  const P = presets(THREE, HW_STAGE), made = new Map();
  const get = (key, mk) => { if (!made.has(key)) { const m = mk(); m.name = "wafer:" + key; made.set(key, m); } return made.get(key); };
  const part = (o) => { while (o && !PART.test(o.name)) o = o.parent; return o; };
  const meshes = [];
  root.updateMatrixWorld(true);
  root.traverse((o) => { if (o.isMesh) meshes.push(o); });
  for (const o of meshes) {
    const p = part(o);
    if (!p) continue;
    const name = p.name;
    switch (kindOf(name)) {
      case "case": o.material = get("case", () => P.anodisedBlack(undefined, { grain: false })); break;   // its cells are sub-pixel at every site scale: same pixels, one program less
      // PLAY DEMO comes close enough for the PBT's grain; the closed tiers never do. The keys are quantised, so position counts
      // integer steps, not metres: the cell is scaled by the mesh's size in the file to stay 0.17 mm.
      case "key": o.material = get("key", () => P.pbtCap(undefined, { grain: tier === "parts" && { scale: PRESETS.pbtCap.grain.scale * o.matrixWorld.getMaxScaleOnAxis() } })); break;
      case "plate": case "softoff": o.material = get("nylon", () => P.nylonCap()); break;
      case "antenna": o.material = get("black", () => P.matteBlack()); break;
      case "pcb": o.material = pcb && pcb[name] ? get(name, () => P.soldermask(pcb[name])) : get("mask", () => P.soldermask()); break;   // the study re-inks the mask near black (it sits 4 mm down a slot): a bare board, unless an explosion exposes the artwork
      case "switches": o.material = get(name, () => paletteMaterial(THREE, name, p.userData.palette)); break;
      case "display": o.material = get(name, () => paletteMaterial(THREE, name, p.userData.palette, { clearcoat: 1, clearcoatRoughness: 0.05 })); break;
      case "screen": o.material = get(name, () => panel(P, o.material.map)); break;
      default: {   // usb-c and the MCU ship CAD appearances named by colour
        const c = o.material.color;
        if (c.r > 0.4 && c.r >= c.g && c.b < 0.1) o.material = get("gold", () => P.brushedPearl("#ffc254"));
        else o.material = luma(c) > 0.2 ? get("pearl", () => P.brushedPearl("#c9cbce")) : get("black", () => P.matteBlack());
      }
    }
  }
  if (tier !== "parts") merge(THREE, root);   // 62 meshes -> 13
}

/* ---------------- looks: the per-model finish, keyed by the URL every consumer already holds ---------------- */

/* Look = { kind: "logo" | "hardware" | "wafer" | "procedural", ev?, env?, rim?, key?,
            finish?: "venovisor" | "ciclop" | "softoff", led?: "off" | "subtle" | "on", table?, merge? }
   ev is the exposure in stops, env the room's strength for a hardware model, rim and key the rig's two
   analytic lights. Framing (fit, pose) is not a look: it stays in the registries. */
export const WAFER_URL = "models/wafer.glb";
export const LOOKS = {
  "models/wafer.glb":                { kind: "wafer", rim: 2.2, key: 2.5 },   // black anodised on the void: an edge light from behind-left, and one key to lift the facets (3 clips the left half's edges)
  "models/ci-clop-mark.glb":         { kind: "logo", ev: 0.3, finish: "ciclop", led: "subtle" },   // olive reads near-black under Neutral: +0.3 EV
  "models/venovisor-mark.glb":       { kind: "hardware", ev: 0.5, env: 0.55, finish: "venovisor" },   // a satin pale body burns to cream in the full room
  "models/keyboard-display.opt.glb": { kind: "hardware" },
  "models/soft-off-keycap.opt.glb":  { kind: "hardware", finish: "softoff" },
  "models/bulgaria-mark.glb":        { kind: "logo", table: { ...BY_NAME, "tile-navy": ["matteBlack", "#0a1724"] } },   // the sealed tile is metalness 0.7: as enamel it is grey glass
  "models/zmk-mark.glb":             { kind: "logo", merge: true },
  "models/sightseeing-mark.glb":     { kind: "logo", merge: true },
};
const LOGO = { kind: "logo" };                                         // iskra, wafer-mark, silent-depth, brionel
export const PROCEDURAL = { kind: "procedural", rim: 2.2, key: 2.5 };  // keepMaterials heroes: Kerfur, the node proxy
export const look = (url) => (url ? LOOKS[url] || LOGO : PROCEDURAL);

/* finish(THREE, root, url, { tier, pcb }) — the whole material pass for one fresh, un-parented, identity clone.
   tier "rig" (hero, handoff), "field" (Universe card, menu), "parts" (the Wafer explosions: nodes kept, no merge).
   pcb is pcbMaps()'s result, for the explosions. Returns the materials it MADE (the caller owns and disposes them;
   it never disposes textures or geometry: those are the loader's or this module's, shared, and live for the page). */
const WARNED = new Set();
export function finish(THREE, root, url, { tier = "rig", pcb = null } = {}) {
  const lk = look(url), u = exposure(lk.ev), before = new Set();
  root.traverse((o) => { for (const m of [].concat(o.material || [])) before.add(m); });
  if (lk.kind === "wafer") wafer(THREE, root, tier, pcb);
  else {
    const unmapped = finishGlb(THREE, root, lk, tier);
    // an unmapped material is the loader's, shared by every clone of this URL: tone() below and a card fade would change them all
    if (unmapped.length && !WARNED.has(url)) { WARNED.add(url); console.warn(`[studio] ${url}: no preset for ${unmapped.join(", ")}`); }
  }
  if (lk.merge && tier !== "parts") merge(THREE, root);
  const materials = new Set();
  root.traverse((o) => { for (const m of [].concat(o.material || [])) { if (!m) continue; tone(m, u); if (!before.has(m)) materials.add(m); } });
  return { look: lk, materials, exposure: u };
}
