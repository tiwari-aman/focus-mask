import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import Toolbar from "./components/Toolbar";
import MaskOverlay from "./components/MaskOverlay";
import DrawingArea from "./components/DrawingArea";

function getDefaultProfile(isPinned = false) {
  return {
    areas: [],
    blur: 5,
    darkness: 0.5,
    blockInteraction: false,
    maskActive: true,
    isPinned,
  };
}

const MAX_FOCUS_AREAS = 1;

function App() {
  const [enabled, setEnabled] = useState(true);
  const [mode, setMode] = useState("window-bound"); // "window-bound" | "global"
  const [profiles, setProfiles] = useState({});
  const [currentApp, setCurrentApp] = useState(null); // { appName, bounds, pid }
  const [drawMode, setDrawMode] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentRect, setCurrentRect] = useState(null);

  const startPosRef = useRef({ x: 0, y: 0 });
  const isOverControlRef = useRef(false);
  const currentAppRef = useRef(null);

  // Keep ref in sync to avoid stale closures in event listeners
  currentAppRef.current = currentApp;

  // ── Load initial state & active window ──────────────────────────────────────
  useEffect(() => {
    if (window.focusMaskDesktop?.getState) {
      window.focusMaskDesktop.getState().then((saved) => {
        if (saved) {
          if (saved.enabled !== undefined) setEnabled(saved.enabled);
          if (saved.mode !== undefined) setMode(saved.mode);
          if (saved.profiles) {
            setProfiles(saved.profiles);
          } else if (saved.areas && saved.areas.length > 0) {
            // Migrate older single-instance state into global profile
            setProfiles({
              global: {
                areas: saved.areas,
                blur: saved.blur ?? 5,
                darkness: saved.darkness ?? 0.5,
                blockInteraction: !!saved.blockInteraction,
                maskActive: saved.maskActive ?? true,
                isPinned: false,
              },
            });
          }
        }
      });
    }

    if (window.focusMaskDesktop?.getCurrentApp) {
      window.focusMaskDesktop.getCurrentApp().then((app) => {
        if (app) setCurrentApp(app);
      });
    }
  }, []);

  // ── Save state back to desktop main process ──────────────────────────────────
  const saveState = useCallback((newState) => {
    if (window.focusMaskDesktop?.saveState) {
      window.focusMaskDesktop.saveState(newState);
    }
  }, []);

  // ── Determine active profile & visibility for current window ────────────────
  const appName = currentApp?.appName;
  const hasAppProfile = !!(appName && profiles[appName]?.isPinned);

  let isVisible = false;
  let activeProfile = null;

  if (enabled) {
    if (mode === "window-bound") {
      if (hasAppProfile) {
        isVisible = true;
        activeProfile = profiles[appName];
      } else {
        // Current window is NOT pinned: hide toolbar and mask completely!
        isVisible = false;
        activeProfile = null;
      }
    } else {
      // Global mode: visible across all windows
      isVisible = true;
      activeProfile = profiles["global"] || getDefaultProfile(false);
    }
  }

  // ── Helper to update the active profile ──────────────────────────────────────
  const updateActiveProfile = useCallback(
    (updates) => {
      const curApp = currentAppRef.current;
      const targetKey =
        mode === "window-bound" && curApp?.appName ? curApp.appName : "global";

      setProfiles((prev) => {
        const existing =
          prev[targetKey] || getDefaultProfile(mode === "window-bound");
        const updated = { ...existing, ...updates };
        const next = { ...prev, [targetKey]: updated };
        saveState({ profiles: next, mode, enabled: true });
        return next;
      });
    },
    [mode, saveState],
  );

  // ── Lock/Pin to current window ──────────────────────────────────────────────
  const handleLockToWindow = useCallback(() => {
    const curApp = currentAppRef.current;
    if (!curApp?.appName) return;
    const name = curApp.appName;
    setMode("window-bound");

    setProfiles((prev) => {
      const existing = prev[name] || activeProfile || getDefaultProfile(true);
      // Convert any existing screen coordinates into relative window coords
      const convertedAreas = (existing.areas || []).map((a) => {
        if (a.relX !== undefined) return a;
        if (!curApp.bounds) return a;
        return {
          ...a,
          relX: a.x - curApp.bounds.x,
          relY: a.y - curApp.bounds.y,
        };
      });

      const next = {
        ...prev,
        [name]: {
          ...existing,
          isPinned: true,
          areas: convertedAreas,
        },
      };
      saveState({ profiles: next, mode: "window-bound", enabled: true });
      return next;
    });
  }, [activeProfile, saveState]);

  // ── Unlock / Unpin ──────────────────────────────────────────────────────────
  const handleUnlockWindow = useCallback(() => {
    const curApp = currentAppRef.current;
    if (!curApp?.appName) return;
    const name = curApp.appName;

    setProfiles((prev) => {
      const existing = prev[name];
      if (!existing) return prev;
      const next = {
        ...prev,
        [name]: { ...existing, isPinned: false },
      };
      saveState({ profiles: next, mode: "global", enabled: true });
      return next;
    });
    setMode("global");
    window.focusMaskDesktop?.unlockWindowTracking?.();
  }, [saveState]);

  // ── Listen to active window events & menu actions from main process ─────────
  useEffect(() => {
    if (!window.focusMaskDesktop?.onMenuAction) return;

    const cleanup = window.focusMaskDesktop.onMenuAction((action, data, extra) => {
      switch (action) {
        case "active-app-changed":
          // User switched to another application window
          if (data) setCurrentApp(data);
          break;

        case "active-window-moved":
          // The current active window was moved or resized
          if (data) {
            setCurrentApp((prev) => (prev ? { ...prev, bounds: data.bounds } : data));
          }
          break;

        case "pin-current-app":
          if (data?.appName) {
            setMode("window-bound");
            setEnabled(true);
            setProfiles((prev) => {
              const existing = prev[data.appName] || getDefaultProfile(true);
              const next = {
                ...prev,
                [data.appName]: { ...existing, isPinned: true },
              };
              saveState({ profiles: next, mode: "window-bound", enabled: true });
              return next;
            });
          }
          break;

        case "set-mode":
          if (data === "global") {
            setMode("global");
            setEnabled(true);
            saveState({ mode: "global", enabled: true });
          }
          break;

        case "toggle":
          setEnabled((prev) => {
            const next = !prev;
            saveState({ enabled: next });
            return next;
          });
          break;

        case "draw":
          setDrawMode(true);
          break;

        case "clear":
          updateActiveProfile({ areas: [] });
          setDrawMode(false);
          break;

        case "set-block":
          updateActiveProfile({ blockInteraction: !!data });
          break;

        default:
          break;
      }
    });

    return cleanup;
  }, [updateActiveProfile, saveState]);

  // ── Convert relative coordinates back to screen coordinates for rendering ────
  const screenAreas = useMemo(() => {
    if (!activeProfile || !activeProfile.areas) return [];
    if (mode === "window-bound" && currentApp?.bounds) {
      return activeProfile.areas.map((a) => {
        if (a.relX === undefined) return a;
        return {
          ...a,
          x: a.relX + currentApp.bounds.x,
          y: a.relY + currentApp.bounds.y,
        };
      });
    }
    return activeProfile.areas;
  }, [activeProfile, mode, currentApp?.bounds]);

  // ── Check if cursor coordinate is inside a focus area ───────────────────────
  const isInsideArea = useCallback(
    (x, y) => {
      return screenAreas.some(
        (area) =>
          x >= area.x &&
          x <= area.x + area.width &&
          y >= area.y &&
          y <= area.y + area.height,
      );
    },
    [screenAreas],
  );

  // ── Coordinate click-through with Electron window ───────────────────────────
  useEffect(() => {
    if (!window.focusMaskDesktop?.setIgnoreMouseEvents) return;

    if (!isVisible || !activeProfile) {
      // Hidden on this window: completely ignore mouse events and pass through 100%
      window.focusMaskDesktop.setIgnoreMouseEvents(true, { forward: true });
      return;
    }

    if (drawMode || isDrawing) {
      // Drawing mode: capture clicks
      window.focusMaskDesktop.setIgnoreMouseEvents(false);
      return;
    }

    const handleMouseMove = (e) => {
      if (isOverControlRef.current) {
        window.focusMaskDesktop.setIgnoreMouseEvents(false);
      } else if (screenAreas.length > 0 && isInsideArea(e.clientX, e.clientY)) {
        window.focusMaskDesktop.setIgnoreMouseEvents(true, { forward: true });
      } else {
        if (activeProfile.blockInteraction && screenAreas.length > 0) {
          window.focusMaskDesktop.setIgnoreMouseEvents(false);
        } else {
          window.focusMaskDesktop.setIgnoreMouseEvents(true, { forward: true });
        }
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [isVisible, activeProfile, drawMode, isDrawing, screenAreas, isInsideArea]);

  // ── Esc key ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" || e.keyCode === 27) {
        e.preventDefault();
        e.stopPropagation();
        if (drawMode) {
          setIsDrawing(false);
          setCurrentRect(null);
          setDrawMode(false);
        } else if (screenAreas.length > 0) {
          updateActiveProfile({ areas: [] });
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [drawMode, screenAreas, updateActiveProfile]);

  // ── Handle drawing ──────────────────────────────────────────────────────────
  const handleStartDrawing = useCallback(
    (e) => {
      if (!drawMode) return;
      setIsDrawing(true);
      startPosRef.current = { x: e.clientX, y: e.clientY };
      setCurrentRect({ x: e.clientX, y: e.clientY, width: 0, height: 0 });
    },
    [drawMode],
  );

  const handleDraw = useCallback(
    (e) => {
      if (!isDrawing) return;
      const x = Math.min(startPosRef.current.x, e.clientX);
      const y = Math.min(startPosRef.current.y, e.clientY);
      setCurrentRect({
        x,
        y,
        width: Math.abs(e.clientX - startPosRef.current.x),
        height: Math.abs(e.clientY - startPosRef.current.y),
      });
    },
    [isDrawing],
  );

  const handleStopDrawing = useCallback(() => {
    if (!isDrawing || !currentRect) return;
    setIsDrawing(false);

    if (currentRect.width > 30 && currentRect.height > 30) {
      let finalArea = { ...currentRect };
      // In window-bound mode, store relative coordinates to window top-left
      if (mode === "window-bound" && currentApp?.bounds) {
        finalArea = {
          ...finalArea,
          relX: currentRect.x - currentApp.bounds.x,
          relY: currentRect.y - currentApp.bounds.y,
        };
      }
      updateActiveProfile({ areas: [finalArea] });
      setDrawMode(false);
    }
    setCurrentRect(null);
  }, [isDrawing, currentRect, mode, currentApp?.bounds, updateActiveProfile]);

  // ── Area handlers ───────────────────────────────────────────────────────────
  const handleRemoveArea = useCallback(() => {
    updateActiveProfile({ areas: [] });
  }, [updateActiveProfile]);

  const handleResizeArea = useCallback(
    (index, newArea) => {
      let finalArea = { ...newArea };
      if (mode === "window-bound" && currentApp?.bounds) {
        finalArea = {
          ...finalArea,
          relX: newArea.x - currentApp.bounds.x,
          relY: newArea.y - currentApp.bounds.y,
        };
      }
      updateActiveProfile({ areas: [finalArea] });
    },
    [mode, currentApp?.bounds, updateActiveProfile],
  );

  const handleHoverControlChange = useCallback((isOver) => {
    isOverControlRef.current = isOver;
    if (isOver && window.focusMaskDesktop?.setIgnoreMouseEvents) {
      window.focusMaskDesktop.setIgnoreMouseEvents(false);
    }
  }, []);

  // ── When not visible for the current window, render nothing! ────────────────
  if (!isVisible || !activeProfile) {
    return null;
  }

  const hasReachedLimit = (activeProfile.areas || []).length >= MAX_FOCUS_AREAS;

  return (
    <div className="focusmask-desktop-container">
      {/* Floating Toolbar */}
      <Toolbar
        visible={true}
        enabled={enabled}
        drawMode={drawMode}
        blur={activeProfile.blur}
        darkness={activeProfile.darkness}
        blockInteraction={activeProfile.blockInteraction}
        hasReachedLimit={hasReachedLimit}
        maskActive={activeProfile.maskActive}
        windowMode={mode}
        targetWindow={currentApp}
        targetWindowFocused={true}
        onToggleMaskActive={() =>
          updateActiveProfile({ maskActive: !activeProfile.maskActive })
        }
        onToggleDrawMode={() => setDrawMode((prev) => !prev)}
        onClear={() => updateActiveProfile({ areas: [] })}
        onBlurChange={(val) => updateActiveProfile({ blur: val })}
        onDarknessChange={(val) => updateActiveProfile({ darkness: val })}
        onBlockChange={(val) => updateActiveProfile({ blockInteraction: val })}
        onHoverToolbar={handleHoverControlChange}
        onLockToWindow={handleLockToWindow}
        onUnlockWindow={handleUnlockWindow}
      />

      {/* Mask Overlay (Blur, Darkness & SVG Cutout) */}
      {activeProfile.maskActive && (
        <MaskOverlay
          areas={screenAreas}
          previewArea={currentRect}
          blur={activeProfile.blur}
          darkness={activeProfile.darkness}
          onRemoveArea={handleRemoveArea}
          onResizeArea={handleResizeArea}
          blockInteraction={activeProfile.blockInteraction}
          onHoverControlChange={handleHoverControlChange}
        />
      )}

      {/* Drawing Interaction Layer */}
      <DrawingArea
        active={drawMode}
        currentRect={currentRect}
        onStartDrawing={handleStartDrawing}
        onDraw={handleDraw}
        onStopDrawing={handleStopDrawing}
      />
    </div>
  );
}

export default App;
