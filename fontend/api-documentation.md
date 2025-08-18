# TechBlog API 接口文档

## 基础信息

- **基础URL**: `http://localhost:3000/api`
- **认证方式**: Bearer Token (JWT)
- **内容类型**: `application/json` (除文件上传外)
- **字符编码**: UTF-8

## 通用响应格式

```javascript
{
  "code": 0,           // 状态码：0=成功，其他=失败
  "message": "success", // 响应消息
  "data": {},          // 响应数据
  "error": "错误详情"   // 开发环境下的错误堆栈（可选）
}
```

> 注意：个别接口直接返回资源对象或仅返回 `{ message }`，未包裹在 `{ code, data }` 中（例如部分用户/分类/标签/附件接口），以控制器实现为准。

## 通用错误码

| 错误码 | 说明 |
|--------|------|
| 0 | 成功 |
| 1001 | 参数校验失败 |
| 1002 | 认证失败 |
| 1003 | 无权限 |
| 1004 | 资源不存在 |
| 1005 | 数据重复 |
| 1006 | 无效参数 |
| 2001 | 数据库操作异常 |
| 500 | 服务器内部错误 |

---

## 文章管理 API

### 1. 创建文章（前端仅上传 Markdown 到 Content）

**接口地址**: `POST /api/articles`

**请求头**:
```
Authorization: Bearer <token>
Content-Type: application/json
X-Editor-Token: <可选，编辑会话键，用于将临时附件归并到本文>
```

**请求参数**:
```javascript
{
  "title": "文章标题",                 // 必填，字符串，对应 posts.Title
  "content": "# 标题\n\n段落...",   // 必填，Markdown 字符串，后端按原样存入 posts.Content
  "slug": "article-slug",             // 可选，对应 posts.Slug（唯一）
  "excerpt": "文章摘要",               // 可选，对应 posts.Excerpt
  "status": "draft",                  // 可选：draft/published/archived，对应 posts.Status
  "categoryIds": [1, 2],               // 可选，分类ID数组
  "tagIds": [1, 2, 3],                 // 可选，标签ID数组
  "featuredImageURL": "图片URL"       // 可选，对应 posts.FeaturedImageURL
}
```

**响应示例**:
```javascript
{
  "code": 0,
  "message": "创建成功",
  "data": {
    "PostID": 1,
    "UserID": 1,
    "Title": "文章标题",
    "Content": "文章内容",
    // 不再返回 ContentJSON 字段
    "Slug": "article-slug",
    "Excerpt": "文章摘要",
    "Status": "draft",
    "CreatedAt": "2025-01-27T10:00:00.000Z",
    "UpdatedAt": "2025-01-27T10:00:00.000Z",
    "PublishedAt": null,
    "ViewCount": 0,
    "FeaturedImageURL": null
  }
}
```

### 2. 获取文章列表

**接口地址**: `GET /api/articles`

**请求参数** (Query Parameters):
```
page=1                         // 分页页码，默认 1
pageSize=10                    // 每页数量，默认 10
keyword=搜索关键词              // 可选，匹配 Title/Excerpt/Content
status=draft|published|archived // 可选，默认 published

// 分类/标签筛选（兼容单值与多值）
category=1                     // 可选，单分类（兼容旧参数）
tag=1                          // 可选，单标签（兼容旧参数）
categories=1,2,3               // 可选，多分类，逗号分隔
tags=2,3,4                     // 可选，多标签，逗号分隔
categoryMode=any|all           // 可选，多分类匹配模式：any(任一) | all(全部)；默认 any
tagMode=any|all                // 可选，多标签匹配模式：any(任一) | all(全部)；默认 any

// 字段投影与关联展开
fields=PostID,Title,PublishedAt // 可选；未传时默认投影：PostID,Title,Excerpt,Slug,Status,FeaturedImageURL,PublishedAt,CreatedAt,UpdatedAt,ViewCount,UserID（不含 Content）
include=categories,tags,user    // 可选；默认 categories,tags,user 全部

// 排序
sort=PublishedAt:desc,CreatedAt:desc // 可选，多个用逗号分隔；默认按 PublishedAt, CreatedAt 倒序
```

> 说明：
> - 当提供 `fields` 时，仅返回指定的文章主表字段；系统会自动补充 `PostID`。
> - 未提供 `fields` 时，列表接口使用轻量投影（不包含 `Content`）。
> - `fields` 会进行白名单校验（以文章模型字段为准，参见文末“数据模型字段命名对照”）。
> - `include` 允许值：`categories`、`tags`、`user`；未提供时默认全部展开。

