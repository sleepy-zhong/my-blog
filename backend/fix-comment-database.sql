-- 评论系统数据库修复脚本
-- 根据 xiugai.md 文档要求修改评论表结构

USE techblogdb;

-- 1. 修改评论默认状态为已审核
ALTER TABLE `comments` MODIFY COLUMN `Status` enum('approved','pending','spam') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT 'approved' COMMENT '审核状态';

-- 2. 添加用户删除权限字段
ALTER TABLE `comments` ADD COLUMN `CanDelete` tinyint(1) DEFAULT 1 COMMENT '用户是否可删除';

-- 3. 更新现有评论的默认状态（将待审核的评论设为已审核）
UPDATE `comments` SET `Status` = 'approved' WHERE `Status` = 'pending';

-- 4. 插入测试评论数据
INSERT INTO comments (PostID, UserID, ParentCommentID, Content, Status, CanDelete, CreatedAt) VALUES 
(1, 1, NULL, '这是一条主评论', 'approved', 1, NOW()),
(1, 2, NULL, '这是另一条主评论', 'approved', 1, NOW()),
(1, 3, 1, '回复第一条评论', 'approved', 1, NOW()),
(1, 1, 1, '回复自己的评论', 'approved', 1, NOW()),
(1, 2, 2, '回复第二条评论', 'approved', 1, NOW()),
(1, 4, 3, '回复的回复', 'approved', 1, NOW()),
(1, 5, NULL, '第三条主评论', 'approved', 1, NOW()),
(1, 1, 5, '回复第三条评论', 'approved', 1, NOW());

-- 5. 验证修改结果
SELECT '评论表结构修改完成' as message;

-- 6. 显示修改后的表结构
DESCRIBE comments;

-- 7. 显示测试数据
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