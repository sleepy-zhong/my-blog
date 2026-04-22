import instance from './index'

export function getRedisHealth() {
  return instance.get('/api/redis/health')
}

export function getRedisStats() {
  return instance.get('/api/redis/stats')
}

export function clearPublicRedisCache() {
  return instance.delete('/api/redis/public-cache')
}
