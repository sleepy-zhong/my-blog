-- 评论系统数据库修复脚本
-- 执行前请备份数据库

-- 1. 修改评论默认状态为已审核
ALTER TABLE `comments` MODIFY COLUMN `Status` enum('approved','pending','spam') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT 'approved' COMMENT '审核状态';

-- 2. 将现有pending状态的评论改为approved
UPDATE `comments` SET `Status` = 'approved' WHERE `Status` = 'pending';

-- 3. 添加用户删除权限字段（可选）
ALTER TABLE `comments` ADD COLUMN `CanDelete` tinyint(1) DEFAULT 1 COMMENT '用户是否可删除';

-- 4. 插入测试评论数据（楼中楼结构）
-- 先清空现有测试数据（可选）
-- DELETE FROM comments WHERE PostID = 1;

-- 插入主评论
INSERT INTO comments (PostID, UserID, ParentCommentID, Content, Status, CanDelete) VALUES 
(1, 1, NULL, '这是一条主评论，测试楼中楼功能', 'approved', 1),
(1, 2, NULL, '这是另一条主评论，来自用户2', 'approved', 1),
(1, 3, NULL, '第三条主评论，测试分页功能', 'approved', 1);

-- 插入回复评论（楼中楼）
INSERT INTO comments (PostID, UserID, ParentCommentID, Content, Status, CanDelete) VALUES 
(1, 3, 1, '回复第一条评论，这是楼中楼的第一层', 'approved', 1),
(1, 1, 1, '回复自己的评论，测试自我回复', 'approved', 1),
(1, 2, 2, '回复第二条评论，来自用户2', 'approved', 1),
(1, 4, 3, '回复第三条评论，测试多层级', 'approved', 1);

-- 插入更深层的回复（楼中楼的楼中楼）
INSERT INTO comments (PostID, UserID, ParentCommentID, Content, Status, CanDelete) VALUES 
(1, 1, 4, '回复的回复，这是第二层楼中楼', 'approved', 1),
(1, 2, 4, '另一个用户回复第一层回复', 'approved', 1),
(1, 3, 5, '回复自我回复的评论', 'approved', 1);

-- 5. 验证数据
SELECT 
    c1.CommentID as '主评论ID',
    c1.Content as '主评论内容',
    c1.UserID as '主评论用户',
    c2.CommentID as '回复ID',
    c2.Content as '回复内容',
    c2.UserID as '回复用户',
    c3.CommentID as '回复的回复ID',
    c3.Content as '回复的回复内容',
    c3.UserID as '回复的回复用户'
FROM comments c1
LEFT JOIN comments c2 ON c1.CommentID = c2.ParentCommentID
LEFT JOIN comments c3 ON c2.CommentID = c3.ParentCommentID
WHERE c1.ParentCommentID IS NULL AND c1.PostID = 1
ORDER BY c1.CommentID, c2.CommentID, c3.CommentID;

-- 6. 检查评论树结构
SELECT 
    c.CommentID,
    c.ParentCommentID,
    c.Content,
    c.UserID,
    c.Status,
    CASE 
        WHEN c.ParentCommentID IS NULL THEN '主评论'
        WHEN EXISTS (SELECT 1 FROM comments WHERE ParentCommentID = c.CommentID) THEN '主评论（有回复）'
        ELSE '回复评论'
    END as '评论类型'
FROM comments c
WHERE c.PostID = 1
ORDER BY c.ParentCommentID IS NULL DESC, c.CommentID; 