# Redis 风控接入说明

本次改造把 Redis 真正接入了高风险接口的频率控制，目标是降低以下风险：

- 批量注册和验证码轰炸
- 登录验证码滥发和撞库放大
- 找回密码接口被刷
- 附件上传、文章导入和评论接口被低成本滥用

## 已接入的接口

- `POST /api/users/register/code`
- `POST /api/users/register`
- `POST /api/users/login/code`
- `POST /api/users/login`
- `POST /api/users/forgot-password/code`
- `POST /api/users/forgot-password`
- `PUT /api/users/me/password/code`
- `POST /api/comments/:articleId`
- `POST /api/attachments`
- `POST /api/articles/import`

## 默认阈值

未配置环境变量时，使用代码内默认值：

- 注册验证码：IP `3/10分钟`，邮箱 `1/分钟`，邮箱 `5/天`
- 注册提交：IP `3/小时`，邮箱 `3/天`
- 登录验证码：IP `10/15分钟`，账号+IP `5/15分钟`
- 登录提交：IP `20/15分钟`，账号+IP `10/15分钟`
- 找回密码验证码：IP `5/小时`，邮箱 `1/分钟`，邮箱 `3/天`
- 找回密码提交：IP `10/小时`，邮箱 `6/小时`
- 修改密码验证码：用户 `5/小时`
- 评论：IP `20/10分钟`，用户 `10/10分钟`
- 附件上传：IP `30/小时`，用户 `20/小时`
- 文章导入：IP `15/小时`，用户 `10/小时`

## 关键环境变量

- `REDIS_ENABLED=true`
- `REDIS_HOST`
- `REDIS_PORT`
- `REDIS_PASSWORD`
- `TRUST_PROXY=1`
- `RISK_GUARD_ENABLED=true`

可选调优变量示例：

- `RISK_REGISTER_CODE_IP_LIMIT`
- `RISK_REGISTER_SUBMIT_IP_LIMIT`
- `RISK_LOGIN_CODE_ACCOUNT_LIMIT`
- `RISK_FORGOT_CODE_EMAIL_DAILY_LIMIT`
- `RISK_ATTACHMENT_UPLOAD_USER_LIMIT`
- `RISK_COMMENT_CREATE_USER_LIMIT`

## 部署注意事项

- Nginx 反向代理到后端时，保留 `X-Forwarded-For` 和 `X-Real-IP`
- 后端不要继续使用 `trust proxy=true`，改成固定跳数 `TRUST_PROXY=1`
- Docker 健康检查已改为访问公开的 `GET /healthz`
- Redis 断开时，风控中间件默认降级放行，避免认证接口整体不可用
