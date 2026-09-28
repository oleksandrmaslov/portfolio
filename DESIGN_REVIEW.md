# Portfolio readiness review — 24 September 2026

Audience: creative developers and collaborators. Goal: make the portfolio understandable immediately, retain the immersive work, and identify obstacles before an Awwwards submission.

Scope: current local checkout, served from the repository root. The owner identifies the GitHub Pages version as a static preview, not a release candidate. The initial investigation is followed below by an authorized, focused implementation pass. This is not a replacement of the visual concept.

Method: source review with independent content, accessibility and performance investigations; live browser review of the landing at desktop, tablet and mobile widths, selected work, Kerfur, and the contact ending. No formal design brief exists; the incumbent engineering/ASCII/universe identity and the owner's instructions are the design authority.

## Shared headers and menu opening — 28 September

The landing, all thirteen case studies, All Projects and Design System now use `PortfolioHeader` and one shared navigation stylesheet. The landing's separate Selected work and Contact links are removed. M.O. remains home, MENU stays in the same position, project pages retain their separate Universe return, and All Projects retains the System link. The reference page keeps its seven local section links below the shared header. Duplicate header/blur styles and obsolete clock/status markup were removed.

The menu opens with a short reveal from the right, coordinated text reveals and object arrivals. On the landing, one temporary 2D copy holds the composited universe frame while its existing renderer moves into the dialog; that copy is released once the entrance settles. Other routes use 36,056 bytes of renders captured from the same objects, with CSS motion and no additional WebGL context. The existing single cursor is temporarily moved into the native dialog's top layer, then restored on close. A z-index change alone would have left it behind the modal.

Browser checks cover the landing, Wafer, Iskra, Bulgaria 2026, All Projects and Design System; the three project compositions all use the same header. Escape returns focus without invoking a project's reverse flight. Iskra's menu Contact link reaches `/#contact`. Mobile has no horizontal overflow; reduced-motion opening has no animations. Browser measurements confirm identical landing/Wafer header and control rectangles. Runtime and HTML freshness checks pass for all sixteen public routes. The detector's sole finding was the existing reticle width transition, outside this change; no new navigation findings were reported. Independent finish disposition: **ship** after a screenshot-capture discrepancy was resolved using consistent captures and measured geometry. See [evidence and limitations](studies/awwwards-audit-2026-09-27-shared-header/README.md).

## Object-menu and motion follow-up — 27 September

This supersedes the text-only menu below while retaining its native typography and clear destinations. Each row now has a small object from the existing visual world: Wafer for Selected work, the universe's sampled `0x00` particles for About me, the board's SW1 switch for Contact, and an ordered group of featured-project models for All projects. There is no separate graphic stage. The object layer borrows the existing universe renderer, caps moving renders at 30 frames per second, and stops rendering after motion settles. A 1.2-second idle browser sample recorded no additional renderer frames.

Entrance and selection now have short coordinated transitions. The `0x00` hover was corrected to preserve its letter strokes: an eased light sweep and shallow depth flex replace the abrupt re-scatter. Keyboard and reduced-motion navigation remain immediate. Escape cancels a pending exit. A browser View Transition timeout found during QA was fixed by committing the DOM change synchronously, without waiting for animation frames inside the snapshot callback.

All four destinations, focus return, Escape cancellation, reduced motion, canvas restoration and desktop/mobile fit were checked in-browser. The final Work and Contact transitions completed without new console errors; Contact had cleared its transition class, dialog and scroll lock at the one-second check. Generated-runtime freshness and whitespace checks passed. Mechanical detector: no findings. Independent finish review: **ship**, with no material fixes for this menu scope. Evidence and limits are recorded in [the object-menu study](studies/awwwards-audit-2026-09-27-object-menu/README.md). This verdict does not close the broader readiness findings below.

## Text-menu follow-up — 27 September

