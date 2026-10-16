/* ============================================================
   MATERIALS — the lab gallery
   ------------------------------------------------------------
   Lab surface (excluded from deploy). Where a model's look is judged
   before it ships, rendered by the site's own studio
   (app/projects/rendering/studio.js, imported as a file, no copy):
   finish() for the materials, the tone inside each one, and the
   site's dress per tier.

     RIG    a project hero: solid-hero-rig.jsx's camera (fov 38, z 5.4),
            arrival pose (yaw -0.52, pitch 0.16), registry fit and pose;
            ROOM at 256 and lights().
     FIELD  a Universe card: universe.jsx's 3 x 4 plane about 13 u out,
            the model 1.4 u in front of it at 0.85, fit = cardPose * 1.9;
            FIELD_ROOM at 128 and FIELD_AMBIENT.
     MACRO  a close rig shot of one node, where the print shows.

   ONE WebGL context for the page. Each panel is rendered into a corner
   of one canvas and copied (drawImage) into the panel's own 2D canvas,
   so scrolling costs nothing and a panel is only drawn when it is
   visible and dirty. The page sleeps when nothing is: the turntable is
   the only thing that keeps frames coming, and only while it is on.
   ============================================================ */
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import * as S from "../app/projects/rendering/studio.js";

/* ---------------- the models ---------------- */

/* src and framing come from the registry, as the site reads them (universe.jsx: card fit = cardPose.fit * 1.9). */
const REG = Object.fromEntries((window.MO_PROJECTS || []).map((p) => [p.slug, p.model || {}]));
const ENTRY = (id, slug, name, addr, note, extra) => {
  const m = REG[slug] || {}, c = m.cardPose || {};
  return { id, slug, name, addr, note, src: m.src, rig: { fit: m.rigFit || 4.0, pose: m.rigPose || { x: -0.92, y: 0, z: 0 } }, card: { fit: c.fit ? c.fit * 1.9 : 5.0, pose: c.pose || null }, ...extra };
};
const ENTRIES = [
  ENTRY("wafer", "wafer", "Wafer", "0x01", "models/wafer.glb: the 53 parts merged by tools/wafer/build.mjs, with the study's materials and the two panels drawn once. No accumulation."),
  ENTRY("iskra", "iskra", "Iskra", "0x03", "enamel-yellow, enamel-blue: enamel preset, sealed colours kept."),
  ENTRY("ci-clop", "ci-clop", "Ci-Clop", "0x04", "Known gaps: no trident (the export has none; the photographed unit has it embossed on the big face), and which face is the front and which LED is red are assumptions (ciclop-build.mjs --swap-leds flips them). The assembled export, hollowed (one mesh, 4 primitives): olive PLA with 0.2 mm layer lines from _PRINTZ, two LED domes at the front (red, white) with a halo. led=off|subtle|on.",
    { leds: true, macro: { node: "ci-clop-shell", at: [0, -0.0021, 0.0155], normal: [0, 0, 1], up: [0, 1, 0], tilt: 0.25, dist: 3.2 } }),   // the front face, both LEDs (dist is in fitted world units: the model is scaled ~100x)
  ENTRY("wafer-studio", "wafer-studio", "Wafer Studio", "0x06", "iridescent-chrome: chromeThinFilm."),
  ENTRY("split-hid", "zmk-split-hid", "Split HID Display", "0x07", "lit-pixels: reflective silver pixels under glass, not an emissive. module-body: matte black."),
  ENTRY("zmk-pointaccel", "zmk-pointaccel", "ZMK PointAccel", "0x08", "gradient-plate, white-relief: enamel preset; the plate's gradient map is kept."),
  ENTRY("soft-off", "zmk-soft-off-plus", "ZMK Soft Off Plus", "0x09", "dry PBT cap; the legend shines through from below and bleeds into the cap around it."),
  ENTRY("sightseeing", "sightseeing-inc", "Sightseeing.inc", "0x0A", "enamel-navy, enamel-blue, handle-metal."),
  ENTRY("silent-depth", "silent-depth", "Silent Depth", "0x0B", "brushed-pearl: brushedPearl. universe: false, so no field tile on the site; shown here for the preset."),
  ENTRY("brionel", "brionel-catalogue", "Brionel Catalogue", "0x0C", "anodised-green: anodisedGreen."),
  ENTRY("bulgaria", "bulgaria-2026", "Bulgaria 2026", "0x0D", "tile-navy: matteBlack in the sealed #0a1724. The sealed tile is metalness 0.7; the name table's enamel row makes it a dielectric, and a dark dielectric in the void room is grey glass. glyph-pearl: enamel. accent-blue: emissive."),
  ENTRY("venovisor", "venovisor", "Venovisor", "0x05", "Monofilament ELASTAN D70 (hard TPU), printed at 0.20 mm: satin olive with layer lines along each part's print axis. Red LEDs at led-0..7, and a soft red glow in the C. One merged, internals-free mesh.",
    // a close shot of a wall of the C-head, from outside and a little above the face: the print axis (case-local Z) is the image's vertical, so the layers stack up the frame
    { macro: { node: "body", at: [-0.0186, -0.05657, -0.0014], normal: [-0.94, -0.34, 0], tilt: 0.4, dist: 0.8 } }),
];
for (const e of ENTRIES) e.kind = S.look(e.src).kind;

