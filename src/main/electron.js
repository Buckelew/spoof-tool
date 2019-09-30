const electron = require("electron");
const { app, BrowserWindow, Menu, globalShortcut } = electron;
const path = require("path");
const { execFile, exec } = require('child_process')
const isDev = require("electron-is-dev");

let mainWindow, iLocation;

require("update-electron-app")({
  repo: "buckelew/spoof-tool",
  updateInterval: "1 hour"
});

function createWindow() {

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    frame: false,
    // titleBarStyle: 'hidden',
    transparent: true,
    webPreferences: {
      webSecurity: false
    }
  });
  globalShortcut.register('CommandOrControl+P', () => {
    isDev ? mainWindow.toggleDevTools() : ''
  })
  mainWindow.loadURL(
    isDev
      ? "http://localhost:3000"
      : `file://${path.join(__dirname, "../build/index.html")}`
  );
  mainWindow.on("closed", () => (mainWindow = null));
}

app.on("ready", () => {
  createWindow();

  // start location server
  if (process.platform === 'win32') {
    iLocation = execFile(path.join(__dirname, `/set-location/win/iFakeLocation.exe`), (err, data) => {
      if (err) console.log(err);
      else {
        console.log(data.toString());
      }
    })
  } else if (process.platform === 'darwin') {
    iLocation = exec('hdiutil attach ' + path.join(__dirname, `/set-location/mac/iFakeLocation.dmg`), (err, data) => {
      if (err) console.log(err);
      else {
        console.log(data.toString());
      }
    })
  }
});

app.on("window-all-closed", () => {
  iLocation.kill();
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});
