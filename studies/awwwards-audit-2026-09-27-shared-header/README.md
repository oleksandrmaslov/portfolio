# Shared headers and menu opening

Implemented 27–28 September 2026. Scope: improve the existing menu opening, restore its cursor, make public-page headers consistent, and remove the landing's old Selected work / Contact shortcuts. The incumbent text-and-object composition remains the visual authority.

| Before | After | Why |
| --- | --- | --- |
| Cursor rendered beneath the native dialog | The existing cursor node moves into the dialog and returns on close | Native top-layer content sits above document z-index values |
| Separate landing, project, index and reference headers | One shared `PortfolioHeader` with one stylesheet | Same alignment, typography, menu control and navigation on all public routes |
| Landing shortcuts duplicated the menu | M.O., sound and MENU form the landing header | Keep the universe dominant and navigation unambiguous |
| Abrupt menu appearance | Right-to-left surface reveal, coordinated text and object arrival | Connect the field to its named destinations |
| No consistent navigation on small project headers | Same four native links in the full-screen dialog | Preserve direct access to work, author, contact and full index |

## Implementation

- `app/shared/navigation.jsx` owns the header, native modal, focus restoration, opening/exit timers and route-correct links. The dialog is portalled to `document.body`, outside project-page opacity/transform containers.
- `app/shared/styles/navigation.css` owns the header geometry, the existing progressive blur material and the menu. Old copies were removed from landing, project and shared layout styles.
- M.O. goes to the title on every route. The project Universe control still performs its existing reverse flight; modified clicks keep native behavior. All Projects retains the only System entry point. Design System retains its local section navigation.
- The menu surface reveals in 380ms. Text reveals use a 60ms lead-in plus 30ms row spacing; live objects settle over 420ms with the same row spacing. A temporary composited field copy is removed when the surface reveal actually ends, or immediately on cancellation (a one-second fallback covers an interrupted CSS animation). Keyboard and reduced-motion openings are immediate.
- Landing objects borrow the existing renderer. Other routes use the four genuine object renders in `public/menu/`, totaling 36,056 bytes, with CSS entrance/focus motion. This does not load another universe or add a WebGL context on a case study or the index.
- `Cursor()` owns exactly one node and one input loop. Its `mo:menu` listener lends the node to the dialog, allowing the reticle to draw above the native modal. The origin's cursor-hiding rule does not suppress it inside a live menu.
- Project Escape handlers defer while the menu is open, so closing navigation cannot trigger a reverse flight. Project hero rendering and the pointer compositor are gated while navigation is open.

## Verification

- Build/runtime identity: `f3fa1b5e5606`, 17 landing source units, 24 page-runtime phase bundles. Freshness validation covers sixteen public root pages.
- All sixteen root pages load exactly one shared navigation stylesheet and one project registry. Counts remain registry-derived: four selected works and thirteen total projects.
- Browser routes checked: landing, Wafer, Iskra, Bulgaria 2026, All Projects and Design System. These cover all three case-study compositions.
- Cursor visible inside the desktop menu; exactly one cursor node. Escape restores it to its original parent and returns focus to MENU. Wafer, Iskra and Bulgaria do not enter `hv-exit` when Escape closes the menu.
- Iskra's Contact link, activated with Enter, reaches `/#contact`. The All Projects System link reaches Design System; all seven reference-section links remain present.
- Mobile CSS viewport 390 × 844: no horizontal overflow in the landing menu or index. Reduced-motion opening reported zero animations and no temporary universe snapshot.
- No canvas is created by the All Projects menu. The landing returns to its prior canvas count once its temporary entrance copy is released.
- Final opening check: while the reveal was still clipped, the page remained visible beneath it and the temporary frame remained allocated; after completion, the clip cleared, the page was hidden and canvas count returned from three to two. Rapid open → Escape left the dialog closed, page visible, body overflow restored and focus on MENU after the fallback interval. No new browser console errors in the final check.
- `git diff --check` and generated-runtime checks pass. The detector ran once: one existing `transition: width` warning in the reticle stylesheet; that declaration was not changed by this task. No new navigation findings.

## Independent review

Initial disposition: **fix**, because the first raw CDP screenshots appeared to place the Wafer header lower than the landing header. Browser measurement found identical geometry; consistent captures confirmed the discrepancy came from the capture method at the host's 120% zoom. No CSS correction was justified.

Final bounded verdict: **ship**. Header coordinates were resolved through corrected evidence; no remaining material findings or visible regressions. The reviewer retained the native type, four genuine objects, single cursor, quiet landing header and separate Universe/System utilities. Motion was reviewed in source; still captures do not prove frame-by-frame smoothness.

## Evidence

Use the consistently captured comparison set:

- [Landing header](landing-header-confirm.png) / [Wafer header](wafer-header-confirm.png)
- [Landing menu](landing-menu-confirm.png) / [Wafer menu](wafer-menu-confirm.png)
- [Mobile menu](menu-mobile.png) / [Mobile index](index-mobile.png)
- [Measured header rectangles](header-geometry.json)

Both measured desktop viewports are 1280 × 800 CSS pixels. M.O. bounds are x33.997, y20.989, width31.719, height43.997. MENU bounds are x1191.810, y20.989, width54.193, height43.997. Both headers are 85.977px tall, and both open-menu top rows have the same y20.989 position. Mobile captures reflect host-browser resampling at 120% zoom.

Safari, physical touch devices and screen readers remain untested in this pass. The larger content and readiness findings in `DESIGN_REVIEW.md` remain open. No routes were renamed and nothing was deployed.
