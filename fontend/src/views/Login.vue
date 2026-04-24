<template>
  <div class="login-page">
    <div class="login-grid">
      <section class="login-stage">
        <div class="stage-copy">
          <span class="stage-kicker">Auth Matrix</span>
          <h1>账号认证与会话控制中心</h1>
          <p>
            登录、注册、找回密码统一接入邮箱验证码，登录态改为服务端 Cookie 会话。
            现在支持邮箱、手机号或用户名作为登录账号，验证码统一发送到账号绑定邮箱。
          </p>
        </div>

        <div class="feature-list">
          <div class="feature-card">
            <strong>短期 Access Token</strong>
            <span>接口访问使用短期令牌，过期后自动刷新。</span>
          </div>
          <div class="feature-card">
            <strong>长期 Refresh Token</strong>
            <span>勾选记住我后刷新会话有效期更长。</span>
          </div>
          <div class="feature-card">
            <strong>邮箱二次校验</strong>
            <span>注册、登录、改密、忘记密码都需要验证码确认。</span>
          </div>
        </div>

        <div class="orbit-stage" aria-hidden="true">
          <span class="orbit-ring ring-a"></span>
          <span class="orbit-ring ring-b"></span>
          <span class="orbit-core">CAT</span>
          <span class="orbit-chip chip-a">Email Code</span>
          <span class="orbit-chip chip-b">Cookie Session</span>
          <span class="orbit-chip chip-c">Online State</span>
        </div>
      </section>

      <section class="login-panel">
        <div class="panel-head">
          <span class="panel-kicker">{{ panelKicker }}</span>
          <h2>{{ panelTitle }}</h2>
          <p>{{ panelDescription }}</p>
        </div>

        <div class="mode-switch">
          <button :class="['mode-btn', mode === 'login' && 'active']" @click="switchMode('login')">登录</button>
          <button :class="['mode-btn', mode === 'register' && 'active']" @click="switchMode('register')">注册</button>
          <button :class="['mode-btn', mode === 'forgot' && 'active']" @click="switchMode('forgot')">忘记密码</button>
        </div>

        <form v-if="mode === 'login'" class="auth-form" @submit.prevent="onLogin">
          <label class="field">
            <span>账号</span>
            <input
              v-model.trim="loginForm.account"
              class="input"
              type="text"
              placeholder="邮箱 / 手机号 / 用户名"
              autocomplete="username"
            />
          </label>

          <label class="field">
            <span>密码</span>
            <input
              v-model="loginForm.password"
              class="input"
              type="password"
              placeholder="请输入密码"
              autocomplete="current-password"
            />
          </label>

          <div class="field-row">
            <label class="field field-grow">
              <span>邮箱验证码</span>
              <input
                v-model.trim="loginForm.code"
                class="input"
                type="text"
                maxlength="10"
                placeholder="请输入验证码"
              />
            </label>

            <button
              type="button"
              class="secondary-btn code-btn"
              :disabled="sendingCode || countdown > 0"
              @click="onSendLoginCode"
            >
              {{ sendingCode ? '发送中...' : countdown > 0 ? `${countdown}s 后重发` : '发送验证码' }}
            </button>
          </div>

          <label class="remember-line">
            <input v-model="loginForm.rememberMe" type="checkbox" />
            <span>记住我</span>
          </label>

          <button class="primary-btn action-btn" type="submit" :disabled="loading">
            {{ loading ? '登录中...' : '登录' }}
          </button>
        </form>

        <form v-else-if="mode === 'register'" class="auth-form" @submit.prevent="onRegister">
          <label class="field">
            <span>用户名</span>
            <input v-model.trim="registerForm.username" class="input" type="text" autocomplete="username" />
          </label>

          <label class="field">
            <span>邮箱</span>
            <input v-model.trim="registerForm.email" class="input" type="email" autocomplete="email" />
          </label>

          <label class="field">
            <span>手机号</span>
            <input v-model.trim="registerForm.phoneNumber" class="input" type="text" autocomplete="tel" />
          </label>

          <label class="field">
            <span>密码</span>
            <input v-model="registerForm.password" class="input" type="password" autocomplete="new-password" />
          </label>

          <label class="field">
            <span>确认密码</span>
            <input v-model="registerForm.confirmPassword" class="input" type="password" autocomplete="new-password" />
          </label>

          <div class="field-row">
            <label class="field field-grow">
              <span>邮箱验证码</span>
              <input v-model.trim="registerForm.code" class="input" type="text" maxlength="10" placeholder="请输入验证码" />
            </label>

            <button
              type="button"
              class="secondary-btn code-btn"
              :disabled="sendingCode || countdown > 0"
              @click="onSendRegisterCode"
            >
              {{ sendingCode ? '发送中...' : countdown > 0 ? `${countdown}s 后重发` : '发送验证码' }}
            </button>
          </div>

          <button class="primary-btn action-btn" type="submit" :disabled="loading">
            {{ loading ? '注册中...' : '注册' }}
          </button>
        </form>

        <form v-else class="auth-form" @submit.prevent="onForgotPassword">
          <label class="field">
            <span>邮箱</span>
            <input v-model.trim="forgotForm.email" class="input" type="email" autocomplete="email" />
          </label>

          <div class="field-row">
            <label class="field field-grow">
              <span>邮箱验证码</span>
              <input v-model.trim="forgotForm.code" class="input" type="text" maxlength="10" placeholder="请输入验证码" />
            </label>

            <button
              type="button"
              class="secondary-btn code-btn"
              :disabled="sendingCode || countdown > 0"
              @click="onSendForgotCode"
            >
              {{ sendingCode ? '发送中...' : countdown > 0 ? `${countdown}s 后重发` : '发送验证码' }}
            </button>
          </div>

          <label class="field">
            <span>新密码</span>
            <input v-model="forgotForm.newPassword" class="input" type="password" autocomplete="new-password" />
          </label>

          <label class="field">
            <span>确认新密码</span>
            <input v-model="forgotForm.confirmPassword" class="input" type="password" autocomplete="new-password" />
          </label>

          <button class="primary-btn action-btn" type="submit" :disabled="loading">
            {{ loading ? '重置中...' : '重置密码' }}
          </button>
        </form>
      </section>
    </div>

    <StatusButton :status="statusType" :text="statusText" :show="showStatus" />
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import StatusButton from '@/components/StatusButton.vue'
import { useUserStore } from '@/store/user'
import { resolveDisplayMessage } from '@/utils/message'
import {
  forgotPassword,
  login,
  register,
  sendForgotPasswordCode,
  sendLoginCode,
  sendRegisterCode,
} from '@/api/user'

