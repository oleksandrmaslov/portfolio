const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const dir=__dirname,tail=process.argv.includes('--tail'),resume=tail||process.argv.includes('--continue');
const results=resume?JSON.parse(fs.readFileSync(path.join(dir,'navigation-qa.json'),'utf8')):{routes:[],navigation:[],errors:[],checks:[]};delete results.failure;delete results.audioHidden;
const save=()=>fs.writeFileSync(path.join(dir,'navigation-qa.json'),JSON.stringify(results,null,2));
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:!!process.env.HEADLESS,ignoreDefaultArgs:['--disable-back-forward-cache']});
 try{
 const ctx=await browser.newContext({viewport:{width:1280,height:800}});await ctx.addInitScript(()=>addEventListener('pageshow',e=>window.__qaPersisted=e.persisted));const page=await ctx.newPage();
 page.on('pageerror',e=>{results.errors.push({url:page.url(),error:e.message});save();});
 async function ready(){await page.locator('.lp-menuToggle').waitFor();await page.waitForFunction(()=>!document.getElementById('mo-pl'));await page.waitForTimeout(650);}
 async function load(route){await page.goto('http://localhost:8000/'+encodeURI(route));await ready();}
 if (!resume) {
 const routes=fs.readdirSync(path.resolve(dir,'../..')).filter(s=>s.endsWith('.html')&&!['face-test.html','index.html'].includes(s));
 for(const route of routes){
  await load(route);await page.getByRole('button',{name:'MENU',exact:true}).focus();await page.keyboard.press('Enter');
  await page.waitForFunction(()=>document.querySelector('dialog[open]'));
  const start=await page.evaluate(()=>location.href);const focused=[];
  for(let i=0;i<9;i++){await page.keyboard.press('Tab');focused.push(await page.evaluate(()=>({tag:document.activeElement.tagName,text:document.activeElement.textContent.slice(0,100),inside:!!document.activeElement.closest('dialog')})));}
  results.lastFocus=focused;save();assert.ok(focused.every(x=>x.inside||x.tag==='BODY'),'no background control receives focus');await page.keyboard.press('Escape');
  assert.equal(await page.evaluate(()=>location.href),start,'Escape only closes menu');assert.ok(await page.locator('.lp-menuToggle').evaluate(e=>e===document.activeElement));
  await page.setViewportSize({width:390,height:844});await page.getByRole('button',{name:'MENU',exact:true}).click();await page.waitForTimeout(550);
  const geometry=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,links:[...document.querySelectorAll('dialog nav a')].map(a=>{const r=a.getBoundingClientRect();return {x:r.x,right:r.right,bottom:r.bottom,text:a.textContent};})}));
  assert.equal(geometry.overflow,false);assert.ok(geometry.links.every(r=>r.x>=0&&r.right<=391));
  await page.keyboard.press('Escape');await page.setViewportSize({width:1280,height:800});
  results.routes.push({route,keyboardFocus:true,mobile:geometry});save();console.log('route',route);
 }
 // All four destinations; pointer exits keep their choreography and clean up.
 for(const id of ['work','about','contact','index']){
  await load('');await page.getByRole('button',{name:'MENU',exact:true}).click();await page.waitForTimeout(550);
  const href=id==='index'?'All Projects.html':'#'+id;
  await page.locator('dialog nav a').filter({has:page.locator(`[data-menu-object="${id}"]`)}).click();
  if(id==='index')await page.waitForURL('**/All%20Projects.html');else await page.waitForFunction(hash=>location.hash===hash,'#'+id);
  await page.waitForTimeout(1300);const s=await page.evaluate(()=>({url:location.href,dialog:!!document.querySelector('dialog[open]'),body:document.body.style.overflow,transition:document.documentElement.classList.contains('mo-menu-transition')}));
  assert.equal(s.dialog,false);assert.equal(s.body,'');assert.equal(s.transition,false);results.navigation.push({id,...s});save();
 }
 // A fast Escape cancels the pending destination.
 await load('');await page.locator('.lp-menuToggle').click();await page.waitForTimeout(550);await page.locator('dialog a[href="#contact"]').click();await page.keyboard.press('Escape');await page.waitForTimeout(700);assert.equal(await page.evaluate(()=>location.hash),'');
 results.checks.push('Escape cancels pending pointer exit');
 }
 if (!tail) {
 // Actual handoffs and browser Back repeat, exercising persisted navigation state.
 for(let i=0;i<3;i++){
  await load('All Projects.html');const row=page.locator('[data-addr="0x01"]');
  if(await row.count())await row.click();else {const wafer=page.getByText('Wafer',{exact:true}).first();await wafer.click();}
  await page.waitForURL('**/Wafer.html');await ready();
  await page.getByRole('link',{name:/UNIVERSE/}).click();await page.waitForURL(url=>url.pathname==='/');await ready();
  await page.goBack({waitUntil:'commit'});await page.waitForFunction(()=>location.pathname==='/Wafer.html');await ready();
  (results.backRestores ||= []).push(await page.evaluate(()=>({persisted:window.__qaPersisted,ready:document.readyState})));save();
  assert.equal(await page.evaluate(()=>document.body.classList.contains('hv-exit')),false);
 }
 results.checks.push('Three index → Wafer → Universe → Back cycles');save();
 // ASCII keyboard interaction and intentional pause after GPU context recycling.
 await load('Iskra.html');const fig=page.locator('.ascii-fig--video').first();await fig.scrollIntoViewIfNeeded();await page.waitForTimeout(700);
 const canvas=fig.getByRole('button',{name:/Toggle ASCII/});await canvas.focus();await page.keyboard.press('Enter');await page.waitForTimeout(200);assert.equal(await canvas.getAttribute('aria-pressed'),'true');await page.keyboard.press('Space');assert.equal(await canvas.getAttribute('aria-pressed'),'false');
 await fig.getByRole('button',{name:'Pause clip'}).click();await page.evaluate(()=>scrollTo(0,0));await page.waitForTimeout(700);await fig.scrollIntoViewIfNeeded();await page.waitForTimeout(700);assert.equal(await fig.locator('video').evaluate(v=>v.paused),true);
 await page.screenshot({path:path.join(dir,'output/playwright/after-iskra-media.png')});results.checks.push('ASCII Enter/Space and pause after recycling');
 save();
 }
 // Hidden-tab audio lives in hidden-audio.cjs: Playwright keeps attached pages
 // visible, so document.hidden never became true here and this tail failed.
 await ctx.close();
 // Real touch emulation (DPR 2), reduced motion, and native Play.
 const mobile=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,reducedMotion:'reduce'});const m=await mobile.newPage();await m.goto('http://localhost:8000/');await m.waitForFunction(()=>!document.getElementById('mo-pl'));await m.getByRole('button',{name:'MENU',exact:true}).tap();await m.waitForTimeout(500);assert.equal(await m.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await m.screenshot({path:path.join(dir,'output/playwright/after-touch-menu.png')});await m.getByRole('button',{name:'Close menu'}).tap();
 await m.goto('http://localhost:8000/Iskra.html');const mf=m.locator('.ascii-fig--video').first();await mf.scrollIntoViewIfNeeded();await m.waitForTimeout(600);assert.equal(await mf.locator('video').evaluate(v=>v.paused),true);await mf.getByRole('button',{name:'Play clip'}).tap();assert.equal(await mf.locator('video').evaluate(v=>v.paused),false);await mf.getByRole('button',{name:'Pause clip'}).tap();results.checks.push('390px DPR2 touch menu and reduced-motion manual playback');await mobile.close();
 // No-script fallback remains useful and fits the viewport.
 const noscript=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}});const n=await noscript.newPage();await n.goto('http://localhost:8000/');await n.getByRole('heading',{name:'Oleksandr Maslov',exact:true}).waitFor();await n.screenshot({path:path.join(dir,'output/playwright/after-fallback-mobile.png')});results.checks.push('No-JavaScript overview and native links');await noscript.close();
 assert.equal(results.errors.length,0,JSON.stringify(results.errors));save();
 }catch(e){results.failure=e.stack;save();throw e;}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
