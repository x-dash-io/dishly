import React, { useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import BottomSheet, { BottomSheetScrollView, BottomSheetBackdrop, type BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { COLORS } from '@/constants/colors';
import { AppIcon } from '@/constants/icons';
import { Badge } from '@/components/ui/Badge';
import { useSubstitution } from '@/hooks/useSubstitution';
import type { Ingredient, SubstitutionResult } from '@dishly/types';

interface SubstitutionSheetProps {
  recipeId: string;
  ingredient: Ingredient | null;
  onClose: () => void;
}

export function SubstitutionSheet({ recipeId, ingredient, onClose }: SubstitutionSheetProps) {
  const sheetRef = useRef<BottomSheet>(null);
  const { mutate, isPending, data, reset } = useSubstitution();

  // Open/close sheet and trigger fetch when ingredient changes
  useEffect(() => {
    if (ingredient) {
      reset(); // clear previous result
      sheetRef.current?.snapToIndex(0);
      mutate({ recipeId, ingredientName: ingredient.name });
    } else {
      sheetRef.current?.close();
    }
  }, [ingredient, recipeId]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        onPress={onClose}
      />
    ),
    [onClose]
  );

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={['62%']}
      enablePanDownToClose
      onClose={onClose}
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.sheetBg}
      handleIndicatorStyle={styles.handle}
    >
      <BottomSheetScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.star}>★</Text>
          <Text style={styles.headerText} numberOfLines={2}>
            {isPending
              ? `Finding substitutes for\n"${ingredient?.name ?? ''}"`
              : `Substitutes for "${data?.original_ingredient ?? ingredient?.name ?? ''}"`}
          </Text>
        </View>

        {/* Loading */}
        {isPending && (
          <View style={styles.loadingBlock}>
            <ActivityIndicator color={COLORS.aiPurple} size="large" />
            <Text style={styles.loadingText}>Asking the AI chef…</Text>
          </View>
        )}

        {/* Results */}
        {data && !isPending && (
          <>
            <View style={styles.substituteList}>
              {data.substitutes.map((sub, i) => (
                <View
                  key={i}
                  style={[
                    styles.subCard,
                    {
                      borderLeftWidth: 3,
                      borderLeftColor: sub.works_well
                        ? COLORS.secondary
                        : COLORS.border,
                    },
                  ]}
                >
                  {/* Name + tick/tilde */}
                  <View style={styles.subCardHeader}>
                    <Text style={styles.subIcon}>
                      {sub.works_well ? '✓' : '~'}
                    </Text>
                    <Text
                      style={[
                        styles.subName,
                        { color: sub.works_well ? COLORS.secondary : COLORS.textSecondary },
                      ]}
                    >
                      {sub.name}
                    </Text>
                  </View>

                  {/* Ratio */}
                  <Text style={styles.subRatio}>{sub.ratio}</Text>

                  {/* Notes */}
                  <Text style={styles.subNotes}>{sub.notes}</Text>

                  {/* Dietary tags */}
                  {sub.dietary_tags && sub.dietary_tags.length > 0 && (
                    <View style={styles.tagRow}>
                      {sub.dietary_tags.map((tag, ti) => (
                        <Badge key={ti} variant="secondary" label={tag} size="sm" />
                      ))}
                    </View>
                  )}
                </View>
              ))}
            </View>

            {/* Chef tip */}
            {data.tip && (
              <View style={styles.tipCard}>
                <Text style={styles.tipIcon}>💡</Text>
                <Text style={styles.tipText}>{data.tip}</Text>
              </View>
            )}
          </>
        )}
      </BottomSheetScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sheetBg: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  handle: {
    backgroundColor: COLORS.border,
    width: 36,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingTop: 4,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: 16,
  },
  star: {
    fontSize: 18,
    color: COLORS.aiPurple,
    fontWeight: '700',
    marginTop: 1,
  },
  headerText: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.aiPurple,
    lineHeight: 24,
  },
  loadingBlock: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 14,
  },
  loadingText: {
    fontSize: 15,
    color: COLORS.aiPurple,
    fontStyle: 'italic',
  },
  substituteList: {
    gap: 12,
    marginBottom: 16,
  },
  subCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    gap: 6,
  },
  subCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  subIcon: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.secondary,
    width: 16,
  },
  subName: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  subRatio: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    marginLeft: 22,
  },
  subNotes: {
    fontSize: 14,
    color: COLORS.textPrimary,
    lineHeight: 21,
    marginLeft: 22,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginLeft: 22,
    marginTop: 2,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 12,
    padding: 14,
  },
  tipIcon: {
    fontSize: 18,
    marginTop: 1,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
    lineHeight: 21,
  },
});
