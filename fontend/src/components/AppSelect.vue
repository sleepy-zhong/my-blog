<template>
  <div
    ref="rootRef"
    v-bind="$attrs"
    class="app-select"
    :class="{
      'is-open': isOpen,
      'is-disabled': disabled,
      'is-multiple': multiple,
    }"
  >
    <button
      ref="triggerRef"
      type="button"
      class="app-select-trigger"
      :disabled="disabled"
      :aria-expanded="isOpen ? 'true' : 'false'"
      aria-haspopup="listbox"
      :aria-controls="panelId"
      @pointerdown.stop
      @click="toggleOpen"
      @keydown="onTriggerKeydown"
    >
      <span class="app-select-copy">
        <span v-if="multiple && selectedOptions.length" class="app-select-tags">
          <span
            v-for="option in visibleTagOptions"
            :key="option.key"
            class="app-select-tag"
          >
            {{ option.label }}
          </span>
          <span v-if="hiddenTagCount > 0" class="app-select-tag more">
            +{{ hiddenTagCount }}
          </span>
        </span>
        <span
          v-else
          class="app-select-value"
          :class="{ placeholder: !selectedOptions.length }"
        >
          {{ displayText }}
        </span>
        <span v-if="multiple && selectedOptions.length" class="app-select-meta">
          已选 {{ selectedOptions.length }} 项
        </span>
      </span>

      <svg class="app-select-arrow" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M6 9L12 15L18 9"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </button>

    <Teleport to="body">
      <Transition :name="transitionName">
        <div
          v-if="isOpen"
          :id="panelId"
          ref="panelRef"
          class="app-select-panel"
          :class="`is-${panelPlacement}`"
          :style="panelStyle"
          @pointerdown.stop
          @click.stop
          @keydown="onPanelKeydown"
        >
          <div v-if="searchable" class="app-select-search">
            <input
              ref="searchInputRef"
              v-model.trim="searchKeyword"
              type="text"
              class="app-select-search-input"
              placeholder="输入关键字筛选"
              @keydown.stop="onSearchKeydown"
            />
          </div>

          <div
            class="app-select-options"
            :style="optionsInlineStyle"
            role="listbox"
            :aria-multiselectable="multiple ? 'true' : 'false'"
          >
            <button
              v-for="(option, index) in filteredOptions"
              :key="option.key"
              :ref="(element) => setOptionRef(element, index)"
              type="button"
              class="app-select-option"
              :class="{
                'is-active': activeIndex === index,
                'is-selected': isSelected(option.value),
                'is-disabled': option.disabled,
              }"
              role="option"
              :aria-selected="isSelected(option.value) ? 'true' : 'false'"
              @mouseenter="setActiveIndex(index)"
              @click="selectOption(option)"
            >
              <span class="app-select-option-main">
                <span class="app-select-option-label">{{ option.label }}</span>
                <span
                  v-if="option.description"
                  class="app-select-option-description"
                >
                  {{ option.description }}
                </span>
              </span>
              <span v-if="isSelected(option.value)" class="app-select-check">
                <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path
                    d="M5 10.5L8.5 14L15 7"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </span>
            </button>

            <div v-if="!filteredOptions.length" class="app-select-empty">
              {{ emptyText }}
            </div>
          </div>

          <div v-if="multiple && selectedOptions.length" class="app-select-footer">
            <button type="button" class="app-select-footer-btn" @click="clearSelection">
              清空选择
            </button>
            <button
              type="button"
              class="app-select-footer-btn primary"
              @click="finishMultipleSelection"
            >
              完成
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  ref,
  watch,
  type CSSProperties,
} from 'vue'

defineOptions({
  inheritAttrs: false,
})

type PrimitiveValue = string | number | boolean | null

interface NormalizedOption {
  raw: any
  key: string
  label: string
  value: PrimitiveValue
  disabled: boolean
  description: string
}

const props = defineProps({
  modelValue: {
    type: [String, Number, Boolean, Array, Object, null],
    default: '',
  },
  options: {
    type: Array,
    default: () => [],
  },
  placeholder: {
    type: String,
    default: '请选择',
  },
  labelKey: {
    type: String,
    default: 'label',
  },
  valueKey: {
    type: String,
    default: 'value',
  },
  disabledKey: {
    type: String,
    default: 'disabled',
  },
  descriptionKey: {
    type: String,
    default: 'description',
  },
  multiple: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  searchable: {
    type: Boolean,
    default: false,
  },
  emptyText: {
    type: String,
    default: '没有可选项',
  },
  maxTagCount: {
    type: Number,
    default: 2,
  },
})

