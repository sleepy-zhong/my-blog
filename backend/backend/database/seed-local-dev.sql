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

INSERT INTO `roles` (`RoleID`, `Name`, `Description`) VALUES (1, 'admin', '系统管理员');
INSERT INTO `roles` (`RoleID`, `Name`, `Description`) VALUES (2, 'editor', '内容编辑');
INSERT INTO `roles` (`RoleID`, `Name`, `Description`) VALUES (3, 'author', '文章作者');
INSERT INTO `roles` (`RoleID`, `Name`, `Description`) VALUES (4, 'user', '普通用户');
INSERT INTO `roles` (`RoleID`, `Name`, `Description`) VALUES (14, 'viewer', '访客');

-- ----------------------------
-- Records of users
-- ----------------------------
INSERT INTO `users` (`UserID`, `PhoneNumber`, `Username`, `Email`, `PasswordHash`, `DisplayName`, `Bio`, `AvatarURL`, `CreatedAt`, `LastLogin`, `IsActive`) VALUES (1, '19123635145', 'sleepyzhong', 'alice@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Sleepyzhong', '喜欢记录开发过程，也会把踩坑和修复方案整理成文档。', NULL, '2026-04-01 09:00:00', '2026-04-10 09:15:00', 1);
INSERT INTO `users` (`UserID`, `PhoneNumber`, `Username`, `Email`, `PasswordHash`, `DisplayName`, `Bio`, `AvatarURL`, `CreatedAt`, `LastLogin`, `IsActive`) VALUES (2, '13800000002', 'bob', 'bob@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Bob', '后端开发爱好者，偏爱接口设计和服务稳定性。', NULL, '2026-04-01 09:10:00', '2026-04-10 08:40:00', 1);
INSERT INTO `users` (`UserID`, `PhoneNumber`, `Username`, `Email`, `PasswordHash`, `DisplayName`, `Bio`, `AvatarURL`, `CreatedAt`, `LastLogin`, `IsActive`) VALUES (3, '13800000003', 'charlie', 'charlie@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Charlie', '主要关注 Vue、Node.js 和工程化实践。', NULL, '2026-04-01 09:20:00', '2026-04-09 22:10:00', 1);
INSERT INTO `users` (`UserID`, `PhoneNumber`, `Username`, `Email`, `PasswordHash`, `DisplayName`, `Bio`, `AvatarURL`, `CreatedAt`, `LastLogin`, `IsActive`) VALUES (4, '13800000004', 'david', 'david@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'David', '日常会整理前端问题，也会帮忙验证交互细节。', NULL, '2026-04-01 09:30:00', '2026-04-09 21:05:00', 1);
INSERT INTO `users` (`UserID`, `PhoneNumber`, `Username`, `Email`, `PasswordHash`, `DisplayName`, `Bio`, `AvatarURL`, `CreatedAt`, `LastLogin`, `IsActive`) VALUES (5, '13800000005', 'admin', 'admin@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '管理员', '负责维护本地演示环境和后台基础配置。', NULL, '2026-04-01 09:40:00', '2026-04-10 10:00:00', 1);

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
INSERT INTO `categories` (`CategoryID`, `Name`, `Description`, `ParentCategoryID`, `CreatedBy`, `CreatedAt`, `UpdatedAt`) VALUES (1, '前端', '记录前端开发经验与页面交互优化。', NULL, 1, '2026-04-01 10:00:00', '2026-04-01 10:00:00');
INSERT INTO `categories` (`CategoryID`, `Name`, `Description`, `ParentCategoryID`, `CreatedBy`, `CreatedAt`, `UpdatedAt`) VALUES (2, '后端', '记录接口设计、权限和服务端问题处理。', NULL, 1, '2026-04-01 10:01:00', '2026-04-01 10:01:00');
INSERT INTO `categories` (`CategoryID`, `Name`, `Description`, `ParentCategoryID`, `CreatedBy`, `CreatedAt`, `UpdatedAt`) VALUES (3, '数据库', '整理 MySQL、表结构和 SQL 排查经验。', NULL, 1, '2026-04-01 10:02:00', '2026-04-01 10:02:00');
INSERT INTO `categories` (`CategoryID`, `Name`, `Description`, `ParentCategoryID`, `CreatedBy`, `CreatedAt`, `UpdatedAt`) VALUES (4, '运维', '记录部署、代理、环境变量和排障过程。', NULL, 1, '2026-04-01 10:03:00', '2026-04-01 10:03:00');
INSERT INTO `categories` (`CategoryID`, `Name`, `Description`, `ParentCategoryID`, `CreatedBy`, `CreatedAt`, `UpdatedAt`) VALUES (5, '随笔', '一些产品想法、界面调整和项目更新说明。', NULL, 1, '2026-04-01 10:04:00', '2026-04-01 10:04:00');

-- ----------------------------
-- Records of tags
-- ----------------------------
INSERT INTO `tags` (`TagID`, `Name`, `Description`, `CreatedBy`, `CreatedAt`) VALUES (1, 'Vue3', '组合式 API 和组件开发实践。', 1, '2026-04-01 10:10:00');
INSERT INTO `tags` (`TagID`, `Name`, `Description`, `CreatedBy`, `CreatedAt`) VALUES (2, 'Express', 'Node.js 服务端接口开发。', 1, '2026-04-01 10:11:00');
INSERT INTO `tags` (`TagID`, `Name`, `Description`, `CreatedBy`, `CreatedAt`) VALUES (3, 'MySQL', '数据库设计与 SQL 排查。', 1, '2026-04-01 10:12:00');
INSERT INTO `tags` (`TagID`, `Name`, `Description`, `CreatedBy`, `CreatedAt`) VALUES (4, 'Spring Boot', 'Java 后端项目经验整理。', 1, '2026-04-01 10:13:00');
INSERT INTO `tags` (`TagID`, `Name`, `Description`, `CreatedBy`, `CreatedAt`) VALUES (5, 'JavaScript', '语言基础与常见陷阱总结。', 1, '2026-04-01 10:14:00');
INSERT INTO `tags` (`TagID`, `Name`, `Description`, `CreatedBy`, `CreatedAt`) VALUES (6, '界面优化', '页面布局、视觉与交互调整。', 1, '2026-04-01 10:15:00');
INSERT INTO `tags` (`TagID`, `Name`, `Description`, `CreatedBy`, `CreatedAt`) VALUES (7, '权限控制', '登录鉴权、会话和访问控制。', 1, '2026-04-01 10:16:00');
INSERT INTO `tags` (`TagID`, `Name`, `Description`, `CreatedBy`, `CreatedAt`) VALUES (8, '排障记录', '问题复盘与修复过程。', 1, '2026-04-01 10:17:00');

-- ----------------------------
-- Home cat defaults
-- ----------------------------
CREATE TABLE IF NOT EXISTS `homecats` (
  `HomeCatID` int NOT NULL AUTO_INCREMENT,
  `Name` varchar(80) NOT NULL,
  `Label` varchar(80) NOT NULL,
  `SpeechText` varchar(500) NOT NULL,
  `ImageURL` varchar(500) NOT NULL,
  `SortOrder` int NOT NULL DEFAULT 0,
  `IsActive` tinyint(1) NOT NULL DEFAULT 1,
  `IsFeatured` tinyint(1) NOT NULL DEFAULT 0,
  `CreatedBy` int NOT NULL,
  `CreatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `UpdatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`HomeCatID`) USING BTREE,
  INDEX `idx_homecats_active_sort` (`IsActive`, `IsFeatured`, `SortOrder`) USING BTREE,
  INDEX `idx_homecats_creator` (`CreatedBy`) USING BTREE,
  CONSTRAINT `fk_homecats_user`
    FOREIGN KEY (`CreatedBy`) REFERENCES `users` (`UserID`)
    ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET @HomeCatAuthorId := COALESCE(
  (SELECT `UserID` FROM `users` WHERE `Username` = 'sleepyzhong' LIMIT 1),
  (SELECT `UserID` FROM `users` WHERE `Username` = 'admin' LIMIT 1),
  (SELECT MIN(`UserID`) FROM `users`)
);

INSERT INTO `homecats` (`Name`, `Label`, `SpeechText`, `ImageURL`, `SortOrder`, `IsActive`, `IsFeatured`, `CreatedBy`)
SELECT 'Orange-1', 'Orange-1', 'Meow. Welcome to the nebula.', '/uploads/home-cats/orange-1.png', 1, 1, 1, @HomeCatAuthorId
FROM DUAL
WHERE @HomeCatAuthorId IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM `homecats` WHERE `Name` = 'Orange-1');

INSERT INTO `homecats` (`Name`, `Label`, `SpeechText`, `ImageURL`, `SortOrder`, `IsActive`, `IsFeatured`, `CreatedBy`)
SELECT 'Orange-2', 'Orange-2', 'Pat the cat, then read the post.', '/uploads/home-cats/orange-2.png', 2, 1, 0, @HomeCatAuthorId
FROM DUAL
WHERE @HomeCatAuthorId IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM `homecats` WHERE `Name` = 'Orange-2');

