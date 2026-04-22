<template>
  <nav class="nav-outer">
    <div class="nav-panel">
      <router-link to="/" class="brand-link">
        <span class="brand-badge">
          <img :src="homeActiveIcon" alt="首页" class="brand-icon" />
        </span>
        <span class="brand-text">MyBlog</span>
      </router-link>

      <div class="nav-links scrollbar-none">
        <router-link to="/" class="nav-link" :class="{ active: isActive('/') }">
          <img :src="isActive('/') ? homeActiveIcon : homeIcon" alt="首页" class="nav-icon" :class="isActive('/') ? 'icon-active' : 'icon-muted'" />
          <span>首页</span>
        </router-link>

        <router-link to="/posts" class="nav-link" :class="{ active: isActive('/posts') }">
          <img :src="isActive('/posts') ? essayActiveIcon : essayIcon" alt="文章" class="nav-icon" :class="isActive('/posts') ? 'icon-active' : 'icon-muted'" />
          <span>文章</span>
        </router-link>

        <router-link
          v-if="isLogin && canPublish"
          to="/publish"
          class="nav-link"
          :class="{ active: isActive('/publish') }"
        >
          <img :src="isActive('/publish') ? publishActiveIcon : publishIcon" alt="发布" class="nav-icon" :class="isActive('/publish') ? 'icon-active' : 'icon-muted'" />
          <span>发布</span>
        </router-link>

        <router-link
          v-if="!isLogin"
          to="/login"
          class="nav-link"
          :class="{ active: isActive('/login') }"
        >
          <img :src="isActive('/login') ? loginActiveIcon : loginIcon" alt="登录" class="nav-icon" :class="isActive('/login') ? 'icon-active' : 'icon-muted'" />
          <span>登录</span>
        </router-link>

        <router-link
          v-if="isLogin && canAccessAdmin"
          to="/admin"
          class="nav-link"
          :class="{ active: isActive('/admin') }"
        >
          <img :src="isActive('/admin') ? adminActiveIcon : adminIcon" alt="后台" class="nav-icon" :class="isActive('/admin') ? 'icon-active' : 'icon-muted'" />
          <span>后台</span>
        </router-link>
      </div>

      <div v-if="isLogin" ref="profileRoot" class="profile-root">
        <button @click="showProfile = !showProfile" class="profile-trigger">
          <img
            :src="currentUserAvatarSrc"
            alt="头像"
            class="profile-avatar"
            @error="onProfileAvatarError"
          />
          <span class="profile-name">{{ userStore.user?.DisplayName || userStore.user?.Username }}</span>
          <svg class="profile-arrow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <div v-if="showProfile" class="profile-menu animate-fade-in">
          <button @click="openProfilePanel('profile')" class="profile-menu-item">个人信息</button>
          <button @click="openProfilePanel('password')" class="profile-menu-item">修改密码</button>
          <button @click="openProfilePanel('email')" class="profile-menu-item">邮箱设置</button>
          <router-link to="/login" class="profile-menu-item danger" @click="logout">退出登录</router-link>
        </div>
      </div>
    </div>

    <ProfilePanel v-if="profilePanelVisible" :initial-tab="initialTab" @close="profilePanelVisible = false" />
  </nav>
</template>

<script setup>
import homeIcon from '../assets/icons/home .png'
import homeActiveIcon from '../assets/icons/home-active.png'
import essayIcon from '../assets/icons/essay.png'
import essayActiveIcon from '../assets/icons/essay-active.png'
import loginIcon from '../assets/icons/login.png'
import loginActiveIcon from '../assets/icons/login-active.png'
import adminIcon from '../assets/icons/back-end.png'
import adminActiveIcon from '../assets/icons/back-end-active.png'
import publishIcon from '../assets/icons/publish.png'
import publishActiveIcon from '../assets/icons/publish-active.png'
import { useUserStore } from '@/store/user'
import { computed, ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRoute } from 'vue-router'
import defaultAvatar from '../assets/icons/login-active.png'
import ProfilePanel from './ProfilePanel.vue'
import { resolveAvatarUrl } from '@/utils/avatar'

const userStore = useUserStore()
const route = useRoute()

const isLogin = computed(() => userStore.isLogin)
const roles = computed(() => userStore.user?.Roles || [])
const adminRoles = ['admin', 'editor']
const canAccessAdmin = computed(() => roles.value.some(r => adminRoles.includes(r)))
const canPublish = computed(() => roles.value.some(r => ['admin', 'editor', 'author'].includes(r)))

const showProfile = ref(false)
const profileRoot = ref(null)
const profilePanelVisible = ref(false)
const currentUserAvatarSrc = computed(() => {
  return resolveAvatarUrl(userStore.user?.AvatarURL) || defaultAvatar
})

function isActive(path) {
  if (path === '/') {
    return route.path === '/'
  }
  return route.path.startsWith(path)
}

