/* ============================================================
   M.O. SYSTEM — Shared project model utilities
   Cached GLB loading, model fitting, and primitive mesh creation.

   Exposes:
     window.loadProjectModel(url, THREE)
     window.preloadModels(urls, THREE)
     window.fitModelToSize(root, THREE, targetSize)
     window.makePrimitiveMesh(kind, THREE, { wireframe })
   ============================================================ */

(function () {
  const SIGNAL = 0x00f0c8;

  /* ============================================================
     GLB model loader · shared cache · cloned per consumer
     ============================================================
     Both the universe tiles and project renderers pull
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

  /* Resolve the one cached source scene for a URL. Consumers normally need a
     clone because they change transforms/materials; speculative warm-up does
     not. Keeping those two jobs separate avoids cloning every model once just
     to immediately throw that clone away in preloadModels(). */
  function ensureProjectModel(url, THREE) {
    if (!url) return Promise.reject(new Error("no model url"));
    if (_gltfCache.has(url)) return _gltfCache.get(url);
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
    return p;
  }

  window.loadProjectModel = function (url, THREE) {
    return ensureProjectModel(url, THREE).then((root) => root.clone(true));
  };

  /* Preload a list of GLB URLs — kicks off the same cached fetch+parse used
     by loadProjectModel, so by the time any tile/viewer asks for a model the
     promise is already resolved (or at least in-flight). Safe to call from
     the shared warm-up in core.jsx: it waits until THREE.GLTFLoader is available, and
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
      urls.map((u) => ensureProjectModel(u, window.THREE).then(() => null).catch(() => null))
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
})();
