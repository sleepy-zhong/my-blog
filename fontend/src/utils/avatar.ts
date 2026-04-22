const ABSOLUTE_URL_RE = /^[a-z][a-z\d+\-.]*:/i

function normalizeBaseUrl(base: string) {
  const normalizedBase = String(base || '')
    .trim()
    .replace(/\\/g, '/')
    .replace(/\/+$/, '')

  if (!normalizedBase || normalizedBase === '/' || normalizedBase === '/api') {
    return ''
  }

  if (!/^https?:\/\//i.test(normalizedBase)) {
    return normalizedBase
  }

  try {
    const url = new URL(normalizedBase)
    const pathname = url.pathname.replace(/\/+$/, '')

    if (!pathname || pathname === '/' || pathname === '/api') {
      return url.origin
    }
  } catch {
    return normalizedBase
  }

  return normalizedBase
}

export function resolveAvatarUrl(
  raw: string | null | undefined,
  base = import.meta?.env?.VITE_API_BASE_URL || '/',
) {
  if (!raw) return ''

  const normalizedValue = String(raw).trim().replace(/\\/g, '/')
  if (!normalizedValue) return ''

  if (ABSOLUTE_URL_RE.test(normalizedValue) || normalizedValue.startsWith('//')) {
    return normalizedValue
  }

  const normalizedPath = normalizedValue.startsWith('/')
    ? normalizedValue
    : `/${normalizedValue}`

  const normalizedBase = normalizeBaseUrl(base)
  if (!normalizedBase) {
    return normalizedPath
  }

  return `${normalizedBase}${normalizedPath}`
}
