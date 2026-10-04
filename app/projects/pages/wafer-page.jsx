/* ============================================================
   M.O. SYSTEM — Wafer project page
   ------------------------------------------------------------
   The wafer model (shared rig) is the hero. On arrival from the
   landing flight it SNAPS to the canonical pose (seam), then
   eases to the hero rest layout while the title resolves around it.

   · bottom-right PLAY DEMO keycap → the live keyboard demo
     (demo/wafer-demo.js + demo/wafer-hud.jsx), ESC / STOP to exit.
   · leaving (ESC / wordmark / footer home) → the model flies back
     out and we return to wherever the user came from (universe title
     screen or the work reel).
   · hero layout is fixed to classic (model right · title left).
   ============================================================ */
const {
  useState: useWaferPageState,
  useEffect: useWaferPageEffect,
  useRef: useWaferPageRef,
} = React;

/* Wafer hero config — the production page is fixed to the classic layout. */
const HERO_LAYOUT = "right";   // the only hero layout case-study.css draws
const IDLE_DRIFT = true;

/* PLAY DEMO settings, handed to WaferDemoLayer as its `tweaks` prop. The HUD
   copies them to window.__waferDemoTweaks, where wafer-demo.js and
   wafer-sound.js read them. */
const WAFER_DEMO_TWEAKS = {
  direction: "cinematic",
  hud: "full",
  explodeDist: 1,
  stagger: 0.65,
  thockPitch: 1,
  soundLevel: 0.8,
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

/* ============================================================
   Reused long-form sections shared with the canonical project pages;
   app/projects/styles/base.css styles them consistently.
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

function SectionBlock({ block, i }) {
  if (block.kind === "photo" || block.kind === "video") {
    return (
      <div className="pp-body__photo">
        <AsciiMediaFigure
          kind={block.kind}
          src={block.src || "app/projects/components/wafer-sample.webp"}
          poster={block.poster}
          ratio={block.ratio}
          tone={block.tone}
          caption={block.caption}
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

function ProjectStory({ project }) {
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
        {project.sections.map((b, i) => <SectionBlock key={i} block={b} i={i} />)}
      </div>
    </section>
  );
}

function ProjectLinks({ project }) {
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

function leaveToUniverse() {
  if (document.body.classList.contains("hv-exit")) return;
  window.__hv_leaving = true;
  document.documentElement.style.setProperty("--hv-stage-op", "1");
  // model stays on screen: ease back to CENTER + keep spinning (no shrink-away)
  if (window.__waferRig) { window.__waferRig.setIdle(false); window.__waferRig.toHandoff(); window.__hv_exitSpin = true; }
  document.body.classList.add("hv-exit");            // page content fades; the model stage stays
  window.dispatchEvent(new CustomEvent("mo:project-rig-wake"));   // the loop may be asleep below the stage
  // Hand the model's live yaw to the landing so the reverse flight CONTINUES
  // this page's rotation instead of snapping. The landing does
  // `if (isFinite(seamYaw)) rig.setYaw(seamYaw)` — with the key absent that
  // parseFloat is NaN, snapHandoff()'s arriveYaw-0.85 stands, and the mark
  // visibly jumps at the seam. Every route must write this, not just the
  // handoff pages.
  try {
    if (window.__waferRig && window.__waferRig.yaw != null) sessionStorage.setItem("mo_node_yaw", String(window.__waferRig.yaw));
  } catch (_) {}
  // return to wherever the user opened the project FROM: universe title screen
  // (clicked a floating node) or the work reel (clicked a work card).
  const returnTo = sessionStorage.getItem("mo_node_return_origin") || "work";
  sessionStorage.removeItem("mo_node_return_origin");
  sessionStorage.setItem("mo_node_return", "1");
  sessionStorage.setItem("mo_node_return_addr", "0x01");
  sessionStorage.setItem("mo_node_return_target", returnTo);
  const dest = returnTo === "universe" ? "./" : "./#work";
  setTimeout(() => { window.location.href = dest; }, 720);
}

function ProjectFooterNav({ project }) {
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
      <button className="pp-foot__home" onClick={leaveToUniverse} data-mo-cursor-mirror data-mo-cursor-opacity=".hv-page">
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
   SHELL
   ============================================================ */
function WaferShell({ project }) {
  return <PortfolioHeader className="pp-shell" context={project.addr + " · " + project.name}
    utility={<a href="./#work" onClick={(e) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault(); leaveToUniverse();
    }}>← UNIVERSE</a>} />;
}

/* ============================================================
   HERO — title aligned to the framed anchors, model behind
   ============================================================ */
