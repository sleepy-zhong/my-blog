# Redis 风控与缓存场景规则

## 适用场景

- 触及 `backend/backend/config/redis.js`
- 触及 `backend/backend/middleware/riskControl.js`、`middleware/redis.js`
- 触及 `backend/backend/routes/redis.js`
- 触及 `backend/backend/utils/publicCache.js`
- 触及 `docker-compose.yml` 中 Redis 相关配置

## 当前仓库真实约束

- Redis 既用于公共缓存，也用于高风险接口限流。
- Redis 不可用时，风险控制默认降级放行，避免认证接口整体不可用。
- 风控依赖 `TRUST_PROXY` 和代理头来解析真实 IP。
- `/api/redis` 目前受 `auth + permission.isAdmin` 保护。

## 最低验证

- 成功路径：说明连接正常时的缓存或限流行为。
- 失败路径至少一条：
  - Redis 断连后的降级行为
  - 非管理员访问 `/api/redis`
  - 代理头缺失导致 IP 识别异常的防护考虑

## 同步要求

- 阈值、键前缀、部署要求变化时，同步 `docs/redis-risk-guard.md`。
- 涉及端口、密码、服务名变化时，同步 `ops-and-deploy.md` 与 `consumer-matrix.md`。
