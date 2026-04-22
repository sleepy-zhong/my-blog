const express = require('express');
const router = express.Router();
const redisClient = require('../config/redis');
const {
  CACHE_ACTIVITY_KEY,
  CACHE_METRIC_KEYS,
  CACHE_RECENT_INVALIDATIONS_KEY,
  deleteCachedKeysByPatterns,
  incrementCacheMetric,
  pushRecentInvalidation,
  setCacheActivity,
} = require('../middleware/redis');
const {
  PUBLIC_ARTICLE_CACHE_PATTERNS,
  PUBLIC_ARTICLE_DETAIL_CACHE_PATTERNS,
  PUBLIC_CATEGORY_CACHE_PATTERNS,
  PUBLIC_CATEGORY_DERIVED_CACHE_PATTERNS,
  PUBLIC_HOME_CAT_CACHE_PATTERNS,
  PUBLIC_SETTINGS_CACHE_PATTERNS,
  PUBLIC_TAG_CACHE_PATTERNS,
  PUBLIC_TAG_DERIVED_CACHE_PATTERNS,
} = require('../utils/publicCache');

async function countKeysByPattern(client, pattern) {
  let cursor = '0';
  let count = 0;

  do {
    const [nextCursor, keys] = await client.scan(cursor, 'MATCH', `cache:${pattern}`, 'COUNT', 200);
    cursor = nextCursor;
    count += keys.length;
  } while (cursor !== '0');

  return count;
}

