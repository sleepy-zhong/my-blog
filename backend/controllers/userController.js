const { User, Role } = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const jwtConfig = require('../config/jwt');
const errorCode = require('../middleware/errorCode');
const { Op } = require('sequelize');
const sequelize = require('../config/db');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { logOperation, getClientIP, getUserAgent } = require('../utils/logger');

// 用户注册
exports.register = async (req, res) => {
  const errors = validationResult(req);
  console.log(errors);
  if (!errors.isEmpty()) return res.status(400).json({ code: 1, message: '参数错误', errors: errors.array() });
  try {
    const { username, email, password, phoneNumber, roleIds } = req.body;
    // 检查用户名、邮箱、手机号是否已存在，分别给出详细提示
    const existUsername = await User.findOne({ where: { Username: username } });
    if (existUsername) return res.status(400).json({ code: 1, message: '用户名已存在' });
    const existEmail = await User.findOne({ where: { Email: email } });
    if (existEmail) return res.status(400).json({ code: 1, message: '邮箱已存在' });
    if (phoneNumber) {
      const existPhone = await User.findOne({ where: { PhoneNumber: phoneNumber } });
      if (existPhone) return res.status(400).json({ code: 1, message: '手机号已存在' });
    }

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ Username: username, Email: email, PasswordHash: hash, PhoneNumber: phoneNumber });
    
    // 如果提供了角色ID，则分配角色；否则默认分配user角色
    if (roleIds && Array.isArray(roleIds) && roleIds.length > 0) {
      await user.setRoles(roleIds);
    } else {
      // 默认分配user角色（ID为4）
      await user.setRoles([4]);
    }
    
    // 记录用户注册日志
    await logOperation({
      userId: user.UserID,
      operationType: 'register',
      targetType: 'user',
      targetId: user.UserID,
      details: {
        username: user.Username,
        email: user.Email,
        phoneNumber: user.PhoneNumber,
        roleIds: roleIds || [4]
      },
      ipAddress: getClientIP(req),
      userAgent: getUserAgent(req)
    });
    
    res.status(201).json({ code: 0, message: '注册成功', data: { UserID: user.UserID, Username: user.Username, Email: user.Email } });
  } catch (err) {
    res.status(500).json({ code: 1, message: '服务器错误', error: err.message });
  }
};

// 用户登录
exports.login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ code: 1, message: '参数错误', errors: errors.array() });
  try {
    const { email, password, phoneNumber, username } = req.body;
    const where = email ? { Email: email } : phoneNumber ? { PhoneNumber: phoneNumber } : { Username: username };
    const user = await User.findOne({
      where,
      include: [{ model: Role, through: { attributes: [] } }]
    });
    if (!user) return res.status(400).json({ code: 1, message: '用户不存在' });
    const isMatch = await bcrypt.compare(password, user.PasswordHash);
    if (!isMatch) return res.status(400).json({ code: 1, message: '密码错误' });
    // 修正 roles 生成逻辑，确保为字符串数组
    const roles = Array.isArray(user.Roles)
      ? user.Roles.map(r => r?.dataValues?.Name).filter(Boolean)
      : [];
    // console.log('user.roles',user.Roles)
    // console.log('roles for token:', roles);
    const token = jwt.sign({
      id: user.UserID,
      username: user.Username,
      roles
    }, jwtConfig.secret, { expiresIn: jwtConfig.expiresIn });
    
    // 记录用户登录日志
    await logOperation({
      userId: user.UserID,
      operationType: 'login',
      targetType: 'user',
      targetId: user.UserID,
      details: {
        username: user.Username,
        loginMethod: email ? 'email' : phoneNumber ? 'phone' : 'username'
      },
      ipAddress: getClientIP(req),
      userAgent: getUserAgent(req)
    });
    
    res.json({ code: 0, message: '登录成功', data: { token } });
  } catch (err) {
    res.status(500).json({ code: 1, message: '服务器错误', error: err.message });
  }
};

// 获取当前用户信息（含角色）
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['PasswordHash'] },
      include: [
        {
          model: Role,
          through: { attributes: [] },
          attributes: ['RoleID', 'Name', 'Description']
        }
      ]
    });
    if (!user) throw { code: errorCode.NOT_FOUND.code, message: '用户不存在' };
    res.json({ code: 0, data: user });
  } catch (err) {
    next(err);
  }
};

