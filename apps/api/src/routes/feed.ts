import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { 
  recipes, 
  users, 
  follows, 
  likes, 
  saves, 
  eq, 
  and, 
  desc, 
  sql, 
  inArray, 
  notInArray,
  lt,
  or,
  gte
} from '@dishly/db';
import { PaginationSchema } from '@dishly/validators';
import type { RecipeCardItem } from '@dishly/types';
import { getDb } from '../lib/db';
import { requireAuth, optionalAuth } from '../middleware/auth';
import { encodeCursor, decodeCursor } from '../lib/cursor';
import { getRedis } from '../lib/redis';
import type { CloudflareEnv, Variables } from '../types/env';

const app = new Hono<{ Bindings: CloudflareEnv; Variables: Variables }>();

// Helper to transform raw DB recipe + author into RecipeCardItem
async function transformToRecipeCard(
  db: any, 
  items: any[], 
  currentUserId?: string
): Promise<RecipeCardItem[]> {
  if (items.length === 0) return [];

  const recipeIds = items.map(i => i.id);
  
  let likedIds = new Set<string>();
  let savedIds = new Set<string>();

  if (currentUserId) {
    const [liked, saved] = await Promise.all([
      db.select({ recipeId: likes.recipeId })
        .from(likes)
        .where(and(eq(likes.userId, currentUserId), inArray(likes.recipeId, recipeIds))),
      db.select({ recipeId: saves.recipeId })
        .from(saves)
        .where(and(eq(saves.userId, currentUserId), inArray(saves.recipeId, recipeIds)))
    ]);
    likedIds = new Set(liked.map((l: any) => l.recipeId));
    savedIds = new Set(saved.map((s: any) => s.recipeId));
  }

  return items.map(item => ({
    id: item.id,
    title: item.title,
    cover_image_url: item.coverImageUrl,
    hero_image_url: item.heroImageUrl,
    cuisine: item.cuisine,
    difficulty: item.difficulty,
    prep_minutes: item.prepMinutes,
    cook_minutes: item.cookMinutes,
    servings: item.servings,
    like_count: item.likeCount || 0,
    save_count: item.saveCount || 0,
    is_ai_generated: item.isAiGenerated || false,
    created_at: item.createdAt.toISOString(),
    author: {
      id: item.author.id,
      username: item.author.username,
      display_name: item.author.displayName,
      avatar_url: item.author.avatarUrl,
    },
    viewer: currentUserId ? {
      liked: likedIds.has(item.id),
      saved: savedIds.has(item.id),
    } : null,
  }));
}

