/* ============================================================
   M.O. SYSTEM — Wafer v2 · project page
   ------------------------------------------------------------
   The wafer model (shared rig) is the hero. On arrival from the
   Final 5 node flight it snaps to the canonical pose (seam), then
   eases to the hero rest layout while the title resolves around it.

   · bottom-right INSPECT keycap → dim the page, raise the model
     fullscreen, drag-to-orbit + exploded view, ESC / STOP to exit.
   · leaving (ESC / wordmark / footer home) → the model flies back
     out and we return to wherever the user came from (universe title
     screen or the work reel).
   · hero layout is fixed to classic (model right · title left).
   ============================================================ */
const { useState: useP2, useEffect: useEP2, useRef: useRP2 } = React;

/* Wafer hero config — model right, title left. */
const HERO_LAYOUT = "right";   // "right" | "center" | "left"
const IDLE_DRIFT = true;

/* PLAY DEMO · production defaults */
const WAFER_TWEAK_DEFAULTS = {
  "direction": "cinematic",
  "hud": "full",
  "explodeDist": 1,
  "stagger": 0.65,
  "thockPitch": 1,
  "soundLevel": 0.8
};

/* layout → rig offset (fraction of half-width), scale, vertical offset.
   Width-aware: on phones the board floats up-top and shrinks so the title
   sits clear beneath it and nothing clips the edge. */
function heroLayoutParams() {
  const w = window.innerWidth;
  if (w <= 700)  return { fracX: 0,    scale: 0.58, offY: 0.95 };  // mobile · board up, title below
  if (w <= 1000) return { fracX: 0.18, scale: 0.74, offY: 0.18 };  // tablet
  return { fracX: 0.34, scale: 0.88, offY: 0 };                    // desktop · right
}
function applyHeroLayout(rig) {
  if (!rig) return;
  const p = heroLayoutParams();
  rig.setLayout(p.fracX, p.scale, p.offY);
}

