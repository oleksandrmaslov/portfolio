# Oleksandr's portfolio — shipping notes

## Public routes

The deployed root HTML filenames are public URLs and must remain stable.
`index.html` is the canonical landing source and is served directly at `/`.
It was renamed from `Landing Final 5.html` on 2026-08-22 as a clean break: the
old URL is gone and no redirect stub was kept. Inbound links to the landing use
the relative form `./` (and `./#work`, `./#about`, `./#contact`) so they resolve
correctly under the GitHub Pages project subpath. The other public pages are:

- `All Projects.html`
- `Wafer v3.html`
- `Kerfur v2.html`
- `Iskra v3.html`
- `Tactical Flashlight v2.html`
- `Venovisor.html`
- `Wafer Studio.html`
- `Split HID Display v2.html`
- `ZMK-PointAccel v2.html`
- `ZMK Soft Off Plus.html`
- `Sightseeing.html`
- `Silent Depth.html`
- `Brionel Catalogue.html`
- `Bulgaria 2026.html`
- `Design System.html`

Every node in the registry has a page, so the project ring runs
`0x01 → 0x02 → … → 0x0C → 0x0D → 0x01` with no gaps. `0x0D` (Bulgaria 2026)
was added on 2026-08-23 as a written record with pending figures. Bulgaria 2026
is deliberately **not** in `MO_FEATURED_ADDRS` — the landing reel stays at
four.

`Silent Depth` (`0x0B`) carries `universe: false`, the one opt-out in the
registry. `app/landing/scenes/universe.jsx` filters on it when it builds the
tile list, so the node draws no tile and joins no constellation link.

**`universe: false` governs the drifting tile. It does not govern the model,
and the two must not be conflated.** The reverse handoff in
`app/landing/transitions/project-handoff.jsx` resolves the leaving node through
`MO_PROJECT_BY_ADDR` — the unfiltered map — and passes `project.model`
straight to `makeNodeRig()`. Strip the `model` block from a node that still has
a page and `buildRig()` returns null, the reverse flight takes its silent
fallback, and leaving that page hard-cuts to the landing instead of flying the
mark home. Every node with a route keeps its model, in the field or not.

The forward flight is safe to leave behind: it only starts from a `mo:nodeFlight`
event, which comes from a universe tile or a reel card, so a node with neither
can never arrive by flight. `Silent Depth.html` therefore has no seam-bridge
script, and that is correct.

The rest survives untouched: the page serves, it renders
`models/silent-depth-mark.glb` as its own hero from its `PAGE_CONFIG`, All
Projects lists it (that page builds its row list from `MO_PROJECTS` inline, so
it never sees the filter), and it holds its ring slot between `0x0A` and `0x0C`
so prev/next still reach it.

This is the supported way to retire a node from the headline field without
deleting a public URL — do not "finish the job" by removing the record, the
route or the model.

Retiring a node also vacates its audio rung. `app/landing/audio/carrier-field.js`
holds one just-intonation sideband per node **in the field**, and `0x0B` handed
its `3/1` to `0x0D` (Bulgaria 2026) so the lattice stays exactly twelve tones.
Keep that map one-to-one with the field: `reward()`'s `seq` is the only place
that indexes `RATIOS` without a guard, so a stale address there becomes a `NaN`
frequency rather than a silent voice. The five routes added on
2026-08-22 (Venovisor, ZMK Soft Off Plus, Sightseeing, Silent Depth, Brionel
Catalogue) are scaffolds: their chrome is real, their case-study copy is
marked `[ ... ]` pending. Fill the placeholders in `app/projects/data.jsx`;
do not delete the routes to "clean up".

`Design System.html` is a deployed reference surface. Its only entry point is
the `SYSTEM ↗` link in the All Projects header — it was removed from the three
project-page headers and from the board-flight end screen on 2026-08-23, since
the end screen is a contact beat and an internal reference is not a way to
reach a person. Do not orphan the route by removing that last link too.
`face-test.html` is a local test surface and is explicitly excluded from
deployment. Internal folders
and source files can be reorganized, but do not rename a public root HTML route
or change its outward links without an explicit migration and redirect plan.

## Application structure

- `app/data/` owns the shared project registry used by the landing and project
  routes.
- `app/landing/` owns the shipping landing's sections, scenes, controllers,
  audio, transitions, styles, preloader, and generated `runtime.js`.
