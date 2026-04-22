const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { Op, fn, col } = require('sequelize');
const { validationResult } = require('express-validator');
const sequelize = require('../config/db');
const errorCode = require('../middleware/errorCode');
const { User, Role, VerificationCode, TokenBlacklist, AuthSession } = require('../models');
const { sendMail } = require('../utils/mailer');
const { logOperation, getClientIP, getUserAgent } = require('../utils/logger');
const {
  createAccessToken,
  getTokenExpiryDate,
  hashToken,
  setAuthCookie,
  clearAuthCookie,
  revokeUserSessions,
  bumpUserSessionVersion,
  getOnlineThresholdDate
} = require('../utils/authSession');

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function normalizeString(value) {
  return String(value || '').trim();
}

function createVerificationCodeValue() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function getPasswordRounds() {
  const rounds = Number(process.env.BCRYPT_ROUNDS || 10);
  return Number.isInteger(rounds) && rounds >= 8 ? rounds : 10;
}

function createControllerError(status, message, data = null, code = 1) {
  return {
    status,
    code,
    message,
    data
  };
}

function ensureValidRequest(req, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    next(createControllerError(400, '参数错误', errors.array(), errorCode.VALIDATION_ERROR.code));
    return false;
  }

  return true;
}

function sendCreated(res, data, message) {
  return res.status(201).json({
    code: 0,
    message,
    data
  });
}

function sanitizeUser(user) {
  if (!user) return null;

  const plainUser = typeof user.toJSON === 'function' ? user.toJSON() : { ...user };
  delete plainUser.PasswordHash;

  if (Array.isArray(plainUser.Roles)) {
    plainUser.Roles = plainUser.Roles.map(role => {
      if (!role) return role;
      if (typeof role === 'string') {
        return { Name: role };
      }

      return typeof role.toJSON === 'function' ? role.toJSON() : { ...role };
    }).filter(Boolean);
  }

  return plainUser;
}

async function getDefaultRoleId(transaction) {
  const defaultRole = await Role.findOne({
    where: { Name: 'user' },
    attributes: ['RoleID'],
    transaction
  });

  return defaultRole?.RoleID || 4;
}

async function findUserWithRoles(userId) {
  return User.findByPk(userId, {
    attributes: { exclude: ['PasswordHash'] },
    include: [
      {
        model: Role,
        through: { attributes: [] },
        attributes: ['RoleID', 'Name', 'Description']
      }
    ]
  });
}

function getAvatarDirectory() {
  const uploadRootEnv = process.env.UPLOAD_PATH || 'uploads';
  const avatarDirEnv = process.env.UPLOAD_AVATERS_PATH || path.join(uploadRootEnv, 'avaters');

  return path.isAbsolute(avatarDirEnv)
    ? avatarDirEnv
    : path.resolve(__dirname, '..', avatarDirEnv);
}

function saveAvatarFile(user, file) {
  const avatarDir = getAvatarDirectory();
  if (!fs.existsSync(avatarDir)) {
    fs.mkdirSync(avatarDir, { recursive: true });
  }

  const ext = path.extname(file.originalname) || '.png';
  const safeUsername = normalizeString(user.Username || 'user')
    .replace(/[^a-zA-Z0-9\u4e00-\u9fa5-_]/g, '')
    .replace(/\s+/g, '') || 'user';
  const filename = `${safeUsername}_${Date.now()}${ext}`;
  const savePath = path.join(avatarDir, filename);

  fs.writeFileSync(savePath, file.buffer);
  return `/uploads/avaters/${filename}`;
}

async function logUserAction(req, payload) {
  try {
    await logOperation({
      ipAddress: getClientIP(req),
      userAgent: getUserAgent(req),
      ...payload
    });
  } catch (_err) {
    // 日志失败不阻断主流程
  }
}

