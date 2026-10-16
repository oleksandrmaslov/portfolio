export const meta = {
  name: 'flight-bold-pass',
  description: 'Bold pass on both flights: a guaranteed showcase turn, banking, an arc, anticipation, a background reaction and a stronger dock; exact restore of the field view on return; then verify, critique and tune',
  phases: [
    { title: 'Build', detail: 'bold motion for both directions plus exact field-view restore' },
    { title: 'Review', detail: 'correctness verifier and motion critic in parallel' },
    { title: 'Tune', detail: 'apply critique and failures, re-verify' },
  ],
}
const REPO = '/home/oleksandr/projects/Portfolio-workspace/portfolio'
const PORT = REPO + '/lab/port'
const PW = '/home/oleksandr/.npm/_npx/31e32ef8478fbf80/node_modules/playwright'
const PREV = '/home/oleksandr/.claude/projects/-home-oleksandr-projects-Portfolio-workspace-portfolio/efafab3d-f8ac-4a5d-a8f0-767030c5b050/subagents/workflows/wf_63e1325f-d8a/journal.jsonl'
const COMMON = `
REPO: ${REPO}. AGENTS.md is the house rulebook. Read its handoff, Universe and lifecycle sections.
STATE (uncommitted): the site-wide studio look (app/projects/rendering/studio.js = window.MOStudio) is in place, the three landing bugs are fixed, and the previous run has just built:
- a ONE-GESTURE forward flight: the flight lands directly on the page hero's final layout through moHeroLayout, and the shared engine is moFlight (turn, spring, flyTo, settle)
- a magnetic-DOCK reverse flight: the page hands over its pose in mo_node_back; there is a live __mo_universe.cardTarget(addr), the reel stop via moReelStopY, the greeting slot, parking, a fallback ladder and a bfcache replay
That run's agent reports are the "result" lines in ${PREV} (read them: the forward report, then the reverse report). The reverse protocol is in ${PORT}/reverse-flight-design.md. Read git diff HEAD on app/landing/transitions/project-handoff.jsx, app/projects/rendering/solid-hero-rig.jsx, project-handoff-rig.jsx, app/projects/pages/*.jsx, app/landing/scenes/universe.jsx, app/landing/sections/work.jsx (or wherever moReelStopY lives) and index.html.
Probes: ${PORT}/tmp/flight/ (forward-probe.cjs, reverse-probe2.cjs), ${PORT}/tmp/bugs/ and ${PORT}/ring-browser.cjs. Run them with GPU=1: headless Chrome on the Intel Iris Xe through ANGLE. SwiftShader is too slow for motion work.
Server: http://127.0.0.1:8765/; never start another server on that port. Playwright is at ${PW}, with executablePath /usr/bin/google-chrome. Put scratch files in ${PORT}/tmp/.
No git commit, stash, reset or checkout of tracked files. Never hand-edit generated files: rebuild with npm run build --prefix tools/landing-runtime.
Lifecycle (AGENTS.md): every effect is one-shot or sleeps; nothing runs off screen, under the menu or in a hidden tab; reduced motion shows end states only. Performance: no new shader programs, no new permanent loops, and nothing per frame after the flight settles.`

