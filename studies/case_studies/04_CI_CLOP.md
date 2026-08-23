# Ci-clop

> **A flashlight interface redesigned for the moment when there is no time to think.**

**System marker:** ENERGY SYSTEM / CONTROL  
**Year:** 01 / 2026 →  
**Place:** Munich, DE  
**Role:** Embedded firmware · interaction design · product behavior · production integration  
**Node class:** FIRMWARE SYSTEM / EMBEDDED HARDWARE  
**State:** ACTIVE DEVELOPMENT

### Metrics

Keep current metrics

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
