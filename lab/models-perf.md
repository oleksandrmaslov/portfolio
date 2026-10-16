# Model performance and loading audit

Measured 2026-10-14. Report only: no model, page or registry was changed. Every experiment ran on copies in a scratch directory. Two small scripts are kept in `lab/perf/` (`glb-inventory.mjs`, `merge-wafer-parts.mjs`); the merge script reproduces the merged GLB byte for byte.

## How to read the numbers

- **Bytes, requests, decode CPU and main-thread time are measured. GPU frame time is not.** The browser was Chrome 154 headless on SwiftShader, so nothing here says how a real GPU draws a frame. Where a draw-call or triangle count could matter for frame time, it is reported as a count.
- **Wire bytes are `gzip -6`**, which is what GitHub Pages serves for `.glb`. Headers measured on the live site: `cache-control: max-age=600`, weak ETag, `content-encoding: gzip`, no brotli, HTTP/2. None of that can be changed on Pages. A test server (Node HTTP/2) sent the same headers.
- **Network profiles** (Chrome DevTools emulation): `fast` = 40 ms RTT, 25 Mbps; `lte` = 120 ms RTT, 8 Mbps. Each figure is the median of 3–7 runs. The machine was shared with other jobs, so CPU figures were re-taken at load below 10, and page-level timings that moved by more than 300 ms between identical runs are not used.
- **The loader under test is the shipped one**: `app/projects/rendering/model-viewer.jsx` (job limit 4; 2 on mobile, or on 4 cores or 4 GB and under). three r160. Basis transcoder served from a local copy of the same bytes.
- "As loaded" counts are taken after `GLTFLoader` runs: one `Mesh` per primitive, `InstancedMesh` counted once, texture bytes summed from the uploaded mip chains.

## 1. Inventory

Sealed marks, `models/`. All are `gltfpack` output with `KHR_mesh_quantization` + `EXT_meshopt_compression` (both **required**).

| File | Raw B | Wire B | Tris | Meshes / prims | Mats | Draw calls | Geometry as loaded | Textures | Other extensions |
|---|---:|---:|---:|---:|---:|---:|---:|---|---|
| `brionel-mark` | 170,516 | 69,628 | 17,966 | 1 / 1 | 1 | 1 | 512 KB | – | clearcoat |
| `bulgaria-mark` | 16,876 | 7,731 | 2,388 | 3 / 3 | 3 | 5 | 35 KB | – | clearcoat, emissive_strength |
| `ci-clop-mark` | 134,248 | 76,284 | 29,831 | 6 / 6 | 0 | 7 | 392 KB | – | **`KHR_lights_punctual`** (1 directional light) |
| `iskra-mark` | 36,508 | 19,490 | 3,472 | 1 / 2 | 2 | 2 | 99 KB | – | clearcoat |
| `keyboard-display.opt` | 87,456 | 32,553 | 19,092 | 2 / 2 | 2 | 3 | 262 KB | – | clearcoat, emissive_strength |
| `sightseeing-mark` | 21,856 | 8,874 | 2,876 | 7 / 7 | 3 | **13** | 42 KB | – | clearcoat |
| `silent-depth-mark` | 151,476 | 82,645 | 20,620 | 1 / 1 | 1 | 1 | 481 KB | – | clearcoat |
| `soft-off-keycap.opt` | 27,204 | 12,377 | 3,744 | 3 / 3 | 2 | 4 | 76 KB | – | clearcoat, emissive_strength |
| `wafer-mark` | 43,792 | 22,258 | 5,536 | 1 / 1 | 1 | 1 | 136 KB | – | iridescence |
| `zmk-mark` | 92,456 | 56,291 | 10,556 | 12 / 12 | 2 | **49** | 13 KB | 1 PNG, 256², RGBA, **69,100 B** (341 KB uncompressed) | clearcoat, texture_transform |
| `wafer_demo` | 821,400 | 630,153 | 115,938 (36 instanced keys) | 5 / 5 | 4 | 5 | 1.78 MB | 2 KTX2 ETC1S 2048² (110 KB each, **5.59 MB each** transcoded) + 2 palettes | mesh_gpu_instancing, specular, texture_basisu |
| `wafer_parts/` × 53 | 1,138,340 | 867,532 (+15.9 KB request headers) | 128,792 | 53 / 60 | 17 unique | 60 | 1.96 MB | the same 2 PCB KTX2 + 4 palettes (32–128 × 4 px, ~0.8 KB each) | specular, texture_basisu |

