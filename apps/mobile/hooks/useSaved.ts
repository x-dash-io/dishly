import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApiClient } from '../src/lib/api-client';
import type { RecipeCardItem, Collection } from '@dishly/types';

const SAVED_QK = (userId: string) => ['saved', userId] as const;
const COLLECTIONS_QK = ['collections', 'me'] as const;

// ── Saved Recipes ──────────────────────────────────────────────────────────

export function useSavedRecipes(userId: string) {
  const api = useApiClient();
  return useInfiniteQuery({
    queryKey: SAVED_QK(userId),
    queryFn: ({ pageParam }) => {
      const qs = pageParam ? `?cursor=${pageParam}` : '';
      return api.request<{ recipes: RecipeCardItem[]; items: RecipeCardItem[]; nextCursor?: string }>(
        'GET',
        `/users/${userId}/saved${qs}`
      );
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
    enabled: !!userId,
  });
}

export function useUnsaveRecipe() {
  const api = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (recipeId: string) =>
      api.request('POST', `/recipes/${recipeId}/save`, {}),
    onSuccess: () => {
      // Invalidate all saved queries — user id isn't known here
      qc.invalidateQueries({ queryKey: ['saved'] });
    },
  });
}

// ── Collections ────────────────────────────────────────────────────────────

export function useCollections() {
  const api = useApiClient();
  return useQuery({
    queryKey: COLLECTIONS_QK,
    queryFn: () => api.request<Collection[]>('GET', '/users/me/collections'),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 15,
  });
}

export function useCreateCollection() {
  const api = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; is_public: boolean }) =>
      api.request<Collection>('POST', '/users/me/collections', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: COLLECTIONS_QK }),
  });
}

export function useDeleteCollection() {
  const api = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (collectionId: string) =>
      api.request('DELETE', `/users/me/collections/${collectionId}`),
    onMutate: async (collectionId) => {
      await qc.cancelQueries({ queryKey: COLLECTIONS_QK });
      const prev = qc.getQueryData<Collection[]>(COLLECTIONS_QK);
      qc.setQueryData<Collection[]>(
        COLLECTIONS_QK,
        (old) => old?.filter(c => c.id !== collectionId) ?? []
      );
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(COLLECTIONS_QK, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: COLLECTIONS_QK }),
  });
}

export function useSaveToCollection() {
  const api = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ recipeId, collectionId }: { recipeId: string; collectionId: string }) =>
      api.request('POST', `/recipes/${recipeId}/save`, { collection_id: collectionId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['saved'] });
      qc.invalidateQueries({ queryKey: COLLECTIONS_QK });
    },
  });
}

export function useCollectionRecipes(collectionId: string) {
  const api = useApiClient();
  return useInfiniteQuery({
    queryKey: ['collection', collectionId, 'recipes'],
    queryFn: ({ pageParam }) => {
      const qs = pageParam ? `?cursor=${pageParam}` : '';
      return api.request<{ recipes: RecipeCardItem[]; nextCursor: string | null }>(
        'GET',
        `/users/me/collections/${collectionId}/recipes${qs}`
      );
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 1000 * 60 * 2,
    enabled: !!collectionId,
  });
}
