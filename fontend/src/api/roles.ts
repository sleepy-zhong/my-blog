import instance from './index'

export interface CreateRolePayload { name: string; description?: string }
export interface UpdateRolePayload { name?: string; description?: string }

export function getRoles() {
  return instance.get('/api/roles')
}

export function createRole(data: CreateRolePayload) {
  return instance.post('/api/roles', data)
}

export function getRoleById(id: number | string) {
  return instance.get(`/api/roles/${id}`)
}

export function updateRole(id: number | string, data: UpdateRolePayload) {
  return instance.put(`/api/roles/${id}`, data)
}

export function deleteRole(id: number | string) {
  return instance.delete(`/api/roles/${id}`)
}

export function getUsersByRole(id: number | string) {
  return instance.get(`/api/roles/${id}/users`)
}

export function assignPermissions(id: number | string, data: { permissionIds?: number[]; permissionKeyList?: string[] }) {
  return instance.post(`/api/roles/${id}/permissions`, data)
}

export function removePermission(id: number | string, permissionId: number | string) {
  return instance.delete(`/api/roles/${id}/permissions/${permissionId}`)
}