INSERT INTO `homecats` (`Name`, `Label`, `SpeechText`, `ImageURL`, `SortOrder`, `IsActive`, `IsFeatured`, `CreatedBy`)
SELECT 'Orange-3', 'Orange-3', 'Signal locked. Cozy mode online.', '/uploads/home-cats/orange-3.png', 3, 1, 0, @HomeCatAuthorId
FROM DUAL
WHERE @HomeCatAuthorId IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM `homecats` WHERE `Name` = 'Orange-3');

INSERT INTO `homecats` (`Name`, `Label`, `SpeechText`, `ImageURL`, `SortOrder`, `IsActive`, `IsFeatured`, `CreatedBy`)
SELECT 'Orange-4', 'Orange-4', 'Fresh stories detected ahead.', '/uploads/home-cats/orange-4.png', 4, 1, 0, @HomeCatAuthorId
FROM DUAL
WHERE @HomeCatAuthorId IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM `homecats` WHERE `Name` = 'Orange-4');

INSERT INTO `homecats` (`Name`, `Label`, `SpeechText`, `ImageURL`, `SortOrder`, `IsActive`, `IsFeatured`, `CreatedBy`)
SELECT 'Orange-5', 'Orange-5', 'Keep scrolling, more cats await.', '/uploads/home-cats/orange-5.png', 5, 1, 0, @HomeCatAuthorId
FROM DUAL
WHERE @HomeCatAuthorId IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM `homecats` WHERE `Name` = 'Orange-5');

