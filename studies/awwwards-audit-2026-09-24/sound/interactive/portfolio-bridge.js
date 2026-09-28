/* Local audition only. The canonical landing/audio sources remain unchanged. */
(()=>{'use strict';
  const query=new URLSearchParams(location.search),requested=query.get('direction');
  const direction=MOStudyScore.PROFILES[requested]?requested:'workshop';
  const engine=window.soundField=new MOGenerativeField({direction,nodes:(window.MO_PROJECTS||[]).filter(p=>p.universe!==false).map(p=>p.addr)});
  // The old wind layer reads MOSound.ctx and connects straight to destination.
  // This adapter deliberately doesn't expose the new context to that layer.
  window.MOSound={init:()=>null,unlock:()=>{},isMuted:()=>!engine.intent,getVolume:()=>engine.volume,
    toggleMute:()=>engine.intent?engine.stop():engine.start(),carrier:on=>{if(on&&!engine.intent)engine.start();else if(!on&&engine.intent)engine.stop();},
    onState:fn=>engine.onState(s=>fn({muted:!s.intent,volume:s.volume})),getLevel:()=>engine.level,
    hover:addr=>engine.focus(addr),unhover:()=>engine.blur(),open:addr=>engine.open(addr),gather:()=>engine.gather(),
    thock:()=>engine.motion(.04),thockUp:()=>{},get ctx(){return null;}};
  let moveAt=0,last=null,reel=null,assemblyTimer=null;
  addEventListener('pointermove',e=>{const now=performance.now();if(now-moveAt<55)return;if(last&&engine.running){engine.motion(Math.min(1,Math.hypot(e.clientX-last.x,e.clientY-last.y)/Math.max(20,now-moveAt)/2),e.clientX/innerWidth*1.5-.75);}last={x:e.clientX,y:e.clientY};moveAt=now;},{passive:true});
  // Wheel contributes energy, but does not allocate one voice per event.
  addEventListener('wheel',e=>engine.motion(Math.min(.7,Math.abs(e.deltaY)/500),0),{passive:true});
  addEventListener('mo:section',e=>{const section=e.detail?.section||'title';engine.section(section);if(window.__mo_disturb)window.__mo_disturb(innerWidth/2,innerHeight*.5,.45);});
  addEventListener('mo:reelStop',e=>{const addr=e.detail?.addr;if(addr!==reel){reel=addr;if(addr)engine.focus(addr);else engine.blur();}
    if(e.detail?.stop>=(window.MO_FEATURED_ADDRS||[]).length+1){engine.gather();if(window.__mo_disturb)window.__mo_disturb(innerWidth/2,innerHeight*.45,1.15);}});
  engine.onState(s=>{
    if(s.running&&!assemblyTimer)assemblyTimer=setInterval(()=>{const d=window.__mo_debug||{};engine.assembly(d.mode==='origin'?(d.formP||0):0);},150);
    if(!s.running&&assemblyTimer){clearInterval(assemblyTimer);assemblyTimer=null;}
  });
  // A base URL lets the unchanged GLBs, scripts and fonts resolve from this
  // private route. Keep in-page fragment navigation in this audition document.
  document.addEventListener('click',e=>{
    if(e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
    const a=e.target.closest('a');const href=a?.getAttribute('href');if(!href?.startsWith('#'))return;
    const target=document.getElementById(href.slice(1));if(!target)return;e.preventDefault();target.scrollIntoView({behavior:'smooth',block:'start'});history.replaceState(null,'',location.pathname+location.search+href);
  });
  function panel(){
    const box=document.createElement('details');box.className='sound-preview';box.open=true;
    box.innerHTML='<summary>Sound study <span class="preview-name"></span></summary><div class="preview-body"><label for="preview-direction">Direction</label><select id="preview-direction"></select><div class="preview-row"><button id="preview-start">Start sound</button><a href="studies/awwwards-audit-2026-09-24/sound/interactive/">Sound field</a></div><label for="preview-volume">Volume</label><input id="preview-volume" type="range" min="0" max="100" value="55"><p class="preview-status" role="status">Sound is off</p></div>';
    document.body.append(box);
    const select=box.querySelector('select'),start=box.querySelector('button'),status=box.querySelector('.preview-status');
    for(const [id,p]of Object.entries(MOStudyScore.PROFILES)){const o=document.createElement('option');o.value=id;o.textContent=p.title;select.append(o);}select.value=direction;
    select.addEventListener('change',()=>{engine.setDirection(select.value);history.replaceState(null,'',location.pathname+'?direction='+select.value+location.hash);});
    start.addEventListener('click',()=>engine.intent?engine.stop():engine.start());
    box.querySelector('input').addEventListener('input',e=>engine.setVolume(Number(e.target.value)/100));
    let previous='';engine.onState(s=>{box.querySelector('.preview-name').textContent=s.title;start.textContent=s.loading?'Cancel loading':s.intent?'Stop sound':'Start sound';const text=s.running?s.chord+' · responding to the universe':s.status;if(text!==previous){status.textContent=text;previous=text;}});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',panel,{once:true});else panel();
})();
