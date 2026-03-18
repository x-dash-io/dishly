import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../../constants/colors';
import { AppIcon } from '../../../constants/icons';
import { Skeleton } from '../../../components/ui/Skeleton';

export default function RecipeDetailPlaceholder() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <AppIcon name="back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </SafeAreaView>

      <View style={styles.content}>
        {/* Image Skeleton */}
        <Skeleton width="100%" height={250} borderRadius={0} />
        
        <View style={styles.body}>
          <Skeleton width="70%" height={28} style={{ marginBottom: 12 }} />
          <Skeleton width="40%" height={20} style={{ marginBottom: 24 }} />
          
          <Skeleton width="100%" height={100} style={{ marginBottom: 16 }} />
          <Skeleton width="100%" height={100} style={{ marginBottom: 16 }} />
          
          <View style={styles.placeholderContainer}>
            <Text style={styles.placeholderText}>Recipe detail — coming in Pack 03</Text>
            <Text style={styles.idText}>ID: {id}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
    zIndex: 10,
  },
  backButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  body: {
    padding: 20,
  },
  placeholderContainer: {
    marginTop: 40,
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.mahogany,
    textAlign: 'center',
  },
  idText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 8,
  },
});
