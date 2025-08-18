import axios from './index'
import type { Id, PaginationParams } from '@/types/common'

// 后台评论管理 - 获取评论列表（支持分页、筛选）
export function getComments(
  params: (PaginationParams & { status?: 'approved' | 'pending' | 'spam' }) = {}
) {
  return axios.get('/api/comments', { params })
}

// 获取文章评论（前台使用）
export function getArticleComments(articleId: Id, params: { page?: number; pageSize?: number } = {}) {
  return axios.get(`/api/articles/${articleId}/comments`, { params })
}

// 获取评论树（楼中楼）
export function getCommentTree(articleId: Id, params: { status?: 'approved' | 'pending' | 'spam'; page?: number; pageSize?: number } = {}) {
  return axios.get(`/api/comments/${articleId}/tree`, { params })
}

export function postComment(articleId: Id, data: { content: string; parentId?: number }) {
  return axios.post(`/api/comments/${articleId}`, data)
}

export function deleteComment(id: Id) {
  return axios.delete(`/api/comments/${id}`)
}

export function updateCommentStatus(id: Id, data: { status: 'approved' | 'pending' | 'spam' }) {
  return axios.put(`/api/comments/${id}/status`, data)
} 