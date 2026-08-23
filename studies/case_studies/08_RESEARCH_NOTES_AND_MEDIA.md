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
