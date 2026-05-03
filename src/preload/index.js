import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  getDay: (dateKey) => ipcRenderer.invoke('get-day', dateKey),
  setStartTime: (dateKey, startTimestamp) => ipcRenderer.invoke('set-start-time', { dateKey, startTimestamp }),
  confirmMoment: (dateKey, momentId) => ipcRenderer.invoke('confirm-moment', { dateKey, momentId }),
  syncDay: (dateKey) => ipcRenderer.invoke('sync-day', dateKey),
  getDateKeys: () => ipcRenderer.invoke('get-date-keys'),
  onNotificationClicked: (callback) => ipcRenderer.on('notification-clicked', (_e, id) => callback(id))
})
