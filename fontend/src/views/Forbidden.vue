<template>
  <div class="forbidden-page">
    <div class="forbidden-card">
      <span class="forbidden-kicker">Access Locked</span>
      <div class="forbidden-code">403</div>
      <div class="forbidden-text">当前账号没有访问这个页面的权限</div>
      <div class="forbidden-actions">
        <button class="btn-primary action-btn" @click="goHome">返回首页</button>
        <button class="btn-secondary action-btn" @click="goLogin">切换账号</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter, useRoute } from 'vue-router'
import { useUserStore, useMessageStore } from '@/store/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const messageStore = useMessageStore()

function goHome() {
  router.push('/')
}

async function goLogin() {
  await userStore.logout()
  messageStore.show('请登录具有访问权限的账号', 'info')
  const redirect = typeof route.query.from === 'string' ? route.query.from : '/'
  router.push({ path: '/login', query: { redirect } })
}
</script>

<style scoped>
.forbidden-page {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: calc(100vh - 160px);
}

.forbidden-card {
  width: min(560px, 100%);
  padding: 32px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 28px;
  background: var(--panel);
  color: var(--text);
  backdrop-filter: blur(18px);
  box-shadow: 0 18px 48px rgba(0, 0, 0, 0.24);
  text-align: center;
}

.forbidden-kicker {
  display: inline-flex;
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(255, 147, 183, 0.12);
  color: var(--danger);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.forbidden-code {
  margin-top: 20px;
  font-size: clamp(64px, 11vw, 110px);
  font-weight: 900;
  line-height: 1;
  letter-spacing: -0.06em;
}

.forbidden-text {
  margin-top: 16px;
  color: var(--muted);
  font-size: 18px;
}

.forbidden-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 24px;
}

.action-btn {
  min-width: 132px;
}

@media (max-width: 640px) {
  .forbidden-actions {
    flex-direction: column;
  }
}
</style>