async function buildOnlineStateMap(userIds) {
  if (!Array.isArray(userIds) || userIds.length === 0) {
    return new Map();
  }

  const sessionRows = await AuthSession.findAll({
    where: {
      UserID: { [Op.in]: userIds },
      Status: 'active',
      ExpiresAt: { [Op.gt]: new Date() }
    },
    attributes: [
      'UserID',
      [fn('COUNT', col('SessionID')), 'ActiveSessions'],
      [fn('MAX', col('LastSeenAt')), 'LastSeenAt']
    ],
    group: ['UserID'],
    raw: true
  });

  const onlineThreshold = getOnlineThresholdDate().getTime();
  const stateMap = new Map();

  for (const row of sessionRows) {
    const userId = Number(row.UserID);
    const activeSessions = Number(row.ActiveSessions || 0);
    const lastSeenAt = row.LastSeenAt ? new Date(row.LastSeenAt) : null;
    const onlineStatus = lastSeenAt && lastSeenAt.getTime() >= onlineThreshold ? 'online' : 'offline';

    stateMap.set(userId, {
      ActiveSessions: activeSessions,
      LastSeenAt: lastSeenAt,
      OnlineStatus: onlineStatus
    });
  }

  return stateMap;
}

function mergeOnlineState(user, stateMap) {
  const plainUser = sanitizeUser(user);
  const onlineState = stateMap.get(Number(plainUser.UserID));

  plainUser.ActiveSessions = onlineState?.ActiveSessions || 0;
  plainUser.LastSeenAt = onlineState?.LastSeenAt || plainUser.LastSeenAt || null;
  plainUser.OnlineStatus = onlineState?.OnlineStatus || 'offline';

  return plainUser;
}

exports.register = async (req, res, next) => {
  if (!ensureValidRequest(req, next)) return;

  const transaction = await sequelize.transaction();

  try {
    const username = normalizeString(req.body.username);
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || '');
    const phoneNumber = normalizeString(req.body.phoneNumber) || null;

    const [existUsername, existEmail, existPhone] = await Promise.all([
      User.findOne({ where: { Username: username }, transaction }),
      User.findOne({ where: { Email: email }, transaction }),
      phoneNumber ? User.findOne({ where: { PhoneNumber: phoneNumber }, transaction }) : Promise.resolve(null)
    ]);

    if (existUsername) {
      await transaction.rollback();
      return next(createControllerError(400, '??????'));
    }

    if (existEmail) {
      await transaction.rollback();
      return next(createControllerError(400, '?????'));
    }

    if (existPhone) {
      await transaction.rollback();
      return next(createControllerError(400, '??????'));
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      Username: username,
      Email: email,
      PasswordHash: passwordHash,
      PhoneNumber: phoneNumber
    }, { transaction });

    const defaultRoleId = await getDefaultRoleId(transaction);
    await user.setRoles([defaultRoleId], { transaction });
    await transaction.commit();

    await logUserAction(req, {
      userId: user.UserID,
      operationType: 'register',
      targetType: 'user',
      targetId: user.UserID,
      details: {
        username: user.Username,
        email: user.Email,
        phoneNumber: user.PhoneNumber,
        roleIds: [defaultRoleId]
      }
    });

    return sendCreated(res, {
      UserID: user.UserID,
      Username: user.Username,
      Email: user.Email
    }, '????');
  } catch (err) {
    if (!transaction.finished) {
      await transaction.rollback();
    }

    return next(createControllerError(500, '?????', err.message, errorCode.SYSTEM_ERROR.code));
  }
};

exports.login = async (req, res, next) => {
  if (!ensureValidRequest(req, next)) return;

  try {
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || '');
    const phoneNumber = normalizeString(req.body.phoneNumber);
    const username = normalizeString(req.body.username);

    const where = email
      ? { Email: email }
      : phoneNumber
        ? { PhoneNumber: phoneNumber }
        : { Username: username };

    const user = await User.findOne({
      where,
      include: [{ model: Role, through: { attributes: [] } }]
    });

    if (!user) {
      return next(createControllerError(400, '?????'));
    }

    if (!user.IsActive) {
      return next(createControllerError(403, '?????????????'));
    }

    const isMatch = await bcrypt.compare(password, user.PasswordHash);
    if (!isMatch) {
      return next(createControllerError(400, '????'));
    }

    user.LastLogin = new Date();
    await user.save();

    const token = createAccessToken(user);
    setAuthCookie(res, req, token);

    await logUserAction(req, {
      userId: user.UserID,
      operationType: 'login',
      targetType: 'user',
      targetId: user.UserID,
      details: {
        username: user.Username,
        loginMethod: email ? 'email' : phoneNumber ? 'phone' : 'username'
      }
    });

    return res.success({ authenticated: true }, '????');
  } catch (err) {
    return next(createControllerError(500, '?????', err.message, errorCode.SYSTEM_ERROR.code));
  }
};