function WaferHero({ project, layout }) {
  return (
    <section className={"hv hv--" + layout} data-screen-label="01 Hero">
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

/* PLAY DEMO uses demo/wafer-demo.js with demo/wafer-hud.jsx. */

/* ============================================================
   APP
   ============================================================ */
function WaferProjectApp() {
  const project = window.PROJECT_DATA["0x01"];
  const [ready, setReady] = useWaferPageState(false);
  const [demo, setDemo] = useWaferPageState(false);

  const stageRef = useWaferPageRef(null);
  const rigRef   = useWaferPageRef(null);
  const demoRef  = useWaferPageRef(false);
  useWaferPageEffect(() => { demoRef.current = demo; }, [demo]);

  useWaferPageEffect(() => {
    const sharedCursor = window.MOCursorDistortion;
    if (!sharedCursor || typeof sharedCursor.mountStandalone !== "function") return;
    const cursorFx = sharedCursor.mountStandalone({
      THREE: window.THREE,
      selector: "[data-mo-cursor-mirror]",
      zIndex: 20,
      dprCap: 1,
      disabledClasses: ["hv-exit", "hv-demoing", "mo-menu-open"],
    });
    return () => {
      if (cursorFx && typeof cursorFx.destroy === "function") cursorFx.destroy();
    };
  }, []);

  /* build the rig once */
  useWaferPageEffect(() => {
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

    // Same sleep contract as project-page-lifecycle.jsx: no callback at all
    // while the stage is scrolled away, covered or hidden. The case file below
    // it is the longest on the site, and a permanent loop there never idled.
    let raf = 0, last = performance.now();
    const shouldRender = () => !document.hidden && !document.body.classList.contains("mo-menu-open") && (
      window.scrollY < window.innerHeight * 0.74
      || window.__hv_exitSpin
    );
    const loop = (now) => {
      raf = 0;
      if (!shouldRender()) { last = now; return; }
      const dt = now - last; last = now;
      if (window.__hv_exitSpin) rig.nudgeYaw(Math.min(50, dt) * 0.0019);   // graceful exit turn
      rig.update(dt); rig.render();
      raf = requestAnimationFrame(loop);
    };
    const syncLoop = () => {
      if (!shouldRender()) { cancelAnimationFrame(raf); raf = 0; return; }
      if (raf) return;
      last = performance.now();          // a long sleep must not arrive as one dt
      raf = requestAnimationFrame(loop);
    };
    syncLoop();

    const onResize = () => {
      if (!mount) return;
      rig.setSize(mount.clientWidth, mount.clientHeight);
      if (!demoRef.current && !window.__hv_leaving) applyHeroLayout(rig);   // re-anchor across breakpoints
      syncLoop();
    };
    window.addEventListener("resize", onResize);

    const onScroll = () => {
      if (!demoRef.current && !window.__hv_leaving) {
        const op = Math.max(0, 1 - window.scrollY / (window.innerHeight * 0.72));
        document.documentElement.style.setProperty("--hv-stage-op", op.toFixed(3));
      }
      syncLoop();
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    // Back/forward cache restores this page exactly as it left: centred in the
    // handoff pose, idle off. core.jsx has already cleared the exit spin.
    const onRestored = () => {
      if (!demoRef.current) settleToRest();
      onScroll();
    };
    document.addEventListener("visibilitychange", syncLoop);
    window.addEventListener("pageshow", syncLoop);
    window.addEventListener("mo:menu", syncLoop);
    window.addEventListener("mo:project-rig-wake", syncLoop);
    window.addEventListener("mo:page-restored", onRestored);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", syncLoop);
      window.removeEventListener("pageshow", syncLoop);
      window.removeEventListener("mo:menu", syncLoop);
      window.removeEventListener("mo:project-rig-wake", syncLoop);
      window.removeEventListener("mo:page-restored", onRestored);
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
  useWaferPageEffect(() => {
    const onKey = (e) => {
      if (e.defaultPrevented || document.body.classList.contains("mo-menu-open")) return;
      if (e.key === "Escape") { e.preventDefault(); if (demoRef.current) exitDemo(); else leaveToUniverse(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <Cursor />

      {/* persistent model stage (behind content; raised during inspect) */}
      <div className="hv-stage"><div className="hv-stage__mount" ref={stageRef} /></div>
      <div className="hv-scrim" aria-hidden="true" />

      <div className={"hv-page " + (ready ? "hv-page--ready" : "")}>
        <WaferShell project={project} />
        <main className="pp">
          <WaferHero project={project} layout={HERO_LAYOUT} />
          <ProjectStory project={project} />
          <ProjectLinks project={project} />
          <ProjectFooterNav project={project} />
        </main>
      </div>

      {/* bottom-right PLAY DEMO keycap (remounts per demo cycle — no stale lit/focus state) */}
      <div className="hv-demo">
        <span className="hv-demo__hint" data-mo-cursor-mirror data-mo-cursor-opacity=".hv-demo"><span className="hv-demo__hintDot" />PRESS KEYS · EXPLODE · LAYERS</span>
        <KeyButton
          key={demo ? "demo-on" : "demo-off"}
          legend={<span data-mo-cursor-mirror data-mo-cursor-opacity=".hv-demo">▸</span>}
          primary
          ripple={false}
          blurOnPress
          onPress={enterDemo}
        >
          <span data-mo-cursor-mirror data-mo-cursor-opacity=".hv-demo">PLAY DEMO</span>
        </KeyButton>
      </div>

      {/* fullscreen demo stage + HUD (always mounted; controls its own fade) */}
      <WaferDemoLayer active={demo} onClose={exitDemo} tweaks={WAFER_DEMO_TWEAKS} />
    </>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<WaferProjectApp />);
