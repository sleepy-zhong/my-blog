# 架构摘要

## 工作区形态

- 这是一个多应用工作区，不是 monorepo 工具链统一管理的单仓库。
- 主应用有两个：
  - `fontend/`：Vue 3 + Vite + Pinia + Vue Router + Tailwind 的前端站点与后台页面
  - `backend/backend/`：Express 5 + Sequelize + MySQL + Redis 的 API 服务
- 根目录承载部署与运行配置：`docker-compose.yml`、`nginx.conf`、`my.cnf`、`.env.production.example`

## 关键模块

### 前端

- 页面：`fontend/src/views/`、`fontend/src/views/Admin/`
- 请求层：`fontend/src/api/`
- 会话与全局状态：`fontend/src/store/user.ts`
- 路由与权限：`fontend/src/router/index.ts`
- 编辑器与附件：`fontend/src/components/VditorEditor.vue`、`fontend/src/components/StructuredContentEditor.vue`、`fontend/src/config/attachments.ts`

### 后端

- 服务入口：`backend/backend/index.js`
- 路由层：`backend/backend/routes/`
- 控制器：`backend/backend/controllers/`
- 数据模型与关联：`backend/backend/models/`
- 鉴权/权限/缓存/风控：`backend/backend/middleware/`
- 会话与令牌：`backend/backend/utils/authSession.js`
- 手工脚本：`backend/backend/scripts/test-articles-api.js`
- SQL 初始化与补丁：`backend/backend/database/`

## 共享边界

- HTTP API：`/api/users`、`/api/articles`、`/api/comments`、`/api/attachments`、`/api/settings`、`/api/redis`
- 会话契约：HttpOnly Cookie、`AuthSession`、`TokenBlacklist`
- 数据库契约：Sequelize 模型 <-> MySQL SQL 脚本
- 文件契约：后端 `/uploads`、前端附件预览 URL、Nginx `/uploads` 代理
- 运维契约：Docker Compose 服务名、端口、健康检查、环境变量

## 主要高风险链路

- 登录、刷新、登出、角色鉴权
- 游客与后台用户对文章/评论状态的可见性边界
- 附件上传、预览、下载、文章导入
- Redis 风控、缓存失效、管理接口
- 部署代理链路中的 `PUBLIC_*` / `CORS_*` / `TRUST_PROXY`

## 假设

- `fontend-minimal/` 当前不是运行中的主工程；依据是目录下仅见 `node_modules/`，未见活跃源码。
