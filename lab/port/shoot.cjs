#!/usr/bin/env node
/* Visual baseline of every public surface that renders a model.
     node shoot.cjs <outDir> [filter]
   BASE (or SHOOT_BASE) overrides the server, http://127.0.0.1:8765/.
   filter: substring matched against group ids and shot ids
   (e.g. "hero-", "hero-wafer", "landing", "menu", "demo", "flight").

   Per shot it writes <id>.png (the page), <id>--gl.png (canvases only: every
   DOM node hidden but <canvas>, so model renders compare without text noise)
   and a manifest.json entry: URL, viewport, every wait with its duration and
   outcome, scroll steps, pixel stats for both captures, renderer state and the
   page errors / console warnings / failed requests since the previous shot.

   Determinism: project heroes have the rig's idle turntable forced off (an
   init-script wrapper on window.makeWaferRig) so every hero rests exactly at
   WAFER_RIG.arriveYaw, then a frame-diff detector waits until the page stops
   changing. The landing field drifts forever, so its shots use fixed waits
   (with a synthetic scroll ping that keeps the 30 s idle-attention beat from
   firing). Flight frames freeze the page's rAF + setTimeout + CSS animations
   at a defined point of the flight's own clock, shoot, then thaw. */
"use strict";
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const PW = "/home/oleksandr/.npm/_npx/31e32ef8478fbf80/node_modules/";
const { chromium } = require(PW + "playwright");
const { PNG } = require(PW + "playwright-core/lib/utilsBundle");

const BASE = process.env.BASE || process.env.SHOOT_BASE || "http://127.0.0.1:8765/";
const REPO = "/home/oleksandr/projects/Portfolio-workspace/portfolio";
const VIEW = { width: 1440, height: 900 };
const LAUNCH = {
  executablePath: "/usr/bin/google-chrome",
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
};
const FLIGHT_SIM_MS = 400; // forward freeze point, in the flight's own clamped clock (see README in manifest). 450 froze one frame after the 10th travel frame, i.e. after navigation.
/* FLIGHT_ADDR picks the flight group's node. Featured nodes leave from their
   reel card; 0x05 (not in the reel) leaves from its universe tile. Shot ids
   carry the addr when it is not 0x01. */
const FLIGHT_ADDR = process.env.FLIGHT_ADDR || "0x01";
const FLIGHT_FILE = { "0x01": "Wafer.html", "0x04": "Ci-Clop.html", "0x05": "Venovisor.html" }[FLIGHT_ADDR];
if (!FLIGHT_FILE) { console.error("FLIGHT_ADDR must be 0x01, 0x04 or 0x05"); process.exit(2); }
const FSUF = FLIGHT_ADDR === "0x01" ? "" : "-" + FLIGHT_ADDR;
const FLIGHT_FILE_RE = new RegExp(FLIGHT_FILE.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/ /g, "(%20| )"));

const [outDir, filter = ""] = process.argv.slice(2);
if (!outDir) { console.error("usage: node shoot.cjs <outDir> [filter]"); process.exit(2); }
fs.mkdirSync(outDir, { recursive: true });

/* The 13 project routes (AGENTS.md "Public routes"). */
const PROJECTS = [
  ["wafer", "Wafer.html"], ["kerfur", "Kerfur.html"], ["iskra", "Iskra.html"],
  ["ci-clop", "Ci-Clop.html"], ["venovisor", "Venovisor.html"], ["wafer-studio", "Wafer Studio.html"],
  ["split-hid-display", "Split HID Display.html"], ["zmk-pointaccel", "ZMK-PointAccel.html"],
  ["zmk-soft-off-plus", "ZMK Soft Off Plus.html"], ["sightseeing", "Sightseeing.html"],
  ["silent-depth", "Silent Depth.html"], ["brionel-catalogue", "Brionel Catalogue.html"],
  ["bulgaria-2026", "Bulgaria 2026.html"],
];
const url = (file) => BASE + encodeURI(file);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ---------------- init scripts (run before any page script) ---------------- */
const EVENTS_JS = `(() => {
  window.__shootEv = {};
  ["mo:preloader-done","mo:first-frame","mo:universe-ready","mo:board-ready","mo:handoff-warm","mo:menu-settled"]
    .forEach((n) => addEventListener(n, () => { window.__shootEv[n] = performance.now(); }));
  try { const s = sessionStorage.getItem("mo_node_seam"); if (s) window.__shootSeam = s; } catch (_) {}
})();`;

