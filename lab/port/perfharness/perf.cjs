#!/usr/bin/env node
/* Site performance harness (perf slice). No site code changes.
   node perf.cjs <out.json> [stateFilter]      measure, write JSON, print tables
   node perf.cjs --print <file.json>            re-print tables from a run
   States: landing-title, landing-board, route:<Name> (13), iskra-menu.
   Env: BASE or PERF_BASE (http://127.0.0.1:8765/), PERF_ROOT (repo, for gzip estimates),
        PERF_FRAMES (60), PERF_DOF=probe (leave the Universe DoF probe's verdict alone;
        default forces the Bokeh pass back on, as a capable GPU keeps it).
   three r160 defines render() in the WebGLRenderer constructor (an own property),
   so wrapping the prototype does nothing; instead window.THREE is trapped and its
   WebGLRenderer swapped for a subclass that instruments each instance. */
const fs = require("fs"), path = require("path"), zlib = require("zlib");

const BASE = process.env.BASE || process.env.PERF_BASE || "http://127.0.0.1:8765/";
const ROOT = process.env.PERF_ROOT || "/home/oleksandr/projects/Portfolio-workspace/portfolio";
const FRAMES = +process.env.PERF_FRAMES || 60;
const WARM = process.env.PERF_WARM != null ? +process.env.PERF_WARM : 10;   // frames dropped at the start of a window (late uploads, a first depth-prepass compile)
const FORCE_DOF = process.env.PERF_DOF !== "probe";
const ROUTES = ["Wafer", "Kerfur", "Iskra", "Ci-Clop", "Venovisor", "Wafer Studio", "Split HID Display",
  "ZMK-PointAccel", "ZMK Soft Off Plus", "Sightseeing", "Silent Depth", "Brionel Catalogue", "Bulgaria 2026"];

