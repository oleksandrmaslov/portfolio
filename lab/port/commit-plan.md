# Semantic split of the studio / flights working tree

Backup of the whole tree before the split: `refs/backup/studio-wip`.

## studio/models-and-flights (clean, branched from codex/audio-refresh)

Files are staged whole, or at hunk/line level from the original `git diff -U1 HEAD`
(`[h:a-b]` = hunk h, body lines a..b; `(html: x)` = the page lines classified as x).
Everything except `lab/`, the lab-only AGENTS.md paragraph and assets/{Connected,Peripheral}.svg.

1. **Add the studio, one look for every model**
   - `app/projects/rendering/studio.js` (whole)
2. **Compile the studio into every bundle as window.MOStudio**
   - `tools/landing-runtime/build.cjs` (0, 1:1-2, 2, 4, 6, 7, 8, 10, 11, 12, 13)
3. **Fit models by the studio's box**
   - `app/projects/rendering/model-viewer.jsx` (6)
4. **Build the Wafer as one GLB from its 53 part files**
   - `tools/wafer/build.mjs` (whole)
   - `tools/wafer/capture.html` (whole)
   - `tools/wafer/palettes.json` (whole)
   - `tools/wafer/panel-media.png` (whole)
   - `tools/wafer/panel-status.png` (whole)
   - `models/wafer.glb` (whole)
   - `models/wafer-pcb-L.webp` (whole)
   - `models/wafer-pcb-R.webp` (whole)
5. **Load models/wafer.glb in place of wafer_demo.glb**
   - `app/data/projects.js` (1)
   - `app/projects/data.jsx` (0)
   - `app/projects/pages/wafer-page.jsx` (5)
   - `app/projects/rendering/solid-hero-rig.jsx` (2)
   - `index.html` (2:3-3, 2:6-6)
   - `models/wafer_demo.glb` (delete)
6. **Keep lab/ and the Wafer part files out of the deploy**
   - `.github/workflows/deploy-pages.yml` (whole)
   - `AGENTS.md` (1)
7. **Replace the Ci-Clop mark with a revision that has materials**
   - `models/ci-clop-mark.glb` (whole)
   - `app/data/projects.js` (2)
   - `Ci-Clop.html` (html: ciclop)
8. **Give the Venovisor its own mark**
   - `models/venovisor-mark.glb` (whole)
   - `app/data/projects.js` (3:1-5, 3:7-10, 10)
   - `app/projects/data.jsx` (1)
   - `Venovisor.html` (html: veno)
   - `tools/landing-runtime/build.cjs` (1:4-4, 3, 5, 9)
   - `app/landing/scenes/universe.jsx` (8)
9. **Drop assignMaterial now that every GLB has materials**
   - `app/landing/scenes/universe.jsx` (0)
   - `app/projects/rendering/solid-hero-rig.jsx` (9, 11)
   - `app/projects/rendering/project-handoff-rig.jsx` (2)
   - `app/projects/pages/project-page-lifecycle.jsx` (2)
   - `app/projects/pages/standard-page.jsx` (0:1-1)
   - `app/data/projects.js` (0:4-5)
10. **Light and finish the hero rig through the studio**
   - `app/projects/rendering/solid-hero-rig.jsx` (0, 3, 4, 7, 5:14-14)
11. **Finish and light the card models through the studio**
   - `app/landing/scenes/universe.jsx` (4, 7, 9, 10, 11, 16:12-14, 27:10-11, 35)
12. **Light the menu from its own studio room**
   - `app/shared/menu-objects.js` (whole)
   - `app/shared/menu-renderer.js` (2)
   - `app/landing/scenes/universe.jsx` (3, 14, 34)
   - `app/projects/rendering/solid-hero-rig.jsx` (17, 18, 23)
13. **Assemble the PLAY DEMO board from models/wafer.glb**
   - `demo/wafer-board.js` (whole)
   - `demo/wafer-demo.js` (whole)
14. **Explode the About board from models/wafer.glb**
   - `app/landing/scenes/about-board.jsx` (whole)
