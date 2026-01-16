import React, { useState, useEffect, useCallback, useRef } from "react";
import Toolbar from "./components/Toolbar";
import MaskOverlay from "./components/MaskOverlay";
import DrawingArea from "./components/DrawingArea";
import useClickBlocking from "./hooks/useClickBlocking";

const DEFAULT_STATE = {
  enabled: false,
  blur: 5,
  darkness: 0.5,
  blockInteraction: false,
  areas: [],
  drawMode: false,
};

function FocusMaskApp() {
  const [state, setState] = useState(DEFAULT_STATE);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentRect, setCurrentRect] = useState(null);
  const startPosRef = useRef({ x: 0, y: 0 });

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
    [saveState]
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
  useClickBlocking(
    state.enabled,
    state.blockInteraction,
    state.drawMode,
    state.areas
  );

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
    [state.areas]
  );

  // Drawing handlers
  const handleStartDrawing = useCallback(
    (e) => {
      if (!state.drawMode) return;

      const x = e.clientX + window.scrollX;
      const y = e.clientY + window.scrollY;

      if (isPointInAnyArea(x, y)) return;

      setIsDrawing(true);
      startPosRef.current = { x, y };
      setCurrentRect({ x, y, width: 0, height: 0 });
    },
    [state.drawMode, isPointInAnyArea]
  );

  const handleDraw = useCallback(
    (e) => {
      if (!isDrawing) return;

      const currentX = e.clientX + window.scrollX;
      const currentY = e.clientY + window.scrollY;

      const x = Math.min(startPosRef.current.x, currentX);
      const y = Math.min(startPosRef.current.y, currentY);
      const width = Math.abs(currentX - startPosRef.current.x);
      const height = Math.abs(currentY - startPosRef.current.y);

      setCurrentRect({ x, y, width, height });
    },
    [isDrawing]
  );

  const handleStopDrawing = useCallback(() => {
    if (!isDrawing || !currentRect) return;

    setIsDrawing(false);

    if (currentRect.width > 20 && currentRect.height > 20) {
      updateState({ areas: [...state.areas, currentRect] });
    }

    setCurrentRect(null);
  }, [isDrawing, currentRect, state.areas, updateState]);

  // Toggle handlers
  const toggleEnabled = useCallback(() => {
    updateState({ enabled: !state.enabled });
  }, [state.enabled, updateState]);

  const toggleDrawMode = useCallback(() => {
    updateState({ drawMode: !state.drawMode });
  }, [state.drawMode, updateState]);

  const clearAreas = useCallback(() => {
    updateState({ areas: [] });
  }, [updateState]);

  const removeArea = useCallback(
    (index) => {
      const newAreas = state.areas.filter((_, i) => i !== index);
      updateState({ areas: newAreas });
    },
    [state.areas, updateState]
  );

  const resizeArea = useCallback(
    (index, newArea) => {
      const newAreas = state.areas.map((area, i) =>
        i === index ? newArea : area
      );
      updateState({ areas: newAreas });
    },
    [state.areas, updateState]
  );

  const handleBlurChange = useCallback(
    (value) => {
      updateState({ blur: value });
    },
    [updateState]
  );

  const handleDarknessChange = useCallback(
    (value) => {
      updateState({ darkness: value });
    },
    [updateState]
  );

  const handleBlockChange = useCallback(
    (value) => {
      updateState({ blockInteraction: value });
    },
    [updateState]
  );

  if (!state.enabled) {
    return null;
  }

  return (
    <>
      <div className={`focusmask-container ${state.enabled ? "visible" : ""}`}>
        <MaskOverlay
          areas={state.areas}
          blur={state.blur}
          darkness={state.darkness}
          onRemoveArea={removeArea}
          onResizeArea={resizeArea}
        />
        <DrawingArea
          active={state.drawMode}
          currentRect={currentRect}
          onStartDrawing={handleStartDrawing}
          onDraw={handleDraw}
          onStopDrawing={handleStopDrawing}
        />
      </div>
      <Toolbar
        visible={state.enabled}
        enabled={state.enabled}
        drawMode={state.drawMode}
        blur={state.blur}
        darkness={state.darkness}
        blockInteraction={state.blockInteraction}
        onToggle={toggleEnabled}
        onToggleDrawMode={toggleDrawMode}
        onClear={clearAreas}
        onBlurChange={handleBlurChange}
        onDarknessChange={handleDarknessChange}
        onBlockChange={handleBlockChange}
      />
    </>
  );
}

export default FocusMaskApp;
