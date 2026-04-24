<template>
  <div class="user-manage">
    <section class="hero-panel">
      <div>
        <span class="panel-kicker">Admin Control</span>
        <h1>用户与会话管理</h1>
        <p>管理员可以查看在线状态、活跃会话数，强制用户下线，并对账号状态与角色进行维护。</p>
      </div>

      <div class="hero-actions">
        <button class="btn-secondary" @click="fetchAll">刷新数据</button>
        <button class="btn-primary" @click="openCreateForm">新建用户</button>
      </div>
    </section>

    <section class="stats-grid">
      <article class="stat-card">
        <span>用户总数</span>
        <strong>{{ statistics.total }}</strong>
      </article>
      <article class="stat-card">
        <span>启用账号</span>
        <strong>{{ statistics.enabled }}</strong>
      </article>
      <article class="stat-card">
        <span>在线用户</span>
        <strong>{{ statistics.online }}</strong>
      </article>
      <article class="stat-card">
        <span>今日新增</span>
        <strong>{{ statistics.today }}</strong>
      </article>
    </section>

    <section class="filter-panel">
      <label class="field field-grow">
        <span>搜索</span>
        <input v-model.trim="keyword" class="input" type="text" placeholder="用户名、邮箱、显示名" @keyup.enter="onSearch" />
      </label>

      <label class="field">
        <span>状态</span>
        <AppSelect
          v-model="statusFilter"
          class="input"
          :options="statusFilterOptions"
          placeholder="全部"
          @change="onSearch"
        />
      </label>

      <label class="field">
        <span>角色</span>
        <AppSelect
          v-model="roleFilter"
          class="input"
          :options="roleSelectOptions"
          placeholder="全部"
          searchable
          @change="onSearch"
        />
      </label>

      <div class="toolbar">
        <button class="btn-secondary" @click="resetFilters">重置</button>
        <button class="btn-primary" @click="onSearch">查询</button>
      </div>
    </section>

    <section v-if="selectedUserIds.length" class="batch-bar">
      <span>已选择 {{ selectedUserIds.length }} 个用户</span>
      <div class="toolbar">
        <button class="btn-secondary" @click="batchSetStatus(true)">批量启用</button>
        <button class="btn-secondary" @click="batchSetStatus(false)">批量禁用</button>
        <button class="btn-danger" @click="batchDelete">批量删除</button>
      </div>
    </section>

    <section class="table-panel">
      <div v-if="loading" class="empty-state">加载中...</div>

      <template v-else>
        <div class="user-table-scroll">
          <table class="user-table desktop-table">
            <thead>
              <tr>
                <th>
                  <input type="checkbox" :checked="allSelected" @change="toggleSelectAll" />
                </th>
                <th>用户</th>
                <th>账号状态</th>
                <th>在线状态</th>
                <th>角色</th>
                <th>邮箱 / 手机号</th>
                <th>活跃会话</th>
                <th>最后活跃</th>
                <th>创建时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in users" :key="user.UserID">
                <td>
                  <input type="checkbox" :value="user.UserID" v-model="selectedUserIds" />
                </td>
                <td>
                  <div class="user-cell">
                    <img v-if="user.AvatarURL" :src="resolveAvatarUrl(user.AvatarURL)" class="avatar" @error="onAvatarError" />
                    <div v-else class="avatar fallback">{{ user.Username?.slice(0, 1)?.toUpperCase() || 'U' }}</div>
                    <div>
                      <strong>{{ user.DisplayName || user.Username }}</strong>
                      <span>@{{ user.Username }}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <span :class="['pill', user.IsActive ? 'success' : 'danger']">
                    {{ user.IsActive ? '启用' : '禁用' }}
                  </span>
                </td>
                <td>
                  <span :class="['pill', user.OnlineStatus === 'online' ? 'accent' : 'muted']">
                    {{ user.OnlineStatus === 'online' ? '在线中' : '离线中' }}
                  </span>
                </td>
                <td>
                  <div class="role-list">
                    <span v-for="role in user.Roles || []" :key="role.RoleID" class="role-pill">{{ role.Name }}</span>
                    <span v-if="!user.Roles?.length" class="role-pill muted">未分配</span>
                  </div>
                </td>
                <td>
                  <div class="meta-stack">
                    <span>{{ user.Email || '-' }}</span>
                    <span>{{ user.PhoneNumber || '-' }}</span>
                  </div>
                </td>
                <td>{{ user.ActiveSessions || 0 }}</td>
                <td>{{ formatTime(user.LastSeenAt || user.LastLogin) }}</td>
                <td>{{ formatTime(user.CreatedAt) }}</td>
                <td>
                  <div class="action-group">
                    <button class="btn-icon" @click="openDetail(user)">详情</button>
                    <button class="btn-icon" @click="openEditForm(user)">编辑</button>
                    <button class="btn-icon" @click="toggleUserStatus(user)">{{ user.IsActive ? '禁用' : '启用' }}</button>
                    <button class="btn-icon" @click="forceOffline(user)">下线</button>
                    <button class="btn-icon danger" @click="removeUser(user)">删除</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="mobile-card-list user-mobile-list">
          <article v-for="user in users" :key="`mobile-${user.UserID}`" class="mobile-card user-mobile-card">
            <div class="mobile-card-head">
              <label class="mobile-check">
                <input type="checkbox" :value="user.UserID" v-model="selectedUserIds" />
                <span>选择</span>
              </label>
              <div class="mobile-pill-row">
                <span :class="['pill', user.IsActive ? 'success' : 'danger']">
                  {{ user.IsActive ? '启用' : '禁用' }}
                </span>
                <span :class="['pill', user.OnlineStatus === 'online' ? 'accent' : 'muted']">
                  {{ user.OnlineStatus === 'online' ? '在线中' : '离线中' }}
                </span>
              </div>
            </div>

            <div class="user-cell mobile-user-head">
              <img v-if="user.AvatarURL" :src="resolveAvatarUrl(user.AvatarURL)" class="avatar" @error="onAvatarError" />
              <div v-else class="avatar fallback">{{ user.Username?.slice(0, 1)?.toUpperCase() || 'U' }}</div>
              <div>
                <strong>{{ user.DisplayName || user.Username }}</strong>
                <span>@{{ user.Username }}</span>
              </div>
            </div>

            <div class="mobile-info-grid">
              <div class="mobile-info-item">
                <span>邮箱</span>
                <strong>{{ user.Email || '-' }}</strong>
              </div>
              <div class="mobile-info-item">
                <span>手机号</span>
                <strong>{{ user.PhoneNumber || '-' }}</strong>
              </div>
              <div class="mobile-info-item">
                <span>活跃会话</span>
                <strong>{{ user.ActiveSessions || 0 }}</strong>
              </div>
              <div class="mobile-info-item">
                <span>最后活跃</span>
                <strong>{{ formatTime(user.LastSeenAt || user.LastLogin) }}</strong>
              </div>
              <div class="mobile-info-item">
                <span>创建时间</span>
                <strong>{{ formatTime(user.CreatedAt) }}</strong>
              </div>
            </div>

            <div class="mobile-section">
              <span class="mobile-section-label">角色</span>
              <div class="role-list">
                <span v-for="role in user.Roles || []" :key="`mobile-role-${user.UserID}-${role.RoleID}`" class="role-pill">{{ role.Name }}</span>
                <span v-if="!user.Roles?.length" class="role-pill muted">未分配</span>
              </div>
            </div>

            <div class="action-group mobile-action-group">
              <button class="btn-icon" @click="openDetail(user)">详情</button>
              <button class="btn-icon" @click="openEditForm(user)">编辑</button>
              <button class="btn-icon" @click="toggleUserStatus(user)">{{ user.IsActive ? '禁用' : '启用' }}</button>
              <button class="btn-icon" @click="forceOffline(user)">下线</button>
              <button class="btn-icon danger" @click="removeUser(user)">删除</button>
            </div>
          </article>
        </div>

        <div v-if="!users.length" class="empty-state">当前没有符合条件的用户</div>
      </template>
    </section>

    <section class="pager">
      <button class="btn-secondary" :disabled="page <= 1" @click="changePage(page - 1)">上一页</button>
      <span>第 {{ page }} / {{ totalPages }} 页</span>
      <button class="btn-secondary" :disabled="page >= totalPages" @click="changePage(page + 1)">下一页</button>
      <AppSelect
        v-model="pageSize"
        class="input page-size"
        :options="pageSizeOptions"
        @change="changePage(1)"
      />
    </section>

    <Teleport to="body">
      <div v-if="showForm" class="modal-mask" @click.self="closeForm">
        <div class="modal-card">
          <div class="modal-head">
            <div>
              <span class="panel-kicker">{{ editingUserId ? 'Edit User' : 'Create User' }}</span>
              <h2>{{ editingUserId ? '编辑用户' : '新建用户' }}</h2>
            </div>
            <button class="btn-icon" @click="closeForm">关闭</button>
          </div>

          <form class="form-grid" @submit.prevent="saveUser">
            <label class="field">
              <span>用户名</span>
              <input v-model.trim="form.username" class="input" type="text" :disabled="!!editingUserId" />
            </label>

            <label class="field">
              <span>显示名</span>
              <input v-model.trim="form.displayName" class="input" type="text" />
            </label>

            <label class="field">
              <span>邮箱</span>
              <input v-model.trim="form.email" class="input" type="email" />
            </label>

            <label class="field">
              <span>手机号</span>
              <input v-model.trim="form.phoneNumber" class="input" type="text" />
            </label>

            <label v-if="!editingUserId" class="field">
              <span>密码</span>
              <input v-model="form.password" class="input" type="password" autocomplete="new-password" />
            </label>

            <label v-if="!editingUserId" class="field">
              <span>确认密码</span>
              <input v-model="form.confirmPassword" class="input" type="password" autocomplete="new-password" />
            </label>

            <label class="field">
              <span>头像地址</span>
              <input v-model.trim="form.avatarURL" class="input" type="text" />
            </label>

            <label class="field">
              <span>账号状态</span>
              <AppSelect v-model="form.isActive" class="input" :options="userStatusOptions" />
            </label>

            <label class="field field-full">
              <span>角色</span>
              <div class="role-check-grid">
                <label v-for="role in roles" :key="role.RoleID" class="role-check">
                  <input :value="role.RoleID" v-model="form.roleIds" type="checkbox" />
                  <span>{{ role.Name }}</span>
                </label>
              </div>
            </label>

            <label class="field field-full">
              <span>个人简介</span>
              <textarea v-model.trim="form.bio" class="input textarea" rows="4"></textarea>
            </label>

            <div class="modal-actions">
              <button type="button" class="btn-secondary" @click="closeForm">取消</button>
              <button type="submit" class="btn-primary" :disabled="saving">{{ saving ? '保存中...' : '保存' }}</button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="detailUser" class="modal-mask" @click.self="detailUser = null">
        <div class="modal-card detail-card">
          <div class="modal-head">
            <div>
              <span class="panel-kicker">User Detail</span>
              <h2>用户详情</h2>
            </div>
            <button class="btn-icon" @click="detailUser = null">关闭</button>
          </div>

          <div class="detail-grid">
            <div class="detail-item"><span>用户名</span><strong>{{ detailUser.Username }}</strong></div>
            <div class="detail-item"><span>显示名</span><strong>{{ detailUser.DisplayName || '-' }}</strong></div>
            <div class="detail-item"><span>邮箱</span><strong>{{ detailUser.Email || '-' }}</strong></div>
            <div class="detail-item"><span>手机号</span><strong>{{ detailUser.PhoneNumber || '-' }}</strong></div>
            <div class="detail-item"><span>账号状态</span><strong>{{ detailUser.IsActive ? '启用' : '禁用' }}</strong></div>
            <div class="detail-item"><span>在线状态</span><strong>{{ detailUser.OnlineStatus === 'online' ? '在线中' : '离线中' }}</strong></div>
            <div class="detail-item"><span>活跃会话</span><strong>{{ detailUser.ActiveSessions || 0 }}</strong></div>
            <div class="detail-item"><span>最后活跃</span><strong>{{ formatTime(detailUser.LastSeenAt || detailUser.LastLogin) }}</strong></div>
            <div class="detail-item field-full"><span>角色</span><strong>{{ (detailUser.Roles || []).map(role => role.Name).join('、') || '未分配' }}</strong></div>
            <div class="detail-item field-full"><span>简介</span><strong>{{ detailUser.Bio || '-' }}</strong></div>
          </div>
        </div>
      </div>
    </Teleport>

    <StatusButton :status="statusType" :text="statusText" :show="showStatus" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import AppSelect from '@/components/AppSelect.vue'
