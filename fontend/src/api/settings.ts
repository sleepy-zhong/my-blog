import instance from './index'
import type { UnknownData } from '@/types/common'

// 获取系统设置
export function getSettings() {
  return instance.get('/api/settings')
}

// 更新系统设置
export function updateSettings(data: UnknownData) {
  return instance.put('/api/settings', data)
}

// 发送测试邮件
export function sendTestEmail(email: string) {
  return instance.post('/api/notifications/test', { email })
} 