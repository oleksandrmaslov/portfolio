// Merge the 53 files in models/wafer_parts/ into one GLB without touching the sources.
//
//   shared    one node per part, named exactly like the file ("case_L", "key_R_r1c3" ...).
//             The 36 keycap nodes point at ONE shared mesh (their geometry is byte-identical).
//             lab/wafer.js and about-board.jsx keep finding parts by name.
//   instanced the 36 keycaps collapse into one EXT_mesh_gpu_instancing node. Same bytes as
//             "shared"; the per-key nodes are gone (names survive only in extras.instances),
//             so any consumer that moves or picks single keys has to expand the instances.
//
// Run from a directory that has the tools installed (nothing here is a site dependency):
//   npm i --prefix /tmp/tools @gltf-transform/core @gltf-transform/extensions \
//         @gltf-transform/functions meshoptimizer
//   NODE_PATH=/tmp/tools/node_modules node lab/perf/merge-wafer-parts.mjs models/wafer_parts /tmp/out
// (ES modules ignore NODE_PATH; if the imports fail, copy this file next to the node_modules.)
//
// Measured 2026-10-14: 1,138,340 B (53 files) -> 945,748 B shared / 940,728 B instanced; positions
// identical to the sources to 3e-10 of each part's diagonal. See lab/models-perf.md.

import { Document, NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS, EXTMeshGPUInstancing } from '@gltf-transform/extensions';
import { mergeDocuments, dedup, prune, meshopt, reorder } from '@gltf-transform/functions';
import { MeshoptDecoder, MeshoptEncoder } from 'meshoptimizer';
import fs from 'node:fs';
import path from 'node:path';

const [SRC = 'models/wafer_parts', OUT = 'out'] = process.argv.slice(2);
await MeshoptDecoder.ready; await MeshoptEncoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder });

const names = fs.readdirSync(SRC).filter((f) => f.endsWith('.glb')).map((f) => f.slice(0, -4)).sort();
const STRUCT = ['case_L', 'case_R', 'plate_L', 'plate_R', 'pcb_L', 'pcb_R', 'usbc_L', 'usbc_R',
  'switches_L', 'switches_R', 'mcu', 'display_L', 'display_R', 'antenna_L', 'antenna_R', 'softoff_L', 'softoff_R'];
const order = STRUCT.concat(names.filter((n) => n.startsWith('key_')));
fs.mkdirSync(OUT, { recursive: true });

async function build(mode) {
  const doc = new Document();
  const buffer = doc.createBuffer();
  const scene = doc.createScene('wafer');
  const byName = new Map();
  for (const n of order) {
    const src = await io.read(path.join(SRC, n + '.glb'));   // one scene, one root node named n
    const map = mergeDocuments(doc, src);
    for (const child of src.getRoot().listScenes()[0].listChildren()) {
      const node = map.get(child); scene.addChild(node); byName.set(n, node);
    }
  }
  for (const s of doc.getRoot().listScenes()) if (s !== scene) s.dispose();
  doc.getRoot().listAccessors().forEach((a) => a.setBuffer(buffer));
  doc.getRoot().listBuffers().slice(1).forEach((b) => b.dispose());
  await doc.transform(dedup());                              // 36 key meshes -> 1, equal materials -> 1

  if (mode === 'instanced') {
    const keyNames = order.filter((n) => n.startsWith('key_'));
    const keyNodes = keyNames.map((n) => byName.get(n));
    const mesh = keyNodes[0].getMesh();
    if (!keyNodes.every((k) => k.getMesh() === mesh)) throw new Error('key meshes did not dedup');
    const T = new Float32Array(keyNodes.length * 3), R = new Float32Array(keyNodes.length * 4), S = new Float32Array(keyNodes.length * 3);
    keyNodes.forEach((k, i) => { T.set(k.getTranslation(), i * 3); R.set(k.getRotation(), i * 4); S.set(k.getScale(), i * 3); });
    const acc = (type, arr) => doc.createAccessor().setType(type).setArray(arr).setBuffer(buffer);
    const inst = doc.createExtension(EXTMeshGPUInstancing).createInstancedMesh()
      .setAttribute('TRANSLATION', acc('VEC3', T)).setAttribute('ROTATION', acc('VEC4', R)).setAttribute('SCALE', acc('VEC3', S));
    const node = doc.createNode('keys').setMesh(mesh).setExtension('EXT_mesh_gpu_instancing', inst).setExtras({ instances: keyNames });
    keyNodes.forEach((k) => k.dispose());
    scene.addChild(node);
  }
  await doc.transform(prune());
  await doc.transform(reorder({ encoder: MeshoptEncoder }));
  await doc.transform(meshopt({ encoder: MeshoptEncoder, level: 'high' }));
  return io.writeBinary(doc);
}

for (const mode of ['shared', 'instanced']) {
  const glb = await build(mode);
  const file = path.join(OUT, `wafer-parts-${mode}.glb`);
  fs.writeFileSync(file, glb);
  console.log(file, glb.length, 'bytes');
}
