<template>
  <div class="post-list-page">
    <!-- 顶部导航 -->
    <!-- <nav class="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-4 py-3">
        <div class="flex items-center justify-between">
          <router-link to="/" class="flex items-center space-x-2 group">
            <svg class="w-8 h-8 text-indigo-600 group-hover:text-indigo-700 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"/>
            </svg>
          </router-link>
          <div class="hidden md:flex space-x-6">
            <router-link to="/" class="text-gray-600 hover:text-indigo-600">首页</router-link>
            <router-link to="/posts" class="text-indigo-600 font-medium">文章</router-link>
            <a href="#" class="text-gray-600 hover:text-indigo-600">分类</a>
            <a href="#" class="text-gray-600 hover:text-indigo-600">标签</a>
          </div>
        </div>
      </div>
    </nav> -->

    <div class="list-shell w-full px-4 py-8">
      <section class="list-hero glass-card rounded-[28px] p-6 mb-8">
        <div class="hero-copy">
          <span class="hero-kicker">Article Deck</span>
          <h1>在这里有我的学习笔记备忘录和一些生活分享</h1>
          <p>将自己的小灵感记录下来，说不定在以后的时间里面，有神奇的效果哦。</p>
        </div>
        <div class="hero-metrics">
          <div class="metric-card">
            <strong>{{ totalArticles }}</strong>
            <span>公开文章</span>
          </div>
          <div class="metric-card">
            <strong>{{ categories.length }}</strong>
            <span>分类轨道</span>
          </div>
          <div class="metric-card">
            <strong>{{ selectedCategoryIds.length + selectedTagIds.length }}</strong>
            <span>当前筛选</span>
          </div>
        </div>
      </section>

      <button
        type="button"
        class="filter-toggle lg:hidden"
        @click="toggleMobileFilters"
      >
        <span>筛选条件</span>
        <strong>{{ selectedCategoryIds.length + selectedTagIds.length }}</strong>
      </button>

      <button
        v-if="showMobileFilters"
        type="button"
        class="mobile-filter-backdrop lg:hidden"
        aria-label="Close filters"
        @click="closeMobileFilters"
      ></button>

      <div class="flex flex-col lg:flex-row gap-8">
        <!-- 左侧分类/标签筛选 -->
        <div
          class="list-sidebar lg:w-1/4"
          :class="{ open: showMobileFilters }"
          @click.stop
        >
          <div class="glass-card filter-panel rounded-xl p-6 sticky top-4">
            <div class="drawer-head lg:hidden">
              <div>
                <span class="drawer-kicker">Filter Deck</span>
                <h2 class="drawer-title">????</h2>
              </div>
              <button
                type="button"
                class="drawer-close"
                aria-label="Close filters"
                @click="closeMobileFilters"
              >
                &times;
              </button>
            </div>
            <h2 class="text-xl font-bold text-gray-800 mb-6 desktop-filter-title">筛选</h2>

            <!-- 全部文章 / 重置筛选 -->
            <div
              :class="[
                'category-item p-3 rounded-lg cursor-pointer mb-2 transition-all',
                selectedCategoryIds.length === 0 && selectedTagIds.length === 0 ? 'bg-indigo-100 text-indigo-700 shadow-sm' : 'hover:bg-gray-50'
              ]"
              @click="resetFilters"
            >
              <div class="flex items-center justify-between">
                <span class="font-medium">全部文章</span>
                <span class="text-sm text-gray-500">{{ totalArticles }}</span>
              </div>
            </div>

            <!-- 分类列表（多选） -->
            <div class="space-y-2">
              <div class="flex items-center justify-between mb-2">
                <h3 class="text-sm font-semibold text-gray-700">分类</h3>
                <div class="flex items-center gap-2 text-xs text-gray-500">
                  <label class="flex items-center gap-1 cursor-pointer">
                    <input type="radio" value="any" v-model="categoryMode" @change="onFilterChange" /> 并集
                  </label>
                  <label class="flex items-center gap-1 cursor-pointer">
                    <input type="radio" value="all" v-model="categoryMode" @change="onFilterChange" /> 交集
                  </label>
                </div>
              </div>
              <div
                v-for="category in categories"
                :key="category.CategoryID"
                :class="[
                  'category-item p-3 rounded-lg cursor-pointer transition-all flex items-center justify-between',
                  selectedCategoryIds.includes(category.CategoryID)
                    ? 'bg-indigo-100 text-indigo-700 shadow-sm'
                    : 'hover:bg-gray-50'
                ]"
                @click="toggleCategory(category.CategoryID)"
              >
                <div class="flex items-center justify-between">
                  <span class="font-medium">{{ category.Name }}</span>
                  <span class="text-sm text-gray-500">{{ category.PostCount || 0 }}</span>
                </div>

                <!-- 分类下的文章列表（展开时显示） -->
                <div v-if="selectedCategoryIds.includes(category.CategoryID) && categoryArticles.length > 0" class="mt-3 ml-2 space-y-2">
                  <div
                    v-for="article in categoryArticles"
                    :key="article.PostID"
                    class="text-sm text-gray-600 hover:text-indigo-600 cursor-pointer flex items-center justify-between"
                    @click.stop="goToArticle(article.PostID)"
                  >
                    <span class="flex-1 line-clamp-1">{{ article.Title }}</span>
                    <!-- 文章标签 -->
                    <div v-if="article.Tags && article.Tags.length > 0" class="flex gap-1 ml-2">
                      <span
                        v-for="tag in article.Tags.slice(0, 2)"
                        :key="tag.TagID"
                        class="px-1.5 py-0.5 bg-gray-100 text-xs rounded"
                      >
                        {{ tag.Name }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 标签列表（多选，简化为热门标签 Top N，可根据需要改为分页/搜索） -->
            <div class="space-y-2 mt-6">
              <div class="flex items-center justify-between mb-2">
                <h3 class="text-sm font-semibold text-gray-700">标签</h3>
                <div class="flex items-center gap-2 text-xs text-gray-500">
                  <label class="flex items-center gap-1 cursor-pointer">
                    <input type="radio" value="any" v-model="tagMode" @change="onFilterChange" /> 并集
                  </label>
                  <label class="flex items-center gap-1 cursor-pointer">
                    <input type="radio" value="all" v-model="tagMode" @change="onFilterChange" /> 交集
                  </label>
                </div>
              </div>
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="tag in popularTags"
                  :key="tag.TagID"
                  :class="[
                    'px-2 py-1 rounded-full text-sm cursor-pointer',
                    selectedTagIds.includes(tag.TagID)
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  ]"
                  @click="toggleTag(tag.TagID)"
                >
                  # {{ tag.Name }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧文章列表 -->
        <div class="lg:w-3/4">
      <!-- 搜索栏 -->
          <div class="glass-card search-panel rounded-xl p-6 mb-6">
            <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
        <input
          v-model="keyword"
          @keyup.enter="onSearch"
          type="text"
                class="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="搜索文章标题、内容..."
        />
        <button
          v-if="keyword"
          @click="clearSearch"
          class="px-3 py-2 text-gray-500 hover:text-gray-700 self-end sm:self-auto"
          title="清除"
        >
          ✕
        </button>
        <button
          @click="onSearch"
                class="px-6 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
        >
          搜索
        </button>
            </div>
      </div>

      <!-- 结果统计 -->
          <div v-if="!loading && posts.length > 0" class="mb-4">
            <div class="text-sm text-gray-600">
              共找到 {{ total }} 篇文章
            </div>
      </div>

          <!-- 文章列表 -->
          <div class="space-y-6">
            <article
          v-for="post in posts"
              :key="post.PostID"
              class="glass-card deck-card rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer"
              @click="goToArticle(post.PostID)"
            >
              <div class="p-6">
                <!-- 文章标题 -->
                <h2 class="text-xl font-bold text-gray-800 mb-3 hover:text-indigo-600 transition-colors">
                  {{ post.Title }}
                </h2>

                <!-- 文章摘要 -->
                <p class="text-gray-600 mb-4 line-clamp-3">
                  {{ post.Excerpt || '暂无摘要...' }}
                </p>

                <!-- 文章标签 -->
                <div v-if="post.Tags && post.Tags.length > 0" class="article-tags flex flex-wrap gap-2 mb-4">
                  <span
                    v-for="tag in post.Tags"
                    :key="tag.TagID"
                    class="px-3 py-1 bg-indigo-100 text-indigo-700 text-sm rounded-full hover:bg-indigo-200 transition-colors cursor-pointer"
                    @click.stop="filterByTag(tag)"
                  >
                    {{ tag.Name }}
                  </span>
                </div>

                <!-- 文章元信息 -->
                <div class="article-meta-row flex flex-col gap-3 text-sm text-gray-500 md:flex-row md:items-center md:justify-between">
                  <div class="meta-items flex flex-wrap items-center gap-3 sm:gap-4">
                    <span class="flex items-center">
                      <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                      </svg>
                      {{ formatDate(post.PublishedAt || post.CreatedAt) }}
                    </span>
                    <span class="flex items-center">
                      <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                      </svg>
                      {{ post.ViewCount || 0 }} 次阅读
                    </span>
                    <span v-if="post.User" class="flex items-center">
                      <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                      </svg>
                      {{ post.User.DisplayName || post.User.Username }}
                    </span>
                  </div>
                   <div v-if="post.Categories && post.Categories.length > 0" class="article-cats flex items-center flex-wrap gap-1">
                     <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
                     </svg>
                     <span
                       v-for="cat in post.Categories"
                       :key="cat.CategoryID"
                       class="px-2 py-0.5 bg-gray-100 rounded cursor-pointer hover:bg-gray-200"
                       @click.stop="toggleCategory(cat.CategoryID)"
                     >{{ cat.Name }}</span>
                   </div>
                </div>
              </div>
            </article>
          </div>

          <!-- 加载状态 -->
          <div v-if="loading" class="text-center py-8">
            <div class="inline-flex items-center px-4 py-2 text-gray-600">
              <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              加载中...
            </div>
          </div>

          <!-- 空状态（与列表保持一致的卡片宽度） -->
          <div v-if="!loading && posts.length === 0" class="glass-card empty-state-card rounded-xl p-12 w-full flex flex-col items-center justify-center text-center min-h-[220px]">
            <svg class="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            <h3 class="mt-3 text-sm font-medium text-gray-900">暂无文章</h3>
            <p class="mt-1 text-sm text-gray-500">没有符合筛选条件的文章，试试调整筛选或清除搜索关键词</p>
            <button @click="resetFilters" class="mt-4 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600">清除筛选</button>
          </div>

          <!-- 错误状态 -->
          <div v-if="error" class="text-center py-8">
            <div class="text-red-500">{{ error }}</div>
            <button @click="fetchArticles(false)" class="mt-2 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600">
              重试
            </button>
      </div>

          <!-- 分页 -->
          <div v-if="!loading && posts.length > 0" class="flex justify-center mt-8">
            <div class="flex items-center space-x-2">
        <button
                :disabled="page <= 1"
          @click="prevPage"
                class="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                上一页
              </button>
              <span class="px-4 py-2 text-gray-600">
                第 {{ page }} 页
              </span>
        <button
                :disabled="!hasMore"
          @click="nextPage"
                class="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                下一页
              </button>
            </div>
          </div>
      </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getArticles, getArticlesCount } from '@/api/articles'
