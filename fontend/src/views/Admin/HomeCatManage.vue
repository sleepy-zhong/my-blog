<template>
  <Card class="home-cat-manage">
    <template #header>
      <div class="home-cat-header flex items-center gap-3 w-full">
        <div class="flex-1">
          <h2 class="text-lg font-semibold text-gray-800">首页猫猫管理</h2>
          <p class="mt-1 text-sm text-gray-500">管理首页漂浮猫猫图片、对应文案、排序和默认主猫。</p>
        </div>
        <button class="btn-primary" @click="onAdd">新增猫猫</button>
      </div>
    </template>

    <div class="home-cat-filter-bar">
      <input
        v-model.trim="keyword"
        type="text"
        class="input home-cat-filter-field"
        placeholder="搜索名称、展示名或文案"
      />
      <select v-model="statusFilter" class="input home-cat-status-select">
        <option value="">全部状态</option>
        <option value="active">仅启用</option>
        <option value="inactive">仅停用</option>
      </select>
    </div>

    <div v-if="loading">
      <LoadingState />
    </div>
    <template v-else>
      <div v-if="error">
        <ErrorState :message="error" @retry="fetchHomeCats" />
      </div>
      <div v-else-if="!homeCats.length">
        <EmptyState message="暂时还没有首页猫猫配置">
          <template #action>
            <button class="btn-primary" @click="onAdd">新增第一只猫猫</button>
          </template>
        </EmptyState>
      </div>
      <div v-else-if="!filteredHomeCats.length">
        <EmptyState message="没有符合筛选条件的猫猫配置" />
      </div>
      <div v-else class="cat-table-wrap overflow-x-auto">
        <table class="cat-desktop-table w-full cat-table">
          <thead>
            <tr>
              <th>排序</th>
              <th>预览</th>
              <th>名称</th>
              <th>展示名</th>
              <th>猫猫有话说</th>
              <th>状态</th>
              <th>主猫</th>
              <th>更新时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in filteredHomeCats" :key="item.HomeCatID">
              <td>
                <div class="order-box">
                  <strong>{{ item.SortOrder }}</strong>
                  <div class="order-actions">
                    <button class="btn-mini" :disabled="!canMoveItem(item.HomeCatID, -1) || sorting" @click="moveItemById(item.HomeCatID, -1)">上移</button>
                    <button class="btn-mini" :disabled="!canMoveItem(item.HomeCatID, 1) || sorting" @click="moveItemById(item.HomeCatID, 1)">下移</button>
                  </div>
                </div>
              </td>
              <td>
                <img :src="resolveImageUrl(item.ImageURL)" :alt="item.Label" class="cat-thumb" />
              </td>
              <td>{{ item.Name }}</td>
              <td>{{ item.Label }}</td>
              <td class="speech-cell">{{ item.SpeechText }}</td>
              <td>
                <button class="status-chip" :class="item.IsActive ? 'active' : 'inactive'" @click="toggleStatus(item)" :disabled="statusUpdatingId === item.HomeCatID">
                  {{ item.IsActive ? '启用中' : '已停用' }}
                </button>
              </td>
              <td>
                <span class="feature-chip" :class="{ on: item.IsFeatured }">
                  {{ item.IsFeatured ? '默认主猫' : '普通' }}
                </span>
              </td>
              <td>{{ formatTime(item.UpdatedAt) }}</td>
              <td>
                <div class="action-row">
                  <button class="btn" @click="onEdit(item)">编辑</button>
                  <button class="btn-danger" @click="onDelete(item)" :disabled="deletingId === item.HomeCatID">删除</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div class="home-cat-mobile-list mobile-card-list">
          <article v-for="item in filteredHomeCats" :key="`mobile-${item.HomeCatID}`" class="mobile-card">
            <div class="mobile-card-head">
              <strong>{{ item.Label }}</strong>
              <span class="feature-chip" :class="{ on: item.IsFeatured }">
                {{ item.IsFeatured ? '默认主猫' : '普通' }}
              </span>
            </div>

            <div class="home-cat-mobile-main">
              <img :src="resolveImageUrl(item.ImageURL)" :alt="item.Label" class="cat-thumb mobile-cat-thumb" />
              <div class="home-cat-mobile-copy">
                <strong>{{ item.Name }}</strong>
                <span>排序：{{ item.SortOrder }}</span>
                <button class="status-chip" :class="item.IsActive ? 'active' : 'inactive'" @click="toggleStatus(item)" :disabled="statusUpdatingId === item.HomeCatID">
                  {{ item.IsActive ? '启用中' : '已停用' }}
                </button>
              </div>
            </div>

            <div class="mobile-section">
              <span class="mobile-section-label">猫猫有话说</span>
              <p class="mobile-copy">{{ item.SpeechText }}</p>
            </div>

            <div class="mobile-info-grid">
              <div class="mobile-info-item">
                <span>更新时间</span>
                <strong>{{ formatTime(item.UpdatedAt) }}</strong>
              </div>
              <div class="mobile-info-item">
                <span>顺序调整</span>
                <div class="order-actions">
                  <button class="btn-mini" :disabled="!canMoveItem(item.HomeCatID, -1) || sorting" @click="moveItemById(item.HomeCatID, -1)">上移</button>
                  <button class="btn-mini" :disabled="!canMoveItem(item.HomeCatID, 1) || sorting" @click="moveItemById(item.HomeCatID, 1)">下移</button>
                </div>
              </div>
            </div>

            <div class="action-row mobile-action-row">
              <button class="btn" @click="onEdit(item)">编辑</button>
              <button class="btn-danger" @click="onDelete(item)" :disabled="deletingId === item.HomeCatID">删除</button>
            </div>
          </article>
        </div>
      </div>
    </template>
  </Card>

  <div v-if="showForm" class="home-cat-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
    <div class="form-modal home-cat-modal w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl">
      <div class="mb-6 flex items-start justify-between gap-4">
        <div>
          <h3 class="text-xl font-bold text-gray-900">{{ isEdit ? '编辑首页猫猫' : '新增首页猫猫' }}</h3>
          <p class="mt-2 text-sm text-gray-500">每张猫猫图都绑定一条专属“猫猫有话说”，并可设置排序与默认主猫。</p>
        </div>
        <button class="close-btn" @click="showForm = false">×</button>
      </div>

      <form class="home-cat-form grid gap-6 md:grid-cols-[280px_minmax(0,1fr)]" @submit.prevent="onSave">
        <div class="space-y-4">
          <div class="preview-panel">
            <img v-if="form.ImageURL" :src="resolveImageUrl(form.ImageURL)" :alt="form.Label || form.Name || '猫猫预览'" class="preview-image" />
            <div v-else class="preview-empty">上传后显示预览</div>
          </div>

          <label class="upload-panel">
            <span class="upload-title">上传猫猫图片</span>
            <span class="upload-note">支持 jpg / png / gif / webp / svg</span>
            <input type="file" accept="image/*" class="hidden" @change="onSelectImage" />
          </label>

          <div class="text-sm text-gray-500 break-all" v-if="form.ImageURL">
            当前图片：{{ form.ImageURL }}
          </div>
        </div>

        <div class="space-y-4">
          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <label class="field-label">后台名称</label>
              <input v-model.trim="form.Name" type="text" class="input w-full" placeholder="例如：橘子睡觉照" />
            </div>
            <div>
              <label class="field-label">首页展示名</label>
              <input v-model.trim="form.Label" type="text" class="input w-full" placeholder="例如：Orange-1" />
            </div>
          </div>

          <div>
            <label class="field-label">猫猫有话说</label>
            <textarea v-model.trim="form.SpeechText" class="input w-full" rows="5" placeholder="输入这张猫猫图片对应的文案"></textarea>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <label class="field-label">排序值</label>
              <input v-model.number="form.SortOrder" type="number" class="input w-full" min="0" step="1" />
            </div>
            <div class="home-cat-toggle-group flex items-center gap-4 pt-8">
              <label class="check-line">
                <input v-model="form.IsActive" type="checkbox" />
                <span>启用展示</span>
              </label>
              <label class="check-line">
                <input v-model="form.IsFeatured" type="checkbox" />
                <span>设为默认主猫</span>
              </label>
            </div>
          </div>

          <div class="home-cat-form-footer flex justify-end gap-3 border-t pt-5">
            <button type="button" class="btn-secondary" @click="showForm = false">取消</button>
            <button type="submit" class="btn-primary" :disabled="saving || uploadingImage">
              {{ saving ? '保存中...' : uploadingImage ? '图片上传中...' : '保存配置' }}
            </button>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import Card from '@/components/Card.vue'
