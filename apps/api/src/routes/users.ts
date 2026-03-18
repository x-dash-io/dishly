import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { eq, and, ne, sql } from 'drizzle-orm';
import { users, follows, recipes, saves, collections } from '@dishly/db';
import { UpdateProfileSchema } from '@dishly/validators';
import type { CloudflareEnv, Variables } from '../types/env';
import { requireAuth, optionalAuth, verifyClerkToken } from '../middleware/auth';
import { getDb } from '../lib/db';
import { rateLimit } from '../middleware/rate-limit';
import { getRedis } from '../lib/redis';
import { withCache, invalidateCache } from '../lib/cache';

export const userRoutes = new Hono<{ Bindings: CloudflareEnv, Variables: Variables }>()
  /**
   * GET /users/:id/saved
   * Get paginated saved recipes for a user. Only callable by the owner.
   */
  .get('/:id/saved', requireAuth, async (c) => {
    const targetUserId = c.req.param('id');
    const currentUser = c.get('user')!;
    const db = getDb(c);

    // MVP: Only the owner can view their saved recipes
    if (targetUserId !== currentUser.id) {
      return c.json({ error: 'Unauthorized to view these saves' }, 403);
    }

    const limit = 12;
    const cursorStr = c.req.query('cursor');
    const cursor = cursorStr ? new Date(cursorStr) : new Date();

    const savedRecipesRaw = await db
      .select({
        recipe: recipes,
        savedAt: saves.createdAt,
        author: users
      })
      .from(saves)
      .innerJoin(recipes, eq(saves.recipeId, recipes.id))
      .innerJoin(users, eq(recipes.userId, users.id))
      .where(
        and(
          eq(saves.userId, currentUser.id),
          sql`${saves.createdAt} < ${cursor.toISOString()}`
        )
      )
      .orderBy(sql`${saves.createdAt} DESC`)
      .limit(limit + 1);

    const hasNextPage = savedRecipesRaw.length > limit;
    const itemsToReturn = savedRecipesRaw.slice(0, limit);
    const nextCursor = hasNextPage ? itemsToReturn[itemsToReturn.length - 1].savedAt.toISOString() : undefined;

    // We format it as RecipeCardItem since the UI expects a standard grid
    const formatted = itemsToReturn.map(r => ({
      id: r.recipe.id,
      title: r.recipe.title,
      cover_image_url: r.recipe.coverImageUrl,
      hero_image_url: r.recipe.heroImageUrl,
      cuisine: r.recipe.cuisine,
      difficulty: r.recipe.difficulty,
      prep_minutes: r.recipe.prepMinutes,
      cook_minutes: r.recipe.cookMinutes,
      servings: r.recipe.servings,
      like_count: r.recipe.likeCount,
      save_count: r.recipe.saveCount,
      is_ai_generated: r.recipe.isAiGenerated,
      created_at: r.recipe.createdAt.toISOString(),
      author: {
        id: r.author.id,
        username: r.author.username,
        display_name: r.author.displayName,
        avatar_url: r.author.avatarUrl,
      },
      viewer: {
        liked: false, // Could be queried, but let's assume false or fetch it for completeness later
        saved: true,  // It's in their saved list
      }
    }));

    return c.json({
      items: formatted,
      nextCursor
    });
  })

  /**
   * GET /users/:username
   * Public profile page data
   */
  .get('/:username', optionalAuth, async (c) => {
    const username = c.req.param('username');
    const db = getDb(c);
    const redis = getRedis(c.env);
    const viewer = c.get('user');

    // 1. Cache static profile data (user row + counts) for 3 minutes
    // Viewer's follow state is always fetched live — it changes on every follow/unfollow
    const profile = await withCache(
      redis,
      `dishly:user:${username}`,
      180,
      async () => {
        const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1);
        if (!user) return null;

        const [counts] = await db
          .select({
            followerCount: sql<number>`count(*) filter (where ${follows.followingId} = ${user.id})`,
            followingCount: sql<number>`count(*) filter (where ${follows.followerId} = ${user.id})`,
          })
          .from(follows)
          .where(sql`${follows.followingId} = ${user.id} or ${follows.followerId} = ${user.id}`);

        const [recipeCountResult] = await db
          .select({ count: sql<number>`count(*)` })
          .from(recipes)
          .where(and(eq(recipes.userId, user.id), eq(recipes.status, 'published')));

        return { user, counts, recipeCount: recipeCountResult?.count ?? 0 };
      }
    );

    if (!profile) return c.json({ error: 'User not found' }, 404);
    const { user, counts, recipeCount } = profile;

    // 3. Check if viewer follows this user — always live, never cached
    let following = false;
    if (viewer) {
      const [follow] = await db
        .select()
        .from(follows)
        .where(and(eq(follows.followerId, viewer.id), eq(follows.followingId, user.id)))
        .limit(1);
      following = !!follow;
    }

    return c.json({
      id: user.id,
      username: user.username,
      display_name: user.displayName,
      avatar_url: user.avatarUrl,
      bio: user.bio,
      dietary_prefs: user.dietaryPrefs,
      skill_level: user.skillLevel,
      created_at: user.createdAt,
      stats: {
        follower_count: Number(counts?.followerCount || 0),
        following_count: Number(counts?.followingCount || 0),
        recipe_count: Number(recipeCount || 0),
      },
      viewer: viewer ? { following } : null,
    });
  })

  /**
   * PATCH /users/me
   * Update the current user's profile
   */
  .patch('/me', requireAuth, zValidator('json', UpdateProfileSchema), async (c) => {
    const currentUser = c.get('user')!;
    const body = c.req.valid('json');
    const db = getDb(c);

    // 1. If username is being changed, check uniqueness
    if (body.username && body.username !== currentUser.username) {
      const [existing] = await db
        .select()
        .from(users)
        .where(and(eq(users.username, body.username), ne(users.id, currentUser.id)))
        .limit(1);
      
      if (existing) {
        return c.json({ error: 'USERNAME_TAKEN' }, 422);
      }
    }

    // 2. Update users table
    const [updatedUser] = await db
      .update(users)
      .set({
        username: body.username,
        displayName: body.display_name,
        avatarUrl: (body as Record<string, unknown>).avatar_url as string ?? currentUser.avatarUrl,
        bio: body.bio,
        dietaryPrefs: body.dietary_prefs as string[],
        skillLevel: body.skill_level as "beginner" | "intermediate" | "advanced",
        updatedAt: new Date(),
      })
      .where(eq(users.id, currentUser.id))
      .returning();

    // Invalidate both old and new username keys in case username changed
    c.executionCtx.waitUntil(
      invalidateCache(
        getRedis(c.env),
        `dishly:user:${currentUser.username}`,
        `dishly:user:${body.username ?? currentUser.username}`
      )
    );

    return c.json(updatedUser);
  })

  /**
   * POST /users/:id/follow (toggle)
   * Auth: requireAuth
   */
  .post('/:id/follow', requireAuth, async (c) => {
    const targetUserId = c.req.param('id');
    const currentUser = c.get('user')!;
    const db = getDb(c);

    // 1. Prevent self-follow
    if (targetUserId === currentUser.id) {
      return c.json({ error: 'Cannot follow yourself' }, 422);
    }

    // 2. Verify target user exists
    const [targetUser] = await db.select().from(users).where(eq(users.id, targetUserId)).limit(1);
    if (!targetUser) {
      return c.json({ error: 'User not found' }, 404);
    }

    // 3. Check if already following
    const [existingFollow] = await db
      .select()
      .from(follows)
      .where(
        and(
          eq(follows.followerId, currentUser.id),
          eq(follows.followingId, targetUserId)
        )
      )
      .limit(1);

    if (existingFollow) {
      // Unfollow
      await db
        .delete(follows)
        .where(and(eq(follows.followerId, currentUser.id), eq(follows.followingId, targetUserId)));
      // Invalidate target's cached follower count
      c.executionCtx.waitUntil(
        invalidateCache(getRedis(c.env), `dishly:user:${targetUser.username}`)
      );
      return c.json({ following: false });
    } else {
      // Follow
      await db.insert(follows).values({ followerId: currentUser.id, followingId: targetUserId });
      // Invalidate target's cached follower count
      c.executionCtx.waitUntil(
        invalidateCache(getRedis(c.env), `dishly:user:${targetUser.username}`)
      );
      return c.json({ following: true });
    }
  })

  /**
   * GET /users/check-username
   * Availability check for onboarding
   */
  .get('/check-username', verifyClerkToken, rateLimit('api'), async (c) => {
    const username = c.req.query('username');
    const currentClerkId = c.get('clerkId');
    
    if (!username) {
      return c.json({ error: 'Username required' }, 400);
    }

    // 1. Validate format
    if (!/^[a-z0-9_]{3,30}$/.test(username)) {
      return c.json({ available: false, error: 'INVALID_FORMAT' });
    }

    // 2. Check availability
    // Exclude current user (by clerkId since they might not be in DB yet)
    const db = getDb(c);
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.username, username), ne(users.clerkId, currentClerkId)))
      .limit(1);

    return c.json({ available: !existing });
  })
  /**
   * POST /users/me/push-token
   * Store or update the user's Expo push notification token.
   */
  .post(
    '/me/push-token',
    requireAuth,
    zValidator('json', z.object({
      token: z.string().startsWith('ExponentPushToken['),
    })),
    async (c) => {
      const currentUser = c.get('user')!;
      const { token } = c.req.valid('json');
      const db = getDb(c);

      await db
        .update(users)
        .set({ pushToken: token })
        .where(eq(users.id, currentUser.id));

      return c.json({ ok: true });
    }
  )
  /**
   * GET /users/me/collections
   * Returns all collections for the authenticated user with cover image mosaic.
   */
  .get('/me/collections', requireAuth, async (c) => {
    const user = c.get('user')!;
    const db = getDb(c);

    const userCollections = await db
      .select()
      .from(collections)
      .where(eq(collections.userId, user.id))
      .orderBy(collections.createdAt);

    // Fetch first 4 recipe cover images per collection for the mosaic
    const result = await Promise.all(
      userCollections.map(async (col) => {
        const coverImages = await db
          .select({ url: recipes.coverImageUrl, hero: recipes.heroImageUrl })
          .from(saves)
          .innerJoin(recipes, eq(saves.recipeId, recipes.id))
          .where(and(eq(saves.collectionId, col.id)))
          .limit(4);

        return {
          id: col.id,
          name: col.name,
          is_public: col.isPublic ?? false,
          recipe_count: col.recipeCount ?? 0,
          cover_images: coverImages.map(r => r.url ?? r.hero).filter(Boolean) as string[],
          created_at: col.createdAt.toISOString(),
        };
      })
    );

    return c.json(result);
  })

  /**
   * POST /users/me/collections
   * Create a new collection.
   */
  .post(
    '/me/collections',
    requireAuth,
    zValidator('json', z.object({
      name: z.string().min(1).max(60),
      is_public: z.boolean().default(false),
    })),
    async (c) => {
      const user = c.get('user')!;
      const { name, is_public } = c.req.valid('json');
      const db = getDb(c);

      const [col] = await db
        .insert(collections)
        .values({ userId: user.id, name, isPublic: is_public })
        .returning();

      return c.json({
        id: col.id,
        name: col.name,
        is_public: col.isPublic ?? false,
        recipe_count: 0,
        cover_images: [],
        created_at: col.createdAt.toISOString(),
      }, 201);
    }
  )

  /**
   * DELETE /users/me/collections/:collectionId
   * Delete a collection. Cascade removes saves in this collection.
   */
  .delete('/me/collections/:collectionId', requireAuth, async (c) => {
    const user = c.get('user')!;
    const collectionId = c.req.param('collectionId');
    const db = getDb(c);

    const [col] = await db
      .select()
      .from(collections)
      .where(and(eq(collections.id, collectionId), eq(collections.userId, user.id)))
      .limit(1);

    if (!col) return c.json({ error: 'Collection not found' }, 404);

    // Disassociate saves from this collection (don't delete the saves themselves)
    await db
      .update(saves)
      .set({ collectionId: null })
      .where(eq(saves.collectionId, collectionId));

    await db.delete(collections).where(eq(collections.id, collectionId));
    return c.body(null, 204);
  })

  /**
   * GET /users/me/collections/:collectionId/recipes
   * Paginated recipes in a specific collection.
   */
  .get('/me/collections/:collectionId/recipes', requireAuth, async (c) => {
    const user = c.get('user')!;
    const collectionId = c.req.param('collectionId');
    const db = getDb(c);

    const [col] = await db
      .select()
      .from(collections)
      .where(eq(collections.id, collectionId))
      .limit(1);

    if (!col) return c.json({ error: 'Collection not found' }, 404);
    if (col.userId !== user.id && !col.isPublic) {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    const limit = 20;
    const cursorStr = c.req.query('cursor');
    const cursor = cursorStr ? new Date(cursorStr) : new Date();

    const rows = await db
      .select({
        recipe: recipes,
        savedAt: saves.createdAt,
        author: users,
      })
      .from(saves)
      .innerJoin(recipes, eq(saves.recipeId, recipes.id))
      .innerJoin(users, eq(recipes.userId, users.id))
      .where(
        and(
          eq(saves.collectionId, collectionId),
          sql`${saves.createdAt} < ${cursor.toISOString()}`
        )
      )
      .orderBy(sql`${saves.createdAt} DESC`)
      .limit(limit + 1);

    const hasNext = rows.length > limit;
    const items = rows.slice(0, limit);
    const nextCursor = hasNext ? items[items.length - 1].savedAt.toISOString() : null;

    return c.json({
      collection: { id: col.id, name: col.name, is_public: col.isPublic },
      recipes: items.map(r => ({
        id: r.recipe.id,
        title: r.recipe.title,
        cover_image_url: r.recipe.coverImageUrl,
        hero_image_url: r.recipe.heroImageUrl,
        cuisine: r.recipe.cuisine,
        difficulty: r.recipe.difficulty,
        prep_minutes: r.recipe.prepMinutes,
        cook_minutes: r.recipe.cookMinutes,
        servings: r.recipe.servings,
        like_count: r.recipe.likeCount ?? 0,
        save_count: r.recipe.saveCount ?? 0,
        is_ai_generated: r.recipe.isAiGenerated ?? false,
        created_at: r.recipe.createdAt.toISOString(),
        author: {
          id: r.author.id,
          username: r.author.username,
          display_name: r.author.displayName,
          avatar_url: r.author.avatarUrl,
        },
        viewer: null,
      })),
      nextCursor,
    });
  });
