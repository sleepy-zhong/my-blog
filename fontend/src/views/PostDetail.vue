<template>
  <div class="white-bg min-h-screen">
    <div class="scroll-indicator">
      <div class="scroll-progress" :style="{ width: `${scrollProgress}%` }"></div>
    </div>

    <div class="w-full px-0 py-6">
      <div class="detail-layout-shell" :style="detailLayoutStyle">
        <aside class="detail-sidebar hidden lg:block">
          <div class="detail-sidebar-scroll">
            <ArticleLeftSidebar
              :headings="headings"
              :active-heading-id="activeHeadingId"
              :scroll-progress="scrollProgress"
              :categories="categories"
              :current-category-ids="currentCategoryIds"
              @select-heading="scrollToHeading"
              @select-category="goToCategory"
            />
          </div>
        </aside>

        <main ref="contentScrollContainer" class="detail-main-scroll">
          <article class="glass-card article-shell rounded-xl overflow-hidden">
            <div class="p-8 border-b border-gray-100/10">
              <nav class="text-sm text-gray-400 mb-4">
                <router-link to="/" class="hover:text-indigo-300">首页</router-link>
                <span class="mx-2">></span>
                <span v-if="article?.Categories?.[0]">
                  <button type="button" class="hover:text-indigo-300" @click="goToCategory(article.Categories[0].CategoryID)">
                    {{ article.Categories[0].Name }}
                  </button>
                  <span class="mx-2">></span>
                </span>
                <span class="text-gray-200">当前文章</span>
              </nav>

              <h1 class="text-4xl font-bold text-white mb-4">{{ article?.Title }}</h1>

              <div v-if="article?.Tags?.length" class="flex flex-wrap gap-2 mb-6 tag-cloud">
                <button
                  v-for="tag in article.Tags"
                  :key="tag.TagID"
                  type="button"
                  class="px-3 py-1 bg-cyan-500/15 text-cyan-300 rounded-full text-sm font-medium hover:bg-cyan-500/25"
                  @click="goToTag(tag.TagID)"
                >
                  #{{ tag.Name }}
                </button>
              </div>

              <div class="article-author-row flex flex-col gap-4 text-gray-300 text-sm sm:flex-row sm:items-center">
                <img
                  :src="authorAvatarSrc"
                  class="w-10 h-10 rounded-full object-cover"
                  @error="onAuthorAvatarError"
                >
                <div class="min-w-0">
                  <div class="font-medium text-white">{{ article?.user?.DisplayName || article?.User?.DisplayName || article?.Author?.DisplayName || '匿名' }}</div>
                  <div class="flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span>发布于 {{ formatDate(article?.PublishedAt || article?.CreatedAt) }}</span>
                    <span>阅读量 {{ article?.ViewCount || 0 }}</span>
                    <span>预计阅读 {{ estimatedReadTime }} 分钟</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="p-8">
              <div class="prose prose-lg max-w-none">
                <div class="article-content" v-html="parsedContent"></div>
              </div>
            </div>

            <div class="px-8 py-6 border-t border-gray-100/10 bg-white/5">
              <div class="article-footer-bar flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div class="article-action-group flex flex-wrap gap-4">
                  <button
                    type="button"
                    class="flex items-center space-x-2 text-gray-300 hover:text-red-300 transition-colors"
                    @click="onToggleLike"
                  >
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd"></path>
                    </svg>
                    <span>{{ liked ? '已点赞' : '点赞' }} ({{ likeCount }})</span>
                  </button>
                  <button type="button" class="flex items-center space-x-2 text-gray-300">
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clip-rule="evenodd"></path>
                    </svg>
                    <span>评论 ({{ totalCommentCount }})</span>
                  </button>
                  <button
                    type="button"
                    class="flex items-center space-x-2 text-gray-300 hover:text-green-300 transition-colors"
                    @click="onToggleFavorite"
                  >
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z"></path>
                    </svg>
                    <span>{{ favorited ? '已收藏' : '收藏' }}</span>
                  </button>
                </div>
                <div class="text-sm text-gray-400">
                  最后编辑：{{ formatDate(article?.UpdatedAt) }}
                </div>
              </div>
            </div>
          </article>

          <div class="glass-card comment-shell rounded-xl mt-8 p-8">
            <div class="mb-6">
              <textarea
                v-model="newComment"
                rows="3"
                class="w-full p-3 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-950/40 text-white"
                placeholder="写下你的评论..."
              ></textarea>
              <div class="flex justify-end mt-2">
                <button
                  type="button"
                  class="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
                  @click="submitComment"
                >
                  发表评论
                </button>
              </div>
            </div>

            <div class="space-y-4">
              <CommentThread
                v-for="comment in comments"
                :key="comment.CommentID"
                :comment="comment"
                @reply="handleReply"
                @deleted="handleCommentDeleted"
              />

              <div v-if="comments.length === 0 && !isLoadingComments" class="text-center py-8 text-gray-400">
                暂无评论，来发表第一条评论吧。
              </div>

              <div v-if="hasMoreComments || isLoadingComments" class="text-center py-4">
                <button
                  v-if="hasMoreComments && !isLoadingComments"
                  type="button"
                  class="px-6 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
                  @click="loadComments(false)"
                >
                  加载更多评论
                </button>
                <div v-if="isLoadingComments" class="text-gray-400">
                  加载中...
                </div>
              </div>

              <div v-if="!hasMoreComments && comments.length > 0" class="text-center py-4 text-gray-500">
                没有更多评论了
              </div>
            </div>
          </div>
        </main>

        <aside class="detail-sidebar hidden lg:block">
          <div class="detail-sidebar-scroll">
            <ArticleRightSidebar
              :related-articles="relatedArticles"
              :popular-tags="popularTags"
              :format-date="formatDate"
              @select-article="goToArticle"
              @select-tag="goToTag"
              @show-more-related="goToMoreRelated"
            />
          </div>
        </aside>
      </div>
    </div>

    <div v-if="showReplyModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div class="bg-white rounded-lg shadow-lg p-6 w-96 max-w-[90vw]">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold">回复评论</h3>
          <button type="button" class="text-gray-400 hover:text-gray-600" @click="cancelReply">×</button>
        </div>

        <div class="mb-4">
          <div class="text-sm text-gray-600 mb-2">回复给：{{ replyToComment?.User?.DisplayName }}</div>
          <div class="text-sm text-gray-500 bg-gray-50 p-2 rounded">{{ replyToComment?.Content }}</div>
        </div>

        <textarea
          v-model="replyContent"
          rows="3"
          class="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
          placeholder="写下你的回复..."
        ></textarea>

        <div class="flex justify-end gap-2">
          <button type="button" class="px-4 py-2 text-gray-600 hover:text-gray-800" @click="cancelReply">
            取消
          </button>
          <button type="button" class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600" @click="submitReply">
            发表回复
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'
import 'highlight.js/styles/github.css'

