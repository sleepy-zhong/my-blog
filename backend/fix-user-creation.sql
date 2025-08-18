-- 修复用户创建脚本
-- 使用正确的数据库字段名

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
-- 注意：使用正确的字段名 PasswordHash 而不是 Password
INSERT INTO users (Username, Email, PasswordHash, DisplayName, CreatedAt) VALUES 
('admin', 'admin@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '管理员', NOW()),
('user1', 'user1@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '用户1', NOW()),
('user2', 'user2@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '用户2', NOW()),
('user3', 'user3@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '用户3', NOW()),
('user4', 'user4@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '用户4', NOW()),
('user5', 'user5@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '用户5', NOW());

-- 为用户分配角色（通过userroles表）
-- 首先检查角色是否存在
SELECT '检查现有角色:' as info;
SELECT RoleID, Name, Description FROM roles;

-- 为admin用户分配admin角色（假设admin角色ID为1）
INSERT IGNORE INTO userroles (UserID, RoleID) 
SELECT u.UserID, r.RoleID 
FROM users u, roles r 
WHERE u.Email = 'admin@example.com' AND r.Name = 'admin';

-- 为其他用户分配user角色（假设user角色ID为4）
INSERT IGNORE INTO userroles (UserID, RoleID) 
SELECT u.UserID, r.RoleID 
FROM users u, roles r 
WHERE u.Email IN ('user1@example.com', 'user2@example.com', 'user3@example.com', 'user4@example.com', 'user5@example.com') 
AND r.Name = 'user';

-- 验证用户创建结果
SELECT '用户信息:' as info;
SELECT 
    u.UserID, 
    u.Username, 
    u.Email, 
    u.DisplayName, 
    u.CreatedAt,
    GROUP_CONCAT(r.Name) as Roles
FROM users u
LEFT JOIN userroles ur ON u.UserID = ur.UserID
LEFT JOIN roles r ON ur.RoleID = r.RoleID
WHERE u.Email IN ('admin@example.com', 'user1@example.com', 'user2@example.com', 'user3@example.com', 'user4@example.com', 'user5@example.com')
GROUP BY u.UserID
ORDER BY u.UserID; 