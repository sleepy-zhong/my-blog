const bcrypt = require('bcryptjs')
const { Op } = require('sequelize')
const { validationResult } = require('express-validator')
const sequelize = require('../config/db')
const errorCode = require('../middleware/errorCode')
const { User, Role, VerificationCode, TokenBlacklist } = require('../models')
const { sendMail } = require('../utils/mailer')
const { logOperation, getClientIP, getUserAgent } = require('../utils/logger')
const {
  issueAuthSession,
  refreshAuthSession,
  revokeSession,
  revokeUserSessions,
  bumpUserSessionVersion,
  extractAccessToken,
  hashToken,
  getTokenExpiryDate,
  setAuthCookies,
  clearAuthCookies,
} = require('../utils/authSession')

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase()
}

function normalizeString(value) {
  return String(value || '').trim()
}

function createVerificationCodeValue() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

function isValidEmail(email) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(email || ''))
}

function isLikelyPhoneNumber(value) {
  return /^\d{6,20}$/.test(String(value || ''))
}

function getPasswordRounds() {
  const rounds = Number(process.env.BCRYPT_ROUNDS || 10)
  return Number.isInteger(rounds) && rounds >= 8 ? rounds : 10
}

function createControllerError(status, message, data = null, code = 1) {
  return {
    status,
    code,
    message,
    data,
  }
}

function ensureValidRequest(req, next) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    next(createControllerError(400, '????', errors.array(), errorCode.VALIDATION_ERROR.code))
    return false
  }

  return true
}

function sendCreated(res, data, message) {
  return res.status(201).json({
    code: 0,
    message,
    data,
  })
}

async function logUserAction(req, payload) {
  try {
    await logOperation({
      ipAddress: getClientIP(req),
      userAgent: getUserAgent(req),
      ...payload,
    })
  } catch (_err) {
    // 日志失败不阻断主流程
  }
}

async function getDefaultRoleId(transaction) {
  const defaultRole = await Role.findOne({
    where: { Name: 'user' },
    attributes: ['RoleID'],
    transaction,
  })

  return defaultRole?.RoleID || 4
}

function buildSceneMail(scene, code) {
  const configs = {
    register: {
      subject: '注册验证码',
      title: '你的注册验证码为：',
      description: '验证码 10 分钟内有效，完成验证后即可注册账号。',
    },
    login: {
      subject: '登录验证码',
      title: '你的登录验证码为：',
      description: '验证码 10 分钟内有效，请确认本次登录操作由你本人发起。',
    },
    change_password: {
      subject: '修改密码验证码',
      title: '你的修改密码验证码为：',
      description: '验证码 10 分钟内有效，验证通过后将立即更新密码并使当前登录态失效。',
    },
    forgot_password: {
      subject: '找回密码验证码',
      title: '你的找回密码验证码为：',
      description: '验证码 10 分钟内有效，请勿泄露给他人。',
    },
  }

  const config = configs[scene]
  if (!config) {
    throw new Error(`不支持的验证码场景：${scene}`)
  }

  return {
    subject: config.subject,
    html: `<div style="font-family:Arial,sans-serif;line-height:1.7;">
      <p>${config.title}</p>
      <p style="font-size:24px;font-weight:700;letter-spacing:4px;">${code}</p>
      <p>${config.description}</p>
    </div>`,
  }
}

async function canSendNewCode(email, scene) {
  const latestCode = await VerificationCode.findOne({
    where: { Email: email, Scene: scene },
    order: [['CreatedAt', 'DESC']],
  })

  if (!latestCode?.CreatedAt) {
    return true
  }

  return Date.now() - new Date(latestCode.CreatedAt).getTime() >= 60 * 1000
}

async function invalidateUnusedCodes(email, scene, transaction) {
  await VerificationCode.update(
    { Used: true },
    { where: { Email: email, Scene: scene, Used: false }, transaction }
  )
}

async function createAndSendVerificationCode({ email, scene, userId = null, transaction = null }) {
  const code = createVerificationCodeValue()
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

  const verification = await VerificationCode.create({
    Email: email,
    Code: code,
    Scene: scene,
    ExpiresAt: expiresAt,
    Used: false,
    UserID: userId,
  }, { transaction })

  try {
    const mail = buildSceneMail(scene, code)
    await sendMail(email, mail.subject, mail.html)
  } catch (mailError) {
    await verification.destroy()
    throw new Error(`验证码发送失败，请检查邮箱配置：${mailError.message}`)
  }

  return verification
}

async function findValidVerificationCode({ email, scene, code, transaction = null }) {
  return VerificationCode.findOne({
    where: {
      Email: email,
      Scene: scene,
      Code: normalizeString(code),
      Used: false,
      ExpiresAt: { [Op.gt]: new Date() },
    },
    order: [['CreatedAt', 'DESC']],
    transaction,
  })
}

