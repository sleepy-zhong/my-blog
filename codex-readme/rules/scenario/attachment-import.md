# 附件、上传与导入场景规则

## 适用场景

- 触及附件上传、附件预览、附件下载、图片压缩、文章导入、编辑器附件处理时加载本规则。

## 当前仓库真实约束

- 上传与导入走后端内存流和运行时 `uploads/` 目录，`backend/backend/uploads/` 不是源码目录。
- 附件与导入接口受 `attachmentUploadGuard`、`articleImportGuard` 等 Redis 风控保护。
- 前端预览 URL 和绝对路径策略集中在 `fontend/src/config/attachments.ts`。
- Nginx 对 `/uploads` 做独立代理，代理链路断裂会直接影响附件访问。

## 最低验证

- 成功路径：至少说明一次有效上传、预览、下载或导入链路。
- 失败路径至少一条：
  - 未授权访问
  - 非法类型或超限文件
  - 导入解析失败
- 如果只做文档或配置改动，也要明确这些失败路径是否仍然受保护。

## 同步要求

- 暴露面、校验策略或白名单变化时，同步 `docs/fix-checklist.md`。
- 风控阈值变化时，同步 `docs/redis-risk-guard.md`。
- URL 或代理链路变化时，同步 `consumer-matrix.md` 与 `ops-and-deploy.md`。
