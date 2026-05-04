import { createApp } from 'vue'
import App from './App.vue'
import './style.css'
import * as Sentry from '@sentry/capacitor'
import * as SentryVue from '@sentry/vue'

const app = createApp(App)

Sentry.init(
  {
    app,
    dsn: 'https://815b9bebeb5a505c53e0029a9580fae3@o4511330516664320.ingest.de.sentry.io/4511330529247312',
    release: 'ritme-timer@0.4.0',
    environment: import.meta.env.MODE,
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: 0.2
  },
  SentryVue.init
)

app.mount('#app')