import { getArticle, getArticles, getArticlesCount, likeArticle, favoriteArticle } from '@/api/article'
import { getCategories } from '@/api/category'
import { getTags } from '@/api/tag'
import { getCommentTree, postComment } from '@/api/comment'
import ArticleLeftSidebar from '@/components/ArticleLeftSidebar.vue'
import ArticleRightSidebar from '@/components/ArticleRightSidebar.vue'
import CommentThread from '@/components/CommentThread.vue'
import { useMessageStore, useUserStore } from '@/store/user'
import { withRetry } from '@/utils/retry'
import { sanitizeHtml } from '@/utils/htmlSanitizer'
import defaultAvatar from '@/assets/icons/login-active.png'
import { resolveAvatarUrl } from '@/utils/avatar'

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  breaks: true,
  highlight(str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return `<pre class="hljs"><code class="language-${lang}">${hljs.highlight(str, { language: lang }).value}</code></pre>`
      } catch (_) {
        return `<pre class="hljs"><code>${md.utils.escapeHtml(str)}</code></pre>`
      }
    }

    if (str.split('\n').some((line) => line.startsWith('    ') || line.startsWith('\t'))) {
      return `<pre class="hljs"><code>${md.utils.escapeHtml(str)}</code></pre>`
    }

    return md.utils.escapeHtml(str)
  }
})

