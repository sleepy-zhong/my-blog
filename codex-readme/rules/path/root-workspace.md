# 根工作区路径规则

## 适用范围

- 根目录文件和跨目录任务：
  - `docker-compose.yml`
  - `nginx.conf`
  - `my.cnf`
  - `.env.production.example`
  - `docs/`
  - `fontend/`
  - `backend/backend/`

## 活跃目录

- 主前端：`fontend/`
- 主后端：`backend/backend/`
- 专题文档与 SQL：`docs/`、`backend/backend/database/`
- 部署与运维：根目录配置文件、两个 Dockerfile

## 默认忽略

- `fontend/dist/`
- `fontend/node_modules/`
- `backend/backend/node_modules/`
- `backend/backend/uploads/`
- `logs/`
- `backups/`
- `ssl/`
- `docs/Xftp8DragDropSupportDir786644437/`

这些目录默认当成产物、运行数据或临时目录，不作为常规改动目标。

## 仓库特有约束

- 当前目录没有 `.git` 元数据，任务说明里不能假设有 branch、commit 或 PR 语义。
- 目录名 `fontend` 是现状，不做大规模目录重命名。
- 若任务跨前后端，必须显式说明共享契约：API、会话、上传路径、环境变量或缓存键。

## 最低验证

- 文档类改动：检查路径引用真实存在。
- 跨目录配置类改动：检查前后端、代理层、环境变量是否成对同步。
