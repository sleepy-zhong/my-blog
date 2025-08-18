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
      <div class="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        <!-- 左侧分类导航和目录 -->
        <div class="lg:col-span-1">
          <div class="space-y-6">
            <!-- 文章分类卡片 -->
            <div class="glass-card rounded-xl p-6 sticky top-6">
              <h3 class="text-lg font-semibold mb-4 text-gray-800">文章分类</h3>
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
            
            <!-- 文章目录卡片 -->
            <div 
              v-if="headings.length > 0" 
              class="toc-card rounded-xl p-6 sticky"
              :class="{ 'mt-6': categories.length > 0 }"
              :style="{ 
                top: tocTopOffset + 'px',
                maxHeight: 'calc(100vh - ' + (tocTopOffset + 40) + 'px)',
                overflowY: 'auto'
              }"
            >
              <h3 class="text-lg font-semibold mb-4 text-gray-800 flex items-center">
                <svg class="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"/>
                </svg>
                文章目录
              </h3>
              <nav class="space-y-1 max-h-96 overflow-y-auto">
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
              
              <!-- 进度条 -->
              <div class="mt-4 pt-4 border-t border-gray-200">
                <div class="flex items-center text-xs text-gray-500 mb-2">
                  <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                  </svg>
                  阅读进度
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
          </div>
        </div>

        <!-- 中间文章内容 -->
        <div class="lg:col-span-3">
          <article class="glass-card rounded-xl overflow-hidden">
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
              <div class="flex items-center text-gray-600 text-sm">
                <img 
                  :src="authorAvatarSrc" 
                  class="w-10 h-10 rounded-full mr-3 object-cover" 
                  @error="onAuthorAvatarError"
                >
                <div>
                  <div class="font-medium text-gray-900">{{ article?.user?.DisplayName || article?.User?.DisplayName || article?.Author?.DisplayName || '佚名' }}</div>
                  <div class="flex items-center space-x-4">
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
              <div class="flex items-center justify-between">
                <div class="flex space-x-4">
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
                    <span>评论 ({{ comments.length }})</span>
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
          <div class="glass-card rounded-xl mt-8 p-8">
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
        <div class="lg:col-span-1">
          <div class="space-y-6">
            <!-- 相关文章 -->
            <div class="glass-card rounded-xl p-6 sticky top-6">
              <h3 class="text-lg font-semibold mb-4 text-gray-800">相关文章</h3>
              <div class="space-y-4">
                <div 
                  v-for="relatedArticle in relatedArticles" 
                  :key="relatedArticle.PostID"
                  class="article-card p-4 bg-white rounded-lg border border-gray-100 cursor-pointer"
                  @click="goToArticle(relatedArticle.PostID)"
                >
                  <h4 class="font-medium text-gray-900 text-sm mb-2 line-clamp-2">{{ relatedArticle.Title }}</h4>
                  <div class="flex items-center text-xs text-gray-500">
                    <span>{{ formatDate(relatedArticle.PublishedAt || relatedArticle.CreatedAt, 'relative') }}</span>
                    <span class="mx-2">•</span>
                    <span>阅读 {{ relatedArticle.ViewCount || 0 }}</span>
                  </div>
                </div>
              </div>
              <button @click="goToMoreRelated" class="w-full mt-4 py-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium">查看更多</button>
            </div>
            
            <!-- 热门标签 -->
            <div class="glass-card rounded-xl p-6">
              <h3 class="text-lg font-semibold mb-4 text-gray-800">热门标签</h3>
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

    <!-- 回复弹窗 -->
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

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const messageStore = useMessageStore()

// 文章相关数据
const article = ref(null)
const headings = ref([])
const activeHeadingId = ref('')
const scrollProgress = ref(0)
const tocTopOffset = ref(24) // 目录距离顶部的偏移量

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
function parseApiPayload(res) {
  // axios 拦截器已经解包了 res.data，所以这里直接返回 res
  // 如果有嵌套的 data 结构，再解包一层
  return res?.data || res
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
  return md.render(mdSource)
})

