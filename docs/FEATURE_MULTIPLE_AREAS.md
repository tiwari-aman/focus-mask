# Feature Specification: Multiple Focus Areas

> **Status:** Feature Design & Implementation Guide  
> **Applicability:** Chrome Extension & Desktop App (macOS & Windows)  
> **Prerequisite:** Base Focus Mask Architecture  

---

## 1. Overview & Use Cases

Currently, Focus Mask allows users to create **one** focus area at a time. The multi-area feature allows users to keep **two or more distinct regions** in sharp focus simultaneously, while darkening and blurring everything else on screen.

### Real-World Use Cases:
1. **Research & Note-Taking:** Focus on a YouTube lecture on the left and a Notion note doc on the right; hide recommendations and sidebars.
2. **Coding & Documentation:** Focus on a terminal/IDE pane and API docs; hide chat apps, notifications, and desktop background.
3. **Reading & Annotating:** Focus on an article body and a comment/scratchpad section.

---

## 2. Current Codebase Foundation

The good news: the Focus Mask codebase was **architected for multiple areas from day one**!

In [`extension/src/content/components/MaskOverlay.jsx`](file:///Users/amantiwari/Desktop/focus-mask/extension/src/content/components/MaskOverlay.jsx):
* The `BlurOverlay` component accepts `areas` (an array) and cuts out every rectangle in SVG:
  ```jsx
  {allAreas.map((area, index) => (
    <rect
      key={index}
      x={area.x}
      y={area.y}
      width={area.width}
      height={area.height}
      rx={cornerRadius}
      ry={cornerRadius}
      fill="black"
    />
  ))}
  ```
* The SVG layer already maps over `areas` and renders an independent `<FocusAreaOutline>` for each box:
  ```jsx
  {areas.map((area, index) => (
    <FocusAreaOutline
      key={index}
      area={area}
      index={index}
      onRemove={() => onRemoveArea(index)}
      onResize={(newArea) => onResizeArea(index, newArea)}
    />
  ))}
  ```
* In [`FocusMaskApp.jsx`](file:///Users/amantiwari/Desktop/focus-mask/extension/src/content/FocusMaskApp.jsx), adding an area appends to the array:
  ```javascript
  updateState({ areas: [...state.areas, currentRect] });
  ```
  *(Only [`FocusMaskAppSingle.jsx`](file:///Users/amantiwari/Desktop/focus-mask/extension/src/content/FocusMaskAppSingle.jsx) had `MAX_FOCUS_AREAS = 1` set for the initial release).*

---

## 3. Interaction Design & Controls

Each focus area operates with its own complete set of interactive controls:

```
        +---------------------------------------------------+  [ × ] Delete Button
 [nw]   |                                                   |   [ne]
   o    |                                                   |    o
        |                                                   |
        |                  FOCUS AREA 1                     |
        |               (Sharp / Unblurred)                 |
        |                                                   |
   o    |                     [ === ]                       |    o
 [sw]   +---------------------------------------------------+   [se]
                           Bottom Center Drag Pill
```

### Controls per Box:
1. **Corner Resize Handles (`nw`, `ne`, `sw`, `se`):** Drag any corner to expand or shrink that specific rectangle.
2. **Move Handle (Bottom-Center Pill):** Drag to move that specific focus box anywhere on the screen without affecting other boxes.
3. **Delete Button (`×` at top-right):** Instantly deletes that specific focus box.
4. **Hover Detection Glow:** When the mouse hovers over a box or its handles, subtle blue glow outlines appear, keeping the interface uncluttered when not interacting.

---

## 4. Multi-Area Logic: Browser vs. Desktop

### 🌐 In the Chrome Extension
* **Drawing additional areas:**
  * When in `Draw Mode`, clicking and dragging anywhere outside existing areas creates Area #2, #3, etc.
  * In the toolbar, a badge displays the count (e.g. `2 Focus Areas`).
* **Click-Blocking:**
  * [`useClickBlocking.js`](file:///Users/amantiwari/Desktop/focus-mask/extension/src/content/hooks/useClickBlocking.js) tests if a click is inside **any** registered area:
    ```javascript
    const isPointInAnyArea = (clientX, clientY) => {
      return areas.some((area) => (
        clientX >= area.x && clientX <= area.x + area.width &&
        clientY >= area.y && clientY <= area.y + area.height
      ));
    };
    ```
  * Clicks inside *any* focus box work normally on the webpage. Clicks outside all boxes are blocked if "Block Clicks Outside" is active.

### 🖥️ In the Desktop App (Electron)
* **Full-Screen SVG Mask:**
  * The transparent overlay contains SVG cutouts for all active areas.
* **Mouse Event Forwarding to Native Apps (e.g. Notion):**
  * When the cursor is inside **Area #1 OR Area #2**:
    ```javascript
    const isInsideAnyFocusBox = areas.some(a => isInside(cursorPos, a));
    if (isInsideAnyFocusBox) {
      // Forward mouse events to Notion / active app
      overlayWindow.setIgnoreMouseEvents(true, { forward: true });
    } else if (isOverToolbarOrHandles) {
      // Capture mouse events for Focus Mask UI
      overlayWindow.setIgnoreMouseEvents(false);
    }
    ```
  * Result: You can smoothly switch between typing in Notion in Area 1 and browsing in Area 2 without friction.

---

## 5. Edge Cases & Polish

1. **Overlapping Areas:**
   * When two focus boxes overlap, the SVG `black` cutout masks merge naturally into a single combined visible window.
   * Both retain their own handles for individual repositioning.
2. **Maximum Area Safeguard:**
   * Recommended limit: Up to 4 simultaneous areas (configurable in settings) to prevent accidental clutter.
3. **Esc Key Hierarchy:**
   * 1st press: If currently drawing, cancel the draw preview.
   * 2nd press: Clear the most recently added focus area.
   * Toolbar button: "Clear All" resets to zero areas.

---

## 6. Implementation Checklist

- [ ] Remove `MAX_FOCUS_AREAS = 1` limit in the state manager.
- [ ] Add area count indicator to the floating toolbar (e.g. `Area 1 of 2`).
- [ ] Implement `Clear All` vs `Delete Selected` in the toolbar.
- [ ] Add unique IDs (`id: uuid()`) to each area object for stable React list rendering.
- [ ] Support keyboard cycling between active boxes (e.g. <kbd>Tab</kbd> to cycle).
