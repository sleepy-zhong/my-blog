<template>
  <div class="article-import-page flex flex-col items-center px-3 sm:px-4 py-5 sm:py-8">
    <div class="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-gray-200 p-5 sm:p-8">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center mb-8">
        <div class="text-3xl font-bold text-gray-800 flex-1">发布文章</div>
        <button class="btn-primary" :disabled="saving || !content" @click="onSave">{{ saving ? '保存中...' : '发布' }}</button>
      </div>
      <form @submit.prevent="onImport" class="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center mb-8">
        <input type="file" ref="fileInput" @change="onFileChange" accept=".doc,.docx,.md,.txt,.rtf,.pdf" class="border rounded-xl px-4 py-2 shadow w-full" />
        <button type="submit" class="btn-primary" :disabled="loading">{{ loading ? '上传中...' : '上传文档' }}</button>
      </form>
      <div v-if="error" class="text-red-500 mb-4">{{ error }}</div>
      <div v-if="content">
        <div class="mb-6">
          <label class="block mb-2 text-lg font-semibold">标题 <span class="text-red-500">*</span></label>
          <input v-model="title" class="input text-xl font-bold" placeholder="请输入文章标题" />
        </div>
        <div class="mb-6">
          <label class="block mb-2 text-lg font-semibold">Slug（可选）</label>
          <input v-model="slug" class="input" placeholder="自动生成或自定义唯一标识" />
        </div>
        <div class="mb-6">
          <label class="block mb-2 text-lg font-semibold">正文内容</label>
          <textarea v-model="content" class="input min-h-[240px]" placeholder="可粘贴或编辑正文 Markdown"></textarea>
        </div>
        <div class="import-preview-layout flex flex-col lg:flex-row gap-8 mt-8">
          <!-- 目录区 -->
          <aside class="w-64 sticky top-20 self-start hidden md:block">
            <div class="bg-white/80 rounded-xl shadow p-4 border border-gray-100">
              <h3 class="font-bold text-lg mb-2">目录</h3>
              <ul>
                <li v-for="item in toc" :key="item.id" :class="`ml-${(item.level-1)*4}`">
                  <a :href="`#${item.id}`" class="block py-1 hover:text-blue-600 transition">{{ item.text }}</a>
                </li>
              </ul>
            </div>
          </aside>
          <!-- 预览区 -->
          <main class="flex-1 min-w-0">
            <div class="bg-gray-50 rounded-xl shadow-inner p-6 border border-gray-100 whitespace-pre-wrap">{{ content }}</div>
          </main>
        </div>
      </div>
      <div v-if="success" class="text-green-600 mt-4">保存成功！</div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { importArticle, createArticle } from '@/api/article'
import { useUserStore, useMessageStore } from '@/store/user'
// 移除结构化编辑器，改为直接编辑 Markdown 正文
import { withRetry } from '@/utils/retry'

const userStore = useUserStore()
const messageStore = useMessageStore()

const fileInput = ref(null)
const loading = ref(false)
const saving = ref(false)
const error = ref('')
const success = ref(false)
const content = ref('')
const title = ref('')
const slug = ref('')

function slugify(str) {
  return str
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
    .slice(0, 50) || Math.random().toString(36).slice(2, 10)
}

watch(title, (val) => {
  if (val) slug.value = slugify(val)
})

function onFileChange(e) {
  error.value = ''
  success.value = false
  const file = e.target.files[0]
  if (!file) return
}

function addIdsToHeadings(arr) {
  let h1 = 0, h2 = 0, h3 = 0
  return arr.map(item => {
    if (item.type === 'h1') {
      h1++; h2 = 0; h3 = 0
      return { ...item, id: `section-${h1}` }
    }
    if (item.type === 'h2') {
      h2++; h3 = 0
      return { ...item, id: `section-${h1}-${h2}` }
    }
    if (item.type === 'h3') {
      h3++
      return { ...item, id: `section-${h1}-${h2}-${h3}` }
    }
    return item
  })
}

const toc = computed(() => {
  return []
    .filter(item => ['h1', 'h2', 'h3'].includes(item.type))
    .map(item => ({
      id: item.id,
      text: item.text,
      level: Number(item.type[1])
    }))
})

function getTag(item) {
  return 'div'
}

async function onImport() {
  error.value = ''
  success.value = false
  const file = fileInput.value.files[0]
  if (!file) {
    error.value = '请选择文件'
    return
  }
  loading.value = true
  try {
    const formData = new FormData()
    formData.append('file', file)
    let retriedNotified = false
    const res = await withRetry(() => importArticle(formData), {
      retries: 2,
      baseDelayMs: 400,
      onRetry: () => {
        if (!retriedNotified) {
          messageStore.show('网络波动，正在重试...', 'info')
          retriedNotified = true
        }
      }
    })
    console.log('import接口返回：', res.data)
    // 后端已不返回 contentJSON，这里仅尝试从 data.content 或 data.title 取值
    if (res.data && res.data.code === 0 && res.data.data) {
      const data = res.data.data.data || res.data.data
      title.value = data.title || ''
      content.value = data.content || ''
      if (!content.value) {
        error.value = '解析失败：未获取到正文内容'
        loading.value = false
        return
      }
    } else {
      error.value = res.data?.message || '解析失败'
      loading.value = false
      return
    }
  } catch (e) {
    error.value = '上传或解析失败'
    messageStore.show('上传或解析失败', 'error')
  } finally {
    loading.value = false
  }
}

async function onSave() {
  error.value = ''
  success.value = false
  saving.value = true
  try {
    if (!title.value) {
      error.value = '标题不能为空'
      saving.value = false
      return
    }
    if (!content.value || !content.value.trim()) {
      error.value = '正文内容不能为空，请检查导入的文档或手动补充正文。'
      saving.value = false
      return
    }
    // 自动生成 slug
    let finalSlug = slug.value || slugify(title.value)
    const payload = {
      title: title.value,
      slug: finalSlug,
      content: content.value,
      status: 'draft',
    }
    let retriedNotified = false
    const res = await withRetry(() => createArticle(payload), {
      retries: 2,
      baseDelayMs: 400,
      onRetry: () => {
        if (!retriedNotified) {
          messageStore.show('网络波动，正在重试...', 'info')
          retriedNotified = true
        }
      }
    })
    if (res.data && (res.data.code === 0 || res.status === 201)) {
      success.value = true
      messageStore.show('保存成功', 'success')
    } else {
      error.value = res.data.message || '保存失败'
      if (res.data && res.data.errors) {
        error.value += '\n' + res.data.errors.map(e => e.msg).join('\n')
      }
      messageStore.show(error.value, 'error')
    }
  } catch (e) {
    if (e.response) {
      if (e.response.data && e.response.data.errors) {
        error.value = (e.response.data.message || '保存失败') + '\n' + e.response.data.errors.map(er => er.msg).join('\n')
      } else {
        error.value = e.response.data?.message || '保存失败'
      }
    } else {
      error.value = '保存失败'
    }
    messageStore.show(error.value, 'error')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.article-import-page {
  width: 100%;
  min-height: 100vh;
}

.input { @apply border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-200 transition; }
.btn-primary { @apply bg-blue-500 text-white rounded px-4 py-2 hover:bg-blue-600 transition font-bold shadow; }

@media (max-width: 640px) {
  .import-preview-layout {
    gap: 1rem;
  }

  .btn-primary {
    width: 100%;
  }
}

@media (max-width: 390px) {
  .article-import-page {
    padding-left: 0.5rem;
    padding-right: 0.5rem;
    padding-top: 0.75rem;
    padding-bottom: 1rem;
  }
}
</style>
