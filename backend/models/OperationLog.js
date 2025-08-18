const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const OperationLog = sequelize.define('OperationLog', {
  LogID: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  UserID: { type: DataTypes.INTEGER },
  OperationType: { type: DataTypes.STRING(50), allowNull: false },
  TargetType: { type: DataTypes.ENUM('post','comment','user','category','tag','revision'), allowNull: false },
  TargetID: { type: DataTypes.INTEGER },
  Details: { type: DataTypes.JSON },
  IPAddress: { type: DataTypes.STRING(45) },
  UserAgent: { type: DataTypes.STRING(255) },
  Timestamp: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  tableName: 'OperationLogs',
  timestamps: false
});

module.exports = OperationLog; 