md.set({
  breaks: true,
  html: true,
  linkify: true,
  typographer: true,
  fence: true,
  code: false
})

const defaultImageRule = md.renderer.rules.image || function renderDefaultImage(tokens, idx, options, env, self) {
  return self.renderToken(tokens, idx, options)
}

md.renderer.rules.image = function renderImage(tokens, idx, options, env, self) {
  const token = tokens[idx]
  token.attrSet('loading', 'lazy')
  token.attrSet('referrerpolicy', 'no-referrer')
  token.attrSet('class', `${token.attrGet('class') || ''} md-img`.trim())
  return defaultImageRule(tokens, idx, options, env, self)
}

function renderMarkdownToSafeHtml(markdownSource) {
  if (!markdownSource) return ''
  return sanitizeHtml(md.render(markdownSource))
}

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const messageStore = useMessageStore()

const contentScrollContainer = ref(null)
const article = ref(null)
const headings = ref([])
const activeHeadingId = ref('')
const scrollProgress = ref(0)
const sidebarTopOffset = ref(96)

const categories = ref([])
const popularTags = ref([])
const relatedArticles = ref([])

const comments = ref([])
const newComment = ref('')
const showReplyModal = ref(false)
const replyToComment = ref(null)
const replyContent = ref('')
const commentPage = ref(1)
const commentPageSize = ref(10)
const hasMoreComments = ref(true)
const isLoadingComments = ref(false)

const liked = ref(false)
const favorited = ref(false)
const likeCount = ref(0)

const estimatedReadTime = computed(() => {
  if (!article.value?.Content) return 0
  const words = article.value.Content.length / 2
  return Math.max(1, Math.ceil(words / 200))
})

const totalCommentCount = computed(() => countCommentNodes(comments.value))
const currentCategoryIds = computed(() => (article.value?.Categories || []).map((item) => item.CategoryID))
const detailLayoutStyle = computed(() => ({
  '--detail-top-offset': `${sidebarTopOffset.value}px`
}))

const parsedContent = computed(() => {
  const markdown = getArticleMarkdown()
  return markdown ? renderMarkdownToSafeHtml(markdown) : ''
})

function parseApiPayload(res) {
  if (res?.data?.data) return res.data.data
  if (res?.data) return res.data
  return res
}

function countCommentNodes(commentList = []) {
  return commentList.reduce((total, comment) => total + 1 + countCommentNodes(comment.children || []), 0)
}

function normalizeCommentTreeResponse(response) {
  if (Array.isArray(response)) {
    return { list: response, pagination: null }
  }

  const payload = parseApiPayload(response)
  return {
    list: Array.isArray(payload) ? payload : (payload?.items || payload?.list || []),
    pagination: response?.pagination || payload?.pagination || null
  }
}

function normalizeMarkdown(raw) {
  return typeof raw === 'string' ? raw.replace(/\r\n/g, '\n') : ''
}

function getArticleMarkdown() {
  return normalizeMarkdown(article.value?.Content || '')
}

function extractHeadings(content) {
  const tempDiv = document.createElement('div')
  tempDiv.innerHTML = renderMarkdownToSafeHtml(content)
  const headingElements = tempDiv.querySelectorAll('h1, h2, h3')
  return Array.from(headingElements).map((element, index) => ({
    id: `heading-${index}`,
    text: element.textContent || '',
    level: Number.parseInt(element.tagName[1], 10)
  }))
}

