<template>
  <div class="white-bg min-h-screen">
    <!-- 滚动进度指示器 -->
    <div class="scroll-indicator">
      <div class="scroll-progress" :style="{ width: scrollProgress + '%' }"></div>
    </div>

    <!-- 导航栏 -->
    <!-- <nav class="glass-card mb-6">
      <div class="w-full px-4 py-3">
        <div class="flex items-center justify-between">

          <div class="hidden md:flex space-x-6">
            <router-link to="/" class="text-gray-600 hover:text-indigo-600">首页</router-link>
            <router-link to="/posts" class="text-gray-600 hover:text-indigo-600">文章</router-link>
            <a href="#" class="text-gray-600 hover:text-indigo-600">分类</a>
            <a href="#" class="text-gray-600 hover:text-indigo-600">标签</a>
          </div>
        </div>
      </div>
    </nav> -->

    <div class="w-full px-0 py-6">
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-5 lg:items-start">
        
        <!-- 左侧分类导航和目录 -->
        <div class="self-start lg:col-span-1">
          <div class="sidebar-stack sticky space-y-6" :style="sidebarStickyStyle">
            <!-- Table of contents -->
            <div v-if="headings.length > 0" class="toc-card toc-shell rounded-xl p-6">
              <h3 class="text-lg font-semibold mb-4 text-gray-800 flex items-center">
                <svg class="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"/>
                </svg>
                &#25991;&#31456;&#30446;&#24405;
              </h3>
              <nav class="space-y-1">
                <a 
                  v-for="heading in headings" 
                  :key="heading.id"
                  :href="`#${heading.id}`"
                  :class="[
                    'toc-item',
                    activeHeadingId === heading.id ? 'active' : '',
                    `level-${heading.level}`
                  ]"
                  @click.prevent="scrollToHeading(heading.id)"
                  :title="heading.text"
                >
                  {{ heading.text }}
                </a>
              </nav>
              
              <!-- Reading progress -->
              <div class="mt-4 pt-4 border-t border-gray-200">
                <div class="flex items-center text-xs text-gray-500 mb-2">
                  <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                  </svg>
                  &#38405;&#35835;&#36827;&#24230;
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    class="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                    :style="{ width: Math.min(scrollProgress, 100) + '%' }"
                  ></div>
                </div>
                <div class="text-xs text-gray-500 mt-1 text-center">
                  {{ Math.round(scrollProgress) }}%
                </div>
              </div>
            </div>

            <!-- Category list -->
            <div class="glass-card category-panel rounded-xl p-6">
              <h3 class="text-lg font-semibold mb-4 text-gray-800">&#25991;&#31456;&#20998;&#31867;</h3>
              <div class="category-tree space-y-2">
                <div 
                  v-for="category in categories" 
                  :key="category.CategoryID"
                  :class="[
                    'category-item p-3 rounded-lg cursor-pointer',
                    article?.Categories?.some(c => c.CategoryID === category.CategoryID) 
                      ? 'bg-indigo-50 border-l-4 border-indigo-500' 
                      : 'hover:bg-gray-50'
                  ]"
                  @click="goToCategory(category.CategoryID)"
                >
                  <div class="flex items-center justify-between">
                    <span :class="[
                      'font-medium',
                      article?.Categories?.some(c => c.CategoryID === category.CategoryID) 
                        ? 'text-indigo-700' 
                        : 'text-gray-700'
                    ]">{{ category.Name }}</span>
                    <span class="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{{ category.PostCount || 0 }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="lg:col-span-3">
          <article class="glass-card article-shell rounded-xl overflow-hidden">
            <!-- 文章头部 -->
            <div class="p-8 border-b border-gray-100">
              <!-- 面包屑导航 -->
              <nav class="text-sm text-gray-500 mb-4">
                <router-link to="/" class="hover:text-indigo-600">首页</router-link>
                <span class="mx-2">></span>
                <span v-if="article?.Categories?.[0]">
                  <a href="#" class="hover:text-indigo-600" @click="goToCategory(article.Categories[0].CategoryID)">
                    {{ article.Categories[0].Name }}
                  </a>
                  <span class="mx-2">></span>
                </span>
                <span class="text-gray-700">当前文章</span>
              </nav>
              
              <h1 class="text-4xl font-bold text-gray-900 mb-4">{{ article?.Title }}</h1>
              
              <!-- 标签云 -->
              <div v-if="article?.Tags?.length" class="flex flex-wrap gap-2 mb-6 tag-cloud">
                <span 
                  v-for="tag in article.Tags" 
                  :key="tag.TagID"
                  class="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium cursor-pointer hover:bg-blue-200"
                  @click="goToTag(tag.TagID)"
                >
                  #{{ tag.Name }}
                </span>
              </div>
              
              <!-- 文章信息 -->
              <div class="article-author-row flex flex-col gap-4 text-gray-600 text-sm sm:flex-row sm:items-center">
                <img 
                  :src="authorAvatarSrc" 
                  class="w-10 h-10 rounded-full mr-3 object-cover" 
                  @error="onAuthorAvatarError"
                >
                <div class="min-w-0">
                  <div class="font-medium text-gray-900">{{ article?.user?.DisplayName || article?.User?.DisplayName || article?.Author?.DisplayName || '佚名' }}</div>
                  <div class="flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span>发布于 {{ formatDate(article?.PublishedAt || article?.CreatedAt) }}</span>
                    <span>•</span>
                    <span>阅读量 {{ article?.ViewCount || 0 }}</span>
                    <span>•</span>
                    <span>预计阅读 {{ estimatedReadTime }} 分钟</span>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- 文章内容 -->
            <div class="p-8">
              <div class="prose prose-lg max-w-none">
                <div class="article-content" v-html="parsedContent"></div>
              </div>
            </div>
            
            <!-- 文章底部操作 -->
            <div class="px-8 py-6 border-t border-gray-100 bg-gray-50">
              <div class="article-footer-bar flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div class="article-action-group flex flex-wrap gap-4">
                  <button 
                    @click="onToggleLike" 
                    class="flex items-center space-x-2 text-gray-600 hover:text-red-500 transition-colors"
                  >
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd"></path>
                    </svg>
                    <span>{{ liked ? '已赞' : '点赞' }} ({{ likeCount }})</span>
                  </button>
                  <button class="flex items-center space-x-2 text-gray-600 hover:text-blue-500 transition-colors">
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clip-rule="evenodd"></path>
                    </svg>
                    <span>评论 ({{ totalCommentCount }})</span>
                  </button>
                  <button @click="onToggleFavorite" class="flex items-center space-x-2 text-gray-600 hover:text-green-500 transition-colors">
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z"></path>
                    </svg>
                    <span>{{ favorited ? '已收藏' : '收藏' }}</span>
                  </button>
                </div>
                <div class="text-sm text-gray-500">
                  最后编辑：{{ formatDate(article?.UpdatedAt) }}
                </div>
              </div>
            </div>
          </article>

          <!-- 评论区 -->
          <div class="glass-card comment-shell rounded-xl mt-8 p-8">
            <!-- 评论输入框 -->
            <div class="mb-6">
              <textarea
                v-model="newComment"
                rows="3"
                class="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="写下你的评论..."
              ></textarea>
              <div class="flex justify-end mt-2">
                <button
                  @click="submitComment"
                  class="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
                >
                  发表评论
                </button>
              </div>
            </div>

            <!-- 评论列表 -->
            <div class="space-y-4">
              <CommentThread
                v-for="comment in comments"
                :key="comment.CommentID"
                :comment="comment"
                @reply="handleReply"
                @deleted="handleCommentDeleted"
              />
              
              <!-- 没有评论时的提示 -->
              <div v-if="comments.length === 0 && !isLoadingComments" class="text-center py-8 text-gray-500">
                暂无评论，来发表第一条评论吧！
              </div>
              
              <!-- 加载更多评论 -->
              <div v-if="hasMoreComments || isLoadingComments" class="text-center py-4">
                <button 
                  v-if="hasMoreComments && !isLoadingComments"
                  @click="loadComments(false)"
                  class="px-6 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
                >
                  加载更多评论
                </button>
                <div v-if="isLoadingComments" class="text-gray-500">
                  加载中...
                </div>
              </div>
              
              <!-- 没有更多评论 -->
              <div v-if="!hasMoreComments && comments.length > 0" class="text-center py-4 text-gray-500">
                没有更多评论了
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧相关推荐 -->
        <div class="self-start lg:col-span-1">
          <div class="sidebar-stack sticky space-y-6" :style="sidebarStickyStyle">
            <!-- Related articles -->
            <div class="glass-card related-panel rounded-xl p-6">
              <h3 class="text-lg font-semibold mb-4 text-gray-800">&#30456;&#20851;&#25991;&#31456;</h3>
              <div class="space-y-4">
                <div 
                  v-for="relatedArticle in relatedArticles" 
                  :key="relatedArticle.PostID"
                  class="article-card related-card p-4 bg-white rounded-lg border border-gray-100 cursor-pointer"
                  @click="goToArticle(relatedArticle.PostID)"
                >
                  <h4 class="font-medium text-gray-900 text-sm mb-2 line-clamp-2">{{ relatedArticle.Title }}</h4>
                  <div class="flex items-center text-xs text-gray-500">
                    <span>{{ formatDate(relatedArticle.PublishedAt || relatedArticle.CreatedAt, 'relative') }}</span>
                    <span class="mx-2">&bull;</span>
                    <span>&#38405;&#35835; {{ relatedArticle.ViewCount || 0 }}</span>
                  </div>
                </div>
                <div v-if="relatedArticles.length === 0" class="text-sm text-gray-500">
                  &#26242;&#26080;&#30456;&#20851;&#25991;&#31456;
                </div>
              </div>
              <button v-if="relatedArticles.length > 0" @click="goToMoreRelated" class="w-full mt-4 py-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium">&#26597;&#30475;&#26356;&#22810;</button>
            </div>
            
            <!-- Popular tags -->
            <div class="glass-card tag-panel rounded-xl p-6">
              <h3 class="text-lg font-semibold mb-4 text-gray-800">&#28909;&#38376;&#26631;&#31614;</h3>
              <div class="flex flex-wrap gap-2">
                <span 
                  v-for="tag in popularTags" 
                  :key="tag.TagID"
                  class="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm cursor-pointer hover:bg-blue-200 transition-colors"
                  @click="goToTag(tag.TagID)"
                >
                  {{ tag.Name }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showReplyModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div class="bg-white rounded-lg shadow-lg p-6 w-96 max-w-[90vw]">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold">回复评论</h3>
          <button @click="cancelReply" class="text-gray-400 hover:text-gray-600">×</button>
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
          <button @click="cancelReply" class="px-4 py-2 text-gray-600 hover:text-gray-800">
            取消
          </button>
          <button @click="submitReply" class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
            发表回复
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getArticle, getArticles, getArticlesCount, likeArticle, favoriteArticle } from '@/api/article'
import { getCategories } from '@/api/category'
import { getTags } from '@/api/tag'
import { getCommentTree, postComment } from '@/api/comment'
import CommentThread from '@/components/CommentThread.vue'
import { useUserStore, useMessageStore } from '@/store/user'
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'
import 'highlight.js/styles/github.css' // 添加代码高亮样式
import { withRetry } from '@/utils/retry'
import { sanitizeHtml } from '@/utils/htmlSanitizer'

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  breaks: true, // 允许换行
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return `<pre class="hljs"><code class="language-${lang}">${hljs.highlight(str, { language: lang }).value}</code></pre>`;
      } catch (__) {}
    }
    // 对于没有指定语言的代码块，只有在包含制表符或四个空格时才渲染为代码块
    if (str.split('\n').some(line => line.startsWith('    ') || line.startsWith('\t'))) {
      return `<pre class="hljs"><code>${md.utils.escapeHtml(str)}</code></pre>`;
    }
    // 否则作为普通文本处理
    return md.utils.escapeHtml(str);
  }
})

