# 评论系统API规范

## 数据库修改

### 1. 修改评论默认状态
```sql
-- 修改评论表默认状态为已审核
ALTER TABLE `comments` MODIFY COLUMN `Status` enum('approved','pending','spam') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT 'approved' COMMENT '审核状态';
```

### 2. 添加用户删除权限字段（可选）
```sql
-- 在comments表中添加用户删除权限字段
ALTER TABLE `comments` ADD COLUMN `CanDelete` tinyint(1) DEFAULT 1 COMMENT '用户是否可删除';
```

## API接口规范

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
      "children": [
        {
          "CommentID": 2,
          "PostID": 1,
          "UserID": 2,
          "ParentCommentID": 1,
          "Content": "回复内容",
          "Status": "approved",
          "CreatedAt": "2024-01-01T10:05:00Z",
          "LastEditedAt": null,
          "CanDelete": true,
          "User": {
            "UserID": 2,
            "Username": "user2",
            "DisplayName": "用户2",
            "AvatarURL": "https://example.com/avatar2.jpg"
          },
          "children": []
        }
      ]
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
    "Status": "approved",  // 自动设置为已审核
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

**响应格式：**
```json
{
  "code": 0,
  "message": "评论删除成功"
}
```

### 4. 获取评论列表（管理员）
```
GET /api/comments
```

**请求参数：**
- `page`: 页码
- `pageSize`: 每页数量
- `status`: 状态筛选
- `articleId`: 文章ID筛选
- `keyword`: 内容关键词搜索

**响应格式：**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "list": [...],
    "total": 100,
    "page": 1,
    "pageSize": 10
  }
}
```

### 5. 更新评论状态（管理员）
```
PUT /api/comments/{commentId}/status
```

**请求体：**
```json
{
  "status": "approved|pending|spam"
}
```

## 后端实现要点

### 1. 评论树构建
```javascript
// 伪代码示例
function buildCommentTree(comments) {
  const commentMap = new Map();
  const rootComments = [];
  
  // 建立映射关系
  comments.forEach(comment => {
    comment.children = [];
    commentMap.set(comment.CommentID, comment);
  });
  
  // 构建树结构
  comments.forEach(comment => {
    if (comment.ParentCommentID) {
      const parent = commentMap.get(comment.ParentCommentID);
      if (parent) {
        parent.children.push(comment);
      }
    } else {
      rootComments.push(comment);
    }
  });
  
  return rootComments;
}
```

### 2. 权限控制
```javascript
// 删除权限检查
function canDeleteComment(userId, comment, userRole) {
  if (userRole === 'admin') return true;
  return comment.UserID === userId && comment.CanDelete;
}
```

### 3. 自动审核
```javascript
// 评论创建时自动设置为已审核
const newComment = {
  ...commentData,
  Status: 'approved',  // 默认已审核
  CanDelete: true
};
```

## 前端实现要点

### 1. 楼中楼显示
- 使用递归组件显示评论树
- 子评论缩进显示
- 显示"回复 @用户名"的提示

### 2. 回复功能
- 点击回复时记录父评论信息
- 回复框显示"回复 @用户名"
- 提交时包含 parentId

### 3. 删除功能
- 只有自己的评论显示删除按钮
- 删除前确认提示
- 删除后刷新评论列表

## 测试数据

### 插入测试评论数据
```sql
-- 插入主评论
INSERT INTO comments (PostID, UserID, ParentCommentID, Content, Status) VALUES 
(1, 1, NULL, '这是一条主评论', 'approved'),
(1, 2, NULL, '这是另一条主评论', 'approved');

-- 插入回复评论
INSERT INTO comments (PostID, UserID, ParentCommentID, Content, Status) VALUES 
(1, 3, 1, '回复第一条评论', 'approved'),
(1, 1, 1, '回复自己的评论', 'approved'),
(1, 2, 2, '回复第二条评论', 'approved'),
(1, 4, 3, '回复的回复', 'approved');
``` 