<template>
  <div class="vditor-container">
    <div id="vditor" class="vditor-csdn" style="position: relative; z-index: 1;" />
  </div>
</template>

<script setup>
import { onMounted, watch, ref, onUnmounted } from 'vue'
import Vditor from 'vditor'
import 'vditor/dist/index.css'
// 直接本地引入中文语言包，避免网络加载失败
import 'vditor/dist/js/i18n/zh_CN.js'
import { uploadAttachment, lookupAttachmentByHash, previewAttachment } from '@/api/attachments'
import { attachmentConfig, buildPreviewUrl } from '@/config/attachments'
import { sanitizeHtml } from '@/utils/htmlSanitizer'

const props = defineProps({
  content: String,
  // 由父组件提供的会话键与获取 PostID 的方法
  editorToken: { type: String, required: false },
  ensurePostId: { type: Function, required: false }
})
const emit = defineEmits(['update:content', 'notify'])

let vditor = null
const localContent = ref(props.content || '')
const blobUrlCache = new Map()
const blobUrlsToRevoke = new Set()

onMounted(() => {
  vditor = new Vditor('vditor', {
    // 指定 CDN，避免默认 unpkg 某些资源 404
    cdn: 'https://cdn.jsdelivr.net/npm/vditor@3.11.1',
    height: 'auto',
    minHeight: 500,
    toolbar: [
      'bold',
      'italic',
      'heading',
      'strikethrough',
      '|',
      'list',
      'ordered-list',
      'check',
      'outdent',
      'indent',
      '|',
      'quote',
      'line',
      'code',
      'inline-code',
      'insert-before',
      'insert-after',
      '|',
      'link',
      'table',
      '|',
      'undo',
      'redo',
      '|',
      'edit-mode',
      'content-theme',
      'code-theme',
      'outline',
      'preview',
      'fullscreen',
      'devtools',
      'info',
      'help',
    ],
    toolbarConfig: {
      pin: true,
    },
    mode: 'ir',
    cache: {
      enable: true,
    },
    preview: {
      delay: 500,
      maxWidth: 1000,
      mode: 'both',
      transform(html) {
        return sanitizeHtml(html, { allowBlobUrl: true })
      },
      markdown: {
        toc: true,
        mark: true,
        footnotes: true,
        autoSpace: true,
        fixTermTypo: true,
        sanitize: true,
        listStyle: true,
        codeBlockPreview: true,
        mathBlockPreview: true,
        paragraphBeginningSpace: true,
        linkBase: "",
        linkPrefix: "",
      },
      theme: {
        current: 'light',
        // 与上面的 cdn 版本保持一致
        path: 'https://cdn.jsdelivr.net/npm/vditor@3.11.1/dist/css/content-theme'
      },
      hljs: {
        enable: true,
        style: 'github',
        lineNumber: true
      }
    },
    typewriterMode: true,
    outline: {
      enable: true,
      position: 'right',
    },
    counter: {
      enable: true,
      type: 'text',
    },
    hint: {
      emoji: {
        '+1': '👍',
        '-1': '👎',
        'smile': '😄',
        'laughing': '😆',
      },
    },
    // 移除上传按钮，改为自定义粘贴/拖拽处理
    lang: 'zh_CN',
    // 使用已本地引入的语言对象，避免额外网络请求
    i18n: window.VditorI18n,
    theme: 'classic',
    after: () => {
      vditor.setValue(localContent.value)
      // 监听粘贴事件：捕获剪贴板中的图片与 data URI
      const root = document.getElementById('vditor')
      if (root) {
        root.addEventListener('paste', onPasteHandler)
        root.addEventListener('drop', onDropHandler)
        root.addEventListener('dragover', (e) => e.preventDefault())
        root.addEventListener('keydown', onKeydownHandler, true)
        root.addEventListener('click', onClickHandler, true)
      }
      // 初次渲染后尝试升级预览图片，避免 401
      scheduleUpgradePreviewImagesToBlob()
    },
    input: async (val) => {
      emit('update:content', val)
      // 若包含 data:image，尝试自动本地化并替换为预览地址
      if (/data:image\//i.test(val)) {
        try {
          const normalized = await normalizeMarkdownImages(val)
          if (normalized && normalized !== val) {
            vditor.setValue(normalized)
            emit('update:content', normalized)
            // 内容变更后升级预览图片
            scheduleUpgradePreviewImagesToBlob()
          }
        } catch (e) {
          // 静默失败，避免影响编辑体验
        }
      }
      // 检测相对路径图片，提示用户需要批量导入
      const relImgs = extractImageUrls(val).filter(isRelativePath)
      if (relImgs.length) {
        emit('notify', { type: 'info', message: `检测到 ${relImgs.length} 个相对路径图片，建议拖拽图片或粘贴图片到编辑器以自动上传。` })
      }
      // 用户输入后也尝试升级预览图片
      scheduleUpgradePreviewImagesToBlob()
    }
  })
})

