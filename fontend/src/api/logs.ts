import instance from './index'

export function getLogs(params: { page?: number; pageSize?: number } = {}) {
  return instance.get('/api/logs', { params })
}

export function getLogById(id: number | string) {
  return instance.get(`/api/logs/${id}`)
}

