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
