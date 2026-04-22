SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

USE `techblogdb`;

CREATE TABLE IF NOT EXISTS `sitesettings` (
  `SiteSettingID` int NOT NULL AUTO_INCREMENT COMMENT '站点设置主键',
  `SiteName` varchar(120) NOT NULL DEFAULT 'TechBlogDB' COMMENT '站点名称',
  `Description` varchar(500) NOT NULL DEFAULT '一个技术博客系统' COMMENT '站点描述',
  `LogoURL` varchar(500) NOT NULL DEFAULT '' COMMENT '站点 Logo 地址',
  `FaviconURL` varchar(500) NOT NULL DEFAULT '' COMMENT '站点 Favicon 地址',
  `Analytics` text NULL COMMENT '统计代码片段',
  `SocialLinks` text NULL COMMENT '社交链接 JSON',
  `UpdatedBy` int NULL COMMENT '最后更新人',
  `CreatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `UpdatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`SiteSettingID`) USING BTREE,
  INDEX `idx_sitesettings_updated_by` (`UpdatedBy`) USING BTREE,
  CONSTRAINT `fk_sitesettings_user`
    FOREIGN KEY (`UpdatedBy`) REFERENCES `users` (`UserID`)
    ON DELETE SET NULL ON UPDATE RESTRICT
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='站点系统设置表';

ALTER TABLE `sitesettings`
  MODIFY `SiteName` varchar(120) NOT NULL DEFAULT 'TechBlogDB' COMMENT '站点名称',
  MODIFY `Description` varchar(500) NOT NULL DEFAULT '一个技术博客系统' COMMENT '站点描述',
  MODIFY `LogoURL` varchar(500) NOT NULL DEFAULT '' COMMENT '站点 Logo 地址',
  MODIFY `FaviconURL` varchar(500) NOT NULL DEFAULT '' COMMENT '站点 Favicon 地址',
  MODIFY `CreatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  MODIFY `UpdatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '更新时间';

INSERT INTO `sitesettings` (
  `SiteName`,
  `Description`,
  `LogoURL`,
  `FaviconURL`,
  `Analytics`,
  `SocialLinks`,
  `UpdatedBy`,
  `CreatedAt`,
  `UpdatedAt`
)
SELECT
  'TechBlogDB',
  '一个技术博客系统',
  '',
  '',
  '',
  '[]',
  NULL,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM `sitesettings` LIMIT 1
);

SET FOREIGN_KEY_CHECKS = 1;
