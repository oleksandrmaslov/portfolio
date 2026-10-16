# Wafer parts migration audit

2026-10-15 · read-only audit · no port implemented

**What this repo does:** The portfolio draws Wafer in several independent Three.js scenes and carries a shared hero pose across page navigation. The two shipping exploded views already use the 53 part files; the hero, field, flights and menu use the older assembled asset. Assumed load: one visitor moving among these scenes, including a constrained device, an uncached first visit, menu opening, PLAY DEMO, and browser Back.

**Verdict:** Use the merged **shared-mesh, named-node** variant as the common source, but do not treat this as a URL replacement. Preserve logical part groups, define one normalization and material application path for the hero/field/flights/menu, and explicitly adapt the two explosions. The physical coordinate frame agrees; the current bounding-box fit does **not** agree between the old GLB and unbaked parts.

References below are repository-relative `file:line` citations. Binary measurements are identified separately: GLBs have no meaningful text line numbers. Findings describe concrete consequences of the proposed port, not claims that all those failures already occur in production.

## Every relevant surface and entry point

| Surface / owner | Current source and lookup | Migration boundary |
| --- | --- | --- |
| Public entry | `Wafer.html:59` installs Three r160, GLTFLoader, MeshoptDecoder, RoomEnvironment and KTX2Loader; `Wafer.html:80` loads the generated page bundle. | Source edits alone do not change the deployed page. The relevant bundle inputs are at `tools/landing-runtime/build.cjs:181`. |
| Wafer hero | `app/projects/pages/wafer-page.jsx:291` directly passes `models/wafer_demo.glb` to `makeWaferRig`. `app/projects/rendering/solid-hero-rig.jsx:52` also defaults to that URL; its actual load is at `:227`. No part-name lookup. | Updating the registries alone leaves the hero on the old asset. |
| Registry and warm-up | `app/data/projects.js:31` owns the landing model URL and poses; `app/projects/data.jsx:21` separately records the case-study model. `app/shared/core.jsx:47` preloads the greeting model from `UNIVERSE_PROJECTS`. | Keep both records and the bespoke hero consistent. The greeting URL follows the field mapping at `app/landing/scenes/universe.jsx:26`. |
| Universe tile | `app/landing/scenes/universe.jsx:965` loads the registry URL, fits the whole scene, tunes materials and wraps its base pose at `:970`–`:998`. | Whole-model lookup, no individual part lookup. Model fade materials are collected at `:976`; all newly added meshes must participate. |
| Work reel | `app/landing/sections/work.jsx:17` selects registry entries. It has no second Wafer GLB renderer: the visible object is the Universe tile; `:384` asks the Universe for its bounds and emits the flight event. `app/landing/scenes/universe.jsx:2187` also routes clicks on a reel tile with origin `work`. | Port the field object once, preserve reel bounds and origin routing. |
| Forward flight | `app/landing/transitions/project-handoff.jsx:76` prepares a reusable node rig, `:187` builds/reuses it, and `:220` handles the forward event. `app/projects/rendering/project-handoff-rig.jsx:75` resolves `project.model.src` and calls the shared hero rig at `:96`. | Whole-model lookup. It must draw the same finished geometry/materials as the destination hero before seam capture at `app/landing/transitions/project-handoff.jsx:243`. |
| Forward page seam | `Wafer.html:30` paints the captured image. `app/projects/pages/wafer-page.jsx:308` restores yaw and removes that image only after `rig.ready` at `:338`. | An old/new geometry or finish split becomes visible when the image fades. |
| Reverse flight | `app/projects/pages/wafer-page.jsx:133` moves the page rig to handoff, records its yaw and destination; `app/landing/transitions/project-handoff.jsx:370` resolves the unfiltered registry entry and `:385` builds the return rig. | Preserve `mo_node_*`, yaw, fit, pose, camera, and render-readiness contracts in both directions. |
| Menu objects, every public route | `app/shared/menu-objects.js:44` loads by registry address/URL; `:69` uses the first featured model, Wafer, for WORK. It fits to 2.15 and uses `menuPose` before card/rig pose (`:59`, `:61`). | No part lookup. This runs outside the landing too: `app/shared/navigation.jsx:11` chooses a borrowed hero renderer or standalone menu; dependencies are at `app/shared/menu-renderer.js:57`. |
| Landing exploded keyboard | `app/landing/scenes/about-board.jsx:688` / `buildWaferReal` builds a 53-file list, loads each file at `:693`, and classifies the **filename** at `:715`. `:852` starts it; `:929`–`:938` animate visibility, wrappers and opacity. | Must change from filename results `{f, root}` to named **logical part roots**. This is separate from the large procedural circuit-board stage built at `:789`. |
| PLAY DEMO board | `demo/wafer-board.js:27`, `:30`, `:162` define/load the 53 files; `:102` parses key identities from the filename. | One wrapper per part, one press wrapper and material per key. Preserve the public board API at `:405`. |
| PLAY DEMO controller / HUD | `demo/wafer-demo.js:99` constructs that board; it does not load a GLB itself. It raycasts `board.keyMeshes` at `:149`, resolves keyboard input through `codeMap` at `:222`, and advances the intro only after `board.ready` at `:305`. `demo/wafer-hud.jsx:48` starts/stops the controller. | The board contract includes identities, key metadata, key materials, legends, readiness, layers, explode, wire and x-ray modes—not just a `group`. |
| Object study and embedded story | `lab/wafer.js:55`, `:711` load by filename; `:719`–`:775` align, bake and place geometry around half pivots; `:780` wires keys. `lab/wafer.html:139` imports it; `lab/story.js:319`–`:323` embeds the same engine from `lab/wafer-story.html:337`. | Retiring the 53 files also breaks both lab surfaces unless this loader is adapted. Keep half pivots and per-key metadata. |
| Material comparison gallery | `lab/materials-wafer.js:129` loads by filename, `:163` records the filename on each baked primitive, and `:230` assembles. `lab/materials-models.js:294` invokes it; `lab/materials.js:205` draws it and `:433` separately enumerates files for measurements. | Adapt both the loader and gallery byte-accounting list. Its OLD source follows the registry (`lab/materials-models.js:38`), so changing that registry also changes what OLD means. |
| Delivery recipe | `lab/perf/merge-wafer-parts.mjs:42` copies the source root nodes; `:52` deduplicates shared resources; `:54` optionally destroys key nodes for GPU instancing. | The recipe preserves existing node names rather than adding/validating them. The final asset needs a manifest assertion. |

