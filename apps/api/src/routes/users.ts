import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { eq, and, ne, sql } from 'drizzle-orm';
import { users, follows, recipes } from '@dishly/db';
import { UpdateProfileSchema } from '@dishly/validators';
import type { CloudflareEnv, Variables } from '../types/env';
import { requireAuth, optionalAuth, verifyClerkToken } from '../middleware/auth';
import { getDb } from '../lib/db';
import { rateLimit } from '../middleware/rate-limit';

export const userRoutes = new Hono<{ Bindings: CloudflareEnv, Variables: Variables }>()
  /**
   * GET /users/:username
   * Public profile page data
   */
  .get('/:username', optionalAuth, async (c) => {
    const username = c.req.param('username');
    const db = getDb(c);
    const viewer = c.get('user');

    // 1. SELECT user by username
    const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1);

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    // 2. Get counts (follower, following, recipes)
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

    // 3. Check if viewer follows this user
    let following = false;
    if (viewer) {
      const [follow] = await db
        .select()
        .from(follows)
        .where(
          and(
            eq(follows.followerId, viewer.id),
            eq(follows.followingId, user.id)
          )
        )
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
        recipe_count: Number(recipeCountResult?.count || 0),
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
        bio: body.bio,
        dietaryPrefs: body.dietary_prefs as string[],
        skillLevel: body.skill_level as "beginner" | "intermediate" | "advanced",
        updatedAt: new Date(),
      })
      .where(eq(users.id, currentUser.id))
      .returning();

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
        .where(
          and(
            eq(follows.followerId, currentUser.id),
            eq(follows.followingId, targetUserId)
          )
        );
      return c.json({ following: false });
    } else {
      // Follow
      await db.insert(follows).values({
        followerId: currentUser.id,
        followingId: targetUserId,
      });
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
  });
