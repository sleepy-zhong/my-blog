<template>
  <div class="w-full min-h-screen p-0 m-0">
    <div class="w-full flex items-center bg-white border-b px-6 py-4">
      <h2 class="text-2xl font-bold text-blue-700 flex-1">日志管理</h2>
      <div class="flex items-center gap-2">
        <input v-model="keyword" placeholder="搜索关键词" class="input w-64" @keyup.enter="fetchLogs" />
        <button class="btn-primary" @click="fetchLogs">搜索</button>
      </div>
    </div>
    <div class="w-full bg-white rounded-xl shadow p-6 border mt-6 overflow-x-auto">
      <table class="w-full text-center border-separate border-spacing-0">
        <thead class="bg-blue-50">
          <tr>
            <th class="py-2 px-2 font-bold text-gray-700">ID</th>
            <th class="py-2 px-2 font-bold text-gray-700">用户</th>
            <th class="py-2 px-2 font-bold text-gray-700">操作类型</th>
            <th class="py-2 px-2 font-bold text-gray-700">目标类型</th>
            <th class="py-2 px-2 font-bold text-gray-700">目标ID</th>
            <th class="py-2 px-2 font-bold text-gray-700">IP地址</th>
            <th class="py-2 px-2 font-bold text-gray-700">时间</th>
            <th class="py-2 px-2 font-bold text-gray-700">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="log in logs" :key="log.LogID" class="hover:bg-blue-50 even:bg-blue-50/40 transition">
            <td class="py-2 px-2">{{ log.LogID }}</td>
            <td class="py-2 px-2">{{ log.User?.Username || log.UserID }}</td>
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
            <td class="py-2 px-2">{{ log.TargetID }}</td>
            <td class="py-2 px-2">{{ formatIP(log.IPAddress) }}</td>
            <td class="py-2 px-2">{{ formatTime(log.Timestamp) }}</td>
            <td class="py-2 px-2 whitespace-nowrap">
              <button @click="viewLog(log)" class="btn mr-2">查看</button>
              <button @click="deleteLog(log)" class="btn-danger">删除</button>
            </td>
          </tr>
        </tbody>
      </table>
      <div class="flex justify-end items-center gap-2 mt-4">
        <button class="btn" :disabled="page===1" @click="page--; fetchLogs()">上一页</button>
        <span>第 {{ page }} / {{ totalPages }} 页</span>
        <button class="btn" :disabled="page===totalPages" @click="page++; fetchLogs()">下一页</button>
        <select v-model="pageSize" @change="fetchLogs" class="input w-20 ml-2">
          <option v-for="s in [10,20,50,100]" :key="s" :value="s">{{ s }}/页</option>
        </select>
      </div>
    </div>
    
    <!-- 日志详情模态框 -->
    <div v-if="showDetailModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-xl font-bold">日志详情</h3>
          <button @click="showDetailModal = false" class="text-gray-500 hover:text-gray-700">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        <div v-if="selectedLog" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="font-bold text-gray-700">日志ID:</label>
              <p>{{ selectedLog.LogID }}</p>
            </div>
            <div>
              <label class="font-bold text-gray-700">操作用户:</label>
              <p>{{ selectedLog.User?.Username || selectedLog.UserID }}</p>
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
              <label class="font-bold text-gray-700">操作目标ID:</label>
              <p>{{ selectedLog.TargetID }}</p>
            </div>
            <div>
              <label class="font-bold text-gray-700">IP地址:</label>
              <p>{{ formatIP(selectedLog.IPAddress) }}</p>
            </div>
            <div>
              <label class="font-bold text-gray-700">时间:</label>
              <p>{{ formatTime(selectedLog.Timestamp) }}</p>
            </div>
            <div>
              <label class="font-bold text-gray-700">用户代理:</label>
              <p class="text-sm text-gray-600">{{ selectedLog.UserAgent }}</p>
            </div>
          </div>
          <div v-if="selectedLog.Details">
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
import { ref, onMounted, computed } from 'vue'
import { getLogs, deleteLog as deleteLogApi } from '@/api/log'
import { useUserStore } from '@/store/user'

const userStore = useUserStore()

const logs = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const keyword = ref('')
const showDetailModal = ref(false)
const selectedLog = ref(null)

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))

// 操作类型样式映射
function getOperationTypeClass(type) {
  const classMap = {
    'create': 'bg-green-100 text-green-800',
    'update': 'bg-blue-100 text-blue-800',
    'delete': 'bg-red-100 text-red-800',
    'login': 'bg-purple-100 text-purple-800',
    'logout': 'bg-gray-100 text-gray-800'
  }
  return classMap[type] || 'bg-gray-100 text-gray-800'
}

