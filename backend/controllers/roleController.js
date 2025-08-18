const { Role, User, UserRole } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const errorCode = require('../middleware/errorCode');

// 获取所有角色
exports.getRoles = async (req, res, next) => {
  try {
    const roles = await Role.findAll({
      include: [{
        model: User,
        through: { attributes: [] },
        attributes: ['UserID', 'Username']
      }],
      order: [['RoleID', 'ASC']]
    });
    res.json({ code: 0, data: roles });
  } catch (err) {
    next(err);
  }
};

// 创建角色
exports.createRole = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ code: 1, message: '参数错误', errors: errors.array() });
  
  try {
    const { name, description } = req.body;
    
    // 检查角色名是否已存在
    const existingRole = await Role.findOne({ where: { Name: name } });
    if (existingRole) {
      throw { code: errorCode.VALIDATION_ERROR.code, message: '角色名已存在' };
    }
    
    const role = await Role.create({
      Name: name,
      Description: description
    });
    
    res.status(201).json({ code: 0, message: '角色创建成功', data: role });
  } catch (err) {
    next(err);
  }
};

// 获取角色详情
exports.getRoleById = async (req, res, next) => {
  try {
    const role = await Role.findByPk(req.params.id, {
      include: [{
        model: User,
        through: { attributes: [] },
        attributes: ['UserID', 'Username', 'DisplayName']
      }]
    });
    
    if (!role) throw { code: errorCode.NOT_FOUND.code, message: '角色不存在' };
    res.json({ code: 0, data: role });
  } catch (err) {
    next(err);
  }
};

// 更新角色
exports.updateRole = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ code: 1, message: '参数错误', errors: errors.array() });
  
  try {
    const { name, description } = req.body;
    const role = await Role.findByPk(req.params.id);
    
    if (!role) throw { code: errorCode.NOT_FOUND.code, message: '角色不存在' };
    
    // 检查角色名是否已被其他角色使用
    if (name && name !== role.Name) {
      const existingRole = await Role.findOne({ where: { Name: name, RoleID: { [Op.ne]: req.params.id } } });
      if (existingRole) {
        throw { code: errorCode.VALIDATION_ERROR.code, message: '角色名已存在' };
      }
    }
    
    role.Name = name || role.Name;
    role.Description = description || role.Description;
    await role.save();
    
    res.json({ code: 0, message: '角色更新成功', data: role });
  } catch (err) {
    next(err);
  }
};

// 删除角色
exports.deleteRole = async (req, res, next) => {
  try {
    const role = await Role.findByPk(req.params.id);
    if (!role) throw { code: errorCode.NOT_FOUND.code, message: '角色不存在' };
    
    // 检查是否有用户使用此角色
    const userCount = await UserRole.count({ where: { RoleID: req.params.id } });
    if (userCount > 0) {
      throw { code: errorCode.VALIDATION_ERROR.code, message: `该角色下有 ${userCount} 个用户，无法删除` };
    }
    
    await role.destroy();
    res.json({ code: 0, message: '角色删除成功' });
  } catch (err) {
    next(err);
  }
};

// 获取角色的用户列表
exports.getRoleUsers = async (req, res, next) => {
  try {
    const role = await Role.findByPk(req.params.id);
    if (!role) throw { code: errorCode.NOT_FOUND.code, message: '角色不存在' };
    
    const users = await User.findAll({
      include: [{
        model: Role,
        where: { RoleID: req.params.id },
        through: { attributes: [] },
        attributes: []
      }],
      attributes: ['UserID', 'Username', 'DisplayName', 'Email', 'IsActive', 'CreatedAt']
    });
    
    res.json({ code: 0, data: users });
  } catch (err) {
    next(err);
  }
};

// 为角色分配权限（预留接口）
exports.assignRolePermissions = async (req, res, next) => {
  try {
    const { permissionIds } = req.body;
    // 这里可以实现权限分配逻辑
    res.json({ code: 0, message: '权限分配成功' });
  } catch (err) {
    next(err);
  }
};

// 移除角色权限（预留接口）
exports.removeRolePermission = async (req, res, next) => {
  try {
    const { id, permissionId } = req.params;
    // 这里可以实现权限移除逻辑
    res.json({ code: 0, message: '权限移除成功' });
  } catch (err) {
    next(err);
  }
}; 