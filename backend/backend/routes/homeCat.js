const express = require('express');
const homeCatController = require('../controllers/homeCatController');
const auth = require('../middleware/auth');
const permission = require('../middleware/permission');
const { cacheMiddleware, invalidateCacheMiddleware } = require('../middleware/redis');
const { homeCatImageUpload } = require('../middleware/uploadPolicy');
const {
  PUBLIC_HOME_CAT_CACHE_KEY,
  PUBLIC_HOME_CAT_CACHE_PATTERNS,
} = require('../utils/publicCache');

const router = express.Router();

router.get('/public', cacheMiddleware(PUBLIC_HOME_CAT_CACHE_KEY, 1800), homeCatController.getPublicHomeCats);
router.get('/', auth, permission.isEditorOrAdmin, homeCatController.getHomeCats);
router.post('/upload', auth, permission.isEditorOrAdmin, homeCatImageUpload, homeCatController.uploadHomeCatImage);
router.post('/', auth, permission.isEditorOrAdmin, invalidateCacheMiddleware(PUBLIC_HOME_CAT_CACHE_PATTERNS), homeCatController.createHomeCat);
router.patch('/sort', auth, permission.isEditorOrAdmin, invalidateCacheMiddleware(PUBLIC_HOME_CAT_CACHE_PATTERNS), homeCatController.sortHomeCats);
router.patch('/:id/status', auth, permission.isEditorOrAdmin, invalidateCacheMiddleware(PUBLIC_HOME_CAT_CACHE_PATTERNS), homeCatController.updateHomeCatStatus);
router.put('/:id', auth, permission.isEditorOrAdmin, invalidateCacheMiddleware(PUBLIC_HOME_CAT_CACHE_PATTERNS), homeCatController.updateHomeCat);
router.delete('/:id', auth, permission.isEditorOrAdmin, invalidateCacheMiddleware(PUBLIC_HOME_CAT_CACHE_PATTERNS), homeCatController.deleteHomeCat);

module.exports = router;
