import { createClerkClient, verifyToken } from '@clerk/backend';
import type { MiddlewareHandler } from 'hono';
import type { CloudflareEnv, Variables } from '../types/env';
import { getDb } from '../lib/db';
import { users, eq } from '@dishly/db';

const CLOCK_SKEW_LEEWAY_MS = 3600000; // 1 hour in milliseconds

export const verifyClerkToken: MiddlewareHandler<{ Bindings: CloudflareEnv, Variables: Variables }> = async (c, next) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized', detail: 'Missing or invalid Authorization header' }, 401);
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return c.json({ error: 'Unauthorized', detail: 'Token missing' }, 401);
  }

  try {
    const session = await verifyToken(token, {
      secretKey: c.env.CLERK_SECRET_KEY,
      clockSkewInMs: CLOCK_SKEW_LEEWAY_MS,
    });
    
    if (!session) {
      return c.json({ error: 'Unauthorized', detail: 'Invalid session' }, 401);
    }

    c.set('clerkId', session.sub);
    await next();
  } catch (err: unknown) {
    return c.json({ 
      error: 'Unauthorized', 
      detail: `${err?.message || 'Verification failed'} (Server Time: ${new Date().toISOString()})`,
      code: err?.code
    }, 401);
  }
};

export const requireAuth: MiddlewareHandler<{ Bindings: CloudflareEnv, Variables: Variables }> = async (c, next) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized', detail: 'Missing or invalid Authorization header' }, 401);
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return c.json({ error: 'Unauthorized', detail: 'Token missing' }, 401);
  }

  try {
    const session = await verifyToken(token, {
      secretKey: c.env.CLERK_SECRET_KEY,
      clockSkewInMs: CLOCK_SKEW_LEEWAY_MS,
    });
    
    if (!session) {
      return c.json({ error: 'Unauthorized', detail: 'Invalid session' }, 401);
    }

    const db = getDb(c);
    const [dbUser] = await db.select().from(users).where(eq(users.clerkId, session.sub)).limit(1);

    if (!dbUser) {
      return c.json({ error: 'ONBOARDING_REQUIRED', detail: 'User not in database' }, 403);
    }

    c.set('user', dbUser);
    c.set('clerkId', session.sub);
    await next();
  } catch (err: unknown) {
    return c.json({ 
      error: 'Unauthorized', 
      detail: `${err?.message || 'Verification failed'} (Server Time: ${new Date().toISOString()})`,
      code: err?.code
    }, 401);
  }
};

export const optionalAuth: MiddlewareHandler<{ Bindings: CloudflareEnv, Variables: Variables }> = async (c, next) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return await next();
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return await next();
  }

  try {
    const session = await verifyToken(token, {
      secretKey: c.env.CLERK_SECRET_KEY,
      clockSkewInMs: CLOCK_SKEW_LEEWAY_MS,
    });
    if (session) {
      const db = getDb(c);
      const [dbUser] = await db.select().from(users).where(eq(users.clerkId, session.sub)).limit(1);
      if (dbUser) {
        c.set('user', dbUser);
      }
      c.set('clerkId', session.sub);
    }
  } catch (err) {
    // Ignore errors for optional auth
  }

  await next();
};
