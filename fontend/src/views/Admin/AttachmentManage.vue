<template>
  <div class="w-full min-h-screen p-0 m-0">
    <div class="w-full flex items-center bg-white border-b px-6 py-4">
      <h2 class="text-2xl font-bold text-blue-700 flex-1">附件管理</h2>
      <button @click="showUploadModal = true" class="btn-primary">上传附件</button>
    </div>
    
    <!-- 搜索和筛选 -->
    <div class="w-full bg-white rounded-xl shadow p-6 border mt-6">
      <div class="flex gap-4 mb-4">
        <input v-model="keyword" placeholder="搜索文件名..." class="input flex-1" @input="onSearch" />
        <select v-model="fileType" @change="onSearch" class="input w-32">
          <option value="">全部类型</option>
          <option value="image">图片</option>
          <option value="document">文档</option>
          <option value="video">视频</option>
          <option value="audio">音频</option>
        </select>
        <select v-model="selectedUserId" @change="onSearch" class="input w-32">
          <option value="">全部用户</option>
          <option v-for="user in users" :key="user.UserID" :value="user.UserID">
            {{ user.Username }}
          </option>
        </select>
        <button @click="onSearch" class="btn">搜索</button>
        <button @click="showBatchDeleteModal = true" class="btn-warning">批量删除</button>
      </div>
    </div>
    
    <div class="w-full bg-white rounded-xl shadow p-6 border mt-6 overflow-x-auto">
      <table class="w-full text-center border-separate border-spacing-0">
        <thead class="bg-blue-50">
          <tr>
            <th class="py-3 px-2 font-bold text-gray-700">
              <input type="checkbox" v-model="selectAll" @change="toggleSelectAll" />
            </th>
            <th class="py-3 px-2 font-bold text-gray-700">ID</th>
            <th class="py-3 px-2 font-bold text-gray-700">预览</th>
            <th class="py-3 px-2 font-bold text-gray-700">文件名</th>
            <th class="py-3 px-2 font-bold text-gray-700">文件类型</th>
            <th class="py-3 px-2 font-bold text-gray-700">文件大小</th>
            <th class="py-3 px-2 font-bold text-gray-700">上传用户</th>
            <th class="py-3 px-2 font-bold text-gray-700">关联文章</th>
            <th class="py-3 px-2 font-bold text-gray-700">上传时间</th>
            <th class="py-3 px-2 font-bold text-gray-700">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="att in attachments" :key="att.AttachmentID" class="hover:bg-blue-50 even:bg-blue-50/40 transition">
            <td class="py-2 px-2">
              <input type="checkbox" v-model="selectedAttachments" :value="att.AttachmentID" />
            </td>
            <td class="py-2 px-2">{{ att.AttachmentID }}</td>
            <td class="py-2 px-2">
              <div class="flex justify-center">
                <img v-if="isImage(att.MimeType)" :src="getFileUrl(att.StoredName)" 
                     class="w-12 h-12 object-cover rounded cursor-pointer" 
                     @click="previewFile(att)" />
                <div v-else class="w-12 h-12 bg-gray-200 rounded flex items-center justify-center cursor-pointer" @click="previewFile(att)">
                  <span class="text-xs text-gray-500">{{ getFileIcon(att.MimeType) }}</span>
                </div>
              </div>
            </td>
            <td class="py-2 px-2 text-left">
              <div class="max-w-xs truncate" :title="att.OriginalName">
                {{ att.OriginalName }}
              </div>
            </td>
            <td class="py-2 px-2">
              <span class="px-2 py-1 rounded text-xs" :class="getFileTypeClass(att.MimeType)">
                {{ getFileTypeText(att.MimeType) }}
              </span>
            </td>
            <td class="py-2 px-2">{{ formatFileSize(att.FileSize) }}</td>
            <td class="py-2 px-2">{{ att.User?.Username || att.UserID }}</td>
            <td class="py-2 px-2">{{ att.Article?.Title || att.PostID || '-' }}</td>
            <td class="py-2 px-2">{{ formatTime(att.UploadedAt || att.Timestamp || att.CreatedAt) }}</td>
            <td class="py-2 px-2 whitespace-nowrap">
              <button @click="downloadFile(att)" class="btn mr-2">下载</button>
              <button @click="compressFile(att)" v-if="isImage(att.MimeType)" class="btn-secondary mr-2">压缩</button>
              <button @click="deleteAttachment(att)" class="btn-danger">删除</button>
            </td>
          </tr>
        </tbody>
      </table>
      
      <!-- 空状态 -->
      <div v-if="attachments.length === 0 && !loading" class="text-center py-8 text-gray-500">
        暂无附件数据
      </div>
      
      <!-- 加载状态 -->
      <div v-if="loading" class="text-center py-8">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <p class="mt-2 text-gray-500">加载中...</p>
      </div>
    </div>
    
    <!-- 分页 -->
    <div class="flex justify-end items-center gap-2 mt-4">
      <button class="btn" :disabled="page===1" @click="page--; fetchAttachments()">上一页</button>
      <span>第 {{ page }} / {{ totalPages }} 页</span>
      <button class="btn" :disabled="page===totalPages" @click="page++; fetchAttachments()">下一页</button>
      <select v-model="pageSize" @change="fetchAttachments" class="input w-20 ml-2">
        <option v-for="s in [10,20,50,100]" :key="s" :value="s">{{ s }}/页</option>
      </select>
    </div>
    
    <!-- 上传模态框 -->
    <div v-if="showUploadModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-xl font-bold">上传附件</h3>
          <button @click="showUploadModal = false" class="text-gray-500 hover:text-gray-700">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        <form @submit.prevent="uploadFile" class="space-y-4">
          <div>
            <label class="block font-bold mb-1">选择文件</label>
            <input type="file" @change="onFileSelect" class="input" multiple />
          </div>
          <div>
            <label class="block font-bold mb-1">关联文章ID <span class="text-red-500">*</span></label>
            <input v-model="uploadForm.postId" type="number" class="input" placeholder="文章ID" required />
          </div>
          <div>
            <label class="block font-bold mb-1">描述（可选）</label>
            <textarea v-model="uploadForm.description" class="input" rows="3" placeholder="文件描述"></textarea>
          </div>
          <div v-if="hasImageFiles">
            <label class="block font-bold mb-1">压缩设置</label>
            <div class="space-y-2">
              <label class="flex items-center">
                <input v-model="uploadForm.compress" type="checkbox" class="mr-2" />
                启用压缩
              </label>
              <div v-if="uploadForm.compress" class="grid grid-cols-2 gap-2">
                <input v-model="uploadForm.quality" type="number" class="input" placeholder="质量(1-100)" min="1" max="100" />
                <input v-model="uploadForm.maxWidth" type="number" class="input" placeholder="最大宽度" />
              </div>
            </div>
          </div>
          <div class="flex justify-end gap-2">
            <button type="button" @click="showUploadModal = false" class="btn-secondary">取消</button>
            <button type="submit" :disabled="uploading" class="btn-primary">
              {{ uploading ? '上传中...' : '上传' }}
            </button>
          </div>
        </form>
      </div>
    </div>
    
    <!-- 文件预览模态框 -->
    <div v-if="showPreviewModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-xl font-bold">文件预览</h3>
          <button @click="showPreviewModal = false" class="text-gray-500 hover:text-gray-700">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        <div v-if="selectedPreviewFile" class="text-center">
          <img v-if="isImage(selectedPreviewFile.MimeType)" :src="getFileUrl(selectedPreviewFile.StoredName)" 
               class="max-w-full max-h-96 object-contain" />
          <div v-else class="py-8">
            <p class="text-gray-500">此文件类型不支持预览</p>
            <button @click="downloadFile(selectedPreviewFile)" class="btn mt-4">下载文件</button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 批量删除模态框 -->
    <div v-if="showBatchDeleteModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-xl font-bold">批量删除</h3>
          <button @click="showBatchDeleteModal = false" class="text-gray-500 hover:text-gray-700">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        <div class="space-y-4">
          <p>确定要删除选中的 {{ selectedAttachments.length }} 个附件吗？</p>
          <div class="flex justify-end gap-2">
            <button @click="showBatchDeleteModal = false" class="btn-secondary">取消</button>
            <button @click="batchDeleteAttachments" class="btn-danger">确认删除</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { 
  getAttachments, 
  addAttachment, 
  deleteAttachment as deleteAttachmentApi,
  batchDeleteAttachments as batchDeleteAttachmentsApi,
  downloadAttachment,
  compressAttachment
} from '@/api/attachment'

