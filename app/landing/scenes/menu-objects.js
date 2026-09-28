/* Four destinations, four objects. Borrows the Universe renderer while its
   field is asleep; never creates a WebGL context or another animation loop.
   The Universe's RAF runs only until an arrival, focus or exit has settled. */
(function () {
  const ENTER_MS = 420, EXIT_MS = 180;
  window.MOMenuMotion = { enter: ENTER_MS, exit: EXIT_MS };

  window.createMenuObjects = function (THREE, renderer, environment, glyph, wake) {
    const scene = new THREE.Scene();
    scene.environment = environment;
    const camera = new THREE.OrthographicCamera(0, 1, 1, 0, 0.1, 2000);
    camera.position.z = 1000;
    scene.add(new THREE.HemisphereLight(0xe6e8ee, 0x232a3a, 2.2));
    const key = new THREE.DirectionalLight(0xffffff, 3.4);
    key.position.set(-200, 450, 800); scene.add(key);
    const rim = new THREE.DirectionalLight(0x00f0c8, 1.8);
    rim.position.set(400, 100, -200); scene.add(rim);

    const ids = ["work", "about", "contact", "index"];
    const entries = ids.map(id => {
      const group = new THREE.Group(); scene.add(group);
      return { id, group, focus: 0, target: 0, x: 0, y: 0, size: 1, rect: null };
    });
    const materials = new Set(), geometries = new Set(), textures = new Set();
    let dialog = null, host = null, lease = null, disposed = false;
    let enterAt = 0, exitAt = 0, exitId = null, last = 0, dirty = true;
    let instant = false, pointerX = 0, pointerY = 0, tiltX = 0, tiltY = 0;
    let pressedAt = -Infinity, switchButton = null, switchRest = 0;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
    const ease = p => 1 - Math.pow(1 - clamp(p, 0, 1), 3);
    const ordered = [];

    function own(root, geometry) {
      root.traverse(o => {
        if (geometry && o.geometry) geometries.add(o.geometry);
        for (const m of (Array.isArray(o.material) ? o.material : [o.material])) {
          if (!m) continue;
          materials.add(m);
          if (geometry && m.map) textures.add(m.map);
        }
      });
    }
    function loadModel(addr, entry, size, position, order) {
      const project = window.MO_PROJECT_BY_ADDR && window.MO_PROJECT_BY_ADDR[addr];
      if (!project?.model?.src || !window.loadProjectModel) return;
      window.loadProjectModel(project.model.src, THREE).then(root => {
        if (disposed) return;
        // GLB clones share geometry/textures with the cached field. Clone only
        // materials; the menu must never free or recolor a Universe resource.
        if (project.model.assignMaterial && window.applySolidMaterials) {
          window.applySolidMaterials(root, THREE, project.model.assignMaterial);
        } else if (window.tuneRealMaterials) {
          window.tuneRealMaterials(root, THREE, { envMapIntensity: 1.6 });
        } else {
          root.traverse(o => { if (o.material) o.material = Array.isArray(o.material) ? o.material.map(m => m.clone()) : o.material.clone(); });
        }
        own(root, false);
        window.fitModelToSize(root, THREE, size);
        const holder = new THREE.Group(); holder.add(root);
        const pose = project.model.menuPose || project.model.cardPose?.pose || project.model.rigPose || {};
        holder.rotation.set(pose.x || 0, pose.y || 0, pose.z || 0);
        if (position) { holder.position.copy(position); ordered[order] = holder; }
        entry.group.add(holder);
        dirty = true; if (dialog) wake();
      }).catch(() => { /* Text navigation remains complete without the model. */ });
    }
    const featured = window.MO_FEATURED_ADDRS || [];
    loadModel(featured[0], entries[0], 2.15);
    featured.slice(1, 4).forEach((addr, i) => loadModel(addr, entries[3], .68, new THREE.Vector3((i - 1) * .76, (i - 1) * .08, -i * .12), i));

    // These are the same sampled 0x00 coordinates that the field assembles.
    const count = glyph.length / 3;
    let halfWidth = 1;
    for (let i = 0; i < glyph.length; i += 3) halfWidth = Math.max(halfWidth, Math.abs(glyph[i]));
    const target = new Float32Array(glyph.length), scatter = new Float32Array(glyph.length);
    const positions = new Float32Array(glyph.length), colors = new Float32Array(glyph.length);
    const signal = new THREE.Color(0x00f0c8), highlight = new THREE.Color(0xbffff0);
    for (let i = 0; i < count; i++) {
      const j = i * 3, a = i * 2.39996323, r = Math.sqrt((i + .5) / count);
      target[j] = glyph[j] / halfWidth;
      target[j + 1] = glyph[j + 1] / halfWidth;
      target[j + 2] = glyph[j + 2] / halfWidth;
      scatter[j] = Math.cos(a) * r * 1.05;
      scatter[j + 1] = Math.sin(a) * r * .64;
      scatter[j + 2] = Math.sin(i * 1.73) * .4;
    }
    const pointGeo = new THREE.BufferGeometry();
    pointGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    pointGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    const pointMat = new THREE.PointsMaterial({ vertexColors: true, toneMapped: false, size: 1.5, sizeAttenuation: false, transparent: true, opacity: .9, depthWrite: false });
    const points = new THREE.Points(pointGeo, pointMat);
    entries[1].group.add(points); own(points, true);

    const output = window.MOBoard?.makeOutputSwitch?.();
    if (output) {
      own(output, true);
      switchButton = output.getObjectByName("SW1.actuator");
      switchRest = switchButton?.position.y || 0;
      window.fitModelToSize(output, THREE, 1.35);
      const holder = new THREE.Group(); holder.add(output);
      holder.rotation.set(.65, -.45, .12);
      entries[2].group.add(holder);
    }

    function layout() {
      if (!dialog) return;
      const width = innerWidth, height = innerHeight;
      renderer.setSize(width, height);
      camera.right = width; camera.top = height; camera.updateProjectionMatrix();
      for (const e of entries) {
        e.rect = dialog.querySelector(`[data-menu-object="${e.id}"]`).getBoundingClientRect();
        e.rowRect = dialog.querySelector(`[data-menu-object="${e.id}"]`).closest("a").getBoundingClientRect();
        e.x = e.rect.left + e.rect.width / 2;
        e.y = height - e.rect.top - e.rect.height / 2;
        e.size = Math.min(e.rect.width / 2.5, e.rect.height / 1.55);
      }
      dirty = true; wake();
    }
    const observer = new ResizeObserver(layout);
    function close() {
      if (!lease) return;
      observer.disconnect(); dialog.removeEventListener("scroll", layout);
      lease.parent.appendChild(renderer.domElement);
      renderer.domElement.style.cssText = lease.style;
      renderer.setPixelRatio(lease.ratio);
      renderer.setSize(lease.size.x, lease.size.y);
      renderer.setClearColor(lease.color, lease.alpha);
      renderer.toneMapping = lease.tone; renderer.toneMappingExposure = lease.exposure;
      renderer.autoClear = lease.autoClear;
      lease = null; dialog = host = null;
    }
    return {
      get active() { return !!dialog; },
      open(nextDialog, keyboard) {
        if (disposed || dialog) return;
        dialog = nextDialog; host = dialog.querySelector(".lp-menu__objects");
        lease = { parent: renderer.domElement.parentNode, style: renderer.domElement.style.cssText,
          ratio: renderer.getPixelRatio(), size: renderer.getSize(new THREE.Vector2()),
          color: renderer.getClearColor(new THREE.Color()).clone(), alpha: renderer.getClearAlpha(),
          tone: renderer.toneMapping, exposure: renderer.toneMappingExposure, autoClear: renderer.autoClear };
        host.appendChild(renderer.domElement);
        renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
        renderer.setClearColor(0x04060d, 0);
        renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.25;
        renderer.autoClear = true;
        enterAt = performance.now(); exitAt = 0; exitId = null; last = 0;
        instant = keyboard || reduced.matches;
        pressedAt = -Infinity;
        pointerX = pointerY = tiltX = tiltY = 0;
        entries.forEach(e => { e.focus = e.target = 0; });
        observer.observe(dialog.querySelector(".lp-menu__links"));
        dialog.addEventListener("scroll", layout, { passive: true });
        layout();
      },
      close,
      resize: layout,
      focus(id, keyboard = false) {
        if (!dialog || exitAt) return;
        entries.forEach(e => { e.target = e.id === id ? 1 : 0; if (keyboard || reduced.matches) e.focus = e.target; });
        if (id === "contact" && !keyboard && !reduced.matches) pressedAt = performance.now();
        if (keyboard || reduced.matches) { tiltX = tiltY = 0; pressedAt = -Infinity; }
        pointerX = pointerY = 0; dirty = true; wake();
      },
      point(id, x, y) {
        if (!dialog || exitAt || reduced.matches) return;
        const entry = entries.find(e => e.id === id);
        if (!entry?.rowRect) return;
        pointerX = clamp((x - entry.rowRect.left) / entry.rowRect.width - .5, -.5, .5);
        pointerY = clamp((y - entry.rowRect.top) / entry.rowRect.height - .5, -.5, .5);
        dirty = true; wake();
      },
      exit(id) { exitId = id; exitAt = performance.now(); dirty = true; wake(); return EXIT_MS; },
      frame(now) {
        if (!dialog) return false;
        // At most 30 draws/sec while moving. No redraw at rest, no layout reads
        // per frame, no post-processing, and no React state on pointer move.
        if (last && now - last < 1000 / 30) return true;
        const dt = Math.min(64, last ? now - last : 33); last = now;
        const arrival = instant || reduced.matches ? 1 : ease((now - enterAt) / ENTER_MS);
        const leaving = exitAt ? ease((now - exitAt) / EXIT_MS) : 0;
        const k = 1 - Math.exp(-dt / 90);
        tiltX += (pointerX - tiltX) * k; tiltY += (pointerY - tiltY) * k;
        let moving = arrival < 1 || (exitAt && leaving < 1) || Math.abs(pointerX - tiltX) + Math.abs(pointerY - tiltY) > .002;
        for (const [index, e] of entries.entries()) {
          const arrival = instant || reduced.matches ? 1 : ease((now - enterAt - index * 30) / ENTER_MS);
          if (arrival < 1) moving = true;
          e.focus += (e.target - e.focus) * k;
          if (Math.abs(e.focus - e.target) < .002) e.focus = e.target;
          else moving = true;
          const selected = exitId === e.id;
          e.group.position.set(e.x + (1 - arrival) * 30 - (selected ? leaving * 28 : 0), e.y, 0);
          e.group.scale.setScalar(e.size * (.88 + arrival * .12) * (1 + e.focus * .06 + (selected ? leaving * .14 : -leaving * .08)));
          const pitch = e.id === "work" ? -.30 + e.focus * .24 : -.06;
          e.group.rotation.set(pitch + e.focus * tiltY * .12, (1 - arrival) * -.45 + e.focus * (.18 + tiltX * .14), 0);
          e.group.visible = e.rect.bottom > 0 && e.rect.top < innerHeight;
        }
        // Hover keeps the letter strokes anchored. A light sweep and shallow
        // depth flex replace the abrupt re-scatter that made 0x00 unreadable.
        // Both follow eased focus, so rapid leave/re-entry reverses smoothly.
        const focus = entries[1].focus, scan = -1.25 + focus * 2.5;
        const glyphArrival = instant || reduced.matches ? 1 : ease((now - enterAt - 30) / ENTER_MS);
        for (let j = 0; j < positions.length; j += 3) {
          positions[j] = scatter[j] + (target[j] - scatter[j]) * glyphArrival;
          positions[j + 1] = scatter[j + 1] + (target[j + 1] - scatter[j + 1]) * glyphArrival;
          positions[j + 2] = scatter[j + 2] + (target[j + 2] - scatter[j + 2]) * glyphArrival
            + Math.sin(target[j] * 3.2 + focus * Math.PI) * .09 * focus;
          const distance = target[j] - scan;
          const light = Math.exp(-distance * distance * 28) * Math.sin(focus * Math.PI) * .7;
          colors[j] = signal.r + (highlight.r - signal.r) * light;
          colors[j + 1] = signal.g + (highlight.g - signal.g) * light;
          colors[j + 2] = signal.b + (highlight.b - signal.b) * light;
        }
        pointGeo.attributes.position.needsUpdate = true;
        pointGeo.attributes.color.needsUpdate = true;
        const pressAge = now - pressedAt;
        if (switchButton) {
          const press = pressAge < 420 ? Math.sin(Math.PI * clamp(pressAge / 420, 0, 1)) : 0;
          switchButton.position.y = switchRest - press * .34;
          if (pressAge < 420) moving = true;
        }
        ordered.forEach((o, i) => {
          o.position.x = (i - 1) * (.76 + entries[3].focus * .16);
          o.position.y = (i - 1) * .08 * (1 - entries[3].focus);
        });
        if (dirty || moving) {
          renderer.setRenderTarget(null); renderer.render(scene, camera);
          dirty = moving;
        }
        return !!moving;
      },
      dispose() { close(); disposed = true; materials.forEach(m => m.dispose()); geometries.forEach(g => g.dispose()); textures.forEach(t => t.dispose()); }
    };
  };
})();
