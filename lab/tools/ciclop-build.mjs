#!/usr/bin/env node
/*
 * Ci-Clop hero model, assembled and hollowed from the user's SketchUp export.
 *
 *   HOLLOW_TOOLS=<dir> node lab/tools/ciclop-build.mjs [--obj FILE] [--out FILE] [--parts [--parts-out FILE]] [--ref GLB]
 *                                                       [--swap-leds] [--dirs N (4096)] [--no-pack]
 *   <dir>/node_modules must hold manifold-3d and gltfpack (npm i --prefix <dir> manifold-3d gltfpack; `three` too for --ref).
 *   About three minutes: the ray test is the long part. --parts also writes lab/models/ci-clop-mark.parts.glb (every part closed,
 *   assembled, NOT hollowed or unioned, one node each, for an exploded view); --ref registers the sealed site model against the export.
 *
 * Source (read-only): Ci-clop-dirty/Ci-clop-dirty.obj, an ImageToStl conversion of the SketchUp model. Inches (x 25.4 = mm), 11,842
 * triangles in 3,997 unwelded two-triangle fragments, a generic linen texture on 142 of them (dropped), and no thickness anywhere on the
 * lens pieces (open sheets). After welding at 1e-4 mm it is six connected pieces:
 *     body    26.6 x 40 x 32.2 mm, open at the top (rim z = 32.185), thin walls. A flat 20 x 38 bed pad at z = 0 with a 1 mm 45-degree chamfer
 *             round it (the elephant-foot chamfer: that is the face on the print bed), two stepped round holes through it (bores 5.6 and
 *             8.2 mm, 1 mm countersinks) and an 8 x 5 USB slot. A raised hood on the -x face with a stadium recess and two funnel-and-bore
 *             holes. Six small rounded pips on the +x wall. The belt clip (mat3, 948 triangles) is its own shell against that wall; it was
 *             welded to the body by a single vertex.
 *     lid     22 x 40 x 5 mm plug lid with a snap barb, "EnergyFor Ukraine.de" engraved on the outer face. It floated 8.4 mm above the box.
 *     4 pieces: two lens stacks (a dome cap and a holder cup each; 7.6 and 5.0 mm) lying 10-15 mm below the bed pad.
 * There is NO trident in the export (the gold mat3 is the belt clip, the white mat2 is the pip base membranes and a few sliver faces) and no LEDs.
 * Print axis: the box's z (the 32 mm axis), bed = the LED/lens pad face. The photographs agree: with that face up the layer lines run along the
 * box's long side. (The 40 mm axis is not the print axis.)
 * The sealed models/ci-clop-mark.glb is the previous revision of the same box (two 9 mm spheres in the front holes, two plain cylinders in the
 * bed holes); its lid is the export's lid triangle for triangle (rms 1.2 um after registration), --ref reproduces that.
 *
 * Steps:
 *   1 weld, split, identify the parts by their geometry (not by index).
 *   2 REPAIR  back-to-back coincident faces (12 pairs) and the pip base membranes (151 white faces lying in the +x wall plane) go: they are
 *             what made 178 edges carry three or four faces (146 once the pairs were gone). Zero-area T-junction fillers are split away, the open loops (nine in the body, one or
 *             two in each lens sheet) are closed (ear clipping, a centroid fan for convex flat ones), winding made consistent and outward.
 *             Every part ends as exactly one closed 2-manifold shell, checked.
 *   3 ASSEMBLE rigid translations only, nothing reshaped.
 *             Lid: the plug's width-versus-height profile (x and y extent of its section at every height) is slid over the width profile of the
 *             body mouth until they coincide. They coincide to 0.00 mm: the plug is the negative of the mouth, barb and groove included.
 *             The flange underside then sits on the rim within a micron, and x/y within 0.00 mm. Nothing was tuned.
 *             Bed lens stacks: the cap's outer apex goes flush with the bed face (the big cap is 2.0 mm, exactly the floor thickness, so its
 *             mouth is flush with the inside face too), x/y onto the bore axis. Which cap goes in which bore falls out of the diameters: each
 *             cap clears its own bore by 0.30 mm; swapped, the big cap does not fit the small bore at all.
 *             Front LEDs: a 5 mm LED dome in each funnel hole, apex 0.3 mm behind the front plane, collar in the 0.6 mm bore. Red is the LED
 *             nearer the USB slot (charge/status), white the far one: an assumption, --swap-leds flips it.
 *             Penetration is measured between every pair that touches (vertices and triangle centres, ray parity + point-triangle distance).
 *   4 HOLLOW  boolean union with manifold-3d, a 4th vertex property (_PRINTZ) carried through the booleans. The lid and the clip are grown
 *             0.01 mm first (they only touch their neighbours); two hidden seat rings close the 0.3 mm print clearance round each bed cap, and
 *             the LEDs carry a hidden collar, both 0.03 mm into each neighbour, so only the visible groove stays. Enclosed void shells are dropped
 *             (closed shells of negative volume, found on welded positions), then every triangle that no ray from outside can reach is dropped:
 *             four sample points per triangle, 4,096 Fibonacci directions, BVH any-hit, and a second pass of 8,192 directions for deep openings.
 *             The holder cups are not in the union (they sit inside the caps' bowls), but they are occluders and candidates: what a gap or the
 *             USB slot shows of them is kept. Real openings stay open: USB slot, gaps round the lenses, countersinks, funnels, the +x screw
 *             hole, the strap slot.
 *   5 WRITE   one mesh, one primitive per material (pla-olive, lens-clear, led-white, led-red), _PRINTZ per vertex (metres, height along the
 *             ORIGINAL part's print axis, bed = 0: body and clip along the box's z, lid along its own z), led-white / led-red empties facing out
 *             of the front, metres, Y up, recentred, packed with gltfpack -c -kn -km -ke -kv -vpf.
 *             gltfpack 1.3 drops every custom attribute except `_ID` (tried: -kv, -c, other names, other widths). The height rides through the
 *             packer as `_ID` and is renamed `_PRINTZ` in the JSON chunk afterwards (renameAttribute); the binary is untouched.
 *
 * Frame of the written model: +Z is the front (the face with the two LEDs), +Y is the bed pad (the face that shows on top in the photographs,
 * the one with the lenses and the USB slot), +X is the USB end, -Y is the lid, -Z the belt clip. The source frame is (x, y, z) with z the
 * print axis and the LEDs on -x; model = (y, -z, -x), a proper rotation.
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '../..');
const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 ? (argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : true) : d; };
const TOOLS = process.env.HOLLOW_TOOLS || path.join(os.tmpdir(), 'hollow/tools');
const OBJ_FILE = arg('obj', path.join(REPO, 'Ci-clop-dirty/Ci-clop-dirty.obj'));
const OUT = arg('out', path.join(REPO, 'lab/models/ci-clop-mark.glb'));
const WANT_PARTS = !!arg('parts', false);
const PARTS_OUT = typeof arg('parts-out', false) === 'string' ? arg('parts-out') : OUT.replace(/\.glb$/, '.parts.glb');
const REF = typeof arg('ref', false) === 'string' ? arg('ref') : null;
const GLTFPACK = process.env.GLTFPACK || path.join(TOOLS, 'node_modules/.bin/gltfpack');
const SWAP_LEDS = !!arg('swap-leds', false);
const DIRS = +arg('dirs', 4096);
const NOPACK = !!arg('no-pack', false);
const MM = 1e-3;
const log = (...a) => console.log(...a);

// ---------------------------------------------------------------- finish constants
// Olive PLA, white-balanced: field-use.webp has paper labels in frame (204,208,209 / 223,225,225, neutral) next to the olive print
// (141,150,124 lit, 119,128,102 in shade): divided by the paper that is G-normalised (0.95, 1, 0.80). previous-light.webp (warm, no reference)
// reads (120,117,87) on the same filament, within 6 levels of the albedo chosen here: a mid satin olive, not either exposure.
const SRGB = { olive: [114, 118, 88], lens: [206, 210, 208], white: [236, 233, 222], red: [214, 74, 64] };
const lin = (c) => c.map((v) => { v /= 255; return +(v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4).toFixed(5); });
const MATERIALS = [
  { name: 'pla-olive', pbrMetallicRoughness: { baseColorFactor: [...lin(SRGB.olive), 1], metallicFactor: 0, roughnessFactor: 0.55 } },
  { name: 'lens-clear', pbrMetallicRoughness: { baseColorFactor: [...lin(SRGB.lens), 1], metallicFactor: 0, roughnessFactor: 0.14 } },
  { name: 'led-white', pbrMetallicRoughness: { baseColorFactor: [...lin(SRGB.white), 1], metallicFactor: 0, roughnessFactor: 0.3 }, emissiveFactor: [1, 0.96, 0.86] },
  { name: 'led-red', pbrMetallicRoughness: { baseColorFactor: [...lin(SRGB.red), 1], metallicFactor: 0, roughnessFactor: 0.3 }, emissiveFactor: [1, 0.06, 0.04] },
];
const matIndex = Object.fromEntries(MATERIALS.map((m, i) => [m.name, i]));

// ---------------------------------------------------------------- tolerances and design numbers (all mm)
// Kept at 0.01 (the Venovisor builder uses 0): the lid and clip touch the body at exactly 0 um, so a union needs the overlap to close the seams. The cost is ~10-20 um of lid face proud of the reference.
// The hidden seat rings that close the 0.3 mm lens clearance are an intended change (a groove ~30 mm deep to the lid's inside face is not a visible surface of a real print).
const GROW = 0.01;           // the lid and the clip only touch their neighbours: they are grown this much before the union so the seams close
const SEAT_Z = [1.5, 1.9];   // the bed-cap seat ring, z span; the visible countersink groove above it stays open
const SEAT_OVERLAP = 0.03;   // the ring and the LED collar reach this far into each neighbour (the brief allows 0.05; the 28-gon lathe against the 32-gon bore adds up to 0.013)
const LED_R = 2.5;           // 5 mm LED dome radius
const LED_RECESS = 0.3;      // the dome apex sits this far behind the front plane
const SEG = 28;              // lathe segments

// ---------------------------------------------------------------- mesh helpers (copied from lab/tools/venovisor-build.mjs, which cannot be imported: it parses its own CLI on load)
// ---------------------------------------------------------------- small vector helpers
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const len = (a) => Math.hypot(a[0], a[1], a[2]);
const P = (pos, i) => [pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]];
const mulMV = (R, v) => [0, 1, 2].map((i) => R[i * 3] * v[0] + R[i * 3 + 1] * v[1] + R[i * 3 + 2] * v[2]);
const mulMM = (A, B) => { const C = []; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) C.push(A[i * 3] * B[j] + A[i * 3 + 1] * B[3 + j] + A[i * 3 + 2] * B[6 + j]); return C; };
// ---------------------------------------------------------------- mesh cleanup
function weld(pos, tol = 1e-4) {
  const q = 1 / tol; const map = new Map(); const out = []; const idx = new Uint32Array(pos.length / 3);
  for (let i = 0; i < idx.length; i++) {
    const key = Math.round(pos[i * 3] * q) + ',' + Math.round(pos[i * 3 + 1] * q) + ',' + Math.round(pos[i * 3 + 2] * q);
    let v = map.get(key); if (v === undefined) { v = out.length / 3; map.set(key, v); out.push(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]); }
    idx[i] = v;
  }
  return { pos: Float64Array.from(out), idx };
}
const triArea = (pos, a, b, c) => len(cross(sub(P(pos, b), P(pos, a)), sub(P(pos, c), P(pos, a)))) / 2;
const faceN = (pos, a, b, c) => { const n = cross(sub(P(pos, b), P(pos, a)), sub(P(pos, c), P(pos, a))); const l = len(n); return l > 0 ? n.map((v) => v / l) : [0, 0, 0]; };

/** Drop index-degenerate and duplicate triangles. Zero-AREA slivers are kept here and repaired later (they carry topology). */
function dropJunk(pos, idx) {
  const out = []; const seen = new Set(); let junk = 0;
  for (let t = 0; t < idx.length; t += 3) {
    const [a, b, c] = [idx[t], idx[t + 1], idx[t + 2]];
    const key = [a, b, c].sort((x, y) => x - y).join(',');
    if (a === b || b === c || a === c || seen.has(key)) { junk++; continue; }
    seen.add(key); out.push(a, b, c);
  }
  return { idx: Uint32Array.from(out), junk };
}

