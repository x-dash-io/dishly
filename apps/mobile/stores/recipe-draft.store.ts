import { create } from 'zustand';

// Simple ID generator for React Native compatibility
const generateId = () => Math.random().toString(36).substr(2, 9) + Date.now().toString(36);

export interface DraftIngredient {
  id: string;          
  name: string;
  quantity: string;
  unit: string;
  notes: string;
}

export interface DraftStep {
  id: string;          
  instruction: string;
  imageUri: string | null;    
  imageUrl: string | null;    
  timer_seconds: number | null;
}

export interface RecipeDraftState {
  title: string;
  description: string;
  cuisine: string;
  difficulty: 'easy' | 'medium' | 'hard';
  prep_minutes: number;
  cook_minutes: number;
  servings: number;
  tags: string[];

  coverImageUri: string | null;
  coverImageUrl: string | null;
  heroImageUri: string | null;
  heroImageUrl: string | null;

  ingredients: DraftIngredient[];
  steps: DraftStep[];

  visibility: 'public' | 'followers' | 'private';

  setField: <K extends keyof RecipeDraftState>(key: K, value: RecipeDraftState[K]) => void;
  addIngredient: () => void;
  updateIngredient: (id: string, patch: Partial<DraftIngredient>) => void;
  removeIngredient: (id: string) => void;
  reorderIngredients: (fromIndex: number, toIndex: number) => void;
  addStep: () => void;
  updateStep: (id: string, patch: Partial<DraftStep>) => void;
  removeStep: (id: string) => void;
  reorderSteps: (fromIndex: number, toIndex: number) => void;
  reset: () => void;
}

export const useRecipeDraft = create<RecipeDraftState>((set) => ({
  title: '', description: '', cuisine: '', difficulty: 'medium',
  prep_minutes: 0, cook_minutes: 0, servings: 2, tags: [],
  coverImageUri: null, coverImageUrl: null,
  heroImageUri: null, heroImageUrl: null,
  ingredients: [],
  steps: [],
  visibility: 'public',

  setField: (key, value) => set({ [key]: value }),

  addIngredient: () => set(state => ({
    ingredients: [...state.ingredients, {
      id: generateId(), name: '', quantity: '', unit: '', notes: ''
    }]
  })),

  updateIngredient: (id, patch) => set(state => ({
    ingredients: state.ingredients.map(i => i.id === id ? { ...i, ...patch } : i)
  })),

  removeIngredient: (id) => set(state => ({
    ingredients: state.ingredients.filter(i => i.id !== id)
  })),

  reorderIngredients: (from, to) => set(state => {
    const arr = [...state.ingredients];
    arr.splice(to, 0, arr.splice(from, 1)[0]);
    return { ingredients: arr };
  }),

  addStep: () => set(state => ({
    steps: [...state.steps, {
      id: generateId(), instruction: '',
      imageUri: null, imageUrl: null, timer_seconds: null
    }]
  })),

  updateStep: (id, patch) => set(state => ({
    steps: state.steps.map(s => s.id === id ? { ...s, ...patch } : s)
  })),

  removeStep: (id) => set(state => ({
    steps: state.steps.filter(s => s.id !== id)
  })),

  reorderSteps: (from, to) => set(state => {
    const arr = [...state.steps];
    arr.splice(to, 0, arr.splice(from, 1)[0]);
    return { steps: arr };
  }),

  reset: () => set({
    title: '', description: '', cuisine: '', difficulty: 'medium',
    prep_minutes: 0, cook_minutes: 0, servings: 2, tags: [],
    coverImageUri: null, coverImageUrl: null, heroImageUri: null, heroImageUrl: null,
    ingredients: [], steps: [], visibility: 'public',
  }),
}));
