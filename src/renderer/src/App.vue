<template>
  <div class="flex flex-col h-screen max-w-sm mx-auto p-4 gap-4">

    <!-- Skip-link voor toetsenbordgebruikers -->
    <a href="#schema" class="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-blue-600 focus:text-white focus:px-3 focus:py-1 focus:rounded">
      Ga naar schema
    </a>

    <!-- Header -->
    <header class="flex items-center justify-between">
      <h1 class="text-xl font-bold tracking-tight">Ritme Timer</h1>
    </header>

    <!-- Dag selector tabs -->
    <div role="tablist" aria-label="Dag selecteren" class="flex gap-2 text-sm">
      <button
        v-for="tab in ['today', 'tomorrow']"
        :key="tab"
        role="tab"
        :aria-selected="activeTab === tab"
        :tabindex="activeTab === tab ? 0 : -1"
        @click="activeTab = tab"
        @keydown.right="activeTab = 'tomorrow'"
        @keydown.left="activeTab = 'today'"
        :class="[
          'flex-1 py-1.5 rounded-lg font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
          activeTab === tab
            ? 'bg-gray-700 text-white'
            : 'text-gray-400 hover:text-gray-200'
        ]"
      >
        {{ tab === 'today' ? 'Vandaag' : 'Morgen' }}
      </button>
    </div>

    <!-- Begintijd instellen -->
    <section
      v-if="!currentDay || editingStart"
      aria-label="Begintijd instellen"
      class="bg-gray-900 rounded-2xl p-4 flex flex-col gap-3"
    >
      <label :for="'start-time-' + activeTab" class="text-sm text-gray-300">
        {{ activeTab === 'today' ? 'Wanneer wil je vandaag beginnen?' : 'Wanneer begin je morgen?' }}
      </label>
      <input
        :id="'start-time-' + activeTab"
        ref="timeInputRef"
        v-model="startTimeInput"
        type="time"
        :aria-label="activeTab === 'today' ? 'Begintijd vandaag' : 'Begintijd morgen'"
        class="bg-gray-800 text-white rounded-xl px-4 py-3 text-center text-2xl font-mono border border-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500"
      />
      <button
        @click="applyStartTime"
        :disabled="!startTimeInput"
        :aria-disabled="!startTimeInput"
        class="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-semibold py-3 rounded-xl transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
      >
        Schema starten
      </button>
    </section>

    <!-- Schema weergave -->
    <main
      v-if="currentDay && !editingStart"
      id="schema"
      class="flex flex-col gap-2 flex-1 overflow-y-auto"
    >
      <!-- Aria-live regio voor schema-updates -->
      <div aria-live="polite" aria-atomic="false" class="sr-only" ref="liveRegion"></div>

      <!-- Volgende melding -->
      <section
        v-if="nextPending"
        aria-label="Volgende melding"
        class="bg-gray-900 rounded-2xl p-4"
      >
        <p class="text-xs text-gray-400 mb-2" aria-hidden="true">Volgende melding</p>
        <div class="flex items-center gap-3">
          <span aria-hidden="true" class="text-2xl shrink-0">
            {{ nextPending.type === 'water' ? '💧' : '🍽️' }}
          </span>
          <div class="flex-1 min-w-0">
            <p class="font-semibold truncate">{{ nextPending.label }}</p>
            <!-- Countdown groot, tijdstip klein eronder -->
            <p
              :class="[
                'text-xl font-mono font-bold tabular-nums',
                countdown?.urgent ? 'text-orange-400' : 'text-white'
              ]"
              :aria-label="countdown?.ariaText"
            >
              {{ countdown?.text }}
            </p>
            <p class="text-xs text-gray-500" aria-hidden="true">{{ formatTime(nextPending.scheduledAt) }}</p>
          </div>
          <button
            @click="confirm(nextPending)"
            :aria-label="`Bevestig: ${nextPending.label}, ${countdown?.ariaText}`"
            class="ml-auto shrink-0 bg-green-600 hover:bg-green-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition focus:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
          >
            Bevestig
          </button>
        </div>
      </section>

      <!-- Volledige tijdlijn -->
      <section aria-label="Dagschema" class="bg-gray-900 rounded-2xl p-4 flex flex-col gap-2">
        <div class="flex items-center justify-between mb-1">
          <p class="text-xs text-gray-400" aria-hidden="true">Schema</p>
          <button
            @click="editingStart = true"
            class="text-xs text-gray-400 hover:text-gray-200 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
          >
            Wijzig begintijd
          </button>
        </div>

        <ul class="flex flex-col gap-1" aria-label="Momenten">
          <li
            v-for="moment in currentDay.schedule"
            :key="moment.id"
            :class="[
              'flex items-center gap-3 py-2 px-3 rounded-xl transition',
              moment.status === 'done'   ? 'opacity-50' : '',
              moment.status === 'missed' ? 'opacity-40' : '',
              moment.id === nextPending?.id ? 'bg-gray-800' : ''
            ]"
            :aria-label="momentAriaLabel(moment)"
          >
            <span aria-hidden="true" class="text-lg w-6 text-center shrink-0">
              {{ moment.type === 'water' ? '💧' : '🍽️' }}
            </span>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium truncate">{{ moment.label }}</p>
              <p class="text-xs text-gray-400">{{ formatTime(moment.scheduledAt) }}</p>
            </div>
            <span
              v-if="moment.status === 'done'"
              aria-label="Bevestigd"
              class="text-green-500 text-xs"
              aria-hidden="true"
            >✓</span>
            <span
              v-if="moment.status === 'missed'"
              class="text-red-400 text-xs"
            >Gemist</span>
            <button
              v-if="moment.status === 'pending' && moment.id !== nextPending?.id"
              @click="confirm(moment)"
              :aria-label="`Bevestig: ${moment.label} om ${formatTime(moment.scheduledAt)}`"
              class="text-xs text-gray-400 hover:text-green-400 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 rounded px-1"
            >
              Bevestig
            </button>
          </li>
        </ul>
      </section>
    </main>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { getDateKeys, setStartTime, confirmMoment, syncDay, onNotificationClicked } from './services/api.js'
