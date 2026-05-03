import Store from 'electron-store'

const store = new Store({
  name: 'ritme-data',
  schema: {
    days: {
      type: 'object',
      default: {}
    }
  }
})

/**
 * Slaat het schema op voor een bepaalde dag.
 * @param {string} dateKey - 'YYYY-MM-DD'
 * @param {object} data - { startTime, schedule }
 */
export function saveDay(dateKey, data) {
  const days = store.get('days')
  days[dateKey] = data
  store.set('days', days)
}

/**
 * Haalt data op voor een bepaalde dag.
 * @param {string} dateKey - 'YYYY-MM-DD'
 */
export function getDay(dateKey) {
  const days = store.get('days')
  return days[dateKey] ?? null
}

/**
 * Geeft de date key voor vandaag en morgen terug.
 */
export function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

export function tomorrowKey() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().slice(0, 10)
}
