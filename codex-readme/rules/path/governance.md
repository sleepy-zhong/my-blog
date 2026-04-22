# 路径规则治理

## 何时新增路径规则

- 某个目录反复出现专属边界、专属验证或专属禁区时，再新增路径规则。
- 单次任务里的临时经验，先写入 `memory/`，不要直接变成路径规则。

## 选择顺序

1. 先加载最靠近实际修改路径的规则。
2. 如果任务跨多个目录，同时加载多个路径规则。
3. 遇到冲突时：
   - 全局目标与全局约束以 `project/` 为准
   - 目录边界以最近的 `rules/path/*.md` 为准
   - 风险处理以 `rules/scenario/*.md` 为准

## 编写要求

- 只写该路径独有的边界、入口、验证方式。
- 不复制 `project/constraints.md` 里的全局约束。
- 不复制 `docs/code-rules.md`、`docs/fix-checklist.md`、`docs/redis-risk-guard.md` 的全文，必要时直接引用路径。

## 变更同步

- 新增、删除或改名路径规则时，同步更新：
  - `codex-readme/project/task-router.md`
  - `codex-readme/README.md`
  - `codex-readme/memory/evolution-log.md`
