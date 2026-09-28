# Menu objects and transitions — 27 September 2026

The owner's direction: keep the clearer full-screen text menu, place small models opposite its four destinations, connect their motion to the universe metaphor, and fix the `0x00` hover. This is an extension of the incumbent design, not a new visual concept. No separate PRODUCT.md, DESIGN.md or approved comp exists for this narrow follow-up.

## Result

| Destination | Object and response |
| --- | --- |
| Selected work | The existing Wafer GLB, with a readable menu pose and a small opening tilt on focus. |
| About me | The same sampled `0x00` coordinates used by the universe. Particles assemble on entrance; hover preserves the strokes while a light sweep and shallow depth flex pass through them. |
| Contact | The existing board SW1 component, with one brief actuator press on pointer entry. |
| All projects | The other three featured GLBs, separating into an ordered row on focus. |

Native text remains the primary navigation. Models are decorative and hidden from the accessibility tree. The four labels and their descriptions remain legible without model loading. The models are aligned to their individual rows; no graphic stage precedes the menu.

Entrance uses a 180ms dialog fade, a short staggered text reveal and a 520ms object arrival. Pointer selection keeps the selected label while the others recede over 180ms, followed by a 220ms arrival crossfade where the browser supports View Transitions. All Projects follows its public URL after the menu exit without stacking another flight. Keyboard and reduced-motion activations follow their native links immediately. Escape cancels a pending departure.

The initial hover re-scattered the origin particles and made `0x00` unreadable. The corrected effect keeps X/Y strokes anchored after entrance and follows eased focus, so leaving and re-entering reverses smoothly. A separate QA finding concerned a View Transition DOM-update timeout: waiting for requestAnimationFrame inside the snapshot callback could stall. The final implementation uses a synchronous React commit instead.

## Resource ownership

`app/landing/scenes/menu-objects.js` borrows the universe's existing renderer and canvas while the native modal is open. It uses the existing universe frame loop, skips the background field/composer, and renders at most 30 frames per second while moving. It stops when motion settles. The board renderer is also gated while the menu is open.

GLBs load on the first menu opening through the shared model cache. Materials are private clones; cached GLB geometry and textures are not disposed by the menu. Generated particle and switch resources are explicitly disposed. Canvas placement, dimensions, pixel ratio, clear color, tone mapping and exposure restore on close. There is no second WebGL context for the menu.

## Verification

- Generated build: `a9b99ca6900c`, 16 landing source units. Runtime freshness and `git diff --check` passed.
- Selected work, About me, Contact and All projects reached their intended destinations in the real in-app browser.
- Keyboard activation remained immediate. Escape restored focus to MENU and cancelled a selection before its departure timer committed.
- Reduced-motion emulation showed no menu/text entrance animations; activation remained immediate.
- Canvas count stayed at two across the first menu opening. Closing returned the borrowed canvas to `universe__mount`.
- Final idle sample: renderer frame counter stayed at 21301 over 1.2 seconds. This verifies sleeping behavior, not an FPS or battery benchmark on physical devices.
- Desktop 1280 × 800 and mobile 390 × 844 CSS viewports had no horizontal overflow. All four rows and footer remained available.
- After the synchronous transition fix, Work and Contact completed without new console errors. At the one-second Contact check the hash was `#contact`, the dialog was closed, body overflow was restored, the transition class had cleared and the canvas was back in the universe mount.
- Mechanical detector ran once against the menu implementation and returned no findings.

## Independent finish review

Disposition: **ship**. No material fixes were requested. The reviewer accepted the incumbent visual world and owner's brief as authority, preserved the large native type and small opposite objects, and found the readable `0x00` response and shared-renderer lifecycle appropriate. Temporal smoothness was source-reviewed; still images alone cannot establish it. The review covers this menu, not overall Awwwards submission readiness.

## Captures and limits

- [Desktop, with About hover](desktop.png)
- [Mobile](mobile.png)

The host browser was at 120% zoom. Desktop was captured using the browser's viewport clip; the mobile screenshot reflects the host's resampling. These are local QA captures, not device photographs. Temporary viewport, cache and reduced-motion overrides were reset after verification.

Physical-device performance, Safari and screen-reader testing remain unverified. Other content, accessibility and startup-resilience findings in the repository's `DESIGN_REVIEW.md` remain open. Owner acceptance of the motion and visual finish remains a subjective next check.
