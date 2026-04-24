<template>
  <div class="home-page" :class="{ 'light-visual-theme': isLightVisualTheme }" :style="pageVars" @pointermove="updateSpotlight">
    <div class="home-shell">
      <section id="hero" class="hero-screen">
        <div
          ref="stageRef"
          class="hero-stage panel"
          @pointerdown="handleStageClick"
          @pointermove="handleStageMove"
          @pointerleave="resetStageTilt"
        >
          <div class="lane-grid" aria-hidden="true"></div>
          <div class="stage-rain" aria-hidden="true"></div>
          <div class="cursor-aura" :style="cursorAuraStyle" aria-hidden="true">
            <span class="cursor-core"></span>
            <span class="cursor-halo"></span>
            <span class="cursor-trail"></span>
          </div>

          <div class="meteor-layer">
            <span
              v-for="meteor in meteors"
              :key="meteor.id"
              class="meteor"
              :style="meteor.style"
            ></span>
          </div>

          <div class="light-burst-layer" aria-hidden="true">
            <span
              v-for="burst in lightBursts"
              :key="burst.id"
              class="light-burst"
              :style="burst.style"
            >
              <span class="burst-core"></span>
              <span class="burst-wave wave-a"></span>
              <span class="burst-wave wave-b"></span>
            </span>
          </div>

          <div class="stage-copy">
            <span class="stage-label">Catwave Stage</span>
            <h1>我的可爱猫咪橘子和625。</h1>
            <p>天空一声巨响，橘子和625闪亮登场。往下滑，会进入最新文章航站</p>
          </div>

          <div class="stage-hud">
            <span class="status-pill">猫猫编队 {{ cats.length }}</span>
            <span class="status-pill">街区模式 {{ currentThemeLabel }}</span>
            <span class="status-pill">交互状态 {{ interactionStatus }}</span>
          </div>

          <div class="stage-tools">
            <div class="tool-card">
              <strong>巷口控制台</strong>
              <p>重新编排轨道、触发跃迁，或者随机点亮今晚的街区主角。</p>
              <div class="control-actions">
                <button type="button" class="console-btn primary" @click="shuffleCats">重新编队</button>
                <button type="button" class="console-btn" @click="warpCats">全员跃迁</button>
                <button type="button" class="console-btn" @click="triggerMeteorShower">流星巡游</button>
                <button type="button" class="console-btn" @click="activateRandomCat">切换头牌</button>
              </div>
            </div>

            <div class="tool-card">
              <strong>霓虹子配色</strong>
              <div class="theme-switches">
                <button
                  v-for="theme in themeOptions"
                  :key="theme.id"
                  type="button"
                  class="theme-switch"
                  :class="{ active: activeTheme === theme.id }"
                  @click="setTheme(theme.id)"
                >
                  {{ theme.label }}
                </button>
              </div>
            </div>

            <div class="tool-card signal-card">
              <strong>实时信号</strong>
              <div class="signal-line">
                <span class="signal-dot"></span>
                <span>{{ signalText }}</span>
              </div>
              <p>鼠标移动会驱动聚光与轻微透视，点击猫猫会触发粒子、星环高亮和主视觉切换。</p>
            </div>
          </div>

          <div class="cat-layer">
            <button
              v-for="cat in cats"
              :key="cat.id"
              type="button"
              class="cat-chip"
              :class="{ active: activeCatId === cat.id }"
              :style="cat.style"
              @click="activateCat(cat, $event)"
              @mouseenter="signalText = `Tracking ${cat.label}`"
              @mouseleave="signalText = defaultSignalText"
            >
              <span class="chip-ring-shell chip-shell-a"><span class="chip-ring chip-ring-a"></span></span>
              <span class="chip-ring-shell chip-shell-b"><span class="chip-ring chip-ring-b"></span></span>
              <img :src="cat.src" :alt="cat.label">
              <span class="chip-name">{{ cat.label }}</span>
            </button>
          </div>

          <div class="particle-layer">
            <span
              v-for="particle in particles"
              :key="particle.id"
              class="particle"
              :style="particle.style"
            ></span>
          </div>

          <div class="stage-core" :style="stageTransformStyle">
            <div class="core-card">
              <div class="core-head">
                <span class="core-kicker">今夜头牌</span>
                <span class="core-ping"></span>
              </div>
              <div class="planet-frame core-planet">
                <span class="planet-halo"></span>
                <span
                  v-for="flash in planetFlashes"
                  :key="flash.id"
                  class="planet-flash"
                  :style="flash.style"
                ></span>
                <span class="planet-ring-shell shell-primary"><span class="planet-ring ring-primary"></span></span>
                <span class="planet-ring-shell shell-secondary"><span class="planet-ring ring-secondary"></span></span>
                <span class="planet-ring-shell shell-vertical"><span class="planet-ring ring-vertical"></span></span>
                <span
                  v-for="orbit in orbitTrails"
                  :key="`core-${orbit.id}`"
                  class="orbit-shell"
                  :style="orbit.style"
                >
                  <span class="orbit-trail"></span>
                  <span class="orbit-particle"></span>
                </span>
                <span class="planet-dust dust-a"></span>
                <span class="planet-dust dust-b"></span>
                <div class="planet-screen">
                  <img class="core-avatar" :src="activeCatSrc" :alt="activeCatLabel">
                </div>
              </div>
              <div class="core-status">
                <span class="status-pill">主理猫 {{ activeCatLabel }}</span>
                <span class="status-pill">状态 {{ currentMood }}</span>
              </div>
              <div class="speech-card">
                {{ currentSpeech }}
              </div>
            </div>
          </div>

          <button type="button" class="scroll-cue" @click="scrollToSection('latest')">
            <span class="cue-led"></span>
            <span>下滑进入最新情报</span>
            <span class="scroll-arrow"></span>
          </button>
        </div>
      </section>

      <section id="latest" ref="latestRef" class="latest-screen">
        <div class="section-connector"><span></span></div>
        <div class="latest-panel panel" :class="{ visible: latestVisible }">
          <div class="section-head">
            <div>
              <span class="stage-label">Neon Feed</span>
              <h2>猫猫情报站</h2>
              <p>这里有橘子特工，625特工，辛巴特工。</p>
            </div>
            <div class="section-note">
              <span>Active mode</span>
              <strong>{{ currentThemeLabel }}</strong>
            </div>
          </div>

          <router-link
            v-if="featuredPost"
            :to="featuredPost.link"
            class="featured-article article-card featured-card"
            :class="{ visible: latestVisible }"
          >
            <span class="article-sheen" aria-hidden="true"></span>
            <div class="featured-copy">
              <span v-if="featuredPost.tag" class="article-tag">{{ featuredPost.tag }}</span>
              <h3>{{ featuredPost.title }}</h3>
              <p v-if="featuredPost.excerpt">{{ featuredPost.excerpt }}</p>
              <div class="article-meta">
                <span>{{ featuredPost.date }}</span>
                <span v-if="featuredPost.category">{{ featuredPost.category }}</span>
              </div>
              <span class="featured-link">进入这条情报</span>
            </div>
            <div class="featured-visual">
              <div class="featured-scan"></div>
              <div class="planet-frame featured-planet">
                <span class="planet-halo"></span>
                <span
                  v-for="flash in planetFlashes"
                  :key="flash.id"
                  class="planet-flash"
                  :style="flash.style"
                ></span>
                <span class="planet-ring-shell shell-primary"><span class="planet-ring ring-primary"></span></span>
                <span class="planet-ring-shell shell-secondary"><span class="planet-ring ring-secondary"></span></span>
                <span class="planet-ring-shell shell-vertical"><span class="planet-ring ring-vertical"></span></span>
                <span
                  v-for="orbit in orbitTrails"
                  :key="`featured-${orbit.id}`"
                  class="orbit-shell"
                  :style="orbit.style"
                >
                  <span class="orbit-trail"></span>
                  <span class="orbit-particle"></span>
                </span>
                <div class="planet-screen">
                  <img class="featured-cat" :src="activeCatSrc" :alt="activeCatLabel">
                </div>
              </div>
            </div>
          </router-link>

          <div v-else class="article-card latest-empty" :class="{ visible: latestVisible }">
            <span class="article-sheen" aria-hidden="true"></span>
            <span class="article-tag">Waiting For Signal</span>
            <h3>暂时还没有公开情报</h3>
            <p>首页这里只展示后端接口返回的公开文章，等数据接通后，这里会自动亮起来。</p>
          </div>

          <div class="article-grid latest-grid">
            <router-link
              v-for="(post, index) in secondaryPosts"
              :key="post.id"
              :to="post.link"
              class="article-card latest-card"
              :class="{ visible: latestVisible }"
              :style="{ '--delay': `${index * 110}ms` }"
            >
              <span class="article-sheen" aria-hidden="true"></span>
              <span v-if="post.tag" class="article-tag">{{ post.tag }}</span>
              <h3>{{ post.title }}</h3>
              <p v-if="post.excerpt">{{ post.excerpt }}</p>
              <div class="article-meta">
                <span>{{ post.date }}</span>
                <span v-if="post.category">{{ post.category }}</span>
              </div>
            </router-link>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { getArticles } from '../api/article'
import { getPublicHomeCats } from '@/api/homeCats'
import { useUserStore } from '@/store/user'
import { useVisualThemeStore } from '@/store/visualTheme'
import { resolveAvatarUrl } from '@/utils/avatar'
import { themeOptions, themeVars, type ThemeId } from '@/theme/visualTheme'

interface CatSource {
  id: string
  label: string
  src: string
  speechText: string
  isFeatured?: boolean
}

interface CatChip extends CatSource {
  style: Record<string, string>
}

interface ParticleItem {
  id: number
  style: Record<string, string>
}

interface MeteorItem {
  id: number
  style: Record<string, string>
}

interface GlowItem {
  id: number
  style: Record<string, string>
}

interface OrbitTrail {
  id: number
  style: Record<string, string>
}

interface DisplayPost {
  id: number | string
  title: string
  excerpt: string
  date: string
  category: string
  tag: string
  link: string
}

