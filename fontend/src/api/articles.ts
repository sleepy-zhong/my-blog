import instance from './index'

export type ArticleStatus = 'draft' | 'published' | 'archived'

export interface CreateArticlePayload {
  title: string
  content: string
  slug?: string
  excerpt?: string
  status?: ArticleStatus
  categoryIds?: number[]
  tagIds?: number[]
  featuredImageURL?: string
}

export interface UpdateArticlePayload {
  title?: string
  content?: string
  excerpt?: string
  status?: ArticleStatus
  categoryIds?: number[]
  tagIds?: number[]
  featuredImageURL?: string
}

export interface ArticleListParams {
  page?: number
  pageSize?: number
  keyword?: string
  status?: ArticleStatus
  category?: number
  tag?: number
  categories?: string
  tags?: string
  categoryMode?: 'any' | 'all'
  tagMode?: 'any' | 'all'
  fields?: string
  include?: string
  sort?: string
}

export interface ArticleDetailParams {
  include?: string
  fields?: string
}

export function createArticle(data: CreateArticlePayload) {
  return instance.post('/api/articles', data)
}

export function getArticles(params: ArticleListParams = {}) {
  return instance.get('/api/articles', { params })
}

export function getArticlesCount(params: Omit<ArticleListParams, 'page' | 'pageSize' | 'fields' | 'include' | 'sort'> = {}) {
  return instance.get('/api/articles/count', { params })
}

export function getArticle(id: number | string, params: ArticleDetailParams = {}) {
  return instance.get(`/api/articles/${id}`, { params })
}

export const getArticleById = getArticle

export function updateArticle(id: number | string, data: UpdateArticlePayload) {
  return instance.put(`/api/articles/${id}`, data)
}

export function deleteArticle(id: number | string) {
  return instance.delete(`/api/articles/${id}`)
}

export function getArticleRevisions(id: number | string) {
  return instance.get(`/api/articles/${id}/revisions`)
}

export function updateArticleStatus(id: number | string, status: ArticleStatus) {
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

export function getArticleBySlug(slug: string, params: ArticleDetailParams = {}) {
  return instance.get(`/api/articles/slug/${encodeURIComponent(slug)}`, { params })
}

export function restoreArticleToRevision(id: number | string, revisionId: number | string) {
  return instance.post(`/api/articles/${id}/restore/${revisionId}`)
}

export function getMyArticles(params: { page?: number; pageSize?: number; status?: ArticleStatus } = {}) {
  return instance.get('/api/articles/my', { params })
}

export function getDraftArticles(params: { page?: number; pageSize?: number } = {}) {
  return instance.get('/api/articles/drafts', { params })
}

export function getPublishedArticles(
  params: {
    page?: number
    pageSize?: number
    keyword?: string
    category?: number
    tag?: number
    categories?: string
    tags?: string
    categoryMode?: 'any' | 'all'
    tagMode?: 'any' | 'all'
  } = {}
) {
  return instance.get('/api/articles/published', { params })
}

function normalizeImportPayload(input: FormData | File) {
  if (input instanceof FormData) {
    return input
  }

  const formData = new FormData()
  formData.append('file', input)
  return formData
}

export function importArticle(input: FormData | File) {
  const formData = normalizeImportPayload(input)
  return instance.post('/api/articles/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

export const importArticleDocument = importArticle

/**
 * @deprecated The backend increments the view count when article detail is fetched.
 */
export function incrementArticleViewCount(_id: number | string) {
  if (import.meta.env?.DEV) {
    console.warn('[deprecated] incrementArticleViewCount() is no longer needed.')
  }
  return Promise.resolve({})
}

export const viewArticle = incrementArticleViewCount

export function likeArticle(id: number | string) {
  return instance.post(`/api/articles/${id}/like`)
}

export function favoriteArticle(id: number | string) {
  return instance.post(`/api/articles/${id}/favorite`)
}
