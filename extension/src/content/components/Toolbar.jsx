import React, { useState, useRef, useEffect, useCallback } from "react";
import FloatingToolbarCollapsed from "./FloatingToolbarCollapsed";
import FloatingToolbarExpanded from "./FloatingToolbarExpanded";

function Toolbar({
  visible,
  enabled,
  drawMode,
  blur,
  darkness,
  blockInteraction,
  hasReachedLimit = false,
  maskActive = true,
  zoomRatio = 1,
  onToggle,
  onToggleMaskActive,
  onToggleDrawMode,
  onClear,
  onBlurChange,
  onDarknessChange,
  onBlockChange,
}) {
  const [collapsed, setCollapsed] = useState(true);
  const [position, setPosition] = useState(() => ({
    x: typeof window !== "undefined" ? Math.max(20, window.innerWidth - 60) : 100,
    y: 100,
    vw: typeof window !== "undefined" ? window.innerWidth : 1920,
    vh: typeof window !== "undefined" ? window.innerHeight : 1080,
  }));
  const [isDragging, setIsDragging] = useState(false);
  const hasMoved = useRef(false);
  const [isClosing, setIsClosing] = useState(false);
  const toolbarRef = useRef(null);
  const dragOffset = useRef({ x: 0, y: 0 });

  // Proportionally scale toolbar position on window resize or zoom changes
  useEffect(() => {
    const handleResize = () => {
      const curVw = window.innerWidth;
      const curVh = window.innerHeight;
      if (!curVw || !curVh) return;

      setPosition((prev) => {
        const prevVw = prev.vw || curVw;
        const prevVh = prev.vh || curVh;

        if (prevVw === curVw && prevVh === curVh) {
          return prev;
        }

        const scaleX = curVw / prevVw;
        const scaleY = curVh / prevVh;

        const rect = toolbarRef.current?.getBoundingClientRect();
        const width = rect?.width || (collapsed ? 42 : 360);
        const height = rect?.height || 42;

        let newX = Math.round(prev.x * scaleX);
        let newY = Math.round(prev.y * scaleY);

        newX = Math.max(10, Math.min(curVw - width - 10, newX));
        newY = Math.max(10, Math.min(curVh - height - 10, newY));

        return {
          x: newX,
          y: newY,
          vw: curVw,
          vh: curVh,
        };
      });
    };

    window.addEventListener("resize", handleResize);
    window.visualViewport?.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.visualViewport?.removeEventListener("resize", handleResize);
    };
  }, [collapsed]);

  // Dragging Logic
  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!toolbarRef.current) return;
    if (e.button !== 0) return;

    setIsDragging(true);
    hasMoved.current = false;

    const rect = toolbarRef.current.getBoundingClientRect();
    dragOffset.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (e) => {
      hasMoved.current = true;
      const rect = toolbarRef.current?.getBoundingClientRect();
      const width = rect?.width || (collapsed ? 42 : 360);
      const height = rect?.height || 42;

      const newX = Math.max(
        0,
        Math.min(window.innerWidth - width, e.clientX - dragOffset.current.x),
      );
      const newY = Math.max(
        0,
        Math.min(window.innerHeight - height, e.clientY - dragOffset.current.y),
      );
      setPosition({
        x: newX,
        y: newY,
        vw: window.innerWidth,
        vh: window.innerHeight,
      });
    };

    const handleUp = () => {
      setIsDragging(false);
    };

    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleUp);
    document.addEventListener("pointermove", handleMove);
    document.addEventListener("pointerup", handleUp);
    return () => {
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleUp);
      document.removeEventListener("pointermove", handleMove);
      document.removeEventListener("pointerup", handleUp);
    };
  }, [isDragging]);

  /*
   * Handle collapsing
   */
  const handleCollapse = useCallback(() => {
    if (collapsed || isClosing) return;

    setIsClosing(true);
    setTimeout(() => {
      setCollapsed(true);
      setIsClosing(false);
    }, 250);
  }, [collapsed, isClosing]);

  const handleExpand = () => {
    if (hasMoved.current) return;

    setCollapsed(false);
    // Reposition if close to right edge to prevent overflow
    const expandedWidth = 460;
    const windowWidth = window.innerWidth;

    if (position.x !== null) {
      if (position.x + expandedWidth > windowWidth) {
        const newX = Math.max(10, windowWidth - expandedWidth - 20);
        setPosition((prev) => ({ ...prev, x: newX }));
      }
    }
  };

  if (!visible) return null;

  return (
    <div
      ref={toolbarRef}
      className={`focusmask-toolbar-container ${isDragging ? "dragging" : ""} ${isClosing ? "closing" : ""}`}
      style={{
        position: "fixed",
        left: position.x ?? "auto",
        top: position.y,
        zIndex: 100000,
        transform: `scale(${1 / (zoomRatio || 1)})`,
        transformOrigin: "top left",
        cursor: collapsed ? (isDragging ? "grabbing" : "grab") : "default",
        userSelect: "none",
        pointerEvents: "auto",
      }}
    >
      {collapsed ? (
        <FloatingToolbarCollapsed
          onClick={handleExpand}
          onMouseDown={handleMouseDown}
        />
      ) : (
        <FloatingToolbarExpanded
          drawMode={drawMode}
          blur={blur}
          darkness={darkness}
          blockInteraction={blockInteraction}
          hasReachedLimit={hasReachedLimit}
          maskActive={maskActive}
          onToggleMaskActive={onToggleMaskActive}
          onToggleDrawMode={onToggleDrawMode}
          onClear={onClear}
          onBlurChange={onBlurChange}
          onDarknessChange={onDarknessChange}
          onBlockChange={onBlockChange}
          onCollapse={handleCollapse}
          onMouseDown={handleMouseDown}
        />
      )}
    </div>
  );
}

export default Toolbar;
