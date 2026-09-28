# Three sound studies for M.O.

48-second listening sketches, made on 25 September 2026. Open `index.html`
through the repository's local server. Nothing here is loaded by the portfolio.
This entire directory is inside `studies/`, which the deployment excludes.

## The three compositions

| Study | Composition | What it explores |
| --- | --- | --- |
| Electric workshop | 80 BPM, D major; electric keys, recorded soft vibraphone, wood percussion, rounded bass | A warm, tactile place where things are made. Extended chords and small answering phrases, with a gentle pulse that recedes for reading. |
| Clear signal | 100 BPM, E-flat major; recorded marimba, short electronic plucks, harmonic sustain, syncopated bass | A more active game-menu character. Short note lengths and rhythmic placement carry the movement; a quieter second half tests whether the idea can recede. |
| Quiet presence | 60 BPM, C major; recorded piano with a very small sustained harmonic layer | The least percussive direction. Broken voicings and long natural decays leave space between statements. No drum or wood-percussion part. |

Each has a separately written harmony, melody, rhythm and set of interaction
cues. These are new arrangements; no THE FINALS or Valorant audio was sampled.
The references informed the earlier research, not the source recordings.

## Common listening timeline

- **0:00–0:09:** atmosphere establishes itself; small fragments introduce its material.
- **0:09:** a short focus cue.
- **0:14:** an open-project cue.
- **0:26–0:34:** the origin phrase. Notes begin spread across the stereo field,
  then collect into a more centered statement. The intention is the author's
  distributed presence assembling into 0x00.
- **0:36–0:48:** fewer events for a reading passage; the full study fades out.

The comparison's three layer choices use the same timeline. **Cues only**
contains deliberate silence between events; the moment buttons jump to them.
Switching directions preserves the position. One native audio element handles
playback. Files load on interaction, and playback pauses when the page is hidden.

The waveform follows the selected layer, on the complete mix's amplitude scale.
The complete mixes are loudness-matched. Individual stems and cue exports retain
their original mix gain, rather than being made equally loud in isolation.
“Quiet site level” applies **−9 dB** to the audition level. This is a comparison
aid, not a final volume setting for the portfolio.

## Sources and source treatment

Piano, soft vibraphone, marimba and woodblock recordings are from the
[Versilian Community Sample Library](https://versilian-studios.com/vcsl/),
released under CC0. The pinned commit, exact source URLs and SHA-256 hashes are
in `sources.json`. The complete downloaded license is in `sources/LICENSE`.

Source release: `c1ea7bcc3c7309650ab0da9d15c9cd1fbc4a4c7e` in
[sgossner/VCSL](https://github.com/sgossner/VCSL).
30 recordings were fetched; two were excluded from the arrangements after
inspection. The F2 piano has conspicuous low-frequency contamination; the F2
vibraphone was also avoided. Recorded sample names use C3 for approximately
261.6 Hz, so the sampler maps their octave one higher than scientific notation.
Representative pitches were measured before arranging.

The renderer trims leading silence while preserving attacks, removes low rumble,
uses conservative low-pass filtering and level balancing, repitches neighboring
recordings with polyphase resampling, and renders note releases and room effects
offline. Electric keys, bass, plucks and the small harmonic layer are synthesized.
There is no generated continuous noise bed. Original note sequences and voicings
are visible in `render.py`; there is no randomized melody generator.

## Files and rebuilding

- `audio/<direction>-full.mp3` — complete study, with cues.
- `audio/<direction>-atmosphere.mp3` — the 48-second atmosphere, with tails wrapped
  into its start for loop auditioning. Unlike the full study, it has no end fade.
- `audio/<direction>-cues.mp3` — cues placed on the common 48-second timeline.
- `audio/<direction>-focus.mp3`, `-open.mp3`, `-origin.mp3` — isolated cues.
- Matching 44.1 kHz, stereo, 24-bit WAVs are editable masters.
- `variants.json` — measurements and comparison waveform data.
- `source-processing.json` — instrument mapping and onset trims.
- `fetch_sources.py` — reproducible download from the pinned library commit.

Python requires NumPy and SciPy. FFmpeg must be on PATH. For this workspace the
bundled Python was used, with SciPy installed in the temporary dependency folder
recorded in `.python-deps-path`. To rebuild with any suitable Python environment:

```sh
python fetch_sources.py
python render.py
```

## Verification and limits

FFmpeg loudness/true-peak analysis of the delivered MP3s:

| Complete mix | Integrated loudness | True peak | Stereo correlation |
| --- | ---: | ---: | ---: |
| Electric workshop | −26.26 LUFS | −11.63 dBTP | 0.937 |
| Clear signal | −26.27 LUFS | −11.52 dBTP | 0.928 |
| Quiet presence | −26.28 LUFS | −9.59 dBTP | 0.932 |

No limiter was used to flatten transients. Levels were matched with a constant
gain per direction. Stereo correlation is positive in all three; mono RMS is
recorded in `variants.json`. The uncompressed atmosphere boundary steps measured
−60.72, −78.92 and −79.00 dBFS respectively. Musical loop endings return to their
opening harmony; final gapless behavior still needs checking in the chosen
production playback path.

These checks establish signal integrity, not musical approval. No claim is made
that a tool-based loudness analysis substitutes for listening, or that this study
has established a CPU improvement in the portfolio. The listening decision comes
before changing the live engine.

If a direction works, the next production step is to adapt its density and loop
length to the actual site, then wire only semantic interactions: focus with a
cooldown, explicit project opening, and the origin reveal. Scrolling and every
pointer ripple should not each demand a new audible event. Profile that final
integration separately.

Earlier research and source links: [SOUND_RESEARCH.md](../../SOUND_RESEARCH.md).

Comparison verification: `node verification/playback-state.cjs` passes four loading-state regressions (hidden page, rapid switches, immediate cue playback, cancellation). Desktop and 390px layout inspected; browser playback, layer changes, quiet-level gain and timestamp switching verified.
