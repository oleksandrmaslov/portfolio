#!/usr/bin/env node
/* ============================================================
   WAFER — models/wafer.glb, built from models/wafer_parts/
   ------------------------------------------------------------
   Build tool, not deployed. The 53 CAD part files are what the study
   (lab/wafer.js) loads; the site loads this one derived file, which
   carries everything the lab used to work out in the browser:

     · the 53 parts as nodes named like the files, the 36 keys
       sharing one mesh (the explosions find parts by name)
     · normals creased at 40° (the exported ones are averaged across
       hard edges: the pyramid shading on every cap top)
     · the palettes of switches_L/R and display_L/R as node extras
       [[hex, roughness, metalness, tag?]], tag "active" on the panel
     · the two MIP panels as lid nodes screen_L / screen_R over their
       displays, each a quad with a 68 x 160 PNG
     · no KTX2: the site loads no transcoder. Only the PCBs keep their
       UVs, for the artwork the explosions show, which ships beside the
       file as models/wafer-pcb-L.webp and -R.webp (1024 px, decoded
       from the parts' KTX2 maps).

   The frame is the one the old single-file Wafer had (Z-up, metres): the
   registry's fits and poses keep their meaning.

   Two stages:

     node tools/wafer/build.mjs capture --tools <dir> [--base http://127.0.0.1:8765/]
         Needs the preview server, the untracked lab (lab/mip.js,
         assets/Connected.svg, assets/Peripheral.svg) and Montserrat from
         Google Fonts. Playwright drives tools/wafer/capture.html, which
         reads each palette strip back off the GPU, draws both panels and
         decodes both PCB maps. Writes tools/wafer/palettes.json,
         panel-status.png, panel-media.png and models/wafer-pcb-L/R.webp.
         Those are committed, so the second stage needs none of this.

     node tools/wafer/build.mjs pack --tools <dir>
         Node only. Writes models/wafer.glb and asserts its contract.
         Deterministic: a second run is byte-identical.

   The tools live outside the repo:
     npm i --prefix <dir> @gltf-transform/core@4 @gltf-transform/extensions@4 \
       @gltf-transform/functions@4 meshoptimizer gltfpack@1.3.0 three@0.160.0 playwright
   (capture also takes PLAYWRIGHT=<path to a playwright package> and
   CHROME=<executable>; it runs Chrome on SwiftShader.) A full rebuild,
   from the repository root with the preview server up:

     python -m http.server 8765 &
     node tools/wafer/build.mjs capture --tools ~/wafer-tools
     node tools/wafer/build.mjs pack --tools ~/wafer-tools

   Re-run pack alone after a change to this file or to palettes.json;
   re-run capture only when the parts, the SWAP table, lab/mip.js or the
   panel designs change.
   ============================================================ */
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import zlib from "node:zlib";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const HERE = path.join(ROOT, "tools", "wafer");
const PARTS = path.join(ROOT, "models", "wafer_parts");
const OUT = path.join(ROOT, "models", "wafer.glb");
const PCB = (side) => path.join(ROOT, "models", `wafer-pcb-${side}.webp`);
/* gzip -6. The single-file Wafer this file replaced was 630,153 B, and this file is 620,776 B without the PCB UVs. The
   explosions' artwork needs them (+20,006 B; snapping them to a 1/4096 grid saves nothing), so the ceiling is the old
   file plus that. */
const WIRE_CEILING = 645000;
const CREASE = 40;             // degrees, the study's: edges sharper than this stay hard
const UNIT = 1000;             // creased in millimetres: r160 toCreasedNormals hashes positions to 0.01 units

const STRUCT = [
  "case_L", "case_R", "plate_L", "plate_R", "pcb_L", "pcb_R", "usbc_L", "usbc_R",
  "switches_L", "switches_R", "mcu", "display_L", "display_R",
  "antenna_L", "antenna_R", "softoff_L", "softoff_R",
];
const KEYS = [];
for (const s of ["L", "R"]) {
  for (let r = 0; r < 3; r++) for (let c = 0; c < 5; c++) KEYS.push(`key_${s}_r${r}c${c}`);
  for (let t = 0; t < 3; t++) KEYS.push(`key_${s}_t${t}`);
}
const NAMES = STRUCT.concat(KEYS);
const PALETTED = ["switches_L", "switches_R", "display_L", "display_R"];
const LIDS = { display_L: ["screen_L", "panel-status.png", "mip-panel-L"], display_R: ["screen_R", "panel-media.png", "mip-panel-R"] };

