SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS `tokenblacklists` (
  `Id` int NOT NULL AUTO_INCREMENT COMMENT '黑名单记录ID',
  `TokenHash` char(64) NOT NULL COMMENT 'JWT 哈希值（SHA-256）',
  `UserID` int DEFAULT NULL COMMENT '关联用户ID',
  `ExpiresAt` timestamp NULL DEFAULT NULL COMMENT 'Token 过期时间',
  `CreatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '加入黑名单时间',
  PRIMARY KEY (`Id`) USING BTREE,
  UNIQUE KEY `uk_tokenblacklists_hash` (`TokenHash`) USING BTREE,
  KEY `idx_tokenblacklists_user` (`UserID`) USING BTREE,
  KEY `idx_tokenblacklists_expires_at` (`ExpiresAt`) USING BTREE,
  CONSTRAINT `fk_tokenblacklists_user` FOREIGN KEY (`UserID`) REFERENCES `users` (`UserID`) ON DELETE SET NULL ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='JWT 黑名单表';

SET FOREIGN_KEY_CHECKS = 1;
