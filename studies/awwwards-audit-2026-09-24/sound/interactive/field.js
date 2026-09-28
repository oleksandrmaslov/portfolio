(()=>{'use strict';
  const $=id=>document.getElementById(id);
  const projects=(window.MO_PROJECTS||[]).filter(p=>p.universe!==false);
  const params=new URLSearchParams(location.search),initial=params.get('direction');
  const direction=MOStudyScore.PROFILES[initial]?initial:'workshop';
  const engine=window.soundField=new MOGenerativeField({direction,nodes:projects.map(p=>p.addr)});
  const descriptions={workshop:'Warm keys, a wooden pulse, and phrases shaped by the projects you visit.',signal:'Syncopated marimba and electronics. Your route changes the rhythmic answer.',presence:'Piano with time to breathe. A project’s notes return in the next phrase.',universe:'A luminous field around one musical center. Distant voices gather into 0x00.'};
  const field=$('field'),canvas=$('space'),ctx=canvas.getContext('2d'),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const positions=projects.map((p,i)=>{const angle=-Math.PI/2+i/projects.length*Math.PI*2;return {...p,x:50+Math.cos(angle)*36,y:46+Math.sin(angle)*35};});
  let width=0,height=0,frame=0,lastFrame=0,lastMove=0,previous=null,focus=null,assembly=0,assemblyTarget=0,reading=false;
  let running=false,statusText='',lastEngineStatus='',memory=[],pulses=[];
  for(const p of positions){
    const b=document.createElement('button');b.className='node';b.style.left=p.x+'%';b.style.top=p.y+'%';b.dataset.addr=p.addr;b.setAttribute('aria-label',`Develop ${p.name}'s musical phrase, ${p.addr}`);
    const addr=document.createElement('span');addr.className='addr';addr.textContent=p.addr;const name=document.createElement('span');name.className='name';name.textContent=p.name;b.append(addr,name);$('nodes').append(b);
    const meet=()=>{focus=p.addr;engine.focus(p.addr);document.querySelectorAll('.node').forEach(n=>n.classList.toggle('is-focus',n===b));$('field-hint').textContent=`${p.addr} · ${p.name} · select to develop the phrase`;};
    b.addEventListener('pointerenter',meet);b.addEventListener('focus',meet);
    b.addEventListener('click',()=>{meet();engine.open(p.addr);if(engine.running){statusText=`${p.name} joins the musical memory.`;$('status').textContent=statusText;}});
    b.addEventListener('pointerleave',()=>engine.blur());
  }
  function choose(id){document.querySelectorAll('[data-direction]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.direction===id)));$('character').textContent=descriptions[id];$('portfolio-link').href=`universe.html?direction=${id}`;}
  document.querySelectorAll('[data-direction]').forEach(b=>b.addEventListener('click',()=>{choose(b.dataset.direction);engine.setDirection(b.dataset.direction);history.replaceState(null,'',`?direction=${b.dataset.direction}`);}));choose(direction);
  $('start').addEventListener('click',()=>engine.intent?engine.stop():engine.start());
  $('volume').addEventListener('input',()=>{engine.setVolume(Number($('volume').value)/100);$('volume-value').textContent=$('volume').value+'%';});
  $('reading').addEventListener('click',()=>{reading=!reading;$('reading').setAttribute('aria-pressed',String(reading));engine.section(reading?'reading':'title');});
  $('origin').addEventListener('click',()=>{if(!engine.running){$('status').textContent='Start sound first, then gather the voices.';return;}assemblyTarget=assemblyTarget?0:1;if(assemblyTarget)engine.gather();$('origin-label').textContent=assemblyTarget?'Release the field':'Gather the voices';if(reduced){assembly=assemblyTarget;engine.assembly(assembly);}wake();});
  $('reset').addEventListener('click',()=>{assembly=assemblyTarget=0;focus=null;reading=false;$('reading').setAttribute('aria-pressed','false');$('origin-label').textContent='Gather the voices';document.querySelectorAll('.node').forEach(n=>n.classList.remove('is-focus'));engine.reset();});
  field.addEventListener('pointermove',e=>{const now=performance.now();if(now-lastMove<45)return;const rect=field.getBoundingClientRect();if(previous){const speed=Math.hypot(e.clientX-previous.x,e.clientY-previous.y)/Math.max(16,now-lastMove);engine.motion(Math.min(1,speed/2),(e.clientX-rect.left)/rect.width*1.5-.75);}previous={x:e.clientX,y:e.clientY};lastMove=now;},{passive:true});
  field.addEventListener('pointerleave',()=>{previous=null;engine.blur();});
  engine.onState(s=>{
    running=s.running;$('start').textContent=s.loading?'Cancel loading':s.intent?'Stop sound':'Start sound';
    if(s.status!==lastEngineStatus){$('status').textContent=s.status;statusText=s.status;lastEngineStatus=s.status;}
    $('harmony').textContent=`${s.chord} · ${s.bpm} BPM`;$('voices').textContent=`${s.voices} / 24`;$('memory').textContent=s.memory.join(' · ')||'none yet';$('audio-state').textContent=s.contextState;$('bank-size').textContent=(s.decodedBytes/1e6).toFixed(1)+' MB';
    memory=s.memory;document.querySelectorAll('.node').forEach(b=>b.classList.toggle('is-memory',memory.includes(b.dataset.addr)));
    if(running){$('field-hint').textContent=focus?$('field-hint').textContent:'Meet a project. Its notes will stay with you.';wake();}else{cancelAnimationFrame(frame);frame=0;draw(performance.now());}
  });
  engine.onNote(e=>{const index=Math.abs(e.note+e.chord)%positions.length;pulses.push({at:performance.now()+Math.max(0,e.at-engine.context.currentTime)*1000,from:positions.find(p=>p.addr===focus)||positions[index],note:e.note,origin:e.role==='origin',life:e.role==='origin'?1800:1100});pulses=pulses.slice(-32);wake();});
  function draw(now){
    ctx.clearRect(0,0,width,height);const cx=width*.5,cy=height*.46;
    ctx.lineWidth=1;
    for(const p of positions){const x=p.x/100*width,y=p.y/100*height;ctx.strokeStyle=memory.includes(p.addr)?'rgba(0,240,200,.18)':'rgba(122,132,153,.09)';ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(x,y);ctx.stroke();}
    // A finite set of particles belongs to the same origin. Music gives each
    // brief motion; they do not spawn persistent shader work or noise layers.
    for(let i=0;i<68;i++){
      const a=i*2.399963,rad=(.16+(i%11)/11*.27)*(1-assembly*.82),drift=reduced?0:Math.sin(now*.00017+i)*.008;
      const x=cx+Math.cos(a+drift)*width*rad,y=cy+Math.sin(a+drift)*height*rad;
      ctx.fillStyle=`rgba(0,240,200,${.18+(i%4)*.045})`;ctx.fillRect(x,y,1.4,1.4);
    }
    pulses=pulses.filter(p=>now-p.at<p.life);
    for(const p of pulses){const t=(now-p.at)/p.life;if(t<0)continue;const ease=1-(1-t)**3;const x0=p.from.x/100*width,y0=p.from.y/100*height;
      const travel=p.origin?ease:Math.min(.45,ease*.45);const x=x0+(cx-x0)*travel,y=y0+(cy-y0)*travel;
      ctx.fillStyle=`rgba(0,240,200,${Math.max(0,(1-t)*.65)})`;ctx.beginPath();ctx.arc(x,y,reduced?2:2.2+(1-t)*1.2,0,Math.PI*2);ctx.fill();
    }
  }
  function tick(now){frame=0;if(now-lastFrame>=32){lastFrame=now;if(!reduced){assembly+=(assemblyTarget-assembly)*.025;engine.assembly(assembly);}draw(now);}if(running&&!document.hidden)frame=requestAnimationFrame(tick);}
  function wake(){if(!frame&&running&&!document.hidden)frame=requestAnimationFrame(tick);}
  const resize=new ResizeObserver(()=>{const r=field.getBoundingClientRect();width=r.width;height=r.height;const dpr=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);draw(performance.now());});resize.observe(field);
  window.addEventListener('pagehide',()=>{cancelAnimationFrame(frame);frame=0;});
})();
