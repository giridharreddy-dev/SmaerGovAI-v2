import { createClient } from 'redis';

let redisUrl = 'redis://localhost:6379';
if (process.env.REDIS_URL && process.env.REDIS_URL.startsWith('redis')) {
  redisUrl = process.env.REDIS_URL.trim();
}

export const redisClient = createClient({
  url: redisUrl,
  socket: {
    reconnectStrategy: (retries) => Math.min(retries * 100, 3000),
    connectTimeout: 2000,
  }
});

let isRedisConnected = false;
const memoryCache = new Map();
const MEMORY_CACHE_MAX = 5000;

redisClient.on('error', () => {
  isRedisConnected = false;
});

redisClient.on('connect', () => {
  isRedisConnected = true;
  console.log('✅ Connected to Redis cache service.');
});

redisClient.on('ready', () => {
  isRedisConnected = true;
});

redisClient.on('end', () => {
  isRedisConnected = false;
});

redisClient.connect().catch(() => {
  console.log('ℹ️ Redis standalone server not reached; using in-memory high-speed LRU fallback cache.');
});

export async function getCache(key) {
  // 1. Check in-memory fast tier (0ms latency)
  const mem = memoryCache.get(key);
  if (mem) {
    if (mem.expiresAt && Date.now() > mem.expiresAt) {
      memoryCache.delete(key);
    } else {
      return mem.value;
    }
  }

  // 2. Check Redis tier
  if (isRedisConnected) {
    try {
      const val = await redisClient.get(key);
      if (val) {
        const parsed = JSON.parse(val);
        // Backfill memory tier
        if (memoryCache.size < MEMORY_CACHE_MAX) {
          memoryCache.set(key, { value: parsed, expiresAt: Date.now() + 60000 });
        }
        return parsed;
      }
    } catch (e) {
      return null;
    }
  }
  return null;
}

export async function setCache(key, value, exp = 3600) {
  // 1. Set in memory tier
  if (memoryCache.size >= MEMORY_CACHE_MAX) {
    const firstKey = memoryCache.keys().next().value;
    if (firstKey) memoryCache.delete(firstKey);
  }
  memoryCache.set(key, { value, expiresAt: Date.now() + (exp * 1000) });

  // 2. Set in Redis tier
  if (isRedisConnected) {
    try {
      await redisClient.set(key, JSON.stringify(value), { EX: exp });
    } catch (e) {}
  }
}

export async function delCache(key) {
  memoryCache.delete(key);
  if (isRedisConnected) {
    try {
      await redisClient.del(key);
    } catch (e) {}
  }
}

export async function flushSchemeCache() {
  memoryCache.clear();
  if (isRedisConnected) {
    try {
      const keys = await redisClient.keys('scheme:*');
      if (keys && keys.length > 0) {
        await redisClient.del(keys);
      }
      const facKeys = await redisClient.keys('facilities:*');
      if (facKeys && facKeys.length > 0) {
        await redisClient.del(facKeys);
      }
    } catch (e) {}
  }
}
