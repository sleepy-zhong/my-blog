const { Article, User, PostRevision, Category, Tag, PostCategory, PostTag, OperationLog } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const errorCode = require('../middleware/errorCode');
const {
  CACHE_METRIC_KEYS,
  incrementCacheMetric,
  setCacheActivity,
} = require('../middleware/redis');
const { envFlagEnabled } = require('../middleware/featureFlag');
const redisClient = require('../config/redis');
const {
  PUBLIC_ARTICLE_DETAIL_CACHE_TTL_SECONDS,
  buildPublicArticleDetailCacheKey,
} = require('../utils/publicCache');
const fs = require('fs');
const path = require('path');
const mammoth = require('mammoth');
const { v4: uuidv4 } = require('uuid');
const cheerio = require('cheerio');
const pdfParse = require('pdf-parse');
const url = require('url');
const marked = require('marked');

// 将内容中的 data:image 内联图片提取、写入磁盘 images 目录，并替换为 /uploads/images/xxx
function persistDataUriImagesToImagesDir(input) {
  try {
    if (typeof input !== 'string' || !/data:image\//i.test(input)) return { content: input, images: [] };
    const uploadRootEnv = process.env.UPLOAD_PATH || 'uploads';
    const imagesPathEnv = process.env.UPLOAD_IMAGES_PATH || path.join(uploadRootEnv, 'images');
    const imageDir = path.isAbsolute(imagesPathEnv)
      ? imagesPathEnv
      : path.resolve(__dirname, '..', imagesPathEnv);
    if (!fs.existsSync(imageDir)) fs.mkdirSync(imageDir, { recursive: true });

    const savedImages = [];

    // Markdown: ![alt](data:image/png;base64,...)
    const mdPattern = /(\!\[[^\]]*\]\()data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=\s]+)(\))/g;
    let out = input.replace(mdPattern, (match, p1, mime, b64, p4) => {
      try {
        const ext = (mime.split('/')[1] || 'png').toLowerCase();
        const filename = uuidv4() + '.' + ext;
        const filepath = path.join(imageDir, filename);
        const cleanBase64 = String(b64).replace(/\s+/g, '');
        const buffer = Buffer.from(cleanBase64, 'base64');
        fs.writeFileSync(filepath, buffer);
        const urlPath = `/uploads/images/${filename}`;
        savedImages.push(urlPath);
        return `${p1}${urlPath}${p4}`;
      } catch (_) {
        return match;
      }
    });

    // HTML: <img src="data:image/png;base64,..." ...>
    const htmlPattern = /(<img[^>]+src=["'])data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=\s]+)(["'][^>]*>)/gi;
    out = out.replace(htmlPattern, (match, p1, mime, b64, p4) => {
      try {
        const ext = (mime.split('/')[1] || 'png').toLowerCase();
        const filename = uuidv4() + '.' + ext;
        const filepath = path.join(imageDir, filename);
        const cleanBase64 = String(b64).replace(/\s+/g, '');
        const buffer = Buffer.from(cleanBase64, 'base64');
        fs.writeFileSync(filepath, buffer);
        const urlPath = `/uploads/images/${filename}`;
        savedImages.push(urlPath);
        return `${p1}${urlPath}${p4}`;
      } catch (_) {
        return match;
      }
    });

    return { content: out, images: savedImages };
  } catch (_) {
    return { content: input, images: [] };
  }
}

function allowInlineArticleDataUri() {
  return envFlagEnabled('ALLOW_DATA_URI_IN_ARTICLE', process.env.NODE_ENV !== 'production')
}

