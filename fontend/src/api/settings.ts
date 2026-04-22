import instance from './index'
import type { UnknownData } from '@/types/common'

export function getSettings() {
  return instance.get('/api/settings')
}

export function updateSettings(data: UnknownData) {
  return instance.put('/api/settings', data)
}

export function sendTestEmail(email: string) {
  return instance.post('/api/notifications/test', { to: email })
}
