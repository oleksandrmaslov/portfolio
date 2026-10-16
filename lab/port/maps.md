# Mapper report: other demos, registries, tests, deploy, docs and lab

## (1) Surfaces

### Ci-Clop PLAY DEMO (`demo/torch-demo.js` + `demo/torch-model.js`)
- **Model.** It draws a procedural flashlight (`torch-model.js:27-253`) and never loads `models/ci-clop-mark.glb`. Nothing in `demo/` loads a GLB except `wafer-board.js:27,159-163`. The model is an 18650 tube with SW1/SW2 and 4 indicator LEDs (`:68-102`). The header promises a GLB swap-in that keeps the API (`:16-17`).
- **Materials.** 8 MeshStandard and 1 transparent MeshPhysical lens (`torch-model.js:31-40`). X-ray materials are transparent Standard (`:42-46`). Wire is MeshBasic (`:47`). The LEDs are MeshBasic (`:94`). The beam is additive MeshBasic (`:130-148`). There is one PointLight inside the model (`:150-152`).
- **Renderer.** Its own WebGLRenderer (`torch-demo.js:269`): antialias, alpha, `preserveDrawingBuffer: true`, DPR ≤2 (`:270`), sRGB (`:271`), **ACES** (`:272`), exposure **1.06** (`:273`).
- **Environment.** RoomEnvironment PMREM at σ 0.04 (`:281-285`). The PMREMGenerator is never disposed.
- **Lights.** Ambient 0.55, directional key 1.85, teal Point 2.1 (range 22), fill Point 0.8, top directional 0.6 (`:287-292`). With the model's own light that makes 3 point lights.
- **Framing.** No fit. Camera distance 10 (`:524`).
- **Lifecycle.** The scene is built on the first `start()` (`:264-305`). The RAF runs only while `active` (`:486`, `:528`). `stop()` cancels after 480 ms (`:550-552`). The renderer is never disposed.
- **Effect of the port.** The GLB swap does not touch it. The studio's `useNeutral` only patches `CustomToneMapping` (`lab/studio.js:123-131`), and this renderer uses ACES, so it is untouched unless someone edits it on purpose.

### Kerfur PLAY DEMO (`demo/kerfur-demo.js`)
- **Renderer.** Same flags (`:106-109`): ACES at the default exposure 1.0. RoomEnvironment PMREM at 0.04, not disposed (`:117-121`).
- **Lights.** Ambient 0.5, key 1.5, teal Point 1.6, fill Point 0.6 (`:122-126`).
- **Models.** Two procedural bodies, the main one and a mini peer (`:128-136`). Each comes from `makeKerfurBody` (`kerfur-model.js:18`): 3 MeshStandard (`:22-24`), a face MeshBasic with `toneMapped:false` (`:56`) and a spill PointLight each (`:62-63`). That is 4 point lights in total.
- **Lifecycle.** Same pattern (`:101-147`, `:501`, `:520`).
- `kerfur-face.js` is a 2D canvas (`:35-37`).

### ZMK-PointAccel demo (`demo/accel-demo.js`)
2D canvas only (`:4`, `:371-374`). No WebGL and no model.

### Hero under every demo
During a demo `.hv-stage` is set to `opacity:0 !important` (`demo/base.css:39`). Yet `shouldRender` (`project-page-lifecycle.jsx:180-183`) ignores `hv-demoing`, and `enterDemo` wakes the rig (`standard-page.jsx:285-291`). So the invisible hero keeps rendering every frame next to the demo's own renderer.

### Kerfur and Venovisor heroes
- **Kerfur** (`Kerfur.html:69-97`): procedural, `keepMaterials:true`, fit 3.4, pose {0.06, −0.38, 0}. The face is driven through the rig loop.
- **Venovisor** (`Venovisor.html:79-87`): `buildModel: makeNodeProxy`, fit 2.6, pose {−0.35, 0, 0}. It has a seam bridge (`:28-46`) and `bridgeSeam:true` (`:78`).

### Registries: the model block of every node

`mdl()` defaults are `ready:false`, `src:null`, `cardPose{fit:2.4}` and `handoffPose` set to the defaults (`projects.js:16-21`).

| addr | `projects.js` | `data.jsx` model | Page hero |
|---|---|---|---|
| 0x01 Wafer | `wafer_demo.glb`, rigFit 4.0, rigPose {−0.92,0,0}, **menuPose** {−0.28,0.08,−0.04}, card {2.9, {−1.15,0,0}} (`:31-38`) | `wafer_demo.glb` (`:21`) | `wafer-page.jsx:291` hard-codes `wafer_demo.glb`. Fit and pose are the rig defaults (`solid-hero-rig.jsx:52-53`). |
| 0x02 Kerfur | `mdl({rigFit:3.4})`, a proxy (`:47`) | none (`:177-220`) | procedural |
| 0x03 Iskra | iskra, 2.1, −0.2, card 1.05 (`:56-61`) | `:355` | equal |
| 0x04 Ci-Clop | ci-clop, 2.6, {0,0,1.5708}, card {1.25, {0,0,1.5708}}, **assignMaterial** {0x4b5a32, .28, .62} (`:70-76`) | `:280` | `Ci-Clop.html:66-82`: same assignMaterial, fit 2.6, **pose {0.5,0.35,−0.5} ≠ rigPose today** |
| 0x05 Venovisor | `mdl({rigFit:2.6})` (`:87`) | `null` (`:545`) | proxy |
| 0x06 Wafer Studio | wafer-mark, 2.1, −0.2, 1.05 (`:96-101`) | `:436` | pose x **−0.18** (`Wafer Studio.html:82`) |
| 0x07 Split HID | 2.8, {−.08,−.24,0}, card 1.60 (`:110-115`) | `:491` | equal |
| 0x08 PointAccel | zmk, 2.1, −0.2, 1.05 (`:124-129`) | none (`:226-263`) | `:72-74` |
| 0x09 Soft Off | 2.0, {−.18,.38,0}, card 1.0 (`:138-143`) | `:629` | equal |
| 0x0A, 0x0B, 0x0C | 2.1, −0.2, 1.05 (`:152-157`, `:180-185`, `:194-199`); 0x0B has `universe:false` (`:175`) | `:674`, `:719`, `:764` | equal |
| 0x0D Bulgaria | 2.1, −0.2, 1.05 (`:212-217`) | `:823` | pose x **−0.35** (`Bulgaria 2026.html:84`) |

### Who reads each field
- **`ready`**: `universe.jsx:35`, `project-handoff-rig.jsx:82`. `menu-objects.js` ignores it and checks `src` only (`:46`).
- **`src`**: `universe.jsx:35`, `project-handoff-rig.jsx:83`, `menu-objects.js:46-47`, and the lab's `materials-models.js:30-38`, which reads `window.MO_PROJECTS`.
- **`rigFit`**: `project-handoff-rig.jsx:78` (default 4.0), and `project-handoff.jsx:293`, where it sets the flight start scale.
- **`rigPose`**: `project-handoff-rig.jsx:79` (default {−0.35}), and `menu-objects.js:61` as the third fallback.
- **`cardPose.fit`**: `universe.jsx:36`, multiplied by 1.9 (default 5.0).
- **`cardPose.pose`**: `universe.jsx:37` (applied at `:995-996`), and `menu-objects.js:61` as the second fallback.
- **`menuPose`**: `menu-objects.js:61` only.
- **`handoffPose`**: `project-handoff.jsx:228`, `:377`.
- **`assignMaterial`**: `universe.jsx:38` (used at `:973`), `project-handoff-rig.jsx:84` (into `solid-hero-rig.jsx:163-165`), `menu-objects.js:51-52`, and the lab at `materials-models.js:44` and `:103`.
- **`MO_FEATURED_ADDRS`** (`projects.js:222`): the reel; the menu (`menu-objects.js:68-70`, where 0x01 is drawn at 2.15 and 0x03/0x04/0x06 at 0.68); and the build's fallback nav (`build.cjs:395-410`).
- **The `data.jsx` model string**:
  - The page warm-up (`data.jsx:956-959`). `hero.model` wins, and a `buildModel` suppresses it. `Wafer.html` has no `PAGE_CONFIG`, so it matches by pathname (`:946-955`) and **preloads `wafer_demo.glb`**.
  - The fallback in `project-page-lifecycle.jsx:80`.
- **Landing warm-up**: `core.jsx:48-49` warms the first `UNIVERSE_PROJECTS` entry that has a model, which is Wafer's `src`.

### How a proxy node becomes a model node, and where Venovisor is special-cased
1. `projects.js:87`: set `ready`, `src`, fit and poses. Also the comments at `:8-13` and `:227-229`.
2. `data.jsx:545`: the model URL and its comment.
3. `Venovisor.html:70,79-87`: drop `buildModel`, set `model`, fit and pose.
4. `build.cjs:191`: `{ projectHandoffRig: true }` is the only reason `makeNodeProxy` is in `venovisor-project.js`. The landing still bundles it for Kerfur (`build.cjs:49`).
5. `universe.jsx:100`: line art is drawn only when there is no model (Venovisor falls to the `default:` case; Kerfur has its own case at `:179`). The comment at `:947` names both.
6. `project-handoff-rig.jsx:82-88` switches on `ready && src` with no edit needed.
7. `project-handoff.jsx:343`: the comment "proxy nodes never flip ready" still holds for Kerfur.
8. The lab entry `materials-models.js:64-70`.
9. `AGENTS.md:722-723`.

## (2) How the NEW look maps onto these surfaces