/* ---------------- state, from the URL ---------------- */

const Q = new URLSearchParams(location.search);
const pick = (k, ok, d) => (ok.includes(Q.get(k)) ? Q.get(k) : d);
const state = {
  model: ENTRIES.some((e) => e.id === Q.get("model")) ? Q.get("model") : "all",
  tier: pick("tier", ["rig", "field", "macro", "both"], "both"),
  grid: Q.has("grid"), spin: Q.has("spin"),
  led: pick("led", ["off", "subtle", "on"], "subtle"),   // Ci-Clop's LED glow, the site's default
};
const AA = Q.get("aa") !== "0";
/* The site's field turns on at 0.15 rad/s, so no yaw is "the" look. Head-on is how a card is read, and it is where the thin-film chrome is
   at its most legible (at 0.4 rad it is a dark plate, at -0.8 pale green): yaw=<rad> shows another. */
const FIELD_YAW = Q.get("yaw") != null ? +Q.get("yaw") : 0;
const DPR = Math.min(+Q.get("dpr") || window.devicePixelRatio || 1, 2);

/* panel sizes, in CSS px. The field panel is the 3 x 4 card plus a margin, so a model that overflows its card shows it. */
const SIZE = { rig: [560, 420], field: [400, 360], macro: [420, 420] };
const tierDpr = (tier) => Math.min(DPR, tier === "field" ? 1.5 : 2);   // universe.jsx: setPixelRatio(min(dpr, 1.5))
const pxSize = (tier) => SIZE[tier].map((v) => Math.round(v * tierDpr(tier)));

const RIG = { fov: 38, camZ: 5.4, yaw: -0.52, pitch: 0.16 };   // solid-hero-rig.jsx RIG
const FIELD = { dist: 13, lift: 1.4, scale: 0.85, w: 3, h: 4 };  // universe.jsx
const BG = "#04060d";                                          // --void

const $ = (s, r = document) => r.querySelector(s);
const statusEl = $("#status");
const say = (t, busy = false) => { statusEl.textContent = t; statusEl.dataset.busy = busy ? "1" : "0"; };

/* ---------------- the one renderer ---------------- */

const [GW, GH] = [0, 1].map((i) => Math.max(...Object.keys(SIZE).map((t) => pxSize(t)[i])));
const renderer = new THREE.WebGLRenderer({ antialias: AA, powerPreference: "high-performance" });
renderer.setPixelRatio(1);
renderer.setSize(GW, GH, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NoToneMapping;   // Neutral is inside every model material, as on the site
renderer.setScissorTest(true);
renderer.setClearColor(new THREE.Color(BG), 1);
const gl = renderer.getContext();

const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
const sources = new Map();
const ctx = {
  THREE, renderer, loader,
  source(url) {
    if (!sources.has(url)) sources.set(url, loader.loadAsync(url).then((g) => g.scene));
    return sources.get(url);
  },
};

/* Context warm-up: the first program on a page pays for the driver and the first lit draw pays for its uniforms, not the model. One throwaway
   lit scene, awaited before anything is built or timed, so whichever model is measured first is not charged for the context. */
const warm = (async () => {
  const w = new THREE.Scene(), cam = new THREE.PerspectiveCamera();
  w.add(new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshPhysicalMaterial()), new THREE.DirectionalLight(0xffffff, 1));
  cam.position.z = 3;
  await renderer.compileAsync(w, cam);
  renderer.render(w, cam);
  gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4));
})();

