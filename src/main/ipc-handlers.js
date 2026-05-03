import { ipcMain } from 'electron'
import { buildSchedule, confirmMoment, markMissed } from './schema-engine.js'
import { scheduleAll } from './notification-manager.js'
import { saveDay, getDay, todayKey, tomorrowKey } from './store.js'

export function registerHandlers() {
  // Haal dagdata op (vandaag of morgen)
  ipcMain.handle('get-day', (_e, dateKey) => {
    return getDay(dateKey)
  })

  // Sla begintijd op en bereken schema
  ipcMain.handle('set-start-time', (_e, { dateKey, startTimestamp }) => {
    const schedule = buildSchedule(startTimestamp)
    const data = { startTime: startTimestamp, schedule }
    saveDay(dateKey, data)

    // Plan notificaties als het vandaag is
    if (dateKey === todayKey()) {
      scheduleAll(schedule, (momentId) => {
        // Stuur event naar renderer bij klik op notificatie
        global.mainWindow?.webContents.send('notification-clicked', momentId)
      })
    }

    return data
  })

  // Bevestig een moment
  ipcMain.handle('confirm-moment', (_e, { dateKey, momentId }) => {
    const day = getDay(dateKey)
    if (!day) return null

    const updatedSchedule = confirmMoment(day.schedule, momentId, Date.now())
    const data = { ...day, schedule: updatedSchedule }
    saveDay(dateKey, data)

    // Herplan notificaties
    if (dateKey === todayKey()) {
      scheduleAll(updatedSchedule, (id) => {
        global.mainWindow?.webContents.send('notification-clicked', id)
      })
    }

    return data
  })

  // Markeer gemiste momenten (aanroepen bij app-start / dagwisseling)
  ipcMain.handle('sync-day', (_e, dateKey) => {
    const day = getDay(dateKey)
    if (!day) return null

    const updatedSchedule = markMissed(day.schedule)
    const data = { ...day, schedule: updatedSchedule }
    saveDay(dateKey, data)
    return data
  })

  // Geef vandaag en morgen sleutels terug
  ipcMain.handle('get-date-keys', () => ({
    today: todayKey(),
    tomorrow: tomorrowKey()
  }))
}
