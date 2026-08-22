/* ============================================================
   M.O. SYSTEM — LANDING TITLE SCREEN
   The landing title screen. app.jsx owns section tracking, so this
   component does not install a second in-view observer.
   Layout:
   · frame corners align with the content column (header 34px gutter)
   · KYIV → MUNICH + press-↵ caption moved BELOW the bottom corners,
     sharing one baseline; hairline under the M.O. removed
   · M.O. wordmark + control cluster keep their scroll-dissolve
   ============================================================ */
const { useState: useT2, useEffect: useT2E, useRef: useT2R } = React;

function useCompactTitle(bp = 700) {
  const [c, setC] = useT2(() => window.innerWidth <= bp);
  useT2E(() => {
    const on = () => setC(window.innerWidth <= bp);
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, [bp]);
  return c;
}
const IS_TOUCH_T2 = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
let gyroRequestT2 = 0;

function FieldGuide({ dismissed, touch }) {
  return (
    <div className={"fieldHint " + (dismissed ? "is-dismissed" : "")} aria-hidden="true">
      <div className="fieldHint__inner">
        <div className="fieldHint__ring"><span className="cross" /><span className="dot" /></div>
        <div className="fieldHint__lede" data-mo-cursor-mirror data-mo-cursor-opacity=".fieldHint,.fieldHint__inner,.title__stage,.lp">This field is live</div>
        <div className="fieldHint__cues">
          {touch ? (
            <>
              <span className="fieldHint__cue" data-mo-cursor-mirror data-mo-cursor-opacity=".fieldHint,.fieldHint__inner,.title__stage,.lp"><b>Tap</b> explore</span>
              <span className="fieldHint__sep" />
              <span className="fieldHint__cue" data-mo-cursor-mirror data-mo-cursor-opacity=".fieldHint,.fieldHint__inner,.title__stage,.lp"><b>Pinch</b> to fly</span>
              <span className="fieldHint__sep" />
              <span className="fieldHint__cue" data-mo-cursor-mirror data-mo-cursor-opacity=".fieldHint,.fieldHint__inner,.title__stage,.lp"><b>Tap</b> a node</span>
            </>
          ) : (
            <>
              <span className="fieldHint__cue" data-mo-cursor-mirror data-mo-cursor-opacity=".fieldHint,.fieldHint__inner,.title__stage,.lp"><b>Drag</b> to look</span>
              <span className="fieldHint__sep" />
              <span className="fieldHint__cue" data-mo-cursor-mirror data-mo-cursor-opacity=".fieldHint,.fieldHint__inner,.title__stage,.lp"><b>Scroll</b> to fly through</span>
              <span className="fieldHint__sep" />
              <span className="fieldHint__cue" data-mo-cursor-mirror data-mo-cursor-opacity=".fieldHint,.fieldHint__inner,.title__stage,.lp"><b>Click</b> a node</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ExploreOverlay({ onClose }) {
  const [gyro, setGyro] = useT2(() => !!(
    window.__mo_universe
    && window.__mo_universe.isGyroActive
    && window.__mo_universe.isGyroActive()
  ));
  useT2E(() => {
    document.body.classList.add("mo-explore");
    if (window.__mo_universe) window.__mo_universe.setExplore(true);
    const prevOv = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      gyroRequestT2 += 1;
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
        {gyro
          ? "move phone — look · drag — adjust · pinch — fly · tap — open"
          : "drag — look · pinch — fly · tap — open"}
      </div>
    </div>
  );
}

function requestGyroPermission() {
  const requestId = ++gyroRequestT2;
  try {
    const enable = () => {
      if (requestId !== gyroRequestT2) return;
      if (window.__mo_universe) window.__mo_universe.setGyro(true);
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

function TitleScreen() {
  const compact = useCompactTitle(700);
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
    <section className={"lp-title " + (touched ? "is-touched" : "")} id="title" data-screen-label="01 Title">
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
        <span className="title__idName" data-mo-cursor-mirror data-mo-cursor-opacity=".title__idTop,.title__stage,.lp"><span className="title__idBullet">■</span>MASLOV / OLEKSANDR</span>
        <span className="title__idRole" data-mo-cursor-mirror data-mo-cursor-opacity=".title__idTop,.title__stage,.lp">PRODUCT SYSTEMS · EMBEDDED · INTERACTION</span>
      </div>

      <FieldGuide dismissed={touched} touch={showExplore} />
      {explore && <ExploreOverlay onClose={() => setExplore(false)} />}

      {/* M.O. wordmark — bare ASCII, no sub-line, no hairline */}
      <div className="title__wordmark">
        <AsciiHero text="M.O." cols={compact ? 64 : 108} rows={compact ? 16 : 20} />
      </div>

      {/* control cluster — Continue cue + PROCEED, caption moved below */}
      <div className="title__ctl">
        <div className="title__proceedRow">
          {showExplore && (
            <KeyButton
              legend={<span data-mo-cursor-mirror data-mo-cursor-opacity=".title__ctl,.title__stage,.lp">✛</span>}
              onPress={() => { requestGyroPermission(); setExplore(true); }}
            >
              <span data-mo-cursor-mirror data-mo-cursor-opacity=".title__ctl,.title__stage,.lp">EXPLORE</span>
            </KeyButton>
          )}
          <span className="scrollcue scrollcue--stack">
            <span className="scrollcue__txt" data-mo-cursor-mirror data-mo-cursor-opacity=".title__ctl,.title__stage,.lp">Continue</span>
            <span className="scrollcue__chev"><span /><span /></span>
          </span>
          <KeyButton
            legend={<span data-mo-cursor-mirror data-mo-cursor-opacity=".title__ctl,.title__stage,.lp">↵</span>}
            primary
            onPress={proceed}
          >
            <span data-mo-cursor-mirror data-mo-cursor-opacity=".title__ctl,.title__stage,.lp">PROCEED</span>
          </KeyButton>
        </div>
      </div>

      {/* BASELINE ROW — below the bottom corners, one shared baseline */}
      <div className="title__baseline" aria-hidden="false">
        <span className="title__wordmarkSub">
          <span className="title__wordmarkSubBullet" data-mo-cursor-mirror data-mo-cursor-opacity=".title__wordmarkSub,.title__baseline,.title__stage,.lp">■</span>
          <span data-mo-cursor-mirror data-mo-cursor-opacity=".title__wordmarkSub,.title__baseline,.title__stage,.lp">KYIV → MUNICH</span>
          <span className="title__wordmarkSubSep" data-mo-cursor-mirror data-mo-cursor-opacity=".title__wordmarkSub,.title__baseline,.title__stage,.lp">·</span>
          <span data-mo-cursor-mirror data-mo-cursor-opacity=".title__wordmarkSub,.title__baseline,.title__stage,.lp">2026</span>
        </span>
        <span className="title__proceedCap" data-mo-cursor-mirror data-mo-cursor-opacity=".title__baseline,.title__stage,.lp">{showExplore ? "tap · or swipe up to continue" : "press ↵ \u00a0·\u00a0 or scroll at the edges"}</span>
      </div>

      </div>

      <TitleKeyboardShortcut onProceed={proceed} />
    </section>
  );
}

function TitleKeyboardShortcut({ onProceed }) {
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

window.TitleScreen = TitleScreen;