INSERT INTO `homecats` (`Name`, `Label`, `SpeechText`, `ImageURL`, `SortOrder`, `IsActive`, `IsFeatured`, `CreatedBy`)
SELECT 'Orange-6', 'Orange-6', 'Night watch cat on duty.', '/uploads/home-cats/orange-6.png', 6, 1, 0, @HomeCatAuthorId
FROM DUAL
WHERE @HomeCatAuthorId IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM `homecats` WHERE `Name` = 'Orange-6');

INSERT INTO `homecats` (`Name`, `Label`, `SpeechText`, `ImageURL`, `SortOrder`, `IsActive`, `IsFeatured`, `CreatedBy`)
SELECT '625-1', '625-1', 'Orbit stable. Reading route clear.', '/uploads/home-cats/625-1.png', 7, 1, 0, @HomeCatAuthorId
FROM DUAL
WHERE @HomeCatAuthorId IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM `homecats` WHERE `Name` = '625-1');

INSERT INTO `homecats` (`Name`, `Label`, `SpeechText`, `ImageURL`, `SortOrder`, `IsActive`, `IsFeatured`, `CreatedBy`)
SELECT '625-2', '625-2', 'Meow. Docking complete.', '/uploads/home-cats/625-2.png', 8, 1, 0, @HomeCatAuthorId
FROM DUAL
WHERE @HomeCatAuthorId IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM `homecats` WHERE `Name` = '625-2');

