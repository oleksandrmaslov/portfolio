#!/usr/bin/env node
/* PLAY DEMO probe (verification 6/7): node demo-probe.cjs <outDir> [file=Wafer.html]
   Opens the page, counts every renderer's render() calls, enters PLAY DEMO, and on Wafer.html checks the board: parts
   separate under explode, the USB-C and screen pieces travel with their parent part, the PCB artwork is mapped, the caps keep
   their grain, one key presses alone, and each view mode draws. Screenshots go to <outDir>. Also checks the hero sleeps
   under the demo and wakes after Escape. */
"use strict";
const fs = require("fs"), path = require("path");
const { chromium } = require("/home/oleksandr/.npm/_npx/31e32ef8478fbf80/node_modules/playwright");
const BASE = process.env.BASE || "http://127.0.0.1:8765/";
const [out, file = "Wafer.html"] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const INIT = String.raw`(() => {
  const R = window.__renders = [];
  const patch = (v) => { if (!v || typeof v !== "object" || !v.WebGLRenderer || v.WebGLRenderer.__dp) return v;
    const B = v.WebGLRenderer, C = class extends B { constructor(p) { super(p); const rec = { n: 0, r: this }; R.push(rec); const f = this.render; this.render = function (s, c) { rec.n++; return f.call(this, s, c); }; } };
    C.__dp = true; v.WebGLRenderer = C; return v; };
  let T; Object.defineProperty(window, "THREE", { configurable: true, enumerable: true, get() { return T; }, set(v) { T = patch(v); } });
})();`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const browser = await chromium.launch({ executablePath: "/usr/bin/google-chrome", args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = []; page.on("pageerror", (e) => errs.push("pageerror " + e.message));
  page.on("console", (m) => { if (m.type() === "error" || (m.type() === "warning" && /wafer|studio|KTX2|shader|THREE/i.test(m.text()))) errs.push(m.type() + " " + m.text()); });
  page.on("response", (r) => { if (r.status() >= 400) errs.push(r.status() + " " + r.url()); });
  await page.addInitScript(INIT);
  await page.goto(BASE + encodeURI(file), { waitUntil: "domcontentloaded", timeout: 120000 });
  await page.waitForFunction(() => window.__renders && window.__renders.some((r) => r.n > 10), null, { timeout: 120000 });
  await sleep(6000);
  // the hero is the renderer that has drawn the most by now (the pointer overlay barely draws at rest)
  const hero = await page.evaluate(() => { const R = window.__renders; return R.indexOf(R.reduce((a, b) => (b.n > a.n ? b : a))); });
  const res = { file, checks: [] };
  const ok = (name, pass, detail) => res.checks.push({ name, pass: !!pass, detail });
  const heroN = () => page.evaluate((i) => window.__renders[i].n, hero);
  const a0 = await heroN(); await sleep(2000); const a1 = await heroN();
  ok("hero renders before the demo", a1 > a0, a1 - a0);
  await page.getByText("PLAY DEMO", { exact: true }).first().click();
  await sleep(1500);
  const b0 = await heroN(); await sleep(2000); const b1 = await heroN();
  ok("hero sleeps under PLAY DEMO (2 s)", b1 === b0, b1 - b0);
  if (file === "Wafer.html") {
    await page.waitForFunction(() => window.WaferDemo && window.WaferDemo.board && window.WaferDemo.board.ready, null, { timeout: 180000 });
    await page.evaluate(() => window.WaferDemo.skip());
    await sleep(4000);
    await page.screenshot({ path: path.join(out, "demo-assembled.png") });
    const geo = (when) => page.evaluate((when) => {
      const T = window.THREE, b = window.WaferDemo.board, g = b.group; g.updateMatrixWorld(true);
      const c = (o) => new T.Box3().setFromObject(o).getCenter(new T.Vector3());
      const byName = (n) => g.getObjectByName(n);
      const wrapOf = (o) => b.parts.find((p) => { let x = o; while (x) { if (x === p.wrap) return true; x = x.parent; } return false; });
      const names = ["case_L", "plate_L", "pcb_L", "usbc_L", "display_L", "screen_L", "key_L_r0c0", "mcu"];
      const pos = Object.fromEntries(names.map((n) => { const o = byName(n); return [n, o ? c(o).toArray().map((v) => +v.toFixed(4)) : null]; }));
      const usb = byName("usbc_L"), meshes = []; usb && usb.traverse((o) => o.isMesh && meshes.push(o));
      const scr = byName("screen_L"), disp = byName("display_L");
      const pcb = []; byName("pcb_L").traverse((o) => o.isMesh && pcb.push(o));
      const cap = b.keys[0].cap;
      return { when, pos, usbMeshes: meshes.length, usbOneWrap: meshes.every((m) => wrapOf(m) === wrapOf(usb)), screenWithDisplay: !!scr && wrapOf(scr) === wrapOf(disp),
        pcbMap: pcb.map((m) => !!(m.material.map && m.material.map.image && m.material.map.image.width)),
        capKey: cap.material.customProgramCacheKey(), parts: b.parts.length, keys: b.keys.length };
    }, when);
    const g0 = await geo("assembled");
    await page.evaluate(() => window.WaferDemo.setExplode(1)); await sleep(6000);
    const g1 = await geo("exploded");
    await page.screenshot({ path: path.join(out, "demo-exploded.png") });
    const d = (n) => Math.hypot(...g1.pos[n].map((v, i) => v - g0.pos[n][i]));
    ok("53 parts, 36 keys", g0.parts === 53 && g0.keys === 36, [g0.parts, g0.keys]);
    ok("parts separate under explode", ["case_L", "plate_L", "pcb_L", "key_L_r0c0", "mcu"].every((n) => d(n) > 0.05), Object.fromEntries(["case_L", "plate_L", "pcb_L", "usbc_L", "key_L_r0c0", "mcu", "display_L"].map((n) => [n, +d(n).toFixed(3)])));
    ok("explode stays in frame (no part moves more than 4 u)", Object.keys(g0.pos).every((n) => !g0.pos[n] || d(n) < 4));
    ok("USB-C: 4 meshes, one wrap", g0.usbMeshes === 4 && g0.usbOneWrap, g0.usbMeshes);
    ok("screen_L travels with display_L", g0.screenWithDisplay && Math.abs(d("screen_L") - d("display_L")) < 1e-3, [d("screen_L"), d("display_L")]);
    ok("PCB artwork mapped", g0.pcbMap.length && g0.pcbMap.every(Boolean), g0.pcbMap);
    ok("caps keep their grain", /studio-grain/.test(g0.capKey) && /neutral/.test(g0.capKey), g0.capKey);
    await page.evaluate(() => window.WaferDemo.setExplode(0)); await sleep(4000);
    await page.evaluate(() => { const b = window.WaferDemo.board; window.__before = b.keys.map((x) => x.inner.position.clone()); });
    await page.keyboard.down("q");   // SwiftShader draws the demo at about 1 fps: wait for the spring, not a fixed time
    await page.waitForFunction(() => window.WaferDemo.board.codeMap.KeyQ.p > 0.05, null, { timeout: 30000 }).catch(() => {});
    const press = await page.evaluate(() => {
      const b = window.WaferDemo.board, k = b.codeMap.KeyQ;
      const moved = b.keys.filter((x, i) => x.inner.position.distanceTo(window.__before[i]) > 1e-6).map((x) => x.id);
      return { id: k && k.id, down: k && k.down, p: k && +k.p.toFixed(3), phase: window.WaferDemo.state.phase, moved };
    });
    await page.screenshot({ path: path.join(out, "demo-press.png") });
    await page.keyboard.up("q");
    ok("one key presses alone", press.moved.length === 1 && press.moved[0] === press.id, press);
    await page.evaluate(() => window.WaferDemo.setExplode(1)); await sleep(5000);
    for (const m of ["xray", "wire", "solid"]) {
      await page.evaluate((m) => window.WaferDemo.setMode(m), m); await sleep(2500);
      await page.screenshot({ path: path.join(out, "demo-" + m + ".png") });
    }
    res.geo = [g0, g1];
  }
  await page.keyboard.press("Escape"); await sleep(2500);
  const c0 = await heroN(); await sleep(2000); const c1 = await heroN();
  ok("hero wakes after Escape", c1 > c0, c1 - c0);
  ok("no page errors / 404s", !errs.length, errs.slice(0, 10));
  await browser.close();
  fs.writeFileSync(path.join(out, "result.json"), JSON.stringify(res, null, 1));
  for (const c of res.checks) console.log((c.pass ? "ok   " : "FAIL ") + c.name + (c.detail !== undefined ? "  " + JSON.stringify(c.detail) : ""));
})().catch((e) => { console.error(e); process.exit(1); });