const attachments = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const keyword = ref('')
const fileType = ref('')
const selectedUserId = ref('')
const loading = ref(false)
const uploading = ref(false)
const showUploadModal = ref(false)
const showPreviewModal = ref(false)
const showBatchDeleteModal = ref(false)
const selectedPreviewFile = ref(null)
const selectedFiles = ref([])
const selectedAttachments = ref([])
const users = ref([])

const uploadForm = ref({
  postId: '',
  description: '',
  compress: true,
  quality: 80,
  maxWidth: 1920,
  maxHeight: 1080
})

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))
const selectAll = computed({
  get: () => attachments.value.length > 0 && selectedAttachments.value.length === attachments.value.length,
  set: (value) => {
    if (value) {
      selectedAttachments.value = attachments.value.map(att => att.AttachmentID)
    } else {
      selectedAttachments.value = []
    }
  }
})

const hasImageFiles = computed(() => {
  return selectedFiles.value.some(file => file.type.startsWith('image/'))
})

// 文件类型判断
function isImage(fileType) {
  return fileType?.startsWith('image/')
}

// 获取文件图标
function getFileIcon(fileType) {
  if (fileType?.startsWith('image/')) return '🖼️'
  if (fileType?.startsWith('video/')) return '🎥'
  if (fileType?.startsWith('audio/')) return '🎵'
  if (fileType?.includes('pdf')) return '📄'
  if (fileType?.includes('word') || fileType?.includes('document')) return '📝'
  return '📁'
}