-- ----------------------------
-- Records of posts
-- ----------------------------
INSERT INTO `posts` (`PostID`, `UserID`, `Title`, `Slug`, `Content`, `Excerpt`, `Status`, `CreatedAt`, `UpdatedAt`, `PublishedAt`, `ViewCount`, `FeaturedImageURL`, `CurrentRevisionID`) VALUES (1, 1, '首页猫咪主题更新记录', 'cat-theme-update-log', '# 首页猫咪主题更新记录

这次首页改版重点放在猫咪插画、首屏氛围和文章入口的平衡上，希望页面更有记忆点，也方便继续扩展后续活动素材。

## 这次调整了什么

- 重新梳理了首页视觉层次，让插画和正文入口不会互相抢焦点
- 把猫咪素材拆成可管理的数据项，方便后台继续维护
- 优化了首页卡片和列表的留白，让阅读节奏更舒服

## 接下来准备做什么

1. 继续补齐后台管理入口
2. 统一首页和文章详情页的视觉语言
3. 给移动端补上更稳定的适配方案

## 小结

这次先把基础风格打稳，后面再继续补动态效果和内容运营能力。', '记录首页猫咪主题改版的方向、拆分方式和后续计划。', 'published', '2026-04-08 20:00:00', '2026-04-10 10:30:00', '2026-04-09 09:00:00', 28, NULL, NULL);
INSERT INTO `posts` (`PostID`, `UserID`, `Title`, `Slug`, `Content`, `Excerpt`, `Status`, `CreatedAt`, `UpdatedAt`, `PublishedAt`, `ViewCount`, `FeaturedImageURL`, `CurrentRevisionID`) VALUES (2, 1, '本地开发环境快速说明', 'local-dev-guide', '# 本地开发环境快速说明

为了让本地联调更顺畅，项目里把常用端口和初始化步骤做了统一约定。

- MySQL：`localhost:3307`
- 数据库：`techblogdb`
- 默认账号：`root / root123`
- 后端端口：`3001`
- 前端端口：`5173`

## 初始化步骤

1. 先创建 `techblogdb`，再执行 `backend/backend/database/01-init.sql`
2. 进入 `backend/backend` 安装依赖并启动服务
3. 进入 `fontend` 安装依赖并启动 Vite

## 联调提醒

### 文章可见性

游客默认只能看到 `published` 状态的文章。

### 分类和标签

如果列表筛选异常，先检查分类 ID 和标签 ID 是否与种子数据一致。

### 接口代理

前端开发环境需要确认代理配置正常，否则容易把接口请求打到错误地址。', '快速说明本地数据库、端口约定和前后端联调步骤。', 'published', '2026-04-09 10:30:00', '2026-04-10 10:20:00', '2026-04-09 11:00:00', 36, NULL, NULL);
INSERT INTO `posts` (`PostID`, `UserID`, `Title`, `Slug`, `Content`, `Excerpt`, `Status`, `CreatedAt`, `UpdatedAt`, `PublishedAt`, `ViewCount`, `FeaturedImageURL`, `CurrentRevisionID`) VALUES (3, 2, '文章接口 401 排查记录', 'article-401-troubleshooting', '# 文章接口 401 排查记录

最近联调时碰到文章接口返回 401，这里把排查过程整理一下，方便后续快速定位。

## 1. 先看中间件顺序

- 是否把需要游客访问的接口错误地挂到了 `auth` 后面
- 是否有路由顺序导致固定路径被动态参数吞掉
- 是否把公开接口误接到了后台鉴权链路里

## 2. 再看前端请求

- 检查 Vite 代理是否把请求转发到了正确后端
- 确认前端是否错误依赖 token，而当前项目真实使用的是 cookie 会话

## 3. 最后看响应语义

- 认证失败应该返回 401
- 权限不足则应该明确区分成 403', '整理一次文章接口 401 的排查过程，重点提醒不要把 cookie 会话误当成 token。', 'published', '2026-04-09 14:00:00', '2026-04-09 14:25:00', '2026-04-09 14:30:00', 18, NULL, NULL);
INSERT INTO `posts` (`PostID`, `UserID`, `Title`, `Slug`, `Content`, `Excerpt`, `Status`, `CreatedAt`, `UpdatedAt`, `PublishedAt`, `ViewCount`, `FeaturedImageURL`, `CurrentRevisionID`) VALUES (4, 3, 'application.yml 和 application.properties 怎么选', 'spring-application-config-guide', '# application.yml 和 application.properties 怎么选

Spring Boot 项目里最常见的配置文件就是 `application.properties` 和 `application.yml`。

## properties 的特点

- 语法直接
- 对新同学更友好
- 适合简单配置

## yml 的特点

- 层级结构清晰
- 复杂配置更容易维护
- 更适合多环境拆分

## 我的建议

如果项目配置比较简单，用 `application.properties` 也完全够用。
如果配置项已经有明显层级，切换到 `application.yml` 会更省心。', '结合 Spring Boot 常见场景，对比两种配置文件的使用体验。', 'published', '2026-04-07 15:30:00', '2026-04-07 15:50:00', '2026-04-07 16:00:00', 12, NULL, NULL);
INSERT INTO `posts` (`PostID`, `UserID`, `Title`, `Slug`, `Content`, `Excerpt`, `Status`, `CreatedAt`, `UpdatedAt`, `PublishedAt`, `ViewCount`, `FeaturedImageURL`, `CurrentRevisionID`) VALUES (5, 3, '为什么 Spring 要管理 Bean', 'why-spring-manages-beans', '# 为什么 Spring 要管理 Bean

Spring 管理 Bean 的核心意义，不只是少写几个 `new`，而是把对象生命周期和依赖关系统一收口。

## 直接收益

1. 依赖注入更清晰
2. 组件职责更容易拆分
3. 测试和替换实现成本更低

## 更重要的一点

如果所有对象都自己手动创建，后续想做扩展、代理或统一配置都会越来越吃力。
交给 Spring 管理后，很多横切能力就有了稳定落点。', '从依赖注入和生命周期两个角度解释 Spring 为什么要管理 Bean。', 'published', '2026-04-07 18:00:00', '2026-04-07 18:20:00', '2026-04-07 18:30:00', 15, NULL, NULL);
INSERT INTO `posts` (`PostID`, `UserID`, `Title`, `Slug`, `Content`, `Excerpt`, `Status`, `CreatedAt`, `UpdatedAt`, `PublishedAt`, `ViewCount`, `FeaturedImageURL`, `CurrentRevisionID`) VALUES (6, 1, '循环里为什么以前要用 IIFE，现在更多用 let', 'closure-iife-let', '# 循环里为什么以前要用 IIFE，现在更多用 let

这是一个很典型的 JavaScript 闭包问题，经常出现在老代码和面试题里。

## 先看问题来源

过去如果在循环里使用 `var`，多个回调可能会共享同一个作用域变量，导致结果不符合预期。

## IIFE 的解决方式

早期 JavaScript 里没有块级作用域，所以经常借助 IIFE 人为创建一个独立作用域，把当前值包进去。

## let 为什么更自然

`let` 自带块级作用域，每次循环都会生成更贴近直觉的绑定，因此现在大多数场景都不需要再手写 IIFE 了。', '解释老项目里 IIFE 的来历，以及现代 JavaScript 为什么更常用 let。', 'published', '2026-04-06 18:40:00', '2026-04-06 18:55:00', '2026-04-06 19:00:00', 22, NULL, NULL);

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
INSERT INTO `postrevisions` (`RevisionID`, `PostID`, `UserID`, `Title`, `Content`, `Excerpt`, `RevisionNotes`, `CreatedAt`, `RevisionType`) VALUES (1, 1, 1, '首页猫咪主题更新记录', '# 首页猫咪主题更新记录

这次首页改版重点放在猫咪插画、首屏氛围和文章入口的平衡上，希望页面更有记忆点，也方便继续扩展后续活动素材。

## 这次调整了什么

- 重新梳理了首页视觉层次，让插画和正文入口不会互相抢焦点
- 把猫咪素材拆成可管理的数据项，方便后台继续维护
- 优化了首页卡片和列表的留白，让阅读节奏更舒服

## 接下来准备做什么

1. 继续补齐后台管理入口
2. 统一首页和文章详情页的视觉语言
3. 给移动端补上更稳定的适配方案

## 小结

这次先把基础风格打稳，后面再继续补动态效果和内容运营能力。', '记录首页猫咪主题改版的方向、拆分方式和后续计划。', '初始导入', '2026-04-08 20:00:00', 'initial');
INSERT INTO `postrevisions` (`RevisionID`, `PostID`, `UserID`, `Title`, `Content`, `Excerpt`, `RevisionNotes`, `CreatedAt`, `RevisionType`) VALUES (2, 2, 1, '本地开发环境快速说明', '# 本地开发环境快速说明

为了让本地联调更顺畅，项目里把常用端口和初始化步骤做了统一约定。

- MySQL：`localhost:3307`
- 数据库：`techblogdb`
- 默认账号：`root / root123`
- 后端端口：`3001`
- 前端端口：`5173`

## 初始化步骤

1. 先创建 `techblogdb`，再执行 `backend/backend/database/01-init.sql`
2. 进入 `backend/backend` 安装依赖并启动服务
3. 进入 `fontend` 安装依赖并启动 Vite

## 联调提醒

### 文章可见性

游客默认只能看到 `published` 状态的文章。

### 分类和标签

如果列表筛选异常，先检查分类 ID 和标签 ID 是否与种子数据一致。

### 接口代理

前端开发环境需要确认代理配置正常，否则容易把接口请求打到错误地址。', '快速说明本地数据库、端口约定和前后端联调步骤。', '初始导入', '2026-04-09 10:30:00', 'initial');
INSERT INTO `postrevisions` (`RevisionID`, `PostID`, `UserID`, `Title`, `Content`, `Excerpt`, `RevisionNotes`, `CreatedAt`, `RevisionType`) VALUES (3, 3, 2, '文章接口 401 排查记录', '# 文章接口 401 排查记录

最近联调时碰到文章接口返回 401，这里把排查过程整理一下，方便后续快速定位。

## 1. 先看中间件顺序

- 是否把需要游客访问的接口错误地挂到了 `auth` 后面
- 是否有路由顺序导致固定路径被动态参数吞掉
- 是否把公开接口误接到了后台鉴权链路里

## 2. 再看前端请求

- 检查 Vite 代理是否把请求转发到了正确后端
- 确认前端是否错误依赖 token，而当前项目真实使用的是 cookie 会话

## 3. 最后看响应语义

- 认证失败应该返回 401
- 权限不足则应该明确区分成 403', '整理一次文章接口 401 的排查过程，重点提醒不要把 cookie 会话误当成 token。', '初始导入', '2026-04-09 14:00:00', 'initial');
INSERT INTO `postrevisions` (`RevisionID`, `PostID`, `UserID`, `Title`, `Content`, `Excerpt`, `RevisionNotes`, `CreatedAt`, `RevisionType`) VALUES (4, 4, 3, 'application.yml 和 application.properties 怎么选', '# application.yml 和 application.properties 怎么选

Spring Boot 项目里最常见的配置文件就是 `application.properties` 和 `application.yml`。

## properties 的特点

- 语法直接
- 对新同学更友好
- 适合简单配置

## yml 的特点

- 层级结构清晰
- 复杂配置更容易维护
- 更适合多环境拆分

## 我的建议

如果项目配置比较简单，用 `application.properties` 也完全够用。
如果配置项已经有明显层级，切换到 `application.yml` 会更省心。', '结合 Spring Boot 常见场景，对比两种配置文件的使用体验。', '初始导入', '2026-04-07 15:30:00', 'initial');
INSERT INTO `postrevisions` (`RevisionID`, `PostID`, `UserID`, `Title`, `Content`, `Excerpt`, `RevisionNotes`, `CreatedAt`, `RevisionType`) VALUES (5, 5, 3, '为什么 Spring 要管理 Bean', '# 为什么 Spring 要管理 Bean

Spring 管理 Bean 的核心意义，不只是少写几个 `new`，而是把对象生命周期和依赖关系统一收口。

## 直接收益

1. 依赖注入更清晰
2. 组件职责更容易拆分
3. 测试和替换实现成本更低

## 更重要的一点

如果所有对象都自己手动创建，后续想做扩展、代理或统一配置都会越来越吃力。
交给 Spring 管理后，很多横切能力就有了稳定落点。', '从依赖注入和生命周期两个角度解释 Spring 为什么要管理 Bean。', '初始导入', '2026-04-07 18:00:00', 'initial');
INSERT INTO `postrevisions` (`RevisionID`, `PostID`, `UserID`, `Title`, `Content`, `Excerpt`, `RevisionNotes`, `CreatedAt`, `RevisionType`) VALUES (6, 6, 1, '循环里为什么以前要用 IIFE，现在更多用 let', '# 循环里为什么以前要用 IIFE，现在更多用 let

这是一个很典型的 JavaScript 闭包问题，经常出现在老代码和面试题里。

## 先看问题来源

过去如果在循环里使用 `var`，多个回调可能会共享同一个作用域变量，导致结果不符合预期。

## IIFE 的解决方式

早期 JavaScript 里没有块级作用域，所以经常借助 IIFE 人为创建一个独立作用域，把当前值包进去。

## let 为什么更自然

`let` 自带块级作用域，每次循环都会生成更贴近直觉的绑定，因此现在大多数场景都不需要再手写 IIFE 了。', '解释老项目里 IIFE 的来历，以及现代 JavaScript 为什么更常用 let。', '初始导入', '2026-04-06 18:40:00', 'initial');

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
INSERT INTO `comments` (`CommentID`, `PostID`, `UserID`, `ParentCommentID`, `Content`, `Status`, `CreatedAt`, `LastEditedAt`, `CanDelete`) VALUES (1, 2, 4, NULL, '这个端口说明很实用，3307 / 3001 / 5173 一眼就能对上。', 'approved', '2026-04-10 10:40:00', NULL, 1);
INSERT INTO `comments` (`CommentID`, `PostID`, `UserID`, `ParentCommentID`, `Content`, `Status`, `CreatedAt`, `LastEditedAt`, `CanDelete`) VALUES (2, 2, 5, 1, '补充一下，联调前最好先确认文章状态里确实有 published 数据。', 'approved', '2026-04-10 10:45:00', NULL, 1);
INSERT INTO `comments` (`CommentID`, `PostID`, `UserID`, `ParentCommentID`, `Content`, `Status`, `CreatedAt`, `LastEditedAt`, `CanDelete`) VALUES (3, 3, 2, NULL, '`optionalAuth` 和 `auth` 的区别确实很关键，公开接口这里特别容易踩坑。', 'approved', '2026-04-10 11:00:00', NULL, 1);
INSERT INTO `comments` (`CommentID`, `PostID`, `UserID`, `ParentCommentID`, `Content`, `Status`, `CreatedAt`, `LastEditedAt`, `CanDelete`) VALUES (4, 1, 3, NULL, '首页猫咪主题现在比之前有辨识度多了。', 'approved', '2026-04-10 11:10:00', NULL, 1);
INSERT INTO `comments` (`CommentID`, `PostID`, `UserID`, `ParentCommentID`, `Content`, `Status`, `CreatedAt`, `LastEditedAt`, `CanDelete`) VALUES (5, 6, 4, NULL, '这篇把闭包问题讲得很顺，适合给新同学看。', 'approved', '2026-04-10 11:20:00', NULL, 1);

-- ----------------------------
-- Records of operationlogs
-- ----------------------------
INSERT INTO `operationlogs` (`LogID`, `UserID`, `OperationType`, `TargetType`, `TargetID`, `Details`, `IPAddress`, `UserAgent`, `Timestamp`) VALUES (1, 5, 'login', 'user', 5, '{"username":"admin","loginMethod":"username"}', '127.0.0.1', 'Chrome', '2026-04-10 10:00:00');
INSERT INTO `operationlogs` (`LogID`, `UserID`, `OperationType`, `TargetType`, `TargetID`, `Details`, `IPAddress`, `UserAgent`, `Timestamp`) VALUES (2, 1, 'create', 'post', 1, '{"title":"首页猫咪主题更新记录"}', '127.0.0.1', 'Chrome', '2026-04-10 10:05:00');
INSERT INTO `operationlogs` (`LogID`, `UserID`, `OperationType`, `TargetType`, `TargetID`, `Details`, `IPAddress`, `UserAgent`, `Timestamp`) VALUES (3, 1, 'create', 'post', 2, '{"title":"本地开发环境快速说明"}', '127.0.0.1', 'Chrome', '2026-04-10 10:06:00');
INSERT INTO `operationlogs` (`LogID`, `UserID`, `OperationType`, `TargetType`, `TargetID`, `Details`, `IPAddress`, `UserAgent`, `Timestamp`) VALUES (4, 2, 'create', 'post', 3, '{"title":"文章接口 401 排查记录"}', '127.0.0.1', 'Chrome', '2026-04-10 10:07:00');

-- ----------------------------
-- Triggers structure for table for posts
-- ----------------------------

SET FOREIGN_KEY_CHECKS = 1;
