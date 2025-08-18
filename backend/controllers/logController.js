const { OperationLog, User } = require('../models');
const { Op } = require('sequelize');
const errorCode = require('../middleware/errorCode');

// 查询操作日志（支持分页、筛选）
exports.getLogs = async (req, res, next) => {
  try {
    const { page = 1, pageSize = 20, user, type } = req.query;
    const where = {};
    if (user) where.UserID = user;
    if (type) where.OperationType = type;
    const { count, rows } = await OperationLog.findAndCountAll({
      where,
      include: [
        { model: User, attributes: ['UserID', 'Username'] }
      ],
      order: [['Timestamp', 'DESC']],
      offset: (page - 1) * pageSize,
      limit: Number(pageSize)
    });
    res.json({ code: 0, data: { list: rows, total: count, page: Number(page), pageSize: Number(pageSize) } });
  } catch (err) {
    next(err);
  }
};

// 查询单条日志详情
exports.getLogById = async (req, res, next) => {
  try {
    const log = await OperationLog.findByPk(req.params.id, {
      include: [
        { model: User, attributes: ['UserID', 'Username'] }
      ]
    });
    if (!log) return res.status(404).json({ code: 1, message: '日志不存在' });
    res.json({ code: 0, data: log });
  } catch (err) {
    next(err);
  }
};