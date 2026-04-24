const { SiteSetting, Attachment } = require('../models')
const errorCode = require('../middleware/errorCode')

function trimTo(value, maxLength) {
  return String(value ?? '').trim().slice(0, maxLength)
}

function getDefaultSettings() {
  return {
    SiteName: trimTo(process.env.PUBLIC_SITE_NAME || 'TechBlogDB', 120),
    Description: trimTo(process.env.PUBLIC_SITE_DESCRIPTION || '一个技术博客系统', 500),
    LogoURL: trimTo(process.env.PUBLIC_LOGO_URL || '', 500),
    FaviconURL: trimTo(process.env.PUBLIC_FAVICON_URL || '', 500),
    Analytics: '',
    SocialLinks: [],
  }
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
  const defaults = getDefaultSettings()

  return {
    SiteSettingID: setting?.SiteSettingID ?? null,
    SiteName: setting?.SiteName ?? defaults.SiteName,
    Description: setting?.Description ?? defaults.Description,
    LogoURL: setting?.LogoURL ?? defaults.LogoURL,
    FaviconURL: setting?.FaviconURL ?? defaults.FaviconURL,
    Analytics: setting?.Analytics ?? defaults.Analytics,
    SocialLinks: normalizeSocialLinks(setting?.SocialLinks ?? defaults.SocialLinks),
    UpdatedAt: setting?.UpdatedAt ?? null,
    UpdatedBy: setting?.UpdatedBy ?? null,
  }
}

function sanitizePayload(body = {}) {
  const defaults = getDefaultSettings()

  return {
    siteName: trimTo(body.siteName ?? body.SiteName ?? defaults.SiteName, 120),
    description: trimTo(body.description ?? body.Description ?? defaults.Description, 500),
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

function parseAttachmentIdFromUrl(value) {
  const input = String(value || '').trim()
  if (!input) return null

  const match = input.match(/\/api\/attachments\/(\d+)\/(?:preview|download)(?:\?.*)?$/i)
  if (!match) return null

  const attachmentId = Number(match[1])
  return Number.isInteger(attachmentId) && attachmentId > 0 ? attachmentId : null
}

async function markSettingAssetsPublic(urls = []) {
  const attachmentIds = Array.from(new Set(urls.map(parseAttachmentIdFromUrl).filter(Boolean)))
  if (!attachmentIds.length) return

  await Attachment.update(
    {
      IsTemporary: false,
      TempKey: 'site-branding',
    },
    {
      where: {
        AttachmentID: attachmentIds,
        IsDeleted: false,
      },
    },
  )
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

exports.getPublicSettings = async (_req, res, next) => {
  try {
    const setting = await SiteSetting.findOne({
      order: [['SiteSettingID', 'ASC']],
    })

    res.success(toPublicPayload(setting), '获取公开站点设置成功')
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

    await markSettingAssetsPublic([payload.logoURL, payload.faviconURL])

    res.success(toPublicPayload(setting), '保存系统设置成功')
  } catch (error) {
    next(error)
  }
}
