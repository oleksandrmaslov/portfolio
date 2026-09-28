# Sound and navigation direction

Original source audit and early proposal, 24 September 2026. **The sonic proposal below is superseded by [SOUND_RESEARCH.md](SOUND_RESEARCH.md).** The owner rejected the first noise-heavy sketch on 25 September; its live implementation was reverted. Preserve the universe, author-as-origin metaphor, existing routes, models and project handoffs. The original-engine findings below remain useful; they are not evidence that the rejected replacement sounded good.

## What the current sound is doing

The problem is the number of competing musical and interaction layers, not a lack of synthesis features.

- `app/landing/audio/carrier-field.js` builds a bass/chorus carrier, sheen, four doubled pad voices, modulation oscillators and a cursor probe. An instrumented execution of the existing engine with mocked Web Audio nodes counted **21 persistent oscillators** (including modulation oscillators), and **77 audio nodes** immediately after enable. Some are quiet or inaudible control signals; this count is not a claim about perceived loudness or CPU percentage.
- The actual melody scheduler is a **54-BPM, 16-step motif**, with a low pulse and evolving bell choices. This contradicts the introductory comment describing the replacement of the melody with five independent long-period voices. Tune the implementation, not those comments.
- `MOSound.open('0x01')` invokes a node strike and a carrier accent. The same instrumented check created **44 nodes, including 11 oscillators and one noise-buffer source**, for one open action. Hover can add another sustained three-oscillator voice.
- Wheel and document scroll both feed `scrollTrickle`. They share a 55ms throttle, so they are not an automatic doubling of every sound, but ordinary scrolling still authorizes frequent one/two-note grains.
- `app/landing/controllers/scroll-flight.js` adds a separate looping noise wind and sub oscillator. Their gains connect directly to `ctx.destination`, outside the main mixer/compressor. They read the mute/volume state separately. This is a split control path, not proof that mute is currently broken.
- The carrier also runs a render-frame parameter/analyser loop; the sound toggle draws an animated SVG waveform while enabled; origin scoring polls every 240ms. Once enabled then muted, the carrier visualizer uses a 250ms sleep poll and the melody/chord timers continue checking state. The context itself is suspended on mute, so it is incorrect to describe muted DSP as continuously running.
- Ripples have several independent triggers: node hover/click, idle attention, section changes, and flight boundaries. `score.js` also triggers visual disturbance outside its audio-enabled guard. Audio direction and visual choreography need separate ownership.

These are source/graph findings. The owner's reported slowdown still needs an audio-on/audio-off comparison on the same real device. No FPS, battery or audio-thread CPU improvement has been measured in this pass.

## Proposed sound identity

**The universe is made from traces of objects Oleksandr has worked on. Origin gathers those traces back into one physical source.**

Use a small, edited family of real material sounds: a Wafer key or enclosure contact, a device switch, a connector seating. Treat these as possible recording subjects, not a claim that clean samples already exist. The working archive contains 19 MP4s with audio tracks; those tracks need listening and selection before any portion becomes a site asset. The deployed video derivatives are deliberately silent and should stay that way.

A sample acquires character through the source, cut, envelope and placement. Replacing every synth beep with a sampled click would preserve the current overactivity. Use the same recognizable transient in a few deliberately different perspectives: distant/soft around a project, close/dry at origin, a short material resonance on opening. Avoid arbitrary per-click pitch randomness and assigning every project a different musical note just because it has an address.

Confirmed preference: a very quiet continuous atmosphere, referencing THE FINALS and Valorant's style, without a scary, abandoned or overly cosmic mood. Research and actual listening references must guide the next pass; the first attempt did not establish that direction.

| Situation | Proposed behavior |
| --- | --- |
| Sound enabled | One restrained physical contact, short decay; no startup performance |
| Moving the pointer, flying, scrolling | Silent by default; remove the wind, cursor probe and repeated scroll notes |
| Deliberate project focus | Optionally one soft cue after a dwell; crossing cards quickly stays silent; do not retrigger until focus changes |
| Opening a project | One compact object-like sound that belongs to the focus cue; no simultaneous bass accent and multiple bells |
| 0x00 assembly | The signature moment: a few distant fragments become one close source as the particles gather. Spatial focus provides the change; a rising scale and growing loudness are unnecessary |
| Reading or contact | Let the tail finish and leave room for the page |

Start with an 18–25 second listening sketch showing idle, focus, opening and origin. Judge it independently of the visuals, then with the sequence. A short real recording transformed with restraint is more relevant than a larger generative engine. Do not judge uniqueness by how complicated the graph is.

## Runtime direction

- Retain the existing public `MOSound` interaction surface while replacing its internals. Preserve stable project addresses and the universe opt-out; do not move data into page-local overrides.
- Decode a small sample bank once after opt-in, then reuse its buffers for short one-shot sources. Bake the signature's complex processing into the asset rather than run a permanent pad, convolution room and feedback system for every interaction. [AudioBufferSourceNode](https://developer.mozilla.org/en-US/docs/Web/API/AudioBufferSourceNode)
- Start with at most four simultaneous foreground sources and explicit event priorities. Opening supersedes focus; a section event must not create a second version of the same cue. Bound the origin sequence separately and cancel its pending events on leaving.
- Send every audible path through one master. Remove the flight controller's independent output path. Separate visual ripples from sound playback; minimize those to deliberate interactions and the origin reveal.
- Keep default-off behavior. Fade and suspend on mute/hidden page, cancel scheduling rather than poll, and resume only when the user's enabled state permits it. [AudioContext.suspend](https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/suspend)
- A static sound state indicator is sufficient. If metering is retained, update it at a low visual rate only while visible. Audio must not create a second permanent scene-render loop.
- Compare identical idle, pointer travel, rapid scroll, repeated focus/open, mute/unmute and hidden-tab scenarios before/after. Measure CPU/frame time and node lifetimes; audition at matched perceived level on headphones and laptop speakers. Peak amplitude alone is not a listening-quality test.

## Menu and project structure

The current 240px bordered floating menu reads as a contextual popup. Replace it with navigation composed into the existing mobile frame: full available width, a prominent Work entry, quieter About and Contact, and All Projects as the secondary route. Keep the universe visible behind it with a simple scrim. Use spacing and type hierarchy rather than another box, decorative controls or new effects. Preserve keyboard focus, Escape and selection closing.

For project discovery, add one reversible **Arrange projects / Return to drift** action. The same universe objects move to stable, front-facing positions; names and short descriptions become easy to scan. Group around the actual work: devices/firmware, tools, interfaces/studies, with the four selected projects given clear priority. This grouping is a proposed editorial arrangement, not new metadata silently assigned to the registry.

Implement it through the existing tile-target and camera systems, not a second renderer. While arranged, free flight and drift should stop competing with selection. Small screens need a short ordered sequence rather than twelve tiny simultaneous tiles. Keep All Projects as the complete conventional index; Silent Depth remains excluded from the universe and available through its route/index/ring.

Order: settle and audition sound; replace the sound runtime; refine mobile navigation; then build and user-test the arranged universe view. The latter two should not delay the first sound sketch.
