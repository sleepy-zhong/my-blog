const { DataTypes } = require('sequelize')
const sequelize = require('../config/db')

const SiteSetting = sequelize.define('SiteSetting', {
  SiteSettingID: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  SiteName: {
    type: DataTypes.STRING(120),
    allowNull: false,
    defaultValue: 'TechBlogDB',
  },
  Description: {
    type: DataTypes.STRING(500),
    allowNull: false,
    defaultValue: '一个技术博客系统',
  },
  LogoURL: {
    type: DataTypes.STRING(500),
    allowNull: false,
    defaultValue: '',
  },
  FaviconURL: {
    type: DataTypes.STRING(500),
    allowNull: false,
    defaultValue: '',
  },
  Analytics: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  SocialLinks: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  UpdatedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  CreatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
  },
  UpdatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
  },
}, {
  tableName: 'sitesettings',
  timestamps: false,
})

module.exports = SiteSetting