/* SwiftShader compensation. Its first frames stall the main thread for tens
   of seconds (shader compile), and Chrome then runs the next rAF batch with
   the STALE frame-begin timestamp: up to 32 s older than a performance.now()
   a loop stored as \`last\` just before requesting it. The hero rig's damp()
   does not clamp a negative dt, so pivot scale diverged to ~1e190 and every
   hero drew zero draw calls. Deliver each frame's timestamp as the time its
   first callback actually runs (one value per frame, monotonic), which is
   what a real GPU's frame clock looks like. */
const FRESH_RAF_JS = `(() => {
  const raf = window.requestAnimationFrame.bind(window);
  let raw = -1, fresh = 0;
  window.requestAnimationFrame = function (cb) {
    return raf(function (ts) {
      if (ts !== raw) { raw = ts; fresh = Math.max(ts, performance.now(), fresh); }
      cb(fresh);
    });
  };
})();`;

/* Idle turntable off: the hero then rests at a defined pose. */
const FREEZE_IDLE_JS = `(() => {
  let fn;
  Object.defineProperty(window, "makeWaferRig", { configurable: true, get() { return fn; }, set(make) {
    fn = function () { const rig = make.apply(this, arguments);
      if (rig) { const set = rig.setIdle; rig.setIdle = () => set.call(rig, false); }
      return rig; };
  } });
})();`;

/* rAF / setTimeout / CSS-animation freeze for flight frames. Forward: armed
   from the driver, counts the flight's clamped clock from release (the
   .universeBg 420 ms fade) and freezes at the first frame past FLIGHT_SIM_MS.
   Reverse: armed through sessionStorage before the navigation, freezes the
   moment .wf--dissolve lands (the end of the hold, i.e. the last frame of the
   model flying home before the field returns). */
const FREEZE_TOOLS_JS = `(() => {
  const rAF = window.requestAnimationFrame.bind(window);
  const sT = window.setTimeout.bind(window);
  const S = window.__shoot = { frozen: false, why: "", qr: [], qt: [], anims: [], released: false, sim: 0, ts: 0, target: null };
  S.freeze = (why) => {
    if (S.frozen) return; S.frozen = true; S.why = why; S.at = performance.now();
    for (const a of document.getAnimations()) if (a.playState === "running") { a.pause(); S.anims.push(a); }
  };
  S.thaw = () => {
    S.frozen = false; S.target = null;
    S.anims.splice(0).forEach((a) => { try { a.play(); } catch (_) {} });
    S.qr.splice(0).forEach((cb) => window.requestAnimationFrame(cb));
    S.qt.splice(0).forEach((f) => sT(f, 0));
  };
  window.requestAnimationFrame = function (cb) {
    return rAF(function (ts) {
      if (S.frozen) { S.qr.push(cb); return; }
      if (ts !== S.ts) {
        if (S.target != null && S.released) {
          // the flight leaves on its 10th travel frame, or on its failsafe timer (hold max + 2 x duration from the start), which
          // SwiftShader's 300-500 ms frames reach first: freeze by whichever comes first of the clock, 4 frames, or 1.5 s
          if (S.sim >= S.target || S.frames >= 4 || performance.now() - S.releasedAt >= 1500) { S.freeze("forward: flight clock " + Math.round(S.sim) + " ms, " + S.frames + " frames after release"); S.qr.push(cb); return; }
          if (S.ts) { S.sim += Math.min(50, ts - S.ts); S.frames++; }
        }
        S.ts = ts;
      }
      cb(ts);
    });
  };
  window.setTimeout = function (cb, ms, ...a) {
    if (typeof cb !== "function") return sT(cb, ms, ...a);
    return sT(function () { if (S.frozen) { S.qt.push(() => cb(...a)); return; } cb(...a); }, ms);
  };
  S.armForward = (simMs) => {
    const uni = document.querySelector(".universeBg");
    S.target = simMs; S.released = false; S.sim = 0; S.frames = 0;
    new MutationObserver((recs, mo) => {
      if (uni.style.opacity === "0" && /420ms/.test(uni.style.transition)) { S.released = true; S.releasedAt = performance.now(); mo.disconnect(); }
    }).observe(uni, { attributes: true, attributeFilter: ["style"] });
  };
  let arm = null;
  try { arm = sessionStorage.getItem("__shoot_arm"); sessionStorage.removeItem("__shoot_arm"); } catch (_) {}
  if (arm === "reverse") {
    new MutationObserver((recs, mo) => {
      for (const r of recs) if (r.target.classList && r.target.classList.contains("wf--dissolve")) {
        mo.disconnect(); S.freeze("reverse: .wf--dissolve (end of the hold)"); return;
      }
    }).observe(document, { subtree: true, attributes: true, attributeFilter: ["class"] });   // init scripts run before <html> exists
  }
})();`;

