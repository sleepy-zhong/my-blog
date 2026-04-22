<template>
  <div v-if="totalPages > 1" class="pagination">
    <button @click="prev" :disabled="page === 1" class="pagination-btn nav-btn">
      上一页
    </button>
    <button
      v-for="item in pageItems"
      :key="item.key"
      @click="typeof item.value === 'number' && go(item.value)"
      :disabled="item.value === 'ellipsis'"
      :class="[
        'pagination-btn',
        item.value === page ? 'is-active' : '',
        item.value === 'ellipsis' ? 'is-ellipsis' : ''
      ]"
    >
      {{ item.label }}
    </button>
    <button @click="next" :disabled="page === totalPages" class="pagination-btn nav-btn">
      下一页
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ page?: number; totalPages?: number }>()
const emit = defineEmits<{
  (event: 'update:page', page: number): void
}>()

function go(page: number) {
  emit('update:page', page)
}

function prev() {
  if ((props.page || 1) > 1) go((props.page || 1) - 1)
}

function next() {
  if ((props.page || 1) < (props.totalPages || 1)) go((props.page || 1) + 1)
}

const pageItems = computed(() => {
  const currentPage = Number(props.page || 1)
  const totalPages = Number(props.totalPages || 1)
  const items: Array<{ key: string; value: number | 'ellipsis'; label: string }> = []

  const pushPage = (value: number) => {
    items.push({ key: `page-${value}`, value, label: String(value) })
  }

  const pushEllipsis = (suffix: string) => {
    items.push({ key: `ellipsis-${suffix}`, value: 'ellipsis', label: '...' })
  }

  if (totalPages <= 7) {
    for (let page = 1; page <= totalPages; page += 1) pushPage(page)
    return items
  }

  pushPage(1)

  if (currentPage > 3) {
    pushEllipsis('start')
  }

  const start = Math.max(2, currentPage - 1)
  const end = Math.min(totalPages - 1, currentPage + 1)
  for (let page = start; page <= end; page += 1) {
    pushPage(page)
  }

  if (currentPage < totalPages - 2) {
    pushEllipsis('end')
  }

  pushPage(totalPages)
  return items
})
</script>

<style scoped>
.pagination {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  margin-top: 1.5rem;
}

.pagination-btn {
  min-width: 40px;
  min-height: 40px;
  padding: 0 12px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.04);
  color: var(--text);
  cursor: pointer;
  transition:
    transform 160ms ease,
    border-color 160ms ease,
    background 160ms ease,
    opacity 160ms ease;
}

.pagination-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  border-color: color-mix(in srgb, var(--accent) 32%, transparent);
}

.pagination-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.pagination-btn.is-active {
  background: linear-gradient(135deg, rgba(120, 163, 255, 0.92), rgba(255, 123, 176, 0.76));
  color: #fff;
  border-color: transparent;
  box-shadow: 0 14px 30px rgba(120, 163, 255, 0.18);
}

.pagination-btn.is-ellipsis {
  pointer-events: none;
}

.nav-btn {
  min-width: 84px;
}

@media (max-width: 640px) {
  .pagination {
    gap: 6px;
  }

  .pagination-btn {
    min-height: 38px;
    padding: 0 10px;
    border-radius: 10px;
    font-size: 13px;
  }

  .nav-btn {
    min-width: 72px;
  }
}
</style>
