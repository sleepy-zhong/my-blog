import axios from './index'
import type { Id, UnknownData } from '@/types/common'

// 该文件API仅供后端接口调用，前端页面已无直接关联
export function getPermissions() {
  return axios.get('/api/permissions')
}
export function getPermission(id: Id) {
  return axios.get(`/api/permissions/${id}`)
}
export function addPermission(data: UnknownData) {
  return axios.post('/api/permissions', data)
}
export function updatePermission(id: Id, data: UnknownData) {
  return axios.put(`/api/permissions/${id}`, data)
}
export function deletePermission(id: Id) {
  return axios.delete(`/api/permissions/${id}`)
} 