const path = require('path')
const multer = require('multer')
const errorCode = require('./errorCode')

const DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024

function parseMaxFileSize(value, fallback = DEFAULT_MAX_FILE_SIZE) {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

function normalizeExtension(value) {
  const ext = String(value || '').trim().toLowerCase()
  if (!ext) return ''
  return ext.startsWith('.') ? ext : `.${ext}`
}

function normalizeMimeType(value) {
  return String(value || '').trim().toLowerCase()
}

function formatFileSize(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0B'
  }

  const mb = bytes / 1024 / 1024
  if (mb >= 1) {
    return `${Number.isInteger(mb) ? mb : mb.toFixed(1)}MB`
  }

  const kb = bytes / 1024
  return `${Number.isInteger(kb) ? kb : kb.toFixed(1)}KB`
}

function normalizePolicy(policy = {}) {
  const maxFileSize = parseMaxFileSize(policy.maxFileSize || process.env.MAX_FILE_SIZE)

  return {
    fieldName: policy.fieldName || 'file',
    maxFileSize,
    allowedExtensions: new Set((policy.allowedExtensions || []).map(normalizeExtension).filter(Boolean)),
    allowedMimeTypes: new Set((policy.allowedMimeTypes || []).map(normalizeMimeType).filter(Boolean)),
    allowGenericMime: policy.allowGenericMime === true,
    invalidTypeMessage: policy.invalidTypeMessage || '不支持的文件类型',
    tooLargeMessage: policy.tooLargeMessage || `文件大小不能超过 ${formatFileSize(maxFileSize)}`,
  }
}

function matchesPolicy(file, policy) {
  const extension = normalizeExtension(path.extname(file?.originalname || ''))
  const mimeType = normalizeMimeType(file?.mimetype)

  if (policy.allowedExtensions.size > 0 && !policy.allowedExtensions.has(extension)) {
    return false
  }

  if (policy.allowedMimeTypes.size === 0) {
    return true
  }

  if (policy.allowedMimeTypes.has(mimeType)) {
    return true
  }

  return policy.allowGenericMime && (!mimeType || mimeType === 'application/octet-stream')
}

function sendUploadError(res, err, fallbackMessage) {
  return res.status(err.status || 400).json({
    code: err.code || errorCode.VALIDATION_ERROR.code,
    message: err.message || fallbackMessage,
  })
}

function createSingleFileUpload(policy) {
  const normalizedPolicy = normalizePolicy(policy)
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: normalizedPolicy.maxFileSize,
      files: 1,
    },
    fileFilter(_req, file, cb) {
      if (!matchesPolicy(file, normalizedPolicy)) {
        const err = new Error(normalizedPolicy.invalidTypeMessage)
        err.status = 400
        err.code = errorCode.VALIDATION_ERROR.code
        return cb(err)
      }

      return cb(null, true)
    },
  })

  return function singleFileUpload(req, res, next) {
    upload.single(normalizedPolicy.fieldName)(req, res, (err) => {
      if (!err) {
        return next()
      }

      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        return sendUploadError(res, {
          status: 400,
          code: errorCode.VALIDATION_ERROR.code,
          message: normalizedPolicy.tooLargeMessage,
        }, normalizedPolicy.tooLargeMessage)
      }

      return sendUploadError(res, err, '文件上传失败')
    })
  }
}

const SAFE_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
const SAFE_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
]

const avatarUpload = createSingleFileUpload({
  allowedExtensions: SAFE_IMAGE_EXTENSIONS,
  allowedMimeTypes: SAFE_IMAGE_MIME_TYPES,
  invalidTypeMessage: '头像仅支持 jpg/jpeg/png/gif/webp 图片',
})

const homeCatImageUpload = createSingleFileUpload({
  allowedExtensions: SAFE_IMAGE_EXTENSIONS,
  allowedMimeTypes: SAFE_IMAGE_MIME_TYPES,
  invalidTypeMessage: '首页猫猫图片仅支持 jpg/jpeg/png/gif/webp',
})

const attachmentUpload = createSingleFileUpload({
  allowedExtensions: [
    ...SAFE_IMAGE_EXTENSIONS,
    '.pdf',
    '.txt',
    '.md',
    '.markdown',
    '.json',
    '.zip',
    '.doc',
    '.docx',
    '.xls',
    '.xlsx',
    '.ppt',
    '.pptx',
  ],
  allowedMimeTypes: [
    ...SAFE_IMAGE_MIME_TYPES,
    'application/pdf',
    'text/plain',
    'text/markdown',
    'application/json',
    'application/zip',
    'application/x-zip-compressed',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  ],
  invalidTypeMessage: '附件仅支持图片、PDF、文本、JSON、ZIP 以及常见 Office 文档',
})

const articleImportUpload = createSingleFileUpload({
  allowedExtensions: ['.docx', '.md', '.markdown', '.txt', '.html', '.htm', '.pdf'],
  allowedMimeTypes: [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/markdown',
    'text/plain',
    'text/html',
    'application/pdf',
  ],
  allowGenericMime: true,
  invalidTypeMessage: '导入仅支持 docx/md/txt/html/pdf 文档',
})

module.exports = {
  createSingleFileUpload,
  avatarUpload,
  homeCatImageUpload,
  attachmentUpload,
  articleImportUpload,
}
