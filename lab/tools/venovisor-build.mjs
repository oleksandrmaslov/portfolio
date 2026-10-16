#!/usr/bin/env node
/*
 * Venovisor hero model, rebuilt from its real sources.
 *
 *   node lab/tools/venovisor-build.mjs [--stl DIR] [--obj FILE] [--out FILE] [--gltfpack BIN] [--vn BITS (8)] [--vp BITS] [--without usb-cover]
 *                                      [--parts] [--no-prune] [--grow MM (0)] [--views N (600)] [--min-area MM2 (0.05)]
 *   default output: ONE merged, hollow mesh (see 'Hollow output' below). --parts: the per-part build, one node per printed part, internals intact (for an exploded view)
 *   needs <SCRATCH>/tools: npm i --prefix <SCRATCH>/tools manifold-3d gltfpack @gltf-transform/core @gltf-transform/extensions @gltf-transform/functions meshoptimizer
 *   (SCRATCH defaults to $TMPDIR/materialize). The merged model is packed by pack-glb.mjs because gltfpack drops _PRINTZ; --parts uses gltfpack as before.
 *   (--vp 14 quantises positions: 99 KB instead of 121 KB, but the node then carries a scale and local position is no longer metres)
 *
 * Sources (read-only):
 *   - Venovisor-v1.1/*.stl   the five printed parts, binary STL, millimetres, one closed shell each
 *   - "Venovisor In assembly.obj"  a converter's OBJ of the assembled device (inches, 5.5k unwelded
 *     fragments). Used ONLY to recover where each part sits: every STL is registered to it by matching
 *     triangle edge-length signatures (RANSAC over rigid candidates), then refined and measured.
 *     It contains the same 15.8k triangles as the five STLs and nothing else (no battery/PCB/screws).
 *
 * What it does, per part:
 *   1. read + weld (1e-4 mm) + repair the zero-area sliver triangles the CAD export leaves behind
 *      (collinear T-junction fillers; the neighbour across the long edge is split instead, so the
 *      mesh stays watertight and no sliver survives)
 *   2. make the winding consistent and outward (Button Cover D160 ships 430 flipped triangles)
 *   3. move it into its PRINT frame: axes as sliced, Z = build direction, origin = bed-contact corner of
 *      the bounding box. Four STLs already are in print orientation; the Cover is not (it is stored
 *      lid-up, Bambu Studio prints it plate-down: KIT x4.3mf rotates it 180 deg about Y), so it is
 *      flipped here. The node transform carries the assembly placement: node = registration * print frame.
 *   4. creased normals (30 deg), vertices split along creases
 *   5. LED lenses: 8 shallow domes seated in the 8 holes of the C-head (found in the Case geometry)
 * Hollow output (the default): the four printed parts are one boolean union (manifold-3d; each vertex carries its part's print-z as a 4th property so the
 * union interpolates it across the cuts, and runOriginalID keeps each triangle's part, hence its material). Enclosed void shells are dropped, then every triangle
 * that nothing outside can see is dropped (lab/tools/hollow-prune.mjs: z-buffer renders from 600 directions plus ray escapes with refinement, judged on the
 * assembled model with the lenses opaque). Kept: every visible surface and opening (8 LED bore walls, button bore, C-head gap, strap loop, screw holes, the
 * port) and the LED lenses as their own primitive. ONE mesh, one primitive per material. Every vertex carries _PRINTZ = its height in metres along ITS
 * ORIGINAL part's print axis (bed = 0); lab/studio.js tpuPrinted reads it. Seam vertices exist once per side because print-z differs across a seam.
 * Prove it with lab/tools/hollow-prove.mjs (per-part GLB vs hollow GLB: pixel diff from hundreds of directions, plus surface distance).
 *
 * Then writes a raw GLB (metres, glTF Y-up = the OBJ frame, recentred on its bbox) and packs it with
 * gltfpack -c (EXT_meshopt_compression + KHR_mesh_quantization; positions stay float so the local
 * frame is exact metres and a shader can read layer height straight off position.z).
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import os from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { findHidden } from './hollow-prune.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '../..');
const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 ? argv[i + 1] : d; };
const SCRATCH = process.env.SCRATCH || path.join(os.tmpdir(), 'materialize');   // gltfpack lives in <SCRATCH>/tools: npm i --prefix <SCRATCH>/tools gltfpack
const STL_DIR = arg('stl');
if (!STL_DIR || !fs.existsSync(STL_DIR)) { console.error('venovisor-build: pass --stl <folder with the five print STLs: Case, Cover, Cover-round, Button cover, USB cover> (the Venovisor-v1.1 delivery; not in the repo)'); process.exit(1); }
const OBJ_FILE = arg('obj', path.join(REPO, 'venovisor model/ImageToStl.com_Venovisor+In+assembly/Venovisor In assembly.obj'));
const OUT = arg('out', path.join(REPO, 'lab/models/venovisor-mark.glb'));
const GLTFPACK = arg('gltfpack', process.env.GLTFPACK || path.join(SCRATCH, 'tools/node_modules/.bin/gltfpack'));
const MM = 1e-3; // glTF is metres

// ---------------------------------------------------------------- finish constants
// White-balanced against white paper (table photo: bag insert; arm photo: syringe wrapper) and averaged:
//   table photo  cover   (147,148,103) / paper (193,192,204) -> G-normalised (0.99, 1, 0.66)
//   arm photo    shank   (145,122, 75) / paper (214,203,200) -> G-normalised (1.13, 1, 0.62)
//   button       table (211,180,152)/(193,192,204) = (1.16,1,0.79); arm (184,134,87)/(214,203,200) = (1.30,1,0.66)
// Albedo is set to a mid satin olive rather than the photo exposure (both photos are auto-exposed).
const SRGB = { olive: [123, 119, 76], button: [184, 150, 107], led: [214, 150, 142] };
const lin = (c) => c.map((v) => { v /= 255; return +(v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4).toFixed(5); });
const MATERIALS = [
  { name: 'tpu-olive', pbrMetallicRoughness: { baseColorFactor: [...lin(SRGB.olive), 1], metallicFactor: 0, roughnessFactor: 0.55 } },
  { name: 'tpu-button', pbrMetallicRoughness: { baseColorFactor: [...lin(SRGB.button), 1], metallicFactor: 0, roughnessFactor: 0.5 } },
  { name: 'led-red', pbrMetallicRoughness: { baseColorFactor: [...lin(SRGB.led), 1], metallicFactor: 0, roughnessFactor: 0.3 }, emissiveFactor: [1, 0.06, 0.04] },
];
const matIndex = Object.fromEntries(MATERIALS.map((m, i) => [m.name, i]));

const PARTS = [
  { node: 'case', file: 'Venovisor Case.stl', flip: false, material: 'tpu-olive' },
  { node: 'cover', file: 'Venovisor Cover.stl', flip: true, material: 'tpu-olive' },
  { node: 'cover-round', file: 'Venovisor Cover Round.stl', flip: false, material: 'tpu-olive' },
  { node: 'button-cover', file: 'Button Cover D160.stl', flip: false, material: 'tpu-button' },
  { node: 'usb-cover', file: 'USB Cover D160.stl', flip: false, material: 'tpu-olive' },
];

// ---------------------------------------------------------------- small vector helpers
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const len = (a) => Math.hypot(a[0], a[1], a[2]);
const P = (pos, i) => [pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]];
const mulMV = (R, v) => [0, 1, 2].map((i) => R[i * 3] * v[0] + R[i * 3 + 1] * v[1] + R[i * 3 + 2] * v[2]);
const mulMM = (A, B) => { const C = []; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) C.push(A[i * 3] * B[j] + A[i * 3 + 1] * B[3 + j] + A[i * 3 + 2] * B[6 + j]); return C; };

// ---------------------------------------------------------------- STL / OBJ readers
export function readSTL(file) {
  const b = fs.readFileSync(file); const n = b.readUInt32LE(80);
  if (84 + n * 50 !== b.length) throw new Error(`${file}: not a binary STL (${b.length} bytes for ${n} triangles)`);
  const pos = new Float64Array(n * 9); let o = 84;
  for (let i = 0; i < n; i++) { o += 12; for (let k = 0; k < 9; k++) { pos[i * 9 + k] = b.readFloatLE(o); o += 4; } o += 2; }
  return pos;
}
function readObjMm(file) { // global vertex array in mm + triangle list
  const V = []; const tris = [];
  for (const l of fs.readFileSync(file, 'utf8').split('\n')) {
    if (l.startsWith('v ')) { const p = l.split(' '); V.push(+p[1] * 25.4, +p[2] * 25.4, +p[3] * 25.4); }
    else if (l.startsWith('f ')) { const p = l.slice(2).trim().split(/\s+/).map((s) => parseInt(s.split('/')[0]) - 1); for (let k = 1; k + 1 < p.length; k++) tris.push([p[0], p[k], p[k + 1]]); }
  }
  return { V: Float64Array.from(V), tris };
}

// ---------------------------------------------------------------- mesh cleanup
export function weld(pos, tol = 1e-4) {
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
export function dropJunk(pos, idx) {
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
export function orient(pos, idx) {
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
export function repairSlivers(pos, idx) {
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
    const { ni, m, x, y, z } = across(si); if (process.env.DBG) console.log('thin', thin(tris[si]), 'N', thin(tris[ni])); if (process.env.DBG) console.log('guard', guard, 'slivers', open.length, 'si', tris[si].map((v) => P(pos, v).map((c) => c.toFixed(2)).join(',')).join(' | '), 'N', [x, y, z].map((v) => P(pos, v).map((c) => c.toFixed(2)).join(',')).join(' | '), 'm', P(pos, m).map((c) => c.toFixed(2)).join(','));
    tris = tris.filter((_, i) => i !== si && i !== ni); tris.push([x, m, z], [m, y, z]); repaired++;
  }
  return { idx: Uint32Array.from(tris.flat()), repaired };
}

export function edgeStats(idx) {
  const m = new Map(); for (let t = 0; t < idx.length; t += 3) for (let k = 0; k < 3; k++) { const a = idx[t + k], b = idx[t + (k + 1) % 3]; const key = a < b ? a + '_' + b : b + '_' + a; m.set(key, (m.get(key) || 0) + 1); }
  let open = 0, nonManifold = 0; for (const c of m.values()) { if (c === 1) open++; else if (c > 2) nonManifold++; }
  return { open, nonManifold };
}

/** Angle-weighted vertex normals; faces within `creaseDeg` of each other (sharing an edge at the vertex) smooth together, others split the vertex. */
export function creasedNormals(pos, idx, creaseDeg = 30) {
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
        const e1 = sub(b, a), e2 = sub(c, a); if (!(len(e1) * len(e2) > 0)) continue; const w = Math.acos(Math.max(-1, Math.min(1, dot(e1, e2) / (len(e1) * len(e2))))); for (let d = 0; d < 3; d++) n[d] += fn[t][d] * w;
      }
      const l = len(n) || 1; const nv = oPos.length / 3; oPos.push(pos[v * 3], pos[v * 3 + 1], pos[v * 3 + 2]); oNrm.push(n[0] / l, n[1] / l, n[2] / l); oSrc.push(v);
      for (const i of members) { const [t, k] = list[i]; oIdx[t * 3 + k] = nv; }
    }
  }
  return { pos: Float64Array.from(oPos), nrm: Float64Array.from(oNrm), idx: oIdx, src: Uint32Array.from(oSrc) };   // src[o] = the input vertex output vertex o was split from (carries per-vertex attributes)
}