/* ---------------- pixel stats ---------------- */
function stats(buf) {
  const { width, height, data } = PNG.sync.read(buf);
  let n = 0, sum = 0, sum2 = 0;
  const colors = new Set();
  for (let i = 0; i < data.length; i += 16) { // every 4th pixel
    const l = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
    sum += l; sum2 += l * l; n++;
    colors.add(((data[i] >> 4) << 8) | ((data[i + 1] >> 4) << 4) | (data[i + 2] >> 4));
  }
  const mean = sum / n;
  const std = Math.sqrt(Math.max(0, sum2 / n - mean * mean));
  return { width, height, meanLuma: +mean.toFixed(2), stdLuma: +std.toFixed(2), colors: colors.size, blank: std < 3 || colors.size < 8 };
}
function meanDiff(a, b) {
  const A = PNG.sync.read(a).data, B = PNG.sync.read(b).data;
  if (A.length !== B.length) return 255;
  let s = 0, n = 0;
  for (let i = 0; i < A.length; i += 16) { s += Math.abs(A[i] - B[i]) + Math.abs(A[i + 1] - B[i + 1]) + Math.abs(A[i + 2] - B[i + 2]); n += 3; }
  return s / n;
}

/* ---------------- run state ---------------- */
const manifest = {
  createdAt: new Date().toISOString(),
  base: BASE, viewport: VIEW, deviceScaleFactor: 1, launch: LAUNCH, filter,
  gitHead: (() => { try { return execSync("git -C " + JSON.stringify(REPO) + " rev-parse HEAD").toString().trim(); } catch (_) { return null; } })(),
  notes: [
    "all pages: rAF timestamps are delivered as the time the frame's first callback runs (FRESH_RAF_JS). Under SwiftShader Chrome otherwise hands loops a frame-begin time up to 32 s older than their stored performance.now(); solid-hero-rig damp() has no negative-dt clamp, so every hero diverged off screen (pivot scale ~1e190, zero draw calls).",
    "heroes: rig idle turntable forced off; settled = two consecutive captures 800 ms apart differ by < 0.25 mean abs RGB (or the max wait).",
    "landing: the field drifts, so landing shots are fixed-wait and approximate; DoF state is recorded per shot (SwiftShader runs under the 30 FPS gate, so the bokeh pass switches itself off ~120 frames after mount).",
    "flight-forward-mid: frozen at the first frame whose flight clock (sum of 50 ms-clamped frame deltas since release, the rig's own clock) passed " + FLIGHT_SIM_MS + " ms. The flight is 1200 ms on a 60 fps machine; " + FLIGHT_SIM_MS + " ms is the latest point every frame rate reaches before navigation (which needs >= 10 travel frames: at 50 ms per clamped frame the 10th travel frame is 450 ms, so the freeze must land before it).",
    "flight-reverse-mid: frozen the moment .wf--dissolve lands = the last hold frame of the model flying home (hold >= 620 ms, then a 700 ms dissolve).",
  ],
  browser: null,
  shots: [],
  missed: [],
};
let browser, current = null; // current = the open group's state, so a crash keeps its partial shots