function formatDate(dateString, type = 'full') {
  if (!dateString) return ''

  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return ''

  if (type === 'relative') {
    const diff = Date.now() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    if (days <= 0) return '今天'
    if (days === 1) return '1 天前'
    if (days < 7) return `${days} 天前`
    if (days < 30) return `${Math.floor(days / 7)} 周前`
    if (days < 365) return `${Math.floor(days / 30)} 个月前`
    return `${Math.floor(days / 365)} 年前`
  }

  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function goToCategory(categoryId) {
  router.push({ path: '/posts', query: { category: categoryId } })
}

function goToTag(tagId) {
  router.push({ path: '/posts', query: { tag: tagId } })
}

function goToArticle(articleId) {
  router.push({ path: `/posts/${articleId}` })
}

function goToMoreRelated() {
  const query = {}

  if (article.value?.Categories?.length) {
    query.categories = article.value.Categories.map((category) => category.CategoryID).join(',')
    query.categoryMode = 'any'
  }

  if (article.value?.Tags?.length) {
    query.tags = article.value.Tags.map((tag) => tag.TagID).join(',')
    query.tagMode = 'any'
  }

  router.push({ path: '/posts', query })
}

function updateSidebarTopOffset() {
  const navEl = document.querySelector('.nav-outer')
  const navHeight = navEl instanceof HTMLElement ? navEl.getBoundingClientRect().height : 72
  const gap = typeof window !== 'undefined' && window.innerWidth >= 1024 ? 24 : 16
  sidebarTopOffset.value = Math.max(Math.ceil(navHeight + gap), 88)
}

function isDesktopLayout() {
  return typeof window !== 'undefined' && window.innerWidth >= 1024
}

function getScrollRoot() {
  if (!isDesktopLayout()) return null
  return contentScrollContainer.value
}

function updateScrollProgress() {
  const root = getScrollRoot()

  if (root) {
    const scrollHeight = root.scrollHeight - root.clientHeight
    const progress = scrollHeight > 0 ? (root.scrollTop / scrollHeight) * 100 : 0
    scrollProgress.value = Math.min(Math.max(progress, 0), 100)
    return
  }

  const scrollTop = window.pageYOffset || document.documentElement.scrollTop || 0
  const scrollHeight = document.documentElement.scrollHeight - window.innerHeight
  const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0
  scrollProgress.value = Math.min(Math.max(progress, 0), 100)
}

function scrollToHeading(id) {
  const element = document.getElementById(id)
  if (!element) return

  const root = getScrollRoot()

  if (root) {
    const rootRect = root.getBoundingClientRect()
    const targetTop = root.scrollTop + element.getBoundingClientRect().top - rootRect.top - 24
    root.scrollTo({ top: Math.max(targetTop, 0), behavior: 'smooth' })
    return
  }

  const targetTop = element.getBoundingClientRect().top + window.pageYOffset - sidebarTopOffset.value - 12
  window.scrollTo({ top: Math.max(targetTop, 0), behavior: 'smooth' })
}

let headingObserver = null
let boundScrollTarget = null

function bindScrollListener() {
  if (boundScrollTarget?.removeEventListener) {
    boundScrollTarget.removeEventListener('scroll', updateScrollProgress)
  }

  boundScrollTarget = getScrollRoot() || window
  boundScrollTarget.addEventListener('scroll', updateScrollProgress, { passive: true })
}

function initHeadingObserver() {
  if (headingObserver) {
    headingObserver.disconnect()
  }

  const content = document.querySelector('.article-content')
  if (!content) return

  const targetHeadings = content.querySelectorAll('h1, h2, h3')
  const root = getScrollRoot()

  headingObserver = new IntersectionObserver((entries) => {
    const visibleEntries = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)

    if (visibleEntries[0]?.target?.id) {
      activeHeadingId.value = visibleEntries[0].target.id
    }
  }, {
    root,
    rootMargin: root ? '-8% 0px -72% 0px' : '-20% 0px -70% 0px',
    threshold: [0, 1]
  })

  targetHeadings.forEach((heading) => headingObserver.observe(heading))
}

async function loadCategories() {
  try {
    const res = await getCategories()
    const payload = parseApiPayload(res)
    const categoryList = Array.isArray(payload) ? payload : (payload?.list || [])

    categories.value = await Promise.all(
      categoryList.map(async (category) => {
        try {
          const countRes = await getArticlesCount({
            categories: String(category.CategoryID),
            categoryMode: 'any',
            status: 'published'
          })
          const countPayload = parseApiPayload(countRes)
          return {
            ...category,
            PostCount: Number(countPayload?.total || countPayload?.data?.total || 0)
          }
        } catch (_) {
          return { ...category, PostCount: 0 }
        }
      })
    )
  } catch (error) {
    console.error('Failed to load categories:', error)
    categories.value = []
  }
}

