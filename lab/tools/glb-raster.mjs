/*
 * A tiny software rasteriser for proofs: world-space triangles out of a GLB (raw or meshopt-packed), an orthographic ID + depth buffer
 * from any direction, and the view sets the hollow proofs use. No GPU: SwiftShader is slow and a driver can hide a one-pixel difference.
 * meshoptimizer's decoder is read from <SCRATCH>/tools (npm i --prefix <SCRATCH>/tools meshoptimizer).
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { pathToFileURL } from 'node:url';

const SCRATCH = process.env.SCRATCH || path.join(os.tmpdir(), 'materialize');
let decoder;
async function meshopt() {
  if (!decoder) { decoder = (await import(pathToFileURL(path.join(SCRATCH, 'tools/node_modules/meshoptimizer/meshopt_decoder.mjs')).href)).MeshoptDecoder; await decoder.ready; }
  return decoder;
}
const COMP = { 5120: [Int8Array, 127], 5121: [Uint8Array, 255], 5122: [Int16Array, 32767], 5123: [Uint16Array, 65535], 5125: [Uint32Array, 1], 5126: [Float32Array, 1] };
const NCOMP = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 };

// column-major 4x4 helpers
const I4 = () => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
const mul4 = (a, b) => { const o = new Array(16).fill(0); for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) for (let k = 0; k < 4; k++) o[c * 4 + r] += a[k * 4 + r] * b[c * 4 + k]; return o; };
function trs(n) {
  if (n.matrix) return n.matrix.slice();
  const [x, y, z, w] = n.rotation || [0, 0, 0, 1]; const [sx, sy, sz] = n.scale || [1, 1, 1]; const [tx, ty, tz] = n.translation || [0, 0, 0];
  return [(1 - 2 * (y * y + z * z)) * sx, (2 * (x * y + z * w)) * sx, (2 * (x * z - y * w)) * sx, 0, (2 * (x * y - z * w)) * sy, (1 - 2 * (x * x + z * z)) * sy, (2 * (y * z + x * w)) * sy, 0, (2 * (x * z + y * w)) * sz, (2 * (y * z - x * w)) * sz, (1 - 2 * (x * x + y * y)) * sz, 0, tx, ty, tz, 1];
}

/** -> { tris: Float64Array(9n) in MILLIMETRES (world), nrm: Float64Array(9n) vertex normals per corner (world, as stored), mat: Int32Array(n), matNames, empties: [{name, p:[3], z:[3]}], nodeOf: names, json } */
export async function loadGlb(file) {
  const b = fs.readFileSync(file); if (b.toString('latin1', 0, 4) !== 'glTF') throw new Error(file + ': not a GLB');
  const jl = b.readUInt32LE(12); const json = JSON.parse(b.subarray(20, 20 + jl).toString()); const binOff = 20 + jl + 8; const bin = b.subarray(binOff, binOff + b.readUInt32LE(20 + jl));
  const cache = new Map();
  const viewBytes = async (i) => {
    if (cache.has(i)) return cache.get(i);
    const bv = json.bufferViews[i]; const e = bv.extensions && bv.extensions.EXT_meshopt_compression; let out;
    if (e) { const dec = await meshopt(); const src = bin.subarray(e.byteOffset || 0, (e.byteOffset || 0) + e.byteLength); out = new Uint8Array(e.count * e.byteStride); dec.decodeGltfBuffer(out, e.count, e.byteStride, src, e.mode, e.filter || 'NONE'); }
    else out = bin.subarray(bv.byteOffset || 0, (bv.byteOffset || 0) + bv.byteLength);
    cache.set(i, out); return out;
  };
  const read = async (ai) => {
    const a = json.accessors[ai]; const bv = json.bufferViews[a.bufferView]; const data = await viewBytes(a.bufferView); const [T, nmax] = COMP[a.componentType]; const nc = NCOMP[a.type];
    const stride = bv.byteStride || (e0(bv) ? bv.extensions.EXT_meshopt_compression.byteStride : T.BYTES_PER_ELEMENT * nc); const out = new Float64Array(a.count * nc);
    const dv = new DataView(data.buffer, data.byteOffset, data.byteLength);
    for (let i = 0; i < a.count; i++) for (let k = 0; k < nc; k++) {
      const o = (a.byteOffset || 0) + i * stride + k * T.BYTES_PER_ELEMENT; let v;
      switch (a.componentType) { case 5126: v = dv.getFloat32(o, true); break; case 5123: v = dv.getUint16(o, true); break; case 5125: v = dv.getUint32(o, true); break; case 5122: v = dv.getInt16(o, true); break; case 5121: v = dv.getUint8(o); break; default: v = dv.getInt8(o); }
      out[i * nc + k] = a.normalized ? Math.max(v / nmax, -1) : v;
    }
    return out;
  };
  const e0 = (bv) => bv.extensions && bv.extensions.EXT_meshopt_compression;
  const tris = []; const nrm = []; const mat = []; const empties = []; const matNames = (json.materials || []).map((m) => m.name);
  const walk = async (ni, parent) => {
    const n = json.nodes[ni]; const M = mul4(parent, trs(n));
    if (n.mesh !== undefined) for (const p of json.meshes[n.mesh].primitives) {
      const pos = await read(p.attributes.POSITION); const nor = p.attributes.NORMAL !== undefined ? await read(p.attributes.NORMAL) : null; const idx = p.indices !== undefined ? await read(p.indices) : Float64Array.from({ length: pos.length / 3 }, (_, i) => i);
      const w = (i) => { const x = pos[i * 3], y = pos[i * 3 + 1], z = pos[i * 3 + 2]; return [0, 1, 2].map((r) => (M[r] * x + M[4 + r] * y + M[8 + r] * z + M[12 + r]) * 1000); };
      const wn = (i) => { if (!nor) return [0, 0, 0]; const x = nor[i * 3], y = nor[i * 3 + 1], z = nor[i * 3 + 2]; return [0, 1, 2].map((r) => M[r] * x + M[4 + r] * y + M[8 + r] * z); };   // rotation only: the nodes here carry no non-uniform scale
      for (let t = 0; t < idx.length; t += 3) { tris.push(...w(idx[t]), ...w(idx[t + 1]), ...w(idx[t + 2])); nrm.push(...wn(idx[t]), ...wn(idx[t + 1]), ...wn(idx[t + 2])); mat.push(p.material ?? -1); }
    }
    if (n.mesh === undefined && n.name) empties.push({ name: n.name, p: [M[12] * 1000, M[13] * 1000, M[14] * 1000], z: [M[8], M[9], M[10]] });
    for (const c of n.children || []) await walk(c, M);
  };
  for (const r of json.scenes[json.scene || 0].nodes) await walk(r, I4());
  return { tris: Float64Array.from(tris), nrm: Float64Array.from(nrm), mat: Int32Array.from(mat), matNames, empties, json };
}

