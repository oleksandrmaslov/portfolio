/* ============================================================
   M.O. SYSTEM — WAFER DEMO CONTROLLER
   ------------------------------------------------------------
   Owns the fullscreen demo stage: renderer, camera, the
   procedural board, the choreographed intro, free-orbit input,
   pressable keys (physical keyboard + click), explode slider,
   layers, view modes, turntable, and the sound hooks.

   window.WaferDemo:
     start({ mount, direction })  · stop() · skip()
     setExplode(v) · setLayer(i) · setMode(m) · setTurntable(b)
     toggleSound() · resetView() · on(ev, cb) · off(ev, cb)
   Events: phase · boot · key · typed · layer · mode ·
           turntable · explode · sound
   ============================================================ */
(function () {
  const SIGNAL = 0x00f0c8;
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ease = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;   // in-out cubic
  const damp = (cur, tgt, rate, dt) => lerp(cur, tgt, 1 - Math.pow(1 - rate, dt / 16));

  /* live tweak surface (written by the Tweaks panel) */
  window.__waferDemoTweaks = window.__waferDemoTweaks || {
    explodeDist: 1, stagger: 0.65, thockPitch: 1, soundLevel: 0.8, hud: "full",
  };

  const CAM_HOME = { yaw: -0.5, pitch: 0.46, dist: 5.7 };

  /* intro boot lines (HUD console) */
  const BOOT_LINES = [
    "WAFER · LIVE DEMO · v0.9",
    "GEOMETRY · PROCEDURAL MOCK · AWAITING REAL GLB",
    "MATRIX 6×6 · ZMK · NRF52840",
    "AUDIO · 0X00 FIELD · NODE 0X01 SHADE",
    "ASSEMBLING —",
  ];

  let inited = false, renderer, scene, camera, board, raycaster, pointerV;
  let mountEl = null, active = false, raf = 0, lastT = 0;
  let sound = null;
  let lookX = 0;                 // shifts the board left of the console rail

  const cam = { ...CAM_HOME, y: 0.05 };
  const camT = { ...cam };

  const st = {
    phase: "idle",            // idle | intro | live | exit
    explodeT: 0,              // target (slider)
    explodeC: 0,              // current eased
    layer: 0,
    mode: "solid",
    turntable: false,
    typed: "",
    count: 0,
    lastKey: null,
    soundOn: true,
    introT: 0,
    introDur: 6.4,
    direction: "cinematic",
  };

  /* ---------------- tiny event emitter ---------------- */
  const subs = {};
  const on = (ev, cb) => ((subs[ev] = subs[ev] || []).push(cb), cb);
  const off = (ev, cb) => { subs[ev] = (subs[ev] || []).filter((f) => f !== cb); };
  const emit = (ev, data) => (subs[ev] || []).forEach((f) => f(data));

  /* ---------------- scene boot (once) ---------------- */
  function initScene() {
    if (inited) return true;
    const THREE = window.THREE;
    if (!THREE || !mountEl) return false;

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance", preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.06;
    mountEl.appendChild(renderer.domElement);
    renderer.domElement.style.display = "block";
    renderer.domElement.style.touchAction = "none";

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);

    if (THREE.RoomEnvironment) {
      try {
        const pmrem = new THREE.PMREMGenerator(renderer);
        scene.environment = pmrem.fromScene(new THREE.RoomEnvironment(), 0.04).texture;
      } catch (_) {}
    }
    scene.add(new THREE.AmbientLight(0xffffff, 0.42));
    const key = new THREE.DirectionalLight(0xffffff, 1.25);
    key.position.set(2.4, 4.2, 2.6); scene.add(key);
    const rim = new THREE.PointLight(SIGNAL, 1.5, 18); rim.position.set(-3.2, 1.8, -2.6); scene.add(rim);
    const fill = new THREE.PointLight(0x4a6b9c, 0.55, 18); fill.position.set(3.4, -2.0, 1.6); scene.add(fill);

    board = window.makeWaferBoard(THREE);
    scene.add(board.group);
    board.onPartLand = (p) => { if (sound) sound.partLand(p.kind); emitLand(p); };

    raycaster = new THREE.Raycaster();
    pointerV = new THREE.Vector2();

    bindInput();
    const ro = new ResizeObserver(resize);
    ro.observe(mountEl);
    resize();
    inited = true;
    return true;
  }

  function resize() {
    if (!renderer || !mountEl) return;
    const w = mountEl.clientWidth || 1, h = mountEl.clientHeight || 1;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    lookX = w > 1100 ? 0.42 : 0;   // desktop: board sits left of the rail
  }

  let landFlash = 0;
  function emitLand() { landFlash = 1; }

  /* ---------------- camera ---------------- */
  function applyCamera() {
    const r = cam.dist;
    camera.position.set(
      Math.sin(cam.yaw) * Math.cos(cam.pitch) * r,
      Math.sin(cam.pitch) * r + cam.y,
      Math.cos(cam.yaw) * Math.cos(cam.pitch) * r,
    );
    camera.lookAt(lookX, cam.y, 0.05);
  }

  /* ---------------- input ---------------- */
  let dragging = false, dragMoved = 0, lx = 0, ly = 0;
  let pressedByPointer = new Map();   // pointerId → key
  let hoverKey = null;

  function pickKey(e) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointerV.set(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1,
    );
    raycaster.setFromCamera(pointerV, camera);
    const hits = raycaster.intersectObjects(board.keyMeshes, false);
    return hits.length ? hits[0].object.userData.key : null;
  }

  function pressKey(k, source) {
    board.press(k);
    st.count++;
    st.lastKey = { label: k.label || "·", id: k.id, row: k.row, col: k.col, side: k.side, thumb: k.thumb, source };
    if (sound) sound.thock({ deep: k.thumb, intensity: 1 });
    emit("key", st.lastKey);
    /* thumb NAV / SYM toggle layers (like holding the real board) */
    if (k.thumb && k.col === 1) {
      const next = k.side < 0 ? (st.layer === 1 ? 0 : 1) : (st.layer === 2 ? 0 : 2);
      api.setLayer(next, true);
    }
  }
  function releaseKey(k) {
    board.release(k);
    if (sound) sound.keyRelease(k.thumb);
  }

  function bindInput() {
    const dom = renderer.domElement;
    dom.addEventListener("pointerdown", (e) => {
      if (!active || st.phase !== "live") return;
      const k = pickKey(e);
      if (k) {
        pressedByPointer.set(e.pointerId, k);
        pressKey(k, "click");
      } else {
        dragging = true; dragMoved = 0; lx = e.clientX; ly = e.clientY;
        dom.setPointerCapture?.(e.pointerId);
      }
    });
    dom.addEventListener("pointermove", (e) => {
      if (!active) return;
      if (dragging) {
        const dx = e.clientX - lx, dy = e.clientY - ly;
        lx = e.clientX; ly = e.clientY;
        dragMoved += Math.abs(dx) + Math.abs(dy);
        camT.yaw -= dx * 0.0052;
        camT.pitch = clamp(camT.pitch + dy * 0.0045, 0.06, 1.25);
      } else if (st.phase === "live") {
        const k = pickKey(e);
        if (k !== hoverKey) {
          hoverKey = k;
          board.setHover(k);
          dom.style.cursor = k ? "pointer" : "grab";
        }
      }
    });
    const up = (e) => {
      const k = pressedByPointer.get(e.pointerId);
      if (k) { releaseKey(k); pressedByPointer.delete(e.pointerId); }
      dragging = false;
      try { renderer.domElement.releasePointerCapture?.(e.pointerId); } catch (_) {}
    };
    dom.addEventListener("pointerup", up);
    dom.addEventListener("pointercancel", up);
    dom.addEventListener("wheel", (e) => {
      if (!active || st.phase !== "live") return;
      e.preventDefault();
      camT.dist = clamp(camT.dist + e.deltaY * 0.0042, 3.1, 9.6);
    }, { passive: false });
  }

  /* physical keyboard */
  const downCodes = new Set();
  function onKeyDown(e) {
    if (!active) return;
    if (e.key === "Escape") return;                  // page2 handles exit
    if (st.phase === "intro" && (e.key === " " || e.key === "Enter")) { e.preventDefault(); api.skip(); return; }
    if (st.phase !== "live") return;
    const k = board.codeMap[e.code];
    if (!k) return;
    e.preventDefault();
    if (e.repeat || downCodes.has(e.code)) return;
    downCodes.add(e.code);
    pressKey(k, "keyboard");
    /* typing playground */
    if (e.key.length === 1) {
      st.typed = (st.typed + e.key).slice(-42);
      emit("typed", st.typed);
    } else if (e.code === "Backspace") {
      st.typed = st.typed.slice(0, -1);
      emit("typed", st.typed);
    } else if (e.code === "Space") {
      st.typed = (st.typed + " ").slice(-42);
      emit("typed", st.typed);
    }
  }
  function onKeyUp(e) {
    if (!active) return;
    const k = board.codeMap[e.code];
    if (!k) return;
    if (downCodes.has(e.code)) { downCodes.delete(e.code); releaseKey(k); }
  }

  /* ---------------- intro timeline ---------------- */
  function introScale() { return st.direction === "sandbox" ? 0.36 : 1; }

  let bootIdx = 0, sweepFired = false, handed = false;
  function runIntro(dt) {
    st.introT += dt / 1000;
    const S = introScale();
    const t = st.introT / S;          // normalized to cinematic clock

    /* boot lines at fib-ish beats */
    const beats = [0.13, 0.47, 0.81, 1.15, 1.49];
    while (bootIdx < BOOT_LINES.length && t > beats[bootIdx]) {
      emit("boot", BOOT_LINES[bootIdx]);
      if (sound) sound.bootTick();
      bootIdx++;
    }

    /* A — drift in the dark, fully exploded (0 → 1.0) */
    /* B — assembly: explode 1 → 0 + camera resolves (0.9 → 4.4) */
    /* C — signal sweep (4.5) · D — handover (5.6) */
    const A = clamp(t / 1.0, 0, 1);
    const B = clamp((t - 0.9) / 3.5, 0, 1);

    st.explodeC = 1 - ease(B);
    board.setExplode(st.explodeC, performance.now());

    cam.dist = lerp(lerp(10.4, 8.8, ease(A)), CAM_HOME.dist, ease(B));
    cam.yaw = lerp(lerp(-1.85, -1.45, ease(A)), CAM_HOME.yaw, ease(B));
    cam.pitch = lerp(lerp(0.95, 0.82, ease(A)), CAM_HOME.pitch, ease(B));
    Object.assign(camT, { yaw: cam.yaw, pitch: cam.pitch, dist: cam.dist });

    if (!sweepFired && t >= 4.5) {
      sweepFired = true;
      board.startSweep(900 * S);
      if (sound) sound.sweepFx(900 * S);
    }
    if (!handed && t >= 5.6) handOver(false);
  }

  function handOver(skipped) {
    handed = true;
    st.phase = "live";
    st.explodeT = 0; st.explodeC = skipped ? 0 : st.explodeC;
    if (skipped) {
      board.setExplode(0, performance.now());
      Object.assign(cam, CAM_HOME); Object.assign(camT, CAM_HOME);
    }
    if (sound) sound.handover(skipped);
    emit("phase", "live");
  }

  /* ---------------- main loop ---------------- */
  function frame(now) {
    const dt = Math.min(50, now - (lastT || now)); lastT = now;
    const tw = window.__waferDemoTweaks || {};
    board.setExplodeOpts({ dist: tw.explodeDist || 1, stagger: tw.stagger != null ? tw.stagger : 0.65 });

    if (st.phase === "intro") {
      runIntro(dt);
    } else {
      /* live: ease explode toward slider target */
      const prevE = st.explodeC;
      st.explodeC = damp(st.explodeC, st.explodeT, 0.085, dt);
      board.setExplode(st.explodeC, now);
      if (sound) sound.scrub(Math.abs(st.explodeC - prevE) / (dt / 1000 + 0.0001) * 0.06, st.explodeC);

      if (st.turntable && !dragging) camT.yaw += dt * 0.00021;
      cam.yaw = damp(cam.yaw, camT.yaw, 0.14, dt);
      cam.pitch = damp(cam.pitch, camT.pitch, 0.14, dt);
      cam.dist = damp(cam.dist, camT.dist, 0.12, dt);
    }

    board.update(dt, now);
    applyCamera();
    renderer.render(scene, camera);
    if (active) raf = requestAnimationFrame(frame);
  }

  /* ---------------- public API ---------------- */
  const api = {
    on, off,
    get state() { return st; },
    get board() { return board; },

    start(opts = {}) {
      mountEl = opts.mount || mountEl;
      if (!initScene()) return false;
      active = true;
      window.__waferDemoActive = true;
      st.direction = opts.direction || "cinematic";
      st.phase = "intro";
      st.introT = 0; bootIdx = 0; sweepFired = false; handed = false;
      st.explodeT = 0; st.explodeC = 1;
      st.typed = ""; st.count = 0; st.lastKey = null;
      st.layer = 0; board.setLayer(0);
      st.mode = "solid"; board.setMode("solid");
      st.turntable = false;
      board.setExplode(1, performance.now());

      const reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      /* sound — gesture-chained */
      if (!sound) sound = window.makeWaferDemoSound();
      const saved = localStorage.getItem("mo_demo_sound");
      st.soundOn = saved == null ? true : saved === "1";
      sound.setMuted(!st.soundOn);
      sound.setLevel((window.__waferDemoTweaks || {}).soundLevel || 0.8);
      sound.start();

      Object.assign(cam, { yaw: -1.85, pitch: 0.95, dist: 10.4, y: 0.05 });
      Object.assign(camT, cam);

      lastT = 0;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(frame);
      emit("phase", "intro");
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
      window.__waferDemoActive = false;
      downCodes.clear();
      pressedByPointer.clear();
      board.setHover(null);
      setTimeout(() => {
        active = false;
        cancelAnimationFrame(raf);
        st.phase = "idle";
      }, 480);
    },

    setExplode(v) {
      st.explodeT = clamp(v, 0, 1);
      emit("explode", st.explodeT);
    },
    setLayer(i, fromBoard) {
      st.layer = i;
      board.setLayer(i);
      if (sound) { sound.ping(i === 0 ? 1 : i === 1 ? 1.5 : 5 / 4, { peak: 0.022 }); }
      emit("layer", i);
    },
    setMode(m) {
      st.mode = m;
      board.setMode(m);
      if (sound) sound.uiTick("on");
      emit("mode", m);
    },
    setTurntable(b) {
      st.turntable = b;
      if (sound) sound.uiTick(b ? "on" : "off");
      emit("turntable", b);
    },
    resetView() {
      Object.assign(camT, CAM_HOME);
      st.explodeT = 0;
      if (st.layer !== 0) api.setLayer(0);
      if (st.mode !== "solid") api.setMode("solid");
      if (st.turntable) api.setTurntable(false);
      if (sound) sound.uiTick("off");
      emit("explode", 0);
    },
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

  window.addEventListener("keydown", onKeyDown, true);
  window.addEventListener("keyup", onKeyUp, true);

  window.WaferDemo = api;
})();
