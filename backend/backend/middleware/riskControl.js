const crypto = require('crypto')
const redisClient = require('../config/redis')

const INCREMENT_WITH_TTL_LUA = `
local current = redis.call('INCR', KEYS[1])
if current == 1 then
  redis.call('EXPIRE', KEYS[1], tonumber(ARGV[1]))
end
local ttl = redis.call('TTL', KEYS[1])
return { current, ttl }
`

function envInt(name, fallback) {
  const value = Number(process.env[name])
  return Number.isInteger(value) && value > 0 ? value : fallback
}

function envBool(name, fallback = false) {
  const rawValue = process.env[name]
  if (rawValue === undefined || rawValue === null || rawValue === '') {
    return fallback
  }

  const normalized = String(rawValue).trim().toLowerCase()
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false
  return fallback
}

function normalizeValue(value) {
  return String(value || '').trim()
}

function normalizeEmail(value) {
  const email = normalizeValue(value).toLowerCase()
  return email.includes('@') ? email : ''
}

function resolveAccount(req) {
  return normalizeValue(
    req?.body?.account ||
    req?.body?.email ||
    req?.body?.phoneNumber ||
    req?.body?.username
  ).toLowerCase()
}

function resolveClientIp(req) {
  const forwardedFor = String(req?.headers?.['x-forwarded-for'] || '').split(',')[0].trim()
  const realIp = String(req?.headers?.['x-real-ip'] || '').trim()
  return forwardedFor || realIp || req?.ip || req?.socket?.remoteAddress || ''
}

function resolveUserId(req) {
  const value = Number(req?.user?.id)
  return Number.isInteger(value) && value > 0 ? String(value) : ''
}

function hashIdentifier(value) {
  return crypto.createHash('sha1').update(String(value)).digest('hex')
}

function buildUtcDayBucket() {
  const now = new Date()
  const year = now.getUTCFullYear()
  const month = String(now.getUTCMonth() + 1).padStart(2, '0')
  const day = String(now.getUTCDate()).padStart(2, '0')
  return `${year}${month}${day}`
}

function buildCounterKey(rule, req) {
  const identifier = rule.identifier(req)
  if (identifier === undefined || identifier === null || String(identifier).trim() === '') {
    return ''
  }

  const bucket = typeof rule.bucket === 'function' ? rule.bucket(req) : rule.bucket
  const suffix = rule.hashIdentifier === false ? String(identifier) : hashIdentifier(identifier)
  return bucket ? `${rule.prefix}:${bucket}:${suffix}` : `${rule.prefix}:${suffix}`
}

async function incrementCounter(client, key, windowSec) {
  const result = await client.eval(INCREMENT_WITH_TTL_LUA, 1, key, String(windowSec))
  const current = Number(Array.isArray(result) ? result[0] : 0)
  const ttl = Number(Array.isArray(result) ? result[1] : windowSec)

  return {
    current: Number.isFinite(current) ? current : 0,
    ttl: Number.isFinite(ttl) && ttl > 0 ? ttl : windowSec,
  }
}

function createRedisRiskGuard({ message, rules = [] }) {
  return async function redisRiskGuard(req, res, next) {
    if (!envBool('RISK_GUARD_ENABLED', true)) {
      return next()
    }

    if (!redisClient.isClientConnected()) {
      return next()
    }

    const client = redisClient.getClient()
    if (!client) {
      return next()
    }

    try {
      for (const rule of rules) {
        const key = buildCounterKey(rule, req)
        if (!key) continue

        const { current, ttl } = await incrementCounter(client, key, rule.windowSec)
        if (current > rule.limit) {
          res.setHeader('Retry-After', String(ttl))
          return res.status(rule.statusCode || 429).json({
            code: 1,
            message: rule.message || message || '请求过于频繁，请稍后再试',
            data: {
              limit: rule.limit,
              retryAfter: ttl,
            },
          })
        }
      }

      return next()
    } catch (error) {
      console.error('Redis risk guard failed:', error.message)
      return next()
    }
  }
}

