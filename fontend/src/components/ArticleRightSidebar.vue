<template>
  <div class="sidebar-shell space-y-6">
    <div class="glass-card related-panel rounded-xl p-6">
      <h3 class="text-lg font-semibold mb-4 text-gray-800">相关文章</h3>
      <div class="space-y-4">
        <button
          v-for="relatedArticle in relatedArticles"
          :key="relatedArticle.PostID"
          type="button"
          class="article-card related-card p-4 bg-white rounded-lg border border-gray-100 text-left w-full"
          @click="$emit('select-article', relatedArticle.PostID)"
        >
          <h4 class="font-medium text-gray-900 text-sm mb-2 line-clamp-2">{{ relatedArticle.Title }}</h4>
          <div class="related-score text-xs text-cyan-300 mb-2">
            分类命中 {{ relatedArticle._matchMeta?.categoryMatches || 0 }}，标签命中 {{ relatedArticle._matchMeta?.tagMatches || 0 }}
          </div>
          <div class="flex items-center text-xs text-gray-500">
            <span>{{ formatDate(relatedArticle.PublishedAt || relatedArticle.CreatedAt, 'relative') }}</span>
            <span class="mx-2">&bull;</span>
            <span>阅读 {{ relatedArticle.ViewCount || 0 }}</span>
          </div>
        </button>

        <div v-if="relatedArticles.length === 0" class="text-sm text-gray-500">
          暂无相关文章
        </div>
      </div>

      <button
        v-if="relatedArticles.length > 0"
        type="button"
        class="w-full mt-4 py-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
        @click="$emit('show-more-related')"
      >
        查看更多
      </button>
    </div>

    <div class="glass-card tag-panel rounded-xl p-6">
      <h3 class="text-lg font-semibold mb-4 text-gray-800">热门标签</h3>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="tag in popularTags"
          :key="tag.TagID"
          type="button"
          class="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm hover:bg-blue-200 transition-colors"
          @click="$emit('select-tag', tag.TagID)"
        >
          {{ tag.Name }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  relatedArticles: {
    type: Array,
    default: () => []
  },
  popularTags: {
    type: Array,
    default: () => []
  },
  formatDate: {
    type: Function,
    required: true
  }
})

defineEmits(['select-article', 'select-tag', 'show-more-related'])
</script>

<style scoped>
.sidebar-shell {
  min-height: 100%;
}

.related-panel,
.tag-panel {
  position: relative;
  overflow: hidden;
}

.article-card {
  transition: all 0.3s ease;
}

.article-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.24);
}

.related-card {
  position: relative;
  overflow: hidden;
}

.related-card::before,
.related-card::after {
  content: "";
  position: absolute;
  pointer-events: none;
}

.related-card::before {
  inset: -24% auto -24% -18%;
  width: 34%;
  background: linear-gradient(120deg, transparent 0 18%, rgba(255, 255, 255, 0.04) 28%, rgba(120, 163, 255, 0.24) 48%, rgba(255, 123, 176, 0.14) 66%, transparent 100%);
  transform: translateX(-180%) skewX(-18deg);
  opacity: 0.52;
  mix-blend-mode: screen;
  animation: detailSweep 8.2s ease-in-out infinite;
}

.related-card::after {
  left: 16px;
  right: 16px;
  top: 0;
  height: 1px;
  background: linear-gradient(90deg, rgba(120, 163, 255, 0.92), rgba(255, 123, 176, 0.68), transparent);
  box-shadow: 0 0 18px rgba(120, 163, 255, 0.16);
}

.related-score {
  letter-spacing: 0.02em;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

@keyframes detailSweep {
  0% {
    transform: translateX(-180%) skewX(-18deg);
  }
  46%, 100% {
    transform: translateX(340%) skewX(-18deg);
  }
}
</style>