/* ---------------- in-page instrumentation ---------------- */
const INIT = String.raw`(() => {
  if (window.__perf) return;
  const P = window.__perf = { renderers: [], ctx: [], longtasks: [], events: {}, sampling: false, frame: 0, bokeh: null, pmrem: [], staleRaf: { n: 0, minMs: 0 } };
  /* Chrome hands a rAF callback the frame time of a BeginMainFrame issued BEFORE a long main-thread block, so it can be
     seconds earlier than a performance.now() read just before the request. Loops that seed last = performance.now() then get a
     negative dt, and the hero rig's damp() diverges (scale 1e27, nothing drawn). Recorded always; corrected unless __perfRafRaw. */
  {
    const raf = window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame = (cb) => { const at = performance.now(); return raf((ts) => {
      if (ts < at) { P.staleRaf.n++; P.staleRaf.minMs = Math.min(P.staleRaf.minMs, Math.round(ts - at)); if (!window.__perfRafRaw) ts = at; }
      cb(ts);
    }); };
  }
  for (const C of [window.HTMLCanvasElement, window.OffscreenCanvas]) {
    if (!C) continue;
    const gc = C.prototype.getContext;
    C.prototype.getContext = function (type) {
      const c = gc.apply(this, arguments);
      if (c && /webgl/i.test(type) && !this.__perfCtx) {
        this.__perfCtx = true;
        const rec = { type, at: Math.round(performance.now()), lost: false };
        P.ctx.push(rec);
        if (this.addEventListener) this.addEventListener("webglcontextlost", () => { rec.lost = true; });
      }
      return c;
    };
  }
  try { new PerformanceObserver((l) => { for (const e of l.getEntries()) P.longtasks.push([Math.round(e.startTime), Math.round(e.duration)]); })
    .observe({ type: "longtask", buffered: true }); } catch (_) {}
  for (const ev of ["mo:preloader-done", "mo:first-frame", "mo:universe-ready", "mo:board-ready"])
    addEventListener(ev, () => { P.events[ev] = Math.round(performance.now()); });

  function track(rec, rt) {
    if (rec.allRts.has(rt) || rt.__perfDisposed) return;
    rec.allRts.add(rt);
    if (rt.addEventListener && !rt.__perfL) { rt.__perfL = true; rt.addEventListener("dispose", () => { rt.__perfDisposed = true; for (const x of P.renderers) x.allRts.delete(x === rec ? rt : rt); }); }
  }
  function instrument(r) {
    const fns = (new Error().stack || "").split("\n").slice(3, 9).map((s) => (s.match(/at (?:new )?([\w$.]+) \(/) || [])[1]).filter(Boolean);
    const rec = { id: P.renderers.length, r, created: Math.round(performance.now()), by: fns.join(" < "), renders: 0, depth: 0,
      frames: new Map(), scenes: new Set(), rts: new Set(), coldMs: 0, coldMax: 0, allScenes: new Set(), allRts: new Set() };
    P.renderers.push(rec);
    const render = r.render;
    r.render = function (scene, camera) {
      rec.renders++;
      if (scene && !P.inPmrem) rec.allScenes.add(scene);   // not the PMREM's own room scene
      { const rt0 = this.getRenderTarget(); if (rt0) track(rec, rt0); }
      if (rec.depth > 0) { rec.depth++; try { return render.call(this, scene, camera); } finally { rec.depth--; } }
      if (!P.sampling) {
        rec.depth++; const s0 = performance.now();
        try { return render.call(this, scene, camera); }
        finally { const d = performance.now() - s0; rec.depth--; rec.coldMs += d; if (d > rec.coldMax) rec.coldMax = d; }
      }
      rec.depth++;
      const info = this.info.render, c0 = info.calls, t0 = info.triangles, s = performance.now();
      try { return render.call(this, scene, camera); }
      finally {
        const dt = performance.now() - s;
        rec.depth--;
        const reset = this.info.autoReset;
        let f = rec.frames.get(P.frame);
        if (!f) rec.frames.set(P.frame, f = { ms: 0, n: 0, calls: 0, tris: 0, per: [] });
        const calls = reset ? info.calls : info.calls - c0;
        f.ms += dt; f.n++; f.calls += calls; f.tris += reset ? info.triangles : info.triangles - t0;
        if (f.per.length < 16) f.per.push(calls);
        rec.scenes.add(scene);
      }
    };
    const srt = r.setRenderTarget;
    r.setRenderTarget = function (rt) { if (rt) { track(rec, rt); if (P.sampling) rec.rts.add(rt); } return srt.apply(this, arguments); };
  }
  function patch(v) {
    if (!v || typeof v !== "object" || !v.WebGLRenderer || v.WebGLRenderer.__perf) return v;
    const Base = v.WebGLRenderer;
    const R = class extends Base { constructor(p) { super(p); instrument(this); } };
    R.__perf = true;
    v.WebGLRenderer = R;
    const PG = v.PMREMGenerator && v.PMREMGenerator.prototype;
    if (PG && !PG.__perf) {
      PG.__perf = true;
      const fs = PG.fromScene;
      PG.fromScene = function (scene, sigma) { const s0 = performance.now(); P.inPmrem = (P.inPmrem || 0) + 1; try { return fs.apply(this, arguments); } finally { P.inPmrem--; P.pmrem.push({ ms: Math.round(performance.now() - s0), sigma: sigma || 0, by: ((new Error().stack || "").split("\n")[2] || "").trim().slice(3, 60) }); } };
    }
    if (v.EffectComposer && !v.EffectComposer.__perf) {
      const EC = v.EffectComposer;
      const C = class extends EC { addPass(p) { super.addPass(p); if (p && p.materialDepth) P.bokeh = p; } };
      C.__perf = true;
      v.EffectComposer = C;
    }
    return v;
  }
  let T;
  Object.defineProperty(window, "THREE", { configurable: true, enumerable: true, get() { return T; }, set(v) { T = patch(v); } });

  P.start = () => {
    P.sampling = true; P.frame = 0;
    for (const r of P.renderers) { r.frames.clear(); r.scenes.clear(); r.rts.clear(); r.progAtStart = (r.r.info.programs || []).length; }
    P.sampleStart = performance.now();
    const tick = () => { if (!P.sampling) return; P.frame++; requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  };
  P.progress = () => ({ frame: P.frame, per: P.renderers.map((r) => r.frames.size) });
  P.stop = () => { P.sampling = false; };

  /* ---- byte estimates (GPU side, reachable from what was drawn) ---- */
  const MIP = new Set([1004, 1005, 1007, 1008]);
  function bpp(t) {
    const per = t.type === 1016 ? 2 : t.type === 1015 ? 4 : 1;
    const ch = t.format === 1028 ? 1 : t.format === 1030 ? 2 : 4;
    return per * ch;
  }
  function texBytes(t) {
    const mip = t.generateMipmaps && MIP.has(t.minFilter) ? 4 / 3 : 1;
    if (t.isCompressedTexture) {
      const m = t.mipmaps && t.mipmaps.length ? t.mipmaps : [t.image];
      return m.reduce((s, x) => s + (x && x.data ? x.data.byteLength : 0), 0);
    }
    if (t.isCubeTexture) return (t.image || []).reduce((s, im) => s + (im ? (im.width || 0) * (im.height || 0) * 4 : 0), 0) * mip;
    const im = t.image || {};
    if (t.isDataTexture || t.isData3DTexture || t.isDataArrayTexture) return (im.data ? im.data.byteLength : (im.width || 0) * (im.height || 0) * bpp(t)) * mip;
    if (t.isRenderTargetTexture) return (im.width || 0) * (im.height || 0) * (im.depth || 1) * bpp(t) * mip;
    const w = im.videoWidth || im.naturalWidth || im.width || 0, h = im.videoHeight || im.naturalHeight || im.height || 0;
    return w * h * 4 * mip;
  }
  P.report = (FRAMES, WARM) => {
    const out = [];
    const q = (a, p) => { if (!a.length) return 0; const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p * (s.length - 1) + 0.5))]; };
    const mean = (a) => a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0;
    for (const rec of P.renderers) {
      const r = rec.r, el = r.domElement;
      let attrs = null; try { attrs = r.getContext().getContextAttributes(); } catch (_) {}
      const keys = [...rec.frames.keys()].sort((a, b) => a - b);
      const fr = keys.slice(1, -1).map((k) => rec.frames.get(k)).slice(WARM, WARM + FRAMES);   // drop the partial first and last, then WARM frames
      const ms = fr.map((f) => f.ms);
      const big = fr.reduce((b, f) => (!b || f.n > b.n ? f : b), null);
      const texSeen = new Set(), geoSeen = new Set(), matSeen = new Set(), rtTex = new Set([...rec.allRts].map((t) => t.texture)), top = [];
      let texB = 0, geoB = 0, meshes = 0, points = 0, lines = 0;
      const matTypes = {}, lights = {};
      const addTex = (t) => { if (!t || !t.isTexture || rtTex.has(t)) return; const k = (t.source && t.source.uuid) || t.uuid; if (texSeen.has(k)) return; texSeen.add(k); const b = texBytes(t); texB += b;
        const im = t.image || {}; top.push([b, (t.isCompressedTexture ? "ktx2 " : t.isRenderTargetTexture ? "rt " : t.isCanvasTexture ? "canvas " : t.isDataTexture ? "data " : "") + (t.name || "") + " " + (im.width || "?") + "x" + (im.height || "?")]); };
      const addGeo = (g) => {
        if (!g || geoSeen.has(g.uuid)) return; geoSeen.add(g.uuid);
        const arrs = new Set();
        for (const a of Object.values(g.attributes || {})) arrs.add(a.isInterleavedBufferAttribute ? a.data.array : a.array);
        if (g.index) arrs.add(g.index.array);
        for (const a of arrs) geoB += a ? a.byteLength : 0;
      };
      for (const s of rec.allScenes) {
        if (s.isScene) { addTex(s.background); addTex(s.environment); }
        s.traverseVisible((o) => {
          if (o.isLight) { lights[o.type] = (lights[o.type] || 0) + 1; (lights.list || (lights.list = [])).push(o.type + ":" + (o.name || "") + "<" + (o.parent ? o.parent.type + ":" + (o.parent.name || "") : "-") + (s.isScene ? "" : " [" + s.type + "]")); }
          if (o.isMesh) meshes++; else if (o.isPoints) points++; else if (o.isLine) lines++;
          if (o.geometry) addGeo(o.geometry);
          for (const m of o.material ? [].concat(o.material) : []) {
            if (!m || matSeen.has(m.uuid)) continue; matSeen.add(m.uuid);
            matTypes[m.type] = (matTypes[m.type] || 0) + 1;
            for (const v of Object.values(m)) addTex(v);
            if (m.uniforms) for (const u of Object.values(m.uniforms)) addTex(u && u.value);
          }
        });
      }
      let rtB = 0;
      for (const rt of rec.allRts) rtB += (rt.width * rt.height * bpp(rt.texture) + (rt.depthBuffer ? rt.width * rt.height * 4 : 0)) * (rt.samples > 0 ? rt.samples + 1 : 1);
      const progs = {};
      for (const p of (r.info.programs || [])) { const k = String(p.cacheKey).split(",")[0] || p.name; progs[k] = (progs[k] || 0) + 1; }
      const anc = []; let n = el && el.parentElement;
      while (n && anc.length < 3) { anc.push((n.id ? "#" + n.id : "") + (n.className && typeof n.className === "string" && n.className.trim() ? "." + n.className.trim().split(/\s+/).join(".") : n.tagName.toLowerCase())); n = n.parentElement; }
      out.push({
        id: rec.id, by: rec.by, dom: anc.join(" < "), attached: !!(el && el.isConnected),
        lost: !!(r.getContext() && r.getContext().isContextLost && r.getContext().isContextLost()),
        canvas: el ? [el.width, el.height] : null, dpr: r.getPixelRatio(), aa: attrs ? attrs.antialias : null,
        toneMapping: r.toneMapping, exposure: r.toneMappingExposure, createdAt: rec.created, rendersTotal: rec.renders,
        coldRenderMs: { total: Math.round(rec.coldMs), max: Math.round(rec.coldMax) },
        frames: fr.length,
        cpuMs: { mean: +mean(ms).toFixed(3), median: +q(ms, 0.5).toFixed(3), p95: +q(ms, 0.95).toFixed(3), max: +Math.max(0, ...ms).toFixed(3) },
        rendersPerFrame: +mean(fr.map((f) => f.n)).toFixed(2),
        callsPerFrame: +mean(fr.map((f) => f.calls)).toFixed(1), callsMax: Math.max(0, ...fr.map((f) => f.calls)),
        trisPerFrame: Math.round(mean(fr.map((f) => f.tris))),
        perRenderCalls: big ? big.per : [],
        slowFrames: fr.map((f, i) => [i, +f.ms.toFixed(1), f.n, f.calls, f.per.join('/')]).filter((x) => x[1] > 20),
        programsAddedWhileSampling: (r.info.programs || []).length - (rec.progAtStart || 0),
        info: { programs: (r.info.programs || []).length, geometries: r.info.memory.geometries, textures: r.info.memory.textures },
        programsByType: progs,
        drawn: { meshes, points, lines, materials: matSeen.size, materialTypes: matTypes, lights, textures: texSeen.size,
          texMB: +(texB / 2 ** 20).toFixed(2), geoMB: +(geoB / 2 ** 20).toFixed(2), renderTargets: rec.allRts.size, rtMB: +(rtB / 2 ** 20).toFixed(2),
          topTex: top.sort((a, b) => b[0] - a[0]).slice(0, 8).map(([b, n]) => n + " " + (b / 2 ** 20).toFixed(2) + "MB") },
        fbMB: el ? +((el.width * el.height * 8 * (attrs && attrs.antialias ? 5 : 1)) / 2 ** 20).toFixed(2) : 0,
      });
    }
    const lt = P.longtasks, s0 = P.sampleStart || Infinity;
    const sum = (a) => ({ n: a.length, totalMs: a.reduce((s, x) => s + x[1], 0), maxMs: Math.max(0, ...a.map((x) => x[1])) });
    return {
      renderers: out,
      contexts: { created: P.ctx.length, live: P.ctx.filter((c) => !c.lost).length, list: P.ctx },
      longTasks: { load: sum(lt.filter((x) => x[0] < s0)), sampling: sum(lt.filter((x) => x[0] >= s0)) },
      events: P.events, frames: P.frame, pmrem: P.pmrem, staleRaf: P.staleRaf,
      dof: { bokeh: !!P.bokeh, enabled: P.bokeh ? P.bokeh.enabled : null, probeFps: window.__mo_dofFps ?? null, dofOn: window.__mo_dofOn ?? null },
      scrollY: Math.round(scrollY),
    };
  };
})();`;

