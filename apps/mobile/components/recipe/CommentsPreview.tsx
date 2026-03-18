import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApiClient } from '../../src/lib/api-client';
import { COLORS } from '../../constants/colors';

// Types representing external API shapes
export interface RecipeComment {
  id: string;
  body: string;
  created_at: string;
  user: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
}

export interface CommentsResponse {
  comments: RecipeComment[];
  total: number;
}

export function CommentsPreview({ recipeId }: { recipeId: string }) {
  const api = useApiClient();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['comments', recipeId, 'preview'],
    queryFn: () => api.request<CommentsResponse>('GET', `/recipes/${recipeId}/comments?limit=3`),
  });

  const postComment = useMutation({
    mutationFn: (body: string) => 
      api.request('POST', `/recipes/${recipeId}/comments`, { body }),
    onMutate: async (body) => {
      await queryClient.cancelQueries({ queryKey: ['comments', recipeId, 'preview'] });
      
      const previous = queryClient.getQueryData<CommentsResponse>(['comments', recipeId, 'preview']);
      
      const fakeObj: RecipeComment = {
        id: Math.random().toString(),
        body,
        created_at: new Date().toISOString(),
        user: { id: 'me', username: 'you', display_name: 'You', avatar_url: null }
      };

      if (previous) {
        queryClient.setQueryData(['comments', recipeId, 'preview'], {
          ...previous,
          comments: [fakeObj, ...previous.comments],
          total: previous.total + 1,
        });
      }
      setNewComment('');
      return { previous };
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', recipeId] });
    }
  });

  const handleSubmit = () => {
    if (newComment.trim().length === 0) return;
    postComment.mutate(newComment.trim());
  };

  const timeAgo = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    return `${Math.floor(seconds / 86400)}d`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <View style={styles.avatarPlaceholder} />
        <TextInput
          style={styles.input}
          placeholder="Add a comment..."
          placeholderTextColor={COLORS.textMuted}
          value={newComment}
          onChangeText={setNewComment}
          onSubmitEditing={handleSubmit}
          returnKeyType="send"
        />
        {(postComment.isPending) && (
          <ActivityIndicator size="small" color={COLORS.primary} style={{ marginLeft: 8 }} />
        )}
      </View>

      {isLoading ? (
        <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: 20 }} />
      ) : (
        <View style={styles.list}>
          {data?.comments.map((comment: any) => (
            <View key={comment.id} style={styles.commentRow}>
              {comment.user.avatar_url ? (
                <Image source={{ uri: comment.user.avatar_url }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder} />
              )}
              <View style={styles.commentContent}>
                <Text style={styles.commentHeader}>
                  <Text style={styles.username}>{comment.user.username}</Text>{' '}
                  <Text style={styles.time}>{timeAgo(comment.created_at)}</Text>
                </Text>
                <Text style={styles.commentBody}>{comment.body}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {(data?.total && data.total > 0) ? (
        <TouchableOpacity 
          style={styles.viewAllButton}
          onPress={() => router.push(`/recipe/${recipeId}/comments`)}
        >
          <Text style={styles.viewAllText}>View all {data.total} comments</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  input: {
    flex: 1,
    height: 40,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    paddingHorizontal: 16,
    marginLeft: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.textPrimary,
  },
  list: {
    gap: 16,
  },
  commentRow: {
    flexDirection: 'row',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.border,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.border,
  },
  commentContent: {
    flex: 1,
    marginLeft: 12,
  },
  commentHeader: {
    marginBottom: 4,
  },
  username: {
    fontWeight: '700',
    color: COLORS.textPrimary,
    fontSize: 14,
  },
  time: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  commentBody: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  viewAllButton: {
    marginTop: 20,
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
  },
  viewAllText: {
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
});
