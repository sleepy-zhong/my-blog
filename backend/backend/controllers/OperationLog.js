const { OperationLog, User } = require('../models');
const errorCode = require('../middleware/errorCode');

// ??????
exports.createLog = async (logData) => {
  // logData: { UserID, OperationType, TargetType, TargetID, Details, IPAddress, UserAgent }
  try {
    await OperationLog.create(logData);
  } catch (err) {
    // ????????????
    console.error('????????:', err);
  }
};

// ???????????????
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
    res.success({ list: rows, total: count, page: Number(page), pageSize: Number(pageSize) });
  } catch (err) {
    return next({
      status: 500,
      code: errorCode.SYSTEM_ERROR.code,
      message: '?????',
      data: err.message,
    });
  }
};