import { getCategories } from '@/api/category'
import { getTags } from '@/api/tag'

const route = useRoute()
const router = useRouter()

// 数据状态
const posts = ref([])
const categories = ref([])
const categoryArticles = ref([])
const selectedCategoryIds = ref([])
const selectedTagIds = ref([])
const categoryMode = ref('any') // 'any' | 'all'
const tagMode = ref('any') // 'any' | 'all'
const totalArticles = ref(0)
const popularTags = ref([])
const showMobileFilters = ref(false)

// 分页状态
const page = ref(1)
const pageSize = 10
const total = ref(0)
const hasMore = ref(true)

// UI状态
const loading = ref(false)
const error = ref('')
const keyword = ref('')

let previousBodyOverflow = ''

function lockBodyScroll() {
  if (typeof document === 'undefined') return
  if (previousBodyOverflow === '') {
    previousBodyOverflow = document.body.style.overflow
  }
  document.body.style.overflow = 'hidden'
}

function unlockBodyScroll() {
  if (typeof document === 'undefined') return
  document.body.style.overflow = previousBodyOverflow
  previousBodyOverflow = ''
}

function closeMobileFilters() {
  showMobileFilters.value = false
}

function toggleMobileFilters() {
  showMobileFilters.value = !showMobileFilters.value
}