/* The site's two rooms, rendered once each and kept for the page. */
const envCache = {};
const env = (k) => (envCache[k] || (envCache[k] = k === "field" ? S.studioEnvironment(THREE, renderer, S.FIELD_ROOM, 128) : S.studioEnvironment(THREE, renderer, S.ROOM, 256))).texture;

/* ---------------- one scene: a model and a tier ---------------- */

const seenPrograms = new Set();
const programsOf = (scene) => {
  const keys = new Set();
  scene.traverse((o) => {
    if (!o.material) return;
    for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
      const p = renderer.properties.get(m).currentProgram;
      if (p) keys.add(p.cacheKey);
    }
  });
  return keys;
};

/* The site's dress per tier: a hero is the room plus the rig's light set, a card the field room plus one ambient. */
function dress(scene, tier, entry) {
  if (tier === "field") {
    scene.environment = env("field");
    scene.add(new THREE.AmbientLight(0xffffff, S.FIELD_AMBIENT));
  } else {
    scene.environment = env("rig");
    S.lights(THREE, scene).set(S.look(entry.src));
  }
}

/* A fresh clone, finished exactly as the site finishes it. done.materials is what this build owns. */
async function makeRoot(entry, tier) {
  if (entry.leds) S.LOOKS["models/ci-clop-mark.glb"].led = state.led;
  const root = (await ctx.source(entry.src)).clone(true);
  const done = S.finish(THREE, root, entry.src, { tier: tier === "field" ? "field" : "rig" });
  if (tier === "field") for (const m of done.materials) m.transparent = true;   // cards fade with distance: universe.jsx makes every model material transparent
  return { root, done };
}

const builds = new Map();
const bkey = (e, tier) => `${e.id}|${tier}${e.leds ? "|" + state.led : ""}`;   // the LED mode is baked into a Ci-Clop build
let loading = 0;
function build(entry, tier) {
  const key = bkey(entry, tier);
  if (builds.has(key)) return builds.get(key);
  loading++;
  const p = (async () => {
    await warm;
    const { root, done } = await makeRoot(entry, tier);
    const [w, h] = SIZE[tier], scene = new THREE.Scene();
    dress(scene, tier, entry);
    let camera, turn, focus = null;
    if (tier === "field") {
      const D = FIELD.dist, pxPerU = 200 / FIELD.w;   // the card is ~200 px wide
      camera = new THREE.PerspectiveCamera(2 * Math.atan(h / pxPerU / 2 / D) * 180 / Math.PI, w / h, 0.3, 200);
      const tile = new THREE.Mesh(new THREE.PlaneGeometry(FIELD.w, FIELD.h), new THREE.MeshBasicMaterial({ color: new THREE.Color("#0d1018"), toneMapped: false }));
      tile.position.z = -D;
      tile.userData.tile = true;
      const holder = new THREE.Group(), pose = new THREE.Group();
      holder.position.set(0, 0, -D + FIELD.lift);
      holder.scale.setScalar(FIELD.scale);
      holder.rotation.y = FIELD_YAW;
      const cd = entry.card;
      if (cd.pose) pose.rotation.set(cd.pose.x || 0, cd.pose.y || 0, cd.pose.z || 0);
      S.fit(THREE, root, cd.fit);
      pose.add(root); holder.add(pose);
      scene.add(tile, holder);
      turn = (a) => { holder.rotation.y = FIELD_YAW + a; };
    } else {
      camera = new THREE.PerspectiveCamera(RIG.fov, w / h, 0.05, 100);
      camera.position.set(0, 0, RIG.camZ);
      const spin = new THREE.Group(), holder = new THREE.Group(), p = entry.rig.pose;
      holder.rotation.set(p.x || 0, p.y || 0, p.z || 0);
      spin.rotation.x = RIG.pitch;
      S.fit(THREE, root, entry.rig.fit);
      holder.add(root); spin.add(holder); scene.add(spin);
      turn = (a) => { spin.rotation.y = RIG.yaw + a; };
      if (tier === "macro") {
        // a close shot: the camera is placed from a node of the model every frame (see draw), so a few pixels of each 0.2 mm layer show
        focus = root.getObjectByName(entry.macro.node);
        camera.near = 0.02;
        camera.updateProjectionMatrix();
      }
    }
    turn(0);
    scene.updateMatrixWorld(true);
    const b = { entry, tier, scene, camera, turn, focus, materials: done.materials, w, h };
    // compile first (cold programs show up here), so a panel's first frame is not the compile
    const c0 = performance.now();
    await renderer.compileAsync(scene, camera);
    b.compileMs = performance.now() - c0;
    // the first frame is where the link, the uploads and the first draw actually land when the browser has no parallel compile
    const [pw, ph] = pxSize(tier), f0 = performance.now(), px = new Uint8Array(4);
    renderer.setViewport(0, 0, pw, ph); renderer.setScissor(0, 0, pw, ph);
    renderer.render(scene, camera);
    gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
    b.firstMs = performance.now() - f0;
    b.programs = programsOf(scene);
    b.freshPrograms = [...b.programs].filter((k) => !seenPrograms.has(k)).length;
    b.programs.forEach((k) => seenPrograms.add(k));
    let tris = 0;
    scene.traverse((o) => {
      if (!o.isMesh || !o.visible || o.userData.tile) return;
      const g = o.geometry;
      tris += (g.index ? g.index.count : g.attributes.position.count) / 3;
    });
    b.triangles = Math.round(tris);
    return b;
  })();
  p.then(() => { loading--; schedule(); }, (e) => { loading--; console.error("[materials] build failed", key, e); schedule(); });
  builds.set(key, p);
  return p;
}

