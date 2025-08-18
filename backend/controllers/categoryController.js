const { Category, User } = require('../models');
const { Op } = require('sequelize');
const { validationResult } = require('express-validator');
const errorCode = require('../middleware/errorCode');

// 创建分类
exports.createCategory = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return next({ code: 1001, message: '参数错误', data: errors.array() });
  try {
    const { name, description, parentCategoryId } = req.body;
    const category = await Category.create({
      Name: name,
      Description: description,
      ParentCategoryID: parentCategoryId || null,
      CreatedBy: req.user.id
    });
    res.status(201).json(category);
  } catch (err) {
    next(err);
  }
};

// 获取所有分类
exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Category.findAll({
      include: [
        { model: User, attributes: ['UserID', 'Username', 'DisplayName'] },
        { model: Category, as: 'Parent', attributes: ['CategoryID', 'Name'] }
      ],
      order: [['CreatedAt', 'DESC']]
    });
    res.json(categories);
  } catch (err) {
    next(err);
  }
};

// 更新分类
exports.updateCategory = async (req, res, next) => {
  try {
    const { name, description, parentCategoryId } = req.body;
    const category = await Category.findByPk(req.params.id);
    if (!category) throw { code: errorCode.NOT_FOUND.code, message: '分类不存在' };
    category.Name = name || category.Name;
    category.Description = description || category.Description;
    category.ParentCategoryID = parentCategoryId || null;
    await category.save();
    res.json(category);
  } catch (err) {
    next(err);
  }
};

// 删除分类
exports.deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) throw { code: errorCode.NOT_FOUND.code, message: '分类不存在' };
    await category.destroy();
    res.json({ message: '删除成功' });
  } catch (err) {
    next(err);
  }
};

// 获取多级分类树结构
exports.getCategoryTree = async (req, res, next) => {
  try {
    const categories = await Category.findAll({
      order: [['CreatedAt', 'ASC']]
    });
    // 构建树结构
    const map = {};
    const roots = [];
    categories.forEach(c => { map[c.CategoryID] = c.toJSON(); map[c.CategoryID].children = []; });
    categories.forEach(c => {
      const item = map[c.CategoryID];
      if (item.ParentCategoryID && map[item.ParentCategoryID]) {
        map[item.ParentCategoryID].children.push(item);
      } else {
        roots.push(item);
      }
    });
    res.json({ code: 0, data: roots });
  } catch (err) {
    next(err);
  }
}; 

// 分类统计汇总（可按状态/关键词/标签筛选）
exports.getCategoriesSummary = async (req, res, next) => {
  try {
    const { sequelize } = require('../models');
    const {
      status = 'published',
      keyword,
      tags,
      tagMode = 'any'
    } = req.query;

    const tagIds = tags ? String(tags).split(',').map(s => parseInt(s, 10)).filter(n => !isNaN(n)) : [];

    let joins = `
      LEFT JOIN postcategories pc ON pc.CategoryID = c.CategoryID
      LEFT JOIN posts p ON p.PostID = pc.PostID
        AND (${status ? 'p.Status = :status' : '1=1'})
        ${keyword ? 'AND (p.Title LIKE :kw OR p.Excerpt LIKE :kw OR p.Content LIKE :kw)' : ''}
    `;

    if (tagIds.length) {
      if (tagMode === 'all') {
        joins += `
          INNER JOIN (
            SELECT pt.PostID
            FROM posttags pt
            WHERE pt.TagID IN (${tagIds.join(',')})
            GROUP BY pt.PostID
            HAVING COUNT(DISTINCT pt.TagID) = ${tagIds.length}
          ) pt_all ON pt_all.PostID = p.PostID
        `;
      } else {
        joins += `
          INNER JOIN (
            SELECT DISTINCT pt.PostID
            FROM posttags pt
            WHERE pt.TagID IN (${tagIds.join(',')})
          ) pt_any ON pt_any.PostID = p.PostID
        `;
      }
    }

    const sql = `
      SELECT c.CategoryID, c.Name, COUNT(DISTINCT p.PostID) AS PostCount
      FROM categories c
      ${joins}
      GROUP BY c.CategoryID, c.Name
      ORDER BY PostCount DESC
    `;

    const replacements = {};
    if (status) replacements.status = status;
    if (keyword) replacements.kw = `%${keyword}%`;

    const [rows] = await sequelize.query(sql, { replacements });
    res.json({ code: 0, data: { list: rows } });
  } catch (err) {
    next(err);
  }
};