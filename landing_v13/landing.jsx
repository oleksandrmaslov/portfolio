/* ============================================================
   M.O. SYSTEM — Landing page sections
   ============================================================ */

const { useState: useL, useEffect: useE, useRef: useR, useCallback: useCB } = React;

/* ============================================================
   useInView — fire onEnter when the section is significantly on-screen
   ============================================================ */
function useInView(onEnter) {
  const ref = useR(null);
  useE(() => {
    const el = ref.current;
    if (!el || !onEnter) return;
    // Trigger when the section overlaps the middle 30% band of the viewport.
    // Independent of section height — short or tall sections register identically.
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) onEnter();
      }
    }, { rootMargin: "-35% 0px -35% 0px", threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, [onEnter]);
  return ref;
}

/* ============================================================
   useCompact — viewport flag (≤ bp px), live on resize/rotate
   ============================================================ */
function useCompact(bp = 700) {
  const [c, setC] = useL(() => window.innerWidth <= bp);
  useE(() => {
    const on = () => setC(window.innerWidth <= bp);
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, [bp]);
  return c;
}
const IS_TOUCH = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(pointer: coarse)").matches;

/* ============================================================
   HERO — full-bleed Universe (bg) + overlay editorial
   ============================================================ */
/* ============================================================
   TITLE SCREEN — framed instrument viewport
   M.O. wordmark bottom-left, Proceed key bottom-right,
   corner reticles + anchor labels mark the universe's interactive frame.
   ============================================================ */
/* ============================================================
   FIELD GUIDE — the OBVIOUS center coachmark (Variant 1 · CONSOLE).
   Teaches drag / scroll-to-fly / click up front, then DISMISSES itself
   the moment the visitor actually touches the universe (drag, wheel-fly,
   or node click — dispatched as `mo:universeInteract` from universe.jsx).
   ============================================================ */
function FieldGuide({ dismissed, touch }) {
  return (
    <div className={"fieldHint fieldHint--v1 " + (dismissed ? "is-dismissed" : "")} aria-hidden="true">
      <div className="fieldHint__inner">
        <div className="fieldHint__ring"><span className="cross" /><span className="dot" /></div>
        <div className="fieldHint__lede"><span className="pip" />This field is live — move through it</div>
        <div className="fieldHint__cues">
          {touch ? (
            <>
              <span className="fieldHint__cue"><i>✛</i> <b>Tap</b> EXPLORE below</span>
              <span className="fieldHint__sep" />
              <span className="fieldHint__cue"><i>⧉</i> <b>Pinch</b> to fly</span>
              <span className="fieldHint__sep" />
              <span className="fieldHint__cue"><i>◎</i> <b>Tap</b> a node</span>
            </>
          ) : (
            <>
              <span className="fieldHint__cue"><i>✛</i> <b>Drag</b> to look</span>
              <span className="fieldHint__sep" />
              <span className="fieldHint__cue fieldHint__cue--key"><i>⤓</i> <b>Scroll</b> to fly through</span>
              <span className="fieldHint__sep" />
              <span className="fieldHint__cue"><i>◎</i> <b>Click</b> a node</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   EXPLORE OVERLAY — v11.1 mobile universe window.
   One tap = the screen cleans up and the field is yours: page scroll
   locks, title chrome fades, drag = look, pinch = fly, tap node = open.
   The SAME tap requests device-orientation permission (iOS shows its
   popup only inside a direct user gesture — the old two-step GYRO
   button broke that chain), so motion-look starts automatically where
   the hardware allows it. No control buttons — just the guide + EXIT.
   ============================================================ */
function ExploreOverlay({ onClose }) {
  const [gyro, setGyro] = useL(false);

  useE(() => {
    document.body.classList.add("mo-explore");
    if (window.__mo_universe) window.__mo_universe.setExplore(true);
    const prevOv = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.classList.remove("mo-explore");
      if (window.__mo_universe) {
        window.__mo_universe.setExplore(false);
        window.__mo_universe.setGyro(false);
      }
      document.documentElement.style.overflow = prevOv;
    };
  }, []);

  // called by TitleScreen synchronously inside the EXPLORE tap — see below
  useE(() => {
    const onGranted = () => setGyro(true);
    window.addEventListener("mo:gyroOn", onGranted);
    return () => window.removeEventListener("mo:gyroOn", onGranted);
  }, []);

  return (
    <div className="xpl" data-screen-label="01b Explore mode">
      <div className="xpl__top">
        <span className="xpl__tag"><span className="xpl__dot" />FIELD · LIVE</span>
        <button type="button" className="xpl__close" onClick={onClose}>EXIT ✕</button>
      </div>
      <div className="xpl__hint">
        {gyro ? "move your phone — look · pinch — fly · tap a node" : "drag — look · pinch — fly · tap a node"}
      </div>
    </div>
  );
}

/* Requests gyro permission INSIDE the tap gesture, then enables it.
   Resolves silently to drag-look if denied/unsupported. */
function requestGyroInGesture() {
  try {
    const enable = () => {
      if (window.__mo_universe) window.__mo_universe.setGyro(true);
      try { window.dispatchEvent(new CustomEvent("mo:gyroOn")); } catch (_) {}
    };
    if (window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === "function") {
      DeviceOrientationEvent.requestPermission()
        .then((res) => { if (res === "granted") enable(); })
        .catch(() => {});
    } else if (window.DeviceOrientationEvent) {
      enable();
    }
  } catch (_) {}
}

function TitleScreen({ onEnter, activeProject }) {
  const ref = useInView(onEnter);
  const compact = useCompact(700);
  const showExplore = compact || IS_TOUCH;
  const [explore, setExplore] = useL(false);

  // The guide stays up until the visitor genuinely engages the universe.
  // Persist per-session so scrolling back to the title doesn't nag a visitor
  // who's already learned the controls.
  const [touched, setTouched] = useL(() => sessionStorage.getItem("mo_field_touched") === "1");
  useE(() => {
    if (touched) return;
    const onInteract = () => {
      setTouched(true);
      sessionStorage.setItem("mo_field_touched", "1");
    };
    window.addEventListener("mo:universeInteract", onInteract);
    return () => window.removeEventListener("mo:universeInteract", onInteract);
  }, [touched]);

  const proceed = () => {
    const el = document.getElementById("intro");
    if (el) window.scrollTo({ top: el.offsetTop + 2, behavior: "smooth" });
  };

  return (
    <section ref={ref} className={"lp-title lp-title--v1 " + (touched ? "is-touched" : "")} id="title" data-screen-label="01 Title">
      {/* v13 — the stage is FIXED: the title never scrolls away like a page.
          It dissolves IN PLACE (ascii scatter + staggered lift, flight.css
          consumes the --flt-* vars flight.js writes) while the camera surges
          forward into the field — the first gesture is already a flight. */}
      <div className="title__stage">
      {/* ===== POINTER SHIELDS — perimeter strips that absorb mouse events,
              so the universe is only mouse-reachable INSIDE the framed area ===== */}
      <div className="title__shield title__shield--top" />
      <div className="title__shield title__shield--bot" />
      <div className="title__shield title__shield--left" />
      <div className="title__shield title__shield--right" />

      {/* ===== FRAME — four corner reticles (clean, Variant 1) ===== */}
      <div className="title__frame" aria-hidden="true">
        <span className="title__corner title__corner--tl" />
        <span className="title__corner title__corner--tr" />
        <span className="title__corner title__corner--bl" />
        <span className="title__corner title__corner--br" />
      </div>

      {/* ===== IDENTITY STAMP — top-left (name + role) ===== */}
      <div className="title__idTop">
        <span className="title__idName"><span className="title__idBullet">■</span>MASLOV / OLEKSANDR</span>
        <span className="title__idRole">EMBEDDED · FIRMWARE · HARDWARE</span>
      </div>

      {/* ===== FIELD GUIDE — center coachmark; fades on first interaction ===== */}
      <FieldGuide dismissed={touched} touch={showExplore} />

      {/* ===== EXPLORE — v11 mobile universe window ===== */}
      {explore && <ExploreOverlay onClose={() => setExplore(false)} />}

      {/* ===== ASCII M.O. — bottom-left wordmark, original styling ===== */}
      <div className="title__wordmark">
        <AsciiHero text="M.O." cols={compact ? 64 : 108} rows={compact ? 16 : 20} />
        <span className="title__wordmarkSub">
          <span className="title__wordmarkSubBullet">■</span>
          KYIV → MUNICH
          <span className="title__wordmarkSubSep">·</span>
          2026
        </span>
      </div>

      {/* ===== CONTROL CLUSTER — bottom-right: Continue cue + PROCEED ===== */}
      <div className="title__ctl">
        <div className="title__proceedRow">
          {showExplore && (
            <KeyButton legend="✛" onPress={() => { requestGyroInGesture(); setExplore(true); }}>EXPLORE</KeyButton>
          )}
          <span className="scrollcue scrollcue--stack">
            <span className="scrollcue__txt">Continue</span>
            <span className="scrollcue__chev"><span /><span /></span>
          </span>
          <KeyButton legend="↵" primary onPress={proceed}>PROCEED</KeyButton>
        </div>
        <span className="title__proceedCap">{showExplore ? "tap · or swipe up to continue" : "press ↵ \u00a0·\u00a0 or scroll at the edges"}</span>
      </div>

      </div>

      <TitleKeyboardShortcut onProceed={proceed} />
    </section>
  );
}

function TitleKeyboardShortcut({ onProceed }) {
  useE(() => {
    const onKey = (e) => {
      if (e.key !== "Enter") return;
      if (e.target && /input|textarea|button/i.test(e.target.tagName || "")) return;
      if (window.scrollY > 80) return;        // only at top
      e.preventDefault();
      onProceed();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onProceed]);
  return null;
}

/* ============================================================
   WORK — selected projects
   Each row corresponds to a tile in the Universe (matched by addr).
   Hovering a row focuses the universe tile + opens the right-side panel.
   ============================================================ */
const WORKS = [
  {
    addr: "0x01",
    file: "Wafer v2.html",
    name: "Wafer",
    sub:  "36-key ultrathin split keyboard",
    body: "Aluminium case, 4–8 mm build height, magnetic mechanism. Custom KiCad PCB on ISP1807 (nRF52840) with NPM1300 PMIC and Sharp memory display. I wrote a register-based I2C driver for the PMIC and merged direct battery-voltage readout into a ZMK fork.",
    role: "Designer · firmware · hardware",
    year: "2025",
    stack: "ZMK · Zephyr · KiCad · Devicetree",
    metric: ["18 / side", "keys"],
  },
  {
    addr: "0x02",
    file: "Kerfur.html",
    name: "Kerfur",
    sub:  "Embedded pet on nRF52840",
    body: "Event-driven firmware in 10,000+ lines of C on Nordic Connect SDK, structured around a central message-queue event bus. Behaviour engine with pet modes, IMU motion stack, OLED face rendered through LVGL, BLE peripheral with iOS ANCS + Android ANS, and Kerfur-to-Kerfur peer beacons with rotating ephemeral IDs.",
    role: "Solo · firmware · architecture",
    year: "2025 —",
    stack: "C · Zephyr · LVGL · BLE · IMU",
    metric: ["10k+", "lines of C"],
  },
  {
    addr: "0x03",
    file: "ZMK-PointAccel.html",
    name: "ZMK Pointing Acceleration",
    sub:  "Open-source input processor",
    body: "A public ZMK input processor for smooth, configurable pointer acceleration on trackpads and pointing devices. Linear and exponential curves, velocity scaling, precise slow/fast movement. Plus a Streamlit configurator that emits ready-to-paste Devicetree snippets.",
    role: "Maintainer · open source",
    year: "2025",
    stack: "C · ZMK · Devicetree · Streamlit",
    metric: ["★ 25", "github"],
  },
  {
    addr: "0x04",
    file: "Tactical-Flashlight.html",
    name: "Tactical Flashlight",
    sub:  "For Energy for Ukraine",
    body: "Volunteer firmware in C for an ARM Cortex-M0 (PY32F002A). Two light modes with saved brightness, SOS, battery indication on addressable LEDs. Designed the schematic and prepared the prototype for production in China.",
    role: "Volunteer · firmware · schematic",
    year: "12/2025",
    stack: "C · ARM Cortex-M0 · KiCad",
    metric: ["PY32", "F002A"],
  },
];

/* ============================================================
   WORK — pieterkoopt-style pin scroll
   • Vertical scroll → horizontal pan
   • Rail item 0 = the "Selected work." title itself
   • Static LENS reticle pinned center-bottom; cards parade past
   • Parallax bg drifts slower than the rail
   • Snap-by-easing: each card dwells at the reticle center
   ============================================================ */
function Work({ onEnter, onHoverWork }) {
  const sectionRef = useR(null);
  const [progress, setProgress] = useL(0);             // 0..1 across rail
  const [focused,  setFocused]  = useL(null);          // hovered card addr

  const N      = WORKS.length;
  // Stops: 0 = title; 1..N = featured cards; N+1 = "SHOW ALL" passage.
  const STOPS  = N + 2;
  const PADS   = 0.6;                                  // dwell viewports at start/end
  const TOTAL_V = STOPS + PADS;                        // total scroll in vh

  /* ── in-view callback ────────────────────────────────── */
  useE(() => {
    const el = sectionRef.current;
    if (!el || !onEnter) return;
    const io = new IntersectionObserver(es => {
      for (const e of es) if (e.isIntersecting) onEnter();
    }, { rootMargin: "-30% 0px -30% 0px", threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, [onEnter]);

  /* ── scroll progress + snap-by-easing ────────────────── */
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
      // remap with pad zones
      const padN = (PADS / TOTAL_V);
      const p = Math.max(0, Math.min(1, (pRaw - padN) / (1 - 2*padN)));
      // SNAP-BY-EASING: bias toward nearest of (STOPS-1) intervals
      const intervals = STOPS - 1;        // between stops
      const local = p * intervals;
      const idx   = Math.floor(local);
      const frac  = local - idx;
      const eased = easeInOut(frac);
      const snapped = (idx + eased) / intervals;
      // v10: publish the eased stop position — the universe "reel" mode reads
      // this every frame to drive the in-field tile parade.
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

  /* Tell universe which addr to focus.
     activeIdx 0 = title (no card); 1..N = cards */
  const slot01    = 1 / (STOPS - 1);
  const activeStop = Math.round(progress * (STOPS - 1));
  const activeCardIdx = Math.max(0, activeStop - 1);
  const activeWork = activeStop === 0 ? null : WORKS[activeCardIdx];

  useE(() => {
    onHoverWork && onHoverWork(focused || activeWork?.addr || null);
  }, [focused, activeWork, onHoverWork]);

  /* v10: announce reel stop changes — the sound score tunes the active
     node's sideband and resolves it to zero-beat when a card locks. */
  useE(() => {
    try {
      window.dispatchEvent(new CustomEvent("mo:reelStop", {
        detail: { stop: activeStop, addr: activeWork ? activeWork.addr : null },
      }));
    } catch (_) {}
  }, [activeStop]);

  /* ── geometry ─────────────────────────────────────────
     Each card slot is 52vw, title slot is 56vw, lens is centered at 50vw.
     Show-all passage slot is 48vw.
     v11: RESPONSIVE. The CSS used to resize the slots at breakpoints while
     this math kept the desktop constants — the rail centred on slots that
     no longer existed and every card landed off-screen on phones. The JSX
     is now the single source of truth: slot widths are written as inline
     flex-basis from the same numbers the centring math uses, so the two
     can never diverge again. Lens stays centred at 50vw. */
  const compactReel = useCompact(700);
  const midReel     = useCompact(1100);
  const TITLE_SLOT_VW   = compactReel ? 100 : midReel ? 80 : 56;
  // v11.1 — phones get a visibly SMALLER carousel: a 70vw caption in a 78vw
  // slot means the neighbours peek at both edges, so the reel reads as a reel.
  const CARD_SLOT_VW    = compactReel ? 78  : midReel ? 70 : 52;
  const SHOWALL_SLOT_VW = compactReel ? 96  : midReel ? 70 : 52;
  // Title lands at viewport-left + gutter when its slot is centred:
  // slot left edge sits at (50 - TITLE/2)vw, so offset = gutter − that.
  const TITLE_GUTTER_PX = compactReel ? 20 : 56;
  const titleInnerLeft  = `calc(${TITLE_GUTTER_PX}px - ${(50 - TITLE_SLOT_VW / 2).toFixed(2)}vw)`;
  const slotCentersVW = (() => {
    const out = [TITLE_SLOT_VW / 2];                           // title center
    let cursor = TITLE_SLOT_VW;
    for (let i = 0; i < N; i++) {
      out.push(cursor + CARD_SLOT_VW / 2);
      cursor += CARD_SLOT_VW;
    }
    // SHOW-ALL passage stop
    out.push(cursor + SHOWALL_SLOT_VW / 2);
    return out;
  })();
  // active progress maps 0..1 over STOPS-1 stops; lerp between adjacent centers
  const pp = progress * (STOPS - 1);
  const idx0 = Math.max(0, Math.min(STOPS - 2, Math.floor(pp)));
  const tt   = pp - idx0;
  const centerVW = slotCentersVW[idx0] * (1 - tt) + slotCentersVW[idx0 + 1] * tt;
  const railShiftVW = 50 - centerVW;                            // shift so active center = 50vw
  const bgShiftVW   = railShiftVW * 0.35;                       // parallax

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
        {/* parallax background grid */}
        <div
          className="lp-workReel__bg"
          style={{ transform: `translateX(${bgShiftVW}vw)` }}
        />

        {/* rail — title + N cards, all bottom-aligned */}
        <div className="lp-workReel__rail" style={{ transform: `translateX(${railShiftVW}vw)` }}>
          {/* SLOT 0 — the title itself. Content is absolutely positioned inside
              the slot so it lands at the viewport's bottom-left when this slot
              is the active stop, but still pans with the rail on scroll. */}
          <div className="lp-workReel__slot lp-workReel__slot--title" style={{ flex: `0 0 ${TITLE_SLOT_VW}vw` }}>
            <div className="lp-workReel__titleInner" style={{ left: titleInnerLeft }}>
              <div className="lp-workReel__titleNum">02</div>
              <h2 className="lp-workReel__title">Selected work<em>.</em></h2>
              <div className="lp-workReel__titleSub">
                <span className="lp-workReel__titleSubDot" />
                <span>Scroll — the reel rolls past the lens.</span>
              </div>
            </div>
          </div>

          {/* SLOTS 1..N — cards */}
          {WORKS.map((w, i) => {
            const stopIdx = i + 1;
            const slotCenter = stopIdx / (STOPS - 1);
            const delta = progress - slotCenter;
            const absD  = Math.min(1, Math.abs(delta) * (STOPS - 1));
            const isLocked = activeStop === stopIdx && Math.abs(delta) < 0.5 / (STOPS - 1);
            return (
              <div className="lp-workReel__slot" key={w.addr} style={{ flex: `0 0 ${CARD_SLOT_VW}vw` }}>
                <WorkReelCard
                  work={w} i={i} total={N}
                  absD={absD}
                  locked={isLocked}
                  focused={focused === w.addr}
                  onFocus={setFocused}
                />
              </div>
            );
          })}

          {/* SLOT N+1 — SHOW ALL passage. A wide gateway plate instead of a card,
              hosting the primary KeyButton. Scrolling lands on this stop after
              the last featured card; clicking the key opens the universe overlay. */}
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
                    <div className="showAllGate__overline">04 / END · PASSAGE</div>
                    <h3 className="showAllGate__name">Open the universe<em>.</em></h3>
                    <div className="showAllGate__sub">
                      12 nodes — including the 8 still in progress. Drift, hover, fly through. ESC returns here.
                    </div>
                  </div>
                  <div className="showAllGate__key">
                    <KeyButton legend="A" primary onPress={() => {
                      // Reuse the project-card exit transition. `landing-exit`
                      // fades the universe + page shell out over ~380ms before
                      // navigation, matching what cards do when opening a
                      // project page. Zero extra load cost — pure CSS reuse.
                      document.body.classList.add("landing-exit");
                      setTimeout(() => { window.location.href = "All Projects.html"; }, 380);
                    }}>
                      SHOW ALL
                    </KeyButton>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* LENS VIGNETTE — fade edges so cards melt in/out */}
        <div className="lp-workReel__vignette" />

        {/* TOP-LEFT META — small footnote */}
        <div className="lp-workReel__meta">
          <div className="lp-workReel__metaRow">
            <span className="lp-workReel__metaK">REEL</span>
            <span className="lp-workReel__metaV">SELECTED WORK</span>
          </div>
          <div className="lp-workReel__metaRow">
            <span className="lp-workReel__metaK">SHOWING</span>
            <span className="lp-workReel__metaV">4 / 12</span>
          </div>
          <div className="lp-workReel__metaRow">
            <span className="lp-workReel__metaK">MODE</span>
            <span className="lp-workReel__metaV">SCROLL → PAN ↔</span>
          </div>
        </div>

        {/* TOP-RIGHT STOP INDEX */}
        <div className="lp-workReel__stops">
          <button
            type="button"
            className={"lp-workReel__stopBtn " + (activeStop === 0 ? "is-active" : "")}
            onClick={() => jumpToStop(0)}
          >
            <span className="lp-workReel__stopDot" />
            <span>00 · TITLE</span>
          </button>
          {WORKS.map((w, i) => (
            <button
              type="button"
              key={w.addr}
              className={"lp-workReel__stopBtn " + (activeStop === i + 1 ? "is-active" : "")}
              onClick={() => jumpToStop(i + 1)}
            >
              <span className="lp-workReel__stopDot" />
              <span>{(i + 1).toString().padStart(2, "0")} · {w.name.toUpperCase()}</span>
            </button>
          ))}
          <button
            type="button"
            className={"lp-workReel__stopBtn lp-workReel__stopBtn--showAll " + (activeStop === N + 1 ? "is-active" : "")}
            onClick={() => jumpToStop(N + 1)}
          >
            <span className="lp-workReel__stopDot" />
            <span>{(N + 1).toString().padStart(2, "0")} · ALL ↗</span>
          </button>
        </div>

        {/* PROGRESS RAIL — bottom edge */}
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

/* The reel card — bottom-aligned, framed by the lens */
function WorkReelCard({ work, i, total, absD, locked, focused, onFocus }) {
  const cardRef = useR(null);
  const navigate = () => {
    if (!work.file) return;
    // Wafer (node 0x01) gets the rotating-model handoff — same as the universe
    // field. Capture the card's on-screen rect so the model flies FROM the card.
    if (work.addr === "0x01") {
      const el = cardRef.current;
      const r = el ? el.getBoundingClientRect() : null;
      const originRect = r ? { x: r.left, y: r.top, w: r.width, h: r.height } : null;
      window.dispatchEvent(new CustomEvent("mo:waferFlight", { detail: { p: work, originRect, origin: "work" } }));
      return;
    }
    sessionStorage.setItem("mo_navigate_from_addr", work.addr);
    document.body.classList.add("landing-exit");
    setTimeout(() => { window.location.href = work.file; }, 380);
  };
  // Subtle focus pop when card is under the reticle
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
      data-screen-label={(i + 2).toString().padStart(2, "0") + " " + work.name}
      onMouseEnter={() => onFocus && onFocus(work.addr)}
      onMouseLeave={() => onFocus && onFocus(null)}
      onFocus={() => onFocus && onFocus(work.addr)}
      onBlur={() => onFocus && onFocus(null)}
      onClick={navigate}
      tabIndex={0}
      style={{
        transform: `scale(${popScale.toFixed(3)})`,
        opacity: popOp.toFixed(3),
      }}
    >
      {/* caption-bar face — signal spine · addr/idx · name · sub, OPEN at the right.
         Low, wide instrument caption so the universe field stays the hero. */}
      <span className="rcard__spine" aria-hidden="true" />
      <div className="rcard__body">
        <div className="rcard__top">
          <span className="rcard__topAddr">NODE {work.addr}</span>
          <span className="rcard__topSep" />
          <span className="rcard__topIdx">{(i + 1).toString().padStart(2, "0")} / {total.toString().padStart(2, "0")}</span>
        </div>
        <h3 className="rcard__name">{work.name}<em>.</em></h3>
        <div className="rcard__sub">{work.sub}</div>
      </div>
      <div className="rcard__open">
        <span>OPEN</span>
        <span className="rcard__arr">→</span>
      </div>
    </article>
  );
}

window.TitleScreen = TitleScreen;
window.Work        = Work;
window.WORKS       = WORKS;
