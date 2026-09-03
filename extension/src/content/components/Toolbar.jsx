import React, {
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  useCallback,
} from "react";
import FloatingToolbarCollapsed from "./FloatingToolbarCollapsed";
import FloatingToolbarExpanded from "./FloatingToolbarExpanded";

// Controls where the collapsed icon ends up relative to the expanded bar,
// and how the two trade places. Change this and rebuild to compare:
//   "left"  - icon settles on the left (drag-handle) side; expanding grows
//             the bar to the right from there.
//   "right" - icon settles on the right (where the close button was);
//             expanding grows the bar to the left from there.
//   "fade"  - no sliding/scaling at all, the bar cross-fades into the icon
//             in place, so nothing appears to jump to either side.
const COLLAPSE_STYLE = "right"; // "left" | "right" | "fade"

const COLLAPSED_ICON_SIZE = 44;
const EXPANDED_WIDTH = 460;
// Must match the actual CSS closing-animation duration (the "cleanExit"
// keyframe in content.css, 0.2s) - this used to be 250ms while the CSS
// animation only ran 200ms, leaving a ~50ms gap where the bar had already
// faded to nothing before the collapsed icon appeared, so the icon's
// instant, un-transitioned pop-in read as disconnected from the shrink.
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
}) {
  // Start expanded so the user can pick a focus area right away without an
  // extra click; collapses only once the user explicitly closes it.
  const [collapsed, setCollapsed] = useState(false);
  const [position, setPosition] = useState(() => {
    const vw = typeof window !== "undefined" ? window.innerWidth : 1920;
    const vh = typeof window !== "undefined" ? window.innerHeight : 1080;
    return {
      x: Math.max(20, vw - EXPANDED_WIDTH - 20),
      y: 100,
      vw,
      vh,
    };
  });
  const [isDragging, setIsDragging] = useState(false);
  const hasMoved = useRef(false);
  const [isClosing, setIsClosing] = useState(false);
  const toolbarRef = useRef(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  // Set by handleExpand for "right"/"fade" styles: which edge of the just-
  // expanded bar must land where the collapsed icon was. Consumed by the
  // layout effect below, which measures the bar's real (content-fit) width
  // once it's actually in the DOM instead of assuming EXPANDED_WIDTH -
  // guessing here is what let the position drift a little further left on
  // every collapse/expand cycle.
  const pendingAnchorRef = useRef(null);

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

    // Capture where the bar currently sits before it shrinks, so we can
    // land the collapsed icon at the spot COLLAPSE_STYLE calls for.
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
        // "left": leave position.x untouched, icon lands where the bar's
        // left edge already was.
      }
      setCollapsed(true);
      setIsClosing(false);
    }, CLOSE_ANIMATION_MS);
  }, [collapsed, isClosing]);

  const handleExpand = () => {
    if (hasMoved.current) return;

    if (position.x === null) return;

    if (COLLAPSE_STYLE === "right") {
      // Grow leftward so the bar's right edge stays where the icon was.
      // The exact target x depends on the bar's real width, which isn't
      // known until it renders - the layout effect below fills it in.
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
      // "left": just guard against overflowing the right edge
      const windowWidth = window.innerWidth;
      if (position.x + EXPANDED_WIDTH > windowWidth) {
        const newX = Math.max(10, windowWidth - EXPANDED_WIDTH - 20);
        setPosition((prev) => ({ ...prev, x: newX }));
      }
    }
  };

  // Runs after the expanded bar has actually mounted (but before the
  // browser paints), so we can read its true content-fit width instead of
  // the EXPANDED_WIDTH guess. Uses offsetWidth rather than
  // getBoundingClientRect(): the entrance animation applies a
  // `transform: scale()` on mount, and getBoundingClientRect() reports the
  // post-transform (visually scaled) box, which would throw this off too -
  // offsetWidth reflects the real layout box regardless of any transform.
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
