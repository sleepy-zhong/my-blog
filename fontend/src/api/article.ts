import instance from './index'

// 获取文章列表（支持多分类/多标签、投影与关联展开、排序）
export function getArticles(params: {
  page?: number
  pageSize?: number
  keyword?: string
  status?: 'draft' | 'published' | 'archived'
  // legacy single filters
  category?: number
  tag?: number
  // new CSV multi-filters
  categories?: string
  tags?: string
  // match modes
  categoryMode?: 'any' | 'all'
  tagMode?: 'any' | 'all'
  // projection & includes
  fields?: string
  include?: string
  // sorting
  sort?: string
} = {}) {
  return instance.get('/api/articles', { params })
}

// 获取文章总数（与列表同过滤）
export function getArticlesCount(params: {
  keyword?: string
  status?: 'draft' | 'published' | 'archived'
  category?: number
  tag?: number
  categories?: string
  tags?: string
  categoryMode?: 'any' | 'all'
  tagMode?: 'any' | 'all'
} = {}) {
  return instance.get('/api/articles/count', { params })
}

// 获取单篇文章（可选 include 以展开 categories/tags/user）
export function getArticle(id: number | string, params?: { include?: string; fields?: string }) {
  return instance.get(`/api/articles/${id}`, { params })
}

// 创建文章
export function createArticle(data: Record<string, unknown>) {
  return instance.post('/api/articles', data)
}

// 更新文章
export function updateArticle(id: number | string, data: Record<string, unknown>) {
  return instance.put(`/api/articles/${id}`, data)
}

// 删除文章
export function deleteArticle(id: number | string) {
  return instance.delete(`/api/articles/${id}`)
}

// 增加文章浏览量
// 后端已在 GET 详情时做原子自增，无需单独调用
// 保留占位导出但标记为废弃，避免误用
/**
 * @deprecated 后端已在 GET /api/articles/{id} 与 GET /api/articles/slug/{slug} 内自增 ViewCount。
 * 前端不要再单独调用此接口，避免重复计数。
 */
export function viewArticle(_id: number | string) {
  if (import.meta.env?.DEV) {
    // eslint-disable-next-line no-console
    console.warn('[deprecated] viewArticle() 已废弃：GET 详情会自动自增。')
  }
  return Promise.resolve({}) as unknown as Promise<any>
}

// 文章点赞/取消点赞
export function likeArticle(id: number | string) {
  return instance.post(`/api/articles/${id}/like`)
}

// 文章收藏/取消收藏
export function favoriteArticle(id: number | string) {
  return instance.post(`/api/articles/${id}/favorite`)
}

// 导入文档
export function importArticle(formData: FormData) {
  return instance.post('/api/articles/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
} 