- `app/projects/` owns canonical case-study data, page compositions, project
  renderers, shared components, the All Projects index, and project styles.
- `app/shared/` contains cross-page primitives, pointer effects, scrollbar,
  keyboard affordances, and shared styles.
- `app/design-system/` contains only the internal design-system reference page.
- `demo/` remains a separate collection of live project demos. It is not
  deprecated application source.
- `assets/`, `public/`, and `models/` contain runtime content; `tools/` contains
  build and asset-pipeline utilities.

The landing's universe, work reel, All Projects index, and handoff records come
from `app/data/projects.js`. The project route ring and canonical case-study
records live in `app/projects/data.jsx`. Keep the two registries aligned; do not
introduce page-local route overrides.

## Design system

`app/shared/styles/tokens.css` is the single source of truth for type, color,
spacing and motion on every route. Do not introduce a page-local ramp; every
public page loads this file first and draws from it.

Typography is 43 tokens in four groups, none of them dead:

- **Static ramp** (`--fs-nano` 10px through `--fs-h2` 64px) is declared in
  `rem`, so the browser's own text-size setting scales it. Keep it that way;
  reverting to px silently drops WCAG 1.4.4 support. `--fs-nano` is the hard
  floor: nothing renders smaller, and no interactive control renders below
  `--fs-micro`.
- **Fluid display ramp** (`--fs-d1` through `--fs-d7`) carries every headline
  on every route. Four suffixed rungs (`--fs-d1-nowrap`, `--fs-d2-stack`,
  `--fs-d4-node`, `--fs-d5-card`) are pinned to a hard layout constraint such
  as `white-space: nowrap` or a fixed panel width. Re-tune those only with a
  browser open.
- **Leading** (`--lh-crush` 0.84 through `--lh-loose` 1.70) and **tracking**
  (`--tr-tightest` -0.045em through `--tr-widest` 0.24em) are complete scales.
  Snap to the nearest rung rather than adding a one-off decimal.

The only deliberate off-ramp font sizes are the generative ASCII wordmark grid
in `app/landing/styles/base.css`, five per-breakpoint refits inside media
queries, and two arrow glyph sizes on the project pages. Each carries a comment
saying so. Anything else with a literal `font-size`, `letter-spacing` or
`line-height` is drift.

Above 1720 px, `app/landing/styles/wide.css` re-expresses the label band and
the landing's own sizes proportionally. Every value there is a `clamp()` with a
ceiling at the 2560 px equivalent, so type stops growing on ultrawide instead of
scaling without limit. Keep new ultrawide sizes bounded the same way.

Three gutter tokens in `tokens.css` own every window-edge inset: `--gutter`
(34px, left/right), `--gutter-top` (89px, the first row clear of the fixed
shell header) and `--gutter-bot` (55px). They exist because the same four
corners were being set five different ways — the shell at 34px, the board
flight's section marker at `clamp(22px, 5vw, 64px)`, its chapter card at
`5vw`, its waypoint rail at 21px, the work reel's stops at 56px and the origin
statement at `clamp(24px, 6vw, 120px)`. Anything anchored to a viewport corner
keys to these; the shell header is the reference because it is the one piece of
chrome on every route. Phone breakpoints keep their own tighter `--s-5`
overrides — a 34px gutter each side of a 375px screen is a different
composition problem. The work reel's giant title is positioned from JS and
passes `var(--gutter)` into its `calc()` rather than a px literal, for the same
reason.

`app/shared/styles/key.css` is the single definition of the `.key` keycap and
is loaded by every route. It was previously duplicated declaration-for-
declaration in `shell.css` and `components.css`; do not re-inline it.

All ten public pages request an identical font set: Geist 400/500/600, Geist
Mono 400/500/600, and Instrument Serif italic only. Every `--ff-serif` call site
pairs with `font-style: italic`, so the roman cut is deliberately not requested.
Adding a family to one page only is what caused Iskra to ship Space Grotesk and
DM Mono that nothing ever used.

`Design System.html` renders the live specimen from these tokens. When the ramp
changes, update `app/design-system/foundations.jsx` in the same commit so the
reference surface does not describe a system the site no longer has.

## Case-study media and copy

`studies/` is a 207 MB working editorial pack: long-form case studies, an
authorship-boundary README, and the original photo and video archive. It is
**excluded from the deploy** and must stay that way. Nothing in it is served.