function SectionBlock({ block, i }) {
  if (block.kind === "photo") {
    return (
      <div className="pp-body__photo">
        <AsciiPhotoFigure
          src={block.src || "lab/ascii-photo/wafer-sample.jpg"}
          caption={block.caption}
          id={(i + 1).toString().padStart(2, "0") + " / —"}
          idx={i}
        />
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

function ProjectStory({ project }) {
  return (
    <section className="pp-story" data-screen-label="03 Story">
      <header className="pp-section__head">
        <div className="pp-section__num">02</div>
        <h2 className="pp-section__title">The story<em>.</em></h2>
        <div className="pp-section__meta">
          <div>{project.sections.filter(s => s.kind !== "photo").length} BLOCKS · {project.sections.filter(s => s.kind === "photo").length} PHOTOS</div>
        </div>
      </header>
      <div className="pp-story__lede">{project.intro}</div>
      <div className="pp-body">
        {project.sections.map((b, i) => <SectionBlock key={i} block={b} i={i} />)}
      </div>
    </section>
  );
}

function ProjectLinks({ project }) {
  return (
    <section className="pp-links" data-screen-label="04 Links">
      <header className="pp-section__head">
        <div className="pp-section__num">03</div>
        <h2 className="pp-section__title">Files &amp; links<em>.</em></h2>
        <div className="pp-section__meta"><div>{project.links.length} ARTIFACTS</div></div>
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

function leaveToUniverse() {
  if (document.body.classList.contains("hv-exit")) return;
  window.__hv_leaving = true;
  document.documentElement.style.setProperty("--hv-stage-op", "1");
  // model stays on screen: ease back to CENTER + keep spinning (no shrink-away)
  if (window.__waferRig) { window.__waferRig.setIdle(false); window.__waferRig.setExplode(0); window.__waferRig.toHandoff(); window.__hv_exitSpin = true; }
  document.body.classList.remove("hv-inspecting");
  document.body.classList.add("hv-exit");            // page content fades; the model stage stays
  // return to wherever the user opened the project FROM: universe title screen
  // (clicked a floating node) or the work reel (clicked a work card).
  try {
    const seam = window.__waferRig && window.__waferRig.captureFrame ? window.__waferRig.captureFrame() : null;
    if (seam) sessionStorage.setItem("mo_node_seam", seam);
    if (window.__waferRig && window.__waferRig.yaw != null) sessionStorage.setItem("mo_node_yaw", String(window.__waferRig.yaw));
  } catch (_) {}
  const returnTo = sessionStorage.getItem("mo_node_return_origin") || "work";
  sessionStorage.removeItem("mo_node_return_origin");
  sessionStorage.setItem("mo_node_return", "1");
  sessionStorage.setItem("mo_node_return_addr", "0x01");
  sessionStorage.setItem("mo_node_return_target", returnTo);
  const dest = returnTo === "universe" ? "Landing Final 5.html" : "Landing Final 5.html#work";
  setTimeout(() => { window.location.href = dest; }, 720);
}

function ProjectFooterNav({ project }) {
  const prev = window.PROJECT_DATA[project.prev];
  const next = window.PROJECT_DATA[project.next];
  const goTo = (p) => {
    if (!p) return;
    document.body.classList.add("hv-exit");
    setTimeout(() => { window.location.href = p.file2 || p.file; }, 420);
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
      <button className="pp-foot__home" onClick={leaveToUniverse}>
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
        <span>BUILT IN MUNICH</span>
        <span>[ESC] · back to universe</span>
      </div>
    </footer>
  );
}

/* ============================================================
   SHELL
   ============================================================ */
function WaferShell({ project }) {
  return (
    <header className="shell pp-shell">
      <div className="pp-shell__blur" aria-hidden="true">
        <div /><div /><div /><div /><div /><div /><div />
      </div>
      <a href="Landing Final 5.html" className="shell__brand pp-shell__brand"
         onClick={(e) => { e.preventDefault(); leaveToUniverse(); }}>
        <span className="pp-shell__brandM">M.O.</span>
        <span className="pp-shell__brandSep" />
        <span className="pp-shell__brandBack">← UNIVERSE</span>
      </a>
      <nav className="shell__nav pp-shell__nav">
        <a href="Landing Final 5.html#work" onClick={(e) => { e.preventDefault(); leaveToUniverse(); }}>WORK</a>
        <a href="Landing Final 5.html#about" onClick={(e) => { e.preventDefault(); leaveToUniverse(); }}>ABOUT</a>
        <a href="Landing Final 5.html#contact" onClick={(e) => { e.preventDefault(); leaveToUniverse(); }}>CONTACT</a>
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

/* ============================================================
   HERO — title aligned to the framed anchors, model behind
   ============================================================ */
function WaferHero({ project, layout, onInspect }) {
  return (
    <section className={"hv hv--" + layout} data-screen-label="01 Hero">
      <div className="hv__frame" aria-hidden="true">
        <span className="hv__corner hv__corner--tl" />
        <span className="hv__corner hv__corner--tr" />
        <span className="hv__corner hv__corner--bl" />
        <span className="hv__corner hv__corner--br" />
        <span className="hv__edgeLabel hv__edgeLabel--tl">NODE {project.addr} · {project.year}</span>
        <span className="hv__edgeLabel hv__edgeLabel--tr"><span className="hv__liveDot" />MODEL · LIVE</span>
      </div>

      <div className="hv__title">
        <div className="hv__overline"><span className="hv__pulse" />{project.overline}</div>
        <h1 className="hv__name">{project.name}<em>.</em></h1>
        <div className="hv__tagline">{project.tagline}</div>
        <div className="hv__metric">
          {project.metrics.map((m, i) => (
            <div key={i} className="hv__metricCol">
              <span className="hv__metricVal">{m.value}</span>
              <span className="hv__metricKey">{m.unit}</span>
            </div>
          ))}
        </div>
        <div className="hv__meta">
          <div className="hv__metaCol"><span className="hv__metaK">ROLE</span><span className="hv__metaV">{project.role}</span></div>
          <div className="hv__metaCol"><span className="hv__metaK">PLACE</span><span className="hv__metaV">{project.place}</span></div>
          <div className="hv__metaCol"><span className="hv__metaK">STACK</span><span className="hv__metaV">{project.stack.slice(0, 4).join(" · ")}</span></div>
        </div>
      </div>

      <div className="hv__scrollCue">
        <span className="hv__scrollCueLine" />
        <span>SCROLL · CASE FILE</span>
      </div>
    </section>
  );
}

/* INSPECT overlay retired — replaced by the PLAY DEMO experience
   (demo/wafer-demo.js + demo/demo-hud.jsx). */

/* ============================================================
   APP
   ============================================================ */
function WaferV2App() {
  const project = window.PROJECT_DATA["0x01"];
  const [ready, setReady] = useP2(false);
  const [demo, setDemo] = useP2(false);
  const tweaks = WAFER_TWEAK_DEFAULTS;

  const stageRef = useRP2(null);
  const rigRef   = useRP2(null);
  const demoRef  = useRP2(false);
  useEP2(() => { demoRef.current = demo; }, [demo]);

  /* build the rig once */
  useEP2(() => {
    document.title = "Wafer — Maslov Oleksandr";
    const mount = stageRef.current;
    const rig = window.makeWaferRig(mount, { model: "models/wafer_demo.glb" });
    rigRef.current = rig;
    window.__waferRig = rig;
    if (!rig) { setReady(true); return; }

    const arrived = sessionStorage.getItem("mo_node_arrive") === "1"
                 && sessionStorage.getItem("mo_node_addr") === "0x01";
    sessionStorage.removeItem("mo_node_arrive");

    const settleToRest = (yawTarget) => {
      if (yawTarget != null) rig.setYawTarget(yawTarget);
      else rig.resetOrbit();                  // tgt.yaw → arriveYaw
      applyHeroLayout(rig);                    // slides to the width-aware rest
      if (IDLE_DRIFT) rig.setIdle(true);
      setReady(true);
    };

    if (arrived) {
      // SEAM: boot at the EXACT angle the landing flight ended on (passed via
      // sessionStorage) so the captured seam frame and the live model line up
      // with zero rotation jump. Then CONTINUE the turn forward to the next
      // hero-rest-equivalent angle — completing one smooth ~360° across the
      // page swap (the Cartier move), never spinning backward.
      const RG = window.WAFER_RIG;
      const seamYaw = parseFloat(sessionStorage.getItem("mo_node_yaw"));
      sessionStorage.removeItem("mo_node_yaw");
      let bootYaw, restYaw;
      if (isFinite(seamYaw)) {
        bootYaw = seamYaw;
        restYaw = RG.arriveYaw;
        while (restYaw < bootYaw + 0.25) restYaw += Math.PI * 2;   // next forward rest angle
      } else {
        bootYaw = RG.arriveYaw - 0.6;
        restYaw = RG.arriveYaw;
      }
      const P = heroLayoutParams();
      rig.snapToLayout(P.fracX, P.scale, P.offY, bootYaw);
      rig.setYawRate(0.045);                  // gentle finish that matches the flight's spin speed
      setReady(true);                         // content fades in around the model
      requestAnimationFrame(() => requestAnimationFrame(() => settleToRest(restYaw)));
      setTimeout(() => rig.setYawRate(0.22), 1100);   // restore snappy yaw for inspect-orbit
      // drop the seam-bridge image once the live model is actually drawing
      const dropSeam = () => {
        const s = document.getElementById("mo-seam");
        if (s) { s.style.opacity = "0"; setTimeout(() => s.remove(), 600); }
        sessionStorage.removeItem("mo_node_seam");
      };
      const waitReady = () => {
        if (rig.ready) { requestAnimationFrame(() => requestAnimationFrame(dropSeam)); }
        else setTimeout(waitReady, 50);
      };
      waitReady();
    } else {
      sessionStorage.removeItem("mo_node_seam");
      sessionStorage.removeItem("mo_node_yaw");
      const s0 = document.getElementById("mo-seam"); if (s0) s0.remove();
      rig.beginHandoff();                     // direct load: appear centered, then settle
      setTimeout(settleToRest, 460);
    }

    let raf, last = performance.now();
    const loop = (now) => {
      const dt = now - last; last = now;
      if (window.__hv_exitSpin) rig.nudgeYaw(Math.min(50, dt) * 0.0019);   // graceful exit turn
      rig.update(dt); rig.render();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const onResize = () => {
      if (!mount) return;
      rig.setSize(mount.clientWidth, mount.clientHeight);
      if (!demoRef.current && !window.__hv_leaving) applyHeroLayout(rig);   // re-anchor across breakpoints
    };
    window.addEventListener("resize", onResize);

    const onScroll = () => {
      if (demoRef.current || window.__hv_leaving) return;
      const op = Math.max(0, 1 - window.scrollY / (window.innerHeight * 0.72));
      document.documentElement.style.setProperty("--hv-stage-op", op.toFixed(3));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll);
      rig.dispose();
    };
  }, []);


  const enterDemo = () => {
    if (demoRef.current) return;
    setDemo(true);
    document.body.classList.add("hv-demoing");
    const rig = rigRef.current;
    if (rig) rig.setIdle(false);
  };
  const exitDemo = () => {
    setDemo(false);
    document.body.classList.remove("hv-demoing");
    const rig = rigRef.current;
    if (rig) {
      rig.resetOrbit();
      applyHeroLayout(rig);
      if (IDLE_DRIFT) rig.setIdle(true);
    }
    const op = Math.max(0, 1 - window.scrollY / (window.innerHeight * 0.72));
    document.documentElement.style.setProperty("--hv-stage-op", op.toFixed(3));
  };

  /* keyboard: ESC exits the demo, else leaves */
  useEP2(() => {
    const onKey = (e) => {
      if (e.key === "Escape") { e.preventDefault(); if (demoRef.current) exitDemo(); else leaveToUniverse(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <a className="pp-skip" href="#project-content">Skip to project story</a>
      {/* persistent model stage (behind content; raised during inspect) */}
      <div className="hv-stage"><div className="hv-stage__mount" ref={stageRef} /></div>
      <div className="hv-scrim" aria-hidden="true" />

      <div className={"hv-page " + (ready ? "hv-page--ready" : "")}>
        <WaferShell project={project} />
        <main className="pp" id="project-content" tabIndex="-1">
          <WaferHero project={project} layout={HERO_LAYOUT} onInspect={enterDemo} />
          <ProjectStory project={project} />
          <ProjectLinks project={project} />
          <ProjectFooterNav project={project} />
        </main>
      </div>

      {/* bottom-right PLAY DEMO keycap (remounts per demo cycle — no stale lit/focus state) */}
      <div className="hv-demo">
        <span className="hv-demo__hint"><span className="hv-demo__hintDot" />PRESS KEYS · EXPLODE · LAYERS</span>
        <KeyButton key={demo ? "demo-on" : "demo-off"} legend="▸" primary onPress={enterDemo}>PLAY DEMO</KeyButton>
      </div>

      {/* fullscreen demo stage + HUD (always mounted; controls its own fade) */}
      <WaferDemoLayer active={demo} onClose={exitDemo} tweaks={tweaks} />

    </>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<WaferV2App />);
