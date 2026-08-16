# v13/v14 · Continuous Flight — architecture notes

v14 adds the three seam SET-PIECES (drama 90):
- `toOrigin` — GLYPH SLIPSTREAM: ascii.jsx pushes dissolving wordmark cells
  into `window.__mo_glyphDrops`; flight.js's `.fl-slip` canvas sucks them
  toward a vanishing point (56%, 30%) with cyan streaks. Tweak: slipstream.
- `toWork` — 0x00 DETONATION: universe arms per-particle radial impulses off
  the formed glyph the frame the transit engages (`detE`), blasts outward,
  homing lerp re-gathers; warp gets a `detKick`. Sound: noise crack + 96→36Hz
  thump. Tweak: detonation.
- `toAbout` — NODE PORTAL: camera-local wireframe icosahedron flies from 30u
  ahead to 3u behind (swelling 2.2→28×) while the iris ALWAYS closes on this
  leg (any seam style); reopens on about arrival. Sound: 130→34Hz dive sub.
  Tweak: portalNode.
- Per-seam signatures in `seamSig()` over MOSound.ctx: launch chirp /
  detonate crack / dive sub / dock ticks. Gated by mute + reduced motion.
- v14 origin: `.origin__type` anchors LEFT-BOTTOM (landing_v14/origin.css),
  caption moved bottom-right, scrim re-weighted — glyph owns the centre.
  origin.jsx exit transform is a plain translateY (no -50% carry).

Goal: kill the "screen-to-screen" scroll feel. The whole page is ONE camera
journey through the node universe; sections are STATIONS you arrive at.

## Pieces
- `flight.js` — master scroll timeline. Reads the 4 section tracks per frame →
  `{ seg, t }` where seg ∈ title | toOrigin | origin | toWork | work | toAbout | about.
  Publishes `window.__mo_flight = { seg, t, speed, surge, warp, stream }`,
  `window.__mo_titleExit`, CSS vars (`--fl-title --flt-a/b/c --fl-origin
  --fl-work --fl-iris`), body classes (`fl-titleDim fl-titleGone fl-noHud`),
  the unified HUD (#flHud), the tunnel iris, doppler wind (own WebAudio gain
  over MOSound's context, gated by mute), and `mo:seam` events (+ carrier accents).
- `universe.jsx` — FLIGHT RIG (search "v13 — CONTINUOUS FLIGHT RIG"):
  - `FLB.base/h0` captured when leaving the title leg (wherever user looks);
    stations laid ahead: sO = base+24u, sW = sO+28u @ bank −0.34 rad, sA = sW+32u @ −0.10.
  - `updateRail()` maps seg/t → rail pose; camera lerps onto it (railW grip).
    Fallback: no flight.js → exact v12 parking behavior.
  - `stW(v, station, yaw)` transforms arranged-mode tile targets (origin ring,
    reel parade, dive) into the station frame.
  - 0x00 glyph world-anchors at sO (`FLB.glyphC`); DoF focus tracks it.
  - Warp streaks: 150 additive LineSegments, camera-local, driven by
    `__mo_flight.warp/speed`. Glyph "detonate" stream on toWork via `.stream`.
  - `window.__mo_cam` = live pose for the HUD. Rebase shifts FLB vectors.
- `flight.css` — fixed title stage (`.title__stage`, dissolves in place via
  --flt-*), sticky stages fade before un-stick (--fl-origin/--fl-work), old
  per-section chrome hidden, HUD + iris styles.
- `ascii.jsx` — wordmark dissolve (`__mo_titleExit`, per-cell hash dropout).
- `origin.jsx` — chrome removed (HUD owns it); type lifts off at p>0.87.
- `board-flight.jsx` — publishes `__mo_bf.{lead,openP,t,foot}`; uNode card
  DOCKS (rise+deblur) instead of flat fade.
- `tweaks.jsx` — Flight path section: seam style (surge/tunnel/calm), warp %,
  rail grab (soft/firm), doppler, HUD; writes `window.__mo_flightCfg`.

## Seam map (scroll → seg)
- pT = title progress (1 viewport), pO/pW/pA = track progress, mW/mA = next
  section's top approaching viewport top (fills the 1-viewport stitch gaps).
- toOrigin: pT 0.12→1 ∪ pO 0→0.32 · origin hold: pO 0.32→0.865
- toWork: pO 0.865→1 ∪ mW ∪ pW 0→0.105 · work hold: 0.105→0.945
- toAbout: pW 0.945→1 ∪ mA ∪ pA 0→0.055 · about: rest (board flight owns it)

## Known behaviors
- Wheel over the framed universe in title = fly (v12 parity); rail blocks
  fly once gripped (railW > 0.25).
- Scrolling back to title releases the rail (t<0.04) and re-arms base capture.
- cin-reveal classes stripped on first exit so their forwards-fill can't pin
  the lift-off transforms.
- HUD hidden ≤700px; reduced-motion zeroes warp/stream/iris + wind.
- WebGL never shows in DOM-based screenshots — audit visuals live.
