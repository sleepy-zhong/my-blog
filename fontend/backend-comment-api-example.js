// 后端评论API实现示例
// 基于Express + MySQL

const express = require('express');
const mysql = require('mysql2/promise');
const router = express.Router();

// 数据库连接配置
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'your_password',
  database: 'techblogdb'
};

// 获取评论树（楼中楼）
router.get('/api/comments/:articleId/tree', async (req, res) => {
  try {
    const { articleId } = req.params;
    const { status = 'approved', page = 1, pageSize = 10 } = req.query;
    
    const connection = await mysql.createConnection(dbConfig);
    
    // 获取所有评论（包括子评论）
    const [comments] = await connection.execute(`
      SELECT 
        c.CommentID,
        c.PostID,
        c.UserID,
        c.ParentCommentID,
        c.Content,
        c.Status,
        c.CreatedAt,
        c.LastEditedAt,
        c.CanDelete,
        u.Username,
        u.DisplayName,
        u.AvatarURL
      FROM comments c
      LEFT JOIN users u ON c.UserID = u.UserID
      WHERE c.PostID = ? AND c.Status = ?
      ORDER BY c.CreatedAt ASC
    `, [articleId, status]);
    
    // 构建评论树
    const commentTree = buildCommentTree(comments);
    
    // 分页处理（只对主评论分页）
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + parseInt(pageSize);
    const paginatedComments = commentTree.slice(startIndex, endIndex);
    
    await connection.end();
    
    res.json({
      code: 0,
      message: 'success',
      data: paginatedComments,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total: commentTree.length,
        hasMore: endIndex < commentTree.length
      }
    });
    
  } catch (error) {
    console.error('获取评论树失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取评论失败'
    });
  }
});

// 发表评论
router.post('/api/comments/:articleId', async (req, res) => {
  try {
    const { articleId } = req.params;
    const { content, parentId } = req.body;
    const userId = req.user.UserID; // 从JWT中获取
    
    if (!content || !content.trim()) {
      return res.status(400).json({
        code: 400,
        message: '评论内容不能为空'
      });
    }
    
    const connection = await mysql.createConnection(dbConfig);
    
    // 如果是回复评论，验证父评论是否存在
    if (parentId) {
      const [parentComment] = await connection.execute(
        'SELECT CommentID FROM comments WHERE CommentID = ? AND PostID = ?',
        [parentId, articleId]
      );
      
      if (parentComment.length === 0) {
        await connection.end();
        return res.status(400).json({
          code: 400,
          message: '父评论不存在'
        });
      }
    }
    
    // 插入新评论（自动设置为已审核）
    const [result] = await connection.execute(`
      INSERT INTO comments (PostID, UserID, ParentCommentID, Content, Status, CanDelete)
      VALUES (?, ?, ?, ?, 'approved', 1)
    `, [articleId, userId, parentId, content.trim()]);
    
    // 获取新插入的评论详情
    const [newComment] = await connection.execute(`
      SELECT 
        c.CommentID,
        c.PostID,
        c.UserID,
        c.ParentCommentID,
        c.Content,
        c.Status,
        c.CreatedAt,
        c.LastEditedAt,
        c.CanDelete,
        u.Username,
        u.DisplayName,
        u.AvatarURL
      FROM comments c
      LEFT JOIN users u ON c.UserID = u.UserID
      WHERE c.CommentID = ?
    `, [result.insertId]);
    
    await connection.end();
    
    res.json({
      code: 0,
      message: '评论发表成功',
      data: newComment[0]
    });
    
  } catch (error) {
    console.error('发表评论失败:', error);
    res.status(500).json({
      code: 500,
      message: '发表评论失败'
    });
  }
});

// 删除评论
router.delete('/api/comments/:commentId', async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.UserID;
    const userRole = req.user.Role;
    
    const connection = await mysql.createConnection(dbConfig);
    
    // 获取评论信息
    const [comments] = await connection.execute(`
      SELECT CommentID, UserID, CanDelete FROM comments WHERE CommentID = ?
    `, [commentId]);
    
    if (comments.length === 0) {
      await connection.end();
      return res.status(404).json({
        code: 404,
        message: '评论不存在'
      });
    }
    
    const comment = comments[0];
    
    // 权限检查
    if (userRole !== 'admin' && comment.UserID !== userId) {
      await connection.end();
      return res.status(403).json({
        code: 403,
        message: '没有权限删除此评论'
      });
    }
    
    if (userRole !== 'admin' && !comment.CanDelete) {
      await connection.end();
      return res.status(403).json({
        code: 403,
        message: '此评论不允许删除'
      });
    }
    
    // 删除评论（级联删除子评论）
    await connection.execute('DELETE FROM comments WHERE CommentID = ?', [commentId]);
    
    await connection.end();
    
    res.json({
      code: 0,
      message: '评论删除成功'
    });
    
  } catch (error) {
    console.error('删除评论失败:', error);
    res.status(500).json({
      code: 500,
      message: '删除评论失败'
    });
  }
});

// 更新评论状态（管理员）
router.put('/api/comments/:commentId/status', async (req, res) => {
  try {
    const { commentId } = req.params;
    const { status } = req.body;
    const userRole = req.user.Role;
    
    if (userRole !== 'admin') {
      return res.status(403).json({
        code: 403,
        message: '没有权限执行此操作'
      });
    }
    
    if (!['approved', 'pending', 'spam'].includes(status)) {
      return res.status(400).json({
        code: 400,
        message: '无效的状态值'
      });
    }
    
    const connection = await mysql.createConnection(dbConfig);
    
    await connection.execute(
      'UPDATE comments SET Status = ? WHERE CommentID = ?',
      [status, commentId]
    );
    
    // 获取更新后的评论
    const [updatedComment] = await connection.execute(`
      SELECT 
        c.CommentID,
        c.PostID,
        c.UserID,
        c.ParentCommentID,
        c.Content,
        c.Status,
        c.CreatedAt,
        c.LastEditedAt,
        c.CanDelete,
        u.Username,
        u.DisplayName,
        u.AvatarURL
      FROM comments c
      LEFT JOIN users u ON c.UserID = u.UserID
      WHERE c.CommentID = ?
    `, [commentId]);
    
    await connection.end();
    
    res.json({
      code: 0,
      message: '评论状态更新成功',
      data: updatedComment[0]
    });
    
  } catch (error) {
    console.error('更新评论状态失败:', error);
    res.status(500).json({
      code: 500,
      message: '更新评论状态失败'
    });
  }
});

// 构建评论树的辅助函数
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

module.exports = router; 