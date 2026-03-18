import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApiClient } from '../src/lib/api-client';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface MealPlanRecipe {
  id: string;
  title: string;
  cover_image_url: string | null;
  hero_image_url: string | null;
  prep_minutes: number | null;
  cook_minutes: number | null;
  difficulty: string | null;
}

export interface MealPlanItem {
  id: string;
  recipe: MealPlanRecipe;
}

export interface MealPlanDay {
  date: string;       // "YYYY-MM-DD"
  label: string;      // "Monday"
  meals: Record<MealType, MealPlanItem | null>;
}

export interface MealPlan {
  id: string;
  week_start_date: string;
  days: Record<number, MealPlanDay>; // 0=Mon … 6=Sun
}

export interface GroceryItem {
  name: string;
  quantity: string;
  unit: string;
  recipe_count: number;
}

export interface GroceryList {
  week_start_date: string;
  total_recipes: number;
  categories: {
    produce: GroceryItem[];
    proteins: GroceryItem[];
    dairy: GroceryItem[];
    pantry: GroceryItem[];
    other: GroceryItem[];
  };
}

export type GroceryCategory = keyof GroceryList['categories'];

const QK = ['meal-plan', 'current'] as const;

export function useCurrentMealPlan() {
  const api = useApiClient();
  return useQuery({
    queryKey: QK,
    queryFn: () => api.request<MealPlan>('GET', '/meal-plans/current'),
    staleTime: 1000 * 60 * 5,
  });
}

export function useAddMealPlanItem() {
  const api = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      recipe_id: string;
      day_of_week: number;
      meal_type: MealType;
      week_start_date: string;
    }) => api.request<MealPlanItem>('POST', '/meal-plans/items', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK }),
  });
}

export function useRemoveMealPlanItem() {
  const api = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) =>
      api.request('DELETE', `/meal-plans/items/${itemId}`),
    // Optimistic: remove from cache immediately
    onMutate: async (itemId: string) => {
      await qc.cancelQueries({ queryKey: QK });
      const previous = qc.getQueryData<MealPlan>(QK);
      if (previous) {
        const next = JSON.parse(JSON.stringify(previous)) as MealPlan;
        for (const day of Object.values(next.days)) {
          for (const mt of ['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]) {
            if (day.meals[mt]?.id === itemId) {
              day.meals[mt] = null;
            }
          }
        }
        qc.setQueryData(QK, next);
      }
      return { previous };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.previous) qc.setQueryData(QK, ctx.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: QK }),
  });
}

export function useGroceryList() {
  const api = useApiClient();
  return useQuery({
    queryKey: ['grocery-list', 'current'],
    queryFn: () => api.request<GroceryList>('GET', '/meal-plans/grocery-list'),
    staleTime: 1000 * 60 * 10,
  });
}