`public/media/<slug>/` holds the derivatives the pages actually load. Rebuild
them with `python tools/media/build-media.py`: stills become WebP at a 1500 px
long edge, clips are re-encoded to a 960 px long edge, CRF 29, no audio, with
`+faststart`. That took the set from 25.1 MB to 5.3 MB.

The encoder is `ffmpeg-static`, installed under `tools/media/node_modules` by
`npm install --prefix tools/media` and gitignored, so nothing has to sit on the
system PATH. The build script falls back to copying clips verbatim if it is
missing, and says so.

Bulgaria 2026's figures are browser captures of `bulgaria2026.com`, not
photographs. Two full-page captures and one hero viewport shot are the working
sources in `studies/media/bulgaria_2026/_source/`; the seven files beside them
are crops taken from those pages, so a figure that needs different bounds is
**re-cut, never re-shot**. Full-page captures land at the repo root by default
and the deploy rsyncs everything except `.git/ .github/ .agents/ _site/
face-test.html tools/ studies/ *.md` — so a 10 MB screenshot left in the root
ships to production. Move sources into `studies/` first.

Its `tone` values are measured, not guessed. Mean luminance against the 140
threshold: forum-hero 166, networking-hero 161, application 143, generator 211
carry `tone: "light"`; programme 39, wheel 39 and pricing 58 are the ink
sections (`#0A1724`) and must stay dark. Re-measure when a crop moves — the
lens punches a hole through an unmarked light plate.

`python tools/media/fetch-blueprint.py` pulls the Wafer build-journal images
from blueprint.hackclub.com and re-encodes them into `public/media/wafer/` with
a `journal-` prefix. It prints the exact `ratio` string for each file, ready to
paste into a record.

A story block in `app/projects/data.jsx` is one of three kinds:

```js
{ kind: "stub",  h: "Heading", body: "..." }
{ kind: "photo", src: "public/media/wafer/side-profile.webp", ratio: "3 / 4", caption: "..." }
{ kind: "video", src: "public/media/ci-clop/bringup.mp4",     ratio: "9 / 16", caption: "..." }
```

An earlier pass added a fourth `diagram` kind rendering inline SVG, on the
theory that Iskra's trust boundary could not be photographed. It was removed:
real material beat it. The operator-station screenshot shows the product, the
fail-closed state and the Ci-Clop product row all at once, which no synthesised
figure did. Prefer the real artefact.

`tone: "light"` flips the lens for a light-background image. The default assumes
a dark subject, so a white schematic or a light UI screenshot punches a hole
where the lens lands. Set it on anything above roughly 140 mean luminance.

**Captions are labels, not sentences.** The house register is terse, lowercase
leaning, middle-dot separated, no terminal period and no commentary:
`nPM1300 · charge · rails · telemetry · one I2C device`. Authorship boundaries
belong in the body copy; a caption should never carry a disclaimer.

`ratio` is per block because the archive is mixed: 27 of 40 stills and 15 of 19
clips are portrait, and the rest run 4:3, 16:9, 2:1 and near-square. Omitting it
falls back to the media's intrinsic aspect. `AsciiMediaFigure` picks a measure
from the ratio, so a portrait frame does not occupy the full 860 px column.

Video runs through the same ASCII lens as the stills: `AsciiPhoto.loadVideo()`
binds a `<video>` as the sampled WebGL texture and re-uploads a frame per tick
while the clip plays. Clips are muted, looped, `playsInline`, gated on an
IntersectionObserver so an off-screen figure decodes nothing, and carry a
play/pause control. `window.AsciiPhotoFigure` remains an alias of
`AsciiMediaFigure` for older call sites.

**Contexts are recycled and this is load-bearing.** Every figure is a WebGL
context and browsers cap concurrent contexts near 16, silently killing the
oldest past that. The Wafer case file alone has 21 figures plus the page's own
3D hero rig; before recycling, five figures and the hero all lost their context
on one scroll. A figure more than 1400 px outside the viewport therefore
disposes its engine, calls `WEBGL_lose_context`, and bumps a generation counter
that remounts the canvas. The remount is required: a canvas whose context was
explicitly lost can never return another one. Do not "optimise" the second
observer away.

### Authorship boundaries, which are not style choices