const norm3 = (v) => { const l = Math.hypot(...v); return v.map((x) => x / l); };
const cross3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

/** A view: unit direction d (from the object TOWARD the eye), centre c (mm), half-width hw (mm), size px. */
export function makeView(d, c, hw, size) {
  d = norm3(d); const ref = Math.abs(d[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0]; const u = norm3(cross3(ref, d)); const v = cross3(d, u);
  return { d, u, v, c, hw, size };
}
/** Fibonacci directions on the sphere. */
export function sphereDirs(n) { const out = []; const ga = Math.PI * (3 - Math.sqrt(5)); for (let i = 0; i < n; i++) { const y = 1 - 2 * (i + 0.5) / n, r = Math.sqrt(1 - y * y); out.push([Math.cos(ga * i) * r, y, Math.sin(ga * i) * r]); } return out; }

/**
 * Render world triangles (mm). -> { id: Int32Array(size^2) (-1 none), depth: Float32Array (mm toward the eye, -Inf none) }.
 * cull: drop triangles facing away from the eye (what a FrontSide material does).
 */
export function render(tris, view, { cull = true } = {}) {
  const { d, u, v, c, hw, size } = view; const n = tris.length / 9; const id = new Int32Array(size * size).fill(-1); const depth = new Float32Array(size * size).fill(-Infinity); const k = size / (2 * hw);
  const sx = new Float64Array(3), sy = new Float64Array(3), sz = new Float64Array(3);
  for (let t = 0; t < n; t++) {
    for (let j = 0; j < 3; j++) { const x = tris[t * 9 + j * 3] - c[0], y = tris[t * 9 + j * 3 + 1] - c[1], z = tris[t * 9 + j * 3 + 2] - c[2]; sx[j] = (x * u[0] + y * u[1] + z * u[2] + hw) * k; sy[j] = (hw - (x * v[0] + y * v[1] + z * v[2])) * k; sz[j] = x * d[0] + y * d[1] + z * d[2]; }
    const area = (sx[1] - sx[0]) * (sy[2] - sy[0]) - (sx[2] - sx[0]) * (sy[1] - sy[0]);   // screen y points down: front-facing (CCW from the eye) is negative
    if (Math.abs(area) < 1e-12) continue; if (cull && area > 0) continue;
    const x0 = Math.max(0, Math.floor(Math.min(sx[0], sx[1], sx[2]) - 0.5)), x1 = Math.min(size - 1, Math.ceil(Math.max(sx[0], sx[1], sx[2]) - 0.5));
    const y0 = Math.max(0, Math.floor(Math.min(sy[0], sy[1], sy[2]) - 0.5)), y1 = Math.min(size - 1, Math.ceil(Math.max(sy[0], sy[1], sy[2]) - 0.5));
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const px = x + 0.5, py = y + 0.5;
      const w0 = ((sx[1] - px) * (sy[2] - py) - (sx[2] - px) * (sy[1] - py)) / area, w1 = ((sx[2] - px) * (sy[0] - py) - (sx[0] - px) * (sy[2] - py)) / area, w2 = 1 - w0 - w1;
      if (w0 < 0 || w1 < 0 || w2 < 0) continue;
      const z = w0 * sz[0] + w1 * sz[1] + w2 * sz[2]; const o = y * size + x; if (z > depth[o]) { depth[o] = z; id[o] = t; }
    }
  }
  return { id, depth };
}

