import React, { useState, useEffect, useCallback, useRef } from "react";
import Toolbar from "./components/Toolbar";
import MaskOverlay from "./components/MaskOverlay";
import DrawingArea from "./components/DrawingArea";

const DEFAULT_STATE = {
  enabled: true,
  maskActive: true,
  blur: 5,
  darkness: 0.5,
  blockInteraction: false,
  areas: [],
  drawMode: false,
};

const MAX_FOCUS_AREAS = 1;

function App() {
  const [state, setState] = useState(DEFAULT_STATE);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentRect, setCurrentRect] = useState(null);
  const startPosRef = useRef({ x: 0, y: 0 });
  const isOverControlRef = useRef(false);

  // Load initial state from desktop main process
  useEffect(() => {
    if (window.focusMaskDesktop?.getState) {
      window.focusMaskDesktop.getState().then((saved) => {
        if (saved) {
          setState((prev) => ({ ...prev, ...saved }));
        }
      });
    }
  }, []);

  // Save state back to desktop main process
  const saveState = useCallback((newState) => {
    if (window.focusMaskDesktop?.saveState) {
      window.focusMaskDesktop.saveState(newState);
    }
  }, []);

  const updateState = useCallback(
    (updates) => {
      setState((prev) => {
        const next = { ...prev, ...updates };
        saveState(next);
        return next;
      });
    },
    [saveState],
  );

  // Listen to menu bar / tray actions & global hotkey (Cmd+Shift+F)
  useEffect(() => {
    if (!window.focusMaskDesktop?.onMenuAction) return;

    const cleanup = window.focusMaskDesktop.onMenuAction((action, data) => {
      switch (action) {
        case "toggle":
          setState((prev) => {
            const next = { ...prev, enabled: !prev.enabled };
            saveState(next);
            return next;
          });
          break;
        case "draw":
          updateState({ drawMode: true });
          break;
        case "clear":
          updateState({ areas: [], drawMode: false });
          break;
        case "set-block":
          updateState({ blockInteraction: !!data });
          break;
        default:
          break;
      }
    });

    return cleanup;
  }, [updateState, saveState]);

  // Check if cursor coordinate is inside the focus area
  const isInsideArea = useCallback(
    (x, y) => {
      return state.areas.some(
        (area) =>
          x >= area.x &&
          x <= area.x + area.width &&
          y >= area.y &&
          y <= area.y + area.height,
      );
    },
    [state.areas],
  );

  // Coordinate click-through with Electron window
  useEffect(() => {
    if (!window.focusMaskDesktop?.setIgnoreMouseEvents) return;

    if (!state.enabled) {
      // Disabled: completely pass-through all mouse events
      window.focusMaskDesktop.setIgnoreMouseEvents(true, { forward: true });
      return;
    }

    if (state.drawMode || isDrawing) {
      // Drawing mode: capture mouse events to draw
      window.focusMaskDesktop.setIgnoreMouseEvents(false);
      return;
    }

    const handleMouseMove = (e) => {
      if (isOverControlRef.current) {
        // Over toolbar, resize handles, or close button: capture
        window.focusMaskDesktop.setIgnoreMouseEvents(false);
      } else if (state.areas.length > 0 && isInsideArea(e.clientX, e.clientY)) {
        // Inside focus area: forward clicks to Notion!
        window.focusMaskDesktop.setIgnoreMouseEvents(true, { forward: true });
      } else {
        // Outside focus area
        if (state.blockInteraction && state.areas.length > 0) {
          // Block interaction mode: capture clicks to prevent clicks falling to background
          window.focusMaskDesktop.setIgnoreMouseEvents(false);
        } else {
          // Allow clicks outside
          window.focusMaskDesktop.setIgnoreMouseEvents(true, { forward: true });
        }
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [
    state.enabled,
    state.drawMode,
    state.areas,
    state.blockInteraction,
    isDrawing,
    isInsideArea,
  ]);

  // Esc key cancels drawing or clears area
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" || e.keyCode === 27) {
        e.preventDefault();
        e.stopPropagation();

        if (state.drawMode) {
          setIsDrawing(false);
          setCurrentRect(null);
          updateState({ drawMode: false });
        } else if (state.areas.length > 0) {
          updateState({ areas: [] });
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [state.drawMode, state.areas, updateState]);

  // Handle pointer drawing
  const handleStartDrawing = useCallback(
    (e) => {
      if (!state.drawMode) return;
      const x = e.clientX;
      const y = e.clientY;

      setIsDrawing(true);
      startPosRef.current = { x, y };
      setCurrentRect({ x, y, width: 0, height: 0 });
    },
    [state.drawMode],
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

    if (currentRect.width > 30 && currentRect.height > 30) {
      updateState({
        areas: [currentRect],
        drawMode: false,
      });
    }

    setCurrentRect(null);
  }, [isDrawing, currentRect, updateState]);

  // Resize and remove area handlers
  const handleRemoveArea = useCallback(() => {
    updateState({ areas: [] });
  }, [updateState]);

  const handleResizeArea = useCallback(
    (index, newArea) => {
      updateState({ areas: [newArea] });
    },
    [updateState],
  );

  const handleHoverControlChange = useCallback((isOver) => {
    isOverControlRef.current = isOver;
    if (isOver && window.focusMaskDesktop?.setIgnoreMouseEvents) {
      window.focusMaskDesktop.setIgnoreMouseEvents(false);
    }
  }, []);

  const hasReachedLimit = state.areas.length >= MAX_FOCUS_AREAS;

  if (!state.enabled) {
    return null;
  }

  return (
    <div className="focusmask-desktop-container">
      {/* Floating Toolbar */}
      <Toolbar
        visible={true}
        enabled={state.enabled}
        drawMode={state.drawMode}
        blur={state.blur}
        darkness={state.darkness}
        blockInteraction={state.blockInteraction}
        hasReachedLimit={hasReachedLimit}
        maskActive={state.maskActive}
        onToggleMaskActive={() => updateState({ maskActive: !state.maskActive })}
        onToggleDrawMode={() => updateState({ drawMode: !state.drawMode })}
        onClear={() => updateState({ areas: [] })}
        onBlurChange={(val) => updateState({ blur: val })}
        onDarknessChange={(val) => updateState({ darkness: val })}
        onBlockChange={(val) => updateState({ blockInteraction: val })}
        onHoverToolbar={handleHoverControlChange}
      />

      {/* Mask Overlay (Blur & SVG Cutout) */}
      {state.maskActive && (
        <MaskOverlay
          areas={state.areas}
          previewArea={currentRect}
          blur={state.blur}
          darkness={state.darkness}
          onRemoveArea={handleRemoveArea}
          onResizeArea={handleResizeArea}
          blockInteraction={state.blockInteraction}
          onHoverControlChange={handleHoverControlChange}
        />
      )}

      {/* Drawing Interaction Layer */}
      <DrawingArea
        active={state.drawMode}
        currentRect={currentRect}
        onStartDrawing={handleStartDrawing}
        onDraw={handleDraw}
        onStopDrawing={handleStopDrawing}
      />
    </div>
  );
}

export default App;