// 获取文件类型样式
function getFileTypeClass(fileType) {
  if (fileType?.startsWith('image/')) return 'bg-green-100 text-green-800'
  if (fileType?.startsWith('video/')) return 'bg-purple-100 text-purple-800'
  if (fileType?.startsWith('audio/')) return 'bg-yellow-100 text-yellow-800'
  if (fileType?.includes('pdf')) return 'bg-red-100 text-red-800'
  return 'bg-gray-100 text-gray-800'
}

// 获取文件类型文本
function getFileTypeText(fileType) {
  if (fileType?.startsWith('image/')) return '图片'
  if (fileType?.startsWith('video/')) return '视频'
  if (fileType?.startsWith('audio/')) return '音频'
  if (fileType?.includes('pdf')) return 'PDF'
  if (fileType?.includes('word') || fileType?.includes('document')) return '文档'
  return '其他'
}

// 格式化文件大小
function formatFileSize(bytes) {
  if (!bytes) return '-'
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
}

// 格式化时间
function formatTime(timestamp) {
  if (!timestamp) return '-'
  return new Date(timestamp).toLocaleString('zh-CN')
}

// 获取文件URL
function getFileUrl(filePath) {
  if (!filePath) return ''
  if (filePath.startsWith('http')) return filePath
  const base = import.meta?.env?.VITE_API_BASE_URL || ''
  const normalized = filePath.startsWith('/') ? filePath : `/${filePath}`
  return `${base}${normalized}`
}

// 切换全选
function toggleSelectAll() {
  if (selectAll.value) {
    selectedAttachments.value = []
  } else {
    selectedAttachments.value = attachments.value.map(att => att.AttachmentID)
  }
}

