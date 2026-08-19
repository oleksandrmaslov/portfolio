/* ============================================================
   M.O. SYSTEM — ISKRA 3D · INSPECT STAGE  (node 0x09)
   ------------------------------------------------------------
   <IskraStage3D active tweaks /> — the optical bench. Owns the
   THREE renderer/scene/camera, builds each procedural PCB the
   station deals, and reacts to station events:

     board        → dispose old · build + DEAL IN the new PCB
     highlight    → pulse the MCU (SCAN)
     assemble     → power LEDs + close the enclosure (correct FLASH)
     discard      → slide the board off the bench (REJECT)
     reject-shake → red error shake (wrong fw / scan-saved)

   Controls: drag = orbit · wheel/pinch = zoom · RESET button.
   Camera orbits the origin; the board floats over a lit bench
   with a soft contact shadow. Each board carries a benchYaw so
   it rests at its own angle — more "every board is different".
   ============================================================ */
(function () {
  const { useState: uS, useEffect: uE, useRef: uR } = React;
  const TEAL = 0x00f0c8, BLUE = 0x2a8fff, YELLOW = 0xffe500;

  const easeOutCubic = (p) => 1 - Math.pow(1 - p, 3);
  const easeInOutCubic = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
  const easeOutBack = (p) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2); };
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  /* radial contact-shadow texture (cheap grounding) */
  function shadowTex(THREE) {
    const c = document.createElement("canvas"); c.width = c.height = 128;
    const x = c.getContext("2d");
    const g = x.createRadialGradient(64, 64, 4, 64, 64, 62);
    g.addColorStop(0, "rgba(0,0,0,0.55)"); g.addColorStop(0.6, "rgba(0,0,0,0.22)"); g.addColorStop(1, "rgba(0,0,0,0)");
    x.fillStyle = g; x.fillRect(0, 0, 128, 128);
    const t = new THREE.CanvasTexture(c); t.needsUpdate = true; return t;
  }
  /* soft pool-of-light texture for the bench */
  function benchTex(THREE) {
    const c = document.createElement("canvas"); c.width = c.height = 256;
    const x = c.getContext("2d");
    x.fillStyle = "#070a0e"; x.fillRect(0, 0, 256, 256);
    const g = x.createRadialGradient(128, 110, 10, 128, 128, 150);
    g.addColorStop(0, "rgba(40,60,74,0.5)"); g.addColorStop(0.5, "rgba(18,26,34,0.3)"); g.addColorStop(1, "rgba(7,10,14,0)");
    x.fillStyle = g; x.fillRect(0, 0, 256, 256);
    const t = new THREE.CanvasTexture(c); t.needsUpdate = true; return t;
  }
  /* vertical gradient for the sky dome — deep zenith, faint teal horizon, dark nadir.
     canvas row 0 (flipY) maps to +Y pole, row mid to the equator/horizon. */
  function skyTex(THREE) {
    const c = document.createElement("canvas"); c.width = 16; c.height = 512;
    const x = c.getContext("2d");
    const g = x.createLinearGradient(0, 0, 0, 512);
    g.addColorStop(0.00, "#05090f");   // zenith (straight up)
    g.addColorStop(0.34, "#0a131d");
    g.addColorStop(0.50, "#11212f");   // horizon band — faint lab glow
    g.addColorStop(0.66, "#0a121b");
    g.addColorStop(1.00, "#03060a");   // nadir (under the bench)
    x.fillStyle = g; x.fillRect(0, 0, 16, 512);
    const t = new THREE.CanvasTexture(c); t.needsUpdate = true; return t;
  }

  function makeStage(mount, THREE, getTweaks) {
    const sz = () => ({ w: mount.clientWidth || 1, h: mount.clientHeight || 1 });
    let { w, h } = sz();

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance", preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;

    // The WebGL canvas renders OFF-DOM (it still draws to its buffer). What
    // the user sees and interacts with is this 2D mirror, repainted from the
    // GL frame each tick. Keeping the GL canvas out of the DOM means capture
    // tools / contexts that render a live WebGL canvas as blank only ever see
    // this readable 2D canvas — so the bench shows up everywhere. Also a clean
    // fallback on GL context-loss.
    const mirror = document.createElement("canvas");
    mirror.className = "i3-mirror";
    mirror.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none;";
    const mctx = mirror.getContext("2d");
    mount.appendChild(mirror);   // the only canvas in the DOM

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, w / h, 0.05, 100);

    // SKY DOME — a gradient backdrop that rotates correctly with the camera, so
    // there's no transparent void / static-gradient artefact when you orbit to
    // the top. fog:false keeps the gradient crisp; depthWrite:false so it never
    // occludes the board.
    const sky = new THREE.Mesh(
      new THREE.SphereGeometry(48, 40, 20),
      new THREE.MeshBasicMaterial({ map: skyTex(THREE), side: THREE.BackSide, fog: false, depthWrite: false })
    );
    sky.name = "sky"; scene.add(sky);
    // distance fog matched to the horizon band — fades the grid/bench edges out
    // so there's no hard rim or moiré at grazing angles.
    scene.fog = new THREE.Fog(0x0a131d, 9, 27);

    // PBR environment for metal parts
    let envTex = null;
    try {
      const pmrem = new THREE.PMREMGenerator(renderer);
      envTex = pmrem.fromScene(new THREE.RoomEnvironment(), 0.04).texture;
      scene.environment = envTex;
    } catch (e) { /* no env — lights still carry it */ }

    // lights
    scene.add(new THREE.AmbientLight(0xb9c6d6, 0.5));
    const key = new THREE.DirectionalLight(0xffffff, 1.5);
    key.position.set(2.6, 4.2, 2.4); scene.add(key);
    const rim = new THREE.PointLight(TEAL, 1.5, 16); rim.position.set(-2.8, 1.4, -2.6); scene.add(rim);
    const fill = new THREE.PointLight(0x3a5f9c, 0.7, 18); fill.position.set(3.0, -1.6, 1.6); scene.add(fill);
    const top = new THREE.SpotLight(0xeaf2ff, 1.2, 18, Math.PI * 0.3, 0.6, 1.2);
    top.position.set(0, 6, 0.6); scene.add(top);

    // bench + grid + shadow
    const groundY = -1.35;
    const bench = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), new THREE.MeshStandardMaterial({ map: benchTex(THREE), roughness: 0.95, metalness: 0.0 }));
    bench.rotation.x = -Math.PI / 2; bench.position.y = groundY; scene.add(bench);
    const grid = new THREE.GridHelper(20, 40, 0x1b2530, 0x121a22);
    grid.position.y = groundY + 0.002; grid.material.transparent = true; grid.material.opacity = 0.5; scene.add(grid);
    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(3, 3), new THREE.MeshBasicMaterial({ map: shadowTex(THREE), transparent: true, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2; shadow.position.y = groundY + 0.004; scene.add(shadow);

    // scene graph: pivot (showcase spin + deal drop) → fit (scale) → board/enclosure
    const pivot = new THREE.Group(); scene.add(pivot);
    const fit = new THREE.Group(); pivot.add(fit);

    const stage = {
      tweens: [], board: null, enclosure: null, mode: "empty",
      orbit: { yaw: 0.5, pitch: 0.62, dist: 5.4 },
      orbitT: { yaw: 0.5, pitch: 0.62, dist: 5.4 },
      defaults: { yaw: 0.5, pitch: 0.62, dist: 5.4 },
      idle: 0, autoSpin: false, fitScale: 1, onMode: null,
    };

    function addTween(o) { stage.tweens.push({ t: -(o.delay || 0), dur: o.dur || 0.6, ease: o.ease || easeOutCubic, update: o.update, done: o.done, _d: false }); }
    function clearTweens() { stage.tweens.length = 0; }

    function applyCamera() {
      const r = stage.orbit.dist, p = stage.orbit.pitch, y = stage.orbit.yaw;
      camera.position.set(Math.sin(y) * Math.cos(p) * r, Math.sin(p) * r + 0.1, Math.cos(y) * Math.cos(p) * r);
      camera.lookAt(0, 0.05, 0);
    }
    applyCamera();

    /* ---------------- board lifecycle ---------------- */
    function disposeGroup(g) {
      g.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) { const m = o.material; (Array.isArray(m) ? m : [m]).forEach((x) => { if (x.map) x.map.dispose(); x.dispose && x.dispose(); }); }
      });
    }
    function clearBoard() {
      clearTweens();
      if (stage.enclosure) { fit.remove(stage.enclosure.group); disposeGroup(stage.enclosure.group); stage.enclosure = null; }
      if (stage.board) { fit.remove(stage.board); disposeGroup(stage.board); stage.board = null; }
      pivot.rotation.set(0, 0, 0); pivot.position.set(0, 0, 0);
    }

    function setBoard(entry) {
      clearBoard();
      const spec = entry.spec;
      const board = window.IskraBoard.buildBoard(spec, THREE);
      // fit so longest XZ extent ≈ 3.0 world units
      const longest = spec._layout.bp.shape === "round"
        ? (board.userData.radius * 2)
        : Math.max(board.userData.bw, board.userData.bh);
      const s = 3.0 / (longest || 2);
      stage.fitScale = s;
      fit.scale.setScalar(s);
      board.rotation.y = spec.benchYaw || 0;
      fit.add(board);
      stage.board = board; stage.mode = "inspect"; if (stage.onMode) stage.onMode("inspect");
      // contact shadow size
      shadow.scale.setScalar((longest * s) / 3 * 1.25);

      // DEAL IN — drop from above + slight overshoot settle + quick spin
      stage.orbitT.yaw = stage.defaults.yaw; stage.orbitT.pitch = stage.defaults.pitch; stage.orbitT.dist = stage.defaults.dist;
      const reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) { pivot.position.y = 0; return; }
      pivot.position.y = 3.2; pivot.rotation.y = -0.6;
      addTween({ dur: 0.8, ease: easeOutBack, update: (e) => { pivot.position.y = lerp(3.2, 0, e); } });
      addTween({ dur: 0.9, ease: easeOutCubic, update: (e) => { pivot.rotation.y = lerp(-0.6, 0, e); } });
    }

    /* ---------------- SCAN pulse ---------------- */
    function highlight(ref) {
      if (!stage.board) return;
      let target = null;
      stage.board.traverse((o) => { if (o.userData && o.userData.ref === ref && !target) target = o; });
      if (!target) return;
      const mats = [];
      target.traverse((o) => { if (o.isMesh && o.material) mats.push(o.material); });
      mats.forEach((m) => { m.userData._e0 = m.emissive ? m.emissive.getHex() : 0; });
      addTween({
        dur: 1.1, ease: (p) => Math.sin(p * Math.PI),
        update: (e) => { mats.forEach((m) => { if (m.emissive) { m.emissive.setHex(TEAL); m.emissiveIntensity = e * 1.4; } }); },
        done: () => { mats.forEach((m) => { if (m.emissive) { m.emissive.setHex(m.userData._e0 || 0); m.emissiveIntensity = 1; } }); },
      });
      // ground ping
      addTween({ dur: 0.9, ease: easeOutCubic, update: (e) => { rim.intensity = lerp(3.0, 1.5, e); } });
    }

    /* ---------------- ASSEMBLY (correct flash) ---------------- */
    function assemble(entry) {
      if (!stage.board) return;
      stage.mode = "assembling"; if (stage.onMode) stage.onMode("assembling");
      const enc = window.IskraEnclosure.buildEnclosure(stage.board, THREE);
      fit.add(enc.group);
      stage.enclosure = enc;

      // ease camera out to frame the finished unit
      stage.orbitT.dist = clamp(stage.defaults.dist + (enc.frameRadius || 1.6) * 1.1, 5.4, 9);
      stage.orbitT.pitch = 0.42;

      // 1) power the board LEDs on
      addTween({ dur: 0.5, delay: 0.0, update: (e) => window.IskraBoard.setGlow(stage.board, e) });

      // 2) fly each enclosure part from→to
      enc.group.traverse((o) => {
        const a = o.userData && o.userData.assembly;
        if (!a || a.static) return;
        addTween({
          dur: a.dur, delay: a.delay, ease: easeOutCubic,
          update: (e) => {
            o.position.set(lerp(a.fromPos.x, a.toPos.x, e), lerp(a.fromPos.y, a.toPos.y, e), lerp(a.fromPos.z, a.toPos.z, e));
            if (a.fromRot && a.toRot) o.rotation.set(lerp(a.fromRot.x, a.toRot.x, e), lerp(a.fromRot.y, a.toRot.y, e) + (a.spin ? (1 - e) * a.spin : 0), lerp(a.fromRot.z, a.toRot.z, e));
          },
        });
      });

      // 3) power-on glow of enclosure extras (beam / status) + showcase spin
      addTween({
        dur: 0.7, delay: 0.95, ease: easeOutCubic,
        update: (e) => {
          (enc.glows || []).forEach((g) => {
            if (g.light) g.light.intensity = (g.peak || 1) * e;
            else if (g.mat) { g.mat.emissiveIntensity = (g.peak || 1) * e; if (g.beam) g.mat.opacity = 0.18 * e; }
          });
        },
      });
      // showcase: tilt + slow rotate
      const tilt = enc.showcaseTilt || { x: -0.4, y: 0.6 };
      addTween({
        dur: 1.1, delay: 1.0, ease: easeInOutCubic,
        update: (e) => { pivot.rotation.x = lerp(0, tilt.x, e); },
        done: () => { stage.mode = "showcase"; if (stage.onMode) stage.onMode("showcase"); stage.autoSpin = true; },
      });
    }

    /* ---------------- DISCARD (reject) ---------------- */
    function discard(good) {
      if (!stage.board) return;
      stage.mode = "discard"; if (stage.onMode) stage.onMode("discard");
      const x0 = pivot.position.x, y0 = pivot.position.y, r0 = pivot.rotation.z;
      addTween({
        dur: 0.7, ease: (p) => p * p,
        update: (e) => {
          pivot.position.x = lerp(x0, -4.5, e);
          pivot.position.y = lerp(y0, groundY - 1.5, e);
          pivot.rotation.z = lerp(r0, -0.7, e);
          fit.children.forEach((c) => {});
        },
      });
    }

    /* ---------------- ERROR SHAKE ---------------- */
    function shake() {
      if (!stage.board) return;
      const r0 = pivot.rotation.z;
      addTween({
        dur: 0.55, ease: (p) => p,
        update: (e) => { pivot.rotation.z = r0 + Math.sin(e * Math.PI * 8) * 0.12 * (1 - e); },
        done: () => { pivot.rotation.z = r0; },
      });
    }

    function resetView() { stage.orbitT.yaw = stage.defaults.yaw; stage.orbitT.pitch = stage.defaults.pitch; stage.orbitT.dist = stage.defaults.dist; }

    /* ---------------- input (on the visible mirror canvas) ---------------- */
    const dom = mirror;
    const pointers = new Map();
    let lastDist = 0;
    function onDown(e) { dom.setPointerCapture?.(e.pointerId); pointers.set(e.pointerId, { x: e.clientX, y: e.clientY }); stage.idle = 0; stage.autoSpin = false; }
    function onMove(e) {
      const p = pointers.get(e.pointerId); if (!p) return;
      const px = e.clientX, py = e.clientY;
      if (pointers.size === 1) {
        const dx = px - p.x, dy = py - p.y;
        stage.orbitT.yaw -= dx * 0.006;
        stage.orbitT.pitch = clamp(stage.orbitT.pitch - dy * 0.006, -0.2, 1.45);
      } else if (pointers.size === 2) {
        const pts = [...pointers.values()];
        const d = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        if (lastDist) stage.orbitT.dist = clamp(stage.orbitT.dist - (d - lastDist) * 0.01, 2.0, 9);
        lastDist = d;
      }
      p.x = px; p.y = py; stage.idle = 0;
    }
    function onUp(e) { pointers.delete(e.pointerId); if (pointers.size < 2) lastDist = 0; try { dom.releasePointerCapture?.(e.pointerId); } catch (_) {} }
    function onWheel(e) { e.preventDefault(); stage.orbitT.dist = clamp(stage.orbitT.dist + e.deltaY * 0.0045, 2.0, 9); stage.idle = 0; stage.autoSpin = false; }
    dom.addEventListener("pointerdown", onDown);
    dom.addEventListener("pointermove", onMove);
    dom.addEventListener("pointerup", onUp);
    dom.addEventListener("pointercancel", onUp);
    dom.addEventListener("wheel", onWheel, { passive: false });

    function syncMirror() { const c = renderer.domElement; if (mirror.width !== c.width || mirror.height !== c.height) { mirror.width = c.width; mirror.height = c.height; } }
    syncMirror();
    const ro = new ResizeObserver(() => { const s = sz(); w = s.w; h = s.h; if (!w || !h) return; renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); syncMirror(); });
    ro.observe(mount);

    /* ---------------- loop ---------------- */
    let raf, last = performance.now();
    function frame(now) {
      const dt = Math.min(50, now - last); last = now;
      if (stage.paused) { raf = requestAnimationFrame(frame); return; }
      stage.idle += dt;

      // tweens
      for (let i = stage.tweens.length - 1; i >= 0; i--) {
        const tw = stage.tweens[i]; tw.t += dt / 1000;
        if (tw.t < 0) continue;
        const p = clamp(tw.t / tw.dur, 0, 1); tw.update(tw.ease(p));
        if (p >= 1 && !tw._d) { tw._d = true; tw.done && tw.done(); stage.tweens.splice(i, 1); }
      }

      // live tweaks: lab grid visibility + idle auto-rotate
      const tw = (getTweaks && getTweaks()) || {};
      const showGrid = tw.grid !== false;
      grid.visible = showGrid; bench.visible = showGrid;
      if (stage.mode === "showcase" || (tw.idleSpin && stage.mode === "inspect" && stage.idle > 2600 && pointers.size === 0)) {
        stage.orbitT.yaw += dt * (stage.mode === "showcase" ? 0.00035 : 0.00018);
      }

      const k = 1 - Math.pow(0.0015, dt / 1000);
      stage.orbit.yaw += (stage.orbitT.yaw - stage.orbit.yaw) * k;
      stage.orbit.pitch += (stage.orbitT.pitch - stage.orbit.pitch) * k;
      stage.orbit.dist += (stage.orbitT.dist - stage.orbit.dist) * k;
      applyCamera();
      rim.intensity += (1.5 - rim.intensity) * 0.05;

      renderer.render(scene, camera);
      try { mctx.drawImage(renderer.domElement, 0, 0, mirror.width, mirror.height); } catch (e) {}
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    stage.dispose = function () {
      cancelAnimationFrame(raf); ro.disconnect();
      dom.removeEventListener("pointerdown", onDown); dom.removeEventListener("pointermove", onMove);
      dom.removeEventListener("pointerup", onUp); dom.removeEventListener("pointercancel", onUp); dom.removeEventListener("wheel", onWheel);
      clearBoard(); if (envTex) envTex.dispose();
      try { mount.removeChild(dom); } catch (_) {}
      renderer.dispose();
    };
    stage.setBoard = setBoard; stage.highlight = (o) => highlight(o.ref); stage.assemble = assemble;
    stage.discard = discard; stage.shake = shake; stage.resetView = resetView;
    stage._scene = scene; stage._camera = camera; stage._renderer = renderer; stage._fit = fit; stage._pivot = pivot;
    window.__i3stage = stage;
    return stage;
  }

  /* ============================================================
     React wrapper
     ============================================================ */
  function IskraStage3D({ active, tweaks }) {
    const mountRef = uR(null);
    const stageRef = uR(null);
    const tweakRef = uR(tweaks);
    const [mode, setMode] = uS("empty");
    const [flash, setFlash] = uS(null);     // 'pass' | 'fail' | null
    const [showHint, setHint] = uS(true);
    uE(() => { tweakRef.current = tweaks; }, [tweaks]);
    // pause the render loop while the demo layer is hidden (e.g. after STOP)
    // so we're not spinning a WebGL context behind the case-file page.
    uE(() => { const s = stageRef.current; if (s) s.paused = active === false; }, [active]);

    uE(() => {
      const THREE = window.THREE; const mount = mountRef.current;
      if (!THREE || !mount) return;
      const stage = makeStage(mount, THREE, () => tweakRef.current || {});
      stage.onMode = setMode;
      stageRef.current = stage;

      const St = window.IskraStation3D;
      const flashT = { id: null };
      const doFlash = (k) => { setFlash(k); clearTimeout(flashT.id); flashT.id = setTimeout(() => setFlash(null), 520); };
      const offs = [
        ["board", (b) => { stage.setBoard(b); setHint(true); }],
        ["highlight", (o) => stage.highlight(o)],
        ["assemble", (o) => { stage.assemble(o); doFlash("pass"); }],
        ["discard", (o) => { stage.discard(o.good); doFlash(o.good ? "fail" : "pass"); }],
        ["reject-shake", () => { stage.shake(); doFlash("fail"); }],
      ].map(([ev, cb]) => [ev, St.on(ev, cb)]);

      // the first board is dealt as the shift screen mounts — if it already
      // landed before this stage subscribed, build it now so the bench isn't empty.
      const cur = St.state && St.state.board;
      if (cur && cur.spec) stage.setBoard(cur);

      return () => { offs.forEach(([ev, cb]) => St.off(ev, cb)); clearTimeout(flashT.id); stage.dispose(); stageRef.current = null; };
    }, []);

    // hide the "drag to inspect" hint after first interaction
    uE(() => {
      if (!showHint) return;
      const el = mountRef.current; if (!el) return;
      const hide = () => setHint(false);
      el.addEventListener("pointerdown", hide, { once: true });
      el.addEventListener("wheel", hide, { once: true });
      return () => { el.removeEventListener("pointerdown", hide); el.removeEventListener("wheel", hide); };
    }, [showHint, mode]);

    const inspectable = mode === "inspect";
    return (
      <div className={"i3-stage " + (flash ? "i3-stage--flash-" + flash : "")}>
        <div className="i3-mount" ref={mountRef} />

        <span className="i3-reticle i3-reticle--tl" />
        <span className="i3-reticle i3-reticle--tr" />
        <span className="i3-reticle i3-reticle--bl" />
        <span className="i3-reticle i3-reticle--br" />

        <div className="i3-chrome">
          <span className="i3-chrome__dot" />
          <span>OPTICAL BENCH</span>
          <span className="i3-chrome__sep" />
          <span className="i3-chrome__mode">{
            mode === "assembling" ? "● ASSEMBLING" :
            mode === "showcase" ? "● UNIT COMPLETE" :
            mode === "discard" ? "○ CLEARED" :
            mode === "inspect" ? "● INSPECT" : "○ STANDBY"
          }</span>
        </div>

        {inspectable && (
          <button className="i3-reset" onClick={() => stageRef.current && stageRef.current.resetView()}>
            <span className="i3-reset__g">⟲</span> RESET VIEW
          </button>
        )}

        {inspectable && showHint && (
          <div className="i3-hint">
            <span className="i3-hint__k">DRAG · ORBIT</span>
            <span className="i3-hint__sep">·</span>
            <span className="i3-hint__k">SCROLL · ZOOM IN TO READ THE SILKSCREEN</span>
          </div>
        )}
      </div>
    );
  }

  window.IskraStage3D = IskraStage3D;
})();
