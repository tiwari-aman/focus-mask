import React from "react";

/**
 * Area management component - handles destructive actions for focus areas
 * 
 * UX Considerations:
 * - Visually separated from other controls to prevent accidental clicks
 * - Clear button is styled as dangerous (btn-danger) to indicate destructive action
 * - Shows count of areas to help user understand impact before clearing
 * - Only appears as a separate section to create cognitive separation from primary controls
 * 
 * Safety: The destructive "Clear" action is intentionally placed in its own section
 * with distinctive styling to reduce accidental activation
 */
function AreaManagement({ areasCount, onClear }) {
  return (
    <div className="section">
      <div className="section-title">Actions</div>
      <button 
        className="btn btn-danger" 
        onClick={onClear}
        disabled={areasCount === 0}
      >
        Clear All Areas
      </button>
    </div>
  );
}

export default AreaManagement;
