-- 创建测试用户数据
USE techblogdb;

-- 插入测试用户
INSERT INTO users (Username, Email, Password, DisplayName, Role, CreatedAt) VALUES 
('admin', 'admin@example.com', '$2b$10$rQZ8K9vX2mN3pL4qR5sT6u', '管理员', 'admin', NOW()),
('user1', 'user1@example.com', '$2b$10$rQZ8K9vX2mN3pL4qR5sT6u', '用户1', 'user', NOW()),
('user2', 'user2@example.com', '$2b$10$rQZ8K9vX2mN3pL4qR5sT6u', '用户2', 'user', NOW()),
('user3', 'user3@example.com', '$2b$10$rQZ8K9vX2mN3pL4qR5sT6u', '用户3', 'user', NOW()),
('user4', 'user4@example.com', '$2b$10$rQZ8K9vX2mN3pL4qR5sT6u', '用户4', 'user', NOW()),
('user5', 'user5@example.com', '$2b$10$rQZ8K9vX2mN3pL4qR5sT6u', '用户5', 'user', NOW());

-- 验证用户创建
SELECT UserID, Username, Email, DisplayName, Role FROM users; 