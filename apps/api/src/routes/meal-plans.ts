import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { eq, and, inArray } from 'drizzle-orm';
import { mealPlans, mealPlanItems, recipes, ingredients } from '@dishly/db';
import type { CloudflareEnv, Variables } from '../types/env';
import { requireAuth } from '../middleware/auth';
import { getDb } from '../lib/db';

const app = new Hono<{ Bindings: CloudflareEnv; Variables: Variables }>();

const DAY_LABELS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const;
type MealType = typeof MEAL_TYPES[number];

// Compute ISO date string for Monday of current week
function getWeekStart(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

// Compute ISO date for a given day index (0=Mon) within a week
function getDayDate(weekStart: string, dayIndex: number): string {
  const d = new Date(weekStart + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + dayIndex);
  return d.toISOString().slice(0, 10);
}

// Category mapping for grocery list
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  produce:  ['onion', 'garlic', 'tomato', 'lemon', 'lime', 'mango', 'pepper', 'chilli', 'ginger',
             'carrot', 'potato', 'spinach', 'lettuce', 'cucumber', 'avocado', 'banana', 'orange',
             'apple', 'herb', 'coriander', 'parsley', 'basil', 'thyme', 'scallion', 'leek',
             'mushroom', 'celery', 'broccoli', 'cabbage', 'zucchini', 'aubergine', 'eggplant'],
  proteins: ['chicken', 'lamb', 'beef', 'pork', 'fish', 'salmon', 'tuna', 'shrimp', 'prawn',
             'egg', 'tofu', 'tempeh', 'lentil', 'bean', 'chickpea', 'mince', 'steak', 'sausage'],
  dairy:    ['butter', 'milk', 'cream', 'cheese', 'yogurt', 'yoghurt', 'ghee', 'paneer', 'kefir'],
  pantry:   ['oil', 'salt', 'pepper', 'flour', 'sugar', 'rice', 'pasta', 'noodle', 'bread',
             'spice', 'cumin', 'turmeric', 'paprika', 'cinnamon', 'vinegar', 'soy', 'stock',
             'sauce', 'paste', 'honey', 'syrup', 'baking', 'cornstarch', 'oat'],
};

function categorise(name: string): string {
  const lower = name.toLowerCase();
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(k => lower.includes(k))) return cat;
  }
  return 'other';
}

/**
 * GET /meal-plans/current
 * Returns (or creates) the current week's plan in the spec's `days` shape.
 */
app.get('/current', requireAuth, async (c) => {
  const user = c.get('user')!;
  const db = getDb(c);
  const weekStart = getWeekStart();

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

  const itemRows = await db
    .select({
      id: mealPlanItems.id,
      dayOfWeek: mealPlanItems.dayOfWeek,
      mealType: mealPlanItems.mealType,
      recipeId: mealPlanItems.recipeId,
      recipeTitle: recipes.title,
      recipeCoverImage: recipes.coverImageUrl,
      recipeHeroImage: recipes.heroImageUrl,
      recipePrepMinutes: recipes.prepMinutes,
      recipeCookMinutes: recipes.cookMinutes,
      recipeDifficulty: recipes.difficulty,
    })
    .from(mealPlanItems)
    .leftJoin(recipes, eq(mealPlanItems.recipeId, recipes.id))
    .where(eq(mealPlanItems.mealPlanId, plan.id));

  // Build the days structure
  const days: Record<number, {
    date: string;
    label: string;
    meals: Record<MealType, { id: string; recipe: Record<string, unknown> } | null>;
  }> = {};

  for (let i = 0; i < 7; i++) {
    days[i] = {
      date: getDayDate(weekStart, i),
      label: DAY_LABELS[i],
      meals: { breakfast: null, lunch: null, dinner: null, snack: null },
    };
  }

  for (const row of itemRows) {
    const day = days[row.dayOfWeek];
    if (!day || !row.recipeId) continue;
    const mt = row.mealType as MealType;
    day.meals[mt] = {
      id: row.id,
      recipe: {
        id: row.recipeId,
        title: row.recipeTitle,
        cover_image_url: row.recipeCoverImage,
        hero_image_url: row.recipeHeroImage,
        prep_minutes: row.recipePrepMinutes,
        cook_minutes: row.recipeCookMinutes,
        difficulty: row.recipeDifficulty,
      },
    };
  }

  return c.json({ id: plan.id, week_start_date: weekStart, days });
});

/**
 * POST /meal-plans/items
 * Add a recipe to a slot. week_start_date must be a Monday.
 */
