/* ============================================================
   KeyButton — the shared keyboard-style action button
   ------------------------------------------------------------
   The one implementation on every route; app/shared/styles/key.css
   draws it. Each caller opts into what its page has always done:

     ripple        default on. A click disturbs the pointer field at
                   the key's centre through window.__mo_disturb. The
                   landing relies on the default. Project pages mount
                   their own standalone field, which defines
                   __mo_disturb too, so they pass ripple={false} to
                   keep it still. Keyboard presses never ripple.
     blurOnPress   release focus after the press (project pages), so
                   the key does not keep a focus ring over the demo.
     cursorMirror  a data-mo-cursor-opacity selector. When set, the cap
                   joins the pointer text fringe (data-mo-cursor-mirror).

   The press sound needs window.MOSound, which only the landing loads.
   ============================================================ */
function KeyButton({ children, legend = "↵", primary, onPress, ripple = true, blurOnPress = false, cursorMirror }) {
  const { useState } = React;
  const [pressed, setPressed] = useState(false);
  const [lit, setLit] = useState(false);
  const fire = (el, fromPointer) => {
    setPressed(true);
    setLit(true);
    if (window.MOSound) { window.MOSound.unlock(); window.MOSound.thock({ vel: 0.85 }); }
    if (ripple && fromPointer && window.__mo_disturb && el && el.getBoundingClientRect) {
      const r = el.getBoundingClientRect();
      window.__mo_disturb(r.left + r.width / 2, r.top + r.height / 2, 0.8);
    }
    onPress && onPress();
    if (blurOnPress && el && el.blur) el.blur();
    setTimeout(() => { setPressed(false); if (window.MOSound) window.MOSound.thockUp(); }, 140);
    setTimeout(() => setLit(false), 520);
  };
  const onKey = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fire(e.currentTarget, false); } };
  return (
    <button
      className={"key " + (pressed ? "key--down " : "") + (lit ? "key--lit " : "") + (primary ? "key--primary" : "")}
      onClick={(e) => fire(e.currentTarget, true)}
      onKeyDown={onKey}
    >
      <span className="key__cap" data-mo-cursor-mirror={cursorMirror ? true : undefined} data-mo-cursor-opacity={cursorMirror}>
        <span className="key__legendTop">{legend}</span>
        <span className="key__label">{children}</span>
      </span>
      <span className="key__shadow" aria-hidden="true" />
    </button>
  );
}
window.KeyButton = KeyButton;
