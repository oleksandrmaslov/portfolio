/* ============================================================
   M.O. — v13 CONTINUOUS FLIGHT · master scroll timeline
   ------------------------------------------------------------
   The page is ONE journey. This file reads the four section
   tracks every frame and derives a single flight state:

     seg   title → toOrigin → origin → toWork → work → toAbout → about
     t     0..1 within the segment (raw; consumers ease)

   From it, every frame:
     · window.__mo_flight = { P, seg, t, speed, surge, warp }
       — the universe (landing_v13/universe.jsx) reads this for the
       transit glide (free-camera forward ride) and the FOV/aberration
       surge. All formations stay camera-centered — v12 guarantees.
     · window.__mo_titleExit — the ASCII wordmark dissolve amount.
     · CSS vars on :root — --fl-title/--flt-a/b/c (title exit stagger),
       --fl-origin/--fl-work (stage presence: stages are ALWAYS empty
       before their sticky containers slide — no more screen-to-screen
       un-stick seams), --fl-iris (tunnel seam style).
     · body classes — fl-titleDim / fl-titleGone / fl-noHud.
     · the unified flight HUD (SECTOR / STATE / COORD / HDG / VEL) —
       replaces the per-section chrome so the whole page reads as one
       instrument. Values interpolate continuously across the scroll.
     · doppler wind — filtered noise + a bending sub tone that ride the
       rail velocity (gated by the sound toggle; own gain, no engine
       changes). Seam crossings accent the carrier field.

   Tuning lives in window.__mo_flightCfg (optional override):
     { warp: 0..200, style: "surge"|"tunnel"|"calm", doppler: bool }
   ============================================================ */
(function () {
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
      grab: c.grab != null ? c.grab : 1,
      doppler: c.doppler !== false,
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
      window.__mo_disturb(window.innerWidth / 2, window.innerHeight * 0.5, 0.5);
    }
  }

  /* ---------- stage presence (kills the sticky un-stick seams) ----------
     A stage is only visible while its container is PINNED: it dissolves in
     as the container's top edge arrives, and is fully gone before the
     container un-pins and physically slides. The slide still happens — on
     an empty, transparent stage. */
  function stagePresence(r, vh) {
    var inP = r.top >= vh * 0.5 ? 0 : r.top <= 0 ? 1 : 1 - r.top / (vh * 0.5);
    var over = r.bottom - vh; // px of track left below the viewport
    var outP = over >= vh * 0.5 ? 1 : over <= vh * 0.06 ? 0 : (over - vh * 0.06) / (vh * 0.44);
    return clamp01(Math.min(inP, outP));
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
    var vh = window.innerHeight;

    var eT = document.getElementById("title");
    var eO = document.getElementById("intro");
    var eW = document.getElementById("work");
    var eA = document.getElementById("about");
    if (!eT || !eO || !eW || !eA) return;   // React not mounted yet
    buildIris();

    var rT = eT.getBoundingClientRect();
    var rO = eO.getBoundingClientRect();
    var rW = eW.getBoundingClientRect();
    var rA = eA.getBoundingClientRect();
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
    requestAnimationFrame(frame);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
