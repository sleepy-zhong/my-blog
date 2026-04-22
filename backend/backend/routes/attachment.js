const express = require('express');
const attachmentController = require('../controllers/attachmentController');
const auth = require('../middleware/auth');
const optionalAuth = require('../middleware/optionalAuth');
const permission = require('../middleware/permission');
const { attachmentUploadGuard } = require('../middleware/riskControl');
const { attachmentUpload } = require('../middleware/uploadPolicy');
const { requireFeatureEnabled } = require('../middleware/featureFlag');

const router = express.Router();

router.get('/', auth, permission.isAdmin, attachmentController.getAllAttachments);
router.post('/', auth, attachmentUploadGuard, attachmentUpload, attachmentController.uploadAttachment);
router.get('/lookup', auth, attachmentController.existsByHash);
router.post('/batch-delete', auth, permission.isAdmin, attachmentController.batchDeleteAttachments);
router.get('/categories', auth, permission.isAdmin, attachmentController.getAttachmentCategories);
router.post(
  '/compress-zip',
  auth,
  requireFeatureEnabled('ENABLE_ATTACHMENT_ARCHIVE', '当前部署已关闭附件打包功能'),
  attachmentController.compressFilesToZip
);

router.get('/:id/preview-info', optionalAuth, attachmentController.getAttachmentPreview);
router.get('/:id/preview', optionalAuth, attachmentController.previewAttachment);
router.get('/:id/download', optionalAuth, attachmentController.downloadAttachment);
router.post(
  '/:id/compress',
  auth,
  requireFeatureEnabled('ENABLE_ATTACHMENT_RECOMPRESS', '当前部署已关闭图片二次压缩功能'),
  attachmentController.compressFile
);
router.get('/:id/compression-suggestions', auth, attachmentController.getCompressionSuggestions);
router.get('/:id', optionalAuth, attachmentController.getAttachment);
router.delete('/:id', auth, attachmentController.deleteAttachment);

module.exports = router;
