/* ============================================================
   WAFER — STORY (lab surface, excluded from deploy)
   One live object pinned behind native scroll. Each section owns a
   place on the engine's one path (lab/places.js); this file only
   tells lab/wafer.js where the usable rectangle is and which place
   to go to. The springs, the magnets and the typing are the
   engine's, unchanged. Nothing here scrubs, snaps or takes the
   wheel: the only scroll listener is passive and only lets go of
   the keys.
   ============================================================ */
const root = document.documentElement;
root.dataset.story = "1"; root.dataset.js = "";   // started: a late start restores the enhanced state the head script's fail-open may have dropped
if ("rescued" in root.dataset) { delete root.dataset.rescued; delete root.dataset.engine; }
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const canvas = $("#stage"), marks = $("#marks"), pill = $("#pill"), hdr = $(".hdr"), snd = $("#sound"), status = $("#live-status");
const sections = $$("main > section");
const phoneMQ = matchMedia("(max-width: 760px), (max-aspect-ratio: 1/1)");
const shortMQ = matchMedia("(min-width: 761px) and (min-aspect-ratio: 1/1) and (max-height: 500px)");
const reducedMQ = matchMedia("(prefers-reduced-motion: reduce)");
const LABELS = ["Desk", "Profile", "Screens", "Tent", "Magnets", "Folded", "Wall", "Fridge"];
const RAIL = ["split", "profile", "screens", "tent", "magnets", "folded", "wall", "fridge"];
const gutter = parseFloat(getComputedStyle(root).getPropertyValue("--gutter")) || 34;

let W = null;                       // window.wafer, once the engine is up
let live = false, away = false;     // the object has shown / the canvas is out of sight

/* ---------------- page furniture ---------------- */

// the case-study route is the registry's file, written into the markup; story.check keeps the two equal

const promote = () => window.__promote && window.__promote();   // the photographs below the fold start loading

const smooth = () => (reducedMQ.matches ? "auto" : "smooth");
document.addEventListener("click", (e) => {   // <base href="../"> turns "#id" into a navigation: scroll instead
  const a = e.target.closest("a[data-jump]");
  if (!a) return;
  e.preventDefault();
  if (a.dataset.jump === "top") scrollTo({ top: 0, behavior: smooth() });
  else { const m = $("#content"); m.scrollIntoView({ behavior: smooth() }); m.focus({ preventScroll: true }); }
});

new IntersectionObserver(([e]) => hdr.classList.toggle("glass", !e.isIntersecting)).observe($(".sentinel"));
// the header wraps at large text sizes: scroll-padding follows its real height
new ResizeObserver(() => root.style.setProperty("--hdr-h", hdr.offsetHeight + "px")).observe(hdr);
// the serif is a 22 KB request for two moments at the foot of the page: it starts when one is within a screen
const serif = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { root.dataset.serif = ""; serif.disconnect(); } }, { rootMargin: "100% 0px" });
$$(".h2s, .quote").forEach((el) => serif.observe(el));
// on a phone a button half under the stage edge reads as an empty box: the hero's controls leave once they are not wholly below it
const act = $(".hero-act");
new IntersectionObserver(([e]) => act.classList.toggle("under", e.intersectionRatio < 1 && e.boundingClientRect.top < innerHeight / 2), { rootMargin: "-46% 0px 0px 0px", threshold: 1 }).observe(act);

sections.forEach((s) => $$(".rv", s).forEach((el, i) => el.style.setProperty("--i", Math.min(i, 5))));
// a clipped photograph reports as not intersecting (clip-path applies to its own geometry): watch its figure, wipe the photograph
const reveal = new IntersectionObserver((es) => es.forEach((e) => {
  if (!e.isIntersecting) return;
  e.target.classList.add("in");
  $$(".wipe", e.target).forEach((w) => w.classList.add("in"));
  reveal.unobserve(e.target);
}), { threshold: 0.2 });
$$(".rv, .fig").forEach((el) => reveal.observe(el));

new MutationObserver(() => { $(".st", snd).textContent = snd.getAttribute("aria-pressed") === "true" ? "on" : "off"; })
  .observe(snd, { attributes: true, attributeFilter: ["aria-pressed"] });

