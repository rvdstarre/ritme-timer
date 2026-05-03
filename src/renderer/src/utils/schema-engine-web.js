// Kopie van schema-engine voor gebruik in de browser/Capacitor context
// (Electron gebruikt de versie in src/main/schema-engine.js)

const MEAL_INTERVAL_MS = 2.5 * 60 * 60 * 1000
const WATER_OFFSET_MS  = 30 * 60 * 1000
const MIN_MEALS        = 6
const MEAL_NAMES       = ['Ontbijt', 'Tussendoor', 'Lunch', 'Tussendoor', 'Avondeten', 'Tussendoor']

export function buildSchedule(startTimestamp) {
  const moments = []
  let id = 0

  for (let i = 0; i < MIN_MEALS; i++) {
    const mealTime = startTimestamp + i * MEAL_INTERVAL_MS
    const mealLabel = MEAL_NAMES[i]

    moments.push({
      id: id++,
      type: 'water',
      label: i === 0 ? 'Water (start)' : `Water voor ${mealLabel}`,
      scheduledAt: mealTime - WATER_OFFSET_MS,
      confirmedAt: null,
      status: 'pending'
    })

    moments.push({
      id: id++,
      type: 'food',
      label: mealLabel,
      scheduledAt: mealTime,
      confirmedAt: null,
      status: 'pending'
    })

    moments.push({
      id: id++,
      type: 'water',
      label: `Water na ${mealLabel}`,
      scheduledAt: mealTime + WATER_OFFSET_MS,
      confirmedAt: null,
      status: 'pending'
    })
  }

  moments.sort((a, b) => a.scheduledAt - b.scheduledAt)
  return deduplicateMoments(moments)
}

function deduplicateMoments(moments) {
  const result = []
  for (const moment of moments) {
    const last = result.findLast(m => m.type === moment.type)
    if (!last || moment.scheduledAt - last.scheduledAt >= 15 * 60 * 1000) {
      result.push(moment)
    }
  }
  return result
}

export function confirmMoment(schedule, confirmedId, confirmedAt) {
  const idx = schedule.findIndex(m => m.id === confirmedId)
  if (idx === -1) return schedule

  const updated = schedule.map(m => ({ ...m }))
  updated[idx].confirmedAt = confirmedAt
  updated[idx].status = 'done'

  const delta = confirmedAt - updated[idx].scheduledAt
  for (let i = idx + 1; i < updated.length; i++) {
    if (updated[i].status === 'pending') {
      updated[i].scheduledAt += delta
    }
  }

  return updated
}

export function getNextPending(schedule) {
  const now = Date.now()
  return schedule.find(m => m.status === 'pending' && m.scheduledAt > now) ?? null
}

export function markMissed(schedule) {
  const now = Date.now()
  return schedule.map(m => {
    if (m.status === 'pending' && m.scheduledAt < now - 5 * 60 * 1000) {
      return { ...m, status: 'missed' }
    }
    return m
  })
}
