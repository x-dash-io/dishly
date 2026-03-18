import { useQuery } from '@tanstack/react-query';
import { useApiClient } from '../src/lib/api-client';
import type { FullRecipe } from '@dishly/types';

export function useRecipe(id: string) {
  const api = useApiClient();

  return useQuery({
    queryKey: ['recipe', id],
    queryFn: () => api.request<FullRecipe>('GET', `/recipes/${id}`),
    staleTime: 1000 * 60 * 5,
  });
}