import { getNextPending } from './utils/schema-engine-web.js'

const dateKeys     = ref({ today: '', tomorrow: '' })
const activeTab    = ref('today')
const todayData    = ref(null)
const tomorrowData = ref(null)
const editingStart = ref(false)
const startTimeInput = ref('')
const timeInputRef = ref(null)
const liveRegion   = ref(null)
const now          = ref(Date.now())

let clockTimer = null

const currentDay = computed(() => activeTab.value === 'today' ? todayData.value : tomorrowData.value)
const currentKey = computed(() => activeTab.value === 'today' ? dateKeys.value.today : dateKeys.value.tomorrow)

const nextPending = computed(() => {
  if (!todayData.value) return null
  return getNextPending(todayData.value.schedule)
})

function formatTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })
}

const countdown = computed(() => {
  if (!nextPending.value) return null
  const diff = nextPending.value.scheduledAt - now.value

  if (diff <= 0) return { text: 'Nu!', urgent: true, ariaText: 'Nu' }

  const totalMinutes = Math.ceil(diff / 60000)
  const hours   = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (hours === 0) {
    return { text: `over ${minutes} min`, urgent: totalMinutes <= 5, ariaText: `over ${minutes} minuten` }
  }
  if (minutes === 0) {
    return { text: `over ${hours}u`, urgent: false, ariaText: `over ${hours} uur` }
  }
  return { text: `over ${hours}u ${minutes}min`, urgent: false, ariaText: `over ${hours} uur en ${minutes} minuten` }
})

function momentAriaLabel(moment) {
  const type  = moment.type === 'water' ? 'Water drinken' : 'Eten'
  const time  = formatTime(moment.scheduledAt)
  const label = moment.label
  const status = moment.status === 'done'
    ? ', bevestigd'
    : moment.status === 'missed'
      ? ', gemist'
      : ''
  return `${type}: ${label} om ${time}${status}`
}

function announce(message) {
  if (liveRegion.value) liveRegion.value.textContent = message
}

async function applyStartTime() {
  if (!startTimeInput.value) return

  const [hours, minutes] = startTimeInput.value.split(':').map(Number)
  const base = activeTab.value === 'today'
    ? new Date()
    : (() => { const d = new Date(); d.setDate(d.getDate() + 1); return d })()
  base.setHours(hours, minutes, 0, 0)

  const data = await setStartTime(currentKey.value, base.getTime())
  if (activeTab.value === 'today') todayData.value = data
  else tomorrowData.value = data
  editingStart.value = false

  announce(`Schema gestart. Eerste melding: ${data.schedule[0]?.label} om ${formatTime(data.schedule[0]?.scheduledAt)}.`)
}

async function confirm(moment) {
  const data = await confirmMoment(currentKey.value, moment.id)
  if (data) {
    if (activeTab.value === 'today') todayData.value = data
    else tomorrowData.value = data

    const next = getNextPending(data.schedule)
    if (next) {
      announce(`${moment.label} bevestigd. Volgende melding: ${next.label} om ${formatTime(next.scheduledAt)}.`)
    } else {
      announce(`${moment.label} bevestigd. Geen verdere meldingen voor vandaag.`)
    }
  }
}

// Verplaats focus naar tijdveld als editing-formulier verschijnt
watch(editingStart, async (val) => {
  if (val) {
    await nextTick()
    timeInputRef.value?.focus()
  }
})

onMounted(async () => {
  clockTimer = setInterval(() => { now.value = Date.now() }, 1000)

  dateKeys.value     = await getDateKeys()
  todayData.value    = await syncDay(dateKeys.value.today)
  tomorrowData.value = await syncDay(dateKeys.value.tomorrow)

  onNotificationClicked(async (momentId) => {
    const data = await confirmMoment(dateKeys.value.today, momentId)
    if (data) todayData.value = data
  })
})

onUnmounted(() => { clearInterval(clockTimer) })

watch(activeTab, () => { editingStart.value = false })
</script>
