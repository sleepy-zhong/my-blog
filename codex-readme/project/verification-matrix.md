# 验证矩阵

| 风险类型 | 最低验证要求 | 至少一条失败路径 | 需要同步的文档 / 矩阵 | 回滚或止损记录要点 |
| --- | --- | --- | --- | --- |
| 治理文档调整 | 检查所有新增文件可被根级 `AGENTS.md` 路由到；避免重复事实来源 | 漏读路径、漏更 `task-router` 或 `evolution-log` | `codex-readme/README.md`、`task-router.md`、`memory/evolution-log.md` | 说明新增规则的目的和撤销方式 |
| 前端页面 / 组件 / API 封装 | 在 `fontend/` 至少执行一次 `npm run build`；说明受影响页面 | 未登录访问受保护页面、接口 401/404、错误态 UI | `consumer-matrix.md`（跨接口时） | 记录可回滚的页面、组件或 API 模块 |
| 后端路由 / 控制器 / 中间件 | 至少验证受影响模块能加载；接口类改动至少说明一条成功路径 | 参数校验失败、权限不足、动态路由误吞、错误响应语义异常 | `consumer-matrix.md`、必要时 `docs/code-rules.md` | 记录旧路由或旧返回结构如何恢复 |
| 鉴权 / 会话 / 权限 | 覆盖登录态建立、`/me` 或等价会话探测、权限判定 | 无 token、过期 token、禁用用户、角色不足、刷新失败 | `consumer-matrix.md`、`docs/fix-checklist.md` | 记录 cookie 名称、会话版本、撤销策略 |
| 文章 / 评论公开态 | 游客读取公开数据成功；管理端/作者路径不误受限 | 游客枚举 `draft` / `archived` / `pending` 失败 | `consumer-matrix.md`、`docs/fix-checklist.md` | 记录状态筛选和回退方案 |
| 附件 / 上传 / 导入 | 成功路径至少一条；校验上传后预览或解析链路说明完整 | 未授权预览、非法类型、超限、导入失败 | `consumer-matrix.md`、`docs/fix-checklist.md`、必要时 `docs/redis-risk-guard.md` | 记录文件落盘路径、临时数据清理方式 |
| Redis 风控 / 缓存 | 说明连接成功时行为；若无法联机，至少验证断连降级设计未被破坏 | Redis 不可用、代理头缺失、非管理员访问 `/api/redis` | `consumer-matrix.md`、`docs/redis-risk-guard.md` | 记录阈值、键前缀、清缓存方式 |
| SQL / 配置 / 部署 | 交叉检查 SQL、模型、env、docker、nginx 一致性 | 缺少必要环境变量、端口不一致、健康检查失效 | `consumer-matrix.md`、`docs/code-rules.md`、必要时 `docs/redis-risk-guard.md` | 记录恢复旧配置、旧脚本或回滚顺序 |
