import { useInfiniteQuery } from '@tanstack/react-query';
import { useApiClient } from '../src/lib/api-client';
import type { RecipeCardItem } from '@dishly/types';

export type FeedType = 'forYou' | 'following' | 'trending';

// Trending is less volatile — keep it cached longer
const STALE_TIMES: Record<FeedType, number> = {
  forYou:    1000 * 60 * 2,   // 2 min — should feel live
  following: 1000 * 60 * 2,   // 2 min
  trending:  1000 * 60 * 5,   // 5 min — slower-moving list
};

// Keep all feed data for 10 min after tab becomes inactive
// so switching tabs is instant after first load
const GC_TIME = 1000 * 60 * 10;

export function useHomeFeed(type: FeedType = 'forYou') {
  const api = useApiClient();
  const endpoint = type === 'trending' ? '/feed/trending' : '/feed/home';

  return useInfiniteQuery({
    queryKey: ['feed', type],
    queryFn: ({ pageParam }) => {
      const qs = pageParam ? `?cursor=${pageParam}` : '';
      const url = type === 'trending' ? endpoint : `${endpoint}${qs}`;
      return api.request<{ recipes: RecipeCardItem[]; nextCursor: string | null }>('GET', url);
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: STALE_TIMES[type],
    gcTime: GC_TIME,
  });
}
