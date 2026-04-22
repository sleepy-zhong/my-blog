const { extractAccessToken, verifyAccessToken } = require('../utils/authSession')

module.exports = async function (req, _res, next) {
  const token = extractAccessToken(req)

  if (!token) {
    req.user = undefined
    req.authToken = undefined
    return next()
  }

  try {
    const { claims } = await verifyAccessToken(token)
    req.user = claims
    req.authToken = token
  } catch (_err) {
    req.user = undefined
    req.authToken = undefined
  }

  next()
}