function handleViewportResize() {
  if (typeof window === 'undefined') return
  if (window.innerWidth >= 1024) {
    closeMobileFilters()
  }
}

// 工具函数
function parseApiPayload(res) {
  if (res?.data?.data) return res.data.data
  if (res?.data) return res.data
  return res
}

function parseListPayload(res) {
  const data = parseApiPayload(res)
  return {
    list: data?.list || [],
    total: Number(data?.total || 0)
  }
}

// 获取文章列表
async function fetchArticles(append = false) {
  if (loading.value) return
  loading.value = true
  error.value = ''

  try {
    const params = {
      page: page.value,
      pageSize,
      status: 'published',
      keyword: keyword.value?.trim() || undefined
    }
    // 多分类筛选（CSV）
    if (selectedCategoryIds.value.length > 0) {
      params.categories = selectedCategoryIds.value.join(',')
      params.categoryMode = categoryMode.value
    }
    // 多标签筛选（CSV）
    if (selectedTagIds.value.length > 0) {
      params.tags = selectedTagIds.value.join(',')
      params.tagMode = tagMode.value
    }

    // 列表按新文档投影与关联展开，进一步最小化字段
    params.fields = 'PostID,Title,Excerpt,PublishedAt,CreatedAt,ViewCount'
    params.include = 'categories,tags,user'
    params.sort = 'PublishedAt:desc,CreatedAt:desc'
    const res = await getArticles(params)
    const { list, total: t } = parseListPayload(res)

    total.value = t
    hasMore.value = list.length === pageSize
    posts.value = append ? [...posts.value, ...list] : list

  } catch (e) {
    console.error('获取文章失败', e)
    error.value = '获取文章失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

// 获取分类列表
async function loadCategories() {
  try {
    const res = await getCategories()
    const payload = parseApiPayload(res)
    let categoriesData = Array.isArray(payload) ? payload : (payload?.list || [])

    // 为每个分类获取文章数量
    const categoriesWithCount = await Promise.all(
      categoriesData.map(async (category) => {
        try {
          // 使用计数接口，避免无谓数据传输
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

    // 计算总文章数
    const totalRes = await getArticlesCount({ status: 'published' })
    const totalPayload = parseApiPayload(totalRes)
    totalArticles.value = (totalPayload?.total) || totalPayload?.data?.total || 0

    // 加载热门标签（前 N 个）
    try {
      const tagsRes = await getTags({ pageSize: 30 })
      const tagsPayload = parseApiPayload(tagsRes)
      popularTags.value = Array.isArray(tagsPayload) ? tagsPayload : (tagsPayload?.list || [])
    } catch (e) {
      popularTags.value = []
    }

  } catch (error) {
    console.error('获取分类失败:', error)
    categories.value = []
    popularTags.value = []
    totalArticles.value = 0
  }
}

// 获取分类下的文章列表
async function loadCategoryArticles(category) {
  if (!category) {
    categoryArticles.value = []
    return
  }

  try {
    const res = await getArticles({
      // 兼容新模式优先：CSV + any/all（此处为单分类，any/all均可）
      categories: String(category.CategoryID),
      categoryMode: 'any',
      status: 'published',
      pageSize: 10,
      page: 1,
      fields: 'PostID,Title,Excerpt,PublishedAt,CreatedAt,ViewCount',
      include: 'tags'
    })
    const { list } = parseListPayload(res)
    categoryArticles.value = list
  } catch (error) {
    console.error('获取分类文章失败:', error)
    categoryArticles.value = []
  }
}

// 重置筛选
function resetFilters() {
  selectedCategoryIds.value = []
  selectedTagIds.value = []
  categoryMode.value = 'any'
  tagMode.value = 'any'
  keyword.value = ''
  page.value = 1
  router.push({ query: {} })
}

// 切换分类/标签
function toggleCategory(categoryId) {
  const set = new Set(selectedCategoryIds.value)
  if (set.has(categoryId)) set.delete(categoryId); else set.add(categoryId)
  selectedCategoryIds.value = Array.from(set)
  page.value = 1
  updateQueryFromFilters()
}

function toggleTag(tagId) {
  const set = new Set(selectedTagIds.value)
  if (set.has(tagId)) set.delete(tagId); else set.add(tagId)
  selectedTagIds.value = Array.from(set)
  page.value = 1
  updateQueryFromFilters()
}

function onFilterChange() {
  page.value = 1
  updateQueryFromFilters()
}

function updateQueryFromFilters() {
  const query = {
    ...(keyword.value ? { keyword: keyword.value } : {}),
    ...(selectedCategoryIds.value.length ? { categories: selectedCategoryIds.value.join(',') } : {}),
    ...(selectedTagIds.value.length ? { tags: selectedTagIds.value.join(',') } : {}),
    ...(selectedCategoryIds.value.length ? { categoryMode: categoryMode.value } : {}),
    ...(selectedTagIds.value.length ? { tagMode: tagMode.value } : {}),
    page: 1
  }
  router.push({ query })
}

// 导航功能
function goToArticle(postId) {
  router.push(`/posts/${postId}`)
}

function filterByTag(tag) {
  toggleTag(tag.TagID)
}

// 搜索功能
function onSearch() {
  page.value = 1
  updateQueryFromFilters()
}

function clearSearch() {
  keyword.value = ''
  onSearch()
}

// 分页功能
function prevPage() {
  if (page.value <= 1) return
  page.value--
  fetchArticles(false)
}

function nextPage() {
  if (!hasMore.value) return
  page.value++
  fetchArticles(false)
}

// 格式化日期
function formatDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now - date
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) return '今天'
  if (days === 1) return '昨天'
  if (days < 30) return `${days}天前`

  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

// 监听路由变化（支持多分类/多标签解析）
watch(showMobileFilters, (open) => {
  if (typeof window === 'undefined') return

  if (window.innerWidth < 1024 && open) {
    lockBodyScroll()
    return
  }

  unlockBodyScroll()
})

watch(() => route.query, (query) => {
  const parseIds = (v) => {
    if (!v) return []
    if (Array.isArray(v)) return v.map((x) => Number(x)).filter(Boolean)
    return String(v).split(',').map((s) => Number(s)).filter(Boolean)
  }
  const rawKeyword = Array.isArray(query.keyword) ? query.keyword[0] : query.keyword

  keyword.value = rawKeyword ? String(rawKeyword) : ''
  selectedCategoryIds.value = parseIds(query.categories || query.category)
  selectedTagIds.value = parseIds(query.tags || query.tag)
  categoryMode.value = (query.categoryMode === 'all' ? 'all' : 'any')
  tagMode.value = (query.tagMode === 'all' ? 'all' : 'any')
  fetchArticles(false)
}, { immediate: true })

// ???
onMounted(async () => {
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', handleViewportResize)
  }

  await loadCategories()
  // ???????????????????????
  if (selectedCategoryIds.value.length === 1) {
    const category = categories.value.find(c => c.CategoryID === selectedCategoryIds.value[0])
    if (category) await loadCategoryArticles(category)
  }
})

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', handleViewportResize)
  }

  unlockBodyScroll()
})

</script>

<style scoped>
.post-list-page {
  position: relative;
  width: 100%;
  min-height: 100vh;
  color: var(--text);
  isolation: isolate;
}

.post-list-page::before,
.post-list-page::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.post-list-page::before {
  background:
    radial-gradient(circle at 18% 10%, rgba(120, 163, 255, 0.16), transparent 24%),
    radial-gradient(circle at 80% 12%, rgba(255, 123, 176, 0.12), transparent 18%),
    radial-gradient(circle at 48% 84%, rgba(103, 239, 216, 0.08), transparent 24%);
  opacity: 0.8;
}

.post-list-page::after {
  background-image:
    repeating-linear-gradient(180deg, rgba(255, 255, 255, 0.018) 0 1px, transparent 1px 8px),
    linear-gradient(118deg, transparent 0 44%, rgba(255, 255, 255, 0.025) 50%, transparent 56%);
  opacity: 0.14;
}

.list-shell {
  position: relative;
  z-index: 1;
}

.list-hero {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1.3fr) minmax(280px, 0.9fr);
  gap: 24px;
  overflow: hidden;
  animation: heroReveal 720ms ease;
}

