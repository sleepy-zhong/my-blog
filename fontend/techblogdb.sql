/*
 Navicat Premium Data Transfer

 Source Server         : localhost_3306
 Source Server Type    : MySQL
 Source Server Version : 80019
 Source Host           : localhost:3306
 Source Schema         : techblogdb

 Target Server Type    : MySQL
 Target Server Version : 80019
 File Encoding         : 65001

 Date: 10/08/2025 13:03:11
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for attachments
-- ----------------------------
DROP TABLE IF EXISTS `attachments`;
CREATE TABLE `attachments`  (
  `AttachmentID` int NOT NULL AUTO_INCREMENT COMMENT '附件ID',
  `PostID` int NOT NULL COMMENT '关联文章',
  `UserID` int NOT NULL COMMENT '上传者',
  `OriginalName` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '原始文件名',
  `StoredName` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '存储文件名',
  `MimeType` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '文件类型',
  `FileSize` int NOT NULL COMMENT '文件大小(字节)',
  `UploadedAt` timestamp(0) NULL DEFAULT CURRENT_TIMESTAMP(0) COMMENT '上传时间',
  `Description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '文件描述',
  PRIMARY KEY (`AttachmentID`) USING BTREE,
  UNIQUE INDEX `StoredName`(`StoredName`) USING BTREE,
  INDEX `FK_Attachments_Posts`(`PostID`) USING BTREE,
  INDEX `FK_Attachments_Users`(`UserID`) USING BTREE,
  CONSTRAINT `FK_Attachments_Posts` FOREIGN KEY (`PostID`) REFERENCES `posts` (`PostID`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `FK_Attachments_Users` FOREIGN KEY (`UserID`) REFERENCES `users` (`UserID`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 7 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '文件附件表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for categories
-- ----------------------------
DROP TABLE IF EXISTS `categories`;
CREATE TABLE `categories`  (
  `CategoryID` int NOT NULL AUTO_INCREMENT COMMENT '分类ID',
  `Name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '分类名称',
  `Description` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '分类描述',
  `ParentCategoryID` int NULL DEFAULT NULL COMMENT '父分类ID',
  `CreatedBy` int NOT NULL COMMENT '创建者',
  `CreatedAt` timestamp(0) NULL DEFAULT CURRENT_TIMESTAMP(0) COMMENT '创建时间',
  `UpdatedAt` timestamp(0) NULL DEFAULT CURRENT_TIMESTAMP(0) ON UPDATE CURRENT_TIMESTAMP(0) COMMENT '更新时间',
  PRIMARY KEY (`CategoryID`) USING BTREE,
  UNIQUE INDEX `Name`(`Name`) USING BTREE,
  INDEX `FK_Categories_Self`(`ParentCategoryID`) USING BTREE,
  INDEX `FK_Categories_Users`(`CreatedBy`) USING BTREE,
  CONSTRAINT `FK_Categories_Self` FOREIGN KEY (`ParentCategoryID`) REFERENCES `categories` (`CategoryID`) ON DELETE SET NULL ON UPDATE RESTRICT,
  CONSTRAINT `FK_Categories_Users` FOREIGN KEY (`CreatedBy`) REFERENCES `users` (`UserID`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 14 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '文章分类表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for comments
-- ----------------------------
DROP TABLE IF EXISTS `comments`;
CREATE TABLE `comments`  (
  `CommentID` int NOT NULL AUTO_INCREMENT COMMENT '评论ID',
  `PostID` int NOT NULL COMMENT '文章ID',
  `UserID` int NULL DEFAULT NULL COMMENT '用户ID',
  `ParentCommentID` int NULL DEFAULT NULL COMMENT '父评论ID',
  `Content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '评论内容',
  `Status` enum('approved','pending','spam') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT 'approved' COMMENT '审核状态',
  `CreatedAt` timestamp(0) NULL DEFAULT CURRENT_TIMESTAMP(0) COMMENT '创建时间',
  `LastEditedAt` timestamp(0) NULL DEFAULT NULL COMMENT '编辑时间',
  `CanDelete` tinyint(1) NULL DEFAULT 1 COMMENT '用户是否可删除',
  PRIMARY KEY (`CommentID`) USING BTREE,
  INDEX `FK_Comments_Posts`(`PostID`) USING BTREE,
  INDEX `FK_Comments_Users`(`UserID`) USING BTREE,
  INDEX `FK_Comments_Parent`(`ParentCommentID`) USING BTREE,
  CONSTRAINT `FK_Comments_Parent` FOREIGN KEY (`ParentCommentID`) REFERENCES `comments` (`CommentID`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `FK_Comments_Posts` FOREIGN KEY (`PostID`) REFERENCES `posts` (`PostID`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `FK_Comments_Users` FOREIGN KEY (`UserID`) REFERENCES `users` (`UserID`) ON DELETE SET NULL ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 17 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '文章评论表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for operationlogs
-- ----------------------------
DROP TABLE IF EXISTS `operationlogs`;
CREATE TABLE `operationlogs`  (
  `LogID` int NOT NULL AUTO_INCREMENT COMMENT '日志ID',
  `UserID` int NULL DEFAULT NULL COMMENT '操作用户ID',
  `OperationType` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '操作类型',
  `TargetType` enum('post','comment','user','category','tag','revision') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '操作对象类型',
  `TargetID` int NULL DEFAULT NULL COMMENT '操作对象ID',
  `Details` json NULL COMMENT '操作详情',
  `IPAddress` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '操作IP',
  `UserAgent` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '浏览器标识',
  `Timestamp` timestamp(0) NULL DEFAULT CURRENT_TIMESTAMP(0) COMMENT '操作时间',
  PRIMARY KEY (`LogID`) USING BTREE,
  INDEX `FK_Logs_Users`(`UserID`) USING BTREE,
  CONSTRAINT `FK_Logs_Users` FOREIGN KEY (`UserID`) REFERENCES `users` (`UserID`) ON DELETE SET NULL ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 86 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '系统操作日志' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for postcategories
-- ----------------------------
DROP TABLE IF EXISTS `postcategories`;
CREATE TABLE `postcategories`  (
  `PostID` int NOT NULL COMMENT '文章ID',
  `CategoryID` int NOT NULL COMMENT '分类ID',
  PRIMARY KEY (`PostID`, `CategoryID`) USING BTREE,
  INDEX `FK_PostCategories_Categories`(`CategoryID`) USING BTREE,
  CONSTRAINT `FK_PostCategories_Categories` FOREIGN KEY (`CategoryID`) REFERENCES `categories` (`CategoryID`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `FK_PostCategories_Posts` FOREIGN KEY (`PostID`) REFERENCES `posts` (`PostID`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '文章分类关系表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for postrevisions
-- ----------------------------
DROP TABLE IF EXISTS `postrevisions`;
CREATE TABLE `postrevisions`  (
  `RevisionID` int NOT NULL AUTO_INCREMENT COMMENT '修订版本ID',
  `PostID` int NOT NULL COMMENT '关联文章ID',
  `UserID` int NOT NULL COMMENT '修改者ID',
  `Title` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '修订标题',
  `Content` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '修订内容',
  `Excerpt` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '修订摘要',
  `RevisionNotes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '修订说明',
  `CreatedAt` timestamp(0) NULL DEFAULT CURRENT_TIMESTAMP(0) COMMENT '修订时间',
  `RevisionType` enum('initial','update','rollback') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT 'update' COMMENT '修订类型',
  PRIMARY KEY (`RevisionID`) USING BTREE,
  INDEX `FK_Revisions_Posts`(`PostID`) USING BTREE,
  INDEX `FK_Revisions_Users`(`UserID`) USING BTREE,
  CONSTRAINT `FK_Revisions_Posts` FOREIGN KEY (`PostID`) REFERENCES `posts` (`PostID`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `FK_Revisions_Users` FOREIGN KEY (`UserID`) REFERENCES `users` (`UserID`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 30 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '文章修订历史' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for posts
-- ----------------------------
DROP TABLE IF EXISTS `posts`;
CREATE TABLE `posts`  (
  `PostID` int NOT NULL AUTO_INCREMENT COMMENT '文章唯一标识',
  `UserID` int NOT NULL COMMENT '作者ID',
  `Title` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '文章标题',
  `Slug` varchar(220) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT 'URL友好标识',
  `Content` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '文章内容',
  `Excerpt` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '文章摘要',
  `Status` enum('draft','published','archived') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT 'draft' COMMENT '文章状态',
  `CreatedAt` timestamp(0) NULL DEFAULT CURRENT_TIMESTAMP(0) COMMENT '创建时间',
  `UpdatedAt` timestamp(0) NULL DEFAULT CURRENT_TIMESTAMP(0) ON UPDATE CURRENT_TIMESTAMP(0) COMMENT '更新时间',
  `PublishedAt` timestamp(0) NULL DEFAULT NULL COMMENT '发布时间',
  `ViewCount` int NULL DEFAULT 0 COMMENT '浏览次数',
  `FeaturedImageURL` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '封面图URL',
  `CurrentRevisionID` int NULL DEFAULT NULL COMMENT '当前生效的修订版本',
  PRIMARY KEY (`PostID`) USING BTREE,
  UNIQUE INDEX `Slug`(`Slug`) USING BTREE,
  INDEX `FK_Posts_Users`(`UserID`) USING BTREE,
  CONSTRAINT `FK_Posts_Users` FOREIGN KEY (`UserID`) REFERENCES `users` (`UserID`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 30 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '博客文章表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for posttags
-- ----------------------------
DROP TABLE IF EXISTS `posttags`;
CREATE TABLE `posttags`  (
  `PostID` int NOT NULL COMMENT '文章ID',
  `TagID` int NOT NULL COMMENT '标签ID',
  PRIMARY KEY (`PostID`, `TagID`) USING BTREE,
  INDEX `FK_PostTags_Tags`(`TagID`) USING BTREE,
  CONSTRAINT `FK_PostTags_Posts` FOREIGN KEY (`PostID`) REFERENCES `posts` (`PostID`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `FK_PostTags_Tags` FOREIGN KEY (`TagID`) REFERENCES `tags` (`TagID`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '文章标签关系表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for roles
-- ----------------------------
DROP TABLE IF EXISTS `roles`;
CREATE TABLE `roles`  (
  `RoleID` int NOT NULL AUTO_INCREMENT,
  `Name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  PRIMARY KEY (`RoleID`) USING BTREE,
  UNIQUE INDEX `Name`(`Name`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 15 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tags
-- ----------------------------
DROP TABLE IF EXISTS `tags`;
CREATE TABLE `tags`  (
  `TagID` int NOT NULL AUTO_INCREMENT COMMENT '标签ID',
  `Name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '标签名称',
  `Description` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '标签描述',
  `CreatedBy` int NOT NULL COMMENT '创建者',
  `CreatedAt` timestamp(0) NULL DEFAULT CURRENT_TIMESTAMP(0) COMMENT '创建时间',
  PRIMARY KEY (`TagID`) USING BTREE,
  UNIQUE INDEX `Name`(`Name`) USING BTREE,
  INDEX `FK_Tags_Users`(`CreatedBy`) USING BTREE,
  CONSTRAINT `FK_Tags_Users` FOREIGN KEY (`CreatedBy`) REFERENCES `users` (`UserID`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 13 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '文章标签表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for userroles
-- ----------------------------
DROP TABLE IF EXISTS `userroles`;
CREATE TABLE `userroles`  (
  `UserID` int NOT NULL,
  `RoleID` int NOT NULL,
  PRIMARY KEY (`UserID`, `RoleID`) USING BTREE,
  INDEX `RoleID`(`RoleID`) USING BTREE,
  CONSTRAINT `userroles_ibfk_1` FOREIGN KEY (`UserID`) REFERENCES `users` (`UserID`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `userroles_ibfk_2` FOREIGN KEY (`RoleID`) REFERENCES `roles` (`RoleID`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '用户-角色关联表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for users
-- ----------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users`  (
  `UserID` int NOT NULL AUTO_INCREMENT COMMENT '用户唯一标识',
  `PhoneNumber` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '手机号（可用于登录）',
  `Username` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '登录用户名',
  `Email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '用户邮箱',
  `PasswordHash` char(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT 'BCrypt加密的密码',
  `DisplayName` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '显示名称',
  `Bio` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '个人简介',
  `AvatarURL` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '头像URL',
  `CreatedAt` timestamp(0) NULL DEFAULT CURRENT_TIMESTAMP(0) COMMENT '创建时间',
  `LastLogin` timestamp(0) NULL DEFAULT NULL COMMENT '最后登录时间',
  `IsActive` tinyint(1) NULL DEFAULT 1 COMMENT '账户状态',
  PRIMARY KEY (`UserID`) USING BTREE,
  UNIQUE INDEX `Username`(`Username`) USING BTREE,
  UNIQUE INDEX `Email`(`Email`) USING BTREE,
  UNIQUE INDEX `PhoneNumber`(`PhoneNumber`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 39 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '系统用户表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for verificationcodes
-- ----------------------------
DROP TABLE IF EXISTS `verificationcodes`;
CREATE TABLE `verificationcodes`  (
  `Id` int NOT NULL AUTO_INCREMENT,
  `Email` varchar(100) NOT NULL,
  `Code` varchar(10) NOT NULL,
  `Scene` varchar(50) NOT NULL COMMENT 'register | change_email',
  `ExpiresAt` timestamp NULL DEFAULT NULL,
  `Used` tinyint(1) NOT NULL DEFAULT 0,
  `UserID` int NULL DEFAULT NULL,
  `CreatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`Id`) USING BTREE,
  INDEX `Email`(`Email`) USING BTREE,
  INDEX `Scene`(`Scene`) USING BTREE,
  INDEX `ExpiresAt`(`ExpiresAt`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '邮箱验证码' ROW_FORMAT = Dynamic;

DROP TRIGGER IF EXISTS `Before_Post_Update`;
delimiter ;;
CREATE TRIGGER `Before_Post_Update` BEFORE UPDATE ON `posts` FOR EACH ROW BEGIN
    IF OLD.Content <> NEW.Content OR OLD.Title <> NEW.Title THEN
        INSERT INTO PostRevisions (
            PostID, UserID, Title, Content, Excerpt, RevisionNotes
        ) VALUES (
            OLD.PostID,
            NEW.UserID,
            OLD.Title,
            OLD.Content,
            OLD.Excerpt,
            '系统自动保存的修订版本'
        );
        SET NEW.CurrentRevisionID = LAST_INSERT_ID();
    END IF;
END
;;
delimiter ;

SET FOREIGN_KEY_CHECKS = 1;
