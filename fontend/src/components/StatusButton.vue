<template>
  <transition name="fade">
    <div v-if="visible" :class="[
      'fixed left-1/2 top-20 z-50 px-6 py-3 rounded-xl shadow-lg flex items-center gap-3 font-semibold',
      status === 'success' ? 'bg-green-100 text-green-700 border border-green-300' :
      status === 'error' ? 'bg-red-100 text-red-700 border border-red-300' :
      'bg-blue-100 text-blue-700 border border-blue-300'
    ]" style="transform: translateX(-50%); min-width: 180px;">
      <svg v-if="status==='success'" class="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
      <svg v-else-if="status==='error'" class="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
      <svg v-else class="w-6 h-6 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
      <span>{{ text }}</span>
    </div>
  </transition>
</template>

<script setup>
import { ref, watch, onUnmounted, toRefs } from 'vue'
const props = defineProps({
  status: { type: String, default: 'success' }, // success | error | loading
  text: { type: String, default: '' },
  show: { type: Boolean, default: false }
})
const { status, text, show } = toRefs(props)
const visible = ref(show.value)
let timer = null
watch([show, status, text], ([val]) => {
  visible.value = val
  if (val && status.value !== 'loading') {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => { visible.value = false }, 2000)
  }
})
onUnmounted(() => { if (timer) clearTimeout(timer) })
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style> 