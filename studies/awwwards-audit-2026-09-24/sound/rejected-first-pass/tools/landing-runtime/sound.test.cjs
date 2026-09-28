const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '../..');

// Actual engine/controller, simulated audio clock and delayed asset IO.
// These are lifecycle/node-graph checks, not an audio-thread CPU benchmark.
function fixture({ delayed = false, failed = false } = {}) {
  let time = 0, next = 0, audioContext = null, allowFetch, bad = failed;
  const timers = new Map(), nodes = [], sources = new Set(), requests = [], played = [];
  const gate = delayed ? new Promise(resolve => { allowFetch = resolve; }) : Promise.resolve();
  const param = () => ({ value: 0, setValueAtTime(v) { this.value = v; },
    linearRampToValueAtTime(v) { this.value = v; }, cancelScheduledValues() {} });
  function node(type) {
    const n = { type, gain: param(), pan: param(), connections: [],
      connect(to) { this.connections.push(to); }, disconnect() { this.connections = []; } };
    nodes.push(n); return n;
  }
  class AudioContext {
    constructor() { audioContext = this; this.state = 'suspended'; this.destination = { type: 'destination' }; }
    get currentTime() { return time / 1000; }
    resume() { this.state = 'running'; return Promise.resolve(); }
    suspend() { this.state = 'suspended'; return Promise.resolve(); }
    decodeAudioData(data) { return Promise.resolve(data); }
    createGain() { return node('gain'); }
    createStereoPanner() { return node('panner'); }
    createOscillator() { throw Error('No live synthesis permitted'); }
    createBufferSource() {
      const n = node('source');
      n.start = () => { sources.add(n); played.push(n.buffer.file); n.ends = n.loop ? Infinity : time + n.buffer.duration * 1000; };
      n.stop = () => { sources.delete(n); if (n.onended) n.onended(); };
      return n;
    }
  }
  const win = new EventTarget(), doc = new EventTarget();
  doc.hidden = false;
  win.AudioContext = AudioContext;
  const sandbox = { window: win, document: doc, console, localStorage: { getItem: () => null },
    setTimeout(fn, delay) { const id = ++next; timers.set(id, { fn, at: time + delay }); return id; },
    clearTimeout(id) { timers.delete(id); },
    requestAnimationFrame() { throw Error('Audio must not schedule frames'); },
    setInterval() { throw Error('Audio must not poll'); },
    async fetch(url) {
      requests.push(url); await gate;
      return { ok: !bad, arrayBuffer: async () => ({ file: url, duration: url.includes('room') ? 24 : .8 }) };
    },
  };
  const context = vm.createContext(sandbox);
  for (const file of ['app/data/projects.js', 'app/landing/audio/carrier-field.js', 'app/landing/audio/sound-controller.js']) {
    vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context);
  }
  const flush = async () => { for (let i = 0; i < 20; i++) await Promise.resolve(); };
  async function advance(ms) {
    time += ms;
    for (const [id, timer] of [...timers]) if (timer.at <= time) { timers.delete(id); timer.fn(); }
    for (const s of [...sources]) if (s.ends <= time) s.stop();
    await flush();
  }
  return { sound: win.MOSound, field: win.CarrierField, nodes, requests, played, sources, timers, flush, advance,
    get ctx() { return audioContext; },
    async enable() { win.MOSound.toggleMute(); await flush(); },
    release: () => allowFetch(), fail: value => { bad = value; },
    async hidden(value) { doc.hidden = value; doc.dispatchEvent(new Event('visibilitychange')); await flush(); },
  };
}

test('default off allocates no context or assets; idle has one source, two gains and no timers', async () => {
  const f = fixture();
  assert.equal(f.ctx, null); assert.equal(f.requests.length, 0);
  await f.enable();
  assert.equal(f.requests.length, 4);
  assert.deepEqual(f.nodes.map(n => n.type).sort(), ['gain', 'gain', 'source']);
  assert.equal(f.sources.size, 1); assert.equal(f.timers.size, 0);
});

