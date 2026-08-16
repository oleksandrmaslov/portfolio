/* ============================================================
   M.O. SYSTEM — Sound Engine v0.4 · "The Disturbance Field"
   ------------------------------------------------------------
   A ground-up rework around ONE idea:

     Nothing "plays." There is one living FIELD, and every
     interaction is a way of DISTURBING it. Hover, click, key,
     scroll = different gestures that inject energy into the same
     medium, which blooms and decays back into the ambient.

   You are node 0x00 — the disturbance propagating through space.

   What's new vs v0.3:
     • UNIFIED FIELD  — sub + texture + sparse distant nodes run as
       ONE always-on bed that can sit near-silent at rest.
     • SHARED SPACE   — bed AND events route through the same
       convolver + feedback delay, so a click happens *in the room*
       with the drone, never on top of it.
     • SIDECHAIN DUCK — every event briefly ducks/opens the bed.
       THIS is the feeling of disturbing a field.
     • EXCITATION not playback — hovers/clicks ring tuned resonators
       (just-intonation harmonics of 0x00) with atonal edge partials.
     • MOTION not friction — scroll maps to filter + doppler + pan +
       depth. You move *through* space; you never rub against it.
     • THREE FIELDS   — VOID (cold/crystalline), BREATH (warm/organic),
       DEEPFIELD (cinematic/sub). setField(name).
     • presence + wetness knobs (design defaults 0.80 / 0.60).

   Backward compatible: every v0.3 MOSound.* method still exists.
   ============================================================ */
