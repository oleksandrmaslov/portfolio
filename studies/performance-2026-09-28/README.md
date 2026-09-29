# Portfolio performance and functional investigation — 28 September 2026

Local branch: `codex/performance-functional-audit`, based on clean `main` at
`d4d5632`. Nothing pushed or deployed. Read `AGENTS.md` before editing and fetched
both reference branches: design evidence `9d9c458` and sound studies `4c4df2b`.
The earlier hover transforms, video-frame uploads, sampled score, voice reuse,
menu object scene and shared headers were retained.

## Findings and fixes

| Finding | Reproduction / evidence before | Fix and measured result | Remaining risk |
| --- | --- | --- | --- |
| Hidden wordmark keeps rebuilding DOM beneath navigation | Settled desktop menu: **91 glyph mutations, 92 layouts in 3s**; mobile: **46 layouts in 1.5s** | Sleep after the existing curtain finishes; wake on close. Both samples now **0 mutations / 0 layouts**. Desktop script time 203.9 → 25.5ms over 3s; layout time 143.8 → 0ms. | Visible wordmark animation remains active and still performs layout; this is intentionally not a whole-page idle or FPS claim. |
| Hidden sound waveform still updates its SVG | With the wordmark fix alone, sound-on navigation still caused **301 layouts in 10s**. Original main recorded 302. | Gate only the visual indicator on coverage/visibility, retaining playback. Final **0 layouts** over 10s and again after a minute. | The sound graph continues intentionally while the menu is open. This does not claim lower DSP cost. |
| Video ignores explicit Pause and reduced motion | Iskra first clip: Pause → scroll to top → return restarted playback. Reduced-motion load also autoplayed. Both browser verdicts false. | Keep user intent in a ref outside recycled GPU state; use actual viewport bounds for playback, with separate preload bounds. Both verdicts now true. Hidden pages and covered menus pause media; a real Play still works under reduced motion. | Browser emulation is not physical-device or Safari certification. Very tall clips still use the existing 35% figure threshold for autoplay. |
| Idle/off-screen ASCII figures retain display callbacks | Paused-revisit scenario still ran **362 engine RAF callbacks in 3s**. Engine tests also reproduced idle polling and off-screen converted rendering. | Wake on invalidation/video frames/input; sleep on idle, hidden or off-screen state. Same revisit now **0 engine callbacks**. Total script time in that sample 97.1 → 8.5ms. | This combined result includes correcting unwanted playback. The independent engine regression isolates idle scheduling. Visible ASCII shimmer and lens animation retain their display cadence. |
| ASCII conversion is unavailable to the keyboard | Canvas interaction had no tab stop, name or keyboard handler. | Name the existing interaction, expose its pressed state, add Enter/Space and visible focus. Browser checks verify conversion and restoration. | Caption-based names are not a full screen-reader/media-alternative audit. |
| Reduced motion still permits an unsolicited idle camera turn | At 390×844, yaw/pitch changed from **0°/0° to 110°/−10°** over the idle interval despite reduced motion. | Apply the same motion guard as drift to the 30s attention beat. After: **0°/0° throughout**. | Scroll-driven narrative remains user-driven; this is not removal of all animation. |
| DoF diagnostic clamps slow frames | Feed the real Universe frame callback 75ms active intervals: diagnostic reports **20 FPS** rather than 13.33. | Pass raw elapsed time to the probe, retaining clamped physics. Diagnostic now **13.3 FPS**. The 30 FPS gate, warmup/sample counts, 13-tap shader and depth prepass are unchanged. | Controlled clock input verifies the diagnostic, not a hardware FPS improvement. Existing exclusion of ≥200ms interruptions remains. |
| Graphics failure leaves no usable landing | Abort Three.js, or refuse WebGL context creation; after loader removal there were **0 visible links**. | Native overview through the existing loader failure path, plus no-script support and late-first-frame recovery. Both failure scenarios now expose **7 links**, including direct contact and CV. | External React/Three dependencies and shader warmup remain. Project-page graphics/media fallbacks are not made independent of those dependencies by this landing-only recovery. |

The wordmark and waveform stop only once the menu surface covers the page, so
its reveal remains intact. No model, texture, sound bank, score, palette, type
ramp, public route or project registry was changed. The 1400px recycling observer
and canvas-generation remount remain in place. The only new normal-state visual
is a keyboard focus outline on the existing ASCII control.