/** Corners (of triangles over 1e-3 mm2) whose vertex normal is zero, NaN, or more than 72 deg off the triangle's own: they render black or lit from behind. */
function normalCorners({ pos, nrm, idx }) {
  let bad = 0, total = 0;
  for (let t = 0; t < idx.length; t += 3) {
    const [a, b, c] = [idx[t], idx[t + 1], idx[t + 2]]; const x = cross(sub(P(pos, b), P(pos, a)), sub(P(pos, c), P(pos, a))); const area = len(x) / 2; if (area < 1e-3) continue;
    for (const v of [a, b, c]) { total++; const n = P(nrm, v); const l = len(n); if (!(l > 0.5) || dot(n, x) / (l * len(x)) < 0.3) bad++; }
  }
  return { bad, total };
}

// ---------------------------------------------------------------- registration to the assembly OBJ
function makeRegistrar(obj) {
  const CELL = 0.5; const grid = new Map(); const seen = new Set(); const pts = [];
  for (let i = 0; i < obj.V.length; i += 3) { const k = [0, 1, 2].map((d) => Math.round(obj.V[i + d] * 1000)).join(','); if (!seen.has(k)) { seen.add(k); pts.push(obj.V[i], obj.V[i + 1], obj.V[i + 2]); } }
  for (let i = 0; i < pts.length; i += 3) { const k = Math.floor(pts[i] / CELL) + ',' + Math.floor(pts[i + 1] / CELL) + ',' + Math.floor(pts[i + 2] / CELL); (grid.get(k) || grid.set(k, []).get(k)).push(i); }
  const nearest = (x, y, z) => { const cx = Math.floor(x / CELL), cy = Math.floor(y / CELL), cz = Math.floor(z / CELL); let best = 1e9, bi = -1; for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) for (let c = -1; c <= 1; c++) for (const i of grid.get((cx + a) + ',' + (cy + b) + ',' + (cz + c)) || []) { const d = Math.hypot(pts[i] - x, pts[i + 1] - y, pts[i + 2] - z); if (d < best) { best = d; bi = i; } } return { d: best, i: bi }; };
  const lens = (a, b, c) => [len(sub(a, b)), len(sub(b, c)), len(sub(c, a))];
  const key = (l) => [...l].sort((x, y) => x - y).map((v) => Math.round(v / 0.02)).join(',');
  const objTris = obj.tris.map((f) => f.map((i) => P(obj.V, i)));
  const sigs = new Map(); objTris.forEach((t, i) => { const l = lens(...t); if (Math.min(...l) < 0.3) return; (sigs.get(key(l)) || sigs.set(key(l), []).get(key(l))).push(i); });
  const frame = (t) => { const e1 = sub(t[1], t[0]); const n = cross(e1, sub(t[2], t[0])); const u = e1.map((v) => v / len(e1)), w = n.map((v) => v / len(n)); return [u, cross(w, u), w]; };
  const rigid = (A, B) => { const fa = frame(A), fb = frame(B); const R = []; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) R.push(fb[0][i] * fa[0][j] + fb[1][i] * fa[1][j] + fb[2][i] * fa[2][j]); const ap = mulMV(R, A[0]); return { R, t: sub(B[0], ap) }; };
  return function register(stl /* Float64Array 9n, STL frame */) {
    const n = stl.length / 9; const tris = []; for (let i = 0; i < n; i++) tris.push([0, 3, 6].map((o) => [stl[i * 9 + o], stl[i * 9 + o + 1], stl[i * 9 + o + 2]]));
    const sample = []; for (let i = 0; i < n; i += Math.max(1, Math.floor(n / 150))) sample.push(tris[i][0]);
    const order = tris.map((_, i) => i).filter((i) => Math.min(...lens(...tris[i])) > 0.5).sort((a, b) => lens(...tris[b]).reduce((x, y) => x + y) - lens(...tris[a]).reduce((x, y) => x + y));
    let best = { inl: -1 };
    for (const ti of order.slice(0, 400)) {
      const cands = sigs.get(key(lens(...tris[ti]))) || []; if (cands.length > 40) continue;
      for (const ci of cands) for (const perm of [[0, 1, 2], [1, 2, 0], [2, 0, 1], [0, 2, 1], [2, 1, 0], [1, 0, 2]]) {
        const B = perm.map((i) => objTris[ci][i]); const la = lens(...tris[ti]), lb = lens(...B); if (la.some((v, i) => Math.abs(v - lb[i]) > 0.05)) continue;
        const tf = rigid(tris[ti], B); let inl = 0; for (const p of sample) { const q = mulMV(tf.R, p).map((v, i) => v + tf.t[i]); if (nearest(...q).d < 0.02) inl++; } if (inl > best.inl) best = { inl, ...tf };
      }
      if (best.inl >= sample.length * 0.9) break;
    }
    if (best.inl < sample.length * 0.9) throw new Error('registration failed');
    // snap the rotation to an exact signed permutation, then refine t as the mean residual to the matched OBJ vertices
    const R = best.R.map((v) => { const r = Math.round(v); if (Math.abs(v - r) > 1e-5) throw new Error('registration rotation is not axis-aligned'); return r; });
    let t = best.t; const verts = []; for (let i = 0; i < stl.length; i += 3) verts.push([stl[i], stl[i + 1], stl[i + 2]]);
    const dedupe = new Map(); for (const v of verts) dedupe.set(v.map((x) => x.toFixed(4)).join(','), v);
    const uniq = [...dedupe.values()];
    for (let it = 0; it < 2; it++) { const res = [0, 0, 0]; for (const v of uniq) { const q = mulMV(R, v).map((x, i) => x + t[i]); const { i } = nearest(...q); for (let d = 0; d < 3; d++) res[d] += pts[i + d] - q[d]; } t = t.map((x, d) => x + res[d] / uniq.length); }
    const dist = uniq.map((v) => nearest(...mulMV(R, v).map((x, i) => x + t[i])).d);
    return { R, t, vertices: uniq.length, rmsUm: Math.sqrt(dist.reduce((s, d) => s + d * d, 0) / dist.length) * 1000, maxUm: Math.max(...dist) * 1000, matched: dist.filter((d) => d < 0.02).length };
  };
}

