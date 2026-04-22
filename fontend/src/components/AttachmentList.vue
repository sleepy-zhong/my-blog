<template>
  <div>
    <div v-if="attachments.length" class="space-y-4">
      <div v-for="file in attachments" :key="file.AttachmentID" class="flex items-center gap-4 bg-white/80 rounded shadow p-3">
        <span class="truncate flex-1">{{ file.OriginalName }}</span>
        <a :href="file.FilePath" target="_blank" class="text-blue-500 hover:underline">下载</a>
        <button v-if="canDelete(file)" @click="$emit('delete', file)" class="text-red-500 hover:underline">删除</button>
      </div>
    </div>
    <div v-else class="text-gray-400">暂无附件</div>
  </div>
</template>

<script setup>
const props = defineProps({
  attachments: { type: Array, default: () => [] },
  canDelete: { type: Function, default: () => false },
})
const emit = defineEmits(['delete'])
</script> 