// 更新当前用户信息
exports.updateMe = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) throw { code: errorCode.NOT_FOUND.code, message: '用户不存在' };
    const { displayName, bio } = req.body;
    user.DisplayName = displayName || user.DisplayName;
    user.Bio = bio || user.Bio;
    // 处理头像上传
    if (req.file) {
      // 有文件上传
      const ext = path.extname(req.file.originalname) || '.png';
      // 用户名处理，去除特殊字符和空格
      const safeUsername = (user.Username || 'user').replace(/[^a-zA-Z0-9\u4e00-\u9fa5-_]/g, '').replace(/\s+/g, '');
      const timestamp = Date.now();
      const filename = `${safeUsername}_${timestamp}${ext}`;
      const uploadRootEnv = process.env.UPLOAD_PATH || 'uploads';
      const avatarImagesSubDir = path.join('avaters');
      const avatarDirEnv = process.env.UPLOAD_AVATERS_PATH || path.join(uploadRootEnv, avatarImagesSubDir);
      const avatarDir = path.isAbsolute(avatarDirEnv)
        ? avatarDirEnv
        : path.resolve(__dirname, '..', avatarDirEnv);
      if (!fs.existsSync(avatarDir)) fs.mkdirSync(avatarDir, { recursive: true });
      const savePath = path.join(avatarDir, filename);
      fs.writeFileSync(savePath, req.file.buffer);
      user.AvatarURL = `/uploads/avaters/${filename}`;
    } else if (req.body.avatarURL) {
      // 兼容原有逻辑
      user.AvatarURL = req.body.avatarURL;
    }
    await user.save();
    
    // 记录用户信息更新日志
    await logOperation({
      userId: req.user.id,
      operationType: 'update_profile',
      targetType: 'user',
      targetId: req.user.id,
      details: {
        updatedFields: Object.keys(req.body).filter(key => req.body[key] !== undefined),
        hasAvatarUpload: !!req.file
      },
      ipAddress: getClientIP(req),
      userAgent: getUserAgent(req)
    });
    
    res.json(user);
  } catch (err) {
    next(err);
  }
};
// 修改密码
exports.changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findByPk(req.user.id);
    if (!user) throw { code: errorCode.NOT_FOUND.code, message: '用户不存在' };
    const isMatch = await bcrypt.compare(oldPassword, user.PasswordHash);
    if (!isMatch) throw { code: errorCode.PERMISSION_DENIED.code, message: '原密码错误' };
    user.PasswordHash = await bcrypt.hash(newPassword, 10);
    await user.save();
    
    // 记录密码修改日志
    await logOperation({
      userId: req.user.id,
      operationType: 'change_password',
      targetType: 'user',
      targetId: req.user.id,
      details: {
        passwordChanged: true
      },
      ipAddress: getClientIP(req),
      userAgent: getUserAgent(req)
    });
    
    res.json({ message: '密码修改成功' });
  } catch (err) {
    next(err);
  }
};



// 更新邮箱
exports.updateEmail = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ code: 1, message: '邮箱不能为空' });

    const user = await User.findByPk(req.user.id);
    if (!user) throw { code: errorCode.NOT_FOUND.code, message: '用户不存在' };

    // 校验是否已被占用
    const existEmail = await User.findOne({ where: { Email: email } });
    if (existEmail && existEmail.UserID !== user.UserID) return res.status(400).json({ code: 1, message: '邮箱已被占用' });

    // 更新邮箱
    user.Email = email;
    await user.save();

    // 记录日志
    await logOperation({
      userId: req.user.id,
      operationType: 'change_email',
      targetType: 'user',
      targetId: req.user.id,
      details: { newEmail: email },
      ipAddress: getClientIP(req),
      userAgent: getUserAgent(req)
    });

    res.json({ code: 0, message: '邮箱更新成功' });
  } catch (err) {
    next(err);
  }
};

// 找回密码（伪实现，实际应发邮件/短信验证码）
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email, phoneNumber, newPassword } = req.body;
    const where = email ? { Email: email } : { PhoneNumber: phoneNumber };
    const user = await User.findOne({ where });
    if (!user) throw { code: errorCode.NOT_FOUND.code, message: '用户不存在' };
    // 真实业务应校验验证码，这里直接重置
    user.PasswordHash = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ message: '密码重置成功' });
  } catch (err) {
    next(err);
  }
};

