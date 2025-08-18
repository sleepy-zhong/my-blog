const { Attachment, User, Article } = require('../models');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const errorCode = require('../middleware/errorCode');
const { Op } = require('sequelize');
const archiver = require('archiver');
const sharp = require('sharp');

// 上传附件（自动压缩，支持临时附件与全局哈希去重）
exports.uploadAttachment = async (req, res) => {
  if (!req.file) return res.status(400).json({ code: 1, message: '未上传文件' });
  try {
    const { postId, description, compress = true, quality = 80, maxWidth, maxHeight, editorToken, sha256 } = req.body;
    const { originalname, mimetype, size, buffer } = req.file;
    
    let finalFileName = originalname;
    let finalMimeType = mimetype;
    let finalSize = size;
    let finalBuffer = buffer;
    
    // 命名规则工具函数
    const toSlug = (name) => String(name).toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9._-]/g, '').slice(0, 60);
    const rand6 = () => Math.random().toString(36).slice(2, 8);
    const pad2 = (n) => (n < 10 ? '0' + n : '' + n);
    const yyyymmddHHMMSS = () => {
      const d = new Date();
      return d.getFullYear().toString() + pad2(d.getMonth() + 1) + pad2(d.getDate()) + pad2(d.getHours()) + pad2(d.getMinutes()) + pad2(d.getSeconds());
    };
    
    // 如果是图片且启用压缩
    if (compress && mimetype.startsWith('image/')) {
      try {
        let sharpInstance = sharp(buffer);
        
        // 如果指定了最大尺寸，进行尺寸调整
        if (maxWidth || maxHeight) {
          sharpInstance = sharpInstance.resize(
            maxWidth ? parseInt(maxWidth) : undefined,
            maxHeight ? parseInt(maxHeight) : undefined,
            {
              fit: 'inside',
              withoutEnlargement: true
            }
          );
        }
        
        // 压缩图片
        const compressedBuffer = await sharpInstance
          .jpeg({ quality: parseInt(quality) })
          .toBuffer();
        
        // 更新文件信息
        finalBuffer = compressedBuffer;
        finalSize = compressedBuffer.length;
        finalMimeType = 'image/jpeg';
        console.log(`图片压缩成功: ${originalname} -> JPEG, 大小: ${size} -> ${finalSize}`);
      } catch (compressError) {
        console.warn('图片压缩失败，使用原文件:', compressError.message);
        // 压缩失败时使用原文件
      }
    }
    
    // 生成文件指纹（基于最终 buffer）用于去重
    const computedHash = crypto.createHash('sha256').update(finalBuffer).digest('hex');
    const fileHash = (sha256 && typeof sha256 === 'string' && sha256.length === 64)
      ? sha256.toLowerCase()
      : computedHash;

    // 去重策略：
    // 1) 若 postId 存在，则限定在该文章内按指纹去重
    // 2) 否则若提供 editorToken（草稿期），则在当前会话的临时附件内去重
    // 3) 其他情况不做全局复用，避免跨文记录被错误重绑定
    let existed = null;
    if (postId) {
      existed = await Attachment.findOne({ where: { PostID: postId, FileHash: fileHash, IsDeleted: false } });
    } else if (editorToken) {
      existed = await Attachment.findOne({ where: { TempKey: editorToken, IsTemporary: true, FileHash: fileHash, UserID: req.user.id, IsDeleted: false } });
    }
    if (existed) {
      return res.status(201).json({
        code: 0,
        message: '已存在相同文件，直接复用',
        data: {
          ...existed.toJSON(),
          compressionInfo: compress && mimetype.startsWith('image/') ? {
            originalSize: size,
            compressedSize: finalSize,
            compressionRatio: ((size - finalSize) / size * 100).toFixed(2) + '%'
          } : null
        }
      });
    }

    // 生成存储键：articles/{articleId}/{yyyyMMddHHmmss}-{rand6}-{origSlug}.{ext}
    const uploadRootEnv = process.env.UPLOAD_IMAGES_PATH || process.env.UPLOAD_PATH || 'uploads';
    const uploadRootDir = path.isAbsolute(uploadRootEnv)
      ? uploadRootEnv
      : path.resolve(__dirname, '..', uploadRootEnv);
    if (!fs.existsSync(uploadRootDir)) fs.mkdirSync(uploadRootDir, { recursive: true });

    const articleIdSegment = String(postId || 'unassigned');
    const originalExt = path.extname(originalname) || '';
    const originalBase = path.basename(originalname, originalExt);
    const slugBase = toSlug(originalBase);
    const extFromMime = finalMimeType && /\//.test(finalMimeType)
      ? ('.' + finalMimeType.split('/')[1].toLowerCase())
      : (originalExt || '.bin');
    const fileName = `${yyyymmddHHMMSS()}-${rand6()}-${slugBase}${extFromMime}`;
    const storedKey = ['articles', articleIdSegment, fileName].join('/');
    const filePath = path.join(uploadRootDir, ...storedKey.split('/'));
    const dirForFile = path.dirname(filePath);
    if (!fs.existsSync(dirForFile)) fs.mkdirSync(dirForFile, { recursive: true });
    
    // 写入文件
    fs.writeFileSync(filePath, finalBuffer);
    
    // 创建附件记录
    const isTemporary = !postId;
    const attachment = await Attachment.create({
      PostID: postId || null,
      UserID: req.user.id,
      OriginalName: originalname, // 保持原始文件名
      StoredName: storedKey,
      MimeType: finalMimeType,
      FileSize: finalSize,
      Description: description || (compress && mimetype.startsWith('image/') ? '已自动压缩' : ''),
      FileHash: computedHash,
      StoragePath: filePath,
      IsTemporary: !!isTemporary,
      TempKey: isTemporary ? (editorToken || null) : null,
      RefCount: 0,
      IsDeleted: false,
      IsExternal: false,
      ExternalURL: null
    });
    
    res.status(201).json({ 
      code: 0, 
      message: '上传成功', 
      data: {
        ...attachment.toJSON(),
        compressionInfo: compress && mimetype.startsWith('image/') ? {
          originalSize: size,
          compressedSize: finalSize,
          compressionRatio: ((size - finalSize) / size * 100).toFixed(2) + '%'
        } : null
      }
    });
  } catch (err) {
    res.status(500).json({ code: 1, message: '服务器错误', error: err.message });
  }
};

