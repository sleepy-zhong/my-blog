<template>
  <div class="min-h-screen flex flex-col bg-gray-50">
    <Navbar />
    <!-- 全局 Loading -->
    <div v-if="showLoading" class="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div class="bg-white rounded-lg px-8 py-4 shadow-lg flex items-center gap-3">
        <svg class="animate-spin h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
        <span class="text-blue-600 font-semibold">{{ loadingText }}</span>
      </div>
    </div>
    <!-- 全局 Message -->
    <div v-if="showMessage" class="fixed top-6 left-1/2 -translate-x-1/2 z-50">
      <div :class="['px-6 py-3 rounded shadow-lg font-semibold',
        messageType === 'success' ? 'bg-green-100 text-green-700 border border-green-300' :
        messageType === 'error' ? 'bg-red-100 text-red-700 border border-red-300' :
        'bg-blue-100 text-blue-700 border border-blue-300']">
        <span>{{ messageText }}</span>
        <button class="ml-4 text-xs text-gray-400 hover:text-gray-600" @click="closeMessage">关闭</button>
      </div>
    </div>
    <main class="flex-1 flex justify-center px-4">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import Navbar from './components/Navbar.vue'
import { useLoadingStore, useMessageStore, useUserStore } from './store/user'
import { computed, onMounted } from 'vue'

const loadingStore = useLoadingStore()
const messageStore = useMessageStore()
const userStore = useUserStore()

const showLoading = computed(() => loadingStore.loading)
const loadingText = computed(() => loadingStore.loadingText)
const showMessage = computed(() => messageStore.visible)
const messageText = computed(() => messageStore.message)
const messageType = computed(() => messageStore.type)

function closeMessage() {
  messageStore.hide()
}

onMounted(async () => {
  if (userStore.token && !userStore.user) {
    await userStore.fetchUser()
    console.log('[App.vue] 自动拉取userStore.user:', userStore.user)
    console.log('[App.vue] 自动拉取userStore.token:', userStore.token)

  }
})
</script> 