exports.getMe = async (req, res, next) => {
  try {
    const user = await findUserWithRoles(req.user.id);
    if (!user) {
      throw { code: errorCode.NOT_FOUND.code, message: '用户不存在' };
    }

    const stateMap = await buildOnlineStateMap([Number(user.UserID)]);
    res.json({ code: 0, data: mergeOnlineState(user, stateMap) });
  } catch (err) {
    next(err);
  }
};

exports.updateMe = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      throw { code: errorCode.NOT_FOUND.code, message: '用户不存在' };
    }

    const displayName = req.body.displayName;
    const bio = req.body.bio;
    const phoneNumber = req.body.phoneNumber;

    if (displayName !== undefined) user.DisplayName = displayName;
    if (bio !== undefined) user.Bio = bio;

    if (phoneNumber !== undefined) {
      const normalizedPhone = normalizeString(phoneNumber) || null;
      if (normalizedPhone && normalizedPhone !== user.PhoneNumber) {
        const existPhone = await User.findOne({
          where: {
            PhoneNumber: normalizedPhone,
            UserID: { [Op.ne]: user.UserID }
          }
        });

        if (existPhone) {
          return res.status(400).json({ code: 1, message: '手机号已被占用' });
        }
      }

      user.PhoneNumber = normalizedPhone;
    }

    if (req.file) {
      user.AvatarURL = saveAvatarFile(user, req.file);
    } else if (req.body.avatarURL) {
      user.AvatarURL = req.body.avatarURL;
    }

    await user.save();

    await logUserAction(req, {
      userId: req.user.id,
      operationType: 'update_profile',
      targetType: 'user',
      targetId: req.user.id,
      details: {
        updatedFields: Object.keys(req.body).filter(key => req.body[key] !== undefined),
        hasAvatarUpload: !!req.file
      }
    });

    const updatedUser = await findUserWithRoles(req.user.id);
    res.json({
      code: 0,
      message: '个人信息更新成功',
      data: {
        code: 0,
        data: sanitizeUser(updatedUser)
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const oldPassword = String(req.body.oldPassword || '');
    const newPassword = String(req.body.newPassword || '');
    const user = await User.findByPk(req.user.id);

    if (!user) {
      throw { code: errorCode.NOT_FOUND.code, message: '用户不存在' };
    }

    const isMatch = await bcrypt.compare(oldPassword, user.PasswordHash);
    if (!isMatch) {
      throw { code: errorCode.PERMISSION_DENIED.code, message: '原密码错误' };
    }

    user.PasswordHash = await bcrypt.hash(newPassword, 10);
    await user.save();

    await logUserAction(req, {
      userId: req.user.id,
      operationType: 'change_password',
      targetType: 'user',
      targetId: req.user.id,
      details: { passwordChanged: true }
    });

    res.json({ code: 0, message: '密码修改成功' });
  } catch (err) {
    next(err);
  }
};

exports.updateEmail = async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body.email);
    if (!email) {
      return res.status(400).json({ code: 1, message: '邮箱不能为空' });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
      throw { code: errorCode.NOT_FOUND.code, message: '用户不存在' };
    }

    const existEmail = await User.findOne({
      where: {
        Email: email,
        UserID: { [Op.ne]: user.UserID }
      }
    });

    if (existEmail) {
      return res.status(400).json({ code: 1, message: '邮箱已被占用' });
    }

    user.Email = email;
    await user.save();

    await logUserAction(req, {
      userId: req.user.id,
      operationType: 'change_email',
      targetType: 'user',
      targetId: req.user.id,
      details: { newEmail: email }
    });

    res.json({ code: 0, message: '邮箱更新成功' });
  } catch (err) {
    next(err);
  }
};