// --- GET /feed/home ---
app.get('/home', requireAuth, zValidator('query', PaginationSchema), async (c) => {
  const db = getDb(c);
  const user = c.get('user')!;
  const { limit, cursor } = c.req.valid('query');

  const decoded = cursor ? decodeCursor(cursor) : null;

  // Pass 1: Following content
  const followingQuery = db.select({
    id: recipes.id,
    title: recipes.title,
    coverImageUrl: recipes.coverImageUrl,
    heroImageUrl: recipes.heroImageUrl,
    cuisine: recipes.cuisine,
    difficulty: recipes.difficulty,
    prepMinutes: recipes.prepMinutes,
    cookMinutes: recipes.cookMinutes,
    servings: recipes.servings,
    likeCount: recipes.likeCount,
    saveCount: recipes.saveCount,
    isAiGenerated: recipes.isAiGenerated,
    createdAt: recipes.createdAt,
    author: {
      id: users.id,
      username: users.username,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
    }
  })
  .from(recipes)
  .innerJoin(follows, eq(follows.followingId, recipes.userId))
  .innerJoin(users, eq(users.id, recipes.userId))
  .where(and(
    eq(follows.followerId, user.id),
    eq(recipes.status, 'published'),
    inArray(recipes.visibility, ['public', 'followers']),
    decoded ? or(
      lt(recipes.createdAt, decoded.createdAt),
      and(eq(recipes.createdAt, decoded.createdAt), lt(recipes.id, decoded.id))
    ) : undefined
  ))
  .orderBy(desc(recipes.createdAt), desc(recipes.id))
  .limit(limit);

  const followingResults = await followingQuery;
  let finalResults = [...followingResults];
  let source: 'following' | 'discovery' | 'mixed' = 'following';

  // Pass 2: Discovery (if needed)
  if (finalResults.length < limit) {
    const followedUsers = await db.select({ id: follows.followingId })
      .from(follows)
      .where(eq(follows.followerId, user.id));
    const followedIds = followedUsers.map((f: any) => f.id);
    const excludeIds = finalResults.map(r => r.id);

    const discoveryResults = await db.select({
      id: recipes.id,
      title: recipes.title,
      coverImageUrl: recipes.coverImageUrl,
      heroImageUrl: recipes.heroImageUrl,
      cuisine: recipes.cuisine,
      difficulty: recipes.difficulty,
      prepMinutes: recipes.prepMinutes,
      cookMinutes: recipes.cookMinutes,
      servings: recipes.servings,
      likeCount: recipes.likeCount,
      saveCount: recipes.saveCount,
      isAiGenerated: recipes.isAiGenerated,
      createdAt: recipes.createdAt,
      author: {
        id: users.id,
        username: users.username,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
      }
    })
    .from(recipes)
    .innerJoin(users, eq(users.id, recipes.userId))
    .where(and(
      eq(recipes.status, 'published'),
      eq(recipes.visibility, 'public'),
      followedIds.length > 0 ? notInArray(recipes.userId, followedIds) : undefined,
      excludeIds.length > 0 ? notInArray(recipes.id, excludeIds) : undefined
    ))
    .orderBy(desc(sql`${recipes.likeCount} * 0.4 + ${recipes.saveCount} * 0.4 + ${recipes.viewCount} * 0.2`))
    .limit(limit - finalResults.length);

    finalResults = [...finalResults, ...discoveryResults];
    source = followingResults.length === 0 ? 'discovery' : 'mixed';
  }

  const recipesFormatted = await transformToRecipeCard(db, finalResults, user.id);
  const lastItem = finalResults[finalResults.length - 1];
  const nextCursor = (finalResults.length === limit && lastItem) 
    ? encodeCursor(lastItem.createdAt, lastItem.id) 
    : null;

  return c.json({
    recipes: recipesFormatted,
    nextCursor,
    source
  });
});

// --- GET /feed/explore ---
const ExploreQuerySchema = PaginationSchema.extend({
  cuisine: z.string().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  max_minutes: z.coerce.number().optional(),
  dietary: z.string().optional(), // implementation coming later
});

app.get('/explore', optionalAuth, zValidator('query', ExploreQuerySchema), async (c) => {
  const db = getDb(c);
  const user = c.get('user')!;
  const { limit, cursor, cuisine, difficulty, max_minutes } = c.req.valid('query');

  const decoded = cursor ? decodeCursor(cursor) : null;

  const query = db.select({
    id: recipes.id,
    title: recipes.title,
    coverImageUrl: recipes.coverImageUrl,
    heroImageUrl: recipes.heroImageUrl,
    cuisine: recipes.cuisine,
    difficulty: recipes.difficulty,
    prepMinutes: recipes.prepMinutes,
    cookMinutes: recipes.cookMinutes,
    servings: recipes.servings,
    likeCount: recipes.likeCount,
    saveCount: recipes.saveCount,
    isAiGenerated: recipes.isAiGenerated,
    createdAt: recipes.createdAt,
    author: {
      id: users.id,
      username: users.username,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
    }
  })
  .from(recipes)
  .innerJoin(users, eq(users.id, recipes.userId))
  .where(and(
    eq(recipes.status, 'published'),
    eq(recipes.visibility, 'public'),
    cuisine ? eq(recipes.cuisine, cuisine) : undefined,
    difficulty ? eq(recipes.difficulty, difficulty) : undefined,
    max_minutes ? sql`${recipes.prepMinutes} + ${recipes.cookMinutes} <= ${max_minutes}` : undefined,
    decoded ? or(
      lt(recipes.createdAt, decoded.createdAt),
      and(eq(recipes.createdAt, decoded.createdAt), lt(recipes.id, decoded.id))
    ) : undefined
  ))
  .orderBy(desc(recipes.createdAt), desc(recipes.id))
  .limit(limit);

  const results = await query;
  const recipesFormatted = await transformToRecipeCard(db, results, user?.id);
  
  const lastItem = results[results.length - 1];
  const nextCursor = (results.length === limit && lastItem) 
    ? encodeCursor(lastItem.createdAt, lastItem.id) 
    : null;

  return c.json({
    recipes: recipesFormatted,
    nextCursor
  });
});

