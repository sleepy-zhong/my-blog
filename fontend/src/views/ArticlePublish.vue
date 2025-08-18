<template>
  <div class="w-full px-6 py-6">
    <Card>
      <template #header>
        <div class="flex items-center justify-between w-full">
          <h2 class="text-xl font-semibold text-gray-800">{{ isEdit ? '编辑文章' : '发布文章' }}</h2>
          <button @click="router.back()" class="text-gray-400 hover:text-blue-500 transition-colors">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
      </template>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- 左侧表单区域 -->
        <div class="lg:col-span-1 space-y-6">
          <!-- 基本信息 -->
          <Card>
            <template #header>
              <h3 class="text-base font-semibold text-gray-800">基本信息</h3>
            </template>
            
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  文章标题 <span class="text-red-500">*</span>
                </label>
                <input 
                  v-model="title" 
                  class="input" 
                  placeholder="请输入文章标题（5~100字）"
                  :class="{ 'border-red-500': validationErrors.title }"
                  @blur="validateField('title')"
                />
                <div v-if="validationErrors.title" class="text-red-500 text-xs mt-1">{{ validationErrors.title }}</div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  文章摘要 <span class="text-red-500">*</span>
                </label>
                <textarea 
                  v-model="meta.summary" 
                  class="input" 
                  rows="3" 
                  placeholder="请输入摘要，帮助读者快速了解内容"
                  :class="{ 'border-red-500': validationErrors.summary }"
                  @blur="validateField('summary')"
                />
                <div v-if="validationErrors.summary" class="text-red-500 text-xs mt-1">{{ validationErrors.summary }}</div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">封面图片</label>
                <div class="flex items-center gap-3">
                  <input 
                    type="file" 
                    @change="onCoverChange" 
                    accept="image/*" 
                    class="hidden" 
                    ref="coverInput"
                  />
                  <button 
                    @click="$refs.coverInput.click()" 
                    class="btn-secondary text-sm px-3 py-2"
                  >
                    选择图片
                  </button>
                  <div v-if="meta.cover" class="w-16 h-16 bg-gray-100 rounded border overflow-hidden">
                    <img :src="meta.cover" alt="封面预览" class="w-full h-full object-cover" />
                  </div>
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">可见性</label>
                <select v-model="meta.visibility" class="input">
                  <option value="public">公开</option>
                  <option value="private">私密</option>
                  <option value="password">密码保护</option>
                </select>
              </div>
            </div>
          </Card>

          <!-- 分类和标签 -->
          <Card>
            <template #header>
              <h3 class="text-base font-semibold text-gray-800">分类和标签</h3>
            </template>
            
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  文章分类 <span class="text-red-500">*</span>
                </label>
                <div class="flex items-center gap-2">
                  <select 
                    v-model="selectedCategory" 
                    @change="onCategoryChange"
                    class="input flex-1"
                    :class="{ 'border-red-500': validationErrors.categories }"
                  >
                    <option value="">选择分类</option>
                    <option v-for="cat in categoryOptions" :key="cat.CategoryID" :value="cat.CategoryID">
                      {{ cat.Name }}
                    </option>
                  </select>
                  <button @click="showAddCategory = true" class="btn-secondary text-sm px-3 py-2">新增</button>
                </div>
                <div class="flex flex-wrap gap-2 mt-2">
                  <span 
                    v-for="catId in meta.categories" 
                    :key="catId" 
                    class="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs"
                  >
                    {{ getCategoryName(catId) }}
                    <button @click="removeCategory(catId)" class="text-blue-600 hover:text-blue-800">×</button>
                  </span>
                </div>
                <div v-if="validationErrors.categories" class="text-red-500 text-xs mt-1">{{ validationErrors.categories }}</div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  文章标签 <span class="text-red-500">*</span>
                </label>
                <div class="flex items-center gap-2">
                  <select 
                    v-model="selectedTag" 
                    @change="onTagChange"
                    class="input flex-1"
                    :class="{ 'border-red-500': validationErrors.tags }"
                  >
                    <option value="">选择标签</option>
                    <option v-for="tag in tagOptions" :key="tag.TagID" :value="tag.TagID">
                      {{ tag.Name }}
                    </option>
                  </select>
                  <button @click="showAddTag = true" class="btn-secondary text-sm px-3 py-2">新增</button>
                </div>
                <div class="flex flex-wrap gap-2 mt-2">
                  <span 
                    v-for="tagId in meta.tags" 
                    :key="tagId" 
                    class="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs"
                  >
                    {{ getTagName(tagId) }}
                    <button @click="removeTag(tagId)" class="text-green-600 hover:text-green-800">×</button>
                  </span>
                </div>
                <div v-if="validationErrors.tags" class="text-red-500 text-xs mt-1">{{ validationErrors.tags }}</div>
              </div>
            </div>
          </Card>

          <!-- 发布设置 -->
          <Card>
            <template #header>
              <h3 class="text-base font-semibold text-gray-800">发布设置</h3>
            </template>
            
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">定时发布</label>
                <input 
                  v-model="meta.schedule" 
                  type="datetime-local" 
                  class="input"
                  :min="new Date().toISOString().slice(0, 16)"
                />
                <div class="text-xs text-gray-500 mt-1">留空则立即发布</div>
              </div>
            </div>
          </Card>
        </div>

        <!-- 右侧编辑器区域 -->
        <div class="lg:col-span-2">
          <Card class="h-full min-h-[600px]">
            <template #header>
              <h3 class="text-base font-semibold text-gray-800">文章内容</h3>
            </template>
            
            <div class="h-full min-h-[500px]">
              <Suspense>
                <template #default>
                  <VditorEditor 
                    v-model:content="content" 
                    class="h-full min-h-[500px]"
                    :editor-token="editorToken"
                    :ensure-post-id="ensurePostId"
                    @notify="onNotify"
                  />
                </template>
                <template #fallback>
                  <LoadingState />
                </template>
              </Suspense>
            </div>
          </Card>
        </div>
      </div>

      <!-- 底部操作栏 -->
      <template #footer>
        <div class="flex justify-end gap-3">
          <button 
            @click="onSaveDraft" 
            :disabled="!title || saving" 
            class="btn-secondary"
          >
            {{ saving && currentAction === 'draft' ? '保存中...' : '保存草稿' }}
          </button>
          <button 
            @click="onSchedule" 
            :disabled="!canSubmit || saving" 
            class="btn-warning"
            v-if="meta.schedule"
          >
            {{ saving && currentAction === 'schedule' ? '设置中...' : '定时发布' }}
          </button>
          <button 
            @click="onPublish" 
            :disabled="!canSubmit || saving" 
            class="btn-primary"
          >
            {{ saving && currentAction === 'publish' ? '发布中...' : (isEdit ? '更新文章' : '发布文章') }}
          </button>
        </div>
      </template>
    </Card>

    <!-- 新增分类弹窗 -->
    <div v-if="showAddCategory" class="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <Card class="w-96">
        <template #header>
          <div class="flex items-center justify-between w-full">
            <h3 class="text-lg font-semibold">新增分类</h3>
            <button @click="showAddCategory = false" class="text-gray-400 hover:text-gray-600">×</button>
          </div>
        </template>
        
        <div class="space-y-4">
          <input v-model="newCategoryName" class="input" placeholder="请输入分类名称" />
        </div>
        
        <template #footer>
          <div class="flex justify-end gap-2">
            <button class="btn-secondary" @click="showAddCategory = false">取消</button>
            <button class="btn-primary" @click="handleAddCategory" :disabled="!newCategoryName">保存</button>
          </div>
        </template>
      </Card>
    </div>

    <!-- 新增标签弹窗 -->
    <div v-if="showAddTag" class="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <Card class="w-96">
        <template #header>
          <div class="flex items-center justify-between w-full">
            <h3 class="text-lg font-semibold">新增标签</h3>
            <button @click="showAddTag = false" class="text-gray-400 hover:text-gray-600">×</button>
          </div>
        </template>
        
        <div class="space-y-4">
          <input v-model="newTagName" class="input" placeholder="请输入标签名称" />
        </div>
        
        <template #footer>
          <div class="flex justify-end gap-2">
            <button class="btn-secondary" @click="showAddTag = false">取消</button>
            <button class="btn-primary" @click="handleAddTag" :disabled="!newTagName">保存</button>
          </div>
        </template>
      </Card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, defineAsyncComponent } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useMessageStore } from '@/store/user'