/** Triangles whose float32 source normal is mostly rounding noise (thinness below 1e-4). Kept: they are the CAD's own tessellation. */
function countNeedles(pos, idx) {
  let n = 0; for (let t = 0; t < idx.length; t += 3) { const [a, b, c] = [P(pos, idx[t]), P(pos, idx[t + 1]), P(pos, idx[t + 2])]; const L = Math.max(len(sub(a, b)), len(sub(b, c)), len(sub(c, a))); if (len(cross(sub(b, a), sub(c, a))) / (L * L) < 1e-4) n++; }
  return n;
}
/** Largest distance from any OBJ vertex to the nearest vertex of the five registered parts: 0 means the OBJ holds nothing the STLs do not. */
function objCoverage(obj, built) {
  const CELL = 0.5; const grid = new Map(); const key = (x, y, z) => Math.floor(x / CELL) + ',' + Math.floor(y / CELL) + ',' + Math.floor(z / CELL);
  for (const b of built) for (let i = 0; i < b.pos.length / 3; i++) { const p = mulMV(b.RS, P(b.pos, i)).map((v, d) => v + b.tAsm[d]); (grid.get(key(...p)) || grid.set(key(...p), []).get(key(...p))).push(p); }
  let worst = 0, unmatched = 0; const seen = new Set();
  for (let i = 0; i < obj.V.length; i += 3) {
    const [x, y, z] = [obj.V[i], obj.V[i + 1], obj.V[i + 2]]; const k = [x, y, z].map((v) => Math.round(v * 1000)).join(','); if (seen.has(k)) continue; seen.add(k);
    let best = 1e9; const [cx, cy, cz] = [Math.floor(x / CELL), Math.floor(y / CELL), Math.floor(z / CELL)];
    for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) for (let c = -1; c <= 1; c++) for (const p of grid.get((cx + a) + ',' + (cy + b) + ',' + (cz + c)) || []) best = Math.min(best, Math.hypot(p[0] - x, p[1] - y, p[2] - z));
    worst = Math.max(worst, best); if (best > 0.02) unmatched++;
  }
  return { vertices: seen.size, worstUm: worst * 1000, unmatched };
}

