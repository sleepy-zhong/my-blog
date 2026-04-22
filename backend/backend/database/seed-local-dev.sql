/*
  TechBlog local development seed data

  Depends on           : 01-init.sql
  Purpose              : local demo accounts, content, comments, and logs
  Production safe      : NO
  File Encoding        : UTF-8

  Date: 2026-04-21
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

INSERT INTO `roles` (`RoleID`, `Name`, `Description`) VALUES (1, 'admin', '超级管理员');
INSERT INTO `roles` (`RoleID`, `Name`, `Description`) VALUES (2, 'editor', '内容编辑');
INSERT INTO `roles` (`RoleID`, `Name`, `Description`) VALUES (3, 'author', '普通作者');
INSERT INTO `roles` (`RoleID`, `Name`, `Description`) VALUES (4, 'user', '普通用户');
INSERT INTO `roles` (`RoleID`, `Name`, `Description`) VALUES (14, 'viewer', '游客');

-- ----------------------------
-- Records of users
-- ----------------------------
INSERT INTO `users` (`UserID`, `PhoneNumber`, `Username`, `Email`, `PasswordHash`, `DisplayName`, `Bio`, `AvatarURL`, `CreatedAt`, `LastLogin`, `IsActive`) VALUES (1, '19123635145', 'sleepyzhong', 'alice@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Sleepyzhong', '我是大聪明，喜欢折腾前端动效、后端接口和猫猫主题设计。', NULL, '2026-04-01 09:00:00', '2026-04-10 09:15:00', 1);
INSERT INTO `users` (`UserID`, `PhoneNumber`, `Username`, `Email`, `PasswordHash`, `DisplayName`, `Bio`, `AvatarURL`, `CreatedAt`, `LastLogin`, `IsActive`) VALUES (2, '13800000002', 'bob', 'bob@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Bob', '后端工程师，主要负责接口、权限和数据库设计。', NULL, '2026-04-01 09:10:00', '2026-04-10 08:40:00', 1);
INSERT INTO `users` (`UserID`, `PhoneNumber`, `Username`, `Email`, `PasswordHash`, `DisplayName`, `Bio`, `AvatarURL`, `CreatedAt`, `LastLogin`, `IsActive`) VALUES (3, '13800000003', 'charlie', 'charlie@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Charlie', '全栈开发者，关注 Vue、Node.js 和工程化。', NULL, '2026-04-01 09:20:00', '2026-04-09 22:10:00', 1);
INSERT INTO `users` (`UserID`, `PhoneNumber`, `Username`, `Email`, `PasswordHash`, `DisplayName`, `Bio`, `AvatarURL`, `CreatedAt`, `LastLogin`, `IsActive`) VALUES (4, '13800000004', 'david', 'david@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'David', '测试工程师，负责回归验证和边界场景排查。', NULL, '2026-04-01 09:30:00', '2026-04-09 21:05:00', 1);
INSERT INTO `users` (`UserID`, `PhoneNumber`, `Username`, `Email`, `PasswordHash`, `DisplayName`, `Bio`, `AvatarURL`, `CreatedAt`, `LastLogin`, `IsActive`) VALUES (5, '13800000005', 'admin', 'admin@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '管理员', '系统管理员账号，用于本地联调与后台验收。', NULL, '2026-04-01 09:40:00', '2026-04-10 10:00:00', 1);

-- ----------------------------
-- Records of userroles
-- ----------------------------
INSERT INTO `userroles` (`UserID`, `RoleID`) VALUES (1, 1);
INSERT INTO `userroles` (`UserID`, `RoleID`) VALUES (1, 2);
INSERT INTO `userroles` (`UserID`, `RoleID`) VALUES (1, 3);
INSERT INTO `userroles` (`UserID`, `RoleID`) VALUES (2, 2);
INSERT INTO `userroles` (`UserID`, `RoleID`) VALUES (3, 3);
INSERT INTO `userroles` (`UserID`, `RoleID`) VALUES (4, 4);
INSERT INTO `userroles` (`UserID`, `RoleID`) VALUES (5, 1);

-- ----------------------------
-- Records of categories
-- ----------------------------
INSERT INTO `categories` (`CategoryID`, `Name`, `Description`, `ParentCategoryID`, `CreatedBy`, `CreatedAt`, `UpdatedAt`) VALUES (1, '前端', '界面、交互与体验优化', NULL, 1, '2026-04-01 10:00:00', '2026-04-01 10:00:00');
INSERT INTO `categories` (`CategoryID`, `Name`, `Description`, `ParentCategoryID`, `CreatedBy`, `CreatedAt`, `UpdatedAt`) VALUES (2, '后端', '接口、鉴权与服务设计', NULL, 1, '2026-04-01 10:01:00', '2026-04-01 10:01:00');
INSERT INTO `categories` (`CategoryID`, `Name`, `Description`, `ParentCategoryID`, `CreatedBy`, `CreatedAt`, `UpdatedAt`) VALUES (3, '数据库', '表结构、索引与 SQL 实战', NULL, 1, '2026-04-01 10:02:00', '2026-04-01 10:02:00');
INSERT INTO `categories` (`CategoryID`, `Name`, `Description`, `ParentCategoryID`, `CreatedBy`, `CreatedAt`, `UpdatedAt`) VALUES (4, '实战', '本地联调、部署与排障记录', NULL, 1, '2026-04-01 10:03:00', '2026-04-01 10:03:00');
INSERT INTO `categories` (`CategoryID`, `Name`, `Description`, `ParentCategoryID`, `CreatedBy`, `CreatedAt`, `UpdatedAt`) VALUES (5, '随笔', '项目中的灵感、复盘与记录', NULL, 1, '2026-04-01 10:04:00', '2026-04-01 10:04:00');

-- ----------------------------
-- Records of tags
-- ----------------------------
INSERT INTO `tags` (`TagID`, `Name`, `Description`, `CreatedBy`, `CreatedAt`) VALUES (1, 'Vue3', '组合式 API 与页面交互', 1, '2026-04-01 10:10:00');
INSERT INTO `tags` (`TagID`, `Name`, `Description`, `CreatedBy`, `CreatedAt`) VALUES (2, 'Express', 'Node.js 服务端接口', 1, '2026-04-01 10:11:00');
INSERT INTO `tags` (`TagID`, `Name`, `Description`, `CreatedBy`, `CreatedAt`) VALUES (3, 'MySQL', '数据库与 SQL', 1, '2026-04-01 10:12:00');
INSERT INTO `tags` (`TagID`, `Name`, `Description`, `CreatedBy`, `CreatedAt`) VALUES (4, 'Spring Boot', 'Java 后端开发', 1, '2026-04-01 10:13:00');
INSERT INTO `tags` (`TagID`, `Name`, `Description`, `CreatedBy`, `CreatedAt`) VALUES (5, 'JavaScript', '语言特性与工程实践', 1, '2026-04-01 10:14:00');
INSERT INTO `tags` (`TagID`, `Name`, `Description`, `CreatedBy`, `CreatedAt`) VALUES (6, '猫猫主题', '与猫猫元素相关的视觉设计', 1, '2026-04-01 10:15:00');
INSERT INTO `tags` (`TagID`, `Name`, `Description`, `CreatedBy`, `CreatedAt`) VALUES (7, '权限鉴权', '登录、游客与授权排查', 1, '2026-04-01 10:16:00');
INSERT INTO `tags` (`TagID`, `Name`, `Description`, `CreatedBy`, `CreatedAt`) VALUES (8, '本地开发', '环境配置与联调', 1, '2026-04-01 10:17:00');

-- ----------------------------
-- Records of posts
-- ----------------------------
INSERT INTO `posts` (`PostID`, `UserID`, `Title`, `Slug`, `Content`, `Excerpt`, `Status`, `CreatedAt`, `UpdatedAt`, `PublishedAt`, `ViewCount`, `FeaturedImageURL`, `CurrentRevisionID`) VALUES (1, 1, '猫猫主题站点改版记录', 'cat-theme-update-log', '# 猫猫主题站点改版记录

这次改版的目标很直接：保留猫猫元素，但不要只是把猫咪贴图堆在页面上，而是让导航、首屏、滚动节奏和文章卡片统一到同一套视觉语言里。

## 这次改了什么

- 首页首屏改成沉浸式全屏布局，猫猫光斑、流体背景和悬浮粒子共同构成第一屏的氛围。
- 导航栏和首页主体共用一组主题变量，解决了顶部和正文区域色差明显的问题。
- 文章列表不再是静态堆叠，而是通过滚动分屏把“首屏展示”和“最新文章”串起来。

## 交互设计上的取舍

1. 动效必须服务阅读，而不是抢内容。
2. 保留猫猫元素，但控制它的密度，避免喧宾夺主。
3. 所有动态效果都要在桌面端和移动端都能稳定工作。

## 后续计划

下一步会继续补齐首页卡片切换、文章区块滑入和主题联动，让整站体验更完整。', '保留猫猫元素的同时，让首页动效、导航和内容区统一成同一套主题语言。', 'published', '2026-04-08 20:00:00', '2026-04-10 10:30:00', '2026-04-09 09:00:00', 28, NULL, NULL);
INSERT INTO `posts` (`PostID`, `UserID`, `Title`, `Slug`, `Content`, `Excerpt`, `Status`, `CreatedAt`, `UpdatedAt`, `PublishedAt`, `ViewCount`, `FeaturedImageURL`, `CurrentRevisionID`) VALUES (2, 1, '前后端本地启动指南', 'local-dev-guide', '# 前后端本地启动指南

这份说明用于本机联调当前项目，默认环境如下：

- MySQL：`localhost:3307`
- 数据库：`techblogdb`
- 数据库账号：`root / root123`
- 后端端口：`3001`
- 前端端口：`5173`

## 推荐顺序

1. 先在 `techblogdb` 库中导入 `backend/backend/database/01-init.sql`。
2. 在 `backend/backend` 目录安装依赖并启动服务。
3. 在 `fontend` 目录安装依赖并启动 Vite。

## 常见问题

### 首页没有文章

先确认数据库里存在至少一篇 `published` 状态的文章。

### 评论列表为空

确认评论接口没有被鉴权中间件误拦截，同时检查文章 ID 是否对应已有评论。

### 图片或头像打不开

确认前端显示时使用的是后端返回的相对路径，并通过统一的资源地址构造函数补全。', '记录当前项目在本机联调时需要的数据库、后端与前端启动参数。', 'published', '2026-04-09 10:30:00', '2026-04-10 10:20:00', '2026-04-09 11:00:00', 36, NULL, NULL);
INSERT INTO `posts` (`PostID`, `UserID`, `Title`, `Slug`, `Content`, `Excerpt`, `Status`, `CreatedAt`, `UpdatedAt`, `PublishedAt`, `ViewCount`, `FeaturedImageURL`, `CurrentRevisionID`) VALUES (3, 2, '游客可见文章却返回 401 的排查思路', 'article-401-troubleshooting', '# 游客可见文章却返回 401 的排查思路

当文章列表本来应该允许游客访问，却仍然返回 401，通常可以沿着三条线排查：

## 1. 路由与中间件

- 检查列表接口是否误挂了强制登录的 `auth` 中间件。
- 如果接口需要“登录可增强、游客可访问”，应该使用可选鉴权中间件。
- 注意固定路由和动态路由的顺序，避免被 `/:id` 之类的路由吞掉。

## 2. 前端代理与请求头

- 检查 Vite 代理是否把请求正确转发到了后端端口。
- 如果浏览器里残留了失效 token，请确认前端不会强行把无效 token 带给所有公共接口。

## 3. 后端返回逻辑

- 公共列表接口应该优先返回文章数据。
- 只有需要登录态才能执行的行为，例如点赞、收藏、删除评论，才应该返回 401 或 403。', '当文章列表接口本应开放给游客却返回 401 时，可以沿着中间件、代理与 token 三条线快速排查。', 'published', '2026-04-09 14:00:00', '2026-04-09 14:25:00', '2026-04-09 14:30:00', 18, NULL, NULL);
INSERT INTO `posts` (`PostID`, `UserID`, `Title`, `Slug`, `Content`, `Excerpt`, `Status`, `CreatedAt`, `UpdatedAt`, `PublishedAt`, `ViewCount`, `FeaturedImageURL`, `CurrentRevisionID`) VALUES (4, 3, 'application.yml 与 application.properties 配置说明', 'spring-application-config-guide', '# application.yml 与 application.properties 配置说明

Spring Boot 常见的配置文件有两种：`application.properties` 和 `application.yml`。

## properties 的特点

- 键值对结构简单
- 适合配置项较少的项目
- 对初学者更直观

## yml 的特点

- 层级更清晰
- 更适合组织复杂配置
- 多环境配置更容易阅读

## 选择建议

如果项目配置已经比较多，优先使用 `application.yml`；
如果团队已经沉淀了统一的 properties 模板，也可以继续沿用，关键是保持一致。', '梳理 Spring Boot 中两种常见配置文件的结构差异、适用场景和团队协作建议。', 'published', '2026-04-07 15:30:00', '2026-04-07 15:50:00', '2026-04-07 16:00:00', 12, NULL, NULL);
INSERT INTO `posts` (`PostID`, `UserID`, `Title`, `Slug`, `Content`, `Excerpt`, `Status`, `CreatedAt`, `UpdatedAt`, `PublishedAt`, `ViewCount`, `FeaturedImageURL`, `CurrentRevisionID`) VALUES (5, 3, '为什么 Spring 要管理 Bean 对象', 'why-spring-manages-beans', '# 为什么 Spring 要管理 Bean 对象

Spring 管理 Bean 的核心目的是把对象创建、依赖注入和生命周期管理统一交给容器处理。

## 这样做的好处

1. 降低对象之间的耦合。
2. 统一管理依赖关系。
3. 更容易替换实现、编写测试和做扩展。

## 从工程角度理解

如果每个业务类都自己 `new` 依赖对象，项目一大就会变得很难维护。
交给 Spring 容器之后，类只关心“我需要什么”，而不是“我如何创建它”。', '从依赖注入、控制反转和工程维护成本三个角度解释 Spring 管理 Bean 的必要性。', 'published', '2026-04-07 18:00:00', '2026-04-07 18:20:00', '2026-04-07 18:30:00', 15, NULL, NULL);
INSERT INTO `posts` (`PostID`, `UserID`, `Title`, `Slug`, `Content`, `Excerpt`, `Status`, `CreatedAt`, `UpdatedAt`, `PublishedAt`, `ViewCount`, `FeaturedImageURL`, `CurrentRevisionID`) VALUES (6, 1, '闭包、IIFE 与 let 的区别', 'closure-iife-let', '# 闭包、IIFE 与 let 的区别

很多关于闭包的困惑，都来自作用域和变量捕获时机没有分清。

## 闭包是什么

闭包本质上是函数和其词法作用域的组合。函数执行结束后，仍然可以访问当时作用域中的变量。

## IIFE 解决了什么

在早期 JavaScript 中，`var` 只有函数作用域，没有块级作用域。
为了在循环里拿到每次迭代的独立变量，常用 IIFE 立即执行函数来制造一个新的作用域。

## let 为什么更直观

`let` 提供了块级作用域，每次循环都会得到一个新的绑定，所以很多以前必须靠 IIFE 解决的问题，现在直接用 `let` 就够了。', '从作用域、变量捕获和循环场景出发，解释闭包、IIFE 与 let 之间的联系与差异。', 'published', '2026-04-06 18:40:00', '2026-04-06 18:55:00', '2026-04-06 19:00:00', 22, NULL, NULL);

-- ----------------------------
-- Records of postcategories
-- ----------------------------
INSERT INTO `postcategories` (`PostID`, `CategoryID`) VALUES (1, 1);
INSERT INTO `postcategories` (`PostID`, `CategoryID`) VALUES (1, 5);
INSERT INTO `postcategories` (`PostID`, `CategoryID`) VALUES (2, 2);
INSERT INTO `postcategories` (`PostID`, `CategoryID`) VALUES (2, 3);
INSERT INTO `postcategories` (`PostID`, `CategoryID`) VALUES (2, 4);
INSERT INTO `postcategories` (`PostID`, `CategoryID`) VALUES (3, 2);
INSERT INTO `postcategories` (`PostID`, `CategoryID`) VALUES (3, 4);
INSERT INTO `postcategories` (`PostID`, `CategoryID`) VALUES (4, 2);
INSERT INTO `postcategories` (`PostID`, `CategoryID`) VALUES (5, 2);
INSERT INTO `postcategories` (`PostID`, `CategoryID`) VALUES (6, 1);

-- ----------------------------
-- Records of posttags
-- ----------------------------
INSERT INTO `posttags` (`PostID`, `TagID`) VALUES (1, 1);
INSERT INTO `posttags` (`PostID`, `TagID`) VALUES (1, 6);
INSERT INTO `posttags` (`PostID`, `TagID`) VALUES (2, 2);
INSERT INTO `posttags` (`PostID`, `TagID`) VALUES (2, 3);
INSERT INTO `posttags` (`PostID`, `TagID`) VALUES (2, 8);
INSERT INTO `posttags` (`PostID`, `TagID`) VALUES (3, 2);
INSERT INTO `posttags` (`PostID`, `TagID`) VALUES (3, 7);
INSERT INTO `posttags` (`PostID`, `TagID`) VALUES (3, 8);
INSERT INTO `posttags` (`PostID`, `TagID`) VALUES (4, 4);
INSERT INTO `posttags` (`PostID`, `TagID`) VALUES (5, 4);
INSERT INTO `posttags` (`PostID`, `TagID`) VALUES (6, 5);

-- ----------------------------
-- Records of postlikes
-- ----------------------------
INSERT INTO `postlikes` (`PostID`, `UserID`, `CreatedAt`) VALUES (1, 4, '2026-04-10 11:25:00');
INSERT INTO `postlikes` (`PostID`, `UserID`, `CreatedAt`) VALUES (1, 5, '2026-04-10 11:26:00');
INSERT INTO `postlikes` (`PostID`, `UserID`, `CreatedAt`) VALUES (2, 4, '2026-04-10 11:27:00');
INSERT INTO `postlikes` (`PostID`, `UserID`, `CreatedAt`) VALUES (3, 1, '2026-04-10 11:28:00');
INSERT INTO `postlikes` (`PostID`, `UserID`, `CreatedAt`) VALUES (6, 2, '2026-04-10 11:29:00');

-- ----------------------------
-- Records of postfavorites
-- ----------------------------
INSERT INTO `postfavorites` (`PostID`, `UserID`, `CreatedAt`) VALUES (1, 5, '2026-04-10 11:30:00');
INSERT INTO `postfavorites` (`PostID`, `UserID`, `CreatedAt`) VALUES (2, 1, '2026-04-10 11:31:00');
INSERT INTO `postfavorites` (`PostID`, `UserID`, `CreatedAt`) VALUES (5, 3, '2026-04-10 11:32:00');

-- ----------------------------
-- Records of postrevisions
-- ----------------------------
INSERT INTO `postrevisions` (`RevisionID`, `PostID`, `UserID`, `Title`, `Content`, `Excerpt`, `RevisionNotes`, `CreatedAt`, `RevisionType`) VALUES (1, 1, 1, '猫猫主题站点改版记录', '# 猫猫主题站点改版记录

这次改版的目标很直接：保留猫猫元素，但不要只是把猫咪贴图堆在页面上，而是让导航、首屏、滚动节奏和文章卡片统一到同一套视觉语言里。

## 这次改了什么

- 首页首屏改成沉浸式全屏布局，猫猫光斑、流体背景和悬浮粒子共同构成第一屏的氛围。
- 导航栏和首页主体共用一组主题变量，解决了顶部和正文区域色差明显的问题。
- 文章列表不再是静态堆叠，而是通过滚动分屏把“首屏展示”和“最新文章”串起来。

## 交互设计上的取舍

1. 动效必须服务阅读，而不是抢内容。
2. 保留猫猫元素，但控制它的密度，避免喧宾夺主。
3. 所有动态效果都要在桌面端和移动端都能稳定工作。

## 后续计划

下一步会继续补齐首页卡片切换、文章区块滑入和主题联动，让整站体验更完整。', '保留猫猫元素的同时，让首页动效、导航和内容区统一成同一套主题语言。', '初始版本', '2026-04-08 20:00:00', 'initial');
INSERT INTO `postrevisions` (`RevisionID`, `PostID`, `UserID`, `Title`, `Content`, `Excerpt`, `RevisionNotes`, `CreatedAt`, `RevisionType`) VALUES (2, 2, 1, '前后端本地启动指南', '# 前后端本地启动指南

这份说明用于本机联调当前项目，默认环境如下：

- MySQL：`localhost:3307`
- 数据库：`techblogdb`
- 数据库账号：`root / root123`
- 后端端口：`3001`
- 前端端口：`5173`

## 推荐顺序

1. 先在 `techblogdb` 库中导入 `backend/backend/database/01-init.sql`。
2. 在 `backend/backend` 目录安装依赖并启动服务。
3. 在 `fontend` 目录安装依赖并启动 Vite。

## 常见问题

### 首页没有文章

先确认数据库里存在至少一篇 `published` 状态的文章。

### 评论列表为空

确认评论接口没有被鉴权中间件误拦截，同时检查文章 ID 是否对应已有评论。

### 图片或头像打不开

确认前端显示时使用的是后端返回的相对路径，并通过统一的资源地址构造函数补全。', '记录当前项目在本机联调时需要的数据库、后端与前端启动参数。', '初始版本', '2026-04-09 10:30:00', 'initial');
INSERT INTO `postrevisions` (`RevisionID`, `PostID`, `UserID`, `Title`, `Content`, `Excerpt`, `RevisionNotes`, `CreatedAt`, `RevisionType`) VALUES (3, 3, 2, '游客可见文章却返回 401 的排查思路', '# 游客可见文章却返回 401 的排查思路

当文章列表本来应该允许游客访问，却仍然返回 401，通常可以沿着三条线排查：

## 1. 路由与中间件

- 检查列表接口是否误挂了强制登录的 `auth` 中间件。
- 如果接口需要“登录可增强、游客可访问”，应该使用可选鉴权中间件。
- 注意固定路由和动态路由的顺序，避免被 `/:id` 之类的路由吞掉。

## 2. 前端代理与请求头

- 检查 Vite 代理是否把请求正确转发到了后端端口。
- 如果浏览器里残留了失效 token，请确认前端不会强行把无效 token 带给所有公共接口。

## 3. 后端返回逻辑

- 公共列表接口应该优先返回文章数据。
- 只有需要登录态才能执行的行为，例如点赞、收藏、删除评论，才应该返回 401 或 403。', '当文章列表接口本应开放给游客却返回 401 时，可以沿着中间件、代理与 token 三条线快速排查。', '初始版本', '2026-04-09 14:00:00', 'initial');
INSERT INTO `postrevisions` (`RevisionID`, `PostID`, `UserID`, `Title`, `Content`, `Excerpt`, `RevisionNotes`, `CreatedAt`, `RevisionType`) VALUES (4, 4, 3, 'application.yml 与 application.properties 配置说明', '# application.yml 与 application.properties 配置说明

Spring Boot 常见的配置文件有两种：`application.properties` 和 `application.yml`。

## properties 的特点

- 键值对结构简单
- 适合配置项较少的项目
- 对初学者更直观

## yml 的特点

- 层级更清晰
- 更适合组织复杂配置
- 多环境配置更容易阅读

## 选择建议

如果项目配置已经比较多，优先使用 `application.yml`；
如果团队已经沉淀了统一的 properties 模板，也可以继续沿用，关键是保持一致。', '梳理 Spring Boot 中两种常见配置文件的结构差异、适用场景和团队协作建议。', '初始版本', '2026-04-07 15:30:00', 'initial');
INSERT INTO `postrevisions` (`RevisionID`, `PostID`, `UserID`, `Title`, `Content`, `Excerpt`, `RevisionNotes`, `CreatedAt`, `RevisionType`) VALUES (5, 5, 3, '为什么 Spring 要管理 Bean 对象', '# 为什么 Spring 要管理 Bean 对象

Spring 管理 Bean 的核心目的是把对象创建、依赖注入和生命周期管理统一交给容器处理。

## 这样做的好处

1. 降低对象之间的耦合。
2. 统一管理依赖关系。
3. 更容易替换实现、编写测试和做扩展。

## 从工程角度理解

如果每个业务类都自己 `new` 依赖对象，项目一大就会变得很难维护。
交给 Spring 容器之后，类只关心“我需要什么”，而不是“我如何创建它”。', '从依赖注入、控制反转和工程维护成本三个角度解释 Spring 管理 Bean 的必要性。', '初始版本', '2026-04-07 18:00:00', 'initial');
INSERT INTO `postrevisions` (`RevisionID`, `PostID`, `UserID`, `Title`, `Content`, `Excerpt`, `RevisionNotes`, `CreatedAt`, `RevisionType`) VALUES (6, 6, 1, '闭包、IIFE 与 let 的区别', '# 闭包、IIFE 与 let 的区别

很多关于闭包的困惑，都来自作用域和变量捕获时机没有分清。

## 闭包是什么

闭包本质上是函数和其词法作用域的组合。函数执行结束后，仍然可以访问当时作用域中的变量。

## IIFE 解决了什么

在早期 JavaScript 中，`var` 只有函数作用域，没有块级作用域。
为了在循环里拿到每次迭代的独立变量，常用 IIFE 立即执行函数来制造一个新的作用域。

## let 为什么更直观

`let` 提供了块级作用域，每次循环都会得到一个新的绑定，所以很多以前必须靠 IIFE 解决的问题，现在直接用 `let` 就够了。', '从作用域、变量捕获和循环场景出发，解释闭包、IIFE 与 let 之间的联系与差异。', '初始版本', '2026-04-06 18:40:00', 'initial');

-- ----------------------------
-- Sync current revision pointers
-- ----------------------------
UPDATE `posts` SET `CurrentRevisionID` = 1 WHERE `PostID` = 1;
UPDATE `posts` SET `CurrentRevisionID` = 2 WHERE `PostID` = 2;
UPDATE `posts` SET `CurrentRevisionID` = 3 WHERE `PostID` = 3;
UPDATE `posts` SET `CurrentRevisionID` = 4 WHERE `PostID` = 4;
UPDATE `posts` SET `CurrentRevisionID` = 5 WHERE `PostID` = 5;
UPDATE `posts` SET `CurrentRevisionID` = 6 WHERE `PostID` = 6;

-- ----------------------------
-- Records of comments
-- ----------------------------
INSERT INTO `comments` (`CommentID`, `PostID`, `UserID`, `ParentCommentID`, `Content`, `Status`, `CreatedAt`, `LastEditedAt`, `CanDelete`) VALUES (1, 2, 4, NULL, '这份启动说明很清楚，按 3307 / 3001 / 5173 配置后就跑通了。', 'approved', '2026-04-10 10:40:00', NULL, 1);
INSERT INTO `comments` (`CommentID`, `PostID`, `UserID`, `ParentCommentID`, `Content`, `Status`, `CreatedAt`, `LastEditedAt`, `CanDelete`) VALUES (2, 2, 5, 1, '如果首页还是没有文章，先确认数据库里至少存在一篇 published 状态的文章。', 'approved', '2026-04-10 10:45:00', NULL, 1);
INSERT INTO `comments` (`CommentID`, `PostID`, `UserID`, `ParentCommentID`, `Content`, `Status`, `CreatedAt`, `LastEditedAt`, `CanDelete`) VALUES (3, 3, 2, NULL, 'optionalAuth 和 auth 混用时最容易出问题，尤其是路由顺序被动态参数吞掉的时候。', 'approved', '2026-04-10 11:00:00', NULL, 1);
INSERT INTO `comments` (`CommentID`, `PostID`, `UserID`, `ParentCommentID`, `Content`, `Status`, `CreatedAt`, `LastEditedAt`, `CanDelete`) VALUES (4, 1, 3, NULL, '猫猫元素保留得不错，滚动动画也很顺滑。', 'approved', '2026-04-10 11:10:00', NULL, 1);
INSERT INTO `comments` (`CommentID`, `PostID`, `UserID`, `ParentCommentID`, `Content`, `Status`, `CreatedAt`, `LastEditedAt`, `CanDelete`) VALUES (5, 6, 4, NULL, '闭包这段解释比很多面试题答案更好懂。', 'approved', '2026-04-10 11:20:00', NULL, 1);

-- ----------------------------
-- Records of operationlogs
-- ----------------------------
INSERT INTO `operationlogs` (`LogID`, `UserID`, `OperationType`, `TargetType`, `TargetID`, `Details`, `IPAddress`, `UserAgent`, `Timestamp`) VALUES (1, 5, 'login', 'user', 5, '{"username":"admin","loginMethod":"username"}', '127.0.0.1', 'Chrome', '2026-04-10 10:00:00');
INSERT INTO `operationlogs` (`LogID`, `UserID`, `OperationType`, `TargetType`, `TargetID`, `Details`, `IPAddress`, `UserAgent`, `Timestamp`) VALUES (2, 1, 'create', 'post', 1, '{"title":"猫猫主题站点改版记录"}', '127.0.0.1', 'Chrome', '2026-04-10 10:05:00');
INSERT INTO `operationlogs` (`LogID`, `UserID`, `OperationType`, `TargetType`, `TargetID`, `Details`, `IPAddress`, `UserAgent`, `Timestamp`) VALUES (3, 1, 'create', 'post', 2, '{"title":"前后端本地启动指南"}', '127.0.0.1', 'Chrome', '2026-04-10 10:06:00');
INSERT INTO `operationlogs` (`LogID`, `UserID`, `OperationType`, `TargetType`, `TargetID`, `Details`, `IPAddress`, `UserAgent`, `Timestamp`) VALUES (4, 2, 'create', 'post', 3, '{"title":"游客可见文章却返回 401 的排查思路"}', '127.0.0.1', 'Chrome', '2026-04-10 10:07:00');

-- ----------------------------
-- Triggers structure for table for posts
-- ----------------------------

SET FOREIGN_KEY_CHECKS = 1;