/** Make winding consistent per shell by flood fill, then outward by signed volume. */
function orient(pos, idx) {
  const nT = idx.length / 3; const edge = new Map();
  for (let t = 0; t < nT; t++) for (let k = 0; k < 3; k++) { const a = idx[t * 3 + k], b = idx[t * 3 + (k + 1) % 3]; const key = a < b ? a + '_' + b : b + '_' + a; (edge.get(key) || edge.set(key, []).get(key)).push(t); }
  const flip = new Int8Array(nT).fill(-1); const shell = new Int32Array(nT); let shells = 0;
  const hasDir = (t, a, b) => { for (let k = 0; k < 3; k++) if (idx[t * 3 + k] === a && idx[t * 3 + (k + 1) % 3] === b) return true; return false; };
  for (let s = 0; s < nT; s++) {
    if (flip[s] !== -1) continue; flip[s] = 0; shell[s] = shells; const stack = [s];
    while (stack.length) {
      const t = stack.pop();
      for (let k = 0; k < 3; k++) {
        let a = idx[t * 3 + k], b = idx[t * 3 + (k + 1) % 3]; if (flip[t]) [a, b] = [b, a];
        for (const u of edge.get(a < b ? a + '_' + b : b + '_' + a)) if (u !== t && flip[u] === -1) { flip[u] = hasDir(u, a, b) ? 1 : 0; shell[u] = shells; stack.push(u); }
      }
    }
    shells++;
  }
  const out = new Uint32Array(idx.length); let flipped = 0;
  for (let t = 0; t < nT; t++) { const [a, b, c] = [idx[t * 3], idx[t * 3 + 1], idx[t * 3 + 2]]; if (flip[t]) { out.set([a, c, b], t * 3); flipped++; } else out.set([a, b, c], t * 3); }
  const vol = new Float64Array(shells);
  for (let t = 0; t < nT; t++) vol[shell[t]] += dot(P(pos, out[t * 3]), cross(P(pos, out[t * 3 + 1]), P(pos, out[t * 3 + 2]))) / 6;
  for (let t = 0; t < nT; t++) if (vol[shell[t]] < 0) { const b = out[t * 3 + 1]; out[t * 3 + 1] = out[t * 3 + 2]; out[t * 3 + 2] = b; }
  return { idx: out, shells, flipped, volumeMm3: Array.from(vol).map(Math.abs) };
}

/**
 * A zero-area triangle (a,b,c) with c on segment ab is a T-junction filler. Delete it and split the triangle across ab at c.
 * Chains of them occur (collinear vertices on one line), so take a sliver whose neighbour is a real triangle first: the split then
 * never creates another sliver and the chain unravels from its end.
 */
function repairSlivers(pos, idx) {
  let tris = []; for (let t = 0; t < idx.length; t += 3) tris.push([idx[t], idx[t + 1], idx[t + 2]]);
  // thinness = 2*area / longest edge^2 (sine of the smallest angle, roughly). The CAD slivers sit at 1e-9 and below; the thinnest honest
  // triangles in these meshes sit above 1e-5, and splitting those must not count as a sliver or the repair would chase its own tail.
  const thin = ([a, b, c]) => { const L = Math.max(len(sub(P(pos, a), P(pos, b))), len(sub(P(pos, b), P(pos, c))), len(sub(P(pos, c), P(pos, a)))); return 2 * triArea(pos, a, b, c) / (L * L); };
  const sliver = (t) => thin(t) < 1e-7; let repaired = 0;
  const across = (si) => { // long edge p->q of sliver si, middle vertex m, and the neighbour holding q->p
    const s = tris[si]; const L = [0, 1, 2].map((k) => len(sub(P(pos, s[k]), P(pos, s[(k + 1) % 3])))); const k = L.indexOf(Math.max(...L));
    const p = s[k], q = s[(k + 1) % 3], m = s[(k + 2) % 3];
    if (Math.abs(L[k] - L[(k + 1) % 3] - L[(k + 2) % 3]) > 1e-6) throw new Error('non-collinear zero-area triangle');
    const ni = tris.findIndex((tr, i) => i !== si && [0, 1, 2].some((j) => tr[j] === q && tr[(j + 1) % 3] === p));
    if (ni < 0) throw new Error('sliver without a neighbour across its long edge');
    const tr = tris[ni]; const j = [0, 1, 2].find((j) => tr[j] === q && tr[(j + 1) % 3] === p);
    return { ni, m, x: tr[j], y: tr[(j + 1) % 3], z: tr[(j + 2) % 3] };
  };
  for (let guard = 0; ; guard++) {
    if (guard > 200) throw new Error('sliver repair did not converge');
    const open = tris.map((t, i) => i).filter((i) => sliver(tris[i])); if (!open.length) break;
    const si = open.find((i) => !sliver(tris[across(i).ni])); if (si === undefined) throw new Error('sliver chain with no real triangle at its end');
    const { ni, m, x, y, z } = across(si);
    tris = tris.filter((_, i) => i !== si && i !== ni); tris.push([x, m, z], [m, y, z]); repaired++;
  }
  return { idx: Uint32Array.from(tris.flat()), repaired };
}

function edgeStats(idx) {
  const m = new Map(); for (let t = 0; t < idx.length; t += 3) for (let k = 0; k < 3; k++) { const a = idx[t + k], b = idx[t + (k + 1) % 3]; const key = a < b ? a + '_' + b : b + '_' + a; m.set(key, (m.get(key) || 0) + 1); }
  let open = 0, nonManifold = 0; for (const c of m.values()) { if (c === 1) open++; else if (c > 2) nonManifold++; }
  return { open, nonManifold };
}

/** Angle-weighted vertex normals; faces within `creaseDeg` of each other (sharing an edge at the vertex) smooth together, others split the vertex. */
function creasedNormals(pos, idx, creaseDeg = 30) {
  const nT = idx.length / 3; const cosC = Math.cos(creaseDeg * Math.PI / 180); const fn = []; for (let t = 0; t < nT; t++) fn.push(faceN(pos, idx[t * 3], idx[t * 3 + 1], idx[t * 3 + 2]));
  // The STLs are float32, so a needle triangle (thinness below 1e-4) has a normal that is mostly rounding noise, and an angle-weighted
  // vertex normal would inherit it (a collinear middle vertex has a 180 deg corner). Borrow the normal of the largest sound neighbour instead.
  const area = (t) => triArea(pos, idx[t * 3], idx[t * 3 + 1], idx[t * 3 + 2]);
  const thinness = (t) => { const [a, b, c] = [P(pos, idx[t * 3]), P(pos, idx[t * 3 + 1]), P(pos, idx[t * 3 + 2])]; const L = Math.max(len(sub(a, b)), len(sub(b, c)), len(sub(c, a))); return 2 * area(t) / (L * L); };
  const byEdge = new Map(); for (let t = 0; t < nT; t++) for (let k = 0; k < 3; k++) { const a = idx[t * 3 + k], b = idx[t * 3 + (k + 1) % 3]; const key = a < b ? a + '_' + b : b + '_' + a; (byEdge.get(key) || byEdge.set(key, []).get(key)).push(t); }
  const needle = new Set(); for (let t = 0; t < nT; t++) if (thinness(t) < 1e-4) needle.add(t);
  for (const t of needle) {
    let best = -1; for (let k = 0; k < 3; k++) { const a = idx[t * 3 + k], b = idx[t * 3 + (k + 1) % 3]; for (const u of byEdge.get(a < b ? a + '_' + b : b + '_' + a)) if (u !== t && !needle.has(u) && (best < 0 || area(u) > area(best))) best = u; }
    if (best >= 0) fn[t] = fn[best]; // a needle between two needles keeps its own (rare) normal
  }
  const inc = new Map(); for (let t = 0; t < nT; t++) for (let k = 0; k < 3; k++) (inc.get(idx[t * 3 + k]) || inc.set(idx[t * 3 + k], []).get(idx[t * 3 + k])).push([t, k]);
  const oPos = [], oNrm = [], oSrc = [], oIdx = new Uint32Array(idx.length);
  for (const [v, list] of inc) {
    const par = list.map((_, i) => i); const find = (a) => { while (par[a] !== a) a = par[a] = par[par[a]]; return a; };
    const byNeighbour = new Map(); list.forEach(([t, k], i) => { for (const w of [idx[t * 3 + (k + 1) % 3], idx[t * 3 + (k + 2) % 3]]) (byNeighbour.get(w) || byNeighbour.set(w, []).get(w)).push(i); });
    for (const arr of byNeighbour.values()) for (let x = 0; x < arr.length; x++) for (let y = x + 1; y < arr.length; y++) if (dot(fn[list[arr[x]][0]], fn[list[arr[y]][0]]) >= cosC) par[find(arr[x])] = find(arr[y]);
    const groups = new Map(); list.forEach((_, i) => (groups.get(find(i)) || groups.set(find(i), []).get(find(i))).push(i));
    for (const members of groups.values()) {
      const n = [0, 0, 0];
      for (const i of members) {
        const [t, k] = list[i]; const a = P(pos, idx[t * 3 + k]), b = P(pos, idx[t * 3 + (k + 1) % 3]), c = P(pos, idx[t * 3 + (k + 2) % 3]);
        const e1 = sub(b, a), e2 = sub(c, a); const w = Math.acos(Math.max(-1, Math.min(1, dot(e1, e2) / (len(e1) * len(e2))))); for (let d = 0; d < 3; d++) n[d] += fn[t][d] * w;
      }
      const l = len(n) || 1; const nv = oPos.length / 3; oPos.push(pos[v * 3], pos[v * 3 + 1], pos[v * 3 + 2]); oNrm.push(n[0] / l, n[1] / l, n[2] / l); oSrc.push(v);
      for (const i of members) { const [t, k] = list[i]; oIdx[t * 3 + k] = nv; }
    }
  }
  return { pos: Float64Array.from(oPos), nrm: Float64Array.from(oNrm), idx: oIdx, src: Uint32Array.from(oSrc) };   // src[o] = the input vertex output vertex o was split from (carries per-vertex attributes)
}

// ---------------------------------------------------------------- hole closing
/** Close every open boundary loop with new triangles (no new vertices except a centroid for convex planar loops). Winding follows the neighbours. */
function closeHoles(pos, idx) {
  const dirs = new Map(); // a_b -> exists (directed)
  for (let t = 0; t < idx.length; t += 3) for (let k = 0; k < 3; k++) dirs.set(idx[t + k] + '_' + idx[t + (k + 1) % 3], true);
  const next = new Map(); // boundary directed edges a->b (no b->a)
  for (const key of dirs.keys()) { const [a, b] = key.split('_').map(Number); if (!dirs.has(b + '_' + a)) (next.get(a) || next.set(a, []).get(a)).push(b); }
  const used = new Set(); const loops = [];
  for (const [a0, outs] of next) for (const b0 of outs) {
    if (used.has(a0 + '_' + b0)) continue;
    const loop = [a0]; let a = a0, b = b0; used.add(a + '_' + b);
    while (b !== a0) { loop.push(b); const cand = (next.get(b) || []).filter((c) => !used.has(b + '_' + c)); if (!cand.length) break; a = b; b = cand[0]; used.add(a + '_' + b); }
    // split pinched loops at repeated vertices
    const stack = [], at = new Map();
    for (const v of loop) { if (at.has(v)) { const cyc = stack.splice(at.get(v)); cyc.forEach((x) => at.delete(x)); loops.push(cyc); } at.set(v, stack.length); stack.push(v); }
    if (stack.length) loops.push(stack);
  }
  const add = []; const outPos = Array.from(pos); let filled = 0, fans = 0, ears = 0;
  for (const lp of loops) {
    if (lp.length < 3) continue;
    const poly = lp.slice().reverse(); // fill triangles use the reverse direction of the boundary edges
    const pts = poly.map((i) => P(pos, i));
    let n = [0, 0, 0]; for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; n[0] += (a[1] - b[1]) * (a[2] + b[2]); n[1] += (a[2] - b[2]) * (a[0] + b[0]); n[2] += (a[0] - b[0]) * (a[1] + b[1]); }
    const nl = len(n); if (nl < 1e-12) continue; n = n.map((v) => v / nl);
    const c = pts.reduce((s, p) => [s[0] + p[0] / pts.length, s[1] + p[1] / pts.length, s[2] + p[2] / pts.length], [0, 0, 0]);
    const flat = pts.every((p) => Math.abs(dot(sub(p, c), n)) < 1e-3);
    const convex = pts.every((p, i) => dot(cross(sub(p, pts[(i + pts.length - 1) % pts.length]), sub(pts[(i + 1) % pts.length], p)), n) > -1e-9);
    if (pts.length > 4 && flat && convex) { const ci = outPos.length / 3; outPos.push(...c); for (let i = 0; i < poly.length; i++) add.push(poly[i], poly[(i + 1) % poly.length], ci); fans++; filled++; continue; }
    // ear clipping in the loop's own plane
    const ref = Math.abs(n[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0]; const u = cross(n, ref); const ul = len(u); const U = u.map((v) => v / ul); const V = cross(n, U);
    const q = pts.map((p) => [dot(sub(p, c), U), dot(sub(p, c), V)]); let ids = poly.map((_, i) => i);
    const cr2 = (a, b, d) => (b[0] - a[0]) * (d[1] - a[1]) - (b[1] - a[1]) * (d[0] - a[0]);
    const inside = (p, a, b, d) => cr2(a, b, p) > 1e-12 && cr2(b, d, p) > 1e-12 && cr2(d, a, p) > 1e-12;
    let guard = 0;
    while (ids.length > 3 && guard++ < 10000) {
      let cut = -1, bestCr = -1;
      for (let i = 0; i < ids.length; i++) {
        const a = ids[(i + ids.length - 1) % ids.length], b = ids[i], d = ids[(i + 1) % ids.length]; const cr = cr2(q[a], q[b], q[d]);
        if (cr <= 1e-12) continue; if (ids.some((o) => o !== a && o !== b && o !== d && inside(q[o], q[a], q[b], q[d]))) continue;
        if (cr > bestCr) { bestCr = cr; cut = i; }
      }
      if (cut < 0) { // no clean ear (collinear runs): take the flattest vertex
        let bi = 0, bc = Infinity; for (let i = 0; i < ids.length; i++) { const a = ids[(i + ids.length - 1) % ids.length], b = ids[i], d = ids[(i + 1) % ids.length]; const cr = Math.abs(cr2(q[a], q[b], q[d])); if (cr < bc) { bc = cr; bi = i; } } cut = bi;
      }
      const a = ids[(cut + ids.length - 1) % ids.length], b = ids[cut], d = ids[(cut + 1) % ids.length]; add.push(poly[a], poly[b], poly[d]); ids.splice(cut, 1); ears++;
    }
    if (ids.length === 3) { add.push(poly[ids[0]], poly[ids[1]], poly[ids[2]]); ears++; }
    filled++;
  }
  return { pos: Float64Array.from(outPos), idx: Uint32Array.from([...idx, ...add]), loops: loops.length, filled, fans, ears, added: add.length / 3 };
}

