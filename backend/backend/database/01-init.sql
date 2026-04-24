-- MySQL dump 10.13  Distrib 8.0.46, for Linux (x86_64)
--
-- Host: localhost    Database: techblogdb
-- ------------------------------------------------------
-- Server version	8.0.46

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `attachments`
--

DROP TABLE IF EXISTS `attachments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `attachments` (
  `AttachmentID` int NOT NULL AUTO_INCREMENT COMMENT '附件ID',
  `PostID` int DEFAULT NULL COMMENT '关联文章（可为空，表示临时附件）',
  `UserID` int NOT NULL COMMENT '上传者',
  `OriginalName` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '原始文件名',
  `StoredName` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '存储文件名',
  `MimeType` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '文件类型',
  `StoragePath` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '物理存储路径，相对/绝对',
  `FileSize` int NOT NULL COMMENT '文件大小(字节)',
  `UploadedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '上传时间',
  `IsTemporary` tinyint(1) NOT NULL DEFAULT '1' COMMENT '是否临时（未最终关联文章）',
  `TempKey` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '编辑会话键（用于 Draft 期归属）',
  `Description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '文件描述',
  `RefCount` int NOT NULL DEFAULT '0' COMMENT '引用计数（当前文章内容中引用次数）',
  `IsDeleted` tinyint(1) NOT NULL DEFAULT '0' COMMENT '软删除标记',
  `DeletedAt` timestamp NULL DEFAULT NULL COMMENT '软删除时间',
  `FileHash` char(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `IsExternal` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否外链',
  `ExternalURL` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '外链原始地址',
  PRIMARY KEY (`AttachmentID`) USING BTREE,
  UNIQUE KEY `StoredName` (`StoredName`) USING BTREE,
  UNIQUE KEY `UK_Attachments_PostID_FileHash` (`PostID`,`FileHash`) USING BTREE,
  KEY `FK_Attachments_Users` (`UserID`) USING BTREE,
  KEY `IDX_Attachments_FileHash` (`FileHash`) USING BTREE,
  KEY `IDX_Attachments_TempKey` (`TempKey`) USING BTREE,
  KEY `IDX_Attachments_IsTemporary` (`IsTemporary`) USING BTREE,
  CONSTRAINT `FK_Attachments_Posts` FOREIGN KEY (`PostID`) REFERENCES `posts` (`PostID`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `FK_Attachments_Users` FOREIGN KEY (`UserID`) REFERENCES `users` (`UserID`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=77 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci ROW_FORMAT=DYNAMIC COMMENT='文件附件表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `authsessions`
--

DROP TABLE IF EXISTS `authsessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `authsessions` (
  `SessionID` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '会话ID，建议使用UUID',
  `UserID` int NOT NULL COMMENT '所属用户ID',
  `RefreshTokenHash` char(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT 'Refresh Token 哈希值（SHA-256）',
  `LoginMethod` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '登录方式，如 email / phone / username',
  `DeviceName` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '设备名称',
  `ClientType` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '客户端类型，如 web / admin / mobile',
  `UserAgent` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '浏览器或客户端标识',
  `IPAddress` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '登录IP',
  `RememberMe` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否长会话',
  `Status` enum('active','revoked') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'active' COMMENT '会话状态',
  `LoginAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '登录时间',
  `LastSeenAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '最近活跃时间',
  `ExpiresAt` timestamp NOT NULL COMMENT 'Refresh Token 过期时间',
  `RevokedAt` timestamp NULL DEFAULT NULL COMMENT '会话撤销时间',
  `RevokedReason` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '撤销原因',
  PRIMARY KEY (`SessionID`) USING BTREE,
  UNIQUE KEY `uk_authsessions_refresh_hash` (`RefreshTokenHash`) USING BTREE,
  KEY `idx_authsessions_user_status` (`UserID`,`Status`) USING BTREE,
  KEY `idx_authsessions_user_last_seen` (`UserID`,`LastSeenAt`) USING BTREE,
  KEY `idx_authsessions_expires_at` (`ExpiresAt`) USING BTREE,
  KEY `idx_authsessions_status_last_seen` (`Status`,`LastSeenAt`) USING BTREE,
  CONSTRAINT `fk_authsessions_user` FOREIGN KEY (`UserID`) REFERENCES `users` (`UserID`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='认证会话表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categories` (
  `CategoryID` int NOT NULL AUTO_INCREMENT COMMENT '分类ID',
  `Name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '分类名称',
  `Description` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '分类描述',
  `ParentCategoryID` int DEFAULT NULL COMMENT '父分类ID',
  `CreatedBy` int NOT NULL COMMENT '创建者',
  `CreatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `UpdatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`CategoryID`) USING BTREE,
  UNIQUE KEY `Name` (`Name`) USING BTREE,
  KEY `FK_Categories_Self` (`ParentCategoryID`) USING BTREE,
  KEY `FK_Categories_Users` (`CreatedBy`) USING BTREE,
  CONSTRAINT `FK_Categories_Self` FOREIGN KEY (`ParentCategoryID`) REFERENCES `categories` (`CategoryID`) ON DELETE SET NULL ON UPDATE RESTRICT,
  CONSTRAINT `FK_Categories_Users` FOREIGN KEY (`CreatedBy`) REFERENCES `users` (`UserID`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci ROW_FORMAT=DYNAMIC COMMENT='文章分类表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `comments`
--

DROP TABLE IF EXISTS `comments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `comments` (
  `CommentID` int NOT NULL AUTO_INCREMENT COMMENT '评论ID',
  `PostID` int NOT NULL COMMENT '文章ID',
  `UserID` int DEFAULT NULL COMMENT '用户ID',
  `ParentCommentID` int DEFAULT NULL COMMENT '父评论ID',
  `Content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '评论内容',
  `Status` enum('approved','pending','spam') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT 'approved' COMMENT '审核状态',
  `CreatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `LastEditedAt` timestamp NULL DEFAULT NULL COMMENT '编辑时间',
  `CanDelete` tinyint(1) DEFAULT '1' COMMENT '用户是否可删除',
  PRIMARY KEY (`CommentID`) USING BTREE,
  KEY `FK_Comments_Posts` (`PostID`) USING BTREE,
  KEY `FK_Comments_Users` (`UserID`) USING BTREE,
  KEY `FK_Comments_Parent` (`ParentCommentID`) USING BTREE,
  CONSTRAINT `FK_Comments_Parent` FOREIGN KEY (`ParentCommentID`) REFERENCES `comments` (`CommentID`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `FK_Comments_Posts` FOREIGN KEY (`PostID`) REFERENCES `posts` (`PostID`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `FK_Comments_Users` FOREIGN KEY (`UserID`) REFERENCES `users` (`UserID`) ON DELETE SET NULL ON UPDATE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=44 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci ROW_FORMAT=DYNAMIC COMMENT='文章评论表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `homecats`
--

DROP TABLE IF EXISTS `homecats`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `homecats` (
  `HomeCatID` int NOT NULL AUTO_INCREMENT,
  `Name` varchar(80) NOT NULL,
  `Label` varchar(80) NOT NULL,
  `SpeechText` varchar(500) NOT NULL,
  `ImageURL` varchar(500) NOT NULL,
  `SortOrder` int NOT NULL DEFAULT '0',
  `IsActive` tinyint(1) NOT NULL DEFAULT '1',
  `IsFeatured` tinyint(1) NOT NULL DEFAULT '0',
  `CreatedBy` int NOT NULL,
  `CreatedAt` datetime DEFAULT NULL,
  `UpdatedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`HomeCatID`),
  KEY `CreatedBy` (`CreatedBy`),
  CONSTRAINT `homecats_ibfk_1` FOREIGN KEY (`CreatedBy`) REFERENCES `users` (`UserID`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `operationlogs`
--

DROP TABLE IF EXISTS `operationlogs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `operationlogs` (
  `LogID` int NOT NULL AUTO_INCREMENT COMMENT '日志ID',
  `UserID` int DEFAULT NULL COMMENT '操作用户ID',
  `OperationType` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '操作类型',
  `TargetType` enum('post','comment','user','category','tag','revision') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '操作对象类型',
  `TargetID` int DEFAULT NULL COMMENT '操作对象ID',
  `Details` json DEFAULT NULL COMMENT '操作详情',
  `IPAddress` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '操作IP',
  `UserAgent` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '浏览器标识',
  `Timestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',
  PRIMARY KEY (`LogID`) USING BTREE,
  KEY `FK_Logs_Users` (`UserID`) USING BTREE,
  CONSTRAINT `FK_Logs_Users` FOREIGN KEY (`UserID`) REFERENCES `users` (`UserID`) ON DELETE SET NULL ON UPDATE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=203 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci ROW_FORMAT=DYNAMIC COMMENT='系统操作日志';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `postcategories`
--

DROP TABLE IF EXISTS `postcategories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `postcategories` (
  `PostID` int NOT NULL COMMENT '文章ID',
  `CategoryID` int NOT NULL COMMENT '分类ID',
  PRIMARY KEY (`PostID`,`CategoryID`) USING BTREE,
  KEY `FK_PostCategories_Categories` (`CategoryID`) USING BTREE,
  CONSTRAINT `FK_PostCategories_Categories` FOREIGN KEY (`CategoryID`) REFERENCES `categories` (`CategoryID`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `FK_PostCategories_Posts` FOREIGN KEY (`PostID`) REFERENCES `posts` (`PostID`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci ROW_FORMAT=DYNAMIC COMMENT='文章分类关系表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `postfavorites`
--

DROP TABLE IF EXISTS `postfavorites`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `postfavorites` (
  `PostID` int NOT NULL,
  `UserID` int NOT NULL,
  `CreatedAt` datetime NOT NULL,
  PRIMARY KEY (`PostID`,`UserID`),
  UNIQUE KEY `postfavorites_UserID_PostID_unique` (`PostID`,`UserID`),
  KEY `UserID` (`UserID`),
  CONSTRAINT `postfavorites_ibfk_1` FOREIGN KEY (`PostID`) REFERENCES `posts` (`PostID`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `postfavorites_ibfk_2` FOREIGN KEY (`UserID`) REFERENCES `users` (`UserID`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `postlikes`
--

DROP TABLE IF EXISTS `postlikes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `postlikes` (
  `PostID` int NOT NULL,
  `UserID` int NOT NULL,
  `CreatedAt` datetime NOT NULL,
  PRIMARY KEY (`PostID`,`UserID`),
  UNIQUE KEY `postlikes_UserID_PostID_unique` (`PostID`,`UserID`),
  KEY `UserID` (`UserID`),
  CONSTRAINT `postlikes_ibfk_1` FOREIGN KEY (`PostID`) REFERENCES `posts` (`PostID`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `postlikes_ibfk_2` FOREIGN KEY (`UserID`) REFERENCES `users` (`UserID`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `postrevisions`
--

DROP TABLE IF EXISTS `postrevisions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `postrevisions` (
  `RevisionID` int NOT NULL AUTO_INCREMENT COMMENT '修订版本ID',
  `PostID` int NOT NULL COMMENT '关联文章ID',
  `UserID` int NOT NULL COMMENT '修改者ID',
  `Title` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '修订标题',
  `Content` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '修订内容',
  `Excerpt` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '修订摘要',
  `RevisionNotes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci COMMENT '修订说明',
  `CreatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '修订时间',
  `RevisionType` enum('initial','update','rollback') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT 'update' COMMENT '修订类型',
  PRIMARY KEY (`RevisionID`) USING BTREE,
  KEY `FK_Revisions_Posts` (`PostID`) USING BTREE,
  KEY `FK_Revisions_Users` (`UserID`) USING BTREE,
  CONSTRAINT `FK_Revisions_Posts` FOREIGN KEY (`PostID`) REFERENCES `posts` (`PostID`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `FK_Revisions_Users` FOREIGN KEY (`UserID`) REFERENCES `users` (`UserID`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=110 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci ROW_FORMAT=DYNAMIC COMMENT='文章修订历史';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `posts`
--

DROP TABLE IF EXISTS `posts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `posts` (
  `PostID` int NOT NULL AUTO_INCREMENT COMMENT '文章唯一标识',
  `UserID` int NOT NULL COMMENT '作者ID',
  `Title` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '文章标题',
  `Slug` varchar(220) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT 'URL友好标识',
  `Content` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '文章内容',
  `Excerpt` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '文章摘要',
  `Status` enum('draft','published','archived') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT 'draft' COMMENT '文章状态',
  `CreatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `UpdatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `PublishedAt` timestamp NULL DEFAULT NULL COMMENT '发布时间',
  `ViewCount` int DEFAULT '0' COMMENT '浏览次数',
  `FeaturedImageURL` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '封面图URL',
  `CurrentRevisionID` int DEFAULT NULL COMMENT '当前生效的修订版本',
  PRIMARY KEY (`PostID`) USING BTREE,
  UNIQUE KEY `Slug` (`Slug`) USING BTREE,
  KEY `FK_Posts_Users` (`UserID`) USING BTREE,
  KEY `idx_posts_status_publishedat` (`Status`,`PublishedAt`) USING BTREE,
  FULLTEXT KEY `ft_posts_title_excerpt_content` (`Title`,`Excerpt`,`Content`),
  CONSTRAINT `FK_Posts_Users` FOREIGN KEY (`UserID`) REFERENCES `users` (`UserID`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=66 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci ROW_FORMAT=DYNAMIC COMMENT='博客文章表';
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `Before_Post_Update` BEFORE UPDATE ON `posts` FOR EACH ROW BEGIN
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
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `posttags`
--

DROP TABLE IF EXISTS `posttags`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `posttags` (
  `PostID` int NOT NULL COMMENT '文章ID',
  `TagID` int NOT NULL COMMENT '标签ID',
  PRIMARY KEY (`PostID`,`TagID`) USING BTREE,
  KEY `FK_PostTags_Tags` (`TagID`) USING BTREE,
  CONSTRAINT `FK_PostTags_Posts` FOREIGN KEY (`PostID`) REFERENCES `posts` (`PostID`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `FK_PostTags_Tags` FOREIGN KEY (`TagID`) REFERENCES `tags` (`TagID`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci ROW_FORMAT=DYNAMIC COMMENT='文章标签关系表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `RoleID` int NOT NULL AUTO_INCREMENT,
  `Name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`RoleID`) USING BTREE,
  UNIQUE KEY `Name` (`Name`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sitesettings`
--

DROP TABLE IF EXISTS `sitesettings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sitesettings` (
  `SiteSettingID` int NOT NULL AUTO_INCREMENT,
  `SiteName` varchar(120) NOT NULL DEFAULT 'TechBlogDB',
  `Description` varchar(500) NOT NULL DEFAULT '一个技术博客系统',
  `LogoURL` varchar(500) NOT NULL DEFAULT '',
  `FaviconURL` varchar(500) NOT NULL DEFAULT '',
  `Analytics` text,
  `SocialLinks` text,
  `UpdatedBy` int DEFAULT NULL,
  `CreatedAt` datetime NOT NULL,
  `UpdatedAt` datetime NOT NULL,
  PRIMARY KEY (`SiteSettingID`),
  KEY `UpdatedBy` (`UpdatedBy`),
  CONSTRAINT `sitesettings_ibfk_1` FOREIGN KEY (`UpdatedBy`) REFERENCES `users` (`UserID`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tags`
--

DROP TABLE IF EXISTS `tags`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tags` (
  `TagID` int NOT NULL AUTO_INCREMENT COMMENT '标签ID',
  `Name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '标签名称',
  `Description` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '标签描述',
  `CreatedBy` int NOT NULL COMMENT '创建者',
  `CreatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`TagID`) USING BTREE,
  UNIQUE KEY `Name` (`Name`) USING BTREE,
  KEY `FK_Tags_Users` (`CreatedBy`) USING BTREE,
  CONSTRAINT `FK_Tags_Users` FOREIGN KEY (`CreatedBy`) REFERENCES `users` (`UserID`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci ROW_FORMAT=DYNAMIC COMMENT='文章标签表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tokenblacklists`
--

DROP TABLE IF EXISTS `tokenblacklists`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tokenblacklists` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `TokenHash` varchar(64) NOT NULL,
  `UserID` int DEFAULT NULL,
  `ExpiresAt` datetime DEFAULT NULL,
  `CreatedAt` datetime NOT NULL,
  PRIMARY KEY (`Id`),
  UNIQUE KEY `TokenHash` (`TokenHash`),
  KEY `UserID` (`UserID`),
  CONSTRAINT `tokenblacklists_ibfk_1` FOREIGN KEY (`UserID`) REFERENCES `users` (`UserID`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `userroles`
--

DROP TABLE IF EXISTS `userroles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `userroles` (
  `UserID` int NOT NULL,
  `RoleID` int NOT NULL,
  PRIMARY KEY (`UserID`,`RoleID`) USING BTREE,
  KEY `RoleID` (`RoleID`) USING BTREE,
  CONSTRAINT `userroles_ibfk_1` FOREIGN KEY (`UserID`) REFERENCES `users` (`UserID`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `userroles_ibfk_2` FOREIGN KEY (`RoleID`) REFERENCES `roles` (`RoleID`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC COMMENT='用户-角色关联表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `UserID` int NOT NULL AUTO_INCREMENT COMMENT '用户唯一标识',
  `PhoneNumber` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '手机号（可用于登录）',
  `Username` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '登录用户名',
  `Email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '用户邮箱',
  `PasswordHash` char(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT 'BCrypt加密的密码',
  `DisplayName` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '显示名称',
  `Bio` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci COMMENT '个人简介',
  `AvatarURL` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '头像URL',
  `CreatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `LastLogin` timestamp NULL DEFAULT NULL COMMENT '最后登录时间',
  `LastSeenAt` timestamp NULL DEFAULT NULL COMMENT '最后活跃时间',
  `IsActive` tinyint(1) DEFAULT '1' COMMENT '账户状态',
  `SessionVersion` int NOT NULL DEFAULT '1' COMMENT '会话版本号，修改密码或强制下线时递增',
  PRIMARY KEY (`UserID`) USING BTREE,
  UNIQUE KEY `Username` (`Username`) USING BTREE,
  UNIQUE KEY `Email` (`Email`) USING BTREE,
  UNIQUE KEY `PhoneNumber` (`PhoneNumber`) USING BTREE,
  KEY `idx_users_last_seen` (`LastSeenAt`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=45 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci ROW_FORMAT=DYNAMIC COMMENT='系统用户表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `verificationcodes`
--

DROP TABLE IF EXISTS `verificationcodes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `verificationcodes` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `Email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Code` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Scene` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT 'register | login | change_password | forgot_password | change_email',
  `ExpiresAt` timestamp NULL DEFAULT NULL,
  `Used` tinyint(1) NOT NULL DEFAULT '0',
  `UserID` int DEFAULT NULL,
  `CreatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`Id`) USING BTREE,
  KEY `Email` (`Email`) USING BTREE,
  KEY `Scene` (`Scene`) USING BTREE,
  KEY `ExpiresAt` (`ExpiresAt`) USING BTREE,
  KEY `verificationcodes__email` (`Email`) USING BTREE,
  KEY `verificationcodes__scene` (`Scene`) USING BTREE,
  KEY `verificationcodes__expires_at` (`ExpiresAt`) USING BTREE,
  KEY `idx_verificationcodes_lookup` (`Email`,`Scene`,`Used`,`ExpiresAt`) USING BTREE,
  KEY `idx_verificationcodes_recent` (`Email`,`Scene`,`CreatedAt`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci ROW_FORMAT=DYNAMIC COMMENT='邮箱验证码';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping routines for database 'techblogdb'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-24  8:40:20
