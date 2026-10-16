#!/usr/bin/env node
/* The landing's NON-model pixels, before vs after (design.json verification 6).
     node nonmodel.cjs <outDir> <baseA> <baseB> [title|reel]
   Both pages run on a faked clock with a seeded Math.random, and every Universe render hides the userData.isModel holders
   (restored after the call, so the field's own logic is untouched). What is left is the cards, stars, dust, void and the
   composer (DoF, CA, vignette): the pixels the port must not change. Writes a.png, b.png and prints the differing share. */
"use strict";
const fs = require("fs"), path = require("path");
const PW = "/home/oleksandr/.npm/_npx/31e32ef8478fbf80/node_modules/";
const { chromium } = require(PW + "playwright");
const { PNG } = require(PW + "playwright-core/lib/utilsBundle");
const [out, A, B, state = "title"] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const INIT = String.raw`(() => {
  let s = 0x2545F491; Math.random = () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const hideModels = (scene) => { const hid = []; scene && scene.traverse && scene.traverse((o) => { if (o.userData && o.userData.isModel && o.visible) { o.visible = false; hid.push(o); } }); return hid; };
  const patch = (v) => {
    if (!v || typeof v !== "object" || !v.WebGLRenderer || v.WebGLRenderer.__nm) return v;
    const Base = v.WebGLRenderer;
    const R = class extends Base { constructor(p) { super(Object.assign({}, p, { preserveDrawingBuffer: true })); const r = this.render;
      this.render = function (scene, cam) { const hid = hideModels(scene); try { return r.call(this, scene, cam); } finally { hid.forEach((o) => { o.visible = true; }); } }; } };
    R.__nm = true; v.WebGLRenderer = R; return v;
  };
  let T; Object.defineProperty(window, "THREE", { configurable: true, enumerable: true, get() { return T; }, set(v) { T = patch(v); } });
  addEventListener("mo:preloader-done", () => { window.__nmDone = true; });
})();`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function grab(base, file) {
  const browser = await chromium.launch({ executablePath: "/usr/bin/google-chrome", args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, reducedMotion: "no-preference" });
  const page = await ctx.newPage();
  const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  await page.addInitScript(INIT);
  await page.clock.install({ time: new Date("2026-10-16T00:00:00Z") });
  await page.clock.pauseAt(new Date("2026-10-16T00:00:01Z"));
  await page.goto(base + "index.html", { waitUntil: "load", timeout: 120000 });
  // let the network settle in real time while the page's clock stands still
  for (let i = 0; i < 40 && !(await page.evaluate(() => window.__nmDone)); i++) { await page.clock.runFor(250); await sleep(500); }
  await sleep(8000);
  if (state === "reel") {
    await page.evaluate(() => { const el = document.getElementById("work"); scrollTo(0, el.getBoundingClientRect().top + scrollY + 0.2 * (el.offsetHeight - innerHeight)); });
  }
  for (let i = 0; i < 12; i++) { await page.clock.runFor(500); await sleep(300); }
  // the Universe's own canvas (the largest), read back: preserveDrawingBuffer is forced on above
  const url = await page.evaluate(() => [...document.querySelectorAll("canvas")].sort((p, q) => q.width * q.height - p.width * p.height)[0].toDataURL("image/png"));
  const buf = Buffer.from(url.split(",")[1], "base64");
  await browser.close();
  fs.writeFileSync(path.join(out, file), buf);
  return { png: PNG.sync.read(buf), errs };
}
(async () => {
  const a = await grab(A, `${state}-a.png`), b = await grab(B, `${state}-b.png`);
  let n = 0, d = 0, max = 0; const W = a.png.width, H = a.png.height, blocks = [];
  for (let by = 0; by < H; by += 64) for (let bx = 0; bx < W; bx += 64) {
    let bd = 0;
    for (let y = by; y < Math.min(H, by + 64); y++) for (let x = bx; x < Math.min(W, bx + 64); x++) {
      const i = (y * W + x) * 4; n++;
      const m = Math.max(...[0, 1, 2].map((c) => Math.abs(a.png.data[i + c] - b.png.data[i + c])));
      if (m > 1) { d++; bd++; } if (m > max) max = m;
    }
    if (bd) blocks.push([bx, by, bd]);
  }
  console.log(JSON.stringify({ state, pixels: n, differing: d, share: +(d / n * 100).toFixed(3), maxDelta: max, blocksDiffering: blocks.length, errsA: a.errs, errsB: b.errs }));
})().catch((e) => { console.error(e); process.exit(1); });
