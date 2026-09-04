/* ============================================================
   M.O. SYSTEM — Design foundations
   ============================================================ */

const { useState: useStateS, useEffect: useEffectS, useRef: useRefS } = React;

/* ============================================================
   HERO — system brief
   ============================================================ */
const BUS_NODES = [
  { id: "color",       label: "01 · COLOR" },
  { id: "type",        label: "02 · TYPE" },
  { id: "grid",        label: "03 · GRID" },
  { id: "motion",      label: "05 · MOTION" },
  { id: "components",  label: "08 · COMPONENTS" },
  { id: "voice",       label: "13 · VOICE" },
  { id: "principles",  label: "21 · PRINCIPLES" },
];

function Hero() {
  return (
    <section className="hero" id="brief">
      <div className="hero__overline">M.O. ∥ Design system foundation · v0.1.0 · Munich · DE</div>
      <h1 className="hero__title">
        A system for<br />
        building things<br />
        <em>that speak</em> to each other.
      </h1>

      <div className="hero__stage">
        <div className="hero__stageCol">
          <p className="hero__lede">
            This is the visual operating system behind <span className="t-link">Maslov Oleksandr</span>'s portfolio —
            a quiet, signal-driven foundation for showing hardware, firmware, and the small inventions in between.
            Built on an invisible Fibonacci scaffold, lit by a single signal cyan, narrated like a datasheet.
          </p>
          <div className="hero__metaCol">
            <div className="hero__metaRow"><span className="hero__metaKey">Author</span><span className="hero__metaVal">Maslov Oleksandr</span></div>
            <div className="hero__metaRow"><span className="hero__metaKey">Discipline</span><span className="hero__metaVal">Embedded · Firmware · Hardware</span></div>
            <div className="hero__metaRow"><span className="hero__metaKey">Location</span><span className="hero__metaVal">Kyiv → Munich</span></div>
            <div className="hero__metaRow"><span className="hero__metaKey">Metaphor</span><span className="hero__metaVal">Event bus · message queue</span></div>
            <div className="hero__metaRow"><span className="hero__metaKey">Substrate</span><span className="hero__metaVal">Deep space + signal cyan</span></div>
            <div className="hero__metaRow"><span className="hero__metaKey">Grid</span><span className="hero__metaVal">Fibonacci · invisible</span></div>
          </div>
        </div>
        <div className="hero__stageBus">
          <EventBus3D sections={BUS_NODES} />
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   SECTION WRAPPER
   ============================================================ */
function Section({ num, title, lede, meta, id, children }) {
  return (
    <section className="section" id={id}>
      <header className="section__head">
        <div className="section__num">{num}</div>
        <div>
          <h2 className="section__title">{title}</h2>
          {lede && <p className="section__lede">{lede}</p>}
        </div>
        <div className="section__meta">{meta}</div>
      </header>
      {children}
    </section>
  );
}

/* ============================================================
   COLOR
   ============================================================ */
const COLORS = [
  { name: "void",       hex: "#04060d", role: "page substrate · 100% surfaces" , use: "Background. The space signals travel through." },
  { name: "space",      hex: "#07090f", role: "elevated background"            , use: "Sticky bars, sub-pages." },
  { name: "carbon",     hex: "#0d1018", role: "card / surface"                 , use: "Default container fill." },
  { name: "carbon-2",   hex: "#131724", role: "surface hover"                  , use: "Hover lift." },
  { name: "trace",      hex: "#1e2536", role: "PCB-trace silver"               , use: "Strong dividers, key strokes." },
  { name: "hairline",   hex: "#232a3a", role: "dividers"                       , use: "1px lines everywhere." },
  { name: "bone",       hex: "#e6e8ee", role: "primary text"                   , use: "Headlines, body." },
  { name: "ash",        hex: "#9aa3b3", role: "secondary text"                 , use: "Lede, supporting copy." },
  { name: "ghost",      hex: "#5b6478", role: "tertiary / meta"                , use: "Labels, captions, timestamps." },
  { name: "signal",     hex: "#00f0c8", role: "the one accent"                 , use: "Live, on-state, single point of attention." },
  { name: "signal-dim", hex: "#00a88c", role: "signal trail"                   , use: "Decaying state, secondary trace." },
  { name: "pulse",      hex: "#ff5b3b", role: "warning / pressed"              , use: "Errors, destructive, key-press flash." },
];

function ColorSection() {
  const copy = (hex) => navigator.clipboard?.writeText(hex);
  return (
    <Section num="01" title="Color" id="color"
      lede="One substrate, one signal. The interface is graphite and ink; only the things that are alive — a live link, a press, an active node — speak in cyan. Restraint is the brief."
      meta={<>12 tokens · 1 accent · 0 gradients</>}>
      <div className="colorGrid">
        {COLORS.map(c => (
          <div key={c.name} className="swatch" onClick={() => copy(c.hex)}>
            <div className="swatch__sample" style={{ background: c.hex, ...(c.name.startsWith("signal") ? { boxShadow: `inset 0 0 80px ${c.hex}30` } : {}) }}>
              <span className="swatch__copy">click to copy</span>
            </div>
            <div className="swatch__meta">
              <div className="swatch__name">{c.name}</div>
              <div className="swatch__row">
                <span>{c.hex}</span>
                <span>{c.role}</span>
              </div>
              <div className="swatch__use">{c.use}</div>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ============================================================
   TYPOGRAPHY
   ============================================================ */
const TYPE_DISPLAY = [
  { name: "d1", clamp: "clamp(72px, 12vw, 200px)",  render: 118, tr: "--tr-tightest", text: "Wafer" },
  { name: "d2", clamp: "clamp(56px, 8.5vw, 144px)", render: 92,  tr: "--tr-tighter",  text: "Maslov Oleksandr" },
  { name: "d3", clamp: "clamp(40px, 5.8vw, 80px)",  render: 68,  tr: "--tr-display",  text: "Selected projects" },
  { name: "d4", clamp: "clamp(29px, 3.4vw, 52px)",  render: 46,  tr: "--tr-display",  text: "Embedded systems" },
  { name: "d5", clamp: "clamp(21px, 2.5vw, 34px)",  render: 32,  tr: "--tr-head",     text: "Kerfur · embedded pet" },
  { name: "d6", clamp: "clamp(19px, 2.2vw, 30px)",  render: 26,  tr: "--tr-body",     text: "Event-driven firmware on nRF52840" },
  { name: "d7", clamp: "clamp(14px, 1.15vw, 17px)", render: 17,  tr: "--tr-body",     text: "Smooth pointer acceleration for trackpads" },
];

const TYPE_STATIC = [
  { name: "h2",    rem: "4rem",      px: 64, fam: "Geist",      weight: 400, tr: "--tr-head",  text: "Embedded systems" },
  { name: "h3",    rem: "2.625rem",  px: 42, fam: "Geist",      weight: 500, tr: "--tr-head",  text: "Kerfur · embedded pet" },
  { name: "h4",    rem: "1.75rem",   px: 28, fam: "Geist",      weight: 500, tr: "--tr-tight", text: "BLE peripheral · ANCS" },
  { name: "lead",  rem: "1.3125rem", px: 21, fam: "Geist",      weight: 400, tr: "--tr-body",  text: "Event-driven firmware on nRF52840" },
  { name: "body",  rem: "1rem",      px: 16, fam: "Geist",      weight: 400, tr: "--tr-body",  text: "Smooth pointer acceleration for trackpads" },
  { name: "meta",  rem: "0.8125rem", px: 13, fam: "Geist Mono", weight: 500, tr: "--tr-mono",  text: "v0.1.0 · 21.07.2026 · MUC" },
  { name: "small", rem: "0.75rem",   px: 12, fam: "Geist Mono", weight: 400, tr: "--tr-mono",  text: "36-key split · 4-8 mm aluminium case" },
  { name: "micro", rem: "0.6875rem", px: 11, fam: "Geist Mono", weight: 500, tr: "--tr-caps",  text: "STATUS · ONLINE · CHANNEL 03" },
  { name: "nano",  rem: "0.625rem",  px: 10, fam: "Geist Mono", weight: 500, tr: "--tr-caps",  text: "HUD KEY · 0X01 · LIVE" },
];

function TypeSection() {
  return (
    <Section num="02" title="Typography" id="type"
      lede="A neutral, mechanical-feeling Geist carries the message. Geist Mono speaks the data. Instrument Serif Italic, used sparingly, marks pull-quotes and numerals — the only place the system permits ornament."
      meta={<>3 families · 7 fluid rungs · 9 static rungs</>}>
      <div className="typeFamilies">
        <div className="family">
          <div className="family__meta"><span>01 / DISPLAY</span><span>400 · 500 · 600</span></div>
          <div className="family__name" style={{fontFamily: "var(--ff-display)"}}>Geist</div>
          <div className="family__sample" style={{fontFamily: "var(--ff-display)"}}>The Wafer is a 36-key ultrathin split keyboard. 4-8 mm aluminium case, magnetic mechanism.</div>
          <div className="family__chars t-mono">AaBbCc · 0123456789 · &amp;@#</div>
        </div>
        <div className="family">
          <div className="family__meta"><span>02 / TECHNICAL</span><span>400 · 500 · 600</span></div>
          <div className="family__name" style={{fontFamily: "var(--ff-mono)"}}>Geist Mono</div>
          <div className="family__sample t-mono" style={{fontSize: "var(--fs-meta)"}}>{`// kerfur — event bus
bus_post(EV_TILT, &(tilt_t){ .ax=12, .ay=-4 });
// → behavior engine consumes`}</div>
          <div className="family__chars t-mono">AaBb · 01l1 · {`{[<>]}`} · ::-&gt;</div>
        </div>
        <div className="family">
          <div className="family__meta"><span>03 / EDITORIAL</span><span>italic only</span></div>
          <div className="family__name t-serif">Instrument</div>
          <div className="family__sample t-serif" style={{fontSize: "var(--fs-lead)"}}>"the system is the message" — used for pull-quotes and numerals</div>
          <div className="family__chars t-serif">1 · 2 · 3 · 5 · 8 · 13 · 21 · 34 · 55</div>
        </div>
      </div>

      <h3 className="typeGroup">Fluid display ramp — one scale for every route</h3>
      <div className="typeStack">
        {TYPE_DISPLAY.map(t => (
          <div key={t.name} className="typeRow">
            <div className="typeRow__label">{t.name}</div>
            <div className="typeRow__sample" style={{
              fontSize: t.render,
              fontFamily: "var(--ff-display)",
              fontWeight: 400,
              letterSpacing: `var(${t.tr})`,
            }}>{t.text}</div>
            <div className="typeRow__spec">
              --fs-{t.name}<br />
              {t.clamp}<br />
              {t.tr}
            </div>
          </div>
        ))}
      </div>

      <h3 className="typeGroup">Static ramp — rem, so browser text size applies</h3>
      <div className="typeStack">
        {TYPE_STATIC.map(t => (
          <div key={t.name} className="typeRow">
            <div className="typeRow__label">{t.name}</div>
            <div className="typeRow__sample" style={{
              fontSize: `var(--fs-${t.name})`,
              fontFamily: t.fam.includes("Mono") ? "var(--ff-mono)" : "var(--ff-display)",
              fontWeight: t.weight,
              letterSpacing: `var(${t.tr})`,
            }}>{t.text}</div>
            <div className="typeRow__spec">
              --fs-{t.name}<br />
              {t.rem} · {t.px}px · {t.weight}<br />
              {t.tr}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

window.Hero = Hero;
window.Section = Section;
window.ColorSection = ColorSection;
window.TypeSection = TypeSection;
