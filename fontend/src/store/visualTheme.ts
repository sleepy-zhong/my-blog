import { defineStore } from 'pinia'
import { defaultThemeId, isThemeId, ThemeId } from '@/theme/visualTheme'

const THEME_STORAGE_KEY = 'visual_theme'

function readInitialTheme(): ThemeId {
  if (typeof window === 'undefined') {
    return defaultThemeId
  }

  const cached = window.localStorage.getItem(THEME_STORAGE_KEY)
  return isThemeId(cached) ? cached : defaultThemeId
}

export const useVisualThemeStore = defineStore('visual-theme', {
  state: () => ({
    activeTheme: readInitialTheme() as ThemeId
  }),
  actions: {
    setTheme(theme: ThemeId) {
      this.activeTheme = theme
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(THEME_STORAGE_KEY, theme)
      }
      this.syncDocumentTheme()
    },
    syncDocumentTheme() {
      if (typeof document === 'undefined') return
      document.documentElement.dataset.visualTheme = this.activeTheme
      document.documentElement.style.colorScheme = 'dark'
    }
  }
})