// 操作类型文本映射
function getOperationTypeText(type) {
  const textMap = {
    'create': '创建',
    'update': '更新',
    'delete': '删除',
    'login': '登录',
    'logout': '登出'
  }
  return textMap[type] || type
}

// 目标类型文本映射
function getTargetTypeText(type) {
  const textMap = {
    'post': '文章',
    'user': '用户',
    'comment': '评论',
    'category': '分类',
    'tag': '标签'
  }
  return textMap[type] || type
}

// 格式化IP地址
function formatIP(ip) {
  if (!ip) return '-'
  return ip.replace('::ffff:', '')
}

// 格式化时间
function formatTime(timestamp) {
  if (!timestamp) return '-'
  return new Date(timestamp).toLocaleString('zh-CN')
}

// 格式化详细信息
function formatDetails(details) {
  if (!details) return '-'
  try {
    const parsed = JSON.parse(details)
    return JSON.stringify(parsed, null, 2)
  } catch {
    return details
  }
}

async function fetchLogs() {
  try {
    console.log('[LogManage.vue] 开始获取日志，参数:', {
      page: page.value,
      pageSize: pageSize.value,
      keyword: keyword.value
    })
    
    const res = await getLogs({ 
      page: page.value, 
      pageSize: pageSize.value, 
      keyword: keyword.value 
    })
    
    console.log('[LogManage.vue] 日志列表原始响应:', res)
    
    if (res.code === 0) {
      // 尝试多种数据结构
      const list = res.data?.data?.list || res.data?.list || res.data || []
      const totalCount = res.data?.data?.total || res.data?.total || 0
      
      logs.value = Array.isArray(list) ? list : []
      total.value = totalCount
      
      console.log('[LogManage.vue] 最终logs.value:', logs.value)
      console.log('[LogManage.vue] 最终total.value:', total.value)
    } else {
      console.error('[LogManage.vue] API返回错误:', res.message)
    }
  } catch (error) {
    console.error('[LogManage.vue] 获取日志失败:', error)
    console.error('[LogManage.vue] 错误详情:', error.response?.data)
    
    // 如果是401错误，提示用户登录
    if (error.response?.status === 401) {
      console.error('[LogManage.vue] 认证失败，请检查登录状态')
      alert('认证失败，请重新登录')
    }
    
    // 如果API不存在，显示模拟数据用于测试
    if (error.response?.status === 404) {
      console.log('[LogManage.vue] 日志API不存在，显示模拟数据')
      logs.value = [
        {
          LogID: 1,
          UserID: 1,
          User: { Username: 'sleepyzhong' },
          OperationType: 'login',
          TargetType: 'user',
          TargetID: 1,
          IPAddress: '127.0.0.1',
          Timestamp: '2025-07-25T10:00:00.000Z',
          UserAgent: 'Mozilla/5.0...',
          Details: '{"action": "用户登录"}'
        },
        {
          LogID: 2,
          UserID: 1,
          User: { Username: 'sleepyzhong' },
          OperationType: 'create',
          TargetType: 'post',
          TargetID: 25,
          IPAddress: '127.0.0.1',
          Timestamp: '2025-07-25T09:30:00.000Z',
          UserAgent: 'Mozilla/5.0...',
          Details: '{"action": "创建文章"}'
        }
      ]
      total.value = 2
    }
  }
}

function viewLog(log) {
  console.log('[LogManage.vue] 查看日志:', log)
  selectedLog.value = log
  showDetailModal.value = true
}

async function deleteLog(log) {
  if (confirm('确定要删除这条日志吗？')) {
    try {
      await deleteLogApi(log.LogID)
      fetchLogs() // 刷新列表
    } catch (error) {
      console.error('[LogManage.vue] 删除日志失败:', error)
    }
  }
}

onMounted(fetchLogs)
</script>

<style scoped>
.btn-primary { background-color: #3b82f6; color: #fff; border-radius: 0.5rem; padding: 0.5rem 1rem; font-weight: 700; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
.btn-primary:hover { background-color: #2563eb; }
.btn { background-color: #3b82f6; color: #fff; border-radius: 0.375rem; padding: 0.25rem 0.75rem; font-weight: 700; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
.btn:hover { background-color: #2563eb; }
.btn-danger { background-color: #ef4444; color: #fff; border-radius: 0.375rem; padding: 0.25rem 0.75rem; font-weight: 700; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
.btn-danger:hover { background-color: #dc2626; }
.input { border: 1px solid #e5e7eb; border-radius: 0.5rem; padding: 0.5rem 0.75rem; outline: none; transition: box-shadow 0.2s ease; }
.input:focus { box-shadow: 0 0 0 2px rgba(59,130,246,0.35); border-color: #bfdbfe; }
</style> 