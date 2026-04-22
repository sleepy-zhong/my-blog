<template>
  <Teleport to="body">
    <div class="profile-overlay" @click.self="emit('close')">
      <div class="profile-overlay-shell">
        <div class="profile-dialog animate-fade-in">
          <button class="close-btn" @click="emit('close')">×</button>

          <div class="profile-layout">
            <aside class="profile-side">
              <label class="avatar-stage">
                <img
                  :src="avatarSrc"
                  class="avatar-image"
                  @error="onAvatarImageError"
                />
                <input type="file" accept="image/*" class="hidden" @change="onAvatarChange" />
                <span class="avatar-chip">更换头像</span>
              </label>

              <div class="identity-block">
                <strong>{{ user.DisplayName || user.Username }}</strong>
                <span>UID: {{ user.UserID }}</span>
              </div>

              <div class="tab-list">
                <button class="tab-btn" :class="{ active: tab === 'profile' }" @click="tab = 'profile'">基本信息</button>
                <button class="tab-btn" :class="{ active: tab === 'password' }" @click="tab = 'password'">修改密码</button>
                <button class="tab-btn" :class="{ active: tab === 'email' }" @click="tab = 'email'">邮箱设置</button>
              </div>
            </aside>

            <section class="profile-main">
              <header class="panel-head">
                <span class="panel-kicker">Profile Console</span>
                <h2>{{ panelTitle }}</h2>
                <p>{{ panelDescription }}</p>
              </header>

              <form v-if="tab === 'profile'" @submit.prevent="onSave" class="panel-form">
                <label class="field">
                  <span class="field-label">昵称</span>
                  <input v-model="form.displayName" class="input" placeholder="请输入昵称" />
                </label>

                <label class="field">
                  <span class="field-label">邮箱</span>
                  <input v-model="form.email" class="input" placeholder="请输入邮箱" disabled />
                </label>

                <label class="field">
                  <span class="field-label">手机号</span>
                  <input v-model="form.phoneNumber" class="input" placeholder="请输入手机号" />
                </label>

                <label class="field">
                  <span class="field-label">个人简介</span>
                  <textarea v-model="form.bio" class="input textarea" rows="4" placeholder="介绍一下自己"></textarea>
                </label>

                <div class="form-actions">
                  <button type="button" class="btn-secondary action-btn" @click="emit('close')">取消</button>
                  <button type="submit" class="btn-primary action-btn" :disabled="loading">{{ loading ? '保存中...' : '保存' }}</button>
                </div>
              </form>

              <form v-if="tab === 'password'" @submit.prevent="onChangePassword" class="panel-form">
                <label class="field">
                  <span class="field-label">当前密码</span>
                  <input v-model="passwordForm.oldPassword" type="password" class="input" required autocomplete="current-password" />
                </label>

                <label class="field">
                  <span class="field-label">新密码</span>
                  <input v-model="passwordForm.newPassword" type="password" class="input" required autocomplete="new-password" />
                </label>

                <label class="field">
                  <span class="field-label">确认新密码</span>
                  <input v-model="passwordForm.confirm" type="password" class="input" required autocomplete="new-password" />
                </label>

                <div class="field-row">
                  <label class="field field-grow">
                    <span class="field-label">邮箱验证码</span>
                    <input
                      v-model="passwordForm.code"
                      type="text"
                      class="input"
                      maxlength="10"
                      required
                      placeholder="请输入邮箱验证码"
                    />
                  </label>
                  <button
                    type="button"
                    class="btn-secondary action-btn"
                    :disabled="loading || sendingPasswordCode || passwordCodeCountdown > 0"
                    @click="onSendChangePasswordCode"
                  >
                    {{ sendingPasswordCode ? '发送中...' : passwordCodeCountdown > 0 ? `${passwordCodeCountdown}s 后重发` : '发送验证码' }}
                  </button>
                </div>

                <div class="form-actions">
                  <button type="button" class="btn-secondary action-btn" @click="emit('close')">取消</button>
                  <button type="submit" class="btn-primary action-btn" :disabled="loading">{{ loading ? '保存中...' : '保存' }}</button>
                </div>
              </form>

              <form v-if="tab === 'email'" @submit.prevent="onChangeEmail" class="panel-form">
                <label class="field">
                  <span class="field-label">当前邮箱</span>
                  <input :value="user.Email || '-'" class="input" disabled />
                </label>

                <label class="field">
                  <span class="field-label">新邮箱</span>
                  <input v-model="emailForm.email" type="email" class="input" required placeholder="请输入新邮箱" />
                </label>

                <div class="form-actions">
                  <button type="button" class="btn-secondary action-btn" @click="emit('close')">取消</button>
                  <button type="submit" class="btn-primary action-btn" :disabled="loading">{{ loading ? '保存中...' : '保存' }}</button>
                </div>
              </form>
            </section>
          </div>

          <StatusButton :status="statusType" :text="statusText" :show="showStatus" />
        </div>
      </div>
    </div>
  </Teleport>

  <Teleport to="body">
    <div v-if="showCropper" class="cropper-overlay" @click.self="onCropCancel">
      <div class="cropper-shell">
        <div class="cropper-dialog animate-fade-in">
          <div class="cropper-head">
            <div>
              <span class="panel-kicker">Avatar Cropper</span>
              <h3>裁剪头像</h3>
            </div>
            <button class="close-btn cropper-close" @click="onCropCancel">×</button>
          </div>

          <div class="cropper-body">
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
              :fixed-number="[1, 1]"
              :can-move="true"
              :center-box="true"
              :can-scale="true"
              :full="false"
              class="cropper-view"
            />
          </div>

          <div class="form-actions cropper-actions">
            <button class="btn-secondary action-btn" @click="onCropCancel">取消</button>
            <button class="btn-primary action-btn" @click="onCropConfirm">确定裁剪</button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { VueCropper } from 'vue-cropper'
