# Sound for a Node-0x00 Portfolio: A Research Synthesis

## TL;DR
- **Build the system, not the sample library.** Award-tier sound-forward sites (Lusion/Plan8's Klang audio engine; Immersive Garden + composer Ben Lukas Boysen on Toom Archives; OFF+BRAND's Aether 1 case study on Codrops) don't bolt clips onto UI — they author an interactive *music system*: one ambient bed, state-driven musical layers, and Web Audio nodes (low-pass biquads, convolvers, analyser-driven shaders) that are themselves part of the composition. Your portfolio should be one such system.
- **The "field disturbance" metaphor is correct, but raise the stakes by anchoring it in physical modeling.** A node is a *resonator*; the cursor is an *exciter*; the ambient bed is the *room*. Karplus–Strong / modal-resonator excitation (per Julius O. Smith III at Stanford CCRMA; lineage continues in Mutable Instruments' Rings) gives you a literal physical translation of your metaphor — every hover excites a body, every keypress strikes a damped string, and the convolver/FDN reverb is the one shared room all of it lives inside. That is "node 0x00 as resonant center" expressed in DSP.
- **Use Tone.js as the scaffolding, drop to raw Web Audio for the signature DSP.** Tone.js gives you Transport, scheduling, signal-rate automation and DAW-style abstractions; raw `ConvolverNode`, `BiquadFilterNode`, `AnalyserNode`, `AudioWorklet`, and `OfflineAudioContext` give you the physics. Synthesize every sound live (no audio files); pre-render impulse responses with `OfflineAudioContext`. Cap polyphony, use one shared ConvolverNode bus, and gate `Tone.start()` behind an explicit "enable audio" affordance — the most common production bug per the pkgpulse comparison and the Tone.js Performance wiki.

---

## Key Findings

### 1. Award-winning web sound design — how the best actually build it

**Lusion × Plan8 / "Klang."** Lusion's award-winning sites (their own studio site; SPAACE.IO) are scored by Plan8, who openly document their bespoke audio engine **Klang**. Plan8's own writeup is explicit about the model: *"Klang is our bespoke audio library, it handles everything one needs to play audio in the browser, like sequencing, samplers, effects etc… The communication between the main application and Klang is then handled by triggering project specific sound events"* (Plan8 Medium, "Sound designing the metaverse"). Klang is built on top of **Tone.js** and `standardized-audio-context`. Plan8 also says *"Using 3d panners is quite performance intensive and therefore something to be used wisely. We usually set our web audio panner nodes to use the simpler panning"* — confirming that even at the top of the market, HRTF spatialization is used sparingly and stereo/equal-power panning is the default. Plan8's generative-music initiative inside Klang (Plan8 Medium, "Generative music using Klang") notes: *"These new tools give us the ability to create highly dynamic music with just a few lines of code and still have it be rooted in something pre-composed within a digital audio workstation such as Reaper."* The pattern: a pre-composed score, but with branching/state-driven layers — not a static loop.

**Immersive Garden + Ben Lukas Boysen / "Toom Archives" (ATEN7).** Immersive Garden's most cited audio collaboration is with composer **Ben Lukas Boysen**, an ECM-adjacent ambient/neoclassical composer — exactly the brand level a graphite/precision portfolio should aspire to. Per Immersive Garden on Awwwards (SOTM July 2023 writeup): *"Our journey was enriched further by a harmonious partnership with music composer Ben Lukas Boysen. Tasked with crafting a sound that seamlessly melded with the immersive experience to create the special effects and distinct melodies, each thoughtfully tailored to accompany the transitions between the website's four seasons."* Tech stack confirms **Pizzicato.js** as their audio engine. On the David Whyte Experience, Immersive Garden credits sound studio **Mooders**: *"Through 3D WebGL visuals and custom sound design, the site created a multi-sensory experience"* (immersive-g.com/projects/david-whyte-experience).

**Active Theory × Plan8 / "Harmonic State" (IBM Watson).** This is the cleanest documented example of *state-driven* music: *"a dissonant soundtrack gradually transitioned into harmony and order as users acted on the insights provided by Watson"* (Active Theory case study). The score *is* the UI feedback. This is the single best precedent for your metaphor — the field becomes more ordered as the visitor moves through it.

**Active Theory / "The Field" (WSJ Future of Everything).** Documents distance-based spatialization in production: *"We used proximity based audio — adjusting the levels of user audio to hear the particle avatars closer to them… we used distance between avatars to define a doppler effect as users moved closer to, or away from, each-other."* Proximity-driven gain + Doppler is achievable with vanilla Web Audio `PannerNode` (panningModel: 'equalpower').

**OFF+BRAND / Aether 1 (Codrops case study, August 2025) — the deepest public teardown.** Developer Adrian Gubrica writes: *"The background audio itself was also processed using the Web Audio API, specifically a low-pass filter. This filter was triggered when the user hovered over the earphones in the first section of the main scene, as well as during the scene transitions at the start and end. The low-pass effect helped amplify the impact of the animations, creating a subtle sensation of time slowing down."* And on analyser-driven visuals: *"I used one of the background audio's frequency channels… as the input to drive various effects… modifying the pace and shape of the wave animations, influencing the strength of the particles' flow field, and shaping the touchpad's visualizer."* This is the operational template: **one ambient bed + Web Audio BiquadFilter (LPF) modulated by interaction state + AnalyserNode FFT driving shaders**.

**Rogier de Boevé portfolio 2024 (Codrops).** Verbatim: *"Because I aimed to create a cinematic atmosphere, the sound design was crucial… For the ambient sound, I combined a generative composition titled 'Drones 2' by Alex Bainter with a sample from AVA Music Group. All other sounds were either samples from AVA or extracted from the ambient sound to create a coherent, immersive experience."* Notable because the bed is explicitly *generative* (Alex Bainter's Generative.fm), and every other UI sound is *extracted from the bed* — meaning every interaction shares timbre with the field. This is the single most important compositional principle to steal.

**Disagreement to flag.** Plan8 (and the pkgpulse Tone.js vs Howler.js vs wavesurfer.js comparison) treat **Tone.js as foundational scaffolding**. The Aether 1 Codrops teardown uses **raw Web Audio API directly** (no Tone.js cited). Bruno Simon's portfolios use **Howler.js** — explicitly a *playback* library, not a synth library (Supadark guide: *"What Howler.js doesn't do: synthesis, sequencing, effects chains, musical timing. It plays files."*). The market is split: top-tier sound-forward studios use Tone.js + raw Web Audio; portfolio-tier developers use Howler. For an award-targeting *synthesis-first* portfolio, Howler is the wrong tool.

**Key insight:** *The award-winning move is not better sound effects — it is making the bed and the interaction sounds harmonically and timbrally the same material.* Rogier de Boevé extracts UI sounds from his bed. Lusion/Plan8 trigger musical events into a running Klang transport. Immersive Garden ties Boysen's seasonal melodies to scrub gestures. None of them play "clips."

---

### 2. Apple's sound design philosophy — what to actually steal

**The canonical primary sources** are Hugo Verweij's WWDC17 talk "Designing Sound," WWDC19 "Designing Audio-Haptic Experiences" and "Expanding the Sensory Experience with Core Haptics" (Verweij + Camille Moussette), WWDC21 "Practice audio haptic design," and the *Twenty Thousand Hertz* podcast "The Sound of Apple" (with Billy Sorrentino, Verweij, Kelly Jacklin). Per Verweij's own site (hugoverweij.com): *"After nearly twelve years leading sound design on Apple's design team, I'm now designing sound at LoveFrom."*

**Five extractable principles, each tied to a named source:**

1. **Sound is born from the object's physical material.** Verweij on the Apple Watch sounds (Twenty Thousand Hertz): *"We took those to the studio, and went into a very quiet room with very sensitive microphones and tried to record them… he held up the watch casing by a string, so it was dangling in the air. When he tapped it again, it produced a very familiar sound."* The Watch's sound is the Watch's casing struck. For your portfolio: the keypress sound should be modeled from a real switch (or recorded once and resynthesized). The "thock" is not a metaphor — it's the brand made audible.

2. **Causality.** Camille Moussette, WWDC19: *"Causality, how it can help to think about what makes the sound and what causes the haptics."* Every sound needs a cause the user can see. Hover = excitation. Click = strike. Scroll = friction.

3. **Harmony.** WWDC19: *"Harmony is about things should feel the way they look, the way they sound. In the real world, audio haptics and visuals are naturally in harmony because of the clear cause and effect relationship. In the digital world though, we have to do this work manually."* Visual micro-motion + audio onset must be sample-accurate; on the web with no Taptic Engine, the visual *is* your haptic.

4. **Restraint — silence as a material.** WWDC19, on the audio-haptic pay flow: *"We refrain from adding other sound effects or haptic feedback… It's often a good idea not to add sound and haptics… are you tempted to add more? But maybe don't. It will overwhelm people, and it will diminish the value of what's really important."* This is the single rule most aspiring "sound-forward" portfolios violate.

5. **Confirmation, not announcement.** Verweij WWDC17: *"When you put on your seatbelt, you don't have to double check it's fastened. You hear the click, and you know you're good to go."* Sound says *"that worked"* — it does not say *"hey, look at me."*

**HIG specifics.** The Playing Haptics HIG (developer.apple.com/design/human-interface-guidelines/playing-haptics) says *"Be sure to use the system-defined haptics consistently in your app so that you don't confuse people."* The accessibility section: *"Many people rely on haptics to help them interact with apps when they can't see the screen."* For the web: provide a visible, prominent **mute** affordance, respect `prefers-reduced-motion` for any audio-driven visuals, and never make audio mandatory for understanding.

**Translating to the web (no Taptic Engine).** The audio onset is the haptic. Pair every sound with a sub-100ms visual micro-motion (a 1–3px nudge, a 1-frame brightness pop, a hairline that pulses). The micro-motion lasts ~150–250ms; the audio decays into the bed over 400–1200ms. The combination reads as physical even without touch feedback.

**Key insight:** *Apple's craft isn't a sound library — it's a discipline of restraint. The ratio of "could play a sound" to "actually plays a sound" is the variable that separates Apple from everything else.*

---

### 3. Generative & systems music — keeping the field alive

**Eno's Music for Airports is the canonical reference, and the technique is more relevant to you than the genre.** Per Eno's own description at the Imagination Conference, San Francisco, June 1996 (transcribed at udiscovermusic and reverbmachine): *"There were twenty-two loops. One loop had just one piano note on it. Another would have 2 piano notes. Another one would have a group of girls singing one note, sustaining it for 10 seconds. There are 8 loops of girls' voices and about 14 loops of piano. I just set all of these loops running and let them configure in whichever way they wanted to."* Specifically: *"One of the notes repeats every 23 1/2 seconds. It is in fact a long loop running around a series of tubular aluminum chairs in Conny Plank's studio. The next lowest loop repeats every 25 7/8 seconds… The third one every 29 15/16 seconds… they all repeat in cycles that are called incommensurable — they are not likely to come back into sync again."* Generative-music writer Alex Bainter (Medium, "An Introduction to Generative Music," January 2019) calculated this precisely: those three Eno loops *"would eventually re-synchronize, but not for almost 27 days"* — which is what "incommensurable" buys you in real units.

**The technique is asynchronous loops of incommensurable lengths.** Pick 5–8 short musical fragments (single notes, dyads). Loop each at a different prime/irrational length (e.g., 17.3s, 23.5s, 29.1s, 37.7s, 41.9s). Their combination won't repeat in any practical session length. This is Eno's actual method — and it maps directly to Web Audio: each is a buffer scheduled with `AudioBufferSourceNode.loop = true` at a distinct `loopEnd`, or, better, each is a generative procedure (a one-note synth voice retriggered on a long irregular interval).

**Liner notes definition (canonical):** *"Ambient Music must be able to accommodate many levels of listening attention without enforcing one in particular; it must be as ignorable as it is interesting"* — and *"An ambience is defined as an atmosphere, or a surrounding influence: a tint"* (Music for Airports liner notes, 1978, Editions E.G.). For a portfolio, that's the bar: the sound must reward attention but never demand it.

**Steve Reich's tape phasing.** *It's Gonna Rain* (1965) used two Wollensak reel-to-reel tape recorders playing identical short loops; one machine drifts ahead of the other due to mechanical inconsistency, producing approximately 17 minutes of evolving phase relationships from a single ~1.8-second source. (Documented at the Long Now Foundation's Eno profile and widely confirmed by Nonesuch Records.) On the web: two `AudioBufferSourceNode`s of the same loop at `playbackRate = 1.0` and `1.003` produce minutes of evolving phase before reaching meaningful drift.

**Just intonation and the harmonic series — why this matters for your brand.** Brian Chase (drummer of Yeah Yeah Yeahs, ambient composer, in his "Just Intonation" essay): *"Just Intonation… is a tuning system based on the naturally occurring acoustic phenomenon known as the harmonic series."* Tomáš Reindl's ĐRƟNEscape research (Journal Acoustics, issue 43): just-intonation drones use *"precisely calculated interval proportions"* with documented psychological effects — the small-integer ratios produce *no beating between partials*, which is the sound of crystalline machined precision. For a graphite/firmware/Fibonacci brand: tune your bed to a just-intonation drone (a 1:1, 3:2, 5:4, 7:4 stack — a 7-limit chord). The brand sounds like cleanly machined metal because the math is clean. Equal temperament will sound noticeably grayer and more "stock."

**Brian Eno's Long Now connection.** The 10,000-Year Clock chime generator (longnow.org) was designed by Eno + Danny Hillis to never repeat. Same principle: a small set of bells × a never-repeating algorithm = perceptually inexhaustible music. The relevance: a portfolio's audio system must survive 5+ minutes of attention without ever sounding like it's looping.

**Key insight:** *You don't need long source material to have a long composition. You need short material, irrational timings, and the discipline to let it run.*

---

### 4. The craft of "disturbing a field"

**One room for everything — convolution reverb.** Per MDN's ConvolverNode docs and the W3C Web Audio Convolution Architecture spec, `ConvolverNode` performs FFT-based convolution against an impulse response buffer. **Send every sound to one shared ConvolverNode bus.** This is what cinema mixers do: a single "room" tone glues disparate sources together. The bed, the hovers, the keypress thock, the scroll texture all share one convolver and they instantly sound like they belong to the same space.

**Synthetic IRs.** You don't need recorded IRs. The reverbGen library (adelespinasse/reverbGen on GitHub) implements James A. Moorer's classic insight from "About This Reverberation Business": *"exponentially decaying white noise makes a surprisingly good sounding reverb response."* Use `OfflineAudioContext` to render a 1–3s buffer of noise multiplied by an exponential decay envelope, optionally band-shaped — that's your IR. Pre-render once at boot; reuse forever.

**Feedback Delay Networks (FDN) — the alternative to convolution.** Per Julius O. Smith III (Stanford CCRMA, "FDN Reverberation"): FDN reverberators were first proposed by Gerzon (orthogonal matrix feedback) and Stautner & Puckette (1982). An FDN is a bank of delay lines cross-coupled by a unitary (or Hadamard) matrix; its CPU is dramatically lower than a long convolver and its decay time can be modulated in real time, whereas a convolver requires swapping IRs. Anton Miselaytes (ITNEXT, "Convolution Reverb and Web Audio API"): *"a big disadvantage of convolution reverb is that we can not easily adjust the reverb parameters in real time."* For a portfolio with a static "room," convolver is fine. If you want the room itself to breathe with the cursor, build an FDN in `AudioWorklet`.

**Sidechain ducking on the web.** Pro mixers describe ducking via sidechain compression — the bed dips when an interaction blooms. The Web Audio API has no native sidechain compressor with external trigger; you implement it manually. The pattern: when an interaction fires, schedule `gainNode.gain.setTargetAtTime(0.6, now, 0.05)` on the bed bus, then a return `setTargetAtTime(1.0, now+0.2, 0.4)`. This is functionally identical to sidechain ducking and is what every "ambient bed plus interaction bloom" web experience uses. LiquidSonics's pro-audio writeup on reverb-bus ducking confirms the principle: duck the *reverb* return, not the dry signal, for "extra dimension."

**Resonator excitation — physical modeling lite.** Synthtopia and MusicTech document the Karplus–Strong family: *"A short impulse is generated to simulate a 'strike' or 'pluck'. In the original algorithm, the impulse was a burst of white noise, but other types of signals can be used. The impulse sound is output and simultaneously fed back into a delay line. The length of the delay time determines the pitch."* CCRMA (J.O. Smith III): the algorithm is *"a special case of digital waveguide synthesis, which was used to model acoustic waves in strings, tubes, and membranes."* This is your metaphor in DSP form. A node on your site is a resonator with a fundamental pitch (from just intonation) and a decay; a hover/click *excites* it with a noise burst or filter ping. Mutable Instruments' Rings module (the modal-resonator reference Eurorack synth) is the analog of what you'd build in `AudioWorklet`. Modal synthesis layer (per a MOD WIGGLER practitioner thread): *"pings make the pluck sound, karplus the body and resonating chamber, and slower enveloped noise brings a more bowing-like timbre."*

**Granular textures for the bed.** philippfromme/granular-js and zya/granular demonstrate working Web Audio granular synthesis in production. For the ambient bed: take one rendered sustained drone and granulate it (3–80ms grains, randomized in position and pitch by ±5 cents). The output is a textural ambient that never repeats and decouples bed length from sample length. Combined with asynchronous Eno-style loop timings, this is essentially infinite.

**Spatialization.** Plan8 explicitly avoids HRTF on the web: stereo equal-power is the default. For your portfolio: use 2D stereo position derived from the node's screen position, lightly. Don't pursue binaural — the perceptual gain on consumer hardware is small and the CPU cost is real. Per the Tone.js Performance wiki (citing Paul Adenot, author of Firefox's Web Audio implementation): *"The most processor intensive nodes are the ConvolverNode (Tone.Convolver) and PannerNode using HRTF (Tone.Panner3D)."*

**Key insight:** *One convolver, manual ducking on the bed gain node, Karplus–Strong/modal resonators for nodes, granular for the bed. That four-element architecture is the entire system.*

---

### 5. Web Audio in practice — Tone.js vs raw, and a recommendation

**What is actually possible, all live, no audio files:**
- `OscillatorNode` (sine/saw/square/triangle/custom PeriodicWave), `BiquadFilterNode` (lowpass/highpass/bandpass/notch/peaking — Q controllable), `WaveShaperNode` (for soft saturation), `DelayNode`, `ConvolverNode` (FFT-based, accepts any AudioBuffer as IR), `DynamicsCompressorNode` (use for the master bus), `AnalyserNode` (FFT for audio-reactive visuals), `PannerNode` (stereo equal-power or HRTF), `GainNode` (for envelopes via `setTargetAtTime` / `linearRampToValueAtTime`).
- `AudioWorkletNode` — runs custom DSP on the audio thread (this is where you build the FDN / Karplus–Strong if Tone.js's built-ins aren't enough).
- `OfflineAudioContext` — renders an audio graph faster than realtime into a buffer. Use this at boot to pre-render impulse responses, looped grains, and any "expensive once" assets without ever shipping a `.wav`.

**Performance budget.** Per the Tone.js Performance wiki (citing Paul Adenot's Web Audio performance article): the most expensive nodes are `ConvolverNode` and `PannerNode` (HRTF). Therefore: one shared convolver bus, no HRTF, voice pool of ~8–16 simultaneous tones with hard cutoff and steal.

**Tone.js vs raw Web Audio — the decision.**
- **Tone.js gives you:** a Transport with sample-accurate musical scheduling (the JS event loop drifts; Tone's scheduler doesn't), prebuilt synths (Tone.PluckSynth is Karplus–Strong; Tone.MetalSynth, Tone.NoiseSynth, Tone.PolySynth, Tone.Synth), prebuilt effects (Tone.Reverb, Tone.FeedbackDelay, Tone.Convolver wraps the native node), Signal automation curves (`rampTo`, exponential/linear), and standardized-audio-context for cross-browser shimming. Tone.js docs (tonejs.github.io): *"Like the underlying Web Audio API, Tone.js is built with audio-rate signal control over nearly everything. This is a powerful feature which allows for sample-accurate synchronization."*
- **Tone.js costs:** an additional abstraction layer between you and the metal, and you must still call `await Tone.start()` inside a user gesture (the "enable audio" moment). Bundle size is non-trivial and should be measured against your performance budget at build time — I do not have a verified ship size figure to cite.
- **Raw Web Audio gives you:** smallest possible bundle, full control of node graphs, direct access to `AudioWorklet`. Cost: you write your own envelope/automation helpers, your own scheduler if you need musical timing, and your own cross-browser shims.

**Recommendation: Tone.js as scaffolding, raw Web Audio (and AudioWorklet) for the signature DSP.** Specifically:
- Use Tone.Transport for the asynchronous Eno-style loop scheduling, Tone.PluckSynth as the starting point for the node-excitation voice, Tone.PolySynth for chord beds.
- Drop to raw `AudioWorkletNode` for the FDN reverb or modal-resonator bank if Tone's built-ins don't deliver the precise sound.
- Use `OfflineAudioContext` (Tone.Offline or vanilla) at boot to pre-render the convolver IR and any one-shot textures.
- Set `Tone.context.latencyHint = "interactive"` (default) for keypress responsiveness.
- Gate all initialization behind a user gesture: `audioContext.resume()` / `await Tone.start()` on first interaction. This is the #1 production bug per the pkgpulse comparison.

**The "thock" — synthesizing a mechanical keyboard switch.** A real switch is: a brief broadband transient (the stem hitting the housing) + a short high-Q resonance (the case/PCB ringing) + a softer second transient (key bottom-out or top-out). In Web Audio: noise burst (5–15ms) → biquad bandpass with high Q (2–8) centered ~150–400Hz (depending on case material) → very short envelope (attack ~1ms, decay 30–80ms) → through the shared convolver. Vary the bandpass center by ±5% per keystroke for "real-world randomness" — Bruno Simon explicitly does this with Howler's playback rate: *"in real life, if you try to hit a brick twice with the same speed on the same spot, the sound triggered will never be exactly the same."* That principle stands even though Howler is the wrong tool for your case.

**Key insight:** *Tone.js for time, raw Web Audio for timbre. Don't religiously pick one — the answer is both, with strict performance budgets.*

---

## Design Principles (8)

1. **One field, one room.** All sounds — bed, hovers, clicks, scroll, keypress — route to a single shared ConvolverNode. They live in one acoustic space. Mute the bed and the interactions still sound like they belong somewhere.

2. **Every sound is a *consequence*, never an announcement.** Per Apple/Verweij: confirmation, not advertisement. The visitor's action causes the sound; the sound never originates from the system.

3. **Tune the field to the harmonic series.** A just-intonation drone (root + 3/2 + 5/4 + 7/4, or a 7-limit subset) is the bed's pitch material. Every interaction sound is also tuned to this set. No equal temperament anywhere. The brand sounds machined because the math is clean.

4. **Interaction sounds are excitations of resonators, not playback of clips.** Hover = soft noise excitation of a low-Q resonator. Click = harder impulse, higher-Q. Keypress = the mechanical thock (noise burst → bandpass → short decay → convolver). Scroll = continuous low-amplitude excitation modulated by velocity.

5. **The bed ducks; it does not pause.** A bloom briefly attenuates the bed (~3–5dB) and the bed returns over ~400ms. Visitors feel they are *displacing* a medium, not switching between layers.

6. **Asynchronous, incommensurable timing.** No musical grid the visitor can hear. Loops at irrational/prime lengths (Eno's Music for Airports method). Per Alex Bainter's analysis, Eno's three published timings re-synchronize in *"almost 27 days"* — meaning the system will not repeat inside any plausible browsing session.

7. **Silence is the most expensive material.** Restraint as a design choice, per WWDC19. If you can remove a sound and the moment still works, remove it. The rare sound earns weight by being rare.

8. **The "enable audio" moment is the first sentence of the experience.** A single, prominent, monospaced affordance — *"sound: on / off"* — placed where the visitor's eye lands. Activating it should not feel like granting permission; it should feel like *plugging in*. The first sound after activation is the bed gently rising — not a fanfare.

---

## The Big Idea (one sentence)

**"A portfolio that is not a website with sound, but a tuned resonant body — one room, one harmonic field — that the visitor excites; node 0x00 is the fundamental, every project a partial, every interaction the strike that briefly lets a single overtone ring above the field before decaying back into it."**

**Defense against the metaphor.** Your stated metaphor is *projects-as-nodes-in-a-field, 0x00-as-resonant-center, attention-as-disturbance*. The big idea makes this literal in DSP: the field is a just-intonation drone tuned to a fundamental (0x00's pitch); each project node is a modal resonator tuned to one partial of the harmonic series above that fundamental; the visitor's cursor is the exciter; the shared convolver is the room; ducking-on-bloom is the field disturbance. The visitor cannot *not* feel like the resonant center because they are literally the input to a physical-modeling synthesizer where 0x00 is the fundamental that everything else is a harmonic of. That is the metaphor encoded in the math, not pasted on top.

**Defense against the brand.** Graphite + signal-cyan + Fibonacci + firmware + deep space want *machined precision and restraint*. Just intonation removes beating between partials — the bed sounds like cleanly cut metal, not like a synth preset. Modal resonators with short, controlled decays sound *engineered*, not *cinematic*. One convolver, no HRTF, no chorus, no romantic delay — the mix is deliberately cold. The keypress is a real switch's physics. Nothing in the system is decorative. Every audible element corresponds to a structural element of the metaphor. That is "a system, not a candy shop" rendered in sound.

**Defense against beating it with something better.** Two alternatives I considered and reject:
- *"Telemetry stream / oscilloscope-as-soundtrack"* — sonifying real metrics (visitor count, geographic origin, time of day) as the bed. Rejected because it's gimmicky once decoded and doesn't bind to the metaphor; the visitor is supposed to be at the center, not one of many.
- *"Pure granular ambient with no pitched material"* — closer to Eliane Radigue / Phill Niblock. Rejected because it loses the "node-as-resonator" through-line; without pitched resonators, there is no felt center.

The resonant-body model wins because it is the *only* one of the three where the metaphor (0x00 as center) is structurally enforced by the DSP rather than merely illustrated.

---

## Open Questions for the User (before designing anything)

1. **Headphones-first or speakers-first?** A just-intonation drone with subtle granular detail dies on laptop speakers. If speakers-first, the bed needs more midrange body and the keypress thock more high-frequency click; if headphones-first, you can lean into 40–80Hz sub and subtle stereo. Which is the canonical listening context?

2. **What is the actual pitch of node 0x00?** Pick a fundamental once and never change it. Common choices: 55Hz (A1), 65.4Hz (C2), or something idiosyncratic tied to a personal number. The whole site is tuned from this. (Recommendation: pick something low enough to feel as a body and not as a melody — 50–80Hz.)

3. **How many projects (nodes)?** This determines how many resonator pitches you need from the harmonic series. 5–8 nodes works musically (you stay inside the first 8 partials, which are consonant). 12+ starts requiring less-consonant partials (11th, 13th harmonics) — interesting but harder to keep restrained.

4. **Mobile?** iOS Safari has historically had pain points with `AudioContext` autoplay, lower polyphony budgets, and battery considerations. Are you willing to ship a degraded audio experience on mobile (bed only, no interaction sounds beyond keypress equivalent), or design for mobile parity from day one?

5. **Default to sound on or off?** Per a 2016 Consumer World survey reported by the Bureau of Internet Accessibility (boia.org): *"92.3 percent of web users said that they found autoplay 'annoying,' and 76 percent of respondents said that they were likely to try to silence the sound immediately."* Best practice (Tone.js docs and the pkgpulse comparison) is also *audio off by default with a prominent enable* — the audio context starts suspended until a user gesture. Are you willing to accept that most visitors will never hear the system, in exchange for a clean first impression for everyone and no autoplay penalty? (Strongly recommended: yes.)

6. **Accessibility floor.** Will you commit to `prefers-reduced-motion` reducing audio activity (slower bed, fewer interaction sounds), a clearly labeled mute always reachable, and full visual parity (the site must communicate everything without sound)? This is a hard yes from the HIG perspective: *"Many people rely on haptics to help them interact with apps when they can't see the screen."*

7. **How long can the visitor be on a single page?** This sets the loop incommensurability budget. If the median session is 90s, you need ~3 minutes of perceptual non-repetition. If it's 6 minutes (more likely for a deep portfolio), you need ~12 minutes — which pushes you harder toward generative rather than long-loop. (Eno's three-loop method buys ~27 days before resync; you have plenty of headroom either way if you commit to incommensurable timings.)

8. **Is the keypress *thock* always the same thock, or does it model the actual switch you build firmware for?** A ZMK-fluent visitor will hear the difference between a generic mechanical click and a specifically-modeled switch (Holy Pandas vs Cherry MX Brown vs an Alps clone). Is this worth modeling specifically? (Recommendation: pick *one* switch as the canonical one and synthesize from its measured response.)

---

## Caveats and Where Sources Disagree

- **Tone.js vs raw Web Audio API.** The market is split. Plan8 (the most credible production reference) builds on top of Tone.js; OFF+BRAND (Aether 1, the deepest public teardown) uses raw Web Audio; Bruno Simon uses Howler (a playback library — wrong tool for synthesis-first work). I recommend Tone.js + raw Web Audio together, but a reasonable senior engineer could argue for raw-only on bundle-size grounds. Bundle size for Tone.js should be measured at build time against your specific imports — tree-shaking helps significantly, and I don't have a verified shipping figure to commit to here.
- **HRTF vs stereo panning.** Plan8 explicitly avoids HRTF for performance; the Web Audio spec and Tone.js docs both flag PannerNode (HRTF) as among the most expensive nodes. But for some experiences (3D scene-driven sites) HRTF is worth it. For your portfolio's 2D field, it is not.
- **Convolver vs FDN.** Anton Miselaytes (ITNEXT) and CCRMA (Stanford) both note convolver is best for static rooms; FDN is better for dynamic rooms. I default to convolver here because your "field" should feel stable, but if you want the room itself to react to the cursor, you need FDN in an AudioWorklet.
- **Eno's looping technique vs modern generative.** Eno's actual Music for Airports technique is *fixed-length tape loops at incommensurable lengths*. Modern generative (Alex Bainter's Generative.fm; Plan8's Klang generative tools) layers stochastic note triggering on top. Both work; the Eno method is simpler and more honest to the historical reference, the modern method is more variable. Either is defensible.
- **"Sound forward" wins awards — does it?** Awwwards' own collections curate sound-forward sites (awwwards.com/sound-design-for-web-experiences) and Plan8 lists numerous Awwwards/FWA wins where they did audio. But Awwwards Site of the Year 2025 (Messenger) and SOTM February 2026 (Renaissance Edition) are not primarily sound-driven. Sound earns *bonus*, but visual/interaction craft is still the floor. Don't take sound as a substitute for visual excellence — it is a multiplier on already-strong visuals.
- **The "thock" recording vs synthesis debate.** A purist would say: record your actual keyboard once at the threshold of perception with a good mic, that *is* the brand. A live-synthesis purist (which this brief leans toward) says: synthesize procedurally so there's no audio file. Both are defensible. Recommendation: synthesize, but tune the synthesis to match a real recording of your keyboard.
- **One source attribution to refine:** For Steve Reich's *It's Gonna Rain*, the technical specifics (1965, two Wollensak reel-to-reel recorders, ~17 minutes, derived from a single ~1.8-second loop) are most cleanly documented at Nonesuch Records, Wikipedia, and the Long Now Foundation's Eno profile — the Long Now profile is the source I had at hand, but the canonical primary source is Reich's own program notes.
- **Sources I could not fully verify:** A named composer for Active Theory's "The Field" project — Active Theory's regular audio partner is Plan8, but Plan8 is not publicly credited on The Field, so I cannot confirm. Similarly, Unseen Studio's "The Sea We Breathe" is tagged for sound design on Awwwards but I could not find a named sound designer in the public material. These would be worth confirming directly if you want to study the specific audio engineering choices.