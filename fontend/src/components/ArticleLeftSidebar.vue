<template>
  <div class="sidebar-shell space-y-6">
    <div v-if="headings.length > 0" class="toc-card toc-shell rounded-xl p-6">
      <h3 class="text-lg font-semibold mb-4 text-gray-800 flex items-center">
        <svg class="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"/>
        </svg>
        文章目录
      </h3>
      <nav class="space-y-1">
        <a
          v-for="heading in headings"
          :key="heading.id"
          :href="`#${heading.id}`"
          :class="[
            'toc-item',
            activeHeadingId === heading.id ? 'active' : '',
            `level-${heading.level}`
          ]"
          :title="heading.text"
          @click.prevent="$emit('select-heading', heading.id)"
        >
          {{ heading.text }}
        </a>
      </nav>

      <div class="mt-4 pt-4 border-t border-gray-200/10">
        <div class="flex items-center text-xs text-gray-500 mb-2">
          <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
          </svg>
          阅读进度
        </div>
        <div class="w-full bg-gray-200/10 rounded-full h-2">
          <div
            class="bg-gradient-to-r from-indigo-500 to-cyan-400 h-2 rounded-full transition-all duration-300"
            :style="{ width: `${Math.min(scrollProgress, 100)}%` }"
          ></div>
        </div>
        <div class="text-xs text-gray-500 mt-1 text-center">
          {{ Math.round(scrollProgress) }}%
        </div>
      </div>
    </div>

    <div class="glass-card category-panel rounded-xl p-6">
      <h3 class="text-lg font-semibold mb-4 text-gray-800">文章分类</h3>
      <div class="category-tree space-y-2">
        <div
          v-for="category in categories"
          :key="category.CategoryID"
          :class="[
            'category-item p-3 rounded-lg cursor-pointer',
            currentCategoryIds.includes(category.CategoryID)
              ? 'is-active'
              : 'hover:bg-gray-50'
          ]"
          @click="$emit('select-category', category.CategoryID)"
        >
          <div class="flex items-center justify-between gap-3">
            <span class="font-medium" :class="currentCategoryIds.includes(category.CategoryID) ? 'text-indigo-200' : 'text-gray-700'">
              {{ category.Name }}
            </span>
            <span class="text-xs bg-gray-100/10 text-gray-300 px-2 py-1 rounded-full">
              {{ category.PostCount || 0 }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  headings: {
    type: Array,
    default: () => []
  },
  activeHeadingId: {
    type: String,
    default: ''
  },
  scrollProgress: {
    type: Number,
    default: 0
  },
  categories: {
    type: Array,
    default: () => []
  },
  currentCategoryIds: {
    type: Array,
    default: () => []
  }
})

defineEmits(['select-heading', 'select-category'])
</script>

<style scoped>
.sidebar-shell {
  min-height: 100%;
}

.toc-shell,
.category-panel {
  position: relative;
  overflow: hidden;
}

.toc-card {
  background: var(--panel);
  backdrop-filter: blur(18px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 18px 48px rgba(0, 0, 0, 0.24);
}

.toc-card nav {
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.18) transparent;
}

.toc-card nav::-webkit-scrollbar {
  width: 4px;
}

.toc-card nav::-webkit-scrollbar-track {
  background: transparent;
}

.toc-card nav::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.18);
  border-radius: 999px;
}

.toc-item {
  display: block;
  padding: 8px 16px;
  color: var(--muted);
  text-decoration: none;
  font-size: 13px;
  border-radius: 6px;
  margin: 2px 4px;
  transition: all 0.2s ease;
}

.toc-item:hover {
  background: rgba(120, 163, 255, 0.08);
  color: var(--accent);
  transform: translateX(4px);
}

.toc-item.active {
  background: rgba(120, 163, 255, 0.14);
  color: var(--accent);
  font-weight: 500;
}

.toc-item.level-2 {
  padding-left: 24px;
  font-size: 12px;
}

.toc-item.level-3 {
  padding-left: 32px;
  font-size: 11px;
  color: rgba(158, 201, 218, 0.86);
}

.toc-item.level-2::before,
.toc-item.level-3::before {
  content: "->";
  margin-right: 4px;
  opacity: 0.5;
}

.category-tree {
  transition: all 0.3s ease;
}

.category-item {
  transition: all 0.2s ease;
}

.category-item:hover {
  background: rgba(120, 163, 255, 0.1);
  transform: translateX(4px);
}

.category-item.is-active {
  background: rgba(79, 70, 229, 0.16);
  border-left: 4px solid rgba(99, 102, 241, 0.9);
}
</style>