`studies/case_studies/00_README.md` records what each project may and may not
claim, and the shipped copy follows it. Do not soften these while editing:

- **Wafer.** The nPM1300 battery work lives in a personal ZMK fork. Do not write
  that it was merged upstream. The first CNC run was an iteration that exposed
  tolerance problems, not finished production, and the enclosure was ordered,
  not milled personally.
- **Ci-Clop.** Scope is firmware, interaction and production integration. Do not
  claim schematic or PCB authorship. The abandoned power-bank direction is not a
  current feature.
- **Venovisor.** The device, its enclosure and the earlier redesign predate this
  work. The page claims the next firmware generation only. Field photographs
  establish the context the firmware must respect; they are not evidence for it.
  Prefer "used by medics" over any clinical or diagnostic-performance claim.
- **Iskra.** Prefer exact properties (signed metadata, hash verification,
  source/artifact separation, per-person revocation, fail-closed) over the word
  secure, and do not call it production ready while its own roadmap keeps
  acceptance gates open.
- **Bulgaria 2026.** Scope is the rebuild — editorial system, two conversion
  journeys, referral attribution, the Worker lead boundary and the CRM path. The
  starting point was a generated reference page whose content was kept; say so.
  There is no A/B test, so no conversion-uplift claim exists, and ticket price is
  not website revenue. Describe the Worker's implemented controls rather than
  calling it secure or audited. The referral layer is deterministic first/last
  touch over allow-listed links, not cross-device identity resolution. The
  self-presentation tool is a deterministic text composer — do not call it AI
  unless an AI service is actually added. The prize wheel visualises the fund;
  the real draw happens live. "~3 days" is a project-timeline statement about the
  first production-shaped build, not a development benchmark. Image rights are a
  launch gate: a local asset is not a licensed one.

The wordmark in the header is the way home on every route: the landing scrolls
to `#title`, All Projects and the design system navigate to `./`, and the
project pages carry it as its own link. On those pages the brand used to be a
single anchor reading `M.O. ∥ ← UNIVERSE` that ran the reverse node flight, so
one control had two meanings. It is two controls now — the wordmark goes to the
title, `← UNIVERSE` keeps the flight back to wherever the page was opened from
— and their hover states were decoupled to match.

## Shared pointer effects

`app/shared/styles/pointer.css` is the single square-reticle stylesheet.
`app/shared/pointer-effects.js` owns the shared pointer wake, paint trail,
ripples, text fringe, and displacement compositor. The landing inserts it into
the Universe composer; canonical project pages and Board Flight use its
standalone overlay.

The reticle in `app/shared/core.jsx` reports one of four modes. `hot`
("open →") is tested first and wins over `grab` and `probe`, so a link laid
over a draggable surface still reads as a link; anything clickable that is
neither an anchor nor a button carries `data-hot` rather than being added to
the selector by class. The reticle is hidden until the pointer proves where it
is: `core.jsx` sets `mo-cursor-live` on the documentElement on the first real
pointer move, press or wheel, and clears it when the pointer leaves the window
or the window blurs. `app/shared/styles/pointer.css` gates visibility on that
class, so the two files must be changed together. Touch never sets it.

Preserve native DOM text. The WebGL layer draws only the displaced fringe, so
text quality, baselines, focus, selection, and hit targets remain browser
native. `window.MOCursorDistortion`, `data-mo-cursor-*`, and the existing
`mo:*` events are cross-file compatibility contracts even though their source
now has a neutral semantic filename. Update every consumer together if one of
those contracts is deliberately renamed. Never mount a second pointer or
Universe implementation as a late override.

## Adaptive depth of field

The Universe depth-of-field pass is intentionally adaptive. It is created only
when the post-processing dependencies and shared pointer composer are
available, `window.__mo_grade.dof` is enabled, `BokehPass` exists, and the
browser does not report either `navigator.hardwareConcurrency <= 2` or
`navigator.deviceMemory <= 2`. Missing navigator values do not by themselves
mark a device as weak.

