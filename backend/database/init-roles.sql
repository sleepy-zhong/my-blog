-- 初始化角色数据
INSERT INTO roles (Name, Description) VALUES 
('admin', '系统管理员，拥有所有权限'),
('author', '作者，可以创建和编辑自己的文章'),
('editor', '编辑，可以编辑所有文章'),
('subscriber', '订阅者，可以查看和评论文章');

-- 为现有用户分配默认角色（假设用户ID为1的用户为管理员）
INSERT INTO userroles (UserID, RoleID) VALUES 
(1, 1); -- 用户1设为管理员 