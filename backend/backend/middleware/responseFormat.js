module.exports = (req, res, next) => {
  const originalJson = res.json.bind(res)

  res.json = function (data) {
    if (data && typeof data === 'object' && 'code' in data) {
      return originalJson(data)
    }

    return originalJson({
      code: 0,
      message: 'success',
      data,
    })
  }

  res.success = function (data, message = '操作成功') {
    return res.status(200).json({
      code: 0,
      message,
      data,
    })
  }

  res.error = function (message = '操作失败', details = null, status = 400) {
    return res.status(status).json({
      code: 1,
      message,
      data: details,
    })
  }

  next()
}