import StatusButton from '@/components/StatusButton.vue'
import {
  addUser,
  assignRoles,
  batchDeleteUsers,
  deleteUser,
  forceOfflineUser,
  getRoles,
  getUserStatistics,
  getUsers,
  setUserStatus,
  updateUserAll,
} from '@/api/user'
import { resolveAvatarUrl } from '@/utils/avatar'

interface RoleItem {
  RoleID: number
  Name: string
  Description?: string
}

interface UserItem {
  UserID: number
  Username: string
  DisplayName?: string
  Email?: string
  PhoneNumber?: string
  AvatarURL?: string
  Bio?: string
  IsActive: boolean
  CreatedAt?: string
  LastLogin?: string
  LastSeenAt?: string
  OnlineStatus?: 'online' | 'offline'
  ActiveSessions?: number
  Roles?: RoleItem[]
}

const loading = ref(false)
const saving = ref(false)
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const keyword = ref('')
const statusFilter = ref('')
const roleFilter = ref('')
const users = ref<UserItem[]>([])
const statusFilterOptions = [
  { label: '全部', value: '' },
  { label: '启用', value: 'active' },
  { label: '禁用', value: 'inactive' }
]
const pageSizeOptions = [
  { label: '10', value: 10 },
  { label: '20', value: 20 },
  { label: '50', value: 50 }
]
const userStatusOptions = [
  { label: '启用', value: true },
  { label: '禁用', value: false }
]
const roleSelectOptions = computed(() => [
  { label: '全部', value: '' },
  ...roles.value.map((role) => ({
    label: role.Name,
    value: String(role.RoleID)
  }))
])
const roles = ref<RoleItem[]>([])
const selectedUserIds = ref<number[]>([])
const showForm = ref(false)
const editingUserId = ref<number | null>(null)
const detailUser = ref<UserItem | null>(null)

