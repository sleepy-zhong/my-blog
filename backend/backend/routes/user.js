const express = require('express')
const { body, param } = require('express-validator')

const authController = require('../controllers/authController')
const userController = require('../controllers/userController')
const auth = require('../middleware/auth')
const permission = require('../middleware/permission')
const { avatarUpload } = require('../middleware/uploadPolicy')
const {
  registerCodeGuard,
  registerGuard,
  loginCodeGuard,
  loginGuard,
  forgotPasswordCodeGuard,
  forgotPasswordGuard,
  changePasswordCodeGuard,
} = require('../middleware/riskControl')

const router = express.Router()

const requireAccount = body().custom((_, { req }) => {
  const hasAccount = ['account', 'email', 'phoneNumber', 'username'].some((key) => {
    const value = req.body?.[key]
    return value !== undefined && value !== null && String(value).trim() !== ''
  })

  if (!hasAccount) {
    throw new Error('请提供账号、邮箱、手机号或用户名')
  }

  return true
})

const userIdValidator = param('id').isInt({ min: 1 }).withMessage('用户 ID 不合法')

router.post(
  '/register/code',
  [body('email').isEmail().withMessage('邮箱格式不正确')],
  registerCodeGuard,
  authController.sendRegisterCode
)

router.post(
  '/register',
  [
    body('username').notEmpty().withMessage('用户名不能为空'),
    body('email').isEmail().withMessage('邮箱格式不正确'),
    body('password').isLength({ min: 6 }).withMessage('密码至少 6 位'),
    body('code').notEmpty().withMessage('验证码不能为空'),
  ],
  registerGuard,
  authController.register
)

router.post(
  '/login/code',
  [
    requireAccount,
    body('email').optional().isEmail().withMessage('邮箱格式不正确'),
    body('password').notEmpty().withMessage('密码不能为空'),
  ],
  loginCodeGuard,
  authController.sendLoginCode
)

router.post(
  '/login',
  [
    requireAccount,
    body('email').optional().isEmail().withMessage('邮箱格式不正确'),
    body('password').notEmpty().withMessage('密码不能为空'),
    body('code').notEmpty().withMessage('验证码不能为空'),
  ],
  loginGuard,
  authController.login
)

router.post('/refresh', authController.refresh)

router.get('/me', auth, userController.getMe)

router.put('/me', auth, avatarUpload, userController.updateMe)

router.put('/me/password/code', auth, changePasswordCodeGuard, authController.sendChangePasswordCode)

router.put(
  '/me/password',
  auth,
  [
    body('oldPassword').notEmpty().withMessage('原密码不能为空'),
    body('newPassword').isLength({ min: 6 }).withMessage('新密码至少 6 位'),
    body('code').notEmpty().withMessage('验证码不能为空'),
  ],
  authController.changePassword
)

router.put(
  '/me/email',
  auth,
  [body('email').isEmail().withMessage('邮箱格式不正确')],
  userController.updateEmail
)

router.post(
  '/forgot-password/code',
  [body('email').isEmail().withMessage('邮箱格式不正确')],
  forgotPasswordCodeGuard,
  authController.sendForgotPasswordCode
)

router.post(
  '/forgot-password',
  [
    body('email').isEmail().withMessage('邮箱格式不正确'),
    body('code').notEmpty().withMessage('验证码不能为空'),
    body('newPassword').isLength({ min: 6 }).withMessage('新密码至少 6 位'),
  ],
  forgotPasswordGuard,
  authController.forgotPassword
)

router.post('/logout', auth, authController.logout)

router.get('/online', auth, permission.isAdmin, userController.getOnlineUsers)

router.get('/statistics', auth, permission.isAdmin, userController.getUserStatistics)

router.post(
  '/batch-delete',
  auth,
  permission.isAdmin,
  [body('userIds').isArray({ min: 1 }).withMessage('用户 ID 列表不能为空')],
  userController.batchDeleteUsers
)

router.post(
  '/',
  auth,
  permission.isAdmin,
  [
    body('username').notEmpty().withMessage('用户名不能为空'),
    body('email').isEmail().withMessage('邮箱格式不正确'),
    body('password').isLength({ min: 6 }).withMessage('密码至少 6 位'),
  ],
  userController.createUserByAdmin
)

router.get('/', auth, permission.isAdmin, userController.getUsers)

router.post('/:id/offline', auth, permission.isAdmin, userIdValidator, userController.forceOfflineUser)

router.get('/:id', auth, permission.isAdmin, userIdValidator, userController.getUserById)

router.put('/:id', auth, permission.isAdmin, userIdValidator, avatarUpload, userController.updateUser)

router.delete('/:id', auth, permission.isAdmin, userIdValidator, userController.deleteUser)

router.put(
  '/:id/status',
  auth,
  permission.isAdmin,
  [userIdValidator, body('isActive').isBoolean().withMessage('状态参数不合法')],
  userController.setUserStatus
)

router.post(
  '/:id/roles',
  auth,
  permission.isAdmin,
  [userIdValidator, body('roleIds').isArray({ min: 1 }).withMessage('角色列表不能为空')],
  userController.assignUserRoles
)

router.delete(
  '/:id/roles/:roleId',
  auth,
  permission.isAdmin,
  [userIdValidator, param('roleId').isInt({ min: 1 }).withMessage('角色 ID 不合法')],
  userController.removeUserRole
)

router.put('/:id/all', auth, permission.isAdmin, userIdValidator, userController.updateUserAll)

module.exports = router
