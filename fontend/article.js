const express = require('express');
const { body } = require('express-validator');
const articleController = require('../controllers/articleController');
const auth = require('../middleware/auth');
const permission = require('../middleware/permission');
const router = express.Router();
const multer = require('multer');
const upload = multer();

/**
 * @swagger
 * /api/articles:
 *   post:
 *     summary: 创建文章
 *     tags: [文章]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               slug:
 *                 type: string
 *               excerpt:
 *                 type: string
 *               status:
 *                 type: string
 *               categoryIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *               tagIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       201:
 *         description: 创建成功
 */
router.post('/', auth, permission.isAuthorOrAdmin, [
  body('title').notEmpty().withMessage('标题不能为空'),
  body('content').notEmpty().withMessage('内容不能为空')
], articleController.createArticle);

/**
 * @swagger
 * /api/articles:
 *   get:
 *     summary: 获取所有文章
 *     tags: [文章]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: category
 *         schema:
 *           type: integer
 *       - in: query
 *         name: tag
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 文章列表
 */
router.get('/', articleController.getArticles);

/**
 * @swagger
 * /api/articles/{id}:
 *   get:
 *     summary: 获取单篇文章
 *     tags: [文章]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 文章详情
 */
router.get('/:id', articleController.getArticleById);

/**
 * @swagger
 * /api/articles/{id}:
 *   put:
 *     summary: 更新文章
 *     tags: [文章]
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
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               excerpt:
 *                 type: string
 *               status:
 *                 type: string
 *               categoryIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *               tagIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       200:
 *         description: 更新成功
 */
router.put('/:id', auth, permission.isAuthorOrAdmin, articleController.updateArticle);

/**
 * @swagger
 * /api/articles/{id}:
 *   delete:
 *     summary: 删除文章
 *     tags: [文章]
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
router.delete('/:id', auth, permission.isAuthorOrAdmin, articleController.deleteArticle);

/**
 * @swagger
 * /api/articles/{id}/revisions:
 *   get:
 *     summary: 获取文章修订历史
 *     tags: [文章]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 修订历史
 */
router.get('/:id/revisions', articleController.getRevisions);

/**
 * @swagger
 * /api/articles/{id}/status:
 *   put:
 *     summary: 修改文章状态
 *     tags: [文章]
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
 *               status:
 *                 type: string
 *                 description: 新状态（draft/published/archived）
 *     responses:
 *       200:
 *         description: 状态更新成功
 */
router.put('/:id/status', auth, permission.isAuthorOrAdmin, articleController.updateArticleStatus);

/**
 * @swagger
 * /api/articles/{id}/publish:
 *   put:
 *     summary: 发布文章
 *     tags: [文章]
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
 *         description: 文章发布成功
 */
router.put('/:id/publish', auth, permission.isAuthorOrAdmin, articleController.publishArticle);

/**
 * @swagger
 * /api/articles/{id}/archive:
 *   put:
 *     summary: 归档文章
 *     tags: [文章]
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
 *         description: 文章归档成功
 */
router.put('/:id/archive', auth, permission.isAuthorOrAdmin, articleController.archiveArticle);

/**
 * @swagger
 * /api/articles/{id}/featured-image:
 *   put:
 *     summary: 设置文章封面图
 *     tags: [文章]
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
 *               featuredImageURL:
 *                 type: string
 *                 description: 封面图URL
 *     responses:
 *       200:
 *         description: 封面图设置成功
 */
router.put('/:id/featured-image', auth, articleController.setFeaturedImage);

/**
 * @swagger
 * /api/articles/slug/{slug}:
 *   get:
 *     summary: 通过Slug获取文章
 *     tags: [文章]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 文章详情
 */
router.get('/slug/:slug', articleController.getArticleBySlug);

/**
 * @swagger
 * /api/articles/{id}/view-count:
 *   put:
 *     summary: 增加文章浏览次数
 *     tags: [文章]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 浏览次数更新成功
 */
router.put('/:id/view-count', articleController.incrementViewCount);

/**
 * @swagger
 * /api/articles/my:
 *   get:
 *     summary: 获取我的文章
 *     tags: [文章]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 我的文章列表
 */
router.get('/my', auth, articleController.getMyArticles);

/**
 * @swagger
 * /api/articles/drafts:
 *   get:
 *     summary: 获取草稿箱
 *     tags: [文章]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 草稿箱文章列表
 */
router.get('/drafts', auth, articleController.getDrafts);

/**
 * @swagger
 * /api/articles/published:
 *   get:
 *     summary: 获取已发布文章
 *     tags: [文章]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *       - in: query
 *         name: category
 *         schema:
 *           type: integer
 *       - in: query
 *         name: tag
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 已发布文章列表
 */
router.get('/published', articleController.getPublishedArticles);

/**
 * @swagger
 * /api/articles/{id}/restore/{revisionId}:
 *   post:
 *     summary: 回滚到历史版本
 *     tags: [文章]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: revisionId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 回滚成功
 */
router.post('/:id/restore/:revisionId', auth, articleController.restoreRevision);

/**
 * @swagger
 * /api/articles/import:
 *   post:
 *     summary: 上传多格式文档并解析为结构化内容
 *     tags: [文章]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: 文档解析成功
 */
router.post('/import', auth, upload.single('file'), articleController.uploadAndParseArticle);

module.exports = router; 