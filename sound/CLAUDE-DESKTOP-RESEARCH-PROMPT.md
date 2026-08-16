# Claude Desktop — Two Prompts: Research, then Build a Sound System from Scratch

> Use these in order. **Prompt 1** is research only — paste it into a fresh Claude Desktop
> conversation (web search ON). Let it finish the research and report back. **Prompt 2** is
> the build — paste it into the *same* conversation once you're happy with the research.
>
> Neither prompt references any existing files, engine, or implementation. The goal is for
> Claude to **invent the whole system itself** from its own research — original architecture,
> original code. Give it the goal, the metaphor, and your brand; let it design everything else.

---

## ▌PROMPT 1 — RESEARCH (paste first)

You are a sound designer + creative technologist. This conversation is **research only —
no code, no solutions yet.** Do genuine web research with citations; don't rely on memory.
At the end you'll report a synthesis and a point of view. Then, in a later message, I'll ask
you to design and build the system. Do not jump ahead.

### The goal
I'm building a personal portfolio website aiming for **Awwwards Site of the Day / FWA /
CSSDA**-level recognition — the tier of studios like **Lusion** (lusion.co) and **Immersive
Garden** (immersive-g.com), where motion, type, and **sound** are authored as one
experience. I want a **sound system that is itself a reason the site wins** — not UI sound
effects bolted on, but audio that feels inevitable, like it was always part of the object.

### The metaphor (the soul of it)
> **"Projects are nodes. I am node `0x00` — the root, scattered everywhere across the
> universe."**

I'm the origin of a constellation; each project is a node in space connected back to me.
`0x00` is *me*: present everywhere, the fundamental that everything else relates to. A
visitor moving through the site moves through *my* universe.

A direction I want you to interrogate and push (or beat with something better that still
serves the metaphor): **the visitor's attention is a disturbance propagating through a
field.** Nothing should feel like it just "plays" — every hover, click, keypress, and
scroll should feel like it *perturbs a living medium* I'm the resonant center of. Sounds
should be **mixed into the ambient** — blooming out of it and decaying back into it — so the
visitor feels like they're disturbing my field, not triggering clips.

### Who I am (so the sound matches the brand)
- Designer/engineer in **Munich**, deep into **mechanical keyboards & firmware** (custom
  keebs, ZMK). That hardware identity matters: a keypress on my site is a real, physical
  **mechanical "thock"** — a branded, tactile confirmation.
- **Visual identity:** deep-space graphite substrate (near-black, not blue); a single
  **signal-cyan** accent used sparingly; monospaced technical labels; an editorial italic
  serif for numerals; **Fibonacci-based spacing**; hairline dividers; oscilloscope / PCB /
  telemetry motifs. Precise, restrained — "a system, not a candy shop."
- **Tone:** cold, precise, a little mysterious; engineered; confident minimalism. Silence is
  a material; restraint with rare payoff.

I want you to figure out: what does graphite + signal-cyan + Fibonacci precision + firmware
+ deep space **sound** like?

### Research these areas (web search; cite real, specific sources — name studios, people,
### articles, talks — and flag where sources disagree)
1. **Award-winning web sound design.** How sound-forward sites on **Awwwards, CSSDA, FWA,
   Webby** actually build audio: ambient beds, how interaction sounds tie into the bed,
   spatialization, the enable-audio / mute moment, generative vs. looping. Study **Lusion**
   and **Immersive Garden** specifically. Name sites and what each does well.
2. **Apple's sound design philosophy.** Interface + brand sound: sound married to **haptics
   (Taptic Engine)**, physical-object modeling, confirmation-not-announcement, restraint,
   consistency as identity, accessibility, detail at the threshold of perception. Find
   real talks/articles/HIG material. Extract principles for the **web**, where there's no
   Taptic Engine (so sound must pair with visual micro-motion).
3. **Generative & systems music.** Brian Eno's generative lineage, ambient/drone craft,
   harmonic series & just intonation, and how to keep a field alive for minutes with no
   audible loop.
4. **The craft of "disturbing a field."** Reactive mixing / **sidechain ducking**,
   convolution reverb as a *shared space*, resonator excitation (physical-modeling-lite),
   granular/textural ambient, stereo/binaural spatialization on the web.
5. **Web Audio in practice.** What's truly achievable with the **Web Audio API** (and
   Tone.js): convolver IRs, feedback delay, biquad resonators, AnalyserNode-driven visuals,
   OfflineAudioContext, voice-pooling/performance — all **synthesized live, no audio files,
   offline-capable.**

### Deliver (this message only — still no code)
- A **synthesis** of each of the five areas, with citations and the single key insight for
  each.
- **5–8 principles** I should design the system by.
- **The big idea** — one sentence naming the concept that makes this sound system mine and
  award-worthy — then defend it against the metaphor and the brand.
- **Open questions** for me before you design anything.

Be a sharp collaborator, not a yes-machine: push back on weak ideas (including mine), and
bring references I won't have thought of. Start from the goal and the metaphor, reason out
loud, then commit to a strong point of view. **No code yet.**

---

## ▌PROMPT 2 — BUILD (paste after you're happy with the research)

Now design and build the system **entirely yourself**, from your own research above. Invent
everything — the concept, the architecture, the sonic palette, the code. Do not ask me for a
spec to implement; *you* are the author. Surprise me.

### What to design
- **One sentence** restating the system's central idea, then a short **sonic identity**: the
  material/temperature of the field, the tuning system (how every node relates to `0x00` so
  nothing sounds "wrong," with atonal/textural drift allowed at the edges), the **rest-state
  behavior** (it should be able to sit near-silent and only ring when touched), how each
  interaction *disturbs* the field, the **keypress (thock) identity**, the **scroll/motion**
  model (movement through space, never a friction/rubbing noise), and the **spatial** model.
- **2–3 distinct directions** (different material/temperature on the same architecture) I can
  audition side by side, with the trade-offs of each.
- A clear **signal-flow / architecture** description showing how the bed and interactions
  share one space and how the "disturbance" (ducking / excitation) works.

### What to build
- A complete, original **Web Audio implementation** — your own API and structure, your call.
  **No audio files; synthesize everything live; offline-capable; autoplay-safe** (audio
  starts on a real user gesture, and enabling it should be a deliberate, beautiful moment).
- A **single self-contained HTML demo page** (a "sound lab") I can open directly to probe
  it: a way to switch between the 2–3 directions, surfaces to hover/click/press/scroll, the
  enable-audio moment, a master volume + mute that's remembered, and a live waveform/level
  visual. Visually match my brand (graphite + signal-cyan + mono labels + restraint).
- Keep it **accessible**: conservative loudness, never startling, always muteable.

### Non-negotiables
- Nothing should feel like a clip playing *over* the ambient — it must live *in/through* it.
- The mechanical **thock stays** (brand identity) but is unified with the field — the press
  disturbs space too.
- **Less is more.** No decorative loops, no "data slop," no gradient-soup. Silence is a
  material; the rare bloom should land hard.

Deliver the design rationale, then the full code (engine + the self-contained demo page),
ready to open in a browser. Make it something a juror would hear once and remember.

---

### Notes for you (Oleksandr — not part of the prompts)
- Paste **Prompt 1**, let it research and report. If the synthesis is thin, push it
  ("more specific, cite the actual sites/talks") before moving on.
- Then paste **Prompt 2** in the same chat so it builds on its own findings.
- When it returns a system you like, bring the demo back here and I'll fold it into the
  portfolio (wire it to the real interactions, the node positions, the shell toggle) and
  make it production-ready against the live pages.
