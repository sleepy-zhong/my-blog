<template>
  <div class="bg-white rounded-xl shadow p-4 border border-gray-100">
    <h3 class="font-bold text-lg mb-2">目录</h3>
    <ul>
      <li v-for="item in toc" :key="item.id" :class="`ml-${(item.level-1)*4}`">
        <a :href="`#${item.id}`" class="block py-1 hover:text-blue-600 transition">{{ item.text }}</a>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { computed } from 'vue'
const props = defineProps({
  content: String
})
// 简单正则提取 Markdown 标题
const toc = computed(() => {
  if (!props.content) return []
  const lines = props.content.split('\n')
  let idx = 0
  return lines
    .map(line => {
      const m = line.match(/^(#{1,6})\s+(.+)/)
      if (m) {
        idx++
        return {
          id: `toc-${idx}`,
          text: m[2],
          level: m[1].length
        }
      }
      return null
    })
    .filter(Boolean)
})
</script> 