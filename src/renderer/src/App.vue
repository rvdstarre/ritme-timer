<template>
  <div class="flex flex-col h-screen max-w-sm mx-auto p-4 gap-4">

    <!-- Skip-link voor toetsenbordgebruikers -->
    <a href="#hoofdinhoud" class="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-blue-600 focus:text-white focus:px-3 focus:py-1 focus:rounded">
      Ga naar hoofdinhoud
    </a>

    <!-- Header -->
    <header class="flex items-center justify-between">
      <h1 class="text-xl font-bold tracking-tight">Ritme Timer</h1>
      <span class="text-xs text-gray-600">v{{ appVersion }}</span>
    </header>

    <!-- Update beschikbaar -->
    <UpdateBanner />

    <!-- Tabs -->
    <div role="tablist" aria-label="Navigatie" class="flex gap-1 text-sm bg-gray-900 rounded-xl p-1">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        role="tab"
        :aria-selected="activeTab === tab.id"
        :tabindex="activeTab === tab.id ? 0 : -1"
        @click="activeTab = tab.id"
        @keydown.right.prevent="navigateTab(1)"
        @keydown.left.prevent="navigateTab(-1)"
        :class="[
          'flex-1 py-1.5 rounded-lg font-medium transition text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
          activeTab === tab.id
            ? 'bg-gray-700 text-white'
            : 'text-gray-400 hover:text-gray-200'
        ]"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Aria-live regio voor schema-updates -->
    <div aria-live="polite" aria-atomic="false" class="sr-only" ref="liveRegion"></div>

    <!-- ===== TAB: Overzicht (vandaag, simpel) ===== -->
    <main
      v-if="activeTab === 'overzicht'"
      id="hoofdinhoud"
      role="tabpanel"
      aria-label="Overzicht vandaag"
      class="flex flex-col gap-3 flex-1 overflow-y-auto"
    >
      <!-- Begintijd instellen -->
      <section
        v-if="!todayData || editingStart"
        aria-label="Begintijd instellen"
        class="bg-gray-900 rounded-2xl p-4 flex flex-col gap-3"
      >
        <label for="start-time-today" class="text-sm text-gray-300">
          Wanneer wil je vandaag beginnen?
        </label>
        <div class="flex gap-2">
          <input
            id="start-time-today"
            ref="timeInputRef"
            v-model="startTimeInput"
            type="time"
            aria-label="Begintijd vandaag"
            class="flex-1 bg-gray-800 text-white rounded-xl px-4 py-3 text-center text-2xl font-mono border border-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500"
          />
          <button
            @click="startNow"
            aria-label="Schema starten vanaf het huidige tijdstip"
            class="shrink-0 bg-gray-700 hover:bg-gray-600 text-white font-semibold px-4 rounded-xl transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          >
            Nu
          </button>
        </div>
        <button
          @click="applyStartTime('today')"
          :disabled="!startTimeInput"
          :aria-disabled="!startTimeInput"
          class="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-semibold py-3 rounded-xl transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
        >
          Schema starten
        </button>
      </section>

      <!-- Eenvoudig overzicht: water + eten als aparte kaarten -->
      <template v-if="todayData && !editingStart">

        <!-- Water kaart -->
        <section
          aria-label="Water"
          class="bg-gray-900 rounded-2xl p-4 border-l-4 border-water flex flex-col gap-3"
        >
          <div class="flex items-center gap-2">
            <span aria-hidden="true" class="text-lg">💧</span>
            <h2 class="font-semibold text-white text-base">Water</h2>
            <span
              class="ml-auto text-xs text-gray-400"
              :aria-label="`${waterDone} van ${waterTotal} watermomenten gedaan`"
            >
              {{ waterDone }}/{{ waterTotal }}
            </span>
          </div>

          <div v-if="nextPendingWater" class="flex flex-col gap-1">
            <p class="text-sm text-gray-300">{{ nextPendingWater.label }}</p>
            <p class="text-xs text-gray-500" aria-hidden="true">{{ formatTime(nextPendingWater.scheduledAt) }}</p>
            <p
              :class="[
                'text-3xl font-mono font-bold tabular-nums mt-1',
                countdownWater?.urgent ? 'text-orange-400' : 'text-water'
              ]"
              :aria-label="countdownWater?.ariaText"
            >
              {{ countdownWater?.text }}
            </p>
          </div>
          <p v-else class="text-sm text-green-400">Alle watermomenten gedaan voor vandaag</p>

          <button
            v-if="nextPendingWater"
            @click="confirm(nextPendingWater)"
            :aria-label="`Bevestig water gedronken: ${nextPendingWater.label}, ${countdownWater?.ariaText}`"
            class="w-full py-3 rounded-xl bg-water/20 hover:bg-water/30 text-water font-semibold text-base transition focus:outline-none focus-visible:ring-2 focus-visible:ring-water"
          >
            Gedronken
          </button>
        </section>

        <!-- Eten kaart -->
        <section
          aria-label="Eten"
          class="bg-gray-900 rounded-2xl p-4 border-l-4 border-food flex flex-col gap-3"
        >
          <div class="flex items-center gap-2">
            <span aria-hidden="true" class="text-lg">🍽️</span>
            <h2 class="font-semibold text-white text-base">Eten</h2>
            <span
              class="ml-auto text-xs text-gray-400"
              :aria-label="`${foodDone} van ${foodTotal} maaltijden gedaan`"
            >
              {{ foodDone }}/{{ foodTotal }}
            </span>
          </div>

          <div v-if="nextPendingFood" class="flex flex-col gap-1">
            <p class="text-sm text-gray-300">{{ nextPendingFood.label }}</p>
            <p class="text-xs text-gray-500" aria-hidden="true">{{ formatTime(nextPendingFood.scheduledAt) }}</p>
            <p
              :class="[
                'text-3xl font-mono font-bold tabular-nums mt-1',
                countdownFood?.urgent ? 'text-orange-400' : 'text-food'
              ]"
              :aria-label="countdownFood?.ariaText"
            >
              {{ countdownFood?.text }}
            </p>
          </div>
          <p v-else class="text-sm text-green-400">Alle maaltijden gedaan voor vandaag</p>

          <button
            v-if="nextPendingFood"
            @click="confirm(nextPendingFood)"
            :aria-label="`Bevestig gegeten: ${nextPendingFood.label}, ${countdownFood?.ariaText}`"
            class="w-full py-3 rounded-xl bg-food/20 hover:bg-food/30 text-food font-semibold text-base transition focus:outline-none focus-visible:ring-2 focus-visible:ring-food"
          >
            Gegeten
          </button>
        </section>

        <button
          @click="editingStart = true"
          class="text-xs text-gray-500 hover:text-gray-300 transition self-center focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded px-2 py-1"
        >
          Begintijd wijzigen
        </button>

      </template>
    </main>

    <!-- ===== TAB: Schema (vandaag, gedetailleerd) ===== -->
    <main
      v-if="activeTab === 'schema'"
      role="tabpanel"
      aria-label="Schema vandaag"
      class="flex flex-col gap-3 flex-1 overflow-y-auto"
    >
      <div v-if="!todayData" class="text-sm text-gray-400 text-center py-8">
        Stel eerst een begintijd in via het tabblad "Overzicht".
      </div>
      <template v-else>
        <div class="flex justify-end">
          <button
            @click="activeTab = 'overzicht'; editingStart = true"
            class="text-xs text-gray-400 hover:text-gray-200 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded px-1"
          >
            Wijzig begintijd
          </button>
        </div>

        <!-- Voortgang -->
        <section aria-label="Voortgang vandaag" class="bg-gray-900 rounded-2xl px-4 py-3 flex flex-col gap-2.5">
          <div class="flex items-center gap-3">
            <span aria-hidden="true" class="text-base w-5 text-center shrink-0">🍽️</span>
            <div class="flex-1">
              <div class="flex justify-between text-xs text-gray-400 mb-1">
                <span>Gegeten</span>
                <span :aria-label="`${foodDone} van ${foodTotal} maaltijden`">{{ foodDone }}/{{ foodTotal }}</span>
              </div>
              <div
                class="h-1.5 bg-gray-700 rounded-full overflow-hidden"
                role="progressbar"
                :aria-valuenow="foodDone"
                :aria-valuemin="0"
                :aria-valuemax="foodTotal"
                :aria-label="`Eten: ${foodDone} van ${foodTotal} gedaan`"
              >
                <div class="h-full bg-food rounded-full transition-all duration-500" :style="{ width: foodPercent + '%' }"></div>
              </div>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <span aria-hidden="true" class="text-base w-5 text-center shrink-0">💧</span>
            <div class="flex-1">
              <div class="flex justify-between text-xs text-gray-400 mb-1">
                <span>Gedronken</span>
                <span :aria-label="`${waterDone} van ${waterTotal} watermomenten`">{{ waterDone }}/{{ waterTotal }}</span>
              </div>
              <div
                class="h-1.5 bg-gray-700 rounded-full overflow-hidden"
                role="progressbar"
                :aria-valuenow="waterDone"
                :aria-valuemin="0"
                :aria-valuemax="waterTotal"
                :aria-label="`Water: ${waterDone} van ${waterTotal} gedaan`"
              >
                <div class="h-full bg-water rounded-full transition-all duration-500" :style="{ width: waterPercent + '%' }"></div>
              </div>
            </div>
          </div>
        </section>

        <!-- Tijdlijn gegroepeerd -->
        <section aria-label="Dagschema" class="bg-gray-900 rounded-2xl p-4">
          <div class="flex flex-col gap-2">
            <div
              v-for="(group, gi) in groupedScheduleToday"
              :key="gi"
              class="bg-gray-800/50 rounded-xl px-3 py-2"
            >
              <!-- Ingeklapt -->
              <button
                v-if="isGroupDone(group) && !isExpanded(gi)"
                @click="expandGroup(gi)"
                :aria-label="`${groupSummary(group)} — uitklappen`"
                aria-expanded="false"
                class="w-full flex items-center gap-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg"
              >
                <span aria-hidden="true" class="text-sm w-8 h-8 flex items-center justify-center rounded-full bg-green-900/40 shrink-0 text-green-500">✓</span>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-400 truncate">{{ groupMealLabel(group) }}</p>
                  <p class="text-xs text-gray-600">{{ groupTimeRange(group) }}</p>
                </div>
                <span aria-hidden="true" class="text-gray-600 text-xs shrink-0">›</span>
              </button>

              <!-- Uitgeklapt -->
              <div v-else>
                <div v-if="isGroupDone(group) && isExpanded(gi)" class="flex justify-end mb-1">
                  <button
                    @click="collapseGroup(gi)"
                    aria-label="Cluster inklappen"
                    aria-expanded="true"
                    class="text-xs text-gray-600 hover:text-gray-400 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
                  >
                    Inklappen
                  </button>
                </div>
                <ul class="flex flex-col">
                  <li
                    v-for="(moment, index) in group"
                    :key="moment.id"
                    class="flex gap-3"
                    :aria-label="momentAriaLabel(moment)"
                  >
                    <div class="flex flex-col items-center w-8 shrink-0">
                      <span
                        aria-hidden="true"
                        :class="[
                          'text-sm w-8 h-8 flex items-center justify-center rounded-full shrink-0 transition',
                          moment.type === 'water' ? 'bg-water/15' : 'bg-food/15',
                          moment.status === 'done' || moment.status === 'missed' ? 'opacity-30' : '',
                          moment.id === nextPending?.id
                            ? (moment.type === 'water'
                                ? 'ring-2 ring-water ring-offset-2 ring-offset-gray-800'
                                : 'ring-2 ring-food ring-offset-2 ring-offset-gray-800')
                            : ''
                        ]"
                      >
                        {{ moment.type === 'water' ? '💧' : '🍽️' }}
                      </span>
                      <div
                        v-if="index < group.length - 1"
                        :class="['w-0.5 flex-1 mt-1 min-h-4 rounded-full', moment.status === 'done' ? 'bg-gray-600' : 'bg-gray-700']"
                      ></div>
                    </div>
                    <div
                      :class="[
                        'flex-1 flex items-center gap-2 min-w-0 transition',
                        index < group.length - 1 ? 'pb-3' : 'pb-0',
                        moment.status === 'done' || moment.status === 'missed' ? 'opacity-40' : ''
                      ]"
                    >
                      <div class="flex-1 min-w-0">
                        <p :class="['text-sm font-medium truncate', moment.status === 'missed' ? 'line-through' : '']">
                          {{ moment.label }}
                        </p>
                        <p class="text-xs text-gray-400">{{ formatTime(moment.scheduledAt) }}</p>
                      </div>
                      <span v-if="moment.status === 'done'" aria-label="Bevestigd" aria-hidden="true" class="text-green-500 text-xs shrink-0">✓</span>
                      <span v-if="moment.status === 'missed'" class="text-red-400 text-xs shrink-0">Gemist</span>
                      <button
                        v-if="moment.status === 'pending'"
                        @click="confirm(moment)"
                        :aria-label="`Bevestig: ${moment.label} om ${formatTime(moment.scheduledAt)}`"
                        class="text-xs text-gray-400 hover:text-green-400 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 rounded px-1 shrink-0"
                      >
                        Bevestig
                      </button>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </template>
    </main>

    <!-- ===== TAB: Morgen ===== -->
    <main
      v-if="activeTab === 'morgen'"
      role="tabpanel"
      aria-label="Schema morgen"
      class="flex flex-col gap-3 flex-1 overflow-y-auto"
    >
      <!-- Begintijd morgen instellen -->
      <section
        v-if="!tomorrowData || editingStartMorgen"
        aria-label="Begintijd morgen instellen"
        class="bg-gray-900 rounded-2xl p-4 flex flex-col gap-3"
      >
        <label for="start-time-morgen" class="text-sm text-gray-300">
          Wanneer begin je morgen?
        </label>
        <input
          id="start-time-morgen"
          ref="timeInputRef"
          v-model="startTimeInput"
          type="time"
          aria-label="Begintijd morgen"
          class="bg-gray-800 text-white rounded-xl px-4 py-3 text-center text-2xl font-mono border border-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500"
        />
        <button
          @click="applyStartTime('tomorrow')"
          :disabled="!startTimeInput"
          :aria-disabled="!startTimeInput"
          class="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-semibold py-3 rounded-xl transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
        >
          Schema instellen
        </button>
      </section>

      <!-- Morgen schema -->
      <template v-if="tomorrowData && !editingStartMorgen">
        <div class="flex justify-end">
          <button
            @click="editingStartMorgen = true"
            class="text-xs text-gray-400 hover:text-gray-200 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded px-1"
          >
            Wijzig begintijd
          </button>
        </div>
        <section aria-label="Schema morgen" class="bg-gray-900 rounded-2xl p-4">
          <div class="flex flex-col gap-2">
            <div
              v-for="(group, gi) in groupedScheduleTomorrow"
              :key="gi"
              class="bg-gray-800/50 rounded-xl px-3 py-2"
            >
              <ul class="flex flex-col">
                <li
                  v-for="(moment, index) in group"
                  :key="moment.id"
                  class="flex gap-3"
                  :aria-label="`${moment.type === 'water' ? 'Water drinken' : 'Eten'}: ${moment.label} om ${formatTime(moment.scheduledAt)}`"
                >
                  <div class="flex flex-col items-center w-8 shrink-0">
                    <span
                      aria-hidden="true"
                      :class="['text-sm w-8 h-8 flex items-center justify-center rounded-full shrink-0', moment.type === 'water' ? 'bg-water/15' : 'bg-food/15']"
                    >
                      {{ moment.type === 'water' ? '💧' : '🍽️' }}
                    </span>
                    <div v-if="index < group.length - 1" class="w-0.5 flex-1 mt-1 min-h-4 rounded-full bg-gray-700"></div>
                  </div>
                  <div :class="['flex-1 flex items-center min-w-0', index < group.length - 1 ? 'pb-3' : 'pb-0']">
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-medium truncate">{{ moment.label }}</p>
                      <p class="text-xs text-gray-400">{{ formatTime(moment.scheduledAt) }}</p>
                    </div>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </section>
      </template>
    </main>

  </div>

  <!-- Kritieke meldingen keuze (eenmalig bij eerste gebruik) -->
  <CriticalAlertsDialog @done="onCriticalAlertsDone" />

