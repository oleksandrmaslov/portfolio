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
- `Design System.html`

Every node in the registry now has a page, so the project ring runs
`0x01 → 0x02 → … → 0x0C → 0x01` with no gaps. The five routes added on
2026-08-22 (Venovisor, ZMK Soft Off Plus, Sightseeing, Silent Depth, Brionel
Catalogue) are scaffolds: their chrome is real, their case-study copy is
marked `[ ... ]` pending. Fill the placeholders in `app/projects/data.jsx`;
do not delete the routes to "clean up".

`Design System.html` is a deployed reference surface. `face-test.html` is a
local test surface and is explicitly excluded from deployment. Internal folders
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

## Shared pointer effects

`app/shared/styles/pointer.css` is the single square-reticle stylesheet.
`app/shared/pointer-effects.js` owns the shared pointer wake, paint trail,
ripples, text fringe, and displacement compositor. The landing inserts it into
the Universe composer; canonical project pages and Board Flight use its
standalone overlay.

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
not disable depth of field. After 90 valid rendered frames, an average below 42
FPS disables only the Bokeh pass for the current Universe mount. The pointer
displacement, chromatic aberration, and vignette remain active. Depth of field
is reconsidered only when the Universe mounts again. Board Flight deliberately
uses its lite renderer and therefore skips its separate Bokeh path.

## Runtime and validation

- Keep the landing loader and `mo:preloader-done` contract intact.
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
model deliberately retain their proxy representation.

The shipping project pages load live experiences from `demo/`, sometimes
through project-page components rather than an obvious direct HTML tag. Keep
`demo/`, its referenced assets, and `face-test.html` during cleanup. Before
moving or deleting demo code, trace references from every public project HTML,
its `app/projects/` page composition, and dynamic script or asset loaders, then
verify the corresponding Play Demo interaction in-browser.