import LoadingState from '@/components/LoadingState.vue'
import EmptyState from '@/components/EmptyState.vue'
import ErrorState from '@/components/ErrorState.vue'
import { resolveAvatarUrl } from '@/utils/avatar'
import {
  createHomeCat,
  deleteHomeCat,
  getHomeCats,
  sortHomeCats,
  updateHomeCat,
  updateHomeCatStatus,
  uploadHomeCatImage
} from '@/api/homeCats'

interface HomeCatItem {
  HomeCatID: number
  Name: string
  Label: string
  SpeechText: string
  ImageURL: string
  SortOrder: number
  IsActive: boolean
  IsFeatured: boolean
  UpdatedAt?: string
}

interface HomeCatForm {
  HomeCatID: number | null
  Name: string
  Label: string
  SpeechText: string
  ImageURL: string
  SortOrder: number
  IsActive: boolean
  IsFeatured: boolean
}

const homeCats = ref<HomeCatItem[]>([])
const loading = ref(false)
const error = ref('')
const saving = ref(false)
const sorting = ref(false)
const deletingId = ref<number | null>(null)
const statusUpdatingId = ref<number | null>(null)
const uploadingImage = ref(false)
const showForm = ref(false)
const isEdit = ref(false)
const keyword = ref('')
const statusFilter = ref('')

