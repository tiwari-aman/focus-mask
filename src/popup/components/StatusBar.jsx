import React from "react";

function StatusBar({ enabled, areasCount }) {
  return (
    <div className="status">
      <span className={`status-indicator ${enabled ? "active" : ""}`}></span>
      <span>{enabled ? "Active" : "Disabled"}</span>
      <div className="areas-count">
        {areasCount} focus area{areasCount !== 1 ? "s" : ""} defined
      </div>
    </div>
  );
}

export default StatusBar;