// 用户状态管理（禁用/启用）
exports.setUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    const user = await User.findByPk(id);
    if (!user) throw { code: errorCode.NOT_FOUND.code, message: '用户不存在' };
    user.IsActive = !!isActive;
    await user.save();
    
    // 记录用户状态变更日志
    await logOperation({
      userId: req.user.id,
      operationType: 'change_user_status',
      targetType: 'user',
      targetId: user.UserID,
      details: {
        targetUsername: user.Username,
        newStatus: isActive ? 'active' : 'inactive',
        previousStatus: !isActive ? 'active' : 'inactive'
      },
      ipAddress: getClientIP(req),
      userAgent: getUserAgent(req)
    });
    
    res.json({ message: isActive ? '用户已启用' : '用户已禁用' });
  } catch (err) {
    next(err);
  }
};
// ... existing code ...
// 更新用户所有数据（无需登录，危险操作，仅供演示）
exports.updateUserAll = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);
    if (!user) throw { code: 1004, message: '用户不存在' };
    for (const key of Object.keys(req.body)) {
      if (key !== 'UserID') {
        if (key === 'PasswordHash') {
          // 如果传入 PasswordHash，自动 hash 明文
          user.PasswordHash = await bcrypt.hash(req.body[key], 10);
        } else {
          user[key] = req.body[key];
        }
      }
    }
    await user.save();
    res.json(user);
  } catch (err) {
    next(err);
  }
};

// 获取用户列表（后台管理）
exports.getUsers = async (req, res, next) => {
  try {
    const { page = 1, pageSize = 10, keyword, status, roleId } = req.query;
    const where = {};
    if (status !== undefined) where.IsActive = status === 'active';
    if (keyword) {
      where[Op.or] = [
        { Username: { [Op.like]: `%${keyword}%` } },
        { Email: { [Op.like]: `%${keyword}%` } },
        { DisplayName: { [Op.like]: `%${keyword}%` } }
      ];
    }
    
    // 如果有角色筛选，使用子查询
    if (roleId && roleId !== '') {
      const subQuery = `SELECT DISTINCT UserID FROM UserRoles WHERE RoleID = ${roleId}`;
      where.UserID = { [Op.in]: sequelize.literal(`(${subQuery})`) };
    }
    
    // 先获取用户列表（包含角色信息）
    const { count, rows } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['PasswordHash'] },
      order: [['CreatedAt', 'DESC']],
      offset: (page - 1) * pageSize,
      limit: Number(pageSize)
    });
    
    // 为每个用户单独获取角色信息
    const usersWithRoles = await Promise.all(
      rows.map(async (user) => {
        const roles = await user.getRoles({
          attributes: ['RoleID', 'Name', 'Description']
        });
        return {
          ...user.toJSON(),
          Roles: roles
        };
      })
    );
    
    res.json({ 
      code: 0, 
      data: { 
        list: usersWithRoles, 
        total: count, 
        page: Number(page), 
        pageSize: Number(pageSize) 
      } 
    });
  } catch (err) {
    next(err);
  }
};

// 获取指定用户信息
exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id, {
      include: [{ model: Role, through: { attributes: [] } }],
      attributes: { exclude: ['PasswordHash'] }
    });
    if (!user) throw { code: errorCode.NOT_FOUND.code, message: '用户不存在' };
    res.json({ code: 0, data: user });
  } catch (err) {
    next(err);
  }
};