const fallbackSpeechTexts = [
  '猫猫有话说：幸福的猫生就是吃不完的毛条和猫猫罐头。',
  '猫猫有话说：为什么猫抓盆，变得越来越小了，只能蜷在里面睡觉了。',
  '猫猫有话说：家里来了只新猫，叫辛巴。',
  '猫猫有话说：不想呆在家里，想去外面的草地奔跑。',
  '猫猫有话说：主人为什么总是晚上才回家，还会忘记给我放粮。',
  '猫猫有话说：今天的厕所，又是脏的，坏主人不铲屎。',
  '猫猫有话说：早上起来要给我拍拍屁股。',
  '猫猫有话说：今晚的主场是我，记得先摸摸我再去看文章。'
]

const moods = ['巡航', '跃迁', '吸睛中', '待机', '高能展示']

const fallbackHomeCatBase = '/uploads/home-cats'

const fallbackCatSources: CatSource[] = [
  { id: 'cat-1', label: 'Orange-1', src: `${fallbackHomeCatBase}/orange-1.png`, speechText: fallbackSpeechTexts[0], isFeatured: true },
  { id: 'cat-2', label: 'Orange-2', src: `${fallbackHomeCatBase}/orange-2.png`, speechText: fallbackSpeechTexts[1] },
  { id: 'cat-3', label: 'Orange-3', src: `${fallbackHomeCatBase}/orange-3.png`, speechText: fallbackSpeechTexts[2] },
  { id: 'cat-4', label: 'Orange-4', src: `${fallbackHomeCatBase}/orange-4.png`, speechText: fallbackSpeechTexts[3] },
  { id: 'cat-5', label: 'Orange-5', src: `${fallbackHomeCatBase}/orange-5.png`, speechText: fallbackSpeechTexts[4] },
  { id: 'cat-6', label: 'Orange-6', src: `${fallbackHomeCatBase}/orange-6.png`, speechText: fallbackSpeechTexts[5] },
  { id: 'cat-7', label: '625-1', src: `${fallbackHomeCatBase}/625-1.png`, speechText: fallbackSpeechTexts[6] },
  { id: 'cat-8', label: '625-2', src: `${fallbackHomeCatBase}/625-2.png`, speechText: fallbackSpeechTexts[7] }
]

const orbitTrails: OrbitTrail[] = [
  {
    id: 1,
    style: {
      '--orbit-width': '94%',
      '--orbit-height': '26%',
      '--orbit-duration': '7.8s',
      '--orbit-delay': '-0.8s',
      '--orbit-tilt': '-18deg',
      '--particle-size': '14px',
      '--trail-length': '68px',
      '--particle-color': 'var(--accent)'
    }
  },
  {
    id: 2,
    style: {
      '--orbit-width': '78%',
      '--orbit-height': '34%',
      '--orbit-duration': '9.6s',
      '--orbit-delay': '-3.2s',
      '--orbit-tilt': '14deg',
      '--particle-size': '12px',
      '--trail-length': '54px',
      '--particle-color': 'var(--accent-2)'
    }
  },
  {
    id: 3,
    style: {
      '--orbit-width': '40%',
      '--orbit-height': '94%',
      '--orbit-duration': '12.2s',
      '--orbit-delay': '-1.4s',
      '--orbit-tilt': '74deg',
      '--particle-size': '11px',
      '--trail-length': '58px',
      '--particle-color': 'var(--accent-3)'
    }
  },
  {
    id: 4,
    style: {
      '--orbit-width': '64%',
      '--orbit-height': '54%',
      '--orbit-duration': '6.9s',
      '--orbit-delay': '-4.1s',
      '--orbit-tilt': '-42deg',
      '--particle-size': '10px',
      '--trail-length': '46px',
      '--particle-color': '#ffd86a'
    }
  }
]

const userStore = useUserStore()
const themeStore = useVisualThemeStore()
const stageRef = ref<HTMLElement | null>(null)
const latestRef = ref<HTMLElement | null>(null)
const rawPosts = ref<any[]>([])
const catSources = ref<CatSource[]>([...fallbackCatSources])
const cats = ref<CatChip[]>([])
const particles = ref<ParticleItem[]>([])
const meteors = ref<MeteorItem[]>([])
const lightBursts = ref<GlowItem[]>([])
const planetFlashes = ref<GlowItem[]>([])
const activeTheme = computed<ThemeId>({
  get: () => themeStore.activeTheme,
  set: (theme) => themeStore.setTheme(theme)
})
const activeCatId = ref(catSources.value[0].id)
const activeCatSrc = ref(catSources.value[0].src)
const activeCatLabel = ref(catSources.value[0].label)
const currentSpeech = ref(catSources.value[0].speechText)
const currentMood = ref('巡航')
const interactionStatus = ref('LIVE')
const defaultSignalText = 'Neon cat signal stable'
const signalText = ref(defaultSignalText)
const spotlightTarget = ref({ x: 720, y: 220 })
const spotlightDisplay = ref({ x: 720, y: 220 })
const stageTilt = ref({ x: 0, y: 0 })
const latestVisible = ref(false)

const pageVars = computed<Record<string, string>>(() => ({
  ...themeVars[activeTheme.value],
  '--spotlight-x': `${spotlightDisplay.value.x}px`,
  '--spotlight-y': `${spotlightDisplay.value.y}px`
}))

const currentThemeLabel = computed(() => {
  return themeOptions.find(item => item.id === activeTheme.value)?.label || 'Neon'
})

const isLightVisualTheme = computed(() => {
  return ['laser', 'volt', 'bloom', 'mint'].includes(activeTheme.value)
})

const cursorAuraStyle = computed<Record<string, string>>(() => ({
  left: `${spotlightDisplay.value.x}px`,
  top: `${spotlightDisplay.value.y}px`
}))

const stageTransformStyle = computed<Record<string, string>>(() => ({
  transform: `rotateX(${stageTilt.value.x.toFixed(2)}deg) rotateY(${stageTilt.value.y.toFixed(2)}deg)`
}))

const displayPosts = computed<DisplayPost[]>(() => {
  return rawPosts.value.slice(0, 6).map((post, index) => normalizePost(post, index))
})

const featuredPost = computed<DisplayPost | null>(() => {
  return displayPosts.value[0] || null
})

const secondaryPosts = computed<DisplayPost[]>(() => {
  return displayPosts.value.slice(1, 5)
})

let particleCursor = 0
let meteorCursor = 0
let glowCursor = 0
let autoRotateTimer = 0
let spotlightFrame = 0
let latestObserver: IntersectionObserver | null = null
const timeoutHandles: number[] = []

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min
}

function queueTimeout(callback: () => void, delay: number) {
  const handle = window.setTimeout(callback, delay)
  timeoutHandles.push(handle)
  return handle
}

function pickGlowPalette() {
  const palettes = [
    ['var(--accent)', 'var(--accent-2)'],
    ['var(--accent-3)', 'var(--accent)'],
    ['var(--accent-2)', 'var(--accent-3)'],
    ['#8dfdff', '#ff63ce'],
    ['#ffd86a', '#58fff2']
  ]
  return palettes[Math.floor(Math.random() * palettes.length)]
}

