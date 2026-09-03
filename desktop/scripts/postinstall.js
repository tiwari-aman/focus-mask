const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

try {
  const electronPathTxt = path.join(__dirname, '../node_modules/electron/path.txt');
  const electronDist = path.join(__dirname, '../node_modules/electron/dist');
  const macApp = path.join(electronDist, 'Electron.app');

  if (process.platform === 'darwin' && !fs.existsSync(macApp)) {
    console.log('Ensuring Electron binary is extracted...');
    const cacheDir = path.join(process.env.HOME || '', 'Library/Caches/electron');
    if (fs.existsSync(cacheDir)) {
      const zipPath = execSync(`find "${cacheDir}" -name "*electron*darwin*zip" | head -n 1`, { encoding: 'utf8' }).trim();
      if (zipPath && fs.existsSync(zipPath)) {
        execSync(`unzip -q -o "${zipPath}" -d "${electronDist}"`);
        fs.writeFileSync(electronPathTxt, 'Electron.app/Contents/MacOS/Electron');
        console.log('Electron binary ready.');
      }
    }
  }
} catch (e) {
  // Postinstall fallback is best-effort
}
