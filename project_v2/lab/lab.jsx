/* ============================================================
   M.O. SYSTEM — HERO LAB  (reusable, project-agnostic)
   ------------------------------------------------------------
   A standalone playground for the shared hero rig. Pick a model,
   dial in the resting layout (offset · scale · vertical), preview
   orbit + exploded view, and copy the exact setLayout() values to
   paste into any project page's config. The production project
   pages stay clean — all the knobs live here.
   ============================================================ */
const { useState: useLab, useEffect: useLabE, useRef: useLabR } = React;

const LAB_MODELS = [
  { id: "wafer",      label: "Wafer",      url: "../../models/wafer.glb" },
  { id: "flashlight", label: "Flashlight", url: "../../models/tactical_flashlight.glb" },
];

const LAYOUT_PRESETS = {
  right:  { fracX:  0.46, scale: 0.92, offY: 0.0 },
  center: { fracX:  0.0,  scale: 0.74, offY: 0.14 },
  left:   { fracX: -0.46, scale: 0.92, offY: 0.0 },
};

const LAB_DEFAULTS = /*EDITMODE-BEGIN*/{
  "model": "wafer",
  "layout": "right",
  "fracX": 0.46,
  "scale": 0.92,
  "offY": 0,
  "idle": true,
  "explode": false
}/*EDITMODE-END*/;

function HeroLab() {
  const [t, setTweak] = useTweaks(LAB_DEFAULTS);
  const stageRef = useLabR(null);
  const rigRef = useLabR(null);
  const modelRef = useLabR(t.model);

  // (re)build the rig whenever the model changes
  useLabE(() => {
    const mount = stageRef.current;
    if (!mount) return;
    const def = LAB_MODELS.find((m) => m.id === t.model) || LAB_MODELS[0];
    // tear down previous
    if (rigRef.current) { try { rigRef.current.dispose(); } catch (_) {} rigRef.current = null; }
    while (mount.firstChild) mount.removeChild(mount.firstChild);

    const rig = window.makeWaferRig(mount, { model: def.url });
    rigRef.current = rig;
    window.__labRig = rig;
    if (!rig) return;
    rig.snapToLayout(t.fracX, t.scale, t.offY, window.WAFER_RIG.arriveYaw);
    rig.setIdle(!!t.idle);
    rig.setExplode(t.explode ? 1 : 0);

    let raf, last = performance.now();
    const loop = (now) => { const dt = now - last; last = now; rig.update(dt); rig.render(); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);

    const onResize = () => rig.setSize(mount.clientWidth, mount.clientHeight);
    window.addEventListener("resize", onResize);

    // drag-to-orbit
    let dragging = false, lx = 0, ly = 0;
    const dom = rig.el;
    const down = (e) => { dragging = true; lx = e.clientX; ly = e.clientY; dom.setPointerCapture?.(e.pointerId); };
    const move = (e) => { if (!dragging) return; rig.orbit(e.clientX - lx, e.clientY - ly); lx = e.clientX; ly = e.clientY; };
    const up = (e) => { dragging = false; try { dom.releasePointerCapture?.(e.pointerId); } catch (_) {} };
    dom.addEventListener("pointerdown", down);
    dom.addEventListener("pointermove", move);
    dom.addEventListener("pointerup", up);
    dom.addEventListener("pointercancel", up);

    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", onResize); rig.dispose(); };
  }, [t.model]);

  // live-apply layout sliders
  useLabE(() => { if (rigRef.current) rigRef.current.setLayout(t.fracX, t.scale, t.offY); }, [t.fracX, t.scale, t.offY]);
  useLabE(() => { if (rigRef.current) rigRef.current.setIdle(!!t.idle); }, [t.idle]);
  useLabE(() => { if (rigRef.current) rigRef.current.setExplode(t.explode ? 1 : 0); }, [t.explode]);

  // choosing a layout preset snaps the fine sliders to it
  const pickLayout = (name) => {
    const p = LAYOUT_PRESETS[name];
    setTweak({ layout: name, fracX: p.fracX, scale: p.scale, offY: p.offY });
  };
  const resetOrbit = () => { if (rigRef.current) rigRef.current.resetOrbit(); };

  const snippet = `applyHeroLayout: rig.setLayout(${t.fracX.toFixed(2)}, ${t.scale.toFixed(2)}, ${t.offY.toFixed(2)})`;

  return (
    <>
      <div className="lab-stage"><div className="lab-stage__mount" ref={stageRef} /></div>

      {/* framing reticles so you can judge alignment */}
      <div className="lab-frame" aria-hidden="true">
        <span className="lab-frame__c lab-frame__c--tl" />
        <span className="lab-frame__c lab-frame__c--tr" />
        <span className="lab-frame__c lab-frame__c--bl" />
        <span className="lab-frame__c lab-frame__c--br" />
        <span className="lab-frame__mid lab-frame__mid--v" />
        <span className="lab-frame__mid lab-frame__mid--h" />
      </div>

      {/* mock title block to preview alignment against real text */}
      <div className={"lab-title lab-title--" + t.layout}>
        <div className="lab-title__over"><span className="lab-title__dot" />NODE 0X01 · LAB</div>
        <h1 className="lab-title__name">Title<em>.</em></h1>
        <div className="lab-title__sub">Preview the resting layout · drag the model to orbit</div>
      </div>

      {/* config readout */}
      <div className="lab-readout">
        <div className="lab-readout__k">CONFIG</div>
        <code className="lab-readout__code">{snippet}</code>
        <button className="lab-readout__copy" onClick={() => { navigator.clipboard && navigator.clipboard.writeText(snippet); }}>COPY</button>
      </div>

      <TweaksPanel>
        <TweakSection label="Model" />
        <TweakSelect label="Project model" value={t.model}
          options={LAB_MODELS.map((m) => m.id)}
          onChange={(v) => setTweak("model", v)} />

        <TweakSection label="Resting layout" />
        <TweakRadio label="Preset" value={t.layout}
          options={["right", "center", "left"]}
          onChange={pickLayout} />
        <TweakSlider label="Offset X" value={t.fracX} min={-1} max={1} step={0.02}
          onChange={(v) => setTweak({ layout: "custom", fracX: v })} />
        <TweakSlider label="Scale" value={t.scale} min={0.4} max={1.4} step={0.02}
          onChange={(v) => setTweak({ layout: "custom", scale: v })} />
        <TweakSlider label="Offset Y" value={t.offY} min={-0.5} max={0.5} step={0.02}
          onChange={(v) => setTweak({ layout: "custom", offY: v })} />

        <TweakSection label="Motion" />
        <TweakToggle label="Idle drift" value={t.idle} onChange={(v) => setTweak("idle", v)} />
        <TweakToggle label="Exploded view" value={t.explode} onChange={(v) => setTweak("explode", v)} />
        <TweakButton label="Reset orbit" onClick={resetOrbit} />
      </TweaksPanel>
    </>
  );
}

const labRoot = ReactDOM.createRoot(document.getElementById("root"));
labRoot.render(<HeroLab />);