**响应示例**:
```javascript
{
  "code": 0,
  "message": "获取成功",
  "data": {
    "list": [
      {
        "PostID": 1,
        "UserID": 1,
        "Title": "文章标题",
        "Slug": "article-slug",
        "Excerpt": "文章摘要",
        "Status": "published",
        "ViewCount": 100,
        "CreatedAt": "2025-01-27T10:00:00.000Z",
        "UpdatedAt": "2025-01-27T10:00:00.000Z",
        "PublishedAt": "2025-01-28T09:00:00.000Z",
        "FeaturedImageURL": null,
        "User": {                 // include: attributes ['UserID','Username','DisplayName','AvatarURL']
          "UserID": 1,
          "Username": "author",
          "DisplayName": "作者名称",
          "AvatarURL": "https://.../avatar.png"
        },
        "Categories": [ { "CategoryID": 1, "Name": "技术" } ],
        "Tags": [ { "TagID": 1, "Name": "JavaScript" } ]
      }
    ],
    "total": 100,
    "page": 1,
    "pageSize": 10
  }
}
```

**错误示例**（当 `fields` 或 `include` 非法时返回 400）:

```javascript
// 无效的 fields
{
  "code": 1,
  "message": "无效的字段参数",
  "error": "以下字段不被允许: Foo, Bar",
  "allowedFields": ["PostID", "UserID", "Title", "Content", "Slug", "Excerpt", "Status", "CreatedAt", "UpdatedAt", "PublishedAt", "ViewCount", "FeaturedImageURL"]
}
```

```javascript
// 无效的 include
{
  "code": 1,
  "message": "无效的 include 参数",
  "error": "以下 include 不被允许: likes, comments",
  "allowedIncludes": ["categories", "tags", "user"]
}
```

### 2.1 获取文章总数（与列表同过滤）

**接口地址**: `GET /api/articles/count`

**请求参数** (Query Parameters):
```
keyword=搜索关键词
status=draft|published|archived
categories=1,2,3
tags=2,3,4
categoryMode=any|all
tagMode=any|all
```

**响应示例**:
```javascript
{ "code": 0, "data": { "total": 123 } }
```

### 3. 获取单篇文章

**接口地址**: `GET /api/articles/{id}`

**路径参数**:
```
id: PostID (必填)
```

**请求参数** (Query Parameters):
```
// 字段投影与关联展开
fields=PostID,Title,PublishedAt // 可选；传入时仅返回指定字段（系统会自动补充 PostID）
include=categories,tags,user    // 可选；默认 categories,tags,user 全部
```

> 说明：
> - 当提供 `fields` 时，仅返回指定的文章主表字段；系统会自动补充 `PostID`。
> - 未提供 `fields` 时，单篇文章接口保持兼容，返回完整正文（包含 `Content`）。
> - `fields` 会进行白名单校验（以文章模型字段为准，参见文末“数据模型字段命名对照”）。
> - `include` 允许值：`categories`、`tags`、`user`；未提供时默认全部展开。

**响应示例**:
```javascript
{
  "code": 0,
  "message": "获取成功",
  "data": {
    "PostID": 1,
    "UserID": 1,
    "Title": "文章标题",
    "Content": "完整的文章内容",
    // 不再返回 ContentJSON 字段
    "Slug": "article-slug",
    "Excerpt": "文章摘要",
    "Status": "published",
    "ViewCount": 100,
    "FeaturedImageURL": "https://.../cover.png",
    "CreatedAt": "2025-01-27T10:00:00.000Z",
    "UpdatedAt": "2025-01-27T10:00:00.000Z",
    "PublishedAt": "2025-01-28T09:00:00.000Z",
    "User": { "UserID": 1, "Username": "author", "DisplayName": "作者名称", "AvatarURL": "https://.../avatar.png" },
    "Categories": [ { "CategoryID": 1, "Name": "技术" } ],
    "Tags": [ { "TagID": 1, "Name": "JavaScript" } ]
  }
}
```

### 4. 更新文章（不再接收 contentJSON）

**接口地址**: `PUT /api/articles/{id}`

**请求头**:
```
Authorization: Bearer <token>
Content-Type: application/json
X-Editor-Token: <可选，编辑会话键，用于将临时附件归并到本文>
```

**路径参数**:
```
id: PostID (必填)
```

**请求参数**:
```javascript
{
  "title": "更新后的标题",          // 可选
  "content": "更新后的内容",        // 可选
  // 仅使用 content（Markdown 字符串）
  "excerpt": "更新后的摘要",        // 可选
  "status": "published",          // 可选
  "categoryIds": [1, 2],           // 可选
  "tagIds": [1, 2, 3]              // 可选
}
```

