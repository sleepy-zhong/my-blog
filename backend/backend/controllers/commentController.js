const { Comment, User, Article } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const errorCode = require('../middleware/errorCode');

function buildCommentTree(comments) {
  const commentMap = new Map();
  const rootComments = [];

  comments.forEach(comment => {
    comment.children = [];
    commentMap.set(comment.CommentID, comment);
  });

  comments.forEach(comment => {
    if (comment.ParentCommentID) {
      const parent = commentMap.get(comment.ParentCommentID);
      if (parent) {
        parent.children.push(comment);
      }
    } else {
      rootComments.push(comment);
    }
  });

  return rootComments;
}

function isAdmin(user) {
  return Array.isArray(user?.roles) && user.roles.includes('admin');
}

function isArticleOwner(article, user) {
  return !!article && !!user && Number(article.UserID) === Number(user.id);
}

function canDeleteComment(user, comment) {
  if (!user || !comment) return false;
  if (isAdmin(user)) return true;
  return Number(comment.UserID) === Number(user.id) && !!comment.CanDelete;
}

async function loadAccessibleArticle(articleId, user) {
  const article = await Article.findByPk(articleId, {
    attributes: ['PostID', 'UserID', 'Status']
  });

  if (!article) {
    const err = new Error('文章不存在');
    err.status = 404;
    err.code = errorCode.NOT_FOUND.code;
    throw err;
  }

  if (article.Status !== 'published' && !isAdmin(user) && !isArticleOwner(article, user)) {
    const err = new Error('无权访问该文章');
    err.status = 403;
    err.code = errorCode.PERMISSION_DENIED.code;
    throw err;
  }

  return article;
}

function normalizeReadableStatus(requestedStatus, article, user) {
  const normalizedStatus = ['approved', 'pending', 'spam'].includes(String(requestedStatus || '').trim())
    ? String(requestedStatus).trim()
    : 'approved';

  if (normalizedStatus === 'approved') {
    return normalizedStatus;
  }

  if (isAdmin(user) || isArticleOwner(article, user)) {
    return normalizedStatus;
  }

  return 'approved';
}

function sendControllerError(res, err) {
  return res.status(err.status || 500).json({
    code: err.code || 1,
    message: err.message || '服务器错误'
  });
}

exports.createComment = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ code: 1, message: '参数错误', errors: errors.array() });
  }

  try {
    const content = String(req.body.content || '').trim();
    const parentId = req.body.parentId ? Number(req.body.parentId) : null;
    const article = await loadAccessibleArticle(req.params.articleId, req.user);

    let parentComment = null;
    if (parentId) {
      parentComment = await Comment.findByPk(parentId, {
        attributes: ['CommentID', 'PostID']
      });

      if (!parentComment) {
        return res.status(404).json({ code: 1, message: '父评论不存在' });
      }

      if (Number(parentComment.PostID) !== Number(article.PostID)) {
        return res.status(400).json({ code: 1, message: '父评论不属于当前文章' });
      }
    }

    const comment = await Comment.create({
      Content: content,
      UserID: req.user.id,
      PostID: article.PostID,
      ParentCommentID: parentComment ? parentComment.CommentID : null,
      Status: 'approved',
      CanDelete: true
    });

    const fullComment = await Comment.findByPk(comment.CommentID, {
      include: [
        { model: User, attributes: ['UserID', 'Username', 'DisplayName', 'AvatarURL'] }
      ]
    });

    res.status(201).json({
      code: 0,
      message: '评论发布成功',
      data: fullComment
    });
  } catch (err) {
    sendControllerError(res, err);
  }
};

