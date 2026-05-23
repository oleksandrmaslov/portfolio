/* ============================================================
   M.O. SYSTEM — Sections part 2: Grid, Motion, Components, Voice
   ============================================================ */

const { useState: useStateS, useEffect: useEffectS, useRef: useRefS } = React;

/* ============================================================
   FIBONACCI GRID & SPACING
   ============================================================ */
const FIB = [
  { name: "s-1",  val: 2,   use: "hairline tweaks" },
  { name: "s-2",  val: 3,   use: "icon nudges" },
  { name: "s-3",  val: 5,   use: "inline gap" },
  { name: "s-4",  val: 8,   use: "tight stack" },
  { name: "s-5",  val: 13,  use: "row gap" },
  { name: "s-6",  val: 21,  use: "card padding" },
  { name: "s-7",  val: 34,  use: "section internals" },
  { name: "s-8",  val: 55,  use: "block separation" },
  { name: "s-9",  val: 89,  use: "section padding" },
  { name: "s-10", val: 144, use: "chapter break" },
  { name: "s-11", val: 233, use: "hero breathe" },
];

function FibNest() {
  // nested rectangles in golden-ratio proportions — no spiral drawn
  const rects = [
    { x: 0,   y: 0,   w: 89, h: 55, n: "89" },
    { x: 89,  y: 0,   w: 55, h: 55, n: "55" },
    { x: 89,  y: 55,  w: 34, h: 34, n: "34" },
    { x: 123, y: 55,  w: 21, h: 21, n: "21" },
    { x: 123, y: 76,  w: 13, h: 13, n: "13" },
    { x: 136, y: 76,  w: 8,  h: 8,  n: "8"  },
  ];
  return (
    <div className="fibNest">
      {rects.map((r, i) => (
        <div key={i} className="fibNest__r" style={{
          left:   (r.x / 144 * 100) + "%",
          top:    (r.y / 89  * 100) + "%",
          width:  (r.w / 144 * 100) + "%",
          height: (r.h / 89  * 100) + "%",
        }}>
          <span className="fibNest__lbl" style={{ top: 6, left: 8 }}>{r.n}</span>
        </div>
      ))}
      <span className="fibNest__lbl" style={{ bottom: 8, right: 8, color: "var(--signal)" }}>φ = 1.6180339887</span>
    </div>
  );
}