// ---------------------------------------------------------------- OBJ -> welded components
function readObj(file) {
  const V = [], F = []; let mat = '';
  for (const l of fs.readFileSync(file, 'utf8').split('\n')) {
    if (l.startsWith('v ')) { const p = l.split(/\s+/); V.push([+p[1] * 25.4, +p[2] * 25.4, +p[3] * 25.4]); }
    else if (l.startsWith('usemtl')) mat = l.split(/\s+/)[1];
    else if (l.startsWith('f ')) { const p = l.slice(2).trim().split(/\s+/).map((s) => parseInt(s) - 1); for (let k = 1; k + 1 < p.length; k++) F.push({ v: [p[0], p[k], p[k + 1]], mat }); }
  }
  return { V, F };
}
/** Weld at 1e-4 mm and split into vertex-connected components, largest first. A part is {pos: flat mm, tris: [{v:[a,b,c], mat}]}. */
function splitComponents(obj) {
  const w = weld(Float64Array.from(obj.V.flat()));
  const tris = obj.F.map((f) => ({ v: f.v.map((i) => w.idx[i]), mat: f.mat })).filter((t) => t.v[0] !== t.v[1] && t.v[1] !== t.v[2] && t.v[0] !== t.v[2]);
  const par = Array.from({ length: w.pos.length / 3 }, (_, i) => i); const find = (a) => { while (par[a] !== a) a = par[a] = par[par[a]]; return a; };
  for (const t of tris) { par[find(t.v[0])] = find(t.v[1]); par[find(t.v[1])] = find(t.v[2]); }
  const groups = new Map(); for (const t of tris) { const r = find(t.v[0]); (groups.get(r) || groups.set(r, []).get(r)).push(t); }
  return [...groups.values()].sort((a, b) => b.length - a.length).map((ts) => {
    const vs = [...new Set(ts.flatMap((t) => t.v))]; const re = new Map(vs.map((v, i) => [v, i])); const pos = new Float64Array(vs.length * 3);
    vs.forEach((v, i) => pos.set(w.pos.subarray(v * 3, v * 3 + 3), i * 3));
    return { pos, tris: ts.map((t) => ({ v: t.v.map((v) => re.get(v)), mat: t.mat })) };
  });
}
const bboxOf = (pos) => { const lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9]; for (let i = 0; i < pos.length; i += 3) for (let d = 0; d < 3; d++) { lo[d] = Math.min(lo[d], pos[i + d]); hi[d] = Math.max(hi[d], pos[i + d]); } return { lo, hi, size: hi.map((v, d) => v - lo[d]), centre: hi.map((v, d) => (v + lo[d]) / 2) }; };
const usedBBox = (pos, idx) => { const u = new Set(idx); const p = []; for (const v of u) p.push(pos[v * 3], pos[v * 3 + 1], pos[v * 3 + 2]); return bboxOf(Float64Array.from(p)); };

// ---------------------------------------------------------------- repair
/** Triangles that share all three vertices: opposite winding = a zero-thickness internal wall between two solids, both go; same winding = a duplicate, one stays. */
function dropCoincident(tris) {
  const g = new Map();
  tris.forEach((t, i) => { const [a, b, c] = t.v; const s = [a, b, c].slice().sort((x, y) => x - y); const even = (a === s[0] && b === s[1]) || (b === s[0] && c === s[1]) || (c === s[0] && a === s[1]); const k = s.join(); (g.get(k) || g.set(k, []).get(k)).push({ i, even }); });
  const drop = new Set(); let pairs = 0, dups = 0;
  for (const l of g.values()) {
    if (l.length < 2) continue; const e = l.filter((x) => x.even), o = l.filter((x) => !x.even); const m = Math.min(e.length, o.length); pairs += m;
    const rest = [...e.slice(m), ...o.slice(m)]; l.forEach((x) => drop.add(x.i)); if (rest.length) { drop.delete(rest[0].i); dups += rest.length - 1; }
  }
  return { tris: tris.filter((_, i) => !drop.has(i)), pairs, dups };
}
/** Connected shells over shared edges. */
function edgeShells(idx) {
  const nT = idx.length / 3; const par = Array.from({ length: nT }, (_, i) => i); const find = (a) => { while (par[a] !== a) a = par[a] = par[par[a]]; return a; }; const first = new Map();
  for (let t = 0; t < nT; t++) for (let k = 0; k < 3; k++) { const a = idx[t * 3 + k], b = idx[t * 3 + (k + 1) % 3]; const key = a < b ? a + '_' + b : b + '_' + a; if (first.has(key)) par[find(t)] = find(first.get(key)); else first.set(key, t); }
  const groups = new Map(); for (let t = 0; t < nT; t++) { const r = find(t); (groups.get(r) || groups.set(r, []).get(r)).push(t); }
  return [...groups.values()].sort((a, b) => b.length - a.length);
}
const subIdx = (idx, tl) => Uint32Array.from(tl.flatMap((t) => [idx[t * 3], idx[t * 3 + 1], idx[t * 3 + 2]]));

/** junk -> consistent winding -> close open loops -> outward winding -> sliver repair -> must be one closed 2-manifold shell. */
function repairShell(name, pos, idx, note = '') {
  const before = { tris: idx.length / 3, ...edgeStats(idx) };
  const j = dropJunk(pos, idx); let o = orient(pos, j.idx);
  const cl = closeHoles(pos, o.idx); o = orient(cl.pos, cl.idx);
  const r = repairSlivers(cl.pos, o.idx); const after = { tris: r.idx.length / 3, ...edgeStats(r.idx) };
  if (after.open || after.nonManifold || o.shells !== 1) throw new Error(`${name}: not a closed manifold shell (${JSON.stringify(after)}, ${o.shells} shells)`);
  return { name, pos: cl.pos, idx: r.idx, before, after, loopsClosed: cl.filled, trisAdded: cl.added, slivers: r.repaired, flipped: o.flipped, volumeMm3: o.volumeMm3[0], note };
}

