const { SiteSetting } = require('../models')
const errorCode = require('../middleware/errorCode')

const DEFAULT_SETTINGS = Object.freeze({
  SiteName: 'TechBlogDB',
  Description: '一个技术博客系统',
  LogoURL: '',
  FaviconURL: '',
  Analytics: '',
  SocialLinks: [],
})

function trimTo(value, maxLength) {
  return String(value ?? '').trim().slice(0, maxLength)
}

function normalizeSocialLinks(value) {
  let parsed = value

  if (typeof parsed === 'string') {
    try {
      parsed = JSON.parse(parsed)
    } catch (_error) {
      parsed = []
    }
  }

  if (!Array.isArray(parsed)) {
    return []
  }

  return parsed
    .map((item) => ({
      name: trimTo(item?.name ?? item?.Name ?? '', 80),
      url: trimTo(item?.url ?? item?.URL ?? item?.Url ?? '', 500),
    }))
    .filter((item) => item.name || item.url)
}

function serializeSocialLinks(value) {
  return JSON.stringify(normalizeSocialLinks(value))
}

function toPublicPayload(setting) {
  return {
    SiteSettingID: setting?.SiteSettingID ?? null,
    SiteName: setting?.SiteName ?? DEFAULT_SETTINGS.SiteName,
    Description: setting?.Description ?? DEFAULT_SETTINGS.Description,
    LogoURL: setting?.LogoURL ?? DEFAULT_SETTINGS.LogoURL,
    FaviconURL: setting?.FaviconURL ?? DEFAULT_SETTINGS.FaviconURL,
    Analytics: setting?.Analytics ?? DEFAULT_SETTINGS.Analytics,
    SocialLinks: normalizeSocialLinks(setting?.SocialLinks ?? DEFAULT_SETTINGS.SocialLinks),
    UpdatedAt: setting?.UpdatedAt ?? null,
    UpdatedBy: setting?.UpdatedBy ?? null,
  }
}

function sanitizePayload(body = {}) {
  return {
    siteName: trimTo(body.siteName ?? body.SiteName ?? DEFAULT_SETTINGS.SiteName, 120),
    description: trimTo(body.description ?? body.Description ?? DEFAULT_SETTINGS.Description, 500),
    logoURL: trimTo(body.logoURL ?? body.LogoURL ?? '', 500),
    faviconURL: trimTo(body.faviconURL ?? body.FaviconURL ?? '', 500),
    analytics: String(body.analytics ?? body.Analytics ?? '').trim(),
    socialLinks: normalizeSocialLinks(body.socialLinks ?? body.SocialLinks),
  }
}

function validatePayload(payload) {
  if (!payload.siteName) {
    const error = new Error('站点名称不能为空')
    error.status = 400
    error.code = errorCode.VALIDATION_ERROR.code
    throw error
  }
}

exports.getSettings = async (_req, res, next) => {
  try {
    const setting = await SiteSetting.findOne({
      order: [['SiteSettingID', 'ASC']],
    })

    res.success(toPublicPayload(setting), '获取系统设置成功')
  } catch (error) {
    next(error)
  }
}

exports.updateSettings = async (req, res, next) => {
  try {
    const payload = sanitizePayload(req.body)
    validatePayload(payload)

    const values = {
      SiteName: payload.siteName,
      Description: payload.description,
      LogoURL: payload.logoURL,
      FaviconURL: payload.faviconURL,
      Analytics: payload.analytics,
      SocialLinks: serializeSocialLinks(payload.socialLinks),
      UpdatedBy: req.user?.id || null,
      UpdatedAt: new Date(),
    }

    let setting = await SiteSetting.findOne({
      order: [['SiteSettingID', 'ASC']],
    })

    if (setting) {
      await setting.update(values)
    } else {
      setting = await SiteSetting.create({
        ...values,
        CreatedAt: new Date(),
      })
    }

    res.success(toPublicPayload(setting), '保存系统设置成功')
  } catch (error) {
    next(error)
  }
}