const emit = defineEmits(['update:modelValue', 'change', 'open', 'close'])

const rootRef = ref<HTMLElement | null>(null)
const triggerRef = ref<HTMLButtonElement | null>(null)
const panelRef = ref<HTMLElement | null>(null)
const searchInputRef = ref<HTMLInputElement | null>(null)
const optionRefs = ref<Array<HTMLElement | null>>([])
const isOpen = ref(false)
const activeIndex = ref(-1)
const searchKeyword = ref('')
const panelPlacement = ref<'top' | 'bottom'>('bottom')
const panelMaxHeight = ref(320)
const panelStyle = ref<CSSProperties>({})

const panelGap = 10
const viewportPadding = 12
const defaultPanelHeight = 320
const panelId = `app-select-panel-${Math.random().toString(36).slice(2, 10)}`

let animationFrameId: number | null = null
let resizeObserver: ResizeObserver | null = null
let listenersBound = false
let suppressOutsideCloseUntil = 0

const normalizedOptions = computed<NormalizedOption[]>(() => {
  return (props.options || []).map((option, index) => normalizeOption(option, index))
})

const filteredOptions = computed(() => {
  const keyword = searchKeyword.value.trim().toLowerCase()
  if (!keyword) return normalizedOptions.value

  return normalizedOptions.value.filter((option) => {
    const haystack = `${option.label} ${option.description}`.toLowerCase()
    return haystack.includes(keyword)
  })
})

const selectedValues = computed<PrimitiveValue[]>(() => {
  if (props.multiple) {
    return Array.isArray(props.modelValue) ? props.modelValue : []
  }

  if (
    props.modelValue === undefined ||
    props.modelValue === null ||
    props.modelValue === ''
  ) {
    return []
  }

  return [props.modelValue as PrimitiveValue]
})

const selectedOptions = computed(() => {
  return normalizedOptions.value.filter((option) => isSelected(option.value))
})

const visibleTagOptions = computed(() => {
  return selectedOptions.value.slice(0, props.maxTagCount)
})

const hiddenTagCount = computed(() => {
  return Math.max(0, selectedOptions.value.length - visibleTagOptions.value.length)
})

const displayText = computed(() => {
  if (!selectedOptions.value.length) return props.placeholder

  if (props.multiple) {
    return selectedOptions.value.map((option) => option.label).join('、')
  }

  return selectedOptions.value[0]?.label || props.placeholder
})

const transitionName = computed(() => {
  return panelPlacement.value === 'top'
    ? 'app-select-panel-up'
    : 'app-select-panel-down'
})

const optionsInlineStyle = computed(() => {
  const reservedHeight =
    (props.searchable ? 64 : 0) +
    (props.multiple && selectedOptions.value.length ? 60 : 0)

  return {
    maxHeight: `${Math.max(120, panelMaxHeight.value - reservedHeight)}px`,
  }
})

function normalizeOption(option: any, index: number): NormalizedOption {
  if (option && typeof option === 'object' && !Array.isArray(option)) {
    const label = option[props.labelKey]
    const value = option[props.valueKey]
    return {
      raw: option,
      key: String(option.id ?? value ?? label ?? index),
      label: String(label ?? value ?? ''),
      value: (value ?? null) as PrimitiveValue,
      disabled: Boolean(option[props.disabledKey]),
      description: String(option[props.descriptionKey] ?? ''),
    }
  }

  return {
    raw: option,
    key: String(option ?? index),
    label: String(option ?? ''),
    value: (option ?? null) as PrimitiveValue,
    disabled: false,
    description: '',
  }
}

function isSelected(value: PrimitiveValue) {
  return selectedValues.value.some((item) => Object.is(item, value))
}

function setOptionRef(element: Element | null, index: number) {
  optionRefs.value[index] = element as HTMLElement | null
}

function setActiveIndex(index: number) {
  activeIndex.value = index
}

function emitValue(nextValue: PrimitiveValue | PrimitiveValue[]) {
  emit('update:modelValue', nextValue)
  emit('change', nextValue)
}

function selectOption(option: NormalizedOption) {
  if (option.disabled) return

  if (props.multiple) {
    const next = [...selectedValues.value]
    const existingIndex = next.findIndex((item) => Object.is(item, option.value))

    if (existingIndex >= 0) {
      next.splice(existingIndex, 1)
    } else {
      next.push(option.value)
    }

    emitValue(next)
    syncActiveIndex()
    queuePanelPositionUpdate()
    return
  }

  emitValue(option.value)
  close({ restoreFocus: true })
}