The owner rejected the separate menu graphic and requested a stronger text menu. The full-screen menu now uses the existing Geist and Instrument Serif typography for four large native links, with quieter destination descriptions and a small `0x00 Oleksandr Maslov` signature. There is no graphic stage, new WebGL renderer or menu animation loop. The universe render gate also checks the open-menu class so another scene cannot wake it behind the opaque dialog.

Selected work, About me, Contact and All projects were checked in-browser; Selected work was activated with Enter, All projects completed its existing handoff, and Escape returned focus to MENU. Body overflow and prior pause state restore on close. Desktop/mobile captures, an additional narrow viewport and 200% root text sizing were checked; label wrapping prevents horizontal overflow. Runtime freshness and whitespace checks passed. Browser console inspection returned no errors.

The mechanical detector returned no findings. The fresh independent finish reviewer was unavailable because its usage limit was reached; the earlier reviewer verdict below does **not** cover this redesign. A disclosed local fallback review and evidence are recorded in [the menu study](studies/awwwards-audit-2026-09-26-menu/README.md). Physical-device, Safari and screen-reader checks remain outside this pass. Owner acceptance of the new visual direction is still pending.

## Selected sound and navigation follow-up — 26 September

Clear signal now runs on the main landing, retaining the approved sampled instruments and generative musical rules. The optimized player lazily loads only its selected bank, reuses bounded voice controls, detaches input sampling when stopped, and suspends on mute or page hiding. All 84 original mix-study files retain their hashes; the four private interactive directions remain available.

The menu is now a full-screen native dialog at every breakpoint, as requested by the owner. It replaces the compact mobile menu described in the earlier follow-up below. Selected work, About me, Contact and All projects are the four destinations. Escape restores focus; opening pauses the universe and closing restores the prior state. The landing's fixed-time Munich clock was removed from this header; other routes' clocks are unchanged.

Selected nodes became Selected work, reel cards use PROJECT, and the hover label says Open project. The title explicitly invites visitors to explore projects. Keep the ASCII M.O. as the visual signature; the readable full name, portfolio label and plain actions provide orientation. This is a design recommendation, not evidence of successful comprehension by unfamiliar visitors.

Hover tracking now moves fixed-size segments with transforms instead of changing SVG geometry and left/top every frame. The projected frame, glow, models and depth-of-field settings remain. Local diagnostic samples show that hover no longer adds per-frame layout work; they do not establish a real-device FPS claim. See [measurements and limits](studies/awwwards-audit-2026-09-25-performance/README.md).

Verification: 23 score/audio/HUD tests; lazy sound loading, mute cleanup and rapid restart in the browser; menu destinations, Escape/focus return; 1280 × 720 and 390 × 844 captures without horizontal overflow. Mechanical detector: no findings. Independent finish review: **ship**, no material fixes in this scope. The broader content, accessibility and startup-resilience findings below remain open.

## Implemented follow-up

