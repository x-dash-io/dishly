import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { 
  recipes, 
  ingredients, 
  steps, 
  nutrition, 
  users, 
  likes, 
  saves, 
  comments,
  collections,
  follows,
  notificationBatches,
  eq, 
  and, 
  desc, 
  asc,
  sql,
  isNull,
} from '@dishly/db';
import { alias } from 'drizzle-orm/pg-core';
import { 
  CreateRecipeSchema, 
  UpdateRecipeSchema, 
  PublishRecipeSchema 
} from '@dishly/validators';
import { PaginationSchema } from '@dishly/validators';
import { getDb } from '../lib/db';
import { requireAuth, optionalAuth } from '../middleware/auth';
import type { CloudflareEnv, Variables } from '../types/env';
import { deleteR2Object, getR2Client } from '../lib/r2';
import { sendPushToUser } from '../lib/notifications';

const app = new Hono<{ Bindings: CloudflareEnv; Variables: Variables }>();

// --- 1. CORE CRUD ---

app.post('/', requireAuth, zValidator('json', CreateRecipeSchema), async (c) => {
  const db = getDb(c);
  const user = c.get('user')!;
  const body = c.req.valid('json');

  try {
    const result = await db.transaction(async (tx) => {
      const [newRecipe] = await tx.insert(recipes).values({
        userId: user.id,
        title: body.title,
        description: body.description,
        cuisine: body.cuisine,
        difficulty: body.difficulty,
        prepMinutes: body.prep_minutes,
        cookMinutes: body.cook_minutes,
        servings: body.servings,
        coverImageUrl: body.cover_image_url,
        heroImageUrl: body.hero_image_url,
        status: 'draft',
        visibility: body.visibility,
      }).returning();

      if (body.ingredients.length > 0) {
        await tx.insert(ingredients).values(
          body.ingredients.map((ing) => ({
            recipeId: newRecipe.id,
            name: ing.name,
            quantity: ing.quantity,
            unit: ing.unit,
            notes: ing.notes,
            orderIndex: ing.order_index,
          }))
        );
      }

      if (body.steps.length > 0) {
        await tx.insert(steps).values(
          body.steps.map((step) => ({
            recipeId: newRecipe.id,
            instruction: step.instruction,
            imageUrl: step.image_url,
            timerSeconds: step.timer_seconds,
            orderIndex: step.order_index,
          }))
        );
      }
      return newRecipe;
    });

    const [recipeIngredients, recipeSteps] = await Promise.all([
      db.select().from(ingredients).where(eq(ingredients.recipeId, result.id)).orderBy(asc(ingredients.orderIndex)),
      db.select().from(steps).where(eq(steps.recipeId, result.id)).orderBy(asc(steps.orderIndex)),
    ]);

    return c.json({
      ...result,
      ingredients: recipeIngredients,
      steps: recipeSteps,
      nutrition: null,
    }, 201);
  } catch (error) {
    console.error('Failed to create recipe', error);
    return c.json({ error: 'Failed to create recipe' }, 500);
  }
});

app.get('/:id', optionalAuth, async (c) => {
  const db = getDb(c);
  const id = c.req.param('id');
  const currentUser = c.get('user');

  const [recipe] = await db.select().from(recipes).where(eq(recipes.id, id)).limit(1);
  if (!recipe) return c.json({ error: 'Recipe not found' }, 404);

  if (recipe.status !== 'published' && (!currentUser || currentUser.id !== recipe.userId)) {
    return c.json({ error: 'Recipe not found' }, 404);
  }

  c.executionCtx.waitUntil(
    db.update(recipes).set({ viewCount: (recipe.viewCount || 0) + 1 }).where(eq(recipes.id, id))
  );

  const [recipeIngredients, recipeSteps, recipeNutrition, [author]] = await Promise.all([
    db.select().from(ingredients).where(eq(ingredients.recipeId, id)).orderBy(asc(ingredients.orderIndex)),
    db.select().from(steps).where(eq(steps.recipeId, id)).orderBy(asc(steps.orderIndex)),
    db.select().from(nutrition).where(eq(nutrition.recipeId, id)).limit(1),
    db.select({
      id: users.id,
      username: users.username,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
    }).from(users).where(eq(users.id, recipe.userId)).limit(1),
  ]);

  let viewerState = null;
  if (currentUser) {
    const [[likeRecord], [saveRecord]] = await Promise.all([
      db.select().from(likes).where(and(eq(likes.userId, currentUser.id), eq(likes.recipeId, id))).limit(1),
      db.select().from(saves).where(and(eq(saves.userId, currentUser.id), eq(saves.recipeId, id))).limit(1),
    ]);
    viewerState = { liked: !!likeRecord, saved: !!saveRecord };
  }

  const viewer: { liked: boolean; saved: boolean } | null = viewerState;
  
  return c.json({
    ...recipe,
    ingredients: recipeIngredients,
    steps: recipeSteps,
    nutrition: recipeNutrition || null,
    author: {
      id: author.id,
      username: author.username,
      displayName: author.displayName,
      avatarUrl: author.avatarUrl,
    },
    viewer,
  });
});