const statistics = ref({
  total: 0,
  enabled: 0,
  online: 0,
  today: 0,
})

const form = ref({
  username: '',
  displayName: '',
  email: '',
  phoneNumber: '',
  password: '',
  confirmPassword: '',
  avatarURL: '',
  bio: '',
  isActive: true,
  roleIds: [] as number[],
})

const showStatus = ref(false)
const statusType = ref<'success' | 'error' | 'loading'>('success')
const statusText = ref('')

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))
const allSelected = computed(() => users.value.length > 0 && users.value.every(user => selectedUserIds.value.includes(user.UserID)))

function showStatusMsg(type: 'success' | 'error' | 'loading', text: string) {
  statusType.value = type
  statusText.value = text
  showStatus.value = true
  if (type !== 'loading') {
    window.setTimeout(() => {
      showStatus.value = false
    }, 2200)
  }
}

function formatTime(value?: string) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleString()
}

function onAvatarError(event: Event) {
  const target = event.target as HTMLImageElement | null
  if (!target) return
  target.style.display = 'none'
}

function resetForm() {
  form.value = {
    username: '',
    displayName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    avatarURL: '',
    bio: '',
    isActive: true,
    roleIds: [],
  }
}

function closeForm() {
  showForm.value = false
  editingUserId.value = null
  resetForm()
}

