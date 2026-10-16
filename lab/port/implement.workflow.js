export const meta = {
  name: 'studio-port-implement',
  description: 'Implement the studio port from lab/port/design.json: core first, then four disjoint partitions in parallel, then build, measure against HEAD and fix',
  phases: [
    { title: 'Core', detail: 'studio.js, build wiring, models/wafer.glb, the two new marks' },
    { title: 'Consumers', detail: 'rig and pages, landing, explosions, lab and docs, in parallel on disjoint files' },
    { title: 'Verify', detail: 'build, check, test, before/after shots and perf against a HEAD worktree, flights, ring walk, fixes' },
  ],
}

const REPO = '/home/oleksandr/projects/Portfolio-workspace/portfolio'
const PORT = REPO + '/lab/port'
const PW = '/home/oleksandr/.npm/_npx/31e32ef8478fbf80/node_modules/playwright'

const COMMON = `
REPO: ${REPO}. AGENTS.md is the house rulebook and you already have it.
THE PLAN: ${PORT}/spec.md is the full spec and ${PORT}/design.json holds the structured design (core_api, budget, partitions[].task, verification, risks). Wherever the text says $PORT, read ${PORT}. ${PORT}/maps.md holds the mapper reports behind it, including file:line facts. lab/port-audit-codex.md is an independent audit by Codex of the Wafer migration; its 11 "Must fix" points are requirements too.
Preview server: http://127.0.0.1:8765/ is served from the repo root; do not start another server on that port. Headless browser: require('${PW}'), chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] }). SwiftShader is slow: allow 20-40 s for a scene to settle.
RULES:
- No git commit, stash, reset or checkout of tracked files.
- .github/workflows/deploy-pages.yml has a STAGED change by the owner: edit it in place, never restore or overwrite it.
- Never edit generated files (app/landing/runtime.js, app/page-runtimes/*).
- Put scratch files under ${PORT}/tmp/, never loose in the repo.
- Write code that reads like the surrounding code, at the same comment density and in the same register as AGENTS.md.

OWNER AMENDMENTS TO THE DESIGN (these override spec.md and design.json where they conflict):
A1. PCB ARTWORK STAYS IN THE EXPLOSIONS. The architect dropped it; Codex point 8 and the owner's emphasis on the explosions overrule that.
  - models/wafer.glb still carries NO KTX2 and needs no transcoder. But KEEP TEXCOORD_0 on the pcb_* primitives.
  - tools/wafer/build.mjs also writes two 1024x1024 WebP textures, models/wafer-pcb-L.webp and models/wafer-pcb-R.webp. Decode the parts' KTX2 PCB maps by rendering them in the headless capture stage and reading them back. Check that the result is not blank, and that the orientation matches the original UV mapping in a render.
  - The core exports a cached loader, MOStudio.pcbMaps(THREE) -> Promise<{ pcb_L, pcb_R }>, built on THREE.TextureLoader with sRGB and flipY = false (glTF UV convention). finish(THREE, root, url, { tier: 'parts', pcb }) puts them on soldermask(map).
  - ONLY the explosion surfaces load them (about-board buildWaferReal and demo/wafer-board.js): await MOStudio.pcbMaps(THREE) before finish(). The closed static tiers (card, hero, flight, menu) stay a bare soldermask, as the owner approved in the gallery.
  - A failed texture fetch degrades to a bare soldermask; it never throws.
  - Count the two WebPs in the board's and the PLAY DEMO's budget lines.
A2. CLONES LOSE SHADER HOOKS (Codex point 6). Wherever a consumer needs a per-object copy of a studio material (key-press emissive, x-ray, fades), build it from the presets factory, or re-apply every hook the original had (tone and grain), not tone alone. A PBT cap must keep its grain in PLAY DEMO.
A3. The models/wafer_demo.glb deletion is NOT done by the lab-docs partition. The verify phase does it, after a repo-wide grep comes back clean.
A4. The owner question about recompressing zmk-mark.glb's PNG is unanswered: the file stays sealed.
`

const PARTITION_RULES = (id) => `
YOUR JOB: implement partition "${id}" from ${PORT}/design.json (partitions[] where id == "${id}"). Read its task in full, then the spec sections it cites, then the core API as actually landed in app/projects/rendering/studio.js. Code against what is really there, not against the description.
- Edit ONLY the files listed for your partition; other agents are editing the other partitions' files at the same time. If you truly need a change outside your list, do NOT make it: put it in your report under "needs-from-others".
- Do NOT run 'npm run build' (parallel builds race on the generated files). To check your code, parse it with Babel: node -e "require('${REPO}/tools/landing-runtime/node_modules/@babel/standalone').transform(require('fs').readFileSync(F,'utf8'),{presets:['react']})", or use 'node build.cjs --check' (it reports stale, which is expected) and the npm tests your task names.
- Return a report:
  - the files changed, with a one-line summary each
  - every deviation from the task, and why
  - needs-from-others
  - what you verified, and how
  - risks the verify phase must look at`