function extractAttachmentRefsFromContent(content) {
  try {
    if (typeof content !== 'string' || !content) return { ids: [], names: [], idCount: new Map(), nameCount: new Map() };
    const ids = [];
    const names = [];
    const idCount = new Map();
    const nameCount = new Map();
    // /api/attachments/{id}/preview 或 /download
    const idRegex = /\/api\/attachments\/(\d+)\/(?:preview|download)/gi;
    let m;
    while ((m = idRegex.exec(content)) !== null) {
      const id = parseInt(m[1], 10);
      if (!isNaN(id)) {
        ids.push(id);
        idCount.set(id, (idCount.get(id) || 0) + 1);
      }
    }
    // /uploads/{storedPath} - 支持子目录结构 articles/{postId}/{filename}
    const uploadRegex = /\/(?:uploads)\/([^\s)"']+)/gi;
    while ((m = uploadRegex.exec(content)) !== null) {
      const storedPath = m[1];
      if (storedPath) {
        names.push(storedPath);
        nameCount.set(storedPath, (nameCount.get(storedPath) || 0) + 1);
      }
    }
    return { ids, names, idCount, nameCount };
  } catch (_) {
    return { ids: [], names: [], idCount: new Map(), nameCount: new Map() };
  }
}

async function syncArticleAttachments({ sequelize, t, articleId, content, editorToken, userId }) {
  const { Attachment } = require('../models');
  const { ids, names, idCount, nameCount } = extractAttachmentRefsFromContent(content || '');
  const referenced = await Attachment.findAll({
    where: {
      [Op.or]: [
        ids.length ? { AttachmentID: ids } : null,
        names.length ? { StoredName: names } : null,
        editorToken ? { TempKey: editorToken, IsTemporary: true, UserID: userId } : null
      ].filter(Boolean)
    },
    transaction: t
  });

  // Compute refcount for each
  for (const att of referenced) {
    const count = att.AttachmentID && idCount.get(att.AttachmentID)
      ? idCount.get(att.AttachmentID)
      : (att.StoredName && nameCount.get(att.StoredName)) || 1;
    att.PostID = articleId;
    att.IsTemporary = false;
    att.TempKey = null;
    att.RefCount = count || 1;
    await att.save({ transaction: t });
  }

  // Soft-delete attachments previously bound to this article but no longer referenced
  const stillIds = new Set(referenced.map(a => a.AttachmentID));
  const existingBound = await Attachment.findAll({ where: { PostID: articleId }, transaction: t });
  for (const att of existingBound) {
    if (!stillIds.has(att.AttachmentID)) {
      att.RefCount = 0;
      att.IsDeleted = true;
      att.DeletedAt = new Date();
      await att.save({ transaction: t });
    }
  }
}

// 创建文章
exports.createArticle = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ code: 1, message: '参数错误', errors: errors.array() });
  try {
    // 鉴权校验（避免未登录时报 500）
    if (!req.user || !req.user.id) {
      return res.status(401).json({ code: 1, message: '未登录或登录已过期' });
    }

    const { title, content, slug, excerpt, status, categoryIds = [], tagIds = [], featuredImageURL } = req.body;

    const allowDataUri = allowInlineArticleDataUri();
    if (!allowDataUri && typeof content === 'string' && /data:image\//i.test(content)) {
      return res.status(400).json({ code: 1, message: '不允许直接提交 data:image；请先通过附件接口上传并替换为 /api/attachments/{id}/preview' });
    }

    let processedContent = content;
    if (typeof content === 'string' && allowDataUri && /data:image\//i.test(content)) {
      const persisted = persistDataUriImagesToImagesDir(content);
      processedContent = persisted.content;
    }
    const normalizedContent = typeof processedContent === 'string' ? normalizeMarkdownUploadsPath(processedContent) : processedContent;

    const { sequelize } = require('../models');
    const t = await sequelize.transaction();
    try {
      const article = await Article.create({
        UserID: req.user.id,
        Title: title,
        Content: normalizedContent,
        Slug: slug,
        Excerpt: excerpt,
        Status: status || 'draft',
        FeaturedImageURL: featuredImageURL
      }, { transaction: t });
      // 同步附件引用（绑定临时附件并清理未引用）
      const editorToken = req.headers['x-editor-token'] || req.body.editorToken || null;
      await syncArticleAttachments({ sequelize, t, articleId: article.PostID, content: normalizedContent, editorToken, userId: req.user.id });
      if (categoryIds.length) await article.setCategories(categoryIds, { transaction: t });
      if (tagIds.length) await article.setTags(tagIds, { transaction: t });
      await PostRevision.create({
        PostID: article.PostID,
        UserID: req.user.id,
        Title: title,
        Content: normalizedContent,
        Excerpt: excerpt,
        RevisionType: 'initial'
      }, { transaction: t });
      await OperationLog.create({
        UserID: req.user.id,
        OperationType: 'create',
        TargetType: 'post',
        TargetID: article.PostID,
        Details: JSON.stringify(article),
        IPAddress: req.ip,
        UserAgent: req.headers['user-agent']
      }, { transaction: t });
      await t.commit();
      res.status(201).json({ code: 0, message: '创建成功', data: article });
    } catch (err) {
      await t.rollback();
      throw err;
    }
  } catch (err) {
    if (err && err.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ code: 1, message: 'Slug 已存在', error: err.message });
    }
    res.status(500).json({ code: 1, message: '服务器错误', error: err.message });
  }
};

