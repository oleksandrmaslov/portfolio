# Model retouch: one studio, sealed models, a finish each

This is the handoff for bringing every portfolio model up to the photoreal Wafer study (`lab/wafer.html`) and giving each logo its own signature finish, without changing a single GLB and without making the site noticeably slower.

Started 2026-10-14. **Status 2026-10-15: §3 and the hardware half of §4 are on the site.** The studio lives in `app/projects/rendering/studio.js` (one room, PBR Neutral inside every model material, the preset table, the hardware finishes, the per-model `LOOKS`), and `lab/materials.html` renders through it. Wafer ships as `models/wafer.glb` (the 53 parts merged by `tools/wafer/build.mjs`) on every surface, and `wafer_demo.glb` is gone. Ci-Clop and Venovisor ship from `lab/models/`. Still open: the seven logo signature finishes (§4), the hero accumulation engine on `Wafer.html` (§6 step 2), Kerfur's model.

The idea in one line: **realism is shared, character is per model, and the models stay as they are.** Every model gets the same studio, the same tone mapping and the same material library, so they read as one family.

**The GLBs are sealed.** Most of them are logos (Brionel, ZMK PointAccel, Bulgaria, Sightseeing, Silent Depth, Iskra, Wafer Studio), and their geometry, node names and colours are final. All of the change happens at render time:

- **Logos** get a *signature finish*: one material treatment, looked up by the material names the GLBs already carry.
- **Hardware** (Wafer, Split HID Display, Soft Off keycap) gets a realism retouch toward what the real object is made of.
- **Kerfur, Venovisor and Ci-Clop** are on hold until the user provides updated models.

---

## 1. What made the Wafer study look real (and what it costs)

Almost none of the realism comes from downloaded textures. It is code that runs once at load, plus a renderer that stops when nothing moves.

| Technique | Where it lives | Bytes | GPU cost | Can every model have it? |
|---|---|---|---|---|
| A procedural photo studio (soft grey room and softboxes) rendered once into a PMREM | `lab/wafer.js` ~l.106–140 | 0 | Once at load | **Yes**, and it should be shared |
| PBR Neutral tone mapping, which keeps product colours true; ACES shifts and desaturates them | renderer setup | 0 | 0 | **Yes** (see §3, it needs a re-tune) |
| `MeshPhysicalMaterial` presets: anisotropy for brushed steel, clearcoat for enamel and glass, palette `DataTexture`s instead of image maps | `lab/wafer.js` ~l.482–600 | 0 | Small | **Yes** |
| Real bevels on edges, which catch highlights | geometry | Some | Triangles | Per model, in CAD or Blender |
| Soft area-light sun shadow, plus height-field sky occlusion | `lab/wafer.js` | 0 | Large | **Hero tier only** |
| Progressive accumulation: 48 jittered frames, then the renderer stops | `lab/wafer.js` (`SAMPLES = 48`) | 0 | Large while moving, **zero when idle** | **Hero tier only** |

### Measured weight: the study against the shipping Wafer

These are headless Chrome numbers at 1440×900, measured 2026-10-14.

| | Shipping (`Wafer.html`) | Study (`lab/wafer.html`) |
|---|---|---|
| Model | `models/wafer_demo.glb`: 1 file, 802 KB, 94k triangles | `models/wafer_parts/*.glb`: 53 files, 1.11 MB, 129k triangles |
| Image textures | 223 KB KTX2 (the PCB) | 224 KB KTX2 (the **same** PCB textures, and nothing else) |
| Page code | `wafer-page.js` 222 KB raw | lab modules 49 KB gzipped |
| Whole page, raw bytes | 38 requests, 3.75 MB | 95 requests, 4.06 MB |
| Shared by both | about 2.1 MB of uncompressed three.js from the CDN, much smaller over the wire | |

**The +310 KB is mostly already paid.** `app/landing/scenes/about-board.jsx` (`buildWaferReal`) already loads exactly these 53 part files for the landing's exploded board. A visitor who came through the landing has them cached.

