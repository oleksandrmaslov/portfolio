/* ============================================================
   M.O. SYSTEM — Landing page sections
   ============================================================ */

const { useState: useL, useEffect: useE, useRef: useR } = React;

/* ============================================================
   HERO — full-bleed Wafer + overlay text
   ============================================================ */
function HeroLanding() {
  const [active, setActive] = useL(null);

  return (
    <section className="lp-hero lp-hero--universe" data-screen-label="01 Universe">
      <div className="lp-hero__stage">
        <Universe projects={window.UNIVERSE_PROJECTS} onActive={setActive} />
      </div>

      {/* ===== top rail — editorial micro-meta ===== */}
      <div className="lp-hero__rail lp-hero__rail--top">
        <div className="lp-hero__railL">
          <span className="rail__bullet">■</span>
          <span className="rail__k">PORTFOLIO</span>
          <span className="rail__sep">·</span>
          <span className="rail__v">UNIVERSE</span>
          <span className="rail__sep">·</span>
          <span className="rail__k">v0.2</span>
        </div>
        <div className="lp-hero__railC">
          MASLOV / OLEKSANDR — EMBEDDED · FIRMWARE · HARDWARE
        </div>
        <div className="lp-hero__railR">
          <span className="rail__k">SECTOR</span>
          <span className="rail__v">{active ? active.addr : "—"}</span>
          <span className="rail__sep">·</span>
          <span className="rail__k">RELEASE</span>
          <span className="rail__v">00</span>
        </div>
      </div>

      {/* ===== ASCII interactive title ===== */}
      <div className="lp-hero__ascii">
        <AsciiHero text="M.O." cols={108} rows={20} />
        <div className="lp-hero__asciiCap">
          <span>■ HOVER TO DISTURB THE FIELD</span>
        </div>
      </div>

      {/* ===== bottom rail — name + tagline + meta cols ===== */}
      <div className="lp-hero__panel">
        <div className="lp-hero__panelTitle">
          <div className="lp-hero__overline">
            <span className="lp-hero__pulse" />
            <span>EMBEDDED · FIRMWARE · HARDWARE</span>
            <span className="lp-hero__overlineRule" />
            <span>2026 · MUNICH</span>
          </div>
          <h1 className="lp-hero__title">
            Maslov<br />Oleksandr<em>.</em>
          </h1>
          <p className="lp-hero__tagline">
            I design and ship small, careful objects — keyboards, embedded pets, and the
            firmware that runs them. <em>Twelve nodes drift above.</em>
          </p>
        </div>

        <div className="lp-hero__panelMeta">
          <div className="lp-hero__col">
            <div className="lp-hero__colN">▙ 01</div>
            <div className="lp-hero__label">Currently</div>
            <div className="lp-hero__val">Designing &amp; shipping<br />small, careful objects.</div>
          </div>
          <div className="lp-hero__col">
            <div className="lp-hero__colN">▙ 02</div>
            <div className="lp-hero__label">Location</div>
            <div className="lp-hero__val">Kyiv → Munich<br />48.137° N · 11.575° E</div>
          </div>
          <div className="lp-hero__col">
            <div className="lp-hero__colN">▙ 03</div>
            <div className="lp-hero__label">Open to</div>
            <div className="lp-hero__val">Ausbildung &amp; junior<br />embedded · DE / EN</div>
          </div>
          <div className="lp-hero__col">
            <div className="lp-hero__colN">▙ 04</div>
            <div className="lp-hero__label">Contact</div>
            <div className="lp-hero__val">oleksandrmaslov08<br />@gmail.com</div>
          </div>
          <div className="lp-hero__scroll">
            <span className="lp-hero__scrollLine" />
            <span>SCROLL</span>
            <span>↓ 12 PROJECTS</span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   WORK — selected projects
   ============================================================ */
const WORKS = [
  {
    addr: "0x01",
    name: "Wafer",
    sub:  "36-key ultrathin split keyboard",
    body: "Aluminium case, 4–8 mm build height, magnetic mechanism. Custom KiCad PCB on ISP1807 (nRF52840) with NPM1300 PMIC and Sharp memory display. I wrote a register-based I2C driver for the PMIC and merged direct battery-voltage readout into a ZMK fork.",
    role: "Designer · firmware · hardware",
    year: "2025",
    stack: "ZMK · Zephyr · KiCad · Devicetree",
    metric: ["18 / side", "keys"],
  },
  {
    addr: "0x02",
    name: "Kerfur",
    sub:  "Embedded pet on nRF52840",
    body: "Event-driven firmware in 10,000+ lines of C on Nordic Connect SDK, structured around a central message-queue event bus. Behaviour engine with pet modes, IMU motion stack, OLED face rendered through LVGL, BLE peripheral with iOS ANCS + Android ANS, and Kerfur-to-Kerfur peer beacons with rotating ephemeral IDs.",
    role: "Solo · firmware · architecture",
    year: "2025 —",
    stack: "C · Zephyr · LVGL · BLE · IMU",
    metric: ["10k+", "lines of C"],
  },
  {
    addr: "0x03",
    name: "ZMK Pointing Acceleration",
    sub:  "Open-source input processor",
    body: "A public ZMK input processor for smooth, configurable pointer acceleration on trackpads and pointing devices. Linear and exponential curves, velocity scaling, precise slow/fast movement. Plus a Streamlit configurator that emits ready-to-paste Devicetree snippets.",
    role: "Maintainer · open source",
    year: "2025",
    stack: "C · ZMK · Devicetree · Streamlit",
    metric: ["★ 25", "github"],
  },
  {
    addr: "0x04",
    name: "Tactical Flashlight",
    sub:  "For Energy for Ukraine",
    body: "Volunteer firmware in C for an ARM Cortex-M0 (PY32F002A). Two light modes with saved brightness, SOS, battery indication on addressable LEDs. Designed the schematic and prepared the prototype for production in China.",
    role: "Volunteer · firmware · schematic",
    year: "12/2025",
    stack: "C · ARM Cortex-M0 · KiCad",
    metric: ["PY32", "F002A"],
  },
];

function WorkRow({ work, i }) {
  const ref = useR(null);
  const [open, setOpen] = useL(false);

  return (
    <article
      ref={ref}
      className={"work " + (open ? "work--open" : "")}
      data-screen-label={(i + 2).toString().padStart(2, "0") + " " + work.name}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <div className="work__addr">
        <span className="work__addrDot" />
        node {work.addr}
      </div>
      <div className="work__main">
        <div className="work__row1">
          <h3 className="work__name">{work.name}</h3>
          <span className="work__year t-serif">{work.year}</span>
        </div>
        <div className="work__sub">{work.sub}</div>
        <div className="work__body">{work.body}</div>
        <div className="work__foot">
          <span className="work__stack">{work.stack}</span>
          <span className="work__role">{work.role}</span>
        </div>
      </div>
      <div className="work__metric">
        <div className="work__metricVal t-serif">{work.metric[0]}</div>
        <div className="work__metricKey">{work.metric[1]}</div>
      </div>
      <div className="work__cta">
        <span className="work__ctaText">OPEN CASE</span>
        <span className="work__arrow">→</span>
      </div>
    </article>
  );
}

function Work() {
  return (
    <section className="lp-section" id="work" data-screen-label="02 Work">
      <header className="lp-sectionHead">
        <div className="lp-sectionNum">02</div>
        <h2 className="lp-sectionTitle">Selected work<em>.</em></h2>
        <div className="lp-sectionMeta">
          <div>4 / 12 SHOWN</div>
          <div>2024 — PRESENT</div>
        </div>
      </header>
      <div className="works">
        {WORKS.map((w, i) => <WorkRow key={w.addr} work={w} i={i} />)}
      </div>
      <div className="lp-section__more">
        <KeyButton legend="↵">Open all projects</KeyButton>
        <span className="t-meta" style={{ color: "var(--ghost)", marginLeft: "var(--s-5)" }}>
          + 8 more — ZMK ecosystem · Matterium · Catloading · view-elemental ·  &amp; co.
        </span>
      </div>
    </section>
  );
}

/* ============================================================
   ABOUT — personal narrative
   ============================================================ */
function About() {
  return (
    <section className="lp-section lp-about" id="about" data-screen-label="06 About">
      <header className="lp-sectionHead">
        <div className="lp-sectionNum">03</div>
        <h2 className="lp-sectionTitle">About<em>.</em></h2>
        <div className="lp-sectionMeta">
          <div>18 · MUNICH · 2026</div>
        </div>
      </header>
      <div className="lp-about__grid">
        <div className="lp-about__col">
          <p className="lp-about__lede">
            I'm Oleksandr — eighteen, born in Kyiv on 21 July 2007, now living in Munich.
            I make small electronic things from scratch — schematic, board, firmware, case — and
            I write the documentation that goes with them.
          </p>
          <p className="lp-about__body">
            I started with the keyboards because I wanted one that fit my hands. I stayed because
            building one teaches you everything: PCB layout, power, BLE, real-time firmware,
            tooling, code review, and patience. The Wafer is the third revision. Kerfur — a tiny
            pet that lives on an nRF52 — is the side project that taught me how to architect a
            firmware around an event bus instead of a god-loop.
          </p>
          <p className="lp-about__body">
            I learn fastest in the open. Most of my work is on GitHub. I contribute upstream when
            I can, and maintain a few small modules others use. I write in English and German;
            my school transcript is 12/12 in CS, Physics, Chemistry, English.
          </p>
        </div>

        <aside className="lp-about__sheet">
          <div className="lp-about__sheetHead">
            <span>DATASHEET</span>
            <span>v0.1</span>
          </div>
          {[
            ["born",       "21.07.2007 · Kyiv, UA"],
            ["based",      "Munich, DE"],
            ["language",   "EN · DE B2 · UA · RU"],
            ["seeking",    "Ausbildung · embedded"],
            ["years coding", "5"],
            ["github",     "@oleksandrmaslov"],
            ["email",      "oleksandrmaslov08@gmail.com"],
            ["phone",      "+49 172 3416265"],
          ].map(([k, v]) => (
            <div key={k} className="lp-about__sheetRow">
              <span className="lp-about__sheetKey">{k}</span>
              <span className="lp-about__sheetVal">{v}</span>
            </div>
          ))}
        </aside>
      </div>
    </section>
  );
}

/* ============================================================
   CONTACT / FOOTER
   ============================================================ */
function FooterLanding() {
  return (
    <section className="lp-section lp-contact" id="contact" data-screen-label="07 Contact">
      <header className="lp-sectionHead">
        <div className="lp-sectionNum">04</div>
        <h2 className="lp-sectionTitle">Let's talk<em>.</em></h2>
        <div className="lp-sectionMeta">
          <div>RESPONSE · &lt; 24H</div>
        </div>
      </header>
      <div className="lp-contact__grid">
        <a className="lp-contact__big t-link" href="mailto:oleksandrmaslov08@gmail.com">
          oleksandrmaslov08<wbr />@gmail.com
        </a>
        <div className="lp-contact__links">
          <a className="lp-contact__link" href="https://github.com/oleksandrmaslov">
            <span className="lp-contact__linkKey">GITHUB</span>
            <span className="lp-contact__linkVal">@oleksandrmaslov</span>
            <span className="lp-contact__arr">↗</span>
          </a>
          <a className="lp-contact__link" href="tel:+491723416265">
            <span className="lp-contact__linkKey">PHONE</span>
            <span className="lp-contact__linkVal">+49 172 3416265</span>
            <span className="lp-contact__arr">↗</span>
          </a>
          <a className="lp-contact__link" href="#">
            <span className="lp-contact__linkKey">CV · PDF</span>
            <span className="lp-contact__linkVal">download · 2 pages</span>
            <span className="lp-contact__arr">↓</span>
          </a>
          <a className="lp-contact__link" href="Design System.html">
            <span className="lp-contact__linkKey">SYSTEM</span>
            <span className="lp-contact__linkVal">design foundation · v0.1</span>
            <span className="lp-contact__arr">→</span>
          </a>
        </div>
      </div>

      <footer className="lp-foot">
        <span>© 2026 · MASLOV OLEKSANDR · ALL RIGHTS RESERVED</span>
        <span>BUILT IN MUNICH · v0.1.0</span>
        <span>NO COOKIES · NO TRACKERS · STATIC HTML</span>
      </footer>
    </section>
  );
}

window.HeroLanding   = HeroLanding;
window.Work          = Work;
window.About         = About;
window.FooterLanding = FooterLanding;
