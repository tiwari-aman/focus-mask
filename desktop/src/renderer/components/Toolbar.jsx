import React, {
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  useCallback,
} from "react";
import FloatingToolbarCollapsed from "./FloatingToolbarCollapsed";
import FloatingToolbarExpanded from "./FloatingToolbarExpanded";

const COLLAPSE_STYLE = "right"; // "left" | "right" | "fade"
const COLLAPSED_ICON_SIZE = 44;
const EXPANDED_WIDTH = 460;
const CLOSE_ANIMATION_MS = 200;

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
  onHoverToolbar,
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [position, setPosition] = useState(() => {
    const vw = typeof window !== "undefined" ? window.innerWidth : 1920;
    const vh = typeof window !== "undefined" ? window.innerHeight : 1080;
    return {
      x: Math.max(20, vw - EXPANDED_WIDTH - 40),
      y: 80,
      vw,
      vh,
    };
  });
  const [isDragging, setIsDragging] = useState(false);
  const hasMoved = useRef(false);
  const [isClosing, setIsClosing] = useState(false);
  const toolbarRef = useRef(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const pendingAnchorRef = useRef(null);

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
    return () => window.removeEventListener("resize", handleResize);
  }, [collapsed]);

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
    onHoverToolbar?.(true);
  }, [onHoverToolbar]);

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

  const handleCollapse = useCallback(() => {
    if (collapsed || isClosing) return;

    const rect = toolbarRef.current?.getBoundingClientRect();

    setIsClosing(true);
    setTimeout(() => {
      if (rect) {
        if (COLLAPSE_STYLE === "right") {
          setPosition((prev) => ({ ...prev, x: rect.right - COLLAPSED_ICON_SIZE }));
        } else if (COLLAPSE_STYLE === "fade") {
          setPosition((prev) => ({
            ...prev,
            x: rect.left + rect.width / 2 - COLLAPSED_ICON_SIZE / 2,
          }));
        }
      }
      setCollapsed(true);
      setIsClosing(false);
    }, CLOSE_ANIMATION_MS);
  }, [collapsed, isClosing]);

  const handleExpand = () => {
    if (hasMoved.current) return;
    if (position.x === null) return;

    if (COLLAPSE_STYLE === "right") {
      pendingAnchorRef.current = {
        type: "right",
        value: position.x + COLLAPSED_ICON_SIZE,
      };
    } else if (COLLAPSE_STYLE === "fade") {
      pendingAnchorRef.current = {
        type: "center",
        value: position.x + COLLAPSED_ICON_SIZE / 2,
      };
    } else {
      pendingAnchorRef.current = null;
    }

    setCollapsed(false);

    if (COLLAPSE_STYLE === "left") {
      const windowWidth = window.innerWidth;
      if (position.x + EXPANDED_WIDTH > windowWidth) {
        const newX = Math.max(10, windowWidth - EXPANDED_WIDTH - 20);
        setPosition((prev) => ({ ...prev, x: newX }));
      }
    }
  };

  useLayoutEffect(() => {
    if (collapsed) return;
    const anchor = pendingAnchorRef.current;
    if (!anchor) return;
    pendingAnchorRef.current = null;

    const width = toolbarRef.current?.offsetWidth;
    if (!width) return;

    const windowWidth = window.innerWidth;
    let newX =
      anchor.type === "right" ? anchor.value - width : anchor.value - width / 2;
    newX = Math.max(10, Math.min(windowWidth - width - 10, newX));

    setPosition((prev) => ({ ...prev, x: newX }));
  }, [collapsed]);

  if (!visible) return null;

  return (
    <div
      ref={toolbarRef}
      className={`focusmask-toolbar-container toolbar-anchor-${COLLAPSE_STYLE} ${isDragging ? "dragging" : ""} ${isClosing ? "closing" : ""}`}
      onMouseEnter={() => onHoverToolbar?.(true)}
      onMouseLeave={() => onHoverToolbar?.(false)}
      style={{
        position: "fixed",
        left: position.x ?? "auto",
        top: position.y,
        zIndex: 100000,
        cursor: collapsed ? (isDragging ? "grabbing" : "grab") : "default",
        userSelect: "none",
        pointerEvents: "auto",
      }}
    >
      {collapsed ? (
        <FloatingToolbarCollapsed
          onExpand={handleExpand}
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