/* Draw one scene into a 2D context. The corner of the one canvas is the scratch. */
function draw(b, g2, angle = 0) {
  const [pw, ph] = pxSize(b.tier);
  renderer.setViewport(0, 0, pw, ph);
  renderer.setScissor(0, 0, pw, ph);
  b.turn(angle);
  if (b.focus) {
    const m = b.entry.macro, n = b.focus;
    b.scene.updateMatrixWorld(true);
    const f = n.localToWorld(new THREE.Vector3(...m.at)), dir = (v) => new THREE.Vector3(...v).transformDirection(n.matrixWorld);
    const out = dir(m.normal), up = dir(m.up || [0, 0, 1]);
    b.camera.up.copy(up);
    b.camera.position.copy(f).addScaledVector(out, Math.cos(m.tilt) * m.dist).addScaledVector(up, Math.sin(m.tilt) * m.dist);
    b.camera.lookAt(f);
  }
  renderer.clear();
  renderer.render(b.scene, b.camera);
  g2.drawImage(renderer.domElement, 0, GH - ph, pw, ph, 0, 0, pw, ph);
}

/* ---------------- panels ---------------- */

const panels = [];
const visible = new Set();
const io = new IntersectionObserver((es) => {
  for (const e of es) {
    const p = e.target.__panel;
    if (e.isIntersecting) { visible.add(p); p.dirty = true; } else visible.delete(p);
  }
  schedule();
}, { rootMargin: "240px 0px" });

const label = (p) => `${p.tier} · ${p.entry.kind}`;

function makePanel(entry, tier) {
  const fig = document.createElement("figure"), cv = document.createElement("canvas"), cap = document.createElement("figcaption");
  const [pw, ph] = pxSize(tier);
  cv.width = pw; cv.height = ph;
  cv.style.aspectRatio = `${SIZE[tier][0]} / ${SIZE[tier][1]}`;   // the canvas keeps its pixels; the panel shrinks to fit a row of three
  fig.style.maxWidth = SIZE[tier][0] + "px";
  cv.setAttribute("role", "img");
  fig.dataset.tier = tier; fig.dataset.model = entry.id; fig.dataset.state = "pending";
  fig.append(cv, cap);
  const p = { entry, tier, fig, cv, g2: cv.getContext("2d"), cap, dirty: true, auto: false };
  fig.__panel = p;
  head(p);
  panels.push(p);
  io.observe(fig);
  return p;
}
function head(p) {
  p.cap.innerHTML = `<b>${label(p).replace(/ · /g, "</b><span>·</span><b>")}</b>`;
  p.cv.setAttribute("aria-label", `${p.entry.name}, ${label(p)}`);
}