watch(() => props.content, (val) => {
  if (vditor && vditor.getValue() !== val) vditor.setValue(val)
  // 外部变更时也升级预览
  scheduleUpgradePreviewImagesToBlob()
})

// 已移除 contentJSON 相关解析

// 剪贴板处理：支持直接粘贴图片文件或 HTML/纯文本中的 data:image
async function onPasteHandler(ev) {
  const e = ev || window.event
  if (!e || !e.clipboardData) return

  const items = Array.from(e.clipboardData.items || [])
  const fileItems = items.filter((it) => it.kind === 'file' && it.type.startsWith('image/'))

  // 先尝试文件通道
  if (fileItems.length > 0) {
    e.preventDefault()
    try {
      const postId = await ensurePostIdIfProvided()
      for (const it of fileItems) {
        const file = it.getAsFile()
        if (!file) continue
        const hash = await sha256File(file)
        let attachmentId
        try {
          const existsRes = await lookupAttachmentByHash(hash)
          const existsData = existsRes?.data?.data || existsRes?.data
          if (existsData?.exists && existsData.attachment?.AttachmentID) attachmentId = existsData.attachment.AttachmentID
        } catch {}

        if (!attachmentId) {
          const res = await uploadAttachment(file, {
            postId,
            editorToken: props.editorToken,
            sha256: hash,
            compress: attachmentConfig.compress,
            quality: attachmentConfig.quality,
            maxWidth: attachmentConfig.maxWidth,
            maxHeight: attachmentConfig.maxHeight,
          })
          const payload = res?.data?.data || res?.data || res
          attachmentId = payload.AttachmentID || payload.attachmentId || payload.id
        }
        if (attachmentId) {
          const previewUrl = buildPreviewUrl(attachmentId)
          vditor.insertValue(`![](${previewUrl})\n`)
          scheduleUpgradePreviewImagesToBlob()
        }
      }
    } catch (_) {
      emit('notify', { type: 'error', message: '图片粘贴处理失败，请重试' })
    }
    return
  }

  // 再尝试从 HTML 或纯文本中提取 data:image
  const html = e.clipboardData.getData('text/html') || ''
  const plain = e.clipboardData.getData('text/plain') || ''
  const dataUris = [
    ...extractDataUrisFromHtml(html),
    ...extractDataUrisFromPlainText(plain),
  ]
  if (dataUris.length === 0) return

  e.preventDefault()
  try {
    const postId = await ensurePostIdIfProvided()
    for (const dataUrl of dataUris) {
      try {
        const file = await dataUriToFile(dataUrl)
        const hash = await sha256File(file)
        let attachmentId
        try {
          const existsRes = await lookupAttachmentByHash(hash)
          const existsData = existsRes?.data?.data || existsRes?.data
          if (existsData?.exists && existsData.attachment?.AttachmentID) attachmentId = existsData.attachment.AttachmentID
        } catch {}
        if (!attachmentId) {
          const res = await uploadAttachment(file, {
            postId,
            editorToken: props.editorToken,
            sha256: hash,
            compress: attachmentConfig.compress,
            quality: attachmentConfig.quality,
            maxWidth: attachmentConfig.maxWidth,
            maxHeight: attachmentConfig.maxHeight,
          })
          const payload = res?.data?.data || res?.data || res
          attachmentId = payload.AttachmentID || payload.attachmentId || payload.id
        }
        if (attachmentId) {
          const previewUrl = buildPreviewUrl(attachmentId)
          vditor.insertValue(`![](${previewUrl})\n`)
          scheduleUpgradePreviewImagesToBlob()
        }
      } catch (_) {
        // 单个 data:image 失败不影响其他
      }
    }
  } catch (_) {
    emit('notify', { type: 'error', message: '图片粘贴处理失败，请重试' })
  }
}

