import { useInfiniteQuery } from '@tanstack/react-query';
import { useApiClient } from '../src/lib/api-client';
import type { RecipeCardItem } from '@dishly/types';

export type FeedType = 'forYou' | 'following' | 'trending';

export function useHomeFeed(type: FeedType = 'forYou') {
  const api = useApiClient();
  
  const endpoint = type === 'trending' ? '/feed/trending' : '/feed/home';
  // Note: For trending, we might want a simple useQuery if it's not paginated, 
  // but the user prompt implies useInfiniteQuery for all.
  // /feed/trending returns { recipes, cached } - might not be paginated in the same way.
  
  return useInfiniteQuery({
    queryKey: ['feed', type],
    queryFn: ({ pageParam }) => {
      const url = type === 'trending' 
        ? endpoint 
        : `${endpoint}${pageParam ? `?cursor=${pageParam}` : ''}`;
        
      return api.request<{ recipes: RecipeCardItem[]; nextCursor: string | null }>(
        'GET',
        url
      );
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 1000 * 60 * 2,   // 2 min — feed feels "live"
  });
}
