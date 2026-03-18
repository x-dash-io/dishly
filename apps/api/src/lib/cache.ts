import type { Redis } from '@upstash/redis/cloudflare';

/**
 * Generic Redis-backed cache wrapper for API route handlers.
 * 
 * Usage:
 *   return withCache(redis, `recipe:${id}`, 300, async () => {
 *     const data = await db.query...
 *     return data;
 *   });
 * 
 * @param redis  Upstash Redis instance
 * @param key    Cache key
 * @param ttlSec TTL in seconds
 * @param fn     Async factory — called only on cache miss
 */
export async function withCache<T>(
  redis: Redis,
  key: string,
  ttlSec: number,
  fn: () => Promise<T>
): Promise<T> {
  try {
    const cached = await redis.get<T>(key);
    if (cached !== null && cached !== undefined) return cached;
  } catch {
    // Redis unavailable — fall through to DB query
  }

  const result = await fn();

  try {
    await redis.setex(key, ttlSec, JSON.stringify(result));
  } catch {
    // Cache write failure is non-fatal
  }

  return result;
}

/**
 * Invalidate one or more cache keys.
 * Errors are silently swallowed — a failed invalidation is never fatal.
 */
export async function invalidateCache(redis: Redis, ...keys: string[]): Promise<void> {
  try {
    if (keys.length === 1) {
      await redis.del(keys[0]);
    } else if (keys.length > 1) {
      await redis.del(...keys);
    }
  } catch {
    // Non-fatal
  }
}
