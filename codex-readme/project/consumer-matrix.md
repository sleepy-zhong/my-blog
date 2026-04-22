# 消费者矩阵

| 共享边界 | 生产者 | 已知消费者 | 变更后至少同步检查什么 | 兼容性关注点 |
| --- | --- | --- | --- | --- |
| `/api/users` 登录、刷新、登出、当前用户 | `backend/backend/routes/user.js` + `controllers/authController.js` + `utils/authSession.js` | `fontend/src/api/user.ts`、`fontend/src/api/index.ts`、`fontend/src/store/user.ts`、`fontend/src/router/index.ts` | Cookie 名称、401/403 语义、用户字段结构、角色字段结构 | 不把登录态退回到前端持久化 token；刷新失败要能触发前端会话失效 |
| `/api/articles` 列表、详情、状态、修订、导入 | `backend/backend/routes/article.js` + `controllers/articleController.js` | `fontend/src/views/Home.vue`、`PostList.vue`、`PostDetail.vue`、`ArticlePublish.vue`、`src/api/article*.ts`、`backend/backend/scripts/test-articles-api.js` | 字段投影、include 关联、状态过滤、路由顺序、导入接口返回格式 | 游客只能看到 `published`；固定路径不能被 `/:id` 吞掉 |
| `/api/comments` 评论树、评论列表、审核状态 | `backend/backend/routes/comment.js` + `controllers/commentController.js` | `fontend/src/components/CommentList.vue`、`CommentThread.vue`、`src/api/comment*.ts`、后台评论管理页 | 状态字段、游客可见性、分页参数、删除与审核接口 | 游客默认只能读 `approved`；管理员接口必须维持鉴权 |
| `/api/attachments` 与 `/uploads` 预览 / 下载 / 上传 | `backend/backend/routes/attachment.js` + `controllers/attachmentController.js` + Express static `/uploads` | `fontend/src/components/VditorEditor.vue`、`StructuredContentEditor.vue`、`AttachmentList.vue`、`src/config/attachments.ts`、Nginx `/uploads` 代理 | 预览 URL、鉴权要求、上传限制、Nginx 代理、缓存头 | 不直接编辑 `uploads/`；预览与下载不能意外扩大公开范围 |
| `/api/settings` 站点设置 | `backend/backend/routes/settings.js` + `controllers/settingsController.js` | `fontend/src/views/Admin/Settings.vue`、潜在首页展示模块、`src/api/settings.ts` | 字段结构、编辑权限、缓存失效 | 后端当前是受保护接口，不能让前端误以为公共可读 |
| MySQL schema / Sequelize model | `backend/backend/database/*.sql` 与 `backend/backend/models/*.js` | 后端控制器、脚本、人工导库流程 | SQL、模型、关联、初始化说明、字段命名一致 | 保持现有 `UserID` / `CreatedAt` 风格，不私自改名 |
| Redis 风控与缓存键 | `backend/backend/middleware/riskControl.js`、`middleware/redis.js`、`utils/publicCache.js` | 后端路由、管理员 `/api/redis`、运维配置、`docs/redis-risk-guard.md` | 阈值、键前缀、降级策略、管理员权限、代理头依赖 | `TRUST_PROXY` 与 `X-Forwarded-For` 影响 IP 风控结果 |
| 环境变量与部署链路 | `.env.production.example`、`docker-compose.yml`、`nginx.conf`、两个 Dockerfile | Docker 服务、后端启动校验、前端构建、Nginx 代理、运维脚本 | `PUBLIC_SITE_URL`、`PUBLIC_API_URL`、`CORS_ALLOWED_ORIGINS`、端口、健康检查 | 不泄露真实密钥；前后端和代理层的 URL/端口必须成对更新 |
