// node lab/studio.check.mjs — the study's tone curve and stages against the site's studio
// The presets, the name table and the shipped models are checked in CI (tools/landing-runtime/studio.test.cjs).
// What is left here is what only the lab has: the JS curve, its inverse, and the stages built on the site's room.
import assert from "node:assert/strict";
import { STAGES, DARK_PAGE, TONE, NEUTRAL_GLSL, neutral, inverseNeutral } from "./studio.js";
import { ROOM, NEUTRAL_GLSL as SITE_GLSL } from "../app/projects/rendering/studio.js";

let n = 0;
const ok = (cond, msg) => { assert.ok(cond, msg); n++; };
const near = (a, b, eps, msg) => ok(Math.abs(a - b) <= eps, `${msg} (${a} vs ${b})`);

/* ---------- the stub: only what inverseNeutral touches ---------- */
const lin = (c) => (c < 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);   // sRGB hex -> linear, as THREE.Color does
class Color {
  constructor(hex) { this.r = this.g = this.b = 1; if (hex !== undefined) this.set(hex); }
  set(hex) {
    const v = parseInt(hex.slice(1), 16);
    return this.setRGB(lin(((v >> 16) & 255) / 255), lin(((v >> 8) & 255) / 255), lin((v & 255) / 255));
  }
  setRGB(r, g, b) { this.r = r; this.g = g; this.b = b; return this; }
  toArray() { return [this.r, this.g, this.b]; }
}
const THREE = { Color };

/* ---------- tone: PBR Neutral ---------- */
near(neutral([0.18, 0.18, 0.18])[1], 0.14, 1e-9, "mid grey 0.18 lands on 0.14: the curve's toe is the spec's");
near(neutral([1, 1, 1])[0], 0.8690909, 1e-6, "white 1.0 lands on the shoulder's 0.869: product white never clips");
near(neutral([0, 0, 0])[0], 0, 1e-9, "black stays black");
ok(neutral([6, 2, 0.5]).every((v) => v <= 1), "a hot highlight compresses under 1");
const ramp = [0.05, 0.2, 0.5, 0.9, 2, 8].map((v) => neutral([v, v, v])[0]);
ok(ramp.every((v, i) => !i || v > ramp[i - 1]), "monotonic: no value is ever darker than a darker input");
ok(TONE.exposure === 1 && TONE.toe === 1, "spec exposure and toe: a stage that wants other values says so, it does not edit the curve");

// the site's GLSL is this curve: same constants, same shoulder
const lits = (s) => new Set([...s.matchAll(/\d+\.\d+/g)].map((m) => +m[0]).filter((v) => v !== 1));
const glsl = [...lits(SITE_GLSL)].sort(), js = [...lits(neutral.toString())].sort();
ok(NEUTRAL_GLSL === SITE_GLSL, "the study re-exports the site's GLSL, not a copy");
ok(glsl.join() === js.join() && glsl.length === 6, `the site's GLSL and the JS curve share their constants (${glsl})`);

/* ---------- stages ---------- */
ok(Object.keys(STAGES).join() === "light,dark,void", "three stages: the light studio, the study's dark, the site's void");
ok(STAGES.void.bg === "#04060d", "the void is the site's --void (tokens.css)");
assert.deepStrictEqual(STAGES.void.env, ROOM, "the void stage lights with the site's room");
assert.deepStrictEqual(STAGES.void.env, { ...STAGES.dark.env, ...DARK_PAGE }, "the site's room is the study's dark one lifted, so black parts have something to reflect");
n += 2;

for (const [name, stage] of Object.entries(STAGES)) {
  const bg = inverseNeutral(THREE, stage.bg), want = new Color(stage.bg).toArray();
  const back = neutral(bg.toArray().map((v) => v * TONE.exposure));
  ok(back.every((v, i) => Math.abs(v - want[i]) < 1e-3), `${name}: the stage colour ${stage.bg} survives the tone curve`);
}

console.log(`studio ok · ${n} checks`);
