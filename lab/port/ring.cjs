#!/usr/bin/env node
/* Ring walk, both ways (design.json verification 3). node lab/port/ring.cjs */
"use strict";
const fs = require("fs"), path = require("path"), vm = require("vm"), assert = require("assert/strict");
const ROOT = path.join(__dirname, "../..");
const Babel = require(path.join(ROOT, "tools/landing-runtime/node_modules/@babel/standalone"));
const window = { addEventListener() {} }, ctx = { window, console };
vm.runInNewContext(fs.readFileSync(path.join(ROOT, "app/data/projects.js"), "utf8"), ctx);
vm.runInNewContext(Babel.transform(fs.readFileSync(path.join(ROOT, "app/projects/data.jsx"), "utf8"), { presets: ["env", "react"], sourceType: "script" }).code, ctx);
const D = window.PROJECT_DATA, reg = window.MO_PROJECT_BY_ADDR;
for (const dir of ["next", "prev"]) {
  const seen = []; let a = "0x01";
  for (let i = 0; i < 13; i++) { seen.push(a); a = D[a][dir]; }
  assert.equal(a, "0x01", dir + " walk returns to 0x01");
  assert.equal(new Set(seen).size, 13, dir + " walk visits 13 addrs");
  console.log("ok   " + dir + ": " + seen.join(" → ") + " → 0x01");
}
for (const a of Object.keys(D)) {
  assert.ok(fs.existsSync(path.join(ROOT, D[a].file)), a + " file " + D[a].file);
  assert.equal(reg[a].file, D[a].file, a + " registries agree on file");
  const m = reg[a].model;
  if (m && m.ready) assert.ok(fs.existsSync(path.join(ROOT, m.src)), a + " model " + m.src);
}
console.log("ok   13 files exist, registries agree, every ready model exists");
