const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Article = sequelize.define('Article', {
  PostID: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  UserID: { type: DataTypes.INTEGER, allowNull: false },
  Title: { type: DataTypes.STRING(200), allowNull: false },
  Slug: { type: DataTypes.STRING(220), unique: true, allowNull: false },
  Content: { type: DataTypes.TEXT('long'), allowNull: false },
  Excerpt: { type: DataTypes.STRING(300) },
  Status: { type: DataTypes.ENUM('draft', 'published', 'archived'), defaultValue: 'draft' },
  CreatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  UpdatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  PublishedAt: { type: DataTypes.DATE },
  ViewCount: { type: DataTypes.INTEGER, defaultValue: 0 },
  FeaturedImageURL: { type: DataTypes.STRING(255) },
  CurrentRevisionID: { type: DataTypes.INTEGER }
}, {
  tableName: 'Posts',
  timestamps: false
});

module.exports = Article; 