// ---------------------------------------------------------------- sections (z planes) for the lid fit
function sectionZ(pos, idx, z) {
  const out = [];
  for (let t = 0; t < idx.length; t += 3) {
    const p = [0, 1, 2].map((k) => P(pos, idx[t + k])); const d = p.map((q) => q[2] - z); const pts = [];
    for (let k = 0; k < 3; k++) { const a = p[k], b = p[(k + 1) % 3], da = d[k], db = d[(k + 1) % 3]; if ((da < 0) !== (db < 0)) { const u = da / (da - db); pts.push([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u]); } }
    if (pts.length === 2) out.push(pts);
  }
  return out;
}
/** bbox of every closed loop of a z section (segments chained through shared endpoints). */
function sectionLoops(segs) {
  const key = (p) => Math.round(p[0] * 1000) + ',' + Math.round(p[1] * 1000); const adj = new Map(); const pt = new Map();
  for (const [a, b] of segs) { const ka = key(a), kb = key(b); pt.set(ka, a); pt.set(kb, b); (adj.get(ka) || adj.set(ka, []).get(ka)).push(kb); (adj.get(kb) || adj.set(kb, []).get(kb)).push(ka); }
  const seen = new Set(), out = [];
  for (const s of adj.keys()) {
    if (seen.has(s)) continue; const st = [s], comp = []; seen.add(s);
    while (st.length) { const v = st.pop(); comp.push(pt.get(v)); for (const w of adj.get(v)) if (!seen.has(w)) { seen.add(w); st.push(w); } }
    const lo = [1e9, 1e9], hi = [-1e9, -1e9]; for (const p of comp) for (let d = 0; d < 2; d++) { lo[d] = Math.min(lo[d], p[d]); hi[d] = Math.max(hi[d], p[d]); }
    out.push({ lo, hi, size: [hi[0] - lo[0], hi[1] - lo[1]], centre: [(lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2], n: comp.length });
  }
  return out.sort((a, b) => b.size[0] * b.size[1] - a.size[0] * a.size[1]);   // largest first
}
const zLevels = (pos, lo, hi) => [...new Set(Array.from({ length: pos.length / 3 }, (_, i) => +pos[i * 3 + 2].toFixed(3)))].filter((z) => z >= lo && z <= hi).sort((a, b) => a - b);

// ---------------------------------------------------------------- solids built here
/** Solid of revolution about `axis` through `origin`. profile = [[r, h], ...]: starts and ends on the axis (r = 0) for a solid, or is a closed loop for a ring. */
function lathe(profile, origin, axis, seg = SEG) {
  const ref = Math.abs(axis[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0]; let u = cross(axis, ref); const ul = len(u); u = u.map((v) => v / ul); const w = cross(axis, u);
  const pos = [], idx = []; const closed = !(profile[0][0] === 0 && profile[profile.length - 1][0] === 0); const start = [];
  for (const [r, h] of profile) {
    start.push(pos.length / 3);
    if (r === 0) pos.push(...[0, 1, 2].map((d) => origin[d] + axis[d] * h));
    else for (let i = 0; i < seg; i++) { const a = 2 * Math.PI * i / seg; pos.push(...[0, 1, 2].map((d) => origin[d] + axis[d] * h + (Math.cos(a) * u[d] + Math.sin(a) * w[d]) * r)); }
  }
  const at = (k, i) => (profile[k][0] === 0 ? start[k] : start[k] + (i % seg));
  for (let k = 0; k < (closed ? profile.length : profile.length - 1); k++) {
    const k2 = (k + 1) % profile.length;
    for (let i = 0; i < seg; i++) {
      const a = at(k, i), b = at(k, i + 1), c = at(k2, i), d = at(k2, i + 1);
      if (a !== b && b !== d && a !== d) idx.push(a, b, d); if (a !== d && d !== c && a !== c) idx.push(a, d, c);
    }
  }
  const p = Float64Array.from(pos); const o = orient(p, Uint32Array.from(idx));
  return { pos: p, idx: o.idx };
}
/** Offset every vertex of an outward-wound closed mesh along its (mitred) normal by d. */
function growMesh(pos, idx, d) {
  const nV = pos.length / 3; const acc = new Float64Array(nV * 3); const fns = [];
  for (let t = 0; t < idx.length; t += 3) {
    const fn = faceN(pos, idx[t], idx[t + 1], idx[t + 2]); fns.push(fn);
    for (let k = 0; k < 3; k++) {
      const a = P(pos, idx[t + k]), b = P(pos, idx[t + (k + 1) % 3]), c = P(pos, idx[t + (k + 2) % 3]); const e1 = sub(b, a), e2 = sub(c, a);
      const w = Math.acos(Math.max(-1, Math.min(1, dot(e1, e2) / ((len(e1) * len(e2)) || 1)))); for (let q = 0; q < 3; q++) acc[idx[t + k] * 3 + q] += fn[q] * w;
    }
  }
  const nrm = new Float64Array(nV * 3), minDot = new Float64Array(nV).fill(1);
  for (let v = 0; v < nV; v++) { const l = Math.hypot(acc[v * 3], acc[v * 3 + 1], acc[v * 3 + 2]) || 1; for (let q = 0; q < 3; q++) nrm[v * 3 + q] = acc[v * 3 + q] / l; }
  for (let t = 0; t < idx.length; t += 3) for (let k = 0; k < 3; k++) { const v = idx[t + k]; minDot[v] = Math.min(minDot[v], dot(fns[t / 3], P(nrm, v))); }
  const out = new Float64Array(pos.length);
  for (let v = 0; v < nV; v++) { const s = d / Math.max(minDot[v], 0.4); for (let q = 0; q < 3; q++) out[v * 3 + q] = pos[v * 3 + q] + nrm[v * 3 + q] * s; }
  return out;
}
const translate = (pos, t) => { const o = new Float64Array(pos.length); for (let i = 0; i < pos.length; i += 3) for (let d = 0; d < 3; d++) o[i + d] = pos[i + d] + t[d]; return o; };
const fibonacci = (n) => Array.from({ length: n }, (_, i) => { const z = 1 - 2 * (i + 0.5) / n, r = Math.sqrt(1 - z * z), a = i * Math.PI * (3 - Math.sqrt(5)); return [r * Math.cos(a), r * Math.sin(a), z]; });

// ---------------------------------------------------------------- BVH, ray queries, point-in-mesh
function triSoup(pos, idx) { const t = new Float64Array(idx.length * 3); for (let i = 0; i < idx.length; i++) for (let d = 0; d < 3; d++) t[i * 3 + d] = pos[idx[i] * 3 + d]; return t; }   // 9 per triangle
function buildBVH(soup) {
  const n = soup.length / 9; const order = Uint32Array.from({ length: n }, (_, i) => i); const cen = new Float64Array(n * 3);
  for (let i = 0; i < n; i++) for (let d = 0; d < 3; d++) cen[i * 3 + d] = (soup[i * 9 + d] + soup[i * 9 + 3 + d] + soup[i * 9 + 6 + d]) / 3;
  const nodes = []; const LEAF = 6;
  const build = (s, e) => {
    const lo = [1e18, 1e18, 1e18], hi = [-1e18, -1e18, -1e18];
    for (let k = s; k < e; k++) { const t = order[k]; for (let v = 0; v < 3; v++) for (let d = 0; d < 3; d++) { const x = soup[t * 9 + v * 3 + d]; if (x < lo[d]) lo[d] = x; if (x > hi[d]) hi[d] = x; } }
    const node = { lo, hi, l: -1, r: -1, s, c: e - s }; const id = nodes.push(node) - 1;
    if (e - s > LEAF) {
      const clo = [1e18, 1e18, 1e18], chi = [-1e18, -1e18, -1e18]; for (let k = s; k < e; k++) for (let d = 0; d < 3; d++) { const x = cen[order[k] * 3 + d]; if (x < clo[d]) clo[d] = x; if (x > chi[d]) chi[d] = x; }
      const ax = [0, 1, 2].sort((a, b) => (chi[b] - clo[b]) - (chi[a] - clo[a]))[0];
      const part = Array.from(order.subarray(s, e)).sort((a, b) => cen[a * 3 + ax] - cen[b * 3 + ax]); order.set(part, s);
      const m = (s + e) >> 1; node.l = build(s, m); node.r = build(m, e); node.c = 0;
    }
    return id;
  };
  build(0, n);
  const N = nodes.length; const box = new Float64Array(N * 6), L = new Int32Array(N), R = new Int32Array(N), S = new Int32Array(N), C = new Int32Array(N);
  nodes.forEach((nd, i) => { box.set([...nd.lo, ...nd.hi], i * 6); L[i] = nd.l; R[i] = nd.r; S[i] = nd.s; C[i] = nd.c; });
  const tri = new Float64Array(n * 9); // v0, e1, e2 in leaf order
  for (let k = 0; k < n; k++) { const t = order[k]; for (let d = 0; d < 3; d++) { tri[k * 9 + d] = soup[t * 9 + d]; tri[k * 9 + 3 + d] = soup[t * 9 + 3 + d] - soup[t * 9 + d]; tri[k * 9 + 6 + d] = soup[t * 9 + 6 + d] - soup[t * 9 + d]; } }
  return { box, L, R, S, C, tri, order, stack: new Int32Array(128) };
}
/** Walk the BVH along a ray; mode 0: stop at the first hit with t in (eps, tmax); mode 1: count every hit. */
function trace(b, ox, oy, oz, dx, dy, dz, tmax, mode) {
  const ix = 1 / dx, iy = 1 / dy, iz = 1 / dz; const { box, L, R, S, C, tri, stack } = b; let sp = 0, count = 0; stack[sp++] = 0; const EPS = 1e-9;
  while (sp) {
    const n = stack[--sp]; const o = n * 6;
    let t0 = 0, t1 = tmax;
    let a = (box[o] - ox) * ix, c = (box[o + 3] - ox) * ix; if (a > c) { const q = a; a = c; c = q; } if (a > t0) t0 = a; if (c < t1) t1 = c; if (t0 > t1) continue;
    a = (box[o + 1] - oy) * iy; c = (box[o + 4] - oy) * iy; if (a > c) { const q = a; a = c; c = q; } if (a > t0) t0 = a; if (c < t1) t1 = c; if (t0 > t1) continue;
    a = (box[o + 2] - oz) * iz; c = (box[o + 5] - oz) * iz; if (a > c) { const q = a; a = c; c = q; } if (a > t0) t0 = a; if (c < t1) t1 = c; if (t0 > t1) continue;
    if (L[n] < 0) {
      for (let k = S[n], e = S[n] + C[n]; k < e; k++) {
        const q = k * 9; const e1x = tri[q + 3], e1y = tri[q + 4], e1z = tri[q + 5], e2x = tri[q + 6], e2y = tri[q + 7], e2z = tri[q + 8];
        const px = dy * e2z - dz * e2y, py = dz * e2x - dx * e2z, pz = dx * e2y - dy * e2x; const det = e1x * px + e1y * py + e1z * pz; if (det > -1e-14 && det < 1e-14) continue;
        const id = 1 / det; const tx = ox - tri[q], ty = oy - tri[q + 1], tz = oz - tri[q + 2]; const u = (tx * px + ty * py + tz * pz) * id; if (u < 0 || u > 1) continue;
        const qx = ty * e1z - tz * e1y, qy = tz * e1x - tx * e1z, qz = tx * e1y - ty * e1x; const v = (dx * qx + dy * qy + dz * qz) * id; if (v < 0 || u + v > 1) continue;
        const t = (e2x * qx + e2y * qy + e2z * qz) * id; if (t > EPS && t < tmax) { if (mode === 0) return 1; count++; }
      }
    } else { stack[sp++] = L[n]; stack[sp++] = R[n]; }
  }
  return count;
}
function ptTriDist(p, a, b, c) { // Ericson, closest point on triangle
  const ab = sub(b, a), ac = sub(c, a), ap = sub(p, a); const d1 = dot(ab, ap), d2 = dot(ac, ap); if (d1 <= 0 && d2 <= 0) return len(ap);
  const bp = sub(p, b); const d3 = dot(ab, bp), d4 = dot(ac, bp); if (d3 >= 0 && d4 <= d3) return len(bp);
  const vc = d1 * d4 - d3 * d2; if (vc <= 0 && d1 >= 0 && d3 <= 0) { const v = d1 / (d1 - d3); return len(sub(p, ab.map((x, i) => a[i] + x * v))); }
  const cp = sub(p, c); const d5 = dot(ab, cp), d6 = dot(ac, cp); if (d6 >= 0 && d5 <= d6) return len(cp);
  const vb = d5 * d2 - d1 * d6; if (vb <= 0 && d2 >= 0 && d6 <= 0) { const w = d2 / (d2 - d6); return len(sub(p, ac.map((x, i) => a[i] + x * w))); }
  const va = d3 * d6 - d5 * d4; if (va <= 0 && d4 - d3 >= 0 && d5 - d6 >= 0) { const w = (d4 - d3) / ((d4 - d3) + (d5 - d6)); return len(sub(p, sub(c, b).map((x, i) => b[i] + x * w))); }
  const den = 1 / (va + vb + vc), v = vb * den, w = vc * den; return len(sub(p, a.map((x, i) => x + ab[i] * v + ac[i] * w)));
}
/** How far A's vertices and triangle centres reach into closed mesh B (mm, 0 = no sample inside) and how many samples are inside. */
function penetration(A, B) {
  const bvh = buildBVH(triSoup(B.pos, B.idx)); const soupB = triSoup(B.pos, B.idx); const nB = B.idx.length / 3; const d = [1, 0.0137, 0.0071]; const dl = len(d); const dn = d.map((v) => v / dl);
  const samples = []; for (const v of new Set(A.idx)) samples.push(P(A.pos, v));
  for (let t = 0; t < A.idx.length; t += 3) samples.push([0, 1, 2].map((k) => (A.pos[A.idx[t] * 3 + k] + A.pos[A.idx[t + 1] * 3 + k] + A.pos[A.idx[t + 2] * 3 + k]) / 3));
  let depth = 0, inside = 0;
  for (const s of samples) {
    if (trace(bvh, s[0], s[1], s[2], dn[0], dn[1], dn[2], 1e9, 1) % 2 !== 1) continue;
    let best = 1e9; for (let t = 0; t < nB; t++) best = Math.min(best, ptTriDist(s, [0, 1, 2].map((k) => soupB[t * 9 + k]), [0, 1, 2].map((k) => soupB[t * 9 + 3 + k]), [0, 1, 2].map((k) => soupB[t * 9 + 6 + k])));
    if (best > 1e-5) { inside++; depth = Math.max(depth, best); }
  }
  return { depthMm: depth, inside };
}

// ---------------------------------------------------------------- feature finders
/** Boundary loops of the faces lying in the plane coord[axis] = level, as circles where they are circles. Returns [{axes:[a,b], centre:[ca,cb], r, sd, n, size}]. */
function planarLoops(pos, idx, axis, level) {
  const sel = []; for (let t = 0; t < idx.length; t += 3) if (Math.abs(faceN(pos, idx[t], idx[t + 1], idx[t + 2])[axis]) > 0.9999 && [0, 1, 2].every((k) => Math.abs(pos[idx[t + k] * 3 + axis] - level) < 5e-3)) sel.push(t);
  const cnt = new Map(); for (const t of sel) for (let k = 0; k < 3; k++) { const a = idx[t + k], b = idx[t + (k + 1) % 3]; const key = a < b ? a + '_' + b : b + '_' + a; cnt.set(key, (cnt.get(key) || 0) + 1); }
  const adj = new Map(); for (const [key, c] of cnt) if (c === 1) { const [a, b] = key.split('_').map(Number); (adj.get(a) || adj.set(a, []).get(a)).push(b); (adj.get(b) || adj.set(b, []).get(b)).push(a); }
  const ax = [0, 1, 2].filter((k) => k !== axis); const seen = new Set(), out = [];
  for (const s of adj.keys()) {
    if (seen.has(s)) continue; const st = [s], comp = []; seen.add(s);
    while (st.length) { const v = st.pop(); comp.push(v); for (const w of adj.get(v)) if (!seen.has(w)) { seen.add(w); st.push(w); } }
    const pts = comp.map((v) => [pos[v * 3 + ax[0]], pos[v * 3 + ax[1]]]); const lo = [0, 1].map((d) => Math.min(...pts.map((p) => p[d]))), hi = [0, 1].map((d) => Math.max(...pts.map((p) => p[d])));
    const c = [(lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2]; const rs = pts.map((p) => Math.hypot(p[0] - c[0], p[1] - c[1])); const r = rs.reduce((a, b) => a + b) / rs.length;
    out.push({ axes: ax, centre: c, r, sd: Math.sqrt(rs.reduce((s, v) => s + (v - r) ** 2, 0) / rs.length), n: comp.length, size: [hi[0] - lo[0], hi[1] - lo[1]] });
  }
  return out;
}
const isCircle = (l) => l.n >= 16 && l.n <= 64 && l.sd < 0.01 && Math.abs(l.size[0] - l.size[1]) < 0.02 && l.r < 8;

/** Circles made of the used vertices that lie in the plane coord[axis] = level, within 20 um (clustered by distance), e.g. the tip ring of a funnel. */
function ringsAt(pos, idx, axis, level) {
  const ax = [0, 1, 2].filter((k) => k !== axis); const pts = []; for (const v of new Set(idx)) if (Math.abs(pos[v * 3 + axis] - level) < 0.02) pts.push([pos[v * 3 + ax[0]], pos[v * 3 + ax[1]]]);
  const par = pts.map((_, i) => i); const find = (a) => { while (par[a] !== a) a = par[a] = par[par[a]]; return a; };
  for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) if (Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1]) < 1.6) par[find(i)] = find(j);   // ring neighbours are under 1.6 mm apart
  const byRoot = new Map(); pts.forEach((p, i) => { const r = find(i); (byRoot.get(r) || byRoot.set(r, []).get(r)).push(p); }); const groups = [...byRoot.values()];
  return groups.filter((g) => g.length >= 20).map((g) => { const lo = [0, 1].map((d) => Math.min(...g.map((p) => p[d]))), hi = [0, 1].map((d) => Math.max(...g.map((p) => p[d]))); const c = [(lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2]; const rs = g.map((p) => Math.hypot(p[0] - c[0], p[1] - c[1])); const r = rs.reduce((a, b) => a + b) / rs.length; return { centre: c, r, sd: Math.sqrt(rs.reduce((s, v) => s + (v - r) ** 2, 0) / rs.length), n: g.length }; }).filter((c) => c.sd < 0.01);
}

/**
 * Lid onto body. The plug's width-versus-height profile (x and y extents of its section at every height) is slid over the width profile of
 * the body's mouth until they coincide; the flange underside against the rim is then only checked. In this export they coincide exactly:
 * the plug is the negative of the mouth, snap barb and all, so there is no clearance to read and nothing to tune.
 */
function fitLid(body, lid) {
  const bb = usedBBox(body.pos, body.idx), lb = usedBBox(lid.pos, lid.idx); const rimZ = bb.hi[2];
  const mouth = (z) => { const lp = sectionLoops(sectionZ(body.pos, body.idx, z)); return lp.length >= 2 && lp[1].size[0] * lp[1].size[1] > 100 ? lp[1] : null; };
  const plugAt = (z) => sectionLoops(sectionZ(lid.pos, lid.idx, z))[0];
  let fz = lb.lo[2]; while (plugAt(fz + 0.02).size[0] < 21) fz += 0.02;   // first sample on the flange
  const lv = zLevels(lid.pos, lb.lo[2], lb.hi[2]).filter((z) => z <= fz + 0.02); const flangeZ = lv[lv.length - 1];
  const zs = []; for (let z = lb.lo[2] + 0.05; z < flangeZ - 0.05; z += 0.05) zs.push(z);
  const plug = zs.map((z) => plugAt(z));
  const score = (dz) => { let s = 0, n = 0; for (let i = 0; i < zs.length; i++) { const m = mouth(zs[i] + dz); if (!m) return 1e9; s += (m.size[0] - plug[i].size[0]) ** 2 + (m.size[1] - plug[i].size[1]) ** 2; n++; } return s / n; };
  let best = { dz: 0, s: 1e18 }; for (let dz = bb.lo[2] - lb.lo[2]; dz <= rimZ - lb.lo[2] + 0.001; dz += 0.04) { const s = score(dz); if (s < best.s) best = { dz, s }; }
  for (let step of [0.01, 0.002, 0.0005]) { const c = best.dz; for (let k = -10; k <= 10; k++) { const dz = c + k * step; const s = score(dz); if (s < best.s) best = { dz, s }; } }
  const dz = best.dz; let dxs = 0, dys = 0, maxW = 0; zs.forEach((z, i) => { const m = mouth(z + dz); dxs += m.centre[0] - plug[i].centre[0]; dys += m.centre[1] - plug[i].centre[1]; maxW = Math.max(maxW, Math.abs(m.size[0] - plug[i].size[0]), Math.abs(m.size[1] - plug[i].size[1])); });
  return { dx: dxs / zs.length, dy: dys / zs.length, dz, rimZ, flangeZ, flangeResidual: flangeZ + dz - rimZ, profileRmsMm: Math.sqrt(best.s), profileMaxMm: maxW, samples: zs.length, lidMinZ: lb.lo[2] };
}

// ---------------------------------------------------------------- manifold-3d
async function loadManifold() {
  const url = pathToFileURL(path.join(TOOLS, 'node_modules/manifold-3d/manifold.js')).href;
  let Module; try { Module = (await import(url)).default; } catch (e) { throw new Error(`ciclop-build: manifold-3d not found under ${TOOLS}/node_modules (set HOLLOW_TOOLS; npm i --prefix <dir> manifold-3d gltfpack): ${e.message}`); }
  const wasm = await Module(); wasm.setup(); return wasm;
}
function compact(pos, idx) {
  const map = new Map(); const out = []; const ni = new Uint32Array(idx.length);
  for (let i = 0; i < idx.length; i++) { let v = map.get(idx[i]); if (v === undefined) { v = out.length / 3; map.set(idx[i], v); out.push(pos[idx[i] * 3], pos[idx[i] * 3 + 1], pos[idx[i] * 3 + 2]); } ni[i] = v; }
  return { pos: Float64Array.from(out), idx: ni };
}

// ---------------------------------------------------------------- optional: register the previous revision (the sealed site GLB) against the export
async function refCheck(file, dirtyLid, dirtyBody, fit, extra = {}) {
  let THREE, GLTFLoader, MeshoptDecoder;
  try {
    const base = pathToFileURL(path.join(TOOLS, 'node_modules/three/')).href;
    THREE = await import(base + 'build/three.module.js'); ({ GLTFLoader } = await import(base + 'examples/jsm/loaders/GLTFLoader.js')); ({ MeshoptDecoder } = await import(base + 'examples/jsm/libs/meshopt_decoder.module.js'));
  } catch (e) { log(`--ref skipped: three not found under ${TOOLS}/node_modules (${e.message.split('\n')[0]})`); return null; }
  await MeshoptDecoder.ready; const buf = fs.readFileSync(file); const l = new GLTFLoader(); l.setMeshoptDecoder(MeshoptDecoder);
  const gltf = await new Promise((res, rej) => l.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength), '', res, rej)); gltf.scene.updateMatrixWorld(true);
  const meshes = []; const v3 = new THREE.Vector3();
  gltf.scene.traverse((o) => { if (!o.isMesh) return; const p = o.geometry.attributes.position; const pts = []; for (let i = 0; i < p.count; i++) { v3.set(p.getX(i), p.getY(i), p.getZ(i)).applyMatrix4(o.matrixWorld); pts.push([v3.x, v3.y, v3.z]); } meshes.push({ name: o.name, node: o.parent && o.parent.name, tris: o.geometry.index.count / 3, pts }); });
  // grid + 24 signed-permutation rotations: R*A + t ~ B
  const ROTS = []; for (const p of [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]]) for (let s = 0; s < 8; s++) { const sg = [s & 1 ? -1 : 1, s & 2 ? -1 : 1, s & 4 ? -1 : 1]; const R = Array(9).fill(0); for (let i = 0; i < 3; i++) R[i * 3 + p[i]] = sg[i]; if (R[0] * (R[4] * R[8] - R[5] * R[7]) - R[1] * (R[3] * R[8] - R[5] * R[6]) + R[2] * (R[3] * R[7] - R[4] * R[6]) > 0) ROTS.push(R); }
  const CELL = 0.5; const key = (p) => p.map((x) => Math.floor(x / CELL)).join();
  const gridOf = (pts) => { const g = new Map(); pts.forEach((p, i) => (g.get(key(p)) || g.set(key(p), []).get(key(p))).push(i)); return g; };
  const near = (g, pts, q) => { const c = q.map((x) => Math.floor(x / CELL)); let best = 1e9; for (let a = -2; a <= 2; a++) for (let b = -2; b <= 2; b++) for (let d = -2; d <= 2; d++) for (const i of g.get((c[0] + a) + ',' + (c[1] + b) + ',' + (c[2] + d)) || []) best = Math.min(best, Math.hypot(pts[i][0] - q[0], pts[i][1] - q[1], pts[i][2] - q[2])); return best; };
  const bbox = (P) => [0, 1, 2].map((d) => [Math.min(...P.map((p) => p[d])), Math.max(...P.map((p) => p[d]))]);
  const register = (A, B) => {
    const g = gridOf(B); const cb = bbox(B).map((r) => (r[0] + r[1]) / 2); let best = null; const sample = A.filter((_, i) => i % Math.max(1, Math.floor(A.length / 300)) === 0);
    for (const R of ROTS) {
      const mv = (p) => [0, 1, 2].map((i) => R[i * 3] * p[0] + R[i * 3 + 1] * p[1] + R[i * 3 + 2] * p[2]); const RA = A.map(mv); const ca = bbox(RA).map((r) => (r[0] + r[1]) / 2); let t = cb.map((c, d) => c - ca[d]);
      const rs = sample.map((p) => near(g, B, mv(p).map((x, d) => x + t[d]))); const rms = Math.sqrt(rs.reduce((s, x) => s + Math.min(x, 3) ** 2, 0) / rs.length); if (!best || rms < best.rms) best = { R, t, rms, mv };
    }
    const rs = A.map((p) => near(g, B, best.mv(p).map((x, d) => x + best.t[d]))); return { R: best.R, t: best.t, rmsUm: Math.sqrt(rs.reduce((s, x) => s + x * x, 0) / rs.length) * 1000, matched: rs.filter((x) => x < 0.02).length, n: rs.length };
  };
  const dLid = Array.from({ length: dirtyLid.pos.length / 3 }, (_, i) => P(dirtyLid.pos, i)); const lidRef = meshes.find((m) => m.tris === dirtyLid.idx.length / 3);
  if (!lidRef) { log('--ref: no mesh with the lid\'s triangle count'); return null; }
  const ext = [0, 1, 2].map((d) => Math.max(...lidRef.pts.map((p) => p[d])) - Math.min(...lidRef.pts.map((p) => p[d])));
  const s = 40 / Math.max(...ext);   // the lid's long edge is 40 mm
  const toMm = (m) => m.pts.map((p) => p.map((x) => x * s));
  const rl = register(toMm(lidRef), dLid);
  const vol = (m) => bbox(m.pts).reduce((v, r) => v * (r[1] - r[0]), 1);
  const bodyRef = meshes.slice().sort((a, b) => vol(b) - vol(a))[0];   // the biggest box: the body (the spheres have more triangles)
  const mvl = (p) => [0, 1, 2].map((i) => rl.R[i * 3] * p[0] + rl.R[i * 3 + 1] * p[1] + rl.R[i * 3 + 2] * p[2]);
  const refBodyBox = bbox(toMm(bodyRef).map(mvl)), refLidBox = bbox(toMm(lidRef).map(mvl));   // both in the export's axes now (ref x,y,z -> x,z,-y), offsets still the ref's
  const bb = usedBBox(dirtyBody.pos, dirtyBody.idx); const lb = usedBBox(dirtyLid.pos, dirtyLid.idx);
  const refPlugAboveBed = refLidBox[2][0] - refBodyBox[2][0];   // lid plug bottom above the body's lowest z, as the previous revision seated it
  const ours = (lb.lo[2] + fit.dz) - bb.lo[2];
  const balls = meshes.filter((m) => /sphere/i.test(m.node || m.name)).map((m) => { const bx = bbox(toMm(m).map(mvl)); return { diameterMm: +(bx[0][1] - bx[0][0]).toFixed(2), fromBodyYMin: +(((bx[1][0] + bx[1][1]) / 2) - refBodyBox[1][0]).toFixed(2), aboveBed: +(((bx[2][0] + bx[2][1]) / 2) - refBodyBox[2][0]).toFixed(2), behindFront: +(((bx[0][0] + bx[0][1]) / 2) - refBodyBox[0][0]).toFixed(2) }; }).sort((a, b) => a.fromBodyYMin - b.fromBodyYMin);
  const mine = (extra.ledHoles || []).map((h) => ({ fromBodyYMin: +(h.y - bb.lo[1]).toFixed(2), aboveBed: +(h.z - bb.lo[2]).toFixed(2) }));
  return { scaleMmPerUnit: +s.toFixed(4), lidRmsUm: +rl.rmsUm.toFixed(2), lidMatched: `${rl.matched}/${rl.n}`, refLidPlugBottomAboveBodyBottomMm: +refPlugAboveBed.toFixed(3), oursMm: +ours.toFixed(3), deltaMm: +(refPlugAboveBed - ours).toFixed(3), previousBalls: balls, ourFrontHoleAxes: mine, refMeshes: meshes.map((m) => `${m.node || m.name} ${m.tris}`).join(', ') };
}