Other Wafer drawings are independent of this GLB migration: the canvas fallback at `app/landing/scenes/universe.jsx:154` and the Design System SVG specimens at `app/design-system/patterns.jsx:404` / `:423`. **Wafer Studio is a different node**, using `models/wafer-mark.glb` at `app/data/projects.js:90`–`:100`; do not replace that logo with the keyboard. The menu's INDEX group can display that logo alongside the WORK keyboard (`app/shared/menu-objects.js:69`–`:70`).

## Must fix in the port

### 1. A registry-only migration leaves the hero and prefetch behind

- **What this is:** The landing reads the catalog, but Wafer's bespoke page passes a literal old URL; the hero rig has the same old fallback. Sources: `app/data/projects.js:32`, `app/projects/data.jsx:21`, `app/projects/pages/wafer-page.jsx:291`, `app/projects/rendering/solid-hero-rig.jsx:52`, `index.html:197`.
- **Problem:** Changing only the catalog makes the field/flight/menu show parts while the page hero remains old. Deleting the old GLB then fails the hero load; the speculative prefetch also requests a deleted file.
- **Fix:** Move every active URL consumer together, including the prefetch and rig default; have the bespoke hero consume the same model specification rather than another migration-specific literal. Keep both registries aligned.
- **If we skip it:** The seam swaps geometry or the hero is empty. The page's arrival poll has no failure deadline (`app/projects/pages/wafer-page.jsx:338`), so a failed hero can retain the seam indefinitely.

### 2. The instanced merge is incompatible with current key interaction and explosions

- **What this is:** The shared variant retains 53 logical nodes and shares key geometry; the instanced variant removes the 36 key nodes and creates one `keys` node, retaining identities only in `extras.instances` (`lab/perf/merge-wafer-parts.mjs:52`–`:66`).
- **Problem:** `getObjectByName("key_L_r0c0")` cannot recover an instance. PLAY DEMO expects a distinct cap object with `userData.key`, its own material, and a press wrapper; raycasting ignores `instanceId` (`demo/wafer-board.js:233`–`:280`, `demo/wafer-demo.js:149`). The landing also explodes each logical part independently (`app/landing/scenes/about-board.jsx:714`–`:721`).
- **Fix:** Ship the shared-mesh variant, preserving 17 structural roots and the 36 exact `key_[LR]_(r[0-2]c[0-4]|t[0-2])` identities. If a static surface batches geometry, do it on that surface's clone after preserving the canonical source.
- **If we skip it:** Keys no longer press/pick independently; per-key explode staggering disappears. Expanding the instances at runtime would restore those objects but adds work for effectively no transfer saving (`lab/models-perf.md:81`–`:96`).

### 3. Matching axes does not guarantee matching fit: the raw parts' bounds are inflated