exports.sendForgotPasswordCode = async (req, res, next) => {
  if (!ensureValidRequest(req, next)) return;

  try {
    const email = normalizeEmail(req.body.email);
    const user = await User.findOne({
      where: { Email: email },
      attributes: ['UserID', 'Email', 'IsActive']
    });

    if (!user || !user.IsActive) {
      return res.success(null, '????????????????????');
    }

    const latestCode = await VerificationCode.findOne({
      where: { Email: email, Scene: 'forgot_password' },
      order: [['CreatedAt', 'DESC']]
    });

    if (latestCode?.CreatedAt && Date.now() - new Date(latestCode.CreatedAt).getTime() < 60 * 1000) {
      return next(createControllerError(429, '??????????? 1 ?????'));
    }

    await VerificationCode.update(
      { Used: true },
      { where: { Email: email, Scene: 'forgot_password', Used: false } }
    );

    const code = createVerificationCodeValue();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const verification = await VerificationCode.create({
      Email: email,
      Code: code,
      Scene: 'forgot_password',
      ExpiresAt: expiresAt,
      Used: false,
      UserID: user.UserID
    });

    try {
      await sendMail(
        email,
        '???????',
        '<div style="font-family:Arial,sans-serif;line-height:1.7;">' +
          '<p>???????????</p>' +
          '<p style="font-size:24px;font-weight:700;letter-spacing:4px;">' + code + '</p>' +
          '<p>10 ??????????????</p>' +
        '</div>'
      );
    } catch (mailError) {
      await verification.destroy();
      return next(createControllerError(500, '???????????????', mailError.message, errorCode.SYSTEM_ERROR.code));
    }

    return res.success(null, '????????????????????');
  } catch (err) {
    return next(createControllerError(500, '?????', err.message, errorCode.SYSTEM_ERROR.code));
  }
};

exports.forgotPassword = async (req, res, next) => {
  if (!ensureValidRequest(req, next)) return;

  const transaction = await sequelize.transaction();

  try {
    const email = normalizeEmail(req.body.email);
    const code = normalizeString(req.body.code);
    const newPassword = String(req.body.newPassword || '');

    const verification = await VerificationCode.findOne({
      where: {
        Email: email,
        Code: code,
        Scene: 'forgot_password',
        Used: false,
        ExpiresAt: { [Op.gt]: new Date() }
      },
      order: [['CreatedAt', 'DESC']],
      transaction
    });

    if (!verification) {
      await transaction.rollback();
      return next(createControllerError(400, '?????????'));
    }

    const user = await User.findOne({
      where: { Email: email },
      transaction
    });

    if (!user) {
      await transaction.rollback();
      return next(createControllerError(404, '?????', null, errorCode.NOT_FOUND.code));
    }

    user.PasswordHash = await bcrypt.hash(newPassword, 10);
    verification.Used = true;

    await user.save({ transaction });
    await verification.save({ transaction });
    await transaction.commit();

    await logUserAction(req, {
      userId: user.UserID,
      operationType: 'reset_password',
      targetType: 'user',
      targetId: user.UserID,
      details: { email: user.Email, scene: 'forgot_password' }
    });

    return res.success(null, '??????');
  } catch (err) {
    if (!transaction.finished) {
      await transaction.rollback();
    }

    return next(createControllerError(500, '?????', err.message, errorCode.SYSTEM_ERROR.code));
  }
};