/* ---------------- network, per page, from CDP ---------------- */
const gzCache = new Map();
function localBytes(url) {
  const u = new URL(url), b = new URL(BASE);
  if (u.origin !== b.origin) return null;
  let p = decodeURIComponent(u.pathname);
  if (p.endsWith("/")) p += "index.html";
  const f = path.join(ROOT, p);
  if (gzCache.has(f)) return gzCache.get(f);
  let v = null;
  try { const buf = fs.readFileSync(f); v = { raw: buf.length, gz: zlib.gzipSync(buf, { level: 6 }).length }; } catch (_) {}
  gzCache.set(f, v);
  return v;
}
const kindOf = (url, type) =>
  /\.glb(\?|$)/i.test(url) ? "glb"
  : /KTX2Loader|ktx-parse|basis_transcoder|\.ktx2(\?|$)/i.test(url) ? "ktx2"
  : type === "Script" || /\.(m?js|jsx)(\?|$)/i.test(url) ? "js" : "other";

async function attachNet(cdp) {
  const reqs = new Map();
  cdp.on("Network.requestWillBeSent", (e) => {
    if (/^(data|blob|chrome-extension):/.test(e.request.url)) return;
    if (!reqs.has(e.requestId)) reqs.set(e.requestId, { url: e.request.url, type: e.type, t: Date.now(), done: false, bytes: 0, cache: "" });
  });
  cdp.on("Network.responseReceived", (e) => {
    const r = reqs.get(e.requestId); if (!r) return;
    r.status = e.response.status; r.type = e.type || r.type;
    if (e.response.fromDiskCache) r.cache = "disk";
    if (e.response.fromPrefetchCache) r.cache = "prefetch";
  });
  cdp.on("Network.requestServedFromCache", (e) => { const r = reqs.get(e.requestId); if (r) r.cache = "memory"; });
  cdp.on("Network.loadingFinished", (e) => { const r = reqs.get(e.requestId); if (r) { r.done = true; r.bytes = e.encodedDataLength; r.tEnd = Date.now(); } });
  cdp.on("Network.loadingFailed", (e) => { const r = reqs.get(e.requestId); if (r) { r.done = true; r.failed = e.errorText; r.tEnd = Date.now(); } });
  await cdp.send("Network.enable");
  return { reqs, mark: 0 };
}
function summarizeNet(list) {
  const by = {};
  for (const r of list) {
    const k = kindOf(r.url, r.type);
    const s = by[k] || (by[k] = { n: 0, bytes: 0, wire: 0, cached: 0, failed: 0 });
    s.n++; s.bytes += r.bytes || 0;
    if (r.cache) s.cached++;
    if (r.failed) s.failed++;
    const loc = !r.cache && !r.failed ? localBytes(r.url) : null;
    s.wire += loc ? loc.gz : r.cache || r.failed ? 0 : r.bytes || 0;   // same-origin: gzip -6 (what Pages sends); CDN: as transferred
  }
  // the local server sends no cache headers, so a prefetched URL can be fetched twice; Pages serves the second from the prefetch cache
  const seen = new Set();
  for (const r of list) {
    const u = r.url.split("#")[0];
    if (seen.has(u) || r.failed) continue; seen.add(u);
    const s = by[kindOf(r.url, r.type)], loc = localBytes(r.url);
    s.uniqN = (s.uniqN || 0) + 1; s.uniqWire = (s.uniqWire || 0) + (loc ? loc.gz : r.bytes || 0);
  }
  const tot = Object.values(by).reduce((a, s) => ({ n: a.n + s.n, bytes: a.bytes + s.bytes, wire: a.wire + s.wire, uniqN: a.uniqN + (s.uniqN || 0), uniqWire: a.uniqWire + (s.uniqWire || 0) }), { n: 0, bytes: 0, wire: 0, uniqN: 0, uniqWire: 0 });
  const glbs = list.filter((r) => kindOf(r.url, r.type) === "glb").map((r) => decodeURIComponent(new URL(r.url).pathname.split("/").pop()) + (r.cache ? "(" + r.cache + ")" : ""));
  const ktx = list.filter((r) => kindOf(r.url, r.type) === "ktx2").map((r) => new URL(r.url).pathname.split("/").pop());
  const failedUrls = list.filter((r) => r.failed).map((r) => r.url.split("?")[0] + " (" + r.failed + ")");
  return { byKind: by, total: tot, failedUrls, glbFiles: glbs.length > 12 ? [...glbs.slice(0, 6), `… ${glbs.length - 6} more`] : glbs, ktx2Files: ktx };
}