/* The sampled demo audio waits for the first toggle: the engine reads it when it wakes, nothing else needs it. */
const AUDIO = ["app/landing/audio/generative-score.js", "app/landing/audio/sample-engine.js", "demo/music-score.js", "demo/sample-sound.js", "demo/wafer-sound.js"];
let audio = null;
const loadAudio = () => (audio ||= new Promise((ok, no) => AUDIO.forEach((src, i) => {   // async = false: in this order, in parallel
  const el = Object.assign(document.createElement("script"), { src, async: false, onerror: no });
  if (i === AUDIO.length - 1) el.onload = ok;
  document.head.append(el);
})));
snd.addEventListener("click", (e) => {
  if (snd.getAttribute("aria-disabled") === "true") { e.stopImmediatePropagation(); return; }
  if (audio) return;
  e.stopImmediatePropagation();   // the engine's own toggle runs on the replayed click, once the scripts are in
  snd.setAttribute("aria-busy", "true");
  loadAudio().then(() => { snd.removeAttribute("aria-busy"); snd.click(); }, () => {
    snd.removeAttribute("aria-busy"); snd.setAttribute("aria-disabled", "true");   // the button stays: focus keeps its place and says why
    $(".st", snd).textContent = "n/a"; status.textContent = "Sound could not load.";
  });
}, true);

/* the one scroll listener, passive: the hero hint goes for good, and a scroll lets go of the keys */
let armedY = 0;
const hint = $("#hero-hint"), hideHint = () => hint.classList.add("gone");
addEventListener("scroll", () => {
  if (scrollY > 40) { hideHint(); promote(); }
  if (document.activeElement === canvas && Math.abs(scrollY - armedY) > 40) canvas.blur();
}, { passive: true });
canvas.addEventListener("focus", () => { armedY = scrollY; pill.classList.add("on"); });
canvas.addEventListener("blur", () => pill.classList.remove("on"));

/* ---------------- layout: where the object may stand ---------------- */

/* px of the canvas the copy owns. The copy column is measured, never assumed. */
const kindOf = (s) => {
  const k = s.dataset.layout;
  return shortMQ.matches ? (k === "low" ? "left" : /^(hero|profile|end)$/.test(k) ? "right" : k) : k;
};
function layoutFor(sec) {
  if (phoneMQ.matches) return { top: 56, bottom: 8, left: 16, right: 16 };
  const w = canvas.clientWidth, h = canvas.clientHeight, r = $(".copy", sec).getBoundingClientRect();
  switch (kindOf(sec)) {
    case "hero": return { top: Math.min(0.38 * h, 360), bottom: 56, left: gutter, right: gutter };
    // a close-up runs past the frame: the halves are cropped by the window's own edges below the copy (the view fits the screens and the pods above them)
    case "low": return { top: Math.min(98 + r.height + 16, 0.64 * h), bottom: 24, left: gutter, right: gutter };
    case "profile": {   // the marks stand ~36 px above the half: the copy clears them, and the rectangle keeps room for the half itself
      const top = Math.min(98 + r.height + 16 + 36, 0.8 * h);
      return { top, bottom: 40, left: gutter, right: gutter };
    }
    case "end": {   // the copy's real top at the foot of the page: the object keeps what is above it
      const below = $(".foot").offsetHeight + parseFloat(getComputedStyle(sec).paddingBottom) + r.height + 24;
      return { top: 72, bottom: Math.min(below, 0.76 * h - 72), left: gutter, right: gutter };
    }
    case "left": return { top: 72, bottom: 24, left: gutter / 2, right: w - r.left + 34 };
    default: return { top: 72, bottom: 24, left: r.right + 34, right: gutter / 2 };
  }
}
const objects = sections.filter((s) => s.dataset.layout !== "hidden");
const bandSection = () => {
  const y = innerHeight * (phoneMQ.matches ? 0.66 : 0.5);
  return objects.find((s) => { const r = s.getBoundingClientRect(); return r.top <= y && r.bottom > y; }) || objects[0];
};

/* ---------------- sections drive places ---------------- */

let current = null, want = null, lastAt = -1e9, timer = 0, down = false, firstDone = false;