exports.createUserByAdmin = async (req, res, next) => {
  if (!ensureValidRequest(req, next)) return;

  const transaction = await sequelize.transaction();

  try {
    const username = normalizeString(req.body.username);
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || '');
    const phoneNumber = normalizeString(req.body.phoneNumber) || null;
    const displayName = normalizeString(req.body.displayName) || null;
    const bio = normalizeString(req.body.bio) || null;
    const isActive = req.body.isActive === undefined ? true : !!req.body.isActive;
    const roleIds = Array.isArray(req.body.roleIds)
      ? req.body.roleIds.map(Number).filter(Boolean)
      : [];

    if (!username || !email || !password) {
      await transaction.rollback();
      return next(createControllerError(400, '?????????????'));
    }

    if (password.length < 6) {
      await transaction.rollback();
      return next(createControllerError(400, '???? 6 ?'));
    }

    const [existUsername, existEmail, existPhone] = await Promise.all([
      User.findOne({ where: { Username: username }, transaction }),
      User.findOne({ where: { Email: email }, transaction }),
      phoneNumber ? User.findOne({ where: { PhoneNumber: phoneNumber }, transaction }) : Promise.resolve(null)
    ]);

    if (existUsername) {
      await transaction.rollback();
      return next(createControllerError(400, '??????'));
    }

    if (existEmail) {
      await transaction.rollback();
      return next(createControllerError(400, '??????'));
    }

    if (existPhone) {
      await transaction.rollback();
      return next(createControllerError(400, '??????'));
    }

    const passwordHash = await bcrypt.hash(password, getPasswordRounds());
    const user = await User.create({
      Username: username,
      Email: email,
      PasswordHash: passwordHash,
      PhoneNumber: phoneNumber,
      DisplayName: displayName,
      Bio: bio,
      IsActive: isActive,
      SessionVersion: 1,
      LastSeenAt: null
    }, { transaction });

    const resolvedRoleIds = roleIds.length > 0 ? roleIds : [await getDefaultRoleId(transaction)];
    await user.setRoles(resolvedRoleIds, { transaction });
    await transaction.commit();

    await logUserAction(req, {
      userId: req.user.id,
      operationType: 'admin_create_user',
      targetType: 'user',
      targetId: user.UserID,
      details: {
        username: user.Username,
        email: user.Email,
        roleIds: resolvedRoleIds
      }
    });

    const createdUser = await findUserWithRoles(user.UserID);
    return sendCreated(res, sanitizeUser(createdUser), '??????');
  } catch (err) {
    if (!transaction.finished) {
      await transaction.rollback();
    }

    return next(createControllerError(500, '?????', err.message, errorCode.SYSTEM_ERROR.code));
  }
};

