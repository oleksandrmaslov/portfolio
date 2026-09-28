const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({channel:'chrome',headless:false});const p=await b.newPage({viewport:{width:1280,height:800}});const r={demos:[],errors:[]};p.on('pageerror',e=>r.errors.push(e.message));try{
 await p.goto('http://localhost:8000/');await p.waitForFunction(()=>!document.getElementById('mo-pl'));await p.evaluate(()=>__mo_universe.setExplore(true));await p.waitForTimeout(500);
 const box=await p.evaluate(()=>__mo_universe.tileBounds('0x01'));r.box=box;
 for(const offset of [0,70,120,-50]){await p.mouse.move(box.x+box.w/2,box.y+box.h/2+offset);await p.waitForTimeout(300);if(await p.locator('.uhud').count())break;}
 await p.locator('.uhud').waitFor({state:'visible'});r.hover=await p.locator('.uhud').evaluate(e=>({text:e.textContent,outline:e.querySelectorAll('.uhud__outline').length,segments:e.querySelectorAll('.uhud__segment').length}));assert.equal(r.hover.segments,12);await p.screenshot({path:path.join(__dirname,'output/playwright/after-card-hover.png')});
 for(const route of ['Wafer.html','Kerfur.html','Ci-Clop.html','ZMK-PointAccel.html']){
  await p.goto('http://localhost:8000/'+route);const buttons=p.getByRole('button',{name:/demo/i});await buttons.first().waitFor();r.demos.push({route,buttons:await buttons.allTextContents()});await buttons.first().click();await p.waitForFunction(()=>document.body.classList.contains('hv-demoing'));await p.waitForTimeout(1500);await p.keyboard.press('Escape');await p.waitForFunction(()=>!document.body.classList.contains('hv-demoing'));assert.ok(p.url().endsWith(route));r.demos.at(-1).openedAndClosed=true;console.log(route);
 }
 assert.equal(r.errors.length,0);
} catch(e){r.failure=e.stack;throw e;} finally{fs.writeFileSync(path.join(__dirname,'hover-demos.json'),JSON.stringify(r,null,2));await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
