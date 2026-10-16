#!/usr/bin/env node
/*
 * node lab/tools/hollow-prove.mjs PER_PART.glb HOLLOW.glb [--dirs 240] [--size 512] [--tol 0.02] [--out DIR]
 *
 * Renders both models orthographically (software, front faces only, as a FrontSide material draws) from `dirs` sphere directions, 26
 * high-resolution directions, zoomed tiles over all six faces and a stack of views into every opening (each led-N empty, the button, the
 * C-head gap), then compares pixel by pixel: coverage (hit / no hit), depth (> tol mm) and the hit surface's normal (flat shading).
 * Prints totals, the worst views, and writes the worst view as a PNG triptych (per-part | hollow | difference).
 * Also prints how many triangles of each model were never the front-most surface in any view.
 * Needs <SCRATCH>/tools: sharp meshoptimizer.
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { pathToFileURL } from 'node:url';
import { loadGlb, viewSet, render, faceNormal, dot3, bounds, surfaceDistances, distanceTo } from './glb-raster.mjs';

const argv = process.argv.slice(2); const files = argv.filter((a, i) => !a.startsWith('--') && !(i && argv[i - 1].startsWith('--')));
const arg = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 ? argv[i + 1] : d; };
const SCRATCH = process.env.SCRATCH || path.join(os.tmpdir(), 'materialize');
const OUT = arg('out', path.join(SCRATCH, 'prove')); fs.mkdirSync(OUT, { recursive: true });
const ncos = +arg('ncos', 0.99), tol = +arg('tol', 0.02), dirs = +arg('dirs', 240), size = +arg('size', 512);
const A = await loadGlb(files[0]), B = await loadGlb(files[1]);
console.log(`A ${files[0]}: ${A.tris.length / 9} tris | B ${files[1]}: ${B.tris.length / 9} tris`);

// openings: every led-N empty (axis +Z of the node, out of the back face), the button (front, +Z, at the tpu-button geometry), the C-head (open toward -Y)
const bb = bounds(A.tris); const openings = [];
for (const e of B.empties.filter((e) => /^led-\d+$/.test(e.name))) openings.push({ name: e.name, p: e.p, axis: e.z, r: 2.4 });
{ const bi = B.matNames.indexOf('tpu-button'); const pts = []; B.mat.forEach((m, t) => { if (m === bi) pts.push(B.tris[t * 9], B.tris[t * 9 + 1], B.tris[t * 9 + 2]); });
  if (pts.length) { const c = [0, 1, 2].map((d) => { let lo = 1e9, hi = -1e9; for (let i = d; i < pts.length; i += 3) { lo = Math.min(lo, pts[i]); hi = Math.max(hi, pts[i]); } return (lo + hi) / 2; }); openings.push({ name: 'button', p: c, axis: [0, 0, 1], r: 6 }); } }
openings.push({ name: 'c-head', p: [bb.c[0], bb.lo[1], bb.c[2]], axis: [0, -1, 0], r: 12 });
for (const sgn of [1, -1]) openings.push({ name: `end${sgn > 0 ? '+' : '-'}x`, p: [sgn > 0 ? bb.hi[0] : bb.lo[0], bb.c[1], bb.c[2]], axis: [sgn, 0, 0], r: 8 });   // side walls: the tether-pin bore sits there
// shading sanity: a vertex normal that is zero, NaN or points against its own (non-sliver) triangle renders black or lit from behind, and a render of flat triangles never shows it
for (const [nm, G] of [['A', A], ['B', B]]) {
  let bad = 0, big = 0; const n = G.tris.length / 9;
  for (let t = 0; t < n; t++) {
    const fn = faceNormal(G.tris, t), o = t * 9; const a = [G.tris[o + 3] - G.tris[o], G.tris[o + 4] - G.tris[o + 1], G.tris[o + 5] - G.tris[o + 2]], b = [G.tris[o + 6] - G.tris[o], G.tris[o + 7] - G.tris[o + 1], G.tris[o + 8] - G.tris[o + 2]];
    const ar = Math.hypot(a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]) / 2; if (ar < 1e-3) continue; big++;
    for (let j = 0; j < 3; j++) { const v = [G.nrm[o + j * 3], G.nrm[o + j * 3 + 1], G.nrm[o + j * 3 + 2]]; const l = Math.hypot(...v); if (!(l > 0.5) || dot3(v, fn) / l < 0.3) bad++; }
  }
  console.log(`vertex normals ${nm}: ${bad} corners of ${big} triangles (> 0.001 mm2) are zero, NaN or more than 72 deg off their own triangle`);
  if (nm === 'B' && bad > 0.0005 * big * 3) process.exitCode = 3;   // a handful of corners on sliver-ish triangles is the CAD's own tessellation; hundreds is a vertex-normal bug
}
const views = viewSet(A.tris, { dirs, size, openings });
console.log(`${views.length} views (${dirs} sphere, 26 hi-res, face tiles, ${openings.length} openings x 9 views)`);

const L = [0.35, 0.5, 0.8].map((v, i) => v / Math.hypot(0.35, 0.5, 0.8));
const shade = (tris, t, d) => { if (t < 0) return 0; const n = faceNormal(tris, t); return Math.max(0, Math.round(255 * (0.25 + 0.75 * Math.abs(dot3(n, d)) ))); };
const seenA = new Uint8Array(A.tris.length / 9), seenB = new Uint8Array(B.tris.length / 9);
const hitPts = []; let hitN = 0;
const rows = []; let worst = null; let tot = { px: 0, raw: 0, cov: 0, depth: 0, normal: 0, cluster: 0, clusterView: '' };
for (const { name, view } of views) {
  const ra = render(A.tris, view), rb = render(B.tris, view); const s = view.size; let cov = 0, dep = 0, nor = 0, px = 0, raw = 0;
  const same = (r1, g1, o1, r2, g2, o2) => { // pixel o1 of image 1 agrees with pixel o2 of image 2: both hit, depth within tol, same facet orientation
    const i1 = r1.id[o1], i2 = r2.id[o2]; if (i1 < 0 || i2 < 0) return false; const n1 = faceNormal(g1, i1);
    return Math.abs(r1.depth[o1] - r2.depth[o2]) * Math.abs(dot3(n1, view.d)) <= tol && dot3(n1, faceNormal(g2, i2)) >= ncos;   // tol is the PERPENDICULAR gap between the two surfaces: along a grazing ray a small gap is a long depth
  };
  // a pixel only counts if no pixel in the other image's 3x3 neighbourhood agrees with it: a micron-scale vertex shift moves an edge by a pixel, it does not change the surface
  const fuzzy = (o) => { const x = o % s, y = (o - x) / s; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= s || yy >= s) continue; const q = yy * s + xx; if (same(ra, A.tris, o, rb, B.tris, q) || same(rb, B.tris, o, ra, A.tris, q)) return true; } return false; };
  const mask = new Uint8Array(s * s);
  for (let o = 0; o < s * s; o++) {
    const ia = ra.id[o], ib = rb.id[o]; if (ia >= 0) seenA[ia] = 1; if (ib >= 0) seenB[ib] = 1;
    if (ia < 0 && ib < 0) continue; px++;
    if (ia >= 0 && (hitN++ % 150) === 0) { const k = 2 * view.hw / s, x = (o % s + 0.5) * k - view.hw, y = view.hw - (Math.floor(o / s) + 0.5) * k; hitPts.push([0, 1, 2].map((q) => view.c[q] + view.u[q] * x + view.v[q] * y + view.d[q] * ra.depth[o])); }
    if (same(ra, A.tris, o, rb, B.tris, o)) continue; raw++;
    if (fuzzy(o)) continue;
    mask[o] = 1;
    if ((ia < 0) !== (ib < 0)) cov++; else if (Math.abs(ra.depth[o] - rb.depth[o]) * Math.abs(dot3(faceNormal(A.tris, ia), view.d)) > tol) dep++; else nor++;
  }
  { // largest 4-connected cluster of unexplained pixels in this view
    const seenPx = new Uint8Array(s * s); for (let o = 0; o < s * s; o++) if (mask[o] && !seenPx[o]) { let c = 0; const st = [o]; seenPx[o] = 1; while (st.length) { const q = st.pop(); c++; const x = q % s; for (const r of [q - 1, q + 1, q - s, q + s]) if (r >= 0 && r < s * s && mask[r] && !seenPx[r] && !(r === q - 1 && x === 0) && !(r === q + 1 && x === s - 1)) { seenPx[r] = 1; st.push(r); } } if (c > tot.cluster) { tot.cluster = c; tot.clusterView = name; } } }
  const bad = cov + dep + nor; tot.raw += raw; tot.px += px; tot.cov += cov; tot.depth += dep; tot.normal += nor;
  rows.push({ name, px, raw, cov, dep, nor, bad }); if (!worst || bad > worst.bad || (bad === worst.bad && raw > worst.raw)) worst = { name, view, ra, rb, bad, raw, mask };
}
const sum = (u) => u.reduce((a, b) => a + b, 0);
console.log(`\ncompared ${tot.px} covered pixels across ${views.length} views`);
console.log(`pixels that differ at the same coordinate: ${tot.raw} (${(100 * tot.raw / tot.px).toFixed(4)} %), edge moves unless counted below`);
console.log(`UNEXPLAINED (nothing in the other image's 3x3 neighbourhood agrees): coverage ${tot.cov} · depth mismatches (perpendicular gap > ${tol} mm) ${tot.depth} · normal mismatches ${tot.normal}  => ${(100 * (tot.cov + tot.depth + tot.normal) / tot.px).toFixed(5)} % of pixels`);
console.log(`largest connected cluster of unexplained pixels in any view: ${tot.cluster} px (${tot.clusterView})`);
console.log(`views with any mismatch: ${rows.filter((r) => r.bad).length}/${rows.length}; worst 8:`);
for (const r of rows.sort((a, b) => b.bad - a.bad).slice(0, 8)) console.log(`  ${r.name.padEnd(28)} px ${String(r.px).padStart(7)}  raw ${String(r.raw).padStart(5)}  unexplained coverage ${String(r.cov).padStart(5)}  depth ${String(r.dep).padStart(5)}  normal ${String(r.nor).padStart(5)}`);
console.log(`triangles ever front-most: A ${sum(seenA)}/${seenA.length} (${(100 * sum(seenA) / seenA.length).toFixed(1)} %) · B ${sum(seenB)}/${seenB.length} (${(100 * sum(seenB) / seenB.length).toFixed(1)} %)`);

// worst view as a triptych
const sharp = (await import('node:module')).createRequire(path.join(SCRATCH, 'tools/'))('sharp');
const { view, ra, rb, mask } = worst; const s = view.size; const img = Buffer.alloc(s * 3 * s * 3);
for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
  const o = y * s + x; const put = (col, r, g, b) => { const q = ((y * s * 3) + col * s + x) * 3; img[q] = r; img[q + 1] = g; img[q + 2] = b; };
  const va = shade(A.tris, ra.id[o], view.d), vb = shade(B.tris, rb.id[o], view.d); put(0, va, va, va); put(1, vb, vb, vb);
  const bad = mask[o] === 1;
  put(2, bad ? 255 : 20, bad ? 40 : 20, bad ? 40 : 20);
}
const png = path.join(OUT, `worst-${worst.name}.png`); await sharp(img, { raw: { width: s * 3, height: s, channels: 3 } }).png().toFile(png);
console.log(`worst view "${worst.name}" (${worst.bad} px) -> ${png}`);
{ // surface distance both ways: hollow to per-part over every triangle; per-part to hollow over the triangles that were ever front-most (the rest are the internals that were meant to go)
  const q = (u, f) => u[Math.floor(f * (u.length - 1))];
  const dBA = surfaceDistances(B.tris, [...seenB.keys()], A.tris);
  { // the surface the per-part model actually shows, point by point (every 150th front-most pixel of every view): how far is it from the hollow surface?
    const dist = distanceTo(B.tris); const d = Float64Array.from(hitPts, (p) => dist(p)).sort(); const qq = (f) => d[Math.floor(f * (d.length - 1))];
    console.log(`per-part visible surface -> hollow: ${d.length} pixel hit points, median ${qq(.5).toExponential(2)} mm, p99.9 ${qq(.999).toExponential(2)}, max ${d[d.length - 1].toFixed(4)} mm, farther than 20 um: ${d.filter((v) => v > 0.02).length}`);
  }
  for (const [n, u] of [['hollow -> per-part (every triangle)', dBA]]) console.log(`surface distance ${n}: ${u.length} samples, median ${q(u, .5).toExponential(2)} mm, p99 ${q(u, .99).toExponential(2)}, max ${u[u.length - 1].toFixed(4)} mm, over 20 um: ${u.filter((d) => d > 0.02).length}`);
}
process.exitCode = tot.cov + tot.depth + tot.normal ? 2 : 0;