// 拖拽图片文件到编辑器
async function onDropHandler(ev) {
  const e = ev || window.event
  if (!e || !e.dataTransfer) return
  const files = Array.from(e.dataTransfer.files || [])
  const imageFiles = files.filter((f) => f.type && f.type.startsWith('image/'))
  if (!imageFiles.length) return
  e.preventDefault()
  try {
    const postId = await ensurePostIdIfProvided()
    for (const file of imageFiles) {
      const hash = await sha256File(file)
      let attachmentId
      try {
        const existsRes = await lookupAttachmentByHash(hash)
        const existsData = existsRes?.data?.data || existsRes?.data
        if (existsData?.exists && existsData.attachment?.AttachmentID) attachmentId = existsData.attachment.AttachmentID
      } catch {}
      if (!attachmentId) {
        const res = await uploadAttachment(file, {
          postId,
          editorToken: props.editorToken,
          sha256: hash,
          compress: attachmentConfig.compress,
          quality: attachmentConfig.quality,
          maxWidth: attachmentConfig.maxWidth,
          maxHeight: attachmentConfig.maxHeight,
        })
        const payload = res?.data?.data || res?.data || res
        attachmentId = payload.AttachmentID || payload.attachmentId || payload.id
      }
      if (attachmentId) {
        const previewUrl = buildPreviewUrl(attachmentId)
        vditor.insertValue(`![](${previewUrl})\n`)
        scheduleUpgradePreviewImagesToBlob()
      }
    }
  } catch (err) {
    emit('notify', { type: 'error', message: '图片拖拽处理失败，请重试' })
  }
}

function extractImageUrls(md) {
  const urls = []
  const mdImgs = md.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)
  for (const m of mdImgs) urls.push(m[1])
  const htmlImgs = md.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)
  for (const m of htmlImgs) urls.push(m[1])
  return Array.from(new Set(urls))
}

function extractDataUrisFromHtml(html) {
  if (!html) return []
  const out = []
  const re = /<img[^>]+src=["'](data:image\/[a-zA-Z0-9.+-]+;base64,[^"']+)["']/gi
  let m
  while ((m = re.exec(html)) !== null) {
    out.push(m[1])
  }
  return Array.from(new Set(out))
}

function extractDataUrisFromPlainText(text) {
  if (!text) return []
  const re = /(data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=\r\n]+)/g
  const out = []
  let m
  while ((m = re.exec(text)) !== null) {
    out.push(m[1])
  }
  return Array.from(new Set(out))
}

