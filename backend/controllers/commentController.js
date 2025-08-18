const { Comment, User, Article } = require('../models');
const { validationResult } = require('express-validator');
const errorCode = require('../middleware/errorCode');
const { Op } = require('sequelize');

// 构建评论树结构
function buildCommentTree(comments) {
  const commentMap = new Map();
  const rootComments = [];
  
  // 建立映射关系
  comments.forEach(comment => {
    comment.children = [];
    commentMap.set(comment.CommentID, comment);
  });
  
  // 构建树结构
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

// 删除权限检查
function canDeleteComment(userId, comment, userRole) {
  if (userRole === 'admin') return true;
  return comment.UserID === userId && comment.CanDelete;
}

// 创建评论
exports.createComment = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ code: 1, message: '参数错误', errors: errors.array() });
  
  try {
    const { content, parentId } = req.body;
    const comment = await Comment.create({
      Content: content,
      UserID: req.user.id,
      PostID: req.params.articleId,
      ParentCommentID: parentId || null,
      Status: 'approved',  // 默认已审核
      CanDelete: true
    });

    // 获取包含用户信息的完整评论
    const fullComment = await Comment.findByPk(comment.CommentID, {
      include: [
        { model: User, attributes: ['UserID', 'Username', 'DisplayName', 'AvatarURL'] }
      ]
    });

    res.status(201).json({ 
      code: 0, 
      message: '评论发表成功', 
      data: fullComment 
    });
  } catch (err) {
    res.status(500).json({ code: 1, message: '服务器错误', error: err.message });
  }
};

// 获取评论树（楼中楼）
exports.getCommentsTreeByArticle = async (req, res) => {
  try {
    const { status = 'approved', page = 1, pageSize = 10 } = req.query;
    
    // 获取所有评论（不分页，用于构建树）
    const comments = await Comment.findAll({
      where: { 
        PostID: req.params.articleId, 
        Status: status 
      },
      include: [
        { model: User, attributes: ['UserID', 'Username', 'DisplayName', 'AvatarURL'] }
      ],
      order: [['CreatedAt', 'ASC']]
    });

    // 构建评论树
    const commentTree = buildCommentTree(comments.map(c => c.toJSON()));

    // 手动分页根评论
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + parseInt(pageSize);
    const paginatedTree = commentTree.slice(startIndex, endIndex);
    const total = commentTree.length;

    res.json({
      code: 0,
      message: 'success',
      data: paginatedTree,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total,
        hasMore: endIndex < total
      }
    });
  } catch (err) {
    res.status(500).json({ code: 1, message: '服务器错误', error: err.message });
  }
};

// 获取某篇文章的所有评论（平铺结构）
exports.getCommentsByArticle = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, status = 'approved' } = req.query;
    const { count, rows } = await Comment.findAndCountAll({
      where: { 
        PostID: req.params.articleId,
        Status: status
      },
      include: [
        { model: User, attributes: ['UserID', 'Username', 'DisplayName', 'AvatarURL'] },
        { model: Comment, as: 'Parent', attributes: ['CommentID', 'Content'] }
      ],
      order: [['CreatedAt', 'ASC']],
      offset: (page - 1) * pageSize,
      limit: Number(pageSize)
    });
    
    res.json({ 
      code: 0, 
      data: { 
        list: rows, 
        total: count, 
        page: Number(page), 
        pageSize: Number(pageSize) 
      } 
    });
  } catch (err) {
    res.status(500).json({ code: 1, message: '服务器错误', error: err.message });
  }
};

// 删除评论
exports.deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findByPk(req.params.id);
    if (!comment) {
      throw { code: errorCode.NOT_FOUND.code, message: '评论不存在' };
    }

    // 检查删除权限
    if (!canDeleteComment(req.user.id, comment, req.user.roles.includes('admin') ? 'admin' : 'user')) {
      throw { code: errorCode.PERMISSION_DENIED.code, message: '无权限删除此评论' };
    }

    // 如果有子评论，需要级联删除
    const childComments = await Comment.findAll({
      where: { ParentCommentID: req.params.id }
    });

    if (childComments.length > 0) {
      await Comment.destroy({
        where: { ParentCommentID: req.params.id }
      });
    }

    await comment.destroy();
    res.json({ code: 0, message: '评论删除成功' });
  } catch (err) {
    next(err);
  }
};

// 更新评论状态（管理员）
exports.updateCommentStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const comment = await Comment.findByPk(req.params.id);
    
    if (!comment) {
      throw { code: errorCode.NOT_FOUND.code, message: '评论不存在' };
    }
    
    if (!['approved', 'pending', 'spam'].includes(status)) {
      throw { code: errorCode.VALIDATION_ERROR.code, message: '无效状态' };
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

// 获取所有评论（后台管理）
exports.getAllComments = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, keyword, status, articleId } = req.query;
    const where = {};
    
    if (status) where.Status = status;
    if (keyword) where.Content = { [Op.like]: `%${keyword}%` };
    if (articleId) where.PostID = articleId;
    
    const { count, rows } = await Comment.findAndCountAll({
      where,
      include: [
        { model: User, attributes: ['UserID', 'Username', 'DisplayName', 'AvatarURL'] },
        { model: Article, attributes: ['PostID', 'Title'] }
      ],
      order: [['CreatedAt', 'DESC']],
      offset: (page - 1) * pageSize,
      limit: Number(pageSize)
    });
    
    res.json({ 
      code: 0, 
      data: { 
        list: rows, 
        total: count, 
        page: Number(page), 
        pageSize: Number(pageSize) 
      } 
    });
  } catch (err) {
    res.status(500).json({ code: 1, message: '服务器错误', error: err.message });
  }
}; 