<template>
  <div class="log-manage w-full min-h-screen p-0 m-0">
    <div class="log-page-header w-full flex items-center bg-white border-b px-6 py-4">
      <div class="flex-1 min-w-0">
        <h2 class="text-2xl font-bold text-blue-700">日志管理</h2>
        <p class="mt-1 text-sm text-slate-500">仅展示后端真实返回的操作日志数据。</p>
      </div>
      <div class="log-toolbar flex items-center gap-2">
        <button class="btn-primary" :disabled="loading" @click="fetchLogs">
          {{ loading ? '加载中...' : '刷新' }}
        </button>
      </div>
    </div>

    <div class="log-table-wrap w-full bg-white rounded-xl shadow p-6 border mt-6 overflow-x-auto">
      <div
        v-if="errorMessage"
        class="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
      >
        {{ errorMessage }}
      </div>

      <div v-if="loading" class="py-16 text-center text-slate-500">正在加载日志...</div>

      <template v-else-if="hasLogs">
        <table class="log-desktop-table w-full text-center border-separate border-spacing-0">
          <thead class="bg-blue-50">
            <tr>
              <th class="py-2 px-2 font-bold text-gray-700">ID</th>
              <th class="py-2 px-2 font-bold text-gray-700">用户</th>
              <th class="py-2 px-2 font-bold text-gray-700">操作类型</th>
              <th class="py-2 px-2 font-bold text-gray-700">目标类型</th>
              <th class="py-2 px-2 font-bold text-gray-700">目标 ID</th>
              <th class="py-2 px-2 font-bold text-gray-700">IP 地址</th>
              <th class="py-2 px-2 font-bold text-gray-700">时间</th>
              <th class="py-2 px-2 font-bold text-gray-700">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in logs" :key="log.LogID" class="hover:bg-blue-50 even:bg-blue-50/40 transition">
              <td class="py-2 px-2">{{ log.LogID }}</td>
              <td class="py-2 px-2">{{ log.User?.Username || log.UserID || '-' }}</td>
              <td class="py-2 px-2">
                <span class="px-2 py-1 rounded text-xs" :class="getOperationTypeClass(log.OperationType)">
                  {{ getOperationTypeText(log.OperationType) }}
                </span>
              </td>
              <td class="py-2 px-2">
                <span class="px-2 py-1 rounded text-xs bg-gray-100">
                  {{ getTargetTypeText(log.TargetType) }}
                </span>
              </td>
              <td class="py-2 px-2">{{ log.TargetID || '-' }}</td>
              <td class="py-2 px-2">{{ formatIP(log.IPAddress) }}</td>
              <td class="py-2 px-2">{{ formatTime(log.Timestamp) }}</td>
              <td class="py-2 px-2 whitespace-nowrap">
                <div class="log-action-row">
                  <button @click="viewLog(log)" class="btn">查看</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div class="log-mobile-list mobile-card-list">
          <article v-for="log in logs" :key="`mobile-${log.LogID}`" class="mobile-card">
            <div class="mobile-card-head">
              <strong>#{{ log.LogID }}</strong>
              <span :class="getOperationTypeClass(log.OperationType)" class="px-2 py-1 rounded text-xs">
                {{ getOperationTypeText(log.OperationType) }}
              </span>
            </div>
            <div class="mobile-info-grid">
              <div class="mobile-info-item">
                <span>用户</span>
                <strong>{{ log.User?.Username || log.UserID || '-' }}</strong>
              </div>
              <div class="mobile-info-item">
                <span>目标类型</span>
                <strong>{{ getTargetTypeText(log.TargetType) }}</strong>
              </div>
              <div class="mobile-info-item">
                <span>目标 ID</span>
                <strong>{{ log.TargetID || '-' }}</strong>
              </div>
              <div class="mobile-info-item">
                <span>IP 地址</span>
                <strong>{{ formatIP(log.IPAddress) }}</strong>
              </div>
              <div class="mobile-info-item mobile-info-item-full">
                <span>时间</span>
                <strong>{{ formatTime(log.Timestamp) }}</strong>
              </div>
            </div>
            <div class="log-action-row mobile-action-row">
              <button @click="viewLog(log)" class="btn">查看</button>
            </div>
          </article>
        </div>

        <div class="log-footer flex justify-end items-center gap-2 mt-4">
          <span class="text-sm text-slate-500 mr-auto">共 {{ total }} 条</span>
          <button class="btn" :disabled="loading || page === 1" @click="goPrevPage">上一页</button>
          <span>第 {{ page }} / {{ totalPages }} 页</span>
          <button class="btn" :disabled="loading || page === totalPages" @click="goNextPage">下一页</button>
          <AppSelect
            v-model="pageSize"
            class="input log-page-size w-24 ml-2"
            :options="pageSizeOptions"
            @change="handlePageSizeChange"
          />
        </div>
      </template>

      <div
        v-else
        class="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-16 text-center text-sm text-slate-500"
      >
        当前暂无日志数据。
      </div>
    </div>

    <div
      v-if="showDetailModal"
      class="log-modal-backdrop fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div class="log-modal bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div class="log-modal-header flex justify-between items-center mb-4">
          <h3 class="text-xl font-bold">日志详情</h3>
          <button @click="showDetailModal = false" class="text-gray-500 hover:text-gray-700">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        <div v-if="selectedLog" class="space-y-4">
          <div class="log-detail-grid grid grid-cols-2 gap-4">
            <div>
              <label class="font-bold text-gray-700">日志 ID:</label>
              <p>{{ selectedLog.LogID }}</p>
            </div>
            <div>
              <label class="font-bold text-gray-700">操作用户:</label>
              <p>{{ selectedLog.User?.Username || selectedLog.UserID || '-' }}</p>
            </div>
            <div>
              <label class="font-bold text-gray-700">操作类型:</label>
              <p>{{ getOperationTypeText(selectedLog.OperationType) }}</p>
            </div>
            <div>
              <label class="font-bold text-gray-700">目标类型:</label>
              <p>{{ getTargetTypeText(selectedLog.TargetType) }}</p>
            </div>
            <div>
              <label class="font-bold text-gray-700">目标 ID:</label>
              <p>{{ selectedLog.TargetID || '-' }}</p>
            </div>
            <div>
              <label class="font-bold text-gray-700">IP 地址:</label>
              <p>{{ formatIP(selectedLog.IPAddress) }}</p>
            </div>
            <div>
              <label class="font-bold text-gray-700">时间:</label>
              <p>{{ formatTime(selectedLog.Timestamp) }}</p>
            </div>
            <div>
              <label class="font-bold text-gray-700">用户代理:</label>
              <p class="text-sm text-gray-600 break-all">{{ selectedLog.UserAgent || '-' }}</p>
            </div>
          </div>
          <div>
            <label class="font-bold text-gray-700">详细信息:</label>
            <div class="bg-gray-100 p-3 rounded text-sm font-mono overflow-x-auto">
              <pre>{{ formatDetails(selectedLog.Details) }}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import AppSelect from '@/components/AppSelect.vue'
