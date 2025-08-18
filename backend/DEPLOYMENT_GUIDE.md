# 评论系统部署指南

根据 `xiugai.md` 文档要求，完成评论系统的完整部署。

## 📋 部署前检查

确保以下环境已准备就绪：
- ✅ Node.js (v14+)
- ✅ MySQL (v8.0+)
- ✅ 项目依赖已安装 (`npm install`)

## 🗄️ 第一步：数据库修改

### 1.1 执行数据库迁移脚本

选择以下任一方法执行 `fix-comment-database.sql`：

#### 方法1: PowerShell (推荐)
```powershell
Get-Content fix-comment-database.sql | mysql -u root -p techblogdb
```

#### 方法2: 手动执行
1. 打开 MySQL Workbench 或 phpMyAdmin
2. 复制 `fix-comment-database.sql` 内容
3. 在 MySQL 客户端中执行

### 1.2 验证数据库修改

运行验证脚本检查修改是否成功：

```bash
# 修改数据库配置
# 编辑 verify-comment-database.js 中的密码

# 运行验证
node verify-comment-database.js
```

**预期输出：**
```
🔍 开始验证评论系统数据库修改...

✅ 数据库连接成功

📋 检查评论表结构...
Status字段默认值: approved
CanDelete字段存在: true
✅ 表结构修改成功

📊 检查测试数据...
找到 8 条测试评论
✅ 测试数据存在

🌳 楼中楼结构预览:
1. 这是一条主评论 (ID: 1)
   └─ 回复第一条评论 (ID: 3)
      └─ 回复的回复 (ID: 6)
   └─ 回复自己的评论 (ID: 4)
2. 这是另一条主评论 (ID: 2)
   └─ 回复第二条评论 (ID: 5)
3. 第三条主评论 (ID: 7)
   └─ 回复第三条评论 (ID: 8)

🎉 数据库验证完成！
```

## 🚀 第二步：启动服务器

### 2.1 启动后端服务

```bash
# 开发模式
npm run dev

# 或生产模式
npm start
```

**预期输出：**
```
Server is running on port 3000
Database connected successfully
```

### 2.2 验证服务器状态

访问以下地址确认服务正常：
- API 文档：http://localhost:3000/api-docs
- 健康检查：http://localhost:3000/api/health

## 🧪 第三步：功能测试

### 3.1 运行完整测试

```bash
node test-comment-system.js
```

**测试内容：**
1. ✅ 用户登录认证
2. ✅ 创建主评论和回复评论
3. ✅ 获取评论树结构
4. ✅ 获取平铺评论列表
5. ✅ 更新评论状态
6. ✅ 管理员查看所有评论
7. ✅ 删除评论（级联删除）

### 3.2 手动API测试

#### 测试评论树接口
```bash
curl "http://localhost:3000/api/comments/1/tree?status=approved&page=1&pageSize=10"
```

#### 测试创建评论
```bash
curl -X POST "http://localhost:3000/api/comments/1" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"content": "测试评论", "parentId": null}'
```

## 📊 第四步：验证功能

### 4.1 检查API响应格式

评论树接口应返回：
```json
{
  "code": 0,
  "message": "success",
  "data": [
    {
      "CommentID": 1,
      "Content": "主评论内容",
      "Status": "approved",
      "CanDelete": true,
      "User": {
        "UserID": 1,
        "DisplayName": "用户1"
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

### 4.2 验证楼中楼结构

- ✅ 主评论显示在最外层
- ✅ 回复评论嵌套在主评论下
- ✅ 支持多层级回复
- ✅ 分页基于根评论数量

### 4.3 验证权限控制

- ✅ 用户只能删除自己的评论
- ✅ 管理员可以删除任何评论
- ✅ 删除父评论会级联删除子评论

## 🔧 故障排除

### 数据库连接问题

```bash
# 检查数据库配置
node -e "console.log(require('./config/db').config)"
```

### 字段已存在错误

如果遇到 `CanDelete` 字段已存在：
```sql
-- 检查字段是否存在
SHOW COLUMNS FROM comments LIKE 'CanDelete';

-- 如果已存在，跳过添加步骤
```

### 测试数据重复

如果测试数据已存在：
```sql
-- 清空测试数据
DELETE FROM comments WHERE PostID = 1;

-- 重新执行迁移脚本
```

### 服务器启动失败

```bash
# 检查端口占用
netstat -ano | findstr :3000

# 检查日志
npm run dev 2>&1 | tee server.log
```

## 📝 部署检查清单

- [ ] 数据库迁移脚本执行成功
- [ ] 验证脚本显示所有检查项通过
- [ ] 服务器正常启动
- [ ] API 文档可访问
- [ ] 评论树接口返回正确格式
- [ ] 创建评论功能正常
- [ ] 删除评论功能正常
- [ ] 权限控制正常
- [ ] 楼中楼结构正确显示

## 🎯 完成标志

当看到以下输出时，表示部署成功：

```
🎉 所有测试完成！
✅ 登录成功，获取到token
✅ 主评论创建成功: 9
✅ 回复评论创建成功: 10
✅ 评论树获取成功
✅ 评论列表获取成功
✅ 评论状态更新成功
✅ 所有评论获取成功
✅ 评论删除成功
```

## 📞 技术支持

如果遇到问题，请检查：
1. 数据库连接配置
2. 服务器日志输出
3. API 响应状态码
4. 数据库表结构

---

**部署完成！** 🎉 评论系统现在支持楼中楼结构、自动审核、权限控制和级联删除功能。 