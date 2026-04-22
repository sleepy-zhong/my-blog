import instance from './index'

export function sendRegisterCode(data: { email: string }) {
  return instance.post('/api/users/register/code', data)
}

export function register(data: {
  username: string
  email: string
  password: string
  phoneNumber?: string
  code: string
}) {
  return instance.post('/api/users/register', data)
}

export function sendLoginCode(data: Record<string, unknown>) {
  return instance.post('/api/users/login/code', data)
}

export function login(data: Record<string, unknown>) {
  return instance.post('/api/users/login', data)
}

export function refreshSession() {
  return instance.post('/api/users/refresh')
}

export function logout() {
  return instance.post('/api/users/logout')
}

export function getCurrentUser() {
  return instance.get('/api/users/me')
}

export function updateProfile(data: FormData | Record<string, unknown>) {
  return instance.put('/api/users/me', data)
}

export function sendChangePasswordCode() {
  return instance.put('/api/users/me/password/code')
}

export function updatePassword(data: Record<string, unknown>) {
  return instance.put('/api/users/me/password', data)
}

export function updateEmail(data: { email: string }) {
  return instance.put('/api/users/me/email', data)
}

export function sendForgotPasswordCode(data: { email: string }) {
  return instance.post('/api/users/forgot-password/code', data)
}

export function forgotPassword(data: { email: string; code: string; newPassword: string }) {
  return instance.post('/api/users/forgot-password', data)
}

export function getUsers(params: Record<string, unknown>) {
  return instance.get('/api/users', { params })
}

export function addUser(data: Record<string, unknown>) {
  return instance.post('/api/users', data)
}

export function updateUser(id: string | number, data: FormData | Record<string, unknown>) {
  if (data instanceof FormData) {
    return instance.put(`/api/users/${id}`, data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  }

  return instance.put(`/api/users/${id}`, data)
}

export function deleteUser(id: string | number) {
  return instance.delete(`/api/users/${id}`)
}

export function setUserStatus(id: string | number, isActive: boolean) {
  return instance.put(`/api/users/${id}/status`, { isActive })
}

export function forceOfflineUser(id: string | number) {
  return instance.post(`/api/users/${id}/offline`)
}

export function assignRoles(id: string | number, roleIds: Array<string | number>) {
  return instance.post(`/api/users/${id}/roles`, { roleIds })
}

export function removeUserRole(id: string | number, roleId: string | number) {
  return instance.delete(`/api/users/${id}/roles/${roleId}`)
}

export function getRoles() {
  return instance.get('/api/roles')
}

export function getUserStatistics() {
  return instance.get('/api/users/statistics')
}

export function batchDeleteUsers(userIds: Array<string | number>) {
  return instance.post('/api/users/batch-delete', { userIds })
}

export function getOnlineUsers() {
  return instance.get('/api/users/online')
}

export function getUserById(id: string | number) {
  return instance.get(`/api/users/${id}`)
}

export function updateUserAll(id: string | number, data: Record<string, unknown>) {
  return instance.put(`/api/users/${id}/all`, data)
}
