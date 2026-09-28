"""Three original listening studies. Offline rendering; no portfolio runtime changes.

Recordings: pinned CC0 VCSL selection in sources.json. All note sequences,
voicings, synthesis, edits and arrangements below are authored for this study.
Run with bundled Python + numpy/scipy; ffmpeg is used only for I/O/mastering.
"""
from pathlib import Path
from fractions import Fraction
from functools import lru_cache
import json, re, subprocess, sys
import numpy as np
from scipy.signal import butter, sosfilt, resample_poly

ROOT = Path(__file__).resolve().parent
OUT = ROOT / 'audio'
OUT.mkdir(exist_ok=True)
SR = 44100
LENGTH = 48
N = SR * LENGTH
PITCH = {'C':0,'D':2,'E':4,'F':5,'G':7,'A':9,'B':11}

def midi(s):
    match = re.fullmatch(r'([A-G])([b#]?)(\d)', s)
    letter, accidental, octv = match.groups()
    return 12*(int(octv)+1)+PITCH[letter]+({'#':1,'b':-1}.get(accidental,0))

def hz(n): return 440*2**((n-69)/12)
def lp(x, f, order=2): return sosfilt(butter(order,f,fs=SR,output='sos'),x,axis=0).astype(np.float32)
def hp(x, f, order=2): return sosfilt(butter(order,f,fs=SR,btype='highpass',output='sos'),x,axis=0).astype(np.float32)

def fade(x, attack=.008, release=.15):
    x=x.copy(); a=min(len(x),int(attack*SR)); r=min(len(x),int(release*SR))
    if a: x[:a]*=np.linspace(0,1,a,dtype=np.float32)**2
    if r: x[-r:]*=np.linspace(1,0,r,dtype=np.float32)**2
    return x

SAMPLES={}
SOURCE_STATS=[]
for path in sorted((ROOT/'sources').glob('*.wav')):
    name=path.name
    family='piano' if name.startswith('GrandPno') else 'vibes' if name.startswith('Vibes') else 'marimba' if name.startswith('Marimba') else 'wood'
    # The sampled F2 piano contains prominent low-frequency contamination.
    if 'GrandPno_Main_Sus_F2_' in name or 'Vibes_soft_F2_' in name: continue
    raw=np.frombuffer(subprocess.check_output(['ffmpeg','-v','error','-i',str(path),'-ar',str(SR),'-ac','1','-f','f32le','-']),dtype=np.float32).copy()
    raw=hp(raw,75 if family=='piano' else 95 if family=='vibes' else 115)
    # Locate onset by short-window RMS, retaining 6ms of its original attack.
    step=220; blocks=np.array([np.sqrt(np.mean(raw[i:i+step]**2)) for i in range(0,len(raw),step)])
    loud=np.flatnonzero(blocks > blocks.max()*.07)
    start=max(0,int(loud[0])*step-int(.006*SR)); raw=raw[start:]
    rms=np.sqrt(np.mean(raw[:min(len(raw),int(.6*SR))]**2))
    raw*=.12/max(rms,1e-8)
    raw=lp(raw,4800 if family=='piano' else 3900 if family=='vibes' else 3200)
    raw=fade(raw,.0015,.3)
    if family=='wood': root=int(re.search(r'rr(\d)',name)[1])
    else:
        label=re.search(r'_([A-G]\d)_',name)[1]
        root=midi(label)+12 # Measured fundamental: named A2 is 220Hz, i.e. scientific A3.
    SAMPLES.setdefault(family,{})[root]=raw
    SOURCE_STATS.append({'file':name,'family':family,'midi_root':root if family!='wood' else None,'onset_trim_ms':round(start/SR*1000,2)})

@lru_cache(maxsize=384)
def recorded(family,n,duration):
    nearest=min(SAMPLES[family],key=lambda r:abs(r-n))
    ratio=Fraction(2**((nearest-n)/12)).limit_denominator(1200)
    x=resample_poly(SAMPLES[family][nearest],ratio.numerator,ratio.denominator).astype(np.float32)
    size=int(duration*SR)
    if len(x)<size: x=np.pad(x,(0,size-len(x)))
    x=x[:size]
    if family=='vibes': x*=np.exp(-np.arange(size)/SR/(duration*.68))
    return fade(x,.003,min(.9,duration*.38))