/* ---------------- waiting ---------------- */
async function settle(page, net, { min = 3000, quiet = 3000, max = 150000, until } = {}) {
  const t0 = Date.now(); let lastSig = "", lastChange = Date.now();
  while (Date.now() - t0 < max) {
    await page.waitForTimeout(500);
    const sig = await page.evaluate((force) => (force && window.__perf.bokeh ? (window.__perf.bokeh.enabled = true) : 0, "") + JSON.stringify(window.__perf.renderers.map((x) => { const i = x.r.info; return [(i.programs || []).length, i.memory.geometries, i.memory.textures]; })) + "|" + window.__perf.ctx.length, FORCE_DOF);
    if (sig !== lastSig) { lastSig = sig; lastChange = Date.now(); }
    const now = Date.now(), all = [...net.reqs.values()];
    const pending = all.filter((r) => !r.done && r.type !== "Media" && now - r.t < 30000).length;
    const lastNet = Math.max(0, ...all.map((r) => r.tEnd || r.t));
    if (now - t0 > min && pending === 0 && now - lastNet > quiet && now - lastChange > quiet && (!until || (await until())))
      return { settleMs: now - t0, timedOut: false };
  }
  return { settleMs: Date.now() - t0, timedOut: true };
}
const glbDone = (net) => new Set([...net.reqs.values()].filter((r) => r.done && !r.failed && /\.glb(\?|$)/i.test(r.url)).map((r) => r.url.split("?")[0])).size;