const filteredHomeCats = computed(() => {
  const query = keyword.value.trim().toLowerCase()

  return homeCats.value.filter((item) => {
    const matchesKeyword = !query || `${item.Name || ''} ${item.Label || ''} ${item.SpeechText || ''}`.toLowerCase().includes(query)
    const matchesStatus =
      !statusFilter.value ||
      (statusFilter.value === 'active' && item.IsActive) ||
      (statusFilter.value === 'inactive' && !item.IsActive)

    return matchesKeyword && matchesStatus
  })
})

const createDefaultForm = (): HomeCatForm => ({
  HomeCatID: null,
  Name: '',
  Label: '',
  SpeechText: '',
  ImageURL: '',
  SortOrder: nextSortOrder(),
  IsActive: true,
  IsFeatured: false
})

const form = ref<HomeCatForm>(createDefaultForm())

function unwrapList(response: any) {
  if (Array.isArray(response?.data)) return response.data
  if (Array.isArray(response?.data?.list)) return response.data.list
  if (Array.isArray(response?.list)) return response.list
  return []
}

function nextSortOrder() {
  const maxOrder = homeCats.value.reduce((max, item) => Math.max(max, Number(item.SortOrder) || 0), 0)
  return maxOrder + 10
}

function resolveImageUrl(url: string) {
  const normalizedUrl = String(url || '')
    .replace(/\s+/g, '')
    .trim()
  return resolveAvatarUrl(normalizedUrl)
}

function formatTime(value?: string) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('zh-CN', { hour12: false })
}

async function fetchHomeCats() {
  loading.value = true
  error.value = ''
  try {
    const response = await getHomeCats()
    homeCats.value = unwrapList(response)
  } catch (err) {
    console.error(err)
    error.value = '首页猫猫数据加载失败，请稍后重试。'
  } finally {
    loading.value = false
  }
}