// 组件导入
import Card from '@/components/Card.vue'
import LoadingState from '@/components/LoadingState.vue'
const VditorEditor = defineAsyncComponent(() => import('@/components/VditorEditor.vue'))

// API导入
import { getTags, addTag } from '@/api/tag'
import { getCategories, addCategory } from '@/api/category'
import { createArticle, updateArticle, getArticle } from '@/api/article'
// 移除全局编辑器 Token 请求头注入，避免更新文章时误参与附件同步

const router = useRouter()
const { t } = useI18n()
const messageStore = useMessageStore()

// 表单数据
const title = ref('')
const content = ref('')
// 已移除 contentJSON，后端不再支持结构化字段
const meta = ref({
  tags: [],
  categories: [],
  summary: '',
  cover: '',
  visibility: 'public',
  schedule: null,
})

// 选项数据
const tagOptions = ref([])
const categoryOptions = ref([])
const selectedTag = ref('')
const selectedCategory = ref('')

// 状态管理
const saving = ref(false)
const currentAction = ref('')
const showValidation = ref(false)
const isEdit = ref(false)
const editArticleId = ref(null)
const editorToken = ref('')

// 验证错误状态
const validationErrors = ref({
  title: '',
  summary: '',
  categories: '',
  tags: '',
  content: ''
})