- **What this is:** The shared fitter uses `Box3.setFromObject`, recentres that box and scales its longest edge (`app/projects/rendering/model-viewer.jsx:146`–`:155`). The field also projects a `setFromObject` box as the flight origin (`app/landing/scenes/universe.jsx:2058`–`:2084`); flight start scale uses that screen height (`app/landing/transitions/project-handoff.jsx:284`–`:299`).
- **Problem:** Measured below: the raw parts have a 289.611 mm fit width even though their actual geometry is 279.888 mm wide, essentially the old model's width. Rotated switch assemblies inflate their transformed local boxes. At fit 4.0 the raw-parts multiplier is 13.811636 instead of 14.291417: **3.36% smaller**, with a shifted fit centre. The material adapter instead bakes the vertices before fitting (`lab/materials-wafer.js:160`, `:168`), removing this inflation.
- **Fix:** Use the same accurately normalized geometry/bounds on every static surface. Keep one metre/Z-up source contract, or consistently use the baked adapter's millimetre/Z-up output; do not mix raw-part fitting with baked-part fitting. Preserve the pose wrapper outside the centred root (`app/landing/scenes/universe.jsx:988`).
- **If we skip it:** A hero using baked parts and a flight using raw parts disagree in size/centre despite equal `rigFit` and `rigPose`. Screen-origin sizing also changes. Retuning one pose number hides only one leg of the mismatch.

### 4. Reparent whole logical parts without losing their transforms or parent frame

- **What this is:** Today each load returns a scene containing the exported part transform; animation is applied to a new identity wrapper. Landing motion overwrites wrapper position (`app/landing/scenes/about-board.jsx:720`, `:936`); demo motion does the same, with a second wrapper for key travel (`demo/wafer-board.js:229`–`:237`, `:364`, `:389`).
- **Problem:** Moving a named mesh directly and calling the existing `position.set(...)` erases its authored translation. Selecting only leaf meshes also loses logical boundaries: binary inspection found 60 primitives across 53 roots—`mcu` has two, each `usbc_*` has four. Extracting children from an already fitted/rotated assembly without preserving the inherited transform changes their placement.
- **Fix:** Resolve a snapshot of the named logical roots, retain all descendants and local TRS, then wrap them in a common untransformed assembly frame. Measure assembled and part boxes in that same frame before applying fit/alignment; do not depend on stale ancestor matrices. The demo currently assigns recenter/align transforms before its second bounds pass (`demo/wafer-board.js:198`–`:215`), so adding an eager matrix update during the refactor can change those measurements.
- **If we skip it:** USB pieces separate from their connector, parts orbit or teleport, key legends float away, and explode zero no longer reconstructs the assembled board.

### 5. The material adapter's output is not a ready-made exploded-board hierarchy

- **What this is:** `loadParts` emits one item **per primitive**, and `assemble` gives each mesh its logical part name (`lab/materials-wafer.js:155`–`:164`, `:230`–`:238`). Screen overlays are unnamed siblings added directly to the board, not children of the displays (`:237`–`:238`).
- **Problem:** A new consumer doing one `getObjectByName("usbc_L")` against this flattened output gets only the first of four identically named meshes. Moving `display_L` alone leaves its MIP overlay behind; traversing only named parts can also omit overlays from fading and view-mode lists.
- **Fix:** Preserve or reconstruct one group per logical part, with uniquely identifiable primitive children. Parent each screen overlay under its display group in the correct coordinates, and include overlays in opacity and view-mode handling.
- **If we skip it:** The closed static assembly can look correct while either exploded view tears connectors apart and leaves lit screens suspended at their original positions.

### 6. Current material cloning strips the studio's grain shaders

- **What this is:** Studio presets install `onBeforeCompile` and `customProgramCacheKey` on each material (`lab/studio.js:252`, `:338`–`:355`). A read-only check against Three **r160** confirmed that `pbtCap().clone()` preserves neither custom function.
- **Problem:** Cloning occurs in the shared tuning pass (`app/projects/rendering/solid-materials.js:42`), which the hero, field and menu all call (`app/projects/rendering/solid-hero-rig.jsx:166`, `app/landing/scenes/universe.jsx:974`, `app/shared/menu-objects.js:53`). Both exploded views also clone materials, and demo x-ray clones again (`app/landing/scenes/about-board.jsx:722`, `demo/wafer-board.js:246`, `:298`, `:334`). Applying presets before those passes silently removes their grain and also overwrites stage environment strength/luma.
- **Fix:** Create the final preset materials per consumer after source cloning, and avoid generic retuning/cloning afterward. Build x-ray from the same preset factory or explicitly preserve its shader functions. Keep per-key material instances for emissive feedback; keep per-scene opacity mutable for field/board fades.
- **If we skip it:** The port appears to use studio materials but loses their shader finish, lifts black to the old 0.04 floor, or changes the look during the flight. A shared material also lets one key's glow or one scene's fade alter another (`demo/wafer-board.js:400`, `app/projects/rendering/solid-materials.js:33`).

