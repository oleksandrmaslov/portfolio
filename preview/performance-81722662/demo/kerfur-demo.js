/* ============================================================
   M.O. SYSTEM — KERFUR DEMO CONTROLLER  ·  node 0x02
   ------------------------------------------------------------
   The living-pet demo. Owns renderer/camera/body, the device
   boot intro, and the interaction grammar:

     tap face        → look at you, TOUCH_TAP
     double-tap      → TOUCH_DOUBLE_TAP, HAPPY_BOUNCE + body hop
     slow drag/face  → TOUCH_STROKE petting, purr, PET_BOW
     fast flick      → MOTION_SHAKE, STARTLE; keep going → ANNOYED
     press-hold body → MOTION_PICKED_UP, lift + look-around
     HUD buttons     → notifications, charger, peer encounter
     INSPECT FACE    → giant 1-bit OLED overlay (same engine)

   Peer finale: a mini Kerfur slides in. SEEN → NEAR → curious →
   greeting → FRIEND. Hearts. "First Kerfus meet each other."

   window.KerfurDemo: start/stop/skip · tapAt(sw) · notify(kind)
     setCharging(b) · encounter() · inspect(b) · resetView()
     toggleSound() · on/off · state
   Events: phase · boot · expr · react · vars · event · battery ·
     peer · inspect · charging · sound · action
   ============================================================ */
