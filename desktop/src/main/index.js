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
const activeWin = require('active-win');
const NativeWindowHook = require('./native-window-hook');

let overlayWindow = null;
let tray = null;
let windowHook = null;
const isDev = process.argv.includes('--dev') || process.env.NODE_ENV === 'development';
const distHtmlPath = path.join(__dirname, '../../dist/index.html');
const stateFilePath = path.join(app.getPath('userData'), 'focusmask-state.json');

// Options to prevent active-win from throwing/blocking for Screen Recording permissions
const activeWinOptions = {
  screenRecordingPermission: false,
  accessibilityPermission: false,
};

// ─── Window Tracking State ─────────────────────────────────────────────────────
let currentActiveApp = null; // { appName, pid, bounds }
let lastExternalWindow = null;

async function getTargetWindow() {
  if (windowHook?.getCurrentApp()) return windowHook.getCurrentApp();
  if (lastExternalWindow) return lastExternalWindow;
  try {
    const win = await activeWin(activeWinOptions);
    if (win && win.owner && win.bounds) {
      const name = win.owner.name || '';
      if (name !== 'Electron' && name !== 'focusmask-desktop') {
        lastExternalWindow = {
          appName: name,
          pid: win.owner.processId,
          bounds: { ...win.bounds },
        };
        currentActiveApp = lastExternalWindow;
        return lastExternalWindow;
      }
    }
  } catch (err) {
    console.error('Error detecting active window:', err);
  }
  return null;
}

// ─── State Persistence ─────────────────────────────────────────────────────────
function loadSavedState() {
  try {
    if (fs.existsSync(stateFilePath)) {
      const data = fs.readFileSync(stateFilePath, 'utf8');
      const saved = JSON.parse(data);
      return {
        ...saved,
        enabled: true,
        drawMode: false,
      };
    }
  } catch (err) {
    console.error('Error loading state:', err);
  }
  return {
    enabled: true,
    mode: 'window-bound',
    profiles: {},
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

// ─── Tray Menu ─────────────────────────────────────────────────────────────────
function updateTrayMenu() {
  if (!tray) return;

  const currentAppName = currentActiveApp?.appName || 'Active Window';

  const contextMenu = Menu.buildFromTemplate([
    {
      label: currentState.enabled ? 'Disable Focus Mask' : 'Enable Focus Mask',
      accelerator: 'CommandOrControl+Shift+F',
      click: () => sendToOverlay('toggle'),
    },
    { type: 'separator' },
    {
      label: `🎯  Lock / Pin to ${currentAppName}`,
      click: async () => {
        const target = await getTargetWindow();
        if (target) {
          sendToOverlay('pin-current-app', target);
        }
      },
    },
    {
      label: '🌐  Global Screen Mode',
      click: () => sendToOverlay('set-mode', 'global'),
    },
    { type: 'separator' },
    {
      label: 'Draw Focus Area',
      enabled: currentState.enabled,
      click: () => sendToOverlay('draw'),
    },
    {
      label: 'Clear Focus Area',
      enabled: currentState.enabled,
      click: () => sendToOverlay('clear'),
    },
    { type: 'separator' },
    {
      label: 'Block Clicks Outside',
      type: 'checkbox',
      checked: !!currentState.blockInteraction,
      click: (menuItem) => sendToOverlay('set-block', menuItem.checked),
    },
    { type: 'separator' },
    {
      label: 'Quit Focus Mask',
      accelerator: 'CommandOrControl+Q',
      click: () => app.quit(),
    },
  ]);

  tray.setContextMenu(contextMenu);
}

function sendToOverlay(action, data, extra) {
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    overlayWindow.webContents.send('menu-action', action, data, extra);
  }
}

// ─── Overlay Window ────────────────────────────────────────────────────────────
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

// ─── Tray ──────────────────────────────────────────────────────────────────────
function createTray() {
  let iconPath = path.join(__dirname, '../../assets/icon16.png');
  if (!fs.existsSync(iconPath)) {
    iconPath = path.join(__dirname, '../renderer/assets/icon16.png');
  }

  let icon = nativeImage.createFromPath(iconPath);
  if (process.platform === 'darwin') {
    icon = icon.resize({ width: 18, height: 18 });
  }

  tray = new Tray(icon);
  tray.setToolTip('Focus Mask');
  updateTrayMenu();

  if (process.platform === 'darwin') {
    tray.on('click', () => tray.popUpContextMenu());
  }
}

// ─── App Lifecycle ─────────────────────────────────────────────────────────────
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (overlayWindow) sendToOverlay('toggle');
  });

  app.whenReady().then(() => {
    if (process.platform === 'darwin' && app.dock) {
      app.dock.hide();
    }

    createOverlayWindow();
    createTray();

    // Start 0ms Native OS Window Event Hook
    windowHook = new NativeWindowHook({
      onActiveAppChanged: (appInfo) => {
        currentActiveApp = appInfo;
        lastExternalWindow = appInfo;
        sendToOverlay('active-app-changed', appInfo);
        updateTrayMenu();
      },
      onWindowMoved: (appInfo) => {
        currentActiveApp = appInfo;
        lastExternalWindow = appInfo;
        sendToOverlay('active-window-moved', appInfo);
      },
    });

    globalShortcut.register('CommandOrControl+Shift+F', () => {
      sendToOverlay('toggle');
    });

    screen.on('display-metrics-changed', () => {
      if (overlayWindow && !overlayWindow.isDestroyed()) {
        const primary = screen.getPrimaryDisplay();
        overlayWindow.setBounds(primary.bounds);
      }
    });
  });

  // ─── IPC Handlers ──────────────────────────────────────────────────────────
  ipcMain.on('set-ignore-mouse-events', (event, ignore, options) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win && !win.isDestroyed()) {
      win.setIgnoreMouseEvents(ignore, options || { forward: true });
    }
  });

  ipcMain.handle('get-state', () => currentState);

  ipcMain.on('save-state', (event, state) => {
    persistState(state);
    updateTrayMenu();
  });

  ipcMain.on('quit-app', () => app.quit());

  ipcMain.handle('get-current-app', async () => {
    return await getTargetWindow();
  });

  ipcMain.handle('lock-to-active-window', async () => {
    const target = await getTargetWindow();
    if (target) {
      return { success: true, trackedWindow: target };
    }
    return { success: false, reason: 'No active window found' };
  });

  ipcMain.on('unlock-window-tracking', () => {
    updateTrayMenu();
  });

  app.on('will-quit', () => {
    globalShortcut.unregisterAll();
    if (windowHook) windowHook.destroy();
  });

  app.on('window-all-closed', (e) => {
    e.preventDefault();
  });
}
