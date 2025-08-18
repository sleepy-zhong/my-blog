import instance from './index'

export interface CreateCategoryPayload {
  name: string
  description?: string
  parentCategoryId?: number
}

export interface UpdateCategoryPayload {
  name?: string
  description?: string
  parentCategoryId?: number
}

export function createCategory(data: CreateCategoryPayload) {
  return instance.post('/api/categories', data)
}

export function getCategories() {
  return instance.get('/api/categories')
}

export function updateCategory(id: number | string, data: UpdateCategoryPayload) {
  return instance.put(`/api/categories/${id}`, data)
}

export function deleteCategory(id: number | string) {
  return instance.delete(`/api/categories/${id}`)
}

export function getCategoryTree() {
  return instance.get('/api/categories/tree')
}

