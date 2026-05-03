import { Notification, app } from 'electron'

const activeTimers = new Map()

/**
 * Plant een Windows-notificatie in voor een schema-moment.
 * @param {object} moment - Schema-moment
 * @param {function} onActivated - Callback als gebruiker op notificatie klikt
 */
export function scheduleNotification(moment, onActivated) {
  cancelNotification(moment.id)

  const delay = moment.scheduledAt - Date.now()
  if (delay < 0) return

  const timer = setTimeout(() => {
    if (!Notification.isSupported()) return

    const icon = moment.type === 'water' ? '💧' : '🍽️'
    const notif = new Notification({
      title: `Ritme Timer — ${icon} ${moment.label}`,
      body: moment.type === 'water'
        ? 'Tijd om wat te drinken!'
        : 'Tijd om te eten!',
      urgency: 'normal'
    })

    notif.on('click', () => onActivated(moment.id))
    notif.show()

    activeTimers.delete(moment.id)
  }, delay)

  activeTimers.set(moment.id, timer)
}

/**
 * Annuleert een geplande notificatie.
 */
export function cancelNotification(momentId) {
  if (activeTimers.has(momentId)) {
    clearTimeout(activeTimers.get(momentId))
    activeTimers.delete(momentId)
  }
}

/**
 * Annuleert alle geplande notificaties.
 */
export function cancelAll() {
  for (const timer of activeTimers.values()) {
    clearTimeout(timer)
  }
  activeTimers.clear()
}

/**
 * Plant notificaties voor alle nog-pending momenten.
 */
export function scheduleAll(schedule, onActivated) {
  cancelAll()
  for (const moment of schedule) {
    if (moment.status === 'pending') {
      scheduleNotification(moment, onActivated)
    }
  }
}
