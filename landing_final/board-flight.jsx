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
  const artRef     = useBFR(null);
  const ctrlRef    = useBFR(null);
  const tRef       = useBFR(0);
  const footRef    = useBFR(0);
  const presRef    = useBFR(0);
  const nodeRef    = useBFR(1);   // 1 = whole-board "model" framing in the card → 0 = flight pose
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
  const LEAD_V   = 2.4;       // viewports of the About-node → board MORPH lead-in
  const FLIGHT_V = N + 1;     // viewports of flight
  const FOOT_V   = 1.4;       // viewports of footer beat
  const TOTAL_V  = LEAD_V + FLIGHT_V + FOOT_V;
  const LEAD_PORTION   = LEAD_V / TOTAL_V;
  const FLIGHT_PORTION = FLIGHT_V / TOTAL_V;
  const FOOT_PORTION   = FOOT_V / TOTAL_V;

  const [active, setActive] = useBF(0);
  const [prog, setProg]     = useBF(0);
  const [foot, setFoot]     = useBF(0);
  // lead-in UI state: c = card chrome presence, o = window-open progress
  const [leadUi, setLeadUi] = useBF({ c: 0, o: 0, e: 0 });

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
          const a = ctrl.update(tRef.current, "probe", dt, footRef.current, introRef.current, nodeRef.current);
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
      window.__mo_morph = null;
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

      // ── lead-in (About node-card → board grows OUT of the card) ──
      // The real board is windowed into the card's art rect (small, pulled-back
      // establishing shot), then the card frame OPENS: the clip-path expands
      // from the card rectangle to the full viewport while the chrome fades and
      // the board camera dollies into the flight start. The PCB literally morphs
      // out of the card — one object, no separate stand-in, no context seam.
      const lead = _bfClamp(raw / LEAD_PORTION, 0, 1);
      const cardP = _bfClamp(lead / 0.26, 0, 1);             // card resolves in the lens
      const openP = _bfClamp((lead - 0.28) / 0.60, 0, 1);    // card window opens → full board
      window.__mo_morph = null;                              // particle-trace morph retired

      // flight parameter — runs over FLIGHT_PORTION, AFTER the lead-in
      const padStart = 0.5 / FLIGHT_V;
      const fr = _bfClamp((raw - LEAD_PORTION) / FLIGHT_PORTION, 0, 1);
      const t = _bfClamp((fr - padStart) / (1 - padStart), 0, 1);
      tRef.current = t;

      // footer beat — last portion of the section
      const footerMix = _bfClamp((raw - LEAD_PORTION - FLIGHT_PORTION) / (FOOT_PORTION * 0.82), 0, 1);
      footRef.current = footerMix;

      // contact (footer) active → drives nav highlight. Published to a window
      // bridge so LandingApp's central section resolver can read it (and still
      // calls onContact if a parent passed one, for back-compat).
      const contactOn = footerMix > 0.5;
      window.__mo_bf = window.__mo_bf || {};
      window.__mo_bf.footer = contactOn;
      // v13 — flight bridge: the unified HUD reads the board leg state here.
      window.__mo_bf.lead = lead;
      window.__mo_bf.openP = openP;
      window.__mo_bf.t = t;
      window.__mo_bf.foot = footerMix;
      if (contactOn !== contactRef.current) { contactRef.current = contactOn; onContactRef.current && onContactRef.current(contactOn); }

      const layer = layerRef.current;
      const uni = uniRef.current;

      if (MODE === "takeover") {
        // ── The PCB morphs OUT of the card. The board canvas is windowed into
        //    the card's art rectangle (clip-path), small + pulled back; as the
        //    card OPENS (openP) the clip expands to the full viewport, the board
        //    camera dollies into the flight, and the card chrome fades. ──
        const oe  = _bfEaseInOut(openP);
        // At rest (window closed) the REAL board sits fully formed and framed as
        // a clean whole-board 3/4 "model" (nodeMix=1) inside the card's window.
        // As the window OPENS, the camera dollies out of that node framing into
        // the flight start (nodeMix 1→0) while the clip expands to fullscreen —
        // one board, one canvas, a true grow-out morph (no crossfade, no separate
        // mini-PCB). introMix stays 0 so the board is solid the whole time.
        introRef.current = 0;
        nodeRef.current = 1 - oe;
        presRef.current = cardP;         // render the board as soon as the card is up

        // The board renders fullscreen + TRANSPARENT (LITE path = no opaque
        // composer), so it floats over the node-card as a real 3D model. No
        // rectangular clip / window — it simply DOLLIES CLOSER (nodeMix) and
        // grows to fill the screen = the About scene. The solid void backdrop +
        // grain must stay OFF while it's the small floating model (so the card +
        // universe show behind it), then fade in only as it takes over.
        if (layer) {
          layer.style.opacity = _bfClamp(cardP * 1.4, 0, 1).toFixed(3);
          layer.style.clipPath = "none";
          layer.style.transform = "none";
          layer.style.pointerEvents = openP > 0.6 ? "auto" : "none";
          // void backdrop: 0 until the board is ~60% closed-in, then ramps to 1
          const voidMix = _bfClamp((openP - 0.55) / 0.35, 0, 1);
          layer.style.setProperty("--bf-void", voidMix.toFixed(3));
          const grain = layer.querySelector(".bf-grain");
          if (grain) grain.style.opacity = voidMix.toFixed(3);
        }
        // universe stays lit behind the floating card, fades as the board opens
        if (uni) {
          const uniFade = _bfEaseInOut(openP);
          uni.style.opacity = (1 - uniFade).toFixed(3);
          uni.style.transform = `scale(${(1 + 0.05 * oe).toFixed(4)})`;
        }
        // keep the universe ALIVE while the card floats; pause once board is full
        window.__mo_universe_pause = openP > 0.985;
        const engaged = openP > 0.5;
        if (engaged !== enteredRef.current) {
          enteredRef.current = engaged;
          if (engaged) onEnterRef.current && onEnterRef.current();
        }
        // card chrome: resolves in (cardP), then fades as the window opens
        const cVis = cardP * (1 - _bfClamp(openP / 0.55, 0, 1));
        setLeadUi((prev) => {
          const c = +cVis.toFixed(2), o = +openP.toFixed(2), e = +cardP.toFixed(2);
          return (prev.c === c && prev.o === o && prev.e === e) ? prev : { c, o, e };
        });
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
    const raw = LEAD_PORTION + fr * FLIGHT_PORTION;
    window.scrollTo({ top: el.offsetTop + raw * total, behavior: "smooth" });
  };

  const refShort = STOPS[active]?.ref.split(" · ")[0] || "—";
  const footE = _bfEaseOut(foot);
  // Board chrome (mark / HUD / rail / progress / chapters) must NOT show while
  // the board is still windowed inside the card — gate it on the window opening.
  const openGate = _bfClamp(((leadUi.o || 0) - 0.55) / 0.4, 0, 1);
  const chromeFade = ((1 - _bfClamp(foot * 1.4, 0, 1)) * openGate).toFixed(3);
  const railActive = openGate > 0.5 && foot <= 0.4;

  return (
    <section
      ref={secRef}
      className="bf"
      id="about"
      data-screen-label="04 About — trace the net"
      style={{ height: `calc(${TOTAL_V} * 100vh)` }}
    >
      {/* ── About NODE card — node 0x00, presented as one more node-card.
          The REAL board renders windowed into the card's art rect (small,
          pulled-back); as you scroll, the card frame OPENS and the PCB grows
          out of it to fill the screen. The art element is the window the
          board's clip-path tracks. ── */}
      <div className="aboutNode-layer" style={{ opacity: leadUi.c.toFixed(3) }} aria-hidden={leadUi.c < 0.02}>
        <div
          className="uNode"
          data-screen-label="04 About — node 0x00"
          style={{
            // v13 — DOCK: the node card resolves out of the transit (rises +
            // sharpens) instead of a flat fade — the arrival at station 0x00.
            transform: `scale(${(1 + (leadUi.o || 0) * 0.06).toFixed(3)}) translateY(${((1 - (leadUi.e || 0)) * 26).toFixed(1)}px)`,
            filter: (leadUi.e || 0) < 0.996 ? `blur(${((1 - (leadUi.e || 0)) * 9).toFixed(2)}px)` : "none",
          }}
        >
          {/* teal corner brackets — same as the universe tile cards */}
          <span className="uNode__cnr uNode__cnr--tl" aria-hidden="true" />
          <span className="uNode__cnr uNode__cnr--tr" aria-hidden="true" />
          <span className="uNode__cnr uNode__cnr--bl" aria-hidden="true" />
          <span className="uNode__cnr uNode__cnr--br" aria-hidden="true" />

          {/* compact mono header — mirrors makeTileTexture */}
          <div className="uNode__head">
            <div className="uNode__headL">
              <span className="uNode__id"><span className="uNode__sq" />NODE 0x00</span>
              <span className="uNode__year">ABOUT</span>
            </div>
            <div className="uNode__headR">
              <span>MASLOV / OLEKSANDR</span>
              <span>48.137° N · 11.575° E</span>
            </div>
          </div>

          {/* the model field — the live mini-PCB renders here (board canvas
              clipped to this rect); it grows OUT of the card as you scroll */}
          <div className="uNode__field" ref={artRef} aria-hidden="true" />

          {/* name block — bottom-left, like the tile cards */}
          <div className="uNode__foot">
            <h3 className="uNode__name">Source node<em>.</em></h3>
            <div className="uNode__sub">0x00 has no fixed coordinate. This board is one readable projection of how the source node was formed.</div>
            <div className="uNode__cue"><span className="uNode__cueLine" />KEEP SCROLLING — INSPECT THE SOURCE ↓</div>
          </div>
        </div>
      </div>

      <div className={"bf-layer bf-layer--" + MODE} ref={layerRef} style={{ opacity: 0 }}>
        {/* the board canvas */}
        <div className="bf-mount" ref={mountRef} />
        <div className="bf-grain" aria-hidden="true" />

        {/* section marker */}
        <div className="bf-mark" style={{ opacity: chromeFade }}>
          <span className="bf-mark__dot" />
          0x00 · INTERNAL ARCHITECTURE
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
                  opacity: (vis * (1 - _bfClamp(foot * 1.6, 0, 1)) * openGate).toFixed(3),
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
        <div
          className="bf-rail"
          style={{ opacity: chromeFade, pointerEvents: railActive ? "auto" : "none" }}
          aria-hidden={!railActive}
          inert={!railActive ? "" : undefined}
        >
          {STOPS.map((st, i) => (
            <button type="button" key={i} className={"bf-rail__stop " + (active === i ? "is-active" : "")} onClick={() => jump(i)}>
              <span className="bf-rail__dot" /><span>{st.chapter.n} · {st.ref.split(" · ")[0]}</span>
            </button>
          ))}
        </div>

        {/* progress hairline */}
        <div className="bf-prog" style={{ opacity: chromeFade }}>
          <div className="bf-prog__fill" style={{ width: (prog * 100).toFixed(2) + "%" }} />
        </div>

        {/* entry cue */}
        <div className="bf-cue" style={{ opacity: (openGate > 0.99 && prog < 0.05 && foot < 0.02 ? 1 : 0) }}>
          <span className="bf-cue__line" />KEEP SCROLLING — FOLLOW THE TRACE ↓
        </div>

        {/* ── FOOTER beat — resolves in-scene over the hero board shot ── */}
        <div
          className="bf-foot"
          style={{ opacity: footE.toFixed(3), pointerEvents: foot > 0.35 ? "auto" : "none" }}
          aria-hidden={foot < 0.1}
          inert={foot < 0.1 ? "" : undefined}
          data-screen-label="05 Contact"
        >
          <div className="bf-foot__scrim" aria-hidden="true" />
          <div className="bf-foot__inner" style={{ transform: `translateY(${((1 - footE) * 40).toFixed(1)}px)` }}>
            <div className="bf-foot__kicker"><span className="bf-foot__live" />SW1 · OUTPUT — OPEN CHANNEL</div>
            <div className="bf-foot__line">For products that cross hardware, software and interaction.</div>
            <a className="bf-foot__big t-link" href="mailto:oleksandrmaslov08@gmail.com">
              oleksandrmaslov08<wbr />@gmail.com
            </a>
            <div className="bf-foot__links">
              <a className="bf-foot__link" href="https://github.com/oleksandrmaslov">
                <span className="bf-foot__linkKey">GITHUB</span>
                <span className="bf-foot__linkVal">@oleksandrmaslov</span><span className="bf-foot__arr">↗</span>
              </a>
              <a className="bf-foot__link" href="https://t.me/maslov_oleksandr08">
                <span className="bf-foot__linkKey">TELEGRAM</span>
                <span className="bf-foot__linkVal">@maslov_oleksandr08</span><span className="bf-foot__arr">↗</span>
              </a>
            </div>
            <div className="bf-foot__meta">
              <span>© 2026 · MASLOV OLEKSANDR</span>
              <span>BUILT IN MUNICH</span>
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
