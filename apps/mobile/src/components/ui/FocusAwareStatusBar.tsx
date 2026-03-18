import * as React from 'react';
import { StatusBar, StatusBarProps } from 'expo-status-bar';
import { useIsFocused } from '@react-navigation/native';
import { Platform } from 'react-native';

export function FocusAwareStatusBar(props: StatusBarProps) {
  const isFocused = useIsFocused();

  // For modern "Rich" apps, translucent: true is the most reliable way 
  // to have the status bar match the screen background color seamlessly.
  const defaultProps: StatusBarProps = {
    translucent: true,
    backgroundColor: 'transparent',
    ...props
  };

  return isFocused ? <StatusBar {...defaultProps} /> : null;
}
