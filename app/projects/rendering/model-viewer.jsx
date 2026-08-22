/* ============================================================
   M.O. SYSTEM — Project model viewer
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

  /* ============================================================
     GLB model loader · shared cache · cloned per consumer
     ============================================================
     Both the universe tiles and this project-page viewer pull
     models through here. The first request kicks off a fetch +
     parse; every subsequent caller awaits the same promise and
     gets a fresh THREE.Group clone — so we never re-download or
     re-parse the same .glb. */
  const _gltfCache = new Map();   // url -> Promise<THREE.Group>
  const _constrainedDevice = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
    || (navigator.deviceMemory && navigator.deviceMemory <= 4)
    || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4);
  const _modelJobLimit = _constrainedDevice ? 2 : 4;
  const _modelJobs = [];
  let _activeModelJobs = 0;

  function drainModelJobs() {
    while (_activeModelJobs < _modelJobLimit && _modelJobs.length) {
      const job = _modelJobs.shift();
      _activeModelJobs += 1;
      Promise.resolve()
        .then(job.run)
        .then(job.resolve, job.reject)
        .finally(() => {
          _activeModelJobs -= 1;
          drainModelJobs();
        });
    }
  }

  function scheduleModelJob(run) {
    return new Promise((resolve, reject) => {
      _modelJobs.push({ run, resolve, reject });
      drainModelJobs();
    });
  }

  /* KTX2 / Basis transcoder — production Wafer exports carry compressed
     textures (gltfpack -tc). GLTFLoader needs a KTX2Loader wired before it
     will parse them, and the KTX2Loader needs detectSupport(renderer) once so
     it knows which GPU formats to transcode to. Build a single shared instance
     lazily (throwaway renderer just for capability detection). */
  let _ktx2 = null;
  function getKTX2Loader(THREE) {
    if (_ktx2 !== null) return _ktx2 || null;
    if (!THREE.KTX2Loader) { _ktx2 = false; return null; }
    const k = new THREE.KTX2Loader()
      .setTranscoderPath("https://unpkg.com/three@0.160.0/examples/jsm/libs/basis/")
      .setWorkerLimit(_constrainedDevice ? 1 : 2);
    let r = null;
    try {
      r = new THREE.WebGLRenderer({ antialias: false, depth: false, stencil: false });
      k.detectSupport(r);
    } catch (e) { console.warn("[model-viewer] KTX2 detectSupport failed", e); }
    finally {
      if (r) {
        r.dispose();
        if (r.forceContextLoss) r.forceContextLoss();
      }
    }
    _ktx2 = k;
    return k;
  }

  window.loadProjectModel = function (url, THREE) {
    if (!url) return Promise.reject(new Error("no model url"));
    if (_gltfCache.has(url)) {
      return _gltfCache.get(url).then((root) => root.clone(true));
    }
    const LoaderCtor = THREE.GLTFLoader || (window.THREE && window.THREE.GLTFLoader);
    if (!LoaderCtor) {
      return Promise.reject(new Error("GLTFLoader not loaded — add it after three.min.js"));
    }
    const p = scheduleModelJob(() => new Promise((resolve, reject) => {
      const loader = new LoaderCtor();
      // Meshopt-compressed GLBs (e.g. wafer.glb, optimized from 16 MB → 2 MB)
      // need the decoder wired in before .load(); uncompressed GLBs ignore it.
      const Meshopt = THREE.MeshoptDecoder || window.MeshoptDecoder;
      if (Meshopt && loader.setMeshoptDecoder) loader.setMeshoptDecoder(Meshopt);
      // KTX2/Basis textures in the Wafer exports need the transcoding loader.
      const ktx2 = getKTX2Loader(THREE);
      if (ktx2 && loader.setKTX2Loader) loader.setKTX2Loader(ktx2);
      loader.load(
        url,
        (gltf) => resolve(gltf.scene),
        undefined,
        (err) => reject(err),
      );
    }));
    _gltfCache.set(url, p);
    p.catch(() => {
      if (_gltfCache.get(url) === p) _gltfCache.delete(url);
    });
    return p.then((root) => root.clone(true));
  };

  /* Preload a list of GLB URLs — kicks off the same cached fetch+parse used
     by loadProjectModel, so by the time any tile/viewer asks for a model the
     promise is already resolved (or at least in-flight). Safe to call from
     the Boot preloader: it waits until THREE.GLTFLoader is available, and
     swallows individual failures so one bad URL doesn't block the rest. */
  window.preloadModels = function (urls) {
    if (!urls || !urls.length) return Promise.resolve();
    const ready = () => (window.THREE && window.THREE.GLTFLoader);
    const wait = ready()
      ? Promise.resolve()
      : new Promise((res) => {
          const id = setInterval(() => { if (ready()) { clearInterval(id); res(); } }, 30);
        });
    return wait.then(() => Promise.all(
      urls.map((u) => window.loadProjectModel(u, window.THREE).catch(() => null))
    ));
  };
  window.dispatchEvent(new Event("mo:model-loader-ready"));

  /* Fit-and-centre helper — recentres a loaded model on its bounding-box
     centre and scales it so its longest edge equals `targetSize` world units.
     Returns the bounding box for any further measurement work. */
  window.fitModelToSize = function (root, THREE, targetSize) {
    const box = new THREE.Box3().setFromObject(root);
    const size = new THREE.Vector3();
    box.getSize(size);
    const centre = new THREE.Vector3();
    box.getCenter(centre);
    const longest = Math.max(size.x, size.y, size.z) || 1;
    const s = targetSize / longest;
    root.position.sub(centre.multiplyScalar(s));
    root.scale.multiplyScalar(s);
    return box;
  };

  /* ============================================================
     Procedural matcap — dark-chrome with a subtle signal-teal rim
     ============================================================
     Generated as a canvas texture so we don't have to ship a PNG.
     Returns the same THREE.CanvasTexture on every call (cached).
     Swap for a real .png later by replacing the canvas data. */
  let _matcapTexture = null;
  window.makeMatcapTexture = function (THREE) {
    if (_matcapTexture) return _matcapTexture;
    const SZ = 256;
    const c = document.createElement("canvas");
    c.width = c.height = SZ;
    const x = c.getContext("2d");

    // Base sphere lighting — bright top-left, dark bottom-right
    const grad = x.createRadialGradient(
      SZ * 0.34, SZ * 0.30, SZ * 0.04,
      SZ * 0.50, SZ * 0.50, SZ * 0.62,
    );
    grad.addColorStop(0.00, "#f4f6fa");
    grad.addColorStop(0.18, "#9aa3b3");
    grad.addColorStop(0.45, "#3a4250");
    grad.addColorStop(0.78, "#161a22");
    grad.addColorStop(1.00, "#05070b");
    x.fillStyle = grad;
    x.beginPath(); x.arc(SZ / 2, SZ / 2, SZ / 2, 0, Math.PI * 2); x.fill();

    // Signal-teal rim — picks up the silhouette edge
    const rim = x.createRadialGradient(
      SZ / 2, SZ / 2, SZ * 0.42,
      SZ / 2, SZ / 2, SZ / 2,
    );
    rim.addColorStop(0.00, "rgba(0, 240, 200, 0)");
    rim.addColorStop(0.82, "rgba(0, 240, 200, 0)");
    rim.addColorStop(0.97, "rgba(0, 240, 200, 0.55)");
    rim.addColorStop(1.00, "rgba(0, 240, 200, 0)");
    x.fillStyle = rim;
    x.beginPath(); x.arc(SZ / 2, SZ / 2, SZ / 2, 0, Math.PI * 2); x.fill();

    // Specular hot-spot
    const spec = x.createRadialGradient(
      SZ * 0.32, SZ * 0.26, 0,
      SZ * 0.32, SZ * 0.26, SZ * 0.18,
    );
    spec.addColorStop(0.0, "rgba(255,255,255,0.85)");
    spec.addColorStop(1.0, "rgba(255,255,255,0)");
    x.fillStyle = spec;
    x.beginPath(); x.arc(SZ / 2, SZ / 2, SZ / 2, 0, Math.PI * 2); x.fill();

    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    _matcapTexture = tex;
    return tex;
  };

  /* Walk a loaded GLB scene and replace every mesh with LineSegments built
     from its EdgesGeometry. Preserves the local transforms (position /
     rotation / scale) so the line-converted model occupies the exact same
     space as the original mesh. Used by the page-entry FlyInOverlay to keep
     the existing line-style intro while showing the real model shape. */
  window.applyWireframeToModel = function (root, THREE, opts = {}) {
    const color     = opts.color     ?? SIGNAL;
    const opacity   = opts.opacity   ?? 0.9;
    const threshold = opts.threshold ?? 25;       // hard-edge angle threshold

    // Collect first, mutate after — modifying a tree while traversing it is bad.
    const meshes = [];
    root.traverse((obj) => { if (obj.isMesh) meshes.push(obj); });

    for (const m of meshes) {
      if (!m.geometry) continue;
      const edges = new THREE.EdgesGeometry(m.geometry, threshold);
      const mat = new THREE.LineBasicMaterial({
        color, transparent: true, opacity, depthWrite: false,
      });
      const line = new THREE.LineSegments(edges, mat);
      line.position.copy(m.position);
      line.quaternion.copy(m.quaternion);
      line.scale.copy(m.scale);
      const parent = m.parent;
      if (parent) {
        parent.add(line);
        parent.remove(m);
      }
      // dispose the original mesh's GPU resources — we're replacing them
      m.geometry.dispose();
      if (m.material && m.material.dispose) m.material.dispose();
    }
  };

  /* Walk a loaded GLB scene and replace every mesh's material with a
     shared MeshMatcapMaterial. Used for the small universe-card overlays
     where we want a consistent, performance-friendly look across all 12
     cards regardless of how the model was textured in Spline. */
  window.applyMatcapToModel = function (root, THREE) {
    const matcap = window.makeMatcapTexture(THREE);
    root.traverse((obj) => {
      if (!obj.isMesh) return;
      // dispose previous material (Spline export) to avoid GPU leaks
      const prev = obj.material;
      obj.material = new THREE.MeshMatcapMaterial({
        matcap,
        transparent: true,
        opacity: 1,
        depthWrite: true,
      });
      if (prev && prev.dispose) prev.dispose();
    });
  };

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
  function ProjectViewer3D({ primitive, dims, model, modelFit, modelPose, scheme = "demo" }) {
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

      // Primitive (or placeholder until the real GLB resolves).
      // When `model` is provided, we still create the procedural mesh as an
      // invisible stand-in so the orbit / animation loop has a stable object,
      // then swap-in the loaded GLB once available — keeping its Spline PBR
      // materials and letting this scene's lighting do the rest.
      const mesh = window.makePrimitiveMesh(primitive, THREE, { wireframe: false });
      orientForKind(primitive, mesh);
      if (model) {
        mesh.visible = false;     // hide placeholder; GLB takes over
      }
      scene.add(mesh);
      stageRef.current.mesh = mesh;

      let loadedModel = null;
      if (model && window.loadProjectModel) {
        window.loadProjectModel(model, THREE).then((root) => {
          window.fitModelToSize(root, THREE, (modelFit || 2) * 1.2);
          // Optional per-project rest pose — applied as a delta, so the model
          // keeps the centring offset from fitModelToSize on root.position.
          if (modelPose) {
            root.rotation.x += modelPose.x || 0;
            root.rotation.y += modelPose.y || 0;
            root.rotation.z += modelPose.z || 0;
          }
          scene.add(root);
          loadedModel = root;
          stageRef.current.mesh = root;
          // dispose the placeholder we never showed
          mesh.geometry?.dispose();
          mesh.material?.dispose();
          scene.remove(mesh);
        }).catch((err) => {
          // Loader failed — fall back to the placeholder so the page still works.
          console.warn("[model-viewer] model load failed", err);
          mesh.visible = true;
        });
      }

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
    }, [primitive, model]);

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

          {/* placeholder hint — only while no real model is wired up */}
          {!model && (
            <div className="pv__hint">
              <span className="pv__hintDot" />
              <span>placeholder · drop real model later</span>
            </div>
          )}

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
          <span className="pv__footV">{model ? model.split("/").pop() : primitive + ".placeholder.glb"}</span>
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
