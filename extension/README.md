# Focus Mask

A Chrome extension that enhances focus and concentration by allowing users to blur and darken areas outside their selected focus region on any webpage or local document.

## Features

- **Draw Focus Areas** – Select rectangular regions to keep in sharp focus
- **Adjustable Blur** – Control blur intensity (0–20px)
- **Darkness Control** – Adjust overlay darkness (0–100%)
- **Block Clicks Outside** – Prevent accidental interaction with unfocused content
- **Floating Toolbar** – Sleek, collapsible, draggable control panel that never gets in your way
- **Shadow DOM Isolation** – 100% immune to host webpage CSS resets, conflicting stylesheets, and z-index issues
- **Zoom Immunity & Viewport Scaling** – Elements stay crisp, properly proportioned, and responsive across any zoom level (50% to 300%)
- **Touch & Stylus Support** – Full Pointer Events compatibility for touchscreen laptops, tablets, and stylus pens
- **Local File (`file://`) Support** – Seamlessly works on local HTML files, downloaded documentation, and offline articles
- **Keyboard Shortcuts** – Press <kbd>Esc</kbd> anytime to cancel drawing mode or quickly clear focus areas
- **Persistent Settings** – Automatically saves preferences across browser sessions

## Installation

1. Clone or download the repository:
   ```bash
   git clone https://github.com/tiwari-aman/focus-mask.git
   cd focus-mask/extension
   ```
2. Install dependencies and build the extension:
   ```bash
   npm install
   npm run build
   ```
3. Navigate to `chrome://extensions/` in Google Chrome
4. Enable **Developer mode** (toggle in the top-right corner)
5. Click **Load unpacked** and select the **`extension/dist`** directory
6. The Focus Mask icon will appear in your Chrome extension toolbar

---

## Usage

### Activating the Overlay
1. Click the Focus Mask icon in your Chrome toolbar (or popup)
2. Toggle **Enable Focus Mask**
3. Click the **Draw** icon in the floating toolbar
4. Click and drag across the screen to create your focus area

### Managing Focus Areas
- **Resize** – Drag any corner handle
- **Reposition** – Drag from the bottom center pill handle
- **Delete / Clear** – Hover over the box and click the red delete button (`×`), or click **Clear** on the toolbar
- **Keyboard Shortcut** – Press <kbd>Esc</kbd> anytime to dismiss/cancel

### Using with Local Files (`file://`)
To use Focus Mask on local HTML files or offline documents:
1. Go to `chrome://extensions/`
2. Find **Focus Mask** and click **Details**
3. Enable the toggle for **Allow access to file URLs**
*(Focus Mask's popup will also automatically detect local files and provide a direct 1-click button to open this settings page)*

---

## Permissions

| Permission       | Purpose                                                    |
|------------------|------------------------------------------------------------|
| `storage`        | Persist user preferences (blur, darkness, enabled state)  |
| `scripting`      | Inject overlay and toolbar scripts into webpages          |
| `activeTab`      | Access the active tab when user activates the extension   |
| `<all_urls>`     | Apply overlay to any accessible webpage or local file      |

---

## Limitations

- Cannot run on restricted Chrome internal pages (`chrome://`, `chrome-extension://`)
- Cannot run on the Chrome Web Store pages (restricted by Chrome security policy)
- Single focus area per page for maximum focus clarity

---

## Development

### Setup
```bash
npm install
```

### Build Production Bundle
```bash
npm run build
```

### Development Watch Mode
```bash
npm run dev
```

---

## Project Structure

```
src/
├── manifest.json                    # Manifest V3 configuration and permissions
├── background/
│   └── index.js                     # Background service worker
├── popup/                           # Extension popup UI (React)
│   ├── index.jsx                    # Popup entry point
│   ├── App.jsx                      # Main popup component
│   ├── popup.html                   # Popup HTML template
│   ├── components/
│   │   ├── Header.jsx               # Popup header with status
│   │   ├── ActionButtons.jsx        # Enable/disable toggle
│   │   ├── SliderSection.jsx        # Blur and darkness sliders
│   │   ├── ToggleSection.jsx        # Click blocking toggle
│   │   └── StatusBar.jsx            # Status info display
│   ├── hooks/
│   │   └── useExtensionState.js     # State management & local file detection
│   └── styles/
│       └── popup.css                # Popup styling
├── content/                         # In-page overlay & floating toolbar (React)
│   ├── index.jsx                    # Content script entry & Shadow DOM host
│   ├── FocusMaskAppSingle.jsx       # Single focus area manager & viewport sync
│   ├── components/
│   │   ├── Toolbar.jsx              # Draggable floating toolbar container
│   │   ├── FloatingToolbarCollapsed.jsx # Minimal floating badge
│   │   ├── FloatingToolbarExpanded.jsx  # Full controls pill
│   │   ├── DrawingArea.jsx          # Pointer drawing overlay
│   │   └── MaskOverlay.jsx          # Blur/darkness mask & SVG resize handles
│   └── styles/
│       └── content.css              # Encapsulated Shadow DOM styles
└── assets/                          # Extension icons & brand assets
```

---

## Technology Stack

- **React 18** – Modular UI components
- **Chrome Extension Manifest V3** – Modern extension architecture
- **Shadow DOM** – Complete CSS encapsulation & style isolation
- **Pointer Events API** – Unified mouse, trackpad, and touch support
- **Webpack 5** – Bundle optimization and asset pipeline

---

## Demo

[![Focus Mask Demo](https://img.youtube.com/vi/M6nZPy7N4Tk/0.jpg)](https://youtu.be/M6nZPy7N4Tk)