function isDataUri(url) { return /^data:image\//i.test(url) }
function isHttpUrl(url) { return /^https?:\/\//i.test(url) }
function isRelativePath(url) { return !isDataUri(url) && !isHttpUrl(url) && !url.startsWith('/') }

async function sha256File(file) {
  const buf = await file.arrayBuffer()
  const digest = await crypto.subtle.digest('SHA-256', buf)
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('')
}

async function dataUriToFile(dataUri, fallbackName = 'image.png') {
  const match = dataUri.match(/^data:([^;]+);base64,(.*)$/)
  if (!match) throw new Error('Invalid data URI')
  const mime = match[1]
  const b64 = match[2]
  const binStr = atob(b64)
  const len = binStr.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) bytes[i] = binStr.charCodeAt(i)
  return new File([bytes], fallbackName, { type: mime })
}

async function ensurePostIdIfProvided() {
  if (typeof props.ensurePostId === 'function') {
    try { return await props.ensurePostId() } catch (_) { return undefined }
  }
  return undefined
}

async function normalizeMarkdownImages(mdSource) {
  // 仅处理 data:image 与（可选）剪贴板图片自动插入；外链/绝对路径不做变更
  const urls = extractImageUrls(mdSource)
  const dataUris = urls.filter(isDataUri)
  if (dataUris.length === 0) return mdSource
  const postId = await ensurePostIdIfProvided()

  const urlMap = {}
  for (const dataUrl of dataUris) {
    try {
      const file = await dataUriToFile(dataUrl)
      const hash = await sha256File(file)
      let attachmentId
      try {
        const existsRes = await lookupAttachmentByHash(hash)
        const existsData = existsRes?.data?.data || existsRes?.data
        if (existsData?.exists && existsData.attachment?.AttachmentID) attachmentId = existsData.attachment.AttachmentID
      } catch {}
      if (!attachmentId) {
        const res = await uploadAttachment(file, { postId, editorToken: props.editorToken, sha256: hash, compress: true, quality: 80 })
        const payload = res?.data?.data || res?.data || res
        attachmentId = payload.AttachmentID || payload.attachmentId || payload.id
      }
      if (attachmentId) {
        urlMap[dataUrl] = buildPreviewUrl(attachmentId)
      }
    } catch (_e) {
      // 单个失败忽略
    }
  }

  if (Object.keys(urlMap).length === 0) return mdSource
  // 两种语法统一替换
  let out = mdSource
  out = out.replace(/(!\[[^\]]*\]\()([^)]+)(\))/g, (_, a, b, c) => a + (urlMap[b] || b) + c)
  out = out.replace(/(<img[^>]+src=["'])([^"']+)(["'])/gi, (_, a, b, c) => a + (urlMap[b] || b) + c)
  return out
}

// 将 Markdown 中的受控预览地址（需要 Authorization）替换为本地 blob URL，仅用于编辑器预览
let upgradeScheduled = false
function scheduleUpgradePreviewImagesToBlob() {
  if (upgradeScheduled) return
  upgradeScheduled = true
  setTimeout(() => {
    upgradeScheduled = false
    upgradePreviewImagesToBlob()
  }, 50)
}
async function upgradePreviewImagesToBlob() {
  try {
    const root = document.getElementById('vditor')
    if (!root) return
    const imgs = root.querySelectorAll('img')
    const re = /\/api\/attachments\/(\d+)\/preview(\?.*)?$/
    for (const img of imgs) {
      const src = img.getAttribute('src') || ''
      if (!re.test(src)) continue
      // 已升级的跳过
      if (src.startsWith('blob:')) continue
      // 缓存命中直接替换
      if (blobUrlCache.has(src)) {
        img.setAttribute('data-original-src', src)
        img.src = blobUrlCache.get(src)
        continue
      }
      const m = src.match(re)
      const id = m && m[1]
      if (!id) continue
      try {
        const blob = await previewAttachment(id)
        if (blob instanceof Blob) {
          const blobUrl = URL.createObjectURL(blob)
          blobUrlCache.set(src, blobUrl)
          blobUrlsToRevoke.add(blobUrl)
          img.setAttribute('data-original-src', src)
          img.src = blobUrl
        }
      } catch (_) {
        // 忽略单个失败
      }
    }
  } catch (_) {}
}

