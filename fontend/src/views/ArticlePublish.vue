<template>
  <div class="publish-page w-full px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
    <Card>
      <template #header>
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between w-full">
          <h2 class="text-xl font-semibold text-gray-800">
            {{ isEdit ? '编辑文章' : '发布文章' }}
          </h2>
          <button
            class="text-gray-400 hover:text-blue-500 transition-colors"
            @click="router.back()"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </template>

      <div
        v-if="showValidation && validationSummary.length"
        class="validation-alert mb-6"
        role="alert"
        aria-live="polite"
      >
        <div class="validation-alert-title">请先修正以下问题后再提交</div>
        <ul class="validation-alert-list">
          <li v-for="item in validationSummary" :key="item.field">
            <span class="validation-alert-label">{{ item.label }}</span>
            <span>{{ item.message }}</span>
          </li>
        </ul>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-1 space-y-6">
          <Card>
            <template #header>
              <h3 class="text-base font-semibold text-gray-800">基本信息</h3>
            </template>

            <div class="space-y-4">
              <div
                class="field-block"
                data-field="title"
                :class="{ 'field-block-error': validationErrors.title }"
              >
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  文章标题 <span class="text-red-500">*</span>
                </label>
                <input
                  v-model="title"
                  class="input"
                  placeholder="请输入文章标题（5~100字）"
                  @blur="validateField('title')"
                />
                <div v-if="validationErrors.title" class="field-error">
                  {{ validationErrors.title }}
                </div>
              </div>

              <div
                class="field-block"
                data-field="summary"
                :class="{ 'field-block-error': validationErrors.summary }"
              >
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  文章摘要 <span class="text-red-500">*</span>
                </label>
                <textarea
                  v-model="meta.summary"
                  class="input"
                  rows="3"
                  placeholder="请输入摘要，帮助读者快速了解文章内容"
                  @blur="validateField('summary')"
                />
                <div v-if="validationErrors.summary" class="field-error">
                  {{ validationErrors.summary }}
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">封面图片</label>
                <div class="flex flex-wrap items-center gap-3">
                  <input
                    ref="coverInput"
                    type="file"
                    accept="image/*"
                    class="hidden"
                    @change="onCoverChange"
                  />
                  <button class="btn-secondary text-sm px-3 py-2" @click="openCoverPicker">
                    选择图片
                  </button>
                  <div
                    v-if="meta.cover"
                    class="w-16 h-16 bg-gray-100 rounded border overflow-hidden"
                  >
                    <img
                      :src="meta.cover"
                      alt="封面预览"
                      class="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>

              <div class="field-block" data-field="visibility">
                <label class="block text-sm font-medium text-gray-700 mb-2">可见性</label>
                <AppSelect
                  v-model="meta.visibility"
                  class="input"
                  :options="visibilityOptions"
                  placeholder="选择可见性"
                />
              </div>
            </div>
          </Card>

          <Card>
            <template #header>
              <h3 class="text-base font-semibold text-gray-800">分类和标签</h3>
            </template>

            <div class="space-y-4">
              <div
                class="field-block"
                data-field="categories"
                :class="{ 'field-block-error': validationErrors.categories }"
              >
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  文章分类 <span class="text-red-500">*</span>
                </label>
                <div class="flex items-start gap-2">
                  <AppSelect
                    v-model="meta.categories"
                    class="input flex-1"
                    :options="categoryOptions"
                    label-key="Name"
                    value-key="CategoryID"
                    placeholder="选择分类"
                    multiple
                    searchable
                  />
                  <button class="btn-secondary text-sm px-3 py-2" @click="showAddCategory = true">
                    新增
                  </button>
                </div>
                <div class="field-hint">支持多选和搜索，已选项目可在下拉面板中快速清空。</div>
                <div v-if="validationErrors.categories" class="field-error">
                  {{ validationErrors.categories }}
                </div>
              </div>

              <div
                class="field-block"
                data-field="tags"
                :class="{ 'field-block-error': validationErrors.tags }"
              >
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  文章标签 <span class="text-red-500">*</span>
                </label>
                <div class="flex items-start gap-2">
                  <AppSelect
                    v-model="meta.tags"
                    class="input flex-1"
                    :options="tagOptions"
                    label-key="Name"
                    value-key="TagID"
                    placeholder="选择标签"
                    multiple
                    searchable
                  />
                  <button class="btn-secondary text-sm px-3 py-2" @click="showAddTag = true">
                    新增
                  </button>
                </div>
                <div class="field-hint">标签建议控制在 2~5 个，便于文章检索和推荐。</div>
                <div v-if="validationErrors.tags" class="field-error">
                  {{ validationErrors.tags }}
                </div>
              </div>
            </div>
          </Card>

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
                  :min="scheduleMin"
                />
                <div class="field-hint">留空则立即发布。</div>
              </div>
            </div>
          </Card>
        </div>

        <div
          class="lg:col-span-2 field-block"
          data-field="content"
          :class="{ 'field-block-error': validationErrors.content }"
        >
          <Card class="h-full min-h-[600px]" :class="{ 'editor-card-error': validationErrors.content }">
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
          <div v-if="validationErrors.content" class="field-error mt-3">
            {{ validationErrors.content }}
          </div>
        </div>
      </div>

      <template #footer>
        <div class="publish-footer flex flex-wrap items-center justify-between gap-3">
          <div v-if="showValidation && validationSummary.length" class="footer-validation-tip">
            共发现 {{ validationSummary.length }} 处需要修正的内容，请按字段提示逐项检查。
          </div>
          <div class="publish-footer-actions flex flex-wrap justify-end gap-3">
            <button class="btn-secondary" :disabled="saving" @click="onSaveDraft">
              {{ saving && currentAction === 'draft' ? '保存中...' : '保存草稿' }}
            </button>
            <button
              v-if="meta.schedule"
              class="btn-warning"
              :disabled="saving"
              @click="onSchedule"
            >
              {{ saving && currentAction === 'schedule' ? '设置中...' : '定时发布' }}
            </button>
            <button class="btn-primary" :disabled="saving" @click="onPublish">
              {{ saving && currentAction === 'publish' ? '发布中...' : (isEdit ? '更新文章' : '发布文章') }}
            </button>
          </div>
        </div>
      </template>
    </Card>

    <div
      v-if="showAddCategory"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      @click.self="showAddCategory = false"
    >
      <Card class="w-96 max-w-[calc(100vw-2rem)]">
        <template #header>
          <div class="flex items-center justify-between w-full">
            <h3 class="text-lg font-semibold">新增分类</h3>
            <button class="text-gray-400 hover:text-gray-600" @click="showAddCategory = false">
              ×
            </button>
          </div>
        </template>

        <div class="space-y-4">
          <input
            v-model="newCategoryName"
            class="input"
            placeholder="请输入分类名称"
          />
        </div>

        <template #footer>
          <div class="flex justify-end gap-2">
            <button class="btn-secondary" @click="showAddCategory = false">取消</button>
            <button
              class="btn-primary"
              :disabled="!newCategoryName.trim()"
              @click="handleAddCategory"
            >
              保存
            </button>
          </div>
        </template>
      </Card>
    </div>

    <div
      v-if="showAddTag"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      @click.self="showAddTag = false"
    >
      <Card class="w-96 max-w-[calc(100vw-2rem)]">
        <template #header>
          <div class="flex items-center justify-between w-full">
            <h3 class="text-lg font-semibold">新增标签</h3>
            <button class="text-gray-400 hover:text-gray-600" @click="showAddTag = false">
              ×
            </button>
          </div>
        </template>

        <div class="space-y-4">
          <input
            v-model="newTagName"
            class="input"
            placeholder="请输入标签名称"
          />
        </div>

        <template #footer>
          <div class="flex justify-end gap-2">
            <button class="btn-secondary" @click="showAddTag = false">取消</button>
            <button class="btn-primary" :disabled="!newTagName.trim()" @click="handleAddTag">
              保存
            </button>
          </div>
        </template>
      </Card>
    </div>
  </div>
