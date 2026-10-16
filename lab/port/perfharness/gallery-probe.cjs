/* Gallery probe (perf slice): field programs for NEW vs OLD and cut variants, PMREM timings and a 256 vs 128 env diff.
   node gallery-probe.cjs <out.json>   (no site or lab file is changed; everything runs on the gallery's window.materials) */
const fs = require("fs");
const { chromium } = require("/home/oleksandr/.npm/_npx/31e32ef8478fbf80/node_modules/playwright");
(async () => {
  const browser = await chromium.launch({ executablePath: "/usr/bin/google-chrome", args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on("pageerror", (e) => console.error("pageerror", e.message));
  await page.goto("http://127.0.0.1:8765/lab/materials.html?tier=field&pipe=new&model=all&perf&dpr=1", { waitUntil: "load", timeout: 120000 });
  await page.waitForFunction(() => window.materials, null, { timeout: 120000 });
  const out = await page.evaluate(async () => {
    const M = window.materials, { THREE, renderer, S } = M;
    const keyOf = (m) => { const p = renderer.properties.get(m).currentProgram; return p ? p.cacheKey : null; };
    const feat = (m) => [m.type, m.clearcoat > 0 && "cc", m.iridescence > 0 && "irid", m.anisotropy > 0 && "aniso", m.sheen > 0 && "sheen", m.transmission > 0 && "trans",
      m.map && "map", m.emissiveMap && "emap", m.roughnessMap && "rmap", m.metalnessMap && "mmap", m.normalMap && "nmap", m.onBeforeCompile && m.onBeforeCompile.toString() !== THREE.Material.prototype.onBeforeCompile.toString() && ("hook:" + m.customProgramCacheKey()),
      m.transparent && "transp", m.toneMapped === false && "notone", m.side === THREE.DoubleSide && "2side"].filter(Boolean).join("+");
    const collect = (b, set, rows, id) => {
      const mats = new Set(), feats = {}; let draws = 0;
      b.scene.traverseVisible((o) => {
        if (o.userData.tile || !(o.isMesh || o.isSprite)) return;
        for (const m of [].concat(o.material)) { draws++; mats.add(m); const k = keyOf(m); if (k) { set.add(k); (feats[feat(m)] = feats[feat(m)] || new Set()).add(k); } }
      });
      rows.push({ id, draws, materials: mats.size, programs: b.programs.size, features: Object.fromEntries(Object.entries(feats).map(([f, s]) => [f, s.size])) });
    };
    const res = {};
    for (const pipe of ["new", "old"]) {
      const set = new Set(), rows = [];
      for (const e of M.ENTRIES) {
        if (e.id === "silent-depth") continue;   // universe: false, no field tile
        const b = await M.build(e, "field", pipe);
        collect(b, set, rows, e.id);
      }
      res[pipe] = { union: set.size, rows, keys: [...set].map((k) => k.slice(0, 40)) };
    }
    // the NEW field, cut variants, compiled for real against the same renderer
    const newBuilds = await Promise.all(M.ENTRIES.filter((e) => e.id !== "silent-depth").map((e) => M.build(e, "field", "new")));
    const variant = async (convert) => {
      const swaps = [], set = new Set();
      for (const b of newBuilds) {
        b.scene.traverse((o) => { if (o.isMesh && o.material && !o.userData.tile) { const was = o.material, now = convert(was); if (now !== was) { swaps.push([o, was]); o.material = now; } } });
      }
      for (const b of newBuilds) { await renderer.compileAsync(b.scene, b.camera); renderer.render(b.scene, b.camera); }
      for (const b of newBuilds) b.scene.traverseVisible((o) => { if ((o.isMesh || o.isSprite) && !o.userData.tile) for (const m of [].concat(o.material)) { const k = keyOf(m); if (k) set.add(k); } });
      for (const [o, was] of swaps) { const m = o.material; o.material = was; if (m !== was) m.dispose(); }
      return set.size;
    };
    const toStandard = (m) => {
      if (!m.isMeshPhysicalMaterial) return m;
      const s = new THREE.MeshStandardMaterial();
      for (const k of ["name", "color", "map", "roughness", "metalness", "roughnessMap", "metalnessMap", "emissive", "emissiveMap", "emissiveIntensity", "envMapIntensity", "normalMap", "normalScale", "transparent", "opacity", "side", "toneMapped", "depthWrite", "blending", "vertexColors"])
        if (m[k] !== undefined) s[k] = m[k] && m[k].isColor ? m[k].clone() : m[k];
      s.onBeforeCompile = m.onBeforeCompile; s.customProgramCacheKey = m.customProgramCacheKey; s.onBeforeRender = m.onBeforeRender;
      return s;
    };
    res.variants = {
      standardInField: await variant(toStandard),
      // what grain/print hooks would cost with one key each (their numbers moved to uniforms): normalise the custom key
      oneGrainKey: new Set([...newBuilds.flatMap((b) => { const a = []; b.scene.traverseVisible((o) => { if ((o.isMesh || o.isSprite) && !o.userData.tile) for (const m of [].concat(o.material)) { const k = keyOf(m); if (k) a.push(k.replace(/studio-grain-[\d.]+-[\d.]+/, "studio-grain")); } }); return a; })]).size,
    };
    // material objects in the field vs distinct presets (sharing one material per preset across tiles)
    const sig = new Set(), objs = new Set();
    for (const b of newBuilds) b.scene.traverseVisible((o) => { if (o.isMesh && !o.userData.tile) for (const m of [].concat(o.material)) { objs.add(m); sig.add([feat(m), m.color && m.color.getHexString(), m.roughness, m.metalness, m.map && m.map.uuid].join("|")); } });
    res.materials = { objects: objs.size, distinctLooks: sig.size };

    /* ---- PMREM: time and size; a 128 cube against the 256 the generator always uses for fromScene ---- */
    const t = async (fn) => { const t0 = performance.now(); const r = fn(); renderer.getContext().finish(); return [r, Math.round(performance.now() - t0)]; };
    const pm = {};
    const fresh = () => new THREE.WebGLRenderer();   // a renderer of its own: the first generation per context pays for its shaders
    {
      const r2 = fresh();
      const env = S.STAGES.void.env;
      const [a, ms1] = await (async () => { const t0 = performance.now(); const x = S.studioEnvironment(THREE, r2, env); r2.getContext().finish(); return [x, Math.round(performance.now() - t0)]; })();
      const [, ms2] = await (async () => { const t0 = performance.now(); const x = S.studioEnvironment(THREE, r2, env); r2.getContext().finish(); return [x, Math.round(performance.now() - t0)]; })();
      const { RoomEnvironment } = await import("three/addons/environments/RoomEnvironment.js");
      const gen = new THREE.PMREMGenerator(r2);
      const t0 = performance.now(); const room = gen.fromScene(new RoomEnvironment(), 0.06); r2.getContext().finish(); const ms3 = Math.round(performance.now() - t0);
      gen.dispose();
      pm.studio256 = { coldMs: ms1, warmMs: ms2, size: [a.image.width, a.image.height], mb: +(a.image.width * a.image.height * 8 / 2 ** 20).toFixed(2) };
      pm.room256sigma006 = { warmishMs: ms3 };
      r2.dispose(); r2.forceContextLoss();
    }
    // a 128 cube: capture the studio scene that studioEnvironment builds and feed it through a CubeCamera + fromCubemap
    const studioAt = (size, r) => {
      const proto = THREE.PMREMGenerator.prototype, orig = proto.fromScene;
      proto.fromScene = function (scene, sigma, near = 0.1, far = 100) {
        const rt = new THREE.WebGLCubeRenderTarget(size, { type: THREE.HalfFloatType, generateMipmaps: false });
        const cam = new THREE.CubeCamera(near, far, rt);
        const tm = r.toneMapping; r.toneMapping = THREE.NoToneMapping;
        cam.update(r, scene);
        r.toneMapping = tm;
        const out = this.fromCubemap(rt.texture);
        rt.dispose();
        return out;
      };
      try { return S.studioEnvironment(THREE, r, S.STAGES.void.env); } finally { proto.fromScene = orig; }
    };
    {
      const r3 = fresh();
      studioAt(128, r3);
      const t0 = performance.now(); const tex = studioAt(128, r3); r3.getContext().finish();
      pm.studio128 = { warmMs: Math.round(performance.now() - t0), size: [tex.image.width, tex.image.height], mb: +(tex.image.width * tex.image.height * 8 / 2 ** 20).toFixed(2) };
      r3.dispose(); r3.forceContextLoss();
    }
    // visual: render rig and field builds with the gallery's env (256) and a 128 one in the gallery's own renderer, diff the pixels
    const env128 = studioAt(128, renderer);
    const env128f = (() => { const proto = THREE.PMREMGenerator.prototype; return null; })();
    const gl = renderer.getContext();
    const shot = (b, w, h) => {
      renderer.setRenderTarget(null); renderer.setViewport(0, 0, w, h); renderer.setScissor(0, 0, w, h);
      renderer.toneMapping = THREE.CustomToneMapping; renderer.toneMappingExposure = S.TONE.exposure * 2 ** (b.entry.ev || 0);
      renderer.clear(); renderer.render(b.scene, b.camera);
      const px = new Uint8Array(w * h * 4); gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, px); return px;
    };
    const diff = [];
    for (const id of ["wafer-studio", "silent-depth", "ci-clop", "wafer", "iskra", "brionel"]) {
      const e = M.ENTRIES.find((x) => x.id === id);
      for (const tier of ["rig", "field"]) {
        if (tier === "field" && id === "silent-depth") continue;
        const b = await M.build(e, tier, "new");
        const w = tier === "rig" ? 560 : 400, h = tier === "rig" ? 420 : 360;
        const env0 = b.scene.environment;
        const a = shot(b, w, h);
        b.scene.environment = env128; await renderer.compileAsync(b.scene, b.camera);
        const c = shot(b, w, h);
        b.scene.environment = env0;
        let n16 = 0, n8 = 0, max = 0, subj = 0;
        const bg = [a[0], a[1], a[2]];
        for (let i = 0; i < a.length; i += 4) {
          const isSubj = Math.abs(a[i] - bg[0]) + Math.abs(a[i + 1] - bg[1]) + Math.abs(a[i + 2] - bg[2]) > 6; if (isSubj) subj++;
          const d = Math.max(Math.abs(a[i] - c[i]), Math.abs(a[i + 1] - c[i + 1]), Math.abs(a[i + 2] - c[i + 2]));
          if (d > 8) n8++; if (d > 16) n16++; if (d > max) max = d;
        }
        diff.push({ id, tier, subjectPx: subj, over8: n8, over16: n16, pctOver16OfSubject: +(100 * n16 / Math.max(1, subj)).toFixed(2), max });
      }
    }
    pm.diff128vs256 = diff;
    res.pmrem = pm;
    res.rendererPrograms = renderer.info.programs.length;
    return res;
  });
  fs.writeFileSync(process.argv[2] || "gallery-probe.json", JSON.stringify(out, null, 1));
  console.log(JSON.stringify({ newUnion: out.new.union, oldUnion: out.old.union, variants: out.variants, materials: out.materials, pmrem: out.pmrem }, null, 1));
  console.log("NEW rows", JSON.stringify(out.new.rows, null, 0));
  console.log("OLD rows", JSON.stringify(out.old.rows, null, 0));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
