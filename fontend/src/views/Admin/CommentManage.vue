<template>
  <Card class="comment-manage">
    <template #header>
      <div class="flex items-center gap-2 w-full">
        <h2 class="text-lg font-semibold text-gray-800 flex-1">评论管理</h2>
      </div>
    </template>

    <Card class="mt-4">
      <template #header>
        <div class="text-base font-semibold text-gray-800">筛选</div>
      </template>
      <div class="comment-filter-row flex flex-wrap gap-4 items-center">
        <AppSelect
          v-model="articleId"
          class="input comment-filter-field w-56"
          :options="articleOptions"
          placeholder="全部文章"
          searchable
          @change="fetchComments"
        />
        <input
          v-model="keyword"
          placeholder="搜索内容"
          class="input comment-filter-field flex-1 max-w-md"
          @input="fetchComments"
        />
        <AppSelect
          v-model="status"
          class="input comment-filter-field w-36"
          :options="statusOptions"
          placeholder="全部状态"
          @change="fetchComments"
        />
      </div>
    </Card>

    <Card class="mt-4">
      <template #header>
        <div class="text-base font-semibold text-gray-800">评论列表</div>
      </template>
      <LoadingState v-if="loading" />
      <template v-else>
        <div class="comment-table-wrap overflow-x-auto">
          <table class="comment-desktop-table w-full text-center border-separate border-spacing-0">
            <thead class="bg-blue-50">
              <tr>
                <th class="py-3 px-2 font-bold text-gray-700">ID</th>
                <th class="py-3 px-2 font-bold text-gray-700">内容</th>
                <th class="py-3 px-2 font-bold text-gray-700">用户</th>
                <th class="py-3 px-2 font-bold text-gray-700">所属文章</th>
                <th class="py-3 px-2 font-bold text-gray-700">状态</th>
                <th class="py-3 px-2 font-bold text-gray-700">回复</th>
                <th class="py-3 px-2 font-bold text-gray-700">时间</th>
                <th class="py-3 px-2 font-bold text-gray-700">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="c in comments" :key="c.CommentID" class="hover:bg-blue-50 even:bg-blue-50/40 transition">
                <td class="py-2 px-2">{{ c.CommentID }}</td>
                <td class="py-2 px-2 text-left max-w-xs truncate" :title="c.Content">{{ c.Content }}</td>
                <td class="py-2 px-2">
                  <div class="comment-user flex items-center justify-center gap-2">
                    <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      {{ (c.User?.DisplayName || c.User?.Username || 'U').charAt(0).toUpperCase() }}
                    </div>
                    <span>{{ c.User?.DisplayName || c.User?.Username }}</span>
                  </div>
                </td>
                <td class="py-2 px-2 text-left max-w-xs truncate" :title="c.Article?.Title">{{ c.Article?.Title }}</td>
                <td class="py-2 px-2">
                  <span :class="getStatusClass(c.Status)">{{ getStatusText(c.Status) }}</span>
                </td>
                <td class="py-2 px-2">
                  <span v-if="c.ParentCommentID" class="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs">
                    回复
                  </span>
                  <span v-else class="text-gray-400 text-xs">-</span>
                </td>
                <td class="py-2 px-2 text-sm">{{ formatTime(c.CreatedAt) }}</td>
                <td class="py-2 px-2 whitespace-nowrap">
                  <div class="comment-action-row">
                    <template v-if="c.Status === 'pending'">
                      <button @click="approve(c)" class="btn">通过</button>
                      <button @click="reject(c)" class="btn-danger">拒绝</button>
                    </template>
                    <button @click="remove(c)" class="btn-danger">删除</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="comment-mobile-list mobile-card-list">
          <article v-for="c in comments" :key="`mobile-${c.CommentID}`" class="mobile-card">
            <div class="mobile-card-head">
              <strong>#{{ c.CommentID }}</strong>
              <span :class="getStatusClass(c.Status)">{{ getStatusText(c.Status) }}</span>
            </div>
            <p class="mobile-copy">{{ c.Content }}</p>
            <div class="mobile-info-grid">
              <div class="mobile-info-item">
                <span>用户</span>
                <strong>{{ c.User?.DisplayName || c.User?.Username || '-' }}</strong>
              </div>
              <div class="mobile-info-item">
                <span>所属文章</span>
                <strong>{{ c.Article?.Title || '-' }}</strong>
              </div>
              <div class="mobile-info-item">
                <span>类型</span>
                <strong>{{ c.ParentCommentID ? '回复' : '主评论' }}</strong>
              </div>
              <div class="mobile-info-item">
                <span>时间</span>
                <strong>{{ formatTime(c.CreatedAt) }}</strong>
              </div>
            </div>
            <div class="comment-action-row mobile-action-row">
              <template v-if="c.Status === 'pending'">
                <button @click="approve(c)" class="btn">通过</button>
                <button @click="reject(c)" class="btn-danger">拒绝</button>
              </template>
              <button @click="remove(c)" class="btn-danger">删除</button>
            </div>
          </article>
        </div>
        <template v-if="!comments.length">
          <EmptyState message="暂无评论" />
        </template>
      </template>
      <template #footer>
        <div class="comment-footer flex justify-end items-center gap-2 mt-2">
          <Pagination :page="page" :totalPages="totalPages" @update:page="onPageChange" />
          <AppSelect
            v-model="pageSize"
            class="input comment-page-size w-24 ml-2"
            :options="pageSizeOptions"
            @change="fetchComments"
          />
        </div>
      </template>
    </Card>
  </Card>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import AppSelect from '@/components/AppSelect.vue'