If every Wafer surface moves to the parts, `wafer_demo.glb` can go. That file is 802 KB and `index.html` prefetches it. The site would get **lighter**. (Only as one merged file: 53 separate files would be heavier than wafer_demo. See `lab/models-perf.md` §4.)

### GPU memory is the real cost

The memory goes on render targets, not on bytes. These figures are estimated from the target formats in `resize()`; they were not measured.

- **About 370 MB at a retina laptop** (2880×1800, at the 6 MP cap). This is made up of:
  - 2 half-float accumulation targets
  - the live target and its depth
  - the 2× multisampled half-float scene target and its resolve
  - a 2048² shadow map
- **About 140 MB at 1440×900 @1×.**

The cheapest saving is to drop multisampling at DPR > 1.5. The accumulation already antialiases a still view, and only the moving frames lose AA. That saves roughly 125 MB at retina.

This has not been measured on a real GPU. Do that before shipping, with a frame-time probe like the one the Universe uses for depth of field (AGENTS.md, "Adaptive depth of field").

---

## 2. Three tiers, one look

Never run the hero renderer more than once on a page. Consistency comes from sharing the **studio and the materials** across tiers, not from shipping the heavy renderer everywhere.

| Tier | Where | Renderer | Signature effect |
|---|---|---|---|
| **Hero** | One object on its own project page | The lab engine: accumulation, area shadow, height-field. Sleeps when idle. | Fully live |
| **Rig** | `solid-hero-rig.jsx` (every other project hero), the handoff flight, Board Flight | One pass with the same studio PMREM, tone map and presets. Baked AO. No accumulation. | Live while visible and interacted with, or one-shot on arrival |
| **Field** | Universe tiles, the work reel, the menu objects | One pass with the same env and presets. Use `MeshStandardMaterial` wherever clearcoat or anisotropy can't be seen at card size. | **Frozen**: a static still of the effect, with no animation and no extra shader program |

Fall back to the next tier down when the device is weak, using the same probe logic as the Universe's DOF gate. Under `prefers-reduced-motion`, every signature shows its end state.

---

## 3. The shared studio (consistency)

- **Where it lives now (lab).** The studio is `lab/studio.js` (stages light/dark/void with their own room strengths, `TONE`, presets, `BY_NAME`, `tpuPrinted`, grain). The gallery `lab/materials.html` (+ `materials-models.js`, `materials-wafer.js`) applies it per model: logos get their own room strength and floor, metals their own, olive parts (+0.3 EV) their own. `studio.js` lifts no sealed colour by default; a caller passes an explicit `floor`. Venovisor's olive is one constant, `VENO_OLIVE` in `materials-models.js`. The step below still applies when this ports to the site.
- **One place (site).** Extend `app/projects/rendering/solid-materials.js`, which already owns "make real materials read" (`tuneRealMaterials`, `applySolidMaterials`). Do not add a third material file. **Done differently:** a new `studio.js`, compiled into every bundle as `window.MOStudio`; `solid-materials.js` is deleted and `lab/wafer.js` keeps its own renderer.
  - Move the lab's procedural studio, its tone-mapping choice and its material presets there, behind `window.*` like the existing helpers.
  - Change `lab/wafer.js` to read them from there.
  - Treat it like `tokens.css`, but for 3D: a model never sets its own exposure or env intensity.
- **Tone mapping today is ACES** in `solid-hero-rig.jsx` (exposure 1.18), `about-board.jsx` and `app/shared/menu-objects.js` (1.25, leased). **Done:** PBR Neutral wherever a model renders, inside each material.
  - Moving to PBR Neutral changes every colour on the landing.
  - Do it in one pass, with before/after screenshots of every route in both directions of the ring.
  - Or keep ACES in the field tier and Neutral in the hero, if the landing palette was tuned against ACES. Decide this with a browser open.
- **Material presets**, named by what they are:
  - `anodisedBlack`, `anodisedGreen`
  - `enamel(color)`
  - `brushedPearl`
  - `chromeThinFilm`
  - `pbtCap`, `nylonCap`
  - `soldermask(map)`
  - `mipGlass`
  - `emissiveLegend`

  Each preset has fixed roughness, clearcoat and anisotropy values. A model picks a preset; it never tunes numbers.
