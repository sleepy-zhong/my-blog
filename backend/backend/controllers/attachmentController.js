const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const archiver = require('archiver');
const sharp = require('sharp');
const { Op } = require('sequelize');
const { Attachment, User, Article } = require('../models');
const errorCode = require('../middleware/errorCode');

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/plain',
  'text/markdown',
  'application/json',
  'application/zip',
  'application/x-zip-compressed',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation'
]);

function isAdmin(user) {
  return Array.isArray(user?.roles) && user.roles.includes('admin');
}

function isOwner(user, attachment) {
  return !!user && !!attachment && Number(user.id) === Number(attachment.UserID);
}

function normalizeBoolean(value, defaultValue = false) {
  if (value === undefined || value === null || value === '') return defaultValue;
  if (typeof value === 'boolean') return value;
  return String(value).toLowerCase() === 'true';
}

function isSvgMimeType(mimeType) {
  return String(mimeType || '').trim().toLowerCase() === 'image/svg+xml';
}

function isInlinePreviewMimeType(mimeType) {
  const normalizedMimeType = String(mimeType || '').trim().toLowerCase();
  if (!normalizedMimeType || isSvgMimeType(normalizedMimeType)) {
    return false;
  }

  if (normalizedMimeType.startsWith('image/')) {
    return true;
  }

  return normalizedMimeType.startsWith('text/')
    || normalizedMimeType.includes('json')
    || normalizedMimeType === 'application/pdf';
}

function serializeAttachment(attachment, options = {}) {
  const payload = attachment?.toJSON ? attachment.toJSON() : { ...attachment };
  if (options.includeInternal) {
    return payload;
  }

  const { StoredName, StoragePath, FileHash, TempKey, ...safePayload } = payload;
  return safePayload;
}

function isPublicAttachmentPreviewEnabled() {
  return normalizeBoolean(
    process.env.PUBLIC_ATTACHMENT_PREVIEW,
    process.env.NODE_ENV !== 'production'
  );
}

function computeHash(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function getStorageRootDir() {
  const rootEnv = process.env.UPLOAD_IMAGES_PATH || process.env.UPLOAD_PATH || 'uploads';
  return path.isAbsolute(rootEnv)
    ? rootEnv
    : path.resolve(__dirname, '..', rootEnv);
}

function ensureDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function toSlug(name) {
  return String(name || 'file')
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9._-]/g, '')
    .slice(0, 60) || 'file';
}

function createFileTimestamp() {
  const d = new Date();
  const pad = (value) => String(value).padStart(2, '0');
  return [
    d.getFullYear(),
    pad(d.getMonth() + 1),
    pad(d.getDate()),
    pad(d.getHours()),
    pad(d.getMinutes()),
    pad(d.getSeconds())
  ].join('');
}

function createRandomSuffix() {
  return Math.random().toString(36).slice(2, 8);
}

function ensureUploadConstraints(file) {
  const maxFileSize = Number(process.env.MAX_FILE_SIZE || 10 * 1024 * 1024);

  if (!file) {
    const err = new Error('未上传文件');
    err.status = 400;
    err.code = errorCode.VALIDATION_ERROR.code;
    throw err;
  }

  if (file.size > maxFileSize) {
    const err = new Error(`文件大小不能超过 ${Math.floor(maxFileSize / 1024 / 1024)}MB`);
    err.status = 400;
    err.code = errorCode.VALIDATION_ERROR.code;
    throw err;
  }

  if (isSvgMimeType(file.mimetype)) {
    const err = new Error('SVG upload is disabled; convert it to PNG, JPG, or WebP.');
    err.status = 400;
    err.code = errorCode.VALIDATION_ERROR.code;
    throw err;
  }

  if (!ALLOWED_MIME_TYPES.has(file.mimetype) && !file.mimetype.startsWith('image/')) {
    const err = new Error('不支持的文件类型');
    err.status = 400;
    err.code = errorCode.VALIDATION_ERROR.code;
    throw err;
  }
}