import 'vue-cropper/dist/index.css'
import StatusButton from '@/components/StatusButton.vue'
import defaultAvatar from '../assets/icons/login-active.png'
import { sendChangePasswordCode, updateProfile, updatePassword, updateEmail } from '@/api/user'
import { useUserStore } from '@/store/user'
import { resolveAvatarUrl } from '@/utils/avatar'

const props = defineProps({
  initialTab: { type: String, default: 'profile' }
})

const emit = defineEmits(['close'])
const router = useRouter()
const userStore = useUserStore()

const user = computed(() => userStore.user || {})
const loading = ref(false)
const avatarPreview = ref('')
const showCropper = ref(false)
const cropperImg = ref('')
const cropperRef = ref(null)

const tab = ref(props.initialTab || 'profile')
watch(() => props.initialTab, (value) => {
  tab.value = value || 'profile'
})

const avatarSrc = computed(() => {
  if (avatarPreview.value) return avatarPreview.value
  return resolveAvatarUrl(user.value.AvatarURL) || defaultAvatar
})

function onAvatarImageError(event) {
  if (event?.target) {
    event.target.src = defaultAvatar
  }
}

const panelTitle = computed(() => {
  if (tab.value === 'password') return '修改密码'
  if (tab.value === 'email') return '邮箱设置'
  return '基本信息'
})

const panelDescription = computed(() => {
  if (tab.value === 'password') return '更新当前账号密码，保存后立即生效。'
  if (tab.value === 'email') return '修改收件邮箱，后续通知会发送到新的地址。'
  return '编辑昵称、手机号、个人简介和头像，统一使用当前主题样式。'
})

const form = ref({
  displayName: '',
  email: '',
  phoneNumber: '',
  bio: '',
  avatarFile: null
})

watch(user, (value) => {
  form.value.displayName = value.DisplayName || ''
  form.value.email = value.Email || ''
  form.value.phoneNumber = value.PhoneNumber || ''
  form.value.bio = value.Bio || ''
}, { immediate: true })

