# database 目录说明

## 导入顺序

- 生产环境：先导入 `01-init.sql`，再按发布顺序执行补丁 SQL
- 本地联调 / 精简演示环境：先导入 `01-init.sql`，再导入 `seed-local-dev.sql`
- 本地联调 / 完整演示环境：先导入 `01-init.sql`，再导入 `seed-local-full.sql`

示例：

```bash
mysql -uroot -p techblogdb < 01-init.sql
mysql -uroot -p techblogdb < seed-local-full.sql
```

## 文件职责

- `01-init.sql`：基础表结构、索引、外键和触发器，包含当前运行版本所需表
- `04-home-cats-upgrade.sql`：首页猫猫补丁脚本，面向旧库升级
- `seed-local-dev.sql`：精简本地演示数据，适合快速联调
- `seed-local-full.sql`：当前本机完整演示数据快照，适合完整还原本地可运行库

## 适用说明

- `seed-local-dev.sql` 和 `seed-local-full.sql` 都只用于本地 / 演示环境
- `seed-local-full.sql` 会包含当前本机快照里的完整业务数据、站点设置与附件记录
- 如果需要一套与当前本机接近的演示环境，优先使用 `seed-local-full.sql`

## 已验证恢复结果

- 已用全新 MySQL 8 空库验证 `01-init.sql + seed-local-full.sql` 可完整导入
- 验证结果：
  - `users`: 7
  - `posts`: 17
  - `comments`: 29
  - `categories`: 8
  - `tags`: 18
  - `attachments`: 34
  - `sitesettings`: 1
  - `homecats`: 9
- 文章状态分布：
  - `published`: 16
  - `draft`: 1
- 站点设置恢复结果：
  - `SiteName`: `sleepyzhong`
  - `LogoURL`: `/api/attachments/75/preview`
  - `FaviconURL`: `/api/attachments/76/preview`

## 上线注意事项

- 生产环境不要导入 `seed-local-dev.sql` 或 `seed-local-full.sql`
- `04-home-cats-upgrade.sql` 面向旧库升级；如果使用新的 `01-init.sql` 初始化空库，不需要重复执行它
- 首页猫图文件需要和数据库记录同时存在；仓库里的 `/uploads/home-cats` 会在 Docker 首次启动时自动补到上传卷
- `seed-local-full.sql` 只固化数据库记录，不包含附件和头像等上传文件本体；如果要完整还原演示效果，需要同时准备对应的 `uploads/` 目录内容
