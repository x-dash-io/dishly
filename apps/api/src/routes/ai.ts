import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import type { CloudflareEnv } from '../types/env';
import { getGeminiModel, RecipeSchema, generationConfig } from '../lib/gemini';

const generateRecipeSchema = z.object({
  prompt: z.string().min(1),
  dietaryPrefs: z.array(z.string()).optional(),
  servings: z.number().int().min(1).max(12).optional(),
});

export const aiRoutes = new Hono<{ Bindings: CloudflareEnv }>()
  /**
   * POST /ai/generate-recipe
   * Generates a full recipe from a text prompt (ingredients list or dish name).
   */
  .post(
    '/generate-recipe',
    zValidator('json', generateRecipeSchema),
    async (c) => {
      const { prompt, dietaryPrefs, servings } = c.req.valid('json');
      const model = getGeminiModel(c.env.GEMINI_API_KEY);

      const systemPrompt = `
        You are an expert chef and nutritionist for the Dishly app.
        Generate a detailed, delicious recipe based on the user's input.
        
        User input: "${prompt}"
        ${dietaryPrefs && dietaryPrefs.length > 0 ? `Respect these dietary constraints: ${dietaryPrefs.join(', ')}` : ''}
        ${servings ? `Scale the recipe for ${servings} servings.` : ''}

        Output MUST be a valid JSON object matching the requested schema.
        Focus on appetite appeal in the title and description.
      `;

      try {
        const result = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: systemPrompt }] }],
          generationConfig: {
            ...generationConfig,
            responseSchema: RecipeSchema,
          },
        });

        const response = result.response;
        const text = response.text();
        const recipe = JSON.parse(text);

        return c.json({
          recipe,
          isAiGenerated: true,
          model: 'gemini-1.5-flash',
        });
      } catch (error) {
        console.error('Gemini Generation Error:', error);
        return c.json({ error: 'Failed to generate recipe' }, 500);
      }
    }
  )
  /**
   * POST /ai/detect-ingredients
   * Detects ingredients from an uploaded image (Fridge-to-Recipe flow).
   */
  .post('/detect-ingredients', async (c) => {
    return c.json({ message: 'Vision detection stub - implementation in progress' });
  });
