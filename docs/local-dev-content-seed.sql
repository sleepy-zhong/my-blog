SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

START TRANSACTION;

SET @AuthorId := (SELECT UserID FROM users WHERE Username = 'sleepyzhong' LIMIT 1);

INSERT INTO categories (`Name`, `Description`, `ParentCategoryID`, `CreatedBy`)
SELECT '前端', '本地联调用的前端分类', NULL, @AuthorId
FROM DUAL
WHERE @AuthorId IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM categories WHERE `Name` = '前端');

INSERT INTO categories (`Name`, `Description`, `ParentCategoryID`, `CreatedBy`)
SELECT '后端', '本地联调用的后端分类', NULL, @AuthorId
FROM DUAL
WHERE @AuthorId IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM categories WHERE `Name` = '后端');

INSERT INTO categories (`Name`, `Description`, `ParentCategoryID`, `CreatedBy`)
SELECT '数据库', '本地联调用的数据库分类', NULL, @AuthorId
FROM DUAL
WHERE @AuthorId IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM categories WHERE `Name` = '数据库');

INSERT INTO posts (`UserID`, `Title`, `Slug`, `Content`, `Excerpt`, `Status`, `CreatedAt`, `UpdatedAt`, `PublishedAt`, `ViewCount`, `FeaturedImageURL`)
SELECT
  @AuthorId,
  '欢迎来到我的博客',
  'welcome-to-my-blog',
  '# 欢迎来到我的博客\n\n这是一篇用于恢复本地首页和详情页展示的初始化文章。\n\n## 你可以用它检查什么\n\n- 首页文章列表是否正常加载\n- 文章详情页是否正常渲染\n- 评论树是否可以显示\n- 登录后点赞与收藏是否生效',
  '一篇用于恢复本地首页和详情页展示的初始化文章。',
  'published',
  NOW(),
  NOW(),
  NOW(),
  12,
  NULL
FROM DUAL
WHERE @AuthorId IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM posts WHERE `Slug` = 'welcome-to-my-blog');

INSERT INTO posts (`UserID`, `Title`, `Slug`, `Content`, `Excerpt`, `Status`, `CreatedAt`, `UpdatedAt`, `PublishedAt`, `ViewCount`, `FeaturedImageURL`)
SELECT
  @AuthorId,
  '本地开发说明',
  'local-setup-notes',
  '# 本地开发说明\n\n当前项目本地联调默认使用以下配置：\n\n- MySQL：localhost:3307\n- 数据库：techblogdb\n- 后端端口：3001\n- 前端端口：5173\n\n如果你能在前端看到这篇文章，说明基础内容链路已经恢复。',
  '一篇用于检查本地联调链路是否恢复的文章。',
  'published',
  NOW(),
  NOW(),
  NOW(),
  7,
  NULL
FROM DUAL
WHERE @AuthorId IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM posts WHERE `Slug` = 'local-setup-notes');

COMMIT;

SET FOREIGN_KEY_CHECKS = 1;
