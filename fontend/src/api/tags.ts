import instance from './index'

export interface CreateTagPayload {
  name: string
  description?: string
}

export interface UpdateTagPayload {
  name?: string
  description?: string
}

export function createTag(data: CreateTagPayload) {
  return instance.post('/api/tags', data)
}

export function getTags(params?: { page?: number; pageSize?: number; keyword?: string }) {
  return instance.get('/api/tags', { params })
}

export function updateTag(id: number | string, data: UpdateTagPayload) {
  return instance.put(`/api/tags/${id}`, data)
}

export function deleteTag(id: number | string) {
  return instance.delete(`/api/tags/${id}`)
}

