// node lab/story.check.mjs — the honesty, structure and budget checks for lab/wafer-story.html
// A banned claim is a failure. So is a number that drifts from the model, an image that is not on the list,
// a type value that is not a token, or a listener that takes the wheel.
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import zlib from "node:zlib";

const here = (f) => new URL(f, import.meta.url);
const read = (f) => fs.readFileSync(here(f), "utf8");
const html = read("./wafer-story.html"), css = read("./story.css"), js = read("./story.js"), engine = read("./wafer.js");
const { PLACES } = await import("./places.js");
let n = 0;
const ok = (cond, msg) => { assert.ok(cond, msg); n++; };

/* ---------- what a visitor can read: text nodes, alt/aria/title/meta text, and JS string literals ---------- */
const body = html.replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<style[\s\S]*?<\/style>/g, " ").replace(/<!--[\s\S]*?-->/g, " ");
const attrs = [...body.matchAll(/\b(?:alt|aria-label|title|content)="([^"]*)"/g)].map((m) => m[1]);
const text = body.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&#8239;/g, " ").replace(/&amp;/g, "&");
const strings = [...js.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "").matchAll(/(["'`])((?:\\.|(?!\1)[^\\\n])*)\1/g)].map((m) => m[2]);
const decode = (s) => s.replace(/&nbsp;/g, " ").replace(/ /g, " ");
const full = decode([text, ...attrs, ...strings].join("\n"));
let readable = full;
// the two sentences that carry a banned word only to deny it: nothing else is excused
for (const ok of ["not milled by me", "no sensors, no sleep-on-fold"]) readable = readable.split(ok).join(" ");

const BANNED = [
  [/[€£]|\$\s?\d|\d\s?\$|\b(?:eur|euros?|usd|gbp)\b|\bprice\b|\bdiscount\b/i, "a price"],
  [/\b(?:pre-?order|order|waitlist|kickstarter|backers?|back us|early access|launch(?:es|ed)?|ship(?:ping)? date|follow for updates)\b/i, "order, launch or crowdfunding language"],
  [/magsafe/i, "MagSafe"],
  [/battery life|all-day|\b\d+\s*(?:hours?|days?)\b/i, "battery life"],
  [/certified/i, "certified"],
  [/sleep-on|dock sens|state awareness|smart magnets|magnetic intelligence|wake on/i, "magnet intelligence"],
  [/\bthinnest\b|thinner than|fits in your pocket|pocketable|pocket-sized|\bwallet\b/i, "thinnest, thinner than, pocket or wallet"],
  [/\b(?:first|only)\b/i, "first or only"],
  [/\b(?:rsi|carpal|pain|posture|corrects?|prevents?|relieves?)\b/i, "a health or outcome word"],
  [/\bAI\b/, "AI"],
  [/hot-?swap|open[- ]source hardware|open hardware/i, "hot-swap or open hardware"],
  [/upstreamed|\bmerged\b|milled by me|I machined|production[- ]ready/i, "an authorship overclaim"],
  [/any steel surface|anywhere/i, "any steel surface"],
  [/\bN52\b|\bkg\b|newtons?\b|holding force/i, "magnet grade or force"],
  [/anodi[sz]ed|6061|bead[- ]blasted/i, "an unconfirmed finish"],
  [/\b(?:voyager|elytra|corne|naya|zythe|mikefive|keychron|moonlander|glove80|ergodox)\b/i, "a competitor"],
  [/\b(?:cogs|margins?|grants?|moq|lead times?|funding)\b/i, "an internal number"],
  [/\b(?:alex|founder|startup|company)\b|\b(?:we|our)\b/i, "founder voice"],
  [/hand-soldered|\bbench\b|bring-up|certification budget|waitlist/i, "an unproven process claim"],
  [/\btwo phones|\bphones? stacked|hardware files|\blive\b[^.\n]{0,20}(?:screens? on|both halves)/i, "an unanchored comparison or a 'live' photograph"],
];
for (const [re, what] of BANNED) { const m = readable.match(re); ok(!m, `banned: ${what} -> "${m && m[0]}"`); }

/* every surface the engine speaks from: the places' own words and the screens' narration hold the same line */
for (const p of PLACES) for (const t of [p.title, p.line, p.say, ...(p.screen ? Object.values(p.screen) : [])])
  for (const [re, what] of BANNED) ok(!re.test(t), `places.js ${p.id}: banned ${what} in "${t}"`);
ok(!/magsafe/i.test(engine + read("./places.js") + read("./props.js") + read("./mip.js") + read("./motion.js")), "no MagSafe anywhere in the engine's source");

/* what a visitor reads with the model absent (failed, saver, no JS): its own sentences go, so none may be left leaning on them */
let bare = body.replace(/<(span|p|div|button)\b[^>]*class="[^"]*live-only[^"]*"[^>]*>[\s\S]*?<\/\1>/g, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
ok(!/\bThat part\b|\bHere the page\b|the prototype(?:’s)? doesn’t/.test(bare), "no sentence in the model-less page leans on one that left, or denies what the prototype does");
ok(!/doesn’t do it|doesn’t do/.test(full), "no negative about what the prototype does not do with its own screens");

/* ---------- required, anchored claims ---------- */
for (const s of ["Oleksandr Maslov", "Munich", "since March 2025", "It isn’t for sale.", "Working electronics. Working firmware. Physical enclosure produced and iterated. Manufacturing validation still in progress.",
  "The device now proves the architecture.", "The case was ordered, not milled by me.", "lives in my own ZMK fork, not upstream", "That run was an iteration", "The board began from Mikoto’s MCU schematic; I rebuilt it twice.",
  "Battery runtime. Radio performance inside the aluminium case. The folded pair measured with calipers, and whether it stays shut while walking.", "Protection for keys and screens when folded.",
  "Certification of the finished device. There is none yet.", "I haven’t made one", "The real pair hasn’t been measured with calipers yet", "Measured from the model",
  "design numbers, not a specification", "Capacity is not runtime", "no sensors, no sleep-on-fold", "That part is a page trick", "Drawn, not built", "Not yet proven",
  "Aluminium case, ordered; black as photographed", "Designed by Oleksandr Maslov in Munich, since March 2025. It isn’t for sale.", "More than thirty printed cases came before the case went to CNC."])
  ok(full.includes(s), `required copy missing: ${s}`);
const sec = (id) => (html.match(new RegExp(`<section id="${id}"[\\s\\S]*?</section>`)) || [""])[0];
const tagsIn = (id) => [...sec(id).matchAll(/<span class="tag">([^<]*)<\/span>/g)].map((m) => m[1]);
for (const [id, want] of [["profile", ["FROM THE MODEL", "CAD"]], ["tent", ["CONCEPT"]], ["magnets", ["MODELLED"]], ["folded", ["MODELLED", "FROM THE MODEL"]], ["wall", ["MODELLED"]]])
  for (const t of want) ok(tagsIn(id).includes(t), `${id} needs the ${t} chip`);
ok(tagsIn("fridge").length === 0, "the fridge carries no chip");
const CHIPS = new Set(["BUILT", "FROM THE MODEL", "MODELLED", "CONCEPT", "NOT YET MEASURED", "CAD"]);   // the legend's own six
for (const [, t] of html.matchAll(/<span class="tag">([^<]*)<\/span>/g)) ok(CHIPS.has(t), `unknown chip ${t}`);
const legend = (html.match(/<ul class="legend[\s\S]*?<\/ul>/) || [""])[0];
for (const c of CHIPS) ok(legend.includes(`<span class="tag">${c}</span>`), `the legend defines ${c}`);

/* ---------- the numbers: one source ---------- */
// the placeholders ARE the engine's marks (measured in a browser at ready: 4 mm, 8 mm, 16 mm), so hydration changes nothing a reader can see
const MARKS = { thin: "4", tall: "8", fold: "16" };
for (const [key, v] of Object.entries(MARKS)) {
  const all = [...html.matchAll(new RegExp(`<span data-mark="${key}">([^<]*)</span>`, "g"))].map((m) => m[1]);
  ok(all.length >= 3 && all.every((t) => t === v), `${key}: every placeholder reads ${v}, got ${all}`);
}
ok((html.match(/data-mark="fold"/g) || []).length >= 3, "folded numbers are hydrated spans");
ok(/Thickness<\/dt><dd><span class="val"><span class="nb"><span data-mark="thin">4<\/span>–<span data-mark="tall">8<\/span>&nbsp;mm/.test(html) && /2 × 8\.1&nbsp;mm/.test(html), "spec rows carry the range and the 2 × 8.1 mm");
ok(/<h2 id="h-profile"[^>]*>[\s\S]*?<span data-mark="thin">4<\/span>–<span data-mark="tall">8<\/span>&nbsp;mm\./.test(html), "the profile headline is the marks");
ok(/<meta name="description" content="[^"]*4–8[\u00a0 ]mm depending where you measure/.test(html) && /<p class="lede[^>]*>[^<]*<span class="nb"><span data-mark="thin">4<\/span>–<span data-mark="tall">8<\/span>&nbsp;mm<\/span> depending where you measure\./.test(html), "the description and the hero quote the same range, with its anchor");
ok(!/\b(?:5|6)\s?mm|6 layers|1\.6\s?mm/.test(readable), "no thickness or layer figure that neither the model nor the CAD carries");
ok(!/\d[ ]mm\b|\d-\d+\s*mm/.test(body.replace(/<[^>]+>/g, (t) => t)), "numbers use a no-break space before mm and an en dash");
ok(js.includes("n.textContent.match") && js.includes("#marks text"), "story.js reads the numbers back from the engine's marks");

/* ---------- registry route ---------- */
const sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(here("../app/data/projects.js"), "utf8"), sandbox);
const reg = sandbox.window.MO_PROJECTS.find((p) => p.slug === "wafer");
ok(reg && reg.file, "registry has the Wafer node");
const wafer = [...html.matchAll(/<a [^>]*data-wafer[^>]*href="([^"]+)"|<a [^>]*href="([^"]+)"[^>]*data-wafer/g)].map((m) => m[1] || m[2]);
ok(wafer.length === 2 && wafer.every((h) => h === reg.file), `case-study links must equal the registry's file (${reg.file}), got ${wafer}`);
ok(html.includes('href="https://github.com/oleksandrmaslov/wafer-zmk-config"') && html.includes('href="https://blueprint.hackclub.com/projects/2800"'), "repo and journal links, as written");
ok((html.match(/rel="noopener"/g) || []).length === 2 && !/target="_blank"/.test(html), "external links open in the same tab with noopener");

/* ---------- images: the listed ones, real, cropped by CSS only ---------- */
const ALLOWED = new Set(["both-halves", "hero-in-hand", "side-profile", "journal-thin-profile", "display-detail", "magnets-steel", "assembly", "journal-cnc-sim", "journal-schematic", "journal-vbat-driver", "journal-six-layer-mistake"]);
const dims = (f) => {
  const d = fs.readFileSync(here(`../public/media/wafer/${f}.webp`)).subarray(0, 40);
  return [d.readUInt16LE(26) & 0x3fff, d.readUInt16LE(28) & 0x3fff];
};
const allImgs = [...html.matchAll(/<img\b[^>]*>/g)].map((m) => m[0]);
// below the fold a photograph is held (data-src) until the page asks for it, and has a twin in <noscript>
const imgs = allImgs.filter((t) => /both-halves|data-src=/.test(t)), twins = allImgs.filter((t) => !/both-halves|data-src=/.test(t));
ok(imgs.length === 11, `11 photographs, found ${imgs.length}`);
ok(twins.length === 10 && imgs.filter((t) => /data-src=/.test(t)).every((t) => twins.some((w) => w.includes(t.match(/data-src="([^"]+)"/)[1]))), "every held photograph has a no-JS twin");
ok(!/<img\b[^>]*\ssrc=/.test(html.replace(/<noscript>[\s\S]*?<\/noscript>/g, "").replace(/<img\b[^>]*both-halves[^>]*>/, "")), "nothing but the hero fallback loads before the live model has shown");
for (const tag of imgs) {
  const name = (tag.match(/(?:data-)?src="public\/media\/wafer\/([^"]+)\.webp"/) || [])[1];
  ok(ALLOWED.has(name), `image not on the list: ${name}`);
  const [w, h] = [+tag.match(/width="(\d+)"/)[1], +tag.match(/height="(\d+)"/)[1]];
  ok(JSON.stringify(dims(name)) === JSON.stringify([w, h]), `${name} width/height must be the file's own ${dims(name)}`);
  ok(/loading="lazy"/.test(tag) && /decoding="async"/.test(tag) && /alt="[^"]{12,}"/.test(tag), `${name}: lazy, async, real alt`);
}
ok(/aspect-ratio: 5 \/ 4[^>]*>\s*<img[^>]*magnets-steel[^>]*object-position: 50% 0/.test(html) && (html.match(/magnets-steel/g) || []).length === 2, "the fridge photograph is shown once (held, with its twin), cropped to 5 / 4 from the top");
const crop = engine.match(/ditherPhoto\("public\/media\/wafer\/magnets-steel\.webp", EMBED \? \[(\d+), (\d+), (\d+), (\d+)\]/);
ok(crop && +crop[2] + +crop[4] <= 920, "the model's screen dithers only the door above the sign (source y <= 920)");
ok(!/href="[^"]*\.webp"/.test(html + js), "no link to any original photograph");
ok(/k === N - 1 && !EMBED \?[^`]*The real photo/.test(engine), "the engine's link to the original photograph is the study's alone");
for (const [name, crop] of [["hero-in-hand", "15 / 14"], ["side-profile", "2 / 1"], ["journal-cnc-sim", "1.57 / 1"], ["journal-six-layer-mistake", "21 / 9"], ["display-detail", "3 / 4"]])
  ok(new RegExp(`aspect-ratio: ${crop.replace(/[./]/g, "\\$&")}[^>]*>\\s*<img[^>]*${name}`).test(html), `${name} crop ${crop}`);
ok(!/hand-solder|journal-bench|bare-vs-sip|classic-charger|switch-sourcing|cnc-case/.test(html), "none of the unusable journal images");

/* ---------- structure ---------- */
const sections = [...html.matchAll(/<section id="([^"]+)"[^>]*aria-labelledby="([^"]+)"/g)];
ok(sections.length === 12, `12 sections, found ${sections.length}`);
for (const [, , lab] of sections) ok(new RegExp(`id="${lab}"`).test(html), `${lab} labels its section`);
ok((html.match(/<h1\b/g) || []).length === 1, "one h1");
ok(/<html lang="en-GB">/.test(html) && /<header class="hdr">/.test(html) && /<main id="content"/.test(html) && /<footer class="foot">/.test(html), "landmarks and lang");
ok(html.indexOf('href="lab/wafer-story.html#content"') < html.indexOf("<header"), "skip link first");
ok(html.indexOf('id="hero"') < html.indexOf("<canvas") && html.indexOf("<canvas") < html.indexOf('id="split"') && (html.match(/<canvas\b/g) || []).length === 2, "the stage canvas sits after the hero in the DOM (the fridge's one-bit frame is the only other)");
ok(!/aria-live/.test(html) && (html.match(/role="status"/g) || []).length === 1, "no live region on scroll: the one status node speaks only after the visitor asks for the model");
ok(/<canvas id="stage"[^>]*role="application"[^>]*aria-describedby="stage-help"/.test(html) && /<p class="sr live-only" id="stage-help"/.test(html), "the stage is an application with its keys described, and the description leaves with the model");
ok(/#stage:not\(\.is-ready\) \{ visibility: hidden; \}/.test(css), "before the model shows, the canvas is out of the tab order and the accessibility tree");
ok(/<button id="sound"[^>]*>Sound <span class="st" aria-hidden="true">off<\/span><\/button>/.test(html) && !/id="sound"[^>]*aria-label/.test(html), "the sound toggle's name is constant: its state is aria-pressed, not a second word");
for (const id of ["split", "screens", "tent", "magnets", "folded", "wall", "fridge", "profile"]) {
  // everything a reader sees in the copy: kicker and chips, heading, lede, body, hint, buttons and their arrows, symbols counted as words.
  // Captions are labels (house register) and the touch twin of a hint is not on screen with its fine-pointer sibling.
  const words = sec(id).replace(/<noscript>[\s\S]*?<\/noscript>|<figcaption[\s\S]*?<\/figcaption>|<div class="caliper"[\s\S]*?<\/div>|<span class="(?:sr|coarse)">[^<]*<\/span>/g, " ")
    .replace(/<span data-mark="\w+">([^<]*)<\/span>/g, "$1").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").split(/\s+/).filter(Boolean).length;
  ok(words <= 55, `${id} carries ${words} words (max 55)`);
  ok((sec(id).match(/<figure\b/g) || []).length <= (id === "profile" ? 2 : 1), `${id}: too many figures`);
}
// the model's own words and controls leave with the model
ok((html.match(/live-only/g) || []).length >= 14 && /html\[data-engine="failed"\] \.hint/.test(css) && /html\[data-engine="saver"\] \.live-only/.test(css), "model-only sentences and controls are hidden when the model is not there");
for (const hint of html.matchAll(/<p class="hint[^"]*"[^>]*>/g)) ok(/live-only/.test(hint[0]) || hint[0].includes('id="hero-hint"'), `a hint outside .live-only: ${hint[0]}`);

/* ---------- head: fonts, base, boot order ---------- */
ok(html.includes('<base href="../" />'), "base href");
ok(html.includes('href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&family=Geist+Mono:wght@400;500;600&family=Instrument+Serif:ital@1&display=swap"'), "the house font request, exactly");
ok(html.includes("family=Montserrat:wght@400;500&display=swap") && !/Montserrat/.test(css), "Montserrat is requested for the engine and never used by the page");
ok(html.indexOf(`href="app/shared/styles/tokens.css"`) < html.indexOf(`href="lab/story.css"`) && html.includes(`href="lab/story.css"`), "tokens.css first");
ok(html.includes('"three": "https://unpkg.com/three@0.160.0/build/three.module.js"'), "the lab's import map");
// the sampled audio loads on the first toggle, in the order Wafer.html loads it: nothing of it is in the markup
const wh = read("./wafer.html"), AUDIO = ["generative-score.js", "sample-engine.js", "music-score.js", "sample-sound.js", "wafer-sound.js"];
ok(!/audio\/|demo\/(?:music|sample|wafer)/.test(html.replace(/<!--[\s\S]*?-->/g, "")), "no audio script in the markup");
const listed = (js.match(/const AUDIO = \[([^\]]*)\]/) || [, ""])[1].match(/[\w-]+\.js/g) || [];
ok(JSON.stringify(listed) === JSON.stringify(AUDIO) && AUDIO.every((f, i) => i === 0 || wh.indexOf(f) > wh.indexOf(AUDIO[i - 1])), "story.js loads the audio chain in the study page's order");
ok(/dataset\.stage = /.test(html) && /prefers-color-scheme: dark/.test(html), "the stage is chosen once, inline");
ok(/window\.__promote/.test(html) && /window\.__rescue/.test(html) && /setTimeout\(function \(\) \{ if \(!d\.dataset\.story\)/.test(html) && /<script type="module" src="lab\/story\.js" onerror="window\.__rescue\(\)"/.test(html), "fail-open: a story that never starts leaves a readable page");
ok(!/data\/projects\.js/.test(js), "the registry is not loaded for two hrefs the markup already carries");
ok(!/^import\b/m.test(js), "story.js imports nothing before the engine: the playhead spring is the engine's own");

/* ---------- css: tokens only, no slop ---------- */
const decls = (prop) => [...css.matchAll(new RegExp(`(?:^|[;{\\s])${prop}\\s*:([^;}]+)`, "g"))].map((m) => m[1].trim());
for (const v of decls("font")) ok(/var\(--fs-/.test(v) && /var\(--lh-/.test(v) || v === "inherit", `font shorthand must use size and leading tokens: ${v}`);
for (const v of decls("font-size")) ok(/var\(--fs-/.test(v), `font-size ${v}`);
for (const v of decls("letter-spacing")) ok(/var\(--tr-/.test(v), `letter-spacing ${v}`);
for (const v of decls("line-height")) ok(/var\(--lh-/.test(v), `line-height ${v}`);
ok(!/font-family:\s*[^;]*\b(?!var)[A-Z][a-z]+/.test(css.replace(/@font-face\s*\{[^}]*\}/g, "").replace(/var\([^)]*\)/g, "")), "no literal font family");
ok((css.match(/gradient\(/g) || []).length === 2 && /mask-image: linear-gradient\(#000 calc\(100% - 28px\), transparent\)/.test(css), "the only gradient is the phone stage's edge mask");
const bf = [...css.matchAll(/([^{}]+)\{([^{}]*backdrop-filter[^{}]*)\}/g)].map((m) => m[1].trim());
ok(bf.length > 0 && bf.every((sel) => /\.hdr/.test(sel)), "backdrop-filter belongs to the header");
ok((css.match(/var\(--ff-serif\)/g) || []).length === 2, "Instrument Serif is used exactly twice");
ok(!/scroll-snap|scroll-behavior|cursor:\s*url|@import|box-shadow:[^;]*(?:rgba|#)[^;]*\d+px\s+\d+px\s+\d+px/.test(css), "no scroll-snap, custom cursor or glow");
ok(/--paper: #f5f5f7/.test(css) && /--paper: #0a0b0d/.test(css) && /touch-action: pan-y pinch-zoom/.test(css), "palette and canvas touch-action");
ok(/#stage:focus-visible \{[^}]*outline-offset: -4px/.test(css), "the stage's focus ring sits inside its box");
ok(/\.hdr\.glass \.tagline, \.hdr\.glass \.status \{ color: var\(--ink\)/.test(css), "header text over the glass reads as ink");
ok(/html\[data-engine="loading"\] \.sweep::before \{ animation/.test(css) && !/^\.sweep::before \{[^}]*animation: (?!none)/m.test(css), "nothing animates while idle: the sweep runs only while loading");
ok(/forced-colors: active/.test(css), "a forced-colours block");
ok(!/\.plate\b|\.c-text/.test(css + html + js), "no leftover plate");

/* ---------- scroll belongs to the page ---------- */
const code = (js + css).replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
ok(!/wheel|touchmove|scroll-snap/.test(code), "no wheel or touchmove listener, no snapping");
ok((js.match(/addEventListener\("scroll"/g) || []).length === 1 && /passive: true/.test(js), "one passive scroll listener");
ok((js.match(/preventDefault/g) || []).length === 1 || (js.match(/preventDefault\(\)/g) || []).length <= 2, "preventDefault only on the page's own links and the lost context");
ok(engine.includes('if (!EMBED) canvas.addEventListener("wheel"'), "the engine leaves the wheel to the page when embedded");

/* ---------- the engine contract ---------- */
for (const s of ["const EMBED = window.WAFER_EMBED || null;", "function setInset(", "wafer:arrive", "wafer:shown", "wafer:ready", "wafer:photo", "function applyView()", "function embedKey(", "function turn(", "p.late", "EMBED ? false"])
  ok(engine.includes(s), `engine contract: ${s}`);
ok(/window\.wafer = \{[^}]*\bturn\b[^}]*\btapScreen\b[^}]*\bdrawMedia\b[^}]*\bSAFE\b[^}]*\bINSET\b/.test(engine), "the handle carries turn, tapScreen, drawMedia, SAFE and INSET");
ok(!/EMBED|WAFER_EMBED/.test(read("./wafer.html")), "lab/wafer.html needs no new markup");

/* the review's code findings stay fixed */
ok(/if \(!path \|\| !w \|\| !h \|\| lastBox === /.test(engine), "an embedded resize before the model is built does not stamp the box");
ok(/if \(p\.late && Math\.abs\(p\.y - p\.y0\) >= Math\.abs\(p\.x - p\.x0\)\) return;/.test(engine) && /if \(!p\.late\) \{ cam\.yaw\.snap/.test(engine), "a vertical touch swipe grabs nothing");
ok(/smoothstep\(0\.0, 3\.0, min\(min\(lo\.x, lo\.y\), min\(hi\.x, hi\.y\)\)\)/.test(engine) && !/: "return v;"/.test(engine), "the contact darkening ends inside its box, on the story page and the study alike (no hard diagonal on the floor)");
ok(/const sigOf = /.test(js) && /sig !== applied/.test(js), "a resize that moves neither the box nor the layout re-sends nothing");

/* ---------- budget ---------- */
const gz = (s) => zlib.gzipSync(s).length;
const g = { html: gz(html), css: gz(css), js: gz(js) };
ok(g.html + g.css + g.js <= 35 * 1024, `story code ${g.html + g.css + g.js} B gzipped (max 35 KB)`);
ok(g.js <= 8 * 1024, `story.js ${g.js} B gzipped (max 8 KB)`);
const weight = imgs.reduce((s, t) => s + fs.statSync(here(`../public/media/wafer/${t.match(/wafer\/([^"]+)"/)[1]}`)).size, 0);
ok(weight <= 1.8 * 1024 * 1024, `photographs ${weight} B`);

console.log(`story ok · ${n} checks · gzip html ${g.html} + css ${g.css} + js ${g.js} B · photographs ${(weight / 1024).toFixed(0)} KB`);
