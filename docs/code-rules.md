# 项目代码规则

> 本规则基于当前仓库实际结构和现有实现提炼，目标是让后续改动与项目现状兼容，而不是额外引入一套脱离代码的“新规范”。

## 1. 适用范围

- 前端主工程：`fontend`
- 后端主工程：`backend/backend`
- 部署与运行配置：`docker-compose.yml`、`nginx.conf`、`my.cnf`、`ssl/`
- 默认不作为业务源码修改的目录：`fontend/dist/`、`backend/backend/uploads/`、`logs/`、`backups/`
- `fontend-minimal/` 当前不是主工程入口，不作为常规需求的修改目标

## 2. 总体原则

1. 以小步修改为主，优先复用现有模块和目录边界，不跨层塞业务逻辑。
2. 不把运行产物当源码改。构建输出、上传文件、日志、数据库转储默认不改，除非任务明确要求。
3. 新增或修改文件统一使用 UTF-8，避免继续引入中文乱码或混合编码问题。
4. 目录名、数据库字段名、接口路径名优先保持现状兼容，不做“顺手重命名”。
5. 新功能优先补到现有模块，不新增平行实现或重复 API 包装层。
6. 注释只写必要信息，重点解释约束、坑点和第三方组件特殊行为，不写显而易见的注释。

## 3. 项目结构约定

### 前端

- `src/views/`：页面级组件
- `src/views/Admin/`：后台页面
- `src/components/`：可复用组件
- `src/api/`：所有 HTTP 请求封装
- `src/store/`：Pinia 全局状态
- `src/router/`：路由定义和守卫
- `src/config/`：运行配置与 URL 生成逻辑
- `src/types/`：公共类型

### 后端

- `routes/`：路由、参数校验、中间件装配、Swagger 注释
- `controllers/`：业务逻辑
- `models/`：Sequelize 模型
- `middleware/`：鉴权、权限、错误处理、响应包装、缓存
- `config/`：数据库、JWT、Redis 等配置
- `utils/`：日志、邮件等通用工具
- `scripts/`：辅助脚本与手工测试脚本

## 4. 前端规则

### 组件与页面

1. Vue 单文件组件默认使用 `<script setup>`。
2. 新增复杂组件、公共组件、配置模块、API 模块优先使用 TypeScript。
3. 对已有纯 JavaScript 的页面做小范围修改时，可先沿用现状；但不要继续把复杂新逻辑写成无类型代码。
4. 组件文件名使用 PascalCase，例如 `CommentThread.vue`、`ArticleMetaPanel.vue`。
5. 页面组件放在 `views/`，通用组件放在 `components/`，不要混放。

### 导入与依赖

1. `src` 内部模块优先使用 `@/` 别名导入。
2. 不在页面或组件里直接创建 axios 实例；所有请求必须统一走 `src/api/`。
3. 涉及附件预览、附件上传、图片预览 URL 时，统一复用 `src/config/attachments.ts` 中的配置和构建函数，不要硬编码。

### 状态与数据流

1. 用户登录态、全局提示、全局 loading、主题等全局状态统一放到 Pinia。
2. 页面组件负责组装页面状态，不直接承担跨页面缓存和全局会话逻辑。
3. 后端响应格式虽然总体是 `{ code, message, data }`，但当前存在历史兼容写法；新增代码应尽量在 `api/` 层做归一化，不要把 `res?.data?.data || res?.data` 这类兜底逻辑继续扩散到各页面。

### 样式

1. 优先使用 Tailwind 工具类完成布局与常规样式。
2. 组件内部样式使用 `scoped`；只有第三方编辑器、深层 DOM 覆盖等场景才使用 `:deep(...)`。
3. 全局样式只放在 `src/index.css` 或确有必要的统一入口文件中。
4. 不修改 `fontend/dist/` 下任何产物文件，构建产物必须通过源码重新生成。

## 5. 后端规则

### 模块边界

1. 后端统一使用 CommonJS。
2. `routes/` 只做四件事：定义路径、挂中间件、参数校验、写 Swagger 注释。
3. 业务逻辑放在 `controllers/`，不要把数据库查询、权限决策、文件处理堆进路由文件。
4. 数据表定义、关联关系分别放在 `models/*.js` 和 `models/index.js`，不要在控制器里临时拼模型关系。

