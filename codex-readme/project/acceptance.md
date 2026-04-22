# 验收要求

## 通用验收

- 明确写出本次任务加载了哪些 `project/`、`rules/path/`、`rules/scenario/` 文档。
- 明确说明影响路径、影响契约和不影响的范围。
- `Verify` 只记录实际执行过的验证动作和明确缺口。
- `Review` 必须写出剩余风险、回归点或为何风险可接受。

## 高风险任务附加验收

以下任务至少覆盖一条成功路径和一条失败路径：

- 鉴权、登录、刷新、登出、权限控制
- 文章公开可见性、评论审核状态
- 附件预览、下载、上传、导入
- Redis 风控、缓存失效、管理员 Redis 调试接口
- SQL 结构、初始化脚本、环境变量、部署代理链路

## 文档同步验收

- 变更已有事实来源时，同步更新对应文档：
  - 编码/分层/路径边界 -> `docs/code-rules.md`
  - 安全整改优先级 -> `docs/fix-checklist.md`
  - Redis 风控阈值/部署注意事项 -> `docs/redis-risk-guard.md`
- 变更治理结构时，同步更新：
  - `codex-readme/README.md`
  - `codex-readme/project/task-router.md`
  - `codex-readme/memory/evolution-log.md`

## 任务可交付标准

- 修改点和验证点可被后来者复现。
- 没有把同一条规则写成多个冲突来源。
- 假设项明确标注为“假设”，而不是伪装成既定事实。
