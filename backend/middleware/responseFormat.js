// 统一API响应格式中间件
module.exports = (req, res, next) => {
  // 保留原始 res.json
  const oldJson = res.json;
  res.json = function (data) {
    // 如果已经是标准格式，直接返回
    if (data && typeof data === 'object' && 'code' in data) {
      return oldJson.call(this, data);
    }
    // 否则包装为标准格式
    return oldJson.call(this, {
      code: 0,
      message: 'success',
      data
    });
  };
  next();
}; 