// ---------------------------------------------------------------- LED holes (found in the Case geometry)
/** Closed boundary loops of the planar faces at z = level whose normal points -z, split into simple cycles. */
function bottomLoops(pos, idx, level) {
  const sel = []; for (let t = 0; t < idx.length; t += 3) if (faceN(pos, idx[t], idx[t + 1], idx[t + 2])[2] < -0.9999 && Math.abs(pos[idx[t] * 3 + 2] - level) < 5e-3) sel.push(t);
  const dir = new Set(); for (const t of sel) for (let k = 0; k < 3; k++) dir.add(idx[t + k] + '_' + idx[t + (k + 1) % 3]);
  const next = new Map(); for (const t of sel) for (let k = 0; k < 3; k++) { const a = idx[t + k], b = idx[t + (k + 1) % 3]; if (!dir.has(b + '_' + a)) (next.get(a) || next.set(a, []).get(a)).push(b); }
  const used = new Set(); const cycles = [];
  for (const [a0, outs] of next) for (const b0 of outs) {
    if (used.has(a0 + '_' + b0)) continue; const loop = [a0]; let b = b0; used.add(a0 + '_' + b0);
    while (b !== a0) { loop.push(b); const nb = (next.get(b) || []).find((c) => !used.has(b + '_' + c)); if (nb === undefined) break; used.add(b + '_' + nb); b = nb; }
    const stack = []; const at = new Map(); for (const v of loop) { if (at.has(v)) { const cyc = stack.splice(at.get(v)); cyc.forEach((x) => at.delete(x)); cycles.push(cyc); } at.set(v, stack.length); stack.push(v); } if (stack.length) cycles.push(stack);
  }
  return cycles;
}
function findLedHoles(pos, idx) {
  const found = [];
  for (const cyc of bottomLoops(pos, idx, 0)) {
    if (cyc.length < 20 || cyc.length > 30) continue; const pts = cyc.map((i) => P(pos, i));
    const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length, cy = pts.reduce((s, p) => s + p[1], 0) / pts.length; const rs = pts.map((p) => Math.hypot(p[0] - cx, p[1] - cy)); const r = rs.reduce((a, b) => a + b) / rs.length;
    if (Math.sqrt(rs.reduce((s, v) => s + (v - r) ** 2, 0) / rs.length) < 0.01 && Math.abs(r - 2.408) < 0.02) found.push({ c: [cx, cy], r });
  }
  if (found.length < 5) throw new Error('could not find the LED holes');
  // They sit on one ring at 36 deg pitch (8 LEDs, assembly guide). Fit the ring through the found centres, predict all 8, verify each in the geometry.
  const mx = found.reduce((s, f) => s + f.c[0], 0) / found.length; const ringCx = mx; // ring is mirror-symmetric about the case axis x = mx
  const ys = found.map((f) => f.c[1]); const ringCy = (Math.min(...ys) + Math.max(...ys)) / 2; // found holes span the ring's y-extent symmetrically
  const R = found.map((f) => Math.hypot(f.c[0] - ringCx, f.c[1] - ringCy)).reduce((a, b) => a + b) / found.length;
  const holes = []; const r = found[0].r;
  for (let k = -1; k <= 6; k++) { // -36 deg ... 216 deg, one tip of the C round to the other
    const a = k * Math.PI / 5; const c = [ringCx + R * Math.cos(a), ringCy + R * Math.sin(a)]; let on = 0;
    for (let i = 0; i < pos.length / 3; i++) { const p = P(pos, i); if (Math.abs(p[2]) < 1e-3 && Math.abs(Math.hypot(p[0] - c[0], p[1] - c[1]) - r) < 0.02) on++; }
    if (on < 20) throw new Error(`predicted LED hole ${k} has only ${on} vertices on its rim`);
    holes.push({ c, angleDeg: k * 36 });
  }
  return { holes, r, ring: { c: [ringCx, ringCy], R } };
}
/** Shallow spherical-cap lens, base on the bore rim, apex proud by h, one-sided (the bore wall hides the rest). Outward = local -Z. */
function lensGeometry(holes, r, h = 0.35, seg = 24, rings = 3) {
  const rho = (r * r + h * h) / (2 * h); const pos = [], nrm = [], idx = [];
  for (const hole of holes) {
    const base = pos.length / 3; const cz = -h + rho; const ring = (theta, ph) => { const x = rho * Math.sin(theta) * Math.cos(ph), y = rho * Math.sin(theta) * Math.sin(ph), z = -(rho * Math.cos(theta)) + cz; return [x, y, z]; };
    const th = Math.asin(r / rho); const push = (p) => { pos.push(hole.c[0] + p[0], hole.c[1] + p[1], p[2]); const n = [p[0], p[1], p[2] - cz]; const l = len(n); nrm.push(n[0] / l, n[1] / l, n[2] / l); };
    push([0, 0, -h]); for (let j = 1; j <= rings; j++) for (let i = 0; i < seg; i++) push(ring(th * j / rings, 2 * Math.PI * i / seg));
    const at = (j, i) => base + 1 + (j - 1) * seg + (i % seg);
    for (let i = 0; i < seg; i++) idx.push(base, at(1, i), at(1, i + 1));
    for (let j = 1; j < rings; j++) for (let i = 0; i < seg; i++) idx.push(at(j, i), at(j + 1, i), at(j + 1, i + 1), at(j, i), at(j + 1, i + 1), at(j, i + 1));
  }
  // wind outward (-Z): flip every triangle whose geometric normal opposes the analytic normal
  for (let t = 0; t < idx.length; t += 3) { const [a, b, c] = [idx[t], idx[t + 1], idx[t + 2]]; if (dot(faceN(Float64Array.from(pos), a, b, c), P(Float64Array.from(nrm), a)) < 0) { idx[t + 1] = c; idx[t + 2] = b; } }
  return { pos: Float64Array.from(pos), nrm: Float64Array.from(nrm), idx: Uint32Array.from(idx) };
}