@lru_cache(maxsize=384)
def synthetic(kind,n,duration):
    t=np.arange(int(duration*SR),dtype=np.float64)/SR; f=hz(n); ph=2*np.pi*f*t
    if kind=='ep':
        # Velocity-independent tine body, decaying even partials, no hiss layer.
        x=np.sin(ph+(.72*np.exp(-t/.24)+.11)*np.sin(ph*2))
        x+=.13*np.sin(ph*3.998)*np.exp(-t/.20)
        x*=np.exp(-t/2.15)*(.965+.035*np.cos(2*np.pi*3.1*t))
        x=lp(x.astype(np.float32),3400)
        x*=.145
    elif kind=='silk':
        # Small harmonic ensemble; long envelope, pitched material only.
        x=np.zeros_like(t)
        for det,amp in [(-3,.30),(0,.40),(3,.30)]:
            phase=ph*2**(det/1200)
            x+=amp*(np.sin(phase)+.20*np.sin(2*phase+.25)+.065*np.sin(3*phase+.65))
        x*=.09
        return fade(x.astype(np.float32),min(.8,duration*.25),min(1.7,duration*.45))
    elif kind=='pluck':
        x=(np.sin(ph+1.3*np.exp(-t/.09)*np.sin(ph*2))+.12*np.sin(3*ph)*np.exp(-t/.14))*np.exp(-t/.48)
        x=lp(x.astype(np.float32),3800)*.14
    elif kind=='bass':
        x=(np.sin(ph)+.22*np.sin(2*ph)+.07*np.sin(3*ph))*np.exp(-t/1.45)*.13
    elif kind=='pulse':
        phase=2*np.pi*(f*t+f*.3*.018*(1-np.exp(-t/.018)))
        x=np.sin(phase)*np.exp(-t/.065)*.12
    else: raise ValueError(kind)
    return fade(np.asarray(x,np.float32),.008 if kind!='bass' else .023,min(.3,duration*.3))

def note(kind,n,duration):
    n=midi(n) if isinstance(n,str) else n
    return recorded(kind,n,duration) if kind in ('piano','vibes','marimba') else synthetic(kind,n,duration)

class Track:
    def __init__(self,length=LENGTH,loop=False):
        self.x=np.zeros((int(length*SR),2),np.float32); self.loop=loop
    def add(self,x,at,gain=1,pan=0):
        # Constant-power panning, restrained maximum spread in arrangements.
        stereo=x[:,None]*np.array([np.cos((pan+1)*np.pi/4),np.sin((pan+1)*np.pi/4)],np.float32)[None,:]*gain
        start=round(at*SR)
        if self.loop:
            for i in range(0,len(stereo),len(self.x)):
                chunk=stereo[i:i+len(self.x)]; s=(start+i)%len(self.x); take=min(len(chunk),len(self.x)-s)
                self.x[s:s+take]+=chunk[:take]
                if take<len(chunk): self.x[:len(chunk)-take]+=chunk[take:]
        else:
            take=min(len(stereo),len(self.x)-start)
            if take>0: self.x[start:start+take]+=stereo[:take]
    def n(self,kind,n,at,duration,gain,pan=0): self.add(note(kind,n,duration),at,gain,pan)

def room(x,amount=.13,wide=.16,loop=False):
    """Offline short room + diffused musical delays. No continuous noise."""
    wet=np.zeros_like(x); damp=lp(x,2850)
    for side in range(2):
        for k,(delay,gain) in enumerate([(.031,.40),(.047,.31),(.079,.22),(.113,.16),(.157,.13),(.211,.09),(.293,.055),(.379,.036)]):
            d=round((delay+(side*.009 if k%2 else -side*.006))*SR)
            src=damp[:,side if k%3 else 1-side]
            if loop: wet[:,side]+=np.roll(src,d)*gain
            else: wet[d:,side]+=src[:-d]*gain
    # One low-level longer cross-delay gives the note a space without a wash.
    d=round(wide*SR)
    for side in range(2):
        if loop: wet[:,side]+=np.roll(damp[:,1-side],d)*.17
        else: wet[d:,side]+=damp[:-d,1-side]*.17
    return x+wet*amount

def chord(t,kind,notes,at,dur,gain,spread=.32,strum=.015):
    for i,n in enumerate(notes): t.n(kind,n,at+i*strum,dur,gain*(1-.06*(i%3)),np.linspace(-spread,spread,len(notes))[i])

