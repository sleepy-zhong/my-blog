<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
    <div class="bg-white rounded-2xl shadow-2xl border w-full max-w-2xl p-8 relative animate-fade-in">
      <button class="absolute top-4 right-4 text-gray-400 hover:text-blue-500 text-2xl" @click="emit('close')">×</button>
      <div class="flex flex-col items-center mb-6">
        <label class="relative cursor-pointer group">
          <img :src="avatarPreview || (user.AvatarURL && (user.AvatarURL.startsWith('http') ? user.AvatarURL : backendBase + user.AvatarURL)) || defaultAvatar"
               class="w-24 h-24 rounded-full border-4 border-blue-200 shadow mb-2 object-cover"
               @error="console.error('[Avatar <img>] 加载失败:', $event.target.src)"
               @load="console.log('[Avatar <img>] 加载成功:', $event.target.src)" />
          <input type="file" accept="image/*" class="hidden" @change="onAvatarChange" />
          <span class="absolute bottom-2 right-2 bg-blue-500 text-white rounded-full p-1 text-xs group-hover:bg-blue-600 transition">更换</span>
        </label>
        <div class="text-lg font-bold text-blue-700 mt-2">{{ user.DisplayName || user.Username }}</div>
        <div class="text-gray-500 text-sm">UID: {{ user.UserID }}</div>
      </div>
      <!-- 顶部选项卡 -->
      <div class="flex gap-2 mb-6">
        <button class="px-4 py-2 rounded" :class="tab==='profile' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'" @click="tab='profile'">基本信息</button>
        <button class="px-4 py-2 rounded" :class="tab==='password' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'" @click="tab='password'">修改密码</button>
        <button class="px-4 py-2 rounded" :class="tab==='email' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'" @click="tab='email'">邮箱设置</button>
      </div>

      <!-- 基本信息 -->
      <form v-if="tab==='profile'" @submit.prevent="onSave" class="space-y-4">
        <div>
          <label class="block text-gray-600 mb-1">昵称</label>
          <input v-model="form.displayName" class="input" placeholder="请输入昵称" />
        </div>
        <div>
          <label class="block text-gray-600 mb-1">邮箱</label>
          <input v-model="form.email" class="input" placeholder="请输入邮箱" disabled />
        </div>
        <div>
          <label class="block text-gray-600 mb-1">手机号</label>
          <input v-model="form.phoneNumber" class="input" placeholder="请输入手机号" />
        </div>
        <div>
          <label class="block text-gray-600 mb-1">个人简介</label>
          <textarea v-model="form.bio" class="input" rows="2" placeholder="介绍一下自己吧"></textarea>
        </div>
        <div class="flex justify-end gap-3 mt-6">
          <button type="button" class="btn" @click="emit('close')">取消</button>
          <button type="submit" class="btn-primary" :disabled="loading">{{ loading ? '保存中...' : '保存' }}</button>
        </div>
      </form>

      <!-- 修改密码 -->
      <form v-if="tab==='password'" @submit.prevent="onChangePassword" class="space-y-4">
        <div>
          <label class="block text-gray-600 mb-1">当前密码</label>
          <input v-model="passwordForm.oldPassword" type="password" class="input" required autocomplete="current-password" />
        </div>
        <div>
          <label class="block text-gray-600 mb-1">新密码</label>
          <input v-model="passwordForm.newPassword" type="password" class="input" required autocomplete="new-password" />
        </div>
        <div>
          <label class="block text-gray-600 mb-1">确认新密码</label>
          <input v-model="passwordForm.confirm" type="password" class="input" required autocomplete="new-password" />
        </div>
        <div class="flex justify-end gap-3 mt-6">
          <button type="button" class="btn" @click="emit('close')">取消</button>
          <button type="submit" class="btn-primary" :disabled="loading">{{ loading ? '保存中...' : '保存' }}</button>
        </div>
      </form>

      <!-- 邮箱设置 -->
      <form v-if="tab==='email'" @submit.prevent="onChangeEmail" class="space-y-4">
        <div>
          <label class="block text-gray-600 mb-1">当前邮箱</label>
          <input :value="user.Email || '-'" class="input" disabled />
        </div>
        <div>
          <label class="block text-gray-600 mb-1">新邮箱</label>
          <input v-model="emailForm.email" type="email" class="input" required />
        </div>
        <div class="flex justify-end gap-3 mt-6">
          <button type="button" class="btn" @click="emit('close')">取消</button>
          <button type="submit" class="btn-primary" :disabled="loading">{{ loading ? '保存中...' : '保存' }}</button>
        </div>
      </form>
      <StatusButton :status="statusType" :text="statusText" :show="showStatus" />
    </div>
  </div>
  <!-- 剪裁弹窗部分 -->
  <div v-if="showCropper" class="fixed inset-0 flex items-center justify-center bg-black/40" style="z-index:9999;">
    <div class="bg-white rounded-xl p-6 shadow-xl relative">
      <VueCropper
        ref="cropperRef"
        :img="cropperImg"
        :output-size="1"
        :output-type="'jpeg'"
        :info="true"
        :auto-crop="true"
        :auto-crop-width="200"
        :auto-crop-height="200"
        :fixed="true"
        :fixed-number="[1,1]"
        :can-move="true"
        :center-box="true"
        :can-scale="true"
        :full="false"
        style="width:300px;height:300px;"
      />
      <div class="flex justify-end gap-3 mt-4">
        <button class="btn" @click="onCropCancel">取消</button>
        <button class="btn-primary" @click="onCropConfirm">确定裁剪</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useUserStore, useMessageStore } from '@/store/user'
