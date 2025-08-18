-- 测试用的数据库脚本
-- 创建验证码表（如果还没有创建的话）

USE techblogdb;

-- 创建验证码表
CREATE TABLE IF NOT EXISTS `verificationcodes` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `Email` varchar(100) NOT NULL,
  `Code` varchar(10) NOT NULL,
  `Scene` varchar(50) NOT NULL COMMENT 'register | change_email',
  `ExpiresAt` timestamp NULL DEFAULT NULL,
  `Used` tinyint(1) NOT NULL DEFAULT 0,
  `UserID` int NULL DEFAULT NULL,
  `CreatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`Id`) USING BTREE,
  INDEX `Email`(`Email`) USING BTREE,
  INDEX `Scene`(`Scene`) USING BTREE,
  INDEX `ExpiresAt`(`ExpiresAt`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '邮箱验证码' ROW_FORMAT = Dynamic;

-- 查看表结构
DESCRIBE verificationcodes;

-- 清理测试数据（可选）
-- DELETE FROM verificationcodes WHERE Email LIKE 'test%';
-- DELETE FROM users WHERE Email LIKE 'test%';