// 将 Markdown 中以 /uploads 开头的相对资源补全为绝对 URL（基于 PUBLIC_BASE_URL），避免前端渲染相对路径失效
function normalizeMarkdownUploadsPath(md) {
  try {
    const base = process.env.PUBLIC_BASE_URL || '';
    if (!base) return md;
    const replacer = (match, p1, p2, p3) => {
      const src = p2.trim();
      if (/^\/uploads\//i.test(src)) return `${p1}${base}${src}${p3}`;
      return match;
    };
    let out = md.replace(/(!\[[^\]]*\]\()([^\)]+)(\))/g, replacer);
    out = out.replace(/(<img[^>]+src=["\'])([^"\']+)(["\'])/gi, replacer);
    return out;
  } catch (_) {
    return md;
  }
}

// 获取所有文章
exports.getArticles = async (req, res) => {
  try {
    const { sequelize } = require('../models');
    const {
      page = 1,
      pageSize = 10,
      keyword,
      status = 'published',
      category,
      tag,
      categories,
      tags,
      categoryMode = 'any',
      tagMode = 'any',
      fields,
      include = 'categories,tags,user',
      sort
    } = req.query;

    // 字段白名单（来自模型定义）与 include 白名单
    const allowedFields = Object.keys(Article.rawAttributes || {});
    const allowedIncludes = new Set(['categories', 'tags', 'user']);

    // 字段投影（未传 fields 时默认排除大字段，传了则按需返回）
    let attributesOption;
    if (typeof fields !== 'undefined' && String(fields).trim() !== '') {
      const requestedFieldsRaw = String(fields).split(',').map(s => s.trim()).filter(Boolean);
      const invalidFields = requestedFieldsRaw.filter(f => !allowedFields.includes(f));
      if (invalidFields.length) {
        return res.status(400).json({
          code: 1,
          message: '无效的字段参数',
          error: `以下字段不被允许: ${invalidFields.join(', ')}`,
          allowedFields
        });
      }
      const requestedFields = requestedFieldsRaw.slice();
      if (!requestedFields.includes('PostID')) requestedFields.push('PostID');
      attributesOption = requestedFields;
    } else {
      // 默认投影：排除大字段，保留核心信息
      attributesOption = [
        'PostID', 'Title', 'Excerpt', 'Slug', 'Status', 'FeaturedImageURL',
        'PublishedAt', 'CreatedAt', 'UpdatedAt', 'ViewCount', 'UserID'
      ];
    }

    // 兼容旧的单值过滤
    const categoryIds = categories ? String(categories).split(',').map(s => parseInt(s, 10)).filter(n => !isNaN(n))
                                   : (category ? [parseInt(category, 10)].filter(n => !isNaN(n)) : []);
    const tagIds = tags ? String(tags).split(',').map(s => parseInt(s, 10)).filter(n => !isNaN(n))
                         : (tag ? [parseInt(tag, 10)].filter(n => !isNaN(n)) : []);

    // 构建 where 条件
    const where = {};
    if (status) where.Status = status;
    if (keyword) {
      where[Op.or] = [
        { Title: { [Op.like]: `%${keyword}%` } },
        { Excerpt: { [Op.like]: `%${keyword}%` } },
        { Content: { [Op.like]: `%${keyword}%` } }
      ];
    }

    // 子查询筛选（ANY/ALL）
    const andLiterals = [];
    if (categoryIds.length) {
      if (categoryMode === 'all') {
        andLiterals.push(`\`Article\`.\`PostID\` IN (SELECT pc.PostID FROM postcategories pc WHERE pc.CategoryID IN (${categoryIds.join(',')}) GROUP BY pc.PostID HAVING COUNT(DISTINCT pc.CategoryID) = ${categoryIds.length})`);
      } else {
        andLiterals.push(`\`Article\`.\`PostID\` IN (SELECT pc.PostID FROM postcategories pc WHERE pc.CategoryID IN (${categoryIds.join(',')}))`);
      }
    }
    if (tagIds.length) {
      if (tagMode === 'all') {
        andLiterals.push(`\`Article\`.\`PostID\` IN (SELECT pt.PostID FROM posttags pt WHERE pt.TagID IN (${tagIds.join(',')}) GROUP BY pt.PostID HAVING COUNT(DISTINCT pt.TagID) = ${tagIds.length})`);
      } else {
        andLiterals.push(`\`Article\`.\`PostID\` IN (SELECT pt.PostID FROM posttags pt WHERE pt.TagID IN (${tagIds.join(',')}))`);
      }
    }

    // include 解析与校验
    const includeSet = new Set(String(include || '').split(',').map(s => s.trim()).filter(Boolean));
    const invalidIncludes = Array.from(includeSet).filter(i => !allowedIncludes.has(i));
    if (invalidIncludes.length) {
      return res.status(400).json({
        code: 1,
        message: '无效的 include 参数',
        error: `以下 include 不被允许: ${invalidIncludes.join(', ')}`,
        allowedIncludes: Array.from(allowedIncludes)
      });
    }
    const includeList = [];
    if (includeSet.has('user')) {
      includeList.push({ model: User, attributes: ['UserID', 'Username', 'DisplayName', 'AvatarURL'] });
    }
    if (includeSet.has('categories')) {
      includeList.push({ model: Category, through: { attributes: [] } });
    }
    if (includeSet.has('tags')) {
      includeList.push({ model: Tag, through: { attributes: [] } });
    }

    // 排序
    let order = [];
    if (sort) {
      const parts = String(sort).split(',').map(s => s.trim()).filter(Boolean);
      order = parts.map(p => {
        const [col, dirRaw] = p.split(':');
        const dir = (dirRaw || 'desc').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
        return [col, dir];
      });
    } else {
      order = [['PublishedAt', 'DESC'], ['CreatedAt', 'DESC']];
    }

    // 若指定了字段投影，但排序列未包含在投影中，追加这些排序列以避免子查询缺列导致的 ORDER BY 报错
    if (Array.isArray(attributesOption) && Array.isArray(order)) {
      const orderedColumns = order
        .map(item => (Array.isArray(item) && typeof item[0] === 'string' ? item[0] : null))
        .filter(Boolean);
      for (const col of orderedColumns) {
        if (!attributesOption.includes(col)) attributesOption.push(col);
      }
    }

    // 组合 where 子句
    const finalWhere = { ...where };
    if (andLiterals.length) {
      finalWhere[Op.and] = andLiterals.map(lit => sequelize.literal(lit));
    }

    const { count, rows } = await Article.findAndCountAll({
      attributes: attributesOption,
      where: finalWhere,
      include: includeList,
      distinct: true,
      order,
      offset: (page - 1) * pageSize,
      limit: Number(pageSize)
    });

    const list = rows.map(a => a.toJSON());

    res.json({ code: 0, data: { list, total: count, page: Number(page), pageSize: Number(pageSize) } });
  } catch (err) {
    if (err && err.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ code: 1, message: 'Slug 已存在', error: err.message });
    }
    res.status(500).json({ code: 1, message: '服务器错误', error: err.message });
  }
};

// 获取单篇文章（支持 fields 投影和 include 控制）
exports.updateArticle = async (req, res) => {
  try {
    const { sequelize } = require('../models');
    const t = await sequelize.transaction();
    try {
      const article = await Article.findByPk(req.params.id, { transaction: t, lock: t.LOCK.UPDATE });
      if (!article) return res.status(404).json({ code: 1, message: '文章不存在' });
      if (article.UserID !== req.user.id && !req.user.roles.includes('admin')) return res.status(403).json({ code: 1, message: '无权限' });
      const { title, content, excerpt, status, categoryIds = [], tagIds = [] } = req.body;

      const allowDataUri = allowInlineArticleDataUri();
      if (!allowDataUri && typeof content === 'string' && /data:image\//i.test(content)) {
        return res.status(400).json({ code: 1, message: '不允许直接提交 data:image；请先通过附件接口上传并替换为 /api/attachments/{id}/preview' });
      }
      let processedContent = content;
      if (typeof content === 'string' && allowDataUri && /data:image\//i.test(content)) {
        const persisted = persistDataUriImagesToImagesDir(content);
        processedContent = persisted.content;
      }
      const normalizedContent = typeof processedContent === 'string' ? normalizeMarkdownUploadsPath(processedContent) : processedContent;
      await PostRevision.create({
        PostID: article.PostID,
        UserID: req.user.id,
        Title: title || article.Title,
        Content: normalizedContent || article.Content,
        Excerpt: excerpt || article.Excerpt,
        RevisionType: 'update'
      }, { transaction: t });
      article.Title = title || article.Title;
      article.Content = normalizedContent || article.Content;
      article.Excerpt = excerpt || article.Excerpt;
      article.Status = status || article.Status;
      await article.save({ transaction: t });
      // 同步附件引用：更新时不再使用 editorToken 聚合临时附件，避免已从内容中移除的图片被再次绑定
      await syncArticleAttachments({ sequelize, t, articleId: article.PostID, content: normalizedContent || article.Content, editorToken: null, userId: req.user.id });
      if (categoryIds.length) await article.setCategories(categoryIds, { transaction: t });
      if (tagIds.length) await article.setTags(tagIds, { transaction: t });
      await OperationLog.create({
        UserID: req.user.id,
        OperationType: 'update',
        TargetType: 'post',
        TargetID: article.PostID,
        Details: JSON.stringify(article),
        IPAddress: req.ip,
        UserAgent: req.headers['user-agent']
      }, { transaction: t });
      await t.commit();
      res.json({ code: 0, message: '更新成功', data: article });
    } catch (err) {
      await t.rollback();
      throw err;
    }
  } catch (err) {
    res.status(500).json({ code: 1, message: '服务器错误', error: err.message });
  }
};

