const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Attachment = sequelize.define('Attachment', {
  AttachmentID: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  // 允许为空：草稿期的临时附件
  PostID: { type: DataTypes.INTEGER, allowNull: true },
  UserID: { type: DataTypes.INTEGER, allowNull: false },
  OriginalName: { type: DataTypes.STRING(255), allowNull: false },
  StoredName: { type: DataTypes.STRING(255), unique: true, allowNull: false },
  MimeType: { type: DataTypes.STRING(100), allowNull: false },
  FileSize: { type: DataTypes.INTEGER, allowNull: false },
  UploadedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  Description: { type: DataTypes.STRING(255) },
  // 内容指纹（SHA-256 十六进制，小写）。建议唯一
  FileHash: { type: DataTypes.STRING(64), allowNull: false },
  // 物理存储路径（可相对或绝对）
  StoragePath: { type: DataTypes.STRING(255), allowNull: true },
  // 临时附件标记（未最终关联文章）
  IsTemporary: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  // 前端编辑会话键
  TempKey: { type: DataTypes.STRING(64), allowNull: true },
  // 当前文章内容中的引用计数
  RefCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  // 软删除标记与时间
  IsDeleted: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  DeletedAt: { type: DataTypes.DATE, allowNull: true },
  // 外链支持
  IsExternal: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  ExternalURL: { type: DataTypes.STRING(500), allowNull: true }
}, {
  tableName: 'Attachments',
  timestamps: false
});

module.exports = Attachment; 