const args = process.argv.slice(2), stage = args[0];
const opt = (k, d) => { const i = args.indexOf(k); return i > 0 ? args[i + 1] : d; };
const TOOLS = opt("--tools");
if (!["capture", "pack"].includes(stage) || !TOOLS) {
  console.error("usage: node tools/wafer/build.mjs capture|pack --tools <dir>   (see the header)");
  process.exit(2);
}
const need = createRequire(path.join(path.resolve(TOOLS), "noop.js"));
const fail = (msg) => { throw new Error("wafer build: " + msg); };

/* ---------------- capture ---------------- */

async function capture() {
  const pw = process.env.PLAYWRIGHT ? createRequire(import.meta.url)(process.env.PLAYWRIGHT) : need("playwright");
  const base = opt("--base", "http://127.0.0.1:8765/");
  const browser = await pw.chromium.launch({
    executablePath: process.env.CHROME || "/usr/bin/google-chrome",
    args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
  });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    await page.goto(base + "tools/wafer/capture.html", { waitUntil: "load", timeout: 120000 });
    await page.waitForFunction(() => window.captureReady, null, { timeout: 120000 });
    const got = await page.evaluate(() => window.capture());
    if (errors.length) fail("capture page errors: " + errors.join(" | "));
    if (!got.fonts.some((f) => /Montserrat/.test(f))) fail("Montserrat did not load: the panels would draw in a fallback face");
    for (const [side, c] of Object.entries(got.pcbCheck)) {
      console.log(`pcb_${side}: ${c.source} -> 1024 WebP, std ${c.std}, render diff ${c.diff} (upside down: ${c.flippedDiff})`);
      if (c.std < 4) fail(`pcb_${side} artwork came back blank`);
      if (!(c.diff < 4 && c.diff * 4 < c.flippedDiff)) fail(`pcb_${side} WebP does not land on the board the way the KTX2 map did`);
    }
    const png = (url) => Buffer.from(url.split(",")[1], "base64");
    fs.writeFileSync(path.join(HERE, "palettes.json"), JSON.stringify(got.palettes, null, 2) + "\n");
    fs.writeFileSync(path.join(HERE, "panel-status.png"), png(got.panels.status));
    fs.writeFileSync(path.join(HERE, "panel-media.png"), png(got.panels.media));
    for (const side of ["L", "R"]) fs.writeFileSync(PCB(side), png(got.pcb[side]));
    for (const [k, v] of Object.entries(got.palettes)) console.log(`${k}: ${v.map((e) => e[0].slice(1) + (e[3] ? "*" : "")).join(" ")}`);
    console.log("wrote tools/wafer/palettes.json, panel-status.png, panel-media.png, models/wafer-pcb-L.webp, models/wafer-pcb-R.webp");
  } finally {
    await browser.close();
  }
}

/* ---------------- pack ---------------- */