function formatDate(value: string | undefined) {
  if (!value) return '最近更新'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

function normalizePost(post: any, index: number): DisplayPost {
  const id = post?.PostID || post?.id || `post-${index + 1}`
  const title = post?.Title || post?.title || ''
  const excerpt = post?.Excerpt || post?.summary || post?.Description || ''
  const category = post?.Categories?.[0]?.Name || post?.Category?.Name || ''
  const tag = post?.Tags?.[0]?.Name || ''
  return {
    id,
    title,
    excerpt,
    date: formatDate(post?.CreatedAt || post?.date),
    category,
    tag,
    link: `/posts/${id}`
  }
}

function runSpotlightDrift() {
  const deltaX = spotlightTarget.value.x - spotlightDisplay.value.x
  const deltaY = spotlightTarget.value.y - spotlightDisplay.value.y

  spotlightDisplay.value = {
    x: spotlightDisplay.value.x + deltaX * 0.16,
    y: spotlightDisplay.value.y + deltaY * 0.16
  }

  if (Math.abs(deltaX) < 0.6 && Math.abs(deltaY) < 0.6) {
    spotlightDisplay.value = { ...spotlightTarget.value }
    spotlightFrame = 0
    return
  }

  spotlightFrame = window.requestAnimationFrame(runSpotlightDrift)
}

function setSpotlightTarget(clientX: number, clientY: number) {
  spotlightTarget.value = {
    x: clientX,
    y: clientY
  }

  if (!spotlightFrame) {
    spotlightFrame = window.requestAnimationFrame(runSpotlightDrift)
  }
}

function syncSpotlightToStage() {
  const rect = stageRef.value?.getBoundingClientRect()
  const clientX = rect ? rect.left + rect.width * 0.5 : window.innerWidth * 0.5
  const clientY = rect ? rect.top + rect.height * 0.26 : window.innerHeight * 0.24
  spotlightTarget.value = { x: clientX, y: clientY }
  spotlightDisplay.value = { x: clientX, y: clientY }
}

function updateSpotlight(event: PointerEvent) {
  setSpotlightTarget(event.clientX, event.clientY)
}

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function setTheme(theme: ThemeId) {
  themeStore.setTheme(theme)
  signalText.value = `${currentThemeLabel.value} alley loaded`
}

function spawnLightBurst(clientX: number, clientY: number, scale = 1) {
  if (!stageRef.value) return
  const rect = stageRef.value.getBoundingClientRect()
  const baseX = clientX - rect.left
  const baseY = clientY - rect.top
  const [colorA, colorB] = pickGlowPalette()

  glowCursor += 1
  const burst: GlowItem = {
    id: glowCursor,
    style: {
      left: `${baseX}px`,
      top: `${baseY}px`,
      '--burst-size': `${Math.round(randomBetween(180, 260) * scale)}px`,
      '--burst-core-size': `${Math.round(randomBetween(66, 96) * scale)}px`,
      '--burst-color-a': colorA,
      '--burst-color-b': colorB,
      '--burst-rotate': `${randomBetween(-26, 26).toFixed(2)}deg`
    }
  }

  lightBursts.value = [...lightBursts.value, burst]
  queueTimeout(() => {
    lightBursts.value = lightBursts.value.filter(item => item.id !== burst.id)
  }, 1700)
}

function spawnPlanetFlash() {
  const [colorA, colorB] = pickGlowPalette()
  glowCursor += 1
  const flash: GlowItem = {
    id: glowCursor,
    style: {
      '--flash-color-a': colorA,
      '--flash-color-b': colorB,
      '--flash-size': `${Math.round(randomBetween(240, 330))}px`
    }
  }

  planetFlashes.value = [...planetFlashes.value, flash]
  queueTimeout(() => {
    planetFlashes.value = planetFlashes.value.filter(item => item.id !== flash.id)
  }, 1800)
}

function resolveCatImageUrl(url: string) {
  const normalizedUrl = String(url || '')
    .replace(/\s+/g, '')
    .trim()
  return resolveAvatarUrl(normalizedUrl)
}

function normalizeHomeCat(item: any, index: number): CatSource | null {
  const imageUrl = String(item?.imageUrl || item?.ImageURL || item?.src || '').trim()
  if (!imageUrl) return null

  return {
    id: String(item?.id || item?.homeCatId || item?.HomeCatID || `cat-${index + 1}`),
    label: String(item?.label || item?.Label || item?.name || item?.Name || `Cat-${index + 1}`),
    src: resolveCatImageUrl(imageUrl),
    speechText: String(item?.speechText || item?.SpeechText || fallbackSpeechTexts[index % fallbackSpeechTexts.length]),
    isFeatured: Boolean(item?.isFeatured ?? item?.IsFeatured)
  }
}

function getDefaultCatSource() {
  return catSources.value.find(item => item.isFeatured) || catSources.value[0] || fallbackCatSources[0]
}

function syncActiveCat(cat: CatSource | null | undefined) {
  const nextCat = cat || getDefaultCatSource()
  if (!nextCat) return

  activeCatId.value = nextCat.id
  activeCatSrc.value = nextCat.src
  activeCatLabel.value = nextCat.label
  currentSpeech.value = nextCat.speechText
}

async function fetchHomeCats() {
  try {
    const response = await getPublicHomeCats()
    const list = Array.isArray(response?.data)
      ? response.data
      : (Array.isArray(response?.data?.list) ? response.data.list : [])
    const normalized = list
      .map((item, index) => normalizeHomeCat(item, index))
      .filter((item): item is CatSource => Boolean(item))

    if (normalized.length) {
      catSources.value = normalized
      syncActiveCat(getDefaultCatSource())
      return
    }
  } catch (_error) {
    // ignore and use local fallback cats
  }

  catSources.value = [...fallbackCatSources]
  syncActiveCat(getDefaultCatSource())
}

function layoutCats() {
  if (!stageRef.value) return
  const rect = stageRef.value.getBoundingClientRect()
  const centerX = rect.width / 2
  const centerY = rect.height / 2
  const radiusX = Math.max(180, rect.width * 0.33)
  const radiusY = Math.max(150, rect.height * 0.28)

  cats.value = catSources.value.map((cat, index) => {
    const angle = (Math.PI * 2 * index) / catSources.value.length + randomBetween(-0.2, 0.2)
    const x = centerX + Math.cos(angle) * radiusX + randomBetween(-40, 40)
    const y = centerY + Math.sin(angle) * radiusY + randomBetween(-34, 34)
    return {
      ...cat,
      style: {
        left: `${x}px`,
        top: `${y}px`,
        '--rot': `${randomBetween(-16, 16).toFixed(2)}deg`,
        '--dur': `${randomBetween(4.8, 7.2).toFixed(2)}s`,
        '--delay': `${randomBetween(-2.4, 0).toFixed(2)}s`
      }
    }
  })
}

function spawnMeteors(count = 6) {
  meteors.value = Array.from({ length: count }, () => {
    meteorCursor += 1
    return {
      id: meteorCursor,
      style: {
        left: `${randomBetween(-10, 88).toFixed(2)}%`,
        top: `${randomBetween(-8, 55).toFixed(2)}%`,
        '--meteor-delay': `${randomBetween(0, 6).toFixed(2)}s`,
        '--meteor-duration': `${randomBetween(3.8, 8.2).toFixed(2)}s`,
        '--meteor-size': `${randomBetween(120, 240).toFixed(0)}px`
      }
    }
  })
}

function spawnParticles(clientX: number, clientY: number) {
  if (!stageRef.value) return
  const rect = stageRef.value.getBoundingClientRect()
  const baseX = clientX - rect.left
  const baseY = clientY - rect.top
  const created: ParticleItem[] = Array.from({ length: 18 }, (_, index) => {
    particleCursor += 1
    return {
      id: particleCursor,
      style: {
        left: `${baseX}px`,
        top: `${baseY}px`,
        '--dx': `${randomBetween(-90, 90).toFixed(2)}px`,
        '--dy': `${randomBetween(-90, 90).toFixed(2)}px`,
        background: index % 2 === 0
          ? 'linear-gradient(135deg, var(--accent), var(--accent-2))'
          : 'linear-gradient(135deg, var(--accent-3), var(--accent))'
      }
    }
  })

  particles.value = [...particles.value, ...created]
  queueTimeout(() => {
    const removing = new Set(created.map(item => item.id))
    particles.value = particles.value.filter(item => !removing.has(item.id))
  }, 900)
}

function handleStageClick(event: PointerEvent) {
  const target = event.target as HTMLElement | null
  if (target?.closest('.console-btn, .theme-switch, .scroll-cue, .cat-chip, .featured-link')) {
    return
  }

  signalText.value = 'Streetlight burst engaged'
  spawnLightBurst(event.clientX, event.clientY, 1.28)
  queueTimeout(() => spawnLightBurst(event.clientX, event.clientY, 0.76), 150)
  queueTimeout(() => {
    signalText.value = defaultSignalText
  }, 520)
}

function activateCat(cat: CatChip, event?: MouseEvent) {
  activeCatId.value = cat.id
  activeCatSrc.value = cat.src
  activeCatLabel.value = cat.label
  currentMood.value = moods[Math.floor(Math.random() * moods.length)]
  currentSpeech.value = cat.speechText
  interactionStatus.value = 'REACTING'
  signalText.value = `${cat.label} engaged`

  const rect = stageRef.value?.getBoundingClientRect()
  const clientX = event?.clientX ?? (rect ? rect.left + rect.width / 2 : 0)
  const clientY = event?.clientY ?? (rect ? rect.top + rect.height / 2 : 0)
  spawnLightBurst(clientX, clientY, 1.42)
  spawnParticles(clientX, clientY)
  spawnPlanetFlash()
  queueTimeout(() => spawnLightBurst(clientX, clientY, 0.88), 140)
  queueTimeout(() => spawnPlanetFlash(), 180)

  queueTimeout(() => {
    interactionStatus.value = 'LIVE'
  }, 700)
}

function activateRandomCat() {
  if (!cats.value.length) return
  const picked = cats.value[Math.floor(Math.random() * cats.value.length)]
  activateCat(picked)
}

function shuffleCats() {
  layoutCats()
  interactionStatus.value = 'SHUFFLE'
  signalText.value = '轨道已重新编排'
  queueTimeout(() => {
    interactionStatus.value = 'LIVE'
  }, 720)
}

function warpCats() {
  layoutCats()
  interactionStatus.value = 'WARP'
  signalText.value = '全员跃迁到新的霓虹轨道'
  spawnMeteors(8)
  queueTimeout(() => layoutCats(), 240)
  queueTimeout(() => {
    interactionStatus.value = 'LIVE'
  }, 920)
}

function triggerMeteorShower() {
  spawnMeteors(12)
  interactionStatus.value = 'SHOWER'
  signalText.value = '流星巡游已启动'
  queueTimeout(() => {
    interactionStatus.value = 'LIVE'
  }, 1200)
}

function handleStageMove(event: PointerEvent) {
  updateSpotlight(event)
  if (!stageRef.value) return
  const rect = stageRef.value.getBoundingClientRect()
  const relativeX = (event.clientX - rect.left) / rect.width - 0.5
  const relativeY = (event.clientY - rect.top) / rect.height - 0.5
  stageTilt.value = {
    x: -(relativeY * 10),
    y: relativeX * 12
  }
}

function resetStageTilt() {
  stageTilt.value = { x: 0, y: 0 }
  signalText.value = defaultSignalText
}

function handleResize() {
  layoutCats()
  syncSpotlightToStage()
}

async function fetchArticles() {
  try {
    const res = await getArticles({ page: 1, pageSize: 6, include: 'categories,tags' })
    const payload = res?.data?.data || res?.data
    const list = Array.isArray(payload?.list) ? payload.list : (Array.isArray(payload) ? payload : [])
    rawPosts.value = list
  } catch (_error) {
    rawPosts.value = []
  }
}

onMounted(async () => {
  await nextTick()
  await fetchHomeCats()
  layoutCats()
  syncSpotlightToStage()
  spawnMeteors()
  fetchArticles()
  activateRandomCat()

  if (latestRef.value) {
    latestObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          latestVisible.value = true
        }
      })
    }, { threshold: 0.18 })
    latestObserver.observe(latestRef.value)
  }

  autoRotateTimer = window.setInterval(() => {
    activateRandomCat()
  }, 5200)

  window.addEventListener('resize', handleResize)

  if (!userStore.sessionReady) {
    try {
      await userStore.initSession()
    } catch (_error) {
      // ignore profile preload failure on home page
    }
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  window.clearInterval(autoRotateTimer)
  window.cancelAnimationFrame(spotlightFrame)
  latestObserver?.disconnect()
  timeoutHandles.forEach(handle => window.clearTimeout(handle))
})
</script>

