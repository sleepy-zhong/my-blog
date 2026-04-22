const fs = require('fs');
const path = require('path');
const { Op } = require('sequelize');
const { HomeCat, User, sequelize } = require('../models');
const errorCode = require('../middleware/errorCode');

const ALLOWED_IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml'
]);

function getUploadRootDir() {
  const rootEnv = process.env.UPLOAD_PATH || 'uploads';
  return path.isAbsolute(rootEnv)
    ? rootEnv
    : path.resolve(__dirname, '..', rootEnv);
}

function ensureDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function normalizeBoolean(value, defaultValue = false) {
  if (value === undefined || value === null || value === '') return defaultValue;
  if (typeof value === 'boolean') return value;
  return String(value).toLowerCase() === 'true';
}

function toSlug(name) {
  return String(name || 'cat')
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9._-]/g, '')
    .slice(0, 60) || 'cat';
}

function createFileTimestamp() {
  const date = new Date();
  const pad = (value) => String(value).padStart(2, '0');
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds())
  ].join('');
}

function createRandomSuffix() {
  return Math.random().toString(36).slice(2, 8);
}

function buildStoredFileName(originalName, mimeType) {
  const originalExt = path.extname(originalName || '');
  const originalBase = path.basename(originalName || 'cat', originalExt);
  const extFromMime = mimeType && mimeType.includes('/')
    ? `.${mimeType.split('/')[1].toLowerCase().replace('svg+xml', 'svg')}`
    : (originalExt || '.png');
  return `${createFileTimestamp()}-${createRandomSuffix()}-${toSlug(originalBase)}${extFromMime}`;
}

function isManagedHomeCatUrl(imageUrl) {
  return /^\/uploads\/home-cats\//.test(String(imageUrl || ''));
}

