import React, { useState, useEffect, useCallback } from "react";
import Header from "./components/Header";
import ToggleSection from "./components/ToggleSection";
import SliderSection from "./components/SliderSection";
import ActionButtons from "./components/ActionButtons";
import StatusBar from "./components/StatusBar";

const DEFAULT_STATE = {
  enabled: false,
  blur: 5,
  darkness: 0.5,
  blockInteraction: false,
  areas: [],
};

function App() {
  const [state, setState] = useState(DEFAULT_STATE);
  const [loading, setLoading] = useState(true);
  const [currentTabId, setCurrentTabId] = useState(null);

  // Load state for current tab
  useEffect(() => {
    const loadState = async () => {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (tab?.id) {
        setCurrentTabId(tab.id);

        // Get per-tab state from background
        chrome.runtime.sendMessage(
          { action: "getTabState", tabId: tab.id },
          (response) => {
            if (response) {
              setState((prev) => ({ ...prev, ...response }));
            }
            setLoading(false);
          }
        );
      } else {
        setLoading(false);
      }
    };

    loadState();
  }, []);

  // Save state and notify content script
  const saveState = useCallback(
    async (newState) => {
      // Send to background to save (includes tabId)
      chrome.runtime.sendMessage({
        action: "setState",
        state: newState,
        tabId: currentTabId,
      });

      if (currentTabId) {
        try {
          await chrome.tabs.sendMessage(currentTabId, {
            action: "updateSettings",
            settings: newState,
          });
        } catch (e) {
          console.log("Content script not ready");
        }
      }
    },
    [currentTabId]
  );

  // Update a single state property
  const updateState = useCallback(
    (key, value) => {
      const newState = { ...state, [key]: value };
      setState(newState);
      saveState(newState);
    },
    [state, saveState]
  );

  // Enable extension on current tab
  const enableExtension = useCallback(async () => {
    if (currentTabId) {
      chrome.runtime.sendMessage({
        action: "injectContentScript",
        tabId: currentTabId,
      });
    }
  }, [currentTabId]);

  // Disable extension on current tab
  const disableExtension = useCallback(async () => {
    if (currentTabId) {
      try {
        await chrome.tabs.sendMessage(currentTabId, { action: "disable" });
      } catch (e) {
        console.log("Content script not ready");
      }
    }
  }, [currentTabId]);

  // Toggle enabled state
  const handleToggle = useCallback(
    async (enabled) => {
      updateState("enabled", enabled);
      if (enabled) {
        await enableExtension();
      } else {
        await disableExtension();
      }
    },
    [updateState, enableExtension, disableExtension]
  );

  // Clear all areas
  const handleClearAreas = useCallback(async () => {
    updateState("areas", []);

    if (currentTabId) {
      try {
        await chrome.tabs.sendMessage(currentTabId, { action: "clearAreas" });
      } catch (e) {
        console.log("Content script not ready");
      }
    }
  }, [updateState, currentTabId]);

  if (loading) {
    return <div className="popup-loading">Loading...</div>;
  }

  return (
    <div className="popup-container">
      <Header />

      <ToggleSection enabled={state.enabled} onToggle={handleToggle} />

      <SliderSection
        blur={state.blur}
        darkness={state.darkness}
        blockInteraction={state.blockInteraction}
        onBlurChange={(value) => updateState("blur", value)}
        onDarknessChange={(value) => updateState("darkness", value)}
        onBlockChange={(value) => updateState("blockInteraction", value)}
      />

      <ActionButtons
        enabled={state.enabled}
        onToggle={() => handleToggle(!state.enabled)}
        onClear={handleClearAreas}
      />

      <StatusBar
        enabled={state.enabled}
        areasCount={state.areas?.length || 0}
      />
    </div>
  );
}

export default App;
