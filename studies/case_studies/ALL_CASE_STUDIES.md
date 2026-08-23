# Complete Portfolio Case Study Pack


---

# FILE: 00_README.md

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

---

# FILE: 01_PORTFOLIO_UNIVERSE.md

# Portfolio Universe

## Working thesis

> **I like building products, but I keep ending up one layer below the product.**

A keyboard starts as an object and turns into a power architecture problem.

A volunteer-built device starts as a hardware problem and turns into a firmware deployment problem.

Firmware deployment turns into an access-control problem.

Eventually even the programmer becomes part of the system.

That pattern is more useful than describing the portfolio as “hardware + software + embedded projects.” The interesting part is not the list of disciplines. It is the tendency to keep following a constraint until the actual bottleneck appears.

---

# About copy — long version

I build hardware and software, but most of my projects eventually stop being about the thing I originally wanted to build.

Wafer began as an attempt to make a split keyboard thinner. That pushed the controller, battery, power management, display, RF, PCB stack and enclosure into the same design problem. The mechanical thickness was only the visible symptom.

Energy for Ukraine exposed the same pattern from another direction. A device can work perfectly on my bench and still fail as a system if another person cannot assemble, flash, test or repair it. Once volunteers are part of the production process, tooling and documentation become part of the product.

Ci-clop pushed firmware into the interaction layer. Iskra pushed flashing into a controlled manufacturing transaction. The current firmware-access architecture pushed the security boundary out of application code and into repository topology.

I tend to keep moving one layer downward until the system stops depending on a hidden specialist.

Then I build that layer.

---

# About copy — medium version

I build products by following their constraints downward.

A thin keyboard became a PCB, power and firmware problem. Volunteer manufacturing became a firmware-distribution problem. Firmware distribution became an access-control problem.

I am interested in the layer that quietly limits the rest of the system: the piece that still requires a specialist, the module that adds unnecessary volume, the manual step nobody has formalized yet.

That is usually where my next project starts.

---

# About copy — short version

> **I build the missing layer.**
>
> I follow product constraints downward until I find the part that still depends on unnecessary volume, manual work or specialist knowledge.

---

# The two major engineering themes

## 1. Product integration

Wafer is the clearest example.

The project asks:

> What changes when I stop treating the PCB, controller, power system, display, case and firmware as separate modules?

The answer is not simply “a thinner keyboard.”

The result is a different way of designing the product: every millimetre and every power state belongs to the system.

## 2. Removing the specialist from the critical path

The Energy / Ci-clop / Iskra branch asks another question:

> What changes when the person building the hardware is not the person who designed the firmware?

That leads to:

- repeatable assembly;
- firmware state design;
- reliable flashing;
- signed firmware metadata;
- audit logs;
- source/binary separation;
- individual operator authorization;
- eventually a lower-cost debug probe.

---

# Energy system map

```text
FIELD NEED
   │
   ▼
ENERGY FOR UKRAINE
devices + volunteers + feedback
   │
   ├─────────────────────┐
   ▼                     ▼
CI-CLOP              VENOVISOR
control platform      medical device
   │                     │
   ▼                     ▼
CI-CLOP FW          VENOVISOR FW
   └──────────┬──────────┘
              │
              ▼
        PRIVATE SOURCE
              │ CI
              ▼
     COMPILED FIRMWARE
              │
              ▼
       SIGNED CATALOG
              │
              ▼
            ISKRA
              │
      approved operator
              │
              ▼
      DEBUG / FLASH PROBE
              │
             SWD
              ▼
       PRODUCTION DEVICE
              │
              ▼
             FIELD
              │
              └──── feedback ────► next revision
```

The future low-cost probe sits underneath Iskra:

```text
commodity dev board
       │
       ▼
Iskra provisions probe firmware
       │
       ▼
low-cost SWD/JTAG probe
       │
       ▼
Ci-clop / Venovisor / future boards
```

---

# Project cards — suggested framing

## Wafer

**Node class:** EMBEDDED HARDWARE  
**State:** ACTIVE DEVELOPMENT / WORKING PROTOTYPE  
**One-line card copy:**

> A 36-key wireless split keyboard that treats thinness as a system problem, not an enclosure problem.

**Tags:** PCB · Firmware · Product Design

---

## Iskra

**Node class:** PRODUCTION SYSTEM  
**State:** ACTIVE DEVELOPMENT  
**One-line card copy:**

> A controlled ARM flashing system that lets an approved operator manufacture hardware without becoming an embedded engineer.

**Tags:** .NET · ARM · Manufacturing

---

## Ci-clop

**Node class:** FIRMWARE SYSTEM or EMBEDDED HARDWARE  
**State:** ACTIVE DEVELOPMENT  
**One-line card copy:**

> A two-button field-light control system built around direct shutoff, saved brightness, deliberate gestures and emergency signalling.

**Tags:** Embedded · Interaction · Firmware

---

## Venovisor Firmware

**Node class:** FIRMWARE SYSTEM  
**State:** ACTIVE DEVELOPMENT  
**One-line card copy:**

> The next firmware generation for a medical device already used by Ukrainian medics.

**Tags:** Embedded · Medical · Firmware

---

## Energy for Ukraine

This does not have to be represented as a normal project node.

It can be a **blog / field note / system context object** inside the universe.

Suggested label:

> `FIELD NOTE / ENERGY FOR UKRAINE`

Suggested description:

> The real production environment behind Ci-clop, Venovisor Firmware and Iskra: reclaimed batteries, volunteer assembly, field feedback and the attempt to move manufacturing closer to the people who need the hardware.

---

# Suggested navigation pattern

At the end of Wafer:

> `NEXT CASE / ISKRA`  
> From integrating a product to distributing a production process.

At the end of Iskra:

> `FIELD CONTEXT / ENERGY FOR UKRAINE`

At the end of Energy:

> `CONTROL / CI-CLOP`  
> `MEDICAL / VENOVISOR FIRMWARE`

At the end of Ci-clop:

> `INFRASTRUCTURE / ISKRA`

At the end of Venovisor:

> `INFRASTRUCTURE / ISKRA`

This turns the site into a graph instead of a linear case-study archive.

---

# Repeating editorial device

A useful recurring device is:

## What looked like the problem

followed by:

## What the problem actually was

Examples:

### Wafer

**Looked like:** enclosure thickness.  
**Actually:** stacked architecture.

### Ci-clop

**Looked like:** drive an LED.  
**Actually:** interaction and state design.

### Iskra

**Looked like:** make flashing easier.  
**Actually:** define a manufacturing trust boundary.

### Energy

**Looked like:** build more devices.  
**Actually:** make production reproducible by more people.

This can become a subtle signature across the portfolio without turning every case into the same template.

---

# FILE: 02_WAFER.md

# Wafer

> **A 36-key split keyboard built like a finished device.**

**System marker:** PRODUCT INTEGRATION  
**Year:** 03 / 2025 →  
**Place:** Munich, DE  
**Role:** Product design · PCB · firmware · manufacturing  
**Overline:** EMBEDDED · HARDWARE · FIRMWARE

### Metrics

- **4–8 mm** / enclosure thickness across the body
- **36** / keys
- **30+** / enclosure iterations before the first CNC order

---

# Hero intro

Wafer started with a simple annoyance: every wireless split keyboard I built still felt like a stack of parts. PCB, battery, controller, display, case. It worked, but the architecture itself was making the product thicker. I wanted to see what happened if I stopped treating those pieces as modules and designed the whole keyboard as one object. Wafer became a 36-key wireless split built around a custom PCB, integrated power system, Memory-In-Pixel display and an aluminium enclosure only 4–8 mm thick.

---

# Case study

## 01 — It started with the sandwich

Before Wafer I had already built several split keyboards, including a wireless low-profile Corne. They taught me what I liked about small ergonomic boards, but also exposed something I had started accepting as normal: DIY keyboards are often assembled vertically.

A controller board sits on another PCB. A battery sits underneath or beside it. The display becomes another module. Sockets, headers and clearances accumulate around everything.

The enclosure then has to hide that stack.

When I started drawing my own 36-key stagger, I traced my hand, built the first layout and discovered Ergogen. But the important decision was not the key placement. It was deciding that Wafer would not have a controller “module” in the usual sense.

The controller, charging, power management and display would belong to the PCB itself.

**Design question:**

> How thin can a wireless split become when the electronics stop being a sandwich?

---

## 02 — I learned PCB design by rebuilding the PCB

The first board was exactly the kind of board you make when you know enough to be dangerous.

I borrowed parts of the MCU layout from another project, added the display and matrix, and went straight into routing. The first PCB took almost three weeks. I used six layers, overcomplicated the layout and placed an RF antenna footprint I did not really trust.

So I rebuilt it.

Then rebuilt it again.

Those revisions mattered more than the first successful schematic. They changed the goal from “put every component directly on the board” to “integrate only what I can integrate well.”

That is why the final direction moved away from a bare nRF52840 and toward the **ISP1807**, an 8 × 8 × 1 mm nRF52840 SiP with RF matching and antenna already solved.

Integration did not have to mean reinventing RF.

It meant choosing where custom engineering actually bought the product something.

---

## 03 — Every millimetre belongs to the system

The 4 mm target was never one clever mechanical trick.

It was the result of many small decisions that affected each other.

The keyboard uses ultra-thin Kailh PG1316S switches. The PCB layout has to make room for the battery instead of simply stacking it below electronics. The display enclosure consumes more height than the flat PCB area around it. Magnets have to fit without creating another thick plate. Wiring, reset access, switch travel and the aluminium wall all compete for the same few millimetres.

Early case prototypes made this painfully obvious. One display reference model was wrong, so the printed enclosure was smaller than the actual display. Other revisions proved that an electronic component can fit in XY and still fail the product in Z.

By the later printed revisions the enclosure was roughly **5 mm at its thinnest and 8 mm around the display**, with later geometry reaching about 4 mm in the thin zones.

Thinness stopped being a dimension.

It became a stack budget.

---

## 04 — The power system kept changing because the product kept changing

The early power architecture used separate charging and battery-gauge parts.

That worked, but it recreated the same problem I was trying to remove mechanically: more parts, more routing and more separate responsibilities.

I explored an nPM1100 direction and eventually moved the third hardware revision to the **Nordic nPM1300**. It combines charging, power rails and battery telemetry behind an I2C-controlled PMIC.

For Wafer that meant the power system could become part of the firmware architecture instead of a collection of independent circuits.

The board still had to support a small battery, display power, low-power behavior and the weird realities of a split wireless device, but the number of separate power components could shrink.

The important lesson was not “use a PMIC.”

It was that a power architecture should be designed around the behavior of the finished product, not around whichever charger module is easiest to place first.

---

## 05 — Firmware had to understand the hardware

Wafer runs ZMK, but the hardware stopped being standard enough for configuration alone.

I maintained a separate Wafer configuration and a ZMK fork while bringing up the power system and displays.

One of the custom pieces was direct battery reporting from the nPM1300. Instead of relying on an external fuel-gauge module, the firmware triggers the PMIC ADC, reads the VBAT result over I2C, reconstructs the battery voltage and passes it through the battery-percentage logic already used by ZMK.

That kept the battery telemetry inside the architecture I had already chosen for power.

The same principle appeared elsewhere: hardware decisions and firmware decisions could no longer be separated cleanly.

The keyboard was only thin because both sides understood the same system.

### Important publication boundary

Do **not** say this work was “merged upstream into ZMK” unless a public upstream PR is later verified. The safe wording is:

> Implemented direct nPM1300 battery reporting in my ZMK fork.

---

