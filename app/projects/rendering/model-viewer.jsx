/* ============================================================
   M.O. SYSTEM — Shared project model utilities
   Cached GLB loading and model fitting.

   Exposes:
     window.loadProjectModel(url, THREE)
     window.preloadModels(urls, THREE)
     window.fitModelToSize(root, THREE, targetSize)
   ============================================================ */

(function () {
  /* ============================================================
     GLB model loader · shared cache · cloned per consumer
     ============================================================
     Both the universe tiles and project renderers pull
     models through here. The first request kicks off a fetch +
     parse; every subsequent caller awaits the same promise and
     gets a fresh THREE.Group clone — so we never re-download or
     re-parse the same .glb. */
  const _gltfCache = new Map();   // url -> Promise<THREE.Group>
  const _withoutKTX2 = new WeakSet();
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
    if (_ktx2) return _ktx2;
    // A text/project route may load the texture decoder only on menu intent.
    // Its earlier absence must not become a permanent negative cache.
    if (!THREE.KTX2Loader) return null;
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
    if (_gltfCache.has(url)) {
      const cached = _gltfCache.get(url);
      // A prewarm already in flight may lack the newly installed decoder.
      // Keep successful work; retry only that failed capability-limited load.
      return THREE.KTX2Loader && _withoutKTX2.has(cached)
        ? cached.catch(() => ensureProjectModel(url, THREE)) : cached;
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
    if (!THREE.KTX2Loader) _withoutKTX2.add(p);
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
})();