const registerCodeGuard = createRedisRiskGuard({
  message: '注册验证码请求过于频繁，请稍后再试',
  rules: [
    {
      prefix: 'risk:register_code:ip',
      limit: envInt('RISK_REGISTER_CODE_IP_LIMIT', 3),
      windowSec: envInt('RISK_REGISTER_CODE_IP_WINDOW_SECONDS', 10 * 60),
      identifier: resolveClientIp,
    },
    {
      prefix: 'risk:register_code:email:minute',
      limit: envInt('RISK_REGISTER_CODE_EMAIL_LIMIT', 1),
      windowSec: envInt('RISK_REGISTER_CODE_EMAIL_WINDOW_SECONDS', 60),
      identifier: req => normalizeEmail(req?.body?.email),
    },
    {
      prefix: 'risk:register_code:email:day',
      limit: envInt('RISK_REGISTER_CODE_EMAIL_DAILY_LIMIT', 5),
      windowSec: envInt('RISK_REGISTER_CODE_EMAIL_DAILY_WINDOW_SECONDS', 24 * 60 * 60),
      bucket: buildUtcDayBucket,
      identifier: req => normalizeEmail(req?.body?.email),
    },
  ],
})

const registerGuard = createRedisRiskGuard({
  message: '注册操作过于频繁，请稍后再试',
  rules: [
    {
      prefix: 'risk:register:ip',
      limit: envInt('RISK_REGISTER_SUBMIT_IP_LIMIT', 3),
      windowSec: envInt('RISK_REGISTER_SUBMIT_IP_WINDOW_SECONDS', 60 * 60),
      identifier: resolveClientIp,
    },
    {
      prefix: 'risk:register:email:day',
      limit: envInt('RISK_REGISTER_SUBMIT_EMAIL_DAILY_LIMIT', 3),
      windowSec: envInt('RISK_REGISTER_SUBMIT_EMAIL_DAILY_WINDOW_SECONDS', 24 * 60 * 60),
      bucket: buildUtcDayBucket,
      identifier: req => normalizeEmail(req?.body?.email),
    },
  ],
})

const loginCodeGuard = createRedisRiskGuard({
  message: '登录验证码请求过于频繁，请稍后再试',
  rules: [
    {
      prefix: 'risk:login_code:ip',
      limit: envInt('RISK_LOGIN_CODE_IP_LIMIT', 10),
      windowSec: envInt('RISK_LOGIN_CODE_IP_WINDOW_SECONDS', 15 * 60),
      identifier: resolveClientIp,
    },
    {
      prefix: 'risk:login_code:account_ip',
      limit: envInt('RISK_LOGIN_CODE_ACCOUNT_LIMIT', 5),
      windowSec: envInt('RISK_LOGIN_CODE_ACCOUNT_WINDOW_SECONDS', 15 * 60),
      identifier: req => {
        const account = resolveAccount(req)
        const ip = resolveClientIp(req)
        return account && ip ? `${account}:${ip}` : ''
      },
    },
  ],
})

const loginGuard = createRedisRiskGuard({
  message: '登录尝试过于频繁，请稍后再试',
  rules: [
    {
      prefix: 'risk:login:ip',
      limit: envInt('RISK_LOGIN_SUBMIT_IP_LIMIT', 20),
      windowSec: envInt('RISK_LOGIN_SUBMIT_IP_WINDOW_SECONDS', 15 * 60),
      identifier: resolveClientIp,
    },
    {
      prefix: 'risk:login:account_ip',
      limit: envInt('RISK_LOGIN_SUBMIT_ACCOUNT_LIMIT', 10),
      windowSec: envInt('RISK_LOGIN_SUBMIT_ACCOUNT_WINDOW_SECONDS', 15 * 60),
      identifier: req => {
        const account = resolveAccount(req)
        const ip = resolveClientIp(req)
        return account && ip ? `${account}:${ip}` : ''
      },
    },
  ],
})

const forgotPasswordCodeGuard = createRedisRiskGuard({
  message: '找回密码验证码请求过于频繁，请稍后再试',
  rules: [
    {
      prefix: 'risk:forgot_code:ip',
      limit: envInt('RISK_FORGOT_CODE_IP_LIMIT', 5),
      windowSec: envInt('RISK_FORGOT_CODE_IP_WINDOW_SECONDS', 60 * 60),
      identifier: resolveClientIp,
    },
    {
      prefix: 'risk:forgot_code:email:minute',
      limit: envInt('RISK_FORGOT_CODE_EMAIL_LIMIT', 1),
      windowSec: envInt('RISK_FORGOT_CODE_EMAIL_WINDOW_SECONDS', 60),
      identifier: req => normalizeEmail(req?.body?.email),
    },
    {
      prefix: 'risk:forgot_code:email:day',
      limit: envInt('RISK_FORGOT_CODE_EMAIL_DAILY_LIMIT', 3),
      windowSec: envInt('RISK_FORGOT_CODE_EMAIL_DAILY_WINDOW_SECONDS', 24 * 60 * 60),
      bucket: buildUtcDayBucket,
      identifier: req => normalizeEmail(req?.body?.email),
    },
  ],
})