async function sample(page, { maxMs = 150000, during } = {}) {
  await page.evaluate(() => window.__perf.start());
  const t0 = Date.now();
  while (Date.now() - t0 < maxMs) {
    if (during) await during(); else await page.waitForTimeout(400);
    const p = await page.evaluate((force) => { if (force && window.__perf.bokeh) window.__perf.bokeh.enabled = true; return window.__perf.progress(); }, FORCE_DOF);
    const active = p.per.filter((n) => n >= 3);
    if (p.frame > FRAMES + WARM + 2 && active.length && active.every((n) => n >= FRAMES + WARM + 2)) break;
    if (p.frame > (FRAMES + WARM) * 4) break;
  }
  await page.evaluate(() => window.__perf.stop());
  return Date.now() - t0;
}

async function measure(page, cdp, net, name, extra = {}) {
  const sampleMs = await sample(page, extra);
  const m0 = Object.fromEntries((await cdp.send("Performance.getMetrics")).metrics.map((x) => [x.name, x.value]));
  const rep = await page.evaluate(([F, W]) => window.__perf.report(F, W), [FRAMES, WARM]);
  await cdp.send("HeapProfiler.collectGarbage");
  const m = Object.fromEntries((await cdp.send("Performance.getMetrics")).metrics.map((x) => [x.name, x.value]));
  const all = [...net.reqs.values()];
  const delta = all.slice(net.mark);
  net.mark = all.length;
  return {
    state: name, url: page.url(), sampleMs,
    network: { cumulative: summarizeNet(all), delta: summarizeNet(delta) },
    heapMB: +(m.JSHeapUsedSize / 2 ** 20).toFixed(1), heapPreGcMB: +(m0.JSHeapUsedSize / 2 ** 20).toFixed(1),
    domNodes: m.Nodes, ...rep, ...extra.meta,
  };
}

