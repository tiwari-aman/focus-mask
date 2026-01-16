import { useCallback } from "react";

/**
 * Custom hook for extension actions (enable, disable, clear)
 * Encapsulates the logic for controlling the extension on the current tab
 * 
 * @param {number|null} currentTabId - ID of the current tab
 * @param {Function} updateState - Function to update state
 * @returns {Object} Action handlers
 */
function useExtensionActions(currentTabId, updateState) {
  /**
   * Enable the extension on the current tab
   * Requests background script to inject content script
   */
  const enableExtension = useCallback(async () => {
    if (!currentTabId) return;
    
    chrome.runtime.sendMessage({
      action: "injectContentScript",
      tabId: currentTabId,
    });
  }, [currentTabId]);

  /**
   * Disable the extension on the current tab
   * Notifies content script to remove overlay and cleanup
   */
  const disableExtension = useCallback(async () => {
    if (!currentTabId) return;
    
    try {
      await chrome.tabs.sendMessage(currentTabId, { action: "disable" });
    } catch (e) {
      // Content script may not be injected - this is ok
      console.log("Content script not ready");
    }
  }, [currentTabId]);

  /**
   * Toggle the enabled state of the extension
   * Handles both enabling and disabling based on current state
   */
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

  /**
   * Clear all focus areas on the current tab
   * This is a destructive action that removes all user-defined areas
   */
  const handleClearAreas = useCallback(async () => {
    updateState("areas", []);

    if (!currentTabId) return;
    
    try {
      await chrome.tabs.sendMessage(currentTabId, { action: "clearAreas" });
    } catch (e) {
      // Content script may not be injected - this is ok
      console.log("Content script not ready");
    }
  }, [updateState, currentTabId]);

  return {
    handleToggle,
    handleClearAreas,
  };
}

export default useExtensionActions;
