import instance from './index'

// Article payloads
export interface CreateArticlePayload {
  title: string
  content: string
  slug?: string
  excerpt?: string
  status?: 'draft' | 'published' | 'archived'
  categoryIds?: number[]
  tagIds?: number[]
  featuredImageURL?: string
}

export interface UpdateArticlePayload {
  title?: string
  content?: string
  excerpt?: string
  status?: 'draft' | 'published' | 'archived'
  categoryIds?: number[]
  tagIds?: number[]
}

export interface ArticleListParams {
  page?: number
  pageSize?: number
  keyword?: string
  status?: 'draft' | 'published' | 'archived'
  // legacy single filters
  category?: number
  tag?: number
  // new multi-filters (CSV string like "1,2,3")
  categories?: string
  tags?: string
  // match modes for multi-filters
  categoryMode?: 'any' | 'all'
  tagMode?: 'any' | 'all'
  // projection and includes
  fields?: string
  include?: string
  // sorting
  sort?: string
}

export function createArticle(data: CreateArticlePayload) {
  return instance.post('/api/articles', data)
}

export function getArticles(params: ArticleListParams = {}) {
  return instance.get('/api/articles', { params })
}

// 获取文章总数（与列表同过滤条件）
export function getArticlesCount(params: ArticleListParams = {}) {
  return instance.get('/api/articles/count', { params })
}

export function getArticleById(id: number | string) {
  return instance.get(`/api/articles/${id}`)
}

export function updateArticle(id: number | string, data: UpdateArticlePayload) {
  return instance.put(`/api/articles/${id}`, data)
}

export function deleteArticle(id: number | string) {
  return instance.delete(`/api/articles/${id}`)
}

export function getArticleRevisions(id: number | string) {
  return instance.get(`/api/articles/${id}/revisions`)
}

/**
 * @deprecated 后端已在 GET 详情接口内自增 ViewCount，无需再调用。
 */
export function incrementArticleViewCount(_id: number | string) {
  if (import.meta.env?.DEV) {
    // eslint-disable-next-line no-console
    console.warn('[deprecated] incrementArticleViewCount() 已废弃：GET 详情会自动自增。')
  }
  return Promise.resolve({}) as unknown as Promise<any>
}

export function updateArticleStatus(id: number | string, status: 'draft' | 'published' | 'archived') {
  return instance.put(`/api/articles/${id}/status`, { status })
}

export function publishArticle(id: number | string) {
  return instance.put(`/api/articles/${id}/publish`)
}

export function archiveArticle(id: number | string) {
  return instance.put(`/api/articles/${id}/archive`)
}

export function setArticleFeaturedImage(id: number | string, featuredImageURL: string) {
  return instance.put(`/api/articles/${id}/featured-image`, { featuredImageURL })
}

export function getArticleBySlug(slug: string) {
  return instance.get(`/api/articles/slug/${encodeURIComponent(slug)}`)
}

export function restoreArticleToRevision(id: number | string, revisionId: number | string) {
  return instance.post(`/api/articles/${id}/restore/${revisionId}`)
}

export function getMyArticles(params: { page?: number; pageSize?: number; status?: 'draft' | 'published' | 'archived' } = {}) {
  return instance.get('/api/articles/my', { params })
}

export function getDraftArticles(params: { page?: number; pageSize?: number } = {}) {
  return instance.get('/api/articles/drafts', { params })
}

export function getPublishedArticles(params: { page?: number; pageSize?: number; keyword?: string; category?: number; tag?: number; categories?: string; tags?: string; categoryMode?: 'any' | 'all'; tagMode?: 'any' | 'all' } = {}) {
  return instance.get('/api/articles/published', { params })
}

export function importArticleDocument(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  return instance.post('/api/articles/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

