# 文章与评论公开态场景规则

## 适用场景

- 文章列表、详情、状态、评论树、评论审核、首页内容装配

## 当前仓库真实约束

- `backend/backend/middleware/articleReadScope.js` 会把非特权用户的文章状态强制裁剪为 `published`。
- `backend/backend/routes/article.js` 已经存在固定路径和动态路径混排，新增子路径时必须检查顺序。
- 评论接口区分游客读取和管理员审核；游客默认只能看公开状态。
- `docs/fix-checklist.md` 已把游客越权读取草稿、未审核评论列为高优先级风险。

## 最低验证

- 成功路径：游客读取公开文章/评论正常；特权用户读取后台数据正常。
- 失败路径至少一条：
  - 游客通过 `status`、`slug`、`id` 枚举非公开内容失败
  - 游客读取未审核评论失败
- 如果前端同时改动，补充页面级验证路径。

## 同步要求

- API 字段、筛选参数或状态语义变化时，同步 `consumer-matrix.md`。
- 风险优先级变化时，同步 `docs/fix-checklist.md`。