// -------- 图片删除增强：支持键盘删除和 Alt+点击删除 --------
function onKeydownHandler(e) {
  if (!e) return
  const isDelete = e.key === 'Delete' || e.key === 'Backspace'
  if (!isDelete) return
  const target = e.target
  const root = document.getElementById('vditor')
  if (!root) return
  const selection = window.getSelection && window.getSelection()
  if (!selection) return
  let node = selection.anchorNode
  if (!node && target instanceof Node) node = target
  if (!node) return
  let el = node.nodeType === 1 ? node : node.parentElement
  while (el && el !== root && el.tagName !== 'IMG') {
    el = el.parentElement
  }
  if (el && el.tagName === 'IMG') {
    e.preventDefault()
    removeImageByDom(el)
  }
}

function onClickHandler(e) {
  if (!e || !e.target) return
  const root = document.getElementById('vditor')
  if (!root) return
  let el = e.target
  while (el && el !== root && el.tagName !== 'IMG') {
    el = el.parentElement
  }
  if (el && el.tagName === 'IMG' && e.altKey) {
    e.preventDefault()
    removeImageByDom(el)
  }
}

function removeImageByDom(imgEl) {
  if (!imgEl) return
  let originalSrc = imgEl.getAttribute('data-original-src') || ''
  if (!originalSrc) {
    const currentSrc = imgEl.getAttribute('src') || ''
    if (currentSrc.startsWith('blob:')) {
      // 反向从缓存中查找原始预览地址
      for (const [cachedOriginal, cachedBlob] of blobUrlCache.entries()) {
        if (cachedBlob === currentSrc) {
          originalSrc = cachedOriginal
          break
        }
      }
    } else {
      originalSrc = currentSrc
    }
  }
  if (!originalSrc) return
  const current = vditor ? vditor.getValue() : localContent.value
  const updated = removeFirstImageBySrcFromMarkdown(current, originalSrc)
  if (updated !== current) {
    vditor.setValue(updated)
    emit('update:content', updated)
    scheduleUpgradePreviewImagesToBlob()
  }
}

function removeFirstImageBySrcFromMarkdown(md, src) {
  if (!md || !src) return md
  const mdRe = new RegExp(`!\\[[^\\]]*\\]\\((?:\\s*|\\n*)${escapeRegExp(src)}\\)`)
  if (mdRe.test(md)) {
    return md.replace(mdRe, '').replace(/\n{3,}/g, '\n\n')
  }
  const htmlRe = new RegExp(`<img[^>]+src=["']${escapeRegExp(src)}["'][^>]*>\\n?`, 'i')
  if (htmlRe.test(md)) {
    return md.replace(htmlRe, '').replace(/\n{3,}/g, '\n\n')
  }
  return md
}

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

onUnmounted(() => {
  const root = document.getElementById('vditor')
  if (root) {
    root.removeEventListener('paste', onPasteHandler)
    root.removeEventListener('drop', onDropHandler)
    root.removeEventListener('keydown', onKeydownHandler, true)
    root.removeEventListener('click', onClickHandler, true)
  }
  // 清理 blob URL
  for (const url of blobUrlsToRevoke) {
    try { URL.revokeObjectURL(url) } catch {}
  }
  blobUrlCache.clear()
  blobUrlsToRevoke.clear()
})
</script>

<style scoped>
/* 基础样式 */
.vditor-container {
  border-radius: 8px;
  overflow: visible !important;
  position: relative;
}

:deep(.vditor) {
  --toolbar-background: #f8f9fa;
  --toolbar-icon-color: #4a4a4a;
  --toolbar-icon-hover-color: #1e80ff;
  --toolbar-height: 45px;
  --toolbar-divider-margin: 10px;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  position: relative;
}

/* 标题样式 */
:deep(.vditor-reset h1) {
  font-size: 28px;
  font-weight: 600;
  margin: 1.5em 0 1em;
  padding-bottom: 0.3em;
  border-bottom: 1px solid #eaecef;
}