// 搜索
function onSearch() {
  page.value = 1
  fetchAttachments()
}

// 获取附件列表
async function fetchAttachments() {
  loading.value = true
  try {
    console.log('[AttachmentManage.vue] 开始获取附件，参数:', {
      page: page.value,
      pageSize: pageSize.value,
      keyword: keyword.value,
      fileType: fileType.value,
      userId: selectedUserId.value
    })
    
    const params = {
      page: page.value,
      pageSize: pageSize.value,
      keyword: keyword.value
    }
    if (fileType.value) {
      params.fileType = fileType.value
    }
    if (selectedUserId.value) {
      params.userId = selectedUserId.value
    }
    
    const res = await getAttachments(params)
    console.log('[AttachmentManage.vue] 附件列表原始响应:', res)
    console.log('[AttachmentManage.vue] 响应数据结构:', {
      code: res.code,
      message: res.message,
      data: res.data,
      dataType: typeof res.data,
      isArray: Array.isArray(res.data),
      keys: res.data ? Object.keys(res.data) : []
    })
    
    if (res.code === 0) {
      // 修复数据解析逻辑，处理嵌套的响应结构
      const actualData = res.data?.data || res.data
      const list = actualData?.list || actualData || []
      const totalCount = actualData?.total || 0
      
      console.log('[AttachmentManage.vue] 解析后的数据:', {
        actualData: actualData,
        list: list,
        listType: typeof list,
        isListArray: Array.isArray(list),
        totalCount: totalCount,
        firstItem: list[0] ? Object.keys(list[0]) : []
      })
      
      attachments.value = Array.isArray(list) ? list : []
      total.value = totalCount
      
      console.log('[AttachmentManage.vue] 最终attachments.value:', attachments.value)
      console.log('[AttachmentManage.vue] 最终total.value:', total.value)
    } else {
      console.error('[AttachmentManage.vue] API返回错误:', res.message)
    }
  } catch (error) {
    console.error('[AttachmentManage.vue] 获取附件失败:', error)
    
    // 处理不同类型的错误
    if (error.response?.status === 500) {
      const errorData = error.response?.data
      console.error('[AttachmentManage.vue] 服务器错误详情:', errorData)
      
      if (errorData?.error?.includes('Unknown column')) {
        alert('数据库字段不匹配错误：' + errorData.error + '\n\n请检查后端数据库表结构是否与API文档一致。')
      } else {
        alert('服务器内部错误：' + (errorData?.message || errorData?.error || '未知错误') + '\n\n请检查后端日志获取详细信息。')
      }
    } else if (error.response?.status === 404) {
      console.log('[AttachmentManage.vue] 附件API不存在，显示模拟数据')
      // 显示模拟数据用于前端开发测试
      attachments.value = [
        {
          AttachmentID: 1,
          OriginalName: 'example.jpg',
          StoredName: 'example_123456.jpg',
          MimeType: 'image/jpeg',
          FileSize: 1024000,
          PostID: 1,
          UserID: 1,
          User: { Username: 'sleepyzhong' },
          Article: { Title: '示例文章' },
          Description: '示例图片',
          UploadedAt: '2025-07-25T10:00:00.000Z'
        },
        {
          AttachmentID: 2,
          OriginalName: 'document.pdf',
          StoredName: 'document_123456.pdf',
          MimeType: 'application/pdf',
          FileSize: 2048000,
          PostID: null,
          UserID: 1,
          User: { Username: 'sleepyzhong' },
          Article: null,
          Description: '示例文档',
          UploadedAt: '2025-07-25T09:30:00.000Z'
        }
      ]
      total.value = 2
    } else {
      alert('获取附件列表失败：' + (error.message || '未知错误'))
    }
  } finally {
    loading.value = false
  }
}

// 文件选择
function onFileSelect(event) {
  selectedFiles.value = Array.from(event.target.files)
}

