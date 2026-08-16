/* ============================================================
   M.O. SYSTEM — KERFUR BODY (procedural barebone mock)
   ------------------------------------------------------------
   Cat-ish pebble per the real shell's proportions (kerfur.step:
   ~139 × 142 × 101 mm): rounded body, two ear bumps, recessed
   front glass with the LIVE 128×64 face engine as an emissive
   texture (0.96" OLED proportions), USB-C notch, seam line.
   Swap path: FUSION-EXPORT-GUIDE.md GLB replaces the shell;
   the face plane + rig API stay.

   window.makeKerfurBody(THREE, { mini }) → {
     group, faceMesh, face (engine), earL, earR,
     bounce(), wobble(ax), setLift(t), breathe(now, dt),
     update(now, dt)   // face tick + springs; texture upload
   }
   ============================================================ */
(function () {
  window.makeKerfurBody = function (THREE, opts = {}) {
    const mini = !!opts.mini;
    const group = new THREE.Group();

    const matShell = new THREE.MeshStandardMaterial({ color: mini ? 0x2e3848 : 0x262f3e, metalness: 0.25, roughness: 0.55 });
    const matGlass = new THREE.MeshStandardMaterial({ color: 0x05070b, metalness: 0.4, roughness: 0.2 });
    const matDark  = new THREE.MeshStandardMaterial({ color: 0x10151f, metalness: 0.5, roughness: 0.45 });

    /* body — 1.39 × 1.42 × 1.01 pebble */
    const Rounded = THREE.RoundedBoxGeometry;
    const bodyGeo = Rounded
      ? new Rounded(1.39, 1.42, 1.01, 6, 0.34)
      : new THREE.BoxGeometry(1.39, 1.42, 1.01);
    const body = new THREE.Mesh(bodyGeo, matShell);
    group.add(body);

    /* ears — squashed cones at top corners */
    const earGeo = new THREE.ConeGeometry(0.26, 0.42, 20);
    earGeo.scale(1, 1, 0.62);
    const earL = new THREE.Mesh(earGeo, matShell);
    earL.position.set(-0.46, 0.78, 0);
    earL.rotation.z = 0.3;
    const earR = new THREE.Mesh(earGeo, matShell);
    earR.position.set(0.46, 0.78, 0);
    earR.rotation.z = -0.3;
    group.add(earL, earR);

    /* face: recessed glass + live OLED plane (2:1, 0.96" panel look) */
    const glass = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.56, 0.04), matGlass);
    glass.position.set(0, 0.18, 0.505);
    group.add(glass);

    const face = window.makeKerfurFace();
    const tex = new THREE.CanvasTexture(face.canvas);
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    tex.generateMipmaps = false;
    tex.colorSpace = THREE.SRGBColorSpace;
    const faceMat = new THREE.MeshBasicMaterial({ map: tex, toneMapped: false });
    const faceMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.92, 0.46), faceMat);
    faceMesh.position.set(0, 0.18, 0.527);
    faceMesh.userData.isFace = true;
    group.add(faceMesh);

    /* soft cyan-white spill from the screen */
    const spill = new THREE.PointLight(0xbfeaff, 0, 1.6);
    spill.position.set(0, 0.18, 0.8);
    group.add(spill);

    /* usb-c notch + seam */
    const usb = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.07, 0.06), matDark);
    usb.position.set(0, -0.66, 0.32);
    group.add(usb);
    const seam = new THREE.Mesh(new THREE.TorusGeometry(0.71, 0.008, 8, 48), matDark);
    seam.rotation.x = Math.PI / 2;
    seam.position.y = -0.28;
    seam.scale.set(0.97, 0.73, 1);
    group.add(seam);

    /* ---- motion springs ---- */
    const spring = { y: 0, vy: 0, rz: 0, vrz: 0, lift: 0, liftT: 0 };
    const baseY = 0;

    function bounce(power = 1) { spring.vy += 0.024 * power; }
    function wobble(ax = 1) { spring.vrz += 0.05 * ax; }
    function setLift(t) { spring.liftT = t; }

    function update(now, dt) {
      /* face tick → texture upload only when the engine redrew */
      if (face.update(now)) tex.needsUpdate = true;

      /* screen spill follows lit pixels (cheap: pulse with blink) */
      spill.intensity = mini ? 0.25 : 0.5;

      /* springs */
      const D = Math.min(50, dt);
      spring.vy += (baseY - spring.y) * 0.012 * D;
      spring.vy *= Math.pow(0.88, D / 16);
      spring.y += spring.vy * D / 16;
      spring.vrz += (0 - spring.rz) * 0.01 * D;
      spring.vrz *= Math.pow(0.86, D / 16);
      spring.rz += spring.vrz * D / 16;
      spring.lift += (spring.liftT - spring.lift) * Math.min(1, D / 220);

      /* breathing idle */
      const br = 1 + Math.sin(now * 0.0012) * 0.006;
      group.scale.set(br, 1 / br * (1 + spring.lift * 0.02), br);
      group.position.y = spring.y + spring.lift * 0.34;
      group.rotation.z = spring.rz + spring.lift * 0.06;
      group.rotation.x = spring.lift * -0.12;
    }

    return { group, faceMesh, face, earL, earR, bounce, wobble, setLift, update };
  };
})();
