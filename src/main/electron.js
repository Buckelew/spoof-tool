const electron = require("electron");
const { app, BrowserWindow, Menu, globalShortcut } = electron;
const path = require("path");
const { exec } = require('child_process')
const isDev = require("electron-is-dev");

let mainWindow, iLocation;

require("update-electron-app")({
  repo: "buckelew/spoof-tool",
  updateInterval: "1 hour"
});

function createWindow() {

  // create menu
  const menu = new Menu();
  Menu.setApplicationMenu(menu);
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    frame: false,
    titleBarStyle: 'hidden',
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
    console.log(process.platform);
    iLocation = exec(`"${__dirname}/set-location/win/iFakeLocation.exe"`, (err, stdout, stderr) => {
      console.log('test1');
      if (err) console.log(err);
      else {
        console.log('test');
        console.log(err);
        console.log(stdout);
        console.log(stderr);
      }
    })
  } else if (process.platform === 'darwin') {

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