/* ---------------- the frame loop: sleeps unless something is dirty ---------------- */

let raf = 0, angle = 0, last = 0;
function schedule() { if (!raf) raf = requestAnimationFrame(pump); }
async function pump(now) {
  raf = 0;
  if (state.spin) { angle += Math.min(50, now - last) * 0.0006; last = now; for (const p of visible) p.dirty = true; } else last = now;
  const t0 = performance.now();
  for (const p of visible) {
    if (!p.dirty) continue;
    const key = bkey(p.entry, p.tier);
    const pending = builds.get(key);
    if (!pending) { build(p.entry, p.tier); continue; }
    let b = null;
    try { b = await Promise.race([pending, Promise.resolve(null)]); }
    catch { p.dirty = false; p.fig.dataset.state = "error"; p.cap.textContent = `${p.entry.name}: could not build (see console)`; continue; }
    if (!b) continue;
    p.dirty = false;
    draw(b, p.g2, angle);
    p.fig.dataset.state = "ready";
    if (performance.now() - t0 > 40) break;   // a software rasteriser: a few panels a frame, never a frozen page
  }
  const busy = [...visible].some((p) => p.dirty) || loading > 0;
  say(busy ? `${loading ? "building " + loading + " · " : ""}drawing…` : state.spin ? "turntable" : `idle · ${seenPrograms.size} programs · ${renderer.info.memory.geometries} geometries`, busy);
  if (busy || state.spin) schedule();
}

/* ---------------- layout ---------------- */

const main = $("#main");
const tiersOf = (e) => (state.tier === "both" ? ["rig", "field", ...(e.macro ? ["macro"] : [])] : state.tier === "macro" && !e.macro ? [] : [state.tier]);

function layout() {
  visible.clear(); panels.length = 0; io.disconnect();
  main.replaceChildren();
  document.body.classList.toggle("grid", state.grid);
  for (const e of ENTRIES.filter((x) => state.model === "all" || x.id === state.model)) {
    const sec = document.createElement("section"), meta = document.createElement("div"), box = document.createElement("div");
    sec.className = "model"; sec.id = e.id; meta.className = "meta"; box.className = "panels";
    meta.innerHTML = `<div class="addr">${e.addr} · ${e.kind}</div><h2>${e.name}</h2><p>${e.note}</p>
      <div class="acts"><button type="button" class="act" data-measure="${e.id}">measure</button></div>`;
    const perf = document.createElement("div");
    perf.className = "perf-slot"; perf.dataset.slot = e.id;
    for (const t of tiersOf(e)) {
      const row = document.createElement("div");
      row.className = "row";
      row.append(makePanel(e, t).fig);
      box.append(row);
    }
    sec.append(meta, box, perf);
    main.append(sec);
    if (perfResults.has(e.id)) showPerf(e.id);
  }
  schedule();
}

function sync() {
  const q = new URLSearchParams();
  if (state.model !== "all") q.set("model", state.model);
  if (state.tier !== "both") q.set("tier", state.tier);
  if (state.grid) q.set("grid", "");
  if (state.led !== "subtle") q.set("led", state.led);
  if (state.spin) q.set("spin", "");
  for (const k of ["aa", "yaw", "dpr"]) if (Q.has(k)) q.set(k, Q.get(k));
  history.replaceState(null, "", location.pathname + (q.size ? "?" + q.toString().replace(/=(&|$)/g, "$1") : ""));
  for (const seg of document.querySelectorAll(".seg")) {
    const k = seg.dataset.key, cur = state[k];
    for (const b of seg.querySelectorAll("button")) b.setAttribute("aria-pressed", String(b.dataset.v === cur));
  }
  $("#spin").setAttribute("aria-pressed", String(state.spin));
  $("#grid").setAttribute("aria-pressed", String(state.grid));
}