function openCreateForm() {
  editingUserId.value = null
  resetForm()
  showForm.value = true
}

function openEditForm(user: UserItem) {
  editingUserId.value = user.UserID
  form.value = {
    username: user.Username,
    displayName: user.DisplayName || '',
    email: user.Email || '',
    phoneNumber: user.PhoneNumber || '',
    password: '',
    confirmPassword: '',
    avatarURL: user.AvatarURL || '',
    bio: user.Bio || '',
    isActive: !!user.IsActive,
    roleIds: (user.Roles || []).map(role => Number(role.RoleID)),
  }
  showForm.value = true
}

function openDetail(user: UserItem) {
  detailUser.value = user
}

async function fetchUsersData() {
  loading.value = true
  try {
    const res = await getUsers({
      page: page.value,
      pageSize: pageSize.value,
      keyword: keyword.value || undefined,
      status: statusFilter.value || undefined,
      roleId: roleFilter.value || undefined,
    })

    const payload = res?.data || {}
    users.value = payload.list || []
    total.value = Number(payload.total || 0)
    selectedUserIds.value = selectedUserIds.value.filter(id => users.value.some(user => user.UserID === id))
  } catch (error: any) {
    showStatusMsg('error', error?.response?.data?.message || '获取用户列表失败')
  } finally {
    loading.value = false
  }
}

async function fetchRolesData() {
  try {
    const res = await getRoles()
    roles.value = res?.data || []
  } catch (error: any) {
    showStatusMsg('error', error?.response?.data?.message || '获取角色列表失败')
  }
}

async function fetchStatisticsData() {
  try {
    const res = await getUserStatistics()
    const data = res?.data || {}
    statistics.value = {
      total: Number(data.total || 0),
      enabled: Number(data.enabled ?? data.active ?? 0),
      online: Number(data.online || 0),
      today: Number(data.today || 0),
    }
  } catch (error: any) {
    showStatusMsg('error', error?.response?.data?.message || '获取统计信息失败')
  }
}

async function fetchAll() {
  await Promise.all([fetchUsersData(), fetchRolesData(), fetchStatisticsData()])
}

async function onSearch() {
  page.value = 1
  await fetchUsersData()
}

function resetFilters() {
  keyword.value = ''
  statusFilter.value = ''
  roleFilter.value = ''
  onSearch()
}

function changePage(nextPage: number) {
  page.value = Math.min(Math.max(1, nextPage), totalPages.value)
  fetchUsersData()
}

function toggleSelectAll(event: Event) {
  const checked = (event.target as HTMLInputElement).checked
  selectedUserIds.value = checked ? users.value.map(user => user.UserID) : []
}

