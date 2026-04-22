<template>
  <div class="bg-gray-50 rounded-xl shadow-inner p-6 border border-gray-100">
    <div class="mb-4">
      <label class="block mb-1 font-semibold">文章标签</label>
      <input v-model="localMeta.tagsStr" class="input" placeholder="多个标签用逗号分隔" />
    </div>
    <div class="mb-4">
      <label class="block mb-1 font-semibold">文章分类</label>
      <input v-model="localMeta.categoriesStr" class="input" placeholder="多个分类用逗号分隔" />
    </div>
    <div class="mb-4">
      <label class="block mb-1 font-semibold">文章摘要</label>
      <textarea v-model="localMeta.summary" class="input" rows="2" placeholder="请输入摘要，帮助读者快速了解内容" />
    </div>
    <div class="mb-4">
      <label class="block mb-1 font-semibold">封面图片</label>
      <input type="file" @change="onCoverChange" class="input" />
      <img v-if="localMeta.cover" :src="localMeta.cover" class="mt-2 w-32 h-20 object-cover rounded" />
    </div>
    <div class="mb-4">
      <label class="block mb-1 font-semibold">可见范围</label>
      <AppSelect
        v-model="localMeta.visibility"
        class="input"
        :options="visibilityOptions"
        placeholder="全部可见"
      />
    </div>
    <div class="mb-4">
      <label class="block mb-1 font-semibold">定时发布</label>
      <input type="datetime-local" v-model="localMeta.schedule" class="input" />
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import AppSelect from '@/components/AppSelect.vue'
const props = defineProps({
  modelValue: { type: Object, default: () => ({}) }
})
const emit = defineEmits(['update:modelValue'])

const localMeta = ref({ ...props.modelValue, tagsStr: (props.modelValue.tags || []).join(','), categoriesStr: (props.modelValue.categories || []).join(',') })
const visibilityOptions = [
  { label: '全部可见', value: 'public' },
  { label: '仅我可见', value: 'private' },
  { label: '粉丝可见', value: 'fans' },
  { label: 'VIP可见', value: 'vip' }
]

watch(() => props.modelValue, (val) => {
  localMeta.value = { ...val, tagsStr: (val.tags || []).join(','), categoriesStr: (val.categories || []).join(',') }
})

watch(localMeta, (val) => {
  emit('update:modelValue', {
    ...val,
    tags: val.tagsStr.split(',').map(t => t.trim()).filter(Boolean),
    categories: val.categoriesStr.split(',').map(c => c.trim()).filter(Boolean)
  })
}, { deep: true })

function onCoverChange(e) {
  const file = e.target.files[0]
  if (!file) return
  // 简单本地预览，实际应上传到服务器
  const reader = new FileReader()
  reader.onload = (ev) => {
    localMeta.value.cover = ev.target.result
  }
  reader.readAsDataURL(file)
}
</script> 
