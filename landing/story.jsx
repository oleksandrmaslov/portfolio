/* ============================================================
   M.O. SYSTEM — Story · Origin hero + About scroll-flight
   ============================================================ */
const { useState: useS, useEffect: useEf, useRef: useRf, useCallback: useCb } = React;

/* shared in-view helper */
function useEnter(onEnter, margin = "-40% 0px -40% 0px") {
  const ref = useRf(null);
  useEf(() => {
    const el = ref.current; if (!el || !onEnter) return;
    const io = new IntersectionObserver(es => { for (const e of es) if (e.isIntersecting) onEnter(); }, { rootMargin: margin, threshold: 0 });
    io.observe(el); return () => io.disconnect();
  }, [onEnter]);
  return ref;
}

/* ============================================================
   ORIGIN — the reworked "who am I". The camera idles on the
   origin node behind; this is the human lede + scroll cue.
   ============================================================ */
function OriginIntro({ onEnter }) {
  const ref = useEnter(onEnter, "-30% 0px -60% 0px");
  const proceed = () => {
    const el = document.getElementById("flight");
    if (el) window.scrollTo({ top: el.offsetTop + window.innerHeight * 0.05, behavior: "smooth" });
  };
  return (
    <section ref={ref} className="st-origin" id="origin" data-screen-label="01 Origin">
      <div className="st-origin__edge">
        <span className="st-origin__edgeN">00</span>
        <span className="st-origin__edgeR" />
        <span className="st-origin__edgeK">ORIGIN</span>
        <span className="st-origin__edgeR" />
        <span className="st-origin__edgeK">M.O.</span>
      </div>

      <div className="st-origin__inner">
        <div className="st-origin__over">
          <span className="st-origin__pulse" />
          <span>NODE 0x00 · YOU ARE HERE · MÜNCHEN</span>
        </div>

        <h1 className="st-origin__title">
          <span className="st-origin__line">I build</span>
          <span className="st-origin__line st-origin__line--shift"><em>small,</em> careful</span>
          <span className="st-origin__line">things —</span>
          <span className="st-origin__line st-origin__line--ghost">and the firmware</span>
          <span className="st-origin__line st-origin__line--shift">that keeps them<em> alive.</em></span>
        </h1>

        <p className="st-origin__lede">
          Eighteen. From Kyiv, now in Munich. Everything on this map connects back to a
          single node — the person who soldered it at 2&nbsp;a.m. <em>Scroll to trace the net.</em>
        </p>

        <div className="st-origin__foot">
          <div className="st-origin__sig">
            <span className="st-origin__sigK">SIGNED</span>
            <span className="st-origin__sigV t-serif">Maslov Oleksandr</span>
          </div>
          <button className="st-origin__begin" onClick={proceed}>
            <span className="st-origin__beginRing" />
            <span className="st-origin__beginK">BEGIN</span>
            <span className="st-origin__beginV">trace the net ↓</span>
          </button>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   CHAPTERS — write your real words into `body` / [WRITE: …].
   Each maps to a universe waypoint (same order as WAYPOINTS).
   ============================================================ */
const CHAPTERS = [
  {
    addr: "0x00", side: "left", kicker: "TRACE THE NET · 0x00",
    line: ["Everything connects back to ", "one node", "."],
    body: "Twelve projects orbit a single origin — me. Each one is wired home by a signal trace. Follow them and you get the whole story, in order.",
    rows: [["NODE", "0x00"], ["TYPE", "ORIGIN"], ["LINKS", "14 traces"]],
  },
  {
    addr: "0xK", side: "right", kicker: "ORIGIN · 50.45° N",
    line: ["It started in ", "Kyiv", "."],
    body: "Born 21·07·2007. The kid who opened every device in the flat to see the board inside, then couldn't always put the case back on. [WRITE: your earliest memory of taking something apart.]",
    rows: [["BORN", "21·07·2007"], ["CITY", "Kyiv"], ["COORD", "50.45° N"]],
  },
  {
    addr: "0x00", side: "left", kicker: "TRACE · KYIV → MÜNCHEN",
    line: ["Then a ", "crossing", "."],
    body: "February 2022. A backpack and a half-finished keyboard — the longest trace on this map. [WRITE: what you carried, what you had to leave behind.]",
    rows: [["DATE", "02 · 2022"], ["FROM", "Kyiv"], ["TO", "München"]],
    accent: true,
  },
  {
    addr: "0xM", side: "right", kicker: "ANCHOR · 48.13° N",
    line: ["Munich gave me a ", "desk", "."],
    body: "Internet, time, and quiet nights. German in the evenings, soldering after midnight, code review on weekends. The rest I shipped. [WRITE: the first thing you finished here.]",
    rows: [["SINCE", "2022"], ["LANG", "EN · DE B2 · UA"], ["STATUS", "available"]],
  },
  {
    addr: "0x00", side: "left", kicker: "HOW · PRINCIPLES",
    line: ["I build from the ", "schematic up", "."],
    body: "Schematic, board, firmware, case — and the documentation that goes with them. A few rules I don't break:",
    list: ["open over closed", "primitives over frameworks", "docs are a deliverable, not an afterthought", "if it can't be field-repaired, it isn't done"],
  },
  {
    addr: "0x02", side: "right", kicker: "WHY · 0x02",
    line: ["The biological ", "reference unit", "."],
    body: "Kerfur is named after a tongue-out tabby who lives rent-free in my flat. I wanted to make something that felt alive — not startup-deck alive, twitching-tail alive. The cat is the design brief.",
    rows: [["SUBJECT", "KERFUR_v0"], ["ROLE", "design brief"], ["VERDICT", "indifferent"]],
    image: "landing/kerfur-cat.jpg",
  },
  {
    addr: "0x00", side: "left", kicker: "LIVE · SEEKING", live: true,
    line: ["Currently ", "building", "."],
    body: "Kerfur v0.4 · Wafer R3 · ZMK upstream. Open to an Ausbildung or junior role in embedded / firmware — Munich and 200 km around it.",
    rows: [["NOW", "Kerfur · Wafer · ZMK"], ["SEEKING", "Ausbildung · embedded"], ["WRITE", "oleksandrmaslov08@gmail.com"]],
  },
];

function StoryChapter({ ch, p, idx, total }) {
  const center = total === 1 ? 0 : idx / (total - 1);
  const d = Math.abs(p - center) * (total - 1);
  const vis = Math.max(0, 1 - d * 1.5);
  const dir = p - center;
  const ty = dir * (total - 1) * 46;            // parallax drift
  const active = d < 0.4;
  return (
    <div
      className={"stCh stCh--" + ch.side + (ch.accent ? " stCh--accent" : "") + (active ? " is-active" : "")}
      style={{ opacity: vis.toFixed(3), transform: `translateY(${ty.toFixed(1)}px)`, pointerEvents: active ? "auto" : "none" }}
      aria-hidden={!active}
      data-screen-label={(idx + 1).toString().padStart(2, "0") + " " + ch.kicker}
    >
      <div className="stCh__card">
        <div className="stCh__rail">
          <span className="stCh__idx">{(idx + 1).toString().padStart(2, "0")} / {total.toString().padStart(2, "0")}</span>
          <span className="stCh__railLine" />
          <span className="stCh__node">{ch.live ? <span className="stCh__live" /> : <span className="stCh__nodeDot" />}{ch.addr}</span>
        </div>

        <div className="stCh__body">
          <div className="stCh__kicker">{ch.kicker}</div>
          <h2 className="stCh__line">
            {ch.line[0]}<em>{ch.line[1]}</em>{ch.line[2]}
          </h2>
          <p className="stCh__text">{ch.body}</p>

          {ch.list && (
            <ul className="stCh__list">
              {ch.list.map((li, i) => <li key={i}><span className="stCh__listN">·</span>{li}</li>)}
            </ul>
          )}
          {ch.rows && (
            <dl className="stCh__rows">
              {ch.rows.map(([k, v], i) => <div key={i}><dt>{k}</dt><dd>{v}</dd></div>)}
            </dl>
          )}
          {ch.image && (
            <figure className="stCh__fig">
              <div className="stCh__figChrome"><span className="stCh__figDot" />SUBJECT · KERFUR_v0<span className="stCh__figSep" />JPEG</div>
              <div className="stCh__figImg">
                <img src={ch.image} alt="Kerfur — the biological reference unit" />
                <span className="stCh__figC stCh__figC--tl" /><span className="stCh__figC stCh__figC--tr" />
                <span className="stCh__figC stCh__figC--bl" /><span className="stCh__figC stCh__figC--br" />
              </div>
            </figure>
          )}
        </div>
      </div>
    </div>
  );
}

/* The pinned flight section — scroll maps to tourProgress (0..1). */
function StoryFlight({ onEnter, onProgress, activeWP }) {
  const ref = useRf(null);
  const [p, setP] = useS(0);
  const N = CHAPTERS.length;
  const PADS = 0.5;
  const TOTAL_V = N + PADS;     // viewport-heights of scroll

  useEf(() => {
    const el = ref.current; if (!el || !onEnter) return;
    const io = new IntersectionObserver(es => { for (const e of es) if (e.isIntersecting) onEnter(); }, { rootMargin: "-20% 0px -20% 0px", threshold: 0 });
    io.observe(el); return () => io.disconnect();
  }, [onEnter]);

  useEf(() => {
    const el = ref.current; if (!el) return;
    let raf;
    const update = () => {
      const total = el.offsetHeight - window.innerHeight;
      if (total <= 0) return;
      const top = -el.getBoundingClientRect().top;
      const padN = (PADS / 2) / TOTAL_V;
      const raw = Math.max(0, Math.min(1, top / total));
      const prog = Math.max(0, Math.min(1, (raw - padN) / (1 - 2 * padN)));
      setP(prog);
      onProgress && onProgress(prog);
    };
    const onScroll = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); cancelAnimationFrame(raf); };
  }, [onProgress, TOTAL_V]);

  const jump = (i) => {
    const el = ref.current; if (!el) return;
    const total = el.offsetHeight - window.innerHeight;
    const padN = (PADS / 2) / TOTAL_V;
    const target = padN + (i / (N - 1)) * (1 - 2 * padN);
    window.scrollTo({ top: el.offsetTop + target * total, behavior: "smooth" });
  };

  return (
    <section ref={ref} className="st-flight" id="flight" data-screen-label="02 Flight" style={{ height: `calc(${TOTAL_V} * 100vh)` }}>
      <div className="st-flight__sticky">
        {/* chapter overlays */}
        <div className="st-flight__stage">
          {CHAPTERS.map((ch, i) => <StoryChapter key={i} ch={ch} p={p} idx={i} total={N} />)}
        </div>

        {/* top-left meta */}
        <div className="st-flight__meta">
          <div className="st-flight__metaRow"><span>ROUTE</span><span>TRACE THE NET</span></div>
          <div className="st-flight__metaRow"><span>WAYPOINT</span><span>{(Math.min(N - 1, activeWP || 0) + 1).toString().padStart(2, "0")} / {N.toString().padStart(2, "0")}</span></div>
          <div className="st-flight__metaRow"><span>MODE</span><span>SCROLL → FLY</span></div>
        </div>

        {/* waypoint rail (right) */}
        <div className="st-flight__rail">
          {CHAPTERS.map((ch, i) => (
            <button key={i} className={"st-flight__stop " + ((activeWP || 0) === i ? "is-active" : "")} onClick={() => jump(i)}>
              <span className="st-flight__stopDot" />
              <span>{(i + 1).toString().padStart(2, "0")} · {ch.kicker.split(" · ")[0].split(" ")[0]}</span>
            </button>
          ))}
        </div>

        {/* progress rail */}
        <div className="st-flight__prog"><div className="st-flight__progFill" style={{ width: (p * 100).toFixed(2) + "%" }} /></div>

        {/* drift cue at the end */}
        <div className="st-flight__endCue" style={{ opacity: p > 0.93 ? 1 : 0 }}>
          <span>NET TRACED · DRIFT FREELY ↓</span>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   EXPLORE GATE — hands off to free-drift + the work universe
   ============================================================ */
function ExploreGate({ onEnter }) {
  const ref = useEnter(onEnter, "-35% 0px -35% 0px");
  const openAll = () => {
    window.MOSound && window.MOSound.open && window.MOSound.open();
    document.body.classList.add("landing-exit");
    setTimeout(() => { window.location.href = "All Projects.html"; }, 380);
  };
  return (
    <section ref={ref} className="st-explore" id="explore" data-screen-label="03 Explore">
      <div className="st-explore__inner">
        <div className="st-explore__over"><span className="st-origin__pulse" />FREE DRIFT · DRAG TO ORBIT · CLICK A NODE</div>
        <h2 className="st-explore__title">Now <em>wander</em> the net.</h2>
        <p className="st-explore__lede">
          The map is yours — drag to orbit the constellation, hover a node to light its traces,
          click any project to open its case file. Twelve nodes, including the eight still in progress.
        </p>
        <div className="st-explore__actions">
          <button className="st-cta st-cta--primary" onClick={openAll}><span>OPEN ALL PROJECTS</span><span className="st-cta__arr">→</span></button>
          <a className="st-cta" href="Landing v11.html"><span>CLASSIC VIEW</span><span className="st-cta__arr">↗</span></a>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   CONTACT
   ============================================================ */
function StoryContact({ onEnter }) {
  const ref = useEnter(onEnter, "-30% 0px -30% 0px");
  return (
    <section ref={ref} className="st-contact" id="contact" data-screen-label="04 Contact">
      <div className="st-contact__head">
        <div className="st-contact__num">04</div>
        <h2 className="st-contact__title">Let's talk<em>.</em></h2>
        <div className="st-contact__meta">RESPONSE · &lt; 24H</div>
      </div>
      <a className="st-contact__big t-link" href="mailto:oleksandrmaslov08@gmail.com">oleksandrmaslov08<wbr />@gmail.com</a>
      <div className="st-contact__links">
        <a className="st-contact__link" href="https://github.com/oleksandrmaslov"><span className="st-contact__lk">GITHUB</span><span className="st-contact__lv">@oleksandrmaslov</span><span className="st-contact__arr">↗</span></a>
        <a className="st-contact__link" href="tel:+491723416265"><span className="st-contact__lk">PHONE</span><span className="st-contact__lv">+49 172 3416265</span><span className="st-contact__arr">↗</span></a>
        <a className="st-contact__link" href="Design System.html"><span className="st-contact__lk">SYSTEM</span><span className="st-contact__lv">design foundation · v0.1</span><span className="st-contact__arr">→</span></a>
      </div>
      <footer className="st-foot">
        <span>© 2026 · MASLOV OLEKSANDR</span>
        <span>BUILT IN MUNICH · STORY v1</span>
        <span>NO COOKIES · STATIC HTML</span>
      </footer>
    </section>
  );
}

/* ============================================================
   DIRECTION SWITCH — TRACE / BOOT / FIELD
   ============================================================ */
const DIRECTIONS = [
  { id: "trace", name: "TRACE", note: "cinematic" },
  { id: "boot",  name: "BOOT",  note: "energetic" },
  { id: "field", name: "FIELD", note: "editorial" },
  { id: "swarm", name: "SWARM", note: "particles" },
];
function DirectionSwitch({ value, onChange }) {
  return (
    <div className="dirSwitch" data-dir={value}>
      <span className="dirSwitch__label">DIRECTION</span>
      <div className="dirSwitch__group">
        {DIRECTIONS.map(d => (
          <button key={d.id} className={"dirSwitch__btn " + (value === d.id ? "is-active" : "")}
            onClick={() => { onChange(d.id); window.MOSound && window.MOSound.tick && window.MOSound.tick(); }}>
            <span className="dirSwitch__name">{d.name}</span>
            <span className="dirSwitch__note">{d.note}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

window.OriginIntro    = OriginIntro;
window.StoryFlight    = StoryFlight;
window.ExploreGate    = ExploreGate;
window.StoryContact   = StoryContact;
window.DirectionSwitch = DirectionSwitch;
window.STORY_CHAPTERS = CHAPTERS;