async function loadPopularTags() {
  try {
    const res = await getTags({ pageSize: 20 })
    const payload = parseApiPayload(res)
    const tagList = Array.isArray(payload) ? payload : (payload?.list || [])
    popularTags.value = tagList.slice(0, 10)
  } catch (error) {
    console.error('Failed to load tags:', error)
    popularTags.value = []
  }
}

function scoreRelatedArticle(candidate, currentArticleId, currentCategorySet, currentTagSet) {
  if (!candidate || candidate.PostID === currentArticleId) return null

  const candidateCategoryIds = new Set((candidate.Categories || []).map((item) => item.CategoryID))
  const candidateTagIds = new Set((candidate.Tags || []).map((item) => item.TagID))

  const categoryMatches = Array.from(currentCategorySet).filter((id) => candidateCategoryIds.has(id)).length
  const tagMatches = Array.from(currentTagSet).filter((id) => candidateTagIds.has(id)).length
  const totalMatches = categoryMatches + tagMatches

  if (totalMatches <= 0) return null

  return {
    ...candidate,
    _matchMeta: {
      categoryMatches,
      tagMatches,
      totalMatches
    }
  }
}

async function loadRelatedArticles() {
  if (!article.value) {
    relatedArticles.value = []
    return
  }

  const currentArticleId = Number(route.params.id)
  const currentCategorySet = new Set((article.value.Categories || []).map((item) => item.CategoryID))
  const currentTagSet = new Set((article.value.Tags || []).map((item) => item.TagID))

  if (!currentCategorySet.size && !currentTagSet.size) {
    relatedArticles.value = []
    return
  }

  try {
    const res = await getArticles({
      pageSize: 50,
      status: 'published',
      fields: 'PostID,Title,PublishedAt,CreatedAt,ViewCount',
      include: 'categories,tags',
      sort: 'PublishedAt:desc,CreatedAt:desc'
    })
    const payload = parseApiPayload(res)
    const list = Array.isArray(payload) ? payload : (payload?.list || [])

    relatedArticles.value = list
      .map((item) => scoreRelatedArticle(item, currentArticleId, currentCategorySet, currentTagSet))
      .filter(Boolean)
      .sort((a, b) => {
        const totalDiff = b._matchMeta.totalMatches - a._matchMeta.totalMatches
        if (totalDiff !== 0) return totalDiff

        const categoryDiff = b._matchMeta.categoryMatches - a._matchMeta.categoryMatches
        if (categoryDiff !== 0) return categoryDiff

        const tagDiff = b._matchMeta.tagMatches - a._matchMeta.tagMatches
        if (tagDiff !== 0) return tagDiff

        const timeA = new Date(a.PublishedAt || a.CreatedAt || 0).getTime()
        const timeB = new Date(b.PublishedAt || b.CreatedAt || 0).getTime()
        return timeB - timeA
      })
      .slice(0, 5)
  } catch (error) {
    console.error('Failed to load related articles:', error)
    relatedArticles.value = []
  }
}

async function loadArticleCore(id) {
  try {
    const res = await getArticle(id, { include: 'categories,tags,user' })
    const payload = parseApiPayload(res)
    if (!payload) return

    article.value = payload
    likeCount.value = Number(payload?.LikeCount || 0)
    liked.value = !!payload?.Liked
    favorited.value = !!payload?.Favorited

    const markdown = getArticleMarkdown()
    headings.value = markdown ? extractHeadings(markdown) : []
    activeHeadingId.value = headings.value[0]?.id || ''

    await loadRelatedArticles()

    await nextTick()

    const content = document.querySelector('.article-content')
    if (content) {
      const headingElements = content.querySelectorAll('h1, h2, h3')
      headingElements.forEach((element, index) => {
        element.id = `heading-${index}`
      })
    }

    bindScrollListener()
    initHeadingObserver()
    updateScrollProgress()

    const root = getScrollRoot()
    if (root) {
      root.scrollTo({ top: 0, behavior: 'auto' })
    }
  } catch (error) {
    console.error('Failed to load article:', error)
    messageStore.show('文章加载失败', 'error')
  }
}