const passwordForm = ref({
  oldPassword: '',
  newPassword: '',
  confirm: '',
  code: ''
})

const sendingPasswordCode = ref(false)
const passwordCodeCountdown = ref(0)
let passwordCodeTimer = 0

const emailForm = ref({
  email: ''
})

const showStatus = ref(false)
const statusType = ref('success')
const statusText = ref('')

function showStatusMsg(type, text) {
  statusType.value = type
  statusText.value = text
  showStatus.value = true
  window.setTimeout(() => {
    showStatus.value = false
  }, 2000)
}

async function onChangePassword() {
  if (!passwordForm.value.oldPassword || !passwordForm.value.newPassword) {
    return showStatusMsg('error', '请输入完整信息')
  }
  if (passwordForm.value.newPassword !== passwordForm.value.confirm) {
    return showStatusMsg('error', '两次输入的新密码不一致')
  }
  if (!passwordForm.value.code) {
    return showStatusMsg('error', '请输入邮箱验证码')
  }

  loading.value = true
  try {
    const res = await updatePassword({
      oldPassword: passwordForm.value.oldPassword,
      newPassword: passwordForm.value.newPassword,
      code: passwordForm.value.code
    })
    if (res.code === 0) {
      showStatusMsg('success', res.message || '密码已更新，请重新登录')
      passwordForm.value = { oldPassword: '', newPassword: '', confirm: '', code: '' }
      userStore.clearToken()
      window.setTimeout(() => {
        emit('close')
        router.push('/login')
      }, 600)
    } else {
      showStatusMsg('error', res.message || '修改失败')
    }
  } catch (e) {
    showStatusMsg('error', e?.response?.data?.message || '修改失败')
  } finally {
    loading.value = false
  }
}

function clearPasswordCodeTimer() {
  passwordCodeCountdown.value = 0
  if (passwordCodeTimer) {
    window.clearInterval(passwordCodeTimer)
    passwordCodeTimer = 0
  }
}

function startPasswordCodeTimer(seconds = 60) {
  clearPasswordCodeTimer()
  passwordCodeCountdown.value = seconds
  passwordCodeTimer = window.setInterval(() => {
    if (passwordCodeCountdown.value <= 1) {
      clearPasswordCodeTimer()
      return
    }
    passwordCodeCountdown.value -= 1
  }, 1000)
}

async function onSendChangePasswordCode() {
  if (loading.value || sendingPasswordCode.value || passwordCodeCountdown.value > 0) return

  sendingPasswordCode.value = true
  try {
    const res = await sendChangePasswordCode()
    if (res.code === 0) {
      startPasswordCodeTimer()
      showStatusMsg('success', res.message || '验证码已发送')
    } else {
      showStatusMsg('error', res.message || '发送失败')
    }
  } catch (e) {
    showStatusMsg('error', e?.response?.data?.message || '发送失败')
  } finally {
    sendingPasswordCode.value = false
  }
}

function validEmail(email) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)
}

async function onChangeEmail() {
  if (!validEmail(emailForm.value.email)) {
    return showStatusMsg('error', '请输入正确的邮箱地址')
  }

  loading.value = true
  try {
    const res = await updateEmail({ email: emailForm.value.email })
    if (res.code === 0) {
      await userStore.fetchUser(true)
      showStatusMsg('success', '邮箱已更新')
      emailForm.value.email = ''
    } else {
      showStatusMsg('error', res.message || '更新失败')
    }
  } catch (e) {
    showStatusMsg('error', e?.response?.data?.message || '更新失败')
  } finally {
    loading.value = false
  }
}

function onAvatarChange(event) {
  const file = event.target?.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (loadEvent) => {
    cropperImg.value = loadEvent.target?.result || ''
    showCropper.value = true
  }
  reader.readAsDataURL(file)
}

