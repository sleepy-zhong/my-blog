import instance from './index'
import type { Id, UnknownData, PaginationParams } from '@/types/common'

// 1. 获取附件列表（支持分页、筛选）
// 注意：数据库字段名是 UploadedAt，不是 CreatedAt
export function getAttachments(params: PaginationParams = {}) {
  return instance.get('/api/attachments', { params })
}

// 2. 上传附件（自动压缩）
export function addAttachment(formData: FormData | UnknownData) {
  return instance.post('/api/attachments', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

// 3. 获取附件详情
export function getAttachment(id: Id) {
  return instance.get(`/api/attachments/${id}`)
}

// 4. 下载附件
export function downloadAttachment(id: Id) {
  return instance.get(`/api/attachments/${id}/download`, {
    responseType: 'blob'
  })
}

// 5. 删除附件
export function deleteAttachment(id: Id) {
  return instance.delete(`/api/attachments/${id}`)
}

// 6. 批量删除附件
export function batchDeleteAttachments(attachmentIds: Array<Id>) {
  return instance.post('/api/attachments/batch-delete', {
    attachmentIds
  })
}

// 7. 获取文件分类统计
export function getAttachmentCategories() {
  return instance.get('/api/attachments/categories')
}

// 8. 获取文件预览信息
export function getAttachmentPreviewInfo(id: Id) {
  return instance.get(`/api/attachments/${id}/preview-info`)
}

// 9. 压缩单个文件（图片压缩）
export function compressAttachment(id: Id, params: UnknownData = {}) {
  return instance.post(`/api/attachments/${id}/compress`, null, { params })
}

// 10. 批量压缩文件为ZIP
export function compressAttachmentsToZip(data: UnknownData) {
  return instance.post('/api/attachments/compress-zip', data)
}

// 11. 获取文件压缩建议
export function getCompressionSuggestions(id: Id) {
  return instance.get(`/api/attachments/${id}/compression-suggestions`)
}

// 12. 获取某文章的所有附件（兼容旧接口）
export function getArticleAttachments(postId: Id) {
  return instance.get('/api/attachments', { params: { postId } })
} 