// 判断同一 Post 内是否已存在指定 FileHash 的附件
exports.existsByHash = async (req, res) => {
  try {
    const { sha256 } = req.query;
    if (!sha256) return res.status(400).json({ code: 1, message: 'sha256 必填' });
    const existed = await Attachment.findOne({ where: { FileHash: String(sha256).toLowerCase(), IsDeleted: false } });
    if (!existed) return res.json({ code: 0, data: { exists: false } });
    return res.json({ code: 0, data: { exists: true, attachment: existed } });
  } catch (err) {
    res.status(500).json({ code: 1, message: '服务器错误', error: err.message });
  }
};

// 获取附件信息
exports.getAttachment = async (req, res, next) => {
  try {
    const attachment = await Attachment.findByPk(req.params.id, {
      include: [
        { model: User, attributes: ['UserID', 'Username'] },
        { model: Article, attributes: ['PostID', 'Title'] }
      ]
    });
    if (!attachment) throw { code: errorCode.NOT_FOUND.code, message: '附件不存在' };
    res.json(attachment);
  } catch (err) {
    next(err);
  }
};

// 下载附件
exports.downloadAttachment = async (req, res, next) => {
  try {
    const attachment = await Attachment.findByPk(req.params.id);
    if (!attachment) throw { code: errorCode.NOT_FOUND.code, message: '附件不存在' };
    const downloadRootEnv = process.env.UPLOAD_IMAGES_PATH || process.env.UPLOAD_PATH || 'uploads';
    const downloadRootDir = path.isAbsolute(downloadRootEnv)
      ? downloadRootEnv
      : path.resolve(__dirname, '..', downloadRootEnv);
    const filePath = path.join(downloadRootDir, ...String(attachment.StoredName).split('/'));
    if (!fs.existsSync(filePath)) throw { code: errorCode.NOT_FOUND.code, message: '文件不存在' };
    res.download(filePath, attachment.OriginalName);
  } catch (err) {
    next(err);
  }
};