exports.getUsers = async (req, res, next) => {
  try {
    const page = Number(req.query.page || 1);
    const pageSize = Number(req.query.pageSize || 10);
    const keyword = normalizeString(req.query.keyword);
    const status = req.query.status;
    const roleId = req.query.roleId;

    const where = {};
    if (status !== undefined && status !== '') {
      where.IsActive = status === 'active';
    }

    if (keyword) {
      where[Op.or] = [
        { Username: { [Op.like]: `%${keyword}%` } },
        { Email: { [Op.like]: `%${keyword}%` } },
        { DisplayName: { [Op.like]: `%${keyword}%` } }
      ];
    }

    const include = [
      {
        model: Role,
        through: { attributes: [] },
        attributes: ['RoleID', 'Name', 'Description'],
        ...(roleId ? { where: { RoleID: Number(roleId) } } : {})
      }
    ];

    const { count, rows } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['PasswordHash'] },
      include,
      distinct: true,
      order: [['CreatedAt', 'DESC']],
      offset: (page - 1) * pageSize,
      limit: pageSize
    });

    const stateMap = await buildOnlineStateMap(rows.map(user => Number(user.UserID)));

    res.json({
      code: 0,
      data: {
        list: rows.map(user => mergeOnlineState(user, stateMap)),
        total: count,
        page,
        pageSize
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.getUserById = async (req, res, next) => {
  try {
    const user = await findUserWithRoles(req.params.id);
    if (!user) {
      throw { code: errorCode.NOT_FOUND.code, message: '用户不存在' };
    }

    const stateMap = await buildOnlineStateMap([Number(user.UserID)]);
    res.json({ code: 0, data: mergeOnlineState(user, stateMap) });
  } catch (err) {
    next(err);
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      throw { code: errorCode.NOT_FOUND.code, message: '用户不存在' };
    }

    const wasActive = !!user.IsActive;
    const username = req.body.username !== undefined ? normalizeString(req.body.username) : undefined;
    const email = req.body.email !== undefined ? normalizeEmail(req.body.email) : undefined;
    const phoneNumber = req.body.phoneNumber !== undefined ? normalizeString(req.body.phoneNumber) || null : undefined;

    if (username && username !== user.Username) {
      const existUsername = await User.findOne({
        where: {
          Username: username,
          UserID: { [Op.ne]: user.UserID }
        }
      });

      if (existUsername) {
        return res.status(400).json({ code: 1, message: '用户名已存在' });
      }
    }

    if (email && email !== user.Email) {
      const existEmail = await User.findOne({
        where: {
          Email: email,
          UserID: { [Op.ne]: user.UserID }
        }
      });

      if (existEmail) {
        return res.status(400).json({ code: 1, message: '邮箱已被占用' });
      }
    }

    if (phoneNumber && phoneNumber !== user.PhoneNumber) {
      const existPhone = await User.findOne({
        where: {
          PhoneNumber: phoneNumber,
          UserID: { [Op.ne]: user.UserID }
        }
      });

      if (existPhone) {
        return res.status(400).json({ code: 1, message: '手机号已被占用' });
      }
    }

    if (username !== undefined) user.Username = username || user.Username;
    if (email !== undefined) user.Email = email || user.Email;
    if (req.body.displayName !== undefined) user.DisplayName = req.body.displayName;
    if (req.body.bio !== undefined) user.Bio = req.body.bio;
    if (phoneNumber !== undefined) user.PhoneNumber = phoneNumber;
    if (req.body.isActive !== undefined) user.IsActive = !!req.body.isActive;

    if (req.file) {
      user.AvatarURL = saveAvatarFile(user, req.file);
    } else if (req.body.avatarURL) {
      user.AvatarURL = req.body.avatarURL;
    }

    await user.save();

    if (wasActive && !user.IsActive) {
      await Promise.all([
        revokeUserSessions(user.UserID, 'admin_disabled_user'),
        bumpUserSessionVersion(user.UserID)
      ]);
    }

    await logUserAction(req, {
      userId: req.user.id,
      operationType: 'admin_update_user',
      targetType: 'user',
      targetId: user.UserID,
      details: {
        targetUsername: user.Username,
        updatedFields: Object.keys(req.body).filter(key => req.body[key] !== undefined),
        hasAvatarUpload: !!req.file
      }
    });

    const updatedUser = await findUserWithRoles(user.UserID);
    const stateMap = await buildOnlineStateMap([Number(user.UserID)]);
    res.json({ code: 0, message: '用户信息更新成功', data: mergeOnlineState(updatedUser, stateMap) });
  } catch (err) {
    next(err);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      throw { code: errorCode.NOT_FOUND.code, message: '用户不存在' };
    }

    if (user.UserID === req.user.id) {
      throw { code: errorCode.PERMISSION_DENIED.code, message: '不能删除自己' };
    }

    await revokeUserSessions(user.UserID, 'user_deleted');
    await user.destroy();
    res.json({ code: 0, message: '用户删除成功' });
  } catch (err) {
    next(err);
  }
};

exports.setUserStatus = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ code: errorCode.VALIDATION_ERROR.code, message: '参数错误', errors: errors.array() });
    }

    const user = await User.findByPk(req.params.id);
    if (!user) {
      throw { code: errorCode.NOT_FOUND.code, message: '用户不存在' };
    }

    if (user.UserID === req.user.id) {
      throw { code: errorCode.PERMISSION_DENIED.code, message: '不能修改自己的状态' };
    }

    const wasActive = !!user.IsActive;
    user.IsActive = !!req.body.isActive;
    await user.save();

    if (wasActive && !user.IsActive) {
      await Promise.all([
        revokeUserSessions(user.UserID, 'admin_disabled_user'),
        bumpUserSessionVersion(user.UserID)
      ]);
    }

    await logUserAction(req, {
      userId: req.user.id,
      operationType: 'change_user_status',
      targetType: 'user',
      targetId: user.UserID,
      details: {
        targetUsername: user.Username,
        newStatus: user.IsActive ? 'active' : 'inactive'
      }
    });

    res.json({ code: 0, message: user.IsActive ? '用户已启用' : '用户已禁用', data: sanitizeUser(user) });
  } catch (err) {
    next(err);
  }
};

exports.updateUserAll = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      throw { code: errorCode.NOT_FOUND.code, message: '用户不存在' };
    }

    const wasActive = !!user.IsActive;
    let passwordChanged = false;

    for (const [key, value] of Object.entries(req.body || {})) {
      if (key === 'UserID') continue;

      if (key === 'PasswordHash' || key === 'password') {
        user.PasswordHash = await bcrypt.hash(String(value || ''), getPasswordRounds());
        passwordChanged = true;
        continue;
      }

      if (key in user.dataValues) {
        user[key] = value;
      }
    }

    await user.save();

    if ((wasActive && !user.IsActive) || passwordChanged) {
      await Promise.all([
        revokeUserSessions(
          user.UserID,
          passwordChanged ? 'admin_reset_password' : 'admin_disabled_user'
        ),
        bumpUserSessionVersion(user.UserID)
      ]);
    }

    const updatedUser = await findUserWithRoles(user.UserID);
    const stateMap = await buildOnlineStateMap([Number(user.UserID)]);
    res.json({ code: 0, message: '用户信息更新成功', data: mergeOnlineState(updatedUser, stateMap) });
  } catch (err) {
    next(err);
  }
};

