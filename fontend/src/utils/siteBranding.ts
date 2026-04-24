export const SITE_BRANDING_UPDATED_EVENT = 'site-branding-updated'

type SiteBrandingPayload = {
  SiteName?: string
  siteName?: string
  FaviconURL?: string
  faviconURL?: string
  UpdatedAt?: string
  updatedAt?: string
}

function resolveAbsoluteURL(input: string) {
  try {
    return new URL(input, window.location.origin)
  } catch {
    return null
  }
}

function appendVersion(url: string, version: string) {
  const absolute = resolveAbsoluteURL(url)
  if (!absolute) return url

  if (version) {
    absolute.searchParams.set('v', version)
  }

  return absolute.toString()
}

function createIconLink(rel: string, href: string, type: string) {
  const link = document.createElement('link')
  link.setAttribute('rel', rel)
  link.setAttribute('href', href)
  if (type) {
    link.setAttribute('type', type)
  }
  document.head.appendChild(link)
}

function detectIconType(url: string) {
  const absolute = resolveAbsoluteURL(url)
  const pathname = absolute?.pathname?.toLowerCase() || url.toLowerCase()

  if (pathname.endsWith('.svg')) return 'image/svg+xml'
  if (pathname.endsWith('.ico')) return 'image/x-icon'
  if (pathname.endsWith('.webp')) return 'image/webp'
  if (pathname.endsWith('.jpg') || pathname.endsWith('.jpeg')) return 'image/jpeg'
  if (pathname.endsWith('.gif')) return 'image/gif'
  return 'image/png'
}

function clearExistingIcons() {
  document.querySelectorAll("link[rel~='icon']").forEach((node) => {
    node.parentNode?.removeChild(node)
  })
}

export function applySiteBranding(payload?: SiteBrandingPayload) {
  if (typeof document === 'undefined') return

  const siteName = String(payload?.SiteName ?? payload?.siteName ?? '').trim()
  const faviconURL = String(payload?.FaviconURL ?? payload?.faviconURL ?? '').trim()
  const updatedAt = String(payload?.UpdatedAt ?? payload?.updatedAt ?? '').trim()

  if (siteName) {
    document.title = siteName
  }

  clearExistingIcons()

  if (!faviconURL) {
    return
  }

  const version = updatedAt || String(Date.now())
  const iconHref = appendVersion(faviconURL, version)
  const iconType = detectIconType(faviconURL)

  createIconLink('icon', iconHref, iconType)
  createIconLink('shortcut icon', iconHref, iconType)
}

export function broadcastSiteBranding(payload?: SiteBrandingPayload) {
  applySiteBranding(payload)

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(SITE_BRANDING_UPDATED_EVENT, { detail: payload }))
  }
}

export function bindSiteBrandingEvents() {
  if (typeof window === 'undefined') return

  window.addEventListener(
    SITE_BRANDING_UPDATED_EVENT,
    ((event: Event) => {
      const customEvent = event as CustomEvent<SiteBrandingPayload>
      applySiteBranding(customEvent.detail)
    }) as EventListener,
  )
}
