# 任务路由

## 路由步骤

1. 先按修改路径选择 `rules/path/*.md`。
2. 再按风险选择 `rules/scenario/*.md`。
3. 如果变更跨 API、数据库、环境变量、上传路径、缓存键，补读 `consumer-matrix.md`。
4. 如果变更属于高风险链路，补读 `verification-matrix.md`。

## 任务类型映射

| 任务类型 | 必读 project 文档 | 必读路径规则 | 必读场景规则 | 补充矩阵 | 最低验证关注点 |
| --- | --- | --- | --- | --- | --- |
| 治理/文档结构调整 | `goal.md` `constraints.md` `acceptance.md` | `rules/path/governance.md` `rules/path/docs-and-sql.md` | `rules/scenario/writing-language.md` | 无 | 事实来源不重复，`README` / `task-router` / `evolution-log` 已同步 |
| 前端页面、组件、路由、API 封装 | `constraints.md` `architecture.md` | `rules/path/fontend.md` | `rules/scenario/writing-language.md`；若带登录则加 `auth-and-session.md`；若带文章公开态则加 `article-comment-read-scope.md` | 跨接口时读 `consumer-matrix.md` | `fontend` 可构建；关键页面路由和权限未破坏 |
| 后端路由、控制器、中间件、模型 | `constraints.md` `architecture.md` | `rules/path/backend-backend.md` | 视改动叠加 `auth-and-session.md`、`article-comment-read-scope.md`、`attachment-import.md`、`cache-risk-guard-and-redis.md` | API / DB / Redis 改动时均读对应矩阵 | 路由顺序、响应结构、至少一个失败路径 |
| 登录、刷新、登出、角色/权限 | `constraints.md` `architecture.md` | `rules/path/backend-backend.md`；若前端同时改动再加 `rules/path/fontend.md` | `rules/scenario/auth-and-session.md` | `consumer-matrix.md` `verification-matrix.md` | 401/403、禁用用户、角色不足、刷新失效 |
| 文章、评论、公开可见性 | `constraints.md` `architecture.md` | `rules/path/backend-backend.md`；若前端列表/详情改动再加 `rules/path/fontend.md` | `rules/scenario/article-comment-read-scope.md` | `consumer-matrix.md` `verification-matrix.md` | 游客只看公开状态，管理端不被误限流或误裁剪 |
| 附件、上传、预览、下载、导入 | `constraints.md` `architecture.md` | `rules/path/backend-backend.md` `rules/path/fontend.md` `rules/path/ops-and-deploy.md` | `rules/scenario/attachment-import.md` | `consumer-matrix.md` `verification-matrix.md` | 成功上传/解析与至少一条失败路径，`/uploads` 契约未断 |
| Redis、缓存、限流、管理员调试接口 | `constraints.md` `architecture.md` | `rules/path/backend-backend.md` `rules/path/ops-and-deploy.md` | `rules/scenario/cache-risk-guard-and-redis.md` | `consumer-matrix.md` `verification-matrix.md` | Redis 连接与断连降级、管理员权限、缓存失效链路 |
| Docker / Nginx / 环境变量 / 健康检查 | `constraints.md` `architecture.md` | `rules/path/ops-and-deploy.md` | `rules/scenario/deployment-and-config.md` | `consumer-matrix.md` `verification-matrix.md` | 端口、代理、`PUBLIC_*`、`CORS_*`、健康检查一致 |
| SQL 初始化、补丁、种子数据 | `constraints.md` `architecture.md` | `rules/path/docs-and-sql.md` `rules/path/backend-backend.md` | `rules/scenario/writing-language.md`；如影响权限/公开态需叠加对应场景规则 | `consumer-matrix.md` `verification-matrix.md` | SQL 与模型、接口、初始化说明一致；标明回滚或补救方式 |