// 删除文章
exports.deleteArticle = async (req, res) => {
  try {
    const { Attachment } = require('../models');
    const article = await Article.findByPk(req.params.id);
    if (!article) return res.status(404).json({ code: 1, message: '文章不存在' });
    if (article.UserID !== req.user.id && !req.user.roles.includes('admin')) return res.status(403).json({ code: 1, message: '无权限' });
    // 在删除前取出附件以便清理物理文件
    const attachments = await Attachment.findAll({ where: { PostID: article.PostID } });
    await article.destroy();
    // 日志
    await OperationLog.create({
      UserID: req.user.id,
      OperationType: 'delete',
      TargetType: 'post',
      TargetID: article.PostID,
      Details: JSON.stringify(article),
      IPAddress: req.ip,
      UserAgent: req.headers['user-agent']
    });
    // 异步删除物理文件
    (async () => {
      try {
        const uploadRootEnv = process.env.UPLOAD_IMAGES_PATH || process.env.UPLOAD_PATH || 'uploads';
        const uploadRootDir = path.isAbsolute(uploadRootEnv) ? uploadRootEnv : path.resolve(__dirname, '..', uploadRootEnv);
        for (const att of attachments) {
          const filePath = att.StoragePath || path.join(uploadRootDir, att.StoredName);
          try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch (_) {}
        }
      } catch (_) {}
    })();
    res.json({ code: 0, message: '删除成功' });
  } catch (err) {
    res.status(500).json({ code: 1, message: '服务器错误', error: err.message });
  }
};

// 获取文章修订历史
exports.getRevisions = async (req, res, next) => {
  try {
    const article = await Article.findByPk(req.params.id);
    if (!article) throw { code: errorCode.NOT_FOUND.code, message: '文章不存在' };
    if (article.UserID !== req.user.id && !req.user.roles.includes('admin')) {
      throw { code: errorCode.PERMISSION_DENIED.code, message: 'Forbidden' };
    }
    const revisions = await PostRevision.findAll({
      where: { PostID: req.params.id },
      include: [{ model: User, attributes: ['UserID', 'Username'] }],
      order: [['CreatedAt', 'DESC']]
    });
    res.json({ code: 0, data: revisions });
  } catch (err) {
    next(err);
  }
};

// 回滚到历史版本
exports.restoreRevision = async (req, res, next) => {
  try {
    const { id, revisionId } = req.params;
    const article = await Article.findByPk(id);
    if (!article) throw { code: errorCode.NOT_FOUND.code, message: '文章不存在' };
    if (article.UserID !== req.user.id && !req.user.roles.includes('admin')) throw { code: errorCode.PERMISSION_DENIED.code, message: '无权限' };
    
    const revision = await PostRevision.findByPk(revisionId);
    if (!revision || revision.PostID != id) throw { code: errorCode.NOT_FOUND.code, message: '修订版本不存在' };
    
    // 保存当前版本为修订
    await PostRevision.create({
      PostID: article.PostID,
      UserID: req.user.id,
      Title: article.Title,
      Content: article.Content,
      Excerpt: article.Excerpt,
      RevisionType: 'rollback'
    });
    
    // 恢复修订版本
    article.Title = revision.Title;
    article.Content = revision.Content;
    article.Excerpt = revision.Excerpt;
    await article.save();
    
    res.json({ code: 0, message: '回滚成功', data: article });
  } catch (err) {
    next(err);
  }
}; 
// 通过Slug获取文章（支持 fields 投影和 include 控制）
function createArticleControllerError(status, message, data = null, code = 1) {
  return {
    status,
    code,
    message,
    data,
  };
}

function ensureArticleMutationAccess(article, req) {
  if (!article) {
    return createArticleControllerError(404, '?????');
  }

  if (article.UserID !== req.user.id && !req.user.roles.includes('admin')) {
    return createArticleControllerError(403, '???');
  }

  return null;
}

exports.updateArticleStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const article = await Article.findByPk(req.params.id);
    const accessError = ensureArticleMutationAccess(article, req);
    if (accessError) return next(accessError);
    article.Status = status;
    if (status === 'published' && !article.PublishedAt) {
      article.PublishedAt = new Date();
    }
    await article.save();
    res.success(article, '??????');
  } catch (err) {
    next(createArticleControllerError(500, '?????', err.message, errorCode.SYSTEM_ERROR.code));
  }
};

exports.publishArticle = async (req, res, next) => {
  try {
    const article = await Article.findByPk(req.params.id);
    const accessError = ensureArticleMutationAccess(article, req);
    if (accessError) return next(accessError);
    article.Status = 'published';
    article.PublishedAt = new Date();
    await article.save();
    res.success(article, '??????');
  } catch (err) {
    next(createArticleControllerError(500, '?????', err.message, errorCode.SYSTEM_ERROR.code));
  }
};

exports.archiveArticle = async (req, res, next) => {
  try {
    const article = await Article.findByPk(req.params.id);
    const accessError = ensureArticleMutationAccess(article, req);
    if (accessError) return next(accessError);
    article.Status = 'archived';
    await article.save();
    res.success(article, '??????');
  } catch (err) {
    next(createArticleControllerError(500, '?????', err.message, errorCode.SYSTEM_ERROR.code));
  }
};

