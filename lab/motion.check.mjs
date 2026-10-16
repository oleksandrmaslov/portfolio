// node lab/motion.check.mjs — the spring, projection and magnet maths every transition relies on
import assert from "node:assert/strict";
import { Spring, Track, MAGNET, project, rubberband, magnetPull, SPRINGS } from "./motion.js";

const run = (s, seconds) => { let peak = -Infinity; for (let t = 0; t < seconds; t += 1 / 120) { s.step(1 / 120); peak = Math.max(peak, s.value); } return peak; };

const crit = new Spring(0, SPRINGS.move).to(1);
assert.ok(run(crit, 2) <= 1 + 1e-6, "critically damped never overshoots");
assert.equal(crit.value, 1, "and settles exactly on target");

const s = new Spring(0, SPRINGS.move).to(1);
for (let i = 0; i < 12; i++) s.step(1 / 60);
const v = s.velocity;
s.to(0);
assert.equal(s.velocity, v, "re-targeting keeps the live velocity: no seam");

assert.ok(Math.abs(project(1000) - 499) < 1, "Apple's projection: 1000 px/s at 0.998 rests ~499 px out");
assert.ok(rubberband(100, 300) < 100 && rubberband(200, 300) > rubberband(100, 300), "rubber band resists, but keeps following");
console.log("motion ok");

// ---- the track: places 0..4, a magnet at 2 (window 1 place = 5 cm each side) and at 4 (approach only)
assert.ok(magnetPull(0.4) > 0.99 && magnetPull(MAGNET.capture) < 0.11, "short range: 10 % of the pull is left at the capture point");
const MAGS = { 2: { lo: { w: 1, cm: 5 }, hi: { w: 1, cm: 5 } }, 4: { lo: { w: 0.3, cm: 1.5 } } };
const caught = [], broke = [], passed = [];
const track = () => new Track(5, MAGS, { onCatch: (k, v) => caught.push([k, v]), onBreak: (k) => broke.push(k), onPass: (k) => passed.push(k) });
const until = (t, done, max = 4) => { let time = 0; while (time < max && !done()) { t.step(1 / 120); time += 1 / 120; } return time; };

// released from rest at the capture point, the magnet alone closes it: fast, accelerating, a dead stop
let t = track().snap(0);
t.locked = -1; t.s = 2 - MAGNET.capture / 5; t.target = 2;
let lastV = 0, accelerating = true;
const time = until(t, () => { if (t.locked === 2) return true; if (t.v < lastV - 1e-9) accelerating = false; lastV = t.v; return false; });
assert.ok(time > 0.12 && time < 0.22, `the magnet closes 1.2 cm in ~165 ms (took ${(time * 1000) | 0} ms)`);
assert.ok(accelerating, "and is still accelerating at contact: no ease-out");
assert.ok(t.s === 2 && t.v === 0 && caught.at(-1)[1] > 20, "the catch is a dead stop that reports its closing speed");

// a spring trip into a magnetic place ends in a catch, not a settle
t = track().snap(0); t.go(2);
until(t, () => t.locked === 2);
assert.ok(t.locked === 2 && caught.length === 2, "travelling to a magnet ends in its catch");

// a long trip flies past a magnet with a tick and no catch
t = track().snap(0); t.go(4);
until(t, () => t.resting);
assert.ok(passed.includes(2) && caught.at(-1)[0] === 4 && t.locked === 4, "passing a magnet ticks; the destination's own magnet still catches");

// a hand against a lock strains it, then breaks away; the magnet does not re-grab as it leaves
t = track().snap(2);
t.hold(2 - 0.2); until(t, () => false, 0.2);
assert.ok(t.locked === 2 && t.strain < 0 && t.value < 2, "a small pull only strains the hold");
t.hold(2 - 0.5); until(t, () => false, 0.4);
assert.ok(t.locked === -1 && broke.at(-1) === 2 && Math.abs(t.s - 1.5) < 0.01, "a real pull breaks away and follows the hand");

// a hand sweeping on through a magnet it just caught (the line, scrubbed): one catch, one break, then it follows
t = track().snap(0); t.locked = -1;
const n0 = caught.length, b0 = broke.length;
for (let i = 1; i <= 11; i++) { t.hold(i / 3); for (let f = 0; f < 3; f++) t.step(0.05); }
assert.ok(caught.length - n0 <= 2 && broke.length - b0 <= 2 && t.locked === -1 && Math.abs(t.s - 11 / 3) < 0.01, "a held magnet lets a firm hand through: no break/catch loop");

// a hand bringing it into reach loses it to the magnet
t = track().snap(1); t.locked = -1;
t.hold(2 - 0.2); until(t, () => t.locked === 2, 1);
assert.ok(t.locked === 2, "the magnet takes it out of the hand");
t.release(0);
until(t, () => t.resting);
assert.ok(t.s === 2 && t.strain === 0, "letting go of a held lock relaxes the strain");

// release: the velocity's sign decides; slow releases go to the nearest place
t = track().snap(0); t.locked = -1; t.hold(0.3); until(t, () => false, 0.3);
t.release(0.6); assert.equal(t.target, 1, "a slow push forward commits forward");
t = track().snap(0); t.locked = -1; t.hold(0.3); until(t, () => false, 0.3);
t.release(0); assert.equal(t.target, 0, "held still and let go: back to the nearest place");

// re-targeting mid-flight keeps the velocity
t = track().snap(0); t.go(1); for (let i = 0; i < 20; i++) t.step(1 / 120);
const v1 = t.v; t.go(0); assert.equal(t.v, v1, "a new destination bends the motion, it never jumps");
console.log("track ok");