### 7. Wafer needs part classification and palette reconstruction, not only `BY_NAME`

- **What this is:** `studio.js`'s generic table maps other models' material names (`lab/studio.js:204`); Wafer's adapter instead dispatches by part kind and reads CAD palette colours for switches/displays (`lab/materials-wafer.js:64`, `:83`, `:162`, `:212`). The merge deduplicates materials but does not apply new finishes (`lab/perf/merge-wafer-parts.mjs:52`).
- **Problem:** Calling only `presets(...).apply(root)` leaves Wafer materials unmapped. Switch/display reconstruction expects `src.map`, palette width divided by four, the original UV indexing and a renderer for GPU readback (`lab/materials-wafer.js:67`–`:91`). Screen placement further requires the active palette tag and upward normals in the baked **Y-up** frame (`:189`–`:199`).
- **Fix:** Carry the part-aware factory and palette processing across, preserving UVs, palette strips and multi-primitive roots. Resolve kind from the logical parent, not GLTFLoader's primitive child name. Do not turn all original materials into one assigned material before the adapter reads them. If taking the baked geometry path, preserve its mirrored-transform winding correction and 40-degree creased normals (`lab/materials-wafer.js:114`–`:125`, `:40`); assigning materials alone does not perform that normal repair.
- **If we skip it:** CAD colours remain, metallic/plastic regions collapse into one finish, or screen placement finds no active area. `src.map` removal can fail the palette read outright.

### 8. Blindly taking the adapter's PCB material removes exposed board artwork

- **What this is:** The two PCB sources retain their individual KTX2 colour maps. Existing exploded views clone and retain these maps (`app/landing/scenes/about-board.jsx:722`, `demo/wafer-board.js:295`). The adapter saves `src.map` but deliberately returns `P.soldermask()` without it (`lab/materials-wafer.js:163`, `:218`).
- **Problem:** That closed-product choice becomes a feature loss when the PCB is exposed by either explosion: artwork and traces become a plain dark surface. It also does **not** save download/transcode cost, since the source GLB was already parsed before material replacement. Dropping KTX2 support is unsafe even if PCB maps are removed: display/switch palette processing still depends on compressed textures (`lab/materials-wafer.js:66`).
- **Fix:** Retain the PCB map for surfaces exposing it—`P.soldermask(it.src.map)` is supported and keeps the map's authored colour (`lab/studio.js:198`, `:237`–`:239`). Any re-inking or lower-resolution alternative needs an explicit visual comparison. Preserve Meshopt/KTX2 configuration for the final merged asset and the menu's lazy dependency path (`app/projects/rendering/model-viewer.jsx:96`–`:104`, `app/shared/menu-renderer.js:57`).
- **If we skip it:** Explosions lose the actual PCB detail, or the merged model fails as a whole when its required texture decoder is absent. The large procedural board's canvas textures are separate and must not be mistaken for replacement PCB artwork (`app/landing/scenes/about-board.jsx:789`–`:803`).

### 9. An async material/parts builder cannot be plugged into today's synchronous `buildModel`

- **What this is:** The hero accepts a synchronous `Object3D` or `{group, update}` from `buildModel(THREE)` (`app/projects/rendering/solid-hero-rig.jsx:210`–`:220`). The new adapter's load/screens operations are async and require a renderer (`lab/materials-wafer.js:129`, `:178`). `makeNodeRig` forwards only URL, pose, fit and `assignMaterial` for real models (`app/projects/rendering/project-handoff-rig.jsx:75`–`:88`).
- **Problem:** Passing an async function yields a Promise that the hero treats as a model and attempts to fit. Adding `buildModel` or `keepMaterials` to the registry alone does nothing in the node-rig/field/menu paths. Marking ready on raw GLB completion also releases transitions before material readback and screen mounting finish.
- **Fix:** Integrate an awaited finishing step with access to the owning renderer and the existing generation/disposal guard, or prepare the complete descriptor before ingestion. Forward the required options through every consumer, and set `ready` only when the final object is drawable.
- **If we skip it:** Empty rigs, missing screens in seam captures, or a visual pop after a nominally ready flight. Both flight directions explicitly wait for two drawable frames (`app/landing/transitions/project-handoff.jsx:342`, `:448`); preserve that contract.

### 10. Importing the lab modules directly fails deployment and the current script build

