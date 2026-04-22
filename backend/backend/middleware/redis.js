const redisClient = require('../config/redis');
const CACHE_METRIC_KEYS = {
  hits: 'metrics:cache:hits',
  misses: 'metrics:cache:misses',
  writes: 'metrics:cache:writes',
  invalidatedKeys: 'metrics:cache:invalidated_keys',
};
const CACHE_ACTIVITY_KEY = 'metrics:cache:activity';
const CACHE_RECENT_INVALIDATIONS_KEY = 'metrics:cache:recent_invalidations';
const RECENT_INVALIDATIONS_LIMIT = 10;

function normalizeResponsePayload(payload) {
  if (payload && typeof payload === 'object' && 'code' in payload) {
    return payload;
  }

  return {
    code: 0,
    message: 'success',
    data: payload,
  };
}

function isSuccessfulResponse(statusCode, payload) {
  return statusCode < 400 && normalizeResponsePayload(payload).code === 0;
}

function resolveCacheKey(cacheKey, req) {
  if (typeof cacheKey === 'function') {
    return cacheKey(req);
  }

  return cacheKey;
}

async function deleteCachedKeysByPatterns(patterns = []) {
  if (!redisClient.isClientConnected()) {
    return 0;
  }

  const client = redisClient.getClient();
  if (!client) {
    return 0;
  }

  let deletedCount = 0;
  const normalizedPatterns = Array.from(new Set(patterns.filter(Boolean)));

  for (const pattern of normalizedPatterns) {
    let cursor = '0';

    do {
      const [nextCursor, keys] = await client.scan(cursor, 'MATCH', `cache:${pattern}`, 'COUNT', 100);
      cursor = nextCursor;

      if (keys.length > 0) {
        deletedCount += await client.del(...keys);
      }
    } while (cursor !== '0');
  }

  return deletedCount;
}

async function incrementCacheMetric(metricKey, amount = 1) {
  if (!redisClient.isClientConnected() || !metricKey || amount <= 0) {
    return;
  }

  try {
    const client = redisClient.getClient();
    if (!client) {
      return;
    }

    await client.incrby(metricKey, amount);
  } catch (error) {
    console.error(`Redis cache metric update failed for ${metricKey}:`, error.message);
  }
}

async function setCacheActivity(field, value = new Date().toISOString()) {
  if (!redisClient.isClientConnected() || !field) {
    return;
  }

  try {
    const client = redisClient.getClient();
    if (!client) {
      return;
    }

    await client.hset(CACHE_ACTIVITY_KEY, field, value);
  } catch (error) {
    console.error(`Redis cache activity update failed for ${field}:`, error.message);
  }
}

async function pushRecentInvalidation(entry) {
  if (!redisClient.isClientConnected() || !entry) {
    return;
  }

  try {
    const client = redisClient.getClient();
    if (!client) {
      return;
    }

    await client.lpush(CACHE_RECENT_INVALIDATIONS_KEY, JSON.stringify(entry));
    await client.ltrim(CACHE_RECENT_INVALIDATIONS_KEY, 0, RECENT_INVALIDATIONS_LIMIT - 1);
  } catch (error) {
    console.error('Redis recent invalidation record failed:', error.message);
  }
}

const redisMiddleware = async (req, _res, next) => {
  try {
    req.redis = redisClient;
  } catch (_error) {
    req.redis = null;
  }

  next();
};