</template>

<script setup>
import { computed, defineAsyncComponent, nextTick, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useMessageStore } from '@/store/user'
import AppSelect from '@/components/AppSelect.vue'
import Card from '@/components/Card.vue'
import LoadingState from '@/components/LoadingState.vue'
import { createArticle, updateArticle } from '@/api/article'
import { addCategory, getCategories } from '@/api/category'
import { addTag, getTags } from '@/api/tag'

const VditorEditor = defineAsyncComponent(() => import('@/components/VditorEditor.vue'))

const router = useRouter()
const { t } = useI18n()
const messageStore = useMessageStore()

const coverInput = ref(null)
const title = ref('')
const content = ref('')
const meta = ref({
  tags: [],
  categories: [],
  summary: '',
  cover: '',
  visibility: 'public',
  schedule: '',
})

const tagOptions = ref([])
const categoryOptions = ref([])
const visibilityOptions = [
  { label: '公开', value: 'public' },
  { label: '私密', value: 'private' },
  { label: '密码保护', value: 'password' },
]

const saving = ref(false)
const currentAction = ref('')
const showValidation = ref(false)
const isEdit = ref(false)
const editArticleId = ref(null)
const editorToken = ref('')

const showAddCategory = ref(false)
const showAddTag = ref(false)
const newCategoryName = ref('')
const newTagName = ref('')

