const ALLOWED_TAGS = new Set([
  'a',
  'blockquote',
  'br',
  'code',
  'del',
  'details',
  'div',
  'em',
  'figcaption',
  'figure',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'hr',
  'img',
  'input',
  'kbd',
  'li',
  'mark',
  'ol',
  'p',
  'pre',
  'section',
  'span',
  'strong',
  'sub',
  'summary',
  'sup',
  'table',
  'tbody',
  'td',
  'tfoot',
  'th',
  'thead',
  'tr',
  'u',
  'ul',
])

const BLOCKED_TAGS = new Set([
  'base',
  'embed',
  'form',
  'frame',
  'iframe',
  'link',
  'meta',
  'object',
  'script',
  'style',
  'textarea',
])

const GLOBAL_ATTRS = new Set(['class', 'id', 'role', 'title'])
const URL_ATTRS = new Set(['href', 'src'])
const TAG_ATTRS = {
  a: new Set(['href', 'target', 'rel']),
  img: new Set(['src', 'alt', 'title', 'loading', 'referrerpolicy', 'width', 'height']),
  td: new Set(['colspan', 'rowspan', 'align']),
  th: new Set(['colspan', 'rowspan', 'align']),
  ol: new Set(['start']),
  input: new Set(['type', 'checked', 'disabled']),
}

function isSafeUrl(rawUrl, options) {
  const url = String(rawUrl || '').trim()
  if (!url) return false

  const normalized = url.toLowerCase()

  if (
    normalized.startsWith('#') ||
    normalized.startsWith('/') ||
    normalized.startsWith('./') ||
    normalized.startsWith('../')
  ) {
    return true
  }

  if (options.allowBlobUrl && normalized.startsWith('blob:')) {
    return true
  }

  if (/^https?:\/\//i.test(url) || /^mailto:/i.test(url) || /^tel:/i.test(url)) {
    return true
  }

  return /^data:image\/(?:png|gif|jpe?g|webp|bmp);base64,/i.test(url)
}

function shouldKeepAttribute(tagName, attrName) {
  if (attrName.startsWith('aria-') || attrName.startsWith('data-')) {
    return true
  }

  if (GLOBAL_ATTRS.has(attrName)) {
    return true
  }

  return !!TAG_ATTRS[tagName]?.has(attrName)
}

function unwrapElement(element) {
  const parent = element.parentNode
  if (!parent) return

  while (element.firstChild) {
    parent.insertBefore(element.firstChild, element)
  }

  parent.removeChild(element)
}

function sanitizeElement(element, options) {
  const tagName = element.tagName.toLowerCase()

  if (BLOCKED_TAGS.has(tagName)) {
    element.remove()
    return
  }

  if (!ALLOWED_TAGS.has(tagName)) {
    unwrapElement(element)
    return
  }

  for (const attribute of Array.from(element.attributes)) {
    const attrName = attribute.name.toLowerCase()

    if (attrName.startsWith('on') || attrName === 'style' || attrName === 'srcset' || attrName === 'formaction') {
      element.removeAttribute(attribute.name)
      continue
    }

    if (!shouldKeepAttribute(tagName, attrName)) {
      element.removeAttribute(attribute.name)
      continue
    }

    if (URL_ATTRS.has(attrName) && !isSafeUrl(attribute.value, options)) {
      element.removeAttribute(attribute.name)
    }
  }

  if (tagName === 'a') {
    const href = element.getAttribute('href')
    if (!href) {
      unwrapElement(element)
      return
    }

    const target = element.getAttribute('target')
    if (target === '_blank') {
      element.setAttribute('rel', 'noopener noreferrer nofollow')
    } else {
      element.removeAttribute('target')
      element.removeAttribute('rel')
    }
  }

  if (tagName === 'img' && !element.getAttribute('src')) {
    element.remove()
    return
  }

  if (tagName === 'input') {
    if (element.getAttribute('type') !== 'checkbox') {
      element.remove()
      return
    }

    element.setAttribute('disabled', 'disabled')
  }

  for (const child of Array.from(element.children)) {
    sanitizeElement(child, options)
  }
}

export function sanitizeHtml(html, options = {}) {
  if (!html) return ''
  if (typeof DOMParser === 'undefined') return html

  const parser = new DOMParser()
  const documentRef = parser.parseFromString(String(html), 'text/html')

  for (const element of Array.from(documentRef.body.children)) {
    sanitizeElement(element, options)
  }

  return documentRef.body.innerHTML
}
