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

const { useState: useL, useEffect: useE, useRef: useR } = React;

function useCompact(bp = 700) {
  const [c, setC] = useL(() => window.innerWidth <= bp);
  useE(() => {
    const on = () => setC(window.innerWidth <= bp);
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, [bp]);
  return c;
}

/* ── featured nodes — one source of truth ─────────────────── */
const FEATURED_ADDRS = window.MO_FEATURED_ADDRS || ["0x01", "0x03", "0x04", "0x06"];
const WORKS = FEATURED_ADDRS
  .map(addr => (window.MO_PROJECTS || []).find(p => p.addr === addr))
  .filter(Boolean);

function Work({ onHoverWork }) {
  const sectionRef = useR(null);
  const [progress, setProgress] = useL(0);
  const [focused,  setFocused]  = useL(null);

  const N      = WORKS.length;
  const STOPS  = N + 2;
  const PADS   = 0.6;
  const TOTAL_V = STOPS + PADS;

  /* ── scroll progress + snap-by-easing (unchanged mechanics) ── */
  useE(() => {
    const el = sectionRef.current;
    if (!el) return;
    let raf;
    const easeInOut = t => t < 0.5 ? 2*t*t : 1 - Math.pow(-2*t+2, 2)/2;
    const update = () => {
      const r = el.getBoundingClientRect();
      const total = el.offsetHeight - window.innerHeight;
      if (total <= 0) { setProgress(0); return; }
      const pRaw = Math.max(0, Math.min(1, (-r.top) / total));
      const padN = (PADS / TOTAL_V);
      const p = Math.max(0, Math.min(1, (pRaw - padN) / (1 - 2*padN)));
      const intervals = STOPS - 1;
      const local = p * intervals;
      const idx   = Math.floor(local);
      const frac  = local - idx;
      const eased = easeInOut(frac);
      const snapped = (idx + eased) / intervals;
      window.__mo_reel = window.__mo_reel || {};
      window.__mo_reel.pos = snapped * intervals;
      setProgress(snapped);
    };
    const onScroll = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(update); };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [STOPS, PADS, TOTAL_V]);

  const activeStop = Math.round(progress * (STOPS - 1));
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

  /* ── geometry — JSX is the single source of truth ── */
  const compactReel = useCompact(700);
  const midReel     = useCompact(1100);
  const TITLE_SLOT_VW   = compactReel ? 100 : midReel ? 80 : 56;
  const CARD_SLOT_VW    = compactReel ? 78  : midReel ? 70 : 52;
  const SHOWALL_SLOT_VW = compactReel ? 96  : midReel ? 70 : 52;
  const TITLE_GUTTER_PX = compactReel ? 20 : 56;
  const titleInnerLeft  = `calc(${TITLE_GUTTER_PX}px - ${(50 - TITLE_SLOT_VW / 2).toFixed(2)}vw)`;
  const slotCentersVW = (() => {
    const out = [TITLE_SLOT_VW / 2];
    let cursor = TITLE_SLOT_VW;
    for (let i = 0; i < N; i++) {
      out.push(cursor + CARD_SLOT_VW / 2);
      cursor += CARD_SLOT_VW;
    }
    out.push(cursor + SHOWALL_SLOT_VW / 2);
    return out;
  })();
  const pp = progress * (STOPS - 1);
  const idx0 = Math.max(0, Math.min(STOPS - 2, Math.floor(pp)));
  const tt   = pp - idx0;
  const centerVW = slotCentersVW[idx0] * (1 - tt) + slotCentersVW[idx0 + 1] * tt;
  const railShiftVW = 50 - centerVW;
  const bgShiftVW   = railShiftVW * 0.35;

  const jumpToStop = (stopIdx) => {
    const el = sectionRef.current;
    if (!el) return;
    const total = el.offsetHeight - window.innerHeight;
    const padN = PADS / TOTAL_V;
    const target = padN + (stopIdx / (STOPS - 1)) * (1 - 2 * padN);
    window.scrollTo({ top: el.offsetTop + target * total, behavior: "smooth" });
  };

  return (
    <section
      ref={sectionRef}
      className="lp-section lp-workReel"
      id="work"
      data-screen-label="02 Work"
      style={{ height: `calc(${TOTAL_V} * 100vh)` }}
    >
      <div className="lp-workReel__sticky">
        <div
          className="lp-workReel__bg"
          style={{ transform: `translateX(${bgShiftVW}vw)` }}
        />

        <div className="lp-workReel__rail" style={{ transform: `translateX(${railShiftVW}vw)` }}>
          <div className="lp-workReel__slot lp-workReel__slot--title" style={{ flex: `0 0 ${TITLE_SLOT_VW}vw` }}>
            <div className="lp-workReel__titleInner" style={{ left: titleInnerLeft }}>
              <div className="lp-workReel__titleNum"><span data-mo-cursor-mirror data-mo-cursor-opacity=".lp-workReel__sticky,.lp">02</span></div>
              <h2 className="lp-workReel__title" data-mo-cursor-mirror data-mo-cursor-opacity=".lp-workReel__sticky,.lp">Selected nodes<em>.</em></h2>
              <div className="lp-workReel__titleSub">
                <span className="lp-workReel__titleSubDot" />
                <span data-mo-cursor-mirror data-mo-cursor-opacity=".lp-workReel__sticky,.lp">Scroll — each node resolves at the lens.</span>
              </div>
            </div>
          </div>

          {WORKS.map((w, i) => {
            const stopIdx = i + 1;
            const slotCenter = stopIdx / (STOPS - 1);
            const delta = progress - slotCenter;
            const absD  = Math.min(1, Math.abs(delta) * (STOPS - 1));
            const isLocked = activeStop === stopIdx && Math.abs(delta) < 0.5 / (STOPS - 1);
            return (
              <div className="lp-workReel__slot" key={w.addr} style={{ flex: `0 0 ${CARD_SLOT_VW}vw` }}>
                <NodeCard
                  work={w} i={i} total={N}
                  absD={absD}
                  locked={isLocked}
                  focused={focused === w.addr}
                  onFocus={setFocused}
                />
              </div>
            );
          })}

          {(() => {
            const stopIdx = N + 1;
            const slotCenter = stopIdx / (STOPS - 1);
            const delta = progress - slotCenter;
            const absD  = Math.min(1, Math.abs(delta) * (STOPS - 1));
            const isLocked = activeStop === stopIdx && Math.abs(delta) < 0.5 / (STOPS - 1);
            const popScale = isLocked ? 1.02 : (1 - absD * 0.06);
            const popOp    = 1 - absD * 0.4;
            return (
              <div className="lp-workReel__slot lp-workReel__slot--showAll" style={{ flex: `0 0 ${SHOWALL_SLOT_VW}vw` }}>
                <div
                  className={"showAllGate " + (isLocked ? "showAllGate--locked" : "")}
                  data-screen-label="06 All projects gate"
                  style={{
                    transform: `scale(${popScale.toFixed(3)})`,
                    opacity: popOp.toFixed(3),
                  }}
                >
                  <span className="showAllGate__spine" aria-hidden="true" />
                  <div className="showAllGate__body">
                    <div className="showAllGate__overline" data-mo-cursor-mirror data-mo-cursor-opacity=".showAllGate,.lp-workReel__sticky,.lp">04 / END · PASSAGE</div>
                    <h3 className="showAllGate__name" data-mo-cursor-mirror data-mo-cursor-opacity=".showAllGate,.lp-workReel__sticky,.lp">Open the universe<em>.</em></h3>
                    <div className="showAllGate__sub" data-mo-cursor-mirror data-mo-cursor-opacity=".showAllGate,.lp-workReel__sticky,.lp">
                      12 nodes — products, systems, modules and studies. Enter the full field. ESC returns here.
                    </div>
                  </div>
                  <div className="showAllGate__key">
                    <KeyButton legend={<span data-mo-cursor-mirror data-mo-cursor-opacity=".showAllGate,.lp-workReel__sticky,.lp">A</span>} primary onPress={() => {
                      document.body.classList.add("landing-exit");
                      setTimeout(() => { window.location.href = "All Projects.html"; }, 380);
                    }}>
                      <span data-mo-cursor-mirror data-mo-cursor-opacity=".showAllGate,.lp-workReel__sticky,.lp">SHOW ALL</span>
                    </KeyButton>
                  </div>
                </div>
              </div>
            );
          })()}
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
            className="lp-workReel__progressFill"
            style={{ width: `${(progress * 100).toFixed(2)}%` }}
          />
        </div>
      </div>

    </section>
  );
}

/* ── NODE CARD — the original caption bar; opens through mo:nodeFlight ── */
function NodeCard({ work, i, total, absD, locked, focused, onFocus }) {
  const cardRef = useR(null);
  const hasPage = !!work.file;

  const openNode = () => {
    if (!hasPage) return;                                 // RECORD FORMING — stays visual
    const project = work;
    const rect = cardRef.current ? cardRef.current.getBoundingClientRect() : null;
    const originRect = rect ? { x: rect.left, y: rect.top, w: rect.width, h: rect.height } : null;
    window.dispatchEvent(new CustomEvent("mo:nodeFlight", { detail: { project, originRect, origin: "work" } }));
  };
  const onKey = (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openNode(); }
  };

  const popScale = locked ? 1.025 : (1 - absD * 0.06);
  const popOp    = 1 - absD * 0.4;

  return (
    <article
      ref={cardRef}
      className={
        "rcard " +
        (locked ? "rcard--locked " : "") +
        (focused ? "rcard--focused" : "")
      }
      data-addr={work.addr}
      data-screen-label={(i + 2).toString().padStart(2, "0") + " " + work.name}
      onMouseEnter={() => onFocus && onFocus(work.addr)}
      onMouseLeave={() => onFocus && onFocus(null)}
      onFocus={() => onFocus && onFocus(work.addr)}
      onBlur={() => onFocus && onFocus(null)}
      onClick={openNode}
      onKeyDown={onKey}
      tabIndex={0}
      style={{
        transform: `scale(${popScale.toFixed(3)})`,
        opacity: popOp.toFixed(3),
      }}
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
