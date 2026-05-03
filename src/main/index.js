import { app, BrowserWindow, Tray, Menu, nativeImage } from 'electron'
import { join } from 'path'
import { autoUpdater } from 'electron-updater'
import { registerHandlers } from './ipc-handlers.js'

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
    autoHideMenuBar: true
  })

  global.mainWindow = win

  if (process.env.NODE_ENV === 'development') {
    win.loadURL(process.env.ELECTRON_RENDERER_URL)
    win.webContents.openDevTools()
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }

  // Verberg naar system tray bij sluiten (zodat notificaties blijven werken)
  win.on('close', (e) => {
    if (!app.isQuitting) {
      e.preventDefault()
      win.hide()
    }
  })
}

function createTray() {
  const icon = nativeImage.createEmpty()
  tray = new Tray(icon)
  tray.setToolTip('Ritme Timer')
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Openen', click: () => global.mainWindow?.show() },
    { type: 'separator' },
    { label: 'Afsluiten', click: () => { app.isQuitting = true; app.quit() } }
  ]))
  tray.on('click', () => global.mainWindow?.show())
}

app.whenReady().then(() => {
  registerHandlers()
  createWindow()
  createTray()

  if (process.env.NODE_ENV !== 'development') {
    autoUpdater.checkForUpdatesAndNotify()
  }
})

app.on('window-all-closed', () => {
  // Niet afsluiten — tray blijft actief voor notificaties
})

app.on('activate', () => {
  global.mainWindow?.show()
})