// ---------------------------------------------------------------- visibility from outside
/** soup: 9 per triangle (outward wound). Candidates are triangles [0, nCand). Returns Uint8Array visible[]. */
function visibleFromOutside(soup, nCand, dirs1, dirs2) {
  const bvh = buildBVH(soup); const n = soup.length / 9; const vis = new Uint8Array(nCand); const EPS = 2e-3;
  const info = [];
  for (let t = 0; t < nCand; t++) {
    const a = [soup[t * 9], soup[t * 9 + 1], soup[t * 9 + 2]], b = [soup[t * 9 + 3], soup[t * 9 + 4], soup[t * 9 + 5]], c = [soup[t * 9 + 6], soup[t * 9 + 7], soup[t * 9 + 8]];
    const cr = cross(sub(b, a), sub(c, a)); const l = len(cr); if (l < 2e-8) { info.push(null); continue; }
    const nn = cr.map((v) => v / l); const cen = [0, 1, 2].map((k) => (a[k] + b[k] + c[k]) / 3);
    const pts = [cen, ...[a, b, c].map((v) => cen.map((x, k) => x + 0.6 * (v[k] - x)))].map((p) => p.map((x, k) => x + nn[k] * EPS));
    info.push({ nn, pts });
  }
  const run = (dirs, nSamples, only) => {
    for (let t = 0; t < nCand; t++) {
      const f = info[t]; if (!f || vis[t]) continue; if (only && !only[t]) continue;
      const { nn, pts } = f; const start = (t * 2654435761) % dirs.length;
      outer: for (let k = 0; k < dirs.length; k++) {
        const d = dirs[(start + k) % dirs.length]; if (d[0] * nn[0] + d[1] * nn[1] + d[2] * nn[2] < 0.02) continue;
        for (let s = 0; s < nSamples; s++) { const p = pts[s]; if (!trace(bvh, p[0], p[1], p[2], d[0], d[1], d[2], Infinity, 0)) { vis[t] = 1; break outer; } }
      }
    }
  };
  run(dirs1, 4); const first = vis.reduce((s, v) => s + v, 0);
  run(dirs2, 2); const second = vis.reduce((s, v) => s + v, 0) - first;
  return { vis, first, second, degenerate: info.filter((f) => !f).length };
}