**`projects.js`**
- **0x01**: `src` becomes the derived merged GLB. Keep rigFit, rigPose, menuPose and cardPose: `assemble()` returns a Z-up group "like `wafer_demo.glb`" (`lab/materials-wafer.js:229`). If a field such as `finish` is added, it needs a reader in the same change (`AGENTS.md:719-721`).
- **0x04**: `rigFit` 3.0, `rigPose` {0.45, 0.75, 0}, `cardPose` becomes `{fit:1.25}` with no pose (the lab's `cardNew` is `card().fit` = 1.25×1.9). Delete `assignMaterial`. The `src` path stays and the file is replaced.
- **0x05**: `ready:true`, `src:"models/venovisor-mark.glb"`, `rigFit` 3.7, `rigPose` {0.12, Math.PI+0.35, −0.62}. **`cardPose.fit` must be 4.9/1.9 ≈ 2.5789**, because `universe.jsx:36` multiplies by 1.9 while the gallery's 4.9 is already final (`materials-models.js:66`). `cardPose.pose` is the same as `rigPose`.

**`data.jsx`**
- `:21` becomes the merged URL. If it is missed, `Wafer.html` keeps downloading 631 KB of `wafer_demo` through the warm-up.
- `:545` becomes the Venovisor URL.

**Pages**
- `Ci-Clop.html:66-82`: remove `assignMaterial` (`:68-74`), set fit 3.0 and pose {0.45, 0.75, 0}. The comment at `:75-79` ("Venovisor 2.6, Split HID 2.8") goes stale.
- `Venovisor.html`: model, fit 3.7 and pose.
- Any new hero option (finish, LED mode) has to be added to the forwarding list in `project-page-lifecycle.jsx:79-88`, which today forwards only model, buildModel, pose, modelFit, assignMaterial and keepMaterials.

**Wafer defaults**
- `index.html:197`: the prefetch is hand-written. The build only rewrites the `wafer-page.js` prefetch (`build.cjs:502-512`), so this one needs a manual edit. The URL must match exactly to hit the prefetch cache.
- `wafer-page.jsx:291` and `solid-hero-rig.jsx:52`: the hard-coded and default `wafer_demo.glb`.

**Where the studio code can live**
- `app/projects/rendering/solid-materials.js` is already in every bundle: `build.cjs:80` (handoff pages), `:107` (standard pages), `:139` (All Projects), `:154` (Design System) and `:192` (Wafer). It is on the landing by tag (`index.html:270`) and in the gallery (`lab/materials.html:122`). `lab/models-handoff.md` §3 names it as the home.
- The build compiles with `sourceType:"script"` (`build.cjs:216-219`, `:237-239`), so the site file cannot use `export`. It needs `window.*` with a lab re-export shim.
- The deploy drops `*.jsx` (`deploy-pages.yml:59-62`), so a file loaded by tag must be `.js`.

**Torch and Kerfur demos**
- The GLB swap needs no change there.
- Bringing them onto the studio would mean editing `torch-demo.js:269-292` and `kerfur-demo.js:106-126`. See open question 1.

**Lab, so that the gallery reads the site's code**
- Who imports `./studio.js`:
  - `materials.js:33`
  - `materials-models.js:22`
  - `wafer.js:33` (STAGES, DARK_PAGE, TONE, NEUTRAL_GLSL, neutral, inverseNeutral, studioEnvironment)
  - `studio.check.mjs:6`
- `story.js:323` imports `./wafer.js` dynamically, so the story page depends on the studio transitively.
- `materials-models.js`:
  - The finishes move to the site: `venovisorGlow` `:124-167`, `softOffBleed` `:171-214`, `ciclopLeds` and `LED_MODES` `:218-245`, `finishNew` `:247-285`, plus `LOGO_STAGE` `:77-80`, `METALS` `:84-88`, `HW_STAGE` `:24`, `VENO_OLIVE` `:27` and `fitModel` `:90-96`.
  - The URL knobs (`LQ` at `:78`: `logoenv`, `metalenv`, `olive`) have to become constants on the site.
  - `srcNew`, `rigNew` and `cardNew` (`:45-47`, `:65-66`) fold into the registry.
- `materials-wafer.js`:
  - It imports three addons, `toCreasedNormals` and `FullScreenQuad` (`:24-25`). The site only gets addons through each page's module script (for example `index.html:241-251`).
  - It imports `mip.js` (`:26`), which lives in `lab/` and uses `import.meta.url` (`mip.js:148,151`).
- `materials.js` holds the site numbers: `useNeutral` `:80`, studio environment `:122-123`, field fill 4 `:117`, field ambient 1.0 `:166`, logo ambient 0.8 `:170`, `dress` `:171-179`, `setTone` `:128-139`.
- `materials.html:121-123` would need a tag for any new site script.
- `wafer.js:55,712` keeps reading the 53 files.

## (3) What could break

- **Ci-Clop's menu pose changes.** `menu-objects.js:61` falls back menuPose → cardPose.pose → rigPose. Removing `cardPose.pose` moves the menu mark from the 90° card pose to the rig pose.
- **Ci-Clop halos ignore the card fade.**
  - The universe makes only `o.isMesh` materials transparent and fadable (`universe.jsx:978-986`) and writes opacity only on change (`:2660-2663`).
  - The halos are Sprites, and their `onBeforeRender` sets opacity on every draw (`materials-models.js:239-242`) with `depthTest:false` (`:233`).
  - Result: the halos would not fade at the wrap and would draw over nearer cards.
- **Fit picks up glow objects.** `fitModelToSize` (`model-viewer.jsx:146-157`) uses `setFromObject`, which includes sprites and glow planes. The lab excludes `glow|halo|haze` (`materials-models.js:92`). The site fits before it sets materials (`universe.jsx:970-974`, `solid-hero-rig.jsx:152-170`), so a finish added before the fit shrinks the model.
- **Rig leaks.** The rig tracks only mesh materials (`solid-hero-rig.jsx:161-179`). Halo sprites and the finish canvases (Venovisor glow 512², bleed 256², halos 64²) are not disposed when the handoff rig calls `setProject`.
- **Stale cached GLB.**
  - GLB URLs carry no `?v=`, and Pages sets `max-age=600` (`lab/models-perf.md` §1). The registries are stamped, so a returning visitor can get the new registry with the old cached `ci-clop-mark.glb` for up to 10 minutes.
  - The old file has 0 materials, so it renders in GLTFLoader's default white, unnamed material, and no `BY_NAME` row matches it. It also brings back its embedded light.
- **Unstamped tag.** `index.html:270` loads `solid-materials.js` with no stamp; `stampDataAssets` covers 5 files (`build.cjs:378`). Edit it without stamping and the landing can run a fresh runtime against a cached helper.
- **Name collision.** The `<slug>-mark.glb` convention for slug `wafer` gives `models/wafer-mark.glb`, which already belongs to Wafer Studio (`projects.js:97`).
- **`studio.check.mjs:178-189` will fail.** It scans every `models/*.glb` except `wafer_demo.glb` and requires a `BY_NAME` row for every material name. A merged Wafer file brings 14 unmapped names: `case_black_anodized`, `cap_nylon`, `PaletteMaterial001`, `pcb_tex_L`, `pcb_tex_R`, `black_plastic`, `Nylon 12 (…)`, `black_nylon` and six `Opaque(…)`. The `.parts.glb` filter applies only to `lab/models`.
- **Tests that can trip:**
  - `hero-restore.test.cjs:84-95` runs `wafer-page.jsx` with only `makeWaferRig` stubbed (stub API at `:42-44`) and `PROJECT_DATA` `{addr,name}`. Any new global read at mount throws.
  - `model-decoder.test.cjs:15`: the loaded scene is `{clone}` only, so post-load traversal inside `ensureProjectModel` breaks it. It also pins the KTX2 retry behaviour.
  - `menu-renderer.test.cjs:12` calls `createMenuMotion({}, {}, {})`, so tone or environment setup at construction would throw.
  - `demo-audio.test.cjs:28-29` greps `sound.X(` in `demo/*-demo.js`.
- **Build.** `stampFallbackNav` runs `projects.js` in a vm with only `{window}` (`build.cjs:397`). The registry must not touch THREE or `document`. `Math.PI` is fine.
- **Look shifts.** Kerfur's MeshStandard body and the Kerfur flight's node-shell proxy shift under Neutral and the studio. The face is `toneMapped:false` and does not change.
- **Lab OLD pipe.** After the registry changes, `materials-models.js:34-44` and `:103-104` no longer reproduce today's site.

## (4) Performance notes

- **Torch and Kerfur demos.** No change from the port. Existing waste:
  - PMREMGenerators are never disposed (`torch-demo.js:283`, `kerfur-demo.js:119`). The studio disposes its own (`studio.js:167-169`).
  - The hero renders invisibly under every demo (§1). This is the cheapest lever: add `hv-demoing` to `shouldRender` (`project-page-lifecycle.jsx:180`). The heavier NEW hero would make this waste bigger.
- **Ci-Clop GLB.**
  - Raw size goes down: 134,248 → 115,124 B.
  - **Wire size goes up: gzip −6 is 74,434 → 85,250 B (+10,816 B, +14.5%).** The new file keeps float32 positions, which `lab/tools/pack-glb.mjs:5-6` does to preserve `_PRINTZ`. That needs a named reason or a repack with quantized positions, which nobody has tested.
  - Triangles 29,831 → 12,262; draws 7 → 4.
  - It carries no `KHR_lights_punctual` (I checked). Per `models-perf.md` §3.6 that cuts field programs from 21 to 12.
- **Venovisor.**
  - It replaces 0 bytes with 102,760 B wire (139,044 raw), 12,245 triangles and 3 draws.
  - That is +1 request on the field, the handoff and `Venovisor.html`.
  - The glow is a 512² canvas, about 1.3 MB of GPU memory with mips, created per instance (`materials-models.js:132-150`). Share it.
  - Dropping `projectHandoffRig` makes `venovisor-project.js` smaller.
- **Wafer KTX2.**
  - Today the parts are KTX2: the PCB is 110 KB and the palettes are 779 B and 669 B.
  - In the NEW look the PCB is a bare soldermask, and the palettes are read back once (`materials-wafer.js:66-80`) and replaced by DataTextures (`:95-109`).
  - A derived GLB without KTX2 would remove every KTX2 need on the site:
    - the `KTX2Loader` import on 9 routes (`grep -l KTX2Loader *.html`)
    - the throwaway detection context (`model-viewer.jsx:56-76`)
    - about 264 KB of transcoder requests
    - the menu's lazy KTX2 import (`menu-renderer.js:57-60,66`)
- **Wafer geometry.** `bake()` turns the parts into non-indexed float32 with creased normals at runtime. That is 128,792 × 3 vertices × 24 B ≈ **9.3 MB**, against 1.96 MB as loaded (`models-perf.md` §1). Pre-baking into the derived GLB avoids it.
- **Wafer panels.** They need `lab/mip.js` and `assets/Connected.svg` plus `assets/Peripheral.svg`: 57,415 B raw and 2 requests.
- **Per-frame CPU.** The added work is small:
  - the `printLines` hook on every draw (`studio.js:328-331`)
  - halo and haze `onBeforeRender`, a world direction and a world position per draw (`materials-models.js:161-164`, `:239-242`)
- **Unread part files.** After the port nothing on the site reads `models/wafer_parts/`, so excluding it from the deploy saves 1.14 MB of artifact. Runtime cost is zero either way.

## (5) Facts the architect must know

### Deploy
- `--exclude='lab/'` (`deploy-pages.yml:55`) is **staged, not committed**. `lab/` is untracked anyway, so the CI checkout never contains it.
- `models/` has no exclude and deploys as-is (`:49-63`).
- CI ships tracked files only (`:23`). The new GLBs and the untracked `assets/Connected.svg` and `assets/Peripheral.svg` ship only once the owner adds them to git.
- `checks.yml` and the deploy run only the build check and `npm test`. The lab checks are not in CI. A site-side studio check has to be a `tools/landing-runtime/*.test.cjs`.

### Baselines
- **`npm test`**: `ℹ tests 44 ℹ suites 0 ℹ pass 44 ℹ fail 0 ℹ cancelled 0 ℹ skipped 0 ℹ todo 0`.
- **`npm run check`** (exit 0):
  - "Landing runtime is current (9530e837e0e1, 19 source units)."
  - "Page runtimes are current (24 ordered phase bundles)."
  - "Generated HTML is current on 16 deployed root pages."
- **Lab checks**:
  - studio: `studio ok · 188 checks`
  - motion: `motion ok / track ok`
  - places: `places ok`
  - story: `story ok · 1159 checks`

No test pins poses, materials, tone mapping or renderer settings.

### The new GLBs
- **`lab/models/ci-clop-mark.glb`**:
  - nodes: `ci-clop`, `ci-clop-shell`, `led-white`, `led-red`
  - materials: `pla-olive`, `lens-clear`, `led-white`, `led-red`
  - attributes: `_PRINTZ`
  - required: quantization and meshopt
- **`lab/models/venovisor-mark.glb`**:
  - nodes: `body` (carrying `extras.ledRing`) and `led-0` to `led-7`
  - materials: `tpu-olive`, `tpu-button`, `led-red`
  - **it requires only `EXT_meshopt_compression`**

### Tone mapping
- The universe sets no tone mapping (`universe.jsx:575-607` uses `OutputPass` only), while the rig uses ACES 1.18 (`solid-hero-rig.jsx:67-68`).
- `useNeutral` patches the global `ShaderChunk` (`studio.js:117-132`). The site's `window.THREE` is a shallow copy (`index.html:248`), so the patch reaches the shared chunk object.
- On the landing, `index.html:272` (`runtime.js`) is blocking and runs before the module script (`:240-252`).

### `AGENTS.md` statements the port makes false
- **`:674`** "The material route is three-way". It becomes presets by material name (`BY_NAME`) plus a per-model finish, or `keepMaterials`.
- **`:676-680`** "`models/ci-clop-mark.glb` is the only one: 7 meshes, 0 materials… Keep the spec equal to `assignMaterial`". After the port no site GLB lacks materials. Delete it, or state that `assignMaterial` has no caller.
- **`:681-685`** "The default path clones every material and forces `envMapIntensity` to 1.9". It becomes a swap to presets at the stage's environment strength: logos 0.3, pearl 1.8, chrome 1, hardware 1 or `entry.env`.
- **`:686-688`** "tuned by `tuneRealMaterials`… lifts any base colour below 0.04 linear luma; `keyboard-display.opt.glb`'s near-black `module-body` is deliberately lifted by it". It becomes: `module-body` uses `matteBlack` (`studio.js:212`) on the hardware floor of **0.02** (`materials-models.js:24`); logos use floor 0.04 (`:77`).
- **`:722-723`** "Kerfur and Venovisor are the two left". It becomes "Kerfur is the one left".
- **`:725-733`** has three claims that stop holding:
  - "Run every incoming GLB through `npx gltfpack … -c`" is wrong for any `_PRINTZ` model. gltfpack 1.3 drops custom attributes; use `pack-glb.mjs`, which lives in untracked `lab/`.
  - "declares `KHR_mesh_quantization` and `EXT_meshopt_compression` as *required*" is false for Venovisor.
  - The merged Wafer is built with gltf-transform (`lab/perf/merge-wafer-parts.mjs`), and its name cannot follow `<slug>-mark.glb`.
- **`:470-474`** "`tuneRealMaterials`… shows the correct pattern". Point it at the studio's `apply` (`studio.js:259-263`) if `tuneRealMaterials` is retired.
- **`:652-656`** "the teal rim `PointLight` range" goes stale if the field drops `universe.jsx:385`.
- **`:104-124`** (an unstaged edit) should add the gallery reading the site's studio, and `node lab/studio.check.mjs`.
- `AGENTS.md` itself says nothing about ACES. Add the one-tone-curve rule and the side effect of the global chunk patch.

### Already out of step before the port
- Ci-Clop's page pose ≠ its `rigPose`.
- Wafer Studio and Bulgaria page poses ≠ the registry.
- The Kerfur flight shows the proxy, but the Kerfur page is the procedural body.

## (6) Open questions

1. Does "every place a model renders" include the procedural Ci-Clop and Kerfur PLAY DEMO scenes? They have their own ACES renderers. The torch mock (a metal tube with 4 LEDs) no longer looks like the new olive PLA, 2-LED Ci-Clop.
2. Should the lab's OLD pipe survive? It needs `wafer_demo.glb` and the old Ci-Clop file kept somewhere, or it gets retired.
3. Should Ci-Clop's menu mark keep its old pose (an explicit `menuPose`), or take the new rig pose?

=========

The landing and All Projects menu test runs are still going in the background. A monitor will report each shot as it lands.

=========

# Landing model surfaces: port map to the NEW look (Universe, work reel, handoff, menu, index.html, preloader)

**Answer to the key question.** Put the tone mapping inside the model materials. A hook replaces `#include <tonemapping_fragment>` with PBR Neutral, and the exposure (with `ev`) is a per-material uniform. The universe stays on `NoToneMapping`. This changes no pixel that is not a model and adds no shader programs. The two other options were checked and rejected (§2.1).

The about-board is out of scope. three r160 lines below refer to `three.module.js` and its addons, downloaded from unpkg into scratch.

---

## (1) Surfaces

### A. Universe: `app/landing/scenes/universe.jsx` (the work reel draws through this same scene)

**Renderer and output**
- WebGLRenderer, `alpha: true`. `antialias` is on only when there is no composer (301-307). DPR is capped at 1.5 (310). `outputColorSpace` is sRGB (312).
- No `toneMapping` is set anywhere in the file, so it is `NoToneMapping`.

**Composer**
- Order: `RenderPass` → `FastBokehPass` (when `GRADE.dof && !_veryWeak`) → cursor `mirrorPass` → `effectPass` → `OutputPass` (579-607).
- Composer DPR is 1.25 at ≤760 px wide, otherwise 1.5 (424).
- The composer targets are HalfFloat (EffectComposer.js:27).
- `OutputPass` only converts to sRGB, because `renderer.toneMapping` is None (OutputPass.js:50-63).
- Because the target is not the canvas, three gives every material `NoToneMapping` (three.module.js 20716-20726 and 30147-30157). Model output today is linear and clips.

**Background, fog, environment, lights**
- `scene.background` is a 512² canvas: `#04060d` plus a teal radial (337-352). Fog is `Fog(0x04060d, 22, 38)` (357).
- `scene.environment` is RoomEnvironment through PMREM, sigma 0.06 (364-381). That is 768×1024 RGBA16F, about 6.3 MB (PMREM `_allocateTargets` at 16518).
- Lights: Ambient 0.9 (360), Directional 1.6 at (2.4, 3.2, 2.6) (382), teal Point 1.6, range 36 (385).
- **Every non-model material here is unlit**: tiles, dust and the backdrop are MeshBasic; stars and assembly are Points; the constellation is a ShaderMaterial (774, 925, 1152, 1337, 1372). In r160, `scene.environment` only reaches `isMeshStandardMaterial` (20602, 30138). So the environment and all three lights affect model pixels only.

**Model load**
- Registry adapter (26-41): `model = m.ready ? m.src : null`, `modelFit = cardPose.fit * 1.9` (default 5.0), `modelPose = cardPose.pose`, `assignMaterial`. Records with `universe: false` are filtered out (27).
- Job queue (862-1014): two idle background slots. The first project (Wafer) starts immediately (1013). Hover, focus and click promote a job (918, 2405, 2131).
- The job (965-1004) runs `loadProjectModel(src)`, which is a cached `root.clone(true)` (model-viewer.jsx:120-122). Then `fitModelToSize(root, fit)` (970), which uses `Box3.setFromObject` and therefore includes sprites and glow meshes (model-viewer.jsx:146-157).
- Material pass: `applySolidMaterials` (973), else `tuneRealMaterials` with env 2.2, which clones each material and lifts luma below 0.04 (974; solid-materials.js:31-61).
- Then every mesh material is set `transparent = true` (978-987). The pose goes on a wrapper `poseGroup` (995-998).
- Kerfur and Venovisor have no model; their line art is painted into the card canvas (100).

**Per frame**
- The holder sits at the tile position plus 1.4 toward the camera, with a yaw turntable. The fade is `min(1, tileBase·1.15) · 600 ms load fade`. `visible = op > 0.02`. Opacity is written to `fadeMaterials`, which holds **meshes only**. Scale is 0.85 idle and 1.10 when focused (2632-2670).
- The work reel is the same tiles in `mode === "reel"` (1090-1131). `work.jsx` draws no 3D; it is captions plus `tileBounds()` for the flight origin (work.jsx:1-12, 386-400; universe.jsx 1920-1933, which uses `modelViewportBounds` = `Box3.setFromObject(holder)` at 2058-2085).

**DOF prepass** (534-551)
- `scene.overrideMaterial = materialDepth` (MeshDepthMaterial). It runs at half resolution, every 2nd frame (`dofDepthEvery: 2`, 411).
- r160 draws every visible render item with the override (`renderObjects` 29933-29941). So each visible model mesh and sprite adds **one depth draw per prepass frame**. Model `onBeforeCompile` hooks never run there.
- Depth programs: plain, plus an instanced variant while wafer_demo's 36-key InstancedMesh exists.
- The transparent DoubleSide two-pass rule (29963) does not apply to the depth pass.

**Compile and warm-up**
- There is no `compile` or `compileAsync`. Programs compile on the first frame a model is visible.
- The DOF probe discards 30 frames and then averages 90 (657-676).

**Lifecycle**
- One RAF chain. It sleeps when off screen (IO), hidden, paused, or under the menu (2328-2347, 316-328, 2349-2376).
- `menuObjects.frame` takes over the loop while the menu is open (2397-2401).
- Dispose: 3167-3235. Meshes only, so sprites and textures are left to `forceContextLoss` (3203).

### B. Handoff: `app/landing/transitions/project-handoff.jsx`, with `project-handoff-rig.jsx` and `solid-hero-rig.jsx`

**Rig**
- One reusable second WebGL context. It is primed after `mo:first-frame` with the first registry node, Wafer, via `makeNodeRig(..., deferModel)` (76-121, 149-176).
- When it has painted twice it fires `mo:handoff-warm`, which the preloader waits on.
- Hover pre-warms after 90 ms (156-166).
- `makeNodeRig` (project-handoff-rig.jsx:73-138): fit = `model.rigFit || 4.0`, pose = `rigPose || {x: -.35}`, plus `assignMaterial` if set. A node that is not ready gets `makeNodeProxy` with `keepMaterials` (75-90). It also sets `preserveDrawingBuffer: true` (94).
- `makeWaferRig` (solid-hero-rig.jsx):
  - Renderer: AA on, DPR ≤2, `alpha: true`, default clear alpha 0 (three 14838), ACES at 1.18 (58-68).
  - Environment: RoomEnvironment PMREM, sigma 0.08 (79-99).
  - Lights: Ambient 0.85, key Dir 2.3, teal rim Point 3.0, fill Point 1.0, top Dir 0.9 (102-107).
  - `ingest` fits **before** the material pass (153), then `applySolidMaterials`, or else `tuneRealMaterials` with env 1.9 (163-173).
  - Default model URL is `models/wafer_demo.glb` (52).
  - `setModel` reuses the renderer, lights and environment (191-234).

**Forward flight** (221-360)
- Start scale = `originRect.h/vh · frustumH / rigFit` (291-298). `originRect` is the model's projected box.
- Release comes after two painted frames or 900 ms (321-344).
- The seam JPEG is captured with `captureFrameAsync`, then the page navigates (242-265).

**Reverse flight** (363-468)
- Resolves the node through `MO_PROJECT_BY_ADDR`, which is unfiltered (370), then `snapHandoff` plus the seam yaw (395-396).
- Holds at least 620 ms and until two frames have painted, capped at +900 ms (446-461).
- The stale `wafer_demo` comment ("802 KB / 94k tris / KTX2") is at **442**.

**Seam**
- Size and pose continuity relies on the registry `rigFit`/`rigPose` matching the page's `PAGE_CONFIG.hero`. The material, tone, environment and lights must also match, because both sides run `makeWaferRig`.
- **Ci-Clop already mismatches today.** The registry has `rigPose {0, 0, 1.5708}` (projects.js:73). `Ci-Clop.html:80-81` has `pose {.5, .35, -.5}`. The fit, 2.6, agrees.

### C. Menu: `app/shared/menu-objects.js` and `menu-renderer.js`

**Models and look**
- Models: `MO_FEATURED_ADDRS[0]` (Wafer) at size 2.15, plus 0x03, 0x04 and 0x06 at 0.68 (68-70). Plus the procedural switch (MeshStandard, scene-objects.js:4) and the 0x00 points (`toneMapped: false`, 91).
- Material pass: `applySolidMaterials`, or `tuneRealMaterials` at 1.6, **then** fit (51-59). Pose order is `menuPose || cardPose.pose || rigPose` (61).
- Lights: Hemisphere 2.2, key Dir 3.4, teal Dir 1.8 (12-16).
- Orthographic camera. `scene.environment` is borrowed from the host (9).

**Renderer lease**
- On the landing it borrows the Universe renderer and environment (universe.jsx:1896).
- `open` saves the renderer state, then sets ACES at **1.25** and clear alpha 0 (139-147). `close` restores it (122-133).
- It renders direct to canvas, so tone mapping does apply.
- At most 30 fps, and only while moving (175-236).

**Other routes**
- Project pages: the hero rig's `getMenuMotion` (solid-hero-rig.jsx:308-315).
- Text pages: `createStandaloneMenuMotion` (menu-renderer.js:73-87). It creates its own renderer and RoomEnvironment PMREM (75-82), and dynamically imports RoomEnvironment and KTX2Loader (57-69).
- Cost on non-Wafer routes (models-perf §2): 1,000,819 B in 7 requests, 89% of it wafer_demo plus the transcoder.

### D. `index.html`
- Prefetches `models/wafer_demo.glb` with `as=fetch crossorigin` (line 196).
- The module script (≈239-255) imports GLTFLoader, MeshoptDecoder, **RoomEnvironment**, EffectComposer, RenderPass, BokehPass, ShaderPass, OutputPass and **KTX2Loader**. It puts them on `window.THREE` and fires `mo:three-ready`.
- Classic scripts that follow: React, `projects.js`, audio, `solid-materials.js`, `pointer-effects.js`, `runtime.js`. Modules are deferred, so `runtime.js` runs first and mounts on `mo:three-ready` (app.jsx:254).

### E. `app/landing/preloader.js`
- Draws no model and compiles nothing.
- Gates: `universe`, `frame`, then `handoff` (`mo:handoff-warm`, or a 1.8 s fallback at 151-155). Bailout at 9 s (252).

---

## (2) How the NEW look maps onto each surface

### 2.1 Key question: tone for the models only, inside the composer

**Options compared**
- **A. In-material tone (recommended).** Per material, after the presets and finishes:
  - Wrap the existing hook: `prev = m.onBeforeCompile; m.onBeforeCompile = (sh, r) => { prev.call(m, sh, r); ... }`.
  - Inject `NEUTRAL_GLSL` (studio.js:114) after `#include <common>`.
  - Replace `#include <tonemapping_fragment>` with `gl_FragColor.rgb = max(neutral(gl_FragColor.rgb*uExposure),0.)`.
  - `sh.uniforms.uExposure` is one shared `{value: TONE.exposure * 2**ev}` per model, and `uToe` is shared.
  - Set `m.customProgramCacheKey = prevKeyString + "|neutral"`.
  - Skip materials with `toneMapped === false` (the Ci-Clop LED domes, materials-models.js:221).
  - Why it is correct:
    - `uExposure` is a uniform, so one program serves every `ev`. Uniforms live per material (`getUniforms`, 30034), the program is shared by cache key (`acquireProgram`, 30040), and `_currentMaterialId` resets every frame (29650).
    - Fog is applied after tone mapping (the physical fragment order is tonemapping → colorspace → fog), so models fade into the same untoned `#04060d` as the cards.
    - `OutputPass` keeps doing sRGB, so the maths matches a canvas render.
    - It ignores `renderer.toneMapping`, so the universe, the flight rig, the page hero and the menu all give identical output. That is exactly what the seam needs, and it removes the need for `useNeutral`'s global ShaderChunk patch.
  - Programs: **+0** over the same materials without the hook.
  - Cost: about 15 ALU per model fragment, cheaper than ACES.
- **B. Separate model layer.** Rejected.
  - three still won't tone map into a render target, so it needs a custom composite.
  - It needs an extra HalfFloat target at about 1920×1080×1.5², roughly 37 MB, plus a full-screen pass every frame.
  - It breaks the interleaving with transparent cards, dust and DOF depth.
  - There is a single exposure unless you add per-model passes.
- **C. Whole Universe on Neutral.** Rejected.
  - r160 `OutputPass` has no Custom branch (OutputPass.js:59-63).
  - It tone maps every pixel, after CA and the cursor lift. Computed with studio's `neutral()`: void `#04060d`→`#000209`, card `#0d1018`→`#000410`, stars `#5b6478`→`#48536b`, teal `#00f0c8`→`#0eecc5`. This breaks constraint 6.
  - It allows only one exposure, so no per-model `ev`.

**Gotchas for A**
- The default `customProgramCacheKey` returns `onBeforeCompile.toString()` (9215). Read the previous key string **before** wrapping. Otherwise every wrapped material shares one key, and grain, printLines and bleed variants would reuse the wrong program.
- Studio's hooks *assign* `onBeforeCompile` (studio.js:305, 339; materials-models.js:198). Apply the tone hook last.
- Never combine A with `useNeutral` on the same renderer. Both define `neutral()` and `uToe`, which is a GLSL redefinition error.

### 2.2 Edit points

**Universe (universe.jsx)**
- 364-385: replace RoomEnvironment and the three lights with `studioEnvironment(void env, fill 4)` plus `AmbientLight(1.0)`. Remove the Dir 1.6 and the teal Point.
  - Return or dispose the PMREM *target* and the room meshes. The lab version leaks both (studio.js:144-170). The dispose code at 3185 expects a target.
- 26-41: the adapter keeps fit = `cardPose.fit * 1.9`.
  - Registry changes: Ci-Clop `cardPose: {fit: 1.25}` with the pose removed.
  - Venovisor `cardPose.fit` must be **4.9/1.9 ≈ 2.579**, because the gallery's 4.9 is already multiplied. Its `cardPose.pose` = `rigPose` = `{.12, π+.35, -.62}`, `rigFit 3.7`.
  - Ci-Clop `rigFit 3.0`, `rigPose {.45, .75, 0}`. Remove `assignMaterial` from `projects.js:75`.
- 965-1004: change the order to **finish → fit → transparent → tone hook → pose**.
  - `venovisorGlow` and `ciclopLeds` read world positions from an un-fitted root (materials-models.js:126-130). Fit-first misplaces the glow.
  - Fit must exclude glow, halo and haze objects, as gallery `fitModel` does (materials-models.js:90-96). `fitModelToSize` counts sprites (Box3 4769ff).
  - Replace `assignMaterial`/`tuneRealMaterials` with the site's finish: logos get presets with `LOGO_STAGE` and `METALS`; hardware gets `HW_STAGE` plus `venovisorGlow`, `softOffBleed` or `ciclopLeds("subtle")`.
- 2645-2664: the fade must also drive sprite and halo opacity. See §3.
- 947-948 comment: Venovisor no longer uses line art. 100 goes automatic once `ready: true`.

**Handoff and rig (shared with the page hero; must change in lockstep)**
- `solid-hero-rig.jsx`:
  - 67-68: renderer tone becomes irrelevant to models under A. Keep ACES for `keepMaterials` content (Kerfur, proxy).
  - 79-107: rig studio environment (void, fill 1.4).
  - **Always** two Directionals (rim `0xdfe8ff` at (-3.2, 2.2, -3.0); key white at (2.5, 3.4, 2.6)) plus Ambient. Set intensities per `setModel`: Wafer rim 2.2 / key 2.5; logos ambient 0.8; others 0. A constant light count means `setProject` causes no recompiles.
  - 151-173: finish → fit (excluding glow) → tone hook.
  - 52: drop the `wafer_demo` default.
- `project-handoff-rig.jsx:84`: the `assignMaterial` branch can go once no record uses it.
- `project-handoff.jsx:437-445`: rewrite the comment.

**Menu**
- `menu-objects.js` 12-16: lights become the field dress (env plus ambient; per-model lights cannot exist in a multi-model scene).
- 51-59: the same finish, fit-excluding-glow and tone hook.
- 146: ACES 1.25 becomes moot for models. Hook the switch too, so the menu has one curve.
- `menu-renderer.js` 66-67, 79-80: replace RoomEnvironment with `studioEnvironment`. Drop the KTX2Loader import if the Wafer delivery has no KTX2.

**index.html**
- 196: point the prefetch at the new merged Wafer file, keeping `as=fetch crossorigin`.
- Module imports: drop `RoomEnvironment` once the universe, rig, about-board and menu stop using it. Drop `KTX2Loader` if no landing GLB carries KTX2. That also removes the `detectSupport` throwaway context (model-viewer.jsx:60-76).
- Studio code must reach classic code: either as a classic unit in `build.cjs` `landingSourceFiles` and in the page definitions that include `SOLID_MATERIALS` (build.cjs:40-60, 89-120), or as a `window.MOStudio` script before `runtime.js`.
  - `lab/studio.js` is ESM with `export`, and `lab/wafer.js:33` and `studio.check.mjs:6` import it. The gallery should read the site global instead.

**Preloader:** no edit. Its handoff gate now waits on the new Wafer; see §3.

---

## (3) What could break, and why

1. **Ci-Clop LED halos ignore the card fade.** They are Sprites, so they are missing from `fadeMaterials` (979). Their `onBeforeRender` also rewrites `material.opacity` every frame (materials-models.js:239-242). They show at full strength through the arrival, wrap and load fades while the body is near-invisible, until `op ≤ 0.02`. `depthTest: false` makes this worse. Fix: multiply the halo opacity by a holder fade in `userData`.
2. **Finish/fit order.** Fitting before `venovisorGlow` places the glow and haze at doubly transformed positions. Fitting with sprites or the glow plane included shrinks the model and distorts `modelViewportBounds`, which skews the flight `startScale` (handoff 298). The glow plane is about 0.062 m against a roughly 0.1 m body.
3. **Venovisor glow on alpha canvases.** The hero, handoff and menu canvases have clear alpha 0. The plane's `AdditiveBlending` is `blendFunc(SRC_ALPHA, ONE)` and applies to alpha too (three 23350). Its black-filled texture (alpha 1) draws an opaque black square over the page. Use Ci-Clop's CustomBlending, which leaves destination alpha alone. Inside the universe composer it is harmless: the effect pass writes alpha 1.
4. **Cache-key collision** if the tone wrapper inherits the default `toString` key (§2.1).
5. **`useNeutral` plus the in-material hook** on one renderer gives a GLSL redefinition error.
6. **Seam pop.** Any difference in environment, lights, tone, finish, fit or pose between `makeNodeRig` (registry) and `PAGE_CONFIG.hero` shows at navigation. Ci-Clop's pose mismatch already exists; set `{.45, .75, 0}` and fit 3.0 in both places. The Wafer is safe only if the parts assembly stays Z-up and its longest edge equals wafer_demo's.
7. **Reverse flight drops the Wafer.** A runtime bake (`toNonIndexed` + `toCreasedNormals` over 128,792 tris, materials-wafer.js:111-126) on a cold return can exceed HOLD + 900 ms (handoff 450). The flight then dissolves with nothing flying home, which is the exact failure the 437-445 comment describes. The preloader's 1.8 s handoff fallback also binds more often, leaving a cold path on the first Wafer click.
8. **Panels on the site.** `loadScreens` needs Montserrat (mip.js:145), which only the lab loads (`lab/materials.html:16`). AGENTS forbids a per-page font. It also fetches `assets/Connected.svg` and `assets/Peripheral.svg`, which are untracked in git, about 20 KB gzip in 2 requests.
9. **`readPalette`** needs the KTX2 palette textures and does a synchronous `readRenderTargetPixels` GPU stall (materials-wafer.js:67-80). That keeps the transcoder on the landing.
10. **Presets drop `side`.** No sealed mark is double-sided. wafer_demo's four `[2S]` materials go away, which is a loss of back faces only where geometry is open. The gallery look was approved with FrontSide.
11. **Dispose.** Universe dispose calls `obj.material?.dispose()`. A merged-by-material mesh with a material *array* would throw there, so keep one material per mesh. Finish textures (glow 512² canvas, bleed, halos, palettes) are not disposed explicitly and rely on context loss.
12. **The menu environment differs by route.** It is the field environment (fill 4) on the landing and the rig environment (fill 1.4) on project pages, so the menu looks different per route unless one is chosen.

---

## (4) Performance

### Measured: NEW field tier in the lab gallery

Headless SwiftShader, every material transparent, studio environment plus ambient, excluding Wafer:

| model | draws | sprites | programs | tris |
|---|---:|---:|---:|---:|
| iskra | 2 | | 2 | 3,472 |
| ci-clop | 6 | 2 | 5 | 12,262 |
| wafer-studio | 1 | | 2 | 5,536 |
| split-hid | 3 | | 3 | 19,092 |
| zmk | 49 | | 3 | 10,556 |
| soft-off | 4 | | 3 | 3,744 |
| sightseeing | 13 | | 3 | 2,876 |
| brionel | 1 | | 2 | 17,966 |
| bulgaria | 5 | | 3 | 2,388 |
| venovisor | 4 | | 5 | 12,247 |

- **12 unique programs** across the 10 models, including the tile's.
- Today: 21 programs (+4 baseline), or 12 without the Ci-Clop light (models-perf §3.6).
- The new Ci-Clop and Venovisor GLBs carry no `KHR_lights_punctual` (checked). That removes the +9-program recompile and the lighting step when the card arrives.
- In SwiftShader, compiling Wafer Studio's iridescence alone took about 213 s. A real GPU will be far faster, but it is the heaviest program on the landing, and it already exists today because wafer-mark is iridescent.

### Draws, Universe main pass
- Today: 90 meshes. wafer_demo's double-sided materials are drawn twice under forced transparency (three 29963), so the real figure is about 95.
- NEW without the Wafer: 88. Ci-Clop goes 7 → 4 meshes + 2 sprites. Venovisor adds 3 + 1 glow plane.
- Wafer from the merged parts: 60 meshes + 2 panels. Merged by material at load: about 17 draws (38 ms once).
- Runtime material merge of zmk (49 → 2) and sightseeing (13 → 3) needs no sealed-file edit. With it the field totals roughly **50 vs 95**.
- The depth prepass mirrors the visible model draws every 2nd frame, so the cut halves there too. Removing wafer_demo also drops the instanced depth-program variant.

### Lights and shaders
- Field: today Ambient + 1 Directional + 1 Point. NEW: Ambient only, which is cheaper per fragment.
- Rig: today 2 Directional + 2 Point. NEW: 2 Directional (intensity 0 when unused) + Ambient.
- The grain hook adds about 8 hash/sin per fragment on anodised and PBT surfaces. Neutral costs about 15 ALU.

### GPU memory, per context
- PMREM: an equal swap (6.3 MB each).
- Wafer card today: 13.0 MB, of which the two PCB KTX2 textures are 11.2 MB.
- NEW soldermask has no map, so it needs **0 MB of textures if the delivery file omits them**.
- The lab's runtime bake produces float, non-indexed geometry: about 386k vertices × 24-32 B ≈ 9-12 MB. That is per context: universe, handoff and the explosion. The audit measured the merged quantized form at 1.96 MB as loaded. **Bake the creased normals offline into the derived GLB** to save about 11 MB per context and the main-thread `toCreasedNormals` time.
- New textures: Venovisor glow 512² (~1.4 MB with mips), soft-off bleed 256², halos 64².

### Bytes and requests (wire)
- Ci-Clop: +9.9 KB (76,284 → 86,200).
- Venovisor: +104 KB (new).
- Wafer, measured: merged 710,788 vs wafer_demo 630,153.
- Wafer, estimate: a delivery without the PCB KTX2 would be about 0.5 MB. With no KTX2 on the landing at all, these also go: `KTX2Loader.js` (12 KB), ktx-parse, the transcoder js and wasm (264 KB, 3 requests), and the `detectSupport` context.
- Menu on other routes, estimate: about 1.0 MB in 7 requests becomes about 0.6 MB in 3.
- Dropping the RoomEnvironment import saves one module request.

### Per-frame CPU
- Halo `onBeforeRender`: 2 per draw, a few µs each.
- `printLines` `onBeforeRender`: trivial.
- The tone hook has no per-frame cost: the cache key is only computed when a program is built.
- No new RAF; everything inherits the Universe's sleep.

---

## (5) Facts the architect must know
- Every lit material in the Universe is a model, so the environment and lights can change freely without touching cards, dust, stars, the constellation, the void colour, DOF, CA or vignette.
- The seam is the same `makeWaferRig` on both sides. Put the new look in the shared rig and the material pass, never in `project-handoff.jsx`.
- The handoff rig loads the Wafer into a **second context** at landing load. GPU cost is paid twice. The parse is shared through `_gltfCache`.
- The lab Wafer pipeline needs these, which the site should do offline in the derived file:
  - `BufferGeometryUtils` (a new module request)
  - `FullScreenQuad` plus a GPU readback
  - KTX2 palettes
  - Montserrat and two SVGs
  - Wanted in the file instead: pre-split creased normals, precomputed palette entries, the two 68×160 panel images, and no PCB textures.
- Stale docs and comments to update: AGENTS "Ci-Clop 7 meshes, 0 materials" and "Kerfur and Venovisor are the two left"; `projects.js:227-229`; `universe.jsx:947`; `project-handoff.jsx:442`; and the lab gallery's OLD pipe, which reads `tuneRealMaterials` and `applySolidMaterials` from site code.
- Measurement script: `scratchpad/port/field-programs.cjs`.

## (6) Open questions
1. Which environment does the menu use: field (fill 4) or rig (fill 1.4)? It should be one choice for every route.
2. Should the menu's procedural switch get the Neutral tone, or keep ACES 1.25?
3. May the derived Wafer delivery drop the KTX2 PCB and palette textures and bake the panels and normals offline? That is the difference between the Wafer being lighter or heavier on every surface.
4. Is runtime merge-by-material acceptable for the Universe-only Wafer card, zmk and sightseeing? It doubles geometry bytes on those (floats) in exchange for about 45 fewer draws.

=========

# Wafer surfaces and both explosions: port map for the NEW look

The 53 parts match `wafer_demo.glb`'s frame exactly, so no pose correction is needed. The explosions are the one thing that does shift: they measure loose bounding boxes today (section 3, item 1). All scratch probes and outputs are in `/home/oleksandr/projects/Portfolio-workspace/portfolio/lab/port/wafer/`: `probe.html`–`probe5.html` with `.json` results, `run.cjs`, `crease.mjs`, `strip2.mjs` and the `out/*.glb` files. Nothing in the repo was written.

**Timing caveat.** The machine was at load average 34–43 on 20 cores during the probes. The audit's whole-Wafer decode baseline is 64–74 ms; mine read 103–166 ms. Treat every millisecond figure below as about 2× inflated. Byte, draw-call, program and memory figures are exact.

## (1) Surfaces

**Universe card** (`app/landing/scenes/universe.jsx`)
- **Model and framing.** Model comes from the registry, `m.src` at 35. Fit is `cardPose.fit*1.9` = 5.51 (36); pose `{x:-1.15}` (37). It is applied on a wrapper group, not the root (995-996).
- **Renderer.** `alpha`; antialias only without the composer (305-306); DPR ≤ 1.5 (310). No tone mapping anywhere: the composer's `OutputPass` (607) only converts to sRGB.
- **Environment and lights.** RoomEnvironment PMREM at 0.06 (364-381). Ambient 0.9 (360), directional 1.6 and a teal point light 1.6 (382-385). Fog 22→38 (357).
- **Materials.** `tuneRealMaterials` clones every material at env 2.2 (974), then all are set `transparent` for the fade (976-987).
- **Lifecycle.** An IntersectionObserver gates the loop (319-328). Models load through a 2-slot idle pump; the greeting card (Wafer) starts immediately (1013).

**Handoff rig** (`app/projects/rendering/project-handoff-rig.jsx` and `app/landing/transitions/project-handoff.jsx`)
- `makeNodeRig` wraps `makeWaferRig` with `rigFit`/`rigPose` from the registry (75-90) and `preserveDrawingBuffer: true` (94).
- It is warmed at landing boot with the greeting project (Wafer). `prepareRig` paints twice, then fires `mo:handoff-warm` (76-121, gating the preloader). It can swap models on hover through `setProject`.
- The seam capture is a JPEG data URL (107-136, 240-265). The flight's start scale is computed from `rigFit` (291-298).

**Wafer.html hero** (`app/projects/pages/wafer-page.jsx` and `app/projects/rendering/solid-hero-rig.jsx`)
- **Model and framing.** The page calls `makeWaferRig(mount, {model:"models/wafer_demo.glb"})` with no fit or pose (wafer-page 291), so it uses the defaults `RIG.modelFit` 4.0 and pose `{x:-0.92}` (rig 34-43).
- **Renderer.** Antialias, DPR ≤ 2, ACES at 1.18 (58-69).
- **Environment and lights.** RoomEnvironment at 0.08 (79-99). Ambient 0.85, key directional 2.3, teal rim point 3.0, fill point 1.0, top directional 0.9 (102-107).
- **Materials and fit.** `fitModelToSize` uses a loose `Box3` (rig 153; model-viewer.jsx 146-157). `tuneRealMaterials` clones at env 1.9 (166-173).
- **Lifecycle.**
  - The seam snap is at 308-342. The loop sleeps when hidden, under the menu, or scrolled past 0.74 vh (354-373).
  - It does **not** sleep during PLAY DEMO: `shouldRender` lacks `hv-demoing` while `demo/base.css:39` sets `.hv-stage` to opacity 0. The hero therefore renders invisibly under the demo, which breaks the AGENTS lifecycle rule; this predates the port.
  - Warm-up comes from `PROJECT_DATA["0x01"].model` (data.jsx 21, 943-962).

**Menu** (`app/shared/menu-objects.js`)
- Wafer is `featured[0]` at size 2.15 (69), posed with `menuPose {-0.28, 0.08, -0.04}` (61-62).
- `tuneRealMaterials` at env 1.6 (51-56). Lights are a hemisphere 2.2, key 3.4 and teal rim 1.8 (12-16).
- The menu leases the host renderer and forces ACES at 1.25 (139-147). `menu-renderer.js:59-67` lazily imports `KTX2Loader`, and only because of the Wafer.

**Board-flight explosion** (`app/landing/scenes/about-board.jsx`)
- **Loading.** `buildWaferReal` loads **53 URLs by file name** through `loadProjectModel` (688-693; each part `.catch(()=>null)`).
- **Framing.**
  - Axes come from a **loose** `Box3` of the raw parts (702-712).
  - Each part gets `vec` = `WAFER_H[kind]*base*0.35` up plus 0.4× its horizontal offset (686, 714-719).
  - The assembly is aligned UP→+Y, LONG→+X and scaled 13/base (724-730).
- **Materials.** Every material is cloned and made `transparent` with env 1.2 (722).
- **Explode.** Driven within ±0.109 of the explode stop's t value: `ex = 1-|t-T|·9`, eased, `×WAFER_EXPLODE 0.30`. Opacity follows, and the group spins at `dt·0.0004` (926-941).
- **Renderer.** No antialias, DPR ≤ 1.25, **ACES at 1.05** (748-753). RoomEnvironment at 0.04 (760-777). Fog 55→150 (758).
- **Lights.** Key directional 2.2, blue fill 0.5, teal point light (intensity 60, decay 2), ambient 0.25 (784-787). These, the environment and the tone curve also light the procedural PCB, stars and parts, which count as **non-model content**.
- **Disposal.** `dispose()` traverses the whole scene and disposes **every geometry and texture**, including the cache-shared Wafer geometry and its PCB/palette textures (953-982). Board-flight builds lazily near the section and sleeps by `presRef`, hidden tab or menu (`board-flight.jsx` 98-118).

**PLAY DEMO** (`demo/wafer-demo.js` and `demo/wafer-board.js`)
- **Renderer.** Antialias, alpha, **`preserveDrawingBuffer: true` with no reader** (75), DPR ≤ 2, ACES at 1.06 (78-79).
- **Environment and lights.** RoomEnvironment PMREM; the generator is never disposed (87-92). Ambient 0.42, key directional 1.25, teal rim point 1.5, fill point 0.55 (93-97).
- **Lifecycle.** The scene is built once and never disposed. The loop renders every frame while active, with no menu or dirty gate (299-323).
- **Board build.** `wafer-board.js` loads **53 URLs** (27-41, 158-166). It uses the same loose-box axis maths (174-208) with `TARGET_FIT` 3.6 (97), travel = `base·0.002` (195), and the `LAYER` table plus stagger for the explode (84-95, 354-367).
- **Keys.** Each key gets a **cloned** cap material with teal emissive for press, hover and sweep (245-252), plus a 128² canvas legend in Geist Mono (140-149, 254-267). Structural parts are also cloned, at env 1.3 (296-302). X-ray mode clones once more (332-340).
- **Part lookup.** Everything goes by file name: `kindOf`, `parseKey` (102-112).

**Shared**
- `model-viewer.jsx` holds one cache per page keyed by URL; it returns `root.clone(true)`, which shares geometry and textures (20, 83-122).
- `getKTX2Loader` makes a throwaway WebGL context (56-77).
- `index.html:197` prefetches `wafer_demo`. `index.html:250` and `Wafer.html:64` statically import `KTX2Loader`.

## (2) How the NEW look maps onto each surface

**Delivery** (one URL, consumed by universe, handoff, hero, menu, board and demo)
- Build the merged file (`merge-wafer-parts.mjs` reproduces 945,748 B byte for byte).
- Add a pass that strips all 6 textures, keeping UVs on switches and display. The NEW look samples none of the textures: PCB is bare `soldermask` (materials-wafer.js 297), and the palettes are rebuilt from the `SWAP` table (298-299).
- Bake the 40° creased normals offline in **millimetres**. r160 `toCreasedNormals` hashes positions at 0.01 units, so baking in metres would weld everything closer than 1 cm.
- Re-index, then `gltfpack -cc -kn -km`.
- Measured result: **834,896 raw / 615,849 B wire**. All 53 names resolve and the key mesh stays shared. Only meshopt and quantization are required, and it loads with **no KTX2Loader** (probe5). GPU geometry is 2.28 MB.

**Constants in place of runtime GPU work**
- Palette tables, taken from `swapEntries`; `*` marks the active area:
  - `switches_L`: d2d4d8 e6dcc4 d2d4d8 c9cbce a6a8ac c9cbce efe8d8 a6a8ac e8cba4 a6a8ac ×7
  - `switches_R`: c9cbce d2d4d8 a6a8ac e8cba4 efe8d8 e6dcc4 d2d4d8 a6a8ac c9cbce a6a8ac ×7
  - `display_L`: b8742a 0d0e10 18191c babdb8* 111213 0d0e10 ×3
  - `display_R`: 18191c 111213 0d0e10 b8742a babdb8* 0d0e10 ×3
- These remove `readPalette`, `FullScreenQuad` and the renderer dependency.
- Both MIP panels are frozen (materials-wafer.js 261-262), so ship them as two 68×160 1-bit bitmaps. That removes Montserrat, both SVGs and `mip.js` from public pages.

**Per-surface edit points**
- **`solid-hero-rig.jsx`** (covers hero, handoff and seam together)
  - `useNeutral` at exposure 1.0 (67-68).
  - Studio env replaces RoomEnvironment (79-99).
  - Light set (102-107): keep it **constant** (rim directional, key directional, ambient) with per-model intensities (Wafer: rim 2.2 `0xdfe8ff` at (-3.2,2.2,-3.0), key 2.5 at (2.5,3.4,2.6), ambient 0). r160 counts a light at intensity 0, so hover swaps never recompile.
  - New Wafer route in `ingest` (163-173): presets by node name, plus the lids.
  - **Fit with a precise box** for the Wafer (153).
  - Default model URL (52).
  - `clearModel` must dispose per-assembly materials and DataTextures but not shared panel textures (136-149).
- **`wafer-page.jsx:291`**: new URL. Better still, read the registry so the 4.0/-0.92 pair stops living in two places.
- **Registries**: `app/data/projects.js:32` src (fits and poses stay), `app/projects/data.jsx:21`, and the `index.html:197` prefetch with the same `as="fetch" crossorigin="anonymous"` attributes.
- **`about-board.jsx`**
  - One load plus `getObjectByName(f)` (691-693).
  - Keep the explode maths but feed it the framing constants (section 3, item 1).
  - Replace the clone at 722 with presets plus `transparent`, and drop env 1.2.
  - Render the Wafer under Neutral and the studio env **without touching the PCB scene**. Either use a second render of the device in its own scene with the toneMapping switch and copied fog, or make the Wafer materials `toneMapped:false` and apply in-shader Neutral (`NEUTRAL_GLSL`, studio.js 114-115) with a per-material `envMap`.
  - Exclude the shared geometry from `dispose` (958-972).
- **`wafer-board.js`**
  - One load plus lookup by name (162-166) and the framing constants (174-208).
  - The per-key material is built with the `pbtCap` factory, not cloned, so emissive still varies per key (246).
  - Structural parts use presets (298).
- **`wafer-demo.js`**: Neutral and studio env (78-92), the rig's NEW lighting (93-97), and drop `preserveDrawingBuffer` (75).
- **Universe (Wafer card)**: the field has no tone mapping, so the card's materials need in-shader Neutral. Apply the studio env with fill 4 and ambient 1.0, as in `lab/materials.js` 117-123 and 171-178.

## (3) What could break, and why

1. **Loose versus tight boxes.** The explosions measure loose boxes on the raw nodes. Node rotations inflate them (worst part: `switches_R`, +57.8 mm).
   - Raw loose box: centre (0.158451, −0.098190, 0.002750) m, size (0.289611, 0.142786, 0.008106).
   - Tight box: centre (0.153590, −0.094590, 0.002750), size (0.279888, 0.096248, 0.008106). This equals `wafer_demo`.
   - If the explosions are fed tight or assembled geometry, they draw **3.47% larger and shifted 0.22 units** on the board's 13-unit frame. Per-part vectors also move. To stay exact, keep feeding the raw-frame nodes with the constants `base = 0.289611`, centre as above. The `gltfpack -cc` creased file happens to preserve the loose box to 4e-6, but don't rely on that.
   - If the static tiers fit raw nodes with the loose `fitModelToSize`, the Wafer comes out **3.36% smaller and off-centre by about 0.07 units** at fit 4.0. That changes the meaning of every registry pose and fit. Use a precise box there (19–48 ms once) or a stored constant.
2. **KTX2 is required.** If any texture survives in the file, `KHR_texture_basisu` stays *required*. Loading without `KTX2Loader` then throws ("setKTX2Loader must be called", reproduced). Remove the KTX2 imports only together with the textures.
3. **Cloning drops shader hooks.** r160 `Material.copy` does not copy `onBeforeCompile` or `customProgramCacheKey` (three.module.js 9533-9608). Every `.clone()` silently loses grain and print lines: about-board 722, wafer-board 246/298/334, `tuneRealMaterials` 42.
4. **Tone mapping does not reach the composer targets.** Material shaders only tone-map when rendering to the screen. A global Neutral on the universe `OutputPass` or on the board renderer would restyle the cards, stars and PCB.
5. **Board `dispose()` frees shared geometry.** Once the landing shares one file, the `dispose` event makes the universe, handoff and menu contexts drop their buffers and re-upload.
6. **The handoff rig re-assembles on every hover.** That is about 60 materials and 4 DataTextures per swap, and `clearModel` frees textures only for procedural models, so they leak.
7. **Parts with several meshes.** `assemble()` emits 4 meshes named `usbc_L` and 2 named `mcu`. In the merged file, `getObjectByName` returns their Group. Consumers must group by name.
8. **The lids float free.** The screen lids are unnamed siblings (materials-wafer.js 316-317), so they won't explode with their display unless parented to it.
9. **The seam must move as one.** The handoff rig and the hero must change in the same commit. Otherwise the JPEG seam and the live page differ in tone and lighting.
10. **Runtime bake would block the reveal.** In-page creasing (the lab path) cost 1.37 s on the main thread, 1.12 s of it in `toCreasedNormals`. It would land on the landing's handoff warm and the board build.
11. **Colour shifts under Neutral.** The demo's teal emissive glow and legends, which were authored under ACES, shift hue and saturation.
12. **The build can't take ES modules.** `build.cjs` parses `sourceType:"script"` (218, 239), so the lab modules can't be bundled as-is. `mip.js` also resolves its SVGs through `import.meta.url` (148, 151) and creates a canvas on import (80-82).

## (4) Performance

Wire figures are gzip -6.

| Surface | Today | NEW (recommended delivery) |
|---|---|---|
| Landing (card + board) | `wafer_demo` 630,153 + transcoder 260,583 + 53 parts 867,532 (+15.9 KB headers), 54 GLB requests + 2 CDN | **615,849 in 1 request**, no transcoder |
| Static KTX2 imports, 9 routes | KTX2Loader + WorkerPool + ktx-parse + zstddec = 29,130 B, 4 requests | can go |
| Wafer.html (+ demo) | 630,153 + 260,583 (+867,532) | 615,849 total; the demo reuses the cache |
| Menu on other routes | about 1.0 MB, 7 requests | 615,849, 1 request |
| GPU per context | card/hero 13.0 MB, board/demo 13.2 MB | about 2.4 MB (−10.6 MB). Up to 3 landing contexts and 2 on Wafer.html hold it. |
| Draw calls, card/hero/menu | 5 | **62** as loaded (+57, about 0.25–0.3 ms JS per frame per the audit's 4–5 µs/draw; universe 90→147) |
| Draw calls, board/demo | 60 | 62 (the two lids) |
| Programs (rig, measured) | 7 | 10 |

- **Main-thread work removed by the offline steps.** Crease bake 1.37 s, palette readback 188 ms (a GPU sync), panel load 149–236 ms. Drawing the panels themselves is 13 ms.
- **Not recommended.** No texture stripping and no crease is 443,452 B, but it drops the approved normals. A creased file without `gltfpack` is 650,204 B.
- **Grain is dead on the Wafer.** Its cells are 1/4000 and 1/6000 of a millimetre, so `fwidth` is ≥ 1 at every site scale and the term is multiplied by zero. It still costs a program variant and a per-fragment noise evaluation. Drop it for the Wafer.
- **PMREM size.** Each one is 768×1024 RGBA16F (6.3 MB) plus a depth buffer. The board needs a second one (+≈9 MB while the board lives) only if the PCB keeps RoomEnvironment.

## (5) Facts the architect must know

**The frame proof** (three r160, headless)
- `assemble()`'s Z-up group against `wafer_demo` after the site fit at 4.0: sizes (4, 1.3755, 0.1158) vs (4, 1.3757, 0.1157), both centred at 0.
- Of the 48 signed axis permutations, identity wins:
  - Median nearest-vertex distance 9e-5 units, p99 1e-3, 100% of points within 0.03 units.
  - The next best is the X mirror: p90 9e-3.
  - All 36 instanced keys match the part keys within 1e-5.
- The card fit (5.51) gives the same result.
- Orientation in all three frames (raw parts, `assemble()`, `wafer_demo`): +X runs left to right, the caps are at +Z, thumbs point south along (0.526, −0.851, 0), and the MCU sits on the left half.
- **No correction is needed.** `rigFit`, `rigPose`, `cardPose`, `menuPose` and the seam keep their meaning, provided the fit uses tight boxes.

**About the files**
- `wafer_demo.glb` is the same CAD merged by material: `case_L` 10,660 tris, `plate_L` 68,122, `pcb_L`/`pcb_R`, keys instanced ×36.
- The parts' material names are CAD names (`Opaque(...)`, `PaletteMaterial001`), so the Wafer finish has to go by node name, not through `BY_NAME`.
- Palette KTX2s are in `switches` and `display` too, not just the PCB. Any texture left in the file keeps the transcoder.

**Ownership of the shared cache.** `model-viewer.jsx`'s per-URL cache already serves every consumer. One URL dedupes everything, and the prefetch covers the landing.

**Lab code that ports badly**
- `studioEnvironment` never disposes its room scene and returns only the texture, so the target can't be freed (studio.js 144-170).
- `useNeutral` patches the shared `ShaderChunk`. Nothing else on the site uses `CustomToneMapping`, so that's safe.

**Fonts and files**
- `mip.js` needs **Montserrat** (28, 145), which is outside the AGENTS identical font set. Its latin woff2 is 37,956 B.
- `assets/Connected.svg` and `assets/Peripheral.svg` (31.7 + 25.7 KB) would deploy if committed. Nothing public needs them if the panels ship as bitmaps.
- The 53 files stay for `lab/wafer.js:55` and `materials-wafer.js:107`. `models/` deploys, so that is 1.14 MB shipped but never fetched.

## (6) Open questions

1. **PCB artwork in the explosions.** Bare soldermask follows "same materials". The alternative is the KTX2 art as an explosion-only side file: 221 KB, plus the 260 KB transcoder, plus 45 KB of PCB UVs in the shared file.
2. **Explosion framing.** Keep today's framing exactly via the loose-box constants (recommended), or move to canonical tight framing (3.47% larger, recentred)?
3. **Draw calls.** The approved look has 11 or more distinct materials, so it can't reach `wafer_demo`'s 5 draws as-is. Options:
   - Runtime merge by material: about 13 draws, 38 ms once, about +1.5 MB float geometry.
   - A palette uber-material: 2–3 draws, but anisotropy and IOR are approximated per part.
   - Accept 62.
4. **Demo and board lighting.** Should they take the rig's NEW dress, or keep their teal SIGNAL rim and fill? The gallery has no demo or board tier to settle it.

=========

All paths are relative to `/home/oleksandr/projects/Portfolio-workspace/portfolio/`. Scratch probes are in `/home/oleksandr/projects/Portfolio-workspace/portfolio/lab/port/` (`umd-probe.cjs` and `mapper-rig/counts.cjs`, with the latter's output in `mapper-rig/counts.out`). I did not touch the repo.

# Rig and shared-rendering slice: map for the NEW-look port

## (1) Surfaces

### A. `makeWaferRig`: the one hero rig (`app/projects/rendering/solid-hero-rig.jsx`)

**Contract**
- `RIG` is defined at 34-43 and exported as `window.WAFER_RIG` (44). The lifecycle reads it at `project-page-lifecycle.jsx:134` and the landing handoff at `project-handoff.jsx:291`.
- Values: fov 38, camZ 5.4, modelFit 4.0, pose `{x:-0.92}`, arriveYaw -0.52, arrivePitch 0.16, handoffScale 0.86.

**Renderer (58-70)**
- `antialias: true`, `alpha: true`, `high-performance`.
- `preserveDrawingBuffer` comes from opts (62).
- DPR is `min(dpr, 2)` (64), output is sRGB (66).
- Tone mapping: `ACESFilmicToneMapping` (67) at exposure 1.18 (68).

**Environment (79-99)**
- `RoomEnvironment` goes through PMREM `fromScene(room, 0.08)` (84). That sigma logs "sigmaRadians 0.08 is too large and will clip" in Chrome.
- The room is disposed after the PMREM pass (87-95). `envTarget` is disposed in `dispose()` (367).

**Lights (102-107)**
- Ambient 0.85.
- Directional key 2.3 at (2.6, 3.6, 2.6).
- Point rim `0x00f0c8` at 3.0, range 18.
- Point fill `0x6f8fc4` at 1.0.
- Directional top `0xbfd3ff` at 0.9.
- That is 2 directional + 2 point lights.

**Hierarchy:** pivot → spin → holder (pose) → GLB (110-116).

**Material pass, in `ingest()` (151-189)**
- `fitModelToSize` runs first (153). Material passes run after it.
- `assignMaterial` → `applySolidMaterials` (163-165).
- The default path → `tuneRealMaterials(..., {envMapIntensity: 1.9})` (166-167), collecting every (cloned) material as owned (168-172).
- `keepMaterials` + `buildModel` owns materials and geometry (174-181).

**Disposal**
- `clearModel()` (136-149) disposes owned materials.
- Textures and geometry are disposed only when `ownsGeometry` is set, i.e. procedural models (125-146).

**Model loading**
- `setModel()` (195-234) builds its config from exactly these keys: `model`, `modelFit`, `assignMaterial`, `keepMaterials`, `buildModel`, `onReady` (200-208).
- A generation guard runs at 152, 196 and 231.
- The default model is `models/wafer_demo.glb` (52).
- The first load at 236-244 forwards the same keys.

**Per frame**
- `update()` damps the pose and calls the procedural `modelUpdate` (272-290).
- Nothing else; there are no allocations.

**Menu borrowing:** `getMenuMotion()` lends this renderer and `scene.environment` to the menu (308-315).

### B. `makeNodeRig` (`app/projects/rendering/project-handoff-rig.jsx`)

- Wraps `makeWaferRig` with `preserveDrawingBuffer: true` (94). That is needed for `captureFrame` / `captureFrameAsync` (107-136).
- `modelOptions` (75-90) takes:
  - `rigFit` (default 4.0, line 78) and `rigPose` (default `{x:-0.35}`, line 79) from the registry;
  - `model.src` + `assignMaterial` when `ready` (82-84);
  - otherwise the `makeNodeProxy` builder with `keepMaterials` (85-88).
- The proxy (23-70) is LineSegments, Points and two Meshes with a 256×96 canvas tag.
- `setProject` (99-103) swaps the model on the same renderer.
- Used by:
  - the landing handoff (`app/landing/transitions/project-handoff.jsx:85,200`), primed on `mo:first-frame` and on hover (148-176);
  - `Venovisor.html`, but only for `makeNodeProxy` (`Venovisor.html:84`; bundled via `projectHandoffRig: true` at `build.cjs:179`).
- Kerfur's registry entry is `mdl({rigFit: 3.4})` with `ready: false` (`app/data/projects.js:47`), so the landing handoff flies the proxy for Kerfur.

### C. `model-viewer.jsx` (shared loader)

**Cache and job queue**
- Cache: a URL → Promise of the parsed root (20).
- Every consumer gets `root.clone(true)`, which shares materials and geometry with the cached root (120-122).
- Job limit is 4, or 2 on constrained devices (22-25, 29-48).

**Decoders**
- Meshopt is wired at 100-101.
- `getKTX2Loader` (56-77) returns `null` when `THREE.KTX2Loader` is missing (60).
- Otherwise it builds a throwaway `WebGLRenderer` for `detectSupport` (66-74). The transcoder is `unpkg three@0.160.0 .../basis/` (62).
- `_withoutKTX2` retries a pre-warm that started before the decoder existed (87-91, 113). This is covered by `tools/landing-runtime/model-decoder.test.cjs`.

**Load path**
- `resolve(gltf.scene)` at 107. Nothing strips lights.
- `preloadModels` polls `window.THREE.GLTFLoader` every 30 ms (129-140).
- `mo:model-loader-ready` is dispatched synchronously at 141.

**Fit:** `fitModelToSize` (146-157) uses `Box3.setFromObject(root)`, which counts every object that has geometry, Sprites included. It then centres the root and scales it so the longest edge equals the target.

### D. `solid-materials.js`

- `tuneRealMaterials` (31-61): clones each material, sets `envMapIntensity`, lifts any colour with luma under 0.04.
- `applySolidMaterials` (67-90): one `MeshStandardMaterial` for the whole model, and it does not dispose the replaced material.

### E. Project page template

**`standard-page.jsx`**
- The PAGE_CONFIG doc block is at 11-33. It still documents `assignMaterial`.
- `heroLayout` is at 67-78.
- `useHeroRigEffect` is called at 272-283.
- The stage mount is at 323.

**`project-page-lifecycle.jsx`**
- `makeWaferRig` is called with exactly `{model: hero.model || project.model, buildModel, pose, modelFit, assignMaterial, keepMaterials}` (79-88).
- If the rig is null, the page is ready without a model (91-94).
- Arrival and seam handling: 119-168.
- `shouldRender`: the page is visible, the menu is not open, and either scroll < 0.74 vh or the exit spin is running (180-183).
- The rAF loop sleeps on its own (188-212). It wakes on resize, scroll, visibilitychange, pageshow, `mo:menu`, `mo:project-rig-wake` and `mo:page-restored` (215-243).
- Disposal: 245-261.

### F. `PAGE_CONFIG.hero` per route

| Route | hero | Bundle (`build.cjs`) |
|---|---|---|
| `Kerfur.html:66-104` | `keepMaterials`, fit 3.4, pose (0.06, -0.38, 0), `buildModel` returns `{group, update}` | standard, compiled config (164-175) |
| `Ci-Clop.html:63-89` | `ci-clop-mark.glb`, `assignMaterial {0x4b5a32, m .28, r .62}` (74), fit 2.6, pose (0.5, 0.35, -0.5) | standard, compiled (145-149) |
| `Venovisor.html:75-94` | `buildModel: makeNodeProxy` (84), fit 2.6, pose x -0.35, heroLayout | handoff + handoff rig (179) |
| `Iskra.html:58-71` | `iskra-mark`, 2.1, x -0.2 | standard, compiled (163) |
| `Wafer Studio.html:75-94` | `wafer-mark`, 2.1, x -0.18 | handoff (180) |
| `Split HID Display.html:55-67` | `keyboard-display.opt`, 2.8, (-0.08, -0.24) | standard, plain config (178) |
| `ZMK-PointAccel.html:63-82` | `zmk-mark`, 2.1, x -0.2 | standard, compiled (204-208) |
| `ZMK Soft Off Plus.html:75-90` | `soft-off-keycap.opt`, 2.0, (-0.18, 0.38) | handoff (203) |
| Sightseeing 75-90, Silent Depth 61-78, Brionel 75-90 | marks, 2.1, x -0.2 | handoff |
| `Bulgaria 2026.html:75-92` | `bulgaria-mark`, 2.1, **x -0.35** (the registry has -0.2, `projects.js:215`) | handoff |
| `Wafer.html` | `wafer-page.jsx:291` calls `makeWaferRig({model: "models/wafer_demo.glb"})` with the rig defaults | bespoke (181-202) |

**Registry disagreements today**
- Ci-Clop: `rigPose {z: 1.5708}` in the registry (`projects.js:73`) against the page pose `(0.5, 0.35, -0.5)`. So the landing handoff and the page hero already disagree on its pose.
- Bulgaria: as noted in the table.

### G. Import-map module scripts

The two decoder columns are the ones the task asked about.

| Page | Imports (lines) | KTX2 | RoomEnvironment |
|---|---|---|---|
| `index.html` | 240-256 (+ the composer passes) | yes, used: wafer_demo and the parts | yes: universe 366, rig, board 763 |
| `Wafer.html` | 59-66 | yes, used: wafer_demo and the demo parts | yes: rig, `demo/wafer-demo.js:87-90` |
| Brionel, Bulgaria, Sightseeing, Venovisor, Wafer Studio, Soft Off | 56-63 | **imported but not needed at load**: none of their heroes has KTX2, and the menu already lazy-imports it (`menu-renderer.js:59-60`) | yes: rig |
| Silent Depth | 43-48 | same as above | yes: rig |
| Ci-Clop | 38-44 | no | yes: rig, `torch-demo.js:281-284` |
| Kerfur | 39-46 (+ RoundedBoxGeometry) | no | yes: rig, `kerfur-demo.js:117-120` |
| Iskra, Split HID | 36-42 | no | yes: rig |
| ZMK-PointAccel | 38-44 | no | yes: rig |
| `Design System.html` | 35-41 | no | needed only by the standalone menu (`menu-renderer.js:79`); `event-bus.jsx` is procedural, with no GLB |
| `All Projects.html` | import map only (line 6), no module script | — | the menu dynamic-imports three, GLTFLoader, meshopt, RoomEnvironment and KTX2 (`menu-renderer.js:64-68`) and uses a local `THREE`, not `window.THREE` |

The only models All Projects and Design System render are the menu's.

### H. Menu: also a model surface, tied to this rig

- `app/shared/menu-objects.js` loads the featured models (`MO_FEATURED_ADDRS = 0x01, 0x03, 0x04, 0x06`, `projects.js:222`) through `loadProjectModel` (44-66).
  - Material passes: `applySolidMaterials` (51-52) or `tuneRealMaterials` 1.6 (53-54).
  - Fit: `fitModelToSize` (59). The procedural output switch is also fitted (100).
  - Pose fallback: `menuPose || cardPose.pose || rigPose` (61).
- Its own lights: hemisphere 2.2, key 3.4, signal rim 1.8 (12-16).
- It leases the renderer and forces ACES at 1.25 (146), restoring it on close (130, 142).
- The renderer comes from `navigation.jsx:11-13` (`__pageRig` / `__waferRig.getMenuMotion()`), or the standalone renderer with a RoomEnvironment PMREM at 0.06 (`menu-renderer.js:73-87`).

### I. Build (`tools/landing-runtime/build.cjs`)

**Source kinds**
- `jsx()` → Babel `env` + `react`. This is a full ES5 transpile, which is why the rig compiles to 13,092 B (15, 215-230).
- `classic()` → no presets, minify only (19, 236-250).

**Which bundle includes what**
- `solid-materials.js` is `classic()` in handoff bundles (84), standard bundles (108), All Projects (137), Design System (154) and Wafer (192).
- It is **not** in the landing runtime (39-59). The landing loads it from an **unstamped** tag (`index.html:270`).
- `phase()` adds `scene-objects`, `menu-objects`, `menu-renderer` and `navigation` after `core` in every bundle (61-65).
- The landing compiles every file with `compile()` except `menu-renderer.js` (458-459). A classic file added there would be ES5-transpiled: `menu-objects.js` is 12,801 B there against 9,394 B in the page bundles.

**Load order**
- Page runtimes are `<script defer>` (263-269).
- `index.html:272` `runtime.js` is **blocking**.

**Stamping**
- A bundle's `?v=` is its content hash (473, 483), so anything compiled into a bundle is stamped for free.
- `stampDataAssets` stamps a fixed `src` list (378) plus CSS.

**What `--check` verifies (531-543)**
- Runtime freshness and orphan runtimes.
- Page markup (runtime tags, data stamps, no Babel).
- The `index.html` stamps, fallback nav and wafer-page prefetch.
- It does **not** check:
  - unstamped classic tags;
  - import-map contents;
  - that model URLs exist;
  - that `PAGE_CONFIG` matches the registry.
- `assertPageCoverage` (424-430) requires every root `.html` to be in the manifest.

## (2) How the NEW look maps onto the rig

### KEY QUESTION: how the studio reaches the classic bundles. I recommend option (c).

**How each surface waits for `window.THREE` today**
- **Project routes:** the module script and the deferred bundle share the HTML "execute after parsing" list in document order. The module graph therefore finishes before the bundle runs (stated at `Ci-Clop.html:28-29`). The rig still guards `if (!THREE) return null` (`solid-hero-rig.jsx:50-51`).
- **Landing:** `runtime.js` evaluates *before* THREE exists. `app/landing/app.jsx:247-254` waits on `mo:three-ready`.
- **All Projects:** `window.THREE` never exists.
- **Consequence:** shared code must not touch THREE when it is evaluated. `lab/studio.js` doesn't: every function takes THREE as an argument, and its data is plain.

**(a) Hand-written classic copy exposing `window.*`**
- Works with the existing `classic()`.
- But either the source is duplicated (lab ES module + site classic), or the lab and `studio.check.mjs` (node, no `window`) have to read a global through a shim.
- Bytes are the same as (c).

**(b) Import in each HTML module script, assigned to `window`**
- 14 HTML edits.
- All Projects has no module script, so `menu-renderer.js:64-68` would also have to import it.
- The module URL is unstamped, which is the cache-busting hole from 2026-08-25: `stampDataAssets` (378) only stamps `src=`.
- +1 request per route, cached across routes, about 4–7 KB gz once per visit.
- The bundles' node vm tests can't see it.

**(c) Recommended: one ES-module source in `app/`, compiled into the bundles by the build**
- Move the studio to an `app/` file (e.g. `app/projects/rendering/studio.js`) with no imports.
- The lab (`lab/materials*.js`, `lab/wafer.js:33`) and `lab/studio.check.mjs` import that file natively.
- Add an `esm(file, "MOStudio")` source kind to `build.cjs`:
  - `Babel.transform(src, {sourceType: "module", plugins: ["transform-modules-commonjs"], presets: [], minified, compact})`;
  - wrap the output as `(function(exports){…})(window.MOStudio={})`;
  - **throw if the source has an `import`**.
- Verified in scratch: `@babel/standalone` 7.29.0 ships `transform-modules-commonjs`. The output evaluates in a vm and exposes `BY_NAME, DARK_PAGE, NEUTRAL_GLSL, PRESETS, STAGES, TONE, inverseNeutral, neutral, presets, studioEnvironment, useNeutral`.
- Edits:
  - in `buildPageRuntime` (360), dispatch on `source.esm`;
  - replace `classic(SOLID_MATERIALS)` at 84, 108, 137, 154 and 192;
  - add the file to `landingSourceFiles` with the same special case used at 458-459;
  - delete the `index.html:270` tag.
- The bundle hash stamps it and `--check` guards freshness. There is no extra request.

**Bytes for (c), per bundle**
- `lab/studio.js` as-is: 10,596 B raw / **4,152 B gz**.
- Finishes (`materials-models.js` 109-285): 8,164 / 3,174.
- `materials-wafer.js` with imports removed: 7,557 / 3,186 (much less if it is baked offline, see section 5).
- Minus `solid-materials`: 1,475 / 629.
- Net about **+7–10 KB gz per bundle**, in 16 bundles. Every bundle needs it because the menu renders Wafer, Iskra, Ci-Clop and Wafer Studio on every route.

### Rig edit points

1. **Tone** (66-68): replace the ACES lines with `MOStudio.useNeutral(THREE, renderer)` and set `toneMappingExposure = TONE.exposure * 2**ev` per model in `setModel`.
   - Exposure is a uniform, so changing it costs no compile.
   - `ev` is 0.3 for Ci-Clop and 0.5 for Venovisor (`materials-models.js:44,65`; `materials.js:127,138`).
2. **Environment** (79-99): use `studioEnvironment(THREE, renderer, STAGES.void.env)` (`studio.js:144-171`, sigma 0).
   - Add disposal of the env scene's geometries and materials. `studioEnvironment` doesn't do this, unlike today's code at 87-95.
3. **Lights** (102-107): replace with the gallery's dress (`materials.js:171-179`):
   - rim `0xdfe8ff` at (-3.2, 2.2, -3.0): Wafer only, 2.2;
   - key at (2.5, 3.4, 2.6): Wafer only, 2.5;
   - Ambient 0.8 for logos (Ci-Clop counts as a logo, `materials-models.js:43`);
   - nothing for Venovisor, Split HID or Soft Off.
   - Keep a **fixed** set of {ambient, 2 directional} and vary the intensities. Light count is part of the r160 program key (`WebGLPrograms` `numDirLights`/`numPointLights`), and the landing reuses one renderer across `setProject` (`solid-hero-rig.jsx:191-194`).
4. **Material route** (`ingest` 151-189):
   - `assignMaterial` becomes dead: the new Ci-Clop ships its own materials. Remove it at 163-165, 203 and 240, at `project-handoff-rig.jsx:84`, at `lifecycle:86` and at `Ci-Clop.html:74`.
   - The default path becomes the presets plus the hardware finish. Table for logos: `LOGO_STAGE` env 0.3, floor 0.04, with `METALS` split into chrome at env 1 and pearl at 1.8 (`materials-models.js:77-88, 274-283`). Hardware uses `HW_STAGE` floor 0.02 (24).
   - Per-model data needed: `{logo|hw, env?, ev?, rim?, key?, finish?, table?}`.
   - The simplest plumbing is for the rig to resolve it from the registry by `config.model === p.model.src`. That adds **no** new forwarded keys. Otherwise a new key must be added in four places: lifecycle 79-88, rig 200-208 and 236-244, and `modelOptions` 75-90.
5. **Order and fit:** run the finish **before** `fitModelToSize` (153), and make `fitModelToSize` (146-157) skip `/glow|halo|haze/` objects and their subtrees. Section 3 explains why. Use a name filter, not "meshes only", or the node proxy (lines and points) changes size.
6. **Ownership:** `presets.apply` returns an unmapped sealed material *as-is* (`studio.js:268`). Collect only the materials `apply` made (it needs to return `made`), plus the finish's canvas textures, the bleed uniform texture and the glow plane geometry. Free them in `clearModel` the way `lab/materials.js:521-533` does.
7. **Framing**
   - **Ci-Clop:** `Ci-Clop.html` 80-81 and `projects.js` 72-74 both become fit 3.0, pose `{0.45, 0.75, 0}`. Drop `cardPose.pose`; the fit stays at 1.25.
   - **Venovisor:**
     - `Venovisor.html:84-86` becomes `model: "models/venovisor-mark.glb"`, fit 3.7, pose `{0.12, π+0.35, -0.62}`.
     - Registry: `projects.js:87` becomes `ready`, `src`, `rigFit` 3.7, `rigPose`, and `cardPose {fit: 4.9/1.9 ≈ 2.579, pose}`.
     - `data.jsx:545` becomes the model path.
     - `build.cjs:179` drops `projectHandoffRig`.
   - **Wafer:** the default at 52 and `wafer-page.jsx:291` move to the new Wafer file.
8. **Menu** (if it follows "every place a model renders"):
   - `menu-objects.js:51-54` → presets;
   - 12-16 → the dress;
   - 146 → Neutral;
   - `menu-renderer.js:79` → studio environment;
   - 59-60, 64-68 → drop KTX2 and RoomEnvironment.
9. **Lab:** the gallery's NEW pipe imports the `app/` module. Its URL knobs (`logoenv`, `metalenv`, `olive`, `amb`, `key`, `fillf`: `materials-models.js:78-79,87,256`, `materials.js:117,160-169`) stay in the lab as overrides and are not ported. AGENTS.md rules out variants that only a global or URL can switch on.

### Callers of the three helpers, and whether each survives

| Caller | Line | After the port |
|---|---|---|
| `tuneRealMaterials` in the rig | `solid-hero-rig.jsx:167` | replaced by presets |
| `tuneRealMaterials` in the universe | `universe.jsx:974` | replaced by presets |
| `tuneRealMaterials` in the menu | `menu-objects.js:54` | replaced by presets |
| `tuneRealMaterials` in the lab OLD pipe | `lab/materials-models.js:104` (loads `solid-materials.js` from `lab/materials.html:122`) | needs it kept, in `lab/` |
| `applySolidMaterials` | `solid-hero-rig.jsx:164`, `universe.jsx:973`, `menu-objects.js:52` | no site model needs it, so it dies |
| `applySolidMaterials` in the lab OLD pipe | `lab/materials-models.js:103` | needs it kept, in `lab/` |
| `fitModelToSize` | `solid-hero-rig.jsx:153`, `universe.jsx:970`, `menu-objects.js:59` and 100 (output switch) | **survives**, with the glow filter |

`about-board.jsx` and `demo/wafer-board.js` use only `loadProjectModel` (`about-board.jsx:689`, `wafer-board.js:159-163`).

### Stripping punctual lights (models-perf §3.6)

- The single place is `model-viewer.jsx:107`: traverse `gltf.scene`, remove anything with `isLight` (its target goes with it), then resolve.
- The cached root is then clean, so the universe, rig, menu, board and demo all inherit it.
- Verified: `models/ci-clop-mark.glb` has 1 light; `lab/models/ci-clop-mark.glb` and `lab/models/venovisor-mark.glb` have 0. After the swap, no shipped GLB carries a light, so the strip is only a guard.

## (3) What could break, and why

1. **Fit includes the glow.**
   - `Box3.setFromObject` counts Sprites and the `led-glow` plane.
   - **Venovisor:** the plane is 4.2 × ring radius = 0.0619 m, centred at y -0.0497. That extends y to -0.0806, so the longest edge goes 0.1268 → 0.144 m and the model renders **12% smaller** than the gallery.
   - **Ci-Clop:** the subtle halos are 0.035 m sprites at x ±0.0066. That extends x to ±0.0241, so the edge goes 0.040 → 0.048 and the model renders **17% smaller**.
   - The gallery's `fitModel` skips these (`materials-models.js:90-96`).
2. **`venovisorGlow` positions itself in world space, then attaches to the root** (`materials-models.js:126-131,153,165`). After the rig's fit has scaled the root, that transform is applied twice. The finish must therefore run before the fit.
3. **Disposing cache-shared materials.** If the rig keeps today's "own every material on the mesh" collection (168-172) after `apply`, any unmapped sealed material gets disposed. That is the bug AGENTS.md describes. In the other direction, finish textures and geometry leak on every landing `setProject`; hover re-prepares (`project-handoff.jsx:165`).
4. **Alpha canvas.**
   - `venovisorGlow` uses `AdditiveBlending` over an opaque black 512² canvas (`materials-models.js:135-136,151`).
   - On r160 that raises destination alpha to 1 across the whole square on `alpha:true` renderers: the rig (60) and the menu (`menu-objects.js:145`). The result is a faint black-against-`#04060d` square whenever the back of the C faces the camera.
   - The gallery renders opaque (`materials.js:74,79`), so it never showed this. `ciclopLeds` already uses alpha-preserving `CustomBlending` (233-234).
5. **Tone curve scope.**
   - `useNeutral` patches the global `ShaderChunk`. It is shared with the menu's dynamic-import THREE, because `Object.assign` copies the reference.
   - It must run before any `CustomToneMapping` program compiles.
   - Tone mapping applies only when rendering to the screen (`WebGLRenderer.js` r160 1754-1760). r160 `OutputPass`/`OutputShader` has **no Custom branch**, so the Universe (composer) cannot get Neutral that way. A post-process tone map would also change the void, the cards and the dust. (That belongs to the universe slice.)
6. **Kerfur and the proxy go through this rig.** Changing the rig's tone and lights changes Kerfur's hero (`keepMaterials`) and the proxy that the landing flies for Kerfur. The gallery never judged either.
7. **The menu forces ACES at 1.25 and its own lights.** Unless it is ported, the menu shows models in a different look from the hero.
8. **Unforwarded keys.** A new hero key that is not forwarded in all four places silently does nothing (AGENTS.md).
9. **Async finish.** If the Wafer finish awaits anything (parts, screens), `ingest`'s generation check (152) must be repeated after the await.
10. **Venovisor proxy reference.** If `projectHandoffRig` is dropped while `Venovisor.html:84` still references `makeNodeProxy`, the page throws a ReferenceError at boot.
11. **Lab OLD pipe.** Deleting `solid-materials.js` breaks the gallery's OLD pipe (`materials-models.js:103-104`).
12. **KTX2 test.** If KTX2 is removed site-wide, `model-decoder.test.cjs` and `model-viewer.jsx` 56-77, 87-91 and 113 have to go together.
13. **Unstamped landing tag.** `index.html:270` loads `solid-materials.js` unstamped. If it is kept and edited, returning visitors can pair a stale copy with a fresh runtime.
14. **Field fade (cross-slice).** Halos and haze are Sprites and set `opacity` in `onBeforeRender` (`materials-models.js:161-164,239-242`). They escape the universe's mesh-only fade list (`universe.jsx:976-988`).
15. **Soft Off cap grain.** `softOffBleed` overwrites `grain`'s `onBeforeCompile` and its cache key on the PBT cap (`materials-models.js:198,211` vs `studio.js:339,355`). The approved look therefore has no cap grain. "Fixing" it changes the look and adds a program.
16. **Wafer screens.**
    - `lab/mip.js` needs **Montserrat** (145), which breaks AGENTS.md's identical-font-set rule.
    - It fetches two SVGs (`assets/Connected.svg` 31.7 KB and `assets/Peripheral.svg` 25.7 KB, both **untracked** in git).
    - It uses `import.meta.url` (148-151), so it cannot be bundled as a classic script.
17. **AGENTS.md drift** to update in the same change:
    - the three-way material route;
    - the "gltfpack -c" rule (`venovisor-mark.glb` was packed by `lab/tools/pack-glb.mjs` to keep `_PRINTZ`; it requires meshopt only, not quantization);
    - "Kerfur and Venovisor are the two left";
    - the `standard-page.jsx:14-23` doc block;
    - `projects.js:227-229`.

## (4) Performance

### Rig tier, OLD (today's site pass) vs NEW

Measured headless today on SwiftShader by `counts.cjs`; counts are reliable, timings were not taken.

| Model | OLD draws / programs / tris | NEW draws / programs / tris | NEW textures |
|---|---|---|---|
| Iskra | 2 / 1 / 3,472 | 2 / 1 / 3,472 | – |
| Wafer Studio | 1 / 1 / 5,536 | 1 / 1 | – |
| Split HID | 3 / 1 / 19,092 | 3 / **2** | – |
| Soft Off | 4 / 1 / 3,744 | 4 / **2** | 256² bleed (unbuilt in this count) |
| Ci-Clop | 7 / 1 / 29,831; 6 lights incl. the embedded one | 6 / **4** / 12,266 | 2 × 64² halos, 32 KB |
| Venovisor | site today: proxy | 5 / **4** / 12,249 | 512² glow + 128² haze = 1.11 MB without mips, about 1.5 MB with |
| Wafer | 5 / 4 / 115,938 (`wafer_demo`) | **62 / 8** / 128,796 | screens and palettes only |

**What the NEW look removes**
- Analytic lights go from 5 to 0–2, including both point lights. That is cheaper per fragment.
- PMREM at sigma 0 skips today's clipped 0.08 blur pass.
- The studio's env scene is MeshBasic only, while RoomEnvironment compiles MeshStandard plus a point light.
- Same GPU memory: the 256 cubeUV HalfFloat target is about 6.3 MB either way.

**Wafer**
- −11.2 MB GPU: the NEW `pcb` has no map (`materials-wafer.js:218`), so the 2 × 5.59 MB ETC1S textures are never uploaded.
- If they stay in the file, they are still downloaded, transcoded and held in the JS heap by the cached root. The transcoder (264 KB) is needed only because they are in the file.
- +57 draws, about 0.25 ms JS per frame at the perf doc's 4–5 µs per draw; phones are unmeasured.
- `loadParts`'s runtime bake de-indexes and turns the 128.8k tris into float (`materials-wafer.js:111-126`). That is about 386k verts × 24–32 B ≈ **9–12 MB of geometry**, against 1.96 MB quantized. This is an estimate.
- It also adds four synchronous GPU readbacks (`readPalette` 67-81) and pulls `Pass.js` (759 B gz, +1 request on project routes) into the load path.

**Grain**
- The grain noise runs per fragment even where `fwidth` fades it to zero (`studio.js:352-353`). That covers the Wafer case and keys (millimetre units, fully faded at hero scale) and Brionel.
- The GPU cost is unmeasured.

**Per-frame CPU added**
- Three sprite `onBeforeRender` hooks and the `printLines` uniform flip. Both are tiny and both sleep with the loop.

### Bytes per route

| Change | Saving or cost | Where |
|---|---|---|
| Studio compiled into each bundle | about +7–10 KB gz | every bundle |
| Drop KTX2 at load (KTX2Loader 6,102 + ktx-parse 5,331 + zstddec 17,155 + WorkerPool 608 B gz, r160 unpkg) | **−29.2 KB gz, −4 requests**, minus a throwaway WebGL context | 7 routes now (the menu already lazy-loads it); `index.html` and `Wafer.html` too if the Wafer delivery file is KTX2-free, plus −264 KB transcoder |
| Drop RoomEnvironment | −1,241 B gz, −1 request | only where every renderer moves; Ci-Clop, Kerfur and Wafer keep it while their demos use it |
| Venovisor | −7.7 KB raw (handoff rig) | Venovisor |
| `toCreasedNormals` | already in the graph: r160 `GLTFLoader.js` imports `BufferGeometryUtils` | all routes |

**Net heavier routes:** Iskra, Split HID, ZMK-PointAccel, Kerfur, Ci-Clop, All Projects and Design System have nothing to drop. They come out about +6–9 KB gz JS each, and that needs a named reason ("the menu renders the Wafer and Ci-Clop on every route"). The lab-only exports (`light`/`dark` stages, `inverseNeutral`, `NEUTRAL_GLSL`, JS `neutral`) could move to a lab file to save about 1–2 KB.

## (5) Facts the architect must know

**Wafer delivery file and KTX2**
- Only the Wafer files use KTX2: `wafer_demo` and the six parts `switches_*`, `pcb_*` and `display_*` (verified from the GLB JSON).
- A derived Wafer delivery file could:
  - drop the PCB textures;
  - pre-resolve the palette swap (`SWAP` → entries, `materials-wafer.js:44-62`);
  - pre-bake orientation and creased normals, indexed and in mesh-local space so the explosions' node transforms stay identical;
  - ship the two frozen 68×160 panels as tiny PNGs.
- That makes the site **KTX2-free**: −29 KB gz and 4 requests on 9 routes, −264 KB transcoder, no `detectSupport` context, no Montserrat or SVG fetches, no `mip.js`, `Pass.js` or readback.
- Keep the gallery's millimetre units or the grain behaves differently.

**r160 limits**
- No `NeutralToneMapping`; the Custom stub patch is the only route.
- `OutputPass` cannot apply it.
- `Material.onBeforeRender` exists (`WebGLRenderer.js:1568`).
- No tone-map name collisions on the site: no `uToe` or `neutral(` anywhere in `app/` or `demo/`.

**Gallery dress per entry**
- Ci-Clop is `kind: "logo"`: logo stage plus Ambient 0.8.
- The Ci-Clop LEDs are `toneMapped:false` (+1 program).
- Venovisor uses `env` 0.55 with no lights.

**Menu pose:** removing Ci-Clop's `cardPose.pose` changes its menu pose to `rigPose` (`menu-objects.js:61`).

## (6) Open questions (the code cannot answer these)

1. Kerfur's hero and the node proxy run through the same rig. Do they move to Neutral and the new dress, or stay on ACES 1.18 with the old lights as the one exception?
2. Should the menu use the rig dress or the field dress (it has no gallery tier)? Should its procedural output switch also go to Neutral?
3. Does the lab gallery keep `pipe=old`? If yes, `solid-materials.js` moves to `lab/`.
4. Should Venovisor's 512² glow (about 1.5 MB GPU per surface) be allowed down to 256² (about 0.35 MB)? That needs eyes on it.
5. Does Ci-Clop get its own `menuPose`, or fall back to the new `rigPose`?

=========

The harness is built and `perf-before.json` covers all 16 states. The port can come out lighter than today on every surface, but only if four things go in with it:
- The Wafer ships as one merged file with no KTX2 inside it.
- The crease bake runs offline, not in the browser.
- The static views merge their meshes by material.
- The new materials stay front-sided.

No repo file was changed.

**Read the numbers with these limits:**
- **Machine:** SwiftShader on a machine shared with other agents (load average 8–50 during runs). Counts and bytes are reliable; times are host-CPU time inside `renderer.render`, not GPU time.
- **Wire bytes:** gzip -6 for site files (what Pages sends) and as transferred for the CDN, counting each URL once. The local server fetches the prefetched `wafer_demo.glb` twice; Pages serves the second from cache.
- **Board:** the board state is the Board Flight's explode stop (stop 03).
- **DoF:** forced on during measurement (set `PERF_DOF=probe` to leave it to the probe), as a capable GPU keeps it.

## The harness

`/home/oleksandr/projects/Portfolio-workspace/portfolio/lab/port/perf.cjs` — run `node perf.cjs <out.json> [stateFilter]`, or `--print <file.json>` to re-print tables.

- **Wrapping the prototype doesn't work in three r160.** `render` is created inside the `WebGLRenderer` constructor, so wrapping the prototype records nothing. The harness instead traps `window.THREE` and swaps in a subclass that instruments every renderer. It does the same for `EffectComposer` to reach the Bokeh pass, and wraps `PMREMGenerator.fromScene` to time it.
- **The harness corrects late frame timestamps by default.** Chrome sometimes hands a requestAnimationFrame callback a frame time from before a long main-thread block, up to 4.4 s earlier than the `performance.now()` read just before the request. Every page recorded this. Without the correction, the Iskra hero's easing diverged (scale −1.3e27) and it drew nothing for 60+ frames. Set `PERF_RAF_RAW=1` to see that.
- **Another agent overwrote `port/perf.cjs` once** with a 16-line gallery script. I saved theirs as `port/perf-gallery-probe.cjs`; an identical backup of mine is at `port/perfharness/perf.cjs`.

## Before (`port/perf-before.json`)

Requests are shown as count / KB gzipped. "Tex / geo / RT MB" are GPU estimates for what each renderer drew.

**landing-title:** 68 requests, 1,856 KB. GLB 10 / 914 KB; KTX2 + transcoder 4 / 265; JS 31 / 553; other 23 / 124. 3 WebGL contexts made, 2 live. Heap 8.8 MB.

| Renderer | Frames | Render CPU median / p95 / mean (ms) | Draws per frame | Tris per frame | Programs | Geoms | Texs | Tex / geo / RT MB |
|---|---|---|---|---|---|---|---|---|
| Universe | 60 | 1.4 / 3.9 / 51.8 | 58 | 113k | 29 | 67 | 34 | 47.4 / 3.6 / 41.4 |
| Handoff rig (idle, holds `wafer_demo`) | 0 | – | – | – | 4 | 5 | 5 | 16.7 / 1.8 / 9 |

The universe mean is distorted by shader compiles that happen the first time a model drifts into view. A rerun caught 2 programs compiling inside the measured window, with one frame at 1.1 s.

**landing-board:** this state adds 53 requests / 847 KB (all GLB). Cumulative 121 requests / 2,703 KB; 5 contexts made, 4 live; heap 12.5 MB.

| Renderer | Frames | Render CPU median / p95 (ms) | Draws per frame | Tris per frame | Programs | Geoms | Texs | Tex / geo / RT MB |
|---|---|---|---|---|---|---|---|---|
| Board | 60 | 11.3 / 19.5 | 209 | 262k | 13 | 163 | 11 | 27.7 / 2.3 / 9 |

The universe and handoff rig are asleep in this state (0 frames).

**iskra-menu:** this state adds 13 requests / 1,030 KB: `wafer_demo`, `ci-clop-mark`, `wafer-mark` and the 4 transcoder files.

| Renderer | Frames | Render CPU median / p95 (ms) | Draws per frame | Tris per frame | Programs | Geoms | Texs | Tex / geo / RT MB |
|---|---|---|---|---|---|---|---|---|
| Hero rig, borrowed for the menu | 60 | 0.8 / 1.7 | 23 | 155k | 11 | 22 | 5 | 16.7 / 2.4 / 9 |

**Project routes** (hero settled):

| Route | Requests | Wire KB | GLB KB | KTX2 n / KB | Contexts made / live | Draws per frame | Tris per frame | Programs | Render CPU median / p95 (ms) | Tex / geo MB |
|---|---|---|---|---|---|---|---|---|---|---|
| Wafer | 32 | 1410 | 615 | 4 / 265 | 3 / 2 | 5 | 115,938 | 4 | 0.6 / 1.2 | 16.7 / 1.75 |
| Kerfur | 70 | 535 | 0 | 0 | 2 / 2 | 7 | 2,942 | 2 | 0.7 / 1.2 | 6.0 / 0.22 |
| Iskra | 23 | 509 | 19 | 0 | 2 / 2 | 2 | 3,472 | 1 | 0.4 / 0.6 | 6.0 / 0.11 |
| Ci-Clop | 27 | 590 | 74 | 0 | 2 / 2 | 7 | 29,831 | 1 | 0.5 / 1.0 | 6.0 / 0.39 |
| Venovisor | 27 | 524 | 0 | 2 / 12 | 2 / 2 | 7 | 12 | 5 | 0.5 / 0.9 | 6.1 / 0.01 |
| Wafer Studio | 28 | 543 | 22 | 2 / 12 | 3 / 2 | 1 | 5,536 | 1 | 0.3 / 0.5 | 6.0 / 0.14 |
| Split HID Display | 24 | 522 | 32 | 0 | 2 / 2 | 3 | 19,092 | 1 | 0.5 / 0.7 | 6.0 / 0.27 |
| ZMK-PointAccel | 27 | 567 | 55 | 0 | 2 / 2 | 49 | 10,556 | 2 | 0.9 / 1.4 | 6.3 / 0.02 |
| ZMK Soft Off Plus | 28 | 532 | 12 | 2 / 12 | 3 / 2 | 4 | 3,744 | 1 | 0.4 / 0.7 | 6.0 / 0.08 |
| Sightseeing | 28 | 530 | 9 | 2 / 12 | 3 / 2 | 13 | 2,876 | 1 | 0.6 / 1.2 | 6.0 / 0.05 |
| Silent Depth | 28 | 602 | 81 | 2 / 12 | 3 / 2 | 1 | 20,620 | 1 | 0.3 / 0.5 | 6.0 / 0.48 |
| Brionel Catalogue | 28 | 589 | 68 | 2 / 12 | 3 / 2 | 1 | 17,966 | 1 | 0.3 / 0.6 | 6.0 / 0.51 |
| Bulgaria 2026 | 28 | 529 | 8 | 2 / 12 | 3 / 2 | 5 | 2,388 | 1 | 0.6 / 0.8 | 6.0 / 0.04 |

The 6 MB of texture on every hero is the PMREM environment, plus a 3 MB depth buffer left on it.

## What I measured for the new pipeline

**a. Wafer delivery.** The merged file is 945,748 B raw / 711 KB gzipped. Taking out the two PCB maps brings it to 708,824 / 492 KB.
- **The 4 palette strips still need the transcoder.** They are KTX2, and the lab reads them back from the GPU 4 times to swap colours. With the swap resolved at build time, the card, hero and menu need no transcoder at all.
- **The lab's runtime bake is expensive.** It took 921 ms of main thread here, made 4 GPU readbacks, and leaves 10.65 MB of float geometry (non-indexed) where the loaded parts take 2.15 MB.
- **Creasing everything offline costs +267 KB gzipped**, almost all of it the switches: they account for 55.7k of the 59.7k new vertices. Everything except the switches is about +6% vertices.
- **The two panels depend on Montserrat** (`lab/mip.js` loads it), which no public page requests, plus two SVGs (20 KB gzipped). They should be frozen into tiny images at build time.

**b. Shader programs in the field.** The gallery's new pipe compiles 16 distinct programs across the field (the old pipe compiles 9 in the same gallery). Today's site field is 21, of which 9 come from the old Ci-Clop file's embedded light; the new Ci-Clop file has none.
- **One customProgramCacheKey per hook** (grain numbers moved into uniforms): 14.
- **Switching to MeshStandardMaterial everywhere:** 11, but it loses Wafer Studio's iridescence (4,632 px change). Switching only the cards where it's pixel-identical (6 of 11) leaves the count at 16, so it isn't worth it for programs.
- **Sharing one material per preset across tiles:** 86 → 35 material objects; programs unchanged.
- **Tone mapping in the field must be per material.** The composer renders into an offscreen target, where three turns tone mapping off per material. Applying Neutral in the final output pass would also tone-map the cards and the void. So Neutral has to be injected into each model material, with exposure as a uniform (per-model ev values would otherwise split programs) and a uniform switch for the LED domes. That gets to about 13.

**c. Draw calls.** Field model draws: 90 today, 150 with the new pipe unmerged, about 42 merged (Wafer 62 → ~11 with the keys as one InstancedMesh, ZMK 49 → 2, Sightseeing 13 → 3). The DoF depth pre-pass does draw the models a second time (26 of 35 objects), every second frame at half resolution.

**d. Studio PMREM.** One per renderer that draws models: 3 on the landing (universe, handoff rig, board), 1 per project route, 1 more for Wafer PLAY DEMO, 1 on menu intent on text-only pages. The menu always borrows. That's the same count as today.
- The studio uses no blur pass (sigma 0), about 2× cheaper than RoomEnvironment at sigma 0.06 in SwiftShader.
- Generating through a cube camera + `fromCubemap` drops the 3 MB depth buffer. At a 128 cube it is 1.5 MB instead of 9 MB per renderer.
- At 128, card pixels change by ≤0.37% (>16/255). Hero changes are ≤0.02% except Wafer Studio's thin-film chrome at 0.61%, so heroes keep 256.

**e. Lights, transcoder, KTX2Loader, menu.**
- The only shipped GLB with a light is the old Ci-Clop, so stripping lights becomes optional insurance (3 lines in `model-viewer.jsx`).
- The transcoder preload from the audit should not be added: after the port it would be wasted bytes on every card and hero.
- Seven routes import `KTX2Loader` (plus 3 module dependencies) and create a throwaway WebGL context for nothing.
- The menu on other routes would drop from 1,030 KB to about 600 KB.

**f. LED halos, glow planes, hooks.** All static: per-draw vector maths only, no loops, so the sleep rules hold. Don't add any animation; if a blink is ever wanted, drive it from the owning rig's loop. The Venovisor glow canvas is 512² (1.33 MB per instance); 256² shared per page would do. In the field, the sprites and the glow plane also get drawn in the DoF pre-pass with a wrong depth; a layer can keep them out.

**Two measured traps:**
- **Transparent + double-sided materials make three rebuild the program key twice per draw, every frame.** Making the board's 60 Wafer materials front-sided took it from 11.3 to 3.6 ms and from 209 to 149 draws. On the universe, rendering the 17 such materials (12 cards, 5 `wafer_demo`) in a single pass took it from 1.4 to 0.8 ms.
- **First-visibility compiles cause hitches in the field** (the 2 programs above).

## Ranked by saving against risk

| # | Item | Saving | Risk | In this port? |
|---|---|---|---|---|
| 1 | Wafer as one merged GLB (shared key mesh) with no KTX2 inside: PCB maps split out or dropped, palettes resolved at build time | Landing title −275 KB / −3 requests even with Venovisor added; full landing (title + board) 2,026 → 904 KB, 67 → 11 requests; `Wafer.html` −388 KB / −4 requests / −1 context; PLAY DEMO −847 KB / −53 requests; menu −431 KB / −10 requests; −10.7 MB GPU in each context holding the card, hero or handoff | Medium | Yes |
| 2 | KTX2 only where a KTX2 file exists: remove `KTX2Loader` from the 9 import maps, load it on the explosion path only (`menu-renderer.js` already does this); no transcoder preload | −4 module requests and −1 context on 7 routes; −265 KB and −1 context on the landing, `Wafer.html` and the menu | Low | Yes |
| 3 | Bake offline into that file: creased normals on everything except the switches, the board frame, the palette swap, the frozen panels | −0.9 s main thread, −4 GPU readbacks, −Montserrat, −2 SVGs and `mip.js` (~25 KB gzipped); about 3 MB instead of 10.65 MB geometry per context (×3 on the landing); cost an estimated +15–30 KB | Low–medium (check pixels against the lab) | Yes |
| 4 | New field: no analytic or GLB lights (cards and dust are unlit, so nothing else changes), Neutral injected per material with uniform exposure and LED switch, one grain key, chained hooks | Programs 21 → ~13; no recompile wave when a card arrives | Low | Yes |
| 5 | Merge static tiers by material at load (field, hero, handoff, menu) | Field 150 → ~42 draws (+ pre-pass); Wafer hero 62 → ~11; about 38 ms once | Low–medium | Yes (Wafer); ZMK and Sightseeing use the same helper |
| 6 | Keep every transparent new material front-sided (or `forceSinglePass`) | Board 11.3 → 3.6 ms | None | Yes |
| 7 | Clamp `dt` ≥ 0 in `solid-hero-rig` `update()` and the board-flight loop, as the universe already does | Stops the hero exploding after a long main-thread block; the new pipe's heavier compiles widen that window | None | Yes |
| 8 | Studio environment through a cube camera; 128 for field and board, 256 for heroes | −18 MB GPU on the landing | Low | Optional |
| 9 | Precompile each field model as it loads (`renderer.compile` on its holder while faded out) | Removes first-visibility hitches | Low | Optional |
| 10 | Share materials per look; share the glow canvas at 256²; keep sprites out of the DoF pre-pass | Small | Low | Optional |
| 11 | Quantize the two new marks (not sealed) | Venovisor 103 → 54 KB, Ci-Clop 85 → 60 KB gzipped. Needs a `_PRINTZ` scale uniform (otherwise 15 µm steps) and a check of the LED-ring and node frames | Medium | Later |
| 12 | Single-pass the 12 card materials (`forceSinglePass`; non-model) | Universe render 1.4 → 0.8 ms | Low (planar quads, so should be identical; not pixel-checked) | Separate change |
| 13 | Owner questions: keep the PCB art in the explosions (lazy +486 KB) or drop it everywhere (0); a static tier without switches (44% of Wafer triangles); the sealed ZMK PNG recompress (−47 KB); hero canvases full-viewport with antialias at device pixel ratio up to 2 (the biggest GPU-memory item on project routes) | | | Ask |
| 14 | Do not do: transcoder preload; Standard materials in the field to cut programs | | | No |

What the port adds against today, with reasons: Venovisor's real model (+103 KB on its route and the field), the new Ci-Clop (+11 KB gzipped, but 7 → 4 draws and 30k → 12k triangles), and about 12–15 KB gzipped of studio/preset JavaScript for the new look.

Everything is in `/home/oleksandr/projects/Portfolio-workspace/portfolio/lab/port/`:
- `perf.cjs` (harness; identical backup at `perfharness/perf.cjs`)
- `perf-before.json`
- `perfharness/gallery-probe.cjs`, `gallery-stddiff.cjs`, `gallery-wafer.cjs`, `board-share.cjs`, `universe-share.cjs`, `split-pcb.mjs`, `crease-offline.mjs`
- `perfharness/out/` (JSON results and the trial GLBs)