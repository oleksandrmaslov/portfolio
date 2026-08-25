/* ============================================================
   M.O. SYSTEM — WORK REEL — "SELECTED NODES"
   ------------------------------------------------------------
   2026-08 node-system pass:
   · data comes from window.MO_PROJECTS via MO_FEATURED_ADDRS —
     no duplicated project copy in this file;
   · cards keep their original caption-bar form (no 3D on the card);
   · every card opens through the generic mo:nodeFlight handoff
     (no addr-specific branches); file:null nodes stay visual
     and read RECORD FORMING instead of navigating.
   Exports: WORKS, Work.
   ============================================================ */

const { useState: useL, useEffect: useE, useLayoutEffect: useLE, useRef: useR } = React;

/* ── featured nodes — one source of truth ─────────────────── */
const FEATURED_ADDRS = window.MO_FEATURED_ADDRS || ["0x01", "0x03", "0x04", "0x06"];
const WORKS = FEATURED_ADDRS
  .map(addr => (window.MO_PROJECTS || []).find(p => p.addr === addr))
  .filter(Boolean);

function workReelGeometry(viewportWidth, count) {
  const compact = viewportWidth <= 700;
  const mid = viewportWidth <= 1100;
  const titleSlot = compact ? 100 : mid ? 80 : 56;
  const cardSlot = compact ? 78 : mid ? 70 : 52;
  const showAllSlot = compact ? 96 : mid ? 70 : 52;
  const titleGutter = compact ? "var(--s-5)" : "var(--gutter)";
  const centers = [titleSlot / 2];
  let cursor = titleSlot;
  for (let i = 0; i < count; i++) {
    centers.push(cursor + cardSlot / 2);
    cursor += cardSlot;
  }
  centers.push(cursor + showAllSlot / 2);
  return {
    titleSlot,
    cardSlot,
    showAllSlot,
    titleLeft: `calc(${titleGutter} - ${(50 - titleSlot / 2).toFixed(2)}vw)`,
    centers,
  };
}