// 删除附件
exports.deleteAttachment = async (req, res, next) => {
  try {
    const attachment = await Attachment.findByPk(req.params.id);
    if (!attachment) throw { code: errorCode.NOT_FOUND.code, message: '附件不存在' };
    if (attachment.UserID !== req.user.id && !req.user.roles.includes('admin')) throw { code: errorCode.PERMISSION_DENIED.code, message: errorCode.PERMISSION_DENIED.message };
    const deleteRootEnv = process.env.UPLOAD_IMAGES_PATH || process.env.UPLOAD_PATH || 'uploads';
    const deleteRootDir = path.isAbsolute(deleteRootEnv)
      ? deleteRootEnv
      : path.resolve(__dirname, '..', deleteRootEnv);
    const filePath = path.join(deleteRootDir, ...String(attachment.StoredName).split('/'));
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    await attachment.destroy();
    res.json({ message: '删除成功' });
  } catch (err) {
    next(err);
  }
};

// 获取所有附件（后台管理）
exports.getAllAttachments = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, userId, postId, keyword } = req.query;
    const where = {};
    if (userId) where.UserID = userId;
    if (postId) where.PostID = postId;
    if (keyword) where.OriginalName = { [Op.like]: `%${keyword}%` };
    const { count, rows } = await Attachment.findAndCountAll({
      where,
      include: [
        { model: User, attributes: ['UserID', 'Username', 'DisplayName'] },
        { model: Article, attributes: ['PostID', 'Title'] }
      ],
      order: [['UploadedAt', 'DESC']],
      offset: (page - 1) * pageSize,
      limit: Number(pageSize)
    });
    res.json({ code: 0, data: { list: rows, total: count, page: Number(page), pageSize: Number(pageSize) } });
  } catch (err) {
    res.status(500).json({ code: 1, message: '服务器错误', error: err.message });
  }
};

