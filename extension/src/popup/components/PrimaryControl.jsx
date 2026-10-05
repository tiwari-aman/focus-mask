import React from "react";

/**
 * Primary toggle control for enabling/disabling the focus mask
 */
function PrimaryControl({ enabled, onToggle }) {
  return (
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
  );
}

export default PrimaryControl;
