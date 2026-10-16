/* NEW Wafer in the gallery: what loadParts costs (wall, bake CPU, geometry bytes, GPU readbacks), and what a merge by material would draw.
   node gallery-wafer.cjs <out.json> */
const fs = require("fs");
const { chromium } = require("/home/oleksandr/.npm/_npx/31e32ef8478fbf80/node_modules/playwright");
(async () => {
  const browser = await chromium.launch({ executablePath: "/usr/bin/google-chrome", args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
  const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
  page.on("pageerror", (e) => console.error("pageerror", e.message));
  // model=iskra keeps the gallery itself from building the Wafer
  await page.goto("http://127.0.0.1:8765/lab/materials.html?tier=rig&model=iskra&dpr=1", { waitUntil: "load", timeout: 120000 });
  await page.waitForFunction(() => window.materials, null, { timeout: 120000 });
  const out = await page.evaluate(async () => {
    const M = window.materials, { THREE, renderer, ctx } = M;
    const W = await import("/lab/materials-wafer.js");
    const U = await import("three/addons/utils/BufferGeometryUtils.js");
    const gl = renderer.getContext();
    // count GPU readbacks (readPalette) during loadParts
    let readbacks = 0; const rp = renderer.readRenderTargetPixels; renderer.readRenderTargetPixels = function () { readbacks++; return rp.apply(this, arguments); };
    // time the toCreasedNormals share by wrapping it is not possible (ES export); time loadParts whole, then re-run the bake alone on the loaded parts
    const t0 = performance.now();
    const items = await W.loadParts(THREE, renderer, ctx.loader);
    const loadMs = performance.now() - t0;
    renderer.readRenderTargetPixels = rp;
    const bytes = (g) => Object.values(g.attributes).reduce((s, a) => s + a.array.byteLength, 0) + (g.index ? g.index.array.byteLength : 0);
    const baked = items.reduce((s, it) => s + bytes(it.geometry), 0);
    const verts = items.reduce((s, it) => s + it.geometry.attributes.position.count, 0);
    // the source parts, as loaded (quantized, indexed), and the bake alone on them
    const roots = await Promise.all(W.PART_FILES.map((n) => ctx.loader.loadAsync(W.PARTS_DIR + n + ".glb").then((g) => g.scene)));
    const srcGeoms = []; roots.forEach((r) => { r.updateMatrixWorld(true); r.traverse((o) => { if (o.isMesh) srcGeoms.push([o.geometry, o.matrixWorld.clone()]); }); });
    const srcBytes = srcGeoms.reduce((s, [g]) => s + bytes(g), 0);
    const b0 = performance.now();
    let reindexed = 0, reVerts = 0;
    const bakedAgain = [];
    for (const [g, m] of srcGeoms) {
      const ni = g.index ? g.toNonIndexed() : g.clone();
      const pos = ni.attributes.position, P = new Float32Array(pos.count * 3), v = new THREE.Vector3();
      for (let i = 0; i < pos.count; i++) v.fromBufferAttribute(pos, i).applyMatrix4(m).multiplyScalar(1000).toArray(P, i * 3);
      const o = new THREE.BufferGeometry(); o.setAttribute("position", new THREE.BufferAttribute(P, 3));
      if (ni.attributes.uv) o.setAttribute("uv", ni.attributes.uv.clone());
      bakedAgain.push(U.toCreasedNormals(o, (40 * Math.PI) / 180));
    }
    const bakeMs = performance.now() - b0;
    // re-index after the crease (what an offline bake could ship): unique vertices
    const r0 = performance.now();
    for (const g of bakedAgain) { const x = U.mergeVertices(g, 1e-4); reindexed += bytes(x); reVerts += x.attributes.position.count; }
    const mergeMs = performance.now() - r0;
    // draws: per part vs merged by material in the NEW assembly
    const P = (await import("/lab/studio.js")).presets(THREE, { ...((await import("/lab/studio.js")).STAGES.void), mat: { env: 1, floor: 0.02 } });
    const root = W.assemble(THREE, P, items, null);
    let meshes = 0; const byLook = new Map();
    root.traverse((o) => { if (o.isMesh) { meshes++; const m = o.material; const k = [m.type, m.color && m.color.getHexString(), m.roughness, m.metalness, !!m.map, m.clearcoat, m.anisotropy, m.customProgramCacheKey && m.customProgramCacheKey()].join("|"); byLook.set(k, (byLook.get(k) || 0) + 1); } });
    const tris = items.reduce((s, it) => s + it.geometry.attributes.position.count / 3, 0);
    return { loadPartsMs: Math.round(loadMs), gpuReadbacks: readbacks, items: items.length, verts, tris: Math.round(tris), bakedMB: +(baked / 2 ** 20).toFixed(2),
      sourceAsLoadedMB: +(srcBytes / 2 ** 20).toFixed(2), bakeOnlyMs: Math.round(bakeMs), reindexAfterCreaseMB: +(reindexed / 2 ** 20).toFixed(2), reindexVerts: reVerts, mergeVerticesMs: Math.round(mergeMs),
      newAssemblyMeshes: meshes, distinctMaterialLooks: byLook.size, looks: [...byLook.entries()].map(([k, n]) => n + "× " + k.split("|").slice(0, 2).join(" ")) };
  });
  fs.writeFileSync(process.argv[2] || "gallery-wafer.json", JSON.stringify(out, null, 1));
  console.log(JSON.stringify(out, null, 1));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
