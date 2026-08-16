/* ============================================================
   M.O. — Landing v13 · Tweaks
   ------------------------------------------------------------
   A separate React root for the Tweaks panel (the landing app root
   stays untouched). Controls write into the live tuning surfaces:

     · window.__mo_flightCfg (seam style / transit FX / doppler)
                                → flight.js + universe, per frame
     · window.__mo_score  (character / space)  → score.js re-applies
     · MOSound volume     (presence)           → engine master
     · window.__mo_fx     (ripple / topology)  → universe reads per frame
   ============================================================ */
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "seamStyle": "surge",
  "warp": 65,
  "doppler": true,
  "fieldCharacter": "blend",
  "presence": 50,
  "space": 60,
  "rippleStrength": 100,
  "constellation": 100
}/*EDITMODE-END*/;

function V13Tweaks() {
  const { useEffect } = React;
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  /* flight — seam style, transit FX, rail grab, doppler */
  useEffect(() => {
    window.__mo_flightCfg = Object.assign(window.__mo_flightCfg || {}, {
      style: t.seamStyle,
      warp: t.warp,
      doppler: !!t.doppler,
    });
  }, [t.seamStyle, t.warp, t.doppler]);

  /* character + space → score */
  useEffect(() => {
    window.__mo_score = window.__mo_score || {};
    window.__mo_score.character = t.fieldCharacter;
    window.__mo_score.space = t.space;
    try { window.dispatchEvent(new CustomEvent("mo:scoreTweak")); } catch (_) {}
  }, [t.fieldCharacter, t.space]);

  /* presence → master volume. Only push into the engine while sound is ON
     (MOSound.setVolume un-mutes by design); when muted, persist for next
     enable via the engine's own localStorage key. */
  useEffect(() => {
    const v = t.presence / 100;
    if (window.MOSound && !window.MOSound.isMuted()) window.MOSound.setVolume(v);
    else { try { localStorage.setItem("cf_vol", String(v)); } catch (_) {} }
  }, [t.presence]);

  /* ripple + constellation → universe FX scalars */
  useEffect(() => {
    window.__mo_fx = window.__mo_fx || {};
    window.__mo_fx.ripple = t.rippleStrength / 100;
    window.__mo_fx.topology = t.constellation / 100;
  }, [t.rippleStrength, t.constellation]);

  return (
    <TweaksPanel>
      <TweakSection label="Flight path" />
      <TweakRadio
        label="Seam style"
        value={t.seamStyle}
        options={["surge", "tunnel", "calm"]}
        onChange={(v) => setTweak("seamStyle", v)}
      />
      <TweakSlider
        label="Transit FX"
        value={t.warp} min={0} max={200} unit="%"
        onChange={(v) => setTweak("warp", v)}
      />
      <TweakToggle
        label="Doppler wind"
        value={t.doppler}
        onChange={(v) => setTweak("doppler", v)}
      />
      <TweakSection label="Sound field" />
      <TweakRadio
        label="Character"
        value={t.fieldCharacter}
        options={["void", "breath", "deep", "blend"]}
        onChange={(v) => setTweak("fieldCharacter", v)}
      />
      <TweakSlider
        label="Presence"
        value={t.presence} min={0} max={100} unit="%"
        onChange={(v) => setTweak("presence", v)}
      />
      <TweakSlider
        label="Space"
        value={t.space} min={0} max={100} unit="%"
        onChange={(v) => setTweak("space", v)}
      />
      <TweakSection label="Disturbance" />
      <TweakSlider
        label="Ripple strength"
        value={t.rippleStrength} min={0} max={200} unit="%"
        onChange={(v) => setTweak("rippleStrength", v)}
      />
      <TweakSlider
        label="Constellation"
        value={t.constellation} min={0} max={200} unit="%"
        onChange={(v) => setTweak("constellation", v)}
      />
    </TweaksPanel>
  );
}

(function mountV13Tweaks() {
  const host = document.createElement("div");
  host.id = "v13-tweaks-root";
  document.body.appendChild(host);
  ReactDOM.createRoot(host).render(<V13Tweaks />);
})();