.list-hero::before {
  content: "";
  position: absolute;
  inset: auto -18% -40% auto;
  width: 320px;
  height: 320px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(120, 163, 255, 0.18), transparent 72%);
}

.list-hero::after {
  content: "";
  position: absolute;
  inset: -28% auto -28% -18%;
  width: 30%;
  background: linear-gradient(120deg, transparent 0 18%, rgba(255, 255, 255, 0.06) 28%, rgba(120, 163, 255, 0.28) 48%, rgba(255, 123, 176, 0.18) 66%, transparent 100%);
  transform: translateX(-180%) skewX(-18deg);
  opacity: 0.5;
  mix-blend-mode: screen;
  animation: listSweep 9.4s ease-in-out infinite;
}

.hero-kicker {
  display: inline-flex;
  align-items: center;
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(120, 163, 255, 0.12);
  color: #bfd4ff;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.hero-copy h1 {
  margin: 16px 0 12px;
  font-size: clamp(30px, 4vw, 48px);
  line-height: 1.02;
  letter-spacing: -0.05em;
}

.hero-copy p {
  margin: 0;
  color: var(--muted);
  line-height: 1.8;
}

.hero-metrics {
  display: grid;
  gap: 12px;
  align-self: end;
}

.metric-card {
  position: relative;
  padding: 18px 20px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  overflow: hidden;
  transition: transform 220ms ease, box-shadow 220ms ease, border-color 220ms ease;
  animation: metricFloat 7.2s ease-in-out infinite;
}