// 批量删除附件
exports.batchDeleteAttachments = async (req, res) => {
  try {
    const { attachmentIds } = req.body;
    if (!Array.isArray(attachmentIds) || attachmentIds.length === 0) {
      return res.status(400).json({ code: 1, message: '请选择要删除的附件' });
    }

    const attachments = await Attachment.findAll({
      where: { AttachmentID: attachmentIds },
      include: [{ model: User, attributes: ['UserID', 'Username'] }]
    });

    // 检查权限（只有管理员或附件上传者可以删除）
    for (const attachment of attachments) {
      if (attachment.UserID !== req.user.id && !req.user.roles.includes('admin')) {
        return res.status(403).json({ code: 1, message: '权限不足，无法删除他人附件' });
      }
    }

    // 删除文件
    for (const attachment of attachments) {
      const batchDeleteRootEnv = process.env.UPLOAD_IMAGES_PATH || process.env.UPLOAD_PATH || 'uploads';
      const batchDeleteRootDir = path.isAbsolute(batchDeleteRootEnv)
        ? batchDeleteRootEnv
        : path.resolve(__dirname, '..', batchDeleteRootEnv);
      const filePath = path.join(batchDeleteRootDir, ...String(attachment.StoredName).split('/'));
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // 删除数据库记录
    await Attachment.destroy({ where: { AttachmentID: attachmentIds } });

    res.json({ code: 0, message: `成功删除 ${attachments.length} 个附件` });
  } catch (err) {
    res.status(500).json({ code: 1, message: '服务器错误', error: err.message });
  }
};

// 获取文件分类统计
exports.getAttachmentCategories = async (req, res) => {
  try {
    const attachments = await Attachment.findAll({
      attributes: ['MimeType', 'FileSize'],
      include: [{ model: User, attributes: ['UserID'] }]
    });

    // 按文件类型分类统计
    const categories = {};
    let totalSize = 0;

    attachments.forEach(attachment => {
      const mimeType = attachment.MimeType;
      const fileSize = attachment.FileSize || 0;

      if (!categories[mimeType]) {
        categories[mimeType] = {
          count: 0,
          totalSize: 0,
          type: mimeType
        };
      }

      categories[mimeType].count++;
      categories[mimeType].totalSize += fileSize;
      totalSize += fileSize;
    });

    const categoryList = Object.values(categories).map(cat => ({
      ...cat,
      percentage: totalSize > 0 ? ((cat.totalSize / totalSize) * 100).toFixed(2) : 0
    }));

    res.json({
      code: 0,
      data: {
        categories: categoryList,
        totalFiles: attachments.length,
        totalSize: totalSize
      }
    });
  } catch (err) {
    res.status(500).json({ code: 1, message: '服务器错误', error: err.message });
  }
};

// 获取文件预览信息
exports.getAttachmentPreview = async (req, res) => {
  try {
    const attachment = await Attachment.findByPk(req.params.id, {
      include: [
        { model: User, attributes: ['UserID', 'Username', 'DisplayName'] },
        { model: Article, attributes: ['PostID', 'Title'] }
      ]
    });

    if (!attachment) {
      return res.status(404).json({ code: 1, message: '附件不存在' });
    }

    const isExternal = !!attachment.IsExternal;
    const previewRootEnv = process.env.UPLOAD_IMAGES_PATH || process.env.UPLOAD_PATH || 'uploads';
    const previewRootDir = path.isAbsolute(previewRootEnv)
      ? previewRootEnv
      : path.resolve(__dirname, '..', previewRootEnv);
    const filePath = isExternal ? null : path.join(previewRootDir, ...String(attachment.StoredName).split('/'));
    const fileExists = isExternal ? true : fs.existsSync(filePath);

    // 判断文件类型是否支持预览
    const mimeType = attachment.MimeType || (isExternal ? 'application/octet-stream' : '');
    const isImage = mimeType.startsWith('image/');
    const isText = mimeType.startsWith('text/') || mimeType.includes('json') || mimeType.includes('xml');
    const isPDF = mimeType === 'application/pdf';

    const previewInfo = {
      attachment,
      fileExists,
      canPreview: isImage || isText || isPDF,
      previewType: isImage ? 'image' : isText ? 'text' : isPDF ? 'pdf' : 'download',
      previewUrl: isExternal ? attachment.ExternalURL : (fileExists ? `/api/attachments/${attachment.AttachmentID}/preview` : null),
      downloadUrl: isExternal ? attachment.ExternalURL : `/api/attachments/${attachment.AttachmentID}/download`
    };

    res.json({ code: 0, data: previewInfo });
  } catch (err) {
    res.status(500).json({ code: 1, message: '服务器错误', error: err.message });
  }
};

// 文件预览（图片、文本、PDF）
exports.previewAttachment = async (req, res) => {
  try {
    const attachment = await Attachment.findByPk(req.params.id);
    if (!attachment) {
      return res.status(404).json({ code: 1, message: '附件不存在' });
    }

    if (attachment.IsExternal && attachment.ExternalURL) {
      // 外链：临时重定向到外部地址（避免代理占带宽）
      return res.redirect(302, attachment.ExternalURL);
    }

    const previewFileRootEnv = process.env.UPLOAD_IMAGES_PATH || process.env.UPLOAD_PATH || 'uploads';
    const previewFileRootDir = path.isAbsolute(previewFileRootEnv)
      ? previewFileRootEnv
      : path.resolve(__dirname, '..', previewFileRootEnv);
    const filePath = path.join(previewFileRootDir, ...String(attachment.StoredName).split('/'));
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ code: 1, message: '文件不存在' });
    }

    const mimeType = attachment.MimeType;

    // 设置响应头
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${attachment.OriginalName}"`);

    // 发送文件
    res.sendFile(filePath);
  } catch (err) {
    res.status(500).json({ code: 1, message: '服务器错误', error: err.message });
  }
};

