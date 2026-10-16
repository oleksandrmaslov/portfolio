#!/usr/bin/env node
/* Landing probes (design.json verification 7): node landing-probe.cjs
   1. Universe lit-material audit: every MeshStandard/MeshPhysical the Universe renderer draws sits under a userData.isModel holder.
   2. Handoff leak: mo:tileHover 0x01 → 0x04 → 0x05 → 0x01, three rounds; the handoff renderer's programs, textures and
      geometries stay flat after round 1. */
"use strict";
const { chromium } = require("/home/oleksandr/.npm/_npx/31e32ef8478fbf80/node_modules/playwright");
const BASE = process.env.BASE || "http://127.0.0.1:8765/";
const INIT = String.raw`(() => {
  const R = window.__R = [];
  const patch = (v) => { if (!v || typeof v !== "object" || !v.WebGLRenderer || v.WebGLRenderer.__lp) return v;
    const B = v.WebGLRenderer, C = class extends B { constructor(p) { super(p); const rec = { r: this, lit: new Map() }; R.push(rec); const f = this.render;
      this.render = function (scene, cam) { if (scene && scene.isScene && !this.getRenderTarget() || scene && scene.isScene) scene.traverseVisible((o) => {
        for (const m of [].concat(o.material || [])) if (m && (m.isMeshStandardMaterial || m.isMeshPhysicalMaterial)) {
          let x = o, model = false; while (x) { if (x.userData && x.userData.isModel) { model = true; break; } x = x.parent; }
          if (!model) rec.lit.set(m.uuid, (m.name || m.type) + " on " + (o.name || o.type)); } });
        return f.call(this, scene, cam); }; } };
    C.__lp = true; v.WebGLRenderer = C; return v; };
  let T; Object.defineProperty(window, "THREE", { configurable: true, enumerable: true, get() { return T; }, set(v) { T = patch(v); } });
})();`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const browser = await chromium.launch({ executablePath: "/usr/bin/google-chrome", args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  await page.addInitScript(INIT);
  await page.goto(BASE + "index.html", { waitUntil: "domcontentloaded", timeout: 120000 });
  await page.waitForFunction(() => window.__mo_firstFrameAt, null, { timeout: 180000 });
  await sleep(45000);
  const lit = await page.evaluate(() => { const u = window.__R.find((x) => x.r.domElement.closest(".universe__mount")); return u ? [...u.lit.values()] : null; });
  console.log((lit && !lit.length ? "ok   " : "FAIL ") + "Universe lit materials outside a model holder: " + JSON.stringify(lit));
  const rounds = [];
  for (let k = 0; k < 3; k++) {
    for (const addr of ["0x01", "0x04", "0x05", "0x01"]) {
      await page.evaluate((a) => window.dispatchEvent(new CustomEvent("mo:tileHover", { detail: { addr: a } })), addr);
      await sleep(9000);
    }
    rounds.push(await page.evaluate(() => { const h = window.__R.find((x) => x.r.domElement.closest(".wf__mount")); if (!h) return null; const i = h.r.info; return { programs: i.programs.length, textures: i.memory.textures, geometries: i.memory.geometries }; }));
  }
  const flat = rounds.every((r) => r && JSON.stringify(r) === JSON.stringify(rounds[0]));
  console.log((flat ? "ok   " : "FAIL ") + "handoff rig flat after round 1: " + JSON.stringify(rounds));
  console.log((errs.length ? "FAIL " : "ok   ") + "page errors: " + JSON.stringify(errs.slice(0, 5)));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