function GridSection() {
  return (
    <Section num="03" title="Grid &amp; Spacing" id="grid"
      lede="Every measurement is a Fibonacci number. No off-grid values. The spiral itself is never drawn — only its proportions, baked into spacing, type, and layout. This is the invisible scaffold."
      meta={<>11 steps · 2px → 233px · pure Fib</>}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--s-7)" }}>
        <div className="fibBox">
          <div className="tile__label">SPACING RAMP</div>
          <div className="fibScale" style={{ marginTop: "var(--s-5)" }}>
            {FIB.map(f => (
              <div key={f.name} className="fibScale__row">
                <span className="fibScale__name">{f.name}</span>
                <span className="fibScale__val">{f.val}px</span>
                <div className="fibScale__bar" style={{ width: Math.min(f.val, 233) + "px" }} />
                <span className="fibScale__use">{f.use}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="fibBox">
          <div className="tile__label">PROPORTIONAL TILING (φ)</div>
          <p className="t-meta" style={{ marginTop: "var(--s-5)", marginBottom: "var(--s-6)", color: "var(--ash)", maxWidth: "42ch", lineHeight: 1.5 }}>
            Layout columns, image crops, and module sizes lock to ratios drawn from this nested tile. No spiral drawn — only the rectangles that compose it.
          </p>
          <FibNest />
          <div style={{ marginTop: "var(--s-6)", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--s-5)" }}>
            <div>
              <div className="tile__label">READING</div>
              <div className="t-meta" style={{ color: "var(--bone)", marginTop: "var(--s-3)" }}>610px <span style={{ color: "var(--ghost)" }}>· φ × column</span></div>
            </div>
            <div>
              <div className="tile__label">COLUMN</div>
              <div className="t-meta" style={{ color: "var(--bone)", marginTop: "var(--s-3)" }}>987px <span style={{ color: "var(--ghost)" }}>· φ × canvas</span></div>
            </div>
            <div>
              <div className="tile__label">CANVAS</div>
              <div className="t-meta" style={{ color: "var(--bone)", marginTop: "var(--s-3)" }}>1597px <span style={{ color: "var(--ghost)" }}>· F₁₇</span></div>
            </div>
            <div>
              <div className="tile__label">GUTTER</div>
              <div className="t-meta" style={{ color: "var(--bone)", marginTop: "var(--s-3)" }}>55px <span style={{ color: "var(--ghost)" }}>· F₁₀</span></div>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}

/* ============================================================
   MOTION
   ============================================================ */
const CURVES = [
  { name: "e-out",    spec: "cubic(0.16, 1, 0.3, 1)",      use: "default reveal · expo-out",   d: "M 0 100 C 16 0, 70 0, 200 0" },
  { name: "e-in-out", spec: "cubic(0.83, 0, 0.17, 1)",     use: "dramatic camera move",        d: "M 0 100 C 80 100, 120 0, 200 0" },
  { name: "e-snap",   spec: "cubic(0.34, 1.56, 0.64, 1)",  use: "signal snap · overshoot",     d: "M 0 100 C 70 100, 130 -30, 200 0" },
  { name: "linear",   spec: "linear",                       use: "ambient · canvas pulses",     d: "M 0 100 L 200 0" },
];

const DURATIONS = [
  { name: "instant",  val: "80ms",   use: "state flicker · key-flash" },
  { name: "tap",      val: "140ms",  use: "click feedback · button press" },
  { name: "fast",     val: "220ms",  use: "hover transitions" },
  { name: "base",     val: "380ms",  use: "default reveal · card lift" },
  { name: "slow",     val: "620ms",  use: "section reveal · stagger" },
  { name: "cinema",   val: "1000ms", use: "hero camera · route change" },
];

function MotionSection() {
  const [run, setRun] = useStateS({});

  const trigger = (name) => {
    setRun(r => ({ ...r, [name]: false }));
    requestAnimationFrame(() => setRun(r => ({ ...r, [name]: true })));
  };

  return (
    <Section num="05" title="Motion" id="motion"
      lede="Motion treats every transition as signal propagation. Durations are short by default; easing favours expo-out so things arrive and settle. Nothing eases linearly except ambient — only signals are continuous."
      meta={<>4 curves · 6 durations · 60fps</>}>
      <div className="motionGrid">
        {CURVES.map(c => (
          <div key={c.name} className={"curve " + (run[c.name] ? "run" : "")} onMouseEnter={() => trigger(c.name)}>
            <svg className="curve__svg" viewBox="0 0 200 100" preserveAspectRatio="none">
              <line x1="0" y1="100" x2="200" y2="100" stroke="var(--hairline)" />
              <line x1="0" y1="0" x2="0" y2="100" stroke="var(--hairline)" />
              <path className="curve__path" d={c.d} />
            </svg>
            <div className="curve__dot" />
            <div className="curve__name">{c.name}</div>
            <div className="curve__spec">{c.spec}<br />{c.use}</div>
          </div>
        ))}
      </div>
      <div className="durations">
        {DURATIONS.map(d => (
          <div key={d.name} className="dur">
            <div className="dur__name">--d-{d.name}</div>
            <div className="dur__val">{d.val}</div>
            <div className="dur__use">{d.use}</div>
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ============================================================
   COMPONENTS — buttons, links, node card, badges
   ============================================================ */
/* KeyButton — a physical keycap. Press = depress + LED flash. */
function KeyButton({ children, legend = "↵", primary, onPress }) {
  const [pressed, setPressed] = useStateS(false);
  const [lit, setLit] = useStateS(false);

  const fire = () => {
    setPressed(true);
    setLit(true);
    onPress && onPress();
    setTimeout(() => setPressed(false), 140);
    setTimeout(() => setLit(false), 520);
  };

  const onKey = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fire(); } };

  return (
    <button
      className={"key " + (pressed ? "key--down " : "") + (lit ? "key--lit " : "") + (primary ? "key--primary" : "")}
      onClick={fire}
      onKeyDown={onKey}
    >
      <span className="key__cap">
        <span className="key__legendTop">{legend}</span>
        <span className="key__label">{children}</span>
      </span>
      <span className="key__shadow" aria-hidden="true" />
    </button>
  );
}

function ComponentsSection() {
  return (
    <Section num="08" title="Components" id="components"
      lede="A small kit. Everything earns its place. The node card is the primary content carrier — each project across the portfolio renders as a node. Buttons are bordered, magnetic, and quiet. Badges report state."
      meta={<>5 base components · expanding</>}>
      <div className="componentsGrid">

        <div className="compBlock">
          <div className="compBlock__title"><span>KEY · keyboard keycap, depress + LED flash</span><span>press me</span></div>
          <div className="compBlock__stage">
            <KeyButton primary legend="↵">Open case</KeyButton>
            <KeyButton legend="⌥">View source</KeyButton>
            <KeyButton legend="⎋">More</KeyButton>
          </div>
        </div>

        <div className="compBlock">
          <div className="compBlock__title"><span>LINK · signal underline</span><span>inline</span></div>
          <div className="compBlock__stage" style={{ flexDirection: "column", alignItems: "flex-start", gap: "var(--s-4)" }}>
            <p style={{ fontSize: "var(--fs-lead)", color: "var(--ash)" }}>
              Featured in <span className="t-link">CSSDesignAwards</span> for the <span className="t-link">Wafer firmware writeup</span>.
            </p>
            <p style={{ fontSize: "var(--fs-meta)", color: "var(--ash)", fontFamily: "var(--ff-mono)" }}>
              <span className="t-link">github.com/oleksandrmaslov</span>
            </p>
          </div>
        </div>

        <div className="compBlock" style={{ gridColumn: "span 2" }}>
          <div className="compBlock__title"><span>NODE · project carrier</span><span>04 instances shown</span></div>
          <div className="compBlock__stage" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--s-5)", padding: 0, alignItems: "stretch" }}>
            {[
              { addr: "0x01", name: "Wafer", desc: "36-key ultrathin split keyboard. 4–8 mm aluminium case, magnetic mechanism, NPM1300 PMIC, Sharp memory display.", status: "ACTIVE", year: "2025", stack: "ZMK · KiCad · nRF52840" },
              { addr: "0x02", name: "Kerfur", desc: "Event-driven firmware on nRF52840. 10,000+ LoC C, behaviour engine, IMU motion stack, OLED face, BLE peer encounters.", status: "ACTIVE", year: "2025—", stack: "Zephyr · LVGL · ANCS" },
              { addr: "0x03", name: "ZMK Pointing Accel.", desc: "Public ZMK input processor for smooth, configurable pointer acceleration on trackpads. ★ 25 · ⑂ 10.", status: "OSS", year: "2025", stack: "C · Devicetree" },
              { addr: "0x05", name: "Tactical Flashlight", desc: "Volunteer for Energy for Ukraine. Firmware in C for ARM Cortex-M0 (PY32F002A). Two modes, SOS, battery indication.", status: "LIVE", year: "12/2025", stack: "C · ARM · KiCad" },
            ].map((n, i) => (
              <div key={i} className="node">
                <div className="node__head">
                  <span className="node__addr">node {n.addr}</span>
                  <div className="node__status">
                    <span className="node__statusDot" />
                    <span>{n.status}</span>
                  </div>
                </div>
                <div className="node__name">{n.name}</div>
                <div className="node__desc">{n.desc}</div>
                <div className="node__foot">
                  <span>{n.stack}</span>
                  <span>{n.year}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="compBlock">
          <div className="compBlock__title"><span>BADGE · state report</span><span>3 tones</span></div>
          <div className="compBlock__stage">
            <span className="badge badge--signal"><span style={{ width: 5, height: 5, background: "var(--signal)", borderRadius: "50%", display: "inline-block" }} />LIVE</span>
            <span className="badge">OSS · ★ 25</span>
            <span className="badge badge--pulse">v0.1 · WIP</span>
            <span className="badge">2025 — present</span>
          </div>
        </div>

        <div className="compBlock">
          <div className="compBlock__title"><span>STATUS LINE · footer / shell</span><span>monospaced</span></div>
          <div className="compBlock__stage" style={{ width: "100%" }}>
            <div className="t-meta" style={{ color: "var(--ghost)", display: "flex", justifyContent: "space-between", width: "100%" }}>
              <span><span style={{ color: "var(--signal)" }}>●</span> ONLINE</span>
              <span>MUC · 14:13 GMT+1</span>
              <span>v0.1.0</span>
              <span>maslov.system</span>
            </div>
          </div>
        </div>

      </div>
    </Section>
  );
}

/* ============================================================
   VOICE
   ============================================================ */
function VoiceSection() {
  return (
    <Section num="13" title="Voice &amp; Lexicon" id="voice"
      lede="Write like a datasheet that respects the reader. Short. Specific. Numerical when possible. Confident, never loud. No emoji. No exclamation marks. The signal does the celebrating."
      meta={<>3 principles · 1 vocabulary</>}>
      <div className="voiceGrid">
        <div className="voiceCol">
          <h4>WE WRITE</h4>
          <p>"Wafer. A 36-key split keyboard. 4–8 mm aluminium case. Magnetic. Battery measured directly off the NPM1300."</p>
          <p>"Kerfur runs an event bus. Posts and consumers. Pet modes resolve through hysteresis on confidence thresholds."</p>
          <p>"Open source. <span className="t-serif">v0.1.0</span>. Shipped on a Tuesday."</p>
        </div>
        <div className="voiceCol">
          <h4>WE DO NOT</h4>
          <div className="bad">
            <p>"Wafer is a beautifully crafted, deeply ergonomic keyboard that represents years of obsessive design ✨"</p>
            <p>"Discover the future of typing with our revolutionary new input device!"</p>
            <p>"Innovative · Disruptive · Game-changing"</p>
          </div>
        </div>
      </div>

      <div style={{ marginTop: "var(--s-9)" }}>
        <div className="tile__label">LEXICON · terms this system uses</div>
        <div className="lexicon" style={{ marginTop: "var(--s-5)" }}>
          {[
            { term: "node",     def: "A project. Every featured work is a node on the bus.",        use: "node 0x01 · Wafer" },
            { term: "signal",   def: "A live state. Cyan. Used for hover, active, and 'on'.",        use: "color · #00f0c8" },
            { term: "trace",    def: "A connection between things. Hairline · sometimes lit.",       use: "PCB metaphor" },
            { term: "pulse",    def: "A discrete event. A click, a key-press, a warning.",            use: "ff5b3b · brief" },
            { term: "channel",  def: "A category or grouping. Hardware, firmware, OSS, volunteer.",   use: "filter affordance" },
            { term: "address",  def: "A node identifier. Always hex. Always lowercase.",              use: "0x01 → 0x0f" },
            { term: "boot",     def: "First load. ASCII terminal. Cinematic but skippable.",          use: "≤1.5s" },
            { term: "ambient",  def: "Background activity. Never demands attention.",                 use: "ambient signal pulses" },
          ].map(l => (
            <div key={l.term} className="lexicon__row">
              <span className="lexicon__term">{l.term}</span>
              <span className="lexicon__def">{l.def}</span>
              <span className="lexicon__use">→ {l.use}</span>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

/* ============================================================
   PRINCIPLES (closing)
   ============================================================ */
function PrinciplesSection() {
  return (
    <Section num="21" title="Principles" id="principles"
      lede="Five rules to check every decision against."
      meta={<>5 / 5 active</>}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "var(--s-5)" }}>
        {[
          { n: "01", t: "Substrate is silent",       d: "The page is a quiet circuit board. Nothing decorates. Only the work and its signals." },
          { n: "02", t: "One signal speaks",          d: "Cyan is the only accent. If everything is highlighted, nothing is. Restraint is the brief." },
          { n: "03", t: "Numbers are honest",         d: "Lines of code. Star counts. Voltages. Use real numbers. The portfolio is a spec sheet." },
          { n: "04", t: "Motion propagates",          d: "Transitions ease out, like a signal arriving and settling. Linear only for ambient drift." },
          { n: "05", t: "Fibonacci is invisible",     d: "Every measurement is a Fib number. The spiral is never drawn. The proof is in the proportions." },
        ].map(p => (
          <div key={p.n} className="tile">
            <div className="tile__label">{p.n}</div>
            <div style={{ fontFamily: "var(--ff-display)", fontSize: 24, lineHeight: 1.15, color: "var(--bone)", letterSpacing: "-0.02em", marginBottom: "var(--s-5)" }}>{p.t}</div>
            <div style={{ fontSize: "var(--fs-meta)", color: "var(--ash)", lineHeight: 1.6 }}>{p.d}</div>
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ============================================================
   FOOTER
   ============================================================ */
function Footer() {
  return (
    <footer className="footer canvas">
      <div className="footer__big">Ready when you are<span style={{ color: "var(--signal)" }}>.</span></div>
      <div>
        <div className="t-caps" style={{ color: "var(--ghost)", marginBottom: "var(--s-4)" }}>System</div>
        <div style={{ color: "var(--bone)" }}>M.O. ∥ v0.1.0</div>
        <div style={{ color: "var(--ash)" }}>Foundation · 2026</div>
      </div>
      <div>
        <div className="t-caps" style={{ color: "var(--ghost)", marginBottom: "var(--s-4)" }}>Author</div>
        <div style={{ color: "var(--bone)" }}>Maslov Oleksandr</div>
        <div style={{ color: "var(--ash)" }}>Kyiv → Munich</div>
      </div>
      <div>
        <div className="t-caps" style={{ color: "var(--ghost)", marginBottom: "var(--s-4)" }}>Next</div>
        <div style={{ color: "var(--bone)" }}>Landing page · hero</div>
        <div style={{ color: "var(--ash)" }}>3D Wafer reveal</div>
      </div>
    </footer>
  );
}

/* ============================================================
   PHOTO TILE — "Inspecting probe" hover effect.
   Image stays low-contrast / monochrome.
   On hover, a circular aperture follows the cursor revealing
   the full-color version through the dark substrate.
   ============================================================ */
function PhotoTile({ src, label, addr, year }) {
  const ref = useRefS(null);
  const [active, setActive] = useStateS(false);
  const [pos, setPos] = useStateS({ x: 50, y: 50 });

  const onMove = (e) => {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    setPos({
      x: ((e.clientX - r.left) / r.width)  * 100,
      y: ((e.clientY - r.top)  / r.height) * 100,
    });
  };

  const style = {
    "--px": pos.x + "%",
    "--py": pos.y + "%",
  };

  return (
    <figure
      ref={ref}
      className={"photoTile " + (active ? "photoTile--on" : "")}
      style={style}
      onMouseEnter={() => setActive(true)}
      onMouseMove={onMove}
      onMouseLeave={() => setActive(false)}
    >
      <div className="photoTile__base" style={{ backgroundImage: `url(${src})` }} />
      <div className="photoTile__lens" style={{ backgroundImage: `url(${src})` }} />
      <div className="photoTile__crosshair">
        <span className="photoTile__crossH" />
        <span className="photoTile__crossV" />
        <span className="photoTile__readout">x{pos.x.toFixed(1)} y{pos.y.toFixed(1)}</span>
      </div>
      <figcaption className="photoTile__caption">
        <span className="photoTile__addr">{addr}</span>
        <span className="photoTile__label">{label}</span>
        <span className="photoTile__year">{year}</span>
      </figcaption>
    </figure>
  );
}

function PhotoSection() {
  // Procedural placeholders generated as data-URI SVGs so we ship
  // without external image assets. Real renders will drop in here.
  const dataUrl = (svg) => "data:image/svg+xml;utf8," + encodeURIComponent(svg);

  const svgKey = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 400'>
    <defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
      <stop offset='0' stop-color='#0a0e16'/><stop offset='1' stop-color='#1a2030'/>
    </linearGradient></defs>
    <rect width='600' height='400' fill='url(#g)'/>
    <g fill='#0d1018' stroke='#2a3144' stroke-width='1'>
      ${[...Array(36)].map((_,i)=>{const c=i%6,r=Math.floor(i/6);return `<rect x='${60+c*80}' y='${50+r*55}' width='62' height='42' rx='4' fill='#0e1320' stroke='#3a4256'/>`}).join("")}
    </g>
    <text x='30' y='30' fill='#5b6478' font-family='monospace' font-size='12'>WAFER · TOP VIEW · 36 keys</text>
  </svg>`;

  const svgPet = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 400'>
    <rect width='600' height='400' fill='#080b14'/>
    <circle cx='300' cy='200' r='130' fill='#0d1018' stroke='#3a4256'/>
    <rect x='240' y='160' width='120' height='60' rx='6' fill='#04060d' stroke='#5b6478'/>
    <circle cx='275' cy='190' r='8' fill='#e6e8ee'/><circle cx='325' cy='190' r='8' fill='#e6e8ee'/>
    <text x='30' y='30' fill='#5b6478' font-family='monospace' font-size='12'>KERFUR · OLED FACE · IDLE</text>
  </svg>`;

  const svgPcb = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 400'>
    <rect width='600' height='400' fill='#0a1410'/>
    <g stroke='#1a3a2a' fill='none' stroke-width='1'>
      ${[...Array(20)].map((_,i)=>`<line x1='${30+i*30}' y1='30' x2='${30+i*30}' y2='370'/>`).join("")}
      ${[...Array(13)].map((_,i)=>`<line x1='30' y1='${30+i*28}' x2='570' y2='${30+i*28}'/>`).join("")}
    </g>
    <g fill='#0a1a14' stroke='#3aa884' stroke-width='1.5'>
      <rect x='80' y='80' width='100' height='60' rx='3'/>
      <rect x='220' y='100' width='60' height='40' rx='3'/>
      <rect x='340' y='80' width='180' height='110' rx='3'/>
      <circle cx='150' cy='280' r='30'/>
      <rect x='340' y='240' width='80' height='80' rx='3'/>
    </g>
    <text x='30' y='30' fill='#5b6478' font-family='monospace' font-size='12'>PCB · WAFER · 2 LAYER</text>
  </svg>`;

  return (
    <Section num="34" title="Imagery" id="imagery"
      lede="Photos are treated like inspection samples. The base render lives quiet — desaturated, dim. Hover reveals the work through a moving aperture, the way you'd inspect a finished board under a loupe."
      meta={<>3 instances · placeholder renders</>}>
      <div className="photoGrid">
        <PhotoTile src={dataUrl(svgKey)} addr="0x01"  label="Wafer · keyboard"  year="2025" />
        <PhotoTile src={dataUrl(svgPet)} addr="0x02"  label="Kerfur · OLED"      year="2025" />
        <PhotoTile src={dataUrl(svgPcb)} addr="0x03"  label="PCB · 2-layer"     year="2025" />
      </div>
      <p className="t-meta" style={{ marginTop: "var(--s-6)", color: "var(--ghost)" }}>
        Real renders will replace placeholders. The treatment is content-agnostic — works on hardware, schematics, screenshots, portraits.
      </p>
    </Section>
  );
}

window.KeyButton = KeyButton;
window.GridSection = GridSection;
window.MotionSection = MotionSection;
window.ComponentsSection = ComponentsSection;
window.VoiceSection = VoiceSection;
window.PrinciplesSection = PrinciplesSection;
window.Footer = Footer;
window.PhotoTile = PhotoTile;
window.PhotoSection = PhotoSection;
