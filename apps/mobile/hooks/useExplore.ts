import { useQuery } from '@tanstack/react-query';
import { useApiClient } from '../src/lib/api-client';
import type { RecipeCardItem } from '@dishly/types';

export interface ExploreFilters {
  cuisine?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  max_minutes?: number;
}

function buildQueryString(query: string, filters: ExploreFilters): string {
  const params = new URLSearchParams();
  if (query) params.append('q', query);
  if (filters.cuisine && filters.cuisine !== 'All') params.append('cuisine', filters.cuisine);
  if (filters.difficulty) params.append('difficulty', filters.difficulty);
  if (filters.max_minutes) params.append('max_minutes', filters.max_minutes.toString());
  return params.toString();
}

export function useRecipeSearch(query: string, filters: ExploreFilters) {
  const api = useApiClient();
  return useQuery({
    queryKey: ['search', query, filters],
    queryFn: () => 
      api.request<{ recipes: RecipeCardItem[] }>(
        'GET', 
        `/feed/explore?${buildQueryString(query, filters)}`
      ),
    enabled: query.length >= 2,
    staleTime: 1000 * 30,
  });
}

export function useTrendingFeed() {
  const api = useApiClient();
  return useQuery({
    queryKey: ['feed', 'trending'],
    queryFn: () => api.request<{ recipes: RecipeCardItem[] }>('GET', '/feed/trending'),
    staleTime: 1000 * 60 * 5,
  });
}