## 06 — Then the enclosure became a manufacturing project

For a long time I thought the case was the final mechanical layer around the electronics.

It was not.

The CNC enclosure became its own engineering problem.

Before the first order I went through **30+ printed revisions**. At first those prints answered stack-fit questions: does the display fit, can the PCB and battery coexist, where can the magnets sit, can I reach reset and soft-off?

Later the questions changed.

Could the geometry actually be machined? Could a tool reach that corner? How would the part be held? Which wall is too thin once tolerances and finishing are real instead of CAD-perfect?

The first CNC run exposed exactly those issues. Tool wear, fixturing, baseline shifts, tolerances and finishing all showed up in the physical result.

At that point the goal stopped being “remove every possible tenth of a millimetre.”

It became knowing **where to add material back** so the product could be manufactured reliably.

That was a much more useful definition of thin.

---

## 07 — The object finally started to feel like one object

The latest result is the first version that makes the original idea obvious without explanation.

The two halves are visually quiet. The keys sit almost directly on the desk plane. The Memory-In-Pixel displays read as part of the enclosure instead of devboards added afterward. Magnets are useful both for mating the halves and, somewhat accidentally, for sticking the keyboard to a steel surface.

That last detail became one of my favorite photos because it communicates the project better than a dimension label.

The electronics are working. The public repository contains the configuration, hardware/production material and build information. The remaining work is mostly mechanical and manufacturing validation: tightening the enclosure after the CNC lessons and making sure the public files represent something I would actually recommend another person to build.

I started Wafer because I wanted a thinner keyboard.

I kept working on it because I wanted to understand what makes DIY hardware feel finished.

---

# Current state

**Working electronics.**  
**Working firmware.**  
**Physical enclosure produced and iterated.**  
**Manufacturing validation still in progress.**

The honest ending is not “production complete.”

It is:

> The device now proves the architecture. The remaining work is making the mechanical result repeatable enough that the files can represent a product, not only my prototype.

---

# Condensed scaffold copy

## `year`

`03 / 2025 →`

## `place`

`Munich, DE`

## `role`

`Product design · PCB · firmware · manufacturing`

## `metrics`

1. `4–8` / `mm enclosure`
2. `36` / `keys`
3. `30+` / `case revisions`

## `intro` — 82 words

Wafer started with a simple annoyance: every wireless split keyboard I built still felt like a stack of parts. PCB, battery, controller, display, case. It worked, but the architecture itself was making the product thicker. I wanted to see what happened if I stopped treating those pieces as modules and designed the whole keyboard as one object. Wafer became a 36-key wireless split built around a custom PCB, integrated power system, Memory-In-Pixel display and an aluminium enclosure only 4–8 mm thick.

## `sections`

### The sandwich was the problem

I had already built several split keyboards when I started Wafer. The recurring limitation was not the key layout but the vertical architecture: controller board, shield PCB, battery, display and case stacked on top of each other. For my own 36-key stagger I decided to remove that stack. The controller, charging, power system and display would become part of the PCB itself. Thinness stopped being an enclosure target and became a system constraint.

### Learning PCB design by rebuilding it

My first board took almost three weeks and was exactly what a beginner makes with too much confidence: six layers, overcomplicated routing and an RF section I did not trust. I rebuilt the board twice and eventually replaced the bare nRF52840 approach with an ISP1807 SiP. That decision taught me an important distinction: integration does not mean doing everything from scratch. It means being deliberate about which problems are worth owning.

### Firmware had to understand the hardware

The power architecture eventually moved to an nPM1300 PMIC, combining charging, rails and battery telemetry. Because the hardware was no longer standard, configuration alone was not enough. I maintained a ZMK fork and implemented direct battery-voltage reporting from the PMIC over I2C. The firmware triggers the ADC, reads VBAT and feeds the result into ZMK's battery-percentage logic. The thin mechanical stack only worked because firmware and hardware were designed as the same system.

### The case became manufacturing

Before the first CNC order I printed more than 30 enclosure revisions. Early versions answered stack-fit questions; later ones were about tools, fixturing, wall thickness and tolerance. The first CNC run exposed exactly those manufacturing limits. The final stage stopped being a race to remove material. It became learning where to add material back so the design could be machined reliably. Electronics work today; the remaining work is mechanical and manufacturing validation.

---

# Links

- GitHub: `https://github.com/oleksandrmaslov/wafer-zmk-config`
- Build journal: `https://blueprint.hackclub.com/projects/2800`
- Portfolio: current Wafer route

Do not add a ZMK upstream PR link until it is actually verified.

---

# Visual storyboard

## Hero

Use:

**`A872F6DC-BCDB-4080-9207-5EBCAB41425A.jpeg`**

Why:

A single half in the hand gives instant scale and looks like a finished object rather than a PCB project.

Alternative minimal hero:

**`247C37C1-66B4-434C-ADB9-725A015F3932.jpeg`**

Both halves, displays active, clean white background.

---

## Chapter 1 — origin

Blueprint assets:

- hand outline / first layout;
- early Ergogen layout;
- previous Corne / stacked architecture if available.

Caption:

> The first constraint was not the layout. It was everything stacked above and below it.

---

## Chapter 2 — first PCB

Blueprint:

- first routed PCB;
- R1 / R2 comparison;
- any screenshot that visibly shows the overcomplicated RF/routing approach.

Caption:

> My first custom board took almost three weeks. I rebuilt it twice before I trusted the architecture.

---

## Chapter 3 — thickness

Use:

**`E5699420-BFB3-4647-871C-486BE4134372.jpeg`**

Side profile in hand.

Full-bleed or very wide crop.

Caption:

> Thinness was a stack budget, not a case dimension.

Then:

**`78B1E795-ED86-4470-97B0-84D715563822.jpeg`**  
or  
**`D8A13CD5-1C35-40CA-85A1-B64564DAFAC8.jpeg`**

Magnetically attached side views.

Caption:

> The same magnets used to mate the halves also make the enclosure cling to steel.

---

## Chapter 4 — enclosure iterations

Blueprint:

- first incorrect display enclosure;
- grid of 3D printed revisions;
- first CNC result.

Then use:

**`BC5CB3DE-24F9-409E-B752-51E0EF83F9CE.jpeg`**

Process/assembly image with enclosure parts and PCB visible.

Caption:

> By the time the case went to CNC, the enclosure had already been printed more than thirty times.

---

## Chapter 5 — final result

Use:

**`1659C908-D87A-4C98-91E0-DF9A299454D3.jpeg`**

Display close-up.

Caption:

> The displays stopped looking like modules and became part of the object.

Then:

**`247C37C1-66B4-434C-ADB9-725A015F3932.jpeg`**

or

**`54F9E90A-F267-44B3-82BE-1908FD0D0013.jpeg`**

for the quiet final spread.

---

## Optional personality image

**`ADCB7626-7225-49B1-8A26-B39CEEDE1591.jpeg`**

Both halves magnetically attached to a refrigerator.

This is not a polished product photograph, which is exactly why it works. It is memorable, shows scale and turns the magnet feature into a physical joke without adding copy.

---

# Claims / verification boundaries

## Safe claims

- 36-key split keyboard.
- 4–8 mm overall thickness target/result depending on region.
- ISP1807 / nRF52840 platform.
- nPM1300 PMIC.
- Memory-In-Pixel / nice!view-style displays.
- PG1316S switches.
- 30+ enclosure revisions before first CNC order.
- custom direct nPM1300 VBAT reporting in a ZMK fork.
- first CNC run exposed manufacturing/tolerance issues.

## Avoid / soften

### Avoid

> “Merged my nPM1300 driver upstream into ZMK.”

No verified public upstream PR was found.

### Soften

> “Milled the prototypes.”

Better:

> “Ordered and iterated a CNC aluminium enclosure.”

The first CNC result was part of the iteration, not a finished production enclosure.

---

# Future post angles

1. **My first PCB took three weeks. I rebuilt it twice.**
2. **Why I stopped using a devboard in my keyboard.**
3. **Thinness is a stack budget.**
4. **The part of CNC design nobody taught me: adding material back.**
5. **Why I replaced a bare nRF52840 with an ISP1807.**
6. **Using an nPM1300 as part of the product architecture, not just a charger.**
7. **Direct battery reporting from a PMIC in a ZMK fork.**
8. **30+ case revisions before the first CNC order.**
9. **The refrigerator photo is probably the best Wafer product photo.**
10. **When does a DIY keyboard stop looking like a stack of modules?**

---

# FILE: 03_ISKRA.md

# Iskra

> **Factory flashing without the factory engineer.**

**System marker:** ENERGY SYSTEM / INFRASTRUCTURE  
**Year:** 05 / 2026 →  
**Place:** Munich, DE  
**Role:** Product architecture · application engineering · security model · manufacturing tooling  
**Node class:** PRODUCTION SYSTEM  
**State:** ACTIVE DEVELOPMENT

### Metrics

- **3** / operator languages
- **3** / repository trust layers
- **ARM** / Cortex-M target family

---

# Hero intro

Iskra started as a way to let volunteers flash ARM Cortex-M boards without learning GDB. It grew into a manufacturing trust layer: signed firmware catalogs, pre-flight checks, controlled binary distribution and an audit trail for every flash attempt. An approved operator can manufacture a device without receiving the firmware source or the original development environment. That separation is what makes Iskra interesting to me. It turns flashing from an engineer's command into a controlled production operation.

---

# Case study

## 01 — The last step still needed an embedded engineer

Energy for Ukraine was already moving toward distributed manufacturing.

Models and instructions could be shared. Components could be shipped. Volunteers could solder and assemble devices.

But programmable hardware created a hidden dependency at the end of the process.

Someone still had to:

- find the correct firmware;
- know which MCU and board it belongs to;
- connect the probe correctly;
- find the serial/GDB endpoint;
- invoke the ARM toolchain;
- flash the target;
- notice when the operation did not actually succeed.

That workflow is normal for firmware development.

It is a bad manufacturing interface.

Iskra began with a simple goal:

> **Make the safe production path understandable to the operator without teaching the operator my development environment.**

---

## 02 — The “Flash” button is the least interesting part

A flashing GUI is easy to demo.

A trustworthy flashing transaction is harder.

The current architecture separates the target-agnostic flashing/trust engine from the operator interfaces. `Iskra.Core` owns the low-level domain. `Iskra.Application` owns UI-neutral workflows. WPF remains a supported Windows operator UI, while Avalonia is being developed as the cross-platform sibling.

The important path is the **FlashWorkflow**.

A production flash is not “run GDB.”

It is a transaction that has to answer several questions first:

1. Is the catalog trusted?
2. Is this firmware version revoked?
3. Is the operator allowed to obtain the artifact?
4. Does the artifact hash match?
5. Does the firmware load map belong to this target?
6. Is exactly one compatible probe present?
7. Is GDB actually available?
8. Did the two-phase GDB operation complete?
9. Was the result recorded durably?

If one of those gates fails, the production operation should stop instead of improvising.

That is the difference between a developer tool and a manufacturing tool.

---

## 03 — Fail closed, but explain why

A factory tool has to be strict without becoming mysterious.

One of the most useful architectural changes was separating failure classes that look identical from the outside.

For example, GitHub deliberately returns `404` when a user cannot see a private repository. Earlier, that could collapse into a generic “firmware download failed” path and tell the operator to check the network.

That diagnosis is wrong.

If the real problem is authorization, the operator should know that this account is not approved.

The current model distinguishes states such as:

- no repository access;
- not signed in;
- expired authorization;
- missing release asset;
- genuine transport failure.

