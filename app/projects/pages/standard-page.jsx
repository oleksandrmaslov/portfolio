/* ============================================================
   M.O. SYSTEM — STANDARD PROJECT PAGE
   ------------------------------------------------------------
   Shared by canonical project pages. Each project loads this
   file plus a small window.PAGE_CONFIG defined inline:

     window.PAGE_CONFIG = {
       addr: "0x04",
       docTitle: "Tactical Flashlight — Maslov Oleksandr",
       hero: {                      // passed to makeWaferRig
         model: "models/x.glb",     //   GLB path …
         buildModel: (THREE)=>grp,  //   … or procedural builder
         pose: { x, y, z },         //   rest orientation override
         modelFit: 4.1, matcap: true,
       },
       photoSrc: "app/projects/components/wafer-sample.webp",
       demo: {                      // bespoke PLAY DEMO …
         layerName: "TorchDemoLayer",
         hint: "TAIL SWITCH · MODES · SOS",
         label: "PLAY DEMO",
       },
       link: { label, href },       // … or a link keycap instead
       tweakDefaults: { … },
       renderTweaks: (t, set) => <></>,
     };

   Standard-page behavior by design:
     · no landing seam-bridge (the flight arrives on Wafer only)
     · footer prev/next follows the canonical data.file route
     · leave → straight fade back to the landing page (no return-flight
       protocol — that contract is wafer-specific)
   ============================================================ */
const { useState: usePC, useEffect: useEPC, useRef: useRPC } = React;

const PC = window.PAGE_CONFIG || {};
const PC_IDLE_DRIFT = true;

/* Shared project keycap button. */
function PCKeyButton({ children, legend = "↵", primary, onPress }) {
  const [pressed, setPressed] = usePC(false);
  const [lit, setLit] = usePC(false);
  const fire = (el) => {
    setPressed(true); setLit(true);
    onPress && onPress();
    if (el && el.blur) el.blur();
    setTimeout(() => setPressed(false), 140);
    setTimeout(() => setLit(false), 520);
  };
  const onKey = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fire(e.currentTarget); } };
  return (
    <button
      className={"key " + (pressed ? "key--down " : "") + (lit ? "key--lit " : "") + (primary ? "key--primary" : "")}
      onClick={(e) => fire(e.currentTarget)} onKeyDown={onKey}>
      <span className="key__cap" data-mo-cursor-mirror data-mo-cursor-opacity=".hv-demo">
        <span className="key__legendTop">{legend}</span>
        <span className="key__label">{children}</span>
      </span>
      <span className="key__shadow" aria-hidden="true" />
    </button>
  );
}
if (!window.KeyButton) window.KeyButton = PCKeyButton;

/* layout → rig offset (shared project-page breakpoints).
   A page may override any breakpoint with PAGE_CONFIG.heroLayout —
   { mobile, tablet, desktop } — when its model needs to sit clear of the
   title column. Omitted keys keep the shared defaults. */
function pcHeroLayoutParams() {
  const w = window.innerWidth;
  const o = (window.PAGE_CONFIG && window.PAGE_CONFIG.heroLayout) || {};
  if (w <= 700)  return Object.assign({ fracX: 0,    scale: 0.58, offY: 0.95 }, o.mobile);
  if (w <= 1000) return Object.assign({ fracX: 0.18, scale: 0.74, offY: 0.18 }, o.tablet);
  return Object.assign({ fracX: 0.34, scale: 0.88, offY: 0 }, o.desktop);
}
function pcApplyHeroLayout(rig) {
  if (!rig) return;
  const p = pcHeroLayoutParams();
  rig.setLayout(p.fracX, p.scale, p.offY);
}

/* ============================================================
   Long-form project sections
   ============================================================ */
/* "1 CLIPS" reads like a bug. Count only what a story actually contains and
   agree the noun with it. */
function pcStoryMeta(project) {
  const n = (k) => project.sections.filter((s) => s.kind === k).length;
  const part = (c, one, many) => (c ? c + " " + (c === 1 ? one : many) : null);
  return [
    part(n("stub"), "BLOCK", "BLOCKS"),
    part(n("photo"), "PHOTO", "PHOTOS"),
    part(n("video"), "CLIP", "CLIPS"),
  ].filter(Boolean).join(" · ");
}

