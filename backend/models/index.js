const sequelize = require('../config/db');
const User = require('./User');
const Role = require('./Role');
const Article = require('./Article');
const Comment = require('./Comment');
const Category = require('./Category');
const Tag = require('./Tag');
const Attachment = require('./Attachment');
const OperationLog = require('./OperationLog');
const PostRevision = require('./PostRevision');


// 用户-角色 多对多
const UserRole = sequelize.define('UserRole', {}, { tableName: 'userroles', timestamps: false });
User.belongsToMany(Role, { through: UserRole, foreignKey: 'UserID', otherKey: 'RoleID' });
Role.belongsToMany(User, { through: UserRole, foreignKey: 'RoleID', otherKey: 'UserID' });

// 文章-用户
Article.belongsTo(User, { foreignKey: 'UserID' });
User.hasMany(Article, { foreignKey: 'UserID' });

// 评论-用户-文章
Comment.belongsTo(User, { foreignKey: 'UserID' });
User.hasMany(Comment, { foreignKey: 'UserID' });
Comment.belongsTo(Article, { foreignKey: 'PostID' });
Article.hasMany(Comment, { foreignKey: 'PostID' });
Comment.belongsTo(Comment, { as: 'Parent', foreignKey: 'ParentCommentID' });

// 分类-用户
Category.belongsTo(User, { foreignKey: 'CreatedBy' });
User.hasMany(Category, { foreignKey: 'CreatedBy' });
Category.belongsTo(Category, { as: 'Parent', foreignKey: 'ParentCategoryID' });

// 标签-用户
Tag.belongsTo(User, { foreignKey: 'CreatedBy' });
User.hasMany(Tag, { foreignKey: 'CreatedBy' });

// 文章-分类 多对多
const PostCategory = sequelize.define('PostCategory', {}, { tableName: 'PostCategories', timestamps: false });
Article.belongsToMany(Category, { through: PostCategory, foreignKey: 'PostID', otherKey: 'CategoryID' });
Category.belongsToMany(Article, { through: PostCategory, foreignKey: 'CategoryID', otherKey: 'PostID' });

// 文章-标签 多对多
const PostTag = sequelize.define('PostTag', {}, { tableName: 'PostTags', timestamps: false });
Article.belongsToMany(Tag, { through: PostTag, foreignKey: 'PostID', otherKey: 'TagID' });
Tag.belongsToMany(Article, { through: PostTag, foreignKey: 'TagID', otherKey: 'PostID' });

// 附件-用户-文章
Attachment.belongsTo(User, { foreignKey: 'UserID' });
User.hasMany(Attachment, { foreignKey: 'UserID' });
Attachment.belongsTo(Article, { foreignKey: 'PostID' });
Article.hasMany(Attachment, { foreignKey: 'PostID' });

// 操作日志-用户
OperationLog.belongsTo(User, { foreignKey: 'UserID' });
User.hasMany(OperationLog, { foreignKey: 'UserID' });

// 文章修订-用户-文章
PostRevision.belongsTo(User, { foreignKey: 'UserID' });
User.hasMany(PostRevision, { foreignKey: 'UserID' });
PostRevision.belongsTo(Article, { foreignKey: 'PostID' });
Article.hasMany(PostRevision, { foreignKey: 'PostID' });

module.exports = {
  sequelize,
  User,
  Role,
  Article,
  Comment,
  Category,
  Tag,
  Attachment,
  OperationLog,
  PostRevision,
  PostCategory,
  PostTag,
  UserRole
}; 