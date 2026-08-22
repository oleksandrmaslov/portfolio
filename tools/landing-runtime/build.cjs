"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const Babel = require("@babel/standalone");

const EXPECTED_BABEL_VERSION = "7.29.0";
const root = path.resolve(__dirname, "..", "..");
const htmlPath = path.join(root, "Landing Final 5.html");
const runtimePath = path.join(root, "app", "landing", "runtime.js");
const checkOnly = process.argv.includes("--check");

// Keep this in the same order as the former text/babel tags in
// shipping landing HTML. Each unit is transformed independently because the
// classic scripts intentionally share browser globals and repeat some lexical
// helper names.
const sourceFiles = [
  "app/shared/core.jsx",
  "app/shared/key-button.jsx",
  "app/landing/components/ascii-wordmark.jsx",
  "app/projects/rendering/model-viewer.jsx",
  "app/projects/rendering/solid-hero-rig.jsx",
  "app/projects/rendering/project-handoff-rig.jsx",
  "app/landing/components/project-preview.jsx",
  "app/landing/scenes/universe.jsx",
  "app/landing/transitions/project-handoff.jsx",
  "app/landing/scenes/about-board.jsx",
  "app/landing/scenes/board-flight.jsx",
  "app/landing/sections/title.jsx",
  "app/landing/sections/origin.jsx",
  "app/landing/sections/work.jsx",
  "app/landing/app.jsx",
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
    throw new Error("The shipping landing must not load the runtime Babel compiler.");
  }
  const runtimeTag = /<script src="app\/landing\/runtime\.js\?v=[a-f0-9]{12}"><\/script>/g;
  const matches = html.match(runtimeTag) || [];
  if (matches.length !== 1) {
    throw new Error(`Expected one versioned landing runtime tag; found ${matches.length}.`);
  }
  return html.replace(
    runtimeTag,
    `<script src="app/landing/runtime.js?v=${runtimeHash}"></script>`,
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
  "   Run: npm run build --prefix tools/landing-runtime",
  "   Sources and order: tools/landing-runtime/build.cjs */",
  "",
].join("\n");
const runtime = banner + sourceFiles.map(compile).join("");
const runtimeHash = crypto.createHash("sha256").update(runtime).digest("hex").slice(0, 12);
const html = expectedHtml(runtimeHash);
const runtimeFresh = sameFile(runtimePath, runtime);
const htmlFresh = sameFile(htmlPath, html);

if (checkOnly) {
  if (!runtimeFresh || !htmlFresh) {
    if (!runtimeFresh) console.error("app/landing/runtime.js is stale or missing.");
    if (!htmlFresh) console.error("Landing Final 5.html has a stale runtime version.");
    console.error("Run: npm run build --prefix tools/landing-runtime");
    process.exit(1);
  }
  console.log(`Landing runtime is current (${runtimeHash}, ${sourceFiles.length} source units).`);
} else {
  if (!runtimeFresh) fs.writeFileSync(runtimePath, runtime, "utf8");
  if (!htmlFresh) fs.writeFileSync(htmlPath, html, "utf8");
  console.log(`Built app/landing/runtime.js (${runtimeHash}, ${sourceFiles.length} source units).`);
}
