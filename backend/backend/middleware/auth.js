const errorCode = require('./errorCode')
const { extractAccessToken, verifyAccessToken } = require('../utils/authSession')

module.exports = async function (req, res, next) {
  const token = extractAccessToken(req)

  if (!token) {
    return res.status(401).json({
      code: errorCode.AUTH_ERROR.code,
      message: '未登录或登录状态已失效',
    })
  }

  try {
    const { claims } = await verifyAccessToken(token)
    req.authToken = token
    req.user = claims
    next()
  } catch (err) {
    return res.status(err.status || 401).json({
      code: err.code || errorCode.AUTH_ERROR.code,
      message: err.message || '未登录或登录状态已失效',
    })
  }
}