/* leading edge at once; a further change inside 250 ms waits 140 ms, so a fling does not fly through every place */
function request(sec) {
  want = sec;
  if (!W || down) return;
  clearTimeout(timer);
  if (performance.now() - lastAt > 250) commit(); else timer = setTimeout(commit, 140);
}
const sigOf = (l) => [canvas.clientWidth, canvas.clientHeight, l.top, l.bottom, l.left, l.right].map(Math.round).join();
let applied = "";   // the box and layout the engine was last told: a resize that moves neither (a toolbar sliding) changes nothing
function commit(jump = false) {
  clearTimeout(timer);
  const sec = want;
  if (!W || !sec || down || (sec === current && !jump)) return;
  const k = +sec.dataset.place, cut = jump || away || (!firstDone && scrollY > 0);   // a reload, a hash, a hidden canvas: cut, never fly
  const lay = layoutFor(sec);
  W.setInset(lay, { snap: cut, to: k });
  applied = sigOf(lay);
  if (cut) W.jump(k, true); else W.go(k);
  current = sec; lastAt = performance.now(); firstDone = true;
  railTo(k);
}
canvas.addEventListener("pointerdown", (e) => { down = e.isPrimary && e.button === 0; });
canvas.addEventListener("pointermove", () => { if (down) hideHint(); });
const letGo = () => { if (!down) return; down = false; if (want && want !== current) request(want); };   // never fight a hand
addEventListener("pointerup", letGo);
addEventListener("pointercancel", letGo);
addEventListener("blur", letGo);                          // a press that never gets its release (a menu, a lost focus)
canvas.addEventListener("contextmenu", letGo);

let band = null;
function observeBand() {
  if (band) band.disconnect();
  band = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting && e.target.dataset.layout !== "hidden") request(e.target); }),
    { rootMargin: phoneMQ.matches ? "-65% 0px -33% 0px" : "-49% 0px -49% 0px" });
  sections.forEach((s) => band.observe(s));
}
observeBand();

/* the canvas shows only while an object section is on screen, and returns already in place: cut first, fade after */
const inView = new Set();
const viewIO = new IntersectionObserver((es) => {   // a section shows only once it is 120 px inside the window: a sliver above the sheet is not the object's
  es.forEach((e) => (e.isIntersecting ? inView.add(e.target) : inView.delete(e.target)));
  setAway(!inView.size);
}, { rootMargin: "-120px 0px" });
objects.forEach((s) => viewIO.observe(s));
function setAway(a) {
  if (a === away) return;
  if (a) { away = true; sync(); return; }
  const mid = innerHeight / 2, pick = [...inView].sort((x, y) => Math.abs(x.getBoundingClientRect().top - mid) - Math.abs(y.getBoundingClientRect().top - mid))[0];
  want = pick;
  commit(pick !== current);   // same section as when it left: nothing moved, nothing to cut
  requestAnimationFrame(() => requestAnimationFrame(() => { away = false; sync(); }));
}
function sync() {
  canvas.classList.toggle("is-away", away);
  marks.classList.toggle("is-away", away);
  if (rail) rail.nav.classList.toggle("is-away", away || !live);
}

/* ---------------- the rail: the place line, vertical ---------------- */

let head = null;   // the playhead's spring: the engine's own class, so the page carries none of its own
let rail = null, railRaf = 0, railLast = 0;
function buildRail() {
  head = new W.Spring(0, { damping: 1, response: 0.4 });
  const nav = document.createElement("nav");
  nav.className = "rail is-away";
  nav.setAttribute("aria-label", "Places");
  nav.innerHTML = `<ol role="list">${LABELS.map((l, k) => `<li style="--k:${k}"><button type="button" data-k="${k}" aria-label="${l}"><span aria-hidden="true">${l}</span></button></li>`).join("")}</ol><i class="head" aria-hidden="true"></i>`;
  nav.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    const t = document.getElementById(RAIL[+b.dataset.k]), h = $("h1, h2", t);
    t.scrollIntoView({ behavior: smooth() });
    h.tabIndex = -1; h.focus({ preventScroll: true });   // a screen reader lands in the section it chose
  });
  nav.addEventListener("keydown", (e) => { if (e.key === "Escape") nav.classList.add("quiet"); });
  for (const t of ["focusin", "pointerleave"]) nav.addEventListener(t, () => nav.classList.remove("quiet"));
  canvas.after(nav);   // right after the canvas in tab order, where it sits at the left edge
  rail = { nav, buttons: $$("button", nav) };
}
function railTick(now) {
  railRaf = 0;
  const moving = head.step(Math.min(0.05, (now - railLast) / 1000));
  railLast = now;
  rail.nav.style.setProperty("--p", head.value.toFixed(3));
  if (moving) railRaf = requestAnimationFrame(railTick);
}
function railTo(k) {
  if (!rail) return;
  rail.buttons.forEach((b, i) => (i === k ? b.setAttribute("aria-current", "step") : b.removeAttribute("aria-current")));
  if (reducedMQ.matches) { head.snap(k); rail.nav.style.setProperty("--p", k); return; }
  head.to(k);
  if (!railRaf) { railLast = performance.now(); railRaf = requestAnimationFrame(railTick); }   // a frame only while it moves
}

