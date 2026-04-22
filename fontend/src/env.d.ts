/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  readonly VITE_DEV_PROXY_TARGET?: string
  readonly VITE_ATTACHMENT_COMPRESS?: string
  readonly VITE_ATTACHMENT_QUALITY?: string
  readonly VITE_ATTACHMENT_MAX_WIDTH?: string
  readonly VITE_ATTACHMENT_MAX_HEIGHT?: string
  readonly VITE_ATTACHMENT_PREVIEW_ABSOLUTE?: string
  readonly VITE_ATTACHMENT_PREVIEW_BASE_URL?: string
  readonly VITE_ATTACHMENT_PREVIEW_UPGRADE_BLOB?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