/* ---------------- scenarios ---------------- */
async function openPage(browser, url) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  await ctx.addInitScript((process.env.PERF_RAF_RAW ? "window.__perfRafRaw = true;" : "") + INIT);
  const page = await ctx.newPage();
  page.on("pageerror", (e) => console.warn("  [pageerror]", String(e).slice(0, 200)));
  const cdp = await ctx.newCDPSession(page);
  const net = await attachNet(cdp);
  await cdp.send("Performance.enable");
  await page.goto(url, { waitUntil: "load", timeout: 90000 });
  return { ctx, page, cdp, net };
}

async function landing(browser, want, results) {
  const { ctx, page, cdp, net } = await openPage(browser, BASE + "index.html");
  const st = await settle(page, net, { min: 6000, max: 180000,
    until: async () => (await page.evaluate(() => !!window.__perf.events["mo:preloader-done"])) && glbDone(net) >= 10 });
  if (want("landing-title")) {
    results.push(await measure(page, cdp, net, "landing-title", { meta: { settle: st } }));
    log(results.at(-1));
  }
  if (want("landing-board")) {
    if (!want("landing-title")) net.mark = net.reqs.size;
    await page.evaluate(() => {
      const el = document.getElementById("about"), S = window.MOBoard.STOPS, N = S.length;
      const LEAD_V = 2.4, FLIGHT_V = N + 1, FOOT_V = 1.4, TOT = LEAD_V + FLIGHT_V + FOOT_V;
      const i = Math.max(0, S.findIndex((s) => s.explode)), pad = 0.5 / FLIGHT_V;
      const raw = LEAD_V / TOT + (pad + (S[i].p / 10) * (1 - pad)) * (FLIGHT_V / TOT);
      window.scrollTo({ top: el.offsetTop + raw * (el.offsetHeight - innerHeight), behavior: "instant" });
    });
    const st2 = await settle(page, net, { min: 5000, max: 180000,
      until: async () => (await page.evaluate(() => !!window.__perf.events["mo:board-ready"])) });   // no GLB count: the port dropped the 53 part GLBs, settle() still waits for a quiet network
    results.push(await measure(page, cdp, net, "landing-board", { meta: { settle: st2 } }));
    log(results.at(-1));
  }
  await ctx.close();
}