async function openPage(opts = {}) {
  const ctx = await browser.newContext({ viewport: VIEW, deviceScaleFactor: 1 });
  await ctx.addInitScript({ content: FRESH_RAF_JS });
  await ctx.addInitScript({ content: EVENTS_JS });
  if (opts.freezeIdle !== false) await ctx.addInitScript({ content: FREEZE_IDLE_JS });
  if (opts.flight) await ctx.addInitScript({ content: FREEZE_TOOLS_JS });
  const page = await ctx.newPage();
  page.setDefaultNavigationTimeout(120000);   // a cold unpkg fetch can hold domcontentloaded past 30 s
  const g = current = { ctx, page, shots: [], waits: [], scroll: [], errors: [], console: [], failed: [], glb: [] };
  page.on("pageerror", (e) => g.errors.push({ url: page.url(), message: String((e && e.stack) || e).slice(0, 800) }));
  page.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") g.console.push({ url: page.url(), type: m.type(), text: m.text().slice(0, 600) }); });
  page.on("requestfailed", (r) => g.failed.push({ url: r.url(), error: r.failure() && r.failure().errorText }));
  page.on("response", (r) => { if (r.status() >= 400) g.failed.push({ url: r.url(), status: r.status() }); });
  const inflight = new Set();
  let lastNet = Date.now();
  page.on("request", (r) => {
    if (/\.glb(\?|$)/.test(r.url())) g.glb.push(decodeURI(r.url().replace(BASE, "")));
    if (r.resourceType() === "media") return; // range-streamed clips never "finish"
    inflight.add(r); lastNet = Date.now();
  });
  const done = (r) => { if (inflight.delete(r)) lastNet = Date.now(); };
  page.on("requestfinished", done);
  page.on("requestfailed", done);
  g.netQuiet = async (quiet = 1500, max = 60000) => {
    const t0 = Date.now();
    while (Date.now() - t0 < max) {
      if (inflight.size === 0 && Date.now() - lastNet >= quiet) { g.waits.push({ wait: "network quiet " + quiet + " ms", ms: Date.now() - t0, ok: true }); return true; }
      await sleep(200);
    }
    g.waits.push({ wait: "network quiet " + quiet + " ms", ms: Date.now() - t0, ok: false, inflight: [...inflight].map((r) => r.url()).slice(0, 10) });
    return false;
  };
  g.until = async (label, fn, arg, timeout = 60000) => {
    const t0 = Date.now();
    try { await page.waitForFunction(fn, arg, { timeout, polling: 250 }); g.waits.push({ wait: label, ms: Date.now() - t0, ok: true }); return true; }
    catch (_) { g.waits.push({ wait: label, ms: Date.now() - t0, ok: false }); return false; }
  };
  // A frozen page runs none of its own timers, and waitForFunction polls on them: ask from here instead.
  g.untilFrozen = async (label, timeout) => {
    const t0 = Date.now();
    while (Date.now() - t0 < timeout) {
      if (await page.evaluate(() => !!(window.__shoot && window.__shoot.frozen)).catch(() => false)) { g.waits.push({ wait: label, ms: Date.now() - t0, ok: true }); return true; }
      await sleep(100);
    }
    g.waits.push({ wait: label, ms: Date.now() - t0, ok: false });
    return false;
  };
  g.fixed = async (label, ms, keepAlive = false) => {
    const t0 = Date.now();
    while (Date.now() - t0 < ms) {
      if (keepAlive) await page.evaluate(() => window.dispatchEvent(new Event("scroll"))).catch(() => {});
      await sleep(Math.min(4000, ms - (Date.now() - t0)));
    }
    g.waits.push({ wait: label, ms, fixed: true, keepAlive });
  };
  g.settleDiff = async (max = 25000, every = 800, threshold = 0.25) => {
    const t0 = Date.now();
    let prev = await page.screenshot(), d = 255;
    while (Date.now() - t0 < max) {
      await sleep(every);
      const next = await page.screenshot();
      d = meanDiff(prev, next); prev = next;
      if (d < threshold) { g.waits.push({ wait: "frame-diff settle", ms: Date.now() - t0, ok: true, lastDiff: +d.toFixed(3) }); return true; }
    }
    g.waits.push({ wait: "frame-diff settle", ms: Date.now() - t0, ok: false, lastDiff: +d.toFixed(3), reason: "still changing at max wait" });
    return false;
  };
  g.scrollTo = async (label, y) => {
    await page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), y);
    g.scroll.push({ step: label, target: Math.round(y) });
  };
  g.mark = { errors: 0, console: 0, failed: 0, glb: 0 };
  return g;
}

