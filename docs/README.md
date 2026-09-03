# Focus Mask Roadmap & Architecture Documentation

Welcome to the Focus Mask documentation and feature roadmap. This directory outlines the evolution of Focus Mask from a Chrome Extension into a cross-platform desktop application, followed by subsequent advanced feature rollouts.

---

## 🗺️ Implementation Roadmap

```
+-------------------------------------------------------------------------------+
|  STEP 1: Desktop Application Architecture                                      |
|  File: docs/DESKTOP_APP_ARCHITECTURE.md                                       |
|  - Cross-platform Electron + React foundation                                 |
|  - macOS Menu Bar (Status Bar) & Windows System Tray integration              |
|  - Full-screen transparent overlay with smart click pass-through to Notion     |
|  - Direct reuse of 85%+ extension React components & CSS                      |
+-------------------------------------------------------------------------------+
                                      |
                                      v
+-------------------------------------------------------------------------------+
|  STEP 2: Multiple Focus Areas                                                 |
|  File: docs/FEATURE_MULTIPLE_AREAS.md                                         |
|  - Upgrading state from single area to multi-area array                       |
|  - Independent 4-corner resize handles, drag pill, and delete (×) per box     |
|  - Multi-cutout SVG mask rendering & click-through coordinate checking        |
|  - Applicable to both Browser Extension and Desktop App                       |
+-------------------------------------------------------------------------------+
                                      |
                                      v
+-------------------------------------------------------------------------------+
|  STEP 3: Smart Hover Auto-Detection ("Magic Wand")                            |
|  File: docs/FEATURE_HOVER_AUTO_DETECT.md                                      |
|  - Hover over containers to see live blue preview box & 1-click lock          |
|  - Browser: DOM element inspection (YouTube video player, comments, articles) |
|  - Desktop: macOS Accessibility API (AXUIElement) for Notion sidebar & panes  |
+-------------------------------------------------------------------------------+
```

---

## 📚 Document Index

1. [**Desktop App Architecture (`DESKTOP_APP_ARCHITECTURE.md`)**](./DESKTOP_APP_ARCHITECTURE.md)
   * Tech stack choice (Electron + React + Vite).
   * OS Status Bar / Menu Bar Extra integration.
   * Full-screen overlay & `setIgnoreMouseEvents` click-through mechanics.
   * Component reusability mapping from `extension/src/`.
   * Recommended directory layout for `desktop/`.

2. [**Multiple Focus Areas (`FEATURE_MULTIPLE_AREAS.md`)**](./FEATURE_MULTIPLE_AREAS.md)
   * Transitioning from `FocusMaskAppSingle.jsx` to multi-area state.
   * Interaction handles (resize, move, delete) for multiple simultaneous boxes.
   * Multi-cutout SVG mask and click pass-through logic for native apps.
   * Edge cases (overlapping areas, Esc key behavior).

3. [**Smart Hover Auto-Detection (`FEATURE_HOVER_AUTO_DETECT.md`)**](./FEATURE_HOVER_AUTO_DETECT.md)
   * 1-click focus creation via hover snapping.
   * Browser DOM element detection (YouTube video, comments, divs).
   * Desktop OS Accessibility Tree (`AXUIElement` on macOS, `UIAutomation` on Windows) for Notion sidebar and app panels.
   * Dynamic scroll tracking.
