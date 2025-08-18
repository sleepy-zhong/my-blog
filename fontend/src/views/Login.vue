<template>
  <div class="min-h-screen w-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-pink-100">
    <div class="w-full max-w-md bg-white/80 p-8 rounded-2xl shadow-2xl border border-blue-100">
      <div class="flex justify-center mb-8 gap-2">
        <button :class="['px-6 py-2 font-bold rounded-t-lg transition', mode==='login' ? 'bg-blue-500 text-white shadow' : 'bg-gray-100 text-gray-400 hover:text-blue-500']" @click="switchMode('login')">登录</button>
        <button :class="['px-6 py-2 font-bold rounded-t-lg transition', mode==='register' ? 'bg-blue-500 text-white shadow' : 'bg-gray-100 text-gray-400 hover:text-blue-500']" @click="switchMode('register')">注册</button>
      </div>
      <form v-if="mode==='login'" @submit.prevent="onLogin" class="flex flex-col gap-6">
        <div class="relative">
          <input v-model="username" type="text" placeholder="用户名" class="input pl-10" required />
          <span class="absolute left-3 top-2.5 text-gray-400"><svg xmlns='http://www.w3.org/2000/svg' class='h-5 w-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.655 6.879 1.804M15 11a3 3 0 11-6 0 3 3 0 016 0z' /></svg></span>
        </div>
        <div class="relative">
          <input v-model="password" type="password" placeholder="密码" class="input pl-10" required />
          <span class="absolute left-3 top-2.5 text-gray-400"><svg xmlns='http://www.w3.org/2000/svg' class='h-5 w-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M12 11c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm0 0v2m0 4h.01' /></svg></span>
        </div>
        <button type="submit" class="btn-primary" :disabled="loading">{{ loading ? '登录中...' : '登录' }}</button>
      </form>
      <form v-else @submit.prevent="onRegister" class="flex flex-col gap-6">
        <input v-model="regUsername" type="text" placeholder="用户名（必填）" class="input" required autocomplete="username" />
        <input v-model="regEmail" type="email" placeholder="邮箱（必填）" class="input" required autocomplete="email" />
        <input v-model="regPhoneNumber" type="text" placeholder="手机号（可选）" class="input" autocomplete="tel" />
        <input v-model="regPassword" type="password" placeholder="密码（必填）" class="input" required autocomplete="new-password" />
        <input v-model="regConfirm" type="password" placeholder="确认密码（必填）" class="input" required autocomplete="new-password" />
        <button type="submit" class="btn-primary" :disabled="loading">{{ loading ? '注册中...' : '注册' }}</button>
    </form>
      <div class="text-center mt-6 text-gray-500">
        <span v-if="mode==='login'">没有账号？<button class="text-blue-500 hover:underline" @click="switchMode('register')">注册</button></span>
        <span v-else>已有账号？<button class="text-blue-500 hover:underline" @click="switchMode('login')">登录</button></span>
      </div>
    </div>
    <StatusButton :status="statusType" :text="statusText" :show="showStatus" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { login, register } from '../api/user'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore, useMessageStore } from '@/store/user'
import StatusButton from '@/components/StatusButton.vue'
import { useI18n } from 'vue-i18n'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const messageStore = useMessageStore()
const mode = ref('login')

// 登录表单
const username = ref('')
const password = ref('')
const loading = ref(false)
let loginTimer = null

// 注册表单
const regUsername = ref('')
const regEmail = ref('')
const regPhoneNumber = ref('')
const regPassword = ref('')
const regConfirm = ref('')


const showStatus = ref(false)
const statusType = ref('success')
const statusText = ref('')

const { t } = useI18n()

function validateEmail(email) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)
}

function clearLoginForm() {
  username.value = ''
  password.value = ''
}
function clearRegisterForm() {
  regUsername.value = ''
  regEmail.value = ''
  regPhoneNumber.value = ''
  regPassword.value = ''
  regConfirm.value = ''
}
function switchMode(m) {
  if (mode.value !== m) {
    mode.value = m
    clearLoginForm()
    clearRegisterForm()
  }
}

function showStatusMsg(type, text) {
  statusType.value = type
  statusText.value = text
  showStatus.value = true
  setTimeout(() => { showStatus.value = false }, 2000)
}

onMounted(() => {
  if (route.query.mode === 'register') {
    mode.value = 'register'
  }
})

async function onLogin() {
  if (loading.value) return
  loading.value = true
  if (loginTimer) clearTimeout(loginTimer)
  try {
    const res = await login({ username: username.value, password: password.value })
    if (res.code === 0 && res.data?.token) {
      userStore.setToken(res.data.token)
      await userStore.fetchUser()
      showStatusMsg('success', t('loginSuccess'))
      const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
      router.push(redirect || '/')
    } else {
      showStatusMsg('error', res.message || t('loginFail'))
    }
  } catch (e) {
    showStatusMsg('error', t('loginFail'))
  } finally {
    loginTimer = setTimeout(() => { loading.value = false }, 800)
  }
}

async function onRegister() {
  if (loading.value) return
  if (!regUsername.value || !regEmail.value || !regPassword.value) {
    showStatusMsg('error', t('required'))
    return
  }
  if (!validateEmail(regEmail.value)) {
    showStatusMsg('error', t('invalidEmail'))
    return
  }
  if (regPassword.value.length < 6) {
    showStatusMsg('error', t('passwordShort'))
    return
  }
  if (regPassword.value !== regConfirm.value) {
    showStatusMsg('error', t('passwordNotMatch'))
    return
  }
  loading.value = true
  try {
    const res = await register({ 
      username: regUsername.value, 
      email: regEmail.value, 
      password: regPassword.value, 
      phoneNumber: regPhoneNumber.value || undefined
    })
    if (res.code === 0) {
      showStatusMsg('success', t('registerSuccess'))
      switchMode('login')
      username.value = regUsername.value
    } else {
      if (res.errors && Array.isArray(res.errors)) {
        showStatusMsg('error', t('paramError') + '\n' + res.errors.map(e => `${e.param}: ${e.msg}`).join('\n'))
      } else {
        showStatusMsg('error', res.message || t('registerFail'))
      }
    }
  } catch (e) {
    showStatusMsg('error', t('registerFail'))
  } finally {
    setTimeout(() => { loading.value = false }, 800)
  }
}
</script>

<style scoped>
.input { @apply border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-200 transition; }
.btn-primary { @apply bg-blue-500 text-white rounded px-4 py-2 w-full hover:bg-blue-600 transition font-bold shadow; }
</style> 