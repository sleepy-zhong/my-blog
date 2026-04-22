<template>
  <div>
    <div v-if="posts.length" class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <div v-for="post in posts" :key="post.PostID || post.id" class="bg-white rounded-lg shadow p-4 flex flex-col">
        <router-link :to="`/posts/${post.PostID || post.id}`" class="text-lg font-semibold text-blue-600 hover:underline mb-2">{{ post.Title || post.title }}</router-link>
        <div class="text-gray-500 text-sm mb-2">{{ post.CreatedAt || post.date }}</div>
        <div class="flex-1 text-gray-700 line-clamp-3">{{ post.Excerpt || post.summary }}</div>
      </div>
    </div>
    <div v-else class="text-gray-400">暂无文章</div>
  </div>
</template>

<script setup>
const props = defineProps({ posts: { type: Array, default: () => [] } })
</script> 
