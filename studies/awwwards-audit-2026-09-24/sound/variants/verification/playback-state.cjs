// Bounded loading-race regression checks. DOM/audio are mocked: this verifies
// playback intent, not browser codecs, actual seeking, or audible output.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../study.js'), 'utf8');

function fixture() {
  class Element {
    constructor() { this.events = {}; this.attrs = {}; this.style = {}; this.dataset = {}; this.value = '100'; this.textContent = ''; }
    addEventListener(name, fn) { (this.events[name] ??= []).push(fn); }
    emit(name, event = {}) { for (const fn of this.events[name] || []) fn(event); }
    setAttribute(name, value) { this.attrs[name] = value; }
    getAttribute(name) { return this.attrs[name] ?? null; }
    removeAttribute(name) { delete this.attrs[name]; }
    querySelector() { return { textContent: this.dataset.id }; }
  }
  const ids = ['audio', 'play', 'play-icon', 'play-label', 'track-title', 'key', 'description', 'wave', 'wave-base', 'wave-active', 'seek', 'clock', 'played-width', 'playhead', 'download', 'status', 'restart', 'volume', 'volume-value', 'site-level'];
  const elements = Object.fromEntries(ids.map(id => [id, new Element()]));
  const audio = elements.audio;
  Object.assign(audio, { paused: true, currentTime: 0, readyState: 0, duration: 48, playCount: 0 });
  Object.defineProperty(audio, 'src', { get() { return this.attrs.src; }, set(value) { this.attrs.src = value; } });
  audio.pause = () => { audio.paused = true; audio.emit('pause'); };
  audio.play = async () => { audio.paused = false; audio.playCount++; audio.emit('play'); };
  audio.load = () => {
    audio.currentTime = 0; audio.readyState = 0;
    if (audio.src) queueMicrotask(() => { audio.readyState = 1; audio.emit('loadedmetadata'); });
  };
  const buttons = (values, key) => values.map(value => Object.assign(new Element(), { dataset: { [key]: value } }));
  const directions = buttons(['workshop', 'signal', 'presence'], 'id');
  const layers = buttons(['full', 'atmosphere', 'cues'], 'layer');
  const chapters = buttons(['8.8', '13.8', '25.8', '36'], 'time');
  const document = new Element();
  document.hidden = false;
  document.getElementById = id => elements[id];
  document.querySelectorAll = selector => ({ '[data-id]': directions, '[data-layer]': layers, '[data-time]': chapters })[selector];
  const pending = [];
  const fetch = async (url, options) => url === 'variants.json'
    ? { ok: true, json: async () => [] }
    : await new Promise((resolve, reject) => {
      pending.push({ url, resolve: () => resolve({ ok: true, blob: async () => ({}) }) });
      options?.signal.addEventListener('abort', () => reject(Object.assign(new Error(), { name: 'AbortError' })));
    });
  let blobID = 0;
  vm.runInNewContext(source, { document, window: new Element(), fetch, AbortController, URL: { createObjectURL: () => `blob:${++blobID}`, revokeObjectURL() {} } });
  return { elements, audio, document, directions, layers, pending };
}
const flush = () => new Promise(resolve => setImmediate(resolve));

(async () => {
  let f = fixture();
  f.elements.play.emit('click');
  f.document.hidden = true; f.document.emit('visibilitychange');
  f.pending.at(-1).resolve(); await flush();
  assert.equal(f.audio.paused, true);
  assert.equal(f.audio.playCount, 0);
  assert.equal(f.elements['play-label'].textContent, 'Play study');
  console.log('PASS: hiding during loading cancels pending playback');

  f = fixture();
  f.elements.play.emit('click'); f.pending.at(-1).resolve(); await flush();
  f.audio.currentTime = 26;
  f.directions[1].emit('click'); f.directions[2].emit('click');
  f.pending.at(-1).resolve(); await flush();
  assert.equal(f.audio.paused, false);
  assert.equal(f.audio.currentTime, 26);
  assert.equal(f.elements['play-label'].textContent, 'Pause');
  console.log('PASS: two rapid direction switches retain playback intent and position');

  f = fixture();
  f.layers[2].emit('click'); f.elements.play.emit('click');
  f.pending.at(-1).resolve(); await flush();
  assert.equal(f.audio.paused, false);
  assert.equal(f.audio.currentTime, 8.8);
  assert.equal(f.pending.length, 1);
  console.log('PASS: immediate Play retains the pending cue start');

  f = fixture();
  f.elements.play.emit('click');
  assert.equal(f.elements['play-label'].textContent, 'Pause');
  f.elements.play.emit('click'); f.pending.at(-1).resolve(); await flush();
  assert.equal(f.audio.paused, true);
  assert.equal(f.audio.playCount, 0);
  assert.equal(f.elements['play-label'].textContent, 'Play study');
  console.log('PASS: Pause cancels playback before a recording finishes loading');
})().catch(error => { console.error(error); process.exitCode = 1; });
