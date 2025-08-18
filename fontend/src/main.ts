import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './index.css'
import { createPinia } from 'pinia'
import StatusButton from './components/StatusButton.vue'
import { createI18n } from 'vue-i18n'
import messages from './i18n/index'

const i18n = createI18n({
  legacy: false,
  locale: 'zh',
  fallbackLocale: 'en',
  messages
})

const app = createApp(App)
app.use(createPinia())
app.component('StatusButton', StatusButton)
app.use(router)
app.use(i18n)
app.mount('#app') 