</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { getDateKeys, setStartTime, confirmMoment, syncDay, onNotificationClicked, initNotifications } from './services/api.js'
import { getNextPending } from './utils/schema-engine-web.js'
import UpdateBanner from './components/UpdateBanner.vue'
import CriticalAlertsDialog from './components/CriticalAlertsDialog.vue'
import { version as appVersion } from '../../../package.json'

const tabs = [
  { id: 'overzicht', label: 'Overzicht' },
  { id: 'schema',   label: 'Schema' },
  { id: 'morgen',   label: 'Morgen' }
]
const tabIds = tabs.map(t => t.id)

function navigateTab(dir) {
  const idx = tabIds.indexOf(activeTab.value)
  activeTab.value = tabIds[(idx + dir + tabIds.length) % tabIds.length]
}

const dateKeys          = ref({ today: '', tomorrow: '' })
const activeTab         = ref('overzicht')
const todayData         = ref(null)
const tomorrowData      = ref(null)
const editingStart      = ref(false)
const editingStartMorgen = ref(false)
const startTimeInput    = ref('')
const timeInputRef      = ref(null)
const liveRegion        = ref(null)
const now               = ref(Date.now())

let clockTimer = null

// --- Volgende pending per type ---

const nextPending = computed(() => {
  if (!todayData.value) return null
  return getNextPending(todayData.value.schedule)
})

