# backend/backend 路径规则

## 适用范围

- `backend/backend/**`

## 目录边界

- `index.js`：服务入口与全局中间件装配
- `routes/`：路径、参数校验、中间件装配、Swagger 注释
- `controllers/`：业务逻辑
- `models/`：Sequelize 模型与字段映射
- `models/index.js`：关联关系
- `middleware/`：鉴权、权限、缓存、风控、错误处理
- `utils/`：日志、会话、邮件、缓存工具
- `scripts/`：手工或半自动验证脚本
- `database/`：初始化 SQL 和结构补丁

## 必守规则

- 统一使用 CommonJS。
- 路由文件不承载重业务逻辑；复杂逻辑放控制器或工具层。
- 新增固定路径必须放在 `/:id`、`/:roleId` 等动态路径前面。
- 鉴权优先用 `auth`，角色优先用 `permission`，不要跳过前置中间件。
- 会话逻辑优先复用 `utils/authSession.js`，不要重新发明 token 流程。
- 涉及多表写入、文章与附件绑定、批量改动时，优先使用事务。

## 需要联动的常见路径

- 改 `routes/user.js`、`middleware/auth.js`、`utils/authSession.js` -> 同步 `fontend/src/api/index.ts`、`fontend/src/store/user.ts`
- 改 `routes/article.js`、`middleware/articleReadScope.js` -> 同步前端文章/评论页面、脚本 `scripts/test-articles-api.js`
- 改 `routes/attachment.js` 或上传路径 -> 同步前端附件配置、Nginx `/uploads` 代理
- 改模型字段或关联 -> 同步 `database/*.sql`

## 最低验证

- 至少验证受影响模块可被服务入口正确装配。
- 文章接口优先复用 `backend/backend/scripts/test-articles-api.js`。
- 高风险接口必须明确一条成功路径和一条失败路径。