type AuthMode = 'login' | 'register' | 'forgot'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const mode = ref<AuthMode>('login')
const loading = ref(false)
const sendingCode = ref(false)
const countdown = ref(0)

const loginForm = ref({
  account: '',
  password: '',
  code: '',
  rememberMe: false,
})

const registerForm = ref({
  username: '',
  email: '',
  phoneNumber: '',
  password: '',
  confirmPassword: '',
  code: '',
})

const forgotForm = ref({
  email: '',
  code: '',
  newPassword: '',
  confirmPassword: '',
})

const showStatus = ref(false)
const statusType = ref<'success' | 'error' | 'loading'>('success')
const statusText = ref('')

let countdownTimer: number | null = null

const panelKicker = computed(() => {
  if (mode.value === 'register') return 'Register Flow'
  if (mode.value === 'forgot') return 'Reset Flow'
  return 'Login Flow'
})

const panelTitle = computed(() => {
  if (mode.value === 'register') return '注册新账号'
  if (mode.value === 'forgot') return '找回密码'
  return '登录博客后台'
})

const panelDescription = computed(() => {
  if (mode.value === 'register') return '先发送邮箱验证码，再完成账号注册。'
  if (mode.value === 'forgot') return '通过邮箱验证码验证身份，重置密码后需要重新登录。'
  return '输入账号和密码后发送邮箱验证码，验证通过后建立登录会话。'
})

function validateEmail(email: string) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)
}

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

function clearCountdown() {
  countdown.value = 0
  if (countdownTimer) {
    window.clearInterval(countdownTimer)
    countdownTimer = null
  }
}

function startCountdown(seconds = 60) {
  clearCountdown()
  countdown.value = seconds

  countdownTimer = window.setInterval(() => {
    if (countdown.value <= 1) {
      clearCountdown()
      return
    }

    countdown.value -= 1
  }, 1000)
}

