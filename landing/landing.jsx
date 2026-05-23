/* ============================================================
   M.O. SYSTEM — Landing page sections
   ============================================================ */

const { useState: useL, useEffect: useE, useRef: useR } = React;

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
   HERO — full-bleed Universe (bg) + overlay editorial
   ============================================================ */
/* ============================================================
   TITLE SCREEN — framed instrument viewport
   M.O. wordmark bottom-left, Proceed key bottom-right,
   corner reticles + anchor labels mark the universe's interactive frame.
   ============================================================ */
function TitleScreen({ onEnter, activeProject }) {
  const ref = useInView(onEnter);

  const proceed = () => {
    const el = document.getElementById("intro");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section ref={ref} className="lp-title" id="title" data-screen-label="01 Title">
      {/* ===== POINTER SHIELDS — perimeter strips that absorb mouse events,
              so the universe is only mouse-reachable INSIDE the framed area ===== */}
      <div className="title__shield title__shield--top" />
      <div className="title__shield title__shield--bot" />
      <div className="title__shield title__shield--left" />
      <div className="title__shield title__shield--right" />

      {/* ===== TOP RAIL — 3 col editorial ===== */}
      <div className="title__topRail">
        <div className="title__railL">
          <span className="rail__bullet">■</span>
          <span className="rail__k">PORTFOLIO</span>
          <span className="rail__sep">·</span>
          <span className="rail__v">UNIVERSE</span>
          <span className="rail__sep">·</span>
          <span className="rail__k">v0.2</span>
        </div>
        <div className="title__railC">
          MASLOV / OLEKSANDR — EMBEDDED · FIRMWARE · HARDWARE
        </div>
        <div className="title__railR">
          <span className="rail__k">SECTOR</span>
          <span className="rail__v">{activeProject ? activeProject.addr : "—"}</span>
          <span className="rail__sep">·</span>
          <span className="rail__k">RELEASE</span>
          <span className="rail__v">00</span>
        </div>
      </div>

      {/* ===== FRAME — just four corner reticles. No clutter. ===== */}
      <div className="title__frame" aria-hidden="true">
        <span className="title__corner title__corner--tl" />
        <span className="title__corner title__corner--tr" />
        <span className="title__corner title__corner--bl" />
        <span className="title__corner title__corner--br" />

        {/* tiny corner labels — only the two on the right ===== */}
        <span className="title__anchorLabel title__anchorLabel--tr">
          DRAG · WHEEL · CLICK
        </span>
        <span className="title__anchorLabel title__anchorLabel--br">
          <span className="title__liveDot" />LIVE · 12 NODES
        </span>
      </div>

      {/* ===== ASCII M.O. — bottom-left wordmark, exact original styling ===== */}
      <div className="title__wordmark">
        <AsciiHero text="M.O." cols={108} rows={20} />
        <span className="title__wordmarkSub">
          <span className="title__wordmarkSubBullet">■</span>
          MASLOV / OLEKSANDR
          <span className="title__wordmarkSubSep">·</span>
          KYIV → MUNICH
          <span className="title__wordmarkSubSep">·</span>
          2026
        </span>
      </div>

      {/* ===== PROCEED — bottom-right keycap ===== */}
      <div className="title__cta">
        <KeyButton legend="↵" primary onPress={proceed}>PROCEED</KeyButton>
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
   INTRO HERO — powerful editorial "who I am" screen
   ============================================================ */
function IntroHero({ onEnter }) {
  const ref = useInView(onEnter);
  return (
    <section ref={ref} className="lp-intro" id="intro" data-screen-label="02 Intro">
      {/* numbered rail down the left edge */}
      <div className="lp-intro__edge">
        <span className="lp-intro__edgeN">02</span>
        <span className="lp-intro__edgeR" />
        <span className="lp-intro__edgeK">WHO</span>
        <span className="lp-intro__edgeR" />
        <span className="lp-intro__edgeK">2026</span>
      </div>

      <div className="lp-intro__inner">
        <div className="lp-intro__overline">
          <span className="lp-intro__overlinePulse" />
          <span>MUNICH · ENTRY 02 / 04</span>
        </div>

        <h2 className="lp-intro__title">
          <span className="lp-intro__line">I build</span>
          <span className="lp-intro__line lp-intro__line--shift"><em>small,</em> careful</span>
          <span className="lp-intro__line">objects —</span>
          <span className="lp-intro__line lp-intro__line--ghost">and the firmware</span>
          <span className="lp-intro__line lp-intro__line--shift">that runs them<em>.</em></span>
        </h2>

        <div className="lp-intro__sig">
          <div className="lp-intro__sigBlock">
            <span className="lp-intro__sigK">SIGNED</span>
            <span className="lp-intro__sigV">Maslov Oleksandr</span>
            <span className="lp-intro__sigSub">eighteen · Kyiv → Munich · embedded</span>
          </div>
          <div className="lp-intro__sigBlock lp-intro__sigBlock--right">
            <span className="lp-intro__sigK">FIELD</span>
            <span className="lp-intro__sigV">Keyboards · Embedded pets · ARM firmware · Custom PCBs</span>
            <span className="lp-intro__sigSub">12 nodes drift in the universe above</span>
          </div>
        </div>

        <div className="lp-intro__meta">
          <div className="lp-intro__metaCol">
            <span className="lp-intro__metaK">▙ 01 · NOW</span>
            <span className="lp-intro__metaV">Wafer R3 · Kerfur · ZMK upstream</span>
          </div>
          <div className="lp-intro__metaCol">
            <span className="lp-intro__metaK">▙ 02 · OPEN TO</span>
            <span className="lp-intro__metaV">Ausbildung · junior embedded · DE / EN</span>
          </div>
          <div className="lp-intro__metaCol">
            <span className="lp-intro__metaK">▙ 03 · WRITE</span>
            <span className="lp-intro__metaV">oleksandrmaslov08@gmail.com</span>
          </div>
        </div>

        <div className="lp-intro__cont">
          <span className="lp-intro__contLine" />
          <span>03 · SELECTED WORK · 12 PROJECTS</span>
          <span className="lp-intro__contArrow">↓</span>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   WORK — selected projects
   Each row corresponds to a tile in the Universe (matched by addr).
   Hovering a row focuses the universe tile + opens the right-side panel.
   ============================================================ */
const WORKS = [
  {
    addr: "0x01",
    file: "Wafer.html",
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
  const STOPS  = N + 1;                                // title + N cards
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

  /* ── geometry ─────────────────────────────────────────
     Each card slot is 52vw, title slot is 56vw, lens is centered at 50vw.
     At progress=0 the title is centered; at progress=1 the last card is centered.
     We compute, in vw, the position of each slot's CENTER along the rail,
     then shift the rail so the active slot's center sits at 50vw. */
  const TITLE_SLOT_VW = 56;
  const CARD_SLOT_VW  = 52;
  const slotCentersVW = (() => {
    const out = [TITLE_SLOT_VW / 2];                           // title center
    let cursor = TITLE_SLOT_VW;
    for (let i = 0; i < N; i++) {
      out.push(cursor + CARD_SLOT_VW / 2);
      cursor += CARD_SLOT_VW;
    }
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
          <div className="lp-workReel__slot lp-workReel__slot--title">
            <div className="lp-workReel__titleInner">
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
              <div className="lp-workReel__slot" key={w.addr}>
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
        </div>

        {/* STATIC LENS — pinned center-bottom */}
        <div className="lp-workReel__lens">
          <span className="lp-workReel__lensCorner lp-workReel__lensCorner--tl" />
          <span className="lp-workReel__lensCorner lp-workReel__lensCorner--tr" />
          <span className="lp-workReel__lensCorner lp-workReel__lensCorner--bl" />
          <span className="lp-workReel__lensCorner lp-workReel__lensCorner--br" />
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
  const navigate = () => {
    if (!work.file) return;
    sessionStorage.setItem("mo_navigate_from_addr", work.addr);
    document.body.classList.add("landing-exit");
    setTimeout(() => { window.location.href = work.file; }, 380);
  };
  // Subtle focus pop when card is under the reticle
  const popScale = locked ? 1.025 : (1 - absD * 0.06);
  const popOp    = 1 - absD * 0.4;

  return (
    <article
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
      {/* inline chrome (absorbed datasheet) */}
      <div className="rcard__chrome">
        <span className="rcard__chromeDot" />
        <span className="rcard__chromeAddr">NODE {work.addr}</span>
        <span className="rcard__chromeSep" />
        <span className="rcard__chromeYear">{work.year}</span>
        <span className="rcard__chromeSpacer" />
        <span className="rcard__chromeIdx">{(i + 1).toString().padStart(2, "0")} / {total.toString().padStart(2, "0")}</span>
      </div>

      {/* art body */}
      <div className="rcard__art">
        <div className="rcard__artStripes" />
        <div className="rcard__corner rcard__corner--tl" />
        <div className="rcard__corner rcard__corner--tr" />
        <div className="rcard__corner rcard__corner--bl" />
        <div className="rcard__corner rcard__corner--br" />
        <div className="rcard__cross" />
      </div>

      {/* footer — title left, open right */}
      <div className="rcard__foot">
        <div className="rcard__footL">
          <h3 className="rcard__name">{work.name}<em>.</em></h3>
          <div className="rcard__sub">{work.sub}</div>
        </div>
        <div className="rcard__footR">
          <span>OPEN</span>
          <span className="rcard__arr">→</span>
        </div>
      </div>
    </article>
  );
}

function WorkDetailPanel({ work }) {
  return (
    <aside className={"workPanel " + (work ? "workPanel--open" : "")} aria-hidden={!work}>
      <div className="workPanel__chrome">
        <span className="workPanel__chromeDot" />
        <span>DATASHEET</span>
        <span className="workPanel__chromeSep" />
        <span>{work ? work.addr : "—"}</span>
      </div>

      <div className="workPanel__inner">
        <div className="workPanel__addr">node {work?.addr || "0x__"}</div>
        <h3 className="workPanel__name">{work?.name || ""}</h3>
        <div className="workPanel__sub">{work?.sub || ""}</div>

        <div className="workPanel__rule" />

        <p className="workPanel__body">{work?.body || ""}</p>

        <div className="workPanel__metric">
          <span className="workPanel__metricVal t-serif">{work?.metric?.[0] || "—"}</span>
          <span className="workPanel__metricKey">{work?.metric?.[1] || ""}</span>
        </div>

        <dl className="workPanel__spec">
          <div><dt>YEAR</dt>  <dd>{work?.year  || "—"}</dd></div>
          <div><dt>STACK</dt> <dd>{work?.stack || "—"}</dd></div>
          <div><dt>ROLE</dt>  <dd>{work?.role  || "—"}</dd></div>
        </dl>

        <div className="workPanel__cta">
          <span>OPEN CASE FILE</span>
          <span className="workPanel__arrow">→</span>
        </div>
      </div>

      <div className="workPanel__edge" aria-hidden="true">
        <span /><span /><span />
      </div>
    </aside>
  );
}

/* ============================================================
   ABOUT — narrative + cat card + 3D-tilted datasheet
   ============================================================ */
function CatCard() {
  const ref = useR(null);

  // light tilt-on-mouse-move (perspective parallax)
  useE(() => {
    const el = ref.current;
    if (!el) return;
    let raf;
    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width  / 2;
      const cy = r.top  + r.height / 2;
      const dx = (e.clientX - cx) / r.width;
      const dy = (e.clientY - cy) / r.height;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.setProperty("--rx", (-dy * 8).toFixed(2) + "deg");
        el.style.setProperty("--ry", ( dx * 10).toFixed(2) + "deg");
      });
    };
    const onLeave = () => {
      el.style.setProperty("--rx", "0deg");
      el.style.setProperty("--ry", "0deg");
    };
    window.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      window.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="catCard" ref={ref}>
      <div className="catCard__inner">
        <div className="catCard__chrome">
          <span className="catCard__chromeDot" />
          <span>SUBJECT · KERFUR_v0</span>
          <span className="catCard__chromeSep" />
          <span>JPEG · CAM</span>
        </div>
        <div className="catCard__photo">
          <img src="landing/kerfur-cat.jpg" alt="Kerfur — biological reference unit (a tongue-out tabby)" />
          <div className="catCard__phCorner catCard__phCorner--tl" />
          <div className="catCard__phCorner catCard__phCorner--tr" />
          <div className="catCard__phCorner catCard__phCorner--bl" />
          <div className="catCard__phCorner catCard__phCorner--br" />
          <div className="catCard__phCross" />
        </div>
        <div className="catCard__meta">
          <div className="catCard__metaRow">
            <span>FRAME</span><span>0001 / 0001</span>
          </div>
          <div className="catCard__metaRow">
            <span>SUBJECT</span><span>biological reference</span>
          </div>
          <div className="catCard__metaRow">
            <span>NOTE</span><span>the model for Kerfur · embedded pet</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   PORTRAIT HOLDER — reused by About chapter 02 (where)
   ============================================================ */
function PortraitHolder() {
  return (
    <div className="portrait">
      <div className="portrait__chrome">
        <span className="portrait__chromeDot" />
        <span>PORTRAIT · M.O.</span>
        <span className="portrait__chromeSep" />
        <span>JPEG · CAM</span>
      </div>
      <div className="portrait__photo">
        <div className="portrait__phStripes" />
        <div className="portrait__phCorner portrait__phCorner--tl" />
        <div className="portrait__phCorner portrait__phCorner--tr" />
        <div className="portrait__phCorner portrait__phCorner--bl" />
        <div className="portrait__phCorner portrait__phCorner--br" />
        <div className="portrait__phCross" />
        <div className="portrait__phNote">[ drop image · portrait · 4:5 ]</div>
      </div>
      <div className="portrait__meta">
        <div className="portrait__metaRow"><span>FRAME</span><span>0001 / 0001</span></div>
        <div className="portrait__metaRow"><span>SUBJECT</span><span>Maslov Oleksandr · 18</span></div>
        <div className="portrait__metaRow"><span>NOTE</span><span>Munich · 2026 · available</span></div>
      </div>
    </div>
  );
}

/* ============================================================
   ABOUT — vertical scroll · stacked chapter panes
   Each chapter is a full-width pane stacked top-to-bottom.
   Content preserved from the horizontal panorama version.
   ============================================================ */
function About({ onEnter }) {
  const ref = useInView(onEnter);
  return (
    <section ref={ref} className="lp-section lp-aboutStack" id="about" data-screen-label="06 About">
      <header className="lp-aboutStack__head">
        <div className="lp-aboutStack__num">03</div>
        <h2 className="lp-aboutStack__title">About<em>.</em></h2>
        <div className="lp-aboutStack__meta">
          <div>18 · MUNICH · 2026</div>
          <div>05 CHAPTERS · VERTICAL</div>
        </div>
      </header>

      {/* CHAPTER 01 · WHO — lede */}
      <article className="aboutCh aboutCh--lede">
        <div className="aboutCh__rail">
          <div className="aboutCh__idx">01 / 05</div>
          <div className="aboutCh__sign">
            <span className="aboutCh__signK">CHAPTER</span>
            <span className="aboutCh__signV">who</span>
          </div>
        </div>
        <div className="aboutCh__body aboutCh__body--lede">
          <p className="aboutLede">
            I'm <span className="aboutLede__name">Oleksandr Maslov<em>.</em></span>
          </p>
          <p className="aboutLede__body">
            Eighteen years old. Born in Kyiv, 21·07·2007. Now living and working
            in Munich. I design small electronic things from the schematic up.
          </p>
          <div className="aboutLede__sig">
            <span className="aboutLede__sigK">SIGNED</span>
            <span className="aboutLede__sigV t-serif">M.O.</span>
          </div>
        </div>
      </article>

      {/* CHAPTER 02 · WHERE — portrait + munich */}
      <article className="aboutCh aboutCh--portrait">
        <div className="aboutCh__rail">
          <div className="aboutCh__idx">02 / 05</div>
          <div className="aboutCh__sign">
            <span className="aboutCh__signK">CHAPTER</span>
            <span className="aboutCh__signV">where</span>
          </div>
        </div>
        <div className="aboutCh__body aboutCh__body--portrait">
          <PortraitHolder />
          <div className="aboutMunich">
            <div className="aboutMunich__row">
              <span className="aboutMunich__k">CITY</span>
              <span className="aboutMunich__v t-serif">München.</span>
            </div>
            <div className="aboutMunich__row">
              <span className="aboutMunich__k">COORD</span>
              <span className="aboutMunich__v">48.137° N · 11.575° E</span>
            </div>
            <div className="aboutMunich__row">
              <span className="aboutMunich__k">SINCE</span>
              <span className="aboutMunich__v">2022 · arrived from Kyiv</span>
            </div>
            <div className="aboutMunich__row">
              <span className="aboutMunich__k">VISA</span>
              <span className="aboutMunich__v">Aufenthaltsgestattung · valid</span>
            </div>
            <div className="aboutMunich__row">
              <span className="aboutMunich__k">LANG</span>
              <span className="aboutMunich__v">EN native · DE B2 · UA · RU</span>
            </div>
            <div className="aboutMunich__rule" />
            <p className="aboutMunich__body">
              I left Kyiv with a backpack and a half-finished keyboard in February
              2022. Munich gave me time, internet, and a desk. I learned German
              evenings, soldered nights, and shipped the rest.
            </p>
          </div>
        </div>
      </article>

      {/* CHAPTER 03 · HOW — manifesto */}
      <article className="aboutCh aboutCh--manifesto">
        <div className="aboutCh__rail">
          <div className="aboutCh__idx">03 / 05</div>
          <div className="aboutCh__sign">
            <span className="aboutCh__signK">CHAPTER</span>
            <span className="aboutCh__signV">how</span>
          </div>
        </div>
        <div className="aboutCh__body aboutCh__body--manifesto">
          <p className="aboutMan__k">
            I make <em>small electronic things</em> from scratch — schematic, board,
            firmware, case — and I write the documentation that goes with them.
          </p>
          <ul className="aboutMan__list">
            <li><span className="aboutMan__n">·</span> open over closed</li>
            <li><span className="aboutMan__n">·</span> primitives over frameworks</li>
            <li><span className="aboutMan__n">·</span> documentation as a first-class deliverable</li>
            <li><span className="aboutMan__n">·</span> ship the boring core; iterate the rest</li>
            <li><span className="aboutMan__n">·</span> if it can't be field-repaired, it isn't done</li>
          </ul>
          <p className="aboutMan__body">
            I started with keyboards because I wanted one that fit my hands.
            I stayed because building one teaches you everything: PCB layout,
            power, BLE, real-time firmware, tooling, code review, and patience.
          </p>
        </div>
      </article>

      {/* CHAPTER 04 · WHY — kerfur */}
      <article className="aboutCh aboutCh--kerfur">
        <div className="aboutCh__rail">
          <div className="aboutCh__idx">04 / 05</div>
          <div className="aboutCh__sign">
            <span className="aboutCh__signK">CHAPTER</span>
            <span className="aboutCh__signV">why</span>
          </div>
        </div>
        <div className="aboutCh__body aboutCh__body--kerfur">
          <div className="aboutKerfur__text">
            <div className="aboutKerfur__h">
              The biological reference unit<em>.</em>
            </div>
            <p>
              Kerfur (the embedded pet) is named after a tongue-out tabby who lives
              rent-free in my apartment. I wanted to make something that felt
              <em> alive</em> — not in a startup-deck sense, but in a small,
              particular, twitching-tail sense.
            </p>
            <p>
              The cat does not care about events, queues, or BLE. The cat cares
              about sunbeams and whether I close the fridge gently. The cat is
              the design brief.
            </p>
          </div>
          <CatCard />
        </div>
      </article>

      {/* CHAPTER 05 · NOW */}
      <article className="aboutCh aboutCh--now">
        <div className="aboutCh__rail">
          <div className="aboutCh__idx">05 / 05</div>
          <div className="aboutCh__sign">
            <span className="aboutCh__signK">CHAPTER</span>
            <span className="aboutCh__signV">now</span>
          </div>
        </div>
        <div className="aboutCh__body aboutCh__body--now">
          <div className="aboutNow__h">
            <span className="aboutNow__dot" />
            Currently building<em>.</em>
          </div>
          <div className="aboutNow__grid">
            <div className="aboutNow__row">
              <span className="aboutNow__k">MAY</span>
              <span className="aboutNow__v">Kerfur firmware · v0.4 · IMU calibration</span>
            </div>
            <div className="aboutNow__row">
              <span className="aboutNow__k">JUN</span>
              <span className="aboutNow__v">Wafer R3 · finishing aluminium case</span>
            </div>
            <div className="aboutNow__row">
              <span className="aboutNow__k">Q3</span>
              <span className="aboutNow__v">ZMK PointAccel · v0.4 release</span>
            </div>
            <div className="aboutNow__row">
              <span className="aboutNow__k">PARALLEL</span>
              <span className="aboutNow__v">Ausbildung applications · embedded / hardware</span>
            </div>
          </div>
          <div className="aboutNow__foot">
            <div className="aboutNow__footK">SEEKING</div>
            <div className="aboutNow__footV">
              Apprenticeship · embedded · firmware · Munich + 200 km
            </div>
          </div>
        </div>
      </article>
    </section>
  );
}


/* ============================================================
   CONTACT / FOOTER
   ============================================================ */
function FooterLanding({ onEnter }) {
  const ref = useInView(onEnter);
  return (
    <section ref={ref} className="lp-section lp-contact" id="contact" data-screen-label="07 Contact">
      <header className="lp-sectionHead">
        <div className="lp-sectionNum">04</div>
        <h2 className="lp-sectionTitle">Let's talk<em>.</em></h2>
        <div className="lp-sectionMeta">
          <div>RESPONSE · &lt; 24H</div>
        </div>
      </header>
      <div className="lp-contact__grid">
        <a className="lp-contact__big t-link" href="mailto:oleksandrmaslov08@gmail.com">
          oleksandrmaslov08<wbr />@gmail.com
        </a>
        <div className="lp-contact__links">
          <a className="lp-contact__link" href="https://github.com/oleksandrmaslov">
            <span className="lp-contact__linkKey">GITHUB</span>
            <span className="lp-contact__linkVal">@oleksandrmaslov</span>
            <span className="lp-contact__arr">↗</span>
          </a>
          <a className="lp-contact__link" href="tel:+491723416265">
            <span className="lp-contact__linkKey">PHONE</span>
            <span className="lp-contact__linkVal">+49 172 3416265</span>
            <span className="lp-contact__arr">↗</span>
          </a>
          <a className="lp-contact__link" href="#">
            <span className="lp-contact__linkKey">CV · PDF</span>
            <span className="lp-contact__linkVal">download · 2 pages</span>
            <span className="lp-contact__arr">↓</span>
          </a>
          <a className="lp-contact__link" href="Design System.html">
            <span className="lp-contact__linkKey">SYSTEM</span>
            <span className="lp-contact__linkVal">design foundation · v0.1</span>
            <span className="lp-contact__arr">→</span>
          </a>
        </div>
      </div>

      <footer className="lp-foot">
        <span>© 2026 · MASLOV OLEKSANDR · ALL RIGHTS RESERVED</span>
        <span>BUILT IN MUNICH · v0.1.0</span>
        <span>NO COOKIES · NO TRACKERS · STATIC HTML</span>
      </footer>
    </section>
  );
}

window.TitleScreen     = TitleScreen;
window.IntroHero       = IntroHero;
window.Work            = Work;
window.WorkDetailPanel = WorkDetailPanel;
window.About           = About;
window.FooterLanding   = FooterLanding;
window.WORKS           = WORKS;
