import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createI18n } from 'vue-i18n'
import App from './App.vue'
import router from './router'
import './index.css'
import StatusButton from './components/StatusButton.vue'
import messages from './i18n/index'
import { useSettingsStore } from './store/user'
import { applySiteBranding, bindSiteBrandingEvents } from './utils/siteBranding'

const i18n = createI18n({
  legacy: false,
  locale: 'zh',
  fallbackLocale: 'en',
  messages,
})

const app = createApp(App)
app.use(createPinia())
app.component('StatusButton', StatusButton)
app.use(router)
app.use(i18n)

bindSiteBrandingEvents()

app.mount('#app')

const settingsStore = useSettingsStore()

settingsStore.fetchPublicSettings()
  .then((payload) => {
    applySiteBranding(payload)
  })
  .catch((error) => {
    console.error('[main.ts] 获取公开站点设置失败:', error)
  })
