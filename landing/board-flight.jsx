/* ============================================================
   M.O. SYSTEM — Landing · inline Board flight (the "About")
   ------------------------------------------------------------
   The PCB board flight, folded into the landing as a scroll
   section in a FIXED full-viewport layer (no sliding panel edge).

   TAKEOVER timing (the chosen concept), split in two:
     · the board's APPEAR/punch is SCROLL-DRIVEN and fast — you
       drive the takeover by scrolling.
     · the previous UI (the universe) DISAPPEARS on a quick TIMED
       fade the instant the board engages — not scroll-driven, so
       it clears decisively instead of lingering through the board.

   FOOTER beat: after the last stop the camera pulls back to a hero
   framing of the whole board (scene.update's 4th arg `footerMix`)
   and the contact/footer resolves IN the scene and persists — so
   there's no separate footer section and no second seam.

   Other modes ("crossfade","wipe") remain for the comparison files.
   Perf: board builds lazily on approach; LITE render; universe
   pauses once hidden. Camera = PROBE.
   ============================================================ */
const { useState: useBF, useEffect: useBFE, useRef: useBFR } = React;

const _bfEaseInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const _bfEaseOut   = (t) => 1 - Math.pow(1 - t, 3);
const _bfClamp     = (v, a, b) => Math.max(a, Math.min(b, v));

