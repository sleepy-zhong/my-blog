const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Role = sequelize.define('Role', {
  RoleID: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  Name: { type: DataTypes.STRING(50), unique: true, allowNull: false },
  Description: { type: DataTypes.STRING(255) }
}, {
  tableName: 'roles',
  timestamps: false
});

module.exports = Role; 