This sounds like error-message polish, but it changes the operating model. A volunteer can act on the error without needing the engineer who wrote the tool.

That is one of Iskra's recurring design rules:

> **Remove expertise where possible. Preserve explicit refusal where it matters.**

---

## 04 — Signed metadata before convenience

The production path requires signed catalogs by default.

The catalog is not simply a list of download URLs. It is part of the trust model.

It can identify:

- product;
- release/version;
- target descriptor;
- firmware artifact;
- SHA-256;
- revocation state;
- source location for the compiled artifact.

Unsigned sideloading and direct/manual ELF paths still exist for engineering work, but they are intentionally awkward. They require explicit lab-only opt-in instead of silently becoming a second production path.

The same principle appears in load-range validation.

A hash can prove that the downloaded file is the file that was signed. It cannot prove that the file belongs in the flash address range of the connected target.

Iskra now reads the actual load map from ELF or Intel HEX and can refuse an image that cannot belong to the declared flash/RAM windows.

Trust is not one check.

It is a chain.

---

# The central architecture problem

## 05 — Manufacturing access is not source access

The most interesting Iskra problem was created by GitHub permissions.

I wanted to approve a person to manufacture a device.

That person needs the compiled production firmware.

They do **not** need:

- source code;
- git history;
- private development branches;
- internal CI details.

At first this sounds like a normal permissions problem.

It is not.

GitHub repository read access is repository-wide. There is no useful “release assets only, but no source” permission. `contents: read` exposes repository contents and history along with releases.

So I stopped trying to solve the problem with another permission setting.

I changed the repository topology.

---

## 06 — The trust boundary became three repositories

The current model separates three different kinds of information:

```text
PUBLIC
iskra-catalog
signed catalog + signature
        │
        ▼
PRIVATE
iskra-firmware
compiled .elf / .hex release artifacts only
        │
        ▼
PRIVATE
<product>-firmware
source + history + CI
```

### 1. Public catalog

The catalog is public on purpose.

Its integrity does not depend on secrecy. It depends on the Ed25519 signature and the SHA-256 recorded for each artifact.

A station can therefore discover available approved releases without credentials.

### 2. Private distribution repository

Compiled firmware artifacts are published into a separate private repository.

No firmware source lives there.

### 3. Private source repository

The actual product source, history and CI remain somewhere the operator cannot reach.

The catalog never references this repository.

The important security boundary is therefore not a UI checkbox.

It is architectural.

> **The right to manufacture does not have to be the right to own the source.**

---

## 07 — Approval belongs to a person, not a shared factory account

Each operator signs in using their own GitHub identity.

To approve someone, the maintainer grants that account **Read** access to the firmware distribution repository.

Nothing else.

To revoke that person, the maintainer removes the collaborator.

Their next attempt to retrieve production firmware fails, while other operators keep working.

That per-person revocation is why the current design keeps GitHub Device Flow rather than replacing every operator with one shared machine credential.

A shared credential is operationally easy until one person should lose access.

Then everyone becomes the same identity.

The Iskra model deliberately avoids that.

There are still residual risks, and the documentation keeps them explicit. Credentials on a station are not magic. Per-user identity is not the same as perfect per-machine identity. Binary confidentiality is limited if the target itself has no readout protection.

The point is not to call the system “secure.”

The point is to define exactly **which boundary it is enforcing**.

---

# Manufacturing UX

## 08 — Exactly one probe, one operation, one durable result

Operator UX in Iskra is intentionally narrow.

The station should not behave like an IDE.

Probe readiness is explicit. Flashing stays blocked unless the expected station conditions are satisfied. The UI exposes a strong PASS/FAIL state. The same application-layer workflow is shared across interfaces so safety rules do not drift between WPF and Avalonia.

The transaction is also logged.

SQLite stores flash attempts locally. History and CSV export sit above the same data instead of reconstructing an answer from console text.

Batch behavior is opt-in because the real production topology has not justified pretending that distributed locking is solved. The roadmap explicitly records the limitation: local batch locks do not become cross-station locks by wishing.

This is another Iskra design principle:

> **Do not fake infrastructure that does not exist yet.**

If a future multi-station batch flow needs a shared lock, the intended policy is fail-closed rather than silently falling back to a local lock and creating split-brain production state.

---

# Cross-platform work

## 09 — Extract the workflow before porting the UI

A naive cross-platform port would duplicate the behavior in a new frontend.

That would be dangerous here.

Instead the architecture has been moving policy out of WPF and into shared layers:

- `Iskra.Core`
- `Iskra.Application`
- `FlashWorkflow`
- `HistoryWorkflow`
- `SettingsWorkflow`
- authentication and cloud-log workflows

The Avalonia application consumes those shared snapshots and transactions rather than growing its own interpretation of the production rules.

By August 2026 the Avalonia path had reached functional feature parity for the core operator flow on Windows, including the same flash transaction, settings, GitHub Device Flow, catalog/update flows, log upload and CSV export.

But the project still does **not** claim that this proves platform or hardware-in-the-loop parity.

That boundary is useful:

> UI parity is not production acceptance.

---

# Current state

## 10 — Lab-ready is a more useful status than “done”

The repository explicitly keeps production gates visible.

The software contains:

- WPF operator UI;
- CLI;
- shared application layer;
- signed-catalog workflow;
- remote firmware access;
- integrity and address-range checks;
- probe readiness;
- GDB execution;
- attempt logging;
- installer/setup tooling;
- Ukrainian, English and German operator presentation;
- an Avalonia cross-platform path.

But hardware-in-the-loop acceptance and remaining security/release gates still matter.

I prefer that status to a vague “production ready” badge.

A manufacturing tool should make its uncertainty legible too.

---

# The next hardware problem

## 11 — The remaining expensive component is the probe

Iskra can remove much of the software expertise from flashing.

The station still depends on a hardware debug probe.

For one engineering desk that cost is minor.

For distributed volunteer manufacturing, it compounds.

The next experiment is therefore a low-cost ARM debugger/programmer based on inexpensive, widely available development boards and compatible with the connectors that appear on flight controllers and field electronics.

The ideal loop is recursive:

```text
cheap development board
        │
        ▼
Iskra provisions probe firmware
        │
        ▼
low-cost debug probe
        │
        ▼
SWD / JTAG / Tag-Connect
        │
        ▼
production target
```

If Iskra can provision the programmer that Iskra itself uses, the manufacturing station becomes reproducible too.

That would remove one more specialist tool from the critical path.

---

# Condensed scaffold copy

## `year`

`05 / 2026 →`

## `place`

`Munich, DE`

## `role`

`Architecture · application · security · manufacturing tooling`

## `metrics`

1. `3` / `operator languages`
2. `3` / `trust repositories`
3. `ARM` / `Cortex-M targets`

## `intro` — 82 words

Iskra started as a way to let volunteers flash ARM Cortex-M boards without learning GDB. It grew into a manufacturing trust layer: signed firmware catalogs, pre-flight checks, controlled binary distribution and an audit trail for every flash attempt. An approved operator can manufacture a device without receiving the firmware source or the original development environment. That separation is what makes Iskra interesting to me. It turns flashing from an engineer's command into a controlled production operation.

## `sections`

### Flashing was still a specialist job

Energy for Ukraine could share models, instructions and components, but programmable hardware still left an embedded engineer in the final production step. Someone had to choose the correct firmware, configure a probe, invoke GDB and judge whether the flash actually succeeded. Iskra began by turning that implicit development workflow into an explicit operator transaction. Probe readiness, catalog trust, firmware integrity, target compatibility, GDB execution and durable logging now belong to the production path instead of the engineer's memory.

### Make the unsafe path harder

The production path is intentionally stricter than a developer workflow. Signed catalog metadata is required by default. Firmware hashes are checked before flashing, ELF/HEX load ranges can be validated against the declared target, and the operation fails closed when prerequisites are not satisfied. Manual and unsigned paths still exist for lab work, but require explicit opt-in. The UI is not meant to hide complexity; it is meant to move the important checks into a repeatable system.

### Manufacturing access is not source access

GitHub does not offer the permission model I needed: a person who can read private releases can also read repository contents. I solved that by changing the architecture. A public signed catalog points to a separate private repository containing only compiled production artifacts. Product source and history stay in different private repositories that the operator cannot reach. Each person signs in as themselves and receives Read access only to the artifact repository, so access can be granted or revoked individually.

### The programmer is next

Iskra now covers the software side of a controlled flashing station, but the hardware probe is still a cost and availability bottleneck. The next experiment is a low-cost ARM probe built from widely available development boards, with SWD/JTAG and field-friendly connectors. Ideally Iskra should provision that probe itself before using it to provision the target. If that works, the manufacturing station becomes reproducible rather than being another specialist tool that has to be purchased first.

---

# Suggested links

- GitHub: `https://github.com/oleksandrmaslov/iskra`
- Firmware access architecture: `docs/FIRMWARE_ACCESS.md`
- Roadmap: `ROADMAP.md`
- Ci-clop case
- Venovisor Firmware case
- Energy for Ukraine field note

---

# Visual storyboard

## Hero

Use a clean Iskra UI screenshot with a device/probe physically present in the frame if possible.

The hero should communicate **operator station**, not “desktop app.”

Headline overlay:

> `FACTORY FLASHING / WITHOUT THE FACTORY ENGINEER`

---

## Chapter 1 — why it exists

Use volunteer assembly footage from:

- `video_47@11-05-2026_03-48-20.mp4`
- `video_48@11-05-2026_03-48-20.mp4`
- `video_49@11-05-2026_03-48-20.mp4`
- `video_50@11-05-2026_03-48-20.mp4`
- `video_51@11-05-2026_03-48-20.mp4`

Do not frame this as generic volunteering.

Frame it as:

> Multiple people can assemble hardware. The firmware step must scale with them.

---

## Chapter 2 — flash transaction

Create a clean motion diagram rather than a screenshot wall:

```text
CATALOG
  ↓ verify signature
RELEASE
  ↓ check revocation
ARTIFACT
  ↓ SHA-256
TARGET
  ↓ load range
PROBE
  ↓ exactly one
GDB
  ↓ flash + verify
LOG
  ↓ durable PASS / FAIL
```

---

## Chapter 3 — access architecture

This should be the biggest diagram on the page.

Three repositories with a clear visual boundary.

Caption:

> GitHub had no permission for “private release assets without source.” The boundary had to move into the architecture.

---

## Chapter 4 — operator identity

Show the Device Flow / account state.

Use very little copy.

> `APPROVE PERSON → READ ARTIFACTS`  
> `REVOKE PERSON → NEXT DOWNLOAD FAILS`

---

## Chapter 5 — real-world loop

Use a restrained field image/video still after the architecture, not before.

It should answer:

> Why does distributed manufacturing matter?

Not:

> Look at dramatic footage.

---

## Final chapter — probe

Use a deliberately unfinished visual:

- devboard;
- SWD cable;
- Tag-Connect / JTAG connector references;
- Iskra → probe → board diagram.

Label it:

> `NEXT BOTTLENECK / HARDWARE`

That unfinished ending makes the case more believable.

---

# Claims / status boundaries

## Safe

- WPF + CLI + shared application/core architecture exists.
- Iskra drives Black Magic Probe through ARM GDB.
- signed catalogs are required by default on the production path.
- flash attempts are logged to SQLite.
- Ukrainian, English and German operator presentation exists.
- separate public catalog / private artifact / private source architecture is documented.
- per-person GitHub Device Flow + collaborator access model is documented.
- project explicitly tracks remaining HIL/security production gates.
- Ci-clop and Venovisor firmware have publishing integration into the Iskra distribution model.

