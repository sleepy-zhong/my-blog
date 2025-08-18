import instance from './index'

export function getTags(params: { page?: number; pageSize?: number } = {}) {
  return instance.get('/api/tags', { params })
}
export function getTag(id: number | string) {
  return instance.get(`/api/tags/${id}`)
}
export function addTag(data: { name: string; description?: string }) {
  return instance.post('/api/tags', data)
}
export function updateTag(id: number | string, data: { name?: string; description?: string }) {
  return instance.put(`/api/tags/${id}`, data)
}
export function deleteTag(id: number | string) {
  return instance.delete(`/api/tags/${id}`)
}
 
export function getTagArticles(id: number | string, params: { page?: number; pageSize?: number } = {}) {
  return instance.get(`/api/tags/${id}/articles`, { params })
} 