function onCropConfirm() {
  cropperRef.value?.getCropBlob((blob) => {
    if (!blob) return
    avatarPreview.value = URL.createObjectURL(blob)
    form.value.avatarFile = new File([blob], 'avatar.jpg', { type: blob.type })
    showCropper.value = false
  })
}

function onCropCancel() {
  showCropper.value = false
  cropperImg.value = ''
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
    }

    const res = await updateProfile(formData)
    const userData = res.data?.data || res.data
    if ((res.data && res.data.code === 0) || userData?.UserID) {
      await userStore.fetchUser(true)
      showStatusMsg('success', '个人信息已更新')
      window.setTimeout(() => {
        loading.value = false
        emit('close')
      }, 800)
    } else {
      showStatusMsg('error', res.data?.message || '保存失败')
      loading.value = false
    }
  } catch (e) {
    showStatusMsg('error', e?.response?.data?.message || '保存失败')
    loading.value = false
  }
}

watch(() => showCropper.value, (opened) => {
  document.body.style.overflow = opened ? 'hidden' : ''
})

onBeforeUnmount(() => {
  document.body.style.overflow = ''
  clearPasswordCodeTimer()
  if (avatarPreview.value?.startsWith('blob:')) {
    URL.revokeObjectURL(avatarPreview.value)
  }
})
</script>

<style scoped>
.profile-overlay,
.cropper-overlay {
  position: fixed;
  inset: 0;
  z-index: 80;
  padding: 24px;
  background: rgba(2, 6, 20, 0.58);
  backdrop-filter: blur(10px);
  overflow-y: auto;
}

.cropper-overlay {
  z-index: 90;
}

.profile-overlay-shell,
.cropper-shell {
  min-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.profile-dialog,
.cropper-dialog {
  position: relative;
  width: min(980px, 100%);
  margin: auto;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 30px;
  background:
    radial-gradient(circle at 16% 14%, rgba(120, 163, 255, 0.14), transparent 20%),
    radial-gradient(circle at 82% 12%, rgba(255, 123, 176, 0.1), transparent 18%),
    color-mix(in srgb, var(--panel-strong) 96%, transparent);
  color: var(--text);
  box-shadow: 0 28px 80px rgba(0, 0, 0, 0.34);
  backdrop-filter: blur(22px);
}

.profile-dialog {
  max-height: min(860px, calc(100vh - 48px));
  overflow: auto;
  padding: 28px;
}

.cropper-dialog {
  width: min(560px, 100%);
  padding: 24px;
}

.profile-layout {
  display: grid;
  grid-template-columns: 290px minmax(0, 1fr);
  gap: 24px;
}

.profile-side {
  padding: 18px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.avatar-stage {
  position: relative;
  display: grid;
  place-items: center;
  width: 100%;
  min-height: 220px;
  padding: 18px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  cursor: pointer;
  overflow: hidden;
}

.avatar-stage::before {
  content: "";
  position: absolute;
  inset: auto auto 18px 18px;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(120, 163, 255, 0.28), transparent 70%);
  filter: blur(14px);
}

.avatar-image {
  position: relative;
  z-index: 1;
  width: 132px;
  height: 132px;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid rgba(120, 163, 255, 0.3);
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.24);
}

.avatar-chip {
  position: absolute;
  right: 16px;
  bottom: 16px;
  z-index: 1;
  padding: 9px 12px;
  border-radius: 999px;
  background: linear-gradient(135deg, rgba(120, 163, 255, 0.24), rgba(255, 123, 176, 0.18));
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--text);
  font-size: 12px;
  font-weight: 700;
}

.identity-block {
  margin-top: 16px;
  display: grid;
  gap: 6px;
}

.identity-block strong {
  font-size: 24px;
  line-height: 1.1;
  letter-spacing: -0.04em;
}

.identity-block span {
  color: var(--muted);
}

.tab-list {
  display: grid;
  gap: 10px;
  margin-top: 22px;
}

