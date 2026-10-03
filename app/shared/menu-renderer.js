/* A demand-driven driver for the shared menu scene. Project pages lend their
   sleeping hero renderer; text-only pages allocate one lazily on menu intent. */
(function () {
  window.createMenuMotion = function (THREE, renderer, environment) {
    let raf = 0, disposed = false, pendingFocus = null, openingDialog = null;
    const objects = window.createMenuObjects(THREE, renderer, environment,
      window.sampleMoGlyphTargets("0x00", 820), wake);
    function frame(now) {
      raf = 0;
      if (disposed || document.hidden || !objects.active) return;
      const moving = objects.frame(now);
      // A borrowed hero buffer must be repainted before replacing the previews.
      if (openingDialog) { openingDialog.dataset.liveObjects = "true"; openingDialog = null; }
      if (moving) wake();
    }
    function wake() {
      if (!disposed && objects.active && !document.hidden && !raf) raf = requestAnimationFrame(frame);
    }
    function sleep() { cancelAnimationFrame(raf); raf = 0; }
    const visibility = () => document.hidden ? sleep() : wake();
    const resize = () => { if (objects.active) objects.resize(); };
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("pagehide", sleep);
    window.addEventListener("pageshow", wake);
    window.addEventListener("resize", resize);
    return {
      openMenu(dialog, keyboard) {
        if (disposed || !dialog.open) return false;
        // Built-in objects can draw now; each GLB replaces its preview when ready.
        objects.open(dialog, keyboard);
        if (!pendingFocus) {
          const focus = dialog.querySelector("a:focus-visible [data-menu-object]");
          const hover = dialog.querySelector("a:hover [data-menu-object]");
          if (focus || hover) pendingFocus = [(focus || hover).dataset.menuObject, !!focus];
        }
        if (pendingFocus) objects.focus(...pendingFocus);
        openingDialog = dialog;
        wake();
        return false;
      },
      closeMenu() { pendingFocus = openingDialog = null; sleep(); objects.close(); },
      focusMenu(id, keyboard) { pendingFocus = [id, keyboard]; objects.focus(id, keyboard); },
      pointMenu(id, x, y) { objects.point(id, x, y); },
      exitMenu(id) { return objects.exit(id); },
      dispose() {
        if (disposed) return;
        disposed = true; sleep(); objects.dispose();
        document.removeEventListener("visibilitychange", visibility);
        window.removeEventListener("pagehide", sleep);
        window.removeEventListener("pageshow", wake);
        window.removeEventListener("resize", resize);
      },
    };
  };

  let dependencies;
  function loadDependencies() {
    if (!dependencies && window.THREE?.GLTFLoader && window.THREE.MeshoptDecoder) {
      dependencies = (window.THREE.KTX2Loader ? Promise.resolve() : import("three/addons/loaders/KTX2Loader.js")
        .then(({ KTX2Loader }) => { window.THREE.KTX2Loader = KTX2Loader; }))
        .then(() => window.THREE).catch(error => { dependencies = null; throw error; });
    }
    if (!dependencies) dependencies = Promise.all([
      import("three"), import("three/addons/loaders/GLTFLoader.js"),
      import("three/addons/libs/meshopt_decoder.module.js"),
      import("three/addons/environments/RoomEnvironment.js"),
      import("three/addons/loaders/KTX2Loader.js"),
    ]).then(([THREE, loader, meshopt, room, ktx]) => Object.assign({}, THREE, loader, meshopt, room, ktx))
      .catch(error => { dependencies = null; throw error; });
    return dependencies;
  }
  window.loadMenuModelDependencies = loadDependencies;
  window.createStandaloneMenuMotion = async function () {
    const THREE = await loadDependencies();
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    const parking = document.createElement("div"); parking.appendChild(renderer.domElement);
    renderer.setSize(1, 1); renderer.outputColorSpace = THREE.SRGBColorSpace;
    let target = null;
    const pmrem = new THREE.PMREMGenerator(renderer), room = new THREE.RoomEnvironment();
    try { target = pmrem.fromScene(room, .06); }
    catch (_) { /* Direct menu lights still describe the models. */ }
    finally { room.dispose(); pmrem.dispose(); }
    const motion = window.createMenuMotion(THREE, renderer, target?.texture);
    const dispose = motion.dispose; let disposed = false;
    motion.dispose = () => { if (disposed) return; disposed = true; dispose(); target?.dispose(); renderer.dispose(); renderer.forceContextLoss(); };
    return motion;
  };
})();