const cacheMiddleware = (cacheKey, expireTime = 3600, options = {}) => {
  const { shouldBypass } = options;

  return async (req, res, next) => {
    if (req.method !== 'GET') {
      return next();
    }

    if (typeof shouldBypass === 'function' && shouldBypass(req)) {
      return next();
    }

    if (!redisClient.isClientConnected()) {
      return next();
    }

    const key = resolveCacheKey(cacheKey, req);
    if (!key) {
      return next();
    }

    try {
      const cachedEntry = await redisClient.getCache(key);
      if (cachedEntry && typeof cachedEntry === 'object' && cachedEntry.payload) {
        await incrementCacheMetric(CACHE_METRIC_KEYS.hits);
        await setCacheActivity('lastHitAt');
        return res.status(cachedEntry.statusCode || 200).json(cachedEntry.payload);
      }

      await incrementCacheMetric(CACHE_METRIC_KEYS.misses);
      await setCacheActivity('lastMissAt');
    } catch (error) {
      console.error(`Redis cache read failed for ${key}:`, error.message);
    }

    const originalJson = res.json.bind(res);

    res.json = async function cacheJson(payload) {
      const normalizedPayload = normalizeResponsePayload(payload);

      if (isSuccessfulResponse(res.statusCode, normalizedPayload)) {
        try {
          await redisClient.setCache(
            key,
            {
              statusCode: res.statusCode || 200,
              payload: normalizedPayload,
            },
            expireTime
          );
          await incrementCacheMetric(CACHE_METRIC_KEYS.writes);
          await setCacheActivity('lastWriteAt');
        } catch (error) {
          console.error(`Redis cache write failed for ${key}:`, error.message);
        }
      }

      return originalJson(payload);
    };

    next();
  };
};

const invalidateCacheMiddleware = (patternResolver) => {
  return (req, res, next) => {
    const originalJson = res.json.bind(res);

    res.json = async function invalidateJson(payload) {
      const normalizedPayload = normalizeResponsePayload(payload);

      if (isSuccessfulResponse(res.statusCode, normalizedPayload) && redisClient.isClientConnected()) {
        try {
          const resolvedPatterns = typeof patternResolver === 'function'
            ? patternResolver(req, normalizedPayload)
            : patternResolver;

          const patterns = Array.isArray(resolvedPatterns)
            ? resolvedPatterns
            : [resolvedPatterns];

          if (patterns.filter(Boolean).length > 0) {
            const deletedCount = await deleteCachedKeysByPatterns(patterns);
            await incrementCacheMetric(CACHE_METRIC_KEYS.invalidatedKeys, deletedCount);
            await setCacheActivity('lastInvalidatedAt');
            await pushRecentInvalidation({
              at: new Date().toISOString(),
              method: req.method,
              path: req.originalUrl || req.url || '',
              patterns: patterns.filter(Boolean),
              deletedCount,
            });
          }
        } catch (error) {
          console.error('Redis cache invalidation failed:', error.message);
        }
      }

      return originalJson(payload);
    };

    next();
  };
};

const rateLimitMiddleware = (limit = 100, windowTime = 60, keyGenerator = null) => {
  return async (req, res, next) => {
    try {
      if (!redisClient.isClientConnected()) {
        return next();
      }

      let key = `rate_limit:${req.ip}`;
      if (keyGenerator) {
        key = keyGenerator(req);
      }

      const current = await redisClient.incrementCounter(key, windowTime);

      res.set({
        'X-RateLimit-Limit': limit,
        'X-RateLimit-Remaining': Math.max(0, limit - current),
        'X-RateLimit-Reset': new Date(Date.now() + windowTime * 1000).toISOString(),
      });

      if (current > limit) {
        return res.status(429).json({
          code: 1,
          message: 'Too many requests, please try again later',
          data: {
            limit,
            current,
            resetTime: windowTime,
          },
        });
      }

      next();
    } catch (error) {
      console.error('Redis rate limit middleware failed:', error.message);
      next();
    }
  };
};

module.exports = {
  CACHE_ACTIVITY_KEY,
  CACHE_METRIC_KEYS,
  CACHE_RECENT_INVALIDATIONS_KEY,
  redisMiddleware,
  cacheMiddleware,
  invalidateCacheMiddleware,
  rateLimitMiddleware,
  deleteCachedKeysByPatterns,
  incrementCacheMetric,
  pushRecentInvalidation,
  setCacheActivity,
};