import { getLogs } from '@/api/log'

const logs = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const loading = ref(false)
const errorMessage = ref('')
const showDetailModal = ref(false)
const selectedLog = ref(null)
const pageSizeOptions = [10, 20, 50, 100].map((value) => ({
  label: `${value}/页`,
  value,
}))

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))
const hasLogs = computed(() => logs.value.length > 0)

function getOperationTypeClass(type) {
  const classMap = {
    create: 'bg-green-100 text-green-800',
    update: 'bg-blue-100 text-blue-800',
    delete: 'bg-red-100 text-red-800',
    login: 'bg-purple-100 text-purple-800',
    logout: 'bg-gray-100 text-gray-800',
  }

  return classMap[type] || 'bg-gray-100 text-gray-800'
}

function getOperationTypeText(type) {
  const textMap = {
    create: '创建',
    update: '更新',
    delete: '删除',
    login: '登录',
    logout: '登出',
  }

  return textMap[type] || type || '-'
}

function getTargetTypeText(type) {
  const textMap = {
    post: '文章',
    user: '用户',
    comment: '评论',
    category: '分类',
    tag: '标签',
  }

  return textMap[type] || type || '-'
}

function formatIP(ip) {
  if (!ip) return '-'
  return String(ip).replace('::ffff:', '')
}

function formatTime(timestamp) {
  if (!timestamp) return '-'
  return new Date(timestamp).toLocaleString('zh-CN')
}

function formatDetails(details) {
  if (!details) return '-'

  if (typeof details === 'object') {
    return JSON.stringify(details, null, 2)
  }

  try {
    const parsed = JSON.parse(details)
    return JSON.stringify(parsed, null, 2)
  } catch {
    return String(details)
  }
}

function resolveLogErrorMessage(error) {
  const status = error?.response?.status
  const fallbackMessage = error?.response?.data?.message || error?.message || '获取日志失败，请稍后重试。'

  if (status === 401) {
    return '登录状态已失效，请重新登录后再查看日志。'
  }

  if (status === 403) {
    return '当前账号没有查看操作日志的权限。'
  }

  if (status === 404) {
    return '日志接口不存在，请确认后端已启用 `/api/logs`。'
  }

  return fallbackMessage
}

