# The Disturbance Field — Sound Design Research & Doctrine

> A durable reference for the M.O. SYSTEM portfolio (Oleksandr / node `0x00`).
> Read this before touching audio in any future session. It encodes *why* the
> sound system is built the way it is, what award-winning web/product audio
> actually does, and the rules we hold ourselves to.

---

## 0. The one idea everything hangs on

**Nothing "plays." There is one living field, and you disturb it.**

Every interaction — hover, click, keypress, scroll, page transition — is not a
sound *effect* triggered on top of silence. It is **energy injected into a single
continuous medium**: it excites resonators, splashes into the shared reverb tail,
bends the ambient bed's pitch, or opens a filter. Sounds *bloom out of* the
ambient and *decay back into* it. The user is not hearing a UI; the user is a
**disturbance propagating through a field**.

This is the literal sonification of the portfolio's metaphor:

> *"Projects are nodes. I am node `0x00` — the root, scattered everywhere across
> the universe. To move through the work is to send a ripple through me."*

`0x00` is the **fundamental**. Every node is a just-intonation harmonic of it, so
nothing can ever sound *wrong* — the whole universe is in tune with you. At the
**edges** of the field we let things drift atonal/granular, so the universe feels
vast and not saccharine.

---

## 1. What award-winning web sound design actually does

Surveying Awwwards "Sites of the Day," CSS Design Awards, FWA, and studios like
**Lusion**, **Immersive Garden**, **Active Theory**, **Resn**, and **Basement**,
the throughline is *not* "cool sound effects." It is:

1. **One coherent sonic world, not a soundboard.** Winning experiences feel
   *scored*, like a film or a game level — a continuous ambient world with
   reactive layers, not discrete bleeps. Audio and visuals are designed as a
   single sensory layer, so motion, light and sound resolve on the same beat.

2. **Audio is reactive and parameterised, not pre-baked.** Scroll velocity, cursor
   speed, hover proximity, and physics state drive *parameters* (filter cutoff,
   pitch, send level, density) of always-running voices. The sound *is* the
   interaction, sampled continuously — not a clip fired on an event.

3. **Restraint + a "first gesture" unlock.** Because browsers block autoplay, the
   best sites turn the required click-to-enter into a *ritual* ("sound on" /
   "enter") and reward it. Once in, they stay quiet and tasteful — sound is a
   garnish that can be muted, never a tax.

4. **Spatialisation.** Stereo (and increasingly WebAudio `PannerNode` / Resonance
   Audio / Ambisonics) places events in a space. Things come from somewhere.
   Distance = quieter + darker (low-pass) + more reverb. This single
   distance-cue rule does most of the heavy lifting for "immersive."

5. **Generative, never-looping ambience.** The bed is synthesised or layered from
   *incommensurable loops* so it never audibly repeats. Static loops are the
   tell-tale sign of amateur web audio; they fatigue within a minute.

6. **It's all WebAudio graph craft.** Master chain discipline (HPF → tone-shaping →
   glue compression → limiter → volume), convolution reverb as a shared "room,"
   and careful gain-staging so dozens of simultaneous voices never clip or turn
   to mud.