**响应示例**:
```javascript
{
  "code": 0,
  "message": "更新成功",
  "data": {
    "PostID": 1,
    "Title": "更新后的标题",
    "Content": "更新后的内容",
    // 不再返回 ContentJSON 字段
    "Status": "published",
    "UpdatedAt": "2025-01-27T11:00:00.000Z"
  }
}
```

### 5. 删除文章

**接口地址**: `DELETE /api/articles/{id}`

**请求头**:
```
Authorization: Bearer <token>
```

**路径参数**:
```
id: PostID (必填)
```

**响应示例**:
```javascript
{ "code": 0, "message": "删除成功" }
```

### 6. 获取文章修订历史

**接口地址**: `GET /api/articles/{id}/revisions`

**路径参数**:
```
id: PostID (必填)
```

**响应示例**:
```javascript
{
  "code": 0,
  "data": [
    {
      "RevisionID": 12,
      "PostID": 1,
      "UserID": 2,
      "Title": "历史标题",
      "Content": "历史内容",
      "Excerpt": "历史摘要",
      "RevisionType": "update",
      "CreatedAt": "2025-01-27T10:30:00.000Z",
      "User": { "UserID": 2, "Username": "editor" }
    }
  ]
}
```

### 7. 增加文章浏览量

**接口地址**: `PUT /api/articles/{id}/view-count`

**路径参数**:
```
id: PostID (必填)
```

**响应示例**:
```javascript
{
  "code": 0,
  "message": "浏览次数更新成功",
  "data": { "viewCount": 101 }
}
```

### 8. 修改文章状态

**接口地址**: `PUT /api/articles/{id}/status`

**路径参数**:
```
id: PostID (必填)
```

**请求参数**:
```javascript
{ "status": "draft" | "published" | "archived" }
```

**响应示例**:
```javascript
{
  "code": 0,
  "message": "状态更新成功",
  "data": { "PostID": 1, "Status": "published", "PublishedAt": "2025-01-28T09:00:00.000Z" }
}
```

### 9. 发布文章

**接口地址**: `PUT /api/articles/{id}/publish`

**响应示例**:
```javascript
{ "code": 0, "message": "文章发布成功", "data": { "PostID": 1, "Status": "published", "PublishedAt": "2025-01-28T09:00:00.000Z" } }
```

### 10. 归档文章

**接口地址**: `PUT /api/articles/{id}/archive`

**响应示例**:
```javascript
{ "code": 0, "message": "文章归档成功", "data": { "PostID": 1, "Status": "archived" } }
```

### 11. 设置文章封面图

**接口地址**: `PUT /api/articles/{id}/featured-image`

**请求参数**:
```javascript
{ "featuredImageURL": "https://.../cover.png" }
```

**响应示例**:
```javascript
{ "code": 0, "message": "封面图设置成功", "data": { "PostID": 1, "FeaturedImageURL": "https://.../cover.png" } }
```

### 12. 通过 Slug 获取文章

**接口地址**: `GET /api/articles/slug/{slug}`

**请求参数** (Query Parameters):
```
// 字段投影与关联展开
fields=PostID,Title,PublishedAt // 可选；未传时采用默认投影：PostID,Title,Excerpt,Slug,Status,FeaturedImageURL,PublishedAt,CreatedAt,UpdatedAt,ViewCount,UserID（不含 Content）
include=categories,tags,user    // 可选；默认 categories,tags,user 全部
```

> 说明：
> - 当提供 `fields` 时，仅返回指定的文章主表字段；系统会自动补充 `PostID`。
> - 未提供 `fields` 时，Slug 接口使用轻量投影（不包含 `Content`）。
> - `fields` 会进行白名单校验（以文章模型字段为准，参见文末“数据模型字段命名对照”）。
> - `include` 允许值：`categories`、`tags`、`user`；未提供时默认全部展开。

**响应示例**:
```javascript
{ "code": 0, "data": { "PostID": 1, "Slug": "article-slug", "Title": "..." } }
```

### 13. 回滚到历史版本

**接口地址**: `POST /api/articles/{id}/restore/{revisionId}`

**响应示例**:
```javascript
{ "code": 0, "message": "回滚成功", "data": { "PostID": 1, "Title": "已回滚标题" } }
```

### 14. 获取我的文章

**接口地址**: `GET /api/articles/my`

**请求参数** (Query):
```
page=1&pageSize=10&status=draft|published|archived
```