const nextPendingWater = computed(() => {
  if (!todayData.value) return null
  return todayData.value.schedule.find(m => m.type === 'water' && m.status === 'pending') ?? null
})

const nextPendingFood = computed(() => {
  if (!todayData.value) return null
  return todayData.value.schedule.find(m => m.type === 'food' && m.status === 'pending') ?? null
})

// --- Voortgang ---

const foodMoments  = computed(() => todayData.value?.schedule.filter(m => m.type === 'food') ?? [])
const waterMoments = computed(() => todayData.value?.schedule.filter(m => m.type === 'water') ?? [])
const foodDone     = computed(() => foodMoments.value.filter(m => m.status === 'done').length)
const waterDone    = computed(() => waterMoments.value.filter(m => m.status === 'done').length)
const foodTotal    = computed(() => foodMoments.value.length)
const waterTotal   = computed(() => waterMoments.value.length)
const foodPercent  = computed(() => foodTotal.value ? Math.round(foodDone.value / foodTotal.value * 100) : 0)
const waterPercent = computed(() => waterTotal.value ? Math.round(waterDone.value / waterTotal.value * 100) : 0)

// --- Countdowns ---

function buildCountdown(moment) {
  if (!moment) return null
  const diff = moment.scheduledAt - now.value
  if (diff <= 0) return { text: 'Nu!', urgent: true, ariaText: 'Nu' }
  const totalMinutes = Math.ceil(diff / 60000)
  const hours   = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours === 0) return { text: `over ${minutes} min`, urgent: totalMinutes <= 5, ariaText: `over ${minutes} minuten` }
  if (minutes === 0) return { text: `over ${hours}u`, urgent: false, ariaText: `over ${hours} uur` }
  return { text: `over ${hours}u ${minutes}min`, urgent: false, ariaText: `over ${hours} uur en ${minutes} minuten` }
}

