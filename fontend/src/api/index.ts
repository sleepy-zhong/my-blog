import axios from 'axios'

const apiBaseURL = import.meta?.env?.VITE_API_BASE_URL || '/'

const instance = axios.create({
  baseURL: apiBaseURL,
  timeout: 15000,
  withCredentials: false,
})

instance.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

instance.interceptors.response.use(
  res => res.data,
  err => {
    const status = err?.response?.status
    // 不在这里做跳转；交由路由守卫或具体页面处理
    if (status === 401) {
      // 可在此处选择清理本地 token，避免后续请求继续 401
      // localStorage.removeItem('token')
    }
    const message = err?.response?.data?.message || err?.message || '请求失败'
    // 取消全局 alert，避免无意义弹窗
    console.error('[API Error]', message)
    return Promise.reject(err)
  }
)

export default instance