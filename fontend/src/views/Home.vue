<template>
  <div class="min-h-screen bg-gradient-to-b from-blue-50 to-gray-50 pb-10">
    <!-- Banner 区域横向铺满全屏，内容居中对齐 -->
    <section class="w-screen h-screen relative overflow-hidden flex items-center justify-center bg-gradient-to-br from-blue-100 to-pink-100">
      <div class="absolute inset-0 pointer-events-none">
  <div>
          <img
            v-for="img in images"
            :key="img.key"
            :src="img.src"
            :style="img.style"
            class="absolute w-40 h-40 object-contain select-none opacity-90 transition-all duration-700 ease-in-out will-change-transform cursor-pointer pointer-events-auto hover:z-20 shadow-xl rounded-2xl border-4 border-transparent"
            :class="[
              (img.hovered || img.swinging) ? 'swing border-gradient' : '',
              img.clicked ? 'rotate-[340deg] scale-125 ring-8 ring-pink-400' : '',
            ]"
            draggable="false"
            @mouseenter="onHover(img.key, true)"
            @mouseleave="onHover(img.key, false)"
            @click="onSwingClick(img.key)"
          />
        </div>
      </div>
      <div class="container mx-auto px-8 relative z-10 text-center">
        <h1 class="text-6xl md:text-7xl font-extrabold text-blue-700 drop-shadow mb-6">欢迎来到sleepyzhong的博客</h1>
        <p class="text-2xl md:text-3xl text-gray-600 mb-8">这里有可爱的猫咪和前端的乐趣</p>
      </div>
    </section>
    <!-- 最新文章区域，滚动后出现 -->
    <section class="w-full flex justify-center items-center py-16 bg-transparent">
      <div class="bg-white/80 rounded-2xl shadow-2xl p-8 max-w-7xl w-full">
        <h2 class="text-3xl font-bold text-blue-600 mb-6 text-center">最新文章</h2>
        <PostList :posts="posts" />
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import PostList from '../components/PostList.vue'
import { getArticles } from '../api/article'

const catImages = [
  new URL('../assets/cat-images/625-1.png', import.meta.url).href,
  new URL('../assets/cat-images/625-2.png', import.meta.url).href,
  new URL('../assets/cat-images/625-4.png', import.meta.url).href,
  new URL('../assets/cat-images/625-5.png', import.meta.url).href,
  new URL('../assets/cat-images/625-6.png', import.meta.url).href,
  new URL('../assets/cat-images/625-7.png', import.meta.url).href,
  new URL('../assets/cat-images/orange-1.png', import.meta.url).href,
  new URL('../assets/cat-images/orange-2.png', import.meta.url).href,
  new URL('../assets/cat-images/orange-3.png', import.meta.url).href,
  new URL('../assets/cat-images/orange-4.png', import.meta.url).href,
  new URL('../assets/cat-images/orange-5.png', import.meta.url).href,
  new URL('../assets/cat-images/orange-6.png', import.meta.url).href,
  new URL('../assets/cat-images/orange-7.png', import.meta.url).href,
  new URL('../assets/cat-images/orange-8.png', import.meta.url).href,
  new URL('../assets/cat-images/orange-9.png', import.meta.url).href,
]

function randomBetween(a, b) {
  return Math.random() * (b - a) + a
}

const images = ref([])
const swingingKey = ref(null)

function generateNonOverlappingPositions(count, w = 160, h = 160) {
  // 尝试生成不重叠的图片位置
  const placed = []
  let tries = 0
  while (placed.length < count && tries < 1000) {
    const x = randomBetween(0, window.innerWidth - w)
    const y = randomBetween(0, window.innerHeight - h)
    const rect = { x, y, w, h }
    if (!placed.some(p => isOverlap(p, rect))) {
      placed.push(rect)
    }
    tries++
  }
  return placed
}
function isOverlap(a, b) {
  return !(
    a.x + a.w < b.x ||
    b.x + b.w < a.x ||
    a.y + a.h < b.y ||
    b.y + b.h < a.y
  )
}

function randomizeImages() {
  const used = catImages.slice(0)
  const positions = generateNonOverlappingPositions(used.length)
  images.value = used.map((src, i) => {
    const pos = positions[i] || { x: 0, y: 0 }
    const angle = randomBetween(-25, 25)
    return {
      key: src + '-' + i,
      src,
      style: {
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        transform: `rotate(${angle}deg) scale(${randomBetween(0.9, 1.1)})`,
        transition: `transform 1.2s cubic-bezier(.4,2,.6,1), opacity 1.2s`,
      },
      hovered: false,
      clicked: false,
      swinging: false,
    }
  })
}

function pickRandomSwinging() {
  if (!images.value.length) return
  const idx = Math.floor(Math.random() * images.value.length)
  swingingKey.value = images.value[idx].key
  images.value.forEach(img => { img.swinging = (img.key === swingingKey.value) })
}

function onHover(key, val) {
  const img = images.value.find(i => i.key === key)
  if (img) img.hovered = val
}
function onClick(key) {
  const img = images.value.find(i => i.key === key)
  if (img) {
    img.clicked = true
    setTimeout(() => { img.clicked = false }, 600)
  }
}
function onSwingClick(key) {
  onClick(key)
  // 如果当前点击的是自动晃动的，换下一个
  if (key === swingingKey.value) {
    let candidates = images.value.filter(img => img.key !== key)
    if (candidates.length > 0) {
      const idx = Math.floor(Math.random() * candidates.length)
      swingingKey.value = candidates[idx].key
      images.value.forEach(img => { img.swinging = (img.key === swingingKey.value) })
    }
  }
}

const posts = ref([])

async function fetchArticles() {
  const res = await getArticles({ page: 1, pageSize: 6 })
  // 只取最新6条
  let data = res?.data?.data || res?.data
  posts.value = data?.list || []
}
import { useUserStore } from '@/store/user'
const userStore = useUserStore()

onMounted(async () => {
  randomizeImages()
  window.addEventListener('resize', randomizeImages)
  setTimeout(pickRandomSwinging, 0)
  fetchArticles()
  // 自动拉取用户信息
  if (userStore.token && !userStore.user) {
    await userStore.fetchUser()
    console.log('user:', userStore.user)
  }
})
</script> 

<style scoped>
.swing {
  animation: swing 0.7s cubic-bezier(.4,2,.6,1) infinite alternate;
}
@keyframes swing {
  0% { transform: translateX(0) rotate(-8deg) scale(1.5); }
  50% { transform: translateX(8px) rotate(8deg) scale(1.55); }
  100% { transform: translateX(0) rotate(-8deg) scale(1.52); }
}
.border-gradient {
  border-image: linear-gradient(90deg, #60a5fa, #f472b6, #facc15, #34d399) 1;
  transition: border-image 0.4s, border-color 0.4s;
}
</style> 