test('mute during loading cannot start delayed audio; a later opt-in reuses decoded assets', async () => {
  const f = fixture({ delayed: true });
  f.sound.toggleMute(); f.sound.toggleMute();
  await f.advance(110); f.release(); await f.flush();
  assert.equal(f.sources.size, 0); assert.equal(f.ctx.state, 'suspended');
  await f.enable();
  assert.equal(f.sources.size, 1); assert.equal(f.requests.length, 4);
});

test('a quick unmute cancels pending suspension without duplicating the room', async () => {
  const f = fixture(); await f.enable();
  f.sound.toggleMute(); await f.advance(30); await f.enable(); await f.advance(200);
  assert.equal(f.ctx.state, 'running'); assert.equal(f.sources.size, 1); assert.equal(f.timers.size, 0);
});

test('hidden cancels focus, stops sources and suspends; visible resumes only if enabled', async () => {
  const f = fixture(); await f.enable(); f.sound.hover('0x01');
  await f.hidden(true); await f.advance(500);
  assert.equal(f.sources.size, 0); assert.equal(f.timers.size, 0); assert.equal(f.ctx.state, 'suspended');
  await f.hidden(false); assert.equal(f.sources.size, 1);
  f.sound.toggleMute(); await f.advance(110);
  await f.hidden(true); await f.hidden(false);
  assert.equal(f.ctx.state, 'suspended'); assert.equal(f.sources.size, 0);
});

test('focus requires dwell; open cancels focus and duplicate open cannot stack', async () => {
  const f = fixture(); await f.enable(); f.sound.hover('0x01');
  await f.advance(200); f.sound.unhover(); await f.advance(500);
  assert.equal(f.played.length, 1);
  f.sound.hover('0x01'); await f.advance(450);
  assert.match(f.played.at(-1), /focus/);
  const before = f.nodes.length;
  f.sound.open('0x01'); f.sound.open('0x01');
  assert.equal(f.nodes.length - before, 3);
  assert.equal([...f.sources].filter(s => !s.loop).length, 1);
});

test('foreground sources remain bounded and disconnect after ending', async () => {
  const f = fixture(); await f.enable();
  for (const p of [.3, .55, .8, .95]) f.sound.originProgress(p, 'origin');
  f.sound.open('0x01');
  assert.equal(f.sources.size, 5); // one room plus at most four one-shots
  await f.advance(900);
  assert.equal(f.sources.size, 1);
  assert.ok(f.nodes.filter(n => n.type === 'panner').every(n => n.connections.length === 0));
});

test('origin skips missed thresholds, does not repeat at rest or after enabling mid-assembly', async () => {
  const f = fixture();
  f.sound.originProgress(.8, 'origin'); await f.enable();
  f.sound.originProgress(.8, 'origin'); assert.equal(f.played.length, 1);
  f.sound.originProgress(.95, 'origin'); f.sound.originProgress(.95, 'origin');
  assert.equal(f.played.filter(p => /settle/.test(p)).length, 1);
  f.sound.originProgress(0, 'drift');
  assert.equal(f.sources.size, 1);
  f.sound.originProgress(1, 'origin');
  assert.equal(f.played.filter(p => /focus/.test(p)).length, 0);
  assert.equal(f.played.filter(p => /settle/.test(p)).length, 2);
});

test('registry opt-out stays silent and the new field node is accepted', async () => {
  const f = fixture(); await f.enable();
  f.sound.open('0x0B'); f.sound.open('missing');
  assert.equal(f.played.length, 1);
  f.sound.open('0x0D'); assert.equal(f.played.length, 2);
  assert.equal(f.field.ADDRS.length, 12);
});

test('asset failure restores an honest off state and can be retried; subscriptions clean up', async () => {
  const f = fixture({ failed: true }); const states = [];
  const unsubscribe = f.sound.onState(s => states.push(s));
  await f.enable();
  assert.equal(f.sound.isMuted(), true); assert.equal(states.at(-1).error, true);
  assert.equal(f.ctx.state, 'suspended');
  f.fail(false); await f.enable();
  assert.equal(states.at(-1).loading, false); assert.equal(states.at(-1).error, false);
  assert.equal(f.sources.size, 1);
  unsubscribe(); const count = states.length; f.sound.toggleMute();
  assert.equal(states.length, count);
});
