const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Category = sequelize.define('Category', {
  CategoryID: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  Name: { type: DataTypes.STRING(50), unique: true, allowNull: false },
  Description: { type: DataTypes.STRING(200) },
  ParentCategoryID: { type: DataTypes.INTEGER },
  CreatedBy: { type: DataTypes.INTEGER, allowNull: false },
  CreatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  UpdatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  tableName: 'categories',
  timestamps: false
});

module.exports = Category; 