import Card from '@/components/Card.vue'
import LoadingState from '@/components/LoadingState.vue'
import EmptyState from '@/components/EmptyState.vue'
import Pagination from '@/components/Pagination.vue'
import { getComments, updateCommentStatus, deleteComment } from '@/api/comment'
import { getArticles } from '@/api/articles'
const comments = ref([])
const articles = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const articleId = ref('')
const keyword = ref('')
const status = ref('')
const loading = ref(false)
const statusOptions = [
  { label: '全部状态', value: '' },
  { label: '待审核', value: 'pending' },
  { label: '已通过', value: 'approved' },
  { label: '已拒绝', value: 'spam' }
]
const pageSizeOptions = [10, 20, 50, 100].map((value) => ({
  label: `${value}/页`,
  value
}))
const articleOptions = computed(() => [
  { label: '全部文章', value: '' },
  ...articles.value.map((article) => ({
    label: article.Title,
    value: article.PostID
  }))
])

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))

function fetchArticles() {
  getArticles({ page: 1, pageSize: 1000 }).then(res => {
    if (res.code === 0) {
      articles.value = res.data?.list || []
    }
  })
}
function fetchComments() {
  loading.value = true
  console.log('[CommentManage.vue] 开始获取评论，参数:', {
    page: page.value,
    pageSize: pageSize.value,
    articleId: articleId.value,
    keyword: keyword.value,
    status: status.value
  })
  
  const params = {
    page: page.value,
    pageSize: pageSize.value
  }
  
  // 添加筛选参数
  if (articleId.value) params.articleId = articleId.value
  if (keyword.value) params.keyword = keyword.value
  if (status.value) params.status = status.value
  
  getComments(params).then(res => {
    console.log('[CommentManage.vue] 评论列表原始响应:', res)
    console.log('[CommentManage.vue] res.data:', res.data)
    console.log('[CommentManage.vue] res.data.list:', res.data?.list)
    console.log('[CommentManage.vue] res.data.total:', res.data?.total)
    
    if (res.code === 0) {
      // 适配多种返回结构
      comments.value = res.data?.list || res.data || []
      total.value = res.data?.total || (Array.isArray(res.data) ? res.data.length : 0)
      
      console.log('[CommentManage.vue] 最终comments.value:', comments.value)
      console.log('[CommentManage.vue] 最终total.value:', total.value)
    }
  }).catch(error => {
    console.error('[CommentManage.vue] 获取评论失败:', error)
    console.error('[CommentManage.vue] 错误详情:', error.response?.data)
  }).finally(() => {
    loading.value = false
  })
}
async function approve(row) {
  try {
    const res = await updateCommentStatus(row.CommentID, { status: 'approved' })
    if (res.code === 0) {
      // 更新本地状态
      const comment = comments.value.find(c => c.CommentID === row.CommentID)
      if (comment) comment.Status = 'approved'
      console.log('评论审核成功:', row.CommentID)
    } else {
      console.error('评论审核失败:', res.message)
    }
  } catch (error) {
    console.error('评论审核失败:', error)
  }
}

async function reject(row) {
  try {
    const res = await updateCommentStatus(row.CommentID, { status: 'spam' })
    if (res.code === 0) {
      const comment = comments.value.find(c => c.CommentID === row.CommentID)
      if (comment) comment.Status = 'spam'
      console.log('评论已拒绝:', row.CommentID)
    } else {
      console.error('评论拒绝失败:', res.message)
    }
  } catch (error) {
    console.error('评论拒绝失败:', error)
  }
}

