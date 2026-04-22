require('dotenv').config()
const express = require('express')
const path = require('path')
const cors = require('cors')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
// const csurf = require('csurf')
const errorHandler = require('./middleware/errorHandler')
const { sequelize, Attachment } = require('./models')
const redisClient = require('./config/redis')
const { redisMiddleware } = require('./middleware/redis')
const responseFormat = require('./middleware/responseFormat')
const auth = require('./middleware/auth')
const permission = require('./middleware/permission')

const userRoutes = require('./routes/user')
const roleRoutes = require('./routes/role')
const articleRoutes = require('./routes/article')
const commentRoutes = require('./routes/comment')
const categoryRoutes = require('./routes/category')
const tagRoutes = require('./routes/tag')
const attachmentRoutes = require('./routes/attachment')
const homeCatRoutes = require('./routes/homeCat')
const settingsRoutes = require('./routes/settings')
const logRoutes = require('./routes/log')
const notificationRoutes = require('./routes/notification')
const emailRoutes = require('./routes/notification')
const redisRoutes = require('./routes/redis')
const swaggerUi = require('swagger-ui-express')
const swaggerJSDoc = require('swagger-jsdoc')

function resolveTrustProxySetting() {
  const rawValue = process.env.TRUST_PROXY
  if (rawValue === undefined || rawValue === null || rawValue === '') {
    return process.env.NODE_ENV === 'production' ? 1 : false
  }

  const normalized = String(rawValue).trim().toLowerCase()
  if (['true', 'on', 'yes'].includes(normalized)) return true
  if (['false', 'off', 'no'].includes(normalized)) return false

  const numericValue = Number(rawValue)
  if (Number.isInteger(numericValue) && numericValue >= 0) {
    return numericValue
  }

  return rawValue
}

function parseBooleanEnv(value, defaultValue = false) {
  if (value === undefined || value === null || value === '') {
    return defaultValue
  }

  const normalized = String(value).trim().toLowerCase()
  if (['true', '1', 'on', 'yes'].includes(normalized)) return true
  if (['false', '0', 'off', 'no'].includes(normalized)) return false
  return defaultValue
}

function normalizePathFragment(value) {
  return String(value || '')
    .replace(/\\/g, '/')
    .replace(/^\/+/, '')
    .replace(/\/+$/, '')
}

function decodeRequestPath(value) {
  try {
    return decodeURIComponent(value || '')
  } catch (_err) {
    return value || ''
  }
}

function buildManagedUploadGuardConfig(uploadStaticDir, attachmentStorageDir) {
  const relativePath = path.relative(uploadStaticDir, attachmentStorageDir)
  if (!relativePath || relativePath === '.') {
    return {
      storagePrefix: '',
      protectedPrefixes: ['articles', 'archives'],
    }
  }

  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    return {
      storagePrefix: '',
      protectedPrefixes: [],
    }
  }

  const storagePrefix = normalizePathFragment(relativePath)
  return {
    storagePrefix,
    protectedPrefixes: ['articles', 'archives'].map(segment => `${storagePrefix}/${segment}`),
  }
}

function isManagedUploadRequest(requestPath, protectedPrefixes) {
  return protectedPrefixes.some(prefix => (
    requestPath === prefix || requestPath.startsWith(`${prefix}/`)
  ))
}

function stripStoragePrefix(requestPath, storagePrefix) {
  if (!storagePrefix) return requestPath
  const normalizedPrefix = `${storagePrefix}/`
  return requestPath.startsWith(normalizedPrefix)
    ? requestPath.slice(normalizedPrefix.length)
    : requestPath
}

function isInlinePreviewMimeType(mimeType) {
  const normalizedMimeType = String(mimeType || '').trim().toLowerCase()
  if (!normalizedMimeType || normalizedMimeType === 'image/svg+xml') {
    return false
  }

  if (normalizedMimeType.startsWith('image/')) {
    return true
  }

  return normalizedMimeType.startsWith('text/')
    || normalizedMimeType.includes('json')
    || normalizedMimeType === 'application/pdf'
}

const app = express()
const serverPort = Number(process.env.PORT || 3000)
const isProduction = process.env.NODE_ENV === 'production'
const publicSiteUrl = (process.env.PUBLIC_SITE_URL || '').trim()
const publicApiUrl = (process.env.PUBLIC_API_URL || '').trim()
const corsAllowedOrigins = (process.env.CORS_ALLOWED_ORIGINS || '')
  .split(',')
  .map(item => item.trim())
  .filter(Boolean)
const enableApiDocs = parseBooleanEnv(process.env.ENABLE_API_DOCS, !isProduction)

if (!publicSiteUrl) {
  throw new Error('缺少环境变量 PUBLIC_SITE_URL')
}

if (!publicApiUrl) {
  throw new Error('缺少环境变量 PUBLIC_API_URL')
}

if (corsAllowedOrigins.length === 0) {
  throw new Error('缺少环境变量 CORS_ALLOWED_ORIGINS')
}

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'TechBlog API 文档',
    version: '1.0.0',
    description: '基于 Node.js + Express + Sequelize 的博客系统 API 文档'
  },
  servers: [
    { url: publicSiteUrl, description: '生产环境' },
    { url: publicApiUrl, description: '开发环境' }
  ]
}

const swaggerOptions = {
  swaggerDefinition,
  apis: ['./routes/*.js'],
}
const swaggerSpec = swaggerJSDoc(swaggerOptions)
const requestBodyLimit = process.env.REQUEST_BODY_LIMIT || '1mb'

app.set('trust proxy', resolveTrustProxySetting())