exports.setFeaturedImage = async (req, res, next) => {
  try {
    const { featuredImageURL } = req.body;
    const article = await Article.findByPk(req.params.id);
    const accessError = ensureArticleMutationAccess(article, req);
    if (accessError) return next(accessError);
    article.FeaturedImageURL = featuredImageURL;
    await article.save();
    res.success(article, '???????');
  } catch (err) {
    next(createArticleControllerError(500, '?????', err.message, errorCode.SYSTEM_ERROR.code));
  }
};

exports.incrementViewCount = async (req, res, next) => {
  try {
    const article = await Article.findByPk(req.params.id);
    if (!article) return next(createArticleControllerError(404, '?????'));
    article.ViewCount = (article.ViewCount || 0) + 1;
    await article.save();
    res.success({ viewCount: article.ViewCount }, '????????');
  } catch (err) {
    next(createArticleControllerError(500, '?????', err.message, errorCode.SYSTEM_ERROR.code));
  }
};

exports.getMyArticles = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, status } = req.query;
    const where = { UserID: req.user.id };
    if (status) where.Status = status;
    const { count, rows } = await Article.findAndCountAll({
      where,
      include: [
        { model: Category, through: { attributes: [] } },
        { model: Tag, through: { attributes: [] } }
      ],
      order: [['CreatedAt', 'DESC']],
      offset: (page - 1) * pageSize,
      limit: Number(pageSize)
    });
    const list = rows.map(a => a.toJSON());
    res.json({ code: 0, data: { list, total: count, page: Number(page), pageSize: Number(pageSize) } });
  } catch (err) {
    res.status(500).json({ code: 1, message: '服务器错误', error: err.message });
  }
};

// 获取草稿箱
exports.getDrafts = async (req, res) => {
  try {
    const { page = 1, pageSize = 10 } = req.query;
    const { count, rows } = await Article.findAndCountAll({
      where: { UserID: req.user.id, Status: 'draft' },
      include: [
        { model: Category, through: { attributes: [] } },
        { model: Tag, through: { attributes: [] } }
      ],
      order: [['CreatedAt', 'DESC']],
      offset: (page - 1) * pageSize,
      limit: Number(pageSize)
    });
    const list = rows.map(a => a.toJSON());
    res.json({ code: 0, data: { list, total: count, page: Number(page), pageSize: Number(pageSize) } });
  } catch (err) {
    res.status(500).json({ code: 1, message: '服务器错误', error: err.message });
  }
};

// 获取已发布文章
exports.getPublishedArticles = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, keyword, category, tag } = req.query;
    const where = { Status: 'published' };
    if (keyword) where.Title = { [Op.like]: `%${keyword}%` };
    const include = [
      { model: User, attributes: ['UserID', 'Username', 'DisplayName', 'AvatarURL'] },
      { model: Category, through: { attributes: [] }, where: category ? { CategoryID: category } : undefined, required: !!category },
      { model: Tag, through: { attributes: [] }, where: tag ? { TagID: tag } : undefined, required: !!tag }
    ];
    const { count, rows } = await Article.findAndCountAll({
      where,
      include,
      order: [['PublishedAt', 'DESC']],
      offset: (page - 1) * pageSize,
      limit: Number(pageSize)
    });
    const list = rows.map(a => a.toJSON());
    res.json({ code: 0, data: { list, total: count, page: Number(page), pageSize: Number(pageSize) } });
  } catch (err) {
    res.status(500).json({ code: 1, message: '服务器错误', error: err.message });
  }
};
// 上传并解析多格式文档为结构化 ContentJSON（将下线）
exports.uploadAndParseArticle = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ code: 1, message: '未上传文件' });
    const { originalname, mimetype, buffer } = req.file;
    let contentJSON = [];
    let images = [];
    if (originalname.endsWith('.docx')) {
      const uploadRootEnv = process.env.UPLOAD_PATH || 'uploads';
      const imagesPathEnv = process.env.UPLOAD_IMAGES_PATH || path.join(uploadRootEnv, 'images');
      const imageDir = path.isAbsolute(imagesPathEnv)
        ? imagesPathEnv
        : path.resolve(__dirname, '..', imagesPathEnv);
      if (!fs.existsSync(imageDir)) fs.mkdirSync(imageDir, { recursive: true });
      const imageHandler = {
        convertImage: mammoth.images.inline(async (image) => {
          const ext = image.contentType.split('/')[1] || 'png';
          const filename = uuidv4() + '.' + ext;
          const filepath = path.join(imageDir, filename);
          const buffer = await image.read();
          fs.writeFileSync(filepath, buffer);
          // 预览URL始终以 /uploads 映射（index.js 静态路由）
          const url = `/uploads/images/${filename}`;
          images.push(url);
          return { src: url };
        })
      };
      const result = await mammoth.convertToHtml({ buffer }, imageHandler);
      const html = result.value;
      contentJSON = htmlToContentJSON(html);
    } else if (originalname.endsWith('.md')) {
      const md = buffer.toString('utf-8');
      const html = marked.parse(md);
      contentJSON = htmlToContentJSON(html);
    } else if (originalname.endsWith('.txt')) {
      const txt = buffer.toString('utf-8');
      contentJSON = plainTextToContentJSON(txt);
    } else if (originalname.endsWith('.html')) {
      const html = buffer.toString('utf-8');
      contentJSON = htmlToContentJSON(html);
    } else if (originalname.endsWith('.pdf')) {
      // PDF 解析
      const data = await pdfParse(buffer);
      const txt = data.text;
      contentJSON = plainTextToContentJSON(txt);
    } else {
      return res.status(400).json({ code: 1, message: '不支持的文件类型' });
    }
    // 该接口即将下线，建议前端/CI 将多格式内容转为 Markdown 并作为 Content 提交
    res.json({ code: 0, data: { contentJSON, images } });
  } catch (err) {
    res.status(500).json({ code: 1, message: '解析失败', error: err.message });
  }
};

