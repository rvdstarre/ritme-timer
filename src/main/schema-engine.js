// Tijdsintervallen in milliseconden
const MEAL_INTERVAL_MS = 2.5 * 60 * 60 * 1000   // 2,5 uur tussen maaltijden
const WATER_OFFSET_MS  = 30 * 60 * 1000           // 30 min voor/na maaltijd
const MIN_MEALS        = 6
const MEAL_NAMES       = ['Ontbijt', 'Tussendoor', 'Lunch', 'Tussendoor', 'Avondeten', 'Tussendoor']

/**
 * Berekent het volledige dagschema op basis van een begintijd.
 * @param {number} startTimestamp - Unix timestamp van de begintijd (eerste maaltijd)
 * @returns {Array<{id, type, label, scheduledAt, confirmedAt, status}>}
 */
export function buildSchedule(startTimestamp) {
  const moments = []
  let id = 0

  for (let i = 0; i < MIN_MEALS; i++) {
    const mealTime = startTimestamp + i * MEAL_INTERVAL_MS
    const mealLabel = MEAL_NAMES[i]

    // Water vóór maaltijd (behalve voor de allereerste: die begint al met water)
    moments.push({
      id: id++,
      type: 'water',
      label: i === 0 ? 'Water (start)' : `Water voor ${mealLabel}`,
      scheduledAt: mealTime - WATER_OFFSET_MS,
      confirmedAt: null,
      status: 'pending'
    })

    // Maaltijd
    moments.push({
      id: id++,
      type: 'food',
      label: mealLabel,
      scheduledAt: mealTime,
      confirmedAt: null,
      status: 'pending'
    })

    // Water ná maaltijd
    moments.push({
      id: id++,
      type: 'water',
      label: `Water na ${mealLabel}`,
      scheduledAt: mealTime + WATER_OFFSET_MS,
      confirmedAt: null,
      status: 'pending'
    })
  }

  // Sorteer op tijd en verwijder duplicaten die te dicht op elkaar zitten
  moments.sort((a, b) => a.scheduledAt - b.scheduledAt)
  return deduplicateMoments(moments)
}

/**
 * Verwijdert momenten die minder dan 15 minuten uit elkaar liggen (zelfde type).
 */
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

/**
 * Herberekent alle toekomstige momenten na bevestiging van een moment.
 * @param {Array} schedule - Huidig schema
 * @param {number} confirmedId - ID van het bevestigde moment
 * @param {number} confirmedAt - Werkelijk tijdstip van bevestiging
 * @returns {Array} Bijgewerkt schema
 */
export function confirmMoment(schedule, confirmedId, confirmedAt) {
  const idx = schedule.findIndex(m => m.id === confirmedId)
  if (idx === -1) return schedule

  const updated = schedule.map(m => ({ ...m }))
  updated[idx].confirmedAt = confirmedAt
  updated[idx].status = 'done'

  // Verschil tussen gepland en werkelijk
  const delta = confirmedAt - updated[idx].scheduledAt

  // Verschuif alle toekomstige momenten met hetzelfde delta
  for (let i = idx + 1; i < updated.length; i++) {
    if (updated[i].status === 'pending') {
      updated[i].scheduledAt += delta
    }
  }

  return updated
}

/**
 * Geeft het volgende aankomende moment terug dat nog niet bevestigd is.
 */
export function getNextPending(schedule) {
  const now = Date.now()
  return schedule.find(m => m.status === 'pending' && m.scheduledAt > now) ?? null
}

/**
 * Markeert gemiste momenten (gepland in het verleden, nog pending).
 */
export function markMissed(schedule) {
  const now = Date.now()
  return schedule.map(m => {
    if (m.status === 'pending' && m.scheduledAt < now - 5 * 60 * 1000) {
      return { ...m, status: 'missed' }
    }
    return m
  })
}
