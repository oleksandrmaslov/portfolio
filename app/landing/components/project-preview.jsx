/* ============================================================
   M.O. SYSTEM — Landing project preview · "lock-on" targeting frame
   ------------------------------------------------------------
   The card face already renders everything (NODE addr, year, name,
   sub, stack, OPEN →), so the hover does NOT repeat any of it.
   Instead it's a pure targeting reticle that LOCKS onto the card:

     · four corner brackets drawn at the card's 4 PROJECTED corners,
       so they hug the card's true (rotated) shape — not an upright
       bounding box. Fixes the "broken border while spinning" bug.
     · a faint full outline of the quad
     · a small upright LOCK tab pinned to the top-left corner

   Geometry is updated imperatively every frame by the universe loop
   via panelRef.current.__updateHUD(corners) — corners are 4 {x,y}
   in mount px, clockwise from top-left. No viewport clamping, so the
   frame tracks the card exactly and clips at the edge instead of
   detaching to the screen corner.
   ============================================================ */

function UniverseHoverCard({ project, panelRef }) {
  const svgRef     = React.useRef(null);
  const outlineRef = React.useRef(null);
  const bkRef      = React.useRef([]);
  const tabRef     = React.useRef(null);

  React.useLayoutEffect(() => {
    const el = panelRef.current;
    if (!el) return;

    // place one corner bracket: arms run from the (outward-nudged) corner C
    // toward its two neighbours P and N, so each bracket aligns with the two
    // card edges meeting at that corner.
    const setBracket = (poly, C, P, N, cx, cy) => {
      if (!poly) return;
      let ox = C.x - cx, oy = C.y - cy;
      const ol = Math.hypot(ox, oy) || 1;
      const OFF = 7;                       // nudge outward so brackets frame, not cover
      const Cx = C.x + (ox / ol) * OFF;
      const Cy = C.y + (oy / ol) * OFF;
      let dpx = P.x - C.x, dpy = P.y - C.y; const dpl = Math.hypot(dpx, dpy) || 1;
      let dnx = N.x - C.x, dny = N.y - C.y; const dnl = Math.hypot(dnx, dny) || 1;
      const arm = Math.min(28, 0.20 * Math.min(dpl, dnl));
      const p1x = Cx + (dpx / dpl) * arm, p1y = Cy + (dpy / dpl) * arm;
      const p2x = Cx + (dnx / dnl) * arm, p2y = Cy + (dny / dnl) * arm;
      poly.setAttribute(
        "points",
        p1x.toFixed(1) + "," + p1y.toFixed(1) + " " +
        Cx.toFixed(1)  + "," + Cy.toFixed(1)  + " " +
        p2x.toFixed(1) + "," + p2y.toFixed(1)
      );
    };

    // corners: [TL, TR, BR, BL] clockwise
    el.__updateHUD = (corners) => {
      const TL = corners[0], TR = corners[1], BR = corners[2], BL = corners[3];
      const cx = (TL.x + TR.x + BR.x + BL.x) / 4;
      const cy = (TL.y + TR.y + BR.y + BL.y) / 4;

      const outline = outlineRef.current;
      if (outline) outline.setAttribute(
        "points",
        TL.x.toFixed(1) + "," + TL.y.toFixed(1) + " " +
        TR.x.toFixed(1) + "," + TR.y.toFixed(1) + " " +
        BR.x.toFixed(1) + "," + BR.y.toFixed(1) + " " +
        BL.x.toFixed(1) + "," + BL.y.toFixed(1)
      );

      const b = bkRef.current;
      setBracket(b[0], TL, BL, TR, cx, cy);   // TL: arms → BL & TR
      setBracket(b[1], TR, TL, BR, cx, cy);   // TR: arms → TL & BR
      setBracket(b[2], BR, TR, BL, cx, cy);   // BR: arms → TR & BL
      setBracket(b[3], BL, BR, TL, cx, cy);   // BL: arms → BR & TL

      // upright LOCK tab pinned just above the top-left corner
      const tab = tabRef.current;
      if (tab) { tab.style.left = TL.x + "px"; tab.style.top = TL.y + "px"; }
    };

    return () => { if (el) delete el.__updateHUD; };
  }, [panelRef]);

  return (
    <div className="uhud" ref={panelRef}>
      <svg className="uhud__svg" ref={svgRef} aria-hidden="true">
        {/* re-key on addr so the lock-in animation replays per target */}
        <g className="uhud__lock" key={project.addr}>
          <polygon className="uhud__outline" ref={outlineRef} points="0,0 0,0 0,0 0,0" />
          <polyline className="uhud__bk" ref={(n) => (bkRef.current[0] = n)} points="" />
          <polyline className="uhud__bk" ref={(n) => (bkRef.current[1] = n)} points="" />
          <polyline className="uhud__bk" ref={(n) => (bkRef.current[2] = n)} points="" />
          <polyline className="uhud__bk" ref={(n) => (bkRef.current[3] = n)} points="" />
        </g>
      </svg>
      <div className="uhud__tab" ref={tabRef} key={"tab-" + project.addr}>
        <span className="uhud__tabDot" />
        <span>LOCK</span>
      </div>
    </div>
  );
}

window.UniverseHoverCard = UniverseHoverCard;