exports.assignUserRoles = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ code: errorCode.VALIDATION_ERROR.code, message: '参数错误', errors: errors.array() });
    }

    const roleIds = Array.isArray(req.body.roleIds) ? req.body.roleIds.map(Number).filter(Boolean) : [];
    if (roleIds.length === 0) {
      throw { code: errorCode.INVALID_PARAMS.code, message: '至少需要分配一个角色' };
    }

    const user = await User.findByPk(req.params.id);
    if (!user) {
      throw { code: errorCode.NOT_FOUND.code, message: '用户不存在' };
    }

    const roles = await Role.findAll({
      where: { RoleID: { [Op.in]: roleIds } },
      attributes: ['RoleID', 'Name', 'Description']
    });

    if (roles.length !== roleIds.length) {
      throw { code: errorCode.INVALID_PARAMS.code, message: '存在无效的角色 ID' };
    }

    const currentRoles = await user.getRoles({ attributes: ['RoleID'] });
    await user.setRoles(roleIds);

    await logUserAction(req, {
      userId: req.user.id,
      operationType: 'assign_roles',
      targetType: 'user',
      targetId: user.UserID,
      details: {
        targetUsername: user.Username,
        previousRoleIds: currentRoles.map(role => role.RoleID),
        newRoleIds: roleIds
      }
    });

    const updatedUser = await findUserWithRoles(user.UserID);
    res.json({
      code: 0,
      message: `角色分配成功，已分配 ${roleIds.length} 个角色`,
      data: {
        user: sanitizeUser(updatedUser),
        assignedRoles: roleIds,
        roleCount: roleIds.length
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.removeUserRole = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      throw { code: errorCode.NOT_FOUND.code, message: '用户不存在' };
    }

    await user.removeRole(req.params.roleId);

    await logUserAction(req, {
      userId: req.user.id,
      operationType: 'remove_role',
      targetType: 'user',
      targetId: user.UserID,
      details: {
        targetUsername: user.Username,
        removedRoleId: Number(req.params.roleId)
      }
    });

    res.json({ code: 0, message: '角色移除成功' });
  } catch (err) {
    next(err);
  }
};

exports.getOnlineUsers = async (req, res, next) => {
  try {
    const onlineThreshold = getOnlineThresholdDate();
    const sessionRows = await AuthSession.findAll({
      where: {
        Status: 'active',
        ExpiresAt: { [Op.gt]: new Date() },
        LastSeenAt: { [Op.gte]: onlineThreshold }
      },
      attributes: [
        'UserID',
        [fn('COUNT', col('SessionID')), 'ActiveSessions'],
        [fn('MAX', col('LastSeenAt')), 'LastSeenAt']
      ],
      group: ['UserID'],
      order: [[fn('MAX', col('LastSeenAt')), 'DESC']],
      raw: true
    });

    const userIds = sessionRows.map(row => Number(row.UserID));
    if (userIds.length === 0) {
      return res.json({ code: 0, data: [] });
    }

    const users = await User.findAll({
      where: { UserID: { [Op.in]: userIds } },
      attributes: ['UserID', 'Username', 'DisplayName', 'AvatarURL', 'Email', 'PhoneNumber', 'LastSeenAt', 'LastLogin', 'IsActive'],
      include: [
        {
          model: Role,
          through: { attributes: [] },
          attributes: ['RoleID', 'Name', 'Description']
        }
      ]
    });

    const stateMap = new Map();
    for (const row of sessionRows) {
      const lastSeenAt = row.LastSeenAt ? new Date(row.LastSeenAt) : null;
      stateMap.set(Number(row.UserID), {
        ActiveSessions: Number(row.ActiveSessions || 0),
        LastSeenAt: lastSeenAt,
        OnlineStatus: 'online'
      });
    }

    const sortedUsers = users.sort((left, right) => {
      const leftTime = stateMap.get(Number(left.UserID))?.LastSeenAt?.getTime?.() || 0;
      const rightTime = stateMap.get(Number(right.UserID))?.LastSeenAt?.getTime?.() || 0;
      return rightTime - leftTime;
    });

    res.json({ code: 0, data: sortedUsers.map(user => mergeOnlineState(user, stateMap)) });
  } catch (err) {
    next(err);
  }
};

