# Clear signal, hover tracking and navigation — 25–26 September 2026

Scope: the main local landing. The owner selected Clear signal, requested sound
and card-hover optimization without reducing quality, and confirmed a full-screen
menu. The incumbent universe, ASCII mark and shared type/color tokens remain.
This pass does not certify the complete portfolio for submission.

## Implemented

- Promoted the selected generative score to the main landing with one lazy sample
  bank, a bounded pool of reusable envelope/panner pairs, cached sample lookup,
  quiet meter polling and input listeners active only while sound runs.
- Replaced per-frame SVG geometry and label left/top writes in the hover frame
  with transforms on fixed-size segments. Cached the fixed universe mount's
  bounds and invalidated ASCII wordmark bounds on geometry changes. Kept the
  projected outline, brackets, glow, models, resolution and DoF configuration.
- Replaced the compact menu with a full-screen native dialog on every viewport:
  Selected work, About me, Contact, All projects. It pauses the universe, contains
  focus, restores prior pause/scroll behavior, and keeps the index handoff.
- Changed Selected nodes to Selected work, reel labels to PROJECT, the title
  hint to Explore my projects / Click a project, and hover LOCK to Open project.
  Retained ASCII M.O. beside the existing readable author and portfolio label.

## Hover evidence

Sound was off during 1280 × 720 desktop samples of roughly three seconds each.
The camera's automatic exploration was held for the comparison. The original
overlay, a temporary frozen overlay and the final implementation were measured
through the browser's frame timestamps and Performance metrics.

| State | Layout count | Mean frame time | p95 frame time |
| --- | ---: | ---: | ---: |
| Original hover | 146 | 39.06 ms | 66.10 ms |
| Original hover, frame frozen | 72 | 27.92 ms | 50.30 ms |
| Original hover, glow removed | 160 | 34.69 ms | 50.20 ms |
| Original restored | 163 | 32.91 ms | 50.30 ms |
| Final hover | 69 | 30.45 ms | 50.90 ms |
| Final idle | 77 | 27.31 ms | 50.10 ms |

The frozen-frame comparison identified the overlay as a contributor. Removing
the glow did not remove the layout churn. In the final sample, hovering no
longer added a layout per frame. The two HUD regression tests fail against the
saved original and pass against the new component: updates write only transforms
and the outline still connects all four corners with constant stroke thickness.

These are diagnostic samples, not a reliable whole-site FPS uplift. Adaptive
DoF decisions varied across reloads, other preview tabs were open, and browser
extensions appeared in profiling. Layout duration and total task time do not
show a consistent reduction. Physical-device performance remains unmeasured.
Raw data and source snapshots are in this directory.

## Sound evidence

The production score and selected instrument bank are byte-identical to their
private interactive originals. Instrument metadata is identical except for the
public asset path. All 84 files in the original three-mix preservation manifest
retain their hashes. The fourth private direction also remains available.

The 180-note allocation test creates one gain/panner pair and reuses it; the old
source created a pair per note. AudioBufferSource remains one-shot. A real browser
run scheduled 89 notes with a 13-voice high-water mark, no dropped notes and no
late scheduler recovery in that sample. These counters are not an audible-quality
or real-device CPU benchmark. The instruments and score were not recomposed.

Before enabling sound, the context was uncreated and neither manifest nor bank
had been requested. Mute reached a suspended context, zero voices and no scheduler
while retaining the decoded bank. Rapid restart reused it. Unit tests cover
interruption and cancelled asynchronous work as well as voice reuse.

## Completed checks

- 23 score/audio/HUD tests passed. Mechanical design detector: no findings.
- Native menu Escape returns focus to MENU; all four destinations close it.
  Selected work, About, Contact and the All Projects route were exercised.
- Desktop 1280 × 720 and phone 390 × 844 screenshots are saved here. The phone
  dialog has no horizontal overflow. These are viewport checks, not physical
  touch-device or Safari certification.
- Independent finish review: **disposition: ship**, no material fixes within
  the supplied screenshots and changed files. It did not independently listen
  to audio or run browser performance measurements.

Commands:

```sh
node --test tools/landing-runtime/audio-engine.test.cjs tools/landing-runtime/hover-hud.test.cjs studies/awwwards-audit-2026-09-24/sound/interactive/verification/score.test.cjs
npm run check --prefix tools/landing-runtime
git diff --check
```

An unfamiliar-visitor five-second comprehension test and the broader unfinished
case-study/startup-resilience findings in `DESIGN_REVIEW.md` remain open.

## Independent finish verdict

**disposition: ship**

Inputs absent by scoped agreement: PRODUCT/DESIGN documents, approved comp and
quality board. The reviewer used the existing visual system and confirmed user
preferences, and did not perform audio listening or live interaction.

| Element | Result | Evidence |
| --- | --- | --- |
| TYPE | match | Geist hierarchy and existing tokens |
| MATERIAL | match | Flat void, bone lettering and teal accents |
| Full-screen topology | match | Four rows, brand/close above, identity below |
| Phone reflow | adaptation | Descriptions beneath labels retain readability |
| Navigation | match | Plain labels, native anchors, named dialog and focus rules |
| Universe continuity | match | Prior pause and overflow restored on close |
| Hover tracking | match | Fixed segments updated through transforms |
| Sound lifecycle | match | Lazy bank, cancellation epochs and bounded voice reuse |

Persistence: pass for this extension. Ceiling: reached for the navigation scope.
Material fixes: none identified. Keep the plain destinations, native dialog,
existing type and palette, return behavior and Clear signal bank.

Final generated-runtime freshness and `git diff --check` passed on 26 September.