async function maybeCompressImage(file, options = {}) {
  const compress = normalizeBoolean(options.compress, true);
  if (!compress || !file.mimetype.startsWith('image/')) {
    return {
      buffer: file.buffer,
      mimeType: file.mimetype,
      compressionInfo: null
    };
  }

  const quality = Number(options.quality || 80);
  const maxWidth = options.maxWidth ? Number(options.maxWidth) : undefined;
  const maxHeight = options.maxHeight ? Number(options.maxHeight) : undefined;

  try {
    let transformer = sharp(file.buffer);
    if (maxWidth || maxHeight) {
      transformer = transformer.resize(maxWidth, maxHeight, {
        fit: 'inside',
        withoutEnlargement: true
      });
    }

    const compressedBuffer = await transformer.jpeg({ quality }).toBuffer();
    return {
      buffer: compressedBuffer,
      mimeType: 'image/jpeg',
      compressionInfo: {
        originalSize: file.size,
        compressedSize: compressedBuffer.length,
        compressionRatio: `${(((file.size - compressedBuffer.length) / file.size) * 100).toFixed(2)}%`
      }
    };
  } catch (_err) {
    return {
      buffer: file.buffer,
      mimeType: file.mimetype,
      compressionInfo: null
    };
  }
}

function buildStoredKey(postId, originalName, mimeType) {
  const originalExt = path.extname(originalName) || '';
  const originalBase = path.basename(originalName, originalExt);
  const extFromMime = mimeType && mimeType.includes('/')
    ? `.${mimeType.split('/')[1].toLowerCase().replace('svg+xml', 'svg')}`
    : (originalExt || '.bin');
  const fileName = `${createFileTimestamp()}-${createRandomSuffix()}-${toSlug(originalBase)}${extFromMime}`;
  return ['articles', String(postId || 'unassigned'), fileName].join('/');
}

function resolveStoredFilePath(storedName) {
  return path.join(getStorageRootDir(), ...String(storedName || '').split('/'));
}

async function findReusableAttachment({ postId, editorToken, userId, originalHash }) {
  if (postId) {
    return Attachment.findOne({
      where: {
        PostID: postId,
        FileHash: originalHash,
        IsDeleted: false
      }
    });
  }

  if (editorToken) {
    return Attachment.findOne({
      where: {
        TempKey: editorToken,
        IsTemporary: true,
        UserID: userId,
        FileHash: originalHash,
        IsDeleted: false
      }
    });
  }

  return null;
}

async function canReadAttachment(attachment, user) {
  if (!attachment) return false;

  if (isAdmin(user) || isOwner(user, attachment)) {
    return true;
  }

  const publicPreviewEnabled = isPublicAttachmentPreviewEnabled();
  if (!publicPreviewEnabled) {
    return false;
  }

  if (attachment.IsDeleted || attachment.IsTemporary || !attachment.PostID) {
    return false;
  }

  const article = attachment.Article || await Article.findByPk(attachment.PostID, {
    attributes: ['PostID', 'Status']
  });

  return !!article && article.Status === 'published';
}

async function assertReadableAttachment(attachment, user) {
  const readable = await canReadAttachment(attachment, user);
  if (!readable) {
    const err = new Error('无权访问该附件');
    err.status = 403;
    err.code = errorCode.PERMISSION_DENIED.code;
    throw err;
  }
}

function sendAttachmentError(res, err) {
  return res.status(err.status || 500).json({
    code: err.code || 1,
    message: err.message || '服务器错误',
    ...(err.error ? { error: err.error } : {})
  });
}

exports.uploadAttachment = async (req, res) => {
  try {
    ensureUploadConstraints(req.file);

    const postId = req.body.postId ? Number(req.body.postId) : null;
    const description = String(req.body.description || '').trim();
    const editorToken = String(req.body.editorToken || '').trim() || null;
    const originalHash = computeHash(req.file.buffer);

    const existed = await findReusableAttachment({
      postId,
      editorToken,
      userId: req.user.id,
      originalHash
    });

    if (existed) {
      return res.status(201).json({
        code: 0,
        message: '已存在相同文件，直接复用',
        data: {
          ...serializeAttachment(existed),
          compressionInfo: null
        }
      });
    }

    const processedFile = await maybeCompressImage(req.file, req.body);
    const storedKey = buildStoredKey(postId, req.file.originalname, processedFile.mimeType);
    const filePath = resolveStoredFilePath(storedKey);
    ensureDirectory(path.dirname(filePath));
    fs.writeFileSync(filePath, processedFile.buffer);

    const attachment = await Attachment.create({
      PostID: postId || null,
      UserID: req.user.id,
      OriginalName: req.file.originalname,
      StoredName: storedKey,
      MimeType: processedFile.mimeType,
      FileSize: processedFile.buffer.length,
      Description: description || '',
      FileHash: originalHash,
      StoragePath: filePath,
      IsTemporary: !postId,
      TempKey: postId ? null : editorToken,
      RefCount: 0,
      IsDeleted: false,
      IsExternal: false,
      ExternalURL: null
    });

    res.status(201).json({
      code: 0,
      message: '上传成功',
      data: {
        ...serializeAttachment(attachment),
        compressionInfo: processedFile.compressionInfo
      }
    });
  } catch (err) {
    sendAttachmentError(res, err);
  }
};