<style scoped>
.home-page {
  --shadow: 0 40px 120px rgba(0, 0, 0, 0.44);
  --surface-panel: linear-gradient(180deg, rgba(9, 14, 28, 0.76), rgba(7, 9, 18, 0.92));
  --surface-panel-soft: linear-gradient(180deg, rgba(10, 14, 28, 0.74), rgba(7, 9, 18, 0.92));
  --surface-panel-strong: linear-gradient(180deg, rgba(8, 12, 22, 0.74), rgba(6, 8, 16, 0.9));
  --surface-pill: rgba(6, 9, 16, 0.76);
  --surface-pill-soft: rgba(255, 255, 255, 0.05);
  --surface-chip: linear-gradient(180deg, rgba(9, 13, 24, 0.7), rgba(6, 8, 16, 0.92));
  --surface-chip-label: rgba(5, 8, 16, 0.84);
  --surface-note: linear-gradient(180deg, rgba(10, 14, 26, 0.66), rgba(7, 9, 16, 0.9));
  --surface-article: linear-gradient(180deg, rgba(10, 14, 24, 0.74), rgba(6, 8, 14, 0.94));
  --surface-speech: linear-gradient(135deg, color-mix(in srgb, var(--accent) 12%, transparent), color-mix(in srgb, var(--accent-2) 8%, transparent));
  --surface-orb:
    radial-gradient(circle at 30% 22%, rgba(255, 255, 255, 0.14), transparent 32%),
    linear-gradient(180deg, rgba(16, 20, 34, 0.92), rgba(8, 10, 18, 0.96));
  --surface-orb-border: rgba(255, 255, 255, 0.12);
  --surface-orb-shadow:
    inset 0 0 36px rgba(255, 255, 255, 0.04),
    0 32px 70px rgba(0, 0, 0, 0.34);
  --surface-copy-shadow: 0 28px 70px rgba(0, 0, 0, 0.28);
  --surface-card-shadow: 0 18px 46px rgba(0, 0, 0, 0.18);
  --surface-core-shadow: 0 34px 90px rgba(0, 0, 0, 0.34);
  --surface-text-strong: #edf2ff;
  position: relative;
  width: 100%;
  min-height: 100vh;
  margin: 0;
  overflow: hidden;
  background:
    radial-gradient(circle at 12% 16%, color-mix(in srgb, var(--accent) 18%, transparent), transparent 18%),
    radial-gradient(circle at 86% 14%, color-mix(in srgb, var(--accent-2) 22%, transparent), transparent 20%),
    radial-gradient(circle at 48% 82%, color-mix(in srgb, var(--accent-3) 14%, transparent), transparent 24%),
    linear-gradient(180deg, color-mix(in srgb, var(--bg-1) 92%, #050508) 0%, color-mix(in srgb, var(--bg-2) 88%, #06060a) 48%, color-mix(in srgb, var(--bg-3) 86%, #040407) 100%);
}

.home-page::before,
.home-page::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.home-page::before {
  background:
    radial-gradient(circle at var(--spotlight-x) var(--spotlight-y), rgba(255, 255, 255, 0.42), transparent 7%),
    radial-gradient(circle at var(--spotlight-x) var(--spotlight-y), color-mix(in srgb, var(--accent) 28%, transparent), transparent 20%),
    radial-gradient(circle at var(--spotlight-x) var(--spotlight-y), color-mix(in srgb, var(--accent-2) 18%, transparent), transparent 34%),
    radial-gradient(circle at 18% 74%, color-mix(in srgb, var(--accent) 14%, transparent), transparent 18%),
    radial-gradient(circle at 82% 62%, color-mix(in srgb, var(--accent-2) 14%, transparent), transparent 18%);
  mix-blend-mode: screen;
  opacity: 1;
}

.home-page::after {
  background-image:
    repeating-linear-gradient(180deg, rgba(255, 255, 255, 0.035) 0 1px, transparent 1px 8px),
    linear-gradient(120deg, transparent 0 44%, rgba(255, 255, 255, 0.03) 50%, transparent 56%);
  background-size: 100% 8px, 100% 100%;
  opacity: 0.13;
}

.home-page.light-visual-theme {
  --shadow: 0 34px 100px rgba(32, 75, 98, 0.18);
  --surface-panel: linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(249, 252, 255, 0.9));
  --surface-panel-soft: linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(246, 251, 255, 0.9));
  --surface-panel-strong: linear-gradient(180deg, rgba(255, 255, 255, 0.95), rgba(244, 249, 255, 0.92));
  --surface-pill: linear-gradient(135deg, rgba(255, 255, 255, 0.92), color-mix(in srgb, var(--accent) 10%, white));
  --surface-pill-soft: rgba(255, 255, 255, 0.82);
  --surface-chip: linear-gradient(180deg, rgba(255, 255, 255, 0.88), rgba(245, 251, 255, 0.9));
  --surface-chip-label: linear-gradient(135deg, rgba(255, 255, 255, 0.96), color-mix(in srgb, var(--accent) 10%, white));
  --surface-note: linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(247, 250, 255, 0.9));
  --surface-article: linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(247, 251, 255, 0.92));
  --surface-speech: linear-gradient(135deg, color-mix(in srgb, var(--accent) 14%, white), color-mix(in srgb, var(--accent-2) 10%, white));
  --surface-orb:
    radial-gradient(circle at 30% 22%, rgba(255, 255, 255, 0.96), transparent 34%),
    radial-gradient(circle at 50% 68%, color-mix(in srgb, var(--accent) 9%, transparent), transparent 62%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.9), rgba(244, 249, 255, 0.86));
  --surface-orb-border: color-mix(in srgb, var(--accent) 18%, rgba(255, 255, 255, 0.92));
  --surface-orb-shadow:
    inset 0 0 30px rgba(255, 255, 255, 0.48),
    0 24px 48px color-mix(in srgb, var(--accent) 18%, transparent);
  --surface-copy-shadow: 0 20px 52px rgba(69, 102, 122, 0.14);
  --surface-card-shadow: 0 18px 42px rgba(69, 102, 122, 0.12);
  --surface-core-shadow: 0 28px 64px rgba(69, 102, 122, 0.16);
  --surface-text-strong: var(--text);
  background:
    radial-gradient(circle at 10% 14%, color-mix(in srgb, var(--accent) 18%, transparent), transparent 22%),
    radial-gradient(circle at 88% 12%, color-mix(in srgb, var(--accent-2) 22%, transparent), transparent 24%),
    radial-gradient(circle at 48% 86%, color-mix(in srgb, var(--accent-3) 18%, transparent), transparent 28%),
    linear-gradient(180deg, var(--bg-1) 0%, var(--bg-2) 48%, var(--bg-3) 100%);
}

.home-page.light-visual-theme::before {
  background:
    radial-gradient(circle at var(--spotlight-x) var(--spotlight-y), rgba(255, 255, 255, 0.72), transparent 8%),
    radial-gradient(circle at var(--spotlight-x) var(--spotlight-y), color-mix(in srgb, var(--accent) 18%, transparent), transparent 22%),
    radial-gradient(circle at 18% 74%, color-mix(in srgb, var(--accent) 12%, transparent), transparent 20%),
    radial-gradient(circle at 82% 62%, color-mix(in srgb, var(--accent-2) 14%, transparent), transparent 22%);
  mix-blend-mode: multiply;
  opacity: 0.9;
}

.home-page.light-visual-theme::after {
  background-image:
    repeating-linear-gradient(180deg, rgba(22, 70, 92, 0.045) 0 1px, transparent 1px 9px),
    linear-gradient(120deg, transparent 0 44%, rgba(255, 255, 255, 0.34) 50%, transparent 56%);
  opacity: 0.22;
}

.home-shell {
  position: relative;
  z-index: 1;
  width: 100%;
  margin: 0;
  padding: 0 0 80px;
  color: var(--text);
}

.panel {
  border: 1px solid color-mix(in srgb, var(--line-strong) 70%, rgba(255, 255, 255, 0.08));
  border-radius: 34px;
  background: linear-gradient(180deg, color-mix(in srgb, var(--panel) 92%, rgba(5, 6, 12, 0.92)), color-mix(in srgb, var(--panel-strong) 92%, rgba(4, 5, 10, 0.95)));
  backdrop-filter: blur(18px);
  box-shadow: var(--shadow);
}

.home-page.light-visual-theme .panel {
  border-color: color-mix(in srgb, var(--line-strong) 70%, rgba(255, 255, 255, 0.7));
  background: linear-gradient(180deg, color-mix(in srgb, var(--panel) 96%, white), color-mix(in srgb, var(--panel-strong) 96%, white));
}

.hero-screen,
.latest-screen {
  min-height: calc(100vh - 56px);
  width: 100%;
  padding-top: 0;
}

.theme-switches,
.core-status,
.control-actions,
.article-meta,
.stage-hud {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.theme-switch,
.console-btn {
  border: 1px solid color-mix(in srgb, var(--line) 82%, rgba(255, 255, 255, 0.08));
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.04);
  color: var(--muted);
  cursor: pointer;
  transition: transform 180ms ease, background 180ms ease, border-color 180ms ease, color 180ms ease, box-shadow 180ms ease;
}

.theme-switch {
  min-width: 88px;
  padding: 11px 16px;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-align: center;
}

.theme-switch:hover,
.theme-switch.active {
  transform: translateY(-1px);
  color: var(--text);
  border-color: color-mix(in srgb, var(--accent) 56%, transparent);
  background: linear-gradient(135deg, color-mix(in srgb, var(--accent) 16%, transparent), color-mix(in srgb, var(--accent-2) 16%, transparent));
  box-shadow: 0 0 24px color-mix(in srgb, var(--accent) 10%, transparent);
}

.home-page.light-visual-theme .theme-switch,
.home-page.light-visual-theme .console-btn,
.home-page.light-visual-theme .status-pill {
  background: rgba(255, 255, 255, 0.72);
  color: var(--text);
  border-color: color-mix(in srgb, var(--line) 78%, rgba(255, 255, 255, 0.86));
}

.home-page.light-visual-theme .theme-switch:hover,
.home-page.light-visual-theme .theme-switch.active,
.home-page.light-visual-theme .console-btn:hover,
.home-page.light-visual-theme .console-btn.primary {
  color: var(--text);
  background: linear-gradient(135deg, color-mix(in srgb, var(--accent) 22%, white), color-mix(in srgb, var(--accent-2) 18%, white));
  border-color: color-mix(in srgb, var(--accent) 58%, white);
  box-shadow: 0 12px 28px color-mix(in srgb, var(--accent) 20%, transparent);
}