app.patch('/:id', requireAuth, zValidator('json', UpdateRecipeSchema), async (c) => {
  const db = getDb(c);
  const id = c.req.param('id');
  const user = c.get('user')!;
  const body = c.req.valid('json');

  const [existing] = await db.select().from(recipes).where(eq(recipes.id, id)).limit(1);
  if (!existing || existing.userId !== user.id) return c.json({ error: 'Recipe not found' }, 404);

  if (existing.status === 'published') {
    const allowedFields = ['title', 'description', 'visibility', 'heroImageUrl'];
    const keys = Object.keys(body);
    if (keys.some(k => !allowedFields.includes(k) && k !== 'ingredients' && k !== 'steps') || body.ingredients || body.steps) {
      return c.json({ error: 'PUBLISHED_RECIPE_LIMITED_EDIT', code: 'UNAUTHORIZED_EDIT' }, 422);
    }
  }

  try {
    await db.transaction(async (tx) => {
      const updateData: Partial<typeof recipes.$inferInsert> = {};
      if (body.title) updateData.title = body.title;
      if (body.description) updateData.description = body.description;
      if (body.cuisine) updateData.cuisine = body.cuisine;
      if (body.difficulty) updateData.difficulty = body.difficulty;
      if (body.prep_minutes !== undefined) updateData.prepMinutes = body.prep_minutes;
      if (body.cook_minutes !== undefined) updateData.cookMinutes = body.cook_minutes;
      if (body.servings !== undefined) updateData.servings = body.servings;
      if (body.cover_image_url) updateData.coverImageUrl = body.cover_image_url;
      if (body.hero_image_url) updateData.heroImageUrl = body.hero_image_url;
      if (body.visibility) updateData.visibility = body.visibility;
      if (body.status) updateData.status = body.status;

      if (Object.keys(updateData).length > 0) {
        await tx.update(recipes).set(updateData).where(eq(recipes.id, id));
      }

      if (body.ingredients) {
        await tx.delete(ingredients).where(eq(ingredients.recipeId, id));
        if (body.ingredients.length > 0) {
          await tx.insert(ingredients).values(body.ingredients.map(ing => ({ recipeId: id, ...ing, orderIndex: ing.order_index })));
        }
      }

      if (body.steps) {
        await tx.delete(steps).where(eq(steps.recipeId, id));
        if (body.steps.length > 0) {
          await tx.insert(steps).values(body.steps.map(step => ({ 
            recipeId: id, 
            instruction: step.instruction, 
            imageUrl: step.image_url, 
            timerSeconds: step.timer_seconds, 
            orderIndex: step.order_index 
          })));
        }
      }
    });
    return c.json({ success: true });
  } catch (error) {
    console.error('Update failed', error);
    return c.json({ error: 'Failed to update recipe' }, 500);
  }
});

app.post('/:id/publish', requireAuth, zValidator('json', PublishRecipeSchema), async (c) => {
  const db = getDb(c);
  const id = c.req.param('id');
  const user = c.get('user')!;
  const body = c.req.valid('json');

  const [recipe] = await db.select().from(recipes).where(eq(recipes.id, id)).limit(1);
  if (!recipe || recipe.userId !== user.id) return c.json({ error: 'Recipe not found' }, 404);
  if (recipe.status !== 'draft') return c.json({ error: 'Can only publish drafts' }, 422);

  const [ings, stps] = await Promise.all([
    db.select().from(ingredients).where(eq(ingredients.recipeId, id)),
    db.select().from(steps).where(eq(steps.recipeId, id)),
  ]);

  const missing: string[] = [];
  if (ings.length === 0) missing.push('ingredients');
  if (stps.length === 0) missing.push('steps');
  if (!body.hero_image_url && !recipe.heroImageUrl) missing.push('hero_dish_photo');

  if (missing.length > 0) return c.json({ error: 'PUBLISH_VALIDATION_FAILED', missing }, 422);

  await db.update(recipes).set({
    status: 'published',
    visibility: body.visibility,
    heroImageUrl: body.hero_image_url || recipe.heroImageUrl,
  }).where(eq(recipes.id, id));

  // Notify followers — fire-and-forget, never block the response
  c.executionCtx.waitUntil((async () => {
    try {
      const followerRows = await db
        .select({ userId: follows.followerId })
        .from(follows)
        .where(eq(follows.followingId, user.id));

      await Promise.all(
        followerRows.slice(0, 100).map(f =>
          sendPushToUser(db, f.userId, {
            title: `${user.displayName} posted a new recipe`,
            body: recipe.title,
            data: { type: 'new_recipe', recipeId: recipe.id },
          })
        )
      );
    } catch {
      // Push failures never affect the publish response
    }
  })());

  return c.json({ success: true });
});

