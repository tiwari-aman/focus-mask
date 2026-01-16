import React from "react";

const iconUrl = chrome.runtime.getURL("assets/focusmasklogo.png"); // Use consistent logo

// The full expanded floating toolbar
function FloatingToolbarExpanded({
  drawMode,
  blur,
  darkness,
  blockInteraction,
  hasReachedLimit,
  onToggleDrawMode,
  onClear,
  onBlurChange,
  onDarknessChange,
  onBlockChange,
  onCollapse,
  onMouseDown
}) {
  const blurPercent = Math.round((blur / 20) * 100);
  const darknessPercent = Math.round(darkness * 100);

  // Prevent drag when interacting with controls
  const stopPropagation = (e) => e.stopPropagation();

  return (
    <div 
        className="focusmask-floating-expanded" 
        onMouseDown={onMouseDown} // Allow dragging from anywhere
        onClick={stopPropagation}
    >
      <div className="focusmask-floating-row">
        
        {/* Main Logo */}
        <div 
            className="focusmask-floating-logo-container" 
            data-tooltip="Drag to reposition"
        >
             <img src={iconUrl} alt="Focus Mask" className="focusmask-expanded-logo" />
        </div>

        <div className="focusmask-divider"></div>

        {/* Draw Button */}
        <button
          className={`focusmask-floating-btn ${drawMode ? "active" : ""} ${hasReachedLimit && !drawMode ? "disabled" : ""}`}
          onClick={onToggleDrawMode}
          onMouseDown={stopPropagation} // Prevent drag
          disabled={hasReachedLimit && !drawMode}
          data-tooltip={
            hasReachedLimit && !drawMode 
              ? "Area limit reached (1 max)" 
              : drawMode 
                ? "Cancel selection" 
                : "Select focus area"
          }
        >
          <svg viewBox="0 0 24 24" className="focusmask-floating-icon" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" strokeDasharray="5,3" />
             <path d="M9 12h6m-3-3v6" />
          </svg>
        </button>

         {/* Clear Button */}
         <button 
           className={`focusmask-floating-btn ${!hasReachedLimit ? "disabled" : ""}`}
           onClick={hasReachedLimit ? onClear : undefined} 
           onMouseDown={stopPropagation} 
           disabled={!hasReachedLimit}
           data-tooltip={hasReachedLimit ? "Clear focus area" : "No area to clear"}
         >
           <svg viewBox="0 0 24 24" className="focusmask-floating-icon" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
           </svg>
        </button>

        <div className="focusmask-divider"></div>

        {/* Sliders Area with Labels */}
        <div className="focusmask-floating-controls">
           <div className="focusmask-floating-control-group">
              <div className="focusmask-floating-label">BLUR</div>
              <input
                type="range"
                className="focusmask-floating-slider"
                min="0"
                max="100"
                value={blurPercent}
                onChange={(e) => onBlurChange(Math.round((parseInt(e.target.value) / 100) * 20))}
                onMouseDown={stopPropagation}
                data-tooltip={`Blur: ${blurPercent}%`}
              />
           </div>
           
           <div className="focusmask-floating-control-group">
               <div className="focusmask-floating-label">DARK</div>
               <input
                type="range"
                className="focusmask-floating-slider"
                min="0"
                max="100"
                value={darknessPercent}
                onChange={(e) => onDarknessChange(parseInt(e.target.value) / 100)}
                onMouseDown={stopPropagation}
                 data-tooltip={`Darkness: ${darknessPercent}%`}
              />
           </div>
        </div>

         <div className="focusmask-divider"></div>

        {/* Block Interaction Toggle */}
        <button
          className={`focusmask-floating-btn ${blockInteraction ? "active" : ""} ${!hasReachedLimit ? "disabled" : ""}`}
          onClick={() => hasReachedLimit && onBlockChange(!blockInteraction)}
          onMouseDown={stopPropagation}
          disabled={!hasReachedLimit}
          data-tooltip={
            !hasReachedLimit 
              ? "Select an area first" 
              : blockInteraction 
                ? "Enable outside clicks" 
                : "Disable outside clicks"
          }
        >
             {/* Block Outside Interaction Icon */}
             <svg viewBox="0 0 24 24" className="focusmask-floating-icon" fill="none" stroke="currentColor" strokeWidth="2">
                 <circle cx="12" cy="12" r="10" />
                 <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
             </svg>
        </button>
        
        {/* Collapse/Close Button */}
         <button 
           className="focusmask-floating-btn focusmask-close-btn" 
           onClick={onCollapse} 
           onMouseDown={stopPropagation} 
           data-tooltip="Collapse toolbar"
         >
             <svg viewBox="0 0 24 24" className="focusmask-floating-icon" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
             </svg>
         </button>
      </div>
    </div>
  );
}

export default FloatingToolbarExpanded;
