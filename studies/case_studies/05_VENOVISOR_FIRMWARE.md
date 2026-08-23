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
