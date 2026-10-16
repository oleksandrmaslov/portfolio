#!/usr/bin/env node
/* The ring in a browser: from Wafer.html click NEXT 13 times, then PREV 13 times, through the real footer buttons.
   Every hop must land on the registry's file, and no page may throw, 404 or warn about a model. node ring-browser.cjs */
"use strict";
const { chromium } = require("/home/oleksandr/.npm/_npx/31e32ef8478fbf80/node_modules/playwright");
const BASE = process.env.BASE || "http://127.0.0.1:8765/";
(async () => {
  const browser = await chromium.launch({ executablePath: "/usr/bin/google-chrome", args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.setDefaultTimeout(120000);
  const errs = [];
  page.on("pageerror", (e) => errs.push(page.url() + " pageerror " + e.message));
  page.on("console", (m) => { if (m.type() === "error" || (m.type() === "warning" && /model|studio|KTX2|shader|wafer|rig/i.test(m.text()))) errs.push(page.url() + " " + m.type() + " " + m.text()); });
  page.on("response", (r) => { if (r.status() >= 400) errs.push(r.status() + " " + r.url()); });
  await page.goto(BASE + "Wafer.html", { waitUntil: "domcontentloaded" });
  let fails = 0;
  for (const dir of ["next", "prev"]) {
    const seen = [];
    for (let i = 0; i < 13; i++) {
      await page.waitForFunction(() => window.PROJECT_DATA && document.querySelector(".pp-foot__nav--next"));
      const here = await page.evaluate(() => Object.values(window.PROJECT_DATA).find((p) => decodeURIComponent(location.pathname).endsWith("/" + p.file)));
      seen.push(here ? here.addr : "?" + page.url());
      const want = await page.evaluate((d) => { const h = Object.values(window.PROJECT_DATA).find((p) => decodeURIComponent(location.pathname).endsWith("/" + p.file)); return window.PROJECT_DATA[h[d]].file; }, dir);
      await page.waitForTimeout(2500);   // let the hero load and draw: its errors count
      await Promise.all([page.waitForURL((u) => decodeURIComponent(u.pathname).endsWith("/" + want), { waitUntil: "domcontentloaded" }), page.click(".pp-foot__nav--" + dir)]);
    }
    const back = await page.evaluate(() => Object.values(window.PROJECT_DATA).find((p) => decodeURIComponent(location.pathname).endsWith("/" + p.file)).addr).catch(() => "?");
    const ok = back === "0x01" && new Set(seen).size === 13;
    if (!ok) fails++;
    console.log((ok ? "ok   " : "FAIL ") + dir + ": " + seen.join(" → ") + " → " + back);
  }
  await page.waitForTimeout(2500);
  await browser.close();
  console.log((errs.length ? "FAIL " : "ok   ") + errs.length + " page errors / 404s / model warnings" + (errs.length ? "\n  " + errs.slice(0, 20).join("\n  ") : ""));
  process.exit(fails || errs.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
