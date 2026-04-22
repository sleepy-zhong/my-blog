# fontend AGENTS

## 作用范围

- 本文件只适用于 `fontend/**`。
- 进入本目录任务前，先读根级 `AGENTS.md`，再读本文件。

## 必读补充

- `codex-readme/rules/path/fontend.md`
- 如果涉及登录或后台权限：`codex-readme/rules/scenario/auth-and-session.md`
- 如果涉及文章公开态、评论、详情页：`codex-readme/rules/scenario/article-comment-read-scope.md`
- 如果涉及附件或编辑器：`codex-readme/rules/scenario/attachment-import.md`

## 当前目录重点

- 页面入口：`src/views/`、`src/views/Admin/`
- 请求层：`src/api/`
- 会话状态：`src/store/user.ts`
- 路由守卫：`src/router/index.ts`
- 附件配置：`src/config/attachments.ts`

## 最低验证

- 默认执行 `npm run build`。
- 涉及后台权限、登录态、附件或文章详情时，补充一条页面级手工验证说明。
