import React from "react";

// Small floating icon that expands on click
function FloatingToolbarCollapsed({ onClick, onMouseDown }) {
  // Use consistent logo
  const iconUrl = chrome.runtime.getURL("assets/focusmasklogo.png");

  return (
    <div
      className="focusmask-floating-collapsed"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onMouseDown={onMouseDown}
      title="Open Focus Mask Toolbar"
      style={{ borderRadius: "12px" }} // Squircle for smaller icon
    >
      <img src={iconUrl} alt="Focus Mask" className="focusmask-collapsed-icon" />
    </div>
  );
}

export default FloatingToolbarCollapsed;
