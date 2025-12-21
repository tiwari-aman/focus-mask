# 🎯 Focus Mask

### **Stay Focused. Block Distractions. Get More Done.**

Focus Mask is a powerful Chrome extension that helps you concentrate on what matters by blurring and darkening everything outside your selected areas. Perfect for reading articles, studying, working on specific content, or reducing visual clutter on any webpage.

---

## ✨ Key Features

| Feature                     | Description                                                                 |
| --------------------------- | --------------------------------------------------------------------------- |
| 🎨 **Draw Focus Areas**     | Simply click and drag to select any rectangular region you want to focus on |
| 🌫️ **Adjustable Blur**      | Control blur intensity from subtle (0px) to heavy (20px)                    |
| 🌑 **Darkness Control**     | Adjust how dark the unfocused areas appear (0-100%)                         |
| 🚫 **Block Clicks Outside** | Prevent accidental clicks on distracting content                            |
| 🔧 **Floating Toolbar**     | Collapsible, draggable toolbar for quick access to controls                 |
| ↔️ **Resize & Move Areas**  | Drag corners to resize, drag center to reposition                           |
| 💾 **Auto-Save**            | Your settings persist across sessions                                       |
| ⚡ **Per-Tab Settings**     | Different focus areas for different tabs                                    |

---

## 🖼️ How It Works

```
┌─────────────────────────────────────────────────────────────┐
│  🌫️ Blurred & Darkened Area (Distractions Hidden)          │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│  ░░░░░░┌─────────────────────────────────┐░░░░░░░░░░░░░░░░  │
│  ░░░░░░│                                 │░░░░░░░░░░░░░░░░  │
│  ░░░░░░│   ✨ YOUR FOCUS AREA ✨          │░░░░░░░░░░░░░░░░  │
│  ░░░░░░│   Crystal clear content         │░░░░░░░░░░░░░░░░  │
│  ░░░░░░│   that you want to focus on     │░░░░░░░░░░░░░░░░  │
│  ░░░░░░│                                 │░░░░░░░░░░░░░░░░  │
│  ░░░░░░└─────────────────────────────────┘░░░░░░░░░░░░░░░░  │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Installation

1. **Download** the extension files
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable **Developer mode** (toggle in top right)
4. Click **Load unpacked** and select the `dist` folder
5. Pin the extension to your toolbar for easy access 📌

### Basic Usage

1. **Click** the Focus Mask icon in your Chrome toolbar
2. **Toggle** "Enable Focus Mask" to activate
3. **Click** the ✏️ Draw button in the floating toolbar
4. **Drag** to create your focus area
5. **Adjust** blur and darkness to your preference

---

## 🎮 Controls

### Floating Toolbar

| Button         | Action                                   |
| -------------- | ---------------------------------------- |
| ✏️ Draw        | Enter drawing mode to create focus areas |
| 🗑️ Clear       | Remove all focus areas                   |
| ◀ Collapse     | Minimize toolbar to save space           |
| ⋮⋮ Drag Handle | Move toolbar anywhere on the page        |

### Focus Area Actions

| Action     | How To                                |
| ---------- | ------------------------------------- |
| **Delete** | Hover over area → Click ✕ button      |
| **Resize** | Hover over area → Drag corner handles |
| **Move**   | Hover over area → Drag from center    |

### Popup Settings

| Setting                 | Description                                    |
| ----------------------- | ---------------------------------------------- |
| **Enable Focus Mask**   | Turn the extension on/off for current page     |
| **Blur Intensity**      | How blurry the unfocused areas appear (0-20px) |
| **Darkness Level**      | How dark the unfocused areas appear (0-100%)   |
| **Block Click Outside** | Prevent clicks in blurred areas                |

---

## 💡 Use Cases

### 📚 **Reading & Studying**

Focus on articles, research papers, or textbook content without sidebar distractions

### 💻 **Coding & Development**

Highlight specific code sections during reviews or pair programming

### 📊 **Presentations & Demos**

Draw attention to specific parts of a webpage during screen sharing

### 🎯 **Productivity**

Block distracting elements while working on focused tasks

### 🧘 **Reduced Visual Clutter**

Create a calmer browsing experience by hiding unnecessary content

---

## ⚙️ Settings Explained

### Blur Intensity (0-100%)

- **0%**: No blur, just darkened
- **25%**: Light blur (default) - subtle focus effect
- **75%**: Medium blur - noticeable separation
- **100%**: Heavy blur - maximum distraction blocking

### Darkness Level (0-100%)

- **0%**: Transparent overlay
- **50%**: Medium darkness (default)
- **100%**: Completely black outside focus areas

### Block Click Outside

When enabled:

- ✅ Clicks inside focus areas work normally
- ✅ Scrolling inside focus areas works
- ❌ Clicks outside focus areas are blocked
- ❌ Scrolling outside focus areas is blocked

---

## 🔧 Troubleshooting

| Issue                         | Solution                                                |
| ----------------------------- | ------------------------------------------------------- |
| Extension not working         | Check you're not on a restricted page (chrome://, etc.) |
| Overlay not appearing         | Toggle Enable in popup, refresh page                    |
| Performance issues            | Reduce blur intensity or clear some areas               |
| Areas misaligned after scroll | Focus areas use fixed positioning - this is by design   |

---

## ⚠️ Limitations

- Cannot run on Chrome internal pages (`chrome://`, `chrome-extension://`)
- Cannot run on Chrome Web Store pages
- Heavy blur on large areas may impact performance on older devices
- One focus area at a time (single area mode)

---

## 🛠️ Development

### Prerequisites

- Node.js 16+
- npm

### Build Commands

```bash
# Install dependencies
npm install

# Development build (with watch)
npm run dev

# Production build
npm run build
```

### Project Structure

```
src/
├── popup/          # Extension popup UI (React)
├── content/        # Page overlay & toolbar (React)
├── background/     # Service worker
├── assets/         # Icons
└── manifest.json   # Extension config
```

---

## 📝 License

MIT License - Free to use and modify

---

<div align="center">

**Made with ❤️ for focused productivity**

_Stop getting distracted. Start focusing._

</div>
