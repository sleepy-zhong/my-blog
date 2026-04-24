const express = require('express')
const settingsController = require('../controllers/settingsController')
const auth = require('../middleware/auth')
const permission = require('../middleware/permission')
const { cacheMiddleware, invalidateCacheMiddleware } = require('../middleware/redis')
const { PUBLIC_SETTINGS_CACHE_KEY, PUBLIC_SETTINGS_CACHE_PATTERNS } = require('../utils/publicCache')

const router = express.Router()

router.get('/public', cacheMiddleware(PUBLIC_SETTINGS_CACHE_KEY, 1800), settingsController.getPublicSettings)
router.get('/', auth, permission.isEditorOrAdmin, cacheMiddleware(PUBLIC_SETTINGS_CACHE_KEY, 1800), settingsController.getSettings)
router.put('/', auth, permission.isEditorOrAdmin, invalidateCacheMiddleware(PUBLIC_SETTINGS_CACHE_PATTERNS), settingsController.updateSettings)

module.exports = router