// 弹窗状态
const showAddCategory = ref(false)
const showAddTag = ref(false)
const newCategoryName = ref('')
const newTagName = ref('')

// 计算属性
const canSubmit = computed(() => {
  return title.value && 
         meta.value.summary && 
         meta.value.tags.length && 
         meta.value.categories.length &&
         content.value.trim().length > 0
})

// 验证函数
function validateForm() {
  validationErrors.value = {
    title: '',
    summary: '',
    categories: '',
    tags: '',
    content: ''
  }
  
  let isValid = true
  
  if (!title.value || title.value.trim().length < 5) {
    validationErrors.value.title = '标题至少需要5个字符'
    isValid = false
  } else if (title.value.trim().length > 100) {
    validationErrors.value.title = '标题不能超过100个字符'
    isValid = false
  }
  
  if (!meta.value.summary || meta.value.summary.trim().length < 10) {
    validationErrors.value.summary = '摘要至少需要10个字符'
    isValid = false
  } else if (meta.value.summary.trim().length > 500) {
    validationErrors.value.summary = '摘要不能超过500个字符'
    isValid = false
  }
  
  if (!meta.value.categories.length) {
    validationErrors.value.categories = '请至少选择一个分类'
    isValid = false
  }
  
  if (!meta.value.tags.length) {
    validationErrors.value.tags = '请至少选择一个标签'
    isValid = false
  }
  
  if (!content.value || content.value.trim().length < 50) {
    validationErrors.value.content = '文章内容至少需要50个字符'
    isValid = false
  }
  
  return isValid
}

