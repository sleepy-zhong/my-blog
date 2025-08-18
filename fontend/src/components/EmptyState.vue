<template>
  <div class="py-16 text-center text-gray-500">
    <div class="text-5xl mb-3">😶</div>
    <div class="text-sm">{{ message || '暂无数据' }}</div>
    <div class="mt-4" v-if="$slots.action">
      <slot name="action" />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ message?: string }>()
</script>

<style scoped>
</style>

