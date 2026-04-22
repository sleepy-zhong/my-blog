# memory

`memory/` 用来沉淀任务中学到的真实经验，而不是直接替代规则层。

## 文件职责

- `observations.jsonl`：新观察到的事实或风险信号
- `corrections.jsonl`：被证明错误的假设或旧认知
- `learned-rules.jsonl`：重复成立、可复用、但还未正式晋升到规则层的经验
- `evolution-log.md`：治理结构本身的变更记录

## JSON Lines 字段

每条记录至少包含：

- `date`
- `type`
- `scope`
- `confidence`
- `source`
- `content`
- `action`
- `promote_to_rule`

## 晋升链路

1. 先写 `observations.jsonl`
2. 被推翻的判断写 `corrections.jsonl`
3. 复用稳定后写 `learned-rules.jsonl`
4. 只有长期稳定且适用范围明确时，才晋升到 `rules/`

## 维护原则

- 一条记录只写一个核心事实。
- `action` 写下一步建议，而不是重复 `content`。
- 若本次没有新增事实，不强行写入。