async function guardLoginAndGoLoginIfNeeded() {
  if (!userStore.user) {
    try {
      await userStore.initSession()
    } catch (_) {
      // ignore
    }
  }

  if (!userStore.user) {
    messageStore.show('请先登录', 'info')
    router.push({ path: '/login', query: { redirect: router.currentRoute.value.fullPath } })
    return false
  }

  return true
}

async function onToggleLike() {
  if (!await guardLoginAndGoLoginIfNeeded()) return

  try {
    let retriedNotified = false
    const res = await withRetry(() => likeArticle(route.params.id), {
      retries: 2,
      baseDelayMs: 400,
      onRetry: () => {
        if (!retriedNotified) {
          messageStore.show('网络波动，正在重试...', 'info')
          retriedNotified = true
        }
      }
    })

    const payload = parseApiPayload(res)
    liked.value = (payload?.liked ?? !liked.value) === true

    if (typeof payload?.likeCount === 'number') {
      likeCount.value = payload.likeCount
    } else {
      likeCount.value = Math.max(0, likeCount.value + (liked.value ? 1 : -1))
    }

    messageStore.show(liked.value ? '点赞成功' : '已取消点赞', 'success')
  } catch (error) {
    console.error('Failed to toggle like:', error)
    messageStore.show('点赞失败，请稍后重试', 'error')
  }
}

async function onToggleFavorite() {
  if (!await guardLoginAndGoLoginIfNeeded()) return

  try {
    let retriedNotified = false
    const res = await withRetry(() => favoriteArticle(route.params.id), {
      retries: 2,
      baseDelayMs: 400,
      onRetry: () => {
        if (!retriedNotified) {
          messageStore.show('网络波动，正在重试...', 'info')
          retriedNotified = true
        }
      }
    })

    const payload = parseApiPayload(res)
    favorited.value = (payload?.favorited ?? !favorited.value) === true
    messageStore.show(favorited.value ? '收藏成功' : '已取消收藏', 'success')
  } catch (error) {
    console.error('Failed to toggle favorite:', error)
    messageStore.show('收藏失败，请稍后重试', 'error')
  }
}

async function loadComments(reset = false) {
  if (isLoadingComments.value) return

  if (reset) {
    commentPage.value = 1
    comments.value = []
    hasMoreComments.value = true
  }

  if (!hasMoreComments.value) return

  isLoadingComments.value = true

  try {
    const res = await getCommentTree(route.params.id, {
      status: 'approved',
      page: commentPage.value,
      pageSize: commentPageSize.value
    })
    const { list, pagination } = normalizeCommentTreeResponse(res)

    if (reset) {
      comments.value = list
    } else {
      comments.value.push(...list)
    }

    hasMoreComments.value = typeof pagination?.hasMore === 'boolean'
      ? pagination.hasMore
      : list.length === commentPageSize.value

    if (hasMoreComments.value) {
      commentPage.value = Number(pagination?.page || commentPage.value) + 1
    }
  } catch (error) {
    console.error('Failed to load comments:', error)
    messageStore.show('评论加载失败，请稍后重试', 'error')
  } finally {
    isLoadingComments.value = false
  }
}

const authorAvatarSrc = computed(() => {
  const raw =
    article.value?.user?.AvatarURL ||
    article.value?.User?.AvatarURL ||
    article.value?.Author?.AvatarURL ||
    article.value?.user?.AvatarUrl ||
    article.value?.User?.AvatarUrl ||
    article.value?.Author?.AvatarUrl ||
    article.value?.User?.Avatar ||
    article.value?.Author?.Avatar

  return resolveAvatarUrl(raw) || defaultAvatar
})

function onAuthorAvatarError(event) {
  if (event?.target) {
    event.target.src = defaultAvatar
  }
}

async function submitComment() {
  if (!newComment.value.trim()) return
  if (!await guardLoginAndGoLoginIfNeeded()) return

  try {
    let retriedNotified = false
    const res = await withRetry(() => postComment(route.params.id, { content: newComment.value.trim() }), {
      retries: 2,
      baseDelayMs: 400,
      onRetry: () => {
        if (!retriedNotified) {
          messageStore.show('网络波动，正在重试...', 'info')
          retriedNotified = true
        }
      }
    })

    if (parseApiPayload(res)) {
      newComment.value = ''
      messageStore.show('评论成功', 'success')
      await loadComments(true)
    }
  } catch (error) {
    console.error('Failed to submit comment:', error)
    messageStore.show('发表评论失败，请稍后重试', 'error')
  }
}