/* The canvases-only capture: hide every box except <canvas>. */
const GL_ONLY_CSS = "*{visibility:hidden!important;caret-color:transparent!important}canvas{visibility:visible!important}";

async function shoot(g, id, what, opts = {}) {
  const { page } = g;
  const file = id + ".png", glFile = id + "--gl.png";
  const buf = await page.screenshot({ path: path.join(outDir, file) });
  const handle = await page.addStyleTag({ content: GL_ONLY_CSS });
  const glBuf = await page.screenshot({ path: path.join(outDir, glFile) });
  await handle.evaluate((n) => n.remove());
  const state = await page.evaluate(() => {
    const rig = window.__pageRig || window.__waferRig;
    return {
      url: location.href, title: document.title, scrollY: Math.round(scrollY),
      canvases: [...document.querySelectorAll("canvas")].filter((c) => c.width > 1).map((c) => {
        const r = c.getBoundingClientRect();
        return { w: c.width, h: c.height, css: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)] };
      }),
      heroRigReady: rig ? rig.ready : null, heroYaw: rig && rig.yaw != null ? +rig.yaw.toFixed(4) : null,
      dofOn: window.__mo_dofOn, dofFps: window.__mo_dofFps,
      events: window.__shootEv || null,
      freeze: window.__shoot ? { frozen: window.__shoot.frozen, why: window.__shoot.why, simMs: Math.round(window.__shoot.sim) } : null,
      waferDemo: window.WaferDemo ? { phase: window.WaferDemo.state.phase, explode: +window.WaferDemo.state.explodeC.toFixed(3) } : null,
    };
  }).catch((e) => ({ error: String(e) }));
  const m = g.mark;
  const entry = {
    id, what, file, glFile, url: state.url || page.url(), viewport: VIEW,
    waits: g.waits.splice(0), scroll: g.scroll.splice(0),
    stats: stats(buf), glStats: stats(glBuf), expectGL: opts.expectGL !== false,
    state, ...(opts.extra || {}),
    glbRequested: g.glb.slice(m.glb),
    pageErrors: g.errors.slice(m.errors), consoleWarnings: g.console.slice(m.console), requestFailures: g.failed.slice(m.failed),
  };
  g.mark = { errors: g.errors.length, console: g.console.length, failed: g.failed.length, glb: g.glb.length };
  entry.blank = entry.stats.blank || (entry.expectGL && entry.glStats.blank);
  g.shots.push(entry);
  console.log(`  ${entry.blank ? "BLANK" : "ok   "} ${id}  std=${entry.stats.stdLuma} glStd=${entry.glStats.stdLuma} errors=${entry.pageErrors.length} warn=${entry.consoleWarnings.length}`);
  return entry;
}

/* ---------------- groups ---------------- */
async function heroReady(g, slow) {
  await g.until("hero rig ready + .hv-page--ready", () => {
    const r = window.__pageRig || window.__waferRig;
    return !!(r && r.ready && document.querySelector(".hv-page--ready"));
  }, null, 60000 * slow);
  await g.netQuiet(1500, 30000 * slow);
  await g.settleDiff(25000 * slow);
}

function heroGroup(slug, file) {
  return { id: "hero-" + slug, run: async (slow) => {
    const g = await openPage();
    await g.page.goto(url(file), { waitUntil: "domcontentloaded" });
    await heroReady(g, slow);
    await shoot(g, "hero-" + slug, file + " hero at rest (direct load)");
    return g;
  } };
}

