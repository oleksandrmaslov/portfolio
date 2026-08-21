/* Build the static Final 5 browser runtime with Babel Standalone.
   Usage: node tools/build-final5-runtime.cjs <path-to-babel-standalone.js> */
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const babelPath = process.argv[2];
if (!babelPath) {
  throw new Error("Pass a local Babel Standalone bundle as the first argument.");
}
const Babel = require(path.resolve(babelPath));

const sourceFiles = [
  "landing_final5/key-button.jsx",
  "landing_final/ascii.jsx",
  "project/viewer3d.jsx",
  "project_v3/hero-rig.jsx",
  "project_v3/node-rig.jsx",
  "landing_final/hover-card.jsx",
  "landing_final5/universe.jsx",
  "landing_final5/node-handoff.jsx",
  "about_v2/board-scene3.jsx",
  "landing_final/board-flight.jsx",
  "landing_final5/title.jsx",
  "landing_final5/origin.jsx",
  "landing_final5/work.jsx",
  "landing_final5/app.jsx",
];

const corePath = path.join(root, "system/core.jsx");
const coreSource = fs.readFileSync(corePath, "utf8").replace(/\r\n/g, "\n");
const cursorStart = coreSource.indexOf("/* ============================================================\n   CURSOR");
const cursorEnd = coreSource.indexOf("/* ============================================================\n   SHELL", cursorStart);
if (cursorStart < 0 || cursorEnd < 0) throw new Error("Could not isolate Cursor from system/core.jsx.");

const inputs = [{
  label: "system/core.jsx#Cursor",
  code: "const { useState, useEffect, useRef } = React;\n" +
    coreSource.slice(cursorStart, cursorEnd) +
    "\nwindow.Cursor = Cursor;\n",
}].concat(sourceFiles.map((relativePath) => ({
  label: relativePath,
  code: fs.readFileSync(path.join(root, relativePath), "utf8"),
})));

const chunks = inputs.map(({ label, code }) => {
  const result = Babel.transform(code, {
    filename: label,
    sourceType: "script",
    presets: ["env", "react"],
    comments: true,
    compact: false,
  });
  return `\n/* ---- ${label} ---- */\n${result.code}\n`;
});

const banner = `/* GENERATED FILE — do not edit directly.\n` +
  `   Sources and order are declared in tools/build-final5-runtime.cjs. */\n`;
fs.writeFileSync(path.join(root, "landing_final5/runtime.js"), banner + chunks.join(""), "utf8");
console.log(`Built landing_final5/runtime.js from ${inputs.length} source units.`);