function switchMode(nextMode: AuthMode) {
  mode.value = nextMode
  clearCountdown()
}

function requireFields(fields: Array<[string, string]>) {
  const missing = fields.find(([, value]) => !String(value || '').trim())
  if (!missing) return true

  showStatusMsg('error', `${missing[0]}不能为空`)
  return false
}

async function onSendLoginCode() {
  if (sendingCode.value || countdown.value > 0) return
  if (!requireFields([
    ['账号', loginForm.value.account],
    ['密码', loginForm.value.password],
  ])) {
    return
  }

  sendingCode.value = true
  try {
    const res = await sendLoginCode({
      account: loginForm.value.account,
      password: loginForm.value.password,
    })

    if (res.code === 0) {
      startCountdown()
      showStatusMsg('success', resolveDisplayMessage(res.message, '验证码已发送'))
    } else {
      showStatusMsg('error', resolveDisplayMessage(res.message, '发送失败'))
    }
  } catch (error: any) {
    showStatusMsg('error', resolveDisplayMessage(error?.response?.data?.message, '发送失败'))
  } finally {
    sendingCode.value = false
  }
}

async function onLogin() {
  if (loading.value) return
  if (!requireFields([
    ['账号', loginForm.value.account],
    ['密码', loginForm.value.password],
    ['验证码', loginForm.value.code],
  ])) {
    return
  }

  loading.value = true
  try {
    const res = await login({
      account: loginForm.value.account,
      password: loginForm.value.password,
      code: loginForm.value.code,
      rememberMe: loginForm.value.rememberMe,
    })

    if (res.code !== 0) {
      showStatusMsg('error', resolveDisplayMessage(res.message, '登录失败'))
      return
    }

    await userStore.fetchUser(true)
    showStatusMsg('success', resolveDisplayMessage(res.message, '登录成功'))

    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
    router.replace(redirect || '/')
  } catch (error: any) {
    showStatusMsg('error', resolveDisplayMessage(error?.response?.data?.message, '登录失败'))
  } finally {
    loading.value = false
  }
}

async function onSendRegisterCode() {
  if (sendingCode.value || countdown.value > 0) return
  if (!registerForm.value.email.trim()) {
    showStatusMsg('error', '邮箱不能为空')
    return
  }
  if (!validateEmail(registerForm.value.email)) {
    showStatusMsg('error', '邮箱格式不正确')
    return
  }

  sendingCode.value = true
  try {
    const res = await sendRegisterCode({ email: registerForm.value.email })
    if (res.code === 0) {
      startCountdown()
      showStatusMsg('success', resolveDisplayMessage(res.message, '验证码已发送'))
    } else {
      showStatusMsg('error', resolveDisplayMessage(res.message, '发送失败'))
    }
  } catch (error: any) {
    showStatusMsg('error', resolveDisplayMessage(error?.response?.data?.message, '发送失败'))
  } finally {
    sendingCode.value = false
  }
}

async function onRegister() {
  if (loading.value) return
  if (!requireFields([
    ['用户名', registerForm.value.username],
    ['邮箱', registerForm.value.email],
    ['密码', registerForm.value.password],
    ['确认密码', registerForm.value.confirmPassword],
    ['验证码', registerForm.value.code],
  ])) {
    return
  }
  if (!validateEmail(registerForm.value.email)) {
    showStatusMsg('error', '邮箱格式不正确')
    return
  }
  if (registerForm.value.password.length < 6) {
    showStatusMsg('error', '密码至少 6 位')
    return
  }
  if (registerForm.value.password !== registerForm.value.confirmPassword) {
    showStatusMsg('error', '两次输入的密码不一致')
    return
  }

  loading.value = true
  try {
    const res = await register({
      username: registerForm.value.username,
      email: registerForm.value.email,
      phoneNumber: registerForm.value.phoneNumber || undefined,
      password: registerForm.value.password,
      code: registerForm.value.code,
    })

    if (res.code !== 0) {
      showStatusMsg('error', resolveDisplayMessage(res.message, '注册失败'))
      return
    }

    loginForm.value.account = registerForm.value.email
    loginForm.value.password = ''
    loginForm.value.code = ''
    switchMode('login')
    showStatusMsg('success', resolveDisplayMessage(res.message, '注册成功'))
  } catch (error: any) {
    showStatusMsg('error', resolveDisplayMessage(error?.response?.data?.message, '注册失败'))
  } finally {
    loading.value = false
  }
}

