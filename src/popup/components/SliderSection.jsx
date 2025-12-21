import React from "react";

function Slider({ label, value, displayValue, min, max, onChange }) {
  return (
    <div className="slider-container">
      <div className="slider-header">
        <span className="slider-label">{label}</span>
        <span className="slider-value">{displayValue}</span>
      </div>
      <input
        type="range"
        className="slider"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
      />
    </div>
  );
}

function ToggleRow({ label, description, checked, onChange }) {
  return (
    <div className="toggle-row">
      <div className="toggle-info">
        <div className="toggle-row-label">{label}</div>
        {description && <div className="toggle-row-desc">{description}</div>}
      </div>
      <label className="toggle-switch">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="toggle-slider"></span>
      </label>
    </div>
  );
}

function SliderSection({
  blur,
  darkness,
  blockInteraction,
  onBlurChange,
  onDarknessChange,
  onBlockChange,
}) {
  const blurPercent = Math.round((blur / 20) * 100);
  const darknessPercent = Math.round(darkness * 100);

  return (
    <>
      <div className="section">
        <div className="section-title">Appearance</div>
        <Slider
          label="Blur Intensity"
          value={blurPercent}
          displayValue={`${blurPercent}%`}
          min={0}
          max={100}
          onChange={(value) => onBlurChange(Math.round((value / 100) * 20))}
        />
        <Slider
          label="Darkness Level"
          value={darknessPercent}
          displayValue={`${darknessPercent}%`}
          min={0}
          max={100}
          onChange={(value) => onDarknessChange(value / 100)}
        />
      </div>

      <div className="section">
        <div className="section-title">Interaction</div>
        <ToggleRow
          label="Block Outside Clicks"
          description="Prevent clicking outside focus areas"
          checked={blockInteraction}
          onChange={onBlockChange}
        />
      </div>
    </>
  );
}

export default SliderSection;
