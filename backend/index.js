require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
// const csurf = require('csurf');
const errorHandler = require('./middleware/errorHandler');
const { sequelize } = require('./models');
const app = express();
const responseFormat = require('./middleware/responseFormat');

const userRoutes = require('./routes/user');
const roleRoutes = require('./routes/role');

const articleRoutes = require('./routes/article');
const commentRoutes = require('./routes/comment');
const categoryRoutes = require('./routes/category');
const tagRoutes = require('./routes/tag');
const attachmentRoutes = require('./routes/attachment');
const logRoutes = require('./routes/log');
const notificationRoutes = require('./routes/notification');
const emailRoutes = require('./routes/notification');
const swaggerUi = require('swagger-ui-express');
const swaggerJSDoc = require('swagger-jsdoc');

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'TechBlog API 文档',
    version: '1.0.0',
    description: '基于 Node.js + Express + Sequelize 的博客系统 API 文档'
  },
  servers: [
    { url: 'http://localhost:3000', description: '开发环境' }
  ]
};

const swaggerOptions = {
  swaggerDefinition,
  apis: ['./routes/*.js'],
};
const swaggerSpec = swaggerJSDoc(swaggerOptions);

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
// 仅在生产环境对非 GET 接口做限流，避免前端频繁获取详情导致整体请求被 429 拦截
const isProduction = process.env.NODE_ENV === 'production';
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 600,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => !isProduction || req.method === 'GET',
  handler: (req, res) => {
    return res.status(429).json({ code: 1, message: '请求过于频繁，请稍后再试' });
  }
});
// app.use(csurf({ cookie: true }));
app.use(responseFormat);
// 显式为 /uploads 静态资源加 CORS 响应头
const uploadPathEnv = process.env.UPLOAD_PATH || 'uploads';
const uploadStaticDir = path.isAbsolute(uploadPathEnv)
  ? uploadPathEnv
  : path.resolve(__dirname, uploadPathEnv);

app.use('/uploads', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
}, express.static(uploadStaticDir));

// 路由
// 将限流应用到 API 路径，且仅限写操作（POST/PUT/PATCH/DELETE）
app.use('/api', (req, res, next) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    return apiLimiter(req, res, next);
  }
  return next();
});
app.use('/api/users', userRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/attachments', attachmentRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/email', emailRoutes);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// 统一错误处理
app.use(errorHandler);

// 同步数据库表结构并启动服务
sequelize.sync().then(() => {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch(err => {
  console.error('数据库同步失败:', err);
});