// ---------------------------------------------------------------- glTF writer (raw GLB, packed afterwards by gltfpack)
function quatFromRot(R) { // exact for the signed-permutation rotations used here
  const tr = R[0] + R[4] + R[8]; let q;
  if (tr > 0) { const s = Math.sqrt(tr + 1) * 2; q = [(R[7] - R[5]) / s, (R[2] - R[6]) / s, (R[3] - R[1]) / s, s / 4]; }
  else if (R[0] > R[4] && R[0] > R[8]) { const s = Math.sqrt(1 + R[0] - R[4] - R[8]) * 2; q = [s / 4, (R[1] + R[3]) / s, (R[2] + R[6]) / s, (R[7] - R[5]) / s]; }
  else if (R[4] > R[8]) { const s = Math.sqrt(1 + R[4] - R[0] - R[8]) * 2; q = [(R[1] + R[3]) / s, s / 4, (R[5] + R[7]) / s, (R[2] - R[6]) / s]; }
  else { const s = Math.sqrt(1 + R[8] - R[0] - R[4]) * 2; q = [(R[2] + R[6]) / s, (R[5] + R[7]) / s, s / 4, (R[3] - R[1]) / s]; }
  return q.map((v) => +v.toFixed(9));
}
class Glb {
  constructor() { this.json = { asset: { version: '2.0', generator: 'lab/tools/venovisor-build.mjs' }, scene: 0, scenes: [{ nodes: [0] }], nodes: [], meshes: [], materials: MATERIALS, accessors: [], bufferViews: [], buffers: [{ byteLength: 0 }] }; this.chunks = []; this.size = 0; }
  view(arr, target) { const buf = Buffer.from(arr.buffer, arr.byteOffset, arr.byteLength); const pad = (4 - (this.size % 4)) % 4; if (pad) { this.chunks.push(Buffer.alloc(pad)); this.size += pad; } this.json.bufferViews.push({ buffer: 0, byteOffset: this.size, byteLength: buf.length, target }); this.chunks.push(buf); this.size += buf.length; return this.json.bufferViews.length - 1; }
  accessor(arr, type, componentType, target, count, minmax) { const a = { bufferView: this.view(arr, target), componentType, count, type }; if (minmax) { const n = type === 'VEC3' ? 3 : 1; a.min = Array(n).fill(Infinity); a.max = Array(n).fill(-Infinity); for (let i = 0; i < arr.length; i++) { const d = i % n; a.min[d] = Math.min(a.min[d], arr[i]); a.max[d] = Math.max(a.max[d], arr[i]); } } this.json.accessors.push(a); return this.json.accessors.length - 1; }
  mesh(name, g, material) { // g: pos/nrm in metres (Float64), idx
    const pos = Float32Array.from(g.pos), nrm = Float32Array.from(g.nrm); const big = pos.length / 3 > 65535; const idx = big ? Uint32Array.from(g.idx) : Uint16Array.from(g.idx);
    const attributes = { POSITION: this.accessor(pos, 'VEC3', 5126, 34962, pos.length / 3, true), NORMAL: this.accessor(nrm, 'VEC3', 5126, 34962, nrm.length / 3) };
    const indices = this.accessor(idx, 'SCALAR', big ? 5125 : 5123, 34963, idx.length);
    this.json.meshes.push({ name, primitives: [{ attributes, indices, material: matIndex[material], mode: 4 }] }); return this.json.meshes.length - 1;
  }
  /** One mesh, one primitive per material. prims: [{ pos, nrm, idx, material, printz? }] (metres; printz = height along the part's own print axis, bed = 0). */
  meshPrims(name, prims) {
    const out = prims.map((g) => {
      const pos = Float32Array.from(g.pos), nrm = Float32Array.from(g.nrm); const big = pos.length / 3 > 65535; const idx = big ? Uint32Array.from(g.idx) : Uint16Array.from(g.idx);
      const attributes = { POSITION: this.accessor(pos, 'VEC3', 5126, 34962, pos.length / 3, true), NORMAL: this.accessor(nrm, 'VEC3', 5126, 34962, nrm.length / 3) };
      if (g.printz) attributes._PRINTZ = this.accessor(Float32Array.from(g.printz), 'SCALAR', 5126, 34962, g.printz.length);
      return { attributes, indices: this.accessor(idx, 'SCALAR', big ? 5125 : 5123, 34963, idx.length), material: matIndex[g.material], mode: 4 };
    });
    this.json.meshes.push({ name, primitives: out }); return this.json.meshes.length - 1;
  }
  node(n) { this.json.nodes.push(n); return this.json.nodes.length - 1; }
  toBuffer() {
    this.json.buffers[0].byteLength = this.size + ((4 - (this.size % 4)) % 4); const bin = Buffer.concat([...this.chunks, Buffer.alloc((4 - (this.size % 4)) % 4)]);
    let js = Buffer.from(JSON.stringify(this.json)); js = Buffer.concat([js, Buffer.alloc((4 - (js.length % 4)) % 4, 0x20)]);
    const head = Buffer.alloc(12); head.write('glTF', 0); head.writeUInt32LE(2, 4); head.writeUInt32LE(12 + 8 + js.length + 8 + bin.length, 8);
    const ch = (len, type) => { const b = Buffer.alloc(8); b.writeUInt32LE(len, 0); b.write(type, 4); return b; };
    return Buffer.concat([head, ch(js.length, 'JSON'), js, ch(bin.length, 'BIN\0'), bin]);
  }
}

// ---------------------------------------------------------------- hollow, merged output
async function loadManifold() {
  const mod = await import(pathToFileURL(path.join(SCRATCH, 'tools/node_modules/manifold-3d/manifold.js')).href).catch(() => { throw new Error('venovisor-build: manifold-3d missing: npm i --prefix <SCRATCH>/tools manifold-3d  (SCRATCH=' + SCRATCH + ')'); });
  const wasm = await mod.default(); wasm.setup(); return wasm;
}
/** Move each vertex of a closed, outward-wound mesh out by d along its angle-weighted normal, mitred so that every incident face moves by about d (cap 2.5x at sharp edges). */
function offsetAlongNormals(world, idx, d) {
  const n = world.length, fn = [], inc = Array.from({ length: n }, () => []);
  const flat = Float64Array.from(world.flat());
  for (let t = 0; t < idx.length; t += 3) { fn.push(faceN(flat, idx[t], idx[t + 1], idx[t + 2])); for (let k = 0; k < 3; k++) inc[idx[t + k]].push([t / 3, k]); }
  const move = world.map((p, v) => {
    const nv = [0, 0, 0];
    for (const [t, k] of inc[v]) { const a = P(flat, idx[t * 3 + k]), b = P(flat, idx[t * 3 + (k + 1) % 3]), c = P(flat, idx[t * 3 + (k + 2) % 3]); const e1 = sub(b, a), e2 = sub(c, a); const l = len(e1) * len(e2); if (!l) continue; const w = Math.acos(Math.max(-1, Math.min(1, dot(e1, e2) / l))); for (let q = 0; q < 3; q++) nv[q] += fn[t][q] * w; }
    const l = len(nv); if (!l) return [0, 0, 0]; const u = nv.map((x) => x / l);
    const m = Math.min(...inc[v].map(([t]) => dot(u, fn[t])).filter((x) => x > 0.1), 1); return u.map((x) => x * d / Math.max(m, 0.4));
  });
  move.forEach((m, v) => { for (let q = 0; q < 3; q++) world[v][q] += m[q]; });
}
/**
 * Boolean union of the printed parts in the assembly frame (mm, recentred), keeping the outer skin only.
 * Each part rides in as a manifold with 4 vertex properties (x, y, z, print-z); the union interpolates print-z across the cuts, and
 * runOriginalID says which part each output triangle came from (so material and print frame both survive).
 * Connected components of the result with negative signed volume are enclosed voids (the case's battery bay once the cover closes it): dropped.
 * Returns per-triangle-soup welded by (position, part), grouped by part index.
 */
