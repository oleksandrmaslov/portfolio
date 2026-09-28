const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const score = require('../../app/landing/audio/generative-score.js');

const source = fs.readFileSync(path.join(__dirname, '../../app/landing/audio/sample-engine.js'), 'utf8');
const deferred = () => {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
};

// Exercise the real engine with controlled downloads, decoding, and context
// transitions. No browser, audio playback, network, or wall-clock timers.
function harness(t) {
  const requests = [], decodes = [], intervals = new Map(), timeouts = new Map();
  let timerId = 0, contextCount = 0, gains = 0, panners = 0;
  const sources = [];
  const parameter = () => ({ value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, cancelAndHoldAtTime() {}, cancelScheduledValues() {} });
  const audioNode = () => ({
    gain: parameter(), threshold: parameter(), knee: parameter(), ratio: parameter(),
    attack: parameter(), release: parameter(), connect() {}, disconnect() {},
    getFloatTimeDomainData(data) { data.fill(0); }
  });
  class Context {
    constructor() { contextCount++; this.state = 'suspended'; this.currentTime = 0; this.destination = {}; }
    createGain() { gains++; return audioNode(); }
    createStereoPanner() { panners++; return {...audioNode(), pan:parameter()}; }
    createBufferSource() { const source={...audioNode(), playbackRate:parameter(), start() {}, stop() {}};sources.push(source);return source; }
    createDynamicsCompressor() { return audioNode(); }
    createAnalyser() { return audioNode(); }
    addEventListener(type, listener) { if (type === 'statechange') this.onStateChange = listener; }
    transition(state) { this.state = state; this.onStateChange?.(); }
    resume() { this.transition('running'); return Promise.resolve(); }
    suspend() { this.transition('suspended'); return Promise.resolve(); }
    close() { this.transition('closed'); return Promise.resolve(); }
    decodeAudioData() { const result = deferred(); decodes.push(result); return result.promise; }
  }
  const mockDocument = { currentScript: { src: 'http://sound.test/engine.js' }, hidden: false, addEventListener() {}, removeEventListener() {} };
  const mockWindow = { AudioContext: Context, addEventListener() {}, removeEventListener() {} };
  const manifest = { directions: Object.fromEntries(Object.keys(score.PROFILES).map(id => [id, {
    file: `${id}.mp3`, entries: [{kind:'marimba',note:65,offset:0,duration:1}], masterGain: 1
  }])) };
  vm.runInNewContext(source, {
    window: mockWindow, document: mockDocument, MOStudyScore: score, URL, AbortController, Float32Array, performance,
    setInterval(fn) { const id = ++timerId; intervals.set(id, fn); return id; },
    clearInterval(id) { intervals.delete(id); },
    setTimeout(fn) { const id = ++timerId; timeouts.set(id, fn); return id; },
    clearTimeout(id) { timeouts.delete(id); },
    async fetch(url, { signal }) {
      if (url.pathname.endsWith('/instruments.json')) return { ok: true, json: async () => manifest };
      const bytes = deferred();
      requests.push({ direction: path.basename(url.pathname, '.mp3'), signal, bytes });
      // Deliberately permit completion after abort: epoch guards must reject
      // stale work even when a response/decode is already in progress.
      return { ok: true, arrayBuffer: () => bytes.promise };
    }
  });
  const engine = new mockWindow.MOGenerativeField({direction:'workshop'});
  t.after(() => engine.destroy());
  return {
    engine, requests, decodes, intervals, timeouts, sources, get gains(){return gains;}, get panners(){return panners;}, get contextCount() { return contextCount; },
    download(index) { requests[index].bytes.resolve(new ArrayBuffer(8)); },
    decode(index) { decodes[index].resolve({ length: 32, numberOfChannels: 1 }); }
  };
}

async function until(predicate) {
  for (let i = 0; i < 20; i++) {
    if (predicate()) return;
    await Promise.resolve();
  }
  assert.ok(predicate(), 'expected asynchronous lifecycle stage was reached');
}

test('interruption during instrument loading stays stopped and can be restarted', async t => {
  const h = harness(t), e = h.engine;
  const starting = e.start();
  await until(() => h.requests.length === 1);
  e.context.transition('suspended');
  h.download(0);
  await until(() => h.decodes.length === 1);
  h.decode(0);
  await starting;
  assert.equal(e.running, false);
  assert.equal(e.intent, false);
  assert.equal(e.loading, false);
  assert.equal(e.context.state, 'suspended');
  assert.equal(h.intervals.size, 0);
  assert.match(e.stateText, /start|retry|continue/i);

  await e.start();
  assert.equal(e.running, true);
  assert.equal(e.context.state, 'running');
  assert.equal(h.intervals.size, 1);
  assert.equal(h.requests.length, 1, 'restart reuses the decoded bank');
});