(function () {
  "use strict";
  var AC = window.AudioContext || window.webkitAudioContext;
  var LS_VOL = "mo_snd_vol", LS_MUTE = "mo_snd_mute", LS_FIELD = "mo_snd_field",
      LS_PRES = "mo_snd_pres", LS_WET = "mo_snd_wet";

  var ctx, master, glue, limiter, hpf, air, analyser;
  var convolver, reverbReturn, delay, delayFb, delayLP, delayReturn, dryBus;
  var bedGain, bedDuck, bedFilter, motionSend, motionConv;
  var noiseBuf, built = false;
  var freqData = null, waveBuf = null;

  var muted = rB(LS_MUTE, false), volume = rF(LS_VOL, 0.72),
      presence = rF(LS_PRES, 0.80), wetness = rF(LS_WET, 0.60), listeners = [];
  var recent = [], impulseCache = {};
  var field = null;                 // the live bed { sub, breath, sparseTimer, ... }
  var scrollEnv = { v: 0, last: 0, dir: 1, decayTimer: null, sub: 0 };

  /* ---- THE THREE FIELDS --------------------------------------
     partials: [ratio, amp, decayScale]. Ratios <= ~5 are tuned
     harmonics of 0x00 (consonant core); the high inharmonic ones
     are the atonal/textural EDGE the brief asked for. */
  var FIELDS = {
    void: {
      label: "VOID", blurb: "Cold, crystalline, near-silent. Deep space — rings like struck glass when touched. You ARE the disturbance.",
      osc: "sine",
      partials: [[1,1,1.5],[2.0,0.42,1.05],[3.0,0.26,0.72],[4.76,0.13,0.5],[7.13,0.06,0.4],[9.81,0.03,0.3]],
      toneBase: 7600, decay: 1.5, root: 55, pingOct: 3,
      reverbSize: 3.6, reverbSend: 0.40, delaySend: 0.16, delayTime: 0.42, delayFb: 0.42,
      edge: 0.05, breathLevel: 0.0, subLevel: 0.018, subWobble: 0.12,
      sparse: [3200, 7200], sparseVel: 0.16, duck: 0.5
    },
    breath: {
      label: "BREATH", blurb: "Warm, organic, intimate. A barely-there air-tone breathes; touches bloom bowed & soft. Less sci-fi, more alive.",
      osc: "triangle",
      partials: [[1,1,0.9],[2.0,0.46,0.55],[3.01,0.26,0.4],[4.98,0.12,0.3],[6.3,0.05,0.26]],
      toneBase: 3700, decay: 0.85, root: 58, pingOct: 3,
      reverbSize: 2.0, reverbSend: 0.26, delaySend: 0.10, delayTime: 0.30, delayFb: 0.30,
      edge: 0.10, breathLevel: 0.05, subLevel: 0.016, subWobble: 0.2,
      sparse: [3600, 8200], sparseVel: 0.14, duck: 0.45
    },
    deepfield: {
      label: "DEEP FIELD", blurb: "Sub-heavy, vast, cinematic. Slow low resonance you feel more than hear; big blooms, long tails, the field breathes around you.",
      osc: "sine",
      partials: [[1,1,2.2],[1.5,0.4,1.7],[2.0,0.3,1.3],[3.0,0.16,0.9],[4.51,0.07,0.6]],
      toneBase: 2700, decay: 2.2, root: 41, pingOct: 2,
      reverbSize: 4.3, reverbSend: 0.50, delaySend: 0.20, delayTime: 0.52, delayFb: 0.46,
      edge: 0.04, breathLevel: 0.025, subLevel: 0.05, subWobble: 0.16,
      sparse: [4200, 9500], sparseVel: 0.18, duck: 0.55
    }
  };
  // compat: old voicing names → fields
  var VOICE_ALIAS = { constellation:"void", signal:"void", deepspace:"deepfield", mechanical:"breath", organic:"breath" };
  var fieldName = (function(){ var v=""; try{v=localStorage.getItem(LS_FIELD);}catch(e){} if(FIELDS[v])return v; if(VOICE_ALIAS[v])return VOICE_ALIAS[v]; return "void"; })();
  var F = FIELDS[fieldName];

  /* ---- tuning: the metaphor as math -------------------------- */
  var RATIOS = [1, 9/8, 5/4, 3/2, 5/3];
  function nodeFreq(addr) {
    if (addr <= 0) return F.root * Math.pow(2, F.pingOct);
    var i = (addr - 1) % RATIOS.length, oct = Math.floor((addr - 1) / RATIOS.length);
    return F.root * Math.pow(2, F.pingOct + oct) * RATIOS[i];
  }

  /* ---- storage / state -------------------------------------- */
  function rB(k,d){ try{var v=localStorage.getItem(k);return v==null?d:v==="1";}catch(e){return d;} }
  function rF(k,d){ try{var v=parseFloat(localStorage.getItem(k));return isNaN(v)?d:v;}catch(e){return d;} }
  function save(){ try{
    localStorage.setItem(LS_VOL,String(volume)); localStorage.setItem(LS_MUTE,muted?"1":"0");
    localStorage.setItem(LS_FIELD,fieldName); localStorage.setItem(LS_PRES,String(presence));
    localStorage.setItem(LS_WET,String(wetness));
  }catch(e){} }
  function emit(){ var s=state(); for(var i=0;i<listeners.length;i++) try{listeners[i](s);}catch(e){} }
  function state(){ return { muted:muted, volume:volume, field:fieldName, voicing:fieldName, presence:presence, wetness:wetness }; }

  /* ---- build the graph -------------------------------------- */
  function init() {
    if (built) return ctx;
    if (!AC) return null;
    ctx = new AC();
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    var nd = noiseBuf.getChannelData(0);
    for (var i=0;i<nd.length;i++) nd[i] = Math.random()*2-1;

    master = ctx.createGain(); master.gain.value = muted?0:volume*presence;
    hpf = ctx.createBiquadFilter(); hpf.type="highpass"; hpf.frequency.value=24; hpf.Q.value=0.5;
    air = ctx.createBiquadFilter(); air.type="highshelf"; air.frequency.value=6200; air.gain.value=2.5;
    glue = ctx.createDynamicsCompressor();
    glue.threshold.value=-22; glue.ratio.value=2.4; glue.attack.value=0.012; glue.release.value=0.26; glue.knee.value=8;
    limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value=-1.5; limiter.ratio.value=20; limiter.attack.value=0.002; limiter.release.value=0.06; limiter.knee.value=0;
    analyser = ctx.createAnalyser(); analyser.fftSize=2048; analyser.smoothingTimeConstant=0.72;
    waveBuf = new Float32Array(analyser.fftSize);
    freqData = new Uint8Array(analyser.frequencyBinCount);

    // dry bus — everything not-yet-wet lands here
    dryBus = ctx.createGain(); dryBus.gain.value = 1;

    // shared space: convolver reverb
    convolver = ctx.createConvolver(); convolver.buffer = getImpulse(F.reverbSize);
    reverbReturn = ctx.createGain(); reverbReturn.gain.value = 0.26;
    // shared space: feedback delay (dark)
    delay = ctx.createDelay(1.2); delay.delayTime.value = F.delayTime;
    delayFb = ctx.createGain(); delayFb.gain.value = F.delayFb;
    delayLP = ctx.createBiquadFilter(); delayLP.type="lowpass"; delayLP.frequency.value=2200;
    delayReturn = ctx.createGain(); delayReturn.gain.value = 0.5;
    delay.connect(delayLP); delayLP.connect(delayFb); delayFb.connect(delay);
    delay.connect(delayReturn);

    // wire trunk: dryBus -> hpf -> air -> glue -> limiter -> master -> analyser -> out
    dryBus.connect(hpf);
    convolver.connect(reverbReturn); reverbReturn.connect(hpf);
    delayReturn.connect(hpf);
    hpf.connect(air); air.connect(glue); glue.connect(limiter);
    limiter.connect(master); master.connect(analyser); analyser.connect(ctx.destination);

    // ---- the bed (duckable) ----
    bedFilter = ctx.createBiquadFilter(); bedFilter.type="lowpass"; bedFilter.frequency.value=900; bedFilter.Q.value=0.3;
    bedDuck = ctx.createGain(); bedDuck.gain.value = 1;        // sidechain target
    bedGain = ctx.createGain(); bedGain.gain.value = 1;        // master bed level
    bedGain.connect(bedDuck); bedDuck.connect(bedFilter);
    bedFilter.connect(dryBus);
    // bed gets its own reverb send so it lives in the space too
    var bedSend = ctx.createGain(); bedSend.gain.value = 0.5;
    bedFilter.connect(bedSend); bedSend.connect(convolver);
    // motion send — scroll opens depth into the reverb
    motionSend = ctx.createGain(); motionSend.gain.value = 0;
    motionConv = ctx.createGain(); motionConv.gain.value = 0.5;
    motionSend.connect(motionConv); motionConv.connect(convolver);

    built = true; return ctx;
  }
  function makeImpulse(sec, decay) {
    var len=Math.floor(ctx.sampleRate*sec), buf=ctx.createBuffer(2,len,ctx.sampleRate);
    for (var c=0;c<2;c++){ var d=buf.getChannelData(c); for(var i=0;i<len;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/len,decay); }
    return buf;
  }
  function getImpulse(size){ var k=size.toFixed(1); return impulseCache[k]||(impulseCache[k]=makeImpulse(size,2.6)); }
  function unlock(){ init(); if(ctx&&ctx.state==="suspended") ctx.resume(); }
  function ready(){ return built && ctx && ctx.state==="running" && !muted; }

  /* ---- voice routing: dry + shared wet sends ----------------- */
  function voiceOut(opts) {
    opts = opts || {};
    var g = ctx.createGain(); g.connect(dryBus);
    var w = wetness;
    var rv = (opts.reverb != null ? opts.reverb : F.reverbSend) * (0.4 + w*1.1);
    var dl = (opts.delay  != null ? opts.delay  : F.delaySend ) * (0.3 + w*1.2);
    if (rv > 0.001){ var s=ctx.createGain(); s.gain.value=rv; g.connect(s); s.connect(convolver); }
    if (dl > 0.001){ var d=ctx.createGain(); d.gain.value=dl; g.connect(d); d.connect(delay); }
    return g;
  }
  function densityGain(){
    var now=ctx.currentTime; recent.push(now);
    while(recent.length && now-recent[0]>0.18) recent.shift();
    var n=recent.length; return n<=2?1:Math.max(0.4,1-(n-2)*0.1);
  }
  function noiseSrc(){ var s=ctx.createBufferSource(); s.buffer=noiseBuf; s.loop=true; s.start(ctx.currentTime+Math.random()*0.4); return s; }
  function pan(x){ if(ctx.createStereoPanner){ var p=ctx.createStereoPanner(); p.pan.value=Math.max(-1,Math.min(1,x||0)); return p; } return null; }

  /* ---- THE DISTURBANCE: duck the bed on every event ---------- */
  function disturb(amount) {
    if (!bedDuck) return;
    var t=ctx.currentTime, a=Math.max(0,Math.min(1,amount==null?F.duck:amount));
    bedDuck.gain.cancelScheduledValues(t);
    bedDuck.gain.setValueAtTime(bedDuck.gain.value, t);
    bedDuck.gain.linearRampToValueAtTime(1-a*0.7, t+0.045);     // shove down fast
    bedDuck.gain.setTargetAtTime(1, t+0.05, 0.28);              // field recovers
    // and the field briefly opens (brightens) as it's disturbed
    bedFilter.frequency.cancelScheduledValues(t);
    bedFilter.frequency.setValueAtTime(bedFilter.frequency.value, t);
    bedFilter.frequency.linearRampToValueAtTime(900 + a*1800, t+0.06);
    bedFilter.frequency.setTargetAtTime(900, t+0.1, 0.4);
  }

  /* ---- NODE PING — ring the field at a node's pitch ---------- */
  function nodePing(addr, opts) {
    if (!ready()) return;
    opts = opts||{};
    var t=ctx.currentTime, dg=densityGain();
    var f=nodeFreq(addr)*(opts.mult||1);
    var vel=opts.vel!=null?opts.vel:0.8, depth=opts.depth!=null?opts.depth:0, x=opts.x!=null?opts.x:0;
    var quiet=opts.quiet?0.55:1;

    var out=voiceOut({ reverb:F.reverbSend+depth*0.3 });
    var tone=ctx.createBiquadFilter(); tone.type="lowpass"; tone.frequency.value=F.toneBase-depth*(F.toneBase*0.6);
    var p=pan(x); if(p){ tone.connect(p); p.connect(out); } else tone.connect(out);

    // struck excitation — short filtered noise burst that 'hits' the resonator
    var n=noiseSrc(), bp=ctx.createBiquadFilter(); bp.type="bandpass"; bp.frequency.value=Math.min(9000,f*4); bp.Q.value=1.1;
    var ng=ctx.createGain(); n.connect(bp); bp.connect(ng); ng.connect(tone);
    ng.gain.setValueAtTime(0.0001,t); ng.gain.exponentialRampToValueAtTime(0.045*vel*dg*quiet,t+0.001); ng.gain.exponentialRampToValueAtTime(0.0001,t+0.02); n.stop(t+0.06);

    // modal partials (tuned core + inharmonic edge)
    var base=0.30*(0.5+vel*0.5)*dg*quiet*(1-depth*0.45);
    for (var i=0;i<F.partials.length;i++){
      var pr=F.partials[i];
      var o=ctx.createOscillator(); o.type=F.osc; o.frequency.value=f*pr[0];
      var g=ctx.createGain(); o.connect(g); g.connect(tone);
      var dec=F.decay*pr[2]*(1-depth*0.3);
      g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(base*pr[1],t+0.003); g.gain.exponentialRampToValueAtTime(0.0001,t+0.04+dec);
      o.start(t); o.stop(t+0.06+dec);
    }
    // atonal EDGE — a breath of inharmonic shimmer at the field's rim
    if (F.edge>0){
      var en=noiseSrc(), ebp=ctx.createBiquadFilter(); ebp.type="bandpass"; ebp.frequency.value=f*(5.2+Math.random()*3); ebp.Q.value=6;
      var eg=ctx.createGain(); en.connect(ebp); ebp.connect(eg); eg.connect(out);
      eg.gain.setValueAtTime(0.0001,t); eg.gain.exponentialRampToValueAtTime(F.edge*vel*dg*0.5,t+0.02); eg.gain.exponentialRampToValueAtTime(0.0001,t+0.2+F.decay*0.3); en.stop(t+0.6);
    }
    disturb((opts.duck!=null?opts.duck:F.duck) * (0.5+vel*0.5));
  }
  function nodeLock(addr, opts){
    opts=opts||{};
    nodePing(addr,{ vel:0.9, x:opts.x||0, depth:0 });
    var x=opts.x||0;
    setTimeout(function(){ nodePing(addr,{ vel:0.5, x:-x*0.6, depth:0.4, mult:2 }); },125);
  }
  // hover — a soft, brief ring (the field notices you)
  var lastHover=0;
  function hover(addr){
    if(!ready()) return; var now=performance.now(); if(now-lastHover<70) return; lastHover=now;
    nodePing(addr!=null?addr:(1+Math.floor(Math.random()*8)),{ vel:0.32, x:(Math.random()*2-1)*0.5, depth:0.25, quiet:true, duck:F.duck*0.5 });
  }
  // open — navigation bloom (gather toward 0x00)
  function open(){ gather(); }
  function tick(){ nodePing(3,{ vel:0.42, depth:0.15 }); }

  /* ---- 0x00 carrier moments, gather, scatter ----------------- */
  function beacon(){ if(!ready())return; nodePing(0,{vel:0.3,x:-0.8,depth:0.4,quiet:true}); nodePing(0,{vel:0.22,x:0.8,depth:0.5,mult:2,quiet:true}); }
  function gather(){
    if(!ready())return; var N=9;
    for(var i=0;i<N;i++)(function(i){ setTimeout(function(){ nodePing(1+Math.floor(Math.random()*10),{vel:0.42,x:Math.random()*2-1,depth:0.15+Math.random()*0.35}); },i*64); })(i);
    setTimeout(function(){ nodePing(0,{vel:0.95,x:0}); nodePing(0,{vel:0.55,x:0,mult:2}); nodePing(0,{vel:0.3,x:0,mult:3}); disturb(0.8); },N*64+120);
  }
  function scatter(){
    if(!ready())return; var t=ctx.currentTime;
    var n=noiseSrc(), bp=ctx.createBiquadFilter(); bp.type="bandpass"; bp.Q.value=0.7;
    bp.frequency.setValueAtTime(1500,t); bp.frequency.exponentialRampToValueAtTime(280,t+0.5);
    var g=voiceOut({reverb:0.5}); n.connect(bp); bp.connect(g);
    g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(0.05,t+0.05); g.gain.exponentialRampToValueAtTime(0.0001,t+0.55); n.stop(t+0.6);
    for(var i=0;i<7;i++)(function(i){ setTimeout(function(){ nodePing(1+Math.floor(Math.random()*10),{vel:0.34,x:Math.random()*2-1,depth:0.3+Math.random()*0.5}); },i*42); })(i);
    disturb(0.7);
  }

  /* ---- THE FIELD — one always-on bed ------------------------- */
  function fieldOn(on) {
    if (on && !field) {
      if (!ready() && !built) init();
      if (!ctx) return;
      var t=ctx.currentTime;
      // sub — felt more than heard, slow wobble
      var sub=ctx.createOscillator(); sub.type="sine"; sub.frequency.value=F.root;
      var subg=ctx.createGain(); subg.gain.value=0.0001; sub.connect(subg); subg.connect(bedGain);
      subg.gain.linearRampToValueAtTime(F.subLevel*presence, t+4); sub.start();
      var lfo=ctx.createOscillator(); lfo.type="sine"; lfo.frequency.value=0.06+Math.random()*0.05;
      var lfg=ctx.createGain(); lfg.gain.value=F.subLevel*presence*F.subWobble; lfo.connect(lfg); lfg.connect(subg.gain); lfo.start();
      // breath — slow filtered air (only some fields)
      var bn=null, bng=null;
      if (F.breathLevel>0){
        bn=noiseSrc(); var blp=ctx.createBiquadFilter(); blp.type="bandpass"; blp.frequency.value=480; blp.Q.value=0.6;
        bng=ctx.createGain(); bng.gain.value=0.0001; bn.connect(blp); blp.connect(bng); bng.connect(bedGain);
        bng.gain.linearRampToValueAtTime(F.breathLevel*presence, t+5);
        var blfo=ctx.createOscillator(); blfo.type="sine"; blfo.frequency.value=0.08;
        var blfg=ctx.createGain(); blfg.gain.value=240; blfo.connect(blfg); blfg.connect(blp.frequency); blfo.start();
        field && (field._blfo=blfo);
      }
      // sparse distant nodes — long silences (this replaces the old constellation)
      var timer=null;
      var sched=function(){
        if(!field) return;
        var lo=F.sparse[0], hi=F.sparse[1];
        nodePing(1+Math.floor(Math.random()*11),{ vel:F.sparseVel*(0.7+Math.random()*0.6)*presence, x:Math.random()*2-1, depth:0.45+Math.random()*0.5, quiet:true, duck:F.duck*0.4 });
        timer=setTimeout(sched, (lo+Math.random()*(hi-lo)) / (0.6+presence*0.7));
      };
      timer=setTimeout(sched, 1400);
      field={ sub:sub, subg:subg, lfo:lfo, lfg:lfg, bn:bn, bng:bng, timer:timer };
    } else if (!on && field) {
      var tt=ctx.currentTime, fld=field; field=null;
      fadeStop(fld.subg, fld.sub, tt); if(fld.lfo) try{fld.lfo.stop(tt+1.8);}catch(e){}
      if(fld.bng) fadeStop(fld.bng, fld.bn, tt);
      clearTimeout(fld.timer);
    }
  }
  function fadeStop(g, node, t){
    try{ g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(g.gain.value,t); g.gain.linearRampToValueAtTime(0.0001,t+1.6);
      setTimeout(function(){ try{node.stop();}catch(e){} },1800); }catch(e){}
  }
  function fieldRunning(){ return !!field; }
  // compat aliases
  function carrier(on){ fieldOn(on); }
  function carrierOn(){ return !!field; }
  function constellation(on){ fieldOn(on); }
  function constellationOn(){ return !!field; }

  /* ---- MOTION — scroll moves you THROUGH the field ----------- */
  function scroll(velocity) {
    if(!ready()) return;
    var av=Math.abs(velocity), v=Math.min(1,av/60), t=ctx.currentTime;
    scrollEnv.dir = velocity<0 ? -1 : 1;
    scrollEnv.v = v;
    // 1) the field brightens as you move (open bed filter) — airy, not noisy
    bedFilter.frequency.cancelScheduledValues(t);
    bedFilter.frequency.setTargetAtTime(900 + v*2600, t, 0.12);
    // 2) doppler — detune the sub by travel direction
    if(field && field.sub){ field.sub.detune.setTargetAtTime(scrollEnv.dir * v * 55, t, 0.1); }
    // 3) depth — open reverb send so you sink into space
    if(motionSend) motionSend.gain.setTargetAtTime(v*0.5, t, 0.12);
    if(field && bedFilter){ /* feed bed into motion reverb */ }
    bedFilter.connect(motionSend);
    // 4) nearby nodes pass by — pan from the side you're moving from
    if(v>0.4 && Math.random() < v*0.28){
      nodePing(1+Math.floor(Math.random()*11),{ vel:0.18*v, x:scrollEnv.dir*-0.8, depth:0.5+Math.random()*0.4, quiet:true, duck:0.15 });
    }
    // settle back to rest when scrolling stops
    if(scrollEnv.decayTimer) clearTimeout(scrollEnv.decayTimer);
    scrollEnv.decayTimer=setTimeout(function(){
      if(!ctx) return; var tt=ctx.currentTime;
      bedFilter.frequency.setTargetAtTime(900,tt,0.5);
      if(motionSend) motionSend.gain.setTargetAtTime(0,tt,0.6);
      if(field&&field.sub) field.sub.detune.setTargetAtTime(0,tt,0.5);
    },140);
  }
  // section arrival — the field opens and a soft 0x00 swells in
  function arrive(addr){
    if(!ready()) return; var t=ctx.currentTime;
    bedFilter.frequency.cancelScheduledValues(t);
    bedFilter.frequency.setValueAtTime(bedFilter.frequency.value,t);
    bedFilter.frequency.linearRampToValueAtTime(3200,t+0.25);
    bedFilter.frequency.setTargetAtTime(900,t+0.3,0.7);
    nodePing(addr!=null?addr:0,{ vel:0.5, depth:0.5, quiet:true, duck:0.3 });
  }
  function bootEnumerate(i,total){
    if(!ready())return;
    if(i>=(total-1)){ gather(); return; }
    nodePing(1+(i%11),{ vel:0.4, x:(i%2?1:-1)*(0.3+(i/total)*0.5), depth:0.3 });
  }

  /* ---- KEYCAP THOCK — branded confirmation that also disturbs - */
  function thock(opts) {
    if(!ready()) return;
    var vel=opts&&opts.vel!=null?opts.vel:0.8, t=ctx.currentTime, dg=densityGain(), j=1+(Math.random()*0.16-0.08);
    // body knock — bottom-out
    var f0=(150+Math.random()*30)*j;
    var o=ctx.createOscillator(); o.type="triangle"; o.frequency.setValueAtTime(f0*1.6,t); o.frequency.exponentialRampToValueAtTime(f0,t+0.04);
    var blp=ctx.createBiquadFilter(); blp.type="lowpass"; blp.frequency.value=900+vel*500;
    var og=voiceOut({reverb:0.06, delay:0.0}); o.connect(blp); blp.connect(og);
    og.gain.setValueAtTime(0.0001,t); og.gain.exponentialRampToValueAtTime(0.42*(0.6+vel*0.4)*dg,t+0.005); og.gain.exponentialRampToValueAtTime(0.0001,t+0.1+Math.random()*0.04);
    o.start(t); o.stop(t+0.16);
    // thud noise
    var n=noiseSrc(), nhp=ctx.createBiquadFilter(); nhp.type="highpass"; nhp.frequency.value=200;
    var nlp=ctx.createBiquadFilter(); nlp.type="lowpass"; nlp.frequency.value=1400;
    var ng=voiceOut({reverb:0.04,delay:0}); n.connect(nhp); nhp.connect(nlp); nlp.connect(ng);
    ng.gain.setValueAtTime(0.0001,t); ng.gain.exponentialRampToValueAtTime(0.12*vel*dg,t+0.002); ng.gain.exponentialRampToValueAtTime(0.0001,t+0.05); n.stop(t+0.08);
    // contact click
    var n2=noiseSrc(), bp=ctx.createBiquadFilter(); bp.type="bandpass"; bp.frequency.value=(2600+vel*1600)*j; bp.Q.value=0.9;
    var cg=voiceOut({reverb:0.03,delay:0}); n2.connect(bp); bp.connect(cg);
    cg.gain.setValueAtTime(0.0001,t); cg.gain.exponentialRampToValueAtTime(0.09*vel*dg,t+0.001); cg.gain.exponentialRampToValueAtTime(0.0001,t+0.012); n2.stop(t+0.04);
    // spring ping (some presses)
    if(Math.random()<0.5){
      var s=ctx.createOscillator(); s.type="sine"; s.frequency.value=3200+Math.random()*1500;
      var sg=voiceOut({reverb:0.1,delay:0}); s.connect(sg); var st=t+0.004;
      sg.gain.setValueAtTime(0.0001,st); sg.gain.exponentialRampToValueAtTime(0.02*vel,st+0.003); sg.gain.exponentialRampToValueAtTime(0.0001,st+0.08); s.start(st); s.stop(st+0.1);
    }
    // ...AND the press disturbs space — excite a low field resonance + duck
    var rn=ctx.createOscillator(); rn.type="sine"; rn.frequency.value=F.root*2;
    var rg=voiceOut({reverb:F.reverbSend*0.7,delay:F.delaySend*0.6}); rn.connect(rg);
    rg.gain.setValueAtTime(0.0001,t); rg.gain.exponentialRampToValueAtTime(0.05*vel*dg,t+0.01); rg.gain.exponentialRampToValueAtTime(0.0001,t+0.5+F.decay*0.4); rn.start(t); rn.stop(t+1+F.decay*0.5);
    disturb(F.duck*(0.7+vel*0.3));
  }
  function thockUp() {
    if(!ready()) return;
    var t=ctx.currentTime, dg=densityGain(), j=1+(Math.random()*0.16-0.08);
    var n=noiseSrc(), bp=ctx.createBiquadFilter(); bp.type="bandpass"; bp.frequency.value=3200*j; bp.Q.value=1.1;
    var g=voiceOut({reverb:0.03,delay:0}); n.connect(bp); bp.connect(g);
    g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(0.05*dg,t+0.001); g.gain.exponentialRampToValueAtTime(0.0001,t+0.02); n.stop(t+0.05);
    var o=ctx.createOscillator(); o.type="triangle"; o.frequency.value=260*j;
    var lp=ctx.createBiquadFilter(); lp.type="lowpass"; lp.frequency.value=1500;
    var og=voiceOut({reverb:0.04,delay:0}); o.connect(lp); lp.connect(og);
    og.gain.setValueAtTime(0.0001,t); og.gain.exponentialRampToValueAtTime(0.1*dg,t+0.003); og.gain.exponentialRampToValueAtTime(0.0001,t+0.06); o.start(t); o.stop(t+0.08);
  }

  /* ---- FIELD control ---------------------------------------- */
  function setField(name){
    if(VOICE_ALIAS[name]) name=VOICE_ALIAS[name];
    if(!FIELDS[name]) return;
    var wasOn=!!field;
    fieldName=name; F=FIELDS[name];
    if(built){
      convolver.buffer=getImpulse(F.reverbSize);
      delay.delayTime.setTargetAtTime(F.delayTime,ctx.currentTime,0.2);
      delayFb.gain.setTargetAtTime(F.delayFb,ctx.currentTime,0.2);
      if(wasOn){ fieldOn(false); setTimeout(function(){ fieldOn(true); },120); }
    }
    save(); emit();
  }
  function getFields(){ return Object.keys(FIELDS).map(function(k){ return {name:k,label:FIELDS[k].label,blurb:FIELDS[k].blurb}; }); }
  function currentField(){ return fieldName; }

  /* ---- master controls -------------------------------------- */
  function applyGain(){ if(master){ var t=ctx.currentTime; master.gain.cancelScheduledValues(t); master.gain.setTargetAtTime(muted?0:volume*presence,t,0.05); } }
  function setMuted(b){ muted=!!b; applyGain(); save(); emit(); }
  function toggleMute(){ setMuted(!muted); }
  function setVolume(v){ volume=Math.max(0,Math.min(1,v)); if(volume>0&&muted) muted=false; applyGain(); save(); emit(); }
  function setPresence(v){ presence=Math.max(0,Math.min(1,v)); applyGain(); save(); emit(); }
  function setWetness(v){ wetness=Math.max(0,Math.min(1,v)); save(); emit(); }
  function getPresence(){ return presence; } function getWetness(){ return wetness; }

  /* ---- analysis for visuals (EQ bars etc.) ------------------- */
  function getWave(a){ if(analyser) analyser.getFloatTimeDomainData(a||waveBuf); return a||waveBuf; }
  function getLevel(){ if(!analyser) return 0; analyser.getFloatTimeDomainData(waveBuf); var s=0; for(var i=0;i<waveBuf.length;i++) s+=waveBuf[i]*waveBuf[i]; return Math.min(1,Math.sqrt(s/waveBuf.length)*3.4); }
  function getBands(n){
    n=n||5; var out=new Array(n).fill(0);
    if(!analyser) return out;
    analyser.getByteFrequencyData(freqData);
    var len=freqData.length, lo=2, hi=Math.floor(len*0.55);
    for(var b=0;b<n;b++){
      var f0=Math.floor(lo*Math.pow(hi/lo,b/n)), f1=Math.floor(lo*Math.pow(hi/lo,(b+1)/n));
      var s=0,c=0; for(var i=f0;i<f1;i++){ s+=freqData[i]; c++; }
      out[b]=c?Math.min(1,(s/c)/180):0;
    }
    return out;
  }

  window.MOSound = {
    init:init, unlock:unlock, ready:ready,
    setMuted:setMuted, toggleMute:toggleMute, setVolume:setVolume,
    isMuted:function(){return muted;}, getVolume:function(){return volume;},
    setPresence:setPresence, getPresence:getPresence, setWetness:setWetness, getWetness:getWetness,
    onState:function(cb){ listeners.push(cb); cb(state()); },
    // fields (new) + voicing aliases (compat)
    setField:setField, getFields:getFields, currentField:currentField,
    setVoicing:setField, getVoicings:getFields, currentVoicing:currentField,
    // the living field
    field:fieldOn, fieldOn:fieldRunning, carrier:carrier, carrierOn:carrierOn,
    constellation:constellation, constellationOn:constellationOn,
    // disturbances
    nodePing:nodePing, nodeLock:nodeLock, hover:hover, open:open, tick:tick,
    gather:gather, scatter:scatter, disturb:disturb,
    scroll:scroll, arrive:arrive, bootEnumerate:bootEnumerate,
    thock:thock, thockUp:thockUp,
    // info / analysis
    nodeFreq:nodeFreq, get ROOT(){return F.root;},
    getLevel:getLevel, getWave:getWave, getBands:getBands,
    getDuck:function(){ return bedDuck?bedDuck.gain.value:1; },
    get ctx(){return ctx;}
  };
})();
