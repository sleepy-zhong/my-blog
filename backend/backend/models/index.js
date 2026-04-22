const sequelize = require('../config/db')
const User = require('./User')
const Role = require('./Role')
const Article = require('./Article')
const Comment = require('./Comment')
const Category = require('./Category')
const Tag = require('./Tag')
const Attachment = require('./Attachment')
const HomeCat = require('./HomeCat')
const SiteSetting = require('./SiteSetting')
const OperationLog = require('./OperationLog')
const PostRevision = require('./PostRevision')
const PostLike = require('./PostLike')
const PostFavorite = require('./PostFavorite')
const VerificationCode = require('./VerificationCode')
const TokenBlacklist = require('./TokenBlacklist')
const AuthSession = require('./AuthSession')

// User <-> Role
const UserRole = sequelize.define('UserRole', {}, { tableName: 'userroles', timestamps: false })
User.belongsToMany(Role, { through: UserRole, foreignKey: 'UserID', otherKey: 'RoleID' })
Role.belongsToMany(User, { through: UserRole, foreignKey: 'RoleID', otherKey: 'UserID' })

// Article <-> User
Article.belongsTo(User, { foreignKey: 'UserID' })
User.hasMany(Article, { foreignKey: 'UserID' })

// Comment <-> User / Article
Comment.belongsTo(User, { foreignKey: 'UserID' })
User.hasMany(Comment, { foreignKey: 'UserID' })
Comment.belongsTo(Article, { foreignKey: 'PostID' })
Article.hasMany(Comment, { foreignKey: 'PostID' })
Comment.belongsTo(Comment, { as: 'Parent', foreignKey: 'ParentCommentID' })

// Category <-> User
Category.belongsTo(User, { foreignKey: 'CreatedBy' })
User.hasMany(Category, { foreignKey: 'CreatedBy' })
Category.belongsTo(Category, { as: 'Parent', foreignKey: 'ParentCategoryID' })

// Tag <-> User
Tag.belongsTo(User, { foreignKey: 'CreatedBy' })
User.hasMany(Tag, { foreignKey: 'CreatedBy' })

// Article <-> Category
const PostCategory = sequelize.define('PostCategory', {}, { tableName: 'postcategories', timestamps: false })
Article.belongsToMany(Category, { through: PostCategory, foreignKey: 'PostID', otherKey: 'CategoryID' })
Category.belongsToMany(Article, { through: PostCategory, foreignKey: 'CategoryID', otherKey: 'PostID' })

// Article <-> Tag
const PostTag = sequelize.define('PostTag', {}, { tableName: 'posttags', timestamps: false })
Article.belongsToMany(Tag, { through: PostTag, foreignKey: 'PostID', otherKey: 'TagID' })
Tag.belongsToMany(Article, { through: PostTag, foreignKey: 'TagID', otherKey: 'PostID' })

// Article <-> Like
Article.belongsToMany(User, {
  through: PostLike,
  as: 'LikedUsers',
  foreignKey: 'PostID',
  otherKey: 'UserID',
})
User.belongsToMany(Article, {
  through: PostLike,
  as: 'LikedPosts',
  foreignKey: 'UserID',
  otherKey: 'PostID',
})

// Article <-> Favorite
Article.belongsToMany(User, {
  through: PostFavorite,
  as: 'FavoritedUsers',
  foreignKey: 'PostID',
  otherKey: 'UserID',
})
User.belongsToMany(Article, {
  through: PostFavorite,
  as: 'FavoritedPosts',
  foreignKey: 'UserID',
  otherKey: 'PostID',
})

// Attachment <-> User / Article
Attachment.belongsTo(User, { foreignKey: 'UserID' })
User.hasMany(Attachment, { foreignKey: 'UserID' })
Attachment.belongsTo(Article, { foreignKey: 'PostID' })
Article.hasMany(Attachment, { foreignKey: 'PostID' })

// Home cat <-> User
HomeCat.belongsTo(User, { foreignKey: 'CreatedBy', as: 'Creator' })
User.hasMany(HomeCat, { foreignKey: 'CreatedBy', as: 'CreatedHomeCats' })

// Site setting <-> User
SiteSetting.belongsTo(User, { foreignKey: 'UpdatedBy', as: 'Updater' })
User.hasMany(SiteSetting, { foreignKey: 'UpdatedBy', as: 'UpdatedSiteSettings' })

// Operation log <-> User
OperationLog.belongsTo(User, { foreignKey: 'UserID' })
User.hasMany(OperationLog, { foreignKey: 'UserID' })

// Post revision <-> User / Article
PostRevision.belongsTo(User, { foreignKey: 'UserID' })
User.hasMany(PostRevision, { foreignKey: 'UserID' })
PostRevision.belongsTo(Article, { foreignKey: 'PostID' })
Article.hasMany(PostRevision, { foreignKey: 'PostID' })

// Verification code <-> User
VerificationCode.belongsTo(User, { foreignKey: 'UserID' })
User.hasMany(VerificationCode, { foreignKey: 'UserID' })

// Token blacklist <-> User
TokenBlacklist.belongsTo(User, { foreignKey: 'UserID' })
User.hasMany(TokenBlacklist, { foreignKey: 'UserID' })

// Auth session <-> User
AuthSession.belongsTo(User, { foreignKey: 'UserID' })
User.hasMany(AuthSession, { foreignKey: 'UserID' })

module.exports = {
  sequelize,
  User,
  Role,
  Article,
  Comment,
  Category,
  Tag,
  Attachment,
  HomeCat,
  SiteSetting,
  OperationLog,
  PostRevision,
  PostLike,
  PostFavorite,
  VerificationCode,
  TokenBlacklist,
  AuthSession,
  PostCategory,
  PostTag,
  UserRole,
}
