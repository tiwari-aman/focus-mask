import React from "react";

/**
 * StatusSection - Displays the current state of the extension for the active tab
 * Shows whether the mask is enabled and how many focus areas are defined
 */
function StatusBar({ enabled, areasCount }) {
  return (
    <div className="section">
      <div className="section-title">Status</div>
      <div className="toggle-container" style={{ justifyContent: "flex-start", gap: "12px", background: "rgba(130, 184, 249, 0.1)" }}>
        <span className={`status-indicator ${enabled ? "active" : ""}`}></span>
        <span className="toggle-label" style={{ flex: 1 }}>
          {enabled ? "Focus Mask Active" : "Focus Mask Ready"}
        </span>
        <span style={{ fontSize: "11px", color: "#82b8f9", fontVariantNumeric: "tabular-nums" }}>
          {areasCount} {areasCount === 1 ? "Area" : "Areas"}
        </span>
      </div>
    </div>
  );
}

export default StatusBar;
