export const meta = {
  name: 'studio-port-finish',
  description: 'Finish the studio port: judge every before/after sheet, re-measure, fix regressions, independent code review, then the owner report',
  phases: [
    { title: 'Finish', detail: 'remeasure, judge sheets, fix regressions' },
    { title: 'Review', detail: 'independent correctness review of the whole diff' },
    { title: 'Fix', detail: 'apply confirmed review findings, rerun checks, write REPORT.md' },
  ],
}
const REPO = '/home/oleksandr/projects/Portfolio-workspace/portfolio'
const PORT = REPO + '/lab/port'
const PW = '/home/oleksandr/.npm/_npx/31e32ef8478fbf80/node_modules/playwright'
const COMMON = `
REPO: ${REPO}. AGENTS.md is the house rulebook. This is the last stage of porting the lab "studio" model look (PBR Neutral tone, studio PMREM, material presets, hardware finishes) to the whole public site.
- Plan: ${PORT}/spec.md and ${PORT}/design.json (with $PORT meaning ${PORT}). Its "budget" field is the performance budget.
- Owner amendments to the design:
  - A1: the explosions keep the PCB artwork via models/wafer-pcb-*.webp.
  - A2: copies of studio materials keep their shader hooks (MOStudio.copy).
  - A4: models/zmk-mark.glb stays sealed.
- Where things stand:
  - Every partition is implemented. npm run build, check and test (51 of 51) are green, and the lab checks pass. models/wafer_demo.glb is deleted.
  - ${PORT}/before and ${PORT}/after hold the screenshots. ${PORT}/perf-before.json and ${PORT}/perf-after.json hold the perf runs. ${PORT}/compare/*.png holds 39 side-by-side sheets.
  - Harnesses: ${PORT}/shoot.cjs and ${PORT}/perfharness/perf.cjs both take a BASE env var. ${PORT}/perfharness/perf-compare.py, ring-browser.cjs, landing-probe.cjs and demo-probe/ also exist.
  - The worktree ${PORT}/tmp/before-tree is still registered.
- Preview server: http://127.0.0.1:8765/ (do not start another on that port). Headless: require('${PW}'), chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] }).
- RULES: no git commit, stash, reset or checkout of tracked files. .github/workflows/deploy-pages.yml carries a staged owner change: edit it in place only. After editing any source, rerun npm run build --prefix tools/landing-runtime and never hand-edit generated files. Put scratch files in ${PORT}/tmp/.`

phase('Finish')
const finish = await agent(`${COMMON}
YOUR JOB: finish verification and fix real regressions. Run these steps in order.
1. Re-capture the landing-title perf state into perf-after.json. The last sample was bad: 0 contexts and 11 failed JS requests. Diagnose why that run failed, so the number is real.
2. Pixel-diff the landing's NON-model regions, before against after: cards, stars, void, depth of field. They must be unchanged, apart from SwiftShader noise. Report the numbers.
3. Open and LOOK AT every sheet in ${PORT}/compare/ yourself (Read the PNGs). For each one, write one line: OK, or the regression you see.
   - Pay special attention to Kerfur and the node proxy (too dark?), the menu objects, the Ci-Clop and Venovisor heroes, the Wafer flight seam, and the two explosions (parts separate cleanly, USB pieces stay with their connectors, screens stay on their displays, PCB artwork visible, keys press).
   - Compare against the gallery look the owner approved at http://127.0.0.1:8765/lab/materials.html.
3b. MENU CONTRAST (owner-reported, a must-fix). The owner says the 3D objects in the navigation menu now have low contrast. Their screenshot is ${PORT}/owner-menu-lowcontrast.png; Read it.
   - What it shows:
     - the Wafer split keyboard is dark grey on the near-black menu
     - the Wafer Studio "W" reads as dark brown or black, where it should be chrome
     - the output-switch body and the Ci-Clop are dim
   - Cause: app/shared/menu-objects.js and app/shared/menu-renderer.js now light the menu exactly like the Universe field: the FIELD_ROOM studio env at 128 plus AmbientLight FIELD_AMBIENT, with no key and no rim. The old menu was bright and edge-lit: HemisphereLight 2.2, a key DirectionalLight 3.4 at (-200,450,800), a teal 0x00f0c8 rim 1.8 at (400,100,-200), ACES 1.25 and envMapIntensity 1.6. The menu is a different presentation from the field: small thumbnails through an orthographic front camera, on near-black, with no card behind them.
   - Goal: every menu object reads clearly at thumbnail size, its silhouette separated from the background. Keep the studio materials and the Neutral tone, because consistency is the point; do not go back to ACES. Do not clip the red switch cap or Iskra's yellow.
   - Levers, simplest first:
     - a key plus a rim directional light in the menu scene (a constant light count). The rim may be the site's signal teal, as before, or the rig's cool white 0xdfe8ff: try both, and pick what reads best.
     - a per-menu exposure lift through MOStudio.tone(m, MOStudio.exposure(ev))
     - a brighter room for the menu, for the metals especially
     Put the menu's numbers in studio.js next to FIELD_AMBIENT (one source), and keep the change minimal.
   - Prove it: for each menu object, measure the mean luma of the object against the background, and the 95th-percentile luma (edge highlights), for HEAD's menu (the before-tree), the current menu and your tuned menu. Every object must be at least as legible as HEAD's. Make a before | now | tuned sheet at ${PORT}/compare/menu-contrast.png and LOOK at it.
   - Then check that the Universe field cards for Wafer and Wafer Studio are not suffering the same: compare them with HEAD and with the gallery's field panels. Report, and fix only if they clearly regressed.
4. Run the ring walk (both directions, all 13 routes) and save a pass/fail log at ${PORT}/ring.log.
5. Fix every real regression you find, at its root, with the smallest change. Rebuild, rerun npm test, and re-shoot the affected states.
6. Remove the before worktree: git worktree remove --force ${PORT}/tmp/before-tree, then git worktree prune.
7. Diff perf-after against design.json's budget. List every surface over budget, and fix it or name the reason.
Return:
- the per-sheet verdict list
- the non-model diff numbers
- the ring result
- the perf table, before -> after -> budget
- every fix you made (file and why)
- whatever is still open`, { label: 'finish', phase: 'Finish', effort: 'high' })

