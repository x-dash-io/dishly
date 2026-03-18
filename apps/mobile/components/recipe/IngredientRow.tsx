import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { COLORS } from '@/constants/colors';
import { AppIcon } from '@/constants/icons';
import type { Ingredient } from '@dishly/types';

interface IngredientRowProps {
  ingredient: Ingredient;
  scaledQuantity: string;
  /** When provided, the row is tappable and shows a forward chevron hint */
  onPress?: () => void;
}

function IngredientRowComponent({ ingredient, scaledQuantity, onPress }: IngredientRowProps) {
  const inner = (
    <View style={styles.container}>
      <View style={styles.leftSide}>
        <View style={styles.bullet} />
        <View style={styles.textContainer}>
          <Text style={styles.name}>{ingredient.name}</Text>
          {ingredient.notes ? (
            <Text style={styles.notes}>{ingredient.notes}</Text>
          ) : null}
        </View>
      </View>
      <View style={styles.rightSide}>
        {scaledQuantity ? (
          <Text style={[styles.amount, { color: COLORS.primary }]}>
            {scaledQuantity}
          </Text>
        ) : null}
        {ingredient.unit ? (
          <Text style={styles.amount}> {ingredient.unit}</Text>
        ) : null}
        {onPress && (
          <View style={styles.chevron}>
            <AppIcon name="forward" size={13} color={COLORS.textMuted} />
          </View>
        )}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        android_ripple={{ color: COLORS.surfaceAlt }}
        style={({ pressed }) => pressed ? styles.pressed : undefined}
      >
        {inner}
      </Pressable>
    );
  }

  return inner;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  pressed: {
    opacity: 0.65,
  },
  leftSide: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingRight: 12,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
    marginTop: 8,
    marginRight: 12,
    flexShrink: 0,
  },
  textContainer: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    color: COLORS.textPrimary,
    lineHeight: 22,
  },
  notes: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  rightSide: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amount: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  chevron: {
    marginLeft: 6,
    opacity: 0.6,
  },
});

// Wrapped in React.memo for FlashList / scroll performance
export const IngredientRow = React.memo(IngredientRowComponent);
