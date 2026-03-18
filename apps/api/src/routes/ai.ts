import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { SchemaType } from '@google/generative-ai';
import { aiGenerations, recipes, ingredients as ingredientsDb, steps as stepsDb, nutrition as nutritionDb, eq } from '@dishly/db';
import type { CloudflareEnv, Variables } from '../types/env';
import { requireAuth } from '../middleware/auth';
import { rateLimit } from '../middleware/rate-limit';
import { getDb } from '../lib/db';
import { getGemini, GEMINI_MODEL, urlToImagePart } from '../lib/gemini';
import { streamText } from 'hono/streaming';
import { CookQASchema, SubstitutionSchema } from '@dishly/validators';

export const aiRoutes = new Hono<{ Bindings: CloudflareEnv, Variables: Variables }>()

  /**
   * POST /ai/image-to-ingredients
   * Detect ingredients from a photo
   */
  .post(
    '/image-to-ingredients', 
    requireAuth, 
    rateLimit('ai'),
    zValidator('json', z.object({ image_url: z.string().url() })),
    async (c) => {
      const currentUser = c.get('user')!;
      const { image_url } = c.req.valid('json');
      const db = getDb(c);
      const startTime = Date.now();

      // 1. Log generation start
      const inserted = await db.insert(aiGenerations).values({
        userId: currentUser.id,
        inputType: 'image_to_ingredients',
        inputImageUrl: image_url,
        modelVersion: GEMINI_MODEL,
      }).returning({ id: aiGenerations.id });

      const genId = inserted[0]?.id;

      try {
        const gemini = getGemini(c.env);
        const model = gemini.getGenerativeModel({
          model: GEMINI_MODEL,
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: SchemaType.OBJECT,
              properties: {
                ingredients: {
                  type: SchemaType.ARRAY,
                  items: {
                    type: SchemaType.OBJECT,
                    properties: {
                      name:       { type: SchemaType.STRING },
                      quantity:   { type: SchemaType.STRING },
                      unit:       { type: SchemaType.STRING },
                      confidence: { type: SchemaType.NUMBER },
                    },
                    required: ['name', 'confidence'],
                  }
                },
                notes: { type: SchemaType.STRING }
              },
              required: ['ingredients'],
            }
          }
        });

        const imagePart = await urlToImagePart(image_url);
        const prompt = `You are a professional chef's assistant. 
Examine this image carefully and identify all visible food ingredients.
For each ingredient, provide:
- name: the ingredient name (singular, common name)
- quantity: estimated amount if visible (e.g. "3", "half a")
- unit: unit if applicable (e.g. "cloves", "cups") — omit if not applicable
- confidence: 0.0 to 1.0 (how certain you are this ingredient is in the image)

Only include items that are clearly food ingredients.
Do not include packaging, containers, or non-food items.
Order by confidence descending.`;

        const result = await model.generateContent([prompt, imagePart]);
        const parsed = JSON.parse(result.response.text());

        const filteredIngredients = (parsed.ingredients || [])
          .filter((i: any) => typeof i.confidence === 'number' && i.confidence >= 0.6)
          .sort((a: any, b: any) => b.confidence - a.confidence);

        const latencyMs = Date.now() - startTime;
        const tokensUsed = result.response.usageMetadata?.totalTokenCount ?? 0;

        if (genId) {
          await db.update(aiGenerations).set({ tokensUsed, latencyMs }).where(eq(aiGenerations.id, genId));
        }

        return c.json({
          generation_id: genId,
          ingredients: filteredIngredients,
          notes: parsed.notes || null,
          model: GEMINI_MODEL
        });

      } catch (err: unknown) {
        const latencyMs = Date.now() - startTime;
        const message = err instanceof Error ? err.message : 'AI_PARSE_ERROR';
        if (genId) {
          await db.update(aiGenerations).set({ latencyMs, error: message }).where(eq(aiGenerations.id, genId));
        }
        if (err instanceof SyntaxError) {
          return c.json({ error: 'AI_PARSE_ERROR' }, 502);
        }
        return c.json({ error: 'AI_GENERATION_FAILED', message }, 502);
      }
    }
  )

  /**
   * POST /ai/ingredients-to-recipe
   * Generate a full recipe from a list of ingredients
   */
  .post(
    '/ingredients-to-recipe',
    requireAuth,
    rateLimit('ai'),
    zValidator('json', z.object({
      ingredients: z.array(z.string()).min(1),
      dietary_filters: z.array(z.string()).optional(),
      servings: z.number().optional().default(2),
      skill_level: z.string().optional().default('beginner'),
    })),
    async (c) => {
      const currentUser = c.get('user')!;
      const body = c.req.valid('json');
      const db = getDb(c);
      const startTime = Date.now();

      const inserted = await db.insert(aiGenerations).values({
        userId: currentUser.id,
        inputType: 'ingredients_to_recipe',
        inputIngredients: body.ingredients,
        modelVersion: GEMINI_MODEL,
      }).returning({ id: aiGenerations.id });

      const genId = inserted[0]?.id;

      try {
        const systemPrompt = `You are Dishly's AI chef — creative, encouraging, and practical.
Generate a complete recipe from the provided ingredients.
The user's skill level is: ${body.skill_level}.
${body.dietary_filters?.length ? `Dietary requirements: ${body.dietary_filters.join(', ')}.` : ''}
Use primarily the provided ingredients. You may add up to 5 common pantry staples
(salt, pepper, oil, garlic, onion) that aren't listed.
Make the recipe delicious and realistic — not experimental or obscure.

Primary ingredients provided:
${body.ingredients.map(i => `- ${i}`).join('\n')}`;

        const gemini = getGemini(c.env);
        const model = gemini.getGenerativeModel({
          model: GEMINI_MODEL,
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: SchemaType.OBJECT,
              properties: {
                title: { type: SchemaType.STRING },
                description: { type: SchemaType.STRING },
                cuisine: { type: SchemaType.STRING },
                difficulty: { type: SchemaType.STRING } as object,
                prep_minutes: { type: SchemaType.NUMBER },
                cook_minutes: { type: SchemaType.NUMBER },
                servings: { type: SchemaType.NUMBER },
                ingredients: {
                  type: SchemaType.ARRAY,
                  items: {
                    type: SchemaType.OBJECT,
                    properties: {
                      name: { type: SchemaType.STRING },
                      quantity: { type: SchemaType.STRING },
                      unit: { type: SchemaType.STRING },
                      notes: { type: SchemaType.STRING },
                    },
                    required: ['name', 'quantity', 'unit']
                  }
                },
                steps: {
                  type: SchemaType.ARRAY,
                  items: {
                    type: SchemaType.OBJECT,
                    properties: {
                      instruction: { type: SchemaType.STRING },
                      timer_seconds: { type: SchemaType.NUMBER },
                      tips: { type: SchemaType.STRING }
                    },
                    required: ['instruction']
                  }
                },
                nutrition_estimate: {
                  type: SchemaType.OBJECT,
                  properties: {
                    calories: { type: SchemaType.NUMBER },
                    protein_g: { type: SchemaType.NUMBER },
                    carbs_g: { type: SchemaType.NUMBER },
                    fat_g: { type: SchemaType.NUMBER },
                    fibre_g: { type: SchemaType.NUMBER },
                  },
                  required: ['calories']
                },
                tags: {
                  type: SchemaType.ARRAY,
                  items: { type: SchemaType.STRING }
                }
              },
              required: ['title', 'description', 'cuisine', 'difficulty', 'prep_minutes', 'cook_minutes', 'servings', 'ingredients', 'steps', 'nutrition_estimate']
            }
          }
        });

        const result = await model.generateContent(systemPrompt);
        const parsed = JSON.parse(result.response.text());

        if (!parsed.steps?.length || !parsed.ingredients?.length) {
          throw new Error('AI produced empty ingredients or steps');
        }

        const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val || 0));
        const nutritionData = parsed.nutrition_estimate;
        nutritionData.calories = clamp(nutritionData.calories, 50, 2000);

        // Persist in a DB transaction
        const newRecipes = await db.transaction(async (tx) => {
          const recInserted = await tx.insert(recipes).values({
            userId: currentUser.id,
            title: parsed.title,
            description: parsed.description,
            cuisine: parsed.cuisine,
            difficulty: (parsed.difficulty as 'easy' | 'medium' | 'hard') ?? 'medium',
            prepMinutes: parsed.prep_minutes,
            cookMinutes: parsed.cook_minutes,
            servings: parsed.servings,
            isAiGenerated: true,
            status: 'draft',
            aiGenerationId: genId,
          }).returning();

          const recipe = recInserted[0];
          if (!recipe) throw new Error('Failed to insert recipe');

          if (parsed.ingredients.length > 0) {
            await tx.insert(ingredientsDb).values(
              parsed.ingredients.map((ing: { name: string; quantity: string; unit: string; notes?: string }, idx: number) => ({
                recipeId: recipe.id,
                name: ing.name,
                quantity: ing.quantity,
                unit: ing.unit,
                notes: ing.notes,
                orderIndex: idx,
              }))
            );
          }

          if (parsed.steps.length > 0) {
            await tx.insert(stepsDb).values(
              parsed.steps.map((st: { instruction: string; timer_seconds?: number }, idx: number) => ({
                recipeId: recipe.id,
                instruction: st.instruction,
                timerSeconds: st.timer_seconds ?? null,
                orderIndex: idx,
              }))
            );
          }

          await tx.insert(nutritionDb).values({
            recipeId: recipe.id,
            calories: nutritionData.calories,
            proteinG: Math.max(0, nutritionData.protein_g || 0),
            carbsG: Math.max(0, nutritionData.carbs_g || 0),
            fatG: Math.max(0, nutritionData.fat_g || 0),
            fibreG: Math.max(0, nutritionData.fibre_g || 0),
            isEstimated: true,
          });

          return recipe;
        });

        const latencyMs = Date.now() - startTime;
        const tokensUsed = result.response.usageMetadata?.totalTokenCount ?? 0;

        if (genId && newRecipes?.id) {
          await db.update(aiGenerations)
            .set({ tokensUsed, latencyMs, outputRecipeId: newRecipes.id })
            .where(eq(aiGenerations.id, genId));
        }

        return c.json({
          generation_id: genId,
          ...newRecipes,
          ingredients: parsed.ingredients,
          steps: parsed.steps,
          nutrition: nutritionData,
          tags: parsed.tags || []
        }, 201);

      } catch (err: unknown) {
        const latencyMs = Date.now() - startTime;
        const message = err instanceof Error ? err.message : 'AI_GENERATION_ERROR';
        if (genId) {
          await db.update(aiGenerations).set({ latencyMs, error: message }).where(eq(aiGenerations.id, genId));
        }
        if (err instanceof SyntaxError) {
          return c.json({ error: 'AI_PARSE_ERROR' }, 502);
        }
        return c.json({ error: 'AI_GENERATION_FAILED', message }, 502);
      }
    }
  )

  /**
   * POST /ai/parse-ingredients
   * Parse freeform text into ingredient rows (stateless)
   */
  .post(
    '/parse-ingredients',
    requireAuth,
    rateLimit('ai'),
    zValidator('json', z.object({ text: z.string().max(2000) })),
    async (c) => {
      const { text } = c.req.valid('json');

      try {
        const gemini = getGemini(c.env);
        const model = gemini.getGenerativeModel({
          model: GEMINI_MODEL,
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: SchemaType.OBJECT,
              properties: {
                ingredients: {
                  type: SchemaType.ARRAY,
                  items: {
                    type: SchemaType.OBJECT,
                    properties: {
                      name: { type: SchemaType.STRING },
                      quantity: { type: SchemaType.STRING },
                      unit: { type: SchemaType.STRING },
                      notes: { type: SchemaType.STRING },
                    },
                    required: ['name', 'quantity', 'unit']
                  }
                }
              },
              required: ['ingredients']
            }
          }
        });

        const prompt = `Parse this ingredient list into structured JSON.
Each ingredient should have: name, quantity (as string), unit, notes.
If quantity or unit cannot be determined, leave them as empty strings.
Input: ${text}`;

        const result = await model.generateContent(prompt);
        const parsed = JSON.parse(result.response.text());

        return c.json({ ingredients: parsed.ingredients || [] });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'AI_GENERATION_ERROR';
        if (err instanceof SyntaxError) {
          return c.json({ error: 'AI_PARSE_ERROR' }, 502);
        }
        return c.json({ error: 'AI_GENERATION_FAILED', message }, 502);
      }
    }
  )

  /**
   * POST /ai/cook-qa
   * Ask questions about recipe while cooking
   */
  .post(
    '/cook-qa',
    requireAuth,
    rateLimit('ai'),
    zValidator('json', CookQASchema),
    async (c) => {
      const currentUser = c.get('user')!;
      const { recipe_id, current_step_index, question } = c.req.valid('json');
      const db = getDb(c);
      const startTime = Date.now();

      // 1. Fetch recipe with ingredients and steps from DB
      const recipeData = await db
        .select({
          recipe: recipes,
          ingredients: ingredientsDb,
          steps: stepsDb,
        })
        .from(recipes)
        .leftJoin(ingredientsDb, eq(recipes.id, ingredientsDb.recipeId))
        .leftJoin(stepsDb, eq(recipes.id, stepsDb.recipeId))
        .where(eq(recipes.id, recipe_id))
        .limit(1);

      if (!recipeData.length) {
        return c.json({ error: 'Recipe not found' }, 404);
      }

      // Check if user has access (owner or public)
      const recipe = recipeData[0].recipe;
      if (recipe.userId !== currentUser.id && recipe.visibility !== 'public') {
        return c.json({ error: 'Recipe not accessible' }, 404);
      }

      // Organize ingredients and steps
      const ingredients = recipeData
        .map(row => row.ingredients)
        .filter(Boolean)
        .sort((a, b) => a.orderIndex - b.orderIndex);

      const steps = recipeData
        .map(row => row.steps)
        .filter(Boolean)
        .sort((a, b) => a.orderIndex - b.orderIndex);

      // 2. Build context prompt
      const systemPrompt = `You are a friendly, expert cooking assistant helping someone cook a recipe right now. They are mid-cook and need quick, practical help. Keep answers SHORT — 2–4 sentences maximum. Be encouraging and specific. Never suggest starting the recipe over unless absolutely necessary.

RECIPE: ${recipe.title}
CUISINE: ${recipe.cuisine ?? 'unspecified'}
DIFFICULTY: ${recipe.difficulty}
SERVINGS: ${recipe.servings}

ALL INGREDIENTS:
${ingredients.map(i => `- ${i.quantity} ${i.unit} ${i.name}${i.notes ? ` (${i.notes})` : ''}`).join('\n')}

ALL STEPS:
${steps.map((s, idx) => `Step ${idx + 1}: ${s.instruction}`).join('\n')}

CURRENT STEP (step ${current_step_index + 1}):
${steps[current_step_index]?.instruction ?? 'Unknown step'}

The user is currently on step ${current_step_index + 1} of ${steps.length}.
Answer their question in the context of this recipe and this step.`;

      // 3. Stream the response using Gemini's streaming API
      try {
        const gemini = getGemini(c.env);
        const model = gemini.getGenerativeModel({ model: GEMINI_MODEL });
        const result = await model.generateContentStream([
          { text: systemPrompt },
          { text: `User question: ${question}` }
        ]);

        // 5. Fire-and-forget audit log — must be started BEFORE the return
        const logStartTime = startTime;
        ;(async () => {
          try {
            await db.insert(aiGenerations).values({
              userId: currentUser.id,
              inputType: 'cook_qa',
              inputIngredients: [recipe_id],
              inputPrompt: question,
              modelVersion: GEMINI_MODEL,
              latencyMs: Date.now() - logStartTime,
            });
          } catch {
            // Ignore logging errors — never affect the stream
          }
        })();

        // 4. Return a streaming HTTP response
        return streamText(c, async (stream) => {
          try {
            for await (const chunk of result.stream) {
              const text = chunk.text();
              if (text) await stream.write(text);
            }
          } catch {
            await stream.write('[AI assistant temporarily unavailable]');
          }
        });

      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return c.json({ error: 'AI_GENERATION_FAILED', message }, 502);
      }
    }
  )

  /**
   * POST /ai/identify-dish
   * Pass 1 of dish-to-recipe: identify what the dish is.
   * Returns immediately so the client can show "Generating recipe for [name]…"
   */
  .post(
    '/identify-dish',
    requireAuth,
    rateLimit('ai'),
    zValidator('json', z.object({ image_url: z.string().url() })),
    async (c) => {
      const { image_url } = c.req.valid('json');

      try {
        const gemini = getGemini(c.env);
        const model = gemini.getGenerativeModel({
          model: GEMINI_MODEL,
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: SchemaType.OBJECT,
              properties: {
                dish_name:  { type: SchemaType.STRING },
                cuisine:    { type: SchemaType.STRING },
                confidence: { type: SchemaType.NUMBER },
                details:    { type: SchemaType.STRING },
              },
              required: ['dish_name', 'cuisine', 'confidence'],
            },
          },
        });

        const imagePart = await urlToImagePart(image_url);
        const prompt = `Look at this food image. Identify:
1. The name of the dish (be specific — e.g. 'Shakshuka' not just 'egg dish')
2. The cuisine type
3. Your confidence level (0.0 to 1.0) that this is a recognisable dish
4. Any visible garnishes, sides, or notable presentation details

Respond in JSON: { dish_name, cuisine, confidence, details }`;

        const result = await model.generateContent([prompt, imagePart]);
        const parsed = JSON.parse(result.response.text()) as {
          dish_name: string;
          cuisine: string;
          confidence: number;
          details?: string;
        };

        if (parsed.confidence < 0.5) {
          return c.json({
            error: 'DISH_NOT_RECOGNISED',
            message: 'Could not identify the dish clearly enough to generate a recipe',
          }, 422);
        }

        return c.json({
          dish_name:  parsed.dish_name,
          cuisine:    parsed.cuisine,
          confidence: parsed.confidence,
          details:    parsed.details ?? '',
        });

      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        if (err instanceof SyntaxError) {
          return c.json({ error: 'AI_PARSE_ERROR' }, 502);
        }
        return c.json({ error: 'AI_GENERATION_FAILED', message }, 502);
      }
    }
  )

  /**
   * POST /ai/dish-to-recipe-from-name
   * Pass 2 of dish-to-recipe: generate a full recipe given a known dish name.
   * Takes the output of /ai/identify-dish plus the original image_url for visual context.
   */
  .post(
    '/dish-to-recipe-from-name',
    requireAuth,
    rateLimit('ai'),
    zValidator('json', z.object({
      dish_name:  z.string().min(1).max(200),
      cuisine:    z.string().min(1).max(100),
      details:    z.string().optional().default(''),
      image_url:  z.string().url(),
    })),
    async (c) => {
      const currentUser = c.get('user')!;
      const { dish_name, cuisine, details, image_url } = c.req.valid('json');
      const db = getDb(c);
      const startTime = Date.now();

      const inserted = await db.insert(aiGenerations).values({
        userId:       currentUser.id,
        inputType:    'dish_to_recipe',
        inputImageUrl: image_url,
        inputIngredients: [dish_name],
        modelVersion: GEMINI_MODEL,
      }).returning({ id: aiGenerations.id });

      const genId = inserted[0]?.id;

      try {
        const systemPrompt = `You are Dishly's AI chef — creative, encouraging, and practical.
Recreate the dish "${dish_name}" (${cuisine} cuisine) based on its appearance.
${details ? `Visual details: ${details}` : ''}
Generate a complete, accurate home-cook recipe.
Use common supermarket ingredients.
Make it delicious and realistic.`;

        const gemini  = getGemini(c.env);
        const imagePart = await urlToImagePart(image_url);

        const model = gemini.getGenerativeModel({
          model: GEMINI_MODEL,
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: SchemaType.OBJECT,
              properties: {
                title:       { type: SchemaType.STRING },
                description: { type: SchemaType.STRING },
                cuisine:     { type: SchemaType.STRING },
                difficulty:  { type: SchemaType.STRING } as object,
                prep_minutes: { type: SchemaType.NUMBER },
                cook_minutes: { type: SchemaType.NUMBER },
                servings:    { type: SchemaType.NUMBER },
                ingredients: {
                  type: SchemaType.ARRAY,
                  items: {
                    type: SchemaType.OBJECT,
                    properties: {
                      name:     { type: SchemaType.STRING },
                      quantity: { type: SchemaType.STRING },
                      unit:     { type: SchemaType.STRING },
                      notes:    { type: SchemaType.STRING },
                    },
                    required: ['name', 'quantity', 'unit'],
                  },
                },
                steps: {
                  type: SchemaType.ARRAY,
                  items: {
                    type: SchemaType.OBJECT,
                    properties: {
                      instruction:   { type: SchemaType.STRING },
                      timer_seconds: { type: SchemaType.NUMBER },
                      tips:          { type: SchemaType.STRING },
                    },
                    required: ['instruction'],
                  },
                },
                nutrition_estimate: {
                  type: SchemaType.OBJECT,
                  properties: {
                    calories:  { type: SchemaType.NUMBER },
                    protein_g: { type: SchemaType.NUMBER },
                    carbs_g:   { type: SchemaType.NUMBER },
                    fat_g:     { type: SchemaType.NUMBER },
                    fibre_g:   { type: SchemaType.NUMBER },
                  },
                  required: ['calories'],
                },
                tags: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
              },
              required: ['title', 'description', 'cuisine', 'difficulty',
                         'prep_minutes', 'cook_minutes', 'servings',
                         'ingredients', 'steps', 'nutrition_estimate'],
            },
          },
        });

        // Pass both the text prompt AND the original image so Gemini
        // can reference visual details (portion size, toppings, cooking clues)
        const result = await model.generateContent([systemPrompt, imagePart]);
        const parsed = JSON.parse(result.response.text());

        if (!parsed.steps?.length || !parsed.ingredients?.length) {
          throw new Error('AI produced empty ingredients or steps');
        }

        const clamp = (val: number, min: number, max: number) =>
          Math.max(min, Math.min(max, val || 0));
        const nutritionData = parsed.nutrition_estimate;
        nutritionData.calories = clamp(nutritionData.calories, 50, 2000);

        const newRecipe = await db.transaction(async (tx) => {
          const [recipe] = await tx.insert(recipes).values({
            userId:       currentUser.id,
            title:        parsed.title ?? dish_name,
            description:  parsed.description,
            cuisine:      parsed.cuisine ?? cuisine,
            difficulty:   (parsed.difficulty as 'easy' | 'medium' | 'hard') ?? 'medium',
            prepMinutes:  parsed.prep_minutes,
            cookMinutes:  parsed.cook_minutes,
            servings:     parsed.servings,
            isAiGenerated: true,
            status:       'draft',
            aiGenerationId: genId,
          }).returning();

          if (!recipe) throw new Error('Failed to insert recipe');

          if (parsed.ingredients.length > 0) {
            await tx.insert(ingredientsDb).values(
              parsed.ingredients.map(
                (ing: { name: string; quantity: string; unit: string; notes?: string }, idx: number) => ({
                  recipeId:   recipe.id,
                  name:       ing.name,
                  quantity:   ing.quantity,
                  unit:       ing.unit,
                  notes:      ing.notes,
                  orderIndex: idx,
                })
              )
            );
          }

          if (parsed.steps.length > 0) {
            await tx.insert(stepsDb).values(
              parsed.steps.map(
                (st: { instruction: string; timer_seconds?: number }, idx: number) => ({
                  recipeId:    recipe.id,
                  instruction: st.instruction,
                  timerSeconds: st.timer_seconds ?? null,
                  orderIndex:  idx,
                })
              )
            );
          }

          await tx.insert(nutritionDb).values({
            recipeId:   recipe.id,
            calories:   nutritionData.calories,
            proteinG:   Math.max(0, nutritionData.protein_g || 0),
            carbsG:     Math.max(0, nutritionData.carbs_g || 0),
            fatG:       Math.max(0, nutritionData.fat_g || 0),
            fibreG:     Math.max(0, nutritionData.fibre_g || 0),
            isEstimated: true,
          });

          return recipe;
        });

        const latencyMs   = Date.now() - startTime;
        const tokensUsed  = result.response.usageMetadata?.totalTokenCount ?? 0;

        if (genId && newRecipe?.id) {
          await db.update(aiGenerations)
            .set({ tokensUsed, latencyMs, outputRecipeId: newRecipe.id })
            .where(eq(aiGenerations.id, genId));
        }

        return c.json({
          generation_id: genId,
          dish_name,
          ...newRecipe,
          ingredients: parsed.ingredients,
          steps:       parsed.steps,
          nutrition:   nutritionData,
          tags:        parsed.tags ?? [],
        }, 201);

      } catch (err: unknown) {
        const latencyMs = Date.now() - startTime;
        const message   = err instanceof Error ? err.message : 'AI_GENERATION_ERROR';
        if (genId) {
          await db.update(aiGenerations)
            .set({ latencyMs, error: message })
            .where(eq(aiGenerations.id, genId));
        }
        if (err instanceof SyntaxError) {
          return c.json({ error: 'AI_PARSE_ERROR' }, 502);
        }
        return c.json({ error: 'AI_GENERATION_FAILED', message }, 502);
      }
    }

  /**
   * POST /ai/substitutions
   * Get AI-ranked ingredient substitutes for a recipe
   */
  .post(
    '/substitutions',
    requireAuth,
    rateLimit('ai'),
    zValidator('json', SubstitutionSchema),
    async (c) => {
      const currentUser = c.get('user')!;
      const { recipe_id, ingredient_name } = c.req.valid('json');
      const db = getDb(c);
      const startTime = Date.now();

      // 1. Fetch recipe context
      const recipeRows = await db
        .select({ recipe: recipes, ingredient: ingredientsDb })
        .from(recipes)
        .leftJoin(ingredientsDb, eq(recipes.id, ingredientsDb.recipeId))
        .where(eq(recipes.id, recipe_id));

      if (!recipeRows.length) {
        return c.json({ error: 'Recipe not found' }, 404);
      }

      const recipe = recipeRows[0].recipe;
      if (recipe.userId !== currentUser.id && recipe.visibility !== 'public') {
        return c.json({ error: 'Recipe not accessible' }, 404);
      }

      const otherIngredients = recipeRows
        .map(r => r.ingredient?.name)
        .filter((n): n is string => !!n && n !== ingredient_name);

      // 2. Log generation
      const inserted = await db.insert(aiGenerations).values({
        userId: currentUser.id,
        inputType: 'substitution',
        inputIngredients: [ingredient_name],
        inputPrompt: `Substitutes for ${ingredient_name} in ${recipe.title}`,
        modelVersion: GEMINI_MODEL,
      }).returning({ id: aiGenerations.id });

      const genId = inserted[0]?.id;

      try {
        const prompt = `You are an expert chef. A home cook is making "${recipe.title}" (${recipe.cuisine ?? 'unspecified'} cuisine) and needs substitutes for: ${ingredient_name}

Other ingredients in the recipe: ${otherIngredients.slice(0, 10).join(', ')}

Provide 3–4 substitutes. For each one consider:
- Availability (prefer common supermarket items)
- How well it works in this specific recipe and cuisine
- Effect on taste, texture, and appearance

Be practical and encouraging.`;

        const gemini = getGemini(c.env);
        const model = gemini.getGenerativeModel({
          model: GEMINI_MODEL,
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: SchemaType.OBJECT,
              properties: {
                original_ingredient: { type: SchemaType.STRING },
                substitutes: {
                  type: SchemaType.ARRAY,
                  items: {
                    type: SchemaType.OBJECT,
                    properties: {
                      name:          { type: SchemaType.STRING },
                      ratio:         { type: SchemaType.STRING },
                      notes:         { type: SchemaType.STRING },
                      works_well:    { type: SchemaType.BOOLEAN },
                      dietary_tags:  { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                    },
                    required: ['name', 'ratio', 'notes', 'works_well'],
                  },
                },
                tip: { type: SchemaType.STRING },
              },
              required: ['original_ingredient', 'substitutes', 'tip'],
            },
          },
        });

        const result = await model.generateContent(prompt);
        const parsed = JSON.parse(result.response.text());

        const latencyMs = Date.now() - startTime;
        const tokensUsed = result.response.usageMetadata?.totalTokenCount ?? 0;

        if (genId) {
          await db.update(aiGenerations)
            .set({ tokensUsed, latencyMs })
            .where(eq(aiGenerations.id, genId));
        }

        // Stateless — return directly, no DB persistence
        return c.json(parsed);

      } catch (err: unknown) {
        const latencyMs = Date.now() - startTime;
        const message = err instanceof Error ? err.message : 'AI_GENERATION_ERROR';
        if (genId) {
          await db.update(aiGenerations)
            .set({ latencyMs, error: message })
            .where(eq(aiGenerations.id, genId));
        }
        if (err instanceof SyntaxError) {
          return c.json({ error: 'AI_PARSE_ERROR' }, 502);
        }
        return c.json({ error: 'AI_GENERATION_FAILED', message }, 502);
      }
    }
  );
