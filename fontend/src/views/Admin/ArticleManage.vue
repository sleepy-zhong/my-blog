<template>
  <div class="w-full min-h-screen p-0 m-0">
    <!-- 头部 -->
    <div class="w-full flex items-center bg-white border-b px-6 py-4">
      <h2 class="text-2xl font-bold text-blue-700 flex-1">文章管理</h2>
      <div class="flex gap-2">
        <button class="btn-primary" @click="onAdd">
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
          </svg>
          新建文章
        </button>
      </div>
    </div>

    <!-- 搜索和筛选 -->
    <Card class="mx-6 mt-4">
      <template #header>
        <div class="flex gap-2 items-center">
          <div class="text-base font-semibold text-gray-800">筛选</div>
        </div>
      </template>
      <div class="flex gap-4 items-center mb-2 flex-wrap">
        <div class="flex-1">
          <input 
            v-model="keyword" 
            @input="onSearch"
            placeholder="搜索文章标题..." 
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select v-model="statusFilter" @change="onSearch" class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">全部状态</option>
          <option value="draft">草稿</option>
          <option value="published">已发布</option>
          <option value="archived">已归档</option>
        </select>
        <select multiple v-model="selectedCategoryIds" @change="onSearch" class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[12rem]">
          <option disabled value="">选择分类（可多选）</option>
          <option v-for="c in categoryOptions" :key="c.CategoryID" :value="c.CategoryID">{{ c.Name }}</option>
        </select>
        <select v-model="categoryMode" @change="onSearch" class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="any">分类匹配：任一</option>
          <option value="all">分类匹配：全部</option>
        </select>
        <select multiple v-model="selectedTagIds" @change="onSearch" class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[12rem]">
          <option disabled value="">选择标签（可多选）</option>
          <option v-for="t in tagOptions" :key="t.TagID" :value="t.TagID">{{ t.Name }}</option>
        </select>
        <select v-model="tagMode" @change="onSearch" class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="any">标签匹配：任一</option>
          <option value="all">标签匹配：全部</option>
        </select>
        <select v-model="pageSize" @change="onPageSizeChange" class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option :value="10">10/页</option>
          <option :value="20">20/页</option>
          <option :value="50">50/页</option>
          <option :value="100">100/页</option>
        </select>
        <button @click="fetchArticles" class="btn-secondary">
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
          </svg>
          刷新
        </button>
      </div>
    </Card>

    <!-- 文章列表 -->
    <Card class="mx-6 mt-4">
      <template #header>
        <div class="flex items-center justify-between">
          <div class="text-base font-semibold text-gray-800">文章列表</div>
        </div>
      </template>
      <LoadingState v-if="loading" />

      <table v-else class="w-full text-center border-separate border-spacing-0">
        <thead class="bg-blue-50">
          <tr>
            <th class="py-3 px-2 font-bold text-gray-700">ID</th>
            <th class="py-3 px-2 font-bold text-gray-700">标题</th>
            <th class="py-3 px-2 font-bold text-gray-700">作者</th>
            <th class="py-3 px-2 font-bold text-gray-700">状态</th>
            <th class="py-3 px-2 font-bold text-gray-700">分类</th>
            <th class="py-3 px-2 font-bold text-gray-700">标签</th>
            <th class="py-3 px-2 font-bold text-gray-700">浏览量</th>
            <th class="py-3 px-2 font-bold text-gray-700">创建时间</th>
            <th class="py-3 px-2 font-bold text-gray-700">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="article in articles" :key="article.ArticleID || article.PostID" class="hover:bg-blue-50 even:bg-blue-50/40 transition">
            <td class="py-2 px-2">{{ article.ArticleID || article.PostID }}</td>
            <td class="py-2 px-2 text-left max-w-xs truncate" :title="article.Title">{{ article.Title }}</td>
            <td class="py-2 px-2">{{ getAuthorName(article) }}</td>
            <td class="py-2 px-2">
              <span :class="getStatusClass(article.Status)">{{ getStatusText(article.Status) }}</span>
            </td>
            <td class="py-2 px-2">
              <div class="flex flex-wrap gap-1 justify-center">
                <span v-for="category in article.Categories" :key="category.CategoryID" 
                      class="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                  {{ category.Name }}
                </span>
                <span v-if="!article.Categories?.length" class="text-gray-400 text-xs">-</span>
              </div>
            </td>
            <td class="py-2 px-2">
              <div class="flex flex-wrap gap-1 justify-center">
                <span v-for="tag in article.Tags" :key="tag.TagID" 
                      class="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                  {{ tag.Name }}
                </span>
                <span v-if="!article.Tags?.length" class="text-gray-400 text-xs">-</span>
              </div>
            </td>
            <td class="py-2 px-2">{{ article.ViewCount || 0 }}</td>
            <td class="py-2 px-2 text-sm">{{ formatTime(article.CreatedAt) }}</td>
            <td class="py-2 px-2 whitespace-nowrap">
              <button @click="onEditInfo(article)" class="btn mr-2">
                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                </svg>
                编辑信息
              </button>
              <button @click="onEditContent(article)" class="btn-secondary mr-2">
                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                编辑内容
              </button>
              <button @click="onDelete(article)" class="btn-danger">
                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
                {{ t('delete') }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      
      <!-- 空状态 -->
      <template #footer>
        <div v-if="!loading && articles.length === 0">
          <EmptyState :message="t('articleNoData')">
            <template #action>
              <button @click="onAdd" class="btn-primary">
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
                新建文章
              </button>
            </template>
          </EmptyState>
        </div>
      </template>
    </Card>

    <!-- 分页 -->
    <div v-if="totalPages > 1" class="w-full bg-white rounded-xl shadow p-6 border mt-6">
      <Pagination 
        :page="page" 
        :totalPages="totalPages" 
        @update:page="onPageChange" 
      />
    </div>

    <!-- 编辑文章信息弹窗 -->
    <div v-if="showEditInfoModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div class="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative">
        <button @click="showEditInfoModal = false" class="absolute top-4 right-6 text-gray-400 hover:text-blue-500 text-2xl z-10">×</button>
        
        <div class="p-8">
          <div class="flex items-center mb-8">
            <div class="text-3xl font-bold text-gray-800 flex-1">编辑文章信息</div>
            <div class="flex gap-2">
              <button @click="showEditInfoModal = false" class="btn-secondary">取消</button>
              <button @click="onSaveInfo" class="btn-primary" :disabled="saving">
                {{ saving ? '保存中...' : '保存' }}
              </button>
            </div>
          </div>

          <div class="space-y-6">
            <div>
              <label class="block mb-2 text-lg font-semibold">文章标题 <span class="text-red-500">*</span></label>
              <input v-model="editForm.title" class="input text-xl font-bold" placeholder="请输入文章标题" />
            </div>
            
            <div>
              <label class="block mb-2 text-lg font-semibold">文章摘要</label>
              <textarea v-model="editForm.excerpt" class="input" rows="3" placeholder="请输入文章摘要"></textarea>
            </div>

            <div>
              <label class="block mb-2 text-lg font-semibold">文章状态</label>
              <select v-model="editForm.status" class="input">
                <option value="draft">草稿</option>
                <option value="published">已发布</option>
                <option value="archived">已归档</option>
              </select>
            </div>

            <div>
              <label class="block mb-2 text-lg font-semibold">分类</label>
              <select v-model="editForm.categoryIds" multiple class="input">
                <option v-for="category in categoryOptions" :key="category.CategoryID" :value="category.CategoryID">
                  {{ category.Name }}
                </option>
              </select>
            </div>

            <div>
              <label class="block mb-2 text-lg font-semibold">标签</label>
              <select v-model="editForm.tagIds" multiple class="input">
                <option v-for="tag in tagOptions" :key="tag.TagID" :value="tag.TagID">
                  {{ tag.Name }}
                </option>
              </select>
            </div>

            <div>
              <label class="block mb-2 text-lg font-semibold">可见范围</label>
              <select v-model="editForm.visibility" class="input">
                <option value="public">全部可见</option>
                <option value="private">仅我可见</option>
                <option value="fans">粉丝可见</option>
                <option value="vip">VIP可见</option>
              </select>
            </div>
          </div>

          <div v-if="error" class="text-red-500 mt-4">{{ error }}</div>
          <div v-if="success" class="text-green-600 mt-4">{{ success }}</div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { getArticles, getArticle, createArticle, updateArticle, deleteArticle, importArticle, getArticlesCount } from '@/api/article'
import { getTags } from '@/api/tag'
import { getCategories } from '@/api/category'
import { useMessageStore } from '@/store/user'
import Pagination from '@/components/Pagination.vue'
import Card from '@/components/Card.vue'
import LoadingState from '@/components/LoadingState.vue'
import EmptyState from '@/components/EmptyState.vue'

const router = useRouter()
const { t } = useI18n()
const messageStore = useMessageStore()

const articles = ref([])
const page = ref(1)
const pageSize = ref(10)
const totalPages = ref(1)
const keyword = ref('')
const statusFilter = ref('')
const selectedCategoryIds = ref([])
const selectedTagIds = ref([])
const categoryMode = ref('any')
const tagMode = ref('any')
const loading = ref(false)

// 编辑文章信息相关状态
const showEditInfoModal = ref(false)
const editForm = ref({
  title: '',
  excerpt: '',
  status: 'draft',
  categoryIds: [],
  tagIds: [],
  visibility: 'public'
})
const selectedArticle = ref(null)
const saving = ref(false)
const error = ref('')
const success = ref('')

// 分类和标签选项
const categoryOptions = ref([])
const tagOptions = ref([])

async function fetchArticles() {
  loading.value = true
  try {
    // 基础筛选参数（不含状态）
    const baseParams = {
      keyword: keyword.value || undefined
    }
    if (selectedCategoryIds.value.length > 0) {
      baseParams.categories = selectedCategoryIds.value.join(',')
      baseParams.categoryMode = categoryMode.value
    }
    if (selectedTagIds.value.length > 0) {
      baseParams.tags = selectedTagIds.value.join(',')
      baseParams.tagMode = tagMode.value
    }
    // 字段投影与关联展开、排序
    const projection = {
      fields: 'PostID,Title,Excerpt,Status,PublishedAt,CreatedAt,ViewCount',
      include: 'categories,tags,user',
      sort: 'PublishedAt:desc,CreatedAt:desc'
    }

    if (statusFilter.value) {
      // 单一状态：直接走后端分页
      const params = {
        page: page.value,
        pageSize: pageSize.value,
        status: statusFilter.value,
        ...baseParams,
        ...projection
      }
      const res = await getArticles(params)
      console.log('[fetchArticles] 原始返回:', res)
      if (res.code === 0) {
        const list = res.data?.list || res.data?.data?.list || res.list || []
        const total = res.data?.total || res.data?.data?.total || res.total || 0
        articles.value = Array.isArray(list) ? list : []
        totalPages.value = Math.max(1, Math.ceil(total / pageSize.value))
      } else {
        messageStore.show(t('articleGetFail'), 'error')
      }
    } else {
      // 全部状态：并行拉取三种状态的列表与总数，前端合并分页
      const statuses = ['draft', 'published', 'archived']
      const endIndex = page.value * pageSize.value

      // 列表与总数请求（并行）
      const listPromises = statuses.map(s => getArticles({
        page: 1,
        pageSize: endIndex,
        status: s,
        ...baseParams,
        ...projection
      }))
      const countPromises = statuses.map(s => getArticlesCount({
        status: s,
        ...baseParams
      }))

      const [listResults, countResults] = await Promise.all([
        Promise.all(listPromises),
        Promise.all(countPromises)
      ])

      // 解析总数
      const total = countResults.reduce((sum, res) => {
        if (!res) return sum
        const raw = (res.data?.total ?? res.total ?? res.data ?? 0)
        const n = typeof raw === 'number' ? raw : Number(raw) || 0
        return sum + n
      }, 0)

      // 合并列表并排序
      const combined = listResults.flatMap(res => (res?.data?.list || res?.data?.data?.list || res?.list || []))
        .sort((a, b) => {
          const aPub = a.PublishedAt ? new Date(a.PublishedAt).getTime() : 0
          const bPub = b.PublishedAt ? new Date(b.PublishedAt).getTime() : 0
          if (aPub !== bPub) return bPub - aPub
          const aC = a.CreatedAt ? new Date(a.CreatedAt).getTime() : 0
          const bC = b.CreatedAt ? new Date(b.CreatedAt).getTime() : 0
          return bC - aC
        })

      const startIndex = (page.value - 1) * pageSize.value
      articles.value = combined.slice(startIndex, endIndex)
      totalPages.value = Math.max(1, Math.ceil(total / pageSize.value))
    }
  } catch (err) {
    console.error('获取文章失败:', err)
    messageStore.show(t('articleGetFail'), 'error')
  } finally {
    loading.value = false
  }
}

// 获取分类和标签选项
async function fetchOptions() {
  try {
    const [tagsRes, categoriesRes] = await Promise.all([
      getTags(),
      getCategories()
    ])
    tagOptions.value = tagsRes.data || tagsRes || []
    categoryOptions.value = categoriesRes.data || categoriesRes || []
  } catch (error) {
    console.error('获取分类或标签失败:', error)
  }
}

function onAdd() {
  // 跳转到文章发布页面
  router.push('/publish')
}

// 编辑文章信息
async function onEditInfo(article) {
  try {
    // 获取文章详情
    const articleId = article.ArticleID || article.PostID
    const res = await getArticle(articleId)
    
    if (res.code === 0) {
      const articleData = res.data || res
      console.log('[onEditInfo] 文章详情:', articleData)
      
      selectedArticle.value = article
      
      // 填充编辑表单
      editForm.value = {
        title: articleData.Title || '',
        excerpt: articleData.Excerpt || '',
        status: articleData.Status || 'draft',
        categoryIds: articleData.Categories ? articleData.Categories.map(cat => cat.CategoryID) : [],
        tagIds: articleData.Tags ? articleData.Tags.map(tag => tag.TagID) : [],
        visibility: articleData.Visibility || 'public'
      }
      
      showEditInfoModal.value = true
      error.value = ''
      success.value = ''
    } else {
      messageStore.show(t('articleGetDetailFail'), 'error')
    }
  } catch (err) {
    console.error('获取文章详情失败:', err)
    messageStore.show(t('articleGetDetailFail'), 'error')
  }
}

// 编辑文章内容
async function onEditContent(article) {
  try {
    // 获取文章详情
    const articleId = article.ArticleID || article.PostID
    const res = await getArticle(articleId)
    
    if (res.code === 0) {
      const articleData = res.data || res
      console.log('[onEditContent] 文章详情:', articleData)
      
      // 将文章数据存储到localStorage，供发布页面使用
      localStorage.setItem('editArticleData', JSON.stringify(articleData))
      
      // 跳转到文章发布页面
      router.push('/publish')
    } else {
      messageStore.show(t('articleGetDetailFail'), 'error')
    }
  } catch (err) {
    console.error('获取文章详情失败:', err)
    messageStore.show(t('articleGetDetailFail'), 'error')
  }
}

// 保存文章信息
async function onSaveInfo() {
  if (!editForm.value.title.trim()) {
    error.value = '文章标题不能为空'
    return
  }
  
  saving.value = true
  error.value = ''
  success.value = ''
  
  try {
    const articleId = selectedArticle.value.ArticleID || selectedArticle.value.PostID
    const payload = {
      title: editForm.value.title.trim(),
      excerpt: editForm.value.excerpt.trim(),
      status: editForm.value.status,
      categoryIds: editForm.value.categoryIds,
      tagIds: editForm.value.tagIds,
      visibility: editForm.value.visibility
    }
    
    const res = await updateArticle(articleId, payload)
    
    if (res.code === 0) {
      messageStore.show(t('articleUpdateSuccess'), 'success')
      success.value = '文章信息更新成功！'
      showEditInfoModal.value = false
      fetchArticles() // 刷新列表
    } else {
      error.value = res.message || '更新失败'
      messageStore.show(res.message || t('articleUpdateFail'), 'error')
    }
  } catch (err) {
    console.error('更新文章信息失败:', err)
    error.value = '更新失败，请重试'
    messageStore.show(t('articleUpdateFail'), 'error')
  } finally {
    saving.value = false
  }
}

async function onDelete(article) {
  const articleId = article.ArticleID || article.PostID
  const title = article.Title || '未知文章'
  
  if (!confirm(t('articleDeleteConfirm', { title }))) {
    return
  }
  
  try {
    const res = await deleteArticle(articleId)
    if (res.code === 0) {
      messageStore.show(t('articleDeleteSuccess'), 'success')
      fetchArticles()
    } else {
      messageStore.show(res.message || t('articleDeleteFail'), 'error')
    }
  } catch (err) {
    console.error('删除文章失败:', err)
    messageStore.show(t('articleDeleteFail'), 'error')
  }
}

function onSearch() {
  page.value = 1 // 搜索时重置到第一页
  fetchArticles()
}

function onPageChange(newPage) {
  page.value = newPage
  fetchArticles()
}

function onPageSizeChange() {
  page.value = 1
  fetchArticles()
}

// 工具函数
function formatTime(timestamp) {
  if (!timestamp) return '-'
  return new Date(timestamp).toLocaleString('zh-CN')
}

function getStatusText(status) {
  const statusMap = {
    'draft': '草稿',
    'published': '已发布',
    'archived': '已归档'
  }
  return statusMap[status] || status
}

function getStatusClass(status) {
  const classMap = {
    'draft': 'bg-gray-100 text-gray-800',
    'published': 'bg-green-100 text-green-800',
    'archived': 'bg-yellow-100 text-yellow-800'
  }
  return `px-2 py-1 rounded-full text-xs font-medium ${classMap[status] || 'bg-gray-100 text-gray-800'}`
}

function getAuthorName(article) {
  // 兼容不同的作者字段结构
  if (article.Author) {
    return article.Author.DisplayName || article.Author.Username || article.AuthorID
  }
  if (article.User) {
    return article.User.DisplayName || article.User.Username || article.UserID
  }
  return article.AuthorID || article.UserID || '-'
}

onMounted(() => {
  fetchArticles()
  fetchOptions()
})
</script>
<style scoped>
.btn-primary { background-color: #3b82f6; color: #fff; border-radius: 0.5rem; padding: 0.5rem 1rem; font-weight: 700; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
.btn-primary:hover { background-color: #2563eb; }
.btn-secondary { background-color: #e5e7eb; color: #1f2937; border-radius: 0.5rem; padding: 0.5rem 1rem; font-weight: 700; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
.btn-secondary:hover { background-color: #d1d5db; }
.btn { background-color: #3b82f6; color: #fff; border-radius: 0.375rem; padding: 0.25rem 0.75rem; font-weight: 700; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
.btn:hover { background-color: #2563eb; }
.btn-danger { background-color: #ef4444; color: #fff; border-radius: 0.375rem; padding: 0.25rem 0.75rem; font-weight: 700; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
.btn-danger:hover { background-color: #dc2626; }
.input { width: 100%; padding: 0.5rem 1rem; border: 1px solid #d1d5db; border-radius: 0.5rem; outline: none; }
.input:focus { box-shadow: 0 0 0 2px rgba(59,130,246,0.5); border-color: #3b82f6; }
th, td {
  text-align: center;
}
</style> 