async function route(browser, name, want, results) {
  const { ctx, page, cdp, net } = await openPage(browser, BASE + encodeURIComponent(name + ".html"));
  const st = await settle(page, net, { min: 4000, max: 120000,
    until: () => page.evaluate(() => !window.__pageRig || window.__pageRig.ready) });
  if (want("route:" + name)) { results.push(await measure(page, cdp, net, "route:" + name, { meta: { settle: st } })); log(results.at(-1)); }
  if (name === "Iskra" && want("iskra-menu")) {
    net.mark = net.reqs.size;
    await page.click(".lp-menuToggle");
    const st2 = await settle(page, net, { min: 3000, max: 120000,
      until: async () => (await page.evaluate(() => !!document.querySelector("dialog.lp-menu[open]"))) && glbDone(net) >= 4 });
    const links = await page.$$("dialog.lp-menu[open] .lp-menu__links a");
    let k = 0;
    const during = async () => {   // the menu draws only while something moves: sweep the pointer across its rows
      const b = await links[k++ % links.length].boundingBox();
      if (b) for (let j = 0; j < 4; j++) await page.mouse.move(b.x + b.width * (0.3 + 0.1 * j), b.y + b.height / 2, { steps: 3 });
    };
    results.push(await measure(page, cdp, net, "iskra-menu", { during: links.length ? during : null, meta: { settle: st2 } }));
    log(results.at(-1));
  }
  await ctx.close();
}

