const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('focusMaskDesktop', {
  setIgnoreMouseEvents: (ignore, options) => {
    ipcRenderer.send('set-ignore-mouse-events', ignore, options);
  },
  saveState: (state) => {
    ipcRenderer.send('save-state', state);
  },
  getState: () => {
    return ipcRenderer.invoke('get-state');
  },
  onMenuAction: (callback) => {
    // Action, data, extra
    const handler = (event, action, data, extra) => callback(action, data, extra);
    ipcRenderer.on('menu-action', handler);
    return () => ipcRenderer.removeListener('menu-action', handler);
  },
  lockToActiveWindow: () => {
    return ipcRenderer.invoke('lock-to-active-window');
  },
  getCurrentApp: () => {
    return ipcRenderer.invoke('get-current-app');
  },
  unlockWindowTracking: () => {
    ipcRenderer.send('unlock-window-tracking');
  },
  quitApp: () => {
    ipcRenderer.send('quit-app');
  },
  platform: process.platform,
});
