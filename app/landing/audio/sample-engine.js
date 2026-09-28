/* Sampled instruments, one audio clock, one bounded voice pool. */
(function(){
  'use strict';
  const BASE=new URL('.',document.currentScript.src);
  const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
  class GenerativeField {
    constructor(options={}){
      this.direction=options.direction||'signal';this.nodes=options.nodes;
      this.score=new MOStudyScore.Score(this.direction,{nodes:this.nodes,seed:options.seed});
      this.context=null;this.master=null;this.mixer=null;this.analyser=null;this.bank=null;
      this.voices=new Set();this.freeVoices=[];this.allocatedVoices=0;this.listeners=new Set();this.noteListeners=new Set();
      this.running=false;this.intent=false;this.loading=false;this.volume=.55;this.epoch=0;
      this.timer=null;this.stopTimer=null;this.abort=null;this.nextTime=0;this.lastMeter=0;this.level=0;
      this.stateText='Sound is off';this.highWater=0;this.dropped=0;this.maxScheduleMs=0;
      this.stats={scheduled:0,late:0};this.masterScale=1;this.manifest=null;
      this.visibility=()=>{if(document.hidden)this.stop(true);};
      this.pagehide=()=>this.stop(true);
      document.addEventListener('visibilitychange',this.visibility);window.addEventListener('pagehide',this.pagehide);
    }
    onState(fn){this.listeners.add(fn);fn(this.snapshot());return()=>this.listeners.delete(fn);}
    onNote(fn){this.noteListeners.add(fn);return()=>this.noteListeners.delete(fn);}
    emit(){const s=this.snapshot();for(const fn of this.listeners)fn(s);}
    snapshot(){return {...this.score.snapshot(),running:this.running,intent:this.intent,loading:this.loading,volume:this.volume,status:this.stateText,
      voices:this.voices.size,maxVoices:24,highWater:this.highWater,dropped:this.dropped,decodedBytes:this.bank?this.bank.buffer.length*this.bank.buffer.numberOfChannels*4:0,
      allocatedVoices:this.allocatedVoices,contextState:this.context?.state||'uncreated',level:this.level,...this.stats,maxScheduleMs:this.maxScheduleMs};}
    build(){
      if(this.context)return;
      const Context=window.AudioContext||window.webkitAudioContext;
      if(!Context)throw new Error('Web Audio is unavailable in this browser');
      this.context=new Context({latencyHint:'interactive',sampleRate:32000});
      this.mixer=this.context.createGain();this.mixer.gain.value=1;
      this.master=this.context.createGain();this.master.gain.value=0;
      this.guard=this.context.createDynamicsCompressor();
      this.guard.threshold.value=-8;this.guard.knee.value=5;this.guard.ratio.value=5;this.guard.attack.value=.005;this.guard.release.value=.2;
      this.analyser=this.context.createAnalyser();this.analyser.fftSize=256;this.meter=new Float32Array(256);
      this.mixer.connect(this.master);this.master.connect(this.guard);this.guard.connect(this.analyser);this.analyser.connect(this.context.destination);
      this.context.addEventListener('statechange',()=>{
        if(this.running&&this.context.state!=='running'){this.stop(true);this.stateText='Audio interrupted. Press start to continue.';this.emit();}
      });
    }
    async loadBank(epoch){
      if(this.bank?.direction===this.direction)return true;
      this.abort?.abort();this.abort=new AbortController();const signal=this.abort.signal;
      this.loading=true;this.stateText='Loading instruments…';this.emit();
      try{
        if(!this.manifest){const r=await fetch(new URL('instruments.json',BASE),{signal});if(!r.ok)throw new Error('Instrument index failed');this.manifest=await r.json();}
        const data=this.manifest.directions[this.direction];if(!data)throw new Error('Unknown instrument palette');
        const direction=this.direction;
        const r=await fetch(new URL(data.file,BASE),{signal});if(!r.ok)throw new Error('Instrument download failed');
        const bytes=await r.arrayBuffer();
        if(epoch!==this.epoch)return false;
        const buffer=await this.context.decodeAudioData(bytes);
        if(epoch!==this.epoch)return false;
        const byKind=new Map();
        for(const entry of data.entries){if(!byKind.has(entry.kind))byKind.set(entry.kind,[]);byKind.get(entry.kind).push(entry);}
        this.bank={direction,buffer,entries:data.entries,byKind,noteCache:new Map()};this.masterScale=data.masterGain;this.loading=false;return true;
      }catch(error){
        if(epoch===this.epoch){this.loading=false;this.intent=false;this.stateText=error.name==='AbortError'?'Sound is off':'Could not load instruments. Press start to retry.';this.context?.suspend().catch(()=>{});this.emit();}
        return false;
      }
    }
    async start(){
      if(this.running||this.intent)return;
      const epoch=++this.epoch;this.intent=true;
      if(this.stopTimer){clearTimeout(this.stopTimer);this.stopTimer=null;}
      try{
        this.build();const [,loaded]=await Promise.all([this.context.resume(),this.loadBank(epoch)]);
        if(!loaded)return;
        if(epoch!==this.epoch||!this.intent||document.hidden){if(epoch===this.epoch)this.stop(true);return;}
        // A device interruption can happen while the instrument bank is loading,
        // after resume has resolved but before playback is ready.
        if(this.context.state!=='running'){
          this.stop(true);this.stateText='Audio interrupted. Press start to continue.';this.emit();return;
        }
        this.running=true;this.stateText='Listening to your movement';this.nextTime=this.context.currentTime+.065;
        this.setMaster(this.volume,.4);this.timer=setInterval(()=>this.tick(),35);this.tick();this.emit();
      }catch(error){if(epoch===this.epoch){this.intent=false;this.loading=false;this.running=false;this.stateText='Audio could not start. Press start to retry.';this.emit();}}
    }
    stop(immediate=false){
      this.epoch++;this.intent=false;this.running=false;this.loading=false;this.abort?.abort();
      clearInterval(this.timer);this.timer=null;clearTimeout(this.stopTimer);this.stopTimer=null;
      this.stateText='Sound is off';this.level=0;
      if(this.context){
        this.setMaster(0,immediate?.008:.16);
        const epoch=this.epoch;
        const finish=()=>{if(epoch!==this.epoch)return;this.clearVoices();this.context.suspend().catch(()=>{});this.stopTimer=null;this.emit();};
        if(immediate)finish();else this.stopTimer=setTimeout(finish,190);
      }
      this.emit();
    }
    async setDirection(direction){
      if(!MOStudyScore.PROFILES[direction]||direction===this.direction)return;
      const resume=this.intent;const old=this.score.snapshot();const seed=this.score.seed;
      this.stop(true);this.clearVoices();this.bank=null;this.direction=direction;
      this.score=new MOStudyScore.Score(direction,{nodes:this.nodes,seed});
      this.score.setSection(old.section);this.score.energy=old.energy;this.score.pan=0;
      old.memory.forEach(addr=>this.score.focus(addr));this.score.pendingFocus=null;
      this.score.focused=old.focused;this.score.visited=new Set(old.visited);this.score.setAssembly(old.assembly);
      this.stateText=resume?'Changing instruments…':'Sound is off';this.emit();
      if(resume)await this.start();
    }
    reset(){
      const playing=this.intent;this.stop(true);this.score=new MOStudyScore.Score(this.direction,{nodes:this.nodes,seed:0x600d});
      this.emit();if(playing)this.start();
    }
    setMaster(value,duration){
      if(!this.master)return;const now=this.context.currentTime;const p=this.master.gain;
      if(p.cancelAndHoldAtTime)p.cancelAndHoldAtTime(now);else{p.cancelScheduledValues(now);p.setValueAtTime(p.value,now);}
      p.linearRampToValueAtTime(value*this.masterScale,now+duration);
    }
    setVolume(value){this.volume=clamp(value);if(this.running)this.setMaster(this.volume,.08);this.emit();}
    tick(){
      if(!this.running||this.context.state!=='running')return;
      const start=performance.now(),now=this.context.currentTime;
      if(this.nextTime<now-.10){this.nextTime=now+.035;this.stats.late++;}
      let steps=0;
      while(this.nextTime<now+.12&&steps++<6){
        for(const event of this.score.next())this.voice(event,this.nextTime+event.delay);
        this.nextTime+=60/this.score.p.bpm/4;
      }
      if(now-this.lastMeter>.12){
        this.lastMeter=now;this.analyser.getFloatTimeDomainData(this.meter);
        let rms=0;for(const x of this.meter)rms+=x*x;this.level=clamp(Math.sqrt(rms/this.meter.length)*9);
      }
      this.maxScheduleMs=Math.max(this.maxScheduleMs,performance.now()-start);
    }
    voice(event,at){
      if(!this.bank||!this.running)return;
      const candidates=this.bank.byKind.get(event.kind);if(!candidates?.length)return;
      if(this.voices.size>=24){this.dropped++;return;}
      const key=event.kind+':'+event.note;
      let sample=this.bank.noteCache.get(key);
      if(!sample){sample=candidates.reduce((a,b)=>Math.abs(a.note-event.note)<=Math.abs(b.note-event.note)?a:b);this.bank.noteCache.set(key,sample);}
      const rate=event.kind==='wood'?1:2**((event.note-sample.note)/12);
      const available=sample.duration/rate;
      const duration=Math.min(available-.008,event.duration+.28);if(duration<=.015)return;
      const source=this.context.createBufferSource();source.buffer=this.bank.buffer;source.playbackRate.value=rate;
      // Reuse the envelope and panner, while creating the required one-shot source.
      const voice=this.freeVoices.pop()||this.makeVoice();
      const {gain,pan}=voice;voice.source=source;pan.pan.setValueAtTime(event.pan,at);
      gain.gain.cancelScheduledValues(this.context.currentTime);
      const peak=Math.min(.42,event.gain);
      gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(peak,at+.005);
      const release=Math.min(.42,duration*.3);gain.gain.setValueAtTime(peak,at+duration-release);gain.gain.linearRampToValueAtTime(0,at+duration);
      source.connect(gain);pan.connect(this.mixer);
      this.voices.add(voice);this.highWater=Math.max(this.highWater,this.voices.size);
      source.onended=()=>this.releaseVoice(voice,source);
      source.start(at,sample.offset,sample.duration);source.stop(at+duration+.005);this.stats.scheduled++;
      for(const fn of this.noteListeners)fn({...event,at,voiceCount:this.voices.size});
    }
    makeVoice(){const gain=this.context.createGain(),pan=this.context.createStereoPanner();gain.connect(pan);this.allocatedVoices++;return {source:null,gain,pan};}
    releaseVoice(voice,source){
      if(voice.source!==source)return;
      source.onended=null;source.disconnect();voice.pan.disconnect();voice.source=null;
      this.voices.delete(voice);this.freeVoices.push(voice);
    }
    clearVoices(){for(const v of this.voices){const source=v.source;try{source.stop();}catch{}this.releaseVoice(v,source);}}
    motion(amount,pan){if(this.running)this.score.motion(amount,pan);}
    focus(addr){if(this.running)this.score.focus(addr);}
    blur(){this.score.blur();}
    open(addr){if(this.running)this.score.open(addr);}
    gather(){if(this.running)return this.score.gather();return false;}
    assembly(value){this.score.setAssembly(value);}
    section(value){this.score.setSection(value);}
    destroy(){this.stop(true);document.removeEventListener('visibilitychange',this.visibility);window.removeEventListener('pagehide',this.pagehide);this.context?.close();this.freeVoices.forEach(v=>v.gain.disconnect());this.freeVoices=[];this.listeners.clear();this.noteListeners.clear();this.bank=null;}
  }
  window.MOGenerativeField=GenerativeField;
})();