function Work({ onHoverWork }) {
  const sectionRef = useR(null);
  const bgRef      = useR(null);
  const railRef    = useR(null);
  const fillRef    = useR(null);
  const cardsRef   = useR([]);
  const showAllRef = useR(null);
  const layoutRef  = useR({ top: 0, total: 0 });
  const geometryRef = useR(null);
  const progressRef = useR(0);
  const applyProgressRef = useR(null);
  const activeStopRef = useR(0);
  const [activeStop, setActiveStop] = useL(0);
  const [focused,  setFocused]  = useL(null);

  const N      = WORKS.length;
  const STOPS  = N + 2;
  const PADS   = 0.6;
  const TOTAL_V = STOPS + PADS;

  const activeCardIdx = Math.max(0, activeStop - 1);
  const activeWork = activeStop === 0 || activeStop > N ? null : WORKS[activeCardIdx];

  useE(() => {
    onHoverWork && onHoverWork(focused || activeWork?.addr || null);
  }, [focused, activeWork, onHoverWork]);

  /* announce reel stop changes — sound score AND the shared model stage listen */
  useE(() => {
    try {
      window.dispatchEvent(new CustomEvent("mo:reelStop", {
        detail: { stop: activeStop, addr: activeWork ? activeWork.addr : null },
      }));
    } catch (_) {}
  }, [activeStop]);

  /* JSX publishes the exact responsive slot values as CSS variables, while
     the scroll loop consumes the same geometry object. There is no second
     breakpoint table for motion and no resize-driven React render. */
  const renderGeometry = workReelGeometry(window.innerWidth, N);
  geometryRef.current = renderGeometry;

  /* ── scroll progress + snap-by-easing (unchanged mechanics) ──
     Continuous reel motion is intentionally kept out of React. The section's
     document position is measured only when layout can change, then scroll
     frames write the existing transforms/opacities straight to stable nodes.
     React still owns the discrete active-stop and focus semantics. */
  useE(() => {
    const el = sectionRef.current;
    if (!el) return;

    let raf = 0;
    let resizeObserver = null;
    let disposed = false;
    const intervals = STOPS - 1;
    const padN = PADS / TOTAL_V;
    const easeInOut = t => t < 0.5 ? 2*t*t : 1 - Math.pow(-2*t+2, 2)/2;

    const applyProgress = (snapped) => {
      const centers = geometryRef.current.centers;
      const pp = snapped * intervals;
      const idx0 = Math.max(0, Math.min(STOPS - 2, Math.floor(pp)));
      const tt = pp - idx0;
      const centerVW = centers[idx0] * (1 - tt) + centers[idx0 + 1] * tt;
      const railShiftVW = 50 - centerVW;

      if (railRef.current) railRef.current.style.transform = `translateX(${railShiftVW}vw)`;
      if (bgRef.current) bgRef.current.style.transform = `translateX(${railShiftVW * 0.35}vw)`;
      if (fillRef.current) fillRef.current.style.transform = `scaleX(${snapped.toFixed(4)})`;

      cardsRef.current.forEach((card, i) => {
        if (!card) return;
        const stopIdx = i + 1;
        const delta = snapped - stopIdx / intervals;
        const absD = Math.min(1, Math.abs(delta) * intervals);
        const locked = activeStopRef.current === stopIdx && Math.abs(delta) < 0.5 / intervals;
        card.style.transform = `scale(${(locked ? 1.025 : 1 - absD * 0.06).toFixed(3)})`;
        card.style.opacity = (1 - absD * 0.4).toFixed(3);
        card.classList.toggle("rcard--locked", locked);
      });

      const gate = showAllRef.current;
      if (gate) {
        const stopIdx = N + 1;
        const delta = snapped - stopIdx / intervals;
        const absD = Math.min(1, Math.abs(delta) * intervals);
        const locked = activeStopRef.current === stopIdx && Math.abs(delta) < 0.5 / intervals;
        gate.style.transform = `scale(${(locked ? 1.02 : 1 - absD * 0.06).toFixed(3)})`;
        gate.style.opacity = (1 - absD * 0.4).toFixed(3);
        gate.classList.toggle("showAllGate--locked", locked);
      }
    };
    applyProgressRef.current = applyProgress;

    const update = () => {
      raf = 0;
      if (disposed) return;
      const { top, total } = layoutRef.current;
      const pageY = Number.isFinite(window.__mo_scrollY) ? window.__mo_scrollY : window.scrollY;
      const pRaw = total > 0
        ? Math.max(0, Math.min(1, (pageY - top) / total))
        : 0;
      const p = Math.max(0, Math.min(1, (pRaw - padN) / (1 - 2 * padN)));
      const local = p * intervals;
      const idx = Math.floor(local);
      const frac = local - idx;
      const snapped = (idx + easeInOut(frac)) / intervals;
      const nextStop = Math.round(snapped * intervals);

      progressRef.current = snapped;
      window.__mo_reel = window.__mo_reel || {};
      window.__mo_reel.pos = snapped * intervals;

      if (activeStopRef.current !== nextStop) {
        activeStopRef.current = nextStop;
        setActiveStop(nextStop);
      }
      applyProgress(snapped);
    };
    const scheduleUpdate = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    const measure = () => {
      if (disposed) return;
      const geometry = workReelGeometry(window.innerWidth, N);
      const rect = el.getBoundingClientRect();
      geometryRef.current = geometry;
      layoutRef.current.top = rect.top + window.scrollY;
      layoutRef.current.total = Math.max(0, el.offsetHeight - window.innerHeight);
      el.style.setProperty("--work-title-slot", `${geometry.titleSlot}vw`);
      el.style.setProperty("--work-card-slot", `${geometry.cardSlot}vw`);
      el.style.setProperty("--work-showall-slot", `${geometry.showAllSlot}vw`);
      el.style.setProperty("--work-title-left", geometry.titleLeft);
      scheduleUpdate();
    };

    measure();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", measure);
    if (window.ResizeObserver) {
      resizeObserver = new ResizeObserver(measure);
      resizeObserver.observe(el);
    }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure).catch(() => {});

    return () => {
      disposed = true;
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", measure);
      if (resizeObserver) resizeObserver.disconnect();
      cancelAnimationFrame(raf);
      if (applyProgressRef.current === applyProgress) applyProgressRef.current = null;
    };
  }, [N, STOPS, PADS, TOTAL_V]);

  /* Focus and stop changes can make React rewrite a card's class attribute.
     Re-assert the continuous presentation in the same commit, before paint. */
  useLE(() => {
    if (applyProgressRef.current) applyProgressRef.current(progressRef.current);
  }, [activeStop, focused]);

  const initialCenterVW = renderGeometry.centers[0];
  const initialRailShiftVW = 50 - initialCenterVW;

  const jumpToStop = (stopIdx) => {
    const el = sectionRef.current;
    if (!el) return;
    let { top, total } = layoutRef.current;
    // The passive effect normally owns this cache. Keep keyboard/mouse stop
    // controls usable even in the narrow first-commit window before it runs.
    if (total <= 0) {
      const rect = el.getBoundingClientRect();
      top = rect.top + window.scrollY;
      total = Math.max(0, el.offsetHeight - window.innerHeight);
      layoutRef.current = { top, total };
    }
    if (total <= 0) return;
    const padN = PADS / TOTAL_V;
    const target = padN + (stopIdx / (STOPS - 1)) * (1 - 2 * padN);
    window.scrollTo({ top: top + target * total, behavior: "smooth" });
  };

  return (
    <section
      ref={sectionRef}
      className="lp-section lp-workReel"
      id="work"
      data-screen-label="02 Work"
      style={{
        height: `calc(${TOTAL_V} * 100vh)`,
        "--work-title-slot": `${renderGeometry.titleSlot}vw`,
        "--work-card-slot": `${renderGeometry.cardSlot}vw`,
        "--work-showall-slot": `${renderGeometry.showAllSlot}vw`,
        "--work-title-left": renderGeometry.titleLeft,
      }}
    >
      <div className="lp-workReel__sticky">
        <div
          ref={bgRef}
          className="lp-workReel__bg"
          style={{ transform: `translateX(${initialRailShiftVW * 0.35}vw)` }}
        />

        <div ref={railRef} className="lp-workReel__rail" style={{ transform: `translateX(${initialRailShiftVW}vw)` }}>
          <div className="lp-workReel__slot lp-workReel__slot--title">
            <div className="lp-workReel__titleInner">
              <div className="lp-workReel__titleNum"><span data-mo-cursor-mirror data-mo-cursor-opacity=".lp-workReel__sticky,.lp">02</span></div>
              <h2 className="lp-workReel__title" data-mo-cursor-mirror data-mo-cursor-opacity=".lp-workReel__sticky,.lp">Selected nodes<em>.</em></h2>
              <div className="lp-workReel__titleSub">
                <span className="lp-workReel__titleSubDot" />
                <span data-mo-cursor-mirror data-mo-cursor-opacity=".lp-workReel__sticky,.lp">Scroll — each node resolves at the lens.</span>
              </div>
            </div>
          </div>

          {WORKS.map((w, i) => {
            return (
              <div className="lp-workReel__slot" key={w.addr}>
                <NodeCard
                  work={w} i={i} total={N}
                  nodeRef={node => { cardsRef.current[i] = node; }}
                  focused={focused === w.addr}
                  onFocus={setFocused}
                />
              </div>
            );
          })}

          <div className="lp-workReel__slot lp-workReel__slot--showAll">
              <div
                ref={showAllRef}
                className="showAllGate"
                data-screen-label="06 All projects gate"
                style={{ transform: "scale(0.940)", opacity: "0.600" }}
              >
                  <span className="showAllGate__spine" aria-hidden="true" />
                  <div className="showAllGate__body">
                    <div className="showAllGate__overline" data-mo-cursor-mirror data-mo-cursor-opacity=".showAllGate,.lp-workReel__sticky,.lp">04 / END · PASSAGE</div>
                    <h3 className="showAllGate__name" data-mo-cursor-mirror data-mo-cursor-opacity=".showAllGate,.lp-workReel__sticky,.lp">Open the universe<em>.</em></h3>
                    <div className="showAllGate__sub" data-mo-cursor-mirror data-mo-cursor-opacity=".showAllGate,.lp-workReel__sticky,.lp">
                      {(window.MO_PROJECTS || []).length} nodes — products, systems, modules and studies. Enter the full field. ESC returns here.
                    </div>
                  </div>
                  <div className="showAllGate__key">
                    <KeyButton legend={<span data-mo-cursor-mirror data-mo-cursor-opacity=".showAllGate,.lp-workReel__sticky,.lp">A</span>} primary onPress={() => {
                      // Same handoff as the shell's INDEX link — the field
                      // sorts into a column before the page swaps. Defined in
                      // app.jsx, which owns the shell; it is on window by the
                      // time anyone can click this.
                      if (window.moLeaveToIndex) window.moLeaveToIndex();
                      else {
                        document.body.classList.add("landing-exit");
                        setTimeout(() => { window.location.href = "All Projects.html"; }, 380);
                      }
                    }}>
                      <span data-mo-cursor-mirror data-mo-cursor-opacity=".showAllGate,.lp-workReel__sticky,.lp">SHOW ALL</span>
                    </KeyButton>
                  </div>
              </div>
            </div>
        </div>

        <div className="lp-workReel__vignette" />

        <div className="lp-workReel__stops">
          <button
            type="button"
            className={"lp-workReel__stopBtn " + (activeStop === 0 ? "is-active" : "")}
            onClick={() => jumpToStop(0)}
          >
            <span className="lp-workReel__stopDot" />
            <span data-mo-cursor-mirror data-mo-cursor-opacity=".lp-workReel__stops,.lp-workReel__sticky,.lp">00 · TITLE</span>
          </button>
          {WORKS.map((w, i) => (
            <button
              type="button"
              key={w.addr}
              className={"lp-workReel__stopBtn " + (activeStop === i + 1 ? "is-active" : "")}
              onClick={() => jumpToStop(i + 1)}
            >
              <span className="lp-workReel__stopDot" />
              <span data-mo-cursor-mirror data-mo-cursor-opacity=".lp-workReel__stops,.lp-workReel__sticky,.lp">{(i + 1).toString().padStart(2, "0")} · {w.name.toUpperCase()}</span>
            </button>
          ))}
          <button
            type="button"
            className={"lp-workReel__stopBtn lp-workReel__stopBtn--showAll " + (activeStop === N + 1 ? "is-active" : "")}
            onClick={() => jumpToStop(N + 1)}
          >
            <span className="lp-workReel__stopDot" />
            <span data-mo-cursor-mirror data-mo-cursor-opacity=".lp-workReel__stops,.lp-workReel__sticky,.lp">{(N + 1).toString().padStart(2, "0")} · ALL ↗</span>
          </button>
        </div>

        <div className="lp-workReel__progressRail">
          <div
            ref={fillRef}
            className="lp-workReel__progressFill"
            style={{ transform: "scaleX(0)" }}
          />
        </div>
      </div>

    </section>
  );
}

