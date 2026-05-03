<template>
  <div
    v-if="update"
    role="alert"
    aria-live="assertive"
    class="bg-gray-900 border border-gray-700 rounded-2xl p-4 flex flex-col gap-3"
  >
    <!-- Header -->
    <div class="flex items-start justify-between gap-2">
      <div>
        <p class="text-sm font-semibold text-white">
          Versie {{ update.version }} beschikbaar
        </p>
        <p class="text-xs text-gray-400 mt-0.5">
          {{ update.manual ? 'Download vereist' : statusLabel }}
        </p>
      </div>
      <button
        @click="dismiss"
        aria-label="Update-melding sluiten"
        class="text-gray-500 hover:text-gray-300 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
      >
        ✕
      </button>
    </div>

    <!-- Changelog -->
    <div
      v-if="update.changelog"
      class="text-xs text-gray-400 bg-gray-800 rounded-xl p-3 max-h-32 overflow-y-auto whitespace-pre-wrap leading-relaxed"
      aria-label="Wijzigingen in deze versie"
    >{{ update.changelog }}</div>

    <!-- Voortgangsbalk (alleen bij automatisch downloaden) -->
    <div v-if="progress !== null && !update.manual" aria-label="Downloadvoortgang">
      <div class="flex justify-between text-xs text-gray-400 mb-1">
        <span>Downloaden...</span>
        <span aria-live="polite">{{ progress }}%</span>
      </div>
      <div class="w-full bg-gray-700 rounded-full h-1.5" role="progressbar" :aria-valuenow="progress" aria-valuemin="0" aria-valuemax="100">
        <div
          class="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
          :style="{ width: progress + '%' }"
        ></div>
      </div>
    </div>

    <!-- Actieknop -->
    <button
      v-if="update.manual"
      @click="openDownload"
      class="w-full bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold py-2.5 rounded-xl transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
    >
      Downloaden via GitHub
    </button>
    <button
      v-else-if="ready"
      @click="install"
      class="w-full bg-green-600 hover:bg-green-500 text-white text-sm font-semibold py-2.5 rounded-xl transition focus:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
      aria-label="Update installeren en app herstarten"
    >
      Nu installeren &amp; herstarten
    </button>
    <button
      v-else-if="progress === null"
      disabled
      class="w-full bg-gray-700 text-gray-400 text-sm font-semibold py-2.5 rounded-xl opacity-60 cursor-not-allowed"
    >
      Wordt gedownload…
    </button>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const update   = ref(null)   // { version, changelog, manual, downloadUrl? }
const progress = ref(null)   // 0-100 of null (nog niet gestart)
const ready    = ref(false)  // download klaar, kan installeren

const statusLabel = computed(() => {
  if (ready.value) return 'Klaar om te installeren'
  if (progress.value !== null) return `Downloaden — ${progress.value}%`
  return 'Wordt gedownload op de achtergrond'
})

function dismiss() {
  update.value   = null
  progress.value = null
  ready.value    = false
}

async function install() {
  await window.electronAPI?.installUpdate()
}

async function openDownload() {
  await window.electronAPI?.openDownloadUrl(update.value.downloadUrl)
}

onMounted(() => {
  window.electronAPI?.onUpdateAvailable((info) => {
    update.value   = info
    progress.value = info.manual ? null : 0
    ready.value    = false
  })

  window.electronAPI?.onUpdateProgress((info) => {
    progress.value = info.percent
  })

  window.electronAPI?.onUpdateReady(() => {
    progress.value = 100
    ready.value    = true
  })
})
</script>
