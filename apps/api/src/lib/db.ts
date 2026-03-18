import { createDb } from '@dishly/db';
import type { Context } from 'hono';
import type { CloudflareEnv, Variables } from '../types/env';

export function getDb(c: Context<{ Bindings: CloudflareEnv, Variables: Variables }>) {
  return createDb(c.env.DATABASE_URL);
}
