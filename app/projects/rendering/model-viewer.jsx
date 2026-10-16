/* ============================================================
   M.O. SYSTEM — Shared project model utilities
   Cached GLB loading and model fitting.

   Exposes:
     window.loadProjectModel(url, THREE)
     window.preloadModels(urls, THREE)
     window.fitModelToSize(root, THREE, targetSize)

   The site loads no KTX2: every shipped GLB is meshopt geometry with
   plain or no textures, so there is no transcoder and no throwaway
   context to detect one. A future KTX2 asset brings the KTX2 loader back
   deliberately, with its transcoder in the budget. Fitting is the
   studio's (app/projects/rendering/studio.js): its box never
   counts a finish's glow.
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
      // Meshopt-compressed GLBs (gltfpack -c) need the decoder wired in
      // before .load(); uncompressed GLBs ignore it.
      const Meshopt = THREE.MeshoptDecoder || window.MeshoptDecoder;
      if (Meshopt && loader.setMeshoptDecoder) loader.setMeshoptDecoder(Meshopt);
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
     Returns the bounding box for any further measurement work. The studio
     owns the box: it never counts a finish's glow or halo. */
  window.fitModelToSize = function (root, THREE, size) { return window.MOStudio.fit(THREE, root, size); };
})();
