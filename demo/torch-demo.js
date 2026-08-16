/* ============================================================
   M.O. SYSTEM — TORCH DEMO CONTROLLER  ·  node 0x04
   ------------------------------------------------------------
   Owns the fullscreen demo: renderer, camera, the procedural
   torch, the cinematic intro, free-orbit input — and the REAL
   firmware switch logic:

     SW1 · 1× toggle on/off (restores saved brightness)
         · 2× switch color WHITE ↔ RED
         · hold — brightness ramps DOWN first, then UP (bounce);
           released level is saved (brightness memory)
     SW2 · 1× everything off
         · 3× SOS in the current color (real morse timing)
         · hold — battery readout on the 4 addressable LEDs
           (green = full · red = low · red blinking = ultralow)

   Battery drains while lit (sim ×60), steps down when low,
   blinks the LEDs when ultralow, dies at zero.

   window.TorchDemo:
     start({ mount, direction }) · stop() · skip()
     swDown(i) · swUp(i) · setMode(m) · setTurntable(b)
     recharge() · toggleSound() · resetView() · on/off
   Events: phase · boot · power · color · bright · battery ·
           sos · battshow · action · mode · turntable · sound
   ============================================================ */
(function () {
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ease = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const damp = (cur, tgt, rate, dt) => lerp(cur, tgt, 1 - Math.pow(1 - rate, dt / 16));

  window.__demoTweaks = window.__demoTweaks || {
    clickPitch: 1, soundLevel: 0.8, hud: "full", drainSpeed: 1,
  };

  const CAM_HOME = { yaw: -0.92, pitch: 0.3, dist: 5.4 };

  const BOOT_LINES = [
    "TACTICAL FLASHLIGHT · LIVE DEMO · v0.9",
    "GEOMETRY · PROCEDURAL MOCK · AWAITING REAL GLB",
    "PY32F002A · ARM CORTEX-M0 · 2 SWITCHES",
    "AUDIO · 0X00 FIELD · NODE 0X04 SHADE",
    "ASSEMBLING —",
  ];

  /* morse: S O S  (· · ·  — — —  · · ·), unit ms */
  const MORSE_UNIT = 190;
  const SOS_SEQ = (() => {
    const seq = [];   // { on, units, sym }
    const letter = (symbols) => {
      symbols.split("").forEach((s, i) => {
        seq.push({ on: true, units: s === "." ? 1 : 3, sym: s });
        seq.push({ on: false, units: 1, sym: "" });
      });
      seq[seq.length - 1].units = 3;           // letter gap
    };
    letter("..."); letter("---"); letter("...");
    seq[seq.length - 1].units = 7;             // word gap, then repeat
    return seq;
  })();

  let inited = false, renderer, scene, camera, torch, raycaster, pointerV;
  let mountEl = null, active = false, raf = 0, lastT = 0;
  let sound = null;
  let lookX = 0;

  const cam = { ...CAM_HOME, y: 0 };
  const camT = { ...cam };

  const st = {
    phase: "idle",
    /* firmware state */
    power: false,
    color: "white",            // white | red
    bright: 0.7,               // live level
    saved: 0.7,                // brightness memory
    battery: 1,
    sos: false,
    battShow: false,
    dead: false,
    /* presentation */
    mode: "solid",
    turntable: false,
    explodeC: 1,
    introT: 0,
    soundOn: true,
    direction: "cinematic",
    lastAction: null,
  };

  const subs = {};
  const on = (ev, cb) => ((subs[ev] = subs[ev] || []).push(cb), cb);
  const off = (ev, cb) => { subs[ev] = (subs[ev] || []).filter((f) => f !== cb); };
  const emit = (ev, data) => (subs[ev] || []).forEach((f) => f(data));
  const action = (label) => { st.lastAction = label; emit("action", label); };

  /* ============================================================
     SWITCH STATE MACHINE — the actual firmware UX
     ============================================================ */
  const SW = {
    1: { down: false, clicks: 0, longTimer: 0, clickTimer: 0, longActive: false },
    2: { down: false, clicks: 0, longTimer: 0, clickTimer: 0, longActive: false },
  };
  const LONG_MS = 550, CLICK_MS = 330;

  /* ramp (SW1 hold): bounce down → up between 0.06 and 1 */
  const ramp = { active: false, dir: -1, t: 0 };

  function applyPower(onState) {
    st.power = onState && !st.dead;
    if (st.power) st.bright = st.saved;
    emit("power", st.power);
  }

  function swDown(i) {
    if (st.phase !== "live") return;
    const s = SW[i];
    if (s.down) return;
    s.down = true;
    torch.pressSw(i);
    if (sound) sound.click(i, "down");
    clearTimeout(s.longTimer);
    s.longTimer = setTimeout(() => {
      if (!s.down) return;
      s.longActive = true;
      s.clicks = 0;
      if (i === 1) {
        /* hold → brightness ramp (down first, then up) */
        if (!st.power) applyPower(true);
        ramp.active = true; ramp.dir = -1;
        action("SW1 HOLD · RAMP");
        if (sound) sound.rampStart();
      } else {
        /* hold → battery readout */
        st.battShow = true;
        emit("battshow", true);
        action("SW2 HOLD · BATT CHECK");
        if (sound) sound.battCheck(st.battery);
      }
    }, LONG_MS);
  }

  function swUp(i) {
    const s = SW[i];
    if (!s.down) return;
    s.down = false;
    torch.releaseSw(i);
    if (sound) sound.click(i, "up");
    clearTimeout(s.longTimer);

    if (s.longActive) {
      s.longActive = false;
      if (i === 1) {
        ramp.active = false;
        st.saved = st.bright;
        action("BRIGHTNESS SAVED · " + Math.round(st.bright * 100) + "%");
        if (sound) sound.rampEnd();
        emit("bright", st.bright);
      } else {
        st.battShow = false;
        emit("battshow", false);
      }
      return;
    }

    s.clicks++;
    clearTimeout(s.clickTimer);
    s.clickTimer = setTimeout(() => {
      resolveClicks(i, s.clicks);
      s.clicks = 0;
    }, CLICK_MS);
  }

  function resolveClicks(i, n) {
    if (i === 1) {
      if (n === 1) {
        if (st.sos) { st.sos = false; emit("sos", null); }
        applyPower(!st.power);
        action(st.power ? "SW1 · ON · " + Math.round(st.saved * 100) + "%" : "SW1 · OFF");
        if (sound) sound.powerFx(st.power);
      } else if (n >= 2) {
        st.color = st.color === "white" ? "red" : "white";
        emit("color", st.color);
        action("SW1 2× · COLOR · " + st.color.toUpperCase());
        if (sound) sound.colorSwap(st.color);
      }
    } else {
      if (n === 1) {
        const was = st.power || st.sos;
        st.sos = false; emit("sos", null);
        applyPower(false);
        st.battShow = false; emit("battshow", false);
        action("SW2 · ALL OFF");
        if (sound && was) sound.powerFx(false);
      } else if (n >= 3) {
        st.sos = !st.sos;
        if (st.sos) { sosIdx = -1; sosNext = 0; applyPower(false); }
        emit("sos", st.sos ? { sym: "", i: 0 } : null);
        action(st.sos ? "SW2 3× · SOS · " + st.color.toUpperCase() : "SOS · STOP");
        if (sound) sound.uiTick(st.sos ? "on" : "off");
      }
    }
  }

  /* ---------------- SOS scheduler ---------------- */
  let sosIdx = -1, sosNext = 0, sosOn = false;
  function runSos(now) {
    if (!st.sos || st.dead) { sosOn = false; return; }
    if (now >= sosNext) {
      sosIdx = (sosIdx + 1) % SOS_SEQ.length;
      const step = SOS_SEQ[sosIdx];
      sosOn = step.on;
      sosNext = now + step.units * MORSE_UNIT;
      if (step.on && sound) sound.sosBeep(step.sym === "." ? 1 : 3, MORSE_UNIT);
      emit("sos", { sym: step.sym, i: sosIdx, on: step.on });
    }
  }

  /* ---------------- battery ---------------- */
  let blinkT = 0;
  function runBattery(dt, now) {
    const tw = window.__demoTweaks || {};
    const lit = (st.power && !st.dead) || (st.sos && sosOn);
    if (lit) {
      const draw = st.sos ? 0.55 : (0.18 + 0.82 * st.bright);
      /* ×60 sim: full battery ≈ 3 demo-minutes on high */
      st.battery = Math.max(0, st.battery - draw * (dt / 1000) * (1 / 180) * (tw.drainSpeed || 1));
      if (st.battery === 0 && !st.dead) {
        st.dead = true;
        applyPower(false);
        st.sos = false; emit("sos", null);
        action("CELL DEPLETED · RECHARGE");
        if (sound) sound.dieFx();
      }
      emit("battery", st.battery);
    }
    /* step-down: low cell can't hold high output */
    const cap = st.battery < 0.12 ? 0.25 : 1;
    const liveBright = Math.min(st.bright, cap);

    /* beam */
    const beamOn = (st.power && !st.dead) || (st.sos && sosOn);
    const ultralow = st.battery < 0.05 && st.battery > 0;
    blinkT += dt;
    const warnBlink = ultralow && st.power && Math.floor(now / 320) % 2 === 0;
    torch.setBeam(beamOn && !warnBlink, st.sos ? 0.85 : liveBright, st.color);

    /* LEDs: battery readout while SW2 held; ultralow warning blink */
    if (st.battShow || ultralow) {
      const n = Math.ceil(st.battery * 4);
      const col = st.battery > 0.4 ? 0x2dd24a : 0xff2a1e;
      const blink = st.battery < 0.15 ? Math.floor(now / 260) % 2 === 0 : true;
      const arr = [0, 1, 2, 3].map((k) => (blink && k < Math.max(1, n) ? col : null));
      torch.setLeds(st.battery === 0 ? [Math.floor(now / 260) % 2 ? 0xff2a1e : null, null, null, null] : arr);
    } else {
      torch.setLeds(null);
    }
  }

  /* ============================================================
     SCENE
     ============================================================ */
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
    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const key = new THREE.DirectionalLight(0xffffff, 1.85);
    key.position.set(2.4, 4.2, 2.6); scene.add(key);
    const rim = new THREE.PointLight(0x00f0c8, 2.1, 22); rim.position.set(-3.2, 1.8, -2.6); scene.add(rim);
    const fill = new THREE.PointLight(0x7da0d8, 0.8, 22); fill.position.set(3.4, -2.0, 1.6); scene.add(fill);
    const top = new THREE.DirectionalLight(0xcfe0ff, 0.6); top.position.set(-1.0, 3.0, -1.0); scene.add(top);

    torch = window.makeTorchModel(THREE);
    scene.add(torch.group);
    torch.onPartLand = (p) => { if (sound) sound.partLand(p.kind); };

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
    lookX = w > 1100 ? 0.42 : 0;
  }

  function applyCamera() {
    const r = cam.dist;
    camera.position.set(
      Math.sin(cam.yaw) * Math.cos(cam.pitch) * r,
      Math.sin(cam.pitch) * r + cam.y,
      Math.cos(cam.yaw) * Math.cos(cam.pitch) * r,
    );
    camera.lookAt(lookX, cam.y, 0);
  }

  /* ---------------- input ---------------- */
  let dragging = false, lx = 0, ly = 0;
  let hoverMesh = null;
  const pointerSw = new Map();

  function pickSw(e) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointerV.set(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1,
    );
    raycaster.setFromCamera(pointerV, camera);
    const hits = raycaster.intersectObjects(torch.swMeshes, false);
    return hits.length ? hits[0].object : null;
  }

  function bindInput() {
    const dom = renderer.domElement;
    dom.addEventListener("pointerdown", (e) => {
      if (!active || st.phase !== "live") return;
      const m = pickSw(e);
      if (m) {
        pointerSw.set(e.pointerId, m.userData.sw);
        swDown(m.userData.sw);
      } else {
        dragging = true; lx = e.clientX; ly = e.clientY;
        dom.setPointerCapture?.(e.pointerId);
      }
    });
    dom.addEventListener("pointermove", (e) => {
      if (!active) return;
      if (dragging) {
        const dx = e.clientX - lx, dy = e.clientY - ly;
        lx = e.clientX; ly = e.clientY;
        camT.yaw -= dx * 0.0052;
        camT.pitch = clamp(camT.pitch + dy * 0.0045, -0.4, 1.25);
      } else if (st.phase === "live") {
        const m = pickSw(e);
        if (m !== hoverMesh) {
          hoverMesh = m;
          torch.setHover(m);
          dom.style.cursor = m ? "pointer" : "grab";
        }
      }
    });
    const up = (e) => {
      const sw = pointerSw.get(e.pointerId);
      if (sw) { swUp(sw); pointerSw.delete(e.pointerId); }
      dragging = false;
      try { renderer.domElement.releasePointerCapture?.(e.pointerId); } catch (_) {}
    };
    dom.addEventListener("pointerup", up);
    dom.addEventListener("pointercancel", up);
    dom.addEventListener("wheel", (e) => {
      if (!active || st.phase !== "live") return;
      e.preventDefault();
      camT.dist = clamp(camT.dist + e.deltaY * 0.0042, 3.0, 9.6);
    }, { passive: false });
  }

  /* physical keyboard: 1 / 2 drive the switches (hold works) */
  const downKeys = new Set();
  function onKeyDown(e) {
    if (!active) return;
    if (e.key === "Escape") return;
    if (st.phase === "intro" && (e.key === " " || e.key === "Enter")) { e.preventDefault(); api.skip(); return; }
    if (st.phase !== "live") return;
    if (e.code === "Digit1" || e.code === "Digit2") {
      e.preventDefault();
      if (e.repeat || downKeys.has(e.code)) return;
      downKeys.add(e.code);
      swDown(e.code === "Digit1" ? 1 : 2);
    }
  }
  function onKeyUp(e) {
    if (!active) return;
    if (e.code === "Digit1" || e.code === "Digit2") {
      if (downKeys.has(e.code)) { downKeys.delete(e.code); swUp(e.code === "Digit1" ? 1 : 2); }
    }
  }

  /* ---------------- intro ---------------- */
  function introScale() { return st.direction === "sandbox" ? 0.36 : 1; }
  let bootIdx = 0, ignited = false, handed = false;

  function runIntro(dt) {
    st.introT += dt / 1000;
    const S = introScale();
    const t = st.introT / S;

    const beats = [0.13, 0.47, 0.81, 1.15, 1.49];
    while (bootIdx < BOOT_LINES.length && t > beats[bootIdx]) {
      emit("boot", BOOT_LINES[bootIdx]);
      if (sound) sound.bootTick();
      bootIdx++;
    }

    const A = clamp(t / 1.0, 0, 1);
    const B = clamp((t - 0.9) / 3.3, 0, 1);

    st.explodeC = 1 - ease(B);
    torch.setExplode(st.explodeC, performance.now());

    cam.dist = lerp(lerp(10.0, 8.6, ease(A)), CAM_HOME.dist, ease(B));
    cam.yaw = lerp(lerp(-2.1, -1.7, ease(A)), CAM_HOME.yaw, ease(B));
    cam.pitch = lerp(lerp(0.9, 0.74, ease(A)), CAM_HOME.pitch, ease(B));
    Object.assign(camT, { yaw: cam.yaw, pitch: cam.pitch, dist: cam.dist });

    /* the ignition: torch checks itself — one white flash, then settles */
    if (!ignited && t >= 4.35) {
      ignited = true;
      torch.setBeam(true, 1, "white");
      if (sound) sound.igniteFx();
      setTimeout(() => { if (st.phase === "intro") torch.setBeam(false, 0, "white"); }, 460 * S);
    }
    if (!handed && t >= 5.5) handOver(false);
  }

  function handOver(skipped) {
    handed = true;
    st.phase = "live";
    if (skipped) {
      st.explodeC = 0;
      torch.setExplode(0, performance.now());
      Object.assign(cam, CAM_HOME); Object.assign(camT, CAM_HOME);
      torch.setBeam(false, 0, st.color);
    }
    if (sound) sound.handover(skipped);
    emit("phase", "live");
  }

  /* ---------------- loop ---------------- */
  function frame(now) {
    const dt = Math.min(50, now - (lastT || now)); lastT = now;

    if (st.phase === "intro") {
      runIntro(dt);
    } else {
      /* ramp while SW1 held */
      if (ramp.active) {
        st.bright += ramp.dir * dt / 1700;
        if (st.bright <= 0.06) { st.bright = 0.06; ramp.dir = 1; }
        if (st.bright >= 1) { st.bright = 1; ramp.dir = -1; }
        emit("bright", st.bright);
        if (sound) sound.rampLevel(st.bright);
      }
      runSos(now);
      runBattery(dt, now);

      if (st.turntable && !dragging) camT.yaw += dt * 0.00021;
      cam.yaw = damp(cam.yaw, camT.yaw, 0.14, dt);
      cam.pitch = damp(cam.pitch, camT.pitch, 0.14, dt);
      cam.dist = damp(cam.dist, camT.dist, 0.12, dt);
    }

    torch.update(dt, now);
    applyCamera();
    renderer.render(scene, camera);
    if (active) raf = requestAnimationFrame(frame);
  }

  /* ---------------- public API ---------------- */
  const api = {
    on, off,
    get state() { return st; },

    start(opts = {}) {
      mountEl = opts.mount || mountEl;
      if (!initScene()) return false;
      active = true;
      st.direction = opts.direction || "cinematic";
      st.phase = "intro";
      st.introT = 0; bootIdx = 0; ignited = false; handed = false;
      st.explodeC = 1;
      st.power = false; st.color = "white"; st.bright = 0.7; st.saved = 0.7;
      st.battery = 1; st.dead = false; st.sos = false; st.battShow = false;
      st.mode = "solid"; torch.setMode("solid");
      st.turntable = false;
      st.lastAction = null;
      torch.setExplode(1, performance.now());
      torch.setBeam(false, 0, "white");
      torch.setLeds(null);

      const reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (!sound) sound = window.makeTorchDemoSound();
      const saved = localStorage.getItem("mo_demo_sound");
      st.soundOn = saved == null ? true : saved === "1";
      sound.setMuted(!st.soundOn);
      sound.setLevel((window.__demoTweaks || {}).soundLevel || 0.8);
      sound.start();

      Object.assign(cam, { yaw: -2.1, pitch: 0.9, dist: 10.0, y: 0 });
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
      downKeys.clear();
      pointerSw.clear();
      ramp.active = false;
      torch.setHover(null);
      setTimeout(() => {
        active = false;
        cancelAnimationFrame(raf);
        st.phase = "idle";
      }, 480);
    },

    swDown, swUp,
    setMode(m) {
      st.mode = m;
      torch.setMode(m);
      if (sound) sound.uiTick("on");
      emit("mode", m);
    },
    setTurntable(b) {
      st.turntable = b;
      if (sound) sound.uiTick(b ? "on" : "off");
      emit("turntable", b);
    },
    recharge() {
      st.battery = 1; st.dead = false;
      emit("battery", 1);
      action("CELL SWAPPED · 100%");
      if (sound) sound.rechargeFx();
    },
    resetView() {
      Object.assign(camT, CAM_HOME);
      if (st.mode !== "solid") api.setMode("solid");
      if (st.turntable) api.setTurntable(false);
      if (sound) sound.uiTick("off");
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

  window.TorchDemo = api;
})();
