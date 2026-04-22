const crypto = require('crypto')
const jwt = require('jsonwebtoken')
const { Op } = require('sequelize')
const errorCode = require('../middleware/errorCode')
const jwtConfig = require('../config/jwt')
const { User, Role, TokenBlacklist, AuthSession } = require('../models')

const ACCESS_COOKIE_NAME = (process.env.JWT_ACCESS_COOKIE_NAME || process.env.JWT_COOKIE_NAME || 'blog_access_token').trim()
const REFRESH_COOKIE_NAME = (process.env.JWT_REFRESH_COOKIE_NAME || 'blog_refresh_token').trim()

function parseBoolean(value, fallback = false) {
  if (value === undefined || value === null || value === '') return fallback
  if (typeof value === 'boolean') return value

  const normalized = String(value).trim().toLowerCase()
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false
  return fallback
}

function normalizeSameSite(value) {
  const normalized = String(value || 'lax').trim().toLowerCase()
  if (normalized === 'strict') return 'strict'
  if (normalized === 'none') return 'none'
  return 'lax'
}

function parseCookieHeader(cookieHeader) {
  return String(cookieHeader || '')
    .split(';')
    .map(item => item.trim())
    .filter(Boolean)
    .reduce((cookies, pair) => {
      const separatorIndex = pair.indexOf('=')
      if (separatorIndex <= 0) return cookies

      const key = pair.slice(0, separatorIndex).trim()
      const value = pair.slice(separatorIndex + 1).trim()
      if (!key) return cookies

      try {
        cookies[key] = decodeURIComponent(value)
      } catch (_err) {
        cookies[key] = value
      }

      return cookies
    }, {})
}

function getRequestIp(req) {
  const forwardedFor = String(req?.headers?.['x-forwarded-for'] || '').split(',')[0].trim()
  return forwardedFor || req?.ip || req?.socket?.remoteAddress || ''
}

function extractBearerToken(req) {
  const authHeader = req.header('Authorization')
  if (!authHeader) return ''

  const [scheme, token] = authHeader.split(' ')
  if (!scheme || !token || scheme.toLowerCase() !== 'bearer') {
    return ''
  }

  return token.trim()
}

function extractCookieToken(req, cookieName) {
  const cookies = parseCookieHeader(req?.headers?.cookie)
  const token = cookies[cookieName]
  return token ? String(token).trim() : ''
}

function extractAccessToken(req) {
  return extractBearerToken(req) || extractCookieToken(req, ACCESS_COOKIE_NAME)
}

function extractRefreshToken(req) {
  return extractCookieToken(req, REFRESH_COOKIE_NAME)
}

function hashToken(token) {
  return crypto.createHash('sha256').update(String(token || '')).digest('hex')
}

function createBusinessError(status, code, message) {
  const err = new Error(message)
  err.status = status
  err.code = code
  return err
}

function buildUserClaims(user) {
  const roles = Array.isArray(user?.Roles)
    ? user.Roles.map(role => role?.Name).filter(Boolean)
    : []

  return {
    id: user.UserID,
    username: user.Username,
    roles,
  }
}

async function loadUserWithRoles(userId) {
  if (!userId) return null

  return User.findByPk(userId, {
    include: [
      {
        model: Role,
        through: { attributes: [] },
        attributes: ['RoleID', 'Name'],
      },
    ],
  })
}

function signToken(payload, expiresIn) {
  return jwt.sign(payload, jwtConfig.secret, { expiresIn })
}

function createAccessToken(user, options = {}) {
  const sessionVersion = Number(options.sessionVersion || user?.SessionVersion || 1)

  return signToken({
    ...buildUserClaims(user),
    typ: 'access',
    sid: options.sessionId || '',
    ver: sessionVersion,
  }, jwtConfig.accessExpiresIn)
}

function createRefreshToken(user, options = {}) {
  const sessionVersion = Number(options.sessionVersion || user?.SessionVersion || 1)
  const expiresIn = options.rememberMe ? jwtConfig.refreshRememberExpiresIn : jwtConfig.refreshExpiresIn

  return signToken({
    id: user.UserID,
    typ: 'refresh',
    sid: options.sessionId || '',
    ver: sessionVersion,
  }, expiresIn)
}

function getTokenExpiryDate(token) {
  const decoded = jwt.decode(token)
  if (!decoded || !decoded.exp) return null
  return new Date(decoded.exp * 1000)
}

function createSessionId() {
  return crypto.randomUUID()
}

async function issueAuthSession(user, req, options = {}) {
  const sessionId = createSessionId()
  const sessionVersion = Number(user?.SessionVersion || 1)
  const rememberMe = Boolean(options.rememberMe)
  const accessToken = createAccessToken(user, { sessionId, sessionVersion })
  const refreshToken = createRefreshToken(user, { sessionId, sessionVersion, rememberMe })
  const now = new Date()

  const session = await AuthSession.create({
    SessionID: sessionId,
    UserID: user.UserID,
    RefreshTokenHash: hashToken(refreshToken),
    LoginMethod: String(options.loginMethod || 'username').trim() || 'username',
    DeviceName: String(options.deviceName || '').trim() || null,
    ClientType: String(options.clientType || 'web').trim() || 'web',
    UserAgent: String(req?.headers?.['user-agent'] || '').trim() || null,
    IPAddress: getRequestIp(req) || null,
    RememberMe: rememberMe,
    Status: 'active',
    LoginAt: now,
    LastSeenAt: now,
    ExpiresAt: getTokenExpiryDate(refreshToken),
  })

  return {
    accessToken,
    refreshToken,
    session,
  }
}