const forgotPasswordGuard = createRedisRiskGuard({
  message: '找回密码操作过于频繁，请稍后再试',
  rules: [
    {
      prefix: 'risk:forgot_password:ip',
      limit: envInt('RISK_FORGOT_SUBMIT_IP_LIMIT', 10),
      windowSec: envInt('RISK_FORGOT_SUBMIT_IP_WINDOW_SECONDS', 60 * 60),
      identifier: resolveClientIp,
    },
    {
      prefix: 'risk:forgot_password:email',
      limit: envInt('RISK_FORGOT_SUBMIT_EMAIL_LIMIT', 6),
      windowSec: envInt('RISK_FORGOT_SUBMIT_EMAIL_WINDOW_SECONDS', 60 * 60),
      identifier: req => normalizeEmail(req?.body?.email),
    },
  ],
})

const changePasswordCodeGuard = createRedisRiskGuard({
  message: '修改密码验证码请求过于频繁，请稍后再试',
  rules: [
    {
      prefix: 'risk:change_password_code:user',
      limit: envInt('RISK_CHANGE_PASSWORD_CODE_USER_LIMIT', 5),
      windowSec: envInt('RISK_CHANGE_PASSWORD_CODE_USER_WINDOW_SECONDS', 60 * 60),
      identifier: resolveUserId,
      hashIdentifier: false,
    },
  ],
})

const commentCreateGuard = createRedisRiskGuard({
  message: '评论发送过于频繁，请稍后再试',
  rules: [
    {
      prefix: 'risk:comment:ip',
      limit: envInt('RISK_COMMENT_CREATE_IP_LIMIT', 20),
      windowSec: envInt('RISK_COMMENT_CREATE_IP_WINDOW_SECONDS', 10 * 60),
      identifier: resolveClientIp,
    },
    {
      prefix: 'risk:comment:user',
      limit: envInt('RISK_COMMENT_CREATE_USER_LIMIT', 10),
      windowSec: envInt('RISK_COMMENT_CREATE_USER_WINDOW_SECONDS', 10 * 60),
      identifier: resolveUserId,
      hashIdentifier: false,
    },
  ],
})

const attachmentUploadGuard = createRedisRiskGuard({
  message: '附件上传过于频繁，请稍后再试',
  rules: [
    {
      prefix: 'risk:attachment_upload:ip',
      limit: envInt('RISK_ATTACHMENT_UPLOAD_IP_LIMIT', 30),
      windowSec: envInt('RISK_ATTACHMENT_UPLOAD_IP_WINDOW_SECONDS', 60 * 60),
      identifier: resolveClientIp,
    },
    {
      prefix: 'risk:attachment_upload:user',
      limit: envInt('RISK_ATTACHMENT_UPLOAD_USER_LIMIT', 20),
      windowSec: envInt('RISK_ATTACHMENT_UPLOAD_USER_WINDOW_SECONDS', 60 * 60),
      identifier: resolveUserId,
      hashIdentifier: false,
    },
  ],
})

const articleImportGuard = createRedisRiskGuard({
  message: '文档导入过于频繁，请稍后再试',
  rules: [
    {
      prefix: 'risk:article_import:ip',
      limit: envInt('RISK_ARTICLE_IMPORT_IP_LIMIT', 15),
      windowSec: envInt('RISK_ARTICLE_IMPORT_IP_WINDOW_SECONDS', 60 * 60),
      identifier: resolveClientIp,
    },
    {
      prefix: 'risk:article_import:user',
      limit: envInt('RISK_ARTICLE_IMPORT_USER_LIMIT', 10),
      windowSec: envInt('RISK_ARTICLE_IMPORT_USER_WINDOW_SECONDS', 60 * 60),
      identifier: resolveUserId,
      hashIdentifier: false,
    },
  ],
})

module.exports = {
  resolveClientIp,
  registerCodeGuard,
  registerGuard,
  loginCodeGuard,
  loginGuard,
  forgotPasswordCodeGuard,
  forgotPasswordGuard,
  changePasswordCodeGuard,
  commentCreateGuard,
  attachmentUploadGuard,
  articleImportGuard,
}
