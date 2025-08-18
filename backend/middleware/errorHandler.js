const errorCode = require('./errorCode');

module.exports = (err, req, res, next) => {
  // 业务异常（自定义错误）
  if (err && err.code !== undefined && err.message) {
    return res.status(200).json({
      code: err.code,
      message: err.message,
      data: err.data || null,
      error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
  // 参数校验异常
  if (err && err.name === 'ValidationError') {
    return res.status(200).json({
      code: errorCode.VALIDATION_ERROR.code,
      message: err.message,
      data: err.errors || null,
      error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
  // Sequelize 校验错误
  if (err && err.name && err.name.startsWith('Sequelize')) {
    return res.status(200).json({
      code: errorCode.SEQUELIZE_ERROR.code,
      message: err.message,
      data: null,
      error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
  // 认证失败
  if (err && err.name === 'UnauthorizedError') {
    return res.status(401).json({
      code: errorCode.AUTH_ERROR.code,
      message: errorCode.AUTH_ERROR.message,
      data: null,
      error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
  // 其他未知异常
  console.error('系统异常:', err);
  res.status(500).json({
    code: errorCode.SYSTEM_ERROR.code,
    message: errorCode.SYSTEM_ERROR.message,
    data: null,
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
}; 