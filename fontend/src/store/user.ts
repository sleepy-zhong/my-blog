import { defineStore as definePiniaStore } from 'pinia'
import { getCurrentUser, logout as logoutApi } from '../api/user'

export const AUTH_EXPIRED_EVENT = 'app:auth-expired'

let messageTimer: ReturnType<typeof setTimeout> | null = null

interface UserInfo {
  UserID: number
  Username: string
  DisplayName?: string
  Roles?: string[]
  AvatarURL?: string
  Email?: string
  PhoneNumber?: string
  Bio?: string
}

const USER_CACHE_KEY = 'user_cache'
const USER_CACHE_EXPIRE_KEY = 'user_cache_expire'
const CACHE_DURATION = 168 * 60 * 60 * 1000

function clearUserCache() {
  localStorage.removeItem(USER_CACHE_KEY)
  localStorage.removeItem(USER_CACHE_EXPIRE_KEY)
}

function normalizeUser(user: UserInfo | null) {
  if (!user) return null

  if (Array.isArray(user.Roles) && user.Roles.length && typeof user.Roles[0] === 'object') {
    user.Roles = user.Roles.map((role: any) => role?.Name).filter(Boolean)
  }

  return user
}

export const useUserStore = definePiniaStore('user', {
  state: () => ({
    token: '',
    user: null as UserInfo | null,
    loading: false,
    sessionReady: false,
  }),
  actions: {
    setToken(_token: string) {
      // 兼容旧调用，新的登录态由 HttpOnly Cookie 维护。
      this.token = 'cookie-session'
      this.sessionReady = false
      this.user = null
      clearUserCache()
    },
    clearToken() {
      this.token = ''
      this.user = null
      this.sessionReady = true
      clearUserCache()
    },
    async fetchUser(force = false) {
      if (!force && this.sessionReady) {
        return this.user
      }

      this.loading = true
      try {
        const res = await getCurrentUser()
        const user = normalizeUser((res?.data || res) as UserInfo)
        const now = Date.now()

        this.user = user
        this.token = user ? 'cookie-session' : ''
        this.sessionReady = true

        if (user) {
          localStorage.setItem(USER_CACHE_KEY, JSON.stringify(user))
          localStorage.setItem(USER_CACHE_EXPIRE_KEY, String(now + CACHE_DURATION))
        } else {
          clearUserCache()
        }

        return this.user
      } catch (error) {
        this.user = null
        this.token = ''
        this.sessionReady = true
        clearUserCache()
        throw error
      } finally {
        this.loading = false
      }
    },
    async hydrateFromCache() {
      const cacheStr = localStorage.getItem(USER_CACHE_KEY)
      const expireStr = localStorage.getItem(USER_CACHE_EXPIRE_KEY)
      const now = Date.now()

      if (!cacheStr || !expireStr || now >= Number(expireStr)) {
        clearUserCache()
        return null
      }

      try {
        const cachedUser = normalizeUser(JSON.parse(cacheStr))
        this.user = cachedUser
        this.token = cachedUser ? 'cookie-session' : ''
        return this.user
      } catch {
        clearUserCache()
        return null
      }
    },
    async initSession(force = false) {
      if (force) {
        return this.fetchUser(true)
      }

      if (this.sessionReady) {
        return this.user
      }

      return this.fetchUser()
    },
    async logout() {
      try {
        await logoutApi()
      } catch {
        // 即使后端退出失败，也要清理本地状态。
      } finally {
        this.clearToken()
      }
    },
  },
  getters: {
    isLogin: (state) => !!state.user,
    username: (state) => state.user?.Username || '',
    roles: (state) => state.user?.Roles || [],
  },
})

export const useLoadingStore = definePiniaStore('loading', {
  state: () => ({
    loading: false as boolean,
    loadingText: '' as string,
  }),
  actions: {
    show(text = '加载中...') {
      this.loading = true
      this.loadingText = text
    },
    hide() {
      this.loading = false
      this.loadingText = ''
    },
  },
})

export const useMessageStore = definePiniaStore('message', {
  state: () => ({
    message: '' as string,
    type: '' as 'success' | 'error' | 'info' | '',
    visible: false as boolean,
  }),
  actions: {
    show(msg: string, type: 'success' | 'error' | 'info' = 'info', duration = 3000) {
      if (messageTimer) {
        clearTimeout(messageTimer)
        messageTimer = null
      }
      this.message = msg
      this.type = type
      this.visible = true

      if (duration > 0) {
        messageTimer = setTimeout(() => {
          this.hide()
        }, duration)
      }
    },
    hide() {
      if (messageTimer) {
        clearTimeout(messageTimer)
        messageTimer = null
      }
      this.visible = false
      this.message = ''
      this.type = ''
    },
  },
})

export const useThemeStore = definePiniaStore('theme', {
  state: () => ({
    dark: false as boolean,
  }),
  actions: {
    toggle() {
      this.dark = !this.dark
      document.documentElement.classList.toggle('dark', this.dark)
    },
    setDark(val: boolean) {
      this.dark = val
      document.documentElement.classList.toggle('dark', val)
    },
  },
})

export const useSettingsStore = definePiniaStore('settings', {
  state: () => ({
    siteName: 'MyBlog',
    logo: '',
  }),
  actions: {
    setSiteName(name: string) {
      this.siteName = name
    },
    setLogo(logo: string) {
      this.logo = logo
    },
  },
})