:deep(.vditor-reset h2) {
  font-size: 24px;
  font-weight: 600;
  margin: 1.5em 0 1em;
  padding-bottom: 0.3em;
  border-bottom: 1px solid #eaecef;
}

:deep(.vditor-reset h3) {
  font-size: 20px;
  font-weight: 600;
  margin: 1.2em 0 0.8em;
}

/* 代码块样式 */
:deep(.vditor-reset pre) {
  background: #2b2b2b !important;
  border-radius: 5px !important;
  padding: 1em !important;
  margin: 1em 0 !important;
  overflow: auto !important;
}

:deep(.vditor-reset pre code) {
  color: #ccc !important;
  font-family: Consolas, Monaco, 'Andale Mono', monospace !important;
  font-size: 14px !important;
  line-height: 1.6 !important;
  background: transparent !important;
  border-radius: 0 !important;
  padding: 0 !important;
  white-space: pre !important;
}

/* 行内代码样式 */
:deep(.vditor-reset code:not(pre code)) {
  background: rgba(27,31,35,.05) !important;
  border-radius: 3px !important;
  font-size: 85% !important;
  margin: 0 !important;
  padding: 0.2em 0.4em !important;
  color: #333 !important;
}

/* 列表样式 */
:deep(.vditor-reset ul),
:deep(.vditor-reset ol) {
  padding-left: 2em !important;
  margin: 1em 0 !important;
}

:deep(.vditor-reset li) {
  margin: 0.5em 0 !important;
  line-height: 1.6 !important;
}

/* 引用样式 */
:deep(.vditor-reset blockquote) {
  margin: 1em 0 !important;
  padding: 0 1em !important;
  color: #666 !important;
  border-left: 0.25em solid #dfe2e5 !important;
}

/* 表格样式 */
:deep(.vditor-reset table) {
  border-collapse: collapse !important;
  margin: 1em 0 !important;
  width: 100% !important;
}

:deep(.vditor-reset th),
:deep(.vditor-reset td) {
  border: 1px solid #dfe2e5 !important;
  padding: 0.6em 1em !important;
}

:deep(.vditor-reset th) {
  background-color: #f6f8fa !important;
  font-weight: 600 !important;
}

/* 链接样式 */
:deep(.vditor-reset a) {
  color: #0366d6 !important;
  text-decoration: none !important;
}

:deep(.vditor-reset a:hover) {
  text-decoration: underline !important;
}

/* 图片样式 */
:deep(.vditor-reset img) {
  max-width: 100% !important;
  margin: 1em 0 !important;
  border-radius: 4px !important;
}

/* 段落样式 */
:deep(.vditor-reset p) {
  margin: 1em 0 !important;
  line-height: 1.8 !important;
  color: #24292e !important;
}

/* 去除多余符号 */
:deep(.vditor-ir pre.vditor-reset) {
  background-color: var(--panel-background-color) !important;
  margin: 0 !important;
  padding: 0 !important;
}

:deep(.vditor-ir) {
  padding: 24px !important;
}

:deep(.vditor-ir__marker) {
  display: none !important;
}

:deep(.vditor-ir__node) {
  padding: 0 !important;
  margin: 0 !important;
}

/* 代码高亮颜色 */
:deep(.hljs-comment) { color: #969896 !important; }
:deep(.hljs-string) { color: #183691 !important; }
:deep(.hljs-keyword) { color: #a71d5d !important; }
:deep(.hljs-function) { color: #0086b3 !important; }
:deep(.hljs-number) { color: #0086b3 !important; }
:deep(.hljs-tag) { color: #63a35c !important; }
:deep(.hljs-attribute) { color: #795da3 !important; }
:deep(.hljs-title) { color: #795da3 !important; }
:deep(.hljs-built_in) { color: #0086b3 !important; }
:deep(.hljs-literal) { color: #0086b3 !important; }
:deep(.hljs-addition) { color: #55a532 !important; }
:deep(.hljs-deletion) { color: #bd2c00 !important; }
</style> 
