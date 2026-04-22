# 运维与部署路径规则

## 适用范围

- `docker-compose.yml`
- `nginx.conf`
- `my.cnf`
- `.env.production.example`
- `fontend/Dockerfile`
- `backend/backend/Dockerfile`

## 必守规则

- 不把真实密钥、SMTP 密码、数据库口令写入模板或文档。
- 优先修改 `.env.production.example` 说明契约，不默认改 `.env.production`。
- 后端依赖的 `PUBLIC_SITE_URL`、`PUBLIC_API_URL`、`CORS_ALLOWED_ORIGINS` 必须与代理链路一起核对。
- 代理链路涉及 `TRUST_PROXY=1`、`X-Forwarded-For`、`X-Real-IP`，不能只改一处。
- 上传链路变更时，同时检查：
  - Docker volume
  - 后端 `/uploads` 静态服务
  - Nginx `/uploads` 代理
  - 前端附件 URL 构建

## 当前部署事实

- MySQL、Redis、backend、frontend 由 `docker-compose.yml` 管理。
- backend 健康检查走 `/healthz`。
- Nginx 对外代理 `/api`、`/uploads` 和前端根路径 `/`。
- 前端构建时依赖 `VITE_API_BASE_URL`。

## 最低验证

- 端口、服务名、健康检查和环境变量互相一致。
- 说明回滚方式：恢复旧配置、恢复旧端口映射或恢复旧环境变量说明。