async function rotateAuthSession(user, session, req, options = {}) {
  const rememberMe = options.rememberMe === undefined ? Boolean(session.RememberMe) : Boolean(options.rememberMe)
  const sessionVersion = Number(user?.SessionVersion || 1)
  const accessToken = createAccessToken(user, { sessionId: session.SessionID, sessionVersion })
  const refreshToken = createRefreshToken(user, { sessionId: session.SessionID, sessionVersion, rememberMe })
  const now = new Date()

  session.RefreshTokenHash = hashToken(refreshToken)
  session.RememberMe = rememberMe
  session.Status = 'active'
  session.LastSeenAt = now
  session.ExpiresAt = getTokenExpiryDate(refreshToken)
  session.RevokedAt = null
  session.RevokedReason = null
  session.UserAgent = String(req?.headers?.['user-agent'] || '').trim() || session.UserAgent || null
  session.IPAddress = getRequestIp(req) || session.IPAddress || null
  await session.save()

  return {
    accessToken,
    refreshToken,
    session,
  }
}

function shouldUseSecureCookie(req) {
  const explicitSecure = process.env.JWT_COOKIE_SECURE
  if (explicitSecure !== undefined && explicitSecure !== '') {
    return parseBoolean(explicitSecure, false)
  }

  const forwardedProto = String(req?.headers?.['x-forwarded-proto'] || '').toLowerCase()
  if (req?.secure || forwardedProto === 'https') {
    return true
  }

  return process.env.NODE_ENV === 'production' && /^https:/i.test(process.env.PUBLIC_SITE_URL || '')
}

function getCookieOptions(req, token) {
  const expiresAt = token ? getTokenExpiryDate(token) : null
  const sameSite = normalizeSameSite(process.env.JWT_COOKIE_SAME_SITE || 'lax')
  const secure = sameSite === 'none' ? true : shouldUseSecureCookie(req)
  const cookieDomain = String(process.env.JWT_COOKIE_DOMAIN || '').trim()
  const maxAge = expiresAt ? Math.max(expiresAt.getTime() - Date.now(), 0) : undefined

  const options = {
    httpOnly: true,
    sameSite,
    secure,
    path: '/',
  }

  if (cookieDomain) {
    options.domain = cookieDomain
  }

  if (expiresAt) {
    options.expires = expiresAt
  }

  if (maxAge !== undefined) {
    options.maxAge = maxAge
  }

  return options
}

function setAuthCookies(res, req, tokens = {}) {
  if (tokens.accessToken) {
    res.cookie(ACCESS_COOKIE_NAME, tokens.accessToken, getCookieOptions(req, tokens.accessToken))
  }

  if (tokens.refreshToken) {
    res.cookie(REFRESH_COOKIE_NAME, tokens.refreshToken, getCookieOptions(req, tokens.refreshToken))
  }
}

function setAuthCookie(res, req, token) {
  if (!token) return
  res.cookie(ACCESS_COOKIE_NAME, token, getCookieOptions(req, token))
}

function clearCookie(res, req, cookieName) {
  const options = getCookieOptions(req)
  delete options.expires
  delete options.maxAge
  res.clearCookie(cookieName, options)
}

function clearAuthCookies(res, req) {
  clearCookie(res, req, ACCESS_COOKIE_NAME)
  clearCookie(res, req, REFRESH_COOKIE_NAME)
}

function clearAuthCookie(res, req) {
  clearAuthCookies(res, req)
}

async function assertTokenNotBlacklisted(token) {
  if (!token) return

  const blacklistedToken = await TokenBlacklist.findOne({
    where: { TokenHash: hashToken(token) },
  })

  if (blacklistedToken) {
    throw createBusinessError(401, errorCode.AUTH_ERROR.code, '登录状态已失效，请重新登录')
  }
}

async function touchSessionActivity(user, session) {
  if (!user || !session) return

  const lastSeenAt = session.LastSeenAt ? new Date(session.LastSeenAt).getTime() : 0
  const touchIntervalMs = Math.max(Number(jwtConfig.sessionTouchIntervalSeconds || 60), 5) * 1000
  if (Date.now() - lastSeenAt < touchIntervalMs) {
    return
  }

  const now = new Date()
  session.LastSeenAt = now
  user.LastSeenAt = now

  await Promise.all([
    session.save(),
    user.save(),
  ])
}