/* ---------------- tables ---------------- */
const kb = (b) => (b / 1024).toFixed(0);
function table(s) {
  const L = [];
  const d = s.network.delta, c = s.network.cumulative;
  L.push(`### ${s.state}${s.settle && s.settle.timedOut ? "  (settle timed out)" : ""}`);
  const kinds = ["glb", "ktx2", "js", "other"];
  const nk = (n) => kinds.map((k) => { const x = n.byKind[k] || { uniqN: 0, uniqWire: 0 }; return `${k} ${x.uniqN || 0}/${kb(x.uniqWire || 0)}K`; }).join(" · ");
  L.push(`net, unique URLs (req/wire gz), cumulative: ${nk(c)} · total ${c.total.uniqN} req ${kb(c.total.uniqWire)}K${c.total.n !== c.total.uniqN ? ` (local server re-fetched ${c.total.n - c.total.uniqN})` : ""}`);
  if (s.state === "landing-board" || s.state === "iskra-menu") L.push(`net delta (this state only): ${nk(d)} · total ${d.total.uniqN} req ${kb(d.total.uniqWire)}K`);
  if (d.glbFiles.length) L.push(`glb: ${d.glbFiles.join(", ")}${d.ktx2Files.length ? "  ktx2: " + d.ktx2Files.join(", ") : ""}`);
  L.push(`contexts: ${s.contexts.created} created, ${s.contexts.live} live · heap ${s.heapMB} MB · long tasks load ${s.longTasks.load.n} (${s.longTasks.load.totalMs} ms, max ${s.longTasks.load.maxMs}) · sampling ${s.longTasks.sampling.n} (${s.longTasks.sampling.totalMs} ms)${s.dof.bokeh ? ` · DoF probe ${s.dof.probeFps} fps, bokeh ${s.dof.enabled ? "on" : "off"}` : ""}${s.pmrem && s.pmrem.length ? ` · PMREM ${s.pmrem.map((x) => x.ms + "ms").join("+")}` : ""}${s.staleRaf && s.staleRaf.n ? ` · stale rAF ${s.staleRaf.n}× (min ${s.staleRaf.minMs} ms)` : ""}`);
  L.push("| # | renderer (by / dom) | canvas | frames | cold max ms | render ms med/mean/p95 | renders/f | calls/f | tris/f | programs | geoms | texs | tex MB | geo MB | RT MB |");
  L.push("|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|");
  for (const r of s.renderers) {
    const who = (r.by.split(" < ")[0] || "?") + (r.dom ? " / " + r.dom.split(" < ")[0] : "") + (r.lost ? " (lost)" : r.attached ? "" : " (detached)");
    L.push(`| ${r.id} | ${who} | ${r.canvas ? r.canvas.join("x") : "-"}${r.aa ? " aa" : ""} | ${r.frames} | ${r.coldRenderMs ? r.coldRenderMs.max : "-"} | ${r.cpuMs.median}/${r.cpuMs.mean}/${r.cpuMs.p95} | ${r.rendersPerFrame} | ${r.callsPerFrame} | ${r.trisPerFrame} | ${r.info.programs} | ${r.info.geometries} | ${r.info.textures} | ${r.drawn.texMB} | ${r.drawn.geoMB} | ${r.drawn.rtMB} |`);
  }
  return L.join("\n");
}
function log(s) { console.log(table(s) + "\n"); }

/* ---------------- main ---------------- */
async function main() {
  const args = process.argv.slice(2);
  if (args[0] === "--print") { for (const s of JSON.parse(fs.readFileSync(args[1], "utf8")).states) log(s); return; }
  const [out, filt] = args;
  if (!out) { console.error("usage: node perf.cjs <out.json> [stateFilter] | --print <file.json>"); process.exit(2); }
  const re = filt ? new RegExp(filt, "i") : null;
  const want = (id) => !re || re.test(id);
  const { chromium } = require("/home/oleksandr/.npm/_npx/31e32ef8478fbf80/node_modules/playwright");
  const browser = await chromium.launch({ executablePath: "/usr/bin/google-chrome",
    args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
  const results = [];
  const meta = { at: new Date().toISOString(), base: BASE, frames: FRAMES, warm: WARM, forceDof: FORCE_DOF, viewport: "1440x900@1",
    browser: browser.version(), gpu: "SwiftShader (render ms is JS-side CPU of renderer.render, not GPU time)" };
  try {
    if (want("landing-title") || want("landing-board")) await landing(browser, want, results);
    for (const r of ROUTES) if (want("route:" + r) || (r === "Iskra" && want("iskra-menu"))) await route(browser, r, want, results);
  } finally {
    fs.writeFileSync(out, JSON.stringify({ meta, states: results }, null, 1));
    await browser.close();
  }
  console.log(`wrote ${out} (${results.length} states)`);
}
main().catch((e) => { console.error(e); process.exit(1); });