function PCSectionBlock({ block, i }) {
  if (block.kind === "photo" || block.kind === "video") {
    return (
      <div className="pp-body__photo">
        <AsciiMediaFigure
          kind={block.kind}
          src={block.src || PC.photoSrc || "app/projects/components/wafer-sample.webp"}
          poster={block.poster}
          ratio={block.ratio}
          tone={block.tone}
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
        <span className="pp-body__n" data-mo-cursor-mirror data-mo-cursor-opacity=".hv-page">0{i + 1}</span>
        <h3 className="pp-body__title" data-mo-cursor-mirror data-mo-cursor-opacity=".hv-page">{block.h}<em>.</em></h3>
      </header>
      <p className="pp-body__copy" data-mo-cursor-mirror data-mo-cursor-opacity=".hv-page">{block.body}</p>
    </article>
  );
}

function PCProjectStory({ project }) {
  return (
    <section className="pp-story" data-screen-label="03 Story">
      <header className="pp-section__head">
        <div className="pp-section__num" data-mo-cursor-mirror data-mo-cursor-opacity=".hv-page">02</div>
        <h2 className="pp-section__title" data-mo-cursor-mirror data-mo-cursor-opacity=".hv-page">The story<em>.</em></h2>
        <div className="pp-section__meta">
          <div data-mo-cursor-mirror data-mo-cursor-opacity=".hv-page">{pcStoryMeta(project)}</div>
        </div>
      </header>
      <div className="pp-story__lede" data-mo-cursor-mirror data-mo-cursor-opacity=".hv-page">{project.intro}</div>
      <div className="pp-body">
        {project.sections.map((b, i) => <PCSectionBlock key={i} block={b} i={i} />)}
      </div>
    </section>
  );
}

function PCProjectLinks({ project }) {
  return (
    <section className="pp-links" data-screen-label="04 Links">
      <header className="pp-section__head">
        <div className="pp-section__num" data-mo-cursor-mirror data-mo-cursor-opacity=".hv-page">03</div>
        <h2 className="pp-section__title" data-mo-cursor-mirror data-mo-cursor-opacity=".hv-page">Files &amp; links<em>.</em></h2>
        <div className="pp-section__meta"><div data-mo-cursor-mirror data-mo-cursor-opacity=".hv-page">{project.links.length} ARTIFACTS</div></div>
      </header>
      <div className="pp-links__grid">
        {project.links.map((l, i) => (
          <a key={i} className="pp-link" href={l.href}>
            <span className="pp-link__k" data-mo-cursor-mirror data-mo-cursor-opacity=".hv-page">{l.kind}</span>
            <span className="pp-link__v" data-mo-cursor-mirror data-mo-cursor-opacity=".hv-page">{l.label}</span>
            <span className="pp-link__arr" data-mo-cursor-mirror data-mo-cursor-opacity=".hv-page">↗</span>
          </a>
        ))}
      </div>
    </section>
  );
}

/* leave — fade the page, keep the model spinning, go home */
function pcLeaveToUniverse() {
  if (document.body.classList.contains("hv-exit")) return;
  window.__hv_leaving = true;
  document.documentElement.style.setProperty("--hv-stage-op", "1");
  if (window.__pageRig) { window.__pageRig.setIdle(false); window.__pageRig.setExplode(0); window.__pageRig.toHandoff(); window.__hv_exitSpin = true; }
  document.body.classList.remove("hv-inspecting");
  document.body.classList.add("hv-exit");
  const returnTo = sessionStorage.getItem("mo_node_return_origin") || "work";
  sessionStorage.removeItem("mo_node_return_origin");
  sessionStorage.setItem("mo_node_return", "1");
  sessionStorage.setItem("mo_node_return_addr", PC.addr);
  sessionStorage.setItem("mo_node_return_target", returnTo);
  const dest = returnTo === "universe" ? "./" : "./#work";
  setTimeout(() => { window.location.href = dest; }, 720);
}

function PCProjectFooterNav({ project }) {
  // Fall back to this project rather than throwing: the ring is closed today,
  // but an unguarded read here blanks the entire page on a gap, and the `!p`
  // check in goTo below shows a missing record was already considered.
  const prev = window.PROJECT_DATA[project.prev] || project;
  const next = window.PROJECT_DATA[project.next] || project;
  const goTo = (p) => {
    if (!p) return;
    document.body.classList.add("hv-exit");
    setTimeout(() => { window.location.href = p.file; }, 420);
  };
  return (
    <footer className="pp-foot" data-screen-label="05 Foot">
      <button className="pp-foot__nav pp-foot__nav--prev" onClick={() => goTo(prev)}>
        <span className="pp-foot__arr" data-mo-cursor-mirror data-mo-cursor-opacity=".hv-page">←</span>
        <span className="pp-foot__col" data-mo-cursor-mirror data-mo-cursor-opacity=".hv-page">
          <span className="pp-foot__k">PREV · NODE {prev.addr}</span>
          <span className="pp-foot__v">{prev.name}</span>
          <span className="pp-foot__sub">{prev.tagline}</span>
        </span>
      </button>
      <button className="pp-foot__home" onClick={pcLeaveToUniverse} data-mo-cursor-mirror data-mo-cursor-opacity=".hv-page">
        <span className="pp-foot__homeK">M.O.</span>
        <span className="pp-foot__homeV">back to universe</span>
      </button>
      <button className="pp-foot__nav pp-foot__nav--next" onClick={() => goTo(next)}>
        <span className="pp-foot__col pp-foot__col--right" data-mo-cursor-mirror data-mo-cursor-opacity=".hv-page">
          <span className="pp-foot__k">NEXT · NODE {next.addr}</span>
          <span className="pp-foot__v">{next.name}</span>
          <span className="pp-foot__sub">{next.tagline}</span>
        </span>
        <span className="pp-foot__arr" data-mo-cursor-mirror data-mo-cursor-opacity=".hv-page">→</span>
      </button>
      <div className="pp-foot__rule" />
      <div className="pp-foot__legal">
        <span data-mo-cursor-mirror data-mo-cursor-opacity=".hv-page">© 2026 · MASLOV OLEKSANDR</span>
        <span data-mo-cursor-mirror data-mo-cursor-opacity=".hv-page">BUILT IN MUNICH · v0.1.0</span>
        <span data-mo-cursor-mirror data-mo-cursor-opacity=".hv-page">[ESC] · back to universe</span>
      </div>
    </footer>
  );
}

/* ============================================================
   SHELL + HERO
   ============================================================ */
function PCShell({ project }) {
  return (
    <header className="shell pp-shell">
      <div className="pp-shell__blur" aria-hidden="true">
        <div></div><div></div><div></div><div></div><div></div><div></div><div></div>
      </div>
      {/* Two destinations, so two controls. The wordmark goes home to the
          title like it does on every other route; the arrow keeps the
          reverse node flight back to wherever this page was opened from. */}
      <div className="shell__brand pp-shell__brand">
        <a className="pp-shell__brandM" href="./" aria-label="Back to the title"
           data-mo-cursor-mirror data-mo-cursor-opacity=".pp-shell,.hv-page">M.O.</a>
        <span className="pp-shell__brandSep" />
        <a className="pp-shell__brandBack" href="./#work"
           onClick={(e) => { e.preventDefault(); pcLeaveToUniverse(); }}
           data-mo-cursor-mirror data-mo-cursor-opacity=".pp-shell,.hv-page">← UNIVERSE</a>
      </div>
      <nav className="shell__nav pp-shell__nav">
        <a href="./#work" onClick={(e) => { e.preventDefault(); pcLeaveToUniverse(); }} data-mo-cursor-mirror data-mo-cursor-opacity=".pp-shell,.hv-page">WORK</a>
        <a href="./#about" onClick={(e) => { e.preventDefault(); pcLeaveToUniverse(); }} data-mo-cursor-mirror data-mo-cursor-opacity=".pp-shell,.hv-page">ABOUT</a>
        <a href="./#contact" onClick={(e) => { e.preventDefault(); pcLeaveToUniverse(); }} data-mo-cursor-mirror data-mo-cursor-opacity=".pp-shell,.hv-page">CONTACT</a>
      </nav>
      <div className="shell__status pp-shell__status">
        <span className="shell__dot" />
        <span data-mo-cursor-mirror data-mo-cursor-opacity=".pp-shell,.hv-page">NODE {project.addr}</span>
        <span className="pp-shell__sep" />
        <span data-mo-cursor-mirror data-mo-cursor-opacity=".pp-shell,.hv-page">[ESC] back</span>
      </div>
    </header>
  );
}

function PCHero({ project }) {
  return (
    <section className="hv hv--right" data-screen-label="01 Hero">
      <div className="hv__frame" aria-hidden="true">
        <span className="hv__corner hv__corner--tl" />
        <span className="hv__corner hv__corner--tr" />
        <span className="hv__corner hv__corner--bl" />
        <span className="hv__corner hv__corner--br" />
        <span className="hv__edgeLabel hv__edgeLabel--tl" data-mo-cursor-mirror data-mo-cursor-opacity=".hv-page">NODE {project.addr} · {project.year}</span>
        <span className="hv__edgeLabel hv__edgeLabel--tr" data-mo-cursor-mirror data-mo-cursor-opacity=".hv-page"><span className="hv__liveDot" />MODEL · LIVE</span>
      </div>

      <div className="hv__title">
        <div className="hv__overline" data-mo-cursor-mirror data-mo-cursor-opacity=".hv__title,.hv-page"><span className="hv__pulse" />{project.overline}</div>
        <h1 className="hv__name" data-mo-cursor-mirror data-mo-cursor-opacity=".hv__title,.hv-page">{project.name}<em>.</em></h1>
        <div className="hv__tagline" data-mo-cursor-mirror data-mo-cursor-opacity=".hv__title,.hv-page">{project.tagline}</div>
        <div className="hv__metric">
          {project.metrics.map((m, i) => (
            <div key={i} className="hv__metricCol">
              <span className="hv__metricVal" data-mo-cursor-mirror data-mo-cursor-opacity=".hv__title,.hv-page">{m.value}</span>
              <span className="hv__metricKey" data-mo-cursor-mirror data-mo-cursor-opacity=".hv__title,.hv-page">{m.unit}</span>
            </div>
          ))}
        </div>
        <div className="hv__meta">
          <div className="hv__metaCol" data-mo-cursor-mirror data-mo-cursor-opacity=".hv__title,.hv-page"><span className="hv__metaK">ROLE</span><span className="hv__metaV">{project.role}</span></div>
          <div className="hv__metaCol" data-mo-cursor-mirror data-mo-cursor-opacity=".hv__title,.hv-page"><span className="hv__metaK">PLACE</span><span className="hv__metaV">{project.place}</span></div>
          <div className="hv__metaCol" data-mo-cursor-mirror data-mo-cursor-opacity=".hv__title,.hv-page"><span className="hv__metaK">STACK</span><span className="hv__metaV">{project.stack.slice(0, 4).join(" · ")}</span></div>
        </div>
      </div>

      <div className="hv__scrollCue">
        <span className="hv__scrollCueLine" />
        <span data-mo-cursor-mirror data-mo-cursor-opacity=".hv__scrollCue,.hv-page">SCROLL · CASE FILE</span>
      </div>
    </section>
  );
}

/* ============================================================
   APP
   ============================================================ */
function ProjectPageApp() {
  const project = window.PROJECT_DATA[PC.addr];
  const [ready, setReady] = usePC(false);
  const [demo, setDemo] = usePC(false);
  const [tweaks, setTweak] = useTweaks(PC.tweakDefaults || {});

  const stageRef = useRPC(null);
  const rigRef   = useRPC(null);
  const demoRef  = useRPC(false);
  useEPC(() => { demoRef.current = demo; }, [demo]);

  useEPC(() => {
    const sharedCursor = window.MOCursorDistortion;
    if (!sharedCursor || typeof sharedCursor.mountStandalone !== "function") return;
    const cursorFx = sharedCursor.mountStandalone({
      THREE: window.THREE,
      selector: "[data-mo-cursor-mirror]",
      zIndex: 20,
      dprCap: 1,
      disabledClasses: ["hv-exit", "hv-inspecting", "hv-demoing"],
    });
    return () => {
      if (cursorFx && typeof cursorFx.destroy === "function") cursorFx.destroy();
    };
  }, []);

  /* build the rig once */
  useEPC(() => {
    document.title = PC.docTitle || (project.name + " — Maslov Oleksandr");
    const mount = stageRef.current;
    const H = PC.hero || {};
    const rig = window.makeWaferRig(mount, {
      model: H.model || project.model,
      buildModel: H.buildModel,
      pose: H.pose,
      modelFit: H.modelFit,
      matcap: H.matcap,
    });
    rigRef.current = rig;
    window.__pageRig = rig;
    if (!rig) { setReady(true); return; }

    rig.beginHandoff();                       // appear centered, then settle
    setTimeout(() => {
      rig.resetOrbit();
      pcApplyHeroLayout(rig);
      if (PC_IDLE_DRIFT) rig.setIdle(true);
      setReady(true);
    }, 460);

    let raf, last = performance.now();
    const loop = (now) => {
      const dt = now - last; last = now;
      const stageVisible = window.scrollY < window.innerHeight * 0.74
        || window.__hv_exitSpin
        || document.body.classList.contains("hv-inspecting");
      if (!document.hidden && stageVisible) {
        if (window.__hv_exitSpin) rig.nudgeYaw(Math.min(50, dt) * 0.0019);
        rig.update(dt); rig.render();
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const onResize = () => {
      if (!mount) return;
      rig.setSize(mount.clientWidth, mount.clientHeight);
      if (!demoRef.current && !window.__hv_leaving) pcApplyHeroLayout(rig);
    };
    window.addEventListener("resize", onResize);
    onResize();

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
    if (!PC.demo || demoRef.current) return;
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
      pcApplyHeroLayout(rig);
      if (PC_IDLE_DRIFT) rig.setIdle(true);
    }
    const op = Math.max(0, 1 - window.scrollY / (window.innerHeight * 0.72));
    document.documentElement.style.setProperty("--hv-stage-op", op.toFixed(3));
  };

  /* keyboard: ESC exits the demo, else leaves */
  useEPC(() => {
    const onKey = (e) => {
      if (e.key === "Escape") { e.preventDefault(); if (demoRef.current) exitDemo(); else pcLeaveToUniverse(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const DemoLayer = PC.demo ? window[PC.demo.layerName] : null;

  return (
    <>
      <FibGrid />
      <Cursor />

      <div className="hv-stage"><div className="hv-stage__mount" ref={stageRef} /></div>
      <div className="hv-scrim" aria-hidden="true" />

      <div className={"hv-page " + (ready ? "hv-page--ready" : "")}>
        <PCShell project={project} />
        <main className="pp">
          <PCHero project={project} />
          <PCProjectStory project={project} />
          <PCProjectLinks project={project} />
          <PCProjectFooterNav project={project} />
        </main>
      </div>

      {/* bottom-right keycap: bespoke demo, or (wave 2) a link */}
      {PC.demo && (
        <div className="hv-demo">
          <span className="hv-demo__hint" data-mo-cursor-mirror data-mo-cursor-opacity=".hv-demo"><span className="hv-demo__hintDot" />{PC.demo.hint}</span>
          <PCKeyButton key={demo ? "demo-on" : "demo-off"} legend="▸" primary onPress={enterDemo}>{PC.demo.label || "PLAY DEMO"}</PCKeyButton>
        </div>
      )}
      {!PC.demo && PC.link && (
        <div className="hv-demo">
          <span className="hv-demo__hint" data-mo-cursor-mirror data-mo-cursor-opacity=".hv-demo"><span className="hv-demo__hintDot" />{PC.link.hint || "SOURCE · ARTIFACTS"}</span>
          <PCKeyButton legend="↗" primary onPress={() => {
            if (PC.link.self) {
              document.body.classList.add("hv-exit");
              setTimeout(() => { window.location.href = PC.link.href; }, 420);
            } else {
              window.open(PC.link.href, "_blank");
            }
          }}>{PC.link.label}</PCKeyButton>
        </div>
      )}

      {DemoLayer && <DemoLayer active={demo} onClose={exitDemo} tweaks={tweaks} />}

      <TweaksPanel>
        {PC.renderTweaks ? PC.renderTweaks(tweaks, setTweak) : null}
      </TweaksPanel>
    </>
  );
}

const pcRoot = ReactDOM.createRoot(document.getElementById("root"));
pcRoot.render(<ProjectPageApp />);
