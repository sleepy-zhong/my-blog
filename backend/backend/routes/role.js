const express = require('express');
const { body } = require('express-validator');
const roleController = require('../controllers/roleController');
const auth = require('../middleware/auth');
const permission = require('../middleware/permission');
const router = express.Router();

/**
 * @swagger
 * /api/roles:
 *   get:
 *     summary: 获取所有角色
 *     tags: [角色管理]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 角色列表
 */
router.get('/', auth, permission.isAdmin, roleController.getRoles);

/**
 * @swagger
 * /api/roles:
 *   post:
 *     summary: 创建角色
 *     tags: [角色管理]
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
 *                 required: true
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: 创建成功
 */
router.post('/', auth, permission.isAdmin, [
  body('name').notEmpty().withMessage('角色名不能为空'),
  body('description').optional()
], roleController.createRole);

/**
 * @swagger
 * /api/roles/{id}:
 *   get:
 *     summary: 获取角色详情
 *     tags: [角色管理]
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
 *         description: 角色详情
 */
router.get('/:id', auth, permission.isAdmin, roleController.getRoleById);

/**
 * @swagger
 * /api/roles/{id}:
 *   put:
 *     summary: 更新角色
 *     tags: [角色管理]
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
  body('name').optional(),
  body('description').optional()
], roleController.updateRole);

/**
 * @swagger
 * /api/roles/{id}:
 *   delete:
 *     summary: 删除角色
 *     tags: [角色管理]
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
router.delete('/:id', auth, permission.isAdmin, roleController.deleteRole);

/**
 * @swagger
 * /api/roles/{id}/users:
 *   get:
 *     summary: 获取角色的用户列表
 *     tags: [角色管理]
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
 *         description: 用户列表
 */
router.get('/:id/users', auth, permission.isAdmin, roleController.getRoleUsers);

/**
 * @swagger
 * /api/roles/{id}/permissions:
 *   post:
 *     summary: 为角色分配权限
 *     tags: [角色管理]
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
 *               permissionIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       200:
 *         description: 权限分配成功
 */
router.post('/:id/permissions', auth, permission.isAdmin, roleController.assignRolePermissions);

/**
 * @swagger
 * /api/roles/{id}/permissions/{permissionId}:
 *   delete:
 *     summary: 移除角色权限
 *     tags: [角色管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: permissionId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 权限移除成功
 */
router.delete('/:id/permissions/:permissionId', auth, permission.isAdmin, roleController.removeRolePermission);

module.exports = router; 