## Avoid

> “Factory production ready.”

The repository's own roadmap keeps production acceptance gates open.

> “Secure.”

Prefer exact properties:

- signed metadata;
- hash verification;
- source/artifact separation;
- individual access/revocation;
- fail-closed behavior.

Exact claims are much stronger than a broad security adjective.

---

# Future post angles

1. **The Flash button is the least interesting part of a flasher.**
2. **GitHub did not have the permission I needed, so I changed the repository architecture.**
3. **The right to manufacture is not the right to the source.**
4. **Why a 404 became a manufacturing UX problem.**
5. **Fail closed does not have to mean fail mysteriously.**
6. **Why I keep WPF while building Avalonia.**
7. **UI parity is not hardware-in-the-loop acceptance.**
8. **A hash is not enough: validating ELF/HEX address ranges.**
9. **Why batch locking is deliberately unfinished.**
10. **The last expensive part of the station is now the debugger.**

---

# FILE: 04_CI_CLOP.md

# Ci-clop

> **A flashlight interface redesigned for the moment when there is no time to think.**

**System marker:** ENERGY SYSTEM / CONTROL  
**Year:** 01 / 2026 →  
**Place:** Munich, DE  
**Role:** Embedded firmware · interaction design · product behavior · production integration  
**Node class:** FIRMWARE SYSTEM / EMBEDDED HARDWARE  
**State:** ACTIVE DEVELOPMENT

### Metrics

- **1→2** / physical buttons
- **3** / legacy brightness steps
- **4** / gesture classes: single · double · triple · hold

> **Authorship note:** the board is the Ci-clop platform, but this case-study should claim the firmware / behavior / production work unless PCB and schematic authorship are separately confirmed.

---

# Hero intro

Ci-clop started with a very practical problem in our older field lights. They had one button and a three-step brightness carousel: every press advanced to the next state. That was acceptable on a workbench and terrible when someone needed the light off immediately. Ci-clop redesigns the interaction around stress: two buttons with separate responsibilities, direct shutoff, configurable brightness that is remembered, gesture recognition for secondary functions, and an SOS mode when signalling by other means is difficult.

---

# Case study

## 01 — The old interface was simple until speed mattered

The previous lights had one physical button.

Press once: one brightness level.

Press again: the next.

Again: the next.

The interface was easy to build and easy to explain. It also meant that **OFF was just another position in a carousel**.

That is the kind of interaction that feels harmless during testing because the person holding the device knows exactly what state it is in.

In a stressful situation it becomes a different product.

If light has to disappear immediately, nobody should have to remember whether the next press means brighter, dimmer or finally off.

That became the starting point for Ci-clop.

> **Turning the light off had to become an explicit action, not a state you eventually reach.**

---

## 02 — Two buttons were not added for more features

The second button was not added because the product needed “more controls.”

It was added because different actions have different urgency.

The main control can handle normal interaction: switching the light, choosing a preferred mode and adjusting brightness.

The second control can own actions that should remain unambiguous even when the user is under pressure.

That separation makes the hardware slightly more complex and the mental model much simpler.

One button is allowed to be expressive.

The other can be decisive.

This is the important design change from the old light:

> **The interface is no longer organized around how few buttons the PCB can get away with. It is organized around how quickly the user has to understand the result.**

---

## 03 — Immediate OFF is a safety feature

In the current firmware, the second button has an explicit short-press path that turns the light off immediately.

It does not advance a brightness carousel.

It does not wait to see which mode comes next.

It tells the output to stop.

That sounds almost too small to call a feature.

For me it is the feature that explains the whole redesign.

Embedded interfaces often optimize for minimum hardware: fewer buttons, fewer openings, fewer parts.

But a one-button interface transfers complexity into time and memory.

The user has to know where they are in the sequence.

Ci-clop spends one extra physical control to remove that uncertainty from the moment where it matters most.

---

## 04 — Brightness became something the user sets, not three states the device imposes

The older light offered three predefined brightness stages.

Ci-clop moves away from that carousel.

A long press can ramp brightness instead of forcing the user through only three fixed levels. The selected brightness is then saved so the device can return to it later.

That persistence changes the interaction more than it first appears.

The device stops asking:

> “Which of my three brightness levels do you want?”

and starts remembering:

> “This is the level you chose.”

The firmware also gives feedback when the brightness reaches its minimum or maximum boundary, rather than letting the user keep holding a button while nothing visibly changes.

It is a small state machine, but it makes the light feel far less arbitrary.

---

## 05 — Single, double, triple and hold are a vocabulary

Two physical buttons still do not mean only two possible actions.

The firmware recognizes different gesture classes:

- **single press**
- **double press**
- **triple press**
- **long hold**

Those gestures are not used simply to pack as many features as possible into the device.

The useful question is whether the gesture matches the cost of the action.

A common action should remain easy.

An emergency or rarely used action can require something more deliberate.

A triple press can therefore be appropriate for SOS because it is much harder to trigger accidentally than a normal click.

A long hold makes sense for brightness because the action itself is continuous.

The firmware becomes a small input language.

The goal is not maximum density.

It is **predictable intent**.

---

## 06 — SOS exists because sometimes the normal signalling path is not available

The SOS mode is not there because blinking Morse code looks good in a feature list.

It exists for the case where someone needs to signal their position or request help and, for whatever reason, the normal way of communicating is difficult or unavailable.

That is why it is intentionally harder to trigger than a normal lighting action.

In the current interaction model, SOS is entered through a deliberate multi-click gesture.

Once active, it temporarily owns the light output, runs the SOS timing, and can return the device to the previous lighting state afterward.

The important firmware problem is not drawing dots and dashes.

It is making emergency behavior **dominant without destroying the user's previous state**.

---

## 07 — Shared LEDs need an owner

Ci-clop has several behaviors that want to communicate through the same physical outputs:

- normal illumination;
- brightness-boundary feedback;
- battery indication;
- SOS.

If each subsystem is allowed to manipulate the output independently, individually correct features can create an unpredictable product.

The firmware therefore needs an order of authority.

SOS should dominate normal feedback.

A temporary brightness blink should not erase the selected lighting mode.

Battery indication should not keep fighting the emergency output.

This is where a small flashlight becomes an interesting embedded-systems problem.

The user sees one light.

The firmware sees several state machines competing for the same resource.

The product works only if that competition is resolved before the user ever notices it.

---

## 08 — Power management became part of the interaction model

Battery-powered devices fail in more ways than “battery empty.”

Charging introduces states. Plugging power in can wake the system. Charge completion can leave an indicator active longer than intended. Low battery needs feedback that does not waste the remaining runtime. Button activity may need to keep the MCU awake while idle periods should allow deeper sleep.

The repository history shows this becoming more explicit over time:

- charger-state handling;
- low-battery warning;
- power-management work;
- LPTIM-based low-power behavior;
- charger wake fixes;
- explicit separation into modules such as `charger_state`, `power_ctrl`, `hbridge`, button control and WS2812 state.

The firmware stopped being a loop with a few effects.

It became a set of interacting product states.

---

## 09 — We removed the power-bank feature

An early hardware direction included the idea of using the same device as a power bank.

It sounded attractive: the flashlight already contains a battery, so why not let it charge another device too?

In practice, that direction created technical problems and we dropped it from the flashlight.

That decision belongs in the case because it is exactly the kind of thing that disappears from polished portfolio stories.

Not every possible feature improves the system.

A field light benefits more from predictable lighting, power behavior and a simple mental model than from becoming a worse version of a general-purpose power bank.

So the final product direction is intentionally narrower.

> **Ci-clop is a better flashlight because it does not have to be everything else.**

---

# The bridge to manufacturing

## 10 — Black Magic Probe solved my development problem and exposed the production problem

During firmware development I added Black Magic Probe support to the project workflow.

That made development more convenient.

It also made the manufacturing problem obvious.

The production process still assumed someone could:

- connect SWD;
- identify the right probe endpoint;
- know the target;
- invoke ARM GDB;
- choose the right ELF;
- read the console;
- decide whether the result was trustworthy.

That person was still me.

If Ci-clop was meant to be assembled by volunteers, the firmware process could not remain a private engineering ritual.

A few days later the Iskra repository appeared.

The relationship is important:

> **Iskra was not invented as a separate desktop-app idea. It grew out of the point where Ci-clop firmware met repeatable production.**

---

## 11 — Releases became part of the device architecture

The project later became one of the first products wired into the Iskra release path.

Its CI can publish built firmware into the shared distribution repository rather than exposing the private source repository to operators.

The catalog can then reference the compiled artifact.

That means a device release is no longer just “a git tag.”

It is part of a chain:

```text
private source
     │
     ▼
build
     │
     ▼
production artifact
     │
     ▼
signed catalog
     │
     ▼
approved Iskra station
     │
     ▼
physical device
```

For me this is where Ci-clop stopped being only a firmware project.

It became the first real product exercising a manufacturing system.

---

# Timeline

## The previous light

- one button;
- three-step brightness carousel;
- OFF reached as part of the sequence;
- acceptable in calm use, poor when immediate darkness is needed.

This is the actual product problem that should open the case.

## January 2026

Initial next-generation behavior becomes visible:

- working SW1 lighting behavior;
- battery sensing experiments;
- double-tap recognition;
- second-button logic;
- smoother output transitions.

Use:

- `video_37@26-01-2026_10-01-52.mp4`
- `video_38@26-01-2026_10-01-52.mp4`
- `video_39@26-01-2026_10-02-01.mp4`

## February 2026

- SOS behavior;
- minimum brightness;
- interaction refinement.

## May 2026

A major firmware maturation period:

- charger and LED-state work;
- Black Magic Probe support;
- triple-click SOS;
- low-battery warning;
- brightness-edge feedback;
- power management;
- project renamed from the earlier `pocket-light` naming to `ci-clop`;
- Iskra catalog integration starts.

## June 2026

- codebase refactoring;
- power and charger handling become more explicit;
- state responsibilities separate into modules.

## August 2026

- CI publishes built firmware into the shared Iskra distribution repository;
- distribution repository moves under the Energy-for-Ukraine organization;
- short-lived GitHub App token replaces a long-lived PAT in the publishing flow;
- charger wake behavior receives another release fix.

---

# Current state

Ci-clop is best presented as **active embedded firmware / interaction-system development**.

The strongest honest summary is:

> Ci-clop replaces the old one-button brightness carousel with an interaction model designed around urgency: direct OFF, two controls with different responsibilities, saved configurable brightness, deliberate gesture recognition and an SOS mode, all wrapped in firmware that can be released through the same production infrastructure as the rest of the Energy system.

---

# Condensed scaffold copy

## `year`

`01 / 2026 →`

## `place`

`Munich, DE`

## `role`

`Embedded firmware · interaction design · production integration`

## `metrics`

1. `1→2` / `physical buttons`
2. `3` / `legacy brightness steps`
3. `4` / `gesture classes`

## `intro` — 84 words

Ci-clop started with a practical problem in our older field lights. They had one button and a three-step brightness carousel: every press advanced to the next state. That was acceptable on a workbench and terrible when someone needed the light off immediately. Ci-clop redesigns the interaction around stress: two buttons with separate responsibilities, direct shutoff, configurable brightness that is remembered, gesture recognition for secondary functions, and an SOS mode when signalling by other means is difficult.

## `sections`

### OFF should not be part of a carousel

The old light used one button to move through three brightness stages and eventually reach OFF. In calm use that was simple. Under stress it meant the user had to know where they were in the sequence before they could make the light disappear. Ci-clop adds a second physical control so immediate shutoff can be an explicit action rather than another position in the carousel. One extra button removes a surprising amount of uncertainty.

