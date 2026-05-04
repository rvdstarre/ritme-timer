import { createApp } from 'vue'
import App from './App.vue'
import './style.css'
import * as Sentry from '@sentry/capacitor'
import { vueIntegration } from '@sentry/vue'
import { consoleLoggingIntegration } from '@sentry/core'

const app = createApp(App)

Sentry.init({
  dsn: 'https://815b9bebeb5a505c53e0029a9580fae3@o4511330516664320.ingest.de.sentry.io/4511330529247312',
  release: 'ritme-timer@0.4.0',
  environment: import.meta.env.MODE,
  enableLogs: true,
  integrations: [
    vueIntegration({ app }),
    Sentry.browserTracingIntegration(),
    consoleLoggingIntegration()
  ],
  tracesSampleRate: 0.2
})

app.mount('#app')
