import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  getDay: (dateKey) => ipcRenderer.invoke('get-day', dateKey),
  setStartTime: (dateKey, startTimestamp) => ipcRenderer.invoke('set-start-time', { dateKey, startTimestamp }),
  confirmMoment: (dateKey, momentId) => ipcRenderer.invoke('confirm-moment', { dateKey, momentId }),
  syncDay: (dateKey) => ipcRenderer.invoke('sync-day', dateKey),
  getDateKeys: () => ipcRenderer.invoke('get-date-keys'),
  onNotificationClicked: (callback) => ipcRenderer.on('notification-clicked', (_e, id) => callback(id)),

  // Update events
  onUpdateAvailable: (cb) => ipcRenderer.on('update-available', (_e, info) => cb(info)),
  onUpdateProgress:  (cb) => ipcRenderer.on('update-progress',  (_e, info) => cb(info)),
  onUpdateReady:     (cb) => ipcRenderer.on('update-ready',     (_e, info) => cb(info)),
  installUpdate:     ()   => ipcRenderer.invoke('install-update'),
  openDownloadUrl:   (url) => ipcRenderer.invoke('open-download-url', url)
})
