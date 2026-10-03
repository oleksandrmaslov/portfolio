const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
function fixture(){
 const window=new EventTarget(),document=new EventTarget(),pending=new Map();let id=0,draws=0,opens=0,closed=0,freed=0,wake;
 const objects={active:false,
  open(){this.active=true;opens++;wake();},close(){this.active=false;closed++;},resize(){wake();},
  frame(){draws++;return false;},focus(){wake();},point(){wake();},exit(){wake();return 180;},dispose(){this.close();freed++;}};
 Object.assign(window,{sampleMoGlyphTargets:()=>[],createMenuObjects:(_t,_r,_e,_g,w)=>{wake=w;return objects;}});
 document.hidden=false;
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../../app/shared/menu-renderer.js'),'utf8'),{window,document,Promise,
  requestAnimationFrame:fn=>{pending.set(++id,fn);return id;},cancelAnimationFrame:id=>pending.delete(id)});
 const api=window.createMenuMotion({}, {}, {}),dialog={open:true,dataset:{},querySelector:()=>null};
 const tick=()=>{const callbacks=[...pending.values()];pending.clear();callbacks.forEach(fn=>fn(100));};
 return {api,dialog,document,window,pending,tick,get draws(){return draws;},get opens(){return opens;},get closed(){return closed;},get freed(){return freed;}};
}
test('live scene opens before model readiness, then closes without a pending frame',()=>{
 const f=fixture();f.api.openMenu(f.dialog,false);assert.equal(f.opens,1);assert.equal(f.pending.size,1);
 f.api.closeMenu();assert.equal(f.pending.size,0);assert.equal(f.closed,1);
 f.api.dispose();f.api.openMenu(f.dialog,false);assert.equal(f.opens,1);assert.equal(f.pending.size,0);
});
test('menu owns one callback on demand, sleeps at rest/hidden and wakes once',()=>{
 const f=fixture();f.api.openMenu(f.dialog,false);assert.notEqual(f.dialog.dataset.liveObjects,'true');
 assert.equal(f.pending.size,1);f.tick();assert.equal(f.dialog.dataset.liveObjects,'true');assert.equal(f.pending.size,0);
 f.api.pointMenu('work',20,20);f.api.pointMenu('work',30,20);assert.equal(f.pending.size,1);
 f.document.hidden=true;f.document.dispatchEvent(new Event('visibilitychange'));assert.equal(f.pending.size,0);
 f.document.hidden=false;f.document.dispatchEvent(new Event('visibilitychange'));assert.equal(f.pending.size,1);f.tick();
 f.api.closeMenu();f.window.dispatchEvent(new Event('pageshow'));assert.equal(f.pending.size,0);
 f.api.dispose();f.api.dispose();assert.equal(f.freed,1);
});
test('rapid reopen uses one scene and one callback',()=>{
 const f=fixture();f.api.openMenu(f.dialog,false);f.api.closeMenu();f.api.openMenu(f.dialog,true);
 assert.equal(f.opens,2);assert.equal(f.pending.size,1);f.tick();assert.equal(f.draws,1);
 f.api.dispose();assert.equal(f.pending.size,0);assert.equal(f.freed,1);
});
