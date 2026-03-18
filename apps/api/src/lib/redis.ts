import { Redis } from '@upstash/redis/cloudflare';
import type { CloudflareEnv } from '../types/env';

export function getRedis(env: CloudflareEnv) {
  return new Redis({
    url: env.UPSTASH_REDIS_REST_URL,
    token: env.UPSTASH_REDIS_REST_TOKEN,
  });
}
