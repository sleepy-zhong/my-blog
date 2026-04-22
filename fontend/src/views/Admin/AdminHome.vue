<template>
  <div class="admin-home w-full py-6 sm:py-10">
    <div class="max-w-6xl mx-auto px-1 sm:px-0">
      <!-- 顶部标题 -->
      <div class="admin-home-head flex flex-col items-start gap-4 sm:flex-row sm:items-center mb-8">
        <svg class="h-10 w-10 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        <h1 class="text-4xl font-extrabold text-blue-700 tracking-tight">管理后台</h1>
      </div>
      <div class="text-lg text-blue-700 mb-8 font-semibold">欢迎进入博客后台管理系统！请选择左侧功能模块进行管理。</div>
      <!-- 功能卡片区 -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <router-link v-for="item in modules" :key="item.path" :to="item.path" class="module-card group bg-white/90 rounded-2xl shadow-xl p-6 flex flex-col items-center hover:-translate-y-1 hover:shadow-2xl transition cursor-pointer border border-blue-100">
          <div class="mb-3">
            <component :is="item.icon" class="h-10 w-10 text-blue-500 group-hover:text-pink-400 transition" />
          </div>
          <div class="text-xl font-bold text-blue-700 mb-1">{{ item.label }}</div>
          <div class="text-gray-500 text-sm text-center">{{ item.desc }}</div>
        </router-link>
      </div>
      <!-- 可扩展区 -->
      <div class="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="info-card bg-white/80 rounded-xl shadow p-6">
          <div class="text-lg font-bold mb-2 text-blue-600">系统公告</div>
          <div class="text-gray-500">暂无公告</div>
        </div>
        <div class="info-card bg-white/80 rounded-xl shadow p-6">
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
  { path: '/admin/home-cats', label: '首页猫猫', desc: '管理首页猫猫图片和文案', icon: 'i-heroicons-photo' },
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
.admin-home {
  position: relative;
  min-height: 100%;
}

.admin-home::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(circle at 16% 14%, rgba(120, 163, 255, 0.12), transparent 20%),
    radial-gradient(circle at 78% 12%, rgba(255, 123, 176, 0.1), transparent 18%);
}

.admin-home > .max-w-6xl {
  position: relative;
  z-index: 1;
}

.admin-home-head {
  position: relative;
  overflow: hidden;
  padding: 18px 22px;
  border-radius: 24px;
  background: linear-gradient(180deg, rgba(11, 17, 35, 0.7), rgba(8, 12, 26, 0.58));
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 22px 56px rgba(0, 0, 0, 0.22);
}

.admin-home-head::after {
  content: "";
  position: absolute;
  inset: -28% auto -28% -18%;
  width: 28%;
  background: linear-gradient(120deg, transparent 0 18%, rgba(255, 255, 255, 0.05) 28%, rgba(120, 163, 255, 0.28) 48%, rgba(255, 123, 176, 0.18) 66%, transparent 100%);
  transform: translateX(-180%) skewX(-18deg);
  opacity: 0.46;
  mix-blend-mode: screen;
  pointer-events: none;
  animation: adminSweep 8.8s ease-in-out infinite;
}

.module-card,
.info-card {
  position: relative;
  overflow: hidden;
}

.module-card::before,
.info-card::before {
  content: "";
  position: absolute;
  inset: -28% auto -28% -18%;
  width: 32%;
  background: linear-gradient(120deg, transparent 0 18%, rgba(255, 255, 255, 0.05) 28%, rgba(120, 163, 255, 0.24) 48%, rgba(255, 123, 176, 0.18) 66%, transparent 100%);
  transform: translateX(-180%) skewX(-18deg);
  opacity: 0.5;
  mix-blend-mode: screen;
  pointer-events: none;
  animation: adminSweep 8.2s ease-in-out infinite;
}

.module-card:nth-child(2n)::before,
.info-card:nth-child(2n)::before {
  animation-delay: -2.6s;
}

.module-card {
  transition: transform 220ms ease, box-shadow 220ms ease, border-color 220ms ease;
}

.module-card:hover {
  transform: translateY(-8px) scale(1.01) !important;
  border-color: rgba(120, 163, 255, 0.22) !important;
  box-shadow:
    0 26px 70px rgba(0, 0, 0, 0.28) !important,
    0 0 30px rgba(120, 163, 255, 0.08) !important;
}

.btn-primary {
  @apply bg-blue-500 text-white rounded px-3 py-1 hover:bg-blue-600 transition font-bold shadow;
}

@keyframes adminSweep {
  0% {
    transform: translateX(-180%) skewX(-18deg);
  }
  46%, 100% {
    transform: translateX(340%) skewX(-18deg);
  }
}

@media (max-width: 640px) {
  .admin-home {
    padding-top: 0.5rem;
    padding-bottom: 0.75rem;
  }

  .admin-home > .max-w-6xl {
    padding-left: 0.25rem;
    padding-right: 0.25rem;
  }

  .admin-home-head {
    padding: 10px 12px;
    border-radius: 18px;
    margin-bottom: 0.625rem;
  }

  .admin-home h1 {
    font-size: 1.25rem;
    line-height: 1.55rem;
  }

  .admin-home .text-lg.text-blue-700 {
    display: none;
  }

  .admin-home .grid.grid-cols-1.sm\:grid-cols-2.lg\:grid-cols-3 {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0.4rem;
  }

  .module-card {
    min-height: 72px;
    padding: 0.5rem 0.35rem !important;
    border-radius: 0.95rem !important;
    justify-content: center;
  }

  .module-card .text-xl {
    margin-bottom: 0;
    font-size: 0.7rem;
    line-height: 1rem;
    text-align: center;
  }

  .module-card .text-gray-500 {
    display: none;
  }

  .module-card .h-10.w-10 {
    width: 1.25rem;
    height: 1.25rem;
  }

  .admin-home .mt-10.grid {
    margin-top: 0.625rem;
    gap: 0.5rem;
  }

  .info-card {
    padding: 0.625rem !important;
    border-radius: 0.95rem !important;
  }

  .info-card .text-lg {
    font-size: 0.85rem;
  }

  .info-card .btn-primary {
    min-height: 36px;
    padding: 0 0.625rem;
    font-size: 12px;
  }
}

@media (max-width: 390px) {
  .admin-home {
    padding-top: 0.5rem;
    padding-bottom: 0.75rem;
  }

  .admin-home-head {
    padding: 10px 12px;
    border-radius: 16px;
  }

  .admin-home h1 {
    font-size: 1.1rem;
    line-height: 1.4rem;
  }

  .module-card,
  .info-card {
    padding: 10px;
    border-radius: 16px;
  }

  .admin-home .grid.grid-cols-1.sm\:grid-cols-2.lg\:grid-cols-3 {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .module-card .text-xl {
    font-size: 0.62rem;
    line-height: 0.9rem;
  }

  .info-card:first-child {
    display: none;
  }
}
</style>
