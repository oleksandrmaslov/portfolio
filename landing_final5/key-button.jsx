/* Shared landing keycap used by title, reel, and handoff controls. */
function KeyButton({ children, legend = "↵", primary, onPress }) {
  const { useState } = React;
  const [pressed, setPressed] = useState(false);
  const [lit, setLit] = useState(false);

  const fire = (e) => {
    setPressed(true);
    setLit(true);
    if (window.MOSound) {
      window.MOSound.unlock();
      window.MOSound.thock({ vel: 0.85 });
    }
    if (window.__mo_disturb && e && e.currentTarget && e.currentTarget.getBoundingClientRect) {
      const r = e.currentTarget.getBoundingClientRect();
      window.__mo_disturb(r.left + r.width / 2, r.top + r.height / 2, 0.8);
    }
    if (onPress) onPress();
    setTimeout(() => {
      setPressed(false);
      if (window.MOSound) window.MOSound.thockUp();
    }, 140);
    setTimeout(() => setLit(false), 520);
  };

  const onKey = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      fire(e);
    }
  };

  return (
    <button
      className={"key " + (pressed ? "key--down " : "") + (lit ? "key--lit " : "") + (primary ? "key--primary" : "")}
      onClick={fire}
      onKeyDown={onKey}
    >
      <span className="key__cap">
        <span className="key__legendTop">{legend}</span>
        <span className="key__label">{children}</span>
      </span>
      <span className="key__shadow" aria-hidden="true" />
    </button>
  );
}

window.KeyButton = KeyButton;
