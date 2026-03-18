import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { eq, and, inArray } from 'drizzle-orm';
import { mealPlans, mealPlanItems, recipes, ingredients, users } from '@dishly/db';
import type { CloudflareEnv, Variables } from '../types/env';
import { requireAuth } from '../middleware/auth';
import { getDb } from '../lib/db';

const app = new Hono<{ Bindings: CloudflareEnv; Variables: Variables }>();

// Compute the ISO date string for Monday of the current week
function getWeekStart(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10); // "YYYY-MM-DD"
}

/**
 * GET /meal-plans/current
 * Returns (or creates) the meal plan for the current week.
 * Includes all items with recipe card data.
 */
app.get('/current', requireAuth, async (c) => {
  const user = c.get('user')!;
  const db = getDb(c);
  const weekStart = getWeekStart();

  // Get-or-create the meal plan row
  let [plan] = await db
    .select()
    .from(mealPlans)
    .where(and(eq(mealPlans.userId, user.id), eq(mealPlans.weekStartDate, weekStart)))
    .limit(1);

  if (!plan) {
    [plan] = await db
      .insert(mealPlans)
      .values({ userId: user.id, weekStartDate: weekStart })
      .returning();
  }

  // Fetch items with recipe info
  const itemRows = await db
    .select({
      id: mealPlanItems.id,
      dayOfWeek: mealPlanItems.dayOfWeek,
      mealType: mealPlanItems.mealType,
      recipeId: mealPlanItems.recipeId,
      recipeTitle: recipes.title,
      recipeCoverImage: recipes.coverImageUrl,
      recipeHeroImage: recipes.heroImageUrl,
      recipeTime: recipes.cookMinutes,
    })
    .from(mealPlanItems)
    .leftJoin(recipes, eq(mealPlanItems.recipeId, recipes.id))
    .where(eq(mealPlanItems.mealPlanId, plan.id))
    .orderBy(mealPlanItems.dayOfWeek);

  return c.json({
    id: plan.id,
    week_start: plan.weekStartDate,
    items: itemRows.map(row => ({
      id: row.id,
      day_of_week: row.dayOfWeek,
      meal_type: row.mealType,
      recipe: row.recipeId
        ? {
            id: row.recipeId,
            title: row.recipeTitle,
            cover_image_url: row.recipeCoverImage,
            hero_image_url: row.recipeHeroImage,
            cook_minutes: row.recipeTime,
          }
        : null,
    })),
  });
});

/**
 * POST /meal-plans/items
 * Add a recipe to a day/meal slot. Replaces any existing item in that slot.
 */
app.post(
  '/items',
  requireAuth,
  zValidator(
    'json',
    z.object({
      recipe_id: z.string().uuid(),
      day_of_week: z.number().int().min(0).max(6),
      meal_type: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
    })
  ),
  async (c) => {
    const user = c.get('user')!;
    const db = getDb(c);
    const { recipe_id, day_of_week, meal_type } = c.req.valid('json');
    const weekStart = getWeekStart();

    // Verify the recipe exists and is accessible
    const [recipe] = await db
      .select({ id: recipes.id, userId: recipes.userId, visibility: recipes.visibility })
      .from(recipes)
      .where(eq(recipes.id, recipe_id))
      .limit(1);

    if (!recipe) return c.json({ error: 'Recipe not found' }, 404);
    if (recipe.userId !== user.id && recipe.visibility !== 'public') {
      return c.json({ error: 'Recipe not accessible' }, 403);
    }

    // Get-or-create plan
    let [plan] = await db
      .select()
      .from(mealPlans)
      .where(and(eq(mealPlans.userId, user.id), eq(mealPlans.weekStartDate, weekStart)))
      .limit(1);

    if (!plan) {
      [plan] = await db
        .insert(mealPlans)
        .values({ userId: user.id, weekStartDate: weekStart })
        .returning();
    }

    // Remove any existing item in this slot, then insert the new one
    await db
      .delete(mealPlanItems)
      .where(
        and(
          eq(mealPlanItems.mealPlanId, plan.id),
          eq(mealPlanItems.dayOfWeek, day_of_week),
          eq(mealPlanItems.mealType, meal_type as 'breakfast' | 'lunch' | 'dinner' | 'snack')
        )
      );

    const [item] = await db
      .insert(mealPlanItems)
      .values({
        mealPlanId: plan.id,
        recipeId: recipe_id,
        dayOfWeek: day_of_week,
        mealType: meal_type as 'breakfast' | 'lunch' | 'dinner' | 'snack',
      })
      .returning();

    return c.json({ ok: true, item_id: item.id }, 201);
  }
);

/**
 * DELETE /meal-plans/items/:id
 * Remove a meal plan item.
 */
app.delete('/items/:id', requireAuth, async (c) => {
  const user = c.get('user')!;
  const db = getDb(c);
  const itemId = c.req.param('id');

  // Verify ownership via join
  const [item] = await db
    .select({ id: mealPlanItems.id, planUserId: mealPlans.userId })
    .from(mealPlanItems)
    .innerJoin(mealPlans, eq(mealPlanItems.mealPlanId, mealPlans.id))
    .where(eq(mealPlanItems.id, itemId))
    .limit(1);

  if (!item) return c.json({ error: 'Item not found' }, 404);
  if (item.planUserId !== user.id) return c.json({ error: 'Unauthorized' }, 403);

  await db.delete(mealPlanItems).where(eq(mealPlanItems.id, itemId));
  return c.body(null, 204);
});

/**
 * GET /meal-plans/grocery-list
 * Aggregate all ingredients from the current week's meal plan.
 * Groups by ingredient name and sums quantities where possible.
 */
app.get('/grocery-list', requireAuth, async (c) => {
  const user = c.get('user')!;
  const db = getDb(c);
  const weekStart = getWeekStart();

  const [plan] = await db
    .select()
    .from(mealPlans)
    .where(and(eq(mealPlans.userId, user.id), eq(mealPlans.weekStartDate, weekStart)))
    .limit(1);

  if (!plan) return c.json({ items: [], week_start: weekStart });

  // Get all recipe IDs in this plan
  const items = await db
    .select({ recipeId: mealPlanItems.recipeId })
    .from(mealPlanItems)
    .where(eq(mealPlanItems.mealPlanId, plan.id));

  const recipeIds = [...new Set(items.map(i => i.recipeId).filter(Boolean) as string[])];

  if (recipeIds.length === 0) return c.json({ items: [], week_start: weekStart });

  // Fetch all ingredients for those recipes
  const allIngredients = await db
    .select({
      name: ingredients.name,
      quantity: ingredients.quantity,
      unit: ingredients.unit,
      recipeTitle: recipes.title,
    })
    .from(ingredients)
    .innerJoin(recipes, eq(ingredients.recipeId, recipes.id))
    .where(inArray(ingredients.recipeId, recipeIds))
    .orderBy(ingredients.name);

  // Group by name for a clean list
  const grouped: Record<string, { name: string; quantity: string; unit: string; recipes: string[] }> = {};
  for (const ing of allIngredients) {
    const key = ing.name.toLowerCase().trim();
    if (!grouped[key]) {
      grouped[key] = { name: ing.name, quantity: ing.quantity ?? '', unit: ing.unit ?? '', recipes: [] };
    }
    if (ing.recipeTitle && !grouped[key].recipes.includes(ing.recipeTitle)) {
      grouped[key].recipes.push(ing.recipeTitle);
    }
  }

  return c.json({
    week_start: weekStart,
    items: Object.values(grouped),
  });
});

export const mealPlanRoutes = app;