**Anti-patterns that get a site dismissed as amateur (and that we explicitly avoid):**
- A looping MP3 drone (fatigues fast; the user's complaint about our v3 drone).
- Friction/"rubbing" noise tied to scroll (felt abrasive in v3 — *removed*).
- The same click sample on every element (no spatialisation, no velocity, no life).
- Sound that can't be muted, or that blasts at full volume on load.
- Decorative infinite loops with no relationship to what the user is doing.

---

## 2. Apple's product-sound doctrine (and why it applies to a website)

Apple's audio + haptics team (Hugo Verweij, Camille Moussette, Kelly Jacklin) have
articulated a philosophy across WWDC '17/'19/'21 and interviews that maps cleanly
onto interface audio on the web:

- **Use it sparingly.** The stated goal is the balance "between no sound and too
  much" — a delicate line. UI sound sits at *much lower volume* than a
  notification; it is "a very subtle layer." → *Our field sits low and gets out of
  the way; presence is a dial, default modest.*

- **Harmony / cause-and-effect.** "Things should feel the way they look and sound."
  In the physical world audio, haptics and visuals are unified by a clear causal
  link; in software you must *manufacture* that link deliberately. → *Every sound
  is bound to a visible cause and resolves on the same frame as the motion.*

- **Velocity → amplitude (and timbre).** Apple modulates a sound's amplitude by the
  velocity of the hit (e.g. a bouncing sphere). → *Our pings, thocks and ripples
  scale level AND brightness with interaction velocity — a fast cursor / hard
  press is brighter and louder; a gentle one barely stirs the field.*

- **Direction.** Two different sounds for forward vs. back give a sense of
  direction. → *Scroll down vs. up, enter vs. leave, gather vs. scatter each have
  a distinct, mirrored gesture.*

- **Multimodal unity.** Sound is one channel of a single moment that also includes
  animation and (on capable devices) haptics. Designed together, "jamming"
  together, in one studio. → *We treat the visual node-pulse and its sonic ping as
  the same event with two outputs; where the Vibration API exists, a matching tap
  fires.*

- **Craft is iterative.** Apple frames even a single button's sound as an
  iterative design+engineering effort. → *We prototype in a Sound Lab, A/B
  directions live, and tune by ear.*

---

## 3. The generative engine — Eno's "incommensurable loops"

Brian Eno's generative method: **specify the materials and the processes, but not
the combinations** — let the system produce arrangements you did not author. The
mechanism behind *Music for Airports* and *Ambient 1* is layered loops of
**different, non-harmonically-related lengths** ("incommensurable"), so they drift
in and out of phase and **do not return to the same alignment for ~27 days**.

We use this directly for the **field at rest**:
- Several independent generative voices (sub pulse, beacon, distant node pings,
  slow filter sweep, air layer), each on its **own timer with a prime-ish,
  mutually-irrational period** and probabilistic jitter.
- They never realign → the ambience never audibly loops → no fatigue, no "drone."
- The system is the composer; we only specify materials (the `0x00` harmonic
  series) and processes (timers, probabilities, ranges).

This is also why the rest-state can be *near-silent* and still feel alive: long
silences punctuated by rare, distant, spatialised events read as **a vast space
that is awake**, not as "audio that stopped."

---

## 4. The M.O. SYSTEM rules (hold these)

1. **One field, one bus.** Every voice routes through the shared master chain
   (HPF → air shelf → glue comp → limiter → master gain) and feeds a shared
   convolution reverb "room." No voice is an island.

2. **Inject, don't trigger.** Interaction handlers push energy into always-present
   structures (excite a resonator, raise a send, bend the bed) rather than calling
   `play()` on a clip. Even one-shots get a reverb send so they *land in the room*.

3. **`0x00` is the fundamental.** `nodeFreq(addr)` derives every pitch as a
   just-intonation harmonic of the root. Consonant by construction. Let only the
   *edges* (distant/rare events) detune and granulate.

4. **Velocity drives amplitude + brightness.** Map cursor speed, scroll velocity,
   and press force to gain and filter cutoff. Soft = dark and quiet; hard = bright
   and present.

5. **Distance is the master spatial cue.** Farther node = quieter + low-passed +
   more reverb send + wider/edge pan. This one rule sells depth.

6. **Never loop audibly.** All ambience is generative with incommensurable timers.
   No static loops in the bed.

7. **Sparse and low by default.** Presence is a dial. Default modest. The field
   should be missable, then unmissable once noticed. Always mutable; state
   persists in `localStorage`.

8. **Mirror your gestures.** Down/up, enter/leave, gather/scatter, press/release —
   each pair is two related-but-distinct sounds so direction is audible.

9. **Scroll = moving through space, never friction.** Scroll modulates a filtered
   *glide* / depth-parallax / doppler — it must never sound like rubbing.

10. **The keypress thock stays — and also disturbs the field.** The mechanical
    keyboard `thock` is brand identity (firmware/keebs). Keep its physical body +
    contact + spring, but route a copy into the field so even a keypress ripples
    the universe.

---

## 5. The WebAudio toolkit we rely on

- **Master chain:** `BiquadFilter` (HPF ~26Hz to kill rumble) → high-shelf "air" →
  `DynamicsCompressor` (gentle glue) → `DynamicsCompressor` (brickwall limiter,
  ratio 20, fast attack) → master `GainNode` → `AnalyserNode` → destination.
- **Shared room:** one `ConvolverNode` with a synthesised impulse; every voice has
  a `reverbSend` gain into it. Bigger/farther events send more.
- **Resonators (the "ring"):** modal synthesis — a few detuned partials per event,
  each an exponential-decay `GainNode`, summed; OR `BiquadFilter` band-pass banks
  excited by a noise burst (struck-object realism).
- **Spatialisation:** `StereoPannerNode` (cheap) or `PannerNode`/HRTF (true 3D).
  Distance → gain + low-pass + send.
- **Texture:** looping noise `BufferSource` → band-pass for air/dust; `WaveShaper`
  for bitcrush/saturation at the edges; slow LFO `OscillatorNode`s on filter
  cutoff for breathing.
- **Metering for visuals:** `AnalyserNode.getFloatTimeDomainData` → RMS drives the
  volume-toggle equalizer bars and any reactive visuals (keep audio↔visual unity).
- **Unlock:** build the graph on first user gesture (`ctx.resume()`); browsers
  block autoplay. Make that first gesture a ritual.

---

## 6. The three field directions we prototype (Sound Lab v4)

Each is a complete identity for the *rest state* + *material* + *scroll feel*.
They share the engine; they differ in materials and process parameters.

- **A — VOID (near-silent observatory).** Rest = almost nothing: rare, distant,
  detuned node pings in a huge reverb, long silences. You are the disturbance; the
  field only truly rings when you touch it. Cold, crystalline, glass/struck-metal.
  Scroll = gliding through space (gentle doppler + filter, no noise).
  *Most on-concept.*

- **B — BREATH (living, present, warm).** Rest = a barely-pitched air/room-tone
  that slowly breathes (LFO on filter + gain), with sparse warm glassy pings.
  Intimate, blown/bowed, less sci-fi. Scroll = depth parallax — you sink past
  layers of resonance that brush by and pan.
  *Warmest, most "alive" at presence 80.*

- **C — SIGNAL (deep, cinematic, sub-heavy).** Rest = a slow sub pulse + distant
  telemetry beacons, vast and luxurious, long tails. Deep space observatory.
  Scroll = arrival swells — scroll itself near-silent, section arrivals bloom.
  *Most cinematic, most "expensive."*

The volume toggle (replacing the `[G]` grid button) is prototyped in three forms,
chosen live: **equalizer bars** (track real RMS output — most alive, most
on-concept), **speaker glyph** (familiar), **inline fader** (precise, on-brand
with the fib-grid aesthetic).

---

## 7. References (for the next session to go deeper)

- Apple, WWDC 2017 *Designing Sound*; WWDC 2019 *Designing Audio-Haptic
  Experiences* / *Core Haptics*; WWDC 2021 *Practice Audio Haptic Design*.
- *Twenty Thousand Hertz* — "The Sound of Apple" (Sorrentino, Verweij, Jacklin).
- Brian Eno, "Generative Music" talk (1996) & *A Year With Swollen Appendices*;
  Alex Bainter, "Introduction to Generative Music" (incommensurable loops).
- Andy Farnell, *Designing Sound* (procedural audio bible) — obiwannabe.co.uk.
- Studios to study for web audio: Lusion, Immersive Garden, Active Theory, Resn,
  Basement Studio. Platforms: Awwwards, CSS Design Awards, FWA.
- MDN Web Audio API; Google Resonance Audio / Omnitone (Ambisonics on the web).

---

*Doctrine over decoration. The field is alive; the visitor is the event.*
