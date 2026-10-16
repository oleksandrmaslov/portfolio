/*
 * Which triangles of an assembled model can never be seen from outside it?
 *
 * Used by the hollow model builds after a boolean union. The union removes interior faces where parts overlap, but a cavity that is
 * only reachable through a port stays in the shell (the Venovisor's case is hollow, its only way in is the narrow port at the strap end).
 * A triangle is VISIBLE when
 *   1. it is the front-most surface at some pixel of an orthographic render from `dirs` directions (+ 26 high-resolution ones), or
 *   2. one of its points has an unobstructed ray to infinity: every triangle not seen in 1 is tested against `escapeDirs` directions with a
 *      no-cull depth buffer (this is what finds a surface at the far end of a narrow port), then each direction that found something is
 *      refined with a cone of `cone` more directions, and so on until nothing new turns up.
 * Unseen triangles are grouped by connectivity; a group of at least `minArea` mm2 is interior and is returned as hidden. Smaller unseen
 * groups are kept: a sub-pixel triangle on a visible surface is not interior, and dropping it would leave a pinhole.
 * `protect` (Uint8Array) marks triangles that must count as seen (a bore wall that a translucent lens would show).
 * `occluders` are triangles that hide things but are never dropped (the LED lenses: the model is judged as assembled).
 */
import { makeView, sphereDirs, render, bounds, faceNormal } from './glb-raster.mjs';

const areaOf = (t, i) => { const o = i * 9; const ax = t[o + 3] - t[o], ay = t[o + 4] - t[o + 1], az = t[o + 5] - t[o + 2], bx = t[o + 6] - t[o], by = t[o + 7] - t[o + 1], bz = t[o + 8] - t[o + 2]; return Math.hypot(ay * bz - az * by, az * bx - ax * bz, ax * by - ay * bx) / 2; };

