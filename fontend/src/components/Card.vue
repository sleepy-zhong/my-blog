<template>
  <div class="bg-white rounded-lg shadow border border-gray-200">
    <div v-if="$slots.header || title" class="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
      <h2 class="text-base font-semibold text-gray-800" v-if="title">{{ title }}</h2>
      <slot name="header" />
    </div>
    <div class="p-4">
      <slot />
    </div>
    <div v-if="$slots.footer" class="px-4 py-3 border-t border-gray-200">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ title?: string }>()
</script>

<style scoped>
</style>

