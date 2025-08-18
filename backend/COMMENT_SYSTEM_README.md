# 评论系统修改说明

根据 `xiugai.md` 文档要求，已完成评论系统的后端修改。

## 修改内容

### 1. 数据库模型修改 (`models/Comment.js`)

- ✅ 修改默认状态为 `approved`（已审核）
- ✅ 添加 `CanDelete` 字段，默认值为 `true`
- ✅ 保持与数据库字段命名一致

### 2. 控制器功能增强 (`controllers/commentController.js`)

#### 新增功能：
- ✅ **评论树构建算法**：实现楼中楼结构
- ✅ **权限控制函数**：检查删除权限
- ✅ **自动审核**：新评论默认状态为已审核
- ✅ **级联删除**：删除父评论时自动删除子评论

#### 修改的接口：
- ✅ **创建评论**：参数改为 `parentId`，自动设置状态为已审核
- ✅ **评论树获取**：支持分页、状态筛选，返回树形结构
- ✅ **评论列表**：支持状态筛选
- ✅ **删除评论**：增强权限检查，支持级联删除
- ✅ **状态更新**：管理员可修改评论状态

### 3. 路由更新 (`routes/comment.js`)

- ✅ 更新 Swagger 文档注释
- ✅ 调整路由顺序，评论树接口优先
- ✅ 完善参数验证和说明

### 4. 数据库迁移脚本 (`migrations/add_comment_can_delete.sql`)

- ✅ 修改评论表默认状态
- ✅ 添加 `CanDelete` 字段
- ✅ 包含测试数据插入语句

## API 接口规范

### 1. 获取评论树（楼中楼）
```
GET /api/comments/{articleId}/tree
```

**请求参数：**
- `status`: 评论状态筛选 (approved|pending|spam)，默认 approved
- `page`: 页码，默认 1
- `pageSize`: 每页数量，默认 10

**响应格式：**
```json
{
  "code": 0,
  "message": "success",
  "data": [
    {
      "CommentID": 1,
      "PostID": 1,
      "UserID": 1,
      "ParentCommentID": null,
      "Content": "主评论内容",
      "Status": "approved",
      "CreatedAt": "2024-01-01T10:00:00Z",
      "LastEditedAt": null,
      "CanDelete": true,
      "User": {
        "UserID": 1,
        "Username": "user1",
        "DisplayName": "用户1",
        "AvatarURL": "https://example.com/avatar1.jpg"
      },
      "children": [...]
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "total": 50,
    "hasMore": true
  }
}
```

### 2. 发表评论
```
POST /api/comments/{articleId}
```

**请求体：**
```json
{
  "content": "评论内容",
  "parentId": null  // 回复时传入父评论ID
}
```

**响应格式：**
```json
{
  "code": 0,
  "message": "评论发表成功",
  "data": {
    "CommentID": 3,
    "PostID": 1,
    "UserID": 1,
    "ParentCommentID": null,
    "Content": "评论内容",
    "Status": "approved",
    "CreatedAt": "2024-01-01T10:10:00Z",
    "LastEditedAt": null,
    "CanDelete": true,
    "User": {
      "UserID": 1,
      "Username": "user1",
      "DisplayName": "用户1",
      "AvatarURL": "https://example.com/avatar1.jpg"
    }
  }
}
```

### 3. 删除评论
```
DELETE /api/comments/{commentId}
```

**权限控制：**
- 用户只能删除自己的评论
- 管理员可以删除任何评论
- 如果评论有子评论，需要级联删除

### 4. 更新评论状态（管理员）
```
PUT /api/comments/{commentId}/status
```

**请求体：**
```json
{
  "status": "approved|pending|spam"
}
```

## 部署步骤

### 1. 执行数据库迁移
```sql
-- 在 MySQL 中执行以下 SQL
ALTER TABLE `comments` MODIFY COLUMN `Status` enum('approved','pending','spam') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT 'approved' COMMENT '审核状态';
ALTER TABLE `comments` ADD COLUMN `CanDelete` tinyint(1) DEFAULT 1 COMMENT '用户是否可删除';
```

### 2. 重启服务器
```bash
npm restart
```

### 3. 测试功能
```bash
node test-comment-system.js
```

## 测试验证

运行测试脚本 `test-comment-system.js` 可以验证以下功能：

1. ✅ 用户登录认证
2. ✅ 创建主评论和回复评论
3. ✅ 获取评论树结构
4. ✅ 获取平铺评论列表
5. ✅ 更新评论状态
6. ✅ 管理员查看所有评论
7. ✅ 删除评论（级联删除）

## 前端集成要点

### 1. 楼中楼显示
- 使用递归组件显示评论树
- 子评论缩进显示
- 显示"回复 @用户名"的提示

### 2. 回复功能
- 点击回复时记录父评论信息
- 回复框显示"回复 @用户名"
- 提交时包含 `parentId`

### 3. 删除功能
- 只有自己的评论显示删除按钮
- 删除前确认提示
- 删除后刷新评论列表

## 注意事项

1. **权限控制**：确保前端正确传递用户认证信息
2. **分页处理**：评论树的分页是基于根评论数量
3. **状态筛选**：默认只显示已审核的评论
4. **级联删除**：删除父评论会自动删除所有子评论
5. **响应格式**：统一使用 `{ code, message, data }` 格式

## 更新日志

- **v1.1.0** (2025-01-27): 根据 xiugai.md 文档完成评论系统重构
  - 实现楼中楼评论结构
  - 添加自动审核功能
  - 增强权限控制
  - 支持级联删除
  - 完善 API 文档 