// 修改用户信息（管理员）
exports.updateUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) throw { code: errorCode.NOT_FOUND.code, message: '用户不存在' };
    const { username, email, displayName, bio, isActive, phoneNumber } = req.body;
    user.Username = username || user.Username;
    user.Email = email || user.Email;
    user.DisplayName = displayName || user.DisplayName;
    user.Bio = bio || user.Bio;
    user.PhoneNumber = phoneNumber || user.PhoneNumber;
    if (isActive !== undefined) user.IsActive = isActive;
    // 处理头像上传
    if (req.file) {
      const ext = path.extname(req.file.originalname) || '.png';
      const safeUsername = (user.Username || 'user').replace(/[^a-zA-Z0-9\u4e00-\u9fa5-_]/g, '').replace(/\s+/g, '');
      const timestamp = Date.now();
      const filename = `${safeUsername}_${timestamp}${ext}`;
      const uploadRootEnv = process.env.UPLOAD_PATH || 'uploads';
      const avatarImagesSubDir = path.join('avaters');
      const avatarDirEnv = process.env.UPLOAD_AVATERS_PATH || path.join(uploadRootEnv, avatarImagesSubDir);
      const avatarDir = path.isAbsolute(avatarDirEnv)
        ? avatarDirEnv
        : path.resolve(__dirname, '..', avatarDirEnv);
      if (!fs.existsSync(avatarDir)) fs.mkdirSync(avatarDir, { recursive: true });
      const savePath = path.join(avatarDir, filename);
      fs.writeFileSync(savePath, req.file.buffer);
      user.AvatarURL = `/uploads/avaters/${filename}`;
    } else if (req.body.avatarURL) {
      user.AvatarURL = req.body.avatarURL;
    }
    await user.save();
    
    // 记录管理员更新用户信息日志
    await logOperation({
      userId: req.user.id,
      operationType: 'admin_update_user',
      targetType: 'user',
      targetId: user.UserID,
      details: {
        updatedFields: Object.keys(req.body).filter(key => req.body[key] !== undefined),
        targetUsername: user.Username,
        hasAvatarUpload: !!req.file
      },
      ipAddress: getClientIP(req),
      userAgent: getUserAgent(req)
    });
    
    res.json({ code: 0, message: '用户信息更新成功', data: user });
  } catch (err) {
    next(err);
  }
};

// 删除用户
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) throw { code: errorCode.NOT_FOUND.code, message: '用户不存在' };
    if (user.UserID === req.user.id) throw { code: errorCode.PERMISSION_DENIED.code, message: '不能删除自己' };
    
    await user.destroy();
    res.json({ code: 0, message: '用户删除成功' });
  } catch (err) {
    next(err);
  }
};

// 启用/禁用用户
exports.setUserStatus = async (req, res, next) => {
  try {
    const { isActive } = req.body;
    const user = await User.findByPk(req.params.id);
    if (!user) throw { code: errorCode.NOT_FOUND.code, message: '用户不存在' };
    if (user.UserID === req.user.id) throw { code: errorCode.PERMISSION_DENIED.code, message: '不能修改自己的状态' };
    
    user.IsActive = !!isActive;
    await user.save();
    res.json({ code: 0, message: isActive ? '用户已启用' : '用户已禁用', data: user });
  } catch (err) {
    next(err);
  }
};

// 为用户分配角色（支持多角色）
exports.assignUserRoles = async (req, res, next) => {
  try {
    const { roleIds } = req.body;
    const userId = req.params.id;
    
    // 验证用户是否存在
    const user = await User.findByPk(userId);
    if (!user) {
      throw { code: errorCode.NOT_FOUND.code, message: '用户不存在' };
    }
    
    // 验证角色ID数组
    if (!Array.isArray(roleIds)) {
      throw { code: errorCode.INVALID_PARAMS.code, message: 'roleIds必须是数组格式' };
    }
    
    if (roleIds.length === 0) {
      throw { code: errorCode.INVALID_PARAMS.code, message: '至少需要分配一个角色' };
    }
    
    // 从数据库中获取所有有效的角色ID
    const allRoles = await Role.findAll({ attributes: ['RoleID', 'Name', 'Description'] });
    const validRoleIds = allRoles.map(role => role.RoleID);
    const invalidRoleIds = roleIds.filter(id => !validRoleIds.includes(id));
    
    if (invalidRoleIds.length > 0) {
      const validRoleNames = allRoles.map(role => `${role.RoleID}(${role.Name})`).join(', ');
      throw { 
        code: errorCode.INVALID_PARAMS.code, 
        message: `无效的角色ID: ${invalidRoleIds.join(', ')}。有效角色: ${validRoleNames}` 
      };
    }
    
    // 获取用户当前角色，用于日志记录
    const currentRoles = await user.getRoles();
    const currentRoleIds = currentRoles.map(role => role.RoleID);
    
    // 设置新角色（这会替换所有现有角色）
    await user.setRoles(roleIds);
    
    // 记录角色分配日志
    await logOperation({
      userId: req.user.id,
      operationType: 'assign_roles',
      targetType: 'user',
      targetId: user.UserID,
      details: {
        targetUsername: user.Username,
        previousRoleIds: currentRoleIds,
        newRoleIds: roleIds,
        roleCount: roleIds.length
      },
      ipAddress: getClientIP(req),
      userAgent: getUserAgent(req)
    });
    
    // 获取更新后的用户信息（包含角色）
    const updatedUser = await User.findByPk(user.UserID, {
      include: [{ model: Role, through: { attributes: [] }, attributes: ['RoleID', 'Name', 'Description'] }],
      attributes: { exclude: ['PasswordHash'] }
    });
    
    res.json({ 
      code: 0, 
      message: `角色分配成功，已分配 ${roleIds.length} 个角色`, 
      data: {
        user: updatedUser,
        assignedRoles: roleIds,
        roleCount: roleIds.length
      }
    });
  } catch (err) {
    next(err);
  }
};

