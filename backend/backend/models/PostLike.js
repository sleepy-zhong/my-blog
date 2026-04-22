const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const PostLike = sequelize.define('PostLike', {
  PostID: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true },
  UserID: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true },
  CreatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
}, {
  tableName: 'postlikes',
  timestamps: false
});

module.exports = PostLike;
