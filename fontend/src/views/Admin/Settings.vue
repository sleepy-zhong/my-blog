<template>
  <div class="w-full min-h-screen p-0 m-0">
    <div class="w-full flex items-center bg-white border-b px-6 py-4">
      <h2 class="text-2xl font-bold text-blue-700 flex-1">系统设置</h2>
      <button @click="saveSettings" :disabled="saving" class="btn-primary">
        {{ saving ? '保存中...' : '保存设置' }}
      </button>
    </div>
    
    <div class="w-full bg-white rounded-xl shadow p-6 border mt-6">
      <form @submit.prevent="saveSettings" class="space-y-6">
        <!-- 基本信息 -->
        <div class="border-b pb-6">
          <h3 class="text-lg font-bold text-gray-800 mb-4">基本信息</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">网站名称</label>
              <input 
                v-model="settings.siteName" 
                type="text" 
                class="input w-full"
                placeholder="请输入网站名称"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">网站描述</label>
              <input 
                v-model="settings.description" 
                type="text" 
                class="input w-full"
                placeholder="请输入网站描述"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Logo URL</label>
              <input 
                v-model="settings.logoURL" 
                type="text" 
                class="input w-full"
                placeholder="请输入Logo URL"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Favicon URL</label>
              <input 
                v-model="settings.faviconURL" 
                type="text" 
                class="input w-full"
                placeholder="请输入Favicon URL"
              />
            </div>
          </div>
        </div>

        <!-- 社交链接 -->
        <div class="border-b pb-6">
          <h3 class="text-lg font-bold text-gray-800 mb-4">社交链接</h3>
          <div class="space-y-3">
            <div v-for="(link, index) in settings.socialLinks" :key="index" class="flex gap-2">
              <input 
                v-model="link.name" 
                type="text" 
                class="input flex-1"
                placeholder="平台名称"
              />
              <input 
                v-model="link.url" 
                type="url" 
                class="input flex-1"
                placeholder="链接地址"
              />
              <button 
                @click="removeSocialLink(index)" 
                type="button"
                class="btn-danger px-3"
              >
                删除
              </button>
            </div>
            <button 
              @click="addSocialLink" 
              type="button"
              class="btn-secondary"
            >
              添加社交链接
            </button>
          </div>
        </div>

        <!-- 分析代码 -->
        <div class="border-b pb-6">
          <h3 class="text-lg font-bold text-gray-800 mb-4">网站分析</h3>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Google Analytics 代码</label>
            <textarea 
              v-model="settings.analytics" 
              rows="4" 
              class="input w-full"
              placeholder="请输入Google Analytics或其他分析代码"
            ></textarea>
          </div>
        </div>

        <!-- 邮件测试 -->
        <div class="border-b pb-6">
          <h3 class="text-lg font-bold text-gray-800 mb-4">邮件设置</h3>
          <div class="flex gap-2">
            <input 
              v-model="testEmail" 
              type="email" 
              class="input flex-1"
              placeholder="输入测试邮箱地址"
            />
            <button 
              @click="sendTestEmail" 
              type="button"
              :disabled="!testEmail || testingEmail"
              class="btn-secondary"
            >
              {{ testingEmail ? '发送中...' : '发送测试邮件' }}
            </button>
          </div>
        </div>

        <!-- 系统信息 -->
        <div>
          <h3 class="text-lg font-bold text-gray-800 mb-4">系统信息</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div class="bg-gray-50 p-3 rounded">
              <span class="font-medium">当前版本：</span>
              <span>v1.0.0</span>
            </div>
            <div class="bg-gray-50 p-3 rounded">
              <span class="font-medium">最后更新：</span>
              <span>{{ new Date().toLocaleDateString() }}</span>
            </div>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getSettings, updateSettings, sendTestEmail as sendTestEmailApi } from '@/api/settings'

const settings = ref({
  siteName: '',
  description: '',
  logoURL: '',
  faviconURL: '',
  analytics: '',
  socialLinks: []
})

const saving = ref(false)
const testEmail = ref('')
const testingEmail = ref(false)

async function fetchSettings() {
  try {
    console.log('[Settings.vue] 开始获取系统设置')
    const res = await getSettings()
    console.log('[Settings.vue] 系统设置原始响应:', res)
    
    if (res.code === 0) {
      const data = res.data?.data || res.data || {}
      settings.value = {
        siteName: data.SiteName || '',
        description: data.Description || '',
        logoURL: data.LogoURL || '',
        faviconURL: data.FaviconURL || '',
        analytics: data.Analytics || '',
        socialLinks: data.SocialLinks || []
      }
    }
  } catch (error) {
    console.error('[Settings.vue] 获取系统设置失败:', error)
    // 如果API不存在，使用默认值
    if (error.response?.status === 404) {
      console.log('[Settings.vue] 系统设置API不存在，使用默认值')
      settings.value = {
        siteName: 'TechBlogDB',
        description: '一个技术博客系统',
        logoURL: '/assets/logo.png',
        faviconURL: '/assets/favicon.ico',
        analytics: '',
        socialLinks: []
      }
    }
  }
}

async function saveSettings() {
  saving.value = true
  try {
    console.log('[Settings.vue] 开始保存系统设置:', settings.value)
    const res = await updateSettings(settings.value)
    console.log('[Settings.vue] 保存系统设置响应:', res)
    
    if (res.code === 0) {
      alert('设置保存成功！')
    } else {
      alert('保存失败：' + res.message)
    }
  } catch (error) {
    console.error('[Settings.vue] 保存系统设置失败:', error)
    alert('保存失败，请重试')
  } finally {
    saving.value = false
  }
}

async function sendTestEmail() {
  if (!testEmail.value) return
  
  testingEmail.value = true
  try {
    const res = await sendTestEmailApi(testEmail.value)
    if (res.code === 0) {
      alert('测试邮件发送成功！')
      testEmail.value = ''
    } else {
      alert('发送失败：' + res.message)
    }
  } catch (error) {
    console.error('[Settings.vue] 发送测试邮件失败:', error)
    alert('发送失败，请重试')
  } finally {
    testingEmail.value = false
  }
}

function addSocialLink() {
  settings.value.socialLinks.push({ name: '', url: '' })
}

function removeSocialLink(index) {
  settings.value.socialLinks.splice(index, 1)
}

onMounted(fetchSettings)
</script>

<style scoped>
.btn-primary {
  @apply bg-blue-500 text-white rounded px-4 py-2 hover:bg-blue-600 transition font-bold shadow;
}
.btn-secondary { @apply bg-gray-500 text-white rounded px-3 py-1 hover:bg-gray-600 transition font-bold shadow; }
.btn-danger { @apply bg-red-500 text-white rounded px-3 py-1 hover:bg-red-600 transition font-bold shadow; }
.input { @apply border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 transition; }
</style> 