.metric-card:nth-child(2) {
  animation-delay: -1.8s;
}

.metric-card:nth-child(3) {
  animation-delay: -3.6s;
}

.metric-card::after {
  content: "";
  position: absolute;
  inset: auto 0 0 0;
  height: 2px;
  background: linear-gradient(90deg, var(--accent), var(--accent-2), var(--accent-3));
  opacity: 0.78;
}

.metric-card strong {
  display: block;
  font-size: 28px;
  letter-spacing: -0.04em;
}

.metric-card span {
  display: block;
  margin-top: 6px;
  color: var(--muted);
}

.metric-card:hover {
  transform: translateY(-4px);
  border-color: rgba(120, 163, 255, 0.24);
  box-shadow:
    0 18px 44px rgba(0, 0, 0, 0.24),
    0 0 24px rgba(120, 163, 255, 0.08);
}

.glass-card {
  background: var(--panel);
  backdrop-filter: blur(18px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 18px 48px rgba(0, 0, 0, 0.22);
  color: var(--text);
}

.mobile-filter-backdrop,
.drawer-head {
  display: none;
}

.desktop-filter-title {
  display: block;
}

.drawer-kicker {
  display: inline-flex;
  align-items: center;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(120, 163, 255, 0.14);
  color: #bfd4ff;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.drawer-title {
  margin: 10px 0 0;
  font-size: 22px;
  font-weight: 800;
  color: var(--text);
}

.drawer-close {
  display: inline-grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.04);
  color: var(--text);
  font-size: 22px;
  line-height: 1;
}