**响应**: 与“获取文章列表”相同结构

### 15. 获取草稿箱

**接口地址**: `GET /api/articles/drafts`

**请求参数** (Query): `page` `pageSize`

**响应**: 与“获取文章列表”相同结构

### 16. 获取已发布文章

**接口地址**: `GET /api/articles/published`

**请求参数** (Query): `page` `pageSize` `keyword?` `category?` `tag?`

**响应**: 与“获取文章列表”相同结构（按 `PublishedAt` 倒序）

### 8. 导入文档并解析（将下线）

**接口地址**: `POST /api/articles/import`（计划下线，改为前端/CI 侧解析为 Markdown 写入 `Content`）

**请求头**:
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**请求参数**:
```
file: 文件对象 (必填，支持 docx/md/txt/html/pdf)
```

**响应示例**:
```javascript
{
  "code": 0,
  "message": "文档解析成功",
  "data": {
    // 解析服务返回结构化 contentJSON 将逐步下线；前端改为本地或构建期解析为 Markdown 后存入 Content
    "images": [
      "/uploads/images/uuid1.png",
      "/uploads/images/uuid2.jpg"
    ]
  }
}
```

---

## 附件管理 API

### 1. 上传附件（支持去重与临时附件）

**接口地址**: `POST /api/attachments`

**请求头**:
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**请求参数**:
```
file: 文件对象 (必填)
postId: 文章ID (可选；不传则作为临时附件)
description: 文件描述 (可选，字符串)
compress: 是否压缩 (可选，布尔值，默认true)
quality: 压缩质量 (可选，数字1-100，默认80)
maxWidth: 最大宽度 (可选，数字)
maxHeight: 最大高度 (可选，数字)
editorToken: 编辑会话键 (可选，建议前端传以便草稿期聚合)
sha256: 客户端预计算的 SHA-256 (可选，用于快速查重；服务端会复算校验)
```

**响应示例**:
```javascript
{
  "code": 0,
  "message": "上传成功",
  "data": {
    "AttachmentID": 1,
    "PostID": 123,
    "UserID": 1,
    "OriginalName": "image.jpg",
    "StoredName": "1703123456789-123456789-image.jpg",
    "MimeType": "image/jpeg",
    "FileSize": 102400,
    "UploadedAt": "2025-01-27T10:00:00.000Z",
    "Description": "文章配图"
  }
}
```
> 说明：该接口直接返回附件对象（未包裹 `code/message`）。不同部署可能通过统一中间件包裹。

### 2. 按哈希查重

**接口地址**: `GET /api/attachments/lookup?sha256=<hash>`

**响应**:
```javascript
{ "code": 0, "data": { "exists": true|false, "attachment": Attachment? } }
```

> 说明：全局查重（不限定文章）。

### 3. 获取附件列表

**接口地址**: `GET /api/attachments`

**请求头**:
```
Authorization: Bearer <token>
```

**请求参数** (Query Parameters):
```
page=1                    // 页码，默认1
pageSize=10              // 每页数量，默认10
userId=1                 // 可选，上传用户ID筛选
postId=123               // 可选，文章ID筛选
keyword=搜索关键词        // 可选，文件名搜索
```

**响应示例**:
```javascript
{
  "code": 0,
  "message": "获取成功",
  "data": {
    "list": [
      {
        "AttachmentID": 1,
        "PostID": 123,
        "UserID": 1,
        "OriginalName": "image.jpg",
        "StoredName": "1703123456789-123456789-image.jpg",
        "MimeType": "image/jpeg",
        "FileSize": 102400,
        "UploadedAt": "2025-01-27T10:00:00.000Z",
        "Description": "文章配图",
        "User": {
          "UserID": 1,
          "Username": "uploader",
          "DisplayName": "上传者"
        },
        "Post": {               // 关联文章（字段名按实现可能是 Article/Post）
          "PostID": 123,
          "Title": "文章标题"
        }
      }
    ],
    "total": 50,
    "page": 1,
    "pageSize": 10
  }
}
```

### 4. 获取单个附件信息

**接口地址**: `GET /api/attachments/{id}`

**路径参数**:
```
id: 附件ID (必填)
```

**响应示例**:
```javascript
{
  "code": 0,
  "message": "获取成功",
  "data": {
    "AttachmentID": 1,
    "PostID": 123,
    "UserID": 1,
    "OriginalName": "image.jpg",
    "StoredName": "1703123456789-123456789-image.jpg",
    "MimeType": "image/jpeg",
    "FileSize": 102400,
    "UploadedAt": "2025-01-27T10:00:00.000Z",
    "Description": "文章配图",
    "User": { "UserID": 1, "Username": "uploader", "DisplayName": "上传者" },
    "Post": { "PostID": 123, "Title": "文章标题" }
  }
}
```