- **What this is:** The deployment excludes `lab/` (`.github/workflows/deploy-pages.yml:55`). The runtime compiler uses `sourceType: "script"`, not an ES-module bundler (`tools/landing-runtime/build.cjs:215`–`:225`), whereas `materials-wafer.js` imports addon utilities and `./mip.js` (`lab/materials-wafer.js:24`).
- **Problem:** A production import from `lab/` returns 404 after deployment; adding those modules to the current classic-script concatenation does not resolve their imports/exports. Relocating MIP also changes the meaning of its `new URL("../assets/...", import.meta.url)` paths (`lab/mip.js:144`–`:151`).
- **Fix:** Promote the needed modules into deployed application source and wire their module loading or compilation deliberately. Ship both screen SVGs, repair module-relative asset URLs, and include the screen font or pre-rendered text. Public Wafer currently loads the standard font set, whereas the MIP drawing explicitly requests Montserrat (`Wafer.html:12`, `lab/mip.js:28`, `:145`).
- **If we skip it:** The local lab works but the deployed model does not, or the panels use fallback font metrics/empty art. `makeWaferScreens` catches drawing failures and returns the screen objects anyway (`lab/materials-wafer.js:180`–`:185`), so readiness alone will not reveal that failure.

### 11. Keep shared geometry/textures out of per-scene disposal

- **What this is:** `loadProjectModel` returns `root.clone(true)` (`app/projects/rendering/model-viewer.jsx:120`), sharing source geometry/material/texture resources. The adapter likewise reuses `it.geometry` across assemblies (`lab/materials-wafer.js:233`). Its gallery carefully excludes shared screens and only frees marked owned geometry (`lab/materials-models.js:300`, `lab/materials.js:520`–`:530`).
- **Problem:** The hero treats **all** builder geometry/textures as owned (`app/projects/rendering/solid-hero-rig.jsx:207`, `:125`–`:142`); the landing board indiscriminately disposes traversed geometries and textures (`app/landing/scenes/about-board.jsx:953`–`:974`). Universe cleanup also disposes model geometry (`app/landing/scenes/universe.jsx:3188`). Conversely, the normal GLB hero path does not free newly created material textures, and the menu's `own(root, false)` does not own them (`app/shared/menu-objects.js:34`, `:58`).
- **Fix:** Make source/baked geometry and source/screen textures explicitly cache-owned; make new palette maps, materials and screen-plane geometry explicitly instance-owned. Reuse the gallery's ownership distinction rather than inferring ownership solely from `buildModel` versus URL.
- **If we skip it:** Switching/disposal of a flight or board frees resources still referenced by another surface, causing re-uploads/recompiles; custom palette/screen allocations can also leak. This is a pre-existing broad-cleanup risk made more important when all surfaces share one asset and baked cache.

## Should fix / verify before shipping

### 12. Studio materials alone do not reproduce the studio's lighting or grain scale

- **What this is:** The studio uses explicit stage radiance, a custom environment and PBR Neutral tone (`lab/studio.js:44`, `:57`, `:144`). Production hero/menu/demo/board use different RoomEnvironment, ACES exposure and lights (`app/projects/rendering/solid-hero-rig.jsx:67`–`:107`, `app/shared/menu-objects.js:146`, `demo/wafer-demo.js:78`–`:97`, `app/landing/scenes/about-board.jsx:751`–`:787`).
- **Problem:** The gallery also adds a 0.02 material floor outside `STAGES.void` (`lab/materials-models.js:24`). In addition, grain multiplies the raw local vertex `position` by 4000/6000, while the adapter bakes positions in **millimetres**, and a raw quantized GLB has another local scale (`lab/studio.js:182`, `:188`, `:342`, `lab/materials-wafer.js:39`, `:153`). The intended physical grain size does not survive those coordinate changes automatically.
- **Fix:** Specify stage/environment/tone and physical shader coordinates alongside the finish. Calibrate grain in a defined physical unit; check its close-up visibility after baking and fit. Match hero and flight exactly, then review field/menu readability under their chosen lighting.
- **If we skip it:** Identically named materials look different across scenes; black surfaces can disappear or wash out, and fine grain can be filtered away. This needs rendered validation, not only matching preset numbers.

### 13. Do not undo the merged asset's loading and sharing gains in the adapter

