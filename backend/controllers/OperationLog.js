const { OperationLog, User } = require('../models');
const { Op } = require('sequelize');

// 创建操作日志
exports.createLog = async (logData) => {
  // logData: { UserID, OperationType, TargetType, TargetID, Details, IPAddress, UserAgent }
  try {
    await OperationLog.create(logData);
  } catch (err) {
    // 日志写入失败不影响主流程
    console.error('操作日志写入失败:', err);
  }
};

// 查询操作日志（支持分页、筛选）
exports.getLogs = async (req, res) => {
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
    res.json({ code: 0, data: { list: rows, total: count } });
  } catch (err) {
    res.status(500).json({ code: 1, message: '服务器错误', error: err.message });
  }
}; 