### 5. 下载附件

**接口地址**: `GET /api/attachments/{id}/download`

**路径参数**:
```
id: 附件ID (必填)
```

**响应**: 文件流，浏览器会自动下载

### 6. 获取文件预览信息

**接口地址**: `GET /api/attachments/{id}/preview-info`

**请求头**:
```
Authorization: Bearer <token>
```

**路径参数**:
```
id: 附件ID (必填)
```

**响应示例**:
```javascript
{
  "code": 0,
  "message": "获取成功",
  "data": {
    "AttachmentID": 1,
    "OriginalName": "image.jpg",
    "MimeType": "image/jpeg",
    "FileSize": 102400,
    "PreviewURL": "/api/attachments/1/preview",
    "DownloadURL": "/api/attachments/1/download",
    "IsImage": true,
    "IsVideo": false,
    "IsDocument": false,
    "Dimensions": {
      "width": 1920,
      "height": 1080
    }
  }
}
```

### 7. 文件预览

**接口地址**: `GET /api/attachments/{id}/preview`

**请求头**:
```
Authorization: Bearer <token>
```

**路径参数**:
```
id: 附件ID (必填)
```

**响应**: 图片/视频流，浏览器直接显示

### 8. 删除附件

**接口地址**: `DELETE /api/attachments/{id}`

**请求头**:
```
Authorization: Bearer <token>
```

**路径参数**:
```
id: 附件ID (必填)
```

**响应示例**:
```javascript
{ "message": "删除成功" }
```

### 9. 批量删除附件

**接口地址**: `POST /api/attachments/batch-delete`

**请求头**:
```
Authorization: Bearer <token>
Content-Type: application/json
```

**请求参数**:
```javascript
{
  "attachmentIds": [1, 2, 3]  // 附件ID数组
}
```

**响应示例**:
```javascript
{ "code": 0, "message": "成功删除 3 个附件" }
```

### 10. 压缩单个文件

**接口地址**: `POST /api/attachments/{id}/compress`

**请求头**:
```
Authorization: Bearer <token>
Content-Type: application/json
```

**路径参数**:
```
id: 附件ID (必填)
```

**请求参数** (Query Parameters):
```
quality=80              // 压缩质量，1-100，默认80
width=1920              // 可选，调整宽度
height=1080             // 可选，调整高度
```

**响应示例**:
```javascript
{
  "code": 0,
  "message": "压缩成功",
  "data": {
    "originalSize": 204800,
    "compressedSize": 102400,
    "compressionRatio": "50.00%",
    "newStoredName": "compressed_1703123456789-123456789-image.jpg"
  }
}
```

### 11. 批量压缩为ZIP

**接口地址**: `POST /api/attachments/compress-zip`

**请求头**:
```
Authorization: Bearer <token>
Content-Type: application/json
```

**请求参数**:
```javascript
{
  "attachmentIds": [1, 2, 3],  // 附件ID数组
  "zipName": "压缩包.zip"       // 可选，ZIP文件名
}
```

**响应示例**:
```javascript
{
  "code": 0,
  "message": "压缩成功",
  "data": {
    "zipUrl": "/uploads/zips/1703123456789-compressed.zip",
    "zipSize": 512000,
    "fileCount": 3
  }
}
```

### 12. 获取文件分类统计

**接口地址**: `GET /api/attachments/categories`

**请求头**:
```
Authorization: Bearer <token>
```

**响应示例**:
```javascript
{
  "code": 0,
  "message": "获取成功",
  "data": [
    {
      "category": "image",
      "count": 50,
      "totalSize": 5120000,
      "extensions": ["jpg", "png", "gif"]
    },
    {
      "category": "document",
      "count": 20,
      "totalSize": 2048000,
      "extensions": ["pdf", "docx", "txt"]
    },
    {
      "category": "video",
      "count": 10,
      "totalSize": 10240000,
      "extensions": ["mp4", "avi", "mov"]
    }
  ]
}
```

### 13. 获取压缩建议

**接口地址**: `GET /api/attachments/{id}/compression-suggestions`

**请求头**:
```
Authorization: Bearer <token>
```

**路径参数**:
```
id: 附件ID (必填)
```

