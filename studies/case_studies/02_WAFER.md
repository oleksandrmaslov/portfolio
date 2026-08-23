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