- **What this is:** The shared loader limits jobs to two/four and caches by URL (`app/projects/rendering/model-viewer.jsx:20`–`:46`). The lab adapter instead loads all filenames through its supplied GLTFLoader (`lab/materials-wafer.js:130`); it bakes each primitive to a new non-indexed geometry and creates a new material per item (`:111`–`:125`, `:233`).
- **Problem:** Reusing that loader unchanged retains 53 requests even after adding a merged file. The bake also expands the deduplicated keys again: the current input has 386,376 triangle vertices, yielding **11,166,096 bytes** of float position/normal/UV arrays across all baked primitives, before temporary geometries, screen planes, source cache and textures. Existing performance measurements put raw shared geometry near 1.96 MB and draw calls at 5 old versus 60 merged, before two screen overlays (`lab/models-perf.md:29`–`:30`, `:79`–`:98`).
- **Fix:** Fetch/cache one canonical URL, bake immutable geometry once, and share it safely among scenes. Preserve key geometry sharing where compatible with the chosen coordinate convention; static-only batching must not destroy the interactive source graph. Measure final baked/materialized cost rather than carrying over the raw-GLB numbers.
- **If we skip it:** The port improves packaging but retains slow request fan-out or substantially increases memory/CPU. The previous report's raw merged-file measurements do not establish performance for the new finish pipeline.

### 14. Missing parts and failed merged loads need an explicit outcome

- **What this is:** The demo and landing board currently swallow individual file failures and proceed if any parts loaded (`demo/wafer-board.js:162`–`:168`, `app/landing/scenes/about-board.jsx:693`–`:699`). The adapter also keeps fulfilled parts (`lab/materials-wafer.js:130`–`:135`).
- **Problem:** A misspelled node name can therefore become a partial but “ready” board. With a single merged request, a network/decoder failure removes the entire board; the demo intro waits on readiness indefinitely (`demo/wafer-demo.js:305`), and the hero arrival poll is similarly unbounded (`app/projects/pages/wafer-page.jsx:338`).
- **Fix:** Validate the expected logical-name set before fitting/building interactions, propagate an explicit failed state, and retain usable exit/navigation controls when loading fails. Preserve late-load disposal checks (`app/landing/scenes/about-board.jsx:697`) and hero generation checks (`app/projects/rendering/solid-hero-rig.jsx:152`).
- **If we skip it:** A structurally incomplete keyboard is presented as complete, or loading hangs. The controller's boot copy also still says “51 PARTS” despite the 53-part manifest (`demo/wafer-demo.js:33`, `demo/wafer-board.js:30`); update that count when touching this path.

### 15. Existing tests do not pin the migration's geometry or interaction contracts

- **What this is:** The runtime suite passes, but the closest tests replace model/scene operations with stubs. Exact coverage is listed below.
- **Problem:** A green test run cannot detect dropped named nodes, changed transforms, incorrect centring, missing screen children, blank PCB maps, lost shader hooks or broken key picking. The lab material-name check also excludes only the literal old filename and will scan a newly named merged Wafer as a generic sealed model (`lab/studio.check.mjs:178`–`:185`). Its CAD material names are handled by kind, not `BY_NAME`.
- **Fix:** Add focused asset/consumer contract checks during implementation, including explicit handling of the new Wafer in the lab material check. Keep normal freshness checks, but do not use them as a visual-alignment test.
- **If we skip it:** The port can pass CI while losing essential behavior; alternatively the useful lab check starts failing for the wrong mapping rule.

## Explosion contract to preserve

The file list consists of 17 structural parts—`case_L/R`, `plate_L/R`, `pcb_L/R`, `usbc_L/R`, `switches_L/R`, `mcu`, `display_L/R`, `antenna_L/R`, `softoff_L/R`—plus 30 matrix keys (`r0..2`, `c0..4`, both sides) and six thumbs (`t0..2`, both sides). The lists are independently duplicated in `demo/wafer-board.js:30`, `app/landing/scenes/about-board.jsx:691`, `lab/wafer.js:56`, `lab/materials-wafer.js:29`, and the merge recipe at `lab/perf/merge-wafer-parts.mjs:32`. Binary inspection confirmed that every current part file contains exactly one scene root with the matching basename.

