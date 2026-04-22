const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const PostFavorite = sequelize.define('PostFavorite', {
  PostID: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true },
  UserID: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true },
  CreatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
}, {
  tableName: 'postfavorites',
  timestamps: false
});

module.exports = PostFavorite;
