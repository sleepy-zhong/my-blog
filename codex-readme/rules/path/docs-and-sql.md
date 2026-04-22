# docs 与 SQL 路径规则

## 适用范围

- `docs/**`
- `backend/backend/database/**`

## 文档边界

- `docs/code-rules.md`：现有代码约束的权威来源
- `docs/fix-checklist.md`：安全修复与链路验收的权威来源
- `docs/redis-risk-guard.md`：Redis 风控接入与部署注意事项的权威来源
- `docs/ui-*.html`：UI 参考稿，不是运行时代码
- `docs/*seed*.sql`、`backend/backend/database/*.sql`：初始化、补丁或本地种子 SQL

## 必守规则

- 文档默认用中文，文本统一 UTF-8。
- 修改 SQL 时，必须同时检查 Sequelize 模型、接口假设和初始化说明。
- 不能只改模型不改 SQL，也不能只改 SQL 不说明运行时影响。
- 触及数据库结构、风控阈值或安全链路时，优先更新对应专题文档，而不是只改治理文件。

## 假设

- `docs/project-init.md` 是治理结构初始化母提示词，而不是运行时配置文件。

## 最低验证

- 文档引用路径真实存在。
- SQL 改动写清执行顺序、兼容性影响和回滚/补救思路。
