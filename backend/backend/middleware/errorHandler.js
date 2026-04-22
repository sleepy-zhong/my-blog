const errorCode = require('./errorCode')

function buildPayload(code, message, data, err) {
  return {
    code,
    message,
    data: data || null,
    error: process.env.NODE_ENV === 'development' ? err?.stack : undefined,
  }
}

function resolveStatus(err) {
  if (Number.isInteger(err?.status) && err.status >= 400) {
    return err.status
  }

  if (['UnauthorizedError', 'JsonWebTokenError', 'TokenExpiredError'].includes(err?.name)) {
    return 401
  }

  switch (err?.code) {
    case errorCode.VALIDATION_ERROR.code:
    case errorCode.INVALID_PARAMS.code:
      return 400
    case errorCode.AUTH_ERROR.code:
      return 401
    case errorCode.PERMISSION_DENIED.code:
      return 403
    case errorCode.NOT_FOUND.code:
      return 404
    case errorCode.DUPLICATE.code:
      return 409
    default:
      break
  }

  switch (err?.name) {
    case 'ValidationError':
    case 'SequelizeValidationError':
      return 400
    case 'SequelizeUniqueConstraintError':
      return 409
    case 'SequelizeForeignKeyConstraintError':
      return 409
    default:
      return 500
  }
}

module.exports = (err, req, res, next) => {
  const status = resolveStatus(err)

  if (err && err.code !== undefined && err.message) {
    return res.status(status).json(buildPayload(err.code, err.message, err.data, err))
  }

  if (err && ['ValidationError', 'SequelizeValidationError'].includes(err.name)) {
    return res.status(400).json(
      buildPayload(
        errorCode.VALIDATION_ERROR.code,
        err.message || errorCode.VALIDATION_ERROR.message,
        err.errors || null,
        err
      )
    )
  }

  if (err && err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json(
      buildPayload(
        errorCode.DUPLICATE.code,
        err.message || errorCode.DUPLICATE.message,
        err.errors || null,
        err
      )
    )
  }

  if (err && err.name && err.name.startsWith('Sequelize')) {
    return res.status(status).json(
      buildPayload(
        errorCode.SEQUELIZE_ERROR.code,
        err.message || errorCode.SEQUELIZE_ERROR.message,
        null,
        err
      )
    )
  }

  if (err && ['UnauthorizedError', 'JsonWebTokenError', 'TokenExpiredError'].includes(err.name)) {
    return res.status(401).json(
      buildPayload(errorCode.AUTH_ERROR.code, errorCode.AUTH_ERROR.message, null, err)
    )
  }

  console.error('系统异常:', err)
  return res.status(500).json(
    buildPayload(errorCode.SYSTEM_ERROR.code, errorCode.SYSTEM_ERROR.message, null, err)
  )
}
