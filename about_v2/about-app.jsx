/* ============================================================
   M.O. SYSTEM — About app · board flight
   Scroll drives a probe along the hero trace. Two camera
   concepts (PROBE / BENCH) toggle live on the same scene.
   ============================================================ */
const { useState: useAS, useEffect: useAE, useRef: useAR } = React;

function AboutApp() {
  const mountRef = useAR(null);
  const scrollRef = useAR(null);
  const ctrlRef = useAR(null);
  const tRef = useAR(0);
  const modeRef = useAR(localStorage.getItem("mo_about_concept") || "probe");
  const pointerRef = useAR({ x: 0, y: 0 });

  const [mode, setMode] = useAS(modeRef.current);
  const [active, setActive] = useAS(0);
  const [prog, setProg] = useAS(0);
  const [ready, setReady] = useAS(false);
  // Seamless arrival: when we got here via the landing's "dive into 0x00",
  // clear the SAME cyan ignition field inward so the page swap is invisible.
  const [arriving, setArriving] = useAS(() => {
    try { return sessionStorage.getItem("mo_dive_origin") === "1"; } catch (e) { return false; }
  });
  useAE(() => {
    if (!arriving) return;
    try { sessionStorage.removeItem("mo_dive_origin"); } catch (e) {}
    window.scrollTo(0, 0);                       // land at J1 (first stop, t=0)
    document.body.classList.add("ab-arriving");
    const t = setTimeout(() => {
      document.body.classList.remove("ab-arriving");
      setArriving(false);
    }, 900);
    return () => clearTimeout(t);
  }, []);

  const STOPS = (window.MOBoard && window.MOBoard.STOPS) || [];
  const N = STOPS.length;
  const TOTAL_V = N + 1;

  useAE(() => { modeRef.current = mode; localStorage.setItem("mo_about_concept", mode); }, [mode]);

  // build scene + run loop (once)
  useAE(() => {
    const mount = mountRef.current;
    if (!mount || !window.MOBoard) return;
    let ctrl, raf, last = performance.now(), disposed = false;

    const boot = () => {
      if (!window.THREE) { raf = requestAnimationFrame(boot); return; }
      ctrl = window.MOBoard.build(mount);
      if (!ctrl) return;
      ctrlRef.current = ctrl;
      setReady(true);
      const loop = (now) => {
        if (disposed) return;
        const dt = Math.min(50, now - last); last = now;
        const a = ctrl.update(tRef.current, modeRef.current, dt);
        ctrl.render();
        if (a !== undefined) setActive((prev) => (prev === a ? prev : a));
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    };
    boot();

    const onResize = () => ctrl && ctrl.setSize(mount.clientWidth, mount.clientHeight);
    window.addEventListener("resize", onResize);
    const onPointer = (e) => { pointerRef.current = { x: (e.clientX / window.innerWidth) * 2 - 1, y: (e.clientY / window.innerHeight) * 2 - 1 }; };
    window.addEventListener("pointermove", onPointer);

    return () => { disposed = true; cancelAnimationFrame(raf); window.removeEventListener("resize", onResize); window.removeEventListener("pointermove", onPointer); ctrl && ctrl.dispose(); };
  }, []);

  // scroll → t
  useAE(() => {
    const el = scrollRef.current; if (!el) return;
    let raf;
    const update = () => {
      const total = el.offsetHeight - window.innerHeight;
      if (total <= 0) return;
      const top = -el.getBoundingClientRect().top;
      const padN = 0.5 / TOTAL_V;
      const raw = Math.max(0, Math.min(1, top / total));
      const t = Math.max(0, Math.min(1, (raw - padN) / (1 - 2 * padN)));
      tRef.current = t;
      setProg(t);
    };
    const onScroll = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); cancelAnimationFrame(raf); };
  }, [TOTAL_V]);

  const jump = (i) => {
    const el = scrollRef.current; if (!el) return;
    const total = el.offsetHeight - window.innerHeight;
    const padN = 0.5 / TOTAL_V;
    const tt = STOPS[i].p / (10);          // matches stopT in scene (p / (TRACE_PTS.length-1)=10)
    const target = padN + tt * (1 - 2 * padN);
    window.scrollTo({ top: el.offsetTop + target * total, behavior: "smooth" });
  };

  return (
    <>
      {/* arrival ignition field — mirrors the landing's dive flash, clears inward */}
      {arriving && (
        <div className="ab-arrive" aria-hidden="true">
          <div className="ab-arrive__field" />
          <div className="ab-arrive__hud">
            <span className="ab-arrive__dot" />ENTERING NODE 0x00 · J1 POWER IN
          </div>
        </div>
      )}

      {/* fixed full-viewport canvas */}
      <div className="ab-mount" ref={mountRef} />
      <div className={"ab-grain"} aria-hidden="true" />

      {/* header */}
      <header className="ab-shell">
        <a className="ab-brand" href="Landing v11.html">M.O.</a>
        <div className="ab-shell__mid">ABOUT · TRACE THE NET</div>
        <div className="ab-concept" role="tablist" aria-label="camera concept">
          <span className="ab-concept__label">CONCEPT</span>
          <button className={"ab-concept__btn " + (mode === "probe" ? "is-active" : "")} onClick={() => setMode("probe")}>
            <span className="ab-concept__n">01</span><span className="ab-concept__name">PROBE</span>
          </button>
          <button className={"ab-concept__btn " + (mode === "bench" ? "is-active" : "")} onClick={() => setMode("bench")}>
            <span className="ab-concept__n">02</span><span className="ab-concept__name">BENCH</span>
          </button>
        </div>
      </header>

      {/* chapter overlays */}
      <div className="ab-stage" aria-hidden={false}>
        {STOPS.map((st, i) => {
          const center = st.p / 10;
          const d = Math.abs(prog - center) * (N);
          const vis = Math.max(0, 1 - d * 1.6);
          const isOn = d < 0.45;
          return (
            <article key={i} className={"ab-ch " + (isOn ? "is-on" : "")}
              style={{ opacity: vis.toFixed(3), transform: `translateY(${((prog-center)*N*24).toFixed(1)}px)`, pointerEvents: isOn ? "auto" : "none" }}
              data-screen-label={st.chapter.n + " " + st.chapter.kicker}>
              <div className="ab-ch__num">{st.chapter.n}</div>
              <div className="ab-ch__card">
                <div className="ab-ch__kicker">{st.live ? <span className="ab-ch__live" /> : <span className="ab-ch__dot" />}{st.chapter.kicker}</div>
                <h2 className="ab-ch__title">{st.chapter.title[0]}<em>{st.chapter.title[1]}</em>{st.chapter.title[2]}</h2>
                <p className="ab-ch__body">{st.chapter.body}</p>
                <div className="ab-ch__ref"><span className="ab-ch__refK">COMPONENT</span><span className="ab-ch__refV">{st.ref}</span></div>
              </div>
            </article>
          );
        })}
      </div>

      {/* probe HUD */}
      <div className="ab-hud">
        <div className="ab-hudRow"><span>REF</span><span className="v">{STOPS[active]?.ref.split(" · ")[0] || "—"}</span></div>
        <div className="ab-hudRow"><span>STOP</span><span className="v">{(active+1).toString().padStart(2,"0")} / {N.toString().padStart(2,"0")}</span></div>
        <div className="ab-hudRow"><span>CAM</span><span className="v">{mode.toUpperCase()}</span></div>
      </div>

      {/* waypoint rail */}
      <div className="ab-rail">
        {STOPS.map((st, i) => (
          <button key={i} className={"ab-rail__stop " + (active === i ? "is-active" : "")} onClick={() => jump(i)}>
            <span className="ab-rail__dot" /><span>{st.chapter.n} · {st.ref.split(" · ")[0]}</span>
          </button>
        ))}
      </div>

      {/* progress + cues */}
      <div className="ab-prog"><div className="ab-prog__fill" style={{ width: (prog*100).toFixed(2) + "%" }} /></div>
      <div className="ab-cue" style={{ opacity: prog < 0.04 ? 1 : 0 }}><span className="ab-cue__line" />SCROLL TO TRACE THE NET ↓</div>
      <div className="ab-end" style={{ opacity: prog > 0.95 ? 1 : 0 }}>
        <a href="Landing v11.html#work" className="ab-end__cta"><span>SELECTED WORK</span><span className="ab-end__arr">→</span></a>
      </div>

      {/* scroll spacer that drives t */}
      <div className="ab-scroll" ref={scrollRef} style={{ height: `calc(${TOTAL_V} * 100vh)` }} />
    </>
  );
}

const _abRoot = ReactDOM.createRoot(document.getElementById("root"));
_abRoot.render(<AboutApp />);
