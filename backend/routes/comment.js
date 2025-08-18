const express = require('express');
const { body } = require('express-validator');
const commentController = require('../controllers/commentController');
const auth = require('../middleware/auth');
const permission = require('../middleware/permission');
const router = express.Router();

/**
 * @swagger
 * /api/comments/{articleId}:
 *   post:
 *     summary: 发表评论
 *     tags: [评论]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: articleId
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
 *               content:
 *                 type: string
 *                 description: 评论内容
 *               parentId:
 *                 type: integer
 *                 description: 父评论ID（回复时传入）
 *     responses:
 *       201:
 *         description: 评论发表成功
 */
router.post('/:articleId', auth, [
  body('content').notEmpty().withMessage('评论内容不能为空')
], commentController.createComment);

/**
 * @swagger
 * /api/comments/{articleId}/tree:
 *   get:
 *     summary: 获取评论树（楼中楼结构）
 *     tags: [评论]
 *     parameters:
 *       - in: path
 *         name: articleId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [approved, pending, spam]
 *           default: approved
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: 评论树结构
 */
router.get('/:articleId/tree', commentController.getCommentsTreeByArticle);

/**
 * @swagger
 * /api/comments/{articleId}:
 *   get:
 *     summary: 获取某篇文章的所有评论（平铺结构）
 *     tags: [评论]
 *     parameters:
 *       - in: path
 *         name: articleId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [approved, pending, spam]
 *           default: approved
 *     responses:
 *       200:
 *         description: 评论列表
 */
router.get('/:articleId', commentController.getCommentsByArticle);

/**
 * @swagger
 * /api/comments/{id}:
 *   delete:
 *     summary: 删除评论
 *     tags: [评论]
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
router.delete('/:id', auth, permission.isOwnerOrAdmin('id'), commentController.deleteComment);

/**
 * @swagger
 * /api/comments/{id}/status:
 *   put:
 *     summary: 更新评论状态（管理员）
 *     tags: [评论]
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
 *                 enum: [approved, pending, spam]
 *     responses:
 *       200:
 *         description: 状态更新成功
 */
router.put('/:id/status', auth, permission.isAdmin, commentController.updateCommentStatus);

/**
 * @swagger
 * /api/comments:
 *   get:
 *     summary: 获取所有评论（管理员）
 *     tags: [评论]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [approved, pending, spam]
 *       - in: query
 *         name: articleId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 评论列表
 */
router.get('/', auth, permission.isAdmin, commentController.getAllComments);

module.exports = router; 