async function saveUser() {
  if (saving.value) return
  if (!form.value.username.trim() || !form.value.email.trim()) {
    showStatusMsg('error', '用户名和邮箱不能为空')
    return
  }
  if (!editingUserId.value) {
    if (!form.value.password) {
      showStatusMsg('error', '密码不能为空')
      return
    }
    if (form.value.password.length < 6) {
      showStatusMsg('error', '密码至少 6 位')
      return
    }
    if (form.value.password !== form.value.confirmPassword) {
      showStatusMsg('error', '两次输入的密码不一致')
      return
    }
  }
  if (!form.value.roleIds.length) {
    showStatusMsg('error', '至少选择一个角色')
    return
  }

  saving.value = true
  try {
    const payload = {
      username: form.value.username,
      displayName: form.value.displayName || undefined,
      email: form.value.email,
      phoneNumber: form.value.phoneNumber || undefined,
      avatarURL: form.value.avatarURL || undefined,
      bio: form.value.bio || undefined,
      isActive: form.value.isActive,
      roleIds: form.value.roleIds,
      ...(editingUserId.value ? {} : { password: form.value.password }),
    }

    const res = editingUserId.value
      ? await updateUserAll(editingUserId.value, payload)
      : await addUser(payload)

    if (res.code !== 0) {
      showStatusMsg('error', res.message || '保存失败')
      return
    }

    if (editingUserId.value) {
      await assignRoles(editingUserId.value, form.value.roleIds)
    }

    showStatusMsg('success', res.message || '保存成功')
    closeForm()
    await fetchAll()
  } catch (error: any) {
    showStatusMsg('error', error?.response?.data?.message || '保存失败')
  } finally {
    saving.value = false
  }
}

async function toggleUserStatus(user: UserItem) {
  try {
    const res = await setUserStatus(user.UserID, !user.IsActive)
    if (res.code !== 0) {
      showStatusMsg('error', res.message || '状态更新失败')
      return
    }
    showStatusMsg('success', res.message || '状态已更新')
    await fetchAll()
  } catch (error: any) {
    showStatusMsg('error', error?.response?.data?.message || '状态更新失败')
  }
}

async function forceOffline(user: UserItem) {
  try {
    const res = await forceOfflineUser(user.UserID)
    if (res.code !== 0) {
      showStatusMsg('error', res.message || '强制下线失败')
      return
    }
    showStatusMsg('success', res.message || '已强制下线')
    await fetchAll()
  } catch (error: any) {
    showStatusMsg('error', error?.response?.data?.message || '强制下线失败')
  }
}

async function removeUser(user: UserItem) {
  if (!window.confirm(`确定删除用户 ${user.Username} 吗？`)) return

  try {
    const res = await deleteUser(user.UserID)
    if (res.code !== 0) {
      showStatusMsg('error', res.message || '删除失败')
      return
    }
    showStatusMsg('success', res.message || '删除成功')
    await fetchAll()
  } catch (error: any) {
    showStatusMsg('error', error?.response?.data?.message || '删除失败')
  }
}

async function batchDelete() {
  if (!selectedUserIds.value.length) return
  if (!window.confirm(`确定删除选中的 ${selectedUserIds.value.length} 个用户吗？`)) return

  try {
    const res = await batchDeleteUsers(selectedUserIds.value)
    if (res.code !== 0) {
      showStatusMsg('error', res.message || '批量删除失败')
      return
    }
    selectedUserIds.value = []
    showStatusMsg('success', res.message || '批量删除成功')
    await fetchAll()
  } catch (error: any) {
    showStatusMsg('error', error?.response?.data?.message || '批量删除失败')
  }
}

async function batchSetStatus(isActive: boolean) {
  if (!selectedUserIds.value.length) return

  try {
    await Promise.all(selectedUserIds.value.map(id => setUserStatus(id, isActive)))
    showStatusMsg('success', isActive ? '批量启用成功' : '批量禁用成功')
    await fetchAll()
  } catch (error: any) {
    showStatusMsg('error', error?.response?.data?.message || '批量操作失败')
  }
}

onMounted(() => {
  fetchAll()
})
</script>