- **Contact depth without touching the GLBs.** The sealed marks get no baked AO. Two runtime tricks give them depth instead:
  - the studio's soft key light and its PMREM
  - a cheap screen-space contact shadow under the card subject, in the rig tier only
- **Texture rule, for new models only.** Use no PNG or JPEG inside a GLB; use KTX2, or vertex colours, or a palette `DataTexture`. The one sealed exception is `zmk-mark.glb`, which carries a 69 KB PNG gradient. Leave it unless that model is re-exported for another reason.

---

## 4. Signature finishes on sealed models

These rules apply to every finish:

- **The GLB is never touched.** No re-export, no new nodes and no colour changes. A finish is applied at load by **material name**, and the names already say what each surface is: `enamel-yellow`, `iridescent-chrome`, `gradient-plate`, `glyph-pearl`, `handle-metal` and so on.
- **A finish is one preset**, plus at most one small fragment addition (`onBeforeCompile` with a `customProgramCacheKey`), and optionally one light accent.
- **Finishes are view-dependent, so they cost no extra frames.**
  - Iridescence, sheen, glints, anisotropy and fresnel all change with the viewing angle.
  - The cards already drift and turn in the Universe, and the hero rig already rotates, so the finishes come alive on motion that exists today.
  - Only a finish driven by *time* needs frames: the liquid flow on Wafer Studio. That one is frozen in the field and runs in the hero only while interacted with.
- **The finishes appear in the field too.** The cards are what the user sees first. That is at most four extra shader programs on the landing (Iskra, ZMK, Sightseeing, Silent Depth); the other finishes use built-in material features. All of them are compiled in the preloader with `compileAsync`.
- **Glints fade with `fwidth`** at card size, so nothing shimmers when a card is small.

### Logos: one finish each

| addr | Logo | Materials in the sealed GLB | Signature finish | How (cost) |
|---|---|---|---|---|
| 0x06 | Wafer Studio | `iridescent-chrome` | **Liquid metal**, as on the app icon (`public/media/wafer-studio/mark.webp`). Thin-film oil-slick colour over chrome. In the hero, the surface flows slowly and the cursor drops a ripple. | The built-in iridescence; the hero adds normal noise plus a thickness-noise snippet. The field shows a frozen swirl. |
| 0x03 | Iskra | `enamel-yellow`, `enamel-blue` | **Sparks in glass enamel.** A deep, glassy enamel, like a cloisonné pin, with fine glints in the yellow that twinkle as the mark turns. *Iskra* means spark. | Thick clearcoat over a slightly darker base, plus a hashed-glint snippet. |
| 0x08 | ZMK PointAccel | `gradient-plate`, `white-relief` | **A speed streak.** The plate becomes polished acrylic over its own gradient, and the letters satin ceramic. One stretched highlight runs across the plate as it turns, like a velocity line. | Clearcoat, and anisotropy locked to the plate's horizontal axis. Built-in. |
| 0x0D | Bulgaria 2026 | `tile-navy`, `glyph-pearl`, `accent-blue` | **Pearl, lacquer and a real light.** Mother-of-pearl glyph (soft sheen, faint dielectric iridescence, nothing like the Studio chrome), deep navy lacquer tile, and the accent bar glowing as an actual small light. | Sheen and low iridescence on the glyph; the accent keeps its existing emissive and gets a tiny additive halo sprite in the rig tier. |
| 0x0A | Sightseeing.inc | `enamel-navy`, `enamel-blue`, `handle-metal` | **A door to somewhere lit.** Satin-painted enamel, a polished handle, and warm light leaking around the frame's edges, as if a lit room were behind it. | A fresnel rim with warm emissive on the frame material only. One snippet. |
| 0x0B | Silent Depth | `brushed-pearl` | **Spun metal.** Radial brushing like a watch dial or a record, so the rings of highlight rotate as it turns. Quiet, with no colour. | Anisotropy direction computed radially in object space. One snippet. Hero tier only, since it has `universe: false`. |
| 0x0C | Brionel Catalogue | `anodised-green` | **Real dyed anodising.** Bead-blast micro-texture, with colour that deepens and saturates at grazing angles, the way dyed anodised aluminium really does. A crisp product-shot read. | Procedural micro-roughness noise plus a fresnel colour-depth term. One snippet. |

