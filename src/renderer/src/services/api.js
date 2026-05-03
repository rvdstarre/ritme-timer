import { Preferences } from '@capacitor/preferences'
import { LocalNotifications } from '@capacitor/local-notifications'

const isElectron = !!window.electronAPI

// --- Opslag ---

async function saveDay(dateKey, data) {
  if (isElectron) return // Electron slaat op via IPC in main process
  await Preferences.set({ key: `day_${dateKey}`, value: JSON.stringify(data) })
}

async function getDay(dateKey) {
  if (isElectron) return window.electronAPI.getDay(dateKey)
  const { value } = await Preferences.get({ key: `day_${dateKey}` })
  return value ? JSON.parse(value) : null
}

// --- Schema ---

export async function getDateKeys() {
  if (isElectron) return window.electronAPI.getDateKeys()
  const today = new Date().toISOString().slice(0, 10)
  const d = new Date(); d.setDate(d.getDate() + 1)
  return { today, tomorrow: d.toISOString().slice(0, 10) }
}

export async function setStartTime(dateKey, startTimestamp) {
  if (isElectron) return window.electronAPI.setStartTime(dateKey, startTimestamp)

  // Capacitor: bereken schema lokaal en sla op
  const { buildSchedule } = await import('../utils/schema-engine-web.js')
  const schedule = buildSchedule(startTimestamp)
  const data = { startTime: startTimestamp, schedule }
  await saveDay(dateKey, data)
  await scheduleCapacitorNotifications(schedule)
  return data
}

export async function confirmMoment(dateKey, momentId) {
  if (isElectron) return window.electronAPI.confirmMoment(dateKey, momentId)

  const day = await getDay(dateKey)
  if (!day) return null

  const { confirmMoment: confirm } = await import('../utils/schema-engine-web.js')
  const updatedSchedule = confirm(day.schedule, momentId, Date.now())
  const data = { ...day, schedule: updatedSchedule }
  await saveDay(dateKey, data)
  await scheduleCapacitorNotifications(updatedSchedule)
  return data
}

export async function syncDay(dateKey) {
  if (isElectron) return window.electronAPI.syncDay(dateKey)

  const day = await getDay(dateKey)
  if (!day) return null

  const { markMissed } = await import('../utils/schema-engine-web.js')
  const updatedSchedule = markMissed(day.schedule)
  const data = { ...day, schedule: updatedSchedule }
  await saveDay(dateKey, data)
  return data
}

// --- Notificaties (Capacitor) ---

async function scheduleCapacitorNotifications(schedule) {
  await LocalNotifications.cancel({ notifications: schedule.map(m => ({ id: m.id })) })

  const now = Date.now()
  const pending = schedule
    .filter(m => m.status === 'pending' && m.scheduledAt > now)
    .map(m => ({
      id: m.id,
      title: `Ritme Timer — ${m.type === 'water' ? 'Water' : 'Eten'}`,
      body: m.type === 'water' ? 'Tijd om wat te drinken!' : 'Tijd om te eten!',
      schedule: { at: new Date(m.scheduledAt) },
      channelId: 'ritme'
    }))

  if (pending.length > 0) {
    await LocalNotifications.schedule({ notifications: pending })
  }
}

// --- Notificatie-klik listener ---

export function onNotificationClicked(callback) {
  if (isElectron) {
    window.electronAPI.onNotificationClicked(callback)
  } else {
    LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
      callback(action.notification.id)
    })
  }
}
