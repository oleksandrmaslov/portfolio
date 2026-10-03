const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const result={routes:[],mobile:[],errors:[]},base='http://localhost:8000/',dir=__dirname;
const save=()=>fs.writeFileSync(path.join(dir,'menu-qa.json'),JSON.stringify(result,null,2));
function instrument(){
 window.__mq={canvases:[],frames:0,draws:0};const get=HTMLCanvasElement.prototype.getContext;
 HTMLCanvasElement.prototype.getContext=function(type,...args){const ctx=get.call(this,type,...args);if(ctx&&/webgl/.test(type)&&!__mq.canvases.includes(this))__mq.canvases.push(this);return ctx;};
 let factory;Object.defineProperty(window,'createMenuObjects',{configurable:true,get:()=>factory,set(fn){factory=function(...args){
  const api=fn(...args),render=args[1].render,frame=api.frame;let active=false;
  args[1].render=function(scene,camera){if(active){__mq.draws++;__mq.groups=scene.children.filter(x=>x.isGroup).map(x=>({rotation:x.rotation.toArray().slice(0,3),children:x.children.length}));}return render.call(this,scene,camera);};
  api.frame=function(now){__mq.frames++;active=true;try{return frame.call(this,now);}finally{active=false;}};return api;
 };}});
}
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:process.env.HEADLESS!=='0',ignoreDefaultArgs:['--disable-back-forward-cache']});try{
 const ctx=await browser.newContext({viewport:{width:1280,height:800}});await ctx.addInitScript(instrument);const p=await ctx.newPage();
 p.on('pageerror',e=>{result.errors.push({url:p.url(),error:e.message});save();});
 async function ready(){await p.locator('.lp-menuToggle').waitFor();await p.waitForFunction(()=>!document.getElementById('mo-pl'));await p.evaluate(()=>document.fonts.ready);}
 async function open(){await p.locator('.lp-menuToggle').focus();await p.keyboard.press('Enter');await p.waitForFunction(()=>document.querySelector('dialog').dataset.liveObjects==='true');await p.waitForTimeout(250);}
 async function state(){return p.evaluate(()=>({live:document.querySelector('dialog').dataset.liveObjects,canvas:document.querySelector('dialog canvas')===window.__mq.canvases[0],groups:__mq.groups,contexts:__mq.canvases.length,liveContexts:__mq.canvases.filter(c=>!c.getContext('webgl2')?.isContextLost()).length,frames:__mq.frames,draws:__mq.draws,ready:[...document.querySelectorAll('[data-menu-object]')].map(e=>e.dataset.modelReady)}));}
 const routes=['',...fs.readdirSync(path.resolve(dir,'../..')).filter(x=>x.endsWith('.html')&&!['face-test.html','index.html'].includes(x))];
 for(const route of routes){
  await p.goto(base+encodeURI(route));await ready();await p.waitForTimeout(500);
  const start=await p.evaluate(()=>({contexts:__mq.canvases.length,hero:!!(window.__pageRig||window.__waferRig),threeRequests:performance.getEntriesByType('resource').filter(e=>/three@/.test(e.name)).length}));
  const time=Date.now();await open();const liveMs=Date.now()-time;
  await p.waitForFunction(()=>[...document.querySelectorAll('[data-menu-object]')].every(e=>e.dataset.modelReady==='true'));
  const opened=await state(),modelsMs=Date.now()-time;
  assert.deepEqual(opened.ready,['true','true','true','true'],route);assert.deepEqual(opened.groups.map(g=>g.children),[1,1,1,3],route);
  const borrowed=await p.evaluate(()=>{const rig=window.__pageRig||window.__waferRig;return rig?rig.el===document.querySelector('dialog canvas'):null;});
  if(start.hero)assert.equal(borrowed,true,route+' borrows hero');
  const focus=[];for(let i=0;i<8;i++){await p.keyboard.press('Tab');focus.push(await p.evaluate(()=>document.activeElement.tagName==='BODY'||!!document.activeElement.closest('dialog')));}assert.ok(focus.every(Boolean));
  await p.getByRole('button',{name:'Close menu'}).focus();await p.waitForTimeout(400);const a=await state();await p.waitForTimeout(1100);const b=await state();assert.equal(b.draws-a.draws,0,route+' idle draws');
  if(['','Iskra.html'].includes(route))await p.screenshot({path:path.join(dir,'output/playwright/menu-restored-'+(route?'project':'landing')+'-desktop.png')});
  await p.keyboard.press('Escape');assert.ok(await p.locator('.lp-menuToggle').evaluate(e=>e===document.activeElement));
  const returned=await p.evaluate(()=>{const rig=window.__pageRig||window.__waferRig;return rig?!rig.el.closest('dialog'):true;});assert.equal(returned,true);
  result.routes.push({route:route||'/',start,liveMs,modelsMs,borrowed,contexts:opened.contexts,groups:opened.groups.map(g=>g.children),idleFrames:b.frames-a.frames,idleDraws:b.draws-a.draws,keyboard:true,returned});save();console.log('menu',route||'/');
 }
 // Match the owner's 657×521 capture: two rows visible, the rest scrollable.
 await p.setViewportSize({width:657,height:521});await p.goto(base+'Iskra.html');await ready();await open();
 await p.waitForFunction(()=>[...document.querySelectorAll('[data-menu-object]')].every(e=>e.dataset.modelReady==='true'));
 const compact=await p.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,links:document.querySelectorAll('dialog nav a').length,scrollable:document.querySelector('dialog').scrollHeight>document.querySelector('dialog').clientHeight}));
 assert.equal(compact.overflow,false);assert.equal(compact.links,4);assert.equal(compact.scrollable,true);
 await p.screenshot({path:path.join(dir,'output/playwright/menu-restored-project-657x521.png')});
 await p.keyboard.press('Escape');result.compact=compact;save();await p.setViewportSize({width:1280,height:800});
 // Repeated opens keep the same renderer and context count; resize restores the hero buffer.
 await p.goto(base+'Iskra.html');await ready();await open();const first=await state();await p.evaluate(()=>window.__mq.firstCanvas=document.querySelector('dialog canvas'));await p.keyboard.press('Escape');
 for(let i=0;i<20;i++){await open();assert.equal(await p.evaluate(()=>__mq.firstCanvas===document.querySelector('dialog canvas')),true);await p.keyboard.press('Escape');}
 await open();await p.setViewportSize({width:390,height:844});await p.waitForTimeout(300);await p.keyboard.press('Escape');await p.waitForTimeout(500);
 const end=await state();assert.equal(end.contexts,first.contexts);const size=await p.evaluate(()=>({canvas:__pageRig.el.clientWidth,mount:__pageRig.el.parentNode.clientWidth,inside:!!__pageRig.el.closest('dialog')}));assert.equal(size.inside,false);assert.equal(size.canvas,size.mount);
 result.repeat={opens:20,contextsBefore:first.contexts,contextsAfter:end.contexts,resize:size};save();await ctx.close();
 for(const reducedMotion of ['no-preference','reduce']){
  const mobile=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,reducedMotion});await mobile.addInitScript(instrument);const m=await mobile.newPage();m.on('pageerror',e=>result.errors.push({url:m.url(),error:e.message}));
  for(const route of ['','Wafer.html','All Projects.html']){
   await m.goto(base+encodeURI(route));await m.locator('.lp-menuToggle').waitFor();await m.waitForFunction(()=>!document.getElementById('mo-pl'));await m.locator('.lp-menuToggle').tap();await m.waitForFunction(()=>document.querySelector('dialog').dataset.liveObjects==='true');
   await m.waitForFunction(()=>[...document.querySelectorAll('[data-menu-object]')].every(e=>e.dataset.modelReady==='true'));await m.waitForTimeout(1200);
   const a=await m.evaluate(()=>({draws:__mq.draws,frames:__mq.frames,ready:[...document.querySelectorAll('[data-menu-object]')].map(x=>x.dataset.modelReady),overflow:document.documentElement.scrollWidth>innerWidth,groups:__mq.groups}));await m.waitForTimeout(1000);
   const b=await m.evaluate(()=>({draws:__mq.draws,frames:__mq.frames}));assert.deepEqual(a.ready,['true','true','true','true']);assert.equal(a.overflow,false);assert.equal(b.draws-a.draws,0);
   if(reducedMotion==='no-preference'&&['','Wafer.html'].includes(route))await m.screenshot({path:path.join(dir,'output/playwright/menu-restored-'+(route?'project':'landing')+'-mobile.png')});
   await m.getByRole('button',{name:'Close menu'}).tap();await m.waitForTimeout(250);assert.equal(await m.locator('dialog').evaluate(x=>x.open),false);
   result.mobile.push({route:route||'/',reducedMotion,idleDraws:b.draws-a.draws,idleFrames:b.frames-a.frames,groups:a.groups,overflow:a.overflow});save();
  }await mobile.close();
 }
 // Dependency failures retain the original previews and fully usable native links.
 const broken=await browser.newContext({viewport:{width:1280,height:800}});await broken.route('**/three@*/**',route=>route.abort());const b=await broken.newPage();await b.goto(base+'All%20Projects.html');await b.locator('.lp-menuToggle').click();await b.waitForTimeout(600);assert.equal(await b.locator('dialog').getAttribute('data-live-objects'),'false');assert.equal(await b.locator('dialog nav a').count(),4);assert.equal(await b.locator('dialog [data-menu-object="work"] img').evaluate(x=>getComputedStyle(x).visibility),'visible');await b.keyboard.press('Escape');result.dependencyFallback=true;await broken.close();
 assert.equal(result.errors.length,0,JSON.stringify(result.errors));save();
 }catch(e){result.failure=e.stack;save();throw e;}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
