/* Demo compositions share Clear signal's instruments, never its melody. */
(function (root) {
  'use strict';
  const profiles = {
    wafer: { title: 'Soft circuit', bpm: 72, lead: 'marimba', root: 38,
      chords: [[54,57,61,64],[54,57,59,62],[55,59,62,66],[52,57,59,64]], bass: [38,47,43,45],
      motif: [0,2,1,3,2,0,3,1], beats: [10], pad: .11 },
    kerfur: { title: 'Small companion', bpm: 66, lead: 'marimba', root: 48,
      chords: [[55,59,62,64],[57,60,64,67],[57,60,62,65],[55,57,62,64]], bass: [48,41,38,43],
      motif: [2,3,1,2,0,1,3,2], beats: [2,5,12], pad: .09 },
    torch: { title: 'Night filament', bpm: 72, lead: 'silk', root: 40,
      chords: [[55,59,62,66],[54,57,59,64],[55,59,64,67],[54,57,62,66]], bass: [40,45,48,47],
      motif: [0,3,2,0,1,2,3,1], beats: [0,7,14], pad: .045 },
    accel: { title: 'Vector drift', bpm: 92, lead: 'pluck', root: 43,
      chords: [[55,59,62,66],[54,57,62,64],[52,55,59,62],[52,57,59,64]], bass: [43,38,40,45],
      motif: [3,1,2,0,2,3,0,1], beats: [1,4,11,14], pad: .065 },
  };
  const clamp = x => Number.isFinite(x) ? Math.max(0, Math.min(1, x)) : 0;
  class DemoScore {
    constructor(id) {
      this.p = profiles[id];
      if (!this.p) throw new Error('Unknown demo score');
      this.id = id; this.step = 0; this.energy = 0; this.position = 0;
      this.texture = false; this.sleeping = false;
    }
    snapshot() { return { title: this.p.title, step: this.step, energy: this.energy }; }
    motion(amount, position = 0) { this.energy = Math.max(this.energy, clamp(amount)); this.position = clamp(position); }
    next() {
      const p = this.p, pos = this.step % 16, bar = Math.floor(this.step / 16);
      const chord = Math.floor(bar / 2) % 4, notes = p.chords[chord], events = [];
      const quiet = this.sleeping ? .4 : 1;
      const add = (kind, note, gain, duration, pan = 0, delay = 0) =>
        events.push({ kind, note, gain: gain * quiet, duration, pan, delay });
      if (this.id === 'wafer') {
        if (pos === 0) {
          notes.forEach((n,i) => add('silk', n, p.pad, 3.2, (i-1.5)*.22, i*.016));
          add('bass', p.bass[chord], .18, 2);
        }
        // One clear response every other bar; movement never adds a busy ostinato.
        if (!this.sleeping && pos === 10 && bar % 2 === 1)
          add('marimba', notes[p.motif[Math.floor(bar/2)%p.motif.length]], .065, 1.2, .12);
        this.energy *= .94; this.step++;
        return events;
      }
      if (pos === 0) {
        notes.slice(0,3).forEach((n,i) => add('silk', n, p.pad, 4.5, (i-1)*.24, i*.025));
        add('bass', p.bass[chord], .18, 2.3);
      }
      if (!this.sleeping && p.beats.includes(pos)) {
        const i = p.motif[(bar * p.beats.length + p.beats.indexOf(pos)) % p.motif.length];
        add(p.lead, notes[i] + (this.id === 'kerfur' ? 12 : 0), .105, this.id === 'torch' ? 2.4 : 1.15, pos < 8 ? -.22 : .22);
      }
      if (!this.sleeping && this.energy > .12 && pos % 4 === 2)
        add(this.id === 'torch' ? 'pulse' : 'wood', this.id === 'torch' ? p.root : 1 + bar%3, .025 + this.energy*.035, .12);
      if (this.texture && !this.sleeping && pos % 4 === 0)
        add(this.id === 'kerfur' ? 'bass' : p.lead, notes[Math.min(3,Math.floor(this.position*4))] - (this.id === 'kerfur' ? 24 : 0), .045, .7);
      this.energy *= .94; this.step++;
      return events;
    }
  }
  root.MODemoMusic = { profiles, DemoScore, clamp };
})(typeof window === 'object' ? window : globalThis);
