# 博客系统技术架构与API详解

## 目录
1. [项目技术概览](#项目技术概览)
2. [系统架构设计](#系统架构设计)
3. [数据库架构详解](#数据库架构详解)
4. [核心API模块详解](#核心API模块详解)
5. [中间件系统](#中间件系统)
6. [安全机制](#安全机制)
7. [性能优化策略](#性能优化策略)
8. [部署架构](#部署架构)

---

## 项目技术概览

### 技术栈总览
```
后端技术栈:
├── 运行环境: Node.js 18+
├── Web框架: Express.js 5.x
├── 数据库: MySQL 8.0
├── ORM: Sequelize 6.x
├── 身份认证: JWT + bcryptjs
├── 文件处理: Multer + Sharp
├── 邮件服务: Nodemailer
├── API文档: Swagger UI + JSDoc
├── 进程管理: PM2
└── 代理服务: Nginx
```

### 项目结构
```
backend/
├── config/              # 配置文件
│   ├── db.js           # 数据库连接配置
│   └── jwt.js          # JWT配置
├── controllers/         # 控制器层
│   ├── userController.js
│   ├── articleController.js
│   ├── commentController.js
│   └── ...
├── models/             # 数据模型层
│   ├── index.js        # 模型关联配置
│   ├── User.js
│   ├── Article.js
│   └── ...
├── routes/             # 路由层
│   ├── user.js
│   ├── article.js
│   └── ...
├── middleware/         # 中间件
│   ├── auth.js         # 身份认证
│   ├── permission.js   # 权限验证
│   ├── errorHandler.js # 错误处理
│   └── ...
├── utils/              # 工具函数
│   ├── logger.js       # 日志工具
│   └── mailer.js       # 邮件工具
└── uploads/            # 文件上传目录
```

---

## 系统架构设计

### 整体架构图
```
[前端应用] 
    ↓ HTTPS
[Nginx反向代理] 
    ↓ HTTP
[Node.js应用集群] (PM2管理)
    ↓ TCP
[MySQL数据库]
```

### 分层架构详解

#### 1. 表现层 (Presentation Layer)
- **职责**: 处理HTTP请求/响应，路由分发
- **组件**: Express.js 路由器
- **特点**: RESTful API设计，统一响应格式

```javascript
// 路由示例 - routes/article.js
const express = require('express');
const router = express.Router();
const articleController = require('../controllers/articleController');
const auth = require('../middleware/auth');

// GET /api/articles - 获取文章列表
router.get('/', articleController.getArticles);

// POST /api/articles - 创建文章
router.post('/', auth, articleController.createArticle);

// GET /api/articles/:id - 获取文章详情
router.get('/:id', articleController.getArticleById);

module.exports = router;
```

#### 2. 业务逻辑层 (Business Logic Layer)
- **职责**: 核心业务逻辑处理，数据验证
- **组件**: Controllers 控制器
- **特点**: 单一职责，业务规则集中

```javascript
// 控制器示例 - controllers/articleController.js
const { Article, Category, Tag, User } = require('../models');
const { validationResult } = require('express-validator');

exports.createArticle = async (req, res) => {
  try {
    // 1. 参数验证
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        code: 1,
        message: '参数错误',
        errors: errors.array()
      });
    }

    // 2. 业务逻辑处理
    const { title, content, slug, categoryIds, tagIds } = req.body;
    const userId = req.user.id;

    // 3. 数据库操作
    const article = await Article.create({
      Title: title,
      Content: content,
      Slug: slug,
      UserID: userId,
      Status: 'draft'
    });

    // 4. 关联数据处理
    if (categoryIds && categoryIds.length > 0) {
      await article.setCategories(categoryIds);
    }
    if (tagIds && tagIds.length > 0) {
      await article.setTags(tagIds);
    }

    // 5. 返回结果
    res.status(201).json({
      code: 0,
      message: '文章创建成功',
      data: article
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      error: error.message
    });
  }
};
```

#### 3. 数据访问层 (Data Access Layer)
- **职责**: 数据库操作，数据模型定义
- **组件**: Sequelize Models
- **特点**: ORM映射，关联关系管理

```javascript
// 数据模型示例 - models/Article.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Article = sequelize.define('Article', {
  PostID: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  Title: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 200]
    }
  },
  Content: {
    type: DataTypes.TEXT('long'),
    allowNull: false
  },
  Slug: {
    type: DataTypes.STRING(200),
    allowNull: false,
    unique: true,
    validate: {
      is: /^[a-z0-9-]+$/i // 只允许字母、数字、连字符
    }
  },
  Status: {
    type: DataTypes.ENUM('draft', 'published', 'archived'),
    defaultValue: 'draft'
  },
  ViewCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'posts',
  timestamps: true,
  createdAt: 'CreatedAt',
  updatedAt: 'UpdatedAt'
});

module.exports = Article;
```

---

## 数据库架构详解

### 核心表设计

#### 1. 用户系统
```sql
-- 用户表
CREATE TABLE users (
  UserID INT PRIMARY KEY AUTO_INCREMENT,
  Username VARCHAR(50) UNIQUE NOT NULL,
  Email VARCHAR(100) UNIQUE NOT NULL,
  PhoneNumber VARCHAR(20) UNIQUE,
  PasswordHash VARCHAR(255) NOT NULL,
  DisplayName VARCHAR(100),
  Bio TEXT,
  AvatarURL VARCHAR(255),
  IsActive BOOLEAN DEFAULT TRUE,
  CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_username (Username),
  INDEX idx_email (Email),
  INDEX idx_phone (PhoneNumber)
);

-- 角色表
CREATE TABLE roles (
  RoleID INT PRIMARY KEY AUTO_INCREMENT,
  Name VARCHAR(50) UNIQUE NOT NULL,
  Description TEXT,
  CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 用户角色关联表 (多对多)
CREATE TABLE userroles (
  UserID INT,
  RoleID INT,
  CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (UserID, RoleID),
  FOREIGN KEY (UserID) REFERENCES users(UserID) ON DELETE CASCADE,
  FOREIGN KEY (RoleID) REFERENCES roles(RoleID) ON DELETE CASCADE
);
```

#### 2. 内容系统
```sql
-- 文章表
CREATE TABLE posts (
  PostID INT PRIMARY KEY AUTO_INCREMENT,
  Title VARCHAR(200) NOT NULL,
  Content LONGTEXT NOT NULL,
  Slug VARCHAR(200) UNIQUE NOT NULL,
  Excerpt TEXT,
  Status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
  FeaturedImageURL VARCHAR(255),
  ViewCount INT DEFAULT 0,
  UserID INT NOT NULL,
  PublishedAt TIMESTAMP NULL,
  CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_user_status (UserID, Status),
  INDEX idx_status_published (Status, PublishedAt),
  INDEX idx_slug (Slug),
  FOREIGN KEY (UserID) REFERENCES users(UserID) ON DELETE CASCADE
);

-- 分类表 (支持层级结构)
CREATE TABLE categories (
  CategoryID INT PRIMARY KEY AUTO_INCREMENT,
  Name VARCHAR(100) NOT NULL,
  Description TEXT,
  ParentCategoryID INT DEFAULT NULL,
  Slug VARCHAR(100) UNIQUE NOT NULL,
  CreatedBy INT NOT NULL,
  CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_parent (ParentCategoryID),
  INDEX idx_slug (Slug),
  FOREIGN KEY (ParentCategoryID) REFERENCES categories(CategoryID) ON DELETE SET NULL,
  FOREIGN KEY (CreatedBy) REFERENCES users(UserID) ON DELETE CASCADE
);

-- 标签表
CREATE TABLE tags (
  TagID INT PRIMARY KEY AUTO_INCREMENT,
  Name VARCHAR(50) UNIQUE NOT NULL,
  Description TEXT,
  CreatedBy INT NOT NULL,
  CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_name (Name),
  FOREIGN KEY (CreatedBy) REFERENCES users(UserID) ON DELETE CASCADE
);

-- 文章分类关联表
CREATE TABLE PostCategories (
  PostID INT,
  CategoryID INT,
  PRIMARY KEY (PostID, CategoryID),
  FOREIGN KEY (PostID) REFERENCES posts(PostID) ON DELETE CASCADE,
  FOREIGN KEY (CategoryID) REFERENCES categories(CategoryID) ON DELETE CASCADE
);

-- 文章标签关联表
CREATE TABLE PostTags (
  PostID INT,
  TagID INT,
  PRIMARY KEY (PostID, TagID),
  FOREIGN KEY (PostID) REFERENCES posts(PostID) ON DELETE CASCADE,
  FOREIGN KEY (TagID) REFERENCES tags(TagID) ON DELETE CASCADE
);
```

#### 3. 评论系统
```sql
-- 评论表 (支持楼中楼)
CREATE TABLE comments (
  CommentID INT PRIMARY KEY AUTO_INCREMENT,
  PostID INT NOT NULL,
  UserID INT NOT NULL,
  ParentCommentID INT DEFAULT NULL,
  Content TEXT NOT NULL,
  Status ENUM('approved', 'pending', 'blocked') DEFAULT 'approved',
  CanDelete BOOLEAN DEFAULT TRUE,
  CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_post_parent (PostID, ParentCommentID),
  INDEX idx_user (UserID),
  INDEX idx_status (Status),
  FOREIGN KEY (PostID) REFERENCES posts(PostID) ON DELETE CASCADE,
  FOREIGN KEY (UserID) REFERENCES users(UserID) ON DELETE CASCADE,
  FOREIGN KEY (ParentCommentID) REFERENCES comments(CommentID) ON DELETE CASCADE
);
```

### 数据库关联关系

```javascript
// models/index.js - 关联关系配置
const sequelize = require('../config/db');
const User = require('./User');
const Role = require('./Role');
const Article = require('./Article');
const Comment = require('./Comment');
const Category = require('./Category');
const Tag = require('./Tag');

// 用户-角色 多对多关联
const UserRole = sequelize.define('UserRole', {}, { 
  tableName: 'userroles', 
  timestamps: false 
});
User.belongsToMany(Role, { through: UserRole, foreignKey: 'UserID' });
Role.belongsToMany(User, { through: UserRole, foreignKey: 'RoleID' });

// 文章-用户 一对多关联
Article.belongsTo(User, { foreignKey: 'UserID' });
User.hasMany(Article, { foreignKey: 'UserID' });

// 评论关联
Comment.belongsTo(User, { foreignKey: 'UserID' });
Comment.belongsTo(Article, { foreignKey: 'PostID' });
Comment.belongsTo(Comment, { as: 'Parent', foreignKey: 'ParentCommentID' });
Article.hasMany(Comment, { foreignKey: 'PostID' });

// 文章-分类 多对多关联
const PostCategory = sequelize.define('PostCategory', {}, { 
  tableName: 'PostCategories', 
  timestamps: false 
});
Article.belongsToMany(Category, { through: PostCategory, foreignKey: 'PostID' });
Category.belongsToMany(Article, { through: PostCategory, foreignKey: 'CategoryID' });

// 文章-标签 多对多关联
const PostTag = sequelize.define('PostTag', {}, { 
  tableName: 'PostTags', 
  timestamps: false 
});
Article.belongsToMany(Tag, { through: PostTag, foreignKey: 'PostID' });
Tag.belongsToMany(Article, { through: PostTag, foreignKey: 'TagID' });
```

---

## 核心API模块详解

### 1. 用户认证模块

#### 注册流程
```javascript
// controllers/userController.js
exports.register = async (req, res) => {
  try {
    const { username, email, password, phoneNumber } = req.body;
    
    // 1. 检查用户是否已存在
    const existUsername = await User.findOne({ where: { Username: username } });
    if (existUsername) {
      return res.status(400).json({ code: 1, message: '用户名已存在' });
    }
    
    const existEmail = await User.findOne({ where: { Email: email } });
    if (existEmail) {
      return res.status(400).json({ code: 1, message: '邮箱已存在' });
    }
    
    // 2. 密码加密
    const hash = await bcrypt.hash(password, 10);
    
    // 3. 创建用户
    const user = await User.create({
      Username: username,
      Email: email,
      PasswordHash: hash,
      PhoneNumber: phoneNumber
    });
    
    // 4. 分配默认角色
    await user.setRoles([4]); // 默认subscriber角色
    
    // 5. 记录操作日志
    await logOperation(
      user.UserID,
      'user',
      'register',
      '用户注册',
      { username, email },
      req.ip,
      req.get('User-Agent')
    );
    
    res.status(201).json({
      code: 0,
      message: '注册成功',
      data: {
        UserID: user.UserID,
        Username: user.Username,
        Email: user.Email
      }
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({ code: 500, message: '注册失败' });
  }
};
```

#### 登录流程
```javascript
exports.login = async (req, res) => {
  try {
    const { email, username, phoneNumber, password } = req.body;
    
    // 1. 查找用户 (支持多种登录方式)
    let whereClause = {};
    if (email) whereClause.Email = email;
    else if (username) whereClause.Username = username;
    else if (phoneNumber) whereClause.PhoneNumber = phoneNumber;
    
    const user = await User.findOne({
      where: whereClause,
      include: [{
        model: Role,
        attributes: ['Name']
      }]
    });
    
    if (!user) {
      return res.status(400).json({ code: 1, message: '用户不存在' });
    }
    
    // 2. 验证密码
    const isValidPassword = await bcrypt.compare(password, user.PasswordHash);
    if (!isValidPassword) {
      return res.status(400).json({ code: 1, message: '密码错误' });
    }
    
    // 3. 检查用户状态
    if (!user.IsActive) {
      return res.status(400).json({ code: 1, message: '账户已被禁用' });
    }
    
    // 4. 生成JWT Token
    const roles = user.Roles.map(role => role.Name);
    const token = jwt.sign(
      {
        userId: user.UserID,
        username: user.Username,
        email: user.Email,
        roles: roles
      },
      jwtConfig.secret,
      { expiresIn: jwtConfig.expiresIn }
    );
    
    // 5. 更新最后登录时间
    await user.update({ LastLogin: new Date() });
    
    // 6. 记录登录日志
    await logOperation(
      user.UserID,
      'user',
      'login',
      '用户登录',
      { loginMethod: email ? 'email' : username ? 'username' : 'phone' },
      req.ip,
      req.get('User-Agent')
    );
    
    res.json({
      code: 0,
      message: '登录成功',
      data: { token }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ code: 500, message: '登录失败' });
  }
};
```

### 2. 文章管理模块

#### 文章列表查询
```javascript
// controllers/articleController.js
exports.getArticles = async (req, res) => {
  try {
    const {
      page = 1,
      pageSize = 10,
      keyword,
      status = 'published',
      categories,
      tags,
      categoryMode = 'any',
      tagMode = 'any',
      fields,
      include = 'categories,tags,user',
      sort
    } = req.query;

    // 1. 构建查询条件
    let whereClause = {};
    
    // 状态筛选
    if (status) {
      whereClause.Status = status;
    }
    
    // 关键词搜索
    if (keyword) {
      whereClause[Op.or] = [
        { Title: { [Op.like]: `%${keyword}%` } },
        { Excerpt: { [Op.like]: `%${keyword}%` } }
      ];
    }

    // 2. 字段投影
    let attributesOption;
    if (fields) {
      const requestedFields = fields.split(',').map(s => s.trim());
      attributesOption = requestedFields.includes('PostID') ? 
        requestedFields : ['PostID', ...requestedFields];
    } else {
      // 默认字段，排除大字段
      attributesOption = [
        'PostID', 'Title', 'Excerpt', 'Slug', 'Status', 
        'FeaturedImageURL', 'PublishedAt', 'CreatedAt', 
        'UpdatedAt', 'ViewCount', 'UserID'
      ];
    }

    // 3. 构建Include关联
    const includeOptions = [];
    const includeList = include.split(',').map(s => s.trim());
    
    if (includeList.includes('categories')) {
      includeOptions.push({
        model: Category,
        attributes: ['CategoryID', 'Name', 'Slug'],
        through: { attributes: [] }
      });
    }
    
    if (includeList.includes('tags')) {
      includeOptions.push({
        model: Tag,
        attributes: ['TagID', 'Name'],
        through: { attributes: [] }
      });
    }
    
    if (includeList.includes('user')) {
      includeOptions.push({
        model: User,
        attributes: ['UserID', 'Username', 'DisplayName', 'AvatarURL']
      });
    }

    // 4. 分类标签筛选
    if (categories) {
      const categoryIds = categories.split(',').map(id => parseInt(id, 10));
      // 根据categoryMode决定查询策略
      if (categoryMode === 'all') {
        // 必须包含所有指定分类
        const categoryFilter = await sequelize.query(`
          SELECT PostID FROM PostCategories 
          WHERE CategoryID IN (${categoryIds.join(',')})
          GROUP BY PostID 
          HAVING COUNT(DISTINCT CategoryID) = ${categoryIds.length}
        `);
        const postIds = categoryFilter[0].map(row => row.PostID);
        whereClause.PostID = { [Op.in]: postIds };
      } else {
        // 包含任一分类即可
        includeOptions.push({
          model: Category,
          where: { CategoryID: { [Op.in]: categoryIds } },
          required: true,
          through: { attributes: [] }
        });
      }
    }

    // 5. 排序处理
    let orderClause = [['CreatedAt', 'DESC']]; // 默认排序
    if (sort) {
      const sortPairs = sort.split(',').map(s => {
        const [field, direction = 'ASC'] = s.split(':');
        return [field, direction.toUpperCase()];
      });
      orderClause = sortPairs;
    }

    // 6. 执行查询
    const { count, rows } = await Article.findAndCountAll({
      where: whereClause,
      attributes: attributesOption,
      include: includeOptions,
      limit: parseInt(pageSize, 10),
      offset: (parseInt(page, 10) - 1) * parseInt(pageSize, 10),
      order: orderClause,
      distinct: true // 防止关联查询导致的重复计数
    });

    res.json({
      code: 0,
      data: {
        list: rows,
        total: count,
        page: parseInt(page, 10),
        pageSize: parseInt(pageSize, 10)
      }
    });
  } catch (error) {
    console.error('获取文章列表错误:', error);
    res.status(500).json({ code: 500, message: '获取文章列表失败' });
  }
};
```

#### 文章创建
```javascript
exports.createArticle = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { title, content, slug, excerpt, status, categoryIds, tagIds } = req.body;
    const userId = req.user.userId;

    // 1. 创建文章
    const article = await Article.create({
      Title: title,
      Content: content,
      Slug: slug,
      Excerpt: excerpt || generateExcerpt(content),
      Status: status || 'draft',
      UserID: userId,
      PublishedAt: status === 'published' ? new Date() : null
    }, { transaction });

    // 2. 处理分类关联
    if (categoryIds && categoryIds.length > 0) {
      await article.setCategories(categoryIds, { transaction });
    }

    // 3. 处理标签关联
    if (tagIds && tagIds.length > 0) {
      await article.setTags(tagIds, { transaction });
    }

    // 4. 创建文章修订记录
    await PostRevision.create({
      PostID: article.PostID,
      Content: content,
      UserID: userId
    }, { transaction });

    // 5. 记录操作日志
    await logOperation(
      userId,
      'article',
      'create',
      '创建文章',
      { articleId: article.PostID, title },
      req.ip,
      req.get('User-Agent'),
      transaction
    );

    await transaction.commit();

    // 6. 重新查询包含关联数据的文章
    const articleWithRelations = await Article.findByPk(article.PostID, {
      include: [
        { model: Category, attributes: ['CategoryID', 'Name'] },
        { model: Tag, attributes: ['TagID', 'Name'] },
        { model: User, attributes: ['UserID', 'Username', 'DisplayName'] }
      ]
    });

    res.status(201).json({
      code: 0,
      message: '文章创建成功',
      data: articleWithRelations
    });
  } catch (error) {
    await transaction.rollback();
    console.error('创建文章错误:', error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      res.status(400).json({ code: 1, message: '文章别名已存在' });
    } else {
      res.status(500).json({ code: 500, message: '创建文章失败' });
    }
  }
};

// 生成文章摘要
function generateExcerpt(content, maxLength = 200) {
  // 移除Markdown标记
  const plainText = content
    .replace(/#{1,6}\s+/g, '') // 移除标题标记
    .replace(/\*\*(.*?)\*\*/g, '$1') // 移除粗体标记
    .replace(/\*(.*?)\*/g, '$1') // 移除斜体标记
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // 移除链接，保留文本
    .replace(/```[\s\S]*?```/g, '') // 移除代码块
    .replace(/`([^`]+)`/g, '$1') // 移除行内代码标记
    .trim();
  
  return plainText.length > maxLength ? 
    plainText.substring(0, maxLength) + '...' : plainText;
}
```

### 3. 评论系统模块

#### 楼中楼评论实现
```javascript
// controllers/commentController.js
exports.getCommentsTree = async (req, res) => {
  try {
    const { postId } = req.params;
    const { page = 1, pageSize = 20 } = req.query;

    // 1. 获取所有评论 (平铺结构)
    const comments = await Comment.findAll({
      where: { 
        PostID: postId,
        Status: 'approved'
      },
      include: [{
        model: User,
        attributes: ['UserID', 'Username', 'DisplayName', 'AvatarURL']
      }],
      order: [['CreatedAt', 'ASC']]
    });

    // 2. 构建评论树
    const commentTree = buildCommentTree(comments);

    // 3. 分页处理 (对顶级评论分页)
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + parseInt(pageSize);
    const paginatedComments = commentTree.slice(startIndex, endIndex);

    res.json({
      code: 0,
      data: {
        list: paginatedComments,
        total: commentTree.length,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (error) {
    console.error('获取评论错误:', error);
    res.status(500).json({ code: 500, message: '获取评论失败' });
  }
};

// 构建评论树结构
function buildCommentTree(comments) {
  const commentMap = new Map();
  const rootComments = [];

  // 1. 创建评论映射
  comments.forEach(comment => {
    commentMap.set(comment.CommentID, {
      ...comment.toJSON(),
      children: []
    });
  });

  // 2. 构建父子关系
  comments.forEach(comment => {
    const commentNode = commentMap.get(comment.CommentID);
    
    if (comment.ParentCommentID) {
      // 子评论
      const parent = commentMap.get(comment.ParentCommentID);
      if (parent) {
        parent.children.push(commentNode);
      }
    } else {
      // 顶级评论
      rootComments.push(commentNode);
    }
  });

  return rootComments;
}

// 创建评论
exports.createComment = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { postId } = req.params;
    const { content, parentCommentId } = req.body;
    const userId = req.user.userId;

    // 1. 验证文章是否存在
    const article = await Article.findByPk(postId);
    if (!article) {
      return res.status(404).json({ code: 404, message: '文章不存在' });
    }

    // 2. 验证父评论 (如果是回复)
    if (parentCommentId) {
      const parentComment = await Comment.findOne({
        where: { 
          CommentID: parentCommentId,
          PostID: postId
        }
      });
      if (!parentComment) {
        return res.status(400).json({ code: 1, message: '父评论不存在' });
      }
    }

    // 3. 创建评论
    const comment = await Comment.create({
      PostID: postId,
      UserID: userId,
      ParentCommentID: parentCommentId || null,
      Content: content,
      Status: 'approved' // 可以改为 'pending' 需要审核
    }, { transaction });

    // 4. 记录操作日志
    await logOperation(
      userId,
      'comment',
      'create',
      '发表评论',
      { 
        commentId: comment.CommentID, 
        postId,
        isReply: !!parentCommentId
      },
      req.ip,
      req.get('User-Agent'),
      transaction
    );

    await transaction.commit();

    // 5. 返回包含用户信息的评论
    const commentWithUser = await Comment.findByPk(comment.CommentID, {
      include: [{
        model: User,
        attributes: ['UserID', 'Username', 'DisplayName', 'AvatarURL']
      }]
    });

    res.status(201).json({
      code: 0,
      message: '评论创建成功',
      data: commentWithUser
    });

    // 6. 异步发送通知 (不阻塞响应)
    sendCommentNotification(comment, article, parentCommentId);
    
  } catch (error) {
    await transaction.rollback();
    console.error('创建评论错误:', error);
    res.status(500).json({ code: 500, message: '创建评论失败' });
  }
};

// 发送评论通知
async function sendCommentNotification(comment, article, parentCommentId) {
  try {
    const mailer = require('../utils/mailer');
    
    if (parentCommentId) {
      // 回复通知
      const parentComment = await Comment.findByPk(parentCommentId, {
        include: [{ model: User, attributes: ['Email', 'Username'] }]
      });
      
      if (parentComment && parentComment.User.Email) {
        await mailer.sendMail({
          to: parentComment.User.Email,
          subject: '有人回复了你的评论',
          html: `
            <p>你好 ${parentComment.User.Username}，</p>
            <p>有人回复了你在文章《${article.Title}》中的评论。</p>
            <p>回复内容：${comment.Content}</p>
            <p><a href="${process.env.FRONTEND_URL}/articles/${article.Slug}">查看详情</a></p>
          `
        });
      }
    } else {
      // 文章评论通知
      const author = await User.findByPk(article.UserID);
      if (author && author.Email) {
        await mailer.sendMail({
          to: author.Email,
          subject: '有人评论了你的文章',
          html: `
            <p>你好 ${author.Username}，</p>
            <p>有人评论了你的文章《${article.Title}》。</p>
            <p>评论内容：${comment.Content}</p>
            <p><a href="${process.env.FRONTEND_URL}/articles/${article.Slug}">查看详情</a></p>
          `
        });
      }
    }
  } catch (error) {
    console.error('发送评论通知失败:', error);
  }
}
```

---

## 中间件系统

### 1. 身份认证中间件
```javascript
// middleware/auth.js
const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');
const { User, Role } = require('../models');

module.exports = async (req, res, next) => {
  try {
    // 1. 获取Token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        code: 401, 
        message: '未提供认证Token' 
      });
    }

    const token = authHeader.substring(7); // 移除 'Bearer ' 前缀

    // 2. 验证Token
    let decoded;
    try {
      decoded = jwt.verify(token, jwtConfig.secret);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          code: 401, 
          message: 'Token已过期' 
        });
      } else if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ 
          code: 401, 
          message: 'Token无效' 
        });
      }
      throw error;
    }

    // 3. 验证用户是否存在且活跃
    const user = await User.findByPk(decoded.userId, {
      include: [{
        model: Role,
        attributes: ['Name']
      }]
    });

    if (!user) {
      return res.status(401).json({ 
        code: 401, 
        message: '用户不存在' 
      });
    }

    if (!user.IsActive) {
      return res.status(401).json({ 
        code: 401, 
        message: '账户已被禁用' 
      });
    }

    // 4. 将用户信息添加到请求对象
    req.user = {
      userId: user.UserID,
      username: user.Username,
      email: user.Email,
      roles: user.Roles.map(role => role.Name),
      isActive: user.IsActive
    };

    next();
  } catch (error) {
    console.error('认证错误:', error);
    res.status(500).json({ 
      code: 500, 
      message: '认证服务器错误' 
    });
  }
};
```

### 2. 权限验证中间件
```javascript
// middleware/permission.js
const permission = {
  // 检查是否为管理员
  isAdmin: (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ code: 401, message: '请先登录' });
    }
    
    if (!req.user.roles.includes('admin')) {
      return res.status(403).json({ code: 403, message: '需要管理员权限' });
    }
    
    next();
  },

  // 检查是否为编辑或管理员
  isEditorOrAdmin: (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ code: 401, message: '请先登录' });
    }
    
    const hasPermission = req.user.roles.some(role => 
      ['admin', 'editor'].includes(role)
    );
    
    if (!hasPermission) {
      return res.status(403).json({ code: 403, message: '需要编辑或管理员权限' });
    }
    
    next();
  },

  // 检查是否为作者、编辑或管理员
  isAuthorOrAdmin: (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ code: 401, message: '请先登录' });
    }
    
    const hasPermission = req.user.roles.some(role => 
      ['admin', 'editor', 'author'].includes(role)
    );
    
    if (!hasPermission) {
      return res.status(403).json({ code: 403, message: '需要作者权限' });
    }
    
    next();
  },

  // 检查资源所有权 (用于文章、评论等)
  checkOwnership: (model, idParam = 'id', userIdField = 'UserID') => {
    return async (req, res, next) => {
      try {
        if (!req.user) {
          return res.status(401).json({ code: 401, message: '请先登录' });
        }

        // 管理员跳过所有权检查
        if (req.user.roles.includes('admin')) {
          return next();
        }

        const resourceId = req.params[idParam];
        const resource = await model.findByPk(resourceId);

        if (!resource) {
          return res.status(404).json({ code: 404, message: '资源不存在' });
        }

        if (resource[userIdField] !== req.user.userId) {
          return res.status(403).json({ code: 403, message: '无权操作该资源' });
        }

        req.resource = resource; // 将资源添加到请求对象
        next();
      } catch (error) {
        console.error('权限检查错误:', error);
        res.status(500).json({ code: 500, message: '权限检查失败' });
      }
    };
  }
};

