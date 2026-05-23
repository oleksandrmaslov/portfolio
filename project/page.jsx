/* ============================================================
   M.O. SYSTEM — Project page (shared)
   Reads window.PROJECT_DATA + window.PROJECT_ADDR, renders the page.
   ============================================================ */

const { useState: useP, useEffect: useEP, useRef: useRP } = React;

/* ============================================================
   Photo holder — reuses .catCard__photo aesthetic from About
   (corner reticles + crosshair + chrome row). Caption optional.
   ============================================================ */
function PhotoHolder({ caption, label = "PHOTO · PLACEHOLDER", id }) {
  return (
    <figure className="ph">
      <div className="ph__chrome">
        <span className="ph__chromeDot" />
        <span>{label}</span>
        <span className="ph__chromeSep" />
        <span>{id || "—"}</span>
      </div>
      <div className="ph__photo">
        <div className="ph__phStripes" />
        <div className="ph__phCorner ph__phCorner--tl" />
        <div className="ph__phCorner ph__phCorner--tr" />
        <div className="ph__phCorner ph__phCorner--bl" />
        <div className="ph__phCorner ph__phCorner--br" />
        <div className="ph__phCross" />
        <div className="ph__phNote">[ drop image · 4:5 · jpg ]</div>
      </div>
      {caption && (
        <figcaption className="ph__cap">
          <span className="ph__capK">CAP</span>
          <span className="ph__capV">{caption}</span>
        </figcaption>
      )}
    </figure>
  );
}

/* ============================================================
   Section block — long-form story body
   ============================================================ */
function SectionBlock({ block, i }) {
  if (block.kind === "photo") {
    return (
      <div className="pp-body__photo">
        <PhotoHolder caption={block.caption} id={(i + 1).toString().padStart(2, "0") + " / —"} />
      </div>
    );
  }
  return (
    <article className="pp-body__block">
      <header className="pp-body__h">
        <span className="pp-body__n">0{i + 1}</span>
        <h3 className="pp-body__title">{block.h}<em>.</em></h3>
      </header>
      <p className="pp-body__copy">{block.body}</p>
    </article>
  );
}

/* ============================================================
   Page chrome — shell with clickable wordmark → back to landing
   ============================================================ */
function ProjectShell({ project }) {
  const back = () => goBackToLanding(project);
  return (
    <header className="shell pp-shell">
      <a href="Landing.html" className="shell__brand pp-shell__brand"
         onClick={(e) => { e.preventDefault(); back(); }}>
        <span className="pp-shell__brandM">M.O.</span>
        <span className="pp-shell__brandSep" />
        <span className="pp-shell__brandBack">← UNIVERSE</span>
      </a>
      <nav className="shell__nav pp-shell__nav">
        <a href="Landing.html#work" onClick={(e) => { e.preventDefault(); back(); }}>WORK</a>
        <a href="Landing.html#about" onClick={(e) => { e.preventDefault(); back(); }}>ABOUT</a>
        <a href="Landing.html#contact" onClick={(e) => { e.preventDefault(); back(); }}>CONTACT</a>
        <a href="Design System.html">SYSTEM ↗</a>
      </nav>
      <div className="shell__status pp-shell__status">
        <span className="shell__dot" />
        <span>NODE {project.addr}</span>
        <span className="pp-shell__sep" />
        <span>[ESC] back</span>
      </div>
    </header>
  );
}

function goBackToLanding(project) {
  // request the reverse fly-out and then nav
  sessionStorage.setItem("mo_return_addr", project.addr);
  document.body.classList.add("pp-exit");
  setTimeout(() => { window.location.href = "Landing.html#work"; }, 380);
}

/* ============================================================
   HERO — title, tagline, metric strip, mini wireframe trace
   ============================================================ */