phase('Core')
const core = await agent(`${COMMON}
YOUR JOB: implement partition "core" from ${PORT}/design.json. Read its task in full, plus the spec sections it cites and core_api, and apply amendment A1. Partition order 1: the four consumer partitions start from what you land, so the API must match core_api in design.json, plus pcbMaps. Any deviation from core_api must be stated exactly in your report: the others will read your report.
- Move code instead of rewriting it: the lab code is the approved look.
- tools/wafer/build.mjs must be re-runnable. Write down how to run it, in its header.
- Run the asserts the task lists on models/wafer.glb, and verify the frame claim (tight box equals wafer_demo's) numerically.
- You MAY run 'npm run build --prefix tools/landing-runtime' and 'npm test' at the end: nobody else is running yet.
Return the report: files, the final API as landed (exact names and signatures), deviations, the measurements, and risks.`, { label: 'core', phase: 'Core', effort: 'high' })

phase('Consumers')
const IDS = ['rig-pages', 'landing', 'explosions', 'lab-docs']
const reports = await parallel(IDS.map((id) => () => agent(`${COMMON}
CORE HAS LANDED. Its report:
${core}
${PARTITION_RULES(id)}`, { label: id, phase: 'Consumers' })))
const named = IDS.map((id, i) => `\n\n==== ${id} ====\n${reports[i] || '(this agent FAILED: its partition is unimplemented. Implement it yourself from design.json before verifying.)'}`).join('')
const failed = IDS.filter((id, i) => !reports[i])
if (failed.length) log(`partitions failed: ${failed.join(', ')}; verify will implement them`)

phase('Verify')
const verify = await agent(`${COMMON}
YOU ARE THE INTEGRATOR AND VERIFIER. Every partition is implemented. Core's report:
${core}
The partition reports follow.
${named}

Do the following, fixing anything that fails. You may edit any file now. Keep each fix minimal, and record it.
1. Resolve every "needs-from-others" item and every cross-partition mismatch.
2. Run npm run build, then check, then test, all with --prefix tools/landing-runtime. Then node lab/studio.check.mjs, node lab/story.check.mjs, node lab/motion.check.mjs and node lab/places.check.mjs. Everything must be green.
3. A3: run grep -rln wafer_demo over app demo tools *.html lab/*.js lab/*.html lab/*.mjs (historical .md files may keep the name). If it is clean, delete models/wafer_demo.glb. Otherwise fix the references first.
4. THE BEFORE BASELINE IS RE-CREATED FROM GIT. The original captures were lost.
   - git worktree add ${PORT}/tmp/before-tree HEAD.
   - Serve it with python3 -m http.server 8766 --bind 127.0.0.1, run from that directory.
   - ${PORT}/shoot.cjs and ${PORT}/perfharness/perf.cjs were written against :8765. Give them a BASE env var, without changing their default.
   - Capture BEFORE from :8766 into ${PORT}/before and ${PORT}/perf-before.json, and AFTER from :8765 into ${PORT}/after and ${PORT}/perf-after.json. Use the same states for both.
   - At the end, remove the worktree (git worktree remove --force) and stop the 8766 server.
5. COMPARE.
   - Build side-by-side contact sheets, before | after per state, at ${PORT}/compare/*.png. Look at every one yourself.
   - Diff perf-after against the budget in design.json. Every line over budget is either fixed or given a named reason.
   - The landing's NON-model pixels must be unchanged: cards, stars, void and DOF. Check with a pixel diff on regions without models.
6. FLIGHTS AND RING.
   - Landing to project page and back for Wafer, Ci-Clop and Venovisor. Capture mid-flight and the seam frame where the page hero takes over: the pose and size must not jump.
   - Walk the project ring with prev and next both ways across all 13 routes, with no page errors.
   - The Wafer explosions: the landing board at the explode stop, and Wafer.html PLAY DEMO with a key press and each view mode. Parts must separate cleanly, with USB pieces staying with their connectors and screens staying on their displays, the PCB artwork visible, and keys pressing individually.
7. GALLERY PARITY: lab/materials.html must now render from the site's studio.js with no errors and with leakCheck flat.
8. Write ${PORT}/REPORT.md for the owner, in plain prose with tables:
   - what changed, by file
   - before -> after numbers per surface against the budget
   - the contact sheets to look at, by path
   - every fix you made in this phase
   - known issues and anything left undone, stated plainly
   - the exact git add / git rm list the owner needs (CI deploys tracked files only)
Return REPORT.md's content.`, { label: 'verify', phase: 'Verify', effort: 'high' })

return { core, reports: Object.fromEntries(IDS.map((id, i) => [id, reports[i]])), verify }
