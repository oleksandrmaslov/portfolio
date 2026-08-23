/* ============================================================
   M.O. — CONTINUOUS FLIGHT · master scroll timeline
   ------------------------------------------------------------
   The stage-presence vars this file writes are now only the
   FALLBACK path — scroll-flight.css drives the same fades from
   the scroll offset itself (compositor, paint-synced) wherever the
   browser supports scroll-driven animations, so a dropped frame can no
   longer paint a sticky stage while it slides away.

   Timeline guarantees:

   TRANSIT AUTO-DOCK — stopping mid-transition used to strand the
   visitor on a nearly-empty stage with no cue that scrolling
   continues. Now, when the scroll RESTS inside a transit segment
   for a beat, the flight finishes the leg itself: it glides to
   the nearest station (forward past the midpoint, back before
   it). Any input — wheel, touch, key, pointer — cancels instantly
   and hands control back.

   The remaining timeline derives segment progress and coordinates the title
   exit stagger, stage presence, doppler wind, seam accents.
   Tuning: window.__mo_flightCfg { warp, style, doppler, dock }.
   ============================================================ */
(function () {
  /* The work reel's scroll geometry, mirrored from app/landing/sections/work.jsx:
     STOPS = featured + 2 (a title slot and the "show all" gate), PADS = 0.6,
     and progress 0 sits padN = PADS / (STOPS + PADS) into the section. Derived
     rather than typed so adding a featured node cannot leave the auto-dock
     landing on a half-panned title. */
  const REEL_PADS = 0.6;
  const reelPadN = () => {
    const stops = ((window.MO_FEATURED_ADDRS || []).length + 2) + REEL_PADS;
    return REEL_PADS / stops;
  };

  "use strict";

  var reduceMotion = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var clamp01 = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };
  var map = function (v, a, b, c, d) { return c + (d - c) * clamp01((v - a) / (b - a)); };
  var easeIO = function (t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; };
  var easeOut = function (t) { return 1 - Math.pow(1 - t, 3); };

  function cfg() {
    var c = window.__mo_flightCfg || {};
    return {
      warp: c.warp != null ? c.warp : 65,
      style: c.style || "surge",
      doppler: c.doppler !== false,
      dock: c.dock !== false,
    };
  }

  /* iris overlay — the "tunnel" seam style closes the edges in transit */
  var iris = null;
  function buildIris() {
    if (iris) return;
    iris = document.createElement("div");
    iris.className = "fl-iris";
    iris.setAttribute("aria-hidden", "true");
    document.body.appendChild(iris);
  }

  /* ---------- doppler wind (own tiny layer over MOSound's context) ---------- */
  var W = { built: false };
  function windBuild() {
    try {
      var MS = window.MOSound;
      if (!MS) return;
      var ctx = MS.ctx;
      if (!ctx) return;
      var len = ctx.sampleRate * 2;
      var buf = ctx.createBuffer(1, len, ctx.sampleRate);
      var d = buf.getChannelData(0);
      for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      W.src = ctx.createBufferSource(); W.src.buffer = buf; W.src.loop = true;
      W.bp = ctx.createBiquadFilter(); W.bp.type = "bandpass"; W.bp.frequency.value = 420; W.bp.Q.value = 0.85;
      W.lp = ctx.createBiquadFilter(); W.lp.type = "lowpass"; W.lp.frequency.value = 3400;
      W.g = ctx.createGain(); W.g.gain.value = 0;
      W.src.connect(W.bp); W.bp.connect(W.lp); W.lp.connect(W.g); W.g.connect(ctx.destination);
      W.src.start();
      // low body that BENDS with velocity — the felt doppler
      W.sub = ctx.createOscillator(); W.sub.type = "sine"; W.sub.frequency.value = 49;
      W.subG = ctx.createGain(); W.subG.gain.value = 0;
      W.sub.connect(W.subG); W.subG.connect(ctx.destination);
      W.sub.start();
      W.ctx = ctx;
      W.built = true;
    } catch (e) {}
  }
  function windUpdate(surge, C) {
    var MS = window.MOSound;
    var on = MS && !MS.isMuted() && C.doppler && !reduceMotion;
    if (on && !W.built) windBuild();
    if (!W.built) return;
    try {
      var t = W.ctx.currentTime;
      var s = clamp01(surge);
      var vol = MS && MS.getVolume ? MS.getVolume() : 0.5;
      // deliberately quiet — the transit swoosh is a whisper, not a wash
      W.g.gain.setTargetAtTime(on ? Math.pow(s, 1.6) * 0.045 * vol : 0, t, 0.09);
      W.bp.frequency.setTargetAtTime(320 + s * 2100, t, 0.11);
      W.src.playbackRate.setTargetAtTime(0.72 + s * 0.9, t, 0.12);
      W.subG.gain.setTargetAtTime(on ? Math.pow(s, 2) * 0.016 * vol : 0, t, 0.12);
      W.sub.frequency.setTargetAtTime(49 * (1 + s * 0.22), t, 0.1);
    } catch (e) {}
  }

  /* seam crossings — the carrier field acknowledges departures AND arrivals */
  var prevSeg = "title";
  function segChanged(seg) {
    var transit = seg === "toOrigin" || seg === "toWork" || seg === "toAbout";
    var arrived = !transit &&
      (prevSeg === "toOrigin" || prevSeg === "toWork" || prevSeg === "toAbout");
    try { window.dispatchEvent(new CustomEvent("mo:seam", { detail: { seg: seg, from: prevSeg } })); } catch (e) {}
    if (!transit && !arrived) return;
    var CF = window.CarrierField, MS = window.MOSound;
    var ok = CF && MS && !MS.isMuted() && CF.isWoken() && CF.ctx() && CF.ctx().state === "running";
    if (ok) {
      try {
        if (transit) { CF.carrierAccent(0.28); CF.scrollTrickle(110); }
        else CF.carrierAccent(0.18);            // soft "lock" on arrival
      } catch (e) {}
    }
    if (window.__mo_disturb && !reduceMotion && transit) {
      window.__mo_disturb(window.innerWidth / 2, layout.vh * 0.5, 0.5);
    }
  }

  /* ---------- stage presence (kills the sticky un-stick seams) ----------
     A stage is only visible while its container is PINNED: it dissolves in
     as the container's top edge arrives, and is fully gone before the
     container un-pins and physically slides. The slide still happens — on
     an empty, transparent stage.
     scroll-flight.css reproduces this curve as a scroll-driven animation
     and wins wherever it is supported; keep the two in sync. */
  function stagePresence(r, vh) {
    var inP = r.top >= vh * 0.5 ? 0 : r.top <= 0 ? 1 : 1 - r.top / (vh * 0.5);
    var over = r.bottom - vh; // px of track left below the viewport
    var outP = over >= vh * 0.5 ? 1 : over <= vh * 0.06 ? 0 : (over - vh * 0.06) / (vh * 0.44);
    return clamp01(Math.min(inP, outP));
  }

  /* ---------- coalesced layout snapshot ----------
     Section geometry is stable while scrolling, so keep it in document
     coordinates and derive viewport rects from scrollY. This keeps all
     layout reads out of the flight frame's CSS-var/class write phase. */
  var layout = {
    dirty: true,
    ready: false,
    raf: 0,
    destroyed: false,
    vh: 0,
    sections: null,
    observed: null,
    observer: null,
    view: {
      title: { top: 0, bottom: 0, height: 0 },
      origin: { top: 0, bottom: 0, height: 0 },
      work: { top: 0, bottom: 0, height: 0 },
      about: { top: 0, bottom: 0, height: 0 },
    },
  };

  function observeLayoutSections(elements) {
    if (!layout.observer) return;
    var prev = layout.observed;
    var same = prev && prev.length === elements.length;
    for (var i = 0; same && i < elements.length; i++) same = prev[i] === elements[i];
    if (same) return;
    layout.observer.disconnect();
    for (var j = 0; j < elements.length; j++) layout.observer.observe(elements[j]);
    layout.observed = elements.slice();
  }

  function measureLayout() {
    layout.raf = 0;
    if (layout.destroyed) return;

    var eT = document.getElementById("title");
    var eO = document.getElementById("intro");
    var eW = document.getElementById("work");
    var eA = document.getElementById("about");
    if (!eT || !eO || !eW || !eA) {
      layout.ready = false;
      layout.dirty = false;
      return;
    }

    // Keep the read phase together: one layout flush, never interleaved with
    // the per-frame style writes below.
    var vh = window.innerHeight;
    var y = window.scrollY;
    var rT = eT.getBoundingClientRect();
    var rO = eO.getBoundingClientRect();
    var rW = eW.getBoundingClientRect();
    var rA = eA.getBoundingClientRect();
    var hT = eT.offsetHeight;
    var hO = eO.offsetHeight;
    var hW = eW.offsetHeight;
    var hA = eA.offsetHeight;

    layout.vh = vh;
    layout.sections = {
      title: { el: eT, top: rT.top + y, height: rT.height, dockHeight: hT },
      origin: { el: eO, top: rO.top + y, height: rO.height, dockHeight: hO },
      work: { el: eW, top: rW.top + y, height: rW.height, dockHeight: hW },
      about: { el: eA, top: rA.top + y, height: rA.height, dockHeight: hA },
    };
    layout.ready = true;
    layout.dirty = false;
    observeLayoutSections([eT, eO, eW, eA]);
  }

  function scheduleLayoutMeasure() {
    if (layout.destroyed) return;
    layout.dirty = true;
    if (!layout.raf) layout.raf = requestAnimationFrame(measureLayout);
  }

  function syncViewportRect(out, src, y) {
    out.top = src.top - y;
    out.height = src.height;
    out.bottom = out.top + out.height;
  }

  function syncViewportRects(y) {
    var sections = layout.sections;
    var view = layout.view;
    syncViewportRect(view.title, sections.title, y);
    syncViewportRect(view.origin, sections.origin, y);
    syncViewportRect(view.work, sections.work, y);
    syncViewportRect(view.about, sections.about, y);
  }

  function destroyLayoutCache(event) {
    // Keep the cache alive for back/forward-cache restores.
    if (event && event.persisted) return;
    layout.destroyed = true;
    if (layout.raf) cancelAnimationFrame(layout.raf);
    layout.raf = 0;
    if (layout.observer) layout.observer.disconnect();
    window.removeEventListener("mo:title-ready", scheduleLayoutMeasure);
    window.removeEventListener("resize", scheduleLayoutMeasure);
    window.removeEventListener("orientationchange", scheduleLayoutMeasure);
    window.removeEventListener("pagehide", destroyLayoutCache);
  }

  if (window.ResizeObserver) layout.observer = new ResizeObserver(scheduleLayoutMeasure);
  window.addEventListener("mo:title-ready", scheduleLayoutMeasure);
  window.addEventListener("resize", scheduleLayoutMeasure, { passive: true });
  window.addEventListener("orientationchange", scheduleLayoutMeasure, { passive: true });
  window.addEventListener("pagehide", destroyLayoutCache);
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(scheduleLayoutMeasure, function () {});
  }

  /* ---------- TRANSIT AUTO-DOCK ----------
     If the scroll position rests inside a transit segment (~0.6s including
     the input cooldown), glide it to the station the leg was headed for:
     forward when the transit is past its midpoint, back otherwise. The
     glide is a plain rAF scroll animation — fully cancelled by any user
     input, never engaged while a pointer is down (scrollbar drags), during
     the wafer handoff, or in the mobile explore overlay. */
  var dock = { anim: null, idle: 0, lastY: -1, hold: 0, cool: 0 };
  function dockCancel() { dock.anim = null; dock.idle = 0; dock.cool = 260; }
  (function () {
    window.addEventListener("wheel", dockCancel, { passive: true, capture: true });
    window.addEventListener("keydown", dockCancel, { passive: true, capture: true });
    window.addEventListener("touchstart", dockCancel, { passive: true, capture: true });
    window.addEventListener("touchmove", dockCancel, { passive: true, capture: true });
    window.addEventListener("resize", dockCancel);
    window.addEventListener("pointerdown", function () { dock.hold++; dockCancel(); }, { passive: true, capture: true });
    var release = function () { dock.hold = Math.max(0, dock.hold - 1); };
    window.addEventListener("pointerup", release, { passive: true, capture: true });
    window.addEventListener("pointercancel", release, { passive: true, capture: true });
  })();
  function dockTarget(seg, fwd, sections, vh) {
    if (seg === "toOrigin") return fwd
      ? sections.origin.top + 0.25 * (sections.origin.dockHeight - vh) // origin: first line resolved
      : sections.title.top + 0.20 * sections.title.dockHeight;         // title still framed
    if (seg === "toWork") return fwd
      // reel TITLE stop exactly: progress 0 sits at padN = PADS/TOTAL_V into
      // the section — 0.15 overshot it and left the "Selected work." title
      // panned half off-screen after auto-dock. DERIVED, not typed: TOTAL_V
      // counts the featured nodes, so a literal here silently desyncs the
      // moment MO_FEATURED_ADDRS gains or loses an address.
      ? sections.work.top + reelPadN() * (sections.work.dockHeight - vh)
      : sections.origin.top + 0.80 * (sections.origin.dockHeight - vh); // origin hold (pre lift-off)
    return fwd
      ? sections.about.top + 0.065 * (sections.about.dockHeight - vh) // about node-card resolved
      : sections.work.top + 0.90 * (sections.work.dockHeight - vh);   // last reel stops
  }
  function dockUpdate(seg, t, dt, sections, vh, now, enabled) {
    var b = document.body;
    if (!enabled || b.classList.contains("wf-flying") || b.classList.contains("mo-explore")) {
      dock.anim = null; dock.idle = 0; return;
    }
    if (dock.cool > 0) dock.cool -= dt;
    var y = window.scrollY;
    if (dock.anim) {
      var a = dock.anim;
      var k = clamp01((now - a.t0) / a.dur);
      window.scrollTo(0, a.from + (a.to - a.from) * easeIO(k));
      if (k >= 1) { dock.anim = null; dock.cool = 500; dock.idle = 0; dock.lastY = a.to; }
      return;
    }
    var inTransit = seg === "toOrigin" || seg === "toWork" || seg === "toAbout";
    if (!inTransit || dock.hold > 0 || dock.cool > 0) { dock.idle = 0; dock.lastY = y; return; }
    if (Math.abs(y - dock.lastY) < 0.6) dock.idle += dt; else dock.idle = 0;
    dock.lastY = y;
    if (dock.idle < 360) return;
    var to = dockTarget(seg, t >= 0.5, sections, vh);
    var dist = Math.abs(to - y);
    if (dist < 2) { dock.idle = 0; return; }
    dock.anim = {
      from: y, to: to, t0: now,
      dur: reduceMotion ? 160 : Math.max(420, Math.min(1000, dist * 0.55)),
    };
  }

  /* ---------- CSS var writer (only touch the DOM when a value moves) ---------- */
  var root = document.documentElement;
  var lastVars = {};
  function setVar(name, v) {
    var q = Math.round(v * 500) / 500;
    if (lastVars[name] === q) return;
    lastVars[name] = q;
    root.style.setProperty(name, String(q));
  }
  var bodyClasses = {};
  function setBodyClass(name, on) {
    if (bodyClasses[name] === on) return;
    bodyClasses[name] = on;
    document.body.classList.toggle(name, on);
  }

  /* ---------- main loop ---------- */
  var railS = 0, speedSm = 0, surgeSm = 0;
  var lastT = performance.now();
  var cinStripped = false;

  function frame(now) {
    requestAnimationFrame(frame);
    if (document.hidden) { lastT = now; return; }
    var dt = Math.min(80, now - lastT);
    lastT = now;
    var C = cfg();

    if (!layout.ready || layout.dirty) {
      scheduleLayoutMeasure();
      return; // React not mounted yet, or a coalesced read phase is pending
    }
    buildIris();

    var vh = layout.vh;
    var y = window.scrollY;
    syncViewportRects(y);
    var sections = layout.sections;
    var eT = sections.title.el;
    var rT = layout.view.title;
    var rO = layout.view.origin;
    var rW = layout.view.work;
    var rA = layout.view.about;
    var pT = clamp01(-rT.top / Math.max(1, rT.height));
    var pO = clamp01(-rO.top / Math.max(1, rO.height - vh));
    var pW = clamp01(-rW.top / Math.max(1, rW.height - vh));
    var pA = clamp01(-rA.top / Math.max(1, rA.height - vh));
    var mW = clamp01(1 - rW.top / vh);   // work top approaching the viewport top
    var mA = clamp01(1 - rA.top / vh);

    /* ── segment + local t (monotone, fully reversible) ──
       Transits are SHORT: they engage late and lock early, so most of the
       scroll budget belongs to the stations themselves. */
    var seg, t;
    if (pA > 0.05) { seg = "about"; t = 1; }
    else if (pW >= 0.955 || mA > 0.001) {
      seg = "toAbout";
      t = pW < 1 ? map(pW, 0.955, 1, 0, 0.42)
        : pA <= 0 ? map(mA, 0, 1, 0.42, 0.9)
        : map(pA, 0, 0.05, 0.9, 1);
    } else if (pW > 0.085) { seg = "work"; t = map(pW, 0.085, 0.955, 0, 1); }
    else if (pO >= 0.9 || mW > 0.001) {
      seg = "toWork";
      t = pO < 1 ? map(pO, 0.9, 1, 0, 0.45)
        : pW <= 0 ? map(mW, 0, 1, 0.45, 0.86)
        : map(pW, 0, 0.085, 0.86, 1);
    } else if (pO > 0.2) { seg = "origin"; t = map(pO, 0.2, 0.9, 0, 1); }
    else if (pT >= 0.34 || pO > 0.001) {
      seg = "toOrigin";
      t = pO <= 0 ? map(pT, 0.34, 1, 0, 0.62) : map(pO, 0, 0.2, 0.62, 1);
    } else { seg = "title"; t = clamp01(pT / 0.34); }

    if (seg !== prevSeg) { segChanged(seg); prevSeg = seg; }

    /* ── transit auto-dock — finish the leg if the visitor rests mid-transit ── */
    dockUpdate(seg, t, dt, sections, vh, now, C.dock);

    /* ── rail distance → speed → surge (station spacing matches the
           universe rig: 13 / +15 / +16) ── */
    var S = seg === "title" ? 0
      : seg === "toOrigin" ? 13 * easeIO(t)
      : seg === "origin" ? 13
      : seg === "toWork" ? 13 + 15 * easeIO(t)
      : seg === "work" ? 28
      : seg === "toAbout" ? 28 + 16 * easeIO(t)
      : 44;
    var speed = Math.abs(S - railS) / Math.max(0.001, dt / 1000);
    railS = S;
    speedSm += (Math.min(40, speed) - speedSm) * (1 - Math.pow(0.86, dt / 16));
    var cinV = Math.min(1, window.__mo_vel || 0);
    var surge = clamp01(speedSm / 11 + cinV * 0.2);
    surgeSm += (surge - surgeSm) * (1 - Math.pow(0.85, dt / 16));

    var styleMul = C.style === "calm" ? 0.3 : C.style === "tunnel" ? 0.9 : 1;
    var warp = reduceMotion ? 0 : surgeSm * styleMul * (C.warp / 100);
    var inTransit = seg === "toOrigin" || seg === "toWork" || seg === "toAbout";
    var irisV = 0;
    if (C.style === "tunnel" && inTransit && !reduceMotion) {
      irisV = Math.pow(Math.sin(Math.PI * clamp01(t)), 1.4) * 0.9;
    }

    /* ── publish the flight bridge (the universe rig reads this) ── */
    var FL = (window.__mo_flight = window.__mo_flight || {});
    FL.seg = seg; FL.t = t; FL.speed = speedSm; FL.surge = surgeSm;
    FL.warp = warp;

    /* ── title exit choreography ── */
    var exitP = clamp01((pT - 0.05) / 0.85);
    var a = easeOut(exitP);
    var b = easeIO(clamp01((exitP - 0.08) / 0.82));
    var c2 = easeIO(clamp01((exitP - 0.16) / 0.74));
    window.__mo_titleExit = reduceMotion ? (exitP > 0.5 ? 1 : 0) : a;
    setVar("--flt-a", reduceMotion ? 0 : a);
    setVar("--flt-b", reduceMotion ? 0 : b);
    setVar("--flt-c", reduceMotion ? 0 : c2);
    setVar("--fl-title", 1 - clamp01((exitP - 0.5) / 0.45));
    setBodyClass("fl-titleDim", exitP > 0.3);
    setBodyClass("fl-titleGone", exitP > 0.97);
    // strip the one-shot entrance reveal animations the first time the exit
    // engages — their forwards-fill would otherwise pin opacity/transform
    // and the staggered lift could never take hold.
    if (!cinStripped && exitP > 0.02) {
      cinStripped = true;
      var revealed = eT.querySelectorAll(".cin-reveal");
      for (var i = 0; i < revealed.length; i++) revealed[i].classList.remove("cin-reveal");
    }

    /* ── stage presence for the sticky sections ── */
    setVar("--fl-origin", stagePresence(rO, vh));
    setVar("--fl-work", stagePresence(rW, vh));
    setVar("--fl-iris", irisV);

    /* ── sound ── */
    windUpdate(surgeSm, C);
  }

  function boot() {
    buildIris();
    scheduleLayoutMeasure();
    requestAnimationFrame(frame);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
