/* ============================================================
   WAFER — PLACES
   ------------------------------------------------------------
   The eight places of the study, in story order, and the one
   continuous path through them. poseAt(s) is defined for every
   s in 0 … 7: stop anywhere and the halves are in a real
   configuration; go back and the same path replays in reverse.

   Tent → Magnets → Pocket is a single fold. Each half turns
   about its pinky edge, which slides in along the desk, like a
   book closing backwards: the puck catches it at 15°, the rings
   slam it shut at 90° — a 16 mm slab standing on its pinky edges.

   Pure maths, no three.js, so `node lab/places.check.mjs` can
   sweep every edge. Units: cm and radians; a pose is each
   half's ring centre (board-local) and quaternion [x, y, z, w].
   ============================================================ */

const D = Math.PI / 180;
export const TENT = 15 * D;   // Rempel 2007: ~14° tent, no slope
export const FOLD = 72 * D;   // Magnets: folded up, the backs facing a few cm apart

/* What each place is, says and shows. screen: the right panel's narration in
   Peripheral.svg's own slots (null = the panel plays music as designed).
   view: preferred camera — yaw, pitch, board-local target, share of the frame
   the halves fill — plus any limits on turning it. */
export const PLACES = [
  {
    id: "desk", label: "Desk", title: "Desk.",
    line: "Thirty-six keys in two halves. Type on your keyboard and Wafer types with you.",
    say: "both halves flat on the desk, ready to type",
    screen: null,
    view: { yaw: -0.2, pitch: 30 * D, target: [0, 0.4, 0], fill: 0.84 },
  },
  {
    id: "profile", label: "Profile", title: "4–8 mm.",
    line: "Thin at the case edge, tallest at the screens.",
    say: "edge on: the case is 4 to 8 millimetres thick",
    screen: { status: "2 / 8", title: "Profile", artist: "4–8 mm" },
    view: { yaw: 0, pitch: 1.2 * D, target: [0, 0.42, 0], fill: 0.94, pitchMin: 0, pitchMax: 30 * D },
  },
  {
    id: "screens", label: "Screens", title: "Screens.",
    line: "Two 68 × 160 memory-in-pixel panels. No backlight: they read by the room’s light.",
    say: "the two memory-in-pixel screens, close up",
    screen: null,
    view: { yaw: 0, pitch: 56 * D, target: [0, 0.6, -2.1], fill: 0.9, box: "screens" },
  },
  {
    id: "tent", label: "Tent", title: "Tent.",
    line: "Each half clicks onto a puck at 15°, pinky edge on the desk. A concept stand.",
    say: "each half tented 15 degrees on a puck, a concept stand",
    screen: { status: "4 / 8", title: "Tent", artist: "15° · concept" },
    view: { yaw: -12 * D, pitch: 12 * D, target: [0, 2, 0], fill: 0.84 },
  },
  {
    id: "magnets", label: "Magnets", title: "Magnets.",
    line: "A ring and a bar magnet in each back. Push the halves together.",
    say: "the halves folded up facing each other, a ring and a bar magnet in each back",
    screen: { status: "5 / 8", title: "Magnets", artist: "ring + bar" },
    view: { yaw: -24 * D, pitch: 16 * D, target: [0, 5.2, -0.12], fill: 0.8 },
  },
  {
    id: "pocket", label: "Pocket", title: "Folded.",
    line: "The magnets pull the halves back to back into one 16 mm slab. Pull them apart to open.",
    say: "both halves snapped back to back, keys facing out, about 16 millimetres thick",
    screen: { status: "6 / 8", title: "Pocket", artist: "16 mm" },
    view: { yaw: -52 * D, pitch: 14 * D, target: [0, 6.5, -0.12], fill: 0.66 },
  },
  {
    id: "wall", label: "Wall", title: "Wall.",
    line: "The same magnets hold it to a steel panel.",
    say: "both halves held on a steel panel by their magnets",
    screen: { status: "7 / 8", title: "Wall", artist: "on steel" },
    view: { yaw: -14 * D, pitch: 8 * D, target: [0, 13, -6], fill: 0.5, yawLimit: 35 * D },
  },
  {
    id: "fridge", label: "Fridge", title: "One more thing.",
    line: "It holds on a fridge, too.",
    say: "both halves stuck to a fridge door",
    screen: { status: "8 / 8", title: "Fridge", artist: "also steel" },
    view: { yaw: -12 * D, pitch: 5 * D, target: [0, 94, -8], fill: 0.28, yawLimit: 35 * D },
  },
];
export const FOLD_PLACES = [3, 5];   // Tent … Pocket: where a hand on a half drives the fold