function handleReply(parentComment) {
  replyToComment.value = parentComment
  showReplyModal.value = true
}

function cancelReply() {
  showReplyModal.value = false
  replyToComment.value = null
  replyContent.value = ''
}

function removeCommentFromTree(commentList, commentId) {
  for (let index = 0; index < commentList.length; index += 1) {
    if (commentList[index].CommentID === commentId) {
      commentList.splice(index, 1)
      return true
    }

    if (commentList[index].children?.length && removeCommentFromTree(commentList[index].children, commentId)) {
      return true
    }
  }

  return false
}

function handleCommentDeleted(commentId) {
  removeCommentFromTree(comments.value, commentId)
}

async function submitReply() {
  if (!replyContent.value.trim()) return
  if (!await guardLoginAndGoLoginIfNeeded()) return

  try {
    let retriedNotified = false
    const res = await withRetry(() => postComment(route.params.id, {
      content: replyContent.value.trim(),
      parentId: replyToComment.value.CommentID
    }), {
      retries: 2,
      baseDelayMs: 400,
      onRetry: () => {
        if (!retriedNotified) {
          messageStore.show('网络波动，正在重试...', 'info')
          retriedNotified = true
        }
      }
    })

    if (parseApiPayload(res)) {
      cancelReply()
      messageStore.show('回复成功', 'success')
      await loadComments(true)
    }
  } catch (error) {
    console.error('Failed to submit reply:', error)
    messageStore.show('回复失败，请稍后重试', 'error')
  }
}

function handleResize() {
  updateSidebarTopOffset()
  bindScrollListener()
  initHeadingObserver()
  updateScrollProgress()
}

onMounted(async () => {
  updateSidebarTopOffset()
  window.addEventListener('resize', handleResize)

  await Promise.allSettled([loadCategories(), loadPopularTags()])
  await loadArticleCore(route.params.id)
  await loadComments(true)
})

watch(() => route.params.id, async (newId, oldId) => {
  if (newId === oldId) return

  window.scrollTo({ top: 0, behavior: 'auto' })
  await loadArticleCore(newId)
  await loadComments(true)
})

onUnmounted(() => {
  if (boundScrollTarget?.removeEventListener) {
    boundScrollTarget.removeEventListener('scroll', updateScrollProgress)
  }
  window.removeEventListener('resize', handleResize)

  if (headingObserver) {
    headingObserver.disconnect()
  }
})
</script>

<style scoped>
.white-bg {
  position: relative;
  background: transparent;
  color: var(--text);
  isolation: isolate;
}

.white-bg::before,
.white-bg::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.white-bg::before {
  background:
    radial-gradient(circle at 14% 12%, rgba(120, 163, 255, 0.14), transparent 18%),
    radial-gradient(circle at 84% 10%, rgba(255, 123, 176, 0.1), transparent 16%),
    radial-gradient(circle at 48% 82%, rgba(103, 239, 216, 0.08), transparent 24%);
  opacity: 0.88;
}

.white-bg::after {
  background-image:
    repeating-linear-gradient(180deg, rgba(255, 255, 255, 0.02) 0 1px, transparent 1px 8px),
    linear-gradient(118deg, transparent 0 44%, rgba(255, 255, 255, 0.025) 50%, transparent 56%);
  opacity: 0.12;
}

.glass-card {
  background: var(--panel);
  backdrop-filter: blur(18px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 18px 48px rgba(0, 0, 0, 0.24);
  transition: all 0.3s ease;
}

.glass-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 22px 54px rgba(0, 0, 0, 0.28);
  border-color: rgba(120, 163, 255, 0.22);
}

.article-shell,
.comment-shell {
  position: relative;
  overflow: hidden;
}

