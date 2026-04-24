<template>
  <div class="admin-layout">
    <button
      v-if="mobileMenuOpen"
      type="button"
      class="sidebar-backdrop"
      aria-label="关闭菜单"
      @click="mobileMenuOpen = false"
    ></button>

    <aside class="admin-sidebar" :class="{ 'is-open': mobileMenuOpen }">
      <div class="sidebar-head">
        <button type="button" class="sidebar-close" @click="mobileMenuOpen = false">×</button>
        <span class="sidebar-kicker">Control Dock</span>
        <h2>管理中枢</h2>
        <p>我的世界我做主。</p>
      </div>

      <nav class="sidebar-nav">
        <router-link
          v-for="item in menu"
          :key="item.path"
          :to="item.path"
          class="menu-link"
          active-class="is-active"
        >
          {{ item.label }}
        </router-link>
      </nav>
    </aside>

    <main class="admin-main">
      <div class="admin-mobile-bar">
        <button type="button" class="sidebar-toggle" @click="mobileMenuOpen = true">
          菜单
        </button>
        <span>管理导航</span>
      </div>

      <div class="admin-stage">
        <Breadcrumb class="admin-breadcrumb" />
        <div class="admin-content">
          <router-view />
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import Breadcrumb from '@/components/Breadcrumb.vue'

const route = useRoute()
const mobileMenuOpen = ref(false)

const menu = [
  { path: '/admin', label: '仪表盘' },
  { path: '/admin/users', label: '用户管理' },
  { path: '/admin/roles', label: '角色管理' },
  { path: '/admin/articles', label: '文章管理' },
  { path: '/admin/comments', label: '评论管理' },
  { path: '/admin/categories', label: '分类管理' },
  { path: '/admin/tags', label: '标签管理' },
  { path: '/admin/attachments', label: '附件管理' },
  { path: '/admin/home-cats', label: '首页猫猫' },
  { path: '/admin/logs', label: '日志管理' },
  { path: '/admin/settings', label: '系统设置' }
]

watch(() => route.fullPath, () => {
  mobileMenuOpen.value = false
})
</script>

<style scoped>
.admin-layout {
  position: relative;
  isolation: isolate;
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: 20px;
  width: 100%;
  min-height: calc(100vh - 108px);
  padding: 24px 0 40px;
}

.admin-layout::before,
.admin-layout::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.admin-layout::before {
  background:
    radial-gradient(circle at 12% 16%, rgba(120, 163, 255, 0.12), transparent 20%),
    radial-gradient(circle at 86% 12%, rgba(255, 123, 176, 0.1), transparent 18%);
  opacity: 0.88;
}

.admin-layout::after {
  background-image:
    repeating-linear-gradient(180deg, rgba(255, 255, 255, 0.018) 0 1px, transparent 1px 8px),
    linear-gradient(118deg, transparent 0 44%, rgba(255, 255, 255, 0.025) 50%, transparent 56%);
  opacity: 0.14;
}

.admin-sidebar,
.admin-stage {
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 28px;
  background: var(--panel);
  backdrop-filter: blur(18px);
  box-shadow: 0 18px 48px rgba(0, 0, 0, 0.24);
}

.admin-sidebar::before,
.admin-stage::before {
  content: "";
  position: absolute;
  inset: -30% auto -30% -18%;
  width: 28%;
  background: linear-gradient(120deg, transparent 0 18%, rgba(255, 255, 255, 0.05) 28%, rgba(120, 163, 255, 0.26) 48%, rgba(255, 123, 176, 0.18) 66%, transparent 100%);
  transform: translateX(-180%) skewX(-18deg);
  opacity: 0.48;
  mix-blend-mode: screen;
  pointer-events: none;
  animation: dockSweep 9s ease-in-out infinite;
}

.admin-stage::before {
  animation-delay: -2.8s;
}

.admin-sidebar {
  position: sticky;
  top: 92px;
  align-self: start;
  overflow: hidden;
  padding: 22px 18px;
  z-index: 30;
}

.sidebar-head {
  position: relative;
}

.sidebar-head h2 {
  margin: 12px 0 10px;
  font-size: 28px;
  letter-spacing: -0.05em;
}

.sidebar-head p {
  margin: 0;
  color: var(--muted);
  line-height: 1.8;
}

.sidebar-kicker {
  display: inline-flex;
  align-items: center;
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(120, 163, 255, 0.12);
  color: #bfd4ff;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.sidebar-nav {
  display: grid;
  gap: 10px;
  margin-top: 24px;
}

