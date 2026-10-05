const path = require('path');
const fs = require('fs');
const { spawn, execSync } = require('child_process');
const activeWin = require('active-win');

const activeWinOptions = {
  screenRecordingPermission: false,
  accessibilityPermission: false,
};

class NativeWindowHook {
  constructor({ onActiveAppChanged, onWindowMoved }) {
    this.onActiveAppChanged = onActiveAppChanged;
    this.onWindowMoved = onWindowMoved;
    this.currentApp = null;
    this.childProcess = null;
    this.boundsPollTimer = null;
    this.isDestroyed = false;

    this.start();
  }

  start() {
    if (process.platform === 'darwin') {
      this.startMacOS();
    } else if (process.platform === 'win32') {
      this.startWindows();
    } else {
      this.startFallbackPoll();
    }

    // Start lightweight bounds polling to detect when the current window moves or resizes
    this.startBoundsPoll();
  }

  startMacOS() {
    const binPath = path.join(__dirname, '../../bin/macos-window-listener');
    const swiftSource = path.join(__dirname, '../../scripts/macos-listener.swift');

    // Auto-compile if binary doesn't exist
    if (!fs.existsSync(binPath)) {
      try {
        const binDir = path.dirname(binPath);
        if (!fs.existsSync(binDir)) fs.mkdirSync(binDir, { recursive: true });
        execSync(`swiftc -O "${swiftSource}" -o "${binPath}"`, { stdio: 'ignore' });
      } catch (err) {
        console.error('Could not compile macos-window-listener, falling back:', err);
        return this.startFallbackPoll();
      }
    }

    this.spawnListener(binPath, []);
  }

  startWindows() {
    const ps1Path = path.join(__dirname, '../../scripts/windows-listener.ps1');
    if (fs.existsSync(ps1Path)) {
      this.spawnListener('powershell', [
        '-NoProfile',
        '-NonInteractive',
        '-ExecutionPolicy',
        'Bypass',
        '-File',
        ps1Path,
      ]);
    } else {
      this.startFallbackPoll();
    }
  }

  spawnListener(command, args) {
    try {
      this.childProcess = spawn(command, args, {
        stdio: ['ignore', 'pipe', 'ignore'],
        windowsHide: true,
      });

      let buffer = '';
      this.childProcess.stdout.on('data', (data) => {
        buffer += data.toString('utf8');
        const lines = buffer.split('\n');
        buffer = lines.pop(); // keep last incomplete line

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          try {
            const info = JSON.parse(trimmed);
            if (info && info.appName) {
              this.handleAppActivated(info);
            }
          } catch (_) {}
        }
      });

      this.childProcess.on('exit', () => {
        if (!this.isDestroyed) {
          // Restart after 1 second if died unexpectedly
          setTimeout(() => this.start(), 1000);
        }
      });
    } catch (err) {
      console.error('Failed to spawn native listener, falling back:', err);
      this.startFallbackPoll();
    }
  }

  handleAppActivated(info) {
    if (info.appName === 'Electron' || info.appName === 'focusmask-desktop') return;

    const isNew = !this.currentApp || this.currentApp.appName !== info.appName;
    this.currentApp = {
      appName: info.appName,
      pid: info.pid,
      bounds: info.bounds,
    };

    if (isNew) {
      this.onActiveAppChanged(this.currentApp);
    }
  }

  // Poll bounds of the active window so when the user moves/resizes it, the mask follows
  startBoundsPoll() {
    this.boundsPollTimer = setInterval(async () => {
      try {
        if (!this.currentApp) return;
        const win = await activeWin(activeWinOptions);
        if (!win || !win.owner || !win.bounds) return;

        const ownerName = win.owner.name || '';
        if (ownerName === 'Electron' || ownerName === 'focusmask-desktop') return;

        if (this.currentApp && ownerName === this.currentApp.appName) {
          const prev = this.currentApp.bounds;
          const moved =
            prev.x !== win.bounds.x ||
            prev.y !== win.bounds.y ||
            prev.width !== win.bounds.width ||
            prev.height !== win.bounds.height;

          if (moved) {
            this.currentApp.bounds = {
              x: win.bounds.x,
              y: win.bounds.y,
              width: win.bounds.width,
              height: win.bounds.height,
            };
            this.onWindowMoved(this.currentApp);
          }
        }
      } catch (_) {}
    }, 80);
  }

  startFallbackPoll() {
    setInterval(async () => {
      try {
        const win = await activeWin(activeWinOptions);
        if (!win || !win.owner || !win.bounds) return;
        const ownerName = win.owner.name || '';
        if (ownerName === 'Electron' || ownerName === 'focusmask-desktop') return;

        this.handleAppActivated({
          appName: ownerName,
          pid: win.owner.processId,
          bounds: { ...win.bounds },
        });
      } catch (_) {}
    }, 50);
  }

  getCurrentApp() {
    return this.currentApp;
  }

  destroy() {
    this.isDestroyed = true;
    if (this.boundsPollTimer) clearInterval(this.boundsPollTimer);
    if (this.childProcess) {
      try {
        this.childProcess.kill();
      } catch (_) {}
    }
  }
}

module.exports = NativeWindowHook;
