## 2025-08-12

### 文章创建/更新（原子性与冲突处理）
- 将创建与更新文章时对 `categoryIds`、`tagIds` 的关联写入操作包裹进数据库事务，确保原子性。
- 创建、更新时新增操作日志写入均纳入同一事务。
- 捕获 `Slug` 唯一键冲突并返回 `409`（`SequelizeUniqueConstraintError`）。

涉及编辑：
- `controllers/articleController.js`：`createArticle`、`updateArticle`

### 文章列表/计数接口（多维筛选、字段投影、关联展开、排序）
- 新增多分类/多标签筛选（CSV），支持并集/交集模式：`categoryMode=any|all`、`tagMode=any|all`。
- 新增字段投影 `fields`（仅作用于文章主表字段），默认 `PostID,Title,Excerpt,PublishedAt,CreatedAt,ViewCount`。
- 新增关联展开 `include`（`categories,tags,user`）。
- 新增排序参数 `sort`（例如 `PublishedAt:desc,CreatedAt:desc`）。
- 保持对旧参数 `category`、`tag` 的兼容。

参数校验：
- 对 `fields` 做白名单校验（基于 `Article.rawAttributes`）。非法字段将返回 `400`。
- 对 `include` 做白名单校验（允许：`categories`、`tags`、`user`）。非法 include 返回 `400`。

新增端点：
- `GET /api/articles/count`：与列表同过滤，仅返回 `total`。

涉及编辑：
- `controllers/articleController.js`：`getArticles` 增强与校验、`getArticlesCount` 增强
- `routes/article.js`：Swagger 注释补充参数说明与新增 `/count` 路由

### 分类与标签统计/热门（若已存在则为增强）
- `GET /api/categories/summary`：分类统计，支持 `status`、`keyword`、`tags`、`tagMode`。（如已存在则注释与实现增强）
- `GET /api/tags/popular`：热门标签 Top N，支持 `limit`、`status`、`keyword`、`categories`、`categoryMode`。（如已存在则注释与实现增强）

涉及编辑：
- `controllers/categoryController.js`、`routes/category.js`
- `controllers/tagController.js`、`routes/tag.js`

### 数据库
- 已建议并执行索引优化：
  - `CREATE INDEX idx_posts_status_publishedat ON posts (Status, PublishedAt);`
  - 可选全文索引（若启用）：`ALTER TABLE posts ADD FULLTEXT INDEX ft_posts_title_excerpt_content (Title, Excerpt, Content);`

### 兼容性说明
- 旧的单分类/单标签参数 `category`、`tag` 仍受支持。
- `fields` 中未包含 `PostID` 时将自动追加以便进行唯一标识。

### 错误码
- 400：`fields` 或 `include` 参数包含非法值时返回，响应体包含 `allowedFields` 或 `allowedIncludes` 用于前端自诊断。
- 409：`Slug` 唯一键冲突。


