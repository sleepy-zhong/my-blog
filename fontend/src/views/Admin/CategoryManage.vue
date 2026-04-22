<template>
  <Card class="category-manage">
    <template #header>
      <div class="category-header flex items-center gap-2 w-full">
        <h2 class="text-lg font-semibold text-gray-800 flex-1">分类管理</h2>
        <button class="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700" @click="onAdd">新建分类</button>
      </div>
    </template>

    <div v-if="loading">
      <LoadingState />
    </div>
    <template v-else>
      <div class="category-filter-bar">
        <input
          v-model.trim="keyword"
          type="text"
          class="input category-filter-field"
          placeholder="搜索分类名称或描述"
          @keyup.enter="fetchCategories"
        />
        <button class="btn-secondary" @click="resetFilters">重置</button>
        <button class="btn-primary" @click="fetchCategories">筛选</button>
      </div>
      <div v-if="error">
        <ErrorState :message="error" @retry="fetchCategories" />
      </div>
      <div v-else-if="!categories.length">
        <EmptyState message="暂无分类">
          <template #action>
            <button class="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700" @click="onAdd">新建分类</button>
          </template>
        </EmptyState>
      </div>
      <div v-else class="category-table-wrap overflow-x-auto">
        <table class="category-desktop-table w-full">
          <thead>
            <tr>
              <th>ID</th><th>分类名</th><th>描述</th><th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="cat in categories" :key="cat.CategoryID || cat.id">
              <td>{{ cat.CategoryID || cat.id }}</td>
              <td>{{ cat.Name || cat.name }}</td>
              <td>{{ cat.Description || cat.description }}</td>
              <td>
                <div class="category-action-row">
                  <button @click="onEdit(cat)" class="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700">编辑</button>
                  <button @click="onDelete(cat)" class="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700">删除</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div class="category-mobile-list mobile-card-list">
          <article v-for="cat in categories" :key="`mobile-${cat.CategoryID || cat.id}`" class="mobile-card">
            <div class="mobile-card-head">
              <strong>#{{ cat.CategoryID || cat.id }}</strong>
              <span class="mobile-badge">分类</span>
            </div>
            <div class="mobile-info-grid">
              <div class="mobile-info-item">
                <span>分类名</span>
                <strong>{{ cat.Name || cat.name }}</strong>
              </div>
              <div class="mobile-info-item mobile-info-item-full">
                <span>描述</span>
                <strong>{{ cat.Description || cat.description || '-' }}</strong>
              </div>
            </div>
            <div class="category-action-row mobile-action-row">
              <button @click="onEdit(cat)" class="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700">编辑</button>
              <button @click="onDelete(cat)" class="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700">删除</button>
            </div>
          </article>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="category-footer">
        <Pagination :page="page" :totalPages="totalPages" @update:page="onPageChange" />
      </div>
    </template>
  </Card>

  <!-- 新增/编辑分类弹窗 -->
  <div v-if="showForm" class="category-modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/30">
    <div class="category-modal bg-white rounded-xl shadow-xl p-8 w-full max-w-md relative">
      <button class="absolute top-4 right-6 text-gray-400 hover:text-blue-500 text-2xl" @click="showForm = false">×</button>
      <div class="space-y-6">
        <div class="text-center">
          <h3 class="text-xl font-bold text-gray-900">{{ isEdit ? '编辑分类' : '新建分类' }}</h3>
        </div>
        <form @submit.prevent="onSave" class="space-y-4">
          <div>
            <label class="block mb-2 font-medium">分类名称</label>
            <input v-model="form.Name" type="text" class="input w-full" placeholder="请输入分类名称" required />
          </div>
          <div>
            <label class="block mb-2 font-medium">描述</label>
            <textarea v-model="form.Description" class="input w-full" rows="3" placeholder="请输入描述"></textarea>
          </div>
          <div>
            <label class="block mb-2 font-medium">父分类（可选）</label>
            <AppSelect
              v-model="form.ParentCategoryID"
              class="input w-full"
              :options="parentCategoryOptions"
              placeholder="无"
              searchable
            />
          </div>
          <div class="category-form-footer flex justify-end gap-3 pt-4 border-t">
            <button type="button" @click="showForm = false" class="btn-secondary">取消</button>
            <button type="submit" class="btn-primary" :disabled="saving">{{ saving ? '保存中...' : '保存' }}</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import AppSelect from '@/components/AppSelect.vue'
import Card from '@/components/Card.vue'
import LoadingState from '@/components/LoadingState.vue'
import EmptyState from '@/components/EmptyState.vue'
import ErrorState from '@/components/ErrorState.vue'
import Pagination from '@/components/Pagination.vue'
import { getCategories, addCategory, updateCategory, deleteCategory } from '@/api/category'

const categories = ref([])
const page = ref(1)
const totalPages = ref(1)
const keyword = ref('')
const loading = ref(false)
const error = ref('')

