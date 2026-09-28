"""Render the deterministic interaction traces for signal checks and listening.
Uses the same decoded atlases, pitch rates, gain/pan and release rules as engine.js.
The live player itself never loads these recordings.
"""
import json,subprocess
from pathlib import Path
from fractions import Fraction
import numpy as np
from scipy.signal import resample_poly
ROOT=Path(__file__).resolve().parent; SR=32000; DURATION=48
manifest=json.loads((ROOT/'instruments.json').read_text())
sessions=json.loads((ROOT/'verification/sessions.json').read_text());measurements={}
(ROOT/'audio').mkdir(exist_ok=True)
for slug,session in sessions.items():
 data=manifest['directions'][slug]
 atlas=np.frombuffer(subprocess.check_output(['ffmpeg','-v','error','-i',str(ROOT/data['file']),'-ar',str(SR),'-ac','2','-f','f32le','-']),np.float32).reshape(-1,2)
 mix=np.zeros((SR*DURATION,2),np.float32);live=[];high=0;dropped=0
 for e in sorted(session['events'],key=lambda e:e['at']):
  live=[end for end in live if end>e['at']]
  if len(live)>=24:dropped+=1;continue
  options=[a for a in data['entries'] if a['kind']==e['kind']];assert options,e
  sample=min(options,key=lambda a:abs(a['note']-e['note']))
  rate=1 if e['kind']=='wood' else 2**((e['note']-sample['note'])/12)
  duration=min(sample['duration']/rate-.008,e['duration']+.28)
  start=round(sample['offset']*SR);count=round(sample['duration']*SR)
  x=atlas[start:start+count]
  ratio=Fraction(1/rate).limit_denominator(1000);x=resample_poly(x,ratio.numerator,ratio.denominator,axis=0).astype(np.float32)[:round(duration*SR)]
  env=np.ones(len(x),np.float32);attack=min(len(x),round(.005*SR));release=min(len(x),round(min(.42,duration*.3)*SR));env[:attack]=np.linspace(0,1,attack);env[-release:]=np.linspace(1,0,release)
  x*=env[:,None]*min(.42,e['gain'])*data['masterGain']*.55
  # StereoPanner's stereo-input equal-power rule (Web Audio specification).
  pan=max(-.8,min(.8,e['pan']));l=x[:,0].copy();r=x[:,1].copy()
  if pan<=0:theta=(pan+1)*np.pi/2;x[:,0]=l+r*np.cos(theta);x[:,1]=r*np.sin(theta)
  else:theta=pan*np.pi/2;x[:,0]=l*np.cos(theta);x[:,1]=r+l*np.sin(theta)
  at=round(e['at']*SR);take=min(len(x),len(mix)-at)
  if take>0:mix[at:at+take]+=x[:take]
  live.append(e['at']+duration);high=max(high,len(live))
 fade=np.ones(len(mix));fade[:round(.4*SR)]=np.linspace(0,1,round(.4*SR));fade[-2*SR:]=np.linspace(1,0,2*SR);mix*=fade[:,None]
 dest=ROOT/'audio'/f'{slug}-guided.wav'
 subprocess.run(['ffmpeg','-v','error','-y','-f','f32le','-ar',str(SR),'-ac','2','-i','-','-c:a','pcm_s24le',str(dest)],input=mix.tobytes(),check=True)
 mp3=dest.with_suffix('.mp3');subprocess.run(['ffmpeg','-v','error','-y','-i',str(dest),'-c:a','libmp3lame','-b:a','192k',str(mp3)],check=True)
 result=subprocess.run(['ffmpeg','-hide_banner','-i',str(mp3),'-af','loudnorm=I=-32:TP=-2:LRA=12:print_format=json','-f','null','-'],capture_output=True,text=True,check=True)
 loud=json.loads(result.stderr[result.stderr.rfind('{'):result.stderr.rfind('}')+1])
 measurements[slug]={'lufs':float(loud['input_i']),'truePeak':float(loud['input_tp']),'maxOverlappingVoices':high,'dropped':dropped,'duration':DURATION,'volume':.55,'finite':bool(np.isfinite(mix).all())}
 assert measurements[slug]['truePeak']<-5 and measurements[slug]['finite']
 print(slug,measurements[slug],flush=True)
(ROOT/'verification/audio-measurements.json').write_text(json.dumps(measurements,indent=2)+'\n')
