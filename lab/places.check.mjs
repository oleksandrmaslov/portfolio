// node lab/places.check.mjs — every frame of the path between the places is a real configuration
import assert from "node:assert/strict";
import { PLACES, makePath, qRot, TENT } from "./places.js";

// measured off the model (half-local case + caps, cm): the left half, and the right one mirrored
const L = [-6.4, 0, -4.69, 6.59, 0.82, 4.93], R = [-6.59, 0, -4.69, 6.4, 0.82, 4.93];
const G = { RX: 7.593, RZ: -0.121, outer: [6.4, 6.4], box: [L, R] };
const path = makePath(G);
const N = PLACES.length;

assert.equal(N, 8, "eight places");
assert.equal(new Set(PLACES.map((p) => p.id)).size, N, "unique ids");
for (const p of PLACES) if (p.screen) assert.ok(p.screen.title.length <= 9, `${p.id}: a narrated title fits its column, so it never starts a marquee`);

const add = (a, b) => a.map((v, i) => v + b[i]);
const obb = (h, b, shrink) => {
  const c = [(b[0] + b[3]) / 2, (b[1] + b[4]) / 2, (b[2] + b[5]) / 2];
  return { c: add(h.p, qRot(h.q, c)), ax: [[1, 0, 0], [0, 1, 0], [0, 0, 1]].map((a) => qRot(h.q, a)), e: [(b[3] - b[0]) / 2 - shrink, (b[4] - b[1]) / 2 - shrink, (b[5] - b[2]) / 2 - shrink] };
};
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
function overlap(A, B) {   // separating-axis test, 15 axes
  const d = A.c.map((v, i) => B.c[i] - v), axes = [...A.ax, ...B.ax];
  for (const a of A.ax) for (const b of B.ax) { const x = cross(a, b); if (Math.hypot(...x) > 1e-6) axes.push(x); }
  for (const n of axes) {
    const ra = A.e.reduce((s, e, i) => s + e * Math.abs(dot(A.ax[i], n)), 0), rb = B.e.reduce((s, e, i) => s + e * Math.abs(dot(B.ax[i], n)), 0);
    if (Math.abs(dot(d, n)) > ra + rb) return false;
  }
  return true;
}
const world = (h, v) => add(h.p, qRot(h.q, v));
const corners = (b) => Array.from({ length: 8 }, (_, k) => [k & 1 ? b[3] : b[0], k & 2 ? b[4] : b[1], k & 4 ? b[5] : b[2]]);

// pucks: where lab/wafer.js seats them (ring of the tent pose), sliding in from 20 cm behind
const tent = path.fold(TENT);
function inPuck(P, h, t) {
  const c = [tent[h].p[0], tent[h].p[1], tent[h].p[2] - 20 * (1 - t)];
  const dx = P[0] - c[0], dz = P[2] - c[2];
  if (Math.hypot(dx, dz) > 3) return false;
  const top = c[1] + dx * Math.tan(h === 0 ? TENT : -TENT) * (h === 0 ? 1 : 1);
  return P[1] > 0.02 && P[1] < top - 0.02;
}

let maxLift = 0, worst = "";
const du = 0.005;
for (let s = 0; s <= N - 1 + 1e-9; s += du) {
  const P = path.poseAt(Math.min(s, N - 1)), at = `s=${s.toFixed(3)}`;
  for (const h of P.h) assert.ok([...h.p, ...h.q].every(Number.isFinite), `${at}: finite pose`);
  P.lift.forEach((l) => { if (l > maxLift) { maxLift = l; worst = at; } });
  // the halves never pass through each other (boxes shrunk 0.4 mm: touching is allowed)
  assert.ok(!overlap(obb(P.h[0], L, 0.04), obb(P.h[1], R, 0.04)), `${at}: halves interpenetrate`);
  // nothing passes through a puck: sample both halves' backs
  if (P.stands > 0.001) for (let h = 0; h < 2; h++) for (let k = 0; k < 2; k++) {
    const b = [L, R][h];
    for (let x = b[0]; x <= b[3]; x += 0.4) for (let z = b[2]; z <= b[5]; z += 0.4) {
      const W = world(P.h[h], [x, 0, z]);
      assert.ok(!inPuck(W, k, P.stands), `${at}: half ${h} passes through puck ${k}`);
    }
  }
  // nothing goes behind the steel or into the fridge door
  for (let h = 0; h < 2; h++) for (const c of corners([L, R][h])) {
    const W = world(P.h[h], c);
    if (P.wall > 0) assert.ok(W[2] > -6 - 60 * (1 - P.wall) - 0.02 || W[1] > 30, `${at}: through the wall`);
    if (P.fridge > 0.99) assert.ok(W[2] > -8 - 0.02, `${at}: through the fridge door`);
  }
}
assert.ok(maxLift < 0.6, `the authored path stays above the desk; the clearance clamp lifts ${maxLift.toFixed(3)} cm at most (${worst})`);

// continuity: the edges meet at every place
for (let k = 1; k < N - 1; k++) {
  const a = path.poseAt(k - 1e-6), b = path.poseAt(k);
  for (let h = 0; h < 2; h++) {
    assert.ok(Math.hypot(...a.h[h].p.map((v, i) => v - b.h[h].p[i])) < 1e-3, `place ${k}: position continuous`);
    assert.ok(Math.abs(Math.abs(a.h[h].q.reduce((s, v, i) => s + v * b.h[h].q[i], 0)) - 1) < 1e-5, `place ${k}: rotation continuous`);
  }
}

// the poses each place promises
const at = (k) => path.poseAt(k);
assert.ok(at(0).h.every((h) => h.p[1] === 0), "desk: flat on the desk");
assert.ok(Math.abs(at(5).h[0].p[0]) < 1e-9 && Math.abs(at(5).h[1].p[0]) < 1e-9, "pocket: the rings meet");
assert.ok(at(3).stands === 1 && at(6).wall === 1 && at(7).fridge === 1, "each prop is out exactly at its place");
console.log(`places ok (clearance clamp ≤ ${maxLift.toFixed(3)} cm)`);
