const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const VerificationCode = sequelize.define('VerificationCode', {
  Id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  Email: { type: DataTypes.STRING(100), allowNull: false },
  Code: { type: DataTypes.STRING(10), allowNull: false },
  Scene: { type: DataTypes.STRING(50), allowNull: false },
  ExpiresAt: { type: DataTypes.DATE, allowNull: true },
  Used: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  UserID: { type: DataTypes.INTEGER, allowNull: true },
  CreatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
}, {
  tableName: 'verificationcodes',
  timestamps: false
});

module.exports = VerificationCode;
