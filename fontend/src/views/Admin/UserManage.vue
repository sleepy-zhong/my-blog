<template>
  <div class="w-full min-h-screen p-0 m-0">
    <!-- 顶部操作栏 -->
    <div class="w-full flex items-center bg-white border-b px-6 py-4">
      <h2 class="text-2xl font-bold text-blue-700 flex-1">用户管理</h2>
      <div class="flex gap-2">
        <button class="btn-primary" @click="onAdd">
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
          </svg>
          新增用户
        </button>
      </div>
    </div>

    <!-- 统计卡片区 -->
    <div class="w-full grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 p-6">
      <div class="bg-white rounded-xl shadow p-6 border flex flex-col items-center">
        <div class="text-3xl font-bold text-blue-600 mb-2">{{ statistics.totalUsers || 0 }}</div>
        <div class="text-gray-500">总用户数</div>
      </div>
      <div class="bg-white rounded-xl shadow p-6 border flex flex-col items-center">
        <div class="text-3xl font-bold text-green-600 mb-2">{{ statistics.activeUsers || 0 }}</div>
        <div class="text-gray-500">活跃用户</div>
      </div>
      <div class="bg-white rounded-xl shadow p-6 border flex flex-col items-center">
        <div class="text-3xl font-bold text-orange-600 mb-2">{{ statistics.newUsersToday || 0 }}</div>
        <div class="text-gray-500">今日新增</div>
      </div>
      <div class="bg-white rounded-xl shadow p-6 border flex flex-col items-center">
        <div class="text-3xl font-bold text-purple-600 mb-2">{{ statistics.newUsersThisMonth || 0 }}</div>
        <div class="text-gray-500">本月新增</div>
      </div>
    </div>

    <!-- 搜索和筛选区 -->
    <div class="w-full bg-white rounded-xl shadow p-6 border mt-6">
      <div class="flex flex-wrap gap-4 items-center">
        <div class="flex-1 min-w-64">
          <input 
            v-model="keyword" 
            placeholder="搜索用户名、邮箱、显示名称..." 
            class="input w-full"
            @input="onSearch"
          />
        </div>
        <select v-model="statusFilter" @change="onSearch" class="input w-32">
          <option value="">全部状态</option>
          <option value="active">启用</option>
          <option value="inactive">禁用</option>
        </select>
        <select v-model="roleFilter" @change="onSearch" class="input w-32">
          <option value="">全部角色</option>
          <option v-for="role in allRoles" :key="role.RoleID" :value="role.RoleID">
            {{ role.Name }}
          </option>
        </select>
        <button @click="onSearch" class="btn-primary">
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
          搜索
        </button>
        <button @click="resetFilters" class="btn-secondary">
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
          </svg>
          重置
        </button>
      </div>
    </div>

    <!-- 批量操作栏 -->
    <div v-if="selectedUsers.length > 0" class="w-full bg-blue-50 rounded-xl p-4 mt-4 flex items-center justify-between">
      <div class="flex items-center gap-4">
        <span class="text-blue-700 font-medium">已选择 {{ selectedUsers.length }} 个用户</span>
        <button @click="clearSelection" class="text-blue-600 hover:text-blue-800 text-sm">清除选择</button>
      </div>
      <div class="flex gap-2">
        <button @click="batchEnable" class="btn-sm btn-success">
          <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
          批量启用
        </button>
        <button @click="batchDisable" class="btn-sm btn-warning">
          <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728"></path>
          </svg>
          批量禁用
        </button>
        <button @click="batchDelete" class="btn-sm btn-danger">
          <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
          </svg>
          批量删除
        </button>
      </div>
    </div>

    <!-- 表格区 -->
    <div class="w-full bg-white rounded-xl shadow p-6 border mt-6 overflow-x-auto">
      <table class="w-full text-center border-separate border-spacing-0">
        <thead class="bg-blue-50">
          <tr>
            <th class="py-3 px-2 font-bold text-gray-700">
              <input 
                type="checkbox" 
                :checked="isAllSelected" 
                @change="toggleSelectAll"
                class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
            </th>
            <th class="py-3 px-2 font-bold text-gray-700">ID</th>
            <th class="py-3 px-2 font-bold text-gray-700">头像</th>
            <th class="py-3 px-2 font-bold text-gray-700">用户名</th>
            <th class="py-3 px-2 font-bold text-gray-700">显示名称</th>
            <th class="py-3 px-2 font-bold text-gray-700">邮箱</th>
            <th class="py-3 px-2 font-bold text-gray-700">手机号</th>
            <th class="py-3 px-2 font-bold text-gray-700">角色</th>
            <th class="py-3 px-2 font-bold text-gray-700">状态</th>
            <th class="py-3 px-2 font-bold text-gray-700">创建时间</th>
            <th class="py-3 px-2 font-bold text-gray-700">最后登录</th>
            <th class="py-3 px-2 font-bold text-gray-700">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in users" :key="user.UserID" class="hover:bg-blue-50 even:bg-blue-50/40 transition">
            <td class="py-2 px-2">
              <input 
                type="checkbox" 
                :value="user.UserID"
                v-model="selectedUsers"
                class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
            </td>
            <td class="py-2 px-2">{{ user.UserID }}</td>
            <td class="py-2 px-2">
              <div class="flex justify-center">
                <img 
                  v-if="user.AvatarURL" 
                  :src="user.AvatarURL" 
                  class="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                  @error="handleAvatarError"
                />
                <div v-else class="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                  {{ user.Username?.charAt(0).toUpperCase() }}
                </div>
              </div>
            </td>
            <td class="py-2 px-2">
              <div class="font-medium">{{ user.Username }}</div>
              <div v-if="user.Bio" class="text-xs text-gray-500 truncate max-w-24" :title="user.Bio">
                {{ user.Bio }}
              </div>
            </td>
            <td class="py-2 px-2">{{ user.DisplayName || '-' }}</td>
            <td class="py-2 px-2">{{ user.Email }}</td>
            <td class="py-2 px-2">{{ user.PhoneNumber || '-' }}</td>
            <td class="py-2 px-2">
              <div class="flex flex-wrap gap-1 justify-center">
                <span 
                  v-for="role in user.Roles" 
                  :key="role.RoleID"
                  class="px-2 py-1 text-xs rounded-full"
                  :class="getRoleClass(role.Name)"
                >
                  {{ role.Name }}
                </span>
                <span v-if="!user.Roles || user.Roles.length === 0" class="text-gray-400 text-xs">无角色</span>
              </div>
            </td>
            <td class="py-2 px-2">
              <span 
                class="px-2 py-1 rounded-full text-xs font-medium"
                :class="user.IsActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'"
              >
                {{ user.IsActive ? '启用' : '禁用' }}
              </span>
            </td>
            <td class="py-2 px-2 text-xs">{{ formatTime(user.CreatedAt) }}</td>
            <td class="py-2 px-2 text-xs">{{ formatTime(user.LastLogin) || '-' }}</td>
            <td class="py-2 px-2 whitespace-nowrap">
              <div class="flex gap-1 justify-center">
                <button @click="onView(user)" class="btn-sm btn-info" title="查看详情">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                  </svg>
                </button>
                <button @click="onEdit(user)" class="btn-sm btn" title="编辑">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                  </svg>
                </button>
                <button @click="onStatusChange(user)" class="btn-sm" :class="user.IsActive ? 'btn-warning' : 'btn-success'" :title="user.IsActive ? '禁用' : '启用'">
                  <svg v-if="user.IsActive" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728"></path>
                  </svg>
                  <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </button>
                <button @click="onAssignRoles(user)" class="btn-sm btn-warning" title="分配角色">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
                  </svg>
                </button>
                <button @click="onDelete(user)" class="btn-sm btn-danger" title="删除">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                  </svg>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      
      <!-- 空状态 -->
      <div v-if="users.length === 0 && !loading" class="text-center py-8 text-gray-500">
        <svg class="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
        </svg>
        <p>暂无用户数据</p>
      </div>
      
      <!-- 加载状态 -->
      <div v-if="loading" class="text-center py-8">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <p class="mt-2 text-gray-500">加载中...</p>
      </div>
    </div>

    <!-- 分页 -->
    <div class="flex justify-end items-center gap-2 mt-4">
      <button class="btn" :disabled="page===1" @click="page--; fetchUsers()">上一页</button>
      <span>第 {{ page }} / {{ totalPages }} 页</span>
      <button class="btn" :disabled="page===totalPages" @click="page++; fetchUsers()">下一页</button>
      <select v-model="pageSize" @change="fetchUsers" class="input w-20 ml-2">
        <option v-for="s in [10,20,50,100]" :key="s" :value="s">{{ s }}/页</option>
      </select>
    </div>

    <!-- 新增/编辑弹窗 -->
    <div v-if="showForm" class="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div class="bg-white rounded-xl shadow-xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto relative">
        <button class="absolute top-4 right-6 text-gray-400 hover:text-blue-500 text-2xl" @click="showForm = false">×</button>
        <h3 class="text-xl font-bold mb-6">{{ isEdit ? '编辑用户' : '新建用户' }}</h3>
        <form @submit.prevent="onSave" class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block mb-2 font-medium">用户名 <span class="text-red-500">*</span></label>
              <input v-model="form.Username" class="input" required :disabled="isEdit" />
            </div>
            <div>
              <label class="block mb-2 font-medium">显示名称</label>
              <input v-model="form.DisplayName" class="input" placeholder="用户显示名称" />
            </div>
            <div>
              <label class="block mb-2 font-medium">邮箱 <span class="text-red-500">*</span></label>
              <input v-model="form.Email" class="input" required type="email" />
            </div>
            <div>
              <label class="block mb-2 font-medium">手机号</label>
              <input v-model="form.PhoneNumber" class="input" placeholder="手机号码" />
            </div>
            <div v-if="!isEdit">
              <label class="block mb-2 font-medium">密码 <span class="text-red-500">*</span></label>
              <input v-model="form.Password" class="input" required type="password" placeholder="设置密码" />
            </div>
            <div v-if="!isEdit">
              <label class="block mb-2 font-medium">确认密码 <span class="text-red-500">*</span></label>
              <input v-model="form.ConfirmPassword" class="input" required type="password" placeholder="再次输入密码" />
            </div>
            <div>
              <label class="block mb-2 font-medium">头像URL</label>
              <input v-model="form.AvatarURL" class="input" placeholder="头像图片链接" />
            </div>
            <div>
              <label class="block mb-2 font-medium">状态</label>
              <select v-model="form.IsActive" class="input">
                <option :value="true">启用</option>
                <option :value="false">禁用</option>
              </select>
            </div>
          </div>
          <div>
            <label class="block mb-2 font-medium">个人简介</label>
            <textarea v-model="form.Bio" class="input" rows="3" placeholder="用户个人简介"></textarea>
          </div>
          <div>
            <label class="block mb-2 font-medium">角色分配</label>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
              <label v-for="role in allRoles" :key="role.RoleID" class="flex items-center">
                <input 
                  type="checkbox" 
                  :value="role.RoleID" 
                  v-model="form.roleIds" 
                  class="mr-2"
                />
                <span>{{ role.Name }}</span>
              </label>
            </div>
            <div v-if="allRoles.length === 0" class="text-center py-4 text-gray-500">
              暂无可用角色
            </div>
          </div>
          <div class="flex justify-end gap-3 mt-8 pt-6 border-t">
            <button type="button" class="btn-secondary" @click="showForm = false">取消</button>
            <button type="submit" class="btn-primary" :disabled="saving">
              {{ saving ? '保存中...' : '保存' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- 用户详情弹窗 -->
    <div v-if="showDetail" class="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div class="bg-white rounded-xl shadow-xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto relative">
        <button class="absolute top-4 right-6 text-gray-400 hover:text-blue-500 text-2xl" @click="showDetail = false">×</button>
        <div v-if="selectedUser" class="space-y-6">
          <div class="flex items-center space-x-4">
            <img 
              v-if="selectedUser.AvatarURL" 
              :src="selectedUser.AvatarURL" 
              class="w-20 h-20 rounded-full object-cover border-4 border-gray-200"
              @error="handleAvatarError"
            />
            <div v-else class="w-20 h-20 rounded-full bg-blue-500 flex items-center justify-center text-white text-2xl font-bold">
              {{ selectedUser.Username?.charAt(0).toUpperCase() }}
            </div>
            <div>
              <h3 class="text-2xl font-bold">{{ selectedUser.DisplayName || selectedUser.Username }}</h3>
              <p class="text-gray-500">@{{ selectedUser.Username }}</p>
            </div>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 class="font-medium mb-3">基本信息</h4>
              <div class="space-y-2">
                <div class="flex justify-between">
                  <span class="text-gray-500">用户ID:</span>
                  <span>{{ selectedUser.UserID }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500">邮箱:</span>
                  <span>{{ selectedUser.Email }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500">手机号:</span>
                  <span>{{ selectedUser.PhoneNumber || '-' }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500">状态:</span>
                  <span :class="selectedUser.IsActive ? 'text-green-600' : 'text-red-600'">
                    {{ selectedUser.IsActive ? '启用' : '禁用' }}
                  </span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 class="font-medium mb-3">时间信息</h4>
              <div class="space-y-2">
                <div class="flex justify-between">
                  <span class="text-gray-500">创建时间:</span>
                  <span>{{ formatTime(selectedUser.CreatedAt) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500">最后登录:</span>
                  <span>{{ formatTime(selectedUser.LastLogin) || '-' }}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div v-if="selectedUser.Bio">
            <h4 class="font-medium mb-3">个人简介</h4>
            <p class="text-gray-700 bg-gray-50 p-3 rounded">{{ selectedUser.Bio }}</p>
          </div>
          
          <div>
            <h4 class="font-medium mb-3">角色权限</h4>
            <div class="flex flex-wrap gap-2">
              <span 
                v-for="role in selectedUser.Roles" 
                :key="role.RoleID"
                class="px-3 py-1 rounded-full text-sm"
                :class="getRoleClass(role.Name)"
              >
                {{ role.Name }}
              </span>
              <span v-if="!selectedUser.Roles || selectedUser.Roles.length === 0" class="text-gray-400">
                无角色分配
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 角色分配弹窗 -->
    <div v-if="showRoleAssign" class="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div class="bg-white rounded-xl shadow-xl p-8 w-full max-w-md relative">
        <button class="absolute top-4 right-6 text-gray-400 hover:text-blue-500 text-2xl" @click="showRoleAssign = false">×</button>
        
        <div v-if="selectedUser" class="space-y-6">
          <div class="text-center">
            <h3 class="text-xl font-bold text-gray-900">分配角色</h3>
            <p class="text-gray-500 mt-2">为用户 "{{ selectedUser.Username }}" 分配角色</p>
          </div>
          
          <div>
            <label class="block mb-3 font-medium">选择角色</label>
            <div class="space-y-2 max-h-60 overflow-y-auto">
              <label v-for="role in allRoles" :key="role.RoleID" class="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <input 
                  type="checkbox" 
                  :value="role.RoleID" 
                  v-model="roleAssignForm.roleIds" 
                  class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <div class="ml-3">
                  <div class="font-medium">{{ role.Name }}</div>
                  <div v-if="role.Description" class="text-sm text-gray-500">{{ role.Description }}</div>
                </div>
              </label>
            </div>
            <div v-if="allRoles.length === 0" class="text-center py-4 text-gray-500">
              暂无可用角色
            </div>
          </div>
          
          <div class="flex justify-end gap-3 pt-4 border-t">
            <button @click="showRoleAssign = false" class="btn-secondary">取消</button>
            <button @click="saveRoleAssignment" class="btn-primary" :disabled="saving">
              {{ saving ? '保存中...' : '保存' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import {
  getUsers,
  addUser,
  updateUser,
  deleteUser,
  setUserStatus,
  assignRoles,
  getRoles,
  getUserStatistics,
  batchDeleteUsers
} from '@/api/user'

const users = ref([])
const page = ref(1)
const pageSize = ref(10)
const totalPages = ref(1)
const keyword = ref('')
const statusFilter = ref('')
const roleFilter = ref('')
const loading = ref(false)
const saving = ref(false)

const showForm = ref(false)
const showDetail = ref(false)
const showRoleAssign = ref(false)
const isEdit = ref(false)
const selectedUser = ref(null)
const selectedUsers = ref([]) // 批量选择的用户ID数组
const statistics = ref({
  totalUsers: 0,
  activeUsers: 0,
  inactiveUsers: 0,
  newUsersToday: 0,
  newUsersThisWeek: 0,
  newUsersThisMonth: 0,
  roleDistribution: []
})

const form = ref({ 
  UserID: null, 
  Username: '', 
  Email: '', 
  PhoneNumber: '', 
  DisplayName: '',
  Bio: '',
  AvatarURL: '',
  Password: '',
  ConfirmPassword: '',
  Roles: [], 
  IsActive: true, 
  roleIds: [] 
})

const allRoles = ref([])
const roleAssignForm = ref({
  roleIds: []
})

// 计算属性
const isAllSelected = computed(() => {
  return users.value.length > 0 && selectedUsers.value.length === users.value.length
})

// 获取角色样式
function getRoleClass(roleName) {
  const classes = {
    'admin': 'bg-red-100 text-red-800',
    'author': 'bg-blue-100 text-blue-800',
    'editor': 'bg-green-100 text-green-800',
    'user': 'bg-gray-100 text-gray-800'
  }
  return classes[roleName.toLowerCase()] || 'bg-purple-100 text-purple-800'
}

// 格式化时间
function formatTime(timestamp) {
  if (!timestamp) return '-'
  return new Date(timestamp).toLocaleString('zh-CN')
}

// 头像加载错误处理
function handleAvatarError(event) {
  if (event.target) {
    event.target.style.display = 'none'
    const nextElement = event.target.nextElementSibling
    if (nextElement) {
      nextElement.style.display = 'flex'
    }
  }
}

// 获取用户统计信息
async function fetchUserStatistics() {
  try {
    const res = await getUserStatistics()
    if (res.code === 0) {
      // 映射API响应字段到前端字段
      statistics.value = {
        totalUsers: res.data.total || 0,
        activeUsers: res.data.active || 0,
        inactiveUsers: (res.data.total || 0) - (res.data.active || 0),
        newUsersToday: res.data.today || 0,
        newUsersThisWeek: 0, // 后端暂无此字段
        newUsersThisMonth: res.data.thisMonth || 0,
        roleDistribution: []
      }
    }
  } catch (error) {
    console.error('获取用户统计失败:', error)
  }
}

// 批量操作相关函数
function toggleSelectAll() {
  if (isAllSelected.value) {
    selectedUsers.value = []
  } else {
    selectedUsers.value = users.value.map(user => user.UserID)
  }
}

function clearSelection() {
  selectedUsers.value = []
}

async function batchEnable() {
  if (!selectedUsers.value.length) return
  
  if (!confirm(`确定要启用选中的 ${selectedUsers.value.length} 个用户吗？`)) return
  
  try {
    saving.value = true
    for (const userId of selectedUsers.value) {
      await setUserStatus(userId, true)
    }
    alert('批量启用成功')
    fetchUsers()
    clearSelection()
  } catch (error) {
    console.error('批量启用失败:', error)
    alert('批量启用失败')
  } finally {
    saving.value = false
  }
}

async function batchDisable() {
  if (!selectedUsers.value.length) return
  
  if (!confirm(`确定要禁用选中的 ${selectedUsers.value.length} 个用户吗？`)) return
  
  try {
    saving.value = true
    for (const userId of selectedUsers.value) {
      await setUserStatus(userId, false)
    }
    alert('批量禁用成功')
    fetchUsers()
    clearSelection()
  } catch (error) {
    console.error('批量禁用失败:', error)
    alert('批量禁用失败')
  } finally {
    saving.value = false
  }
}

async function batchDelete() {
  if (!selectedUsers.value.length) return
  
  if (!confirm(`确定要删除选中的 ${selectedUsers.value.length} 个用户吗？此操作不可恢复！`)) return
  
  try {
    saving.value = true
    const res = await batchDeleteUsers(selectedUsers.value)
    
    if (res.code === 0) {
      alert(res.message || '批量删除成功')
      fetchUsers()
      clearSelection()
    } else {
      alert(res.message || '批量删除失败')
    }
  } catch (error) {
    console.error('批量删除失败:', error)
    alert('批量删除失败')
  } finally {
    saving.value = false
  }
}

async function fetchRoles() {
  try {
    const res = await getRoles()
    if (res.code === 0) {
      allRoles.value = res.data || []
    }
  } catch (error) {
    console.error('获取角色列表失败:', error)
  }
}

function fetchUsers() {
  loading.value = true
  
  // 构建参数，只包含有值的参数
  const params = { 
    page: page.value, 
    pageSize: pageSize.value
  }
  
  // 只有当keyword不为空时才添加
  if (keyword.value && keyword.value.trim()) {
    params.keyword = keyword.value.trim()
  }
  
  // 只有当statusFilter不为空时才添加
  if (statusFilter.value && statusFilter.value !== '') {
    params.status = statusFilter.value
  }
  
  // 只有当roleFilter不为空时才添加
  if (roleFilter.value && roleFilter.value !== '') {
    params.roleId = roleFilter.value
  }
  
  console.log('[fetchUsers] 请求参数:', params)
  
  getUsers(params).then(res => {
    console.log('[fetchUsers] 原始返回:', res)
    console.log('[fetchUsers] res.code:', res?.code)
    console.log('[fetchUsers] res.data:', res?.data)
    console.log('[fetchUsers] res.data.list:', res?.data?.list)
    console.log('[fetchUsers] res.data.total:', res?.data?.total)
    
    if (res.code === 0) {
      const userList = res.data?.list || []
      const totalCount = res.data?.total || 0
      
      console.log('[fetchUsers] 解析结果 - userList:', userList)
      console.log('[fetchUsers] 解析结果 - totalCount:', totalCount)
      
      users.value = userList
      totalPages.value = Math.ceil(totalCount / pageSize.value)
      
      console.log('[fetchUsers] 最终结果 - users.value:', users.value)
      console.log('[fetchUsers] 最终结果 - totalPages.value:', totalPages.value)
    }
  }).catch(error => {
    console.error('获取用户列表失败:', error)
    users.value = []
    totalPages.value = 0
  }).finally(() => {
    loading.value = false
  })
}

function onSearch() {
  page.value = 1
  fetchUsers()
}

function resetFilters() {
  keyword.value = ''
  statusFilter.value = ''
  roleFilter.value = ''
  page.value = 1
  fetchUsers()
}

function onAdd() {
  isEdit.value = false
  form.value = {
    UserID: null,
    Username: '',
    Email: '',
    PhoneNumber: '',
    DisplayName: '',
    Bio: '',
    AvatarURL: '',
    Password: '',
    ConfirmPassword: '',
    Roles: [],
    IsActive: true,
    roleIds: []
  }
  showForm.value = true
}

function onEdit(user) {
  isEdit.value = true
  selectedUser.value = user
  const currentRoleIds = user.Roles ? user.Roles.map(r => parseInt(r.RoleID, 10)) : []
  form.value = {
    UserID: user.UserID,
    Username: user.Username,
    Email: user.Email,
    PhoneNumber: user.PhoneNumber || '',
    DisplayName: user.DisplayName || '',
    Bio: user.Bio || '',
    AvatarURL: user.AvatarURL || '',
    Password: '',
    ConfirmPassword: '',
    Roles: user.Roles || [],
    IsActive: user.IsActive,
    roleIds: currentRoleIds // Initialize roleIds from user's current roles
  }
  showForm.value = true
}

function onView(user) {
  selectedUser.value = user
  showDetail.value = true
}

async function onSave() {
  if (!form.value.Username || !form.value.Email) {
    alert('用户名和邮箱为必填项')
    return
  }
  
  if (!isEdit.value && (!form.value.Password || form.value.Password.length < 6)) {
    alert('密码至少6位')
    return
  }
  
  if (!isEdit.value && form.value.Password !== form.value.ConfirmPassword) {
    alert('两次密码输入不一致')
    return
  }
  
  try {
    saving.value = true
    
    if (isEdit.value) {
      // 编辑用户 - 使用JSON格式
      const userData = {
        username: form.value.Username,
        email: form.value.Email,
        isActive: form.value.IsActive
      }
      
      // 根据后端API文档调整字段名
      if (form.value.PhoneNumber) userData.phoneNumber = form.value.PhoneNumber
      if (form.value.DisplayName) userData.displayName = form.value.DisplayName
      if (form.value.Bio) userData.bio = form.value.Bio
      if (form.value.Password) userData.password = form.value.Password
      
      // 确保isActive是布尔值
      userData.isActive = Boolean(form.value.IsActive)
      
      const res = await updateUser(form.value.UserID, userData)
      if (res.code === 0) {
        // 用户基本信息更新成功后，处理角色分配
        // 添加短暂延迟，确保用户更新完成
        await new Promise(resolve => setTimeout(resolve, 500))
        
        try {
          // 分配角色（这会覆盖之前的角色分配）
          const roleIds = form.value.roleIds || []
          
          // 确保roleIds是有效的数组
          if (!Array.isArray(roleIds)) {
            throw new Error('roleIds必须是数组格式')
          }
          
          // 将字符串ID转换为数字ID（HTML checkbox的value总是字符串）
          const validRoleIds = roleIds
            .filter(id => id && id !== '')
            .map(id => parseInt(id, 10))
            .filter(id => !isNaN(id))
          
          const roleRes = await assignRoles(form.value.UserID, validRoleIds)
          
          if (roleRes.code === 0) {
            alert('用户更新成功，角色分配成功')
          } else {
            alert('用户基本信息更新成功，但角色分配失败：' + roleRes.message)
          }
        } catch (roleError) {
          console.error('[onSave] 角色分配失败:', roleError)
          alert('用户基本信息更新成功，但角色分配失败：' + roleError.message)
        }
        
        showForm.value = false
        fetchUsers()
        fetchUserStatistics() // 刷新统计
      } else {
        alert(res.message || '用户更新失败')
      }
    } else {
      // 新增用户
      const res = await addUser({
        username: form.value.Username,
        email: form.value.Email,
        password: form.value.Password,
        phoneNumber: form.value.PhoneNumber || undefined,
        displayName: form.value.DisplayName || undefined,
        bio: form.value.Bio || undefined
      })
      
      if (res.code === 0) {
        console.log('[onSave] 用户创建成功，响应数据:', res.data)
        // 创建用户成功后，如果有选择角色，则分配角色
        if (form.value.roleIds && form.value.roleIds.length > 0) {
          console.log('[onSave] 准备分配角色，选择的角色ID:', form.value.roleIds)
          const userId = res.data?.UserID || res.data?.id
          console.log('[onSave] 获取到的用户ID:', userId)
          
          if (userId) {
            try {
              console.log('[onSave] 开始分配角色，用户ID:', userId, '角色ID:', form.value.roleIds)
              const roleRes = await assignRoles(userId, form.value.roleIds)
              console.log('[onSave] 角色分配响应:', roleRes)
              
              if (roleRes.code === 0) {
                alert('用户创建成功，角色分配成功')
              } else {
                alert('用户创建成功，但角色分配失败：' + roleRes.message)
              }
            } catch (roleError) {
              console.error('[onSave] 角色分配失败:', roleError)
              console.error('[onSave] 角色分配错误详情:', roleError.response?.data)
              alert('用户创建成功，但角色分配失败：' + roleError.message)
            }
          } else {
            console.error('[onSave] 无法获取用户ID，响应数据结构:', res.data)
            alert('用户创建成功，但无法获取用户ID进行角色分配')
          }
        } else {
          console.log('[onSave] 未选择角色，跳过角色分配')
          alert('用户创建成功')
        }
        
        showForm.value = false
        fetchUsers()
        fetchUserStatistics() // 刷新统计
      } else {
        alert(res.message || '用户创建失败')
      }
    }
  } catch (error) {
    console.error('保存用户失败:', error)
    alert('操作失败')
  } finally {
    saving.value = false
  }
}

async function onDelete(user) {
  if (!confirm(`确定要删除用户 "${user.Username}" 吗？此操作不可恢复！`)) return
  
  try {
    const res = await deleteUser(user.UserID)
    if (res.code === 0) {
      alert('用户删除成功')
      fetchUsers()
      fetchUserStatistics() // 刷新统计
    } else {
      alert(res.message || '用户删除失败')
    }
  } catch (error) {
    console.error('删除用户失败:', error)
    alert('删除失败')
  }
}

async function onStatusChange(user) {
  const action = user.IsActive ? '禁用' : '启用'
  if (!confirm(`确定要${action}用户 "${user.Username}" 吗？`)) return
  
  try {
    const res = await setUserStatus(user.UserID, !user.IsActive)
    if (res.code === 0) {
      alert(`用户${action}成功`)
      fetchUsers()
      fetchUserStatistics() // 刷新统计
    } else {
      alert(res.message || `用户${action}失败`)
    }
  } catch (error) {
    console.error(`${action}用户失败:`, error)
    alert(`${action}失败`)
  }
}

async function onAssignRoles(user) {
  selectedUser.value = user
  // 初始化角色分配表单，设置当前用户的角色
  roleAssignForm.value.roleIds = user.Roles ? user.Roles.map(r => parseInt(r.RoleID, 10)) : []
  showRoleAssign.value = true
}

async function saveRoleAssignment() {
  if (!selectedUser.value) return
  
  try {
    saving.value = true
    
    // 将字符串ID转换为数字ID
    const roleIds = roleAssignForm.value.roleIds || []
    const validRoleIds = roleIds
      .filter(id => id && id !== '')
      .map(id => parseInt(id, 10))
      .filter(id => !isNaN(id))
    
    // 如果没有选择任何角色，提示用户
    if (validRoleIds.length === 0) {
      alert('请至少选择一个角色')
      return
    }
    
    const res = await assignRoles(selectedUser.value.UserID, validRoleIds)
    
    if (res.code === 0) {
      alert('角色分配成功')
      showRoleAssign.value = false
      fetchUsers() // 刷新用户列表
    } else {
      alert(res.message || '角色分配失败')
    }
  } catch (error) {
    console.error('[saveRoleAssignment] 分配角色失败:', error)
    alert('分配角色失败: ' + error.message)
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  // Token status check (for debugging, kept for now)
  const token = localStorage.getItem('token')
  console.log('[UserManage] 当前token状态:', {
    hasToken: !!token,
    tokenLength: token ? token.length : 0,
    tokenPreview: token ? token.substring(0, 20) + '...' : '无token',
    fullToken: token
  })
  if (!token) {
    console.warn('[UserManage] 未找到token，API调用可能会失败')
    alert('未检测到登录token，请先登录系统')
  } else {
    console.log('[UserManage] Token验证:', {
      token: token,
      isValidFormat: token.split('.').length === 3,
      tokenParts: token.split('.')
    })
  }
  fetchUsers()
  fetchRoles()
  fetchUserStatistics()
})
</script>

<style scoped>
.btn-primary {
  @apply bg-blue-500 text-white rounded px-4 py-2 hover:bg-blue-600 transition font-bold shadow flex items-center;
}
.btn-secondary {
  @apply bg-gray-500 text-white rounded px-4 py-2 hover:bg-gray-600 transition font-bold shadow flex items-center;
}
.btn {
  @apply bg-blue-500 text-white rounded px-3 py-1 hover:bg-blue-600 transition font-bold shadow;
}
.btn-sm {
  @apply px-2 py-1 text-sm;
}
.btn-info {
  @apply bg-blue-500 text-white hover:bg-blue-600;
}
.btn-success {
  @apply bg-green-500 text-white hover:bg-green-600;
}
.btn-warning {
  @apply bg-yellow-500 text-white hover:bg-yellow-600;
}
.btn-danger {
  @apply bg-red-500 text-white hover:bg-red-600;
}
.input {
  @apply border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 transition w-full;
}
th, td {
  text-align: center;
}
.btn-sm {
  @apply px-2 py-1 text-xs font-medium rounded-md transition-colors duration-200;
}

.btn-sm.btn-success {
  @apply bg-green-500 text-white hover:bg-green-600;
}

.btn-sm.btn-warning {
  @apply bg-yellow-500 text-white hover:bg-yellow-600;
}

.btn-sm.btn-danger {
  @apply bg-red-500 text-white hover:bg-red-600;
}

.btn-sm.btn-info {
  @apply bg-blue-500 text-white hover:bg-blue-600;
}

.btn-sm.btn {
  @apply bg-gray-500 text-white hover:bg-gray-600;
}
</style> 