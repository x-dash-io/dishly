import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis/cloudflare';
import type { MiddlewareHandler } from 'hono';
import type { CloudflareEnv } from '../types/env';

export function getApiLimiter(env: CloudflareEnv) {
  return new Ratelimit({
    redis: Redis.fromEnv(env),
    limiter: Ratelimit.slidingWindow(60, '1 m'),
    prefix: 'dishly:api',
  });
}

export function getAiLimiter(env: CloudflareEnv) {
  return new Ratelimit({
    redis: Redis.fromEnv(env),
    limiter: Ratelimit.slidingWindow(20, '1 h'),
    prefix: 'dishly:ai',
  });
}

export function rateLimit(type: 'api' | 'ai'): MiddlewareHandler {
  return async (c, next) => {
    const env = c.env as CloudflareEnv;
    const limiter = type === 'api' ? getApiLimiter(env) : getAiLimiter(env);
    
    const user = c.get('user');
    const identifier = user?.id || c.req.header('cf-connecting-ip') || 'anonymous';
    
    const { success, limit, remaining, reset } = await limiter.limit(identifier);

    if (!success) {
      c.header('X-RateLimit-Limit', limit.toString());
      c.header('X-RateLimit-Remaining', remaining.toString());
      c.header('X-RateLimit-Reset', reset.toString());
      return c.json({ error: 'Rate limit exceeded', retryAfter: reset }, 429);
    }

    await next();
  };
}
