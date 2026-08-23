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