// 初始化
onMounted(async () => {
  try {
    // 初始化 editorToken（一次会话一个），仅用于上传接口的 formData 字段
    editorToken.value = localStorage.getItem('editorToken') || `ed_${Date.now()}_${Math.random().toString(36).slice(2,8)}`
    localStorage.setItem('editorToken', editorToken.value)
    // 检查是否有编辑数据
    const editData = localStorage.getItem('editArticleData')
    if (editData) {
      isEdit.value = true
      const articleData = JSON.parse(editData)
      editArticleId.value = articleData.ArticleID || articleData.PostID
      
      // 填充表单数据
      title.value = articleData.Title || ''
      content.value = articleData.Content || ''
      meta.value.summary = articleData.Excerpt || ''
      meta.value.cover = articleData.FeaturedImage || ''
      meta.value.visibility = articleData.Visibility || 'public'
      meta.value.schedule = articleData.Schedule || null
      
      if (articleData.Categories && Array.isArray(articleData.Categories)) {
        meta.value.categories = articleData.Categories.map(cat => cat.CategoryID)
      }
      if (articleData.Tags && Array.isArray(articleData.Tags)) {
        meta.value.tags = articleData.Tags.map(tag => tag.TagID)
      }
      
      // 清除localStorage中的编辑数据
      localStorage.removeItem('editArticleData')
    }
    
    // 获取标签和分类
    const [tagsRes, categoriesRes] = await Promise.all([
      getTags(),
      getCategories()
    ])
    tagOptions.value = tagsRes.data || tagsRes || []
    categoryOptions.value = categoriesRes.data || categoriesRes || []
  } catch (error) {
    console.error('获取标签或分类失败:', error)
    messageStore.show('获取标签或分类失败', 'error')
  }
})

onUnmounted(() => {})

// 工具函数
function getCategoryName(id) {
  const category = categoryOptions.value.find(c => c.CategoryID === id)
  return category?.Name || '未知分类'
}

function getTagName(id) {
  const tag = tagOptions.value.find(t => t.TagID === id)
  return tag?.Name || '未知标签'
}

function slugify(str) {
  return str.toString().toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
    .slice(0, 50) || Math.random().toString(36).slice(2, 10)
}

// 字段验证
function validateField(field) {
  switch (field) {
    case 'title':
      if (!title.value || title.value.trim().length < 5) {
        validationErrors.value.title = '标题至少需要5个字符'
      } else if (title.value.trim().length > 100) {
        validationErrors.value.title = '标题不能超过100个字符'
      } else {
        validationErrors.value.title = ''
      }
      break
    case 'summary':
      if (!meta.value.summary || meta.value.summary.trim().length < 10) {
        validationErrors.value.summary = '摘要至少需要10个字符'
      } else if (meta.value.summary.trim().length > 500) {
        validationErrors.value.summary = '摘要不能超过500个字符'
      } else {
        validationErrors.value.summary = ''
      }
      break
  }
}

// 分类和标签操作
function onCategoryChange() {
  if (selectedCategory.value && !meta.value.categories.includes(selectedCategory.value)) {
    meta.value.categories.push(selectedCategory.value)
    validationErrors.value.categories = '' // 清除验证错误
  }
  selectedCategory.value = ''
}

function removeCategory(id) {
  const index = meta.value.categories.indexOf(id)
  if (index > -1) {
    meta.value.categories.splice(index, 1)
  }
}

function onTagChange() {
  if (selectedTag.value && !meta.value.tags.includes(selectedTag.value)) {
    meta.value.tags.push(selectedTag.value)
    validationErrors.value.tags = '' // 清除验证错误
  }
  selectedTag.value = ''
}

function removeTag(id) {
  const index = meta.value.tags.indexOf(id)
  if (index > -1) {
    meta.value.tags.splice(index, 1)
  }
}

// 封面图片处理
function onCoverChange(e) {
  const file = e.target.files[0]
  if (!file) return
  
  const reader = new FileReader()
  reader.onload = (ev) => {
    meta.value.cover = ev.target.result
  }
  reader.readAsDataURL(file)
}

