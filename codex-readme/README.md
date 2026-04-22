# codex-readme

这套治理结构服务于 `my-blog` 当前工作区，而不是抽象模板仓库。

## 目标

- 让后续 AI / Codex / Agent 在进入任务前，先装载项目目标、路径边界、场景风险和最低验证要求。
- 尽量复用仓库里已经存在的真实文档，如 `docs/code-rules.md`、`docs/fix-checklist.md`、`docs/redis-risk-guard.md`，避免重复写出第二份事实来源。
- 让经验先进入 `memory/`，经过复用和确认后再晋升为规则。

## 最小运行流程

1. 从根级 `AGENTS.md` 进入。
2. 先跑 `hooks/pre-task.md` 的检查清单。
3. 读取 `project/goal.md`、`project/constraints.md`、`project/task-router.md`。
4. 选择命中的 `rules/path/*.md` 与 `rules/scenario/*.md`。
5. 如果改动跨契约或高风险，补读 `project/consumer-matrix.md`、`project/verification-matrix.md`。
6. 完成任务后按 `hooks/post-task-review.md` 复盘，并把新增经验写入 `memory/`。

## 目录职责

- `project/`：项目目标、约束、验收、架构、任务路由、矩阵和模板。
- `rules/path/`：按路径命中的目录规则。
- `rules/scenario/`：按风险场景命中的专项规则。
- `hooks/`：任务开始前与结束前必须执行的最小检查。
- `agents/`：执行角色分工。
- `memory/`：观察、纠错、复用经验和治理演化记录。

## 仓库特有注意事项

- 这是一个多应用工作区，不是单一 Node 项目：前端在 `fontend/`，后端在 `backend/backend/`，部署配置在根目录。
- 目录名 `fontend` 是历史现状，不做顺手重命名。
- 当前目录没有 `.git` 元数据，不能把 `git diff` 当成默认上下文入口。
- `fontend/dist/`、`backend/backend/uploads/`、`node_modules/`、`logs/`、`backups/` 默认视为运行产物，不是常规修改目标。

## 何时扩展结构

- 新目录反复出现专属约束时，新增对应 `rules/path/*.md`。
- 新风险链路反复出现失败模式时，新增对应 `rules/scenario/*.md`。
- 新增或修改治理文件时，同步更新 `project/task-router.md` 和 `memory/evolution-log.md`。
