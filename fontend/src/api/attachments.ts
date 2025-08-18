import instance from './index'

export interface UploadAttachmentOptions {
  postId?: number | string
  editorToken?: string
  sha256?: string
  description?: string
  compress?: boolean
  quality?: number
  maxWidth?: number
  maxHeight?: number
}

export function uploadAttachment(file: File, options: UploadAttachmentOptions = {}) {
  const formData = new FormData()
  formData.append('file', file)
  if (options.postId !== undefined && options.postId !== null) formData.append('postId', String(options.postId))
  if (options.editorToken) formData.append('editorToken', options.editorToken)
  if (options.sha256) formData.append('sha256', options.sha256)
  if (options.description) formData.append('description', options.description)
  if (typeof options.compress === 'boolean') formData.append('compress', String(options.compress))
  if (typeof options.quality === 'number') formData.append('quality', String(options.quality))
  if (typeof options.maxWidth === 'number') formData.append('maxWidth', String(options.maxWidth))
  if (typeof options.maxHeight === 'number') formData.append('maxHeight', String(options.maxHeight))

  return instance.post('/api/attachments', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

// 新的全局查重：按内容哈希（SHA-256）查询是否已存在附件
export function lookupAttachmentByHash(sha256: string) {
  return instance.get('/api/attachments/lookup', { params: { sha256 } })
}

// 兼容旧接口：转发到新查重（不再依赖 postId）
export function checkAttachmentExists(_postId: number | string, hash: string) {
  return lookupAttachmentByHash(hash)
}

export function getAttachments(params: { page?: number; pageSize?: number; userId?: number; postId?: number; keyword?: string } = {}) {
  return instance.get('/api/attachments', { params })
}

export function getAttachment(id: number | string) {
  return instance.get(`/api/attachments/${id}`)
}

export function downloadAttachment(id: number | string) {
  return instance.get(`/api/attachments/${id}/download`, { responseType: 'blob' as any })
}

export function getAttachmentPreviewInfo(id: number | string) {
  return instance.get(`/api/attachments/${id}/preview-info`)
}

export function previewAttachment(id: number | string) {
  return instance.get(`/api/attachments/${id}/preview`, { responseType: 'blob' as any })
}

export function deleteAttachment(id: number | string) {
  return instance.delete(`/api/attachments/${id}`)
}

export function batchDeleteAttachments(attachmentIds: Array<number | string>) {
  return instance.post('/api/attachments/batch-delete', { attachmentIds })
}

export function compressAttachment(id: number | string, options: { quality?: number; width?: number; height?: number } = {}) {
  const params: Record<string, string | number> = {}
  if (typeof options.quality === 'number') params.quality = options.quality
  if (typeof options.width === 'number') params.width = options.width
  if (typeof options.height === 'number') params.height = options.height
  return instance.post(`/api/attachments/${id}/compress`, null, { params })
}

export function compressAttachmentsToZip(attachmentIds: Array<number | string>, zipName?: string) {
  return instance.post('/api/attachments/compress-zip', { attachmentIds, zipName })
}

export function getAttachmentCategories() {
  return instance.get('/api/attachments/categories')
}

export function getCompressionSuggestions(id: number | string) {
  return instance.get(`/api/attachments/${id}/compression-suggestions`)
}