async function countKeysByPatterns(client, patterns = []) {
  const uniquePatterns = Array.from(new Set(patterns.filter(Boolean)));
  const counts = await Promise.all(uniquePatterns.map(pattern => countKeysByPattern(client, pattern)));
  return counts.reduce((sum, value) => sum + value, 0);
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

const REDIS_NOT_CONNECTED_MESSAGE = 'Redis client is not connected';

function ensureRedisConnected(res) {
  if (redisClient.isClientConnected()) {
    return true;
  }

  res.error('Redis not connected', REDIS_NOT_CONNECTED_MESSAGE, 503);
  return false;
}

function getRedisRouteErrorStatus(error) {
  return error?.message === REDIS_NOT_CONNECTED_MESSAGE ? 503 : 500;
}

/**
 * @swagger
 * /api/redis/health:
 *   get:
 *     summary: Redis健康检查
 *     tags: [Redis]
 *     responses:
 *       200:
 *         description: Redis状态信息
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 0
 *                 message:
 *                   type: string
 *                   example: Redis健康检查完成
 *                 data:
 *                   type: object
 *                   properties:
 *                     connected:
 *                       type: boolean
 *                     ping:
 *                       type: boolean
 *                     status:
 *                       type: string
 */
router.get('/health', async (req, res) => {
  try {
    const isConnected = redisClient.isClientConnected();
    const pingResult = await redisClient.ping();
    const connection = redisClient.getConnectionConfig();

    const healthData = {
      enabled: redisClient.isEnabledByConfig(),
      connected: isConnected,
      ping: pingResult,
      status: isConnected ? 'healthy' : 'disconnected',
      target: redisClient.getConnectionLabel(),
      host: connection.host,
      port: connection.port,
      db: connection.db,
      clientStatus: redisClient.getClient()?.status || 'disconnected',
      timestamp: new Date().toISOString()
    };

    res.success(healthData, 'Redis health check completed');
  } catch (error) {
    console.error('Redis health check failed:', error);
    res.error('Redis health check failed', error.message, 500);
  }
});

/**
 * @swagger
 * /api/redis/test-cache:
 *   post:
 *     summary: 测试Redis缓存功能
 *     tags: [Redis]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               key:
 *                 type: string
 *                 description: 缓存键
 *               value:
 *                 type: object
 *                 description: 缓存值
 *               expireTime:
 *                 type: integer
 *                 description: 过期时间（秒）
 *                 default: 60
 *     responses:
 *       200:
 *         description: 缓存测试结果
 */
router.post('/test-cache', async (req, res) => {
  try {
    if (!ensureRedisConnected(res)) {
      return;
    }

    const { key, value, expireTime = 60 } = req.body;
    
    if (!key || value === undefined) {
      return res.error('缺少必要参数', 'key和value是必需的', 400);
    }

    // 设置缓存
    await redisClient.setCache(key, value, expireTime);
    
    // 读取缓存验证
    const cachedValue = await redisClient.getCache(key);
    
    const testResult = {
      key,
      originalValue: value,
      cachedValue,
      isMatch: JSON.stringify(value) === JSON.stringify(cachedValue),
      expireTime,
      timestamp: new Date().toISOString()
    };

    res.success(testResult, 'Redis缓存测试成功');
  } catch (error) {
    console.error('Redis缓存测试失败:', error);
    res.error('Redis缓存测试失败', error.message, getRedisRouteErrorStatus(error));
  }
});

/**
 * @swagger
 * /api/redis/test-cache/{key}:
 *   get:
 *     summary: 获取测试缓存
 *     tags: [Redis]
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: 缓存键
 *     responses:
 *       200:
 *         description: 缓存内容
 */
router.get('/test-cache/:key', async (req, res) => {
  try {
    if (!ensureRedisConnected(res)) {
      return;
    }

    const { key } = req.params;
    const cachedValue = await redisClient.getCache(key);
    
    if (cachedValue === null) {
      return res.error('缓存不存在', `键 '${key}' 对应的缓存不存在或已过期`, 404);
    }

    res.success({
      key,
      value: cachedValue,
      timestamp: new Date().toISOString()
    }, '缓存获取成功');
  } catch (error) {
    console.error('获取缓存失败:', error);
    res.error('获取缓存失败', error.message, getRedisRouteErrorStatus(error));
  }
});

/**
 * @swagger
 * /api/redis/test-cache/{key}:
 *   delete:
 *     summary: 删除测试缓存
 *     tags: [Redis]
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: 缓存键
 *     responses:
 *       200:
 *         description: 删除结果
 */
router.delete('/test-cache/:key', async (req, res) => {
  try {
    if (!ensureRedisConnected(res)) {
      return;
    }

    const { key } = req.params;
    const result = await redisClient.delCache(key);
    
    res.success({
      key,
      deleted: result > 0,
      timestamp: new Date().toISOString()
    }, result > 0 ? '缓存删除成功' : '缓存不存在');
  } catch (error) {
    console.error('删除缓存失败:', error);
    res.error('删除缓存失败', error.message, getRedisRouteErrorStatus(error));
  }
});

router.delete('/public-cache', async (req, res) => {
  try {
    if (!ensureRedisConnected(res)) {
      return;
    }

    const patterns = ['public:*'];
    const deletedCount = await deleteCachedKeysByPatterns(patterns);

    await incrementCacheMetric(CACHE_METRIC_KEYS.invalidatedKeys, deletedCount);
    await setCacheActivity('lastInvalidatedAt');
    await pushRecentInvalidation({
      at: new Date().toISOString(),
      method: req.method,
      path: req.originalUrl || req.url || '',
      patterns,
      deletedCount,
      reason: 'manual-clear',
    });

    res.success({
      deletedCount,
      patterns,
      timestamp: new Date().toISOString(),
    }, 'Public cache cleared');
  } catch (error) {
    console.error('Public cache clear failed:', error);
    res.error('Public cache clear failed', error.message, getRedisRouteErrorStatus(error));
  }
});

/**
 * @swagger
 * /api/redis/stats:
 *   get:
 *     summary: 获取Redis统计信息
 *     tags: [Redis]
 *     responses:
 *       200:
 *         description: Redis统计信息
 */
router.get('/stats', async (req, res) => {
  try {
    if (!ensureRedisConnected(res)) {
      return;
    }

    const client = redisClient.getClient();
    const [
      info,
      dbSize,
      totalPublicCacheKeys,
      articleCacheKeys,
      articleDetailCacheKeys,
      homeCatCacheKeys,
      categoryCacheKeys,
      categorySummaryCacheKeys,
      tagCacheKeys,
      tagPopularCacheKeys,
      settingsCacheKeys,
      metricValues,
      activity,
      recentInvalidations,
    ] = await Promise.all([
      client.info(),
      client.dbsize(),
      countKeysByPattern(client, 'public:*'),
      countKeysByPatterns(client, PUBLIC_ARTICLE_CACHE_PATTERNS),
      countKeysByPatterns(client, PUBLIC_ARTICLE_DETAIL_CACHE_PATTERNS),
      countKeysByPatterns(client, PUBLIC_HOME_CAT_CACHE_PATTERNS),
      countKeysByPatterns(client, PUBLIC_CATEGORY_CACHE_PATTERNS),
      countKeysByPatterns(client, PUBLIC_CATEGORY_DERIVED_CACHE_PATTERNS),
      countKeysByPatterns(client, PUBLIC_TAG_CACHE_PATTERNS),
      countKeysByPatterns(client, PUBLIC_TAG_DERIVED_CACHE_PATTERNS),
      countKeysByPatterns(client, PUBLIC_SETTINGS_CACHE_PATTERNS),
      client.mget(
        CACHE_METRIC_KEYS.hits,
        CACHE_METRIC_KEYS.misses,
        CACHE_METRIC_KEYS.writes,
        CACHE_METRIC_KEYS.invalidatedKeys,
      ),
      client.hgetall(CACHE_ACTIVITY_KEY),
      client.lrange(CACHE_RECENT_INVALIDATIONS_KEY, 0, 9),
    ]);

    const hits = toNumber(metricValues?.[0]);
    const misses = toNumber(metricValues?.[1]);
    const writes = toNumber(metricValues?.[2]);
    const invalidatedKeys = toNumber(metricValues?.[3]);
    const requestCount = hits + misses;
    const hitRate = requestCount > 0 ? Number((hits / requestCount).toFixed(4)) : 0;

    const stats = {
      connected: true,
      dbSize,
      info: {},
      cacheOverview: {
        totalPublicCacheKeys,
        groups: {
          articles: articleCacheKeys,
          articleDetails: articleDetailCacheKeys,
          homeCats: homeCatCacheKeys,
          categories: categoryCacheKeys,
          categorySummary: categorySummaryCacheKeys,
          tags: tagCacheKeys,
          tagPopular: tagPopularCacheKeys,
          settings: settingsCacheKeys,
        },
        metrics: {
          hits,
          misses,
          writes,
          invalidatedKeys,
          requestCount,
          hitRate,
        },
        activity: {
          lastHitAt: activity?.lastHitAt || '',
          lastMissAt: activity?.lastMissAt || '',
          lastWriteAt: activity?.lastWriteAt || '',
          lastInvalidatedAt: activity?.lastInvalidatedAt || '',
        },
      },
      recentInvalidations: (recentInvalidations || []).map((item) => {
        try {
          return JSON.parse(item);
        } catch (_error) {
          return { raw: item };
        }
      }),
      timestamp: new Date().toISOString(),
    };

    info.split('\r\n').forEach(line => {
      if (line && !line.startsWith('#') && line.includes(':')) {
        const [key, value] = line.split(':');
        if (key && value) {
          stats.info[key.trim()] = value.trim();
        }
      }
    });

    res.success(stats, 'Redis stats loaded');
  } catch (error) {
    console.error('Redis stats failed:', error);
    res.error('Redis stats failed', error.message, getRedisRouteErrorStatus(error));
  }
});

/**
 * @swagger
 * /api/redis/test-rate-limit:
 *   post:
 *     summary: 测试Redis限流功能
 *     tags: [Redis]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               key:
 *                 type: string
 *                 description: 限流键
 *               limit:
 *                 type: integer
 *                 description: 限制次数
 *                 default: 5
 *               windowTime:
 *                 type: integer
 *                 description: 时间窗口（秒）
 *                 default: 60
 *     responses:
 *       200:
 *         description: 限流测试结果
 */
router.post('/test-rate-limit', async (req, res) => {
  try {
    if (!ensureRedisConnected(res)) {
      return;
    }

    const { key, limit = 5, windowTime = 60 } = req.body;
    
    if (!key) {
      return res.error('缺少必要参数', 'key是必需的', 400);
    }

    const rateLimitKey = `rate_limit_test:${key}`;
    const current = await redisClient.incrementCounter(rateLimitKey, windowTime);
    
    const result = {
      key: rateLimitKey,
      current,
      limit,
      remaining: Math.max(0, limit - current),
      windowTime,
      exceeded: current > limit,
      resetTime: new Date(Date.now() + windowTime * 1000).toISOString(),
      timestamp: new Date().toISOString()
    };

    if (current > limit) {
      return res.status(429).json({
        code: 1,
        message: '请求频率超出限制',
        data: result
      });
    }

    res.success(result, 'Redis限流测试成功');
  } catch (error) {
    console.error('Redis限流测试失败:', error);
    res.error('Redis限流测试失败', error.message, getRedisRouteErrorStatus(error));
  }
});

module.exports = router;
