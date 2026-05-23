/* ============================================================
   M.O. SYSTEM — Wafer 3D
   Procedural Wafer split keyboard with cinematic camera poses.
   No external assets — geometry + procedural env map.
   ============================================================ */

function Wafer({ poseIndex, autoCycle = true, onPoseChange }) {
  const mountRef = React.useRef(null);
  const apiRef   = React.useRef(null);
  const [poseLabel, setPoseLabel] = React.useState("3/4");

  React.useEffect(() => {
    const THREE = window.THREE;
    if (!THREE) { console.warn("THREE not loaded"); return; }
    const mount = mountRef.current;
    if (!mount) return;

    /* -------- renderer / scene / camera -------- */
    const sz = () => ({ w: mount.clientWidth, h: mount.clientHeight });
    let { w, h } = sz();

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.6;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = null;
    scene.fog = new THREE.Fog(0x04060d, 30, 70);

    const camera = new THREE.PerspectiveCamera(35, w / h, 0.1, 100);
    camera.position.set(6, 7, 10);
    camera.lookAt(0, 0, 0);

    /* -------- env map (procedural) — gives metalness reflections -------- */
    const envCanvas = document.createElement("canvas");
    envCanvas.width = 1024; envCanvas.height = 512;
    const ctx = envCanvas.getContext("2d");
    // base gradient (top-dark to mid-bright to bottom-dark)
    const g = ctx.createLinearGradient(0, 0, 0, 512);
    g.addColorStop(0,    "#1a2030");
    g.addColorStop(0.35, "#0d1422");
    g.addColorStop(0.5,  "#080b14");
    g.addColorStop(0.65, "#0d1422");
    g.addColorStop(1,    "#1a2030");
    ctx.fillStyle = g; ctx.fillRect(0, 0, 1024, 512);
    // a couple of "studio" light blobs
    const blob = (x, y, r, col) => {
      const rg = ctx.createRadialGradient(x, y, 0, x, y, r);
      rg.addColorStop(0, col);
      rg.addColorStop(1, "transparent");
      ctx.fillStyle = rg;
      ctx.fillRect(0, 0, 1024, 512);
    };
    blob(180, 180, 280, "rgba(255, 255, 255, 0.85)");
    blob(720, 140, 260, "rgba(0, 240, 200, 0.55)");
    blob(540, 380, 240, "rgba(255, 220, 180, 0.30)");
    blob(900, 300, 200, "rgba(200, 220, 255, 0.40)");
    const envTex = new THREE.CanvasTexture(envCanvas);
    envTex.mapping = THREE.EquirectangularReflectionMapping;
    envTex.colorSpace = THREE.SRGBColorSpace;
    scene.environment = envTex;

    /* -------- lights -------- */
    const ambient = new THREE.AmbientLight(0xffffff, 0.35);
    scene.add(ambient);

    const key = new THREE.DirectionalLight(0xffffff, 1.8);
    key.position.set(6, 10, 6);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.left = -10;
    key.shadow.camera.right = 10;
    key.shadow.camera.top = 10;
    key.shadow.camera.bottom = -10;
    key.shadow.bias = -0.0005;
    scene.add(key);

    const rim = new THREE.DirectionalLight(0x00f0c8, 0.9);
    rim.position.set(-5, 3, -6);
    scene.add(rim);

    const rim2 = new THREE.DirectionalLight(0xffd0a0, 0.4);
    rim2.position.set(5, 1, -5);
    scene.add(rim2);

    const fill = new THREE.HemisphereLight(0xb0c0e0, 0x04060d, 0.5);
    scene.add(fill);

    /* -------- materials -------- */
    const caseMat = new THREE.MeshStandardMaterial({
      color: 0x1a1d28, metalness: 1.0, roughness: 0.22, envMapIntensity: 1.4,
    });
    const keycapMat = new THREE.MeshStandardMaterial({
      color: 0x20242e, metalness: 0.85, roughness: 0.32, envMapIntensity: 1.2,
    });
    const displayMat = new THREE.MeshStandardMaterial({
      color: 0xd8dde6, metalness: 0.05, roughness: 0.7, emissive: 0x556070, emissiveIntensity: 0.3,
    });
    const portMat = new THREE.MeshStandardMaterial({
      color: 0x06080d, metalness: 0.4, roughness: 0.7,
    });

    /* -------- rounded rect shape for the case outline -------- */
    function roundedRect(w, h, r) {
      const s = new THREE.Shape();
      s.moveTo(-w/2 + r, -h/2);
      s.lineTo( w/2 - r, -h/2);
      s.absarc( w/2 - r, -h/2 + r, r, -Math.PI/2, 0, false);
      s.lineTo( w/2,  h/2 - r);
      s.absarc( w/2 - r,  h/2 - r, r, 0, Math.PI/2, false);
      s.lineTo(-w/2 + r,  h/2);
      s.absarc(-w/2 + r,  h/2 - r, r, Math.PI/2, Math.PI, false);
      s.lineTo(-w/2, -h/2 + r);
      s.absarc(-w/2 + r, -h/2 + r, r, Math.PI, Math.PI*1.5, false);
      return s;
    }

    /* -------- a single Wafer half -------- */
    function makeHalf(mirror = false) {
      const half = new THREE.Group();

      const W = 9.2;   // width
      const H = 6.8;   // height
      const D = 0.55;  // depth (very thin — Wafer is 4-8mm)

      // case
      const caseShape = roundedRect(W, H, 0.5);
      const caseGeo = new THREE.ExtrudeGeometry(caseShape, {
        depth: D,
        bevelEnabled: true,
        bevelSegments: 4,
        bevelSize: 0.12,
        bevelThickness: 0.08,
        curveSegments: 12,
      });
      caseGeo.rotateX(-Math.PI/2);
      // center vertically
      caseGeo.translate(0, -D/2, 0);
      const caseMesh = new THREE.Mesh(caseGeo, caseMat);
      caseMesh.castShadow = true;
      caseMesh.receiveShadow = true;
      half.add(caseMesh);

      // keycap: a slim cube with slightly chamfered profile
      function makeKey(kx, kz, label, isThumb = false) {
        const kW = isThumb ? 1.45 : 1.45;
        const kH = isThumb ? 1.45 : 1.45;
        const cap = roundedRect(kW, kH, 0.14);
        const capGeo = new THREE.ExtrudeGeometry(cap, {
          depth: 0.36,
          bevelEnabled: true,
          bevelSegments: 2,
          bevelSize: 0.06,
          bevelThickness: 0.06,
          curveSegments: 4,
        });
        capGeo.rotateX(-Math.PI/2);
        const mesh = new THREE.Mesh(capGeo, keycapMat);
        mesh.position.set(kx, D/2 + 0.08, kz);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.userData = { isKey: true, label };
        half.add(mesh);

        // tiny base ring under each cap (subtle separation)
        const ring = new THREE.Mesh(
          new THREE.RingGeometry(0.78, 0.92, 24),
          new THREE.MeshStandardMaterial({ color: 0x040608, metalness: 0.2, roughness: 0.9, side: THREE.DoubleSide })
        );
        ring.rotation.x = -Math.PI/2;
        ring.position.set(kx, D/2 + 0.005, kz);
        half.add(ring);

        return mesh;
      }

      // Main 3 × 5 key grid
      const rows = 3;
      const cols = 5;
      const pitch = 1.7;
      const gridX0 = -((cols - 1) * pitch) / 2 - 0.4;
      const gridZ0 = -((rows - 1) * pitch) / 2 + 0.2;

      const KEY_LAYOUT = [
        ["Q","W","E","R","T"],
        ["A","S","D","F","G"],
        ["Z","X","C","V","B"],
      ];

      const keys = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = gridX0 + c * pitch;
          const z = gridZ0 + r * pitch;
          keys.push(makeKey(x, z, KEY_LAYOUT[r][c]));
        }
      }

      // 3-key thumb cluster (offset down + tilted)
      const thumbX0 = -0.6;
      const thumbZ  = gridZ0 + rows * pitch + 0.15;
      const THUMB = ["⇧", "L1", "␣"];
      for (let i = 0; i < 3; i++) {
        const x = thumbX0 + i * pitch;
        keys.push(makeKey(x, thumbZ, THUMB[i], true));
      }

      // Display (Sharp memory display — on inner-upper)
      const displayGeo = new THREE.PlaneGeometry(2.2, 1.3);
      const display = new THREE.Mesh(displayGeo, displayMat);
      display.rotation.x = -Math.PI/2;
      display.position.set(W/2 - 1.6, D/2 + 0.01, -H/2 + 1.0);
      display.castShadow = false;
      display.receiveShadow = false;
      half.add(display);

      // USB-C / port on inner side
      const port = new THREE.Mesh(
        new THREE.BoxGeometry(0.6, 0.22, 0.32),
        portMat
      );
      port.position.set(W/2 + 0.05, 0, 1.8);
      half.add(port);

      // Mirror if right half — flip on X
      if (mirror) {
        half.scale.x = -1;
        half.traverse(o => {
          if (o.isMesh && o.geometry) {
            // we don't need to flip normals on the simple keycaps
          }
        });
      }

      return { group: half, keys };
    }

    const left  = makeHalf(false);
    const right = makeHalf(true);

    // Position halves with a tasteful split + slight tent angle
    const SPLIT = 1.2;
    const SPLAY = THREE.MathUtils.degToRad(8);

    left.group.position.set(-5.2 - SPLIT/2, 0, 0);
    left.group.rotation.y =  SPLAY;
    right.group.position.set( 5.2 + SPLIT/2, 0, 0);
    right.group.rotation.y = -SPLAY;

    const kbd = new THREE.Group();
    kbd.add(left.group);
    kbd.add(right.group);

    // Gentle hover / drift
    scene.add(kbd);

    /* -------- ground (catches a soft shadow only) -------- */
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(60, 60),
      new THREE.ShadowMaterial({ opacity: 0.55 })
    );
    ground.rotation.x = -Math.PI/2;
    ground.position.y = -1.4;
    ground.receiveShadow = true;
    scene.add(ground);

    /* -------- camera poses (cinematic cycle) -------- */
    const POSES = [
      { name: "3/4",    cam: new THREE.Vector3(  9,  7,  11), look: new THREE.Vector3(0, 0, 0) },
      { name: "TOP",    cam: new THREE.Vector3(  0, 16,  0.01), look: new THREE.Vector3(0, 0, 0) },
      { name: "SIDE",   cam: new THREE.Vector3( 14,  1.6, 0.01), look: new THREE.Vector3(0, 0, 0) },
      { name: "MACRO",  cam: new THREE.Vector3( -1,  3,  6), look: new THREE.Vector3(-3, 0, 0) },
      { name: "FRONT",  cam: new THREE.Vector3(  0,  2.2, 13), look: new THREE.Vector3(0, 0, 0) },
      { name: "LOW",    cam: new THREE.Vector3( -5,  0.8, 9), look: new THREE.Vector3(0, 0.4, 0) },
    ];

    let poseI = 0;
    let posePrev = POSES[0];
    let poseNext = POSES[0];
    let poseT = 0;
    const POSE_HOLD = 4200;     // ms held on a pose
    const POSE_FADE = 1600;     // ms transition between poses

    function easeInOutCubic(t) {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    /* -------- key press demo (random keys flash) -------- */
    const allKeys = [...left.keys, ...right.keys];
    const keyPressed = new Map();   // mesh -> timestamp

    function pressRandomKey() {
      if (allKeys.length === 0) return;
      const k = allKeys[Math.floor(Math.random() * allKeys.length)];
      keyPressed.set(k, performance.now());
    }

    let keyTimer = 0;

    /* -------- loop -------- */
    let raf;
    let last = performance.now();
    let kbdYaw = 0;
    let kbdHover = 0;

    function frame(now) {
      const dt = now - last; last = now;

      // gentle continuous spin + hover
      kbdYaw  += dt * 0.00012;
      kbdHover = Math.sin(now * 0.0008) * 0.15;
      kbd.rotation.y = kbdYaw;
      kbd.position.y = kbdHover;

      // camera pose cycle
      if (autoCycle) {
        poseT += dt;
        if (poseT >= POSE_HOLD + POSE_FADE) {
          poseT = 0;
          posePrev = poseNext;
          poseI = (poseI + 1) % POSES.length;
          poseNext = POSES[poseI];
          setPoseLabel(poseNext.name);
          if (onPoseChange) onPoseChange(poseNext.name);
        }
      }

      const tRaw = Math.max(0, (poseT - POSE_HOLD) / POSE_FADE);
      const tEase = easeInOutCubic(Math.min(1, tRaw));
      const camPos  = posePrev.cam.clone().lerp(poseNext.cam, tEase);
      const lookPos = posePrev.look.clone().lerp(poseNext.look, tEase);
      camera.position.copy(camPos);
      camera.lookAt(lookPos);

      // key press demo
      keyTimer += dt;
      if (keyTimer > 480) { keyTimer = 0; pressRandomKey(); }

      for (const [mesh, ts] of keyPressed.entries()) {
        const age = now - ts;
        const PRESS_DUR = 280;
        if (age > PRESS_DUR) {
          mesh.position.y = 0.55 + 0.08;
          mesh.material = keycapMat;
          keyPressed.delete(mesh);
        } else {
          const k = age / PRESS_DUR;
          // press down then back
          const depress = k < 0.45 ? k / 0.45 : 1 - (k - 0.45) / 0.55;
          mesh.position.y = 0.55 + 0.08 - depress * 0.18;
        }
      }

      renderer.render(scene, camera);
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    /* -------- resize -------- */
    const onResize = () => {
      const s = sz();
      w = s.w; h = s.h;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", onResize);
    const ro = new ResizeObserver(onResize);
    ro.observe(mount);

    apiRef.current = { renderer, scene, camera, kbd };

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      ro.disconnect();
      mount.removeChild(renderer.domElement);
      renderer.dispose();
      envTex.dispose();
    };
  }, []);

  return (
    <div className="wafer">
      <div className="wafer__mount" ref={mountRef} />
      <div className="wafer__hud wafer__hud--tl">
        <span className="wafer__hudKey">MODEL</span>
        <span className="wafer__hudVal">WAFER · v0.1</span>
      </div>
      <div className="wafer__hud wafer__hud--tr">
        <span className="wafer__hudKey">CAM</span>
        <span className="wafer__hudVal">{poseLabel}</span>
      </div>
      <div className="wafer__hud wafer__hud--bl">
        <span className="wafer__hudKey">SPEC</span>
        <span className="wafer__hudVal">36 KEYS · 4–8 MM · nRF52840 · NPM1300</span>
      </div>
      <div className="wafer__hud wafer__hud--br">
        <span className="wafer__hudKey">STATUS</span>
        <span className="wafer__hudVal"><span className="wafer__dot" />LIVE</span>
      </div>
      <div className="wafer__reticle" aria-hidden="true">
        <span /><span /><span /><span />
      </div>
    </div>
  );
}

window.Wafer = Wafer;
