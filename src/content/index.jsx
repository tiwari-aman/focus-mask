import React from "react";
import { createRoot } from "react-dom/client";
import FocusMaskApp from "./FocusMaskAppSingle";
import "./styles/content.css";

let root = null;
let container = null;

// Mount app
function mount() {
  if (window.__focusMaskInitialized) return;

  window.__focusMaskInitialized = true;

  container = document.createElement("div");
  container.id = "focusmask-root";
  document.documentElement.appendChild(container);

  root = createRoot(container);
  root.render(<FocusMaskApp />);
}

// Unmount app
function unmount() {
  if (!window.__focusMaskInitialized) return;

  window.__focusMaskInitialized = false;

  if (root) {
    root.unmount();
    root = null;
  }

  if (container) {
    container.remove();
    container = null;
  }
}

// Ensure DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mount);
} else {
  mount();
}

// Listen to background messages
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === "enable") {
    mount();
  }

  if (message.action === "disable") {
    unmount();
  }
});
