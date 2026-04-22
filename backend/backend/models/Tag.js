const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Tag = sequelize.define('Tag', {
  TagID: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  Name: { type: DataTypes.STRING(50), unique: true, allowNull: false },
  Description: { type: DataTypes.STRING(200) },
  CreatedBy: { type: DataTypes.INTEGER, allowNull: false },
  CreatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  tableName: 'tags',
  timestamps: false
});

module.exports = Tag; 