/* a hand that folds the halves moves the object past its section: the playhead goes where the object is */
addEventListener("wafer:arrive", (e) => railTo(e.detail.place));

/* ---------------- the engine ---------------- */

/* The numbers in the copy are the engine's own marks, read back: the page follows the model. */
function hydrate() {
  const [thin, tall, fold] = $$("#marks text").map((n) => (n.textContent.match(/\d+/) || [])[0]);
  for (const [key, v] of [["thin", thin], ["tall", tall], ["fold", fold]]) if (v) $$(`[data-mark="${key}"]`).forEach((n) => { n.textContent = v; });
  return { thin, tall, fold };
}

/* Every layout is measured once, before anything is shown, so no section change pays for it. */
function prewarm() {
  const seen = new Set();
  for (const s of objects) {
    const l = layoutFor(s), key = JSON.stringify(l, (_, v) => (typeof v === "number" ? Math.round(v) : v));
    if (!seen.has(key)) { seen.add(key); W.setInset(l, { snap: true }); }
  }
}

window.addEventListener("wafer:ready", () => {
  W = window.wafer;
  // the model parts did not load: the engine resolves anyway, with nothing to frame
  if (!W.views.every((v) => Number.isFinite(v.dist))) { W = null; fail(); return; }
  // this page's words over the study's, at every place the model speaks: the label, the right screen's
  // narration (a playing title would keep the renderer awake) and what a screen reader hears
  const P = W.PLACES, n = hydrate();
  P[1].say = `edge on, about ${n.thin} to ${n.tall} millimetres thick on the model`;
  P[1].screen = { status: "2 / 8", title: "Profile", artist: `${n.thin}–${n.tall} mm` };
  P[0].screen = { status: "1 / 8", title: "Desk", artist: "Two halves" };
  P[2].screen = { status: "3 / 8", title: "Screens", artist: "memory-in-pixel" };
  P[2].view = { ...P[2].view, box: "screens+top", target: [0, 0.6, -2.9], fill: 0.94 };   // the close-up keeps the pods above the screens clear of the copy
  P[1].view = { ...P[1].view, box: "left", fill: 0.94 };   // edge-on, one half fills the width: both marks are on it, and 4 mm is more than a hairline
  P[4].say = "modelled, not photographed: the halves folded up facing each other, a ring and a bar magnet in each back";
  P[5].label = "Folded";
  P[5].say = `modelled: both halves back to back, keys facing out, about ${n.fold} millimetres thick, measured from the model`;
  P[5].screen = { status: "6 / 8", title: "Folded", artist: `${n.fold} mm` };
  P[6].say = "modelled: both halves held on a steel panel by their magnets";
  P[7].screen = { status: "8 / 8", title: "Fridge", artist: "on a fridge" };
  // the fridge, framed on the halves with the door's width inside the usable rectangle (the study frames the whole fridge at about a third of this size)
  P[7].view = { ...P[7].view, target: [0, 118, -8], fill: 0.84 };   // the door fades out on the copy side, so the pair can come close
  P[6].view = { ...P[6].view, fill: 0.65 };   // the study frames the panel at half the usable rectangle: the halves on it are about 390 px, too few to read their keys
  W.drawMedia();   // the engine drew the desk before these words were here
  prewarm();
  buildRail();
  want = want || bandSection();
  commit();
  document.fonts.ready.then(() => { if (!live) { prewarm(); commit(true); } });
}, { once: true });