.article-shell::before,
.comment-shell::before {
  content: "";
  position: absolute;
  inset: -30% auto -30% -18%;
  width: 32%;
  background: linear-gradient(120deg, transparent 0 18%, rgba(255, 255, 255, 0.05) 28%, rgba(120, 163, 255, 0.24) 48%, rgba(255, 123, 176, 0.18) 66%, transparent 100%);
  transform: translateX(-180%) skewX(-18deg);
  opacity: 0.48;
  mix-blend-mode: screen;
  pointer-events: none;
  animation: detailSweep 9.2s ease-in-out infinite;
}

.detail-layout-shell {
  display: block;
}

.detail-main-scroll {
  position: relative;
  z-index: 1;
}

.detail-sidebar-scroll {
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.18) transparent;
}

.detail-sidebar-scroll::-webkit-scrollbar,
.detail-main-scroll::-webkit-scrollbar {
  width: 6px;
}

.detail-sidebar-scroll::-webkit-scrollbar-track,
.detail-main-scroll::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.04);
}

.detail-sidebar-scroll::-webkit-scrollbar-thumb,
.detail-main-scroll::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.16);
  border-radius: 999px;
}

.scroll-indicator {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 3px;
  background: rgba(255, 255, 255, 0.08);
  z-index: 1001;
}

.scroll-progress {
  height: 100%;
  background: linear-gradient(90deg, var(--accent), var(--accent-2), var(--accent-3));
  width: 0%;
  transition: width 0.1s ease;
}

.article-content {
  width: 100%;
  overflow-x: hidden;
}

.tag-cloud button,
.article-action-group button {
  transition: transform 0.2s ease;
}

.tag-cloud button:hover,
.article-action-group button:hover {
  transform: translateY(-1px);
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.article-content :deep(h1) {
  @apply text-3xl font-bold my-6;
  scroll-margin-top: 120px;
}

.article-content :deep(h2) {
  @apply text-2xl font-bold my-5;
  scroll-margin-top: 120px;
}

.article-content :deep(h3) {
  @apply text-xl font-bold my-4;
  scroll-margin-top: 120px;
}

.article-content :deep(p),
.article-content :deep(li),
.article-content :deep(blockquote) {
  color: rgba(226, 232, 240, 0.94);
  line-height: 1.85;
}

.article-content :deep(pre) {
  background: rgba(15, 23, 42, 0.85);
  border-radius: 1rem;
  padding: 1rem 1.1rem;
  overflow-x: auto;
}

.article-content :deep(code) {
  color: rgba(232, 121, 249, 0.92);
}

.article-content :deep(img) {
  border-radius: 1rem;
}

@keyframes detailSweep {
  0% {
    transform: translateX(-180%) skewX(-18deg);
  }
  46%, 100% {
    transform: translateX(340%) skewX(-18deg);
  }
}

@media (min-width: 1024px) {
  .detail-layout-shell {
    display: grid;
    grid-template-columns: 320px minmax(0, 1fr) 320px;
    gap: 1.5rem;
    height: calc(100vh - var(--detail-top-offset) - 24px);
    min-height: 0;
  }

  .detail-sidebar,
  .detail-main-scroll {
    min-height: 0;
    height: 100%;
  }

  .detail-sidebar-scroll,
  .detail-main-scroll {
    height: 100%;
    overflow-y: auto;
    overscroll-behavior: contain;
  }
}

@media (max-width: 1023px) {
  .detail-main-scroll {
    overflow: visible;
  }
}

@media (max-width: 768px) {
  .glass-card {
    margin: 0 1rem;
    border-radius: 0.75rem;
  }

  .p-8 {
    padding: 1.5rem;
  }

  .text-4xl {
    font-size: 2rem;
    line-height: 2.5rem;
  }
}

@media (max-width: 640px) {
  .glass-card {
    margin: 0;
    border-radius: 0;
  }

  .white-bg > .w-full {
    padding-left: 0 !important;
    padding-right: 0 !important;
  }

  .article-shell > .p-8,
  .article-shell > .px-8.py-6,
  .comment-shell {
    padding: 0.875rem;
  }

  .article-shell .text-4xl {
    font-size: 1.45rem;
    line-height: 1.9rem;
  }

  .article-content :deep(p),
  .article-content :deep(li),
  .article-content :deep(blockquote) {
    font-size: 13px;
    line-height: 1.65;
  }
}
</style>
