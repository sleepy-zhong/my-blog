<template>
  <div>
    <div v-if="comments.length" class="space-y-6">
      <div v-for="comment in comments" :key="comment.CommentID" class="bg-white/80 rounded-lg shadow p-4">
        <div class="flex items-center gap-2 mb-2">
          <span class="font-bold text-blue-600">{{ comment.AuthorName || '匿名' }}</span>
          <span class="text-gray-400 text-xs">{{ comment.CreatedAt }}</span>
        </div>
        <div class="text-gray-700 mb-2">{{ comment.Content }}</div>
        <div class="flex gap-4 text-xs">
          <button v-if="canReply" @click="$emit('reply', comment)">回复</button>
          <button v-if="canDelete(comment)" @click="$emit('delete', comment)">删除</button>
        </div>
        <div v-if="comment.Children && comment.Children.length" class="ml-6 mt-2 border-l-2 border-blue-100 pl-4">
          <CommentList :comments="comment.Children" :can-reply="canReply" :can-delete="canDelete" @reply="$emit('reply', $event)" @delete="$emit('delete', $event)" />
        </div>
      </div>
    </div>
    <div v-else class="text-gray-400">暂无评论</div>
    <Pagination v-if="totalPages > 1" :page="page" :totalPages="totalPages" @update:page="$emit('update:page', $event)" />
  </div>
</template>

<script setup>
import Pagination from './Pagination.vue'
const props = defineProps({
  comments: { type: Array, default: () => [] },
  page: { type: Number, default: 1 },
  totalPages: { type: Number, default: 1 },
  canReply: { type: Boolean, default: true },
  canDelete: { type: Function, default: () => false },
})
const emit = defineEmits(['reply', 'delete', 'update:page'])
</script> 
