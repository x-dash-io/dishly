import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AppIcon } from '../../constants/icons';
import { COLORS } from '../../constants/colors';

interface WizardHeaderProps {
  step: 1 | 2 | 3 | 4 | 5;
  title: string;
  onBack: () => void;
}

export function WizardHeader({ step, title, onBack }: WizardHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <AppIcon name="back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.stepText}>Step {step} of 5</Text>
        <View style={styles.dotsRow}>
          {[1, 2, 3, 4, 5].map((s) => (
            <View 
              key={s} 
              style={[
                styles.dot, 
                s < step ? styles.dotCompleted : s === step ? styles.dotCurrent : null
              ]} 
            />
          ))}
        </View>
      </View>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.progressBg}>
        <View style={[styles.progressFill, { width: `${(step / 5) * 100}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    backgroundColor: COLORS.background,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backBtn: {
    padding: 8,
    marginLeft: -8,
  },
  stepText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.border,
  },
  dotCurrent: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  dotCompleted: {
    backgroundColor: COLORS.primary,
  },
  title: {
    fontFamily: 'Georgia',
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.mahogany, // mahogany
    marginBottom: 16,
  },
  progressBg: {
    height: 2,
    backgroundColor: COLORS.border,
    width: '100%',
  },
  progressFill: {
    height: 2,
    backgroundColor: COLORS.primary,
  },
});
