<template>
  <div class="app-shell min-h-screen flex flex-col" :data-theme="themeStore.activeTheme" :style="themeStyleVars">
    <div class="app-backdrop" aria-hidden="true">
      <div class="app-aurora"></div>
      <div class="app-grid"></div>
      <span class="app-orb orb-a"></span>
      <span class="app-orb orb-b"></span>
      <span class="app-orb orb-c"></span>
      <span class="app-beam beam-a"></span>
      <span class="app-beam beam-b"></span>
      <span
        v-for="particle in backdropParticles"
        :key="particle.id"
        class="app-spark"
        :style="particle.style"
      ></span>
    </div>

    <Navbar />

    <div v-if="showLoading" class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div class="floating-panel loading-panel">
        <svg class="animate-spin h-6 w-6" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        <span>{{ loadingText }}</span>
      </div>
    </div>

    <div v-if="showMessage" class="fixed top-6 left-1/2 z-50 -translate-x-1/2 px-4">
      <div class="floating-panel message-panel" :class="messageType || 'info'">
        <span>{{ messageText }}</span>
        <button class="message-close" @click="closeMessage">关闭</button>
      </div>
    </div>

    <main class="app-main flex-1 flex justify-center" :class="isHomePage ? 'px-0' : 'px-3 sm:px-4 lg:px-6'">
      <router-view v-slot="{ Component, route: currentRoute }">
        <Transition name="page-fade" mode="out-in">
          <div :key="currentRoute.fullPath" class="route-stage w-full" :class="{ 'theme-adapt': currentRoute.path !== '/' }">
            <component :is="Component" />
          </div>
        </Transition>
      </router-view>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRoute } from 'vue-router'
import Navbar from './components/Navbar.vue'
import { AUTH_EXPIRED_EVENT, useLoadingStore, useMessageStore, useUserStore } from './store/user'
import { useVisualThemeStore } from './store/visualTheme'
import { themeVars } from './theme/visualTheme'

const loadingStore = useLoadingStore()
const messageStore = useMessageStore()
const userStore = useUserStore()
const themeStore = useVisualThemeStore()
const route = useRoute()

const backdropParticles = Array.from({ length: 16 }, (_, index) => ({
  id: index,
  style: {
    left: `${6 + index * 6.2}%`,
    top: `${8 + (index % 5) * 18}%`,
    '--spark-delay': `${(index % 7) * 0.8}s`,
    '--spark-duration': `${6 + (index % 4) * 1.2}s`,
    '--spark-size': `${2 + (index % 3) * 1.5}px`
  }
}))

const showLoading = computed(() => loadingStore.loading)
const loadingText = computed(() => loadingStore.loadingText)
const showMessage = computed(() => messageStore.visible)
const messageText = computed(() => messageStore.message)
const messageType = computed(() => messageStore.type)
const isHomePage = computed(() => route.path === '/')
const themeStyleVars = computed(() => themeVars[themeStore.activeTheme])

function closeMessage() {
  messageStore.hide()
}

function handleAuthExpired() {
  userStore.clearToken()
}

watch(() => themeStore.activeTheme, () => {
  themeStore.syncDocumentTheme()
}, { immediate: true })

onMounted(async () => {
  window.addEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired as EventListener)
  if (!userStore.sessionReady) {
    try {
      await userStore.initSession()
    } catch (_error) {
      // 忽略首次会话恢复失败。
    }
  }
})

onBeforeUnmount(() => {
  window.removeEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired as EventListener)
})
</script>

<style scoped>
.app-shell {
  position: relative;
  overflow-x: clip;
  overflow-y: visible;
  color: var(--text);
  background: linear-gradient(145deg, var(--bg-1) 0%, var(--bg-2) 48%, var(--bg-3) 100%);
}

.app-main,
.route-stage {
  position: relative;
  z-index: 2;
}

.app-main {
  width: 100%;
  padding-bottom: 32px;
}

.app-backdrop {
  position: fixed;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
}

.app-aurora,
.app-grid,
.app-orb,
.app-beam,
.app-spark {
  position: absolute;
}

