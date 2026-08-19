/* ============================================================
   M.O. SYSTEM — FINAL 5 · TITLE SCREEN
   The only title screen now (the v1 one lived in landing.jsx and was
   overwritten at load time; FINAL 3 deleted it). Its unused in-view
   observer is gone too — app.jsx owns section tracking.
   Layout:
   · frame corners align with the content column (header 34px gutter)
   · KYIV → MUNICH + press-↵ caption moved BELOW the bottom corners,
     sharing one baseline; hairline under the M.O. removed
   · M.O. wordmark + control cluster keep their scroll-dissolve
   ============================================================ */
const { useState: useT2, useEffect: useT2E, useRef: useT2R } = React;

function useCompactT2(bp = 700) {
  const [c, setC] = useT2(() => window.innerWidth <= bp);
  useT2E(() => {
    const on = () => setC(window.innerWidth <= bp);
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, [bp]);
  return c;
}
const IS_TOUCH_T2 = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(pointer: coarse)").matches;

function FieldGuideT2({ dismissed, touch }) {
  return (
    <div className={"fieldHint " + (dismissed ? "is-dismissed" : "")} aria-hidden="true">
      <div className="fieldHint__inner">
        <div className="fieldHint__ring"><span className="cross" /><span className="dot" /></div>
        <div className="fieldHint__lede">This field is live</div>
        <div className="fieldHint__cues">
          {touch ? (
            <>
              <span className="fieldHint__cue"><b>Tap</b> explore</span>
              <span className="fieldHint__sep" />
              <span className="fieldHint__cue"><b>Pinch</b> to fly</span>
              <span className="fieldHint__sep" />
              <span className="fieldHint__cue"><b>Tap</b> a node</span>
            </>
          ) : (
            <>
              <span className="fieldHint__cue"><b>Drag</b> to look</span>
              <span className="fieldHint__sep" />
              <span className="fieldHint__cue"><b>Scroll</b> to fly through</span>
              <span className="fieldHint__sep" />
              <span className="fieldHint__cue"><b>Click</b> a node</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ExploreOverlayT2({ onClose }) {
  const [gyro, setGyro] = useT2(false);
  useT2E(() => {
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
  useT2E(() => {
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

function requestGyroInGestureT2() {
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

function TitleScreenV2() {
  const compact = useCompactT2(700);
  const showExplore = compact || IS_TOUCH_T2;
  const [explore, setExplore] = useT2(false);
  const [touched, setTouched] = useT2(() => sessionStorage.getItem("mo_field_touched") === "1");
  useT2E(() => {
    if (touched) return;
    const onInteract = () => {
      setTouched(true);
      sessionStorage.setItem("mo_field_touched", "1");
    };
    window.addEventListener("mo:universeInteract", onInteract);
    return () => window.removeEventListener("mo:universeInteract", onInteract);
  }, [touched]);

  // Real readiness milestone for the origin-map handoff.
  useT2E(() => {
    try { window.dispatchEvent(new CustomEvent("mo:title-ready")); } catch (_) {}
  }, []);

  const proceed = () => {
    const el = document.getElementById("intro");
    if (el) window.scrollTo({ top: el.offsetTop + 2, behavior: "smooth" });
  };

  return (
    <section className={"lp-title lp-title--v1 lp-title--v2 " + (touched ? "is-touched" : "")} id="title" data-screen-label="01 Title">
      <h1 className="title__sr">Oleksandr Maslov — product systems, embedded systems and interaction</h1>
      <div className="title__stage">
      <div className="title__shield title__shield--top" />
      <div className="title__shield title__shield--bot" />
      <div className="title__shield title__shield--left" />
      <div className="title__shield title__shield--right" />

      <div className="title__frame" aria-hidden="true">
        <span className="title__corner title__corner--tl" />
        <span className="title__corner title__corner--tr" />
        <span className="title__corner title__corner--bl" />
        <span className="title__corner title__corner--br" />
      </div>

      <div className="title__idTop">
        <span className="title__idName"><span className="title__idBullet">■</span>MASLOV / OLEKSANDR</span>
        <span className="title__idRole">PRODUCT SYSTEMS · EMBEDDED · INTERACTION</span>
      </div>

      <FieldGuideT2 dismissed={touched} touch={showExplore} />
      {explore && <ExploreOverlayT2 onClose={() => setExplore(false)} />}

      {/* M.O. wordmark — bare ASCII, no sub-line, no hairline */}
      <div className="title__wordmark">
        <AsciiHero text="M.O." cols={compact ? 64 : 108} rows={compact ? 16 : 20} />
      </div>

      {/* control cluster — Continue cue + PROCEED, caption moved below */}
      <div className="title__ctl">
        <div className="title__proceedRow">
          {showExplore && (
            <KeyButton legend="✛" onPress={() => { requestGyroInGestureT2(); setExplore(true); }}>EXPLORE</KeyButton>
          )}
          <span className="scrollcue scrollcue--stack">
            <span className="scrollcue__txt">Continue</span>
            <span className="scrollcue__chev"><span /><span /></span>
          </span>
          <KeyButton legend="↵" primary onPress={proceed}>PROCEED</KeyButton>
        </div>
      </div>

      {/* BASELINE ROW — below the bottom corners, one shared baseline */}
      <div className="title__baseline" aria-hidden="false">
        <span className="title__wordmarkSub">
          <span className="title__wordmarkSubBullet">■</span>
          KYIV → MUNICH
          <span className="title__wordmarkSubSep">·</span>
          2026
        </span>
        <span className="title__proceedCap">{showExplore ? "tap · or swipe up to continue" : "press ↵ \u00a0·\u00a0 or scroll at the edges"}</span>
      </div>

      </div>

      <TitleKeyboardShortcutV2 onProceed={proceed} />
    </section>
  );
}

function TitleKeyboardShortcutV2({ onProceed }) {
  useT2E(() => {
    const onKey = (e) => {
      if (e.key !== "Enter") return;
      if (e.target && /input|textarea|button/i.test(e.target.tagName || "")) return;
      if (window.scrollY > 80) return;
      e.preventDefault();
      onProceed();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onProceed]);
  return null;
}

window.TitleScreen = TitleScreenV2;
