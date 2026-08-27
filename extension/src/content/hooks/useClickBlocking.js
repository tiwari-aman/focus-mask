import { useEffect, useCallback, useRef } from "react";

function useClickBlocking(enabled, blockInteraction, drawMode, areas) {
  // Track mouse position in viewport coordinates
  const mousePositionRef = useRef({ x: 0, y: 0 });

  // Get the true originating element for an event, bypassing Shadow DOM
  // retargeting (a document-level listener otherwise sees the shadow host
  // as e.target instead of the actual element that was interacted with)
  const getRealTarget = useCallback((e) => {
    if (e.composedPath) {
      const path = e.composedPath();
      if (path.length > 0) return path[0];
    }
    return e.target;
  }, []);

  // Check if viewport point (clientX/Y) is inside any focus area
  // Areas are rendered with position:fixed, so they stay in viewport position
  // We compare viewport coordinates directly
  const isViewportPointInAnyArea = useCallback(
    (clientX, clientY) => {
      return areas.some((area) => {
        // Use a small buffer to handle rounding/subpixel offsets
        const buffer = 1; 
        return (
          clientX >= area.x - buffer &&
          clientX <= area.x + area.width + buffer &&
          clientY >= area.y - buffer &&
          clientY <= area.y + area.height + buffer
        );
      });
    },
    [areas],
  );

  // Effect to inject/remove cursor style when blocking is active
  useEffect(() => {
    if (!enabled || !blockInteraction || areas.length === 0) {
      // Remove any existing cursor style
      const existingStyle = document.getElementById(
        "focusmask-block-cursor-style",
      );
      if (existingStyle) {
        existingStyle.remove();
      }
      return;
    }

    // Create style element for toolbar cursor fixes only
    // The blur overlay handles the not-allowed cursor for blocked areas
    let styleEl = document.getElementById("focusmask-block-cursor-style");
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = "focusmask-block-cursor-style";
      document.head.appendChild(styleEl);
    }

    // Only fix toolbar and focus area handles - NOT the whole SVG
    styleEl.textContent = `
      /* Ensure toolbar and focus area containers allow cursors */
      .focusmask-toolbar-container,
      .focusmask-floating-expanded,
      .focusmask-floating-collapsed {
        pointer-events: auto !important;
      }
      
      /* Reset buttons to pointer if they were being overridden */
      .focusmask-floating-btn {
        cursor: pointer !important;
      }
      .focusmask-floating-btn.disabled {
        cursor: not-allowed !important;
      }
      .focusmask-drag-handle {
        cursor: grab !important;
      }
      .focusmask-floating-slider {
        cursor: pointer !important;
      }
    `;

    return () => {
      if (styleEl && styleEl.parentNode) {
        styleEl.remove();
      }
    };
  }, [enabled, blockInteraction, areas.length]);

  useEffect(() => {
    if (!enabled || !blockInteraction) return;

    // Track mouse position continuously
    const handleMouseMove = (e) => {
      mousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleBlockedClick = (e) => {
      const realTarget = getRealTarget(e);

      // Allow clicks on toolbar (new floating toolbar classes)
      if (
        realTarget.closest?.(".focusmask-toolbar-container") ||
        realTarget.closest?.(".focusmask-floating-expanded") ||
        realTarget.closest?.(".focusmask-floating-collapsed")
      )
        return;

      // Allow clicks on any FocusMask SVG elements (delete buttons, resize handles, etc.)
      if (realTarget.closest?.(".focusmask-svg")) return;

      // Allow clicks on FocusMask container elements
      if (realTarget.closest?.(".focusmask-container")) return;

      // Allow clicks on FocusMask area groups
      if (realTarget.closest?.(".focusmask-area-group")) return;

      // Allow clicks during draw mode
      if (drawMode) return;

      // If no areas are active, don't block interactions yet
      if (areas.length === 0) return;

      // Get click coordinates in viewport
      const clientX = e.clientX ?? (e.touches?.[0]?.clientX || e.changedTouches?.[0]?.clientX || 0);
      const clientY = e.clientY ?? (e.touches?.[0]?.clientY || e.changedTouches?.[0]?.clientY || 0);

      // Check if click is inside any focus area (viewport coords)
      // AREAS MUST BE VIEWPORT-RELATIVE FOR THIS TO WORK CORRECTLY
      if (!isViewportPointInAnyArea(clientX, clientY)) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return false;
      }
    };

    const handleBlockedScroll = (e) => {
      if (getRealTarget(e).closest?.(".focusmask-toolbar-container")) return;
      if (drawMode) return;
      if (areas.length === 0) return;

      // Get cursor position in viewport
      let clientX, clientY;

      if (e.type === "wheel") {
        clientX = e.clientX;
        clientY = e.clientY;
      } else if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else if (e.changedTouches && e.changedTouches.length > 0) {
        clientX = e.changedTouches[0].clientX;
        clientY = e.changedTouches[0].clientY;
      } else {
        clientX = mousePositionRef.current.x;
        clientY = mousePositionRef.current.y;
      }

      // Check if cursor is inside any focus area (viewport coords)
      if (!isViewportPointInAnyArea(clientX, clientY)) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    const handleBlockedKeyboard = (e) => {
      if (getRealTarget(e).closest?.(".focusmask-toolbar-container")) return;
      if (drawMode) return;

      const scrollKeys = [32, 33, 34, 35, 36, 37, 38, 39, 40];
      if (scrollKeys.includes(e.keyCode)) {
        const activeEl = document.activeElement;
        if (activeEl) {
          const rect = activeEl.getBoundingClientRect();
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;

          if (!isViewportPointInAnyArea(centerX, centerY)) {
            e.preventDefault();
            e.stopPropagation();
            return false;
          }
        }
      }
    };

    // Add event listeners
    document.addEventListener("mousemove", handleMouseMove, true);
    document.addEventListener("click", handleBlockedClick, true);
    document.addEventListener("mousedown", handleBlockedClick, true);
    document.addEventListener("mouseup", handleBlockedClick, true);
    document.addEventListener("dblclick", handleBlockedClick, true);
    document.addEventListener("touchstart", handleBlockedClick, true);
    document.addEventListener("touchend", handleBlockedClick, true);
    document.addEventListener("wheel", handleBlockedScroll, {
      passive: false,
      capture: true,
    });
    document.addEventListener("touchmove", handleBlockedScroll, {
      passive: false,
      capture: true,
    });
    document.addEventListener("keydown", handleBlockedKeyboard, true);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove, true);
      document.removeEventListener("click", handleBlockedClick, true);
      document.removeEventListener("mousedown", handleBlockedClick, true);
      document.removeEventListener("mouseup", handleBlockedClick, true);
      document.removeEventListener("dblclick", handleBlockedClick, true);
      document.removeEventListener("touchstart", handleBlockedClick, true);
      document.removeEventListener("touchend", handleBlockedClick, true);
      document.removeEventListener("wheel", handleBlockedScroll, true);
      document.removeEventListener("touchmove", handleBlockedScroll, true);
      document.removeEventListener("keydown", handleBlockedKeyboard, true);
    };
  }, [enabled, blockInteraction, drawMode, isViewportPointInAnyArea, getRealTarget]);
}

export default useClickBlocking;