### 请求处理

1. 控制器统一使用 `async/await`。
2. 使用 `express-validator` 的接口，在控制器开头先处理 `validationResult(req)`。
3. 同一控制器函数只保留一种明确的返回路径，不要同时混用多套响应格式。
4. 统一保持 `{ code, message, data }` 响应包结构；若交给 `next(err)`，就不要再手写另一套兜底响应。
5. 需要跨表写入、批量更新、附件绑定这类操作时，必须使用 Sequelize 事务。

### 权限与安全

1. 登录校验优先使用 `auth` 中间件。
2. 角色校验优先使用 `permission` 中间件。
3. “资源所有者或管理员”这类最终权限判断可以在控制器中补充校验，但不要跳过前置鉴权。
4. 涉及文件落盘、附件路径、上传目录时，统一使用环境变量和 `path.resolve`/`path.join`，不要写机器绝对路径。
5. 新增接口不得把密码、SMTP 凭据、数据库账号等敏感信息硬编码进源码。

### 路由顺序

1. 固定路径必须写在参数路径前面。
2. 例如 `/count`、`/my`、`/drafts`、`/published`、`/slug/:slug` 这类路径，应放在 `/:id` 前面。
3. 新增子路径时先检查是否会被 `/:id`、`/:roleId` 之类的动态段误吞。

### 日志与审计

1. 用户管理、角色分配、文章发布、附件删除等重要写操作优先记录操作日志。
2. 统一复用 `utils/logger.js` 中的 `logOperation`、`getClientIP`、`getUserAgent`。
3. 日志记录失败不能阻断主业务流程，但主业务代码需要显式处理失败场景。

## 6. 数据库与模型规则

1. 保持现有数据库字段命名风格，例如 `UserID`、`CreatedAt`、`PublishedAt`。
2. Sequelize 模型字段名与数据库列保持一致，避免为“更像 JavaScript”而私自改成另一套命名。
3. 多对多关系统一在 `models/index.js` 中声明。
4. 对已有表做结构扩展时，优先补充 SQL 脚本到 `database/` 或 `scripts/migrations/`，不要只改模型不改数据库初始化脚本。

## 7. 不要继续扩散的历史问题

1. 顶层目录 `fontend` 的拼写是历史现状，常规需求不要尝试整体改名为 `frontend`。
2. `src/api/` 下已经出现 `article.ts/articles.ts`、`comment.ts/comments.ts` 这类重复域封装；新增接口优先并入当前主用模块，不再新增新的单复数平行文件。
3. `articleController.js`、`userController.js` 已存在重复导出段落。后续修改这两个文件时，禁止继续复制粘贴同类实现；如修改范围允许，应顺手收敛重复代码。
4. 当前终端读取部分中文内容时出现乱码显示。后续新增或重写字符串时，统一按 UTF-8 保存，不混用本地编码。

## 8. 变更验证最低要求

### 前端改动

- 至少执行一次 `npm run build`（目录：`fontend`）
- 检查页面是否仍可通过现有路由访问
- 涉及表单、鉴权、附件上传时，至少走一遍主流程

### 后端改动

- 至少检查受影响模块能被正常加载
- 涉及路由新增或调整时，检查路由顺序是否正确
- 涉及文章接口时，可优先复用 `backend/backend/scripts/test-articles-api.js`
- 涉及事务、权限、文件上传时，至少验证一个成功路径和一个失败路径

### 配置或部署改动

- 同步检查 `docker-compose.yml`、前后端环境变量、Nginx 转发规则是否一致
- 不把本地测试口令、临时域名、机器路径写入最终配置

## 9. 提交前检查清单

- 是否只修改了活跃源码目录
- 是否避免了对 `dist/`、`uploads/`、`logs/`、`backups/` 的无意义改动
- 是否复用了现有 `api/`、`store/`、`middleware/`、`utils/` 模块
- 是否保持了 `{ code, message, data }` 返回结构
- 是否避免新增重复 API 封装文件
- 是否检查了动态路由与固定路由的先后顺序
- 是否记录了本次修改的最小验证动作