.app-aurora {
  inset: 0;
  background:
    radial-gradient(circle at 18% 18%, color-mix(in srgb, var(--accent) 28%, transparent), transparent 22%),
    radial-gradient(circle at 82% 12%, color-mix(in srgb, var(--accent-2) 22%, transparent), transparent 18%),
    radial-gradient(circle at 52% 74%, color-mix(in srgb, var(--accent-3) 14%, transparent), transparent 24%);
  filter: blur(16px);
}

.app-grid {
  inset: 0;
  background-image:
    linear-gradient(to right, color-mix(in srgb, var(--line) 75%, transparent) 1px, transparent 1px),
    linear-gradient(to bottom, color-mix(in srgb, var(--line) 75%, transparent) 1px, transparent 1px);
  background-size: 48px 48px;
  mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.75), transparent 92%);
  opacity: 0.36;
}

.app-orb {
  width: 34vw;
  height: 34vw;
  min-width: 260px;
  min-height: 260px;
  border-radius: 50%;
  filter: blur(18px);
  opacity: 0.32;
  animation: orbitFloat 18s ease-in-out infinite;
}

.orb-a {
  top: -8vw;
  left: -8vw;
  background: radial-gradient(circle, color-mix(in srgb, var(--accent) 46%, transparent), transparent 68%);
}

.orb-b {
  top: 16vh;
  right: -10vw;
  background: radial-gradient(circle, color-mix(in srgb, var(--accent-2) 38%, transparent), transparent 70%);
  animation-delay: -6s;
}

.orb-c {
  bottom: -12vw;
  left: 24vw;
  background: radial-gradient(circle, color-mix(in srgb, var(--accent-3) 32%, transparent), transparent 72%);
  animation-delay: -11s;
}

.app-beam {
  width: 48vw;
  height: 48vw;
  border-radius: 50%;
  border: 1px solid color-mix(in srgb, var(--line-strong) 90%, transparent);
  opacity: 0.25;
}

.beam-a {
  top: 14vh;
  left: -12vw;
  animation: spinSlow 28s linear infinite;
}

.beam-b {
  right: -14vw;
  bottom: 6vh;
  border-style: dashed;
  animation: spinSlow 34s linear infinite reverse;
}

.app-spark {
  width: var(--spark-size);
  height: var(--spark-size);
  border-radius: 999px;
  background: linear-gradient(135deg, var(--accent), var(--accent-3));
  box-shadow: 0 0 18px var(--glow);
  animation: sparkPulse var(--spark-duration) ease-in-out infinite;
  animation-delay: var(--spark-delay);
}

.floating-panel {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  background: rgba(8, 12, 26, 0.82);
  color: var(--text);
  backdrop-filter: blur(18px);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.28);
}

.loading-panel {
  padding: 18px 22px;
}

.message-panel {
  padding: 14px 18px;
}

.message-panel.success {
  border-color: color-mix(in srgb, var(--success) 55%, transparent);
}

.message-panel.error {
  border-color: color-mix(in srgb, var(--danger) 55%, transparent);
}

.message-panel.info {
  border-color: color-mix(in srgb, var(--accent) 55%, transparent);
}

.message-close {
  border: 0;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
  transition: color 180ms ease;
}

.message-close:hover {
  color: var(--text);
}

.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity 320ms ease, transform 320ms ease;
}

.page-fade-enter-from,
.page-fade-leave-to {
  opacity: 0;
  transform: translateY(12px);
}

@keyframes orbitFloat {
  0%, 100% {
    transform: translate3d(0, 0, 0) scale(1);
  }
  50% {
    transform: translate3d(0, -18px, 0) scale(1.06);
  }
}

@keyframes spinSlow {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes sparkPulse {
  0%, 100% {
    opacity: 0.16;
    transform: scale(0.9);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.45);
  }
}

@media (max-width: 720px) {
  .message-panel {
    width: min(100%, 92vw);
  }

  .loading-panel {
    width: min(92vw, 360px);
    justify-content: center;
  }

  .app-main {
    padding-bottom: 24px;
  }
}
</style>
