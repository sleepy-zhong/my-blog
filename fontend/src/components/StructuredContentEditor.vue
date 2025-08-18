<template>
  <div class="bg-gray-50 rounded-xl shadow-inner p-6 border border-gray-100">
    <div v-for="(item, idx) in localContent" :key="item.id || idx" class="mb-2 flex gap-2 items-center border-b last:border-b-0 hover:bg-blue-50 transition">
      <select v-model="item.type" class="border rounded px-2 py-1">
        <option value="h1">一级标题</option>
        <option value="h2">二级标题</option>
        <option value="h3">三级标题</option>
        <option value="p">正文</option>
        <option value="ol">有序列表</option>
        <option value="table">表格</option>
      </select>
      <input v-if="['h1','h2','h3','p'].includes(item.type)" v-model="item.text" class="border rounded px-2 py-1 flex-1" />
      <textarea v-if="item.type==='table'" v-model="item.html" class="border rounded px-2 py-1 flex-1" placeholder="表格HTML"></textarea>
      <textarea v-if="item.type==='ol'" v-model="item.itemsStr" class="border rounded px-2 py-1 flex-1" placeholder="每行一个条目"></textarea>
      <button @click="remove(idx)" class="rounded-full bg-red-100 text-red-600 hover:bg-red-200 w-8 h-8 flex items-center justify-center ml-2" title="删除"><span class="text-lg">×</span></button>
    </div>
    <div class="flex flex-wrap gap-2 mt-4">
      <button @click="add('p')" class="btn-primary">添加正文</button>
      <button @click="add('h1')" class="btn-primary">添加一级标题</button>
      <button @click="add('h2')" class="btn-primary">添加二级标题</button>
      <button @click="add('h3')" class="btn-primary">添加三级标题</button>
      <button @click="add('ol')" class="btn-primary">添加有序列表</button>
      <button @click="add('table')" class="btn-primary">添加表格</button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
const props = defineProps({
  modelValue: { type: Array, default: () => [] }
})
const emit = defineEmits(['update:modelValue'])

const localContent = ref(props.modelValue.map(item => ({ ...item, itemsStr: item.items ? item.items.join('\n') : '' })))

watch(() => props.modelValue, (val) => {
  localContent.value = val.map(item => ({ ...item, itemsStr: item.items ? item.items.join('\n') : '' }))
})

watch(localContent, (val) => {
  // 转换 ol 的 itemsStr 为 items 数组
  const out = val.map(item => {
    if (item.type === 'ol') {
      return { ...item, items: item.itemsStr.split('\n').filter(Boolean) }
    }
    return { ...item }
  })
  emit('update:modelValue', out)
}, { deep: true })

function add(type) {
  if (type === 'ol') {
    localContent.value.push({ type: 'ol', items: [], itemsStr: '' })
  } else if (type === 'table') {
    localContent.value.push({ type: 'table', html: '' })
  } else {
    localContent.value.push({ type, text: '' })
  }
}
function remove(idx) {
  localContent.value.splice(idx, 1)
}
</script>

<style scoped>
.btn-primary { @apply bg-blue-600 text-white rounded-xl px-4 py-2 hover:bg-blue-700 transition font-bold shadow-lg; }
</style> 