// 发布操作
async function onPublish() {
  if (!validateForm()) {
    messageStore.show('请检查表单填写是否正确', 'error')
    return
  }
  
  saving.value = true
  currentAction.value = 'publish'
  
  try {
    const payload = {
      title: title.value,
      slug: slugify(title.value),
      content: content.value,
      
      excerpt: meta.value.summary,
      status: 'published',
      categoryIds: meta.value.categories,
      tagIds: meta.value.tags,
      featuredImageURL: meta.value.cover,
      visibility: meta.value.visibility,
    }
    
    let res
    if (isEdit.value && editArticleId.value) {
      res = await updateArticle(editArticleId.value, payload)
      if (res.code === 0) {
        messageStore.show(t('articleUpdateSuccess'), 'success')
      } else {
        messageStore.show(res.message || t('articleUpdateFail'), 'error')
      }
    } else {
      res = await createArticle(payload)
      if (res.code === 0) {
        messageStore.show(t('articleCreateSuccess'), 'success')
      } else {
        messageStore.show(res.message || t('articleCreateFail'), 'error')
      }
    }
    
    if (res.code === 0) {
      setTimeout(() => {
        router.push('/admin/articles')
      }, 1500)
    }
  } catch (error) {
    console.error('发布失败:', error)
    const message = isEdit.value ? t('articleUpdateFail') : t('articleCreateFail')
    messageStore.show(message, 'error')
  } finally {
    saving.value = false
    currentAction.value = ''
  }
}

async function onSaveDraft() {
  if (!title.value) {
    messageStore.show(t('articleTitleRequired'), 'error')
    return
  }
  
  saving.value = true
  currentAction.value = 'draft'
  
  try {
    const payload = {
      title: title.value || '无标题草稿',
      slug: title.value ? slugify(title.value) : `draft-${Date.now()}`,
      content: content.value,
      
      excerpt: meta.value.summary,
      status: 'draft',
      categoryIds: meta.value.categories,
      tagIds: meta.value.tags,
      featuredImageURL: meta.value.cover,
      visibility: meta.value.visibility,
    }
    
    let res
    if (isEdit.value && editArticleId.value) {
      res = await updateArticle(editArticleId.value, payload)
    } else {
      res = await createArticle(payload)
    }
    
    if (res.code === 0) {
      messageStore.show(t('saveSuccess'), 'success')
    } else {
      messageStore.show(res.message || t('saveFail'), 'error')
    }
  } catch (error) {
    console.error('保存草稿失败:', error)
    messageStore.show(t('saveFail'), 'error')
  } finally {
    saving.value = false
    currentAction.value = ''
  }
}

async function onSchedule() {
  if (!validateForm()) {
    messageStore.show('请检查表单填写是否正确', 'error')
    return
  }
  if (!meta.value.schedule) {
    messageStore.show('请设置定时发布时间', 'error')
    return
  }
  
  saving.value = true
  currentAction.value = 'schedule'
  
  try {
    const payload = {
      title: title.value,
      slug: slugify(title.value),
      content: content.value,
      
      excerpt: meta.value.summary,
      status: 'scheduled',
      categoryIds: meta.value.categories,
      tagIds: meta.value.tags,
      featuredImageURL: meta.value.cover,
      schedule: meta.value.schedule,
      visibility: meta.value.visibility,
    }
    
    let res
    if (isEdit.value && editArticleId.value) {
      res = await updateArticle(editArticleId.value, payload)
    } else {
      res = await createArticle(payload)
    }
    
    if (res.code === 0) {
      messageStore.show('定时发布设置成功', 'success')
      setTimeout(() => {
        router.push('/admin/articles')
      }, 1500)
    } else {
      messageStore.show(res.message || '设置失败', 'error')
    }
  } catch (error) {
    console.error('定时发布设置失败:', error)
    messageStore.show('设置失败，请重试', 'error')
  } finally {
    saving.value = false
    currentAction.value = ''
  }
}

