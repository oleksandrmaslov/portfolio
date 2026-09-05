"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const Babel = require("@babel/standalone");

const EXPECTED_BABEL_VERSION = "7.29.0";
const root = path.resolve(__dirname, "..", "..");
const landingHtmlPath = path.join(root, "index.html");
const landingRuntimePath = path.join(root, "app", "landing", "runtime.js");
const pageRuntimeDir = path.join(root, "app", "page-runtimes");
const checkOnly = process.argv.includes("--check");

const jsx = (file) => ({
  file,
  transform: true,
});
const classic = (file) => ({ file, transform: false });
const inlineJsx = (id, label, needle) => ({ inline: id, label, needle, transform: true });

const CORE = "app/shared/core.jsx";
const PROJECT_DATA = "app/projects/data.jsx";
const MODEL_VIEWER = "app/projects/rendering/model-viewer.jsx";
const SOLID_MATERIALS = "app/projects/rendering/solid-materials.js";
const SOLID_HERO = "app/projects/rendering/solid-hero-rig.jsx";
const HANDOFF_RIG = "app/projects/rendering/project-handoff-rig.jsx";
const TWEAK_PANEL = "app/projects/components/tweak-panel.jsx";
const ASCII_ENGINE = "app/projects/components/ascii-photo.js";
const ASCII_FIGURE = "app/projects/components/ascii-photo.jsx";
const POINTER_EFFECTS = "app/shared/pointer-effects.js";
const SCROLLBAR = "app/shared/scrollbar.js";
const PROJECT_PAGE_LIFECYCLE = "app/projects/pages/project-page-lifecycle.jsx";
const STANDARD_PAGE = "app/projects/pages/standard-page.jsx";
const HANDOFF_PAGE = "app/projects/pages/handoff-page.jsx";

