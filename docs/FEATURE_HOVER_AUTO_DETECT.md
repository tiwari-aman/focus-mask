# Feature Specification: Smart Hover Auto-Detection ("Magic Wand")

> **Status:** Feature Design & Implementation Guide  
> **Applicability:** Chrome Extension & Desktop App (macOS & Windows)  
> **Prerequisite:** Base Focus Mask Architecture  

---

## 1. Feature Overview

Rather than manually clicking and dragging to draw a rectangle, **Smart Hover Auto-Detection** enables 1-click focus creation:
1. User activates **Smart Snapping Mode** (e.g. clicking a "Wand" icon or pressing <kbd>S</kbd>).
2. As the user moves their cursor over the screen, the system inspects the UI element under the mouse.
3. A glowing blue outline instantly highlights the candidate container (e.g., YouTube video player, an article paragraph, a comment thread, or Notion's sidebar).
4. A single click locks that outline as the active focus area, and darkens everything else!

---

## 2. Browser Extension Implementation (DOM-Based)

In a web browser, the extension has direct, instant access to the webpage DOM.

```
       Mouse Moves Over Webpage
                  |
                  v
       document.elementFromPoint(clientX, clientY)
                  |
                  v
       Smart Filter: Skip tiny inline elements (<span>, <a>)
       Find closest meaningful container (<video>, <article>, <div>)
                  |
                  v
       rect = element.getBoundingClientRect()
                  |
                  v
       Render Live Blue Pulsing Outline (<rect x={rect.x} ... />)
                  |
         User Clicks Element
                  |
                  v
       Lock 'rect' into 'areas' array & dim everything else!
```

### Smart Container Filtering Logic
If the user hovers over a single letter inside a comment, we don't want a 10px box. We climb up the DOM tree:
```javascript
function findMeaningfulContainer(element) {
  let el = element;
  while (el && el !== document.body) {
    const rect = el.getBoundingClientRect();
    // Must be large enough to be a meaningful block (e.g. video, comment, section)
    if (rect.width >= 120 && rect.height >= 80) {
      // Prioritize video players, articles, cards, or comments
      if (
        el.tagName === 'VIDEO' ||
        el.closest('#movie_player') ||
        el.getAttribute('role') === 'article' ||
        el.classList.contains('comment') ||
        el.tagName === 'ARTICLE' ||
        el.tagName === 'SECTION' ||
        el.tagName === 'MAIN'
      ) {
        return el;
      }
      return el;
    }
    el = el.parentElement;
  }
  return element;
}
```

### Bonus Feature: Dynamic Scroll Tracking
Because the extension knows the exact DOM element (e.g. YouTube `<video>`), it can attach a `ResizeObserver` or `scroll` listener. When the user scrolls down the page, the focus mask **moves along with the video**, keeping it perfectly centered without redrawing!

---

## 3. Desktop App Implementation (OS Accessibility-Based)

Outside the browser, the desktop app cannot read HTML directly. Instead, operating systems provide Accessibility APIs that expose the structural layout of running applications (like Notion, Slack, and VS Code).

### macOS Architecture (`AXUIElement`)
macOS has a built-in accessibility framework in `ApplicationServices`:
```objc
// Query element under global mouse position
AXUIElementRef systemWide = AXUIElementCreateSystemWide();
AXUIElementRef element = NULL;
AXUIElementCopyElementAtPosition(systemWide, mouseX, mouseY, &element);

// Extract position & size
CFTypeRef positionValue, sizeValue;
AXUIElementCopyAttributeValue(element, kAXPositionAttribute, &positionValue);
AXUIElementCopyAttributeValue(element, kAXSizeAttribute, &sizeValue);
```

### What Notion Exposes to macOS:
Because Notion is built with Electron/Chromium, it automatically exposes major ARIA regions to macOS:
1. **Notion Sidebar:** Exposed as `AXSplitGroup` or `AXGroup` navigation region.
2. **Page Content Area:** Exposed as `AXScrollArea` containing the main document.
3. **Top Action Bar:** Exposed as `AXToolbar`.

### Windows Architecture (`UIAutomation`)
On Windows, the `IUIAutomation` COM API provides identical functionality:
* `IUIAutomation::ElementFromPoint(point, &pElement)` returns the bounding rectangle of the control beneath the cursor.

---

## 4. Feature Comparison: Browser vs. Desktop

| Capability | Browser Extension | Desktop App (macOS & Windows) |
| :--- | :--- | :--- |
| **API Mechanism** | `document.elementFromPoint()` (HTML DOM) | `AXUIElement` (macOS) / `UIAutomation` (Windows) |
| **YouTube Video Snapping** | 🎯 Pixel-perfect snap to `#movie_player` | 🎯 Snaps to browser window/video bounds |
| **Notion Sidebar Snapping** | 🎯 Snaps to Notion web sidebar | 🎯 Snaps to Notion Desktop app sidebar |
| **Granularity** | Can snap to individual comments, buttons, code blocks | Snaps to major panels, sidebars, editors, windows |
| **Permissions Required** | None (standard content script) | macOS Accessibility Permission (one-time prompt) |
| **Dynamic Scrolling** | Can follow element as page scrolls | Static overlay box; movable via drag pill |

---

## 5. User Experience (UX) Flow

1. **Toolbar Button:** A new "Magic Wand" / "Auto-Detect" icon is added next to the Draw icon in `FloatingToolbarExpanded.jsx`.
2. **Visual Feedback:**
   * Custom cursor with wand indicator.
   * Hovered region shows an animated blue dashed outline (`stroke-dasharray: 6 4`) with subtle 10% blue fill.
   * Tooltip preview shows the dimensions (e.g. `840 × 480`).
3. **Confirmation:**
   * Left-click: Locks the previewed rectangle as a focus area.
   * <kbd>Esc</kbd> or Right-click: Cancels auto-detect mode without creating an area.
4. **Fallback:** If an app does not expose a clean accessibility boundary, the user can switch to manual drag-to-draw mode at any time.

---

## 6. Implementation Checklist

### Browser Extension (Phase 1):
- [ ] Add `hoverDetectMode` boolean state in `FocusMaskApp.jsx`.
- [ ] Implement `findMeaningfulContainer()` in a new hook `useSmartHover.js`.
- [ ] Render dynamic blue preview outline in `MaskOverlay.jsx`.
- [ ] Click handler to lock candidate rect into `areas: [...]`.

### Desktop App (Phase 2):
- [ ] Set up native node addon / macOS bridge (`node-mac-permissions` and `robotjs` / `macos-accessibility`).
- [ ] Query element under cursor on `mouse-move` when Auto-Detect mode is active.
- [ ] IPC message from Electron main process to React overlay renderer with bounding box `(x, y, w, h)`.
- [ ] Add accessibility permission check and friendly onboarding prompt.
