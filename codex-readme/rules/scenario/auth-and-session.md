# 鉴权与会话场景规则

## 适用场景

- 触及以下任一路径时加载本规则：
  - `backend/backend/routes/user.js`
  - `backend/backend/middleware/auth.js`
  - `backend/backend/middleware/permission.js`
  - `backend/backend/utils/authSession.js`
  - `fontend/src/api/index.ts`
  - `fontend/src/store/user.ts`
  - `fontend/src/router/index.ts`

## 当前仓库真实约束

- 登录态以 HttpOnly Cookie 为主，前端本地缓存只保存用户资料，不保存真实 access token。
- 刷新逻辑由 `fontend/src/api/index.ts` 拦截 401 后触发 `/api/users/refresh`。
- 后端会话依赖 `AuthSession`、`TokenBlacklist`、`SessionVersion`。
- 角色判断依赖后端 claims 与前端路由 `meta.roles` 双侧配合。

## 最低验证

- 成功路径：建立登录态或会话探测成功。
- 失败路径至少一条：
  - 无 token / cookie
  - 过期或失效会话
  - 禁用用户
  - 角色不足
- 修改登出、刷新或会话字段时，必须同步看 `consumer-matrix.md`。

## 同步要求

- 安全语义变化同步 `docs/fix-checklist.md`。
- 编码或分层约束变化同步 `docs/code-rules.md`。
