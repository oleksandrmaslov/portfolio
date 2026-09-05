/* ============================================================
   M.O. SYSTEM | LANDING ENTRY HORIZON

   One address, one horizon. Real application milestones move the
   signal inward; the WebGL universe owns the spectacle after it.
   Zero framework, canvas, WebGL, or font dependency.
   ============================================================ */
(function () {
  "use strict";

  var root = document.getElementById("mo-pl");
  if (!root) return;

  var html = document.documentElement;
  var hexHigh = root.querySelector("[data-hex-high]");
  var hexLow = root.querySelector("[data-hex-low]");
  var status = root.querySelector(".mo-pl__sr");
  var styleLinks = Array.prototype.slice.call(document.querySelectorAll("link[data-app-style]"));
  var reduced = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  var weights = {
    doc: 0.06,
    styles: 0.14,
    fonts: 0.08,
    three: 0.18,
    react: 0.12,
    universe: 0.20,
    frame: 0.08,
    handoff: 0.06,
    title: 0.08,
  };

  var startedAt = performance.now();
  var minimumHold = reduced ? 80 : 440;
  var hit = Object.create(null);
  var progress = 1 / 255;
  var target = 1 / 255;
  var finished = false;
  var handoff = false;
  var completionQueued = false;
  var lastFrame = startedAt;
  var raf = 0;
  var poll = 0;
  var styleFallback = 0;
  var fontFallback = 0;
  var handoffFallback = 0;
  var readyTimer = 0;
  var revealTimer = 0;
  var finishTimer = 0;
  var bailoutTimer = 0;

  function announce(message) {
    if (status && status.textContent !== message) status.textContent = message;
  }

  function readiness() {
    var value = 0;
    Object.keys(weights).forEach(function (name) {
      if (hit[name]) value += weights[name];
    });
    return Math.min(1, value);
  }

  function hasCore() {
    return !!(hit.styles && hit.fonts && hit.three && hit.react && hit.universe && hit.frame && hit.handoff && hit.title);
  }

  function applyProgress(value) {
    progress = Math.max(1 / 255, Math.min(1, value));
    root.style.setProperty("--p", progress.toFixed(4));
    var hex = Math.max(1, Math.round(progress * 255)).toString(16).toUpperCase().padStart(2, "0");
    if (hexHigh) hexHigh.textContent = hex.charAt(0);
    if (hexLow) hexLow.textContent = hex.charAt(1);
  }

  function maybeReady() {
    if (!hasCore() || handoff || finished) return;
    target = 1;
  }

  function mark(name) {
    if (hit[name] || finished) return;
    hit[name] = true;
    target = hasCore() ? 1 : Math.min(0.94, readiness());

    if (name === "styles") {
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(function () { mark("fonts"); }).catch(function () { mark("fonts"); });
      } else {
        mark("fonts");
      }
      fontFallback = window.setTimeout(function () { mark("fonts"); }, 1000);
    }

    maybeReady();
  }

  function checkStyles() {
    if (!styleLinks.length || styleLinks.every(function (link) {
      return link.dataset.loaded === "1" || link.media === "all";
    })) mark("styles");
  }

  function startHandoff() {
    if (handoff || finished) return;
    handoff = true;
    applyProgress(1);
    root.classList.add("is-ready", "is-handoff");
    root.setAttribute("aria-busy", "false");
    announce("Project universe ready");

    if (!reduced && typeof window.__mo_arrival_start === "function") {
      try { window.__mo_arrival_start(); } catch (_) {}
    }

    revealTimer = window.setTimeout(function () {
      root.classList.add("is-transparent");
    }, reduced ? 20 : 150);

    finishTimer = window.setTimeout(finish, reduced ? 120 : 460);
  }

  function onStyleReady() { checkStyles(); }
  function onUniverseReady() { mark("universe"); }
  function onFirstFrame() {
    mark("frame");
    if (reduced) {
      mark("handoff");
      return;
    }
    // The hidden node-flight renderer is prepared after the Universe's first
    // paint. Keep that one-time context/PMREM/shader work behind this existing
    // horizon, but never let a failed model or WebGL context hold the page.
    handoffFallback = window.setTimeout(function () { mark("handoff"); }, 1800);
  }
  function onHandoffWarm() {
    window.clearTimeout(handoffFallback);
    handoffFallback = 0;
    mark("handoff");
  }
  function onTitleReady() { mark("title"); }

  function draw(now) {
    if (finished) return;
    var dt = Math.min(100, Math.max(0, now - lastFrame));
    lastFrame = now;
    var rate = reduced ? 18 : 6.5;
    applyProgress(progress + (target - progress) * (1 - Math.exp(-rate * dt / 1000)));

    if (hasCore() && !handoff && !completionQueued && progress > 0.992 && now - startedAt >= minimumHold) {
      completionQueued = true;
      applyProgress(1);
      root.classList.add("is-ready");
      announce("Project universe ready");
      readyTimer = window.setTimeout(startHandoff, reduced ? 0 : 120);
      return;
    }
    raf = requestAnimationFrame(draw);
  }

  function cleanup() {
    cancelAnimationFrame(raf);
    window.clearInterval(poll);
    window.clearTimeout(styleFallback);
    window.clearTimeout(fontFallback);
    window.clearTimeout(handoffFallback);
    window.clearTimeout(readyTimer);
    window.clearTimeout(revealTimer);
    window.clearTimeout(finishTimer);
    window.clearTimeout(bailoutTimer);
    window.clearTimeout(window.__mo_origin_watchdog);
    window.removeEventListener("mo:style-ready", onStyleReady);
    window.removeEventListener("mo:universe-ready", onUniverseReady);
    window.removeEventListener("mo:first-frame", onFirstFrame);
    window.removeEventListener("mo:handoff-warm", onHandoffWarm);
    window.removeEventListener("mo:title-ready", onTitleReady);
  }

  function finish() {
    if (finished) return;
    finished = true;
    cleanup();
    root.classList.add("is-out");
    html.classList.remove("mo-origin-on");
    var app = document.getElementById("root");
    if (app) {
      app.inert = false;
      app.removeAttribute("aria-hidden");
    }
    try { window.dispatchEvent(new CustomEvent("mo:preloader-done")); } catch (_) {}
    window.setTimeout(function () {
      if (root.parentNode) root.parentNode.removeChild(root);
    }, 200);
  }

  // A refresh inside the narrative or a project-to-field handoff should not
  // replay the entry horizon. The restored node transition owns that return.
  var returningToField = false;
  try { returningToField = sessionStorage.getItem("mo_node_return") === "1"; } catch (_) {}
  if (returningToField || window.scrollY > 80) {
    finish();
    return;
  }

  mark("doc");
  checkStyles();
  applyProgress(progress);
  raf = requestAnimationFrame(draw);

  window.addEventListener("mo:style-ready", onStyleReady);
  window.addEventListener("mo:universe-ready", onUniverseReady, { once: true });
  window.addEventListener("mo:first-frame", onFirstFrame, { once: true });
  window.addEventListener("mo:handoff-warm", onHandoffWarm, { once: true });
  window.addEventListener("mo:title-ready", onTitleReady, { once: true });

  styleLinks.forEach(function (link) {
    link.addEventListener("error", function () {
      link.dataset.loaded = "1";
      checkStyles();
    }, { once: true });
  });

  poll = window.setInterval(function () {
    if (window.THREE && window.THREE.GLTFLoader) mark("three");
    if (window.React && window.ReactDOM) mark("react");
    checkStyles();
    if (hit.three && hit.react && hit.styles) {
      window.clearInterval(poll);
      poll = 0;
    }
  }, 50);

  styleFallback = window.setTimeout(function () { mark("styles"); }, 3200);

  // A failed CDN or WebGL context must never trap the visitor behind the line.
  bailoutTimer = window.setTimeout(function () {
    if (finished || handoff) return;
    completionQueued = true;
    applyProgress(1);
    root.classList.add("is-ready");
    readyTimer = window.setTimeout(startHandoff, reduced ? 0 : 120);
  }, 9000);
})();