.home-page.light-visual-theme .tool-card,
.home-page.light-visual-theme .stage-copy,
.home-page.light-visual-theme .speech-card,
.home-page.light-visual-theme .core-card,
.home-page.light-visual-theme .article-card,
.home-page.light-visual-theme .featured-card,
.home-page.light-visual-theme .latest-panel {
  background: color-mix(in srgb, var(--panel) 88%, white);
  border-color: color-mix(in srgb, var(--line) 70%, rgba(255, 255, 255, 0.82));
  box-shadow: 0 24px 70px rgba(41, 79, 104, 0.16);
}

.home-page.light-visual-theme .stage-copy p,
.home-page.light-visual-theme .section-head p,
.home-page.light-visual-theme .article-card p,
.home-page.light-visual-theme .tool-card p,
.home-page.light-visual-theme .speech-card,
.home-page.light-visual-theme .featured-copy p {
  color: var(--muted);
}

.home-page.light-visual-theme .stage-label,
.home-page.light-visual-theme .article-tag,
.home-page.light-visual-theme .section-kicker {
  color: color-mix(in srgb, var(--accent) 76%, #13283a);
}

.theme-switches {
  align-items: center;
}

.stage-copy p,
.section-head p,
.article-card p,
.tool-card p,
.speech-card,
.featured-copy p {
  margin: 0;
  color: var(--muted);
  line-height: 1.82;
}

.console-btn {
  padding: 13px 18px;
  border-radius: 18px;
  color: var(--text);
}

.console-btn.primary {
  background: linear-gradient(135deg, color-mix(in srgb, var(--accent) 28%, transparent), color-mix(in srgb, var(--accent-2) 22%, transparent));
  box-shadow: 0 16px 34px color-mix(in srgb, var(--accent) 12%, transparent);
}

.console-btn:hover {
  transform: translateY(-2px);
  border-color: color-mix(in srgb, var(--accent-3) 48%, transparent);
}

.hero-stage {
  position: relative;
  min-height: calc(100vh - 78px);
  overflow: hidden;
  width: 100%;
  padding: 30px 34px;
  border-left: 0;
  border-right: 0;
  border-radius: 0;
  background:
    linear-gradient(180deg, rgba(7, 8, 14, 0.78), rgba(4, 6, 12, 0.94)),
    radial-gradient(circle at 28% 18%, color-mix(in srgb, var(--accent) 15%, transparent), transparent 28%),
    radial-gradient(circle at 74% 32%, color-mix(in srgb, var(--accent-2) 15%, transparent), transparent 26%),
    radial-gradient(circle at 54% 78%, color-mix(in srgb, var(--accent-3) 10%, transparent), transparent 34%);
  animation: fadeUp 0.85s ease;
}

.hero-stage::before,
.hero-stage::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.hero-stage::before {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.05), transparent 16%, transparent 82%, rgba(255, 255, 255, 0.03)),
    repeating-linear-gradient(90deg, transparent 0 78px, rgba(255, 255, 255, 0.025) 78px 79px);
  opacity: 0.22;
}

.hero-stage::after {
  background:
    radial-gradient(circle at 52% 52%, color-mix(in srgb, var(--accent-3) 9%, transparent), transparent 28%),
    linear-gradient(135deg, transparent 34%, rgba(255, 255, 255, 0.05) 50%, transparent 64%);
  mix-blend-mode: screen;
  opacity: 0.4;
}

.stage-rain,
.lane-grid,
.cursor-aura,
.light-burst-layer,
.meteor-layer,
.stage-hud,
.stage-copy,
.stage-tools,
.scroll-cue {
  position: absolute;
  z-index: 4;
}

.stage-rain {
  inset: -10% 0 0;
  background-image:
    repeating-linear-gradient(118deg, transparent 0 26px, rgba(255, 255, 255, 0.08) 26px 28px, transparent 28px 52px),
    linear-gradient(180deg, transparent, rgba(255, 255, 255, 0.03), transparent);
  opacity: 0.16;
  mix-blend-mode: screen;
  animation: rainSlide 16s linear infinite;
  pointer-events: none;
}

.cursor-aura {
  z-index: 3;
  pointer-events: none;
  width: 0;
  height: 0;
  transform: translate(-50%, -50%);
  mix-blend-mode: screen;
}

.cursor-core,
.cursor-halo,
.cursor-trail {
  position: absolute;
  left: 50%;
  top: 50%;
  border-radius: 50%;
  transform: translate(-50%, -50%);
}

.cursor-core {
  width: 186px;
  height: 186px;
  background:
    radial-gradient(circle, rgba(255, 255, 255, 0.88) 0, color-mix(in srgb, var(--accent) 38%, transparent) 24%, transparent 68%);
  filter: blur(4px);
  opacity: 0.96;
}

.cursor-halo {
  width: 420px;
  height: 420px;
  background:
    radial-gradient(circle, color-mix(in srgb, var(--accent) 32%, transparent), transparent 42%),
    radial-gradient(circle, color-mix(in srgb, var(--accent-2) 24%, transparent), transparent 62%);
  filter: blur(24px);
  opacity: 0.86;
  animation: cursorBreath 3.2s ease-in-out infinite;
}

.cursor-trail {
  width: 620px;
  height: 620px;
  background:
    radial-gradient(circle, color-mix(in srgb, var(--accent-3) 14%, transparent), transparent 44%),
    radial-gradient(circle, color-mix(in srgb, var(--accent) 18%, transparent), transparent 62%),
    radial-gradient(circle, rgba(255, 255, 255, 0.08), transparent 72%);
  filter: blur(36px);
  opacity: 0.44;
  animation: cursorTrailPulse 4.8s ease-in-out infinite;
}

.light-burst-layer {
  inset: 0;
  z-index: 3;
  overflow: hidden;
  pointer-events: none;
  mix-blend-mode: screen;
}

.light-burst {
  position: absolute;
  width: 0;
  height: 0;
  transform: translate(-50%, -50%);
}

.burst-core,
.burst-wave {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  border-radius: 50%;
}

.burst-core {
  width: var(--burst-core-size);
  height: var(--burst-core-size);
  background:
    radial-gradient(circle, rgba(255, 255, 255, 0.96) 0, var(--burst-color-a) 36%, transparent 72%);
  box-shadow:
    0 0 36px var(--burst-color-a),
    0 0 72px var(--burst-color-b);
  filter: blur(2px);
  animation: burstCoreFlash 1.1s ease-out forwards;
}

.burst-wave {
  width: var(--burst-size);
  height: var(--burst-size);
  border: 2px solid var(--burst-color-a);
  box-shadow:
    0 0 24px var(--burst-color-a),
    inset 0 0 20px rgba(255, 255, 255, 0.08);
  opacity: 0;
  animation: burstWaveExpand 1.55s cubic-bezier(.12,.7,.2,1) forwards;
}

.wave-a {
  transform: translate(-50%, -50%) rotate(var(--burst-rotate));
}

.wave-b {
  border-color: var(--burst-color-b);
  animation-delay: 120ms;
  transform: translate(-50%, -50%) rotate(calc(var(--burst-rotate) * -1));
}

.lane-grid {
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.lane-grid::before,
.lane-grid::after {
  content: "";
  position: absolute;
  left: -12%;
  right: -12%;
  bottom: -26%;
  pointer-events: none;
}

.lane-grid::before {
  height: 62%;
  background:
    repeating-linear-gradient(90deg, transparent 0 92px, color-mix(in srgb, var(--accent) 22%, transparent) 92px 94px),
    linear-gradient(180deg, transparent 0%, color-mix(in srgb, var(--accent-3) 10%, transparent) 100%);
  transform: perspective(980px) rotateX(78deg);
  opacity: 0.28;
}

.lane-grid::after {
  left: 12%;
  right: 12%;
  bottom: 18%;
  height: 1px;
  background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--accent) 70%, transparent), transparent);
  box-shadow:
    0 -56px 0 color-mix(in srgb, var(--accent-2) 38%, transparent),
    0 -112px 0 color-mix(in srgb, var(--accent-3) 32%, transparent);
  opacity: 0.44;
}

.meteor-layer {
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.meteor {
  position: absolute;
  width: var(--meteor-size);
  height: 2px;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0), rgba(255, 255, 255, 0.95));
  border-radius: 999px;
  transform: rotate(-28deg);
  box-shadow:
    0 0 18px color-mix(in srgb, var(--accent) 46%, transparent),
    0 0 28px color-mix(in srgb, var(--accent-2) 30%, transparent);
  animation: meteorMove var(--meteor-duration) linear infinite;
  animation-delay: var(--meteor-delay);
  opacity: 0;
}

.stage-copy {
  top: 28px;
  left: 28px;
  max-width: 520px;
  padding: 22px 24px;
  border-radius: 28px;
  background: var(--surface-panel);
  border: 1px solid color-mix(in srgb, var(--line-strong) 74%, rgba(255, 255, 255, 0.1));
  box-shadow: var(--surface-copy-shadow);
}

.stage-label {
  display: inline-flex;
  align-items: center;
  padding: 8px 12px;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--accent) 48%, transparent);
  background: color-mix(in srgb, var(--accent) 14%, rgba(255, 255, 255, 0.02));
  color: color-mix(in srgb, var(--accent) 86%, white);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  box-shadow: 0 0 20px color-mix(in srgb, var(--accent) 14%, transparent);
  animation: flicker 6s linear infinite;
}

.stage-copy h1 {
  margin: 16px 0 12px;
  font-family: var(--font-display);
  font-size: clamp(30px, 4.6vw, 64px);
  line-height: 0.98;
  letter-spacing: -0.06em;
  text-shadow:
    0 0 20px color-mix(in srgb, var(--accent) 18%, transparent),
    0 0 36px color-mix(in srgb, var(--accent-2) 10%, transparent);
}

.stage-hud {
  top: 28px;
  right: 28px;
  justify-content: flex-end;
}

.stage-tools {
  right: 28px;
  bottom: 96px;
  width: min(388px, calc(100% - 42px));
  display: grid;
  gap: 12px;
}

.tool-card {
  padding: 18px 18px 16px;
  border-radius: 26px;
  background: var(--surface-panel-soft);
  border: 1px solid color-mix(in srgb, var(--line) 82%, rgba(255, 255, 255, 0.08));
  box-shadow: var(--surface-card-shadow);
}

.tool-card strong {
  display: block;
  margin-bottom: 10px;
  font-size: 16px;
  letter-spacing: -0.03em;
}

