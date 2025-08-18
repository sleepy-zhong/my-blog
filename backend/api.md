# TechBlogDB 后端接口清单

## 1. 用户与权限
- `POST   /api/users/register`         用户注册（手机号/邮箱/用户名）
- `POST   /api/users/login`            用户登录，返回 JWT
- `POST   /api/users/logout`           用户登出
- `POST   /api/users/forgot-password`  找回密码（邮箱/短信验证码）
- `POST   /api/users/reset-password`   重置密码
- `GET    /api/users/me`               获取当前登录用户信息
- `PUT    /api/users/me`               修改个人资料
- `PUT    /api/users/me/password`      修改密码
- `PUT    /api/users/me/email`         校验验证码并更新邮箱
- `POST   /api/email/send-code`        发送邮箱验证码
- `GET    /api/users`                  用户列表（后台，分页、搜索、筛选）
- `GET    /api/users/:id`              获取指定用户信息
- `PUT    /api/users/:id`              修改用户信息（角色、状态）
- `DELETE /api/users/:id`              删除用户
- `PUT    /api/users/:id/status`       启用/禁用用户
- `POST   /api/users/:id/roles`        为用户分配角色
- `DELETE /api/users/:id/roles/:roleId` 移除用户角色
- `GET    /api/users/online`           获取在线用户列表
- `GET    /api/users/statistics`       获取用户统计信息
- `POST   /api/users/batch-delete`     批量删除用户
- `POST   /api/users/import`           批量导入用户
- `GET    /api/users/export`           导出用户数据

## 2. 角色管理
- `GET    /api/roles`                  获取所有角色
- `POST   /api/roles`                  创建角色
- `GET    /api/roles/:id`              获取角色详情
- `PUT    /api/roles/:id`              更新角色
- `DELETE /api/roles/:id`              删除角色
- `GET    /api/roles/:id/users`        获取角色的用户列表
- `POST   /api/roles/:id/permissions`  为角色分配权限
- `DELETE /api/roles/:id/permissions/:permissionId` 移除角色权限

## 3. 权限管理
- `GET    /api/permissions`            获取所有权限
- `POST   /api/permissions`            创建权限
- `PUT    /api/permissions/:id`        更新权限
- `DELETE /api/permissions/:id`        删除权限
- `GET    /api/permissions/tree`       获取权限树结构

## 4. 文章管理
- `GET    /api/articles`               文章列表（分页、搜索、筛选）
- `POST   /api/articles`               新建文章
- `GET    /api/articles/:id`           获取文章详情
- `PUT    /api/articles/:id`           编辑文章
- `DELETE /api/articles/:id`           删除文章
- `PUT    /api/articles/:id/status`    修改文章状态（草稿/发布/归档）
- `PUT    /api/articles/:id/publish`   发布文章
- `PUT    /api/articles/:id/archive`   归档文章
- `GET    /api/articles/:id/revisions` 获取文章修订历史
- `POST   /api/articles/:id/restore/:revisionId` 回滚到历史版本
- `PUT    /api/articles/:id/featured-image` 设置文章封面图
- `GET    /api/articles/slug/:slug`   通过Slug获取文章
- `PUT    /api/articles/:id/view-count` 增加文章浏览次数
- `GET    /api/articles/my`            获取我的文章
- `GET    /api/articles/drafts`        获取草稿箱
- `GET    /api/articles/published`     获取已发布文章

## 3. 评论系统
- `GET    /api/comments/:articleId`           获取文章评论（平铺）
- `GET    /api/comments/:articleId/tree`      获取文章评论（楼中楼树结构）
- `POST   /api/comments/:articleId`           发表评论（支持父评论ID）
- `DELETE /api/comments/:id`                  删除评论
- `PUT    /api/comments/:id/status`           审核/屏蔽/恢复评论

## 4. 分类与标签
- `GET    /api/categories`                    分类列表（平铺）
- `GET    /api/categories/tree`               分类树结构（多级）
- `POST   /api/categories`                    新建分类
- `PUT    /api/categories/:id`                编辑分类
- `DELETE /api/categories/:id`                删除分类
- `GET    /api/tags`                          标签列表
- `POST   /api/tags`                          新建标签
- `PUT    /api/tags/:id`                      编辑标签
- `DELETE /api/tags/:id`                      删除标签

## 7. 附件管理
- `POST   /api/attachments`            上传附件（multipart/form-data，需关联PostID）
- `GET    /api/attachments/:id`        获取附件信息/下载
- `DELETE /api/attachments/:id`        删除附件
- `GET    /api/attachments?postId=xxx` 查询某文章的所有附件

## 8. 操作日志
- `GET    /api/logs`                   查询操作日志（分页、筛选、排序）
- `GET    /api/logs/:id`               查看单条日志详情

## 9. 其他
- `GET    /api/settings`               获取系统设置
- `PUT    /api/settings`               修改系统设置

## 10. 通知与系统
- `POST   /api/notifications/test`     发送测试邮件（需登录）
- 邮件通知：注册、评论回复、找回密码等场景自动触发
- `GET    /api-docs`                   在线API文档（Swagger UI）

## 11. 安全
- 全局速率限制（express-rate-limit）
- HTTP安全头（helmet）
- CSRF防护（csurf）
- SQL注入防护（sequelize内置）
- XSS防护（helmet内置）

---
- 所有需要登录的接口需校验 JWT（Authorization: Bearer <token>）
- 管理员/编辑等接口需校验权限
- 参数校验使用 express-validator
- 推荐统一响应格式：

```json
{
  "code": 0,
  "message": "操作成功",
  "data": { ... }
}
```