### Two buttons became an input language

The new firmware recognizes single, double, triple and held inputs. The point is not to hide as many features as possible behind gestures. Common actions remain simple, while rarer or higher-cost actions can require more deliberate input. A long hold works naturally for brightness ramping; a triple press makes SOS harder to trigger accidentally. The interface becomes expressive without forcing every operation through the same button sequence.

### Brightness now belongs to the user

Instead of three fixed brightness stages, the firmware lets the user ramp the level and stores the chosen value for later. It also gives feedback when the brightness reaches its minimum or maximum boundary. SOS and battery indication are separate states that temporarily own the shared outputs without destroying the normal lighting state. The result is less about “more modes” and more about making a small, display-less device predictable.

### The firmware created the manufacturing problem

Adding Black Magic Probe support solved my development workflow and exposed the next bottleneck: volunteers should not need to understand SWD, GDB, target names or firmware files. Ci-clop became one of the first products connected to the Iskra release path, where private source can build production artifacts for approved flashing stations. An early power-bank idea was intentionally dropped after technical problems; the product became stronger by narrowing its job instead of accumulating features.

---

# Suggested links

- Iskra: `https://github.com/oleksandrmaslov/iskra`
- Energy for Ukraine field note
- public Ci-clop documentation when ready

---

# Visual storyboard

## Hero — begin with the problem, not the PCB

The first visual should ideally compare the **old one-button light** with the new Ci-clop-controlled device.

Overlay:

```text
OLD
1 BUTTON
3-STEP CAROUSEL
OFF = ANOTHER STEP

NEW
2 BUTTONS
DIRECT OFF
SAVED BRIGHTNESS
SOS
```

If you have a clear old-light photo in the Energy archive, use it here.

This will make the case immediately understandable even to someone who knows nothing about embedded systems.

---

## Bring-up

Use:

- `video_37@26-01-2026_10-01-52.mp4`
- `video_38@26-01-2026_10-01-52.mp4`
- `video_39@26-01-2026_10-02-01.mp4`

Caption:

> Once the second button existed, every gesture and conflict between states had to be defined in firmware.

---

## Interaction chapter

Use an animated state diagram:

```text
BUTTON 1
single  → normal light action
double  → alternate/preferred mode
hold    → brightness ramp + save

BUTTON 2
short   → immediate OFF
hold    → battery indication
triple  → SOS
```

The public diagram can use only the gestures you want to expose.

---

## Stress-case chapter

Use one strong sentence full-screen:

> **OFF is not a mode you should have to search for.**

Then show the new two-button device.

This is probably the strongest chapter transition on the whole page.

---

## SOS chapter

Avoid military drama.

Use the firmware state diagram:

```text
NORMAL STATE
    ↓ deliberate gesture
SOS OWNS OUTPUT
    ↓ exit
RESTORE PREVIOUS STATE
```

Caption:

> Emergency behavior should interrupt the product, not corrupt it.

---

## Feature-cut chapter

A very good short editorial break:

> `FEATURE REMOVED / POWER BANK`

Then:

> It sounded useful. It created technical problems. We removed it.

This shows product judgment, not failure.

---

## Manufacturing bridge

Transition from SWD/BMP to Iskra.

Caption:

> The new interface was repeatable. Flashing it still depended on the firmware engineer.

---

# Claims / boundaries

## Safe

- previous light had one button;
- previous interaction used a three-stage brightness carousel;
- immediate OFF was difficult because OFF belonged to that sequence;
- new system has two buttons with different responsibilities;
- firmware recognizes single/double/triple/hold gestures;
- adjustable brightness can be saved;
- SOS mode exists for deliberate signalling;
- current code contains immediate-off, battery-indication, SOS and brightness-ramp logic;
- Black Magic Probe support exists in the firmware history;
- Ci-clop is connected to the Iskra distribution/release path;
- the power-bank feature was explored and then dropped because of technical problems.

## Remove from public final-feature lists

- “Ci-clop flashlight works as a 10 W power bank.”
- “USB-C power-bank feature” as a current product feature.

If the early board documentation mentions bidirectional/power-bank capability, present it only as an **abandoned development direction**, not the shipped/product behavior.

---

# Future post angles

1. **OFF should not be part of a carousel.**
2. **Why we added a second button to a flashlight.**
3. **A one-button interface can be more complex than a two-button interface.**
4. **What stress does to “simple” UX.**
5. **Why brightness should be remembered instead of selected from three presets.**
6. **Single, double, triple, hold: designing a tiny input language.**
7. **SOS is a state, not a blinking animation.**
8. **Emergency behavior should restore the state it interrupted.**
9. **We removed the power-bank feature. The product got better.**
10. **The commit that added Black Magic Probe and exposed the next bottleneck.**

---

# FILE: 05_VENOVISOR_FIRMWARE.md

# Venovisor Firmware

> **Firmware for the next generation of a medical device that already had real users.**

**System marker:** ENERGY SYSTEM / MEDICAL  
**Year:** 06 / 2026 →  
**Place:** Munich, DE / field context in Ukraine  
**Role:** Embedded firmware · device behavior · manufacturing integration  
**Node class:** FIRMWARE SYSTEM  
**State:** ACTIVE DEVELOPMENT

---

# Authorship statement

This should remain visible somewhere on the page, even if the wording changes.

> **Venovisor existed before I joined its development.**
>
> The earlier hardware, enclosure and initial redesign are not my work. My case-study starts with the next firmware generation and the production infrastructure around it.

This is not a disclaimer that weakens the case.

It is one of the strongest parts of the case.

---

# Hero intro

Venovisor existed before I joined its development. It had already been built, delivered and used by medics in Ukraine. My work starts with the next generation: adapting the firmware to new hardware and functionality, and moving the device into the same controlled production pipeline as Ci-clop. That distinction matters to me. I am not presenting the original hardware as mine. I am showing what changes when firmware work begins on a device that already has real users.

---

# Case study

## 01 — This project did not start on my desk

Most personal embedded projects begin with a blank schematic or a list of requirements.

My Venovisor work began later in the lifecycle.

Energy for Ukraine had already joined an existing Ukrainian venovisor effort in 2024. The earlier prototype was considered too bulky and limited, and the team developed a more compact version with USB-C charging and status indication.

Those earlier mechanical and hardware decisions are project history, not my authorship.

What matters for my work is what happened afterward:

the devices were actually built, shipped and used.

There are field reports of venovisors reaching medical teams, photos of the device in a hospital, and later recipient feedback.

That changes the tone of firmware development.

The user is no longer imaginary.

---

## 02 — Real users make “small” behavior decisions heavier

When a device is already used in medical work, firmware changes stop being pure experimentation.

A button gesture that is slightly confusing on a hobby project is an annoyance.

A state transition that is ambiguous on a tool used under pressure is a product problem.

My current work is therefore less interesting as a list of MCU features than as a constraint:

> **Adapt the next hardware generation without losing the predictability that a fielded device needs.**

This is also why I prefer to keep the page focused on firmware rather than pretending to own the entire device.

The engineering question is specific enough:

How should the next controller behave, and how do we make that behavior repeatable across manufactured units?

---

## 03 — Share the platform, not necessarily the behavior

The Venovisor firmware repository shares a technical lineage with the Ci-clop firmware work.

That is useful because the underlying control problems overlap:

- button handling;
- H-bridge / high-power output behavior;
- power management;
- persistent product settings;
- low-level PY32 MCU support;
- build and flashing infrastructure.

But the products should not be forced into the same interaction model simply because code can be reused.

A medical device and a field light have different priorities.

Reusable embedded architecture is valuable when it lets the product-specific behavior become clearer, not when it makes every product behave the same.

The repository structure reflects that transition: common technical ideas can survive while the Venovisor-specific controller behavior is rearranged around its own use case.

---

## 04 — The manufacturing path should be shared even when the product is not

The strongest shared layer between Ci-clop and Venovisor is not necessarily the UI.

It is production.

Both products can use the same release infrastructure:

```text
private firmware source
       │
       ▼
CI build
       │
       ▼
compiled production artifact
       │
       ▼
shared firmware distribution repository
       │
       ▼
signed Iskra catalog
       │
       ▼
approved operator
       │
       ▼
physical device
```

By August 2026 the Venovisor firmware CI had been wired to publish built firmware into the Iskra distribution repository, using the same architectural separation that keeps source repositories away from manufacturing operators.

That is a good example of platform thinking at the correct layer.

The products can remain different.

The manufacturing trust model does not have to be.

---

# Field evidence

## 05 — The device already closes the loop

The Energy archive contains something that most personal firmware projects never get:

evidence from the far side of deployment.

Venovisors have been photographed after delivery and in medical use. Medical units have sent thanks for delivered venovisors and lights. Later reports continue to show devices reaching recipients.

For the portfolio, those images should not be treated as proof that my firmware caused an outcome that predates it.

They prove something narrower and more useful:

> **I am writing the next firmware generation for a device family that already has a real operational context.**

That is the correct claim.

It also makes the future test standard clearer.

A firmware revision is not finished because it behaves correctly on my bench.

It has to survive the manufacturing and use environment that already exists around the product.

---

# Current state

The new Venovisor firmware is active development.

The repository has been separated as a Venovisor-specific firmware branch and connected to the Iskra publishing architecture.

The broader next-generation device work is still evolving, including the larger universal controller direction mentioned in the Energy development work.

Do not oversell that board as a finished standardized platform yet.

The strongest present-tense story is:

> The firmware architecture and production path are being prepared for the next hardware generation of an existing field-deployed medical device.

---

# Condensed scaffold copy

## `year`

`06 / 2026 →`

## `place`

`Munich, DE`

## `role`

`Embedded firmware · device behavior · manufacturing integration`

## `metrics`

Do not force marketing metrics here.

Suggested options:

1. `1` / `fielded device family`
2. `3` / `shared production layers` — source / artifact / catalog
3. leave one metric empty until a real firmware/device number is useful

A stronger page can have only two metrics rather than inventing a third.

## `intro` — 85 words

Venovisor existed before I joined its development. It had already been built, delivered and used by medics in Ukraine. My work starts with the next generation: adapting the firmware to new hardware and functionality, and moving the device into the same controlled production pipeline as Ci-clop. That distinction matters to me. I am not presenting the original hardware as mine. I am showing what changes when firmware work begins on a device that already has real users.

## `sections`

### The prototype already had users

My Venovisor work did not start from a blank product. Energy for Ukraine had already been producing and delivering venovisors, and field reports show them reaching medical teams and being used in a hospital. The earlier hardware and enclosure are not my work. My case starts later, with the next firmware generation. That changes the engineering context: interaction and power behavior now belong to a device family with real users rather than an imagined requirement sheet.

### Reuse the platform, not the product behavior

The new firmware shares technical lineage with the Ci-clop work: button handling, output control, power management and the same PY32-class embedded environment. But reuse is only valuable if it leaves room for product-specific behavior. A medical device should not inherit a field light's interaction model simply because the code exists. The goal is to reuse the stable control architecture while making the Venovisor state model explicit for its own workflow.

### Production is the shared layer

Venovisor firmware now connects to the same controlled release infrastructure as Ci-clop. Source remains in a private engineering repository, while compiled production artifacts can be published separately and referenced through the signed Iskra catalog. That means the operator who flashes a device does not need access to the firmware source or development history. The products stay different, but the manufacturing trust model can be shared.

### Where it stands