## Measurement conditions and limits

Real headed Chrome 154 on Linux, Intel Iris Xe through ANGLE/Mesa; 20 logical
cores reported. Desktop 1280×800, mobile-size 390×844. A separate touch-emulated
pass uses DPR 2 and reduced motion. Browser frame timestamps, CDP Performance
metrics, weak references to WebGL contexts, engine callback counts, post-GC JS
heap, and Chromium WebAudio realtime diagnostics are saved in the JSON files.
Instrumentation is test-only. Screenshots and harnesses live under `studies/`,
which deployment excludes.

The normal field remains expensive and sample timing varies with the live scene,
GPU/driver caches and host load. These are short diagnostic windows, not a
controlled device benchmark. Raw mean/p95 frame intervals:

| State | Before (ms) | After (ms) |
| --- | ---: | ---: |
| Landing idle, 3s | 27.75 / 41.70 | 15.28 / 25.10 |
| Pointer at Wafer, 3s | 26.35 / 41.70 | 12.03 / 16.80 |
| Settled menu, 3s | 8.33 / 8.40 | 8.33 / 8.40 |
| After ten menu cycles, 3s | 26.91 / 50.00 | 15.79 / 25.10 |
| Mobile-size reduced-motion field, 3s | 11.04 / 24.90 | 12.22 / 16.80 |

**Do not attribute the broad field frame-time difference to these patches.**
The targeted, repeatable effects are the removed hidden layouts/callbacks and
corrected behavior. The visible hover HUD was already transform-only; its two
existing regressions still pass. Its geometry, glow and shader quality were not
retuned.

Two full Wafer gallery traversals produced 24 then 45 created contexts and 22
then 43 intentional losses, returning to **two live contexts** each time, both
before and after. Post-GC JS heap was **24.28 → 24.31MB** before and
**24.61 → 24.71MB** after. No context-limit warnings or uncaught page exceptions
appeared in these runs. This supports bounded recycling over these traversals;
it does not measure GPU memory or prove the absence of every long-term leak.

The final one-minute audio run retained **13 allocated voice pairs**, with no
dropped notes or late scheduler recovery. Mute ended with **zero voices, no
scheduler and a suspended AudioContext**. The decoded bank stays at 16,243,200
bytes, intentionally cached for restart. Chromium's raw `renderCapacity` was
0.082/0.159 at approximately 10/60 seconds before and 0.058/0.125 in the final
run; callback interval means stayed near 10.67ms. These noisy snapshots are not
whole-process CPU percentages or evidence of a DSP optimization. A suspended
context's last realtime diagnostic is stale; state and stopped scheduling are
the meaningful mute checks. The score and instrument file were not changed.

Initial usable-landing events were 9.21s in the baseline and 3.96s in the later
full pass; a separate instrumented startup reached 9.71s. These runs are not
network/driver-cache controlled. The startup trace recorded all milestones by
5.81s, with multi-second gaps between animation callbacks during graphics
startup. **No cold-load speedup is claimed.** Normal startup still depends on
CDN delivery, environment generation and model/shader warmup. The concrete
startup improvement here is recovery rather than a blank, unusable page.

## Validation

- `node --test tools/landing-runtime/*.test.cjs studies/performance-2026-09-28/score.test.cjs`: **37 passed**. The 14 score tests are copied from the sound-study branch and pointed at the unchanged shipping score.
- New wordmark, sound-indicator, idle media, explicit-pause and reduced-motion regressions were observed failing before their fixes.
- Existing 24-video-frame/60-display-tick, paused seeking, legacy frame fallback, audio cancellation, voice pooling and hover geometry tests still pass.
- `npm run check --prefix tools/landing-runtime`: current landing runtime, **24 page bundles and 16 public HTML pages**. Linux `npm` is the equivalent of the documented Windows `npm.cmd` command.
- Registry check: all **13 project routes**, matching registry/data filenames and models; reciprocal ring traversed both directions; Silent Depth remains the sole field opt-out.
- Browser route, keyboard, mobile, repeated navigation and demo results are recorded in `navigation-qa.json` and `hover-demos.json`. (The first navigation run stopped at its hidden-tab step; see the follow-up below.)