for (const seg of document.querySelectorAll(".seg")) {
  seg.addEventListener("click", (ev) => {
    const b = ev.target.closest("button");
    if (!b || b.disabled) return;
    const k = seg.dataset.key;
    state[k] = b.dataset.v;
    if (k === "led") for (const [key, v] of [...builds]) if (key.startsWith("ci-clop|")) { builds.delete(key); v.then(release); }   // the mode is baked into the build: free the old one
    sync();
    layout();
  });
}
$("#spin").addEventListener("click", () => { state.spin = !state.spin; if (!state.spin) for (const p of panels) p.dirty = true; sync(); schedule(); });
$("#grid").addEventListener("click", () => { state.grid = !state.grid; sync(); layout(); });
const sel = $("#model");
sel.innerHTML = `<option value="all">all models</option>` + ENTRIES.map((e) => `<option value="${e.id}">${e.addr} ${e.name}</option>`).join("");
sel.addEventListener("change", () => { state.model = sel.value; sync(); layout(); });

/* ---------------- perf ---------------- */

const perfResults = new Map();
const kb = (n) => (n >= 1e6 ? (n / 1e6).toFixed(2) + " MB" : (n / 1e3).toFixed(0) + " KB");

/* Bytes the model costs on the wire: what the page requested for it, from Resource Timing. */
function bytesOf(url) {
  const abs = new URL(url, document.baseURI).href;
  let n = 0;
  for (const r of performance.getEntriesByType("resource")) if (r.name === abs) n += r.transferSize || r.encodedBodySize || 0;
  return n;
}

/* 120 frames of a full turn at RIG size. GPU timer when the browser has one; otherwise the CPU time of render + a one-pixel readback.
   gl.finish() is not a barrier in Chrome (it returned in 0.06 ms for 94k triangles); readPixels is, so the readback is what makes the
   number the frame's real cost, at the price of one round trip of latency in every frame. Programs are already compiled: steady state. */
function turntable(b) {
  const [pw, ph] = pxSize("rig");
  renderer.setViewport(0, 0, pw, ph); renderer.setScissor(0, 0, pw, ph);
  const ext = gl.getExtension("EXT_disjoint_timer_query_webgl2"), N = 120, cpu = [], q = [], px = new Uint8Array(4);
  const sync = () => gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
  for (let i = 0; i < 6; i++) { b.turn(i * 0.05); renderer.render(b.scene, b.camera); }   // warm
  sync();
  for (let i = 0; i < N; i++) {
    b.turn((i / N) * Math.PI * 2);
    const t0 = performance.now(), query = ext ? gl.createQuery() : null;
    if (query) gl.beginQuery(ext.TIME_ELAPSED_EXT, query);
    renderer.clear(); renderer.render(b.scene, b.camera);
    if (query) gl.endQuery(ext.TIME_ELAPSED_EXT);
    sync();
    cpu.push(performance.now() - t0);
    if (query) q.push(query);
  }
  let ms = cpu, method = "cpu · render + readback";
  if (q.length && !gl.getParameter(ext.GPU_DISJOINT_EXT) && q.every((x) => gl.getQueryParameter(x, gl.QUERY_RESULT_AVAILABLE))) {
    ms = q.map((x) => gl.getQueryParameter(x, gl.QUERY_RESULT) / 1e6); method = "gpu timer";
  }
  const sorted = ms.slice().sort((a, c) => a - c);
  return { mean: ms.reduce((a, c) => a + c, 0) / N, p95: sorted[Math.floor(N * 0.95)], method };
}

async function measure(id) {
  const entry = ENTRIES.find((e) => e.id === id), b = await build(entry, "rig");
  renderer.setViewport(0, 0, ...pxSize("rig")); renderer.setScissor(0, 0, ...pxSize("rig"));
  b.turn(0); renderer.clear(); renderer.render(b.scene, b.camera);
  const info = { calls: renderer.info.render.calls, triangles: renderer.info.render.triangles };
  const out = { id, bytes: bytesOf(entry.src), tris: b.triangles, rendered: info.triangles, calls: info.calls, programs: b.programs.size, programKeys: [...b.programs], compileMs: b.compileMs, firstMs: b.firstMs, fresh: b.freshPrograms, ...turntable(b) };
  perfResults.set(id, out);
  showPerf(id);
  return out;
}

