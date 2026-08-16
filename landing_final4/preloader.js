/* ============================================================
   M.O. SYSTEM — ENTRY · RESOLUTION PRELOADER
   "The universe does not boot. The observer resolves it."

   Zero dependencies: no React, no Babel, no THREE, no WebGL, no font
   wait. This runs from the first parsed bytes of <body>, which is the
   only way a heavy page can show something honest immediately.

   The field is never "created". It is sampled at a rising rate:
     · count    ↑   24 → N        (Halton — any prefix is uniform, so new
                                   points fill gaps instead of appearing
                                   somewhere new; nothing ever moves)
     · cell     ↓   52px → 0      (positions de-quantise onto the truth)
     · size     ↓   soft → crisp  (blobs resolve into single pixels)

   The counter walks the address space 0x00 → 0xFF. It is driven by REAL
   readiness, and its final stretch is time-locked to the universe's own
   overture so that the instant it reads 0xFF the particles — which have
   been gathering into the literal glyph "0x00" underneath — burst.
   You traverse the whole byte and what you find at the end is the source.
   ============================================================ */
(function () {
  "use strict";
  var root = document.getElementById("mo-pl");
  if (!root) return;
  var html = document.documentElement;
  var kill = function () { html.classList.remove("mo-pl-on"); if (root.parentNode) root.parentNode.removeChild(root); };

  // mid-page reload / deep link — the visitor is already inside the system
  if (window.scrollY > 80) { kill(); return; }

  var cfg = window.__mo_pl_cfg || {};
  var cv = root.querySelector(".mo-pl__cv");
  var hexEl = root.querySelector(".mo-pl__val");
  var pctEl = root.querySelector(".mo-pl__pct");
  var barEl = root.querySelector(".mo-pl__bar i");
  var ret = root.querySelector(".mo-pl__ret");
  if (!cfg.pct && pctEl) pctEl.style.display = "none";

  var REDUCED = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var MOBILE = window.innerWidth <= 760;
  var N_MAX = MOBILE ? 1500 : 3400;
  var ctx = cv.getContext("2d", { alpha: false });

  /* ── progressive sample set ─────────────────────────────────────── */
  function halton(i, b) { var f = 1, r = 0; while (i > 0) { f /= b; r += f * (i % b); i = Math.floor(i / b); } return r; }
  var P = new Float32Array(N_MAX * 3);
  for (var i = 0; i < N_MAX; i++) { P[i * 3] = halton(i + 1, 2); P[i * 3 + 1] = halton(i + 1, 3); P[i * 3 + 2] = halton(i + 1, 5); }

  var spr = document.createElement("canvas"); spr.width = spr.height = 32;
  (function () {
    var s = spr.getContext("2d"), g = s.createRadialGradient(16, 16, 0, 16, 16, 16);
    g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(.45, "rgba(255,255,255,.42)"); g.addColorStop(1, "rgba(255,255,255,0)");
    s.fillStyle = g; s.fillRect(0, 0, 32, 32);
  })();

  var W = 0, H = 0;
  function size() {
    var d = Math.min(1.5, window.devicePixelRatio || 1);
    W = window.innerWidth; H = window.innerHeight;
    cv.width = Math.round(W * d); cv.height = Math.round(H * d);
    ctx.setTransform(d, 0, 0, d, 0, 0);
  }
  size();
  window.addEventListener("resize", size);

  /* ── REAL readiness ─────────────────────────────────────────────── */
  var WEIGHT = { doc: .08, three: .16, react: .10, fonts: .10, universe: .24, frame: .22, title: .10 };
  var hit = {}, rd = 0;
  function mark(k) {
    if (hit[k]) return;
    hit[k] = 1;
    var r = 0; for (var j in WEIGHT) if (hit[j]) r += WEIGHT[j];
    rd = Math.min(1, r);
  }
  mark("doc");
  window.addEventListener("mo:universe-ready", function () { mark("universe"); });
  window.addEventListener("mo:first-frame", function () { mark("frame"); });
  window.addEventListener("mo:title-ready", function () { mark("title"); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { mark("fonts"); }).catch(function () { mark("fonts"); });
  else mark("fonts");
  var poll = setInterval(function () {
    if (window.THREE && window.THREE.GLTFLoader) mark("three");
    if (window.React && window.ReactDOM) mark("react");
    if (hit.three && hit.react) { clearInterval(poll); poll = 0; }
  }, 60);
  // nothing may ever trap the visitor behind a stalled milestone
  var bail = setTimeout(function () { for (var k in WEIGHT) mark(k); }, 9000);

  /* ── sequence ───────────────────────────────────────────────────── */
  var RES_CAP = 0.78;                 // readiness owns 0x00 → ~0xC7
  var BURST_MS = 1092;                // = 0.42 × the universe's 2600ms overture
  var prog = 0, finale = 0, ff = false, done = false, t0 = performance.now();

  function startFinale(now) {
    finale = now;
    if (window.__mo_arrival_start) window.__mo_arrival_start();
    // let the gather become visible through the fading sample field
    setTimeout(function () { root.classList.add("is-hand"); }, 170);
    try {
      if (window.MOSound && !window.MOSound.isMuted()) window.MOSound.unlock();
    } catch (e) {}
  }

  function finish() {
    if (done) return;
    done = true;
    root.classList.add("is-out");
    html.classList.remove("mo-pl-on");
    try { window.dispatchEvent(new CustomEvent("mo:preloader-done")); } catch (e) {}
    setTimeout(kill, 320);
  }

  function frame(now) {
    if (done) return;
    var gather = 0;
    if (!finale) {
      var target = (ff ? 1 : rd) * RES_CAP;
      prog += (target - prog) * (REDUCED ? 0.20 : 0.075);
      if (prog > RES_CAP - 0.004 && (rd >= 1 || ff)) { prog = RES_CAP; startFinale(now); }
    } else {
      var f = Math.min(1, (now - finale) / BURST_MS);
      prog = RES_CAP + (1 - RES_CAP) * Math.pow(f, 1.2);
      gather = Math.min(1, (now - finale) / 780);
      if (f >= 1) { prog = 1; }
    }
    var res = prog;

    /* one idea, three monotonic axes */
    var n = Math.max(24, Math.floor(N_MAX * (0.008 + 0.992 * Math.pow(res, 1.9))));
    var cell = REDUCED ? 0 : 52 * Math.pow(1 - res, 1.7);
    var soft = 1 - res;
    var t = REDUCED ? 0 : (now - t0) * 0.001;
    var cx = W / 2, cy = H / 2, ang = t * 0.035, ca = Math.cos(ang), sa = Math.sin(ang);
    var spread = 1.28 + 0.10 * Math.sin(t * 0.22);
    var pull = 1 - 0.88 * gather * gather;      // the 2D field starts the gather

    ctx.fillStyle = "#05060a"; ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = "lighter";
    for (var k = 0; k < n; k++) {
      var d = 0.46 + P[k * 3 + 2] * 0.86;
      var ux = P[k * 3] - 0.5, uy = P[k * 3 + 1] - 0.5;
      var rx = ux * ca - uy * sa, ry = ux * sa + uy * ca;
      var px = cx + rx * W * spread / d, py = cy + ry * H * spread / d;
      if (cell > 0.5) { px = Math.floor(px / cell) * cell + cell / 2; py = Math.floor(py / cell) * cell + cell / 2; }
      if (pull < 1) { px = cx + (px - cx) * pull; py = cy + (py - cy) * pull; }
      if (px < -40 || px > W + 40 || py < -40 || py > H + 40) continue;
      var s = (0.55 + 3.4 * soft) / d;
      var a = (0.10 + 0.62 * res) * (1.25 - d * 0.55) * (0.55 + 0.45 * soft);
      if (s < 1.05) { ctx.fillStyle = "rgba(226,240,248," + Math.min(1, a * 1.5).toFixed(3) + ")"; ctx.fillRect(px, py, 1, 1); }
      else { ctx.globalAlpha = Math.min(1, a); ctx.drawImage(spr, px - s, py - s, s * 2, s * 2); ctx.globalAlpha = 1; }
    }
    ctx.globalCompositeOperation = "source-over";

    if (ret) {
      ret.style.filter = soft > 0.02 ? "blur(" + (soft * 3.4).toFixed(2) + "px)" : "none";
      ret.style.opacity = (0.25 + 0.75 * res).toFixed(3);
    }

    var v = Math.round(res * 255);
    var s16 = v.toString(16).toUpperCase();
    hexEl.textContent = s16.length < 2 ? "0" + s16 : s16;
    if (pctEl) pctEl.textContent = String(Math.round(res * 100)) + "%";
    if (barEl) barEl.style.transform = "scaleX(" + res.toFixed(4) + ")";

    if (prog >= 1) { finish(); return; }
    requestAnimationFrame(frame);
  }

  root.classList.add("is-live");
  requestAnimationFrame(frame);

  var arm = setTimeout(function () {
    var go = function () { ff = true; };
    window.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === "Escape" || e.key === " ") { e.preventDefault(); go(); }
    });
    window.addEventListener("wheel", go, { passive: true });
    window.addEventListener("pointerdown", go, { passive: true });
    window.addEventListener("touchstart", go, { passive: true });
  }, 450);

  window.addEventListener("mo:preloader-done", function () {
    clearTimeout(bail); clearTimeout(arm); if (poll) clearInterval(poll);
    window.removeEventListener("resize", size);
  });
})();