function ProjectHero({ project }) {
  return (
    <section className="pp-hero" data-screen-label="01 Hero">
      <div className="pp-hero__edge">
        <span className="pp-hero__edgeAddr">node {project.addr}</span>
        <span className="pp-hero__edgeR" />
        <span className="pp-hero__edgeYear">{project.year}</span>
      </div>
      <div className="pp-hero__inner">
        <div className="pp-hero__overline">
          <span className="pp-hero__pulse" />
          <span>{project.overline}</span>
        </div>

        <h1 className="pp-hero__title">{project.name}<em>.</em></h1>
        <div className="pp-hero__sub">{project.tagline}</div>

        <div className="pp-hero__metric">
          {project.metrics.map((m, i) => (
            <div key={i} className="pp-hero__metricCol">
              <span className="pp-hero__metricVal t-serif">{m.value}</span>
              <span className="pp-hero__metricKey">{m.unit}</span>
            </div>
          ))}
        </div>

        <div className="pp-hero__meta">
          <div className="pp-hero__metaCol">
            <span className="pp-hero__metaK">ROLE</span>
            <span className="pp-hero__metaV">{project.role}</span>
          </div>
          <div className="pp-hero__metaCol">
            <span className="pp-hero__metaK">YEAR</span>
            <span className="pp-hero__metaV">{project.year}</span>
          </div>
          <div className="pp-hero__metaCol">
            <span className="pp-hero__metaK">PLACE</span>
            <span className="pp-hero__metaV">{project.place}</span>
          </div>
          <div className="pp-hero__metaCol">
            <span className="pp-hero__metaK">STACK</span>
            <span className="pp-hero__metaV">{project.stack.join(" · ")}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   DEMO — 3D viewer block
   ============================================================ */
function ProjectDemo({ project }) {
  return (
    <section className="pp-demo" data-screen-label="02 Demo">
      <header className="pp-section__head">
        <div className="pp-section__num">02</div>
        <h2 className="pp-section__title">Model demo<em>.</em></h2>
        <div className="pp-section__meta">
          <div>PLACEHOLDER · {project.primitive.toUpperCase()}</div>
          <div>SWAP FOR REAL MODEL ↗</div>
        </div>
      </header>
      <ProjectViewer3D primitive={project.primitive} dims={project.demoSize} model={project.model} />
    </section>
  );
}

/* ============================================================
   STORY — long-form body
   ============================================================ */
function ProjectStory({ project }) {
  return (
    <section className="pp-story" data-screen-label="03 Story">
      <header className="pp-section__head">
        <div className="pp-section__num">03</div>
        <h2 className="pp-section__title">The story<em>.</em></h2>
        <div className="pp-section__meta">
          <div>{project.sections.filter(s => s.kind !== "photo").length} BLOCKS · {project.sections.filter(s => s.kind === "photo").length} PHOTOS</div>
        </div>
      </header>

      <div className="pp-story__lede">
        {project.intro}
      </div>

      <div className="pp-body">
        {project.sections.map((b, i) => <SectionBlock key={i} block={b} i={i} />)}
      </div>
    </section>
  );
}

/* ============================================================
   LINKS — github, case pdf, related
   ============================================================ */
function ProjectLinks({ project }) {
  return (
    <section className="pp-links" data-screen-label="04 Links">
      <header className="pp-section__head">
        <div className="pp-section__num">04</div>
        <h2 className="pp-section__title">Files &amp; links<em>.</em></h2>
        <div className="pp-section__meta">
          <div>{project.links.length} ARTIFACTS</div>
        </div>
      </header>
      <div className="pp-links__grid">
        {project.links.map((l, i) => (
          <a key={i} className="pp-link" href={l.href}>
            <span className="pp-link__k">{l.kind}</span>
            <span className="pp-link__v">{l.label}</span>
            <span className="pp-link__arr">↗</span>
          </a>
        ))}
      </div>
    </section>
  );
}

/* ============================================================
   FOOTER — prev / next project nav
   ============================================================ */
function ProjectFooterNav({ project }) {
  const prev = window.PROJECT_DATA[project.prev];
  const next = window.PROJECT_DATA[project.next];
  const goTo = (p) => {
    if (!p) return;
    sessionStorage.setItem("mo_navigate_from_addr", project.addr);
    document.body.classList.add("pp-exit");
    setTimeout(() => { window.location.href = p.file; }, 380);
  };

  return (
    <footer className="pp-foot" data-screen-label="05 Foot">
      <button className="pp-foot__nav pp-foot__nav--prev" onClick={() => goTo(prev)}>
        <span className="pp-foot__arr">←</span>
        <span className="pp-foot__col">
          <span className="pp-foot__k">PREV · NODE {prev.addr}</span>
          <span className="pp-foot__v">{prev.name}</span>
          <span className="pp-foot__sub">{prev.tagline}</span>
        </span>
      </button>
      <button className="pp-foot__home" onClick={() => goBackToLanding(project)}>
        <span className="pp-foot__homeK">M.O.</span>
        <span className="pp-foot__homeV">back to universe</span>
      </button>
      <button className="pp-foot__nav pp-foot__nav--next" onClick={() => goTo(next)}>
        <span className="pp-foot__col pp-foot__col--right">
          <span className="pp-foot__k">NEXT · NODE {next.addr}</span>
          <span className="pp-foot__v">{next.name}</span>
          <span className="pp-foot__sub">{next.tagline}</span>
        </span>
        <span className="pp-foot__arr">→</span>
      </button>
      <div className="pp-foot__rule" />
      <div className="pp-foot__legal">
        <span>© 2026 · MASLOV OLEKSANDR</span>
        <span>BUILT IN MUNICH · v0.1.0</span>
        <span>[ESC] · back to universe</span>
      </div>
    </footer>
  );
}

/* ============================================================
   FLY-IN OVERLAY — small primitive lands into demo viewport
   on page entry. Reads sessionStorage("mo_navigate_from_addr").
   ============================================================ */
function FlyInOverlay({ project }) {
  const mountRef = useRP(null);
  const [done, setDone] = useP(false);

  useEP(() => {
    const THREE = window.THREE;
    const mount = mountRef.current;
    if (!THREE || !mount) return;

    const from = sessionStorage.getItem("mo_navigate_from_addr");
    sessionStorage.removeItem("mo_navigate_from_addr");
    // even on fresh load, play the entry — looks intentional
    // (so we don't gate on `from`)

    let w = mount.clientWidth, h = mount.clientHeight;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(38, w / h, 0.1, 200);
    cam.position.set(0, 0, 8);

    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const k = new THREE.DirectionalLight(0xffffff, 1.0);
    k.position.set(2, 3, 2);
    scene.add(k);

    // Start with the procedural-primitive wireframe so the intro plays
    // instantly even on a cold cache. If the project has a real GLB, load it
    // in the background and swap it in once it's parsed — converted to the
    // same line-style via EdgesGeometry so the look matches.
    let wire = window.makePrimitiveMesh(project.primitive, THREE, { wireframe: true });
    // Only apply the cone-on-its-side primitive pose when there's no GLB —
    // otherwise the wire briefly inherits a rotation we don't want propagated
    // when the GLB takes over (the model has its own pose from Spline).
    if (!project.model) {
      window.orientPrimitive(project.primitive, wire);
    }
    scene.add(wire);

    // start: far + center-top of viewport · end: small + over demo viewport area
    wire.position.set(0, 6, -8);
    wire.scale.setScalar(0.6);

    if (project.model && window.loadProjectModel) {
      window.loadProjectModel(project.model, THREE).then((root) => {
        // Match the primitive's scale envelope so the lerp targets still work.
        window.fitModelToSize(root, THREE, 2);
        window.applyWireframeToModel(root, THREE);
        // Wrap in a Group so the entry animation (position / rotation / scale
        // lerps) drives the WRAPPER while the inner `root` keeps the centring
        // offset that fitModelToSize put on its local position. Rotating the
        // wrapper now pivots around the model's true bbox centre.
        const wrapper = new THREE.Group();
        wrapper.add(root);
        wrapper.position.copy(wire.position);
        wrapper.rotation.copy(wire.rotation);
        wrapper.scale.copy(wire.scale);
        scene.add(wrapper);
        scene.remove(wire);
        // Dispose the procedural placeholder
        wire.geometry?.dispose();
        wire.material?.dispose();
        wire = wrapper;
      }).catch(() => { /* keep primitive fallback */ });
    }

    const start = performance.now();
    const dur = 1100;

    let raf;
    function frame(now) {
      const t = Math.min(1, (now - start) / dur);
      const e = 1 - Math.pow(1 - t, 3);   // ease-out cubic
      wire.position.lerp(new THREE.Vector3(0, 0, 0), e);
      wire.scale.setScalar(0.6 + e * 0.9);
      wire.rotation.y += 0.022;
      wire.rotation.x += 0.006;
      renderer.render(scene, cam);
      if (t >= 1) {
        // fade overlay then unmount
        setTimeout(() => setDone(true), 220);
        return;
      }
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    const onResize = () => {
      w = mount.clientWidth; h = mount.clientHeight;
      renderer.setSize(w, h);
      cam.aspect = w / h;
      cam.updateProjectionMatrix();
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      try { mount.removeChild(renderer.domElement); } catch (_) {}
      renderer.dispose();
    };
  }, []);

  return (
    <div className={"pp-fly " + (done ? "pp-fly--done" : "")} aria-hidden="true">
      <div className="pp-fly__mount" ref={mountRef} />
      <div className="pp-fly__chrome">
        <span className="pp-fly__chromeDot" />
        <span>FETCHING NODE {project.addr}</span>
        <span className="pp-fly__chromeSep" />
        <span>{project.name.toUpperCase()}</span>
      </div>
    </div>
  );
}

/* ============================================================
   APP — wires it all
   ============================================================ */
function ProjectApp() {
  const addr = window.PROJECT_ADDR;
  const project = window.PROJECT_DATA[addr];
  if (!project) return <div style={{ padding: 40 }}>Unknown project: {addr}</div>;

  useEP(() => {
    document.title = project.name + " — Maslov Oleksandr";
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        goBackToLanding(project);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [project]);

  return (
    <>
      <FibGrid />
      <Cursor />
      <FlyInOverlay project={project} />
      <ProjectShell project={project} />
      <main className="pp">
        <ProjectHero project={project} />
        <ProjectDemo project={project} />
        <ProjectStory project={project} />
        <ProjectLinks project={project} />
        <ProjectFooterNav project={project} />
      </main>
    </>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<ProjectApp />);