When the viewport is at most 760 px wide, the composer pixel ratio is capped at
1.25; otherwise it is capped at 1.5. This size check reduces fill rate but does
not disable depth of field. The first 30 valid frames are discarded — mount is
when the GLBs upload and the shaders compile, and judging the device on that
stall was disabling depth of field on machines that then ran fine. Over the
following 90 valid frames, an average below **30** FPS disables only the Bokeh
pass for the current Universe mount, and the measured average is left on
`window.__mo_dofFps`. The gate is 30 because depth of field is a look, not a
luxury: a device holding a steady 30 keeps it. The pointer displacement,
chromatic aberration, and vignette remain active either way. Depth of field is
reconsidered only when the Universe mounts again. Board Flight deliberately uses
its lite renderer and therefore skips its separate Bokeh path.

The Universe does not run stock `BokehPass`. `makeFastBokehPass` in
`app/landing/scenes/universe.jsx` re-fits it to this scene's actual settings:
13 tap positions instead of 41 at the same mean radius, an early-out wherever
the circle of confusion is sub-pixel, and a depth prepass at half resolution
into an 8-bit target (`dofDepthScale`) refreshed every second frame
(`dofDepthEvery`), both tunable through `window.__mo_grade`. At `maxblur`
0.0045 the blur disc is about 3.5 px at 1080p, which is what makes all three
free visually. The prepass itself is load-bearing and must not be replaced by a
`DepthTexture` read off the main pass: the cards, the constellation and both
point clouds are `depthWrite: false`, so main-pass depth does not know they
exist and every one of them would inherit the far-field blur.

The renderer requests `antialias` only when the composer is unavailable. With
the composer up, the scene lands in its own non-multisampled targets and the
drawing buffer only ever receives one full-screen quad, so MSAA there bought a
full-canvas resolve every frame and nothing else.

## Runtime and validation

- Keep the landing loader and `mo:preloader-done` contract intact. That is the
  landing's own `app/landing/preloader.js`. **There is no other loader.** The
  `Boot` overlay that used to live in `app/shared/core.jsx` was deleted on
  2026-08-23, along with its `.boot*` styles and the `mo_booted` session flag.
  It was a React component, so it could only render after React, Babel and the
  in-browser JSX compile had already finished: it masked nothing, and it held a
  ready page behind ~3s of synthetic log. Worse, it mounted as a sibling of the
  content rather than in place of it, so All Projects' staggered `m-row-in`
  entrance played out underneath it and was over before anyone saw it. Removing
  it is what made that entrance visible. Do not reintroduce a loader on a page
  whose paint is already gated by its own script loading.
- The GLB warm-up used to hang off that overlay's mount effect and now runs
  deferred at the bottom of `core.jsx`. It must stay deferred: core.jsx loads
  before each page's data scripts, and the single yield is what lets
  `UNIVERSE_PROJECTS` and `PROJECT_DATA` populate before it reads them.
- Keep fixed and sticky landing layers outside CSS filters that create new
  containing blocks.
- Prefer visibility-gated rendering and explicit Three.js disposal; the site
  targets machines with limited RAM.
- Build generated landing code with
  `npm.cmd run build --prefix tools/landing-runtime` and verify freshness with
  `npm.cmd run check --prefix tools/landing-runtime`. Never edit
  `app/landing/runtime.js` directly.
- Preview from the repository root with `python -m http.server 8000` and test
  the public HTML routes in a real browser.

## Models and live demos

Place shared GLBs in `models/`, then update the matching record in
`app/data/projects.js` and `app/projects/data.jsx`. Nodes without a finished
model deliberately retain their proxy representation — Kerfur and Venovisor are
the two left.

Run every incoming GLB through `npx gltfpack -i <in>.glb -o models/<slug>-mark.glb -c`
before wiring it up. `-c` is meshopt compression, which
`app/projects/rendering/model-viewer.jsx` already decodes by installing
`MeshoptDecoder` on the loader, and it is why the shipped marks are a fraction
of their source size — the Bulgaria badge went 121 KB → 17 KB with its three
meshes, three materials and its clearcoat/emissive extensions intact. The
packed file declares `KHR_mesh_quantization` and `EXT_meshopt_compression` as
*required*, so a route that forgets the decoder fails to load the model
outright rather than degrading.

The shipping project pages load live experiences from `demo/`, sometimes
through project-page components rather than an obvious direct HTML tag. Keep
`demo/`, its referenced assets, and `face-test.html` during cleanup. Before
moving or deleting demo code, trace references from every public project HTML,
its `app/projects/` page composition, and dynamic script or asset loaders, then
verify the corresponding Play Demo interaction in-browser.
