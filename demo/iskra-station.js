/* ============================================================
   M.O. SYSTEM — ISKRA · LINE SHIFT  (interactive game)  · 0x09
   ------------------------------------------------------------
   You are the volunteer on the flashing line. Boards arrive one
   by one. Read the silkscreen (or SCAN to identify), pick the
   matching firmware from the signed catalog, then FLASH it — or
   REJECT a board that doesn't belong. Score + streak. A shift is
   a deck of boards; a report ends it.

   Still faithful to src/Iskra.Core — the same two-phase driver
   runs under every FLASH:
     · SCAN (swdp_scan) gates WRONG-FAMILY boards before any
       write → E_TARGET_MISMATCH (the machine literally can't
       brick a board — that's the whole lesson).
     · But two products share the PY32 family, so picking the
       RIGHT PRODUCT for the board in front of you is on YOU —
       the scan can't catch a same-family wrong-firmware flash.

   Scoring teaches the real skill:
     correct flash      +100 · streak↑ · speed bonus
     correct reject     +70  · streak↑          (decoy caught)
     wrong-firmware     −80  · streak reset      (same family, machine can't save you)
     flashed a decoy    +15  · streak reset      (scan bailed — safe, but you should've rejected)
     false reject       −60  · streak reset      (rejected a good board — wasted a unit)
   0 boards bricked, ever.

   window.IskraStation (kept name; the station IS the game):
     start/stop/skip · startShift · selectProduct/Version ·
     scan · flash · reject · retry · next · state
   Events: boot · screen · board · reveal · line · phase ·
     progress · verdict · score · shift · state · action · history
   ============================================================ */
