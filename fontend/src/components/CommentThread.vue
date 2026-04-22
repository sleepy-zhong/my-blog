<template>
  <div class="comment-thread">
    <!-- 主评论 -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 mb-3">
      <CommentNode 
        :comment="mainComment" 
        :is-reply="false"
        @reply="handleReply" 
        @deleted="handleDeleted"
      />
    </div>

    <!-- 回复列表 - 扁平化显示 -->
    <div v-if="flattenedReplies.length > 0" class="reply-list ml-6 space-y-2">
      <div v-for="reply in displayedReplies" :key="reply.CommentID" 
           class="bg-white rounded-lg shadow-sm border border-gray-100">
        <CommentNode 
          :comment="reply" 
          :is-reply="true"
          @reply="handleReply" 
          @deleted="handleDeleted"
        />
      </div>
      
      <!-- 查看更多回复 -->
      <div v-if="flattenedReplies.length > replyDisplayLimit && !showAllReplies" 
           class="reply-toggle ml-6 py-2">
        <button 
          @click="showAllReplies = true"
          class="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
        >
          查看更多 {{ flattenedReplies.length - replyDisplayLimit }} 条回复
        </button>
      </div>
      
      <!-- 收起回复 -->
      <div v-if="showAllReplies && flattenedReplies.length > replyDisplayLimit" 
           class="reply-toggle ml-6 py-2">
        <button 
          @click="showAllReplies = false"
          class="text-gray-600 hover:text-gray-800 text-sm font-medium transition-colors"
        >
          收起回复
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import CommentNode from './CommentNode.vue'

const props = defineProps({
  comment: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['reply', 'deleted'])

const showAllReplies = ref(false)
const replyDisplayLimit = 3

// 主评论
const mainComment = computed(() => {
  // 添加回复数量信息到主评论
  return {
    ...props.comment,
    children: props.comment.children || []
  }
})

// 将所有嵌套回复扁平化，并添加回复关系信息
const flattenedReplies = computed(() => {
  if (!props.comment.children || props.comment.children.length === 0) {
    return []
  }
  
  const flattened = []
  // 构建一个ID到评论的映射，用于快速查找父评论
  const commentMap = new Map()
  
  // 主评论加入映射
  commentMap.set(props.comment.CommentID, props.comment)
  
  function flattenRecursive(comments, level = 1, parentComment = props.comment) {
    for (const comment of comments) {
      // 将当前评论加入映射
      commentMap.set(comment.CommentID, comment)
      
      // 确定回复目标用户
      let replyToUser = null
      if (level === 1) {
        // 一级回复直接回复主评论作者
        replyToUser = props.comment.User
      } else {
        // 多级回复：查找父评论作者
        if (comment.ParentCommentID && commentMap.has(comment.ParentCommentID)) {
          const parentComment = commentMap.get(comment.ParentCommentID)
          replyToUser = parentComment.User
        } else {
          // 如果找不到父评论，默认回复主评论作者
          replyToUser = props.comment.User
        }
      }
      
      // 为每个回复添加回复关系信息
      const processedComment = {
        ...comment,
        replyToUser
      }
      
      flattened.push(processedComment)
      
      // 递归处理子回复
      if (comment.children && comment.children.length > 0) {
        flattenRecursive(comment.children, level + 1, comment)
      }
    }
  }
  
  flattenRecursive(props.comment.children)
  
  // 按时间排序（最新的在前）
  return flattened.sort((a, b) => new Date(b.CreatedAt) - new Date(a.CreatedAt))
})

// 显示的回复列表
const displayedReplies = computed(() => {
  if (showAllReplies.value || flattenedReplies.value.length <= replyDisplayLimit) {
    return flattenedReplies.value
  }
  return flattenedReplies.value.slice(0, replyDisplayLimit)
})

function handleReply(comment) {
  emit('reply', comment)
}

function handleDeleted(commentId) {
  emit('deleted', commentId)
}
</script>

<style scoped>
.comment-thread {
  @apply mb-6;
}

@media (max-width: 640px) {
  .reply-list,
  .reply-toggle {
    margin-left: 0.75rem;
  }
}
</style>
