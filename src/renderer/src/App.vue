<template>
  <div class="flex flex-col h-screen max-w-sm mx-auto p-4 gap-4">

    <!-- Header -->
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-bold tracking-tight">Ritme Timer</h1>
      <button
        @click="showTomorrow = !showTomorrow"
        class="text-xs text-gray-400 hover:text-gray-200 transition"
      >
        {{ showTomorrow ? 'Vandaag' : 'Morgen instellen' }}
      </button>
    </div>

    <!-- Dag selector tabs -->
    <div class="flex gap-2 text-sm">
      <button
        v-for="tab in ['today', 'tomorrow']"
        :key="tab"
        @click="activeTab = tab"
        :class="[
          'flex-1 py-1.5 rounded-lg font-medium transition',
          activeTab === tab
            ? 'bg-gray-700 text-white'
            : 'text-gray-500 hover:text-gray-300'
        ]"
      >
        {{ tab === 'today' ? 'Vandaag' : 'Morgen' }}
      </button>
    </div>

    <!-- Begintijd instellen -->
    <div
      v-if="!currentDay || editingStart"
      class="bg-gray-900 rounded-2xl p-4 flex flex-col gap-3"
    >
      <p class="text-sm text-gray-400">
        {{ activeTab === 'today' ? 'Wanneer wil je vandaag beginnen?' : 'Wanneer begin je morgen?' }}
      </p>
      <input
        v-model="startTimeInput"
        type="time"
        class="bg-gray-800 text-white rounded-xl px-4 py-3 text-center text-2xl font-mono border border-gray-700 focus:outline-none focus:border-blue-500"
      />
      <button
        @click="applyStartTime"
        :disabled="!startTimeInput"
        class="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-semibold py-3 rounded-xl transition"
      >
        Schema starten
      </button>
    </div>

    <!-- Schema weergave -->
    <div v-if="currentDay && !editingStart" class="flex flex-col gap-2 flex-1 overflow-y-auto">

      <!-- Huidige/volgende melding -->
      <div v-if="nextPending" class="bg-gray-900 rounded-2xl p-4">
        <p class="text-xs text-gray-500 mb-1">Volgende melding</p>
        <div class="flex items-center gap-3">
          <span class="text-2xl">{{ nextPending.type === 'water' ? '💧' : '🍽️' }}</span>
          <div>
            <p class="font-semibold">{{ nextPending.label }}</p>
            <p class="text-sm text-gray-400">{{ formatTime(nextPending.scheduledAt) }}</p>
          </div>
          <button
            @click="confirm(nextPending)"
            class="ml-auto bg-green-600 hover:bg-green-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition"
          >
            Bevestig
          </button>
        </div>
      </div>

      <!-- Volledige tijdlijn -->
      <div class="bg-gray-900 rounded-2xl p-4 flex flex-col gap-2">
        <div class="flex items-center justify-between mb-1">
          <p class="text-xs text-gray-500">Schema</p>
          <button @click="editingStart = true" class="text-xs text-gray-500 hover:text-gray-300">
            Wijzig begintijd
          </button>
        </div>

        <div
          v-for="moment in currentDay.schedule"
          :key="moment.id"
          :class="[
            'flex items-center gap-3 py-2 px-3 rounded-xl transition',
            moment.status === 'done'   ? 'opacity-40' : '',
            moment.status === 'missed' ? 'opacity-30 line-through' : '',
            moment.id === nextPending?.id ? 'bg-gray-800' : ''
          ]"
        >
          <span class="text-lg w-6 text-center">
            {{ moment.type === 'water' ? '💧' : '🍽️' }}
          </span>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium truncate">{{ moment.label }}</p>
            <p class="text-xs text-gray-500">{{ formatTime(moment.scheduledAt) }}</p>
          </div>
          <span v-if="moment.status === 'done'" class="text-green-500 text-xs">✓</span>
          <span v-if="moment.status === 'missed'" class="text-red-500 text-xs">Gemist</span>
          <button
            v-if="moment.status === 'pending' && moment.id !== nextPending?.id"
            @click="confirm(moment)"
            class="text-xs text-gray-500 hover:text-green-400 transition"
          >
            Bevestig
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { getDateKeys, setStartTime, confirmMoment, syncDay, onNotificationClicked } from './services/api.js'
import { getNextPending } from './utils/schema-engine-web.js'

const dateKeys   = ref({ today: '', tomorrow: '' })
const activeTab  = ref('today')
const todayData  = ref(null)
const tomorrowData = ref(null)
const editingStart = ref(false)
const startTimeInput = ref('')

const currentDay = computed(() => activeTab.value === 'today' ? todayData.value : tomorrowData.value)
const currentKey = computed(() => activeTab.value === 'today' ? dateKeys.value.today : dateKeys.value.tomorrow)

const nextPending = computed(() => {
  if (!todayData.value) return null
  return getNextPending(todayData.value.schedule)
})

function formatTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })
}

async function applyStartTime() {
  if (!startTimeInput.value) return

  const [hours, minutes] = startTimeInput.value.split(':').map(Number)
  const base = activeTab.value === 'today' ? new Date() : (() => { const d = new Date(); d.setDate(d.getDate() + 1); return d })()
  base.setHours(hours, minutes, 0, 0)

  const data = await setStartTime(currentKey.value, base.getTime())
  if (activeTab.value === 'today') todayData.value = data
  else tomorrowData.value = data
  editingStart.value = false
}

async function confirm(moment) {
  const data = await confirmMoment(dateKeys.value.today, moment.id)
  if (data) todayData.value = data
}

onMounted(async () => {
  dateKeys.value = await getDateKeys()
  todayData.value    = await syncDay(dateKeys.value.today)
  tomorrowData.value = await syncDay(dateKeys.value.tomorrow)

  onNotificationClicked(async (momentId) => {
    const data = await confirmMoment(dateKeys.value.today, momentId)
    if (data) todayData.value = data
  })
})

watch(activeTab, () => { editingStart.value = false })
</script>
