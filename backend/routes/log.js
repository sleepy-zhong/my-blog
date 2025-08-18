const express = require('express');
const logController = require('../controllers/logController');
const auth = require('../middleware/auth');
const permission = require('../middleware/permission');
const router = express.Router();

/**
 * @swagger
 * /api/logs:
 *   get:
 *     summary: 查询操作日志
 *     tags: [操作日志]
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
 *         name: user
 *         schema:
 *           type: integer
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 日志列表
 */
router.get('/', auth, permission.isAdmin, logController.getLogs);

/**
 * @swagger
 * /api/logs/{id}:
 *   get:
 *     summary: 查看单条日志详情
 *     tags: [操作日志]
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
 *         description: 日志详情
 */
router.get('/:id', auth, permission.isAdmin, logController.getLogById);

module.exports = router; 