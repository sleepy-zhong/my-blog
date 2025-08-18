const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const PostRevision = sequelize.define('PostRevision', {
  RevisionID: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  PostID: { type: DataTypes.INTEGER, allowNull: false },
  UserID: { type: DataTypes.INTEGER, allowNull: false },
  Title: { type: DataTypes.STRING(200), allowNull: false },
  Content: { type: DataTypes.TEXT('long'), allowNull: false },
  Excerpt: { type: DataTypes.STRING(300) },
  RevisionNotes: { type: DataTypes.TEXT },
  CreatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  RevisionType: { type: DataTypes.ENUM('initial','update','rollback'), defaultValue: 'update' }
}, {
  tableName: 'PostRevisions',
  timestamps: false
});

module.exports = PostRevision; 