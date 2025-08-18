import instance from './index'

// 用户注册
export function register(data: { 
  username: string; 
  email: string; 
  password: string; 
  phoneNumber?: string;
}) {
  return instance.post('/api/users/register', data)
}

export function login(data: Record<string, unknown>) {
  return instance.post('/api/users/login', data)
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

export function updatePassword(data: Record<string, unknown>) {
  return instance.put('/api/users/me/password', data)
} 

// 更新当前用户邮箱
export function updateEmail(data: { email: string }) {
  return instance.put('/api/users/me/email', data)
}

// 获取用户列表（分页、搜索、筛选）
export function getUsers(params: Record<string, unknown>) {
  return instance.get('/api/users', { params });
}
// 新增用户
export function addUser(data: Record<string, unknown>) {
  return instance.post('/api/users/register', data);
}
// 编辑用户
export function updateUser(id: string | number, data: FormData | Record<string, unknown>) {
  // 检查data是否是FormData
  if (data instanceof FormData) {
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }
    return instance.put(`/api/users/${id}`, data, config);
  } else {
    // 如果是普通对象，使用JSON格式
    return instance.put(`/api/users/${id}`, data);
  }
}
// 删除用户
export function deleteUser(id: string | number) {
  return instance.delete(`/api/users/${id}`);
}
// 启用/禁用用户
export function setUserStatus(id: string | number, isActive: boolean) {
  return instance.put(`/api/users/${id}/status`, { isActive });
}
// 分配角色
export function assignRoles(id: string | number, roleIds: Array<string | number>) {
  return instance.post(`/api/users/${id}/roles`, { roleIds });
}
// 移除用户角色
export function removeUserRole(id: string | number, roleId: string | number) {
  return instance.delete(`/api/users/${id}/roles/${roleId}`);
}
// 获取角色列表（用于用户管理）
export function getRoles() {
  return instance.get('/api/roles');
}
// 获取用户统计信息
export function getUserStatistics() {
  return instance.get('/api/users/statistics');
}
// 批量删除用户
export function batchDeleteUsers(userIds: Array<string | number>) {
  return instance.post('/api/users/batch-delete', { userIds });
}
// 获取在线用户
export function getOnlineUsers() {
  return instance.get('/api/users/online');
} 

// 其他用户相关接口
export function forgotPassword(data: { email: string }) {
  return instance.post('/api/users/forgot-password', data)
}

export function getUserById(id: string | number) {
  return instance.get(`/api/users/${id}`)
}

// 管理员全量更新用户信息
export function updateUserAll(id: string | number, data: Record<string, unknown>) {
  return instance.put(`/api/users/${id}/all`, data)
}