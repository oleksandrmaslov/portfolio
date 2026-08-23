# Portfolio Case Study Pack

This folder is a working editorial pack for the portfolio universe around **Wafer**, **Iskra**, **Ci-clop**, **Venovisor Firmware**, and the future editorial page for **Energy for Ukraine**.

The writing is intentionally split into two layers:

1. **Page-ready copy** — the text that can be placed on the actual case-study page.
2. **Research / verification notes** — facts, authorship boundaries, media suggestions, and claims that should remain private or be checked before publishing.

The current portfolio scaffold expects:

- `year`
- `place`
- `role`
- 3 real metrics
- a 60–90 word intro
- 4 long-form sections of roughly 40–120 words each
- links
- optional model/demo dimensions

These files go deeper than that scaffold. Each project therefore also contains a **Condensed scaffold version** that can be copied into `app/projects/data.jsx` without deleting the longer narrative.

---

## The portfolio thesis

The projects look different on the surface, but the same pattern keeps repeating:

> **I like building products, but I keep ending up one layer below the product.**
>
> A thin keyboard became a PCB, power-management and firmware problem.  
> A humanitarian device became a manufacturing problem.  
> Manufacturing became a firmware-distribution problem.  
> Firmware distribution became an access-control problem.
>
> I tend to follow those problems downward until I find the layer that is actually limiting the system.
>
> **Then I build that.**

A more technical version:

> **I build the missing layer between a working prototype and something other people can manufacture, use or maintain safely.**

This is not meant to be a slogan pasted onto every page. It is the connective tissue between the projects.

---

## Recommended portfolio order

### 01 — Wafer
**Product integration**

Shows the ability to make mechanics, PCB architecture, power, firmware and manufacturing decisions as one system.

Core idea:

> **Thinness is a systems problem.**

### 02 — Iskra
**Manufacturing infrastructure**

Shows software architecture, trust boundaries, firmware distribution, operator UX and production tooling.

Core idea:

> **Factory flashing without the factory engineer.**

### 03 — Energy for Ukraine
**Editorial / universe context, not a personal project claim**

Shows where the manufacturing constraints came from, how the feedback loop closes, and why tools such as Iskra exist.

Core idea:

> **The workshop should not be the boundary of the system.**

### 04 — Ci-clop
**Embedded firmware / product behavior**

Shows state machines, button interaction, brightness, charge behavior, low power, SOS behavior and production integration.

Core idea:

> **The PCB defines what is electrically possible. Firmware defines what the device feels like.**

### 05 — Venovisor Firmware
**Firmware inside an existing field-deployed product**

Shows the ability to enter an existing device honestly, preserve authorship boundaries, adapt firmware to a new generation and integrate it into a shared manufacturing pipeline.

Core idea:

> **The hardware existed before my work. The next firmware generation is mine.**

---

## Energy system marker

The Energy-related pages can share a small marker:

- `ENERGY SYSTEM / CONTEXT` — Energy for Ukraine
- `ENERGY SYSTEM / CONTROL` — Ci-clop
- `ENERGY SYSTEM / MEDICAL` — Venovisor Firmware
- `ENERGY SYSTEM / INFRASTRUCTURE` — Iskra

Suggested cross-links:

- Ci-clop → `HOW WE FLASH IT / ISKRA`
- Venovisor Firmware → `PRODUCTION INFRASTRUCTURE / ISKRA`
- Iskra → `FIELD CONTEXT / ENERGY FOR UKRAINE`
- Energy for Ukraine → `CONTROL / CI-CLOP`, `MEDICAL / VENOVISOR`, `INFRASTRUCTURE / ISKRA`

---

## Authorship rules

These are important enough to keep visible during editing.

### Wafer
Safe to present as a personal product-engineering project. Do not claim that the nPM1300 battery work was merged upstream into ZMK unless a public PR is later verified. The first CNC run should be described as an iteration with manufacturing/tolerance issues, not as finished production.

### Iskra
A personal software / architecture / manufacturing-tooling case.

### Ci-clop
The case-study scope is currently safest as:

> **Embedded firmware · interaction design · product behavior · production integration**

The key product problem is the replacement of the older one-button / three-step brightness carousel with direct shutoff, two controls, saved adjustable brightness, deliberate gestures and SOS. The earlier power-bank direction was abandoned and must not be listed as a current flashlight feature.

The board is the Ci-clop platform, but do not claim full schematic/PCB authorship until that scope is explicitly confirmed.

### Venovisor
Do **not** present the original Venovisor hardware or the earlier redesign as personal work. The page should be titled **Venovisor Firmware** or clearly state the scope in the hero.

### Energy for Ukraine
Treat as team / ecosystem context. Do not imply that the entire project, product family, volunteer network or every hardware revision was personally created.

---

## Publication safety for field media

Before using field photos or videos publicly:

- blur faces when identity is not necessary;
- remove EXIF/location metadata from exported files;
- avoid current deployment locations;
- avoid serial numbers, radio screens, maps, vehicle identifiers or tactical details that are not necessary for the story;
- confirm that the specific image/video is approved for public publication;
- prefer the engineering consequence over dramatic framing.

The field material is strongest when it establishes a design constraint, not when it is used as emotional decoration.

---

## Files in this pack

- `01_PORTFOLIO_UNIVERSE.md`
- `02_WAFER.md`
- `03_ISKRA.md`
- `04_CI_CLOP.md`
- `05_VENOVISOR_FIRMWARE.md`
- `06_ENERGY_FOR_UKRAINE_EDITORIAL.md`
- `07_CONTENT_LIBRARY.md`
- `08_RESEARCH_NOTES_AND_MEDIA.md`
