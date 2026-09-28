# Clear signal

The main landing selects Clear signal from the private interactive sound study.
`generative-score.js` is the unchanged score; `sample-engine.js` is its optimized
player; `sound-controller.js` adapts existing `MOSound` and `mo:*` events.

`instruments.json` contains only the selected bank. Its sample offsets, gain,
durations and pitches are unchanged from the approved study. The public
`public/audio/clear-signal.mp3` is an exact copy of that bank, with provenance
and the sample-library license alongside it. The original mixes and all four
private interactive directions remain under `studies/`, excluded from deploy.
The main landing does not depend on anything under `studies/`.

The score remembers project visits and prior notes, uses those to influence
later phrases, responds to movement and assembly, and keeps a quiet foundation
while reading. No recording of a complete mix plays behind the page.

## Runtime boundaries

- Audio starts only after the visitor enables it. The 1,016,685-byte bank and
  AudioContext are created on demand; the decoded stereo bank uses 16,243,200
  bytes. Mute retains that bank for a fast restart, but suspends the context.
- One scheduler runs every 35 ms with 120 ms of lookahead on the audio clock.
  Pointer sampling is throttled; events change score state rather than creating
  immediate voices. Pointer/wheel listeners and assembly polling detach on stop.
- At most 24 voices can play. Gain/panner pairs are reused; each note still gets
  the one-shot AudioBufferSource required by Web Audio. Finished sources and
  inactive panners disconnect. Sample lookup is cached by instrument and pitch.
- Meter values are sampled at about 8 Hz without publishing React control state.
  The header wave draws at most about 30 Hz, stops when flat, and skips hidden
  documents. Status changes remain event-driven.
- Mute fades before suspending. Hidden documents and page exits stop immediately;
  returning does not autoplay. Epoch guards prevent cancelled downloads or
  decodes from restarting sound. A context interruption requires another start.
- The legacy carrier and score scripts remain archived source files, but are
  not loaded by `index.html`. The compatibility `MOSound.ctx` is null so the old
  scroll-wind layer cannot attach to this score.

## Verification

Run `node --test tools/landing-runtime/audio-engine.test.cjs` from the root.
The harness exercises cancellation during download/decode, context interruption,
bank switching, reusable voice bounds, stale completion and meter notifications.
The musical behavior tests remain in
`studies/awwwards-audit-2026-09-24/sound/interactive/verification/score.test.cjs`.

The source study and atlas build instructions are in the private study's README.
Rebuilding the bank would change the approved sound; it is not required to build
the landing runtime.
