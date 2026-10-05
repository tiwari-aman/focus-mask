import React, { useMemo, useCallback, useState, useEffect } from "react";

function MaskOverlay({
  areas,
  previewArea,
  blur,
  darkness,
  onRemoveArea,
  onResizeArea,
  blockInteraction,
  zoomRatio = 1,
}) {
  return (
    <>
      <div className="focusmask-mask-overlay">
        <BlurOverlay
          areas={areas}
          previewArea={previewArea}
          blur={blur}
          darkness={darkness}
        />
        {/* Separate cursor overlay for block interaction */}
        {blockInteraction && areas.length > 0 && (
          <CursorOverlay areas={areas} />
        )}
      </div>
      <svg className="focusmask-svg">
        {areas.map((area, index) => (
          <FocusAreaOutline
            key={index}
            area={area}
            index={index}
            zoomRatio={zoomRatio}
            onRemove={() => onRemoveArea(index)}
            onResize={(newArea) => onResizeArea(index, newArea)}
          />
        ))}
      </svg>
    </>
  );
}

/**
 * Cursor overlay that shows not-allowed cursor only outside focus areas
 * Uses 4 rectangles around the focus area to show blocked cursor
 */
function CursorOverlay({ areas }) {
  // For the cursor overlay, we'll use 4 rectangles around the focus area
  // Add padding to avoid covering resize handles and delete button
  const overlayRects = useMemo(() => {
    if (areas.length === 0) return [];

    const area = areas[0]; // Support single area for now
    // Add padding to avoid covering resize handles (corners) and delete button (top-right)
    const padding = 35; // Extra space for controls

    return [
      // Top rectangle - leave space for delete button
      { top: 0, left: 0, width: "100%", height: Math.max(0, area.y - padding) },
      // Bottom rectangle
      {
        top: area.y + area.height + padding,
        left: 0,
        width: "100%",
        height: `calc(100% - ${area.y + area.height + padding}px)`,
      },
      // Left rectangle
      {
        top: Math.max(0, area.y - padding),
        left: 0,
        width: Math.max(0, area.x - padding),
        height: area.height + padding * 2,
      },
      // Right rectangle - leave space for delete button
      {
        top: Math.max(0, area.y - padding),
        left: area.x + area.width + padding,
        width: `calc(100% - ${area.x + area.width + padding}px)`,
        height: area.height + padding * 2,
      },
    ];
  }, [areas]);

  return (
    <>
      {overlayRects.map((rect, i) => (
        <div
          key={i}
          style={{
            position: "fixed",
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            cursor: "not-allowed",
            pointerEvents: "auto",
            zIndex: 999990, // Lower than toolbar (999999) and SVG controls
          }}
        />
      ))}
    </>
  );
}

function BlurOverlay({ areas, previewArea, blur, darkness }) {
  // Combine areas and previewArea (if exists) for the cutouts
  const allAreas = useMemo(() => {
    return previewArea ? [...areas, previewArea] : areas;
  }, [areas, previewArea]);

  // Generate a unique ID for this mask
  const maskId = useMemo(
    () => `focusmask-blur-mask-${Math.random().toString(36).substr(2, 9)}`,
    [],
  );

  // Border radius for the cutout corners (matches the outline rx="6")
  const cornerRadius = 6;

  return (
    <>
      {/* SVG with mask definition */}
      <svg
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          zIndex: 0,
        }}
      >
        <defs>
          <mask id={maskId}>
            {/* White rectangle covers everything (visible) */}
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {/* Black rounded rectangles create the transparent cutouts */}
            {allAreas.map((area, index) => (
              <rect
                key={index}
                x={area.x}
                y={area.y}
                width={area.width}
                height={area.height}
                rx={cornerRadius}
                ry={cornerRadius}
                fill="black"
              />
            ))}
          </mask>
        </defs>
      </svg>

      {/* Blur overlay with SVG mask applied */}
      <div
        className="focusmask-blur-section"
        style={{
          backgroundColor: `rgba(0, 0, 0, ${darkness})`,
          backdropFilter: `blur(${blur}px)`,
          WebkitBackdropFilter: `blur(${blur}px)`,
          mask: allAreas.length > 0 ? `url(#${maskId})` : "none",
          WebkitMask: allAreas.length > 0 ? `url(#${maskId})` : "none",
        }}
      />
    </>
  );
}