export function faceNormal(tris, t) {
  const o = t * 9; const a = [tris[o + 3] - tris[o], tris[o + 4] - tris[o + 1], tris[o + 5] - tris[o + 2]], b = [tris[o + 6] - tris[o], tris[o + 7] - tris[o + 1], tris[o + 8] - tris[o + 2]];
  const n = cross3(a, b); const l = Math.hypot(...n) || 1; return n.map((x) => x / l);
}
export { dot3, norm3, cross3 };

export function bounds(tris) {
  const lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9]; for (let i = 0; i < tris.length; i += 3) for (let d = 0; d < 3; d++) { lo[d] = Math.min(lo[d], tris[i + d]); hi[d] = Math.max(hi[d], tris[i + d]); }
  const c = lo.map((v, d) => (v + hi[d]) / 2); return { lo, hi, c, r: Math.hypot(...hi.map((v, d) => v - lo[d])) / 2 };
}

/**
 * The view set: `dirs` whole-object views on a sphere, 26 high-resolution axis/diagonal views, and for every opening a stack of views
 * looking into it (straight down the axis and 4 azimuths at 25 and 50 deg off-axis, window a few bore radii wide).
 * openings: [{ name, p: [x,y,z] (mm, on the rim), axis: [x,y,z] (out of the opening), r (mm) }]
 */
export function viewSet(tris, { dirs = 240, size = 512, openings = [] } = {}) {
  const B = bounds(tris); const views = [];
  sphereDirs(dirs).forEach((d, i) => views.push({ name: `sphere-${i}`, view: makeView(d, B.c, B.r * 1.02, size) }));
  const hi = [];
  for (const x of [-1, 0, 1]) for (const y of [-1, 0, 1]) for (const z of [-1, 0, 1]) if (x || y || z) hi.push([x, y, z]);
  hi.forEach((d, i) => views.push({ name: `hires-${d.join(',')}`, view: makeView(d, B.c, B.r * 1.02, size * 2) }));
  // zoomed tiles over each of the six faces: a screw hole or a loop is a few pixels in a whole-object view and dozens here
  for (const ax of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) {
    const view0 = makeView(ax, B.c, 1, 2); const ext = [view0.u, view0.v].map((a) => { let m = 0; for (let i = 0; i < tris.length; i += 3) m = Math.max(m, Math.abs((tris[i] - B.c[0]) * a[0] + (tris[i + 1] - B.c[1]) * a[1] + (tris[i + 2] - B.c[2]) * a[2])); return m; });
    const hw = 10, step = 17; const nu = Math.ceil(2 * ext[0] / step), nv = Math.ceil(2 * ext[1] / step);
    for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) {
      const cu = -ext[0] + (i + 0.5) * (2 * ext[0] / nu), cv = -ext[1] + (j + 0.5) * (2 * ext[1] / nv);
      views.push({ name: `tile-${ax.join(',')}-${i}-${j}`, view: makeView(ax, [0, 1, 2].map((q) => B.c[q] + view0.u[q] * cu + view0.v[q] * cv), hw, 384) });
    }
  }
  for (const o of openings) {
    const ax = norm3(o.axis); const ref = Math.abs(ax[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0]; const t1 = norm3(cross3(ref, ax)), t2 = cross3(ax, t1);
    const hw = Math.max(o.r * 3, 4);
    views.push({ name: `${o.name}-axis`, view: makeView(ax, o.p, hw, 256) });
    for (const deg of [25, 50]) for (let a = 0; a < 4; a++) {
      const th = deg * Math.PI / 180, ph = a * Math.PI / 2 + Math.PI / 4; const side = [0, 1, 2].map((j) => t1[j] * Math.cos(ph) + t2[j] * Math.sin(ph));
      views.push({ name: `${o.name}-${deg}-${a}`, view: makeView([0, 1, 2].map((j) => ax[j] * Math.cos(th) + side[j] * Math.sin(th)), o.p, hw, 256) });
    }
  }
  return views;
}

