import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'
import { AUTH_EXPIRED_EVENT } from '@/store/user'

const apiBaseURL = import.meta?.env?.VITE_API_BASE_URL || '/'

const instance = axios.create({
  baseURL: apiBaseURL,
  timeout: 15000,
  withCredentials: true,
})

const refreshClient = axios.create({
  baseURL: apiBaseURL,
  timeout: 15000,
  withCredentials: true,
})

type RetryableConfig = InternalAxiosRequestConfig & {
  _retry?: boolean
}

const SKIP_REFRESH_PATHS = [
  '/api/users/login',
  '/api/users/login/code',
  '/api/users/register',
  '/api/users/register/code',
  '/api/users/refresh',
  '/api/users/forgot-password',
  '/api/users/forgot-password/code',
]

let refreshPromise: Promise<unknown> | null = null

function clearLocalAuthCache() {
  localStorage.removeItem('user_cache')
  localStorage.removeItem('user_cache_expire')
}

function notifyAuthExpired() {
  clearLocalAuthCache()

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT))
  }
}

function normalizeRequestPath(url?: string) {
  if (!url) return ''

  try {
    const absolute = new URL(url, window.location.origin)
    return absolute.pathname
  } catch {
    return String(url)
  }
}

function shouldSkipRefresh(url?: string) {
  const path = normalizeRequestPath(url)
  return SKIP_REFRESH_PATHS.some(prefix => path.startsWith(prefix))
}

async function refreshSessionOnce() {
  if (!refreshPromise) {
    refreshPromise = refreshClient.post('/api/users/refresh')
      .finally(() => {
        refreshPromise = null
      })
  }

  return refreshPromise
}

instance.interceptors.response.use(
  response => response.data,
  async (error: AxiosError) => {
    const status = error.response?.status
    const originalRequest = error.config as RetryableConfig | undefined

    if (
      status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !shouldSkipRefresh(originalRequest.url)
    ) {
      originalRequest._retry = true

      try {
        await refreshSessionOnce()
        return instance(originalRequest)
      } catch (refreshError) {
        notifyAuthExpired()
        return Promise.reject(refreshError)
      }
    }

    if (status === 401) {
      notifyAuthExpired()
    }

    const message =
      (error.response?.data as { message?: string } | undefined)?.message ||
      error.message ||
      '请求失败'
    console.error('[API Error]', message)

    return Promise.reject(error)
  }
)

export default instance