.signal-card p {
  margin-top: 10px;
}

.scroll-cue {
  left: 50%;
  bottom: 26px;
  display: inline-flex;
  align-items: center;
  gap: 12px;
  transform: translateX(-50%);
  padding: 12px 16px;
  border: 1px solid color-mix(in srgb, var(--line-strong) 80%, rgba(255, 255, 255, 0.08));
  border-radius: 999px;
  background: var(--surface-pill);
  color: var(--text);
  cursor: pointer;
  transition: transform 180ms ease, background 180ms ease;
}

.scroll-cue:hover {
  transform: translateX(-50%) translateY(-2px);
  background: linear-gradient(135deg, color-mix(in srgb, var(--accent) 12%, transparent), color-mix(in srgb, var(--accent-2) 10%, transparent));
}

.cue-led {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 0 14px color-mix(in srgb, var(--accent) 38%, transparent);
}

.scroll-arrow {
  width: 10px;
  height: 10px;
  border-right: 2px solid currentColor;
  border-bottom: 2px solid currentColor;
  transform: rotate(45deg);
  animation: cueBounce 1.6s ease-in-out infinite;
}

.cat-layer,
.particle-layer,
.stage-core {
  position: absolute;
  inset: 0;
}

.stage-core {
  display: grid;
  place-items: center;
  pointer-events: none;
  transform-style: preserve-3d;
  transition: transform 180ms ease;
}

.core-card {
  position: relative;
  width: min(460px, 74%);
  padding: 20px 22px 22px;
  border-radius: 34px;
  border: 1px solid color-mix(in srgb, var(--line-strong) 88%, rgba(255, 255, 255, 0.1));
  background: var(--surface-panel-strong);
  backdrop-filter: blur(20px);
  box-shadow: var(--surface-core-shadow);
  pointer-events: auto;
}

.core-card::before,
.core-card::after {
  content: "";
  position: absolute;
  inset: -16px;
  border-radius: 42px;
  border: 1px solid color-mix(in srgb, var(--accent) 18%, transparent);
  animation: pulseRing 5s ease-in-out infinite;
}

.core-card::after {
  inset: -32px;
  border-color: color-mix(in srgb, var(--accent-2) 14%, transparent);
  animation-delay: -2.3s;
}

.core-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 4px;
}

.core-kicker {
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--accent-3) 88%, white);
}

.core-ping {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 0 18px color-mix(in srgb, var(--accent) 45%, transparent);
  animation: blink 1.4s ease-in-out infinite;
}

.planet-frame {
  position: relative;
  display: grid;
  place-items: center;
  isolation: isolate;
  overflow: visible;
}

.planet-flash {
  position: absolute;
  left: 50%;
  top: 50%;
  width: var(--flash-size);
  height: var(--flash-size);
  border-radius: 50%;
  transform: translate(-50%, -50%) scale(0.18);
  background:
    radial-gradient(circle, rgba(255, 255, 255, 0.96) 0, var(--flash-color-a) 18%, var(--flash-color-b) 42%, transparent 76%);
  box-shadow:
    0 0 42px var(--flash-color-a),
    0 0 90px var(--flash-color-b),
    0 0 140px color-mix(in srgb, var(--flash-color-a) 28%, transparent);
  mix-blend-mode: screen;
  filter: blur(2px);
  opacity: 0;
  animation: planetFlashWave 2.4s cubic-bezier(.12,.74,.22,1) forwards;
}

.core-planet {
  width: min(420px, 100%);
  height: 330px;
  margin: 8px auto 18px;
}

.featured-planet {
  width: min(320px, 88%);
  height: 320px;
}

.planet-halo {
  position: absolute;
  inset: 14%;
  border-radius: 50%;
  background:
    radial-gradient(circle, color-mix(in srgb, var(--accent) 24%, transparent), transparent 56%),
    radial-gradient(circle, color-mix(in srgb, var(--accent-2) 18%, transparent), transparent 68%);
  filter: blur(24px);
  opacity: 0.9;
  animation: haloPulse 5.2s ease-in-out infinite;
}

.planet-screen {
  position: relative;
  z-index: 2;
  width: min(278px, 78%);
  aspect-ratio: 1;
  display: grid;
  place-items: center;
  border-radius: 50%;
  overflow: hidden;
  background: var(--surface-orb);
  border: 1px solid var(--surface-orb-border);
  box-shadow: var(--surface-orb-shadow);
}

.planet-screen::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.1), transparent 32%),
    radial-gradient(circle at 68% 72%, color-mix(in srgb, var(--accent-3) 14%, transparent), transparent 24%);
  pointer-events: none;
}

.planet-ring-shell {
  position: absolute;
  inset: 0;
  animation: ringShellSpin 8.8s linear infinite;
}

.shell-primary {
  rotate: -18deg;
}

.shell-secondary {
  rotate: 16deg;
  animation-duration: 11.6s;
  animation-direction: reverse;
}

.shell-vertical {
  rotate: 74deg;
  animation-duration: 15.4s;
}

.planet-ring {
  position: absolute;
  left: 50%;
  top: 50%;
  border: 1.5px solid color-mix(in srgb, var(--accent) 55%, transparent);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  box-shadow:
    0 0 24px color-mix(in srgb, var(--accent) 18%, transparent),
    inset 0 0 18px rgba(255, 255, 255, 0.06);
  animation: ringPulse 4.2s ease-in-out infinite;
}

.ring-primary {
  width: 86%;
  height: 24%;
  border-width: 2px;
}

.ring-secondary {
  width: 74%;
  height: 34%;
  border-color: color-mix(in srgb, var(--accent-2) 62%, transparent);
  border-width: 1.8px;
  animation-delay: -1.3s;
}

.ring-vertical {
  width: 38%;
  height: 92%;
  border-color: color-mix(in srgb, var(--accent-3) 52%, transparent);
  border-style: dashed;
  opacity: 0.56;
  animation-delay: -2.2s;
}

.orbit-shell {
  position: absolute;
  left: 50%;
  top: 50%;
  width: var(--orbit-width);
  height: var(--orbit-height);
  border-radius: 50%;
  transform: translate(-50%, -50%) rotate(var(--orbit-tilt));
  animation: orbitShellSpin var(--orbit-duration) linear infinite;
  animation-delay: var(--orbit-delay);
  z-index: 1;
  pointer-events: none;
}

.orbit-trail,
.orbit-particle {
  position: absolute;
  left: 50%;
  top: 0;
}

.orbit-trail {
  width: calc(var(--particle-size) * 0.5);
  height: var(--trail-length);
  border-radius: 999px;
  background: linear-gradient(180deg, color-mix(in srgb, var(--particle-color) 82%, white), transparent);
  transform: translate(-50%, -8%) rotate(180deg);
  transform-origin: center top;
  filter: blur(2px);
  opacity: 0.72;
  animation: orbitTrailPulse 2.8s ease-in-out infinite;
}

.orbit-particle {
  width: var(--particle-size);
  height: var(--particle-size);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  background: radial-gradient(circle, rgba(255, 255, 255, 0.98) 0, color-mix(in srgb, var(--particle-color) 92%, white) 48%, transparent 78%);
  box-shadow:
    0 0 18px var(--particle-color),
    0 0 36px color-mix(in srgb, var(--particle-color) 42%, transparent);
  animation: orbitSparkle 2.6s ease-in-out infinite;
}

.planet-dust {
  position: absolute;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--accent), var(--accent-3));
  box-shadow: 0 0 14px color-mix(in srgb, var(--accent) 42%, transparent);
  animation: dustFloat 6.2s ease-in-out infinite;
}

.dust-a {
  top: 24%;
  right: 18%;
}

.dust-b {
  left: 16%;
  bottom: 22%;
  animation-delay: -2.4s;
}

.core-avatar,
.featured-cat {
  position: relative;
  z-index: 1;
  width: 88%;
  max-width: 280px;
  object-fit: contain;
  filter: drop-shadow(0 24px 46px rgba(0, 0, 0, 0.3));
  animation: hoverFloat 6s ease-in-out infinite;
}

.status-pill {
  padding: 9px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #f2f5ff;
  font-size: 13px;
  font-weight: 700;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.02) inset;
}

.speech-card {
  min-height: 82px;
  padding: 16px 18px;
  border-radius: 24px;
  background: var(--surface-speech);
  border: 1px solid color-mix(in srgb, var(--line-strong) 78%, rgba(255, 255, 255, 0.1));
  color: var(--surface-text-strong);
}

.cat-chip {
  position: absolute;
  width: 112px;
  height: 112px;
  padding: 10px;
  border: 0;
  border-radius: 30px;
  background: var(--surface-chip);
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.22);
  backdrop-filter: blur(14px);
  cursor: pointer;
  animation: drift var(--dur, 5.6s) ease-in-out infinite;
  animation-delay: var(--delay, 0s);
  transition: transform 180ms ease, background 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
}

.cat-chip::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 30px;
  border: 1px solid color-mix(in srgb, var(--line) 90%, rgba(255, 255, 255, 0.08));
}

.cat-chip img {
  position: relative;
  z-index: 2;
  width: 100%;
  height: 100%;
  object-fit: contain;
  user-select: none;
  pointer-events: none;
  filter: drop-shadow(0 14px 26px rgba(0, 0, 0, 0.24));
}

.chip-ring {
  position: absolute;
  left: 50%;
  top: 50%;
  border-radius: 50%;
  border: 1.2px solid color-mix(in srgb, var(--accent) 55%, transparent);
  transform: translate(-50%, -50%);
  box-shadow:
    0 0 16px color-mix(in srgb, var(--accent) 18%, transparent),
    inset 0 0 8px rgba(255, 255, 255, 0.06);
  animation: chipRingPulse 3.8s ease-in-out infinite;
}

.chip-ring-shell {
  position: absolute;
  inset: 0;
  animation: chipShellSpin 4.6s linear infinite;
}

.chip-shell-a {
  rotate: -18deg;
}

.chip-shell-b {
  rotate: 16deg;
  animation-duration: 6.4s;
  animation-direction: reverse;
}

.chip-ring-a {
  width: 78%;
  height: 26%;
}