| Contract | Landing exploded keyboard | PLAY DEMO |
| --- | --- | --- |
| Axis / fit | Minimum bbox axis is up, signed toward keycaps; longest is the half-split axis; rotate up to world +Y and long to +X; fit width 13 (`about-board.jsx:705`–`:730`). | Same axis/sign strategy; fit 3.6 (`demo/wafer-board.js:97`, `:173`–`:208`). |
| Explode offsets | `UP * height[kind] * base * 0.35 + horizontalRelativeCentre * 0.4`; final motion multiplied by eased explode and 0.30 (`about-board.jsx:686`, `:719`, `:936`). | `UP * height[kind] * base + horizontalRelativeCentre * 0.5`; kind stagger plus extra key stagger, adjustable distance (`demo/wafer-board.js:84`, `:223`–`:227`, `:290`, `:358`–`:365`). |
| Layer heights | Both use key 1.06, case .60, display .40, switches .18, USB -.36, plate -.82, antenna -.62, softoff -.54, PCB -.52, MCU -.42 (`about-board.jsx:686`, `demo/wafer-board.js:84`). | Preserve the lower-layer stagger ordering as well as heights; deeper parts begin first to avoid clipping (`demo/wafer-board.js:79`–`:95`). |
| Rest transforms | Identity animated wrappers around authored part roots. The assembled centre is subtracted on the parent (`about-board.jsx:720`, `:724`). | Identity explode wrapper → identity press wrapper → authored key root; legends share the press wrapper. Press travel is `base * .002` along signed UP (`demo/wafer-board.js:195`, `:233`–`:267`, `:389`). |
| Material behavior | Every visible material must join opacity animation (`about-board.jsx:722`, `:938`). | Keys have independent emissive feedback; structural materials support solid/x-ray/wire, and legends hide in wire (`demo/wafer-board.js:244`, `:327`–`:350`, `:400`). |
| Key identity | Used for kind/sign/explode grouping. | Exact regex drives row, column, side, thumb, legends, code map and right-half reversal (`demo/wafer-board.js:102`, `:150`, `:282`). Ray hits must expose `object.userData.key` (`demo/wafer-demo.js:149`). |

In this table, abbreviated `about-board.jsx` means `app/landing/scenes/about-board.jsx`. These algorithms move wrappers by **translation**, not rotation around a part's geometric centre. Recentring each extracted part independently without restoring its assembly placement is therefore not an equivalent port.

## Orientation and scale: measured result

**The original assets share a physical frame:** metres, long direction X, thin/up direction +Z, thumbs toward negative Y. The two PCB roots have identical transforms and bounds in the old model and separate exports. The merge script preserves source node transforms (`lab/perf/merge-wafer-parts.mjs:43`–`:46`); the previous experiment reports matching part bounds after merge (`lab/models-perf.md:77`). I did not generate a new merged file during this audit.

Read-only binary inspection decoded Meshopt geometry in memory, traversed node and instance transforms, and compared transformed-vertex bounds with the box method used by `fitModelToSize`. The available GLTFLoader used for geometry-only parsing was r186; textures/material references were removed **only in memory** for that measurement. I separately verified the runtime-box results using the site's **r160 Box3**, and verified shader-clone behavior with r160. This is not a browser render or KTX2 validation.

| Input / measurement | X × Y × Z extent, mm | Centre, mm |
| --- | --- | --- |
| Old GLB, runtime box | 279.888263 × 96.257250 × 8.098361 | 153.590015, -94.589546, 2.749615 |
| 53 parts, runtime box | 289.610878 × 142.786217 × 8.105974 | 158.451323, -98.189847, 2.749988 |
| 53 parts, actual transformed vertices | 279.888263 × 96.248370 × 8.105973 | 153.590015, -94.589546, 2.749987 |

The oversized box comes from `switches_L` / `switches_R`: for example the right switches' transformed local box spans Y -169.583 to -26.797 mm, while their actual vertices span -136.696 to -51.717 mm. This explains the fit mismatch without implying the physical keyboard is 142.8 mm deep. The governing source is `app/projects/rendering/model-viewer.jsx:147`, not the nominal glTF metre unit.

`materials-wafer.js` changes the representation: it rotates +Z to +Y, yaw-aligns the thumbs, multiplies by 1000, bakes all node transforms, centres X/Z and puts the bottom at Y=0 (`lab/materials-wafer.js:145`–`:170`). `assemble` then rotates the whole group +π/2 around X to return it to Z-up (`:241`–`:243`). Measured orientation correction beyond the up-axis round trip is only about 0.000003816 radians. Its resulting Z-up dimensions are approximately **279.888263 × 96.248799 × 8.105973 mm**, before screen overlays. It is floor-origin millimetre geometry, not the original off-centre metre graph.

The ordinary fit can remove that uniform unit change and centre offset **if all static consumers receive this same representation**. It cannot reconcile different silhouettes, inflated boxes or differently parented display planes. Preserve the shared hero/flight fit 4.0 and base tilt -0.92 unless a deliberate visual change is made (`app/data/projects.js:33`–`:34`, `app/projects/rendering/solid-hero-rig.jsx:34`–`:41`). Card fit is separately `2.9 * 1.9 = 5.51`, with tilt -1.15; menu tilt is -.28/.08/-.04 (`app/data/projects.js:35`–`:36`, `app/landing/scenes/universe.jsx:36`). Those differences are authored scene poses, not evidence of different asset axes.

