const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const label=process.argv[2]||'before',result={label,routes:[],errors:[]};
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:process.env.HEADLESS!=='0'});try{
 const ctx=await browser.newContext({viewport:{width:1280,height:800}});
 await ctx.addInitScript(()=>{
  window.__menuQA={frames:0,renders:0,last:null};let factory;
  Object.defineProperty(window,'createMenuObjects',{configurable:true,get:()=>factory,set(fn){factory=function(...args){
   const api=fn(...args),draw=args[1].render,frame=api.frame;let active=false;
   args[1].render=function(scene,camera){if(active){__menuQA.renders++;__menuQA.last=scene.children.filter(o=>o.isGroup).map(o=>({rotation:o.rotation.toArray().slice(0,3),children:o.children.length}));}return draw.call(this,scene,camera);};
   api.frame=function(now){__menuQA.frames++;active=true;try{return frame.call(this,now);}finally{active=false;}};
   return api;
  };}});
 });
 const p=await ctx.newPage();p.on('pageerror',e=>result.errors.push(e.message));
 for(const route of ['', 'Iskra.html', 'All Projects.html']){
  await p.goto('http://localhost:8000/'+encodeURI(route));await p.locator('.lp-menuToggle').waitFor();await p.waitForFunction(()=>!document.getElementById('mo-pl'));await p.evaluate(()=>document.fonts.ready);
  await p.locator('.lp-menuToggle').click();
  if(label!=='before')await p.waitForFunction(()=>[...document.querySelectorAll('[data-menu-object]')].every(e=>e.dataset.modelReady==='true'));
  await p.waitForTimeout(label==='before'?3500:500);
  const row=p.locator('dialog a').filter({has:p.locator('[data-menu-object="work"]')});const box=await row.boundingBox();
  await p.mouse.move(box.x+box.width*.2,box.y+box.height*.5);await p.waitForTimeout(700);const left=await p.evaluate(()=>__menuQA.last);
  await p.mouse.move(box.x+box.width*.9,box.y+box.height*.5);await p.waitForTimeout(700);const right=await p.evaluate(()=>__menuQA.last);
  const state=await p.locator('dialog').evaluate(d=>({live:d.dataset.liveObjects,canvas:d.querySelectorAll('canvas').length}));
  await p.mouse.move(4,4);await p.waitForTimeout(3000);const initial=await p.evaluate(()=>({...__menuQA}));await p.waitForTimeout(2000);let final=await p.evaluate(()=>({...__menuQA}));
  const lateDraws=final.renders-initial.renders;
  if(label!=='before'&&lateDraws){const retry=final;await p.waitForTimeout(2000);final=await p.evaluate(()=>({...__menuQA}));result.routes.push({route:route||'/',...state,left,right,lateDraws,idleFrames:final.frames-retry.frames,idleDraws:final.renders-retry.renders});}
  else result.routes.push({route:route||'/',...state,left,right,idleFrames:final.frames-initial.frames,idleDraws:lateDraws});
  if(label!=='before'){assert.equal(state.live,'true',route);assert.equal(state.canvas,1,route);assert.equal(right[0].children,1,'the actual keyboard model loaded');const yaw=Math.abs(left[0].rotation[1]-right[0].rotation[1]);assert.ok(yaw>.05&&yaw<.12,'preserve the original restrained yaw range');assert.equal(result.routes.at(-1).idleDraws,0);}
  await p.keyboard.press('Escape');assert.ok(await p.locator('.lp-menuToggle').evaluate(e=>e===document.activeElement));
 }
 assert.equal(result.errors.length,0);
 }catch(e){result.failure=e.stack;throw e;}finally{fs.writeFileSync(path.join(__dirname,'menu-motion-'+label+'.json'),JSON.stringify(result,null,2));await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
