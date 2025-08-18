import instance from './index'

export interface CreateCommentPayload {
  content: string
  parentId?: number
}

export function addComment(articleId: number | string, data: CreateCommentPayload) {
  return instance.post(`/api/comments/${articleId}`, data)
}

export function getComments(articleId: number | string, params: { page?: number; pageSize?: number } = {}) {
  return instance.get(`/api/comments/${articleId}`, { params })
}

export function getCommentTree(articleId: number | string) {
  return instance.get(`/api/comments/${articleId}/tree`)
}

export function deleteComment(id: number | string) {
  return instance.delete(`/api/comments/${id}`)
}

export function updateCommentStatus(id: number | string, status: 'approved' | 'pending' | 'spam') {
  return instance.put(`/api/comments/${id}/status`, { status })
}

export function getAllComments(params: { page?: number; pageSize?: number } = {}) {
  return instance.get('/api/comments', { params })
}

