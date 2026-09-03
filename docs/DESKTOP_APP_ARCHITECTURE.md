# Focus Mask Desktop App Architecture & Roadmap

> **Status:** Architecture & Specification  
> **Target Platforms:** macOS (Apple Silicon / Intel) & Windows (10/11)  
> **Core Objective:** Bring Focus Mask outside the browser to native desktop apps (Notion, VS Code, Slack, PDF readers, etc.) with a macOS Menu Bar / Windows System Tray presence and full-screen transparent click-through overlay.

---

## 1. Executive Summary

Focus Mask currently functions as a Chrome Extension (Manifest V3), which restricts its capabilities strictly to browser tabs. The desktop version brings this focus-enhancement experience system-wide.

Key capabilities of the desktop variant:
1. **OS Status Bar Integration:** Runs quietly in the macOS Menu Bar (top-right) and Windows System Tray (bottom-right).
2. **Transparent Full-Screen Overlay:** Dims and blurs all background apps on the display except for the designated focus region(s).
3. **Smart Click Pass-Through:** When working inside the focus region (e.g. typing inside Notion), mouse clicks and keyboard events pass directly into the application beneath. Outside clicks can optionally be blocked.
4. **85%+ Code Reusability:** Leverages the existing React components, SVG mask logic, and draggable floating toolbar from the extension.

---

## 2. Technology Stack & Strategy

### Recommended Choice: **Electron + React + Vite**

| Layer | Technology | Rationale |
| :--- | :--- | :--- |
| **Shell / OS Bridge** | **Electron** | Direct support for `Tray` (macOS status bar & Windows tray), global keyboard shortcuts, multi-display geometry, and window transparency with mouse pass-through (`setIgnoreMouseEvents`). |
| **Frontend UI** | **React 18** | Reuses existing `MaskOverlay.jsx`, `Toolbar.jsx`, `DrawingArea.jsx`, and CSS stylesheets from `extension/src/content/`. |
| **Build Tooling** | **Vite** | Fast HMR during development; builds a clean lightweight bundle for Electron. |
| **Packaging** | **electron-builder** | Generates `.dmg` / `.zip` for macOS (notarized) and `.exe` / `.msi` installers for Windows. |

---

## 3. System Architecture & Component Design

```
+-------------------------------------------------------------+
|                      Operating System                       |
|   +--------------------------+  +------------------------+  |
|   |  macOS Menu Bar (Top)    |  | Windows Tray (Bottom)  |  |
|   |  [Focus Mask Tray Icon]  |  | [Focus Mask Tray Icon] |  |
|   +------------+-------------+  +-----------+------------+  |
+----------------|----------------------------|---------------+
                 |                            |
                 v                            v
      +--------------------------------------------------+
      |             Electron Main Process                |
      | - Tray & Status Bar Menu Manager                 |
      | - Global Hotkey Listener (Cmd/Ctrl + Shift + F)  |
      | - Multi-Display Screen Dimension Watcher         |
      | - IPC Controller (State, Opacity, Blur, Bounds)  |
      +------------------------+-------------------------+
                               |
            Controls Window State & Click Forwarding
                               |
                               v
      +--------------------------------------------------+
      |       Full-Screen Transparent Overlay Window     |
      |  (alwaysOnTop: true, transparent: true, frame:0) |
      |                                                  |
      |   +------------------------------------------+   |
      |   |   React Renderer (from extension/src)    |   |
      |   |   - SVG Cutout Mask (MaskOverlay.jsx)    |   |
      |   |   - Floating Toolbar (Toolbar.jsx)       |   |
      |   |   - Draw & Resize Handles                |   |
      |   +------------------------------------------+   |
      +------------------------+-------------------------+
                               |
                     Mouse Event Forwarding
                               |
                               v
      +--------------------------------------------------+
      |      Target Desktop Application (e.g. Notion)    |
      |  Clicks & typing pass directly into active app!  |
      +--------------------------------------------------+
```

---

## 4. Status Bar / Menu Bar Integration

### macOS Menu Bar Behavior
* Configured with `LSUIElement: true` in `Info.plist`:
  * The app runs as an accessory/agent app without cluttering the macOS Dock.
  * An icon sits directly in the macOS menu bar (next to WiFi/Control Center).
* Left-click opens a sleek quick-control popup (Enable/Disable, Blur slider, Darkness slider, Draw mode, Quit).
* Right-click opens the standard OS context menu.