async function onSendForgotCode() {
  if (sendingCode.value || countdown.value > 0) return
  if (!forgotForm.value.email.trim()) {
    showStatusMsg('error', '邮箱不能为空')
    return
  }
  if (!validateEmail(forgotForm.value.email)) {
    showStatusMsg('error', '邮箱格式不正确')
    return
  }

  sendingCode.value = true
  try {
    const res = await sendForgotPasswordCode({ email: forgotForm.value.email })
    if (res.code === 0) {
      startCountdown()
      showStatusMsg('success', resolveDisplayMessage(res.message, '验证码已发送'))
    } else {
      showStatusMsg('error', resolveDisplayMessage(res.message, '发送失败'))
    }
  } catch (error: any) {
    showStatusMsg('error', resolveDisplayMessage(error?.response?.data?.message, '发送失败'))
  } finally {
    sendingCode.value = false
  }
}

async function onForgotPassword() {
  if (loading.value) return
  if (!requireFields([
    ['邮箱', forgotForm.value.email],
    ['验证码', forgotForm.value.code],
    ['新密码', forgotForm.value.newPassword],
    ['确认新密码', forgotForm.value.confirmPassword],
  ])) {
    return
  }
  if (!validateEmail(forgotForm.value.email)) {
    showStatusMsg('error', '邮箱格式不正确')
    return
  }
  if (forgotForm.value.newPassword.length < 6) {
    showStatusMsg('error', '密码至少 6 位')
    return
  }
  if (forgotForm.value.newPassword !== forgotForm.value.confirmPassword) {
    showStatusMsg('error', '两次输入的密码不一致')
    return
  }

  loading.value = true
  try {
    const res = await forgotPassword({
      email: forgotForm.value.email,
      code: forgotForm.value.code,
      newPassword: forgotForm.value.newPassword,
    })

    if (res.code !== 0) {
      showStatusMsg('error', resolveDisplayMessage(res.message, '重置失败'))
      return
    }

    loginForm.value.account = forgotForm.value.email
    loginForm.value.password = ''
    loginForm.value.code = ''
    switchMode('login')
    showStatusMsg('success', resolveDisplayMessage(res.message, '密码已重置，请重新登录'))
  } catch (error: any) {
    showStatusMsg('error', resolveDisplayMessage(error?.response?.data?.message, '重置失败'))
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  const nextMode = route.query.mode
  if (nextMode === 'register' || nextMode === 'forgot' || nextMode === 'login') {
    mode.value = nextMode
  }
})

onBeforeUnmount(() => {
  clearCountdown()
})
</script>

<style scoped>
.login-page {
  position: relative;
  isolation: isolate;
  min-height: calc(100vh - 96px);
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 24px 56px;
}

.login-page::before,
.login-page::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.login-page::before {
  background:
    radial-gradient(circle at 12% 18%, rgba(120, 163, 255, 0.16), transparent 18%),
    radial-gradient(circle at 84% 12%, rgba(255, 123, 176, 0.14), transparent 18%),
    radial-gradient(circle at 48% 84%, rgba(103, 239, 216, 0.08), transparent 24%);
  opacity: 0.9;
}

.login-page::after {
  background-image:
    repeating-linear-gradient(180deg, rgba(255, 255, 255, 0.02) 0 1px, transparent 1px 8px),
    linear-gradient(118deg, transparent 0 44%, rgba(255, 255, 255, 0.03) 50%, transparent 56%);
  opacity: 0.14;
}

.login-grid {
  position: relative;
  z-index: 1;
  width: min(1200px, 100%);
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 24px;
}

.login-stage,
.login-panel {
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 28px;
  background: linear-gradient(180deg, rgba(11, 17, 35, 0.88), rgba(8, 12, 26, 0.78));
  backdrop-filter: blur(18px);
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.34);
}

