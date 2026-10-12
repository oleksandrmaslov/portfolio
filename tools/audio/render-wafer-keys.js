async () => {
  // Render the original Wafer key synthesis dry; no legacy engine ships.
  let seed=0x57414645;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const buffers=[];
  for (const [release,deep] of [[false,false],[false,true],[true,false],[true,true]]) {
    const ctx=new OfflineAudioContext(2, Math.ceil((release?.08:.42)*32000),32000);
    const FIB={t1:.21,t2:.34}; let muted=false,lastThockAt=-1;
    const route=node=>node.connect(ctx.destination),duck=()=>{};
    function noiseBuffer(seconds) {
      const len = Math.floor(ctx.sampleRate * seconds);
      const buf = ctx.createBuffer(2, len, ctx.sampleRate);
      for (let ch = 0; ch < 2; ch++) {
        const d = buf.getChannelData(ch);
        for (let i = 0; i < len; i++) d[i] = random() * 2 - 1;
      }
      return buf;
    }
    let _noise = null;
    const noise = () => (_noise || (_noise = noiseBuffer(1.5)));

    function env(g, t0, peak, attack, decay) {
      g.gain.cancelScheduledValues(t0);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t0 + attack);
      g.gain.exponentialRampToValueAtTime(0.0002, t0 + attack + decay);
    }

    function thock(opts = {}) {
      if (!ctx || muted) return;
      const t = ctx.currentTime;
      const tw = { thockPitch: 1 };
      const pitchK = (tw.thockPitch || 1) * (opts.deep ? 0.74 : 1) * (0.96 + random() * 0.08);
      const vel = (opts.intensity != null ? opts.intensity : 1) * (0.85 + random() * 0.3);

      // anti machine-gun: thin out if hammering
      const since = t - lastThockAt; lastThockAt = t;
      const thin = since < 0.05 ? 0.55 : 1;

      const sum = ctx.createGain(); sum.gain.value = 1;

      // body knock — pitched drop
      const body = ctx.createOscillator(); body.type = "triangle";
      body.frequency.setValueAtTime(165 * pitchK, t);
      body.frequency.exponentialRampToValueAtTime(68 * pitchK, t + 0.055);
      const bodyLP = ctx.createBiquadFilter(); bodyLP.type = "lowpass"; bodyLP.frequency.value = 850;
      const bodyG = ctx.createGain();
      env(bodyG, t, 0.085 * vel * thin, 0.0015, (opts.deep ? 0.13 : 0.085));
      body.connect(bodyLP); bodyLP.connect(bodyG); bodyG.connect(sum);
      body.start(t); body.stop(t + 0.4);

      // switch transient — tight filtered tick
      const tick = ctx.createBufferSource(); tick.buffer = noise();
      tick.playbackRate.value = 1 + random() * 0.2;
      const tickBP = ctx.createBiquadFilter(); tickBP.type = "bandpass";
      tickBP.frequency.value = (2400 + random() * 700) * Math.sqrt(pitchK);
      tickBP.Q.value = 1.1;
      const tickG = ctx.createGain();
      env(tickG, t, 0.05 * vel * thin, 0.0008, 0.018);
      tick.connect(tickBP); tickBP.connect(tickG); tickG.connect(sum);
      tick.start(t); tick.stop(t + 0.08);

      // case resonance — short bandpass ring (the aluminium slab)
      const res = ctx.createBufferSource(); res.buffer = noise();
      const resBP = ctx.createBiquadFilter(); resBP.type = "bandpass";
      resBP.frequency.value = (300 + random() * 70) * pitchK;
      resBP.Q.value = 9;
      const resG = ctx.createGain();
      env(resG, t, 0.035 * vel * thin, 0.004, opts.deep ? FIB.t1 : 0.11);
      res.connect(resBP); resBP.connect(resG); resG.connect(sum);
      res.start(t); res.stop(t + 0.35);

      route(sum, 0.4);                       // the impulse excites the shared field
      duck(0.22, FIB.t2);                    // the field reacts — the disturbance
    }

    function keyRelease(deep) {
      if (!ctx || muted) return;
      const t = ctx.currentTime;
      const up = ctx.createBufferSource(); up.buffer = noise();
      const bp = ctx.createBiquadFilter(); bp.type = "bandpass";
      bp.frequency.value = (3200 + random() * 900) * (deep ? 0.8 : 1);
      bp.Q.value = 1.4;
      const g = ctx.createGain();
      env(g, t, 0.016, 0.0008, 0.012);
      up.connect(bp); bp.connect(g);
      route(g, 0.25);
      up.start(t); up.stop(t + 0.05);
    }


    if(release)keyRelease(deep);else thock({deep});
    buffers.push(await ctx.startRendering());
  }
  const length=buffers.reduce((n,b)=>n+b.length,0), channels=[new Float32Array(length),new Float32Array(length)];
  let offset=0; const entries=[];
  buffers.forEach((b,i)=>{ entries.push({kind:i<2?'key-down':'key-up',note:i%2?50:62,offset:offset/32000,duration:b.duration});
    for(let ch=0;ch<2;ch++)channels[ch].set(b.getChannelData(ch),offset);offset+=b.length; });
  let peak=0;for(const ch of channels)for(const x of ch)peak=Math.max(peak,Math.abs(x));
  const bytes=new ArrayBuffer(44+length*4),v=new DataView(bytes);
  const str=(at,s)=>{for(let i=0;i<s.length;i++)v.setUint8(at+i,s.charCodeAt(i));};
  str(0,'RIFF');v.setUint32(4,36+length*4,true);str(8,'WAVE');str(12,'fmt ');v.setUint32(16,16,true);
  v.setUint16(20,1,true);v.setUint16(22,2,true);v.setUint32(24,32000,true);v.setUint32(28,128000,true);v.setUint16(32,4,true);v.setUint16(34,16,true);str(36,'data');v.setUint32(40,length*4,true);
  for(let i=0;i<length;i++)for(let ch=0;ch<2;ch++)v.setInt16(44+i*4+ch*2,Math.round(channels[ch][i]/peak*.8*32767),true);
  let binary='';for(const x of new Uint8Array(bytes))binary+=String.fromCharCode(x);
  return {entries,wav:btoa(binary)};
}