/* ---------------- quaternions ---------------- */

export const qAxis = (x, y, z, a) => { const s = Math.sin(a / 2); return [x * s, y * s, z * s, Math.cos(a / 2)]; };
export function qRot([x, y, z, w], [vx, vy, vz]) {
  const tx = 2 * (y * vz - z * vy), ty = 2 * (z * vx - x * vz), tz = 2 * (x * vy - y * vx);
  return [vx + w * tx + y * tz - z * ty, vy + w * ty + z * tx - x * tz, vz + w * tz + x * ty - y * tx];
}
export function qSlerp(a, b, t) {
  let d = a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
  const s = d < 0 ? -1 : 1;
  d *= s;
  if (d > 0.9995) {
    const q = a.map((v, i) => v + (s * b[i] - v) * t), l = Math.hypot(...q);
    return q.map((v) => v / l);
  }
  const th = Math.acos(d), k0 = Math.sin((1 - t) * th) / Math.sin(th), k1 = (s * Math.sin(t * th)) / Math.sin(th);
  return a.map((v, i) => v * k0 + b[i] * k1);
}

/* ---------------- the path ---------------- */

const clamp01 = (x) => Math.max(0, Math.min(1, x));
const smooth = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const lin = (a, b, x) => clamp01((x - a) / (b - a));
const mix = (a, b, t) => a + (b - a) * t;

/* g: what the model measured at load — RX, RZ (ring centre, board-local),
   outer[h] (ring centre to pinky edge, positive) and box[h] (half-local
   [minX, minY, minZ, maxX, maxY, maxZ]). */
