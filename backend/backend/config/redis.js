const Redis = require('ioredis');
require('dotenv').config();

class RedisClient {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.isEnabled = process.env.REDIS_ENABLED !== 'false';
  }

  getConnectionConfig() {
    return {
      host: this.client?.options?.host || process.env.REDIS_HOST || 'localhost',
      port: Number(this.client?.options?.port || process.env.REDIS_PORT || 6379),
      db: Number(this.client?.options?.db || process.env.REDIS_DB || 0),
      hasPassword: Boolean(this.client?.options?.password || process.env.REDIS_PASSWORD),
    };
  }

  getConnectionLabel() {
    const { host, port, db } = this.getConnectionConfig();
    return `${host}:${port}/db${db}`;
  }

  isEnabledByConfig() {
    return this.isEnabled;
  }

  async connect() {
    if (!this.isEnabled) {
      console.log('Redis disabled by config (REDIS_ENABLED=false)');
      return Promise.resolve(null);
    }

    try {
      this.client = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || null,
        db: process.env.REDIS_DB || 0,
        retryDelayOnFailedRefresh: 1000,
        retryTimes: 2,
        connectTimeout: 5000,
        commandTimeout: 3000,
        lazyConnect: true,
        maxRetriesPerRequest: 1,
      });

      this.client.on('connect', () => {
        console.log(`Redis connected at ${this.getConnectionLabel()}`);
        this.isConnected = true;
      });

      this.client.on('error', (err) => {
        console.error(`Redis connection error at ${this.getConnectionLabel()}:`, err.message);
        this.isConnected = false;
      });

      this.client.on('close', () => {
        console.log(`Redis connection closed at ${this.getConnectionLabel()}`);
        this.isConnected = false;
      });

      this.client.on('reconnecting', (times) => {
        if (times <= 2) {
          console.log(`Redis reconnecting to ${this.getConnectionLabel()} (${times}/2)`);
        }
      });

      await this.client.connect();
      return this.client;
    } catch (error) {
      console.error(`Redis init failed at ${this.getConnectionLabel()}:`, error);
      throw error;
    }
  }

  getClient() {
    return this.client;
  }

  isClientConnected() {
    return this.isEnabled && this.isConnected && this.client && this.client.status === 'ready';
  }

  async disconnect() {
    if (this.client) {
      await this.client.disconnect();
      this.isConnected = false;
    }
  }

  async set(key, value, expireTime = null) {
    if (!this.isEnabled) {
      console.warn('Redis disabled, skip set');
      return null;
    }

    if (!this.isClientConnected()) {
      throw new Error('Redis client is not connected');
    }

    if (expireTime) {
      return await this.client.setex(key, expireTime, JSON.stringify(value));
    }

    return await this.client.set(key, JSON.stringify(value));
  }

  async get(key) {
    if (!this.isEnabled) {
      console.warn('Redis disabled, skip get');
      return null;
    }

    if (!this.isClientConnected()) {
      throw new Error('Redis client is not connected');
    }

    const result = await this.client.get(key);
    return result ? JSON.parse(result) : null;
  }

  async del(key) {
    if (!this.isEnabled) {
      console.warn('Redis disabled, skip del');
      return 0;
    }

    if (!this.isClientConnected()) {
      throw new Error('Redis client is not connected');
    }

    return await this.client.del(key);
  }

  async exists(key) {
    if (!this.isEnabled) {
      return false;
    }

    if (!this.isClientConnected()) {
      throw new Error('Redis client is not connected');
    }

    return await this.client.exists(key);
  }

  async expire(key, seconds) {
    if (!this.isEnabled) {
      return false;
    }

    if (!this.isClientConnected()) {
      throw new Error('Redis client is not connected');
    }

    return await this.client.expire(key, seconds);
  }

  async setCache(key, value, expireTime = 3600) {
    return await this.set(`cache:${key}`, value, expireTime);
  }

  async getCache(key) {
    return await this.get(`cache:${key}`);
  }

  async delCache(key) {
    return await this.del(`cache:${key}`);
  }

  async setSession(sessionId, sessionData, expireTime = 86400) {
    return await this.set(`session:${sessionId}`, sessionData, expireTime);
  }

  async getSession(sessionId) {
    return await this.get(`session:${sessionId}`);
  }

  async delSession(sessionId) {
    return await this.del(`session:${sessionId}`);
  }

  async incrementCounter(key, expireTime = 60) {
    if (!this.isEnabled) {
      console.warn('Redis disabled, skip counter increment');
      return 1;
    }

    if (!this.isClientConnected()) {
      throw new Error('Redis client is not connected');
    }

    const current = await this.client.incr(key);
    if (current == 1) {
      await this.client.expire(key, expireTime);
    }
    return current;
  }

  async ping() {
    if (!this.isEnabled) {
      return false;
    }

    if (!this.isClientConnected()) {
      return false;
    }

    try {
      const result = await this.client.ping();
      return result === 'PONG';
    } catch (error) {
      console.error('Redis ping failed:', error);
      return false;
    }
  }
}

const redisClient = new RedisClient();

module.exports = redisClient;
