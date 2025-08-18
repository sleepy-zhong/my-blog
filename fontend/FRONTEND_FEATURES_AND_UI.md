# 前端功能与页面/交互设计（Tech Blog Admin + Site)

> 说明：保持首页与背景渐变不变，统一其余管理端页面与站点内页的样式与交互规范。本文面向前端实现落地，包含页面清单、交互要点、API 对接与权限规则、统一组件库与状态规范，以及需要后端补充/确认的接口。

## 一、页面清单与交互要点

- 站点
  - 首页 `/`
    - 保持现有头部/背景/渐变风格不变。
    - Banner、文章列表、分页。
  - 登录 `/login`
    - 表单校验（邮箱/密码必填）。
    - 登录后按 `redirect` 回跳；重复访问时自动跳转首页。
  - 文章列表 `/posts`
    - 关键词搜索、分类/标签筛选、分页。
  - 文章详情 `/posts/:id`
    - Markdown/富文本渲染、目录、上一篇/下一篇。
  - 导入文章 `/ArticleImport`
    - 仅授权（admin/superadmin/editor/author），支持 Markdown/HTML 导入。
  - 发布文章 `/publish` `/ArticlePublish`
    - 仅授权（admin/superadmin/editor/author），草稿/发布流程、封面上传、slug 生成。

- 后台（父路由 `/admin`，角色：admin/superadmin/editor）
  - 仪表盘 `AdminHome`
    - 概览数据：文章数、评论数、附件空间、今日 PV；近期趋势图。
  - 用户管理 `UserManage`
    - 列表/搜索/分页；新增/编辑；角色分配；启用/禁用。
  - 角色管理 `RoleManage`
    - 角色增改删；权限配置（多选）。
  - 文章管理 `ArticleManage`
    - 列表/搜索/排序/分页；创建/编辑/删除；状态（草稿/已发布/归档）；修订历史与回滚；导入。
  - 评论管理 `CommentManage`
    - 列表/搜索/分页；状态（待审/通过/垃圾）；树形查看；批量审核/删除。
  - 分类管理 `CategoryManage`
    - 分类树；增删改；拖拽排序（可选）。
  - 标签管理 `TagManage`
    - 增删改查；关联文章数。
  - 附件管理 `AttachmentManage`
    - 上传/批量上传；预览；批量删除；压缩/批量压缩 ZIP；空间使用统计。
  - 系统日志 `LogManage`
    - 类型/关键词/时间范围筛选；详情抽屉；导出 CSV（可选）。
  - 系统设置 `Settings`
    - 站点标题、副标题、SEO、CDN/文件域名等。

## 二、统一 UI/交互规范

- 布局
  - 顶部导航与侧边栏在后台 `AdminLayout` 内统一；站点页面保持现有导航/头部外观。
  - 内容区卡片统一：白底、圆角、阴影、边框、内边距一致。
- 表单
  - 必填星标、聚焦边框高亮、错误提示在下方，提交按钮右对齐。
- 表格
  - 顶部筛选区（关键词、时间、状态等）；底部分页；支持批量操作条。
- 空/加载/错误态
  - 空态统一插图与文案；加载骨架屏；错误信息展示+重试按钮。
- 反馈
  - 成功/失败通过全局 Message（App.vue 已实现）+ 可选的对话框确认。

## 三、统一组件库（`src/components`）

- 表单：`FormItem`, `TextInput`, `Select`, `DateRangePicker`, `Uploader`
- 表格：`DataTable`（列定义、可排序、空态、分页），`BatchActionsBar`
- 反馈：`ConfirmDialog`, `Drawer`, `Toast`（已由全局 Message 代替）
- 导航：`Breadcrumb`
- 文章编辑：`MarkdownEditor`/`RichTextEditor`（按当前已用方案封装一层）
- 其他：`Pagination`（已存在）、`StatusButton`（已全局注册）

备注：优先复用已有组件（如 `Pagination.vue`、`StatusButton.vue`、`Navbar.vue` 等），新增保持 Tailwind 规范，并与现有配色统一。

## 四、API 对接与数据规范

- 约定
  - 所有接口成功返回 `code === 0`；列表响应容忍三种结构：`data.data.list` / `data.data` / `data`（已有实现中已兼容）。
  - 分页参数：`page`, `pageSize`；时间筛选统一 `startAt`, `endAt`（可选）。
- 已封装（位于 `src/api`）
  - 用户：`user.ts`（新增：`forgotPassword`, `getUserById`, `updateUserAll`）
  - 文章：`articles.ts`（创建/更新/发布/归档/修订/导入等）
  - 附件：`attachments.ts`（上传/列表/删除/压缩）
  - 分类：`categories.ts`；标签：`tags.ts` 与既有 `tag.ts`
  - 评论：`comments.ts` 与既有 `comment.ts`
  - 角色：`roles.ts` 与既有 `role.ts`
  - 日志：`logs.ts` 与既有 `log.ts`
- 重名说明
  - 历史上已存在单数命名文件（如 `tag.ts`/`role.ts`/`comment.ts`）。现新增复数命名版本为更清晰的 REST 习惯。短期内保持兼容，不强制迁移；后续统一到复数命名并做一次替换清理。

## 五、权限与路由守卫

- 守卫位置：`src/router/index.ts`
- 规则
  - `meta.requiresAuth` 控制登录校验。
  - `meta.roles` 控制角色访问；若用户 `Roles` 为对象数组（包含 `Name`），在守卫中已转换为字符串数组。
  - 无权限跳转 `/403` 并弹出 Message。

## 六、状态与存储

- 使用 Pinia（`src/store`）：`useUserStore`, `useLoadingStore`, `useMessageStore`。
- App 启动时若存在 `token` 且未加载用户信息，自动拉取（见 `App.vue`）。

## 七、开发落地顺序（不影响首页与渐变）

1) 统一样式基线：卡片、表单、表格、空/加载/错误态（公共组件）。
2) 文章管理增强：修订历史对比、回滚、导入完善、发布流（与 `articles.ts` 对齐）。
3) 附件管理：批量压缩 ZIP、预览优化、空间统计。
4) 评论管理：状态批量操作、树形查看、关键词筛选。
5) 角色/权限：权限分配对话框，UI 统一。
6) 日志：筛选器、详情抽屉、导出。
7) 设置页：CDN/文件域名等配置项完善。
8) 收尾：API 命名统一（将单数迁移为复数）、无用文件清理。

## 八、需要后端补充/确认

- 用户头像/附件的 URL 返回是否统一为绝对 URL（含文件域名/CDN）。
- 评论后台分页 `GET /api/comments`：关键词与状态筛选参数名与返回结构确认。
- 日志 `GET /api/logs`：关键词、类型、时间范围筛选。
- 附件批量压缩 `POST /api/attachments/compress-zip`：ZIP 有效期与清理策略。

## 九、测试与质量

- 每次功能点完成：本地跑通 lint，无 TS 报错；关键路径 E2E 自测（登录/文章创建发布/评论审核/附件上传）。
- 重要接口添加错误兜底与用户可读提示（结合全局 Message）。

—— 本文作为前端落地蓝图，后续跟进实现进度逐条核对与打勾。