const initialTab = ref('profile')

function openProfilePanel(tab = 'profile') {
  showProfile.value = false
  initialTab.value = tab
  profilePanelVisible.value = true
}

function logout() {
  userStore.logout()
  showProfile.value = false
  profilePanelVisible.value = false
}

function onProfileAvatarError(event) {
  if (event?.target) {
    event.target.src = defaultAvatar
  }
}

function handleDocumentClick(event) {
  const rootEl = profileRoot.value
  if (!rootEl) return
  const targetNode = event.target
  if (targetNode && !rootEl.contains(targetNode)) {
    showProfile.value = false
  }
}

function handleKeydown(event) {
  if (event.key === 'Escape') {
    showProfile.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleDocumentClick)
  document.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick)
  document.removeEventListener('keydown', handleKeydown)
})

watch(() => route.fullPath, () => {
  showProfile.value = false
})
</script>

<style scoped>
.nav-outer {
  position: sticky;
  top: 0;
  z-index: 40;
  width: 100%;
  margin: 0;
  padding: 10px 0;
  background:
    radial-gradient(circle at 15% 18%, color-mix(in srgb, var(--accent) 24%, transparent), transparent 18%),
    radial-gradient(circle at 82% 12%, color-mix(in srgb, var(--accent-2) 18%, transparent), transparent 18%),
    radial-gradient(circle at 50% 75%, color-mix(in srgb, var(--accent-3) 10%, transparent), transparent 22%),
    linear-gradient(145deg, color-mix(in srgb, var(--bg-1) 96%, transparent), color-mix(in srgb, var(--bg-2) 94%, transparent) 48%, color-mix(in srgb, var(--bg-3) 98%, transparent));
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(14px);
}

.nav-outer::before {
  content: "";
  position: absolute;
  inset: auto 0 0 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--accent) 60%, transparent), transparent);
  opacity: 0.7;
}

.nav-panel {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 18px;
  width: min(1320px, calc(100vw - 18px));
  margin: 0 auto;
  padding: 10px 18px;
  position: relative;
  z-index: 1;
}

.brand-link {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  justify-self: start;
  padding: 8px 14px 8px 8px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  background: var(--panel-soft);
  color: var(--text);
  text-decoration: none;
  white-space: nowrap;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.14);
  transition: transform 180ms ease, background 180ms ease, border-color 180ms ease, box-shadow 180ms ease;
}

.brand-link:hover {
  transform: translateY(-1px);
  border-color: color-mix(in srgb, var(--accent) 34%, transparent);
  background: color-mix(in srgb, var(--accent) 12%, transparent);
  box-shadow: 0 16px 34px color-mix(in srgb, var(--glow) 35%, transparent);
}

.brand-badge {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 14px;
  background: linear-gradient(135deg, color-mix(in srgb, var(--accent) 32%, transparent), color-mix(in srgb, var(--accent-2) 26%, transparent));
  box-shadow: 0 14px 28px color-mix(in srgb, var(--glow) 50%, transparent);
}

.brand-icon {
  width: 20px;
  height: 20px;
}

.brand-text {
  font-size: 18px;
  font-weight: 800;
  letter-spacing: -0.03em;
}

.nav-links {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  min-width: 0;
  overflow-x: auto;
  overflow-y: hidden;
  white-space: nowrap;
  scroll-snap-type: x proximity;
}

.nav-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex: 0 0 auto;
  padding: 10px 14px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: var(--panel-soft);
  color: var(--muted);
  text-decoration: none;
  font-size: 14px;
  font-weight: 700;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.02);
  scroll-snap-align: start;
  transition: transform 180ms ease, background 180ms ease, border-color 180ms ease, color 180ms ease, box-shadow 180ms ease;
}

.nav-link:hover {
  transform: translateY(-1px);
  color: var(--text);
  border-color: color-mix(in srgb, var(--accent) 28%, transparent);
  background: color-mix(in srgb, var(--accent) 10%, transparent);
  box-shadow: 0 12px 26px rgba(0, 0, 0, 0.16);
}

.nav-link.active {
  color: var(--text);
  border-color: color-mix(in srgb, var(--accent) 36%, transparent);
  background: linear-gradient(135deg, color-mix(in srgb, var(--accent) 18%, transparent), color-mix(in srgb, var(--accent-2) 12%, transparent));
  box-shadow: 0 14px 30px color-mix(in srgb, var(--glow) 32%, transparent);
}

.nav-icon {
  width: 18px;
  height: 18px;
  object-fit: contain;
  flex: 0 0 auto;
}

.icon-muted {
  filter: brightness(0) invert(1);
  opacity: 0.82;
}

.icon-active {
  filter: drop-shadow(0 0 10px rgba(120, 163, 255, 0.32));
}

