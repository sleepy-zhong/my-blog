<template>
  <div class="min-h-screen w-full bg-gradient-to-br from-blue-100 to-pink-100 py-10">
    <div class="max-w-6xl mx-auto">
      <!-- 顶部标题 -->
      <div class="flex items-center gap-4 mb-8">
        <svg class="h-10 w-10 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        <h1 class="text-4xl font-extrabold text-blue-700 tracking-tight">管理后台</h1>
      </div>
      <div class="text-lg text-blue-700 mb-8 font-semibold">欢迎进入博客后台管理系统！请选择左侧功能模块进行管理。</div>
      <!-- 功能卡片区 -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <router-link v-for="item in modules" :key="item.path" :to="item.path" class="group bg-white/90 rounded-2xl shadow-xl p-6 flex flex-col items-center hover:-translate-y-1 hover:shadow-2xl transition cursor-pointer border border-blue-100">
          <div class="mb-3">
            <component :is="item.icon" class="h-10 w-10 text-blue-500 group-hover:text-pink-400 transition" />
          </div>
          <div class="text-xl font-bold text-blue-700 mb-1">{{ item.label }}</div>
          <div class="text-gray-500 text-sm text-center">{{ item.desc }}</div>
        </router-link>
      </div>
      <!-- 可扩展区 -->
      <div class="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="bg-white/80 rounded-xl shadow p-6">
          <div class="text-lg font-bold mb-2 text-blue-600">系统公告</div>
          <div class="text-gray-500">暂无公告</div>
        </div>
        <div class="bg-white/80 rounded-xl shadow p-6">
          <div class="text-lg font-bold mb-2 text-blue-600">快捷入口</div>
          <div class="flex flex-wrap gap-3">
            <router-link v-for="item in quickLinks" :key="item.path" :to="item.path" class="btn-primary px-4 py-2 text-sm">{{ item.label }}</router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const modules = [
  { path: '/admin/users', label: '用户管理', desc: '管理系统用户账号', icon: 'i-heroicons-user' },
  { path: '/admin/roles', label: '角色管理', desc: '分配和管理角色', icon: 'i-heroicons-shield-check' },
  { path: '/admin/articles', label: '文章管理', desc: '管理博客文章', icon: 'i-heroicons-document-text' },
  { path: '/admin/comments', label: '评论管理', desc: '审核和管理评论', icon: 'i-heroicons-chat-bubble-left-right' },
  { path: '/admin/categories', label: '分类管理', desc: '管理文章分类', icon: 'i-heroicons-folder' },
  { path: '/admin/tags', label: '标签管理', desc: '管理文章标签', icon: 'i-heroicons-tag' },
  { path: '/admin/attachments', label: '附件管理', desc: '管理上传文件', icon: 'i-heroicons-paper-clip' },
  { path: '/admin/logs', label: '日志管理', desc: '系统操作日志', icon: 'i-heroicons-clipboard-document-list' },
  { path: '/admin/settings', label: '系统设置', desc: '站点和全局设置', icon: 'i-heroicons-cog-6-tooth' },
]
const quickLinks = [
  { path: '/admin/articles', label: '新建文章' },
  { path: '/admin/users', label: '添加用户' },
  { path: '/admin/settings', label: '系统设置' },
]
</script> 

<style scoped>
.btn-primary {
  @apply bg-blue-500 text-white rounded px-3 py-1 hover:bg-blue-600 transition font-bold shadow;
}
</style> 