(function () {
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ease = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const damp = (cur, tgt, rate, dt) => lerp(cur, tgt, 1 - Math.pow(1 - rate, dt / 16));

  window.__demoTweaks = window.__demoTweaks || { soundLevel: 0.8, hud: "full" };

  const CAM_HOME = { yaw: -0.34, pitch: 0.16, dist: 4.6 };
  const BOOT_LINES = [
    "KERFUR · LIVE DEMO · v0.9",
    "GEOMETRY · PROCEDURAL MOCK · STEP REF 139×142×101",
    "FACE ENGINE · kerfur_faces.json · PRODUCTION RECIPES",
    "NRF52840 · ZEPHYR · EVENT BUS → EMOTION → FACE",
    "AUDIO · 0X00 FIELD · NODE 0X02 SHADE · SOFT CHIRPS",
    "WAKING KERFUR —",
  ];

  let inited = false, renderer, scene, camera, raycaster, pointerV;
  let body = null, peer = null, sound = null, emotion = null;
  let mountEl = null, active = false, raf = 0, lastT = 0;
  let lookX = 0;

  const cam = { ...CAM_HOME, y: 0 };
  const camT = { ...cam };

  const st = {
    phase: "idle",
    direction: "cinematic",
    soundOn: true,
    inspecting: false,
    peerPhase: null,         // null|enter|seen|near|greet|friend
    peerT: 0,
    introT: 0,
    lastAction: null,
  };

  const subs = {};
  const on = (ev, cb) => ((subs[ev] = subs[ev] || []).push(cb), cb);
  const off = (ev, cb) => { subs[ev] = (subs[ev] || []).filter((f) => f !== cb); };
  const emit = (ev, d) => (subs[ev] || []).forEach((f) => f(d));
  const action = (label) => { st.lastAction = label; emit("action", label); };

  /* ============================================================
     EVENT → presentation (face reactions come from the emotion
     engine; this maps the same events to sound + body motion)
     ============================================================ */
  function present(ev) {
    if (!sound) return;
    switch (ev) {
      case "TOUCH_TAP": sound.tap(); body.earTwitch = performance.now(); break;
      case "TOUCH_DOUBLE_TAP": sound.happy(); body.bounce(1.4); break;
      case "TOUCH_STROKE": sound.petBow(); break;
      case "MOTION_SHAKE": sound.startle(); body.wobble(1.6); break;
      case "MOTION_PICKED_UP": sound.pickup(); break;
      case "NOTIFICATION_RECEIVED": sound.notif(); break;
      case "NOTIFICATION_IMPORTANT": sound.notifBig(); body.bounce(0.8); break;
      case "NOTIFICATION_OVERLOAD": sound.overload(); body.wobble(1.2); break;
      case "CHARGING_STARTED": sound.charge(); break;
      case "BATTERY_LOW": sound.drained(); break;
      case "SLEEP_ENTER": sound.sleep(); break;
      case "SLEEP_EXIT": sound.wake(); body.bounce(0.7); break;
      case "PEER_SEEN": sound.peerSeen(); break;
      case "PEER_FRIEND_SEEN": sound.friendDuet(); body.bounce(1.2); break;
    }
  }

  function post(ev, label) {
    emotion.post(ev);
    present(ev);
    emit("event", ev);
    if (label) action(label);
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
    mountEl.appendChild(renderer.domElement);
    renderer.domElement.style.display = "block";
    renderer.domElement.style.touchAction = "none";

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);

    if (THREE.RoomEnvironment) {
      try {
        const pmrem = new THREE.PMREMGenerator(renderer);
        scene.environment = pmrem.fromScene(new THREE.RoomEnvironment(), 0.04).texture;
      } catch (_) {}
    }
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const key = new THREE.DirectionalLight(0xffffff, 1.5);
    key.position.set(2.2, 3.8, 2.8); scene.add(key);
    const rim = new THREE.PointLight(0x00f0c8, 1.6, 20); rim.position.set(-3.0, 1.6, -2.4); scene.add(rim);
    const fill = new THREE.PointLight(0x7da0d8, 0.6, 20); fill.position.set(3.2, -1.8, 1.8); scene.add(fill);

    body = window.makeKerfurBody(THREE);
    scene.add(body.group);

    peer = window.makeKerfurBody(THREE, { mini: true });
    peer.group.scale.setScalar(0.62);
    peer.group.position.set(4.6, -0.28, 0.4);
    peer.group.rotation.y = -0.5;
    peer.group.visible = false;
    scene.add(peer.group);

    emotion = window.makeKerfurEmotion();

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
    lookX = w > 1100 ? 0.34 : 0;
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

  /* ============================================================
     INPUT — tap / double-tap / pet-stroke / flick / hold
     ============================================================ */
  let drag = null;            // {x0,y0,t0,onFace,moved,path,held,holdTimer}
  let lastTapAt = 0;
  let strokeAcc = 0, lastStrokeFire = 0, petting = false, petStopTimer = 0;

  function hitFace(e) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointerV.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
    raycaster.setFromCamera(pointerV, camera);
    const hits = raycaster.intersectObject(body.faceMesh, false);
    if (!hits.length) return null;
    const uv = hits[0].uv;
    return { x: (uv.x - 0.5) * 200, y: (0.5 - uv.y) * 200 };
  }
  function hitBody(e) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointerV.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
    raycaster.setFromCamera(pointerV, camera);
    return raycaster.intersectObject(body.group, true).length > 0;
  }

  function setPetting(b) {
    if (petting === b) return;
    petting = b;
    emotion.state.petting = b;
    if (sound) b ? sound.purrStart() : sound.purrStop();
  }

  function bindInput() {
    const dom = renderer.domElement;

    dom.addEventListener("pointerdown", (e) => {
      if (!active || st.phase !== "live") return;
      dom.setPointerCapture?.(e.pointerId);
      const face = hitFace(e);
      const onBody = face ? true : hitBody(e);
      drag = { x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY, t0: performance.now(), onFace: !!face, onBody, moved: 0, vx: 0, held: false, holdTimer: 0 };
      if (onBody && !face) {
        drag.holdTimer = setTimeout(() => {
          if (drag && drag.moved < 14) {
            drag.held = true;
            body.setLift(1);
            post("MOTION_PICKED_UP", "PICKED UP · IMU WAKE");
          }
        }, 520);
      }
    });

    dom.addEventListener("pointermove", (e) => {
      if (!active) return;
      if (!drag) {
        /* idle hover: kerfur watches your cursor near the face */
        if (st.phase === "live" && !st.inspecting) {
          const f = hitFace(e);
          if (f) body.face.setLook(clamp(f.x, -100, 100), clamp(f.y, -100, 100));
        }
        return;
      }
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      drag.vx = dx;
      drag.moved += Math.abs(dx) + Math.abs(dy);
      drag.x = e.clientX; drag.y = e.clientY;

      const speed = Math.abs(dx) + Math.abs(dy);
      const face = hitFace(e);

      if (face && speed < 26 && !drag.held) {
        /* slow strokes across the face = petting */
        strokeAcc += speed;
        setPetting(true);
        clearTimeout(petStopTimer);
        petStopTimer = setTimeout(() => setPetting(false), 420);
        body.face.setLook(clamp(face.x, -100, 100), clamp(face.y, -100, 100));
        const now = performance.now();
        if (strokeAcc > 320 && now - lastStrokeFire > 1500) {
          strokeAcc = 0; lastStrokeFire = now;
          post("TOUCH_STROKE", "STROKE · AFFECTION+");
        }
      } else if (!face && !drag.held && drag.onBody === false) {
        /* free orbit on empty space */
        camT.yaw -= dx * 0.005;
        camT.pitch = clamp(camT.pitch + dy * 0.0042, -0.35, 1.1);
      } else if (!face && !drag.held && drag.onBody) {
        /* dragging the body = shaking input; fast = shake */
        if (speed > 34) {
          const now = performance.now();
          if (now - emotion.state.lastShakeAt > 900) post("MOTION_SHAKE", "SHAKE · STARTLE");
          body.wobble(clamp(dx * 0.04, -1.8, 1.8));
        } else {
          camT.yaw -= dx * 0.005;
          camT.pitch = clamp(camT.pitch + dy * 0.0042, -0.35, 1.1);
        }
      }
    });

    const up = (e) => {
      if (!drag) return;
      clearTimeout(drag.holdTimer);
      const dt = performance.now() - drag.t0;
      if (drag.held) {
        body.setLift(0);
        if (sound) sound.putdown();
        action("PUT DOWN");
      } else if (drag.moved < 12 && dt < 420 && drag.onFace) {
        const now = performance.now();
        if (now - lastTapAt < 340) {
          post("TOUCH_DOUBLE_TAP", "DOUBLE TAP · HAPPY");
          lastTapAt = 0;
        } else {
          lastTapAt = now;
          const f = hitFace(e);
          if (f) body.face.setLook(clamp(f.x, -100, 100), clamp(f.y, -100, 100));
          post("TOUCH_TAP", "TAP · LOOKS AT YOU");
        }
      } else if (drag.moved < 12 && dt < 420 && drag.onBody) {
        post("TOUCH_TAP", "TAP · BODY");
      }
      setPetting(false);
      drag = null;
      try { renderer.domElement.releasePointerCapture?.(e.pointerId); } catch (_) {}
    };
    dom.addEventListener("pointerup", up);
    dom.addEventListener("pointercancel", up);
    dom.addEventListener("wheel", (e) => {
      if (!active || st.phase !== "live") return;
      e.preventDefault();
      camT.dist = clamp(camT.dist + e.deltaY * 0.004, 2.6, 8.5);
    }, { passive: false });
  }

  /* ============================================================
     PEER ENCOUNTER — the finale
     ============================================================ */
  const PEER_X = { in: 1.55, out: 4.6 };
  function encounter() {
    if (st.peerPhase) { dismissPeer(); return; }
    st.peerPhase = "enter"; st.peerT = 0;
    peer.group.visible = true;
    peer.face.setExpression("PET_EXPR_CALM");
    camT.dist = Math.max(camT.dist, 5.6);
    camT.yaw = -0.12;
    action("NEARBY · BEACON DETECTED");
    emit("peer", "enter");
  }
  function dismissPeer() {
    st.peerPhase = null;
    emotion.post("PEER_LOST");
    body.face.setIndicator(null);
    peer.face.setIndicator(null);
    emit("peer", null);
    action("PEER · OUT OF RANGE");
  }

  function runPeer(dt, now) {
    if (!st.peerPhase) {
      if (peer.group.visible) {
        peer.group.position.x = damp(peer.group.position.x, PEER_X.out, 0.06, dt);
        if (peer.group.position.x > 4.4) peer.group.visible = false;
      }
      return;
    }
    st.peerT += dt;
    const T = st.peerT;
    peer.group.position.x = damp(peer.group.position.x, PEER_X.in, 0.045, dt);

    if (st.peerPhase === "enter" && T > 900) {
      st.peerPhase = "seen";
      post("PEER_SEEN", "PEER_SEEN · EPHEMERAL ID");
      body.face.setIndicator("icon_question");
      body.face.setLook(70, 10);
      peer.face.setLook(-70, 10);
      emit("peer", "seen");
    } else if (st.peerPhase === "seen" && T > 2600) {
      st.peerPhase = "near";
      post("PEER_NEAR", "PEER_NEAR · RSSI RISING");
      body.face.setIndicator("icon_heart_outline");
      peer.face.setExpression("PET_EXPR_CURIOUS");
      emit("peer", "near");
    } else if (st.peerPhase === "near" && T > 4600) {
      st.peerPhase = "greet";
      body.face.react("REACTION_CONNECT_SPARK");
      peer.face.react("REACTION_CONNECT_SPARK");
      body.face.whiskerWiggle(); peer.face.whiskerWiggle();
      action("GREETING · ACK");
      emit("peer", "greet");
    } else if (st.peerPhase === "greet" && T > 6400) {
      st.peerPhase = "friend";
      post("PEER_FRIEND_SEEN", "FRIEND CONFIRMED");
      body.face.setIndicator("icon_heart_filled");
      peer.face.setIndicator("icon_heart_filled");
      peer.face.setExpression("PET_EXPR_HAPPY");
      body.bounce(1.1); peer.bounce(1.1);
      emit("peer", "friend");
    }
    /* friends keep looking at each other, tiny bounces */
    if (st.peerPhase === "friend") {
      body.face.setLook(55 + Math.sin(now * 0.002) * 12, 8);
      peer.face.setLook(-55 - Math.sin(now * 0.002) * 12, 8);
    }
  }

  /* ============================================================
     INTRO — device boot
     ============================================================ */
  let bootIdx = 0, woke = false, handed = false;
  function introScale() { return st.direction === "sandbox" ? 0.4 : 1; }

  function runIntro(dt) {
    st.introT += dt / 1000;
    const t = st.introT / introScale();
    const beats = [0.13, 0.5, 0.87, 1.24, 1.61, 1.98];
    while (bootIdx < BOOT_LINES.length && t > beats[bootIdx]) {
      emit("boot", BOOT_LINES[bootIdx]);
      if (sound) sound.bootTick();
      bootIdx++;
    }
    const A = clamp(t / 1.1, 0, 1);
    const B = clamp((t - 1.0) / 2.6, 0, 1);
    cam.dist = lerp(lerp(9.4, 7.4, ease(A)), CAM_HOME.dist, ease(B));
    cam.yaw = lerp(lerp(-1.5, -1.0, ease(A)), CAM_HOME.yaw, ease(B));
    cam.pitch = lerp(lerp(0.7, 0.5, ease(A)), CAM_HOME.pitch, ease(B));
    Object.assign(camT, { yaw: cam.yaw, pitch: cam.pitch, dist: cam.dist });

    if (!woke && t >= 3.1) {
      woke = true;
      body.face.react("REACTION_WAKE_BLINK");
      if (sound) sound.bootChirp();
      body.bounce(0.8);
    }
    if (!handed && t >= 4.1) handOver(false);
  }

  function handOver(skipped) {
    handed = true;
    st.phase = "live";
    if (skipped) {
      Object.assign(cam, CAM_HOME); Object.assign(camT, CAM_HOME);
      body.face.react("REACTION_WAKE_BLINK");
    }
    emotion.state.lastInteractAt = performance.now();
    emit("phase", "live");
  }

  /* ============================================================
     LOOP
     ============================================================ */
  let lastVarsEmit = 0, lastExpr = null;
  function frame(now) {
    const dt = Math.min(60, now - (lastT || now)); lastT = now;

    if (st.phase === "intro") runIntro(dt);
    else {
      cam.yaw = damp(cam.yaw, camT.yaw, 0.12, dt);
      cam.pitch = damp(cam.pitch, camT.pitch, 0.12, dt);
      cam.dist = damp(cam.dist, camT.dist, 0.1, dt);
    }

    /* emotion engine tick */
    if (st.phase === "live") {
      const res = emotion.update(dt, now);
      if (res.expression !== lastExpr) {
        lastExpr = res.expression;
        body.face.setExpression(res.expression);
        emit("expr", res.expression);
        if (res.expression === "PET_EXPR_ASLEEP") action("SLEEP · ZZZ");
      }
      if (res.reaction) {
        body.face.react(res.reaction);
        emit("react", res.reaction);
      }
      if (now - lastVarsEmit > 240) {
        lastVarsEmit = now;
        emit("vars", { ...emotion.vars });
        emit("battery", emotion.state.battery);
      }
      /* charging overlay text like the firmware's percent cycle */
      if (emotion.state.charging && Math.floor(now / 2500) % 2 === 0) {
        body.face.setOverlayText(Math.round(emotion.state.battery * 100) + "%");
      } else if (!st.peerPhase) {
        body.face.setOverlayText(null);
      }
      runPeer(dt, now);
    }

    body.update(now, dt);
    if (peer.group.visible) peer.update(now, dt);
    applyCamera();
    renderer.render(scene, camera);
    if (active) raf = requestAnimationFrame(frame);
  }

  /* ============================================================
     PUBLIC API
     ============================================================ */
  const api = {
    on, off,
    get state() { return st; },
    get vars() { return emotion ? emotion.vars : {}; },
    get face() { return body ? body.face : null; },

    start(opts = {}) {
      mountEl = opts.mount || mountEl;
      if (!initScene()) return false;
      active = true;
      st.direction = opts.direction || "cinematic";
      st.phase = "intro"; st.introT = 0;
      bootIdx = 0; woke = false; handed = false;
      st.peerPhase = null; st.inspecting = false; st.lastAction = null;
      lastExpr = null;
      peer.group.visible = false;
      peer.group.position.x = PEER_X.out;
      body.face.setExpression("PET_EXPR_CALM");
      body.face.setIndicator(null);

      const reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (!sound) sound = window.makeKerfurDemoSound();
      const saved = localStorage.getItem("mo_demo_sound");
      st.soundOn = saved == null ? true : saved === "1";
      sound.setMuted(!st.soundOn);
      sound.setLevel((window.__demoTweaks || {}).soundLevel || 0.8);
      sound.start();

      Object.assign(cam, { yaw: -1.5, pitch: 0.7, dist: 9.4, y: 0 });
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
      setPetting(false);
      setTimeout(() => { active = false; cancelAnimationFrame(raf); st.phase = "idle"; }, 480);
    },

    notify(kind) {
      if (st.phase !== "live") return;
      if (kind === "important") post("NOTIFICATION_IMPORTANT", "NOTIF · IMPORTANT");
      else if (kind === "burst") {
        action("NOTIF BURST · ×5");
        let i = 0;
        const t = setInterval(() => {
          post("NOTIFICATION_RECEIVED");
          if (++i >= 5) clearInterval(t);
        }, 420);
      } else post("NOTIFICATION_RECEIVED", "NOTIF · MESSAGE");
    },

    setCharging(b) {
      if (st.phase !== "live") return;
      post(b ? "CHARGING_STARTED" : "CHARGING_STOPPED", b ? "CHARGER · PLUGGED" : "CHARGER · UNPLUGGED");
      if (!b) body.face.setOverlayText(null);
      emit("charging", b);
    },

    encounter,
    inspect(b) {
      st.inspecting = b;
      emit("inspect", b);
      if (sound) sound.uiTick(b ? "on" : "off");
    },
    resetView() {
      Object.assign(camT, CAM_HOME);
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
    /* inspect-view passthroughs (the overlay reuses the same engine) */
    faceTap(x, y) { if (body) { body.face.setLook(x, y); post("TOUCH_TAP", "TAP · OLED"); } },
    faceStroke() { post("TOUCH_STROKE", "STROKE · OLED"); },
    faceLook(x, y) { if (body) body.face.setLook(x, y); },
    facePet(b) { setPetting(b); },
  };

  window.addEventListener("keydown", (e) => {
    if (!active) return;
    if (st.phase === "intro" && (e.key === " " || e.key === "Enter")) { e.preventDefault(); api.skip(); }
  }, true);

  window.KerfurDemo = api;
})();
