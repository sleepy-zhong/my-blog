<template>
  <div class="flex h-screen w-screen bg-gradient-to-br from-blue-100 to-pink-100">
    <aside class="w-60 bg-white shadow-lg border-r border-gray-200">
      <nav class="flex flex-col gap-2 p-4">
        <router-link v-for="item in menu" :key="item.path" :to="item.path" class="py-2 px-4 rounded hover:bg-blue-50" active-class="bg-blue-100 text-blue-600 font-bold">
          {{ item.label }}
        </router-link>
      </nav>
    </aside>
    <main class="flex-1 min-w-0 overflow-auto">
      <div class="w-full min-h-full space-y-4">
        <Breadcrumb />
        <router-view />
      </div>
    </main>
  </div>
</template>

<script setup>
import Breadcrumb from '@/components/Breadcrumb.vue'
const menu = [
  { path: '/admin', label: '仪表盘' },
  { path: '/admin/users', label: '用户管理' },
  { path: '/admin/roles', label: '角色管理' },
  { path: '/admin/articles', label: '文章管理' },
  { path: '/admin/comments', label: '评论管理' },
  { path: '/admin/categories', label: '分类管理' },
  { path: '/admin/tags', label: '标签管理' },
  { path: '/admin/attachments', label: '附件管理' },
  { path: '/admin/logs', label: '日志管理' },
  { path: '/admin/settings', label: '系统设置' },
]
</script> 