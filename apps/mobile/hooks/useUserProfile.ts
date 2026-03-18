import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { useApiClient } from '../src/lib/api-client';
import type { UserProfile, RecipeCardItem } from '@dishly/types';

export function useUserProfile(username: string | undefined) {
  const api = useApiClient();
  return useQuery({
    queryKey: ['user', username],
    queryFn: () => {
      if (!username) throw new Error('Username required');
      return api.request<UserProfile>('GET', `/users/${username}`);
    },
    enabled: !!username,
    staleTime: 1000 * 60 * 3,
  });
}

export function useFollowUser(userId: string, username?: string) {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.request<{ following: boolean }>('POST', `/users/${userId}/follow`),
    onMutate: async () => {
      if (!username) return;
      
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ['user', username] });

      // Snapshot the previous value
      const previousUser = queryClient.getQueryData<UserProfile>(['user', username]);

      // Optimistically update to the new value
      if (previousUser && previousUser.viewer) {
        queryClient.setQueryData<UserProfile>(['user', username], {
          ...previousUser,
          stats: {
            ...previousUser.stats,
            follower_count: previousUser.viewer.following 
              ? previousUser.stats.follower_count - 1 
              : previousUser.stats.follower_count + 1
          },
          viewer: {
            ...previousUser.viewer,
            following: !previousUser.viewer.following,
          },
        });
      }

      // Return a context object with the snapshotted value
      return { previousUser };
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousUser && username) {
        queryClient.setQueryData(['user', username], context.previousUser);
      }
    },
    onSettled: () => {
      // Always refetch after error or success to ensure data is correct
      if (username) {
        queryClient.invalidateQueries({ queryKey: ['user', username] });
      }
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });
}

export function useUserRecipes(username: string | undefined) {
  const api = useApiClient();
  
  return useInfiniteQuery({
    queryKey: ['userRecipes', username],
    queryFn: ({ pageParam }) => {
      const qs = pageParam ? `?cursor=${pageParam}` : '';
      return api.request<{ recipes: RecipeCardItem[]; nextCursor: string | null }>('GET', `/feed/user/${username}${qs}`);
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!username,
  });
}

export function useUserSavedRecipes(userId: string | undefined) {
  const api = useApiClient();
  
  return useInfiniteQuery({
    queryKey: ['userSavedRecipes', userId],
    queryFn: ({ pageParam }) => {
      const qs = pageParam ? `?cursor=${pageParam}` : '';
      return api.request<{ items: RecipeCardItem[]; nextCursor: string | null }>('GET', `/users/${userId}/saved${qs}`);
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!userId,
  });
}
