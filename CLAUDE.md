# Oleksandr's portfolio — shipping notes

## Canonical release surface

`Landing Final 5.html` is the only shipping landing page. Its universe, reel,
All Projects index, and handoff data come from
`landing_final5/projects-data.js`.

The seven shipping project pages are:

- `Wafer v3.html`
- `Kerfur v2.html`
- `Iskra v3.html`
- `Tactical Flashlight v2.html`
- `Wafer Studio.html`
- `Split HID Display v2.html`
- `ZMK-PointAccel v2.html`

`project/data.jsx` owns their canonical route ring and project records. Keep
its addresses aligned with `landing_final5/projects-data.js`; do not add a
second `file2` route or a page-local data override.

## Shared cursor effects

`system/cursor.css` is the single square-reticle stylesheet. The Lusion-style
wake, paint, ripple, and text-fringe implementation lives in
`system/cursor-distortion.js`. Final 5 inserts it into the Universe composer;
the canonical project pages and Board Flight use its standalone overlay.

Preserve the native DOM text. The WebGL layer draws only the displaced fringe,
so text quality, baselines, focus, and hit targets stay browser-native.

## Runtime constraints

- Keep Final 5's loader and `mo:preloader-done` contract intact.
- Do not load a second Universe or cursor implementation as a late override.
- Keep fixed/sticky landing layers outside CSS filters that would create new
  containing blocks.
- Prefer visibility-gated rendering and explicit Three.js disposal; this site
  targets machines with limited RAM.
- Validate changes through `python -m http.server 8000`; there is no npm build
  workflow for the shipping static pages.

## Model wiring

Drop GLBs in `models/`, then update the matching node in
`landing_final5/projects-data.js` and its project record in `project/data.jsx`.
Nodes without a finished model deliberately keep their proxy representation.
