const express = require('express');
const { body } = require('express-validator');
const tagController = require('../controllers/tagController');
const auth = require('../middleware/auth');
const optionalAuth = require('../middleware/optionalAuth');
const permission = require('../middleware/permission');
const articleReadScope = require('../middleware/articleReadScope');
const { cacheMiddleware, invalidateCacheMiddleware } = require('../middleware/redis');
const { canReadFullTaxonomy } = require('../utils/taxonomyAccess');
const {
  PUBLIC_ARTICLE_CACHE_PATTERNS,
  PUBLIC_CATEGORY_DERIVED_CACHE_PATTERNS,
  PUBLIC_TAG_CACHE_KEY,
  PUBLIC_TAG_CACHE_PATTERNS,
  buildPublicTagPopularCacheKey,
  shouldBypassPublicArticleCache,
} = require('../utils/publicCache');
const router = express.Router();

/**
 * @swagger
 * /api/tags:
 *   post:
 *     summary: 创建标签
 *     tags: [标签]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: 创建成功
 */
router.post('/', auth, permission.isAdmin, [
  body('name').notEmpty().withMessage('Tag name is required')
], invalidateCacheMiddleware([
  ...PUBLIC_TAG_CACHE_PATTERNS,
  ...PUBLIC_CATEGORY_DERIVED_CACHE_PATTERNS,
  ...PUBLIC_ARTICLE_CACHE_PATTERNS,
]), tagController.createTag);

/**
 * @swagger
 * /api/tags:
 *   get:
 *     summary: 获取所有标签
 *     tags: [标签]
 *     responses:
 *       200:
 *         description: 标签列表
 */
router.get(
  '/',
  optionalAuth,
  cacheMiddleware(PUBLIC_TAG_CACHE_KEY, 1800, {
    shouldBypass: (req) => canReadFullTaxonomy(req.user),
  }),
  tagController.getTags
);

/**
 * @swagger
 * /api/tags/popular:
 *   get:
 *     summary: 热门标签 Top N（可选文章过滤）
 *     tags: [标签]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Top N，默认 30
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: 文章状态（默认 published）
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *       - in: query
 *         name: categories
 *         schema:
 *           type: string
 *         description: 逗号分隔的分类ID
 *       - in: query
 *         name: categoryMode
 *         schema:
 *           type: string
 *           enum: [any, all]
 *     responses:
 *       200:
 *         description: 标签统计列表
 */
router.get(
  '/popular',
  optionalAuth,
  articleReadScope,
  cacheMiddleware(buildPublicTagPopularCacheKey, 300, {
    shouldBypass: shouldBypassPublicArticleCache,
  }),
  tagController.getPopularTags
);

/**
 * @swagger
 * /api/tags/{id}:
 *   put:
 *     summary: 更新标签
 *     tags: [标签]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: 更新成功
 */
router.put('/:id', auth, permission.isAdmin, [
  body('name').optional().notEmpty().withMessage('Tag name is required')
], invalidateCacheMiddleware([
  ...PUBLIC_TAG_CACHE_PATTERNS,
  ...PUBLIC_CATEGORY_DERIVED_CACHE_PATTERNS,
  ...PUBLIC_ARTICLE_CACHE_PATTERNS,
]), tagController.updateTag);

/**
 * @swagger
 * /api/tags/{id}:
 *   delete:
 *     summary: 删除标签
 *     tags: [标签]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 删除成功
 */
router.delete('/:id', auth, permission.isAdmin, invalidateCacheMiddleware([
  ...PUBLIC_TAG_CACHE_PATTERNS,
  ...PUBLIC_CATEGORY_DERIVED_CACHE_PATTERNS,
  ...PUBLIC_ARTICLE_CACHE_PATTERNS,
]), tagController.deleteTag);

module.exports = router; 
