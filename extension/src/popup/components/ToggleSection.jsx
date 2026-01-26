import React from "react";

function ToggleSection({ enabled, onToggle }) {
  return (
    <div className="section">
      <div className="section-title">Quick Controls</div>
      <div className="toggle-container">
        <span className="toggle-label">Enable Focus Mask</span>
        <label className="toggle-switch">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => onToggle(e.target.checked)}
          />
          <span className="toggle-slider"></span>
        </label>
      </div>
    </div>
  );
}

export default ToggleSection;
