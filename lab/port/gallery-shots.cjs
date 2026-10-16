#!/usr/bin/env node
/* Gallery identity shots: every lab/materials.html entry, rig and field, NEW pipe, PBR Neutral.
     node gallery-shots.cjs <outDir> [modelFilter]
   Writes <id>-<tier>.png plus manifest.json (timings, page errors). SwiftShader compiles the
   thin-film program for about 200 s, so the per-shot timeout is generous. */
"use strict";
const fs = require("fs"), path = require("path");
const { chromium } = require("/home/oleksandr/.npm/_npx/31e32ef8478fbf80/node_modules/playwright");
const [outDir, only = ""] = process.argv.slice(2);
if (!outDir) { console.error("usage: node gallery-shots.cjs <outDir> [modelFilter]"); process.exit(2); }
fs.mkdirSync(outDir, { recursive: true });

(async () => {
  const browser = await chromium.launch({ executablePath: "/usr/bin/google-chrome", args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e && e.message || e)));
  page.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") errors.push(m.type() + ": " + m.text().slice(0, 300)); });
  page.setDefaultTimeout(900000);
  await page.goto("http://127.0.0.1:8765/lab/materials.html?tier=rig&model=iskra", { waitUntil: "load", timeout: 120000 });
  await page.waitForFunction(() => window.materials, null, { timeout: 120000 });
  const ids = await page.evaluate(() => window.materials.ENTRIES.map((e) => e.id));
  const shots = [];
  for (const model of ids.filter((id) => !only || id.includes(only))) for (const tier of ["rig", "field"]) {
    const t0 = Date.now(), mark = errors.length;
    try {
      const url = await page.evaluate((a) => window.materials.shoot(a), { model, tier, pipe: "new", tone: "neutral" });
      const file = `${model}-${tier}.png`;
      fs.writeFileSync(path.join(outDir, file), Buffer.from(url.split(",")[1], "base64"));
      shots.push({ id: model, tier, file, ms: Date.now() - t0, errors: errors.slice(mark) });
      console.log(`ok ${file} ${((Date.now() - t0) / 1000).toFixed(1)} s`);
    } catch (e) {
      shots.push({ id: model, tier, failed: String(e).split("\n")[0], ms: Date.now() - t0, errors: errors.slice(mark) });
      console.log(`FAIL ${model}-${tier}: ${String(e).split("\n")[0]}`);
    }
  }
  fs.writeFileSync(path.join(outDir, "manifest.json"), JSON.stringify({ createdAt: new Date().toISOString(), shots, errors }, null, 2));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