/* the photograph the right screen shows at the fridge, as the model drew it: the same bits, here at 2x */
window.addEventListener("wafer:photo", (e) => {
  const c = $("#bit"), x = c.getContext("2d"), img = x.createImageData(c.width, c.height);
  e.detail.bits.forEach((b, i) => img.data.set([b ? 163 : 12, b ? 163 : 12, b ? 163 : 12, 255], i * 4));
  x.putImageData(img, 0, 0);
  root.dataset.photo = "";
});

canvas.addEventListener("wafer:shown", () => {
  if (root.dataset.engine === "failed") return;
  live = true;
  root.dataset.engine = "live";
  $("#next-profile").disabled = false;
  setTimeout(() => canvas.classList.add("settled"), 1500);
  sync();
  promote();
});

const fail = () => {
  const word = live ? "stopped" : "didn’t start";
  root.dataset.engine = "failed";
  if (status.textContent || live) status.textContent = `The live model ${word}. The photographs and text below are the page.`;
  $("#fb-failed").textContent = `The live model ${word}. This is the prototype instead.`;
  promote();
};
canvas.addEventListener("webglcontextlost", (e) => { e.preventDefault(); fail(); });

/* the first frame is cleared to the page's own colour, so the engine waits until the page has painted its text */
function afterPaint(fn) {
  let done = false;
  const once = () => { if (!done) { done = true; fn(); } };
  const painted = (list) => list.getEntriesByType("paint").some((e) => /contentful/.test(e.name));   // text on screen
  if (painted(performance)) return once();
  try {
    new PerformanceObserver((l, o) => { if (painted(l)) { o.disconnect(); once(); } }).observe({ type: "paint", buffered: true });
  } catch (_) { once(); }
  setTimeout(() => { if (!document.hidden) once(); }, 4000);
}

async function boot() {
  root.dataset.engine = "loading";
  window.WAFER_EMBED = { inset: layoutFor(bandSection()) };   // the first frame is already in the right place
  try {
    const font = $("#mont");   // the engine's screens are drawn in Montserrat: have it before the import
    if (!font.sheet) await new Promise((r) => { font.addEventListener("load", r, { once: true }); font.addEventListener("error", r, { once: true }); setTimeout(r, 4000); });
    await import("./wafer.js");
  } catch (err) {
    console.warn("[story] the live model did not start", err);
    fail();
  }
}
function start() {
  if (root.dataset.engine) { promote(); return; }   // the head script already ruled: no WebGL2 (failed) or data saver (saver)
  root.dataset.engine = "loading";   // the hairline under the header sweeps until the object shows
  const go = () => ("requestIdleCallback" in window ? requestIdleCallback(boot, { timeout: 1500 }) : setTimeout(boot, 0));
  afterPaint(() => requestAnimationFrame(go));
}
$("#load-live").addEventListener("click", () => {   // data saver: the visitor asked for it
  status.textContent = "Loading the live model.";
  canvas.addEventListener("wafer:shown", () => {
    status.textContent = "The live model is ready. Tab reaches it.";
    const h = $("#h-hero"); h.tabIndex = -1; h.focus({ preventScroll: true });   // the button that held focus has left the page; focus is recovered, nothing is armed
  }, { once: true });
  boot();
});
start();

/* the page's own single-pointer routes to what the canvas answers by drag or by key */
$$("[data-turn]").forEach((b) => b.addEventListener("click", () => W && W.turn(+b.dataset.turn)));
$("#next-profile").addEventListener("click", () => {
  if (!W) return;
  W.tapScreen(W.screens.status);
  status.textContent = `Profile ${W.panel.profile + 1} of 3 on the model’s left screen`;   // the change is on the canvas only: a button should answer
});

/* ---------------- resize, orientation, back/forward ---------------- */

let lastPhone = phoneMQ.matches, rz = 0;
function relayout() {
  cancelAnimationFrame(rz);
  rz = requestAnimationFrame(() => {   // after the engine's own resize: it clears its measurements, this re-sends the insets
    if (phoneMQ.matches !== lastPhone) { lastPhone = phoneMQ.matches; observeBand(); }
    if (!W || !current) return;
    const lay = layoutFor(current), sig = sigOf(lay);
    if (sig !== applied) { applied = sig; W.setInset(lay, { snap: true }); }
  });
}
addEventListener("resize", relayout);
addEventListener("orientationchange", relayout);
addEventListener("pageshow", (e) => { if (e.persisted && W) { want = bandSection(); commit(true); } });