// 提取文章中的标题生成目录
const extractHeadings = (content) => {
  const tempDiv = document.createElement('div')
  tempDiv.innerHTML = md.render(content)
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

// 滚动进度监听
const updateScrollProgress = () => {
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop
  const scrollHeight = document.documentElement.scrollHeight - window.innerHeight
  const progress = (scrollTop / scrollHeight) * 100
  scrollProgress.value = Math.min(Math.max(progress, 0), 100)
  
  // 动态调整目录位置 - 当滚动到一定距离时调整offset
  if (scrollTop > 100) {
    tocTopOffset.value = 24 // 当页面滚动后，保持较小的偏移
  } else {
    tocTopOffset.value = 24 // 页面顶部时也保持一致的偏移
  }
}

// 滚动到指定标题
const scrollToHeading = (id) => {
  const element = document.getElementById(id)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

// 观察当前标题，高亮目录项
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
    console.error('获取分类失败:', error)
    // 使用模拟数据
    categories.value = [
      { CategoryID: 1, Name: 'springboot', PostCount: 12 },
      { CategoryID: 2, Name: '前端', PostCount: 8 },
      { CategoryID: 3, Name: '后端', PostCount: 5 },
      { CategoryID: 4, Name: '数据库', PostCount: 3 },
      { CategoryID: 5, Name: '测试', PostCount: 15 },
      { CategoryID: 6, Name: 'React', PostCount: 7 }
    ]
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
    // 使用模拟数据
    popularTags.value = [
      { TagID: 1, Name: 'Vue.js' },
      { TagID: 2, Name: 'React' },
      { TagID: 3, Name: 'TypeScript' },
      { TagID: 4, Name: 'JavaScript' },
      { TagID: 5, Name: 'CSS' },
      { TagID: 6, Name: 'Node.js' }
    ]
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
    // 使用模拟数据
    relatedArticles.value = [
      {
        PostID: 2,
        Title: 'Vue 3 性能优化指南：从入门到精通',
        ViewCount: 856,
        CreatedAt: new Date(Date.now() - 86400000).toISOString()
      },
      {
        PostID: 3,
        Title: '深入理解 Vue 3 响应式原理',
        ViewCount: 1245,
        CreatedAt: new Date(Date.now() - 259200000).toISOString()
      },
      {
        PostID: 4,
        Title: 'Vue 3 + TypeScript 项目实战',
        ViewCount: 987,
        CreatedAt: new Date(Date.now() - 604800000).toISOString()
      }
    ]
  }
}

async function guardLoginAndGoLoginIfNeeded() {
  if (!userStore.token) {
    messageStore.show('请先登录', 'info')
    router.push({ path: '/login', query: { redirect: router.currentRoute.value.fullPath } })
    return false
  }
  if (!userStore.user) {
    try { await userStore.fetchUser() } catch {}
    if (!userStore.user) {
      messageStore.show('请先登录', 'info')
      router.push({ path: '/login', query: { redirect: router.currentRoute.value.fullPath } })
      return false
    }
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
  // 添加滚动监听
  window.addEventListener('scroll', handleScroll)

  // 并行加载分类/标签
  const loadTasks = [loadCategories(), loadPopularTags()]

  // 加载文章与相关文章/目录
  await loadArticleCore(route.params.id)

  // 等待其他任务
  await Promise.allSettled(loadTasks)

  // 获取评论树
  loadComments()
})

// 监听路由参数变化，支持在详情页内跳转到另一篇文章
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
  // 清理监听器
  window.removeEventListener('scroll', handleScroll)
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
    // 模拟API调用 - 当后端不可用时使用
    const mockComments = [
      {
        CommentID: 1,
        Content: "这是一条主评论，我觉得这篇文章写得很好！",
        User: {
          UserID: 1,
          Username: "user1",
          DisplayName: "张三",
          AvatarURL: ""
        },
        CreatedAt: "2025-01-27T10:00:00.000Z",
        children: [
          {
            CommentID: 2,
            Content: "我也觉得不错，特别是第二段的分析很到位。",
            User: {
              UserID: 2,
              Username: "user2",
              DisplayName: "李四",
              AvatarURL: ""
            },
            CreatedAt: "2025-01-27T10:15:00.000Z",
            children: [
              {
                CommentID: 3,
                Content: "确实，作者的见解很独特。",
                User: {
                  UserID: 3,
                  Username: "user3",
                  DisplayName: "王五",
                  AvatarURL: ""
                },
                CreatedAt: "2025-01-27T10:30:00.000Z",
                children: []
              }
            ]
          },
          {
            CommentID: 4,
            Content: "同意楼上，这个观点我之前没想到过。",
            User: {
              UserID: 4,
              Username: "user4",
              DisplayName: "赵六",
              AvatarURL: ""
            },
            CreatedAt: "2025-01-27T10:45:00.000Z",
            children: []
          }
        ]
      },
      {
        CommentID: 5,
        Content: "另一个角度来看，我觉得还可以加入更多的实例来论证观点。",
        User: {
          UserID: 5,
          Username: "user5",
          DisplayName: "钱七",
          AvatarURL: ""
        },
        CreatedAt: "2025-01-27T11:00:00.000Z",
        children: [
          {
            CommentID: 6,
            Content: "这个建议很好，实例确实能让文章更有说服力。",
            User: {
              UserID: 6,
              Username: "user6",
              DisplayName: "孙八",
              AvatarURL: ""
            },
            CreatedAt: "2025-01-27T11:15:00.000Z",
            children: []
          }
        ]
      }
    ]
    
    // 尝试真实API调用，如果失败则使用模拟数据
    let payload
    try {
      const res = await getCommentTree(route.params.id, {
        status: 'approved',
        page: commentPage.value,
        pageSize: commentPageSize.value
      })
      payload = parseApiPayload(res)
    } catch (apiError) {
      payload = mockComments
    }
    
    const newComments = Array.isArray(payload) ? payload : (payload?.items || payload?.list || [])
    
    if (reset) {
      comments.value = newComments
    } else {
      comments.value.push(...newComments)
    }
    hasMoreComments.value = newComments.length === commentPageSize.value
    if (hasMoreComments.value) {
      commentPage.value++
    }
  } catch (error) {
    console.error('[PostDetail.vue] 获取评论树失败:', error)
    messageStore.show('评论功能暂时不可用', 'info')
  } finally {
    isLoadingComments.value = false
  }
}