Totals: `models/` 1,603,788 B + `wafer_parts/` 1,138,340 B = 2,742,128 B.

What the table says that the files do not:

- **The 36 keycap files hold the same mesh.** Their vertex and index data hash identically (626 tris, 381 verts each); only the node translation and rotation differ. That is 192 KB raw of repeated data in the 53 files.
- **The two PCB textures are the memory.** They are 2 × 5.59 MB of the 15.0 MB the landing field holds as geometry and textures. The Wafer card is 13.0 MB of that 15.0 MB (87%).
- **`zmk-mark` draws 49 meshes** for 10.5k triangles, and `sightseeing-mark` 13 for 2.9k. The 10 field models together draw 90 meshes.
- **`ci-clop-mark.glb` carries a light.** `GLTFLoader` turns it into a real `DirectionalLight` (0.7) that travels with every clone, into the Universe, the hero rig and the menu. Nothing strips it. See §3.6.
- The Wafer parts do not repeat further: `switches_*` is 154 connected pieces and 138 distinct shapes, so there is nothing more to instance there.

## 2. Requests per surface

| Surface | When | GLB requests | Wire | Notes |
|---|---|---:|---:|---|
| Landing field | after first frame, idle queue, 2 at a time | **10** | 938,639 B | `wafer_demo` is 67% of it. `index.html` prefetches it; with the production headers the Universe's own fetch is served from that prefetch (`fromPrefetchCache`, 0 B), so there is **no duplicate**. Plus 3 CDN requests for the Basis transcoder (ktx-parse 5.3 KB, transcoder js 15.7 KB, wasm 242.6 KB). |
| Preloader gate | first reveal | (same `wafer_demo`) | – | The `handoff` mark waits for the first project's rig to paint twice; a 1.8 s timer bounds it. |
| Board flight | lazily, when scrolled near the board | **53** | 883,432 B | None of these are shared with the field. |
| Menu, landing | on menu intent | 0 new | – | The four featured models are already in the field cache. |
| Menu, any other route (`Iskra.html` measured) | on menu intent | **3** | **1,000,819 B** in 7 requests | `wafer_demo` 630,560 + `ci-clop` 76,384 + `wafer-mark` 22,330, plus KTX2Loader.js, ktx-parse and the transcoder (272 KB). `wafer_demo` and its transcoder are 89%. On `Wafer.html` it is 3 GLBs, 118 KB. |
| Project hero | page load | 1 | 19–630 KB | `Wafer.html` adds the 3 transcoder requests. Nine routes import `KTX2Loader` (12 KB) although only the Wafer models carry KTX2 textures; `ZMK-PointAccel.html` and `Iskra.html` do not. |
| Wafer PLAY DEMO | on click | 53 | 883 KB | On top of the hero's `wafer_demo`; `demo/wafer-board.js` goes through the same limited loader. |
| Study, `lab/wafer.html` | load | 53 (+3 CDN) | 883 KB | Direct `GLTFLoader`, no limiter, own `detectSupport`. |

Three WebGL contexts are created on the landing at load: the Universe, the loader's throwaway `detectSupport` context, and the handoff rig. After the first context exists, the throwaway one cost 7 ms; it is not a lever.

## 3. Experiments

### 3.1 Repack the sealed marks with `gltfpack -cc` (default quantization)

gltfpack 1.3, `-cc -km -kn` (names, material names and parameters verified identical after). Render: 3 views at 512², ACES, pixel diff against the original.

| | Raw | Wire (gzip -6) |
|---|---:|---:|
| 10 marks before | 782,388 | 388,131 |
| 10 marks after | 753,492 (**−3.7%**) | 366,661 (**−5.5%**) |
| of which `ci-clop-mark` | 134,248 → 116,972 | 76,284 → 63,397 (−16.9%) |
| the other nine | 648,140 → 636,520 | 311,847 → 303,264 (**−2.8%**) |

