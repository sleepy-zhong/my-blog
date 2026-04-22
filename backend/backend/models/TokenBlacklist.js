const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const TokenBlacklist = sequelize.define('TokenBlacklist', {
  Id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  TokenHash: { type: DataTypes.STRING(64), allowNull: false, unique: true },
  UserID: { type: DataTypes.INTEGER, allowNull: true },
  ExpiresAt: { type: DataTypes.DATE, allowNull: true },
  CreatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
}, {
  tableName: 'tokenblacklists',
  timestamps: false
});

module.exports = TokenBlacklist;