const LANDING_JS = {
  reelY: (addr) => {
    const el = document.getElementById("work");
    const feat = window.MO_FEATURED_ADDRS || [];
    const N = feat.length, STOPS = N + 2, PADS = 0.6, padN = PADS / (STOPS + PADS);
    const stop = feat.indexOf(addr) + 1;
    const target = padN + (stop / (STOPS - 1)) * (1 - 2 * padN);
    return el.getBoundingClientRect().top + scrollY + target * (el.offsetHeight - innerHeight);
  },
  boardY: () => {
    // mirror of board-flight.jsx: LEAD_V 2.4, FLIGHT_V = stops + 1, FOOT_V 1.4; explode stop t = p / 10
    const el = document.getElementById("about");
    const STOPS = window.MOBoard.STOPS, N = STOPS.length;
    const LEAD_V = 2.4, FLIGHT_V = N + 1, FOOT_V = 1.4, TOTAL_V = LEAD_V + FLIGHT_V + FOOT_V;
    const t = STOPS.find((s) => s.explode).p / 10;
    const pad = 0.5 / FLIGHT_V;
    const fr = t * (1 - pad) + pad;
    const raw = LEAD_V / TOTAL_V + fr * (FLIGHT_V / TOTAL_V);
    return el.getBoundingClientRect().top + scrollY + raw * (el.offsetHeight - innerHeight);
  },
};

async function landingBoot(g, slow) {
  await g.page.goto(url("index.html"), { waitUntil: "domcontentloaded" });
  await g.until("mo:preloader-done", () => !!(window.__shootEv && window.__shootEv["mo:preloader-done"]), null, 90000 * slow);
  await g.until("universe first frame", () => !!window.__mo_firstFrameAt, null, 30000 * slow);
  await g.netQuiet(2000, 60000 * slow);
}