### Windows System Tray Behavior
* Sits in the Notification Area (bottom-right next to the clock).
* Supports single-click toggle and double-click settings popover.

---

## 5. Click-Through Mechanics: Interacting with Notion

In a browser, CSS `pointer-events: none` handles click pass-through. On a desktop OS, an overlay window would normally block clicks from reaching Notion beneath it.

Electron solves this with `window.setIgnoreMouseEvents()`:

```javascript
// Electron IPC Handler for Mouse Interaction
ipcMain.on('set-ignore-mouse-events', (event, ignore, options) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (ignore) {
    // Clicks and scrolls fall straight into Notion underneath!
    win.setIgnoreMouseEvents(true, { forward: true });
  } else {
    // Window captures clicks (for toolbar, drawing, and resize handles)
    win.setIgnoreMouseEvents(false);
  }
});
```

### In the React Frontend:
1. **Inside Focus Box:** Pointer triggers `set-ignore-mouse-events(true)` → You can select text, click buttons, and scroll inside Notion.
2. **Hovering Toolbar / Resize Handles:** Pointer triggers `set-ignore-mouse-events(false)` → You can drag the toolbar, adjust sliders, or resize the box.
3. **Outside Area (Blocking Mode OFF):** Clicks fall through to background apps.
4. **Outside Area (Blocking Mode ON):** Clicks are intercepted by the overlay, preventing accidental clicks outside your focus.

---

## 6. Code Reusability from Extension

| Extension Component | Desktop Reusability | Notes / Minor Changes |
| :--- | :--- | :--- |
| [`MaskOverlay.jsx`](file:///Users/amantiwari/Desktop/focus-mask/extension/src/content/components/MaskOverlay.jsx) | **95% Reusable** | SVG mask cutout and blur filter work identically. |
| [`Toolbar.jsx`](file:///Users/amantiwari/Desktop/focus-mask/extension/src/content/components/Toolbar.jsx) | **95% Reusable** | Collapsible floating pill with sliders and controls. |
| [`DrawingArea.jsx`](file:///Users/amantiwari/Desktop/focus-mask/extension/src/content/components/DrawingArea.jsx) | **90% Reusable** | Captures pointer-down and drag to establish rectangle. |
| [`content.css`](file:///Users/amantiwari/Desktop/focus-mask/extension/src/content/styles/content.css) | **100% Reusable** | Styles and animations work directly in Electron. |
| State Management | **80% Reusable** | Replace `chrome.runtime.sendMessage` with Electron `ipcRenderer.send`. |

---

## 7. Recommended Directory Structure

```
focus-mask/
├── extension/             # Existing Chrome Extension
│   ├── src/
│   └── package.json
├── desktop/               # NEW Desktop Application
│   ├── src/
│   │   ├── main/          # Electron main process (Tray, Windows, Shortcuts)
│   │   │   ├── index.js   # App lifecycle, single-instance lock
│   │   │   ├── tray.js    # macOS menu bar & Windows tray setup
│   │   │   ├── window.js  # Transparent overlay window manager
│   │   │   └── preload.js # Secure IPC bridge
│   │   └── renderer/      # React UI (adapted from extension)
│   │       ├── App.jsx
│   │       ├── components/
│   │       │   ├── MaskOverlay.jsx
│   │       │   ├── Toolbar.jsx
│   │       │   └── DrawingArea.jsx
│   │       └── styles/
│   ├── package.json
│   ├── vite.config.js
│   └── electron-builder.yml
├── docs/                  # Architecture & Feature Roadmap Docs
└── website/
```

---

## 8. Implementation Phases

1. **Phase 1 (Base Desktop App):**
   - Initialize `desktop/` workspace with Electron + React.
   - Implement macOS status bar Tray icon and global hotkey (`Cmd+Shift+F`).
   - Create transparent full-screen overlay with single focus area.
   - Implement click-through pass-through to underlying apps (Notion).
2. **Phase 2 (Multiple Focus Areas):**
   - Upgrade state and rendering to support multiple simultaneous focus boxes.
   - Independent handles, drag pills, and remove buttons for each box.
3. **Phase 3 (Smart Mouse Hover Auto-Detection):**
   - macOS Accessibility (`AXUIElement`) integration to detect Notion sidebar/panels.
   - Snapping outline preview and 1-click focus creation.
