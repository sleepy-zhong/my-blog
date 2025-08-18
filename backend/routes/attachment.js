const express = require('express');
const attachmentController = require('../controllers/attachmentController');
const auth = require('../middleware/auth');
const permission = require('../middleware/permission');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const publicPreview = String(process.env.PUBLIC_ATTACHMENT_PREVIEW || 'true').toLowerCase() === 'true';

// 使用内存存储，便于控制器进行压缩/指纹/去重后再落盘
const upload = multer({ storage: multer.memoryStorage() });

/**
 * @swagger
 * /api/attachments:
 *   get:
 *     summary: 获取所有附件
 *     tags: [附件]
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
 *         name: userId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: postId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 附件列表
 */
router.get('/', auth, permission.isAdmin, attachmentController.getAllAttachments);

/**
 * @swagger
 * /api/attachments:
 *   post:
 *     summary: 上传附件
 *     tags: [附件]
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
 *               postId:
 *                 type: integer
 *               description:
 *                 type: string
 *               compress:
 *                 type: boolean
 *                 default: true
 *               quality:
 *                 type: integer
 *                 default: 80
 *               maxWidth:
 *                 type: integer
 *               maxHeight:
 *                 type: integer
 *               editorToken:
 *                 type: string
 *                 description: 编辑会话键（用于草稿期临时附件聚合）
 *               sha256:
 *                 type: string
 *                 description: 客户端预计算的 SHA-256（十六进制），用于查重
 *     responses:
 *       201:
 *         description: 上传成功
 */
router.post('/', auth, upload.single('file'), attachmentController.uploadAttachment);

/**
 * @swagger
 * /api/attachments/lookup:
 *   get:
 *     summary: 按 SHA-256 查重（全局）
 *     tags: [附件]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: sha256
 *         required: true
 *         schema:
 *           type: string
 *           description: SHA-256 十六进制（小写/大写均可）
 *     responses:
 *       200:
 *         description: 是否存在
 */
router.get('/lookup', auth, attachmentController.existsByHash);

/**
 * @swagger
 * /api/attachments/batch-delete:
 *   post:
 *     summary: 批量删除附件
 *     tags: [附件]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               attachmentIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       200:
 *         description: 批量删除成功
 */
router.post('/batch-delete', auth, permission.isAdmin, attachmentController.batchDeleteAttachments);

/**
 * @swagger
 * /api/attachments/categories:
 *   get:
 *     summary: 获取文件分类统计
 *     tags: [附件]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 文件分类统计
 */
router.get('/categories', auth, permission.isAdmin, attachmentController.getAttachmentCategories);

/**
 * @swagger
 * /api/attachments/{id}/preview-info:
 *   get:
 *     summary: 获取文件预览信息
 *     tags: [附件]
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
 *         description: 文件预览信息
 */
if (publicPreview) {
  router.get('/:id/preview-info', attachmentController.getAttachmentPreview);
} else {
  router.get('/:id/preview-info', auth, attachmentController.getAttachmentPreview);
}

/**
 * @swagger
 * /api/attachments/{id}/preview:
 *   get:
 *     summary: 文件预览
 *     tags: [附件]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 文件预览
 */
if (publicPreview) {
  router.get('/:id/preview', attachmentController.previewAttachment);
} else {
  router.get('/:id/preview', auth, attachmentController.previewAttachment);
}

/**
 * @swagger
 * /api/attachments/{id}:
 *   get:
 *     summary: 获取附件信息
 *     tags: [附件]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 附件信息
 */
router.get('/:id', attachmentController.getAttachment);

/**
 * @swagger
 * /api/attachments/{id}/download:
 *   get:
 *     summary: 下载附件
 *     tags: [附件]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 下载文件
 */
router.get('/:id/download', attachmentController.downloadAttachment);

/**
 * @swagger
 * /api/attachments/{id}/compress:
 *   post:
 *     summary: 压缩单个文件（图片压缩）
 *     tags: [附件]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: quality
 *         schema:
 *           type: integer
 *           default: 80
 *         description: 压缩质量（1-100）
 *       - in: query
 *         name: width
 *         schema:
 *           type: integer
 *         description: 调整宽度
 *       - in: query
 *         name: height
 *         schema:
 *           type: integer
 *         description: 调整高度
 *     responses:
 *       200:
 *         description: 压缩成功
 */
router.post('/:id/compress', auth, attachmentController.compressFile);

/**
 * @swagger
 * /api/attachments/compress-zip:
 *   post:
 *     summary: 批量压缩文件为ZIP
 *     tags: [附件]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               attachmentIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *               zipName:
 *                 type: string
 *                 description: ZIP文件名（可选）
 *     responses:
 *       200:
 *         description: 压缩成功
 */
router.post('/compress-zip', auth, attachmentController.compressFilesToZip);

/**
 * @swagger
 * /api/attachments/{id}/compression-suggestions:
 *   get:
 *     summary: 获取文件压缩建议
 *     tags: [附件]
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
 *         description: 压缩建议
 */
router.get('/:id/compression-suggestions', auth, attachmentController.getCompressionSuggestions);

/**
 * @swagger
 * /api/attachments/{id}:
 *   delete:
 *     summary: 删除附件
 *     tags: [附件]
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
router.delete('/:id', auth, permission.isOwnerOrAdmin('id'), attachmentController.deleteAttachment);

module.exports = router; 