/** `n` unit vectors in a cone of half-angle `deg` around `axis` (Fibonacci cap). */
export function cone(axis, deg, n) {
  const l = Math.hypot(...axis); const a = axis.map((v) => v / l); const ref = Math.abs(a[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  const u = [a[1] * ref[2] - a[2] * ref[1], a[2] * ref[0] - a[0] * ref[2], a[0] * ref[1] - a[1] * ref[0]]; const ul = Math.hypot(...u); u.forEach((_, i) => (u[i] /= ul));
  const v = [a[1] * u[2] - a[2] * u[1], a[2] * u[0] - a[0] * u[2], a[0] * u[1] - a[1] * u[0]]; const cmin = Math.cos(deg * Math.PI / 180); const out = []; const ga = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) { const c = 1 - (1 - cmin) * (i + 0.5) / n, s = Math.sqrt(1 - c * c), ph = ga * i; out.push([0, 1, 2].map((q) => a[q] * c + (u[q] * Math.cos(ph) + v[q] * Math.sin(ph)) * s)); }
  return out;
}

export function findHidden(tris, { occluders = new Float64Array(0), protect = null, dirs = 1000, size = 640, escapeDirs = 720, escapeSize = 900, cone: coneN = 200, minArea = 2, log = () => {} } = {}) {
  const nT = tris.length / 9; const all = new Float64Array(tris.length + occluders.length); all.set(tris); all.set(occluders, tris.length);
  const B = bounds(all); const seen = new Uint8Array(nT); if (protect) protect.forEach((p, i) => { if (p) seen[i] = 1; });
  // 1. front-most surface in some pixel
  for (const d of sphereDirs(dirs)) { const r = render(all, makeView(d, B.c, B.r * 1.02, size)); for (const i of r.id) if (i >= 0 && i < nT) seen[i] = 1; }
  for (const x of [-1, 0, 1]) for (const y of [-1, 0, 1]) for (const z of [-1, 0, 1]) if (x || y || z) { const r = render(all, makeView([x, y, z], B.c, B.r * 1.02, size * 2)); for (const i of r.id) if (i >= 0 && i < nT) seen[i] = 1; }
  const raster = seen.reduce((a, b) => a + b, 0); log(`visibility: ${raster}/${nT} triangles are front-most in some pixel of ${dirs} + 26 views`);
  // 2. an unobstructed ray from a point of a still-unseen triangle
  let cand = []; for (let i = 0; i < nT; i++) if (!seen[i] && areaOf(tris, i) > 1e-3) { const o = i * 9; cand.push({ i, p: [0, 1, 2].map((d) => (tris[o + d] + tris[o + 3 + d] + tris[o + 6 + d]) / 3), n: faceNormal(tris, i) }); }
  const probe = (d) => { // returns the candidates with a free ray along d
    const v = makeView(d, B.c, B.r * 1.02, escapeSize); const r = render(all, v, { cull: false }); const k = escapeSize / (2 * v.hw); const found = [];
    for (const s of cand) {
      if (seen[s.i] || s.n[0] * d[0] + s.n[1] * d[1] + s.n[2] * d[2] < 0.1) continue;
      const x = [s.p[0] - v.c[0], s.p[1] - v.c[1], s.p[2] - v.c[2]]; const px = Math.floor((x[0] * v.u[0] + x[1] * v.u[1] + x[2] * v.u[2] + v.hw) * k), py = Math.floor((v.hw - (x[0] * v.v[0] + x[1] * v.v[1] + x[2] * v.v[2])) * k);
      const o = py * escapeSize + px; const zs = x[0] * d[0] + x[1] * d[1] + x[2] * d[2];
      if (r.id[o] < 0 || r.id[o] === s.i || r.depth[o] <= zs + 0.03) found.push(s.i);
    }
    return found;
  };
  let queue = sphereDirs(escapeDirs); let rounds = 0, escaped = 0;
  while (queue.length && rounds < 4) {
    const next = [];
    for (const d of queue) {
      const f = probe(d).filter((i) => !seen[i]); if (!f.length) continue;   // only a direction that turned up something NEW is worth refining around
      for (const i of f) { seen[i] = 1; escaped++; }
      // a surface at the end of a narrow port is seen in pieces, and a centroid test sees one point of a piece: render the neighbourhood along this ray at 0.03 mm/px
      const c = [0, 1, 2].map((q) => f.reduce((a, i) => a + (tris[i * 9 + q] + tris[i * 9 + 3 + q] + tris[i * 9 + 6 + q]) / 3, 0) / f.length);
      const zr = render(all, makeView(d, c, 6, 400)); for (const i of zr.id) if (i >= 0 && i < nT && !seen[i]) { seen[i] = 1; escaped++; }
      if (rounds < 3 && next.length < 600) next.push(...cone(d, 12 / (rounds + 1), Math.max(8, coneN >> (2 * rounds))));
    }
    queue = next; rounds++; if (queue.length) log(`  escape round ${rounds}: ${escaped} interior triangles reach the outside, ${queue.length} refinement directions`);
  }
  // 3. unseen triangles by connectivity; big groups are interior
  const key = (i, j) => [0, 1, 2].map((d) => Math.round(tris[i * 9 + j * 3 + d] * 1e3)).join(',');
  const par = new Map(); const find = (x) => { while (par.get(x) !== x) { par.set(x, par.get(par.get(x))); x = par.get(x); } return x; };
  const unseen = []; for (let i = 0; i < nT; i++) if (!seen[i]) { unseen.push(i); for (let j = 0; j < 3; j++) { const k = key(i, j); if (!par.has(k)) par.set(k, k); } }
  for (const i of unseen) { par.set(find(key(i, 0)), find(key(i, 1))); par.set(find(key(i, 1)), find(key(i, 2))); }
  const groups = new Map(); for (const i of unseen) { const c = find(key(i, 0)); const g = groups.get(c) || groups.set(c, { tris: [], area: 0 }).get(c); g.tris.push(i); g.area += areaOf(tris, i); }
  const hidden = new Uint8Array(nT); const big = [...groups.values()].filter((g) => g.area >= minArea);
  for (const g of big) for (const i of g.tris) hidden[i] = 1;
  const small = unseen.length - big.reduce((a, g) => a + g.tris.length, 0);
  log(`visibility: ${unseen.length} unseen triangles in ${groups.size} groups; ${big.length} interior group(s) >= ${minArea} mm2 dropped (${big.map((g) => g.tris.length + ' tris ' + g.area.toFixed(0) + ' mm2').join(', ')}), ${small} unseen fragments kept`);
  return { hidden, seen, stats: { raster, escaped, groups: big.length, hiddenTris: big.reduce((a, g) => a + g.tris.length, 0), keptFragments: small } };
}