- Best per file after `ci-clop`: `silent-depth` −7.1% wire, `wafer-mark` −6.7%, `sightseeing` −6.7%. `brionel`, `iskra` and `keyboard-display` move by 0.2% or less.
- Plain `-c` with gltfpack 1.3 makes the files **larger** (`brionel` +8.2%, `iskra` +7.6%, `keyboard-display` +8.2%). The saving comes from the `-cc` pass, not from re-running gltfpack.
- Visually identical: the largest channel difference in any model is 8/255 (`bulgaria`, 2,537 pixels of 786k); seven models differ in 0–35 pixels; `ci-clop` differs by at most 2/255 on 5.3% of pixels. gltfpack warns that it re-quantizes already-quantized positions, which is why this is a small, one-way loss.
- Rejected variants: `-mm` (bake and merge instances) cuts `zmk` to 2 draw calls but grows it to 115,592 B, and `keyboard-display` doubles to 167,604 B. `-cc -km` without `-kn` took `ci-clop` to 59,888 B but changed **40% of its pixels** (mean error 28.6/255), so it is not safe.

### 3.2 Merge the 53 Wafer parts into one GLB

Built with `lab/perf/merge-wafer-parts.mjs` (gltf-transform 4.5, lossless meshopt re-encode). One scene, 53 nodes named exactly like the files (`case_L`, `key_R_r1c3` …), the 36 key nodes sharing one mesh. Every part's world-space bounds match the 53 files to 3e-10 of the part's diagonal, and its mean vertex position to 5e-12 (scene units).

| | 53 files | **merged, shared key mesh** | merged, GPU-instanced keys | `wafer_demo` |
|---|---:|---:|---:|---:|
| Raw bytes | 1,138,340 | **945,748** | 940,728 | 821,400 |
| Wire (gzip -6) | 867,532 | **710,788** | 710,981 | 630,153 |
| Requests | 53 | **1** | 1 | 1 |
| Request headers | 15.9 KB | 0.3 KB | 0.3 KB | 0.3 KB |
| Tris | 128,792 | 128,792 | 128,792 | 115,938 |
| Draw calls as loaded | 60 | 60 | 25 | 5 |
| Unique materials | 60 refs | 17 | 17 | 4 |
| Decode, wall / renderer CPU (localhost, 7 runs) | 72 / 180 ms | **64 / 120 ms** | 74 / 140 ms | 68 / 160 ms |
| Cold, `fast` | 802 ms | **338 ms** | – | 301 ms |
| Cold, `lte` | 2,324 ms | **890 ms** | – | 798 ms |
| Cold, `lte`, 2-slot limiter (mobile) | 4,088 ms | **877 ms** | – | – |
| `max-age` expired (304s), `fast` / `lte` | 622 / 1,748 ms | **103 / 183 ms** | – | 88 / 169 ms |
| Warm cache | ~60 ms | ~70 ms | – | ~50–80 ms |

- **Decode is not the cost; the requests are.** All four decode the whole Wafer in 64–74 ms on this CPU. The 53 files lose because the limiter fetches them four at a time (14 waves of one round trip each; 27 waves with two slots), and because each one revalidates separately after ten minutes.
- **Instancing the keys saves 35 draw calls and no bytes**, and it removes the per-key nodes: the names survive only in `extras.instances`. `about-board.jsx` (explode per part) and `lab/wafer.js` (press travel, picking) both need each key as its own object, so they would have to expand the instances again. The shared-mesh form keeps every name and gets the same bytes.
- **Against `wafer_demo` the merged file is +124 KB raw, +81 KB wire (+13%)**, and it is not the same render (6.9% of subject pixels differ by more than 16/255 at card scale). The two PCB textures (221 KB) and the switches (298 KB) are most of what is left in it.
- **Runtime merge by material at load**: 60 draw calls → 17, 38 ms once, geometry 1.96 MB → 3.74 MB (floats), render unchanged (62 of 691k pixels differ, 13 above 16/255).
- The PCB shows through the key gaps as the teal outline. A shell-only subset (case, plate, display, antenna, keys: 173,440 B raw, 111,371 B wire, 47.8k tris, no big textures) changes 13.5% of subject pixels by more than 16/255 at card scale. It is not a free tier.