function onAdd() {
  isEdit.value = false
  form.value = createDefaultForm()
  showForm.value = true
}

function onEdit(item: HomeCatItem) {
  isEdit.value = true
  form.value = {
    HomeCatID: item.HomeCatID,
    Name: item.Name,
    Label: item.Label,
    SpeechText: item.SpeechText,
    ImageURL: item.ImageURL,
    SortOrder: Number(item.SortOrder) || 0,
    IsActive: Boolean(item.IsActive),
    IsFeatured: Boolean(item.IsFeatured)
  }
  showForm.value = true
}

async function onSelectImage(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  try {
    uploadingImage.value = true
    const response = await uploadHomeCatImage(file)
    const imageUrl = response?.data?.imageUrl || response?.data?.data?.imageUrl
    if (!imageUrl) {
      throw new Error('图片地址返回为空')
    }
    form.value.ImageURL = imageUrl
    if (!form.value.Name) {
      form.value.Name = file.name.replace(/\.[^.]+$/, '')
    }
  } catch (err) {
    console.error(err)
    alert('图片上传失败，请稍后重试')
  } finally {
    uploadingImage.value = false
    input.value = ''
  }
}

async function onSave() {
  if (!form.value.Name.trim()) {
    alert('请填写后台名称')
    return
  }
  if (!form.value.Label.trim()) {
    alert('请填写首页展示名')
    return
  }
  if (!form.value.SpeechText.trim()) {
    alert('请填写猫猫有话说文案')
    return
  }
  if (!form.value.ImageURL.trim()) {
    alert('请先上传猫猫图片')
    return
  }

  const payload = {
    name: form.value.Name.trim(),
    label: form.value.Label.trim(),
    speechText: form.value.SpeechText.trim(),
    imageUrl: form.value.ImageURL.trim(),
    sortOrder: Number(form.value.SortOrder) || 0,
    isActive: form.value.IsActive,
    isFeatured: form.value.IsFeatured
  }

  try {
    saving.value = true
    if (isEdit.value && form.value.HomeCatID) {
      await updateHomeCat(form.value.HomeCatID, payload)
    } else {
      await createHomeCat(payload)
    }
    showForm.value = false
    await fetchHomeCats()
  } catch (err) {
    console.error(err)
    alert('保存失败，请稍后重试')
  } finally {
    saving.value = false
  }
}

async function onDelete(item: HomeCatItem) {
  if (!confirm(`确定要删除首页猫猫「${item.Name}」吗？`)) return

  try {
    deletingId.value = item.HomeCatID
    await deleteHomeCat(item.HomeCatID)
    await fetchHomeCats()
  } catch (err) {
    console.error(err)
    alert('删除失败，请稍后重试')
  } finally {
    deletingId.value = null
  }
}

async function toggleStatus(item: HomeCatItem) {
  try {
    statusUpdatingId.value = item.HomeCatID
    await updateHomeCatStatus(item.HomeCatID, !item.IsActive)
    await fetchHomeCats()
  } catch (err) {
    console.error(err)
    alert('状态更新失败，请稍后重试')
  } finally {
    statusUpdatingId.value = null
  }
}

async function moveItem(index: number, direction: -1 | 1) {
  const targetIndex = index + direction
  if (targetIndex < 0 || targetIndex >= homeCats.value.length) return

  const reordered = [...homeCats.value]
  const current = reordered[index]
  reordered[index] = reordered[targetIndex]
  reordered[targetIndex] = current

  const sortPayload = reordered.map((item, itemIndex) => ({
    id: item.HomeCatID,
    sortOrder: (itemIndex + 1) * 10
  }))

  try {
    sorting.value = true
    await sortHomeCats(sortPayload)
    await fetchHomeCats()
  } catch (err) {
    console.error(err)
    alert('排序更新失败，请稍后重试')
  } finally {
    sorting.value = false
  }
}