(function () {
  /* Signed catalog. CI-CLOP is the tactical flashlight (node 0x04);
     VENOVISOR is a separate Energy-for-Ukraine board (gets its own
     node later). Both ride the same PY32 family — which is exactly
     why the scan can't tell them apart and the operator must read
     the silkscreen and pick the right firmware. */
  const CATALOG = {
    products: [
      { id: "ci-clop", name: "CI-CLOP", role: "tactical flashlight", bmp_match: "PY32Fxxx", part: "PY32F002Ax5", flash_kb: 32,
        releases: [
          { version: "1.0.0", elf: "ci-clop_v1.0.0_PY32F002Ax5.elf", sha: "4514acf573a17487db6ccf52b9e4ef2840bf59c4d743789ee6715eaf5655f2cd", size: 6856 },
          { version: "0.1.0-dev", elf: "app.elf", sha: "4514acf573a17487db6ccf52b9e4ef2840bf59c4d743789ee6715eaf5655f2cd", size: 6840 },
        ], default: "1.0.0" },
      { id: "venovisor", name: "VENOVISOR", role: "field-medic vein finder", bmp_match: "PY32Fxxx", part: "PY32F003Ax5", flash_kb: 32,
        releases: [
          { version: "0.4.0", elf: "venovisor_v0.4.0_PY32F003Ax5.elf", sha: "9f2c1b7ad4e8556093aa17c4f0b2e9d8c5713a64ef290bb1d8c4a6f5e3d20817", size: 7912 },
        ], default: "0.4.0" },
    ],
  };
  const OPERATORS = ["O. MASLOV", "K. BONDAR", "V. TKACHENKO", "+ NEW OPERATOR"];

  /* decoy boards that must be REJECTED (wrong MCU family) */
  const DECOYS = [
    { label: "BLUEPILL", silk: "STM32F103C8", family: "STM32" },
    { label: "BLACKPILL", silk: "STM32F411CE", family: "STM32" },
    { label: "ESP-WROOM", silk: "ESP32-D0WD", family: "ESP32" },
    { label: "RP2040", silk: "RP2-B2", family: "RP2040" },
  ];

  const rnd = (a) => a[Math.floor(Math.random() * a.length)];
  const shuffle = (a) => { const x = a.slice(); for (let i = x.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [x[i], x[j]] = [x[j], x[i]]; } return x; };

  /* build a shift deck: good boards (readable + unknown) + decoys + busy ones */
  function buildDeck() {
    const deck = [];
    const good = (product, opts = {}) => {
      const p = CATALOG.products.find((x) => x.id === product);
      return Object.assign({
        id: "brd_" + Math.random().toString(36).slice(2, 7),
        kind: "good", product, name: p.name, silk: p.part, family: "PY32",
        flashable: true, unknown: false, busy: false, revealed: true,
      }, opts);
    };
    const decoy = (opts = {}) => {
      const d = rnd(DECOYS);
      return Object.assign({
        id: "brd_" + Math.random().toString(36).slice(2, 7),
        kind: "decoy", product: null, name: d.label, silk: d.silk, family: d.family,
        flashable: false, unknown: false, busy: false, revealed: true,
      }, opts);
    };
    deck.push(good("ci-clop"));
    deck.push(good("venovisor"));
    deck.push(good("ci-clop", { busy: true }));        // probe busy → retry
    deck.push(decoy());                                 // readable decoy → reject
    deck.push(good("venovisor"));
    deck.push(good("ci-clop", { unknown: true }));      // unreadable → must scan
    deck.push(decoy({ unknown: true }));                // unreadable decoy → scan then reject
    deck.push(good("ci-clop"));
    deck.push(decoy());
    deck.push(good("venovisor", { busy: true }));
    return shuffle(deck);
  }

  window.IskraStation = (function () {
    const subs = {};
    const on = (ev, cb) => ((subs[ev] = subs[ev] || []).push(cb), cb);
    const off = (ev, cb) => { subs[ev] = (subs[ev] || []).filter((f) => f !== cb); };
    const emit = (ev, d) => (subs[ev] || []).forEach((f) => f(d));

    let sound = null, runId = 0, active = false, boardArrivedAt = 0;

    const st = {
      screen: "boot",            // boot | setup | shift | report
      operator: null, batch: null,
      product: "ci-clop", version: "1.0.0",
      deck: [], idx: 0, board: null,
      score: 0, streak: 0, best: 0,
      flashed: 0, saved: 0, mistakes: 0, falseRejects: 0,
      phase: "idle", busy: false, retried: false,
      lastVerdict: null, lastAction: null,
      report: null,
    };
    const history = [];

    const action = (l) => { st.lastAction = l; emit("action", l); };
    const pushState = () => emit("state", { ...st, history: history.slice() });
    const delay = (ms) => new Promise((r) => setTimeout(r, ms));
    const productOf = (id) => CATALOG.products.find((p) => p.id === id);
    const releaseOf = (id, v) => { const p = productOf(id); return p && p.releases.find((r) => r.version === v); };
    const setSound = (s) => { sound = s; };

    function line(text, cls) { emit("line", { text, cls: cls || "" }); if (sound && cls !== "cmd") sound.scanTick(); }
    function cmd(text) { emit("line", { text: "$ " + text, cls: "cmd" }); if (sound) sound.click("soft"); }
    function clearCon() { emit("line", { text: "", cls: "clear" }); }

    /* ---------------- scoring ---------------- */
    function award(delta, why) {
      st.score = Math.max(0, st.score + delta);
      emit("score", { score: st.score, delta, why, streak: st.streak });
    }
    function speedBonus() {
      const t = performance.now() - boardArrivedAt;
      return t < 4000 ? Math.round((4000 - t) / 100) : 0;   // up to +40 for fast, clean calls
    }

    /* ---------------- the board queue ---------------- */
    function dealNext() {
      if (st.idx >= st.deck.length) { endShift(); return; }
      const b = st.deck[st.idx];
      st.board = b;
      st.phase = "idle"; st.busy = false; st.retried = false; st.lastVerdict = null;
      boardArrivedAt = performance.now();
      clearCon();
      emit("verdict", null);
      emit("board", { ...b, revealed: !b.unknown });
      if (sound) sound.click("soft");
      action("BOARD #" + String(st.idx + 1).padStart(2, "0") + " ON THE BENCH");
      pushState();
    }

    function reveal(full) {
      st.board.revealed = true;
      emit("reveal", { ...st.board });
    }

    /* ============================================================
       SCAN — safe identify (phase 1 only). Reveals family/part.
       ============================================================ */
    async function scan() {
      if (st.busy || !st.board || st.phase === "done") return;
      const id = ++runId;
      st.busy = true; st.phase = "scanning"; pushState();
      clearCon();
      cmd("monitor swdp_scan   # identify only · no flash");
      await delay(260); if (id !== runId) return;
      if (st.board.busy && !st.retried) {
        line("error: probe is busy — endpoint claimed", "err");
        line("E_PROBE_BUSY → retry in 500 ms", "warn");
        await delay(520); if (id !== runId) return;
        st.retried = true;
        line("probe freed · rescanning", "ok");
      }
      line("Target voltage: 3.3V", "dim");
      await delay(220); if (id !== runId) return;
      const target = st.board.family === "PY32" ? st.board.silk + " M0+" : st.board.silk + (st.board.family === "STM32" ? " M3" : " ??");
      line(" 1   " + target);
      reveal(true);
      await delay(160);
      if (st.board.family === "PY32") line("identified · " + st.board.silk + " · PY32 family ✓", "ok");
      else line("identified · " + st.board.silk + " · NOT a PY32 target ✕", "err");
      st.busy = false; st.phase = "idle";
      action("SCANNED · " + st.board.silk);
      if (sound) sound.click();
      pushState();
    }

    /* ============================================================
       FLASH — full two-phase. Outcome scores the player.
       ============================================================ */
    async function flash() {
      if (st.busy || !st.board || st.phase === "done") return;
      const board = st.board;
      const prod = productOf(st.product);
      const rel = releaseOf(st.product, st.version);
      const id = ++runId;
      st.busy = true; st.phase = "scanning"; st.lastVerdict = null;
      emit("verdict", null); clearCon(); pushState();
      const t0 = performance.now();

      line("══ FLASH · " + prod.name + " " + rel.version + " · board #" + String(st.idx + 1).padStart(2, "0") + " ══", "head");
      await delay(180);

      /* phase 1 — scan (with busy retry) */
      cmd("monitor swdp_scan");
      if (board.busy && !st.retried) {
        line("error: probe busy → E_PROBE_BUSY · retry 500ms", "warn");
        if (sound) sound.click();
        await delay(520); if (id !== runId) { st.busy = false; return; }
        st.retried = true;
        line("probe freed · retry", "ok");
      }
      await delay(300); if (id !== runId) { st.busy = false; return; }
      const target = board.family === "PY32" ? board.silk + " M0+" : board.silk;
      line(" 1   " + target);
      reveal(true);
      await delay(160);

      /* WRONG FAMILY → bail before flash (the safety) */
      if (board.family !== "PY32") {
        line("detected '" + board.silk + "' ✕ expected 'PY32Fxxx'", "err");
        line("E_TARGET_MISMATCH · flash NOT attempted — board safe", "err");
        return finish(id, t0, { result: "FAIL", code: "E_TARGET_MISMATCH", msg: "wrong family — scan bailed before any write", board });
      }
      line("scan clean · PY32 family", "ok");
      await delay(180);

      /* preflight sha-256 */
      st.phase = "preflight"; pushState();
      line("preflight · sha256(" + rel.elf + ") vs signed catalog", "dim");
      if (sound) sound.hashTick();
      await delay(360); if (id !== runId) { st.busy = false; return; }
      line("sha-256 OK · Ed25519 signature valid", "ok");

      /* phase 2 — flash + verify */
      st.phase = "flashing"; pushState();
      if (sound) sound.chargeStart();
      cmd("attach 1 · load · compare-sections");
      const total = rel.size;
      for (let i = 1; i <= 10; i++) {
        if (id !== runId) { st.busy = false; if (sound) sound.chargeStop(); return; }
        emit("progress", i / 10);
        if (sound) sound.chargeProgress(i / 10);
        await delay(70);
      }
      line("Transfer rate: 18 KB/sec.", "dim");
      line("Section .text: matched · Section .data: matched", "ok");
      line("Verify OK — flash == ELF.", "ok");
      if (sound) sound.chargeStop();
      await delay(160);

      /* SAME FAMILY but WRONG PRODUCT — machine can't catch it */
      const correctProduct = board.product === st.product;
      if (!correctProduct) {
        return finish(id, t0, { result: "WRONGFW", code: "WRONG FIRMWARE", msg: "flashed " + prod.name + " onto a " + board.name + " board — scan can't catch same-family", board });
      }
      return finish(id, t0, { result: "PASS", code: null, msg: prod.name + " " + rel.version + " · verify OK", board });
    }

    function reject() {
      if (st.busy || !st.board || st.phase === "done") return;
      const board = st.board;
      const t0 = boardArrivedAt;
      const good = board.flashable;
      clearCon();
      line("operator REJECT · board set aside", "dim");
      if (good) {
        line("board was a valid " + board.name + " · a good unit was wasted", "err");
        return finish(++runId, t0, { result: "FALSEREJECT", code: "FALSE REJECT", msg: "rejected a flashable " + board.name + " board", board });
      }
      line("decoy · " + board.silk + " · correctly kept off the line", "ok");
      return finish(++runId, t0, { result: "REJECT", code: null, msg: "decoy " + board.silk + " rejected", board });
    }

    /* ---------------- resolve a board ---------------- */
    function finish(id, t0, outcome) {
      if (sound) sound.chargeStop();
      const ms = Math.round(performance.now() - t0);
      st.busy = false; st.phase = "done"; st.lastVerdict = outcome;

      let delta = 0, label = "";
      if (outcome.result === "PASS") {
        const sb = speedBonus();
        st.streak += 1; st.flashed += 1;
        delta = 100 + sb + st.streak * 10;
        label = "FLASHED +" + delta + (sb ? " (speed +" + sb + ")" : "") + (st.streak > 1 ? " · ×" + st.streak : "");
        if (sound) sound.strikePass();
      } else if (outcome.result === "REJECT") {
        const sb = speedBonus();
        st.streak += 1; st.saved += 1;
        delta = 70 + sb + st.streak * 8;
        label = "DECOY CAUGHT +" + delta + (st.streak > 1 ? " · ×" + st.streak : "");
        if (sound) sound.strikePass();
      } else if (outcome.result === "WRONGFW") {
        st.streak = 0; st.mistakes += 1;
        delta = -80;
        label = "WRONG FIRMWARE −80 · read the silkscreen!";
        if (sound) sound.thudFail();
      } else if (outcome.result === "TARGET_SAVED" || outcome.code === "E_TARGET_MISMATCH") {
        st.streak = 0; st.saved += 1;
        delta = 15;
        label = "SCAN SAVED IT +15 · but you should've REJECTED";
        if (sound) sound.thudFail();
      } else if (outcome.result === "FALSEREJECT") {
        st.streak = 0; st.falseRejects += 1;
        delta = -60;
        label = "FALSE REJECT −60 · that was a good board";
        if (sound) sound.thudFail();
      }
      st.best = Math.max(st.best, st.streak);
      award(delta, label);
      action(label);
      line("RESULT · " + (outcome.code || outcome.result) + "  ·  " + label,
        (outcome.result === "PASS" || outcome.result === "REJECT") ? "pass" : "fail");
      emit("verdict", { ...outcome, delta, label, ms });

      history.unshift({
        n: history.length + 1, idx: st.idx + 1,
        board: outcome.board.name, silk: outcome.board.silk,
        action: outcome.result, code: outcome.code, delta,
        ts: new Date().toLocaleTimeString("en-GB"),
      });
      emit("history", history.slice());
      pushState();
      return outcome;
    }

    function next() {
      if (st.busy) return;
      st.idx += 1;
      if (st.idx >= st.deck.length) { endShift(); return; }
      dealNext();
    }

    /* ---------------- selection ---------------- */
    function selectProduct(id) {
      st.product = id;
      const p = productOf(id);
      st.version = p ? p.default : null;
      if (sound) sound.click("soft");
      pushState();
    }
    function selectVersion(v) { st.version = v; if (sound) sound.click("soft"); pushState(); }
    function retry() { st.retried = false; if (st.board) st.board.busy = false; action("PROBE · MANUAL RETRY"); if (sound) sound.click(); pushState(); }

    /* ---------------- shift lifecycle ---------------- */
    function startShift() {
      if (!st.operator) st.operator = OPERATORS[0];
      if (!st.batch) st.batch = "B-" + (2600 + Math.floor(Math.random() * 90));
      st.deck = buildDeck(); st.idx = 0;
      st.score = 0; st.streak = 0; st.best = 0;
      st.flashed = 0; st.saved = 0; st.mistakes = 0; st.falseRejects = 0;
      history.length = 0; emit("history", []);
      st.screen = "shift"; emit("screen", "shift");
      emit("score", { score: 0, delta: 0, why: "", streak: 0 });
      dealNext();
    }

    function endShift() {
      const total = st.deck.length;
      const correct = st.flashed + st.saved;
      const accuracy = total ? Math.round((correct / total) * 100) : 0;
      st.report = {
        score: st.score, total, flashed: st.flashed, saved: st.saved,
        mistakes: st.mistakes, falseRejects: st.falseRejects, best: st.best, accuracy,
        rank: accuracy >= 90 ? "LINE LEAD" : accuracy >= 70 ? "TRUSTED OPERATOR" : accuracy >= 50 ? "IN TRAINING" : "NEEDS A BRIEFING",
      };
      st.screen = "report"; st.phase = "idle"; st.busy = false;
      emit("screen", "report");
      if (sound) sound.lock();
      pushState();
    }

    /* ---------------- boot intro ---------------- */
    const BOOT = [
      "ИСКРA · FLASHING STATION · v1.0.0",
      "toolchain · arm-none-eabi-gdb · bundled",
      "probe · Black Magic Probe · COM7",
      "catalog · Ed25519 signature · VERIFIED",
      "mode · LINE SHIFT · operator training",
      "READY —",
    ];

    async function start(opts = {}) {
      active = true;
      const id = ++runId;
      Object.assign(st, {
        screen: "boot", phase: "idle", busy: false, board: null, deck: [], idx: 0,
        score: 0, streak: 0, best: 0, flashed: 0, saved: 0, mistakes: 0, falseRejects: 0,
        lastVerdict: null, lastAction: null, report: null,
      });
      st.operator = null; st.batch = null; st.product = "ci-clop"; st.version = "1.0.0";
      history.length = 0; emit("history", []); emit("verdict", null);
      pushState(); emit("screen", "boot");

      const scale = (opts.direction === "sandbox") ? 0.35 : 1;
      const reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) { enterSetup(); return; }
      for (let i = 0; i < BOOT.length; i++) {
        if (id !== runId || !active) return;
        emit("boot", BOOT[i]); if (sound) sound.bootTick();
        await delay(340 * scale);
      }
      if (sound) sound.bootChime();
      await delay(320 * scale);
      if (id !== runId || !active) return;
      enterSetup();
    }
    function enterSetup() { st.screen = "setup"; emit("screen", "setup"); pushState(); }
    function setOperator(op) { st.operator = op; if (sound) sound.click("soft"); pushState(); }
    function setBatch(b) { st.batch = b; pushState(); }
    function skip() { if (st.screen === "boot") enterSetup(); }
    function stop() { active = false; runId++; if (sound) sound.chargeStop(); st.phase = "idle"; st.busy = false; }

    return {
      on, off, setSound,
      get state() { return st; },
      get catalog() { return CATALOG; },
      get operators() { return OPERATORS; },
      get history() { return history.slice(); },
      start, stop, skip,
      enterSetup, setOperator, setBatch,
      startShift, selectProduct, selectVersion,
      scan, flash, reject, retry, next,
      isActive: () => active,
    };
  })();
})();