// --- GET /feed/trending ---
app.get('/trending', optionalAuth, async (c) => {
  const redis = getRedis(c.env);
  const CACHE_KEY = 'dishly:feed:trending';
  
  const cached = await redis.get(CACHE_KEY);
  if (cached) {
    return c.json({
      recipes: cached,
      cached: true
    });
  }

  const db = getDb(c);
  const user = c.get('user')!;

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const trendingResults = await db.select({
    id: recipes.id,
    title: recipes.title,
    coverImageUrl: recipes.coverImageUrl,
    heroImageUrl: recipes.heroImageUrl,
    cuisine: recipes.cuisine,
    difficulty: recipes.difficulty,
    prepMinutes: recipes.prepMinutes,
    cookMinutes: recipes.cookMinutes,
    servings: recipes.servings,
    likeCount: recipes.likeCount,
    saveCount: recipes.saveCount,
    isAiGenerated: recipes.isAiGenerated,
    createdAt: recipes.createdAt,
    author: {
      id: users.id,
      username: users.username,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
    }
  })
  .from(recipes)
  .innerJoin(users, eq(users.id, recipes.userId))
  .where(and(
    eq(recipes.status, 'published'),
    eq(recipes.visibility, 'public'),
    gte(recipes.createdAt, sevenDaysAgo)
  ))
  .orderBy(desc(sql`${recipes.likeCount} * 2 + ${recipes.saveCount} * 3 + ${recipes.viewCount} * 0.1`))
  .limit(20);

  const recipesFormatted = await transformToRecipeCard(db, trendingResults, user?.id);

  await redis.set(CACHE_KEY, JSON.stringify(recipesFormatted), { ex: 300 });

  return c.json({
    recipes: recipesFormatted,
    cached: false
  });
});

// --- GET /feed/user/:username ---
app.get('/user/:username', optionalAuth, zValidator('query', PaginationSchema), async (c) => {
  const db = getDb(c);
  const username = c.req.param('username');
  const viewer = c.get('user')!;
  const { limit, cursor } = c.req.valid('query');

  const [targetUser] = await db.select().from(users).where(eq(users.username, username)).limit(1);
  if (!targetUser) return c.json({ error: 'User not found' }, 404);

  const decoded = cursor ? decodeCursor(cursor) : null;
  const isOwner = viewer?.id === targetUser.id;

  const query = db.select({
    id: recipes.id,
    title: recipes.title,
    coverImageUrl: recipes.coverImageUrl,
    heroImageUrl: recipes.heroImageUrl,
    cuisine: recipes.cuisine,
    difficulty: recipes.difficulty,
    prepMinutes: recipes.prepMinutes,
    cookMinutes: recipes.cookMinutes,
    servings: recipes.servings,
    likeCount: recipes.likeCount,
    saveCount: recipes.saveCount,
    isAiGenerated: recipes.isAiGenerated,
    createdAt: recipes.createdAt,
    author: {
      id: users.id,
      username: users.username,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
    }
  })
  .from(recipes)
  .innerJoin(users, eq(users.id, recipes.userId))
  .where(and(
    eq(recipes.userId, targetUser.id),
    isOwner 
      ? inArray(recipes.status, ['published', 'draft'])
      : and(eq(recipes.status, 'published'), inArray(recipes.visibility, ['public', 'followers'])),
    decoded ? or(
      lt(recipes.createdAt, decoded.createdAt),
      and(eq(recipes.createdAt, decoded.createdAt), lt(recipes.id, decoded.id))
    ) : undefined
  ))
  .orderBy(desc(recipes.createdAt), desc(recipes.id))
  .limit(limit);

  const results = await query;
  const recipesFormatted = await transformToRecipeCard(db, results, viewer?.id);

  const lastItem = results[results.length - 1];
  const nextCursor = (results.length === limit && lastItem) 
    ? encodeCursor(lastItem.createdAt, lastItem.id) 
    : null;

  return c.json({
    recipes: recipesFormatted,
    nextCursor
  });
});

export const feedRoutes = app;
