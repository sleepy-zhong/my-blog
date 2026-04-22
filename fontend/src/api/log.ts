import instance from './index'
import type { Id, PaginationParams } from '@/types/common'

// 获取日志列表
export function getLogs(params: PaginationParams = {}) {
  return instance.get('/api/logs', { params })
}

// 获取日志详情
export function getLog(id: Id) {
  return instance.get(`/api/logs/${id}`)
}
