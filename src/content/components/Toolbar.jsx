import React, { useState, useRef, useEffect, useCallback } from "react";

// Get the extension icon URL from assets
const iconUrl = chrome.runtime.getURL("assets/icon16.png");

function Toolbar({
  visible,
  enabled,
  drawMode,
  blur,
  darkness,
  blockInteraction,
  hasReachedLimit = false,
  onToggle,
  onToggleDrawMode,
  onClear,
  onBlurChange,
  onDarknessChange,
  onBlockChange,
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [position, setPosition] = useState({ x: null, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const toolbarRef = useRef(null);
  const dragOffset = useRef({ x: 0, y: 0 });

  // Set initial position on mount
  useEffect(() => {
    if (position.x === null && toolbarRef.current) {
      setPosition({
        x: window.innerWidth - toolbarRef.current.offsetWidth - 20,
        y: 20,
      });
    }
  }, [position.x]);

  // Dragging handlers
  const handleMouseDown = useCallback(
    (e) => {
      if (!toolbarRef.current) return;
      setIsDragging(true);
      dragOffset.current = {
        x: e.clientX - (position.x ?? 0),
        y: e.clientY - position.y,
      };
      e.preventDefault();
    },
    [position]
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => {
      const newX = Math.max(
        0,
        Math.min(
          window.innerWidth - (toolbarRef.current?.offsetWidth || 200),
          e.clientX - dragOffset.current.x
        )
      );
      const newY = Math.max(
        0,
        Math.min(
          window.innerHeight - (toolbarRef.current?.offsetHeight || 300),
          e.clientY - dragOffset.current.y
        )
      );
      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  if (!visible) return null;

  // Convert blur (0-20px) to percentage (0-100%)
  const blurPercent = Math.round((blur / 20) * 100);
  const darknessPercent = Math.round(darkness * 100);

  return (
    <div
      ref={toolbarRef}
      className={`focusmask-toolbar ${visible ? "visible" : ""} ${
        isDragging ? "dragging" : ""
      } ${collapsed ? "collapsed" : ""}`}
      style={{
        left: position.x ?? "auto",
        top: position.y,
        right: position.x === null ? "20px" : "auto",
      }}
    >
      {/* Compact header with collapse toggle - also draggable */}
      <div className="focusmask-toolbar-header" onMouseDown={handleMouseDown}>
        <img
          src={iconUrl}
          alt="Focus Mask"
          className="focusmask-toolbar-logo-img"
        />
        <span className="focusmask-toolbar-title">Focus Mask</span>
        <button
          className="focusmask-collapse-btn"
          onClick={(e) => {
            e.stopPropagation();
            setCollapsed(!collapsed);
          }}
          onMouseDown={(e) => e.stopPropagation()}
          title={collapsed ? "Expand" : "Collapse"}
        >
          {collapsed ? "▼" : "▲"}
        </button>
      </div>

      {!collapsed && (
        <>
          {/* Quick action buttons with labels */}
          <div className="focusmask-toolbar-actions">
            <div className="focusmask-action-item">
              <button
                className={`focusmask-action-btn ${drawMode ? "active" : ""} ${
                  hasReachedLimit && !drawMode ? "disabled" : ""
                }`}
                onClick={onToggleDrawMode}
                title={
                  hasReachedLimit && !drawMode
                    ? "Clear existing area first"
                    : drawMode
                    ? "Stop Drawing"
                    : "Draw Focus Area"
                }
                disabled={hasReachedLimit && !drawMode}
              >
                <svg
                  className="focusmask-btn-svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect
                    x="3"
                    y="3"
                    width="18"
                    height="18"
                    rx="2"
                    ry="2"
                    strokeDasharray="5,3"
                  />
                  <line x1="9" y1="12" x2="15" y2="12" />
                  <line x1="12" y1="9" x2="12" y2="15" />
                </svg>
              </button>
              <span className="focusmask-action-label">Draw</span>
            </div>
            <div className="focusmask-action-item">
              <button
                className="focusmask-action-btn"
                onClick={onClear}
                title="Clear Focus Area"
              >
                <svg
                  className="focusmask-btn-svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
              <span className="focusmask-action-label">Clear</span>
            </div>
            <div className="focusmask-action-item">
              <button
                className={`focusmask-action-btn ${!enabled ? "active" : ""}`}
                onClick={onToggle}
                title="Disable Focus Mask"
              >
                <svg
                  className="focusmask-btn-svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              </button>
              <span className="focusmask-action-label">Disable</span>
            </div>
          </div>

          {/* Sliders */}
          <div className="focusmask-toolbar-controls">
            <div className="focusmask-control-row">
              <span className="focusmask-control-label">Blur</span>
              <input
                type="range"
                className="focusmask-slider"
                min="0"
                max="100"
                value={blurPercent}
                onChange={(e) =>
                  onBlurChange(
                    Math.round((parseInt(e.target.value) / 100) * 20)
                  )
                }
              />
              <span className="focusmask-control-value">{blurPercent}%</span>
            </div>
            <div className="focusmask-control-row">
              <span className="focusmask-control-label">Dark</span>
              <input
                type="range"
                className="focusmask-slider"
                min="0"
                max="100"
                value={darknessPercent}
                onChange={(e) =>
                  onDarknessChange(parseInt(e.target.value) / 100)
                }
              />
              <span className="focusmask-control-value">
                {darknessPercent}%
              </span>
            </div>
          </div>

          {/* Toggle switch for block clicks */}
          <div className="focusmask-toolbar-toggles">
            <label className="focusmask-toggle-row">
              <span className="focusmask-toggle-label">
                Block outside clicks
              </span>
              <div className="focusmask-toggle-switch">
                <input
                  type="checkbox"
                  checked={blockInteraction}
                  onChange={(e) => onBlockChange(e.target.checked)}
                />
                <span className="focusmask-toggle-slider"></span>
              </div>
            </label>
          </div>

          {/* Draw mode indicator */}
          {drawMode && (
            <div className="focusmask-draw-hint">
              Click and drag to select area
            </div>
          )}
        </>
      )}

      {/* Drag handle */}
      <div className="focusmask-toolbar-handle" onMouseDown={handleMouseDown}>
        ⋮⋮
      </div>
    </div>
  );
}

export default Toolbar;
