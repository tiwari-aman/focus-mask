import React from "react";

function DrawingArea({
  active,
  currentRect,
  onStartDrawing,
  onDraw,
  onStopDrawing,
}) {
  return (
    <>
      <div
        className={`focusmask-drawing-area ${active ? "active" : ""}`}
        style={{ touchAction: "none" }}
        onPointerDown={onStartDrawing}
        onPointerMove={onDraw}
        onPointerUp={onStopDrawing}
        onPointerCancel={onStopDrawing}
        onPointerLeave={onStopDrawing}
      />
      {currentRect && (
        <svg className="focusmask-preview-svg">
          <rect
            className="focusmask-preview"
            x={currentRect.x}
            y={currentRect.y}
            width={currentRect.width}
            height={currentRect.height}
            fill="rgba(74, 158, 255, 0.2)"
            stroke="#4a9eff"
            strokeWidth="2"
            strokeDasharray="5,5"
            rx="4"
          />
        </svg>
      )}
    </>
  );
}

export default DrawingArea;