15. **Stop loading KTX2Loader and RoomEnvironment**
   - `All Projects.html` (html: noktx)
   - `Brionel Catalogue.html` (html: noktx)
   - `Bulgaria 2026.html` (html: noktx)
   - `Ci-Clop.html` (html: noktx)
   - `Design System.html` (html: noktx)
   - `Iskra.html` (html: noktx)
   - `Kerfur.html` (html: noktx)
   - `Sightseeing.html` (html: noktx)
   - `Silent Depth.html` (html: noktx)
   - `Split HID Display.html` (html: noktx)
   - `Venovisor.html` (html: noktx)
   - `Wafer Studio.html` (html: noktx)
   - `Wafer.html` (html: noktx)
   - `ZMK Soft Off Plus.html` (html: noktx)
   - `ZMK-PointAccel.html` (html: noktx)
   - `app/projects/rendering/model-viewer.jsx` (0, 1, 2, 3, 4, 5)
   - `app/shared/menu-renderer.js` (0, 1)
   - `index.html` (4)
   - `tools/landing-runtime/model-decoder.test.cjs` (delete)
16. **Remove solid-materials.js**
   - `app/projects/rendering/solid-materials.js` (delete)
   - `index.html` (6:1-1)
17. **Test the studio, the shipped models and the page heroes**
   - `tools/landing-runtime/studio.test.cjs` (whole)
18. **Never step a frame by a negative delta**
   - `app/landing/scenes/board-flight.jsx` (whole)
   - `app/projects/rendering/solid-hero-rig.jsx` (15)
19. **Let the project hero sleep under PLAY DEMO**
   - `app/projects/pages/project-page-lifecycle.jsx` (7:1-3)
   - `app/projects/pages/wafer-page.jsx` (10:1-3, 15)
20. **Measure the Universe mount by its layout box**
   - `app/landing/scenes/universe.jsx` (2:1-7, 20)
21. **Fix the mirrored camera aim when a card is clicked**
   - `app/landing/scenes/universe.jsx` (18, 19, 24)
22. **Start the handoff flight as the card's own model**
   - `app/landing/scenes/universe.jsx` (16:1-3, 16:6-6, 17)
   - `app/projects/rendering/solid-hero-rig.jsx` (5:0-13, 5:15-40, 5:42-43, 8, 12, 13:1-3, 14:1-9, 14:26-27, 14:29-29, 14:32-32, 16:1-15, 19:3-20, 19:22-27, 19:29-31, 19:33-34, 20, 22:1-2)
   - `app/landing/transitions/project-handoff.jsx` (10:1-1, 10:8-36, 10:38-41)
23. **Lay out every project hero with one function**
   - `All Projects.html` (html: layout)
   - `Brionel Catalogue.html` (html: layout)
   - `Bulgaria 2026.html` (html: layout)
   - `Ci-Clop.html` (html: layout)
   - `Design System.html` (html: layout)
   - `Iskra.html` (html: layout)
   - `Kerfur.html` (html: layout)
   - `Sightseeing.html` (html: layout)
   - `Silent Depth.html` (html: layout)
   - `Split HID Display.html` (html: layout)
   - `Venovisor.html` (html: layout)
   - `Wafer Studio.html` (html: layout)
   - `Wafer.html` (html: layout)
   - `ZMK Soft Off Plus.html` (html: layout)
   - `ZMK-PointAccel.html` (html: layout)
   - `app/projects/rendering/solid-hero-rig.jsx` (1:1-17)
   - `app/data/projects.js` (0:1-2, 0:16-23, 3:6-6, 4:3-3, 5, 6, 7, 8, 9:3-3)
   - `app/projects/pages/standard-page.jsx` (0:4-4, 3, 4)
   - `app/projects/pages/wafer-page.jsx` (1)
   - `app/landing/transitions/project-handoff.jsx` (9)
24. **Add the flight engine: ease, long-way turn and settle spring**
   - `app/projects/rendering/solid-hero-rig.jsx` (1:18-66)
   - `tools/landing-runtime/flight.test.cjs` (whole)
25. **Fly the hero rig to its page layout in one gesture**
   - `app/projects/rendering/solid-hero-rig.jsx` (1:69-80, 1:112-112, 5:41-41, 13:4-7, 13:11-24, 14:19-24, 14:28-28, 16:24-29, 19:1-2, 19:21-21, 19:36-36, 22:27-27, 22:30-48, 22:85-140)
   - `app/data/projects.js` (0:8-15)