function resolveManagedFilePath(imageUrl) {
  if (!isManagedHomeCatUrl(imageUrl)) {
    return null;
  }
  const relativePath = String(imageUrl).replace(/^\/uploads\//, '');
  return path.join(getUploadRootDir(), ...relativePath.split('/'));
}

async function cleanupManagedImage(imageUrl, excludeId = null) {
  if (!isManagedHomeCatUrl(imageUrl)) {
    return;
  }

  const where = { ImageURL: imageUrl };
  if (excludeId) {
    where.HomeCatID = { [Op.ne]: excludeId };
  }

  const count = await HomeCat.count({ where });
  if (count > 0) {
    return;
  }

  const filePath = resolveManagedFilePath(imageUrl);
  if (filePath && fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

function sanitizePayload(payload = {}) {
  const imageUrlRaw = String(payload.imageUrl ?? payload.ImageURL ?? '');
  const name = String(payload.name ?? payload.Name ?? '').trim();
  const label = String(payload.label ?? payload.Label ?? '').trim() || name;
  const speechText = String(payload.speechText ?? payload.SpeechText ?? '').trim();
  const imageUrl = imageUrlRaw.replace(/\s+/g, '').trim();
  const sortOrderRaw = payload.sortOrder ?? payload.SortOrder;
  const sortOrder = Number.isFinite(Number(sortOrderRaw)) ? Number(sortOrderRaw) : 0;
  const isActive = normalizeBoolean(payload.isActive ?? payload.IsActive, true);
  const isFeatured = normalizeBoolean(payload.isFeatured ?? payload.IsFeatured, false);

  return {
    name,
    label,
    speechText,
    imageUrl,
    sortOrder,
    isActive,
    isFeatured
  };
}

function normalizeImageUrl(imageUrl) {
  return String(imageUrl || '')
    .replace(/\s+/g, '')
    .trim();
}

function validatePayload(payload, { requireImage = true } = {}) {
  if (!payload.name) {
    const err = new Error('猫猫名称不能为空');
    err.status = 400;
    err.code = errorCode.VALIDATION_ERROR.code;
    throw err;
  }

  if (!payload.label) {
    const err = new Error('首页展示名称不能为空');
    err.status = 400;
    err.code = errorCode.VALIDATION_ERROR.code;
    throw err;
  }

  if (!payload.speechText) {
    const err = new Error('猫猫有话说文案不能为空');
    err.status = 400;
    err.code = errorCode.VALIDATION_ERROR.code;
    throw err;
  }

  if (requireImage && !payload.imageUrl) {
    const err = new Error('猫猫图片不能为空');
    err.status = 400;
    err.code = errorCode.VALIDATION_ERROR.code;
    throw err;
  }
}

function normalizePublicItem(item) {
  return {
    id: `home-cat-${item.HomeCatID}`,
    homeCatId: item.HomeCatID,
    name: item.Name,
    label: item.Label,
    speechText: item.SpeechText,
    imageUrl: normalizeImageUrl(item.ImageURL),
    sortOrder: item.SortOrder,
    isActive: item.IsActive,
    isFeatured: item.IsFeatured
  };
}

function assertImageFile(file) {
  const maxFileSize = Number(process.env.MAX_FILE_SIZE || 10 * 1024 * 1024);

  if (!file) {
    const err = new Error('请先选择猫猫图片');
    err.status = 400;
    err.code = errorCode.VALIDATION_ERROR.code;
    throw err;
  }

  if (file.size > maxFileSize) {
    const err = new Error(`图片大小不能超过 ${Math.floor(maxFileSize / 1024 / 1024)}MB`);
    err.status = 400;
    err.code = errorCode.VALIDATION_ERROR.code;
    throw err;
  }

  if (!ALLOWED_IMAGE_MIME_TYPES.has(file.mimetype)) {
    const err = new Error('仅支持 jpg/png/gif/webp/svg 图片');
    err.status = 400;
    err.code = errorCode.VALIDATION_ERROR.code;
    throw err;
  }
}

exports.getPublicHomeCats = async (_req, res, next) => {
  try {
    const list = await HomeCat.findAll({
      where: { IsActive: true },
      order: [['IsFeatured', 'DESC'], ['SortOrder', 'ASC'], ['HomeCatID', 'ASC']]
    });

    res.success(list.map(normalizePublicItem), '获取首页猫猫成功');
  } catch (error) {
    next(error);
  }
};

exports.getHomeCats = async (_req, res, next) => {
  try {
    const list = await HomeCat.findAll({
      include: [
        {
          model: User,
          as: 'Creator',
          attributes: ['UserID', 'Username', 'DisplayName']
        }
      ],
      order: [['IsFeatured', 'DESC'], ['SortOrder', 'ASC'], ['HomeCatID', 'ASC']]
    });

    res.success(list, '获取首页猫猫成功');
  } catch (error) {
    next(error);
  }
};

exports.createHomeCat = async (req, res, next) => {
  const payload = sanitizePayload(req.body);

  try {
    validatePayload(payload);

    const created = await sequelize.transaction(async (transaction) => {
      if (payload.isFeatured) {
        await HomeCat.update(
          { IsFeatured: false, UpdatedAt: new Date() },
          { where: { IsFeatured: true }, transaction }
        );
      }

      return HomeCat.create({
        Name: payload.name,
        Label: payload.label,
        SpeechText: payload.speechText,
        ImageURL: payload.imageUrl,
        SortOrder: payload.sortOrder,
        IsActive: payload.isActive,
        IsFeatured: payload.isFeatured,
        CreatedBy: req.user.id,
        UpdatedAt: new Date()
      }, { transaction });
    });

    res.status(201).json({
      code: 0,
      message: '新增首页猫猫成功',
      data: created
    });
  } catch (error) {
    next(error);
  }
};

exports.updateHomeCat = async (req, res, next) => {
  const payload = sanitizePayload(req.body);

  try {
    validatePayload(payload);

    const homeCat = await HomeCat.findByPk(req.params.id);
    if (!homeCat) {
      return res.status(404).json({
        code: errorCode.NOT_FOUND.code,
        message: '首页猫猫不存在'
      });
    }

    const previousImageUrl = homeCat.ImageURL;

    await sequelize.transaction(async (transaction) => {
      if (payload.isFeatured) {
        await HomeCat.update(
          { IsFeatured: false, UpdatedAt: new Date() },
          {
            where: {
              IsFeatured: true,
              HomeCatID: { [Op.ne]: homeCat.HomeCatID }
            },
            transaction
          }
        );
      }

      await homeCat.update({
        Name: payload.name,
        Label: payload.label,
        SpeechText: payload.speechText,
        ImageURL: payload.imageUrl,
        SortOrder: payload.sortOrder,
        IsActive: payload.isActive,
        IsFeatured: payload.isFeatured,
        UpdatedAt: new Date()
      }, { transaction });
    });

    if (previousImageUrl !== payload.imageUrl) {
      await cleanupManagedImage(previousImageUrl, homeCat.HomeCatID);
    }

    res.success(homeCat, '更新首页猫猫成功');
  } catch (error) {
    next(error);
  }
};

exports.deleteHomeCat = async (req, res, next) => {
  try {
    const homeCat = await HomeCat.findByPk(req.params.id);
    if (!homeCat) {
      return res.status(404).json({
        code: errorCode.NOT_FOUND.code,
        message: '首页猫猫不存在'
      });
    }

    const imageUrl = homeCat.ImageURL;
    await homeCat.destroy();
    await cleanupManagedImage(imageUrl);

    res.success({ id: Number(req.params.id) }, '删除首页猫猫成功');
  } catch (error) {
    next(error);
  }
};

exports.updateHomeCatStatus = async (req, res, next) => {
  try {
    const homeCat = await HomeCat.findByPk(req.params.id);
    if (!homeCat) {
      return res.status(404).json({
        code: errorCode.NOT_FOUND.code,
        message: '首页猫猫不存在'
      });
    }

    await homeCat.update({
      IsActive: normalizeBoolean(req.body.isActive ?? req.body.IsActive, homeCat.IsActive),
      UpdatedAt: new Date()
    });

    res.success(homeCat, '更新猫猫状态成功');
  } catch (error) {
    next(error);
  }
};

exports.sortHomeCats = async (req, res, next) => {
  try {
    const items = Array.isArray(req.body.items) ? req.body.items : [];
    if (!items.length) {
      return res.status(400).json({
        code: errorCode.VALIDATION_ERROR.code,
        message: '排序数据不能为空'
      });
    }

    await sequelize.transaction(async (transaction) => {
      for (const item of items) {
        const id = Number(item.id ?? item.HomeCatID);
        const sortOrder = Number(item.sortOrder ?? item.SortOrder);
        if (!Number.isInteger(id) || Number.isNaN(sortOrder)) {
          const err = new Error('排序参数不合法');
          err.status = 400;
          err.code = errorCode.VALIDATION_ERROR.code;
          throw err;
        }

        await HomeCat.update(
          { SortOrder: sortOrder, UpdatedAt: new Date() },
          { where: { HomeCatID: id }, transaction }
        );
      }
    });

    res.success(null, '更新猫猫排序成功');
  } catch (error) {
    next(error);
  }
};

exports.uploadHomeCatImage = async (req, res, next) => {
  try {
    assertImageFile(req.file);

    const uploadDir = path.join(getUploadRootDir(), 'home-cats');
    ensureDirectory(uploadDir);

    const storedFileName = buildStoredFileName(req.file.originalname, req.file.mimetype);
    const filePath = path.join(uploadDir, storedFileName);
    fs.writeFileSync(filePath, req.file.buffer);

    res.status(201).json({
      code: 0,
      message: '上传猫猫图片成功',
      data: {
        imageUrl: `/uploads/home-cats/${storedFileName}`,
        fileName: storedFileName,
        originalName: req.file.originalname,
        size: req.file.size,
        mimeType: req.file.mimetype
      }
    });
  } catch (error) {
    next(error);
  }
};