exports.existsByHash = async (req, res) => {
  try {
    const sha256 = String(req.query.sha256 || '').trim().toLowerCase();
    if (!/^[a-f0-9]{64}$/i.test(sha256)) {
      return res.status(400).json({ code: 1, message: 'sha256 格式不正确' });
    }

    const attachment = await Attachment.findOne({
      where: {
        FileHash: sha256,
        IsDeleted: false,
        [Op.or]: [
          { UserID: req.user.id },
          { IsTemporary: false, PostID: { [Op.ne]: null } }
        ]
      },
      include: [{ model: Article, attributes: ['PostID', 'Status'] }],
      order: [['UploadedAt', 'DESC']]
    });

    if (!attachment || !(await canReadAttachment(attachment, req.user))) {
      return res.json({ code: 0, data: { exists: false } });
    }

    return res.json({
      code: 0,
      data: {
        exists: true,
        attachment: serializeAttachment(attachment)
      }
    });
  } catch (err) {
    sendAttachmentError(res, err);
  }
};

exports.getAttachment = async (req, res, next) => {
  try {
    const attachment = await Attachment.findByPk(req.params.id, {
      include: [
        { model: User, attributes: ['UserID', 'Username', 'DisplayName'] },
        { model: Article, attributes: ['PostID', 'Title', 'Status'] }
      ]
    });

    if (!attachment) {
      throw { code: errorCode.NOT_FOUND.code, message: '附件不存在' };
    }

    await assertReadableAttachment(attachment, req.user);
    const includeInternal = isAdmin(req.user) || isOwner(req.user, attachment);
    res.json({ code: 0, data: serializeAttachment(attachment, { includeInternal }) });
  } catch (err) {
    next(err);
  }
};

exports.downloadAttachment = async (req, res, next) => {
  try {
    const attachment = await Attachment.findByPk(req.params.id, {
      include: [{ model: Article, attributes: ['PostID', 'Status'] }]
    });

    if (!attachment) {
      throw { code: errorCode.NOT_FOUND.code, message: '附件不存在' };
    }

    await assertReadableAttachment(attachment, req.user);

    if (attachment.IsExternal && attachment.ExternalURL) {
      return res.redirect(302, attachment.ExternalURL);
    }

    const filePath = resolveStoredFilePath(attachment.StoredName);
    if (!fs.existsSync(filePath)) {
      throw { code: errorCode.NOT_FOUND.code, message: '文件不存在' };
    }

    res.download(filePath, attachment.OriginalName);
  } catch (err) {
    next(err);
  }
};

