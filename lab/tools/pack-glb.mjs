#!/usr/bin/env node
/*
 * node lab/tools/pack-glb.mjs IN.glb OUT.glb [--normal-bits 8]
 *
 * Meshopt-compress a GLB the way gltfpack -c -vpf does (positions stay float32 so a model's local frame is exact metres, normals are
 * 8-bit, EXT_meshopt_compression + KHR_mesh_quantization, both required: model-viewer.jsx already installs MeshoptDecoder) BUT KEEPING
 * CUSTOM VERTEX ATTRIBUTES. gltfpack 1.3 drops them even with -kv ("Warning: ignoring custom attribute _PRINTZ"), and the merged,
 * internals-free models carry their layer-line height in _PRINTZ. Vertices are reordered for size with all attributes together, so
 * the attribute stays attached to its vertex. Needs <SCRATCH>/tools: npm i --prefix <SCRATCH>/tools @gltf-transform/core
 * @gltf-transform/extensions @gltf-transform/functions meshoptimizer
 */
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const argv = process.argv.slice(2); const files = argv.filter((a, i) => !a.startsWith('--') && !(i && argv[i - 1] === '--normal-bits'));
if (files.length !== 2) { console.error('usage: node lab/tools/pack-glb.mjs IN.glb OUT.glb [--normal-bits 8]'); process.exit(1); }
const bits = argv.includes('--normal-bits') ? +argv[argv.indexOf('--normal-bits') + 1] : 8;
const SCRATCH = process.env.SCRATCH || path.join(os.tmpdir(), 'materialize');
const req = createRequire(path.join(SCRATCH, 'tools/'));
const load = (m) => import(pathToFileURL(req.resolve(m)).href);
const core = await load('@gltf-transform/core'), ext = await load('@gltf-transform/extensions'), fn = await load('@gltf-transform/functions'), mo = await load('meshoptimizer');
await mo.MeshoptEncoder.ready; await mo.MeshoptDecoder.ready;
const io = new core.NodeIO().registerExtensions([ext.EXTMeshoptCompression, ext.KHRMeshQuantization]).registerDependencies({ 'meshopt.encoder': mo.MeshoptEncoder, 'meshopt.decoder': mo.MeshoptDecoder });
const doc = await io.read(files[0]);
await doc.transform(
  fn.reorder({ encoder: mo.MeshoptEncoder, target: 'size' }),
  fn.quantize({ pattern: /^NORMAL$/, patternTargets: /^$/, quantizeNormal: bits }),   // normals only: nothing else is touched
);
doc.createExtension(ext.EXTMeshoptCompression).setRequired(true).setEncoderOptions({ method: ext.EXTMeshoptCompression.EncoderMethod.QUANTIZE });   // compress the types as they are: no filter, no lossy float positions
await io.write(files[1], doc);
