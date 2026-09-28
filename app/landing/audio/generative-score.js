/* Composed rules, played live. Musical memory is shared by every instrument. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.MOStudyScore=api;})(typeof window==='object'?window:globalThis,function(){
  'use strict';
  const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
  const PROFILES={
    workshop:{title:'Electric workshop',bpm:80,key:'D major',lead:'vibes',keys:'ep',
      chords:[[38,54,57,61,64],[47,54,57,61,62],[43,54,57,59,62],[45,52,55,59,62]],
      names:['Dmaj9','Bm9','Gmaj9','A6/9'],motif:[69,66,64,62,69,66,64,62],intervals:[0,2,4,7,9],center:62,pace:2},
    signal:{title:'Clear signal',bpm:100,key:'E♭ major',lead:'marimba',keys:'ep',
      chords:[[39,55,58,62,65],[36,55,58,62,63],[44,55,58,60,63],[46,53,55,60,62]],
      names:['E♭maj9','Cm9','A♭maj9','B♭6/9'],motif:[67,65,70,74,75,67,65,70],intervals:[0,2,4,7,9],center:63,pace:2},
    presence:{title:'Quiet presence',bpm:60,key:'C major',lead:'piano',keys:'piano',
      chords:[[48,55,59,62,64],[53,57,60,64,67],[50,57,60,64,65],[48,55,57,62,64]],
      names:['Cmaj9','Fmaj9','Dm9','C6/9'],motif:[67,64,62,60,64,67,72,67],intervals:[0,2,4,7,9],center:60,pace:2},
    universe:{title:'Common origin',bpm:72,key:'D · shared center',lead:'prism',keys:'ep',
      chords:[[38,57,62,66,69],[38,57,59,64,69],[38,55,59,62,66],[38,57,62,64,71]],
      names:['D · light','D · open','D · horizon','D · return'],motif:[69,66,64,62,57,64,66,62],intervals:[0,2,4,7,9],center:62,pace:3}
  };
  const DEFAULT_NODES=['0x01','0x02','0x03','0x04','0x05','0x06','0x07','0x08','0x09','0x0A','0x0C','0x0D'];
  class Score {
    constructor(direction='workshop',options={}) {
      if(!PROFILES[direction])throw new Error('Unknown direction');
      this.id=direction;this.p=PROFILES[direction];this.nodes=options.nodes||DEFAULT_NODES;
      this.seed=options.seed??0x600d;this.step=0;this.chord=0;this.energy=.12;this.pan=0;
      this.focused=null;this.memory=[];this.visited=new Set();this.resonance=new Float64Array(12);
      this.section='title';this.assembly=0;this.assemblyLatched=false;this.originAt=-1000;
      this.pendingOrigin=false;this.pendingFocus=null;this.pendingOpen=null;this.lastFocus=-100;
      this.coolUntil=0;this.openCount=0;this.lastOpen=-100;this.phrase=0;this.lastLead=null;this.events=[];this.emitted=0;
    }
    random(){let x=this.seed|0;x^=x<<13;x^=x>>>17;x^=x<<5;this.seed=x>>>0;return this.seed/4294967296;}
    motion(amount,pan=0){this.energy=clamp(this.energy+clamp(amount)*.16);this.pan=clamp(pan,-.75,.75);}
    nodeIndex(addr){return this.nodes.indexOf(addr);}
    focus(addr){
      if(!this.nodes.includes(addr)||addr===this.focused)return false;
      this.focused=addr;this.pendingFocus=addr;this.energy=clamp(this.energy+.1);
      this.memory=this.memory.filter(n=>n.addr!==addr);this.memory.push({addr,degree:this.nodeIndex(addr)%5});
      this.memory=this.memory.slice(-4);return true;
    }
    blur(){this.focused=null;}
    open(addr){if(!this.nodes.includes(addr))return false;this.focus(addr);this.pendingFocus=null;this.pendingOpen=addr;this.visited.add(addr);this.openCount++;this.energy=clamp(this.energy+.12);return true;}
    setSection(section){this.section=section||'title';}
    setAssembly(value){this.assembly=clamp(value);if(value<.12)this.assemblyLatched=false;if(value>.75&&!this.assemblyLatched){this.assemblyLatched=true;this.gather();}}
    gather(){if(this.step-this.originAt<64||this.pendingOrigin)return false;this.pendingOrigin=true;this.assemblyLatched=true;return true;}
    noteFor(addr,chord=this.chord){
      const idx=Math.max(0,this.nodeIndex(addr));const wanted=this.p.center+this.p.intervals[idx%5]+(idx>7?12:0);
      const pcs=this.p.chords[chord].slice(1).map(n=>n%12);const candidates=[];
      for(let n=this.p.center-2;n<=this.p.center+15;n++)if(pcs.includes(n%12))candidates.push(n);
      return candidates.sort((a,b)=>Math.abs(a-wanted)-Math.abs(b-wanted))[0];
    }
    chooseChord(){
      // Curated transitions keep harmonic direction; accumulated sounded notes
      // and remembered projects change which continuation is selected.
      const graph=[[1,2,3],[2,0],[3,0,1],[0,2]];
      const candidates=graph[this.chord];let winner=candidates[0],best=-Infinity;
      for(const c of candidates){
        const pcs=this.p.chords[c].slice(1).map(n=>n%12);
        let weight=.5+this.random()*.6;
        for(const pc of pcs)weight+=this.resonance[pc]*.25;
        for(const m of this.memory){const desired=(this.p.center+this.p.intervals[m.degree])%12;if(pcs.includes(desired))weight+=.22;}
        if(this.openCount&&c===this.openCount%4)weight+=.65;
        if(c===0&&this.energy<.15)weight+=.6;
        if(weight>best){best=weight;winner=c;}
      }
      this.chord=winner;
    }
    emit(kind,note,gain,duration,pan=0,role='atmosphere',delay=0){
      if(!Number.isFinite(note)||gain<=0)return;
      const event={kind,note,gain,duration,pan:clamp(pan,-.8,.8)*(1-this.assembly*.92),role,delay,step:this.step,chord:this.chord};
      this.events.push(event);this.emitted++;
      if(kind!=='wood'&&kind!=='pulse')this.resonance[((note%12)+12)%12]=Math.min(3,this.resonance[note%12]+gain*.9);
    }
    chordNotes(kind,notes,gain,duration,spread=.3,role='atmosphere'){
      notes.forEach((n,i)=>this.emit(kind,n,gain*(1-.06*(i%3)),duration,(i/(notes.length-1||1)-.5)*spread*2,role,i*.016));
    }
    next(){
      this.events=[];
      this.energy=.07+(this.energy-.07)*.985;
      for(let i=0;i<12;i++)this.resonance[i]*=.993;
      const pos=this.step%16,bar=Math.floor(this.step/16),beat=60/this.p.bpm;
      const reading=['about','contact','reading'].includes(this.section);
      if(this.pendingOrigin&&pos%4===0){this.pendingOrigin=false;this.originAt=this.step;this.chord=0;this.coolUntil=this.step+32;this.phrase=0;}
      const forming=this.step-this.originAt>=0&&this.step-this.originAt<32;
      if(pos===0&&!forming&&bar>0&&bar%this.p.pace===0){this.chooseChord();this.phrase=(this.phrase+1+this.memory.length)%4;}
      const ch=this.p.chords[this.chord],activity=clamp(this.energy),level=reading?.60:1;
      const occupied=this.step<this.coolUntil||forming;
      // Harmony never disappears at rest. Activity changes articulation and
      // register, not a volume escalation proportional to pointer speed.
      if(this.id==='workshop'){
        if(pos===0){this.chordNotes('ep',ch.slice(1),.23*level,3.65,.33);this.emit('bass',ch[0],.35*level,2.6);}
        if(pos===12&&!reading&&!occupied&&activity>.34){this.chordNotes('ep',ch.slice(2),.085,1.5,.25);this.emit('bass',ch[0]+12,.12,.65);}
        if([0,8,14].includes(pos)&&!reading&&!occupied&&activity>.17)this.emit('wood',1+(bar+pos)%3,.045+activity*.025,.4,pos===8?-.2:.2,'pulse');
        if(pos===0&&bar%4===0)this.chordNotes('silk',[ch[2],ch[4]],.075*level,6.4,.50);
      } else if(this.id==='signal'){
        if(pos===0){this.chordNotes('silk',ch.slice(1),.14*level,3.2,.4);this.emit('bass',ch[0],.30*level,2);}
        if([4,10,14].includes(pos)&&!reading&&!occupied&&activity>.14)this.emit('wood',1+(pos+bar)%3,pos===4?.085:.037,.38,pos===4?-.25:.25,'pulse');
        if(pos===0&&!reading&&activity>.35&&!occupied)this.emit('pulse',39,.15,.2,0,'pulse');
        if([2,8,13].includes(pos)&&!occupied&&(!reading||pos===8)){
          const i=(pos+bar+this.memory.length)%4+1,n=ch[i];
          this.emit('marimba',n,(.11+activity*.06)*level,1.2,(pos%2?-.3:.3),'pattern');
          if(activity>.42&&!reading)this.emit('pluck',n+12,.038,.75,-.15,'pattern',.008);
        }
      } else if(this.id==='presence'){
        if(pos===0)this.emit('piano',ch[0],.19*level,4.6,-.17);
        const phrasing=[[1,4,9,13],[2,6,11],[1,7,12],[3,8,14]][this.phrase];
        const i=phrasing.indexOf(pos);
        if(i>=0&&(!occupied||i===0))this.emit('piano',ch[1+(i+bar%2)%4],(.15-i*.014)*level,3.9,[-.24,.21,-.08,.27][i],'atmosphere',i*.009);
        if(pos===0&&bar%2===0)this.chordNotes('silk',[ch[1],ch[3]],.065*level,7,.48);
      } else {
        if(pos===0&&bar%2===0){this.chordNotes('bloom',ch.slice(1),.16*level,7,.64);this.emit('bass',38,.15*level,3.3);}
        if([3,11].includes(pos)&&!occupied&&(!reading||pos===3)){
          const i=1+(bar+pos+this.memory.length)%4,n=ch[i]+(activity>.5?12:0);
          this.emit('prism',n,.10*level,3.8,pos===3?-.57:.57,'pattern');
          if(activity>.38)this.emit('prism',ch[1+(i+1)%4],.043,2.5,pos===3?.45:-.45,'answer',beat*.75);
        }
      }
      // Interaction enters the same voicing and melody budget. The background
      // yields its next ornament to an opening or focus response.
      if(this.pendingOpen&&pos%2===0&&!forming&&this.step-this.lastOpen>=8){
        const addr=this.pendingOpen;this.pendingOpen=null;this.lastOpen=this.step;this.coolUntil=this.step+12;
        const n=this.noteFor(addr);this.emit(this.p.keys,ch[1]+12,.22,1.6,this.pan,'open');
        this.emit(this.p.lead,n,.23,1.8,this.pan*.5,'open',.11);
        this.emit(this.p.lead,ch[4]+12,.12,1.5,0,'open',.27);this.lastLead=n;
      }else if(this.pendingFocus&&this.step-this.lastFocus>=6&&pos%2===0&&!forming){
        const n=this.noteFor(this.pendingFocus);this.pendingFocus=null;this.lastFocus=this.step;this.coolUntil=this.step+5;
        this.emit(this.p.lead,n,this.id==='presence'?.18:.16,1.6,this.pan,'focus');this.lastLead=n;
      } else if(!occupied&&!reading&&[6,14].includes(pos)&&this.random()<(this.memory.length?.60:.24)){
        const remembered=this.memory.length?this.memory[(bar+this.phrase)%this.memory.length].addr:null;
        let n=remembered?this.noteFor(remembered):this.p.motif[(bar+pos)%this.p.motif.length];
        if(this.lastLead!==null&&Math.abs(n-this.lastLead)>9)n+=n>this.lastLead?-12:12;
        this.emit(this.p.lead,n,.10+activity*.035,this.id==='presence'?3.5:2.5,(this.random()-.5)*.75,'memory');this.lastLead=n;
      }
      if(forming){
        const elapsed=this.step-this.originAt;
        if(elapsed===0){this.pendingFocus=null;this.pendingOpen=null;this.chordNotes(this.id==='universe'?'bloom':this.p.keys,this.p.chords[0].slice(1),.12,5,.15,'origin');}
        if(elapsed%4===0){
          const i=elapsed/4;
          // First fragments belong to recently encountered projects. The final
          // half restores the authored identity so the result still resolves.
          const n=i<3&&this.memory.length?this.noteFor(this.memory[i%this.memory.length].addr,0):this.p.motif[i];
          const pan=(i%2?1:-1)*.65*(1-i/7);
          this.emit(this.p.lead,n,.23,this.id==='universe'?3.8:2.8,pan,'origin');
          if(this.id==='workshop'||this.id==='signal')this.emit('ep',n,.08,2.3,pan*.5,'origin',.018);
        }
      }
      this.step++;return this.events;
    }
    snapshot(){return {direction:this.id,title:this.p.title,bpm:this.p.bpm,chord:this.p.names[this.chord],chordIndex:this.chord,energy:this.energy,focused:this.focused,memory:this.memory.map(x=>x.addr),visited:[...this.visited],section:this.section,assembly:this.assembly,forming:this.step-this.originAt<32,step:this.step,emitted:this.emitted,resonance:[...this.resonance]};}
  }
  return {Score,PROFILES,DEFAULT_NODES};
});
