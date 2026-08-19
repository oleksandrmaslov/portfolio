/* ============================================================
   M.O. SYSTEM — ISKRA 3D · LINE SHIFT  (interactive game) · 0x09
   ------------------------------------------------------------
   Same flashing-line game as the 2D demo, now physical: each board
   is a procedural 3D PCB on the bench. You ROTATE + ZOOM it to read
   the worn silkscreen (or SCAN to identify), pick the matching
   firmware, then FLASH — or REJECT a board that isn't a PY32.

   A correct FLASH closes the bare PCB up into its finished product
   (the reward · stage plays the assembly). The two-phase driver
   still makes bricking impossible; reading the board fast + right
   is the game.

   Deck holds PROCEDURAL SPECS (IskraPCB.makeSpec) — varied
   soldermask, silkscreen wear, component jitter & seed, so the same
   product never looks the same twice.

   window.IskraStation3D:
     start/stop/skip · startShift · selectProduct/Version ·
     scan · flash · reject · retry · next · state
   Events: boot · screen · board · reveal · line · phase · progress ·
     verdict · score · shift · state · action · history · assemble ·
     discard · highlight
   ============================================================ */
(function () {
  const PCB = window.IskraPCB;

  const CATALOG = {
    products: [
      { id: "ci-clop", name: "CI-CLOP", role: "tactical flashlight", part: "PY32F002Ax5", flash_kb: 20,
        releases: [
          { version: "1.0.0", elf: "ci-clop_v1.0.0_PY32F002Ax5.elf", sha: "4514acf5", size: 6856 },
          { version: "0.1.0-dev", elf: "app.elf", sha: "4514acf5", size: 6840 },
        ], default: "1.0.0" },
      { id: "venovisor", name: "VENOVISOR", role: "field-medic vein finder", part: "PY32F003Ax5", flash_kb: 32,
        releases: [
          { version: "0.4.0", elf: "venovisor_v0.4.0_PY32F003Ax5.elf", sha: "9f2c1b7a", size: 7912 },
        ], default: "0.4.0" },
    ],
  };
  const OPERATORS = ["O. MASLOV", "K. BONDAR", "V. TKACHENKO", "+ NEW OPERATOR"];

  const rnd = (a) => a[Math.floor(Math.random() * a.length)];
  const ri = (n) => Math.floor(Math.random() * n);
  const shuffle = (a) => { const x = a.slice(); for (let i = x.length - 1; i > 0; i--) { const j = ri(i + 1); [x[i], x[j]] = [x[j], x[i]]; } return x; };

  /* per-board variety knobs. wearScale comes from tweaks (difficulty). */
  function specFor(bpId, wearScale) {
    const bp = PCB.BP[bpId];
    const mask = rnd(bp.masks);
    const wearBase = 0.3 + Math.random() * 0.5;            // intrinsic per-board wear
    const wear = Math.max(0.05, Math.min(0.95, wearBase * (wearScale != null ? wearScale : 1)));
    const seed = (Math.random() * 1e9) | 0;
    const spec = PCB.makeSpec(bpId, { seed, mask, wear, wearBase, benchYaw: (Math.random() * 2 - 1) * Math.PI });
    return spec;
  }

  /* a shift deck: 3×CI-CLOP, 3×VENOVISOR, the 4 decoys, shuffled,
     with a couple of busy probes salted in. */
  function buildDeck(wearScale) {
    const entries = [];
    const mk = (bpId, opts = {}) => {
      const spec = specFor(bpId, wearScale);
      return Object.assign({
        gid: "brd_" + Math.random().toString(36).slice(2, 7),
        spec, bp: bpId,
        kind: spec.kind, product: spec.product, name: spec.name,
        silk: spec.part, part: spec.part, family: spec.family,
        flashable: spec.kind === "good",
        busy: false, revealed: false, scanned: false,
      }, opts);
    };
    ["ci-clop", "ci-clop", "ci-clop"].forEach(() => entries.push(mk("ci-clop")));
    ["venovisor", "venovisor", "venovisor"].forEach(() => entries.push(mk("venovisor")));
    PCB.decoyIds.forEach((d) => entries.push(mk(d)));
    const deck = shuffle(entries);
    // salt 2 busy probes (not the first board)
    let salted = 0;
    for (let i = 1; i < deck.length && salted < 2; i++) {
      if (Math.random() < 0.35) { deck[i].busy = true; salted++; }
    }
    return deck;
  }

  window.IskraStation3D = (function () {
    const subs = {};
    const on = (ev, cb) => ((subs[ev] = subs[ev] || []).push(cb), cb);
    const off = (ev, cb) => { subs[ev] = (subs[ev] || []).filter((f) => f !== cb); };
    const emit = (ev, d) => (subs[ev] || []).forEach((f) => f(d));

    let sound = null, runId = 0, active = false, boardArrivedAt = 0, wearScale = 1;

    const st = {
      screen: "boot",
      operator: null, batch: null,
      product: "ci-clop", version: "1.0.0",
      deck: [], idx: 0, board: null,
      score: 0, streak: 0, best: 0,
      flashed: 0, saved: 0, mistakes: 0, falseRejects: 0,
      phase: "idle", busy: false, retried: false,
      lastVerdict: null, lastAction: null, report: null,
      assembling: false,
    };
    const history = [];

    const action = (l) => { st.lastAction = l; emit("action", l); };
    const pushState = () => emit("state", { ...st, history: history.slice() });
    const delay = (ms) => new Promise((r) => setTimeout(r, ms));
    const productOf = (id) => CATALOG.products.find((p) => p.id === id);
    const releaseOf = (id, v) => { const p = productOf(id); return p && p.releases.find((r) => r.version === v); };
    const setSound = (s) => { sound = s; };
    const setWearScale = (w) => { wearScale = w; };

    function line(text, cls) { emit("line", { text, cls: cls || "" }); if (sound && cls !== "cmd") sound.scanTick(); }
    function cmd(text) { emit("line", { text: "$ " + text, cls: "cmd" }); if (sound) sound.click("soft"); }
    function clearCon() { emit("line", { text: "", cls: "clear" }); }

    function award(delta, why) {
      st.score = Math.max(0, st.score + delta);
      emit("score", { score: st.score, delta, why, streak: st.streak });
    }
    function speedBonus() {
      const t = performance.now() - boardArrivedAt;
      return t < 6000 ? Math.round((6000 - t) / 120) : 0;   // up to +50, 3D takes longer to inspect
    }

    /* ---------------- the board queue ---------------- */
    function dealNext() {
      if (st.idx >= st.deck.length) { endShift(); return; }
      const b = st.deck[st.idx];
      // re-apply current difficulty so the wear tweak affects boards still to come
      if (b.spec.wearBase != null) { b.spec.wear = Math.max(0.05, Math.min(0.95, b.spec.wearBase * wearScale)); b.spec._silkWear = b.spec.wear; }
      st.board = b;
      st.phase = "idle"; st.busy = false; st.retried = false; st.lastVerdict = null; st.assembling = false;
      boardArrivedAt = performance.now();
      clearCon();
      emit("verdict", null);
      emit("board", b);          // stage builds + deals the 3D PCB
      if (sound) sound.click("soft");
      action("BOARD #" + String(st.idx + 1).padStart(2, "0") + " ON THE BENCH · INSPECT IT");
      pushState();
    }

    function reveal() { st.board.revealed = true; st.board.scanned = true; emit("reveal", { ...st.board }); }

    /* SCAN — safe identify. Prints MCU, pulses the chip on the 3D board. */
    async function scan() {
      if (st.busy || !st.board || st.phase === "done") return;
      const id = ++runId;
      st.busy = true; st.phase = "scanning"; pushState();
      clearCon();
      cmd("monitor swdp_scan   # identify only · no flash");
      emit("highlight", { ref: "U1" });
      await delay(280); if (id !== runId) return;
      if (st.board.busy && !st.retried) {
        line("error: probe is busy — endpoint claimed", "err");
        line("E_PROBE_BUSY → retry in 500 ms", "warn");
        await delay(520); if (id !== runId) return;
        st.retried = true;
        line("probe freed · rescanning", "ok");
      }
      line("Target voltage: 3.3V", "dim");
      await delay(240); if (id !== runId) return;
      const fam = st.board.family;
      const tag = fam === "PY32" ? st.board.silk + " M0+" : st.board.silk + (fam === "STM32" ? " M3/M4" : fam === "RP2040" ? " M0+×2" : " Xtensa");
      line(" 1   " + tag);
      reveal();
      await delay(180);
      if (fam === "PY32") line("identified · " + st.board.silk + " · PY32 family ✓", "ok");
      else line("identified · " + st.board.silk + " · NOT a PY32 target ✕", "err");
      st.busy = false; st.phase = "idle";
      action("SCANNED · " + st.board.silk);
      if (sound) sound.click();
      pushState();
    }

    /* FLASH — two-phase. Outcome scores; PASS triggers assembly. */
    async function flash() {
      if (st.busy || !st.board || st.phase === "done") return;
      const board = st.board;
      const prod = productOf(st.product);
      const rel = releaseOf(st.product, st.version);
      const id = ++runId;
      st.busy = true; st.phase = "scanning"; st.lastVerdict = null;
      emit("verdict", null); clearCon(); pushState();
      const t0 = boardArrivedAt;

      line("══ FLASH · " + prod.name + " " + rel.version + " · board #" + String(st.idx + 1).padStart(2, "0") + " ══", "head");
      await delay(180);

      cmd("monitor swdp_scan");
      emit("highlight", { ref: "U1" });
      if (board.busy && !st.retried) {
        line("error: probe busy → E_PROBE_BUSY · retry 500ms", "warn");
        if (sound) sound.click();
        await delay(520); if (id !== runId) { st.busy = false; return; }
        st.retried = true;
        line("probe freed · retry", "ok");
      }
      await delay(320); if (id !== runId) { st.busy = false; return; }
      const tag = board.family === "PY32" ? board.silk + " M0+" : board.silk;
      line(" 1   " + tag);
      reveal();
      await delay(170);

      if (board.family !== "PY32") {
        line("detected '" + board.silk + "' ✕ expected 'PY32Fxxx'", "err");
        line("E_TARGET_MISMATCH · flash NOT attempted — board safe", "err");
        return finish(id, t0, { result: "FAIL", code: "E_TARGET_MISMATCH", msg: "wrong family — scan bailed", board });
      }
      line("scan clean · PY32 family", "ok");
      await delay(190);

      st.phase = "preflight"; pushState();
      line("preflight · sha256(" + rel.elf + ") vs signed catalog", "dim");
      if (sound) sound.hashTick();
      await delay(360); if (id !== runId) { st.busy = false; return; }
      line("sha-256 OK · Ed25519 signature valid", "ok");

      st.phase = "flashing"; pushState();
      if (sound) sound.chargeStart();
      cmd("attach 1 · load · compare-sections");
      for (let i = 1; i <= 10; i++) {
        if (id !== runId) { st.busy = false; if (sound) sound.chargeStop(); return; }
        emit("progress", i / 10);
        if (sound) sound.chargeProgress(i / 10);
        await delay(72);
      }
      line("Transfer rate: 18 KB/sec.", "dim");
      line("Section .text: matched · Section .data: matched", "ok");
      line("Verify OK — flash == ELF.", "ok");
      if (sound) sound.chargeStop();
      await delay(170);

      if (board.product !== st.product) {
        return finish(id, t0, { result: "WRONGFW", code: "WRONG FIRMWARE", msg: "flashed " + prod.name + " onto a " + board.name + " board", board });
      }
      return finish(id, t0, { result: "PASS", code: null, msg: prod.name + " " + rel.version + " · verify OK", board });
    }

    function reject() {
      if (st.busy || !st.board || st.phase === "done") return;
      const board = st.board;
      clearCon();
      line("operator REJECT · board set aside", "dim");
      if (board.flashable) {
        line("board was a valid " + board.name + " · a good unit was wasted", "err");
        return finish(++runId, boardArrivedAt, { result: "FALSEREJECT", code: "FALSE REJECT", msg: "rejected a flashable " + board.name, board });
      }
      line("decoy · " + board.silk + " · correctly kept off the line", "ok");
      return finish(++runId, boardArrivedAt, { result: "REJECT", code: null, msg: "decoy " + board.silk + " rejected", board });
    }

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
        st.assembling = true;
        emit("assemble", { board: outcome.board });   // ← reward animation
      } else if (outcome.result === "REJECT") {
        const sb = speedBonus();
        st.streak += 1; st.saved += 1;
        delta = 70 + sb + st.streak * 8;
        label = "DECOY CAUGHT +" + delta + (st.streak > 1 ? " · ×" + st.streak : "");
        if (sound) sound.strikePass();
        emit("discard", { board: outcome.board, good: false });
      } else if (outcome.result === "WRONGFW") {
        st.streak = 0; st.mistakes += 1; delta = -80;
        label = "WRONG FIRMWARE −80 · read the silkscreen!";
        if (sound) sound.thudFail();
        emit("reject-shake", { board: outcome.board });
      } else if (outcome.code === "E_TARGET_MISMATCH") {
        st.streak = 0; st.saved += 1; delta = 15;
        label = "SCAN SAVED IT +15 · but you should've REJECTED";
        if (sound) sound.thudFail();
        emit("reject-shake", { board: outcome.board });
      } else if (outcome.result === "FALSEREJECT") {
        st.streak = 0; st.falseRejects += 1; delta = -60;
        label = "FALSE REJECT −60 · that was a good board";
        if (sound) sound.thudFail();
        emit("discard", { board: outcome.board, good: true });
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

    function selectProduct(id) {
      st.product = id;
      const p = productOf(id);
      st.version = p ? p.default : null;
      if (sound) sound.click("soft");
      pushState();
    }
    function selectVersion(v) { st.version = v; if (sound) sound.click("soft"); pushState(); }
    function retry() { st.retried = false; if (st.board) st.board.busy = false; action("PROBE · MANUAL RETRY"); if (sound) sound.click(); pushState(); }

    function startShift() {
      if (!st.operator) st.operator = OPERATORS[0];
      if (!st.batch) st.batch = "B-" + (2600 + ri(90));
      st.deck = buildDeck(wearScale); st.idx = 0;
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

    const BOOT = [
      "ИСКРA · FLASHING STATION · v1.0.0 · 3D BENCH",
      "toolchain · arm-none-eabi-gdb · bundled",
      "probe · Black Magic Probe · COM7",
      "catalog · Ed25519 signature · VERIFIED",
      "mode · LINE SHIFT · operator training",
      "bench optics · online —",
      "READY —",
    ];

    async function start(opts = {}) {
      active = true;
      const id = ++runId;
      Object.assign(st, {
        screen: "boot", phase: "idle", busy: false, board: null, deck: [], idx: 0,
        score: 0, streak: 0, best: 0, flashed: 0, saved: 0, mistakes: 0, falseRejects: 0,
        lastVerdict: null, lastAction: null, report: null, assembling: false,
      });
      st.operator = null; st.batch = null; st.product = "ci-clop"; st.version = "1.0.0";
      history.length = 0; emit("history", []); emit("verdict", null);
      pushState(); emit("screen", "boot");

      const reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) { enterSetup(); return; }
      for (let i = 0; i < BOOT.length; i++) {
        if (id !== runId || !active) return;
        emit("boot", BOOT[i]); if (sound) sound.bootTick();
        await delay(300);
      }
      if (sound) sound.bootChime();
      await delay(300);
      if (id !== runId || !active) return;
      enterSetup();
    }
    function enterSetup() { st.screen = "setup"; emit("screen", "setup"); pushState(); }
    function setOperator(op) { st.operator = op; if (sound) sound.click("soft"); pushState(); }
    function setBatch(b) { st.batch = b; pushState(); }
    function skip() { if (st.screen === "boot") enterSetup(); }
    function stop() { active = false; runId++; if (sound) sound.chargeStop(); st.phase = "idle"; st.busy = false; }

    return {
      on, off, setSound, setWearScale,
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
