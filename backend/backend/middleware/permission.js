const errorCode = require('./errorCode');

// 检查用户是否具有指定角色
const hasRole = (roles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ code: 1, message: '未登录' });
      }

      const userRoles = req.user.roles || [];
      const requiredRoles = Array.isArray(roles) ? roles : [roles];
      
      const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));
      
      if (!hasRequiredRole) {
        return res.status(403).json({ 
          code: errorCode.PERMISSION_DENIED.code, 
          message: '权限不足' 
        });
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

// 检查用户是否为管理员
const isAdmin = hasRole('admin');

// 检查用户是否为作者或管理员
const isAuthorOrAdmin = (req, res, next) => {
  return hasRole(['author', 'admin'])(req, res, next);
};

// 检查用户是否为编辑或管理员
const isEditorOrAdmin = (req, res, next) => {
  return hasRole(['editor', 'admin'])(req, res, next);
};

// 检查用户是否为资源所有者或管理员
const isOwnerOrAdmin = (resourceUserIdField = 'UserID') => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ code: 1, message: '未登录' });
      }

      const userRoles = req.user.roles || [];
      const isAdmin = userRoles.includes('admin');
      
      if (isAdmin) {
        return next();
      }

      // 检查是否为资源所有者
      const resourceUserId = req.params[resourceUserIdField] || req.body[resourceUserIdField];
      if (resourceUserId && parseInt(resourceUserId) === req.user.id) {
        return next();
      }

      return res.status(403).json({ 
        code: errorCode.PERMISSION_DENIED.code, 
        message: '权限不足' 
      });
    } catch (error) {
      next(error);
    }
  };
};

// 检查用户是否为文章作者或管理员
const isArticleOwnerOrAdmin = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ code: 1, message: '未登录' });
    }

    const userRoles = req.user.roles || [];
    const isAdmin = userRoles.includes('admin');
    
    if (isAdmin) {
      return next();
    }

    // 这里需要从数据库获取文章信息来检查作者
    // 暂时跳过，在具体的控制器中处理
    return next();
  } catch (error) {
    next(error);
  }
};

// 检查用户是否有特定权限（预留接口）
const hasPermission = (permission) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ code: 1, message: '未登录' });
      }

      // 这里可以实现基于权限的验证逻辑
      // 暂时使用角色验证
      const userRoles = req.user.roles || [];
      const isAdmin = userRoles.includes('admin');
      
      if (isAdmin) {
        return next();
      }

      return res.status(403).json({ 
        code: errorCode.PERMISSION_DENIED.code, 
        message: '权限不足' 
      });
    } catch (error) {
      next(error);
    }
  };
};

module.exports = {
  hasRole,
  isAdmin,
  isAuthorOrAdmin,
  isEditorOrAdmin,
  isOwnerOrAdmin,
  isArticleOwnerOrAdmin,
  hasPermission
}; 