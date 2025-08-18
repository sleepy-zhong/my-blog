// src/store/user.ts
import { defineStore as definePiniaStore } from 'pinia'
import { getCurrentUser } from '../api/user'

interface UserInfo {
  UserID: number
  Username: string
  Roles: string[]
  // 其他字段
}

const USER_CACHE_KEY = 'user_cache'
const USER_CACHE_EXPIRE_KEY = 'user_cache_expire'
const CACHE_DURATION = 168 * 60 * 60 * 1000 // 7天

export const useUserStore = definePiniaStore('user', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    user: null as UserInfo | null,
    loading: false,
  }),
  actions: {
    setToken(token: string) {
      // 登录新用户时，清除旧用户信息和缓存
      this.token = token
      this.user = null
      localStorage.setItem('token', token)
      localStorage.removeItem(USER_CACHE_KEY)
      localStorage.removeItem(USER_CACHE_EXPIRE_KEY)
    },
    clearToken() {
      this.token = ''
      localStorage.removeItem('token')
      this.user = null
      localStorage.removeItem(USER_CACHE_KEY)
      localStorage.removeItem(USER_CACHE_EXPIRE_KEY)
    },
    async fetchUser(force = false) {
      if (!this.token) {
        this.user = null
        localStorage.removeItem(USER_CACHE_KEY)
        localStorage.removeItem(USER_CACHE_EXPIRE_KEY)
        return
      }
      // 检查缓存
      const cacheStr = localStorage.getItem(USER_CACHE_KEY)
      const expireStr = localStorage.getItem(USER_CACHE_EXPIRE_KEY)
      const now = Date.now()
      if (!force && cacheStr && expireStr && now < Number(expireStr)) {
        try {
          this.user = JSON.parse(cacheStr)
          return
        } catch {
          // 缓存损坏，继续请求
        }
      }
      this.loading = true
      try {
        const res = await getCurrentUser()
        let user = res.data || res
        if (user.data) user = user.data // 兼容 {code, data: {...}}
        if (Array.isArray(user.Roles) && user.Roles.length && typeof user.Roles[0] === 'object') {
          user.Roles = user.Roles.map((r: any) => r.Name)
        }
        this.user = user
        // 写入缓存
        localStorage.setItem(USER_CACHE_KEY, JSON.stringify(user))
        localStorage.setItem(USER_CACHE_EXPIRE_KEY, (now + CACHE_DURATION).toString())
      } catch {
        this.user = null
        localStorage.removeItem(USER_CACHE_KEY)
        localStorage.removeItem(USER_CACHE_EXPIRE_KEY)
      } finally {
        this.loading = false
      }
    },
    logout() {
      this.clearToken()
    }
  },
  getters: {
    isLogin: (state) => !!state.token && !!state.user,
    username: (state) => state.user?.Username || '',
    roles: (state) => state.user?.Roles || [],
  }
})

// 全局 loading 状态
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

// 全局消息（如全局提示、错误提示）
export const useMessageStore = definePiniaStore('message', {
  state: () => ({
    message: '' as string,
    type: '' as 'success' | 'error' | 'info' | '',
    visible: false as boolean,
  }),
  actions: {
    show(msg: string, type: 'success' | 'error' | 'info' = 'info') {
      this.message = msg
      this.type = type
      this.visible = true
    },
    hide() {
      this.visible = false
      this.message = ''
      this.type = ''
    },
  },
})

// 全局主题（theme）
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

// 全局设置（settings）
export const useSettingsStore = definePiniaStore('settings', {
  state: () => ({
    siteName: 'MyBlog',
    logo: '',
    // 其他全局设置
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