**响应示例**:
```javascript
{
  "code": 0,
  "message": "获取成功",
  "data": {
    "canCompress": true,
    "suggestions": [
      {
        "quality": 80,
        "estimatedSize": 102400,
        "compressionRatio": "50%"
      },
      {
        "quality": 60,
        "estimatedSize": 76800,
        "compressionRatio": "62.5%"
      }
    ],
    "recommendedQuality": 80
  }
}
```

---

## 前端集成示例

### 1. 上传文章附件（支持会话聚合与哈希秒传）

```javascript
// 计算 SHA-256（浏览器端）
async function computeSHA256(file) {
  const arrayBuffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', arrayBuffer);
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// 先查重，再上传；postId 可不传（临时附件），通过 X-Editor-Token 会话在保存文章时归并
const uploadAttachment = async (file, { postId, editorToken, description = '' } = {}) => {
  const sha256 = await computeSHA256(file);

  // 查重（全局基于内容哈希）
  const lookupRes = await fetch(`/api/attachments/lookup?sha256=${sha256}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const lookup = await lookupRes.json();
  if (lookup?.code === 0 && lookup?.data?.exists && lookup?.data?.attachment) {
    return lookup.data.attachment; // 直接复用
  }

  // 未命中则上传（postId 可选；不传则作为临时附件，后端保存文章时自动归并）
  const formData = new FormData();
  formData.append('file', file);
  if (postId != null) formData.append('postId', String(postId));
  if (editorToken) formData.append('editorToken', editorToken);
  formData.append('sha256', sha256);
  formData.append('description', description);
  formData.append('compress', 'true');
  formData.append('quality', '80');

  const response = await fetch('/api/attachments', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });
  const result = await response.json();
  if (result.code !== 0) throw new Error(result.message);
  return result.data;
};
```

### 2. 创建/更新文章（携带编辑会话以归并临时附件）

```javascript
// 将本次编辑生成/复用的 editorToken 透传到请求头，便于服务端将临时附件转正并清理未引用
const editorToken = localStorage.getItem('editorToken') || `ed_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
localStorage.setItem('editorToken', editorToken);

// 创建文章（content 填 Markdown 文本）
const createArticle = async ({ title, md, ...rest }) => {
  const payload = { title, content: md, ...rest };
  const response = await fetch('/api/articles', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-Editor-Token': editorToken
    },
    body: JSON.stringify(payload)
  });
  const result = await response.json();
  if (result.code !== 0) throw new Error(result.message);
  return result.data;
};

// 更新文章时同理携带 X-Editor-Token 以同步附件引用
const updateArticle = async (id, { md, ...rest }) => {
  const payload = { content: md, ...rest };
  const response = await fetch(`/api/articles/${id}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-Editor-Token': editorToken
    },
    body: JSON.stringify(payload)
  });
  const result = await response.json();
  if (result.code !== 0) throw new Error(result.message);
  return result.data;
};

// 使用示例
const newArticle = await createArticle({
  title: '我的文章',
  md: '# 标题\n\n正文...',
  status: 'draft',
  categoryIds: [1],
  tagIds: [1, 2]
});
```

### 3. 获取文章列表

```javascript
// 获取文章列表
const getArticles = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  
  try {
    const response = await fetch(`/api/articles?${queryString}`);
    const result = await response.json();
    
    if (result.code === 0) {
      return result.data;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('获取文章列表失败:', error);
    throw error;
  }
};

