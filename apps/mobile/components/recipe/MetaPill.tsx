import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';
import { AppIcon, IconName } from '../../constants/icons';

interface MetaPillProps {
  icon: IconName;
  label: string;
  iconColor?: string;
}

function MetaPillComponent({ icon, label, iconColor }: MetaPillProps) {
  return (
    <View style={styles.container}>
      <AppIcon 
        name={icon} 
        size={16} 
        color={iconColor || COLORS.textSecondary} 
        strokeWidth={1.75} 
      />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  label: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginLeft: 6,
  },
});

// Wrapped in React.memo for FlashList / scroll performance
export const MetaPill = React.memo(MetaPillComponent);
