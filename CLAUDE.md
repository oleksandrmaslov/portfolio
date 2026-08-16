# Oleksandr's portfolio — project notes

## Canonical public surface

`Landing Final 5.html` is the only landing page. The public graph is Final 5,
`All Projects.html`, and the seven linked case files. Do not restore routes to
old Final/Landing versions or the removed Design System page.

There is no npm build. Serve the repository over HTTP for local review, for
example with `python -m http.server 8000`, then open
`http://localhost:8000/Landing%20Final%205.html`.

## Project data and addresses

`landing_final5/projects-data.js` is the landing/index source of truth.
Case-page navigation uses `project/data.jsx` plus
`project_v3/wafer-studio-data.jsx`. Keep the live address ring aligned:

`0x01 → 0x02 → 0x03 → 0x04 → 0x06 → 0x07 → 0x08 → 0x01`

The physical ZMK models are already wired:

- `0x07` — `models/keyboard-display.opt.glb`
- `0x09` — `models/soft-off-keycap.opt.glb`

Tune their size and pose only through `model.cardPose` in the Final 5 registry.

## Motion and input

Final 5 Universe motion lives in `landing_final5/universe.jsx`. Ambient camera
drift is delta-time based, dampens during direct interaction, and respects
reduced motion. Mobile Explore adopts the rendered camera pose before entering,
then uses pointer-captured yaw/pitch orbit with bounded inertia and pinch depth.
Do not reintroduce device-orientation control or the old Lusion orbit logic.

`system/cursor-field.js` and `system/cursor-field.css` own the one shared
foreground cursor effect. The Universe's older pointer-paint pass must remain
disabled whenever `window.__mo_cursor_field` is present, or Final 5 will render
the effect twice.

All case-file transitions use the generic `mo_node_*` session protocol and
`system/node-seam.js`; do not restore the obsolete `mo_wafer_*` bridge.
