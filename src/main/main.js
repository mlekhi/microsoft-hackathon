const { app, BrowserWindow } = require('electron');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    },
  });

  // During development
  win.loadURL('http://localhost:5173');

  // For production:
  // win.loadFile(path.join(__dirname, '../renderer/dist/index.html'));
}

app.whenReady().then(createWindow);