import defaultAvatar from '../assets/icons/login-active.png'
import { updateProfile, updatePassword, updateEmail } from '@/api/user'
import StatusButton from '@/components/StatusButton.vue'
import { VueCropper } from 'vue-cropper'
import 'vue-cropper/dist/index.css'

const userStore = useUserStore()
const messageStore = useMessageStore()
const user = computed(() => userStore.user || {})
const loading = ref(false)
const avatarPreview = ref('')
const showCropper = ref(false)
const cropperImg = ref('')
const cropperRef = ref(null)
const baseURL = window.location.origin
const backendBase = import.meta?.env?.VITE_API_BASE_URL || 'http://localhost:3000'

const form = ref({
  displayName: user.value.DisplayName || '',
  email: user.value.Email || '',
  phoneNumber: user.value.PhoneNumber || '',
  bio: user.value.Bio || ''
})

// tabs
const props = defineProps({ initialTab: { type: String, default: 'profile' } })
const tab = ref(props.initialTab || 'profile')

// 修改密码
const passwordForm = ref({ oldPassword: '', newPassword: '', confirm: '' })
async function onChangePassword() {
  if (!passwordForm.value.oldPassword || !passwordForm.value.newPassword) return showStatusMsg('error', '请输入完整信息')
  if (passwordForm.value.newPassword !== passwordForm.value.confirm) return showStatusMsg('error', '两次输入的密码不一致')
  loading.value = true
  try {
    const res = await updatePassword({ oldPassword: passwordForm.value.oldPassword, newPassword: passwordForm.value.newPassword })
    if (res.code === 0) {
      showStatusMsg('success', '密码已更新')
      passwordForm.value = { oldPassword: '', newPassword: '', confirm: '' }
    } else {
      showStatusMsg('error', res.message || '修改失败')
    }
  } catch (e) {
    showStatusMsg('error', e?.response?.data?.message || '修改失败')
  } finally {
    loading.value = false
  }
}

