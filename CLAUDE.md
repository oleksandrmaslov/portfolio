# Oleksandr's portfolio — project notes

## Project data is centralised
`landing_final3/projects-data.js` and `landing_final4/projects-data.js` are the
single source of truth for every node (cards, universe tiles, All Projects
index, handoff). They are kept **identical** — any tag/model/state change must
be applied to both. `All Projects.html` reads the Final 3 copy and adapts it
into `window.UNIVERSE_PROJECTS`.

Wiring a model: drop the GLB in `models/`, then on that node set
`model: mdl({ ready: true, src: "models/<file>.glb", proxy: null, rigPose: {...}, cardPose: {...} })`.
Nodes without a GLB render the `node-shell` proxy.

## Parallax drift in the universe (v14)
Implemented in `landing_final4/universe.jsx`. **Not yet applied to
`landing_final3/universe.jsx`** — do it when the user asks.

How it is wired (repeat these three steps in the Final 3 file):

1. Right after `const camTarget = { yaw: 0, pitch: 0 };` add the `PDRIFT`
   config block, `let pdriftGain = 1;` and the two scratch vectors
   `_pdR` / `_pdU`.
2. In the frame loop, immediately after
   `cam.pos.addScaledVector(FORWARD, cam.vel * dt / 1000);`, add the drift
   block: ease `pdriftGain` toward `1` when `mode === "drift"` and nothing is
   dragged/focused/hovered, else toward `PDRIFT.focusDamp`; then add
   `cos(t·ω)·amp·gain` along the camera-local right and up axes.
3. In the idle-drift branch, halve the auto-yaw
   (`camTarget.yaw += dt * 0.000035`) so the turn does not fight the drift.

Key constraints that make it safe:
- It is a **per-frame position delta**, never an absolute target — so it
  composes with wheel-fly, the transit treadmill and `rebaseWorld()` without
  any of them knowing about it.
- Amplitude is a velocity (world-units/sec) integrated from the *derivative*
  of the Lissajous, so the camera never springs back to a home point.
- `PDRIFT.px` / `PDRIFT.py` are seconds per cycle and are deliberately
  non-integer multiples (47 / 31) so the path never visibly repeats.
- `PDRIFT.amp = 0` disables it entirely.

## ZMK module cards
Three nodes are ZMK modules (0x07, 0x08, 0x09). The ZMK mark
(`models/zmk-mark.glb`) is deliberately on **0x08 only** — three identical logo
cards would look like duplicates, so the badge goes to the one module with no
physical form (Pointing Acceleration is pure firmware maths).

Planned objects (user is modelling these manually):
- 0x07 Split HID Display — the raw HID-display Figma SVG frame extruded as a
  3D screen, showing the actual interface.
- 0x09 Soft Off Plus — a low-profile switch with a power icon on the keycap.

Both stay on the node-shell proxy until their GLB lands.
