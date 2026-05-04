<template>
  <div
    v-if="visible"
    role="dialog"
    aria-modal="true"
    aria-labelledby="dialog-title"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
  >
    <div class="bg-gray-900 rounded-2xl p-5 max-w-sm w-full flex flex-col gap-4 border border-gray-700">
      <div>
        <p id="dialog-title" class="font-bold text-white text-base">Kritieke meldingen</p>
        <p class="text-sm text-gray-400 mt-1.5 leading-relaxed">
          Wil je meldingen ontvangen ook als je telefoon op <strong class="text-white">Niet storen</strong> staat?
          Handig als je het ritme ook tijdens vergaderingen wil volgen.
        </p>
      </div>

      <div class="bg-gray-800 rounded-xl p-3 text-xs text-gray-400 leading-relaxed">
        Bij <strong class="text-white">Ja</strong> word je straks gevraagd dit toe te staan via de systeeminstellingen.
        Je kunt dit later altijd wijzigen via <em>Instellingen → Apps → Ritme Timer → Niet storen toegang</em>.
      </div>

      <div class="flex gap-2">
        <button
          @click="choose(false)"
          class="flex-1 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-sm font-semibold text-gray-300 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          Nee, gewone meldingen
        </button>
        <button
          @click="choose(true)"
          class="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm font-semibold text-white transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
        >
          Ja, ook bij Niet storen
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Preferences } from '@capacitor/preferences'

const emit  = defineEmits(['done'])
const visible = ref(false)

onMounted(async () => {
  const { value } = await Preferences.get({ key: 'criticalAlertsChosen' })
  if (!value) visible.value = true
})

async function choose(wantsCritical) {
  await Preferences.set({ key: 'criticalAlertsChosen', value: 'true' })
  await Preferences.set({ key: 'criticalAlertsEnabled', value: String(wantsCritical) })
  visible.value = false
  emit('done', wantsCritical)
}
</script>