- Quiet title identification: `0x00 OLEKSANDR MASLOV` and `PORTFOLIO · HARDWARE + SOFTWARE`. The universe remains the dominant surface; no large explanatory hero was added.
- Owner-selected origin text: **“I build the device. Then the firmware. Then the tools that put it in someone’s hands.”** It uses the existing five-line reveal and assembly timing. The pattern is grounded in Wafer's custom board/firmware, Iskra's guided flashing workflow, and the [PointAccel configurator](https://github.com/oleksandrmaslov/acceleration_configurator). It is an author statement, not a claim to own every discipline of every project; the individual authorship boundaries remain authoritative.
- Work/About/Contact in all three case-study compositions now use their actual anchor destinations. The separate Universe control retains its reverse flight.
- Global Enter shortcuts now defer to focused links, buttons, form controls and menu summaries. The index keeps its row keyboard navigation.
- The landing now has a native mobile Menu with Selected Work, About, Contact and All Projects. It closes after selection; Escape closes it and returns focus to its summary. Changed stylesheets are versioned because stale browser cache was observed during QA.
- Video textures now update when a new video frame is available using `requestVideoFrameCallback`, with the original playing-frame fallback for older browsers. Lens/ASCII animation continues at display rate. Paused seeking refreshes the image; disposal cancels frame callbacks and removes media listeners. The 1400px context recycling, shader, resolution and DoF are unchanged. [API behavior](https://developer.mozilla.org/en-US/docs/Web/API/HTMLVideoElement/requestVideoFrameCallback)

Verification: desktop and 375px mobile title/origin layout; mobile menu Enter/Escape/selection; landing Work and Skip to selected work by Enter; Kerfur Contact by click; Iskra About and Wafer Work by Enter; index filter Enter after row focus, then focused-row Enter to Wafer; Iskra video playback, full ASCII conversion and pause; the separate Universe exit animation and return to the landing work reel. The index test left five ZMK rows visible instead of navigating away. The menu and origin copy fit the mobile viewport without horizontal overflow. Generated-runtime freshness and whitespace checks passed after the final build; the mechanical design detector returned no findings for the changed UI sources.

Six engine regression tests failed against the original behavior and pass after the video change (`node --test tools/landing-runtime/ascii-video.test.cjs`). The independent test clocks supply 24 new video frames over 60 display ticks: uploads fell from 60 to 24, while the lens still draws on every display tick. A real Iskra clip produced 75 uploads for 75 presented frames over a 2.5-second browser sample. This verifies the mechanism; it is not a real-device FPS or battery-life benchmark.

Unfinished case studies, placeholder media, loading resilience, accessible media controls, explicit-pause persistence/reduced motion, idle callback scheduling and real-device performance measurement remain open. The original findings below retain their evidence and now identify the repaired areas.

## Main assessment

Preserve the visual concept. Prioritize a clearer opening, reliable shortcuts, finished editorial content and resilient loading. Those are concrete gaps; there is not yet evidence that rebuilding the visual world would solve them better.

Awwwards publishes Design 40%, Usability 30%, Creativity 20%, Content 10%. This makes clarity, navigation and completion material parts of the submission, alongside visual invention. These findings are readiness risks, not predictions of a jury score or guarantees of an award. [Official evaluation system](https://www.awwwards.com/about-evaluation/)

## Metaphor — clarified by the owner

Oleksandr is origin node **0x00**, from which the projects materialize because he built them. The teal particles represent his presence throughout the universe. Their assembly into 0x00 reveals that distributed presence as a single author. The field lets visitors explore the resulting projects; entering 0x00 leads into the person behind them. The final open channel invites contact.

The initial independent reading identified projects as nodes and 0x00 as their source, but did **not** identify the teal particles as Oleksandr. They read as atmospheric material. That is the specific narrative gap to address: the assembly currently delivers its visual payoff before the visitor knows what is assembling and why.

The visual language supports the intended story. The opening does not establish its referents quickly enough. Its most prominent explanatory content says “This field is live” and teaches operation. The identity is a small name/discipline label, the identity H1 is visually hidden, and “Proceed” names no destination. A visitor has to infer both what the environment represents and how to operate it at once.

The implemented opening gives 0x00 a visible association with Oleksandr's name and explicitly labels the portfolio. The fuller owner-selected statement belongs to the origin reveal, following the owner's request to keep attention on the universe at the title. Whether unfamiliar visitors now understand the particles as the author still needs an unprompted audience test.

If the referent remains unclear in that test, connect the teal material to the named origin through the existing choreography. A recognizable part of that material travelling from the resolved origin toward a project could establish authorship without a paragraph explaining every symbol. This remains a proposal, not an implemented animation or a claim that the current scene already shows that causal motion.

Suggested first-screen actions: **View selected work** and **Explore the field**. The first should go directly to work; the complete scroll narrative can remain available. “Selected work” should be the primary human-readable label, with node addresses as supporting language. At the board entrance, a short “About me — the source behind the work” can explain the transition before deeper technical metaphor appears.

This is a proposed communication change, not a prescription to cover the scene with a large generic hero block. Keep native, legible text within the existing composition and retain the ASCII mark, objects, depth, sound and handoffs.

## Must resolve before submission

### 1. Several ordinary navigation actions have the wrong destination

**Patched in the follow-up.** The evidence below describes the original behavior.

**Browser reproduced:** from Kerfur, clicking CONTACT returned to `/#work`, not `/#contact`. The standard, handoff and Wafer compositions prevent the About/Contact anchors and invoke the same reverse-flight handler. That handler only chooses `./` or `./#work`.

- [Standard page](app/projects/pages/standard-page.jsx#L244)
- [Handoff page](app/projects/pages/handoff-page.jsx#L245)
- [Wafer page](app/projects/pages/wafer-page.jsx#L225)
- [Shared destination logic](app/projects/pages/project-page-lifecycle.jsx#L32)

**Browser reproduced:** at the landing top, focusing WORK and pressing Enter moved to the introduction; the URL hash remained empty. The global title shortcut ignores buttons and text fields but intercepts anchors too. [Title shortcut](app/landing/sections/title.jsx#L213)

Fix: preserve the reverse flight for Universe, honor the requested destination for section links, and run page-level shortcuts only when they do not override a focused control. Verify Work/About/Contact with pointer and keyboard from each page composition.

### 2. Seven public case studies expose editorial instructions and incomplete evidence

The data review found 28 `[ writing pending … ]` body blocks across Kerfur, ZMK PointAccel, Split HID Display, ZMK Soft Off Plus, Sightseeing, Silent Depth and Brionel Catalogue. Four of these also have placeholder metadata and 12 `TBD` metrics in total. These routes remain reachable through the index, field where applicable, and project ring.

Thirteen source-less image blocks across those drafts fall back to `wafer-sample.webp`, a photograph of the Wafer keyboard. Captions can describe a Kerfur face or a configurator while the renderer supplies an unrelated project photograph.

- [Kerfur examples](app/projects/data.jsx#L208)
- [PointAccel examples](app/projects/data.jsx#L254)
- [Fallback in standard composition](app/projects/pages/standard-page.jsx#L113)
- [Fallback in handoff composition](app/projects/pages/handoff-page.jsx#L114)

Fix: complete the records with source-grounded material, or present concise truthful project records with an explicit case-study status until the full story is ready. Render authentic media only. Preserve every public route, model and ring slot; Silent Depth's deliberate field opt-out remains intact.

The actual four-project reel is Wafer, Iskra, Ci-Clop and Wafer Studio. All four have written case-study copy. Kerfur is not in `MO_FEATURED_ADDRS`.

### 3. Mobile removes direct navigation while retaining a long cinematic journey

**Direct navigation patched in the follow-up.** A compact native Menu replaces the missing mobile navigation. The complete scroll narrative remains available through Proceed.

At a verified 375 × 812 CSS viewport, Work/About/Contact/Index are absent; the visible opening choices are Explore and Proceed. This comes from `.shell__nav { display: none }` at ≤700px, without a replacement menu. Proceed enters the introduction rather than selected work.

- [Mobile rule](app/landing/styles/title.css#L140)
- [Proceed destination](app/landing/sections/title.jsx#L133)
- Screenshot: `studies/awwwards-audit-2026-09-24/screenshots/landing-mobile-375.png`

The measured mobile document height was about 16,562px at an 812px viewport. This is evidence of journey length, not inherently a defect in a scroll-driven experience. It makes reliable shortcuts important. The role label is also cramped against the right-side rail at this width.

Fix: retain compact Work and Contact access, or an explicit Menu with Work/About/Contact/All Projects; add the direct selected-work action. Preserve Explore and the complete narrative as available experiences.

### 4. Core content is coupled to successful graphics startup

Source-proven failure path: `mountLanding()` refuses to mount without `window.THREE`; the entry module obtains Three and its addons from an external CDN. The HTML root starts empty. The no-script markup supplies styles and hides the loader but provides no portfolio content. Removing the loader after its watchdog cannot create content that never mounted. Renderer creation also lacks a local recovery boundary.

- [Mount gate](app/landing/app.jsx#L257)
- [Empty root and module graph](index.html#L178)
- [Renderer creation](app/landing/scenes/universe.jsx#L341)

Fix: make identity, project links and contact available independently of the graphics layer. Enhance this usable base with the existing universe, and recover cleanly when the graphics dependency or renderer fails. Bundle or self-host pinned critical dependencies to reduce third-party startup dependency chains.

This is a confirmed architectural dependency, not a measured claim about how frequently the CDN or WebGL fails for visitors.

## Should resolve

### Promised artifacts and completion labels

Kerfur's CASE PDF points to `#`; PointAccel's live configurator and usage/presets links also point to `#`. Its repository-labeled link goes to a GitHub profile. All Projects calculates “live” from route existence, giving 13 live / 0 pending despite the unfinished case studies.

Fix real destinations or use noninteractive availability text. Distinguish route availability from editorial completion. Sources: [artifact links](app/projects/data.jsx#L222), [PointAccel links](app/projects/data.jsx#L266), [index status](app/projects/index/app.jsx#L115).

### Keyboard and accessible media

Source review found that All Projects' global Enter handler could open the last active row even if actual focus had moved to a header link or filter button. The shortcut guard is now patched and the filter/focused-row paths were checked in-browser. Its clickable list items still lack native link behavior; that separate semantic improvement remains open. [Index shortcuts](app/projects/index/app.jsx#L75), [rows](app/projects/index/app.jsx#L259).

Case-study photo conversion is pointer/touch-only on an unnamed, non-focusable canvas. Keep native images with meaningful alternatives beneath the effect, add a keyboard-accessible original/ASCII control, and provide a media fallback for WebGL failure. [Media markup](app/projects/components/ascii-photo.jsx#L285).

### Motion preferences and explicit pause

Source-proven: the video intersection callback starts playback without checking reduced motion or whether the visitor explicitly paused. The idle camera attention movement also lacks the reduced-motion guard used by ordinary drift.

Fix: remember explicit pause, respect reduced motion, and retain the complete animation in normal mode. [Video observer](app/projects/components/ascii-photo.jsx#L178), [idle camera movement](app/landing/scenes/universe.jsx#L2602).

## Quality-preserving performance work

No trustworthy real-device frame-rate or release-network benchmark was completed in this review. An independent browser probe used a software renderer, so its startup timings are excluded from performance conclusions. Do not use this review to claim a Lighthouse score, mobile FPS, or a quantified improvement.

Prioritize these mechanisms before reducing visual fidelity:

1. **Decouple readable content from graphics startup.** This improves perceived progress and resilience while preserving the full rendering quality once ready.
2. **Avoid uploading duplicate video frames — patched.** `AsciiPhoto._loop()` previously bound the video texture at every display refresh while playing. The follow-up separates decoded-frame notifications from display-rate lens animation, with cleanup and a legacy fallback. See the regression and browser measurements above. Profile the real-device benefit on video-heavy case studies. [Engine](app/projects/components/ascii-photo.js).
3. **Suspend genuinely idle or off-screen figure loops.** The current idle path skips drawing but still schedules callbacks and calculates state. Some converted figures can animate until they leave the broader disposal band. Keep the 1400px context-recycling observer and remount generation: they prevent browser context exhaustion.
4. **Use unclamped timing for the DoF measurement.** The animation loop clamps elapsed time to 50ms, then passes that value to `probeDoF()`. This makes the reported FPS floor at 20 and the `dt < 200` exclusion ineffective. Keep clamped time for motion integration; use appropriate raw active-frame timing for measurement. Preserve the 30-FPS quality threshold and shader/depth-prepass design. [Delta clamp](app/landing/scenes/universe.jsx#L2558), [probe call](app/landing/scenes/universe.jsx#L3368), [probe](app/landing/scenes/universe.jsx#L684). At very low FPS, a 120-frame warm-up/sample sequence also takes a long time; assess recovery latency on real weak hardware before changing the policy.

Benchmark a cold landing, direct project load, project-to-landing handoff and a long Wafer scroll on a normal integrated-GPU laptop, a midrange Android phone and iOS Safari. Record time to usable identity/navigation, frame-time distribution, input response and context loss. Compare before/after under identical conditions. This is the remaining validation work, not a claim that these devices were tested here.

## What to preserve

- A coherent visual language grounded in the actual hardware/firmware work.
- The four written featured case studies and their authorship boundaries.
- The universe, model handoffs, ASCII media interaction, sound and board narrative.
- Native DOM text and shared typography tokens, including rem-based scaling.
- Adaptive depth of field, current optimized bokeh prepass, visibility gating and context recycling.
- All public URLs and the reciprocal project ring.

Runtime freshness check passed: landing runtime, 24 page bundles and 16 generated HTML routes. Registry/data filenames align, all 13 project routes exist, and the ring is reciprocal in both directions.

## Lower-priority finish details

- Venovisor's HTML description still describes a wearable interface rather than the vein-finder firmware work. Correct the generating source as well as generated output.
- Public pages use a blank favicon and lack social sharing metadata.
- The Munich status clock uses the visitor's local time plus a fixed GMT+1 label. Use Europe/Berlin time or remove the unsupported precision.
- Reconcile “Same 12 nodes” in the index with 13 records and the deliberate Silent Depth field opt-out.

## Recommended order and acceptance checks

1. Revise the opening identity and bridge sentence using the clarified origin/particle metaphor. Keep the scene. In a five-second test with unfamiliar creative developers, check whether they identify whose portfolio it is, the work's scope, and how to open a project. After the assembly beat, separately ask what the particles and 0x00 represent. Do not coach them first.
2. Repair section-link destinations and keyboard interception; add mobile shortcuts. Verify each requested destination and back/forward behavior from every page composition.
3. Finish the reachable project records, remove misleading fallback photos and dead artifact promises. No `[writing pending]`, `TBD` or unrelated evidence should remain in the submission path.
4. Add usable startup/media fallbacks, then measure the targeted performance changes on real hardware.
5. Complete the final browser/device and sharing pass before submission.

## Screenshots captured

Screenshots are stored under `studies/` because repository deployment excludes it. A new root screenshot folder would otherwise ship these review assets publicly. Fixed/sticky scenes were inspected as viewport states; a single full-page image would not represent the scroll-controlled narrative accurately.

| File | Captured state |
|---|---|
| `studies/awwwards-audit-2026-09-24/screenshots/landing-desktop-1280.png` | Desktop title, 1280 × 720 CSS viewport |
| `studies/awwwards-audit-2026-09-24/screenshots/landing-tablet-768.png` | Tablet title, 768 × 1024 CSS viewport |
| `studies/awwwards-audit-2026-09-24/screenshots/landing-mobile-375.png` | Mobile title, 375 × 812 CSS viewport |
| `studies/awwwards-audit-2026-09-24/screenshots/work-desktop.png` | Selected Wafer stop; initial browser capture had scaling artifacts, so do not infer typography sharpness from this image |
| `studies/awwwards-audit-2026-09-24/screenshots/contact-desktop-1280.png` | Contact ending, 1280 × 800 CSS viewport |

The responsive captures are browser viewport checks, not physical-device or touch-gesture certification. Safari, full keyboard traversal, slow-network tests and screen-reader operation remain outside the completed validation.
