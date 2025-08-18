<template>
  <div class="w-full h-64 bg-gray-200 rounded-lg overflow-hidden flex items-center justify-center mb-8">
    <div v-if="banners.length" class="w-full h-full relative">
      <img :src="banners[current].image" :alt="banners[current].title" class="object-cover w-full h-full transition-all duration-500" />
      <div class="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        <button v-for="(banner, idx) in banners" :key="idx" @click="current = idx" :class="['w-3 h-3 rounded-full', current === idx ? 'bg-blue-500' : 'bg-white border']"></button>
      </div>
    </div>
    <div v-else class="text-gray-400">加载中...</div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
const banners = ref([])
const current = ref(0)

// TODO: 替换为实际 fetch
async function fetchBanners() {
  // banners.value = await fetch('/api/banners').then(res => res.json())
  banners.value = [
    { image: 'https://picsum.photos/800/256?1', title: 'Banner 1' },
    { image: 'https://picsum.photos/800/256?2', title: 'Banner 2' },
    { image: 'https://picsum.photos/800/256?3', title: 'Banner 3' },
  ]
}
onMounted(fetchBanners)
</script> 