import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { COLORS } from '@/constants/colors';
import { AppIcon } from '@/constants/icons';
import type { Step } from '@dishly/types';

interface StepCardProps {
  recipeId: string;
  step: Step;
  index: number;
}

export function StepCard({ recipeId, step, index }: StepCardProps) {
  const router = useRouter();

  const handleStartTimer = () => {
    // Navigate to cook mode, passing the step index
    // e.g. /cook/[recipeId]?step=index
    router.push(`/cook/${recipeId}?step=${index}`);
  };

  const formatTimer = (seconds: number) => {
    if (seconds >= 60) {
      return `${Math.round(seconds / 60)} min`;
    }
    return `${seconds}s`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.numberBadge}>
          <Text style={styles.numberText}>{index + 1}</Text>
        </View>
        
        <View style={styles.contentContainer}>
          <Text style={styles.instruction}>{step.instruction}</Text>
          
          {step.timerSeconds ? (
            <TouchableOpacity 
              style={styles.timerBadge} 
              onPress={handleStartTimer}
              activeOpacity={0.7}
            >
              <AppIcon name="timer" size={14} color={COLORS.textPrimary} />
              <Text style={styles.timerText}>{formatTimer(step.timerSeconds)}</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {step.imageUrl ? (
          <Image 
            source={{ uri: step.imageUrl }} 
            style={styles.stepImage}
            contentFit="cover"
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  numberBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    flexShrink: 0,
  },
  numberText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
  },
  contentContainer: {
    flex: 1,
    marginRight: 12,
  },
  instruction: {
    fontSize: 16,
    color: COLORS.textPrimary,
    lineHeight: 24,
    marginBottom: 12,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: COLORS.background,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 6,
  },
  timerText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  stepImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    flexShrink: 0,
  },
});