// 上传文件
async function uploadFile() {
  if (selectedFiles.value.length === 0) {
    alert('请选择文件')
    return
  }
  
  if (!uploadForm.value.postId) {
    alert('请填写关联文章ID')
    return
  }
  
  uploading.value = true
  try {
    for (const file of selectedFiles.value) {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('postId', uploadForm.value.postId)
      
      if (uploadForm.value.description) {
        formData.append('description', uploadForm.value.description)
      }
      if (uploadForm.value.compress !== undefined) {
        formData.append('compress', uploadForm.value.compress)
      }
      if (uploadForm.value.quality) {
        formData.append('quality', uploadForm.value.quality)
      }
      if (uploadForm.value.maxWidth) {
        formData.append('maxWidth', uploadForm.value.maxWidth)
      }
      if (uploadForm.value.maxHeight) {
        formData.append('maxHeight', uploadForm.value.maxHeight)
      }
      
      await addAttachment(formData)
    }
    
    showUploadModal.value = false
    uploadForm.value = { 
      postId: '', 
      description: '', 
      compress: true, 
      quality: 80, 
      maxWidth: 1920, 
      maxHeight: 1080 
    }
    selectedFiles.value = []
    fetchAttachments()
    alert('上传成功')
  } catch (error) {
    console.error('[AttachmentManage.vue] 上传失败:', error)
    alert('上传失败，请重试')
  } finally {
    uploading.value = false
  }
}

// 预览文件
function previewFile(att) {
  selectedPreviewFile.value = att
  showPreviewModal.value = true
}

// 下载文件
async function downloadFile(att) {
  try {
    const response = await downloadAttachment(att.AttachmentID)
    const url = window.URL.createObjectURL(new Blob([response]))
    const link = document.createElement('a')
    link.href = url
    link.download = att.OriginalName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('[AttachmentManage.vue] 下载失败:', error)
    alert('下载失败，请重试')
  }
}

// 压缩文件
async function compressFile(att) {
  if (confirm('确定要压缩这个文件吗？')) {
    try {
      await compressAttachment(att.AttachmentID, {
        quality: 80,
        width: 800,
        height: 600
      })
      fetchAttachments()
      alert('压缩成功')
    } catch (error) {
      console.error('[AttachmentManage.vue] 压缩失败:', error)
      alert('压缩失败，请重试')
    }
  }
}

// 删除附件
async function deleteAttachment(att) {
  if (confirm('确定要删除这个附件吗？')) {
    try {
      await deleteAttachmentApi(att.AttachmentID)
      fetchAttachments()
      alert('删除成功')
    } catch (error) {
      console.error('[AttachmentManage.vue] 删除失败:', error)
      alert('删除失败，请重试')
    }
  }
}

// 批量删除附件
async function batchDeleteAttachments() {
  if (selectedAttachments.value.length === 0) {
    alert('请选择要删除的附件')
    return
  }
  
  try {
    await batchDeleteAttachmentsApi(selectedAttachments.value)
    showBatchDeleteModal.value = false
    selectedAttachments.value = []
    fetchAttachments()
    alert('批量删除成功')
  } catch (error) {
    console.error('[AttachmentManage.vue] 批量删除失败:', error)
    alert('批量删除失败，请重试')
  }
}

onMounted(fetchAttachments)
</script>

<style scoped>
.btn-primary {
  @apply bg-blue-500 text-white rounded px-4 py-2 hover:bg-blue-600 transition font-bold shadow;
}
.btn-secondary {
  @apply bg-gray-500 text-white rounded px-4 py-2 hover:bg-gray-600 transition font-bold shadow;
}
.btn-warning {
  @apply bg-yellow-500 text-white rounded px-4 py-2 hover:bg-yellow-600 transition font-bold shadow;
}
.btn { @apply bg-blue-500 text-white rounded px-3 py-1 hover:bg-blue-600 transition font-bold shadow; }
.btn-danger { @apply bg-red-500 text-white rounded px-3 py-1 hover:bg-red-600 transition font-bold shadow; }
.input { @apply border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 transition w-full; }
</style> 