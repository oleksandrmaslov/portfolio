/* ============================================================
   ASCII Scrollbar Lab — controller
   Builds a terminal-styled scroll document, mounts all 5 rail
   styles against it, and wires focus + the bracket cursor.
   ============================================================ */
(function () {
  "use strict";
  document.documentElement.classList.add("custom-cursor");

  // ---------- demo document (terminal manifest — enough to scroll) ----------
  const inner = document.getElementById("docInner");
  const SECTIONS = [
    { h: "Index", p: [
      'A position gauge, not an OS widget. Each bar is a column of <span class="sig">monospace cells</span> tracking the real scroll — so the page reads like an instrument readout instead of a browser chrome detail.',
      'Five candidates sit in the right gutter, all bound to <b>this</b> document. Scroll, or drag any rail. Pick the one that belongs on the landing.',
    ]},
    { h: "Selected work", rows: [
      ["001", "Kerfur · ambient OS", "2026 · product"],
      ["002", "Wafer · node atlas", "2026 · webgl"],
      ["003", "Maslov universe grade", "2025 · shader"],
      ["004", "Terminal design system", "2025 · system"],
      ["005", "ASCII photo lens", "2026 · r&d"],
      ["006", "Board-flight transitions", "2025 · motion"],
    ]},
    { h: "Field notes", p: [
      'The thumb should feel <span class="sig">alive</span> but never loud — signal-teal only where it means "you are here". Track stays in the PCB-trace greys.',
      'Glyph choice carries the metaphor: solid blocks read mechanical; the density ramp ties back to the photo lens; corner brackets echo the cursor reticle.',
      'Everything snaps to the 13px mono line grid. No off-grid slugs, no rounded corners — a system, not a candy shop.',
    ]},
    { h: "Parameters", rows: [
      ["W", "rail width", "26px"],
      ["H", "cell line-height", "13px"],
      ["MIN", "min thumb cells", "3"],
      ["RAMP", "density glyphs", "·:-=+*#%@"],
      ["DRAG", "click + drag rail", "→ scrollTop"],
    ]},
    { h: "Behaviour", p: [
      'On <b>hover</b> the active rail lifts its thumb with a faint teal glow and a hairline guide appears. On <b>drag</b> the whole column becomes a slider.',
      'Readout variants (reticle / gauge / segments) float a live percentage that rides the thumb — coordinates for where you are in the node graph.',
      'Coarse-pointer devices fall back to a thin native bar; the glyph rails are a desktop affordance.',
    ]},
    { h: "End of buffer", p: [
      'That is the whole tape. Scroll back up and watch all five reflect the same position in their own dialect.',
    ]},
  ];

  let html = '<div class="eyebrow">SCROLL · POSITION · GAUGE</div>';
  html += '<h1>A scrollbar that <em>speaks monospace.</em></h1>';
  SECTIONS.forEach((s) => {
    html += `<h2>${s.h}</h2>`;
    if (s.p) s.p.forEach((p) => { html += `<p>${p}</p>`; });
    if (s.rows) s.rows.forEach((r) => {
      html += `<div class="row-item"><span class="idx">${r[0]}</span><span class="name">${r[1]}</span><span class="meta">${r[2]}</span></div>`;
    });
  });
  // a little extra air so there is plenty to scroll
  html += '<div style="height:18vh"></div>';
  inner.innerHTML = html;

  // ---------- mount all five rails ----------
  const doc = document.getElementById("doc");
  const gutter = document.getElementById("gutter");
  const bars = [];
  AsciiScrollbar.STYLES.forEach((style, i) => {
    const wrap = document.createElement("div");
    wrap.className = "railwrap" + (i === 0 ? " active" : "");
    wrap.dataset.idx = i;

    const label = document.createElement("div");
    label.className = "railwrap__label";
    label.textContent = AsciiScrollbar.styleLabel(style);
    wrap.appendChild(label);

    const rail = document.createElement("div");
    rail.className = "asbrail";
    wrap.appendChild(rail);

    const num = document.createElement("div");
    num.className = "railwrap__num";
    num.textContent = "0" + (i + 1);
    wrap.appendChild(num);

    gutter.appendChild(wrap);
    // rail must stretch — give it flex via the .asb class the engine adds
    rail.style.flex = "1";
    rail.style.width = "100%";
    rail.style.display = "flex";
    const bar = new AsciiScrollbar(rail, doc, { style });
    bars.push({ bar, wrap, rail });
  });

  // ---------- focus a style (1–5) ----------
  function focus(i) {
    bars.forEach((b, j) => b.wrap.classList.toggle("active", j === i));
  }
  window.addEventListener("keydown", (e) => {
    const n = parseInt(e.key, 10);
    if (n >= 1 && n <= bars.length) focus(n - 1);
  });
  bars.forEach((b, i) => b.wrap.addEventListener("mouseenter", () => focus(i)));

  // keep rails in sync if the doc resizes
  window.addEventListener("resize", () => bars.forEach((b) => b.bar.update()));

  // ---------- bracket cursor ----------
  const cur = document.getElementById("cur");
  window.addEventListener("pointermove", (e) => {
    cur.style.transform = `translate(${e.clientX}px,${e.clientY}px) translate(-50%,-50%)`;
    const overRail = e.target.closest(".asb");
    cur.classList.toggle("hot", !!overRail);
  }, { passive: true });

  // initial paint after fonts settle
  setTimeout(() => bars.forEach((b) => { b.bar._build(); b.bar.update(); }), 120);
})();