### 3.3 `zmk-mark.glb`'s PNG

The plate's UVs all land outside 0–1 after the `KHR_texture_transform`, with clamp-to-edge, so every fragment samples the same corner texel. The 256² gradient is in effect a constant. Rendered at 3 views:

| Variant | GLB raw | Wire | Texture GPU | Pixels differing vs original |
|---|---:|---:|---:|---|
| as shipped (PNG 69,100 B) | 92,456 | 56,291 | 341 KB | – |
| **same PNG, lossless recompress** (embedded bytes replaced, geometry untouched) | **27,500** | **9,183** | 341 KB | **0** |
| flat `baseColorFactor`, no texture, no UVs | 20,920 | 4,145 | 0 | 805 (0.10%), 4 above 8/255, max 55 |
| KTX2 ETC1S 256² (native gltfpack `-tc`) | 26,016 | 6,833 | 87 KB | max 5/255 |
| KTX2 ETC1S 64² | 24,024 | 5,190 | 5 KB | max 5/255 |
| WebP lossless in `EXT_texture_webp` | 23,868 | 6,406 | 341 KB | lossless |

- **Vertex colours add nothing**: with every fragment sampling one texel the colour is constant, so `COLOR_0` would be a constant too.
- **KTX2 is the wrong tool here.** `ZMK-PointAccel.html` does not import `KTX2Loader`; KTX2 would add KTX2Loader.js, ktx-parse and the transcoder (about 270 KB) to a route to save 66 KB raw (49 KB on the wire).
- The PNG in the file is simply badly compressed (69,100 B for 4,145 B of lossless content).

### 3.4 PCB texture resolution

PCB texture re-encoded to ETC1S at three sizes (native gltfpack `-tc`, from the decoded 2048² source), rendered alone at 960 px:

| Texture | `pcb_L` file | Wire | Texture as loaded | Pixels >16/255 vs shipped |
|---|---:|---:|---:|---:|
| 2048² as shipped | 201,896 | 163,626 | 5.59 MB | – |
| 2048² re-encoded | 183,260 | 152,870 | 5.59 MB | 1.3% (encoder noise) |
| **1024²** | **129,844** | **100,272** | **1.40 MB** | 1.8% |
| 512² | 101,372 | 71,858 | 0.35 MB | 4.7% |

At 1024² the board is indistinguishable at 960 px; 512² starts to soften the reference text. Both PCBs at 1024² take the field from 15.0 MB to 6.6 MB and the Wafer card from 13.0 MB to 4.6 MB. The hero study zooms past 960 px; that case was not rendered.

### 3.5 Hints, caching, workers, compile, lazy loading

