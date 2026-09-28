"""Build small sampled instruments from the approved study's source palette.
Never execute its mix-rendering entry point and never modify its outputs.
"""
from pathlib import Path
import ast, hashlib, json, subprocess, sys
import numpy as np
from scipy.signal import resample_poly

ROOT=Path(__file__).resolve().parent
ORIGINAL=ROOT.parent/'variants'
PRESERVED=ROOT/'preserved-studies.json'
def fingerprints():
    return {str(p.relative_to(ORIGINAL)):hashlib.sha256(p.read_bytes()).hexdigest()
            for p in sorted(ORIGINAL.rglob('*')) if p.is_file()}
if not PRESERVED.exists(): PRESERVED.write_text(json.dumps(fingerprints(),indent=2)+'\n')

# Reuse the existing, approved instrument processing without running its master
# export loop. META marks the start of that command-line entry point.
tree=ast.parse((ORIGINAL/'render.py').read_text()); declarations=[]
for node in tree.body:
    if isinstance(node,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='META' for t in node.targets): break
    declarations.append(node)
library={'__file__':str(ORIGINAL/'render.py')}
exec(compile(ast.Module(body=declarations,type_ignores=[]),'approved-instruments','exec'),library)

PALETTES={
 'workshop':{'ep':([52,57,62,66,69,74],4),'vibes':([62,66,69,74],3.8),'bass':([38,43,47],3),'silk':([57,62,66],7),'wood':([1,2,3],.6)},
 'signal':{'ep':([63,67,70,74],3.2),'marimba':([55,60,63,67,70,75],2),'bass':([36,39,44],2.5),'silk':([55,60,63],7),'pluck':([63,70,75],1.5),'wood':([1,2,3],.6),'pulse':([39],.4)},
 'presence':{'piano':([48,53,55,60,64,67,72],5),'silk':([55,60,64],7)},
 'universe':{'prism':([57,62,66,69,74],4.6),'bloom':([55,59,62,66,69],7.4),'ep':([57,62,66,69],3),'bass':([38],3.6)}
}
RATE=32000
(ROOT/'instruments').mkdir(exist_ok=True)
manifest=json.loads((ROOT/'instruments.json').read_text()) if (ROOT/'instruments.json').exists() else {'sampleRate':RATE,'version':1,'directions':{}}
mixes={v['id']:v for v in json.loads((ORIGINAL/'variants.json').read_text())}
for slug,instruments in PALETTES.items():
    if len(sys.argv)>1 and slug not in sys.argv[1:]: continue
    blocks=[]; entries=[]; cursor=0
    for kind,(notes,dur) in instruments.items():
        for n in notes:
            if kind=='wood':
                x=library['lp'](library['SAMPLES']['wood'][n],2300)
                x=np.pad(x,(0,max(0,round(dur*44100)-len(x))))[:round(dur*44100)]
            elif kind=='prism':
                x=library['note']('vibes',n,dur).copy()
                x=library['fade'](library['lp'](x,2650),.055,.8)
            elif kind=='bloom':
                x=library['note']('vibes',n,dur).copy()
                # Swell a recorded body into view. No noise generator or
                # unrelated cinematic drone; its pitch is the same node tone.
                x=library['lp'](x,1750)
                x=library['fade'](x,1.1,2.1)*1.6
            else: x=library['note'](kind,n,dur)
            stereo=np.column_stack([x,x]).astype(np.float32)*.70710678
            stereo=library['room'](stereo,.20 if slug!='presence' else .27,.3)
            sample=resample_poly(stereo,320,441,axis=0).astype(np.float32)
            entries.append({'kind':kind,'note':n,'offset':cursor/RATE,'duration':len(sample)/RATE})
            blocks.extend([sample,np.zeros((round(RATE*.15),2),np.float32)])
            cursor+=len(sample)+round(RATE*.15)
    atlas=np.concatenate(blocks)
    dest=ROOT/'instruments'/f'{slug}.mp3'
    subprocess.run(['ffmpeg','-v','error','-y','-f','f32le','-ar',str(RATE),'-ac','2','-i','-','-c:a','libmp3lame','-b:a','128k',str(dest)],input=atlas.tobytes(),check=True)
    manifest['directions'][slug]={'file':str(dest.relative_to(ROOT)),'entries':entries,'decodedBytes':atlas.nbytes,
      'transferBytes':dest.stat().st_size,'masterGain':10**(mixes[slug]['linear_master_gain_db']/20) if slug in mixes else 1.95}
    print(slug,len(entries),'samples;',round(dest.stat().st_size/1e6,2),'MB transfer;',round(atlas.nbytes/1e6,1),'MB decoded',flush=True)
(ROOT/'instruments.json').write_text(json.dumps(manifest,indent=2)+'\n')
assert fingerprints()==json.loads(PRESERVED.read_text()),'Original study changed during instrument export'
print('Original studies preserved byte-for-byte.')