phase('Review')
const REVIEW = { type: 'object', properties: { findings: { type: 'array', items: { type: 'object', properties: {
  file: { type: 'string' }, line: { type: 'integer' }, severity: { type: 'string', enum: ['high', 'medium', 'low'] },
  summary: { type: 'string' }, scenario: { type: 'string', description: 'concrete inputs/state -> wrong result' }, fix: { type: 'string' } },
  required: ['file', 'severity', 'summary', 'scenario', 'fix'] } } }, required: ['findings'] }
const review = await agent(`${COMMON}
YOU ARE AN INDEPENDENT REVIEWER. Review the whole port diff for CORRECTNESS: git diff HEAD, plus the new untracked files app/projects/rendering/studio.js, tools/wafer/* and tools/landing-runtime/studio.test.cjs.
Priorities, in order:
- resource ownership and disposal: shared or memoised geometry, loader textures, and the studio env target are never freed while another surface uses them, and nothing leaks across a page lifecycle or a bfcache restore
- per-model tone and exposure being correct on every surface, with no double tone mapping
- the card-to-hero seam pose and size for Wafer, Ci-Clop and Venovisor
- the AGENTS.md lifecycle: loops sleep off screen, under the menu and in hidden tabs
- explosion parts reparented with attach(), with no lost transforms
- clones keeping their shader hooks
- registry alignment between app/data/projects.js and app/projects/data.jsx
- dead code left behind
- AGENTS.md now matching the code
Only report what you have verified by reading the code, and run something where you can. No style nits. Findings from the finisher's work are in scope too. The finisher reported:
${finish}`, { label: 'review', phase: 'Review', schema: REVIEW, effort: 'high' })

phase('Fix')
const report = await agent(`${COMMON}
The finisher's report:
${finish}

The independent review's findings, as JSON:
${JSON.stringify(review)}

YOUR JOB:
1. For each finding, confirm it by reading the code. Fix it if it is real; if it is not, record why.
2. Rebuild, then rerun npm run check, npm test and the four lab checks (node lab/studio.check.mjs, story.check.mjs, motion.check.mjs, places.check.mjs). Re-shoot any state your fixes touch.
3. Write ${PORT}/REPORT.md for the owner, in plain prose with tables:
   - what changed, by file
   - before -> after numbers per surface against the budget, and anything over budget with its reason
   - the sheets worth looking at, by path, including any look decision the owner should make (Kerfur, the menu, LED intensity)
   - fixes from this stage
   - known issues
   - the exact git add / git rm commands needed for deploy. CI ships tracked files only; exclude Ci-clop-dirty/, "venovisor model/", .agents/ and skills-lock.json.
   - the one open owner question: zmk-mark.glb's PNG recompress
4. Update the memory note ~/.claude/projects/-home-oleksandr-projects-Portfolio-workspace-portfolio/memory/model-retouch-plan.md with the outcome, in 3 to 5 lines.
Return REPORT.md's content.`, { label: 'fix-report', phase: 'Fix', effort: 'high' })

return { report }