const BOLD = `
THE OWNER'S BRIEF. They tested the one-gesture flight and said: "now it looks really generic and as there almost no spin i does not look that dynamic and smooth, I want it look bold and wow making, and we are pretty close to it".
The cause of "almost no spin": the turn solver takes the SHORT way to the hero yaw. The card creeps at 0.15 rad/s, so on about two thirds of clicks the short way is under 120 degrees.
Keep everything that is already right: one gesture, landing exactly on the final layout, size rising monotonically (no grow-after-spin), zero residual at the seam, the first-frame match, no luma dip from the seam on, back-navigation safety, and the camera not moving on click.
Aim: Awwwards-level, bold but controlled. Motion with intent, physical, one memorable gesture per transition.

FORWARD (card -> page):
1. A SHOWCASE TURN on EVERY click. Always go the LONG way round to the hero yaw: |turn| = 360 degrees minus the short delta, so the turn is guaranteed to fall in [180, 360] degrees, averaging about 270. It still lands exactly on the hero pose. Keep a per-project override in handoffPose. Peak angular velocity falls at mid-travel, where the edge-on moment passes fastest.
2. ANTICIPATION. The wind-up (about 140 ms) adds a small counter-rotation, about 6-10 degrees OPPOSITE to the coming turn, plus the existing lift and tilt. It is the classic wind-up.
3. BANKING. The model rolls into its travel the way an aircraft banks: roll proportional to the lateral screen velocity, at most about 12-18 degrees, and back to exactly 0 at the seam.
4. AN ARC, not a straight line. The path curves (a lateral or vertical bow with a slight approach toward the camera). The projected size must still rise monotonically, with no shrink after growth: that was the owner's complaint.
5. TIMING. Travel of about 1300 ms on a stronger in-out curve, with a fast middle and long, soft ends (for example cubic-bezier(0.83, 0, 0.17, 1); tune it). The settle overshoot and the signature beat stay.
6. THE BACKGROUND REACTS. As the model lifts, the Universe dims and softly defocuses, so the model separates from it. Use the cheapest mechanism that fits the budget: the existing landing-exit, DOF or composer path, or an opacity ramp. The camera does NOT move.
7. OPTIONAL: a soft whoosh at peak speed through the existing window.MOSound and sample bank, but ONLY if a fitting sample already exists. Add no assets and no second audio engine.

REVERSE (page -> card) DOCK, made bolder:
- Wind-up on the page with a counter-rotation.
- Decisive travel along an arc with banking, and a turn of about 150-240 degrees (long way if needed), landing exactly on the card's live pose.
- The magnetic snap: a visible but tight overshoot (at most 2% scale and 1 degree).
- On contact: the teal frame flash, PLUS a single ripple through the field at the card's position, through the existing shared pointer ripple (window.__mo_disturb or its equivalent; find it). It is one-shot.
- Two shortfalls the reverse build itself reported. Fix both:
  (a) It only reaches a 60-120 degree turn by SETTING the hidden card model's creep angle. Remove that trick: the long-way turn rule makes it unnecessary, and the card's own creep must stay untouched.
  (b) On a normal load, click to hand-over takes 3.0-3.8 s against a 2.8 s target. The extra time is mostly the landing booting under the page's last frame. Bring it to 2.8 s or less: start the navigation sooner, overlap the page wind-up with the load, and keep the seam bridge, so the visitor never waits on a still frame.

EXACT FIELD-VIEW RESTORE, owner-approved, replacing the greeting slot as the FIRST choice for field returns:
- At the forward click on a FIELD tile, save a small snapshot to sessionStorage as mo_node_view: the camera position, quaternion and fov plus its drift and velocity state, every tile's position and rotation, each card model's yaw, the mode, scrollY, the viewport size, a timestamp and the addr.
- On a return whose origin is the field, with a fresh snapshot (younger than 30 minutes and the same viewport aspect within 5%), restore it exactly at mount, before the first frame, so the card is where the visitor clicked it. The dock lands on it.
- The greeting slot stays as the fallback: no snapshot, a stale one, or the card off screen in the restored view.
- driftHome() stays the only definition of a free-drift POSITION. The restore is a snapshot of state, not a second formula; say so in AGENTS.md.
- Reel returns keep moReelStopY. bfcache keeps its frozen-state replay.`

phase('Build')
const build = await agent(`${COMMON}
${BOLD}
EXECUTE NOW, using tools. YOUR JOB: implement the bold pass for BOTH directions, plus the exact field-view restore, on the existing shared engine (moFlight). Do not fork it.
- Update the probes:
  - forward-probe.cjs checks that the turn is in [180, 360] on EVERY run, that roll is 0 at the seam, that size rises monotonically, and every existing criterion
  - reverse-probe2.cjs checks the dock's turn, overshoot, flash and ripple (one-shot), and a field return through the snapshot landing within 1% of where the card was clicked
  - add view-restore cases: a fresh snapshot, a stale snapshot falling back to the greeting slot, and a resized viewport falling back
- Run them for every featured project (MO_FEATURED_ADDRS) plus Ci-Clop and Venovisor, from the reel and from the field, and for all the reverse situations in ${PORT}/reverse-flight-design.md section 4.
- Rebuild, run npm run check and npm test (both with --prefix tools/landing-runtime), re-run the old probes and the ring walk, and update AGENTS.md's handoff section.
Return:
- the files changed
- beat by beat, what each flight now does, with the timings
- the turn per run
- the probe output
- any deviations from the brief, and why`, { label: 'bold-build', phase: 'Build', effort: 'high' })

