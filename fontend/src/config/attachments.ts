/*
  Config for attachment upload and preview behavior.
  Values can be overridden via Vite env vars in .env:
    - VITE_ATTACHMENT_COMPRESS=true|false
    - VITE_ATTACHMENT_QUALITY=80
    - VITE_ATTACHMENT_MAX_WIDTH=1920
    - VITE_ATTACHMENT_MAX_HEIGHT=1080
    - VITE_ATTACHMENT_PREVIEW_ABSOLUTE=true|false
    - VITE_ATTACHMENT_PREVIEW_BASE_URL=https://api.example.com
    - VITE_ATTACHMENT_PREVIEW_UPGRADE_BLOB=true|false
*/

function parseBoolean(value: unknown, defaultValue: boolean): boolean {
  if (value === undefined || value === null) return defaultValue
  const str = String(value).trim().toLowerCase()
  if (str === 'true') return true
  if (str === 'false') return false
  return defaultValue
}

function parseInteger(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') return undefined
  const n = Number.parseInt(String(value), 10)
  return Number.isFinite(n) ? n : undefined
}

const env = (import.meta as any)?.env || {}

export const attachmentConfig = {
  compress: parseBoolean(env.VITE_ATTACHMENT_COMPRESS, true),
  quality: parseInteger(env.VITE_ATTACHMENT_QUALITY) ?? 80,
  maxWidth: parseInteger(env.VITE_ATTACHMENT_MAX_WIDTH),
  maxHeight: parseInteger(env.VITE_ATTACHMENT_MAX_HEIGHT),
  // Whether to write absolute preview URLs into Markdown
  previewAbsolute: parseBoolean(env.VITE_ATTACHMENT_PREVIEW_ABSOLUTE, false),
  // If absolute, which base to use; fallback to API base
  previewBaseUrl: (env.VITE_ATTACHMENT_PREVIEW_BASE_URL || env.VITE_API_BASE_URL || '') as string,
  // Whether to upgrade preview <img> to blob: URLs for auth-safe previewing in editor
  previewUpgradeBlob: parseBoolean(env.VITE_ATTACHMENT_PREVIEW_UPGRADE_BLOB, true),
}

export function buildPreviewUrl(attachmentId: number | string): string {
  const path = `/api/attachments/${attachmentId}/preview`
  if (attachmentConfig.previewAbsolute) {
    const base = (attachmentConfig.previewBaseUrl || '').replace(/\/$/, '')
    return `${base}${path}`
  }
  return path
}


