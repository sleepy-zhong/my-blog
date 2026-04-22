SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 认证与会话体系结构升级
-- 适用：MySQL 8
-- 说明：本脚本只包含增量结构变更语句，请执行一次

ALTER TABLE `users`
  ADD COLUMN `LastSeenAt` timestamp NULL DEFAULT NULL COMMENT '最后活跃时间' AFTER `LastLogin`,
  ADD COLUMN `SessionVersion` int NOT NULL DEFAULT 1 COMMENT '会话版本号，修改密码或强制下线时递增' AFTER `IsActive`,
  ADD INDEX `idx_users_last_seen` (`LastSeenAt`) USING BTREE;

ALTER TABLE `verificationcodes`
  MODIFY COLUMN `Scene` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT 'register | login | change_password | forgot_password | change_email',
  ADD INDEX `idx_verificationcodes_lookup` (`Email`, `Scene`, `Used`, `ExpiresAt`) USING BTREE,
  ADD INDEX `idx_verificationcodes_recent` (`Email`, `Scene`, `CreatedAt`) USING BTREE;

CREATE TABLE IF NOT EXISTS `authsessions` (
  `SessionID` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '会话ID，建议使用UUID',
  `UserID` int NOT NULL COMMENT '所属用户ID',
  `RefreshTokenHash` char(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT 'Refresh Token 哈希值（SHA-256）',
  `LoginMethod` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '登录方式，如 email / phone / username',
  `DeviceName` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '设备名称',
  `ClientType` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '客户端类型，如 web / admin / mobile',
  `UserAgent` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '浏览器或客户端标识',
  `IPAddress` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '登录IP',
  `RememberMe` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否长会话',
  `Status` enum('active','revoked') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'active' COMMENT '会话状态',
  `LoginAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '登录时间',
  `LastSeenAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '最近活跃时间',
  `ExpiresAt` timestamp NOT NULL COMMENT 'Refresh Token 过期时间',
  `RevokedAt` timestamp NULL DEFAULT NULL COMMENT '会话撤销时间',
  `RevokedReason` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '撤销原因',
  PRIMARY KEY (`SessionID`) USING BTREE,
  UNIQUE INDEX `uk_authsessions_refresh_hash` (`RefreshTokenHash`) USING BTREE,
  INDEX `idx_authsessions_user_status` (`UserID`, `Status`) USING BTREE,
  INDEX `idx_authsessions_user_last_seen` (`UserID`, `LastSeenAt`) USING BTREE,
  INDEX `idx_authsessions_expires_at` (`ExpiresAt`) USING BTREE,
  INDEX `idx_authsessions_status_last_seen` (`Status`, `LastSeenAt`) USING BTREE,
  CONSTRAINT `fk_authsessions_user` FOREIGN KEY (`UserID`) REFERENCES `users` (`UserID`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='认证会话表';

SET FOREIGN_KEY_CHECKS = 1;