exports.getCommentsTreeByArticle = async (req, res) => {
  try {
    const page = Number(req.query.page || 1);
    const pageSize = Number(req.query.pageSize || 10);
    const article = await loadAccessibleArticle(req.params.articleId, req.user);
    const status = normalizeReadableStatus(req.query.status, article, req.user);

    const comments = await Comment.findAll({
      where: {
        PostID: article.PostID,
        Status: status
      },
      include: [
        { model: User, attributes: ['UserID', 'Username', 'DisplayName', 'AvatarURL'] }
      ],
      order: [['CreatedAt', 'ASC']]
    });

    const tree = buildCommentTree(comments.map(comment => comment.toJSON()));
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    res.json({
      code: 0,
      data: tree.slice(startIndex, endIndex),
      pagination: {
        page,
        pageSize,
        total: tree.length,
        hasMore: endIndex < tree.length
      }
    });
  } catch (err) {
    sendControllerError(res, err);
  }
};

exports.getCommentsByArticle = async (req, res) => {
  try {
    const page = Number(req.query.page || 1);
    const pageSize = Number(req.query.pageSize || 10);
    const article = await loadAccessibleArticle(req.params.articleId, req.user);
    const status = normalizeReadableStatus(req.query.status, article, req.user);

    const { count, rows } = await Comment.findAndCountAll({
      where: {
        PostID: article.PostID,
        Status: status
      },
      include: [
        { model: User, attributes: ['UserID', 'Username', 'DisplayName', 'AvatarURL'] },
        { model: Comment, as: 'Parent', attributes: ['CommentID', 'Content'] }
      ],
      order: [['CreatedAt', 'ASC']],
      offset: (page - 1) * pageSize,
      limit: pageSize
    });

    res.json({
      code: 0,
      data: {
        list: rows,
        total: count,
        page,
        pageSize
      }
    });
  } catch (err) {
    sendControllerError(res, err);
  }
};

exports.deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findByPk(req.params.id);
    if (!comment) {
      throw { code: errorCode.NOT_FOUND.code, message: '评论不存在' };
    }

    if (!canDeleteComment(req.user, comment)) {
      throw { code: errorCode.PERMISSION_DENIED.code, message: '无权删除该评论' };
    }

    await comment.destroy();
    res.json({ code: 0, message: '评论删除成功' });
  } catch (err) {
    next(err);
  }
};

exports.updateCommentStatus = async (req, res, next) => {
  try {
    const status = String(req.body.status || '').trim();
    if (!['approved', 'pending', 'spam'].includes(status)) {
      throw { code: errorCode.VALIDATION_ERROR.code, message: '评论状态不合法' };
    }

    const comment = await Comment.findByPk(req.params.id);
    if (!comment) {
      throw { code: errorCode.NOT_FOUND.code, message: '评论不存在' };
    }

    comment.Status = status;
    await comment.save();

    res.json({
      code: 0,
      message: '评论状态更新成功',
      data: comment
    });
  } catch (err) {
    next(err);
  }
};

exports.getAllComments = async (req, res) => {
  try {
    const page = Number(req.query.page || 1);
    const pageSize = Number(req.query.pageSize || 10);
    const keyword = String(req.query.keyword || '').trim();
    const status = String(req.query.status || '').trim();
    const articleId = req.query.articleId ? Number(req.query.articleId) : null;
    const where = {};

    if (status && ['approved', 'pending', 'spam'].includes(status)) {
      where.Status = status;
    }

    if (keyword) {
      where.Content = { [Op.like]: `%${keyword}%` };
    }

    if (articleId) {
      where.PostID = articleId;
    }

    const { count, rows } = await Comment.findAndCountAll({
      where,
      include: [
        { model: User, attributes: ['UserID', 'Username', 'DisplayName', 'AvatarURL'] },
        { model: Article, attributes: ['PostID', 'Title'] }
      ],
      order: [['CreatedAt', 'DESC']],
      offset: (page - 1) * pageSize,
      limit: pageSize
    });

    res.json({
      code: 0,
      data: {
        list: rows,
        total: count,
        page,
        pageSize
      }
    });
  } catch (err) {
    res.status(500).json({ code: 1, message: '服务器错误', error: err.message });
  }
};
