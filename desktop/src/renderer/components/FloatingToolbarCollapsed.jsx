import React from "react";
import logoUrl from "../assets/focusmasklogo.png";

function FloatingToolbarCollapsed({ onExpand, onMouseDown }) {
  return (
    <div
      className="focusmask-floating-collapsed"
      onClick={onExpand}
      onMouseDown={onMouseDown}
      data-tooltip="Open Focus Mask"
    >
      <img
        src={logoUrl}
        alt="Focus Mask"
        className="focusmask-collapsed-icon"
      />
    </div>
  );
}

export default FloatingToolbarCollapsed;