// ---------------------------------------------------------------- glTF writer (raw GLB, packed afterwards by gltfpack)
class Glb {
  constructor() { this.json = { asset: { version: '2.0', generator: 'lab/tools/ciclop-build.mjs' }, scene: 0, scenes: [{ nodes: [0] }], nodes: [], meshes: [], materials: MATERIALS, accessors: [], bufferViews: [], buffers: [{ byteLength: 0 }] }; this.chunks = []; this.size = 0; }
  view(arr, target) { const buf = Buffer.from(arr.buffer, arr.byteOffset, arr.byteLength); const pad = (4 - (this.size % 4)) % 4; if (pad) { this.chunks.push(Buffer.alloc(pad)); this.size += pad; } this.json.bufferViews.push({ buffer: 0, byteOffset: this.size, byteLength: buf.length, target }); this.chunks.push(buf); this.size += buf.length; return this.json.bufferViews.length - 1; }
  accessor(arr, type, componentType, target, count, minmax) { const a = { bufferView: this.view(arr, target), componentType, count, type }; if (minmax) { const n = type === 'VEC3' ? 3 : 1; a.min = Array(n).fill(Infinity); a.max = Array(n).fill(-Infinity); for (let i = 0; i < arr.length; i++) { const d = i % n; a.min[d] = Math.min(a.min[d], arr[i]); a.max[d] = Math.max(a.max[d], arr[i]); } } this.json.accessors.push(a); return this.json.accessors.length - 1; }
  /** groups: [{material, pos, nrm, printz (per vertex, metres), idx}] -> one mesh, one primitive per group */
  mesh(name, groups) {
    const primitives = groups.map((g) => {
      const pos = Float32Array.from(g.pos), nrm = Float32Array.from(g.nrm), pz = Float32Array.from(g.printz); const big = pos.length / 3 > 65535; const idx = big ? Uint32Array.from(g.idx) : Uint16Array.from(g.idx);
      const attributes = { POSITION: this.accessor(pos, 'VEC3', 5126, 34962, pos.length / 3, true), NORMAL: this.accessor(nrm, 'VEC3', 5126, 34962, nrm.length / 3), _PRINTZ: this.accessor(pz, 'SCALAR', 5126, 34962, pz.length) };
      return { attributes, indices: this.accessor(idx, 'SCALAR', big ? 5125 : 5123, 34963, idx.length), material: matIndex[g.material], mode: 4 };
    });
    this.json.meshes.push({ name, primitives }); return this.json.meshes.length - 1;
  }
  node(n) { this.json.nodes.push(n); return this.json.nodes.length - 1; }
  toBuffer(rename) {
    if (rename) for (const m of this.json.meshes) for (const pr of m.primitives) if (rename[0] in pr.attributes) { pr.attributes[rename[1]] = pr.attributes[rename[0]]; delete pr.attributes[rename[0]]; }
    this.json.buffers[0].byteLength = this.size + ((4 - (this.size % 4)) % 4); const bin = Buffer.concat([...this.chunks, Buffer.alloc((4 - (this.size % 4)) % 4)]);
    let js = Buffer.from(JSON.stringify(this.json)); js = Buffer.concat([js, Buffer.alloc((4 - (js.length % 4)) % 4, 0x20)]);
    const head = Buffer.alloc(12); head.write('glTF', 0); head.writeUInt32LE(2, 4); head.writeUInt32LE(12 + 8 + js.length + 8 + bin.length, 8);
    const ch = (l, type) => { const b = Buffer.alloc(8); b.writeUInt32LE(l, 0); b.write(type, 4); return b; };
    return Buffer.concat([head, ch(js.length, 'JSON'), js, ch(bin.length, 'BIN\0'), bin]);
  }
}
/** triangles (indices into pos) -> {pos, nrm, printz, idx} with creased normals; pos/printz are given in the output frame already, printz in metres per source vertex. */
function toGroup(material, pos, pz, idx) {
  const c = compact(pos, idx); const pzc = new Float64Array(c.pos.length / 3);
  for (let i = 0; i < idx.length; i++) pzc[c.idx[i]] = pz[idx[i]];
  const cn = creasedNormals(c.pos, c.idx, 30); const out = new Float64Array(cn.pos.length / 3); for (let o = 0; o < out.length; o++) out[o] = pzc[cn.src[o]];
  return { material, pos: cn.pos, nrm: cn.nrm, printz: out, idx: cn.idx };
}

// ---------------------------------------------------------------- main
async function main() {
  const T0 = Date.now();
  const rep = [];                                  // per-part repair reports
  const obj = readObj(OBJ_FILE); const comps = splitComponents(obj);
  log(`OBJ: ${obj.F.length} triangles, ${obj.V.length} unwelded vertices (inch x 25.4 = mm) -> ${comps.length} connected components after welding at 1e-4 mm`);
  if (comps.length !== 6) throw new Error(`expected 6 components (body+clip, lid, 4 lens pieces), found ${comps.length}`);

  // ---- 1 identify, by geometry
  const sizeSorted = (c) => bboxOf(c.pos).size.slice().sort((a, b) => a - b);
  const body0 = comps[0];
  const lid0 = comps.slice(1).find((c) => { const s = sizeSorted(c); return Math.abs(s[0] - 5) < 0.1 && Math.abs(s[1] - 22) < 0.1 && Math.abs(s[2] - 40) < 0.1; });
  if (!lid0) throw new Error('no 22 x 40 x 5 mm lid among the components');
  const small = comps.slice(1).filter((c) => c !== lid0).map((c) => ({ c, bb: bboxOf(c.pos) }));
  const sites = []; for (const s of small.sort((a, b) => a.bb.centre[1] - b.bb.centre[1])) { const site = sites.find((x) => Math.abs(x[0].bb.centre[1] - s.bb.centre[1]) < 3); if (site) site.push(s); else sites.push([s]); }
  if (sites.length !== 2 || sites.some((x) => x.length !== 2)) throw new Error('the four lens pieces do not form two stacks');
  const stacks = sites.map((pair) => { pair.sort((a, b) => a.bb.lo[2] - b.bb.lo[2]); return { capSrc: pair[0].c, holderSrc: pair[1].c }; });   // the lower piece is the outer dome cap

  // ---- 2 repair
  // body + clip: back-to-back faces, then the pip base membranes (mat2 faces lying in the +x wall plane)
  const co = dropCoincident(body0.tris);
  const planeCount = new Map(); for (const t of co.tris) { if (t.mat !== 'mat2') continue; const n = faceN(body0.pos, ...t.v); if (Math.abs(n[0]) > 0.99 && t.v.every((v) => Math.abs(body0.pos[v * 3] - body0.pos[t.v[0] * 3]) < 0.02)) { const k = body0.pos[t.v[0] * 3].toFixed(2); planeCount.set(k, (planeCount.get(k) || 0) + 1); } }
  const wallX = +[...planeCount].sort((a, b) => b[1] - a[1])[0][0];
  const isMembrane = (t) => t.mat === 'mat2' && t.v.every((v) => Math.abs(body0.pos[v * 3] - wallX) < 0.02);
  const membranes = co.tris.filter(isMembrane); const kept = co.tris.filter((t) => !isMembrane(t));
  const bodyIdxAll = Uint32Array.from(kept.flatMap((t) => t.v)); const shells = edgeShells(bodyIdxAll);
  if (shells.length !== 2) throw new Error(`body+clip split into ${shells.length} shells after the membranes went (expected 2)`);
  log(`body+clip: ${body0.tris.length} tris; removed ${co.pairs} back-to-back pairs (${co.pairs * 2} tris), ${co.dups} duplicates, ${membranes.length} pip base membranes at x = ${wallX}; ${shells.length} shells (${shells.map((s) => s.length).join(' + ')} tris)`);
  const comp = (r, cmp) => { const c = compact(r.pos, r.idx); return { ...r, pos: c.pos, idx: c.idx }; };
  const body = comp(repairShell('body', body0.pos, subIdx(bodyIdxAll, shells[0]), `pips merged into the wall (${membranes.length} membrane tris removed)`));
  const clip = comp(repairShell('clip', body0.pos, subIdx(bodyIdxAll, shells[1]), 'was welded to the body by one vertex; its own shell'));
  const lid = comp(repairShell('lid', lid0.pos, Uint32Array.from(lid0.tris.flatMap((t) => t.v)), 'linen texture dropped'));
  const lens = stacks.map((s, i) => ({
    capRaw: s.capSrc.tris.length, holderRaw: s.holderSrc.tris.length,
    cap: comp(repairShell(`cap-${i}`, s.capSrc.pos, Uint32Array.from(s.capSrc.tris.flatMap((t) => t.v)), 'open sheet: rim closed with a fan')),
    holder: comp(repairShell(`holder-${i}`, s.holderSrc.pos, Uint32Array.from(s.holderSrc.tris.flatMap((t) => t.v)), 'open sheet: rim loops closed with fans')),
  }));
  const all = [body, clip, lid, ...lens.flatMap((l) => [l.cap, l.holder])]; for (const r of all) rep.push(r);
  log('\nREPAIR  part        tris before -> after   open/non-manifold before   loops closed (+tris)  slivers split  volume mm3');
  for (const r of rep) log('       ', r.name.padEnd(10), `${String(r.before.tris).padStart(5)} -> ${String(r.after.tris).padStart(5)}`.padEnd(22), `${r.before.open}/${r.before.nonManifold}`.padEnd(26), `${r.loopsClosed} (+${r.trisAdded})`.padEnd(21), String(r.slivers).padEnd(14), r.volumeMm3.toFixed(1), r.note ? ' ' + r.note : '');

  // ---- 3 assemble: rigid translations only
  const bodyBox = usedBBox(body.pos, body.idx); const bedZ = bodyBox.lo[2];
  const lidFit = fitLid(body, lid);
  const lidT = [lidFit.dx, lidFit.dy, lidFit.dz];
  log(`\nASSEMBLE lid  plug profile slid over the mouth profile (${lidFit.samples} heights): best dz ${lidFit.dz.toFixed(4)}, width mismatch rms ${(lidFit.profileRmsMm * 1000).toFixed(1)} um, max ${(lidFit.profileMaxMm * 1000).toFixed(1)} um; centre dx ${lidFit.dx.toFixed(4)} dy ${lidFit.dy.toFixed(4)}`);
  log(`         flange underside z ${lidFit.flangeZ.toFixed(3)} -> ${(lidFit.flangeZ + lidFit.dz).toFixed(3)} against the rim at ${lidFit.rimZ.toFixed(3)}: seated within ${(Math.abs(lidFit.flangeResidual) * 1000).toFixed(1)} um`);

  // bed holes: circles in the bed plane; bore radius from the ring one millimetre in
  const holes = planarLoops(body.pos, body.idx, 2, bedZ).filter(isCircle).map((l) => {
    const c = l.centre; const rs = []; for (let i = 0; i < body.pos.length; i += 3) { const z = body.pos[i + 2]; if (Math.abs(z - (bedZ + 1)) < 0.05) { const r = Math.hypot(body.pos[i] - c[0], body.pos[i + 1] - c[1]); if (r < l.r - 0.05) rs.push(r); } }
    return { c, mouth: l.r, bore: Math.max(...rs) };
  }).sort((a, b) => a.bore - b.bore);
  if (holes.length !== 2) throw new Error(`expected two round holes in the bed pad, found ${holes.length}`);
  for (const l of lens) { const bb = usedBBox(l.cap.pos, l.cap.idx); l.c = [bb.centre[0], bb.centre[1]]; l.r = 0; for (const v of new Set(l.cap.idx)) l.r = Math.max(l.r, Math.hypot(l.cap.pos[v * 3] - l.c[0], l.cap.pos[v * 3 + 1] - l.c[1])); l.minZ = bb.lo[2]; }
  lens.sort((a, b) => a.r - b.r);
  log('         bed holes (mouth r / bore r / centre) and lens caps (r / centre):');
  const lensT = lens.map((l, i) => {
    const h = holes[i]; const swapped = holes[1 - i]; const t = [h.c[0] - l.c[0], h.c[1] - l.c[1], bedZ - l.minZ];
    log(`           hole ${i}: mouth ${h.mouth.toFixed(3)} bore ${h.bore.toFixed(3)} at (${h.c.map((v) => v.toFixed(3))})   cap ${i}: r ${l.r.toFixed(3)} at (${l.c.map((v) => v.toFixed(3))}) -> clearance ${(h.bore - l.r).toFixed(3)} mm (swapped: ${(swapped.bore - l.r).toFixed(3)} mm: ${swapped.bore - l.r < 0 ? 'does not fit' : 'would fit loosely'})   shift (${t.map((v) => v.toFixed(3))})`);
    if (h.bore - l.r < 0) throw new Error('a lens cap does not fit its bore');
    return t;
  });

  // front LED holes: the two circles in the front plane (x = body min) and the rings along their axes
  const frontX = bodyBox.lo[0];
  const fronts = ringsAt(body.pos, body.idx, 0, frontX).sort((a, b) => a.centre[0] - b.centre[0]);   // the funnel tip rings, sorted by y
  if (fronts.length !== 2) throw new Error(`expected two round funnel mouths in the front plane, found ${fronts.length}`);
  const ledHoles = fronts.map((f) => {
    const [cy, cz] = f.centre; const rings = new Map();
    for (let i = 0; i < body.pos.length; i += 3) { const r = Math.hypot(body.pos[i + 1] - cy, body.pos[i + 2] - cz); if (r < 7.2 && body.pos[i] < frontX + 10) { const k = body.pos[i].toFixed(2) + '/' + (Math.round(r * 20) / 20).toFixed(2); rings.set(k, (rings.get(k) || 0) + 1); } }
    const list = [...rings].filter(([, n]) => n >= 20).map(([k]) => k.split('/').map(Number)).sort((a, b) => a[0] - b[0]);   // [x, r]
    const mouth = list[0], boreOut = list.find((q) => q[0] > mouth[0] + 0.1 && q[1] < mouth[1] - 1); const boreIn = list.find((q) => q[0] > boreOut[0] + 0.1 && Math.abs(q[1] - boreOut[1]) < 0.1);
    if (!boreOut || !boreIn) throw new Error('front hole profile not recognised: ' + JSON.stringify(list));
    return { y: cy, z: cz, mouthR: f.r, boreR: boreOut[1], xBoreOut: boreOut[0], xShoulder: boreIn[0], x0: frontX };
  });
  // which LED is which: the white one is farther from the charge port (the red one reads as the charging/status light next to it)
  const usb = planarLoops(body.pos, body.idx, 2, bedZ).find((l) => l.n === 4); const usbY = usb ? usb.centre[1] : bodyBox.hi[1];
  const ledColour = ledHoles.map((h) => (Math.abs(h.y - usbY) < Math.abs(ledHoles.find((o) => o !== h).y - usbY) ? 'red' : 'white'));
  if (SWAP_LEDS) ledColour.reverse();
  log(`         front holes: ${ledHoles.map((h, i) => `y ${h.y.toFixed(3)} z ${h.z.toFixed(3)} mouth r ${h.mouthR.toFixed(2)} (x ${h.x0.toFixed(2)}), bore r ${h.boreR.toFixed(2)} x ${h.xBoreOut.toFixed(2)}..${h.xShoulder.toFixed(2)} -> ${ledColour[i]}`).join(' | ')}; USB slot y ${usbY.toFixed(2)}`);

  // build every placed solid in the source frame (mm)
  const placed = [];   // {name, pos, idx, base (print base z after placement), mat, hidden?}
  const place = (name, r, t, mat, extra = {}) => placed.push({ name, pos: translate(r.pos, t), idx: r.idx, mat, ...extra });
  place('body', body, [0, 0, 0], 'pla-olive', { baseZ: bedZ, kind: 'solid' });
  place('clip', clip, [0, 0, 0], 'pla-olive', { baseZ: bedZ, kind: 'solid', grow: GROW });
  place('lid', lid, lidT, 'pla-olive', { baseZ: lidFit.lidMinZ + lidFit.dz, kind: 'solid', grow: GROW });
  lens.forEach((l, i) => {
    place(`cap-${i}`, l.cap, lensT[i], 'lens-clear', { baseZ: bedZ, kind: 'solid' });
    place(`holder-${i}`, l.holder, lensT[i], 'pla-olive', { baseZ: bedZ, kind: 'hidden' });
    // the cap tapers (r 3.8 at z 1.0 to 3.5 at z 2.0 for the big one), so the ring's inner edge follows the cap wall, 0.03 mm inside it
    const h = holes[i]; const lv = new Map(); for (const v of new Set(l.cap.idx)) { const z = +(l.cap.pos[v * 3 + 2] + lensT[i][2] - bedZ).toFixed(3); const r = Math.hypot(l.cap.pos[v * 3] + lensT[i][0] - h.c[0], l.cap.pos[v * 3 + 1] + lensT[i][1] - h.c[1]); lv.set(z, Math.max(lv.get(z) || 0, r)); }
    const env = [...lv].sort((a, b) => a[0] - b[0]); const capR = (z) => { for (let k = 0; k + 1 < env.length; k++) if (z >= env[k][0] && z <= env[k + 1][0]) return env[k][1] + (env[k + 1][1] - env[k][1]) * (z - env[k][0]) / (env[k + 1][0] - env[k][0]); return env[env.length - 1][1]; };
    const [z0, z1] = SEAT_Z; const ring = lathe([[capR(z0) - SEAT_OVERLAP, bedZ + z0], [h.bore + SEAT_OVERLAP, bedZ + z0], [h.bore + SEAT_OVERLAP, bedZ + z1], [capR(z1) - SEAT_OVERLAP, bedZ + z1]], [h.c[0], h.c[1], 0], [0, 0, 1]);
    placed.push({ name: `seat-${i}`, pos: ring.pos, idx: ring.idx, mat: 'pla-olive', baseZ: bedZ, kind: 'solid', helper: true });
  });
  const leds = ledHoles.map((h, i) => {
    const R = LED_R, apexX = h.x0 + LED_RECESS, hBo = h.xBoreOut - apexX, hSh = h.xShoulder - apexX, Rc = h.boreR + SEAT_OVERLAP;
    const rs = (hh) => Math.sqrt(Math.max(0, R * R - (R - hh) * (R - hh)));
    const prof = [[0, 0]]; const arc = (h0, h1, n) => { for (let k = 1; k <= n; k++) { const hh = h0 + (h1 - h0) * k / n; prof.push([rs(hh), hh]); } };
    const h1 = hBo + 0.05, h2 = hSh - 0.05; arc(0, h1, 7); prof.push([Rc, h1], [Rc, h2], [rs(h2), h2]); arc(h2, R, 3); prof.push([R, R + 1.2], [0, R + 1.2]);
    const mesh = lathe(prof, [apexX, h.y, h.z], [1, 0, 0]);
    const name = `led-${ledColour[i]}`; placed.push({ name, pos: mesh.pos, idx: mesh.idx, mat: name, baseZ: bboxOf(mesh.pos).lo[2], kind: 'solid', led: { colour: ledColour[i], apex: [apexX, h.y, h.z], boreR: h.boreR, recess: LED_RECESS } });
    return { name, hole: h };
  });
  const clipRaw = body0.tris.filter((t) => t.mat === 'mat3').length;
  return { placed, rep, bodyBox, bedZ, lidFit, holes, lens, lensT, ledHoles, leds, comps, T0, body, lid, clip, raw: { body: body0.tris.length - clipRaw, clip: clipRaw, lid: lid0.tris.length } };
}

