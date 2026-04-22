const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Attachment = sequelize.define('Attachment', {
  AttachmentID: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  PostID: { type: DataTypes.INTEGER, allowNull: true },
  UserID: { type: DataTypes.INTEGER, allowNull: false },
  OriginalName: { type: DataTypes.STRING(255), allowNull: false },
  StoredName: { type: DataTypes.STRING(255), unique: true, allowNull: false },
  MimeType: { type: DataTypes.STRING(100), allowNull: false },
  FileSize: { type: DataTypes.INTEGER, allowNull: false },
  UploadedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  Description: { type: DataTypes.STRING(255) },
  FileHash: { type: DataTypes.STRING(64), allowNull: false },
  StoragePath: { type: DataTypes.STRING(255), allowNull: true },
  IsTemporary: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  TempKey: { type: DataTypes.STRING(64), allowNull: true },
  RefCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  IsDeleted: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  DeletedAt: { type: DataTypes.DATE, allowNull: true },
  IsExternal: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  ExternalURL: { type: DataTypes.STRING(500), allowNull: true }
}, {
  tableName: 'attachments',
  timestamps: false
});

module.exports = Attachment;
