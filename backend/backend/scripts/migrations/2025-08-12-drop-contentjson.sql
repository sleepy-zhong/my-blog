-- 安全下线 Posts.ContentJSON 列（MySQL 8+）
-- 前置条件：确认应用代码已不再读写 ContentJSON（本次改动已移除模型/控制器引用）

START TRANSACTION;

-- 1) 备份列到归档表（可选）
CREATE TABLE IF NOT EXISTS posts_contentjson_backup AS
  SELECT PostID, ContentJSON, NOW() AS BackupAt
  FROM posts
  WHERE ContentJSON IS NOT NULL;

-- 2) 删除触发器/依赖（若有引用，可在此清理；当前无）

-- 3) 删除列
ALTER TABLE posts DROP COLUMN ContentJSON;

COMMIT;


