const rawSecret = (process.env.JWT_SECRET || '').trim()

if (!rawSecret) {
  throw new Error('缺少 JWT_SECRET 环境变量')
}

module.exports = {
  secret: rawSecret,
  accessExpiresIn: (process.env.JWT_ACCESS_EXPIRES_IN || '15m').trim(),
  refreshExpiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d').trim(),
  refreshRememberExpiresIn: (process.env.JWT_REFRESH_REMEMBER_EXPIRES_IN || '30d').trim(),
  onlineWindowMinutes: Number(process.env.ONLINE_ACTIVE_WINDOW_MINUTES || 5),
  sessionTouchIntervalSeconds: Number(process.env.SESSION_TOUCH_INTERVAL_SECONDS || 60),
}