// 邮箱修改
const emailForm = ref({ email: '' })
function validEmail(email) { return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) }
async function onChangeEmail() {
  if (!validEmail(emailForm.value.email)) return showStatusMsg('error', '请输入正确的邮箱地址')
  loading.value = true
  try {
    const res = await updateEmail({ email: emailForm.value.email })
    if (res.code === 0) {
      await userStore.fetchUser(true)
      showStatusMsg('success', '邮箱已更新')
      emailForm.value = { email: '' }
    } else {
      showStatusMsg('error', res.message || '更新失败')
    }
  } catch (e) {
    showStatusMsg('error', e?.response?.data?.message || '更新失败')
  } finally {
    loading.value = false
  }
}

function onAvatarChange(e) {
  const file = e.target.files[0]
  console.log('[onAvatarChange] file:', file)
  if (!file) return
  const reader = new FileReader()
  reader.onload = ev => {
    cropperImg.value = ev.target.result
    showCropper.value = true
    console.log('[onAvatarChange] cropperImg set, showCropper:', showCropper.value)
  }
  reader.readAsDataURL(file)
}

function onCropConfirm() {
  console.log('[onCropConfirm] cropperRef:', cropperRef.value)
  cropperRef.value.getCropBlob(blob => {
    console.log('[onCropConfirm] got blob:', blob)
    avatarPreview.value = URL.createObjectURL(blob)
    form.value.avatarFile = new File([blob], 'avatar.jpg', { type: blob.type })
    showCropper.value = false
    console.log('[onCropConfirm] avatarPreview:', avatarPreview.value, 'avatarFile:', form.value.avatarFile)
  })
}
function onCropCancel() {
  showCropper.value = false
  cropperImg.value = ''
  console.log('[onCropCancel] cropper canceled')
}

const showStatus = ref(false)
const statusType = ref('success')
const statusText = ref('')
function showStatusMsg(type, text) {
  statusType.value = type
  statusText.value = text
  showStatus.value = true
  setTimeout(() => { showStatus.value = false }, 2000)
}

async function onSave() {
  loading.value = true
  try {
    const formData = new FormData()
    formData.append('displayName', form.value.displayName)
    formData.append('bio', form.value.bio)
    formData.append('phoneNumber', form.value.phoneNumber)
    if (form.value.avatarFile) {
      formData.append('file', form.value.avatarFile)
      console.log('[onSave] append avatarFile:', form.value.avatarFile)
    }
    const token = localStorage.getItem('token') || userStore.token
    console.log('[onSave] token:', token)
    const res = await updateProfile(formData)
    console.log('[onSave] response:', res)
    // 兼容两种返回结构
    const userData = res.data?.data || res.data
    if ((res.data && res.data.code === 0) || userData?.UserID) {
      await userStore.fetchUser(true)
      showStatusMsg('success', '个人信息已更新')
      setTimeout(() => {
        loading.value = false
        avatarPreview.value = ''
        form.value.avatarFile = null
        window.dispatchEvent(new CustomEvent('profile-panel-close'))
      }, 800)
    } else {
      showStatusMsg('error', res.data?.message || '保存失败')
      loading.value = false
    }
  } catch (e) {
    showStatusMsg('error', e?.response?.data?.message || '保存失败')
    loading.value = false
    console.error('[onSave] error:', e)
  }
}

const emit = defineEmits(['close'])
// 监听全局事件关闭弹窗
if (typeof window !== 'undefined') {
  window.addEventListener('profile-panel-close', () => {
    loading.value = false
    avatarPreview.value = ''
    form.value.avatarFile = null
    emit('close')
  })
}
</script>

<style scoped>
.input { @apply border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-200 transition; }
.btn-primary { @apply bg-blue-500 text-white rounded px-4 py-2 hover:bg-blue-600 transition font-bold shadow; }
.btn { @apply bg-gray-100 text-gray-700 rounded px-4 py-2 hover:bg-gray-200 transition font-bold shadow; }
.animate-fade-in { animation: fadeIn 0.2s; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: none; } }
</style> 