<style scoped>
.user-manage {
  --admin-surface-main: color-mix(in srgb, var(--panel-strong) 88%, transparent);
  --admin-surface-card: color-mix(in srgb, var(--panel) 74%, white);
  --admin-surface-card-strong: color-mix(in srgb, var(--panel-strong) 82%, white);
  --admin-surface-input: color-mix(in srgb, var(--panel) 70%, white);
  --admin-surface-button: color-mix(in srgb, var(--panel) 62%, white);
  --admin-surface-button-hover: color-mix(in srgb, var(--accent) 10%, white);
  --admin-surface-danger: color-mix(in srgb, var(--danger) 18%, white);
  --admin-surface-success: color-mix(in srgb, var(--success) 18%, white);
  --admin-surface-accent: color-mix(in srgb, var(--accent) 16%, white);
  --admin-surface-muted: color-mix(in srgb, var(--panel) 54%, white);
  --admin-border: color-mix(in srgb, var(--line) 56%, rgba(255, 255, 255, 0.14));
  --admin-border-strong: color-mix(in srgb, var(--line-strong) 54%, rgba(255, 255, 255, 0.2));
  --admin-shadow: 0 20px 60px color-mix(in srgb, var(--glow) 16%, rgba(0, 0, 0, 0.16));
  --admin-button-primary-text: color-mix(in srgb, var(--text) 88%, white);
  width: 100%;
  padding: 24px 0 40px;
  color: var(--text);
}

.user-manage :deep(.app-select__trigger),
.user-manage :deep(.app-select__menu) {
  background: var(--admin-surface-input);
  border-color: var(--admin-border);
  color: var(--text);
}

.user-manage :deep(.app-select__trigger:hover),
.user-manage :deep(.app-select__trigger.is-open) {
  border-color: color-mix(in srgb, var(--accent) 40%, var(--admin-border));
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 12%, transparent);
}

.user-manage :deep(.app-select__option) {
  color: var(--text);
}

.user-manage :deep(.app-select__option:hover),
.user-manage :deep(.app-select__option.is-active) {
  background: color-mix(in srgb, var(--accent) 14%, white);
}

.hero-panel,
.stats-grid,
.filter-panel,
.batch-bar,
.table-panel,
.pager,
.modal-card {
  border: 1px solid var(--admin-border);
  background: var(--admin-surface-main);
  backdrop-filter: blur(18px);
  box-shadow: var(--admin-shadow);
}

.hero-panel,
.filter-panel,
.batch-bar,
.table-panel,
.pager {
  border-radius: 24px;
  padding: 24px;
}

.hero-panel,
.filter-panel,
.batch-bar,
.pager {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 16px;
}

.hero-panel h1 {
  margin: 14px 0 10px;
  font-size: 34px;
}

.hero-panel p {
  margin: 0;
  max-width: 760px;
  color: var(--muted);
  line-height: 1.8;
}

.panel-kicker {
  display: inline-flex;
  padding: 7px 12px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--accent) 14%, white);
  color: var(--accent);
  font-size: 12px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.hero-actions,
.toolbar,
.action-group,
.modal-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin: 18px 0;
  padding: 0;
  background: transparent;
  border: none;
  box-shadow: none;
}

.stat-card {
  padding: 22px;
  border-radius: 20px;
  border: 1px solid var(--admin-border);
  background: var(--admin-surface-card);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.18);
}

.stat-card span {
  display: block;
  color: var(--muted);
  font-size: 14px;
}

.stat-card strong {
  display: block;
  margin-top: 12px;
  font-size: 34px;
}

.filter-panel,
.batch-bar,
.pager {
  margin-top: 18px;
}

.field {
  display: grid;
  gap: 8px;
  min-width: 180px;
}

.field span {
  font-size: 14px;
  color: var(--muted);
}

.field-grow {
  flex: 1;
}

.input,
.textarea {
  min-height: 48px;
  width: 100%;
  padding: 0 14px;
  border-radius: 16px;
  border: 1px solid var(--admin-border);
  background: var(--admin-surface-input);
  color: var(--text);
  transition: border-color 180ms ease, box-shadow 180ms ease, background 180ms ease;
}

.textarea {
  min-height: 120px;
  padding: 14px;
  resize: vertical;
}

.input::placeholder,
.textarea::placeholder {
  color: color-mix(in srgb, var(--muted) 88%, white);
}

.input:focus,
.textarea:focus {
  outline: none;
  border-color: color-mix(in srgb, var(--accent) 42%, var(--admin-border));
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 12%, transparent);
}