const validationErrors = ref({
  title: '',
  summary: '',
  categories: '',
  tags: '',
  content: '',
})

const validationFieldOrder = ['title', 'summary', 'categories', 'tags', 'content']
const validationFieldLabels = {
  title: '文章标题',
  summary: '文章摘要',
  categories: '文章分类',
  tags: '文章标签',
  content: '文章内容',
}
const validationFieldSelectors = {
  title: '[data-field="title"] .input',
  summary: '[data-field="summary"] .input',
  categories: '[data-field="categories"] .app-select-trigger',
  tags: '[data-field="tags"] .app-select-trigger',
  content: '[data-field="content"] .vditor, [data-field="content"] textarea, [data-field="content"] [contenteditable="true"]',
}

const feedbackCooldownMs = 1200
let lastValidationFeedbackAt = 0
let ensurePostIdPromise = null

const validationSummary = computed(() => {
  return validationFieldOrder
    .filter((field) => validationErrors.value[field])
    .map((field) => ({
      field,
      label: validationFieldLabels[field],
      message: validationErrors.value[field],
    }))
})

const firstInvalidField = computed(() => validationSummary.value[0]?.field || '')
const scheduleMin = computed(() => toDateTimeLocalValue(new Date()))

onMounted(async () => {
  try {
    editorToken.value =
      localStorage.getItem('editorToken') ||
      `ed_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    localStorage.setItem('editorToken', editorToken.value)

    const editData = localStorage.getItem('editArticleData')
    if (editData) {
      hydrateEditArticle(JSON.parse(editData))
      localStorage.removeItem('editArticleData')
    }

    await loadOptions()
  } catch (error) {
    console.error('获取标签或分类失败:', error)
    messageStore.show('获取标签或分类失败', 'error')
  }
})

watch(title, () => {
  if (showValidation.value || validationErrors.value.title) {
    validateField('title')
  }
})

watch(
  () => meta.value.summary,
  () => {
    if (showValidation.value || validationErrors.value.summary) {
      validateField('summary')
    }
  },
)

watch(
  () => meta.value.categories.length,
  () => {
    if (showValidation.value || validationErrors.value.categories) {
      validateField('categories')
    }
  },
)

watch(
  () => meta.value.tags.length,
  () => {
    if (showValidation.value || validationErrors.value.tags) {
      validateField('tags')
    }
  },
)

watch(content, () => {
  if (showValidation.value || validationErrors.value.content) {
    validateField('content')
  }
})

function hydrateEditArticle(articleData) {
  isEdit.value = true
  editArticleId.value = articleData.ArticleID || articleData.PostID || null
  title.value = articleData.Title || ''
  content.value = articleData.Content || ''
  meta.value.summary = articleData.Excerpt || ''
  meta.value.cover = articleData.FeaturedImageURL || articleData.FeaturedImage || ''
  meta.value.visibility = articleData.Visibility || 'public'
  meta.value.schedule = toDateTimeLocalValue(
    articleData.Schedule || articleData.ScheduledAt || '',
  )
  meta.value.categories = Array.isArray(articleData.Categories)
    ? articleData.Categories.map((item) => item.CategoryID).filter(Boolean)
    : []
  meta.value.tags = Array.isArray(articleData.Tags)
    ? articleData.Tags.map((item) => item.TagID).filter(Boolean)
    : []
}

async function loadOptions() {
  const [tagsRes, categoriesRes] = await Promise.all([getTags(), getCategories()])
  tagOptions.value = normalizeListResponse(tagsRes)
  categoryOptions.value = normalizeListResponse(categoriesRes)
}

function normalizeListResponse(response) {
  const payload = unwrapResponse(response)
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.list)) return payload.list
  return []
}

function unwrapResponse(response) {
  return response?.data?.data ?? response?.data ?? response
}

function validateForm() {
  showValidation.value = true
  validationErrors.value = {
    title: '',
    summary: '',
    categories: '',
    tags: '',
    content: '',
  }

  let isValid = true

  if (!title.value || title.value.trim().length < 5) {
    validationErrors.value.title = '标题至少需要 5 个字符'
    isValid = false
  } else if (title.value.trim().length > 100) {
    validationErrors.value.title = '标题不能超过 100 个字符'
    isValid = false
  }

  if (!meta.value.summary || meta.value.summary.trim().length < 10) {
    validationErrors.value.summary = '摘要至少需要 10 个字符'
    isValid = false
  } else if (meta.value.summary.trim().length > 500) {
    validationErrors.value.summary = '摘要不能超过 500 个字符'
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
    validationErrors.value.content = '文章内容至少需要 50 个字符'
    isValid = false
  }

  return isValid
}

function validateField(field) {
  switch (field) {
    case 'title':
      if (!title.value || title.value.trim().length < 5) {
        validationErrors.value.title = '标题至少需要 5 个字符'
      } else if (title.value.trim().length > 100) {
        validationErrors.value.title = '标题不能超过 100 个字符'
      } else {
        validationErrors.value.title = ''
      }
      break
    case 'summary':
      if (!meta.value.summary || meta.value.summary.trim().length < 10) {
        validationErrors.value.summary = '摘要至少需要 10 个字符'
      } else if (meta.value.summary.trim().length > 500) {
        validationErrors.value.summary = '摘要不能超过 500 个字符'
      } else {
        validationErrors.value.summary = ''
      }
      break
    case 'categories':
      validationErrors.value.categories = meta.value.categories.length
        ? ''
        : '请至少选择一个分类'
      break
    case 'tags':
      validationErrors.value.tags = meta.value.tags.length
        ? ''
        : '请至少选择一个标签'
      break
    case 'content':
      validationErrors.value.content =
        content.value && content.value.trim().length >= 50
          ? ''
          : '文章内容至少需要 50 个字符'
      break
    default:
      break
  }
}

function buildValidationMessage() {
  const firstError = validationSummary.value[0]
  if (!firstError) return '请检查表单填写是否正确'

  return `请先修正 ${validationSummary.value.length} 处内容：${firstError.label}${
    firstError.message ? `，${firstError.message}` : ''
  }`
}

function notifyValidationFailure(message = buildValidationMessage()) {
  const now = Date.now()
  if (now - lastValidationFeedbackAt >= feedbackCooldownMs) {
    lastValidationFeedbackAt = now
    messageStore.show(message, 'error')
  }

  focusFirstInvalidField()
}

function focusFirstInvalidField() {
  nextTick(() => {
    const selector = validationFieldSelectors[firstInvalidField.value]
    if (!selector) return

    const target = document.querySelector(selector)
    if (!target) return

    target.scrollIntoView({ behavior: 'smooth', block: 'center' })
    if (typeof target.focus === 'function') {
      target.focus({ preventScroll: true })
    }
  })
}

function openCoverPicker() {
  coverInput.value?.click()
}

function onCoverChange(event) {
  const input = event.target
  const file = input?.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (loadEvent) => {
    meta.value.cover = loadEvent.target?.result || ''
    if (input) {
      input.value = ''
    }
  }
  reader.readAsDataURL(file)
}

function slugify(value) {
  return value
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
    .slice(0, 50) || Math.random().toString(36).slice(2, 10)
}

function buildArticlePayload(status, extra = {}) {
  const safeTitle = title.value?.trim() || '无标题草稿'
  return {
    title: safeTitle,
    slug: slugify(safeTitle),
    content: content.value,
    excerpt: meta.value.summary,
    status,
    categoryIds: [...meta.value.categories],
    tagIds: [...meta.value.tags],
    featuredImageURL: meta.value.cover,
    visibility: meta.value.visibility,
    ...extra,
  }
}

async function persistArticle(payload) {
  if (isEdit.value && editArticleId.value) {
    return updateArticle(editArticleId.value, payload)
  }

  return createArticle(payload)
}

async function onPublish() {
  if (saving.value) return

  if (!validateForm()) {
    notifyValidationFailure()
    return
  }

  saving.value = true
  currentAction.value = 'publish'

  try {
    const response = await persistArticle(buildArticlePayload('published'))
    if (response.code === 0) {
      messageStore.show(
        isEdit.value ? t('articleUpdateSuccess') : t('articleCreateSuccess'),
        'success',
      )
      setTimeout(() => {
        router.push('/admin/articles')
      }, 1500)
    } else {
      messageStore.show(
        response.message ||
          (isEdit.value ? t('articleUpdateFail') : t('articleCreateFail')),
        'error',
      )
    }
  } catch (error) {
    console.error('发布文章失败:', error)
    messageStore.show(
      isEdit.value ? t('articleUpdateFail') : t('articleCreateFail'),
      'error',
    )
  } finally {
    saving.value = false
    currentAction.value = ''
  }
}

async function onSaveDraft() {
  if (saving.value) return

  if (!title.value.trim()) {
    showValidation.value = true
    validationErrors.value.title = '保存草稿至少需要填写文章标题'
    notifyValidationFailure('保存草稿至少需要填写文章标题')
    return
  }

  saving.value = true
  currentAction.value = 'draft'

  try {
    const response = await persistArticle(buildArticlePayload('draft'))
    if (response.code === 0) {
      messageStore.show(t('saveSuccess'), 'success')
    } else {
      messageStore.show(response.message || t('saveFail'), 'error')
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
  if (saving.value) return

  if (!validateForm()) {
    notifyValidationFailure()
    return
  }

  if (!meta.value.schedule) {
    messageStore.show('请先设置定时发布时间', 'error')
    return
  }

  saving.value = true
  currentAction.value = 'schedule'

  try {
    const response = await persistArticle(
      buildArticlePayload('scheduled', {
        schedule: meta.value.schedule,
      }),
    )

    if (response.code === 0) {
      messageStore.show('定时发布设置成功', 'success')
      setTimeout(() => {
        router.push('/admin/articles')
      }, 1500)
    } else {
      messageStore.show(response.message || '定时发布设置失败', 'error')
    }
  } catch (error) {
    console.error('定时发布设置失败:', error)
    messageStore.show('定时发布设置失败，请稍后重试', 'error')
  } finally {
    saving.value = false
    currentAction.value = ''
  }
}

async function handleAddCategory() {
  const trimmedName = newCategoryName.value.trim()
  if (!trimmedName) return

  try {
    const response = await addCategory({ name: trimmedName })
    if (response.code !== 0) {
      messageStore.show(response.message || '新增分类失败', 'error')
      return
    }

    const createdCategory = unwrapResponse(response)
    showAddCategory.value = false
    newCategoryName.value = ''

    const categoryResponse = await getCategories()
    categoryOptions.value = normalizeListResponse(categoryResponse)

    const matchedCategory = categoryOptions.value.find(
      (item) => item.Name === (createdCategory?.Name || trimmedName),
    )
    if (matchedCategory && !meta.value.categories.includes(matchedCategory.CategoryID)) {
      meta.value.categories.push(matchedCategory.CategoryID)
    }

    validateField('categories')
    messageStore.show('新增分类成功', 'success')
  } catch (error) {
    console.error('新增分类失败:', error)
    messageStore.show('新增分类失败', 'error')
  }
}

async function handleAddTag() {
  const trimmedName = newTagName.value.trim()
  if (!trimmedName) return

  try {
    const response = await addTag({ name: trimmedName })
    if (response.code !== 0) {
      messageStore.show(response.message || '新增标签失败', 'error')
      return
    }

    const createdTag = unwrapResponse(response)
    showAddTag.value = false
    newTagName.value = ''

    const tagResponse = await getTags()
    tagOptions.value = normalizeListResponse(tagResponse)

    const matchedTag = tagOptions.value.find(
      (item) => item.Name === (createdTag?.Name || trimmedName),
    )
    if (matchedTag && !meta.value.tags.includes(matchedTag.TagID)) {
      meta.value.tags.push(matchedTag.TagID)
    }

    validateField('tags')
    messageStore.show('新增标签成功', 'success')
  } catch (error) {
    console.error('新增标签失败:', error)
    messageStore.show('新增标签失败', 'error')
  }
}

function onNotify(payload) {
  const { type, message } = payload || {}
  if (!type || !message) return
  messageStore.show(message, type)
}

async function ensurePostId() {
  if (editArticleId.value) return editArticleId.value
  if (ensurePostIdPromise) return ensurePostIdPromise

  ensurePostIdPromise = (async () => {
    const draftTitle = title.value?.trim() || '未命名文章'
    const payload = buildArticlePayload('draft', {
      title: draftTitle,
      slug: slugify(draftTitle),
      content: '草稿占位',
    })

    try {
      const response = await createArticle(payload)
      const data = unwrapResponse(response)
      const id = data?.PostID || data?.ArticleID || data?.id || null

      if (id) {
        editArticleId.value = id
        isEdit.value = true
        return id
      }
    } catch (error) {
      messageStore.show('自动创建草稿失败，当前无法上传图片', 'error')
      throw error
    } finally {
      ensurePostIdPromise = null
    }

    throw new Error('未能获取文章 ID')
  })()

  return ensurePostIdPromise
}

function toDateTimeLocalValue(value) {
  if (!value) return ''

  const date =
    value instanceof Date
      ? value
      : new Date(String(value).replace(' ', 'T'))

  if (Number.isNaN(date.getTime())) return ''

  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return localDate.toISOString().slice(0, 16)
}
</script>

<style scoped>
.validation-alert {
  border: 1px solid rgba(255, 147, 183, 0.28);
  border-radius: 18px;
  padding: 14px 16px;
  background:
    linear-gradient(135deg, rgba(255, 147, 183, 0.12), rgba(120, 163, 255, 0.08));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.04),
    0 14px 36px rgba(8, 12, 24, 0.16);
}

.validation-alert-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: #ffd2df;
  margin-bottom: 8px;
}

.validation-alert-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 6px;
}

.validation-alert-list li {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  color: #f6dbe6;
  font-size: 0.875rem;
}

.validation-alert-label {
  color: #ffc0d3;
  font-weight: 600;
}

.field-block {
  position: relative;
  transition: transform 180ms ease;
}

.field-block-error {
  transform: translateY(-1px);
}

.field-hint {
  margin-top: 0.5rem;
  font-size: 0.75rem;
  line-height: 1.5;
  color: var(--muted);
}

.field-error {
  margin-top: 0.5rem;
  font-size: 0.75rem;
  line-height: 1.5;
  color: #ffb1c8;
}

.input {
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 0.75rem;
  padding: 0.625rem 0.875rem;
  width: 100%;
  outline: none;
  color: var(--text);
  background: rgba(255, 255, 255, 0.05);
  transition: all 0.18s ease;
}

.input::placeholder {
  color: var(--muted);
}

.input:focus {
  box-shadow: 0 0 0 3px rgba(120, 163, 255, 0.18);
  border-color: transparent;
}

.field-block-error .input,
.field-block-error :deep(.vditor),
.field-block-error :deep(.app-select-trigger) {
  border-color: rgba(255, 147, 183, 0.45) !important;
  box-shadow:
    0 0 0 3px rgba(255, 147, 183, 0.14),
    0 18px 40px rgba(255, 147, 183, 0.08) !important;
}

.field-block-error label {
  color: #ffd4df !important;
}

.editor-card-error {
  border-color: rgba(255, 147, 183, 0.28);
}

.editor-card-error :deep(.vditor-toolbar) {
  border-bottom-color: rgba(255, 147, 183, 0.18) !important;
}

.footer-validation-tip {
  max-width: min(100%, 420px);
  color: #ffd4df;
  font-size: 0.875rem;
  line-height: 1.5;
}

.btn-primary,
.btn-secondary,
.btn-warning {
  border-radius: 14px;
  padding: 0.625rem 1.1rem;
  font-weight: 600;
  border: 1px solid transparent;
  cursor: pointer;
  transition:
    transform 180ms ease,
    box-shadow 180ms ease,
    border-color 180ms ease,
    background 180ms ease,
    opacity 180ms ease;
}

.btn-primary:hover:not(:disabled),
.btn-secondary:hover:not(:disabled),
.btn-warning:hover:not(:disabled) {
  transform: translateY(-1px);
}

.btn-primary:disabled,
.btn-secondary:disabled,
.btn-warning:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.btn-primary {
  background: linear-gradient(135deg, rgba(120, 163, 255, 0.92), rgba(255, 123, 176, 0.78));
  color: #fff;
  box-shadow:
    0 14px 32px rgba(120, 163, 255, 0.24),
    0 0 22px rgba(120, 163, 255, 0.18);
}

.btn-primary:hover:not(:disabled) {
  box-shadow:
    0 18px 40px rgba(120, 163, 255, 0.3),
    0 0 28px rgba(255, 123, 176, 0.14);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.07);
  color: var(--text);
  border-color: rgba(255, 255, 255, 0.12);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

.btn-secondary:hover:not(:disabled) {
  border-color: color-mix(in srgb, var(--accent) 32%, transparent);
  box-shadow:
    0 14px 32px rgba(8, 12, 24, 0.24),
    0 0 18px color-mix(in srgb, var(--accent) 12%, transparent);
}

.btn-warning {
  background: linear-gradient(135deg, rgba(255, 211, 110, 0.9), rgba(255, 152, 107, 0.78));
  color: #221202;
  box-shadow: 0 14px 32px rgba(255, 179, 82, 0.22);
}

.btn-warning:hover:not(:disabled) {
  box-shadow: 0 18px 40px rgba(255, 179, 82, 0.28);
}

@media (max-width: 1024px) {
  .publish-footer {
    align-items: stretch;
  }

  .publish-footer-actions {
    width: 100%;
    justify-content: stretch;
  }

  .publish-footer-actions > * {
    flex: 1 1 180px;
  }
}

@media (max-width: 640px) {
  .publish-page {
    padding-inline: 0;
  }

  .footer-validation-tip {
    max-width: 100%;
  }

  .publish-footer-actions > * {
    width: 100%;
    flex-basis: 100%;
  }
}

@media (max-width: 390px) {
  .publish-page {
    padding-top: 0.5rem;
    padding-bottom: 0.75rem;
  }

  .publish-footer {
    gap: 0.75rem;
  }
}
</style>
