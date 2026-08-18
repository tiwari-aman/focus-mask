import { useState, useEffect, useCallback } from "react";

/**
 * Custom hook for managing extension state for the current tab
 * Handles loading state from background script and persisting changes
 *
 * @returns {Object} State management object
 * @property {Object} state - Current extension state (enabled, blur, darkness, etc.)
 * @property {boolean} loading - Whether initial state is still loading
 * @property {boolean} siteRestricted - Whether the extension is blocked on this site
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

// URLs where extensions cannot inject content scripts
const RESTRICTED_URL_PATTERNS = [
  /^chrome:\/\//,
  /^chrome-extension:\/\//,
  /^edge:\/\//,
  /^about:/,
  /^moz-extension:\/\//,
  /^https:\/\/chrome\.google\.com\/webstore/,
  /^https:\/\/chromewebstore\.google\.com/,
  /^https:\/\/microsoftedge\.microsoft\.com\/addons/,
];

/**
 * Check if a URL is restricted (extension cannot run there)
 */
function isRestrictedUrl(url) {
  if (!url) return true;
  return RESTRICTED_URL_PATTERNS.some((pattern) => pattern.test(url));
}

function useExtensionState() {
  const [state, setState] = useState(DEFAULT_STATE);
  const [loading, setLoading] = useState(true);
  const [siteRestricted, setSiteRestricted] = useState(false);
  const [isFileWithoutAccess, setIsFileWithoutAccess] = useState(false);
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

          // Check for local file URLs without file scheme access
          if (tab.url && tab.url.startsWith("file://")) {
            if (chrome.extension?.isAllowedFileSchemeAccess) {
              const isAllowed = await new Promise((resolve) => {
                chrome.extension.isAllowedFileSchemeAccess(resolve);
              });
              if (!isAllowed) {
                setIsFileWithoutAccess(true);
                setLoading(false);
                return;
              }
            }
          }

          // Check if the URL is restricted
          if (isRestrictedUrl(tab.url)) {
            setSiteRestricted(true);
            setLoading(false);
            return;
          }

          // Try to ping the content script to see if it's injected
          try {
            await chrome.tabs.sendMessage(tab.id, { action: "ping" });
            // Content script responded - site is not restricted
            setSiteRestricted(false);
          } catch (e) {
            // Content script didn't respond - site might be restricted
            // or content script hasn't loaded yet
            // We'll still try to get state but mark potential restriction
            console.log("Content script not responding, checking further...");
          }

          // Request per-tab state from background script
          chrome.runtime.sendMessage(
            { action: "getTabState", tabId: tab.id },
            (response) => {
              if (chrome.runtime.lastError) {
                console.log(
                  "Error getting tab state:",
                  chrome.runtime.lastError,
                );
              }
              if (response) {
                setState((prev) => ({ ...prev, ...response }));
              }
              setLoading(false);
            },
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
    [currentTabId],
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
    [state, saveState],
  );

  return {
    state,
    loading,
    siteRestricted,
    isFileWithoutAccess,
    currentTabId,
    updateState,
    saveState,
  };
}

export default useExtensionState;