function FocusAreaOutline({ area, index, onRemove, onResize, zoomRatio = 1 }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [resizeHandle, setResizeHandle] = useState(null);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [startArea, setStartArea] = useState(null);
  const hoverTimeoutRef = React.useRef(null);
  const isInteractingRef = React.useRef(false);

  const zoom = zoomRatio || 1;
  const invZoom = 1 / zoom;

  // Sizing scaled inversely with zoom to maintain constant physical size on monitor
  const handleSize = 10 * invZoom;
  const btnOffset = 18 * invZoom;
  const btnRadius = 12 * invZoom;
  const dragBtnOffsetY = 25 * invZoom;
  const dragPillWidth = 36 * invZoom;
  const dragPillHeight = 20 * invZoom;
  const dragPillRx = 10 * invZoom;
  const strokeOutline = 2 * invZoom;
  const strokeGlow = 4 * invZoom;
  const rx = 6 * invZoom;
  const borderWidth = 15 * invZoom;
  const fontSize = 16 * invZoom;

  const handleMouseEnter = useCallback(() => {
    // Clear any pending hide timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (!isResizing && !isDragging && !isInteractingRef.current) {
      // Longer delay before hiding to prevent flicker
      hoverTimeoutRef.current = setTimeout(() => {
        setIsHovered(false);
      }, 200);
    }
  }, [isResizing, isDragging]);

  // Track when mouse is over interactive elements
  const handleInteractiveEnter = useCallback(() => {
    isInteractingRef.current = true;
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setIsHovered(true);
  }, []);

  const handleInteractiveLeave = useCallback(() => {
    isInteractingRef.current = false;
    // Start the delayed hide when leaving interactive element
    if (!isResizing && !isDragging) {
      hoverTimeoutRef.current = setTimeout(() => {
        if (!isInteractingRef.current) {
          setIsHovered(false);
        }
      }, 300);
    }
  }, [isResizing, isDragging]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  // Handle resize start
  const handleResizeStart = useCallback(
    (e, handle) => {
      e.stopPropagation();
      e.preventDefault();
      setIsResizing(true);
      setResizeHandle(handle);
      setStartPos({ x: e.clientX, y: e.clientY });
      setStartArea({ ...area });
    },
    [area],
  );

  // Handle drag start
  const handleDragStart = useCallback(
    (e) => {
      e.stopPropagation();
      e.preventDefault();
      setIsDragging(true);
      setStartPos({ x: e.clientX, y: e.clientY });
      setStartArea({ ...area });
    },
    [area],
  );

  // Handle resize move
  useEffect(() => {
    if (!isResizing || !startArea) return;

    const handleMove = (e) => {
      const deltaX = e.clientX - startPos.x;
      const deltaY = e.clientY - startPos.y;

      let newArea = { ...startArea };

      switch (resizeHandle) {
        case "nw": // Top-left
          newArea.x = startArea.x + deltaX;
          newArea.y = startArea.y + deltaY;
          newArea.width = startArea.width - deltaX;
          newArea.height = startArea.height - deltaY;
          break;
        case "ne": // Top-right
          newArea.y = startArea.y + deltaY;
          newArea.width = startArea.width + deltaX;
          newArea.height = startArea.height - deltaY;
          break;
        case "sw": // Bottom-left
          newArea.x = startArea.x + deltaX;
          newArea.width = startArea.width - deltaX;
          newArea.height = startArea.height + deltaY;
          break;
        case "se": // Bottom-right
          newArea.width = startArea.width + deltaX;
          newArea.height = startArea.height + deltaY;
          break;
      }

      // Ensure minimum size
      if (newArea.width < 30) {
        if (resizeHandle === "nw" || resizeHandle === "sw") {
          newArea.x = startArea.x + startArea.width - 30;
        }
        newArea.width = 30;
      }
      if (newArea.height < 30) {
        if (resizeHandle === "nw" || resizeHandle === "ne") {
          newArea.y = startArea.y + startArea.height - 30;
        }
        newArea.height = 30;
      }

      onResize(newArea);
    };

    const handleUp = () => {
      setIsResizing(false);
      setResizeHandle(null);
      setStartArea(null);
    };

    document.addEventListener("pointermove", handleMove);
    document.addEventListener("pointerup", handleUp);
    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleUp);

    return () => {
      document.removeEventListener("pointermove", handleMove);
      document.removeEventListener("pointerup", handleUp);
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleUp);
    };
  }, [isResizing, resizeHandle, startPos, startArea, onResize]);

  // Handle drag move
  useEffect(() => {
    if (!isDragging || !startArea) return;

    const handleMove = (e) => {
      const deltaX = e.clientX - startPos.x;
      const deltaY = e.clientY - startPos.y;

      let newX = startArea.x + deltaX;
      let newY = startArea.y + deltaY;

      // Get viewport dimensions
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Constrain to viewport boundaries
      newX = Math.max(0, Math.min(newX, viewportWidth - startArea.width));
      newY = Math.max(0, Math.min(newY, viewportHeight - startArea.height));

      const newArea = {
        ...startArea,
        x: newX,
        y: newY,
      };

      onResize(newArea);
    };

    const handleUp = () => {
      setIsDragging(false);
      setStartArea(null);
    };

    document.addEventListener("pointermove", handleMove);
    document.addEventListener("pointerup", handleUp);
    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleUp);

    return () => {
      document.removeEventListener("pointermove", handleMove);
      document.removeEventListener("pointerup", handleUp);
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleUp);
    };
  }, [isDragging, startPos, startArea, onResize]);

  // Position delete button further away from top-right corner
  const btnX = area.x + area.width + btnOffset;
  const btnY = area.y - btnOffset;

  // Position drag handle at bottom center, inside the selection
  const dragBtnX = area.x + area.width / 2;
  const dragBtnY = area.y + area.height - dragBtnOffsetY;

  // Resize handle positions
  const handles = [
    {
      id: "nw",
      x: area.x - handleSize / 2,
      y: area.y - handleSize / 2,
      cursor: "nw-resize",
    },
    {
      id: "ne",
      x: area.x + area.width - handleSize / 2,
      y: area.y - handleSize / 2,
      cursor: "ne-resize",
    },
    {
      id: "sw",
      x: area.x - handleSize / 2,
      y: area.y + area.height - handleSize / 2,
      cursor: "sw-resize",
    },
    {
      id: "se",
      x: area.x + area.width - handleSize / 2,
      y: area.y + area.height - handleSize / 2,
      cursor: "se-resize",
    },
  ];

  return (
    <g
      className={`focusmask-area-group ${isResizing ? "resizing" : ""} ${
        isDragging ? "dragging" : ""
      } ${isHovered ? "hovered" : ""}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Extended hover areas outside the selection for detecting mouse near edges */}
      <rect
        className="focusmask-hover-border"
        x={area.x - borderWidth}
        y={area.y - borderWidth}
        width={area.width + borderWidth * 2}
        height={borderWidth}
        fill="transparent"
      />
      <rect
        className="focusmask-hover-border"
        x={area.x - borderWidth}
        y={area.y + area.height}
        width={area.width + borderWidth * 2}
        height={borderWidth}
        fill="transparent"
      />
      <rect
        className="focusmask-hover-border"
        x={area.x - borderWidth}
        y={area.y}
        width={borderWidth}
        height={area.height}
        fill="transparent"
      />
      <rect
        className="focusmask-hover-border"
        x={area.x + area.width}
        y={area.y}
        width={borderWidth}
        height={area.height}
        fill="transparent"
      />

      {/* Outline with subtle glow effect */}
      <rect
        className="focusmask-outline-glow"
        x={area.x}
        y={area.y}
        width={area.width}
        height={area.height}
        fill="none"
        stroke="rgba(74, 122, 181, 0.25)"
        strokeWidth={strokeGlow}
        rx={rx}
        style={{ filter: "blur(2px)" }}
      />
      <rect
        className="focusmask-outline"
        x={area.x}
        y={area.y}
        width={area.width}
        height={area.height}
        fill="none"
        stroke="#4a7ab5"
        strokeWidth={strokeOutline}
        rx={rx}
      />

      {/* Resize handles at corners - with scaled hit areas */}
      {handles.map((handle) => (
        <g key={handle.id}>
          {/* Invisible hit area for easier interaction */}
          <rect
            x={handle.x - 8 * invZoom}
            y={handle.y - 8 * invZoom}
            width={handleSize + 16 * invZoom}
            height={handleSize + 16 * invZoom}
            fill="transparent"
            style={{ cursor: handle.cursor, pointerEvents: "all" }}
            onMouseEnter={handleInteractiveEnter}
            onMouseLeave={handleInteractiveLeave}
            onMouseDown={(e) => handleResizeStart(e, handle.id)}
            onPointerDown={(e) => handleResizeStart(e, handle.id)}
          />
          {/* Visible handle */}
          <rect
            className={`focusmask-resize-handle ${
              isHovered || isResizing ? "visible" : ""
            }`}
            x={handle.x}
            y={handle.y}
            width={handleSize}
            height={handleSize}
            fill="#4a7ab5"
            stroke="white"
            strokeWidth={strokeOutline}
            rx={3 * invZoom}
            style={{ cursor: handle.cursor, pointerEvents: "none" }}
          />
        </g>
      ))}

      {/* Delete button */}
      <g style={{ cursor: "pointer" }}>
        {/* Invisible hit area */}
        <rect
          x={btnX - 15 * invZoom}
          y={btnY - 15 * invZoom}
          width={30 * invZoom}
          height={30 * invZoom}
          fill="transparent"
          onMouseEnter={handleInteractiveEnter}
          onMouseLeave={handleInteractiveLeave}
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        />
        {/* Visible delete button */}
        <circle
          cx={btnX}
          cy={btnY}
          r={btnRadius}
          fill="#ff4444"
          stroke="white"
          strokeWidth={strokeOutline}
          style={{
            pointerEvents: "none",
            opacity: isHovered || isResizing ? 1 : 0,
            transition: "opacity 0.15s ease",
          }}
        />
        <text
          x={btnX}
          y={btnY + 1 * invZoom}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="white"
          fontSize={fontSize}
          fontWeight="bold"
          style={{
            pointerEvents: "none",
            opacity: isHovered || isResizing ? 1 : 0,
            transition: "opacity 0.15s ease",
          }}
        >
          ×
        </text>
      </g>

      {/* Drag handle button at bottom center */}
      <g style={{ cursor: isDragging ? "grabbing" : "grab" }}>
        {/* Invisible hit area for drag handle */}
        <rect
          x={dragBtnX - 20 * invZoom}
          y={dragBtnY - 12 * invZoom}
          width={40 * invZoom}
          height={24 * invZoom}
          fill="transparent"
          onMouseEnter={handleInteractiveEnter}
          onMouseLeave={handleInteractiveLeave}
          onMouseDown={handleDragStart}
          onPointerDown={handleDragStart}
        />
        {/* Visible drag handle - pill shaped */}
        <rect
          x={dragBtnX - dragPillWidth / 2}
          y={dragBtnY - dragPillHeight / 2}
          width={dragPillWidth}
          height={dragPillHeight}
          rx={dragPillRx}
          fill="#4a7ab5"
          stroke="white"
          strokeWidth={strokeOutline}
          style={{
            pointerEvents: "none",
            opacity: isHovered || isResizing || isDragging ? 1 : 0,
            transition: "opacity 0.15s ease",
          }}
        />
        {/* Move icon - 4 arrows */}
        <g
          style={{
            pointerEvents: "none",
            opacity: isHovered || isResizing || isDragging ? 1 : 0,
            transition: "opacity 0.15s ease",
          }}
        >
          {/* Center dot */}
          <circle cx={dragBtnX} cy={dragBtnY} r={1.5 * invZoom} fill="white" />
          {/* Left arrow */}
          <path
            d={`M${dragBtnX - 10 * invZoom} ${dragBtnY} L${
              dragBtnX - 6 * invZoom
            } ${dragBtnY - 3 * invZoom} L${dragBtnX - 6 * invZoom} ${
              dragBtnY + 3 * invZoom
            } Z`}
            fill="white"
          />
          {/* Right arrow */}
          <path
            d={`M${dragBtnX + 10 * invZoom} ${dragBtnY} L${
              dragBtnX + 6 * invZoom
            } ${dragBtnY - 3 * invZoom} L${dragBtnX + 6 * invZoom} ${
              dragBtnY + 3 * invZoom
            } Z`}
            fill="white"
          />
          {/* Up arrow */}
          <path
            d={`M${dragBtnX} ${dragBtnY - 6 * invZoom} L${
              dragBtnX - 3 * invZoom
            } ${dragBtnY - 3 * invZoom} L${dragBtnX + 3 * invZoom} ${
              dragBtnY - 3 * invZoom
            } Z`}
            fill="white"
          />
          {/* Down arrow */}
          <path
            d={`M${dragBtnX} ${dragBtnY + 6 * invZoom} L${
              dragBtnX - 3 * invZoom
            } ${dragBtnY + 3 * invZoom} L${dragBtnX + 3 * invZoom} ${
              dragBtnY + 3 * invZoom
            } Z`}
            fill="white"
          />
        </g>
      </g>
    </g>
  );
}

export default MaskOverlay;
