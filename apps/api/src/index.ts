import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { secureHeaders } from 'hono/secure-headers';
import type { CloudflareEnv, Variables } from './types/env';

import { authRoutes } from './routes/auth';
import { recipeRoutes } from './routes/recipes';
import { userRoutes } from './routes/users';
import { aiRoutes } from './routes/ai';
import { feedRoutes } from './routes/feed';
import { uploadRoutes } from './routes/uploads';
import { mealPlanRoutes } from './routes/meal-plans';
import { createDb } from '@dishly/db';
import { sendLikeNotifications } from './lib/jobs/send-like-notifications';

const app = new Hono<{ Bindings: CloudflareEnv, Variables: Variables }>();

// Middleware
app.use('*', logger());
app.use('*', secureHeaders());
app.use('*', cors({ 
  origin: '*', 
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Clerk-SDK-Language', 'X-Clerk-SDK-Version'],
  exposeHeaders: ['Content-Length'],
  maxAge: 600,
  credentials: false 
}));

app.use('*', async (c, next) => {
  if (c.env.ENVIRONMENT === 'development') {
    return prettyJSON()(c, next);
  }
  await next();
});

// Global error handler
app.onError((err, c) => {
  console.error(`[${c.req.method}] ${c.req.url} - Error:`, err);
  
  const status = (err as { status?: number }).status ?? 500;
  const message = c.env.ENVIRONMENT === 'production' && status === 500 
    ? 'Internal Server Error' 
    : err.message;

  return c.json({ 
    error: message, 
    code: err.name 
  }, status);
});

// Not found handler
app.notFound((c) => c.json({ error: 'Route not found' }, 404));

// Health check
app.get('/health', (c) => c.json({ 
  status: 'ok', 
  timestamp: new Date().toISOString() 
}));

// Mount routes
app.route('/auth', authRoutes);
app.route('/recipes', recipeRoutes);
app.route('/users', userRoutes);
app.route('/ai', aiRoutes);
app.route('/feed', feedRoutes);
app.route('/uploads', uploadRoutes);
app.route('/meal-plans', mealPlanRoutes);

// Named export for Cloudflare Workers — supports both fetch (HTTP) and scheduled (Cron)
export default {
  fetch: app.fetch.bind(app),
  async scheduled(_event: ScheduledEvent, env: CloudflareEnv, ctx: ExecutionContext) {
    ctx.waitUntil(sendLikeNotifications(createDb(env.DATABASE_URL)));
  },
};
