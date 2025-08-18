<template>
  <Card>
    <template #header>
      <div class="flex items-center gap-2 w-full">
        <h2 class="text-lg font-semibold text-gray-800 flex-1">标签管理</h2>
        <button class="btn-primary" @click="onAdd">新建标签</button>
      </div>
    </template>

    <div v-if="loading">
      <LoadingState />
    </div>
    <template v-else>
      <div v-if="error">
        <ErrorState :message="error" @retry="fetchTags" />
      </div>
      <div v-else-if="!tags.length">
        <EmptyState message="暂无标签">
          <template #action>
            <button class="btn-primary" @click="onAdd">新建标签</button>
          </template>
        </EmptyState>
      </div>
      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr>
              <th>ID</th><th>标签名</th><th>描述</th><th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="tag in tags" :key="tag.TagID || tag.id">
              <td>{{ tag.TagID || tag.id }}</td>
              <td>{{ tag.Name || tag.name }}</td>
              <td>{{ tag.Description || tag.description }}</td>
              <td>
                <button @click="onEdit(tag)" class="btn">编辑</button>
                <button @click="onDelete(tag)" class="btn-danger">删除</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <template #footer>
      <Pagination :page="page" :totalPages="totalPages" @update:page="onPageChange" />
    </template>
  </Card>

  <!-- 新增/编辑标签弹窗 -->
  <div v-if="showForm" class="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
    <div class="bg-white rounded-xl shadow-xl p-8 w-full max-w-md relative">
      <button class="absolute top-4 right-6 text-gray-400 hover:text-blue-500 text-2xl" @click="showForm = false">×</button>
      <div class="space-y-6">
        <div class="text-center">
          <h3 class="text-xl font-bold text-gray-900">{{ isEdit ? '编辑标签' : '新建标签' }}</h3>
        </div>
        <form @submit.prevent="onSave" class="space-y-4">
          <div>
            <label class="block mb-2 font-medium">标签名称</label>
            <input v-model="form.Name" type="text" class="input w-full" placeholder="请输入标签名称" required />
          </div>
          <div>
            <label class="block mb-2 font-medium">描述</label>
            <textarea v-model="form.Description" class="input w-full" rows="3" placeholder="请输入描述"></textarea>
          </div>
          <div class="flex justify-end gap-3 pt-4 border-t">
            <button type="button" @click="showForm = false" class="btn-secondary">取消</button>
            <button type="submit" class="btn-primary" :disabled="saving">{{ saving ? '保存中...' : '保存' }}</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import Card from '@/components/Card.vue'
import LoadingState from '@/components/LoadingState.vue'
import EmptyState from '@/components/EmptyState.vue'
import ErrorState from '@/components/ErrorState.vue'
import Pagination from '@/components/Pagination.vue'
import { getTags, addTag, updateTag, deleteTag } from '@/api/tag'

const tags = ref([])
const page = ref(1)
const totalPages = ref(1)
const keyword = ref('')
const loading = ref(false)
const error = ref('')

const showForm = ref(false)
const isEdit = ref(false)
const saving = ref(false)
const form = ref({
  TagID: null,
  Name: '',
  Description: ''
})

async function fetchTags() {
  loading.value = true
  error.value = ''
  try {
    const res = await getTags({ page: page.value, pageSize: 10, keyword: keyword.value })
    const list = res.data?.list || res.data?.data?.list || res.data?.data || res.data || []
    const total = res.data?.total || res.data?.data?.total || res.total || list.length
    tags.value = Array.isArray(list) ? list : []
    totalPages.value = Math.max(1, Math.ceil((Number(total) || 0) / 10))
  } catch (e) {
    console.error(e)
    error.value = '加载失败，请重试'
  } finally {
    loading.value = false
  }
}

function onAdd() {
  isEdit.value = false
  form.value = { TagID: null, Name: '', Description: '' }
  showForm.value = true
}

function onEdit(tag) {
  isEdit.value = true
  form.value = {
    TagID: tag.TagID || tag.id,
    Name: tag.Name || tag.name || '',
    Description: tag.Description || tag.description || ''
  }
  showForm.value = true
}

async function onSave() {
  if (!form.value.Name.trim()) {
    alert('标签名称不能为空')
    return
  }
  try {
    saving.value = true
    const payload = { name: form.value.Name, description: form.value.Description || undefined }
    if (isEdit.value) {
      const res = await updateTag(form.value.TagID, payload)
      if (res.code === 0) {
        showForm.value = false
        fetchTags()
      } else {
        alert(res.message || '标签更新失败')
      }
    } else {
      const res = await addTag(payload)
      if (res.code === 0) {
        showForm.value = false
        fetchTags()
      } else {
        alert(res.message || '标签创建失败')
      }
    }
  } catch (e) {
    console.error(e)
    alert('操作失败')
  } finally {
    saving.value = false
  }
}

async function onDelete(tag) {
  if (!confirm(`确定要删除标签 "${tag.Name || tag.name}" 吗？`)) return
  try {
    const id = tag.TagID || tag.id
    const res = await deleteTag(id)
    if (res.code === 0) {
      fetchTags()
    } else {
      alert(res.message || '删除失败')
    }
  } catch (e) {
    console.error(e)
    alert('删除失败')
  }
}

function onPageChange(p) {
  page.value = p
  fetchTags()
}

onMounted(fetchTags)
</script>

<style scoped>
th, td { text-align: left; }
.btn-primary { background-color: #3b82f6; color: #fff; border-radius: 0.5rem; padding: 0.5rem 1rem; font-weight: 700; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
.btn-primary:hover { background-color: #2563eb; }
.btn-secondary { background-color: #6b7280; color: #fff; border-radius: 0.5rem; padding: 0.5rem 1rem; font-weight: 700; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
.btn-secondary:hover { background-color: #4b5563; }
.input { width: 100%; border: 1px solid #e5e7eb; border-radius: 0.5rem; padding: 0.5rem 0.75rem; outline: none; transition: box-shadow 0.2s ease; }
.input:focus { box-shadow: 0 0 0 2px rgba(59,130,246,0.35); border-color: #bfdbfe; }
.btn { background-color: #3b82f6; color: #fff; border-radius: 0.375rem; padding: 0.25rem 0.75rem; font-weight: 700; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
.btn:hover { background-color: #2563eb; }
.btn-danger { background-color: #ef4444; color: #fff; border-radius: 0.375rem; padding: 0.25rem 0.75rem; font-weight: 700; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
.btn-danger:hover { background-color: #dc2626; }
</style>