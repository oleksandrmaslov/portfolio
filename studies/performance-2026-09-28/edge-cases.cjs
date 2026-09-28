const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const label=process.argv[2]||'before';const result={label};
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:false});
 try{
 const ctx=await browser.newContext({viewport:{width:1280,height:800}});
 // Feed the real Universe callback 75ms active-frame intervals. Motion remains
 // clamped; its diagnostic must still report 13.3fps rather than a 20fps floor.
 await ctx.addInitScript(()=>{
  const raf=requestAnimationFrame;let clock=0;
  window.requestAnimationFrame=fn=>raf(t=>{if(fn.name==='frame'&&fn.toString().includes('probeDoF(')){clock=(clock||t)+75;fn(clock);}else fn(t);});
 });
 const p=await ctx.newPage();await p.goto('http://localhost:8000/');
 await p.waitForFunction(()=>window.__mo_dofFps!==undefined,{timeout:30000});
 result.dof=await p.evaluate(()=>({reported:__mo_dofFps,expected:1000/75,on:__mo_dofOn}));await ctx.close();
 const rm=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});const r=await rm.newPage();await r.goto('http://localhost:8000/');await r.waitForSelector('.universe__hudVal',{state:'attached'});await r.waitForTimeout(7000);
 result.reducedBefore=await r.locator('.universe__hudVal').allTextContents();await r.waitForTimeout(28000);
 result.reducedAfter=await r.locator('.universe__hudVal').allTextContents();result.idleWhisper=await r.locator('.universe__whisper').getAttribute('class');await rm.close();
 const failure=await browser.newContext({viewport:{width:390,height:844}});await failure.route('https://unpkg.com/three@*/**',route=>route.abort());const f=await failure.newPage();await f.goto('http://localhost:8000/');await f.waitForTimeout(13000);
 result.threeFailure=await f.evaluate(()=>({text:document.body.innerText,links:[...document.querySelectorAll('a')].filter(a=>a.getClientRects().length).map(a=>({text:a.textContent,href:a.getAttribute('href')})),loader:!!document.getElementById('mo-pl')}));await failure.close();
 const nogl=await browser.newContext();await nogl.addInitScript(()=>{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return /webgl/.test(type)?null:get.call(this,type,...args);};});const n=await nogl.newPage();await n.goto('http://localhost:8000/');await n.waitForTimeout(13000);result.webglFailure=await n.evaluate(()=>({text:document.body.innerText,links:[...document.querySelectorAll('a')].filter(a=>a.getClientRects().length).map(a=>a.getAttribute('href'))}));await nogl.close();
 if(label === 'after') {
  assert.ok(Math.abs(result.dof.reported-result.dof.expected)<.1);
  assert.deepEqual(result.reducedBefore,result.reducedAfter);
  assert.equal(result.threeFailure.links.length,7);assert.equal(result.webglFailure.links.length,7);
 }
 }finally{fs.writeFileSync(path.join(__dirname,label+'-edge.json'),JSON.stringify(result,null,2));await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
