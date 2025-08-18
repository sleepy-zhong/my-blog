-- 创建测试用户数据（包含正确的密码哈希）
USE techblogdb;

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

-- 验证用户创建
SELECT UserID, Username, Email, DisplayName, Role FROM users ORDER BY UserID; 