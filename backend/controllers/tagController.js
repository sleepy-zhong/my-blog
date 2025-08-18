const { Tag, User } = require('../models');
const { validationResult } = require('express-validator');
const errorCode = require('../middleware/errorCode');
const { Op } = require('sequelize');

// 创建标签
exports.createTag = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return next({ code: 1001, message: '参数错误', data: errors.array() });
  try {
    const { name, description } = req.body;
    const tag = await Tag.create({
      Name: name,
      Description: description,
      CreatedBy: req.user.id
    });
    res.status(201).json(tag);
  } catch (err) {
    next(err);
  }
};

// 热门标签（Top N），可复用文章过滤条件（简化：仅状态/关键词/分类）
exports.getPopularTags = async (req, res, next) => {
  try {
    const { sequelize } = require('../models');
    const {
      limit = 30,
      status = 'published',
      keyword,
      categories,
      categoryMode = 'any'
    } = req.query;

    const categoryIds = categories ? String(categories).split(',').map(s => parseInt(s, 10)).filter(n => !isNaN(n)) : [];

    let joins = `
      LEFT JOIN posttags pt ON pt.TagID = t.TagID
      LEFT JOIN posts p ON p.PostID = pt.PostID
        AND (${status ? 'p.Status = :status' : '1=1'})
        ${keyword ? 'AND (p.Title LIKE :kw OR p.Excerpt LIKE :kw OR p.Content LIKE :kw)' : ''}
    `;
    if (categoryIds.length) {
      if (categoryMode === 'all') {
        joins += `
          INNER JOIN (
            SELECT pc.PostID
            FROM postcategories pc
            WHERE pc.CategoryID IN (${categoryIds.join(',')})
            GROUP BY pc.PostID
            HAVING COUNT(DISTINCT pc.CategoryID) = ${categoryIds.length}
          ) pc_all ON pc_all.PostID = p.PostID
        `;
      } else {
        joins += `
          INNER JOIN (
            SELECT DISTINCT pc.PostID
            FROM postcategories pc
            WHERE pc.CategoryID IN (${categoryIds.join(',')})
          ) pc_any ON pc_any.PostID = p.PostID
        `;
      }
    }

    const sql = `
      SELECT t.TagID, t.Name, COUNT(DISTINCT p.PostID) AS PostCount
      FROM tags t
      ${joins}
      GROUP BY t.TagID, t.Name
      ORDER BY PostCount DESC
      LIMIT :limit
    `;
    const replacements = { limit: Number(limit) };
    if (status) replacements.status = status;
    if (keyword) replacements.kw = `%${keyword}%`;
    const [rows] = await sequelize.query(sql, { replacements });
    res.json({ code: 0, data: { list: rows } });
  } catch (err) {
    next(err);
  }
};

// 获取所有标签
exports.getTags = async (req, res, next) => {
  try {
    const tags = await Tag.findAll({
      include: [
        { model: User, attributes: ['UserID', 'Username', 'DisplayName'] }
      ],
      order: [['CreatedAt', 'DESC']]
    });
    res.json(tags);
  } catch (err) {
    next(err);
  }
};

// 更新标签
exports.updateTag = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const tag = await Tag.findByPk(req.params.id);
    if (!tag) throw { code: errorCode.NOT_FOUND.code, message: '标签不存在' };
    tag.Name = name || tag.Name;
    tag.Description = description || tag.Description;
    await tag.save();
    res.json(tag);
  } catch (err) {
    next(err);
  }
};

// 删除标签
exports.deleteTag = async (req, res, next) => {
  try {
    const tag = await Tag.findByPk(req.params.id);
    if (!tag) throw { code: errorCode.NOT_FOUND.code, message: '标签不存在' };
    await tag.destroy();
    res.json({ message: '删除成功' });
  } catch (err) {
    next(err);
  }
}; 