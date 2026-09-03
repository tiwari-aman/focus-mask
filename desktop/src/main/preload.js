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
    const handler = (event, action, data) => callback(action, data);
    ipcRenderer.on('menu-action', handler);
    return () => ipcRenderer.removeListener('menu-action', handler);
  },
  quitApp: () => {
    ipcRenderer.send('quit-app');
  },
  platform: process.platform,
});