async function resolveVerifiedUser(decoded, token, expectedType) {
  if (!decoded || decoded.typ !== expectedType) {
    throw createBusinessError(401, errorCode.AUTH_ERROR.code, '登录状态已失效，请重新登录')
  }

  await assertTokenNotBlacklisted(token)

  const user = await loadUserWithRoles(decoded.id)
  if (!user) {
    throw createBusinessError(401, errorCode.AUTH_ERROR.code, '用户不存在或登录状态已失效')
  }

  if (!user.IsActive) {
    throw createBusinessError(403, errorCode.PERMISSION_DENIED.code, '账号已被禁用，请联系管理员')
  }

  const sessionVersion = Number(user.SessionVersion || 1)
  if (Number(decoded.ver || 0) !== sessionVersion) {
    throw createBusinessError(401, errorCode.AUTH_ERROR.code, '登录状态已失效，请重新登录')
  }

  const sessionId = String(decoded.sid || '').trim()
  if (!sessionId) {
    throw createBusinessError(401, errorCode.AUTH_ERROR.code, '登录状态已失效，请重新登录')
  }

  const session = await AuthSession.findByPk(sessionId)
  if (!session || session.UserID !== user.UserID || session.Status !== 'active') {
    throw createBusinessError(401, errorCode.AUTH_ERROR.code, '登录状态已失效，请重新登录')
  }

  if (session.ExpiresAt && new Date(session.ExpiresAt).getTime() <= Date.now()) {
    throw createBusinessError(401, errorCode.AUTH_ERROR.code, '登录状态已失效，请重新登录')
  }

  if (expectedType === 'refresh' && session.RefreshTokenHash !== hashToken(token)) {
    throw createBusinessError(401, errorCode.AUTH_ERROR.code, '登录状态已失效，请重新登录')
  }

  await touchSessionActivity(user, session)

  return {
    claims: {
      ...buildUserClaims(user),
      sessionId: session.SessionID,
      sessionVersion,
    },
    user,
    session,
  }
}

async function verifyAccessToken(token) {
  try {
    const decoded = jwt.verify(token, jwtConfig.secret)
    return await resolveVerifiedUser(decoded, token, 'access')
  } catch (err) {
    if (err?.status) {
      throw err
    }

    throw createBusinessError(401, errorCode.AUTH_ERROR.code, '登录状态已失效，请重新登录')
  }
}

async function verifyRefreshToken(token) {
  try {
    const decoded = jwt.verify(token, jwtConfig.secret)
    return await resolveVerifiedUser(decoded, token, 'refresh')
  } catch (err) {
    if (err?.status) {
      throw err
    }

    throw createBusinessError(401, errorCode.AUTH_ERROR.code, '登录状态已失效，请重新登录')
  }
}

async function refreshAuthSession(req, res, options = {}) {
  const refreshToken = extractRefreshToken(req)
  if (!refreshToken) {
    throw createBusinessError(401, errorCode.AUTH_ERROR.code, '登录状态已失效，请重新登录')
  }

  const { user, session } = await verifyRefreshToken(refreshToken)
  const tokens = await rotateAuthSession(user, session, req, {
    rememberMe: options.rememberMe,
  })

  setAuthCookies(res, req, tokens)

  return {
    ...tokens,
    user,
  }
}

async function revokeSession(sessionId, reason = 'revoked') {
  if (!sessionId) return 0

  const [affectedCount] = await AuthSession.update({
    Status: 'revoked',
    RevokedAt: new Date(),
    RevokedReason: reason,
  }, {
    where: {
      SessionID: sessionId,
      Status: 'active',
    },
  })

  return affectedCount
}

async function revokeUserSessions(userId, reason = 'revoked', options = {}) {
  if (!userId) return 0

  const where = {
    UserID: userId,
    Status: 'active',
  }

  if (options.excludeSessionId) {
    where.SessionID = { [Op.ne]: options.excludeSessionId }
  }

  const [affectedCount] = await AuthSession.update({
    Status: 'revoked',
    RevokedAt: new Date(),
    RevokedReason: reason,
  }, { where })

  return affectedCount
}

async function bumpUserSessionVersion(userId) {
  const user = await User.findByPk(userId)
  if (!user) return null

  user.SessionVersion = Number(user.SessionVersion || 1) + 1
  await user.save()
  return user.SessionVersion
}

function getOnlineThresholdDate() {
  const onlineWindowMinutes = Math.max(Number(jwtConfig.onlineWindowMinutes || 5), 1)
  return new Date(Date.now() - onlineWindowMinutes * 60 * 1000)
}

function isOnlineTime(lastSeenAt) {
  return !!lastSeenAt && new Date(lastSeenAt).getTime() >= getOnlineThresholdDate().getTime()
}

module.exports = {
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  extractBearerToken,
  extractAccessToken,
  extractRefreshToken,
  hashToken,
  buildUserClaims,
  loadUserWithRoles,
  createAccessToken,
  createRefreshToken,
  getTokenExpiryDate,
  issueAuthSession,
  rotateAuthSession,
  verifyAccessToken,
  verifyRefreshToken,
  refreshAuthSession,
  revokeSession,
  revokeUserSessions,
  bumpUserSessionVersion,
  setAuthCookies,
  setAuthCookie,
  clearAuthCookies,
  clearAuthCookie,
  getOnlineThresholdDate,
  isOnlineTime,
}