async function hollowMerge(built, centre, log) {
  const wasm = await loadManifold(); const { Manifold, Mesh } = wasm; const grow = +arg('grow', 0);   // mm: offset every part outward by this much before the union. Off: the parts already overlap (0.36 mm3 in all), so the union closes their seams, and growing costs 10 um of fidelity everywhere
  const ins = built.map((b) => {
    const n = b.pos.length / 3; const vp = new Float32Array(n * 4); const world = [];
    for (let i = 0; i < n; i++) { const p = mulMV(b.RS, P(b.pos, i)).map((v, d) => v + b.tAsm[d] - centre[d]); world.push(p); }
    if (grow) offsetAlongNormals(world, b.idx, grow);
    world.forEach((p, i) => { vp[i * 4] = p[0]; vp[i * 4 + 1] = p[1]; vp[i * 4 + 2] = p[2]; vp[i * 4 + 3] = b.pos[i * 3 + 2]; });
    const id = Manifold.reserveIDs(1); const tv = Uint32Array.from(b.idx);
    const m = Manifold.ofMesh(new Mesh({ numProp: 4, vertProperties: vp, triVerts: tv, runIndex: Uint32Array.of(0, tv.length), runOriginalID: Uint32Array.of(id) }));
    if (m.status() !== 'NoError') throw new Error(`${b.part.node}: manifold status ${m.status()}`);
    return { m, id, vol: m.volume() };
  });
  const sep = ins.map((a, i) => ins.slice(i + 1).map((c, j) => `${built[i].part.node}/${built[i + 1 + j].part.node} ${Manifold.intersection(a.m, c.m).volume().toFixed(4)} mm3`)).flat();
  log('part overlap (volume shared):', sep.join(' · ')); log('manifold tolerance per part (mm):', ins.map((a) => a.m.tolerance()).join(', '));
  const u = Manifold.union(ins.map((a) => a.m)); const sumV = ins.reduce((s, a) => s + a.vol, 0);
  log('union tolerance', u.tolerance());
  log(`union: ${u.numTri()} tris, volume ${u.volume().toFixed(3)} mm3 (sum of parts ${sumV.toFixed(3)}, shared ${(sumV - u.volume()).toFixed(3)}), genus ${u.genus()}`);
  const byId = new Map(ins.map((a, i) => [a.id, i])); const kept = [], dropped = [];
  const soup = built.map(() => ({ tris: [] }));
  const mesh = u.getMesh(); const vp = mesh.vertProperties, tv = mesh.triVerts, np = mesh.numProp; const nT = tv.length / 3;
  // connected components over triangles (vertices that were split only to carry different properties are merged back first)
  const par = Int32Array.from({ length: vp.length / np }, (_, i) => i); const find = (x) => { while (par[x] !== x) x = par[x] = par[par[x]]; return x; };
  if (mesh.mergeFromVert) for (let i = 0; i < mesh.mergeFromVert.length; i++) par[find(mesh.mergeFromVert[i])] = find(mesh.mergeToVert[i]);
  for (let t = 0; t < nT; t++) { par[find(tv[t * 3])] = find(tv[t * 3 + 1]); par[find(tv[t * 3 + 1])] = find(tv[t * 3 + 2]); }
  const compVol = new Map(), compTris = new Map();
  for (let t = 0; t < nT; t++) {
    const [a, b2, d] = [0, 1, 2].map((k) => [0, 1, 2].map((q) => vp[tv[t * 3 + k] * np + q])); const c = find(tv[t * 3]);
    compVol.set(c, (compVol.get(c) || 0) + dot(a, cross(b2, d)) / 6); compTris.set(c, (compTris.get(c) || 0) + 1);
  }
  for (const [c, vol] of compVol) (vol > 0 ? kept : dropped).push({ tris: compTris.get(c), vol, c });
  const keepC = new Set(kept.map((k) => k.c)); const comps = [...compVol.keys()];
  for (let r = 0; r < mesh.runIndex.length - 1; r++) {
    const part = byId.get(mesh.runOriginalID[r]); if (part === undefined) throw new Error('union output has a run from no part: ' + mesh.runOriginalID[r] + ' vs ' + [...byId.keys()]);
    for (let t = mesh.runIndex[r] / 3; t < mesh.runIndex[r + 1] / 3; t++) {
      if (!keepC.has(find(tv[t * 3]))) continue;
      soup[part].tris.push([0, 1, 2].map((k) => { const v = tv[t * 3 + k]; return [vp[v * np], vp[v * np + 1], vp[v * np + 2], vp[v * np + 3]]; }));
    }
  }
  log(`components: ${comps.length}; kept ${kept.length} outer (${kept.map((k) => k.tris + ' tris ' + k.vol.toFixed(2) + ' mm3').join(', ')}); dropped ${dropped.length} enclosed void shell(s) (${dropped.map((k) => k.tris + ' tris ' + k.vol.toFixed(2) + ' mm3').join(', ') || 'none'})`);
  // weld each part's triangles on (position, part): print-z differs across a seam, so a vertex on the seam exists once per side
  return soup.map((sp) => {
    const map = new Map(); const pos = [], pz = [], idx = [];
    let collapsed = 0;
    for (const tri of sp.tris) {
      const ix = tri.map((v) => {
        const key = v.slice(0, 3).map((x) => Math.round(x * 1e4)).join(','); let i = map.get(key);
        if (i === undefined) { i = pos.length / 3; map.set(key, i); pos.push(v[0], v[1], v[2]); pz.push(v[3]); } return i;
      });
      if (ix[0] === ix[1] || ix[1] === ix[2] || ix[0] === ix[2]) { collapsed++; continue; }   // an edge shorter than the weld: the union left a zero-area sliver, which has no surface and (with a zero-length edge) poisons a vertex normal with NaN
      idx.push(...ix);
    }
    return { pos: Float64Array.from(pos), pz: Float64Array.from(pz), idx: Uint32Array.from(idx) };
  });
}

// ---------------------------------------------------------------- main
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch((e) => { console.error(e); process.exit(1); });
async function main() {
const log = (...a) => console.log(...a);
const obj = readObjMm(OBJ_FILE); const register = makeRegistrar(obj);
log(`OBJ: ${obj.tris.length} triangles, ${obj.V.length / 3} unwelded vertices (inch*25.4 = mm)`);
const built = [];
const WITHOUT = (arg('without', '') || '').split(',').filter(Boolean);   // e.g. --without usb-cover: the 2026-10-14 assembly dropped the tethered USB cap
for (const part of PARTS.filter((p) => !WITHOUT.includes(p.node))) {
  const raw = readSTL(path.join(STL_DIR, part.file));
  const reg = register(raw);
  const w = weld(raw); const j = dropJunk(w.pos, w.idx); const o = orient(w.pos, j.idx); const rep = repairSlivers(w.pos, o.idx); const es = edgeStats(rep.idx);
  if (o.shells !== 1 || es.open || es.nonManifold) throw new Error(`${part.node}: shells ${o.shells}, open ${es.open}, nonManifold ${es.nonManifold}`);
  // STL frame -> print frame. flip = 180 deg about Y (x -> -x, z -> -z); then origin to the bbox-min corner (bed contact at z = 0).
  const S = part.flip ? [-1, 0, 0, 0, 1, 0, 0, 0, -1] : [1, 0, 0, 0, 1, 0, 0, 0, 1];
  const q = Array.from({ length: w.pos.length / 3 }, (_, i) => mulMV(S, P(w.pos, i)));
  const mn = [0, 1, 2].map((d) => Math.min(...q.map((p) => p[d]))); const mxp = [0, 1, 2].map((d) => Math.max(...q.map((p) => p[d])));
  const pos = new Float64Array(q.length * 3); q.forEach((p, i) => { for (let d = 0; d < 3; d++) pos[i * 3 + d] = p[d] - mn[d]; });
  // assembly = Rreg * Sinv * (print + mn) + treg ; S is its own inverse
  const RS = mulMM(reg.R, S); const tAsm = mulMV(RS, mn).map((v, d) => v + reg.t[d]);
  built.push({ part, reg, pos, idx: rep.idx, size: mxp.map((v, d) => v - mn[d]), RS, tAsm, stats: { junk: j.junk, flippedTris: o.flipped, slivers: rep.repaired, volumeMm3: o.volumeMm3[0], stlOffsetMm: mn, needles: countNeedles(w.pos, rep.idx) } });
}
// assembly bbox (mm) over every part, for recentring
const lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9];
for (const b of built) for (let i = 0; i < b.pos.length / 3; i++) { const p = mulMV(b.RS, P(b.pos, i)).map((v, d) => v + b.tAsm[d]); for (let d = 0; d < 3; d++) { lo[d] = Math.min(lo[d], p[d]); hi[d] = Math.max(hi[d], p[d]); } }
const centre = lo.map((v, d) => (v + hi[d]) / 2);

