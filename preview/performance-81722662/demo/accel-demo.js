/* ============================================================
   M.O. SYSTEM — POINTACCEL DEMO CONTROLLER  ·  node 0x03
   ------------------------------------------------------------
   2D canvas demo of the REAL firmware math — a 1:1 JS port of
   src/input_processor_accel.c (zmk-pointing-acceleration):

     · compute_factor_scaled()  — integer math, SCALE = 1000
     · per-axis cps = |raw| * 1000 / dt_ms   (dt clamped 1..100)
     · direction-reversal clamp (factor → 1.0 on sign flip)
     · track-remainders sub-pixel accumulator (thousandths)

   Move YOUR cursor in the test zone: a RAW ghost replays your
   exact deltas, the ACCEL cursor replays them through the
   processor. The split between them is the curve, felt.

   window.AccelDemo: start/stop/skip · setParams/setPreset ·
     recenter() · dtSnippet() · toggleSound() · on/off · state
   Events: phase · boot · tele · params · preset · sound · action
   ============================================================ */
(function () {
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;

  window.__demoTweaks = window.__demoTweaks || { soundLevel: 0.8, hud: "full", cpiScale: 2 };

  const SCALE = 1000;

  const PRESETS = {
    LIGHT:   { minFactor: 1000, maxFactor: 2000, speedThreshold: 1200, speedMax: 6000, exponent: 1, trackRemainders: true },
    DEFAULT: { minFactor: 1000, maxFactor: 3500, speedThreshold: 1000, speedMax: 6000, exponent: 1, trackRemainders: true },
    HEAVY:   { minFactor:  800, maxFactor: 5000, speedThreshold:  800, speedMax: 5000, exponent: 2, trackRemainders: true },
    FLAT:    { minFactor: 1000, maxFactor: 1000, speedThreshold: 1000, speedMax: 6000, exponent: 1, trackRemainders: false },
  };

  const BOOT_LINES = [
    "ZMK POINTACCEL · LIVE DEMO · v0.3",
    "PORT · input_processor_accel.c · 1:1 INTEGER MATH",
    "CURVE · compute_factor_scaled() · SCALE 1000",
    "AUDIO · 0X00 FIELD · NODE 0X03 SHADE · GLIDE GRAINS",
    "ATTACHING POINTER —",
  ];

  /* ---------------- firmware port ---------------- */
  function powScaled(t, exp) {
    t = clamp(t, 0, SCALE);
    if (exp <= 1) return t;
    let acc = t;
    for (let i = 1; i < exp; i++) acc = Math.floor((acc * t) / SCALE);
    return acc;
  }

  function computeFactorScaled(cfg, cps) {
    const fMin = clamp(cfg.minFactor, 100, 20000);
    const fMax = clamp(cfg.maxFactor, fMin, 20000);
    const v1 = cfg.speedThreshold;
    const v2 = cfg.speedMax > v1 ? cfg.speedMax : v1 + 1;
    const e = cfg.exponent || 1;
    const base = fMin > 1000 ? fMin : 1000;

    if (cps <= v1) {
      const t = v1 === 0 ? SCALE : Math.floor((cps * SCALE) / v1);
      const shaped = powScaled(t, e);
      const span = base - fMin;
      const f = fMin + Math.floor((span * shaped) / SCALE);
      return clamp(f, fMin, base);
    } else if (cps >= v2) {
      return fMax;
    } else {
      const t = Math.floor(((cps - v1) * SCALE) / (v2 - v1));
      const shaped = powScaled(t, e);
      const span = fMax - base;
      const f = base + Math.floor((span * shaped) / SCALE);
      return clamp(f, base, fMax);
    }
  }

  /* ---------------- state ---------------- */
  let mountEl = null, canvas = null, cctx = null, W = 0, H = 0, dpr = 1;
  let active = false, raf = 0, lastT = 0, inited = false;
  let sound = null;

  const st = {
    phase: "idle",
    direction: "cinematic",
    soundOn: true,
    introT: 0,
    preset: "DEFAULT",
    params: { ...PRESETS.DEFAULT },
    lastAction: null,
  };

  /* per-axis processor state (mirrors struct accel_data) */
  const axis = {
    lastTime: [0, 0],
    lastPhys: [0, 0],
    remainders: [0, 0],
  };

  /* cursors + trails (in canvas px) */
  const cur = { raw: { x: 0, y: 0 }, acc: { x: 0, y: 0 } };
  let trailRaw = [], trailAcc = [];
  let lastMoveAt = 0, recentering = false;
  let tele = { cps: 0, factor: 1000, rawD: 0, outD: 0 };
  let teleSmooth = { cps: 0, factor: 1000 };
  let lastPointer = null;

  const subs = {};
  const on = (ev, cb) => ((subs[ev] = subs[ev] || []).push(cb), cb);
  const off = (ev, cb) => { subs[ev] = (subs[ev] || []).filter((f) => f !== cb); };
  const emit = (ev, d) => (subs[ev] || []).forEach((f) => f(d));
  const action = (l) => { st.lastAction = l; emit("action", l); };

  /* ---------------- the processor: one event per axis ---------------- */
  function processDelta(idx, raw, nowMs) {
    const cfg = st.params;
    if (raw === 0) { axis.lastTime[idx] = nowMs; return 0; }
    let dt = 1;
    if (axis.lastTime[idx] > 0 && nowMs > axis.lastTime[idx]) {
      dt = Math.min(100, nowMs - axis.lastTime[idx]);
    }
    const cps = Math.floor((Math.abs(raw) * 1000) / dt);
    let factor = computeFactorScaled(cfg, cps);
    /* direction-reversal clamp */
    if (axis.lastPhys[idx] * raw < 0 && factor > 1000) factor = 1000;

    let out;
    if (cfg.trackRemainders) {
      const total = raw * factor + axis.remainders[idx];
      out = Math.trunc(total / SCALE);
      axis.remainders[idx] = total - out * SCALE;
    } else {
      out = Math.trunc((raw * factor) / SCALE);
    }
    axis.lastPhys[idx] = raw;
    axis.lastTime[idx] = nowMs;

    if (idx === 0 || Math.abs(raw) > Math.abs(tele.rawD)) {
      tele.cps = cps; tele.factor = factor;
    }
    return out;
  }

  function feed(dx, dy, nowMs) {
    const k = (window.__demoTweaks || {}).cpiScale || 2;
    const rx = Math.round(dx * k), ry = Math.round(dy * k);
    tele.rawD = rx;
    const ox = processDelta(0, rx, nowMs);
    const oy = processDelta(1, ry, nowMs);
    tele.outD = ox;

    /* both cursors replay in zone px (de-scale by k) */
    cur.raw.x = clamp(cur.raw.x + rx / k, 24, W - 24);
    cur.raw.y = clamp(cur.raw.y + ry / k, 24, H - 24);
    cur.acc.x = clamp(cur.acc.x + ox / k, 24, W - 24);
    cur.acc.y = clamp(cur.acc.y + oy / k, 24, H - 24);
    trailRaw.push({ x: cur.raw.x, y: cur.raw.y, a: 1 });
    trailAcc.push({ x: cur.acc.x, y: cur.acc.y, a: 1 });
    lastMoveAt = nowMs;
    recentering = false;

    if (tele.factor >= st.params.maxFactor && st.params.maxFactor > 1000 && sound) sound.maxPing();
  }

  /* ---------------- input ---------------- */
  function bindInput() {
    canvas.addEventListener("pointermove", (e) => {
      if (!active || st.phase !== "live") return;
      if (lastPointer) {
        feed(e.clientX - lastPointer.x, e.clientY - lastPointer.y, performance.now());
      }
      lastPointer = { x: e.clientX, y: e.clientY };
    });
    canvas.addEventListener("pointerleave", () => { lastPointer = null; });
    canvas.addEventListener("pointerdown", (e) => {
      lastPointer = { x: e.clientX, y: e.clientY };
      try { canvas.setPointerCapture?.(e.pointerId); } catch (_) {}
    });
  }

  /* ---------------- drawing ---------------- */
  const C_SIGNAL = "#00f0c8", C_BONE = "#e8e4da", C_GHOST = "rgba(232,228,218,0.38)", C_HAIR = "rgba(232,228,218,0.13)";

  function drawCurvePanel(now) {
    const cfg = st.params;
    const pw = Math.min(320, W * 0.4), ph = Math.min(180, H * 0.3);
    const px0 = 28, py0 = H - 28 - ph;
    cctx.save();

    cctx.strokeStyle = C_HAIR;
    cctx.strokeRect(px0, py0, pw, ph);
    cctx.fillStyle = "rgba(5,7,11,0.72)";
    cctx.fillRect(px0, py0, pw, ph);

    const cpsMax = Math.max(cfg.speedMax * 1.25, 8000);
    const fTop = Math.max(cfg.maxFactor, 4000) * 1.1;
    const X = (cps) => px0 + (cps / cpsMax) * pw;
    const Y = (f) => py0 + ph - (f / fTop) * ph;

    /* threshold + vmax guides */
    cctx.strokeStyle = "rgba(232,228,218,0.2)";
    cctx.setLineDash([3, 4]);
    [[cfg.speedThreshold, "V1"], [cfg.speedMax, "V2"]].forEach(([v, lbl]) => {
      cctx.beginPath(); cctx.moveTo(X(v), py0); cctx.lineTo(X(v), py0 + ph); cctx.stroke();
      cctx.fillStyle = "rgba(232,228,218,0.4)";
      cctx.font = "9px 'Geist Mono', monospace";
      cctx.fillText(lbl, X(v) + 3, py0 + 11);
    });
    /* 1.0x line */
    cctx.beginPath(); cctx.moveTo(px0, Y(1000)); cctx.lineTo(px0 + pw, Y(1000)); cctx.stroke();
    cctx.setLineDash([]);
    cctx.fillText("1.0×", px0 + 4, Y(1000) - 4);

    /* the curve — exact factor function */
    cctx.strokeStyle = C_SIGNAL;
    cctx.lineWidth = 1.5;
    cctx.beginPath();
    for (let i = 0; i <= 80; i++) {
      const cps = (i / 80) * cpsMax;
      const f = computeFactorScaled(cfg, Math.round(cps));
      i === 0 ? cctx.moveTo(X(cps), Y(f)) : cctx.lineTo(X(cps), Y(f));
    }
    cctx.stroke();
    cctx.lineWidth = 1;

    /* live dot */
    teleSmooth.cps = lerp(teleSmooth.cps, tele.cps, 0.18);
    teleSmooth.factor = lerp(teleSmooth.factor, tele.factor, 0.18);
    const dx = X(Math.min(teleSmooth.cps, cpsMax)), dy = Y(teleSmooth.factor);
    cctx.fillStyle = C_BONE;
    cctx.beginPath(); cctx.arc(dx, dy, 3.5, 0, Math.PI * 2); cctx.fill();
    cctx.strokeStyle = "rgba(0,240,200,0.5)";
    cctx.beginPath(); cctx.arc(dx, dy, 7 + Math.sin(now * 0.008) * 1.5, 0, Math.PI * 2); cctx.stroke();

    /* labels */
    cctx.fillStyle = "rgba(232,228,218,0.55)";
    cctx.font = "9px 'Geist Mono', monospace";
    cctx.fillText("FACTOR × CPS · compute_factor_scaled()", px0 + 6, py0 + ph - 6);
    cctx.restore();
  }

  function drawZone(now) {
    /* center cross */
    cctx.strokeStyle = C_HAIR;
    cctx.setLineDash([2, 6]);
    cctx.beginPath();
    cctx.moveTo(W / 2, H * 0.18); cctx.lineTo(W / 2, H * 0.82);
    cctx.moveTo(W * 0.22, H / 2); cctx.lineTo(W * 0.78, H / 2);
    cctx.stroke();
    cctx.setLineDash([]);

    /* trails */
    const drawTrail = (trail, color, width) => {
      cctx.lineWidth = width;
      for (let i = 1; i < trail.length; i++) {
        const p0 = trail[i - 1], p1 = trail[i];
        cctx.strokeStyle = color.replace("$A", (p1.a * 0.5).toFixed(3));
        cctx.beginPath(); cctx.moveTo(p0.x, p0.y); cctx.lineTo(p1.x, p1.y); cctx.stroke();
      }
      cctx.lineWidth = 1;
    };
    drawTrail(trailRaw, "rgba(232,228,218,$A)", 1);
    drawTrail(trailAcc, "rgba(0,240,200,$A)", 1.5);

    /* raw ghost cursor */
    cctx.strokeStyle = C_GHOST;
    cctx.beginPath(); cctx.arc(cur.raw.x, cur.raw.y, 7, 0, Math.PI * 2); cctx.stroke();
    cctx.beginPath();
    cctx.moveTo(cur.raw.x - 11, cur.raw.y); cctx.lineTo(cur.raw.x - 4, cur.raw.y);
    cctx.moveTo(cur.raw.x + 4, cur.raw.y); cctx.lineTo(cur.raw.x + 11, cur.raw.y);
    cctx.moveTo(cur.raw.x, cur.raw.y - 11); cctx.lineTo(cur.raw.x, cur.raw.y - 4);
    cctx.moveTo(cur.raw.x, cur.raw.y + 4); cctx.lineTo(cur.raw.x, cur.raw.y + 11);
    cctx.stroke();
    cctx.fillStyle = C_GHOST;
    cctx.font = "9px 'Geist Mono', monospace";
    cctx.fillText("RAW", cur.raw.x + 12, cur.raw.y - 10);

    /* accel cursor */
    const glow = 0.55 + clamp((teleSmooth.factor - 1000) / 4000, 0, 1) * 0.45;
    cctx.fillStyle = `rgba(0,240,200,${glow})`;
    cctx.beginPath(); cctx.arc(cur.acc.x, cur.acc.y, 5.5, 0, Math.PI * 2); cctx.fill();
    cctx.strokeStyle = "rgba(0,240,200,0.6)";
    cctx.beginPath(); cctx.arc(cur.acc.x, cur.acc.y, 10, 0, Math.PI * 2); cctx.stroke();
    cctx.fillStyle = "rgba(0,240,200,0.85)";
    cctx.fillText("ACCEL ×" + (teleSmooth.factor / 1000).toFixed(2), cur.acc.x + 14, cur.acc.y - 10);
  }

  function draw(now) {
    cctx.clearRect(0, 0, W, H);
    drawZone(now);
    drawCurvePanel(now);
  }

  /* ---------------- intro (scripted figure-8) ---------------- */
  let bootIdx = 0, handed = false;
  function introScale() { return st.direction === "sandbox" ? 0.4 : 1; }

  function runIntro(dt, now) {
    st.introT += dt / 1000;
    const t = st.introT / introScale();
    const beats = [0.13, 0.5, 0.87, 1.24, 1.61];
    while (bootIdx < BOOT_LINES.length && t > beats[bootIdx]) {
      emit("boot", BOOT_LINES[bootIdx]);
      if (sound) sound.bootTick();
      bootIdx++;
    }
    /* ghost hand: drive a figure-8 with varying speed so the split shows */
    if (t > 1.4 && st.phase === "intro") {
      const p = (t - 1.4) * 1.7;
      const sp = 1 + Math.sin(p * 1.8) * 0.9;            // speed swells
      const gx = Math.sin(p * 2) * 90 * sp, gy = Math.sin(p * 4) * 46 * sp;
      if (runIntro._g) feed(gx - runIntro._g.x, gy - runIntro._g.y, performance.now());
      runIntro._g = { x: gx, y: gy };
    }
    if (!handed && t >= 4.6) handOver(false);
  }

  function handOver(skipped) {
    handed = true;
    st.phase = "live";
    runIntro._g = null;
    if (skipped) recenter(true);
    emit("phase", "live");
    action("POINTER ATTACHED · MOVE IN THE ZONE");
  }

  /* ---------------- loop ---------------- */
  function frame(now) {
    const dt = Math.min(60, now - (lastT || now)); lastT = now;

    if (st.phase === "intro") runIntro(dt, now);

    /* trail decay */
    const dk = dt / 900;
    trailRaw.forEach((p) => (p.a -= dk));
    trailAcc.forEach((p) => (p.a -= dk));
    trailRaw = trailRaw.filter((p) => p.a > 0).slice(-400);
    trailAcc = trailAcc.filter((p) => p.a > 0).slice(-400);

    /* idle recenter */
    if (st.phase === "live" && now - lastMoveAt > 1700 && !recentering) recentering = true;
    if (recentering) {
      const k = Math.min(1, dt / 320);
      cur.raw.x = lerp(cur.raw.x, W / 2, k); cur.raw.y = lerp(cur.raw.y, H / 2, k);
      cur.acc.x = lerp(cur.acc.x, W / 2, k); cur.acc.y = lerp(cur.acc.y, H / 2, k);
      teleSmooth.cps = lerp(teleSmooth.cps, 0, k);
      teleSmooth.factor = lerp(teleSmooth.factor, 1000, k);
      tele.cps = 0; tele.factor = 1000;
    }

    /* sound follows live motion */
    if (sound && st.phase !== "idle") {
      const speedN = clamp(teleSmooth.cps / Math.max(st.params.speedMax, 1), 0, 1);
      const factorN = clamp((teleSmooth.factor - 1000) / Math.max(st.params.maxFactor - 1000, 1), 0, 1);
      sound.setMotion(speedN, factorN);
    }

    /* telemetry to HUD ~8Hz */
    if (!frame._te || now - frame._te > 120) {
      frame._te = now;
      emit("tele", { cps: Math.round(teleSmooth.cps), factor: teleSmooth.factor / 1000, rawD: tele.rawD, outD: tele.outD });
    }

    draw(now);
    if (active) raf = requestAnimationFrame(frame);
  }

  /* ---------------- canvas mgmt ---------------- */
  function initCanvas() {
    if (inited) return true;
    if (!mountEl) return false;
    canvas = document.createElement("canvas");
    canvas.className = "hvd2-canvas";
    mountEl.appendChild(canvas);
    cctx = canvas.getContext("2d");
    const ro = new ResizeObserver(resize);
    ro.observe(mountEl);
    resize();
    bindInput();
    inited = true;
    return true;
  }

  function resize() {
    if (!canvas || !mountEl) return;
    dpr = Math.min(window.devicePixelRatio, 2);
    W = mountEl.clientWidth || 1;
    H = mountEl.clientHeight || 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    cctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function recenter(silent) {
    cur.raw.x = cur.acc.x = W / 2;
    cur.raw.y = cur.acc.y = H / 2;
    trailRaw = []; trailAcc = [];
    axis.lastTime = [0, 0]; axis.lastPhys = [0, 0]; axis.remainders = [0, 0];
    if (!silent) action("CURSORS RECENTERED");
  }

  /* ---------------- public API ---------------- */
  const api = {
    on, off,
    get state() { return st; },
    get params() { return { ...st.params }; },

    start(opts = {}) {
      mountEl = opts.mount || mountEl;
      if (!initCanvas()) return false;
      active = true;
      st.direction = opts.direction || "cinematic";
      st.phase = "intro"; st.introT = 0;
      bootIdx = 0; handed = false; runIntro._g = null;
      st.lastAction = null;
      recenter(true);

      const reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (!sound) sound = window.makeAccelDemoSound();
      const saved = localStorage.getItem("mo_demo_sound");
      st.soundOn = saved == null ? true : saved === "1";
      sound.setMuted(!st.soundOn);
      sound.setLevel((window.__demoTweaks || {}).soundLevel || 0.8);
      sound.start();

      lastT = 0;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(frame);
      emit("phase", "intro");
      emit("params", api.params);
      emit("preset", st.preset);
      if (reduced) api.skip();
      return true;
    },

    skip() {
      if (st.phase !== "intro") return;
      emit("boot", "— SKIPPED");
      handOver(true);
    },

    stop() {
      if (!active) return;
      st.phase = "exit";
      emit("phase", "exit");
      if (sound) sound.stop();
      lastPointer = null;
      setTimeout(() => { active = false; cancelAnimationFrame(raf); st.phase = "idle"; }, 480);
    },

    setPreset(name) {
      if (!PRESETS[name]) return;
      st.preset = name;
      st.params = { ...PRESETS[name] };
      axis.remainders = [0, 0];
      if (sound) sound.presetTick();
      emit("preset", name);
      emit("params", api.params);
      action("PRESET · " + name);
    },

    setParam(key, value) {
      st.params[key] = value;
      st.preset = "CUSTOM";
      emit("preset", "CUSTOM");
      emit("params", api.params);
      if (sound) sound.uiTick("on");
    },

    recenter: () => recenter(false),

    dtSnippet() {
      const p = st.params;
      return [
        "&trackpad_listener {",
        "    input-processors = <&pointer_accel>;",
        "};",
        "",
        "pointer_accel: pointer_accel {",
        '    compatible = "zmk,input-processor-acceleration";',
        "    input-type = <INPUT_EV_REL>;",
        ...(p.trackRemainders ? ["    track-remainders;"] : []),
        `    min-factor = <${p.minFactor}>;`,
        `    max-factor = <${p.maxFactor}>;`,
        `    speed-threshold = <${p.speedThreshold}>;`,
        `    speed-max = <${p.speedMax}>;`,
        `    acceleration-exponent = <${p.exponent}>;`,
        "};",
      ].join("\n");
    },
    emitFx() { if (sound) sound.emitFx(); },

    toggleSound() {
      st.soundOn = !st.soundOn;
      localStorage.setItem("mo_demo_sound", st.soundOn ? "1" : "0");
      if (sound) sound.setMuted(!st.soundOn);
      emit("sound", st.soundOn);
      return st.soundOn;
    },
    setSoundLevel(v) { if (sound) sound.setLevel(v); },
    isActive() { return active; },
  };

  window.addEventListener("keydown", (e) => {
    if (!active) return;
    if (st.phase === "intro" && (e.key === " " || e.key === "Enter")) { e.preventDefault(); api.skip(); }
  }, true);

  window.AccelDemo = api;
})();