// 压缩单个文件（图片压缩）
exports.compressFile = async (req, res) => {
  try {
    const attachment = await Attachment.findByPk(req.params.id);
    if (!attachment) {
      return res.status(404).json({ code: 1, message: '附件不存在' });
    }

    const compressReadRootEnv = process.env.UPLOAD_IMAGES_PATH || process.env.UPLOAD_PATH || 'uploads';
    const compressReadRootDir = path.isAbsolute(compressReadRootEnv)
      ? compressReadRootEnv
      : path.resolve(__dirname, '..', compressReadRootEnv);
    const filePath = path.join(compressReadRootDir, ...String(attachment.StoredName).split('/'));
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ code: 1, message: '文件不存在' });
    }

    const mimeType = attachment.MimeType;
    
    // 只支持图片压缩
    if (!mimeType.startsWith('image/')) {
      return res.status(400).json({ code: 1, message: '只支持图片文件压缩' });
    }

    const { quality = 80, width, height } = req.query;
    
    // 生成压缩后的文件名（使用新的命名规则）
    const ext = path.extname(attachment.OriginalName);
    const baseName = path.basename(attachment.OriginalName, ext);
    const toSlug = (name) => String(name).toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9._-]/g, '').slice(0, 60);
    const rand6 = () => Math.random().toString(36).slice(2, 8);
    const pad2 = (n) => (n < 10 ? '0' + n : '' + n);
    const yyyymmddHHMMSS = () => {
      const d = new Date();
      return d.getFullYear().toString() + pad2(d.getMonth() + 1) + pad2(d.getDate()) + pad2(d.getHours()) + pad2(d.getMinutes()) + pad2(d.getSeconds());
    };
    const compressedFileName = `${yyyymmddHHMMSS()}-${rand6()}-${toSlug(baseName)}.jpg`;
    const compressRootEnv = process.env.UPLOAD_IMAGES_PATH || process.env.UPLOAD_PATH || 'uploads';
    const compressRootDir = path.isAbsolute(compressRootEnv)
      ? compressRootEnv
      : path.resolve(__dirname, '..', compressRootEnv);
    if (!fs.existsSync(compressRootDir)) fs.mkdirSync(compressRootDir, { recursive: true });
    const articleIdSegmentForCompressed = String(attachment.PostID || 'unassigned');
    const compressedStoredKey = ['articles', articleIdSegmentForCompressed, compressedFileName].join('/');
    const compressedFilePath = path.join(compressRootDir, ...compressedStoredKey.split('/'));
    const compressedDir = path.dirname(compressedFilePath);
    if (!fs.existsSync(compressedDir)) fs.mkdirSync(compressedDir, { recursive: true });

    // 使用sharp压缩图片
    let sharpInstance = sharp(filePath);
    
    if (width || height) {
      sharpInstance = sharpInstance.resize(parseInt(width), parseInt(height), {
        fit: 'inside',
        withoutEnlargement: true
      });
    }

    await sharpInstance
      .jpeg({ quality: parseInt(quality) })
      .toFile(compressedFilePath);

    // 获取压缩后的文件大小
    const compressedStats = fs.statSync(compressedFilePath);
    const originalSize = attachment.FileSize;
    const compressedSize = compressedStats.size;
    const compressionRatio = ((originalSize - compressedSize) / originalSize * 100).toFixed(2);

    // 创建压缩后的附件记录
    const compressedAttachment = await Attachment.create({
      PostID: attachment.PostID,
      UserID: req.user.id,
      OriginalName: compressedFileName,
      StoredName: compressedStoredKey,
      MimeType: 'image/jpeg',
      FileSize: compressedSize,
      Description: `压缩后的${attachment.OriginalName}（压缩率：${compressionRatio}%）`
    });

    res.json({
      code: 0,
      message: '文件压缩成功',
      data: {
        original: {
          id: attachment.AttachmentID,
          name: attachment.OriginalName,
          size: originalSize
        },
        compressed: {
          id: compressedAttachment.AttachmentID,
          name: compressedFileName,
          size: compressedSize
        },
        compressionRatio: `${compressionRatio}%`
      }
    });
  } catch (err) {
    res.status(500).json({ code: 1, message: '服务器错误', error: err.message });
  }
};