const countdownWater = computed(() => buildCountdown(nextPendingWater.value))
const countdownFood  = computed(() => buildCountdown(nextPendingFood.value))

// --- Groepering tijdlijn ---

function buildGroups(schedule) {
  const groups = []
  let i = 0
  while (i < schedule.length) {
    if (schedule[i].type === 'water' && schedule[i + 1]?.type === 'food') {
      const waterAfter = schedule[i + 2]?.type === 'water' ? schedule[i + 2] : null
      groups.push(waterAfter ? [schedule[i], schedule[i + 1], waterAfter] : [schedule[i], schedule[i + 1]])
      i += waterAfter ? 3 : 2
    } else {
      groups.push([schedule[i]])
      i++
    }
  }
  return groups
}

const groupedScheduleToday    = computed(() => todayData.value   ? buildGroups(todayData.value.schedule)    : [])
const groupedScheduleTomorrow = computed(() => tomorrowData.value ? buildGroups(tomorrowData.value.schedule) : [])

// --- Cluster helpers ---

const expandedGroupsSet  = new Set()
const expandedGroupsTick = ref(0)

function isExpanded(gi) {
  // eslint-disable-next-line no-unused-expressions
  expandedGroupsTick.value
  return expandedGroupsSet.has(gi)
}

function expandGroup(gi)   { expandedGroupsSet.add(gi);    expandedGroupsTick.value++ }
function collapseGroup(gi) { expandedGroupsSet.delete(gi); expandedGroupsTick.value++ }