// 文章计数（与列表同过滤）
exports.getArticlesCount = async (req, res) => {
  try {
    const { sequelize } = require('../models');
    const {
      keyword,
      status = 'published',
      category,
      tag,
      categories,
      tags,
      categoryMode = 'any',
      tagMode = 'any'
    } = req.query;

    const categoryIds = categories ? String(categories).split(',').map(s => parseInt(s, 10)).filter(n => !isNaN(n))
                                   : (category ? [parseInt(category, 10)].filter(n => !isNaN(n)) : []);
    const tagIds = tags ? String(tags).split(',').map(s => parseInt(s, 10)).filter(n => !isNaN(n))
                         : (tag ? [parseInt(tag, 10)].filter(n => !isNaN(n)) : []);

    const where = {};
    if (status) where.Status = status;
    if (keyword) {
      where[Op.or] = [
        { Title: { [Op.like]: `%${keyword}%` } },
        { Excerpt: { [Op.like]: `%${keyword}%` } },
        { Content: { [Op.like]: `%${keyword}%` } }
      ];
    }
    const andLiterals = [];
    if (categoryIds.length) {
      if (categoryMode === 'all') {
        andLiterals.push(`PostID IN (SELECT pc.PostID FROM postcategories pc WHERE pc.CategoryID IN (${categoryIds.join(',')}) GROUP BY pc.PostID HAVING COUNT(DISTINCT pc.CategoryID) = ${categoryIds.length})`);
      } else {
        andLiterals.push(`PostID IN (SELECT pc.PostID FROM postcategories pc WHERE pc.CategoryID IN (${categoryIds.join(',')}))`);
      }
    }
    if (tagIds.length) {
      if (tagMode === 'all') {
        andLiterals.push(`PostID IN (SELECT pt.PostID FROM posttags pt WHERE pt.TagID IN (${tagIds.join(',')}) GROUP BY pt.PostID HAVING COUNT(DISTINCT pt.TagID) = ${tagIds.length})`);
      } else {
        andLiterals.push(`PostID IN (SELECT pt.PostID FROM posttags pt WHERE pt.TagID IN (${tagIds.join(',')}))`);
      }
    }
    const finalWhere = { ...where };
    if (andLiterals.length) {
      finalWhere[Op.and] = andLiterals.map(lit => sequelize.literal(lit));
    }

    const total = await Article.count({
      where: finalWhere,
      distinct: true,
      col: 'PostID'
    });
    res.json({ code: 0, data: { total } });
  } catch (err) {
    res.status(500).json({ code: 1, message: '服务器错误', error: err.message });
  }
};

