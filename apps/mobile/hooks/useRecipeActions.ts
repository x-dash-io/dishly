import { useMutation, useQueryClient, InfiniteData } from '@tanstack/react-query';
import { useApiClient } from '../src/lib/api-client';
import type { RecipeCardItem } from '@dishly/types';

interface FeedPage {
  recipes: RecipeCardItem[];
  nextCursor: string | null;
}

export function useLikeRecipe(recipeId: string) {
  const queryClient = useQueryClient();
  const api = useApiClient();

  return useMutation({
    mutationFn: () => api.post(`/recipes/${recipeId}/like`, {}),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['feed'] });
      
      const previousFeeds = queryClient.getQueriesData<InfiniteData<FeedPage>>({ queryKey: ['feed'] });

      queryClient.setQueriesData<InfiniteData<FeedPage>>({ queryKey: ['feed'] }, (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          pages: oldData.pages.map(page => ({
            ...page,
            recipes: page.recipes.map(recipe => {
              if (recipe.id === recipeId) {
                const liked = !recipe.viewer?.liked;
                return {
                  ...recipe,
                  like_count: liked ? recipe.like_count + 1 : recipe.like_count - 1,
                  viewer: recipe.viewer ? { ...recipe.viewer, liked } : { liked, saved: false },
                };
              }
              return recipe;
            }),
          })),
        };
      });

      return { previousFeeds };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousFeeds) {
        context.previousFeeds.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['recipe', recipeId] });
      // Also invalidate feeds to be sure, although optimistic update handles it visually
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}

export function useSaveRecipe(recipeId: string) {
  const queryClient = useQueryClient();
  const api = useApiClient();

  return useMutation({
    mutationFn: () => api.post(`/recipes/${recipeId}/save`, {}),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['feed'] });
      
      const previousFeeds = queryClient.getQueriesData<InfiniteData<FeedPage>>({ queryKey: ['feed'] });

      queryClient.setQueriesData<InfiniteData<FeedPage>>({ queryKey: ['feed'] }, (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          pages: oldData.pages.map(page => ({
            ...page,
            recipes: page.recipes.map(recipe => {
              if (recipe.id === recipeId) {
                const saved = !recipe.viewer?.saved;
                return {
                  ...recipe,
                  save_count: saved ? recipe.save_count + 1 : recipe.save_count - 1,
                  viewer: recipe.viewer ? { ...recipe.viewer, saved } : { liked: false, saved },
                };
              }
              return recipe;
            }),
          })),
        };
      });

      return { previousFeeds };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousFeeds) {
        context.previousFeeds.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['recipe', recipeId] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}