No Safari, physical Android/iPhone, screen-reader, hour-scale soak or release-network
certification is implied. Existing unfinished editorial records, dead artifact
links and broader media alternatives from the earlier audit remain outside this
performance/lifecycle patch set. Existing PMREM sigma warnings remain unchanged.

## Evidence and reproduction

- `before.json`: original-main baseline; `after.json`: full comparison after the first four fixes. Its audio samples exposed the still-hidden waveform.
- `after-audio.json`: final focused sound/indicator comparison after that additional fix.
- `before-edge.json` / `after-edge.json`: controlled DoF clock, 35s reduced-motion session, CDN and WebGL failures.
- `startup-trace.json`: additional loader-milestone diagnostic; no timing improvement claim.
- `output/playwright/`: desktop/mobile menu pairs, plus final interaction and fallback captures.

Serve the repository root on port 8000. The scripts accept an installed
Playwright package through `PLAYWRIGHT_MODULE`; they use plain Playwright, not
`@playwright/test`. On this machine the package is already available at:

```sh
export PLAYWRIGHT_MODULE=/home/oleksandr/.npm/_npx/31e32ef8478fbf80/node_modules/playwright
python3 -m http.server 8000
```

In another shell:

```sh
node studies/performance-2026-09-28/browser-audit.cjs after
node studies/performance-2026-09-28/browser-audit.cjs after-audio --audio-only
node studies/performance-2026-09-28/edge-cases.cjs after
node studies/performance-2026-09-28/navigation-qa.cjs
node studies/performance-2026-09-28/hover-demos.cjs
```

Run performance scenarios sequentially without other profiling sessions. To
reproduce the old behavior, serve `d4d5632` from a separate checkout and run a
copy of these harnesses against it. The historical raw files should be copied
aside before rerunning, since each label overwrites its JSON output.

## Follow-up — 29 September 2026

Continued on the same branch against the Codex state at `5eb1a3e`, served from a
separate worktree on port 8001 for the before side.

### The navigation QA had not finished

The last `navigation-qa.cjs` run stopped at its hidden-tab audio step
(`failure` in the old JSON, line 67): `document.hidden` stayed `false`, so the
touch, reduced-motion and no-JavaScript checks after it never ran. That is a
harness problem, not a product one. Playwright keeps every page it attaches
to visible: bringing another page to the front, minimising the window and
disabling focus emulation all left `document.hidden` false here, headed or
headless. A plain Chrome driven over a bare DevTools socket does hide a tab
when another tab takes the foreground.

- `hidden-audio.cjs` now does that step over raw CDP with trusted clicks:
  eight rapid mute/enable toggles, another tab in front → `hidden: true`,
  `running: false`, context `suspended`, no scheduler; back in front → still
  off until an explicit press; press → running again. Pass (`hidden-audio.json`).
- `navigation-qa.cjs` no longer contains that step. The full run now passes:
  15 routes, four menu destinations, Escape cancel, three index → Wafer →
  Universe → Back cycles, ASCII Enter/Space and pause after recycling, the
  390 px DPR 2 touch menu with reduced-motion manual playback, and the
  no-JavaScript overview. No page errors.

### New findings