function showPerf(id) {
  const slot = $(`[data-slot="${id}"]`), v = perfResults.get(id);
  if (!slot || !v) return;
  slot.innerHTML = `<table class="perf"><thead><tr><th></th><th>bytes</th><th>tris</th><th>draws</th><th>programs</th><th>cold start ms</th><th>frame ms</th><th>p95</th></tr></thead><tbody>
    <tr><td>rig</td><td>${kb(v.bytes)}</td><td>${v.tris.toLocaleString()}</td><td>${v.calls}</td><td>${v.programs} (+${v.fresh})</td><td>${(v.compileMs + v.firstMs).toFixed(0)}</td><td>${v.mean.toFixed(1)}</td><td>${v.p95.toFixed(1)}</td></tr></tbody></table>
    <p class="note">frame: 120-frame turntable at rig size, ${v.method}${v.method.startsWith("cpu") ? " (software rasteriser: compare models, not the number)" : ""}. bytes: Resource Timing. cold start: compileAsync plus the first frame, after a throwaway lit scene has paid for the context. (+n): programs no earlier build needed. Cold start measured here shares the thread with the panels: ?perf draws nothing and gives the clean number.</p>`;
}

main.addEventListener("click", (ev) => {
  const b = ev.target.closest("[data-measure]");
  if (!b) return;
  b.disabled = true; say(`measuring ${b.dataset.measure}…`, true);
  measure(b.dataset.measure).catch((e) => console.error(e)).finally(() => { b.disabled = false; schedule(); });
});
$("#measure-all").addEventListener("click", async () => {
  for (const e of ENTRIES.filter((x) => state.model === "all" || x.id === state.model)) { say(`measuring ${e.id}…`, true); await measure(e.id); }
  schedule();
});

/* ---------------- the page's scriptable surface ---------------- */

/* shoot({ model, tier }) -> PNG data URL at the tier's own pixel size, from a fresh 2D canvas. Other keys are ignored.
   The contact sheets and the perf run drive the page through this and through the URL. */
async function shoot({ model, tier }) {
  const entry = ENTRIES.find((e) => e.id === model), b = await build(entry, tier);
  const c = document.createElement("canvas"), [pw, ph] = pxSize(tier);
  c.width = pw; c.height = ph;
  draw(b, c.getContext("2d"), 0);
  return c.toDataURL("image/png");
}

/* Free what a build made: the materials finish() returned, nothing else. Textures and geometry are the loader's or the studio's,
   shared by every clone on the page (AGENTS.md, the studio). */
function release(b) {
  for (const m of b.materials) m.dispose();
}
async function releaseAll() {
  const bs = await Promise.all([...builds.values()]);
  bs.forEach(release);
  builds.clear(); panels.forEach((p) => { p.dirty = true; });
  schedule();
}
/* leakCheck(): rebuild every model N times through release(); renderer.info must come back flat. */
async function leakCheck(n = 3) {
  const log = [];
  for (let i = 0; i < n; i++) {
    for (const e of ENTRIES) { const b = await build(e, "rig"); release(b); builds.delete(bkey(e, "rig")); }
    log.push({ round: i, programs: renderer.info.programs.length, textures: renderer.info.memory.textures, geometries: renderer.info.memory.geometries });
  }
  return log;
}

window.materials = {
  release, releaseAll, leakCheck,
  ENTRIES, state, shoot, measure, perf: perfResults, THREE, renderer, builds, ctx, S, env, build,
  get idle() { return loading === 0 && ![...visible].some((p) => p.dirty); },
};

sel.value = state.model;
sync();
if (!Q.has("perf")) layout();   // a perf run draws no panels: nothing may share the main thread with a compile being timed
say("ready", false);
if (Q.has("perf")) {
  const ids = ENTRIES.filter((e) => state.model === "all" || e.id === state.model).map((e) => e.id);
  window.materials.perfDone = (async () => { for (const id of ids) await measure(id); return [...perfResults.values()]; })();
}
