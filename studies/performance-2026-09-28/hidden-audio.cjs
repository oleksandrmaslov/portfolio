// Real hidden-tab audio check over raw CDP.
// Playwright keeps every page it attaches to visible (document.hidden stays
// false after bringToFront, window minimise or focus-emulation changes), which
// is why the audio tail of navigation-qa.cjs failed. A plain Chrome driven over
// a bare DevTools socket does hide a tab when another tab takes the foreground.
const {spawn}=require('node:child_process');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict');
const PORT=9336,URL='http://localhost:8000/',headless=!process.argv.includes('--headed');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'mo-hidden-audio-'));
 // Without these, installed extensions in a fresh profile can hold the first
 // navigation indefinitely on this machine.
 const args=[`--remote-debugging-port=${PORT}`,`--user-data-dir=${profile}`,'--no-first-run','--no-default-browser-check','--window-size=1280,800',
  '--disable-extensions','--disable-component-extensions-with-background-pages','--disable-default-apps','--disable-sync',
  '--password-store=basic','--disable-background-networking','--no-service-autorun','--disable-search-engine-choice-screen'];
 if(headless)args.push('--headless=new');
 const chrome=spawn('google-chrome',[...args,'about:blank'],{stdio:'ignore'});
 const result={headless,steps:[]};
 let ws;
 try{
  // The DevTools endpoint can accept a connection before it answers, so every
  // probe is bounded.
  let version;for(let i=0;i<60&&!version;i++){await sleep(250);try{version=await (await fetch(`http://127.0.0.1:${PORT}/json/version`,{signal:AbortSignal.timeout(1000)})).json();}catch{}}
  assert.ok(version,'Chrome DevTools endpoint');
  ws=new WebSocket(version.webSocketDebuggerUrl);await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j;});
  let id=0;const pending=new Map(),events=[];
  ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id&&pending.has(m.id)){pending.get(m.id)(m);pending.delete(m.id);}else if(m.method)events.push(m);};
  const send=(method,params={},sessionId)=>new Promise((r,j)=>{const i=++id;const t=setTimeout(()=>{pending.delete(i);j(new Error(method+': no reply'));},15000);pending.set(i,m=>{clearTimeout(t);m.error?j(new Error(method+': '+m.error.message)):r(m.result);});ws.send(JSON.stringify({id:i,method,params,sessionId}));});
  const {targetInfos}=await send('Target.getTargets');const target=targetInfos.find(t=>t.type==='page');
  const {sessionId}=await send('Target.attachToTarget',{targetId:target.targetId,flatten:true});
  await send('Runtime.enable',{},sessionId);
  const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true},sessionId);if(r.exceptionDetails)throw new Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value;};
  const until=async(expression,ms=30000)=>{const t0=Date.now();while(Date.now()-t0<ms){if(await evaluate(expression).catch(()=>false))return;await sleep(50);}throw new Error('timed out: '+expression);};
  const click=async label=>{
   const box=await evaluate(`(()=>{const b=[...document.querySelectorAll('button')].find(b=>b.getAttribute('aria-label')===${JSON.stringify(label)});if(!b)return null;const r=b.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})()`);
   assert.ok(box,'button '+label);
   for(const type of ['mousePressed','mouseReleased'])await send('Input.dispatchMouseEvent',{type,x:box.x,y:box.y,button:'left',clickCount:1},sessionId);
  };
  const state=()=>evaluate('({hidden:document.hidden,visibility:document.visibilityState,running:__mo_audio.running,intent:__mo_audio.intent,contextState:__mo_audio.context?.state,timer:__mo_audio.timer,voices:__mo_audio.snapshot().voices})');
  await send('Page.navigate',{url:URL},sessionId);
  await until("document.readyState==='complete'&&!document.getElementById('mo-pl')&&!!window.__mo_audio");
  await click('Enable sound');await until('__mo_audio.running');
  for(let i=0;i<8;i++){await click('Mute sound');await sleep(30);await click('Enable sound');await until('__mo_audio.running');}
  result.steps.push({step:'eight rapid toggles, running',...await state()});
  // A foreground tab in the same window hides this one for real.
  const other=await send('Target.createTarget',{url:'about:blank',newWindow:false,background:false});
  await sleep(500);
  const hidden=await state();result.steps.push({step:'another tab in front',...hidden});
  assert.equal(hidden.hidden,true,'the landing tab is really hidden');
  assert.equal(hidden.running,false);assert.equal(hidden.intent,false);
  assert.equal(hidden.contextState,'suspended');assert.equal(hidden.timer,null);
  await send('Target.closeTarget',{targetId:other.targetId});await sleep(500);
  const back=await state();result.steps.push({step:'tab visible again',...back});
  assert.equal(back.hidden,false);assert.equal(back.running,false,'sound restarts only by an explicit press');
  await click('Enable sound');await until('__mo_audio.running');
  result.steps.push({step:'explicit restart',...await state()});
  result.pass=true;
 }catch(e){result.failure=e.stack;process.exitCode=1;}
 finally{
  fs.writeFileSync(path.join(__dirname,'hidden-audio.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
  try{ws?.close();}catch{}const exited=new Promise(r=>chrome.once('exit',r));chrome.kill();await Promise.race([exited,sleep(3000)]);
  fs.rmSync(profile,{recursive:true,force:true,maxRetries:5,retryDelay:200});
 }
})();
