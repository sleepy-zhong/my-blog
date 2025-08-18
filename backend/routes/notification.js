const express = require('express');
const notificationController = require('../controllers/notificationController');
const auth = require('../middleware/auth');
const permission = require('../middleware/permission');
const { body } = require('express-validator');
const userController = require('../controllers/userController');
const router = express.Router();

/**
 * @swagger
 * /api/notifications/test:
 *   post:
 *     summary: 发送测试邮件
 *     tags: [通知与系统]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               to:
 *                 type: string
 *                 description: 收件人邮箱
 *               subject:
 *                 type: string
 *                 description: 邮件主题
 *               html:
 *                 type: string
 *                 description: 邮件内容（HTML）
 *     responses:
 *       200:
 *         description: 邮件发送成功
 */
router.post('/test', auth, permission.isAdmin, notificationController.sendTestMail);



module.exports = router;