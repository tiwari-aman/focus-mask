import React, { useMemo, useCallback, useState, useEffect, useRef } from "react";

function MaskOverlay({
  areas,
  previewArea,
  blur,
  darkness,
  onRemoveArea,
  onResizeArea,
  blockInteraction,
  zoomRatio = 1,
  onHoverControlChange,
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
        {blockInteraction && areas.length > 0 && (
          <CursorOverlay areas={areas} onHoverControlChange={onHoverControlChange} />
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
            onHoverControlChange={onHoverControlChange}
          />
        ))}
      </svg>
    </>
  );
}

/**
 * Cursor overlay that shows not-allowed cursor outside focus areas
 * Uses 4 rectangles around the focus area to block interaction
 */
function CursorOverlay({ areas, onHoverControlChange }) {
  const overlayRects = useMemo(() => {
    if (areas.length === 0) return [];

    const area = areas[0];
    const padding = 35; // Space for controls

    return [
      // Top rectangle
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
      // Right rectangle
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
          onMouseEnter={() => onHoverControlChange?.(true)}
          style={{
            position: "fixed",
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            cursor: "not-allowed",
            pointerEvents: "auto",
            zIndex: 999990,
          }}
        />
      ))}
    </>
  );
}

function BlurOverlay({ areas, previewArea, blur, darkness }) {
  const allAreas = useMemo(() => {
    return previewArea ? [...areas, previewArea] : areas;
  }, [areas, previewArea]);

  const maskId = useMemo(
    () => `focusmask-blur-mask-${Math.random().toString(36).substr(2, 9)}`,
    [],
  );

  const cornerRadius = 6;

  return (
    <>
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
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
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

function FocusAreaOutline({ area, index, onRemove, onResize, zoomRatio = 1, onHoverControlChange }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [resizeHandle, setResizeHandle] = useState(null);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [startArea, setStartArea] = useState(null);
  const hoverTimeoutRef = useRef(null);
  const isInteractingRef = useRef(false);

  const zoom = zoomRatio || 1;
  const invZoom = 1 / zoom;

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
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (!isResizing && !isDragging && !isInteractingRef.current) {
      hoverTimeoutRef.current = setTimeout(() => {
        setIsHovered(false);
      }, 200);
    }
  }, [isResizing, isDragging]);

  const handleInteractiveEnter = useCallback(() => {
    isInteractingRef.current = true;
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setIsHovered(true);
    onHoverControlChange?.(true);
  }, [onHoverControlChange]);

  const handleInteractiveLeave = useCallback(() => {
    isInteractingRef.current = false;
    onHoverControlChange?.(false);
    if (!isResizing && !isDragging) {
      hoverTimeoutRef.current = setTimeout(() => {
        if (!isInteractingRef.current) {
          setIsHovered(false);
        }
      }, 300);
    }
  }, [isResizing, isDragging, onHoverControlChange]);

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  // Resize handler
  const handleResizeStart = useCallback(
    (e, handle) => {
      e.stopPropagation();
      e.preventDefault();
      setIsResizing(true);
      setResizeHandle(handle);
      setStartPos({ x: e.clientX, y: e.clientY });
      setStartArea({ ...area });
      onHoverControlChange?.(true);
    },
    [area, onHoverControlChange],
  );

  // Drag handler
  const handleDragStart = useCallback(
    (e) => {
      e.stopPropagation();
      e.preventDefault();
      setIsDragging(true);
      setStartPos({ x: e.clientX, y: e.clientY });
      setStartArea({ ...area });
      onHoverControlChange?.(true);
    },
    [area, onHoverControlChange],
  );

  // Resize move effect
  useEffect(() => {
    if (!isResizing || !startArea) return;

    const handleMove = (e) => {
      const deltaX = e.clientX - startPos.x;
      const deltaY = e.clientY - startPos.y;

      let newArea = { ...startArea };

      switch (resizeHandle) {
        case "nw":
          newArea.x = startArea.x + deltaX;
          newArea.y = startArea.y + deltaY;
          newArea.width = startArea.width - deltaX;
          newArea.height = startArea.height - deltaY;
          break;
        case "ne":
          newArea.y = startArea.y + deltaY;
          newArea.width = startArea.width + deltaX;
          newArea.height = startArea.height - deltaY;
          break;
        case "sw":
          newArea.x = startArea.x + deltaX;
          newArea.width = startArea.width - deltaX;
          newArea.height = startArea.height + deltaY;
          break;
        case "se":
          newArea.width = startArea.width + deltaX;
          newArea.height = startArea.height + deltaY;
          break;
      }

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
      onHoverControlChange?.(false);
    };

    document.addEventListener("pointermove", handleMove);
    document.addEventListener("pointerup", handleUp);

    return () => {
      document.removeEventListener("pointermove", handleMove);
      document.removeEventListener("pointerup", handleUp);
    };
  }, [isResizing, resizeHandle, startPos, startArea, onResize, onHoverControlChange]);

  // Drag move effect
  useEffect(() => {
    if (!isDragging || !startArea) return;

    const handleMove = (e) => {
      const deltaX = e.clientX - startPos.x;
      const deltaY = e.clientY - startPos.y;

      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let newX = Math.max(0, Math.min(startArea.x + deltaX, viewportWidth - startArea.width));
      let newY = Math.max(0, Math.min(startArea.y + deltaY, viewportHeight - startArea.height));

      onResize({
        ...startArea,
        x: newX,
        y: newY,
      });
    };

    const handleUp = () => {
      setIsDragging(false);
      setStartArea(null);
      onHoverControlChange?.(false);
    };

    document.addEventListener("pointermove", handleMove);
    document.addEventListener("pointerup", handleUp);

    return () => {
      document.removeEventListener("pointermove", handleMove);
      document.removeEventListener("pointerup", handleUp);
    };
  }, [isDragging, startPos, startArea, onResize, onHoverControlChange]);

  const btnX = area.x + area.width + btnOffset;
  const btnY = area.y - btnOffset;
  const dragBtnX = area.x + area.width / 2;
  const dragBtnY = area.y + area.height - dragBtnOffsetY;

  const handles = [
    { id: "nw", x: area.x - handleSize / 2, y: area.y - handleSize / 2, cursor: "nw-resize" },
    { id: "ne", x: area.x + area.width - handleSize / 2, y: area.y - handleSize / 2, cursor: "ne-resize" },
    { id: "sw", x: area.x - handleSize / 2, y: area.y + area.height - handleSize / 2, cursor: "sw-resize" },
    { id: "se", x: area.x + area.width - handleSize / 2, y: area.y + area.height - handleSize / 2, cursor: "se-resize" },
  ];

  return (
    <g
      className={`focusmask-area-group ${isResizing ? "resizing" : ""} ${
        isDragging ? "dragging" : ""
      } ${isHovered ? "hovered" : ""}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Extended hover borders */}
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

      {/* Outlines */}
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

      {/* Resize handles */}
      {handles.map((handle) => (
        <g key={handle.id}>
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
        <g
          style={{
            pointerEvents: "none",
            opacity: isHovered || isResizing || isDragging ? 1 : 0,
            transition: "opacity 0.15s ease",
          }}
        >
          <circle cx={dragBtnX} cy={dragBtnY} r={1.5 * invZoom} fill="white" />
          <path
            d={`M${dragBtnX - 10 * invZoom} ${dragBtnY} L${
              dragBtnX - 6 * invZoom
            } ${dragBtnY - 3 * invZoom} L${dragBtnX - 6 * invZoom} ${
              dragBtnY + 3 * invZoom
            } Z`}
            fill="white"
          />
          <path
            d={`M${dragBtnX + 10 * invZoom} ${dragBtnY} L${
              dragBtnX + 6 * invZoom
            } ${dragBtnY - 3 * invZoom} L${dragBtnX + 6 * invZoom} ${
              dragBtnY + 3 * invZoom
            } Z`}
            fill="white"
          />
          <path
            d={`M${dragBtnX} ${dragBtnY - 6 * invZoom} L${
              dragBtnX - 3 * invZoom
            } ${dragBtnY - 3 * invZoom} L${dragBtnX + 3 * invZoom} ${
              dragBtnY - 3 * invZoom
            } Z`}
            fill="white"
          />
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
