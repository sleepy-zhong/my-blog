<template>
  <div class="flex justify-center mt-6" v-if="totalPages > 1">
    <button @click="prev" :disabled="page === 1" class="px-3 py-1 mx-1 rounded border bg-white disabled:opacity-50">上一页</button>
    <button v-for="p in totalPages" :key="p" @click="go(p)" :class="['px-3 py-1 mx-1 rounded border', p === page ? 'bg-blue-500 text-white' : 'bg-white']">{{ p }}</button>
    <button @click="next" :disabled="page === totalPages" class="px-3 py-1 mx-1 rounded border bg-white disabled:opacity-50">下一页</button>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'
const props = defineProps({ page: Number, totalPages: Number })
const emit = defineEmits(['update:page'])
function go(p) { emit('update:page', p) }
function prev() { if (props.page > 1) go(props.page - 1) }
function next() { if (props.page < props.totalPages) go(props.page + 1) }
</script> 