/* ============================================================
   M.O. SYSTEM — All Projects · V2 Terminal Manifest
   "$ ls -laR projects/" — every node, every family, sortable.
   ============================================================ */
const { useState: useMA, useEffect: useME, useMemo: useMM } = React;

/* Family map — same source-of-truth shape as V1, duplicated here so
   this page is standalone (no dependency on landing/all-projects.jsx). */
const M_FAMILY_DEFS = [
  { id: "ZMK",      label: "ZMK",         color: "var(--signal)" },
  { id: "KERFUR",   label: "KERFUR",      color: "#ff9d6b"       },
  { id: "KEYBOARD", label: "KEYBOARDS",   color: "#7ec7ff"       },
  { id: "HARDWARE", label: "HARDWARE",    color: "var(--copper)" },
  { id: "OSS",      label: "OPEN SOURCE", color: "#b39dff"       },
  { id: "VOLUNTEER",label: "VOLUNTEER",   color: "var(--pulse)"  },
  { id: "WEB",      label: "WEB · GFX",   color: "#6ee0c0"       },
];
const M_FAMILY_BY_ADDR = {
  "0x01": ["ZMK", "HARDWARE", "KEYBOARD"],
  "0x02": ["KERFUR"],
  "0x03": ["ZMK", "OSS"],
  "0x04": ["HARDWARE", "VOLUNTEER"],
  "0x05": ["ZMK", "OSS"],
  "0x06": ["HARDWARE", "OSS"],
  "0x07": ["WEB"],
  "0x08": ["KEYBOARD", "OSS"],
  "0x09": ["KEYBOARD", "HARDWARE"],
  "0x0A": ["KERFUR", "OSS"],
  "0x0B": ["ZMK", "HARDWARE"],
  "0x0C": ["ZMK", "OSS", "WEB"],
};
const mFamColor = (f) => (M_FAMILY_DEFS.find(d => d.id === f) || {}).color || "var(--signal)";
const mFams     = (p) => M_FAMILY_BY_ADDR[p.addr] || [];

/* Sort defs */
const MSORTS = [
  { id: "addr",   label: "ADDR ↑",   cmp: (a, b) => a.addr.localeCompare(b.addr) },
  { id: "year",   label: "YEAR ↓",   cmp: (a, b) => (b.year || "").localeCompare(a.year || "") },
  { id: "name",   label: "NAME A–Z", cmp: (a, b) => a.name.localeCompare(b.name) },
  { id: "status", label: "STATUS",   cmp: (a, b) => (b.file ? 1 : 0) - (a.file ? 1 : 0) || a.addr.localeCompare(b.addr) },
];

/* ============================================================
   ManifestApp
   ============================================================ */
