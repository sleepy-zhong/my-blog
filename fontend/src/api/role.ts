import axios from './index'
import type { Id, UnknownData } from '@/types/common'

export function getRoles() {
  return axios.get('/api/roles')
}
export function getRole(id: Id) {
  return axios.get(`/api/roles/${id}`)
}
export function addRole(data: UnknownData) {
  return axios.post('/api/roles', data)
}
export function updateRole(id: Id, data: UnknownData) {
  return axios.put(`/api/roles/${id}`, data)
}
export function deleteRole(id: Id) {
  return axios.delete(`/api/roles/${id}`)
}
// assignPermissions/removePermission 仅供后端接口调用，前端页面已无直接关联
export function assignPermissions(id: Id, permissionIds: Array<Id>) {
  return axios.post(`/api/roles/${id}/permissions`, { permissionIds })
}
export function removePermission(id: Id, permissionId: Id) {
  return axios.delete(`/api/roles/${id}/permissions/${permissionId}`)
} 