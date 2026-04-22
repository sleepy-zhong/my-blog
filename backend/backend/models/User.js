const { DataTypes } = require('sequelize')
const sequelize = require('../config/db')

const User = sequelize.define('User', {
  UserID: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  Username: { type: DataTypes.STRING(50), unique: true, allowNull: false },
  Email: { type: DataTypes.STRING(100), unique: true, allowNull: false },
  PasswordHash: { type: DataTypes.STRING(60), allowNull: false },
  PhoneNumber: { type: DataTypes.STRING(20), unique: true },
  DisplayName: { type: DataTypes.STRING(100) },
  Bio: { type: DataTypes.TEXT },
  AvatarURL: { type: DataTypes.STRING(255) },
  CreatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  LastLogin: { type: DataTypes.DATE },
  LastSeenAt: { type: DataTypes.DATE },
  IsActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: '账户状态',
  },
  SessionVersion: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
}, {
  tableName: 'users',
  timestamps: false,
})

module.exports = User
