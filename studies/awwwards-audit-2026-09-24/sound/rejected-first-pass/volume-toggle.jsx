/* Quiet state indicator. Sound owns no animation loop. */
function VolumeToggle() {
  const { useState, useEffect } = React;
  const [sound, setSound] = useState({ muted: true, loading: false, error: false });
  useEffect(() => window.MOSound && window.MOSound.onState(setSound), []);
  const { muted, loading, error } = sound;
  const label = loading ? "Cancel sound loading" : error ? "Retry enabling sound" : muted ? "Enable sound" : "Mute sound";
  return (
    <button
      className={"volBtn " + (muted ? "is-off" : "is-on")}
      onClick={() => window.MOSound && window.MOSound.toggleMute()}
      aria-label={label}
      aria-pressed={!muted}
      title={label}
    >
      <svg className="volBtn__wave" viewBox="0 0 38 16" width="38" height="16" aria-hidden="true">
        <path d={muted ? "M0 8 L38 8" : "M0 8 H6 L9 5 L13 11 L17 3 L21 13 L25 5 L29 9 L32 8 H38"} fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span aria-live="polite">{loading ? "loading sound" : error ? "sound unavailable" : muted ? "sound off" : "sound on"}</span>
    </button>
  );
}
