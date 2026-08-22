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
- `Wafer Studio.html`
- `Split HID Display v2.html`
- `ZMK-PointAccel v2.html`
- `Design System.html`

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