// 配置解析选项
md.set({
  breaks: true,
  html: true,
  linkify: true,
  typographer: true,
  // 禁用自动代码块
  fence: true,
  code: false
})

// 统一为图片添加 lazy/referrerpolicy 与样式
const defaultImageRule = md.renderer.rules.image || function (tokens, idx, options, env, self) {
  return self.renderToken(tokens, idx, options)
}
md.renderer.rules.image = function (tokens, idx, options, env, self) {
  const token = tokens[idx]
  token.attrSet('loading', 'lazy')
  token.attrSet('referrerpolicy', 'no-referrer')
  const className = (token.attrGet('class') || '')
  token.attrSet('class', `${className} md-img`.trim())
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

// 文章相关数据
const article = ref(null)
const headings = ref([])
const activeHeadingId = ref('')
const scrollProgress = ref(0)
const sidebarTopOffset = ref(96)

// 分类和标签数据
const categories = ref([])
const popularTags = ref([])
const relatedArticles = ref([])

// 评论相关数据
const comments = ref([])
const newComment = ref('')
const showReplyModal = ref(false)
const replyToComment = ref(null)
const replyContent = ref('')
const commentPage = ref(1)
const commentPageSize = ref(10)
const hasMoreComments = ref(true)
const isLoadingComments = ref(false)

// 交互状态
const liked = ref(false)
const favorited = ref(false)
const likeCount = ref(0)

// 计算属性
const estimatedReadTime = computed(() => {
  if (!article.value?.Content) return 0
  const wordsPerMinute = 200
  const words = article.value.Content.length / 2 // 中文字符估算
  return Math.ceil(words / wordsPerMinute)
})

const totalCommentCount = computed(() => countCommentNodes(comments.value))
const sidebarStickyStyle = computed(() => ({
  top: `${sidebarTopOffset.value}px`,
  maxHeight: `calc(100vh - ${sidebarTopOffset.value + 24}px)`,
  overflowY: 'auto'
}))

function parseApiPayload(res) {
  // axios 拦截器已经解包了 res.data，所以这里直接返回 res
  // 如果有嵌套的 data 结构，再解包一层
  return res?.data || res
}

function countCommentNodes(commentList = []) {
  return commentList.reduce((total, comment) => {
    return total + 1 + countCommentNodes(comment.children || [])
  }, 0)
}

function normalizeCommentTreeResponse(response) {
  if (Array.isArray(response)) {
    return { list: response, pagination: null }
  }

  const payload = parseApiPayload(response)
  const list = Array.isArray(payload) ? payload : (payload?.items || payload?.list || [])
  const pagination = response?.pagination || payload?.pagination || null

  return { list, pagination }
}


// 将后端的 Content 转成用于渲染/提取目录的 Markdown 文本（不使用 contentJson）
function getArticleMarkdown() {
  const raw = article.value?.Content || ''
  return normalizeMarkdown(raw)
}

// 轻量反转义常见被转义的 Markdown 标记，避免展示为纯文本
function normalizeMarkdown(content) {
  if (!content) return ''
  // 把 \\*、\\_、\\`、\\# 的转义去掉；尽量避免过度替换
  return String(content)
    .replace(/\\([*`_#])/g, '$1')
}

// 解析后的文章内容（渲染为 HTML）
const parsedContent = computed(() => {
  const mdSource = getArticleMarkdown()
  if (!mdSource) return ''
  return renderMarkdownToSafeHtml(mdSource)
})

// 提取文章中的标题生成目录
const extractHeadings = (content) => {
  const tempDiv = document.createElement('div')
  tempDiv.innerHTML = renderMarkdownToSafeHtml(content)
  const headingElements = tempDiv.querySelectorAll('h1, h2, h3')
  return Array.from(headingElements).map((el, index) => ({
    id: `heading-${index}`,
    text: el.textContent,
    level: parseInt(el.tagName[1]),
  }))
}

// 格式化日期
const formatDate = (dateString, type = 'full') => {
  if (!dateString) return ''
  const date = new Date(dateString)
  
  if (type === 'relative') {
    const now = new Date()
    const diff = now - date
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days === 0) return '今天'
    if (days === 1) return '1天前'
    if (days < 7) return `${days}天前`
    if (days < 30) return `${Math.floor(days / 7)}周前`
    if (days < 365) return `${Math.floor(days / 30)}个月前`
    return `${Math.floor(days / 365)}年前`
  }
  
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 导航功能
const goToCategory = (categoryId) => {
  router.push({ path: '/posts', query: { category: categoryId } })
}

const goToTag = (tagId) => {
  router.push({ path: '/posts', query: { tag: tagId } })
}

const goToArticle = (articleId) => {
  router.push({ path: `/posts/${articleId}` })
}

// 查看更多相关文章：跳转到列表页并带上当前文章的分类/标签筛选
const goToMoreRelated = () => {
  const query = {}
  if (article.value?.Categories?.length) {
    query.categories = article.value.Categories.map(c => c.CategoryID).join(',')
    query.categoryMode = 'any'
  }
  if (article.value?.Tags?.length) {
    query.tags = article.value.Tags.map(t => t.TagID).join(',')
    query.tagMode = 'any'
  }
  router.push({ path: '/posts', query })
}

const updateSidebarTopOffset = () => {
  const navEl = document.querySelector('.nav-outer')
  const navHeight = navEl instanceof HTMLElement ? navEl.getBoundingClientRect().height : 72
  const gap = window.innerWidth >= 1024 ? 24 : 16
  sidebarTopOffset.value = Math.max(Math.ceil(navHeight + gap), 88)
}

// 滚动进度监听
const updateScrollProgress = () => {
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop
  const scrollHeight = document.documentElement.scrollHeight - window.innerHeight
  const progress = (scrollTop / scrollHeight) * 100
  scrollProgress.value = Math.min(Math.max(progress, 0), 100)
}

// Scroll to heading
const scrollToHeading = (id) => {
  const element = document.getElementById(id)
  if (element) {
    const targetTop = element.getBoundingClientRect().top + window.pageYOffset - sidebarTopOffset.value - 12
    window.scrollTo({ top: Math.max(targetTop, 0), behavior: 'smooth' })
  }
}

// Observe the active heading
let headingObserver
function initHeadingObserver() {
  if (headingObserver) headingObserver.disconnect()
  const content = document.querySelector('.article-content')
  if (!content) return
  const targetHeadings = content.querySelectorAll('h1, h2, h3')
  headingObserver = new IntersectionObserver((entries) => {
    const visible = entries
      .filter(e => e.isIntersecting)
      .sort((a, b) => (a.target.offsetTop || 0) - (b.target.offsetTop || 0))
    if (visible[0]?.target?.id) {
      activeHeadingId.value = visible[0].target.id
    }
  }, { rootMargin: '-20% 0px -70% 0px', threshold: [0, 1] })
  targetHeadings.forEach(h => headingObserver.observe(h))
}

// 综合滚动监听
const handleScroll = () => {
  updateScrollProgress()
}

// 获取分类数据
const loadCategories = async () => {
  try {
    const res = await getCategories()
    const payload = parseApiPayload(res)
    let categoriesData = Array.isArray(payload) ? payload : (payload?.list || [])
    
    // 为每个分类获取文章数量
    const categoriesWithCount = await Promise.all(
      categoriesData.map(async (category) => {
        try {
          // 获取该分类下的文章数量（新接口，CSV + any）
          const articlesRes = await getArticlesCount({ 
            categories: String(category.CategoryID),
            categoryMode: 'any',
            status: 'published'
          })
          const articlesPayload = parseApiPayload(articlesRes)
          const articleCount = (articlesPayload?.total) || articlesPayload?.data?.total || 0
          
          return {
            ...category,
            PostCount: articleCount
          }
        } catch (error) {
          console.error(`获取分类 ${category.Name} 文章数量失败:`, error)
          return {
            ...category,
            PostCount: 0
          }
        }
      })
    )
    
    categories.value = categoriesWithCount
  } catch (error) {
    console.error('Failed to load categories:', error)
    categories.value = []
  }
}

// 获取热门标签
const loadPopularTags = async () => {
  try {
    const res = await getTags({ pageSize: 20 })
    const payload = parseApiPayload(res)
    const allTags = Array.isArray(payload) ? payload : (payload?.list || [])
    popularTags.value = allTags.slice(0, 10) // 取前10个热门标签
  } catch (error) {
    console.error('获取标签失败:', error)
    popularTags.value = []
  }
}

// 获取相关文章（对齐新接口：多分类/多标签 + 投影/关联 + 排序）
const loadRelatedArticles = async () => {
  try {
    const params = {
      pageSize: 5,
      status: 'published',
      fields: 'PostID,Title,PublishedAt,CreatedAt,ViewCount',
      include: 'categories',
      sort: 'PublishedAt:desc,CreatedAt:desc'
    }

    if (article.value?.Categories?.length) {
      params.categories = article.value.Categories.map(c => c.CategoryID).join(',')
      params.categoryMode = 'any'
    }
    if (article.value?.Tags?.length) {
      params.tags = article.value.Tags.map(t => t.TagID).join(',')
      params.tagMode = 'any'
    }

    const res = await getArticles(params)
    const payload = parseApiPayload(res)
    const allArticles = Array.isArray(payload) ? payload : (payload?.list || [])

    relatedArticles.value = allArticles
      .filter(item => item.PostID !== parseInt(route.params.id))
      .slice(0, 3)
  } catch (error) {
    console.error('获取相关文章失败:', error)
    relatedArticles.value = []
  }
}

async function guardLoginAndGoLoginIfNeeded() {
  if (!userStore.user) {
    try {
      await userStore.initSession()
    } catch (_error) {
      // fall through to login redirect
    }
  }

  if (!userStore.user) {
    messageStore.show('请先登录', 'info')
    router.push({ path: '/login', query: { redirect: router.currentRoute.value.fullPath } })
    return false
  }
  return true
}

// 重试逻辑改为使用全局工具 withRetry

async function onToggleLike() {
  const ok = await guardLoginAndGoLoginIfNeeded()
  if (!ok) return
  try {
    let retriedNotified = false
    const res = await withRetry(
      () => likeArticle(route.params.id),
      {
        retries: 2,
        baseDelayMs: 400,
        onRetry: () => {
          if (!retriedNotified) {
            messageStore.show('网络波动，正在重试...', 'info')
            retriedNotified = true
          }
        }
      }
    )
    const payload = parseApiPayload(res)
    const newLiked = (payload && payload.liked) ?? !liked.value
    liked.value = !!newLiked
    if (typeof payload?.likeCount === 'number') {
      likeCount.value = payload.likeCount
    } else {
      likeCount.value += liked.value ? 1 : -1
      if (likeCount.value < 0) likeCount.value = 0
    }
    messageStore.show(liked.value ? '点赞成功' : '已取消点赞', 'success')
  } catch (e) {
    console.error('切换点赞失败', e)
    messageStore.show('点赞失败，请稍后重试', 'error')
  }
}

async function onToggleFavorite() {
  const ok = await guardLoginAndGoLoginIfNeeded()
  if (!ok) return
  try {
    let retriedNotified = false
    const res = await withRetry(
      () => favoriteArticle(route.params.id),
      {
        retries: 2,
        baseDelayMs: 400,
        onRetry: () => {
          if (!retriedNotified) {
            messageStore.show('网络波动，正在重试...', 'info')
            retriedNotified = true
          }
        }
      }
    )
    const payload = parseApiPayload(res)
    const newFavorited = (payload && payload.favorited) ?? !favorited.value
    favorited.value = !!newFavorited
    messageStore.show(favorited.value ? '已收藏' : '已取消收藏', 'success')
  } catch (e) {
    console.error('切换收藏失败', e)
    messageStore.show('收藏失败，请稍后重试', 'error')
  }
}

async function loadArticleCore(id) {
  try {
    const res = await getArticle(id, { include: 'user' })
    const payload = parseApiPayload(res)
    if (payload) {
      article.value = payload
      likeCount.value = Number(article.value?.LikeCount || 0)
      liked.value = !!article.value?.Liked
      favorited.value = !!article.value?.Favorited

      // 加载相关文章
      await loadRelatedArticles()

      // 提取标题生成目录（与渲染使用同一份 Markdown 源）
      const mdSource = getArticleMarkdown()
      if (mdSource) {
        headings.value = extractHeadings(mdSource)
        // 为文章中的标题添加 id
        setTimeout(() => {
          const content = document.querySelector('.article-content')
          if (content) {
            const headingElements = content.querySelectorAll('h1, h2, h3')
            headingElements.forEach((el, index) => {
              el.id = `heading-${index}`
            })
            initHeadingObserver()
          }
        }, 100)
      } else {
        headings.value = []
      }
    }
  } catch (error) {
    console.error('获取文章失败:', error)
    messageStore.show('文章加载失败', 'error')
  }
}

onMounted(async () => {
  updateSidebarTopOffset()

  // Sync sticky offsets and scroll listeners
  window.addEventListener('scroll', handleScroll)
  window.addEventListener('resize', updateSidebarTopOffset)
  updateScrollProgress()

  // Load sidebar data
  const loadTasks = [loadCategories(), loadPopularTags()]

  // Load article content and TOC
  await loadArticleCore(route.params.id)

  // Wait for sidebar requests
  await Promise.allSettled(loadTasks)

  // Load comments
  loadComments()
})

watch(() => route.params.id, async (newId, oldId) => {
  if (newId === oldId) return
  // 回到页面顶部
  window.scrollTo({ top: 0, behavior: 'smooth' })
  // 重新加载文章与相关文章/目录
  await loadArticleCore(newId)
  // 重置并重新加载评论
  await loadComments(true)
})

onUnmounted(() => {
  // Remove page listeners
  window.removeEventListener('scroll', handleScroll)
  window.removeEventListener('resize', updateSidebarTopOffset)
  if (headingObserver) {
    headingObserver.disconnect()
  }
})

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
    const commentTreeResponse = await getCommentTree(route.params.id, {
      status: 'approved',
      page: commentPage.value,
      pageSize: commentPageSize.value
    })
    const { list: nextComments, pagination: nextPagination } = normalizeCommentTreeResponse(commentTreeResponse)

    if (reset) {
      comments.value = nextComments
    } else {
      comments.value.push(...nextComments)
    }

    hasMoreComments.value = typeof nextPagination?.hasMore === 'boolean'
      ? nextPagination.hasMore
      : nextComments.length === commentPageSize.value

    if (hasMoreComments.value) {
      const currentPage = Number(nextPagination?.page || commentPage.value)
      commentPage.value = currentPage + 1
    }
  } catch (error) {
    console.error('[PostDetail.vue] 获取评论树失败:', error)
    messageStore.show('评论加载失败，请稍后重试', 'error')
  } finally {
    isLoadingComments.value = false
  }
}

// 头像 URL 兼容处理
import defaultAvatar from '@/assets/icons/login-active.png'
import { resolveAvatarUrl } from '@/utils/avatar'

const authorAvatarSrc = computed(() => {
  // 后端字段为 user.AvatarURL；以下做兼容与清洗
  const raw =
    article.value?.user?.AvatarURL ||
    article.value?.User?.AvatarURL ||
    article.value?.Author?.AvatarURL ||
    article.value?.user?.AvatarUrl ||
    article.value?.User?.AvatarUrl ||
    article.value?.Author?.AvatarUrl ||
    article.value?.user?.avatarURL ||
    article.value?.user?.avatarUrl ||
    article.value?.User?.Avatar ||
    article.value?.Author?.Avatar

  const resolvedAvatar = resolveAvatarUrl(raw)
  if (resolvedAvatar) return resolvedAvatar
  return defaultAvatar
  // 统一分隔符为 '/'
})
function onAuthorAvatarError(e) {
  if (e?.target) e.target.src = defaultAvatar
}

async function submitComment() {
  if (!newComment.value.trim()) return
  const ok = await guardLoginAndGoLoginIfNeeded()
  if (!ok) return
  try {
    let retriedNotified = false
    const res = await withRetry(
      () => postComment(route.params.id, { content: newComment.value.trim() }),
      {
        retries: 2,
        baseDelayMs: 400,
        onRetry: () => {
          if (!retriedNotified) {
            messageStore.show('网络波动，正在重试...', 'info')
            retriedNotified = true
          }
        }
      }
    )
    
    const payload = parseApiPayload(res)
    if (payload) {
      newComment.value = ''
      messageStore.show('评论成功', 'success')
      // 重新获取评论列表
      await loadComments(true)
    }
  } catch (error) {
    console.error('[PostDetail.vue] 发表评论失败:', error)
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

// 处理评论删除
function handleCommentDeleted(commentId) {
  // 从评论列表中移除被删除的评论
  removeCommentFromTree(comments.value, commentId)
}

// 递归从评论树中移除指定评论
function removeCommentFromTree(commentList, commentId) {
  for (let i = 0; i < commentList.length; i++) {
    if (commentList[i].CommentID === commentId) {
      commentList.splice(i, 1)
      return true
    }
    if (commentList[i].children && commentList[i].children.length > 0) {
      if (removeCommentFromTree(commentList[i].children, commentId)) {
        return true
      }
    }
  }
  return false
}

async function submitReply() {
  if (!replyContent.value.trim()) return
  const ok = await guardLoginAndGoLoginIfNeeded()
  if (!ok) return
  try {
    let retriedNotified = false
    const res = await withRetry(
      () => postComment(route.params.id, {
        content: replyContent.value.trim(),
        parentId: replyToComment.value.CommentID
      }),
      {
        retries: 2,
        baseDelayMs: 400,
        onRetry: () => {
          if (!retriedNotified) {
            messageStore.show('网络波动，正在重试...', 'info')
            retriedNotified = true
          }
        }
      }
    )
    
    const payload = parseApiPayload(res)
    if (payload) {
      cancelReply()
      messageStore.show('回复成功', 'success')
      // 重新获取评论列表
      await loadComments(true)
    }
  } catch (error) {
    console.error('[PostDetail.vue] 回复评论失败:', error)
    messageStore.show('回复失败，请稍后重试', 'error')
  }
}
</script> 

<style scoped>
/* 基础背景和卡片样式 */
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
  transform: translateY(-3px);
  box-shadow: 0 22px 54px rgba(0, 0, 0, 0.28);
  border-color: rgba(120, 163, 255, 0.22);
}

.article-shell,
.comment-shell,
.category-panel,
.related-panel,
.tag-panel,
.toc-shell {
  position: relative;
  overflow: hidden;
}

.article-shell::before,
.comment-shell::before,
.category-panel::before,
.related-panel::before,
.tag-panel::before,
.toc-shell::before {
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

.comment-shell::before,
.related-panel::before,
.tag-panel::before {
  animation-delay: -2.8s;
}

/* 分类导航样式 */
.category-tree {
  transition: all 0.3s ease;
}

.category-item {
  transition: all 0.2s ease;
}

.category-item:hover {
  background: rgba(120, 163, 255, 0.1);
  transform: translateX(4px);
}

/* 标签云动画 */
.tag-cloud {
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

/* 文章卡片动画 */
.article-card {
  transition: all 0.3s ease;
}

.article-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.24);
}

.related-card {
  position: relative;
  overflow: hidden;
}

.related-card::before,
.related-card::after {
  content: "";
  position: absolute;
  pointer-events: none;
}

.related-card::before {
  inset: -24% auto -24% -18%;
  width: 34%;
  background: linear-gradient(120deg, transparent 0 18%, rgba(255, 255, 255, 0.04) 28%, rgba(120, 163, 255, 0.24) 48%, rgba(255, 123, 176, 0.14) 66%, transparent 100%);
  transform: translateX(-180%) skewX(-18deg);
  opacity: 0.52;
  mix-blend-mode: screen;
  animation: detailSweep 8.2s ease-in-out infinite;
}

.related-card::after {
  left: 16px;
  right: 16px;
  top: 0;
  height: 1px;
  background: linear-gradient(90deg, rgba(120, 163, 255, 0.92), rgba(255, 123, 176, 0.68), transparent);
  box-shadow: 0 0 18px rgba(120, 163, 255, 0.16);
}

.related-card:hover::after {
  right: 32px;
}

/* 目录卡片样式 */
.sidebar-stack {
  z-index: 10;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.18) transparent;
}

.sidebar-stack::-webkit-scrollbar {
  width: 6px;
}

.sidebar-stack::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar-stack::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.18);
  border-radius: 999px;
}

.sidebar-stack::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.28);
}

.toc-card {
  background: var(--panel);
  backdrop-filter: blur(18px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 18px 48px rgba(0, 0, 0, 0.24);
  border-radius: 12px;
  transition: all 0.3s ease;
}

.toc-card nav {
  scrollbar-width: thin;
  scrollbar-color: rgba(156, 163, 175, 0.5) transparent;
}

.toc-card nav::-webkit-scrollbar {
  width: 4px;
}

.toc-card nav::-webkit-scrollbar-track {
  background: transparent;
}

.toc-card nav::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.18);
  border-radius: 2px;
}

.toc-card nav::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

.toc-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.24);
  border-color: rgba(120, 163, 255, 0.22);
}

.toc-item {
  display: block;
  padding: 8px 16px;
  color: var(--muted);
  text-decoration: none;
  font-size: 13px;
  border-radius: 6px;
  margin: 2px 4px;
  transition: all 0.2s ease;
  position: relative;
}

.toc-item:hover {
  background: rgba(120, 163, 255, 0.08);
  color: var(--accent);
  transform: translateX(4px);
}

.toc-item.active {
  background: rgba(120, 163, 255, 0.12);
  color: var(--accent);
  font-weight: 500;
}

.toc-item.level-2 {
  padding-left: 24px;
  font-size: 12px;
}

.toc-item.level-3 {
  padding-left: 32px;
  font-size: 11px;
  color: rgba(158, 201, 218, 0.86);
}

.toc-item.level-2::before {
  content: "→";
  margin-right: 4px;
  opacity: 0.6;
}

.toc-item.level-3::before {
  content: "→";
  margin-right: 4px;
  opacity: 0.4;
}

/* 滚动指示器 */
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

/* 文章内容样式 */
.article-content {
  width: 100%;
  overflow-x: hidden;
}

@keyframes detailSweep {
  0% {
    transform: translateX(-180%) skewX(-18deg);
  }
  46%, 100% {
    transform: translateX(340%) skewX(-18deg);
  }
}

/* 响应式布局优化 */
@media (max-width: 1024px) {
  .grid-cols-1.lg\\:grid-cols-5 {
    grid-template-columns: 1fr;
  }
  
  .lg\\:col-span-1 {
    grid-column: span 1;
  }
  
  .lg\\:col-span-3 {
    grid-column: span 1;
  }
  
  /* 移动端时隐藏侧边栏 */
  .lg\\:col-span-1:first-child,
  .lg\\:col-span-1:last-child {
    display: none;
  }
  
  /* 调整导航栏 */
  .w-full {
    padding-left: 1rem;
    padding-right: 1rem;
  }

  .white-bg > .w-full {
    padding-left: 0.75rem;
    padding-right: 0.75rem;
  }
}

@media (max-width: 768px) {
  /* 移动端样式调整 */
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
  
  .hidden.md\\:flex {
    display: none;
  }
  
  /* 标签云在移动端的调整 */
  .tag-cloud {
    animation: none; /* 移动端禁用动画 */
  }
}

@media (max-width: 640px) {
  /* 超小屏幕优化 */
  .px-4 {
    padding-left: 0;
    padding-right: 0;
  }
  
  .py-6 {
    padding-top: 0.5rem;
    padding-bottom: 0.75rem;
  }
  
  .space-x-4 > * + * {
    margin-left: 0.5rem;
  }
  
  .space-y-6 > * + * {
    margin-top: 0.75rem;
  }

  .glass-card {
    margin: 0;
    border-radius: 0;
  }

  .article-shell > .p-8,
  .article-shell > .px-8.py-6,
  .comment-shell {
    padding: 0.875rem;
  }

  .article-author-row img {
    margin-right: 0;
  }

  .article-action-group {
    width: 100%;
  }

  .white-bg > .w-full {
    padding-left: 0 !important;
    padding-right: 0 !important;
  }

  .white-bg .grid.grid-cols-1 {
    gap: 0.75rem;
  }

  .article-shell {
    margin: 0;
    border-radius: 0;
  }

  .article-shell > .p-8,
  .article-shell > .px-8.py-6 {
    padding-left: 8px;
    padding-right: 8px;
  }

  .article-shell .text-4xl {
    font-size: 1.45rem;
    line-height: 1.9rem;
  }

  .article-author-row,
  .article-footer-bar,
  .comment-shell {
    font-size: 12px;
  }

  .tag-cloud {
    gap: 0.4rem;
  }

  .tag-cloud span {
    padding: 0.25rem 0.55rem;
    font-size: 11px;
  }

  .article-content :deep(pre) {
    margin-left: 0;
    margin-right: 0;
    border-radius: 0.75rem;
    padding: 0.875rem 0.875rem 0.875rem 2.9rem !important;
  }

  .article-content :deep(pre code) {
    font-size: 12px;
    line-height: 1.55;
  }

  .article-content :deep(h1) {
    font-size: 1.3rem;
  }

  .article-content :deep(h2) {
    font-size: 1.15rem;
  }

  .article-content :deep(h3) {
    font-size: 1rem;
  }

  .article-content :deep(p),
  .article-content :deep(li),
  .article-content :deep(blockquote) {
    font-size: 13px;
    line-height: 1.65;
  }

  .article-content :deep(ul),
  .article-content :deep(ol) {
    padding-left: 1.1rem;
  }
}

@media (max-width: 390px) {
  .glass-card {
    margin: 0;
    border-radius: 0;
  }

  .text-4xl {
    font-size: 1.3rem;
    line-height: 1.7rem;
  }

  .article-shell > .p-8,
  .article-shell > .px-8.py-6,
  .comment-shell,
  .toc-card,
  .related-panel,
  .tag-panel,
  .category-panel {
    padding: 0.75rem !important;
  }
}

/* 文本截断 */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 滚动条样式 */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.04);
}

::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.16);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.28);
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

.article-content :deep(p) {
  @apply my-4 leading-7;
  color: var(--text);
}

.article-content :deep(pre) {
  @apply my-4 rounded-lg bg-[#2b2b2b] overflow-x-auto relative;
  padding: 1rem 1rem 1rem 3.5rem !important; /* 为行号预留空间 */
}

.article-content :deep(code) {
  @apply font-mono text-sm;
}

.article-content :deep(ul), 
.article-content :deep(ol) {
  @apply my-4 pl-6;
}

.article-content :deep(li) {
  @apply my-2;
}

.article-content :deep(blockquote) {
  @apply my-4 pl-4 border-l-4;
  border-color: rgba(120, 163, 255, 0.28);
  color: var(--muted);
}

.article-content :deep(img) {
  @apply max-w-full my-4 rounded-lg;
}

.article-content :deep(a) {
  color: var(--accent);
  text-decoration: none;
}

.article-content :deep(a:hover) {
  text-decoration: underline;
}

.article-content :deep(table) {
  @apply w-full my-4 border-collapse;
}

.article-content :deep(th),
.article-content :deep(td) {
  @apply border p-2;
  border-color: rgba(255, 255, 255, 0.12);
}

/* 代码块样式优化 */
.article-content :deep(pre) {
  @apply my-4 rounded-lg bg-[#2b2b2b] overflow-x-auto relative;
  padding: 1rem 1rem 1rem 3.5rem !important; /* 为行号预留空间 */
}

.article-content :deep(pre code) {
  @apply block text-gray-100;
  counter-reset: line;
  font-family: Consolas, Monaco, 'Andale Mono', monospace;
  font-size: 14px;
  line-height: 1.6;
}

/* 代码行号样式 */
.article-content :deep(pre code .hljs-ln-line) {
  @apply relative pl-8;
  counter-increment: line;
}

.article-content :deep(pre code .hljs-ln-line)::before {
  @apply absolute left-0 text-gray-500 text-right w-8 pr-2;
  content: counter(line);
}

/* 行内代码样式 */
.article-content :deep(code:not(pre code)) {
  @apply px-2 py-0.5 rounded mx-1;
  background: rgba(255, 255, 255, 0.08);
  color: #ffd6e6;
  font-family: Consolas, Monaco, 'Andale Mono', monospace;
  font-size: 0.9em;
}

/* 移除 Markdown 标记符号 */
.article-content :deep(.vditor-ir__marker),
.article-content :deep(.vditor-reset mark) {
  display: none !important;
  background-color: transparent !important;
}

/* 确保普通段落不会被误识别为代码块 */
.article-content :deep(p) {
  @apply my-4 leading-7 whitespace-pre-wrap;
  color: var(--text);
}

/* 代码高亮主题颜色 */
.article-content :deep(.hljs-keyword),
.article-content :deep(.hljs-tag),
.article-content :deep(.hljs-name) {
  color: #cc99cd;
}

.article-content :deep(.hljs-attr) {
  color: #e6d06c;
}

.article-content :deep(.hljs-string) {
  color: #a8ff60;
}

.article-content :deep(.hljs-comment) {
  color: #999;
  font-style: italic;
}

.article-content :deep(.hljs-function) {
  color: #fff;
}

.article-content :deep(.hljs-number) {
  color: #ff73fd;
}

.article-content :deep(.hljs-operator) {
  color: #fff;
}

.article-content :deep(.hljs-punctuation) {
  color: #fff;
}

.article-content :deep(.hljs-property) {
  color: #e6d06c;
}

.article-content :deep(.hljs-title) {
  color: #a6e22e;
}

.article-content :deep(.hljs-class) {
  color: #fff;
}

.article-content :deep(.hljs-variable) {
  color: #fff;
}

.article-content :deep(.hljs-params) {
  color: #fff;
}
</style> 