exports.deleteAttachment = async (req, res, next) => {
  try {
    const attachment = await Attachment.findByPk(req.params.id);
    if (!attachment) {
      throw { code: errorCode.NOT_FOUND.code, message: '附件不存在' };
    }

    if (!isAdmin(req.user) && !isOwner(req.user, attachment)) {
      throw { code: errorCode.PERMISSION_DENIED.code, message: '无权删除该附件' };
    }

    if (!attachment.IsExternal) {
      const filePath = resolveStoredFilePath(attachment.StoredName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    attachment.IsDeleted = true;
    attachment.DeletedAt = new Date();
    attachment.RefCount = 0;
    await attachment.save();

    res.json({ code: 0, message: '附件删除成功' });
  } catch (err) {
    next(err);
  }
};

exports.getAllAttachments = async (req, res) => {
  try {
    const page = Number(req.query.page || 1);
    const pageSize = Number(req.query.pageSize || 10);
    const userId = req.query.userId ? Number(req.query.userId) : null;
    const postId = req.query.postId ? Number(req.query.postId) : null;
    const keyword = String(req.query.keyword || '').trim();
    const where = { IsDeleted: false };

    if (userId) where.UserID = userId;
    if (postId) where.PostID = postId;
    if (keyword) where.OriginalName = { [Op.like]: `%${keyword}%` };

    const { count, rows } = await Attachment.findAndCountAll({
      where,
      include: [
        { model: User, attributes: ['UserID', 'Username', 'DisplayName'] },
        { model: Article, attributes: ['PostID', 'Title', 'Status'] }
      ],
      order: [['UploadedAt', 'DESC']],
      offset: (page - 1) * pageSize,
      limit: pageSize
    });

    res.json({
      code: 0,
      data: {
        list: rows.map(attachment => serializeAttachment(attachment)),
        total: count,
        page,
        pageSize
      }
    });
  } catch (err) {
    sendAttachmentError(res, err);
  }
};

exports.batchDeleteAttachments = async (req, res) => {
  try {
    const attachmentIds = Array.isArray(req.body.attachmentIds)
      ? req.body.attachmentIds.map(Number).filter(Boolean)
      : [];

    if (attachmentIds.length === 0) {
      return res.status(400).json({ code: 1, message: '请选择要删除的附件' });
    }

    const attachments = await Attachment.findAll({
      where: { AttachmentID: attachmentIds }
    });

    for (const attachment of attachments) {
      if (!isAdmin(req.user) && !isOwner(req.user, attachment)) {
        return res.status(403).json({ code: 1, message: '无权删除其他用户的附件' });
      }
    }

    for (const attachment of attachments) {
      if (!attachment.IsExternal) {
        const filePath = resolveStoredFilePath(attachment.StoredName);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      attachment.IsDeleted = true;
      attachment.DeletedAt = new Date();
      attachment.RefCount = 0;
      await attachment.save();
    }

    res.json({ code: 0, message: `成功删除 ${attachments.length} 个附件` });
  } catch (err) {
    sendAttachmentError(res, err);
  }
};

exports.getAttachmentCategories = async (_req, res) => {
  try {
    const attachments = await Attachment.findAll({
      where: { IsDeleted: false },
      attributes: ['MimeType', 'FileSize']
    });

    const categories = {};
    let totalSize = 0;

    attachments.forEach(attachment => {
      const mimeType = attachment.MimeType || 'application/octet-stream';
      const fileSize = attachment.FileSize || 0;

      if (!categories[mimeType]) {
        categories[mimeType] = {
          type: mimeType,
          count: 0,
          totalSize: 0
        };
      }

      categories[mimeType].count += 1;
      categories[mimeType].totalSize += fileSize;
      totalSize += fileSize;
    });

    const categoryList = Object.values(categories).map(item => ({
      ...item,
      percentage: totalSize > 0 ? ((item.totalSize / totalSize) * 100).toFixed(2) : '0.00'
    }));

    res.json({
      code: 0,
      data: {
        categories: categoryList,
        totalFiles: attachments.length,
        totalSize
      }
    });
  } catch (err) {
    sendAttachmentError(res, err);
  }
};

exports.getAttachmentPreview = async (req, res) => {
  try {
    const attachment = await Attachment.findByPk(req.params.id, {
      include: [
        { model: User, attributes: ['UserID', 'Username', 'DisplayName'] },
        { model: Article, attributes: ['PostID', 'Title', 'Status'] }
      ]
    });

    if (!attachment) {
      return res.status(404).json({ code: 1, message: '附件不存在' });
    }

    await assertReadableAttachment(attachment, req.user);

    const filePath = attachment.IsExternal ? null : resolveStoredFilePath(attachment.StoredName);
    const fileExists = attachment.IsExternal ? true : fs.existsSync(filePath);
    const mimeType = attachment.MimeType || 'application/octet-stream';
    const canPreview = isInlinePreviewMimeType(mimeType);
    const isImage = canPreview && mimeType.startsWith('image/');
    const isText = canPreview && (mimeType.startsWith('text/') || mimeType.includes('json') || mimeType.includes('xml'));
    const isPDF = canPreview && mimeType === 'application/pdf';

    res.json({
      code: 0,
      data: {
        attachment: serializeAttachment(attachment),
        fileExists,
        canPreview,
        previewType: isImage ? 'image' : isText ? 'text' : isPDF ? 'pdf' : 'download',
        previewUrl: attachment.IsExternal ? attachment.ExternalURL : (fileExists && canPreview ? `/api/attachments/${attachment.AttachmentID}/preview` : null),
        downloadUrl: attachment.IsExternal ? attachment.ExternalURL : `/api/attachments/${attachment.AttachmentID}/download`
      }
    });
  } catch (err) {
    sendAttachmentError(res, err);
  }
};

exports.previewAttachment = async (req, res) => {
  try {
    const attachment = await Attachment.findByPk(req.params.id, {
      include: [{ model: Article, attributes: ['PostID', 'Status'] }]
    });

    if (!attachment) {
      return res.status(404).json({ code: 1, message: '附件不存在' });
    }

    await assertReadableAttachment(attachment, req.user);

    if (attachment.IsExternal && attachment.ExternalURL) {
      return res.redirect(302, attachment.ExternalURL);
    }

    const filePath = resolveStoredFilePath(attachment.StoredName);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ code: 1, message: '文件不存在' });
    }

    const mimeType = attachment.MimeType || 'application/octet-stream';
    const shouldInlinePreview = isInlinePreviewMimeType(mimeType);

    res.setHeader('Content-Type', mimeType);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    if (!shouldInlinePreview) {
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(attachment.OriginalName)}"`);
      if (isSvgMimeType(mimeType)) {
        res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox");
      }
    } else {
      res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(attachment.OriginalName)}"`);
    }
    res.sendFile(filePath);
  } catch (err) {
    sendAttachmentError(res, err);
  }
};

