# Play the field — four generative sound directions

Local experiments created on 25 September 2026. Open `index.html` through the
repository preview server for the playable sound field. `universe.html` uses the
actual landing scene, its current generated runtime, and the new audio adapter.
The public landing and its default sound have not been changed by this experiment.

The original three listening studies, recordings, source files, controls and
verification files remain intact in `../variants/`. `preserved-studies.json`
contains SHA-256 fingerprints made before this work. They can be checked without
rerendering anything. This directory, including the generated universe preview,
is under `studies/` and is excluded from deployment.

## The directions

| Direction | Musical behavior |
| --- | --- |
| A · Electric workshop | 80 BPM. Electric-key voicings, rounded bass and recorded vibraphone. Movement lets the wooden rhythm and offbeat chords enter; remembered projects become answering notes. |
| B · Clear signal | 100 BPM. Marimba patterns, small electronic accents and syncopated bass. Project memory changes the counterline; an opening suppresses the following ornament so its response has room. |
| C · Quiet presence | 60 BPM. Recorded piano, broken voicings and a quiet harmonic sustain. Phrasing changes with the remembered route. Reading retains the harmonic foundation with fewer events. |
| D · Common origin | 72 BPM. A shared D center, softened recorded vibraphone and slow swells made from that same instrument. Four voicings change the light around the center. Spread phrases answer across the field and narrow as 0x00 assembles. No percussion part. |

Common origin is deliberately closer to the visual metaphor: each node belongs
to a shared center, rather than arriving from an unrelated sound library. Its
swells are edited recorded tones, not a continuous noise bed. The intent remains
warm and inhabited; its musical palette avoids a horror drone or trailer impacts.

## What actually generates

No full recording plays behind the interactive scene. The score schedules
individual sampled notes at runtime. Recorded and synthesized instrument timbres
come from the approved studies, with new prism and swell edits for Common origin.

Each sounded pitch contributes to a decaying pitch-class memory. At harmonic
boundaries, this memory and the visitor's last four projects bias a set of
authored chord transitions. Project identity selects a stable melodic degree,
resolved against the current chord. A later phrase can recall that project in the
new harmony. The same input and seed reproduce the same score, making this
behavior testable; changed visitor paths alter later phrases and chords.

- **Move:** energy changes the probability and articulation of upcoming parts;
  individual pointer/wheel events do not spawn audio nodes.
- **Focus:** the project enters memory and gets a short, quantized response.
  Repeated hover changes coalesce and have a cooldown.
- **Select/open:** a short response uses the current voicing, adds the project to
  visited history and reserves space in the following phrase. Rapid clicks also
  coalesce; there is a two-beat minimum interval between open responses.
- **Read:** the foundation continues while rhythmic and melodic demand reduces.
- **Gather:** remembered project fragments begin the phrase; the final notes
  recover the authored identity. Stereo placement converges as assembly rises.
  The reveal is latched and has a cooldown, so scrolling around a threshold
  cannot keep restarting it.

The field's project buttons develop the musical phrase without navigating away.
Use **Try in the portfolio** for real scene rotation, flight, project hover,
navigation, origin assembly and work-reel events. The small preview panel can be
collapsed. The existing sound toggle controls the same engine. Project-page
navigation leaves the audition document; this experiment does not install audio
on the case-study routes.

## Audio and performance boundaries

`engine.js` uses one AudioContext, a 35 ms scheduler and 120 ms lookahead. Sources
are scheduled against the audio clock, not a rendering-frame clock. Each palette
is a compact sample atlas, decoded only after an explicit start. A direction
change releases the previous decoded atlas; there is no permanent four-bank
decoded cache. No live convolution, noise synthesis, scroll whoosh, or ScriptProcessor
is used. Instrument filtering and short room tails were rendered offline.

The current limits are 24 voices, with three transient nodes per voice. Sources
stop before their atlas segment ends, have explicit release envelopes and
disconnect on completion. A shared compressor is a guard, not an automatic
loudness escalator. Muting fades the master and suspends the context; hiding or
leaving the document cancels pending playback and immediately stops/suspends it.
Returning does not autoplay. Palette loads use cancellation and generation guards.

| Palette | Download | Decoded instrument audio |
| --- | ---: | ---: |
| Workshop | 1.18 MB | 18.9 MB |
| Signal | 1.02 MB | 16.2 MB |
| Presence | 0.92 MB | 14.7 MB |
| Common origin | 1.25 MB | 19.9 MB |

These are asset sizes, not whole-page memory or CPU benchmarks. The 3D scene is
unchanged. A local run of Common origin inside it reached 18 concurrent voices,
with no dropped notes or scheduler catch-up events in that observation; that is
not a guarantee about other devices. `soundField.snapshot()` exposes voice count,
decoded bytes, dropped notes, scheduling statistics and musical state for review.

The timing and buffer design follow the platform's
[sample-source behavior](https://developer.mozilla.org/en-US/docs/Web/API/AudioBufferSourceNode),
[audio-clock scheduling guidance](https://web.dev/articles/audio-scheduling), and
[context suspension API](https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/suspend).

## Listening and verification

The `audio/*-guided.mp3` files are 48-second offline renders of repeatable input
traces from the same score and sample atlases. They are listening aids and are
never loaded by the live engine. Timeline: exploration begins after 3 seconds;
projects enter at roughly 7, 12, 17 and 22 seconds; open at 16; gathering at 27;
reading at 37. Their default playback gain corresponds to the live volume at 55%.
The offline render mirrors the voice envelopes/pan rules and does not run the
browser compressor. These traces stay below its threshold.

| Trace | Integrated loudness | True peak | Peak simultaneous voices |
| --- | ---: | ---: | ---: |
| Workshop | −31.87 LUFS | −16.81 dBTP | 24 |
| Signal | −32.20 LUFS | −15.81 dBTP | 21 |
| Presence | −31.86 LUFS | −11.12 dBTP | 14 |
| Common origin | −32.28 LUFS | −17.17 dBTP | 16 |

No voices were dropped in those traces. The signals are finite and do not clip.
Measurements describe signal integrity; they do not substitute for listening.

Run the score and lifecycle checks from the repository root:

```sh
node --test studies/awwwards-audit-2026-09-24/sound/interactive/verification/*.test.cjs
```

They cover all four routes changing the later score, deterministic replay,
rapid-input bounds, invalid node addresses, continuous foundations at rest,
reading density and assembly rearming. Four lifecycle checks cover interruption
during loading, cancellation during download/decode, and rapid palette switching.
All 18 checks pass. Browser checks additionally cover actual
sample decoding, controls, project memory, origin, palette changes, the real
universe adapter, fragment navigation and a 390 px layout. Review caught a false
playing state after an audio interruption during loading and a mobile hint/node
overlap; both are fixed. The hint now has a separate footer outside the node field.

## Rebuilds and sources

With NumPy, SciPy and FFmpeg available:

```sh
python build_instruments.py
python build_preview.py
node verification/make_sessions.cjs
python render_guided.py
```

`build_instruments.py universe` rebuilds just the fourth instrument bank.
The builder reads the original study's instrument functions without executing its
mix-rendering entry point. It checks the preserved fingerprints afterward.
`build_preview.py` must be rerun if the canonical landing HTML changes; it reuses
the same runtime and assets and replaces only its audio scripts in the private
copy. `preview-source.json` records the source HTML fingerprint.

Instrument recordings retain the CC0 provenance in `../variants/sources.json`
and `../variants/sources/LICENSE`. No game soundtrack or proprietary sound asset
has been used. Original research: `../../SOUND_RESEARCH.md`.
