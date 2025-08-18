<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
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

    <div class="w-full px-4 py-8">
      <div class="flex flex-col lg:flex-row gap-8">
        <!-- 左侧分类/标签筛选 -->
        <div class="lg:w-1/4">
          <div class="glass-card rounded-xl p-6 sticky top-4">
            <h2 class="text-xl font-bold text-gray-800 mb-6">筛选</h2>
            
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
          <div class="glass-card rounded-xl p-6 mb-6">
            <div class="flex items-center gap-4">
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
          class="px-3 py-2 text-gray-500 hover:text-gray-700"
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
              class="glass-card rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer"
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
                <div v-if="post.Tags && post.Tags.length > 0" class="flex flex-wrap gap-2 mb-4">
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
                <div class="flex items-center justify-between text-sm text-gray-500">
                  <div class="flex items-center space-x-4">
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
                   <div v-if="post.Categories && post.Categories.length > 0" class="flex items-center flex-wrap gap-1">
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
          <div v-if="!loading && posts.length === 0" class="glass-card rounded-xl p-12 w-full flex flex-col items-center justify-center text-center min-h-[220px]">
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
import { ref, onMounted, watch } from 'vue'
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

// 分页状态
const page = ref(1)
const pageSize = 10
const total = ref(0)
const hasMore = ref(true)

// UI状态
const loading = ref(false)
const error = ref('')
const keyword = ref('')

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
    // 使用模拟数据
    categories.value = [
      { CategoryID: 1, Name: 'springboot', PostCount: 12 },
      { CategoryID: 2, Name: '前端', PostCount: 8 },
      { CategoryID: 3, Name: '后端', PostCount: 5 },
      { CategoryID: 4, Name: '数据库', PostCount: 3 },
      { CategoryID: 5, Name: '测试', PostCount: 15 },
      { CategoryID: 6, Name: 'React', PostCount: 7 }
    ]
    totalArticles.value = 50
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
watch(() => route.query, (query) => {
  const parseIds = (v) => {
    if (!v) return []
    if (Array.isArray(v)) return v.map((x) => Number(x)).filter(Boolean)
    return String(v).split(',').map((s) => Number(s)).filter(Boolean)
  }
  selectedCategoryIds.value = parseIds(query.categories || query.category)
  selectedTagIds.value = parseIds(query.tags || query.tag)
  categoryMode.value = (query.categoryMode === 'all' ? 'all' : 'any')
  tagMode.value = (query.tagMode === 'all' ? 'all' : 'any')
  fetchArticles(false)
}, { immediate: true })

// 初始化
onMounted(async () => {
  await loadCategories()
  // 如果只选择了一个分类则加载该分类下文章用于展示
  if (selectedCategoryIds.value.length === 1) {
    const category = categories.value.find(c => c.CategoryID === selectedCategoryIds.value[0])
    if (category) await loadCategoryArticles(category)
  }
})
</script>

<style scoped>
.glass-card {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.1);
}

.category-item {
  transition: all 0.2s ease;
}

.category-item:hover {
  transform: translateY(-1px);
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
</style> 