function clearSelection() {
  emitValue(props.multiple ? [] : '')
  syncActiveIndex()
  queuePanelPositionUpdate()
}

function finishMultipleSelection() {
  close({ restoreFocus: true })
}

function open() {
  if (props.disabled || isOpen.value) return

  isOpen.value = true
  suppressOutsideCloseUntil = performance.now() + 180
  panelMaxHeight.value = defaultPanelHeight
  panelStyle.value = buildPanelStyle(defaultPanelHeight)
  emit('open')

  nextTick(() => {
    bindViewportListeners()
    bindResizeObserver()
    syncActiveIndex()
    queuePanelPositionUpdate()

    if (props.searchable && searchInputRef.value) {
      searchInputRef.value.focus()
      searchInputRef.value.select()
    }
  })
}

function close(options: { restoreFocus?: boolean } = {}) {
  if (!isOpen.value) return

  isOpen.value = false
  searchKeyword.value = ''
  activeIndex.value = -1
  optionRefs.value = []
  panelStyle.value = {}
  cancelPanelPositionUpdate()
  unbindViewportListeners()
  disconnectResizeObserver()
  emit('close')

  if (options.restoreFocus) {
    nextTick(() => {
      triggerRef.value?.focus()
    })
  }
}

function toggleOpen() {
  if (isOpen.value) {
    close()
  } else {
    open()
  }
}

function buildPanelStyle(heightHint = defaultPanelHeight): CSSProperties {
  const triggerElement = triggerRef.value
  if (!triggerElement) return {}

  const triggerRect = triggerElement.getBoundingClientRect()
  const compactViewport = window.innerWidth <= 640
  const desiredHeight = Math.min(460, getPanelContentHeight() || heightHint)
  const availableAbove = Math.max(
    120,
    triggerRect.top - viewportPadding - panelGap,
  )
  const availableBelow = Math.max(
    120,
    window.innerHeight - triggerRect.bottom - viewportPadding - panelGap,
  )
  const shouldOpenTop =
    availableBelow < Math.min(280, desiredHeight) &&
    availableAbove > availableBelow

  const availableSpace = shouldOpenTop ? availableAbove : availableBelow
  panelPlacement.value = shouldOpenTop ? 'top' : 'bottom'
  panelMaxHeight.value = Math.min(desiredHeight, availableSpace)

  const maxViewportWidth = window.innerWidth - viewportPadding * 2
  const minPanelWidth = compactViewport ? 0 : props.searchable ? 260 : 220
  const panelWidth = compactViewport
    ? maxViewportWidth
    : Math.min(
      Math.max(triggerRect.width, minPanelWidth),
      maxViewportWidth,
    )
  const left = compactViewport
    ? viewportPadding
    : clamp(
      triggerRect.left,
      viewportPadding,
      window.innerWidth - viewportPadding - panelWidth,
    )

  return {
    left: `${Math.round(left)}px`,
    width: `${Math.round(panelWidth)}px`,
    maxHeight: `${Math.round(panelMaxHeight.value)}px`,
    top: shouldOpenTop
      ? 'auto'
      : `${Math.round(triggerRect.bottom + panelGap)}px`,
    bottom: shouldOpenTop
      ? `${Math.round(window.innerHeight - triggerRect.top + panelGap)}px`
      : 'auto',
  }
}

function updatePanelPosition() {
  if (!isOpen.value) return
  panelStyle.value = buildPanelStyle()
}

function queuePanelPositionUpdate() {
  if (!isOpen.value) return
  cancelPanelPositionUpdate()

  animationFrameId = window.requestAnimationFrame(() => {
    animationFrameId = null
    updatePanelPosition()
  })
}

function cancelPanelPositionUpdate() {
  if (animationFrameId !== null) {
    window.cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }
}

function syncActiveIndex() {
  nextTick(() => {
    const firstEnabledIndex = filteredOptions.value.findIndex(
      (option) => !option.disabled,
    )
    const selectedIndex = filteredOptions.value.findIndex(
      (option) => isSelected(option.value) && !option.disabled,
    )

    activeIndex.value =
      selectedIndex >= 0 ? selectedIndex : firstEnabledIndex

    scrollActiveOptionIntoView()
  })
}

