import instance from './index'

export function getCategories(params: { page?: number; pageSize?: number } = {}) {
  return instance.get('/api/categories', { params })
}
export function getCategory(id: number | string) {
  return instance.get(`/api/categories/${id}`)
}
export function addCategory(data: { name: string; description?: string }) {
  return instance.post('/api/categories', data)
}
export function updateCategory(id: number | string, data: { name?: string; description?: string }) {
  return instance.put(`/api/categories/${id}`, data)
}
export function deleteCategory(id: number | string) {
  return instance.delete(`/api/categories/${id}`)
}

export function getCategoryTree() {
  return instance.get('/api/categories/tree')
}

export function getCategoryArticles(id: number | string, params: { page?: number; pageSize?: number } = {}) {
  return instance.get(`/api/categories/${id}/articles`, { params })
} 