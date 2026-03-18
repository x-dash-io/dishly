import React, { useEffect } from 'react';
import { View, ViewStyle, StyleSheet, DimensionValue } from 'react-native';
import Animated, { 
  useSharedValue, 
  withRepeat, 
  withTiming, 
  useAnimatedStyle 
} from 'react-native-reanimated';
import { COLORS } from '../../constants/colors';

interface SkeletonProps {
  width: DimensionValue;
  height: DimensionValue;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width, height, borderRadius = 8, style }: SkeletonProps) {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.9, { duration: 800 }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          backgroundColor: COLORS.surfaceAlt,
        },
        style,
        animatedStyle,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  skeleton: {
    overflow: 'hidden',
  },
});
