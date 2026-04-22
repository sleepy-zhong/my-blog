# fontend 路径规则

## 适用范围

- `fontend/**`

## 目录边界

- `src/views/` 与 `src/views/Admin/`：页面级组件
- `src/components/`：可复用组件
- `src/api/`：请求封装
- `src/store/`：Pinia 全局状态
- `src/router/`：路由与守卫
- `src/config/`：运行时配置，例如附件 URL 构建

## 必守规则

- 不直接修改 `fontend/dist/` 产物。
- 不在页面里私建 axios 实例；统一走 `src/api/`。
- 登录态来源是 cookie 会话，`src/store/user.ts` 中的 `token` 只是兼容占位，不是真实 bearer token。
- 附件预览 URL、编辑器预览行为统一复用 `src/config/attachments.ts`。
- 页面权限依赖 `src/router/index.ts` 中的 `requiresAuth` 和 `roles`，不要只改 UI 不改路由守卫。

## 需要联动的常见路径

- 改 `src/api/` 接口 -> 同步检查对应 `backend/backend/routes/`
- 改用户/权限页面 -> 同步检查 `src/store/user.ts`、`src/router/index.ts`
- 改文章详情、列表、评论、附件 -> 同步检查对应场景规则和消费者矩阵

## 最低验证

- 至少在 `fontend/` 执行一次 `npm run build`。
- 涉及登录、后台、附件或文章详情时，补充说明对应页面的手工验证路径。