function scrollActiveOptionIntoView() {
  nextTick(() => {
    if (activeIndex.value < 0) return

    const optionElement = optionRefs.value[activeIndex.value]
    optionElement?.scrollIntoView({ block: 'nearest' })
  })
}

function moveActive(step: number) {
  if (!filteredOptions.value.length) return

  const total = filteredOptions.value.length
  let nextIndex = activeIndex.value

  for (let attempts = 0; attempts < total; attempts += 1) {
    nextIndex =
      nextIndex < 0
        ? step > 0
          ? 0
          : total - 1
        : (nextIndex + step + total) % total

    if (!filteredOptions.value[nextIndex]?.disabled) {
      activeIndex.value = nextIndex
      scrollActiveOptionIntoView()
      return
    }
  }
}

function commitActiveOption() {
  if (activeIndex.value < 0) return

  const option = filteredOptions.value[activeIndex.value]
  if (!option || option.disabled) return

  selectOption(option)
}

function onTriggerKeydown(event: KeyboardEvent) {
  switch (event.key) {
    case 'ArrowDown':
    case 'Enter':
    case ' ':
      event.preventDefault()
      if (!isOpen.value) {
        open()
      } else {
        moveActive(1)
      }
      break
    case 'ArrowUp':
      event.preventDefault()
      if (!isOpen.value) {
        open()
      } else {
        moveActive(-1)
      }
      break
    case 'Escape':
      event.preventDefault()
      close()
      break
    case 'Tab':
      close()
      break
    default:
      break
  }
}

function onPanelKeydown(event: KeyboardEvent) {
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      moveActive(1)
      break
    case 'ArrowUp':
      event.preventDefault()
      moveActive(-1)
      break
    case 'Enter':
      event.preventDefault()
      commitActiveOption()
      break
    case 'Escape':
      event.preventDefault()
      close({ restoreFocus: true })
      break
    case 'Tab':
      close()
      break
    default:
      break
  }
}

function onSearchKeydown(event: KeyboardEvent) {
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    moveActive(1)
    return
  }

  if (event.key === 'ArrowUp') {
    event.preventDefault()
    moveActive(-1)
    return
  }

  if (event.key === 'Enter') {
    event.preventDefault()
    commitActiveOption()
    return
  }

  if (event.key === 'Escape') {
    event.preventDefault()
    close({ restoreFocus: true })
    return
  }

  if (
    event.key === 'Backspace' &&
    props.multiple &&
    !searchKeyword.value &&
    selectedOptions.value.length
  ) {
    event.preventDefault()
    const lastSelected = selectedOptions.value[selectedOptions.value.length - 1]
    if (lastSelected) {
      selectOption(lastSelected)
    }
    return
  }

  if (event.key === 'Tab') {
    close()
  }
}

function handlePointerDown(event: PointerEvent) {
  if (performance.now() < suppressOutsideCloseUntil) {
    return
  }

  const path =
    typeof event.composedPath === 'function' ? event.composedPath() : []

  if (
    (rootRef.value && path.includes(rootRef.value)) ||
    (panelRef.value && path.includes(panelRef.value))
  ) {
    return
  }

  const target = event.target as Node | null
  if (
    target &&
    (rootRef.value?.contains(target) || panelRef.value?.contains(target))
  ) {
    return
  }

  close()
}

function handleViewportResize() {
  queuePanelPositionUpdate()
}

function handleViewportScroll(event: Event) {
  const target = event.target as Node | null

  if (
    target &&
    (rootRef.value?.contains(target) || panelRef.value?.contains(target))
  ) {
    return
  }

  queuePanelPositionUpdate()
}

function bindViewportListeners() {
  if (listenersBound) return

  document.addEventListener('pointerdown', handlePointerDown)
  window.addEventListener('resize', handleViewportResize)
  window.addEventListener('scroll', handleViewportScroll, true)
  listenersBound = true
}

function unbindViewportListeners() {
  if (!listenersBound) return

  document.removeEventListener('pointerdown', handlePointerDown)
  window.removeEventListener('resize', handleViewportResize)
  window.removeEventListener('scroll', handleViewportScroll, true)
  listenersBound = false
}

function bindResizeObserver() {
  if (typeof ResizeObserver === 'undefined') return

  disconnectResizeObserver()
  resizeObserver = new ResizeObserver(() => {
    queuePanelPositionUpdate()
  })

  if (triggerRef.value) {
    resizeObserver.observe(triggerRef.value)
  }
}

