// Focus Mask Background Service Worker (Cross-browser compatible)
// 
// STATE ARCHITECTURE:
// This service worker maintains two types of state:
// 
// 1. GLOBAL SETTINGS (persisted in chrome.storage.local):
//    - blur: Blur intensity (0-20px)
//    - darkness: Overlay darkness (0-1)
//    - blockInteraction: Whether to block clicks outside focus areas
//    These are shared across all tabs and persist across sessions
// 
// 2. PER-TAB STATE (in-memory Map):
//    - enabled: Whether Focus Mask is active on this specific tab
//    - areas: Array of focus area definitions for this tab
//    - drawMode: Whether the user is currently drawing a new area
//    These are tab-specific and reset when the tab is closed

import browser from "webextension-polyfill";

// Default global settings (applied on install and used as fallback)
const DEFAULT_SETTINGS = {
  blur: 5,
  darkness: 0.5,
  blockInteraction: false,
  toolbarEnabled: true,
};

// Per-tab state storage (in-memory, does not persist across browser restarts)
const tabStates = new Map();

/* ------------------ TAB STATE HELPERS ------------------ */

/**
 * Get the current state for a specific tab
 * If no state exists, initializes with default values
 */
function getTabState(tabId) {
  if (!tabStates.has(tabId)) {
    tabStates.set(tabId, {
      enabled: false,
      maskActive: true,
      areas: [],
      drawMode: false,
    });
  }
  return tabStates.get(tabId);
}

/**
 * Update the state for a specific tab
 * Merges new state with existing state
 */
function setTabState(tabId, state) {
  const current = getTabState(tabId);
  tabStates.set(tabId, { ...current, ...state });
}

/* ------------------ CLEANUP ------------------ */

browser.tabs.onRemoved.addListener((tabId) => {
  tabStates.delete(tabId);
});

/* ------------------ INSTALL ------------------ */

browser.runtime.onInstalled.addListener(() => {
  browser.storage.local.set(DEFAULT_SETTINGS);
});

/* ------------------ MESSAGE HANDLER ------------------ */

/**
 * Central message handler for communication between popup, content scripts, and background
 * 
 * Handles the following actions:
 * - injectContentScript: Inject the overlay into a tab
 * - getState/getTabState: Retrieve combined global + per-tab state
 * - setState: Save global settings and/or per-tab state
 * - toggleExtension: Enable/disable extension on a specific tab
 */
browser.runtime.onMessage.addListener((message, sender) => {
  const tabId = message.tabId || sender.tab?.id;

  if (!tabId) return;

  // Inject content script into specified tab
  if (message.action === "injectContentScript") {
    injectContentScript(tabId);
    return Promise.resolve({ success: true });
  }

  // Get combined state: global settings + per-tab state
  if (message.action === "getState" || message.action === "getTabState") {
    return browser.storage.local.get(DEFAULT_SETTINGS).then((globals) => {
      const tabState = getTabState(tabId);
      return { ...globals, ...tabState }; // Tab state overrides globals
    });
  }

  // Save state: separate global settings from per-tab state
  if (message.action === "setState") {
    const { enabled, maskActive, areas, drawMode, ...globalState } = message.state || {};

    // Save global settings to persistent storage
    if (Object.keys(globalState).length) {
      browser.storage.local.set(globalState);
    }

    // Update per-tab state in memory
    const tabUpdate = {};
    if (enabled !== undefined) tabUpdate.enabled = enabled;
    if (maskActive !== undefined) tabUpdate.maskActive = maskActive;
    if (areas !== undefined) tabUpdate.areas = areas;
    if (drawMode !== undefined) tabUpdate.drawMode = drawMode;

    if (Object.keys(tabUpdate).length) {
      setTabState(tabId, tabUpdate);
    }

    return Promise.resolve({ success: true });
  }

  // Toggle extension on/off for a specific tab
  if (message.action === "toggleExtension") {
    toggleExtension(tabId);
    return Promise.resolve({ success: true });
  }
});

/* ------------------ TOGGLE ------------------ */

async function toggleExtension(tabId) {
  const tabState = getTabState(tabId);
  const enabled = !tabState.enabled;

  setTabState(tabId, { enabled });

  if (enabled) {
    await injectContentScript(tabId);
  } else {
    try {
      await browser.tabs.sendMessage(tabId, { action: "disable" });
    } catch (_) {}
  }
}

/* ------------------ SCRIPT INJECTION ------------------ */

async function injectContentScript(tabId) {
  try {
    const tab = await browser.tabs.get(tabId);

    if (
      tab.url.startsWith("chrome://") ||
      tab.url.startsWith("edge://") ||
      tab.url.startsWith("about:") ||
      tab.url.startsWith("chrome-extension://")
    ) {
      return;
    }

    // Check if already initialized
    let injected = false;
    try {
      const result = await executeInline(tabId, () => {
        return window.__focusMaskInitialized || false;
      });
      injected = result;
    } catch (_) {}

    if (injected) {
      try {
        await browser.tabs.sendMessage(tabId, { action: "enable" });
        return;
      } catch (_) {}
    }

    await injectCSS(tabId);
    await injectJS(tabId);

    setTimeout(() => {
      browser.tabs.sendMessage(tabId, { action: "enable" }).catch(() => {});
    }, 100);
  } catch (err) {
    console.error("Injection failed:", err);
  }
}

/* ------------------ CROSS-BROWSER HELPERS ------------------ */

async function injectCSS(tabId) {
  if (browser.scripting) {
    await browser.scripting.insertCSS({
      target: { tabId },
      files: ["content.css"],
    });
  } else {
    await browser.tabs.insertCSS(tabId, { file: "content.css" });
  }
}

async function injectJS(tabId) {
  if (browser.scripting) {
    await browser.scripting.executeScript({
      target: { tabId },
      files: ["content.js"],
    });
  } else {
    await browser.tabs.executeScript(tabId, { file: "content.js" });
  }
}

async function executeInline(tabId, func) {
  if (browser.scripting) {
    const res = await browser.scripting.executeScript({
      target: { tabId },
      func,
    });
    return res[0]?.result;
  } else {
    const res = await browser.tabs.executeScript(tabId, {
      code: `(${func.toString()})()`,
    });
    return res[0];
  }
}

/* ------------------ TAB UPDATE ------------------ */

browser.tabs.onUpdated.addListener((tabId, info) => {
  if (info.status === "complete") {
    const state = getTabState(tabId);
    if (state.enabled) {
      setTimeout(() => injectContentScript(tabId), 100);
    }
  }
});

/* ------------------ SHORTCUT ------------------ */

browser.commands?.onCommand.addListener((command) => {
  if (command === "toggle-focusmask") {
    browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
      if (tabs[0]) toggleExtension(tabs[0].id);
    });
  }
});