async function fetchLogs() {
  loading.value = true
  errorMessage.value = ''

  try {
    const res = await getLogs({
      page: page.value,
      pageSize: pageSize.value,
    })

    if (res?.code !== 0) {
      throw new Error(res?.message || '获取日志失败，请稍后重试。')
    }

    const list = Array.isArray(res.data?.list) ? res.data.list : []
    const totalCount = Number(res.data?.total || 0)
    const pageCount = Math.max(1, Math.ceil(totalCount / pageSize.value))

    logs.value = list
    total.value = totalCount

    if (totalCount > 0 && list.length === 0 && page.value > pageCount) {
      page.value = pageCount
      await fetchLogs()
    }
  } catch (error) {
    logs.value = []
    total.value = 0
    errorMessage.value = resolveLogErrorMessage(error)
  } finally {
    loading.value = false
  }
}

function viewLog(log) {
  selectedLog.value = log
  showDetailModal.value = true
}

function goPrevPage() {
  if (loading.value || page.value === 1) return
  page.value -= 1
  fetchLogs()
}

function goNextPage() {
  if (loading.value || page.value >= totalPages.value) return
  page.value += 1
  fetchLogs()
}

function handlePageSizeChange() {
  page.value = 1
  fetchLogs()
}

onMounted(fetchLogs)
</script>

<style scoped>
.btn-primary { background-color: #3b82f6; color: #fff; border-radius: 0.5rem; padding: 0.5rem 1rem; font-weight: 700; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
.btn-primary:hover { background-color: #2563eb; }
.btn:disabled,
.btn-primary:disabled { cursor: not-allowed; opacity: 0.6; }
.btn { background-color: #3b82f6; color: #fff; border-radius: 0.375rem; padding: 0.25rem 0.75rem; font-weight: 700; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
.btn:hover { background-color: #2563eb; }
.input { border: 1px solid #e5e7eb; border-radius: 0.5rem; padding: 0.5rem 0.75rem; outline: none; transition: box-shadow 0.2s ease; }
.input:focus { box-shadow: 0 0 0 2px rgba(59,130,246,0.35); border-color: #bfdbfe; }

.log-table-wrap table {
  min-width: 980px;
}

.mobile-card-list {
  display: none;
}

.log-action-row {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.log-modal-backdrop {
  padding: 1rem;
  overflow-y: auto;
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

.mobile-info-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
  margin-top: 1rem;
}

.mobile-info-item {
  padding: 0.875rem;
  border-radius: 0.875rem;
  background: #f8fafc;
  text-align: left;
}

.mobile-info-item span {
  display: block;
  margin-bottom: 0.35rem;
  color: #64748b;
  font-size: 0.75rem;
}

.mobile-info-item-full {
  grid-column: 1 / -1;
}

.mobile-action-row {
  flex-wrap: wrap;
  margin-top: 1rem;
}

@media (max-width: 768px) {
  .log-page-header,
  .log-toolbar,
  .log-footer {
    flex-direction: column;
    align-items: stretch;
  }

  .log-page-header {
    gap: 0.75rem;
    padding: 1rem;
  }

  .log-table-wrap {
    padding: 1rem;
  }

  .log-desktop-table {
    display: none;
  }

  .log-mobile-list {
    display: grid;
    gap: 0.875rem;
  }

  .log-page-size {
    width: 100% !important;
    max-width: none !important;
    margin-left: 0 !important;
  }

  .log-footer {
    flex-direction: column-reverse;
  }

  .log-modal {
    padding: 1rem;
    border-radius: 1.25rem;
  }

  .log-modal-header {
    align-items: flex-start;
  }

  .log-detail-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .log-page-header,
  .log-toolbar,
  .log-footer {
    flex-direction: row !important;
    flex-wrap: nowrap !important;
    align-items: center !important;
    overflow-x: auto;
    gap: 0.5rem;
  }

  .log-page-size {
    width: auto !important;
    min-width: 110px;
    max-width: none !important;
    margin-left: 0 !important;
    flex: 0 0 auto;
  }

  .log-toolbar > * {
    flex: 0 0 auto;
    min-width: 132px;
  }

  .log-table-wrap {
    display: block;
    overflow-x: auto;
  }

  .log-desktop-table {
    display: table !important;
  }

  .log-mobile-list {
    display: none !important;
  }
}

@media (max-width: 390px) {
  .mobile-info-grid {
    grid-template-columns: 1fr;
  }

  .mobile-action-row > * {
    flex: 1 1 100%;
  }
}
</style>
