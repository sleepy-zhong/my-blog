# backend/backend AGENTS

## 作用范围

- 本文件只适用于 `backend/backend/**`。
- 进入本目录任务前，先读根级 `AGENTS.md`，再读本文件。

## 必读补充

- `codex-readme/rules/path/backend-backend.md`
- 视任务叠加：
  - `codex-readme/rules/scenario/auth-and-session.md`
  - `codex-readme/rules/scenario/article-comment-read-scope.md`
  - `codex-readme/rules/scenario/attachment-import.md`
  - `codex-readme/rules/scenario/cache-risk-guard-and-redis.md`
  - `codex-readme/rules/scenario/deployment-and-config.md`

## 当前目录重点

- 服务入口：`index.js`
- 鉴权与会话：`middleware/auth.js`、`middleware/permission.js`、`utils/authSession.js`
- 内容链路：`routes/article.js`、`routes/comment.js`
- 附件链路：`routes/attachment.js`
- 手工验证脚本：`scripts/test-articles-api.js`
- SQL 与模型联动：`database/`、`models/`

## 最低验证

- 至少验证受影响模块能被入口装配。
- 文章接口改动优先尝试 `node scripts/test-articles-api.js`。
- 高风险改动至少写明一条成功路径和一条失败路径。