function ManifestApp() {
  const projects = window.UNIVERSE_PROJECTS || [];
  const [booted, setBooted] = useMA(() => sessionStorage.getItem("mo_booted") === "1");

  const [family, setFamily] = useMA("ALL");
  const [sortId, setSortId] = useMA("addr");
  const [query,  setQuery]  = useMA("");
  const [focus,  setFocus]  = useMA(null);
  const [time,   setTime]   = useMA("--:--");

  useME(() => {
    if (booted) sessionStorage.setItem("mo_booted", "1");
  }, [booted]);
  useME(() => {
    const tick = () => setTime(new Date().toTimeString().slice(0, 5));
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, []);

  /* Keyboard nav — j/k or ↑/↓ to move focus, Enter to open */
  useME(() => {
    const onKey = (e) => {
      if (e.target && /input|textarea/i.test(e.target.tagName || "")) return;
      const dir = e.key === "j" || e.key === "ArrowDown" ? +1
                : e.key === "k" || e.key === "ArrowUp"   ? -1
                : 0;
      if (dir !== 0) {
        e.preventDefault();
        setFocus(prev => {
          const arr = sorted;
          if (arr.length === 0) return prev;
          const idx = prev ? arr.findIndex(p => p.addr === prev) : -1;
          const next = arr[(idx + dir + arr.length) % arr.length];
          return next ? next.addr : prev;
        });
      } else if (e.key === "Enter") {
        const p = sorted.find(p => p.addr === focus);
        if (p && p.file) openProject(p);
      } else if (e.key === "/") {
        const inp = document.querySelector(".m-search__input");
        if (inp) { e.preventDefault(); inp.focus(); }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const filtered = useMM(() => {
    const q = query.trim().toLowerCase();
    return projects.filter(p => {
      if (family !== "ALL" && !mFams(p).includes(family)) return false;
      if (!q) return true;
      const hay = [p.addr, p.name, p.sub, p.stack, p.year].join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [projects, family, query]);

  const sorted = useMM(() => {
    const s = MSORTS.find(s => s.id === sortId) || MSORTS[0];
    return filtered.slice().sort(s.cmp);
  }, [filtered, sortId]);

  const live = projects.filter(p => p.file).length;

  const openProject = (p) => {
    if (!p.file) return;
    sessionStorage.setItem("mo_navigate_from_addr", p.addr);
    document.body.classList.add("landing-exit");
    setTimeout(() => { window.location.href = p.file; }, 380);
  };

  return (
    <>
      {!booted && window.Boot ? React.createElement(window.Boot, { onDone: () => setBooted(true) }) : null}
      {window.FibGrid ? React.createElement(window.FibGrid) : null}
      {window.Cursor  ? React.createElement(window.Cursor)  : null}

      <header className="shell m-shell">
        <div className="shell__brand">M.O.</div>
        <nav className="shell__nav">
          <a href="Landing v11.html">LANDING ↗</a>
          <a href="Landing v11.html#work">WORK</a>
          <a href="Design System.html">SYSTEM ↗</a>
        </nav>
        <div className="shell__status">
          <span className="shell__dot" />
          <span>MUC · {time} GMT+1</span>
          <span className="shell__hint">[/] search</span>
        </div>
      </header>

      <main className="m-page" data-screen-label="01 Terminal">
        {/* ===== HEADER ROW ===== */}
        <section className="m-hero">
          <div className="m-hero__rail">
            <span className="m-hero__railTick" />
            <span className="m-hero__railTick" />
            <span className="m-hero__railTick" />
          </div>
          <div className="m-hero__inner">
            <div className="m-hero__overline">
              <span className="m-hero__overlineDot" />
              <span>04 / SECTION · ALL PROJECTS</span>
              <span className="m-hero__overlineSep">·</span>
              <span>TERMINAL MANIFEST</span>
            </div>
            <h1 className="m-hero__title">
              ls <span className="m-hero__titleSep">/</span>projects<em>.</em>
            </h1>
            <p className="m-hero__sub">
              Every node in the universe — including the eight whose case files
              are still being written. Sort. Filter. Search. <kbd>j</kbd>/<kbd>k</kbd> to step,
              <kbd>↵</kbd> to open, <kbd>/</kbd> to search.
            </p>
            <div className="m-hero__bar">
              <span><b>{projects.length}</b> total</span>
              <span className="m-hero__barSep" />
              <span className="m-hero__barLive"><b>{live}</b> live</span>
              <span className="m-hero__barSep" />
              <span className="m-hero__barPending"><b>{projects.length - live}</b> pending</span>
              <span className="m-hero__barSep" />
              <span><b>{sorted.length}</b> shown</span>
            </div>
          </div>
        </section>

        {/* ===== CONTROL BAR ===== */}
        <section className="m-controls">
          <div className="m-controls__row m-search">
            <label className="m-search__caret" htmlFor="m-search-input">$</label>
            <input
              id="m-search-input"
              className="m-search__input"
              placeholder='grep — name, stack, year (try "zmk" or "2025")'
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              spellCheck="false"
              autoComplete="off"
            />
            {query && (
              <button className="m-search__clear" onClick={() => setQuery("")}>clear</button>
            )}
            <div className="m-search__cursor" aria-hidden="true" />
          </div>

          <div className="m-controls__row">
            <span className="m-controls__rowK">SORT</span>
            <div className="m-controls__rowV">
              {MSORTS.map(s => (
                <button
                  key={s.id}
                  className={"m-pill " + (sortId === s.id ? "is-active" : "")}
                  onClick={() => setSortId(s.id)}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="m-controls__row">
            <span className="m-controls__rowK">FILTER</span>
            <div className="m-controls__rowV m-controls__rowV--wrap">
              <button
                className={"m-pill m-pill--family " + (family === "ALL" ? "is-active" : "")}
                onClick={() => setFamily("ALL")}
              >
                <span className="m-pill__dot" style={{ background: "var(--bone)" }} />
                ALL
              </button>
              {M_FAMILY_DEFS.map(f => (
                <button
                  key={f.id}
                  className={"m-pill m-pill--family " + (family === f.id ? "is-active" : "")}
                  style={{ "--pillColor": f.color }}
                  onClick={() => setFamily(f.id)}
                >
                  <span className="m-pill__dot" style={{ background: f.color }} />
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ===== MANIFEST TABLE ===== */}
        <section className="m-manifest">
          <div className="m-manifest__head">
            <span className="m-col-addr">ADDR</span>
            <span className="m-col-state">STATE</span>
            <span className="m-col-name">NAME</span>
            <span className="m-col-sub">DESCRIPTOR</span>
            <span className="m-col-year">YEAR</span>
            <span className="m-col-stack">STACK</span>
            <span className="m-col-open">JUMP</span>
          </div>

          <ul className="m-rows">
            {sorted.map((p, i) => {
              const fams = mFams(p);
              const primary = fams[0] || "ALL";
              const isFocus = focus === p.addr;
              const hasPage = !!p.file;
              return (
                <li
                  key={p.addr}
                  className={
                    "m-row " +
                    (isFocus ? "m-row--focus " : "") +
                    (hasPage ? "m-row--live " : "m-row--pending ")
                  }
                  style={{ "--rowColor": mFamColor(primary), animationDelay: (i * 28) + "ms" }}
                  onMouseEnter={() => setFocus(p.addr)}
                  onFocus={() => setFocus(p.addr)}
                  onClick={() => openProject(p)}
                  tabIndex={hasPage ? 0 : -1}
                >
                  <span className="m-col-addr">
                    <span className="m-row__dot" style={{ background: mFamColor(primary) }} />
                    <span className="m-row__addrText">{p.addr}</span>
                  </span>
                  <span className="m-col-state">
                    {hasPage ? (
                      <span className="m-state m-state--live">● live</span>
                    ) : (
                      <span className="m-state m-state--pending">○ pending</span>
                    )}
                  </span>
                  <span className="m-col-name">
                    <span className="m-row__name">{p.name}</span>
                    <span className="m-row__fams">
                      {fams.map(f => (
                        <span key={f} className="m-row__fam" style={{ "--famColor": mFamColor(f) }}>
                          {(M_FAMILY_DEFS.find(d => d.id === f) || {}).label || f}
                        </span>
                      ))}
                    </span>
                  </span>
                  <span className="m-col-sub">{p.sub}</span>
                  <span className="m-col-year">{p.year}</span>
                  <span className="m-col-stack">{p.stack}</span>
                  <span className="m-col-open">
                    {hasPage ? (
                      <span className="m-jump">
                        <span>OPEN</span>
                        <span className="m-jump__arr">↗</span>
                      </span>
                    ) : (
                      <span className="m-jump m-jump--mute">
                        <span>—</span>
                      </span>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>

          {sorted.length === 0 && (
            <div className="m-empty">
              <span className="m-empty__caret">$_</span>
              <span>no matches.</span>
              <button onClick={() => { setQuery(""); setFamily("ALL"); }}>
                reset filters
              </button>
            </div>
          )}

          <footer className="m-manifest__foot">
            <span>$ end · {sorted.length} / {projects.length} nodes</span>
            <span className="m-manifest__footSep" />
            <span>updated 2026 · munich · static html</span>
            <span className="m-manifest__footSep" />
            <a className="m-manifest__footLink" href="Landing v11.html">return to universe ↗</a>
          </footer>
        </section>

        {/* ===== BOTTOM CTA ===== */}
        <section className="m-cta">
          <div className="m-cta__inner">
            <div className="m-cta__copy">
              <div className="m-cta__over">PREFER MOTION ?</div>
              <div className="m-cta__head">
                Open the universe view instead<em>.</em>
              </div>
              <div className="m-cta__sub">
                Same 12 nodes — but drifting in 3D space with constellation lines
                drawn between siblings of the same family. Bonus: it looks great.
              </div>
            </div>
            <div className="m-cta__btn">
              <KeyButton
                legend="U"
                primary
                onPress={() => { window.location.href = "Landing v11.html#work"; }}
              >
                UNIVERSE
              </KeyButton>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<ManifestApp />);
