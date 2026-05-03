import { app, BrowserWindow, Tray, Menu, nativeImage } from 'electron'
import { join } from 'path'
import { autoUpdater } from 'electron-updater'
import { registerHandlers } from './ipc-handlers.js'

const isMac     = process.platform === 'darwin'
const isWindows = process.platform === 'win32'
let tray = null

function createWindow() {
  const win = new BrowserWindow({
    width: 420,
    height: 700,
    minWidth: 360,
    minHeight: 500,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    title: 'Ritme Timer',
    autoHideMenuBar: true,
    // macOS: gebruik native traffic-light knoppen
    titleBarStyle: isMac ? 'hiddenInset' : 'default'
  })

  global.mainWindow = win

  if (process.env.NODE_ENV === 'development') {
    win.loadURL(process.env.ELECTRON_RENDERER_URL)
    win.webContents.openDevTools()
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }

  win.on('close', (e) => {
    if (!app.isQuitting) {
      e.preventDefault()
      // macOS: verberg naar dock; Windows/Linux: verberg naar tray
      win.hide()
    }
  })
}

function trayIconPath() {
  // Windows: .ico voor beste kwaliteit in alle groottes
  // macOS/Linux: .png (macOS schaalt automatisch, Linux verwacht PNG)
  if (isWindows) return join(__dirname, '../../build/icon.ico')
  return join(__dirname, '../../build/icon.png')
}

function createTray() {
  try {
    const icon = nativeImage.createFromPath(trayIconPath())
    tray = new Tray(icon)
    tray.setToolTip('Ritme Timer')
    tray.setContextMenu(Menu.buildFromTemplate([
      { label: 'Openen', click: () => global.mainWindow?.show() },
      { type: 'separator' },
      { label: 'Afsluiten', click: () => { app.isQuitting = true; app.quit() } }
    ]))
    tray.on('click', () => global.mainWindow?.show())
  } catch {
    // Sommige Linux-desktops (GNOME zonder extensie) ondersteunen geen system tray.
    // App werkt gewoon door zonder tray.
    tray = null
  }
}

function setupMacMenu() {
  // Standaard macOS-applicatiemenu met Cmd+Q
  const menu = Menu.buildFromTemplate([
    {
      label: app.name,
      submenu: [
        { role: 'about', label: `Over Ritme Timer` },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { type: 'separator' },
        { label: 'Stoppen', accelerator: 'Cmd+Q', click: () => { app.isQuitting = true; app.quit() } }
      ]
    },
    { role: 'editMenu' },
    { role: 'windowMenu' }
  ])
  Menu.setApplicationMenu(menu)
}

app.whenReady().then(() => {
  registerHandlers()
  createWindow()
  createTray()

  if (isMac) setupMacMenu()

  if (process.env.NODE_ENV !== 'development') {
    autoUpdater.checkForUpdatesAndNotify()
  }
})

app.on('window-all-closed', () => {
  if (isMac) {
    // macOS-conventie: app blijft actief in dock totdat gebruiker Cmd+Q gebruikt
    return
  }
  // Windows/Linux: tray houdt de app actief — bewust niet afsluiten hier
})

app.on('activate', () => {
  // macOS: klik op dock-icoon terwijl app actief is maar geen venster zichtbaar
  if (global.mainWindow) {
    global.mainWindow.show()
  } else {
    createWindow()
  }
})
