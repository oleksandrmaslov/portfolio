# Port spec: the approved NEW model look on the public site

Repo: `/home/oleksandr/projects/Portfolio-workspace/portfolio` (paths below are repo-relative).
Scratch: `PORT=/home/oleksandr/projects/Portfolio-workspace/portfolio/lab/port`.
Preview server: `http://127.0.0.1:8765/` (already running; never start another on that port).
three r160 everywhere (import map → unpkg). No commits. No public route renamed.

The look is the lab gallery default (`lab/materials.html`, pipe NEW, PBR Neutral). Owner decisions 1–7 are
fixed and are not repeated here except where they set a number. Section 0 lists the defaults this spec chose
for everything the decisions left open.

---------------------------------------------------------------------------------------------------------

## 0. Defaults chosen (non-blocking; each is reversible)

| Open point | Chosen | Why |
|---|---|---|
| Where tone mapping happens | **Inside every model material** (`MOStudio.tone`), never on a renderer, never by patching `THREE.ShaderChunk` | The Universe draws through an EffectComposer into a render target, where three switches tone mapping off and r160 `OutputPass` has no custom branch. In-material Neutral is the only way the field gets the curve without touching cards, dust, stars, void, DoF, CA or vignette, and it makes the hero, handoff, field, menu, board and demo run the exact same shader code. `useNeutral` (global chunk patch) is deleted from the site. |
| Kerfur hero, node proxy | Keep their own materials (`keepMaterials`), get the studio room, the Neutral hook and the `PROCEDURAL` dress (rim 2.2 + key 2.5, the Wafer's) | "One studio, one curve" (decision 1); Kerfur stays procedural (decision 5). Its face is `toneMapped:false` and is unchanged. Screenshot it; tune `PROCEDURAL.ev` only. |
| Rig renderer `toneMapping` | Left at ACES 1.18, untouched | It now reaches only un-finished line/point materials (the proxy's lines, motes). Every model material ignores it. |
| Menu dress | Field dress everywhere: FIELD_ROOM env (fill 4, 128 cube) + `FIELD_AMBIENT` 1.0; tone hook on the models AND the procedural output switch | One menu look on every route. Project pages build that field env lazily on first menu open (+1.5 MB, named in §7). |
| Ci-Clop menu pose | No `menuPose`; falls back to the new `rigPose` (three-quarter, LED face) | `cardPose.pose` is gone (the file is upright). |
| PCB artwork in the explosions | Dropped. Bare soldermask everywhere, explosions included | "Same materials" (decision 2). Removes every KTX2 asset from the site. |
| Explosion framing | Unchanged: loose boxes on the raw part nodes, exactly as today | Explosions must behave exactly as now. |
| Static-tier Wafer draw calls | Merge by material at load (memoised per page): 62 → 13 draws | Perf item 5. |
| ZMK / Sightseeing | Same merge helper (`merge: true` in their look): 49 → 2, 13 → 3 draws | Perf item 5/7; no sealed edit. Sightseeing is gated on the gallery diff (§9.3). |
| Venovisor glow canvas | 256², module-cached and shared by every instance, alpha-preserving `CustomBlending` | Perf item 10; fixes the black square on `alpha:true` canvases. Gated on the gallery diff; revert to 512² (still shared) if it fails. |
| Grain on the Wafer | Off (`{ grain: false }`) | Its cells are sub-pixel at every site scale, so `fwidth` multiplies it to zero: same pixels, fewer programs. |
| Grain program key | One key `studio-grain` (scale/rough become uniforms) | Perf item 4: same pixels, −2 programs. |
| Lab gallery OLD pipe, ACES toggle, compare view, tuning URL knobs | Retired. The gallery renders NEW only, from site code; `led`, `tier`, `model`, `grid`, `spin`, `yaw`, `dpr`, `aa`, `perf` stay | "Today's site" after the port IS the new look; the OLD pipe would need wafer_demo, the old Ci-Clop and two deleted helpers. Before-shots in `$PORT/before`, `$PORT/gallery-before` and `perf-before.json` are the record. |
| `lab/wafer.js` (the study) | **Not edited.** Keeps its 53 files, its own renderer, materials and `fromScene` room. Its `./studio.js` import keeps working: `lab/studio.js` becomes the study's thin module that takes TONE, NEUTRAL_GLSL, ROOM and `studioRoom` from the site | No second copy of the curve or the room radiance; zero risk to the accumulation look. |
| Ci-Clop / Kerfur PLAY DEMO scenes | Untouched (own ACES renderers, procedural mocks, no project GLB) | They do not render the project model. |
| Strip punctual lights at load | Not added; a CI test asserts no `models/*.glb` uses `KHR_lights_punctual` | After the Ci-Clop swap no shipped GLB has a light: a check costs 0 bytes, runtime code costs bytes forever. |
| `models/wafer_parts/` on Pages | Excluded from the deploy (`--exclude='models/wafer_parts/'`); files stay in place for the study and the build tool | Nothing deployed reads them after the port (1.14 MB of artifact). |
| Wafer Studio / Bulgaria pose mismatch (page ≠ registry, pre-existing) | Not touched | Outside the port; listed in risks. |

---------------------------------------------------------------------------------------------------------

## 1. Architecture

### 1.1 One home

`app/projects/rendering/studio.js` — a plain **ES module with no imports and no top-level DOM/window access**.
Everything is a function that takes `THREE`, or a plain data constant. It is the single source of:
the void studio room, the PBR Neutral curve, the preset table and `BY_NAME`, the stages, the hardware
finishes, the Wafer assembly, the per-model look table `LOOKS`, the dress (lights), fit, merge and the tone hook.

It is made by **moving** lab code (lab is the approved look) plus a small amount of new glue:

| Moved from | What | Change on the way |
|---|---|---|
| `lab/studio.js` | `TONE`, `NEUTRAL_FN`/`NEUTRAL_GLSL`, the room scene (as `studioRoom`), `PRESETS`, `ARG`, `LENDS`, `BY_NAME`, `luma`, `presets()` (with `apply`), `printLines`, `grain` | room becomes `studioRoom` + `studioEnvironment(size)` via cube camera (§1.3); `build()` honours `opts.grain === false`; grain uses uniforms + one key `studio-grain`. NOT moved: `STAGES.light/.dark`, `DARK`, `DARK_PAGE`, JS `neutral()`, `inverseNeutral()`, `useNeutral()` (lab-only or dead) |
| `lab/materials-models.js` | `HW_STAGE`, `VENO_OLIVE`, `LOGO_STAGE`, `stageOf`, `METALS`, `radial`, `venovisorGlow`, `softOffBleed`, `LED_MODES`, `ciclopLeds`, the body of `finishNew` | stages become `{ mat }` objects (no lab `STAGES.void` spread needed: `presets()` reads only `stage.mat`); URL knobs (`LQ`, `logoenv`, `metalenv`, `olive`) become constants (0.3, 1.8, `VENO_OLIVE`); textures/geometry module-cached (§1.3); glow 256² + CustomBlending; sprite opacity × `material.userData.fade` |
| `lab/materials-wafer.js` | `kindOf`, `paletteMaterial`, `materialFor`, the lid material recipe from `mountScreen` | no `toCreasedNormals`, no `FullScreenQuad`, no `readPalette`, no `mip.js`: those moved offline into `tools/wafer/` (§4). Palette entries come from `node.userData.palette`; lids are nodes in the file |
| `lab/materials.js` | field fill 4, field ambient 1.0, logo ambient 0.8, rim/key placement (`dress`) | become `FIELD_ROOM`, `FIELD_AMBIENT`, `lights()` |

New in `studio.js`: `exposure()`, `tone()`, `studioEnvironment(size)`, `lights()`, `modelBox()`, `fit()`,
`merge()` (+ `bake()`), `LOOKS`, `look()`, `WAFER_URL`, `PROCEDURAL`, `finish()`.

### 1.2 How every bundle gets it (build), load order

`tools/landing-runtime/build.cjs` gains one source kind:

```js
const esm = (file, global) => ({ file, esm: global });
const STUDIO = "app/projects/rendering/studio.js";

// An ES module with no imports, inlined as window[global]. The lab and node import the same file natively.
function emitModule(relativePath, global) {
  const source = readSource(relativePath);
  if (/^\s*import\s/m.test(source)) throw new Error(`${relativePath} must not import: the build inlines it as window.${global}.`);
  const result = Babel.transform(source, {
    filename: relativePath, sourceType: "module", presets: [], plugins: ["transform-modules-commonjs"],
    comments: false, compact: true, minified: true, sourceMaps: false,
  });
  if (!result || typeof result.code !== "string") throw new Error(`Babel returned no output for ${relativePath}.`);
  return `\n/* ---- ${relativePath} ---- */\n(function(exports){${result.code}\n})(window.${global}={});\n`;
}
```

- `buildPageRuntime`: `source.esm ? emitModule(source.file, source.esm) : source.transform ? compile(source.file) : emitClassic(source.file)`.
- Replace every `classic(SOLID_MATERIALS)` (handoffDefinition, standardDefinition, All Projects, Design System, Wafer) with `esm(STUDIO, "MOStudio")`; delete the `SOLID_MATERIALS` const.
- `landingSourceFiles`: insert `"app/projects/rendering/studio.js"` right after `"app/projects/rendering/model-viewer.jsx"`; the landing map becomes `file === STUDIO ? emitModule(file, "MOStudio") : file === "app/shared/menu-renderer.js" ? emitClassic(file) : compile(file)`.
- `handoffDefinition("Venovisor.html", "venovisor")` without `{ projectHandoffRig: true }`; then delete the `options.projectHandoffRig` branch and the `HANDOFF_RIG` const (no caller left; the landing lists the path literally).
- `migratePhase` needs no change: no HTML tag names the studio file.

Load order: on project routes the page bundles are `defer` scripts after the module script, so `window.THREE`
exists when they run; on the landing `runtime.js` runs before THREE and mounts on `mo:three-ready`. The studio
touches nothing at evaluation time, so its position inside a bundle is irrelevant; it sits where
`solid-materials.js` sat. Every bundle that contains `model-viewer.jsx` or `core.jsx`'s menu contains the studio
(the menu renders the Wafer and Ci-Clop on every route). `index.html` drops its unstamped
`<script src="app/projects/rendering/solid-materials.js">` tag: the studio is inside the stamped `runtime.js`,
which closes the cache-busting hole that tag was.

### 1.3 Module contents (new code, exact)

```js
/* ---------------- tone: PBR Neutral, inside the material ---------------- */
export const TONE = Object.freeze({ exposure: 1.0, toe: 1.0 });
const NEUTRAL_FN = /* glsl */ `...verbatim from lab/studio.js...`;
export const NEUTRAL_GLSL = `\n    uniform float uExposure, uToe;${NEUTRAL_FN}`;
const TOE = { value: TONE.toe };
const toned = new WeakSet();   // not userData: Material.copy() copies userData but not onBeforeCompile
export const exposure = (ev = 0) => ({ value: TONE.exposure * 2 ** ev });
/* The renderer never tone-maps a model: the Universe draws into a render target, where three turns tone
   mapping off and r160's OutputPass has no custom curve. So every model material carries Neutral itself, and
   the hero, the handoff, the field, the menu, the board and the demo all run the same shader. A uniform per
   look: one program serves every exposure. Apply it LAST (finish hooks assign onBeforeCompile). A clone loses
   it: call tone() again on any clone. */
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
/* The void studio: the study's dark room lifted by DARK_PAGE (lab/studio.js), so black parts have something to reflect. */
export const ROOM = { wall: 0.05, floor: 0.1, top: 2.0, back: 7.0, key: 8.0, rimL: 16.0, rimR: 20.0, fill: 1.4, side: 3.0 };
export const FIELD_ROOM = { ...ROOM, fill: 4 };   // a card faces the lens: the low front strip lifts flat chrome and enamel
export const FIELD_AMBIENT = 1.0;                 // the field and the menu: fills the diffuse side, adds nothing to a reflection
export function studioRoom(THREE, e) { /* verbatim body of lab studioEnvironment up to env.add(...) of the last panel; returns the Scene */ }
/* Rendered once through a cube camera into a PMREM: no blur pass (sigma 0) and no depth buffer left on the
   result (fromScene keeps a 3 MB one). 256 for a hero, 128 for the field, the board and the menu. The caller
   owns the returned target: use .texture, dispose() it with its renderer. */
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
export const HW_STAGE = { mat: { env: 1, floor: 0.02 } };      // hardware: the void room, black keeps a silhouette
export const LOGO_STAGE = { mat: { env: 0.3, floor: 0.04 } };  // a logo is colour first (lab comment, verbatim)
const stageOf = (env) => ({ mat: { env, floor: 0.04 } });
export const METALS = [
  { names: ["iridescent-chrome"], stage: stageOf(1) },
  { names: ["brushed-pearl", "handle-metal"], stage: stageOf(1.8) },
];
export const VENO_OLIVE = "#8a8560";
// PRESETS, ARG, LENDS, BY_NAME, luma, presets(), printLines() verbatim from lab/studio.js.
// presets().build(): `if (gr && opts.grain !== false) grain(THREE, m, gr);`
// grain(): same maths, numbers as uniforms, one program for every grained preset:
//   vertex   "vGrainP = position;"
//   fragment "uniform float uGrainScale, uGrainRough;" … gn(vGrainP * uGrainScale) … * uGrainRough
//            … fwidth(vGrainP.x * uGrainScale) …
//   Object.assign(sh.uniforms, { uGrainScale: { value: scale }, uGrainRough: { value: rough } });
//   m.customProgramCacheKey = () => "studio-grain";

/* ---------------- fit ---------------- */
const SKIP = /glow|halo|haze/;   // a finish's light, not the object: never sizes or frames a model
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
export function fit(THREE, root, size) {   // fitModelToSize's contract, on modelBox
  const box = modelBox(THREE, root), s = new THREE.Vector3(), c = new THREE.Vector3();
  box.getSize(s); box.getCenter(c);
  const k = size / (Math.max(s.x, s.y, s.z) || 1);
  root.position.sub(c.multiplyScalar(k));
  root.scale.multiplyScalar(k);
  return box;
}

/* ---------------- the rig dress ---------------- */
/* A constant light set, so a hover swap in the handoff rig never recompiles: r160 counts a light at intensity 0. */
export function lights(THREE, scene) {
  const ambient = new THREE.AmbientLight(0xffffff, 0);
  const rim = new THREE.DirectionalLight(0xdfe8ff, 0); rim.position.set(-3.2, 2.2, -3.0);
  const key = new THREE.DirectionalLight(0xffffff, 0); key.position.set(2.5, 3.4, 2.6);
  scene.add(ambient, rim, key);
  return { set(lk) { ambient.intensity = lk.kind === "logo" ? 0.8 : 0; rim.intensity = lk.rim || 0; key.intensity = lk.key || 0; } };
}

/* ---------------- merge: one draw per material on the static tiers ---------------- */
const MERGED = new WeakMap();   // first source geometry -> Map(material name -> merged geometry). Immutable, shared, never disposed.
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
// bake(THREE, meshes): float BufferGeometry in root space. position by matrixWorld, normal by its normal matrix
// (normalised), every other attribute copied with getComponent (quantised attributes come back denormalised),
// indices offset, and the winding swapped for a mesh whose matrixWorld.determinant() < 0. Uint16 index when the
// vertex count fits, else Uint32. computeBoundingBox + computeBoundingSphere. (~40 lines; root must be identity.)

/* ---------------- looks: the per-model finish, keyed by the URL every consumer already holds ---------------- */
export const WAFER_URL = "models/wafer.glb";
export const LOOKS = {
  "models/wafer.glb":                { kind: "wafer", rim: 2.2, key: 2.5 },
  "models/ci-clop-mark.glb":         { kind: "logo", ev: 0.3, finish: "ciclop", led: "subtle" },
  "models/venovisor-mark.glb":       { kind: "hardware", ev: 0.5, env: 0.55, finish: "venovisor" },
  "models/keyboard-display.opt.glb": { kind: "hardware" },
  "models/soft-off-keycap.opt.glb":  { kind: "hardware", finish: "softoff" },
  "models/bulgaria-mark.glb":        { kind: "logo", table: { ...BY_NAME, "tile-navy": ["matteBlack", "#0a1724"] } },
  "models/zmk-mark.glb":             { kind: "logo", merge: true },
  "models/sightseeing-mark.glb":     { kind: "logo", merge: true },
};
const LOGO = { kind: "logo" };                                         // iskra, wafer-mark, silent-depth, brionel
export const PROCEDURAL = { kind: "procedural", rim: 2.2, key: 2.5 };  // keepMaterials heroes: Kerfur, the node proxy
export const look = (url) => (url ? LOOKS[url] || LOGO : PROCEDURAL);

/* finish(THREE, root, url, { tier }) — the whole material pass for one fresh, un-parented, identity clone.
   tier "rig" (hero, handoff), "field" (Universe card, menu), "parts" (the Wafer explosions: nodes kept, no merge).
   Returns the materials it MADE (the caller owns and disposes them; it never disposes textures or geometry:
   those are the loader's or this module's, shared, and live for the page). */
export function finish(THREE, root, url, { tier = "rig" } = {}) {
  const lk = look(url), u = exposure(lk.ev), before = new Set();
  root.traverse((o) => { for (const m of [].concat(o.material || [])) before.add(m); });
  if (lk.kind === "wafer") wafer(THREE, root, tier);
  else finishGlb(THREE, root, lk, tier);   // = lab finishNew's switch, with entry -> lk, ctx.led -> lk.led
  if (lk.merge && tier !== "parts") merge(THREE, root);
  const materials = new Set();
  root.traverse((o) => { for (const m of [].concat(o.material || [])) { if (!m) continue; tone(m, u); if (!before.has(m)) materials.add(m); } });
  return { look: lk, materials, exposure: u };
}
```

Finishes (moved, with these exact changes):

- `venovisorGlow(THREE, root, tier)`: canvas `N = 256`. Compute `{ S, centre, backZ, at, planeGeometry, map, hazeMap }`
  once per page on the first call (module `let GLOW = null`) and reuse it for every instance (the inputs are the
  sealed nodes, identical for every clone). Per call create only the two materials and the two objects. `add` becomes
  `{ transparent: true, depthWrite: false, side: THREE.FrontSide, blending: THREE.CustomBlending, blendSrc: THREE.SrcAlphaFactor, blendDst: THREE.OneFactor, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor }`
  (colour maths identical to Additive; destination alpha untouched, so no square on an `alpha:true` canvas).
  Haze `onBeforeRender`: `haze.material.opacity = Math.min(1, Math.max(0, nrm.dot(toCam) * 4)) * (haze.material.userData.fade ?? 1);`
  Mark both textures `userData.studioShared = true`.
- `softOffBleed(THREE, root, capMats)`: cache `{ tex, canvas, box, tint }` per page (module `let BLEED = null`); per call
  only the caps' `onBeforeCompile`/`customProgramCacheKey`/`needsUpdate`. `userData.bleed` handle kept.
- `ciclopLeds(THREE, root, mode)`: halo canvases + textures cached per tint (module `const HALO = {}`); per call a new
  `SpriteMaterial` + `Sprite`. `onBeforeRender`: `… * f * f * (halo.material.userData.fade ?? 1)`.
- `finishGlb` default branch, ciclop, venovisor, softoff: verbatim `finishNew` with `LQ` knobs replaced by their
  defaults (`logoenv` 0.3 lives in `LOGO_STAGE`; `metalenv` 1.8 in `METALS`; `olive` = `VENO_OLIVE`).

Wafer (`wafer(THREE, root, tier)`): see §4.4.

### 1.4 Core API (what consumers partition against)

```
window.MOStudio      (= the exports of app/projects/rendering/studio.js; the lab imports the file itself)
  TONE, NEUTRAL_GLSL, ROOM, FIELD_ROOM, FIELD_AMBIENT, HW_STAGE, LOGO_STAGE, METALS, VENO_OLIVE, LED_MODES,
  PRESETS, BY_NAME, WAFER_URL, LOOKS, PROCEDURAL
  look(url?) -> Look
  exposure(ev = 0) -> { value }
  tone(material, uExposure?) -> material
  studioRoom(THREE, room) -> Scene
  studioEnvironment(THREE, renderer, room = ROOM, size = 256) -> WebGLRenderTarget
  presets(THREE, stage) -> { anodisedBlack(), …, apply(root, table?) -> { unmapped } }
  finish(THREE, root, url, { tier: "rig" | "field" | "parts" }) -> { look, materials: Set, exposure }
  lights(THREE, scene) -> { set(look) }
  modelBox(THREE, root, box?) -> Box3
  fit(THREE, root, size) -> Box3
  merge(THREE, root)

window.fitModelToSize(root, THREE, size)  -> window.MOStudio.fit(THREE, root, size)   (model-viewer.jsx; callers unchanged)
window.loadProjectModel(url, THREE)        unchanged contract, no KTX2 path
window.preloadModels(urls)                 unchanged
```

Look = `{ kind: "logo" | "hardware" | "wafer" | "procedural", ev?, env?, rim?, key?, finish?: "venovisor" | "ciclop" | "softoff", led?: "off" | "subtle" | "on", table?, merge? }`.

Wafer file contract (`models/wafer.glb`): the 53 part nodes named exactly like `models/wafer_parts/*.glb`
(`case_L` … `key_R_t2`), plus `screen_L` / `screen_R` as children of `display_L` / `display_R` (a quad with a
PNG panel texture); `extras.palette` (→ `userData.palette`) on `switches_L/R` and `display_L/R` as
`[[hex, roughness, metalness, tag?], …]`, `tag === "active"` marks the panel's active area; raw frame = the old
`wafer_demo.glb` frame (Z-up, metres); the 36 key nodes share one mesh; no texture other than the two panels;
`extensionsRequired ⊆ {KHR_mesh_quantization, EXT_meshopt_compression}`.

### 1.5 The lab reads the site

- `lab/materials.js`: `import * as S from "../app/projects/rendering/studio.js";` and nothing from `./studio.js`,
  `./materials-models.js` or `./materials-wafer.js`. ENTRIES + `makeRoot` fold into it (ids, names, notes,
  `macro`; `src`, rig fit/pose and card fit/pose read from `window.MO_PROJECTS` exactly as today). `makeRoot` =
  `root = (await ctx.source(entry.src)).clone(true); S.finish(THREE, root, entry.src, { tier: tier === "field" ? "field" : "rig" })`,
  then field materials `transparent = true`. Fit = `S.fit`. Dress: rig/macro → `S.studioEnvironment(…, S.ROOM, 256)`
  + `S.lights(THREE, scene).set(S.look(entry.src))`; field → `S.studioEnvironment(…, S.FIELD_ROOM, 128)` +
  `AmbientLight(S.FIELD_AMBIENT)`. Renderer `toneMapping = NoToneMapping` (Neutral is in the materials).
  `led` knob → `S.LOOKS["models/ci-clop-mark.glb"].led = state.led` before a Ci-Clop build.
- `lab/studio.js`: the study's module. It re-exports `TONE`, `NEUTRAL_GLSL` from the site, imports `ROOM` and
  `studioRoom`, and keeps only what `lab/wafer.js` imports and the site does not ship: `DARK_PAGE`, `STAGES`
  (`light`, `dark`, `void` with `env: ROOM`), JS `neutral()`, `inverseNeutral()`, and
  `studioEnvironment(THREE, renderer, e)` = `fromScene(studioRoom(THREE, e), 0).texture` (the study's own path,
  unchanged). PRESETS, BY_NAME, presets, printLines, grain, useNeutral are deleted from it.
- `lab/wafer.js`: untouched (its 7 imports from `./studio.js` all still exist).
- `lab/studio.check.mjs`: lab-only checks (JS `neutral` vs site `NEUTRAL_GLSL` constants; `inverseNeutral` round
  trip per lab stage; lab `STAGES.void.env` deep-equals site `ROOM`). Preset, name-table and model checks move to
  CI (`tools/landing-runtime/studio.test.cjs`).

### 1.6 What the port deletes

`app/projects/rendering/solid-materials.js` (`tuneRealMaterials`, `applySolidMaterials`); `assignMaterial`
everywhere (registries, rig, lifecycle, handoff rig, universe, menu, Ci-Clop.html, page doc block);
`getKTX2Loader`, `_withoutKTX2` and the retry in `model-viewer.jsx`; `tools/landing-runtime/model-decoder.test.cjs`
(its only subject was the KTX2 retry); `KTX2Loader` from every import map and from `menu-renderer.js`;
`RoomEnvironment` from every page whose only user was a model renderer (kept on `index.html` for the board's
PCB scene, `Ci-Clop.html` and `Kerfur.html` for their demos); the rig's `models/wafer_demo.glb` default;
`makeNodeProxy` from the Venovisor bundle; `models/wafer_demo.glb` itself (last, §5.6); `lab/materials-models.js`,
`lab/materials-wafer.js`.

---------------------------------------------------------------------------------------------------------

## 2. Look table and framing

- **Look** (ev, env, rim, key, finish, LED mode, material table, merge) lives in `MOStudio.LOOKS`, keyed by the
  model URL. Every consumer already holds the URL (`project.model.src`, `config.model`, `PAGE_CONFIG.hero.model`).
  No registry field is added, so the AGENTS.md "new field needs a reader" rule is not triggered. A URL without an
  entry is a logo; a hero with no URL (`buildModel`) is `PROCEDURAL`.
- **Framing** (fit, pose) stays in the registries and `PAGE_CONFIG.hero`, exactly as today:
  rig `rigFit`/`rigPose`, card `cardPose.fit × 1.9` / `cardPose.pose`, menu `menuPose || cardPose.pose || rigPose`.
  The gallery's `rigNew`/`cardNew`/`srcNew` fold into the registries (§5).
- CI (`studio.test.cjs`) asserts: every `LOOKS` key is a file in `models/`; `WAFER_URL` equals the registry's 0x01
  `src` and `data.jsx`'s 0x01 `model`; for 0x04 and 0x05 the page's `PAGE_CONFIG.hero.modelFit`/`pose` equal the
  registry `rigFit`/`rigPose` (the seam).

---------------------------------------------------------------------------------------------------------

## 3. Tiers

| Surface | Renderer (tone) | Environment | Lights | Material pass | Fit / frame |
|---|---|---|---|---|---|
| **Hero rig** `solid-hero-rig.jsx` (every project route) | unchanged (ACES 1.18 reaches only the proxy's lines/points) | `studioEnvironment(ROOM, 256)` | `lights()`; `set(done.look)` per model | GLB: `finish(…, config.model, {tier:"rig"})`; keepMaterials: `tone()` every Mesh material with `exposure(PROCEDURAL.ev)` | `fitModelToSize` after the finish (the root is still un-parented) |
| **Handoff flight rig** `project-handoff-rig.jsx` → same rig | same | same | same; constant light count → hover swaps never recompile | same | registry `rigFit`/`rigPose` (unchanged mechanics) |
| **Universe card** `universe.jsx` (also the work reel) | NoToneMapping (unchanged); Neutral in the material | `studioEnvironment(FIELD_ROOM, 128)` | `AmbientLight(FIELD_AMBIENT)` only (key Dir and teal Point removed) | `finish(…, p.model, {tier:"field"})` → all materials (meshes AND sprites) `transparent`, faded via `opacity` + `userData.fade` | `fitModelToSize(cardPose.fit × 1.9)`; pose on the wrapper (unchanged); `modelViewportBounds` uses `modelBox` |
| **Menu** `menu-objects.js` | leases the host renderer; no tone override any more | FIELD env: landing = the Universe's; project page = rig builds `studioEnvironment(FIELD_ROOM, 128)` lazily; text pages = standalone builds the same | `AmbientLight(FIELD_AMBIENT)` | `finish(…, src, {tier:"field"})`; the procedural output switch gets `tone()` | unchanged |
| **About-board explosion** `about-board.jsx` | unchanged ACES 1.05 for the PCB scene; Wafer in Neutral via the hook | board scene keeps RoomEnvironment(0.04); Wafer materials get `m.envMap = studioEnvironment(ROOM, 128).texture` | the board's own (unchanged) | `finish(…, WAFER_URL, {tier:"parts"})`; materials `transparent` (opacity fade as today) | explosion maths verbatim on the raw nodes |
| **Wafer PLAY DEMO** `wafer-demo.js` + `wafer-board.js` | ACES 1.06 kept for legends / x-ray / wire; Wafer solid materials Neutral via the hook | `studioEnvironment(ROOM, 256)` | `lights()` + `set(look(WAFER_URL))` (rim 2.2, key 2.5); old ambient/teal/fill removed | `finish(…, WAFER_URL, {tier:"parts"})`; per-key cap = `tone(cap.material.clone())` (emissive per key) | demo framing verbatim |

### 3.1 The Universe tone solution (non-model pixels unchanged)

Every non-model material in the Universe scene is unlit (tiles, dust, backdrop: MeshBasic; stars, assembly: Points;
constellation: ShaderMaterial), and r160 applies `scene.environment` only to MeshStandard/Physical. So:
- the environment swap and the light swap (ambient 0.9 → 1.0, Dir 1.6 and teal Point 1.6 removed) reach model
  pixels only;
- Neutral runs inside the model materials (`tone()`), after lighting and before `colorspace_fragment`/`fog_fragment`,
  so a model still fades into the untoned `#04060d` fog exactly like a card;
- the renderer stays `NoToneMapping`, the composer chain (Render → FastBokeh → mirror → effect → Output) is untouched,
  and `OutputPass` still only converts to sRGB.
Nothing else changes in the field except `forceSinglePass: true` on the tile material (§7, gated to be pixel-identical).

---------------------------------------------------------------------------------------------------------

## 4. Wafer

### 4.1 One delivery, one cache

`models/wafer.glb` serves every Wafer surface (card, reel, handoff, hero, menu, board, PLAY DEMO) through the
existing `loadProjectModel` per-URL cache. One request per page; `index.html` prefetches it. The static tiers share
one memoised merged geometry per page (`MERGED`); the explosions share the loader's part geometry. No KTX2 anywhere.

### 4.2 The build tool (`tools/wafer/`, not deployed)

`tools/wafer/build.mjs`, two stages:

1. `node tools/wafer/build.mjs capture --tools <dir>` — needs the preview server and the lab (untracked). Playwright
   (Chrome, SwiftShader args) opens `http://127.0.0.1:8765/tools/wafer/capture.html`, which:
   - loads `switches_L/R`, `display_L/R` from `models/wafer_parts/` with GLTFLoader + MeshoptDecoder + KTX2Loader
     (r160 unpkg), reads each palette strip back (the lab's `readPalette` + `swapEntries` + `SWAP` table, moved here
     from `lab/materials-wafer.js` verbatim) and keeps `[hex, roughness, metalness, tag?]` per entry;
   - draws the two panels with `lab/mip.js` exactly as `makeWaferScreens` did
     (`drawConnected(status, connected, { time: "12:34", layer: "Base", profile: 0 })`,
     `drawPeripheral(media, peripheral, { playing: true, title: "Patience", artist: "LOW ROAR" })`; Montserrat 400/500
     loaded by the page's own `<link>`), and exports both 68×160 canvases as PNG data URLs;
   - writes `tools/wafer/palettes.json`, `tools/wafer/panel-status.png`, `tools/wafer/panel-media.png` (committed
     inputs, so stage 2 never needs the lab, a browser or a font).
2. `node tools/wafer/build.mjs pack --tools <dir>` — node only, writes `models/wafer.glb`:
   1. merge the 53 files (the logic of `lab/perf/merge-wafer-parts.mjs`, "shared" mode only: one scene, 53 nodes named
      like the files, `dedup()` → the 36 keys share one mesh);
   2. strip: dispose every texture and `KHR_texture_basisu`; remove `TEXCOORD_0` from `pcb_*` primitives;
   3. palettes: `node.setExtras({ palette })` on `switches_L/R`, `display_L/R` from `palettes.json`;
   4. crease (the measured recipe of `$PORT/wafer/crease.mjs`): per unique mesh, positions to world millimetres
      (node world × 1000), winding swapped when the determinant is negative, `toCreasedNormals(g, 40°)` then
      `mergeVertices(g, 1e-3)` from **three@0.160.0**'s `BufferGeometryUtils` (the lab's version: its hash is in model
      units, which is why the bake is in millimetres), back to node-local with the inverse matrix and its normal matrix,
      written as float POSITION/NORMAL/TEXCOORD_0 + index;
   5. lids: for `display_L` (status panel) and `display_R` (media panel): active entry = the palette index tagged
      `"active"`; collect the display's vertices with `floor(u × n) === active` and world normal z > 0.9; their world
      box gives the quad (size x × y) centred at (cx, cy, maxZ + 0.00002 m) facing +Z, canvas top toward +Y (the far
      edge; glTF `flipY=false`, so v = 0 at +Y). Add it as node `screen_L` / `screen_R`, a child of the display node with
      local matrix `inverse(displayWorld) × lidWorld`, material `mip-panel-L/R` with `baseColorTexture` = the PNG,
      sampler `{ magFilter: 9728, minFilter: 9987, wrapS: 33071, wrapT: 33071 }`;
   6. write a float GLB to a temp file and pack it: `gltfpack -i tmp.glb -o models/wafer.glb -cc -kn -km -ke -kv -vtf`
      (gltfpack 1.3.0 from `--tools`; `-vtf` keeps texcoords float so the palette and panel UVs need no texture
      transform; `-kv` keeps the palette UVs, which no texture references; `-ke` keeps `extras.palette`);
   7. assert by reading the result back with gltf-transform, and fail loudly otherwise: 55 named nodes (53 + 2
      screens); every `key_*` node uses one mesh; `TEXCOORD_0` (FLOAT) on `switches_*`, `display_*`, `screen_*` and
      none on `pcb_*`; exactly 2 images, both `image/png`; no `KHR_texture_basisu` or `KHR_lights_punctual`;
      `extensionsRequired ⊆ {KHR_mesh_quantization, EXT_meshopt_compression}`; `extras.palette` on the 4 nodes; for each
      palette primitive every `floor(u × n)` lies in `[0, n)`; print raw bytes and gzip -6 bytes, and fail if gzip -6 >
      630,153 B (wafer_demo's wire size).
   Tools dir: `npm i --prefix <dir> @gltf-transform/core@4 @gltf-transform/extensions@4 @gltf-transform/functions@4 meshoptimizer gltfpack@1.3.0 three@0.160.0 playwright`
   (`$PORT/../hollow/tools/node_modules` already has all but `three@0.160.0` and `playwright`; the playwright at
   `/home/oleksandr/.npm/_npx/31e32ef8478fbf80/node_modules/playwright` works for capture). Measured on the same recipe:
   834,896 B raw / 615,849 B gzip -6 (+ about 1 KB of panels).

### 4.3 Frame and seam

- The raw frame of the merged parts IS `wafer_demo.glb`'s frame (the wafer map's 48-permutation proof: identity wins,
  median nearest-vertex 9e-5 units; all 36 keys within 1e-5). No correction. `rigFit 4.0`, `rigPose {x:-0.92}`,
  `cardPose {2.9, x:-1.15}`, `menuPose` keep their meaning.
- Static tiers fit on the **merged** geometry, whose boxes are tight (vertices baked into root space), so the fit is
  the same as wafer_demo's tight box: same size and centre at fit 4.0 (4 × 1.3755 × 0.1158 vs 4 × 1.3757 × 0.1157).
  Fitting the raw nodes with a loose box would shrink the Wafer 3.36% and move it 0.07 u: never fit the parts tier.
- The explosions keep fitting raw nodes with loose boxes, as today (base 0.289611 m, centre
  (0.158451, −0.098190, 0.002750) m from the 53 files; the packed file reproduces it to 4e-6). Verification §9.2
  compares every part's loose box.

### 4.4 The assembly (`wafer(THREE, root, tier)` in studio.js)

```
const P = presets(THREE, HW_STAGE), made = new Map(), get = (key, mk) => made.get(key) || made.set(key, mk()).get(key);
part(o) = the nearest ancestor-or-self whose name is one of the 53 part names or screen_L/screen_R
for each Mesh o:
  name = part(o).name, kind = name.startsWith("key_") ? "key" : name.replace(/_[LR]$/, "")
  case     -> get("case",  () => P.anodisedBlack(undefined, { grain: false }))
  key      -> get("key",   () => P.pbtCap(undefined, { grain: false }))
  plate, softoff -> get("nylon", () => P.nylonCap())
  antenna  -> get("black", () => P.matteBlack())
  pcb      -> get("mask",  () => P.soldermask())                 // bare board: no map
  switches -> get(name, () => paletteMaterial(THREE, part(o).userData.palette))
  display  -> get(name, () => paletteMaterial(THREE, part(o).userData.palette, { clearcoat: 1, clearcoatRoughness: 0.05 }))
  screen   -> get(name, () => panel(o.material.map))            // mountScreen's recipe: mipGlass, color 1, emissive 1, emissiveMap, 0.45; map.anisotropy = 16
  usbc, mcu -> by the CAD colour (o.material.color), as materialFor: gold "#ffc254" / pearl "#c9cbce" (brushedPearl) / black (shared with antenna)
  material.name = "wafer:" + key;  o.material = material
paletteMaterial's two DataTextures are cached per palette (module Map keyed by the part name), userData.studioShared.
if (tier !== "parts") merge(THREE, root)    // 62 meshes -> 13
```

`grain: false` is the only difference from the gallery's `materialFor`, and it is pixel-neutral (§0).

### 4.5 Explosions (behaviour verbatim, one load)

- `about-board.jsx` `buildWaferReal(group, state)`: `load(MOStudio.WAFER_URL)` once; `finish(THREE, src, WAFER_URL, { tier: "parts" })`;
  `src.updateMatrixWorld(true)`; for each of the 53 names `holder.attach(src.getObjectByName(name))` (world-preserving: gltfpack may
  insert dequantisation nodes); then the existing box/axes/`vec`/wrap code with `root` → the node, `wrap.attach(node)`. Materials:
  each `done.materials` entry gets `transparent = true` and `envMap = state.env` (the board's studio texture) and is pushed to
  `state.materials`. The per-part `o.material.clone()` and its `envMapIntensity 1.2` go.
- `demo/wafer-board.js` `build()`: one `loader(MOStudio.WAFER_URL, THREE)`, `finish(…, { tier: "parts" })`, `recenter.attach(node)`
  for each name in `ALL_FILES`, the rest verbatim. Cap: `const sm = MOStudio.tone(cap.material.clone()); sm.emissive = new THREE.Color(SIGNAL); sm.emissiveIntensity = 0;`
  (the 1.25/1.3 `envMapIntensity` overrides go: the presets own the env strength). Structural parts keep the shared finish material as
  `solidMat` (no clone). X-ray clones stay as they are (a diagnostic mode, toned by the renderer's ACES).
- The lids ride with their display (they are its children) instead of floating.

---------------------------------------------------------------------------------------------------------

## 5. Models and registries (exact)

### 5.1 Files
- `cp lab/models/ci-clop-mark.glb models/ci-clop-mark.glb` (replace; 115,124 B; nodes `ci-clop`, `ci-clop-shell`, `led-white`, `led-red`; materials `pla-olive`, `lens-clear`, `led-white`, `led-red`; `_PRINTZ`; no light).
- `cp lab/models/venovisor-mark.glb models/venovisor-mark.glb` (new; 139,044 B; requires only `EXT_meshopt_compression`). NOT the `.parts.glb`.
- `models/wafer.glb` from §4.2.
- The owner must `git add` the three model files, `app/projects/rendering/studio.js`, `tools/wafer/*` and `tools/landing-runtime/studio.test.cjs`: CI ships tracked files only.

### 5.2 `app/data/projects.js`
```js
// header comment, model block:
//   src      — GLB path (null → procedural proxy "node-shell")
//   rigFit / rigPose — the hero rig's fit and pose; mirror the page hero
//   cardPose { fit, pose } / handoffPose / menuPose — per-model tuning;
//   NEVER hardcode orientation or scale inside React components.
//   The look (finish, exposure, LEDs) is not a registry field: it is LOOKS in
//   app/projects/rendering/studio.js, keyed by src.

// 0x01
        ready: true, src: "models/wafer.glb",          // rigFit/rigPose/menuPose/cardPose unchanged
// 0x04
      model: mdl({
        ready: true, src: "models/ci-clop-mark.glb",
        rigFit: 3.0,   // matches this project's page hero
        rigPose: { x: 0.45, y: 0.75, z: 0 },
        cardPose: { fit: 1.25 },   // the file is upright: no card turn
      }),
// 0x05
      model: mdl({
        ready: true, src: "models/venovisor-mark.glb",
        rigFit: 3.7,   // matches this project's page hero
        rigPose: { x: 0.12, y: Math.PI + 0.35, z: -0.62 },
        cardPose: { fit: 4.9 / 1.9, pose: { x: 0.12, y: Math.PI + 0.35, z: -0.62 } },   // universe.jsx multiplies cardPose.fit by 1.9: the approved card is 4.9
      }),
// tail comment
  /* TODO(models): Kerfur has no GLB yet, so it renders the "node-shell" proxy.
     To wire a future model: set ready: true + src: "models/<file>.glb". */
```
`assignMaterial` disappears with the 0x04 block. Nothing else changes (Bulgaria/Wafer Studio pose mismatches are pre-existing and out of scope).

### 5.3 `app/projects/data.jsx`
- line 21: `model: "models/wafer.glb",`
- line 545: `model: "models/venovisor-mark.glb",` (drop the "no GLB yet" comment).

### 5.4 `Ci-Clop.html` (`PAGE_CONFIG.hero`, inert JSX source compiled by the build)
```js
      hero: {
        model: "models/ci-clop-mark.glb",
        /* The rig's 4.0 default is Wafer's, a full split keyboard. 3.0 is the
           framing the materials gallery approved for this revision. rigFit for
           0x04 in app/data/projects.js mirrors it: keep the two equal or the
           mark changes size halfway through the flight. */
        modelFit: 3.0,
        pose: { x: 0.45, y: 0.75, z: 0 },   // three-quarter: the LED face, the lid seam, the bed pad
      },
```
Module script keeps `RoomEnvironment` (torch demo). No KTX2 there today.

### 5.5 `Venovisor.html`
```js
      hero: {
        model: "models/venovisor-mark.glb",
        modelFit: 3.7,                                      // keep equal to rigFit for 0x05 in app/data/projects.js
        pose: { x: 0.12, y: Math.PI + 0.35, z: -0.62 },     // and to its rigPose
      },
```
`heroLayout` and `bridgeSeam` stay. Module script: drop `RoomEnvironment` and `KTX2Loader` (imports and the
`Object.assign`). Bundle comment: "Shared core, project data, hero rig and ASCII figures".

### 5.6 Import maps and the rest
- Drop `KTX2Loader` AND `RoomEnvironment`: Brionel Catalogue, Bulgaria 2026, Sightseeing, Silent Depth, Wafer Studio, ZMK Soft Off Plus, Venovisor, Wafer.
- Drop `RoomEnvironment` only: Iskra, Split HID Display, ZMK-PointAccel, Design System.
- Keep `RoomEnvironment`: index.html (board PCB scene), Ci-Clop.html, Kerfur.html (their demos). `index.html` drops `KTX2Loader`.
- `index.html`: `<link rel="prefetch" href="models/wafer.glb" as="fetch" crossorigin="anonymous" />` replaces the wafer_demo line; delete the `solid-materials.js` tag.
- `wafer-page.jsx`: `window.makeWaferRig(mount, { model: (window.PROJECT_DATA && window.PROJECT_DATA["0x01"] || {}).model })`.
- `solid-hero-rig.jsx`: `const initialModelUrl = opts.model || null;` (no Wafer default).
- After every partition: `npm run build --prefix tools/landing-runtime` (cache-busting stamps on both registries, every bundle and `runtime.js`).
- `models/wafer_demo.glb` is deleted last, when `grep -rln "wafer_demo" app demo tools/landing-runtime tools/wafer index.html *.html lab/*.js lab/*.html lab/*.mjs` returns nothing.

---------------------------------------------------------------------------------------------------------

## 6. Docs

### 6.1 AGENTS.md (exact edits)
1. Lab paragraph (after "…sweeps the path for collisions."): add
   "`lab/materials.html` is the model gallery. It renders through the site's own `app/projects/rendering/studio.js`
   (no copy) and is where a look change is judged before it ships; `lab/studio.js` holds only what the study needs
   on top (its light and dark stages, the JS curve and its exact inverse), and `node lab/studio.check.mjs` checks those."
2. Deploy exclude sentence: `face-test.html lab/ tools/ studies/ models/wafer_parts/ *.md`.
3. Audit paragraph ending "`tuneRealMaterials` in the same file shows the correct pattern." → "`presets().apply` in
   `app/projects/rendering/studio.js` shows the correct pattern: it builds new materials and never disposes a sealed one."
   Add one bullet to the audit list: "**A clone that lost its hook.** r160 `Material.copy()` does not copy
   `onBeforeCompile` or `customProgramCacheKey`, so a cloned studio material renders without Neutral, grain or layer
   lines. Call `MOStudio.tone()` on every clone (the PLAY DEMO's per-key caps do)."
4. Field paragraph: "…derived from `TILE_BOX` now), and the teal rim `PointLight` range." → "…derived from `TILE_BOX`
   now). The field has no analytic key or rim any more: the studio room and one ambient light the models."
5. Hero rig section: replace the "material route is three-way" list with:
   "The material route is two-way:
   - default: a real GLB. `MOStudio.finish()` swaps its materials for studio presets by material name (`BY_NAME`), adds
     the hardware finish its URL names in `LOOKS`, and puts PBR Neutral inside every material. Nothing is cloned and
     nothing sealed is disposed.
   - `keepMaterials: true`: a procedural hero (Kerfur) or the node proxy. Its materials are kept; the rig only adds the
     Neutral hook and the `PROCEDURAL` dress.
   `assignMaterial` is gone: no shipped GLB lacks materials."
   and "…that is how `assignMaterial` and `keepMaterials` can look set and not be." → "…that is how `keepMaterials` can look set and not be."
6. New section after "The project hero rig", titled "## The studio: one look for every model":
   - home and API (`window.MOStudio`, compiled into every bundle by `build.cjs`'s `esm` kind; the gallery imports the file);
   - tone in the material, why (render targets, OutputPass), never `ShaderChunk` patches, never a renderer setting for a model;
   - `LOOKS` keyed by URL; framing stays in the registries;
   - tiers: rig `ROOM` at 256 + `lights()`; field and menu `FIELD_ROOM` at 128 + `FIELD_AMBIENT`; explosions `parts`;
   - a finish's light (`glow|halo|haze`) never sizes or frames a model (`modelBox`); finish textures and merged geometry
     are module-shared and never disposed by a consumer; a consumer disposes only `finish().materials`;
   - static tiers merge by material (Wafer 62 → 13, ZMK 49 → 2, Sightseeing 13 → 3); the explosions never merge;
   - the site loads no KTX2: any future KTX2 asset must bring `KTX2Loader` back deliberately, with its transcoder in the budget.
7. Models section: "Kerfur and Venovisor are the two left." → "Kerfur is the one left." After the gltfpack paragraph add:
   "Two exceptions. A model that carries a custom vertex attribute (`_PRINTZ`, the print height the layer lines read) is
   packed with `lab/tools/pack-glb.mjs`, because gltfpack 1.3 drops custom attributes; `venovisor-mark.glb` therefore
   requires only `EXT_meshopt_compression`. The Wafer is built, not exported: `node tools/wafer/build.mjs pack` merges
   `models/wafer_parts/` into `models/wafer.glb` (creased normals, palettes, the two panels; see the tool's header).
   No shipped GLB carries `KHR_lights_punctual` or KTX2; `studio.test.cjs` fails if one does."
8. Runtime/validation lifecycle bullet: append "A hero under PLAY DEMO (`hv-demoing`) sleeps; leaving the demo wakes it."

### 6.2 `lab/models-handoff.md` status lines
- Replace "Started 2026-10-14. Nothing here is built yet, apart from the Wafer study itself." with:
  "Started 2026-10-14. **Status 2026-10-15: §3 and the hardware half of §4 are on the site.** The studio lives in
  `app/projects/rendering/studio.js` (one room, PBR Neutral inside every model material, the preset table, the
  hardware finishes, the per-model `LOOKS`), and `lab/materials.html` renders through it. Wafer ships as
  `models/wafer.glb` (the 53 parts merged by `tools/wafer/build.mjs`) on every surface, and `wafer_demo.glb` is gone.
  Ci-Clop and Venovisor ship from `lab/models/`. Still open: the seven logo signature finishes (§4), the hero
  accumulation engine on `Wafer.html` (§6 step 2), Kerfur's model."
- §1, after "The site would get **lighter**.": "(Only as one merged file: 53 separate files would be heavier than wafer_demo. See `lab/models-perf.md` §4.)"
- §3 "One place (site)" bullet: append "**Done differently:** a new `studio.js`, compiled into every bundle as
  `window.MOStudio`; `solid-materials.js` is deleted and `lab/wafer.js` keeps its own renderer."
- §3 "Tone mapping today is ACES" bullet: append "**Done:** PBR Neutral wherever a model renders, inside each material."
- §6: step 1 "[done 2026-10-15]"; step 2 "[universe, reel, handoff, menu, board and PLAY DEMO done; the Wafer.html hero engine open]";
  step 3 "[done]"; step 4 "[open]"; step 5 "[Ci-Clop and Venovisor done; Kerfur waiting]".

### 6.3 Other
- `docs/model-export.md`: under the title add "> Historical. The Wafer now ships as `models/wafer.glb`, built by
  `tools/wafer/build.mjs` from `models/wafer_parts/`. The site loads no KTX2 transcoder any more: do not use `-tc`."
- `.github/workflows/deploy-pages.yml`: add `--exclude='models/wafer_parts/' \` after `--exclude='studies/' \`.
- Comments: `universe.jsx` "(Kerfur, Venovisor)" → "(Kerfur)"; `project-handoff.jsx` 437-445 drop the wafer_demo
  sentence ("models/wafer.glb is the heaviest model and the first to lose that race"); `standard-page.jsx` doc block
  drops the `assignMaterial` line; `solid-hero-rig.jsx` header rewritten to the two-way route.

---------------------------------------------------------------------------------------------------------

## 7. Performance

### 7.1 Ranked wins (lab/models-perf.md §4 and the perf map), taken or not

| # | Win | Taken? | Where |
|---|---|---|---|
| 1 | Wafer as one merged GLB, shared key mesh, no KTX2 | yes | core (tool) + every consumer |
| 2 | No KTX2Loader in any import map; no transcoder; no throwaway `detectSupport` context | yes | core (model-viewer) + rig-pages + landing |
| 3 | Offline bake: creased normals, palettes, panels, lids | yes (all parts creased: the approved normals) | core (tool) |
| 4 | Field programs 21 → ~13: no GLB light (new Ci-Clop), in-material Neutral with uniform exposure, one grain key, chained hooks | yes | core + landing |
| 5 | Merge static tiers by material (Wafer, ZMK, Sightseeing) | yes (memoised per page) | core |
| 6 | New materials front-sided (no transparent DoubleSide double pass) | yes, by construction (presets are FrontSide) | core |
| 7 | Clamp `dt ≥ 0` in the rig `update()` and the board-flight loop | yes | rig-pages, explosions |
| 8 | Studio PMREM through a cube camera, 128 field/board/menu, 256 hero | yes | core + consumers |
| 9 | Precompile each field model as it loads (`renderer.compile(holder, camera, scene)`) | yes | landing |
| 10 | Share finish textures per page; glow 256²; (sprites out of the DoF prepass: not taken, negligible) | yes / no | core |
| 11 | Quantise the two new marks | no (needs a `_PRINTZ` scale uniform; later) | — |
| 12 | `forceSinglePass` on the 12 card materials (Universe render 1.4 → 0.8 ms) | yes, gated pixel-identical | landing |
| — | Hero sleeps under PLAY DEMO (`hv-demoing` in `shouldRender`) | yes | rig-pages |
| — | Drop `preserveDrawingBuffer` from the PLAY DEMO renderer (nothing reads it) | yes | explosions |
| 13 | ZMK PNG lossless recompress (−47 KB wire, pixel-identical) | **owner question** (sealed GLB) | — |
| 14 | Transcoder preload; Standard materials in the field | no (perf map: do not) | — |

### 7.2 Budget per surface (before = `$PORT/perf-before.json`; target = ceiling for `perf-after.json`)

Wire = gzip -6 for site files, as transferred for the CDN. "tex/RT" are the harness's columns (it counts the PMREM in both).
A target above "before" carries its reason in the last column; everything else must be ≤ before.

| Surface / state | Metric | Before | Target (ceiling) | Reason for any increase |
|---|---|---|---|---|
| landing-title | requests / wire | 68 / 1,856 KB | ≤ 62 / ≤ 1,700 KB | +1 req, +103 KB Venovisor GLB (decision 4); +11 KB Ci-Clop (float positions keep `_PRINTZ` exact); +~5 KB studio JS |
| | GLB req / KB | 10 / 914 | ≤ 11 / ≤ 1,015 | Venovisor, Ci-Clop as above; Wafer 630 → ≤ 617 |
| | KTX2 + transcoder | 4 / 265 KB | 0 / 0 | |
| | WebGL contexts made / live | 3 / 2 | 2 / 2 | |
| | Universe programs | 29 | ≤ 22 | |
| | Universe draws/frame (same visible set) | 58 | ≤ 58 (expect ~40) | |
| | Universe tris/frame | 113k | ≤ 125k | +12k Venovisor real model (decision 4) |
| | Universe render CPU median / p95 | 1.4 / 3.9 ms | ≤ 1.0 / ≤ 3.9 ms | |
| | Universe tex / geo / RT MB | 47.4 / 3.56 / 41.44 | ≤ 34 / ≤ 7.5 / ≤ 34 | geo +~4 MB: float merged geometry (Wafer, ZMK, Sightseeing) buys −49+47+10 draws; Venovisor +0.4 MB |
| | Handoff rig programs / tex / geo / RT | 4 / 16.67 / 1.75 / 9 | ≤ 8 / ≤ 6.6 / ≤ 4.5 / ≤ 6.4 | programs: the approved Wafer has ~8 materials (wafer_demo 4); geo: merged floats |
| | JS heap | 8.8 MB | ≤ 11 MB | the memoised merged Wafer geometry (~4 MB, shared by every context on the page) |
| landing-board (delta) | requests / wire | +53 / +847 KB | +0 / +0 | |
| | Board render CPU median / p95 | 11.3 / 19.5 ms | ≤ 5 / ≤ 9 ms | |
| | Board draws/frame | 209 | ≤ 152 | |
| | Board programs | 13 | ≤ 13 | |
| | Board tex / RT MB | 27.67 / 9 | ≤ 17 / ≤ 10.6 | RT +1.5 MB: the studio env (128) the Wafer's materials reflect; the PCB keeps its own |
| | contexts made / live | 5 / 4 | 4 / 4 | |
| iskra-menu (delta) | requests / wire | +13 / +1,030 KB | ≤ +7 / ≤ +770 KB | |
| | menu draws/frame | 23 | ≤ 31 | Wafer 13 approved materials (wafer_demo 5); Ci-Clop 4 + 2 halos |
| | menu programs (hero ctx total) | 11 | ≤ 14 | printLines, LED (untoned), halo sprite, palette variants |
| | tex / geo / RT MB | 16.67 / 2.39 / 9 | ≤ 8 / ≤ 5.5 / ≤ 8 | RT/tex +1.5 MB: the menu's field env built lazily on the hero renderer (one menu look on every route) |
| route:Wafer | requests / wire | 32 / 1,410 KB | ≤ 25 / ≤ 1,130 KB | |
| | contexts | 3 / 2 | 2 / 2 | |
| | draws / tris | 5 / 115,938 | ≤ 13 / ≤ 129,000 | the 53 parts are the approved geometry (+11% tris); 13 materials |
| | programs | 4 | ≤ 8 | ~8 distinct approved materials |
| | tex / geo / RT MB | 16.67 / 1.75 / 9 | ≤ 6.6 / ≤ 4.5 / ≤ 6.4 | geo: merged floats |
| | render CPU median | 0.6 ms | ≤ 0.7 ms | +8 draws (~0.04 ms) |
| route:Kerfur | requests / wire | 70 / 535 KB | ≤ 70 / ≤ 541 KB | +~5 KB studio JS (hero + menu look) |
| | programs / RT MB | 2 / 9 | ≤ 3 / ≤ 6.4 | +1 tone variant |
| route:Iskra, Split HID, ZMK-PointAccel | requests | 23 / 24 / 27 | ≤ 22 / 23 / 26 | (RoomEnvironment module gone; +~5 KB studio JS) |
| | programs | 1 / 1 / 2 | ≤ 2 / 2 / 2 | approved presets (Split HID: matteBlack + mipGlass) |
| | ZMK draws / render median | 49 / 0.9 ms | ≤ 2 / ≤ 0.5 ms | |
| | RT MB | 9 | ≤ 6.4 | |
| route:Ci-Clop | requests / wire | 27 / 590 KB | ≤ 27 / ≤ 606 KB | +11 KB GLB (float positions for `_PRINTZ`), +~5 KB studio JS |
| | draws / tris | 7 / 29,831 | ≤ 6 / ≤ 12,300 | |
| | programs | 1 | ≤ 4 | printLines, lens (clearcoat), LED dome (untoned), halo sprite: the approved look |
| | tex / RT MB | 6 / 9 | ≤ 6.4 / ≤ 6.4 | halos 2 × 64² |
| route:Venovisor | requests / wire | 27 / 524 KB | ≤ 24 / ≤ 610 KB | +103 KB real model replaces the proxy (decision 4); −29 KB KTX2 group |
| | draws / tris | 7 / 12 | ≤ 5 / ≤ 12,300 | real model |
| | programs | 5 | ≤ 5 | |
| | tex / RT MB | 6.13 / 9 | ≤ 6.6 / ≤ 6.4 | glow 256² + haze 128², shared |
| route:Wafer Studio, Soft Off, Sightseeing, Silent Depth, Brionel, Bulgaria | requests | 28 each | ≤ 23 each | |
| | wire | 529–602 KB | each ≤ before − 20 KB | |
| | contexts | 3 / 2 | 2 / 2 | |
| | programs | 1 | ≤ 2 (Soft Off: bleed + legend) | approved presets |
| | Sightseeing draws | 13 | ≤ 3 | |
| | RT MB | 9 | ≤ 6.4 | |
| All Projects / Design System menu | lazy requests on menu intent | ~1.0 MB in 7 + RoomEnvironment + KTX2 modules | ≤ 760 KB GLB in 4, no RoomEnvironment/KTX2 modules | |
| | standalone PMREM | 9.4 MB | 1.5 MB | |
| Wafer PLAY DEMO (on click) | requests / wire | +53 / +847 KB | +0 / +0 | |
| | demo draws | 60 | ≤ 62 | the two panels now explode with their display |
| | demo PMREM | 9.4 MB | 6.3 MB | |
| | hero renders while the demo runs | every frame | 0 | |
| Every bundle | studio JS | 0.6 KB gz (solid-materials) | ≤ 6 KB gz (CI-enforced) | the approved look on every route (hero + menu) |
| Every surface | per-frame CPU added | — | halo/haze/printLines `onBeforeRender` (vector maths per draw, no loop); no new rAF; every effect sleeps with its owner's loop | |

---------------------------------------------------------------------------------------------------------

## 8. Partitions

| id | order | files (exclusive) |
|---|---|---|
| core | 1 | `app/projects/rendering/studio.js` (new), `app/projects/rendering/solid-materials.js` (delete), `app/projects/rendering/model-viewer.jsx`, `tools/landing-runtime/build.cjs`, `tools/landing-runtime/model-decoder.test.cjs` (delete), `tools/landing-runtime/studio.test.cjs` (new), `tools/wafer/build.mjs`, `tools/wafer/capture.html`, `tools/wafer/palettes.json`, `tools/wafer/panel-status.png`, `tools/wafer/panel-media.png` (new), `models/wafer.glb` (new), `models/ci-clop-mark.glb` (replace), `models/venovisor-mark.glb` (new) |
| rig-pages | 2 | `app/projects/rendering/solid-hero-rig.jsx`, `app/projects/rendering/project-handoff-rig.jsx`, `app/projects/pages/project-page-lifecycle.jsx`, `app/projects/pages/standard-page.jsx`, `app/projects/pages/wafer-page.jsx`, `app/data/projects.js`, `app/projects/data.jsx`, `Ci-Clop.html`, `Venovisor.html`, `Wafer.html`, `Brionel Catalogue.html`, `Bulgaria 2026.html`, `Sightseeing.html`, `Silent Depth.html`, `Wafer Studio.html`, `ZMK Soft Off Plus.html`, `Iskra.html`, `Split HID Display.html`, `ZMK-PointAccel.html`, `Design System.html` |
| landing | 2 | `app/landing/scenes/universe.jsx`, `app/landing/transitions/project-handoff.jsx`, `index.html`, `app/shared/menu-objects.js`, `app/shared/menu-renderer.js` |
| explosions | 2 | `app/landing/scenes/about-board.jsx`, `app/landing/scenes/board-flight.jsx`, `demo/wafer-board.js`, `demo/wafer-demo.js` |
| lab-docs | 2 | `lab/studio.js`, `lab/studio.check.mjs`, `lab/materials.js`, `lab/materials.html`, `lab/materials-models.js` (delete), `lab/materials-wafer.js` (delete), `lab/models-handoff.md`, `AGENTS.md`, `docs/model-export.md`, `.github/workflows/deploy-pages.yml`, `models/wafer_demo.glb` (delete, last) |

Generated files (`app/landing/runtime.js`, `app/page-runtimes/*`, the `?v=` stamps inside every root HTML) are rebuilt
by the verify step. A partition checks that its own code compiles with `node tools/landing-runtime/build.cjs --check`
(Babel throws on a syntax error; "is stale" messages are expected and fine). It never runs `npm run build`.

The full task text of each partition is in the StructuredOutput `partitions[].task` (same content as this section's
summary plus the per-file edit lists).

---------------------------------------------------------------------------------------------------------

## 9. Verification (run after all partitions, in this order)

### 9.0 Baselines (core partition, step 0, BEFORE any repo edit)
- `$PORT/before/manifest.json` must contain every shot of `node $PORT/shoot.cjs` (hero-* ×13, landing-title,
  landing-reel, landing-board-explode, all-projects, menu-landing, menu-project, menu-allprojects,
  wafer-demo-assembled, wafer-demo-exploded, flight-*). Run the missing groups with `node $PORT/shoot.cjs $PORT/before <filter>`.
- Patch `$PORT/shoot.cjs` (scratch only) so the flight group takes `FLIGHT_ADDR` (default `0x01`) and the route file from
  `{ "0x01": "Wafer.html", "0x04": "Ci-Clop.html", "0x05": "Venovisor.html" }`: featured nodes click
  `.rcard[data-addr=ADDR]` after `LANDING_JS.reelY(ADDR)`; 0x05 (not in the reel) stays at the title and calls
  `window.__mo_open_project({ addr: "0x05" }, window.__mo_universe.tileBounds("0x05"))` once `tileBounds` is non-null; shot
  ids get the addr suffix when `FLIGHT_ADDR !== "0x01"`. Then `FLIGHT_ADDR=0x04 node $PORT/shoot.cjs $PORT/before flight` and
  `FLIGHT_ADDR=0x05 …` (0x05's before is the proxy).
- Gallery baseline: write `$PORT/gallery-shots.cjs <outDir>` (playwright, same launch args): open
  `http://127.0.0.1:8765/lab/materials.html?tier=rig&model=iskra`, wait for `window.materials`, then for every
  `materials.ENTRIES` id × tier in [rig, field] `await materials.shoot({ model, tier, pipe: "new", tone: "neutral" })`
  and save `<id>-<tier>.png`. Run it into `$PORT/gallery-before` (allow minutes per model: SwiftShader compiles the
  thin-film program for ~200 s).
- `$PORT/perf-before.json` exists (keep it).

### 9.1 Build and static checks
```
npm run build --prefix tools/landing-runtime
npm run check --prefix tools/landing-runtime      # "current" ×3
npm test --prefix tools/landing-runtime           # 0 fail; model-decoder tests gone, studio tests present
node lab/studio.check.mjs && node lab/motion.check.mjs && node lab/places.check.mjs && node lab/story.check.mjs
node tools/wafer/build.mjs pack --tools <dir>     # rebuilds models/wafer.glb byte-identically (determinism) and prints its asserts
grep -rn "wafer_demo\|tuneRealMaterials\|applySolidMaterials\|assignMaterial\|solid-materials\|useNeutral" app demo tools/landing-runtime tools/wafer *.html lab/*.js lab/*.html lab/*.mjs   # no hits
grep -rln "KTX2Loader" app demo *.html                                   # no hits (lab/wafer.js and tools/wafer/capture.html may keep it)
grep -rln "RoomEnvironment" app demo *.html                              # exactly: app/landing/scenes/about-board.jsx, demo/torch-demo.js, demo/kerfur-demo.js, index.html, Ci-Clop.html, Kerfur.html
test ! -e models/wafer_demo.glb && test ! -e app/projects/rendering/solid-materials.js
```
Ring walk, both directions (`$PORT/ring.cjs`): Babel-compile `app/projects/data.jsx` (react preset) and run it with
`app/data/projects.js` in one vm context (`window = {}`); from 0x01 follow `next` 13 times and `prev` 13 times: each walk
visits all 13 addrs once and returns to 0x01; every `file` exists at the repo root; `MO_PROJECTS` and `PROJECT_DATA`
agree on addr → file; `MO_PROJECT_BY_ADDR[addr].model.src` is a file for every `ready` node.

### 9.2 Wafer frame (explosions exact)
`$PORT/wafer-frame.cjs`: a headless page at `http://127.0.0.1:8765/` with the r160 import map loads the 53 files
(GLTFLoader + Meshopt + KTX2) and `models/wafer.glb` (no KTX2Loader), and for every part name compares
`new Box3().setFromObject(node)` (loose) between the two: |Δcentre| and |Δsize| ≤ 3e-5 m per part; the global loose box
gives base 0.289611 ± 3e-5 and centre (0.158451, −0.098190, 0.002750) ± 3e-5. It also asserts `models/wafer.glb` loads
with no `setKTX2Loader` error and that every one of the 55 names resolves.

### 9.3 The gallery renders the approved look from site code
`node $PORT/gallery-shots.cjs $PORT/gallery-after`, then `$PORT/pixdiff.cjs gallery-before gallery-after`: subject mask =
pixels where either image differs from `#04060d` by > 6 in a channel; report the share of mask pixels with a channel
|Δ| > 16. Pass: rig ≤ 0.5% and field ≤ 1.0% for every logo/hardware model (field PMREM at 128 measured ≤ 0.37%);
Venovisor ≤ 1.5% (glow 256²); Sightseeing ≤ 0.5% (else remove `merge` from its look); Wafer rig/field ≤ 2.0% (8-bit
packed normals, merged floats, PNG panels; if over, rebuild with `-vn 12` and retest). Also `materials.leakCheck(3)` in
the gallery: programs, textures and geometries flat across rounds.

### 9.4 Site shots
`node $PORT/shoot.cjs $PORT/after`, plus `FLIGHT_ADDR=0x04 …` and `FLIGHT_ADDR=0x05 … flight`. For every shot the manifest
shows `ok`, no page errors, no `setKTX2Loader`/404/shader-compile warnings. Owner review set (side by side before/after):
every hero, landing-title, landing-reel, landing-board-explode, the three menus, both demo shots, all flight frames.
Mechanical checks:
- landing-title / landing-reel: `--gl.png` corners and every 64×64 block that contains no model in either capture match
  before within 1/255 (void, backdrop, dust, stars, constellation).
- `forceSinglePass` gate (`$PORT/singlepass.cjs`): one transparent DoubleSide MeshBasicMaterial plane with a canvas texture,
  rendered from 8 angles front and back, `forceSinglePass` false vs true: 0 differing pixels. If not, revert that line.
- flights: forward-mid and reverse-mid GL captures contain the model (non-blank, subject bbox within the viewport);
  the Wafer forward seam JPEG's subject bbox (scaled to 1440) matches before within 2% in centre and height (same pose and
  size); Ci-Clop and Venovisor: the seam frame and the page's `hero` shot both show the new model (parity of fit/pose is
  enforced by `studio.test.cjs`).
- wafer-demo-exploded: lids sit on their displays (not floating); parts' positions match before by eye (the per-part
  vectors are proven by §9.2).

### 9.5 Performance
`node $PORT/perf.cjs $PORT/perf-after.json` (DoF forced on, as before), then `node $PORT/perf.cjs --print` both files and
check every row of §7.2: counts (requests, programs, draws, contexts) exactly at or under the ceiling; bytes within +2% of
the ceiling; CPU medians at or under the ceiling, or within +15% of before where the ceiling equals before (SwiftShader
noise). Extra probes:
- Universe lit-material audit: in the landing-title state, every MeshStandard/MeshPhysical material the Universe renderer
  draws sits under a `userData.isModel` holder (proves the env/light swap cannot reach non-model pixels).
- PLAY DEMO sleep: on Ci-Clop.html and Wafer.html, after `PLAY DEMO` the hero renderer's render count stays flat for 2 s;
  after Escape it resumes.
- Handoff leak: on the landing, dispatch `mo:tileHover` for 0x01 → 0x04 → 0x05 → 0x01 three times (≥ 150 ms apart, let each
  prepare finish); the handoff renderer's `info.programs.length`, `info.memory.textures` and `.geometries` are flat
  after round 1.
- `model-viewer`: no throwaway WebGL context is created on any route (`contexts made` = live).
