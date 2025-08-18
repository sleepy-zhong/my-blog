// 全局错误码和错误类型定义
module.exports = {
  SUCCESS: { code: 0, message: 'success' },
  VALIDATION_ERROR: { code: 1001, message: '参数校验失败' },
  INVALID_PARAMS: { code: 1006, message: '无效参数' },
  AUTH_ERROR: { code: 1002, message: '认证失败' },
  PERMISSION_DENIED: { code: 1003, message: '无权限' },
  NOT_FOUND: { code: 1004, message: '资源不存在' },
  DUPLICATE: { code: 1005, message: '数据重复' },
  SEQUELIZE_ERROR: { code: 2001, message: '数据库操作异常' },
  SYSTEM_ERROR: { code: 500, message: '服务器内部错误' },
  // 可扩展更多业务错误码
}; 