const showForm = ref(false)
const isEdit = ref(false)
const saving = ref(false)
const form = ref({
  CategoryID: null,
  Name: '',
  Description: '',
  ParentCategoryID: null
})
const parentCategoryOptions = computed(() => [
  { label: '无', value: null },
  ...categories.value.map((category) => ({
    label: category.Name || category.name,
    value: category.CategoryID || category.id
  }))
])

async function fetchCategories() {
  loading.value = true
  error.value = ''
  try {
    const res = await getCategories({ page: page.value, pageSize: 10, keyword: keyword.value })
    const list = res.data?.list || res.data?.data?.list || res.data?.data || res.data || []
    const total = res.data?.total || res.data?.data?.total || res.total || list.length
    categories.value = Array.isArray(list) ? list : []
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
  form.value = { CategoryID: null, Name: '', Description: '', ParentCategoryID: null }
  showForm.value = true
}

function onEdit(cat) {
  isEdit.value = true
  form.value = {
    CategoryID: cat.CategoryID || cat.id,
    Name: cat.Name || cat.name || '',
    Description: cat.Description || cat.description || '',
    ParentCategoryID: cat.ParentCategoryID || cat.parentCategoryId || null
  }
  showForm.value = true
}

async function onSave() {
  if (!form.value.Name.trim()) {
    alert('分类名称不能为空')
    return
  }
  try {
    saving.value = true
    const payload = {
      name: form.value.Name,
      description: form.value.Description || undefined,
      parentCategoryId: form.value.ParentCategoryID || undefined
    }
    if (isEdit.value) {
      const res = await updateCategory(form.value.CategoryID, payload)
      if (res.code === 0) {
        showForm.value = false
        fetchCategories()
      } else {
        alert(res.message || '分类更新失败')
      }
    } else {
      const res = await addCategory(payload)
      if (res.code === 0) {
        showForm.value = false
        fetchCategories()
      } else {
        alert(res.message || '分类创建失败')
      }
    }
  } catch (e) {
    console.error(e)
    alert('操作失败')
  } finally {
    saving.value = false
  }
}

async function onDelete(cat) {
  if (!confirm(`确定要删除分类 "${cat.Name || cat.name}" 吗？`)) return
  try {
    const id = cat.CategoryID || cat.id
    const res = await deleteCategory(id)
    if (res.code === 0) {
      fetchCategories()
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
  fetchCategories()
}

function resetFilters() {
  keyword.value = ''
  page.value = 1
  fetchCategories()
}

onMounted(fetchCategories)
</script>

<style scoped>
th, td { text-align: left; }
.btn-primary { background-color: #3b82f6; color: #fff; border-radius: 0.5rem; padding: 0.5rem 1rem; font-weight: 700; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
.btn-primary:hover { background-color: #2563eb; }
.btn-secondary { background-color: #6b7280; color: #fff; border-radius: 0.5rem; padding: 0.5rem 1rem; font-weight: 700; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
.btn-secondary:hover { background-color: #4b5563; }
.input { width: 100%; border: 1px solid #e5e7eb; border-radius: 0.5rem; padding: 0.5rem 0.75rem; outline: none; transition: box-shadow 0.2s ease; }
.input:focus { box-shadow: 0 0 0 2px rgba(59,130,246,0.35); border-color: #bfdbfe; }
.btn-danger { background-color: #ef4444; color: #fff; border-radius: 0.375rem; padding: 0.25rem 0.75rem; font-weight: 700; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
.btn-danger:hover { background-color: #dc2626; }

.category-table-wrap table {
  min-width: 720px;
}

.category-filter-bar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.category-filter-field {
  flex: 1 1 auto;
  min-width: 0;
}

.mobile-card-list {
  display: none;
}

.category-action-row,
.category-footer {
  display: flex;
}

.category-action-row {
  flex-wrap: wrap;
  gap: 0.5rem;
}

.category-footer {
  justify-content: flex-end;
  margin-top: 0.5rem;
}

.category-modal-backdrop {
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

.mobile-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.3rem 0.7rem;
  border-radius: 999px;
  background: #eff6ff;
  color: #2563eb;
  font-size: 0.75rem;
  font-weight: 700;
}

.mobile-info-grid {
  display: grid;
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

.mobile-action-row {
  flex-wrap: wrap;
  margin-top: 1rem;
}

@media (max-width: 768px) {
  .category-header,
  .category-form-footer {
    flex-direction: column;
    align-items: stretch;
  }

  .category-form-footer > * {
    width: 100%;
  }

  .category-desktop-table {
    display: none;
  }

  .category-mobile-list {
    display: grid;
    gap: 0.875rem;
  }

  .category-modal {
    padding: 1.25rem;
    border-radius: 1.25rem;
  }

  .category-filter-bar {
    flex-wrap: wrap;
  }
}

@media (max-width: 640px) {
  .category-filter-bar {
    margin-bottom: 0.75rem;
  }

  .category-filter-field {
    min-width: 180px;
  }
}

@media (max-width: 390px) {
  .mobile-action-row > * {
    flex: 1 1 100%;
  }
}
</style>
