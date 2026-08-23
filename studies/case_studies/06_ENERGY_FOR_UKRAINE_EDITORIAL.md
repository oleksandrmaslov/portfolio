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