26. **Drive the forward handoff from the flight engine**
   - `app/landing/transitions/project-handoff.jsx` (0:1-32, 1:1-5, 1:8-18, 4, 10:37-37, 10:42-47, 11, 12, 13:1-7, 14, 15:8-27)
   - `app/landing/styles/base.css` (0:6-11)
   - `app/landing/scenes/universe.jsx` (32)
27. **Lift the card's model off the field and hold the camera**
   - `app/landing/transitions/project-handoff.jsx` (10:4-6, 13:8-8, 15:1-7)
   - `app/landing/scenes/universe.jsx` (2:8-8, 2:23-23, 21:1-3, 21:7-7, 23, 25, 26, 27:1-4, 33, 36:1-1)
28. **Play each model's signature beat as its page settles**
   - `app/projects/rendering/solid-hero-rig.jsx` (1:81-111, 13:8-10, 14:30-30, 14:34-34, 16:30-35, 22:141-148)
29. **Capture the handoff seam as WebP with alpha**
   - `All Projects.html` (html: seama)
   - `Brionel Catalogue.html` (html: seama)
   - `Bulgaria 2026.html` (html: seama)
   - `Ci-Clop.html` (html: seama)
   - `Design System.html` (html: seama)
   - `Iskra.html` (html: seama)
   - `Kerfur.html` (html: seama)
   - `Sightseeing.html` (html: seama)
   - `Silent Depth.html` (html: seama)
   - `Split HID Display.html` (html: seama)
   - `Venovisor.html` (html: seama)
   - `Wafer Studio.html` (html: seama)
   - `Wafer.html` (html: seama)
   - `ZMK Soft Off Plus.html` (html: seama)
   - `ZMK-PointAccel.html` (html: seama)
   - `app/projects/rendering/solid-hero-rig.jsx` (22:151-165)
   - `app/projects/rendering/project-handoff-rig.jsx` (0, 1, 3:3-12, 4)
   - `app/landing/transitions/project-handoff.jsx` (0:48-48, 0:50-50)
30. **Paint the seam on the five routes that had none**
   - `All Projects.html` (html: seamb)
   - `Brionel Catalogue.html` (html: seamb)
   - `Bulgaria 2026.html` (html: seamb)
   - `Ci-Clop.html` (html: seamb)
   - `Design System.html` (html: seamb)
   - `Iskra.html` (html: seamb)
   - `Kerfur.html` (html: seamb)
   - `Sightseeing.html` (html: seamb)
   - `Silent Depth.html` (html: seamb)
   - `Split HID Display.html` (html: seamb)
   - `Venovisor.html` (html: seamb)
   - `Wafer Studio.html` (html: seamb)
   - `Wafer.html` (html: seamb)
   - `ZMK Soft Off Plus.html` (html: seamb)
   - `ZMK-PointAccel.html` (html: seamb)
   - `app/projects/pages/standard-page.jsx` (2)
31. **Boot the page on the flight's last frame**
   - `app/projects/rendering/solid-hero-rig.jsx` (1:113-125)
   - `app/projects/pages/project-page-lifecycle.jsx` (4:1-1, 4:3-3, 5, 6, 9)
   - `app/projects/pages/wafer-page.jsx` (0, 7:1-1, 7:3-3, 8, 9, 12)
   - `app/landing/transitions/project-handoff.jsx` (0:47-47, 0:49-49, 7)
   - `app/projects/rendering/project-handoff-rig.jsx` (3:1-2)
   - `app/data/projects.js` (4:1-2, 9:1-2)
   - `app/projects/pages/standard-page.jsx` (1)
32. **Restore a page stranded by a navigation that never commits**
   - `app/shared/core.jsx` (0, 1:1-1, 1:6-10)
   - `app/landing/transitions/project-handoff.jsx` (2:1-4, 3, 8)
33. **Hand the hero back to the landing from one place**
   - `app/projects/rendering/solid-hero-rig.jsx` (1:126-203, 6, 10, 14:10-16, 16:17-23, 21, 22:3-26, 22:28-29)
   - `app/projects/pages/project-page-lifecycle.jsx` (0, 1, 3, 4:4-4, 7:5-6, 8, 10, 11)
   - `app/projects/pages/wafer-page.jsx` (2, 3, 4, 6, 7:4-4, 10:5-6, 11, 13, 14)
   - `app/projects/pages/standard-page.jsx` (5, 6)
   - `app/projects/styles/case-study.css` (whole)
   - `tools/landing-runtime/hero-restore.test.cjs` (whole)