const GROUPS = [
  ...PROJECTS.map(([s, f]) => heroGroup(s, f)),

  { id: "landing", shots: ["landing-title", "landing-reel", "landing-board-explode"], run: async (slow) => {
    const g = await openPage();
    await landingBoot(g, slow);
    await g.fixed("field settle (arrival overture 2.6 s + model fade-ins)", 8000 * slow, true);
    await shoot(g, "landing-title", "landing at the title: the universe field");

    await g.scrollTo("work reel, Wafer stop", await g.page.evaluate(LANDING_JS.reelY, "0x01"));
    await g.netQuiet(1500, 30000 * slow);
    await g.fixed("reel settle", 6000 * slow, true);
    await shoot(g, "landing-reel", "landing scrolled to the work reel, Wafer card (stop 1) centred");

    await g.scrollTo("about board, explode stop (t = 0.7)", await g.page.evaluate(LANDING_JS.boardY));
    await g.until("mo:board-ready", () => !!(window.__shootEv && window.__shootEv["mo:board-ready"]), null, 90000 * slow);
    await g.netQuiet(2000, 60000 * slow);
    await g.fixed("board camera + explode settle", 8000 * slow);
    await shoot(g, "landing-board-explode", "Board Flight at the Wafer explode stop (buildWaferReal, 53 part GLBs)");
    return g;
  } },

  { id: "all-projects", run: async (slow) => {
    const g = await openPage();
    await g.page.goto(url("All Projects.html"), { waitUntil: "domcontentloaded" });
    await g.until("index rows mounted", () => document.querySelectorAll("#root *").length > 50, null, 60000 * slow);
    await g.netQuiet(1500, 30000 * slow);
    await g.fixed("row entrance", 4000 * slow);
    await shoot(g, "all-projects", "All Projects index (no WebGL on the page itself)", { expectGL: false });
    return g;
  } },

  ...[
    ["menu-landing", "index.html", "menu open on the landing (objects drawn by the Universe renderer)"],
    ["menu-project", "Ci-Clop.html", "menu open on a project page (objects drawn by the borrowed hero renderer)"],
    ["menu-allprojects", "All Projects.html", "menu open on All Projects (standalone menu renderer)"],
  ].map(([id, file, what]) => ({ id, run: async (slow) => {
    const g = await openPage();
    if (file === "index.html") { await landingBoot(g, slow); await g.fixed("field settle", 5000 * slow, true); }
    else {
      await g.page.goto(url(file), { waitUntil: "domcontentloaded" });
      if (file === "Ci-Clop.html") await heroReady(g, slow);
      else { await g.netQuiet(1500, 30000 * slow); await g.fixed("row entrance", 3000 * slow); }
    }
    // A pointer click with no pointer: detail 1 takes the animated path, no reticle, no hover.
    await g.page.evaluate(() => document.querySelector(".lp-menuToggle").dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, detail: 1, button: 0 })));
    await g.until("menu settled + 4 objects drawn", () => document.body.classList.contains("mo-menu-settled")
      && document.querySelectorAll('[data-menu-object][data-model-ready="true"]').length === 4, null, 60000 * slow);
    await g.netQuiet(1500, 30000 * slow);
    await g.fixed("menu objects settle", 2500 * slow);
    await shoot(g, id, what + " — " + file);
    return g;
  } })),

  { id: "wafer-demo", shots: ["wafer-demo-assembled", "wafer-demo-exploded"], run: async (slow) => {
    const g = await openPage();
    await g.page.goto(url("Wafer.html"), { waitUntil: "domcontentloaded" });
    await heroReady(g, slow);
    await g.page.evaluate(() => document.querySelector(".hv-demo button.key").click());
    g.scroll.push({ step: "PLAY DEMO pressed" });
    await g.until("WaferDemo intro played (phase live)", () => window.WaferDemo && window.WaferDemo.state.phase === "live", null, 180000 * slow);
    await g.netQuiet(1500, 30000 * slow);
    await g.fixed("demo camera settle", 4000 * slow);
    await shoot(g, "wafer-demo-assembled", "Wafer PLAY DEMO after the intro (assembled, demo/wafer-board.js parts)");
    await g.page.evaluate(() => window.WaferDemo.setExplode(1));
    g.scroll.push({ step: "WaferDemo.setExplode(1) (= HUD slider at 100%)" });
    await g.until("explode eased to 1", () => window.WaferDemo.state.explodeC > 0.995, null, 60000 * slow);
    await g.fixed("explode settle", 2500 * slow);
    await shoot(g, "wafer-demo-exploded", "Wafer PLAY DEMO fully exploded");
    return g;
  } },

  { id: "flight", shots: ["flight-forward-mid", "flight-forward-arrived", "flight-reverse-mid", "flight-reverse-landed"].map((s) => s + FSUF), run: async (slow) => {
    const g = await openPage({ flight: true });
    const { page } = g;
    const id = (s) => s + FSUF;
    await landingBoot(g, slow);
    await g.fixed("field settle", 5000 * slow, true);
    const reel = FLIGHT_ADDR !== "0x05";
    if (reel) {
      await g.scrollTo("work reel, " + FLIGHT_ADDR + " stop", await page.evaluate(LANDING_JS.reelY, FLIGHT_ADDR));
      await g.netQuiet(1500, 30000 * slow);
      await g.fixed("reel settle", 5000 * slow, true);
    }
    await g.until("handoff rig primed (mo:handoff-warm)", () => !!(window.__shootEv && window.__shootEv["mo:handoff-warm"]), null, 30000 * slow);

    if (reel) {
      // forward: the reel card's own click path (tileBounds origin, origin = work)
      await page.evaluate(([ms, a]) => { window.__shoot.armForward(ms); document.querySelector('.rcard[data-addr="' + a + '"]').click(); }, [FLIGHT_SIM_MS, FLIGHT_ADDR]);
      g.scroll.push({ step: "clicked .rcard[data-addr=" + FLIGHT_ADDR + "]" });
    } else {
      // forward: the universe tile's path (tileBounds origin, origin = universe), from the title
      await g.until("tileBounds(" + FLIGHT_ADDR + ") non-null", (a) => !!(window.__mo_universe && window.__mo_universe.tileBounds(a)), FLIGHT_ADDR, 60000 * slow);
      await page.evaluate(([ms, a]) => { window.__shoot.armForward(ms); window.__mo_open_project({ addr: a }, window.__mo_universe.tileBounds(a)); }, [FLIGHT_SIM_MS, FLIGHT_ADDR]);
      g.scroll.push({ step: "__mo_open_project(" + FLIGHT_ADDR + ") from the title" });
    }
    const fwd = await g.untilFrozen("forward flight frozen", 60000 * slow);
    if (fwd) {
      await shoot(g, id("flight-forward-mid"), "landing → " + FLIGHT_FILE + " handoff, mid-flight (" + FLIGHT_SIM_MS + " ms flight clock after release)");
      await page.evaluate(() => window.__shoot.thaw());
    } else manifest.missed.push({ id: id("flight-forward-mid"), reason: "the forward flight never released/froze within the timeout" });

    await page.waitForURL(FLIGHT_FILE_RE, { timeout: 60000 * slow, waitUntil: "domcontentloaded" });
    g.scroll.push({ step: "navigated to " + FLIGHT_FILE + " by the flight" });
    const seam = await page.evaluate(() => window.__shootSeam || null);
    let seamFile = null;
    if (seam && seam.startsWith("data:image/jpeg;base64,")) {
      seamFile = id("flight-forward-seam") + ".jpg";
      fs.writeFileSync(path.join(outDir, seamFile), Buffer.from(seam.split(",")[1], "base64"));
    }
    await heroReady(g, slow);
    await shoot(g, id("flight-forward-arrived"), FLIGHT_FILE + " after the forward flight (seam dropped, rig at rest)", { extra: { seamFile, seamNote: "the seam JPEG is the landing's last flight frame (mo_node_seam), 1100 px wide" } });

    // reverse: ← UNIVERSE on the page, armed to freeze at the dissolve
    await page.evaluate(() => { sessionStorage.setItem("__shoot_arm", "reverse"); [...document.querySelectorAll(".site-header__utility a")].find((a) => /UNIVERSE/.test(a.textContent)).click(); });
    g.scroll.push({ step: "clicked ← UNIVERSE" });
    await page.waitForURL((u) => /\/(index\.html)?(#work)?$/.test(u.pathname + u.hash), { timeout: 30000 * slow, waitUntil: "domcontentloaded" });
    const rev = await g.untilFrozen("reverse flight frozen at dissolve", 90000 * slow);
    if (rev) {
      await shoot(g, id("flight-reverse-mid"), FLIGHT_FILE + " → landing reverse flight, last hold frame (dissolve start)");
      await page.evaluate(() => window.__shoot.thaw());
    } else manifest.missed.push({ id: id("flight-reverse-mid"), reason: "the reverse flight never reached its dissolve within the timeout" });
    await g.until("handoff overlay cleared", () => !document.querySelector(".wf--on"), null, 30000 * slow);
    await g.netQuiet(1500, 30000 * slow);
    await g.fixed("field settle after return", 5000 * slow, true);
    await shoot(g, id("flight-reverse-landed"), "landing after the reverse flight (back where the flight left)");
    return g;
  } },
];

/* ---------------- main ---------------- */
(async () => {
  browser = await chromium.launch(LAUNCH);
  manifest.browser = browser.version();
  const t0 = Date.now();
  const selected = GROUPS.filter((gr) => !filter || gr.id.includes(filter) || (gr.shots || []).some((s) => s.includes(filter)));
  for (const gr of selected) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      const slow = attempt; // the retry doubles every wait
      console.log(`[${((Date.now() - t0) / 1000).toFixed(0)}s] ${gr.id} (attempt ${attempt})`);
      let err = null;
      current = null;
      try { await gr.run(slow); } catch (e) { err = e; }
      const g = current;
      const got = (g && g.shots) || [];
      if (g) await g.ctx.close().catch(() => {});
      const blank = got.some((s) => s.blank);
      if ((err || blank) && attempt === 1) { console.log("  retrying with doubled waits:", err ? String(err).split("\n")[0] : "blank shot"); continue; }
      got.forEach((s) => { s.attempt = attempt; manifest.shots.push(s); });
      if (err) manifest.missed.push({ id: gr.id, reason: String(err).split("\n").slice(0, 3).join(" | ") });
      break;
    }
  }
  await browser.close();
  manifest.durationS = Math.round((Date.now() - t0) / 1000);
  const mfile = path.join(outDir, "manifest.json");
  try { // a filtered run replaces only its own shots
    const old = JSON.parse(fs.readFileSync(mfile, "utf8")), mine = new Set(manifest.shots.map((s) => s.id).concat(manifest.missed.map((m) => m.id)));
    manifest.shots = old.shots.filter((s) => !mine.has(s.id)).concat(manifest.shots);
    manifest.missed = (old.missed || []).filter((m) => !mine.has(m.id) && !manifest.shots.some((s) => s.id === m.id)).concat(manifest.missed);
  } catch (_) {}
  fs.writeFileSync(mfile, JSON.stringify(manifest, null, 2));
  console.log(`done: ${manifest.shots.length} shots, ${manifest.missed.length} missed, ${manifest.durationS}s → ${outDir}`);
})().catch((e) => { console.error(e); process.exit(1); });
