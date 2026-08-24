/* ============================================================
   M.O. SYSTEM — Landing · Board flight scene
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
const _bfRenderEps = 0.004;

function BoardFlight({ onEnter, onContact }) {
  const secRef     = useBFR(null);
  const layerRef   = useBFR(null);
  const mountRef   = useBFR(null);
  const ctrlRef    = useBFR(null);
  const readyRef   = useBFR(false);
  const tRef       = useBFR(0);
  const footRef    = useBFR(0);
  const presRef    = useBFR(0);
  const nodeRef    = useBFR(1);   // 1 = whole-board "model" framing in the card → 0 = flight pose
  const uniRef     = useBFR(null);
  const enteredRef = useBFR(false);
  const contactRef = useBFR(false);
  const wakeRenderRef = useBFR(null);
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

  /* ── build the board scene lazily, only when you scroll near it ── */
  useBFE(() => {
    const mount = mountRef.current;
    if (!mount) return;
    let bootRaf = 0, bootIdle = 0, renderRaf = 0, retryTimer = 0, cursorFx = null, last = performance.now();
    let disposed = false, started = false, near = false, bootObserver = null;
    let fallbackListening = false, attempts = 0;
    uniRef.current = document.querySelector(".universeBg");

    const boot = async () => {
      if (disposed) return;
      let ctrl = null;
      try {
        ctrl = await window.MOBoard.build(mount, { lite: true });
      } catch (error) {
        console.warn("[board] preflight failed", error);
      }
      if (!ctrl) {
        // Keep the Universe as a valid fallback and make one clean retry. A
        // permanent renderer failure must never fade into an empty Board layer.
        if (!disposed && attempts < 2) {
          started = false;
          retryTimer = window.setTimeout(() => {
            retryTimer = 0;
            if (!disposed) scheduleBoot();
          }, 900);
        }
        return;
      }
      if (disposed) { ctrl.dispose(); return; }
      ctrlRef.current = ctrl;
      const sharedCursor = window.MOCursorDistortion;
      const finePointer = !window.matchMedia || window.matchMedia("(pointer: fine)").matches;
      if (finePointer && sharedCursor && typeof sharedCursor.mountStandalone === "function") {
        cursorFx = sharedCursor.mountStandalone({
          THREE: window.THREE,
          selector: "[data-mo-board-cursor-mirror]",
          zIndex: 20,
          dprCap: 1,
          disabledClasses: ["landing-exit", "mo-explore", "nx-page"],
          disabledWhen: () => presRef.current <= _bfRenderEps,
          chainPrevious: true,
        });
      }
      const loop = (now) => {
        renderRaf = 0;
        if (disposed) return;
        if (presRef.current <= _bfRenderEps) return;
        const dt = Math.min(50, now - last); last = now;
        const a = ctrl.update(tRef.current, "probe", dt, footRef.current, introRef.current, nodeRef.current);
        ctrl.render();
        if (a !== undefined) setActive((prev) => (prev === a ? prev : a));
        renderRaf = requestAnimationFrame(loop);
      };
      const wakeRender = () => {
        if (disposed || renderRaf || presRef.current <= _bfRenderEps) return;
        // A sleeping board may have been off-screen for minutes. Reset the
        // clock so its first visible update cannot receive a giant delta.
        last = performance.now();
        renderRaf = requestAnimationFrame(loop);
      };
      wakeRenderRef.current = wakeRender;
      readyRef.current = true;
      window.dispatchEvent(new CustomEvent("mo:board-ready"));
      wakeRender();
    };

    const removeFallbackListeners = () => {
      if (!fallbackListening) return;
      fallbackListening = false;
      window.removeEventListener("scroll", fallbackProbe);
      window.removeEventListener("resize", fallbackProbe);
    };

    const stopBootWatch = () => {
      if (bootRaf) cancelAnimationFrame(bootRaf);
      bootRaf = 0;
      if (bootIdle && window.cancelIdleCallback) window.cancelIdleCallback(bootIdle);
      bootIdle = 0;
      if (bootObserver) bootObserver.disconnect();
      bootObserver = null;
      removeFallbackListeners();
    };

    const tryBoot = () => {
      bootRaf = 0;
      bootIdle = 0;
      if (disposed || started || !near) return;
      if (window.THREE && window.MOBoard) {
        started = true;
        attempts += 1;
        stopBootWatch();
        void boot();
        return;
      }
      bootRaf = requestAnimationFrame(tryBoot);
    };

    const scheduleBoot = () => {
      if (disposed || started || !near || bootRaf || bootIdle) return;
      if (window.requestIdleCallback) {
        // Start construction shortly before the section arrives, but yield to
        // the universe while the browser still has useful foreground work.
        bootIdle = window.requestIdleCallback(tryBoot, { timeout: 600 });
      } else {
        bootRaf = requestAnimationFrame(tryBoot);
      }
    };

    const setNear = (next) => {
      near = !!next;
      if (near) {
        scheduleBoot();
      } else {
        if (bootRaf) cancelAnimationFrame(bootRaf);
        bootRaf = 0;
        if (bootIdle && window.cancelIdleCallback) window.cancelIdleCallback(bootIdle);
        bootIdle = 0;
      }
    };

    function fallbackProbe() {
      if (disposed || started) return;
      const el = secRef.current;
      if (!el) { setNear(false); return; }
      const rect = el.getBoundingClientRect();
      setNear(rect.bottom > 0 && rect.top < window.innerHeight);
    }

    const section = secRef.current;
    const forcePreflight = window.location.hash === "#about" || window.location.hash === "#contact";
    if (section && window.IntersectionObserver) {
      bootObserver = new window.IntersectionObserver((entries) => {
        const entry = entries.find((candidate) => candidate.target === section);
        if (entry) setNear(entry.isIntersecting || forcePreflight);
      }, {
        root: null,
        rootMargin: `${Math.round(window.innerHeight * 4)}px 0px`,
        threshold: 0,
      });
      bootObserver.observe(section);
    } else if (section) {
      fallbackListening = true;
      window.addEventListener("scroll", fallbackProbe, { passive: true });
      window.addEventListener("resize", fallbackProbe, { passive: true });
      fallbackProbe();
    }
    if (forcePreflight) setNear(true);

    const onResize = () => {
      const c = ctrlRef.current;
      if (c) c.setSize(mount.clientWidth, mount.clientHeight);
      if (wakeRenderRef.current) wakeRenderRef.current();
    };
    window.addEventListener("resize", onResize);
    return () => {
      disposed = true;
      readyRef.current = false;
      stopBootWatch();
      if (retryTimer) clearTimeout(retryTimer);
      if (renderRaf) cancelAnimationFrame(renderRaf);
      wakeRenderRef.current = null;
      window.removeEventListener("resize", onResize);
      window.__mo_universe_pause = false;
      if (cursorFx) cursorFx.destroy();
      if (uniRef.current) { uniRef.current.style.opacity = ""; uniRef.current.style.transition = ""; uniRef.current.style.transform = ""; }
      const c = ctrlRef.current;
      if (c) c.dispose();
    };
  }, []);

  /* ── scroll → flight t + footer beat + transition styling ── */
  useBFE(() => {
    const el = secRef.current;
    if (!el) return;
    const layer = layerRef.current;
    const uni = uniRef.current || document.querySelector(".universeBg");
    const aboutLayer = el.querySelector(".aboutNode-layer");
    const aboutNode = el.querySelector(".uNode");
    const grain = layer && layer.querySelector(".bf-grain");
    const mark = layer && layer.querySelector(".bf-mark");
    const chapters = layer ? Array.from(layer.querySelectorAll(".bf-ch")) : [];
    const rail = layer && layer.querySelector(".bf-rail");
    const progress = layer && layer.querySelector(".bf-prog");
    const progressFill = layer && layer.querySelector(".bf-prog__fill");
    const cue = layer && layer.querySelector(".bf-cue");
    const footer = layer && layer.querySelector(".bf-foot");
    const footerInner = footer && footer.querySelector(".bf-foot__inner");
    let raf = 0, measureRaf = 0, dead = false;
    let trackTop = 0, trackHeight = 1, viewportH = window.innerHeight;
    const ENTRY_VH = MODE === "takeover" ? 0.36 : MODE === "wipe" ? 0.58 : 0.7;

    const update = () => {
      raf = 0;
      const vh = viewportH;
      const total = trackHeight - vh;
      const pageY = Number.isFinite(window.__mo_scrollY) ? window.__mo_scrollY : window.scrollY;
      const top = pageY - trackTop;
      const rectTop = -top;
      const rectBottom = rectTop + trackHeight;
      const raw = total > 0 ? _bfClamp(top / total, 0, 1) : 0;

      // ── lead-in (About node-card → board grows OUT of the card) ──
      // The real board begins as the card's small, pulled-back model, then the
      // card frame clears while the same camera dollies into the flight start:
      // one board, no separate stand-in and no WebGL context seam.
      const lead = _bfClamp(raw / LEAD_PORTION, 0, 1);
      const cardP = _bfClamp(lead / 0.26, 0, 1);             // card resolves in the lens
      const openP = _bfClamp((lead - 0.28) / 0.60, 0, 1);    // card window opens → full board
      // flight parameter — runs over FLIGHT_PORTION, AFTER the lead-in
      const padStart = 0.5 / FLIGHT_V;
      const fr = _bfClamp((raw - LEAD_PORTION) / FLIGHT_PORTION, 0, 1);
      const t = _bfClamp((fr - padStart) / (1 - padStart), 0, 1);
      tRef.current = t;

      // footer beat — last portion of the section
      const footerMix = _bfClamp((raw - LEAD_PORTION - FLIGHT_PORTION) / (FOOT_PORTION * 0.82), 0, 1);
      footRef.current = footerMix;
      const boardReady = readyRef.current;
      const visualOpenP = boardReady ? openP : 0;
      const visualCardP = boardReady ? cardP : 0;

      // contact (footer) active → drives nav highlight. Published to a window
      // bridge so LandingApp's central section resolver can read it (and still
      // calls onContact if a parent passed one, for back-compat).
      const contactOn = boardReady && footerMix > 0.5;
      window.__mo_bf = window.__mo_bf || {};
      window.__mo_bf.footer = contactOn;
      // Flight bridge: the unified HUD reads the board leg state here.
      window.__mo_bf.lead = lead;
      window.__mo_bf.openP = visualOpenP;
      window.__mo_bf.t = t;
      window.__mo_bf.foot = boardReady ? footerMix : 0;
      if (contactOn !== contactRef.current) { contactRef.current = contactOn; onContactRef.current && onContactRef.current(contactOn); }

      if (MODE === "takeover") {
        // ── The PCB morphs OUT of the card. The board canvas is windowed into
        //    the card's art rectangle (clip-path), small + pulled back; as the
        //    card OPENS (openP) the clip expands to the full viewport, the board
        //    camera dollies into the flight, and the card chrome fades. ──
        const oe  = _bfEaseInOut(visualOpenP);
        // At rest (window closed) the REAL board sits fully formed and framed as
        // a clean whole-board 3/4 "model" (nodeMix=1) inside the card's window.
        // As the window OPENS, the camera dollies out of that node framing into
        // the flight start (nodeMix 1→0) while the clip expands to fullscreen —
        // one board, one canvas, a true grow-out morph (no crossfade, no separate
        // mini-PCB). introMix stays 0 so the board is solid the whole time.
        introRef.current = 0;
        nodeRef.current = 1 - oe;
        presRef.current = visualCardP;   // render only after a controller is ready
        if (wakeRenderRef.current) wakeRenderRef.current();

        // The board renders fullscreen + TRANSPARENT (LITE path = no opaque
        // composer), so it floats over the node-card as a real 3D model. No
        // rectangular clip / window — it simply DOLLIES CLOSER (nodeMix) and
        // grows to fill the screen = the About scene. The solid void backdrop +
        // grain must stay OFF while it's the small floating model (so the card +
        // universe show behind it), then fade in only as it takes over.
        if (layer) {
          layer.style.opacity = _bfClamp(visualCardP * 1.4, 0, 1).toFixed(3);
          layer.style.clipPath = "none";
          layer.style.transform = "none";
          const layerActive = boardReady && visualOpenP > 0.6;
          layer.style.pointerEvents = layerActive ? "auto" : "none";
          layer.inert = !layerActive;
          layer.setAttribute("aria-hidden", layerActive ? "false" : "true");
          // void backdrop: 0 until the board is ~60% closed-in, then ramps to 1
          const voidMix = _bfClamp((visualOpenP - 0.55) / 0.35, 0, 1);
          layer.style.backgroundColor = `rgba(4, 6, 13, ${voidMix.toFixed(3)})`;
          if (grain) grain.style.opacity = voidMix.toFixed(3);
        }
        // universe stays lit behind the floating card, fades as the board opens
        if (uni) {
          uni.style.transition = boardReady && raw > 0 ? "none" : "";
          const uniFade = _bfEaseInOut(visualOpenP);
          uni.style.opacity = (1 - uniFade).toFixed(3);
          uni.style.transform = `scale(${(1 + 0.05 * oe).toFixed(4)})`;
        }
        // keep the universe ALIVE while the card floats; pause once board is full
        window.__mo_universe_pause = boardReady && visualOpenP > 0.92;
        const engaged = boardReady && visualOpenP > 0.5;
        if (engaged !== enteredRef.current) {
          enteredRef.current = engaged;
          if (engaged) onEnterRef.current && onEnterRef.current();
        }
        // card chrome: resolves in (cardP), then fades as the window opens
        const cVis = cardP * (1 - _bfClamp(visualOpenP / 0.55, 0, 1));
        if (aboutLayer) {
          aboutLayer.style.opacity = cVis.toFixed(3);
          aboutLayer.setAttribute("aria-hidden", cVis < 0.02 ? "true" : "false");
        }
        if (aboutNode) {
          aboutNode.style.transform = `scale(${(1 + visualOpenP * 0.06).toFixed(3)}) translateY(${((1 - cardP) * 26).toFixed(1)}px)`;
          aboutNode.style.filter = cardP < 0.996 ? `blur(${((1 - cardP) * 9).toFixed(2)}px)` : "none";
        }
      } else {
        // ── scroll-driven crossfade / wipe (comparison files) ──
        const entry = rectTop > 0 ? _bfClamp((vh - rectTop) / (ENTRY_VH * vh), 0, 1) : 1;
        const exit  = rectBottom < vh ? _bfClamp(rectBottom / (0.6 * vh), 0, 1) : 1;
        const presence = boardReady ? Math.min(entry, exit) : 0;
        presRef.current = presence;
        if (wakeRenderRef.current) wakeRenderRef.current();
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
          const layerActive = presence > 0.5;
          layer.style.pointerEvents = layerActive ? "auto" : "none";
          layer.inert = !layerActive;
          layer.setAttribute("aria-hidden", layerActive ? "false" : "true");
        }
      }

      // Continuous scroll values stay out of React. Updating the authored
      // overlay nodes directly avoids reconciling the full Board subtree on
      // every wheel frame while preserving the exact same equations.
      const openGate = _bfClamp((visualOpenP - 0.55) / 0.4, 0, 1);
      const chromeFade = (1 - _bfClamp(footerMix * 1.4, 0, 1)) * openGate;
      if (mark) mark.style.opacity = chromeFade.toFixed(3);
      if (rail) {
        rail.style.opacity = chromeFade.toFixed(3);
        rail.style.pointerEvents = chromeFade > 0.02 && footerMix <= 0.4 ? "auto" : "none";
        rail.inert = !(chromeFade > 0.02 && footerMix <= 0.4);
        rail.setAttribute("aria-hidden", rail.inert ? "true" : "false");
      }
      if (progress) progress.style.opacity = chromeFade.toFixed(3);
      if (progressFill) progressFill.style.transform = `scaleX(${t.toFixed(4)})`;
      if (cue) cue.style.opacity = openGate > 0.99 && t < 0.05 && footerMix < 0.02 ? "1" : "0";

      chapters.forEach((chapter, i) => {
        const center = STOPS[i].p / 10;
        const d = Math.abs(t - center) * N;
        const held = (i === 0 && t <= center) || (i === N - 1 && t >= center);
        const ramp = held ? 1 : _bfClamp((0.5 - d) / 0.17, 0, 1);
        const vis = ramp * ramp * (3 - 2 * ramp);
        const cardOp = vis * (1 - _bfClamp(footerMix * 1.6, 0, 1)) * openGate;
        const isOn = cardOp > 0.02 && (held || d < 0.5) && footerMix < 0.4;
        chapter.classList.toggle("is-on", isOn);
        chapter.style.opacity = cardOp.toFixed(3);
        chapter.style.transform = `translateY(${((t - center) * N * 24).toFixed(1)}px)`;
        chapter.style.pointerEvents = isOn ? "auto" : "none";
        chapter.inert = !isOn;
        chapter.setAttribute("aria-hidden", isOn ? "false" : "true");
      });

      const footE = boardReady ? _bfEaseOut(footerMix) : 0;
      if (footer) {
        footer.style.opacity = footE.toFixed(3);
        footer.style.pointerEvents = boardReady && footerMix > 0.35 ? "auto" : "none";
        footer.setAttribute("aria-hidden", boardReady && footerMix >= 0.1 ? "false" : "true");
        footer.inert = !boardReady || footerMix <= 0.35;
      }
      if (footerInner) footerInner.style.transform = `translateY(${((1 - footE) * 40).toFixed(1)}px)`;
    };

    const measure = () => {
      measureRaf = 0;
      if (dead) return;
      const rect = el.getBoundingClientRect();
      trackTop = rect.top + window.scrollY;
      trackHeight = rect.height;
      viewportH = window.innerHeight;
      update();
    };
    const scheduleMeasure = () => {
      if (!dead && !measureRaf) measureRaf = requestAnimationFrame(measure);
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    const forceUpdate = () => {
      if (dead) return;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      // BFCache restores scroll position and DOM styles together. Refresh the
      // shared position and re-apply this scene's state in the same event turn,
      // before the browser paints the restored frame.
      window.__mo_scrollY = window.scrollY;
      update();
    };
    const ro = window.ResizeObserver ? new ResizeObserver(scheduleMeasure) : null;
    if (ro) ro.observe(el);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(scheduleMeasure, () => {});
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", scheduleMeasure);
    window.addEventListener("mo:board-ready", forceUpdate);
    window.addEventListener("mo:page-restored", forceUpdate);
    return () => {
      dead = true;
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", scheduleMeasure);
      window.removeEventListener("mo:board-ready", forceUpdate);
      window.removeEventListener("mo:page-restored", forceUpdate);
      if (ro) ro.disconnect();
      if (raf) cancelAnimationFrame(raf);
      if (measureRaf) cancelAnimationFrame(measureRaf);
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

  return (
    <section
      ref={secRef}
      className="bf"
      id="about"
      data-screen-label="04 About — trace the net"
      style={{ height: `calc(${TOTAL_V} * 100vh)` }}
    >
      {/* ── About NODE card — node 0x00, presented as one more node-card.
          The REAL board begins as its small, pulled-back model; as you scroll,
          the card frame clears and that same board grows to fill the screen. ── */}
      <div className="aboutNode-layer" style={{ opacity: 0 }} aria-hidden="true">
        <div
          className="uNode"
          data-screen-label="04 About — node 0x00"
          style={{
            // Dock: the node card resolves out of the transit (rises +
            // sharpens) instead of a flat fade — the arrival at station 0x00.
            transform: "scale(1) translateY(26px)",
            filter: "blur(9px)",
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
              <span className="uNode__id" data-mo-board-cursor-mirror data-mo-cursor-opacity=".aboutNode-layer,.uNode,.lp"><span className="uNode__sq" />NODE 0x00</span>
              <span className="uNode__year" data-mo-board-cursor-mirror data-mo-cursor-opacity=".aboutNode-layer,.uNode,.lp">ABOUT</span>
            </div>
            <div className="uNode__headR" data-mo-board-cursor-mirror data-mo-cursor-opacity=".aboutNode-layer,.uNode,.lp">
              <span>MASLOV / OLEKSANDR</span>
              <span>48.137° N · 11.575° E</span>
            </div>
          </div>

          {/* dotted model field behind the live board as it grows out */}
          <div className="uNode__field" aria-hidden="true" />

          {/* name block — bottom-left, like the tile cards */}
          <div className="uNode__foot">
            <h3 className="uNode__name" data-mo-board-cursor-mirror data-mo-cursor-opacity=".aboutNode-layer,.uNode,.lp">Source node<em>.</em></h3>
            <div className="uNode__sub" data-mo-board-cursor-mirror data-mo-cursor-opacity=".aboutNode-layer,.uNode,.lp">0x00 has no fixed coordinate. This board is one readable projection of how the source node was formed.</div>
            <div className="uNode__cue" data-mo-board-cursor-mirror data-mo-cursor-opacity=".aboutNode-layer,.uNode,.lp"><span className="uNode__cueLine" />KEEP SCROLLING — INSPECT THE SOURCE ↓</div>
          </div>
        </div>
      </div>

      <div className={"bf-layer bf-layer--" + MODE} ref={layerRef} style={{ opacity: 0, pointerEvents: "none" }} inert="" aria-hidden="true">
        {/* the board canvas */}
        <div className="bf-mount" ref={mountRef} />
        <div className="bf-grain" aria-hidden="true" />

        {/* section marker */}
        <div className="bf-mark" style={{ opacity: 0 }}>
          <span className="bf-mark__dot" />
          <span data-mo-board-cursor-mirror data-mo-cursor-opacity=".bf-mark,.bf-layer,.lp">0x00 · INTERNAL ARCHITECTURE</span>
        </div>

        {/* chapter overlays (fade out as the footer beat takes over) */}
        <div className="bf-stage" aria-hidden="false">
          {STOPS.map((st, i) => {
            const center = st.p / 10;
            return (
              <article
                key={i}
                className="bf-ch"
                style={{
                  opacity: 0,
                  transform: `translateY(${(-center * N * 24).toFixed(1)}px)`,
                  pointerEvents: "none",
                }}
                inert=""
                aria-hidden="true"
                data-screen-label={st.chapter.n + " " + st.chapter.kicker}
              >
                <div className="bf-ch__num" data-mo-board-cursor-mirror data-mo-cursor-opacity=".bf-ch,.bf-layer,.lp">{st.chapter.n}</div>
                <div className="bf-ch__card">
                  <div className="bf-ch__kicker" data-mo-board-cursor-mirror data-mo-cursor-opacity=".bf-ch,.bf-layer,.lp">
                    {st.live ? <span className="bf-ch__live" /> : <span className="bf-ch__dot" />}
                    {st.chapter.kicker}
                  </div>
                  <h2 className="bf-ch__title" data-mo-board-cursor-mirror data-mo-cursor-opacity=".bf-ch,.bf-layer,.lp">
                    {st.chapter.title[0]}<em>{st.chapter.title[1]}</em>{st.chapter.title[2]}
                  </h2>
                  <p className="bf-ch__body" data-mo-board-cursor-mirror data-mo-cursor-opacity=".bf-ch,.bf-layer,.lp">{st.chapter.body}</p>
                  <div className="bf-ch__ref">
                    <span className="bf-ch__refK" data-mo-board-cursor-mirror data-mo-cursor-opacity=".bf-ch,.bf-layer,.lp">COMPONENT</span>
                    <span className="bf-ch__refV" data-mo-board-cursor-mirror data-mo-cursor-opacity=".bf-ch,.bf-layer,.lp">{st.ref}</span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* waypoint rail */}
        <div className="bf-rail" style={{ opacity: 0, pointerEvents: "none" }} inert="" aria-hidden="true">
          {STOPS.map((st, i) => (
            <button key={i} className={"bf-rail__stop " + (active === i ? "is-active" : "")} onClick={() => jump(i)}>
              <span className="bf-rail__dot" /><span data-mo-board-cursor-mirror data-mo-cursor-opacity=".bf-rail,.bf-layer,.lp">{st.chapter.n} · {st.ref.split(" · ")[0]}</span>
            </button>
          ))}
        </div>

        {/* progress hairline */}
        <div className="bf-prog" style={{ opacity: 0 }}>
          <div className="bf-prog__fill" style={{ transform: "scaleX(0)" }} />
        </div>

        {/* entry cue */}
        <div className="bf-cue" style={{ opacity: 0 }}>
          <span className="bf-cue__line" /><span data-mo-board-cursor-mirror data-mo-cursor-opacity=".bf-cue,.bf-layer,.lp">KEEP SCROLLING — FOLLOW THE TRACE ↓</span>
        </div>

        {/* ── FOOTER beat — resolves in-scene over the hero board shot ── */}
        <div
          className="bf-foot"
          style={{ opacity: 0, pointerEvents: "none" }}
          inert=""
          aria-hidden="true"
          data-screen-label="05 Contact"
        >
          <div className="bf-foot__scrim" aria-hidden="true" />
          <div className="bf-foot__inner" style={{ transform: "translateY(40px)" }}>
            <div className="bf-foot__kicker" data-mo-board-cursor-mirror data-mo-cursor-opacity=".bf-foot,.bf-layer,.lp"><span className="bf-foot__live" />SW1 · OUTPUT — OPEN CHANNEL</div>
            <div className="bf-foot__line" data-mo-board-cursor-mirror data-mo-cursor-opacity=".bf-foot,.bf-layer,.lp">For products that cross hardware, software and interaction.</div>
            <a className="bf-foot__big t-link" href="mailto:oleksandrmaslov08@gmail.com" data-mo-board-cursor-mirror data-mo-cursor-opacity=".bf-foot,.bf-layer,.lp">
              oleksandrmaslov08<wbr />@gmail.com
            </a>
            <div className="bf-foot__links">
              <a className="bf-foot__link" href="https://github.com/oleksandrmaslov" data-mo-board-cursor-mirror data-mo-cursor-opacity=".bf-foot,.bf-layer,.lp">
                <span className="bf-foot__linkKey">GITHUB</span>
                <span className="bf-foot__linkVal">@oleksandrmaslov</span><span className="bf-foot__arr">↗</span>
              </a>
              <a className="bf-foot__link" href="https://t.me/maslov_oleksandr08" data-mo-board-cursor-mirror data-mo-cursor-opacity=".bf-foot,.bf-layer,.lp">
                <span className="bf-foot__linkKey">TELEGRAM</span>
                <span className="bf-foot__linkVal">@maslov_oleksandr08</span><span className="bf-foot__arr">↗</span>
              </a>
              <a className="bf-foot__link" href="assets/Oleksandr-Maslov-CV.pdf" download data-mo-board-cursor-mirror data-mo-cursor-opacity=".bf-foot,.bf-layer,.lp">
                <span className="bf-foot__linkKey">CV · PDF</span>
                <span className="bf-foot__linkVal">download · 2 pages</span><span className="bf-foot__arr">↓</span>
              </a>
            </div>
            <div className="bf-foot__meta">
              <span data-mo-board-cursor-mirror data-mo-cursor-opacity=".bf-foot,.bf-layer,.lp">© 2026 · MASLOV OLEKSANDR</span>
              <span data-mo-board-cursor-mirror data-mo-cursor-opacity=".bf-foot,.bf-layer,.lp">BUILT IN MUNICH · v0.1.0</span>
              <span data-mo-board-cursor-mirror data-mo-cursor-opacity=".bf-foot,.bf-layer,.lp">NO COOKIES · NO TRACKERS · STATIC HTML</span>
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