exports.compressFile = async (req, res) => {
  try {
    const attachment = await Attachment.findByPk(req.params.id);
    if (!attachment) {
      return res.status(404).json({ code: 1, message: '附件不存在' });
    }

    if (!isAdmin(req.user) && !isOwner(req.user, attachment)) {
      return res.status(403).json({ code: 1, message: '无权压缩该附件' });
    }

    if (!String(attachment.MimeType || '').startsWith('image/')) {
      return res.status(400).json({ code: 1, message: '仅支持图片压缩' });
    }

    const filePath = resolveStoredFilePath(attachment.StoredName);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ code: 1, message: '文件不存在' });
    }

    const quality = Number(req.query.quality || 80);
    const width = req.query.width ? Number(req.query.width) : undefined;
    const height = req.query.height ? Number(req.query.height) : undefined;
    const originalBuffer = fs.readFileSync(filePath);

    let transformer = sharp(originalBuffer);
    if (width || height) {
      transformer = transformer.resize(width, height, {
        fit: 'inside',
        withoutEnlargement: true
      });
    }

    const compressedBuffer = await transformer.jpeg({ quality }).toBuffer();
    const storedKey = buildStoredKey(attachment.PostID, attachment.OriginalName, 'image/jpeg');
    const compressedPath = resolveStoredFilePath(storedKey);
    ensureDirectory(path.dirname(compressedPath));
    fs.writeFileSync(compressedPath, compressedBuffer);

    const compressedAttachment = await Attachment.create({
      PostID: attachment.PostID,
      UserID: req.user.id,
      OriginalName: `${path.basename(attachment.OriginalName, path.extname(attachment.OriginalName))}-compressed.jpg`,
      StoredName: storedKey,
      MimeType: 'image/jpeg',
      FileSize: compressedBuffer.length,
      Description: `由 ${attachment.OriginalName} 压缩生成`,
      FileHash: computeHash(compressedBuffer),
      StoragePath: compressedPath,
      IsTemporary: attachment.IsTemporary,
      TempKey: attachment.TempKey,
      RefCount: 0,
      IsDeleted: false,
      IsExternal: false,
      ExternalURL: null
    });

    const compressionRatio = attachment.FileSize > 0
      ? `${(((attachment.FileSize - compressedBuffer.length) / attachment.FileSize) * 100).toFixed(2)}%`
      : '0.00%';

    res.json({
      code: 0,
      message: '附件压缩成功',
      data: {
        original: {
          id: attachment.AttachmentID,
          name: attachment.OriginalName,
          size: attachment.FileSize
        },
        compressed: {
          id: compressedAttachment.AttachmentID,
          name: compressedAttachment.OriginalName,
          size: compressedAttachment.FileSize
        },
        compressionRatio
      }
    });
  } catch (err) {
    sendAttachmentError(res, err);
  }
};