// 使用示例
const articles = await getArticles({
  page: 1,
  pageSize: 10,
  status: 'published',
  keyword: 'JavaScript'
});
```

### 4. 错误处理

```javascript
// 统一错误处理
const handleApiError = (error) => {
  if (error.response) {
    const { status, data } = error.response;
    
    switch (status) {
      case 400:
        console.error('请求参数错误:', data.message);
        break;
      case 401:
        console.error('认证失败，请重新登录');
        // 跳转到登录页
        break;
      case 403:
        console.error('权限不足');
        break;
      case 404:
        console.error('资源不存在');
        break;
      case 500:
        console.error('服务器内部错误');
        break;
      default:
        console.error('未知错误:', data.message);
    }
  } else {
    console.error('网络错误:', error.message);
  }
};
```

---

## 注意事项

1. **文件上传限制**：
   - 支持的文件类型：图片(jpg, png, gif, webp)、文档(pdf, docx, txt, md, html)
   - 最大文件大小：10MB
   - 图片自动压缩：默认启用，质量80%

2. **权限控制**：
   - 文章创建/编辑：需要作者或管理员权限
   - 文章删除：需要作者或管理员权限
   - 附件上传：需要认证用户
   - 附件删除：需要上传者或管理员权限

3. **分页参数**：
   - 默认每页10条记录
   - 最大每页100条记录
   - 页码从1开始

4. **搜索功能**：
   - 文章搜索：支持标题和内容模糊搜索
   - 附件搜索：支持文件名模糊搜索

5. **缓存建议**：
   - 文章列表建议缓存5分钟
   - 单篇文章建议缓存10分钟
   - 附件信息建议缓存30分钟

---

## 更新日志

- **v1.0.0** (2025-01-27): 初始版本，包含基础的文章和附件管理功能
- 支持文章CRUD操作
- 支持附件上传、下载、预览
- 支持图片自动压缩
- 支持文档导入解析 

---

## 其它模块 API 概览

> 下列接口均遵循前文“基础信息/通用响应格式/通用错误码”。更详细的字段定义可在 Swagger 文档查看：`/api-docs`。

### 用户 API

- POST `/api/users/register` 用户注册
  - 请求体：`{ username, email, password, phoneNumber? }`
  - 示例：
    ```bash
    curl -X POST http://localhost:3000/api/users/register \
      -H "Content-Type: application/json" \
      -d '{"username":"jack","email":"jack@example.com","password":"Passw0rd!"}'
    ```
- POST `/api/users/login` 用户登录
  - 请求体：`{ email|username|phoneNumber, password }`
  - 示例：
    ```bash
    curl -X POST http://localhost:3000/api/users/login \
      -H "Content-Type: application/json" \
      -d '{"email":"jack@example.com","password":"Passw0rd!"}'
    ```
- GET `/api/users/me` 获取当前用户信息（需登录）
  - 响应：`{ code: 0, data: User }`
- PUT `/api/users/me` 更新当前用户（支持头像文件）
  - Content-Type: `multipart/form-data`
  - 字段：`displayName?`, `bio?`, `avatarURL?`, `file?`
- PUT `/api/users/me/password` 修改密码（需登录）
- PUT `/api/users/me/email` 校验验证码并更新邮箱（需登录）
- POST `/api/email/send-code` 发送邮箱验证码
  - 请求体：`{ oldPassword, newPassword }`
- POST `/api/users/forgot-password` 忘记密码
  - 请求体：`{ email }`
- POST `/api/users/logout` 退出登录（需登录）

- GET `/api/users` 获取用户列表（管理员）
  - 响应：`{ code: 0, data: { list, total, page, pageSize } }`
- GET `/api/users/online` 在线用户（管理员）
  - 响应：`{ code: 0, data: { list, total } }`
- GET `/api/users/statistics` 用户统计（管理员）
  - 响应：`{ code: 0, data: { totalUsers, activeUsers, newUsersToday, ... } }`
- GET `/api/users/{id}` 获取用户详情（管理员）
  - 响应：`User`（控制器直接返回用户对象）
- PUT `/api/users/{id}` 更新用户（管理员，支持头像文件）
  - Content-Type: `multipart/form-data`
  - 响应：`User`（控制器直接返回用户对象）
- DELETE `/api/users/{id}` 删除用户（管理员）
  - 响应：`{ code: 0, message: '用户删除成功' }`
- PUT `/api/users/{id}/status` 设置用户状态（管理员）
  - 请求体：`{ isActive: true | false }`
  - 响应：`{ code: 0, message: '用户已启用' | '用户已禁用', data?: User }`
- POST `/api/users/{id}/roles` 分配用户角色（管理员）
  - 请求体：`{ roleIds: number[] }` 或 `{ roleId: number }`
  - 响应：`{ code: 0, message: '角色分配成功' }`
- DELETE `/api/users/{id}/roles/{roleId}` 移除用户角色（管理员）
  - 响应：`{ code: 0, message: '角色移除成功' }`
- POST `/api/users/batch-delete` 批量删除用户（管理员）
  - 请求体：`{ userIds: number[] }`
  - 响应：`{ code: 0, message: '成功删除 X 个用户' }`
- PUT `/api/users/{id}/all` 管理员全量更新用户信息
  - 响应：`{ code: 0, data: User }`

### 角色 API（管理员）

- GET `/api/roles` 角色列表 → 响应：`{ code: 0, data: Role[] }`
- POST `/api/roles` 新增角色 → 请求体：`{ name, description? }`，响应：`{ code: 0, data: Role }`
- GET `/api/roles/{id}` 角色详情 → 响应：`{ code: 0, data: Role }`
- PUT `/api/roles/{id}` 更新角色 → 请求体：`{ name?, description? }`，响应：`{ code: 0, message: '角色更新成功', data: Role }`
- DELETE `/api/roles/{id}` 删除角色 → 响应：`{ code: 0, message: '角色删除成功' }`
- GET `/api/roles/{id}/users` 角色下的用户 → 响应：`{ code: 0, data: User[] }`
- POST `/api/roles/{id}/permissions` 分配权限 → 请求体：`{ permissionIds?: number[], permissionKeyList?: string[] }`，响应：`{ code: 0, message: '权限分配成功' }`
- DELETE `/api/roles/{id}/permissions/{permissionId}` 移除权限 → 响应：`{ code: 0, message: '权限移除成功' }`

### 分类 API（管理员）

- POST `/api/categories` 新增分类 → 请求体：`{ name, description?, parentCategoryId? }`，响应：`Category`
- GET `/api/categories` 分类列表 → 响应：`Category[]`
- PUT `/api/categories/{id}` 更新分类 → 请求体：`{ name?, description?, parentCategoryId? }`，响应：`Category`
- DELETE `/api/categories/{id}` 删除分类 → 响应：`{ message: '删除成功' }`
- GET `/api/categories/tree` 分类树 → 响应：`{ code: 0, data: CategoryTree[] }`

### 标签 API（管理员）

- POST `/api/tags` 新增标签 → 请求体：`{ name, description? }`，响应：`Tag`
- GET `/api/tags` 标签列表 → 响应：`Tag[]`
- PUT `/api/tags/{id}` 更新标签 → 请求体：`{ name?, description? }`，响应：`Tag`
- DELETE `/api/tags/{id}` 删除标签 → 响应：`{ message: '删除成功' }`

### 评论 API

- POST `/api/comments/{articleId}` 新增评论（需登录）
  - 请求体：`{ content: string, parentId?: number }`
  - 响应：`{ code: 0, data: Comment }`（若控制器返回不同，以实际为准）
- GET `/api/comments/{articleId}` 文章评论列表 → 响应：`{ code: 0, data: { list, total, page, pageSize } }`
- GET `/api/comments/{articleId}/tree` 文章评论树 → 响应：`{ code: 0, data: CommentTree[] }`
- DELETE `/api/comments/{id}` 删除评论（作者/管理员） → 响应：`{ message: '删除成功' }`
- PUT `/api/comments/{id}/status` 修改评论状态（管理员） → 请求体：`{ status: 'approved'|'pending'|'spam' }`，响应：`{ code: 0, message: '评论状态更新成功', data: Comment }`
- GET `/api/comments` 全部评论（管理员） → 响应：`{ code: 0, data: { list, total, page, pageSize } }`

### 系统日志 API（管理员）

- GET `/api/logs` 日志列表（分页） → 响应：`{ code: 0, data: { list, total, page, pageSize } }`
- GET `/api/logs/{id}` 日志详情 → 响应：`{ code: 0, data: OperationLog }`

### 通知 API（管理员）

- POST `/api/notifications/test` 发送测试通知/邮件 → 响应：`{ code: 0, message: '邮件发送成功' }`

---

## 数据模型字段命名对照（节选）

- 文章（posts）：`PostID`, `UserID`, `Title`, `Slug`, `Content`, `Excerpt`, `Status`, `CreatedAt`, `UpdatedAt`, `PublishedAt`, `ViewCount`, `FeaturedImageURL`, `CurrentRevisionID`
- 修订（postrevisions）：`RevisionID`, `PostID`, `UserID`, `Title`, `Content`, `Excerpt`, `RevisionNotes`, `CreatedAt`, `RevisionType`
- 附件（attachments）：`AttachmentID`, `PostID`, `UserID`, `OriginalName`, `StoredName`, `MimeType`, `FileSize`, `UploadedAt`, `Description`
- 分类（categories）：`CategoryID`, `Name`, `Description`, `ParentCategoryID`, `CreatedBy`, `CreatedAt`, `UpdatedAt`
- 标签（tags）：`TagID`, `Name`, `Description`, `CreatedBy`, `CreatedAt`
- 评论（comments）：`CommentID`, `PostID`, `UserID`, `ParentCommentID`, `Content`, `Status`, `CreatedAt`, `LastEditedAt`
- 用户（users）：`UserID`, `PhoneNumber`, `Username`, `Email`, `PasswordHash`, `DisplayName`, `Bio`, `AvatarURL`, `CreatedAt`, `LastLogin`, `IsActive`

---

## Swagger 文档

- 访问地址：`http://localhost:3000/api-docs`
- 已对 `routes/*.js` 中带注释的接口进行自动生成，细节（字段说明/示例）以 Swagger 页面为准。 