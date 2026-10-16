#!/usr/bin/env node
/* Menu object legibility. node menu-contrast.cjs <base> <page> <out.json> <crop.png>
   Opens the nav menu, waits for every object, then mattes the transparent object canvas against a black and a white
   surface: alpha = 1 - (white - black) / 255, so the object mask is exact (dark parts included). Each object is
   composited back on the real menu surface and measured: mean luma of the object pixels (alpha > 0.5), its p95
   (the edge highlights), the surface luma, and mean - surface. The "index" row splits into its three marks by
   empty columns. Writes the metrics and a crop of the objects column on the real surface. */
"use strict";
const fs = require("fs");
const PW = "/home/oleksandr/.npm/_npx/31e32ef8478fbf80/node_modules/";
const { chromium } = require(PW + "playwright");
const { PNG } = require(PW + "playwright-core/lib/utilsBundle");
const [base, pageName, out, cropOut] = process.argv.slice(2);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const luma = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b;
(async () => {
  const browser = await chromium.launch({ executablePath: "/usr/bin/google-chrome", args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })).newPage();
  if (process.env.MENU) await page.addInitScript((M) => {
    let S; Object.defineProperty(window, "MOStudio", { configurable: true, enumerable: true, get() { return S; }, set(v) { S = v;
      Object.defineProperty(v, "MENU", { configurable: true, enumerable: true, get() { return { ...M, room: { ...v.FIELD_ROOM, ...(M.room || {}) } }; }, set() {} }); } });
  }, { ambient: 1, key: 0, rim: 0, rimColor: 0x00f0c8, ev: {}, ...JSON.parse(process.env.MENU) });
  const errs = []; page.on("pageerror", (e) => errs.push(String(e).slice(0, 160)));
  await page.goto(base + encodeURI(pageName), { waitUntil: "load", timeout: 120000 });
  const landing = /index\.html$/.test(pageName);
  if (landing) await page.waitForFunction(() => document.documentElement.dataset && (window.__mo_universe && document.body.classList.length >= 0) && performance.now() > 0 && !!document.querySelector(".lp-menuToggle"), null, { timeout: 120000 });
  await sleep(landing ? 25000 : 12000);
  await page.click(".lp-menuToggle");
  await page.waitForFunction(() => { const d = document.querySelector("dialog.lp-menu[open]"); return d && d.dataset.liveObjects === "true" && [...d.querySelectorAll("[data-menu-object]")].every((e) => e.dataset.modelReady === "true"); }, null, { timeout: 120000 });
  await sleep(4000);
  const rects = await page.evaluate(() => [...document.querySelectorAll("dialog.lp-menu[open] [data-menu-object]")].map((e) => { const r = e.getBoundingClientRect(); return { id: e.dataset.menuObject, x: r.left, y: r.top, w: r.width, h: r.height }; }));
  const shot = async (bg) => {
    await page.evaluate((bg) => { let s = document.getElementById("__mc"); if (!s) { s = document.createElement("style"); s.id = "__mc"; document.head.appendChild(s); } s.textContent = bg ? `.lp-menu__surface{background:${bg}!important;animation:none!important} .lp-menu a, .lp-menu__top, .lp-menu__bottom{color:transparent!important}` : ""; }, bg);
    await sleep(300);
    return PNG.sync.read(await page.screenshot());
  };
  const real = await shot(null), K = await shot("#000"), W = await shot("#fff");
  await shot(null);
  const at = (p, x, y) => { const i = (y * p.width + x) * 4; return [p.data[i], p.data[i + 1], p.data[i + 2]]; };
  // the surface colour: the real shot at a pixel no object covers (top-left of the screen is chrome-free at y=200,x=8 is padding)
  const surf = at(real, 4, 450), surfL = luma(...surf);
  const res = { page: pageName, base, surface: surf, surfaceLuma: +surfL.toFixed(1), objects: [], errs };
  const measure = (name, x0, y0, x1, y1, colFilter) => {
    const L = [];
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
      if (colFilter && !colFilter(x)) continue;
      const k = at(K, x, y), w = at(W, x, y);
      const a = 1 - ((w[0] - k[0]) + (w[1] - k[1]) + (w[2] - k[2])) / 765;
      if (a <= 0.5) continue;
      const c = [0, 1, 2].map((j) => Math.min(255, k[j] + (1 - a) * surf[j]));
      L.push(luma(...c));
    }
    L.sort((p, q) => p - q);
    const mean = L.reduce((s, v) => s + v, 0) / (L.length || 1), q = (p) => L[Math.min(L.length - 1, Math.floor(p * (L.length - 1)))] || 0;
    res.objects.push({ name, px: L.length, sep: +(L.filter((v) => v >= surfL + 15).length / (L.length || 1)).toFixed(3), mean: +mean.toFixed(1), p50: +q(0.5).toFixed(1), p95: +q(0.95).toFixed(1), contrast: +(mean - surfL).toFixed(1) });
  };
  const pad = 40;
  for (const r of rects) {
    const x0 = Math.max(0, Math.floor(r.x - pad)), y0 = Math.max(0, Math.floor(r.y - pad)), x1 = Math.min(1440, Math.ceil(r.x + r.w + pad)), y1 = Math.min(900, Math.ceil(r.y + r.h + pad));
    if (r.id === "about") { measure("0x00 points", x0, y0, x1, y1); continue; }
    if (r.id !== "index") { measure(r.id === "work" ? "wafer (work)" : "output switch (contact)", x0, y0, x1, y1); continue; }
    // split the three marks on empty columns
    const cols = [];
    for (let x = x0; x < x1; x++) { let any = false; for (let y = y0; y < y1 && !any; y++) { const k = at(K, x, y), w = at(W, x, y); any = (w[0] - k[0]) < 128; } cols.push(any); }
    const runs = []; let s = -1;
    cols.forEach((v, i) => { if (v && s < 0) s = i; if (!v && s >= 0) { runs.push([s, i]); s = -1; } }); if (s >= 0) runs.push([s, cols.length]);
    const big = runs.filter(([a, b]) => b - a > 6);
    const names = ["index mark 1", "index mark 2", "index mark 3"];
    if (big.length === 3) big.forEach(([a, b], i) => measure(names[i], x0 + a, y0, x0 + b, y1));
    else measure("index (all " + big.length + " runs)", x0, y0, x1, y1);
  }
  res.addrs = await page.evaluate(() => (window.MO_FEATURED_ADDRS || []).slice(0, 4).map((a) => a + ":" + (window.MO_PROJECT_BY_ADDR?.[a]?.name || "?")));
  // crop: the objects column
  const xs = rects.map((r) => r.x), x0 = Math.max(0, Math.floor(Math.min(...xs) - 60)), x1 = Math.min(1440, Math.ceil(Math.max(...rects.map((r) => r.x + r.w)) + 60));
  const y0 = Math.max(0, Math.floor(Math.min(...rects.map((r) => r.y)) - 30)), y1 = Math.min(900, Math.ceil(Math.max(...rects.map((r) => r.y + r.h)) + 30));
  const crop = new PNG({ width: x1 - x0, height: y1 - y0 });
  for (let y = y0; y < y1; y++) real.data.copy(crop.data, ((y - y0) * crop.width) * 4, (y * 1440 + x0) * 4, (y * 1440 + x1) * 4);
  fs.writeFileSync(cropOut, PNG.sync.write(crop));
  fs.writeFileSync(out, JSON.stringify(res, null, 1));
  console.log(JSON.stringify(res));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