| Item | Result |
|---|---|
| **Preload the Basis transcoder** | Quiet harness, `wafer_demo` cold: `fast` 478 → 417 ms; **`lte` 1,223 → 834 ms (−389 ms)**. On the real `Wafer.html` the transcoder is first requested only when the first KTX2 texture is parsed: 0.7–0.9 s after the GLB finished in two instrumented loads. It is 264 KB the page fetches anyway. |
| Preload the hero model | No measurable gain on the marks (19–76 KB, one round trip). Page-level timings moved by up to 1 s between identical runs, which hides anything under that. The GLB request does start at 50 ms instead of 1.4–1.8 s. |
| `modulepreload` | **Placed in `<head>` before the body's import map, it breaks the page** (`Failed to resolve module specifier "three"` on `Wafer.html`). The import map must come first. Not measured for gain. |
| Prefetch of `wafer_demo` in `index.html` | Works as intended on the production headers: no second download. |
| HTTP caching | Fixed by Pages: `max-age=600`. After ten minutes every file revalidates: 53 conditional requests for the parts, 1 for a merged file (§3.2). Stamping `?v=` does not lengthen freshness. |
| Brotli | Would be 11% smaller than gzip on the marks (344,100 vs 388,131 B). Pages does not offer it. |
| Meshopt decode on workers (`MeshoptDecoder.useWorkers`, one line) | No gain. Main-thread blocked time was 0–15 ms either way; CPU went up 20–30 ms for the worker spawn. Skip. |
| `compileAsync` before first frame | Not measurable here: SwiftShader lacks `KHR_parallel_shader_compile`, so it degrades to a synchronous compile. The 2026-09-28 study already tried it on the handoff and did not adopt it. Program counts below are the usable number. |
| Lazy field after first paint | Already done (2 background jobs per idle slice, hover promotes). What is left is the content of the queue: `wafer_demo` is 67% of the field's wire bytes and 87% of its memory. |
| Landing reveal with `wafer_demo` / merged parts / shell as the Wafer asset (`lte`, 3 runs each) | `preloaderDone` 9.3 / 10.1 / 8.3 s, spread ±1 s; `handoffWarm` 7.7 / 7.4 / 7.8 s. Not distinguishable. In this environment the reveal is gated by software rendering, not by model bytes. **Do not promise a reveal gain from any of these.** |
| Draw-call cost | Measured JS time of `render()` is about 4–5 µs per draw call on this CPU (`zmk` 49 calls 0.2 ms, merged 2 calls 0.1 ms; Wafer parts 60 calls 0.3 ms, merged 17 calls 0.1 ms). The 90 field draw calls cost under 1 ms of JS per frame on a desktop CPU. Phones were not measured. |
| Runtime merge by material (all ten marks) | `zmk` 49 → 2 calls (2.8 ms once), `sightseeing` 13 → 3 (1.4 ms; 0.5% of its subject pixels differ by more than 8/255, probably depth ties between coplanar faces, not investigated), the rest identical. Geometry memory about doubles (floats). |

### 3.6 Shader programs on the field

`renderer.info.programs` after compiling the ten field models with the Universe's three lights and every material cloned transparent:

| Case | Programs |
|---|---:|
| as loaded | **21** (+4 baseline) |
| `ci-clop-mark`'s light removed | **12** |
| as loaded, Wafer from the merged parts | 20 |
| merged parts, ci-clop light removed | 11 |

The embedded directional light takes the scene from one directional light to two, which recompiles every material already in it: **+9 programs** and a visible lighting step when the card arrives. The same happens in the hero rig and the menu.

## 4. Ranked plan

Ordered by saving against risk. Wire figures are gzip.

**1. Ship the Wafer as one merged GLB with named nodes, and retire `wafer_demo.glb` and the 53 files.**
- A full visit (card + board) goes from 1,513,885 B in 54 requests to 711,088 B in 1: **−803 KB (−53%), −53 requests.** Cold board load at 120 ms RTT 2.3 s → 0.9 s; on a two-slot device 4.1 s → 0.9 s; after `max-age` 1.75 s → 0.18 s.
- Correction to `lab/models-handoff.md` §1: "the site would get lighter" holds only if the parts become **one** file. If the Universe loads the 53 files for the card, the landing gets **+253 KB** over `wafer_demo` and the card takes 2.3 s instead of 0.8 s on `lte`.
- Cost: the card path is +81 KB (+13%) against `wafer_demo`; draw calls rise 5 → 60 unless merged at load (→ 17, 38 ms once); the look is not identical to the demo's.
- Risk: medium. Every consumer finds parts by name instead of by file.
- Files: new `models/wafer-…glb` (recipe: `lab/perf/merge-wafer-parts.mjs`); `app/data/projects.js`; `app/projects/data.jsx`; `app/projects/pages/wafer-page.jsx`; `app/landing/scenes/about-board.jsx` (`buildWaferReal`); `demo/wafer-board.js`; `lab/wafer.js`; `index.html` (prefetch); then the runtime build and the stamps.

**2. Preload the Basis transcoder in `index.html` and `Wafer.html`.**
- −389 ms on `wafer_demo` at 120 ms RTT in the harness, more on the real pages (the first request comes 0.7–0.9 s after the GLB). No new bytes.
- Risk: low; HTML only. The URL must match `setTranscoderPath` in `model-viewer.jsx`, or it is fetched twice. Use `as="fetch" crossorigin`. Do not add `modulepreload` above the import map.
- Files: `index.html`, `Wafer.html`, `lab/wafer.html`.

