#!/usr/bin/env node
/* Wafer frame check (spec §9.2) plus the static-tier tight box against wafer_demo's.
   node wafer-frame.cjs   (needs the preview server; page: lab/port/tmp/frame.html) */
"use strict";
const { chromium } = require("/home/oleksandr/.npm/_npx/31e32ef8478fbf80/node_modules/playwright");
(async () => {
  const browser = await chromium.launch({ executablePath: "/usr/bin/google-chrome", args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
  const page = await browser.newPage();
  const logs = [];
  page.on("pageerror", (e) => logs.push("pageerror " + e.message));
  page.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") logs.push(m.type() + " " + m.text()); });
  await page.goto("http://127.0.0.1:8765/lab/port/tmp/frame.html", { waitUntil: "load" });
  await page.waitForFunction(() => window.ready, null, { timeout: 120000 });
  const out = await page.evaluate(() => window.run());
  out.logs = logs;
  const E = 3e-5, ok = [];
  const near = (a, b) => Math.abs(a - b) <= E;
  ok.push(["55 names resolve", out.missing && out.missing.length === 0]);
  ok.push(["lids under their displays", JSON.stringify(out.lidParents) === '["display_L","display_R"]']);
  ok.push(["every part's loose box within 3e-5 m", out.worstPart.d <= E]);
  ok.push(["global loose base 0.289611", near(out.looseWafer.base, 0.289611)]);
  ok.push(["global loose centre (0.158451, -0.098190, 0.002750)", [0.158451, -0.098190, 0.002750].every((v, i) => near(out.looseWafer.centre[i], v))]);
  ok.push(["no setKTX2Loader error", !logs.some((l) => /KTX2/.test(l)) && !out.errors.length]);
  const fd = out.fit4.demo, fw = out.fit4.wafer;
  ok.push(["fit 4.0: tight size equals wafer_demo's within 1e-3 u", fd.size.every((v, i) => Math.abs(v - fw.size[i]) < 1e-3)]);
  ok.push(["fit 4.0: tight centre within 1e-3 u", fw.centre.every((v) => Math.abs(v) < 1e-3)]);
  ok.push(["static tier: 12 meshes (no USB-C part classifies as gold)", out.merged.meshes === 12]);
  ok.push(["lids sit on their displays", out.lids.every((l) => l.inside && l.lidMinZ >= l.displayMaxZ - 1e-6)]);
  console.log(JSON.stringify({ ...out, parts: undefined }, null, 1));
  for (const [m, p] of ok) console.log((p ? "ok   " : "FAIL ") + m);
  await browser.close();
  process.exit(ok.every((x) => x[1]) ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