// 移除用户角色
exports.removeUserRole = async (req, res, next) => {
  try {
    const { id, roleId } = req.params;
    const user = await User.findByPk(id);
    if (!user) throw { code: errorCode.NOT_FOUND.code, message: '用户不存在' };
    
    await user.removeRole(roleId);
    
    // 记录角色移除日志
    await logOperation({
      userId: req.user.id,
      operationType: 'remove_role',
      targetType: 'user',
      targetId: user.UserID,
      details: {
        targetUsername: user.Username,
        removedRoleId: roleId
      },
      ipAddress: getClientIP(req),
      userAgent: getUserAgent(req)
    });
    
    res.json({ code: 0, message: '角色移除成功' });
  } catch (err) {
    next(err);
  }
};

// 获取在线用户列表
exports.getOnlineUsers = async (req, res, next) => {
  try {
    // 这里可以实现基于Redis的在线用户管理
    // 暂时返回最近登录的用户
    const users = await User.findAll({
      where: {
        LastLogin: { [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) } // 24小时内登录
      },
      attributes: ['UserID', 'Username', 'DisplayName', 'LastLogin'],
      order: [['LastLogin', 'DESC']],
      limit: 50
    });
    
    res.json({ code: 0, data: users });
  } catch (err) {
    next(err);
  }
};

// 获取用户统计信息
exports.getUserStatistics = async (req, res, next) => {
  try {
    // 获取当前时间
    const now = new Date();
    
    // 计算今日开始时间（本地时间）
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // 计算本月开始时间（本地时间）
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // 直接计算用户数量，不使用include避免重复计算
    const totalUsers = await User.count();
    
    const activeUsers = await User.count({ 
      where: { IsActive: true }
    });
    
    const todayUsers = await User.count({
      where: {
        CreatedAt: { [Op.gte]: todayStart }
      }
    });
    
    const thisMonthUsers = await User.count({
      where: {
        CreatedAt: { [Op.gte]: monthStart }
      }
    });
    
    res.json({
      code: 0,
      data: {
        total: totalUsers,
        active: activeUsers,
        today: todayUsers,
        thisMonth: thisMonthUsers
      }
    });
  } catch (err) {
    next(err);
  }
};

// 批量删除用户
exports.batchDeleteUsers = async (req, res, next) => {
  try {
    const { userIds } = req.body;
    if (!userIds || !Array.isArray(userIds)) {
      throw { code: errorCode.VALIDATION_ERROR.code, message: '用户ID列表不能为空' };
    }
    
    // 不能删除自己
    if (userIds.includes(req.user.id)) {
      throw { code: errorCode.PERMISSION_DENIED.code, message: '不能删除自己' };
    }
    
    await User.destroy({ where: { UserID: { [Op.in]: userIds } } });
    res.json({ code: 0, message: `成功删除 ${userIds.length} 个用户` });
  } catch (err) {
    next(err);
  }
};

// 用户登出
exports.logout = async (req, res) => {
  try {
    // 这里可以实现基于Redis的token黑名单
    // 暂时返回成功
    res.json({ code: 0, message: '登出成功' });
  } catch (err) {
    res.status(500).json({ code: 1, message: '服务器错误', error: err.message });
  }
};
