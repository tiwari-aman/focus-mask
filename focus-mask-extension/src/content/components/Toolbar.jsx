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
  onToggle,
  onToggleDrawMode,
  onClear,
  onBlurChange,
  onDarknessChange,
  onBlockChange,
}) {
  const [collapsed, setCollapsed] = useState(true);
  const [position, setPosition] = useState({ x: null, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const hasMoved = useRef(false);
  const [isClosing, setIsClosing] = useState(false);
  const toolbarRef = useRef(null);
  const dragOffset = useRef({ x: 0, y: 0 });

  // Initial Position
  useEffect(() => {
    if (position.x === null) {
      setPosition({
        x: window.innerWidth - 80,
        y: 100,
      });
    }
  }, [position.x]);

  // Dragging Logic
  const handleMouseDown = useCallback(
    (e) => {
        // Prevent default text selection
      e.preventDefault(); 
      if (!toolbarRef.current) return;
      // Only start drag if left click
      if (e.button !== 0) return;

      setIsDragging(true);
      hasMoved.current = false;
      dragOffset.current = {
        x: e.clientX - (position.x ?? 0),
        y: e.clientY - position.y,
      };
    },
    [position]
  );
  
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => {
        hasMoved.current = true;
      const newX = Math.max(
        0,
        Math.min(
          window.innerWidth - (toolbarRef.current?.offsetWidth || 50),
          e.clientX - dragOffset.current.x
        )
      );
      const newY = Math.max(
        0,
        Math.min(
          window.innerHeight - (toolbarRef.current?.offsetHeight || 50),
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

  /* 
   * Handle collapsing with proper position adjustment (shrinking towards right)
   */
  const handleCollapse = useCallback(() => {
      // Capture width before animation starts
      const width = toolbarRef.current?.offsetWidth || 0;
      setIsClosing(true);
      
      setTimeout(() => {
          setCollapsed(true);
          setIsClosing(false);
          // Shift position to the right so the icon appears where the right edge was
          // 44px is the width of the collapsed icon
          setPosition(prev => ({ ...prev, x: prev.x + width - 44 }));
      }, 300); 
  }, []);

  // Collapse when clicking outside
  useEffect(() => {
    if(collapsed) return;
    
    // Don't auto-collapse if drawing mode is active
    if(drawMode) return;

    const handleClickOutside = (event) => {
        if (toolbarRef.current && !toolbarRef.current.contains(event.target)) {
            // Use the animated collapse instead of instant setCollapsed(true)
            handleCollapse();
        }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [collapsed, drawMode, handleCollapse]);

  const handleExpand = () => {
      if(hasMoved.current) return;

      setCollapsed(false);
      // Reposition if close to right edge to prevent overflow
      const expandedWidth = 460; // Safe buffer
      const windowWidth = window.innerWidth;
      
      if (position.x !== null) {
        // Check if it would overflow right
        if (position.x + expandedWidth > windowWidth) {
           const newX = Math.max(10, windowWidth - expandedWidth - 20);
           setPosition(prev => ({ ...prev, x: newX }));
        }
      }
  };

  if (!visible) return null;

  return (
    <div
      ref={toolbarRef}
      className={`focusmask-toolbar-container ${isDragging ? "dragging" : ""} ${isClosing ? "closing" : ""}`}
      style={{
        position: 'fixed',
        left: position.x ?? "auto",
        top: position.y,
        zIndex: 99999999,
        cursor: isDragging ? "grabbing" : "grab",
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