.tab-btn {
  width: 100%;
  padding: 13px 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.03);
  color: var(--muted);
  text-align: left;
  font-weight: 700;
  cursor: pointer;
  transition: transform 180ms ease, background 180ms ease, border-color 180ms ease, color 180ms ease;
}

.tab-btn:hover,
.tab-btn.active {
  transform: translateX(3px);
  background: linear-gradient(135deg, rgba(120, 163, 255, 0.16), rgba(255, 123, 176, 0.1));
  border-color: rgba(120, 163, 255, 0.24);
  color: var(--text);
}

.profile-main {
  min-width: 0;
  padding: 8px 6px 8px 0;
}

.panel-head {
  margin-bottom: 24px;
}

.panel-kicker {
  display: inline-flex;
  align-items: center;
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(120, 163, 255, 0.12);
  color: #bfd4ff;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.panel-head h2,
.cropper-head h3 {
  margin: 14px 0 10px;
  font-size: clamp(28px, 4vw, 42px);
  line-height: 1.02;
  letter-spacing: -0.05em;
}

.panel-head p {
  margin: 0;
  color: var(--muted);
  line-height: 1.8;
}

.panel-form {
  display: grid;
  gap: 16px;
}

.field {
  display: grid;
  gap: 8px;
}

.field-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 152px;
  gap: 12px;
  align-items: end;
}

.field-grow {
  min-width: 0;
}

.field-label {
  color: var(--muted);
  font-size: 14px;
  font-weight: 600;
}

.input {
  width: 100%;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.05);
  color: var(--text);
  padding: 14px 16px;
  outline: none;
  transition: border-color 180ms ease, box-shadow 180ms ease, background 180ms ease;
}

.input::placeholder {
  color: var(--muted);
}

.input:focus {
  border-color: rgba(120, 163, 255, 0.36);
  box-shadow: 0 0 0 3px rgba(120, 163, 255, 0.14);
}

.input:disabled {
  opacity: 0.78;
  cursor: not-allowed;
}

.textarea {
  resize: vertical;
  min-height: 120px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 8px;
}

.action-btn {
  min-width: 112px;
  padding: 12px 16px;
  border-radius: 16px;
  font-weight: 700;
  border: 1px solid transparent;
  cursor: pointer;
  transition: transform 180ms ease, opacity 180ms ease, border-color 180ms ease;
}

.action-btn:hover {
  transform: translateY(-1px);
}

.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: linear-gradient(135deg, rgba(120, 163, 255, 0.92), rgba(255, 123, 176, 0.82));
  color: #fff;
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.08);
  color: var(--text);
}

.close-btn {
  position: absolute;
  top: 18px;
  right: 18px;
  z-index: 2;
  width: 42px;
  height: 42px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.04);
  color: var(--muted);
  font-size: 26px;
  line-height: 1;
  cursor: pointer;
  transition: color 180ms ease, background 180ms ease, border-color 180ms ease;
}

.close-btn:hover {
  color: var(--text);
  background: rgba(120, 163, 255, 0.1);
  border-color: rgba(120, 163, 255, 0.24);
}

.cropper-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.cropper-close {
  position: static;
  flex: 0 0 auto;
}

.cropper-body {
  margin-top: 18px;
}

.cropper-view {
  width: 100%;
  height: 340px;
  border-radius: 22px;
  overflow: hidden;
}

.cropper-actions {
  margin-top: 18px;
}

.animate-fade-in {
  animation: fadeIn 0.22s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 900px) {
  .profile-overlay,
  .cropper-overlay {
    padding: 14px;
  }

  .profile-dialog {
    padding: 18px;
    max-height: calc(100vh - 28px);
  }

  .profile-layout {
    grid-template-columns: 1fr;
  }

  .profile-main {
    padding-right: 0;
  }
}

@media (max-width: 640px) {
  .form-actions {
    flex-direction: column;
  }

  .field-row {
    grid-template-columns: 1fr;
  }

  .action-btn {
    width: 100%;
  }

  .cropper-view {
    height: 280px;
  }
}
</style>