for (const stage of ['download', 'decode']) {
  test(`cancelling a pending ${stage} cannot restart sound or install its bank`, async t => {
    const h = harness(t), e = h.engine;
    const starting = e.start();
    await until(() => h.requests.length === 1);
    if (stage === 'decode') {
      h.download(0);
      await until(() => h.decodes.length === 1);
    }
    e.stop(true);
    assert.equal(h.requests[0].signal.aborted, true);
    if (stage === 'download') h.download(0); else h.decode(0);
    await starting;
    assert.equal(e.running, false);
    assert.equal(e.intent, false);
    assert.equal(e.loading, false);
    assert.equal(e.bank, null);
    assert.equal(e.context.state, 'suspended');
    assert.equal(h.intervals.size, 0);
    assert.equal(e.stateText, 'Sound is off');
  });
}

test('rapid palette switches retain only the last bank and one scheduler', async t => {
  const h = harness(t), e = h.engine;
  const first = e.start();
  await until(() => h.requests.length === 1);
  h.download(0);
  await until(() => h.decodes.length === 1);
  const second = e.setDirection('signal');
  await until(() => h.requests.length === 2);
  const last = e.setDirection('presence');
  await until(() => h.requests.length === 3);
  assert.deepEqual(h.requests.map(r => r.direction), ['workshop', 'signal', 'presence']);
  assert.equal(h.requests[0].signal.aborted, true);
  assert.equal(h.requests[1].signal.aborted, true);
  h.download(2);
  await until(() => h.decodes.length === 2);
  h.decode(1);
  await last;
  h.decode(0);
  h.download(1);
  await Promise.all([first, second]);
  assert.equal(e.direction, 'presence');
  assert.equal(e.bank.direction, 'presence');
  assert.equal(e.score.id, 'presence');
  assert.equal(e.running, true);
  assert.equal(e.intent, true);
  assert.equal(e.loading, false);
  assert.equal(h.contextCount, 1);
  assert.equal(h.intervals.size, 1);
  assert.equal(h.timeouts.size, 0);
});


test('180 sequential notes reuse one envelope/panner pair and keep one-shot sources', async t => {
  const h=harness(t),e=h.engine;const starting=e.start();
  await until(()=>h.requests.length===1);h.download(0);
  await until(()=>h.decodes.length===1);h.decode(0);await starting;
  const gainCount=h.gains,panCount=h.panners,sourceCount=h.sources.length;
  for(let i=0;i<180;i++){
    e.voice({kind:'marimba',note:65,gain:.1,duration:.2,pan:.2},i*.5);
    h.sources.at(-1).onended();
  }
  assert.equal(h.sources.length-sourceCount,180);
  assert.equal(h.gains-gainCount,1);assert.equal(h.panners-panCount,1);
  assert.equal(e.voices.size,0);assert.equal(e.freeVoices.length,1);
  assert.equal(e.bank.noteCache.size,1);
});

test('voice pool remains bounded and stale completion cannot release a reused slot', async t => {
  const h=harness(t),e=h.engine;const starting=e.start();
  await until(()=>h.requests.length===1);h.download(0);
  await until(()=>h.decodes.length===1);h.decode(0);await starting;
  const note={kind:'marimba',note:65,gain:.1,duration:.2,pan:0};
  for(let i=0;i<25;i++)e.voice(note,0);
  assert.equal(e.voices.size,24);assert.equal(e.dropped,1);
  const oldEnded=h.sources[0].onended;
  oldEnded();e.voice(note,1);oldEnded();
  assert.equal(e.voices.size,24);assert.equal(e.allocatedVoices,24);
  e.stop(true);assert.equal(e.voices.size,0);assert.equal(e.freeVoices.length,24);
});

test('meter polling does not publish React control state on every scheduler tick', async t => {
  const h=harness(t),e=h.engine;const starting=e.start();
  await until(()=>h.requests.length===1);h.download(0);
  await until(()=>h.decodes.length===1);h.decode(0);await starting;
  let changes=0;e.onState(()=>changes++);const initial=changes;
  for(let i=0;i<20;i++){e.context.currentTime+=.15;e.tick();}
  assert.equal(changes,initial);
  e.stop(true);assert.ok(changes>initial);
});
