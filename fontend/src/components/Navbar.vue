<template>
  <nav class="bg-white shadow w-screen">
    <div class="flex justify-between items-center py-3 w-full">
      <router-link to="/" class="text-xl font-bold text-blue-600 flex items-center gap-2 ml-4">
        <img :src="homeIcon" alt="首页" class="w-7 h-7" />
        MyBlog
      </router-link>
      <div class="flex gap-8 items-center mr-4">
        <router-link to="/" class="flex flex-col items-center text-xs transition-transform duration-200 hover:scale-125" :class="isActive('/') ? 'text-blue-500' : 'hover:text-blue-500'">
          <img :src="isActive('/') ? homeActiveIcon : homeIcon" alt="首页" class="w-7 h-7 mb-1" />
          首页
        </router-link>
        <router-link to="/posts" class="flex flex-col items-center text-xs transition-transform duration-200 hover:scale-125" :class="isActive('/posts') ? 'text-blue-500' : 'hover:text-blue-500'">
          <img :src="isActive('/posts') ? essayActiveIcon : essayIcon" alt="文章" class="w-7 h-7 mb-1" />
          文章
        </router-link>
        <!-- 文章发布链接（管理员权限） -->
        <router-link v-if="isLogin && canPublish" to="/publish" class="flex flex-col items-center text-xs transition-transform duration-200 hover:scale-125" :class="isActive('/publish') ? 'text-blue-500' : 'hover:text-blue-500'">
          <img :src="isActive('/publish') ? publishActiveIcon : publishIcon" alt="发布" class="w-7 h-7 mb-1" />
          发布
        </router-link>
        <router-link to="/login" v-if="!isLogin" class="flex flex-col items-center text-xs transition-transform duration-200 hover:scale-125" :class="isActive('/login') ? 'text-blue-500' : 'hover:text-blue-500'">
          <img :src="isActive('/login') ? loginActiveIcon : loginIcon" alt="登录" class="w-7 h-7 mb-1" />
          登录
        </router-link>
        <router-link v-if="isLogin && canAccessAdmin" to="/admin" class="flex flex-col items-center text-xs transition-transform duration-200 hover:scale-125" :class="isActive('/admin') ? 'text-blue-500' : 'hover:text-blue-500'">
          <img :src="isActive('/admin') ? adminActiveIcon : adminIcon" alt="后台" class="w-7 h-7 mb-1" />
          后台
        </router-link>
        <!-- 用户信息入口 -->
        <div v-if="isLogin" ref="profileRoot" class="relative group ml-8 flex items-center gap-4">
          <button @click="showProfile = !showProfile" class="flex items-center gap-4 focus:outline-none">
             <img :src="(userStore.user?.AvatarURL && (userStore.user.AvatarURL.startsWith('http') ? userStore.user.AvatarURL : avatarBase + (userStore.user.AvatarURL.startsWith('/') ? userStore.user.AvatarURL : '/' + userStore.user.AvatarURL))) || defaultAvatar"
                 alt="头像"
                 class="w-14 h-14 rounded-full border-4 border-blue-300 shadow-lg object-cover transition-transform duration-200 hover:scale-150" />
            <span class="font-bold text-blue-800 text-xl drop-shadow-sm tracking-wide">{{ userStore.user?.DisplayName || userStore.user?.Username }}</span>
            <svg class="w-5 h-5 text-gray-400 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
          </button>
          <!-- 下拉菜单 -->
          <div v-if="showProfile" class="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border z-[60] py-2 animate-fade-in">
            <button @click="openProfilePanel('profile')" class="w-full text-left px-4 py-2 hover:bg-blue-50 text-blue-700">个人信息</button>
            <button @click="openProfilePanel('password')" class="w-full text-left px-4 py-2 hover:bg-blue-50 text-blue-700">修改密码</button>
            <button @click="openProfilePanel('email')" class="w-full text-left px-4 py-2 hover:bg-blue-50 text-blue-700">邮箱设置</button>
            <router-link to="/login" class="block px-4 py-2 hover:bg-blue-50 text-red-500" @click="logout">退出登录</router-link>
          </div>
        </div>
      </div>
    </div>
    <!-- 个人信息弹窗 -->
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

const userStore = useUserStore()
const route = useRoute()

const isLogin = computed(() => userStore.token && userStore.user)
const roles = computed(() => userStore.user?.Roles || [])
const adminRoles = ['admin', 'superadmin', 'editor']
const canAccessAdmin = computed(() => roles.value.some(r => adminRoles.includes(r)))
const canPublish = computed(() => roles.value.some(r => ['admin', 'superadmin', 'editor', 'author'].includes(r)))

const showProfile = ref(false)
const profileRoot = ref(null)
const profilePanelVisible = ref(false)
const baseURL = window.location.origin
const avatarBase = import.meta?.env?.VITE_API_BASE_URL || 'http://localhost:3000'

// 检查当前路由是否激活
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

// 点击外部时关闭下拉
function handleDocumentClick(event) {
  const rootEl = profileRoot.value
  if (!rootEl) return
  const targetNode = event.target
  if (targetNode && !rootEl.contains(targetNode)) {
    showProfile.value = false
  }
}

// 键盘 ESC 关闭
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

// 路由切换时关闭下拉
watch(() => route.fullPath, () => {
  showProfile.value = false
})
</script>

<style scoped>
.group:hover .group-hover\:block { display: block; }
.animate-fade-in { animation: fadeIn 0.2s; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: none; } }
.user-avatar {
  box-shadow: 0 4px 16px 0 rgba(59,130,246,0.15), 0 1.5px 4px 0 rgba(59,130,246,0.10);
}
</style> 