exports.getUserStatistics = async (_req, res, next) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalUsers, activeUsers, todayUsers, thisMonthUsers, onlineUsers] = await Promise.all([
      User.count(),
      User.count({ where: { IsActive: true } }),
      User.count({ where: { CreatedAt: { [Op.gte]: todayStart } } }),
      User.count({ where: { CreatedAt: { [Op.gte]: monthStart } } }),
      AuthSession.count({
        distinct: true,
        col: 'UserID',
        where: {
          Status: 'active',
          ExpiresAt: { [Op.gt]: new Date() },
          LastSeenAt: { [Op.gte]: getOnlineThresholdDate() }
        }
      })
    ]);

    res.json({
      code: 0,
      data: {
        total: totalUsers,
        active: activeUsers,
        enabled: activeUsers,
        online: onlineUsers,
        today: todayUsers,
        thisMonth: thisMonthUsers
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.batchDeleteUsers = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ code: errorCode.VALIDATION_ERROR.code, message: '参数错误', errors: errors.array() });
    }

    const userIds = Array.isArray(req.body.userIds) ? req.body.userIds.map(Number).filter(Boolean) : [];
    if (userIds.length === 0) {
      throw { code: errorCode.VALIDATION_ERROR.code, message: '用户 ID 列表不能为空' };
    }

    if (userIds.includes(req.user.id)) {
      throw { code: errorCode.PERMISSION_DENIED.code, message: '不能删除自己' };
    }

    await Promise.all(userIds.map(userId => revokeUserSessions(userId, 'batch_delete_users')));
    await User.destroy({ where: { UserID: { [Op.in]: userIds } } });
    return res.json({ code: 0, message: `成功删除 ${userIds.length} 个用户` });
    res.json({ code: 0, message: `成功删除 ${userIds.length} 个用户` });
  } catch (err) {
    next(err);
  }
};

exports.forceOfflineUser = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ code: errorCode.VALIDATION_ERROR.code, message: '参数错误', errors: errors.array() });
    }

    const user = await User.findByPk(req.params.id);
    if (!user) {
      throw { code: errorCode.NOT_FOUND.code, message: '用户不存在' };
    }

    if (user.UserID === req.user.id) {
      throw { code: errorCode.PERMISSION_DENIED.code, message: '不能强制下线自己' };
    }

    const revokedSessions = await revokeUserSessions(user.UserID, 'admin_force_offline');

    await logUserAction(req, {
      userId: req.user.id,
      operationType: 'force_offline_user',
      targetType: 'user',
      targetId: user.UserID,
      details: {
        targetUsername: user.Username,
        revokedSessions
      }
    });

    const updatedUser = await findUserWithRoles(user.UserID);
    const stateMap = await buildOnlineStateMap([Number(user.UserID)]);
    res.json({
      code: 0,
      message: revokedSessions > 0 ? '已强制用户下线' : '用户当前没有在线会话',
      data: {
        user: mergeOnlineState(updatedUser, stateMap),
        revokedSessions
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.logout = async (req, res, next) => {
  try {
    const token = req.authToken;
    clearAuthCookie(res, req);

    if (token) {
      await TokenBlacklist.findOrCreate({
        where: { TokenHash: hashToken(token) },
        defaults: {
          UserID: req.user?.id || null,
          ExpiresAt: getTokenExpiryDate(token)
        }
      });
    }

    if (req.user?.id) {
      await logUserAction(req, {
        userId: req.user.id,
        operationType: 'logout',
        targetType: 'user',
        targetId: req.user.id,
        details: { username: req.user.username }
      });
    }

    return res.success(null, '??????');
  } catch (err) {
    return next(createControllerError(500, '?????', err.message, errorCode.SYSTEM_ERROR.code));
  }
};
