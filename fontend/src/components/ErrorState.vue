<template>
  <div class="py-16 text-center text-red-500">
    <div class="text-5xl mb-3">⚠️</div>
    <div class="text-sm">{{ message || '加载失败' }}</div>
    <div class="mt-4">
      <button type="button" class="px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700" @click="$emit('retry')">重试</button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ message?: string }>()
defineEmits<{ (e: 'retry'): void }>()
</script>

<style scoped>
</style>

