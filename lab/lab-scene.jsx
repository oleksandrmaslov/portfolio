/* ============================================================
   M.O. — UNIVERSE LAB · scene + post-FX pipeline
   ------------------------------------------------------------
   A faithful, isolated slice of the landing universe used to dial
   in the "Lusion-grade" look BEFORE porting anything into v8:

     · same palette (#00f0c8 signal on #04060d), fog, starfield,
       teal particle field, project cards + GLB overlays.
     · every richness dimension is live-tunable through window.LAB,
       so the control panel in universe-lab.html can A/B in realtime.

   Pipeline (all toggleable):
     RenderPass → Bokeh(DoF) → UnrealBloom(threshold) → Final(CA+vignette+grain) → Output

   Reuses viewer3d.jsx helpers: loadProjectModel / fitModelToSize /
   makeMatcapTexture / applyMatcapToModel.
   ============================================================ */

(function () {
  const SIGNAL = 0x00f0c8;
  const BG = 0x04060d;

  // -------- node set (a focused 6-node slice of the real field) --------
  const NODES = [
    { addr: "0x01", name: "Wafer",               sub: "36-key split keyboard", year: "2025",  stack: "ZMK · KICAD · NRF52840", model: "models/wafer.glb",              fit: 2.4, pose: { x: 1.05, y: 0, z: 0 }, featured: true },
    { addr: "0x04", name: "Tactical Flashlight", sub: "Energy for Ukraine",     year: "12/25", stack: "C · ARM-M0 · KICAD",     model: "models/tactical_flashlight.glb", fit: 2.2, featured: true },
    { addr: "0x02", name: "Kerfur",              sub: "Embedded pet · event bus", year: "2025", stack: "C · ZEPHYR · LVGL",       prim: "sphere", featured: true },
    { addr: "0x03", name: "ZMK PointAccel",      sub: "Input processor",        year: "2025",  stack: "C · DEVICETREE · ZMK",   prim: "torus" },
    { addr: "0x06", name: "Matterium",           sub: "Matter / Thread",        year: "2024",  stack: "MATTER · OPENTHREAD",    prim: "box" },
    { addr: "0x07", name: "Catloading",          sub: "meow OS loader",         year: "2024",  stack: "JS · WEBGL · GLSL",      prim: "cone" },
  ];

  // -------- live state (mutated by the control panel) --------
  const S = {
    // material
    material: "fresnel",     // 'fresnel' | 'matcap'
    metalness: 0.92,
    roughness: 0.28,
    envIntensity: 1.25,
    fresPower: 2.6,
    fresInt: 1.2,
    // glow
    haloSize: 1.0,
    haloInt: 0.7,
    // links
    linkFlow: 1.0,
    linkInt: 0.85,
    linkStyle: "constellation", // 'constellation' | 'off'
    // field
    fieldOpacity: 0.55,
    fieldSize: 0.1,
    // resolution hierarchy
    resolveNear: 9,
    resolveFar: 20,
    // bloom
    bloom: true,
    bloomStrength: 0.5,
    bloomRadius: 0.5,
    bloomThreshold: 0.82,
    // dof
    dof: true,
    dofFocus: 11,
    dofAperture: 0.6,   // ×1e-4
    dofMaxBlur: 0.6,    // ×1e-2
    // final grade
    ca: 0.45,           // chromatic aberration (×1e-2)
    vignette: 0.55,
    grain: 0.05,
    exposure: 1.05,
    // motion
    autoOrbit: 0.5,
  };
  window.LAB_STATE = S;

  function boot() {
    const THREE = window.THREE;
    const mount = document.getElementById("lab-stage");
    if (!THREE || !mount) { setTimeout(boot, 60); return; }
    if (!window.loadProjectModel) { setTimeout(boot, 60); return; }

    const sz = () => ({ w: mount.clientWidth, h: mount.clientHeight });
    let { w, h } = sz();

    /* ---------- renderer ---------- */
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance", preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(w, h);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    // Neon-on-black wants its saturated teal to STAY teal and bloom — ACES
    // desaturates highlights toward white/blue and crushes the signal, so we
    // skip tonemapping and drive brightness via the final-grade exposure mult.
    renderer.toneMapping = THREE.NoToneMapping;
    renderer.setClearColor(BG, 1);
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(BG, 14, 46);

    const camera = new THREE.PerspectiveCamera(56, w / h, 0.3, 200);
    camera.position.set(0, 0, 0);

    // environment for reflections (the Lusion "expensive surface" read)
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envRT = pmrem.fromScene(new THREE.RoomEnvironment(), 0.04);
    const envMap = envRT.texture;
    scene.environment = envMap;

    scene.add(new THREE.AmbientLight(0xffffff, 0.65));
    const key = new THREE.DirectionalLight(0xbfeaff, 0.7); key.position.set(4, 6, 4); scene.add(key);
    const rim = new THREE.DirectionalLight(SIGNAL, 0.5); rim.position.set(-5, -2, -3); scene.add(rim);

    /* ---------- starfield ---------- */
    const starGeo = new THREE.BufferGeometry();
    const SC = 1200, sPos = new Float32Array(SC * 3);
    for (let i = 0; i < SC; i++) {
      sPos[i*3]   = (Math.random() - 0.5) * 90;
      sPos[i*3+1] = (Math.random() - 0.5) * 60;
      sPos[i*3+2] = (Math.random() - 0.5) * 90;
    }
    starGeo.setAttribute("position", new THREE.BufferAttribute(sPos, 3));
    const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({
      color: 0x5b6478, size: 0.07, sizeAttenuation: true, transparent: true, opacity: 0.7,
    }));
    stars.frustumCulled = false;
    scene.add(stars);

    /* ---------- teal particle field ---------- */
    const FN = 900, fPos = new Float32Array(FN * 3), fHome = new Float32Array(FN * 3);
    for (let i = 0; i < FN; i++) {
      const x = (Math.random() - 0.5) * 60, y = (Math.random() - 0.5) * 40, z = (Math.random() - 0.5) * 60;
      fPos[i*3] = fHome[i*3] = x; fPos[i*3+1] = fHome[i*3+1] = y; fPos[i*3+2] = fHome[i*3+2] = z;
    }
    const fieldGeo = new THREE.BufferGeometry();
    fieldGeo.setAttribute("position", new THREE.BufferAttribute(fPos, 3));
    const fieldMat = new THREE.PointsMaterial({
      color: SIGNAL, size: S.fieldSize, sizeAttenuation: true,
      transparent: true, opacity: S.fieldOpacity, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    const field = new THREE.Points(fieldGeo, fieldMat);
    field.frustumCulled = false;
    scene.add(field);

    /* ---------- material factory ---------- */
    function makeFresnelMat() {
      const m = new THREE.MeshPhysicalMaterial({
        color: 0x0b0f15, metalness: S.metalness, roughness: S.roughness,
        envMap, envMapIntensity: S.envIntensity, clearcoat: 0.6, clearcoatRoughness: 0.4,
      });
      m.userData.u = {
        power: { value: S.fresPower }, int: { value: S.fresInt },
        col: { value: new THREE.Color(SIGNAL) },
      };
      m.onBeforeCompile = (sh) => {
        sh.uniforms.uFresPower = m.userData.u.power;
        sh.uniforms.uFresInt   = m.userData.u.int;
        sh.uniforms.uFresColor = m.userData.u.col;
        sh.fragmentShader =
          "uniform float uFresPower; uniform float uFresInt; uniform vec3 uFresColor;\n" +
          sh.fragmentShader.replace(
            "#include <emissivemap_fragment>",
            "#include <emissivemap_fragment>\n" +
            "float _fres = pow(1.0 - clamp(dot(normalize(vNormal), normalize(vViewPosition)), 0.0, 1.0), uFresPower);\n" +
            "totalEmissiveRadiance += uFresColor * _fres * uFresInt;"
          );
      };
      return m;
    }

    const fresnelMats = [];
    function shadeModel(root) {
      if (S.material === "matcap") { window.applyMatcapToModel(root, THREE); return; }
      root.traverse((o) => {
        if (!o.isMesh) return;
        const m = makeFresnelMat();
        o.material = m; fresnelMats.push(m);
      });
    }

    /* ---------- node card texture (compact) ---------- */
    function makeCard(p) {
      const c = document.createElement("canvas"); c.width = 540; c.height = 720;
      const x = c.getContext("2d");
      x.fillStyle = "#0c1016"; x.fillRect(0, 0, 540, 720);
      x.strokeStyle = "#202838"; x.lineWidth = 1.5; x.strokeRect(12, 12, 516, 696);
      x.strokeStyle = "#00f0c8"; x.lineWidth = 1.5;
      const corner = (cx, cy, fx, fy) => { const l = 16; x.beginPath(); x.moveTo(cx, cy + fy*l); x.lineTo(cx, cy); x.lineTo(cx + fx*l, cy); x.stroke(); };
      corner(24,24,1,1); corner(516,24,-1,1); corner(24,696,1,-1); corner(516,696,-1,-1);
      x.fillStyle = "#5b6478"; x.font = "500 12px 'Geist Mono', monospace"; x.textBaseline = "top";
      x.fillText("■  NODE " + p.addr, 44, 30);
      x.fillStyle = "#9aa3b3"; x.fillText(p.year.toUpperCase(), 44, 48);
      x.fillStyle = "#e6e8ee"; x.font = "400 56px 'Geist', sans-serif"; x.fillText(p.name, 44, 540);
      x.fillStyle = "#9aa3b3"; x.font = "400 20px 'Geist', sans-serif"; x.fillText(p.sub, 44, 612);
      x.fillStyle = "#5b6478"; x.font = "500 12px 'Geist Mono', monospace"; x.fillText(p.stack, 44, 654);
      x.fillStyle = "#00f0c8"; x.textAlign = "right"; x.fillText("OPEN  →", 496, 654);
      const t = new THREE.CanvasTexture(c); t.anisotropy = 8; t.colorSpace = THREE.SRGBColorSpace;
      return t;
    }

    /* ---------- glow halo sprite ---------- */
    let _haloTex = null;
    function haloTexture() {
      if (_haloTex) return _haloTex;
      const c = document.createElement("canvas"); c.width = c.height = 128;
      const x = c.getContext("2d");
      const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
      g.addColorStop(0, "rgba(0,240,200,0.9)");
      g.addColorStop(0.25, "rgba(0,240,200,0.35)");
      g.addColorStop(1, "rgba(0,240,200,0)");
      x.fillStyle = g; x.fillRect(0, 0, 128, 128);
      _haloTex = new THREE.CanvasTexture(c); _haloTex.colorSpace = THREE.SRGBColorSpace;
      return _haloTex;
    }

    /* ---------- build nodes ---------- */
    const TILE_W = 3.0, TILE_H = 4.0;
    const nodes = [];
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    NODES.forEach((p, i) => {
      const group = new THREE.Group();
      // loose Fibonacci cluster in front of the camera
      const yN = 1 - (i / Math.max(1, NODES.length - 1)) * 2;
      const radial = Math.sqrt(1 - yN * yN);
      const theta = i * goldenAngle;
      group.position.set(Math.cos(theta) * radial * 9, yN * 5.5, -10 - Math.sin(theta) * 5);

      // card
      const cardMat = new THREE.MeshBasicMaterial({ map: makeCard(p), transparent: true, opacity: 1, side: THREE.DoubleSide, depthWrite: false });
      const card = new THREE.Mesh(new THREE.PlaneGeometry(TILE_W, TILE_H), cardMat);
      group.add(card);

      // halo
      const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTexture(), color: SIGNAL, transparent: true, opacity: S.haloInt, depthWrite: false, blending: THREE.AdditiveBlending }));
      halo.scale.setScalar(2.4 * S.haloSize);
      halo.position.z = 0.2;
      group.add(halo);

      // model / primitive overlay
      const holder = new THREE.Group(); holder.position.set(0, 0.4, 0.3); group.add(holder);
      if (p.model) {
        window.loadProjectModel(p.model, THREE).then((root) => {
          window.fitModelToSize(root, THREE, p.fit || 2);
          shadeModel(root);
          if (p.pose) { root.rotation.x += p.pose.x||0; root.rotation.y += p.pose.y||0; root.rotation.z += p.pose.z||0; }
          holder.add(root);
        }).catch(() => {});
      } else if (p.prim && window.makePrimitiveMesh) {
        const geoMap = { sphere: new THREE.IcosahedronGeometry(0.9, 2), torus: new THREE.TorusGeometry(0.7, 0.28, 24, 64), box: new THREE.BoxGeometry(1.2, 1.2, 1.2), cone: new THREE.ConeGeometry(0.8, 1.4, 48) };
        const mesh = new THREE.Mesh(geoMap[p.prim] || geoMap.box, S.material === "matcap" ? new THREE.MeshMatcapMaterial({ matcap: window.makeMatcapTexture(THREE) }) : makeFresnelMat());
        if (S.material !== "matcap") fresnelMats.push(mesh.material);
        if (p.prim === "cone") mesh.rotation.z = Math.PI / 2;
        holder.add(mesh);
        holder.userData.spin = mesh;
      }

      scene.add(group);
      nodes.push({ group, card, cardMat, halo, holder, p, baseY: group.position.y, ph: i * 1.7 });
    });

    /* ---------- constellation links (flowing energy between peers) ---------- */
    // Connect each featured node to its 2 nearest neighbours → a peer mesh,
    // NOT a hub. Energy pulses travel along each segment.
    const linkUniforms = { uTime: { value: 0 }, uFlow: { value: S.linkFlow }, uInt: { value: S.linkInt }, uColor: { value: new THREE.Color(SIGNAL) } };
    const linkMat = new THREE.ShaderMaterial({
      uniforms: linkUniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: "attribute float aT; varying float vT; void main(){ vT = aT; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
      fragmentShader:
        "uniform float uTime; uniform float uFlow; uniform float uInt; uniform vec3 uColor; varying float vT;\n" +
        "void main(){\n" +
        "  float base = 0.12;\n" +
        "  float pulse = pow(max(0.0, sin((vT*6.2831 - uTime*uFlow*2.0))), 8.0);\n" +
        "  float a = (base + pulse) * uInt;\n" +
        "  gl_FragColor = vec4(uColor, a);\n" +
        "}",
    });
    const linkGroup = new THREE.Group(); scene.add(linkGroup);
    function buildLinks() {
      while (linkGroup.children.length) linkGroup.remove(linkGroup.children[0]);
      if (S.linkStyle === "off") return;
      const pts = nodes.map(n => n.group.position);
      const seen = new Set();
      nodes.forEach((n, i) => {
        const d = nodes.map((m, j) => ({ j, dist: pts[i].distanceTo(pts[j]) })).filter(o => o.j !== i).sort((a, b) => a.dist - b.dist).slice(0, 2);
        d.forEach(({ j }) => {
          const k = Math.min(i, j) + "-" + Math.max(i, j);
          if (seen.has(k)) return; seen.add(k);
          const a = pts[i], b = pts[j], SEG = 24;
          const pos = new Float32Array(SEG * 3), tt = new Float32Array(SEG);
          for (let s = 0; s < SEG; s++) { const t = s / (SEG - 1); pos[s*3]=a.x+(b.x-a.x)*t; pos[s*3+1]=a.y+(b.y-a.y)*t; pos[s*3+2]=a.z+(b.z-a.z)*t; tt[s]=t; }
          const g = new THREE.BufferGeometry();
          g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
          g.setAttribute("aT", new THREE.BufferAttribute(tt, 1));
          linkGroup.add(new THREE.Line(g, linkMat));
        });
      });
    }
    buildLinks();

    /* ---------- post-processing ---------- */
    const { EffectComposer, RenderPass, UnrealBloomPass, BokehPass, ShaderPass, OutputPass } = THREE;
    const composer = new THREE.EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));

    const bokeh = new BokehPass(scene, camera, { focus: S.dofFocus, aperture: S.dofAperture * 1e-4, maxblur: S.dofMaxBlur * 1e-2 });
    composer.addPass(bokeh);

    const bloom = new UnrealBloomPass(new THREE.Vector2(w, h), S.bloomStrength, S.bloomRadius, S.bloomThreshold);
    composer.addPass(bloom);

    // final grade — chromatic aberration + vignette + film grain
    const finalPass = new ShaderPass({
      uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uCA: { value: S.ca }, uVig: { value: S.vignette }, uGrain: { value: S.grain }, uExp: { value: S.exposure } },
      vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
      fragmentShader:
        "uniform sampler2D tDiffuse; uniform float uTime; uniform float uCA; uniform float uVig; uniform float uGrain; uniform float uExp; varying vec2 vUv;\n" +
        "void main(){\n" +
        "  vec2 dir = vUv - 0.5; float d = length(dir);\n" +
        "  vec2 off = dir * d * uCA;\n" +
        "  vec3 col;\n" +
        "  col.r = texture2D(tDiffuse, vUv + off).r;\n" +
        "  col.g = texture2D(tDiffuse, vUv).g;\n" +
        "  col.b = texture2D(tDiffuse, vUv - off).b;\n" +
        "  col *= uExp;\n" +
        "  float vig = smoothstep(0.95, 0.25, d);\n" +
        "  col *= mix(1.0, vig, uVig);\n" +
        "  float g = fract(sin(dot(vUv * (uTime + 1.0), vec2(12.9898, 78.233))) * 43758.5453);\n" +
        "  col += (g - 0.5) * uGrain;\n" +
        "  gl_FragColor = vec4(col, 1.0);\n" +
        "}",
    });
    composer.addPass(finalPass);
    composer.addPass(new OutputPass());

    function syncPasses() {
      bokeh.enabled = S.dof;
      bloom.enabled = S.bloom;
      bloom.strength = S.bloomStrength; bloom.radius = S.bloomRadius; bloom.threshold = S.bloomThreshold;
      if (bokeh.uniforms) {
        bokeh.uniforms.focus.value = S.dofFocus;
        bokeh.uniforms.aperture.value = S.dofAperture * 1e-4;
        bokeh.uniforms.maxblur.value = S.dofMaxBlur * 1e-2;
      }
      finalPass.uniforms.uCA.value = S.ca;
      finalPass.uniforms.uVig.value = S.vignette;
      finalPass.uniforms.uGrain.value = S.grain;
      finalPass.uniforms.uExp.value = S.exposure;
      fieldMat.opacity = S.fieldOpacity; fieldMat.size = S.fieldSize;
      linkUniforms.uFlow.value = S.linkFlow; linkUniforms.uInt.value = S.linkInt;
      nodes.forEach(n => { n.halo.scale.setScalar(2.4 * S.haloSize); n.halo.material.opacity = S.haloInt; });
      fresnelMats.forEach(m => {
        m.metalness = S.metalness; m.roughness = S.roughness; m.envMapIntensity = S.envIntensity;
        if (m.userData.u) { m.userData.u.power.value = S.fresPower; m.userData.u.int.value = S.fresInt; }
      });
    }

    /* ---------- interaction: drag-orbit + auto drift ---------- */
    let yaw = 0, pitch = 0, tYaw = 0, tPitch = 0, dragging = false, px = 0, py = 0;
    mount.addEventListener("pointerdown", (e) => { dragging = true; px = e.clientX; py = e.clientY; });
    window.addEventListener("pointerup", () => dragging = false);
    window.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      tYaw   += (e.clientX - px) * 0.0026;
      tPitch += (e.clientY - py) * 0.0020;
      tPitch = Math.max(-0.5, Math.min(0.5, tPitch));
      px = e.clientX; py = e.clientY;
    });

    /* ---------- render loop ---------- */
    let raf, last = performance.now(), fps = 60, fpsEl = document.getElementById("lab-fps");
    function frame(now) {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      fps = fps * 0.9 + (1 / Math.max(1e-3, dt)) * 0.1;
      if (fpsEl) fpsEl.textContent = Math.round(fps) + " fps";

      // camera orbit
      tYaw += S.autoOrbit * dt * 0.06;
      yaw   += (tYaw - yaw) * 0.06;
      pitch += (tPitch - pitch) * 0.06;
      const q = new THREE.Quaternion();
      const qy = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0), yaw);
      const qp = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0), pitch);
      camera.quaternion.copy(q.multiplyQuaternions(qy, qp));

      // field drift
      const t = now * 0.001;
      const fa = field.geometry.attributes.position.array;
      for (let i = 0; i < FN; i++) {
        fa[i*3+1] = fHome[i*3+1] + Math.sin(t * 0.3 + i) * 0.25;
      }
      field.geometry.attributes.position.needsUpdate = true;
      stars.rotation.y = t * 0.005;

      // nodes: face camera, gentle bob, distance-based resolution hierarchy
      nodes.forEach((n) => {
        n.group.position.y = n.baseY + Math.sin(t * 0.5 + n.ph) * 0.18;
        n.card.quaternion.copy(camera.quaternion);
        n.holder.rotation.y += dt * 0.4;
        if (n.holder.userData.spin) n.holder.userData.spin.rotation.x += dt * 0.3;
        // resolution: far = pure glow point, near = full card
        const dist = camera.position.distanceTo(n.group.position);
        const res = 1 - Math.max(0, Math.min(1, (dist - S.resolveNear) / (S.resolveFar - S.resolveNear)));
        n.cardMat.opacity = res;
        n.holder.visible = res > 0.15;
        n.halo.material.opacity = S.haloInt * (1.1 - res * 0.5);
      });

      linkUniforms.uTime.value = t;
      finalPass.uniforms.uTime.value = (now % 10000) * 0.001;
      composer.render();
    }
    raf = requestAnimationFrame(frame);

    /* ---------- resize ---------- */
    window.addEventListener("resize", () => {
      const s = sz(); w = s.w; h = s.h;
      camera.aspect = w / h; camera.updateProjectionMatrix();
      renderer.setSize(w, h); composer.setSize(w, h); bloom.setSize(w, h);
    });

    /* ---------- public control API ---------- */
    window.LAB = {
      set(key, val) {
        S[key] = val;
        if (key === "material") rebuildMaterials();
        else if (key === "linkStyle") buildLinks();
        else syncPasses();
      },
      get: (key) => S[key],
      state: S,
    };

    function rebuildMaterials() {
      // re-shade all model meshes + primitives for the chosen material
      fresnelMats.length = 0;
      scene.traverse((o) => {
        if (!o.isMesh || o.geometry.type === "PlaneGeometry") return;
        if (o.material && o.material.isPointsMaterial) return;
        if (o === stars || o === field) return;
        const isPrimitiveOrModel = o.parent && (o.parent.userData || o.parent.parent);
        if (!isPrimitiveOrModel) return;
        // skip cards / sprites
        if (o.isSprite) return;
        if (S.material === "matcap") {
          o.material = new THREE.MeshMatcapMaterial({ matcap: window.makeMatcapTexture(THREE), transparent: true });
        } else {
          const m = makeFresnelMat(); o.material = m; fresnelMats.push(m);
        }
      });
      syncPasses();
    }

    syncPasses();
    window.LAB._dbg = { scene, camera, composer, renderer, nodes, field, stars };
    console.log("[lab] universe lab ready");
  }

  boot();
})();
