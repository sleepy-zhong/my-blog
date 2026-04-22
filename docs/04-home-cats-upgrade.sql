SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

USE `techblogdb`;

CREATE TABLE IF NOT EXISTS `homecats` (
  `HomeCatID` int NOT NULL AUTO_INCREMENT COMMENT '首页猫猫主键',
  `Name` varchar(80) NOT NULL COMMENT '后台管理名称',
  `Label` varchar(80) NOT NULL COMMENT '首页展示名称',
  `SpeechText` varchar(500) NOT NULL COMMENT '对应的猫猫有话说文案',
  `ImageURL` varchar(500) NOT NULL COMMENT '首页猫猫图片地址',
  `SortOrder` int NOT NULL DEFAULT 0 COMMENT '排序值，越小越靠前',
  `IsActive` tinyint(1) NOT NULL DEFAULT 1 COMMENT '是否启用',
  `IsFeatured` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否首页默认主猫',
  `CreatedBy` int NOT NULL COMMENT '创建人',
  `CreatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `UpdatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`HomeCatID`) USING BTREE,
  INDEX `idx_homecats_active_sort` (`IsActive`, `IsFeatured`, `SortOrder`) USING BTREE,
  INDEX `idx_homecats_creator` (`CreatedBy`) USING BTREE,
  CONSTRAINT `fk_homecats_user`
    FOREIGN KEY (`CreatedBy`) REFERENCES `users` (`UserID`)
    ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='首页猫猫配置表';

SET FOREIGN_KEY_CHECKS = 1;
