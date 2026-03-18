import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApiClient } from '@/src/lib/api-client';
import { COLORS } from '@/constants/colors';
import { AppIcon } from '@/constants/icons';
import type { CommentsResponse, RecipeComment } from '@/components/recipe/CommentsPreview';

export default function RecipeCommentsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const api = useApiClient();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const [newComment, setNewComment] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['comments', id],
    queryFn: () => api.request<CommentsResponse>('GET', `/recipes/${id}/comments`),
  });

  const postComment = useMutation({
    mutationFn: (body: string) =>
      api.request('POST', `/recipes/${id}/comments`, { body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', id] });
      queryClient.invalidateQueries({ queryKey: ['comments', id, 'preview'] });
      setNewComment('');
    },
  });

  const handleSubmit = () => {
    if (newComment.trim().length === 0) return;
    postComment.mutate(newComment.trim());
  };

  const renderItem = ({ item }: { item: RecipeComment }) => (
    <View style={styles.commentRow}>
      {item.user.avatar_url ? (
        <Image source={{ uri: item.user.avatar_url }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarInitial}>
            {item.user.display_name?.charAt(0).toUpperCase() ?? '?'}
          </Text>
        </View>
      )}
      <View style={styles.commentContent}>
        <View style={styles.commentHeader}>
          <Text style={styles.username}>{item.user.username}</Text>
          <Text style={styles.time}>{new Date(item.created_at).toLocaleDateString()}</Text>
        </View>
        <Text style={styles.commentBody}>{item.body}</Text>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="light" translucent={false} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <AppIcon name="back" size={24} color={COLORS.textInverse} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Comments</Text>
        <View style={styles.backBtn} />
      </View>

      {/* List — using FlatList instead of FlashList to avoid estimatedItemSize TS issues */}
      <View style={styles.listContainer}>
        {isLoading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
        ) : (
          <FlatList<RecipeComment>
            data={data?.comments ?? []}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listPadding}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                No comments yet. Be the first to start the conversation!
              </Text>
            }
          />
        )}
      </View>

      {/* Input */}
      <View style={[styles.inputWrapper, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <TextInput
          style={styles.input}
          placeholder="Add a comment…"
          placeholderTextColor={COLORS.textMuted}
          value={newComment}
          onChangeText={setNewComment}
          multiline
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!newComment.trim() || postComment.isPending) && styles.sendButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!newComment.trim() || postComment.isPending}
          activeOpacity={0.8}
        >
          {postComment.isPending ? (
            <ActivityIndicator size="small" color={COLORS.textInverse} />
          ) : (
            <AppIcon name="send" size={18} color={COLORS.textInverse} />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.navDark,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  backBtn: {
    padding: 8,
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textInverse,
  },
  listContainer: {
    flex: 1,
  },
  loader: {
    marginTop: 40,
  },
  listPadding: {
    padding: 20,
    paddingBottom: 32,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 14,
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    marginTop: 40,
    fontSize: 14,
    lineHeight: 22,
  },
  commentRow: {
    flexDirection: 'row',
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  avatarPlaceholder: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textInverse,
  },
  commentContent: {
    flex: 1,
    marginLeft: 12,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    color: COLORS.textPrimary,
    fontSize: 15,
    lineHeight: 22,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    backgroundColor: COLORS.background,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.border,
  },
});