function disconnectResizeObserver() {
  resizeObserver?.disconnect()
  resizeObserver = null
}

function clamp(value: number, min: number, max: number) {
  if (max <= min) return min
  return Math.min(Math.max(value, min), max)
}

function getPanelContentHeight() {
  const searchHeight = props.searchable ? 64 : 0
  const footerHeight = props.multiple && selectedOptions.value.length ? 60 : 0
  const emptyHeight = 60
  const optionHeight = 56
  const optionGap = 4
  const optionsPadding = 16

  const optionCount = filteredOptions.value.length
  const optionsHeight = optionCount
    ? optionCount * optionHeight + Math.max(0, optionCount - 1) * optionGap + optionsPadding
    : emptyHeight + optionsPadding

  return searchHeight + footerHeight + optionsHeight
}

watch(
  () => props.modelValue,
  () => {
    if (!isOpen.value) return
    syncActiveIndex()
    queuePanelPositionUpdate()
  },
)

watch(searchKeyword, () => {
  optionRefs.value = []
  syncActiveIndex()
  queuePanelPositionUpdate()
})

watch(normalizedOptions, () => {
  optionRefs.value = []
  if (!isOpen.value) return
  syncActiveIndex()
  queuePanelPositionUpdate()
})

watch(
  () => selectedOptions.value.length,
  () => {
    if (!isOpen.value) return
    queuePanelPositionUpdate()
  },
)

watch(
  () => props.disabled,
  (disabled) => {
    if (disabled) {
      close()
    }
  },
)

onBeforeUnmount(() => {
  cancelPanelPositionUpdate()
  unbindViewportListeners()
  disconnectResizeObserver()
})
</script>

<style scoped>
.app-select {
  position: relative;
  width: 100%;
}

.app-select.is-open {
  z-index: 80;
}

.app-select.input {
  padding: 0 !important;
  border: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
}

.app-select-trigger {
  width: 100%;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 14px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.04), rgba(120, 163, 255, 0.05)),
    rgba(255, 255, 255, 0.04);
  color: var(--text);
  backdrop-filter: blur(18px);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.04),
    0 12px 30px rgba(5, 10, 24, 0.12);
  cursor: pointer;
  transition:
    border-color 180ms ease,
    box-shadow 180ms ease,
    background 180ms ease,
    transform 180ms ease;
}

.app-select-trigger:hover {
  border-color: color-mix(in srgb, var(--accent) 42%, transparent);
  box-shadow:
    0 0 0 1px color-mix(in srgb, var(--accent) 18%, transparent),
    0 14px 34px rgba(5, 10, 24, 0.2),
    0 0 24px color-mix(in srgb, var(--accent) 12%, transparent);
  transform: translateY(-1px);
}

.app-select-trigger:focus-visible {
  outline: none;
  border-color: color-mix(in srgb, var(--accent) 56%, transparent);
  box-shadow:
    0 0 0 3px color-mix(in srgb, var(--accent) 18%, transparent),
    0 18px 38px rgba(5, 10, 24, 0.24);
}

.app-select.is-open .app-select-trigger {
  border-color: color-mix(in srgb, var(--accent) 58%, transparent);
  box-shadow:
    0 0 0 3px color-mix(in srgb, var(--accent) 14%, transparent),
    0 18px 42px rgba(5, 10, 24, 0.22),
    0 0 32px color-mix(in srgb, var(--accent) 14%, transparent);
  background:
    linear-gradient(135deg, rgba(120, 163, 255, 0.08), rgba(255, 123, 176, 0.08)),
    rgba(255, 255, 255, 0.06);
}