.chip-ring-b {
  width: 68%;
  height: 34%;
  border-color: color-mix(in srgb, var(--accent-3) 52%, transparent);
  animation-delay: -1.4s;
}

.chip-name {
  position: absolute;
  left: 50%;
  bottom: -12px;
  transform: translateX(-50%);
  z-index: 3;
  padding: 6px 10px;
  border-radius: 999px;
  background: var(--surface-chip-label);
  border: 1px solid color-mix(in srgb, var(--line) 90%, rgba(255, 255, 255, 0.08));
  color: var(--surface-text-strong);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  white-space: nowrap;
}

.cat-chip:hover,
.cat-chip.active {
  animation-play-state: paused;
  z-index: 3;
  box-shadow:
    0 24px 52px rgba(0, 0, 0, 0.32),
    0 0 32px color-mix(in srgb, var(--accent) 14%, transparent);
  transform: translate(-50%, -50%) scale(1.14) rotate(0deg);
}

.particle {
  position: absolute;
  width: 10px;
  height: 10px;
  border-radius: 999px;
  box-shadow: 0 0 18px rgba(255, 255, 255, 0.22);
  animation: burst 880ms cubic-bezier(.18,.8,.22,1) forwards;
}

.section-head {
  display: flex;
  justify-content: space-between;
  align-items: end;
  gap: 16px;
  margin-bottom: 18px;
}

.section-head h2 {
  margin: 14px 0 10px;
  font-family: var(--font-display);
  font-size: clamp(28px, 3vw, 40px);
  letter-spacing: -0.05em;
}

.section-note {
  min-width: 180px;
  padding: 16px 18px;
  border-radius: 24px;
  border: 1px solid color-mix(in srgb, var(--line) 82%, rgba(255, 255, 255, 0.08));
  background: var(--surface-note);
  box-shadow: var(--surface-card-shadow);
}

.section-note span {
  display: block;
  margin-bottom: 8px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--muted);
}

.section-note strong {
  font-size: 26px;
  font-weight: 800;
  letter-spacing: -0.05em;
}

.article-grid {
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.article-card {
  position: relative;
  overflow: hidden;
  padding: 22px;
  border-radius: 28px;
  border: 1px solid color-mix(in srgb, var(--line) 88%, rgba(255, 255, 255, 0.08));
  background: var(--surface-article);
  color: inherit;
  text-decoration: none;
  box-shadow: var(--surface-card-shadow);
  transition: transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease;
}

.article-sheen {
  position: absolute;
  inset: -34% auto -34% -24%;
  width: 42%;
  background: linear-gradient(118deg, transparent 0 18%, color-mix(in srgb, var(--accent) 26%, transparent) 34%, rgba(255, 255, 255, 0.8) 50%, color-mix(in srgb, var(--accent-2) 24%, transparent) 68%, transparent 100%);
  transform: translateX(-185%) skewX(-18deg);
  opacity: 0.52;
  filter: blur(1px);
  mix-blend-mode: screen;
  pointer-events: none;
  animation: articleSweep 8.2s ease-in-out infinite;
}

.article-card::before,
.article-card::after {
  content: "";
  position: absolute;
  pointer-events: none;
}

.article-card::before {
  inset: auto -60px -60px auto;
  width: 170px;
  height: 170px;
  border-radius: 50%;
  background: radial-gradient(circle, color-mix(in srgb, var(--accent) 16%, transparent), transparent 70%);
}

.article-card::after {
  top: 0;
  left: 24px;
  width: 120px;
  height: 2px;
  background: linear-gradient(90deg, color-mix(in srgb, var(--accent) 86%, white), color-mix(in srgb, var(--accent-2) 70%, transparent));
  box-shadow: 0 0 18px color-mix(in srgb, var(--accent) 24%, transparent);
}

.article-card:hover {
  transform: translateY(-8px) scale(1.01);
  border-color: color-mix(in srgb, var(--accent) 48%, transparent);
  box-shadow: 0 18px 46px rgba(0, 0, 0, 0.28);
}

.article-card:hover::after {
  width: 180px;
  box-shadow: 0 0 24px color-mix(in srgb, var(--accent) 34%, transparent);
}

.article-card:hover .article-sheen {
  opacity: 0.86;
  animation-duration: 5.1s;
}

.article-tag {
  display: inline-flex;
  margin-bottom: 12px;
  padding: 7px 11px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--accent) 14%, rgba(255, 255, 255, 0.04));
  color: color-mix(in srgb, var(--accent) 84%, white);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.article-card h3 {
  margin: 0 0 10px;
  font-family: var(--font-display);
  font-size: clamp(24px, 3vw, 34px);
  letter-spacing: -0.05em;
}

.article-meta span {
  padding: 9px 12px;
  border-radius: 999px;
  background: var(--surface-pill-soft);
  color: var(--muted);
  font-size: 13px;
}

.signal-line {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #e6f8ff;
}

.signal-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--accent-3);
  box-shadow: 0 0 16px color-mix(in srgb, var(--accent-3) 45%, transparent);
  animation: blink 1.6s ease-in-out infinite;
}

.latest-screen {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  padding-bottom: 0;
}

.section-connector {
  position: absolute;
  left: 50%;
  top: -26px;
  width: 2px;
  height: 130px;
  transform: translateX(-50%);
}

.section-connector::before,
.section-connector::after,
.section-connector span {
  content: "";
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}

.section-connector::before {
  top: 0;
  width: 2px;
  height: 120px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0), color-mix(in srgb, var(--accent) 58%, transparent), rgba(255, 255, 255, 0));
}

.section-connector::after {
  top: 50px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: color-mix(in srgb, var(--accent-2) 88%, white);
  box-shadow: 0 0 18px color-mix(in srgb, var(--accent-2) 34%, transparent);
}

.section-connector span {
  top: 58px;
  width: 110px;
  height: 1px;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0), color-mix(in srgb, var(--accent-3) 72%, transparent), rgba(255, 255, 255, 0));
}

.latest-panel {
  width: 100%;
  padding: 30px 32px 48px;
  border-left: 0;
  border-right: 0;
  border-radius: 0;
  transform: translateY(90px) scale(0.96);
  filter: blur(8px);
  opacity: 0;
  transition: transform 820ms cubic-bezier(.2,.8,.2,1), opacity 820ms ease, filter 820ms ease;
}

.latest-panel.visible {
  opacity: 1;
  transform: translateY(0) scale(1);
  filter: blur(0);
}

.featured-card {
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 18px;
  align-items: center;
  margin-bottom: 18px;
  min-height: 360px;
  transform: translateY(72px) scale(0.95);
  filter: blur(10px);
  opacity: 0;
  cursor: pointer;
  transition: transform 880ms cubic-bezier(.18,.82,.18,1), opacity 880ms ease, filter 880ms ease;
}

.featured-card.visible {
  transform: translateY(0) scale(1);
  filter: blur(0);
  opacity: 1;
}

.featured-copy {
  position: relative;
  z-index: 1;
}

.featured-link {
  display: inline-flex;
  align-items: center;
  margin-top: 18px;
  padding: 12px 16px;
  border-radius: 999px;
  background: linear-gradient(135deg, color-mix(in srgb, var(--accent) 24%, transparent), color-mix(in srgb, var(--accent-2) 18%, transparent));
  color: var(--text);
  text-decoration: none;
  transition: transform 180ms ease;
}

.featured-link:hover {
  transform: translateY(-2px);
}

.featured-visual {
  position: relative;
  display: grid;
  place-items: center;
  min-height: 300px;
  pointer-events: none;
}

.featured-scan {
  position: absolute;
  inset: 16px;
  border-radius: 28px;
  background-image: repeating-linear-gradient(180deg, rgba(255, 255, 255, 0.04) 0 1px, transparent 1px 8px);
  opacity: 0.14;
  animation: featuredScanSweep 5.6s linear infinite;
}

.featured-cat {
  width: 88%;
}

.latest-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.latest-card {
  opacity: 0;
  filter: blur(12px);
  transform: translateY(78px) scale(0.93) rotateX(14deg);
  transform-origin: center top;
  transition: transform 860ms cubic-bezier(.18,.82,.18,1), opacity 860ms ease, filter 860ms ease;
  transition-delay: var(--delay, 0ms);
}

.latest-card.visible {
  opacity: 1;
  filter: blur(0);
  transform: translateY(0) scale(1) rotateX(0deg);
}

.latest-empty {
  min-height: 220px;
  display: grid;
  align-content: center;
  gap: 10px;
  margin-bottom: 18px;
  opacity: 0;
  filter: blur(10px);
  transform: translateY(70px) scale(0.95);
  transition: transform 840ms cubic-bezier(.18,.82,.18,1), opacity 840ms ease, filter 840ms ease;
}

.latest-empty.visible {
  opacity: 1;
  filter: blur(0);
  transform: translateY(0) scale(1);
}

@keyframes hoverFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-12px); }
}

@keyframes pulseRing {
  0%, 100% { opacity: 0.24; transform: scale(0.98); }
  50% { opacity: 0.5; transform: scale(1.04); }
}

@keyframes cursorBreath {
  0%, 100% { opacity: 0.58; transform: translate(-50%, -50%) scale(0.94); }
  50% { opacity: 0.92; transform: translate(-50%, -50%) scale(1.1); }
}

@keyframes cursorTrailPulse {
  0%, 100% { opacity: 0.34; transform: translate(-50%, -50%) scale(0.94); }
  50% { opacity: 0.58; transform: translate(-50%, -50%) scale(1.08); }
}

@keyframes drift {
  0%, 100% { transform: translate(-50%, -50%) translateY(0) rotate(var(--rot)); }
  50% { transform: translate(-50%, -50%) translateY(-10px) rotate(calc(var(--rot) + 6deg)); }
}

@keyframes burst {
  from { opacity: 1; transform: translate(0, 0) scale(1); }
  to { opacity: 0; transform: translate(var(--dx), var(--dy)) scale(0.3); }
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.35; }
}

@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(24px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes meteorMove {
  0% {
    opacity: 0;
    transform: translate3d(120px, -50px, 0) rotate(-28deg);
  }
  12% {
    opacity: 1;
  }
  68% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translate3d(-420px, 260px, 0) rotate(-28deg);
  }
}