This is active development for the next hardware generation, not a retrospective claim over the original Venovisor. The firmware repository and production path are in place; the broader controller and product functionality continue to evolve. The next meaningful milestone is not another screenshot. It is validating the new behavior against the real manufacturing and medical-use context that already exists around the device.

---

# Suggested visual opening

This page should be visually honest immediately.

A very strong opening sequence:

### Screen 1

Field / hospital image of an existing Venovisor.

Large text:

> `THIS DEVICE EXISTED BEFORE MY WORK.`

### Screen 2

Code / controller / current development.

Large text:

> `THE NEXT FIRMWARE GENERATION DOESN'T.`

Then the case begins.

This is unusual, memorable and ethically clean.

---

# Visual storyboard

## Existing context

Use the hospital-use / recipient images:

- `photo_311@13-12-2025_15-16-49.jpg`
- `photo_328@22-12-2025_16-23-11.jpg`
- `photo_412@23-02-2026_13-31-01.jpg`
- `photo_420@15-03-2026_21-17-01.jpg`
- `photo_464@01-05-2026_16-15-14.jpg`

Do not imply these photos show the new firmware.

Caption them as:

> Previous-generation Venovisors in the real deployment context the next firmware has to respect.

---

## Manufacturing process

Use:

`video_54@13-05-2026_18-02-01.mp4`

Telegram explicitly identifies this as a timelapse of 3D-printing Venovisor parts.

This is useful context even though the print process is not your personal contribution.

Label it as **project production context**.

---

## Firmware section

Show:

- current source modules;
- product-specific state diagram;
- the point where the shared Ci-clop lineage diverges into Venovisor behavior.

Avoid long code screenshots.

A diagram is stronger:

```text
shared embedded layer
   │
   ├── power
   ├── button primitives
   ├── output control
   └── toolchain
         │
         ▼
VENOVISOR-SPECIFIC STATE MODEL
```

---

## Production infrastructure

Transition into the Iskra three-repository model.

Caption:

> Shared production infrastructure is more valuable here than shared product behavior.

---

# Publication boundaries

## Safe

- Venovisor existed before your work.
- Energy for Ukraine had already manufactured and delivered the device family.
- field/hospital images exist.
- current work is next-generation firmware.
- firmware is connected to the Iskra production distribution path.
- code shares technical lineage with the Ci-clop firmware work.

## Do not claim

- original Venovisor invention;
- original hardware redesign;
- original enclosure design;
- every earlier fielded Venovisor contains your firmware;
- medical efficacy claims not supported by controlled evaluation.

Prefer:

> “used by medics”

over:

> “clinically proven”

Prefer:

> “designed to help visualize veins”

over unverified diagnostic-performance numbers.

---

# Future post angles

1. **I did not build this medical device. I am writing its next firmware generation.**
2. **Why authorship boundaries make a portfolio stronger.**
3. **What changes when your embedded project's user already exists.**
4. **Reuse the control architecture, not the interaction model.**
5. **The most reusable part of two products turned out to be the manufacturing pipeline.**
6. **A field photo is not proof of my code. It is proof of the context my code has to survive.**
7. **Why I renamed the portfolio page Venovisor Firmware.**
8. **How a private firmware repo can feed a volunteer manufacturing station without exposing source.**

---

# FILE: 06_ENERGY_FOR_UKRAINE_EDITORIAL.md

# Energy for Ukraine

> **Field note / ecosystem story — not a personal project claim**

**Type:** Editorial / blog page inside the portfolio universe  
**Timeline:** 06 / 2024 →  
**Base:** Munich, DE  
**Context:** devices delivered to Ukrainian volunteers, military units and medical teams

---

# Why this page belongs in the portfolio

Energy for Ukraine should not be presented as “one of my projects” in the same sense as Wafer or Iskra.

It is more useful as the real-world environment that explains why several engineering projects exist.

The story is not:

> I made a charity project.

The story is:

> **What happens to engineering when a device has to be built by volunteers, shipped across a real logistics chain, used under pressure, repaired with limited tools and eventually reproduced by people who did not design it?**

Energy for Ukraine provides the feedback loop.

Ci-clop, Venovisor Firmware and Iskra are some of the engineering responses to that loop.

---

# Suggested editorial hero

## Headline

> **The workshop should not be the boundary of the system.**

## Subhead

Energy for Ukraine began by giving discarded lithium cells a second life. It gradually became a volunteer production system: power devices, lights, medical tools, documentation, assembly sessions and field feedback from Ukraine. I work inside that ecosystem on embedded firmware and manufacturing infrastructure. The interesting part for my portfolio is not claiming the whole project. It is seeing how real production constraints created Ci-clop, Venovisor Firmware and Iskra.

---

# The story

## 01 — It began with something people were throwing away

The Telegram archive begins in June 2024 under the earlier **Energy Stick for Ukraine** name.

The initial idea was direct:

lithium cells inside discarded electronic cigarettes and other battery packs were being thrown away, while Ukraine was dealing with damaged infrastructure, power interruptions and a constant need for portable energy.

The early devices were intentionally simple.

Reuse the cell.

Add protection and charging/power electronics.

Put it in a practical enclosure.

Send useful energy somewhere it mattered more than the original disposable product.

This is important because the project did not begin with a polished product strategy.

It began with a resource mismatch.

Something valuable was being discarded in one place and urgently useful in another.

---

## 02 — Prototypes became a production problem

Once a device works once, the next question is quantity.

By the end of 2024 the project was already describing a transition from individual experiments toward dozens of devices per month, direct component sourcing and a broader product range that included power devices, tactical lights and venovisors.

Later workshop reports make the scale more concrete.

One November 2025 update says roughly **60 devices had been assembled in a few weeks**.

Another documented shipment lists **92 devices** in one batch, including lights, power devices and four venovisors, with additional cables and batteries for Ukrainian engineers.

That kind of scale is still tiny compared with industrial manufacturing.

But it is large enough that “the person who invented it remembers how to build it” stops being a production method.

---

## 03 — Volunteers changed the definition of the product

The project repeatedly invited people with soldering irons and 3D printers to help.

More importantly, by February 2025 it was already offering archives, instructions, models and documentation to people who wanted to organize production in another city.

That decision is one of the most important moments in the whole story.

The object was no longer the complete product.

The **ability to reproduce the object** became part of the product.

That changes engineering priorities.

A clever assembly trick that only one person understands becomes a liability.

A flashing procedure that depends on the firmware author becomes a bottleneck.

A bill of materials that requires one obscure module becomes a scaling risk.

Documentation and tooling stop being paperwork around engineering.

They become engineering.

---

## 04 — The workshop grew around that idea

The archive later shows a dedicated Munich space, larger battery intake, volunteer work sessions and Open Day events designed to teach people electronics and soldering.

At one point the team reported receiving more than **3,000 battery cells** and roughly **100 kg of electronic-cigarette material** for recycling.

The exact number matters less than what it says about the process.

Once material arrives in bulk, sorting, testing, storage, safety, assembly and traceability become their own workflows.

The workshop becomes a small production system whether or not anyone calls it a factory.

That is the environment where standardized control boards start making sense.

It is also the environment where a firmware flasher starts becoming a product.

---

# Field loop

## 05 — The first real test is what comes back from the field

Most hardware projects end with the glamour shot.

Energy for Ukraine often gets another kind of image:

a photo or video sent back after delivery.

Those images close the loop between a design decision and the environment it actually entered.

Venovisors appear with medical teams.

Power devices appear with units.

Lights appear inside real work spaces.

The important portfolio use of those images is not emotional proof that “our work matters.”

It is engineering evidence.

A strap, mounting point, light mode or battery decision becomes easier to evaluate when the object is no longer sitting on the bench where it was designed.

---

## 06 — One Energy Cell, three different jobs

A June 2026 report describes a particularly useful example.

In the video, Energy Cells are being used simultaneously for three different tasks around medical work:

- one as a white light source;
- another in red-light mode;
- another to power a tablet carrying medical information.

That is a good explanation of why the device evolved beyond a generic power bank or flashlight.

The value is not a long feature list.

The value is that one compact energy object can move between power, illumination and low-signature lighting depending on what the person needs at that moment.

This is the kind of requirement that is difficult to invent convincingly in a design meeting.

It becomes obvious when the device is actually used.

---

## 07 — When the vehicle lost its own light

Another June 2026 field report is even more direct.

An evacuation vehicle had been damaged by a drone strike. Part of the wiring burned and the vehicle lost its normal lighting.

The medical crew continued transporting and stabilizing a wounded person.

Energy Cells were strapped inside the vehicle and used as independent light sources.

The engineering lesson is not “our light saved a life.”

That is too broad a causal claim.

The useful lesson is narrower:

> **A portable light becomes infrastructure when the infrastructure around it fails.**

The device needed to be autonomous, quickly mountable and useful inside a moving vehicle where there was no time to create a proper installation.

That makes strap points and autonomous runtime more than convenience features.

---

# The move toward custom electronics

## 08 — Module stacks were fast, but they froze the behavior

The early devices benefited from existing power-bank and LED modules.

That is the right choice when speed and cost dominate.

As the product range grew, the limitations became more visible.

A module stack gives you someone else's:

- charging behavior;
- indicator logic;
- sleep behavior;
- current limits;
- button semantics.

The December 2025 / January 2026 development direction introduced a small programmable controller intended to replace more of that fixed behavior.

The Energy development log describes the new programmable board with:

- USB-C charging;
- an addressable status LED;
- two programmable buttons;
- two-wire control of a bi-color high-power LED;
- persistent settings;
- an 18 × 36 mm form factor.

An early direction also explored using the device as a power bank. That feature was later dropped because of technical problems and should not be described as part of the current flashlight.

That board became **Ci-clop**.

More importantly, the product problem was not simply replacing modules. The older lights used one button and a three-stage brightness carousel, which made immediate shutoff awkward in a stressful situation. Ci-clop gave the firmware two separate physical controls, remembered adjustable brightness, deliberate multi-click/hold gestures and an SOS mode.

The project had reached the point where custom firmware could improve the interaction, not just the electronics.

---

# The tooling problem

## 09 — Once volunteers build the board, who flashes it?

Programmable electronics improve the product and complicate production.

A volunteer who can solder does not automatically have an ARM toolchain installed.

They should not have to know:

- GDB syntax;
- probe COM ports;
- MCU target names;
- firmware file naming;
- release integrity;
- source-repository structure.

That was the gap that became **Iskra**.

Iskra is easier to understand when viewed from this page.

It is not a side software project attached to Energy for Ukraine.

It is one answer to a very specific scaling problem:

> **How do you make programmable hardware reproducible by people who are not the firmware engineer?**

---

# Distributed manufacturing

## 10 — Move the manufacturing knowledge closer to the need

The long-term direction is more interesting than simply increasing output in Munich.

People in Ukraine already recover cells, repair electronics and build useful hardware from whatever resources are available.

If a manufacturing package can provide:

- mechanical files;
- assembly instructions;
- a known controller;
- approved firmware;
- a simple flasher;
- eventually a cheap debug probe;

then part of the production loop can move closer to the people who understand the local need best.

That is still a direction, not a claim that the whole system has already been deployed this way.

But it is the architectural reason the current tools are being built.

The scale is not only more units.

It is more places capable of producing the unit.

---

# Editorial ending

The easiest way to describe Energy for Ukraine is with the devices.

I think the more interesting story is the infrastructure that slowly appears around them.

A used battery becomes a power source.

A prototype becomes an assembly process.

An assembly process becomes documentation.

A custom board creates firmware.

Firmware creates a flashing problem.

The flashing problem creates Iskra.

Now the probe itself is becoming the next thing worth redesigning.