.filter-panel,
.search-panel,
.empty-state-card {
  position: relative;
  overflow: hidden;
}

.filter-panel::before,
.search-panel::before,
.empty-state-card::before {
  content: "";
  position: absolute;
  inset: auto -14% -32% auto;
  width: 220px;
  height: 220px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(120, 163, 255, 0.16), transparent 72%);
  pointer-events: none;
}

.category-item {
  transition: transform 0.2s ease, background 0.2s ease, border-color 0.2s ease;
}

.category-item:hover {
  transform: translateY(-1px);
  border-color: rgba(255, 255, 255, 0.08);
}

.deck-card {
  position: relative;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.deck-card::before,
.deck-card::after {
  content: "";
  position: absolute;
  pointer-events: none;
}

.deck-card::before {
  inset: -30% auto -30% -20%;
  width: 34%;
  background: linear-gradient(120deg, transparent 0 18%, rgba(255, 255, 255, 0.06) 28%, rgba(120, 163, 255, 0.28) 48%, rgba(255, 123, 176, 0.18) 66%, transparent 100%);
  transform: translateX(-180%) skewX(-18deg);
  opacity: 0.52;
  mix-blend-mode: screen;
  animation: deckSweep 8.4s ease-in-out infinite;
}

.deck-card::after {
  top: 0;
  left: 20px;
  width: 140px;
  height: 1px;
  background: linear-gradient(90deg, rgba(120, 163, 255, 0.92), rgba(255, 123, 176, 0.7), transparent);
  box-shadow: 0 0 18px rgba(120, 163, 255, 0.18);
}

.deck-card:nth-child(2n)::before {
  animation-delay: -2.8s;
}

.deck-card:hover {
  transform: translateY(-8px) scale(1.01) !important;
  border-color: rgba(120, 163, 255, 0.28) !important;
  box-shadow:
    0 28px 72px rgba(0, 0, 0, 0.3) !important,
    0 0 34px rgba(120, 163, 255, 0.08) !important;
}

.deck-card:hover::after {
  width: 200px;
}

.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  line-clamp: 1;
  overflow: hidden;
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  line-clamp: 3;
  overflow: hidden;
}