@keyframes cueBounce {
  0%, 100% { transform: rotate(45deg) translateY(0); }
  50% { transform: rotate(45deg) translateY(4px); }
}

@keyframes burstCoreFlash {
  0% { opacity: 0; transform: translate(-50%, -50%) scale(0.12); }
  22% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
  100% { opacity: 0; transform: translate(-50%, -50%) scale(1.55); }
}

@keyframes burstWaveExpand {
  0% { opacity: 0; transform: translate(-50%, -50%) scale(0.14) rotate(var(--burst-rotate)); }
  18% { opacity: 0.96; }
  100% { opacity: 0; transform: translate(-50%, -50%) scale(1.72) rotate(var(--burst-rotate)); }
}

@keyframes planetFlashWave {
  0% { opacity: 0; transform: translate(-50%, -50%) scale(0.16); }
  22% { opacity: 1; }
  100% { opacity: 0; transform: translate(-50%, -50%) scale(1.92); }
}

@keyframes orbitShellSpin {
  from { transform: translate(-50%, -50%) rotate(var(--orbit-tilt)); }
  to { transform: translate(-50%, -50%) rotate(calc(360deg + var(--orbit-tilt))); }
}

@keyframes orbitTrailPulse {
  0%, 100% { opacity: 0.42; transform: translate(-50%, -8%) rotate(180deg) scaleY(0.86); }
  50% { opacity: 0.92; transform: translate(-50%, -8%) rotate(180deg) scaleY(1.08); }
}

@keyframes orbitSparkle {
  0%, 100% { opacity: 0.7; transform: translate(-50%, -50%) scale(0.88); }
  50% { opacity: 1; transform: translate(-50%, -50%) scale(1.18); }
}

@keyframes ringShellSpin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes chipShellSpin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes ringPulse {
  0%, 100% {
    opacity: 0.56;
    transform: translate(-50%, -50%) scale(0.98);
  }
  50% {
    opacity: 0.92;
    transform: translate(-50%, -50%) scale(1.06);
  }
}

@keyframes chipRingPulse {
  0%, 100% {
    opacity: 0.46;
    transform: translate(-50%, -50%) scale(0.98);
  }
  50% {
    opacity: 0.88;
    transform: translate(-50%, -50%) scale(1.08);
  }
}

@keyframes haloPulse {
  0%, 100% { opacity: 0.64; transform: scale(0.96); }
  50% { opacity: 0.92; transform: scale(1.06); }
}

@keyframes dustFloat {
  0%, 100% { transform: translate3d(0, 0, 0); opacity: 0.7; }
  50% { transform: translate3d(10px, -12px, 0); opacity: 1; }
}

@keyframes articleSweep {
  0% { transform: translateX(-185%) skewX(-18deg); }
  44%, 100% { transform: translateX(340%) skewX(-18deg); }
}

@keyframes featuredScanSweep {
  0% { transform: translateY(-4px); opacity: 0.1; }
  50% { transform: translateY(4px); opacity: 0.24; }
  100% { transform: translateY(-4px); opacity: 0.1; }
}

@keyframes rainSlide {
  from { transform: translateY(-4%); }
  to { transform: translateY(8%); }
}

@keyframes flicker {
  0%, 18%, 20%, 53%, 55%, 100% {
    opacity: 1;
  }
  19%, 54% {
    opacity: 0.65;
  }
}

@media (max-width: 1160px) {
  .article-grid {
    grid-template-columns: 1fr;
  }

  .featured-card,
  .latest-grid {
    grid-template-columns: 1fr;
  }

  .hero-stage {
    min-height: 760px;
  }

  .stage-copy,
  .stage-tools {
    position: relative;
    top: auto;
    right: auto;
    left: auto;
    bottom: auto;
    width: 100%;
  }

  .stage-copy {
    max-width: none;
    margin-bottom: 18px;
  }

  .stage-tools {
    margin-top: auto;
  }

  .stage-hud {
    top: auto;
    left: 28px;
    right: auto;
    bottom: 28px;
    justify-content: flex-start;
  }

  .scroll-cue {
    bottom: 20px;
  }
}

@media (max-width: 1024px) {
  .hero-stage {
    min-height: 780px;
  }

  .stage-tools {
    width: min(420px, 100%);
  }
}

@media (max-width: 860px) {
  .section-head {
    flex-direction: column;
    align-items: flex-start;
  }

  .core-card {
    width: min(88%, 440px);
  }

  .core-planet {
    height: 300px;
  }
}

@media (max-width: 760px) {
  .core-card {
    width: min(92%, 420px);
  }

  .cat-chip {
    width: 84px;
    height: 84px;
  }

  .hero-stage,
  .latest-panel {
    padding: 18px 16px 28px;
  }

  .stage-copy h1 {
    font-size: 34px;
  }

  .stage-tools {
    width: calc(100% - 34px);
  }

  .stage-hud {
    left: 18px;
    right: 18px;
    bottom: 84px;
  }

  .scroll-cue {
    width: calc(100% - 36px);
    justify-content: center;
  }
  .section-note {
    width: 100%;
  }
}

@media (max-width: 560px) {
  .home-page {
    padding: 12px 0 32px;
  }

  .hero-stage {
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-height: auto;
    padding: 14px 12px 18px;
    border-radius: 24px;
  }

  .latest-panel {
    padding: 18px 14px 28px;
    border-radius: 24px;
  }

  .stage-copy,
  .stage-hud,
  .stage-tools,
  .stage-core,
  .scroll-cue {
    position: relative;
    inset: auto;
    left: auto;
    right: auto;
    top: auto;
    bottom: auto;
    width: 100%;
    transform: none;
  }

  .stage-copy {
    order: 1;
    margin-bottom: 0;
    padding: 14px;
    border-radius: 20px;
  }

  .stage-label {
    padding: 6px 9px;
    font-size: 10px;
  }

  .stage-copy h1 {
    margin: 10px 0 8px;
    font-size: 26px;
    line-height: 1.06;
  }

  .stage-copy p,
  .tool-card p,
  .speech-card,
  .featured-copy p,
  .article-card p {
    font-size: 13px;
    line-height: 1.65;
  }

  .stage-hud {
    order: 2;
    gap: 6px;
    justify-content: flex-start;
  }

  .status-pill {
    padding: 6px 8px;
    font-size: 11px;
  }

  .stage-core {
    order: 3;
    display: flex;
    justify-content: center;
    pointer-events: auto;
  }

  .core-card {
    width: min(100%, 332px);
    padding: 14px 14px 16px;
    border-radius: 24px;
  }

  .core-card::before {
    inset: -8px;
    border-radius: 30px;
  }

  .core-card::after {
    inset: -16px;
    border-radius: 36px;
  }

  .core-planet {
    width: min(248px, 100%);
    height: 224px;
    margin: 4px auto 10px;
  }

  .planet-screen {
    width: min(182px, 74%);
  }

  .core-avatar {
    max-width: 190px;
  }

  .speech-card {
    min-height: 0;
    padding: 12px 13px;
    border-radius: 18px;
  }

  .cat-layer {
    display: none;
  }

  .stage-tools {
    order: 4;
    gap: 8px;
    margin-top: 0;
  }

  .tool-card {
    padding: 12px;
    border-radius: 18px;
  }

  .tool-card strong {
    margin-bottom: 6px;
    font-size: 14px;
  }

  .tool-card p,
  .signal-card p {
    display: none;
  }

  .control-actions {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }

  .control-actions > * {
    width: 100%;
  }

  .console-btn,
  .theme-switch {
    min-height: 38px;
    padding: 8px 10px;
    font-size: 12px;
    border-radius: 12px;
  }

  .theme-switches {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
    width: 100%;
  }

  .theme-switch {
    min-width: 0;
    width: 100%;
  }

  .cat-chip {
    width: 72px;
    height: 72px;
  }

  .section-head {
    gap: 10px;
    margin-bottom: 14px;
  }

  .section-head h2 {
    margin: 10px 0 6px;
    font-size: 26px;
  }

  .section-note {
    min-width: 0;
    width: 100%;
    padding: 12px 14px;
    border-radius: 18px;
  }

  .section-note strong {
    font-size: 18px;
  }

  .article-card {
    padding: 16px;
    border-radius: 20px;
  }

  .article-card h3 {
    font-size: 22px;
  }

  .article-tag {
    margin-bottom: 8px;
    padding: 5px 8px;
    font-size: 10px;
  }

  .article-meta span {
    padding: 7px 9px;
    font-size: 11px;
  }

  .featured-card {
    min-height: 0;
    gap: 12px;
  }

  .featured-visual {
    min-height: 200px;
  }

  .featured-planet {
    width: min(220px, 78vw);
    height: 220px;
  }

  .featured-link {
    margin-top: 12px;
    padding: 10px 12px;
    font-size: 13px;
  }

  .section-connector {
    display: none;
  }

  .scroll-cue {
    order: 5;
    gap: 8px;
    padding: 11px 12px;
    margin-top: 2px;
    font-size: 13px;
  }
}

@media (max-width: 390px) {
  .hero-stage {
    padding: 12px 10px 16px;
    gap: 8px;
  }

  .latest-panel {
    padding: 14px 10px 22px;
  }

  .stage-copy {
    padding: 12px;
  }

  .stage-copy h1 {
    font-size: 22px;
  }

  .stage-hud {
    gap: 6px;
  }

  .status-pill {
    font-size: 10px;
    padding: 5px 7px;
  }

  .core-card {
    width: 100%;
    padding: 12px;
    border-radius: 20px;
  }

  .core-card::before,
  .core-card::after {
    display: none;
  }

  .core-planet {
    width: min(210px, 100%);
    height: 192px;
  }

  .planet-screen {
    width: min(150px, 72%);
  }

  .tool-card {
    padding: 10px;
    border-radius: 16px;
  }

  .control-actions {
    grid-template-columns: 1fr;
  }

  .console-btn,
  .theme-switch {
    min-height: 34px;
    padding: 7px 9px;
    font-size: 11px;
  }

  .theme-switches {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .featured-visual {
    min-height: 170px;
  }

  .featured-planet {
    width: 190px;
    height: 190px;
  }

  .article-card h3 {
    font-size: 19px;
  }
}
</style>
