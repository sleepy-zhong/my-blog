const { OperationLog, User } = require('../models')
const errorCode = require('../middleware/errorCode')

// 获取操作日志列表
exports.getLogs = async (req, res, next) => {
  try {
    const { page = 1, pageSize = 20, user, type } = req.query
    const where = {}
    if (user) where.UserID = user
    if (type) where.OperationType = type
    const { count, rows } = await OperationLog.findAndCountAll({
      where,
      include: [
        { model: User, attributes: ['UserID', 'Username'] }
      ],
      order: [['Timestamp', 'DESC']],
      offset: (page - 1) * pageSize,
      limit: Number(pageSize)
    })
    res.success({ list: rows, total: count, page: Number(page), pageSize: Number(pageSize) })
  } catch (err) {
    next(err)
  }
}

// 获取日志详情
exports.getLogById = async (req, res, next) => {
  try {
    const log = await OperationLog.findByPk(req.params.id, {
      include: [
        { model: User, attributes: ['UserID', 'Username'] }
      ]
    })
    if (!log) {
      return next({
        status: 404,
        code: errorCode.NOT_FOUND.code,
        message: '日志不存在',
      })
    }
    res.success(log)
  } catch (err) {
    next(err)
  }
}
