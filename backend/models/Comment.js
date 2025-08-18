const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Comment = sequelize.define('Comment', {
  CommentID: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  PostID: { type: DataTypes.INTEGER, allowNull: false },
  UserID: { type: DataTypes.INTEGER },
  ParentCommentID: { type: DataTypes.INTEGER },
  Content: { type: DataTypes.TEXT, allowNull: false },
  Status: { type: DataTypes.ENUM('approved', 'pending', 'spam'), defaultValue: 'approved' },
  CanDelete: { type: DataTypes.BOOLEAN, defaultValue: true },
  CreatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  LastEditedAt: { type: DataTypes.DATE }
}, {
  tableName: 'Comments',
  timestamps: false
});

module.exports = Comment; 