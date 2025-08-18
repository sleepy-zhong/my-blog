// 角色权限校验中间件
module.exports = function(roles = []) {
  return (req, res, next) => {
    if (!req.user || !req.user.roles.some(role => roles.includes(role))) {
      return res.status(403).json({ code: 1, message: '无权限' });
    }
    next();
  };
}; 