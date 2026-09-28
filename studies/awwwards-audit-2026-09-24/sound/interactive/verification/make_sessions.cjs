// Repeatable interaction score for audio verification and the fourth audition.
const fs=require('node:fs'),path=require('node:path');const {Score,PROFILES}=require('../score.js');
const out={};for(const id of Object.keys(PROFILES)){
 const s=new Score(id,{seed:0x600d}),events=[];const tick=60/s.p.bpm/4;let nextFocus=7,focusIndex=0;const route=['0x01','0x03','0x06','0x0D'];let opened=false,gathered=false;
 for(let at=0;at<48;at+=tick){
  if(at>3&&at<23)s.motion(.032,Math.sin(at*.2)*.55);
  if(at>=nextFocus&&focusIndex<route.length){s.focus(route[focusIndex++]);nextFocus+=5;}
  if(at>=16&&!opened){s.open('0x06');opened=true;}
  if(at>=27&&!gathered){s.gather();gathered=true;}
  if(at>=27&&at<33)s.setAssembly(Math.min(1,(at-27)/6));
  if(at>=37)s.setSection('reading');
  for(const e of s.next())events.push({...e,at:at+e.delay});
 }
 out[id]={events,state:s.snapshot()};
}
fs.writeFileSync(path.join(__dirname,'sessions.json'),JSON.stringify(out,null,2)+'\n');console.log('Four deterministic 48-second interaction sessions written.');