function resolveAccountInput(body = {}) {
  const account = normalizeString(body.account)
  const email = normalizeEmail(body.email)
  const phoneNumber = normalizeString(body.phoneNumber)
  const username = normalizeString(body.username)

  if (account) {
    if (isValidEmail(account)) {
      return { where: { Email: normalizeEmail(account) }, loginMethod: 'email', account: normalizeEmail(account) }
    }

    if (isLikelyPhoneNumber(account)) {
      return { where: { PhoneNumber: account }, loginMethod: 'phone', account }
    }

    return { where: { Username: account }, loginMethod: 'username', account }
  }

  if (email) return { where: { Email: email }, loginMethod: 'email', account: email }
  if (phoneNumber) return { where: { PhoneNumber: phoneNumber }, loginMethod: 'phone', account: phoneNumber }
  if (username) return { where: { Username: username }, loginMethod: 'username', account: username }

  return null
}

async function findLoginUser(body = {}) {
  const accountInfo = resolveAccountInput(body)
  if (!accountInfo) {
    return null
  }

  const user = await User.findOne({
    where: accountInfo.where,
    include: [{ model: Role, through: { attributes: [] } }],
  })

  if (!user) {
    return null
  }

  return { user, accountInfo }
}

exports.sendRegisterCode = async (req, res, next) => {
  if (!ensureValidRequest(req, next)) return

  try {
    const email = normalizeEmail(req.body.email)
    if (!email) {
      return next(createControllerError(400, '??????'))
    }

    const existEmail = await User.findOne({ where: { Email: email }, attributes: ['UserID'] })
    if (existEmail) {
      return next(createControllerError(400, '??????'))
    }

    const allowSend = await canSendNewCode(email, 'register')
    if (!allowSend) {
      return next(createControllerError(429, '??????????? 1 ?????'))
    }

    await invalidateUnusedCodes(email, 'register')
    await createAndSendVerificationCode({ email, scene: 'register' })

    return res.success(null, '????????????')
  } catch (err) {
    return next(createControllerError(500, err.message || '?????', err.message, errorCode.SYSTEM_ERROR.code))
  }
}
exports.register = async (req, res, next) => {
  if (!ensureValidRequest(req, next)) return

  const transaction = await sequelize.transaction()

  try {
    const username = normalizeString(req.body.username)
    const email = normalizeEmail(req.body.email)
    const password = String(req.body.password || '')
    const phoneNumber = normalizeString(req.body.phoneNumber) || null
    const code = normalizeString(req.body.code)

    if (!code) {
      await transaction.rollback()
      return next(createControllerError(400, '???????'))
    }

    const verification = await findValidVerificationCode({
      email,
      scene: 'register',
      code,
      transaction,
    })

    if (!verification) {
      await transaction.rollback()
      return next(createControllerError(400, '?????????'))
    }

    const [existUsername, existEmail, existPhone] = await Promise.all([
      User.findOne({ where: { Username: username }, transaction }),
      User.findOne({ where: { Email: email }, transaction }),
      phoneNumber ? User.findOne({ where: { PhoneNumber: phoneNumber }, transaction }) : Promise.resolve(null),
    ])

    if (existUsername) {
      await transaction.rollback()
      return next(createControllerError(400, '??????'))
    }

    if (existEmail) {
      await transaction.rollback()
      return next(createControllerError(400, '??????'))
    }

    if (existPhone) {
      await transaction.rollback()
      return next(createControllerError(400, '??????'))
    }

    const passwordHash = await bcrypt.hash(password, getPasswordRounds())
    const user = await User.create({
      Username: username,
      Email: email,
      PasswordHash: passwordHash,
      PhoneNumber: phoneNumber,
      CreatedAt: new Date(),
      LastSeenAt: null,
      SessionVersion: 1,
    }, { transaction })

    const defaultRoleId = await getDefaultRoleId(transaction)
    await user.setRoles([defaultRoleId], { transaction })

    verification.Used = true
    verification.UserID = user.UserID
    await verification.save({ transaction })

    await transaction.commit()

    await logUserAction(req, {
      userId: user.UserID,
      operationType: 'register',
      targetType: 'user',
      targetId: user.UserID,
      details: {
        username: user.Username,
        email: user.Email,
        phoneNumber: user.PhoneNumber,
      },
    })

    return sendCreated(res, {
      UserID: user.UserID,
      Username: user.Username,
      Email: user.Email,
    }, '????')
  } catch (err) {
    if (!transaction.finished) {
      await transaction.rollback()
    }

    return next(createControllerError(500, err.message || '?????', err.message, errorCode.SYSTEM_ERROR.code))
  }
}
exports.sendLoginCode = async (req, res, next) => {
  if (!ensureValidRequest(req, next)) return

  try {
    const password = String(req.body.password || '')
    const loginUser = await findLoginUser(req.body)

    if (!loginUser) {
      return next(createControllerError(400, '???????'))
    }

    const { user } = loginUser
    if (!user.IsActive) {
      return next(createControllerError(403, '?????????????'))
    }

    const isMatch = await bcrypt.compare(password, user.PasswordHash)
    if (!isMatch) {
      return next(createControllerError(400, '???????'))
    }

    const allowSend = await canSendNewCode(user.Email, 'login')
    if (!allowSend) {
      return next(createControllerError(429, '??????????? 1 ?????'))
    }

    await invalidateUnusedCodes(user.Email, 'login')
    await createAndSendVerificationCode({ email: user.Email, scene: 'login', userId: user.UserID })

    return res.success(null, '????????????????')
  } catch (err) {
    return next(createControllerError(500, err.message || '?????', err.message, errorCode.SYSTEM_ERROR.code))
  }
}
exports.login = async (req, res, next) => {
  if (!ensureValidRequest(req, next)) return

  const transaction = await sequelize.transaction()

  try {
    const password = String(req.body.password || '')
    const code = normalizeString(req.body.code)
    const rememberMe = Boolean(req.body.rememberMe)
    const loginUser = await findLoginUser(req.body)

    if (!loginUser) {
      await transaction.rollback()
      return next(createControllerError(400, '???????'))
    }

    const { user, accountInfo } = loginUser
    if (!user.IsActive) {
      await transaction.rollback()
      return next(createControllerError(403, '?????????????'))
    }

    const isMatch = await bcrypt.compare(password, user.PasswordHash)
    if (!isMatch) {
      await transaction.rollback()
      return next(createControllerError(400, '???????'))
    }

    const verification = await findValidVerificationCode({
      email: user.Email,
      scene: 'login',
      code,
      transaction,
    })

    if (!verification) {
      await transaction.rollback()
      return next(createControllerError(400, '?????????'))
    }

    verification.Used = true
    await verification.save({ transaction })

    user.LastLogin = new Date()
    user.LastSeenAt = new Date()
    await user.save({ transaction })

    await transaction.commit()

    const tokens = await issueAuthSession(user, req, {
      loginMethod: accountInfo.loginMethod,
      rememberMe,
      clientType: 'web',
    })

    setAuthCookies(res, req, tokens)

    await logUserAction(req, {
      userId: user.UserID,
      operationType: 'login',
      targetType: 'user',
      targetId: user.UserID,
      details: {
        username: user.Username,
        loginMethod: accountInfo.loginMethod,
        rememberMe,
      },
    })

    return res.success({
      authenticated: true,
      rememberMe,
    }, '????')
  } catch (err) {
    if (!transaction.finished) {
      await transaction.rollback()
    }

    return next(createControllerError(500, err.message || '?????', err.message, errorCode.SYSTEM_ERROR.code))
  }
}
exports.refresh = async (req, res, next) => {
  try {
    await refreshAuthSession(req, res)
    return res.success({ refreshed: true }, '??????')
  } catch (err) {
    clearAuthCookies(res, req)
    return next({
      status: err.status || 401,
      code: err.code || errorCode.AUTH_ERROR.code,
      message: err.message || '?????????????',
    })
  }
}
exports.sendForgotPasswordCode = async (req, res, next) => {
  if (!ensureValidRequest(req, next)) return

  try {
    const email = normalizeEmail(req.body.email)
    const user = await User.findOne({
      where: { Email: email },
      attributes: ['UserID', 'Email', 'IsActive'],
    })

    if (!user || !user.IsActive) {
      return res.success(null, '????????????????????')
    }

    const allowSend = await canSendNewCode(email, 'forgot_password')
    if (!allowSend) {
      return next(createControllerError(429, '??????????? 1 ?????'))
    }

    await invalidateUnusedCodes(email, 'forgot_password')
    await createAndSendVerificationCode({ email, scene: 'forgot_password', userId: user.UserID })

    return res.success(null, '????????????????????')
  } catch (err) {
    return next(createControllerError(500, err.message || '?????', err.message, errorCode.SYSTEM_ERROR.code))
  }
}
exports.forgotPassword = async (req, res, next) => {
  if (!ensureValidRequest(req, next)) return

  const transaction = await sequelize.transaction()

  try {
    const email = normalizeEmail(req.body.email)
    const code = normalizeString(req.body.code)
    const newPassword = String(req.body.newPassword || '')

    const verification = await findValidVerificationCode({
      email,
      scene: 'forgot_password',
      code,
      transaction,
    })

    if (!verification) {
      await transaction.rollback()
      return next(createControllerError(400, '?????????'))
    }

    const user = await User.findOne({ where: { Email: email }, transaction })
    if (!user) {
      await transaction.rollback()
      return next(createControllerError(404, '?????', null, errorCode.NOT_FOUND.code))
    }

    verification.Used = true
    await verification.save({ transaction })

    user.PasswordHash = await bcrypt.hash(newPassword, getPasswordRounds())
    user.SessionVersion = Number(user.SessionVersion || 1) + 1
    await user.save({ transaction })

    await transaction.commit()

    await revokeUserSessions(user.UserID, 'forgot_password_reset')
    clearAuthCookies(res, req)

    await logUserAction(req, {
      userId: user.UserID,
      operationType: 'reset_password',
      targetType: 'user',
      targetId: user.UserID,
      details: { email: user.Email, scene: 'forgot_password' },
    })

    return res.success({ requireReLogin: true }, '????????????')
  } catch (err) {
    if (!transaction.finished) {
      await transaction.rollback()
    }

    return next(createControllerError(500, err.message || '?????', err.message, errorCode.SYSTEM_ERROR.code))
  }
}
exports.sendChangePasswordCode = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['UserID', 'Email', 'IsActive'],
    })

    if (!user) {
      return next(createControllerError(404, '?????', null, errorCode.NOT_FOUND.code))
    }

    if (!user.IsActive) {
      return next(createControllerError(403, '?????????????'))
    }

    const allowSend = await canSendNewCode(user.Email, 'change_password')
    if (!allowSend) {
      return next(createControllerError(429, '??????????? 1 ?????'))
    }

    await invalidateUnusedCodes(user.Email, 'change_password')
    await createAndSendVerificationCode({ email: user.Email, scene: 'change_password', userId: user.UserID })

    return res.success(null, '??????????????????')
  } catch (err) {
    return next(createControllerError(500, err.message || '?????', err.message, errorCode.SYSTEM_ERROR.code))
  }
}
exports.changePassword = async (req, res, next) => {
  if (!ensureValidRequest(req, next)) return

  const transaction = await sequelize.transaction()

  try {
    const oldPassword = String(req.body.oldPassword || '')
    const newPassword = String(req.body.newPassword || '')
    const code = normalizeString(req.body.code)
    const user = await User.findByPk(req.user.id, { transaction })

    if (!user) {
      await transaction.rollback()
      return next(createControllerError(404, '?????', null, errorCode.NOT_FOUND.code))
    }

    const isMatch = await bcrypt.compare(oldPassword, user.PasswordHash)
    if (!isMatch) {
      await transaction.rollback()
      return next(createControllerError(400, '?????'))
    }

    const verification = await findValidVerificationCode({
      email: user.Email,
      scene: 'change_password',
      code,
      transaction,
    })

    if (!verification) {
      await transaction.rollback()
      return next(createControllerError(400, '?????????'))
    }

    verification.Used = true
    await verification.save({ transaction })

    user.PasswordHash = await bcrypt.hash(newPassword, getPasswordRounds())
    user.SessionVersion = Number(user.SessionVersion || 1) + 1
    await user.save({ transaction })

    await transaction.commit()

    await revokeUserSessions(user.UserID, 'change_password')
    clearAuthCookies(res, req)

    await logUserAction(req, {
      userId: user.UserID,
      operationType: 'change_password',
      targetType: 'user',
      targetId: user.UserID,
      details: { passwordChanged: true, requireReLogin: true },
    })

    return res.success({ requireReLogin: true }, '???????????')
  } catch (err) {
    if (!transaction.finished) {
      await transaction.rollback()
    }

    return next(createControllerError(500, err.message || '?????', err.message, errorCode.SYSTEM_ERROR.code))
  }
}
exports.logout = async (req, res, next) => {
  try {
    const token = req.authToken || extractAccessToken(req)
    clearAuthCookies(res, req)

    if (req.user?.sessionId) {
      await revokeSession(req.user.sessionId, 'logout')
    }

    if (token) {
      await TokenBlacklist.findOrCreate({
        where: { TokenHash: hashToken(token) },
        defaults: {
          UserID: req.user?.id || null,
          ExpiresAt: getTokenExpiryDate(token),
        },
      })
    }

    if (req.user?.id) {
      await logUserAction(req, {
        userId: req.user.id,
        operationType: 'logout',
        targetType: 'user',
        targetId: req.user.id,
        details: { username: req.user.username },
      })
    }

    return res.success(null, '??????')
  } catch (err) {
    return next(createControllerError(500, err.message || '?????', err.message, errorCode.SYSTEM_ERROR.code))
  }
}