async function pack() {
  const { Document, NodeIO } = need("@gltf-transform/core");
  const { ALL_EXTENSIONS } = need("@gltf-transform/extensions");
  const { mergeDocuments, dedup, prune } = need("@gltf-transform/functions");
  const { MeshoptDecoder } = need("meshoptimizer");
  const threeDir = path.resolve(path.dirname(need.resolve("three")), "..");   // three.cjs lives in build/
  const THREE = await import(pathToFileURL(path.join(threeDir, "build", "three.module.js")));
  const { toCreasedNormals, mergeVertices } = await import(pathToFileURL(path.join(threeDir, "examples", "jsm", "utils", "BufferGeometryUtils.js")));
  await MeshoptDecoder.ready;
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ "meshopt.decoder": MeshoptDecoder });
  const palettes = JSON.parse(fs.readFileSync(path.join(HERE, "palettes.json"), "utf8"));

  // 1. merge: one scene, one node per part file, named like it (the logic of lab/perf/merge-wafer-parts.mjs, "shared")
  const doc = new Document();
  const buffer = doc.createBuffer();
  const scene = doc.createScene("wafer");
  const byName = new Map();
  for (const n of NAMES) {
    const src = await io.read(path.join(PARTS, n + ".glb"));   // one scene, one root node named n
    const map = mergeDocuments(doc, src);
    for (const child of src.getRoot().listScenes()[0].listChildren()) { const node = map.get(child); scene.addChild(node); byName.set(n, node); }
  }
  for (const s of doc.getRoot().listScenes()) if (s !== scene) s.dispose();
  doc.getRoot().listAccessors().forEach((a) => a.setBuffer(buffer));
  doc.getRoot().listBuffers().slice(1).forEach((b) => b.dispose());
  await doc.transform(dedup());   // the 36 key meshes are byte-identical: one mesh

  // 2. strip: every texture goes (the PCB artwork ships as WebP beside the file), and with them KTX2
  doc.getRoot().listTextures().forEach((t) => t.dispose());
  for (const e of doc.getRoot().listExtensionsUsed()) if (e.extensionName === "KHR_texture_basisu") e.dispose();

  // 3. palettes, read off the GPU by the capture stage
  for (const n of PALETTED) byName.get(n).setExtras({ palette: palettes[n] });

  // 4. crease every mesh in world millimetres, then back to its node's frame as float POSITION / NORMAL / TEXCOORD_0 + index
  const world = (node) => new THREE.Matrix4().fromArray(node.getWorldMatrix());
  const owner = new Map();   // mesh -> the first node that draws it (the keys differ only by where they sit)
  for (const n of NAMES) for (const node of [byName.get(n), ...byName.get(n).listChildren()]) if (node.getMesh() && !owner.has(node.getMesh())) owner.set(node.getMesh(), node);
  const v = new THREE.Vector3();
  for (const [mesh, node] of owner) {
    const M = world(node).premultiply(new THREE.Matrix4().makeScale(UNIT, UNIT, UNIT)), inv = M.clone().invert();
    const nm = new THREE.Matrix3().getNormalMatrix(inv), flip = M.determinant() < 0;
    for (const prim of mesh.listPrimitives()) {
      const pos = prim.getAttribute("POSITION"), uv = prim.getAttribute("TEXCOORD_0"), idx = prim.getIndices();
      const count = idx ? idx.getCount() : pos.getCount(), e = [0, 0, 0];
      const P = new Float32Array(count * 3), U = uv ? new Float32Array(count * 2) : null;
      for (let i = 0; i < count; i++) {
        const j = flip && i % 3 ? (i % 3 === 1 ? i + 1 : i - 1) : i;   // keep the winding when a half is mirrored
        const k = idx ? idx.getScalar(i) : i;
        v.fromArray(pos.getElement(k, e)).applyMatrix4(M).toArray(P, j * 3);
        if (U) { uv.getElement(k, e); U[j * 2] = e[0]; U[j * 2 + 1] = e[1]; }
      }
      let g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.BufferAttribute(P, 3));
      if (U) g.setAttribute("uv", new THREE.BufferAttribute(U, 2));
      g = mergeVertices(toCreasedNormals(g, (CREASE * Math.PI) / 180), 1e-3);
      const gp = g.attributes.position, gn = g.attributes.normal, gi = g.index.array;
      for (let i = 0; i < gp.count; i++) {
        v.fromBufferAttribute(gp, i).applyMatrix4(inv).toArray(gp.array, i * 3);
        v.fromBufferAttribute(gn, i).applyMatrix3(nm).normalize().toArray(gn.array, i * 3);
      }
      if (flip) for (let i = 0; i < gi.length; i += 3) { const t = gi[i + 1]; gi[i + 1] = gi[i + 2]; gi[i + 2] = t; }   // the node mirrors it again
      const acc = (type, array) => doc.createAccessor().setType(type).setArray(array).setBuffer(buffer);
      prim.setAttribute("POSITION", acc("VEC3", new Float32Array(gp.array)));
      prim.setAttribute("NORMAL", acc("VEC3", new Float32Array(gn.array)));
      if (U) prim.setAttribute("TEXCOORD_0", acc("VEC2", new Float32Array(g.attributes.uv.array)));
      prim.setIndices(acc("SCALAR", gp.count > 65535 ? new Uint32Array(gi) : new Uint16Array(gi)));
    }
  }

  // 5. the lids: each panel over its display's active area, facing +Z, the canvas top toward +Y (glTF's v 0 is the image's top row)
  for (const [display, [lidName, png, matName]] of Object.entries(LIDS)) {
    const node = byName.get(display), entries = palettes[display], n = entries.length, active = entries.findIndex((x) => x[3] === "active");
    const Mw = new THREE.Matrix4().fromArray(node.getWorldMatrix()), nw = new THREE.Matrix3().getNormalMatrix(Mw);
    const box = new THREE.Box3(), nv = new THREE.Vector3(), e = [0, 0, 0];
    for (const prim of node.getMesh().listPrimitives()) {
      const pos = prim.getAttribute("POSITION"), nrm = prim.getAttribute("NORMAL"), uv = prim.getAttribute("TEXCOORD_0");
      for (let i = 0; i < pos.getCount(); i++) {
        if (Math.floor(uv.getElement(i, e)[0] * n) !== active) continue;
        if (nv.fromArray(nrm.getElement(i, e)).applyMatrix3(nw).normalize().z < 0.9) continue;
        box.expandByPoint(v.fromArray(pos.getElement(i, e)).applyMatrix4(Mw));
      }
    }
    if (box.isEmpty()) fail(`no active area facing +Z on ${display}`);
    // The quad is written in the display's own frame, under an identity node: gltfpack quantises every mesh on one grid
    // in its node's units, and the display's units are 19 mm, so the lid keeps 2 um steps where metres would give 122 um
    // (enough to sink it under the glass it sits on).
    const inv = Mw.clone().invert(), z = box.max.z + 0.00002;
    const corners = [[box.min.x, box.min.y], [box.max.x, box.min.y], [box.max.x, box.max.y], [box.min.x, box.max.y]]
      .flatMap(([x, y]) => v.set(x, y, z).applyMatrix4(inv).toArray());
    const up = nv.set(0, 0, 1).applyMatrix3(new THREE.Matrix3().getNormalMatrix(inv)).normalize().toArray();
    const acc = (type, array) => doc.createAccessor().setType(type).setArray(array).setBuffer(buffer);
    const quad = doc.createPrimitive()
      .setAttribute("POSITION", acc("VEC3", new Float32Array(corners)))
      .setAttribute("NORMAL", acc("VEC3", new Float32Array([...up, ...up, ...up, ...up])))
      .setAttribute("TEXCOORD_0", acc("VEC2", new Float32Array([0, 1, 1, 1, 1, 0, 0, 0])))
      .setIndices(acc("SCALAR", new Uint16Array(Mw.determinant() < 0 ? [0, 2, 1, 0, 3, 2] : [0, 1, 2, 0, 2, 3])));   // a mirroring display flips the winding back
    const tex = doc.createTexture(lidName).setMimeType("image/png").setImage(fs.readFileSync(path.join(HERE, png)));
    const mat = doc.createMaterial(matName).setBaseColorTexture(tex).setRoughnessFactor(0.4).setMetallicFactor(0);
    mat.getBaseColorTextureInfo().setMagFilter(9728).setMinFilter(9987).setWrapS(33071).setWrapT(33071);
    quad.setMaterial(mat);
    node.addChild(doc.createNode(lidName).setMesh(doc.createMesh(lidName).addPrimitive(quad)));
  }

  // 6. a float GLB, packed by gltfpack: -kn keeps the named nodes, -km the materials, -ke the palettes,
  //    -kv the palette and PCB UVs no texture references, -vtf keeps them float (no texture transform to carry)
  for (const e of doc.getRoot().listExtensionsUsed()) if (["EXT_meshopt_compression", "KHR_mesh_quantization"].includes(e.extensionName)) e.dispose();
  await doc.transform(prune({ keepAttributes: true }));   // the palette and PCB UVs: no texture names them any more
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "wafer-"));
  try {
    fs.writeFileSync(path.join(tmp, "float.glb"), await new NodeIO().registerExtensions(ALL_EXTENSIONS).writeBinary(doc));
    execFileSync(process.execPath, [need.resolve("gltfpack/cli.js"), "-i", path.join(tmp, "float.glb"), "-o", OUT, "-cc", "-kn", "-km", "-ke", "-kv", "-vtf"], { stdio: "inherit" });
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }

  // 7. the contract, read back
  const out = await io.read(OUT), root = out.getRoot(), named = new Map();
  for (const node of root.listNodes()) if (node.getName()) named.set(node.getName(), node);
  const ok = (cond, msg) => { if (!cond) fail(msg); console.log("  ok  " + msg); };
  const all = NAMES.concat(["screen_L", "screen_R"]);
  ok(all.every((n) => named.has(n)), `${all.length} named nodes: the 53 parts and the two lids`);
  const meshOf = (n) => { const node = named.get(n); return node.getMesh() || node.listChildren().map((c) => c.getMesh()).find(Boolean); };
  ok(new Set(KEYS.map(meshOf)).size === 1 && meshOf(KEYS[0]), "every key_* node draws one mesh");
  const prims = (n) => [named.get(n), ...named.get(n).listChildren()].flatMap((x) => (x.getMesh() ? x.getMesh().listPrimitives() : []));
  const floatUV = (n) => prims(n).every((p) => p.getAttribute("TEXCOORD_0") && p.getAttribute("TEXCOORD_0").getComponentType() === 5126);
  ok(PALETTED.concat(["screen_L", "screen_R", "pcb_L", "pcb_R"]).every(floatUV), "FLOAT TEXCOORD_0 on switches, display, screen and pcb");
  const images = root.listTextures();
  ok(images.length === 2 && images.every((t) => t.getMimeType() === "image/png"), "exactly 2 images, both PNG: the panels");
  const used = root.listExtensionsUsed().map((x) => x.extensionName), req = root.listExtensionsRequired().map((x) => x.extensionName);
  ok(!used.includes("KHR_texture_basisu") && !used.includes("KHR_lights_punctual"), "no KTX2, no punctual light");
  ok(req.every((x) => ["KHR_mesh_quantization", "EXT_meshopt_compression"].includes(x)), `extensionsRequired ⊆ {KHR_mesh_quantization, EXT_meshopt_compression}: [${req}]`);
  ok(PALETTED.every((n) => Array.isArray(named.get(n).getExtras().palette) && named.get(n).getExtras().palette.length > 0), "extras.palette on switches_L/R and display_L/R");
  for (const n of PALETTED) {
    const len = named.get(n).getExtras().palette.length, e = [0, 0];
    const inside = prims(n).every((p) => { const uv = p.getAttribute("TEXCOORD_0"); for (let i = 0; i < uv.getCount(); i++) { const k = Math.floor(uv.getElement(i, e)[0] * len); if (k < 0 || k >= len) return false; } return true; });
    ok(inside, `${n}: every floor(u x ${len}) lands on a palette entry`);
  }
  const zs = (node, skip) => {   // world z of every vertex under node, packed and dequantised as three will draw it
    const out = [], e = [0, 0, 0], at = new THREE.Vector3();
    const walk = (x) => {
      if (x.getName() === skip) return;
      const M = new THREE.Matrix4().fromArray(x.getWorldMatrix());
      if (x.getMesh()) for (const p of x.getMesh().listPrimitives()) { const pos = p.getAttribute("POSITION"); for (let i = 0; i < pos.getCount(); i++) out.push(at.fromArray(pos.getElement(i, e)).applyMatrix4(M).z); }
      x.listChildren().forEach(walk);
    };
    walk(node);
    return out;
  };
  for (const [display, [lidName]] of Object.entries(LIDS)) {
    const top = Math.max(...zs(named.get(display), lidName)), lid = zs(named.get(lidName));
    ok(Math.min(...lid) > top && Math.max(...lid) < top + 0.00004, `${lidName} lies flat 0.02 mm over ${display}, above its glass`);
  }
  const raw = fs.readFileSync(OUT), wire = zlib.gzipSync(raw, { level: 6 }).length;
  console.log(`models/wafer.glb: ${raw.length} B raw, ${wire} B gzip -6 (ceiling ${WIRE_CEILING})`);
  ok(wire <= WIRE_CEILING, `gzip -6 within ${WIRE_CEILING} B`);
  for (const side of ["L", "R"]) console.log(`models/wafer-pcb-${side}.webp: ${fs.statSync(PCB(side)).size} B`);
}

await (stage === "capture" ? capture() : pack());