## What the runtime tests actually pin

| Check | What it protects | What it does not protect |
| --- | --- | --- |
| `tools/landing-runtime/model-decoder.test.cjs:18`, `:23` | Retry after late KTX2 installation; retain successful cached work. | Uses a fake loader and fake cloned scene (`:9`–`:16`); no real merged GLB, Meshopt payload, node names, UVs or texture decoding. |
| `tools/landing-runtime/hero-restore.test.cjs:59` | Wafer render-loop sleep/wake, exit flags and Back returning to rest. | `makeWaferRig` is stubbed and always ready (`:17`–`:20`); no geometry, pose/fit equivalence, seam image or load failure. |
| `tools/landing-runtime/menu-renderer.test.cjs:16`, `:21`, `:30` | Opening/closing, one demand callback, sleep, rapid reopen/disposal. | `createMenuObjects` is stubbed (`:5`–`:8`); no Wafer source, material or mesh checks. |
| `tools/landing-runtime/preloader-clock.test.cjs:45`, `:65` | Milestone timing, failure deadline, reduced-motion reveal. | Milestones are dispatched synthetically (`:41`); it does not verify that Wafer actually painted. |
| `tools/landing-runtime/hover-hud.test.cjs:18`, `:24` | Efficient projected HUD movement and corner connections. | No actual model bounds or flight-size comparison. |
| `tools/landing-runtime/demo-audio.test.cjs:45`, `:73`, `:84`, `:94` | Sound-call compatibility, sampled-player wiring, composition and key audio asset. | No board assembly, key picking/travel, layers or exploded geometry. |
| `tools/landing-runtime/styles-version.test.cjs:8` | Current CSS content hashes in public HTML. | No model contract. |
| `tools/landing-runtime/build.cjs:378`, `:531` | Registry/script stamps, generated bundle/HTML freshness. | No semantic equality between registry/hero options or binary assets. The script's write branch is separate at `:545`. |

There is **no existing runtime test that pins `wafer_demo.glb`, the 53-part manifest, per-part pivots, normalized bounds, the explode layer table, MIP attachment, studio material hooks, or forward/reverse Wafer visual alignment**. The tests above cannot establish those properties because the relevant model work is stubbed or outside their assertions.

The smallest useful port checks are:

1. Load the final shared asset and assert all 53 logical roots, 36 independently addressable keys, multi-primitive connector/MCU integrity, and transform/bounds agreement with the inputs. This protects the recipe at `lab/perf/merge-wafer-parts.mjs:42` and consumers at `demo/wafer-board.js:211` / `app/landing/scenes/about-board.jsx:714`.
2. Compare normalized hero/flight/field geometry and landmarks using the real fitter, and exercise both navigation directions from field and reel. This protects `app/projects/rendering/model-viewer.jsx:146`, `app/landing/transitions/project-handoff.jsx:284`, and `app/projects/pages/wafer-page.jsx:308`.
3. Exercise explode 0 → 1 → 0, independent key press/pick, left/right legend wiring, solid/x-ray/wire, display attachment and PCB maps. This protects `demo/wafer-board.js:233`, `:282`, `:341`, `:354` and `demo/wafer-demo.js:149`.
4. Check final material shader hooks and source-resource ownership after each consumer's finishing pass and disposal; test failed load and slow load too. This protects `lab/studio.js:338`, `app/projects/rendering/solid-hero-rig.jsx:125`, and the readiness contracts cited above.

## Validation performed and limits

- Read the supplied context and repository `AGENTS.md`; traced authored sources, entry HTML, runtime manifest, merge recipe, performance notes, lab material pipeline and runtime tests.
- Ran `node --test tools/landing-runtime/*.test.cjs`: **44 passed, 0 failed**.
- Ran `node tools/landing-runtime/build.cjs --check`: **current landing runtime, 24 page phase bundles, 16 deployed root pages**. This was the read-only check branch (`tools/landing-runtime/build.cjs:531`), not the build/write branch.
- Inspected the original GLBs in memory: 53 correctly named roots / 60 primitives; measured geometry, boxes and orientation; checked material-clone hooks with Three r160. No GLB was generated, rewritten or downloaded.
- Only this report was written. No build, dependency install, server, or use of port 8765.

**Not checked:** A final merged asset does not yet form part of this port audit; the recipe's output was not regenerated. No browser screenshot comparison, live GPU performance measurement, KTX2 transcode/render, final material appearance, or implemented migration was tested. Existing performance figures quoted above belong to `lab/models-perf.md:6`–`:12` and its stated software-rendering conditions. Public routes, generated runtimes, models and existing worktree changes were left untouched.