const PARTS_MODE = argv.includes('--parts');   // the per-part build (one node per printed part, internals intact): for an exploded view
const g = new Glb(); const root = g.node({ name: 'venovisor', children: [] });

const caseB = built[0]; const led = findLedHoles(caseB.pos, caseB.idx); const leds = lensGeometry(led.holes, led.r);
const toM = (a) => Float64Array.from(a, (v) => v * MM);
let tris = 0; let hollowStats = null;
const rootExtras = {
  units: 'metres', frame: 'assembly OBJ frame, recentred on its bounding box: +Y strap end, -Y C-head (open toward -Y), +Z front (cover, button), -Z back (LEDs)',
  source: 'Venovisor-v1.1 STL print parts registered to "Venovisor In assembly.obj" (inches)', material: 'Monofilament ELASTAN D70 (TPU), Bambu P1S, 0.20 mm layers, smooth PEI plate (bed faces are glossy, walls carry layer lines)',
  ...(WITHOUT.includes('usb-cover') ? {} : { usbCover: 'placed as the assembly OBJ has it: the tether pin sits in the 2 mm side-wall bore (pin axis = bore axis, y and z within 1 um) and the cap hangs free past the strap end, port open. Docking it in the end-wall slot is a node transform; the strap is flexible TPU.' }),
};
if (!PARTS_MODE) {
  // ---- merged, internals-free: ONE mesh, one primitive per material, every vertex carries _PRINTZ
  const soups = await hollowMerge(built, centre, log);
  const ledRef = built[0]; // lens geometry and LED empties live in the case print frame: carry them into the assembly frame
  const toAsm = (v) => mulMV(ledRef.RS, v).map((x, d) => x + ledRef.tAsm[d] - centre[d]);
  const lensAsm = { pos: [], nrm: [], idx: leds.idx };
  for (let i = 0; i < leds.pos.length / 3; i++) { lensAsm.pos.push(...toAsm(P(leds.pos, i)).map((v) => v * MM)); lensAsm.nrm.push(...mulMV(ledRef.RS, P(leds.nrm, i))); }
  if (!argv.includes('--no-prune')) {
    // Interior = triangles nothing outside can see, judged on the assembled model (lenses opaque). The bore walls stay: a translucent lens would show them.
    const flat = []; const owner = [];
    soups.forEach((s, si) => { for (let t = 0; t < s.idx.length; t += 3) { for (let k = 0; k < 3; k++) flat.push(s.pos[s.idx[t + k] * 3], s.pos[s.idx[t + k] * 3 + 1], s.pos[s.idx[t + k] * 3 + 2]); owner.push([si, t]); } });
    const tris9 = Float64Array.from(flat); const protect = new Uint8Array(owner.length);
    const bores = led.holes.map((h) => ({ p: toAsm([h.c[0], h.c[1], 0]), a: mulMV(ledRef.RS, [0, 0, -1]) }));
    for (let i = 0; i < owner.length; i++) for (const b of bores) {
      let on = true; for (let j = 0; j < 3 && on; j++) { const q = [0, 1, 2].map((d) => tris9[i * 9 + j * 3 + d] - b.p[d]); const al = dot(q, b.a); const rad = len(q.map((v, d) => v - al * b.a[d])); on = Math.abs(rad - (led.r - +arg('grow', 0))) < 0.04 && al < 0.05 && al > -(6.5); }
      if (on) { protect[i] = 1; break; }
    }
    const lensMm = []; for (const i of leds.idx) lensMm.push(...toAsm(P(leds.pos, i)));
    const hid = findHidden(tris9, { occluders: Float64Array.from(lensMm), protect, log, dirs: +arg('views', 600), minArea: +arg('min-area', 0.05) });
    const keep = soups.map(() => []);
    owner.forEach(([si, t], i) => { if (!hid.hidden[i]) keep[si].push(soups[si].idx[t], soups[si].idx[t + 1], soups[si].idx[t + 2]); });
    log(`pruned ${hid.stats.hiddenTris} interior triangles (${owner.length} -> ${owner.length - hid.stats.hiddenTris}), bore walls protected: ${protect.reduce((a, b) => a + b, 0)}`);
    soups.forEach((s, si) => { s.idx = Uint32Array.from(keep[si]); });
  }
  const prims = []; const partTris = [];
  for (const mat of ['tpu-olive', 'tpu-button']) {
    const pos = [], nrm = [], pz = [], idx = []; let base = 0;
    built.forEach((b, i) => {
      if (b.part.material !== mat || !soups[i].idx.length) return;
      const cr = creasedNormals(soups[i].pos, soups[i].idx); const n = cr.pos.length / 3;
      const badN = normalCorners(cr); if (badN.bad > 0.001 * badN.total) throw new Error(`${b.part.node}: ${badN.bad} of ${badN.total} vertex-normal corners are zero/NaN or point away from their triangle`);
      for (const v of cr.pos) pos.push(v * MM); for (const v of cr.nrm) nrm.push(v); for (const o of cr.src) pz.push(soups[i].pz[o] * MM);
      for (const v of cr.idx) idx.push(base + v); base += n; partTris[i] = cr.idx.length / 3;
    });
    prims.push({ pos, nrm, printz: pz, idx, material: mat }); tris += idx.length / 3;
  }
  prims.push({ ...lensAsm, material: 'led-red' }); tris += leds.idx.length / 3;
  hollowStats = built.map((b, i) => `${b.part.node} ${b.idx.length / 3} -> ${partTris[i] ?? 0}`).join(' · ');
  const mesh = g.meshPrims('venovisor', prims);
  const ledRingX = { centreM: toAsm([led.ring.c[0], led.ring.c[1], 0]).map((v) => +(v * MM).toFixed(7)), radiusM: +(led.ring.R * MM).toFixed(7), count: led.holes.length, note: 'C-head centre and LED ring radius, in this node\'s frame (the assembly frame)' };
  const bodyExtras = { ledRing: ledRingX, merged: true, internalsRemoved: true, printzAttribute: '_PRINTZ', layerHeightM: 0.0002, printAxis: 'per-vertex: _PRINTZ is the height along each original part\'s own print axis in metres, bed = 0', parts: built.map((b) => b.part.node) };
  const body = g.node({ name: 'body', mesh, extras: bodyExtras });
  const ledQ = quatFromRot(mulMM(ledRef.RS, [1, 0, 0, 0, -1, 0, 0, 0, -1]));   // empty +Z = out of the back face (case -Z) = case frame turned 180 deg about X
  const kids = led.holes.map((h, i) => g.node({ name: `led-${i}`, translation: mulMV(ledRef.RS, [h.c[0], h.c[1], 0]).map((v, d) => +((v + ledRef.tAsm[d] - centre[d]) * MM).toPrecision(9)), rotation: ledQ, extras: { role: 'led', index: i, ringAngleDeg: h.angleDeg, boreRadiusM: +(led.r * MM).toFixed(7), axis: '+Z points out of the back face' } }));
  g.json.nodes[body].children = kids; g.json.nodes[root].children.push(body);
  g.json.nodes[root].extras = { ...rootExtras, mesh: 'merged and hollow: the printed parts are one boolean union, every enclosed void and interior face is gone and every visible opening (8 LED bores, button bore, C-head gap, strap loop, screw holes) is kept. Each vertex carries _PRINTZ for its layer lines. The per-part build is `--parts`.' };
} else {
for (const b of built) {
  const creased = creasedNormals(b.pos, b.idx); tris += b.idx.length / 3;
  const mesh = g.mesh(b.part.node, { pos: toM(creased.pos), nrm: creased.nrm, idx: creased.idx }, b.part.material);
  const t = b.tAsm.map((v, d) => +((v - centre[d]) * MM).toPrecision(9));
  const extras = { printFrame: true, printAxis: 'z', bedFaceZ: 0, layerHeightM: 0.0002, printOffsetMm: b.stats.stlOffsetMm.map((v) => +v.toFixed(4)), printedFlipped: b.part.flip, registration: { vertices: b.reg.vertices, rmsUm: +b.reg.rmsUm.toFixed(2), maxUm: +b.reg.maxUm.toFixed(2) } };
  b.nodeIndex = g.node({ name: b.part.node, mesh, translation: t, rotation: quatFromRot(b.RS), extras });
  g.json.nodes[root].children.push(b.nodeIndex);
}
// LEDs: lens meshes + empties, children of the case so they follow it. Empty local +Z = out of the back face (case -Z): a 180 deg turn about X.
const lensMesh = g.mesh('led-lenses', { pos: toM(leds.pos), nrm: leds.nrm, idx: leds.idx }, 'led-red'); tris += leds.idx.length / 3;
const kids = [g.node({ name: 'led-lenses', mesh: lensMesh })];
led.holes.forEach((h, i) => kids.push(g.node({ name: `led-${i}`, translation: [+(h.c[0] * MM).toPrecision(9), +(h.c[1] * MM).toPrecision(9), 0], rotation: [1, 0, 0, 0], extras: { role: 'led', index: i, ringAngleDeg: h.angleDeg, boreRadiusM: +(led.r * MM).toFixed(7), axis: '+Z points out of the back face' } })));
g.json.nodes[caseB.nodeIndex].children = kids;
g.json.nodes[caseB.nodeIndex].extras.ledRing = { centreM: [+(led.ring.c[0] * MM).toFixed(7), +(led.ring.c[1] * MM).toFixed(7), 0], radiusM: +(led.ring.R * MM).toFixed(7), count: led.holes.length, note: 'C-head centre and LED ring radius, case print frame' };
g.json.nodes[root].extras = rootExtras;
}
fs.mkdirSync(path.dirname(OUT), { recursive: true });
const rawOut = OUT.replace(/\.glb$/, '.raw.glb'); fs.writeFileSync(rawOut, g.toBuffer());
// gltfpack 1.3 drops custom attributes even with -kv ("ignoring custom attribute _PRINTZ"), so the merged model is packed by pack-glb.mjs
// (gltf-transform + meshopt: same EXT_meshopt_compression, float positions, 8-bit normals, custom attributes kept). --parts still goes through gltfpack.
const pack = PARTS_MODE
  ? spawnSync(GLTFPACK, ['-i', rawOut, '-o', OUT, '-c', '-ce', 'ext', '-kn', '-km', '-ke', ...(arg('vp') ? ['-vpi', '-vp', arg('vp')] : ['-vpf']), '-vn', arg('vn', '8')], { encoding: 'utf8' })
  : spawnSync(process.execPath, [path.join(HERE, 'pack-glb.mjs'), rawOut, OUT, '--normal-bits', arg('vn', '8')], { encoding: 'utf8', env: { ...process.env, SCRATCH } });
