import { useQueryClient } from '@tanstack/react-query';
import { useApiClient } from '../src/lib/api-client';
import type { FullRecipe } from '@dishly/types';

/**
 * Returns a prefetch function for a recipe.
 * Call it on long-press of a RecipeCard so data is warm by the time the user navigates.
 * Safe to call multiple times — React Query deduplicates in-flight fetches.
 */
export function usePrefetchRecipe() {
  const qc = useQueryClient();
  const api = useApiClient();

  return (recipeId: string) => {
    qc.prefetchQuery({
      queryKey: ['recipe', recipeId],
      queryFn: () => api.request<FullRecipe>('GET', `/recipes/${recipeId}`),
      staleTime: 1000 * 60 * 5, // don't refetch if already fresh
    });
  };
}
