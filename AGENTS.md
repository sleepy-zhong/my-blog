# my-blog AGENTS

## 作用范围

- 本文件适用于 `C:\Users\Administrator\Desktop\my-blog` 整个工作区。
- 重点活跃目录是 `fontend/`、`backend/backend/`、`docs/` 以及根目录部署配置文件。
- 当任务主要落在 `fontend/**` 或 `backend/backend/**` 时，继续加载对应子级 `AGENTS.md`。

## 文档装载顺序

1. `codex-readme/README.md`
2. `codex-readme/hooks/pre-task.md`
3. `codex-readme/project/goal.md`
4. `codex-readme/project/constraints.md`
5. `codex-readme/project/task-router.md`
6. 按任务命中的 `codex-readme/rules/path/*.md`
7. 按风险命中的 `codex-readme/rules/scenario/*.md`
8. 必要时补读：
   - `codex-readme/project/consumer-matrix.md`
   - `codex-readme/project/verification-matrix.md`
9. 仓库现有专题文档按需补读：
   - `docs/code-rules.md`
   - `docs/fix-checklist.md`
   - `docs/redis-risk-guard.md`

## 默认输出语言

- 默认使用中文。
- 代码标识符、接口路径、环境变量、数据库字段、响应字段保持原样。
- 如果某次说明必须引用英文原词，先给中文结论，再给原词。

## 何时补读 task-router / consumer-matrix / verification-matrix

- 任务刚开始分类不清、影响面可能跨前后端时，必须补读 `codex-readme/project/task-router.md`。
- 触及 API、上传、设置、数据库结构、环境变量、缓存键、共享 schema 时，必须补读 `codex-readme/project/consumer-matrix.md`。
- 触及鉴权、文章可见性、评论审核、附件预览/下载、导入、Redis 风控、部署配置时，必须补读 `codex-readme/project/verification-matrix.md`。

## 如何选择路径规则和场景规则

- 先按实际修改路径选择最近的 `rules/path` 文件，再按风险选择 `rules/scenario` 文件。
- 路径规则解决“在哪改、不能碰什么、最小验证入口是什么”。
- 场景规则解决“为什么高风险、至少要覆盖哪条失败路径、要同步哪些契约”。
- 如果一个任务同时跨 `fontend/` 和 `backend/backend/`，两个路径规则都要加载。

## Hook 约束

- 开始任务前，遵循 `codex-readme/hooks/pre-task.md`。
- 结束任务前，遵循 `codex-readme/hooks/post-task-review.md`。

## 何时写入 memory

- 发现了仓库真实结构、协作习惯或风险链路的新事实，写入 `codex-readme/memory/observations.jsonl`。
- 纠正了先前错误假设，写入 `codex-readme/memory/corrections.jsonl`。
- 同类任务反复成立、可复用的做法，写入 `codex-readme/memory/learned-rules.jsonl`。
- 只有长期稳定且适用范围明确的经验，才从 `memory/` 晋升到 `rules/`。

## 多应用路由

- `fontend/**`：继续加载 `fontend/AGENTS.md`，主看 Vue/Vite、路由守卫、Pinia、`src/api/` 封装、`npm run build`。
- `backend/backend/**`：继续加载 `backend/backend/AGENTS.md`，主看 Express/Sequelize、鉴权会话、Redis 风控、脚本验证。
- `docs/**`、`backend/backend/database/**`、根目录部署文件：按 `codex-readme/project/task-router.md` 选择 `docs-and-sql`、`ops-and-deploy` 路径规则，不额外生成子级 AGENTS。