export function makePath(g) {
  const fold = (phi, lift = 0, spread = 0) => [
    { p: [-g.RX * Math.cos(phi) - spread, g.outer[0] * Math.sin(phi) + lift, g.RZ], q: qAxis(0, 0, 1, phi) },
    { p: [g.RX * Math.cos(phi) + spread, g.outer[1] * Math.sin(phi) + lift, g.RZ], q: qAxis(0, 0, 1, -phi) },
  ];
  const GAP = 2 * g.RX * Math.cos(FOLD);                       // ring to ring at Magnets
  const WALL = { x: 8.2, y: 12, z: -6 }, FRIDGE = { y: 118, z: -8 };
  const FACE = qAxis(1, 0, 0, Math.PI / 2);                    // keys to the room, thumbs down, back on the steel
  const hang = (y, z) => [{ p: [-WALL.x, y, z], q: FACE }, { p: [WALL.x, y, z], q: FACE }];
  const pose = (h, o = {}) => ({ h, stands: 0, wall: 0, fridge: 0, ring: 0, ...o });
  const shut = fold(Math.PI / 2);

  /* edge i runs place i → i+1 over u = 0 … 1. A magnetic place's last stretch
     (MAGNETS below) is authored linear in u, so the track's gap is the real one. */
  const EDGES = [
    () => pose(fold(0)),                                       // desk → profile: the camera moves, nothing else
    () => pose(fold(0)),                                       // profile → screens
    (u) => {                                                   // screens → tent: lift clear, pucks slide in, tip onto them
      const rise = u < 0.3 ? 3.5 * smooth(0, 0.3, u) : u < 0.75 ? mix(3.5, 1.5, smooth(0.35, 0.75, u)) : (1.5 * (1 - u)) / 0.25;
      return pose(fold(TENT * smooth(0.45, 0.85, u), rise), { stands: smooth(0.12, 0.55, u) });
    },
    (u) => {                                                   // tent → magnets: off the pucks, they leave, the fold goes on
      const phi = u < 0.3 ? mix(TENT, 30 * D, u / 0.3) : mix(30 * D, FOLD, smooth(0.35, 1, u));
      return pose(fold(phi), { stands: 1 - smooth(0.08, 0.4, u), ring: 0.7 * smooth(0.55, 1, u) });
    },
    (u) => pose(fold(Math.acos((1 - u) * Math.cos(FOLD))), { ring: 0.7 }),   // magnets → pocket: the gap closes linearly
    (u) => {                                                   // pocket → wall: part, spread, turn to the room, onto the steel
      const x = 0.75 * lin(0, 0.15, u) + (WALL.x - 0.75) * smooth(0.12, 0.5, u);
      const y = shut[0].p[1] + 3 * smooth(0.1, 0.45, u) + (WALL.y - shut[0].p[1] - 3) * smooth(0.45, 0.8, u);
      const z = mix(g.RZ, WALL.z + 1.5, smooth(0.35, 0.8, u)) - 1.5 * lin(0.8, 1, u);
      const t = smooth(0.3, 0.8, u);
      return pose([
        { p: [-x, y, z], q: qSlerp(shut[0].q, FACE, t) },
        { p: [x, y, z], q: qSlerp(shut[1].q, FACE, t) },
      ], { wall: smooth(0.3, 0.8, u) });
    },
    (u) => {                                                   // wall → fridge: off the steel, carried up, onto the door
      const z = WALL.z + 1.5 * lin(0, 0.15, u) - 2 * smooth(0.55, 0.85, u) - 1.5 * lin(0.85, 1, u);
      return pose(hang(mix(WALL.y, FRIDGE.y, smooth(0.12, 0.85, u)), z), { wall: 1 - smooth(0.3, 0.75, u), fridge: smooth(0.12, 0.6, u) });
    },
  ];
  /* magnetic places: each side maps its last stretch of the line to a real gap */
  const MAGNETS = {
    3: { kind: "puck", lo: { w: 0.25, cm: 1.5 }, hi: { w: 0.3, cm: 1.5 } },
    5: { kind: "rings", lo: { w: 1, cm: GAP }, hi: { w: 0.15, cm: 1.5 } },
    6: { kind: "steel", lo: { w: 0.2, cm: 1.5 }, hi: { w: 0.15, cm: 1.5 } },
    7: { kind: "steel", lo: { w: 0.15, cm: 1.5 } },
  };

  const corners = g.box.map((b) => {
    const out = [];
    for (let k = 0; k < 8; k++) out.push([k & 1 ? b[3] : b[0], k & 2 ? b[4] : b[1], k & 4 ? b[5] : b[2]]);
    return out;
  });
  /* The pose at s. Nothing ever goes through the desk: whatever a blend does,
     each half is lifted until its lowest corner clears the floor (`lift` says
     by how much, for the check). */
  function poseAt(s) {
    const i = Math.max(0, Math.min(EDGES.length - 1, Math.floor(s)));
    const out = EDGES[i](Math.max(0, Math.min(1, s - i)));
    out.lift = out.h.map((h, k) => {
      let low = Infinity;
      for (const c of corners[k]) low = Math.min(low, h.p[1] + qRot(h.q, c)[1]);
      if (low < 0) { h.p = [h.p[0], h.p[1] - low, h.p[2]]; return -low; }
      return 0;
    });
    return out;
  }
  return { poseAt, MAGNETS, count: PLACES.length, fold, WALL, FRIDGE };
}
