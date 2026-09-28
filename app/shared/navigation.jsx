/* One navigation contract for the landing, case studies and reference routes.
   The landing lends its renderer; other routes use small renders of the same
   objects so opening navigation never needs another WebGL context. */
function PortfolioHeader({ landing = false, section, className = "", context, utility, sound }) {
  const home = landing ? "#title" : "./";
  const universe = () => landing ? window.__mo_universe : null;
  const menuRef = React.useRef(null);
  const restoreRef = React.useRef(null);
  const exitTimerRef = React.useRef(0);
  const openingTimerRef = React.useRef(0);
  const triggerRef = React.useRef(null);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const settleOpening = () => {
    clearTimeout(openingTimerRef.current); openingTimerRef.current = 0;
    universe()?.settleMenu?.();
    if (menuRef.current?.open) {
      document.body.classList.add("mo-menu-settled");
      window.dispatchEvent(new CustomEvent("mo:menu-settled"));
    }
  };
  const finishClose = () => {
    clearTimeout(exitTimerRef.current); exitTimerRef.current = 0;
    clearTimeout(openingTimerRef.current); openingTimerRef.current = 0;
    universe()?.closeMenu?.();
    menuRef.current?.classList.remove("is-leaving");
    menuRef.current?.querySelectorAll("[data-selected]").forEach(el => el.removeAttribute("data-selected"));
    document.body.classList.remove("mo-menu-open", "mo-menu-settled");
    if (restoreRef.current) { restoreRef.current(); restoreRef.current = null; }
    window.dispatchEvent(new CustomEvent("mo:menu", { detail: { open: false } }));
    setMenuOpen(false);
  };
  const closeMenu = () => {
    finishClose();
    // Make the trigger visible before native dialog focus restoration runs.
    if (menuRef.current?.open) menuRef.current.close();
    triggerRef.current?.focus({ preventScroll: true });
  };
  const openMenu = (event) => {
    if (menuRef.current?.open) return;
    const previousPause = window.__mo_universe_pause;
    const instant = event.detail === 0 || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const previousOverflow = document.body.style.overflow;
    restoreRef.current = () => {
      document.body.style.overflow = previousOverflow;
      // Board Flight can update its own pause flag while the menu is open.
      // Re-establish an edge so the single universe loop wakes when appropriate.
      if (landing) { window.__mo_universe_pause = true; window.__mo_universe_pause = previousPause; }
    };
    document.body.style.overflow = "hidden";
    document.body.classList.add("mo-menu-open");
    if (landing) window.__mo_universe_pause = true;
    menuRef.current.dataset.keyboard = instant ? "true" : "false";
    menuRef.current.showModal();
    const hasObjects = universe()?.openMenu?.(menuRef.current, instant);
    menuRef.current.dataset.liveObjects = hasObjects ? "true" : "false";
    window.dispatchEvent(new CustomEvent("mo:menu", { detail: { open: true, dialog: menuRef.current } }));
    if (instant) settleOpening();
    // First-use shader work can delay the animation's first paint. Release
    // the frozen field when the surface actually covers it, not on a clock
    // measured before that paint. The timer covers an interrupted CSS animation.
    else openingTimerRef.current = window.setTimeout(settleOpening, 1000);
    setMenuOpen(true);
  };
  const leaveMenu = (event, href, id) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (exitTimerRef.current) { event.preventDefault(); return; }
    const immediate = event.detail === 0 || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (immediate) { closeMenu(); return; } // Native links remain immediate by keyboard.
    event.preventDefault();
    if (id) event.currentTarget.dataset.selected = "true";
    const duration = universe()?.exitMenu?.(id) || window.MOMenuMotion?.exit || 180;
    menuRef.current.style.setProperty("--menu-exit", `${duration}ms`);
    menuRef.current.classList.add("is-leaving");
    exitTimerRef.current = window.setTimeout(() => {
      const commit = () => {
        closeMenu();
        // The menu has its own ordered-project exit; don't stack a second
        // index animation or wait for models before following the native URL.
        if (href) window.location.href = href;
      };
      if (document.startViewTransition && (!href || href.startsWith("#"))) {
        document.documentElement.classList.add("mo-menu-transition");
        // View-transition snapshotting can suspend animation frames. Keep its
        // update synchronous, or waiting for RAF here can deadlock the capture.
        const transition = document.startViewTransition(() => ReactDOM.flushSync(commit));
        transition.finished.finally(() => document.documentElement.classList.remove("mo-menu-transition")).catch(() => {});
      } else commit();
    }, duration);
  };
  React.useEffect(() => () => {
    clearTimeout(exitTimerRef.current);
    clearTimeout(openingTimerRef.current);
    universe()?.closeMenu?.();
    document.body.classList.remove("mo-menu-open", "mo-menu-settled");
    if (restoreRef.current) restoreRef.current();
  }, []);
  const prefix = landing ? "" : "./";
  const destinations = [
    [prefix + "#work", "Selected work", `${(window.MO_FEATURED_ADDRS || []).length} projects, in detail`, "work"],
    [prefix + "#about", "About me", "The person behind the projects", "about"],
    [prefix + "#contact", "Contact", "Start a conversation", "contact"],
    ["All Projects.html", "All projects", `${(window.MO_PROJECTS || []).length} projects to explore`, "index"],
  ];
  return (
    <>
      <header className={"site-header " + className}>
        <div className="site-header__blur" aria-hidden="true"><div /><div /><div /><div /><div /><div /><div /></div>
        <div className="site-header__home">
          <a className="site-header__brand" href={home} aria-label="Back to the title">M.O.</a>
          {utility && <div className="site-header__utility">{utility}</div>}
        </div>
        <div className="site-header__actions">
          {context && <span className="site-header__context">{context}</span>}
          {sound}
          <button ref={triggerRef} className="lp-menuToggle" onClick={openMenu} aria-expanded={menuOpen} aria-controls="portfolio-menu" aria-haspopup="dialog">
            MENU <svg viewBox="0 0 18 18" width="18" height="18" aria-hidden="true"><path d="M2 6h14M2 12h14" /></svg>
          </button>
        </div>
      </header>
      {/* Native text and links lead; one borrowed canvas renders the four
          objects inside the dialog's top layer, aligned to measured slots. */}
      {ReactDOM.createPortal(<dialog className="lp-menu" id="portfolio-menu" ref={menuRef} aria-label="Portfolio navigation"
        onCancel={(e) => { e.preventDefault(); closeMenu(); }}
        onClose={() => { if (!menuRef.current?.open) finishClose(); }}>
        <div className="lp-menu__surface" aria-hidden="true" onAnimationEnd={settleOpening} />
        <div className="lp-menu__objects" aria-hidden="true" />
        <div className="lp-menu__top">
          <a href={home} onClick={closeMenu} aria-label="Return to the universe">M.O.</a>
          <button onClick={(e) => leaveMenu(e)} autoFocus aria-label="Close menu">CLOSE <svg viewBox="0 0 18 18" width="18" height="18" aria-hidden="true"><path d="m3 3 12 12M3 15 15 3" /></svg></button>
        </div>
        <nav className="lp-menu__links" aria-label="Main navigation">
          {destinations.map(([href, label, description, id], index) => (
            <a key={id} href={href} style={{ "--menu-order": index }} aria-current={section === id ? "location" : undefined}
              onPointerEnter={() => universe()?.focusMenu?.(id)}
              onPointerLeave={() => universe()?.focusMenu?.(null)}
              onPointerMove={(e) => { if (e.pointerType !== "touch") universe()?.pointMenu?.(id, e.clientX, e.clientY); }}
              onFocus={(e) => { if (e.currentTarget.matches(":focus-visible")) universe()?.focusMenu?.(id, true); }}
              onBlur={() => universe()?.focusMenu?.(null, true)}
              onClick={(e) => leaveMenu(e, href, id)}>
              <span className="lp-menu__copy"><span className="lp-menu__label">{
                id === "work" ? <>Selected <em>work</em></>
                : id === "about" ? <>About <em>me</em></>
                : label
              }</span>
              <span className="lp-menu__description">{description}</span></span>
              <span className="lp-menu__object" data-menu-object={id} aria-hidden="true">
                <img src={"public/menu/" + id + ".webp"} width="480" height="248" alt="" loading="lazy" decoding="async" />
              </span>
              <svg viewBox="0 0 32 32" width="32" height="32" aria-hidden="true"><path d="M5 16h21m-8-8 8 8-8 8" /></svg>
            </a>
          ))}
        </nav>
        <div className="lp-menu__bottom">
          <a href={home} onClick={closeMenu}><b>0x00</b><span>Oleksandr Maslov</span></a>
          <span>Hardware · firmware · interaction</span>
        </div>
      </dialog>, document.body)}
    </>
  );
}


window.PortfolioHeader = PortfolioHeader;
