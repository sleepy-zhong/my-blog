<template>
  <div class="role-manage w-full min-h-screen p-0 m-0">
    <div class="role-page-header w-full flex items-center bg-white border-b px-6 py-4">
      <h2 class="text-2xl font-bold text-blue-700 flex-1">角色管理</h2>
      <button @click="onAdd" class="btn-primary">新建角色</button>
    </div>
    <div class="role-filter-bar w-full bg-white rounded-xl shadow p-4 border mt-4">
      <input
        v-model.trim="keyword"
        type="text"
        class="input role-filter-field"
        placeholder="搜索角色名或描述"
        @keyup.enter="applyFilters"
      />
      <button class="btn-secondary" @click="resetFilters">重置</button>
      <button class="btn-primary" @click="applyFilters">筛选</button>
    </div>
    <div class="role-table-wrap w-full bg-white rounded-xl shadow p-6 border mt-6 overflow-x-auto">
      <table class="role-desktop-table w-full text-center border-separate border-spacing-0">
        <thead class="bg-blue-50">
          <tr>
            <th class="py-3 px-2 font-bold text-gray-700">ID</th>
            <th class="py-3 px-2 font-bold text-gray-700">角色名</th>
            <th class="py-3 px-2 font-bold text-gray-700">描述</th>
            <th class="py-3 px-2 font-bold text-gray-700">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="role in filteredRoles" :key="role.RoleID" class="hover:bg-blue-50 even:bg-blue-50/40 transition">
            <td class="py-2 px-2">{{ role.RoleID }}</td>
            <td class="py-2 px-2">{{ role.Name }}</td>
            <td class="py-2 px-2">{{ role.Description }}</td>
            <td class="py-2 px-2 whitespace-nowrap">
              <div class="role-action-row">
                <button @click="onEdit(role)" class="btn">编辑</button>
                <button @click="onDelete(role)" class="btn-danger">删除</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div class="role-mobile-list mobile-card-list">
        <article v-for="role in filteredRoles" :key="`mobile-${role.RoleID}`" class="mobile-card">
          <div class="mobile-card-head">
            <strong>#{{ role.RoleID }}</strong>
            <span class="mobile-badge">角色</span>
          </div>
          <div class="mobile-info-grid">
            <div class="mobile-info-item">
              <span>角色名</span>
              <strong>{{ role.Name }}</strong>
            </div>
            <div class="mobile-info-item mobile-info-item-full">
              <span>描述</span>
              <strong>{{ role.Description || '-' }}</strong>
            </div>
          </div>
          <div class="role-action-row mobile-action-row">
            <button @click="onEdit(role)" class="btn">编辑</button>
            <button @click="onDelete(role)" class="btn-danger">删除</button>
          </div>
        </article>
      </div>
    </div>
    <div class="role-pagination">
      <Pagination :page="page" :totalPages="totalPages" @update:page="p => { page = p; fetchRoles(); }" />
    </div>

    <!-- 新增/编辑角色弹窗 -->
    <div v-if="showForm" class="role-modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div class="role-modal bg-white rounded-xl shadow-xl p-8 w-full max-w-md relative">
        <button class="absolute top-4 right-6 text-gray-400 hover:text-blue-500 text-2xl" @click="showForm = false">×</button>
        
        <div class="space-y-6">
          <div class="text-center">
            <h3 class="text-xl font-bold text-gray-900">{{ isEdit ? '编辑角色' : '新建角色' }}</h3>
          </div>
          
          <form @submit.prevent="onSave" class="space-y-4">
            <div>
              <label class="block mb-2 font-medium">角色名称</label>
              <input 
                v-model="form.Name" 
                type="text" 
                class="input w-full" 
                placeholder="请输入角色名称"
                required
              />
            </div>
            
            <div>
              <label class="block mb-2 font-medium">角色描述</label>
              <textarea 
                v-model="form.Description" 
                class="input w-full" 
                rows="3" 
                placeholder="请输入角色描述"
              ></textarea>
            </div>
            
            <div class="role-form-footer flex justify-end gap-3 pt-4 border-t">
              <button type="button" @click="showForm = false" class="btn-secondary">取消</button>
              <button type="submit" class="btn-primary" :disabled="saving">
                {{ saving ? '保存中...' : '保存' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { computed, onMounted, ref } from 'vue'
import { getRoles, addRole, updateRole, deleteRole } from '@/api/role'
import Pagination from '@/components/Pagination.vue'

const roles = ref([])
const page = ref(1)
const totalPages = ref(1)
const keyword = ref('')
const showForm = ref(false)
const isEdit = ref(false)
const saving = ref(false)
const activeKeyword = ref('')
const form = ref({
  RoleID: null,
  Name: '',
  Description: ''
})

const filteredRoles = computed(() => {
  const query = activeKeyword.value.trim().toLowerCase()
  if (!query) return roles.value
  return roles.value.filter((role) => {
    const haystack = `${role.Name || ''} ${role.Description || ''}`.toLowerCase()
    return haystack.includes(query)
  })
})

async function fetchRoles() {
  try {
    const res = await getRoles()
    console.log('[fetchRoles] 原始返回:', res)
    if (res.code === 0) {
      const list = res.data?.data?.list || res.data?.data || res.data || []
      roles.value = Array.isArray(list) ? list : []
    }
  } catch (error) {
    console.error('获取角色列表失败:', error)
    roles.value = []
  }
}

function applyFilters() {
  activeKeyword.value = keyword.value
}

function resetFilters() {
  keyword.value = ''
  activeKeyword.value = ''
}

function onAdd() {
  isEdit.value = false
  form.value = {
    RoleID: null,
    Name: '',
    Description: ''
  }
  showForm.value = true
}

function onEdit(role) {
  isEdit.value = true
  form.value = {
    RoleID: role.RoleID,
    Name: role.Name,
    Description: role.Description || ''
  }
  showForm.value = true
}

async function onSave() {
  if (!form.value.Name.trim()) {
    alert('角色名称不能为空')
    return
  }
  
  try {
    saving.value = true
    
    if (isEdit.value) {
      // 编辑角色
      const res = await updateRole(form.value.RoleID, {
        name: form.value.Name,
        description: form.value.Description
      })
      
      if (res.code === 0) {
        alert('角色更新成功')
        showForm.value = false
        fetchRoles()
      } else {
        alert(res.message || '角色更新失败')
      }
    } else {
      // 新增角色
      const res = await addRole({
        name: form.value.Name,
        description: form.value.Description
      })
      
      if (res.code === 0) {
        alert('角色创建成功')
        showForm.value = false
        fetchRoles()
      } else {
        alert(res.message || '角色创建失败')
      }
    }
  } catch (error) {
    console.error('保存角色失败:', error)
    alert('操作失败')
  } finally {
    saving.value = false
  }
}

async function onDelete(role) {
  if (!confirm(`确定要删除角色 "${role.Name}" 吗？此操作不可恢复！`)) return
  
  try {
    const res = await deleteRole(role.RoleID)
    if (res.code === 0) {
      alert('角色删除成功')
      fetchRoles()
    } else {
      alert(res.message || '角色删除失败')
    }
  } catch (error) {
    console.error('删除角色失败:', error)
    alert('删除失败')
  }
}

onMounted(fetchRoles)
</script>
<style scoped>
.btn-primary { background-color: #3b82f6; color: #fff; border-radius: 0.5rem; padding: 0.5rem 1rem; font-weight: 700; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
.btn-primary:hover { background-color: #2563eb; }
.btn-secondary { background-color: #6b7280; color: #fff; border-radius: 0.5rem; padding: 0.5rem 1rem; font-weight: 700; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
.btn-secondary:hover { background-color: #4b5563; }
.btn { background-color: #3b82f6; color: #fff; border-radius: 0.375rem; padding: 0.25rem 0.75rem; font-weight: 700; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
.btn:hover { background-color: #2563eb; }
.btn-danger { background-color: #ef4444; color: #fff; border-radius: 0.375rem; padding: 0.25rem 0.75rem; font-weight: 700; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
.btn-danger:hover { background-color: #dc2626; }
.input { width: 100%; border: 1px solid #e5e7eb; border-radius: 0.5rem; padding: 0.5rem 0.75rem; outline: none; transition: box-shadow 0.2s ease; }
.input:focus { box-shadow: 0 0 0 2px rgba(59,130,246,0.35); border-color: #bfdbfe; }
th, td {
  text-align: center;
}

.role-table-wrap table {
  min-width: 720px;
}

.role-filter-bar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.role-filter-field {
  flex: 1 1 auto;
  min-width: 0;
}

.mobile-card-list {
  display: none;
}

.role-action-row,
.role-pagination {
  display: flex;
}

.role-action-row {
  justify-content: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.role-pagination {
  justify-content: flex-end;
  margin-top: 1rem;
}

.role-modal-backdrop {
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
  .role-page-header,
  .role-form-footer {
    flex-direction: column;
    align-items: stretch;
  }

  .role-page-header {
    gap: 0.75rem;
    padding: 1rem;
  }

  .role-table-wrap {
    padding: 1rem;
  }

  .role-filter-bar {
    flex-wrap: wrap;
  }

  .role-desktop-table {
    display: none;
  }

  .role-mobile-list {
    display: grid;
    gap: 0.875rem;
  }

  .role-modal {
    padding: 1.25rem;
    border-radius: 1.25rem;
  }

  .role-form-footer > * {
    width: 100%;
  }
}

@media (max-width: 640px) {
  .role-filter-bar {
    padding: 0.75rem !important;
  }

  .role-filter-field {
    min-width: 180px;
  }
}

@media (max-width: 390px) {
  .mobile-action-row > * {
    flex: 1 1 100%;
  }
}
</style> 
