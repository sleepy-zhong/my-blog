# post-task-review Hook

结束任务前，至少复核以下项目：

1. `Verify` 中是否只写了实际执行过的验证，缺口是否明确标注。
2. 改动是否影响现有事实来源：
   - `docs/code-rules.md`
   - `docs/fix-checklist.md`
   - `docs/redis-risk-guard.md`
   - `consumer-matrix.md`
   - `verification-matrix.md`
3. 是否有新的 observation / correction / learned-rule 需要写入 `memory/`。
4. 如果治理结构本身发生变化，是否更新 `codex-readme/README.md`、`project/task-router.md`、`memory/evolution-log.md`。
5. 语言与编码是否一致：
   - 中文文档是否保持简洁可执行
   - 标识符是否保持原样
   - 文本文件是否按 UTF-8 保存