.login-stage::before,
.login-panel::before {
  content: "";
  position: absolute;
  inset: -30% auto -30% -18%;
  width: 30%;
  background: linear-gradient(120deg, transparent 0 18%, rgba(255, 255, 255, 0.06) 28%, rgba(120, 163, 255, 0.26) 48%, rgba(255, 123, 176, 0.18) 66%, transparent 100%);
  transform: translateX(-180%) skewX(-18deg);
  opacity: 0.5;
  mix-blend-mode: screen;
  pointer-events: none;
  animation: loginSweep 8.8s ease-in-out infinite;
}

.login-panel::before {
  animation-delay: -2.6s;
}

.login-stage {
  padding: 36px;
  min-height: 620px;
}

.login-panel {
  padding: 32px;
}

.stage-kicker,
.panel-kicker {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(120, 163, 255, 0.12);
  color: var(--accent);
  font-size: 12px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.stage-copy h1,
.panel-head h2 {
  margin: 18px 0 12px;
  color: var(--text);
  line-height: 1.08;
}

.stage-copy h1 {
  max-width: 11ch;
  font-size: clamp(38px, 5vw, 62px);
}

.panel-head h2 {
  font-size: 30px;
}

.stage-copy p,
.panel-head p,
.feature-card span {
  color: var(--muted);
  line-height: 1.8;
}

.feature-list {
  margin-top: 28px;
  display: grid;
  gap: 14px;
}

.feature-card {
  position: relative;
  overflow: hidden;
  padding: 16px 18px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  transition: transform 220ms ease, box-shadow 220ms ease, border-color 220ms ease;
  animation: featureFloat 6.8s ease-in-out infinite;
}

.feature-card:nth-child(2) {
  animation-delay: -1.6s;
}

.feature-card:nth-child(3) {
  animation-delay: -3.2s;
}

.feature-card::after {
  content: "";
  position: absolute;
  inset: -28% auto -28% -18%;
  width: 34%;
  background: linear-gradient(120deg, transparent 0 18%, rgba(255, 255, 255, 0.05) 28%, rgba(120, 163, 255, 0.26) 48%, rgba(255, 123, 176, 0.16) 66%, transparent 100%);
  transform: translateX(-180%) skewX(-18deg);
  opacity: 0.46;
  mix-blend-mode: screen;
  animation: loginSweep 7.8s ease-in-out infinite;
}

.feature-card:hover {
  transform: translateY(-6px);
  border-color: rgba(120, 163, 255, 0.24);
  box-shadow:
    0 20px 46px rgba(0, 0, 0, 0.24),
    0 0 28px rgba(120, 163, 255, 0.08);
}

.feature-card strong {
  display: block;
  margin-bottom: 6px;
  color: var(--text);
}

.orbit-stage {
  position: absolute;
  right: -16px;
  bottom: -10px;
  width: min(420px, 56vw);
  height: min(420px, 56vw);
}

.orbit-stage::before,
.orbit-stage::after {
  content: "";
  position: absolute;
  inset: 12%;
  border-radius: 50%;
  pointer-events: none;
}

.orbit-stage::before {
  background:
    radial-gradient(circle, rgba(120, 163, 255, 0.18), transparent 58%),
    radial-gradient(circle, rgba(255, 123, 176, 0.12), transparent 76%);
  filter: blur(18px);
  animation: orbitGlow 5.8s ease-in-out infinite;
}

.orbit-stage::after {
  inset: 4%;
  border: 1px solid rgba(120, 163, 255, 0.14);
  animation: spin 18s linear infinite reverse;
}

.orbit-ring,
.orbit-core,
.orbit-chip {
  position: absolute;
}

.orbit-ring {
  inset: 0;
  border-radius: 50%;
  border: 1px solid rgba(120, 163, 255, 0.2);
}

.ring-a {
  animation: spin 16s linear infinite;
}

.ring-b {
  inset: 34px;
  border-style: dashed;
  animation: spin 22s linear infinite reverse;
}

.orbit-core {
  inset: 50%;
  width: 92px;
  height: 92px;
  margin-left: -46px;
  margin-top: -46px;
  border-radius: 28px;
  display: grid;
  place-items: center;
  color: #041120;
  font-weight: 800;
  letter-spacing: 0.18em;
  background: linear-gradient(135deg, #78a3ff, #67efd8);
  box-shadow: 0 0 40px rgba(120, 163, 255, 0.28);
  animation: corePulse 4.6s ease-in-out infinite;
}

.orbit-chip {
  padding: 10px 14px;
  border-radius: 999px;
  background: rgba(8, 15, 33, 0.84);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--text);
  font-size: 13px;
  animation: chipFloat 5.6s ease-in-out infinite;
}

.chip-a {
  top: 54px;
  right: 82px;
  animation-delay: -0.8s;
}

.chip-b {
  left: 8px;
  bottom: 94px;
  animation-delay: -2.2s;
}

.chip-c {
  right: 18px;
  bottom: 24px;
  animation-delay: -3.4s;
}

.mode-switch {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin: 22px 0 24px;
}

.mode-btn,
.primary-btn,
.secondary-btn {
  height: 48px;
  border: none;
  border-radius: 16px;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
}

.mode-btn {
  background: rgba(255, 255, 255, 0.04);
  color: var(--muted);
}

.mode-btn.active {
  background: linear-gradient(135deg, rgba(120, 163, 255, 0.92), rgba(255, 123, 176, 0.78));
  color: #fff;
  box-shadow: 0 12px 28px rgba(120, 163, 255, 0.2);
}

.auth-form {
  display: grid;
  gap: 16px;
}

.field {
  display: grid;
  gap: 8px;
}

.field span {
  color: var(--text);
  font-size: 14px;
}

.field-row {
  display: grid;
  grid-template-columns: 1fr 132px;
  gap: 12px;
  align-items: end;
}

.field-grow {
  min-width: 0;
}

.input {
  width: 100%;
  min-height: 48px;
  padding: 0 14px;
  border-radius: 16px;
  outline: none;
}

.remember-line {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: var(--muted);
}

.primary-btn {
  background: linear-gradient(135deg, rgba(120, 163, 255, 0.92), rgba(255, 123, 176, 0.78));
  color: #fff;
  box-shadow: 0 16px 30px rgba(120, 163, 255, 0.24);
}

.secondary-btn {
  background: rgba(255, 255, 255, 0.06);
  color: var(--text);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.action-btn:hover,
.code-btn:hover,
.mode-btn:hover {
  transform: translateY(-1px);
}

.primary-btn:disabled,
.secondary-btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
  transform: none;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes loginSweep {
  0% {
    transform: translateX(-180%) skewX(-18deg);
  }
  46%, 100% {
    transform: translateX(340%) skewX(-18deg);
  }
}

@keyframes featureFloat {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-4px);
  }
}

