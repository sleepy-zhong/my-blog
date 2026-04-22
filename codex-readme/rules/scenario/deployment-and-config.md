# 部署与配置场景规则

## 适用场景

- Docker、Nginx、环境变量模板、健康检查、反向代理、资源路径

## 当前仓库真实约束

- backend 启动前会校验 `PUBLIC_SITE_URL`、`PUBLIC_API_URL`、`CORS_ALLOWED_ORIGINS`。
- frontend 构建依赖 `VITE_API_BASE_URL`。
- Nginx 代理 `/api`、`/uploads`、`/`，端口链路是外网 -> Nginx -> frontend/backend。
- `docker-compose.yml` 使用外部 volume `my-blog_db_data`，不能把“重建 volume”当默认回滚动作。

## 最低验证

- 成功路径：配置之间能够闭环解释，端口、服务名、健康检查一致。
- 失败路径至少一条：
  - 必要环境变量缺失
  - 代理路径与后端路径不一致
  - 健康检查命中错误路径
- 高风险配置改动必须写明回滚顺序。

## 同步要求

- 新增或删除环境变量时，同步 `.env.production.example`。
- 代理链路变更时，同步 `consumer-matrix.md`。