That is seven different surfaces for seven logos:

- chrome thin-film (Wafer Studio)
- glass enamel with glints (Iskra)
- acrylic with a streak (ZMK PointAccel)
- pearl and lacquer (Bulgaria 2026)
- satin with a warm rim (Sightseeing.inc)
- spun metal (Silent Depth)
- dyed anodising (Brionel Catalogue)

No two read alike in the Universe, and none of them moves the model.

### Hardware: realism retouch

Hardware does not need an invented signature: what makes it unique is what it really is. The work is to make it read as that object.

| addr | Node | Model (kept) | Retouch |
|---|---|---|---|
| 0x01 | Wafer | `wafer_demo.glb`, or the 53 parts | The full study look, carried down to the rig and field tiers with the studio presets: black anodised CNC aluminium, blank PBT caps, MIP glass. The hero is `lab/wafer.html` (§6, step 2). |
| 0x07 | Split HID Display | `keyboard-display.opt.glb`: `module-body`, `lit-pixels` | nice!view panels are **memory-in-pixel**: reflective, not backlit. Draw `lit-pixels` as reflective silver pixels under a clear glass layer, not as an emissive glow, and make `module-body` a matte black PCB-and-bezel finish. It is the same MIP look as Wafer's screens, so the two related projects read as related. |
| 0x09 | ZMK Soft Off Plus | `soft-off-keycap.opt.glb`: `keycap-charcoal`, `legend-lit` | A real PBT cap: dry, slightly textured, low-sheen micro-roughness. The legend becomes shine-through, lit from below, with a soft falloff into the cap instead of a flat emissive. Optionally the legend dims once the visitor goes idle and wakes on the next pointer move: one emissive uniform, one transition, then the loop sleeps again. |
| 0x02 / 0x05 / 0x04 | Kerfur, Venovisor, Ci-Clop | Updated models are coming from the user | **On hold.** When they arrive, run them through the same presets first. Decide a signature only after seeing them. |

---

## 5. Performance budget (the rules that keep it fast)

1. **Bytes.**
   - The sealed marks do not change, so their bytes do not change: 17–171 KB each today.
   - Finish code is about 1–3 KB per node.
   - Moving Wafer to the parts deletes the 802 KB `wafer_demo.glb` prefetch from the landing.
2. **Programs.**
   - At most four extra programs on the landing, one per snippet finish.
   - Every snippet uses `customProgramCacheKey`, and everything compiles in the preloader with `compileAsync`.
   - Count `renderer.info.programs` on the landing before and after, and record both numbers.
3. **Frames.** The AGENTS.md lifecycle contract holds for every finish:
   - nothing animates while off screen, under the menu or in a hidden tab
   - a one-shot effect plays once and then stops the loop
   - nothing keeps the hero accumulation awake
4. **Memory.**
   - One hero renderer per page.
   - Drop MSAA at DPR > 1.5 in the lab engine (see §1).
   - The Wafer case page also runs 21 ASCII-lens WebGL figures; the hero must not break their context recycling (AGENTS.md, "Contexts are recycled").
5. **Proof.**
   - Measure frame time on a real integrated GPU, not only SwiftShader. Use a probe like the Universe's: it discards 30 frames, averages 90, and falls back a tier under 30 fps.
   - Record the numbers in AGENTS.md.

**Is it possible?** Yes. Download weight stays flat or drops, because the realism is code and the Wafer parts are already cached by the landing. The idle GPU cost stays at zero, because everything sleeps.

The real costs are three:

- the hero tier's render-target memory, which has a known cut
- shader compile hitches, which compiling in the preloader handles
- frame time while an object moves, which still has to be measured on real GPUs

---

## 6. Rollout order (one PR each)

