import instance from './index'

export type CommentStatus = 'approved' | 'pending' | 'spam'

export interface CreateCommentPayload {
  content: string
  parentId?: number
}

export interface CommentListParams {
  page?: number
  pageSize?: number
  status?: CommentStatus
}

export interface AdminCommentListParams extends CommentListParams {
  keyword?: string
  articleId?: number | string
}

export function postComment(articleId: number | string, data: CreateCommentPayload) {
  return instance.post(`/api/comments/${articleId}`, data)
}

export const addComment = postComment

export function getArticleComments(articleId: number | string, params: CommentListParams = {}) {
  return instance.get(`/api/comments/${articleId}`, { params })
}

export function getCommentTree(articleId: number | string, params: CommentListParams = {}) {
  return instance.get(`/api/comments/${articleId}/tree`, { params })
}

export function deleteComment(id: number | string) {
  return instance.delete(`/api/comments/${id}`)
}

export function updateCommentStatus(id: number | string, status: CommentStatus | { status: CommentStatus }) {
  const payload = typeof status === 'string' ? { status } : status
  return instance.put(`/api/comments/${id}/status`, payload)
}

export function getAllComments(params: AdminCommentListParams = {}) {
  return instance.get('/api/comments', { params })
}