// 头像 URL 兼容处理
import defaultAvatar from '@/assets/icons/login-active.png'
const avatarBase = import.meta?.env?.VITE_API_BASE_URL || 'http://localhost:3000'

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

  if (!raw) return defaultAvatar
  const trimmed = String(raw).trim()
  if (!trimmed) return defaultAvatar
  // 统一分隔符为 '/'
  const unified = trimmed.replace(/\\/g, '/')
  if (unified.startsWith('http')) return unified
  const normalizedPath = unified.startsWith('/') ? unified : `/${unified}`
  const base = (avatarBase && avatarBase.endsWith('/')) ? avatarBase.slice(0, -1) : avatarBase
  return base + normalizedPath
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
  background: #ffffff;
}

.glass-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(229, 231, 235, 0.8);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.glass-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.25), 0 4px 16px rgba(0, 0, 0, 0.15);
  border-color: rgba(99, 102, 241, 0.4);
}

/* 分类导航样式 */
.category-tree {
  transition: all 0.3s ease;
}

.category-item {
  transition: all 0.2s ease;
}

.category-item:hover {
  background: rgba(67, 56, 202, 0.1);
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
  box-shadow: 0 20px 40px rgba(0,0,0,0.1);
}

/* 目录卡片样式 */
.toc-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(229, 231, 235, 0.8);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  transition: all 0.3s ease;
  position: sticky;
  z-index: 10;
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
  background: rgba(156, 163, 175, 0.5);
  border-radius: 2px;
}

.toc-card nav::-webkit-scrollbar-thumb:hover {
  background: rgba(156, 163, 175, 0.8);
}

.toc-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
  border-color: rgba(99, 102, 241, 0.3);
}

.toc-item {
  display: block;
  padding: 8px 16px;
  color: #6b7280;
  text-decoration: none;
  font-size: 13px;
  border-radius: 6px;
  margin: 2px 4px;
  transition: all 0.2s ease;
  position: relative;
}

.toc-item:hover {
  background: rgba(99, 102, 241, 0.05);
  color: #6366f1;
  transform: translateX(4px);
}

.toc-item.active {
  background: rgba(99, 102, 241, 0.1);
  color: #6366f1;
  font-weight: 500;
}

.toc-item.level-2 {
  padding-left: 24px;
  font-size: 12px;
}

.toc-item.level-3 {
  padding-left: 32px;
  font-size: 11px;
  color: #9ca3af;
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
  background: rgba(229, 231, 235, 0.3);
  z-index: 1001;
}

.scroll-progress {
  height: 100%;
  background: linear-gradient(90deg, #6366f1, #8b5cf6);
  width: 0%;
  transition: width 0.1s ease;
}

/* 文章内容样式 */
.article-content {
  width: 100%;
  overflow-x: hidden;
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
    padding-left: 0.75rem;
    padding-right: 0.75rem;
  }
  
  .py-6 {
    padding-top: 1rem;
    padding-bottom: 1rem;
  }
  
  .space-x-4 > * + * {
    margin-left: 0.5rem;
  }
  
  .space-y-6 > * + * {
    margin-top: 1rem;
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
  background: #f1f1f1;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

.article-content :deep(h1) {
  @apply text-3xl font-bold my-6;
}

.article-content :deep(h2) {
  @apply text-2xl font-bold my-5;
}

.article-content :deep(h3) {
  @apply text-xl font-bold my-4;
}

.article-content :deep(p) {
  @apply my-4 leading-7 text-gray-800;
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
  @apply my-4 pl-4 border-l-4 border-gray-300 text-gray-700;
}

.article-content :deep(img) {
  @apply max-w-full my-4 rounded-lg;
}

.article-content :deep(a) {
  @apply text-blue-500 hover:underline;
}

.article-content :deep(table) {
  @apply w-full my-4 border-collapse;
}

.article-content :deep(th),
.article-content :deep(td) {
  @apply border border-gray-300 p-2;
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
  @apply px-2 py-0.5 bg-gray-100 rounded text-pink-600 mx-1;
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
  @apply my-4 leading-7 text-gray-800 whitespace-pre-wrap;
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