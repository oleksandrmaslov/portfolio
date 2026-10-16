# Oleksandr's portfolio — shipping notes

This file is the shared context for every coding agent that works in this
repository (Codex, Claude Code, Cursor and the rest). `CLAUDE.md` only imports
it, so edit this file and nothing drifts.

## Public routes

The deployed root HTML filenames are public URLs and must remain stable.
`index.html` is the canonical landing source and is served directly at `/`.
It was renamed from `Landing Final 5.html` on 2026-08-22 as a clean break: the
old URL is gone and no redirect stub was kept. Inbound links to the landing use
the relative form `./` (and `./#work`, `./#about`, `./#contact`) so they resolve
correctly under the GitHub Pages project subpath.

Six routes were renamed the same way on 2026-08-25 — again a clean break, no
stubs, the old URLs are gone:

| was | is |
| --- | --- |
| `Wafer v3.html` | `Wafer.html` |
| `Kerfur v2.html` | `Kerfur.html` |
| `Iskra v3.html` | `Iskra.html` |
| `Tactical Flashlight v2.html` | `Ci-Clop.html` |
| `Split HID Display v2.html` | `Split HID Display.html` |
| `ZMK-PointAccel v2.html` | `ZMK-PointAccel.html` |

The version suffixes were build history leaking into public URLs. `Ci-Clop` was
already the node's `name` and `slug` in both registries and the name of its
media folder — only the filename still said "Tactical Flashlight", so the route
was the last place the retired name survived. `models/tactical_flashlight.glb`
became `models/ci-clop-mark.glb` in the same pass, which also puts it on the
`<slug>-mark.glb` convention every other mark follows.

Nothing links to a route by literal filename except the two registries: pages
navigate through `project.file`. That is the whole migration surface — plus one
`<link rel="prefetch">` in `index.html`, and the landing's no-graphics overview
(`#mo-fallback` in `index.html`), whose project links
`tools/landing-runtime/build.cjs` generates from `MO_FEATURED_ADDRS`, so the
build moves them with a rename. Verify a rename by executing both registries
and walking the ring in both directions, not by grepping.

The other public pages are:

- `All Projects.html`
- `Wafer.html`
- `Kerfur.html`
- `Iskra.html`
- `Ci-Clop.html`
- `Venovisor.html`
- `Wafer Studio.html`
- `Split HID Display.html`
- `ZMK-PointAccel.html`
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
script, and that is correct. It still sets `bridgeSeam: true` in its
`PAGE_CONFIG` like the other former handoff pages, which only clears a stale
`mo_node_seam` from session storage; that is harmless and also correct.

The rest survives untouched: the page serves, it renders
`models/silent-depth-mark.glb` as its own hero from its `PAGE_CONFIG`, All
Projects lists it (that page builds its row list from `MO_PROJECTS` inline, so
it never sees the filter), and it holds its ring slot between `0x0A` and `0x0C`
so prev/next still reach it.

This is the supported way to retire a node from the headline field without
deleting a public URL — do not "finish the job" by removing the record, the
route or the model.

The five routes added on
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
- `tools/face/generate-assets.py` is the Kerfur face asset generator. It reads
  `assets/face/kerfur_faces.json` here but writes C headers into the Kerfur
  firmware's `include/ui/generated` and `src/ui/generated`, so it only runs
  against a firmware checkout. It is kept on purpose; do not delete it as
  unreachable.

### Sampled soundtracks

The landing plays **Clear signal** unchanged. All four sounding demos use its
`app/landing/audio/sample-engine.js` and licensed sample bank, with separate
compositions in `demo/music-score.js`. `demo/sample-sound.js` owns demo audio
lifecycle and the project palettes map every interaction to sampled cues.
The carrier engine, old score, demo oscillator core and inactive landing hooks
were removed in the audio refresh. Do not restore a second audio engine.
The sampler must load as its own script: `document.currentScript.src` anchors
its instrument manifest URL. Music starts on demo entry, respects the saved mute
preference and stops when hidden; returning requires an explicit sound toggle.

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

