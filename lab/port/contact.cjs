#!/usr/bin/env node
/* Before | after contact sheets: node contact.cjs <before> <after> <out>. One sheet per shot id present in both
   (the page capture), 720 px a side, labelled. */
"use strict";
const fs = require("fs"), path = require("path");
const sharp = require(path.join(__dirname, "tmp/tools/node_modules/sharp"));
const [B, A, OUT] = process.argv.slice(2);
fs.mkdirSync(OUT, { recursive: true });
const label = (t, w) => Buffer.from(`<svg width="${w}" height="28"><rect width="100%" height="100%" fill="#111"/><text x="10" y="19" font-family="monospace" font-size="15" fill="#eee">${t}</text></svg>`);
(async () => {
  const ids = fs.readdirSync(A).filter((f) => /\.(png|jpg)$/.test(f) && !/--gl\.png$/.test(f) && fs.existsSync(path.join(B, f)));
  for (const f of ids) {
    const W = 720, side = async (p) => sharp(p).resize({ width: W }).png().toBuffer({ resolveWithObject: true });
    const [b, a] = await Promise.all([side(path.join(B, f)), side(path.join(A, f))]);
    const H = Math.max(b.info.height, a.info.height);
    await sharp({ create: { width: W * 2 + 8, height: H + 28, channels: 3, background: "#222" } })
      .composite([{ input: label("BEFORE  " + f, W), left: 0, top: 0 }, { input: label("AFTER", W), left: W + 8, top: 0 },
        { input: b.data, left: 0, top: 28 }, { input: a.data, left: W + 8, top: 28 }])
      .png().toFile(path.join(OUT, f.replace(/\.(png|jpg)$/, ".png")));
  }
  console.log(`${ids.length} sheets → ${OUT}`);
})();
