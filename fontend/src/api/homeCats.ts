import instance from './index'

export interface HomeCatPayload {
  name: string
  label: string
  speechText: string
  imageUrl: string
  sortOrder?: number
  isActive?: boolean
  isFeatured?: boolean
}

export interface HomeCatSortItem {
  id: number | string
  sortOrder: number
}

export function getPublicHomeCats() {
  return instance.get('/api/home-cats/public')
}

export function getHomeCats() {
  return instance.get('/api/home-cats')
}

export function createHomeCat(data: HomeCatPayload) {
  return instance.post('/api/home-cats', data)
}

export function updateHomeCat(id: number | string, data: Partial<HomeCatPayload>) {
  return instance.put(`/api/home-cats/${id}`, data)
}

export function deleteHomeCat(id: number | string) {
  return instance.delete(`/api/home-cats/${id}`)
}

export function updateHomeCatStatus(id: number | string, isActive: boolean) {
  return instance.patch(`/api/home-cats/${id}/status`, { isActive })
}

export function sortHomeCats(items: HomeCatSortItem[]) {
  return instance.patch('/api/home-cats/sort', { items })
}

export function uploadHomeCatImage(file: File) {
  const formData = new FormData()
  formData.append('file', file)

  return instance.post('/api/home-cats/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}
