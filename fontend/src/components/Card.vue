<template>
  <div class="app-card">
    <div v-if="$slots.header || title" class="app-card-header">
      <h2 v-if="title" class="app-card-title">{{ title }}</h2>
      <slot name="header" />
    </div>
    <div class="app-card-body">
      <slot />
    </div>
    <div v-if="$slots.footer" class="app-card-footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ title?: string }>()
</script>

<style scoped>
.app-card {
  position: relative;
  overflow: hidden;
  z-index: 1;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 24px;
  background: var(--panel);
  color: var(--text);
  backdrop-filter: blur(18px);
  box-shadow: 0 18px 48px rgba(0, 0, 0, 0.24);
  transition: transform 220ms ease, box-shadow 220ms ease, border-color 220ms ease;
}

.app-card::before,
.app-card::after {
  content: "";
  position: absolute;
  pointer-events: none;
}

.app-card::before {
  inset: -30% auto -30% -24%;
  width: 36%;
  background: linear-gradient(120deg, transparent 0 18%, rgba(255, 255, 255, 0.04) 28%, color-mix(in srgb, var(--accent) 28%, transparent) 44%, rgba(255, 255, 255, 0.18) 50%, color-mix(in srgb, var(--accent-2) 24%, transparent) 62%, transparent 100%);
  transform: translateX(-180%) skewX(-18deg);
  opacity: 0.5;
  mix-blend-mode: screen;
  animation: cardSweep 8.8s ease-in-out infinite;
}

.app-card::after {
  left: 18px;
  right: 18px;
  top: 0;
  height: 1px;
  background: linear-gradient(90deg, color-mix(in srgb, var(--accent) 74%, white), color-mix(in srgb, var(--accent-2) 74%, transparent));
  box-shadow: 0 0 16px color-mix(in srgb, var(--accent) 18%, transparent);
}

.app-card:focus-within {
  z-index: 40;
}

.app-card:hover,
.app-card:focus-within {
  transform: translateY(-6px);
  border-color: color-mix(in srgb, var(--accent) 34%, transparent);
  box-shadow:
    0 28px 72px rgba(0, 0, 0, 0.32),
    0 0 28px color-mix(in srgb, var(--accent) 10%, transparent);
}

.app-card-header,
.app-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 18px;
  border-color: rgba(255, 255, 255, 0.08);
}

.app-card-header {
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.app-card-footer {
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.app-card-title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: var(--text);
}

.app-card-body {
  padding: 18px;
  overflow: visible;
}

@keyframes cardSweep {
  0% {
    transform: translateX(-180%) skewX(-18deg);
  }
  44%, 100% {
    transform: translateX(320%) skewX(-18deg);
  }
}

@media (max-width: 768px) {
  .app-card {
    border-radius: 20px;
  }

  .app-card-header,
  .app-card-footer {
    padding: 14px 16px;
    align-items: stretch;
  }

  .app-card-body {
    padding: 16px;
  }
}

@media (max-width: 520px) {
  .app-card {
    border-radius: 18px;
  }
}
</style>
