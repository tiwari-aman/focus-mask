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

  const shadowRoot = container.attachShadow({ mode: "open" });

  // Link stylesheet inside shadow DOM for isolated CSS styling
  const styleLink = document.createElement("link");
  styleLink.rel = "stylesheet";
  styleLink.href = chrome.runtime.getURL("content.css");
  shadowRoot.appendChild(styleLink);

  const reactMountPoint = document.createElement("div");
  reactMountPoint.className = "focusmask-shadow-container";
  shadowRoot.appendChild(reactMountPoint);

  root = createRoot(reactMountPoint);
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