phase('Review')
const [verify, critic] = await parallel([
  () => agent(`${COMMON}
${BOLD}
EXECUTE NOW, using tools. You are the INDEPENDENT CORRECTNESS VERIFIER of both flights after the bold pass. Assume they are broken until you prove otherwise.
The build report:
${build}
- Re-run every probe (${PORT}/tmp/flight/*, ${PORT}/tmp/bugs/*) and the ring walk. Then run your own adversarial cases:
  - a rapid double click on a card
  - clicking a card mid-drift
  - "<- UNIVERSE" during the page's settle or signature beat
  - Back immediately after arrival
  - resizing during a flight
  - a hidden tab mid-flight
  - the menu opened right after a dock
  - every featured card returning in sequence
  - a field return after 31 minutes (the stale snapshot)
  - a field return in a resized window
  - reduced motion
  - a phone viewport
- Check the lifecycle: count rAF callbacks after the beat or the dock; there must be none. Check for leaks over 10 round trips (renderer.info and JS heap), and check the shader program count against the studio budget.
- Do NOT fix anything. Report.
Return:
- a pass/fail table
- every failure, with a repro and the root cause (file:line)`, { label: 'verify', phase: 'Review', effort: 'high' }),
  () => agent(`${COMMON}
${BOLD}
EXECUTE NOW, using tools. You are the MOTION CRITIC, READ-ONLY on the repo. You care about how it FEELS, at Awwwards level. The owner's last verdict was "generic" and "not that dynamic and smooth"; the goal is bold and wow, with control.
The build report:
${build}
- Record both flights at 60 fps (GPU=1, CDP screencast across the navigation) for Wafer, Ci-Clop, Iskra and Venovisor, from the reel and from the field. Plot per-frame curves for screen position, size, yaw, roll, pitch and angular velocity as PNG charts under ${PORT}/tmp/critic2/.
- Make contact sheets at ${PORT}/compare/bold-forward.png and ${PORT}/compare/bold-reverse.png, about 12 frames each. LOOK at them and at the curves.
- Judge:
  - Is it bold and dynamic, but still ONE gesture?
  - Is the anticipation readable?
  - Is the banking natural?
  - Does the arc help rather than wander?
  - Does the peak speed hide the edge-on moment?
  - Do the settle and the beat land with weight?
  - Does the dock snap magnetically, with the flash and ripple on contact?
  - Is there anything busy, wobbly, hitchy or generic?
Return concrete tuning: exact numbers (durations, curve control points, turn amounts, counter-rotation, bank gain and limit, arc amplitude, wind-up, overshoot, spring stiffness and damping, background dim and defocus timing), each with the reason, ranked by impact. Only changes that keep every acceptance number.`, { label: 'critic', phase: 'Review', effort: 'high' }),
])

phase('Tune')
const tune = await agent(`${COMMON}
${BOLD}
EXECUTE NOW, using tools. YOUR JOB: make both flights correct and bold.
The verifier's report:
${verify}
The motion critic's tuning list:
${critic}
1. Fix every verifier failure at its root.
2. Apply the critic's tuning, highest impact first. Where a suggestion conflicts with an acceptance number or the brief, skip it and say why.
3. Re-run every probe, the ring walk, npm run build, npm run check and npm test. Everything must be green.
4. Re-record ${PORT}/compare/bold-forward.png and bold-reverse.png and LOOK at them.
5. Update the memory note ~/.claude/projects/-home-oleksandr-projects-Portfolio-workspace-portfolio/memory/flight-spin-is-choreography.md with the final choreography numbers, in 3 to 6 lines.
Return a plain-prose report for the owner:
- what each flight now does, beat by beat, with the timings
- how the field view is remembered and restored
- the numbers, as a table
- the sheets to look at
- the decisions taken by default
- anything still imperfect`, { label: 'tune', phase: 'Tune', effort: 'high' })

return { build, verify, critic, tune }