// HTML 转结构化 JSON（增强：支持 h1/h2/h3/ul/p，自动识别伪标题）
function htmlToContentJSON(html) {
  const $ = cheerio.load(html);
  const blocks = [];
  let currentList = null;
  // 统计所有 <p> 的 font-size，找出最大/次大字号作为 h1/h2
  const fontSizes = [];
  $('p').each((i, el) => {
    const style = $(el).attr('style') || '';
    const match = style.match(/font-size:\s?(\d+)pt/);
    if (match) fontSizes.push(parseInt(match[1]));
  });
  const uniqSizes = Array.from(new Set(fontSizes)).sort((a, b) => b - a);
  const h1Size = uniqSizes[0] || null;
  const h2Size = uniqSizes[1] || null;
  $('body').children().each((i, el) => {
    const tag = el.tagName.toLowerCase();
    if (/h[1-6]/.test(tag)) {
      if (currentList) { blocks.push(currentList); currentList = null; }
      blocks.push({ type: tag, text: $(el).text(), originalText: $(el).text() });
    } else if (tag === 'p') {
      const text = $(el).text();
      const style = $(el).attr('style') || '';
      const fontSizeMatch = style.match(/font-size:\s?(\d+)pt/);
      const fontSize = fontSizeMatch ? parseInt(fontSizeMatch[1]) : null;
      const fontWeight = /bold|font-weight:\s?(bold|[5-9]00)/.test(style);
      const alignCenter = /text-align:\s?center/.test(style);
      // 字段内容格式判断
      const h1Pattern = /^(#|【|\d+\.|[一二三四五六七八九十]+、|第[一二三四五六七八九十]+章|[A-Z]\.?|[０-９]+\.|[０-９]+、|[一二三四五六七八九十]+\.)\s?/;
      const h2Pattern = /^(##|\d+\.\d+|\([一二三四五六七八九十]+\)|——|--|———|[０-９]+\.[０-９]+)\s?/;
      // 伪标题1：大字号+加粗+居中 或内容格式
      if ((fontSize && fontSize === h1Size && fontWeight && alignCenter) || h1Pattern.test(text)) {
        if (currentList) { blocks.push(currentList); currentList = null; }
        blocks.push({ type: 'h1', text: text.replace(h1Pattern, ''), originalText: text });
        return;
      }
      // 伪标题2：次大字号+加粗 或内容格式
      if ((fontSize && fontSize === h2Size && fontWeight) || h2Pattern.test(text)) {
        if (currentList) { blocks.push(currentList); currentList = null; }
        blocks.push({ type: 'h2', text: text.replace(h2Pattern, ''), originalText: text });
        return;
      }
      // 伪列表项
      if (/^(-|\*|•|\d+、|\d+\.)\s?/.test(text)) {
        if (!currentList) currentList = { type: 'ul', items: [] };
        currentList.items.push(text.replace(/^(-|\*|•|\d+、|\d+\.)\s?/, ''));
        return;
      }
      // 普通段落
      if (currentList) { blocks.push(currentList); currentList = null; }
      blocks.push({ type: 'p', text, originalText: text });
    } else if (tag === 'img') {
      if (currentList) { blocks.push(currentList); currentList = null; }
      blocks.push({ type: 'img', src: $(el).attr('src') });
    } else if (tag === 'ul' || tag === 'ol') {
      if (currentList) { blocks.push(currentList); currentList = null; }
      const items = [];
      $(el).find('li').each((j, li) => items.push($(li).text()));
      blocks.push({ type: tag, items });
    } else if (tag === 'pre' || tag === 'code') {
      if (currentList) { blocks.push(currentList); currentList = null; }
      blocks.push({ type: 'code', text: $(el).text() });
    } else {
      if (currentList) { blocks.push(currentList); currentList = null; }
      blocks.push({ type: tag, html: $.html(el) });
    }
  });
  console.log(html)
  if (currentList) blocks.push(currentList);
  return blocks;
}

// 纯文本/解析后文本转结构化 JSON（支持 h1/h2/ul）
function plainTextToContentJSON(txt) {
  const lines = txt.split(/\r?\n/).map(l => l.trim());
  const blocks = [];
  let currentList = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) {
      if (currentList) {
        blocks.push(currentList);
        currentList = null;
      }
      continue;
    }
    // 一级标题（如“1.”、“一、”、“# ”、“【】”等）
    if (/^(#|【|\d+\.|[一二三四五六七八九十]+、|第[一二三四五六七八九十]+章|[A-Z]\.?)\s?/.test(line)) {
      if (currentList) { blocks.push(currentList); currentList = null; }
      blocks.push({ type: 'h1', text: line.replace(/^(#|【|\d+\.|[一二三四五六七八九十]+、|第[一二三四五六七八九十]+章|[A-Z]\.?)\s?/, '') });
      continue;
    }
    // 二级标题（如“1.1”、“（一）”、“## ”、“——”等）
    if (/^(##|\d+\.\d+|\([一二三四五六七八九十]+\)|——|--|———)\s?/.test(line)) {
      if (currentList) { blocks.push(currentList); currentList = null; }
      blocks.push({ type: 'h2', text: line.replace(/^(##|\d+\.\d+|\([一二三四五六七八九十]+\)|——|--|———)\s?/, '') });
      continue;
    }
    // 列表项（如“1. xxx”、“- xxx”、“* xxx”、“• xxx”、“数字+、xxx”）
    if (/^(-|\*|•|\d+、|\d+\.)\s?/.test(line)) {
      if (!currentList) currentList = { type: 'ul', items: [] };
      currentList.items.push(line.replace(/^(-|\*|•|\d+、|\d+\.)\s?/, ''));
      continue;
    }
    // 普通段落
    if (currentList) { blocks.push(currentList); currentList = null; }
    blocks.push({ type: 'p', text: line });
  }
  if (currentList) blocks.push(currentList);
  return blocks;
}

// 通过Slug获取文章

function getArticleDetailOptions(query = {}) {
  const { fields, include = 'categories,tags,user' } = query;
  const allowedFields = Object.keys(Article.rawAttributes || {});
  const allowedIncludes = new Set(['categories', 'tags', 'user']);
  const requestedFieldSet = new Set();
  let attributesOption;

  if (typeof fields !== 'undefined' && String(fields).trim() !== '') {
    const requestedFieldsRaw = String(fields).split(',').map(item => item.trim()).filter(Boolean);
    const invalidFields = requestedFieldsRaw.filter(field => !allowedFields.includes(field));

    if (invalidFields.length) {
      const err = new Error(`Invalid fields: ${invalidFields.join(', ')}`);
      err.status = 400;
      err.code = errorCode.INVALID_PARAMS.code;
      err.allowedFields = allowedFields;
      throw err;
    }

    requestedFieldsRaw.forEach(field => requestedFieldSet.add(field));
    attributesOption = requestedFieldsRaw.slice();

    ['PostID', 'UserID', 'Status'].forEach(field => {
      if (!attributesOption.includes(field)) {
        attributesOption.push(field);
      }
    });
  }

  const includeSet = new Set(String(include || '').split(',').map(item => item.trim()).filter(Boolean));
  const invalidIncludes = Array.from(includeSet).filter(item => !allowedIncludes.has(item));

  if (invalidIncludes.length) {
    const err = new Error(`Invalid includes: ${invalidIncludes.join(', ')}`);
    err.status = 400;
    err.code = errorCode.INVALID_PARAMS.code;
    err.allowedIncludes = Array.from(allowedIncludes);
    throw err;
  }

  const includeList = [];
  if (includeSet.has('user')) {
    includeList.push({ model: User, attributes: ['UserID', 'Username', 'DisplayName', 'AvatarURL'] });
  }
  if (includeSet.has('categories')) {
    includeList.push({ model: Category, through: { attributes: [] } });
  }
  if (includeSet.has('tags')) {
    includeList.push({ model: Tag, through: { attributes: [] } });
  }

  return {
    attributesOption,
    includeList,
    requestedFieldSet,
    hasExplicitFields: !!attributesOption
  };
}

function isArticleOwnerOrAdmin(article, user) {
  if (!article || !user) return false;
  const isAdmin = Array.isArray(user.roles) && user.roles.includes('admin');
  return isAdmin || article.UserID === user.id;
}

async function getArticleLikeCount(postId) {
  const { PostLike } = require('../models');
  return PostLike.count({ where: { PostID: postId } });
}

async function getUserArticleInteractionFlags(postId, userId) {
  if (!userId) {
    return {
      Liked: false,
      Favorited: false,
    };
  }

  const { PostLike, PostFavorite } = require('../models');
  const [likedRecord, favoriteRecord] = await Promise.all([
    PostLike.findOne({ where: { PostID: postId, UserID: userId } }),
    PostFavorite.findOne({ where: { PostID: postId, UserID: userId } }),
  ]);

  return {
    Liked: !!likedRecord,
    Favorited: !!favoriteRecord,
  };
}

function applyArticleDetailProjection(data, requestedFieldSet, hasExplicitFields) {
  const responseData = { ...data };

  if (hasExplicitFields) {
    if (!requestedFieldSet.has('Content')) delete responseData.Content;
    if (!requestedFieldSet.has('Status')) delete responseData.Status;
    if (!requestedFieldSet.has('UserID')) delete responseData.UserID;
  }

  return responseData;
}

function bumpArticleDetailViewCount(data) {
  const responseData = { ...data };

  if (typeof responseData.ViewCount === 'number') {
    responseData.ViewCount += 1;
  }

  return responseData;
}

function buildArticleDetailCacheKey(where, query) {
  if (where?.PostID !== undefined) {
    return buildPublicArticleDetailCacheKey('id', where.PostID, query);
  }

  if (where?.Slug !== undefined) {
    return buildPublicArticleDetailCacheKey('slug', where.Slug, query);
  }

  return '';
}

async function getCachedPublicArticleDetail(cacheKey) {
  if (!cacheKey || !redisClient.isClientConnected()) {
    return null;
  }

  try {
    const cached = await redisClient.getCache(cacheKey);

    if (cached && typeof cached === 'object') {
      await incrementCacheMetric(CACHE_METRIC_KEYS.hits);
      await setCacheActivity('lastHitAt');
      return cached;
    }

    await incrementCacheMetric(CACHE_METRIC_KEYS.misses);
    await setCacheActivity('lastMissAt');
    return null;
  } catch (error) {
    console.error(`Article detail cache read failed for ${cacheKey}:`, error.message);
    return null;
  }
}

async function setCachedPublicArticleDetail(cacheKey, payload) {
  if (!cacheKey || !redisClient.isClientConnected() || !payload || typeof payload !== 'object') {
    return;
  }

  try {
    await redisClient.setCache(cacheKey, payload, PUBLIC_ARTICLE_DETAIL_CACHE_TTL_SECONDS);
    await incrementCacheMetric(CACHE_METRIC_KEYS.writes);
    await setCacheActivity('lastWriteAt');
  } catch (error) {
    console.error(`Article detail cache write failed for ${cacheKey}:`, error.message);
  }
}

async function sendArticleDetail(req, res, next, where) {
  try {
    const { attributesOption, includeList, requestedFieldSet, hasExplicitFields } = getArticleDetailOptions(req.query);
    const cacheKey = buildArticleDetailCacheKey(where, req.query);
    const cachedPublicPayload = await getCachedPublicArticleDetail(cacheKey);

    if (cachedPublicPayload) {
      try {
        await Article.increment('ViewCount', { by: 1, where: { PostID: cachedPublicPayload.PostID } });
      } catch (_) {}

      const refreshedPublicPayload = bumpArticleDetailViewCount(cachedPublicPayload);
      await setCachedPublicArticleDetail(cacheKey, refreshedPublicPayload);

      const userFlags = await getUserArticleInteractionFlags(refreshedPublicPayload.PostID, req.user?.id);
      return res.json({
        code: 0,
        data: {
          ...refreshedPublicPayload,
          ...userFlags,
        },
      });
    }

    const article = await Article.findOne({
      where,
      attributes: attributesOption,
      include: includeList
    });

    if (!article) {
      return res.status(404).json({ code: errorCode.NOT_FOUND.code, message: 'Article not found' });
    }

    if (article.Status !== 'published' && !isArticleOwnerOrAdmin(article, req.user)) {
      return res.status(403).json({ code: errorCode.PERMISSION_DENIED.code, message: 'Forbidden article' });
    }

    try {
      await Article.increment('ViewCount', { by: 1, where: { PostID: article.PostID } });
    } catch (_) {}

    const likeCount = await getArticleLikeCount(article.PostID);
    const publicPayload = applyArticleDetailProjection(
      bumpArticleDetailViewCount({
        ...article.toJSON(),
        LikeCount: likeCount,
      }),
      requestedFieldSet,
      hasExplicitFields
    );

    if (article.Status === 'published') {
      await setCachedPublicArticleDetail(cacheKey, publicPayload);
    }

    const userFlags = await getUserArticleInteractionFlags(article.PostID, req.user?.id);
    res.json({
      code: 0,
      data: {
        ...publicPayload,
        ...userFlags,
      },
    });
  } catch (err) {
    if (err.status === 400) {
      const extra = {};
      if (err.allowedFields) extra.allowedFields = err.allowedFields;
      if (err.allowedIncludes) extra.allowedIncludes = err.allowedIncludes;
      return res.status(400).json({ code: err.code || 1, message: err.message, ...extra });
    }

    next(err);
  }
}

async function toggleArticleRelation(req, res, next, relationType) {
  const { PostLike, PostFavorite } = require('../models');
  const relationModel = relationType === 'like' ? PostLike : PostFavorite;
  const fieldName = relationType === 'like' ? 'liked' : 'favorited';

  try {
    const article = await Article.findByPk(req.params.id, {
      attributes: ['PostID', 'UserID', 'Status']
    });

    if (!article) {
      return next(createArticleControllerError(404, 'Article not found', null, errorCode.NOT_FOUND.code));
    }

    if (article.Status !== 'published' && !isArticleOwnerOrAdmin(article, req.user)) {
      return next(createArticleControllerError(403, 'Forbidden article action', null, errorCode.PERMISSION_DENIED.code));
    }

    const where = { PostID: article.PostID, UserID: req.user.id };
    const existingRecord = await relationModel.findOne({ where });
    let active = false;

    if (existingRecord) {
      await existingRecord.destroy();
    } else {
      await relationModel.create(where);
      active = true;
    }

    const likeCount = await PostLike.count({ where: { PostID: article.PostID } });
    res.success({ [fieldName]: active, likeCount }, 'success');
  } catch (err) {
    next(createArticleControllerError(500, 'Server error', err.message, errorCode.SYSTEM_ERROR.code));
  }
}

exports.getArticleById = async (req, res, next) => {
  await sendArticleDetail(req, res, next, { PostID: req.params.id });
};

exports.getArticleBySlug = async (req, res, next) => {
  await sendArticleDetail(req, res, next, { Slug: req.params.slug });
};

exports.toggleArticleLike = async (req, res, next) => {
  await toggleArticleRelation(req, res, next, 'like');
};

exports.toggleArticleFavorite = async (req, res, next) => {
  await toggleArticleRelation(req, res, next, 'favorite');
};
