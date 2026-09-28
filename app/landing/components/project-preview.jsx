/* Card lock-on frame. Twelve fixed-size segments follow the projected quad
   through transforms only; no per-frame SVG geometry or layout coordinates.
   The bright brackets, soft glow and faint outline retain the existing look. */
function UniverseHoverCard({ project, panelRef }) {
  const segments = React.useRef([]);
  const tabRef = React.useRef(null);
  React.useLayoutEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    // A segment is 28px long in its own layer. Its perpendicular axis stays
    // unit length, keeping the stroke thickness constant at every card scale.
    const place = (index, x, y, dx, dy, length) => {
      const line = segments.current[index];
      if (!line) return;
      const distance = Math.hypot(dx, dy) || 1;
      const ux = dx / distance, uy = dy / distance, scale = length / 28;
      line.style.transform = `matrix(${ux * scale},${uy * scale},${-uy},${ux},${x},${y})`;
    };
    el.__updateHUD = (corners) => {
      const cx = corners.reduce((n, p) => n + p.x, 0) / 4;
      const cy = corners.reduce((n, p) => n + p.y, 0) / 4;
      for (let i = 0; i < 4; i++) {
        const c = corners[i], p = corners[(i + 3) % 4], n = corners[(i + 1) % 4];
        const dx = n.x - c.x, dy = n.y - c.y;
        const px = p.x - c.x, py = p.y - c.y;
        const arm = Math.min(28, .2 * Math.min(Math.hypot(dx, dy), Math.hypot(px, py)));
        const radius = Math.hypot(c.x - cx, c.y - cy) || 1;
        const x = c.x + (c.x - cx) / radius * 7;
        const y = c.y + (c.y - cy) / radius * 7;
        place(i, c.x, c.y, dx, dy, Math.hypot(dx, dy));
        place(4 + i * 2, x, y, px, py, arm);
        place(5 + i * 2, x, y, dx, dy, arm);
      }
      const tl = corners[0];
      if (tabRef.current) tabRef.current.style.transform = `translate3d(${tl.x.toFixed(1)}px, ${tl.y.toFixed(1)}px, 0)`;
    };
    return () => { delete el.__updateHUD; };
  }, [panelRef]);
  return (
    <div className="uhud" ref={panelRef} aria-hidden="true">
      <div className="uhud__lock" key={project.addr}>
        {Array.from({ length: 12 }, (_, i) => <span key={i} className={"uhud__segment " + (i < 4 ? "uhud__outline" : "uhud__bk")} ref={n => { segments.current[i] = n; }} />)}
      </div>
      <div className="uhud__tab" ref={tabRef} key={"tab-" + project.addr}>
        <span className="uhud__tabLabel"><span className="uhud__tabDot" />Open project</span>
      </div>
    </div>
  );
}
window.UniverseHoverCard = UniverseHoverCard;
