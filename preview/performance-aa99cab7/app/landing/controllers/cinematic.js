/* ============================================================
   M.O. — LANDING CINEMATIC CONTROLLER
   Plain JS, loaded after the React app. Two safe jobs:

   1) TITLE REVEAL — stagger a rise+blur entrance on the title
      content (the one section with no scroll animation of its own).
      Uses animation-based classes whose absence = natural state, so
      a React re-render can never leave content hidden.

   2) GLOBAL WEIGHT — a rAF loop that lerps a smoothed scroll value,
      derives normalized velocity, and publishes it: --cin-vig drives
      the CSS vignette; window.__mo_vel drives the universe's FOV +
      aberration "push back" (the ONE scroll-feedback implementation —
      the former CSS motion-blur consumer is gone). Pure
      variable writes; never touches layout or scroll math.
   ============================================================ */
(function () {
  "use strict";
  var reduceMotion = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- 0. inject the universe grade layer (vignette + grain) ---------- */
  function injectGrade() {
    if (document.querySelector(".cin-grade")) return;
    var g = document.createElement("div");
    g.className = "cin-grade";
    g.setAttribute("aria-hidden", "true");
    g.innerHTML = '<div class="cin-grade__vig"></div>';
    // place right after the universe background so z-order is: universe(0) → grade(1) → main
    var uni = document.querySelector(".universeBg");
    if (uni && uni.parentNode) {
      uni.parentNode.insertBefore(g, uni.nextSibling);
    } else {
      document.body.appendChild(g);
    }
  }

  /* ---------- 1. title reveal (staggered rise + blur) ---------- */
  function revealTitle() {
    var title = document.getElementById("title");
    if (!title) return false;
    // Order matters: identity → field guide → wordmark → control cluster.
    // NOTE: the field guide reveals on its INNER wrapper, never the outer
    // .fieldHint — the outer owns centering + dismiss, and cinRise's forwards
    // fill would otherwise clobber both (off-center + never disappears).
    var groups = [
      title.querySelector(".title__idTop"),
      title.querySelector(".fieldHint__inner"),
      title.querySelector(".title__wordmark"),
      title.querySelector(".title__ctl"),
    ].filter(Boolean);
    if (!groups.length) return false;

    // corner reticles reveal first, together, as a quick frame "snap"
    var corners = title.querySelectorAll(".title__corner");
    corners.forEach(function (c, i) {
      c.style.setProperty("--cin-d", (i * 40) + "ms");
      c.classList.add("cin-reveal");
    });

    var base = 180; // let the frame land first
    groups.forEach(function (el, i) {
      el.style.setProperty("--cin-d", (base + i * 90) + "ms");
      el.classList.add("cin-reveal");
    });
    return true;
  }

  /* ---------- 1b. section reveals — retired ----------
     The about beat is board-flight's own scroll-driven entrance (footE /
     leadUi); no cinematic reveal is needed outside the title. ---------- */

  /* ---------- 2. global cinematic weight ---------- */
  var smoothY = window.scrollY || 0;
  var lastY = smoothY;
  var smVel = 0;
  var root = document.documentElement;
  // --cin-k is a static preset — read it once instead of a
  // getComputedStyle (style+layout flush) every animation frame.
  var cinK = 0.67;
  var lastVelW = -1, lastVigW = -1;
  var raf = 0;

  function frame() {
    raf = 0;
    var target = window.scrollY || window.pageYOffset || 0;
    smoothY += (target - smoothY) * 0.12;
    var inst = target - lastY;
    lastY = target;
    // smooth the velocity so the effect glides rather than flickers
    smVel += (inst - smVel) * 0.18;
    // normalize: ~90px/frame fling → 1.0. intensity (k) scales the ceiling.
    var vel = Math.min(1, Math.abs(smVel) / 90) * (0.5 + cinK * 0.8);
    // Skip the style writes when the value has not visibly moved.
    var velW = Math.round(vel * 200);
    if (velW !== lastVelW) {
      lastVelW = velW;
      root.style.setProperty("--cin-vel", vel.toFixed(3));
      root.style.setProperty("--cin-vig", (0.30 + vel * 0.5).toFixed(3));
    }
    // Expose the velocity weight to the universe for its FOV and aberration kick.
    window.__mo_vel = vel;
    // At rest there is no changing output. Sleep until the next scroll instead
    // of keeping a permanent page-wide animation callback alive.
    if (Math.abs(target - smoothY) > 0.05 || Math.abs(smVel) > 0.02 || Math.abs(inst) > 0.02) {
      raf = requestAnimationFrame(frame);
    } else window.__mo_vel = 0;
  }

  function wakeFrame() {
    if (!reduceMotion && !raf) raf = requestAnimationFrame(frame);
  }

  if (!reduceMotion) {
    window.addEventListener("scroll", wakeFrame, { passive: true });
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden) wakeFrame();
    });
  }

  /* ---------- boot (poll until React has mounted the title) ---------- */
  var tries = 0;
  function boot() {
    injectGrade();
    cinK = parseFloat(getComputedStyle(root).getPropertyValue("--cin-k")) || 0.67;
    var ok = revealTitle();
    if (!ok && tries++ < 80) { setTimeout(boot, 60); return; }
    wakeFrame();
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
