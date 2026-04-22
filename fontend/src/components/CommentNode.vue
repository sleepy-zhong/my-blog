<template>
  <div class="comment-item">
    <!-- 主评论或回复 -->
    <div class="comment-body flex items-start gap-3 p-4 hover:bg-gray-50 transition-colors" 
         :class="{ 'border-l-2 border-blue-200 bg-blue-50/30': isReply }">
      <img :src="userAvatarSrc" class="w-10 h-10 rounded-full flex-shrink-0 object-cover"
           @error="onAvatarError" />
      <div class="flex-1 min-w-0">
        <div class="comment-head flex items-center gap-2 mb-2">
          <span class="font-semibold text-gray-900">{{ comment.User.DisplayName }}</span>
          <span class="text-xs text-gray-500">{{ formatTime(comment.CreatedAt) }}</span>
          <!-- 删除按钮 -->
          <button 
            v-if="canDelete(comment)"
            @click="handleDelete(comment)"
            class="ml-auto text-red-500 hover:text-red-700 text-sm transition-colors"
            title="删除评论"
          >
            删除
          </button>
        </div>
        
        <!-- 回复提示 - Twitter风格 -->
        <div v-if="comment.replyToUser" class="mb-2">
          <span class="text-sm text-blue-600 font-medium">回复 @{{ comment.replyToUser.DisplayName }}</span>
        </div>
        
        <div class="text-gray-800 mb-3 leading-relaxed">{{ comment.Content }}</div>
        
        <!-- 操作按钮 -->
        <div class="comment-actions flex items-center gap-4">
          <button 
            class="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors flex items-center gap-1"
            @click="$emit('reply', comment)"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"></path>
            </svg>
            回复
          </button>
          
          <!-- 回复数量显示 -->
          <span v-if="!isReply && replyCount > 0" class="text-xs text-gray-500">
            {{ replyCount }} 条回复
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useUserStore, useMessageStore } from '@/store/user'
import { deleteComment } from '@/api/comment'
import defaultAvatar from '@/assets/icons/login-active.png'
import { resolveAvatarUrl } from '@/utils/avatar'

defineOptions({ name: 'CommentNode' })

const props = defineProps({ 
  comment: {
    type: Object,
    required: true
  },
  isReply: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['reply', 'deleted'])

const userStore = useUserStore()
const messageStore = useMessageStore()

// 与导航保持一致：如果 AvatarURL 非 http，则拼接后端基址
const userAvatarSrc = computed(() => {
  return resolveAvatarUrl(props.comment?.User?.AvatarURL) || defaultAvatar
})

// 计算回复数量（仅对主评论有效）
const replyCount = computed(() => {
  if (props.isReply) return 0
  return props.comment?.children?.length || 0
})

function onAvatarError(event) {
  if (event?.target) {
    event.target.src = defaultAvatar
  }
}

// 检查是否可以删除评论
function canDelete(comment) {
  if (!userStore.isLogin) return false
  
  // 管理员可以删除任何评论
  if (Array.isArray(userStore.roles) && userStore.roles.includes('admin')) return true
  
  // 用户只能删除自己的评论
  return comment.UserID === userStore.user?.UserID
}

// 处理删除评论
async function handleDelete(comment) {
  if (!confirm('确定要删除这条评论吗？')) {
    return
  }
  
  try {
    const res = await deleteComment(comment.CommentID)
    if (res.code === 0) {
      messageStore.show('评论删除成功', 'success')
      emit('deleted', comment.CommentID)
    } else {
      messageStore.show(res.message || '删除失败', 'error')
    }
  } catch (error) {
    console.error('删除评论失败:', error)
    messageStore.show('删除失败', 'error')
  }
}

// 格式化时间
function formatTime(timeStr) {
  if (!timeStr) return ''
  
  const date = new Date(timeStr)
  const now = new Date()
  const diff = now - date
  
  // 小于1分钟
  if (diff < 60000) {
    return '刚刚'
  }
  
  // 小于1小时
  if (diff < 3600000) {
    return `${Math.floor(diff / 60000)}分钟前`
  }
  
  // 小于24小时
  if (diff < 86400000) {
    return `${Math.floor(diff / 3600000)}小时前`
  }
  
  // 小于30天
  if (diff < 2592000000) {
    return `${Math.floor(diff / 86400000)}天前`
  }
  
  // 超过30天显示具体日期
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}
</script>

<style scoped>
.comment-item {
  @apply relative;
}

.comment-item:not(:last-child)::after {
  content: '';
  @apply absolute left-6 top-full w-px h-4 bg-gray-200;
}

@media (max-width: 640px) {
  .comment-body {
    padding: 0.875rem 0.75rem;
    gap: 0.75rem;
  }

  .comment-head {
    flex-wrap: wrap;
  }

  .comment-actions {
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  .comment-item:not(:last-child)::after {
    left: 1.25rem;
  }
}
</style>
