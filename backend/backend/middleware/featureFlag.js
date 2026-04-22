function envFlagEnabled(name, fallback = false) {
  const rawValue = process.env[name]
  if (rawValue === undefined || rawValue === null || rawValue === '') {
    return fallback
  }

  const normalized = String(rawValue).trim().toLowerCase()
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false

  return fallback
}

function requireFeatureEnabled(name, message, fallback = process.env.NODE_ENV !== 'production') {
  return function featureFlagGuard(_req, res, next) {
    if (envFlagEnabled(name, fallback)) {
      return next()
    }

    return res.status(503).json({
      code: 1,
      message,
    })
  }
}

module.exports = {
  envFlagEnabled,
  requireFeatureEnabled,
}
