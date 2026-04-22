const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const HomeCat = sequelize.define('HomeCat', {
  HomeCatID: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  Name: { type: DataTypes.STRING(80), allowNull: false },
  Label: { type: DataTypes.STRING(80), allowNull: false },
  SpeechText: { type: DataTypes.STRING(500), allowNull: false },
  ImageURL: { type: DataTypes.STRING(500), allowNull: false },
  SortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  IsActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  IsFeatured: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  CreatedBy: { type: DataTypes.INTEGER, allowNull: false },
  CreatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  UpdatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  tableName: 'homecats',
  timestamps: false
});

module.exports = HomeCat;