That is why this page belongs in my portfolio universe.

Not because I can claim every object in it.

Because it shows where the next engineering problem comes from.

---

# Suggested page structure

This page can be longer and more editorial than a normal project page.

Recommended chapters:

1. **The discarded cell**
2. **From prototypes to batches**
3. **Volunteers change the product**
4. **Field feedback**
5. **One device, three jobs**
6. **The evacuation vehicle**
7. **Why Ci-clop appeared**
8. **Why Iskra appeared**
9. **Distributed manufacturing**
10. **The next bottleneck**

---

# Strong factual anchors

These are useful as side notes or large numerals.

### 06 / 2024
Channel / project history begins.

### ~60
Devices reported assembled in a few weeks in November 2025.

### 92
Devices listed in one November 2025 shipment.

### 3000+
Battery cells reported received during the 2025 workshop expansion.

### 18 × 36 mm
Size of the later programmable Ci-clop control board described in the Energy development log.

Use only the numbers that improve the story.

This page does not need to look like a charity impact dashboard.

---

# Visual storyboard

## Opening

Do not open with the most dramatic field video.

Open with a material transformation:

- reclaimed cells;
- battery sorting;
- early Energy Stick;
- workshop bench.

Then move forward.

This makes the field footage feel earned.

---

## Chapter: workshop

Use photos/video showing:

- cells;
- soldering;
- 3D printing;
- multiple volunteers;
- batches of finished devices.

Strong May 2026 production footage:

- `video_47@11-05-2026_03-48-20.mp4`
- `video_48@11-05-2026_03-48-20.mp4`
- `video_49@11-05-2026_03-48-20.mp4`
- `video_50@11-05-2026_03-48-20.mp4`
- `video_51@11-05-2026_03-48-20.mp4`

---

## Chapter: Venovisor context

Use recipient / hospital images as proof of the deployment loop, not as personal authorship proof.

Suggested:

- `photo_311@13-12-2025_15-16-49.jpg`
- `photo_328@22-12-2025_16-23-11.jpg`
- `photo_420@15-03-2026_21-17-01.jpg`
- `photo_464@01-05-2026_16-15-14.jpg`

---

## Chapter: field feedback

The strongest video in the archive for engineering context:

`video_2026-06-22_01-39-16.mp4`

Use a short, non-graphic excerpt.

Caption:

> After the vehicle's normal lighting failed, portable Energy Cells were strapped inside and used as autonomous work lights during evacuation.

Avoid sensational editing.

---

## Chapter: recipients / closed loop

Use later recipient videos:

- `video_58@23-07-2026_19-33-01.mp4`
- `video_59@23-07-2026_19-33-01.mp4`
- `video_60@16-08-2026_18-16-01.mp4`
- `video_61@17-08-2026_18-54-01.mp4`
- `video_62@20-08-2026_18-34-48.mp4`
- `video_63@21-08-2026_14-11-01.mp4`

Blur faces where appropriate.

---

## Chapter: Ci-clop

Use January 2026 board bring-up:

- `video_37@26-01-2026_10-01-52.mp4`
- `video_38@26-01-2026_10-01-52.mp4`
- `video_39@26-01-2026_10-02-01.mp4`

and:

`photo_363@26-01-2026_10-01-52.jpg`

Then link into the Ci-clop case.

---

## Chapter: Iskra

End the physical story with a software/manufacturing diagram.

The page should visually zoom out:

```text
DEVICE
  ↓
FIRMWARE
  ↓
FLASHING
  ↓
ACCESS
  ↓
DISTRIBUTED PRODUCTION
```

Then:

> `READ NEXT / ISKRA`

---

# Publication / ethics notes

Field footage can make this page powerful and can also make it cheap very quickly.

Avoid:

- dramatic music;
- “our devices save lives” as a generalized causal claim;
- graphic medical footage;
- precise live deployment locations;
- identities that do not need to be public;
- tactical details unrelated to the engineering story.

Prefer:

- the actual constraint;
- the device role;
- the production lesson;
- the feedback that caused the next revision.

The best sentence on the page is often smaller than the emotional one.

Example:

Instead of:

> “This device saved a soldier.”

Use:

> “When the vehicle lost its normal lighting, the crew used independent Energy Cells to keep working during evacuation.”

That is precise, verifiable and stronger.

---

# FILE: 07_CONTENT_LIBRARY.md

# Reusable Content Library

These are not polished “personal brand” posts. They are reusable story units pulled from the real case studies.

---

# Portfolio-wide angles

## 1 — I keep building the thing underneath the thing

**Hook**

> I keep accidentally building the thing underneath the thing.

**Story**

- wanted thinner keyboard;
- became PCB/power problem;
- wanted volunteer manufacturing;
- became firmware deployment problem;
- deployment became access-control problem;
- now programmer itself is the next bottleneck.

**Best visual**

One 4-frame sequence:

Wafer → Ci-clop → Iskra → cheap probe sketch.

---

## 2 — The hidden specialist

**Hook**

> The easiest way to find the next engineering project is to ask who the system still secretly depends on.

**Point**

If every volunteer can assemble the device but only one firmware engineer can flash it, production is not distributed yet.

**Visual**

Volunteer assembly → Iskra UI.

---

# Wafer posts

## 3 — Thinness is a stack budget

**Hook**

> I thought I was designing a thin keyboard case. I was actually budgeting height across an entire system.

Talk about:

- devboard stack;
- battery;
- display;
- switch height;
- magnets;
- PCB;
- enclosure;
- why one wrong 3D display model broke a case iteration.

**Visual**

Side profile photo + exploded diagram.

---

## 4 — My first PCB took three weeks

**Hook**

> My first custom keyboard PCB took almost three weeks. I rebuilt it twice.

Talk about:

- beginner confidence;
- 6 layers;
- RF footprint;
- bare nRF decision;
- learning to choose ISP1807 instead of “doing everything yourself.”

**Ending**

> Integration is not owning every problem. It is knowing which problems are worth owning.

---

## 5 — 30+ prints before CNC

**Hook**

> The expensive CNC mistake was not the first mistake. It was the first mistake I could no longer fix with another 3D print.

Talk about:

- 30+ iterations;
- tool access;
- fixturing;
- tolerance;
- adding material back.

---

# Ci-clop posts

## 6 — OFF should not be part of a carousel

**Hook**

> Our old flashlight had one button. Turning it off could require cycling through the brightness states first.

**Story**

The old interface had one button and three brightness stages. Every press advanced the carousel. On a bench that looked simple. In a stressful situation it meant OFF was not an explicit command.

Ci-clop uses two physical buttons with different responsibilities. One can handle normal light interaction; the second can shut the output down immediately and also carry deliberate secondary actions.

**Point**

> A one-button interface can be more cognitively expensive than a two-button interface.

**Best visual**

Old light vs Ci-clop, with the old three-step carousel drawn between them.

---

## 7 — SOS is not an animation

**Hook**

> SOS mode is easy if all you do is blink an LED. It gets interesting when the device has to return to exactly what the user was doing before.

Talk about state ownership and restoration.

---

## 8 — The commit that started Iskra

**Hook**

> I added Black Magic Probe support to a firmware repo and accidentally found the next project.

Talk about how developer flashing revealed the volunteer-manufacturing bottleneck.

---


## 8.5 — We removed the power-bank feature

**Hook**

> We removed a feature that looked perfect on the spec sheet.

An early Ci-clop direction explored making the flashlight double as a power bank.

It sounded efficient: there is already a battery in the device, so why not expose it?

In practice the feature created technical problems and made the product more complicated.

So we dropped it.

That is one of the decisions I want to keep in the case study because polished portfolios usually delete this part.

Not every technically possible feature belongs in the product.

For a field light, predictable lighting, direct OFF, saved brightness and emergency signalling were more important than turning it into a general-purpose power bank.

**Point**

> Product architecture is partly deciding what the device will refuse to become.


# Iskra posts

## 9 — The Flash button is the least interesting part

**Hook**

> The Flash button is probably the least interesting part of a production flasher.

Then list transaction gates:

catalog → revocation → auth → hash → target → probe → GDB → log.

---

## 10 — GitHub did not have the permission I needed

**Draft**

GitHub did not have the permission I needed.

I wanted to give someone access to production firmware releases without giving them access to the source repository.

Sounds trivial.

It isn't.

`contents: read` means source, history and releases.

There is no useful “release binaries only” permission.

So I stopped looking for a permission setting and changed the architecture.

Source lives in one private repository.

Built `.elf/.hex` artifacts live in a second private repository.

A public signed catalog points only to those artifacts.

Operators receive access to the artifact repository and nothing else.

Remove one collaborator and that person's next firmware download stops working.

No shared manufacturing account.  
No source exposure.  
No key rotation for everybody else.

Sometimes the cleanest permission model is not another permission.

**It is a different boundary.**

---

## 11 — Why a 404 is not a network error

**Hook**

> GitHub intentionally returns 404 when you are not allowed to see a private repo. In a factory tool, that can become a UX bug.

Explain:

- not approved vs network failure;
- why operator action differs;
- explicit `E_NO_REPO_ACCESS`.

---

## 12 — Lab-ready is a feature

**Hook**

> I would rather ship “HIL acceptance pending” than a fake green “production ready” badge.

Talk about:

- WPF;
- Avalonia;
- shared workflow;
- feature parity ≠ HIL parity;
- roadmap gates.

---

# Venovisor Firmware posts

## 13 — I did not build this device

**Draft**

I did not build this medical device.

That is exactly why I want it in my portfolio.

Venovisor existed before I joined its development. It had already been manufactured, delivered and used by medics in Ukraine.

My work begins with the next firmware generation.

That means I cannot rewrite the project history around myself.

The earlier hardware is context.

The field photos are context.

The problem I own is narrower:

How do we adapt the next controller and firmware without losing the predictability a real fielded device needs?

And how do we make that firmware manufacturable by people who do not have access to my source repository or development environment?

I think that boundary makes the case stronger, not weaker.

A portfolio should show what you actually changed.

Not everything that happened near you.

---

## 14 — Reuse the platform, not the behavior

**Hook**

> Two devices can share embedded infrastructure without sharing the same interaction model.

Ci-clop vs Venovisor.

---

# Energy for Ukraine posts

## 15 — The workshop should not be the boundary

**Hook**

> A device is not really reproducible if its designer still has to stand next to the soldering iron.

Talk about early documentation sharing and why distributed production changes product definition.

---

## 16 — Portable light as infrastructure

**Draft**

A portable light is easy to think of as an accessory until the infrastructure around it stops working.

One of the field reports we received showed an evacuation vehicle after part of its electrical system had been damaged.

The normal lighting was gone.

The medical crew still had to keep working while transporting a casualty.

They strapped independent Energy Cells inside the vehicle and used them as work lights.

I do not think the engineering lesson is “our device saved a life.” That is too broad and impossible to attribute cleanly.

The useful lesson is smaller:

**autonomy matters most when the infrastructure you assumed would exist is no longer there.**

Mounting matters.

A strap matters.

Independent battery power matters.

A feature stops being a bullet point when the environment removes the alternative.

---

## 17 — One device, three jobs

**Hook**

> The most convincing product requirements document I have seen was a video where three copies of the same device were doing three different jobs at once.

White light / red light / tablet power.

---

# Long-form post — Iskra origin

I did not build Iskra because I wanted another flashing GUI.

We were building programmable devices with volunteers.

At some point I realized that the last production step still depended on an embedded developer.

Download the right ELF.

Find the right programmer.

Connect SWD.

Start GDB.

Select the target.

Flash it.

Decide whether anything silently went wrong.