function BoardFlight({ onEnter, onContact }) {
  const secRef     = useBFR(null);
  const layerRef   = useBFR(null);
  const mountRef   = useBFR(null);
  const ctrlRef    = useBFR(null);
  const tRef       = useBFR(0);
  const footRef    = useBFR(0);
  const presRef    = useBFR(0);
  const uniRef     = useBFR(null);
  const enteredRef = useBFR(false);
  const contactRef = useBFR(false);
  const onEnterRef = useBFR(onEnter);
  const onContactRef = useBFR(onContact);
  useBFE(() => { onEnterRef.current = onEnter; onContactRef.current = onContact; });

  // takeover is SCROLL-DRIVEN (deterministic function of scroll position) so it
  // always replays when you scroll back up and down. introRef (1→0) is passed to
  // the scene to drive the establishing camera swoop in lock-step.
  const introRef = useBFR(1);

  const MODE = (typeof window !== "undefined" && window.__mo_bf_transition) || "takeover";

  const STOPS = (window.MOBoard && window.MOBoard.STOPS) || [];
  const N = STOPS.length;
  const FLIGHT_V = N + 1;     // viewports of flight
  const FOOT_V   = 1.4;       // viewports of footer beat
  const TOTAL_V  = FLIGHT_V + FOOT_V;
  const FLIGHT_PORTION = FLIGHT_V / TOTAL_V;

  const [active, setActive] = useBF(0);
  const [prog, setProg]     = useBF(0);
  const [foot, setFoot]     = useBF(0);

  /* ── build the board scene lazily, only when you scroll near it ── */
  useBFE(() => {
    const mount = mountRef.current;
    if (!mount) return;
    let raf, last = performance.now(), disposed = false, started = false;
    uniRef.current = document.querySelector(".universeBg");
    if (uniRef.current) uniRef.current.style.transition = "none";

    const boot = () => {
      if (disposed) return;
      const ctrl = window.MOBoard.build(mount, { lite: true });
      if (!ctrl) return;
      ctrlRef.current = ctrl;
      const loop = (now) => {
        if (disposed) return;
        const dt = Math.min(50, now - last); last = now;
        if (presRef.current > 0.004) {
          const a = ctrl.update(tRef.current, "probe", dt, footRef.current, introRef.current);
          ctrl.render();
          if (a !== undefined) setActive((prev) => (prev === a ? prev : a));
        }
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    };

    const tryBoot = () => {
      if (disposed || started) return;
      const el = secRef.current;
      const near = el && el.getBoundingClientRect().top < window.innerHeight * 1.5;
      if (near && window.THREE && window.MOBoard) { started = true; boot(); return; }
      raf = requestAnimationFrame(tryBoot);
    };
    raf = requestAnimationFrame(tryBoot);

    const onResize = () => { const c = ctrlRef.current; if (c) c.setSize(mount.clientWidth, mount.clientHeight); };
    window.addEventListener("resize", onResize);
    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.__mo_universe_pause = false;
      if (uniRef.current) { uniRef.current.style.opacity = ""; uniRef.current.style.transition = ""; uniRef.current.style.transform = ""; }
      const c = ctrlRef.current;
      if (c) c.dispose();
    };
  }, []);

  /* ── scroll → flight t + footer beat + transition styling ── */
  useBFE(() => {
    const el = secRef.current;
    if (!el) return;
    let raf;
    const ENTRY_VH = MODE === "takeover" ? 0.36 : MODE === "wipe" ? 0.58 : 0.7;

    const update = () => {
      const vh = window.innerHeight;
      const rect = el.getBoundingClientRect();
      const total = el.offsetHeight - vh;
      const top = -rect.top;
      const raw = total > 0 ? _bfClamp(top / total, 0, 1) : 0;

      // flight parameter — runs over the first FLIGHT_PORTION of the section
      const padStart = 0.5 / FLIGHT_V;
      const fr = _bfClamp(raw / FLIGHT_PORTION, 0, 1);
      const t = _bfClamp((fr - padStart) / (1 - padStart), 0, 1);
      tRef.current = t;

      // footer beat — last portion of the section
      const footerMix = _bfClamp((raw - FLIGHT_PORTION) / ((1 - FLIGHT_PORTION) * 0.82), 0, 1);
      footRef.current = footerMix;

      // contact (footer) active → drives nav highlight. Published to a window
      // bridge so LandingApp's central section resolver can read it (and still
      // calls onContact if a parent passed one, for back-compat).
      const contactOn = footerMix > 0.5;
      window.__mo_bf = window.__mo_bf || {};
      window.__mo_bf.footer = contactOn;
      if (contactOn !== contactRef.current) { contactRef.current = contactOn; onContactRef.current && onContactRef.current(contactOn); }

      const layer = layerRef.current;
      const uni = uniRef.current;

      if (MODE === "takeover") {
        // ── SCROLL-DRIVEN takeover: tk is a pure function of scroll position,
        //    so it always replays (scroll up → recedes, scroll down → punches in).
        //    Window: section top rising through the lower 0.42vh of the viewport. ──
        const ENTRY = 0.42;
        const tk = _bfClamp((vh - rect.top) / (ENTRY * vh), 0, 1);   // 0 at rect.top=vh → 1 at rect.top=(1-ENTRY)vh
        const es = _bfEaseOut(tk);
        const esS = _bfEaseInOut(tk);
        introRef.current = 1 - tk;                                   // camera establishing swoop, in lock-step
        presRef.current = tk;
        if (layer) {
          layer.style.opacity = es.toFixed(3);
          layer.style.transform = `scale(${(1.12 - 0.12 * esS).toFixed(4)})`;
          layer.style.clipPath = "";
          layer.style.pointerEvents = tk > 0.5 ? "auto" : "none";
        }
        if (uni) {
          uni.style.opacity = (1 - es).toFixed(3);
          uni.style.transform = `scale(${(1 + 0.10 * esS).toFixed(4)})`;
        }
        window.__mo_universe_pause = tk > 0.92;
        // section state
        const engaged = tk > 0.5;
        if (engaged !== enteredRef.current) {
          enteredRef.current = engaged;
          if (engaged) onEnterRef.current && onEnterRef.current();
        }
      } else {
        // ── scroll-driven crossfade / wipe (comparison files) ──
        const entry = rect.top > 0 ? _bfClamp((vh - rect.top) / (ENTRY_VH * vh), 0, 1) : 1;
        const exit  = rect.bottom < vh ? _bfClamp(rect.bottom / (0.6 * vh), 0, 1) : 1;
        const presence = Math.min(entry, exit);
        presRef.current = presence;
        if (presence > 0.45 && !enteredRef.current) { enteredRef.current = true; onEnterRef.current && onEnterRef.current(); }
        else if (presence < 0.1 && enteredRef.current) { enteredRef.current = false; }
        if (layer) {
          if (MODE === "wipe") {
            const r = (_bfEaseInOut(entry) * 152).toFixed(1);
            layer.style.opacity = exit.toFixed(3);
            layer.style.clipPath = `circle(${r}% at 50% 45%)`;
            layer.style.transform = "";
            if (uni) { uni.style.opacity = (1 - entry).toFixed(3); uni.style.transform = ""; }
            window.__mo_universe_pause = entry > 0.92;
          } else { // crossfade
            layer.style.opacity = presence.toFixed(3);
            layer.style.transform = "";
            layer.style.clipPath = "";
            if (uni) { uni.style.opacity = (1 - presence).toFixed(3); uni.style.transform = ""; }
            window.__mo_universe_pause = presence > 0.92;
          }
          layer.style.pointerEvents = presence > 0.5 ? "auto" : "none";
        }
      }

      setProg(t);
      setFoot(footerMix);
    };
    const onScroll = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [MODE, FLIGHT_PORTION, FLIGHT_V]);

  /* ── jump to a stop ── */
  const jump = (i) => {
    const el = secRef.current; if (!el) return;
    const vh = window.innerHeight;
    const total = el.offsetHeight - vh;
    const padStart = 0.5 / FLIGHT_V;
    const tt = STOPS[i].p / 10;
    const fr = padStart + tt * (1 - padStart);
    const raw = fr * FLIGHT_PORTION;
    window.scrollTo({ top: el.offsetTop + raw * total, behavior: "smooth" });
  };

  const refShort = STOPS[active]?.ref.split(" · ")[0] || "—";
  const footE = _bfEaseOut(foot);
  const chromeFade = (1 - _bfClamp(foot * 1.4, 0, 1)).toFixed(3);

  return (
    <section
      ref={secRef}
      className="bf"
      id="about"
      data-screen-label="04 About — trace the net"
      style={{ height: `calc(${TOTAL_V} * 100vh)` }}
    >
      <div className={"bf-layer bf-layer--" + MODE} ref={layerRef} style={{ opacity: 0 }}>
        {/* the board canvas */}
        <div className="bf-mount" ref={mountRef} />
        <div className="bf-grain" aria-hidden="true" />

        {/* section marker */}
        <div className="bf-mark" style={{ opacity: chromeFade }}>
          <span className="bf-mark__dot" />
          ABOUT · TRACE THE NET
        </div>

        {/* chapter overlays (fade out as the footer beat takes over) */}
        <div className="bf-stage" aria-hidden="false">
          {STOPS.map((st, i) => {
            const center = st.p / 10;
            const d = Math.abs(prog - center) * N;
            const vis = Math.max(0, 1 - d * 1.6);
            const isOn = d < 0.45 && foot < 0.4;
            return (
              <article
                key={i}
                className={"bf-ch " + (isOn ? "is-on" : "")}
                style={{
                  opacity: (vis * (1 - _bfClamp(foot * 1.6, 0, 1))).toFixed(3),
                  transform: `translateY(${((prog - center) * N * 24).toFixed(1)}px)`,
                  pointerEvents: isOn ? "auto" : "none",
                }}
                data-screen-label={st.chapter.n + " " + st.chapter.kicker}
              >
                <div className="bf-ch__num">{st.chapter.n}</div>
                <div className="bf-ch__card">
                  <div className="bf-ch__kicker">
                    {st.live ? <span className="bf-ch__live" /> : <span className="bf-ch__dot" />}
                    {st.chapter.kicker}
                  </div>
                  <h2 className="bf-ch__title">
                    {st.chapter.title[0]}<em>{st.chapter.title[1]}</em>{st.chapter.title[2]}
                  </h2>
                  <p className="bf-ch__body">{st.chapter.body}</p>
                  <div className="bf-ch__ref">
                    <span className="bf-ch__refK">COMPONENT</span>
                    <span className="bf-ch__refV">{st.ref}</span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* probe HUD */}
        <div className="bf-hud" style={{ opacity: chromeFade }}>
          <div className="bf-hudRow"><span>REF</span><span className="v">{refShort}</span></div>
          <div className="bf-hudRow"><span>STOP</span><span className="v">{(active + 1).toString().padStart(2, "0")} / {N.toString().padStart(2, "0")}</span></div>
          <div className="bf-hudRow"><span>CAM</span><span className="v">{foot > 0.5 ? "HERO" : "PROBE"}</span></div>
        </div>

        {/* waypoint rail */}
        <div className="bf-rail" style={{ opacity: chromeFade, pointerEvents: foot > 0.4 ? "none" : "auto" }}>
          {STOPS.map((st, i) => (
            <button key={i} className={"bf-rail__stop " + (active === i ? "is-active" : "")} onClick={() => jump(i)}>
              <span className="bf-rail__dot" /><span>{st.chapter.n} · {st.ref.split(" · ")[0]}</span>
            </button>
          ))}
        </div>

        {/* progress hairline */}
        <div className="bf-prog" style={{ opacity: chromeFade }}>
          <div className="bf-prog__fill" style={{ width: (prog * 100).toFixed(2) + "%" }} />
        </div>

        {/* entry cue */}
        <div className="bf-cue" style={{ opacity: (prog < 0.05 && foot < 0.02 ? 1 : 0) }}>
          <span className="bf-cue__line" />KEEP SCROLLING — TRACE THE NET ↓
        </div>

        {/* ── FOOTER beat — resolves in-scene over the hero board shot ── */}
        <div
          className="bf-foot"
          style={{ opacity: footE.toFixed(3), pointerEvents: foot > 0.35 ? "auto" : "none" }}
          aria-hidden={foot < 0.1}
          data-screen-label="05 Contact"
        >
          <div className="bf-foot__scrim" aria-hidden="true" />
          <div className="bf-foot__inner" style={{ transform: `translateY(${((1 - footE) * 40).toFixed(1)}px)` }}>
            <div className="bf-foot__kicker"><span className="bf-foot__live" />SW1 · OUTPUT — OPEN CHANNEL</div>
            <a className="bf-foot__big t-link" href="mailto:oleksandrmaslov08@gmail.com">
              oleksandrmaslov08<wbr />@gmail.com
            </a>
            <div className="bf-foot__links">
              <a className="bf-foot__link" href="https://github.com/oleksandrmaslov">
                <span className="bf-foot__linkKey">GITHUB</span>
                <span className="bf-foot__linkVal">@oleksandrmaslov</span><span className="bf-foot__arr">↗</span>
              </a>
              <a className="bf-foot__link" href="tel:+491723416265">
                <span className="bf-foot__linkKey">PHONE</span>
                <span className="bf-foot__linkVal">+49 172 3416265</span><span className="bf-foot__arr">↗</span>
              </a>
              <a className="bf-foot__link" href="#">
                <span className="bf-foot__linkKey">CV · PDF</span>
                <span className="bf-foot__linkVal">download · 2 pages</span><span className="bf-foot__arr">↓</span>
              </a>
              <a className="bf-foot__link" href="Design System.html">
                <span className="bf-foot__linkKey">SYSTEM</span>
                <span className="bf-foot__linkVal">design foundation · v0.1</span><span className="bf-foot__arr">→</span>
              </a>
            </div>
            <div className="bf-foot__meta">
              <span>© 2026 · MASLOV OLEKSANDR</span>
              <span>BUILT IN MUNICH · v0.1.0</span>
              <span>NO COOKIES · NO TRACKERS · STATIC HTML</span>
            </div>
          </div>
        </div>
      </div>

      {/* scroll anchor for the CONTACT nav link (sits at the footer beat) */}
      <i id="contact" className="bf-anchor" aria-hidden="true" />
    </section>
  );
}

window.BoardFlight = BoardFlight;
