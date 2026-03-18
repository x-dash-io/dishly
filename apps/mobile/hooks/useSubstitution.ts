import { useMutation } from '@tanstack/react-query';
import { useApiClient } from '../src/lib/api-client';
import type { SubstitutionResult } from '@dishly/types';

export function useSubstitution() {
  const api = useApiClient();
  return useMutation({
    mutationFn: ({
      recipeId,
      ingredientName,
    }: {
      recipeId: string;
      ingredientName: string;
    }) =>
      api.request<SubstitutionResult>('POST', '/ai/substitutions', {
        recipe_id: recipeId,
        ingredient_name: ingredientName,
      }),
  });
}
