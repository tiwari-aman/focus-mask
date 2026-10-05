import React, { useState, useEffect, useCallback, useRef } from "react";
import Toolbar from "./components/Toolbar";
import MaskOverlay from "./components/MaskOverlay";
import DrawingArea from "./components/DrawingArea";
import useClickBlocking from "./hooks/useClickBlocking";

/**
 * Single Focus Area Version
 * This version restricts users to create only one focus area at a time.
 * For multiple focus areas, see FocusMaskApp.jsx (planned for future version)
 */

const DEFAULT_STATE = {
  enabled: false,
  maskActive: true,
  blur: 5,
  darkness: 0.5,
  blockInteraction: false,
  toolbarEnabled: true,
  areas: [],
  drawMode: false,
};

// Maximum number of focus areas allowed (set to 1 for single focus area mode)
const MAX_FOCUS_AREAS = 1;

function FocusMaskAppSingle() {
  const [state, setState] = useState(DEFAULT_STATE);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentRect, setCurrentRect] = useState(null);
  const [zoomRatio, setZoomRatio] = useState(1);
  const startPosRef = useRef({ x: 0, y: 0 });

  // Track page zoom level in real-time
  useEffect(() => {
    const updateZoom = () => {
      let zoom = 1;
      if (
        window.visualViewport &&
        window.visualViewport.scale &&
        window.visualViewport.scale !== 1
      ) {
        zoom = window.visualViewport.scale;
      } else if (window.outerWidth && window.innerWidth) {
        zoom = window.outerWidth / window.innerWidth;
      }
      zoom = Math.max(0.25, Math.min(5, zoom));
      setZoomRatio(zoom);
    };

    updateZoom();
    window.addEventListener("resize", updateZoom);
    window.visualViewport?.addEventListener("resize", updateZoom);

    return () => {
      window.removeEventListener("resize", updateZoom);
      window.visualViewport?.removeEventListener("resize", updateZoom);
    };
  }, []);

  // Check if maximum areas limit is reached
  const hasReachedLimit = state.areas.length >= MAX_FOCUS_AREAS;

  // Load state from background script (per-tab state)
  useEffect(() => {
    chrome.runtime.sendMessage({ action: "getTabState" }, (response) => {
      if (response) {
        setState((prev) => ({ ...prev, ...response }));
      }
    });
  }, []);

  // Save state via background script
  const saveState = useCallback((newState) => {
    chrome.runtime.sendMessage({ action: "setState", state: newState });
  }, []);

  // Update state helper
  const updateState = useCallback(
    (updates) => {
      setState((prev) => {
        const newState = { ...prev, ...updates };
        saveState(newState);
        return newState;
      });
    },
    [saveState],
  );

  // Listen for messages from popup/background
  useEffect(() => {
    const handleMessage = (message, sender, sendResponse) => {
      switch (message.action) {
        case "enable":
          updateState({ enabled: true });
          break;
        case "disable":
          updateState({ enabled: false, drawMode: false, areas: [] });
          break;
        case "toggle":
          updateState({ enabled: !state.enabled });
          break;
        case "updateSettings":
          if (message.settings) {
            updateState(message.settings);
          }
          break;
        case "clearAreas":
          updateState({ areas: [] });
          break;
        case "getState":
          sendResponse(state);
          return true;
      }
      sendResponse({ success: true });
    };

    chrome.runtime.onMessage.addListener(handleMessage);
    return () => chrome.runtime.onMessage.removeListener(handleMessage);
  }, [state, updateState]);

  // Click blocking hook
  // Only block interaction if explicitly enabled AND there is at least one focus area
  useClickBlocking(
    state.enabled && state.maskActive,
    state.blockInteraction && state.areas.length > 0,
    state.drawMode,
    state.areas,
  );

  // Handle window resize and zoom adjustments (scales area to maintain constant physical screen size)
  useEffect(() => {
    if (!state.enabled || state.areas.length === 0) return;

    const handleResize = () => {
      const curVw = window.innerWidth;
      const curVh = window.innerHeight;

      if (!curVw || !curVh) return;

      let changed = false;
      const scaledAreas = state.areas.map((area) => {
        const prevVw = area.vw || curVw;
        const prevVh = area.vh || curVh;

        if (prevVw === curVw && prevVh === curVh) {
          return area;
        }

        const scaleX = curVw / prevVw;
        const scaleY = curVh / prevVh;

        let width = Math.round(area.width * scaleX);
        let height = Math.round(area.height * scaleY);
        let x = Math.round(area.x * scaleX);
        let y = Math.round(area.y * scaleY);

        // Clamp to current viewport
        width = Math.min(width, curVw);
        height = Math.min(height, curVh);
        x = Math.max(0, Math.min(x, curVw - width));
        y = Math.max(0, Math.min(y, curVh - height));

        changed = true;
        return {
          ...area,
          x,
          y,
          width,
          height,
          vw: curVw,
          vh: curVh,
        };
      });

      if (changed) {
        updateState({ areas: scaledAreas });
      }
    };

    window.addEventListener("resize", handleResize);
    window.visualViewport?.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.visualViewport?.removeEventListener("resize", handleResize);
    };
  }, [state.enabled, state.areas, updateState]);

  // Handle Esc key to cancel draw mode or clear areas
  useEffect(() => {
    if (!state.enabled) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape" || e.key === "Esc" || e.keyCode === 27) {
        e.preventDefault();
        e.stopPropagation();

        if (state.drawMode) {
          setIsDrawing(false);
          setCurrentRect(null);
          updateState({ drawMode: false });
        } else if (state.areas && state.areas.length > 0) {
          updateState({ areas: [] });
        }
      }
    };

    // Use capture phase to intercept Esc before host page
    window.addEventListener("keydown", handleKeyDown, true);
    document.addEventListener("keydown", handleKeyDown, true);

    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [state.enabled, state.drawMode, state.areas, updateState]);

  // Check if point is inside any area
  const isPointInAnyArea = useCallback(
    (x, y) => {
      return state.areas.some((area) => {
        return (
          x >= area.x &&
          x <= area.x + area.width &&
          y >= area.y &&
          y <= area.y + area.height
        );
      });
    },
    [state.areas],
  );

  // Drawing handlers
  const handleStartDrawing = useCallback(
    (e) => {
      if (!state.drawMode) return;

      // In single mode, allow redrawing (replaces later)
      // if (hasReachedLimit) return;

      const x = e.clientX;
      const y = e.clientY;

      if (isPointInAnyArea(x, y)) return;

      setIsDrawing(true);
      startPosRef.current = { x, y };
      setCurrentRect({ x, y, width: 0, height: 0 });
    },
    [state.drawMode, isPointInAnyArea, hasReachedLimit],
  );

  const handleDraw = useCallback(
    (e) => {
      if (!isDrawing) return;

      const currentX = e.clientX;
      const currentY = e.clientY;

      const x = Math.min(startPosRef.current.x, currentX);
      const y = Math.min(startPosRef.current.y, currentY);
      const width = Math.abs(currentX - startPosRef.current.x);
      const height = Math.abs(currentY - startPosRef.current.y);

      setCurrentRect({ x, y, width, height });
    },
    [isDrawing],
  );

  const handleStopDrawing = useCallback(() => {
    if (!isDrawing || !currentRect) return;

    setIsDrawing(false);

    if (currentRect.width > 20 && currentRect.height > 20) {
      const newArea = {
        ...currentRect,
        vw: window.innerWidth,
        vh: window.innerHeight,
      };
      // In single focus mode, replace existing area instead of adding
      updateState({
        areas: [newArea],
        drawMode: false, // Auto-disable draw mode after creating the single area
      });
    }

    setCurrentRect(null);
  }, [isDrawing, currentRect, updateState]);

  // Toggle handlers
  const toggleEnabled = useCallback(() => {
    updateState({ enabled: !state.enabled });
  }, [state.enabled, updateState]);

  const toggleMaskActive = useCallback(() => {
    updateState({ maskActive: !state.maskActive });
  }, [state.maskActive, updateState]);

  const toggleDrawMode = useCallback(() => {
    // In single mode, we allow drawing to replace the existing area
    // if (!state.drawMode && hasReachedLimit) {
    //   return;
    // }
    updateState({ drawMode: !state.drawMode });
  }, [state.drawMode, updateState, hasReachedLimit]);

  const clearAreas = useCallback(() => {
    updateState({ areas: [] });
  }, [updateState]);

  const removeArea = useCallback(
    (index) => {
      const newAreas = state.areas.filter((_, i) => i !== index);
      updateState({ areas: newAreas });
    },
    [state.areas, updateState],
  );

  const resizeArea = useCallback(
    (index, newArea) => {
      const areaWithVw = {
        ...newArea,
        vw: window.innerWidth,
        vh: window.innerHeight,
      };
      const newAreas = state.areas.map((area, i) =>
        i === index ? areaWithVw : area,
      );
      updateState({ areas: newAreas });
    },
    [state.areas, updateState],
  );

  const handleBlurChange = useCallback(
    (value) => {
      updateState({ blur: value });
    },
    [updateState],
  );

  const handleDarknessChange = useCallback(
    (value) => {
      updateState({ darkness: value });
    },
    [updateState],
  );

  const handleBlockChange = useCallback(
    (value) => {
      updateState({ blockInteraction: value });
    },
    [updateState],
  );

  if (!state.enabled) {
    return null;
  }

  return (
    <>
      {state.maskActive && (
        <div className={`focusmask-container ${state.enabled ? "visible" : ""}`}>
          <MaskOverlay
            areas={state.areas}
            previewArea={currentRect}
            blur={state.blur}
            darkness={state.darkness}
            onRemoveArea={removeArea}
            onResizeArea={resizeArea}
            blockInteraction={state.blockInteraction}
            zoomRatio={zoomRatio}
          />
          <DrawingArea
            active={state.drawMode && !hasReachedLimit}
            currentRect={currentRect}
            onStartDrawing={handleStartDrawing}
            onDraw={handleDraw}
            onStopDrawing={handleStopDrawing}
          />
        </div>
      )}
      <Toolbar
        visible={state.enabled && state.toolbarEnabled}
        enabled={state.enabled}
        maskActive={state.maskActive}
        drawMode={state.drawMode}
        blur={state.blur}
        darkness={state.darkness}
        blockInteraction={state.blockInteraction}
        hasReachedLimit={hasReachedLimit}
        zoomRatio={zoomRatio}
        onToggle={toggleEnabled}
        onToggleMaskActive={toggleMaskActive}
        onToggleDrawMode={toggleDrawMode}
        onClear={clearAreas}
        onBlurChange={handleBlurChange}
        onDarknessChange={handleDarknessChange}
        onBlockChange={handleBlockChange}
      />
    </>
  );
}

export default FocusMaskAppSingle;
