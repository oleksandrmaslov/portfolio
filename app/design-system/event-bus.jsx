/* ============================================================
   M.O. SYSTEM — Design-system event bus
   A wireframe satellite-ring around a central pulsing core.
   - 7 satellite nodes (one per page section) on a Fibonacci sphere
   - Signal pulses travel from the bus → nodes
   - Drag to rotate. Hover to highlight. Click to navigate.
   - Rotation drives a CSS variable consumed by the page.
   ============================================================ */

function EventBus3D({ sections }) {
  const mountRef    = React.useRef(null);
  const labelRef    = React.useRef(null);
  const [hover, setHover]   = React.useState(-1);
  const [active, setActive] = React.useState(-1);

  React.useEffect(() => {
    if (!window.THREE) { console.warn("THREE not loaded"); return; }
    const THREE = window.THREE;
    const mount = mountRef.current;
    if (!mount) return;

    /* -------- renderer / scene / camera -------- */
    const getSize = () => ({ w: mount.clientWidth, h: mount.clientHeight });
    let { w, h } = getSize();

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, w / h, 0.1, 100);
    camera.position.set(0, 0, 11);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);
    mount.appendChild(renderer.domElement);

    /* -------- group / bus core -------- */
    const group = new THREE.Group();
    scene.add(group);

    // Bus core — central pulsing icosahedron, wireframe.
    const coreGeo = new THREE.IcosahedronGeometry(0.85, 1);
    const coreMat = new THREE.LineBasicMaterial({ color: 0xe6e8ee, transparent: true, opacity: 0.5 });
    const coreEdges = new THREE.LineSegments(new THREE.EdgesGeometry(coreGeo), coreMat);
    group.add(coreEdges);

    // Inner filled core, faintly visible
    const coreFillMat = new THREE.MeshBasicMaterial({ color: 0x07090f, transparent: true, opacity: 0.6 });
    const coreFill = new THREE.Mesh(coreGeo, coreFillMat);
    group.add(coreFill);

    /* -------- satellite nodes via Fibonacci sphere -------- */
    const N = sections.length;
    const PHI = Math.PI * (3 - Math.sqrt(5));     // golden angle
    const R   = 3.6;                              // orbit radius
    const nodes = [];
    const lines = [];

    for (let i = 0; i < N; i++) {
      // Fibonacci sphere distribution
      const y      = 1 - (i / (N - 1)) * 2;
      const radius = Math.sqrt(1 - y * y);
      const theta  = PHI * i;
      const x      = Math.cos(theta) * radius;
      const z      = Math.sin(theta) * radius;
      const pos    = new THREE.Vector3(x * R, y * R, z * R);

      // Node — small wireframe cube
      const sz = 0.42;
      const cubeGeo = new THREE.BoxGeometry(sz, sz, sz);
      const cubeEdges = new THREE.LineSegments(
        new THREE.EdgesGeometry(cubeGeo),
        new THREE.LineBasicMaterial({ color: 0x9aa3b3 })
      );
      cubeEdges.position.copy(pos);

      // Inner filled cube (catches the eye when "active")
      const cubeFill = new THREE.Mesh(
        cubeGeo,
        new THREE.MeshBasicMaterial({ color: 0x07090f })
      );
      cubeFill.position.copy(pos);

      // Hit proxy (slightly larger, invisible) for easier raycasting
      const hit = new THREE.Mesh(
        new THREE.SphereGeometry(sz * 1.6, 8, 8),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      hit.position.copy(pos);
      hit.userData = { idx: i };

      group.add(cubeEdges);
      group.add(cubeFill);
      group.add(hit);

      // Trace from bus → node (dim hairline)
      const lineGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,0,0), pos]);
      const lineMat = new THREE.LineBasicMaterial({ color: 0x232a3a, transparent: true, opacity: 0.7 });
      const line = new THREE.Line(lineGeo, lineMat);
      group.add(line);

      nodes.push({ pos, edges: cubeEdges, fill: cubeFill, hit, idx: i, flash: 0 });
      lines.push(line);
    }

    /* -------- signal pulses (small bright dots traveling outward) -------- */
    const pulses = [];
    const PULSE_GEO = new THREE.SphereGeometry(0.07, 10, 10);
    const PULSE_MAT = () => new THREE.MeshBasicMaterial({ color: 0x00f0c8 });

    function spawnPulse(targetIdx) {
      if (pulses.length > 6) return;
      const idx = targetIdx ?? Math.floor(Math.random() * N);
      const m = new THREE.Mesh(PULSE_GEO, PULSE_MAT());
      group.add(m);
      pulses.push({ mesh: m, target: nodes[idx], t: 0, dur: 700 + Math.random() * 500, idx });
    }

    /* -------- interaction: drag rotate + raycast hover -------- */
    const ray   = new THREE.Raycaster();
    const mouse = new THREE.Vector2(999, 999);

    let dragging = false;
    let lastX = 0, lastY = 0;
    let rotX = 0.35, rotY = 0.4;
    let velX = 0, velY = 0.003;   // auto-rotate when idle
    let idle = true;
    let idleTimer = null;

    const dom = renderer.domElement;

    const onDown = (e) => {
      dragging = true;
      lastX = e.clientX; lastY = e.clientY;
      idle = false;
      dom.style.cursor = "grabbing";
      clearTimeout(idleTimer);
    };
    const onMoveDoc = (e) => {
      const rect = dom.getBoundingClientRect();
      mouse.x =  ((e.clientX - rect.left) / rect.width)  * 2 - 1;
      mouse.y = -((e.clientY - rect.top)  / rect.height) * 2 + 1;
      if (dragging) {
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        velY = dx * 0.005;
        velX = dy * 0.005;
        rotY += velY;
        rotX += velX;
        lastX = e.clientX; lastY = e.clientY;
      }
    };
    const onUp = () => {
      if (!dragging) return;
      dragging = false;
      dom.style.cursor = "grab";
      idleTimer = setTimeout(() => { idle = true; }, 2400);
    };

    dom.addEventListener("mousedown", onDown);
    window.addEventListener("mousemove", onMoveDoc);
    window.addEventListener("mouseup", onUp);

    // Click → navigate to section
    let downAt = { x: 0, y: 0 };
    const onMouseDown2 = (e) => { downAt = { x: e.clientX, y: e.clientY }; };
    const onClick = (e) => {
      const moved = Math.abs(e.clientX - downAt.x) + Math.abs(e.clientY - downAt.y);
      if (moved > 6) return;        // was a drag, ignore
      ray.setFromCamera(mouse, camera);
      const hits = ray.intersectObjects(nodes.map(n => n.hit));
      if (hits.length === 0) return;
      const idx = hits[0].object.userData.idx;
      const target = document.getElementById(sections[idx].id);
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
      setActive(idx);
      spawnPulse(idx);
    };
    dom.addEventListener("mousedown", onMouseDown2);
    dom.addEventListener("click", onClick);

    /* -------- loop -------- */
    let last = performance.now();
    let pulseT = 0;
    let raf;

    function animate(now) {
      const dt = now - last; last = now;

      // auto-spawn pulses on the bus
      pulseT += dt;
      if (pulseT > 700) { pulseT = 0; spawnPulse(); }

      // rotation: drag-driven momentum, or auto when idle
      if (idle && !dragging) {
        velY = velY * 0.985 + 0.0006;       // ease toward gentle constant
        velX = velX * 0.985;
      }
      if (dragging) { /* velX/Y already applied this frame */ }
      else { rotY += velY; rotX += velX; }
      // clamp pitch to avoid going upside-down
      rotX = Math.max(-1.2, Math.min(1.2, rotX));
      group.rotation.x = rotX;
      group.rotation.y = rotY;

      // pulse the core
      const pulseScale = 1 + Math.sin(now * 0.0022) * 0.06;
      coreEdges.scale.setScalar(pulseScale);
      coreFill.scale.setScalar(pulseScale);

      // signal pulses move from bus → node
      for (let i = pulses.length - 1; i >= 0; i--) {
        const p = pulses[i];
        p.t += dt;
        const k = Math.min(1, p.t / p.dur);
        const eased = 1 - Math.pow(1 - k, 3);   // ease-out cubic
        const end = p.target.pos;
        p.mesh.position.set(end.x * eased, end.y * eased, end.z * eased);
        const op = 1 - eased * 0.4;
        p.mesh.material.opacity = op;
        p.mesh.material.transparent = true;

        if (k >= 1) {
          // arrived: flash the target node
          p.target.flash = 1;
          group.remove(p.mesh);
          pulses.splice(i, 1);
        }
      }

      // raycast for hover
      ray.setFromCamera(mouse, camera);
      const hits = ray.intersectObjects(nodes.map(n => n.hit));
      const hoverIdx = hits.length > 0 ? hits[0].object.userData.idx : -1;
      setHover(prev => prev === hoverIdx ? prev : hoverIdx);

      // update node visuals based on hover/flash
      for (const n of nodes) {
        const isHover  = n.idx === hoverIdx;
        const isActive = n.idx === active;
        const target = isHover || isActive ? 0x00f0c8 : 0x9aa3b3;
        n.edges.material.color.setHex(target);

        // flash decay
        if (n.flash > 0) {
          n.flash = Math.max(0, n.flash - dt / 380);
          const flashCol = new THREE.Color(0x00f0c8).lerp(new THREE.Color(target), 1 - n.flash);
          n.edges.material.color.copy(flashCol);
          const s = 1 + n.flash * 0.4;
          n.edges.scale.setScalar(s);
          n.fill.scale.setScalar(s);
        } else {
          const s = isHover ? 1.18 : 1.0;
          n.edges.scale.setScalar(s);
          n.fill.scale.setScalar(s);
        }
      }

      // hover label follows the projected node position
      if (labelRef.current) {
        if (hoverIdx >= 0) {
          const node = nodes[hoverIdx];
          const wp = node.pos.clone().applyMatrix4(group.matrixWorld);
          const pp = wp.project(camera);
          const x = (pp.x * 0.5 + 0.5) * w;
          const y = (-pp.y * 0.5 + 0.5) * h;
          labelRef.current.style.transform = `translate(${x}px, ${y}px) translate(-50%, calc(-100% - 18px))`;
          labelRef.current.style.opacity = "1";
          labelRef.current.textContent = sections[hoverIdx].label;
        } else {
          labelRef.current.style.opacity = "0";
        }
      }

      // push rotation into a CSS variable so the page can react
      const norm = (Math.sin(rotY) * 0.5 + 0.5);     // 0..1
      document.documentElement.style.setProperty("--bus-spin", norm.toFixed(3));
      document.documentElement.style.setProperty("--bus-tilt", (rotX / 1.2).toFixed(3));

      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    }
    raf = requestAnimationFrame(animate);

    /* -------- resize -------- */
    const onResize = () => {
      const s = getSize();
      w = s.w; h = s.h;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", onResize);
    const ro = new ResizeObserver(onResize);
    ro.observe(mount);

    dom.style.cursor = "grab";

    /* -------- cleanup -------- */
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMoveDoc);
      window.removeEventListener("mouseup", onUp);
      ro.disconnect();
      mount.removeChild(dom);
      renderer.dispose();
    };
  }, []);

  return (
    <div className="bus3d">
      <div className="bus3d__mount" ref={mountRef} />
      <div className="bus3d__label" ref={labelRef} />
      <div className="bus3d__hud">
        <span className="bus3d__hudLeft">
          <span className="bus3d__dot" />
          BUS · 7 NODES · DRAG TO INSPECT
        </span>
        <span className="bus3d__hudRight">node {hover >= 0 ? "0x0" + hover : "----"}</span>
      </div>
    </div>
  );
}

window.EventBus3D = EventBus3D;
