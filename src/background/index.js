// Focus Mask Background (Cross-browser)

import browser from "webextension-polyfill";

// Default global settings
const DEFAULT_SETTINGS = {
  blur: 5,
  darkness: 0.5,
  blockInteraction: false,
};

// Per-tab state (in-memory)
const tabStates = new Map();

/* ------------------ TAB STATE HELPERS ------------------ */

function getTabState(tabId) {
  if (!tabStates.has(tabId)) {
    tabStates.set(tabId, {
      enabled: false,
      areas: [],
      drawMode: false,
    });
  }
  return tabStates.get(tabId);
}

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

browser.runtime.onMessage.addListener((message, sender) => {
  const tabId = message.tabId || sender.tab?.id;

  if (!tabId) return;

  if (message.action === "injectContentScript") {
    injectContentScript(tabId);
    return Promise.resolve({ success: true });
  }

  if (message.action === "getState" || message.action === "getTabState") {
    return browser.storage.local.get(DEFAULT_SETTINGS).then((globals) => {
      const tabState = getTabState(tabId);
      return { ...globals, ...tabState };
    });
  }

  if (message.action === "setState") {
    const { enabled, areas, drawMode, ...globalState } = message.state || {};

    if (Object.keys(globalState).length) {
      browser.storage.local.set(globalState);
    }

    const tabUpdate = {};
    if (enabled !== undefined) tabUpdate.enabled = enabled;
    if (areas !== undefined) tabUpdate.areas = areas;
    if (drawMode !== undefined) tabUpdate.drawMode = drawMode;

    if (Object.keys(tabUpdate).length) {
      setTabState(tabId, tabUpdate);
    }

    return Promise.resolve({ success: true });
  }

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
