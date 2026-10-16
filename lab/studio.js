/* ============================================================
   STUDIO — the study's stages and its tone curve in JS
   ------------------------------------------------------------
   Lab surface (excluded from deploy). The room, the GLSL curve,
   the presets and the name table live on the site, in
   app/projects/rendering/studio.js; the gallery (lab/materials.html)
   imports that file directly. This module keeps only what lab/wafer.js
   needs on top of it:

     · the stages        light studio, the study's dark, and the
                         site's void (--void in tokens.css)
     · the tone curve    PBR Neutral in JS, with the inverse that
                         lands a CSS colour exactly
     · the environment   the site's room rendered the study's way

   The caller hands in THREE (r160), so this loads in a page and in
   node (lab/studio.check.mjs).
   ============================================================ */

import { TONE, NEUTRAL_GLSL, ROOM, studioRoom } from "../app/projects/rendering/studio.js";
export { TONE, NEUTRAL_GLSL };

/* ---------------- stages ---------------- */

/* The walls, floor and fill the embedded study lifts when it sits on the
   dark page: black parts then have something to reflect. lab/wafer.js uses
   it for its embed variant, the void stage below uses it for the site. */
export const DARK_PAGE = { wall: 0.05, floor: 0.1, fill: 1.4, side: 3.0 };

const DARK = {
  bg: "#0a0b0d",
  env: { wall: 0.006, floor: 0.012, top: 2.0, back: 7.0, key: 8.0, rimL: 16.0, rimR: 20.0, fill: 0.35 },
  sun: 0.9, shadow: 0.55, contact: 0.9,
  mat: { env: 1, floor: 0 },
};

/* env: linear radiance of the room's walls, floor and softboxes.
   mat: what a preset does on this stage —
        env    envMapIntensity of every preset
        floor  least linear luma of a base colour (the void swallows black) */
export const STAGES = {
  light: {
    bg: "#f5f5f7",
    env: { wall: 0.3, floor: 0.85, top: 2.0, back: 5.0, key: 6.0, rimL: 9.0, rimR: 12.0, fill: 1.2 },
    sun: 1.0, shadow: 0.42, contact: 1.0,
    mat: { env: 1, floor: 0 },
  },
  dark: DARK,
  void: { ...DARK, bg: "#04060d", env: ROOM, mat: { env: 1, floor: 0 } },   // the site's room, by reference
};

/* ---------------- tone: PBR Neutral ---------------- */

/* PBR Neutral (Khronos) with an adjustable toe. The same curve runs in the
   site's NEUTRAL_GLSL and here, so the background colour can be inverted
   through it and land exactly on the stage's CSS colour. */
export function neutral(c, toe = TONE.toe) {
  const x = Math.min(c[0], c[1], c[2]);
  const off = toe * (x < 0.08 ? x - 6.25 * x * x : 0.04);
  c = c.map((v) => v - off);
  const peak = Math.max(c[0], c[1], c[2]);
  if (peak < 0.76) return c;
  const d = 0.24, np = 1 - (d * d) / (peak + d - 0.76);
  c = c.map((v) => (v * np) / peak);
  const g = 1 - 1 / (0.15 * (peak - np) + 1);
  return c.map((v) => v + (np - v) * g);
}

export function inverseNeutral(THREE, hex, exposure = TONE.exposure, toe = TONE.toe) {
  const t = new THREE.Color(hex), target = [t.r, t.g, t.b];
  let x;
  if (Math.max(...target) < 0.76) {
    // below the shoulder the curve is exact to invert: every channel loses the
    // offset its darkest channel sets, and that one follows a quadratic toe
    const lo = Math.min(...target);
    let m = lo + 0.04 * toe;
    if (lo < 0.04 * toe + (1 - toe) * 0.08) {
      const T = Math.max(toe, 1e-6);
      m = (-(1 - T) + Math.sqrt((1 - T) ** 2 + 25 * T * lo)) / (12.5 * T);
    }
    const off = toe * (m < 0.08 ? m - 6.25 * m * m : 0.04);
    x = target.map((v) => (v + off) / exposure);
  } else {
    // on the shoulder it compresses by the brightest channel: damped fixed point
    x = target.slice();
    for (let k = 0; k < 80; k++) {
      const y = neutral(x.map((v) => v * exposure), toe);
      x = x.map((v, i) => v * Math.sqrt(target[i] / Math.max(y[i], 1e-7)));
    }
  }
  return new THREE.Color().setRGB(x[0], x[1], x[2]);
}

/* ---------------- the room ---------------- */

/* The site's room through a plain PMREM pass, as the study always rendered
   it (the site goes through a half-float cube camera first). `e` is a
   stage's env. */
export function studioEnvironment(THREE, renderer, e) {
  const pm = new THREE.PMREMGenerator(renderer);
  const t = pm.fromScene(studioRoom(THREE, e), 0).texture;
  pm.dispose();
  return t;
}
