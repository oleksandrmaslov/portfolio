// Real-browser diagnostic runner; PLAYWRIGHT_MODULE points to an installed playwright package.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const path = require('node:path');
const out = __dirname;
const label = process.argv[2] || 'before';
const audioOnly = process.argv.includes('--audio-only');
const results = {label, samples:[], checks:[], errors:[], warnings:[]};
const save = () => fs.writeFileSync(path.join(out, label+'.json'), JSON.stringify(results,null,2));
function instrument() {
  window.__audit = {raf:{}, contexts:[], created:0, lost:0, ready:null};
  const original = HTMLCanvasElement.prototype.getContext;
  const seen = new WeakSet();
  HTMLCanvasElement.prototype.getContext = function(type,...args) {
    const ctx = original.call(this,type,...args);
    if(ctx && /webgl/.test(type) && !seen.has(ctx)) {
      seen.add(ctx); __audit.created++; __audit.contexts.push(new WeakRef(ctx));
      this.addEventListener('webglcontextlost',()=>__audit.lost++);
    }
    return ctx;
  };
  const raf=window.requestAnimationFrame;
  window.requestAnimationFrame=function(fn){return raf.call(window, t=>{const name=fn.name||'anonymous';__audit.raf[name]=(__audit.raf[name]||0)+1;fn(t);});};
  addEventListener('mo:preloader-done',()=>__audit.ready=performance.now());
}
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:false});
 const context=await browser.newContext({viewport:{width:1280,height:800},deviceScaleFactor:1});
 await context.addInitScript(instrument);
 const page=await context.newPage();
 page.on('pageerror',e=>{results.errors.push({url:page.url(),message:e.message});save();});
 page.on('console',m=>{if(m.type()==='warning'||m.type()==='error')results.warnings.push({url:page.url(),message:m.text()});});
 const cdp=await context.newCDPSession(page);await cdp.send('Performance.enable');await cdp.send('WebAudio.enable');let audioId;cdp.on('WebAudio.contextCreated',e=>audioId=e.context.contextId);
 const metrics=async()=>Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(x=>[x.name,x.value]));
 const state=()=>page.evaluate(()=>({url:location.pathname,viewport:[innerWidth,innerHeight],overflow:document.documentElement.scrollWidth>innerWidth,heap:performance.memory?.usedJSHeapSize,contexts:{created:__audit.created,lost:__audit.lost,live:__audit.contexts.filter(r=>{const g=r.deref();return g&&!g.isContextLost();}).length},figures:window.__asciiFigs?.length||0,raf:{...__audit.raf},dof:window.__mo_dofOn,dofFps:window.__mo_dofFps,audio:window.__mo_audio?.snapshot(),scroll:scrollY}));
 async function sample(name,ms=3000){
  const before=await metrics(); const s0=await state();
  await page.evaluate(()=>{window.__auditMutations=0;window.__auditObserver=new MutationObserver(rs=>window.__auditMutations+=rs.length);const el=document.querySelector(".asciiHero");if(el)__auditObserver.observe(el,{childList:true});});
  const frames=await page.evaluate(ms=>new Promise(resolve=>{let last=performance.now(),end=last+ms,ds=[];function tick(t){ds.push(t-last);last=t;if(t<end)requestAnimationFrame(tick);else resolve(ds);}requestAnimationFrame(tick);}),ms);
  const mutations=await page.evaluate(()=>{__auditObserver.disconnect();return __auditMutations;});
  const audioCpu=audioId?await cdp.send("WebAudio.getRealtimeData",{contextId:audioId}).catch(()=>null):null;
  const after=await metrics();const s1=await state();frames.sort((a,b)=>a-b);
  const delta={};for(const k of ['LayoutCount','RecalcStyleCount','LayoutDuration','RecalcStyleDuration','ScriptDuration','TaskDuration'])delta[k]=after[k]-before[k];
  const callbacks={};for(const [k,v] of Object.entries(s1.raf))callbacks[k]=v-(s0.raf[k]||0);
  const r={name,mutations,audioCpu,frames:frames.length,mean:frames.reduce((a,b)=>a+b,0)/frames.length,p95:frames[Math.floor(frames.length*.95)],over50:frames.filter(x=>x>50).length,metrics:delta,callbacks,state:s1}; results.samples.push(r);save();console.log(JSON.stringify({name,mean:r.mean,p95:r.p95,layout:delta.LayoutCount,contexts:s1.contexts,callbacks}));return r;
 }
 async function goto(route=''){
  await page.goto('http://localhost:8000/'+route,{waitUntil:'load'});
  await page.locator('.lp-menuToggle').waitFor();
  await page.waitForFunction(()=>!document.getElementById('mo-pl')||getComputedStyle(document.getElementById('mo-pl')).display==='none'||!document.getElementById('mo-pl').isConnected,{timeout:30000}).catch(()=>{});
  await page.waitForTimeout(2000);
 }
 async function check(name,value){results.checks.push({name,value});save();console.log(name,JSON.stringify(value).slice(0,800));}
 try {
 if (!audioOnly) {
 await goto();
 await check('environment',await page.evaluate(()=>{const g=document.querySelector('canvas').getContext('webgl2');const e=g.getExtension('WEBGL_debug_renderer_info');return {userAgent:navigator.userAgent,gpu:g.getParameter(e.UNMASKED_RENDERER_WEBGL),concurrency:navigator.hardwareConcurrency,memory:navigator.deviceMemory,ready:__audit.ready,navigation:performance.getEntriesByType('navigation')[0].toJSON(),resources:performance.getEntriesByType('resource').map(r=>({name:r.name,duration:r.duration,size:r.encodedBodySize}))};}));
 await sample('landing idle');
 const bounds=await page.evaluate(()=>window.__mo_universe.tileBounds('0x01'));await check('wafer bounds',bounds);
 if(bounds){await page.mouse.move(bounds.x+bounds.w/2,bounds.y+bounds.h/2);await page.waitForTimeout(500);await sample('landing hover');}
 await page.mouse.move(10,10);
 await page.getByRole('button',{name:'MENU',exact:true}).click();await page.waitForTimeout(1800);await sample('settled menu');
 await page.screenshot({path:path.join(out,'output/playwright',label+'-menu-desktop.png')});
 await page.keyboard.press('Escape');
 await check('escape returns focus',await page.locator('.lp-menuToggle').evaluate(el=>el===document.activeElement));
 for(let i=0;i<10;i++){await page.getByRole('button',{name:'MENU',exact:true}).click();await page.waitForTimeout(180);await page.keyboard.press('Escape');}
 await page.waitForTimeout(1500);await sample('after 10 menu cycles');
 await page.getByRole('button',{name:'MENU',exact:true}).focus();await page.keyboard.press('Enter');
 await page.locator('dialog a[href="#work"]').focus();await page.keyboard.press('Enter');await page.waitForTimeout(1500);
 await check('keyboard work',await page.evaluate(()=>({hash:location.hash,open:!!document.querySelector('dialog[open]'),overflow:document.body.style.overflow})));
 await goto('Iskra.html');
 const fig=page.locator('.ascii-fig--video').first();await fig.scrollIntoViewIfNeeded();await page.waitForTimeout(1500);
 await check('video initially plays',await fig.locator('video').evaluate(v=>!v.paused));
 await fig.getByRole('button',{name:'Pause clip'}).click();
 await page.evaluate(()=>scrollTo(0,0));await page.waitForTimeout(600);await fig.scrollIntoViewIfNeeded();await page.waitForTimeout(1200);
 await check('explicit pause persists',await fig.locator('video').evaluate(v=>v.paused));
 await sample('project media idle');
 await goto('Wafer.html');
 await page.mouse.move(0,0);
 for(let cycle=0;cycle<2;cycle++){
  const h=await page.evaluate(()=>document.documentElement.scrollHeight);
  for(let y=0;y<h;y+=650){await page.evaluate(y=>scrollTo(0,y),y);await page.waitForTimeout(100);}
  await page.evaluate(()=>scrollTo(0,0));await page.waitForTimeout(1000);await cdp.send('HeapProfiler.collectGarbage');await sample('wafer scroll cycle '+cycle,1500);
 }
 await page.setViewportSize({width:390,height:844});await page.emulateMedia({reducedMotion:'reduce'});await goto('Iskra.html');
 const reducedFig=page.locator('.ascii-fig--video').first();await reducedFig.scrollIntoViewIfNeeded();await page.waitForTimeout(1300);
 await check('reduced motion video paused',await reducedFig.locator('video').evaluate(v=>v.paused));
 await goto();await page.waitForTimeout(1000);await sample('mobile reduced landing');
 await page.getByRole('button',{name:'MENU',exact:true}).click();await page.waitForTimeout(600);await sample('mobile reduced menu',1500);await page.screenshot({path:path.join(out,'output/playwright',label+'-menu-mobile.png')});await page.keyboard.press('Escape');
 }
 await page.setViewportSize({width:1280,height:800});await page.emulateMedia({reducedMotion:'no-preference'});await goto();
 await page.locator('.lp-menuToggle').focus();await page.keyboard.press('Enter'); // Stable scene isolates audio CPU.
 await page.evaluate(()=>window.MOSound.toggleMute());await page.waitForFunction(()=>window.__mo_audio.running);
 await sample('sound on settled menu',10000);await page.waitForTimeout(45000);await sample('sound after minute',5000);
 await page.evaluate(()=>window.MOSound.toggleMute());await page.waitForTimeout(500);await sample('sound muted',3000);
 await check('audio off lifecycle',await page.evaluate(()=>({state:__mo_audio.snapshot(),timer:__mo_audio.timer,stopTimer:__mo_audio.stopTimer})));
 if(label === 'after') {
  for(const name of ['explicit pause persists','reduced motion video paused','escape returns focus'])assert.equal(results.checks.find(c=>c.name===name).value,true,name);
  assert.equal(results.samples.find(s=>s.name==='settled menu').mutations,0);
  assert.equal(results.samples.find(s=>s.name==='project media idle').callbacks['bound _loop'],0);
  assert.equal(results.errors.length,0);
 }
 } finally {save();await browser.close();}
})().catch(e=>{results.failure=e.stack;save();console.error(e);process.exitCode=1;});