const corsOptions = {
  origin: corsAllowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
}

app.use(cors(corsOptions))
app.use(express.json({ limit: requestBodyLimit }))
app.use(express.urlencoded({ extended: true, limit: requestBodyLimit }))
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}))
app.use(redisMiddleware)

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 600,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => !isProduction || req.method === 'GET',
  handler: (_req, res) => {
    return res.status(429).json({ code: 1, message: '请求过于频繁，请稍后再试' })
  }
})

// app.use(csurf({ cookie: true }))
app.use(responseFormat)

const uploadPathEnv = process.env.UPLOAD_PATH || 'uploads'
const attachmentStorageEnv = process.env.UPLOAD_IMAGES_PATH || uploadPathEnv
const uploadCacheMaxAgeSeconds = Number(process.env.UPLOAD_CACHE_MAX_AGE_SECONDS || 7 * 24 * 60 * 60)
const uploadStaticDir = path.isAbsolute(uploadPathEnv)
  ? uploadPathEnv
  : path.resolve(__dirname, uploadPathEnv)
const attachmentStorageDir = path.isAbsolute(attachmentStorageEnv)
  ? attachmentStorageEnv
  : path.resolve(__dirname, attachmentStorageEnv)
const {
  storagePrefix: managedUploadStoragePrefix,
  protectedPrefixes: managedUploadProtectedPrefixes
} = buildManagedUploadGuardConfig(uploadStaticDir, attachmentStorageDir)

app.use('/uploads', async (req, res, next) => {
  if (managedUploadProtectedPrefixes.length === 0 || !['GET', 'HEAD'].includes(req.method)) {
    return next()
  }

  const normalizedRequestPath = normalizePathFragment(decodeRequestPath(req.path))
  if (!normalizedRequestPath || !isManagedUploadRequest(normalizedRequestPath, managedUploadProtectedPrefixes)) {
    return next()
  }

  const storedName = stripStoragePrefix(normalizedRequestPath, managedUploadStoragePrefix)

  try {
    const attachment = await Attachment.findOne({
      where: {
        StoredName: storedName,
        IsDeleted: false
      },
      attributes: ['AttachmentID', 'MimeType']
    })

    if (attachment) {
      const accessRoute = isInlinePreviewMimeType(attachment.MimeType) ? 'preview' : 'download'
      return res.redirect(302, `/api/attachments/${attachment.AttachmentID}/${accessRoute}`)
    }

    return res.status(404).json({ code: 1, message: '资源不存在' })
  } catch (err) {
    console.error('Failed to guard managed upload asset', err)
    return res.status(500).json({ code: 1, message: '资源访问失败' })
  }
}, express.static(uploadStaticDir, {
  etag: true,
  lastModified: true,
  maxAge: uploadCacheMaxAgeSeconds * 1000,
  setHeaders: (res, filePath) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
    res.setHeader('Cache-Control', `public, max-age=${uploadCacheMaxAgeSeconds}`)
    res.setHeader('X-Content-Type-Options', 'nosniff')

    if (path.extname(filePath).toLowerCase() === '.svg') {
      res.setHeader('Content-Disposition', 'attachment')
      res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox")
    }
  }
}))

app.get('/healthz', (_req, res) => {
  return res.status(200).json({
    code: 0,
    data: {
      ok: true,
      redisEnabled: process.env.REDIS_ENABLED !== 'false',
      redisConnected: redisClient.isClientConnected(),
    },
  })
})

app.use('/api', (req, res, next) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    return apiLimiter(req, res, next)
  }
  return next()
})

app.use('/api/users', userRoutes)
app.use('/api/roles', roleRoutes)
app.use('/api/articles', articleRoutes)
app.use('/api/comments', commentRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/tags', tagRoutes)
app.use('/api/attachments', attachmentRoutes)
app.use('/api/home-cats', homeCatRoutes)
app.use('/api/settings', settingsRoutes)
app.use('/api/logs', logRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/email', emailRoutes)
app.use('/api/redis', auth, permission.isAdmin, redisRoutes)
if (enableApiDocs) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))
}

app.use(errorHandler)

async function startServer() {
  let redisConnected = false
  const redisTarget = redisClient.getConnectionLabel()

  if (redisClient.isEnabledByConfig()) {
    try {
      await redisClient.connect()
      console.log(`Redis ready at ${redisClient.getConnectionLabel()}`)
      redisConnected = true
    } catch (err) {
      console.warn(`Redis unavailable at ${redisTarget}, server will continue without it`)
      console.warn('Redis error:', err.message)
      redisConnected = false

      try {
        await redisClient.disconnect()
      } catch (_disconnectErr) {
        // ignore
      }
    }
  } else {
    console.log(`Redis disabled by config (${redisTarget})`)
    redisConnected = false
  }

  try {
    await sequelize.authenticate()
    console.log('Database connected')

    if (String(process.env.DB_SYNC_ON_START || '').toLowerCase() === 'true') {
      await sequelize.sync()
      console.log('Database synced')
    }
  } catch (err) {
    console.error('Database startup check failed', err)
    process.exit(1)
  }

  app.listen(serverPort, () => {
    console.log(`Server running on port ${serverPort}`)
    console.log(`Redis target: ${redisClient.getConnectionLabel()} (enabled=${redisClient.isEnabledByConfig()}, connected=${redisConnected})`)
    console.log(enableApiDocs ? `API docs: http://localhost:${serverPort}/api-docs` : 'API docs: disabled')
    console.log(`Service health: http://localhost:${serverPort}/healthz`)
  })
}

startServer()
