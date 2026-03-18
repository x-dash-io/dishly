import { GoogleGenerativeAI, GenerationConfig, SchemaType, Schema } from '@google/generative-ai';

/**
 * Gemini AI Client Wrapper
 * Configured for Dishly recipe generation and vision tasks.
 */

export function getGeminiModel(apiKey: string) {
  const genAI = new GoogleGenerativeAI(apiKey);
  
  return genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
  });
}

/**
 * JSON Schema for Recipe Generation
 * Ensures Gemini returns parseable data matching our DB/Types.
 */
export const RecipeSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    title: { type: SchemaType.STRING },
    description: { type: SchemaType.STRING },
    cuisine: { type: SchemaType.STRING },
    difficulty: { 
      type: SchemaType.STRING, 
      enum: ['easy', 'medium', 'hard'],
      format: 'enum',
    } as unknown as Schema,
    prepMinutes: { type: SchemaType.NUMBER },
    cookMinutes: { type: SchemaType.NUMBER },
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
        required: ['name'],
      } as unknown as Schema,
    },
    steps: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          instruction: { type: SchemaType.STRING },
        },
        required: ['instruction'],
      } as unknown as Schema,
    },
    nutrition: {
      type: SchemaType.OBJECT,
      properties: {
        calories: { type: SchemaType.NUMBER },
        proteinG: { type: SchemaType.NUMBER },
        carbsG: { type: SchemaType.NUMBER },
        fatG: { type: SchemaType.NUMBER },
      },
    } as unknown as Schema,
  },
  required: ['title', 'ingredients', 'steps'],
};

export const IngredientDetectionSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    ingredients: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING } as unknown as Schema,
    },
  },
  required: ['ingredients'],
};

export const generationConfig: GenerationConfig = {
  temperature: 0.7,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 2048,
  responseMimeType: 'application/json',
};
