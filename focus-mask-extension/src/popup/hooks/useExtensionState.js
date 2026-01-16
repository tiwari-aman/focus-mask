import { useState, useEffect, useCallback } from "react";

/**
 * Custom hook for managing extension state for the current tab
 * Handles loading state from background script and persisting changes
 * 
 * @returns {Object} State management object
 * @property {Object} state - Current extension state (enabled, blur, darkness, etc.)
 * @property {boolean} loading - Whether initial state is still loading
 * @property {number|null} currentTabId - ID of the current tab
 * @property {Function} updateState - Function to update a single state property
 * @property {Function} saveState - Function to save complete state
 */
const DEFAULT_STATE = {
  enabled: false,
  blur: 5,
  darkness: 0.5,
  blockInteraction: false,
  toolbarEnabled: true,
  areas: [],
};

function useExtensionState() {
  const [state, setState] = useState(DEFAULT_STATE);
  const [loading, setLoading] = useState(true);
  const [currentTabId, setCurrentTabId] = useState(null);

  // Load state for current tab on mount
  useEffect(() => {
    const loadState = async () => {
      try {
        const [tab] = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });
        
        if (tab?.id) {
          setCurrentTabId(tab.id);

          // Request per-tab state from background script
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
      } catch (error) {
        console.error("Failed to load extension state:", error);
        setLoading(false);
      }
    };

    loadState();
  }, []);

  /**
   * Save state to background script and notify content script
   * This persists global settings and notifies the active tab of changes
   */
  const saveState = useCallback(
    async (newState) => {
      // Save to background script (persists global settings, updates tab state)
      chrome.runtime.sendMessage({
        action: "setState",
        state: newState,
        tabId: currentTabId,
      });

      // Notify content script of settings update
      if (currentTabId) {
        try {
          await chrome.tabs.sendMessage(currentTabId, {
            action: "updateSettings",
            settings: newState,
          });
        } catch (e) {
          // Content script may not be injected yet - this is ok
          console.log("Content script not ready");
        }
      }
    },
    [currentTabId]
  );

  /**
   * Update a single state property and persist the change
   */
  const updateState = useCallback(
    (key, value) => {
      const newState = { ...state, [key]: value };
      setState(newState);
      saveState(newState);
    },
    [state, saveState]
  );

  return {
    state,
    loading,
    currentTabId,
    updateState,
    saveState,
  };
}

export default useExtensionState;