function getHomeCatIndex(id: number) {
  return homeCats.value.findIndex((item) => item.HomeCatID === id)
}

function canMoveItem(id: number, direction: -1 | 1) {
  const index = getHomeCatIndex(id)
  if (index < 0) return false
  const targetIndex = index + direction
  return targetIndex >= 0 && targetIndex < homeCats.value.length
}

function moveItemById(id: number, direction: -1 | 1) {
  const index = getHomeCatIndex(id)
  if (index < 0) return
  moveItem(index, direction)
}

onMounted(fetchHomeCats)
</script>

<style scoped>
.cat-table th,
.cat-table td {
  text-align: left;
  padding: 0.875rem 0.75rem;
  vertical-align: top;
}

.cat-table-wrap table {
  min-width: 1080px;
}

.home-cat-filter-bar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.home-cat-filter-field {
  flex: 1 1 auto;
  min-width: 0;
}

.home-cat-status-select {
  max-width: 180px;
}

.mobile-card-list {
  display: none;
}

.cat-table thead th {
  font-size: 0.875rem;
  font-weight: 700;
}

.cat-table tbody tr + tr td {
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.cat-thumb {
  width: 72px;
  height: 72px;
  border-radius: 1rem;
  object-fit: cover;
  background: rgba(255, 255, 255, 0.06);
}

.speech-cell {
  max-width: 320px;
  line-height: 1.7;
}

.order-box {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.order-actions {
  display: flex;
  gap: 0.375rem;
}

.btn-mini,
.btn,
.btn-primary,
.btn-secondary,
.btn-danger,
.status-chip {
  border: none;
  cursor: pointer;
  transition: transform 0.18s ease, opacity 0.18s ease, box-shadow 0.18s ease;
}

.btn-mini:hover,
.btn:hover,
.btn-primary:hover,
.btn-secondary:hover,
.btn-danger:hover,
.status-chip:hover {
  transform: translateY(-1px);
}

.btn-mini {
  padding: 0.35rem 0.65rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  color: inherit;
}

.btn {
  background: #3b82f6;
  color: #fff;
  border-radius: 0.5rem;
  padding: 0.45rem 0.8rem;
  font-weight: 700;
}

.btn-primary {
  background: #3b82f6;
  color: #fff;
  border-radius: 0.75rem;
  padding: 0.65rem 1rem;
  font-weight: 700;
  box-shadow: 0 10px 24px rgba(59, 130, 246, 0.2);
}

.btn-secondary {
  background: #6b7280;
  color: #fff;
  border-radius: 0.75rem;
  padding: 0.65rem 1rem;
  font-weight: 700;
}

.btn-danger {
  background: #ef4444;
  color: #fff;
  border-radius: 0.5rem;
  padding: 0.45rem 0.8rem;
  font-weight: 700;
}

.status-chip {
  border-radius: 999px;
  padding: 0.45rem 0.8rem;
  font-weight: 700;
}

.status-chip.active {
  background: rgba(34, 197, 94, 0.18);
  color: #16a34a;
}

.status-chip.inactive {
  background: rgba(239, 68, 68, 0.16);
  color: #dc2626;
}

.feature-chip {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 0.35rem 0.7rem;
  background: rgba(255, 255, 255, 0.08);
  color: inherit;
  font-size: 0.85rem;
  font-weight: 700;
}

.feature-chip.on {
  background: rgba(250, 204, 21, 0.18);
  color: #ca8a04;
}

.action-row {
  display: flex;
  gap: 0.5rem;
}

.mobile-card {
  border: 1px solid rgba(59, 130, 246, 0.12);
  border-radius: 1rem;
  background: #fff;
  padding: 1rem;
  box-shadow: 0 10px 24px rgba(59, 130, 246, 0.08);
}

.mobile-card-head,
.home-cat-mobile-main,
.mobile-action-row {
  display: flex;
}

.mobile-card-head {
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.home-cat-mobile-main {
  align-items: center;
  gap: 1rem;
  margin-top: 1rem;
}

.mobile-cat-thumb {
  flex-shrink: 0;
}

.home-cat-mobile-copy {
  display: grid;
  gap: 0.4rem;
}

.mobile-info-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
  margin-top: 1rem;
}

.mobile-info-item,
.mobile-section {
  padding: 0.875rem;
  border-radius: 0.875rem;
  background: #f8fafc;
}

.mobile-section {
  margin-top: 1rem;
}

.mobile-section-label,
.mobile-info-item span {
  display: block;
  margin-bottom: 0.4rem;
  color: #64748b;
  font-size: 0.75rem;
}

.mobile-copy {
  margin: 0;
  line-height: 1.7;
  color: #0f172a;
}

.mobile-action-row {
  flex-wrap: wrap;
  margin-top: 1rem;
}

.form-modal {
  max-height: min(90vh, 880px);
  overflow-y: auto;
}

.home-cat-backdrop {
  padding: 1rem;
  overflow-y: auto;
}

.preview-panel {
  display: grid;
  place-items: center;
  min-height: 260px;
  border-radius: 1.25rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px dashed rgba(255, 255, 255, 0.18);
}

.preview-image {
  width: 100%;
  max-height: 320px;
  border-radius: 1rem;
  object-fit: cover;
}

.preview-empty {
  color: #9ca3af;
}

.upload-panel {
  display: grid;
  gap: 0.375rem;
  padding: 1rem;
  border-radius: 1rem;
  background: rgba(59, 130, 246, 0.08);
  border: 1px dashed rgba(59, 130, 246, 0.3);
  cursor: pointer;
}

.upload-title {
  font-weight: 700;
}

.upload-note,
.field-label {
  font-size: 0.9rem;
  color: #6b7280;
}

.field-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
}

.check-line {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.95rem;
}

.input {
  width: 100%;
  border: 1px solid #e5e7eb;
  border-radius: 0.9rem;
  padding: 0.75rem 0.9rem;
  outline: none;
  transition: box-shadow 0.2s ease, border-color 0.2s ease;
}

.input:focus {
  border-color: rgba(59, 130, 246, 0.5);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.14);
}

