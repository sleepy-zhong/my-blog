const express = require('express');
const { body } = require('express-validator');
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');
const permission = require('../middleware/permission');
const router = express.Router();
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage });

/**
 * @swagger
 * /api/users/register:
 *   post:
 *     summary: 用户注册
 *     tags: [用户]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *     responses:
 *       201:
 *         description: 注册成功
 */
router.post('/register', [
  body('username').notEmpty().withMessage('用户名不能为空'),
  body('email').isEmail().withMessage('邮箱格式不正确'),
  body('password').isLength({ min: 6 }).withMessage('密码至少6位')
], userController.register);

/**
 * @swagger
 * /api/users/login:
 *   post:
 *     summary: 用户登录
 *     tags: [用户]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *               username:
 *                 type: string
 *     responses:
 *       200:
 *         description: 登录成功
 */
router.post('/login', [
  body('email').optional().isEmail().withMessage('邮箱格式不正确'),
  body('password').notEmpty().withMessage('密码不能为空')
], userController.login);

/**
 * @swagger
 * /api/users/me:
 *   get:
 *     summary: 获取当前用户信息
 *     tags: [用户]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 用户信息
 */
router.get('/me', auth, userController.getMe);

/**
 * @swagger
 * /api/users/me:
 *   put:
 *     summary: 更新当前用户信息
 *     tags: [用户]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               displayName:
 *                 type: string
 *               bio:
 *                 type: string
 *               avatarURL:
 *                 type: string
 *     responses:
 *       200:
 *         description: 更新成功
 */
router.put('/me', auth, upload.single('file'), userController.updateMe);

/**
 * @swagger
 * /api/users/me/password:
 *   put:
 *     summary: 修改密码
 *     tags: [用户]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               oldPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: 密码修改成功
 */
router.put('/me/password', auth, userController.changePassword);

/**
 * @swagger
 * /api/users/me/email:
 *   put:
 *     summary: 更新邮箱
 *     tags: [用户]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: 邮箱更新成功
 */
router.put('/me/email', auth, userController.updateEmail);

/**
 * @swagger
 * /api/users/forgot-password:
 *   post:
 *     summary: 找回密码（伪实现）
 *     tags: [用户]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: 密码重置成功
 */
router.post('/forgot-password', userController.forgotPassword);

/**
 * @swagger
 * /api/users/logout:
 *   post:
 *     summary: 用户登出
 *     tags: [用户]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 登出成功
 */
router.post('/logout', auth, userController.logout);

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: 用户列表（后台，分页、搜索、筛选）
 *     tags: [用户]
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
 *         name: keyword
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: role
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 用户列表
 */
router.get('/', auth, permission.isAdmin, userController.getUsers);

/**
 * @swagger
 * /api/users/online:
 *   get:
 *     summary: 获取在线用户列表
 *     tags: [用户]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 在线用户列表
 */
router.get('/online', auth, permission.isAdmin, userController.getOnlineUsers);

/**
 * @swagger
 * /api/users/statistics:
 *   get:
 *     summary: 获取用户统计信息
 *     tags: [用户]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 用户统计信息
 */
router.get('/statistics', auth, permission.isAdmin, userController.getUserStatistics);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: 获取指定用户信息
 *     tags: [用户]
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
 *         description: 用户信息
 */
router.get('/:id', auth, permission.isAdmin, userController.getUserById);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: 修改用户信息（角色、状态）
 *     tags: [用户]
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
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               displayName:
 *                 type: string
 *               bio:
 *                 type: string
 *               avatarURL:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: 用户信息更新成功
 */
router.put('/:id', auth, permission.isAdmin, upload.single('file'), userController.updateUser);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: 删除用户
 *     tags: [用户]
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
 *         description: 用户删除成功
 */
router.delete('/:id', auth, permission.isAdmin, userController.deleteUser);

/**
 * @swagger
 * /api/users/{id}/status:
 *   put:
 *     summary: 启用/禁用用户
 *     tags: [用户]
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
 *               isActive:
 *                 type: boolean
 *                 description: true=启用，false=禁用
 *     responses:
 *       200:
 *         description: 用户状态更新成功
 */
router.put('/:id/status', auth, permission.isAdmin, userController.setUserStatus);

/**
 * @swagger
 * /api/users/{id}/roles:
 *   post:
 *     summary: 为用户分配角色（支持多角色）
 *     tags: [用户]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 用户ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - roleIds
 *             properties:
 *               roleIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                   enum: [1, 2, 3, 4]
 *                 description: 角色ID数组，支持多角色分配。1=admin, 2=editor, 3=author, 4=user
 *                 minItems: 1
 *                 example: [1, 2, 3]
 *     responses:
 *       200:
 *         description: 角色分配成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 0
 *                 message:
 *                   type: string
 *                   example: "角色分配成功，已分配 3 个角色"
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       description: 更新后的用户信息（包含角色）
 *                     assignedRoles:
 *                       type: array
 *                       items:
 *                         type: integer
 *                       description: 分配的角色ID数组
 *                       example: [1, 2, 3]
 *                     roleCount:
 *                       type: integer
 *                       description: 分配的角色数量
 *                       example: 3
 *       400:
 *         description: 参数错误
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 1
 *                 message:
 *                   type: string
 *                   examples:
 *                     - "roleIds必须是数组格式"
 *                     - "至少需要分配一个角色"
 *                     - "无效的角色ID: 99"
 *       404:
 *         description: 用户不存在
 */
router.post('/:id/roles', auth, permission.isAdmin, userController.assignUserRoles);

/**
 * @swagger
 * /api/users/{id}/roles/{roleId}:
 *   delete:
 *     summary: 移除用户角色
 *     tags: [用户]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 角色移除成功
 */
router.delete('/:id/roles/:roleId', auth, permission.isAdmin, userController.removeUserRole);

/**
 * @swagger
 * /api/users/batch-delete:
 *   post:
 *     summary: 批量删除用户
 *     tags: [用户]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       200:
 *         description: 批量删除成功
 */
router.post('/batch-delete', auth, permission.isAdmin, userController.batchDeleteUsers);

/**
 * @swagger
 * /api/users/{id}/all:
 *   put:
 *     summary: 更新用户所有数据（危险操作，仅供演示）
 *     tags: [用户]
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
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *                 description: 明文密码，会自动hash
 *               displayName:
 *                 type: string
 *               bio:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: 用户信息更新成功
 */
router.put('/:id/all', auth, permission.isAdmin, userController.updateUserAll);

module.exports = router; 
