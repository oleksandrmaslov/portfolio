"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const Babel = require("@babel/standalone");

const EXPECTED_BABEL_VERSION = "7.29.0";
const root = path.resolve(__dirname, "..", "..");
const htmlPath = path.join(root, "Landing Final 5.html");
const runtimePath = path.join(root, "landing_final5", "runtime.js");
const checkOnly = process.argv.includes("--check");

// Keep this in the same order as the former text/babel tags in
// Landing Final 5.html. Each unit is transformed independently because the
// classic scripts intentionally share browser globals and repeat some lexical
// helper names.
const sourceFiles = [
  "system/core.jsx",
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

function readSource(relativePath) {
  const absolutePath = path.join(root, relativePath);
  return fs.readFileSync(absolutePath, "utf8").replace(/\r\n/g, "\n");
}

function compile(relativePath) {
  const result = Babel.transform(readSource(relativePath), {
    filename: relativePath,
    sourceType: "script",
    presets: ["env", "react"],
    comments: false,
    compact: false,
    sourceMaps: false,
  });

  if (!result || typeof result.code !== "string") {
    throw new Error(`Babel returned no output for ${relativePath}.`);
  }

  return `\n/* ---- ${relativePath} ---- */\n${result.code}\n`;
}

function expectedHtml(runtimeHash) {
  const html = fs.readFileSync(htmlPath, "utf8");
  if (/@babel\/standalone|text\/babel|data-presets=/.test(html)) {
    throw new Error("Landing Final 5.html must not load the runtime Babel compiler.");
  }
  const runtimeTag = /<script src="landing_final5\/runtime\.js\?v=[a-f0-9]{12}"><\/script>/g;
  const matches = html.match(runtimeTag) || [];
  if (matches.length !== 1) {
    throw new Error(`Expected one versioned Final 5 runtime tag; found ${matches.length}.`);
  }
  return html.replace(
    runtimeTag,
    `<script src="landing_final5/runtime.js?v=${runtimeHash}"></script>`,
  );
}

function sameFile(filePath, expected) {
  return fs.existsSync(filePath) && fs.readFileSync(filePath, "utf8") === expected;
}

if (Babel.version !== EXPECTED_BABEL_VERSION) {
  throw new Error(
    `Expected Babel ${EXPECTED_BABEL_VERSION}; resolved ${Babel.version || "unknown"}.`,
  );
}

const banner = [
  "/* GENERATED FILE - do not edit directly.",
  "   Run: npm run build --prefix tools/final5-runtime",
  "   Sources and order: tools/final5-runtime/build.cjs */",
  "",
].join("\n");
const runtime = banner + sourceFiles.map(compile).join("");
const runtimeHash = crypto.createHash("sha256").update(runtime).digest("hex").slice(0, 12);
const html = expectedHtml(runtimeHash);
const runtimeFresh = sameFile(runtimePath, runtime);
const htmlFresh = sameFile(htmlPath, html);

if (checkOnly) {
  if (!runtimeFresh || !htmlFresh) {
    if (!runtimeFresh) console.error("landing_final5/runtime.js is stale or missing.");
    if (!htmlFresh) console.error("Landing Final 5.html has a stale runtime version.");
    console.error("Run: npm run build --prefix tools/final5-runtime");
    process.exit(1);
  }
  console.log(`Final 5 runtime is current (${runtimeHash}, ${sourceFiles.length} source units).`);
} else {
  if (!runtimeFresh) fs.writeFileSync(runtimePath, runtime, "utf8");
  if (!htmlFresh) fs.writeFileSync(htmlPath, html, "utf8");
  console.log(`Built landing_final5/runtime.js (${runtimeHash}, ${sourceFiles.length} source units).`);
}