/* ── NODE CARD — the original caption bar; opens through mo:nodeFlight ── */
function NodeCard({ work, i, total, nodeRef, focused, onFocus }) {
  const cardRef = useR(null);
  const hasPage = !!work.file;

  const openNode = () => {
    if (!hasPage) return;                                 // RECORD FORMING — stays visual
    const project = work;
    // The reel card is a caption bar; the model the reader is looking at sits
    // in the universe tile roughly a screen-third above it. Fly out of that
    // tile so the rig lifts off the card that is actually showing the model,
    // and fall back to the caption bar when the tile is off-screen.
    let originRect = null;
    const uni = window.__mo_universe;
    if (uni && typeof uni.tileBounds === "function") {
      try { originRect = uni.tileBounds(work.addr); } catch (_) { originRect = null; }
    }
    if (!originRect) {
      const rect = cardRef.current ? cardRef.current.getBoundingClientRect() : null;
      originRect = rect ? { x: rect.left, y: rect.top, w: rect.width, h: rect.height } : null;
    }
    window.dispatchEvent(new CustomEvent("mo:nodeFlight", { detail: { project, originRect, origin: "work" } }));
  };
  const onKey = (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openNode(); }
  };

  return (
    <article
      ref={node => {
        cardRef.current = node;
        if (nodeRef) nodeRef(node);
      }}
      className={
        "rcard " +
        (focused ? "rcard--focused" : "")
      }
      data-addr={work.addr}
      {...(hasPage ? { "data-hot": "" } : {})}
      data-screen-label={(i + 2).toString().padStart(2, "0") + " " + work.name}
      onMouseEnter={() => onFocus && onFocus(work.addr)}
      onMouseLeave={() => onFocus && onFocus(null)}
      onFocus={() => onFocus && onFocus(work.addr)}
      onBlur={() => onFocus && onFocus(null)}
      onClick={openNode}
      onKeyDown={onKey}
      tabIndex={0}
      style={{ transform: "scale(0.940)", opacity: "0.600" }}
    >
      <span className="rcard__spine" aria-hidden="true" />

      {/* CAPTION PLATE — original caption-bar block, unchanged */}
      <div className="rcard__body">
        <div className="rcard__top" data-mo-cursor-mirror data-mo-cursor-opacity=".rcard,.lp-workReel__sticky,.lp">
          <span className="rcard__topAddr">NODE {work.addr}</span>
          <span className="rcard__topSep" />
          <span className="rcard__topIdx">{(i + 1).toString().padStart(2, "0")} / {total.toString().padStart(2, "0")}</span>
        </div>
        <h3 className="rcard__name" data-mo-cursor-mirror data-mo-cursor-opacity=".rcard,.lp-workReel__sticky,.lp">{work.name}<em>.</em></h3>
        <div className="rcard__sub" data-mo-cursor-mirror data-mo-cursor-opacity=".rcard,.lp-workReel__sticky,.lp">{work.short || work.statement}</div>
      </div>

      <div className={"rcard__open " + (hasPage ? "" : "rcard__open--forming")} data-mo-cursor-mirror data-mo-cursor-opacity=".rcard,.lp-workReel__sticky,.lp">
        <span>{hasPage ? "OPEN" : "RECORD FORMING"}</span>
        {hasPage && <span className="rcard__arr">→</span>}
      </div>
    </article>
  );
}

window.Work        = Work;
window.WORKS       = WORKS;
window.FEATURED_ADDRS = FEATURED_ADDRS;
