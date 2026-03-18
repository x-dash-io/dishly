import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';
import type { Ingredient } from '@dishly/types';

interface IngredientRowProps {
  ingredient: Ingredient;
  scaledQuantity: string;
}

export function IngredientRow({ ingredient, scaledQuantity }: IngredientRowProps) {
  return (
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
      </View>
    </View>
  );
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
  leftSide: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingRight: 16,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.textMuted,
    marginTop: 8,
    marginRight: 12,
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
    alignItems: 'baseline',
  },
  amount: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
});
