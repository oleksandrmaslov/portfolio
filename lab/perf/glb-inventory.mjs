// Dependency-free GLB inventory: bytes, gzip, triangles, meshes, primitives, materials, textures
// (format, size, estimated GPU bytes), extensions, meshopt payload. EXT_mesh_gpu_instancing counts as
// one draw call and N instances of triangles.
//
//   node lab/perf/glb-inventory.mjs models/*.glb            (table)
//   node lab/perf/glb-inventory.mjs --json models/iskra-mark.glb
//
// "gpu" for a KTX2 texture is 1 byte/texel plus mips (BC7 / ETC2-RGBA / ASTC 4x4 are all 8 bpp); for
// PNG/JPEG it is RGBA8 plus mips. A browser run reports the true figure (the harness in
// lab/models-perf.md sums the uploaded mip chains); this one needs no browser.

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const COMP = { 5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4 };
const NCOMP = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT2: 4, MAT3: 9, MAT4: 16 };

export function parseGLB(buf) {
  if (buf.readUInt32LE(0) !== 0x46546c67) throw new Error('not a GLB');
  let off = 12, json = null, bin = null;
  while (off < buf.length) {
    const len = buf.readUInt32LE(off), type = buf.readUInt32LE(off + 4), data = buf.subarray(off + 8, off + 8 + len);
    if (type === 0x4e4f534a) json = JSON.parse(data.toString('utf8')); else if (type === 0x004e4942) bin = data;
    off += 8 + len;
  }
  return { json, bin };
}

function imageInfo(b) {
  if (b.readUInt32BE(0) === 0x89504e47) return { fmt: 'png', w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
  if (b[0] === 0xff && b[1] === 0xd8) {
    for (let o = 2; o < b.length;) {
      if (b[o] !== 0xff) { o++; continue; }
      const m = b[o + 1];
      if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return { fmt: 'jpeg', h: b.readUInt16BE(o + 5), w: b.readUInt16BE(o + 7) };
      o += 2 + b.readUInt16BE(o + 2);
    }
  }
  if (b[0] === 0xab && b.subarray(1, 5).toString() === 'KTX ') return { fmt: 'ktx2', w: b.readUInt32LE(20), h: b.readUInt32LE(24), levels: b.readUInt32LE(40) };
  return { fmt: '?' };
}
const textureGpu = (i) => (!i.w ? 0 : Math.round(i.w * i.h * (i.fmt === 'ktx2' ? 1 : 4) * 1.333));

export function inventory(file) {
  const buf = fs.readFileSync(file);
  const { json, bin } = parseGLB(buf);
  const acc = json.accessors || [], bvs = json.bufferViews || [];
  const uses = new Map(); let instanced = 0;
  (json.nodes || []).forEach((n) => {
    if (n.mesh == null) return;
    const g = n.extensions && n.extensions.EXT_mesh_gpu_instancing;
    const k = g ? acc[Object.values(g.attributes)[0]].count : 1;
    instanced += g ? k : 0; uses.set(n.mesh, { n: (uses.get(n.mesh)?.n || 0) + k, gpu: !!g });
  });
  let tris = 0, prims = 0, draws = 0; const used = new Set();
  (json.meshes || []).forEach((m, mi) => {
    const u = uses.get(mi) || { n: 1, gpu: false };
    for (const p of m.primitives) {
      prims++; used.add(p.indices); Object.values(p.attributes).forEach((a) => used.add(a));
      const t = (p.indices != null ? acc[p.indices].count : acc[p.attributes.POSITION].count) / 3;
      tris += (p.mode ?? 4) === 4 ? t * u.n : 0; draws += u.gpu ? 1 : u.n;
    }
  });
  let geomBytes = 0;
  for (const i of used) if (i != null) geomBytes += acc[i].count * COMP[acc[i].componentType] * NCOMP[acc[i].type];
  const textures = (json.images || []).map((im) => {
    const bv = im.bufferView != null ? bvs[im.bufferView] : null;
    const data = bv ? bin.subarray(bv.byteOffset || 0, (bv.byteOffset || 0) + bv.byteLength) : null;
    const info = data ? imageInfo(data) : { fmt: 'external' };
    return { ...info, bytes: data ? data.length : 0, gpu: textureGpu(info) };
  });
  return {
    file: path.basename(file), raw: buf.length, gzip6: zlib.gzipSync(buf, { level: 6 }).length,
    tris: Math.round(tris), meshes: (json.meshes || []).length, prims, drawCalls: draws, instances: instanced,
    materials: (json.materials || []).length, materialNames: (json.materials || []).map((m) => m.name),
    textures, textureGpu: textures.reduce((s, t) => s + t.gpu, 0), geometryBytes: geomBytes,
    extensions: json.extensionsUsed || [], required: json.extensionsRequired || [],
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2), asJson = args[0] === '--json', files = asJson ? args.slice(1) : args;
  const rows = files.map(inventory);
  if (asJson) console.log(JSON.stringify(rows, null, 1));
  else for (const r of rows) console.log(r.file.padEnd(28), String(r.raw).padStart(8), String(r.gzip6).padStart(8), String(r.tris).padStart(7), 'tris', String(r.drawCalls).padStart(3), 'draws', String(r.materials).padStart(2), 'mats', String(r.textures.length), 'tex', String(Math.round(r.textureGpu / 1024)).padStart(6), 'KB tex-gpu');
}
