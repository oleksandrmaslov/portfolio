'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const audio = $('audio');
  const copy = {
    workshop: 'Electric keys carry the harmony; recorded vibraphone and quiet wood percussion give it a tactile edge. The most rhythmic of the two warmer directions.',
    signal: 'A syncopated marimba line, rounded bass and small electronic accents. The closest direction to a contemporary game menu, with a quieter passage for reading.',
    presence: 'Recorded piano carries both the harmony and the melody. Longer decays and fewer events leave more attention for the universe; there is no percussion.'
  };
  let variants = [], selected = 'workshop', layer = 'full', generation = 0;
  let pendingPosition = null, shouldPlay = false, siteLevel = false;
  let loadPromise = null, objectURL = null, controller = null, loading = false;
  const recordings = new Map();
  const format = t => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
  const status = text => { $('status').textContent = text; };
  function draw() {
    const variant = variants.find(v => v.id === selected);
    if (!variant) return;
    const waveform = variant.waveforms?.[layer] || variant.waveform;
    const max = Math.max(...(variant.waveforms?.full || variant.waveform));
    const path = waveform.map((v, i) => { const h = Math.max(.3, v / max * 46); return `M${i * 2 + 1},${55-h}v${h*2}`; }).join('');
    $('wave-base').setAttribute('d', path); $('wave-active').setAttribute('d', path);
  }
  function updatePosition() {
    const t = pendingPosition ?? audio.currentTime ?? 0;
    $('seek').value = t; $('seek').setAttribute('aria-valuetext', `${format(t)} of 0:48`);
    $('clock').textContent = `${format(t)} / 0:48`;
    $('played-width').setAttribute('width', String(t/48*960));
    $('playhead').style.left = `${t/48*100}%`;
  }
  function updatePlay() {
    const playing = shouldPlay || !audio.paused;
    $('play-label').textContent = playing ? 'Pause' : 'Play study';
    $('play-icon').setAttribute('d', playing ? 'M5 4h4v12H5ZM12 4h4v12h-4Z' : 'M6 3.5 16 10 6 16.5Z');
  }
  async function play() {
    shouldPlay = true;
    updatePlay();
    const request = generation;
    try { if (loadPromise && !await loadPromise) return; if (request !== generation || !shouldPlay || document.hidden) return; await audio.play(); if(request === generation && shouldPlay) status(`${variants.find(v=>v.id===selected)?.title || 'Study'} · ${layer === 'full' ? 'complete mix' : layer === 'cues' ? 'cues only' : 'atmosphere'}`); }
    catch (error) { if (request === generation && error.name !== 'AbortError') { shouldPlay = false; updatePlay(); status('Playback could not start. Press play to try again.'); } }
  }
  function load(position=0, resume=false) {
    const request = ++generation;
    audio.pause(); shouldPlay = resume; pendingPosition = position;
    loading = true; updatePlay();
    controller?.abort(); controller = new AbortController();
    audio.removeAttribute('src'); audio.load();
    if (objectURL) { URL.revokeObjectURL(objectURL); objectURL = null; }
    const file = `audio/${selected}-${layer}.mp3`;
    $('download').href = file; updatePosition(); status('Loading recording…');
    // Python's local preview does not serve byte ranges. A small lazy-loaded
    // blob lets the native media element seek without a second audio engine.
    loadPromise = (async () => {
      try {
        let blob = recordings.get(file);
        if (!blob) { const response = await fetch(file, {signal:controller.signal}); if (!response.ok) throw new Error('Audio unavailable'); blob = await response.blob(); recordings.set(file,blob); }
        if (request !== generation) return false;
        objectURL = URL.createObjectURL(blob); audio.src = objectURL; audio.load();
        return true;
      } catch (error) { if(request === generation && error.name!=='AbortError') { shouldPlay=false; updatePlay(); status('This recording could not load. Press play to retry.'); } return false; }
      finally { if(request === generation) loading=false; }
    })();
    if (resume) play();
    return loadPromise;
  }
  audio.addEventListener('loadedmetadata', () => {
    if (pendingPosition !== null) { audio.currentTime = Math.min(pendingPosition, audio.duration || 48); pendingPosition = null; }
    updatePosition();
  });
  audio.addEventListener('error', () => status('This audio file could not be loaded. Reload the page to retry.'));
  audio.addEventListener('timeupdate', updatePosition);
  audio.addEventListener('play', updatePlay); audio.addEventListener('pause', updatePlay);
  audio.addEventListener('ended', () => { shouldPlay=false; updatePlay(); status('Study finished. Compare another direction or replay a moment.'); });
  document.querySelectorAll('[data-id]').forEach(button => button.addEventListener('click', () => {
    const position = pendingPosition ?? audio.currentTime; const resume = shouldPlay || !audio.paused;
    selected = button.dataset.id;
    document.querySelectorAll('[data-id]').forEach(b => b.setAttribute('aria-pressed', String(b===button)));
    const variant = variants.find(v=>v.id===selected);
    $('track-title').textContent = variant?.title || button.querySelector('strong').textContent;
    $('key').textContent = variant?.key || '';
    $('description').textContent = copy[selected]; draw(); load(position>=47.9?0:position,resume);
    if (!resume) status('Direction selected. Press play to listen.');
  }));
  document.querySelectorAll('[data-layer]').forEach(button => button.addEventListener('click', () => {
    const position = pendingPosition ?? audio.currentTime; const resume = shouldPlay || !audio.paused;
    layer = button.dataset.layer;
    document.querySelectorAll('[data-layer]').forEach(b => b.setAttribute('aria-pressed', String(b===button)));
    draw(); load(layer==='cues' && position<8.8 ? 8.8 : position,resume);
    if (!resume) status(layer==='cues' ? 'Cues begin at 0:09. Use the moment buttons to hear each one.' : 'Layer selected. Press play to listen.');
  }));
  $('play').addEventListener('click', () => {
    if (shouldPlay || !audio.paused) { shouldPlay=false; audio.pause(); updatePlay(); status('Paused.'); }
    else { shouldPlay=true; if (!audio.getAttribute('src') && !loading) load(pendingPosition ?? 0,true); else play(); }
  });
  function seek(t) { if (!audio.getAttribute('src')) { load(t,false); } else if (audio.readyState) { audio.currentTime=t; pendingPosition=null; } else { pendingPosition=t; } updatePosition(); }
  $('restart').addEventListener('click', () => seek(layer==='cues' ? 8.8 : 0));
  $('seek').addEventListener('input', event => seek(Number(event.target.value)));
  document.querySelectorAll('[data-time]').forEach(button => button.addEventListener('click', () => { seek(Number(button.dataset.time)); play(); }));
  function volume() {
    const value = Number($('volume').value)/100;
    audio.volume = value*(siteLevel ? 10**(-9/20) : 1);
    $('volume-value').textContent = `${Math.round(value*100)}%`;
  }
  $('volume').addEventListener('input',volume);
  $('site-level').addEventListener('click', () => { siteLevel=!siteLevel; $('site-level').setAttribute('aria-pressed',String(siteLevel)); volume(); status(siteLevel ? 'Quiet site level: playback reduced by 9 dB.' : 'Comparison level restored.'); });
  document.addEventListener('visibilitychange', () => { if(document.hidden) { const active=shouldPlay || !audio.paused; shouldPlay=false; audio.pause(); updatePlay(); if(active) status('Paused while the listening room is hidden.'); } });
  window.addEventListener('pagehide',()=>{audio.pause();shouldPlay=false;controller?.abort();});
  fetch('variants.json').then(r=>{if(!r.ok)throw new Error();return r.json();}).then(data=>{variants=data;draw();}).catch(()=>status('Waveform data could not load. Audio playback is still available.'));
  volume();
})();