// Keep this in the same order as the former text/babel tags in the shipping
// landing HTML. Each unit is transformed independently because the classic
// scripts intentionally share browser globals and repeat lexical helper names.
const landingSourceFiles = [
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

function phase(id, sources) {
  return { id, runtime: `app/page-runtimes/${id}.js`, sources };
}

function handoffDefinition(html, slug, options = {}) {
  const projectSources = [
    jsx(CORE),
    classic(ASCII_ENGINE),
    classic(SOLID_MATERIALS),
    jsx(PROJECT_DATA),
    jsx(MODEL_VIEWER),
    jsx(SOLID_HERO),
  ];
  if (options.projectHandoffRig) projectSources.push(jsx(HANDOFF_RIG));
  projectSources.push(jsx(TWEAK_PANEL), jsx(ASCII_FIGURE));
  return {
    html,
    plainPageConfig: true,
    phases: [
      phase(`${slug}-project`, projectSources),
      phase(`${slug}-page`, [
        classic(POINTER_EFFECTS),
        jsx(PROJECT_PAGE_LIFECYCLE),
        jsx(HANDOFF_PAGE),
        classic(SCROLLBAR),
      ]),
    ],
  };
}

function standardDefinition(html, slug, options = {}) {
  const sources = [jsx(CORE)];
  for (const file of options.demoScripts || []) sources.push(classic(file));
  sources.push(
    classic(ASCII_ENGINE),
    jsx(PROJECT_DATA),
    jsx(MODEL_VIEWER),
    classic(SOLID_MATERIALS),
    jsx(SOLID_HERO),
    jsx(TWEAK_PANEL),
    jsx(ASCII_FIGURE),
  );
  if (options.hud) sources.push(jsx(options.hud));
  if (options.compiledConfig) {
    sources.push(inlineJsx(`${slug}-config`, `${html}#PAGE_CONFIG`, "window.PAGE_CONFIG"));
    sources.push(
      classic(POINTER_EFFECTS),
      jsx(PROJECT_PAGE_LIFECYCLE),
      jsx(STANDARD_PAGE),
      classic(SCROLLBAR),
    );
    return { html, phases: [phase(`${slug}-page`, sources)] };
  }
  return {
    html,
    plainPageConfig: true,
    phases: [
      phase(`${slug}-project`, sources),
      phase(`${slug}-page`, [
        classic(POINTER_EFFECTS),
        jsx(PROJECT_PAGE_LIFECYCLE),
        jsx(STANDARD_PAGE),
        classic(SCROLLBAR),
      ]),
    ],
  };
}

// Every phase replaces one uninterrupted run of local script tags. Plain-JS
// inline PAGE_CONFIG blocks remain in HTML and form a phase boundary. JSX
// configs remain as inert source and are compiled into their ordered runtime.
const pageDefinitions = [
  {
    html: "All Projects.html",
    phases: [
      phase("all-projects-project", [
        jsx(CORE),
        inlineJsx("all-projects-key-button", "All Projects.html#KeyButton", "function KeyButton"),
      ]),
      phase("all-projects-page", [jsx("app/projects/index/app.jsx"), classic(SCROLLBAR)]),
    ],
  },
  handoffDefinition("Brionel Catalogue.html", "brionel-catalogue"),
  handoffDefinition("Bulgaria 2026.html", "bulgaria-2026"),
  standardDefinition("Ci-Clop.html", "ci-clop", {
    compiledConfig: true,
    demoScripts: ["demo/field-core.js", "demo/torch-sound.js", "demo/torch-model.js", "demo/torch-demo.js"],
    hud: "demo/torch-hud.jsx",
  }),
  {
    html: "Design System.html",
    phases: [phase("design-system-page", [
      jsx(CORE),
      jsx("app/design-system/event-bus.jsx"),
      jsx("app/design-system/foundations.jsx"),
      jsx("app/design-system/patterns.jsx"),
      jsx("app/design-system/app.jsx"),
      classic(SCROLLBAR),
    ])],
  },
  standardDefinition("Iskra.html", "iskra", { compiledConfig: true }),
  standardDefinition("Kerfur.html", "kerfur", {
    compiledConfig: true,
    demoScripts: [
      "demo/field-core.js",
      "demo/kerfur-sound.js",
      "demo/kerfur-face.js",
      "demo/kerfur-emotion.js",
      "demo/kerfur-model.js",
      "demo/kerfur-demo.js",
    ],
    hud: "demo/kerfur-hud.jsx",
  }),
  handoffDefinition("Sightseeing.html", "sightseeing"),
  handoffDefinition("Silent Depth.html", "silent-depth"),
  standardDefinition("Split HID Display.html", "split-hid-display"),
  handoffDefinition("Venovisor.html", "venovisor", { projectHandoffRig: true }),
  handoffDefinition("Wafer Studio.html", "wafer-studio"),
  {
    html: "Wafer.html",
    phases: [phase("wafer-page", [
      jsx(CORE),
      inlineJsx("wafer-key-button", "Wafer.html#KeyButton", "function KeyButton"),
      classic("demo/wafer-sound.js"),
      classic("demo/wafer-board.js"),
      classic("demo/wafer-demo.js"),
      classic(ASCII_ENGINE),
      classic(SOLID_MATERIALS),
      jsx(PROJECT_DATA),
      jsx(MODEL_VIEWER),
      jsx(SOLID_HERO),
      jsx(TWEAK_PANEL),
      jsx(ASCII_FIGURE),
      jsx("demo/wafer-hud.jsx"),
      classic(POINTER_EFFECTS),
      jsx("app/projects/pages/wafer-page.jsx"),
      classic(SCROLLBAR),
    ])],
  },
  handoffDefinition("ZMK Soft Off Plus.html", "zmk-soft-off-plus"),
  standardDefinition("ZMK-PointAccel.html", "zmk-pointaccel", {
    compiledConfig: true,
    demoScripts: ["demo/field-core.js", "demo/accel-sound.js", "demo/accel-demo.js"],
    hud: "demo/accel-hud.jsx",
  }),
];

function readSource(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8").replace(/\r\n/g, "\n");
}

function transformSource(source, label) {
  const result = Babel.transform(source, {
    filename: label,
    sourceType: "script",
    presets: ["env", "react"],
    comments: false,
    // These files are shipping artifacts, not the editing surface. Compacting
    // each source unit independently keeps the classic-script lexical
    // boundaries used by the old tags while cutting transfer and parse work.
    compact: true,
    minified: true,
    sourceMaps: false,
  });
  if (!result || typeof result.code !== "string") throw new Error(`Babel returned no output for ${label}.`);
  return `\n/* ---- ${label} ---- */\n${result.code}\n`;
}

function compile(relativePath) {
  return transformSource(readSource(relativePath), relativePath);
}

function emitClassic(relativePath) {
  const result = Babel.transform(readSource(relativePath), {
    filename: relativePath,
    sourceType: "script",
    presets: [],
    comments: false,
    compact: true,
    minified: true,
    sourceMaps: false,
  });
  if (!result || typeof result.code !== "string") {
    throw new Error(`Babel returned no output for ${relativePath}.`);
  }
  return `\n/* ---- ${relativePath} ---- */\n${result.code}\n;\n`;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function externalScriptPattern(relativePath) {
  return new RegExp(
    `<script\\b[^>]*\\bsrc="${escapeRegExp(relativePath)}(?:\\?[^\"]*)?"[^>]*>\\s*<\\/script>`,
    "g",
  );
}

function runtimeTag(runtime, hash = "000000000000") {
  // Shipping JSX used to execute from Babel's DOMContentLoaded pass, after the
  // earlier deferred Three.js module graph had populated window.THREE. Keep
  // that ordering without keeping the runtime compiler: generated page phases
  // are classic deferred scripts and retain document order with one another.
  return `<script defer src="${runtime}?v=${hash}"></script>`;
}

function matchingInlineBabelScripts(html, needle) {
  const pattern = /<script\s+type="text\/babel"\s+data-presets="env,react">([\s\S]*?)<\/script>/g;
  return [...html.matchAll(pattern)].filter((match) => match[1].includes(needle));
}

function migrateInlineSources(html, definition) {
  const inlineSources = definition.phases.flatMap((item) => item.sources).filter((source) => source.inline);
  for (const source of inlineSources) {
    if (html.includes(`data-page-runtime-source="${source.inline}"`)) continue;
    const matches = matchingInlineBabelScripts(html, source.needle);
    if (matches.length !== 1) {
      throw new Error(`${definition.html} must contain one inline source for ${source.inline}; found ${matches.length}.`);
    }
    html = html.replace(
      matches[0][0],
      `<script type="text/plain" data-page-runtime-source="${source.inline}">${matches[0][1]}</script>`,
    );
  }
  const legacyConfigs = matchingInlineBabelScripts(html, "window.PAGE_CONFIG");
  if (legacyConfigs.length > 1) throw new Error(`${definition.html} has more than one inline PAGE_CONFIG.`);
  if (legacyConfigs.length === 1) {
    const match = legacyConfigs[0];
    if (definition.plainPageConfig) return html.replace(match[0], `<script>${match[1]}</script>`);
    throw new Error(`${definition.html} has an unclassified inline PAGE_CONFIG.`);
  }
  return html;
}

function hasRuntimeTag(html, runtime) {
  return externalScriptPattern(runtime).test(html);
}

function migratePhase(html, definition, item) {
  let runtimePresent = hasRuntimeTag(html, item.runtime);
  for (const source of item.sources) {
    if (!source.file) continue;
    const pattern = externalScriptPattern(source.file);
    const matches = [...html.matchAll(pattern)];
    if (matches.length > 1) throw new Error(`${definition.html} loads ${source.file} more than once.`);
    if (!matches.length) continue;
    html = html.replace(matches[0][0], runtimePresent ? "" : runtimeTag(item.runtime));
    runtimePresent = true;
  }
  if (!runtimePresent) throw new Error(`${definition.html} has no tag for ${item.runtime}.`);
  return html;
}

function migratePageHtml(current, definition) {
  let html = migrateInlineSources(current, definition);
  for (const item of definition.phases) html = migratePhase(html, definition, item);
  html = html.replace(
    /^[ \t]*<script\b[^>]*src="[^"]*@babel\/standalone[^"]*"[^>]*>\s*<\/script>[ \t]*\r?\n?/gm,
    "",
  );
  if (!/<link\b[^>]*\brel=["'](?:shortcut\s+)?icon["']/i.test(html)) {
    if (!html.includes("</title>")) throw new Error(`${definition.html} has no title for the empty favicon marker.`);
    // Avoid one guaranteed 404 on every project route. The landing already
    // uses the same empty data favicon, so this is also cross-route parity.
    html = html.replace("</title>", '</title>\n  <link rel="icon" href="data:," />');
  }
  return html
    .replace(/<!-- React \+ Babel -->/g, "<!-- React + precompiled page runtime -->")
    // Removing an indented legacy tag can leave its indentation behind as a
    // whitespace-only line. Generated markup should stay diff-clean.
    .replace(/^[ \t]+$/gm, "");
}

function inlineSource(html, source, htmlName) {
  const pattern = new RegExp(
    `<script type="text/plain" data-page-runtime-source="${escapeRegExp(source.inline)}">([\\s\\S]*?)<\\/script>`,
    "g",
  );
  const matches = [...html.matchAll(pattern)];
  if (matches.length !== 1) {
    throw new Error(`${htmlName} must contain one inert source block for ${source.inline}; found ${matches.length}.`);
  }
  return matches[0][1].replace(/\r\n/g, "\n");
}

function buildPageRuntime(definition, item, html) {
  const banner = [
    "/* GENERATED FILE - do not edit directly.",
    "   Run: npm run build --prefix tools/landing-runtime",
    `   Page phase: ${definition.html} / ${item.id}`,
    "   Sources and order: tools/landing-runtime/build.cjs */",
    "",
  ].join("\n");
  const body = item.sources.map((source) => {
    if (source.inline) return transformSource(inlineSource(html, source, definition.html), source.label);
    return source.transform ? compile(source.file) : emitClassic(source.file);
  }).join("");
  return banner + body;
}

function hashText(text) {
  return crypto.createHash("sha256").update(text).digest("hex").slice(0, 12);
}

function assetHash(relativePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(path.join(root, relativePath))).digest("hex").slice(0, 12);
}

function stampDataAssets(html) {
  for (const relativePath of ["app/data/projects.js", "app/projects/data.jsx"]) {
    const stamped = `src="${relativePath}?v=${assetHash(relativePath)}"`;
    const parts = html.split(`src="${relativePath}`);
    if (parts.length < 2) continue;
    html = parts.reduce((acc, part, index) => {
      if (index === 0) return part;
      const close = part.indexOf('"');
      return acc + stamped + part.slice(close + 1);
    }, "");
  }
  return html;
}

function stampReference(html, attribute, relativePath, hash, expectedCount = 1) {
  const pattern = new RegExp(`${attribute}="${escapeRegExp(relativePath)}(?:\\?v=[a-f0-9]{12})?"`, "g");
  const matches = html.match(pattern) || [];
  if (matches.length !== expectedCount) {
    throw new Error(`Expected ${expectedCount} ${attribute} reference(s) to ${relativePath}; found ${matches.length}.`);
  }
  return html.replace(pattern, `${attribute}="${relativePath}?v=${hash}"`);
}

function rootHtmlFiles() {
  return fs.readdirSync(root).filter((name) => name.endsWith(".html")).sort();
}

function assertPageCoverage() {
  const deployed = rootHtmlFiles().filter((name) => name !== "index.html" && name !== "face-test.html");
  const configured = pageDefinitions.map((definition) => definition.html).sort();
  if (JSON.stringify(deployed) !== JSON.stringify(configured)) {
    throw new Error(`Page runtime manifest mismatch.\nDeployed: ${deployed.join(", ")}\nConfigured: ${configured.join(", ")}`);
  }
}

function assertNoRuntimeCompiler(html, htmlName) {
  if (/@babel\/standalone|text\/babel|data-presets=/.test(html)) {
    throw new Error(`${htmlName} still loads or invokes the runtime Babel compiler.`);
  }
  if (/<(?:script|link)\b[^>]*(?:src|href)="[^"]+\.jsx(?:\?[^\"]*)?"/.test(html)) {
    throw new Error(`${htmlName} still loads or prefetches a JSX build input.`);
  }
}

function sameFile(filePath, expected) {
  return fs.existsSync(filePath) && fs.readFileSync(filePath, "utf8") === expected;
}

if (Babel.version !== EXPECTED_BABEL_VERSION) {
  throw new Error(`Expected Babel ${EXPECTED_BABEL_VERSION}; resolved ${Babel.version || "unknown"}.`);
}
assertPageCoverage();

const landingBanner = [
  "/* GENERATED FILE - do not edit directly.",
  "   Run: npm run build --prefix tools/landing-runtime",
  "   Sources and order: tools/landing-runtime/build.cjs */",
  "",
].join("\n");
const landingRuntime = landingBanner + landingSourceFiles.map(compile).join("");
const landingRuntimeHash = hashText(landingRuntime);

const pageStates = pageDefinitions.map((definition) => {
  const filePath = path.join(root, definition.html);
  const current = fs.readFileSync(filePath, "utf8");
  return { definition, filePath, current, migrated: migratePageHtml(current, definition) };
});

const runtimeStates = [];
const runtimeById = new Map();
for (const page of pageStates) {
  for (const item of page.definition.phases) {
    const content = buildPageRuntime(page.definition, item, page.migrated);
    const state = { ...item, content, hash: hashText(content), filePath: path.join(root, item.runtime) };
    runtimeStates.push(state);
    runtimeById.set(item.id, state);
  }
}

for (const page of pageStates) {
  let expected = stampDataAssets(page.migrated);
  for (const item of page.definition.phases) {
    const runtime = runtimeById.get(item.id);
    expected = stampReference(expected, "src", item.runtime, runtime.hash);
  }
  assertNoRuntimeCompiler(expected, page.definition.html);
  page.expected = expected;
}

function expectedLandingHtml() {
  let html = fs.readFileSync(landingHtmlPath, "utf8");
  html = stampReference(html, "src", "app/landing/runtime.js", landingRuntimeHash);
  html = stampDataAssets(html);
  const waferRuntime = runtimeById.get("wafer-page");
  for (const legacyPath of ["app/projects/pages/wafer-page.jsx", "app/projects/rendering/solid-hero-rig.jsx"]) {
    if (!html.includes(`href="${legacyPath}`)) continue;
    html = html.replace(
      new RegExp(`href="${escapeRegExp(legacyPath)}(?:\\?[^\"]*)?"`, "g"),
      `href="${waferRuntime.runtime}?v=${waferRuntime.hash}"`,
    );
  }
  const waferPrefetch = new RegExp(
    `(^[ \\t]*<link rel="prefetch" href="${escapeRegExp(waferRuntime.runtime)})(?:\\?v=[a-f0-9]{12})?(" as="fetch" crossorigin="anonymous" \\/>[ \\t]*\\r?\\n?)`,
    "gm",
  );
  const matches = [...html.matchAll(waferPrefetch)];
  if (!matches.length) throw new Error("index.html has no Wafer page-runtime prefetch.");
  let keptWaferPrefetch = false;
  html = html.replace(waferPrefetch, (_tag, prefix, suffix) => {
    if (keptWaferPrefetch) return "";
    keptWaferPrefetch = true;
    return `${prefix}?v=${waferRuntime.hash}${suffix}`;
  });
  assertNoRuntimeCompiler(html, "index.html");
  return html;
}

const landingHtml = expectedLandingHtml();
const landingRuntimeFresh = sameFile(landingRuntimePath, landingRuntime);
const landingHtmlFresh = sameFile(landingHtmlPath, landingHtml);
const staleRuntimes = runtimeStates.filter((state) => !sameFile(state.filePath, state.content));
const expectedRuntimePaths = new Set(runtimeStates.map((state) => path.resolve(state.filePath).toLowerCase()));
const orphanRuntimes = fs.existsSync(pageRuntimeDir)
  ? fs.readdirSync(pageRuntimeDir)
      .filter((name) => name.endsWith(".js"))
      .map((name) => path.join(pageRuntimeDir, name))
      .filter((filePath) => !expectedRuntimePaths.has(path.resolve(filePath).toLowerCase()))
  : [];
const stalePages = pageStates.filter((page) => page.current !== page.expected);

if (checkOnly) {
  if (!landingRuntimeFresh || !landingHtmlFresh || staleRuntimes.length || orphanRuntimes.length || stalePages.length) {
    if (!landingRuntimeFresh) console.error("app/landing/runtime.js is stale or missing.");
    if (!landingHtmlFresh) console.error("index.html has a stale runtime, prefetch, or data version.");
    for (const runtime of staleRuntimes) console.error(`${runtime.runtime} is stale or missing.`);
    for (const runtime of orphanRuntimes) console.error(`${path.relative(root, runtime)} is an orphaned page runtime.`);
    for (const page of stalePages) console.error(`${page.definition.html} has stale page-runtime markup.`);
    console.error("Run: npm run build --prefix tools/landing-runtime");
    process.exit(1);
  }
  console.log(`Landing runtime is current (${landingRuntimeHash}, ${landingSourceFiles.length} source units).`);
  console.log(`Page runtimes are current (${runtimeStates.length} ordered phase bundles).`);
  console.log(`Generated HTML is current on ${pageStates.length + 1} deployed root pages.`);
} else {
  if (!landingRuntimeFresh) fs.writeFileSync(landingRuntimePath, landingRuntime, "utf8");
  if (!fs.existsSync(pageRuntimeDir)) fs.mkdirSync(pageRuntimeDir, { recursive: true });
  for (const runtime of staleRuntimes) fs.writeFileSync(runtime.filePath, runtime.content, "utf8");
  for (const runtime of orphanRuntimes) fs.rmSync(runtime);
  if (!landingHtmlFresh) fs.writeFileSync(landingHtmlPath, landingHtml, "utf8");
  for (const page of stalePages) fs.writeFileSync(page.filePath, page.expected, "utf8");
  console.log(`Built app/landing/runtime.js (${landingRuntimeHash}, ${landingSourceFiles.length} source units).`);
  console.log(`Built ${runtimeStates.length} ordered page-runtime phase bundle(s).`);
  if (orphanRuntimes.length) console.log(`Removed ${orphanRuntimes.length} orphaned page-runtime bundle(s).`);
  console.log(`Updated generated markup on ${stalePages.length + (landingHtmlFresh ? 0 : 1)} page(s).`);
}