function isGroupDone(group) {
  return group.every(m => m.status === 'done' || m.status === 'missed')
}

function groupMealLabel(group) {
  return group.find(m => m.type === 'food')?.label ?? group[0].label
}

function groupTimeRange(group) {
  const first = formatTime(group[0].scheduledAt)
  const last  = formatTime(group[group.length - 1].scheduledAt)
  return first === last ? first : `${first} – ${last}`
}

function groupSummary(group) {
  const meal   = groupMealLabel(group)
  const range  = groupTimeRange(group)
  const missed = group.filter(m => m.status === 'missed').length
  return missed > 0 ? `${meal} (${missed} gemist), ${range}` : `${meal}, ${range}`
}

// --- Hulpfuncties ---

function formatTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })
}

function momentAriaLabel(moment) {
  const type   = moment.type === 'water' ? 'Water drinken' : 'Eten'
  const time   = formatTime(moment.scheduledAt)
  const status = moment.status === 'done' ? ', bevestigd' : moment.status === 'missed' ? ', gemist' : ''
  return `${type}: ${moment.label} om ${time}${status}`
}

function announce(message) {
  if (liveRegion.value) liveRegion.value.textContent = message
}

function startNow() {
  const d = new Date()
  startTimeInput.value = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  applyStartTime('today')
}

