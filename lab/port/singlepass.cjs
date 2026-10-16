#!/usr/bin/env node
/* forceSinglePass gate (design.json verification 6): a transparent DoubleSide MeshBasic plane with a canvas texture, 8 angles
   front and back, must render identically with forceSinglePass false and true. node lab/port/singlepass.cjs */
"use strict";
const { chromium } = require("/home/oleksandr/.npm/_npx/31e32ef8478fbf80/node_modules/playwright");
(async () => {
  const browser = await chromium.launch({ executablePath: "/usr/bin/google-chrome", args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
  const page = await browser.newPage();
  const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  await page.goto((process.env.BASE || "http://127.0.0.1:8765/") + "lab/port/tmp/verify/singlepass.html");
  const r = await page.waitForFunction(() => window.result, null, { timeout: 120000 }).then((h) => h.jsonValue());
  await browser.close();
  console.log((r.diff === 0 && !errs.length ? "ok   " : "FAIL ") + `${r.views} views, ${r.diff} differing bytes`, errs.join(" "));
  process.exit(r.diff === 0 && !errs.length ? 0 : 1);
})();
