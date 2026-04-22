const { DataTypes } = require('sequelize')
const sequelize = require('../config/db')

const AuthSession = sequelize.define('AuthSession', {
  SessionID: { type: DataTypes.STRING(36), primaryKey: true },
  UserID: { type: DataTypes.INTEGER, allowNull: false },
  RefreshTokenHash: { type: DataTypes.STRING(64), allowNull: false, unique: true },
  LoginMethod: { type: DataTypes.STRING(20), allowNull: false },
  DeviceName: { type: DataTypes.STRING(100), allowNull: true },
  ClientType: { type: DataTypes.STRING(30), allowNull: true },
  UserAgent: { type: DataTypes.STRING(500), allowNull: true },
  IPAddress: { type: DataTypes.STRING(64), allowNull: true },
  RememberMe: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  Status: { type: DataTypes.ENUM('active', 'revoked'), allowNull: false, defaultValue: 'active' },
  LoginAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  LastSeenAt: { type: DataTypes.DATE, allowNull: true, defaultValue: DataTypes.NOW },
  ExpiresAt: { type: DataTypes.DATE, allowNull: false },
  RevokedAt: { type: DataTypes.DATE, allowNull: true },
  RevokedReason: { type: DataTypes.STRING(255), allowNull: true },
}, {
  tableName: 'authsessions',
  timestamps: false,
})

module.exports = AuthSession