// ---------------------------------------------------------------- hollow + write
const signedVolume = (pos, idx) => { let v = 0; for (let t = 0; t < idx.length; t += 3) v += dot(P(pos, idx[t]), cross(P(pos, idx[t + 1]), P(pos, idx[t + 2]))) / 6; return v; };
/** source frame (x back-to-front inverted, z print axis) -> model frame: (y, -z, -x). A proper rotation. */
const toModel = (p) => [p[1], -p[2], -p[0]];

/**
 * gltfpack 1.3 drops every custom vertex attribute except `_ID` (tried: -kv, -c, any name or width). The height rides through the packer as `_ID`
 * (float, untouched) and is renamed `_PRINTZ` in the JSON chunk afterwards; the binary chunk is not touched.
 */
function renameAttribute(file, from, to) {
  const b = fs.readFileSync(file); const jl = b.readUInt32LE(12); const json = JSON.parse(b.slice(20, 20 + jl).toString('utf8'));
  let n = 0; for (const m of json.meshes) for (const p of m.primitives) if (from in p.attributes) { p.attributes[to] = p.attributes[from]; delete p.attributes[from]; n++; }
  if (!n) throw new Error(`gltfpack lost ${from}`);
  let js = Buffer.from(JSON.stringify(json)); js = Buffer.concat([js, Buffer.alloc((4 - (js.length % 4)) % 4, 0x20)]);
  const rest = b.slice(20 + jl); const head = Buffer.from(b.slice(0, 20)); head.writeUInt32LE(js.length, 12); head.writeUInt32LE(12 + 8 + js.length + rest.length, 8);
  fs.writeFileSync(file, Buffer.concat([head, js, rest])); return n;
}
function pack(raw, out) {
  const r = spawnSync(GLTFPACK, ['-i', raw, '-o', out, '-c', '-ce', 'ext', '-kn', '-km', '-ke', '-kv', '-vpf', '-vn', '8'], { encoding: 'utf8' });
  if (r.status !== 0) throw new Error('gltfpack failed: ' + r.stderr + r.stdout);
  return renameAttribute(out, '_ID', '_PRINTZ');
}
function inspectGlb(file) {   // what a loader would see, from the JSON alone
  const b = fs.readFileSync(file); const jl = b.readUInt32LE(12); const j = JSON.parse(b.slice(20, 20 + jl).toString('utf8'));
  const prims = j.meshes.flatMap((m) => m.primitives); const tris = prims.reduce((s, p) => s + j.accessors[p.indices].count / 3, 0);
  return { primitives: prims.length, triangles: tris, vertices: prims.reduce((s, p) => s + j.accessors[p.attributes.POSITION].count, 0), attributes: [...new Set(prims.flatMap((p) => Object.keys(p.attributes)))], materials: prims.map((p) => j.materials[p.material].name), nodes: j.nodes.map((n) => n.name).filter(Boolean), extensions: j.extensionsRequired };
}