.app-select.is-disabled .app-select-trigger {
  opacity: 0.56;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.app-select-copy {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.app-select-value {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--text);
}

.app-select-value.placeholder {
  color: var(--muted);
}

.app-select-tags {
  min-width: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.app-select-tag {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(120, 163, 255, 0.16);
  color: #d7e6ff;
  font-size: 12px;
  line-height: 1.2;
}

.app-select-tag.more {
  background: rgba(255, 255, 255, 0.08);
  color: var(--muted);
}

.app-select-meta {
  color: var(--muted);
  font-size: 12px;
}

.app-select-arrow {
  width: 18px;
  height: 18px;
  flex: 0 0 auto;
  color: var(--muted);
  transition: transform 180ms ease, color 180ms ease;
}

.app-select.is-open .app-select-arrow {
  transform: rotate(180deg);
  color: var(--accent);
}

.app-select-panel {
  position: fixed;
  z-index: 1000;
  overflow: hidden;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background:
    linear-gradient(180deg, rgba(14, 20, 40, 0.96), rgba(8, 14, 28, 0.96));
  box-shadow:
    0 24px 60px rgba(3, 8, 20, 0.42),
    0 0 40px color-mix(in srgb, var(--accent) 12%, transparent);
  backdrop-filter: blur(22px);
  display: flex;
  flex-direction: column;
}

.app-select-panel.is-top {
  transform-origin: bottom center;
}

.app-select-panel.is-bottom {
  transform-origin: top center;
}

.app-select-panel-down-enter-active,
.app-select-panel-down-leave-active,
.app-select-panel-up-enter-active,
.app-select-panel-up-leave-active {
  transition: opacity 180ms ease, transform 180ms ease;
}

.app-select-panel-down-enter-from,
.app-select-panel-down-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.98);
}

.app-select-panel-up-enter-from,
.app-select-panel-up-leave-to {
  opacity: 0;
  transform: translateY(8px) scale(0.98);
}

.app-select-search {
  padding: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.app-select-search-input {
  width: 100%;
  height: 40px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 14px;
  padding: 0 12px;
  background: rgba(255, 255, 255, 0.04);
  color: var(--text);
}

.app-select-search-input::placeholder {
  color: var(--muted);
}

.app-select-search-input:focus {
  outline: none;
  border-color: color-mix(in srgb, var(--accent) 58%, transparent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 14%, transparent);
}

.app-select-options {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: 8px;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
  touch-action: pan-y;
}

.app-select-option {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border: 0;
  border-radius: 16px;
  background: transparent;
  color: var(--text);
  cursor: pointer;
  text-align: left;
  touch-action: pan-y;
  transition:
    background 160ms ease,
    box-shadow 160ms ease,
    transform 160ms ease,
    color 160ms ease;
}

.app-select-option + .app-select-option {
  margin-top: 4px;
}

.app-select-option:hover,
.app-select-option.is-active {
  background:
    linear-gradient(135deg, rgba(120, 163, 255, 0.18), rgba(255, 123, 176, 0.1));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.04),
    0 10px 22px rgba(7, 12, 26, 0.18);
  transform: translateX(2px);
}

.app-select-option.is-selected {
  background:
    linear-gradient(135deg, rgba(120, 163, 255, 0.26), rgba(255, 123, 176, 0.16));
  box-shadow:
    inset 0 0 0 1px rgba(120, 163, 255, 0.24),
    0 12px 24px rgba(7, 12, 26, 0.18),
    0 0 24px color-mix(in srgb, var(--accent) 12%, transparent);
}

.app-select-option.is-disabled {
  opacity: 0.42;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.app-select-option-main {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.app-select-option-label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.app-select-option-description {
  color: var(--muted);
  font-size: 12px;
}

.app-select-check {
  width: 18px;
  height: 18px;
  color: var(--accent-3);
  flex: 0 0 auto;
}

.app-select-check svg {
  width: 100%;
  height: 100%;
}

.app-select-empty {
  padding: 18px 14px;
  text-align: center;
  color: var(--muted);
  font-size: 13px;
}

.app-select-footer {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  padding: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.app-select-footer-btn {
  min-width: 88px;
  height: 38px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.04);
  color: var(--text);
  cursor: pointer;
  transition:
    background 160ms ease,
    border-color 160ms ease,
    transform 160ms ease;
}

.app-select-footer-btn:hover {
  transform: translateY(-1px);
  border-color: color-mix(in srgb, var(--accent) 30%, transparent);
  background: rgba(255, 255, 255, 0.08);
}

.app-select-footer-btn.primary {
  background: linear-gradient(135deg, rgba(120, 163, 255, 0.86), rgba(255, 123, 176, 0.72));
  color: #fff;
  border-color: transparent;
}

@media (max-width: 640px) {
  .app-select-trigger {
    min-height: 46px;
    padding: 10px 12px;
    border-radius: 14px;
  }

  .app-select-panel {
    border-radius: 18px;
  }

  .app-select-options {
    scroll-behavior: auto;
  }

  .app-select-search {
    padding: 10px;
  }

  .app-select-option {
    padding: 11px 12px;
    border-radius: 14px;
  }

  .app-select-footer {
    flex-direction: column;
  }

  .app-select-footer-btn {
    width: 100%;
  }
}
</style>
