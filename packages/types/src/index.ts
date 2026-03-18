// Shared TypeScript types — no runtime imports

export type RecipeDifficulty = 'easy' | 'medium' | 'hard';
export type RecipeVisibility = 'public' | 'followers' | 'private';
export type RecipeStatus = 'draft' | 'published' | 'archived';

export interface Ingredient {
  name: string;
  quantity?: string;
  unit?: string;
  notes?: string;
  orderIndex: number;
}

export interface RecipeStep {
  instruction: string;
  imageUrl?: string;
  timerSeconds?: number;
  orderIndex: number;
}

export interface NutritionInfo {
  calories?: number;
  proteinG?: number;
  carbsG?: number;
  fatG?: number;
  fibreG?: number;
}

export interface Recipe {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  cuisine: string | null;
  difficulty: RecipeDifficulty;
  prepMinutes: number;
  cookMinutes: number;
  servings: number;
  coverImageUrl: string | null;
  heroImageUrl: string | null;
  isAiGenerated: boolean;
  visibility: RecipeVisibility;
  status: RecipeStatus;
  likeCount: number;
  saveCount: number;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  
  // Relations (optional for summary list components)
  user?: {
    username: string;
    displayName: string;
    avatarUrl: string | null;
  };
  ingredients?: Ingredient[];
  steps?: RecipeStep[];
  nutrition?: NutritionInfo;
}

export interface User {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  dietaryPrefs: string[];
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
  followersCount: number;
  followingCount: number;
}

export interface RecipeCardItem {
  id: string;
  title: string;
  cover_image_url: string | null;
  hero_image_url: string | null;
  cuisine: string | null;
  difficulty: 'easy' | 'medium' | 'hard';
  prep_minutes: number;
  cook_minutes: number;
  servings: number;
  like_count: number;
  save_count: number;
  is_ai_generated: boolean;
  created_at: string;
  author: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
  viewer: {
    liked: boolean;
    saved: boolean;
  } | null;
}

export type Step = RecipeStep;
export type Nutrition = NutritionInfo;

export interface FullRecipe extends Omit<RecipeCardItem, 'author'> {
  ingredients: Ingredient[];
  steps: Step[];
  nutrition: Nutrition | null;
  author: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
    follower_count: number;
  };
}

export interface UserProfile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  dietary_prefs: string[];
  skill_level: 'beginner' | 'intermediate' | 'advanced';
  created_at: string;
  stats: {
    follower_count: number;
    following_count: number;
    recipe_count: number;
  };
  viewer: {
    following: boolean;
  } | null;
}