.close-btn {
  border: none;
  background: transparent;
  font-size: 1.8rem;
  line-height: 1;
  cursor: pointer;
  color: #9ca3af;
}

@media (max-width: 900px) {
  .home-cat-header {
    flex-direction: column;
    align-items: stretch;
  }

  .home-cat-filter-bar {
    flex-wrap: wrap;
  }
}

@media (max-width: 768px) {
  .home-cat-modal {
    border-radius: 1.25rem;
    padding: 1rem;
  }

  .home-cat-form {
    grid-template-columns: 1fr;
  }

  .home-cat-toggle-group,
  .home-cat-form-footer {
    flex-direction: column;
    align-items: stretch;
  }

  .home-cat-form-footer > * {
    width: 100%;
  }

  .action-row,
  .order-actions {
    flex-wrap: wrap;
  }

  .cat-desktop-table {
    display: none;
  }

  .home-cat-mobile-list {
    display: grid;
    gap: 0.875rem;
  }
}

@media (max-width: 640px) {
  .home-cat-filter-bar {
    margin-bottom: 0.75rem;
  }

  .home-cat-filter-field {
    min-width: 170px;
  }

  .cat-thumb {
    width: 56px;
    height: 56px;
  }

  .preview-panel {
    min-height: 220px;
  }
}

@media (max-width: 390px) {
  .home-cat-mobile-main,
  .mobile-card-head {
    flex-direction: column;
    align-items: flex-start;
  }

  .mobile-info-grid {
    grid-template-columns: 1fr;
  }

  .mobile-action-row > * {
    flex: 1 1 100%;
  }
}
</style>