.btn-primary,
.btn-secondary,
.btn-danger,
.btn-icon {
  min-height: 44px;
  padding: 0 18px;
  border: none;
  border-radius: 14px;
  cursor: pointer;
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.btn-primary {
  background: linear-gradient(135deg, rgba(120, 163, 255, 0.92), rgba(255, 123, 176, 0.78));
  color: var(--admin-button-primary-text);
  box-shadow: 0 14px 32px color-mix(in srgb, var(--accent) 18%, transparent);
}

.btn-secondary,
.btn-icon {
  background: var(--admin-surface-button);
  color: var(--text);
  border: 1px solid var(--admin-border);
}

.btn-danger,
.btn-icon.danger {
  background: var(--admin-surface-danger);
  color: color-mix(in srgb, var(--danger) 82%, white);
  border: 1px solid color-mix(in srgb, var(--danger) 28%, white);
}

.btn-primary:disabled,
.btn-secondary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary:hover,
.btn-secondary:hover,
.btn-danger:hover,
.btn-icon:hover {
  transform: translateY(-1px);
}

.btn-secondary:hover,
.btn-icon:hover {
  background: var(--admin-surface-button-hover);
  border-color: color-mix(in srgb, var(--accent) 22%, var(--admin-border));
}

.table-panel {
  margin-top: 18px;
  overflow: auto;
}

.user-table {
  width: 100%;
  border-collapse: collapse;
}

.user-table th,
.user-table td {
  padding: 14px 12px;
  border-bottom: 1px solid var(--admin-border);
  text-align: left;
  vertical-align: top;
}

.user-table th {
  color: var(--muted);
  font-size: 13px;
  font-weight: 600;
}

.user-cell {
  display: flex;
  gap: 12px;
  align-items: center;
}

.user-cell strong,
.meta-stack span,
.detail-item strong {
  display: block;
}

.user-cell span,
.meta-stack span:first-child + span {
  color: var(--muted);
  font-size: 13px;
}

.avatar {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid var(--admin-border-strong);
}

.avatar.fallback {
  display: grid;
  place-items: center;
  background: color-mix(in srgb, var(--accent) 18%, white);
  color: var(--text);
  font-weight: 700;
}

.pill,
.role-pill {
  display: inline-flex;
  align-items: center;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 12px;
}

.pill.success {
  background: var(--admin-surface-success);
  color: var(--success);
}

.pill.danger {
  background: var(--admin-surface-danger);
  color: var(--danger);
}

.pill.accent {
  background: var(--admin-surface-accent);
  color: var(--accent);
}

.pill.muted,
.role-pill.muted {
  background: var(--admin-surface-muted);
  color: var(--muted);
}

.role-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.role-pill {
  background: color-mix(in srgb, var(--accent-3) 12%, white);
  color: var(--accent-3);
}

.meta-stack {
  display: grid;
  gap: 4px;
}

.empty-state {
  padding: 28px 0;
  text-align: center;
  color: var(--muted);
}

.mobile-card-list {
  display: none;
}

.mobile-card {
  border: 1px solid var(--admin-border);
  border-radius: 20px;
  background: var(--admin-surface-card);
  padding: 16px;
}

.mobile-card-head,
.mobile-pill-row,
.mobile-check,
.mobile-action-group {
  display: flex;
}

.mobile-card-head,
.mobile-action-group {
  justify-content: space-between;
  gap: 12px;
}

.mobile-pill-row,
.mobile-action-group {
  flex-wrap: wrap;
}

.mobile-check {
  align-items: center;
  gap: 8px;
  color: var(--muted);
  font-size: 13px;
}

.mobile-user-head {
  margin-top: 16px;
}

.mobile-info-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 16px;
}

.mobile-info-item,
.mobile-section {
  padding: 12px;
  border-radius: 16px;
  background: var(--admin-surface-card-strong);
}

.mobile-info-item span,
.mobile-section-label {
  display: block;
  margin-bottom: 8px;
  color: var(--muted);
  font-size: 12px;
}

.mobile-section {
  margin-top: 16px;
}

.mobile-action-group {
  margin-top: 16px;
}

.page-size {
  width: 88px;
}

.modal-mask {
  position: fixed;
  inset: 0;
  z-index: 70;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(2, 6, 18, 0.58);
}

.modal-card {
  width: min(880px, 100%);
  border-radius: 28px;
  padding: 24px;
}

.detail-card {
  width: min(720px, 100%);
}