| Finding | Before | Fix and result |
| --- | --- | --- |
| Back from the landing restores a project page with its hero stuck in the exit | Wafer/Iskra → `← UNIVERSE` → browser Back (bfcache): `__hv_exitSpin` still `true`, mark centred in the handoff pose over the headline and stat row, spinning at **~1.9 rad/s**, and the render loop never sleeps (**120 callbacks / 2 s** scrolled deep in Iskra's case file). `core.jsx` cleared `__hv_leaving` on restore but not the exit spin, and neither hero lifecycle listened for `mo:page-restored`. | `core.jsx` clears `__hv_exitSpin` with the other one-way flags; the shared lifecycle and Wafer settle the rig to rest on `mo:page-restored`. After: exit spin `false`, yaw at rest (**0 rad/s**), **0** callbacks scrolled deep. `before/after-*-back-restore.png`, `back-restore-{before,after}.json`. |
| Wafer's hero loop never sleeps | Wafer keeps its own lifecycle, and its loop re-armed every frame whatever the scroll position: **120 callbacks / 2 s** deep in the longest case file on the site, where Iskra's shared lifecycle owns none. | Same sleep contract as `project-page-lifecycle.jsx`: wake on scroll, resize, visibility, `pageshow`, `mo:menu` and `mo:project-rig-wake` (which Wafer's leave now dispatches, so the exit turn still runs from any depth). After: **0**. Render condition unchanged; the exit turn rendered 2–4 frames before navigation in both builds (headless, software GL). |
| The fallback's project links were a second, unchecked route list | `#mo-fallback` hard-coded five filenames, outside the two registries that CLAUDE.md calls the whole migration surface. A rename or featured-list change would have left dead links in the one page meant for when everything else fails. | `build.cjs` generates them from `MO_FEATURED_ADDRS` (plus All Projects) and fails if a target is not a root page. Output is byte-identical to the hand-written list; `npm run check` flags a drift. CLAUDE.md updated. |
| ASCII figure start ignored the settled menu | `start()` set visibility from viewport and tab only, while `syncPlayback()` also checked `mo-menu-settled`. | One `active()` check for both. |

New regression tests in `tools/landing-runtime/hero-restore.test.cjs` cover the
shared lifecycle and Wafer: no callback while the stage is scrolled away, the
exit turn wakes from any depth, and a bfcache restore returns the rig to rest
and sleeps. Both fail against `5eb1a3e` for the right reason and pass now.

### Measured but not changed: startup long frames

`startup-loaf.cjs` records long-animation-frame attribution for a cold landing
load (`startup-loaf-final.json`, headed Chrome, GPU). In that run every loader
milestone landed by 4.96 s and the loader finished at 5.94 s. The long frames:

| Start (ms) | Frame (ms) | Main work |
| ---: | ---: | --- |
| 1097 | 1050 | React mount 460 + first Universe frame 505 |
| 2994 | 1921 | Universe frame 885 + handoff warm-up `paint` 913 |
| 2448 / 2731 / 5008 | 281 / 216 / 284 | Universe frames |

The Codex trace in `startup-trace.json` shows what the long frames cost the
loader: its easing advances only on animation frames, clamped to 100 ms each,
so a 2.3 s gap after the last milestone kept the horizon up until the 9 s
bailout. Moving shader compilation to `renderer.compileAsync` (three r160 has
it; `about-board.jsx` already uses it) and letting the loader finish on wall
time once every milestone is in are the two candidates. Neither was attempted:
both change the startup pipeline and need a device matrix, not one machine.

### Validation after the follow-up

- `node --test tools/landing-runtime/*.test.cjs studies/performance-2026-09-28/score.test.cjs`: **39 passed**.
- `npm run check --prefix tools/landing-runtime`: current; 24 page bundles, 16 root pages.
- Headed Chrome: `navigation-qa.cjs`, `hover-demos.cjs` (four Play Demo routes open and close), `edge-cases.cjs final` (DoF 13.3 FPS report, reduced-motion idle unchanged, 7 fallback links on both CDN and WebGL failure), `late-recovery.cjs`, `hidden-audio.cjs` and `back-restore.cjs` all pass.

```sh
node studies/performance-2026-09-28/hidden-audio.cjs            # add --headed to watch it
node studies/performance-2026-09-28/back-restore.cjs after
node studies/performance-2026-09-28/back-restore.cjs before http://localhost:8001/
node studies/performance-2026-09-28/startup-loaf.cjs final
```

`navigation-qa.cjs` and `back-restore.cjs` run headless with `HEADLESS=1`.

## Startup follow-through — 29 September 2026

Reviewed the four handoff commits through `89ec8a4`, and read the differences
between `AGENTS.md` and the newer `CLAUDE.md`. Those instruction files were not
synchronized; the owner has left that decision open. The current routes,
three-mode Universe and registry-generated fallback remain intact.

### Ready loader delayed by missing animation callbacks

The old trace had every readiness milestone by 5.81s, but completion at 9.71s.
The loader advances its easing only on RAF and caps each step at 100ms. Once
the application was ready, stalled frames could still keep it waiting for the
9s bailout. Two of four new `preloader-clock.test.cjs` tests failed before the
fix: completed milestones with no subsequent frames, both normal and reduced
motion. The normal-frame choreography and missing-milestone deadline already
passed and continue to pass.

`6359036` schedules completion from the easing's remaining duration and minimum
hold once all core milestones arrive. Normal frames can still complete it;
both paths use one guarded completion function. The reveal delays, failure
deadline, arrival start and `mo:preloader-done` contract are preserved. The
loader's RAF and deadline are cancelled on completion.

In headed Chrome, the same test-only intervention stopped **only the loader's
RAF after readiness** while the application kept rendering:

| Build | Last milestone | Loader done | Wait after last milestone |
| --- | ---: | ---: | ---: |
| Previous loader (`89ec8a4`) | 4.404s | 9.946s | **5.542s** |
| Updated loader | 6.212s | 7.431s | **1.219s** |

Evidence: `startup-loaf-{before,after}-ready-starved.json`. These are controlled
scheduler checks, not cold-load benchmark claims. Without the intervention,
the two diagnostic loads completed at 5.792s and 5.939s respectively; no general
startup speedup is claimed. A blocked main thread can delay timers too. This
fix removes dependency on extra animation callbacks; it cannot preempt shader
or other synchronous work.

### Fallback wording on a slow device

The same fallback serves absent graphics, no JavaScript and a slow first frame.
Calling the universe “unavailable” asserted a failure the timeout did not
establish. It now says it “hasn’t opened yet,” with the existing project and
contact links. The loader announces “Portfolio links ready” when no frame
exists. The generated link list is unchanged. The no-JavaScript mobile capture
and delayed-Three recovery capture verify the copy in its actual layout.

This is a wording correction, with no performance claim. Late graphics can
still replace the fallback with the normal experience; that behavior is
verified by `late-recovery.cjs`.

### Shader experiment retained only as evidence

The Chrome CPU profile (`startup-cpu-profile.json`) concentrates startup time
in Three's `onFirstUse`. The pinned [Three r160 implementation](https://github.com/mrdoob/three.js/blob/r160/src/renderers/webgl/WebGLProgram.js#L856)
checks shader logs and initializes uniforms there. A browser-only experiment
used [r160 `compileAsync`](https://github.com/mrdoob/three.js/blob/r160/src/renderers/WebGLRenderer.js#L989)
for the hidden handoff before its two warm paints. It did not alter production
source, shader quality or the generated runtime.

The handoff warm paint fell from 995ms in the baseline trace to 366ms in the
experiment, but a Universe frame grew from 828ms to 1505ms and startup did not
improve (5.79s baseline; 6.11s experiment). A 1.70s long animation frame remained.
These single-machine runs do not establish causation for the shifted work or
a repeatable overall gain, so the candidate was **not adopted**. Evidence:
`startup-loaf-compile-handoff.json`; reproduce with `COMPILE_HANDOFF=1`.

GPU/compiler startup stalls, context construction and model upload remain the
main initial-load risk. A future compilation change needs tests for the full
composer, retargeting/cancellation and devices without parallel compilation;
the handoff alone does not resolve them. No rendering quality was reduced.

### Validation at the loader checkpoint

- **43/43 tests pass**; runtime check remains current at `ef8c414c10e2`, with 24 bundles and 16 public pages. The loader is its existing standalone script, so no runtime bundle regeneration was needed for this final change.
- Repeated the 390px DPR2 touch/reduced-motion/manual-video and no-JavaScript checks after the loader fix; menu objects and fallback inspected visually.
- Final startup failure, reduced-motion idle and DoF assertions: `startup-final-edge.json`. Delayed Three recovery still passes in `late-recovery.json`.
- Earlier full-route, repeated navigation, demo, memory/context and raw-CDP hidden-audio results remain in this folder. Changes after that coverage are confined to the landing loader and fallback wording.
- The hero restore fix is verified in Chromium bfcache; Safari remains untested. Wafer still has its own lifecycle, so future lifecycle changes must keep it aligned with the shared implementation. Generated fallback URLs require the existing build/check step. The shared media activity check covers the tab, viewport and menu; it is not general detection of every possible overlay.

Additional reproduction (one browser profiling run at a time):

```sh
PRELOADER_REF=89ec8a4 STOP_READY_RAF=1 node studies/performance-2026-09-28/startup-loaf.cjs before-ready-starved
STOP_READY_RAF=1 node studies/performance-2026-09-28/startup-loaf.cjs after-ready-starved
CPU_PROFILE=1 node studies/performance-2026-09-28/startup-loaf.cjs profile
COMPILE_HANDOFF=1 node studies/performance-2026-09-28/startup-loaf.cjs compile-handoff
node studies/performance-2026-09-28/edge-cases.cjs startup-final
```

`PRELOADER_REF` replaces only the response for the loader script, so the
comparison uses the same application and assets. The shader experiment checks
its generated-code match before substituting a test-only response; it is not
a second shipping implementation. All evidence remains excluded from deploy.

### Menu restoration — 29 September 2026

The menu on the landing already used four live objects; the other public routes
used still previews with CSS movement. The original menu scene's arrival,
focus, exit, poses and pointer rotation are now shared by all 16 routes. The
original motion math was checked line-for-line against its former landing
source. An enlarged rotation experiment was rejected after the owner's
screenshot: the final work hover moves about 0.09–0.10 radians across the row,
matching the old restrained range. The 657×521 capture
(`output/playwright/menu-restored-project-657x521.png`) shows the restored
composition at the owner's viewport. The existing menu text, spacing, four
destinations and public URLs are unchanged.

Project pages lend the menu their existing hero renderer; a text-only route
allocates one menu renderer on intent. The shared scene owns its materials,
reuses cached GLB geometry, draws at most 30 times per second while moving,
then sleeps. Its DOM previews stay until each corresponding model has actually
drawn. If a model or module fails, the preview and native links remain. The
Wafer texture model exposed a real late-decoder bug: a missing KTX2 constructor
was cached as permanent failure, even if the decoder appeared while a prewarm
was in flight. That cache now retries only the capability-limited failure and
preserves successful model promises. `model-decoder.test.cjs` failed against
the previous commit and passes after the fix.

One headless Chrome run on the same machine, before and after allowing the
scene to open while GLBs finish, measured a median first live scene of **4.40s
→ 0.96s** across 16 routes. This is a browser workload comparison, not a
claim about production network timing. `menu-qa-before-stream.json` and
`menu-qa.json` hold every route's value. The delayed-Wafer test
(`menu-streaming.json`) separately confirms a usable four-link menu, live 0x00
and switch, and a visible Wafer preview while its GLB request is blocked;
after the request is released, the model replaces the preview. Cold Three
imports and GPU compilation can still delay the first live frame, especially
on a software renderer. The native menu remains usable during that delay.
Compared with the previous generated bundles, the added initial script is
7.5 KB raw / 2.0 KB gzip-equivalent on the landing, 16.6 / 5.4 KB on Iskra,
and 22.3 / 7.3 KB on All Projects. The text page imports Three and GLBs on
menu intent; this measures source size, not a hosted transfer trace.

`menu-motion-before.json` records still objects on non-landing pages;
`menu-motion-restored-headless.json` records four loaded groups, the original
hover range and zero draws in the final two-second idle window on the landing,
Iskra and All Projects. The two latter routes had 2–3 isolated late draws in
the preceding window, then stopped; there was no sustained loop.
`menu-qa.json` covers all 16 desktop routes, keyboard focus/Escape,
six 390px DPR2 touch/reduced-motion cases, 657×521 scrolling, dependency
failure, and 20 repeated Iskra opens: its context count stayed 3→3 and the
borrowed hero canvas returned to the correctly sized mount. All 16 settled
desktop menus and all six mobile cases recorded zero draws. The forward tile
hover → Wafer → Universe → browser Back flow passed headless in
`forward-flight.json`, including the restored hero's resting state. Screenshots
under `output/playwright/menu-restored-*` show the live composition.
The complete `navigation-qa.cjs` also passed headless after this change:
15 non-landing routes, four destinations, three index → Wafer → Universe → Back
cycles, media keyboard/pause, touch with reduced motion, and no-JavaScript
fallback. Its destination assertion now waits for the view transition to
finish instead of assuming 1.3 seconds is enough under software rendering.

The new menu work passes **48/48 runtime tests**. The generated landing and
page runtimes are current at `e0d09997773a` (19 source units, 24 bundles,
16 deployed root pages). Safari and a physical mobile GPU remain untested;
the first menu open on slower hardware may show previews longer than in these
captures. The earlier measured Universe startup long frame remains a separate
open performance risk.