34. **Parse a return before React and keep the page's frame lifting**
   - `index.html` (3)
   - `app/landing/app.jsx` (whole)
35. **Compute where a return docks: the reel stop or the field**
   - `app/landing/sections/work.jsx` (whole)
   - `app/landing/controllers/scroll-flight.js` (whole)
   - `app/landing/transitions/project-handoff.jsx` (2:15-28)
   - `app/landing/scenes/universe.jsx` (2:9-17, 2:22-22, 12:1-2, 28, 29, 30)
   - `app/shared/core.jsx` (2)
36. **Expose the card's live pose as the dock's target**
   - `app/landing/scenes/universe.jsx` (13, 15:1-34, 16:4-5, 16:9-10, 21:4-6, 21:8-8, 27:5-7)
37. **Dock the hero back onto its card**
   - `app/projects/rendering/solid-hero-rig.jsx` (1:67-68, 19:28-28, 19:32-32, 22:49-84)
   - `app/landing/transitions/project-handoff.jsx` (0:33-46, 0:51-61, 1:6-7, 2:7-8, 2:10-14, 2:45-46, 5, 16, 17)
   - `app/landing/styles/base.css` (0:1-5)
38. **Flash the card's frame and ripple the field on contact**
   - `app/landing/scenes/universe.jsx` (1, 22, 31, 36:2-3, 37)
   - `app/landing/components/project-preview.jsx` (whole)
   - `app/landing/styles/base.css` (1)
39. **Return to the field exactly as it was clicked**
   - `app/landing/transitions/project-handoff.jsx` (2:29-44, 6)
   - `app/landing/scenes/universe.jsx` (2:18-21, 12:3-25, 15:35-55)
40. **Give a returning node the greeting slot**
   - `app/landing/scenes/universe.jsx` (5, 6)
41. **Replay the dock when Back restores the landing from bfcache**
   - `app/shared/core.jsx` (1:2-5, 1:11-13)
   - `app/landing/transitions/project-handoff.jsx` (18)
42. **Document the studio in AGENTS.md**
   - `AGENTS.md` (2:1-6, 3, 6, 7, 8:6-9, 9)
43. **Document the Wafer build and the model packing exceptions**
   - `AGENTS.md` (10, 11)
   - `docs/model-export.md` (whole)
44. **Document the forward flight in AGENTS.md**
   - `AGENTS.md` (4:17-75, 8:1-4)
45. **Document the reverse dock in AGENTS.md**
   - `AGENTS.md` (4:1-16, 4:76-186, 5)
46. **Note the cached mount rect among the audit findings**
   - `AGENTS.md` (2:7-13)
47. **Rebuild generated runtimes and asset stamps**
   - `All Projects.html` (html: stamp)
   - `Brionel Catalogue.html` (html: stamp)
   - `Bulgaria 2026.html` (html: stamp)
   - `Ci-Clop.html` (html: stamp)
   - `Design System.html` (html: stamp)
   - `Iskra.html` (html: stamp)
   - `Kerfur.html` (html: stamp)
   - `Sightseeing.html` (html: stamp)
   - `Silent Depth.html` (html: stamp)
   - `Split HID Display.html` (html: stamp)
   - `Venovisor.html` (html: stamp)
   - `Wafer Studio.html` (html: stamp)
   - `Wafer.html` (html: stamp)
   - `ZMK Soft Off Plus.html` (html: stamp)
   - `ZMK-PointAccel.html` (html: stamp)
   - `index.html` (0, 1, 2:1-2, 2:4-5, 5, 6:2-4, 7)
   - `app/landing/runtime.js` (whole)
   - `app/page-runtimes` (whole)

## studio/lab (on top of the clean branch)

1. lab/.gitignore for the heavy screenshot and probe folders
2. the lab studies: wafer study, story page, materials gallery and its studio shim
3. lab/tools and lab/models
4. the port docs and harnesses (lab/port/*.md, *.json, *.cjs, *.py, workflow scripts, the codex audit, lab/models-*.md, lab/perf)
5. assets/Connected.svg and assets/Peripheral.svg
6. the lab-only AGENTS.md paragraph

Never committed: Ci-clop-dirty/, venovisor model/, .agents/, skills-lock.json, lab/port/tmp/, node_modules.
