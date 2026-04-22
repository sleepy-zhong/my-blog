# 项目约束

## 权威事实来源

- 代码分层、路径边界、最低编码约束：`docs/code-rules.md`
- 安全与修复优先级、验收链路：`docs/fix-checklist.md`
- Redis 风控接入、阈值、部署注意事项：`docs/redis-risk-guard.md`
- 文本编码与换行：`.editorconfig`

以上文档已经存在时，优先引用，不在治理文档里重复复制全文。

## 仓库级硬约束

- 默认文档语言使用中文。
- 新增或改写文本文件统一保存为 UTF-8。
- 不把 `fontend` 重命名为 `frontend`。
- 不默认修改这些目录：
  - `fontend/dist/`
  - `fontend/node_modules/`
  - `backend/backend/node_modules/`
  - `backend/backend/uploads/`
  - `logs/`
  - `backups/`
  - `ssl/`
- 当前工作区缺少 `.git` 目录，不能把分支、提交历史、`git diff` 当成默认校验入口。

## 技术约束

- 前端统一走 `fontend/src/api/` 发请求，默认携带 cookie，会话刷新在 `fontend/src/api/index.ts`。
- 后端统一返回 `{ code, message, data }` 风格的数据结构，鉴权失败必须维持 401/403 语义。
- 登录态以 HttpOnly Cookie + `AuthSession` / `TokenBlacklist` 为主，不把 `localStorage` 当真实令牌来源。
- 多表写入、附件绑定、批量改动优先使用事务。
- 文章、评论、附件、设置、Redis 相关接口都存在前后端或运维侧消费者，改动时必须评估契约影响。

## 配置约束

- 默认优先读 `.env.production.example`，不要在无必要时打开或改写 `.env.production`。
- `docker-compose.yml`、`nginx.conf`、`fontend/Dockerfile`、`backend/backend/Dockerfile`、后端环境变量必须保持联动。
- 后端启动依赖 `PUBLIC_SITE_URL`、`PUBLIC_API_URL`、`CORS_ALLOWED_ORIGINS`，配置改动不能只改单点。