1. **Shared studio.** [done 2026-10-15] Add the presets and the tone-map decision in `solid-materials.js`. Apply them to the rig and the field with **no** finishes yet. Screenshot every route in light, dark and on a phone.
2. **Wafer everywhere.** [universe, reel, handoff, menu, board and PLAY DEMO done; the Wafer.html hero engine open] Status, with the remaining work:
   - The story page and the study are still in `lab/`; do this once the user signs them off.
   - **Wafer.html:** the lab engine replaces the old PLAY DEMO, as the hero. It must run the shared demo audio, not a second engine.
   - **Universe, reel and handoff:** switch to the parts with studio presets, in the rig and field tiers.
   - **Clean-up:** delete the `wafer_demo.glb` prefetch and update both registries in the same change.
3. **Hardware retouch:** [done] Split HID Display and Soft Off.
4. **Logo finishes, one PR each.** [open] Each PR ships with:
   - a before/after screenshot of the Universe card and the hero
   - before/after `renderer.info.programs` on the landing

   Start with the built-in finishes, which need no snippet: Wafer Studio (field), ZMK PointAccel and Bulgaria 2026. Then the snippet finishes: Iskra, Sightseeing.inc, Brionel Catalogue, Silent Depth, and last the Wafer Studio hero flow.
5. **Kerfur, Venovisor and Ci-Clop:** [Ci-Clop and Venovisor done; Kerfur waiting] wait for the user's updated models.

### Verify every step

- `npm run build --prefix tools/landing-runtime`, then `npm run check` and `npm test`.
- Walk the project ring **both ways**.
- Run the headless screenshots and the frame-time probe, on a real GPU at least once.

The Wafer study keeps `node lab/motion.check.mjs` and `node lab/places.check.mjs` green.

## Tooling provenance (lab/)

- `lab/tools/venovisor-build.mjs` rebuilds `lab/models/venovisor-mark.glb`: `node lab/tools/venovisor-build.mjs --stl <folder of the five print STLs> --obj "venovisor model/ImageToStl.com_Venovisor-new-assembly/Venovisor-new-assembly.obj" --without usb-cover` (Venovisor-v1.1 delivery, not in the repo). Tools are read from `$SCRATCH/tools/node_modules` (`SCRATCH` defaults to `os.tmpdir()/materialize`): `npm i --prefix $SCRATCH/tools manifold-3d gltfpack meshoptimizer @gltf-transform/core @gltf-transform/extensions @gltf-transform/functions sharp`.
  - Default output is ONE merged, hollow mesh (boolean union, enclosed voids dropped, every triangle nothing outside can see dropped by `lab/tools/hollow-prune.mjs`; one primitive per material). `--parts` is the per-part build (internals intact, for an exploded view), packed with `gltfpack -c -ce ext -kn -km -ke -vpf -vn 8` and byte-identical to the previous deliverable.
  - A merged mesh has lost its parts' frames, so each vertex carries `_PRINTZ` (metres along its own part's print axis, bed = 0); `studio.js` `tpuPrinted` reads it (`_printz` after GLTFLoader) and falls back to `position.z` for geometry without it. **gltfpack 1.3 drops custom attributes even with `-kv`** ("ignoring custom attribute _PRINTZ"), so any model that carries one is packed with `lab/tools/pack-glb.mjs` (gltf-transform + meshopt: same extensions, float positions, 8-bit normals, attributes kept).
  - `lab/tools/hollow-prove.mjs PER_PART.glb HOLLOW.glb` is the proof: software ID-buffer renders from hundreds of directions plus every opening, pixel and surface-distance diff, and a vertex-normal check (a zero or NaN normal renders black, and a flat-shaded diff cannot see it).
- `lab/perf/glb-inventory.mjs` (read-only report on GLBs) and `lab/perf/merge-wafer-parts.mjs` (reads `SRC` = `models/wafer_parts`, writes only to its `OUT` argument, default `./out`; point it under `lab/` or scratch) came from the perf pass. Neither writes outside the directories you give it.
- Wafer draw-call cost (5 to 62) is unmeasured on a real GPU; the gallery's frame times are SwiftShader CPU time.
