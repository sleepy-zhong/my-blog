<template>
  <div class="w-full h-[70vh] flex items-center justify-center">
    <div class="text-center">
      <div class="text-6xl font-extrabold text-red-500 mb-4">403</div>
      <div class="text-xl text-gray-700 mb-6">无权限访问该页面</div>
      <div class="flex items-center justify-center gap-3">
        <button class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600" @click="goHome">返回首页</button>
        <button class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200" @click="goLogin">切换账号</button>
      </div>
    </div>
  </div>
  
</template>

<script setup>
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/store/user'
import { useMessageStore } from '@/store/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const messageStore = useMessageStore()

function goHome() {
  router.push('/')
}

function goLogin() {
  userStore.clearToken()
  messageStore.show('请登录具有访问权限的账户', 'info')
  const redirect = typeof route.query.from === 'string' ? route.query.from : '/'
  router.push({ path: '/login', query: { redirect } })
}
</script>

<style scoped>
</style>