module.exports = permission;
```

### 3. 错误处理中间件
```javascript
// middleware/errorHandler.js
const { ValidationError, UniqueConstraintError } = require('sequelize');

module.exports = (error, req, res, next) => {
  console.error('错误详情:', error);

  // Sequelize 验证错误
  if (error instanceof ValidationError) {
    return res.status(400).json({
      code: 1,
      message: '数据验证失败',
      errors: error.errors.map(err => ({
        field: err.path,
        message: err.message,
        value: err.value
      }))
    });
  }

  // Sequelize 唯一约束错误
  if (error instanceof UniqueConstraintError) {
    const field = error.errors[0].path;
    return res.status(400).json({
      code: 1,
      message: `${field} 已存在`,
      field: field
    });
  }

  // JWT 相关错误
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      code: 401,
      message: '无效的Token'
    });
  }

  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      code: 401,
      message: 'Token已过期'
    });
  }

  // 文件上传错误
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      code: 1,
      message: '文件大小超出限制'
    });
  }

  if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      code: 1,
      message: '不支持的文件类型'
    });
  }

  // 默认服务器错误
  res.status(500).json({
    code: 500,
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
};
```

### 4. 响应格式化中间件
```javascript
// middleware/responseFormat.js
module.exports = (req, res, next) => {
  // 成功响应的封装方法
  res.success = (data = null, message = '操作成功', code = 0) => {
    res.json({
      code,
      message,
      data,
      timestamp: new Date().toISOString(),
      path: req.path
    });
  };

  // 分页响应的封装方法
  res.paginate = (list, total, page, pageSize, message = '获取成功') => {
    res.json({
      code: 0,
      message,
      data: {
        list,
        pagination: {
          total,
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          totalPages: Math.ceil(total / pageSize)
        }
      },
      timestamp: new Date().toISOString(),
      path: req.path
    });
  };

  // 错误响应的封装方法
  res.error = (message = '操作失败', code = 1, errors = null) => {
    res.status(400).json({
      code,
      message,
      errors,
      timestamp: new Date().toISOString(),
      path: req.path
    });
  };

  next();
};
```

### 5. 请求日志中间件
```javascript
// middleware/requestLogger.js
const { v4: uuidv4 } = require('uuid');

module.exports = (req, res, next) => {
  // 为每个请求生成唯一ID
  req.requestId = uuidv4();
  
  const startTime = Date.now();
  
  // 记录请求开始
  console.log(`[${req.requestId}] ${req.method} ${req.path} - 开始处理`);
  console.log(`[${req.requestId}] IP: ${req.ip}, User-Agent: ${req.get('User-Agent')}`);
  
  if (req.body && Object.keys(req.body).length > 0) {
    // 过滤敏感信息
    const logBody = { ...req.body };
    if (logBody.password) logBody.password = '***';
    if (logBody.newPassword) logBody.newPassword = '***';
    console.log(`[${req.requestId}] Body:`, JSON.stringify(logBody));
  }

  // 监听响应结束
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    console.log(`[${req.requestId}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
  });

  next();
};
```

---

## 安全机制

### 1. 输入验证与清理
```javascript
// middleware/validation.js
const { body, query, param } = require('express-validator');
const validator = require('validator');

const userValidation = {
  // 用户注册验证
  register: [
    body('username')
      .trim()
      .isLength({ min: 3, max: 20 })
      .withMessage('用户名长度必须在3-20个字符之间')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('用户名只能包含字母、数字和下划线'),
    
    body('email')
      .isEmail()
      .withMessage('邮箱格式不正确')
      .normalizeEmail(),
    
    body('password')
      .isLength({ min: 6, max: 30 })
      .withMessage('密码长度必须在6-30个字符之间')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('密码必须包含大小写字母和数字'),
    
    body('phoneNumber')
      .optional()
      .isMobilePhone('zh-CN')
      .withMessage('手机号格式不正确')
  ],

  // 登录验证
  login: [
    body('password')
      .notEmpty()
      .withMessage('密码不能为空'),
    
    // 自定义验证：必须提供email、username或phoneNumber之一
    body().custom((value, { req }) => {
      const { email, username, phoneNumber } = req.body;
      if (!email && !username && !phoneNumber) {
        throw new Error('必须提供邮箱、用户名或手机号之一');
      }
      return true;
    })
  ]
};

const articleValidation = {
  // 文章创建验证
  create: [
    body('title')
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage('标题长度必须在1-200个字符之间')
      .escape(), // 转义HTML字符
    
    body('content')
      .trim()
      .isLength({ min: 1 })
      .withMessage('内容不能为空'),
    
    body('slug')
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage('别名长度必须在1-200个字符之间')
      .matches(/^[a-z0-9-]+$/)
      .withMessage('别名只能包含小写字母、数字和连字符'),
    
    body('status')
      .optional()
      .isIn(['draft', 'published', 'archived'])
      .withMessage('状态值无效'),
    
    body('categoryIds')
      .optional()
      .isArray()
      .withMessage('分类ID必须是数组')
      .custom((value) => {
        if (value.some(id => !Number.isInteger(Number(id)))) {
          throw new Error('分类ID必须是整数');
        }
        return true;
      })
  ]
};

module.exports = {
  userValidation,
  articleValidation
};
```

### 2. SQL注入防护
```javascript
// 使用Sequelize ORM自动防护SQL注入
const { Op } = require('sequelize');

// 错误示例 - 直接拼接SQL (容易受到SQL注入攻击)
// const sql = `SELECT * FROM users WHERE username = '${username}'`;

// 正确示例 - 使用Sequelize参数化查询
const user = await User.findOne({
  where: {
    username: username // Sequelize自动转义
  }
});

// 复杂查询示例
const articles = await Article.findAll({
  where: {
    [Op.or]: [
      { title: { [Op.like]: `%${keyword}%` } },
      { content: { [Op.like]: `%${keyword}%` } }
    ],
    status: 'published',
    createdAt: {
      [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30天内
    }
  }
});

// 原生查询必须使用参数绑定
const results = await sequelize.query(
  'SELECT * FROM posts WHERE title LIKE :search AND status = :status',
  {
    replacements: { search: `%${keyword}%`, status: 'published' },
    type: QueryTypes.SELECT
  }
);
```

### 3. XSS防护
```javascript
// utils/sanitizer.js
const DOMPurify = require('isomorphic-dompurify');
const validator = require('validator');

class Sanitizer {
  // 清理HTML内容
  static sanitizeHtml(html) {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a', 'img'],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'title'],
      ALLOW_DATA_ATTR: false
    });
  }

  // 转义用户输入
  static escapeInput(input) {
    return validator.escape(input);
  }

  // 清理Markdown内容
  static sanitizeMarkdown(markdown) {
    // 移除潜在的XSS攻击代码
    return markdown
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // 移除script标签
      .replace(/javascript:/gi, '') // 移除javascript协议
      .replace(/on\w+\s*=/gi, ''); // 移除事件处理器
  }

  // 验证URL安全性
  static isUrlSafe(url) {
    try {
      const parsedUrl = new URL(url);
      // 只允许http和https协议
      return ['http:', 'https:'].includes(parsedUrl.protocol);
    } catch {
      return false;
    }
  }
}

module.exports = Sanitizer;

// 在控制器中使用
exports.createArticle = async (req, res) => {
  const { title, content } = req.body;
  
  const sanitizedTitle = Sanitizer.escapeInput(title);
  const sanitizedContent = Sanitizer.sanitizeMarkdown(content);
  
  // 创建文章...
};
```

### 4. CSRF防护
```javascript
// middleware/csrf.js
const csrf = require('csurf');

// CSRF保护中间件 (仅在需要时启用)
const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  }
});

// 为需要CSRF保护的路由提供Token
const provideCsrfToken = (req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  next();
};

module.exports = {
  csrfProtection,
  provideCsrfToken
};

// 在Express应用中使用
app.use('/api/admin', csrfProtection); // 仅管理员接口需要CSRF保护
```

### 5. 速率限制
```javascript
// middleware/rateLimit.js
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const redis = require('redis');

const redisClient = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379
});

// 通用速率限制
const generalLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient
  }),
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 每个IP最多100次请求
  message: {
    code: 429,
    message: '请求过于频繁，请稍后再试'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// 登录接口特殊限制
const loginLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient
  }),
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 5, // 每个IP最多5次登录尝试
  message: {
    code: 429,
    message: '登录尝试过于频繁，请15分钟后再试'
  },
  skipSuccessfulRequests: true // 成功登录不计入限制
});

// 创建内容的限制
const createLimiter = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 10, // 每分钟最多创建10个内容
  message: {
    code: 429,
    message: '创建内容过于频繁，请稍后再试'
  }
});

module.exports = {
  generalLimiter,
  loginLimiter,
  createLimiter
};

// 在路由中使用
app.use('/api', generalLimiter);
app.use('/api/users/login', loginLimiter);
app.use('/api/articles', createLimiter);
```

---

## 性能优化策略

### 1. 数据库查询优化
```javascript
// 优化后的文章列表查询
exports.getArticles = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, keyword, categories } = req.query;
    
    // 1. 字段投影 - 只查询需要的字段
    const attributes = [
      'PostID', 'Title', 'Excerpt', 'Slug', 'Status',
      'FeaturedImageURL', 'PublishedAt', 'ViewCount'
    ];
    
    // 2. 构建优化的查询条件
    let whereClause = { Status: 'published' };
    
    if (keyword) {
      // 使用全文搜索索引 (需要在数据库中创建)
      whereClause[Op.or] = [
        sequelize.literal(`MATCH(Title, Excerpt) AGAINST('${keyword}' IN NATURAL LANGUAGE MODE)`)
      ];
    }
    
    // 3. 使用Include优化关联查询
    const includeOptions = [
      {
        model: User,
        attributes: ['UserID', 'Username', 'DisplayName'],
        required: true
      },
      {
        model: Category,
        attributes: ['CategoryID', 'Name', 'Slug'],
        through: { attributes: [] }, // 不查询中间表字段
        required: false
      }
    ];
    
    // 4. 如果有分类筛选，优化查询
    if (categories) {
      const categoryIds = categories.split(',').map(id => parseInt(id));
      includeOptions[1].where = { CategoryID: { [Op.in]: categoryIds } };
      includeOptions[1].required = true;
    }
    
    // 5. 执行分页查询
    const { count, rows } = await Article.findAndCountAll({
      attributes,
      where: whereClause,
      include: includeOptions,
      limit: parseInt(pageSize),
      offset: (parseInt(page) - 1) * parseInt(pageSize),
      order: [['PublishedAt', 'DESC']],
      distinct: true // 避免JOIN导致的重复计数
    });
    
    res.json({
      code: 0,
      data: {
        list: rows,
        total: count,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (error) {
    console.error('查询错误:', error);
    res.status(500).json({ code: 500, message: '查询失败' });
  }
};

// 数据库索引建议
/*
-- 创建复合索引
CREATE INDEX idx_posts_status_published ON posts (Status, PublishedAt);
CREATE INDEX idx_posts_user_status ON posts (UserID, Status);

-- 创建全文搜索索引
CREATE FULLTEXT INDEX idx_posts_fulltext ON posts (Title, Excerpt);

-- 分类关联表索引
CREATE INDEX idx_postcategories_post ON PostCategories (PostID);
CREATE INDEX idx_postcategories_category ON PostCategories (CategoryID);
*/
```

### 2. Redis缓存策略
```javascript
// utils/cache.js
const redis = require('redis');
const client = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379
});

class Cache {
  // 缓存文章详情
  static async getArticle(articleId) {
    const cacheKey = `article:${articleId}`;
    
    try {
      const cached = await client.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
      
      // 从数据库查询
      const article = await Article.findByPk(articleId, {
        include: [
          { model: User, attributes: ['Username', 'DisplayName'] },
          { model: Category, attributes: ['Name', 'Slug'] },
          { model: Tag, attributes: ['Name'] }
        ]
      });
      
      if (article) {
        // 缓存1小时
        await client.setex(cacheKey, 3600, JSON.stringify(article));
      }
      
      return article;
    } catch (error) {
      console.error('缓存错误:', error);
      // 缓存失败时直接从数据库查询
      return await Article.findByPk(articleId);
    }
  }
  
  // 缓存文章列表
  static async getArticleList(cacheKey, queryFn, ttl = 600) {
    try {
      const cached = await client.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
      
      const result = await queryFn();
      await client.setex(cacheKey, ttl, JSON.stringify(result));
      
      return result;
    } catch (error) {
      console.error('缓存错误:', error);
      return await queryFn();
    }
  }
  
  // 清除相关缓存
  static async clearArticleCache(articleId) {
    const patterns = [
      `article:${articleId}`,
      'articles:*', // 清除所有文章列表缓存
      'categories:*'
    ];
    
    for (const pattern of patterns) {
      const keys = await client.keys(pattern);
      if (keys.length > 0) {
        await client.del(...keys);
      }
    }
  }
  
  // 缓存用户会话
  static async setUserSession(userId, sessionData, ttl = 7 * 24 * 3600) {
    const cacheKey = `session:${userId}`;
    await client.setex(cacheKey, ttl, JSON.stringify(sessionData));
  }
  
  static async getUserSession(userId) {
    const cacheKey = `session:${userId}`;
    const cached = await client.get(cacheKey);
    return cached ? JSON.parse(cached) : null;
  }
}

module.exports = Cache;

// 在控制器中使用缓存
exports.getArticleById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // 使用缓存
    const article = await Cache.getArticle(id);
    
    if (!article) {
      return res.status(404).json({ code: 404, message: '文章不存在' });
    }
    
    // 异步更新浏览次数 (不阻塞响应)
    setImmediate(async () => {
      await Article.increment('ViewCount', { where: { PostID: id } });
      // 清除缓存以便下次获取到最新数据
      await Cache.clearArticleCache(id);
    });
    
    res.json({
      code: 0,
      data: article
    });
  } catch (error) {
    console.error('获取文章错误:', error);
    res.status(500).json({ code: 500, message: '获取文章失败' });
  }
};
```

### 3. 文件处理优化
```javascript
// middleware/fileUpload.js
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

// 配置存储
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    
    // 按日期分组存储
    const date = new Date();
    const yearMonth = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}`;
    const finalDir = path.join(uploadDir, yearMonth);
    
    try {
      await fs.mkdir(finalDir, { recursive: true });
      cb(null, finalDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    cb(null, filename);
  }
});

// 文件过滤器
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'image/jpeg',
    'image/png', 
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('不支持的文件类型'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

// 图片处理中间件
const processImage = async (req, res, next) => {
  if (!req.file || !req.file.mimetype.startsWith('image/')) {
    return next();
  }
  
  try {
    const inputPath = req.file.path;
    const outputPath = inputPath.replace(/\.(jpg|jpeg|png|gif)$/i, '_processed.webp');
    
    // 使用Sharp处理图片
    await sharp(inputPath)
      .resize(1200, 800, { 
        fit: 'inside',
        withoutEnlargement: true
      })
      .webp({ quality: 80 })
      .toFile(outputPath);
    
    // 生成缩略图
    const thumbnailPath = inputPath.replace(/\.(jpg|jpeg|png|gif)$/i, '_thumb.webp');
    await sharp(inputPath)
      .resize(300, 200, { 
        fit: 'cover'
      })
      .webp({ quality: 70 })
      .toFile(thumbnailPath);
    
    // 删除原始文件
    await fs.unlink(inputPath);
    
    // 更新文件信息
    req.file.path = outputPath;
    req.file.filename = path.basename(outputPath);
    req.file.thumbnailPath = thumbnailPath;
    
    next();
  } catch (error) {
    console.error('图片处理错误:', error);
    next(error);
  }
};

module.exports = {
  upload,
  processImage
};

// 在路由中使用
app.post('/api/upload', 
  upload.single('file'),
  processImage,
  async (req, res) => {
    try {
      const file = req.file;
      
      // 保存文件信息到数据库
      const attachment = await Attachment.create({
        OriginalName: file.originalname,
        FileName: file.filename,
        FilePath: file.path,
        FileSize: file.size,
        FileType: file.mimetype,
        UserID: req.user.userId,
        ThumbnailPath: file.thumbnailPath
      });
      
      res.json({
        code: 0,
        message: '上传成功',
        data: attachment
      });
    } catch (error) {
      console.error('保存文件信息错误:', error);
      res.status(500).json({ code: 500, message: '上传失败' });
    }
  }
);
```

---

## 部署架构

### 1. PM2集群配置
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'blog-backend',
    script: 'index.js',
    cwd: '/var/www/blog/backend',
    instances: 'max', // 使用所有CPU核心
    exec_mode: 'cluster',
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000,
      MYSQL_HOST: 'localhost',
      MYSQL_DATABASE: 'blog_prod',
      REDIS_HOST: 'localhost'
    },
    error_file: '/var/log/pm2/blog-error.log',
    out_file: '/var/log/pm2/blog-out.log',
    log_file: '/var/log/pm2/blog-combined.log',
    time: true,
    // 健康检查
    health_check_url: 'http://localhost:3000/api/health',
    health_check_grace_period: 3000
  }]
};

// 部署配置
module.exports.deploy = {
  production: {
    user: 'deploy',
    host: 'your-server.com',
    ref: 'origin/main',
    repo: 'git@github.com:yourusername/blog-backend.git',
    path: '/var/www/blog',
    'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production'
  }
};
```

### 2. Nginx配置
```nginx
# /etc/nginx/sites-available/blog
upstream blog_backend {
    least_conn;
    server 127.0.0.1:3000 max_fails=3 fail_timeout=30s;
    server 127.0.0.1:3001 max_fails=3 fail_timeout=30s;
    server 127.0.0.1:3002 max_fails=3 fail_timeout=30s;
    server 127.0.0.1:3003 max_fails=3 fail_timeout=30s;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL配置
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Gzip压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml
        text/css
        text/javascript
        text/xml
        text/plain;

    # API代理
    location /api/ {
        proxy_pass http://blog_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # 超时设置
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
        
        # 文件上传大小限制
        client_max_body_size 10M;
    }

    # 静态文件
    location /uploads/ {
        alias /var/www/blog/backend/uploads/;
        expires 1y;
        add_header Cache-Control "public, immutable";
        
        # 图片优化
        location ~* \.(jpg|jpeg|png|gif)$ {
            try_files $uri $uri/ =404;
            add_header Vary Accept;
        }
    }

    # 健康检查
    location /health {
        proxy_pass http://blog_backend/api/health;
        access_log off;
    }

    # 日志配置
    access_log /var/log/nginx/blog.access.log;
    error_log /var/log/nginx/blog.error.log;
}

# HTTP重定向到HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

### 3. 监控与日志
```javascript
// utils/monitoring.js
const fs = require('fs');
const path = require('path');

class Monitor {
  // 健康检查接口
  static async healthCheck(req, res) {
    try {
      const checks = await Promise.allSettled([
        this.checkDatabase(),
        this.checkRedis(),
        this.checkDisk(),
        this.checkMemory()
      ]);
      
      const results = checks.map((check, index) => ({
        name: ['database', 'redis', 'disk', 'memory'][index],
        status: check.status === 'fulfilled' ? 'healthy' : 'unhealthy',
        details: check.status === 'fulfilled' ? check.value : check.reason.message
      }));
      
      const isHealthy = results.every(result => result.status === 'healthy');
      
      res.status(isHealthy ? 200 : 503).json({
        status: isHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        checks: results,
        version: process.env.npm_package_version,
        uptime: process.uptime()
      });
    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        error: error.message
      });
    }
  }
  
  // 数据库连接检查
  static async checkDatabase() {
    const { sequelize } = require('../models');
    await sequelize.authenticate();
    return { connected: true };
  }
  
  // Redis连接检查
  static async checkRedis() {
    const redis = require('../utils/cache');
    await redis.ping();
    return { connected: true };
  }
  
  // 磁盘空间检查
  static async checkDisk() {
    const stats = await fs.promises.statfs(path.join(__dirname, '..'));
    const freeSpace = stats.bavail * stats.bsize;
    const totalSpace = stats.blocks * stats.bsize;
    const usagePercent = ((totalSpace - freeSpace) / totalSpace) * 100;
    
    if (usagePercent > 90) {
      throw new Error(`磁盘空间不足: ${usagePercent.toFixed(2)}%`);
    }
    
    return { usagePercent: usagePercent.toFixed(2) };
  }
  
  // 内存检查
  static checkMemory() {
    const usage = process.memoryUsage();
    const usageMB = {
      rss: Math.round(usage.rss / 1024 / 1024),
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024),
      external: Math.round(usage.external / 1024 / 1024)
    };
    
    if (usageMB.heapUsed > 512) { // 超过512MB警告
      console.warn('内存使用量较高:', usageMB);
    }
    
    return usageMB;
  }
  
  // 性能指标收集
  static collectMetrics() {
    return {
      timestamp: new Date().toISOString(),
      process: {
        pid: process.pid,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage()
      },
      system: {
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version
      }
    };
  }
}

module.exports = Monitor;

// routes/health.js
const express = require('express');
const router = express.Router();
const Monitor = require('../utils/monitoring');

router.get('/health', Monitor.healthCheck);
router.get('/metrics', (req, res) => {
  res.json(Monitor.collectMetrics());
});

module.exports = router;
```

这份技术架构文档详细介绍了博客系统的技术实现，包括系统架构、数据库设计、API实现、安全机制等各个方面。文档可以帮助您：

1. **深入理解项目架构**: 掌握每个模块的设计思路和实现细节
2. **提升代码能力**: 学习优秀的代码组织和设计模式
3. **面试准备**: 充分理解项目的技术深度，能够回答各种技术问题
4. **后续扩展**: 基于现有架构进行功能扩展和优化

建议您结合实际代码仔细阅读，理解每个设计决策的原因和实现方式。