.modal-head {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

.modal-head h2 {
  margin: 12px 0 0;
}

.form-grid,
.detail-grid {
  display: grid;
  gap: 16px;
}

.form-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.field-full {
  grid-column: 1 / -1;
}

.role-check-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.role-check {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 42px;
  padding: 0 12px;
  border-radius: 14px;
  background: var(--admin-surface-card);
  border: 1px solid var(--admin-border);
}

.detail-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.detail-item {
  padding: 16px;
  border-radius: 18px;
  background: var(--admin-surface-card-strong);
  border: 1px solid var(--admin-border);
}

.detail-item span {
  display: block;
  margin-bottom: 10px;
  color: var(--muted);
  font-size: 13px;
}

@media (max-width: 960px) {
  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .hero-panel,
  .filter-panel,
  .batch-bar,
  .pager {
    flex-direction: column;
    align-items: stretch;
  }

  .form-grid,
  .detail-grid,
  .role-check-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .hero-panel h1 {
    font-size: 28px;
  }

  .hero-panel,
  .filter-panel,
  .batch-bar,
  .table-panel,
  .pager {
    padding: 18px;
  }

  .stat-card {
    padding: 16px;
    border-radius: 18px;
  }

  .stat-card strong {
    font-size: 28px;
  }
}

@media (max-width: 640px) {
  .user-manage {
    padding-top: 6px;
  }

  .hero-panel,
  .filter-panel,
  .batch-bar,
  .pager {
    padding: 8px;
    border-radius: 14px;
  }

  .stats-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 6px;
    margin: 8px 0;
  }

  .table-panel {
    padding: 8px;
    border-radius: 14px;
    margin-top: 10px;
  }

  .hero-panel p {
    display: none;
  }

  .hero-panel h1 {
    margin: 4px 0 0;
    font-size: 18px;
    line-height: 1.3;
  }

  .hero-actions {
    gap: 6px;
  }

  .filter-panel {
    display: flex !important;
    flex-direction: row !important;
    flex-wrap: nowrap;
    overflow-x: auto;
    align-items: center;
    gap: 6px;
    scrollbar-width: thin;
  }

  .field {
    display: flex;
    flex: 0 0 auto;
    align-items: center;
    gap: 6px;
    min-width: 132px;
  }

  .field span {
    display: none;
  }

  .toolbar {
    width: auto;
    gap: 6px;
    flex: 0 0 auto;
    flex-wrap: nowrap;
  }

  .user-table-scroll {
    display: block !important;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .user-table {
    min-width: 980px;
  }

  .user-table th,
  .user-table td {
    padding: 6px 6px;
    font-size: 11px;
    line-height: 1.15;
    vertical-align: middle;
  }

  .user-table th {
    font-size: 10px;
  }

  .mobile-card-list {
    display: none !important;
  }

  .stat-card {
    min-height: 52px;
    padding: 7px 6px;
    border-radius: 12px;
  }

  .stat-card span {
    font-size: 10px;
  }

  .stat-card strong {
    margin-top: 4px;
    font-size: 16px;
  }

  .hero-actions,
  .toolbar,
  .modal-actions {
    width: 100%;
  }

  .hero-actions > *,
  .toolbar > *,
  .modal-actions > * {
    flex: 0 0 auto;
    min-width: 72px;
  }

  .modal-mask {
    padding: 12px;
  }

  .modal-card {
    padding: 18px;
    border-radius: 24px;
    max-height: calc(100vh - 24px);
    overflow: auto;
  }

  .input,
  .textarea {
    min-height: 34px;
    padding: 0 9px;
    border-radius: 12px;
    font-size: 12px;
  }

  .textarea {
    min-height: 92px;
    padding: 10px;
  }

  .btn-primary,
  .btn-secondary,
  .btn-danger,
  .btn-icon {
    min-height: 28px;
    padding: 0 8px;
    border-radius: 12px;
    font-size: 10px;
  }

  .user-cell {
    gap: 6px;
    align-items: center;
  }

  .user-cell strong {
    font-size: 12px;
    line-height: 1.1;
  }

  .user-cell span,
  .meta-stack span:first-child + span {
    font-size: 10px;
  }

  .avatar {
    width: 28px;
    height: 28px;
  }

  .pill,
  .role-pill {
    padding: 3px 7px;
    font-size: 10px;
  }

  .action-group {
    gap: 4px;
    flex-wrap: nowrap;
    white-space: nowrap;
  }

  .role-list {
    flex-wrap: nowrap;
    gap: 4px;
    overflow: hidden;
  }

  .meta-stack {
    gap: 2px;
  }

  .user-table td:nth-child(6),
  .user-table td:nth-child(7),
  .user-table td:nth-child(8),
  .user-table td:nth-child(9),
  .user-table td:nth-child(10),
  .user-table th:nth-child(6),
  .user-table th:nth-child(7),
  .user-table th:nth-child(8),
  .user-table th:nth-child(9),
  .user-table th:nth-child(10) {
    font-size: 10px;
  }
}

@media (max-width: 390px) {
  .hero-panel h1 {
    font-size: 16px;
  }

  .panel-kicker {
    font-size: 9px;
  }

  .stat-card strong {
    font-size: 14px;
  }

  .mobile-card {
    padding: 12px;
    border-radius: 16px;
  }

  .stats-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .mobile-info-grid {
    grid-template-columns: 1fr;
  }

  .mobile-action-group > * {
    flex: 1 1 100%;
  }

  .avatar {
    width: 22px;
    height: 22px;
  }
}
</style>
