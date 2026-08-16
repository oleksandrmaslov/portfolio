# Sound Design Research — for the M.O. SYSTEM portfolio

> A durable reference distilled from award-winning web audio (Awwwards / CSSDA / FWA),
> studio practice (Lusion, Immersive Garden, makemepulse, Resn), and Apple's sonic
> philosophy. Written to orient every future sound conversation in this project.
> Last major update: ground-up "disturbance field" rework (Sound Lab v4).

---

## 0. The one idea that changes everything

**Nothing "plays." There is ONE living field, and every interaction is a way of disturbing it.**

Award-winning web audio is not a folder of `.mp3` SFX triggered on events. It is a single,
continuously running sonic environment that the user *perturbs*. Hover, click, scroll, and
keypress are not separate sounds — they are different gestures that inject energy into the
same medium, which blooms and then decays back into the ambient.

This maps 1:1 onto the project's core metaphor:
**"Projects are nodes; I am node 0x00, scattered everywhere across the universe."**
→ You are not a cursor clicking buttons. You are a *disturbance propagating through a field*.
The field is always there (the universe); your attention is the wavefront.

Everything below serves this one idea.

---

## 1. What the award sites actually do (Awwwards / CSSDA / FWA)

Common threads observed across SOTD / sound-forward winners:

- **Audio is treated as a first-class design material, not decoration.** On the best WebGL
  sites, sound is integrated with the visuals so tightly that muting the page feels like
  losing a sense — the audio and motion are authored together, not bolted on.
- **One ambient bed, many excitations.** A low, evolving pad/texture runs continuously;
  UI events are *short excitations routed through the same reverb/space* as the bed, so they
  sound like they belong to the room rather than sitting on top of it.
