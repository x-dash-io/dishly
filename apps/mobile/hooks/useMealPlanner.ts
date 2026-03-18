import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApiClient } from '../src/lib/api-client';

export interface MealPlanRecipe {
  id: string;
  title: string;
  cover_image_url: string | null;
  hero_image_url: string | null;
  cook_minutes: number | null;
}

export interface MealPlanItem {
  id: string;
  day_of_week: number; // 0=Mon…6=Sun
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  recipe: MealPlanRecipe | null;
}

export interface MealPlan {
  id: string;
  week_start: string;
  items: MealPlanItem[];
}

export interface GroceryItem {
  name: string;
  quantity: string;
  unit: string;
  recipes: string[];
}

export function useMealPlan() {
  const api = useApiClient();
  return useQuery({
    queryKey: ['meal-plan', 'current'],
    queryFn: () => api.request<MealPlan>('GET', '/meal-plans/current'),
    staleTime: 1000 * 60 * 5,
  });
}

export function useAddMealPlanItem() {
  const api = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      recipe_id: string;
      day_of_week: number;
      meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    }) => api.request('POST', '/meal-plans/items', payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['meal-plan', 'current'] }),
  });
}

export function useRemoveMealPlanItem() {
  const api = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) => api.request('DELETE', `/meal-plans/items/${itemId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['meal-plan', 'current'] }),
  });
}

export function useGroceryList() {
  const api = useApiClient();
  return useQuery({
    queryKey: ['meal-plan', 'grocery-list'],
    queryFn: () => api.request<{ week_start: string; items: GroceryItem[] }>('GET', '/meal-plans/grocery-list'),
    staleTime: 1000 * 60 * 5,
  });
}