async function applyStartTime(day) {
  if (!startTimeInput.value) return

  const [hours, minutes] = startTimeInput.value.split(':').map(Number)
  const base = day === 'today'
    ? new Date()
    : (() => { const d = new Date(); d.setDate(d.getDate() + 1); return d })()
  base.setHours(hours, minutes, 0, 0)

  const key  = day === 'today' ? dateKeys.value.today : dateKeys.value.tomorrow
  const data = await setStartTime(key, base.getTime())

  if (day === 'today') {
    todayData.value    = data
    editingStart.value = false
  } else {
    tomorrowData.value      = data
    editingStartMorgen.value = false
  }

  announce(`Schema gestart. Eerste melding: ${data.schedule[0]?.label} om ${formatTime(data.schedule[0]?.scheduledAt)}.`)
}

async function confirm(moment) {
  const data = await confirmMoment(dateKeys.value.today, moment.id)
  if (data) {
    todayData.value = data
    const next = getNextPending(data.schedule)
    if (next) {
      announce(`${moment.label} bevestigd. Volgende melding: ${next.label} om ${formatTime(next.scheduledAt)}.`)
    } else {
      announce(`${moment.label} bevestigd. Geen verdere meldingen voor vandaag.`)
    }
  }
}

async function onCriticalAlertsDone(wantsCritical) {
  if (wantsCritical) await initNotifications()
}

// Focus op tijdveld als bewerkformulier verschijnt
watch(editingStart, async (val) => {
  if (val) {
    await nextTick()
    timeInputRef.value?.focus()
  }
})

watch(editingStartMorgen, async (val) => {
  if (val) {
    await nextTick()
    timeInputRef.value?.focus()
  }
})

watch(activeTab, () => {
  editingStart.value      = false
  editingStartMorgen.value = false
})

onMounted(async () => {
  clockTimer = setInterval(() => { now.value = Date.now() }, 1000)

  await initNotifications()
  dateKeys.value     = await getDateKeys()
  todayData.value    = await syncDay(dateKeys.value.today)
  tomorrowData.value = await syncDay(dateKeys.value.tomorrow)

  onNotificationClicked(async (momentId) => {
    const data = await confirmMoment(dateKeys.value.today, momentId)
    if (data) todayData.value = data
  })
})

onUnmounted(() => { clearInterval(clockTimer) })
</script>