if (pack.status !== 0) throw new Error('packing failed: ' + pack.stderr + pack.stdout);
const rawBytes = fs.statSync(rawOut).size; if (!process.env.KEEP_RAW) fs.unlinkSync(rawOut);

// ---------------------------------------------------------------- report
log('\npart            tris   shells slivers fixed  flipped tris  needles  print size mm            registration (rms / max, um)   matched');
for (const b of built) log(b.part.node.padEnd(14), String(b.idx.length / 3).padStart(5), '  1      ', String(b.stats.slivers).padStart(3), '      ', String(b.stats.flippedTris).padStart(5), '       ', String(b.stats.needles).padStart(4), '    ', b.size.map((v) => v.toFixed(2)).join(' x ').padEnd(24), `${b.reg.rmsUm.toFixed(2)} / ${b.reg.maxUm.toFixed(2)}`.padEnd(30), `${b.reg.matched}/${b.reg.vertices}`);
const cov = objCoverage(obj, built);
log(`OBJ coverage: ${cov.vertices} welded OBJ vertices, worst distance to a registered part vertex ${cov.worstUm.toFixed(2)} um, ${cov.unmatched} farther than 20 um`);
log(`LED holes: ${led.holes.length}, bore r ${led.r.toFixed(3)} mm, ring R ${led.ring.R.toFixed(3)} mm at (${led.ring.c.map((v) => v.toFixed(3)).join(', ')}) in the case frame`);
if (hollowStats) log(`triangles per printed part, per-part build -> hollow: ${hollowStats}`);
log(`triangles ${tris} (${tris - leds.idx.length / 3} printed + ${leds.idx.length / 3} lens), bbox mm ${hi.map((v, d) => (v - lo[d]).toFixed(2)).join(' x ')}`);
log(`bytes: raw ${rawBytes}, packed ${fs.statSync(OUT).size} -> ${OUT}`);
}
