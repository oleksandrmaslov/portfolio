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