async function remove(row) {
  if (!confirm('确定要删除这条评论吗？')) return
  
  try {
    const res = await deleteComment(row.CommentID)
    if (res.code === 0) {
      // 从本地列表中移除
      const index = comments.value.findIndex(c => c.CommentID === row.CommentID)
      if (index > -1) {
        comments.value.splice(index, 1)
        total.value--
      }
      console.log('评论删除成功:', row.CommentID)
    } else {
      console.error('评论删除失败:', res.message)
    }
  } catch (error) {
    console.error('评论删除失败:', error)
  }
}
onMounted(() => {
  fetchArticles()
  fetchComments()
})

function onPageChange(p) {
  page.value = p
  fetchComments()
}

// 工具函数
function formatTime(timestamp) {
  if (!timestamp) return '-'
  return new Date(timestamp).toLocaleString('zh-CN')
}

function getStatusText(status) {
  const statusMap = {
    'pending': '待审核',
    'approved': '已通过',
    'spam': '已拒绝'
  }
  return statusMap[status] || status
}

function getStatusClass(status) {
  const classMap = {
    'pending': 'bg-yellow-100 text-yellow-800',
    'approved': 'bg-green-100 text-green-800',
    'spam': 'bg-red-100 text-red-800'
  }
  return `px-2 py-1 rounded-full text-xs font-medium ${classMap[status] || 'bg-gray-100 text-gray-800'}`
}
</script>

<style scoped>
.input { border: 1px solid #e5e7eb; border-radius: 0.5rem; padding: 0.5rem 0.75rem; outline: none; transition: box-shadow 0.2s ease; }
.input:focus { box-shadow: 0 0 0 2px rgba(59,130,246,0.35); border-color: #bfdbfe; }
.btn { background-color: #3b82f6; color: #fff; border-radius: 0.375rem; padding: 0.25rem 0.75rem; font-weight: 700; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
.btn:hover { background-color: #2563eb; }
.btn-danger { background-color: #ef4444; color: #fff; border-radius: 0.375rem; padding: 0.25rem 0.75rem; font-weight: 700; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
.btn-danger:hover { background-color: #dc2626; }

.comment-table-wrap table {
  min-width: 980px;
}

.comment-action-row {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.comment-user {
  min-width: 0;
}

.mobile-card-list {
  display: none;
}

.mobile-card {
  border: 1px solid rgba(59, 130, 246, 0.12);
  border-radius: 1rem;
  background: #fff;
  padding: 1rem;
  box-shadow: 0 10px 24px rgba(59, 130, 246, 0.08);
}

.mobile-card-head,
.mobile-action-row {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
}

.mobile-action-row {
  flex-wrap: wrap;
  margin-top: 1rem;
}

.mobile-copy {
  margin: 0.875rem 0 0;
  color: #0f172a;
  line-height: 1.7;
  text-align: left;
}

.mobile-info-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
  margin-top: 1rem;
}

.mobile-info-item {
  padding: 0.875rem;
  border-radius: 0.875rem;
  background: #eff6ff;
  text-align: left;
}

.mobile-info-item span {
  display: block;
  margin-bottom: 0.35rem;
  color: #64748b;
  font-size: 0.75rem;
}

@media (max-width: 768px) {
  .comment-filter-row {
    flex-direction: column;
    align-items: stretch;
  }

  .comment-filter-field,
  .comment-page-size {
    width: 100% !important;
    max-width: none !important;
    margin-left: 0 !important;
  }

  .comment-footer {
    flex-direction: column-reverse;
    align-items: stretch;
  }

  .comment-footer :deep(.pagination) {
    justify-content: flex-start;
    margin-top: 0;
  }
}

@media (max-width: 640px) {
  .comment-filter-row {
    display: flex !important;
    flex-direction: row !important;
    flex-wrap: nowrap !important;
    align-items: center !important;
    overflow-x: auto;
    gap: 0.5rem;
    padding-bottom: 0.25rem;
  }

  .comment-filter-field,
  .comment-page-size {
    width: auto !important;
    min-width: 132px;
    max-width: none !important;
    flex: 0 0 auto;
  }

  .comment-table-wrap {
    display: block;
    overflow-x: auto;
  }

  .comment-desktop-table {
    display: table !important;
  }

  .comment-mobile-list {
    display: none !important;
  }

  .comment-footer {
    flex-direction: row !important;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem;
  }
}

@media (max-width: 390px) {
  .mobile-info-grid {
    grid-template-columns: 1fr;
  }

  .mobile-action-row > * {
    flex-basis: 100%;
  }
}
</style> 