- **Generative, never looping-obvious.** Pitches, timing, and timbre are randomized within
  curated constraints (a scale, a register, a probability) so the ear never catches a loop.
  Think "slowly evolving system" (Eno's generative lineage) rather than "background track."
- **Reactive mixing / sidechain ducking.** When something important happens (a transition,
  a big click), the bed momentarily ducks or filters so the event reads clearly, then the bed
  swells back. The mix breathes around interaction.
- **Spatialization.** Stereo (and sometimes binaural / Web Audio `PannerNode`) places nodes
  in space. Scrolling/moving changes *where* things are, not just whether they play.
- **A deliberate, gorgeous mute/unmute moment.** Sound-forward sites make enabling audio an
  event (a labeled toggle, a swell on enable) because browsers block autoplay and because
  consent makes the experience feel intentional. The toggle is part of the brand.
- **Restraint + payoff.** Long quiet stretches make the rare bloom land harder. Density is
  the enemy; silence is a material.

**Studios to study:** Lusion (real-time/WebGL craft, tactile micro-sound), Immersive Garden
(Paris; cinematic design+animation+dev, atmospheric beds), makemepulse, Resn, Active Theory,
Unseen Studio. Tooling in this space is usually **Web Audio API** directly, often via
**Tone.js** or **Howler** for scheduling, with **convolution reverb** (impulse responses) for
shared space and `OfflineAudioContext` to bake textures.

---

## 2. How Apple thinks about sound (and why it's the gold standard for UI audio)

Apple's interface and brand sound is the most-refined mass-market example of "functional
sound that feels like part of the object." Principles worth stealing:

- **Sound confirms, it doesn't announce.** UI sounds are feedback — they tell you an action
  registered. They are short, soft, and never compete with what you're doing. The goal is a
  feeling of *quality and responsiveness*, not attention.
- **Married to haptics.** Apple designs sound and the Taptic Engine *together* — the click of
  the switch, the tick of the picker — so the body and ear receive one coherent event. On the
  web we don't have a Taptic Engine, but the lesson holds: pair the sound with a *visual*
  micro-motion (a 1px settle, a glow) so it reads as physical.
- **Materials and physical modeling.** Many Apple sounds are derived from or modeled on real
  physical objects (the heft of a switch, a струнный pluck), then refined to be cleaner and
  more "designed" than reality. They sound *plausible*, not synthetic-for-its-own-sake.
- **Consistency builds a sonic identity.** A small, coherent palette used everywhere becomes
  recognizable. Restraint and repetition = brand.
- **Accessibility & respect.** Sound is always optional, never required to use the product,
  and never startling. Loudness is conservative; dynamics are gentle.
- **Detail at the threshold of perception.** The craft lives in tiny things most users never
  consciously notice — a 6ms attack vs 12ms, a hair of pitch drift, a touch of stereo. The
  sum is "it just feels good."

**Translation to this project:** the mechanical-keyboard *thock* is our "Taptic" — a physical,
branded confirmation. Keep it. But (per the brief) also feed its energy into the field so the
press *disturbs space*, marrying Apple-style confirmation with the disturbance metaphor.

---

## 3. The architecture: a "disturbance field" engine

A signal-flow that makes interactions mix INTO the ambient instead of playing over it.

```
                          ┌─────────────────────────────────────────┐
   FIELD (always on)      │                                         │
   ─ sub carrier          ├──► BED BUS ─┐                           │
   ─ evolving texture     │             │                           │
   ─ sparse random nodes  │             ▼                           │
                          │        ┌─ DUCK (sidechain) ◄── triggers │
   EXCITATIONS (gestures) │        │                                │
   ─ hover  → soft excite ├──► EVENT BUS ─┐                         │
   ─ click  → bloom       │              │                          │
   ─ key    → thock+excite│              ▼                          │
   ─ scroll → motion/pan  │         ┌─ SHARED SPACE ─┐  (convolution │
                          │         │  reverb + delay │   reverb IR) │
                          │         ▼                 ▼              │
                          │     ┌── MASTER ──► limiter ──► out ──────┘
                          │     │   (presence/volume)
                          └─────┘
```

**Rules that make it feel unified, not "SFX on a track":**

1. **Shared space.** Bed and events go through the *same* convolution reverb / delay. That
   common tail is what makes a click sound like it happened *in the room* with the drone.
2. **Send, don't trigger.** An interaction adds energy to resonators / opens a filter / nudges
   the bed's pitch — it doesn't fire an isolated sample. Wetness (project default **60%**) =
   how much of each event splashes into the shared tail vs. stays dry.
3. **Sidechain ducking = "the disturbance."** Every meaningful event briefly ducks the bed
   (and/or opens its filter), so the field visibly *reacts* to you. This is the literal
   feeling of disturbing a field. Recover slowly (300–800ms).
4. **Excitation, not playback, for hovers.** Hovers feed a tiny noise/impulse into a tuned
   resonator bank — the field "rings" at the node's pitch. No sample is played.
5. **Motion replaces friction for scroll.** Scroll maps to *parameters of the field* — filter
   cutoff, a gentle doppler/pitch glide, stereo pan of nearby nodes, depth (reverb send) —
   NOT to a friction/noise generator. You move *through* space; you don't rub against it.
6. **Generative rest state.** At rest the field can be near-silent and only occasionally let a
   distant node ping (long silences). Presence (project default **80%**) scales overall
   density + level, not "how loud is the drone."

---

## 4. Concrete fixes for the two complaints

**"The scroll shove sounds like rubbing — annoying."**
- Remove the friction/granular-noise scroll bed entirely.
- Replace with **motion through the field**: scroll velocity → (a) gentle lowpass/highpass
  sweep, (b) subtle pitch/doppler glide of the carrier, (c) stereo pan + reverb-send of the
  nearest 1–2 nodes so they *pass by* you. Tonal, airy, directional — never noisy.
- Section arrivals get a soft swell (the field opens up), not a scrape.

**"The drone feels annoying — I want space, not a sustained pad."**
- Kill the always-on sustained pad as the default rest sound.
- Rest = **resonant void**: a very low sub (felt more than heard) + sparse, randomized distant
  pings with long gaps. The field only truly *rings* when you touch it.
- Offer it as a spectrum (see directions below) so "how much is there at rest" is a knob, not
  a fixed drone.

---

## 5. The three field directions to prototype (Sound Lab v4)

All three share the disturbance architecture; they differ in the *material and rest-behavior*
of the field. Probe side-by-side, then we wire the winner into the landing.

- **A — VOID (cold & crystalline).** Near-silent at rest: deep sub + rare, distant glass/metal
  pings in vast reverb. Maximally on-concept ("you ARE the disturbance"). Touch makes it ring
  like struck crystal. Long silences. Airy, spacious, sci-fi.

- **B — BREATH (warm & organic).** A barely-there filtered air/room-tone breathes slowly (no
  pitched drone). Interactions bloom warmer, bowed/blown, intimate. Less sci-fi, more human,
  more "alive." Texture over pitch at the edges (the requested atonal drift lives here).

- **C — DEEP FIELD (cinematic).** Sub-heavy, vast, slow-evolving low resonance — luxurious and
  immersive (closest to Immersive Garden's atmospheric weight). Bigger blooms, longer tails,
  more sidechain "breathing." Most "fills the room" at presence 80.

**Tuning (keep, per brief):** every node remains a just-intonation harmonic of node 0x00, so
nothing can sound wrong — *but* let timbre/texture drift atonal at the edges of the field
(noise partials, inharmonic resonator modes) so it isn't sterile. Consonant core, frayed edges.

---

## 6. The volume toggle (replacing the [G] grid button)

Three forms prototyped live in Sound Lab v4 — pick by feel:
- **A — EQ bars** that track *real output level* off an analyser. Most alive, most on-concept.
- **B — Speaker glyph.** Familiar, least distinctive.
- **C — Inline fader.** On-brand with the fib-grid precision aesthetic.

Whichever wins: enabling audio should be a *moment* — a soft swell as the field comes online,
a label so it reads as intentional (Apple-style consent + payoff).

---

## 7. Defaults locked for this project

| Parameter        | Value | Meaning |
|------------------|-------|---------|
| Presence         | 80    | Immersive; fills the room (density + level, not drone loudness) |
| Wetness          | 60    | Events splash well into the shared tail |
| Tonality         | Consonant core, atonal/textural edges | Just-intonation harmonics of 0x00, frayed at the field's edge |
| Thock            | Keep + feed into field | Branded confirmation that also disturbs space |
| Rest state       | Resonant void / breath — NOT a sustained pad | Silence is a material |
| Scroll           | Motion through field (filter/doppler/pan/depth) — NO friction noise | You move through space |

---

## 8. Implementation checklist (Web Audio, no libraries required)

- [ ] One `AudioContext`, resumed on the enable gesture (autoplay policy).
- [ ] **Master chain:** sum → gentle compressor/limiter → `presence` gain → destination.
- [ ] **Shared space:** one `ConvolverNode` (synthesized IR via `OfflineAudioContext`, or a
      noise-burst → decay IR) + a `DelayNode` feedback loop. Bed and events both send here.
- [ ] **Bed:** sub oscillator(s) + slowly-modulated filtered noise/texture; LFOs on cutoff &
      amplitude; very slow random walk so it never loops audibly.
- [ ] **Resonator bank:** `BiquadFilter` (bandpass, high Q) or modeled modes; excited by short
      noise/impulse bursts. Hover/click/key = excitations, tuned to 0x00 harmonics.
- [ ] **Sidechain:** on each event, ramp bed gain down then back up (and/or open bed filter) —
      a `GainNode` automated with `setTargetAtTime`. This is "the disturbance."
- [ ] **Scroll:** rAF-throttled velocity → filter cutoff + carrier detune + `StereoPannerNode`
      + reverb send of nearest node. No noise generator.
- [ ] **Analyser:** `AnalyserNode` on master for the EQ-bars toggle + any visual reactivity.
- [ ] **Voice pool + limiter** to avoid clicks/overload on rapid interaction.
- [ ] Respect `prefers-reduced-motion` is visual; for audio, default OFF and remember consent.

---

*This file is the orientation point for sound work in this project. When in doubt: one living
field, you are the disturbance, silence is a material, and it should feel inevitable — like the
sound was always part of the object.*