app.delete('/:id', requireAuth, async (c) => {
  const db = getDb(c);
  const id = c.req.param('id');
  const user = c.get('user')!;

  const [recipe] = await db.select().from(recipes).where(eq(recipes.id, id)).limit(1);
  if (!recipe || recipe.userId !== user.id) return c.json({ error: 'Recipe not found' }, 404);

  await db.update(recipes).set({ status: 'archived' }).where(eq(recipes.id, id));

  c.executionCtx.waitUntil((async () => {
    const allSteps = await db.select().from(steps).where(eq(steps.recipeId, id));
    const urls = [recipe.coverImageUrl, recipe.heroImageUrl, ...allSteps.map(s => s.imageUrl)].filter(Boolean) as string[];
    const r2Client = getR2Client(c.env);
    for (const url of urls) {
      try {
        const urlObj = new URL(url);
        const key = urlObj.pathname.startsWith('/') ? urlObj.pathname.slice(1) : urlObj.pathname;
        await deleteR2Object(r2Client, c.env, key);
      } catch (e) { console.error(`Failed to delete image: ${url}`, e); }
    }
  })());

  return c.body(null, 204);
});

// --- 2. SOCIAL ---

app.post('/:id/like', requireAuth, async (c) => {
  const db = getDb(c);
  const id = c.req.param('id');
  const user = c.get('user')!;

  try {
    const result = await db.transaction(async (tx) => {
      const [existing] = await tx.select().from(likes).where(and(eq(likes.userId, user.id), eq(likes.recipeId, id))).limit(1);
      if (existing) {
        await tx.delete(likes).where(and(eq(likes.userId, user.id), eq(likes.recipeId, id)));
        const [updated] = await tx.update(recipes).set({ likeCount: sql`${recipes.likeCount} - 1` }).where(eq(recipes.id, id)).returning();
        return { liked: false, like_count: updated.likeCount || 0 };
      } else {
        await tx.insert(likes).values({ userId: user.id, recipeId: id });
        const [updated] = await tx.update(recipes).set({ likeCount: sql`${recipes.likeCount} + 1` }).where(eq(recipes.id, id)).returning();
        return { liked: true, like_count: updated.likeCount || 0, recipe: updated };
      }
    });

    // On a new like (not unlike): upsert notification batch — fire-and-forget
    if (result.liked) {
      const likedRecipe = (result as typeof result & { recipe?: typeof recipes.$inferSelect }).recipe;
      if (likedRecipe && likedRecipe.userId !== user.id) {
        c.executionCtx.waitUntil((async () => {
          try {
            const [existing] = await db
              .select()
              .from(notificationBatches)
              .where(
                and(
                  eq(notificationBatches.userId, likedRecipe.userId),
                  eq(notificationBatches.type, 'likes'),
                  eq(notificationBatches.recipeId, id),
                  eq(notificationBatches.sent, false)
                )
              )
              .limit(1);

            if (existing) {
              await db
                .update(notificationBatches)
                .set({ count: existing.count + 1, lastActorName: user.displayName })
                .where(eq(notificationBatches.id, existing.id));
            } else {
              await db.insert(notificationBatches).values({
                userId: likedRecipe.userId,
                type: 'likes',
                recipeId: id,
                count: 1,
                lastActorName: user.displayName,
              });
            }
          } catch {
            // Notification batch failure never affects the like response
          }
        })());
      }
    }

    return c.json({ liked: result.liked, like_count: result.like_count });
  } catch { return c.json({ error: 'Failed to toggle like' }, 500); }
});