@keyframes heroReveal {
  from {
    opacity: 0;
    transform: translateY(18px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes listSweep {
  0% {
    transform: translateX(-180%) skewX(-18deg);
  }
  46%, 100% {
    transform: translateX(340%) skewX(-18deg);
  }
}

@keyframes deckSweep {
  0% {
    transform: translateX(-180%) skewX(-18deg);
  }
  48%, 100% {
    transform: translateX(340%) skewX(-18deg);
  }
}

@keyframes metricFloat {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-4px);
  }
}

@media (max-width: 960px) {
  .list-hero {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 1023px) {
  .mobile-filter-backdrop {
    position: fixed;
    inset: 0;
    z-index: 70;
    display: block;
    border: 0;
    background: rgba(7, 10, 24, 0.74);
    backdrop-filter: blur(14px);
  }

  .drawer-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 16px;
  }

  .desktop-filter-title {
    display: none;
  }

  .list-sidebar {
    display: none;
  }

  .list-sidebar.open {
    display: block;
    position: fixed;
    inset: 0 0 0 auto;
    z-index: 80;
    width: min(86vw, 380px);
    padding: 12px 12px 12px 0;
  }

  .list-sidebar.open .filter-panel {
    position: relative;
    top: 0;
    height: calc(100vh - 24px);
    max-height: none;
    overflow-y: auto;
    overflow-x: hidden;
    -webkit-overflow-scrolling: touch;
    overscroll-behavior: contain;
    touch-action: pan-y;
    border-radius: 28px 0 0 28px;
  }
}

@media (max-width: 768px) {
  .list-shell {
    padding-inline: 12px;
    padding-block: 20px;
  }

  .list-hero {
    gap: 14px;
    padding: 18px;
    margin-bottom: 16px;
  }

  .hero-metrics {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
  }

  .metric-card {
    padding: 12px 14px;
    border-radius: 18px;
  }

  .metric-card strong {
    font-size: 24px;
  }

  .search-panel {
    padding: 16px;
    margin-bottom: 14px;
  }

  .filter-panel {
    padding: 16px;
  }

  .deck-card > .p-6 {
    padding: 16px;
  }

  .deck-card h2 {
    margin-bottom: 10px;
    font-size: 18px;
    line-height: 1.45;
  }

  .deck-card p {
    margin-bottom: 12px;
    font-size: 14px;
    line-height: 1.65;
  }

  .space-y-6 {
    gap: 12px;
  }

  .filter-toggle {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    width: 100%;
    margin-bottom: 16px;
    padding: 12px 14px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 18px;
    background: var(--panel);
    color: var(--text);
    font-weight: 700;
    box-shadow: 0 18px 48px rgba(0, 0, 0, 0.22);
  }

  .filter-toggle strong {
    display: inline-grid;
    place-items: center;
    min-width: 28px;
    min-height: 28px;
    padding: 0 8px;
    border-radius: 999px;
    background: rgba(120, 163, 255, 0.16);
    color: var(--accent);
  }

  .meta-items {
    width: 100%;
  }
}

@media (max-width: 640px) {
  .list-shell {
    padding-inline: 8px;
    padding-block: 12px;
  }

  .list-hero,
  .filter-panel,
  .search-panel,
  .empty-state-card {
    border-radius: 22px;
  }

  .list-hero {
    gap: 10px;
    padding: 12px;
    margin-bottom: 10px;
  }

  .hero-kicker {
    font-size: 10px;
    letter-spacing: 0.12em;
  }

  .hero-copy h1 {
    font-size: clamp(21px, 7vw, 25px);
    line-height: 1.2;
  }

  .hero-copy p {
    font-size: 12px;
    line-height: 1.55;
  }

  .metric-card {
    min-height: 64px;
    padding: 8px 9px;
    border-radius: 14px;
  }

  .article-meta-row {
    align-items: flex-start;
  }

  .hero-metrics {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 6px;
  }

  .metric-card strong {
    font-size: 17px;
  }

  .metric-card span {
    margin-top: 3px;
    font-size: 10px;
  }

  .filter-toggle {
    margin-bottom: 10px;
    padding: 9px 10px;
    border-radius: 14px;
    font-size: 13px;
  }

  .search-panel {
    padding: 10px;
    margin-bottom: 10px;
  }

  .search-panel .flex {
    gap: 8px;
  }

  .list-sidebar.open {
    width: min(100vw, 360px);
    padding: 8px 8px 8px 0;
    margin-bottom: 0;
    overflow: visible;
  }

  .list-sidebar.open .filter-panel {
    padding: 12px;
    height: calc(100vh - 16px);
    border-radius: 24px 0 0 24px;
  }

  .drawer-head {
    margin-bottom: 12px;
  }

  .drawer-kicker {
    padding: 5px 8px;
    font-size: 10px;
  }

  .drawer-title {
    margin-top: 8px;
    font-size: 18px;
  }

  .drawer-close {
    width: 36px;
    height: 36px;
    font-size: 20px;
  }

  .filter-panel h2 {
    margin-bottom: 10px;
    font-size: 16px;
  }

  .filter-panel .space-y-2.mt-6 {
    margin-top: 10px;
  }

  .filter-panel .category-item,
  .filter-panel .flex.flex-wrap.gap-2 {
    touch-action: pan-y;
  }

  .space-y-6 {
    gap: 10px;
  }

  .deck-card > .p-6 {
    padding: 12px;
  }

  .deck-card h2 {
    display: -webkit-box;
    margin-bottom: 8px;
    font-size: 15px;
    line-height: 1.4;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .deck-card p {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    margin-bottom: 8px;
    font-size: 12px;
    line-height: 1.55;
  }

  .article-tags {
    gap: 6px;
    margin-bottom: 8px;
  }

  .article-tags > span {
    padding: 0.22rem 0.48rem;
    font-size: 11px;
  }

  .article-tags > span:nth-child(n + 4),
  .article-cats > span:nth-child(n + 3) {
    display: none;
  }

  .article-meta-row,
  .meta-items {
    gap: 8px;
    font-size: 11px;
  }

  .article-cats {
    gap: 4px;
    font-size: 11px;
  }

  .deck-card .px-3.py-1,
  .article-cats span {
    padding: 0.22rem 0.45rem;
    font-size: 11px;
  }
}

@media (max-width: 390px) {
  .list-shell {
    padding-inline: 8px;
    padding-block: 16px;
  }

  .list-hero,
  .filter-panel,
  .search-panel,
  .empty-state-card,
  .deck-card {
    border-radius: 18px;
  }

  .list-hero,
  .filter-panel,
  .search-panel {
    padding: 10px;
  }

  .hero-copy h1 {
    font-size: 20px;
  }

  .metric-card {
    min-height: 60px;
    padding: 8px;
    border-radius: 14px;
  }

  .metric-card strong {
    font-size: 16px;
  }

  .metric-card span {
    font-size: 10px;
  }

  .deck-card > .p-6 {
    padding: 10px;
  }

  .deck-card h2 {
    font-size: 14px;
  }
}
</style>
