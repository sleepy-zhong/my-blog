<template>
  <div class="settings-page w-full min-h-screen p-0 m-0">
    <div class="settings-header w-full flex items-center justify-between bg-white border-b px-6 py-4">
      <div class="header-copy">
        <span class="header-kicker">System Settings</span>
        <h2 class="text-2xl font-bold text-blue-700">系统设置</h2>
      </div>
      <button @click="saveSettings" :disabled="saving || loading" class="btn-primary">
        {{ saving ? '保存中...' : '保存设置' }}
      </button>
    </div>

    <div class="settings-shell w-full bg-white rounded-xl shadow p-6 border mt-6">
      <div v-if="loadError" class="status-banner error-banner">
        {{ loadError }}
      </div>

      <div v-if="loading" class="loading-state">
        正在加载系统设置...
      </div>

      <form v-else @submit.prevent="saveSettings" class="space-y-6">
        <section class="section-card border-b pb-6">
          <div class="section-head">
            <div>
              <h3 class="text-lg font-bold text-gray-800">基本信息</h3>
              <p class="section-desc">这些内容会影响站点名称、图标和 SEO 基础信息。</p>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <label class="field-block">
              <span>网站名称</span>
              <input
                v-model.trim="settings.siteName"
                type="text"
                class="input w-full"
                maxlength="120"
                placeholder="请输入网站名称"
              />
            </label>

            <label class="field-block">
              <span>网站描述</span>
              <input
                v-model.trim="settings.description"
                type="text"
                class="input w-full"
                maxlength="500"
                placeholder="请输入网站描述"
              />
            </label>

            <div class="field-block asset-field">
              <span>Logo URL</span>
              <input
                v-model.trim="settings.logoURL"
                type="text"
                class="input w-full"
                maxlength="500"
                placeholder="请输入 Logo 图片地址"
              />
              <div class="asset-actions">
                <button type="button" class="btn-secondary" :disabled="uploadingAssetField === 'logoURL'" @click="triggerAssetUpload('logoURL')">
                  {{ uploadingAssetField === 'logoURL' ? '上传中...' : '上传图片' }}
                </button>
                <button type="button" class="btn-secondary" @click="openAssetPicker('logoURL')">
                  从附件库选择
                </button>
                <button type="button" class="btn-danger" :disabled="!settings.logoURL" @click="clearAssetField('logoURL')">
                  清空
                </button>
              </div>
              <div v-if="settings.logoURL" class="asset-preview-card">
                <img :src="resolveAssetPreview(settings.logoURL)" alt="Logo 预览" class="asset-preview-image" />
                <div class="asset-preview-copy">
                  <strong>当前 Logo 预览</strong>
                  <span>{{ settings.logoURL }}</span>
                </div>
              </div>
            </div>

            <div class="field-block asset-field">
              <span>Favicon URL</span>
              <input
                v-model.trim="settings.faviconURL"
                type="text"
                class="input w-full"
                maxlength="500"
                placeholder="请输入 Favicon 图片地址"
              />
              <div class="asset-actions">
                <button type="button" class="btn-secondary" :disabled="uploadingAssetField === 'faviconURL'" @click="triggerAssetUpload('faviconURL')">
                  {{ uploadingAssetField === 'faviconURL' ? '上传中...' : '上传图片' }}
                </button>
                <button type="button" class="btn-secondary" @click="openAssetPicker('faviconURL')">
                  从附件库选择
                </button>
                <button type="button" class="btn-danger" :disabled="!settings.faviconURL" @click="clearAssetField('faviconURL')">
                  清空
                </button>
              </div>
              <p class="section-desc">建议使用正方形图片，优先 PNG 或 SVG。</p>
              <div v-if="settings.faviconURL" class="asset-preview-card favicon-preview-card">
                <img :src="resolveAssetPreview(settings.faviconURL)" alt="Favicon 预览" class="asset-preview-image favicon-preview-image" />
                <div class="asset-preview-copy">
                  <strong>当前 Favicon 预览</strong>
                  <span>{{ settings.faviconURL }}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section class="section-card border-b pb-6">
          <div class="section-head">
            <div>
              <h3 class="text-lg font-bold text-gray-800">社交链接</h3>
              <p class="section-desc">在首页或页脚展示你的外部平台入口。</p>
            </div>
            <button @click="addSocialLink" type="button" class="btn-secondary">
              添加链接
            </button>
          </div>

          <div class="space-y-3 mt-4">
            <div v-if="!settings.socialLinks.length" class="empty-hint">
              还没有配置社交链接。
            </div>

            <div v-for="(link, index) in settings.socialLinks" :key="index" class="social-link-row flex gap-2">
              <input
                v-model.trim="link.name"
                type="text"
                class="input flex-1"
                maxlength="80"
                placeholder="平台名称"
              />
              <input
                v-model.trim="link.url"
                type="url"
                class="input flex-1"
                maxlength="500"
                placeholder="链接地址"
              />
              <button
                @click="removeSocialLink(index)"
                type="button"
                class="btn-danger px-3"
              >
                删除
              </button>
            </div>
          </div>
        </section>

        <section class="section-card border-b pb-6">
          <div class="section-head">
            <div>
              <h3 class="text-lg font-bold text-gray-800">网站分析</h3>
              <p class="section-desc">可粘贴统计代码片段，后端将真实保存。</p>
            </div>
          </div>

          <label class="field-block mt-4">
            <span>统计代码</span>
            <textarea
              v-model="settings.analytics"
              rows="5"
              class="input w-full"
              placeholder="请输入 Google Analytics 或其他统计代码"
            ></textarea>
          </label>
        </section>

        <section class="section-card border-b pb-6">
          <div class="section-head">
            <div>
              <h3 class="text-lg font-bold text-gray-800">邮件测试</h3>
              <p class="section-desc">这里调用真实邮件接口，不再走假请求。</p>
            </div>
          </div>

          <div class="email-test-row flex gap-2 mt-4">
            <input
              v-model.trim="testEmail"
              type="email"
              class="input flex-1"
              placeholder="输入测试邮箱地址"
            />
            <button
              @click="sendTestEmail"
              type="button"
              :disabled="!testEmail || testingEmail"
              class="btn-secondary"
            >
              {{ testingEmail ? '发送中...' : '发送测试邮件' }}
            </button>
          </div>
        </section>

        <section class="section-card border-b pb-6">
          <div class="section-head">
            <div>
              <h3 class="text-lg font-bold text-gray-800">Redis 缓存面板</h3>
              <p class="section-desc">展示 Redis 健康状态、公开缓存键数量、命中率，以及最近失效记录。</p>
            </div>
            <div class="redis-actions">
              <button @click="fetchRedisDiagnostics" type="button" :disabled="redisLoading || redisClearing" class="btn-secondary">
                {{ redisLoading ? '刷新中...' : '刷新 Redis' }}
              </button>
              <button @click="clearPublicCache" type="button" :disabled="redisLoading || redisClearing" class="btn-danger">
                {{ redisClearing ? '清理中...' : '清理公开缓存' }}
              </button>
            </div>
          </div>

          <div v-if="redisError" class="status-banner error-banner mt-4">
            {{ redisError }}
          </div>

          <div
            v-if="redisLastChecked"
            class="status-banner redis-banner mt-4"
            :class="redisHealth.connected && redisHealth.ping ? 'redis-banner--online' : 'redis-banner--offline'"
          >
            <div class="redis-banner-main">
              <span
                class="status-pill"
                :class="redisHealth.connected && redisHealth.ping ? 'status-pill--online' : 'status-pill--offline'"
              >
                {{ redisStatusText }}
              </span>
              <strong>{{ redisTargetText }}</strong>
            </div>
            <span class="redis-banner-meta">
              {{ redisMetaText }}
            </span>
          </div>

          <div v-if="redisLoading && !redisLastChecked" class="loading-state mt-4">
            正在加载 Redis 状态...
          </div>

          <template v-else-if="redisLastChecked">
            <div class="stats-grid mt-4">
              <div v-for="card in redisSummaryCards" :key="card.label" class="info-card compact-info-card">
                <span class="info-label">{{ card.label }}</span>
                <strong>{{ card.value }}</strong>
                <span class="info-subtext">{{ card.detail }}</span>
              </div>
            </div>

            <div class="cache-group-shell mt-4">
              <div class="group-shell-head">
                <span class="info-label">公开缓存分组</span>
                <span class="info-subtext">最后检查：{{ formatDisplayDate(redisLastChecked) }}</span>
              </div>

              <p class="panel-note">
                同一篇文章或同一组筛选重复访问时，分组数量通常不会继续增长；会变化的是命中次数、未命中次数和命中率。
              </p>

              <div class="cache-group-grid">
                <div v-for="group in redisGroupCards" :key="group.label" class="cache-group-card">
                  <span class="info-label">{{ group.label }}</span>
                  <strong class="cache-group-count">{{ group.value }}</strong>
                </div>
              </div>
            </div>

            <div class="cache-group-shell mt-4">
              <div class="group-shell-head">
                <span class="info-label">最近失效记录</span>
                <span class="info-subtext">用于确认后台写操作或手动清理是否真正删除了缓存键</span>
              </div>

              <div v-if="!redisRecentInvalidations.length" class="empty-hint compact-empty">
                还没有缓存失效记录。
              </div>

              <div v-else class="invalidation-list">
                <div v-for="(item, index) in redisRecentInvalidations" :key="`${item.at || 'unknown'}-${index}`" class="invalidation-item">
                  <div class="invalidation-row">
                    <strong>{{ item.reason === 'manual-clear' ? '手动清理' : `${item.method || 'UNKNOWN'} ${item.path || ''}` }}</strong>
                    <span class="info-subtext">{{ formatDisplayDate(item.at) }}</span>
                  </div>
                  <div class="invalidation-row">
                    <span class="info-subtext">删除键数：{{ formatNumber(item.deletedCount) }}</span>
                    <span class="info-subtext">模式：{{ formatPatternList(item.patterns) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </section>

        <section class="section-card">
          <div class="section-head">
            <div>
              <h3 class="text-lg font-bold text-gray-800">系统信息</h3>
              <p class="section-desc">当前页面已经接上数据库存储与真实后端接口。</p>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-sm">
            <div class="info-card">
              <span class="info-label">接口状态</span>
              <strong>真实接口</strong>
            </div>
            <div class="info-card">
              <span class="info-label">当前版本</span>
              <strong>v1.0.0</strong>
            </div>
            <div class="info-card">
              <span class="info-label">最后更新</span>
              <strong>{{ formatDisplayDate(settings.lastUpdated) }}</strong>
            </div>
          </div>
        </section>

        <input
          ref="assetUploadInput"
          type="file"
          accept="image/*"
          class="sr-only"
          @change="handleAssetFileChange"
        />
      </form>
    </div>

    <div v-if="assetPickerOpen" class="asset-picker-mask">
      <div class="asset-picker-dialog">
        <div class="asset-picker-head">
          <div>
            <h3 class="text-lg font-bold text-gray-800">选择图片</h3>
            <p class="section-desc">从附件库选择一张图片作为{{ assetPickerTargetLabel }}。</p>
          </div>
          <button type="button" class="btn-danger px-3" @click="closeAssetPicker">关闭</button>
        </div>

        <div class="asset-picker-toolbar">
          <input
            v-model.trim="assetPickerKeyword"
            type="text"
            class="input flex-1"
            placeholder="按文件名搜索图片"
            @keyup.enter="fetchAttachmentLibrary"
          />
          <button type="button" class="btn-secondary" :disabled="assetPickerLoading" @click="fetchAttachmentLibrary">
            {{ assetPickerLoading ? '加载中...' : '搜索' }}
          </button>
        </div>

        <div v-if="assetPickerError" class="status-banner error-banner">
          {{ assetPickerError }}
        </div>

        <div v-if="assetPickerLoading" class="loading-state">
          正在加载附件库...
        </div>

        <div v-else-if="!assetPickerItems.length" class="empty-hint compact-empty">
          暂无可选图片。
        </div>

        <div v-else class="asset-library-grid">
          <button
            v-for="item in assetPickerItems"
            :key="item.AttachmentID"
            type="button"
            class="asset-library-card"
            @click="selectAssetFromLibrary(item)"
          >
            <img :src="resolveAttachmentItemPreview(item)" :alt="item.OriginalName || '附件预览'" class="asset-library-image" />
            <div class="asset-library-copy">
              <strong>{{ item.OriginalName || `附件 #${item.AttachmentID}` }}</strong>
              <span>{{ item.MimeType }}</span>
              <span>{{ formatFileSize(item.FileSize) }}</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { getSettings, updateSettings, sendTestEmail as sendTestEmailApi } from '@/api/settings'
import { clearPublicRedisCache, getRedisHealth, getRedisStats } from '@/api/redis'
import { getAttachmentPreviewInfo, getAttachments, uploadAttachment } from '@/api/attachments'
import { useSettingsStore } from '@/store/user'
import { broadcastSiteBranding } from '@/utils/siteBranding'

function createDefaultSettings() {
  return {
    siteName: 'TechBlogDB',
    description: '一个技术博客系统',
    logoURL: '',
    faviconURL: '',
    analytics: '',
    socialLinks: [],
    lastUpdated: '',
  }
}

function createDefaultRedisHealth() {
  return {
    enabled: false,
    connected: false,
    ping: false,
    status: 'unknown',
    target: '',
    host: '',
    port: 0,
    db: 0,
    clientStatus: 'disconnected',
    timestamp: '',
  }
}

function createDefaultRedisStats() {
  return {
    connected: false,
    dbSize: 0,
    info: {},
    cacheOverview: {
      totalPublicCacheKeys: 0,
      groups: {
        articles: 0,
        articleDetails: 0,
        homeCats: 0,
        categories: 0,
        categorySummary: 0,
        tags: 0,
        tagPopular: 0,
        settings: 0,
      },
      metrics: {
        hits: 0,
        misses: 0,
        writes: 0,
        invalidatedKeys: 0,
        requestCount: 0,
        hitRate: 0,
      },
      activity: {
        lastHitAt: '',
        lastMissAt: '',
        lastWriteAt: '',
        lastInvalidatedAt: '',
      },
    },
    recentInvalidations: [],
    timestamp: '',
  }
}

function resetRedisDiagnostics() {
  redisHealth.value = createDefaultRedisHealth()
  redisStats.value = createDefaultRedisStats()
}

function resolveRedisRequestErrorMessage(error, fallbackMessage) {
  const status = Number(error?.response?.status || 0)

  if (status === 404) {
    return 'Redis 管理接口不可用，请检查后端路由是否正常部署'
  }

  if (status === 503) {
    return 'Redis 当前未连接，暂时无法读取或清理缓存'
  }

  return error?.response?.data?.message || error?.message || fallbackMessage
}

function toSafeNumber(value, fallback = 0) {
  const normalized = Number(value)
  return Number.isFinite(normalized) ? normalized : fallback
}

function normalizeSocialLinks(value) {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((item) => ({
      name: String(item?.name ?? item?.Name ?? '').trim(),
      url: String(item?.url ?? item?.URL ?? item?.Url ?? '').trim(),
    }))
    .filter((item) => item.name || item.url)
}

function mapSettingsPayload(payload = {}) {
  const defaults = createDefaultSettings()

  return {
    siteName: String(payload.SiteName ?? payload.siteName ?? defaults.siteName).trim(),
    description: String(payload.Description ?? payload.description ?? defaults.description).trim(),
    logoURL: String(payload.LogoURL ?? payload.logoURL ?? defaults.logoURL).trim(),
    faviconURL: String(payload.FaviconURL ?? payload.faviconURL ?? defaults.faviconURL).trim(),
    analytics: String(payload.Analytics ?? payload.analytics ?? defaults.analytics),
    socialLinks: normalizeSocialLinks(payload.SocialLinks ?? payload.socialLinks),
    lastUpdated: String(payload.UpdatedAt ?? payload.updatedAt ?? ''),
  }
}

function resolveAssetPreview(url) {
  return String(url || '').trim()
}

function isImageAttachment(item) {
  return String(item?.MimeType || '').toLowerCase().startsWith('image/')
}

function buildAttachmentPreviewFallback(attachmentId) {
  return attachmentId ? `/api/attachments/${attachmentId}/preview` : ''
}

async function resolveAttachmentPreviewURL(attachment) {
  const attachmentId = Number(attachment?.AttachmentID || 0)
  if (!attachmentId) return ''

  try {
    const res = await getAttachmentPreviewInfo(attachmentId)
    if (res.code === 0) {
      return String(res.data?.previewUrl || res.data?.downloadUrl || buildAttachmentPreviewFallback(attachmentId))
    }
  } catch (error) {
    console.error('[Settings.vue] 获取附件预览地址失败:', error)
  }

  return buildAttachmentPreviewFallback(attachmentId)
}

function mapRedisHealth(payload = {}) {
  const defaults = createDefaultRedisHealth()

  return {
    enabled: Boolean(payload.enabled ?? defaults.enabled),
    connected: Boolean(payload.connected ?? defaults.connected),
    ping: Boolean(payload.ping ?? defaults.ping),
    status: String(payload.status ?? defaults.status),
    target: String(payload.target ?? defaults.target),
    host: String(payload.host ?? defaults.host),
    port: toSafeNumber(payload.port, defaults.port),
    db: toSafeNumber(payload.db, defaults.db),
    clientStatus: String(payload.clientStatus ?? defaults.clientStatus),
    timestamp: String(payload.timestamp ?? ''),
  }
}

function mapRedisStats(payload = {}) {
  const defaults = createDefaultRedisStats()
  const groups = payload.cacheOverview?.groups ?? {}
  const metrics = payload.cacheOverview?.metrics ?? {}
  const activity = payload.cacheOverview?.activity ?? {}

  return {
    connected: Boolean(payload.connected ?? defaults.connected),
    dbSize: toSafeNumber(payload.dbSize, defaults.dbSize),
    info: payload.info && typeof payload.info === 'object' ? payload.info : {},
    cacheOverview: {
      totalPublicCacheKeys: toSafeNumber(
        payload.cacheOverview?.totalPublicCacheKeys,
        defaults.cacheOverview.totalPublicCacheKeys,
      ),
      groups: {
        articles: toSafeNumber(groups.articles, defaults.cacheOverview.groups.articles),
        articleDetails: toSafeNumber(groups.articleDetails, defaults.cacheOverview.groups.articleDetails),
        homeCats: toSafeNumber(groups.homeCats, defaults.cacheOverview.groups.homeCats),
        categories: toSafeNumber(groups.categories, defaults.cacheOverview.groups.categories),
        categorySummary: toSafeNumber(groups.categorySummary, defaults.cacheOverview.groups.categorySummary),
        tags: toSafeNumber(groups.tags, defaults.cacheOverview.groups.tags),
        tagPopular: toSafeNumber(groups.tagPopular, defaults.cacheOverview.groups.tagPopular),
        settings: toSafeNumber(groups.settings, defaults.cacheOverview.groups.settings),
      },
      metrics: {
        hits: toSafeNumber(metrics.hits, defaults.cacheOverview.metrics.hits),
        misses: toSafeNumber(metrics.misses, defaults.cacheOverview.metrics.misses),
        writes: toSafeNumber(metrics.writes, defaults.cacheOverview.metrics.writes),
        invalidatedKeys: toSafeNumber(
          metrics.invalidatedKeys,
          defaults.cacheOverview.metrics.invalidatedKeys,
        ),
        requestCount: toSafeNumber(metrics.requestCount, defaults.cacheOverview.metrics.requestCount),
        hitRate: toSafeNumber(metrics.hitRate, defaults.cacheOverview.metrics.hitRate),
      },
      activity: {
        lastHitAt: String(activity.lastHitAt ?? defaults.cacheOverview.activity.lastHitAt),
        lastMissAt: String(activity.lastMissAt ?? defaults.cacheOverview.activity.lastMissAt),
        lastWriteAt: String(activity.lastWriteAt ?? defaults.cacheOverview.activity.lastWriteAt),
        lastInvalidatedAt: String(
          activity.lastInvalidatedAt ?? defaults.cacheOverview.activity.lastInvalidatedAt,
        ),
      },
    },
    recentInvalidations: Array.isArray(payload.recentInvalidations) ? payload.recentInvalidations : [],
    timestamp: String(payload.timestamp ?? ''),
  }
}

const settings = ref(createDefaultSettings())
const settingsStore = useSettingsStore()
const loading = ref(false)
const loadError = ref('')
const saving = ref(false)
const assetUploadInput = ref(null)
const activeUploadField = ref('')
const uploadingAssetField = ref('')
const assetPickerOpen = ref(false)
const assetPickerTarget = ref('')
const assetPickerLoading = ref(false)
const assetPickerError = ref('')
const assetPickerKeyword = ref('')
const assetPickerItems = ref([])
const testEmail = ref('')
const testingEmail = ref(false)
const redisLoading = ref(false)
const redisClearing = ref(false)
const redisError = ref('')
const redisHealth = ref(createDefaultRedisHealth())
const redisStats = ref(createDefaultRedisStats())

const redisLastChecked = computed(() => redisStats.value.timestamp || redisHealth.value.timestamp || '')

const redisStatusText = computed(() => {
  if (!redisHealth.value.enabled) return '已禁用'
  if (redisHealth.value.connected && redisHealth.value.ping) return '已连接'
  if (redisHealth.value.connected) return '连接异常'
  return '未连接'
})

const redisTargetText = computed(() => {
  if (redisHealth.value.target) {
    return redisHealth.value.target
  }

  if (!redisHealth.value.enabled) {
    return '当前环境未启用 Redis'
  }

  return 'Redis 目标实例未返回'
})

const redisMetaText = computed(() => {
  if (!redisHealth.value.enabled) {
    return '未启用缓存服务'
  }

  return `Host ${redisHealth.value.host || '--'} · Port ${redisHealth.value.port || '--'} · DB ${redisHealth.value.db} · Client ${redisHealth.value.clientStatus || 'unknown'}`
})

const redisSummaryCards = computed(() => {
  const overview = redisStats.value.cacheOverview
  const info = redisStats.value.info || {}
  const activity = overview.activity || {}

  return [
    {
      label: 'Redis 状态',
      value: redisStatusText.value,
      detail: redisHealth.value.ping ? 'PING 正常' : 'PING 未通过',
    },
    {
      label: 'DB Keys',
      value: formatNumber(redisStats.value.dbSize),
      detail: info.used_memory_human ? `内存 ${info.used_memory_human}` : '实例当前键总数',
    },
    {
      label: '公开缓存键',
      value: formatNumber(overview.totalPublicCacheKeys),
      detail: 'public:* 分组总数',
    },
    {
      label: '命中次数',
      value: formatNumber(overview.metrics.hits),
      detail: 'GET 命中累计',
    },
    {
      label: '未命中',
      value: formatNumber(overview.metrics.misses),
      detail: activity.lastMissAt ? `最近未命中 ${formatDisplayDate(activity.lastMissAt)}` : '暂无未命中记录',
    },
    {
      label: '命中率',
      value: formatPercent(overview.metrics.hitRate),
      detail: `请求数 ${formatNumber(overview.metrics.requestCount)}`,
    },
    {
      label: '写入次数',
      value: formatNumber(overview.metrics.writes),
      detail: activity.lastWriteAt ? `最近写入 ${formatDisplayDate(activity.lastWriteAt)}` : '暂无写入记录',
    },
    {
      label: '失效清理',
      value: formatNumber(overview.metrics.invalidatedKeys),
      detail: activity.lastInvalidatedAt ? `最近失效 ${formatDisplayDate(activity.lastInvalidatedAt)}` : '暂无失效记录',
    },
  ]
})

const redisGroupCards = computed(() => {
  const groups = redisStats.value.cacheOverview.groups

  return [
    { label: '文章列表', value: formatNumber(groups.articles) },
    { label: '文章详情', value: formatNumber(groups.articleDetails) },
    { label: '首页猫猫', value: formatNumber(groups.homeCats) },
    { label: '分类列表', value: formatNumber(groups.categories) },
    { label: '分类汇总', value: formatNumber(groups.categorySummary) },
    { label: '标签列表', value: formatNumber(groups.tags) },
    { label: '热门标签', value: formatNumber(groups.tagPopular) },
    { label: '站点设置', value: formatNumber(groups.settings) },
  ]
})

const redisRecentInvalidations = computed(() => redisStats.value.recentInvalidations || [])
const assetPickerTargetLabel = computed(() => assetPickerTarget.value === 'faviconURL' ? 'Favicon' : 'Logo')

async function fetchSettings() {
  loading.value = true
  loadError.value = ''

  try {
    const res = await getSettings()
    if (res.code !== 0) {
      throw new Error(res.message || '获取系统设置失败')
    }

    settings.value = mapSettingsPayload(res.data || {})
  } catch (error) {
    console.error('[Settings.vue] 获取系统设置失败:', error)
    settings.value = createDefaultSettings()
    loadError.value = error?.response?.data?.message || error?.message || '获取系统设置失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

async function fetchRedisDiagnostics() {
  redisLoading.value = true
  redisError.value = ''

  try {
    const healthRes = await getRedisHealth()
    if (healthRes.code !== 0) {
      throw new Error(healthRes.message || '获取 Redis 健康状态失败')
    }

    const healthPayload = mapRedisHealth(healthRes.data || {})
    redisHealth.value = healthPayload

    if (!healthPayload.enabled || !healthPayload.connected) {
      redisStats.value = createDefaultRedisStats()
      return
    }

    const statsRes = await getRedisStats()
    if (statsRes.code !== 0) {
      throw new Error(statsRes.message || '获取 Redis 统计失败')
    }

    redisStats.value = mapRedisStats(statsRes.data || {})
  } catch (error) {
    console.error('[Settings.vue] 获取 Redis 状态失败:', error)
    resetRedisDiagnostics()
    redisError.value = resolveRedisRequestErrorMessage(error, '获取 Redis 状态失败，请稍后重试')
  } finally {
    redisLoading.value = false
  }
}

async function clearPublicCache() {
  if (!window.confirm('确认清理全部公开缓存吗？清理后首次访问会重新回源数据库。')) {
    return
  }

  redisClearing.value = true
  redisError.value = ''

  try {
    const res = await clearPublicRedisCache()
    if (res.code !== 0) {
      throw new Error(res.message || '清理 Redis 公开缓存失败')
    }

    await fetchRedisDiagnostics()
    window.alert(`公开缓存已清理，删除 ${formatNumber(res.data?.deletedCount)} 个键`)
  } catch (error) {
    console.error('[Settings.vue] 清理 Redis 公开缓存失败:', error)
    const status = Number(error?.response?.status || 0)
    if (status === 404 || status === 503) {
      resetRedisDiagnostics()
    }
    redisError.value = resolveRedisRequestErrorMessage(error, '清理 Redis 公开缓存失败')
  } finally {
    redisClearing.value = false
  }
}

function buildSubmitPayload() {
  return {
    siteName: settings.value.siteName.trim(),
    description: settings.value.description.trim(),
    logoURL: settings.value.logoURL.trim(),
    faviconURL: settings.value.faviconURL.trim(),
    analytics: settings.value.analytics,
    socialLinks: normalizeSocialLinks(settings.value.socialLinks),
  }
}

function clearAssetField(field) {
  settings.value[field] = ''
}

function triggerAssetUpload(field) {
  activeUploadField.value = field
  assetUploadInput.value?.click()
}

async function handleAssetFileChange(event) {
  const input = event?.target
  const file = input?.files?.[0]
  const field = activeUploadField.value

  if (!file || !field) {
    if (input) input.value = ''
    return
  }

  uploadingAssetField.value = field

  try {
    const uploadRes = await uploadAttachment(file, {
      description: `site-branding:${field}`,
      compress: false
    })

    if (uploadRes.code !== 0) {
      throw new Error(uploadRes.message || '上传图片失败')
    }

    const previewURL = await resolveAttachmentPreviewURL(uploadRes.data)
    if (!previewURL) {
      throw new Error('上传成功，但未能获取图片预览地址')
    }

    settings.value[field] = previewURL
    window.alert(`${field === 'faviconURL' ? 'Favicon' : 'Logo'} 图片上传成功，记得点击“保存设置”后才会写入数据库`)
  } catch (error) {
    console.error('[Settings.vue] 上传站点图片失败:', error)
    window.alert(error?.response?.data?.message || error?.message || '上传图片失败，请稍后重试')
  } finally {
    if (input) input.value = ''
    uploadingAssetField.value = ''
    activeUploadField.value = ''
  }
}

function closeAssetPicker() {
  assetPickerOpen.value = false
  assetPickerTarget.value = ''
  assetPickerError.value = ''
}

async function fetchAttachmentLibrary() {
  assetPickerLoading.value = true
  assetPickerError.value = ''

  try {
    const res = await getAttachments({
      page: 1,
      pageSize: 80,
      keyword: assetPickerKeyword.value.trim() || undefined
    })

    if (res.code !== 0) {
      throw new Error(res.message || '加载附件库失败')
    }

    assetPickerItems.value = (res.data?.list || []).filter(isImageAttachment)
  } catch (error) {
    console.error('[Settings.vue] 获取附件库失败:', error)
    assetPickerItems.value = []
    assetPickerError.value = error?.response?.data?.message || error?.message || '加载附件库失败，请稍后重试'
  } finally {
    assetPickerLoading.value = false
  }
}

async function openAssetPicker(field) {
  assetPickerTarget.value = field
  assetPickerOpen.value = true
  await fetchAttachmentLibrary()
}

async function selectAssetFromLibrary(item) {
  try {
    const previewURL = await resolveAttachmentPreviewURL(item)
    if (!previewURL) {
      throw new Error('未能获取附件预览地址')
    }

    settings.value[assetPickerTarget.value] = previewURL
    closeAssetPicker()
  } catch (error) {
    console.error('[Settings.vue] 选择附件失败:', error)
    assetPickerError.value = error?.response?.data?.message || error?.message || '选择附件失败，请稍后重试'
  }
}

function resolveAttachmentItemPreview(item) {
  return buildAttachmentPreviewFallback(item?.AttachmentID)
}

async function saveSettings() {
  saving.value = true

  try {
    const res = await updateSettings(buildSubmitPayload())
    if (res.code !== 0) {
      throw new Error(res.message || '保存系统设置失败')
    }

    settings.value = mapSettingsPayload(res.data || {})
    settingsStore.applyPublicSettings(res.data || {})
    loadError.value = ''
    broadcastSiteBranding(res.data || {})
    fetchRedisDiagnostics()
    window.alert('系统设置保存成功')
  } catch (error) {
    console.error('[Settings.vue] 保存系统设置失败:', error)
    window.alert(error?.response?.data?.message || error?.message || '保存失败，请稍后重试')
  } finally {
    saving.value = false
  }
}

async function sendTestEmail() {
  if (!testEmail.value) return

  testingEmail.value = true
  try {
    const res = await sendTestEmailApi(testEmail.value.trim())
    if (res.code !== 0) {
      throw new Error(res.message || '测试邮件发送失败')
    }

    window.alert('测试邮件发送成功')
    testEmail.value = ''
  } catch (error) {
    console.error('[Settings.vue] 发送测试邮件失败:', error)
    window.alert(error?.response?.data?.message || error?.message || '发送失败，请稍后重试')
  } finally {
    testingEmail.value = false
  }
}

function addSocialLink() {
  settings.value.socialLinks.push({ name: '', url: '' })
}

function removeSocialLink(index) {
  settings.value.socialLinks.splice(index, 1)
}

function formatDisplayDate(value) {
  if (!value) return '尚未更新'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '尚未更新'
  }

  return date.toLocaleString('zh-CN', { hour12: false })
}

function formatNumber(value) {
  return new Intl.NumberFormat('zh-CN').format(toSafeNumber(value))
}

function formatFileSize(value) {
  const size = toSafeNumber(value)
  if (size >= 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(2)} MB`
  if (size >= 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${size} B`
}

function formatPercent(value) {
  return `${(toSafeNumber(value) * 100).toFixed(1)}%`
}

function formatPatternList(value) {
  if (!Array.isArray(value) || !value.length) {
    return '--'
  }

  return value.join(', ')
}

onMounted(() => {
  fetchSettings()
  fetchRedisDiagnostics()
})
</script>

<style scoped>
.btn-primary {
  @apply bg-blue-500 text-white rounded px-4 py-2 hover:bg-blue-600 transition font-bold shadow disabled:cursor-not-allowed disabled:opacity-60;
}

.btn-secondary {
  @apply bg-gray-500 text-white rounded px-3 py-2 hover:bg-gray-600 transition font-bold shadow disabled:cursor-not-allowed disabled:opacity-60;
}

.btn-danger {
  @apply bg-red-500 text-white rounded px-3 py-2 hover:bg-red-600 transition font-bold shadow;
}

.input {
  @apply border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 transition;
}

.header-copy {
  display: grid;
  gap: 0.3rem;
}

.header-kicker {
  display: inline-flex;
  align-items: center;
  width: fit-content;
  padding: 0.25rem 0.55rem;
  border-radius: 999px;
  background: rgba(59, 130, 246, 0.12);
  color: #2563eb;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.section-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.redis-actions {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  flex-wrap: wrap;
}

.section-desc {
  margin-top: 0.35rem;
  color: #6b7280;
  font-size: 0.9rem;
  line-height: 1.6;
}

.field-block {
  display: grid;
  gap: 0.55rem;
}

.field-block > span {
  font-size: 0.9rem;
  font-weight: 600;
  color: #374151;
}

.asset-field {
  align-content: start;
}

.asset-actions {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  flex-wrap: wrap;
}

.asset-preview-card {
  display: grid;
  grid-template-columns: 88px minmax(0, 1fr);
  gap: 0.9rem;
  align-items: center;
  padding: 0.85rem 0.95rem;
  border-radius: 1rem;
  border: 1px solid #dbeafe;
  background: linear-gradient(135deg, rgba(239, 246, 255, 0.9), rgba(248, 250, 252, 0.96));
}

.favicon-preview-card {
  grid-template-columns: 64px minmax(0, 1fr);
}

.asset-preview-image {
  width: 88px;
  height: 88px;
  object-fit: contain;
  border-radius: 0.9rem;
  border: 1px solid #bfdbfe;
  background: #ffffff;
  padding: 0.5rem;
}

.favicon-preview-image {
  width: 64px;
  height: 64px;
  border-radius: 0.8rem;
}

.asset-preview-copy {
  display: grid;
  gap: 0.3rem;
  min-width: 0;
}

.asset-preview-copy strong {
  color: #111827;
}

.asset-preview-copy span {
  color: #6b7280;
  font-size: 0.8rem;
  line-height: 1.55;
  word-break: break-all;
}

.asset-picker-mask {
  position: fixed;
  inset: 0;
  z-index: 70;
  display: grid;
  place-items: center;
  padding: 1.25rem;
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(6px);
}

.asset-picker-dialog {
  width: min(1080px, 100%);
  max-height: min(88vh, 920px);
  display: grid;
  gap: 1rem;
  padding: 1.25rem;
  border-radius: 1.25rem;
  border: 1px solid #e5e7eb;
  background: #ffffff;
  box-shadow: 0 24px 64px rgba(15, 23, 42, 0.18);
  overflow: hidden;
}

.asset-picker-head,
.asset-picker-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.asset-library-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 0.95rem;
  overflow-y: auto;
  padding-right: 0.25rem;
}

.asset-library-card {
  display: grid;
  gap: 0.8rem;
  padding: 0.85rem;
  text-align: left;
  border-radius: 1rem;
  border: 1px solid #e5e7eb;
  background: #f8fafc;
  transition: border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
}

.asset-library-card:hover {
  border-color: #60a5fa;
  box-shadow: 0 12px 24px rgba(59, 130, 246, 0.12);
  transform: translateY(-1px);
}

.asset-library-image {
  width: 100%;
  aspect-ratio: 1 / 1;
  object-fit: contain;
  border-radius: 0.9rem;
  border: 1px solid #dbeafe;
  background: #ffffff;
  padding: 0.5rem;
}

.asset-library-copy {
  display: grid;
  gap: 0.22rem;
  min-width: 0;
}

.asset-library-copy strong {
  color: #111827;
  line-height: 1.45;
  word-break: break-word;
}

.asset-library-copy span {
  color: #6b7280;
  font-size: 0.8rem;
  line-height: 1.5;
  word-break: break-all;
}

.info-card {
  display: grid;
  gap: 0.35rem;
  padding: 0.95rem 1rem;
  border-radius: 0.9rem;
  background: #f8fafc;
  border: 1px solid #e5e7eb;
}

.info-label {
  color: #6b7280;
}

.info-subtext {
  color: #6b7280;
  font-size: 0.78rem;
  line-height: 1.45;
}

.status-banner {
  margin-bottom: 1rem;
  padding: 0.85rem 1rem;
  border-radius: 0.9rem;
  font-size: 0.92rem;
}

.error-banner {
  background: #fef2f2;
  color: #b91c1c;
  border: 1px solid #fecaca;
}

.redis-banner {
  display: grid;
  gap: 0.45rem;
  border: 1px solid #dbeafe;
  background: linear-gradient(135deg, rgba(239, 246, 255, 0.96), rgba(240, 249, 255, 0.96));
  color: #1e3a8a;
}

.redis-banner--offline {
  border-color: #e5e7eb;
  background: linear-gradient(135deg, rgba(248, 250, 252, 0.96), rgba(243, 244, 246, 0.96));
  color: #374151;
}

.redis-banner-main,
.group-shell-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.redis-banner-meta {
  font-size: 0.82rem;
  line-height: 1.5;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 4.6rem;
  padding: 0.2rem 0.65rem;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.status-pill--online {
  background: rgba(34, 197, 94, 0.16);
  color: #166534;
}

.status-pill--offline {
  background: rgba(148, 163, 184, 0.18);
  color: #475569;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 0.85rem;
}

.compact-info-card {
  gap: 0.28rem;
  padding: 0.8rem 0.9rem;
}

.cache-group-shell {
  display: grid;
  gap: 0.85rem;
  padding: 0.95rem 1rem;
  border-radius: 1rem;
  border: 1px solid #e5e7eb;
  background: #fbfdff;
}

.cache-group-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
  gap: 0.75rem;
}

.panel-note {
  color: #6b7280;
  font-size: 0.82rem;
  line-height: 1.6;
}

.cache-group-card {
  display: grid;
  gap: 0.22rem;
  padding: 0.7rem 0.75rem;
  border-radius: 0.8rem;
  border: 1px solid #e5e7eb;
  background: #ffffff;
}

.cache-group-count {
  font-size: 1rem;
  color: #111827;
}

.invalidation-list {
  display: grid;
  gap: 0.75rem;
}

.invalidation-item {
  display: grid;
  gap: 0.35rem;
  padding: 0.8rem 0.9rem;
  border-radius: 0.85rem;
  border: 1px solid #e5e7eb;
  background: #ffffff;
}

.invalidation-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.compact-empty {
  min-height: 96px;
}

.empty-hint,
.loading-state {
  display: grid;
  place-items: center;
  min-height: 140px;
  border-radius: 1rem;
  border: 1px dashed #d1d5db;
  background: #f8fafc;
  color: #6b7280;
}

@media (max-width: 768px) {
  .settings-header,
  .section-head,
  .redis-actions,
  .invalidation-row,
  .social-link-row,
  .email-test-row,
  .asset-actions,
  .asset-picker-head,
  .asset-picker-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .settings-header {
    gap: 0.85rem;
    padding: 1rem;
  }

  .settings-shell {
    margin-top: 1rem;
    padding: 1rem;
    border-radius: 1rem;
  }

  .stats-grid,
  .cache-group-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .asset-preview-card,
  .favicon-preview-card {
    grid-template-columns: 1fr;
  }

  .asset-preview-image,
  .favicon-preview-image {
    width: 72px;
    height: 72px;
  }

  .asset-picker-mask {
    padding: 0.75rem;
  }

  .asset-picker-dialog {
    max-height: 90vh;
    padding: 1rem;
  }

  .asset-library-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .social-link-row > *,
  .email-test-row > *,
  .asset-actions > *,
  .asset-picker-toolbar > * {
    width: 100%;
  }

  .section-desc,
  .field-block > span,
  .input,
  .btn-primary,
  .btn-secondary,
  .btn-danger,
  .info-card,
  .info-subtext,
  .redis-banner-meta,
  .cache-group-card {
    font-size: 0.86rem;
  }
}
</style>