.profile-root {
  position: relative;
  flex: 0 0 auto;
  justify-self: end;
}

.profile-trigger {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px 8px 8px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  background: var(--panel-soft);
  color: var(--text);
  cursor: pointer;
  max-width: 100%;
  transition: transform 180ms ease, background 180ms ease, border-color 180ms ease;
}

.profile-trigger:hover {
  transform: translateY(-1px);
  border-color: color-mix(in srgb, var(--accent) 28%, transparent);
  background: color-mix(in srgb, var(--accent) 10%, transparent);
}

.profile-avatar {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  border: 3px solid color-mix(in srgb, var(--accent) 58%, transparent);
  object-fit: cover;
  box-shadow: 0 8px 22px color-mix(in srgb, var(--glow) 40%, transparent);
}

.profile-name {
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 15px;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.profile-arrow {
  width: 18px;
  height: 18px;
  color: var(--muted);
  flex: 0 0 auto;
}

.profile-menu {
  position: absolute;
  right: 0;
  top: calc(100% + 10px);
  width: 220px;
  padding: 8px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 18px;
  background: color-mix(in srgb, var(--panel-strong) 96%, transparent);
  backdrop-filter: blur(18px);
  box-shadow: 0 22px 52px rgba(0, 0, 0, 0.28);
}

.profile-menu-item {
  display: block;
  width: 100%;
  padding: 10px 12px;
  border: 0;
  border-radius: 12px;
  background: transparent;
  color: var(--text);
  text-align: left;
  text-decoration: none;
  cursor: pointer;
  transition: background 180ms ease, color 180ms ease;
}

.profile-menu-item:hover {
  background: color-mix(in srgb, var(--accent) 14%, transparent);
  color: var(--text);
}

.profile-menu-item.danger {
  color: var(--danger);
}

.scrollbar-none {
  scrollbar-width: none;
}

.scrollbar-none::-webkit-scrollbar {
  display: none;
}

.animate-fade-in {
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 1024px) {
  .nav-panel {
    width: calc(100vw - 24px);
    gap: 16px;
  }

  .nav-links {
    gap: 12px;
  }
}

@media (max-width: 900px) {
  .nav-outer {
    padding: 8px 0;
  }

  .nav-panel {
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 12px;
    width: calc(100vw - 16px);
    padding: 8px 14px 10px;
  }

  .nav-links {
    grid-column: 1 / -1;
    justify-content: flex-start;
    padding-top: 4px;
  }

  .profile-name {
    max-width: 110px;
  }

  .profile-menu {
    width: min(220px, calc(100vw - 24px));
  }
}

@media (max-width: 720px) {
  .nav-panel {
    padding: 10px 12px;
  }

  .nav-links {
    justify-content: flex-start;
  }

  .brand-text {
    font-size: 16px;
  }

  .nav-link {
    padding: 9px 12px;
    font-size: 13px;
  }

  .profile-name {
    max-width: 120px;
  }
}

@media (max-width: 560px) {
  .nav-outer {
    padding: 6px 0;
  }

  .nav-panel {
    display: flex;
    align-items: center;
    gap: 6px;
    width: calc(100vw - 10px);
    padding: 7px 8px;
  }

  .brand-link {
    flex: 0 0 auto;
    padding: 4px;
    border-radius: 12px;
  }

  .brand-text {
    display: none;
  }

  .brand-badge {
    width: 34px;
    height: 34px;
    border-radius: 12px;
  }

  .brand-icon {
    width: 18px;
    height: 18px;
  }

  .nav-links {
    flex: 1 1 auto;
    min-width: 0;
    gap: 6px;
    padding-top: 0;
    justify-content: flex-start;
  }

  .nav-link {
    gap: 6px;
    padding: 6px 8px;
    font-size: 11px;
    border-radius: 11px;
  }

  .nav-icon {
    width: 14px;
    height: 14px;
  }

  .profile-trigger {
    flex: 0 0 auto;
    gap: 8px;
    padding: 3px 5px 3px 3px;
    border-radius: 12px;
  }

  .profile-avatar {
    width: 30px;
    height: 30px;
  }

  .profile-name {
    display: none;
  }

  .profile-arrow {
    width: 16px;
    height: 16px;
  }
}

@media (max-width: 390px) {
  .nav-panel {
    width: calc(100vw - 8px);
    gap: 4px;
    padding: 6px 6px;
  }

  .nav-links {
    gap: 4px;
  }

  .nav-link {
    gap: 4px;
    padding: 6px 7px;
    font-size: 10px;
  }

  .nav-icon {
    width: 12px;
    height: 12px;
  }

  .brand-badge {
    width: 32px;
    height: 32px;
  }

  .profile-avatar {
    width: 30px;
    height: 30px;
  }

  .profile-trigger {
    padding: 3px 5px 3px 3px;
  }
}
</style>
