import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { Webhook } from 'svix';
import { createClerkClient } from '@clerk/backend';
import { users, follows, eq, sql } from '@dishly/db';
import { OnboardingSchema } from '@dishly/validators';
import type { CloudflareEnv, Variables } from '../types/env';
import { requireAuth, verifyClerkToken } from '../middleware/auth';
import { getDb } from '../lib/db';

const LocalOnboardingSchema = z.object({
  username: z.string().min(3).max(30),
  display_name: z.string().min(1).max(60),
  dietary_prefs: z.array(z.string()).optional(),
  skill_level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  cuisine_preferences: z.array(z.string()).optional(),
});

export const authRoutes = new Hono<{ Bindings: CloudflareEnv, Variables: Variables }>()
  /**
   * Onboarding: Create user in DB after Clerk sign-up
   */
  .post('/onboarding', verifyClerkToken, zValidator('json', LocalOnboardingSchema), async (c) => {
    const clerkId = c.get('clerkId') as string;
    const body = c.req.valid('json');
    const db = getDb(c);

    // Check if user already exists
    const [existingUser] = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);
    if (existingUser) {
      return c.json({ error: 'USER_ALREADY_EXISTS' }, 409);
    }

    // Check username uniqueness
    const [userWithUsername] = await db.select().from(users).where(eq(users.username, body.username)).limit(1);
    if (userWithUsername) {
      return c.json({ error: 'USERNAME_TAKEN' }, 422);
    }

    // Insert user
    const [newUser] = await db.insert(users).values({
      clerkId,
      username: body.username,
      displayName: body.display_name,
      dietaryPrefs: body.dietary_prefs as string[] || [],
      skillLevel: (body.skill_level as "beginner" | "intermediate" | "advanced") || 'beginner',
    }).returning();

    if (!newUser) {
      return c.json({ error: 'FAILED_TO_CREATE_USER' }, 500);
    }

    return c.json(newUser, 201);
  })

  /**
   * Get current user profile with follow counts
   */
  .get('/me', requireAuth, async (c) => {
    const user = c.get('user') as any;
    const db = getDb(c);

    // Count followers and following
    const [counts] = await db
      .select({
        followerCount: sql<number>`count(*) filter (where ${follows.followingId} = ${user.id})`,
        followingCount: sql<number>`count(*) filter (where ${follows.followerId} = ${user.id})`,
      })
      .from(follows)
      .where(sql`${follows.followingId} = ${user.id} or ${follows.followerId} = ${user.id}`);

    return c.json({
      ...user,
      follower_count: Number(counts?.followerCount || 0),
      following_count: Number(counts?.followingCount || 0),
    });
  })

  /**
   * Account Deletion
   */
  .delete('/account', requireAuth, async (c) => {
    const user = c.get('user') as any;
    const clerkId = c.get('clerkId') as string;
    const db = getDb(c);
    const clerk = createClerkClient({ secretKey: c.env.CLERK_SECRET_KEY });

    try {
      await db.transaction(async (tx: any) => {
        // 1. Delete from our DB (cascade handles related data)
        await tx.delete(users).where(eq(users.id, user.id));

        // 2. Delete from Clerk
        await clerk.users.deleteUser(clerkId);
      });

      return c.body(null, 204);
    } catch (err) {
      console.error('Account deletion error:', err);
      return c.json({ error: 'Deletion failed. Please try again.' }, 500);
    }
  })

  /**
   * Clerk Webhook Handler
   */
  .post('/webhook', async (c) => {
    const svix_id = c.req.header('svix-id');
    const svix_timestamp = c.req.header('svix-timestamp');
    const svix_signature = c.req.header('svix-signature');

    if (!svix_id || !svix_timestamp || !svix_signature) {
      return c.json({ error: 'Missing svix headers' }, 400);
    }

    const payload = await c.req.text();
    const wh = new Webhook(c.env.CLERK_WEBHOOK_SECRET);

    let evt: any;
    try {
      evt = wh.verify(payload, {
        'svix-id': svix_id,
        'svix-timestamp': svix_timestamp,
        'svix-signature': svix_signature,
      });
    } catch (err) {
      console.error('Webhook verification failed:', err);
      return c.json({ error: 'Invalid signature' }, 400);
    }

    const db = getDb(c);
    const { type, data } = evt;

    if (type === 'user.deleted') {
      const clerkId = data.id;
      await db.delete(users).where(eq(users.clerkId, clerkId));
      console.log(`User ${clerkId} deleted via webhook`);
    } else if (type === 'user.created') {
      console.log(`User ${data.id} created event received`);
    }

    return c.json({ success: true });
  });
