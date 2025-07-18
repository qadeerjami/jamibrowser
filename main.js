const { app, BrowserWindow, ipcMain, session } = require('electron');
const path = require('path');

// Add WebRTC command line switches before app ready
app.commandLine.appendSwitch('force-webrtc-ip-handling-policy', 'disable_non_proxied_udp');
app.commandLine.appendSwitch('webrtc-ip-handling-policy', 'default_public_interface_only');

function createProfileWindow(profile) {
  // Unique session for each profile
  const partition = `persist:profile-${profile.id}`;
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      partition,
      preload: path.join(__dirname, 'src', 'preload.js'),
      additionalArguments: [`--fingerprint-seed=${profile.fingerprintSeed || ''}`]
    }
  });

  // Proxy apply karein
  if (profile.proxyType && profile.proxyHost && profile.proxyPort) {
    session.fromPartition(partition).setProxy({
      proxyRules: `${profile.proxyType}://${profile.proxyHost}:${profile.proxyPort}`
    });
  }

  // User agent spoofing (example)
  if (profile.userAgent) {
    win.webContents.setUserAgent(profile.userAgent);
  }

  // Load extension if provided
  if (profile.extensionPath) {
    try {
      win.webContents.session.loadExtension(profile.extensionPath, { allowFileAccess: true });
    } catch (e) {
      console.error('Failed to load extension:', e);
    }
  }

  // Load the profile's URL or a default page
  win.loadURL(profile.url || 'https://www.example.com');
}

// IPC listener
ipcMain.on('launch-profile', (event, profile) => {
  createProfileWindow(profile);
});

app.whenReady().then(() => {
  // Optionally, create a main window for the app UI here
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
}); 