/* ============================================================
   M.O. SYSTEM — Project 3D viewer
   Solid-shaded primitive with corner reticles + measurement labels.
   START DEMO unlocks drag-to-orbit + scroll-to-zoom.

   Also exposes:
     window.makePrimitiveMesh(kind, THREE, { wireframe })
   so universe.jsx can drop tiny wireframe twins onto each tile.
   ============================================================ */

(function () {
  const SIGNAL = 0x00f0c8;
  const SIGNAL_DIM = 0x00a88c;
  const HAIRLINE = 0x232a3a;
  const BONE = 0xe6e8ee;

  /* ---------- geometry per primitive kind ---------- */
  function makePrimitiveGeometry(kind, THREE) {
    switch (kind) {
      case "slab": {
        // rounded-box approximation via beveled box (ExtrudeGeometry from a rect shape)
        // fall back to BoxGeometry — simpler + reads as a "wafer"
        const g = new THREE.BoxGeometry(2.6, 0.18, 1.7, 1, 1, 1);
        return g;
      }
      case "sphere":
        return new THREE.SphereGeometry(0.9, 36, 24);
      case "torus":
        return new THREE.TorusGeometry(0.85, 0.22, 18, 48);
      case "cone":
        return new THREE.ConeGeometry(0.6, 2.2, 32, 1, false);
      default:
        return new THREE.BoxGeometry(1.4, 1.4, 1.4);
    }
  }

  /* ---------- shared mesh factory ---------- */
  // For tile-overlay: wireframe = true → returns a LineSegments
  // For demo page:   wireframe = false → returns a Mesh (solid)
  window.makePrimitiveMesh = function (kind, THREE, opts = {}) {
    const wire = !!opts.wireframe;
    const geo = makePrimitiveGeometry(kind, THREE);

    if (wire) {
      const wireGeo = new THREE.EdgesGeometry(geo, 25);
      const mat = new THREE.LineBasicMaterial({
        color: opts.color ?? SIGNAL,
        transparent: true,
        opacity: opts.opacity ?? 0.9,
        depthWrite: false,
      });
      const line = new THREE.LineSegments(wireGeo, mat);
      line.userData.kind = kind;
      // dispose original geo — we only need edges
      geo.dispose();
      return line;
    } else {
      const mat = new THREE.MeshStandardMaterial({
        color: 0x0e1218,
        roughness: 0.42,
        metalness: 0.55,
        emissive: 0x06121b,
        emissiveIntensity: 0.35,
      });
      const mesh = new THREE.Mesh(geo, mat);
      // signal-edge wireframe overlay
      const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(geo, 25),
        new THREE.LineBasicMaterial({ color: SIGNAL, transparent: true, opacity: 0.45, depthWrite: false })
      );
      mesh.add(edges);
      mesh.userData.kind = kind;
      return mesh;
    }
  };

  /* ---------- canonical orientation per kind ---------- */
  function orientForKind(kind, mesh) {
    if (kind === "cone") mesh.rotation.set(0, 0, Math.PI / 2);   // flashlight: lay horizontal
    if (kind === "torus") mesh.rotation.set(Math.PI * 0.32, 0.4, 0);
    if (kind === "slab")  mesh.rotation.set(0.22, 0.6, 0);
  }
  window.orientPrimitive = orientForKind;

  /* ============================================================
     React component — <ProjectViewer3D primitive=... dims=... />
     ============================================================ */
  function ProjectViewer3D({ primitive, dims, scheme = "demo" }) {
    const mountRef   = React.useRef(null);
    const stageRef   = React.useRef({});
    const [active, setActive] = React.useState(false);

    React.useEffect(() => {
      const THREE = window.THREE;
      const mount = mountRef.current;
      if (!THREE || !mount) return;

      const sz = () => ({ w: mount.clientWidth, h: mount.clientHeight });
      let { w, h } = sz();

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(w, h);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      mount.appendChild(renderer.domElement);

      const scene = new THREE.Scene();

      const camera = new THREE.PerspectiveCamera(38, w / h, 0.1, 100);
      camera.position.set(0, 0.8, 5.2);
      camera.lookAt(0, 0, 0);

      // lights — deep + signal rim
      scene.add(new THREE.AmbientLight(0xffffff, 0.45));
      const key = new THREE.DirectionalLight(0xffffff, 1.2);
      key.position.set(2.4, 3.2, 2.0);
      scene.add(key);
      const rim = new THREE.PointLight(SIGNAL, 1.6, 12);
      rim.position.set(-2.2, 1.6, -2.2);
      scene.add(rim);
      const fill = new THREE.PointLight(0x4a6b9c, 0.6, 14);
      fill.position.set(2.8, -2.2, 1.2);
      scene.add(fill);

      // floor grid — light, hairline
      const grid = new THREE.GridHelper(8, 16, HAIRLINE, HAIRLINE);
      grid.position.y = -1.4;
      grid.material.transparent = true;
      grid.material.opacity = 0.35;
      scene.add(grid);

      // primitive
      const mesh = window.makePrimitiveMesh(primitive, THREE, { wireframe: false });
      orientForKind(primitive, mesh);
      scene.add(mesh);
      stageRef.current.mesh = mesh;

      /* ---------- orbit state ---------- */
      const orbit = { yaw: mesh.rotation.y, pitch: mesh.rotation.x, dist: 5.2 };
      const orbitT = { yaw: mesh.rotation.y, pitch: mesh.rotation.x, dist: 5.2 };

      // damping helper
      function applyCamera() {
        const r = orbit.dist;
        camera.position.set(
          Math.sin(orbit.yaw) * Math.cos(orbit.pitch) * r,
          Math.sin(orbit.pitch) * r,
          Math.cos(orbit.yaw) * Math.cos(orbit.pitch) * r,
        );
        camera.lookAt(0, 0, 0);
      }
      applyCamera();

      /* ---------- input — only when active ---------- */
      let dragging = false, lx = 0, ly = 0;
      const dom = renderer.domElement;
      dom.style.touchAction = "none";

      function onDown(e) {
        if (!stageRef.current.active) return;
        dragging = true;
        lx = e.clientX; ly = e.clientY;
        dom.setPointerCapture?.(e.pointerId);
      }
      function onMove(e) {
        if (!dragging) return;
        const dx = e.clientX - lx, dy = e.clientY - ly;
        lx = e.clientX; ly = e.clientY;
        orbitT.yaw   -= dx * 0.006;
        orbitT.pitch -= dy * 0.006;
        orbitT.pitch = Math.max(-1.2, Math.min(1.2, orbitT.pitch));
      }
      function onUp(e) {
        dragging = false;
        try { dom.releasePointerCapture?.(e.pointerId); } catch (_) {}
      }
      function onWheel(e) {
        if (!stageRef.current.active) return;
        e.preventDefault();
        orbitT.dist += e.deltaY * 0.004;
        orbitT.dist = Math.max(2.4, Math.min(9.5, orbitT.dist));
      }

      dom.addEventListener("pointerdown", onDown);
      dom.addEventListener("pointermove", onMove);
      dom.addEventListener("pointerup", onUp);
      dom.addEventListener("pointercancel", onUp);
      dom.addEventListener("wheel", onWheel, { passive: false });

      /* ---------- resize ---------- */
      const ro = new ResizeObserver(() => {
        const s = sz(); w = s.w; h = s.h;
        if (!w || !h) return;
        renderer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      });
      ro.observe(mount);

      /* ---------- loop ---------- */
      let raf, last = performance.now();
      function frame(now) {
        const dt = Math.min(50, now - last); last = now;

        // ambient auto-rotate when idle
        if (!stageRef.current.active) {
          orbitT.yaw += dt * 0.0006;
          orbitT.pitch += Math.sin(now * 0.0004) * dt * 0.00003;
        }

        const k = 1 - Math.pow(0.001, dt / 1000);
        orbit.yaw   += (orbitT.yaw   - orbit.yaw)   * k;
        orbit.pitch += (orbitT.pitch - orbit.pitch) * k;
        orbit.dist  += (orbitT.dist  - orbit.dist)  * k;
        applyCamera();

        renderer.render(scene, camera);
        raf = requestAnimationFrame(frame);
      }
      raf = requestAnimationFrame(frame);

      return () => {
        cancelAnimationFrame(raf);
        ro.disconnect();
        dom.removeEventListener("pointerdown", onDown);
        dom.removeEventListener("pointermove", onMove);
        dom.removeEventListener("pointerup", onUp);
        dom.removeEventListener("pointercancel", onUp);
        dom.removeEventListener("wheel", onWheel);
        try { mount.removeChild(dom); } catch (_) {}
        renderer.dispose();
      };
    }, [primitive]);

    React.useEffect(() => { stageRef.current.active = active; }, [active]);

    const d = dims || { d: "—", w: "—", h: "—" };
    return (
      <div className="pv">
        <div className="pv__chrome">
          <span className="pv__chromeDot" />
          <span>DEMO · MODEL</span>
          <span className="pv__chromeSep" />
          <span>{primitive.toUpperCase()}</span>
          <span className="pv__chromeSep" />
          <span className={"pv__chromeMode " + (active ? "is-on" : "")}>
            {active ? "● ORBIT" : "○ IDLE"}
          </span>
        </div>

        <div className="pv__stage">
          <div className="pv__mount" ref={mountRef} />
          {/* corner reticles */}
          <div className="pv__cornerL pv__corner pv__corner--tl" />
          <div className="pv__cornerL pv__corner pv__corner--tr" />
          <div className="pv__cornerL pv__corner pv__corner--bl" />
          <div className="pv__cornerL pv__corner pv__corner--br" />

          {/* measurement labels */}
          <div className="pv__measure pv__measure--top">
            <span className="pv__measureTick" />
            <span className="pv__measureLabel">D · {d.d} mm</span>
            <span className="pv__measureTick" />
          </div>
          <div className="pv__measure pv__measure--right">
            <span className="pv__measureTick" />
            <span className="pv__measureLabel">H · {d.h} mm</span>
            <span className="pv__measureTick" />
          </div>
          <div className="pv__measure pv__measure--bot">
            <span className="pv__measureTick" />
            <span className="pv__measureLabel">W · {d.w} mm</span>
            <span className="pv__measureTick" />
          </div>

          {/* placeholder hint */}
          <div className="pv__hint">
            <span className="pv__hintDot" />
            <span>placeholder · drop real model later</span>
          </div>

          {/* start demo overlay (covers when idle, hidden when active) */}
          {!active && (
            <div className="pv__startWrap">
              <div className="pv__startInner">
                <span className="pv__startK">DRAG · ORBIT</span>
                <span className="pv__startSep">·</span>
                <span className="pv__startK">SCROLL · ZOOM</span>
              </div>
              <KeyButton legend="↵" primary onPress={() => setActive(true)}>
                START DEMO
              </KeyButton>
            </div>
          )}

          {/* stop button when active */}
          {active && (
            <button className="pv__stop" onClick={() => setActive(false)}>
              <span>● LIVE</span>
              <span className="pv__stopSep" />
              <span>STOP DEMO</span>
            </button>
          )}
        </div>

        <div className="pv__foot">
          <span className="pv__footK">FILE</span>
          <span className="pv__footV">{primitive}.placeholder.glb</span>
          <span className="pv__footSep" />
          <span className="pv__footK">SCALE</span>
          <span className="pv__footV">1 : 1</span>
          <span className="pv__footSep" />
          <span className="pv__footK">MODE</span>
          <span className="pv__footV">{active ? "interactive" : "auto-rotate"}</span>
        </div>
      </div>
    );
  }

  window.ProjectViewer3D = ProjectViewer3D;
})();