// 新增分类
async function handleAddCategory() {
  if (!newCategoryName.value) return
  
  try {
    const res = await addCategory({ name: newCategoryName.value })
    if (res.code === 0) {
      showAddCategory.value = false
      newCategoryName.value = ''
      
      // 重新拉取分类并选中新建项
      const categoriesRes = await getCategories()
      categoryOptions.value = categoriesRes.data || categoriesRes || []
      const newCat = categoryOptions.value.find(c => c.Name === res.data?.Name)
      if (newCat) {
        meta.value.categories.push(newCat.CategoryID)
      }
      messageStore.show('新增分类成功', 'success')
    } else {
      messageStore.show(res.message || '新增失败', 'error')
    }
  } catch (e) {
    messageStore.show('新增失败', 'error')
  }
}

// 新增标签
async function handleAddTag() {
  if (!newTagName.value) return
  
  try {
    const res = await addTag({ name: newTagName.value })
    if (res.code === 0) {
      showAddTag.value = false
      newTagName.value = ''
      
      // 重新拉取标签并选中新建项
      const tagsRes = await getTags()
      tagOptions.value = tagsRes.data || tagsRes || []
      const newTag = tagOptions.value.find(t => t.Name === res.data?.Name)
      if (newTag) {
        meta.value.tags.push(newTag.TagID)
      }
      messageStore.show('新增标签成功', 'success')
    } else {
      messageStore.show(res.message || '新增失败', 'error')
    }
  } catch (e) {
    messageStore.show('新增失败', 'error')
  }
}

// 通知透传给全局消息
function onNotify(payload) {
  const { type, message } = payload || {}
  if (!type || !message) return
  messageStore.show(message, type)
}

// 确保拿到 PostID：
// - 编辑场景：用已有 editArticleId
// - 新建场景：若无，则先创建一个最小草稿，拿到 PostID 供图片上传
let ensurePostIdPromise = null
async function ensurePostId() {
  if (editArticleId.value) return editArticleId.value
  if (ensurePostIdPromise) return ensurePostIdPromise
  ensurePostIdPromise = (async () => {
    const tmpTitle = title.value?.trim() || '未命名文章'
    const payload = {
      // 最小化草稿载荷，避免 data:image 进入正文导致 500 或超限
      title: tmpTitle,
      slug: slugify(tmpTitle),
      // 后端要求 content 非空，这里用极小占位符，后续会被真实内容覆盖
      content: '草稿占位',
      status: 'draft',
      // 若后端也校验 excerpt，可按需放开
      // excerpt: '占位'
    }
    try {
      const res = await createArticle(payload)
      const data = res?.data?.data || res?.data || res
      const id = data.PostID || data.ArticleID || data.id
      if (id) {
        editArticleId.value = id
        isEdit.value = true
        return id
      }
    } catch (e) {
      // 失败则回退：提示用户无法自动创建草稿
      messageStore.show('自动创建草稿失败，无法上传图片', 'error')
      throw e
    } finally {
      ensurePostIdPromise = null
    }
    throw new Error('未能获取文章ID')
  })()
  return ensurePostIdPromise
}
</script>

<style scoped>
.input {
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  padding: 0.5rem 0.75rem;
  width: 100%;
  outline: none;
  transition: all 0.15s;
}

.input:focus {
  box-shadow: 0 0 0 2px #3b82f6;
  border-color: transparent;
}

.btn-primary {
  background-color: #2563eb;
  color: white;
  border-radius: 0.5rem;
  padding: 0.5rem 1rem;
  font-weight: 500;
  transition: background-color 0.15s;
  border: none;
  cursor: pointer;
}

.btn-primary:hover:not(:disabled) {
  background-color: #1d4ed8;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: #6b7280;
  color: white;
  border-radius: 0.5rem;
  padding: 0.5rem 1rem;
  font-weight: 500;
  transition: background-color 0.15s;
  border: none;
  cursor: pointer;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #4b5563;
}

.btn-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-warning {
  background-color: #eab308;
  color: white;
  border-radius: 0.5rem;
  padding: 0.5rem 1rem;
  font-weight: 500;
  transition: background-color 0.15s;
  border: none;
  cursor: pointer;
}

.btn-warning:hover:not(:disabled) {
  background-color: #ca8a04;
}

.btn-warning:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>