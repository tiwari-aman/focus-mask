# Focus Mask

A Chrome extension that enhances focus and concentration by allowing users to blur and darken areas outside their selected focus region on any webpage.

## Features

- **Draw Focus Areas** – Select rectangular regions to keep in focus
- **Adjustable Blur** – Control blur intensity (0–20px)
- **Darkness Control** – Adjust overlay darkness (0–100%)
- **Block Clicks Outside** – Prevent accidental interaction with unfocused content
- **Floating Toolbar** – Collapsible, draggable control panel
- **Resize & Reposition** – Modify focus areas dynamically
- **Persistent Settings** – Automatically saves preferences across sessions
- **Per-Tab Configuration** – Independent settings for each tab

## Installation

1. Clone or download the repository
2. Navigate to `chrome://extensions/` in Chrome
3. Enable **Developer mode** (top right toggle)
4. Click **Load unpacked** and select the project root directory
5. The extension will appear in your Chrome toolbar

## Usage

### Activating the Overlay

1. Click the Focus Mask icon in your toolbar
2. Toggle **Enable Focus Mask** in the popup
3. Click the **Draw** button in the floating toolbar
4. Drag to create your focus area

### Managing Focus Areas

- **Resize** – Drag corner handles
- **Reposition** – Drag from the center
- **Delete** – Hover and click the remove button

### Adjusting Settings

Use the popup to control:
- **Blur Intensity** – How blurred the unfocused areas appear (0–20px)
- **Darkness Level** – Overlay opacity (0–100%)
- **Block Clicks Outside** – Enable/disable click blocking

## Permissions

The extension requests the following permissions:

| Permission       | Purpose                                                    |
|------------------|------------------------------------------------------------|
| `storage`        | Persist user preferences (blur, darkness, enabled state)  |
| `scripting`      | Inject overlay and toolbar scripts into webpages          |
| `activeTab`      | Access the active tab when user activates the extension   |
| `<all_urls>`     | Apply overlay to any accessible webpage                    |

## Limitations

- Cannot run on Chrome internal pages (`chrome://`, `chrome-extension://`)
- Cannot run on Chrome Web Store pages
- Single focus area per page (non-overlapping regions)

## Development

### Setup

```bash
npm install
```

### Build

```bash
npm run build
```

### Development Mode

```bash
npm run dev
```

### Project Structure

```
src/
├── manifest.json                    # Extension configuration and permissions
├── background/
│   └── index.js                     # Service worker for background tasks
├── popup/                           # Extension popup UI (React)
│   ├── index.jsx                    # Popup entry point
│   ├── App.jsx                      # Main popup component
│   ├── popup.html                   # Popup HTML template
│   ├── components/
│   │   ├── Header.jsx               # Popup header with status
│   │   ├── ActionButtons.jsx        # Enable/disable buttons
│   │   ├── SliderSection.jsx        # Blur and darkness controls
│   │   ├── ToggleSection.jsx        # Block clicks toggle
│   │   └── StatusBar.jsx            # Status information display
│   └── styles/
│       └── popup.css                # Popup styling
├── content/                         # Page overlay and toolbar (React)
│   ├── index.jsx                    # Content script entry point
│   ├── FocusMaskApp.jsx             # Main overlay component
│   ├── FocusMaskAppSingle.jsx       # Single focus area mode
│   ├── components/
│   │   ├── Toolbar.jsx              # Floating toolbar with controls
│   │   ├── DrawingArea.jsx          # Drawing mode handler
│   │   └── MaskOverlay.jsx          # Blur and darkness overlay
│   ├── hooks/
│   │   └── useClickBlocking.js      # Hook for blocking outside clicks
│   └── styles/
│       └── content.css              # Overlay and toolbar styling
└── assets/                          # Icons and extension resources
```

## Technology Stack

- **React** – UI components
- **Chrome Extension API** – Extension functionality
- **CSS** – Styling and overlay effects

## Demo

[![Focus Mask Demo](https://img.youtube.com/vi/M6nZPy7N4Tk/0.jpg)](https://youtu.be/M6nZPy7N4Tk)