**When a drag near the M.O. wordmark does nothing, suspect `.bf-layer`, not
the wordmark.** `.bf-layer` is a FIXED full-viewport layer that exists from
first paint at `opacity: 0`, and `.bf-ch` is anchored to the bottom-left
corner — the same corner as the wordmark, and taller than it. Anything inside
that layer which hit-tests while invisible reads exactly like an oversized
wordmark. `title.css` keeps a `body:not(.fl-titleGone)` guard list for this;
add every new board overlay to it, and gate any inline `pointerEvents` on the
element's real computed opacity rather than on which chapter owns the scroll.
`.bf-ch` set its own inline `pointer-events` and was missed by both — the card
sat invisible over the hero swallowing drags.

`app/shared/styles/key.css` is the single definition of the `.key` keycap and
is loaded by every route. It was previously duplicated declaration-for-
declaration in `shell.css` and `components.css`; do not re-inline it.

`app/shared/key-button.jsx` is likewise the single `KeyButton` component.
`build.cjs` compiles it into every bundle that needs one. It used to exist in
six copies (two inline in HTML, two `PCKeyButton`s, the Design System's and the
landing's) that had drifted apart, so each page's behaviour is now an explicit
prop: `ripple` (on by default; the landing relies on it, project pages pass
`false` because their standalone pointer field also defines `__mo_disturb`),
`blurOnPress` (project pages) and `cursorMirror` (the template pages pass
`".hv-demo"`). The press sound plays wherever `window.MOSound` exists, which is
only the landing. Add a prop rather than a seventh copy.

`app/shared/styles/layout.css` and `components.css` style only the Design
System, which is the only page that loads them. `demo/base.css` loads only on
the four pages with a live demo (Wafer, Kerfur, Ci-Clop, ZMK-PointAccel).
`Shell`, the Design System's page frame, lives in `app/design-system/app.jsx`,
not in `core.jsx`, which every bundle includes. The Design System loads Three
as ES modules through its import map like every other route, not the
deprecated UMD `three.min.js`.

Every public page requests an identical font set: Geist 400/500/600, Geist
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
face-test.html lab/ tools/ studies/ models/wafer_parts/ *.md` — so a 10 MB screenshot left in the root
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

`pointer.css` is also the only definition of `--cursor-size` (26px on every
route). `tokens.css` used to set it a second time at 24px, and because the
landing loads `tokens.css` after `pointer.css`, the landing reticle was smaller
than everywhere else. The old circular cursor is gone entirely; there is one
reticle, mounted once per route by `Cursor()` in `core.jsx`.

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
`window.__mo_dofFps`. The probe reads the same 50 ms-clamped frame delta as the
motion, on purpose: fed raw intervals, a few 50–200 ms loading hitches inside
the window drag a capable device under the gate. The gate is 30 because depth of field is a look, not a
luxury: a device holding a steady 30 keeps it. The pointer displacement,
chromatic aberration, and vignette remain active either way. Depth of field is
reconsidered only when the Universe mounts again. Board Flight has no Bokeh
path at all: `MOBoard.build(mount)` creates one renderer with no composer, no
antialias and a 1.25 pixel-ratio cap. Its unused full-quality composer path was
removed on 2026-10-04.

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

## Audit findings worth remembering

A four-way audit on 2026-08-23 turned up three patterns that keep recurring
here, and they are the things to check first when something behaves oddly:

- **A mount-only effect that reads React state directly.** The render loops
  live in `useEffect(..., [])`, so any cross-render value must come through a
  ref. `activeAddr` in `universe.jsx` and `active` in `event-bus.jsx` were both
  read straight and were pinned to their first-render value forever.
- **A constant typed in one file that is derived in another.** The reel's
  `padN` was hardcoded as `0.091` in `scroll-flight.js` and its last stop as
  `5` in `score.js`, both derived from `MO_FEATURED_ADDRS.length` in
  `work.jsx`. Both are computed now. When you change the featured list, grep
  for anything that assumed its length.
- **A ring verified in one direction.** `0x01.prev` was left pointing at
  `0x0C` when `0x0D` was inserted, so Bulgaria was reachable by NEXT only —
  and the forward-only walk used to verify it passed. Walk both ways.
- **A clone that lost its hook.** r160 `Material.copy()` does not copy
  `onBeforeCompile` or `customProgramCacheKey`, so a cloned studio material
  renders without Neutral, grain or layer lines. Make a per-object copy with
  `MOStudio.copy()`, or build a fresh one from the `presets()` factory; calling
  `tone()` on a clone restores Neutral but not the grain. The PLAY DEMO's
  per-key caps are the case that bit.

Also fixed and worth not re-introducing: `applySolidMaterials` used to dispose
the material it replaced, but `loadProjectModel` hands out `root.clone(true)`
and `Object3D.clone()` **shares** materials with the cached root — so that
freed GPU state every later consumer of the same URL still pointed at.
`presets().apply` in `app/projects/rendering/studio.js` shows the correct
pattern: it builds new materials and never disposes a sealed one.

## Shared registries are cache-busted

`app/data/projects.js` and `app/projects/data.jsx` decide every project route.
They used to load with a bare `src`, so a browser holding a cached copy across
a route rename kept navigating to filenames that no longer existed — the
landing and All Projects both went dead while the source on disk was correct.
That is not a hypothetical; it is what happened on 2026-08-25.

`tools/landing-runtime/build.cjs` now stamps `?v=<content-hash>` on both files
in **every** root HTML page, the same way it already stamped the landing
runtime, and `npm run check` fails on a stale stamp. Run the build after
editing either registry — a rename is not finished until the stamp moves.

Every local stylesheet (`app/**.css`, `demo/**.css`) linked from a root page
is stamped the same way, and `styles-version.test.cjs` fails on a stale or
missing stamp, so run the build after any CSS edit too. The few plain scripts
the landing loads by tag (`cinematic.js`, `scroll-flight.js`, the audio files)
still carry hand-written `?v=` strings; bump them when you change those files.

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
  targets machines with limited RAM. A loop sleeps (owns no animation
  callback) while its output is scrolled away, in a hidden tab, or under the
  navigation surface, and wakes on the event that changes that. An
  IntersectionObserver cannot see the opaque menu, so work beneath it listens
  for `body.mo-menu-settled` with `mo:menu-settled` / `mo:menu`. Wafer's
  bespoke page lifecycle follows the same contract as
  `project-page-lifecycle.jsx`.
- Back/forward cache restores a project page exactly as it left: hero centred
  in the handoff pose, idle off, exit spin on. `core.jsx` clears
  `__hv_exitSpin` with `__hv_leaving`, and both hero lifecycles settle the rig
  to rest on `mo:page-restored`. Any new one-way exit flag needs the same
  reset.
- **The forward flight is one gesture, and it is designed motion.** Do not
  simplify it to a tween, re-add a rest pose the page then grows from, put a
  constant spin back on top, or let the turn take the short way. Its parts,
  in order (the engine is `window.moFlight` and the rig's `flyTo` /
  `setFlight` / `handoff` in `solid-hero-rig.jsx`):
  1. **Wind-up** (140 ms, from the first frame the mount shows): a 3% lift
     toward the camera (on a 2.5x slower envelope, so it runs into the
     travel's own growth and the size has ONE rise), a 7° tilt toward the
     viewer and an 8° counter-turn AGAINST the coming turn (`WIND`). It masks
     the swap from the card's model to the rig's. That first frame is p = 0
     exactly: the card's own size, centre, pose and lens.
  2. **Travel with a showcase turn** (1300 ms drawn, `handoffPose.duration`).
     Position, size, lens (58 → 38), the light dress and the turn all run on
     ONE eased progress: `moFlight.ease`, an in-out power (`EASE_K` 3.5, so
     peak speed 3.5x the mean, at mid-travel, and long soft ends), from the
     card to the page hero's **final settled layout**,
     `window.moHeroLayout(addr)`, the one function both page templates lay
     their hero out with (a per-project override is the registry's
     `model.heroLayout`, never a page config). On the same progress (`PATH`):
     the position follows an **arc** (a bow off the chord to its upper side,
     16% of it, `4e(1 − e)`, so 0 at both ends); the model **banks** into its
     lateral screen speed (≤ 15°, `tanh`, from the ease's own slope, so
     exactly 0 at the start and at the seam); and its size runs slightly
     ahead of its position (the **approach**, capped so the size still only
     ever grows). The **turn** is `moFlight.turn(from, rest, turnMin)`: the
     short way only when it already turns `turnMin` degrees, otherwise the
     LONG way, 360° minus the short delta. The forward's `turnMin` is 180
     (`handoffPose.turnMin`), so every click turns 180–360°, ~270° on
     average, and still lands exactly on the hero's rest yaw. The card creeps
     (0.15 rad/s), so the short way alone was under 120° on ~2/3 of clicks.
  3. **The field reacts**, on the same progress, and the camera does not
     move: `.wf__veil` is driven inline (60% while the model lifts, the rest
     as it lands, so the seam is the page's own void), `body.wf-lift` steps
     the landing's own content back, and `window.__mo_lift` (0..1) racks the
     Universe's existing Bokeh pass off the cards (focus toward 2u, aperture
     up to 6x, `maxblur` 1.8x; nothing where DoF is off). No new program.
  4. **Settle.** Scale and yaw arrive with velocity and hand it to a
     closed-form spring (`moFlight.settle`: ~1% and ~2° overshoot, peak at
     89 ms, back at 300 ms). The landing navigates at the spring's peak, the
     one still moment, and stores `rig.handoff()` in `mo_node_state`; the page
     boots with `window.moArrival()` + `rig.arrive()` already in its final
     layout and continues the spring with `rig.release()`.
  5. **Signature beat**, on the page, one shot after the settle, run inside
     the rig's own loop: Ci-Clop's LEDs off → subtle, the Venovisor's red glow,
     the Wafer's two screens from blank glass, and for every other model a
     600 ms key-light sweep (`MOStudio.lights` `set(look, field, sweep)`).
     Existing uniforms and lights only, no new programs. The flight takes the
     beat level to 0 so the page can wake it. The page title's existing
     entrance (`hv-page--ready`) starts on `mo:hero-settled`, not at boot.
  There is no whoosh: the sample bank (`instruments.json`) has no fitting
  sample, and no asset or second engine is added for one.
  `lab/port/tmp/flight/forward-probe.cjs` measures all of it across the
  navigation (first frame, the long turn on every run, bank 0 at the seam,
  one monotonic size rise, the seam, luma). The seam is captured with alpha
  (WebP); a JPEG flattened the void to #000 and every arrival flashed black.
  Every route with a GLB hero must keep `hero.modelFit` and `hero.pose` equal
  to its registry `rigFit` / `rigPose` — `studio.test.cjs` (h) checks all of
  them — since the page and the flight must draw the same frame. Reduced
  motion shows end states only: no travel, turn, spring or beat.
- Build generated landing and page code with
  `npm run build --prefix tools/landing-runtime` (`npm.cmd` on Windows), verify
  freshness with `npm run check --prefix tools/landing-runtime`, and run the
  unit tests with `npm test --prefix tools/landing-runtime`. CI runs the check
  and the tests on every pull request and before every deploy. Never edit
  `app/landing/runtime.js` or `app/page-runtimes/*` directly.
- Preview from the repository root with `python -m http.server 8000` and test
  the public HTML routes in a real browser.

## Where the cards stand

The opening spread in `app/landing/scenes/universe.jsx` is a Fibonacci spiral
with two rules on top, both load-bearing.

**No poles.** The textbook form runs latitude from `+1` to `-1`, which collapses
`radial` to zero at both ends and parks index 0 straight overhead and index
`N-1` straight underfoot — the two directions a visitor scanning the horizon
never looks. Wafer was the one above your head. The band is compressed to
`±FIELD_LAT` (0.55, about ±24° once BOX's proportions apply) and `i` takes a
half-step so the first and last cards sit inside the band rather than on its
edges.

**The first node greets you.** Index 0 is placed at `GREET_POS`, in front of
the camera's opening view direction, instead of wherever the spiral drops it.
Registry order decides who that is — `app/data/projects.js` puts Wafer first.
A card placed in front only works if nothing stands in front of it, so any
other card landing inside a 26° cone around that direction and nearer than
`GREET_CLEAR_R` walks around the ring until it is clear. That is a rule and not
a tuned phase offset on purpose: adding a project must not quietly re-break it.

**`driftHome(i, out, jitter)` is the only definition of a free-drift
position.** It runs once per tile at mount to compose the opening view, and
again inside `scatterTiles()` every time an arranged beat hands the field back
to drift. Those were two separate formulas, and the return path still carried
the pole-collapsing latitude, the small `BOX` and no greeting card — so
scrolling origin → title silently rebuilt the pre-refactor arrangement and put
Wafer back overhead. `jitter` is the only difference between the callers: mount
is deterministic so the first view is composed, a return is randomised so the
field does not snap back identical, and the greeting card is yawed to wherever
the camera is actually looking. A third caller calls this; it does not get a
copy.

**The cards get a bigger box than the dust.** `TILE_BOX` is `BOX * 1.4`, and
tiles place, wrap and edge-fade against it while the ambient debris, the star
parallax and the assembly cloud keep the tight `BOX`. At `BOX` the nearest
cards sat about 7u out, which at 3×4 fills a third of the frame and reads as a
closet; the spread is 11–16u now. The wrap and the edge fade must stay on the
**same** box — they are the two halves of hiding the teleport, and splitting
them puts a tile across the wrap surface at full opacity. `GRADE.focus` moved
out with them: it is pinned to the card plane, so leaving it behind would have
put the whole field outside the depth of field.

**Every beat that clears the field uses one function.** `scatter(i, R, Y, Z, D)`
puts the cards on a ring around whatever the beat is about, and the origin
assembly and the work-reel background are two calls to it at two scales.
(There was a `dive` call until 2026-08-25 and a second origin concept until
2026-10-04 — see the mode note below.) Both
`x` and `y` come from the ring angle, so two nodes can only share a screen
position if they share an index.

**The field has two ring shapes, and the difference is load-bearing.**
`scatter()` draws a ring in the XY plane, in *front* of the camera, around
whatever the beat is about. `indexRingTarget()` draws one in the XZ plane
centred *on* the camera, so the cards encircle the viewer — that is the All
Projects handoff.

It was a vertical column first, on the theory that All Projects is a table.
That clipped, and the reason generalises: **tiles billboard toward the camera,
so any arrangement that stacks them along one axis puts co-planar quads at the
same screen position and they z-fight through each other.** Give cards their
own bearing, not their own offset.

`RING_R` (8.0) is derived, not tuned. Twelve cards of `TILE_W` need
`2π·R / 12 > TILE_W` of arc each to stay clear; 8.0 gives 4.19 against a 3.0
card, so 1.19 units of gap. It also sits at 0.44 of `TILE_BOX`'s 18.2
half-extent, well inside the drift wrap-fade. Re-derive it if the card count or
`TILE_W` changes — do not nudge it.

Both landing entrances to All Projects run through `moLeaveToIndex()` in
`app/landing/app.jsx`: the shell's `INDEX ↗` and the work reel's `SHOW ALL`
keycap. The universe owns the duration and returns it from
`window.__mo_universe.toIndex()` — do not copy that number into a call site.
The handoff uses `body.lp-toIndex`, **not** `landing-exit`, because
`landing-exit` blurs and scales the universe and the collapse has to stay sharp
and visible underneath the fading page. `landing-exit` still owns every
project-page exit.

Before this, `INDEX ↗` was a bare anchor that hard-cut — the one landing exit
with no transition at all. A third shape needs a reason, not a copy.

**The Universe has three modes, and only three.** `app/landing/app.jsx` derives
`mode` from the active section and can only ever emit `reel`, `origin` or
`drift`. It is mounted once and there is no mode setter on
`window.__mo_universe`. Three further modes — `grid`, `ambient` and `dive` —
were carried as unreachable branches across roughly twenty comparison sites
plus five `GRID_*` constants, two `.universeBg--` filters, an inert
`window.__mo_dive` state block and a 420 ms `setInterval` in `score.js` whose
arming condition could never be true. They were removed on 2026-08-25 once the
scroll reel replaced what they were held for. If a new arrangement is added,
give it a `scatter()` call and a real `mode` value that `app.jsx` actually
emits — do not reintroduce a branch nothing can reach.

The same rule cleared a second batch on 2026-10-04: alternatives that only a
console global could switch on and that nobody switched on. Gone are the origin
"HUB" concept (`__mo_origin_lock`, `__mo_origin.concept`), Board Flight's
crossfade and wipe transitions (`__mo_bf_transition`, the unpassed
`onEnter`/`onContact` props) and its intro swoop, the scroll-flight tuning
styles (`__mo_flightCfg`, calm/tunnel, the `.fl-iris` overlay), and the
Universe HUD and reticle, which CSS had held at `opacity: 0` while it still
re-rendered three times a second. `__mo_dofFps` and `__mo_dofOn` remain as
console readouts. A variant worth keeping gets a real caller; a variant held
for comparison lives on a branch, not behind a global.

That is the whole point of the shape, and it replaced four copies of a form
that took `x` from a golden-angle spiral and `y` from a linear index ramp.
That version let neighbours line up: `0x08` sat directly behind `0x07` in **all
four** beats. Per-node offsets were the wrong instinct — a formula that can pair
any two nodes needs fixing once, not patching per node and per beat. If a new
arrangement is added, give it a `scatter` call rather than a fifth copy.

Constants tuned to the old, tighter spread have to move out with it, and this
is the class of thing to re-check whenever the field is rescaled. Already
moved: `GRADE.focus` (cards would sit off the focus plane), `TOPO_CUT` (the
constellation's max link length — at a flat 13 it fell below the new
nearest-neighbour distance, so the graph dropped most of its edges and faded
the rest to nothing; it is derived from `TILE_BOX` now). The field has no analytic key or rim any more:
the studio room and one ambient light the models. Scene fog stays at 22→38 on purpose: it is shared with the
ambient debris and the star parallax, which still live in the small `BOX`, so
it is not the cards' constant to retune — drifting cards now reach it, which
reads as depth.

## The project hero rig

`app/projects/rendering/solid-hero-rig.jsx` is the **only** project hero rig.
Every project route and the landing handoff call its `window.makeWaferRig`.

It used to have a fork, `basic-hero-rig.jsx`, which Kerfur, Ci-Clop,
Split HID Display and ZMK-PointAccel loaded. The two files were the same rig —
identical damping model, identical `HANDOFF`/arrival poses, identical
`applyToScene` — differing only in lighting (ambient 0.5 vs 0.85, key 1.35 vs
2.3, rim 1.7 vs 3.0, no fourth top light, exposure 1.05 vs 1.18), in defaults
(`modelFit` 4.1 vs 4.0, `pose.x` +1.02 vs -0.92) and in the material pass. Four
routes therefore drew their hero visibly dimmer and flatter than the rest for no
stated reason. It was retired on 2026-08-25 and its two unique capabilities were
folded into the survivor. **If a model needs different handling, give it an
option here — do not fork the rig again.**

The material route is two-way:

- default: a real GLB. `MOStudio.finish()` swaps its materials for studio
  presets by material name (`BY_NAME`), adds the hardware finish its URL names
  in `LOOKS`, and puts PBR Neutral inside every material. Nothing is cloned and
  nothing sealed is disposed.
- `keepMaterials: true`: a procedural hero (Kerfur) or the node proxy. Its
  materials are kept; the rig only adds the Neutral hook and the `PROCEDURAL`
  dress.

`assignMaterial` is gone: no shipped GLB lacks materials.

`buildModel` may return a bare `Object3D` **or** a `{ group, update }`
descriptor. The descriptor's `update(now, dt)` is driven by the rig's own loop,
so it inherits the visibility gate instead of holding a second permanent RAF
open for the life of the page. Kerfur's OLED face engine depends on this: lose
the hook and the face never ticks, `tex.needsUpdate` is never set, and the
screen-spill light stays dark.

There is one page template. `handoff-page.jsx` was a copy of
`standard-page.jsx` that differed only in `bridgeSeam`; the copies had already
drifted once (the seven handoff routes shipped a `heroLayout` override that the
copy never read), so they were merged on 2026-10-04 and the seven former
handoff pages now set `bridgeSeam: true` in their `PAGE_CONFIG`. That override
then moved again, out of `PAGE_CONFIG` into the registry's `model.heroLayout`,
because the landing flight has to land on it and cannot see a page config. The template
must forward the whole hero option set from `PAGE_CONFIG.hero`: a key it does
not forward is a key that silently does nothing — that is how `keepMaterials`
can look set and not be. Wafer keeps its own bespoke page,
`wafer-page.jsx`.

The rig's public surface is what the pages and the landing actually call. The
explode, entry, inspect and orbit controls nothing ever drove were removed with
their per-frame work; do not re-add an API without a caller.

Demo pages pass their demo settings as a plain `PAGE_CONFIG.demo.tweaks`
object. The in-page Tweaks panel that used to wrap them only opened on a
postMessage from an editor frame that nothing sends, and was removed.

## The studio: one look for every model

`app/projects/rendering/studio.js` is the only home of the model look: the
room, the PBR Neutral curve, the preset and name tables, the hardware finishes,
the Wafer assembly and the per-model `LOOKS`. It is a plain ES module that
`build.cjs` compiles into every bundle (its `esm` kind) as `window.MOStudio`;
the lab gallery imports the file itself, so there is no second copy to drift.

- **Tone lives in the material.** `tone()` puts Neutral inside each model
  material, because the Universe draws into render targets, where three turns
  tone mapping off, and r160's `OutputPass` has no custom curve. Never patch
  `ShaderChunk` and never set a renderer's tone mapping for a model.
- **`LOOKS` is keyed by URL**, the one thing every consumer already holds. A
  look is exposure, room strength and finish. Framing (fit, pose) is not a
  look: it stays in the registries.
- **Tiers.** The rig is `ROOM` at 256 plus `lights()`; the field is
  `FIELD_ROOM` at 128 plus `FIELD_AMBIENT`; the explosions are `parts`. The
  menu finishes as `field` but is dressed by `MENU`: an orthographic front
  camera on near-black, with no card behind, sees only the dark wall in a flat
  face, so the field dress turned the Wafer grey-on-black and the chrome W
  brown. `MENU` adds a key, a teal rim, lighter walls and floor (its own 128
  room, on the landing too, built on first open) and a stop on the Wafer.
  Retune it with `lab/port/menu-contrast.cjs`, which mattes each menu object
  and reports its luma against the surface.
- **Ownership.** A finish's light (`glow|halo|haze`) never sizes or frames a
  model: `modelBox()` skips it. Finish textures and merged geometry are shared
  by the module across every clone on the page and are never disposed by a
  consumer. A consumer disposes only `finish().materials`.
- **Static tiers merge by material** (Wafer 62 → 12, ZMK 49 → 2,
  Sightseeing 13 → 3). The explosions never merge: they move the parts.
- **The explosions measure in model space on stale matrices.** PLAY DEMO
  takes every part's box after `recenter` and `aligner` are posed but before
  their world matrices are refreshed, so a box is in model space only while
  nothing updates them. `attach()` updates its ancestors: one call on an
  identity wrapper put every later part's box into the aligned, scaled frame
  and blew the explode vectors and legends up (2026-10-16). Move a part into an
  identity wrapper with `add()`.
- **Precompile against the target you draw to.** A program's colour space and
  tone mapping depend on the render target, so the Universe's
  `renderer.compile()` runs with the composer's read buffer bound; compiled
  against the canvas it built a second program per material that the field
  never drew.
- **The site loads no KTX2.** Any future KTX2 asset must bring `KTX2Loader`
  back deliberately, with its transcoder counted in the budget.

## Models and live demos

Place shared GLBs in `models/`, then update the matching record in
`app/data/projects.js` and `app/projects/data.jsx`. Registry fields that no
code read (`featured`, which `MO_FEATURED_ADDRS` replaced, `nodeClass`,
`pagePose`, `primitive`, `demoSize`, and unused `mdl()`/`cardPose` keys) were
removed on 2026-10-04; a new field needs a reader in the same change. Nodes without a finished
model deliberately retain their proxy representation — Kerfur is the one left.

Run every incoming GLB through `npx gltfpack -i <in>.glb -o models/<slug>-mark.glb -c`
before wiring it up. `-c` is meshopt compression, which
`app/projects/rendering/model-viewer.jsx` already decodes by installing
`MeshoptDecoder` on the loader, and it is why the shipped marks are a fraction
of their source size — the Bulgaria badge went 121 KB → 17 KB with its three
meshes, three materials and its clearcoat/emissive extensions intact. The
packed file declares `KHR_mesh_quantization` and `EXT_meshopt_compression` as
*required*, so a route that forgets the decoder fails to load the model
outright rather than degrading.

Two exceptions. A model that carries a custom vertex attribute (`_PRINTZ`, the
print height the layer lines read) is packed with `lab/tools/pack-glb.mjs`,
because gltfpack 1.3 drops custom attributes; `venovisor-mark.glb` therefore
requires only `EXT_meshopt_compression`. The Wafer is built, not exported:
`node tools/wafer/build.mjs pack` merges `models/wafer_parts/` into
`models/wafer.glb` (creased normals, palettes, the two panels; see the tool's
header). No shipped GLB carries `KHR_lights_punctual` or KTX2;
`studio.test.cjs` fails if one does.

The shipping project pages load live experiences from `demo/`, sometimes
through project-page components rather than an obvious direct HTML tag. Keep
`demo/`, its referenced assets, and `face-test.html` during cleanup. Before
moving or deleting demo code, trace references from every public project HTML,
its `app/projects/` page composition, and dynamic script or asset loaders, then
verify the corresponding Play Demo interaction in-browser.