**3. PCB textures at 1024² (keep 2048² for the lab hero if its zoom needs it).**
- −53 KB wire per PCB against the same encoder at 2048² (−63 KB against the shipped file), **−8.4 MB** of the field's 15.0 MB, lower transcode CPU.
- Risk: low to medium; the hero zoom was not checked, and this is an edit to sealed parts.
- Files: the two PCB parts, or the merged GLB.

**4. `zmk-mark.glb`: recompress the embedded PNG losslessly.**
- −64,956 B raw, −47,108 B wire (−84%). Pixels identical, geometry bytes untouched.
- Risk: very low, but it is a sealed file, so it needs the owner's word. Do not use KTX2 for it (§3.3).
- Files: `models/zmk-mark.glb`.

**5. Strip lights from loaded models, or drop the light from `ci-clop-mark.glb` when it is replaced.**
- Field programs 21 → 12; removes the lighting step when the card arrives.
- Risk: low to medium; Ci-Clop's hero was tuned with the light. Ci-Clop waits for a new model, so the cheap form is to make sure the new export has no light.
- Files: `app/projects/rendering/model-viewer.jsx` (three lines, one place for every consumer), or the replacement GLB.

**6. Decide the menu's Wafer.** On every route except `Wafer.html`, opening the menu fetches 1.0 MB, 89% of it `wafer_demo` plus the transcoder. A shell tier is 111 KB wire with no big textures, but it loses the PCB outline (13.5% of subject pixels). That is a look decision, not an optimisation.

**7. Merge by material at load for `zmk-mark` and `sightseeing-mark`** (49 → 2, 13 → 3 draw calls). About 0.2 ms of JS per frame on this CPU; the gain is on phones, which were not measured. Geometry memory about doubles. Do it after items 1–5, or when a phone shows frame-time trouble.

## 5. Measured and not worth doing

- `gltfpack -cc` on the sealed marks: −21 KB wire in total, 60% of it from `ci-clop`, which is being replaced. Visually identical but a one-way requantization.
- `MeshoptDecoder.useWorkers`: no gain.
- `EXT_mesh_gpu_instancing` for the keys in a file the board and the study consume: same bytes as the shared mesh, and it loses the per-key nodes.
- KTX2 for the ZMK gradient: a 270 KB decoder for a 49 KB wire saving.
- Vertex colours for the ZMK gradient: the gradient is a constant on screen.
- A shell-only Wafer for the card without a look decision: it changes the key outlines.
- gltfpack node merging on `ci-clop-mark`: 40% of pixels change.

## 6. Not measured

- Frame time on a real GPU or any phone. Draw calls, triangles and memory are counts only.
- Decode time on a mid-tier phone. On this CPU the whole Wafer decodes in 64–74 ms; expect several times that.
- The PCB at the lab hero's close zoom.
- A service worker for the models (would lift the 10-minute freshness limit; needs its own review).
- Hero-model preload and `preconnect` to unpkg on real pages: the run-to-run spread (up to 1 s) was larger than the effect.

## Reproduce

- Inventory, no dependencies: `node lab/perf/glb-inventory.mjs models/*.glb`.
- Merged GLB: `npm i --prefix /tmp/tools @gltf-transform/core @gltf-transform/extensions @gltf-transform/functions meshoptimizer`, then run `lab/perf/merge-wafer-parts.mjs` from a directory with those in `node_modules` (`node merge-wafer-parts.mjs models/wafer_parts out`). Output: `wafer-parts-shared.glb` 945,748 B, `wafer-parts-instanced.glb` 940,728 B.
- `-cc` repack: `npx gltfpack -i in.glb -o out.glb -cc -km -kn` (gltfpack 1.3).
- KTX2 re-encode needs the native gltfpack (`meshoptimizer` v1.3 release); the npm build has no BasisU.
- The render, load and network harnesses were scratch files and are not kept. Their method is above: `model-viewer.jsx` loaded unmodified, three r160, a Node HTTP/2 server with the Pages headers, CDP network emulation, and a 3-view render with a pixel diff.
