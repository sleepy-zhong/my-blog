const express = require('express');
const { body } = require('express-validator');
const categoryController = require('../controllers/categoryController');
const auth = require('../middleware/auth');
const permission = require('../middleware/permission');
const router = express.Router();

/**
 * @swagger
 * /api/categories:
 *   post:
 *     summary: 创建分类
 *     tags: [分类]
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
 *               parentCategoryId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: 创建成功
 */
router.post('/', auth, permission.isAdmin, [
  body('name').notEmpty().withMessage('分类名不能为空')
], categoryController.createCategory);

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: 获取所有分类
 *     tags: [分类]
 *     responses:
 *       200:
 *         description: 分类列表
 */
router.get('/', categoryController.getCategories);

/**
 * @swagger
 * /api/categories/summary:
 *   get:
 *     summary: 分类统计汇总
 *     tags: [分类]
 *     parameters:
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
 *         name: tags
 *         schema:
 *           type: string
 *         description: 逗号分隔的标签ID
 *       - in: query
 *         name: tagMode
 *         schema:
 *           type: string
 *           enum: [any, all]
 *     responses:
 *       200:
 *         description: 分类统计列表
 */
router.get('/summary', categoryController.getCategoriesSummary);

/**
 * @swagger
 * /api/categories/{id}:
 *   put:
 *     summary: 更新分类
 *     tags: [分类]
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
 *               parentCategoryId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: 更新成功
 */
router.put('/:id', auth, permission.isAdmin, [
  body('name').optional().notEmpty().withMessage('分类名不能为空')
], categoryController.updateCategory);

/**
 * @swagger
 * /api/categories/{id}:
 *   delete:
 *     summary: 删除分类
 *     tags: [分类]
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
router.delete('/:id', auth, permission.isAdmin, categoryController.deleteCategory);

/**
 * @swagger
 * /api/categories/tree:
 *   get:
 *     summary: 获取多级分类树结构
 *     tags: [分类]
 *     responses:
 *       200:
 *         description: 分类树结构
 */
router.get('/tree', categoryController.getCategoryTree);

module.exports = router; 