def workshop():
    t=Track(loop=True); beat=.75
    # Sixteen bars. Four-bar harmony, voiced to keep common tones in place.
    changes=[('D2',['F#3','A3','C#4','E4']),('B2',['F#3','A3','C#4','D4']),('G2',['F#3','A3','B3','D4']),('A2',['E3','G3','B3','D4'])]
    for bar in range(16):
        at=bar*3; root,voicing=changes[(bar//2)%4]; quiet=.63 if bar>=12 else .85
        chord(t,'ep',voicing,at+.035,3.35,.33*quiet)
        if bar%2==1: chord(t,'ep',voicing[1:],at+2.28,1.85,.16*quiet,spread=.22,strum=.022)
        t.n('bass',root,at,2.8,.55*quiet)
        if bar<12:
            t.n('bass',midi(root)+12,at+2.25,.65,.17)
            for j,(offset,gain) in enumerate([(0,.09),(1.52,.13),(2.65,.07)]):
                t.add(lp(SAMPLES['wood'][(bar+j)%3+1],2300),at+offset,gain,-.20 if j%2 else .18)
    # An incomplete three-note thought, with an answering phrase eight bars later.
    for at,n,g,p in [(1.55,'A4',.19,-.28),(2.28,'F#4',.16,.23),(4.58,'E4',.14,.1),(10.58,'D4',.13,-.1),
                       (13.60,'F#4',.16,.28),(16.52,'A4',.18,-.22),(18.05,'B4',.13,.20),(19.61,'A4',.15,.02),
                       (22.58,'E4',.12,-.2),(34.6,'F#4',.11,.14),(40.6,'E4',.10,-.2),(43.61,'D4',.13,0)]:
        t.n('vibes',n,at,3.0,g,p)
    for at,notes in [(0,['A3','E4']),(12,['A3','D4']),(24,['A3','E4']),(36,['A3','D4'])]:
        chord(t,'silk',notes,at,7,.12,spread=.5)
    return room(t.x,.20,.375,True)

def signal():
    t=Track(loop=True); beat=.6
    changes=[('Eb2',['G3','Bb3','D4','F4']),('C2',['G3','Bb3','D4','Eb4']),('Ab2',['G3','Bb3','C4','Eb4']),('Bb2',['F3','G3','C4','D4'])]
    for bar in range(20):
        at=bar*2.4; root,v=changes[(bar//2)%4]; level=.55 if bar>=14 else .85
        chord(t,'silk',v,at,2.9,.24*level,spread=.45)
        if bar<14:
            for offset,shift,g in [(0,0,.40),(.9,12,.14),(1.8,0,.24)]: t.n('bass',midi(root)+shift,at+offset,.85,g)
            for j,offset in enumerate([.60,1.50,2.10]): t.add(lp(SAMPLES['wood'][(bar+j)%3+1],1800),at+offset,.10 if j==0 else .045,(-1)**j*.22)
            t.n('pulse','Eb2',at,.2,.26)
        else: t.n('bass',root,at,2.3,.23)
        # Syncopated, single-voice counterline. Space on alternate bars.
        for j,(offset,idx) in enumerate([(.30,0),(1.20,2),(1.95,1)] if bar%2==0 else [(.60,3)]):
            n=midi(v[idx]); t.n('marimba',n,at+offset,1.2,.23*level,(-1)**j*.32)
            t.n('pluck',n+12,at+offset+.006,.9,.07*level,(-1)**j*-.14)
    for at,n,g,p in [(3.9,'Bb4',.16,-.25),(5.4,'G4',.16,.25),(7.5,'F4',.13,0),
                     (15.9,'G4',.14,-.25),(16.8,'F4',.13,.2),(18.6,'Bb4',.16,0),
                     (21.6,'D5',.12,.15),(23.1,'Eb5',.14,0),(37.8,'F4',.10,.1),(41.7,'Eb4',.12,0)]:
        t.n('ep',n,at,2.1,g,p)
    return room(t.x,.19,.3,True)

def presence():
    t=Track(loop=True)
    changes=[('C3',['G3','B3','D4','E4']),('F3',['A3','C4','E4','G4']),('D3',['A3','C4','E4','F4']),('C3',['G3','A3','D4','E4']),
             ('F3',['A3','C4','E4','G4']),('G3',['B3','D4','E4','A4'])]
    for bar in range(12):
        at=bar*4; root,v=changes[(bar//2)%6]; level=.67 if bar>=9 else .88
        # Spread notes over the bar, giving the recording's decay real room.
        t.n('piano',root,at+.025,5.7,.23*level,-.16)
        for j,(offset,idx,gain) in enumerate([(.19,0,.24),(.86,2,.19),(1.94,1,.17),(2.73,3,.15)]):
            t.n('piano',v[idx],at+offset,4.4,gain*level,[-.24,.21,-.09,.27][j])
        if bar%2==0: chord(t,'silk',[v[0],v[2]],at+.28,7.5,.10,spread=.48)
    for at,n,g,p in [(2.0,'G4',.15,.15),(4.10,'E4',.16,-.12),(6.15,'D4',.12,.2),
                     (11.0,'C5',.11,-.15),(15.05,'A4',.12,.12),(18.1,'G4',.15,0),
                     (20.15,'E4',.13,-.1),(22.05,'D4',.12,.15),(35.1,'G4',.10,.13),(39.1,'E4',.11,0),(43.05,'C4',.12,-.1)]:
        t.n('piano',n,at,4.6,g,p)
    return room(t.x,.27,.41,True)

def cues(which):
    focus=Track(1.4); opening=Track(2.8); origin=Track(8)
    if which=='workshop':
        focus.n('ep','A4',.02,.5,.30,-.10); focus.n('marimba','D4',.055,.38,.15,.10)
        for at,n,g in [(0,'D4',.30),(.105,'A4',.20),(.245,'E5',.12)]: opening.n('ep',n,at,1.2,g,0)
        seq=[(.15,'A4',.20,-.52),(.90,'F#4',.20,.50),(1.66,'E4',.19,-.32),(2.80,'D4',.32,0),(3.56,'A4',.23,.05),(4.32,'F#4',.23,-.04),(5.05,'E4',.20,.025),(5.82,'D4',.32,0)]
        for at,n,g,p in seq: origin.n('vibes',n,at,2.1,g,p); origin.n('ep',n,at,2.1,g*.48,p*.5)
        chord(origin,'ep',['D3','A3','C#4','F#4'],2.80,4.8,.15,spread=.12)
    elif which=='signal':
        focus.n('marimba','G4',.01,.4,.35,-.08); focus.n('pluck','Eb4',.028,.3,.16,.08)
        for at,n,g in [(0,'Eb4',.31),(.09,'Bb4',.22),(.24,'D5',.16)]: opening.n('marimba',n,at,1.0,g,.06)
        seq=[(.10,'G4',.24,-.48),(.55,'F4',.20,.43),(1.30,'Bb4',.23,-.32),(1.9,'D5',.20,.22),(2.5,'Eb5',.29,0),(3.7,'G4',.23,-.05),(4.0,'F4',.19,.04),(4.6,'Bb4',.24,-.02),(5.2,'D5',.21,.02),(5.8,'Eb5',.29,0)]
        for at,n,g,p in seq: origin.n('ep',n,at,1.7,g,p); origin.n('marimba',n,at,1.4,g*.38,p)
        chord(origin,'silk',['Eb3','Bb3','D4','G4'],2.4,5.4,.18,spread=.12)
    else:
        focus.n('piano','E4',.02,.7,.24,-.07)
        for at,n,g in [(0,'C4',.24),(.16,'G4',.17),(.38,'E4',.18)]: opening.n('piano',n,at,1.8,g,.05)
        seq=[(.1,'G4',.22,-.50),(1.05,'E4',.24,.45),(1.95,'D4',.18,-.27),(3.0,'C4',.28,0),(4.05,'E4',.24,.05),(5.05,'G4',.19,-.04),(6.0,'C5',.15,0)]
        for at,n,g,p in seq: origin.n('piano',n,at,2.9,g,p)
        chord(origin,'piano',['C3','G3','B3','E4'],3,4.8,.10,spread=.10,strum=.042)
    return {name:room(t.x,.19,.24) for name,t in [('focus',focus),('open',opening),('origin',origin)]}

def wav(path,x):
    subprocess.run(['ffmpeg','-v','error','-y','-f','f32le','-ar',str(SR),'-ac','2','-i','-','-c:a','pcm_s24le',str(path)],input=np.asarray(x,np.float32).tobytes(),check=True)

def measure(path):
    p=subprocess.run(['ffmpeg','-hide_banner','-i',str(path),'-af','loudnorm=I=-26:TP=-2:LRA=12:print_format=json','-f','null','-'],capture_output=True,text=True,check=True)
    m=json.loads(p.stderr[p.stderr.rfind('{'):p.stderr.rfind('}')+1]); return {k:float(v) for k,v in m.items() if k.startswith('input_')}

META=[('workshop','Electric workshop',workshop,80,'D major','Electric keys · vibraphone · wooden pulse'),('signal','Clear signal',signal,100,'E♭ major','Marimba · syncopated electronics · rounded bass'),('presence','Quiet presence',presence,60,'C major','Recorded piano · slow phrasing · open space')]
requested=set(sys.argv[1:])
if requested and not requested <= {v[0] for v in META}: raise ValueError('Unknown study')
stats=[v for v in json.loads((ROOT/'variants.json').read_text()) if v['id'] not in requested] if requested and (ROOT/'variants.json').exists() else []
for slug,title,make,tempo,key,palette in META:
    if requested and slug not in requested: continue
    print('Composing',title,flush=True)
    bed=make(); events=cues(slug)
    cue_track=np.zeros_like(bed)
    for name,start in [('focus',9),('open',14),('origin',26)]:
        s=round(start*SR); cue_track[s:s+len(events[name])]+=events[name]
    # Reading has less rhythmic information already in the arrangement. Duck
    # only while presenting the signature, with smooth half-second shoulders.
    duck=np.ones(N,np.float32)
    for start,end,depth in [(13.9,16.4,.16),(25.7,34.1,.26)]:
        a=int(start*SR); b=int(end*SR); r=int(.45*SR)
        duck[a:a+r]=1-depth*np.linspace(0,1,r); duck[a+r:b-r]=1-depth; duck[b-r:b]=1-depth*np.linspace(1,0,r)
    full=bed*duck[:,None]+cue_track
    edge=np.ones(N,np.float32); edge[:SR*2]=np.linspace(0,1,SR*2)**1.5; edge[-SR*3:]=np.linspace(1,0,SR*3)**1.7
    full*=edge[:,None]
    temp=OUT/(slug+'-premaster.wav'); wav(temp,full)
    before=measure(temp); gain=10**((-26-before['input_i'])/20)
    # Linear gain only: do not flatten natural transients with a limiter.
    if 20*np.log10(np.max(np.abs(full))*gain)>-2: raise ValueError('Crest factor exceeds true peak budget')
    waveforms={}
    for name,x in [('full',full),('atmosphere',bed),('cues',cue_track),*events.items()]:
        if name in ('full','atmosphere','cues'):
            waveforms[name]=[round(float(v)*gain,5) for v in np.max(np.abs(x.reshape(480,-1,2)),axis=(1,2))]
        path=OUT/f'{slug}-{name}.wav'; wav(path,x*gain)
        subprocess.run(['ffmpeg','-v','error','-y','-i',str(path),'-c:a','libmp3lame','-b:a','192k',str(path.with_suffix('.mp3'))],check=True)
    temp.unlink()
    after=measure(OUT/f'{slug}-full.mp3')
    mono=full.mean(axis=1); correlation=np.corrcoef(full[:,0],full[:,1])[0,1]
    seam=np.max(np.abs(bed[-1]-bed[0]))*gain
    stats.append({'id':slug,'title':title,'tempo':tempo,'key':key,'palette':palette,'duration':LENGTH,
                  'linear_master_gain_db':round(20*np.log10(gain),2),'mp3_loudness':after,
                  'stereo_correlation':round(float(correlation),3),'loop_boundary_step_dbfs':round(float(20*np.log10(max(seam,1e-9))),2),
                  'mono_rms_dbfs':round(float(20*np.log10(np.sqrt(np.mean(mono**2))*gain)),2),
                  'waveform':waveforms['full'],'waveforms':waveforms})
    print(title,after,flush=True)
stats.sort(key=lambda v:[m[0] for m in META].index(v['id']))
(ROOT/'variants.json').write_text(json.dumps(stats,indent=2)+'\n')
(ROOT/'source-processing.json').write_text(json.dumps(SOURCE_STATS,indent=2)+'\n')
print('Rendered requested studies, atmosphere/cue stems and individual interaction cues.',flush=True)
