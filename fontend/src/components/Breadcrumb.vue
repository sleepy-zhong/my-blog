<template>
  <nav aria-label="Breadcrumb" class="text-sm text-gray-500">
    <ol class="flex flex-wrap items-center gap-2">
      <li v-for="(c, idx) in crumbs" :key="idx" class="flex items-center gap-2">
        <template v-if="c.to">
          <router-link :to="c.to" class="hover:text-gray-700">{{ c.label }}</router-link>
          <span class="text-gray-300">/</span>
        </template>
        <template v-else>
          <span class="text-gray-700">{{ c.label }}</span>
        </template>
      </li>
    </ol>
  </nav>
  
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const crumbs = computed(() => {
  const matched = route.matched
  return matched.map((record, index) => {
    const isLast = index === matched.length - 1
    const rawLabel = (record.meta as any)?.title || (record.name as any) || record.path
    const label = rawLabel === '/admin' ? '管理后台' : rawLabel === '/' ? '首页' : String(rawLabel)
    return {
      label,
      to: isLast ? undefined : { path: record.path },
    }
  })
})
</script>

<style scoped>
</style>

