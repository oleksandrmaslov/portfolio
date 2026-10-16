#!/usr/bin/env node
/* Gallery identity (design.json verification 5): node pixdiff.cjs <before> <after>
   Subject mask: pixels where either image differs from #04060d by more than 6. Score: share of mask pixels with any
   channel |Δ| > 16. Thresholds: logos and hardware rig 0.5 %, field 1.0 %; Venovisor 1.5 %; Sightseeing 0.5 %; Wafer 2.0 %. */
"use strict";
const fs = require("fs"), path = require("path");
const { PNG } = require("/home/oleksandr/.npm/_npx/31e32ef8478fbf80/node_modules/playwright-core/lib/utilsBundle");
const [B, A] = process.argv.slice(2);
const BG = [4, 6, 13];
const limit = (id, tier) => /venovisor/.test(id) ? 1.5 : /sightseeing/.test(id) ? 0.5 : /^wafer(-|$)/.test(id) && !/mark/.test(id) ? 2.0 : tier === "field" ? 1.0 : 0.5;
let fail = 0;
for (const f of fs.readdirSync(B).filter((f) => f.endsWith(".png"))) {
  if (!fs.existsSync(path.join(A, f))) { console.log("MISS " + f); fail++; continue; }
  const a = PNG.sync.read(fs.readFileSync(path.join(B, f))), b = PNG.sync.read(fs.readFileSync(path.join(A, f)));
  if (a.width !== b.width || a.height !== b.height) { console.log("SIZE " + f); fail++; continue; }
  let mask = 0, bad = 0;
  for (let i = 0; i < a.data.length; i += 4) {
    const sub = [a, b].some((p) => [0, 1, 2].some((c) => Math.abs(p.data[i + c] - BG[c]) > 6));
    if (!sub) continue;
    mask++;
    if ([0, 1, 2].some((c) => Math.abs(a.data[i + c] - b.data[i + c]) > 16)) bad++;
  }
  const [, id, tier] = f.match(/^(.*)-(rig|field|macro)\.png$/) || [, f, "rig"];
  const s = mask ? (bad / mask) * 100 : 0, lim = limit(id, tier), ok = s <= lim;
  if (!ok) fail++;
  console.log(`${ok ? "ok  " : "FAIL"} ${f.padEnd(28)} ${s.toFixed(3).padStart(7)} %  (limit ${lim} %, mask ${mask} px)`);
}
process.exit(fail ? 1 : 0);