// ---- surface distance: how far the surface of one model strays from another (exact point-triangle distance, 2 mm hash grid)
const sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const at3 = (a, b, k) => [a[0] + k * b[0], a[1] + k * b[1], a[2] + k * b[2]];
function ptSeg(p, a, b) { const ab = sub3(b, a), l = dot3(ab, ab); const k = l > 0 ? Math.max(0, Math.min(1, dot3(sub3(p, a), ab) / l)) : 0; return Math.hypot(...sub3(p, at3(a, ab, k))); }
function ptTri(p, a, b, c) { // Ericson, Real-Time Collision Detection 5.1.5
  const ab = sub3(b, a), ac = sub3(c, a), ap = sub3(p, a); const d1 = dot3(ab, ap), d2 = dot3(ac, ap); if (d1 <= 0 && d2 <= 0) return Math.hypot(...ap);
  const bp = sub3(p, b); const d3 = dot3(ab, bp), d4 = dot3(ac, bp); if (d3 >= 0 && d4 <= d3) return Math.hypot(...bp);
  const vc = d1 * d4 - d3 * d2; if (vc <= 0 && d1 >= 0 && d3 <= 0) return Math.hypot(...sub3(p, at3(a, ab, d1 / (d1 - d3))));
  const cp = sub3(p, c); const d5 = dot3(ab, cp), d6 = dot3(ac, cp); if (d6 >= 0 && d5 <= d6) return Math.hypot(...cp);
  const vb = d5 * d2 - d1 * d6; if (vb <= 0 && d2 >= 0 && d6 <= 0) return Math.hypot(...sub3(p, at3(a, ac, d2 / (d2 - d6))));
  const va = d3 * d6 - d5 * d4; if (va <= 0 && d4 - d3 >= 0 && d5 - d6 >= 0) return Math.hypot(...sub3(p, at3(b, sub3(c, b), (d4 - d3) / (d4 - d3 + d5 - d6))));
  if (!(Math.abs(va + vb + vc) > 1e-300)) return Math.min(ptSeg(p, a, b), ptSeg(p, b, c), ptSeg(p, c, a));   // a zero-area sliver has no interior
  const den = 1 / (va + vb + vc), v = vb * den, w = vc * den; return Math.hypot(...sub3(p, [a[0] + ab[0] * v + ac[0] * w, a[1] + ab[1] * v + ac[1] * w, a[2] + ab[2] * v + ac[2] * w]));
}
/** A function p -> distance (mm) from point p to the nearest triangle of `to` (9n floats, mm). */
export function distanceTo(to) {
  const CELL = 2; const grid = new Map(); const nT = to.length / 9; const key = (x, y, z) => x + ',' + y + ',' + z;
  for (let t = 0; t < nT; t++) {
    const lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9]; for (let j = 0; j < 3; j++) for (let d = 0; d < 3; d++) { const v = to[t * 9 + j * 3 + d]; lo[d] = Math.min(lo[d], v); hi[d] = Math.max(hi[d], v); }
    for (let x = Math.floor(lo[0] / CELL); x <= Math.floor(hi[0] / CELL); x++) for (let y = Math.floor(lo[1] / CELL); y <= Math.floor(hi[1] / CELL); y++) for (let z = Math.floor(lo[2] / CELL); z <= Math.floor(hi[2] / CELL); z++) { const k = key(x, y, z); (grid.get(k) || grid.set(k, []).get(k)).push(t); }
  }
  const tri = (t) => [0, 1, 2].map((j) => [to[t * 9 + j * 3], to[t * 9 + j * 3 + 1], to[t * 9 + j * 3 + 2]]);
  // a zero-area sliver can yield NaN from ptTri: `d < best` is false for NaN, so it never wins
  return (p) => { for (let r = 1; r <= 6; r++) { let best = 1e9; const c = p.map((v) => Math.floor(v / CELL)); for (let x = c[0] - r; x <= c[0] + r; x++) for (let y = c[1] - r; y <= c[1] + r; y++) for (let z = c[2] - r; z <= c[2] + r; z++) for (const t of grid.get(key(x, y, z)) || []) { const [a, b, cc] = tri(t); const d = ptTri(p, a, b, cc); if (d < best) best = d; } if (best < r * CELL * 0.9) return best; } return 99; };
}
/** Distances (mm) from the centroid and first vertex of each listed triangle of `from` to the surface of `to` (sorted, or two per triangle in order). */
export function surfaceDistances(from, which, to, sorted = true) {
  const dist = distanceTo(to); const tri = (t) => [0, 1, 2].map((j) => [from[t * 9 + j * 3], from[t * 9 + j * 3 + 1], from[t * 9 + j * 3 + 2]]); const out = [];
  for (const t of which) { const [a, b, c] = tri(t); for (const p of [[(a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3, (a[2] + b[2] + c[2]) / 3], a]) out.push(dist(p)); }
  return sorted ? Float64Array.from(out).sort() : Float64Array.from(out);
}
