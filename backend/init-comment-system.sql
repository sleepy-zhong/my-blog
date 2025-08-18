-- 评论系统完整初始化脚本
-- 包含数据库修改、用户创建和测试数据

USE techblogdb;

-- ========================================
-- 1. 修改评论表结构
-- ========================================

-- 修改评论默认状态为已审核
ALTER TABLE `comments` MODIFY COLUMN `Status` enum('approved','pending','spam') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT 'approved' COMMENT '审核状态';

-- 添加用户删除权限字段（如果不存在）
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = 'techblogdb' 
     AND TABLE_NAME = 'comments' 
     AND COLUMN_NAME = 'CanDelete') = 0,
    'ALTER TABLE `comments` ADD COLUMN `CanDelete` tinyint(1) DEFAULT 1 COMMENT ''用户是否可删除'';',
    'SELECT ''CanDelete字段已存在'' as message;'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ========================================
-- 2. 创建测试用户
-- ========================================

-- 清空现有测试用户（如果存在）
DELETE FROM users WHERE Email IN (
  'admin@example.com', 
  'user1@example.com', 
  'user2@example.com', 
  'user3@example.com', 
  'user4@example.com', 
  'user5@example.com'
);

-- 插入测试用户（密码都是 admin123）
INSERT INTO users (Username, Email, Password, DisplayName, Role, CreatedAt) VALUES 
('admin', 'admin@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '管理员', 'admin', NOW()),
('user1', 'user1@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '用户1', 'user', NOW()),
('user2', 'user2@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '用户2', 'user', NOW()),
('user3', 'user3@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '用户3', 'user', NOW()),
('user4', 'user4@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '用户4', 'user', NOW()),
('user5', 'user5@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '用户5', 'user', NOW());

-- ========================================
-- 3. 更新现有评论状态
-- ========================================

-- 更新现有评论的默认状态（将待审核的评论设为已审核）
UPDATE `comments` SET `Status` = 'approved' WHERE `Status` = 'pending';

-- ========================================
-- 4. 插入测试评论数据
-- ========================================

-- 清空现有测试评论（如果存在）
DELETE FROM comments WHERE PostID = 1;

-- 插入测试评论数据
INSERT INTO comments (PostID, UserID, ParentCommentID, Content, Status, CanDelete, CreatedAt) VALUES 
(1, 1, NULL, '这是一条主评论', 'approved', 1, NOW()),
(1, 2, NULL, '这是另一条主评论', 'approved', 1, NOW()),
(1, 3, 1, '回复第一条评论', 'approved', 1, NOW()),
(1, 1, 1, '回复自己的评论', 'approved', 1, NOW()),
(1, 2, 2, '回复第二条评论', 'approved', 1, NOW()),
(1, 4, 3, '回复的回复', 'approved', 1, NOW()),
(1, 5, NULL, '第三条主评论', 'approved', 1, NOW()),
(1, 1, 5, '回复第三条评论', 'approved', 1, NOW());

-- ========================================
-- 5. 验证结果
-- ========================================

SELECT '评论系统初始化完成' as message;

-- 显示用户信息
SELECT '用户信息:' as info;
SELECT UserID, Username, Email, DisplayName, Role FROM users ORDER BY UserID;

-- 显示评论结构
SELECT '评论结构:' as info;
SELECT 
    CommentID,
    PostID,
    UserID,
    ParentCommentID,
    LEFT(Content, 20) as Content,
    Status,
    CanDelete,
    CreatedAt
FROM comments 
WHERE PostID = 1 
ORDER BY ParentCommentID IS NULL DESC, CommentID; 