@keyframes orbitGlow {
  0%, 100% {
    opacity: 0.42;
    transform: scale(0.96);
  }
  50% {
    opacity: 0.74;
    transform: scale(1.04);
  }
}

@keyframes corePulse {
  0%, 100% {
    box-shadow: 0 0 32px rgba(120, 163, 255, 0.24);
    transform: scale(0.98);
  }
  50% {
    box-shadow:
      0 0 54px rgba(120, 163, 255, 0.32),
      0 0 88px rgba(255, 123, 176, 0.12);
    transform: scale(1.06);
  }
}

@keyframes chipFloat {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
}

@media (max-width: 980px) {
  .login-grid {
    grid-template-columns: 1fr;
  }

  .login-stage {
    min-height: 520px;
  }
}

@media (max-width: 768px) {
  .login-grid {
    gap: 18px;
  }

  .feature-list {
    grid-template-columns: 1fr;
  }

  .mode-switch {
    gap: 8px;
  }
}

@media (max-width: 640px) {
  .login-page {
    padding: 20px 12px 36px;
  }

  .login-stage,
  .login-panel {
    padding: 24px 18px;
    border-radius: 24px;
  }

  .field-row {
    grid-template-columns: 1fr;
  }

  .orbit-stage {
    width: 300px;
    height: 300px;
    right: -48px;
  }
}

@media (max-width: 480px) {
  .mode-switch,
  .field-row {
    grid-template-columns: 1fr;
  }

  .mode-btn,
  .primary-btn,
  .secondary-btn {
    width: 100%;
  }

  .feature-list {
    gap: 12px;
  }

  .orbit-stage {
    width: 240px;
    height: 240px;
    right: -24px;
    bottom: -12px;
  }
}
</style>