async function finish(R) {
  const { placed } = R; const wasm = await loadManifold();
  const solids = placed.filter((p) => p.kind === 'solid'); const hiddenParts = placed.filter((p) => p.kind === 'hidden');
  // ---- contact checks on the assembled, ungrown parts
  log('\nCONTACT  penetration of one part into another (um; vertices and triangle centres of A tested against closed B; seat rings are fillers and overlap by design)');
  const byName = Object.fromEntries(placed.map((p) => [p.name, p])); const pairs = [['lid', 'body'], ['clip', 'body'], ['cap-0', 'body'], ['cap-1', 'body'], ['led-white', 'body'], ['led-red', 'body'], ['cap-0', 'cap-1'], ['holder-0', 'body'], ['holder-1', 'body']];
  let worst = 0;
  for (const [a, b] of pairs) { const x = penetration(byName[a], byName[b]), y = penetration(byName[b], byName[a]); const d = Math.max(x.depthMm, y.depthMm); worst = Math.max(worst, d); log(`         ${a.padEnd(10)} / ${b.padEnd(5)} ${a} into ${b}: ${(x.depthMm * 1000).toFixed(1)} (${x.inside} samples)   ${b} into ${a}: ${(y.depthMm * 1000).toFixed(1)} (${y.inside})`); }
  log(`         worst: ${(worst * 1000).toFixed(1)} um (limit 50). The holders sit inside the bowl that the cap sheet describes; closing the sheet into a solid dome puts 0.8-1.0 mm of holder inside it, which is hidden and never output.`);

  // ---- recentre on the source bounding box so float32 stays exact
  const lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9]; for (const p of placed) for (let i = 0; i < p.pos.length; i += 3) for (let d = 0; d < 3; d++) { lo[d] = Math.min(lo[d], p.pos[i + d]); hi[d] = Math.max(hi[d], p.pos[i + d]); }
  const C = lo.map((v, d) => Math.round((v + hi[d]) / 2));
  const prep = solids.map((p) => {
    const nV = p.pos.length / 3; const pz = new Float64Array(nV); for (let i = 0; i < nV; i++) pz[i] = p.pos[i * 3 + 2] - p.baseZ;
    const src = p.grow ? growMesh(p.pos, p.idx, p.grow) : p.pos; const vp = new Float32Array(nV * 4);
    for (let i = 0; i < nV; i++) { vp[i * 4] = src[i * 3] - C[0]; vp[i * 4 + 1] = src[i * 3 + 1] - C[1]; vp[i * 4 + 2] = src[i * 3 + 2] - C[2]; vp[i * 4 + 3] = pz[i]; }
    return { p, vp };
  });
  const base = wasm.Manifold.reserveIDs(prep.length);
  const mans = prep.map(({ p, vp }, i) => {
    const m = wasm.Manifold.ofMesh(new wasm.Mesh({ numProp: 4, vertProperties: vp, triVerts: Uint32Array.from(p.idx), runIndex: Uint32Array.from([0]), runOriginalID: Uint32Array.from([base + i]) }));
    if (m.status() !== 'NoError') throw new Error(`manifold rejected ${p.name}: ${m.status()}`);
    return m;
  });
  const uni = wasm.Manifold.union(mans); if (uni.status() !== 'NoError') throw new Error('union failed: ' + uni.status());
  const um = uni.getMesh(); const nUT = um.triVerts.length / 3; const nUV = um.vertProperties.length / 4;
  const uPos = new Float64Array(nUV * 3), uPz = new Float64Array(nUV);
  for (let i = 0; i < nUV; i++) { uPos[i * 3] = um.vertProperties[i * 4]; uPos[i * 3 + 1] = um.vertProperties[i * 4 + 1]; uPos[i * 3 + 2] = um.vertProperties[i * 4 + 2]; uPz[i] = um.vertProperties[i * 4 + 3]; }
  const triPart = new Int32Array(nUT); for (let r = 0; r < um.runOriginalID.length; r++) for (let t = um.runIndex[r] / 3; t < um.runIndex[r + 1] / 3; t++) triPart[t] = um.runOriginalID[r] - base;
  const partTris = prep.map(() => 0); for (const k of triPart) partTris[k]++;
  log(`\nUNION    manifold-3d: ${mans.map((m, i) => `${prep[i].p.name} ${m.volume().toFixed(1)}`).join(', ')} mm3 -> union ${uni.volume().toFixed(1)} mm3, ${nUT} triangles`);
  // shells are taken on positions (the 4th property splits vertices along part seams, which cuts the index topology there)
  const wd = weld(uPos, 1e-5); const wIdx = Uint32Array.from(um.triVerts, (v) => wd.idx[v]);
  const comps = edgeShells(wIdx); const voidTris = new Uint8Array(nUT); let voids = 0, voidT = 0;
  const info = comps.map((tl) => { const v = signedVolume(wd.pos, subIdx(wIdx, tl)); if (v < 0) { voids++; voidT += tl.length; for (const t of tl) voidTris[t] = 1; } return { n: tl.length, v }; });
  log(`         ${comps.length} shell(s): ${info.map((c) => `${c.n} tris ${c.v.toFixed(1)} mm3`).join(' | ')}; enclosed void shells dropped: ${voids} (${voidT} tris)`);

  // ---- visibility: union triangles plus the hidden holders, which are occluders AND candidates (what a port or a gap lets you see of them is kept)
  const hPos = [], hPz = [], hIdx = [], hPart = []; let hv = nUV;
  for (const h of hiddenParts) { const pos = translate(h.pos, [-C[0], -C[1], -C[2]]); for (let i = 0; i < pos.length; i += 3) { hPos.push(pos[i], pos[i + 1], pos[i + 2]); hPz.push(h.pos[i + 2] - h.baseZ); } for (const v of h.idx) hIdx.push(v + hv); hv += pos.length / 3; for (let t = 0; t < h.idx.length / 3; t++) hPart.push(h.name); }
  const allPos = Float64Array.from([...uPos, ...hPos]), allPz = Float64Array.from([...uPz, ...hPz]); const nCandU = []; for (let t = 0; t < nUT; t++) if (!voidTris[t]) nCandU.push(t);
  const candIdx = new Uint32Array(nCandU.length * 3 + hIdx.length); nCandU.forEach((t, k) => candIdx.set(um.triVerts.subarray(t * 3, t * 3 + 3), k * 3)); candIdx.set(hIdx, nCandU.length * 3);
  const soup = triSoup(allPos, candIdx); const t1 = Date.now();
  const vis = visibleFromOutside(soup, soup.length / 9, fibonacci(DIRS), fibonacci(DIRS * 2));
  const keptU = [], keptH = new Map(); nCandU.forEach((t, k) => { if (vis.vis[k]) keptU.push(t); }); hPart.forEach((nm, j) => { if (vis.vis[nCandU.length + j]) keptH.set(nm, (keptH.get(nm) || 0) + 1); });
  const holderVis = [...keptH.values()].reduce((a, b) => a + b, 0);
  log(`VISIBLE  ${nCandU.length + hPart.length} candidate triangles (${nCandU.length} union + ${hPart.length} holder). ${DIRS} directions x 4 sample points reach ${vis.first}; a second pass (${DIRS * 2} directions x 2 points, for deep openings) adds ${vis.second}; ${vis.degenerate} degenerate. Kept ${keptU.length} union + ${holderVis} holder, dropped ${nCandU.length + hPart.length - keptU.length - holderVis}  (${((Date.now() - t1) / 1000).toFixed(1)} s)`);

  // ---- per-part table
  const survive = prep.map(() => 0); for (const t of keptU) survive[triPart[t]]++;
  log('\nTRIANGLES  part         raw OBJ -> repaired -> after union -> visible');
  const rows = [['body', R.raw.body], ['clip', R.raw.clip], ['lid', R.raw.lid]]; R.lens.forEach((l, i) => rows.push([`cap-${i}`, l.capRaw], [`holder-${i}`, l.holderRaw]));
  rows.push(['seat-0', 0], ['seat-1', 0], ['led-white', 0], ['led-red', 0]);
  let tR = 0, tP = 0, tU = 0, tV = 0; const repTri = (name) => placed.find((p) => p.name === name).idx.length / 3;
  for (const [name, raw] of rows) {
    const k = prep.findIndex((q) => q.p.name === name); const rp = repTri(name); const un = k >= 0 ? partTris[k] : 0; const vs = k >= 0 ? survive[k] : (keptH.get(name) || 0);
    tR += raw; tP += rp; tU += un; tV += vs;
    log('          ', name.padEnd(12), (raw ? String(raw) : 'new').padStart(7), '->', String(rp).padStart(6), '->', (k >= 0 ? String(un) : 'not unioned').padStart(12), '->', String(vs).padStart(6), name.startsWith('seat') ? ' (hidden filler)' : name.startsWith('led') ? ' (new geometry)' : k < 0 ? ' (hidden: only what a gap shows)' : '');
  }
  log('          ', 'TOTAL'.padEnd(12), String(tR).padStart(7), '->', String(tP).padStart(6), '->', String(tU).padStart(12), '->', String(tV).padStart(6));

  // ---- model frame, recentred, metres; one primitive per material
  const keptV = new Set(); for (const t of keptU) for (let c = 0; c < 3; c++) keptV.add(um.triVerts[t * 3 + c]);
  const mlo = [1e9, 1e9, 1e9], mhi = [-1e9, -1e9, -1e9]; for (const v of keptV) { const q = toModel(P(uPos, v)); for (let d = 0; d < 3; d++) { mlo[d] = Math.min(mlo[d], q[d]); mhi[d] = Math.max(mhi[d], q[d]); } }
  const mc = mlo.map((v, d) => +((v + mhi[d]) / 2).toFixed(4));
  const mapPos = (flat) => { const o = new Float64Array(flat.length); for (let i = 0; i < flat.length; i += 3) { const q = toModel([flat[i], flat[i + 1], flat[i + 2]]); for (let d = 0; d < 3; d++) o[i + d] = (q[d] - mc[d]) * MM; } return o; };
  const posM = mapPos(allPos), pzM = Float64Array.from(allPz, (v) => v * MM);
  const tris = []; for (const t of keptU) tris.push({ mat: prep[triPart[t]].p.mat, v: [um.triVerts[t * 3], um.triVerts[t * 3 + 1], um.triVerts[t * 3 + 2]] });
  hPart.forEach((nm, j) => { if (vis.vis[nCandU.length + j]) tris.push({ mat: byName[nm].mat, v: [hIdx[j * 3], hIdx[j * 3 + 1], hIdx[j * 3 + 2]] }); });
  const groups = []; for (const mat of MATERIALS.map((m) => m.name)) { const tl = tris.filter((t) => t.mat === mat); if (tl.length) groups.push({ mat, idx: Uint32Array.from(tl.flatMap((t) => t.v)) }); }
  const g = new Glb(); const root = g.node({ name: 'ci-clop', children: [] });
  const mesh = g.mesh('ci-clop-shell', groups.map((q) => toGroup(q.mat, posM, pzM, q.idx)));
  g.json.nodes[root].children.push(g.node({ name: 'ci-clop-shell', mesh, extras: { printAttribute: '_PRINTZ', printAxis: 'per vertex: height along the original part\'s print axis, metres, bed = 0. Body and clip: the box z (the bed pad is the bed face), lid: its own z from the plug bottom. Caps, LEDs and fillers carry their own local height and are not printed.', layerHeightM: 0.0002 } }));
  const ledNodes = [];
  for (const p of placed.filter((q) => q.led)) { const a = toModel([p.led.apex[0] - C[0], p.led.apex[1] - C[1], p.led.apex[2] - C[2]]).map((v, d) => +((v - mc[d]) * MM).toPrecision(8)); ledNodes.push({ name: p.name, at: a }); g.json.nodes[root].children.push(g.node({ name: p.name, translation: a, rotation: [0, 0, 0, 1], extras: { role: 'led', colour: p.led.colour, axis: '+Z points out of the front face', domeRadiusM: LED_R * MM, boreRadiusM: +(p.led.boreR * MM).toFixed(7), apexRecessM: LED_RECESS * MM, note: 'apex of the 5 mm LED dome; it sits in a funnel, so a glow belongs just behind the front plane' } })); }
  g.json.nodes[root].extras = {
    units: 'metres', frame: 'Y up; +Z = front (the face with the two LED funnels); +Y = the flat bed pad with the two lens bores and the USB slot (the face that shows on top in the photographs); +X = the USB end; -Y = the lid (the text face); -Z = the belt clip',
    source: 'Ci-clop-dirty.obj (ImageToStl of the SketchUp model, inches), assembled and hollowed by lab/tools/ciclop-build.mjs: every triangle no ray from outside reaches is gone',
    material: 'olive PLA, 0.20 mm layers (_PRINTZ per vertex), clear lens caps in the bed pad, two 5 mm LEDs (white, red) in the front funnels',
    ledRule: 'red = the LED nearer the USB slot (the charge/status light), white = the far one; --swap-leds flips it',
  };
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  const rawOut = OUT.replace(/\.glb$/, '.raw.glb'); fs.writeFileSync(rawOut, g.toBuffer(['_PRINTZ', '_ID']));
  if (!NOPACK) pack(rawOut, OUT); const rawBytes = fs.statSync(rawOut).size; if (!NOPACK) fs.unlinkSync(rawOut);
  const final = NOPACK ? rawOut : OUT; const ins = inspectGlb(final); const size = mhi.map((v, d) => (v - mlo[d]).toFixed(2));
  log(`\nOUTPUT   ${ins.triangles} triangles, ${ins.vertices} vertices, ${ins.primitives} primitives = ${ins.primitives} draw calls (${ins.materials.join(', ')}), attributes ${ins.attributes.join(' ')}, bbox mm (x y z) ${size.join(' x ')}`);
  log(`         bytes: raw ${rawBytes}, packed ${NOPACK ? 'not packed' : fs.statSync(OUT).size} -> ${final}; nodes: ${ins.nodes.join(', ')}`);

  // ---- --parts: every part closed and repaired, assembled, NOT hollowed or unioned, for an exploded view later
  if (WANT_PARTS) {
    const gp = new Glb(); const pr = gp.node({ name: 'ci-clop-parts', children: [], extras: { units: 'metres', frame: 'same as ci-clop-mark.glb', note: 'every part a closed 2-manifold, assembled by rigid translation, not hollowed; node translation = the part\'s bbox centre, so an exploded view moves nodes and nothing else; _PRINTZ per vertex as in the merged model' } });
    for (const p of placed.filter((q) => !q.helper)) {
      const pos = mapPos(translate(p.pos, [-C[0], -C[1], -C[2]])); const pz = new Float64Array(p.pos.length / 3); for (let i = 0; i < pz.length; i++) pz[i] = (p.pos[i * 3 + 2] - p.baseZ) * MM;
      const bb = bboxOf(pos); const loc = new Float64Array(pos.length); for (let i = 0; i < pos.length; i += 3) for (let d = 0; d < 3; d++) loc[i + d] = pos[i + d] - bb.centre[d];
      const me = gp.mesh(p.name, [toGroup(p.mat, loc, pz, p.idx)]);
      gp.json.nodes[pr].children.push(gp.node({ name: p.name, mesh: me, translation: bb.centre.map((v) => +v.toPrecision(9)), extras: { part: true, hidden: p.kind === 'hidden', material: p.mat } }));
    }
    for (const q of ledNodes) gp.json.nodes[pr].children.push(gp.node({ name: q.name + '-glow', translation: q.at, rotation: [0, 0, 0, 1], extras: { role: 'led' } }));
    const rawP = PARTS_OUT.replace(/\.glb$/, '.raw.glb'); fs.writeFileSync(rawP, gp.toBuffer(['_PRINTZ', '_ID'])); if (!NOPACK) { pack(rawP, PARTS_OUT); fs.unlinkSync(rawP); }
    const pf = NOPACK ? rawP : PARTS_OUT; const pi = inspectGlb(pf);
    log(`PARTS    ${placed.filter((q) => !q.helper).length} parts, ${pi.triangles} triangles, ${pi.primitives} draw calls -> ${pf} (${fs.statSync(pf).size} B)`);
  }
  return { ins };
}

main().then(async (R) => {
  await finish(R); if (REF) { const r = await refCheck(REF, R.lid, R.body, R.lidFit, { ledHoles: R.ledHoles }); if (r) log('\nREF      the sealed previous revision, registered against the export: ' + JSON.stringify(r, null, 1).replace(/\n\s*/g, ' ')); }
  log(`done in ${((Date.now() - R.T0) / 1000).toFixed(1)} s`);
}).catch((e) => { console.error(e); process.exit(1); });