.menu-link {
  position: relative;
  overflow: hidden;
  display: block;
  padding: 14px 16px;
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(255, 255, 255, 0.03);
  color: var(--muted);
  text-decoration: none;
  font-weight: 700;
  transition: transform 180ms ease, background 180ms ease, border-color 180ms ease, color 180ms ease;
}

.menu-link::before {
  content: "";
  position: absolute;
  inset: -24% auto -24% -24%;
  width: 34%;
  background: linear-gradient(120deg, transparent 0 18%, rgba(255, 255, 255, 0.04) 28%, rgba(120, 163, 255, 0.24) 48%, rgba(255, 123, 176, 0.16) 66%, transparent 100%);
  transform: translateX(-180%) skewX(-18deg);
  opacity: 0.46;
  mix-blend-mode: screen;
  pointer-events: none;
  animation: dockSweep 7.8s ease-in-out infinite;
}

.menu-link:hover {
  transform: translateX(4px);
  background: rgba(120, 163, 255, 0.08);
  border-color: rgba(120, 163, 255, 0.22);
  color: var(--text);
}

.menu-link.is-active {
  background: linear-gradient(135deg, rgba(120, 163, 255, 0.18), rgba(255, 123, 176, 0.1));
  border-color: rgba(120, 163, 255, 0.28);
  color: var(--text);
  box-shadow: 0 16px 34px rgba(0, 0, 0, 0.18);
}

.admin-main {
  min-width: 0;
}

.admin-mobile-bar {
  display: none;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.admin-mobile-bar span {
  color: var(--muted);
  font-size: 14px;
}

.admin-stage {
  min-height: 100%;
  padding: 18px;
}

.admin-stage::after {
  content: "";
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(180deg, rgba(255, 255, 255, 0.03), transparent 20%, transparent 80%, rgba(255, 255, 255, 0.02)),
    repeating-linear-gradient(90deg, transparent 0 76px, rgba(255, 255, 255, 0.018) 76px 77px);
  opacity: 0.14;
  pointer-events: none;
}

.admin-content {
  position: relative;
  z-index: 1;
  width: 100%;
}

:deep(.admin-breadcrumb) {
  margin-bottom: 18px;
}

.sidebar-close,
.sidebar-toggle {
  display: none;
  align-items: center;
  justify-content: center;
  min-height: 42px;
  padding: 0 14px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.06);
  color: var(--text);
  cursor: pointer;
}

.sidebar-close {
  position: absolute;
  top: 0;
  right: 0;
  width: 42px;
  padding: 0;
  font-size: 28px;
  line-height: 1;
}

.sidebar-backdrop {
  display: none;
}

@keyframes dockSweep {
  0% {
    transform: translateX(-180%) skewX(-18deg);
  }
  46%, 100% {
    transform: translateX(340%) skewX(-18deg);
  }
}

@media (max-width: 1024px) {
  .admin-layout {
    gap: 14px;
  }

  .admin-stage {
    padding: 16px;
  }
}

@media (max-width: 960px) {
  .admin-layout {
    grid-template-columns: 1fr;
    gap: 12px;
    padding-top: 18px;
  }

  .admin-sidebar {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    width: min(320px, 86vw);
    max-height: 100dvh;
    border-radius: 0 28px 28px 0;
    transform: translateX(-110%);
    transition: transform 220ms ease;
    overflow-y: auto;
    overflow-x: hidden;
    overscroll-behavior: contain;
    -webkit-overflow-scrolling: touch;
    touch-action: pan-y;
    padding-top: 72px;
  }

  .sidebar-nav {
    padding-bottom: 24px;
  }

  .admin-sidebar.is-open {
    transform: translateX(0);
  }

  .sidebar-backdrop {
    display: block;
    position: fixed;
    inset: 0;
    z-index: 20;
    border: 0;
    background: rgba(2, 6, 18, 0.58);
  }

  .sidebar-close,
  .sidebar-toggle,
  .admin-mobile-bar {
    display: inline-flex;
  }

  .admin-mobile-bar {
    width: 100%;
  }

  .admin-stage {
    padding: 16px;
  }
}

@media (max-width: 640px) {
  .admin-layout {
    gap: 8px;
    padding-top: 10px;
    padding-bottom: 18px;
  }

  .admin-stage {
    padding: 10px;
    border-radius: 18px;
  }

  :deep(.admin-breadcrumb) {
    margin-bottom: 10px;
  }
}

@media (max-width: 390px) {
  .admin-sidebar {
    width: min(300px, calc(100vw - 18px));
  }

  .admin-mobile-bar {
    gap: 8px;
  }

  .sidebar-toggle,
  .sidebar-close {
    min-height: 38px;
    border-radius: 12px;
  }

  .admin-stage {
    padding: 12px;
  }
}
</style>