app.post(
  '/items',
  requireAuth,
  zValidator('json', z.object({
    recipe_id:      z.string().uuid(),
    day_of_week:    z.number().int().min(0).max(6),
    meal_type:      z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
    week_start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  })),
  async (c) => {
    const user = c.get('user')!;
    const db = getDb(c);
    const { recipe_id, day_of_week, meal_type, week_start_date } = c.req.valid('json');

    // Validate Monday
    const d = new Date(week_start_date + 'T00:00:00Z');
    if (d.getUTCDay() !== 1) return c.json({ error: 'week_start_date must be a Monday' }, 422);

    const [recipe] = await db
      .select({ id: recipes.id, userId: recipes.userId, visibility: recipes.visibility,
                title: recipes.title, coverImageUrl: recipes.coverImageUrl,
                heroImageUrl: recipes.heroImageUrl, prepMinutes: recipes.prepMinutes,
                cookMinutes: recipes.cookMinutes, difficulty: recipes.difficulty })
      .from(recipes).where(eq(recipes.id, recipe_id)).limit(1);

    if (!recipe) return c.json({ error: 'Recipe not found' }, 404);
    if (recipe.userId !== user.id && recipe.visibility !== 'public') {
      return c.json({ error: 'Recipe not accessible' }, 403);
    }

    let [plan] = await db
      .select()
      .from(mealPlans)
      .where(and(eq(mealPlans.userId, user.id), eq(mealPlans.weekStartDate, week_start_date)))
      .limit(1);

    if (!plan) {
      [plan] = await db.insert(mealPlans)
        .values({ userId: user.id, weekStartDate: week_start_date }).returning();
    }

    // Replace existing slot
    await db.delete(mealPlanItems).where(
      and(
        eq(mealPlanItems.mealPlanId, plan.id),
        eq(mealPlanItems.dayOfWeek, day_of_week),
        eq(mealPlanItems.mealType, meal_type)
      )
    );

    const [item] = await db.insert(mealPlanItems)
      .values({ mealPlanId: plan.id, recipeId: recipe_id, dayOfWeek: day_of_week, mealType: meal_type })
      .returning();

    return c.json({
      id: item.id,
      day_of_week,
      meal_type,
      recipe: {
        id: recipe.id,
        title: recipe.title,
        cover_image_url: recipe.coverImageUrl,
        hero_image_url: recipe.heroImageUrl,
        prep_minutes: recipe.prepMinutes,
        cook_minutes: recipe.cookMinutes,
        difficulty: recipe.difficulty,
      },
    }, 201);
  }
);

/**
 * DELETE /meal-plans/items/:itemId
 */
app.delete('/items/:itemId', requireAuth, async (c) => {
  const user = c.get('user')!;
  const db = getDb(c);
  const itemId = c.req.param('itemId');

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
 * Aggregate ingredients by category with recipe_count.
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

  const emptyResponse = {
    week_start_date: weekStart,
    total_recipes: 0,
    categories: { produce: [], proteins: [], dairy: [], pantry: [], other: [] },
  };

  if (!plan) return c.json(emptyResponse);

  const items = await db
    .select({ recipeId: mealPlanItems.recipeId })
    .from(mealPlanItems)
    .where(eq(mealPlanItems.mealPlanId, plan.id));

  const recipeIds = [...new Set(items.map(i => i.recipeId).filter(Boolean) as string[])];
  if (recipeIds.length === 0) return c.json(emptyResponse);

  const allIngredients = await db
    .select({
      name: ingredients.name,
      quantity: ingredients.quantity,
      unit: ingredients.unit,
      recipeId: ingredients.recipeId,
    })
    .from(ingredients)
    .where(inArray(ingredients.recipeId, recipeIds));

  // Group by normalised name + unit (keep separate lines if units differ)
  type GroceryItem = { name: string; quantity: string; unit: string; recipe_count: number; _recipeIds: Set<string> };
  const grouped: Record<string, GroceryItem> = {};

  for (const ing of allIngredients) {
    const key = `${ing.name.toLowerCase().trim()}::${(ing.unit ?? '').toLowerCase().trim()}`;
    if (!grouped[key]) {
      grouped[key] = { name: ing.name, quantity: ing.quantity ?? '', unit: ing.unit ?? '', recipe_count: 0, _recipeIds: new Set() };
    }
    grouped[key]._recipeIds.add(ing.recipeId ?? '');
  }

  // Set recipe_count and remove internal set
  const categories: Record<string, Omit<GroceryItem, '_recipeIds'>[]> = {
    produce: [], proteins: [], dairy: [], pantry: [], other: [],
  };

  for (const g of Object.values(grouped)) {
    const { _recipeIds, ...item } = g;
    item.recipe_count = _recipeIds.size;
    const cat = categorise(item.name);
    categories[cat].push(item);
  }

  // Sort each category alphabetically
  for (const cat of Object.keys(categories)) {
    categories[cat].sort((a, b) => a.name.localeCompare(b.name));
  }

  return c.json({ week_start_date: weekStart, total_recipes: recipeIds.length, categories });
});

export const mealPlanRoutes = app;
