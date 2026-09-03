const {
  app,
  BrowserWindow,
  Tray,
  Menu,
  nativeImage,
  globalShortcut,
  screen,
  ipcMain,
} = require('electron');
const path = require('path');
const fs = require('fs');

let overlayWindow = null;
let tray = null;
const isDev = process.argv.includes('--dev') || process.env.NODE_ENV === 'development';
const distHtmlPath = path.join(__dirname, '../../dist/index.html');
const stateFilePath = path.join(app.getPath('userData'), 'focusmask-state.json');

function loadSavedState() {
  try {
    if (fs.existsSync(stateFilePath)) {
      const data = fs.readFileSync(stateFilePath, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error loading state:', err);
  }
  return {
    enabled: true,
    maskActive: true,
    blur: 5,
    darkness: 0.5,
    blockInteraction: false,
    areas: [],
    drawMode: false,
  };
}

let currentState = loadSavedState();

function persistState(newState) {
  try {
    currentState = { ...currentState, ...newState };
    fs.writeFileSync(stateFilePath, JSON.stringify(currentState, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving state:', err);
  }
}

function updateTrayMenu() {
  if (!tray) return;

  const contextMenu = Menu.buildFromTemplate([
    {
      label: currentState.enabled ? 'Disable Focus Mask' : 'Enable Focus Mask',
      accelerator: 'CommandOrControl+Shift+F',
      click: () => {
        sendToOverlay('toggle');
      },
    },
    { type: 'separator' },
    {
      label: 'Draw Focus Area',
      enabled: currentState.enabled && currentState.maskActive,
      click: () => {
        sendToOverlay('draw');
      },
    },
    {
      label: 'Clear Focus Area',
      enabled: currentState.enabled && currentState.areas && currentState.areas.length > 0,
      click: () => {
        sendToOverlay('clear');
      },
    },
    { type: 'separator' },
    {
      label: 'Block Clicks Outside',
      type: 'checkbox',
      checked: currentState.blockInteraction,
      click: (menuItem) => {
        sendToOverlay('set-block', menuItem.checked);
      },
    },
    { type: 'separator' },
    {
      label: 'Quit Focus Mask',
      accelerator: 'CommandOrControl+Q',
      click: () => {
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
}

function sendToOverlay(action, data) {
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    overlayWindow.webContents.send('menu-action', action, data);
  }
}

function createOverlayWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { x, y, width, height } = primaryDisplay.bounds;

  overlayWindow = new BrowserWindow({
    x,
    y,
    width,
    height,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    hasShadow: false,
    skipTaskbar: true,
    focusable: true,
    enableLargerThanScreen: true,
    resizable: false,
    movable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Make sure it sits above normal windows and stays visible across all virtual spaces
  overlayWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  overlayWindow.setAlwaysOnTop(true, 'screen-saver', 1);

  if (!isDev && fs.existsSync(distHtmlPath)) {
    overlayWindow.loadFile(distHtmlPath);
  } else {
    overlayWindow.loadURL('http://localhost:5173');
  }

  overlayWindow.on('closed', () => {
    overlayWindow = null;
  });
}

function createTray() {
  // Use 16x16 or 24x24 icon for macOS menu bar
  let iconPath = path.join(__dirname, '../../assets/icon16.png');
  if (!fs.existsSync(iconPath)) {
    iconPath = path.join(__dirname, '../renderer/assets/icon16.png');
  }

  let icon = nativeImage.createFromPath(iconPath);
  if (process.platform === 'darwin') {
    // Resize for crisp menu bar display on macOS retina
    icon = icon.resize({ width: 18, height: 18 });
  }

  tray = new Tray(icon);
  tray.setToolTip('Focus Mask');
  updateTrayMenu();

  tray.on('click', () => {
    sendToOverlay('toggle');
  });
}

// Ensure single instance
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (overlayWindow) {
      sendToOverlay('toggle');
    }
  });

  app.whenReady().then(() => {
    // Hide dock icon on macOS so it's a pure menu bar app
    if (process.platform === 'darwin' && app.dock) {
      app.dock.hide();
    }

    createOverlayWindow();
    createTray();

    // Register global shortcut
    globalShortcut.register('CommandOrControl+Shift+F', () => {
      sendToOverlay('toggle');
    });

    // Handle display metrics change (e.g. connecting external monitor)
    screen.on('display-metrics-changed', () => {
      if (overlayWindow && !overlayWindow.isDestroyed()) {
        const primary = screen.getPrimaryDisplay();
        overlayWindow.setBounds(primary.bounds);
      }
    });
  });

  // IPC Handlers
  ipcMain.on('set-ignore-mouse-events', (event, ignore, options) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win && !win.isDestroyed()) {
      win.setIgnoreMouseEvents(ignore, options || { forward: true });
    }
  });

  ipcMain.handle('get-state', () => {
    return currentState;
  });

  ipcMain.on('save-state', (event, state) => {
    persistState(state);
    updateTrayMenu();
  });

  ipcMain.on('quit-app', () => {
    app.quit();
  });

  app.on('will-quit', () => {
    globalShortcut.unregisterAll();
  });

  app.on('window-all-closed', (e) => {
    // Keep app running in tray even when window is hidden/closed
    e.preventDefault();
  });
}