exports.compressFilesToZip = async (req, res) => {
  try {
    const attachmentIds = Array.isArray(req.body.attachmentIds)
      ? req.body.attachmentIds.map(Number).filter(Boolean)
      : [];

    if (attachmentIds.length === 0) {
      return res.status(400).json({ code: 1, message: '请选择要压缩的文件' });
    }

    const attachments = await Attachment.findAll({
      where: {
        AttachmentID: attachmentIds,
        IsDeleted: false
      }
    });

    if (attachments.length === 0) {
      return res.status(404).json({ code: 1, message: '未找到指定附件' });
    }

    for (const attachment of attachments) {
      if (!isAdmin(req.user) && !isOwner(req.user, attachment)) {
        return res.status(403).json({ code: 1, message: '无权压缩其他用户的附件' });
      }
    }

    const zipBaseName = String(req.body.zipName || `attachments_${Date.now()}`).replace(/[^\w-]/g, '') || `attachments_${Date.now()}`;
    const storedKey = ['archives', `${zipBaseName}.zip`].join('/');
    const zipPath = resolveStoredFilePath(storedKey);
    ensureDirectory(path.dirname(zipPath));

    await new Promise((resolve, reject) => {
      const output = fs.createWriteStream(zipPath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', resolve);
      archive.on('error', reject);
      archive.pipe(output);

      attachments.forEach(attachment => {
        if (attachment.IsExternal) return;
        const filePath = resolveStoredFilePath(attachment.StoredName);
        if (fs.existsSync(filePath)) {
          archive.file(filePath, { name: attachment.OriginalName });
        }
      });

      archive.finalize();
    });

    const zipBuffer = fs.readFileSync(zipPath);
    const zipAttachment = await Attachment.create({
      PostID: attachments[0].PostID,
      UserID: req.user.id,
      OriginalName: `${zipBaseName}.zip`,
      StoredName: storedKey,
      MimeType: 'application/zip',
      FileSize: zipBuffer.length,
      Description: `打包 ${attachments.length} 个附件生成`,
      FileHash: computeHash(zipBuffer),
      StoragePath: zipPath,
      IsTemporary: false,
      TempKey: null,
      RefCount: 0,
      IsDeleted: false,
      IsExternal: false,
      ExternalURL: null
    });

    res.json({
      code: 0,
      message: '压缩包生成成功',
      data: {
        zipFile: {
          id: zipAttachment.AttachmentID,
          name: zipAttachment.OriginalName,
          size: zipAttachment.FileSize,
          downloadUrl: `/api/attachments/${zipAttachment.AttachmentID}/download`
        },
        fileCount: attachments.length
      }
    });
  } catch (err) {
    sendAttachmentError(res, err);
  }
};

exports.getCompressionSuggestions = async (req, res) => {
  try {
    const attachment = await Attachment.findByPk(req.params.id);
    if (!attachment) {
      return res.status(404).json({ code: 1, message: '附件不存在' });
    }

    if (!isAdmin(req.user) && !isOwner(req.user, attachment)) {
      return res.status(403).json({ code: 1, message: '无权查看该附件建议' });
    }

    const mimeType = attachment.MimeType || 'application/octet-stream';
    const fileSize = attachment.FileSize || 0;
    const suggestions = {
      canCompress: false,
      suggestions: [],
      estimatedSavings: 0
    };

    if (mimeType.startsWith('image/')) {
      suggestions.canCompress = true;
      suggestions.suggestions.push('图片文件建议使用 80% 质量压缩');
      suggestions.estimatedSavings = fileSize > 1024 * 1024
        ? Math.round(fileSize * 0.6)
        : Math.round(fileSize * 0.3);
    } else if (mimeType.startsWith('text/') || mimeType.includes('json') || mimeType === 'application/pdf') {
      suggestions.canCompress = true;
      suggestions.suggestions.push('建议打包为 ZIP 便于归档和下载');
      suggestions.estimatedSavings = Math.round(fileSize * 0.2);
    } else {
      suggestions.suggestions.push('当前文件类型不建议额外压缩');
    }

    res.json({
      code: 0,
      data: {
        attachment: {
          id: attachment.AttachmentID,
          name: attachment.OriginalName,
          type: mimeType,
          size: fileSize
        },
        suggestions
      }
    });
  } catch (err) {
    sendAttachmentError(res, err);
  }
};