That workflow is perfectly normal for me.

It is ridiculous for a volunteer manufacturing station.

So I started removing the engineer from the process.

Iskra now treats a flash as a transaction rather than a button:

- trusted catalog;
- release state;
- firmware integrity;
- target compatibility;
- probe readiness;
- GDB execution;
- durable result.

The architecture later went further.

I wanted to approve someone to manufacture a device without giving them the firmware source.

GitHub does not have that permission.

So the security boundary became three repositories: public signed metadata, private binary distribution and separate private source.

The interesting part was never the button that says “Flash.”

It was deciding what has to happen around that button before I am willing to trust it.

---

# Long-form post — whole portfolio

I used to think my projects were unrelated.

A split keyboard.

A volunteer-built controller.

A firmware flasher.

A medical-device firmware branch.

Now I think I keep doing the same thing.

I wanted a thinner keyboard.

That became a PCB, power-management and firmware problem.

We wanted volunteers to manufacture hardware.

That became a firmware deployment problem.

Firmware deployment became an access-control problem.

And now the commercial programmer itself is becoming the expensive part of the system.

So the next thing I want to build is the programmer.

The pattern is not “hardware and software.”

It is:

**find the layer that prevents the rest of the system from scaling, then remove it.**

---

# FILE: 08_RESEARCH_NOTES_AND_MEDIA.md

# Research Notes and Media Index

This file is internal. It is meant to preserve the source logic behind the public copy.

---

# Source groups

## Wafer

Primary:

- Hack Club Blueprint journal: `https://blueprint.hackclub.com/projects/2800`
- GitHub: `https://github.com/oleksandrmaslov/wafer-zmk-config`
- current portfolio repo/page
- uploaded final-result photographs

Important verified story beats:

- project origin in March 2025;
- 36-key custom stagger after previous split builds;
- Ergogen / hand-outline layout work;
- stacked DIY architecture identified as a thickness problem;
- first PCB took almost three weeks;
- board rebuilt multiple times;
- early bare nRF52840 approach abandoned for ISP1807;
- power architecture evolved through separate charger/gauge ideas toward nPM1300;
- direct nPM1300 battery reporting implemented in a ZMK fork;
- 30+ enclosure prints before first CNC order;
- first CNC result exposed tolerance/manufacturing problems;
- electronics currently work; mechanical/manufacturing validation continues.

Unverified / do not publish as fact:

- “nPM1300 work merged upstream into ZMK.”

---

## Energy for Ukraine

Primary:

- uploaded Telegram `messages.html`
- uploaded `photos(2).zip`
- uploaded video archive
- public channel context

Important anchor dates / facts:

### June 2024

Channel/project history begins under Energy Stick for Ukraine.

Initial framing: reuse discarded lithium cells for useful power devices supporting Ukraine.

### End of 2024

Project describes moving from experiments toward repeated production and broader device categories.

Venovisor project enters the Energy context in December 2024.

### February 2025

Public post invites people with soldering irons / 3D printers and explicitly offers archives, instructions, models and documentation to people who want to organize production in another city.

This is one of the strongest pieces of evidence for the distributed-manufacturing story.

### October–November 2025

Dedicated Munich workshop context.

Post reports 3000+ battery cells and around 100 kg of vape material received for recycling.

November post reports roughly 60 devices assembled in a few weeks.

Another shipment lists 92 devices, including:

- Red Dwarf
- Energy Stick Mini
- Venovisor
- Energy Cell
- Energy Core
- Energy Brick
- Dwarf Mini

plus USB-C cables and batteries.

Do not turn this into a generic “impact metric” page unless it is useful to the story.

### December 2025 / January 2026

Development log describes a new programmable 18 × 36 mm control board with:

- USB-C charge/discharge;
- power-bank function up to 10 W;
- optional USB-A;
- addressable RGB/status LED;
- two programmable buttons;
- two-wire bi-color high-power LED control up to 5 W;
- persistent settings.

User confirmed this board is **Ci-clop**.

### June 2026

Very strong field-use material.

One report/video describes an Energy Cell being used for:

- white light;
- red light;
- tablet power

in medical work.

Another video/report describes an evacuation vehicle whose normal lighting failed after drone damage; Energy Cells were strapped inside and used as independent work lights during evacuation.

Use these as engineering context, not causal “life saved” claims.

---

# Venovisor authorship history

Telegram shows that the project already existed and had been redesigned by Energy for Ukraine before the current firmware work.

Public-safe narrative:

- an earlier Ukrainian prototype came into the project;
- Energy team considered it bulky / heavy / limited;
- team created a more compact version with USB-C and indication;
- devices were later delivered to medics and photographed in use;
- current personal contribution begins with the new firmware generation.

Do not rewrite the earlier redesign as personal work.

Strong field images in extracted key set:

- `photo_311@13-12-2025_15-16-49.jpg`
- `photo_328@22-12-2025_16-23-11.jpg`
- `photo_412@23-02-2026_13-31-01.jpg`
- `photo_420@15-03-2026_21-17-01.jpg`
- `photo_464@01-05-2026_16-15-14.jpg`

Process video:

- `video_54@13-05-2026_18-02-01.mp4` — Telegram caption identifies Venovisor 3D-print process.

---

# Ci-clop technical evidence

Private GitHub repository currently visible through the connected GitHub account:

`oleksandrmaslov/ci-clop-firmware`

The inherited README is still largely the generic PY32F0 template and should not be treated as the project story.

More useful evidence comes from source and commit history.

Current source modules include:

- `button_ctrl.c`
- `charger_state.c`
- `hbridge.c`
- `power_ctrl.c`
- `ws2812_ctrl.*`
- MCU/HAL support

Button-controller behavior currently includes:

- debounced SW1/SW2;
- single click;
- double click;
- SW1 brightness hold;
- brightness-boundary blink;
- SW2 immediate-off path;
- battery indication request;
- triple-click SOS;
- state restoration after SOS.

Commit-history anchors:

### Jan 23, 2026
Working SW1 diode carousel + battery sensing testing.

### Jan 26
Double tap.

### Jan 30
SW2 logic and smooth turn-on work.

### Feb 10–11
SOS and minimum brightness.

### May 1
Brightness edge blink.

### May 20
Large interaction/power period:
- charger/LED state work
- Black Magic Probe support
- triple-click SOS
- low-battery warning
- brightness-boundary handling

### May 25
Power-management / LPTIM work.

### May 26
Rename `pocket-light` → `ci-clop`.

### May 28
Notify Iskra catalog on firmware release.

### June
Refactoring + charger/power state cleanup.

### August 9
- built firmware publishing into Iskra distribution repository;
- distribution repository moved under Energy-for-Ukraine org;
- short-lived GitHub App token replaces PAT;
- charger wake fix / v1.0.4.

---

# Iskra evidence

Public repo:

`https://github.com/oleksandrmaslov/iskra`

README currently describes:

- factory flashing tool for ARM Cortex-M;
- Black Magic Probe;
- `arm-none-eabi-gdb`;
- signed catalog metadata;
- SQLite attempt logging;
- WPF app;
- CLI;
- shared Core/Application layers;
- Avalonia cross-platform work;
- installer path.

The repository explicitly says the audited build is **lab-ready rather than factory-production-ready** until remaining gates are closed.

Important architecture file:

`docs/FIRMWARE_ACCESS.md`

Key model:

```text
iskra-catalog      public   signed catalog + signature
iskra-firmware     private  compiled artifacts only
product-firmware   private  source + history + CI
```

Reason:

GitHub repository read permission cannot expose only releases without source/history.

Approval model:

- each operator uses their own GitHub identity;
- approve by granting Read access to artifact repository;
- revoke by removing collaborator;
- source repo should remain invisible to that identity.

Important explicit residual risks in the document:

- station credential/token storage is not magical;
- no perfect per-station identity in current user-oriented GitHub Device Flow model;
- binary confidentiality is limited without MCU readout protection.

Good portfolio language should preserve those boundaries.

Roadmap highlights:

- shared `FlashWorkflow`;
- signed-catalog gates;
- exactly-one-probe readiness;
- two-phase GDB flow;
- durable logging;
- load-range validation;
- WPF remains supported;
- Avalonia reaches functional flow parity but HIL acceptance remains a separate gate;
- batch mode is currently opt-in and shared multi-station locking is deliberately not faked.

---

# Video archive — strongest files

## Board / Ci-clop bring-up

- `video_37@26-01-2026_10-01-52.mp4`
- `video_38@26-01-2026_10-01-52.mp4`
- `video_39@26-01-2026_10-02-01.mp4`

Use for:

- bring-up;
- early lab context;
- programmable board story.

## Volunteer production

- `video_47@11-05-2026_03-48-20.mp4`
- `video_48@11-05-2026_03-48-20.mp4`
- `video_49@11-05-2026_03-48-20.mp4`
- `video_50@11-05-2026_03-48-20.mp4`
- `video_51@11-05-2026_03-48-20.mp4`

Use for:

- production system;
- multiple operators;
- why tooling has to scale.

## Venovisor production

- `video_54@13-05-2026_18-02-01.mp4`

## Field / recipient

- `video_2026-06-22_01-39-16.mp4`
- `video_58@23-07-2026_19-33-01.mp4`
- `video_59@23-07-2026_19-33-01.mp4`
- `video_60@16-08-2026_18-16-01.mp4`
- `video_61@17-08-2026_18-54-01.mp4`
- `video_62@20-08-2026_18-34-48.mp4`
- `video_63@21-08-2026_14-11-01.mp4`

Use carefully. Blur faces where appropriate.

---

# Wafer final result photos

## Hero in hand

`A872F6DC-BCDB-4080-9207-5EBCAB41425A.jpeg`

## Side profile

`E5699420-BFB3-4647-871C-486BE4134372.jpeg`

## Both halves, active displays

`247C37C1-66B4-434C-ADB9-725A015F3932.jpeg`

## Display close-up

`1659C908-D87A-4C98-91E0-DF9A299454D3.jpeg`

## Clean both-halves shot, displays blank

`54F9E90A-F267-44B3-82BE-1908FD0D0013.jpeg`

## Process / assembly

`BC5CB3DE-24F9-409E-B752-51E0EF83F9CE.jpeg`

## Magnetic side views

- `78B1E795-ED86-4470-97B0-84D715563822.jpeg`
- `D8A13CD5-1C35-40CA-85A1-B64564DAFAC8.jpeg`

## Refrigerator image

`ADCB7626-7225-49B1-8A26-B39CEEDE1591.jpeg`

---

# Facts that still need explicit confirmation before strongest possible public copy

## Ci-clop hardware authorship

Was the schematic / PCB layout designed personally, collaboratively, or by another team member?

Current copy deliberately claims only firmware / behavior / production integration.

## Larger universal Energy board

There is another larger universal controller direction intended for Venovisor / higher-power lights.

Do not merge it conceptually with Ci-clop until its actual design and ownership are separated clearly.

## Venovisor future hardware

Current copy treats the next hardware generation as active development.

Avoid implying that the larger universal board is already the final Venovisor production controller.

## Cheap probe

Currently a future R&D direction.

Do not give it fake metrics, a final BOM or “production-ready” language until the design exists.

---

# Recommended public / private separation

## Public case copy

Keep:

- technical decisions;
- architecture;
- product behavior;
- field constraints;
- high-level production context.

## Private research notes

Keep:

- exact unit names unless already intentionally public and useful;
- exact recipient identity;
- deployment details;
- internal repo topology beyond what is useful;
- unfinished security assumptions;
- any sensitive firmware / hardware design information that would not improve the case.
