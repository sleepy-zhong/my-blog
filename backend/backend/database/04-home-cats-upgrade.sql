SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

USE `techblogdb`;

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
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

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

SET FOREIGN_KEY_CHECKS = 1;
