import React from "react";

function ActionButtons({ enabled, onToggle, onClear }) {
  return (
    <div className="section">
      <div className="section-title">Actions</div>
      <button
        className={`btn ${enabled ? "btn-secondary" : "btn-primary"}`}
        onClick={onToggle}
      >
        {enabled ? "Disable on This Page" : "Enable on This Page"}
      </button>
      <button className="btn btn-danger" onClick={onClear}>
        Clear All Focus Areas
      </button>
    </div>
  );
}

export default ActionButtons;