app.post('/:id/save', requireAuth, zValidator('json', z.object({ collection_id: z.string().uuid().optional() }).optional()), async (c) => {
  const db = getDb(c);
  const id = c.req.param('id');
  const user = c.get('user')!;
  const body = c.req.valid('json');

  try {
    const result = await db.transaction(async (tx) => {
      const [existing] = await tx.select().from(saves).where(and(eq(saves.userId, user.id), eq(saves.recipeId, id))).limit(1);
      if (existing) {
        await tx.delete(saves).where(eq(saves.id, existing.id));
        const [updated] = await tx.update(recipes).set({ saveCount: sql`${recipes.saveCount} - 1` }).where(eq(recipes.id, id)).returning();
        if (existing.collectionId) await tx.update(collections).set({ recipeCount: sql`${collections.recipeCount} - 1` }).where(eq(collections.id, existing.collectionId));
        return { saved: false, save_count: updated.saveCount || 0 };
      } else {
        if (body?.collection_id) {
          const [coll] = await tx.select().from(collections).where(and(eq(collections.id, body.collection_id), eq(collections.userId, user.id))).limit(1);
          if (!coll) return tx.rollback();
        }
        await tx.insert(saves).values({ userId: user.id, recipeId: id, collectionId: body?.collection_id });
        const [updated] = await tx.update(recipes).set({ saveCount: sql`${recipes.saveCount} + 1` }).where(eq(recipes.id, id)).returning();
        if (body?.collection_id) await tx.update(collections).set({ recipeCount: sql`${collections.recipeCount} + 1` }).where(eq(collections.id, body.collection_id));
        return { saved: true, save_count: updated.saveCount || 0 };
      }
    });
    return c.json(result);
  } catch (e) { return c.json({ error: 'Failed to toggle save' }, 500); }
});

// --- 3. COMMENTS ---

app.get('/:id/comments', optionalAuth, zValidator('query', PaginationSchema), async (c) => {
  const db = getDb(c);
  const recipeId = c.req.param('id');
  const { limit, cursor } = c.req.valid('query');

  const authorTable = alias(users, 'comment_author');
  const replyAuthorTable = alias(users, 'reply_author');

  const topLevelComments = await db.select({
    id: comments.id,
    body: comments.body,
    createdAt: comments.createdAt,
    author: { id: authorTable.id, username: authorTable.username, avatarUrl: authorTable.avatarUrl }
  })
  .from(comments)
  .innerJoin(authorTable, eq(comments.userId, authorTable.id))
  .where(and(eq(comments.recipeId, recipeId), isNull(comments.parentId), cursor ? sql`${comments.id} < ${cursor}` : undefined))
  .orderBy(desc(comments.createdAt))
  .limit(limit);

  const commentsWithReplies = await Promise.all(topLevelComments.map(async (comment) => {
    const replies = await db.select({
      id: comments.id,
      body: comments.body,
      createdAt: comments.createdAt,
      author: { id: replyAuthorTable.id, username: replyAuthorTable.username, avatarUrl: replyAuthorTable.avatarUrl }
    })
    .from(comments)
    .innerJoin(replyAuthorTable, eq(comments.userId, replyAuthorTable.id))
    .where(eq(comments.parentId, comment.id))
    .orderBy(asc(comments.createdAt))
    .limit(2);
    return { ...comment, replies };
  }));

  const nextCursor = topLevelComments.length === limit ? topLevelComments[topLevelComments.length - 1].id : null;
  return c.json({ comments: commentsWithReplies, nextCursor });
});

app.post('/:id/comments', requireAuth, zValidator('json', z.object({ body: z.string().min(1).max(1000), parent_id: z.string().uuid().optional() })), async (c) => {
  const db = getDb(c);
  const recipeId = c.req.param('id');
  const user = c.get('user')!;
  const { body, parent_id } = c.req.valid('json');

  if (parent_id) {
    const [parent] = await db.select().from(comments).where(and(eq(comments.id, parent_id), eq(comments.recipeId, recipeId))).limit(1);
    if (!parent) return c.json({ error: 'Parent comment not found' }, 404);
  }

  const [newComment] = await db.insert(comments).values({ recipeId, userId: user.id, body, parentId: parent_id }).returning();

  // Notify the recipe owner — fire-and-forget, skip if commenter is the owner
  c.executionCtx.waitUntil((async () => {
    try {
      const [recipe] = await db
        .select({ userId: recipes.userId, title: recipes.title })
        .from(recipes)
        .where(eq(recipes.id, recipeId))
        .limit(1);

      if (recipe && recipe.userId !== user.id) {
        await sendPushToUser(db, recipe.userId, {
          title: `${user.displayName} commented on ${recipe.title}`,
          body: body.slice(0, 80),
          data: { type: 'comment', recipeId },
        });
      }
    } catch {
      // Push failure never affects the comment response
    }
  })());

  return c.json({ ...newComment, author: { id: user.id, username: user.username, avatarUrl: user.avatarUrl } }, 201);
});

export const recipeRoutes = app;