// 批量压缩文件为ZIP
exports.compressFilesToZip = async (req, res) => {
  try {
    const { attachmentIds, zipName } = req.body;
    
    if (!Array.isArray(attachmentIds) || attachmentIds.length === 0) {
      return res.status(400).json({ code: 1, message: '请选择要压缩的文件' });
    }

    const attachments = await Attachment.findAll({
      where: { AttachmentID: attachmentIds },
      include: [{ model: User, attributes: ['UserID', 'Username'] }]
    });

    if (attachments.length === 0) {
      return res.status(404).json({ code: 1, message: '未找到指定文件' });
    }

    // 生成ZIP文件名
    const zipFileName = zipName ? `${zipName}.zip` : `attachments_${Date.now()}.zip`;
    const zipRootEnv = process.env.UPLOAD_IMAGES_PATH || process.env.UPLOAD_PATH || 'uploads';
    const zipRootDir = path.isAbsolute(zipRootEnv)
      ? zipRootEnv
      : path.resolve(__dirname, '..', zipRootEnv);
    if (!fs.existsSync(zipRootDir)) fs.mkdirSync(zipRootDir, { recursive: true });
    const zipFilePath = path.join(zipRootDir, zipFileName);

    // 创建ZIP文件
    const output = fs.createWriteStream(zipFilePath);
    const archive = archiver('zip', {
      zlib: { level: 9 } // 最高压缩级别
    });

    output.on('close', async () => {
      // 获取ZIP文件大小
      const zipStats = fs.statSync(zipFilePath);
      
      // 创建ZIP附件记录
      const zipAttachment = await Attachment.create({
        PostID: attachments[0].PostID, // 使用第一个文件的文章ID
        UserID: req.user.id,
        OriginalName: zipFileName,
        StoredName: zipFileName,
        MimeType: 'application/zip',
        FileSize: zipStats.size,
        Description: `包含 ${attachments.length} 个文件的压缩包`
      });

      res.json({
        code: 0,
        message: '文件压缩成功',
        data: {
          zipFile: {
            id: zipAttachment.AttachmentID,
            name: zipFileName,
            size: zipStats.size,
            downloadUrl: `/api/attachments/${zipAttachment.AttachmentID}/download`
          },
          fileCount: attachments.length
        }
      });
    });

    archive.on('error', (err) => {
      res.status(500).json({ code: 1, message: '压缩失败', error: err.message });
    });

    archive.pipe(output);

    // 添加文件到ZIP
    for (const attachment of attachments) {
      const zipAddRootEnv = process.env.UPLOAD_IMAGES_PATH || process.env.UPLOAD_PATH || 'uploads';
      const zipAddRootDir = path.isAbsolute(zipAddRootEnv)
        ? zipAddRootEnv
        : path.resolve(__dirname, '..', zipAddRootEnv);
      const filePath = path.join(zipAddRootDir, ...String(attachment.StoredName).split('/'));
      if (fs.existsSync(filePath)) {
        archive.file(filePath, { name: attachment.OriginalName });
      }
    }

    await archive.finalize();
  } catch (err) {
    res.status(500).json({ code: 1, message: '服务器错误', error: err.message });
  }
};

// 获取文件压缩建议
exports.getCompressionSuggestions = async (req, res) => {
  try {
    const attachment = await Attachment.findByPk(req.params.id);
    if (!attachment) {
      return res.status(404).json({ code: 1, message: '附件不存在' });
    }

    const mimeType = attachment.MimeType;
    const fileSize = attachment.FileSize;
    
    const suggestions = {
      canCompress: false,
      suggestions: [],
      estimatedSavings: 0
    };

    // 检查是否支持压缩
    if (mimeType.startsWith('image/')) {
      suggestions.canCompress = true;
      suggestions.suggestions.push('图片文件，建议压缩质量设置为80%');
      
      if (fileSize > 1024 * 1024) { // 大于1MB
        suggestions.suggestions.push('文件较大，建议同时调整尺寸');
        suggestions.estimatedSavings = Math.round(fileSize * 0.6); // 预估节省60%
      } else {
        suggestions.estimatedSavings = Math.round(fileSize * 0.3); // 预估节省30%
      }
    } else if (mimeType.includes('document') || mimeType.includes('text')) {
      suggestions.canCompress = true;
      suggestions.suggestions.push('文档文件，建议打包为ZIP压缩');
      suggestions.estimatedSavings = Math.round(fileSize * 0.2); // 预估节省20%
    } else {
      suggestions.suggestions.push('此文件类型不支持压缩');
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
    res.status(500).json({ code: 1, message: '服务器错误', error: err.message });
  }
}; 